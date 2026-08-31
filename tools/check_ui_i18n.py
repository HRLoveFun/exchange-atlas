#!/usr/bin/env python3
"""tools/check_ui_i18n.py — [ADR-006]「UI 文案不得中文单语」的机器强制

背景：[ADR-006] 定下「UI 标签恒双语」，但一直没有机器校验，Phase 2/3 期间
（[ADR-040]/[ADR-047]）新写的市场机制剖面与成本瀑布静默退化为满屏中文单语串。
按 [ADR-024]/[ADR-033]「加机器校验锁住铁律」的做法补这一环，见 ADR-049 方案 C。

规则（粗粒度，故意不追求覆盖 100% 的 JS 语法）：
  扫 docs/assets/app.js 里的字符串字面量，凡含 CJK 字符的，必须满足其一：
    1. 位于 t() / tSel() 调用的实参内（图形视图的合成语句 / 轴名 / 图例 / 说明段，
       按 ADR-049 的边界细化跟随语言开关，不恒双语）；
    2. 是 {zh, en} 字典里的 zh 值（zh: "…" 形式）；
    3. 本身是双语串（含至少一处 2 个以上连续 ASCII 字母，如 "已填字段 Filled Fields"）；
    4. 该行带 `// i18n-exempt` 标记——给「串本身就是要显示单语中文」的少数例外
       （如语言切换按钮按当前模式显示「中文」/「English」）。
  不含 CJK 的字面量、注释、正则字面量一律不 care。

退出码：发现问题为 1，否则 0。接入 `make check`。
"""
import bisect
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "docs" / "assets" / "app.js"

# CJK 统一表意文字 / 扩展 A / 兼容表意文字 / CJK 标点与全角符号（、。「」（）～等）
CJK_RE = re.compile(r"[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]")
# 双语判据：串里有成词的 ASCII 字母（≥2 连续）
LATIN_WORD_RE = re.compile(r"[A-Za-z]{2,}")
# 调用点识别：字面量前面某个未闭合 '(' 之前的标识符
CALLEE_RE = re.compile(r"([A-Za-z_$][A-Za-z0-9_$]*)\s*$")
# {zh, en} 字典的 zh 值：串前面紧邻 "zh:"
ZH_KEY_RE = re.compile(r"\bzh\s*:\s*$")
EXEMPT_MARKER = "i18n-exempt"

# 豁免的调用：t/tSel 是语言开关入口，本身就是要写单语中文的地方
EXEMPT_CALLEES = {"t", "tSel"}

# 「前一个有效 token 是这些之一时，紧随的 / 是正则字面量的开头而不是除号」
REGEX_PRECEDERS = set("(,=:[!&|?{};+-*%~^<>")
REGEX_KEYWORDS = {
    "return", "typeof", "instanceof", "in", "of", "new", "delete", "void",
    "case", "do", "else", "yield", "await",
}


def scan(src):
    """极小的 JS 词法扫描，返回 (注释区间, 字符串字面量区间)。

    必须正确处理三件事，否则会产生大量假阳性：
      - // 行注释与 /* */ 块注释（文件里有 'https://…' 这类串，不能按 '//' 切行）；
      - 三种引号 + 反斜杠转义；
      - 正则字面量（如 /[&<>"']/g），它里面的引号不是字符串边界。
    """
    comments, literals = [], []
    i, n = 0, len(src)
    prev_significant = ""  # 最近一个非空白、非注释字符，用来判定 / 是不是正则
    while i < n:
        c = src[i]
        if c.isspace():
            i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            j = n if j < 0 else j
            comments.append((i, j))
            i = j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            j = n if j < 0 else j + 2
            comments.append((i, j))
            i = j
            continue
        if c == "/" and _starts_regex(prev_significant):
            j = i + 1
            in_class = False
            while j < n:
                ch = src[j]
                if ch == "\\":
                    j += 2
                    continue
                if ch == "[":
                    in_class = True
                elif ch == "]":
                    in_class = False
                elif ch == "/" and not in_class:
                    break
                elif ch == "\n":
                    break  # 正则不能跨行，遇到换行说明判定错了，到此为止
                j += 1
            while j < n and src[j] in "gimsuyd":
                j += 1
            i = j
            prev_significant = "/"
            continue
        if c in "\"'`":
            q = c
            j = i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == q:
                    break
                if q != "`" and src[j] == "\n":
                    break  # 普通字符串不能跨行
                j += 1
            literals.append((i, min(j + 1, n)))
            i = min(j + 1, n)
            prev_significant = "str"
            continue
        prev_significant = c
        i += 1
    return comments, literals


