---
name: add-exchange
description: 给 exchange-atlas 项目新增一家交易所的数据，或补全一家已存在但填得不完整的交易所。按十一章逐步抓取、核实、填写，并把研究过程中的副产品（资料来源、术语译法、悬案）回写进项目共享文件。
---

# 加一家交易所

本 skill 是 `CLAUDE.md` 「五、常用命令」与「二、防幻觉铁律」的可执行版本——**铁律的具体条文以 `CLAUDE.md` 为准，这里不重复**，只讲步骤。开始前默认你已经读过 `CLAUDE.md` 和 `PROJECT/ROADMAP.md`。

本文档基于 v0.1（SSE/HKEX）、v0.2（NYSE/JPX/Eurex）与 v1.0 Wave 1（8 个子代理并行跑
us-nasdaq/cn-szse/uk-lse/de-xetra/sg-sgx/au-asx/in-nse/sa-tadawul）共十三次实操整理，步骤里
标注的具体坑都是真实踩过的，不是预防性猜测。

## 何时用

- 用户要求「加一家交易所」「填 XX 交易所的数据」
- 用户要求「把 XX 交易所补完整」（`PROJECT/ROADMAP.md` 进度矩阵里该所某章是 🟡 或 ⬜）

## 并行执行须知（仅当你是同一波多个子代理之一时适用）

如果你是 orchestrator 按 [ADR-017] 派发的并行子代理之一（同一时刻还有其他子代理在跑别的交易所），
有两条 v0.1/v0.2 单会话串行时不会遇到的坑：

- **worktree 路径可能比 orchestrator 告知的路径多嵌套一层。** 如果 orchestrator 自己也在一个
  worktree 里（如 `worktree-v1-wave1`），你的 `git worktree add` 实际落地路径会嵌套在它下面
  （如 `.claude/worktrees/v1-wave1/.claude/worktrees/wave1-<id>`），不是干净的
  `.claude/worktrees/wave1-<id>`。先跑 `git worktree list` 确认真实路径，再用 `EnterWorktree`
  （传 `path`）或 `cd` 绝对路径进入，不要假设 orchestrator 给的路径字面正确。
- **手动 curl 探测时不要用类似"/tmp/probe.html"这种通用文件名**——同一时刻其他子代理也在写
  /tmp 下的同名文件，会互相覆盖（实测发生过：抓到的"SGX"页面内容其实是另一个子代理刚覆盖
  进去的 NSE 页面）。改用你自己 worktree 内的路径，或者干脆跳过手动探测、直接靠 `make fetch`
  写入 `.cache/<exchange-id>/`（这个目录在你自己的 worktree 里，天然隔离，是唯一保真的落盘凭据）。

## 步骤

### 1. 确定身份

- 定 `id`：`<ISO 3166-1 alpha-2 小写国家码>-<简称>`，如 `us-nyse`、`jp-jpx`、`de-eurex`
- 查该所是否有集团归属（`group_id`）：查官网"About us"/页脚/品牌归属信息，看有没有同集团下其他
  独立交易所实体（如 NYSE Group 下的 NYSE American/Arca、JPX Group 下的大阪交易所、Deutsche
  Börse Group 下的 Eurex）。**判断标准是"是否存在计划收录的姊妹交易所实体"，不是"母公司叫
  什么名字"**——有就填 `<集团简称>-group`。这个标记直接决定 `listing.boards` 怎么填：姊妹
  交易所的板块/规则不能塞进本文件的 `boards`（那会歪曲"哪个法人实体拥有哪条规则"这个事实），
  只能靠 `group_id` 表达归属关系，`boards` 照实留空或只列同一法人实体内部的真实板块
- 确定 `official_languages`（BCP47 数组）——该所自身的官方语言，与下面的 `source_lang` 是两回事
- 确定 `source_lang: zh` 或 `en`（必填，交易所级别一次性声明，决定 `quote`/`sources`/`confidence`
  锚定哪种语言，另一种视为翻译展示，见 `PROJECT/DECISIONS.md` [ADR-013]）——取源规则：
  **有可核实的官方中文原文就填 `zh`，没有就填 `en`，中英文都没有可靠原文的先别填，转
  `PROJECT/OPEN-QUESTIONS.md` 悬置**。v0.2 的 NYSE/JPX/Eurex 都是这样定的 `en`（没有官方中文
  原文，直接用英文官网取数，不必啃日语/德语原文）
- 确定 `region`、`tier`（对照 `schema/enums.yml` 的受控词表）

### 2. 查 `PROJECT/SOURCES.md`，缺就探测

打开 `PROJECT/SOURCES.md`，找该所对应的 `` `<exchange-id>` `` 章节。

