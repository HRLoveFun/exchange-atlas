#!/usr/bin/env python3
"""tools/fetch.py — 按 PROJECT/SOURCES.md 登记的方式抓取交易所官方页面到 .cache/

用法: python3 tools/fetch.py <exchange-id>   （或 make fetch EX=<exchange-id>）

为什么不用 WebFetch：探针实测 WebFetch 对 SSE / JPX 的规则页返回 403，换常规浏览器 UA
的 curl 可以过。见 CLAUDE.md 二、PROJECT/SOURCES.md 底部「探测记录」。

见 CLAUDE.md 二：数据不得凭记忆填写，必须来自本脚本抓取并落盘在 .cache/ 的原始页——
那是「这条数据不是编的」的可核查凭据。

## OTP 来源登记格式（2026-09-04 新增，见 [ADR-070]）

部分站点（典型如 KRX 数据门户 `data.krx.co.kr`、指数子站 `eindex.krx.co.kr`）没有可
直接 curl 的静态正文——真实数据靠站内 JS 先 GET 一个 `GenerateOTP` 端点换一次性 code，
再带 code POST 到数据端点取 JSON。SOURCES.md 里这类来源登记为单独一行、行内含
`[OTP]` 标记、依次给出两个 URL（**顺序固定**：第一个是换 code 的 GenerateOTP 端点，
第二个是数据端点）：

    - KRX 指数系列表 [OTP]: https://eindex.krx.co.kr/contents/COM/GenerateOTP.jspx?bld=IDXE/03/0304/0304/mkd03040000&name=form https://eindex.krx.co.kr/contents/IDXE/99/IDXE99000001.jspx

本脚本据此自动跑两步（`fetch_otp`），不再当成两条普通 URL 各自 curl。

⚠️ 已验证（2026-09-04）：GenerateOTP 换 code 这步在数据中心 IP 下能通、返回真 token；
但带 code 的数据端点对数据中心 IP 一律拒绝（`data.krx.co.kr` 返回字面量 `LOGOUT`、
`eindex.krx.co.kr` 302 跳转到 `SiteSearch.jsp`）——是 KRX 对云出口 IP 的封锁，不是本
脚本逻辑错误。住宅 IP 下预期能走通；数据中心环境抓不到就是 CLAUDE.md 三的降级触发点
（人工提供页面），不要因为这一步过不去就凭记忆填数据。见 PROJECT/SOURCES.md 对应记录。

## wayback 回退（2026-09-04 新增，见 [ADR-070]）

官网直连被拦（403 / Cloudflare 拦截页，典型如 `jse.co.za`）时，自动去 web.archive.org
查最近一次 HTTP 200 快照重试（`wayback_snapshot`），成功则 manifest 里该条 `via` 记
`"wayback"`——**不是新的信源，是同一份官方原文的历史快照**，`confidence` 判定不因此
改变；但一份内容若线上版本与快照版本之间可能已修订，引用时留意 PROJECT/SOURCES.md
「XXXX年修订」式文档的教训（新旧版本可能不一致）。查不到快照或快照也失败，正常记
FAIL，不会静默吞掉。
"""
import datetime
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
SOURCES_MD = ROOT / "PROJECT" / "SOURCES.md"
CACHE_DIR = ROOT / ".cache"

# 常规浏览器 UA —— 探针证实这是让多数交易所官网放行的关键（对比 WebFetch 的 403）
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")


# SOURCES.md 里 URL 后面常紧跟不带空格的批注，如
# `https://example.com/page（HTTP 200，194KB）`。不能简单把全角括号整体排除掉——
# mgzq.com 那条来源的 URL 本身就含中文文件名「...交易规则（2023年修订）.pdf」，
# 全角括号是 URL 合法的一部分。真正的区分特征是批注固定以「（HTTP」开头，
# 用 TRAILING_ANNOTATION_RE 单独把这段尾巴切掉，不改动 URL 主体的字符集。
URL_RE = re.compile(r"https?://[^\s)\]]+")
TRAILING_ANNOTATION_RE = re.compile(r"（HTTP.*$")
HEADING_RE = re.compile(r"^###\s.*`([a-z]{2}-[a-z0-9]+)`\s*$")
OTP_LINE_RE = re.compile(r"^\s*-.*\[OTP\].*$", re.M)
# 官网拦截页 / KRX 数据端点对数据中心 IP 的字面量拒绝——HTTP 200 但正文不是真内容，
# 不能当成功缓存下来（PROJECT/SOURCES.md 记过的坑：坏正文覆盖好缓存）。
BLOCK_SNIFF_RE = re.compile(r"cloudflare|Access Denied|Attention Required|Just a moment", re.I)


