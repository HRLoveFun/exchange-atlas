#!/usr/bin/env python3
"""tools/validate.py — 一致性 + 数据质量的全部硬校验

不改任何文件（纯只读）。为了不在这里重写一份"怎么生成文档"的逻辑，
凡是能复用 tools/sync.py 里那批纯函数（render_*、expand_exchange、
build_json_schema...）的地方一律直接 import 复用——这份校验脚本本身
也要遵守 CLAUDE.md 一节的原则：同一件事只在一处实现。

校验项（对应 CLAUDE.md 一节 / PROJECT/DECISIONS.md 相关 ADR）：
  1. 结构校验：每个 exchange 展开后的 JSON 过 sync.build_json_schema() 生成的 schema
  2. exchange_identity 必填字段齐全
  3. 枚举合法：data 里的 enum 值、taxonomy 里的 enum_ref 都必须在 enums.yml 里
  4. volatile/moderate 字段必须有 sources
  5. confidence: high 必须有 quote，且 zh/en 里的数字要能在 quote 里找到（散文按"至少一个
     数字命中"判——挡整条编造；结构化 spec 值按"每个都要命中"判，见第 5b 条）
  5b. confidence: high 且带 spec 子块的字段，spec 里的每个数值都必须能在 quote 里找到
     （spec 是精确定型值，没有 12/24 小时改写、中文数字、含数字的产品名这类噪声，可严判）
  5c. spec 子块自由文本键（note / *_note）里内嵌的数字必须能在本交易所文件内任一字段的
     quote / zh 里找到——不限 confidence（[ADR-054] 复核 8 处 FIX 里 4 处属于这个盲区，
     cn-sse 那次是 medium 连 5b 的高门槛都进不了）。文件级而非同字段（[ADR-058] 收尾修订：
     note 常跨字段交叉引用 price_limits 的阈值等）；日期/时刻/年份/条款号/法规引用号/ADR
     引用等非数值 token 剥离后比对，挡的是「费率/阈值/金额夹带进 note」这类静默错误
  6. verified 不得是未来日期
  7. 来源域名已在 SOURCES.md 登记；且若某 confidence: high 字段的全部来源域名在
     SOURCES.md 都标为「第三方」，直接 fail（CLAUDE.md 二第3条：第三方来源 confidence 上限 medium）
  8. 生成块新鲜度：六处 GENERATED 块内容 == 用 sync.py 同一批函数重新算出来的内容
  9. docs/data/*.json 新鲜度：磁盘内容 == 重新生成的内容（忘了跑 make sync 时报错）
  10. 路径引用：文档里反引号包住、首段是仓库顶层条目的路径必须存在（非仓库路径片段
      如站内相对路径 res/pc/js/x.js 或绝对路径 /tmp/x.html 不属校验对象）
  11. ADR 锚点：DECISIONS.md 里的 ADR 编号不重复；引用处能找到对应编号
"""
import datetime
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync  # noqa: E402  （复用 sync.py 的纯函数，见模块 docstring）

try:
    import jsonschema
except ImportError:
    sys.exit("[check] 缺依赖：pip install -r tools/requirements.txt")

ROOT = sync.ROOT
DOCS_DATA = sync.DOCS_DATA
PROJECT_DIR = sync.PROJECT_DIR
TODAY = sync.TODAY

