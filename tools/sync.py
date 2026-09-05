#!/usr/bin/env python3
"""tools/sync.py — 从权威 YAML 生成一切派生产物（幂等）

做的事：
  1. 读 schema/{taxonomy,glossary,enums}.yml + data/exchanges/*.yml
  2. 把数据文件里的「简写字段」展开成完整事实信封（继承章节 _meta）
  3. 生成 docs/data/{manifest,matrix,freshness,glossary,taxonomy,_schema}.json
     与 docs/data/exchanges/<id>.json（前端直接 fetch 这些，不解析 YAML）
  4. 重写八处 GENERATED 标记块：
       PROJECT/ROADMAP.md      progress-matrix, health-summary
       README.md               exchange-list（中文名 + 中文地区）
       README.en.md            exchange-list（官方英文名 + 英文地区，方案 D）
       PROJECT/GLOSSARY.md     全文
       PROJECT/OPEN-QUESTIONS.md  auto-issues
       PROJECT/SOURCES.md      sources-index（来源分片索引，[ADR-PENDING-antibloat]）
       PROJECT/DECISIONS.md    adr-index（ADR 索引，[ADR-PENDING-antibloat]）

跑完这个脚本后 `git diff` 应为空才说明库是一致的——这是 CLAUDE.md 一节
「生成块新鲜度」校验的前提；validate.py 会重新跑一遍本脚本的生成逻辑做比对。
"""
import datetime
import json
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "schema"
DATA_DIR = ROOT / "data" / "exchanges"
DOCS_DATA = ROOT / "docs" / "data"
PROJECT_DIR = ROOT / "PROJECT"

VOLATILITY_MONTHS = {"stable": 24, "moderate": 12, "volatile": 6}
ENVELOPE_KEYS = ("zh", "en", "enum", "spec", "detail", "quote", "sources", "verified", "confidence")
# exchange_identity 里视为必填的字段；group_id 允许缺省（无集团归属）
REQUIRED_IDENTITY_FIELDS = ("id", "name_zh", "name_native", "official_languages", "source_lang", "region")

TODAY = datetime.date.today()


def load_yaml(path: Path):
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def dump_json(obj) -> str:
    # default=str：YAML 里裸写的日期（verified: 2026-08-12）会被 PyYAML 自动解析成
    # datetime.date 对象而非字符串——不强求每处日期都手动加引号，这里统一兜底转成
    # ISO 字符串（str(date) 正好就是 YYYY-MM-DD）。
    return json.dumps(obj, ensure_ascii=False, indent=2, default=str)


def load_all():
    taxonomy = load_yaml(SCHEMA_DIR / "taxonomy.yml")
    glossary = load_yaml(SCHEMA_DIR / "glossary.yml")
    enums = load_yaml(SCHEMA_DIR / "enums.yml")
    exchanges = {}
    for p in sorted(DATA_DIR.glob("*.yml")):
        exchanges[p.stem] = load_yaml(p)
    return taxonomy, glossary, enums, exchanges


# ── 路径工具 ──────────────────────────────────────────────

def get_by_path(d, path):
    cur = d
    for p in path:
        if not isinstance(cur, dict) or p not in cur:
            return None
        cur = cur[p]
    return cur


def set_by_path(d, path, value):
    cur = d
    for p in path[:-1]:
        cur = cur.setdefault(p, {})
    cur[path[-1]] = value


def walk_chapter_fields(fields, prefix=()):
    """递归遍历一个 object 章节的 fields。
    yield ("leaf", path, field_def)      —— 普通事实字段
    yield ("list", path, field_def)      —— 嵌套列表字段（如 listing.boards）
    """
    for f in fields or []:
        path = prefix + (f["id"],)
        if "item_schema" in f:
            yield ("list", path, f)
        elif "fields" in f:
            yield from walk_chapter_fields(f["fields"], path)
        else:
            yield ("leaf", path, f)


# ── 信封展开 ──────────────────────────────────────────────

def expand_field(raw, chapter_meta):
    """裸字符串/数字 -> 只有 zh 的信封；dict -> 补齐继承字段。raw 为 None 时返回 None（缺失）。

    dict 信封里的非信封键（如字段级 `not_applicable: true`，[ADR-060]）原样透传——
    env = dict(raw) 保留全部键，下面只做缺省补齐、不裁剪。前端据此渲染「本所此字段
    设计前提不适用」灰条（与章节级 _meta.not_applicable 同构，见 [ADR-059]/[ADR-060]）。
    """
    if raw is None:
        return None
    if isinstance(raw, dict):
        env = dict(raw)
    else:
        env = {"zh": str(raw)}
    for key in ("sources", "verified", "confidence"):
        if env.get(key) in (None, "") and chapter_meta.get(key) not in (None, ""):
            env[key] = chapter_meta[key]
    for key in ENVELOPE_KEYS:
        env.setdefault(key, None)
    return env