def extract_section(exchange_id: str) -> str:
    """从 SOURCES.md 里摘出 `<exchange-id>` 对应的整节文本（到下一个 ### 标题为止）。"""
    lines = SOURCES_MD.read_text(encoding="utf-8").splitlines()
    start = None
    for i, line in enumerate(lines):
        m = HEADING_RE.match(line.strip())
        if m and m.group(1) == exchange_id:
            start = i
            break
    if start is None:
        sys.exit(
            f"[fetch] 错误：PROJECT/SOURCES.md 里没有标题包含 `{exchange_id}` 的章节。\n"
            f"        先在 SOURCES.md 按条目格式登记该所的资料来源，再抓取。"
        )
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if lines[j].startswith("### "):
            end = j
            break
    return "\n".join(lines[start:end])


def extract_otp_pairs(section: str):
    """挑出含 `[OTP]` 标记的登记行，每行前两个 URL 依次是 (换 code 的 GenerateOTP 端点,
    带 code 提交的数据端点)——顺序是登记约定，见文首「OTP 来源登记格式」。一行 URL 数
    不是 2 个视为登记格式错误，直接报错退出（而不是当普通 URL 各自 curl 一遍——那样
    GenerateOTP 端点会被误当成一条独立来源抓取，产出一个没意义的 token 文件）。
    """
    pairs = []
    for line in OTP_LINE_RE.findall(section):
        urls = [TRAILING_ANNOTATION_RE.sub("", u) for u in URL_RE.findall(line)]
        if len(urls) != 2:
            sys.exit(
                f"[fetch] 错误：SOURCES.md 里一行 `[OTP]` 登记必须恰好 2 个 URL"
                f"（GenerateOTP 端点 + 数据端点，见 tools/fetch.py 文首），这行有 "
                f"{len(urls)} 个：\n  {line.strip()}"
            )
        pairs.append(tuple(urls))
    return pairs


def slugify(url: str) -> str:
    h = hashlib.sha1(url.encode()).hexdigest()[:10]
    tail = re.sub(r"[^a-zA-Z0-9]+", "-", url.split("//", 1)[-1]).strip("-")[-40:]
    return f"{tail}-{h}"


def looks_blocked(dest: Path) -> bool:
    """HTTP 200 但正文其实是反爬拦截页（如 jse.co.za 的 Cloudflare 页）或 KRX 数据端点
    对数据中心 IP 返回的字面量 `LOGOUT`——这类「抓到了但不是真内容」不能算成功。"""
    if not dest.exists():
        return False
    head = dest.read_bytes()[:4096]
    if head[:4] == b"%PDF":
        return False
    text = head.decode("utf-8", "ignore")
    return text.strip() == "LOGOUT" or bool(BLOCK_SNIFF_RE.search(text))


def wayback_snapshot(url: str):
    """去 web.archive.org 查该 URL 最近一次 HTTP 200 快照，返回可直接抓取的 `id_` 原始
    字节 URL（不带 wayback 工具栏注入）；查不到或 CDX 查询本身失败返回 None。"""
    cdx_url = ("https://web.archive.org/cdx/search/cdx?url=" + quote(url, safe="")
               + "&output=json&filter=statuscode:200&limit=-1&fastLatest=true")
    try:
        result = subprocess.run(["curl", "-sS", "--compressed", "-A", UA, cdx_url],
                                 capture_output=True, text=True, timeout=45)
        rows = json.loads(result.stdout)
    except Exception:
        return None
    if len(rows) < 2:  # 第 0 行是表头，没有第 1 行说明没有 200 快照
        return None
    timestamp = rows[-1][1]
    return f"https://web.archive.org/web/{timestamp}id_/{url}"


def _curl(url: str, dest: Path, *, method="GET", body=None, headers=(),
          cookie_jar=None, timeout=60) -> str:
    # --compressed：wayback 的 id_ 原始快照会带 Content-Encoding: gzip 转发，不加这个
    # flag curl 不会请求/解压 gzip，落盘的就是一段乱码字节而不是 HTML/PDF 正文。
    cmd = ["curl", "-sS", "-L", "--compressed", "-A", UA, "-o", str(dest), "-w", "%{http_code}"]
    for h in headers:
        cmd += ["-H", h]
    if cookie_jar:
        cmd += ["-c", str(cookie_jar), "-b", str(cookie_jar)]
    if method == "POST":
        cmd += ["-X", "POST", "--data", body or ""]
    cmd.append(url)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "TIMEOUT"


def _curl_text(url: str, *, headers=(), cookie_jar=None, timeout=30) -> str:
    """轻量 GET，直接拿正文文本（不落盘）——用于 OTP 换 code 这类只要一小段 token 的请求。"""
    cmd = ["curl", "-sS", "--compressed", "-A", UA]
    for h in headers:
        cmd += ["-H", h]
    if cookie_jar:
        cmd += ["-c", str(cookie_jar), "-b", str(cookie_jar)]
    cmd.append(url)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""


