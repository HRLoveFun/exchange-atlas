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
