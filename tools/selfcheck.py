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
# [ADR-076] ADR 占位符定号：
#   validate.pending_adr_placeholder_violations(text)
#   —— 分支开工写 ADR-PENDING-<slug> 占位符代替具体数字号，合并前才由
#   tools/assign_adr_number.py 定号；main 上残留是错误、分支上只警告
#   （严重程度判定在 validate_no_pending_adr_placeholders 里，不在这个纯函数）。
# ══════════════════════════════════════════════════════════════
def _pending(slug):
    """拼出 `ADR-PENDING-<slug>`：不能在这写死完整字面量，否则这个测试文件自己会被
    validate_no_pending_adr_placeholders 的仓库级扫描当成真占位符误报（[ADR-076]）。"""
    return f"ADR-PENDING-{slug}"


case("pending 合法：正文没有占位符",
     validate.pending_adr_placeholder_violations("### ADR-076 — 正常已定号的标题\n"), [])
case("pending 违规：标题带占位符",
     validate.pending_adr_placeholder_violations(
         f"### {_pending('td-axis-labels')} — 剖面零轴刻度\n"), [_pending("td-axis-labels")])
case("pending 违规：正文引用也算，不只是标题",
     validate.pending_adr_placeholder_violations(
         f"见 [{_pending('foo')}] 的讨论。\n"), [_pending("foo")])
case("pending 去重：同一占位符出现多次只报一条",
     validate.pending_adr_placeholder_violations(
         f"### {_pending('foo')} — x\n\n见 [{_pending('foo')}]。\n"), [_pending("foo")])
case("pending 计数：两个不同占位符各报一条，按字典序排",
     validate.pending_adr_placeholder_violations(
         f"[{_pending('zzz')}] 与 [{_pending('aaa')}]\n"),
     sorted([_pending("aaa"), _pending("zzz")]))
case("pending 不误伤：已定号的普通 ADR 编号不匹配",
     validate.pending_adr_placeholder_violations("[ADR-069] 与 ### ADR-070 — 标题\n"), [])


# ══════════════════════════════════════════════════════════════
# [ADR-075] OTP 来源登记格式：validate.otp_line_violations(sources_text)
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


# ══════════════════════════════════════════════════════════════
# [ADR-077] 来源分片配对：
#   validate.sources_pairing_violations(data_ids, source_ids)
#   —— data/exchanges/*.yml 与 PROJECT/sources/*.md 一一对应。
# ══════════════════════════════════════════════════════════════
def _pair_bad(d, s):
    return bool(validate.sources_pairing_violations(set(d), set(s)))


case("pairing 合法：两侧完全一致", _pair_bad(["a", "b"], ["b", "a"]), False)
case("pairing 合法：两侧皆空", _pair_bad([], []), False)
case("pairing 违规：data 多出（漏建分片）", _pair_bad(["a", "b"], ["a"]), True)
case("pairing 违规：sources 多出（孤儿分片）", _pair_bad(["a"], ["a", "b"]), True)
case("pairing 违规：两侧各多出一个互不相同", _pair_bad(["a", "x"], ["a", "y"]), True)
case("pairing 计数：缺分片 + 孤儿分片 → 2 条消息",
     len(validate.sources_pairing_violations({"a", "x"}, {"a", "y"})), 2)


# ══════════════════════════════════════════════════════════════
# [ADR-077] INBOX 一句话上限：
#   validate.inbox_line_violations(text, maxlen=200)
#   —— 「待折叠」区每条 `- ` 行 ≤200 字；只限行长、不限堆积条数。
# ══════════════════════════════════════════════════════════════
_INBOX_TMPL = "# INBOX\n\n## 待折叠\n\n{body}\n\n## 下一节\n"
case("inbox 合法：短行",
     validate.inbox_line_violations(_INBOX_TMPL.format(body="- 2026-09-05 · 一句话 · [ADR-001] · main")), [])
case("inbox 违规：单行超 200 字",
     len(validate.inbox_line_violations(_INBOX_TMPL.format(body="- " + "字" * 201))), 1)
case("inbox 合法：恰好 200 字（含 `- ` 前缀）",
     validate.inbox_line_violations(_INBOX_TMPL.format(body="- " + "字" * 198)), [])
case("inbox 不误伤：长文本在 `- ` 行之外的说明段落",
     validate.inbox_line_violations(_INBOX_TMPL.format(body="普通段落 " + "字" * 300)), [])
case("inbox 不误伤：「待折叠」小节之外的长行",
     validate.inbox_line_violations("# INBOX\n\n## 其他\n\n- " + "字" * 300 + "\n"), [])
case("inbox 合法：没有「待折叠」小节", validate.inbox_line_violations("# INBOX\n"), [])
case("inbox 计数：两行超限各报一条",
     len(validate.inbox_line_violations(_INBOX_TMPL.format(body="- " + "字" * 201 + "\n- " + "字" * 202))), 2)
case("inbox 自定义上限：maxlen=10 时 11 字的行违规",
     len(validate.inbox_line_violations(_INBOX_TMPL.format(body="- 这是一句普通长度的话"), maxlen=10)), 1)


# ══════════════════════════════════════════════════════════════
# [ADR-082] 任务三棒 0 · spec 形状两侧同源：
#   validate.derivatives_spec_shape_violations(spec_shapes)
#   —— market_structure.derivatives.* 形状必须与现货侧顶层同名形状内容一致
#   （spec.yml 里用 YAML anchor 复用）。取违规消息列表。
# ══════════════════════════════════════════════════════════════
def _dv_shapes(shapes):
    return validate.derivatives_spec_shape_violations(shapes)


