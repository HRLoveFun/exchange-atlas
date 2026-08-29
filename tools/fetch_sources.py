#!/usr/bin/env python3
"""tools/fetch_sources.py — 把数据里实际引用到的 sources URL 全部落盘 .cache/

与 tools/fetch.py 不同：fetch.py 只抓 PROJECT/SOURCES.md 登记的那批 URL；本脚本收割
data/exchanges/*.yml 里每个字段 sources[] 实际引用的 URL（即"数据真正引用了哪些来源"），
逐个抓到 .cache/<id>/ 并更新 _manifest.json，使 tools/verify_quotes.py 的离线反查能覆盖到
它们（CACHE_MISS → OK / 暴露真实 FAIL）。

- 已存在于 _manifest.json 且文件仍在的 URL 跳过（不重复抓）。
- sec.gov 等 .gov 用 Fair Access 格式 UA（"机构标识 邮箱"）绕过限流；其余用常规浏览器 UA。
- PDF 落盘后额外用 pdftotext 生成 .pdf.txt 伴随文本，供 verify_quotes 比对。
- 多线程抓取（--workers，默认 16）。失败只打印统计，不阻断。

用法：
  python3 tools/fetch_sources.py                 # 全库
  python3 tools/fetch_sources.py --ex us-nyse    # 只看一家
  python3 tools/fetch_sources.py --workers 24
"""
import argparse
import datetime
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
from pathlib import Path
from urllib.parse import urlparse

import yaml

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
DATA = ROOT / "data" / "exchanges"

BROWSER_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124 Safari/537.36")
FAIR_UA = "exchange-atlas research@example.org"  # sec.gov Fair Access 格式


def slugify(url: str) -> str:
    h = hashlib.sha1(url.encode()).hexdigest()[:10]
    tail = re.sub(r"[^a-zA-Z0-9]+", "-", url.split("//", 1)[-1]).strip("-")[-40:]
    return f"{tail}-{h}"


def cited_urls(ex):
    d = yaml.safe_load(open(DATA / f"{ex}.yml", encoding="utf-8"))
    out = []
    seen = set()

    def walk(o):
        if isinstance(o, dict):
            for u in (o.get("sources") or []):
                # 标准写法是 {title,url,accessed}；个别数据用过裸 URL 字符串
                # （br-b3 曾有 34 处，已在 A2 统一转成字典）——两种都收，别漏抓。
                url = u.get("url") if isinstance(u, dict) else (u if isinstance(u, str) else None)
                if url and url not in seen:
                    seen.add(url); out.append(url)
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(d)
    return out


def load_manifest(ex):
    mf = CACHE / ex / "_manifest.json"
    if mf.exists():
        try:
            return json.load(open(mf, encoding="utf-8"))
        except Exception:
            return []
    return []


def save_manifest(ex, man):
    (CACHE / ex).mkdir(parents=True, exist_ok=True)
    json.dump(man, open(CACHE / ex / "_manifest.json", "w"),
              ensure_ascii=False, indent=2)


def fetch_url(url):
    ua = FAIR_UA if ".gov" in urlparse(url).netloc else BROWSER_UA
    try:
        import requests
        r = requests.get(url, timeout=30, headers={"User-Agent": ua}, verify=False)
        status = r.status_code
        raw = r.content
    except Exception as e:
        return None, f"ERR:{e}", b""
    # 按实际内容类型定扩展名（很多资源 URL 无扩展，但返回 PDF/Office）
    ctype = (r.headers.get("Content-Type") or "").lower()
    if "pdf" in ctype or raw[:4] == b"%PDF":
        ext = ".pdf"
    elif "word" in ctype or raw[:2] == b"PK" and b"word/" in raw[:1024]:
        ext = ".docx"
    elif "excel" in ctype or "spreadsheet" in ctype or (
            raw[:2] == b"PK" and b"xl/" in raw[:1024]):
        ext = ".xlsx"
    elif url.lower().split("?")[0].endswith(".pdf"):
        ext = ".pdf"
    else:
        ext = ".html"
    return status, ("OK" if str(status).startswith("2") else str(status)), raw, ext


def doc_companion(dest):
    """为 Office 文档生成 .txt 伴随文本（供 verify_quotes 比对）。"""
    import io, zipfile
    low = str(dest).lower()
    try:
        b = open(dest, "rb").read()
    except Exception:
        return
    if low.endswith(".pdf"):
        try:
            txt = subprocess.run(["pdftotext", "-layout", str(dest), "-"],
                                 capture_output=True, text=True).stdout
            dest.with_suffix(".txt").write_text(txt, encoding="utf-8")
        except Exception:
            pass
    elif low.endswith(".docx") and b[:2] == b"PK":
        try:
            z = zipfile.ZipFile(io.BytesIO(b))
            if "word/document.xml" in z.namelist():
                xml = z.read("word/document.xml").decode("utf-8", "ignore")
                dest.with_suffix(".txt").write_text(
                    re.sub(r"<[^>]+>", " ", xml), encoding="utf-8")
        except Exception:
            pass
    elif low.endswith(".xlsx") and b[:2] == b"PK":
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
            dest.with_suffix(".txt").write_text(" ".join(cells), encoding="utf-8")
        except Exception:
            pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ex", default=None)
    ap.add_argument("--workers", type=int, default=16)
    args = ap.parse_args()

    exs = [args.ex] if args.ex else sorted(p.name[:-4] for p in DATA.glob("*.yml"))

    # 收集任务
    tasks = []  # (ex, url)
    for ex in exs:
        man = load_manifest(ex)
        cached = {it.get("url") for it in man if it.get("url") and it.get("file")
                  and (ROOT / it["file"]).exists()}
        for url in cited_urls(ex):
            if url in cached:
                continue
            tasks.append((ex, url))

    print(f"[fetch_sources] 待抓取 {len(tasks)} 个 URL（共 {len(exs)} 家）")
    lock = threading.Lock()
    stats = {"ok": 0, "fail": 0}
    man_cache = {}

    def worker(ex, url):
        res = fetch_url(url)
        if len(res) == 3:
            status, label, raw = res
            ext = ".pdf" if url.lower().split("?")[0].endswith(".pdf") else ".html"
        else:
            status, label, raw, ext = res
        with lock:
            if status is None:
                stats["fail"] += 1
                print(f"  FAIL {label}  {url}")
                return
            dest_dir = CACHE / ex
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / (slugify(url) + ext)
            dest.write_bytes(raw)
            size = dest.stat().st_size
            doc_companion(dest)
            man = man_cache.get(ex)
            if man is None:
                man = load_manifest(ex); man_cache[ex] = man
            man = [it for it in man if it.get("url") != url]
            man.append({"url": url, "http_status": str(status), "ok": str(status).startswith("2"),
                        "size": size, "file": str(dest.relative_to(ROOT)),
                        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")})
            man_cache[ex] = man
            if str(status).startswith("2"):
                stats["ok"] += 1
            else:
                stats["fail"] += 1
                print(f"  FAIL {label} {size}B  {url}")

    # 简单线程池
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=args.workers) as ex_:
        list(ex_.map(lambda t: worker(*t), tasks))

    for ex, man in man_cache.items():
        save_manifest(ex, man)
    print(f"[fetch_sources] 完成：OK={stats['ok']}  FAIL={stats['fail']}")


if __name__ == "__main__":
    main()
