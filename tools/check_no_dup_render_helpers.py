#!/usr/bin/env python3
"""tools/check_no_dup_render_helpers.py — 防止 docs/assets/app.js 的可视化模块
重演 clone-and-own（架构腐烂审查发现的历史模式，[ADR-085]）：
七个模块 td/cw/sp/ll/rm/pt/rf 曾各自独立实现同构的
resolveId / 文本折行 / 数据格子（点击→openCellOverlay）逻辑——新模块照抄上一个
模块、改个前缀，而不是抽取共享函数。

做法：扫描 IIFE 顶层（缩进恰好 2 空格）的具名 `function`，按参数个数分组，
组内比较去空白折叠后的函数体文本——两个不同名字的函数体逐字节相同即报违规。
**例外**：函数体只是一条 `return 共享函数(...)` 的纯委托语句不报——这正是
本次重构收敛后期望的形状（如 `tdResolveId`/`cwResolveId` 各自委托同一个
`resolveExchangeId`，只是传入的默认交易所常量不同；`rmWrap`/`ptWrap`/`rfWrap`
委托同一个 `wrapByPixelWidth`，参数原样透传）——纯委托没有需要维护两次的逻辑，
不是这条检查要防的对象；有实质逻辑（多条语句）却逐字节重复才是。

跑法：
    python3 tools/check_no_dup_render_helpers.py

第二个关卡（Phase 4 棒 1，[ADR-phase4-canvas-layout]）：画布只有一个「当前市场」，
「市场 Market」选择器必须是共享的画布级控件、label 字面量全库 ≤ 1 处——7 个模块
再各自内嵌一份下拉（count ≥ 2）即报违规。计数只算字符串字面量（复用
check_ui_i18n.scan 的词法扫描），注释里提到这几个字不算。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "docs" / "assets" / "app.js"
MARKET_LABEL = "市场 Market"

FUNC_RE = re.compile(r"^  function (\w+)\(([^)]*)\)\s*\{", re.M)
DELEGATE_RE = re.compile(r"^return \w+\([^()]*\);$")


def extract_functions(text):
    """返回 [(name, arity, body)]，body 是函数体文本（不含外层大括号）。"""
    out = []
    for m in FUNC_RE.finditer(text):
        name, params = m.group(1), m.group(2)
        arity = len([p for p in params.split(",") if p.strip()])
        start = m.end()
        depth = 1
        i = start
        while depth > 0 and i < len(text):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        out.append((name, arity, text[start:i - 1]))
    return out


def normalize(body):
    return re.sub(r"\s+", " ", body).strip()


def duplicate_groups(text):
    """返回 [(body_normalized, [name, ...])]——同一函数体被 ≥2 个不同名字的
    非纯委托函数共享的分组。纯委托（见模块 docstring）不报。"""
    by_key = {}
    for name, arity, body in extract_functions(text):
        key = (arity, normalize(body))
        by_key.setdefault(key, []).append(name)
    groups = []
    for (_, body_norm), names in by_key.items():
        uniq = sorted(set(names))
        if len(uniq) < 2:
            continue
        if DELEGATE_RE.match(body_norm):
            continue
        groups.append((body_norm, uniq))
    return groups


def market_label_count(text):
    """字符串字面量里「市场 Market」label 的出现次数（注释 / 正则不计——
    复用 check_ui_i18n.scan 的词法扫描拿字面量区间）。"""
    from check_ui_i18n import scan
    _, literals = scan(text)
    return sum(text[s + 1:e - 1].count(MARKET_LABEL) for s, e in literals)


def main():
    if not APP_JS.exists():
        return
    text = APP_JS.read_text(encoding="utf-8")
    groups = duplicate_groups(text)
    if groups:
        print(f"[check-no-dup-render-helpers] 发现 {len(groups)} 组函数体完全重复：")
        for body, names in groups:
            preview = body if len(body) <= 100 else body[:97] + "..."
            print(f"  {', '.join(names)}  <- 相同函数体：{preview}")
        print("\n  两个及以上不同名字的函数拥有逐字节相同的函数体，是「复制上一个模块的"
              "函数、改个名字」的信号。把公共逻辑收敛成一个共享函数，其余改成调用它的"
              "1 行委托（`return 共享函数(...);` 这种纯委托形状本检查不拦）。")
        sys.exit(1)
    print("[check-no-dup-render-helpers] OK — 未发现完全重复的函数体")
    n = market_label_count(text)
    if n > 1:
        print(f"[check-no-dup-render-helpers] FAIL — 「{MARKET_LABEL}」label 字面量出现 {n} 次（上限 1）：\n"
              "  单页画布只有一个「当前市场」（[ADR-phase4-canvas-layout] 棒 1），选择器必须是"
              "共享的画布级控件（canvasToolbar），各模块不得再内嵌自己的「市场 Market」下拉。")
        sys.exit(1)
    print(f"[check-no-dup-render-helpers] OK — 「{MARKET_LABEL}」label 字面量 {n} 处（≤ 1）")


if __name__ == "__main__":
    main()
