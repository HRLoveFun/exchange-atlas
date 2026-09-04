#!/usr/bin/env python3
"""tools/check_no_chapter_ordinals.py — [ADR-072]「前端不暴露 taxonomy 章序数」的机器强制

背景（ADR-072，原占 ADR-070，撞已合并的 [ADR-070]/[ADR-071]，按 ADR-029 协议让号）：
`schema/taxonomy.yml` 的 `chapters` 用 `chapter_no`（2–12，源自原始十三章大纲）给
十一个数据章节编号。这套序数是内部 schema 产物，前端从没有一个页面把它当目录呈现。
可视化视图底部的设计思想段落却写「本视图由第五章《市场结构与交易机制》
…驱动」——读者看到「第五章」却无从知道这是什么的第五章、去哪看全貌。ADR-072 定：
前端只用**章节名**（读者能在档案页左栏点到的那一节）+ 指向档案页 / ADR 的链接，
不出现 `第X章` / `Chapter N` 这类悬空序数。

本脚本锁住这条约定，防止后续新视图 / 新文案再引入序数。是 [CLAUDE.md §四]
「新引入的不变式必须同时加机器校验」对本 ADR 的落点，与 check_ui_i18n.py 同类
（都扫 docs/assets/app.js 的字符串字面量，不碰注释）。

规则：
  扫 docs/assets/app.js 的字符串字面量（复用 check_ui_i18n.scan 的 JS 词法，
  注释里的 `第五章` 是开发者速记，放行）+ docs/index.html 的正文（去 HTML 注释），
  命中下列任一即 FAIL：
    - `第<中文数字>章`（第一章…第十二章、第 8 章）
    - `Chapter <数字>`（含 &nbsp;）
  行内带 `chapter-ordinal-ok` 标记的放行（给未来确有需要的个案，目前无）。

退出码：发现问题为 1，否则 0。接入 `make check`。
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_ui_i18n import scan  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "docs" / "assets" / "app.js"
INDEX_HTML = ROOT / "docs" / "index.html"

EXEMPT_MARKER = "chapter-ordinal-ok"

# 中文数字章序数：第一章 … 第十二章、第 8 章（允许「第」与「章」间有空格/数字）
_CN_NUM = "零一二三四五六七八九十百"
ORDINAL_RES = [
    re.compile(r"第\s*[" + _CN_NUM + r"]+\s*章"),
    re.compile(r"第\s*\d+\s*章"),
    re.compile(r"Chapter(?:\s|&nbsp;)+\d+", re.IGNORECASE),
]

HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)


def _hits(text):
    for rx in ORDINAL_RES:
        m = rx.search(text)
        if m:
            return m.group(0)
    return None


def line_index(src):
    starts = [0]
    for k, ch in enumerate(src):
        if ch == "\n":
            starts.append(k + 1)
    return starts


def line_of(starts, pos):
    lo, hi = 0, len(starts) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if starts[mid] <= pos:
            lo = mid
        else:
            hi = mid - 1
    return lo + 1


def scan_app_js():
    if not APP_JS.exists():
        print(f"[check-chapter-ordinals] 跳过：{APP_JS} 不存在")
        return []
    src = APP_JS.read_text(encoding="utf-8")
    _, literals = scan(src)
    starts = line_index(src)
    problems = []
    for a, b in literals:
        inner = src[a + 1:b - 1]
        hit = _hits(inner)
        if not hit:
            continue
        line_no = line_of(starts, a)
        line_text = src[starts[line_no - 1]:(starts[line_no] if line_no < len(starts) else len(src))]
        if EXEMPT_MARKER in line_text:
            continue
        problems.append((APP_JS, line_no, hit, inner.strip()[:70]))
    return problems


def scan_index_html():
    if not INDEX_HTML.exists():
        return []
    raw = INDEX_HTML.read_text(encoding="utf-8")
    # HTML 注释按同长空白替换，行号不移位
    src = HTML_COMMENT_RE.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), raw)
    starts = line_index(src)
    problems = []
    for rx in ORDINAL_RES:
        for m in rx.finditer(src):
            line_no = line_of(starts, m.start())
            line_text = src[starts[line_no - 1]:(starts[line_no] if line_no < len(starts) else len(src))]
            if EXEMPT_MARKER in line_text:
                continue
            problems.append((INDEX_HTML, line_no, m.group(0), line_text.strip()[:70]))
    return problems


def main():
    problems = scan_app_js() + scan_index_html()
    if not problems:
        print("[check-chapter-ordinals] OK — 前端无 taxonomy 章序数（第X章 / Chapter N）")
        return 0
    print(f"[check-chapter-ordinals] FAIL — {len(problems)} 处章序数进入前端（ADR-072：改用章节名 + 档案页 / ADR 链接）：")
    for path, line_no, hit, snippet in problems:
        print(f"  {path.relative_to(ROOT)}:{line_no}  「{hit}」  {snippet}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