def expand_object_chapter(chapter_def, raw_chapter):
    raw_chapter = raw_chapter or {}
    meta = raw_chapter.get("_meta") or {}
    expanded = {}
    # only_spot 章的 not_applicable 标记透传进产物，给前端一个干净的「本章不适用」信号
    # （[ADR-059]，如 de-eurex 的 listing）。其余 _meta 字段（verified/confidence）仍按
    # expand_field 继承进各字段信封，不单独透传。
    if chapter_def.get("only_spot") and meta.get("not_applicable") is True:
        expanded["_meta"] = {"not_applicable": True}
    for kind, path, fdef in walk_chapter_fields(chapter_def.get("fields", [])):
        if kind == "leaf":
            raw = get_by_path(raw_chapter, path)
            set_by_path(expanded, path, expand_field(raw, meta))
        else:  # 嵌套列表字段，轻量透传，不做信封展开
            set_by_path(expanded, path, get_by_path(raw_chapter, path) or [])
    return expanded


def expand_list_chapter(raw_chapter):
    raw_chapter = raw_chapter or {}
    return {"meta": raw_chapter.get("_meta") or {}, "items": raw_chapter.get("items") or []}


def expand_exchange(taxonomy, raw):
    identity = {f["id"]: raw.get(f["id"]) for f in taxonomy["exchange_identity"]["fields"]}
    chapters = {}
    for ch in taxonomy["chapters"]:
        raw_chapter = raw.get(ch["id"])
        if ch.get("kind") == "list":
            chapters[ch["id"]] = expand_list_chapter(raw_chapter)
        else:
            chapters[ch["id"]] = expand_object_chapter(ch, raw_chapter)
    return {**identity, "chapters": chapters}


# ── 矩阵 / 时效性 / 进度 ────────────────────────────────────

def collect_matrix_cells(exchange_id, taxonomy, expanded_chapters):
    cells = []
    for ch in taxonomy["chapters"]:
        if ch.get("kind") == "list":
            continue
        for kind, path, fdef in walk_chapter_fields(ch.get("fields", [])):
            if kind != "leaf" or not fdef.get("in_matrix"):
                continue
            env = get_by_path(expanded_chapters[ch["id"]], path)
            if not env or not env.get("zh"):
                continue
            cells.append({
                "exchange_id": exchange_id,
                "chapter": ch["id"],
                "group": fdef["in_matrix"],
                "field_path": ".".join(path),
                "label_zh": fdef["label_zh"],
                "label_en": fdef["label_en"],
                "zh": env.get("zh"),
                "en": env.get("en"),
                "enum": env.get("enum"),
                "enum_ref": fdef.get("enum_ref"),
                "has_detail": bool(env.get("detail")),
                "verified": env.get("verified"),
                "confidence": env.get("confidence"),
            })
    return cells


def compute_freshness(exchange_id, taxonomy, expanded_chapters, raw_chapters=None):
    raw_chapters = raw_chapters or {}
    rows = []
    for ch in taxonomy["chapters"]:
        if ch.get("kind") == "list":
            continue
        if chapter_is_not_applicable(ch, raw_chapters.get(ch["id"])):
            continue  # only_spot 章标 not_applicable：不产 freshness 行（[ADR-059]）
        for kind, path, fdef in walk_chapter_fields(ch.get("fields", [])):
            if kind != "leaf":
                continue
            env = get_by_path(expanded_chapters[ch["id"]], path)
            if not env or not env.get("zh"):
                continue
            # 字段级 not_applicable（data 侧）不产 freshness 行——该字段本所不适用，
            # 不是"已填待复核"的事实；空 optional leaf 因无 zh 已在上面被跳过（[ADR-060]）。
            if env.get("not_applicable") is True:
                continue
            vol = fdef.get("volatility", "moderate")
            threshold_days = VOLATILITY_MONTHS.get(vol, 12) * 30
            verified = env.get("verified")
            age_days, stale = None, True
            if verified:
                try:
                    age_days = (TODAY - datetime.date.fromisoformat(str(verified))).days
                    stale = age_days > threshold_days
                except ValueError:
                    pass
            rows.append({
                "exchange_id": exchange_id, "chapter": ch["id"],
                "chapter_label_zh": ch["label_zh"], "chapter_label_en": ch["label_en"],
                "field_path": ".".join(path), "label_zh": fdef["label_zh"], "label_en": fdef["label_en"],
                "volatility": vol, "verified": verified, "age_days": age_days,
                "stale": stale, "confidence": env.get("confidence"),
            })
    return rows