# 千分位分组 + 可选小数——刻意收紧，避免把 "45,"、"15:30,15:30"、"6.385/76，1976"
# 这类切成 "45,197"、"3015"、"761976" 之类的垃圾 token 混进数字集合（那会让
# quote 反查产生假命中，反而削弱防幻觉能力）。
NUMBER_RE = re.compile(r"\d+(?:,\d{3})*(?:\.\d+)?")
PATH_TOKEN_RE = re.compile(r"`([A-Za-z0-9_.\-/]+(?:/[A-Za-z0-9_.\-]+)+)`")
ADR_DEF_RE = re.compile(r"^### (ADR-\d{3})\b", re.M)
ADR_REF_RE = re.compile(r"\[?(ADR-\d{3})\]?")
SOURCES_DOMAIN_RE = re.compile(r"^-\s+`([a-z0-9.\-]+\.[a-z]{2,})`", re.M)
# 域名行含「官方/监管/第三方」标签的形式：- `domain`（可选括注） | 标签 | 语言 | ...
# 部分"补充登记"行只有域名没有后续管道分隔，靠上面的 SOURCES_DOMAIN_RE 收录、
# 这条匹配不到——不影响：没标签的域名按"非第三方"处理（宽松），不会误报。
SOURCES_TAG_RE = re.compile(
    r"^-\s+`([a-z0-9.\-]+\.[a-z]{2,})`(?:（[^）]*）)?\s*\|\s*([^|]+?)\s*\|", re.M)

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# ── 数值反查复用工具（CLAUDE.md 二.5）─────────────────────────
# A1 (2026-08) 抽出来给两处共用：散文 zh/en 与结构化 spec 值。sync/verify_quotes
# 各有自己的文本规范化，这里只管"从一段文本里抠出可比对的数字集合"。

def numbers_in(text):
    """文本里 ≥2 位有效数字的集合（去千分位逗号后比较）。个位数（T+0/T+1 这类
    受控词表记号）不计——法规原文几乎不会照抄这种写法，拿它反查只会制造噪声。"""
    out = set()
    for m in NUMBER_RE.findall(str(text if text is not None else "")):
        core = m.replace(",", "")
        if len(core.replace(".", "")) >= 2:
            out.add(core)
    return out


def numbers_missing_from_quote(value_texts, quote):
    """value_texts（可迭代的字符串）里出现、但 quote 里找不到的数字集合，
    以及全部数字集合。调用方按场景决定"一个都没命中才报错"还是"缺一个就报错"。"""
    q = str(quote or "").replace(",", "")
    nums = set()
    for t in value_texts:
        nums |= numbers_in(t)
    missing = {n for n in nums if n not in q}
    return nums, missing


def spec_number_strings(spec):
    """递归收集 spec 子块里所有数值型叶子（int/float/纯数字串），转成字符串集合。
    Phase 1 给 market_structure 加 spec 后这条校验才有对象；在那之前是 no-op。"""
    out = []

    def walk(v):
        if isinstance(v, bool):
            return
        if isinstance(v, (int, float)):
            out.append(repr(v) if isinstance(v, float) else str(v))
        elif isinstance(v, str):
            if re.fullmatch(r"-?\d+(?:\.\d+)?%?", v.strip()):
                out.append(v.strip().rstrip("%"))
        elif isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, (list, tuple)):
            for x in v:
                walk(x)

    walk(spec)
    return out


# 5c（[ADR-054] 盲区机器化）：note（及 *_note）等自由文本里不算「数值主张」的 token——
# ISO 日期（2026-04-04）、年月（2025-12）、时刻（09:59:45 / 17:30）、孤立年份（1991 年）、
# ADR / 悬案编号引用（[ADR-035] / OPEN-QUESTIONS #19）、条款号引用（Rule 4702 / §34 /
# 第 62 条）、法规引用号（17 CFR 240.31 / RTS 11 / MiFID II / (EU) 2017/588 /
# Act No. 25 of 2007）。它们是时间背景与出处指针，不是费率/阈值/金额；数字反查挡的是后者。
NOTE_NON_VALUE_RE = re.compile(
    r"\d{4}-\d{1,2}-\d{1,2}"
    r"|\d{4}-\d{1,2}(?!\d)"
    r"|\d{1,2}:\d{2}(?::\d{2})?"
    r"|(?<![\d.])(?:19|20)\d{2}(?![\d.])"
    r"|\[?ADR-\d{3}\]?"
    r"|#\d+"
    r"|(?:Rule|Rules|Section|Sections|Article|Articles|Procedure|Procedures|§)\s*\d[\d.,\-–—/至到和與与]*"
    r"|第\s*\d[\d.,\-–—/、至到和與与]*\s*条?"
    r"|\d{1,3}\s*CFR\s*\d+(?:\.\d+)?"          # 美国联邦法规 17 CFR 240.31
    r"|\bRTS\s*\d+"                             # 欧盟技术标准 RTS 11 / RTS 27
    r"|\bMiFID\s*[IVX]+"                        # MiFID II
    r"|\((?:EU|EC)\)\s*\d{4}/\d+"               # (EU) 2017/588
    r"|(?:Ref|Ref\.|Reference|Circular|通函)\s*[:：]?\s*\d[\d,]*(?:/\d+)?"   # NSE 通函 Ref 66/2024
    r"|\bNo\.?\s*\d[\d,]*"                      # Act No. 25（"of 2007" 由孤立年份规则另剥）
)


