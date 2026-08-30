---
name: add-exchange
description: 给 exchange-atlas 项目新增一家交易所的数据，或补全一家已存在但填得不完整的交易所。按十一章逐步抓取、核实、填写，并把研究过程中的副产品（资料来源、术语译法、悬案）回写进项目共享文件。
---

# 加一家交易所

本 skill 是 `CLAUDE.md` 「五、常用命令」与「二、防幻觉铁律」的可执行版本——**铁律的具体条文以 `CLAUDE.md` 为准，这里不重复**，只讲步骤。开始前默认你已经读过 `CLAUDE.md` 和 `PROJECT/ROADMAP.md`。

本文档基于 v0.1（SSE/HKEX）、v0.2（NYSE/JPX/Eurex）、v1.0 Wave 1（8 个子代理并行跑
us-nasdaq/cn-szse/uk-lse/de-xetra/sg-sgx/au-asx/in-nse/sa-tadawul）、v1.0 Wave 2（7 个子代理
并行跑 fr-euronext/kr-krx/ca-tsx/br-b3/tw-twse/ch-six/za-jse）与 v1.1 Batch 1（8 个子代理
并行"补全"模式跑 cn-sse/cn-szse/hk-hkex/tw-twse/us-nyse/us-nasdaq/uk-lse/jp-jpx）共二十八次
实操整理，步骤里标注的具体坑都是真实踩过的，不是预防性猜测。

## 何时用

- 用户要求「加一家交易所」「填 XX 交易所的数据」
- 用户要求「把 XX 交易所补完整」（`PROJECT/ROADMAP.md` 进度矩阵里该所某章是 🟡 或 ⬜）

**新增一家交易所是按需可选能力（[ADR-041]）：只在用户主动要求时执行，agent 不主动提议或启动，也不在下一步任务建议里列「加某家交易所」。** 补全已有交易所的空字段不受此限。

## 并行执行须知（仅当你是同一波多个子代理之一时适用）

**先给 orchestrator 的一条**：并行子代理数量要看账号 session limit 余量。[ADR-043]（Phase 3 首棒
回填）在**后台任务**里一次派 7 个并行子代理，**7 路并发瞬间打爆 session limit（HTTP 429），
7 个全部提前终止、零产出**，改协调者串行才跑完。后台任务里做「补全已有交易所少量字段」这类
工作，协调者串行（一家一家：抓→填→单文件校验→提交→下一家）往往比并行更稳——单条 API 流、
可控、即时提交、session limit 风险归零。并行只在「新增整所、每所工作量大、且额度充裕」时值得。

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
- **不要假设你真的拿到了独立 worktree——先自己确认一次。** [ADR-021]（补齐 9 家衍生品机制那波）
  实测：9 个子代理里只有 2 个真正落到了独立 worktree/分支，另外 7 个全部落进了 orchestrator
  自己所在的共享目录，同时对同一份 `data/exchanges/*.yml`（各自不同文件，问题不大）和
  `PROJECT/SOURCES.md`（**同一份文件**，问题很大）并发读写。根因与"orchestrator 自身已在
  worktree 内、且过程中因账号会话限额中断后经消息恢复"有关，恢复路径大概率没有重新走一遍
  worktree 创建。**开工前先跑 `git worktree list` 或 `pwd`/`git branch --show-current` 确认
  自己是不是在一个专属分支上**；如果发现自己和 orchestrator 或别的子代理共享同一个工作目录，
  当作默认假设去防：
  1. 改动 `PROJECT/SOURCES.md`、`PROJECT/OPEN-QUESTIONS.md` 这类会被多个子代理同时追加内容的
     共享文件时，**不要用 `git add <file>` 加整个文件**（会连同邻居尚未提交的改动一起暂存/
     误删）——改用 `git apply --cached` 配合你自己手写的单一 hunk patch，或 `git diff` 后手工
     核对只保留自己那部分再 `git add -p` 逐块选择。
  2. 提交时用 `git commit -- <你自己改的文件列表>`，不要用 `git commit -a` 或裸 `git commit`
     （后两者会把邻居留在工作目录里、尚未提交的改动一并卷入你的提交）。
  3. **提交前用 `git diff HEAD~1 -- PROJECT/SOURCES.md`（或你改的那份共享文件）肉眼过一遍
     diff，确认只有增删了自己的内容，没有删掉不属于自己那一段的既有行**——[ADR-021] 实测
     出过一次真实事故：某子代理给 SOURCES.md 打补丁时依据了过期快照，直接静默删除了另一个
     子代理几分钟前刚提交的 10 行内容，事后是 orchestrator 合并阶段逐行核对才发现补回的，
     肇事的子代理自己完全没意识到。
  4. **绝不 `git add .cache`（或任何 `.cache` 开头的路径）。** 如果你为复用主 checkout 的来源
     缓存、在自己 worktree 里手建了 `.cache` 符号链接，它不在 `.gitignore` 的目录规则覆盖内
     （`.cache/` 带斜杠只挡目录、不挡同名软链）——一旦被 `git add -A` / `git add .` 顺带扫进
     提交，合并到 main 后**任何人 `git pull` 都会被 git 静默删掉本地 `.cache/` 全部快照**
     （git 为放置这个 tracked 软链会覆盖位置上被忽略的目录，不报错）。[ADR-044] 就是这么炸的。
     提交前 `git status` 扫一眼有没有 `.cache` 冒出来；用 `git commit -- <明确文件列表>`，
     永远不用 `git add -A` / `git commit -a`。