- **已有该所章节，先看有几条 URL**——v0.0 探针阶段登记的条目往往只有 1-2 条，那是用来验证
  "抓不抓得到"的，不够填十一章。**默认要补充**，除非现有条目已经覆盖了监管、上市、交易机制、
  清算这几个主要章节的入口。NYSE/JPX/Eurex 三次实操都是从 2 条 URL 起步、最终补到 7-11 条。
- **缺入口就主动用 WebSearch 找**，不要止步于官网首页导航能点到的几个页面——规则文档、费率表、
  历史沿革页往往要专门搜（如 `site:交易所域名 rules regulations PDF`、
  `site:交易所域名 fee schedule`、`site:交易所域名 history founded`）。**WebSearch 返回的 AI
  摘要本身不能当引用来源**——找到候选 URL 后必须实际 curl 抓下来、亲眼读到原文才能摘 `quote`，
  摘要可能转述自第三方，不是原文。
- 找到候选 URL 后**用 curl 探测能不能抓到**（不要假设 WebFetch 能用——已实测多个交易所对
  WebFetch 返回 403，换常规浏览器 UA 的 curl 可以过，见 CLAUDE.md 二）：

  ```
  curl -sS -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36" -o /tmp/probe.html -w "HTTP:%{http_code} SIZE:%{size_download}\n" "<候选URL>"
  ```

  多数官网连续抓几十个页面也不会被拦（NYSE/JPX/Eurex 实测全程无限流）；个别站点（如 SSE 英文版）
  有 WAF，连续请求 2-3 次后开始返回 403，间隔 10-15 秒重试即可恢复——如果连续几个 URL 突然从
  200 变 403，先怀疑限流加个延时重试，不要立刻断定网站封锁而启用第 6 步的降级方案。

  探测到能抓的 URL 后，**按 `PROJECT/SOURCES.md` 顶部的条目格式回写**（标题行带 `` `<exchange-id>` ``，域名行标官方/监管/第三方、语言、抓取备注、内容备注）。抓不到就如实记下试过什么方式，见第 6 步的降级方案。

  **`tools/fetch.py` 的 URL 提取正则有两个已知坑，登记 URL 时要避开：**
  1. URL 后面紧跟中文括注（如 `...pdf（HTTP 200）`）中间不能没有空格——正则只在遇到空格才
     停止匹配，紧贴着写会把括注文字整个吃进 URL 里导致抓取失败。写法是 `<URL>（HTTP 200...）`
     前面留一个空格。
  2. 正则遇到半角右括号 `)` 就截断，文件名本身带 `(2)` 这类半角括号的 PDF（不罕见，官方偶尔
     发布同名文件的修订版会加编号）必须在登记时把括号转成 `%28%29` URL 编码，否则抓到的是被
     截断的坏链接。

  另外，正则只识别完整的 `https://...` URL；如果你在抓取备注里提到一个裸域名或站内相对路径
  （不是完整 URL，通常是反引号包起来做说明用），`fetch.py` 会直接跳过它，不会报错也不会抓——
  这是符合预期的（避免把说明性文字误当抓取目标），但意味着"本节写了 N 条 URL"不能简单等于
  "N 条都会被抓取"，写完之后过一眼确认真正要抓的都是完整 URL。

### 3. 抓取到 `.cache/`

```
make fetch EX=<exchange-id>
```

这会读 `PROJECT/SOURCES.md` 里该所章节下的全部 URL，逐个 curl 到 `.cache/<exchange-id>/`。**后面填数据只能依据这些落盘的原始页，不能凭记忆**（CLAUDE.md 二 第1条）。PDF 用 `pdftotext -layout` 转纯文本再 `grep` 定位条款，比逐页看 PDF 快。

如果某个官网页面导航栏特别重（几百个重复菜单项占了页面文本的大头，正文只是中间一小段，
NSE 官网是典型例子），直接 grep 抓下来的 HTML 效率很低——先用 Python/BeautifulSoup 转纯文本、
跳到正文标题（通常是页面 URL 对应的那个小节标题）之后再读，比对着原始 HTML 找快得多。

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
   - **不管 `source_lang` 是哪种，`zh` 和 `en` 要填得同等充实**——真实出过的 bug：给
     `source_lang: en` 的交易所写数据时，习惯性把 zh 当默认主叙述语言、en 只塞一个简短术语标签，
     结果切到英文模式时前端大片格子回退显示中文（`displayValue()` 设计上 en 缺失就回退 zh，
     回退本身没错，错的是不该让它经常触发）。填完一个字段自查：zh 是一整句描述，en 也应该是
     一整句描述，不是一个词组
   - 来源 URL 尽量精确到承载该事实的具体页面/PDF，不要停在网站首页（见 `SOURCES.md` 开头的说明）
   - 查不清、抓不到、没把握的，**`zh` 留空，`confidence: low`**，别猜（CLAUDE.md 二 第4条）——这不是失败，是诚实
   - **章节级 `_meta.confidence`/`sources`/`verified` 会静默级联到没有自己单独设置这些字段的叶子
     字段**（`tools/sync.py` 的 `expand_field` 回退逻辑）——v1.0 Wave 1 两个独立子代理（NSE、
     Nasdaq）都踩到过：写了一个裸字符串/简单字段、没显式给它自己的 `confidence`，结果它继承了
     章节顶部的 `confidence: high`，但这个字段根本没有自己的 `quote` 撑腰，`validate.py` 也查不出
     这种情况。**只要字段没有自己的 quote，就必须显式给它单独的 `confidence`（通常是 `low`
     或 `medium`），不要让它隐式继承章节级别的 high。**
   - **`in_matrix: true` 的字段即使没标 `en_required`，也应该写成 `{zh, en}` 完整信封，不要写
     裸字符串**（如 `trading_currency: "港元"`）——裸字符串在导出的 `matrix.json` 里会让 `en`
     直接变成 `null`，`make check` 不会报错，但英文模式下这个格子会显示空白，属于人工浏览器验收
     才能发现的静默 bug