def spec_note_strings(spec):
    """递归收集 spec 子块里自由文本键（note / *_note）的字符串，作为 5c 的比对对象；
    数值型叶子已由 5b 严判，这里只管字符串里夹带的数字。"""
    out = []

    def walk(v, key=None):
        if isinstance(v, dict):
            for k, x in v.items():
                walk(x, k)
        elif isinstance(v, (list, tuple)):
            for x in v:
                walk(x, key)
        elif isinstance(v, str) and key and (key == "note" or key.endswith("_note")):
            if not re.fullmatch(r"-?\d+(?:\.\d+)?%?", v.strip()):
                out.append(v)

    walk(spec)
    return out


def collect_verbatim_texts(ex, keys=("quote", "zh")):
    """收集整个交易所展开信封树里所有 quote / zh 字符串——5c 文件级反查用。
    [ADR-058 收尾修订]：note 里的数字只要在本交易所**任意字段**的 quote / zh 里
    出现过就算有原文支撑（note 常跨字段交叉引用，如错误交易规则的 note 引价格笼子
    的百分比、波动性中断的 note 引 price_limits 的走廊阈值）。真造假——把 A 所费率
    写进 B 所字段——在 B 所文件里哪都找不到，仍会被拦。

    `detail` 不进这个**全文件**池子（避免 detail 的叙述性数字大面积削弱反查），但 5c
    调用处会把**本字段自己的 detail** 并进目标——[ADR-045] 起就有「主档费率进 spec/zh、
    次级档进同字段 detail」的既定写法（次级档常无 verbatim quote，放 detail 比塞进 zh
    更符合 §一「zh 不携带 spec 没有的量化事实」）。B7「收紧到 quote+zh」据此校准为
    「全文件 quote/zh + 本字段 detail」。"""
    out = []

    def walk(v):
        if isinstance(v, dict):
            for k, x in v.items():
                if k in keys and isinstance(x, str):
                    out.append(x)
                walk(x)
        elif isinstance(v, (list, tuple)):
            for x in v:
                walk(x)

    walk(ex)
    return out


def note_numbers_in(text):
    """自由文本里 ≥2 位有效数字的集合：先剥离日期/时刻/年份/条款号等非数值 token，
    再跑 NUMBER_RE；紧邻字母的命中（MT30、ZA01、FE10 这类代码记号）不算。"""
    text = NOTE_NON_VALUE_RE.sub(" ", str(text if text is not None else ""))
    out = set()
    for m in NUMBER_RE.finditer(text):
        s, e = m.span()
        if s > 0 and text[s - 1].isalpha():
            continue
        if e < len(text) and text[e].isalpha():
            continue
        core = m.group().replace(",", "")
        if len(core.replace(".", "")) >= 2:
            out.add(core)
    return out


def note_numbers_missing(note_texts, target_texts):
    """note 文本里出现、但目标文本（本交易所文件内所有 quote / zh，任一命中即算
    找到——note 常做跨字段交叉引用）里找不到的数字集合。候选数字的小数尾随零归一后
    比对（0.50 ≡ 0.5）：同一数值的不同书写精度不算夹带。"""
    quotes = [str(q or "").replace(",", "") for q in target_texts]

    def hit(n):
        if any(n in q for q in quotes):
            return True
        if "." in n:
            trimmed = n.rstrip("0").rstrip(".")
            return any(trimmed in q for q in quotes)
        return False

    nums = set()
    for t in note_texts:
        nums |= note_numbers_in(t)
    return nums, {n for n in nums if not hit(n)}