**v1.1 Batch 1（8 个子代理，2026-08-24/25）进一步确认与补充**——这次共享目录规模比 [ADR-021]
更大（8 个子代理里 7 个共享同一目录，仅 1 个真正独立），且与账号会话限额多次中断后经
`SendMessage` 恢复的相关性被实锤：**同一个子代理在一次任务内的不同阶段，隔离状态可能来回
切换**——有子代理报告"开局在独立 worktree，中途恢复后被系统收回到共享目录"，也有反过来的
情况（先共享、`SendMessage` 恢复后又给了独立路径）。**每次被恢复（不只是任务开始时）都要
重新跑一遍 `pwd`/`git branch --show-current` 确认现在的隔离状态，不能只在任务开局确认一次
就假设中途不会变。**

好消息：本次没有发生 [ADR-021] 那种数据丢失事故，说明上面 1-3 条的应对方式（精确 `git add`
指定文件、`git commit -- <files>`、提交前 diff 核对）在被严格执行时确实有效，值得继续坚持；
但也观察到几种新的、[ADR-021] 没记录过的共享目录副作用，同样需要提防：

- **"提交后 diff 为空"不等于"我的活没做"，可能是被邻居的提交顺带收纳了。** 多个子代理报告：
  自己 `git add` 暂存了内容但还没来得及 `commit`，此时邻居子代理恰好也在提交（哪怕命令写的是
  `git commit -- <邻居自己的文件>`），暂存区里属于你的改动有一定概率被一并卷入邻居那次提交
  （具体机制未查清，但多次独立观察到）。这是良性的——内容没有丢，只是提交者署名变成了别人——
  但会让你在事后 `git diff HEAD` 看到"空"而困惑。**正确反应是 `git log --oneline` 或
  `git log -p -- <你的文件>` 确认改动是否已经进了某个（不一定是你发起的）提交，而不是重新
  再写一遍导致重复。**
- **共享文件里的 `<!-- BEGIN/END:GENERATED ... -->` 生成块标记本身也可能被邻居的不精确编辑
  误删**（本次至少两个子代理独立报告在 `PROJECT/OPEN-QUESTIONS.md` 发现 `auto-issues` 生成块
  的某一侧标记缺失，各自手动补回）——标记一丢，`make sync` 会对所有共享该目录的子代理同时
  报错，不只是肇事者自己遇到。**编辑这类共享文件前，先 `grep -n "BEGIN:GENERATED\|
  END:GENERATED" <file>` 确认两侧标记都在**，改完再查一遍确认没被自己的 diff 误伤。
- **`make build`/`make check` 在共享目录里、其他子代理文件处于中间损坏状态时会报出与你无关
  的错误，甚至直接崩溃退出**，不能作为"我的工作是否合格"的唯一判据。可以绕开 `Makefile`
  直接 `import tools/sync.py`/`tools/validate.py` 作为 Python 模块，只传入你自己那个交易所
  的 `raw_exchanges` 字典调用 `validate.validate_data()`，得到只针对自己文件的精确校验结果。
  同理，遇到 YAML 语法错误报错时先确认是不是自己造成的（`python3 -c "import yaml;
  yaml.safe_load(open('data/exchanges/<你的id>.yml'))"` 单独测自己的文件），不要花时间去修
  邻居文件里的语法错误——那是它自己的责任范围，你去改反而可能与它自己的后续编辑冲突。