# ── 时区甘特条（v0.3）─────────────────────────────
# 交易所 id → IANA 时区数据库标识符，只用来给甘特条算 UTC 对齐（含夏令时），
# 不是一条需要 quote/来源的「事实」字段——同样的信息已经以说明性文字 + quote
# 的形式记在 overview.timezone 里，这里只是工程实现，供 zoneinfo 查表用。
EXCHANGE_IANA_TZ = {
    "cn-sse": "Asia/Shanghai",
    "hk-hkex": "Asia/Hong_Kong",
    "us-nyse": "America/New_York",
    "jp-jpx": "Asia/Tokyo",
    "de-eurex": "Europe/Berlin",
    "in-nse": "Asia/Kolkata",  # Phase 1b：spec.trading_sessions 已结构化（[ADR-037]），补入甘特条；印度不实行夏令时，恒为 UTC+5:30
}

# 交易时段字段目前都是自由文本（如 "13:00-15:00"、"9:30am-3:50pm连续交易..."）。
# 抽取 H:MM 数字：带 am/pm 后缀按 12 小时制换算；不带后缀时按现有五家所实际
# 文本直接当无歧义的 24 小时制数字处理（都已人工核对过，没有裸 12 小时制歧义
# 值），取一个字段内出现的最小/最大值作为该字段的时间范围——足以覆盖"这个
# 时段大致几点到几点"，不追求逐分钟精确，比如 SSE 收盘集合竞价的三段数字
# 会被合并成 13:00-15:00 一整段。
_TIME_TOKEN_RE = re.compile(r"(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?", re.IGNORECASE)


def _parse_hour_tokens(text):
    if not text:
        return []
    hours = []
    for h, m, meridiem in _TIME_TOKEN_RE.findall(text):
        hour, minute = int(h), int(m)
        meridiem = (meridiem or "").lower().replace(".", "")
        if meridiem == "pm" and hour < 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0
        hours.append(hour + minute / 60)
    return hours


def _fmt_hour(h):
    if h is None:
        return None
    h = h % 24
    hh, mm = int(h), round((h - int(h)) * 60)
    if mm == 60:
        mm, hh = 0, (hh + 1) % 24
    return f"{hh:02d}:{mm:02d}"


def compute_trading_window(exchange_id, expanded_chapters):
    """从 market_structure.trading_sessions 的自由文本导出一个近似的、UTC 对齐
    的开收盘窗口，供前端时区甘特条视图渲染。查不到时段文本就返回 None——
    甘特条视图据此把该所标成"时段数据不足"，不是拿这套推导凑一条假数据。
    """
    iana = EXCHANGE_IANA_TZ.get(exchange_id)
    if not iana:
        return None
    sessions_path = ("trading_sessions",)

    def session_env(field_id):
        return get_by_path(expanded_chapters.get("market_structure") or {}, sessions_path + (field_id,)) or {}

    def session_hours(field_id):
        """优先用 spec.{start,end}（[ADR-035] B，Phase 1 起）；没有 spec 就退回
        从 zh/en 自由文本正则抽取（[ADR-015] 的旧路径，Phase 1b 未结构化的所仍走这条）。"""
        env = session_env(field_id)
        spec = env.get("spec") or {}
        if spec.get("kind") == "none":
            return []
        out = []
        for k in ("start", "end"):
            v = spec.get(k)
            if isinstance(v, str) and ":" in v:
                try:
                    hh, mm = v.split(":")[:2]
                    out.append(int(hh) + int(mm) / 60)
                except ValueError:
                    pass
        if out:
            return out
        return _parse_hour_tokens(env.get("zh") or env.get("en") or "")

    # 故意不把 night_session 的数字并进来取 min/max：夜盘通常与日盘不连续（如商品期货
    # 夜盘 21:00-23:00，中间隔着日盘收盘到夜盘开盘的空档），一旦并入同一个 min/max 窗口，
    # 会把这段空档也画成一条看似连续在交易的柱段。现有五家标杆都没有独立于日盘之外的
    # 夜盘数据（Eurex 的 night_session 文本本身就是回指 pre_market，见该字段 detail），
    # 这条限制尚未被触发；v1.0 若引入真正有夜盘的交易所，这里需要另外设计不相连的
    # 第二段柱，而不是简单把 night_session 加进这个循环。
    window_hours = []
    for f in ("pre_market", "continuous_am", "continuous_pm", "after_market"):
        window_hours += session_hours(f)
    if not window_hours:
        return None
    open_local, close_local = min(window_hours), max(window_hours)

    lunch_hours = session_hours("lunch_break")
    lunch_start_local = min(lunch_hours) if len(lunch_hours) >= 2 else None
    lunch_end_local = max(lunch_hours) if len(lunch_hours) >= 2 else None

    # utcoffset() 的签名是 Optional[timedelta]，但这里 now() 一定带 ZoneInfo tzinfo，
    # 运行期不会返回 None。真拿到 None 说明时区解析异常，此时算出的 UTC 窗口是错的：
    # 不能拿 0 兜底当成 UTC+0 悄悄写进产物（那会造出看似合理、实则偏移一整段时区的
    # 甘特条），直接停下来更符合本项目对数据正确性的要求。
    tz_offset = datetime.datetime.now(ZoneInfo(iana)).utcoffset()
    if tz_offset is None:
        sys.exit(f"[sync] 错误：无法解析 {exchange_id}（{iana}）的 UTC 偏移，拒绝按 UTC+0 生成交易窗口")
    offset_hours = tz_offset.total_seconds() / 3600

    def to_utc(local_h):
        return None if local_h is None else local_h - offset_hours

    return {
        "iana_tz": iana,
        "utc_offset_hours": offset_hours,
        "open_local": _fmt_hour(open_local), "close_local": _fmt_hour(close_local),
        "lunch_start_local": _fmt_hour(lunch_start_local), "lunch_end_local": _fmt_hour(lunch_end_local),
        "open_utc": to_utc(open_local), "close_utc": to_utc(close_local),
        "lunch_start_utc": to_utc(lunch_start_local), "lunch_end_utc": to_utc(lunch_end_local),
    }