3. 引用的每个来源域名，如果还没在 `SOURCES.md` 登记过，回去补上（`validate.py` 会因未登记域名直接 fail）
4. **两个 YAML 写法坑，v1.0 Wave 1 五个独立子代理（in-nse、au-asx、uk-lse、sa-tadawul、
   us-nasdaq）都各自踩过至少一次，值得写数据前就留意：**
   - 双引号包起来的 YAML 字符串里面，不要再用英文直角引号 `"..."` 做中文式引用——会被解析成
     字符串提前结束，报错通常指向下一行而不是真正出错的那一行，很难对号入座。中文语境下的
     引用一律用「」，本项目 `hk-hkex.yml` 已经是这个惯例。
   - 未加引号的标量值里如果出现"英文冒号+空格"（如 `title: Article 38: Something`），YAML 会把
     它解析成新的 mapping key，报 "mapping values are not allowed here"。整段值只要含有这种
     冒号，就要给它套上引号。
5. 如果某个字段甚至整个章节的设计前提对这类交易所根本不成立（如衍生品交易所没有"公司上市"概念，
   `listing` 章节整章不适用；`settlement_cycle`/`short_selling`/`intraday_reversal` 的设计假设
   都是现货股票市场的时间/借券结构），**如实留空 + 在 `detail` 里说明"设计前提不适用"，不要为了
   填满而强行套用**（比如把交易员资格考试硬填进上市审核字段）。这类发现比"查不到具体数值"更
   重要，记一条到第 7 步的框架性问题回写里，参考 `de-eurex.yml` 里 `listing` 章节顶部注释的写法

### 5. 本地验证

```
make build       # sync + check 一次跑完
make serve       # 本地预览，浏览器打开 http://localhost:8000
```

`make check` 报错就照着错误信息改——每一条错误都对应一条铁律或一致性规则，不要绕过去。

浏览器里确认：矩阵新增了一行、点格子能看到刚填的出处、切到「English」模式该所的 `en` 字段显示正确、档案页十一章能逐章翻。

如果当前环境没有浏览器工具，用 Python 直接读 `docs/data/matrix.json` 和
`docs/data/exchanges/<id>.json` 模拟 `app.js` 的取值逻辑做等效核对（新交易所的枚举格子在
中英两种模式下能不能正确取到 label、`zh`/`en` 两个字段有没有大片不对称留空）——不如真人点一遍
浏览器可靠，但能捕捉"数据结构对不对"这类问题，比什么都不做强。

### 6. 遇阻：降级方案

如果确认某个来源真的抓不到（强反爬、付费规则库、扫描件 PDF），不代表这一步做不下去——见 `CLAUDE.md` 三。把「抓不到」的具体情况记进 `SOURCES.md`（试过什么方式），把待人工提供的具体页面记进 `PROJECT/OPEN-QUESTIONS.md`，换一个能抓的来源或换下一家交易所，不要因此放松第 4 步的标准去凑合填。

### 7. 收尾

- `make sync` 会自动更新 `PROJECT/ROADMAP.md` 的进度矩阵，**不需要手改**
- 检查这次研究过程中有没有值得记的：新的术语（回写 glossary）、新的资料来源经验（回写 SOURCES.md）、结构性的疑问或发现（回写 OPEN-QUESTIONS.md，仿照现有条目的格式）
- 如果这次填数据的过程让你意识到 `schema/taxonomy.yml` 某处设计有问题（字段不够用、某类交易所不适配现有结构），记一条到 `PROJECT/OPEN-QUESTIONS.md`「框架性问题」，不要为了绕开问题而在数据里硬凑
- 顺手看一眼这家所有没有让某个已进矩阵的字段"雪上加霜"（本来就常空、这次又空）——攒够信号后
  可能值得像 `PROJECT/DECISIONS.md` [ADR-014] 那样做一次矩阵列重新校准，但不需要每加一家所就
  重新算一遍，先记下来
