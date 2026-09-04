#!/usr/bin/env python3
"""tools/selfcheck.py — 不变式纯函数的合成用例自检（stdlib，无 pytest）

背景（[ADR-063]）：validate.py / sync.py 里有一批"判定逻辑抽成纯函数、正负向探针
一次性跑过就丢"的不变式——[ADR-059] 章节级 `not_applicable`、[ADR-060]/[ADR-062]
字段级 `not_applicable` 与 leaf/分组级 `optional` 完成度豁免。这些函数的部分分支
当前没有真实数据触发（B/D 桶勘误回 F 后，全库无一处 `not_applicable`），
`make check` 跑不到，静默回归无人拦。

本脚本把那些探针固化成可重复用例，喂合成输入锁住行为。真实数据的校验仍归
validate.py；这里只补"当前无真实数据触发"的盲区。[CLAUDE.md §四]「把该守的从
自觉变成构建关卡」对探针式检查的落点。接入 `make check`（排在 validate.py 前，
最快、纯逻辑、不读 data/）。

退出码：任一用例失配为 1，否则 0。
新增/修改一条不变式纯函数时，在这里补对应的正负向用例——和写 validate.py 检查是一套动作。
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync  # noqa: E402
import validate  # noqa: E402

CASES = []  # (name, got, want)


def case(name, got, want):
    CASES.append((name, got, want))


# ══════════════════════════════════════════════════════════════
# [ADR-062] 字段级 not_applicable：validate.field_na_violations(loc, fenv, fdef_optional)
#   返回违规消息列表（空 = 合法）。这里只关心"有没有违规"，故取 bool。
# ══════════════════════════════════════════════════════════════
def _fnv(fenv, opt):
    return bool(validate.field_na_violations("L", fenv, opt))


case("field-NA 合法：not_applicable 且无 zh、无 taxonomy optional", _fnv({"not_applicable": True}, False), False)
case("field-NA 违规：not_applicable 但仍带 zh", _fnv({"not_applicable": True, "zh": "占位"}, False), True)
case("field-NA 违规：not_applicable 叠 taxonomy 侧 optional", _fnv({"not_applicable": True}, True), True)
case("field-NA 放行：普通已填字段（未标 NA）", _fnv({"zh": "x", "confidence": "high"}, True), False)
case("field-NA 放行：普通空字段", _fnv({}, False), False)
case("field-NA 不触发：not_applicable 是字符串而非布尔 True（YAML 陷阱兜底）",
     _fnv({"not_applicable": "true", "zh": "x"}, False), False)


# ══════════════════════════════════════════════════════════════
# [ADR-059] 章节级 not_applicable：
#   validate.chapter_na_violations(loc, ch_id, meta_not_applicable, is_only_spot, zh_leaf_paths)
# ══════════════════════════════════════════════════════════════
def _cnv(meta_na, only_spot, zh_paths):
    return bool(validate.chapter_na_violations("EX", "listing", meta_na, only_spot, zh_paths))


case("chapter-NA 合法：only_spot 章标 NA、无带 zh 的 leaf", _cnv(True, True, []), False)
case("chapter-NA 违规：非 only_spot 章标了 NA", _cnv(True, False, []), True)
case("chapter-NA 违规：only_spot 章标 NA 却留了带 zh 的 leaf", _cnv(True, True, ["boards"]), True)
case("chapter-NA 违规：多个残留 leaf 各报一条", len(validate.chapter_na_violations("EX", "listing", True, True, ["a", "b", "c"])), 3)
case("chapter-NA 放行：未标 NA（meta 为 None）", _cnv(None, False, ["x"]), False)
case("chapter-NA 不触发：meta 是字符串 'true' 而非布尔（YAML 陷阱兜底）", _cnv("true", False, []), False)


# ══════════════════════════════════════════════════════════════
# [ADR-020]/[ADR-062] 完成度豁免：sync.count_chapter_leaves(fields, expanded) -> (total, filled, low)
#   合成最小 taxonomy 字段集 + 展开信封，锁分母行为。
# ══════════════════════════════════════════════════════════════
def _count(fields, expanded):
    return sync.count_chapter_leaves(fields, expanded)


case("count 普通空 leaf：计 total 不计 filled",
     _count([{"id": "x"}], {}), (1, 0, 0))
case("count 普通已填 leaf：total+filled",
     _count([{"id": "x"}], {"x": {"zh": "v", "confidence": "medium"}}), (1, 1, 0))
case("count 已填 leaf 且 low：low_conf 计数",
     _count([{"id": "x"}], {"x": {"zh": "v", "confidence": "low"}}), (1, 1, 1))
case("count leaf 级 optional 且空：整字段不计 total（[ADR-062] A 桶）",
     _count([{"id": "mc", "optional": True}], {}), (0, 0, 0))
case("count leaf 级 optional 且已填：正常计 total+filled",
     _count([{"id": "mc", "optional": True}], {"mc": {"zh": "v", "confidence": "medium"}}), (1, 1, 0))
case("count 字段级 not_applicable：整字段豁免（[ADR-062]）",
     _count([{"id": "im"}], {"im": {"not_applicable": True}}), (0, 0, 0))
case("count 分组 optional 全空：整组豁免（[ADR-020] 回归护栏）",
     _count([{"id": "d", "optional": True, "fields": [{"id": "a"}, {"id": "b"}]}], {"d": {}}), (0, 0, 0))
case("count 分组 optional 组内有填：整组正常计",
     _count([{"id": "d", "optional": True, "fields": [{"id": "a"}, {"id": "b"}]}],
            {"d": {"a": {"zh": "v", "confidence": "high"}}}), (2, 1, 0))


# ══════════════════════════════════════════════════════════════
# sync.chapter_is_not_applicable(chapter_def, raw_chapter) -> bool
#   gate 整章完成度 / freshness 的短路（[ADR-059]）。
# ══════════════════════════════════════════════════════════════
def _cina(cdef, raw):
    return sync.chapter_is_not_applicable(cdef, raw)


case("chapter-is-NA 真：only_spot 章 + _meta.not_applicable True",
     _cina({"only_spot": True}, {"_meta": {"not_applicable": True}}), True)
case("chapter-is-NA 假：章没标 only_spot（即便数据标了 NA）",
     _cina({}, {"_meta": {"not_applicable": True}}), False)
case("chapter-is-NA 假：only_spot 章但数据未标 NA",
     _cina({"only_spot": True}, {"_meta": {}}), False)
case("chapter-is-NA 假：raw_chapter 为 None",
     _cina({"only_spot": True}, None), False)


# ══════════════════════════════════════════════════════════════
# [ADR-069] ROADMAP §一 防失序：
#   validate.roadmap_nextstep_violations(block) / roadmap_recent_violations(block, limit)
#   —— 并行 worktree 各自重排 §一 子节、git 静默三方合并 → 重号/超窗。取 bool / count。
# ══════════════════════════════════════════════════════════════
def _next_bad(block):
    return bool(validate.roadmap_nextstep_violations(block))


case("nextstep 合法：1..4 连续", _next_bad("1. a\n2. b\n3. c\n4. d\n"), False)
case("nextstep 合法：空列表（无编号行）", _next_bad("完整清单见三节。\n"), False)
case("nextstep 合法：带 ~~划掉~~ 前缀仍算一项", _next_bad("1. ~~done~~ ✅\n2. b\n"), False)
case("nextstep 违规：重号（并行合并残留 1-6,4-6）",
     _next_bad("1. a\n2. b\n3. c\n4. d\n5. e\n6. f\n4. g\n5. h\n6. i\n"), True)
case("nextstep 违规：不连续（缺 3）", _next_bad("1. a\n2. b\n4. d\n"), True)
case("nextstep 违规：不从 1 起", _next_bad("2. a\n3. b\n"), True)
case("nextstep 计数：重号各报一条 + 不连续 → 2 条消息",
     len(validate.roadmap_nextstep_violations("1. a\n1. b\n3. c\n")), 2)
case("nextstep 不误伤：缩进的子编号不计入顶层",
     _next_bad("1. a\n  1. sub\n  2. sub\n2. b\n"), False)


def _recent_bad(block, limit=3):
    return bool(validate.roadmap_recent_violations(block, limit))


case("recent 合法：正好 3 条", _recent_bad("- **2026-09-04 · a** — x\n- **2026-09-03 · b** — y\n- **2026-09-02 · c** — z\n"), False)
case("recent 合法：2 条", _recent_bad("- **a** — x\n- **b** — y\n"), False)
case("recent 违规：9 条（并行各自 prepend 未裁剪）",
     _recent_bad("".join(f"- **{i}** — x\n" for i in range(9))), True)
case("recent 计数：条目数按 `- **` 行首算，正文里的 `- **` 不计",
     len(validate.roadmap_recent_violations("- **a** — 见 `- **b**` 的说明\n- **c** — y\n", 3)), 0)


# ══════════════════════════════════════════════════════════════
# [ADR-069] ADR 编号台账：validate.adr_ledger_violations(decisions_nums, ledger_text)
#   —— DECISIONS 的 ADR 号 ⊆ 台账登记的号；台账 1..max 连续无重复。取 bool / count。
# ══════════════════════════════════════════════════════════════
def _ledger_bad(nums, text):
    return bool(validate.adr_ledger_violations(set(nums), text))


_SEED = "- ADR-001 … ADR-003 · 历史 · pre-ledger\n"
case("ledger 合法：区间行兜住历史 + DECISIONS 都在区间内",
     _ledger_bad([1, 2, 3], _SEED), False)
case("ledger 合法：区间 + 逐条，无缺口无重复",
     _ledger_bad([1, 2, 3, 4], _SEED + "- ADR-004 · x · br · 2026-09-04\n"), False)
case("ledger 违规：DECISIONS 有 ADR-005 但台账没登记",
     _ledger_bad([1, 2, 3, 5], _SEED), True)
case("ledger 违规：逐条行与区间重复登记同一号",
     _ledger_bad([1, 2, 3], _SEED + "- ADR-002 · dup · x · d\n"), True)
case("ledger 违规：编号有缺口（3 之后直接 5）",
     _ledger_bad([], _SEED + "- ADR-005 · x · y · z\n"), True)
case("ledger 不误伤：非登记行（说明文字里的 ADR-029）不计入",
     _ledger_bad([1, 2, 3], _SEED + "真撞了按 [ADR-029] 让号。\n"), False)
case("ledger 计数：缺登记 + 缺口 → 2 条消息",
     len(validate.adr_ledger_violations({7}, _SEED + "- ADR-005 · x · y · z\n")), 2)


# ══════════════════════════════════════════════════════════════
# [ADR-070] OTP 来源登记格式：validate.otp_line_violations(sources_text)
#   —— 复用 fetch.py 的 OTP_LINE_RE/URL_RE 解析同一份正则，一行 [OTP] 必须恰好 2 个 URL。
# ══════════════════════════════════════════════════════════════
def _otp_bad(text):
    return bool(validate.otp_line_violations(text))


case("OTP 合法：两个 URL（GenerateOTP 端点 + 数据端点）",
     _otp_bad("  - x [OTP]: https://a.com/otp?bld=1 https://a.com/data\n"), False)
case("OTP 违规：只有 1 个 URL",
     _otp_bad("  - x [OTP]: https://a.com/otp?bld=1\n"), True)
case("OTP 违规：3 个 URL",
     _otp_bad("  - x [OTP]: https://a.com/o https://a.com/d https://a.com/extra\n"), True)
case("OTP 不误伤：没有 [OTP] 标记的普通行不检查 URL 数",
     _otp_bad("  - 普通页: https://a.com/x\n"), False)
case("OTP 计数：两行各违规各报一条",
     len(validate.otp_line_violations(
         "  - a [OTP]: https://a.com/o\n  - b [OTP]: https://b.com/o\n")), 2)


def main():
    fails = [(n, g, w) for n, g, w in CASES if g != w]
    for n, g, w in CASES:
        mark = "ok  " if g == w else "FAIL"
        line = f"  {mark} {n}"
        if g != w:
            line += f"   got={g!r}  want={w!r}"
        print(line)
    if fails:
        print(f"[selfcheck] {len(fails)}/{len(CASES)} 个不变式用例失配")
        sys.exit(1)
    print(f"[selfcheck] {len(CASES)} 个不变式合成用例全过")


if __name__ == "__main__":
    main()