def count_chapter_leaves(fields, expanded, prefix=()):
    """递归统计一组字段的 (total, filled, low_conf)，识别 `optional`（分组级与 leaf 级）
    与 `not_applicable`（字段级，data 侧）三种豁免。

    1. 分组级 `optional: true`（如 market_structure.derivatives）：组内一个字段都没填时，
       整组不计入分母——这类字段仅对部分交易所适用（见该字段在 taxonomy.yml 里的 note），
       不适用时留空是正确状态，不该被当成"没填完"拖累其余字段都已填好的交易所的完成度。
       一旦组内至少有一个字段被填（说明该所确实用到这条产品线/机制），则整组正常计入分母，
       要求填完整——不是永久豁免，只豁免"完全未启用"的情况。
    2. leaf 级 `optional: true`（[ADR-060] A 桶，如 overview 的市值/成交额等 volatile
       市场结果快照字段）：语义同分组级——「填了算数、空着不算缺口」。字段标了 optional
       且未填（无 zh）时不加 total；已填则正常计入（total/filled 都加，仍要求 confidence）。
    3. 字段级 `not_applicable: true`（data 侧信封标记，见 expand_field 透传）：语义比
       optional 强——「本所该字段的设计前提不成立」（如纯现货所无衍生品保证金概念）。
       整字段跳过，不计 total/filled。
    """
    total = filled = low_conf = 0
    for f in fields or []:
        path = prefix + (f["id"],)
        if "item_schema" in f:
            continue  # 嵌套 list 字段（如 listing.boards）不计入叶子统计
        if "fields" in f:
            sub_total, sub_filled, sub_low = count_chapter_leaves(f["fields"], expanded, path)
            if f.get("optional") and sub_filled == 0:
                continue
            total += sub_total
            filled += sub_filled
            low_conf += sub_low
        else:
            env = get_by_path(expanded, path)
            if env and env.get("not_applicable") is True:
                continue  # 字段级 not_applicable：本所此字段设计前提不成立，整字段豁免
            if f.get("optional") and not (env and env.get("zh")):
                continue  # leaf 级 optional 且未填：空不算缺口（[ADR-060]）
            total += 1
            if env and env.get("zh"):
                filled += 1
                if env.get("confidence") == "low":
                    low_conf += 1
    return total, filled, low_conf


def chapter_is_not_applicable(chapter_def, raw_chapter):
    """only_spot 章 + 该所显式标 _meta.not_applicable: true（如 de-eurex 的 listing）：
    整章对本所不适用，不计入完成度、不产 freshness 行。见 [ADR-036] #5 / [ADR-059]。"""
    return bool(
        chapter_def.get("only_spot")
        and ((raw_chapter or {}).get("_meta") or {}).get("not_applicable") is True
    )


