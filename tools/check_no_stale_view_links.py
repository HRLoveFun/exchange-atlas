#!/usr/bin/env python3
"""tools/check_no_stale_view_links.py — Phase 4 棒 4（[ADR-phase4-canvas-layout]）的机器关卡。

旧 7 个可视化模块的 #view=<module> 深链（trading-day / cost-waterfall /
settlement-pipeline / listing-lifecycle / regulation-map / participant-map /
risk-flags）已迁移为画布锚点 #market=<id>&section=<module>。面向站点的文件里
再出现白名单之外的 #view= 值即 FAIL——拦住「改了路由忘了改内链」的回归。

白名单（进「更多」、不进画布的 4 个视图，深链原样保留）：
    matrix / timezone / health / exchange

扫描范围刻意只含面向读者的文件：README 双语 + docs/ 前端三件套（html/js/css）。
PROJECT/ 的历史 ADR 正文按 [CLAUDE.md §八] 只增补不改写、里面存有大量写作当时的
路由记述，不在本关卡语义内；tools/ 自身引用本白名单的字面量同理不算内链。

跑法：python3 tools/check_no_stale_view_links.py（并入 make check）
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCAN_FILES = [
    ROOT / "README.md",
    ROOT / "README.en.md",
    ROOT / "docs" / "index.html",
    ROOT / "docs" / "assets" / "app.js",
    ROOT / "docs" / "assets" / "styles.css",
]
ALLOWED_VIEWS = {"matrix", "timezone", "health", "exchange"}
VIEW_RE = re.compile(r"#view=([A-Za-z0-9_-]+)")


def main():
    problems = []
    for f in SCAN_FILES:
        if not f.exists():
            continue
        for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            for m in VIEW_RE.finditer(line):
                if m.group(1) not in ALLOWED_VIEWS:
                    problems.append(f"{f.relative_to(ROOT)}:{i}  {m.group(0)}")
    if problems:
        print("[check-no-stale-view-links] FAIL — 发现白名单之外的 #view= 内链：")
        for p in problems:
            print(f"  {p}")
        print(f"\n  白名单（「更多」组，进不了画布）：{sorted(ALLOWED_VIEWS)}\n"
              "  旧 #view=<module>（7 个可视化模块）已迁移为画布锚点\n"
              "  #market=<id>&section=<module>（ADR-phase4-canvas-layout #5）——\n"
              "  请把内链改写成画布锚点，或确认它确属「更多」组四视图。")
        return 1
    print("[check-no-stale-view-links] OK — 站点文件内 #view= 内链全部属于「更多」组白名单")
    return 0


if __name__ == "__main__":
    sys.exit(main())