case("deriv-spec-shape 合法：anchor 复用（两侧内容一致）",
     _dv_shapes({"market_structure.circuit_breaker": {"keys": {"type": "x"}},
                 "market_structure.derivatives.circuit_breaker": {"keys": {"type": "x"}}}), [])
case("deriv-spec-shape 违规：顶层形状不存在",
     len(_dv_shapes({"market_structure.derivatives.circuit_breaker": {"keys": {}}})), 1)
case("deriv-spec-shape 违规：两侧漂移（改了顶层忘同步 derivatives）",
     _dv_shapes({"market_structure.circuit_breaker": {"keys": {"type": "x"}},
                 "market_structure.derivatives.circuit_breaker": {"keys": {"type": "y"}}}),
     ["schema/spec.yml: `market_structure.derivatives.circuit_breaker` 与顶层"
      " `market_structure.circuit_breaker` 形状不一致——derivatives 侧必须用"
      " YAML anchor（*别名）复用顶层形状，不得手抄"])
case("deriv-spec-shape 计数：多条漂移各报一条",
     len(_dv_shapes({"market_structure.tick_size": {"keys": {"a": 1}},
                     "market_structure.derivatives.tick_size": {"keys": {"a": 2}},
                     "market_structure.derivatives.order_types": {"keys": {}}})), 2)
case("deriv-spec-shape 不误伤：纯顶层形状 / 非 derivatives 前缀不检查",
     _dv_shapes({"market_structure.tick_size": {"keys": {}},
                 "costs.stamp_duty": {"keys": {}}}), [])


# ══════════════════════════════════════════════════════════════
# [ADR-084] DECISIONS.md 归档阈值提醒：
#   validate.decisions_length_violations(text, maxlines=...)
#   —— 单文件行数超阈值时 warn（不 err），提醒该拆 DECISIONS-ARCHIVE.md 了。
# ══════════════════════════════════════════════════════════════
case("decisions-length 合法：远未到阈值",
     validate.decisions_length_violations("一\n二\n三\n", maxlines=10), [])
case("decisions-length 合法：恰好等于阈值",
     validate.decisions_length_violations("行\n" * 10, maxlines=10), [])
case("decisions-length 违规：超过阈值一行",
     len(validate.decisions_length_violations("行\n" * 11, maxlines=10)), 1)
case("decisions-length 消息含实际行数与阈值",
     "11 行" in validate.decisions_length_violations("行\n" * 11, maxlines=10)[0]
     and "10" in validate.decisions_length_violations("行\n" * 11, maxlines=10)[0], True)
case("decisions-length 默认阈值 3500 行下不误报当前体量",
     validate.decisions_length_violations("行\n" * 3000), [])


# ══════════════════════════════════════════════════════════════
# [ADR-060] 任务五③ · stale 复核提醒：validate.stale_field_warnings(freshness_rows)
#   —— 当前全库 stale 为 0、真实数据触发不到任何分支，行为全靠这里的合成用例锁。
# ══════════════════════════════════════════════════════════════
def _row(**kw):
    base = {"exchange_id": "ex", "label_zh": "某字段", "field_path": "a.b",
            "volatility": "stable", "verified": "2026-01-01",
            "age_days": 100, "stale": False}
    base.update(kw)
    return base


case("stale 零输出：空列表", validate.stale_field_warnings([]), [])
case("stale 零输出：全部 fresh（含高龄但未超阈值的行）",
     validate.stale_field_warnings([_row(), _row(age_days=700)]), [])
case("stale 超期：报头 + 每字段一行（共 2 条）",
     len(validate.stale_field_warnings([_row(stale=True, age_days=800)])), 2)
case("stale 超期行内容：交易所 id / 字段路径 / 天数都在消息里",
     "ex" in validate.stale_field_warnings([_row(stale=True, age_days=800)])[1]
     and "a.b" in validate.stale_field_warnings([_row(stale=True, age_days=800)])[1]
     and "800" in validate.stale_field_warnings([_row(stale=True, age_days=800)])[1], True)
case("stale 未记 verified：单独归类为「无法判定」，不冒充超期天数",
     "未记 verified" in validate.stale_field_warnings(
         [_row(stale=True, verified=None, age_days=None)])[1], True)
case("stale 排序：超期久的排前面",
     validate.stale_field_warnings([_row(exchange_id="new", stale=True, age_days=100),
                                    _row(exchange_id="old", stale=True, age_days=900)])[1]
     .startswith("`old`"), True)
case("stale 头部计数：两条超期在头部汇总为 2",
     "2 个已填字段超过复核阈值" in validate.stale_field_warnings(
         [_row(exchange_id="a", stale=True, age_days=100),
          _row(exchange_id="b", stale=True, age_days=200)])[0], True)
case("stale 不误伤：stale=False 的高龄行不进清单",
     validate.stale_field_warnings([_row(age_days=900, stale=False)]), [])
case("stale 混合：超期 + 未记 verified 两组都在，头部都提到",
     ("超过复核阈值" in validate.stale_field_warnings(
         [_row(exchange_id="a", stale=True, age_days=100),
          _row(exchange_id="b", stale=True, verified=None, age_days=None)])[0]
      and "无法判定" in validate.stale_field_warnings(
          [_row(exchange_id="a", stale=True, age_days=100),
           _row(exchange_id="b", stale=True, verified=None, age_days=None)])[0]), True)


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