def chapter_status(chapter_def, raw_chapter, expanded):
    if chapter_is_not_applicable(chapter_def, raw_chapter):
        return "➖"
    if chapter_def.get("kind") == "list":
        items = (raw_chapter or {}).get("items") or []
        if items:
            return "✅"
        return "🟡" if raw_chapter else "⬜"
    total, filled, low_conf = count_chapter_leaves(chapter_def.get("fields", []), expanded)
    if filled == 0:
        return "⬜"
    if filled == total and low_conf == 0:
        return "✅"
    return "🟡"


# ── JSON Schema（从 taxonomy 派生，供 validate.py 做结构校验）───────

def build_json_schema(taxonomy):
    def leaf_schema():
        return {"type": ["object", "null"]}

    def group_schema(fields):
        props = {"_meta": {"type": "object"}}
        for f in fields:
            if "item_schema" in f:
                props[f["id"]] = {"type": "array"}
            elif "fields" in f:
                props[f["id"]] = group_schema(f["fields"])
            else:
                props[f["id"]] = leaf_schema()
        return {"type": "object", "properties": props, "additionalProperties": False}

    chapters_props = {}
    for ch in taxonomy["chapters"]:
        if ch.get("kind") == "list":
            chapters_props[ch["id"]] = {
                "type": "object",
                "properties": {"_meta": {"type": "object"}, "items": {"type": "array"}},
                "additionalProperties": False,
            }
        else:
            chapters_props[ch["id"]] = group_schema(ch.get("fields", []))

    identity_props = {f["id"]: {} for f in taxonomy["exchange_identity"]["fields"]}
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {**identity_props, **chapters_props},
        "required": list(REQUIRED_IDENTITY_FIELDS),
        "additionalProperties": True,
    }


# ── GENERATED 块替换 ────────────────────────────────────────

def replace_generated_block(text, name, new_content):
    # 行尾容忍（[ADR-PENDING-antibloat]）：仓库行尾风格混合（PROJECT/SOURCES.md 与
    # DECISIONS.md 是 CRLF，ROADMAP/README 等是 LF），标记行 \r 会让裸 `\n` 匹配失败。
    # 生成内容沿用标记处检测到的行尾风格，保持目标文件行尾统一。
    pattern = re.compile(
        r"(<!-- BEGIN:GENERATED " + re.escape(name) + r" -->(?:\r\n|\n))"
        r"(.*?)"
        r"((?:\r\n|\n)<!-- END:GENERATED " + re.escape(name) + r" -->)",
        re.S,
    )
    m = pattern.search(text)
    if not m:
        sys.exit(f"[sync] 错误：找不到 GENERATED 块 `{name}`（检查目标文件里的标记是否还在）")
    eol = "\r\n" if m.group(1).endswith("\r\n") else "\n"
    body = eol.join(new_content.rstrip("\n").split("\n"))
    return text[:m.start()] + m.group(1) + body + m.group(3) + text[m.end():]


def apply_blocks(path: Path, blocks: dict):
    text = path.read_text(encoding="utf-8")
    for name, content in blocks.items():
        text = replace_generated_block(text, name, content)
    path.write_text(text, encoding="utf-8")


# ── 各生成块的具体内容 ────────────────────────────────────────
# 这五个 render_* 都是纯函数（相同输入 -> 相同输出，不读写文件）：
# sync.py 用它们写盘，validate.py 用同一批函数在内存里重算一遍做比对，
# 两边不允许出现第二份「怎么生成这段内容」的逻辑。

def build_enum_label_maps(enums):
    """每个词表给 zh / en 两张 id→标签的表；README 与 README.en.md 的覆盖
    范围表各取一张（方案 D）。"""
    return {
        "region": {v["id"]: v["label_zh"] for v in (enums.get("region") or {}).get("values", [])},
        "region_en": {v["id"]: v["label_en"] for v in (enums.get("region") or {}).get("values", [])},
    }


def render_exchange_list(exchanges_expanded, enum_label_maps, lang="zh"):
    """覆盖范围表。`lang="en"` 时列头与地区走英文、名称取官方英文名
    （`name_native.en`），供 README.en.md 用。"""
    if not exchanges_expanded:
        return "（暂无交易所数据）" if lang == "zh" else "(No exchange data yet)"
    region_map = enum_label_maps["region" if lang == "zh" else "region_en"]
    header = "| ID | 名称 | 地区 |" if lang == "zh" else "| ID | Name | Region |"
    lines = [header, "|---|---|---|"]
    for eid, ex in sorted(exchanges_expanded.items()):
        region = region_map.get(ex.get("region"), ex.get("region") or "")
        if lang == "zh":
            name = ex.get("name_zh", "")
        else:
            nn = ex.get("name_native") or {}
            name = nn.get("en") if isinstance(nn, dict) else None
            if not name:
                # 官方英文名缺失时退回中文名，而不是留空——留空会让表格整列断掉，
                # 且「这家所没有官方英文名」本身不是读者需要在此处知道的信息。
                name = ex.get("name_zh", "")
        lines.append(f"| `{eid}` | {name} | {region} |")
    return "\n".join(lines)