def source_domain_classes(domain, domain_tags):
    """domain 在 SOURCES.md 的标签分类集合：{'primary'} / {'third_party'} / 混合 / 空。
    子域名沿用父域名登记（与"来源域名已登记"校验一致）。"""
    for d, classes in domain_tags.items():
        if domain == d or domain.endswith("." + d):
            return classes
    return set()


# ── 1-7：数据层校验 ──────────────────────────────────────────

def validate_data(taxonomy, enums, raw_exchanges, exchanges_expanded, registered_domains, domain_tags, spec_shapes):
    schema = sync.build_json_schema(taxonomy)
    enum_ids = {name: {v["id"] for v in table.get("values", [])} for name, table in enums.items()}

    # taxonomy 里引用的 enum_ref 必须真的存在于 enums.yml
    for ch in taxonomy["chapters"]:
        if ch.get("kind") == "list":
            continue
        for kind, path, fdef in sync.walk_chapter_fields(ch.get("fields", [])):
            if kind == "leaf" and fdef.get("enum_ref") and fdef["enum_ref"] not in enum_ids:
                err(f"taxonomy.yml: 字段 {ch['id']}.{'.'.join(path)} 的 enum_ref `{fdef['enum_ref']}` 在 enums.yml 里不存在")

    # in_matrix 指向的维度组必须存在，且该组声明的 chapter 必须与字段自身所在
    # 章节一致——防止字段被标进不属于自己章节的矩阵组（如 membership_structure
    # 定义在 participants 章却被标进 overview 组，ADR-022 之前的真实事故）
    group_chapter = {g["id"]: g.get("chapter") for g in taxonomy.get("dimension_groups", [])}
    for ch in taxonomy["chapters"]:
        if ch.get("kind") == "list":
            continue
        for kind, path, fdef in sync.walk_chapter_fields(ch.get("fields", [])):
            if kind != "leaf" or not fdef.get("in_matrix"):
                continue
            group_id = fdef["in_matrix"]
            field_path = f"{ch['id']}.{'.'.join(path)}"
            if group_id not in group_chapter:
                err(f"taxonomy.yml: 字段 {field_path} 的 in_matrix `{group_id}` 在 dimension_groups 里不存在")
            elif group_chapter[group_id] != ch["id"]:
                err(f"taxonomy.yml: 字段 {field_path} 的 in_matrix `{group_id}` 属于章节 `{group_chapter[group_id]}`，"
                    f"与字段自身所在章节 `{ch['id']}` 不一致")

    for eid, raw in raw_exchanges.items():
        ex = exchanges_expanded[eid]
        # 5c 文件级反查池：本交易所所有字段的 quote / zh（[ADR-058] 收尾修订）
        verbatim_pool = collect_verbatim_texts(ex)

        # 结构校验
        try:
            jsonschema.validate(instance=ex, schema=schema)
        except jsonschema.ValidationError as e:
            err(f"{eid}: 结构不符合 taxonomy 派生的 schema —— {e.message}（路径 {'/'.join(str(p) for p in e.path)}）")

        # exchange_identity 必填
        for field in sync.REQUIRED_IDENTITY_FIELDS:
            if not raw.get(field):
                err(f"{eid}: 缺必填的身份字段 `{field}`")

        # 逐字段语义校验
        for ch in taxonomy["chapters"]:
            if ch.get("kind") == "list":
                continue
            for kind, path, fdef in sync.walk_chapter_fields(ch.get("fields", [])):
                if kind != "leaf":
                    continue
                env = sync.get_by_path(ex["chapters"][ch["id"]], path)
                if not env or not env.get("zh"):
                    continue
                loc = f"{eid}: {ch['id']}.{'.'.join(path)}"

                # enum 合法性
                enum_ref = fdef.get("enum_ref")
                if env.get("enum") is not None and enum_ref:
                    if env["enum"] not in enum_ids.get(enum_ref, set()):
                        err(f"{loc}: enum 值 `{env['enum']}` 不在词表 `{enum_ref}` 里")

                # spec 结构校验（[ADR-035] B）：spec 必须是 dict；每个键都要在
                # schema/spec.yml 里声明过（挡拼写错）。深层形态合法性暂不强校验。
                if env.get("spec") is not None:
                    spec = env["spec"]
                    field_key = f"{ch['id']}.{'.'.join(path)}"
                    shape = spec_shapes.get(field_key)
                    if not isinstance(spec, dict):
                        err(f"{loc}: spec 必须是 dict，实际是 {type(spec).__name__}")
                    elif shape is None:
                        err(f"{loc}: 字段有 spec 但 schema/spec.yml 里没有它的形状定义")
                    else:
                        declared = set(shape.get("keys") or {})
                        for k in spec:
                            if k not in declared:
                                err(f"{loc}: spec 里的键 `{k}` 未在 schema/spec.yml 声明"
                                    f"（拼写错？可用键：{sorted(declared)}）")

                        # 5c：note（及 *_note）自由文本里内嵌的数字反查。不限 confidence——
                        # [ADR-054] 复核 8 处 FIX 里 4 处属于这个盲区（cn-sse 夹带深交所
                        # 费率那次是 medium，连 5b 的高门槛都进不了）。[ADR-058] 收尾修订：
                        # 命中范围从「同字段 quote/zh/detail」放宽到「本交易所文件内所有
                        # quote/zh + 本字段 detail」——note 常跨字段交叉引用（错误交易规则的
                        # note 引价格笼子百分比、波动性中断的 note 引 price_limits 走廊阈值），
                        # 同文件复述已核实数字不算夹带；跨所造假（A 所费率写进 B 所字段）在
                        # B 所文件里仍找不到、照样拦。全文件池只含 quote/zh（不含 detail 的
                        # 叙述性数字），本字段自己的 detail 单独并进（见 collect_verbatim_texts）。
                        note_texts = spec_note_strings(spec)
                        if note_texts:
                            _, note_missing = note_numbers_missing(
                                note_texts, verbatim_pool + [env.get("detail")])
                            if note_missing:
                                err(f"{loc}: spec 的 note 里内嵌的数字 {sorted(note_missing)} "
                                    f"在本交易所任何字段的 quote/zh（或本字段 detail）里都找不到"
                                    f"——note 不得夹带无原文支撑的数字（CLAUDE.md 二.5，"
                                    f"[ADR-054]/[ADR-058] 确立的维度）")

                # en_required 字段必须填 en——此前这个 taxonomy 标记从未被机器校验过，
                # 导致标了 en_required 的专有名词类字段（机制名/板块名/法规名等）静默
                # 缺英文，英文模式下前端会回退显示中文（见 app.js 的 langMode 回退逻辑），
                # 这正是「中英夹杂」问题的根源之一，2026-08-20 补上强制校验
                if fdef.get("en_required") and not env.get("en"):
                    err(f"{loc}: en_required 但没有 en（英文模式下会回退显示中文，见 CLAUDE.md/ADR-013）")

                # volatile/moderate 必须有 sources
                vol = fdef.get("volatility", "moderate")
                if vol in ("moderate", "volatile") and not env.get("sources"):
                    err(f"{loc}: volatility={vol} 但没有 sources（见 CLAUDE.md 二 第2条）")

                # confidence: high 必须有 quote，且数字要对得上
                if env.get("confidence") == "high":
                    if not env.get("quote"):
                        err(f"{loc}: confidence: high 但缺 quote（见 CLAUDE.md 二 第5条）")
                    else:
                        # 散文 zh/en：只要求"至少一个 ≥2 位数字在 quote 里能找到"。
                        # 挡的是"整条数值都与原文对不上"（编造/张冠李戴）。改成"每个数字都
                        # 要命中"实测在真实数据上会产生 200+ 假阳性——12/24 小时制改写、
                        # 中文数字、含数字的产品名（MT30、Nifty 50）、小数点/千分位习惯、
                        # 多来源综合的叙述性字段都会中招（见 OPEN-QUESTIONS #12）。真正
                        # 精确的数值反查放在 spec 子块（下方 5b），那里没有这些噪声。
                        nums, missing = numbers_missing_from_quote(
                            [env.get("zh"), env.get("en")], env["quote"])
                        if nums and missing == nums:
                            err(f"{loc}: zh/en 里的数字 {sorted(nums)} 在 quote 里一个都找不到——数值可能与原文对不上")

                        # 5b：结构化 spec 值按"每个都要命中"严判。spec 是精确定型值
                        # （limit_pct: 10、threshold_pct: 7 …），不含时间改写/中文数字/
                        # 含数字的名称这类噪声，可以严。Phase 1 给 market_structure 加
                        # spec 后这条才有对象，在那之前 spec_number_strings() 返回空。
                        if env.get("spec") is not None:
                            spec_nums = spec_number_strings(env["spec"])
                            _, spec_missing = numbers_missing_from_quote(spec_nums, env["quote"])
                            if spec_missing:
                                err(f"{loc}: spec 里的数值 {sorted(spec_missing)} 在 quote 里找不到"
                                    f"——结构化值必须逐字有原文支撑（CLAUDE.md 二.5）")

                    # 第三方来源封顶：CLAUDE.md 二第3条——只有直接读到官方原始文本才能标
                    # high。若某 high 字段的"每个"来源域名在 SOURCES.md 都标为「第三方」，
                    # 就是违规（有一个官方/监管/未标签来源即放行，宽松取并集）。
                    src_domains = [
                        urlparse(s["url"]).netloc.lower()
                        for s in (env.get("sources") or [])
                        if isinstance(s, dict) and s.get("url")
                    ]
                    if src_domains:
                        per = [source_domain_classes(d, domain_tags) for d in src_domains]
                        if all(c == {"third_party"} for c in per):
                            err(f"{loc}: confidence: high 但全部来源域名在 SOURCES.md 标为「第三方」"
                                f"（CLAUDE.md 二第3条：第三方来源 confidence 上限为 medium）")

                # verified 不得是未来日期
                verified = env.get("verified")
                if verified:
                    try:
                        if datetime.date.fromisoformat(str(verified)) > TODAY:
                            err(f"{loc}: verified={verified} 是未来日期")
                    except ValueError:
                        err(f"{loc}: verified=`{verified}` 不是合法的 YYYY-MM-DD 日期")

                # 来源域名已登记
                for s in (env.get("sources") or []):
                    url = s.get("url") if isinstance(s, dict) else None
                    if not url:
                        continue
                    domain = urlparse(url).netloc.lower()
                    if domain and not any(domain == d or domain.endswith("." + d) for d in registered_domains):
                        err(f"{loc}: 来源域名 `{domain}` 没有在 PROJECT/SOURCES.md 登记")