def fetch_one(url: str, dest_dir: Path) -> dict:
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = ".pdf" if url.lower().split("?")[0].endswith(".pdf") else ".html"
    dest = dest_dir / (slugify(url) + ext)
    status = _curl(url, dest)
    ok = status.startswith("2") and not looks_blocked(dest)
    via = "live"
    if not ok:
        snap = wayback_snapshot(url)
        if snap:
            wb_status = _curl(snap, dest)
            if wb_status.startswith("2") and not looks_blocked(dest):
                status, ok, via = wb_status, True, "wayback"
    size = dest.stat().st_size if dest.exists() else 0
    label = "OK  " if ok and via == "live" else ("OK*w" if ok else "FAIL")
    print(f"[fetch]  {label} {status:>5} {size:>8}B  {url}")
    return {
        "url": url, "http_status": status, "ok": ok, "via": via, "size": size,
        "file": str(dest.relative_to(ROOT)) if dest.exists() else None,
        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    }


def fetch_otp(otp_url: str, data_url: str, dest_dir: Path) -> dict:
    """两步 OTP-AJAX 抓取：先 GET otp_url 换一次性 code，再带 code POST data_url。
    已知局限（v1）：数据端点 POST body 固定为空，只靠 code 取默认数据集；若某来源需要
    额外表单参数（日期区间/市场过滤），把它们编进 data_url 的查询串登记，本函数会与
    code 合并。见文首「OTP 来源登记格式」与已验证的数据中心 IP 封锁记录。
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / (slugify(data_url) + ".json")
    cookie_jar = dest_dir / f".otp-{slugify(otp_url)[:16]}.cookies.tmp"
    origin = "/".join(otp_url.split("/")[:3]) + "/"
    fetched_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    code = _curl_text(otp_url, headers=[f"Referer: {origin}"], cookie_jar=cookie_jar)
    if not code:
        cookie_jar.unlink(missing_ok=True)
        print(f"[fetch]  FAIL NO_CODE        0B  [OTP] {data_url}（GenerateOTP 未返回 code）")
        return {"url": data_url, "otp_url": otp_url, "http_status": "NO_CODE", "ok": False,
                "via": "otp", "size": 0, "file": None, "fetched_at": fetched_at}
    sep = "&" if "?" in data_url else "?"
    post_url = f"{data_url}{sep}code={quote(code, safe='')}"
    status = _curl(post_url, dest, method="POST", body="",
                    headers=[f"Referer: {origin}"], cookie_jar=cookie_jar)
    cookie_jar.unlink(missing_ok=True)
    ok = status.startswith("2") and not looks_blocked(dest)
    size = dest.stat().st_size if dest.exists() else 0
    print(f"[fetch]  {'OK  ' if ok else 'FAIL'} {status:>5} {size:>8}B  [OTP] {data_url}")
    return {
        "url": data_url, "otp_url": otp_url, "http_status": status, "ok": ok, "via": "otp",
        "size": size, "file": str(dest.relative_to(ROOT)) if dest.exists() else None,
        "fetched_at": fetched_at,
    }


def main():
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        sys.exit("用法: python3 tools/fetch.py <exchange-id>")
    exchange_id = sys.argv[1].strip()
    section = extract_section(exchange_id)
    otp_pairs = extract_otp_pairs(section)
    otp_urls = {u for pair in otp_pairs for u in pair}
    raw_urls = URL_RE.findall(section)
    urls = sorted({TRAILING_ANNOTATION_RE.sub("", u) for u in raw_urls} - otp_urls)
    if not urls and not otp_pairs:
        sys.exit(f"[fetch] `{exchange_id}` 章节下没有找到任何 URL，先去 SOURCES.md 登记来源。")

    dest_dir = CACHE_DIR / exchange_id
    tail = f" + {len(otp_pairs)} 个 [OTP] 来源" if otp_pairs else ""
    print(f"[fetch] {exchange_id}: {len(urls)} 个来源 URL{tail}")
    manifest = [fetch_one(u, dest_dir) for u in urls]
    manifest += [fetch_otp(otp, data, dest_dir) for otp, data in otp_pairs]
    (dest_dir / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    failed = [m for m in manifest if not m["ok"]]
    if failed:
        print(f"\n[fetch] {len(failed)}/{len(manifest)} 个来源抓取失败。", file=sys.stderr)
        print("        换 UA/curl 仍抓不到就启用 CLAUDE.md 三、降级方案：", file=sys.stderr)
        print("        记清楚试过什么方式，在 OPEN-QUESTIONS.md 留待人工提供页面。", file=sys.stderr)
        print("        不要因为抓不到就凭记忆填数据。", file=sys.stderr)
        sys.exit(2)
    via_wayback = sum(1 for m in manifest if m.get("via") == "wayback")
    note = f"（其中 {via_wayback} 个走 wayback 回退）" if via_wayback else ""
    print(f"\n[fetch] 全部 {len(manifest)} 个来源抓取成功{note} → {dest_dir.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