def render_progress_matrix(taxonomy, raw_exchanges, exchanges_expanded):
    chapters = taxonomy["chapters"]
    if not exchanges_expanded:
        header = " | ".join(str(ch.get("chapter_no", "")) for ch in chapters)
        return f"（暂无交易所数据。列将是：{header}）"
    header = "| 交易所 | " + " | ".join(str(ch.get("chapter_no", "")) for ch in chapters) + " |"
    sep = "|---|" + "---|" * len(chapters)
    lines = [header, sep]
    for eid in sorted(exchanges_expanded):
        raw = {c["id"]: raw_exchanges[eid].get(c["id"]) for c in chapters}
        expanded = exchanges_expanded[eid]["chapters"]
        cells = [chapter_status(c, raw[c["id"]], expanded[c["id"]] if c.get("kind") != "list" else raw[c["id"]]) for c in chapters]
        lines.append(f"| `{eid}` | " + " | ".join(cells) + " |")
    legend = "、".join(f"{c.get('chapter_no')} {c['label_zh']}" for c in chapters)
    lines.append("")
    lines.append(f"列说明：{legend}")
    return "\n".join(lines)


def render_health_summary(freshness_rows):
    if not freshness_rows:
        return "（暂无数据）"
    stale_rows = [r for r in freshness_rows if r["stale"]]
    by_exchange = {}
    for r in freshness_rows:
        by_exchange.setdefault(r["exchange_id"], {"total": 0, "stale": 0})
        by_exchange[r["exchange_id"]]["total"] += 1
        if r["stale"]:
            by_exchange[r["exchange_id"]]["stale"] += 1
    lines = [f"共 {len(freshness_rows)} 个已填字段，其中 {len(stale_rows)} 个超过复核阈值待复核。", ""]
    lines.append("| 交易所 | 已填字段 | 待复核 |")
    lines.append("|---|---|---|")
    for eid, c in sorted(by_exchange.items()):
        lines.append(f"| `{eid}` | {c['total']} | {c['stale']} |")
    top_stale = sorted((r for r in stale_rows if r["age_days"] is not None), key=lambda r: -r["age_days"])[:5]
    if top_stale:
        lines.append("")
        lines.append("最需要复核（按超期天数排序）：")
        for r in top_stale:
            lines.append(f"- `{r['exchange_id']}` {r['label_zh']}（{r['field_path']}）— {r['age_days']} 天未核实")
    return "\n".join(lines)


def render_glossary_md(glossary):
    terms = glossary.get("terms", [])
    lines = [
        "# 术语对照表 GLOSSARY",
        "",
        "⚠️ 本文件由 `make sync` 从 `schema/glossary.yml` 全量生成，不要手改——改 `glossary.yml`。",
        "",
        "| 中文 | English | 原文对照 | 说明 |",
        "|---|---|---|---|",
    ]
    for t in terms:
        natives = t.get("natives") or {}
        native_str = "；".join(f"{k}: {v}" for k, v in natives.items()) if natives else ""
        note = t.get("note", "")
        lines.append(f"| {t['zh']} | {t['en']} | {native_str} | {note} |")
    return "\n".join(lines)


def render_auto_issues(taxonomy, raw_exchanges, exchanges_expanded):
    issues = []
    for eid, ex in sorted(exchanges_expanded.items()):
        for ch in taxonomy["chapters"]:
            if ch.get("kind") == "list":
                continue
            for kind, path, fdef in walk_chapter_fields(ch.get("fields", [])):
                if kind != "leaf":
                    continue
                env = get_by_path(ex["chapters"][ch["id"]], path)
                if env and env.get("zh") and env.get("confidence") == "low":
                    issues.append(f"- `{eid}` {ch['label_zh']} / {fdef['label_zh']}（{'.'.join(path)}）— confidence: low")
    if not issues:
        return "（暂无 confidence: low 的字段）"
    return "\n".join(issues)


