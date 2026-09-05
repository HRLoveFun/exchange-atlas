#!/usr/bin/env python3
"""tools/check_wrap_mixed.py — 锁住 docs/assets/app.js `wrapByCharBudget` 的
中英混排折行不变式（[ADR-093]）。

背景：`wrapByCharBudget` 是 ll / rm / pt / rf 四个可视化模块共用的 SVG 文本折行
预算函数（[ADR-085] 抽取）。它原来的实现「串里含任一 CJK 字符 → 整串按 per 逐字
硬切」，会把中英混排里的拉丁词 / 数字从词中截断（`Recognis|ed`、`CMN 4.37|3`，
[ADR-061] 已知局限④）。改为 token 折行后：CJK 表意字逐字断、拉丁词 / 数字 / 连字
串作为整体 token 不从中间切。

本脚本把两条不变式变成构建关卡（[CLAUDE.md §四]「新引入的不变式必须同时加机器
校验」；grep-guard 风格同 check_no_chapter_ordinals.py，但这里跑的是真实函数体的
行为断言，不是文本匹配）：

  1. 混排不切词：对若干中英混排样例（不触发末行省略号的 per / maxLines），
     输入里每个极大拉丁 / 数字 token 必须原样作为某输出行的子串出现。
  2. 纯 CJK 逐字对齐：纯 CJK 串的输出必须与「按 per 精确切片」逐字一致——
     保证 20 家 × 各视图现有纯中文卡片渲染零回归。

实现：从 app.js 抽出 `wrapByCharBudget` + `clipText` 两个函数体，拼一个 node
harness 跑断言。node 不在 PATH（纯 Python 环境）时跳过并给出提示，不阻断——
与「目标文件不存在则跳过」同类降级。CI（ubuntu-latest 预装 node）会真正跑。

跑法：
    python3 tools/check_wrap_mixed.py
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "docs" / "assets" / "app.js"

FUNC_HEAD_RE = re.compile(r"^  function (clipText|wrapByCharBudget)\(", re.M)


def extract_function(text, name):
    """返回 `function name(...) { ... }` 完整源码（含签名与外层大括号）。"""
    m = re.search(r"^  function " + re.escape(name) + r"\(", text, re.M)
    if not m:
        raise SystemExit(f"[check-wrap-mixed] 在 app.js 里找不到 function {name}(")
    start = m.start()
    i = text.index("{", m.end())
    depth = 0
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
        i += 1
    raise SystemExit(f"[check-wrap-mixed] function {name} 大括号不闭合")


# 极大拉丁 / 数字 / 连字 token（与 wrapByCharBudget 里的 [^\s一-鿿]+ 同类，
# 但这里只取「以字母或数字打头」的段，纯标点不算需要保护的词）
LATIN_TOKEN_RE = re.compile(r"[A-Za-z0-9][^\s一-鿿]*")

# 混排样例：(输入, per, maxLines)。per / maxLines 取足够大、不触发末行省略号。
MIXED_CASES = [
    ("Recognised Investment Exchange 地位", 14, 4),
    ("沪港通 Stock Connect 额度管理办法 2026", 16, 5),
    ("2026 年修订的 CMN 4.373 号决议全文", 12, 5),
    ("熔断阈值 MWCB 7% / 13% / 20% 三档", 12, 5),
    ("上市委员会 Listing Committee 审核 T+5", 15, 5),
    ("QFII / RQFII 额度并入 Stock Connect 通道", 18, 5),
]

# 纯 CJK 样例：(输入, per, maxLines) —— 必须与精确切片逐字一致
CJK_CASES = [
    ("深圳证券交易所指定的其他交易场所退市整理期安排", 9, 5),
    ("上海证券交易所科创板股票交易特别规定涨跌幅限制", 7, 8),
    ("退市后转入全国中小企业股份转让系统挂牌转让", 11, 4),
]

HARNESS = r"""
%(clipText)s
%(wrapByCharBudget)s

const mixed = %(mixed)s;
const cjk = %(cjk)s;
const fails = [];

function latinTokens(s) {
  return (s.match(/[A-Za-z0-9][^\s一-鿿]*/g) || []);
}
for (const [s, per, ml] of mixed) {
  const lines = wrapByCharBudget(s, per, ml);
  if (lines.some(l => l.endsWith("…"))) {
    fails.push("样例意外触发省略号，调整 per/maxLines: " + JSON.stringify(s));
    continue;
  }
  for (const tok of latinTokens(s)) {
    if (!lines.some(l => l.indexOf(tok) !== -1)) {
      fails.push("拉丁 token 被折断: " + JSON.stringify(tok) + " 不在任何输出行内 -> " + JSON.stringify(lines) + "  (输入 " + JSON.stringify(s) + ")");
    }
  }
}
for (const [s, per, ml] of cjk) {
  const got = wrapByCharBudget(s, per, ml);
  const want = [];
  for (let i = 0; i < s.length; i += per) want.push(s.slice(i, i + per));
  const wantClipped = want.length > ml
    ? want.slice(0, ml).map((l, k) => k === ml - 1 ? clipText(l + "…", per + 1) : l)
    : want;
  if (JSON.stringify(got) !== JSON.stringify(wantClipped)) {
    fails.push("纯 CJK 折行与精确切片不一致: 输入 " + JSON.stringify(s) + " per=" + per + " -> got " + JSON.stringify(got) + " want " + JSON.stringify(wantClipped));
  }
}
if (fails.length) {
  console.log("FAIL");
  for (const f of fails) console.log("  " + f);
  process.exit(1);
}
console.log("OK");
"""


def main():
    if not APP_JS.exists():
        print(f"[check-wrap-mixed] 跳过：{APP_JS} 不存在")
        return 0
    if not shutil.which("node"):
        print("[check-wrap-mixed] 跳过：PATH 里没有 node（行为断言需要 JS 运行时；CI 会跑）")
        return 0
    src = APP_JS.read_text(encoding="utf-8")
    js = HARNESS % {
        "clipText": extract_function(src, "clipText"),
        "wrapByCharBudget": extract_function(src, "wrapByCharBudget"),
        "mixed": json.dumps(MIXED_CASES, ensure_ascii=False),
        "cjk": json.dumps(CJK_CASES, ensure_ascii=False),
    }
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fh:
        fh.write(js)
        tmp = fh.name
    try:
        proc = subprocess.run([shutil.which("node"), tmp], capture_output=True, text=True)
    finally:
        Path(tmp).unlink(missing_ok=True)
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0:
        print("[check-wrap-mixed] FAIL — wrapByCharBudget 混排折行不变式被破坏：")
        for ln in out.splitlines():
            if ln != "FAIL":
                print(ln if ln.startswith("  ") else "  " + ln)
        print("\n  见 [ADR-093]：拉丁词 / 数字 token 不得从中间"
              "切；纯 CJK 折行须与精确 per 切片逐字一致。")
        return 1
    print("[check-wrap-mixed] OK — 混排不切词 + 纯 CJK 逐字对齐")
    return 0


if __name__ == "__main__":
    sys.exit(main())
