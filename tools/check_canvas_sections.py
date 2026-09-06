#!/usr/bin/env python3
"""tools/check_canvas_sections.py — Phase 4 棒 2（[ADR-phase4-canvas-layout]）的机器关卡。

单页市场画布的编排完整性（缺一条即 FAIL，接入 `make check`）：
  1. app.js 的 CANVAS_SECTIONS 注册表恰好列出 7 个模块 id、顺序为认知流——id 集合
     同时是旧 #view=<module> 深链的迁移目标（棒 4），一个都不能少；
  2. 编排壳 canvasShell 通过注册表逐项调用 s.build(...)——builder 调用只许走注册表，
     不许绕过它手写独立调用点（否则注册表退化成死表、编排漂回 clone-and-own）；
  3. section 锚点模板 id="section-" 存在（深链 #market=X&section=<module> 的
     scrollIntoView 目标）；
  4. 7 个 builder 函数在 app.js 仍有定义。ADR 记的「spLanes」是交割管线泳道的
     绘制函数，画布编排挂在它的复合层 spBuild（spBuild 内部调用 spLanes），故校验
     spBuild；td/cw/ll/rm/pt/rf 六个 builder 与 ADR 同名。
  5. index.html 主 tab 行恰好 2 项：data-view="canvas" + data-view="more"
     （tab 行 10 → 2，ADR-phase4-canvas-layout 棒 2）。

跑法：python3 tools/check_canvas_sections.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_JS = ROOT / "docs" / "assets" / "app.js"
INDEX_HTML = ROOT / "docs" / "index.html"

# 顺序 = 交易员认知流（ADR-phase4-canvas-layout #2），与 app.js 的 CANVAS_SECTIONS 逐位一致
EXPECTED_SECTIONS = [
    "regulation-map",
    "participant-map",
    "trading-day",
    "cost-waterfall",
    "settlement-pipeline",
    "listing-lifecycle",
    "risk-flags",
]
EXPECTED_BUILDERS = ["rmBuild", "ptBuild", "tdBuild", "cwBuild", "spBuild", "llBuild", "rfBuild"]


def main():
    problems = []
    src = APP_JS.read_text(encoding="utf-8")

    m = re.search(r"var CANVAS_SECTIONS = \[(.*?)\];", src, re.S)
    if not m:
        problems.append("app.js 里找不到 CANVAS_SECTIONS 注册表")
    else:
        ids = re.findall(r'id:\s*"([a-z0-9-]+)"', m.group(1))
        if ids != EXPECTED_SECTIONS:
            problems.append(
                f"CANVAS_SECTIONS 模块清单不符：期望 {EXPECTED_SECTIONS}，实际 {ids}\n"
                "  （id 同时是 section 锚点后缀与旧 #view=<module> 深链的迁移目标，一个都不能少）")

    shell = re.search(r"  function canvasShell\([^)]*\) \{.*?\n  \}", src, re.S)
    if not shell:
        problems.append("找不到 canvasShell（画布编排壳）")
    elif "s.build(id, data)" not in shell.group(0):
        problems.append(
            "canvasShell 没有通过注册表调用 s.build(id, data)——\n"
            "  builder 调用必须走 CANVAS_SECTIONS，不允许绕过注册表手写独立调用点")

    if 'id="section-' not in src:
        problems.append('找不到 section 锚点模板 id="section-"（深链 #market=X&section=<module> 的滚动目标）')

    for b in EXPECTED_BUILDERS:
        if not re.search(r"function " + b + r"\(", src):
            problems.append(f"builder {b} 在 app.js 中没有定义")

    html = INDEX_HTML.read_text(encoding="utf-8")
    tabs = re.search(r'<nav class="header-tabs"[^>]*>.*?</nav>', html, re.S)
    if not tabs:
        problems.append("index.html 找不到主 tab 行（nav.header-tabs）")
    else:
        views = re.findall(r'data-view="([a-z-]+)"', tabs.group(0))
        if views != ["canvas", "more"]:
            problems.append(
                "主 tab 行必须是「市场画布 Canvas + 更多 More」两项（ADR-phase4-canvas-layout 棒 2），\n"
                f"  实际 data-view={views}")

    if problems:
        print("[check-canvas-sections] FAIL —")
        for p in problems:
            print(f"  {p}")
        return 1
    print("[check-canvas-sections] OK — 画布 7 section 注册齐全、builder 走注册表、锚点模板与 tab 行 2 项无误")
    return 0


if __name__ == "__main__":
    sys.exit(main())