def render_sources_index(raw_exchanges):
    """PROJECT/SOURCES.md 的分片索引：一行一家（id + 中文名 + 链接），[ADR-PENDING-antibloat]。
    刻意不生成域名全表——跨分片 `grep -r PROJECT/sources/` 依然可用，全表只会变成
    第二份要同步的膨胀物（同一事实只在一处手写）。"""
    if not raw_exchanges:
        return "（暂无交易所来源分片）"
    lines = []
    for eid in sorted(raw_exchanges):
        name = raw_exchanges[eid].get("name_zh") or ""
        lines.append(f"- `{eid}` {name} — [sources/{eid}.md](sources/{eid}.md)")
    return "\n".join(lines)


def render_adr_index(decisions_text):
    """PROJECT/DECISIONS.md 的 ADR 索引（[ADR-PENDING-antibloat]）：提取 `### ADR-NNN — 标题` 与其后
    的 **日期：**，按编号排序输出。物理顺序已被历次让号打乱，索引即顺序修正——
    不动物理顺序（零迁移缓解认知负荷），新会话定位 ADR 不必通读全文。
    `ADR-PENDING-<slug>` 占位符标题不匹配 `ADR-(\\d{3})`，自动跳过——与 [ADR-076]
    的「合并前跑 make assign-adr 定号」流程天然兼容。"""
    entries = []
    for m in re.finditer(r"^### (ADR-\d{3})\s*[-—]\s*(.*)$", decisions_text, re.M):
        num, title = m.group(1), m.group(2).strip()
        nxt = re.search(r"^### ", decisions_text[m.end():], re.M)
        block_end = m.end() + (nxt.start() if nxt else len(decisions_text) - m.end())
        dm = re.search(r"\*\*日期：\*\*\s*(\d{4}-\d{2}-\d{2})", decisions_text[m.end():block_end])
        entries.append((num, dm.group(1) if dm else "", title))
    entries.sort(key=lambda e: e[0])
    if not entries:
        return "（暂无 ADR）"
    return "\n".join(
        f"- {num} · {date} · {title}" if date else f"- {num} · {title}"
        for num, date, title in entries
    )


# ── 主流程 ────────────────────────────────────────────────

