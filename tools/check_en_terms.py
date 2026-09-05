#!/usr/bin/env python3
"""tools/check_en_terms.py — `en` 值术语漂移**建议清单**（只读扫描，不改任何文件）

背景（DECISIONS.md ADR-049 方案 E）：20 家交易所的 `en` 值分批由不同子代理回填，
同一概念漂移成多种写法（RMB / Renminbi / CNY，board lot / round lot / lot size…），
削弱「横向可比」这个核心卖点。

**为什么只出建议、不自动改、也不进 `make check`：**
漂移里混着大量**合法的市场特定用法**——SSE 官方自己就叫 call auction，美股官方
用 round lot、日本用 trading unit。机器无法区分「漂移」与「有意沿用官方用语」，
自动改会把对的改成错的；挂进 `make check` 则要么长期红、要么逼人写豁免把它变成
橡皮图章。所以本脚本是一份给人看的清单：跑一遍，逐条判断，认为该改的手动改。

用法：
    python3 tools/check_en_terms.py            # 全部概念
    python3 tools/check_en_terms.py currency   # 只看某组
"""
import re
import sys

import data_files

# 概念组：标准写法（house style，与 schema/glossary.yml 头注一致）→ 需要报告的偏离写法。
# 每项 (正则, 说明)，正则用 \b 词界；默认**大小写敏感**（`Renminbi` 只想抓拼全称的那种，
# 不想抓散文里小写 "the renminbi"），需不敏感的写法在正则里自带 (?i)。
CONCEPTS = {
    "currency": {
        "standard": "短值字段用 ISO 代码 / 通用简称（RMB / USD / HKD…）",
        "variants": [
            (r"\bRenminbi\b", "短值字段应作 RMB；散文里小写 the renminbi 作普通名词是正确英文、"
                              "非漂移——本条只匹配大写 Renminbi，见到即人工核该处是短值还是散文"),
            (r"\bCNY\b", "非标准：house style 用 RMB（CNY 是 ISO 代码，仅在确实引 ISO 语境时保留）"),
            (r"\bRMB\b", None),  # 标准写法，只统计不报告
        ],
    },
    "auction": {
        "standard": "Opening Auction / Closing Auction",
        "variants": [
            (r"(?i)\bcall auctions?\b", "需逐案判断：glossary 标准是 Opening/Closing Auction；"
                                        "但部分市场官方即称 call auction（如 SSE），沿用官方名时应全所一致"),
            (r"(?i)\bopening auctions?\b", None),
            (r"(?i)\bclosing auctions?\b", None),
        ],
    },
    "lot": {
        "standard": "board lot",
        "variants": [
            (r"(?i)\bround lots?\b", "需逐案判断：house style 默认 board lot；美股官方用 round lot，沿用即合法"),
            (r"(?i)\btrading units?\b", "需逐案判断：house style 默认 board lot；日本官方用 trading unit，沿用即合法"),
            (r"(?i)\blot sizes?\b", "非标准：house style 用 board lot"),
            (r"(?i)\bboard lots?\b", None),
        ],
    },
}

# 扫哪些键：`en` 值（含列表项里的 en）。detail 是分析性散文、且按设计不翻译，跳过。
EN_KEY_RE = re.compile(r"^\s*en:\s*(.+?)\s*$", re.M)


def iter_en_values():
    for path in data_files.exchange_paths():
        text = path.read_text(encoding="utf-8")
        for m in EN_KEY_RE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            yield path.stem, line_no, m.group(1).strip().strip('"').strip("'")


def main():
    wanted = sys.argv[1] if len(sys.argv) > 1 else None
    groups = {k: v for k, v in CONCEPTS.items() if wanted is None or k == wanted}
    if not groups:
        sys.exit(f"[check-en-terms] 没有概念组 `{wanted}`；可用：{', '.join(CONCEPTS)}")

    total_suggestions = 0
    for name, cfg in groups.items():
        print(f"\n=== {name} — 标准写法：{cfg['standard']} ===")
        hits = {pat: [] for pat, _ in cfg["variants"]}
        for eid, line_no, value in iter_en_values():
            for pat, _ in cfg["variants"]:
                if re.search(pat, value):  # 大小写敏感；需不敏感的正则自带 (?i)
                    hits[pat].append((eid, line_no, value))
        for pat, note in cfg["variants"]:
            found = hits[pat]
            if not found:
                continue
            if note is None:
                print(f"  [{len(found):4} 处] 标准写法 {pat} —— 无需处理")
                continue
            total_suggestions += len(found)
            print(f"\n  [{len(found)} 处] {pat}")
            print(f"      {note}")
            for eid, line_no, value in found[:12]:
                snippet = value if len(value) <= 110 else value[:107] + "..."
                print(f"      · {eid}:{line_no}  {snippet}")
            if len(found) > 12:
                print(f"      … 另 {len(found) - 12} 处")

    print(f"\n[check-en-terms] 共 {total_suggestions} 处待人工判断（本脚本只读，不改文件）")


if __name__ == "__main__":
    main()