def _starts_regex(prev):
    if prev == "" or prev in ("str", "/"):
        return True
    if prev in REGEX_PRECEDERS:
        return True
    return prev in REGEX_KEYWORDS


def enclosing_callees(src, lit_start, literals, lit_lo=None):
    """由内向外列出包裹该字面量的一层层调用的标识符。

    只要任意一层是 t() / tSel() 就豁免——t("…" + x + (cond ? "（约 " : ""))
    里内层的条件表达式不该被当成漏网串。

    性能：调用方只判断 EXEMPT_CALLEES 是否出现，故一旦回溯到某层是
    t() / tSel() 就提前返回，不必再走到文件头（大文件里逐字回溯是主要
    耗时来源）。判断「位置是否落在某个字符串字面量内」也改用二分，
    不再对全部字面量做线性扫描。
    """
    if lit_lo is None:
        lit_lo = [a for a, _ in literals]
    out = []
    depth = 0
    i = lit_start - 1
    while i >= 0:
        k = bisect.bisect_right(lit_lo, i) - 1
        if k >= 0 and literals[k][0] <= i < literals[k][1]:
            i = literals[k][0] - 1
            continue
        ch = src[i]
        if ch == ")":
            depth += 1
        elif ch == "(":
            if depth == 0:
                m = CALLEE_RE.search(src[max(0, i - 80):i])
                name = m.group(1) if m else ""
                out.append(name)
                if name in EXEMPT_CALLEES:
                    return out
            else:
                depth -= 1
        i -= 1
    return out


def main():
    if not TARGET.exists():
        print(f"[check-ui-i18n] 跳过：{TARGET} 不存在")
        return 0
    src = TARGET.read_text(encoding="utf-8")
    comments, literals = scan(src)
    line_starts = [0]
    for k, ch in enumerate(src):
        if ch == "\n":
            line_starts.append(k + 1)

    def line_of(pos):
        lo, hi = 0, len(line_starts) - 1
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if line_starts[mid] <= pos:
                lo = mid
            else:
                hi = mid - 1
        return lo + 1

    problems = []
    for start, end in literals:
        text = src[start + 1:end - 1]
        if not CJK_RE.search(text):
            continue
        # 3) 双语串（如 "已填字段 Filled Fields"）
        if LATIN_WORD_RE.search(text):
            continue
        # 2) {zh, en} 字典的 zh 值
        if ZH_KEY_RE.search(src[:start]):
            continue
        # 1) t() / tSel() 调用的实参（含嵌套表达式）
        if EXEMPT_CALLEES.intersection(enclosing_callees(src, start, literals)):
            continue
        # 4) 行内显式豁免
        line_no = line_of(start)
        line_text = src[line_starts[line_no - 1]:(line_starts[line_no] if line_no < len(line_starts) else len(src))]
        # 注释里的字面量不会出现在这里（已跳过），所以直接找行尾标记即可
        if EXEMPT_MARKER in src[start:].split("\n")[0] or EXEMPT_MARKER in line_text:
            continue
        problems.append((line_no, text[:60]))

    if not problems:
        print(f"[check-ui-i18n] OK — {TARGET.relative_to(ROOT)} 无中文单语 UI 串")
        return 0

    print(f"[check-ui-i18n] FAIL — {len(problems)} 处中文单语串进入 DOM（应包 t()、写成 \"中文 English\"，或加 // i18n-exempt）：")
    for line_no, snippet in problems:
        print(f"  {TARGET.relative_to(ROOT)}:{line_no}  {snippet}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