# ── 8：文档 GENERATED 块新鲜度 ────────────────────────────────

def extract_generated_block(text, name):
    m = re.search(
        r"<!-- BEGIN:GENERATED " + re.escape(name) + r" -->\n(.*?)\n<!-- END:GENERATED " + re.escape(name) + r" -->",
        text, re.S,
    )
    return m.group(1) if m else None


def validate_generated_blocks(taxonomy, glossary, enums, raw_exchanges, exchanges_expanded):
    matrix_cells, freshness_rows = [], []
    for eid, ex in exchanges_expanded.items():
        matrix_cells += sync.collect_matrix_cells(eid, taxonomy, ex["chapters"])
        freshness_rows += sync.compute_freshness(eid, taxonomy, ex["chapters"])
    enum_label_maps = sync.build_enum_label_maps(enums)

    checks = [
        (ROOT / "README.md", "exchange-list", sync.render_exchange_list(exchanges_expanded, enum_label_maps)),
        (ROOT / "README.en.md", "exchange-list", sync.render_exchange_list(exchanges_expanded, enum_label_maps, lang="en")),
        (PROJECT_DIR / "ROADMAP.md", "progress-matrix", sync.render_progress_matrix(taxonomy, raw_exchanges, exchanges_expanded)),
        (PROJECT_DIR / "ROADMAP.md", "health-summary", sync.render_health_summary(freshness_rows)),
        (PROJECT_DIR / "OPEN-QUESTIONS.md", "auto-issues", sync.render_auto_issues(taxonomy, raw_exchanges, exchanges_expanded)),
    ]
    for path, name, expected in checks:
        text = path.read_text(encoding="utf-8")
        actual = extract_generated_block(text, name)
        if actual is None:
            err(f"{path.relative_to(ROOT)}: 找不到 GENERATED 块 `{name}`")
        elif actual.strip() != expected.strip():
            err(f"{path.relative_to(ROOT)}: GENERATED 块 `{name}` 已过期，跑 `make sync` 重新生成")

    glossary_md = (PROJECT_DIR / "GLOSSARY.md").read_text(encoding="utf-8")
    expected_glossary = sync.render_glossary_md(glossary) + "\n"
    if glossary_md != expected_glossary:
        err("PROJECT/GLOSSARY.md 已过期（应由 schema/glossary.yml 全量生成），跑 `make sync` 重新生成")