- **多个子代理各自独立为同一个英文概念新造中文译法、互不知情，是新观察到的一种重名冲突。**
  本次两个子代理分别为 "Default Waterfall"（CCP违约损失处置顺序）各自造了不同的 `glossary.yml`
  译法（"违约损失分摊阶梯" vs "违约处置瀑布"），orchestrator 合并阶段才发现重名。**填写涉及
  通用金融/清算/监管概念（而非交易所自定义机制名）的字段前，先搜一遍 `schema/glossary.yml`
  看是否已有该英文概念的现有译法（哪怕是别的交易所在你不知情的同一波里刚造的），没有再造，
  不要想当然自己是第一个遇到这个概念的人。**

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
  3. `TRAILING_ANNOTATION_RE` 只认识紧跟在 URL 后面、以 `（HTTP` 开头的括注，其他任何形式的
     括注（如提醒性质的 `（⚠️...）`）只要紧贴 URL 写在它后面，同样会被整个吃进 URL 里导致
     404（ch-six 子代理实测踩过）。**这类提醒文字一律写在 URL 前面**，URL 后面只留
     `（HTTP 200...）` 这种标准格式的抓取备注。

  另外，正则只识别完整的 `https://...` URL；如果你在抓取备注里提到一个裸域名或站内相对路径
  （不是完整 URL，通常是反引号包起来做说明用），`fetch.py` 会直接跳过它，不会报错也不会抓——
  这是符合预期的（避免把说明性文字误当抓取目标），但意味着"本节写了 N 条 URL"不能简单等于
  "N 条都会被抓取"，写完之后过一眼确认真正要抓的都是完整 URL。

  **域名登记正则 `SOURCES_DOMAIN_RE` 只捕获每行开头第一个反引号 token**——如果同一域名下有多个
  子域名（如 `law-out.mof.gov.tw` 与 `www.mof.gov.tw`），写成 `` - `a.example.com` / `b.example.com` ``
  一行只会注册第一个，第二个域名引用会被 `validate.py` 判定为"未登记域名"直接 fail（tw-twse
  子代理实测踩过）。**每个域名单独开一行 `` - `域名` ``**，不要用 `/` 在一行里罗列多个。

### 3. 抓取到 `.cache/`

```
make fetch EX=<exchange-id>
```

这会读 `PROJECT/SOURCES.md` 里该所章节下的全部 URL，逐个 curl 到 `.cache/<exchange-id>/`。**后面填数据只能依据这些落盘的原始页，不能凭记忆**（CLAUDE.md 二 第1条）。PDF 用 `pdftotext -layout` 转纯文本再 `grep` 定位条款，比逐页看 PDF 快。

如果某个官网页面导航栏特别重（几百个重复菜单项占了页面文本的大头，正文只是中间一小段，
NSE 官网是典型例子），直接 grep 抓下来的 HTML 效率很低——先用 Python/BeautifulSoup 转纯文本、
跳到正文标题（通常是页面 URL 对应的那个小节标题）之后再读，比对着原始 HTML 找快得多。

**KRX 那类"导航壳"页面是更极端的版本**：不少栏目落地页（如 About/Organization/Regulation 分类页）
抓下来 120KB+，静态 HTML 里却只有 tab 标题列表，实质段落一个字都没有——真正的内容要么在
URL 尾缀带 `T1`/`T2`.jsp 的详情子页，要么整份塞进官方 PDF 指南。抓到大文件不代表有正文，先搜
关键词（年份、百分比数字）确认命中，没命中就找该栏目 `href="...同前缀...T\d.jsp"` 的兄弟页再试。

**HTTP 200 也可能是自定义 404 页**（tw-twse 实测：旧版失效链接返回 200 但正文是"此網頁不存在，
請回到本公司首頁"）——状态码不能替代肉眼确认正文，抓完扫一眼提取出的文本是不是真的在讲这个
主题。

**某些官网主站是纯前端渲染的 SPA**，curl 拿到的是几乎空的 `<title>` 壳（比 403 更隐蔽的一种
"抓不到"，SGX 主站是 v0.2/v1.0 第一个样本，`europa.eu/rapid` 新闻稿页是第二个）——遇到这种情况
不要反复重试当成限流处理，改找该内容的规则手册子域名（通常服务端渲染）或年报/监管备案文件。

**PDF 抓取成功（HTTP 200 + 合理文件大小）不代表 `pdftotext` 能正常提取文本**——SIX 交易所的
月度统计 PDF 抓下来完好，但 `pdftotext -layout` 输出的是逐字母断行的乱码（如"Turnover"被拆成
"Tur/noveri/n"），大概率是 PDF 内嵌字体导致的提取异常；PDF 表格用图片渲染（而非文本层）时
`pdftotext` 会直接静默丢掉那部分数字，两种情况从命令是否报错上都看不出来。抓完一份关键 PDF后
先拿其中一个已知关键词 grep 一下确认提取正常，不要等到"引不出 quote"才回头怀疑抓取本身；后一
种情况可以尝试找同一信息的培训/FAQ/说明类文档，这类文档更可能是纯文本排版而非表格截图。
**v1.1 Batch 1 二次确认了这类"图片渲染表格"问题不是 SIX 的个案**：uk-lse 的 LCH EquityClear
清算费率表 PDF 同样 200+466KB 但 `pdftotext -layout` 只提取出零散的"–"符号，属同一类问题。

