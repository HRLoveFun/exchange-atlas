#!/usr/bin/env python3
"""tools/verify_quotes.py — verbatim-quote 反查（防幻觉铁律的机器化执行）

CLAUDE.md 二.5 规定：confidence:high 字段的 quote 必须是原文照抄，且 zh/en 里的
数字要能在 quote 里找到。本脚本把这条"可溯源"要求机器化：对全库每个
confidence:high 且带 quote 的字段，检查其 quote（去掉 HTML 标签、折叠空白、转小写后）
是否作为连续子串出现在所引用来源的文本里。

证据来源：
  - 默认（离线）：只查 `.cache/<id>/_manifest.json` 里登记、且实际落盘的那些 URL 对应
    文件（.pdf 用 `.pdf.txt` 伴随文本）。即只对"用 make fetch 真正抓过、且字段引用的正
    是那份来源"的字段做核实——没抓过的来源一律记为 CACHE_MISS，不误判为 FAIL。
  - --live：额外现场抓取 sources 里登记的每个 URL（PDF 走 pdftotext），结果缓存于
    /tmp/verify_quotes_urltext.json。JS 渲染页 curl 拿不到正文会记为 LIVE_ERR（检查器
    局限，非数据缺陷）。

判定：
  OK          quote 在引用的某份来源正文里找到连续窗口
  FAIL        引用的来源正文可取到，但 quote 任何连续窗口都找不到 —— 疑似改写/编造，须修
  CACHE_MISS  离线模式下该字段引用的来源未落盘 .cache，无法本地核实（信息性，不致命）
  LIVE_ERR    --live 下抓取失败（被拦/超时/JS 壳），无法核实（信息性，不致命）

退出码：仅当存在 FAIL 时非零（即 `make check` 会因真正的 hallucination 失配而变红）；
CACHE_MISS / LIVE_ERR 只打印统计，不阻断构建。--strict 可让 CACHE_MISS 也按 FAIL 计。

用法：
  python3 tools/verify_quotes.py                 # 离线，全库
  python3 tools/verify_quotes.py --live          # 含现场抓取
  python3 tools/verify_quotes.py --ex hk-hkex    # 只看一家
  python3 tools/verify_quotes.py --strict        # CACHE_MISS 也按 FAIL 计
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
URLTEXT_CACHE = Path(tempfile.gettempdir()) / "verify_quotes_urltext.json"

sys.path.insert(0, str(ROOT / "tools"))
import data_files
import sync  # noqa: E402  —— 复用 expand_exchange，让本脚本看到的 confidence/sources
              #    与 validate.py 一致（含 _meta 级联），否则靠章节级 _meta.sources
              #    的字段会被误判为"无来源"（CACHE_MISS）。

WINDOW = 14          # 要求 quote 里至少存在这么长的连续窗口出现在来源中
MIN_WIN = 8          # 短 quote 整体匹配的最小长度下限


def norm(s):
    """去 HTML 标签 + 折叠空白 + 转小写，作为可比对规范文本。"""
    if not isinstance(s, str):
        s = str(s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", "", s)
    return s.lower()


def file_text(p):
    """把各类落盘来源文件转成可比对规范文本：PDF/HTML/.docx/.xlsx/.xls。"""
    import io
    import zipfile
    try:
        b = open(p, "rb").read()
    except Exception:
        return ""
    head = b[:4]
    low = str(p).lower()
    if head.startswith(b"%PDF") or low.endswith(".pdf"):
        t = p.with_suffix(".txt")
        if t.exists():
            return norm(open(t, encoding="utf-8", errors="ignore").read())
        try:
            out = subprocess.run(["pdftotext", "-layout", str(p), "-"],
                                 capture_output=True, text=True).stdout
            return norm(out)
        except Exception:
            return ""
    if head.startswith(b"PK"):
        try:
            z = zipfile.ZipFile(io.BytesIO(b))
        except Exception:
            return norm(open(p, encoding="utf-8", errors="ignore").read())
        names = z.namelist()
        if "word/document.xml" in names:
            xml = z.read("word/document.xml").decode("utf-8", "ignore")
            return norm(xml)
        if any(n.startswith("xl/") for n in names):
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True,
                                            read_only=True)
                cells = []
                for ws in wb.worksheets:
                    for row in ws.iter_rows(values_only=True):
                        for c in row:
                            if c is not None:
                                cells.append(str(c))
                return norm(" ".join(cells))
            except Exception:
                return ""
    if low.endswith(".xls"):  # 旧版 OLE 格式
        try:
            import pandas as pd
            df = pd.read_excel(io.BytesIO(b), sheet_name=None)
            cells = []
            for v in df.values():
                for row in v.itertuples(index=False):
                    for c in row:
                        if c is not None:
                            cells.append(str(c))
            return norm(" ".join(cells))
        except Exception:
            return ""
    return norm(open(p, encoding="utf-8", errors="ignore").read())


def manifest_map(ex):
    """返回 {url: (规范正文文本, via)}（仅含实际落盘、且抓取本身成功的来源）。

    ⚠️ `ok` 必须为 True 才收——`fetch_sources.py` 对抓取失败（403/404/拦截页）也会把响应
    体落盘、manifest 里标 `ok: false`（保留失败痕迹供排查）。这类文件不是"真正抓到的原文"，
    若混进这里，quote 反查会拿一段 403 错误页/Cloudflare 拦截页当来源正文比对，把本该是
    信息性的 CACHE_MISS 错判成阻断构建的 FAIL——PROJECT/SOURCES.md「fetch_sources 全量
    重跑会用抓取失败页覆盖已有好缓存」记的就是这个坑，这里在消费侧堵上（[ADR-075]）。

    `via` 保留给调用方区分 "live"（当次直连拿到）vs "wayback"（历史快照，见 tools/fetch.py
    的 wayback_snapshot）——wayback 快照可能明显滞后于当次数据录入时的官网原文（实测
    za-jse 一处仅有 2020 年快照、现网早已改版），拿它证明 quote "存在"合理，拿它证明 quote
    "不存在/编造"不合理，调用方据此把 wayback-only 未命中降级为 CACHE_MISS 而非 FAIL。
    """
    mfile = CACHE / ex / "_manifest.json"
    out = {}
    if not mfile.exists():
        return out
    try:
        man = json.load(open(mfile, encoding="utf-8"))
    except Exception:
        return out
    for item in man:
        url = item.get("url")
        f = item.get("file")
        if not url or not f or not item.get("ok"):
            continue
        p = ROOT / f
        if not p.exists():
            continue
        out[url] = (file_text(p), item.get("via") or "live")
    return out


def fetch_text(url):
    """抓取 URL 正文：PDF 用 pdftotext，HTML 直接取。结果走 URLTEXT_CACHE。"""
    cache = {}
    if URLTEXT_CACHE.exists():
        try:
            cache = json.load(open(URLTEXT_CACHE))
        except Exception:
            cache = {}
    if url in cache:
        return cache[url]
    try:
        import requests
        r = requests.get(url, timeout=20, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/124 Safari/537.36"})
        if r.status_code != 200:
            cache[url] = ""; json.dump(cache, open(URLTEXT_CACHE, "w")); return ""
        raw = r.content
    except Exception:
        cache[url] = ""; json.dump(cache, open(URLTEXT_CACHE, "w")); return ""
    if url.lower().split("?")[0].endswith(".pdf"):
        try:
            import tempfile as _t
            p = _t.NamedTemporaryFile(suffix=".pdf", delete=False)
            p.write(raw); p.close()
            txt = subprocess.run(["pdftotext", "-layout", p.name, "-"],
                                 capture_output=True, text=True).stdout
            os.unlink(p.name)
            text = norm(txt)
        except Exception:
            text = ""
    else:
        text = norm(raw.decode("utf-8", "ignore"))
    cache[url] = text
    json.dump(cache, open(URLTEXT_CACHE, "w"))
    return text


def quote_in(target, sources):
    """target 规范 quote 是否在某份来源正文里找到连续窗口。"""
    if not target:
        return False
    if len(target) >= WINDOW:
        for s in range(0, len(target) - WINDOW + 1, 7):
            w = target[s:s + WINDOW]
            if len(w) >= MIN_WIN and any(w in jt for jt in sources if jt):
                return True
        return False
    return any(target in jt for jt in sources if jt)


def walk(o, path):
    """递归产出 (path, node)，其中 node 为 confidence:high 且带 quote 的字段。
    在 expand_exchange 展开后的数据上跑——`_meta` 已被级联进各叶子，跳过它本身。"""
    if isinstance(o, dict):
        if o.get("confidence") == "high" and o.get("quote"):
            yield path, o
        for k, v in o.items():
            if k == "_meta":
                continue
            yield from walk(v, f"{path}.{k}" if path else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from walk(v, f"{path}[{i}]")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true", help="含现场抓取 sources URL")
    ap.add_argument("--ex", default=None, help="只看某交易所 id")
    ap.add_argument("--strict", action="store_true", help="CACHE_MISS 也按 FAIL 计")
    args = ap.parse_args()

    exs = [args.ex] if args.ex else data_files.exchange_ids()
    taxonomy = sync.load_all()[0]

    fails, cache_miss, live_err, oks = [], [], [], []
    for ex in exs:
        raw = data_files.load_exchange(ex)
        d = sync.expand_exchange(taxonomy, raw).get("chapters", {})
        mmap = manifest_map(ex)  # url -> (规范正文, via)
        for path, node in walk(d, ""):
            q = norm(node.get("quote", ""))
            if not q:
                continue
            urls = [u.get("url") if isinstance(u, dict) else u
                    for u in (node.get("sources") or [])]
            urls = [u for u in urls if u]
            if not urls:
                cache_miss.append((ex, path, [])); continue

            if args.live:
                live_srcs = [(u, fetch_text(u)) for u in urls]
                if any(quote_in(q, [t]) and t for _, t in live_srcs):
                    oks.append((ex, path)); continue
                if all(t == "" for _, t in live_srcs):
                    live_err.append((ex, path, urls))
                else:
                    fails.append((ex, path, urls))
                continue

            # 离线：只查 manifest 中实际落盘的来源
            cached = [(u, *mmap[u]) for u in urls if u in mmap]  # (url, text, via)
            uncached = [u for u in urls if u not in mmap]
            if not cached:
                cache_miss.append((ex, path, urls)); continue
            if quote_in(q, [t for _, t, _ in cached]):
                oks.append((ex, path))
                continue
            # 未命中：只有当"当次直连"（非 wayback）的来源也确认没有 quote 才算实锤 FAIL；
            # 若命中集合里只有 wayback 历史快照，快照可能明显滞后于数据录入时的官网原文
            # （见 manifest_map 说明），不能拿它证明 quote 是编的，降级为 CACHE_MISS。
            live_cached = [c for c in cached if c[2] != "wayback"]
            if uncached or not live_cached:
                cache_miss.append((ex, path, urls))
            else:
                fails.append((ex, path, urls))

    print(f"[verify_quotes] OK={len(oks)}  FAIL={len(fails)}  "
          f"CACHE_MISS={len(cache_miss)}  LIVE_ERR={len(live_err)}")
    if cache_miss:
        print("\n-- CACHE_MISS（引用来源未落盘 .cache，信息性）--")
        for ex, path, urls in cache_miss[:200]:
            print(f"  {ex} {path}  <- {urls[0] if urls else '(no sources)'}")
    if live_err:
        print("\n-- LIVE_ERR（抓取失败/JS 壳，信息性）--")
        for ex, path, urls in live_err[:200]:
            print(f"  {ex} {path}  <- {urls[0] if urls else ''}")
    if fails:
        print("\n-- FAIL（quote 未在引用来源正文找到，疑似改写/编造，须修）--")
        for ex, path, urls in fails:
            print(f"  {ex} {path}  <- {urls[0] if urls else '(no sources)'}")

    real_fail = fails[:]
    if args.strict:
        real_fail += cache_miss
    sys.exit(1 if real_fail else 0)


if __name__ == "__main__":
    main()