def validate_docs_data_fresh(taxonomy, glossary, enums, exchanges_expanded):
    """docs/data/*.json 是否与重新生成的结果一致（防止手改产物或忘了 sync）。"""
    def load(name):
        p = DOCS_DATA / name
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None

    manifest = load("manifest.json")
    if manifest is None:
        err("docs/data/manifest.json 不存在，跑 `make sync`")
        return
    expected_chapter_ids = [c["id"] for c in taxonomy["chapters"]]
    actual_chapter_ids = [c["id"] for c in manifest.get("chapters", [])]
    if expected_chapter_ids != actual_chapter_ids:
        err("docs/data/manifest.json 的章节列表与 taxonomy.yml 不一致，跑 `make sync`")

    expected_names = {f"{eid}.json" for eid in exchanges_expanded}
    actual_names = {p.name for p in (DOCS_DATA / "exchanges").glob("*.json")} if (DOCS_DATA / "exchanges").exists() else set()
    if expected_names != actual_names:
        err(f"docs/data/exchanges/ 与 data/exchanges/ 对不上（跑 make sync）：应有 {sorted(expected_names)}，实际 {sorted(actual_names)}")
    else:
        for eid, ex in exchanges_expanded.items():
            on_disk = load(f"exchanges/{eid}.json")
            # ex 来自 YAML，日期字段可能是 datetime.date 对象；圈一遍 JSON 往返
            # 把它归一成和磁盘上同样的原生类型再比，否则语义相同也会假性报错。
            ex_normalized = json.loads(sync.dump_json(ex))
            if on_disk != ex_normalized:
                err(f"docs/data/exchanges/{eid}.json 与权威数据不一致，跑 `make sync` 重新生成")