**`tools/fetch.py` 按 URL 生成缓存文件名，不看 Content-Type**——如果一个来源实际是 `.xlsx`
（如某监管机构公布的持牌机构名录表），落盘文件名仍会带 `.html` 后缀（因为 URL 路径本身可能
不以 `.xlsx` 结尾，或工具没有识别真实内容类型）。想用 `openpyxl`/`xlrd` 打开做行数统计等操作
前，先确认真实文件格式（`file <cache路径>`），必要时复制一份改成正确后缀再打开，不要被
`.html` 后缀误导成"这是网页，正文应该用 grep"。

### 4. 建数据文件，逐章填

新建 `data/exchanges/<exchange-id>.yml`，可以参考 `data/exchanges/cn-sse.yml` 或 `hk-hkex.yml` 的结构（信封字段、`_meta` 继承、章节划分都照抄格式）。

对每一章：

1. 先查 `schema/glossary.yml` 里有没有已收录的术语译法，有就直接用；**新术语按 glossary.yml 顶部的字段说明加一条**（回写）
2. 逐字段填：
   - `confidence: high` 的字段必须有 `quote` 且数字须在 quote 里找到（CLAUDE.md 二 第5条）
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
     或 `medium`），不要让它隐式继承章节级别的 high。** v1.0 Wave 2（br-b3、ch-six 各自独立
     实测）补了这个坑的另一面：**继承不只会把弱字段"抬高"，也会把真正有 quote 撑腰的字段
     "隐藏"起来**——四个 `trading_sessions.*` 子字段各自都有可摘引的原文，但因为没显式写
     `confidence` 键，光看 `grep confidence: high` 找不到它们，只有等 `make check` 因为
     "继承后缺 quote"报错才会发现。**结论：只要一个字段用了 `{zh, en, ...}` 信封结构，
     就该显式写自己的 `confidence`，不要指望"反正会继承"或"反正没人查"——继承是给"没意识到
     该显式声明"兜底的，不是设计上鼓励依赖的路径。** 调试这类报错时，`validate.py` 的检查
     跑在 `expand_field` 展开之后的数据上，不是原始 YAML——肉眼比对 raw YAML 常常看不出问题，
     应该跑 `python3 tools/sync.py` 后去看 `docs/data/exchanges/<id>.json` 里展开后的实际值。
     Phase 1b（[ADR-039]）给之前是空字符串的 `price_limits.main_board` 补 `spec` + `zh` 时又踩到
     同一个坑（`au-asx`/`hk-hkex`）：**把一个之前空的字段升级成信封（哪怕只是加 `spec`），也要顺手
     给它 `confidence` + `quote`（或显式 `confidence: medium/low`），否则继承章节 `_meta` 的 `high`
     就缺 quote 报错。**
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
   - **从 HTML 页面 grep 出来的"原文"如果只是粗暴去标签，会残留 `&amp;`/`&nbsp;` 等 HTML
     实体**，直接当 `quote` 用不算真正的逐字摘录（ca-tsx 实测）——摘引前用 Python
     `html.unescape()` 或等效手段先转换成真实字符。
   - **同一份 PDF 内引号字形可能不统一**（ca-tsx 遇到的 OSC 托管 PDF，部分段落用弯引号
     `“ ”`，部分用直角引号 `"`，像是拼接自不同来源草稿）——不能假设"这份文档统一用哪种就
     全篇套用"，摘引前逐段落检查；含直角引号 `"` 的片段不能塞进双引号包起来的 YAML 字符串
     （见上面的坑），要么改用块标量 `quote: |`，不能像中文语境那样偷懒换成「」（quote 必须
     逐字保真，英文原文的直角引号不能替换成中文引号）。
   - **法条原文如果用中文数字（十/百/千/一/二……）而非阿拉伯数字**（tw-twse 遇到的台湾法规
     库典型写法），`validate.py` 反查 `zh`/`en` 里的阿拉伯数字（如"10%"）时会在这份完全真实的
     quote 里找不到任何数字命中，误判成"quote 缺数字支撑"。变通办法：在 `quote` 里用"／"
     分隔符附加一段同页面里含阿拉伯数字的片段（如文件名"第12條修正案.pdf"），或者改引官方
     英文译本（通常用阿拉伯数字）配中文原文并列。**同类问题不止中文数字一种变体**——uk-lse
     子代理实测：英国 AIM Rules 习惯把"ten"/"twenty"/"three business days"这类数字拼成英文
     单词而非阿拉伯数字（同一份规则手册里 UKLR 部分反而用阿拉伯数字，两种写法混用），
     `zh`/`en` 字段写"20个营业日"时同样会在这份完全真实的 quote 里反查不到"20"，处理方式
     与中文数字变体相同（附加同文档里含阿拉伯数字的片段，或如实降级 `confidence: medium`
     并在 `detail` 说明原文是词拼数字）。
5. 如果某个字段甚至整个章节的设计前提对这类交易所根本不成立（如衍生品交易所没有"公司上市"概念，
   `listing` 章节整章不适用；`settlement_cycle`/`short_selling`/`intraday_reversal` 的设计假设
   都是现货股票市场的时间/借券结构），**如实留空 + 在 `detail` 里说明"设计前提不适用"，不要为了
   填满而强行套用**（比如把交易员资格考试硬填进上市审核字段）。这类发现比"查不到具体数值"更
   重要，记一条到第 7 步的框架性问题回写里，参考 `de-eurex.yml` 里 `listing` 章节顶部注释的写法
6. **`quote` 里如果拼接了不止一段原文（用"／"或"..."分隔的复合引用是本项目已确立的合法写法），
   每一段都必须能在同一份被 `sources` 引用的文档里逐字查到——不能从别的文档"借"一段拼进来
   凑成一句读起来通顺的话。** v1.0 Wave 2 人工抽检（`PROJECT/DECISIONS.md` [ADR-017] 流程）
   实测抓到一例真实违规：`fr-euronext.market_structure.volatility_interruption` 的 `quote`
   读起来完全合理（"...switch to a Call Phase...resumption shall take place only if the
   uncrossing price at expiration of that period falls in the prevailing dynamic collars"），
   `sources` 也标注了一个真实存在、内容相关的官方页面，但那句话逐字搜遍该页面根本不存在——
   实际是从另一份文档（Trading Manual PDF）的两处不相邻段落改写拼接出来的，读起来像引用，
   本质是编造。**这类问题比"查不到就留空"更隐蔽**：字段有 `confidence: high`、有貌似对应的
   `sources`、`quote` 也不是凭空捏造的通顺句子，`validate.py` 的数字反查规则也不会报错（如果
   凑巧数字对得上），只有真的拿 `quote` 原文去对应文档里逐字搜索才能发现。**填一个
   `confidence: high` 字段时，写完 `quote` 后应该反向确认：这段文字能否在 `sources` 列出的
   那份文档里用编辑器搜索直接定位到（哪怕跨行），而不是"大意上贴合我读过的内容就行"。**
   如果实在需要综合多处信息才能说清楚一个机制，要么把 `quote` 收窄到其中真正能逐字摘录的
   一段（其余用 `detail` 转述），要么把 `sources` 列全所有实际引用到的文档，不要让 `quote`
   看起来只对应一份来源、实则来自另一份。
7. **信源质量判断上几个值得沿用的经验模式（v1.0 Wave 2 新增样本）：**
   - 监管机构自己运营的投资者教育子站（域名与主站不同，但页脚署名机构本身，如 OSC 的
     `getsmarteraboutmoney.ca`）在自律组织官网被墙时，是合理的 `confidence: high` 替代路径，
     不必因为域名"看起来像第三方"就自动降级 medium——判断标准是页脚署名而非域名字面。
   - 公司自有 IR 文件托管在通用 CDN 上（如 `s21.q4cdn.com/<公司ID>/...`，内容标注
     "Source: <公司>"）本质上等同于公司自己的域名，Q4 Inc. 只是提供托管基础设施；这与真正的
     第三方新闻通讯社转发同一份新闻稿（如 newsfilecorp.com）是两回事，后者才应该封顶 medium。
   - **"集团数字 vs 单一实体数字"陷阱还有一个货币口径变体**：官方统计文档常把"全集团市场"
     （汇总）与"本文件实际收录的单一实体"并排列在同一张表/同一份 PDF 里（如 TMX 集团统计
     报告同时列"All TMX Equities Marketplaces"合计行与"Toronto Stock Exchange"单独行），
     视觉上相邻、格式相同，比跨文档的集团数字更容易顺手抓错——摘引统计数字前先确认摘的是
     哪一行对应的实体，不要看到"官方统计文档"就默认第一行数字能直接用。
   - 建档过程中如果字段的 `detail` 提到"已记入 OPEN-QUESTIONS"这类交叉引用，**顺手去
     `OPEN-QUESTIONS.md` 搜一下确认真有这条**——ca-tsx 子代理实测抓到一处 `cn-sse.yml` 里
     早就存在的失效交叉引用（写了"已记入"但实际没有对应条目），这类声明会不会兑现，光看
     写下声明的那一刻是不会暴露的，只有后续有人真的去验证才会发现，值得养成顺手抽查的习惯。
   - **验证一个"数了多少家/多少条"类事实（如"持牌券商共150家"）时，如果官方只发布了一份
     可下载的名录表（Excel/CSV），直接用 `openpyxl`/`xlrd` 打开数非表头行数、把首末几行
     作为 `quote` 佐证，是本项目已验证可行的 `confidence: high` 做法**（cn-sse 子代理用
     中国证监会官方 XLS 名录核实"150家证券公司"即为一例）——比试图在某个汇总性网页里找一句
     现成的"共X家"陈述更可靠，也更不容易过期。
   - **不要被任务提示词或既有假设里"这个字段大概率不适用/查不到"这类预判带偏方向。**
     v1.1 Batch 1 两个子代理独立推翻了各自任务描述里"该所大概率没有独立的监管费概念"的预设：
     `hk-hkex.costs.regulatory_fees` 实际存在 SFC/AFRC 两项独立征费；`cn-sse` 同字段虽然
     最终查明一份 2012 年通知的三年有效期已到期、后续是否续期未核实，但至少证明了"该国是否
     存在这个概念"本身需要认真检索一遍才能下结论，不能因为任务描述里写了"预期多数留空"就
     跳过检索直接判定不适用。
8. **第五章有几个 2026-08 新增（[ADR-042]）、规则手册里往往不集中的字段，建档时留意：**
   - `execution_model`（执行模型：订单驱动 / 报价驱动 / 混合 / 经纪撮合）——从既有
     `matching_principle` + `market_maker_scheme` 的已核实 quote 派生（同 [ADR-038] 把
     `matching_principle` 转 enum 的做法），`detail` 写推理链，不用重新抓。判定规则（[ADR-043]
     的 20 家结论）：**做市商有合同义务、承担点差 / 持续报价约束、实质参与价格形成 = `hybrid`**
     （NYSE DMM、Nasdaq 竞争性做市商、LSE 双轨、Xetra Designated Sponsor、Eurex 受监管做市商、
     SIX Market Maker Agreement、TSX Market Maker Firm、Tadawul CMA 做市商规则、Euronext 流动性
     提供者、B3 三类注册做市商）；**纯中央订单簿，做市仅激励型 / 限 ETF·结构性产品·SME 等产品线 =
     `order_driven`**（jp-jpx、hk-hkex、cn-sse/szse、tw-twse、kr-krx、sg-sgx、au-asx、za-jse、in-nse）。
     20 家样本里没有 `quote_driven` / `brokered`。做市商 quote 撑得住 enum 但「hybrid vs
     order_driven」是综合判断时标 `medium`。别和 `matching_principle`（订单簿内部的优先级）混。
   - `error_trade_rule`（错误交易 / 明显错误处理）——查规则手册的 "clearly erroneous" /
     "mistrade" / "cancellation of trades" / "annulment" / 日本「誤発注・特別気配」条款。[ADR-043]
     的 20 家呈**三谱系**，判完归入哪一类：① **阈值 + 时限复核制**（US 7.10/11890、德 FWB/Eurex
     Mistrade、澳 Procedure 3200、巴西 BRL 损失门槛、印度 Trade Annulment）——填 `review_window_min`
     + `deviation_threshold_pct`（分档时取最紧一档 + note 列全）；② **纯裁量 / 双边合意制**（LSE
     manifestly erroneous、SGX Rule 11.4、SIX 双方申请、TSX + CIRO、Euronext 4403/3）——
     `deviation_threshold_pct: null` + note；③ **成交近乎终局**（日 TSE Rule 13、港 SEHK Rule 567、
     台营业细则第 87 条错帐专户、中 交易规则 3.5.5/3.4.5）——`resolution: no_bust` 或窄口径
     `cancel` + note 说清事前防线（涨跌停 / 价格笼子 / 特別気配）。查规则手册常在「Cancellation of
     Trades」「Erroneous Trades」独立小节；美股走 **sec.gov SRO 规则申请 Exhibit 5**（Fair Access
     UA 可 curl，含增删标记时摘无标记的连续片段）。
   - `order_book_transparency`（订单簿透明度）——盘前订单簿公开程度 + 是否支持冰山 / 隐藏
     限价单 + 盘后大宗成交披露延迟；信息常散在 order types 条款、market data policy、
     block trade deferral 三处。**多数现货订单簿是「全展示，无非展示订单类型」**（日港中台）——
     这本身是与欧美（NYSE Non-Displayed/MPL、SIX Iceberg/AVD、Euronext Mid-Point、ASX Undisclosed/
     Centre Point、TSX Dark、JSE Pegged Hidden）的显著差异，值得写清。quote 常可复用
     `matching_principle` / `order_types` 已核实的措辞，多为 `medium`。与 `dark_pool`（独立暗池
     实体）、第十章 `market_data_levels` 分工见 `schema/taxonomy.yml` 三个字段各自的 note。
   - 这几个字段连同 `order_types` / `tick_size` 都有 `spec` 形状（`schema/spec.yml`）——按
     [ADR-035] 直接填 `spec`，填完在「市场机制剖面」视图里点开自检。**tick_size / error_trade_rule
     的 spec 数值填 5b 校验（数值逐字 ⊆ quote）踩过的坑（[ADR-043]）：**
     - **单位不一致**：官方表用「分 / cents」而 spec 想用「元 / dollars」→ 十进制对不上
       （ASX 澳分表、台湾官方英译「5 cents」）。对策：spec 直接沿用官方表单位
       （如 `currency: AUD_cents`），或 `ladder` 留 null 用 `full_table_note` 散文。
     - **欧陆逗号小数**：RTS 11 原文「0,01」，validate 5b 做 `quote.replace(",","")`→「001」，
       与 spec repr「0.01」不匹配 → 这类表一律 `min_tick: null` + 散文 `full_table_note`，
       不放数值 `ladder`（SIX Annex D 用句点小数，是可放 ladder 的例外）。
     - **规则 / 条款号别写进 `zh` / `en` 正文**：`NUMBER_RE` 把「Rule 4403」「RTS 11」「§ 87」
       「Ref 66/2024」里的数字当反查目标，quote 里没有就 fail——条款号只写进 `detail` / `note`
       / `sources` title。
     - **flow-mapping spec 里的长 note**：`spec: {a: b, note: "很长…含半角逗号…"}` PyYAML
       偶发 parse error；长 note 用块式 `spec:` 换行写。
   - 有些交易所的一手规则页是 JS 导航壳、curl 抓不到正文（KRX 英文栏目、NSE 现货交易机制页）——
     此时 `error_trade_rule` / `execution_model` 等如实标 `low` / `medium` + `detail` 说明 +
     记 OPEN-QUESTIONS，或退一步引第三方逐字转载件（`ricago.com` 转 NSE Consolidated Circular）
     / 权威财经媒体（`business-standard.com` 转 NSE 通函），均按 CLAUDE.md 二.3 封顶 `medium`。

9. **第十一章成本的 `spec`（[ADR-045]，成本瀑布）：** 6 个「按笔显性成本」字段
   （`commission_structure` / `exchange_fees` / `clearing_fees` / `regulatory_fees` /
   `stamp_duty` / `financial_transaction_tax`）都有 `spec` 形状（`schema/spec.yml` 的
   `cost_layer`）。要点：
   - **`spec` 只存 quote 逐字撑得住的原始费率 + `unit`**（`pct` / `permille` / `bp` /
     `per_share` / `per_lakh` / `per_crore` / `per_million` / `flat_*`）——归一到 bp 是渲染层的事，
     别在 `spec` 里换算（换算值不 verbatim → 5b FAIL）。国字数字（「千分之三」）、逗号小数
     （「0,25%」）的 quote 一律 `rate: null` + `note`（同 [ADR-039] 纪律）。
   - **`side: buy / sell / both`**——单边税看清楚（英股 SDRT 仅买方、A 股印花税仅卖方、
     港股双边、美股无）。maker-taker 所的 `exchange_fees` quote 常只含挂单返佣、吃单费未摘引
     → `rate: null` + `note`。
   - **该市场不征某费种 / 税目** → `type: none` + `note`（是关键事实，不是留空）。多项分征费
     （香港 SFC + AFRC、美股 NSCC value-into/out-of-net）用 `components: [{name, rate}]`，渲染层求和。
   - 填完在「成本瀑布」tab 里点开自检（渲染层落地后）。

### 5. 本地验证

```
make build       # sync + check 一次跑完
make serve       # 本地预览，浏览器打开 http://localhost:8000
```

`make check` 报错就照着错误信息改——每一条错误都对应一条铁律或一致性规则，不要绕过去。

**verbatim-quote 反查（v1.1 Batch 2 后必做）**：`make check` 现在内含 `tools/verify_quotes.py`——它把每个 `confidence: high` 字段的 `quote` 与 `.cache/<id>/_manifest.json` 中实际落盘的引用来源逐字比对（剥离 HTML 标签 + PDF/Office 文本提取）。任一 `high` 字段的 `quote` 不在已抓来源里即报错并阻断构建。填完一家后建议显式跑一遍确认：
```
python3 tools/verify_quotes.py --ex <id>     # 离线，只看这家
make verify-quotes-live                       # 现场抓取所有引用来源再比对（JS 页/被反爬拦的记 LIVE_ERR，信息性）
```
反查 FAIL 的处置（与 CLAUDE.md 二一致）：若 `quote` 其实在来源里只是被换行/空白打断，改写成来源里一段连续 verbatim 子串即可；若来源正文确无 verbatim 措辞（**抓到的是 404 页 / JS 渲染壳 / 纯图片 PDF 无文字层 / 仅第三方 paraphrase**），则**降级 `confidence: medium`**：保留 `sources`、删掉 `quote`（或把旧文字移入 `detail`），并加一行 `detail` 说明来源不可机器核验。绝不为过 check 而硬凑 quote——来源根本没抓到的，按 CLAUDE.md 三 记进 `SOURCES.md` 与 `OPEN-QUESTIONS.md`。要让更多来源可被反查，先 `python3 tools/fetch_sources.py` 把 yml 里所有 `sources` URL 落盘 `.cache`（sec.gov 走 Fair Access 格式 UA）。

浏览器里确认：矩阵新增了一行、点格子能看到刚填的出处、切到「English」模式该所的 `en` 字段显示正确、档案页十一章能逐章翻。

如果当前环境没有浏览器工具，用 Python 直接读 `docs/data/matrix.json` 和
`docs/data/exchanges/<id>.json` 模拟 `app.js` 的取值逻辑做等效核对（新交易所的枚举格子在
中英两种模式下能不能正确取到 label、`zh`/`en` 两个字段有没有大片不对称留空）——不如真人点一遍
浏览器可靠，但能捕捉"数据结构对不对"这类问题，比什么都不做强。

### 6. 遇阻：降级方案

如果确认某个来源真的抓不到（强反爬、付费规则库、扫描件 PDF），不代表这一步做不下去——见 `CLAUDE.md` 三。把「抓不到」的具体情况记进 `SOURCES.md`（试过什么方式），把待人工提供的具体页面记进 `PROJECT/OPEN-QUESTIONS.md`，换一个能抓的来源或换下一家交易所，不要因此放松第 4 步的标准去凑合填。

`sec.gov`/`finra.org`/`dtcc.com` 那一类"边缘防护级 403"的域名清单在 v1.0 Wave 2 又加了两个
新成员：加拿大自律组织官网 `ciro.ca`（换 UA/headers 均无效，`web.archive.org` 兜底也不稳定，
实测遇到间歇性 429/503）、南非法律数据库 `saflii.org`/`lawlibrary.org.za`。遇到"某国自律组织/
法律数据库域名"这个组合，直接假设大概率会 403，优先直接找该所自己官网对该法规/机构的引用文字
作为替代来源（哪怕只能确认名称编号、拿不到全文），不必每次都从头重新验证是否被封。

`validate.py` 的数字反查规则（`confidence: high` 的字段，`zh`/`en` 里的数字须在 `quote` 里
命中）还有两个值得知道的实现细节：**一是只反查 2 位数以上的数字**（`NUMBER_RE` 的
`len(...) >= 2` 过滤），像"七个市场""三档"这种个位数在 `zh`/`en` 里怎么写都不会被检查，不用
特地为了过这个检查去给个位数描述硬凑 quote；**二是这个检查对"综合多个事实合成的一句话"
有天然的假阳性倾向**——如果 `zh`/`en` 是从原始页面上下文里综合出来的一句话（如把周边分散的
几个日期/数字揉成一句叙述），但 `quote` 只摘了其中一句话，反查会因为"另外那个数字不在 quote
里"而失败，即使数据完全真实。遇到这种情况，要么把 `quote` 扩展到确实同一页面里含有那些数字的
相邻文字（前提是真的连续存在，不是从别处拼来的——见上面第 6 条的红线），要么老实降成
`confidence: medium`，在 `detail` 里注明"综合自页面多处内容"（现有 `OPEN-QUESTIONS.md` 第12条
就是这类问题的既定讨论范围）。

### 7. 收尾

- `make sync` 会自动更新 `PROJECT/ROADMAP.md` 的进度矩阵，**不需要手改**
- 检查这次研究过程中有没有值得记的：新的术语（回写 glossary）、新的资料来源经验（回写 SOURCES.md）、结构性的疑问或发现（回写 OPEN-QUESTIONS.md，仿照现有条目的格式）
- 如果这次填数据的过程让你意识到 `schema/taxonomy.yml` 某处设计有问题（字段不够用、某类交易所不适配现有结构），记一条到 `PROJECT/OPEN-QUESTIONS.md`「框架性问题」，不要为了绕开问题而在数据里硬凑
- 顺手看一眼这家所有没有让某个已进矩阵的字段"雪上加霜"（本来就常空、这次又空）——攒够信号后
  可能值得像 `PROJECT/DECISIONS.md` [ADR-014] 那样做一次矩阵列重新校准，但不需要每加一家所就
  重新算一遍，先记下来
