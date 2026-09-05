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
  5d. spec.rate_raw（[ADR-071]）：原文以非阿拉伯数字给费率时（「千分之三」/「0,25%」），
     rate 填人工转写值、rate_raw 存原文逐字串——校验 rate_raw 是本字段 quote 的 verbatim
     子串（挡「转写」名义下的编造）+ rate 为数值 + ASCII 纯数字型再机器比对 rate；
     5b 相应豁免带 rate_raw 字段的顶层 rate 数值反查
  6. verified 不得是未来日期
  7. 来源域名已在 SOURCES.md 登记；且若某 confidence: high 字段的全部来源域名在
     SOURCES.md 都标为「第三方」，直接 fail（CLAUDE.md 二第3条：第三方来源 confidence 上限 medium）
  8. 生成块新鲜度：八处 GENERATED 块内容 == 用 sync.py 同一批函数重新算出来的内容
  9. docs/data/*.json 新鲜度：磁盘内容 == 重新生成的内容（忘了跑 make sync 时报错）
  10. 路径引用：文档里反引号包住、首段是仓库顶层条目的路径必须存在（非仓库路径片段
      如站内相对路径 res/pc/js/x.js 或绝对路径 /tmp/x.html 不属校验对象）
  11. ADR 锚点：DECISIONS.md 里的 ADR 编号不重复；全库 .md/.py/.yml/.js/.css/.json 里
      的引用处都能找到对应编号（[ADR-077] 扩面到非 .md）
  12. ROADMAP §一 防失序（[ADR-069]）：「下一步」编号 1..n 连续无重复、「最近完成」不超
      滚动窗口（并行 worktree 各自重排该子节，git 静默三方合并 → 重号/超窗）
  13. 冲突标记：任何入库文本文件不得残留 git 合并冲突标记（<<<<<<< / ||||||| / >>>>>>>）
  14. ADR 台账（[ADR-069]）：DECISIONS.md 每条 ### ADR-NNN 都在 PROJECT/ADR-LEDGER.md
      登记过；台账编号 1..max 连续、不重复（并行分支预支编号必撞的护栏）
  15. OTP 来源登记格式（[ADR-075]）：SOURCES.md 里含 `[OTP]` 标记的登记行必须恰好 2 个
      URL（GenerateOTP 端点 + 数据端点，见 tools/fetch.py 文首），否则 fetch.py 抓取时
      才会 sys.exit——挪到 make check 提前拦，别等抓取现场才发现登记写错了
  16. ADR 占位符定号（[ADR-076]）：`ADR-PENDING-<slug>` 占位符
      出现在 main 上直接 fail（合并前必须先跑 `tools/assign_adr_number.py` 定号）；
      出现在其他分支上只警告——占位符本就是分支未合并前的正常中间态，见
      `PROJECT/ADR-LEDGER.md`
  17. 来源分片配对（[ADR-077]）：`data/exchanges/*.yml` 与
      `PROJECT/sources/*.md` 必须一一对应——任一侧多出（漏建分片 / 孤儿分片）即报错
  18. INBOX 一句话上限（[ADR-077]）：`ROADMAP-INBOX.md`「待折叠」区每条
      `- ` 行不得超过 200 字——白纸黑字的「一行一条一句话」约定加机器上限，挡它
      静默膨胀成第二份详版（只限行长度，不限堆积条数：堆积是协调者未及时折叠所致，
      拿它挡后台任务自己的 make build 会误伤错误的人）
"""
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync  # noqa: E402  （复用 sync.py 的纯函数，见模块 docstring）
import fetch as fetchmod  # noqa: E402  （复用 fetch.py 的 [OTP] 行解析正则，见校验项 15）

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
# git 合并冲突标记：`<<<<<<< `、`||||||| `、`>>>>>>> ` 三种带尾随空格 + 标签，
# 误报率接近零（裸 `=======` 会撞 rst/markdown 标题，故不收）。并行分支未清冲突
# 即入库的护栏（2026-09-04 PR #61/#62 的教训之一，见 [ADR-069]）。
CONFLICT_MARKER_RE = re.compile(r"^(?:<{7}|\|{7}|>{7}) ", re.M)
# ADR-LEDGER.md 的登记行：区间行 `- ADR-001 … ADR-068 · ...` 兜住建台账前的历史条目，
# 之后逐条 `- ADR-069 · ...`。见 [ADR-069]。
LEDGER_RANGE_RE = re.compile(r"ADR-(\d{3})\s*(?:…|\.\.\.|—|~)\s*ADR-(\d{3})")
LEDGER_SINGLE_RE = re.compile(r"^-\s*ADR-(\d{3})\b")
# ADR-PENDING-<slug> 占位符（[ADR-076]）：分支开工时不再预支
# 具体数字号（那样几条并行分支几乎必撞，PR69-72 一批连撞四次），改用占位符，合并前
# 由 tools/assign_adr_number.py 按 main 当前台账定号。main 上残留即错；分支上只是
# 未合并前的正常中间态，只警告不挡该分支自己的 make build。
PENDING_ADR_RE = re.compile(r"ADR-PENDING-[A-Za-z0-9][A-Za-z0-9_-]*")
SOURCES_DOMAIN_RE = re.compile(r"^-\s+`([a-z0-9.\-]+\.[a-z]{2,})`", re.M)
# 域名行含「官方/监管/第三方」标签的形式：- `domain`（可选括注） | 标签 | 语言 | ...
# 部分"补充登记"行只有域名没有后续管道分隔，靠上面的 SOURCES_DOMAIN_RE 收录、
# 这条匹配不到——不影响：没标签的域名按"非第三方"处理（宽松），不会误报。
SOURCES_TAG_RE = re.compile(
    r"^-\s+`([a-z0-9.\-]+\.[a-z]{2,})`(?:（[^）]*）)?\s*\|\s*([^|]+?)\s*\|", re.M)

errors = []
warnings = []

# 忽略的目录，按 ROOT 相对路径判定——关键：ROOT 本身可能就在
# `.claude/worktrees/<name>/` 里（validate 跑在 worktree 分支上做合并前校验），
# 此时绝对路径 parts 会含 "worktrees"，用绝对 parts 判会把整个仓库跳过（[ADR-069]）。
SKIP_DIRS = {".git", ".cache", "node_modules", "worktrees"}


def under_skip_dir(p):
    try:
        rel_parts = p.relative_to(ROOT).parts
    except ValueError:
        rel_parts = p.parts
    return any(part in SKIP_DIRS for part in rel_parts)


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def field_na_violations(loc, fenv, fdef_optional):
    """字段级 not_applicable 标记的两条不变式（[ADR-060] 任务一实装）。返回违规消息列表
    （空 = 合法），供 validate_data 与正负向探针共用同一判定逻辑：

      1. 标 not_applicable: true 的字段不得再有 zh——与 only_spot 章节级同构（[ADR-059]），
         "不适用" = 干净空，占位散文应清掉（若某字段既标 N/A 又留 zh，两套信号打架）。
      2. 同一字段不得同时带 taxonomy 侧 leaf `optional` 与 data 侧 `not_applicable`——
         前者语义"空不算缺口、可回填"（A 桶 overview 指标），后者"本所设计前提不成立"
         （B/D 桶），一个字段同时标两层是模型混乱，改标一层。
    """
    out = []
    if fenv.get("not_applicable") is not True:
        return out
    if fenv.get("zh"):
        out.append(f"{loc}: 字段标了 not_applicable: true 但仍带 zh——N/A 字段应清空占位内容"
                    f"（[ADR-060]）")
    if fdef_optional:
        out.append(f"{loc}: taxonomy 侧 leaf 已标 optional: true，data 侧又标 not_applicable——"
                    f"两层标记不同时生效（[ADR-060]）")
    return out


def chapter_na_violations(loc, ch_id, meta_not_applicable, is_only_spot, zh_leaf_paths):
    """章节级 not_applicable 标记的两条不变式（[ADR-036] #5 / [ADR-059]）。返回违规消息列表
    （空 = 合法），供 validate_data 与 tools/selfcheck.py 共用同一判定——判定纯逻辑、无 I/O：

      1. `_meta.not_applicable: true` 只允许出现在 taxonomy 里标了 `only_spot: true` 的章节。
      2. 被标不适用的章节里不允许再留带 zh 的 leaf 字段（占位散文是标记落地前的临时办法，
         落地后应清掉——保持"不适用 = 干净空"，与 field_na_violations 第 1 条同构）。

    参数 zh_leaf_paths：该章展开后仍带 zh 的 leaf 路径（点分字符串）列表——调用方先算好传进来。
    非 only_spot 章直接命中不变式 1、不再看 leaf（调用方此时传空列表即可）。
    """
    out = []
    if meta_not_applicable is not True:
        return out
    if not is_only_spot:
        out.append(f"{loc}: 章节 `{ch_id}` 标了 _meta.not_applicable，但 taxonomy 里它没有 "
                   f"only_spot: true（not_applicable 只用于 only_spot 章，见 [ADR-059]）")
        return out
    for p in zh_leaf_paths:
        out.append(f"{loc}: 章节 `{ch_id}` 标了 not_applicable，但 `{p}` 仍有 zh "
                   f"——不适用的章节应清掉占位字段（[ADR-059]）")
    return out


# ── ROADMAP §一 的两条不变式（[ADR-069]）──────────────────────
# 并行 worktree 各自重排 §一「下一步」编号列表 / 各自 prepend「最近完成」，
# git 把不同分支的行看成互不冲突 → 三方合并静默产出重号列表、超窗窗口
# （2026-09-04 PR #61/#62 实测：下一步编号乱成 1-6,4-6,4-8、最近完成涨到 9 条）。
# 这两条把「静默失序」变成 make check 的硬错误。判定纯逻辑、无 I/O，
# 调用方切好 §一 两个子节的文本传进来，tools/selfcheck.py 喂合成输入锁行为。

ROADMAP_RECENT_MAX = 3  # CLAUDE.md §八：「最近完成」滚动窗口只留最近 3 条
NEXTSTEP_ITEM_RE = re.compile(r"^(\d+)\.\s", re.M)
RECENT_ITEM_RE = re.compile(r"^-\s\*\*", re.M)


def roadmap_nextstep_violations(nextstep_block):
    """§一「下一步」顶层有序列表的编号必须是 1..n 连续、无重复。返回违规消息列表。"""
    nums = [int(x) for x in NEXTSTEP_ITEM_RE.findall(nextstep_block)]
    if not nums:
        return []
    out = []
    seen, dup = set(), set()
    for n in nums:
        (dup if n in seen else seen).add(n)
    if dup:
        out.append(f"ROADMAP §一「下一步」列表编号重复 {sorted(dup)}"
                   f"（并行分支各自重排、合并未清干净？见 [ADR-069]）")
    if sorted(seen) != list(range(1, max(seen) + 1)):
        out.append(f"ROADMAP §一「下一步」列表编号不连续 {sorted(seen)}（应为 1..{max(seen)}）")
    return out


def roadmap_recent_violations(recent_block, limit=ROADMAP_RECENT_MAX):
    """§一「最近完成」顶层条目数不得超过滚动窗口上限。返回违规消息列表。"""
    n = len(RECENT_ITEM_RE.findall(recent_block))
    if n > limit:
        return [f"ROADMAP §一「最近完成」有 {n} 条，超出滚动窗口上限 {limit}"
                f"（CLAUDE.md §八：只留最近 3 条，更早的见三节；见 [ADR-069]）"]
    return []


def pending_adr_placeholder_violations(text):
    """文本里残留的 ADR-PENDING-<slug> 占位符（去重排序，空=合法）。纯函数、无 I/O，
    selfcheck 喂合成输入。main 上出现是硬错误，feature 分支上出现只警告——分支/main
    的区分由调用方（validate_no_pending_adr_placeholders）做，见 [ADR-076]。"""
    return sorted(set(PENDING_ADR_RE.findall(text)))


def adr_ledger_violations(decisions_nums, ledger_text):
    """DECISIONS.md 的 ADR 编号集合 ⊆ ADR-LEDGER.md 登记的编号；台账 1..max 连续无重复。
    返回违规消息列表（空 = 合法）。判定纯逻辑、无 I/O，selfcheck 喂合成输入锁行为。"""
    reserved, dup = set(), set()
    for line in ledger_text.splitlines():
        s = line.strip()
        if not s.startswith("- ADR-"):
            continue
        rng = LEDGER_RANGE_RE.search(s)
        if rng:
            for n in range(int(rng.group(1)), int(rng.group(2)) + 1):
                reserved.add(n)
            continue
        m = LEDGER_SINGLE_RE.match(s)
        if m:
            n = int(m.group(1))
            (dup if n in reserved else reserved).add(n)
            reserved.add(n)
    out = []
    missing = sorted(decisions_nums - reserved)
    if missing:
        out.append("PROJECT/ADR-LEDGER.md: 未登记 " + ", ".join(f"ADR-{n:03d}" for n in missing)
                   + "（DECISIONS.md 有、台账没有——写 ADR 前先登记，见 [ADR-069]）")
    if dup:
        out.append(f"PROJECT/ADR-LEDGER.md: 编号重复登记 {sorted(f'ADR-{n:03d}' for n in dup)}")
    if reserved:
        gaps = sorted(set(range(1, max(reserved) + 1)) - reserved)
        if gaps:
            out.append("PROJECT/ADR-LEDGER.md: 编号不连续，缺口 "
                       + ", ".join(f"ADR-{n:03d}" for n in gaps))
    return out


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


def derivatives_spec_shape_violations(spec_shapes):
    """schema/spec.yml「两侧同源」不变式（任务三棒 0，[ADR-082]）：
    `market_structure.derivatives.*` 的 spec 形状必须与现货侧顶层同名形状内容一致。
    spec.yml 里 derivatives 侧一律用 YAML anchor（*别名）复用顶层形状——手抄一份
    或日后改了顶层忘同步 derivatives，都会在这里被拦下。"""
    out = []
    prefix = "market_structure.derivatives."
    for key, shape in spec_shapes.items():
        if not key.startswith(prefix):
            continue
        top_key = "market_structure." + key[len(prefix):]
        if top_key not in spec_shapes:
            out.append(f"schema/spec.yml: `{key}` 有形状定义，但现货侧顶层 `{top_key}` 没有对应形状"
                       f"——derivatives 侧必须与顶层同源")
        elif spec_shapes[top_key] != shape:
            out.append(f"schema/spec.yml: `{key}` 与顶层 `{top_key}` 形状不一致"
                       f"——derivatives 侧必须用 YAML anchor（*别名）复用顶层形状，不得手抄")
    return out


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

    only_spot_chapters = {ch["id"] for ch in taxonomy["chapters"] if ch.get("only_spot")}
    chapter_by_id = {ch["id"]: ch for ch in taxonomy["chapters"]}

    for eid, raw in raw_exchanges.items():
        ex = exchanges_expanded[eid]
        # 5c 文件级反查池：本交易所所有字段的 quote / zh（[ADR-058] 收尾修订）
        verbatim_pool = collect_verbatim_texts(ex)

        # only_spot 章节级不适用标记（[ADR-036] #5 / [ADR-059]）：判定逻辑在
        # chapter_na_violations()（独立纯函数，tools/selfcheck.py 合成用例复用），
        # 这里只把该章展开后仍带 zh 的 leaf 路径算好、收集违规。
        for ch_id, raw_ch in raw.items():
            if not isinstance(raw_ch, dict):
                continue
            meta_na = (raw_ch.get("_meta") or {}).get("not_applicable")
            if meta_na is not True:
                continue
            is_only_spot = ch_id in only_spot_chapters
            ch_def = chapter_by_id.get(ch_id)
            zh_leaf_paths = []
            if is_only_spot and ch_def and ch_def.get("kind") != "list":
                for kind, path, _fdef in sync.walk_chapter_fields(ch_def.get("fields", [])):
                    if kind != "leaf":
                        continue
                    fenv = sync.get_by_path(ex["chapters"][ch_id], path)
                    if fenv and fenv.get("zh"):
                        zh_leaf_paths.append(".".join(path))
            for v in chapter_na_violations(eid, ch_id, meta_na, is_only_spot, zh_leaf_paths):
                err(v)

        # 字段级 not_applicable 标记（[ADR-060] 任务一实装，leaf 级下沉）：判定逻辑在
        # field_na_violations()（独立纯函数，便于正负向探针复用），这里只负责收集违规。
        for ch in taxonomy["chapters"]:
            if ch.get("kind") == "list":
                continue
            for kind, path, fdef in sync.walk_chapter_fields(ch.get("fields", [])):
                if kind != "leaf":
                    continue
                fenv = sync.get_by_path(ex["chapters"][ch["id"]], path)
                if not fenv:
                    continue
                loc = f"{eid}: {ch['id']}.{'.'.join(path)}"
                for v in field_na_violations(loc, fenv, fdef.get("optional")):
                    err(v)

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

                        # rate_raw（[ADR-071]）：原文以非阿拉伯数字给出费率时（tw-twse
                        # 「千分之三」、za-jse 逗号小数「0,25%」）——ADR-039 纪律原是「不放
                        # 数值 spec」、渲染成幽灵条，但这两笔恰是各自市场最大的一笔成本。
                        # 改为 rate 填人工转写的阿拉伯值、rate_raw 存原文逐字串。校验：
                        #   ① rate_raw 必须是非空字符串、且字段有 quote 作锚点；
                        #   ② rate_raw 逐字（折叠空白 + 小写后）出现在本字段 quote 里
                        #      ——挡「转写」名义下的编造；
                        #   ③ rate 必须是数值（rate_raw 的用途是给 rate 附原文锚点）；
                        #   ④ ASCII 纯数字型 rate_raw（0,25%）：逗号归一后机器比对 rate。
                        # 5b 对带 rate_raw 的字段豁免 rate 的 quote 数值反查（见下方 5b）。
                        raw = spec.get("rate_raw")
                        if raw is not None:
                            if not isinstance(raw, str) or not raw.strip():
                                err(f"{loc}: spec.rate_raw 必须是非空字符串（[ADR-071]）")
                            elif not env.get("quote"):
                                err(f"{loc}: spec 有 rate_raw 但字段缺 quote"
                                    f"——rate_raw 需要 quote 作逐字锚点（[ADR-071]）")
                            else:
                                def _fold(s):
                                    return re.sub(r"\s+", "", str(s)).lower()
                                if _fold(raw) not in _fold(env["quote"]):
                                    err(f"{loc}: spec.rate_raw `{raw}` 不是本字段 quote 的逐字子串"
                                        f"——原文费率转写必须有 verbatim 锚点（[ADR-071]/CLAUDE.md 二.5）")
                                if not isinstance(spec.get("rate"), (int, float)) or isinstance(spec.get("rate"), bool):
                                    err(f"{loc}: spec 有 rate_raw 但 rate 不是数值"
                                        f"——rate_raw 用于给 rate 附原文锚点，二者须同时给（[ADR-071]）")
                                elif re.fullmatch(r"[\d.,]+\s*[%‰]?", raw.strip()):
                                    got = raw.strip().rstrip("%‰ ").replace(",", ".")
                                    try:
                                        if abs(float(got) - float(spec["rate"])) > 1e-9:
                                            err(f"{loc}: spec.rate_raw `{raw}` 归一后（{got}）"
                                                f"与 spec.rate（{spec['rate']}）不一致（[ADR-071]）")
                                    except ValueError:
                                        pass

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
                        # [ADR-071]：带 rate_raw 的字段豁免顶层 rate 的 quote 数值反查
                        # ——rate 是原文非阿拉伯数字（「千分之三」/「0,25%」）的人工转写，
                        # rate_raw 的 verbatim 子串反查（上方结构校验块）是更强的锚点。
                        if env.get("spec") is not None:
                            spec_for_5b = env["spec"]
                            if isinstance(spec_for_5b, dict) and spec_for_5b.get("rate_raw"):
                                spec_for_5b = {k: v for k, v in spec_for_5b.items() if k != "rate"}
                            spec_nums = spec_number_strings(spec_for_5b)
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
    # 行尾容忍：与 sync.replace_generated_block 同一套规则（`\r?\n` 是防御性写法，
    # 全库文本文件目前均为 LF）；提取出的正文统一归一成 \n 再与纯函数输出比对。
    m = re.search(
        r"<!-- BEGIN:GENERATED " + re.escape(name) + r" -->(?:\r\n|\n)(.*?)(?:\r\n|\n)<!-- END:GENERATED " + re.escape(name) + r" -->",
        text, re.S,
    )
    return m.group(1).replace("\r\n", "\n") if m else None


def validate_generated_blocks(taxonomy, glossary, enums, raw_exchanges, exchanges_expanded):
    matrix_cells, freshness_rows = [], []
    for eid, ex in exchanges_expanded.items():
        matrix_cells += sync.collect_matrix_cells(eid, taxonomy, ex["chapters"])
        freshness_rows += sync.compute_freshness(eid, taxonomy, ex["chapters"], raw_exchanges[eid])
    enum_label_maps = sync.build_enum_label_maps(enums)

    checks = [
        (ROOT / "README.md", "exchange-list", sync.render_exchange_list(exchanges_expanded, enum_label_maps)),
        (ROOT / "README.en.md", "exchange-list", sync.render_exchange_list(exchanges_expanded, enum_label_maps, lang="en")),
        (PROJECT_DIR / "ROADMAP.md", "progress-matrix", sync.render_progress_matrix(taxonomy, raw_exchanges, exchanges_expanded)),
        (PROJECT_DIR / "ROADMAP.md", "health-summary", sync.render_health_summary(freshness_rows)),
        (PROJECT_DIR / "OPEN-QUESTIONS.md", "auto-issues", sync.render_auto_issues(taxonomy, raw_exchanges, exchanges_expanded)),
        (PROJECT_DIR / "SOURCES.md", "sources-index", sync.render_sources_index(raw_exchanges)),
    ]
    decisions_path = PROJECT_DIR / "DECISIONS.md"
    if decisions_path.exists():
        checks.append((decisions_path, "adr-index",
                       sync.render_adr_index(decisions_path.read_text(encoding="utf-8"))))
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
    md_files = [p for p in ROOT.rglob("*.md") if not under_skip_dir(p)]
    known_ext = (".yml", ".yaml", ".py", ".json", ".md", ".html", ".js", ".css", ".txt")
    # 只把"首段是仓库顶层条目"的 token 当作仓库内路径校验。反引号里以已知扩展名结尾的
    # 字符串还有别的来源：站内相对路径片段（res/pc/js/func.js）、别的网站/仓库的路径、
    # 绝对路径示例（/tmp/x.html）——这些不是本校验的对象，此前会被误报（见 OPEN-QUESTIONS
    # 已删除的 #35 与 ADR-029 顺带修复）。`.cache/` 内容不入库（ADR-002），文档里写
    # `.cache/<id>/_manifest.json` 这类是示意路径，同样跳过。
    top_level = {p.name for p in ROOT.iterdir()} - SKIP_DIRS
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

    # 扩面到非 .md（[ADR-077]）：让号/引用失配不只发生在文档里——
    # .py（脚本注释）、schema/*.yml、docs/assets/app.js、data/*.yml 同样带
    # [ADR-NNN] 引用，此前只扫 *.md 是静默失配面。复用 under_skip_dir 处理 worktree。
    for p in ROOT.rglob("*"):
        if p.suffix not in (".md", ".py", ".yml", ".yaml", ".js", ".css", ".json"):
            continue
        if under_skip_dir(p) or p == decisions_path:
            continue
        try:
            p_text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for ref in ADR_REF_RE.findall(p_text):
            if ref not in defined_set:
                err(f"{p.relative_to(ROOT)}: 引用了不存在的 `{ref}`（DECISIONS.md 里没有这条）")


def validate_adr_ledger():
    """DECISIONS.md 的每条 ADR 都在 ADR-LEDGER.md 登记过；台账编号连续无重复（[ADR-069]）。"""
    decisions_path = PROJECT_DIR / "DECISIONS.md"
    ledger_path = PROJECT_DIR / "ADR-LEDGER.md"
    if not decisions_path.exists():
        return
    if not ledger_path.exists():
        err("PROJECT/ADR-LEDGER.md 不存在（ADR 编号台账，见 [ADR-069]）")
        return
    decisions_nums = {int(x[4:]) for x in ADR_DEF_RE.findall(decisions_path.read_text(encoding="utf-8"))}
    for v in adr_ledger_violations(decisions_nums, ledger_path.read_text(encoding="utf-8")):
        err(v)


def _current_git_branch():
    """当前分支名；取不到（非 git 环境/detached HEAD）时返回 None，调用方按「未知」从严处理。"""
    try:
        out = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                              cwd=ROOT, capture_output=True, text=True, timeout=5)
        return out.stdout.strip() if out.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def validate_no_pending_adr_placeholders():
    """main 上不得残留 `ADR-PENDING-*` 占位符（合并前必须先跑
    `tools/assign_adr_number.py` 定号）；其他分支上允许存在，只给警告——占位符正是
    分支未合并前的正常中间态，见 [ADR-076]。"""
    on_main = _current_git_branch() in ("main", None)  # 取不到分支名时从严按 main 处理
    exts = (".md", ".yml", ".yaml", ".py", ".js", ".css", ".json", ".txt", ".html")
    for p in ROOT.rglob("*"):
        if p.suffix not in exts or under_skip_dir(p):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        placeholders = pending_adr_placeholder_violations(text)
        if not placeholders:
            continue
        msg = (f"{p.relative_to(ROOT)}: 残留 ADR 编号占位符 {placeholders}"
               f"（合并前先跑 `python tools/assign_adr_number.py` 定号，见"
               f" [ADR-076]）")
        (err if on_main else warn)(msg)


def validate_roadmap_section_one():
    """ROADMAP §一「下一步」编号连续无重复 + 「最近完成」不超滚动窗口（[ADR-069]）。"""
    path = PROJECT_DIR / "ROADMAP.md"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    m_next = re.search(r"^### 下一步[^\n]*\n(.*?)\n^### 最近完成", text, re.S | re.M)
    m_recent = re.search(r"^### 最近完成[^\n]*\n(.*?)\n^---$", text, re.S | re.M)
    if not m_next:
        err("PROJECT/ROADMAP.md: 找不到 §一「下一步」小节（标题被改过？[ADR-069] 的校验依赖它）")
    else:
        for v in roadmap_nextstep_violations(m_next.group(1)):
            err(v)
    if not m_recent:
        err("PROJECT/ROADMAP.md: 找不到 §一「最近完成」小节（标题被改过？[ADR-069] 的校验依赖它）")
    else:
        for v in roadmap_recent_violations(m_recent.group(1)):
            err(v)


def otp_line_violations(sources_text: str):
    """SOURCES.md 里每一行 `[OTP]` 登记必须恰好 2 个 URL（GenerateOTP 端点 + 数据端点，
    顺序固定，见 tools/fetch.py 文首「OTP 来源登记格式」，[ADR-075]）。复用 fetch.py 的
    同一套正则解析，不重写第二份（CLAUDE.md 一节：同一件事只在一处实现）。返回违规消息
    列表（空 = 合法），供 validate_otp_sources 与正负向探针共用同一判定逻辑。"""
    out = []
    for line in fetchmod.OTP_LINE_RE.findall(sources_text):
        urls = [fetchmod.TRAILING_ANNOTATION_RE.sub("", u) for u in fetchmod.URL_RE.findall(line)]
        if len(urls) != 2:
            out.append(
                f"PROJECT/SOURCES.md: `[OTP]` 登记行 URL 数不是 2（须为 GenerateOTP 端点 + "
                f"数据端点），实际 {len(urls)} 个——{line.strip()[:120]}"
            )
    return out


def load_sources_full_text() -> str:
    """「SOURCES.md + PROJECT/sources/*.md 全部分片」拼接后的全文。

    来源记录按交易所下沉到分片后，`SOURCES_DOMAIN_RE` / `SOURCES_TAG_RE` /
    `[OTP]` 行这些逐行匹配的校验都应扫拼接全文——registered_domains 与
    domain_tags 是全局扁平集合、无按交易所作用域，union 后语义不变。
    """
    parts = []
    main_path = PROJECT_DIR / "SOURCES.md"
    if main_path.exists():
        parts.append(main_path.read_text(encoding="utf-8"))
    src_dir = PROJECT_DIR / "sources"
    if src_dir.exists():
        parts.extend(p.read_text(encoding="utf-8") for p in sorted(src_dir.glob("*.md")))
    return "\n".join(parts)


def validate_otp_sources():
    """来源登记（SOURCES.md + sources/ 分片）里的 `[OTP]` 行格式合法，见 [ADR-075]。"""
    text = load_sources_full_text()
    if not text:
        return
    for msg in otp_line_violations(text):
        err(msg)


def sources_pairing_violations(data_ids, source_ids):
    """`data/exchanges/*.yml` 与 `PROJECT/sources/*.md` 必须一一对应（[ADR-077]）。
    返回违规消息列表（空 = 合法）。判定纯逻辑、无 I/O，selfcheck 喂合成输入锁行为：
    来源记录下沉到分片后，「多写者共写一个大文件」的并发点已物理分离，但拆分本身
    引入了新的结构不变式——任一侧多出都说明有人改了一边忘了另一边。"""
    out = []
    d, s = set(data_ids), set(source_ids)
    missing = sorted(d - s)
    orphan = sorted(s - d)
    if missing:
        out.append(f"PROJECT/sources/ 缺少来源分片 {missing}"
                   f"——data/exchanges/ 里有同名 <id>.yml，但 sources/ 没有对应 <id>.md")
    if orphan:
        out.append(f"PROJECT/sources/ 存在孤儿分片 {orphan}"
                   f"——data/exchanges/ 里没有同名 <id>.yml（改名/删除时忘了同步两边）")
    return out


def validate_sources_pairing():
    """校验 17：来源分片与数据文件一一对应，见 [ADR-077]。"""
    data_ids = {p.stem for p in (ROOT / "data" / "exchanges").glob("*.yml")}
    source_ids = {p.stem for p in (PROJECT_DIR / "sources").glob("*.md")} if (PROJECT_DIR / "sources").exists() else set()
    for v in sources_pairing_violations(data_ids, source_ids):
        err(v)


INBOX_MAXLEN = 200  # 「一行一条一句话」的机器上限（字符数），见 [ADR-077]


def inbox_line_violations(text, maxlen=INBOX_MAXLEN):
    """ROADMAP-INBOX.md「待折叠」区每条 `- ` 行不得超过 maxlen 字（[ADR-077]）。
    返回违规消息列表（空 = 合法）。判定纯逻辑、无 I/O，selfcheck 喂合成输入。
    只校验行长度、不校验堆积条数：堆积是协调者未及时折叠所致，拿它挡后台任务
    自己的 make build 会误伤错误的人；行长超限才是把详版体量写进便签，该拦。"""
    m = re.search(r"^## 待折叠\s*$\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not m:
        return []
    out = []
    for line in m.group(1).splitlines():
        if line.startswith("- ") and len(line) > maxlen:
            out.append(f"PROJECT/ROADMAP-INBOX.md:「待折叠」区一行 {len(line)} 字，"
                       f"超过约定上限 {maxlen}（一行一条一句话，详版写 ROADMAP §三）"
                       f"——{line.strip()[:80]}…")
    return out


def validate_roadmap_inbox():
    """校验 18：INBOX「待折叠」区行长上限，见 [ADR-077]。"""
    path = PROJECT_DIR / "ROADMAP-INBOX.md"
    if not path.exists():
        return
    for msg in inbox_line_violations(path.read_text(encoding="utf-8")):
        err(msg)


DECISIONS_MAXLINES = 3500  # 归档阈值（提醒性，非硬性），见 [ADR-084]


def decisions_length_violations(text, maxlines=DECISIONS_MAXLINES):
    """`DECISIONS.md` 单文件 append-only 只增不减，超过阈值时提醒该把最早一批 ADR
    移入 `DECISIONS-ARCHIVE.md`——比照 [ADR-036] 对 `taxonomy.yml`「暂不拆，设阈值」
    的处理范式。返回 warn 消息列表（空 = 未超限），纯逻辑无 I/O，selfcheck 喂合成输入。
    只 warn 不 err：具体怎么拆、拆多少留给人判断，机器只负责按时提醒，不该替人拍板。"""
    n = text.count("\n") + (0 if text.endswith("\n") else 1)  # 与 `wc -l` 口径一致
    if n > maxlines:
        return [f"PROJECT/DECISIONS.md 已 {n} 行，超过归档阈值 {maxlines}"
                f"（见 [ADR-084]）——该把最早一批 ADR 移入 DECISIONS-ARCHIVE.md 了"]
    return []


def validate_decisions_length():
    """校验 19：DECISIONS.md 增长阈值提醒（warn，不阻断构建）。"""
    path = PROJECT_DIR / "DECISIONS.md"
    if not path.exists():
        return
    for msg in decisions_length_violations(path.read_text(encoding="utf-8")):
        warn(msg)


def validate_no_conflict_markers():
    """任何入库文本文件里不得残留 git 合并冲突标记（[ADR-069]）。"""
    exts = (".md", ".yml", ".yaml", ".py", ".js", ".css", ".json", ".txt", ".html")
    for p in ROOT.rglob("*"):
        if p.suffix not in exts or under_skip_dir(p):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if CONFLICT_MARKER_RE.search(text):
            err(f"{p.relative_to(ROOT)}: 残留 git 合并冲突标记（并行分支合并未清干净，见 [ADR-069]）")


# ── 主流程 ────────────────────────────────────────────────

def main():
    taxonomy, glossary, enums, raw_exchanges = sync.load_all()
    exchanges_expanded = {eid: sync.expand_exchange(taxonomy, raw) for eid, raw in raw_exchanges.items()}

    sources_text = load_sources_full_text()
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
    for msg in derivatives_spec_shape_violations(spec_shapes):
        err(msg)

    validate_data(taxonomy, enums, raw_exchanges, exchanges_expanded, registered_domains, domain_tags, spec_shapes)
    validate_generated_blocks(taxonomy, glossary, enums, raw_exchanges, exchanges_expanded)
    validate_docs_data_fresh(taxonomy, glossary, enums, exchanges_expanded)
    validate_path_references()
    validate_adr_anchors()
    validate_adr_ledger()
    validate_no_pending_adr_placeholders()
    validate_roadmap_section_one()
    validate_no_conflict_markers()
    validate_otp_sources()
    validate_sources_pairing()
    validate_roadmap_inbox()
    validate_decisions_length()

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