# ── 10-11：文档内部引用 ────────────────────────────────────────

def validate_path_references():
    skip_dirs = {".git", ".cache", "node_modules", "worktrees"}
    md_files = [p for p in ROOT.rglob("*.md") if not any(part in skip_dirs for part in p.parts)]
    known_ext = (".yml", ".yaml", ".py", ".json", ".md", ".html", ".js", ".css", ".txt")
    # 只把"首段是仓库顶层条目"的 token 当作仓库内路径校验。反引号里以已知扩展名结尾的
    # 字符串还有别的来源：站内相对路径片段（res/pc/js/func.js）、别的网站/仓库的路径、
    # 绝对路径示例（/tmp/x.html）——这些不是本校验的对象，此前会被误报（见 OPEN-QUESTIONS
    # 已删除的 #35 与 ADR-029 顺带修复）。`.cache/` 内容不入库（ADR-002），文档里写
    # `.cache/<id>/_manifest.json` 这类是示意路径，同样跳过。
    top_level = {p.name for p in ROOT.iterdir()} - skip_dirs
    for md in md_files:
        text = md.read_text(encoding="utf-8")
        for token in PATH_TOKEN_RE.findall(text):
            if token.startswith(("http:", "https:")) or " " in token:
                continue
            if not (token.endswith(known_ext) or token.endswith("/")):
                continue
            segs = [s for s in token.rstrip("/").split("/") if s]
            if not segs or ".." in segs or segs[0] not in top_level:
                continue
            candidate = ROOT / token.rstrip("/")
            if not candidate.exists():
                err(f"{md.relative_to(ROOT)}: 引用的路径 `{token}` 在仓库里不存在（改名/删除后忘了改文档？）")


