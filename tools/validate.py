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
  5. confidence: high 必须有 quote，且 zh/en 里的数字要能在 quote 里找到
  6. verified 不得是未来日期
  7. 来源域名已在 SOURCES.md 登记
  8. 生成块新鲜度：五处 GENERATED 块内容 == 用 sync.py 同一批函数重新算出来的内容
  9. docs/data/*.json 新鲜度：磁盘内容 == 重新生成的内容（忘了跑 make sync 时报错）
  10. 路径引用：文档里形如反引号包住的仓库内路径必须存在
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

NUMBER_RE = re.compile(r"\d[\d,]*\.?\d*")
PATH_TOKEN_RE = re.compile(r"`([A-Za-z0-9_.\-/]+(?:/[A-Za-z0-9_.\-]+)+)`")
ADR_DEF_RE = re.compile(r"^### (ADR-\d{3})\b", re.M)
ADR_REF_RE = re.compile(r"\[?(ADR-\d{3})\]?")
SOURCES_DOMAIN_RE = re.compile(r"^-\s+`([a-z0-9.\-]+\.[a-z]{2,})`", re.M)

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# ── 1-7：数据层校验 ──────────────────────────────────────────

def validate_data(taxonomy, enums, raw_exchanges, exchanges_expanded, registered_domains):
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

                # volatile/moderate 必须有 sources
                vol = fdef.get("volatility", "moderate")
                if vol in ("moderate", "volatile") and not env.get("sources"):
                    err(f"{loc}: volatility={vol} 但没有 sources（见 CLAUDE.md 二 第2条）")

                # confidence: high 必须有 quote，且数字要对得上
                if env.get("confidence") == "high":
                    if not env.get("quote"):
                        err(f"{loc}: confidence: high 但缺 quote（见 CLAUDE.md 二 第5条）")
                    else:
                        # 只查 2 位数以上的数字：T+0/T+1 这类记号里的个位数是受控词表
                        # （enum_ref）记号，不是原文会照抄的具体数值，法规原文几乎从不会
                        # 写"T+1"这种写法，拿它反查 quote 只会制造噪音而非抓真实错漏。
                        # zh/en 两边都查——不只是 source_lang 声明的那一边，顺带校验翻译
                        # 有没有把数字翻丢，不需要为哪边是源语言额外分支判断。
                        raw_nums = set(NUMBER_RE.findall(env.get("zh") or "")) | set(NUMBER_RE.findall(str(env.get("en") or "")))
                        nums = {n for n in raw_nums if len(n.replace(",", "").replace(".", "")) >= 2}
                        if nums and not any(n in env["quote"] for n in nums):
                            err(f"{loc}: zh/en 里的数字 {sorted(nums)} 在 quote 里一个都找不到——数值可能与原文对不上")

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
    skip_dirs = {".git", ".cache", "node_modules"}
    md_files = [p for p in ROOT.rglob("*.md") if not any(part in skip_dirs for part in p.parts)]
    known_ext = (".yml", ".yaml", ".py", ".json", ".md", ".html", ".js", ".css", ".txt")
    for md in md_files:
        text = md.read_text(encoding="utf-8")
        for token in PATH_TOKEN_RE.findall(text):
            if token.startswith(("http:", "https:")) or " " in token:
                continue
            if not (token.endswith(known_ext) or token.endswith("/")):
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

    skip_dirs = {".git", ".cache", "node_modules"}
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

    validate_data(taxonomy, enums, raw_exchanges, exchanges_expanded, registered_domains)
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
