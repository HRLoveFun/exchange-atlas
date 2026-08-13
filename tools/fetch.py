#!/usr/bin/env python3
"""tools/fetch.py — 按 PROJECT/SOURCES.md 登记的方式抓取交易所官方页面到 .cache/

用法: python3 tools/fetch.py <exchange-id>   （或 make fetch EX=<exchange-id>）

为什么不用 WebFetch：探针实测 WebFetch 对 SSE / JPX 的规则页返回 403，换常规浏览器 UA
的 curl 可以过。见 CLAUDE.md 二、PROJECT/SOURCES.md 底部「探测记录」。

见 CLAUDE.md 二：数据不得凭记忆填写，必须来自本脚本抓取并落盘在 .cache/ 的原始页——
那是「这条数据不是编的」的可核查凭据。
"""
import sys
import re
import subprocess
import hashlib
import json
import datetime
from pathlib import Path

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


def slugify(url: str) -> str:
    h = hashlib.sha1(url.encode()).hexdigest()[:10]
    tail = re.sub(r"[^a-zA-Z0-9]+", "-", url.split("//", 1)[-1]).strip("-")[-40:]
    return f"{tail}-{h}"


def fetch_one(url: str, dest_dir: Path) -> dict:
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = ".pdf" if url.lower().split("?")[0].endswith(".pdf") else ".html"
    dest = dest_dir / (slugify(url) + ext)
    try:
        result = subprocess.run(
            ["curl", "-sS", "-L", "-A", UA, "-o", str(dest), "-w", "%{http_code}", url],
            capture_output=True, text=True, timeout=60,
        )
        status = result.stdout.strip()
    except subprocess.TimeoutExpired:
        status = "TIMEOUT"
    ok = status.startswith("2")
    size = dest.stat().st_size if dest.exists() else 0
    print(f"[fetch]  {'OK  ' if ok else 'FAIL'} {status:>5} {size:>8}B  {url}")
    return {
        "url": url, "http_status": status, "ok": ok, "size": size,
        "file": str(dest.relative_to(ROOT)) if dest.exists() else None,
        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    }


def main():
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        sys.exit("用法: python3 tools/fetch.py <exchange-id>")
    exchange_id = sys.argv[1].strip()
    section = extract_section(exchange_id)
    raw_urls = URL_RE.findall(section)
    urls = sorted({TRAILING_ANNOTATION_RE.sub("", u) for u in raw_urls})
    if not urls:
        sys.exit(f"[fetch] `{exchange_id}` 章节下没有找到任何 URL，先去 SOURCES.md 登记来源。")

    dest_dir = CACHE_DIR / exchange_id
    print(f"[fetch] {exchange_id}: {len(urls)} 个来源 URL")
    manifest = [fetch_one(u, dest_dir) for u in urls]
    (dest_dir / "_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    failed = [m for m in manifest if not m["ok"]]
    if failed:
        print(f"\n[fetch] {len(failed)}/{len(urls)} 个来源抓取失败。", file=sys.stderr)
        print("        换 UA/curl 仍抓不到就启用 CLAUDE.md 三、降级方案：", file=sys.stderr)
        print("        记清楚试过什么方式，在 OPEN-QUESTIONS.md 留待人工提供页面。", file=sys.stderr)
        print("        不要因为抓不到就凭记忆填数据。", file=sys.stderr)
        sys.exit(2)
    print(f"\n[fetch] 全部 {len(urls)} 个来源抓取成功 → {dest_dir.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