def validate_adr_anchors():
    decisions_path = PROJECT_DIR / "DECISIONS.md"
    if not decisions_path.exists():
        return
    text = decisions_path.read_text(encoding="utf-8")
    defined = ADR_DEF_RE.findall(text)
    dupes = {x for x in defined if defined.count(x) > 1}
    if dupes:
        err(f"PROJECT/DECISIONS.md: ADR 编号重复 {sorted(dupes)}")
    defined_set = set(defined)

    skip_dirs = {".git", ".cache", "node_modules", "worktrees"}
    for md in ROOT.rglob("*.md"):
        if any(part in skip_dirs for part in md.parts) or md == decisions_path:
            continue
        for ref in ADR_REF_RE.findall(md.read_text(encoding="utf-8")):
            if ref not in defined_set:
                err(f"{md.relative_to(ROOT)}: 引用了不存在的 `{ref}`（DECISIONS.md 里没有这条）")


# ── 主流程 ────────────────────────────────────────────────

def main():
    taxonomy, glossary, enums, raw_exchanges = sync.load_all()
    exchanges_expanded = {eid: sync.expand_exchange(taxonomy, raw) for eid, raw in raw_exchanges.items()}

    sources_text = (PROJECT_DIR / "SOURCES.md").read_text(encoding="utf-8") if (PROJECT_DIR / "SOURCES.md").exists() else ""
    registered_domains = set(SOURCES_DOMAIN_RE.findall(sources_text))

    # domain -> {'primary'} / {'third_party'} / 混合。标签形如「官方」「监管」「第三方」，
    # 后面可跟括注（「官方（清算机构）」「第三方（官方媒体）」等），取首词判定。
    domain_tags = {}
    for dom, tag in SOURCES_TAG_RE.findall(sources_text):
        tag = tag.strip()
        if tag.startswith("第三方"):
            cls = "third_party"
        elif tag.startswith(("官方", "监管")):
            cls = "primary"
        else:
            cls = "primary"  # 标签格式不符时按宽松处理，不制造假的第三方封顶报错
        domain_tags.setdefault(dom, set()).add(cls)

    spec_path = ROOT / "schema" / "spec.yml"
    spec_shapes = (sync.load_yaml(spec_path).get("fields") if spec_path.exists() else None) or {}

    validate_data(taxonomy, enums, raw_exchanges, exchanges_expanded, registered_domains, domain_tags, spec_shapes)
    validate_generated_blocks(taxonomy, glossary, enums, raw_exchanges, exchanges_expanded)
    validate_docs_data_fresh(taxonomy, glossary, enums, exchanges_expanded)
    validate_path_references()
    validate_adr_anchors()

    if warnings:
        print(f"[check] {len(warnings)} 条警告：")
        for w in warnings:
            print(f"  ⚠ {w}")
    if errors:
        print(f"\n[check] {len(errors)} 条错误：")
        for e in errors:
            print(f"  ✗ {e}")
        print(f"\n[check] 失败。{len(errors)} 个问题需要修，{len(exchanges_expanded)} 家交易所已扫描。")
        sys.exit(1)

    print(f"[check] 通过。{len(exchanges_expanded)} 家交易所，{len(warnings)} 条警告，0 条错误。")


if __name__ == "__main__":
    main()