def main():
    taxonomy, glossary, enums, raw_exchanges = load_all()

    exchanges_expanded = {eid: expand_exchange(taxonomy, raw) for eid, raw in raw_exchanges.items()}

    matrix_cells = []
    freshness_rows = []
    for eid, ex in exchanges_expanded.items():
        matrix_cells += collect_matrix_cells(eid, taxonomy, ex["chapters"])
        freshness_rows += compute_freshness(eid, taxonomy, ex["chapters"], raw_exchanges[eid])

    # ── docs/data/ 产物 ──
    DOCS_DATA.mkdir(parents=True, exist_ok=True)
    (DOCS_DATA / "exchanges").mkdir(parents=True, exist_ok=True)

    manifest = {
        "exchanges": [
            dict(
                {f["id"]: ex.get(f["id"]) for f in taxonomy["exchange_identity"]["fields"]},
                trading_hours=compute_trading_window(ex["id"], ex["chapters"]),
            )
            for ex in exchanges_expanded.values()
        ],
        "dimension_groups": taxonomy.get("dimension_groups", []),
        "chapters": [
            {"id": c["id"], "chapter_no": c.get("chapter_no"), "label_zh": c["label_zh"],
             "label_en": c["label_en"], "kind": c.get("kind", "object")}
            for c in taxonomy["chapters"]
        ],
        # 复核阈值常量的唯一生成出口：前端用它 + 各字段自带的 verified/volatility
        # 现算 age_days/stale（见 ADR-052），不读 freshness.json 里冻结的派生值。
        "volatility_months": VOLATILITY_MONTHS,
        # 故意不含时间戳字段：没有消费者会读它，留着只会让每次 `make sync` 都在
        # manifest.json 里制造一行必然变化的 diff，破坏「sync 后 git diff 应为空」
        # 这条一致性判据。真要知道数据新不新，看各字段自己的 verified 日期。
    }
    (DOCS_DATA / "manifest.json").write_text(dump_json(manifest), encoding="utf-8")
    (DOCS_DATA / "matrix.json").write_text(dump_json({"cells": matrix_cells}), encoding="utf-8")
    # freshness.json 只带 verified/volatility 这两个建库时的事实，不带 age_days/stale
    # ——那两个是「今天」的派生值，写进产物会让站点的过期判定冻结在上次构建那天，
    # 且 make build 每天都会造出一份必然变化的 diff（ADR-052）。健康度摘要仍用
    # Python 侧算出的完整 freshness_rows（含 age_days/stale），只是不落盘进 JSON。
    freshness_rows_out = [
        {k: v for k, v in row.items() if k not in ("age_days", "stale")}
        for row in freshness_rows
    ]
    (DOCS_DATA / "freshness.json").write_text(dump_json({"fields": freshness_rows_out}), encoding="utf-8")
    (DOCS_DATA / "glossary.json").write_text(dump_json(glossary), encoding="utf-8")
    (DOCS_DATA / "enums.json").write_text(dump_json(enums), encoding="utf-8")
    (DOCS_DATA / "_schema.json").write_text(dump_json(build_json_schema(taxonomy)), encoding="utf-8")

    # 前端友好的 taxonomy 视图（不含内部注释，扁平化 leaf 字段路径）。
    # 注意 object 章节里也可能嵌套 list 字段（如 listing.boards）——不只是叶子字段，
    # 否则前端拿不到 item_schema，这部分数据就会被悄悄漏渲染。
    # 先攒成独立列表再组装 dict：taxonomy 来自 yaml.safe_load()（返回 Any），直接对
    # taxonomy_out["chapters"] 取 .append 会把 Optional 混进 dict 值的联合类型里，
    # 类型检查器据此报「None 没有 append」。独立变量的列表类型能正常推断出来。
    taxonomy_chapters = []
    for ch in taxonomy["chapters"]:
        if ch.get("kind") == "list":
            fields_out = ch.get("item_schema", [])
        else:
            fields_out = []
            for kind, path, fdef in walk_chapter_fields(ch.get("fields", [])):
                if kind == "leaf":
                    fields_out.append({
                        "kind": "leaf", "path": ".".join(path), "label_zh": fdef["label_zh"], "label_en": fdef["label_en"],
                        "volatility": fdef.get("volatility"), "en_required": fdef.get("en_required", False),
                        "enum_ref": fdef.get("enum_ref"), "in_matrix": fdef.get("in_matrix", False),
                    })
                else:  # kind == "list"：嵌套列表字段
                    fields_out.append({
                        "kind": "list", "path": ".".join(path), "label_zh": fdef["label_zh"], "label_en": fdef["label_en"],
                        "item_schema": fdef.get("item_schema", []),
                    })
        taxonomy_chapters.append({
            "id": ch["id"], "chapter_no": ch.get("chapter_no"), "label_zh": ch["label_zh"],
            "label_en": ch["label_en"], "kind": ch.get("kind", "object"), "fields": fields_out,
        })
    taxonomy_out = {
        "dimension_groups": taxonomy.get("dimension_groups", []),
        "default_chapter": taxonomy.get("default_chapter"),
        "chapters": taxonomy_chapters,
    }
    (DOCS_DATA / "taxonomy.json").write_text(dump_json(taxonomy_out), encoding="utf-8")

    for eid, ex in exchanges_expanded.items():
        (DOCS_DATA / "exchanges" / f"{eid}.json").write_text(dump_json(ex), encoding="utf-8")
    # 清理已删除交易所留下的孤儿 json
    valid_names = {f"{eid}.json" for eid in exchanges_expanded}
    for f in (DOCS_DATA / "exchanges").glob("*.json"):
        if f.name not in valid_names:
            f.unlink()

    # ── GENERATED 文档块 ──
    enum_label_maps = build_enum_label_maps(enums)

    apply_blocks(ROOT / "README.md", {"exchange-list": render_exchange_list(exchanges_expanded, enum_label_maps)})
    apply_blocks(ROOT / "README.en.md", {"exchange-list": render_exchange_list(exchanges_expanded, enum_label_maps, lang="en")})
    apply_blocks(PROJECT_DIR / "ROADMAP.md", {
        "progress-matrix": render_progress_matrix(taxonomy, raw_exchanges, exchanges_expanded),
        "health-summary": render_health_summary(freshness_rows),
    })
    apply_blocks(PROJECT_DIR / "OPEN-QUESTIONS.md", {
        "auto-issues": render_auto_issues(taxonomy, raw_exchanges, exchanges_expanded),
    })
    apply_blocks(PROJECT_DIR / "SOURCES.md", {
        "sources-index": render_sources_index(raw_exchanges),
    })
    decisions_path = PROJECT_DIR / "DECISIONS.md"
    if decisions_path.exists():
        apply_blocks(decisions_path, {
            "adr-index": render_adr_index(decisions_path.read_text(encoding="utf-8")),
        })

    glossary_md_path = PROJECT_DIR / "GLOSSARY.md"
    glossary_md_path.write_text(render_glossary_md(glossary) + "\n", encoding="utf-8")

    print(f"[sync] {len(exchanges_expanded)} 家交易所 → docs/data/ 产物已生成，8 处 GENERATED 块已更新")


if __name__ == "__main__":
    main()
