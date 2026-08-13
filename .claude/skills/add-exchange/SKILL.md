---
name: add-exchange
description: 给 exchange-atlas 项目新增一家交易所的数据，或补全一家已存在但填得不完整的交易所。按十一章逐步抓取、核实、填写，并把研究过程中的副产品（资料来源、术语译法、悬案）回写进项目共享文件。
---

# 加一家交易所

本 skill 是 `CLAUDE.md` 「五、常用命令」与「二、防幻焼铁律」的可执行版本——**铁律的具体条文以 `CLAUDE.md` 为准，这里不重复**，只讲步骤。开始前默认你已经读过 `CLAUDE.md` 和 `PROJECT/ROADMAP.md`。

## 何时用

- 用户要求「加一家交易所」「填 XX 交易所的数据」
- 用户要求「把 XX 交易所补完整」（`PROJECT/ROADMAP.md` 进度矩阵里该所某章是 🟡 或 ⬜）

## 步骤

### 1. 确定身份

- 定 `id`：`<ISO 3166-1 alpha-2 小写国家码>-<简称>`，如 `us-nyse`、`jp-jpx`、`de-eurex`
- 查该所是否有集团归属（`group_id`），如 CME 系交易所填 `cme-group`
- 确定 `official_languages`（BCP47 数组）——该所自身的官方语言，与下面的 `source_lang` 是两回事
- 确定 `source_lang: zh` 或 `en`（必填，交易所级别一次性声明，决定 `quote`/`sources`/`confidence`
  锚定哪种语言，另一种视为翻译展示，见 `PROJECT/DECISIONS.md` [ADR-013]）——取源规则：
  **有可核实的官方中文原文就填 `zh`，没有就填 `en`，中英文都没有可靠原文的先别填，转
  `PROJECT/OPEN-QUESTIONS.md` 悬置**。v0.2 的 NYSE/JPX/Eurex 预期都填 `en`（没有官方中文原文，
  直接用英文官网取数即可，不必啃日语/德语原文）
- 确定 `region`、`tier`（对照 `schema/enums.yml` 的受控词表）

### 2. 查 `PROJECT/SOURCES.md`，缺就探测

打开 `PROJECT/SOURCES.md`，找该所对应的 `` `<exchange-id>` `` 章节。

- **已有该所章节** → 直接跳到第 3 步，用已登记的 URL
- **没有** → 用 WebSearch 定位该所官方规则手册、交易时段说明、监管机构页等，然后**用 curl 探测能不能抓到**（不要假设 WebFetch 能用——已实测多个交易所对 WebFetch 返回 403，换常规浏览器 UA 的 curl 可以过，见 CLAUDE.md 二）：

  ```
  curl -sS -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36" -o /tmp/probe.html -w "HTTP:%{http_code} SIZE:%{size_download}\n" "<候选URL>"
  ```

  探测到能抓的 URL 后，**按 `PROJECT/SOURCES.md` 顶部的条目格式回写**（标题行带 `` `<exchange-id>` ``，域名行标官方/监管/第三方、语言、抓取备注、内容备注）。抓不到就如实记下试过什么方式，见第 6 步的降级方案。

### 3. 抓取到 `.cache/`

```
make fetch EX=<exchange-id>
```

这会读 `PROJECT/SOURCES.md` 里该所章节下的全部 URL，逐个 curl 到 `.cache/<exchange-id>/`。**后面填数据只能依据这些落盘的原始页，不能凭记忆**（CLAUDE.md 二 第1条）。PDF 用 `pdftotext -layout` 转纯文本再 `grep` 定位条款，比逐页看 PDF 快。

### 4. 建数据文件，逐章填

新建 `data/exchanges/<exchange-id>.yml`，可以参考 `data/exchanges/cn-sse.yml` 或 `hk-hkex.yml` 的结构（信封字段、`_meta` 继承、章节划分都照抄格式）。

对每一章：

1. 先查 `schema/glossary.yml` 里有没有已收录的术语译法，有就直接用；**新术语按 glossary.yml 顶部的字段说明加一条**（回写）
2. 逐字段填：
   - `confidence: high` 的字段必须有 `quote`（原文照抄）且 `zh`/`en` 里的数字要能在 quote 里找到
   - `volatility: moderate`/`volatile` 的字段必须有 `sources`
   - `quote` 应该是 `source_lang` 声明的那种语言的原文；另一种语言字段（`en_required: true` 的
     字段才需要填）是翻译展示，没有独立 quote 也没关系，但别把和 zh 内容重复的另一语言硬塞进去——
     查不到真正对应的译文就留空，不要拿字面翻译凑数
   - 来源 URL 尽量精确到承载该事实的具体页面/PDF，不要停在网站首页（见 `SOURCES.md` 开头的说明）
   - 查不清、抓不到、没把握的，**`zh` 留空，`confidence: low`**，别猜（CLAUDE.md 二 第4条）——这不是失败，是诚实
3. 引用的每个来源域名，如果还没在 `SOURCES.md` 登记过，回去补上（`validate.py` 会因未登记域名直接 fail）

### 5. 本地验证

```
make build       # sync + check 一次跑完
make serve       # 本地预览，浏览器打开 http://localhost:8000
```

`make check` 报错就照着错误信息改——每一条错误都对应一条铁律或一致性规则，不要绕过去。

浏览器里确认：矩阵新增了一行、点格子能看到刚填的出处、切到「English」模式该所的 `en` 字段显示正确、档案页十一章能逐章翻。

### 6. 遇阻：降级方案

如果确认某个来源真的抓不到（强反爬、付费规则库、扫描件 PDF），不代表这一步做不下去——见 `CLAUDE.md` 三。把「抓不到」的具体情况记进 `SOURCES.md`（试过什么方式），把待人工提供的具体页面记进 `PROJECT/OPEN-QUESTIONS.md`，换一个能抓的来源或换下一家交易所，不要因此放松第 4 步的标准去凑合填。

### 7. 收尾

- `make sync` 会自动更新 `PROJECT/ROADMAP.md` 的进度矩阵，**不需要手改**
- 检查这次研究过程中有没有值得记的：新的术语（回写 glossary）、新的资料来源经验（回写 SOURCES.md）、结构性的疑问或发现（回写 OPEN-QUESTIONS.md，仿照现有条目的格式）
- 如果这次填数据的过程让你意识到 `schema/taxonomy.yml` 某处设计有问题（字段不够用、某类交易所不适配现有结构），记一条到 `PROJECT/OPEN-QUESTIONS.md`「框架性问题」，不要为了绕开问题而在数据里硬凑
