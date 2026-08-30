# 决策记录 DECISIONS

轻量 ADR。每条记「定了什么 / 为什么 / 何时」。改动前先看这里，避免把有意的取舍当成疏漏改掉。别的文档引用决策时只标 `[ADR-NNN]`，不复述理由——理由的唯一权威在这里。

---

### ADR-001 — 不沿用参考项目的 CSV 数据格式
**定了什么：** 权威数据格式用 YAML（`data/exchanges/*.yml`），不用 CSV。
**为什么：** 启发项目（`llm2014/llm_benchmark`）的数据是同构宽表（模型 × 指标），天然适合 CSV。交易所数据是深层嵌套的异构文档（交易所 × 11 章 × 多层字段 + 大量自由文本 + 每条须有出处），CSV 当不了权威格式。
**日期：** 2026-08-12

### ADR-002 — YAML 权威 + JSON 派生，产物入库
**定了什么：** 人手写 YAML；`make sync` 生成 JSON 到 `docs/data/`；JSON 产物提交进仓库，不用 CI 生成后部署。
**为什么：** YAML 适合人写（注释、多行文本、锚点）；JSON 适合前端直接 fetch。产物入库保住「零 CI 部署」——推送即上线，CI 只跑 `make check` 校验，不碰部署，脚本坏了也不影响已上线的站点。
**日期：** 2026-08-12

### ADR-003 — 不设月度更新节奏，改用核实日期驱动
**定了什么：** 不像参考项目那样按月产出新快照。每个字段带 `verified` 日期，按 `volatility` 等级（stable/moderate/volatile）设复核阈值，超期由 `freshness.json` 标记待复核。
**为什么：** 交易所规则不按月变，月度全量快照对本项目是冗余负担且 diff 难看。真正需要的是"这条规则多久没人核实过"，而不是"这个月有没有产出"。
**日期：** 2026-08-12

### ADR-004 — 横切切入：标杆交易所做全十一章，而非全量交易所做浅字段
**定了什么：** v0.1/v0.2 选 5 家标杆交易所，每家填满全部十一章；不先铺开广度。
**为什么：** 十一章 × 数十家是巨量工作。横切能在少数样本上验证 schema 的深度是否够用、矩阵是否好看，比铺开广度更早暴露结构缺陷。
**日期：** 2026-08-12

### ADR-005 — 对比矩阵是默认首屏视图
**定了什么：** 站点默认进矩阵视图（行=交易所，列=可切换维度组），不是逐所档案列表。
**为什么：** 横向可比是本项目相对于"某交易所规则百科"的核心差异化价值。矩阵格子用「短标签 + 可展开细则」解决不同交易所同一机制不可直接比较的问题（如日本值幅制限是阶梯绝对值、A股是百分比）。
**日期：** 2026-08-12
**状态：** 已被 [ADR-035] A 节修订（2026-08-30）——v2.0 主视图改为单市场「交易日平面图」，矩阵降为对比模式（`#view=matrix`）。矩阵本身与「横向可比有价值」的判断不变，改的只是"默认首屏"。

### ADR-006 — UI 标签恒中英双语，与「数据语言模式」分离
**定了什么：** 界面标签（表头、章节名、枚举标签）永远中英并列显示，不受语言模式开关影响；语言模式开关只切换**数据值**在「纯中文」与「原语言」之间。
**为什么：** 若 UI 也跟着切换，会与"数据值原语言模式"混淆——用户分不清是界面变了还是数据变了。UI 双语是本项目对外可读性的底线，不该是可关闭的选项。
**日期：** 2026-08-12

### ADR-007 — 数据语言体系：纯中文 / 原语言两种模式
**定了什么：** 数据值支持切换：纯中文模式全部显示中文译名；原语言模式显示该交易所官方语言原文（可多语言，见港交所 `official_languages: [zh-Hant, en]`）。
**为什么：** 查证原始规则手册时经常需要对照原文表述，不能只留译名；同时纯中文模式照顾快速横向扫读。
**日期：** 2026-08-12
**状态：** 已被 [ADR-013] 取代（数据语言简化为 zh/en 固定两态）。本条保留作历史记录，不再是当前实现。

### ADR-008 — 不引入 MCP
**定了什么：** 抓取与查证只用内置 WebSearch + curl 封装（`tools/fetch.py`），不接入额外 MCP。
**为什么：** 实测表明瓶颈不在工具种类而在反爬（WebFetch 被 403，换 curl UA 即可过）与入口发现（WebSearch 已够用）。不为用而用；若未来要批量监控各所公告 RSS 或接入付费规则库，再评估。
**日期：** 2026-08-12

### ADR-009 — v0.1/v0.2 标杆交易所选择
**定了什么：**
- v0.1（2 家）：上交所 SSE、港交所 HKEX
- v0.2（+3 家）：NYSE、JPX、Eurex

**为什么：**
- 上交所：中文原生资料最全，验证十一章能否快速填满
- 港交所：**官方中英双语**，直接压测 `native` 字段的多语言边界；与上交所有互联互通，验证跨交易所引用
- NYSE：全球参照系，LULD、DMM 做市商制、英文原语言
- JPX：日文原语言，值幅制限是阶梯绝对值而非百分比，直接压测矩阵"不可比"问题的解法
- Eurex：**衍生品交易所**，机制（保证金、交割、夜盘）与现货所完全不同，压测 schema 对非股票交易所的适应性；德文原语言

**日期：** 2026-08-12

### ADR-010 — taxonomy.yml 章节划分：舍弃原大纲第一、十三章作为数据章节
**定了什么：** `schema/taxonomy.yml` 的 `chapters` 只收原大纲第二至十二章（十一章）。第一章（研究范围与对象界定）的可执行部分变成 `exchange_identity`（交易所身份元数据，非章节）；第十三章（研究方法与维护机制）不落地为数据，因为它描述的是"如何研究"而非"某交易所的事实"——已经是本仓库自身的工程机制（`CLAUDE.md`/`PROJECT/SOURCES.md`/`tools/`）。
**为什么：** 逐交易所字段字典里混入"项目怎么运作"的元描述会让 schema 变得自指且难以校验；拆开后两边职责都更清楚。
**日期：** 2026-08-13

### ADR-011 — 矩阵列不在 taxonomy 里单独维护，由字段级 `in_matrix` 标记派生
**定了什么：** `taxonomy.yml` 的 `dimension_groups` 只定义维度组的身份与顺序，不手写每组包含哪些列。具体列由 `sync.py` 扫描所有 `in_matrix: <group_id>` 的字段生成。
**为什么：** 若同时维护"字段定义"和"矩阵列清单"两份列表，加一个字段容易漏改其中一处，属于本项目明确要杜绝的"同一件事两处手写"。
**日期：** 2026-08-13

### ADR-012 — 列表型章节（产品体系、指数体系）使用轻量条目，不套完整事实信封
**定了什么：** 产品与指数章节的列表项只有普通类型字段（`name_zh`/`category`/枚举等），不像扁平章节字段那样逐项要求 `quote`/`confidence`/`sources`；出处等信息在章节 `_meta` 层面共享。
**为什么：** 一家交易所可能有几十个期货品种、十几支指数，若每个列表项都要完整信封（含逐项原文摘录），v0.1 工作量会失控。这是刻意简化，代价记在 `OPEN-QUESTIONS.md`（"schema 会不会被列表型章节撑破"），v0.1 填完上交所后检验是否够用。
**日期：** 2026-08-13

### ADR-013 — 数据语言体系简化为 zh/en 固定两态，取代 ADR-007
**定了什么：**
- 事实信封的语言字段从 `zh/native/native_lang` 三个简化为 `zh/en` 两个；`native_lang`（逐字段声明原语言是哪种）整个删除。
- `exchange_identity` 新增必填字段 `source_lang: zh | en`，交易所级别声明一次，决定该所数据的 `quote`/`sources`/`confidence` 这几个溯源字段锚定的是哪种语言的原文；另一种语言的字段值视为对源语言的翻译展示。
- 语言取源的判定规则：**有官方中文原文就锚中文，没有就锚英文，中英文都没有可靠原文就留空转 `OPEN-QUESTIONS`**（不是"数据值可以随便拿哪种语言凑"，而是按有无可核实原文的优先级取源）。v0.1 两家标杆（`cn-sse`、`hk-hkex`）都有可核实的官方中文原文（港交所官网中英文逐页平行发布，`sc_lang=zh-hk` 与 `sc_lang=en` 结构一致），故都标 `source_lang: zh`；预期 v0.2 的 NYSE/JPX/Eurex 没有可靠的官方中文原文，标 `source_lang: en`。
- 原 `native_required` 字段属性更名为 `en_required`，语义不变（仅对机制名/板块名/法规名/订单类型名/机构名这类专有名词要求填英文对照，数字百分比日期不要求）。

**为什么：** 覆盖 [ADR-007]。原方案假设"原语言"因交易所而异（可能是日语、德语、繁体中文……），每条数据要靠 `native_lang` 逐字段声明当前用的是哪种语言，一个交易所甚至可能有多语言 `native`。但几乎每个交易所都有英文官网，中文可以视为翻译目标或本身就有官方原文，不需要"原语言不固定"这层复杂度。把语言选择从"逐字段判断"降为"交易所级别的固定属性"，是本质简化；连带的实质利好是 v0.2 的 JPX、Eurex 不再需要真啃日语、德语原文——直接用英文官网取数即可，检索成本明显下降。

**为什么放在 v0.1 收尾之后、v0.2 开始之前独立执行，不与新增交易所混在同一批改动：** 这是数据模型本身的改动，后面所有工作都依赖它；现在只有两家交易所的数据要迁移，改动成本最低，拖到 v0.2 填完三家新交易所后再改，返工的数据量会翻两三倍。且 v0.2 本身直接受益于这次简化，应该先改完模型再开工，不要让 v0.2 先按旧模型填了 JPX/Eurex 之后再迁移一次。

**已知的迁移不对称：** `hk-hkex.yml` 现有 `native` 字段绝大多数已经是纯英文，机械改名加抽查即可；但其中 2-3 处中英文混杂的字段（如 `市調機制 (Volatility Control Mechanism, VCM)`）需要拆开成 zh 官方译名 + en 英文全称，不能整体照搬。`cn-sse.yml` 的情况相反且更费工：现有 `native` 字段大多数存的其实是中文（与 `zh` 重复，是旧模型下"原语言=中文"的产物），不能机械改名塞进 `en`，需要重新去上交所英文官网核实对应英文表达；查不到的按铁律留空，不强行凑数。

**日期：** 2026-08-13

### ADR-014 — 矩阵维度组按实测填充率重新校准，不是拍脑袋定的

**定了什么：** 五家标杆（cn-sse/hk-hkex/us-nyse/jp-jpx/de-eurex）数据全部到位后，逐字段统计实际填充率，把 `in_matrix` 标记从"填充率 0-1/5（形同虚设的空列）"的 6 个字段移除，换成"填充率 4-5/5（已被验证可跨交易所稳定获取）"的 6 个字段：

- 移除：`overview.market_cap_usd_bn`(1/5)、`overview.listed_companies_count`(1/5)、`regulation.foreign_ownership_limit`(0/5)、`participants.foreign_access_channel`(0/5)、`costs.capital_gains_tax`(0/5)、`costs.dividend_withholding_tax`(0/5)
- 新增：`regulation.self_regulatory_org`(5/5)、`regulation.core_laws`(5/5)、`costs.exchange_fees`(3/5)、`market_structure.order_types`(5/5)、`market_structure.market_maker_scheme`(4/5)、`participants.membership_structure`(5/5，沿用 `foreign_access_channel` 先例分到 `overview` 组而非新建 participants 组)

结果：`regulation` 组从"1 个能看的列"变 3 个，`overview` 组从"2 个死列+3个活列"变 4 个全活，`costs_taxes` 从"1 弱+2死"变 2 个真实列。`trading_mechanism`/`listing_delisting`/`clearing_settlement` 三组本次未动——前者已经很健康（10 个字段全部 4-5/5），后两组尝试过但没找到填充率够格的候选字段可加，维持原状比硬凑一个填充率 1/5 的字段更诚实。

**为什么：** 矩阵是"横向可比"这个核心价值主张的落地入口（ADR-005），一个挂着标记却五家里四家显示"—"的列，看起来像数据没填全，实际是列本身选错了——用户分不清是"这家所没有这个信息"还是"这个维度本来就不该比"。`in_matrix` 是纯声明式标记（ADR-011），换标记不影响任何底层数据，是全项目里改动风险最低、但矩阵观感提升最直接的一类调整，值得在五个真实样本到位后专门做一次，而不是等到样本更多时才做（样本越多，选出的字段被推翻重来的成本越高）。

**为什么不做的部分：** 没有为了凑数给 `listing_delisting`/`costs_taxes` 加填充率很低的字段——矩阵格子大片空白比矩阵列少更容易被误读成"这个维度普遍没做"，而实情是这类信息（上市细则、具体税率）本身就比交易机制更难跨法域找到可比口径，这是真实的领域difficulty，不是本项目的疏漏，硬凑只会把这个诚实的信号抹掉。

**日期：** 2026-08-14

### ADR-015 — 时区甘特条的时段数据是构建期近似推导，不是新增的事实字段

**定了什么：** v0.3 新增的时区甘特条视图（`#view=timezone`）需要每家所的开盘/收盘/午休时刻并换算到 UTC 对齐展示。这组数字不是在 `data/exchanges/*.yml` 里新增字段人工填写，而是 `tools/sync.py` 新增的 `compute_trading_window()` 在构建期从已有的 `market_structure.trading_sessions.*` 自由文本（本来就各自带 quote/sources）里正则抽取 H:MM 数字算出来的，写入 `manifest.json` 每个交易所的 `trading_hours` 字段，前端只管渲染，不重新解析文本。UTC 对齐所需的时区标识符（如 `Asia/Shanghai`、`America/New_York`）是写在 `sync.py` 里的一张固定映射表 `EXCHANGE_IANA_TZ`，靠 Python `zoneinfo` 在构建当天动态解出含夏令时的 UTC 偏移，夏令时切换后重新 `make sync` 会自动跟着变。

**为什么这组数字不需要 quote/confidence：** 它不是一条新事实，是已有事实（`trading_sessions` 各字段，各自已带 quote 与 sources）的派生摘要，类似矩阵格子的枚举短标签是完整信封的摘要——真相仍然只在 `data/` 里那一处，改一次交易时段，下次 `make sync` 甘特条自动跟着变，不会出现"两处手写、一处忘改"（见第一节核心原则）。`EXCHANGE_IANA_TZ` 这张表本身也不是需要溯源的规则条款，是标准地理时区数据库的常识性映射，不受 `CLAUDE.md` 第二节铁律约束。

**已知的近似性，接受的原因：** 正则抽取取的是字段全文里出现的最小/最大时刻，不是逐段精确解析（如上交所收盘集合竞价的三个时间点会被合并成一段 13:00-15:00）；抽取不到数字的字段（如"无独立盘前时段"）自然不产生柱段，不是缺陷。误差量级是"分钟"，用途是"一眼看哪些所同时段在交易"，不是替代档案页的精确时段数据——视图文案与柱段悬浮提示都带了本地时段原文对照，没有伪装成比档案页更精确。五家标杆的推导结果已逐一人工核对（Eurex 因跨 UTC 零点被正确拆成两段柱、含夏令时的 NYSE/Eurex 偏移在当前日期下也核对无误）。

**日期：** 2026-08-14

### ADR-016 — v1.0 交易所候选清单与分波顺序

**定了什么：** v1.0（横向铺开到 20+ 家）新增约 15 家交易所，`tier: extended`，分两波推进：Wave 1（8 家，优先）、Wave 2（7 家，视 Wave 1 结果再排，非最终锁定）。完整清单（每家草案 `id`、地区初判、压测点）与进度状态是 `PROJECT/ROADMAP.md`「v1.0 计划」一节的唯一权威，本条只记两波怎么分、为什么这么分，不重复清单本身，避免两处手写——具体 `id`/`region`/`group_id` 以实际建档时（`add-exchange` skill 第 1 步）核实为准。

**为什么这个名单、这个分波：**
- 优先级排序依据三条：①填补现有 5 家的地区空白——`region: mena_africa` 目前 0 家、`americas` 只有 1 家，Wave 1 里的 `sa-tadawul`、`us-nasdaq` 直接对应；②延续 v0.1/v0.2 已经验证有效的"同国/同集团对照"取值口径压测法（SSE↔SZSE、NYSE↔Nasdaq、Eurex↔Xetra 都是这个模式，能直接检验 `group_id` 与"姊妹交易所不能把规则塞进本文件 boards"这条设计——见 `add-exchange` skill 第 1 步——在多个真实案例下站不站得住）；③挑一个结构性新样本（Euronext 的"一所横跨多国市场"）延续 Eurex（首个衍生品所）那样"用真实样本压测 schema 边界"的传统，而不是止步于再填几家看起来大同小异的现货交易所。
- 分两波而非一次锁死 15 家：Wave 1 做完后要按 [ADR-017] 的质量门槛复核一次，若过程本身有卡点（如某类交易所官网反爬明显更强、或 schema 又暴露新的不适配），Wave 2 的具体名单应该据此调整，不提前锁定，避免"先列好清单再发现前几家就走不通"式的被动返工。

**日期：** 2026-08-14

### ADR-017 — v1.0 执行模式：分波并行执行子代理 + 缩小单所抽检样本但维持通过率阈值

**定了什么：**
- **执行模式**：不再像 v0.1/v0.2 那样在同一个会话里逐家串行跑 `add-exchange` skill，改为每波内用 Agent 工具并行派发子代理，每个子代理领一家交易所独立执行 skill 全部步骤（含步骤 7 回写 SOURCES/glossary/OPEN-QUESTIONS）；子代理之间不共享状态，允许真并行。每波结束后统一跑一次 `make build` 复核，而不是每家单独跑。
- **质量门槛**：每家新交易所的人工抽检字段数从 v0.1 的 20 个降到 10 个，通过率阈值维持 [CLAUDE.md 四] 的 ≥95% 不变；某家未过阈值时只暂停、复核该家，不影响同批次其他已过关的交易所——门槛是"按所"评估，不是"按批次"整体评估。

**为什么降抽检样本量但不降阈值：** v0.1 的 20 字段 / 95% 门槛验证的是"流程本身可不可靠"（见 `CLAUDE.md` 四），这个问题在 5 家、跨股票/衍生品两类机制之后已经有了充分证据说是可靠的——继续对每一家新交易所都抽检 20 个字段，是在重复验证一个已经验证过的命题，边际价值低于边际成本。但阈值本身（95%）不能降，因为它防的是"这一家具体研究错了"这种个案风险，跟"流程整体行不行"是两个不同的问题，后者被 v0.1 证明过不代表前者自动免检。

**为什么改成并行子代理而不是继续串行：** 15 家交易所若沿用 v0.2 那种单会话逐家串行的节奏，时间成本会线性放大到不现实的量级；而 `add-exchange` skill 在 v0.2 三次实操后已经"定型"（吸收了 `group_id` 判断、SOURCES.md 默认要补充、WebSearch 摘要不算来源、限流应对、zh/en 需同等充实、结构性不适配的处理方式等具体教训），已经具备"新会话冷启动也能可靠执行"的前提条件——这正是让子代理独立执行、不需要人在旁边随时纠偏的必要条件。没有这条前提，并行只会把 v0.2 踩过的坑在 15 个子代理里重新踩一遍。

**风险与应对：** 子代理之间没有互相学习的机制——若某个子代理执行中发现了 skill 文档没覆盖的新坑（类似 v0.2 时发现的 `fetch.py` 两个潜伏 bug），不会像同一会话连续执行时那样自动被后续交易所继承。应对：每波结束后除了数据质量复核，还要专门过一遍各子代理的执行记录，把新发现的教训回写进 skill 文档，再开下一波——"回写"这个动作从"每家做完顺手做"变成"每波做完集中做一次"，这一步不能省略，否则并行执行换来的速度会被质量方差吃掉。

**日期：** 2026-08-14

### ADR-018 — `review_system` 矩阵列的枚举覆盖率问题，定为 Wave 1 启动前必须解决的阻塞项

**定了什么：** `listing.review_system` 目前标了 `in_matrix: listing_delisting`，但 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第3条已经记录：五家标杆里没有一家能被现有 `review_system` 枚举（registration/approval/hybrid）干净覆盖，这个字段实质已退化成自由文本描述而非可比较的枚举。这个问题不再作为"值得考虑"的无限期悬置项对待，定为**必须在 v1.0 Wave 1（8 家）正式启动前解决**——具体怎么修（如 `OPEN-QUESTIONS` 提议的拆成"审核严格度"+"规则形式化程度"两个正交维度，或其他方案）不在本条锁定，留给实际动手修改时依据五家现有数据判断。

**为什么现在必须处理，不能继续拖到样本更多时再评估：**
1. 这个问题的性质和 [ADR-014] 处理过的"矩阵列填充率低"不是一回事，不能用同一套判据筛掉——`review_system` 五家都有值，填充率是满的，问题出在"选项覆盖率"而非"有没有数据"，[ADR-014] 当时校准用的是填充率这把尺子，测不出这类问题，是那次校准流程本身的一处盲区，现在补上。
2. v1.0 即将用 [ADR-017] 定下的并行子代理模式一次性铺开 15 家——不先修，15 个子代理会各自再产出一次"填不进枚举、退化成自由文本"的 `review_system`，返工成本随样本数线性放大，这和 [ADR-013] 当年"数据模型改动要趁样本少时做，拖到填完更多交易所后改代价会翻倍"是同一条教训，没必要重新交一次学费。
3. 现在 5 个样本已经完整暴露了枚举不够用的具体形态（四种互不相同的真实审核制度描述），有足够证据支撑怎么改，不是"再等等看会不会自己变清楚"的情况。

**为什么不直接把这一列从矩阵摘掉（`in_matrix: false`）搪塞过去：** `listing_delisting` 矩阵组目前只有 `review_system`、`delisting_conditions` 两列，[ADR-014] 校准时已经因为"没找到填充率够格的候选字段可加"而让这组维持在偏薄状态；摘掉 `review_system` 会让这组只剩一列，比现状更单薄，是让问题更严重而非更诚实（对比 [ADR-014]"矩阵格子大片空白比矩阵列少更容易被误读"那条判断）。真正要修的是枚举本身，不是拿掉字段。

**为什么本条不直接定下新枚举的具体拆法：** 怎么拆需要重新逐条对照五家现有 `review_system.zh` 的实际描述文本才能判断，这是需要坐下来看数据才能做的具体设计工作，本条 ADR 只锁定"必须现在做、不能再拖到 Wave 1 之后"这个时点决策。

**日期：** 2026-08-14

**执行进度补记（2026-08-17）：** 本条要求的"Wave 1 启动前解决"实际未生效——Wave 1（8家）/Wave 2（7家）均已执行完毕，`review_system` 枚举覆盖率不足问题未被拦截，15 个子代理各自产出了退化成自由文本的 `review_system`，`OPEN-QUESTIONS.md` 框架性问题第3条案例数从 5 个滚到 11 个。**原因：** 执行期间 `DECISIONS.md`/`OPEN-QUESTIONS.md` 分处 `main` 与 `worktree-v1-wave1` 两条分支演进，本条写下时所在分支未被 Wave 1 启动时的会话同步读到——是执行流程疏漏，不是决策本身错误，"应该修"的结论不变，只是错过了时点。**处理：不追溯返工已完成的 15 家**（成本已沉没），枚举怎么拆连同已积累的 11 个真实案例，与 [ADR-019] 记录的另外两处 schema 缺口（衍生品市场机制、指数口径）一起转为"高优先级待办"排期，不再是"阻塞项"。

**已解决（2026-08-19）：** 见 [ADR-023]，`review_system` 枚举从 3 值扩到 5 值，18/20 家现在有归类；`OPEN-QUESTIONS.md` 框架性问题第3条已按规则删除。

### ADR-019 — 市场结构增设 `derivatives` 子块表达同一实体的第二条产品线；指数体系增设 `scope` 区分交易所自身指数与跨交易所市场基准

**编号说明：** 本条在两条独立分支（`worktree-v1-wave1` 与其上派生的 hk-hkex 衍生品补全子代理分支）上各自被独立起草过一次，编号分别是"ADR-018"（因为各自分支当时看到的 `DECISIONS.md` 最后一条都是 ADR-017，误以为 018 是下一个可用编号）；两分支汇合后发现 `main` 分支上已经有一条独立的、更早（2026-08-14）写下的真正 ADR-018（即上一条，`review_system` 枚举覆盖率问题）。按"日期更早者保留原编号"处理，本条统一改记为 ADR-019。

**背景：** 用户实测发现两处系统性缺口，不是个别交易所漏填，而是 schema 本身没预留位置：
1. **市场结构与产品体系脱节**：`schema/taxonomy.yml` 第五章 `market_structure` 是单一扁平结构，隐含"一个实体只有一类产品的交易机制"的假设。但至少 9 家交易所（`au-asx`/`br-b3`/`cn-szse`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse`）第四章「产品体系」已列期货/期权类产品，第五章却完全没有衍生品自己的交易时段/撮合机制/价格限制/熔断规则——不是查不到，是字段设计从未覆盖现货以外的产品线。这比 `de-eurex`（纯衍生品所，`listing` 整章不适用）与 `sg-sgx`（`OPEN-QUESTIONS.md` 第27条"一所多业务合并单条目"）已知的两种不适配更严重——那两处是"字段取值被迫近似/整章空置"，这里是"整条产品线的机制信息从未被建模"。
2. **指数体系"交易所"与"市场"两种颗粒度混淆**：港交所只收了恒生指数，未收同一家公司（恒生指数有限公司）编制、成分股同样来自港交所上市证券的国企指数与恒生科技指数——纯数据缺口，不需要改 schema。但美股两家只收了自编指数（纳斯达克综合/100、纽约综合），未收标普500/罗素2000/道指——这类指数成分股天然横跨多个交易所（标普500同含纽交所与纳斯达克上市公司），本项目记录单元是单个交易所，"该算哪家"没有唯一正确答案，不能简单当缺口补，需先在 schema 层面想清楚怎么表达。

**定了什么：**
1. **`market_structure` 增设 `derivatives`（`kind: object`）子字段**，字段集合以第五章顶层字段为基础裁剪：保留 `trading_sessions`/`opening_mechanism`/`closing_mechanism`/`matching_principle`/`order_types`/`tick_size`/`price_limits`/`circuit_breaker`/`volatility_interruption`/`trading_halt_mechanism`/`block_trade`/`market_maker_scheme`/`connect_schemes`；去掉现货语境特有、对标准化合约类衍生品普遍不适用的 `board_lot_size`/`odd_lot_handling`/`intraday_reversal`/`short_selling`/`dark_pool`（这五个字段对衍生品场景几乎必然不适用，直接不放进子字段结构，比逐所重复写"不适用"更干净）；新增两个衍生品特有字段 `contract_specs_note`（合约规格摘要，如合约乘数/到期月份序列）与 `margin_practice_note`（交易端保证金制度摘要，与 `clearing.initial_margin_practice`——清算端保证金方法论——视角不同、不合并）。顶层字段继续默认表达"现货/主板市场"机制（对纯现货交易所无感知、无需改动），`derivatives` 只在该实体自身运营重要衍生品业务线时才填。**不新增第十二个章节**——十一章框架在 `CLAUDE.md`/README/skill 文档里到处硬编码，新增顶层章节要处处联动改名，收益远小于代价；挂在现有第五章下，靠 `sync.py`/`app.js` 已支持的"嵌套 object 递归渲染"（`trading_sessions`/`price_limits` 已是先例）直接工作，不改任何 Python/JS 代码，是纯 schema+数据层面的改动。`derivatives` 子字段不挂 `in_matrix`——9/20 家有数据、11/20 家常年空白的列会把矩阵稀释成"看不出是没有还是没填"，这类深度信息留在档案页，不上矩阵。
2. **`indices` 列表项 `item_schema` 增设 `scope`（`enum_ref: index_scope`，值 `exchange` 交易所自身指数 / `market` 跨交易所市场基准）**。`exchange` 是既有惯例的显式化（现有条目默认补 `exchange`）；`market` 用于标普500/罗素2000/道指这类成分股不专属于单一交易所的基准指数。**允许同一个 `market` 型指数在多个相关交易所的文件里各自出现一条精简记录**（如标普500分别在 `us-nyse.yml`、`us-nasdaq.yml` 下各登记一条），但明确要求：`market` 型条目只填 `id`/`name_zh`/`name_native`/`compiler`/`flagship: no`，**不逐条摘引 `base_date`/`weighting_method`/`review_frequency` 这类容易跨文件失步的细节数字**，把"这个指数具体怎么编制"的完整说明放进其中一个更贴近的档案页 `detail`（如标普500放美股任一家的 `detail` 里写清楚"成分股横跨纽交所与纳斯达克"），另一家用一句 `note` 互相指向，不是逐字复制同一份细节两遍——`CLAUDE.md` 开篇"任何一个事实只在一处手写"这条原则对治理文档（`README`/`SOURCES`/`ROADMAP` 等）是硬约束，对 `data/` 里"同一枚举型事实需要从多个入口可查"这种情况允许受控例外，但受控的方式是"细节只写一处、其余处引用"，不是"处处都写一份独立细节"。

**为什么不做集中式指数登记表（如新增一个独立的 data/market-indices.yml 登记文件）：** 考虑过，否决。集中登记表能彻底解决"细节只在一处"，但代价是新增一个独立的数据文件 + `sync.py` 合并步骤把登记表内容拼回各交易所视图——这是为"标普500/罗素2000/道指等个位数几个近乎不变的静态事实（编制方/基日/加权方式常年不变）"新增一条永久性构建流水线，成本与收益不成比例。轻量方案（`scope` 标记 + 细节只写一处 + 互相 `note` 指向）已经消除了"两份细节各自漂移"的主要风险，剩下的"两个文件各存一份 `id`/`compiler` 这类几乎不变的元信息"重复量可以接受。

**为什么 9 家交易所的衍生品机制不在本条 ADR 里一次性填完：** 这是 schema 决定，不是数据填充决定——本 ADR 只新增字段定义、示范性填一家（`hk-hkex`，用户举的具体例子）验证 schema 能不能用，其余 8 家（`au-asx`/`br-b3`/`cn-szse`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse`）记入 `PROJECT/OPEN-QUESTIONS.md` 框架性问题，作为下一次专项补齐的候选清单——规模接近半个 Wave，值得像 v1.0 各 Wave 一样单独排期、按 [ADR-017] 的模式并行执行，而不是趁手就近塞进本次会话。

**日期：** 2026-08-17

### ADR-020 — `chapter_status()` 完成度分母排除完全未启用的 `optional` 字段组；空值率审计的分类结论

**背景：** 用户要求排查全库空值率 > 80% 的字段，判断每一处是"真实数值存在但没抓到"还是"字段设计不合理、本就不存在具体数值"，分别补数值或调字段。用脚本对 20 家交易所逐叶子字段算空值率（复用 `tools/sync.py` 的 `expand_exchange`/`get_by_path`，未新增校验逻辑），117 个叶子/列表字段里 49 个 > 80%。

**分类结论：**
1. **28 个字段（占比过半）是 `market_structure.derivatives.*` 子块**，空值率普遍 95-100%（仅 `hk-hkex` 填了）。这不是新发现——`PROJECT/OPEN-QUESTIONS.md` 框架性问题第 42 条与 [ADR-019] 已经定性：9 家交易所（`au-asx`/`br-b3`/`cn-szse`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse`）第四章「产品体系」已列衍生品类产品、第五章却从未填衍生品机制，是**真实数据缺口**（Category B，本条审计未新增名单——本次按 [ADR-019] 判据"产品体系是否列出 future/option 类产品"逐一核对了另外几家可疑候选 `cn-sse`/`jp-jpx`/`us-nasdaq`/`us-nyse`/`uk-lse` 等 9 家，`products.items` 均无衍生品类目，没有发现被遗漏的隐藏缺口，维持 ADR-019 原有的 9 家名单不变）；其余 10 家（含 `de-eurex` 用顶层字段表达衍生品、`de-xetra`/`ch-six`/`ca-tsx`/`tw-twse` 等衍生品业务由集团内独立法人经营已被分别建档或不在本项目范围）留空是**设计上的正确状态**（Category A，字段本就不该有值）。
2. **但 Category A 部分暴露了一处真实的字段设计缺陷，与上述"是否该填"无关，是"填不填都不该被这样计分"**：`chapter_status()` 原实现把 `derivatives` 子块的全部叶子字段无差别计入 `market_structure` 章节完成度的分母。11 家没有衍生品业务的现货交易所，哪怕把所有适用字段都填满、无一处 low confidence，也会因为这组永远不会有值的字段被卡在 🟡，永远到不了 ✅——`cn-szse` 就是实例：本条修复前后对比，`market_structure` 列从 🟡 变为 ✅（该所衍生品业务已建档为独立子块 `cn-szse` 期权，但截至本次审计仍未填，其余字段全部完整）。**这才是用户问题里"字段设计不合理"的真实案例**，不是 `derivatives` 字段本身设计错了（[ADR-019] 的裁剪设计是对的），而是完成度统计没有区分"这组字段对本交易所不适用"与"这组字段适用但没填"两种留空。
3. **其余约 21 个非 `derivatives` 字段**（`listing.post_delisting_venue`、`participants.broker_landscape`、`infrastructure.data_pricing_model`/`historical_data_availability`、`costs.regulatory_fees`/`implicit_costs_note`、`risks.political_risk_note`/`liquidity_risk_note` 等）**绝大多数是普通数据缺口（Category B）**，不是字段设计问题——`PROJECT/OPEN-QUESTIONS.md` 框架性问题第 4 条早已量化过同一现象："十一章约 80 个可填字段，实际只有约 20 个做到 high+完整 quote；其余约 15 个因为没有当次抓取到的原文被迫清空转悬案"，本条审计看到的高空值率字段集中在 `regulation`/`participants`/`infrastructure`/`costs`/`risks` 五章，与第 4 条点名的"这几章尤其明显"完全吻合，是同一根因（每家交易所建档时间有限，被系统性优先级排在核心机制章节之后）在 20 家样本上的聚合体现，不是新问题。真正落 100% 空值率的 `costs.regulatory_fees` 里还叠了一层强 Category A 成分：多数法域并没有与"交易所费用"分离的独立"监管费"这个概念（美国 SEC Section 31 费是少数反例），对没有这个概念的法域留空是对的，不能算缺口。
4. **`risks.political_risk_note`/`liquidity_risk_note`、`costs.implicit_costs_note` 三个字段是较软的一类特例**：不是"不存在数值"，而是这类分析性、综合评估型内容天然难以对齐本项目"quote 摘自官方原文"的高置信度模型（没有一份"官方文件"会写"本国流动性风险是 X"），结构性地只能停留在 `confidence: low/medium`。这本身不违反 CLAUDE.md（`confidence: low` 是允许状态，不是缺陷），不建议为此改字段结构，如实记录在案，留给下次实际动笔时按现有置信度规则处理。

**定了什么：** `chapter_status()` 改为递归分组统计（新函数 `count_chapter_leaves()`），字段定义里标了 `optional: true` 的分组，若组内一个叶子都没填，整组不计入该章节完成度的分母；组内一旦有任意一个字段被填（说明该所确实用到这条产品线），整组恢复正常计入、要求填完整——不是永久豁免，只豁免"完全未启用"的状态。`taxonomy.yml` 给 `market_structure.derivatives` 加了这个标记（目前唯一符合"仅部分交易所适用"语义的字段组）。改动后 `make build` 通过，`make sync` 连跑两次 `git diff` 为空（幂等性未被破坏）；`render_health_summary`/`collect_matrix_cells`/`compute_freshness` 等其余生成逻辑只统计"已填字段"本身，不涉及分母计算，不受影响，未改动。

**为什么不追加名单去填 21 个 Category B 字段：** 规模上（最多 20 家 × 21 个字段 = 420 个字段位，还不含已知的 9 家衍生品缺口 × ~19 字段 ≈ 171 个字段位）接近甚至超过一整个 v1.0 Wave，且需要逐字段按 CLAUDE.md 二的铁律抓取原文、判定 confidence，不是本条 ADR 能一次性决定的执行范围；衍生品缺口本来就已经是 [ADR-019]/`OPEN-QUESTIONS.md` 第 42 条排定的"下一次专项"待办，其余 Category B 字段建议一并排期，具体排期方式（是否再拆 Wave、并行子代理规模）留给用户决定，本条只交付分类结论与已确认的一处 schema 缺陷修复。

**日期：** 2026-08-17

### ADR-021 — 9 家交易所衍生品市场机制批量补齐：执行结果与共享 worktree 并发写入的经验教训

**做了什么：** 按 [ADR-019]/`OPEN-QUESTIONS.md`（已解决的）第 42 条排定的清单，用 [ADR-017] 的并行子代理模式一次性补齐 `au-asx`/`br-b3`/`cn-szse`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse` 九家的 `market_structure.derivatives` 子块，每个子代理独立抓取该所衍生品市场官方规则文档、照 `hk-hkex.yml` 的既有结构填写。人工抽检（每家最多 10 个 `confidence: high` 字段，逐字核对 `quote` 与 `.cache/` 原始快照）：9 家共 90 个字段级抽样，**全部通过**，无一处拼接编造、数字不符或 confidence 评级不合理，远超 [CLAUDE.md 四] 的 ≥95% 门槛，数据可直接采信。

**执行中的意外情况：并行子代理未如预期各自隔离，7/9 落入同一共享 worktree。** 派发时对每个子代理都请求了独立 worktree，但实际只有 `au-asx`/`in-nse` 两家拿到真正独立的 worktree/分支；`za-jse`/`sg-sgx`/`fr-euronext`/`cn-szse`/`br-b3`/`sa-tadawul`/`kr-krx` 七个子代理全部落在了 orchestrator 自己所在的 `field-audit` worktree 里、直接对同一工作目录并发读写（根因未深究，怀疑与"orchestrator 自身已在 worktree 内、且中途多次因账号限额中断后经 `SendMessage` 恢复"有关，恢复路径可能没有重新走一遍独立 worktree 创建）。这七个子代理均在报告里主动发现并处理：用 `git apply --cached` 或手工 `git hash-object`/`update-index` 精确暂存自己那部分改动、用 `git commit -- <specific files>` 只提交自己负责的文件，避免连带提交或误删邻居未完成的编辑——是子代理自发应对，非任务指令设计好的机制。

**发现并修复了一处真实数据丢失：** `fr-euronext` 提交（`678f87f`）给共享的 `PROJECT/SOURCES.md` 打补丁时依据了过期快照，静默删除了 `za-jse` 提交（`319c080`）刚写入的 10 行衍生品来源 URL 登记——不是工作目录层面的短暂冲突，是**已提交历史**上的丢失，若不核查会直接合入主分支。合并阶段系统性核对了 7 个共享 worktree 提交新增的每一行 SOURCES.md 内容是否仍在最终状态，只发现这一处丢失，已用修复提交（`8708155`）补回；同时按行数比对确认全部 9 个 `data/exchanges/*.yml` 文件自己提交后未被覆盖，只是来源文档的凭据链条短暂断过。`br-b3`/`sa-tadawul`/`kr-krx` 三个子代理也各自独立报告"观察到未提交的改动被邻居的非原子写入覆盖过"，但均在提交前发现并重做，最终提交验证无误。

**给下一次并行批次的建议：** (1) 排查为什么这次 `isolation: "worktree"` 没有对多数子代理生效，尤其是"经 `SendMessage` 恢复中断的子代理"这条路径，如果确认是已知限制，以后对可能需要恢复的批次应更保守地假设隔离不可靠。(2) 在此之前，orchestrator 侧的合并/验收步骤必须包含本次采用的"核对每个子代理声称新增的每一行内容是否都还在最终态里"这道系统性核查，不能只信任各子代理自己的"确认无误"报告——`fr-euronext` 的丢失正是子代理自己没有发现、orchestrator 复核时才抓到的。(3) 子代理们自发摸索出的"`git apply --cached` 精确暂存 + `git commit -- <specific files>` 精确提交"模式在本次是有效的兜底，值得在派发提示词里显式教给以后的子代理，而不是指望每次都靠子代理自己临场想到。

**日期：** 2026-08-18/19

### ADR-022 — 前端内容结构审查：矩阵列选取标准与章节/维度组排序

**背景：** 用户审查前端"基本信息"矩阵组，发现首屏最显眼位置显示的四列（组织形式/自身是否上市/交易货币/会员体系）多是背景资料，不是交易员的决策依据；其中 `membership_structure` 更是定义在第九章「市场参与者」却被标进了 `overview` 矩阵组的分类错配（已由单独提交 `750d2be` 修复，去掉该字段的 `in_matrix` 标记）。举一反三审查发现两处更大的结构性问题，用户要求按严重程度设计整改方案。

**实测依据：** 对 20 家交易所全部 92 个非衍生品叶子字段逐一统计填充率与 `confidence: high` 数量，得到两个关键、且修正了初步直觉判断的事实：(1) 市值/上市公司数/年成交额/全球排名这几个"看起来该进矩阵"的规模指标，实际填充率只有 1/20-5/20，进矩阵也是整列空白——**不是设计问题，是数据缺口**，不能靠调整字段结构解决；(2) `costs_taxes`/`participants`/`infrastructure`/`risks` 四章绝大多数字段同样是个位数填充率，这与 [ADR-020] 分类结论第 3 条、`OPEN-QUESTIONS.md` 框架性问题第 4 条点名的"监管/参与者/基础设施/成本/风险五章系统性投入不足"是同一件事，本条 ADR 不重复记录，只强调**这四章的矩阵列稀疏不得通过"重选列"掩盖，那是数据问题不是设计问题**。

**定了什么（按严重程度）：**

1. **P1 默认首屏（最严重，影响每次访问）：** `dimension_groups` 顺序从"机构介绍"式（`overview` 打头）改为"交易员决策路径"式：`trading_mechanism → clearing_settlement → costs_taxes → regulation → listing_delisting → overview`。矩阵视图 tab 顺序与默认打开的组随之改变（`app.js` 读数组首项，无需改代码）。同时新增 `taxonomy.yml` 顶层键 `default_chapter: market_structure`，让单所档案页默认打开的章节也从 `overview` 改为 `market_structure`——不通过重排 `chapters`/`chapter_no` 实现，因为章节编号（2-12）已在 `DECISIONS.md`/`SOURCES.md`/`OPEN-QUESTIONS.md`/`data/exchanges/in-nse.yml` 的散文里被大量硬编码引用，[ADR-019] 已明确为此拒绝过重排章节；改成一条独立的显式声明字段更符合 CLAUDE.md 一节"一处手写"原则。`tools/sync.py` 的 `taxonomy_out` 透传该键，`app.js` 的 `renderExchange` 改读它（读不到时回退 `chapters[0].id`，行为不会因数据缺失而崩）。
2. **P2 `in_matrix` 归属校验（工程问题，防止错配复发）：** 实测确认修复后的 6 个矩阵组与 6 个章节是严格 1:1（`in_matrix` 是标量，一个字段只能进一个组，"跨章节速览组"本就不可行）。给每个 `dimension_group` 增加 `chapter:` 键显式声明归属，`tools/validate.py` 新增校验：字段的 `in_matrix` 指向的组必须存在，且该组的 `chapter` 必须等于字段自身所在章节，否则 `err()`——是 `enum_ref` 存在性校验的同构扩展，复用 `sync.walk_chapter_fields()`。`membership_structure` 那次错配若在此校验存在时发生，`make check` 会直接拦下。
3. **P3 补高覆盖字段进矩阵：** 判据——覆盖率 ≥16/20 家、是横向对比才看得出差异的机制性事实、所属章节与目标组匹配。新增 4 列：`market_structure.matching_principle`（撮合原则，19/20）、`market_structure.trading_halt_mechanism`（临时停牌与恢复，20/20）进 `trading_mechanism` 组；`clearing.csd_name`（托管机构，16/20）进 `clearing_settlement` 组；`overview.settlement_currency`（结算货币，20/20）进 `overview` 组。组内原有低覆盖列（如 `intraday_reversal` 回转交易制度，11/20）保留不删——空格是诚实信号，不为矩阵好看而藏问题。
4. **P4 明确不改：** `costs_taxes`/`participants`/`infrastructure`/`risks` 四组（后三者目前没有矩阵组）的稀疏经核实为数据缺口而非选列不当——`costs_taxes` 组现有 2 列已是该章覆盖率最高的两个字段，其余候选全部个位数覆盖，重选救不了；后三章同理。留给未来专项数据补齐（[ADR-020]/`OPEN-QUESTIONS.md` 第 4 条已排定），本条不通过"降低选列标准"或"新建空矩阵组"制造虚假的完整感。

**验证：** `make build` 0 错误 0 警告；`make sync` 二次幂等（`git diff` 为空）；故意造一个 `in_matrix`/`chapter` 不匹配的错配确认 P2 校验能拦下后改回；`make serve` 走查矩阵默认 tab、档案页默认章节、新增列渲染、中英双语与明暗主题切换均正常。

**日期：** 2026-08-19

### ADR-023 — `review_system`/`delivery_method` 枚举重新设计：解决 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第3条（已删除该条目）

**背景：** [ADR-018] 把 `review_system` 枚举覆盖率问题定为 Wave 1 启动前必须解决的阻塞项，但因分支不同步实际未拦截（见 ADR-018 执行进度补记），Wave 1/2 十五家新增交易所各自独立产出了退化成自由文本的 `review_system`，案例数滚到 11 个（`OPEN-QUESTIONS.md` 框架性问题第3条）；`delivery_method` 在 `br-b3` 身上也暴露出同类问题。本条彻底解决这两个字段，并按 `OPEN-QUESTIONS.md` 文件头部的规则删除该条目（结论转记于此）。

**实测依据：** 逐一读取全部 20 家交易所 `listing.review_system`/`clearing.delivery_method` 的 `zh`/`detail` 原文（不是转述 OPEN-QUESTIONS 里的归纳），发现：

- `review_system` 原三值枚举（registration/approval/hybrid）只覆盖 4/20（`cn-sse`/`cn-szse`=registration、`sa-tadawul`=approval、`sg-sgx`=hybrid），其余 16/20 全部退化成自由文本——但这 16 家并非彼此各不相同，逐条比对后能干净归入两个新类目，只有 1 家（`sg-sgx`，板块间审核逻辑本身不统一）保留原 hybrid 语义（重命名为更准确的 `mixed_by_board`）。
- `delivery_method` 14/20 已经是 `na`（纯现货，无争议），真正的问题集中在两类：(a) 单一实体现货+衍生品合并建档（`sg-sgx`/`de-eurex`）导致顶层字段被迫在两种产品逻辑间选近似值；(b) 现货业务已知是记账过户、衍生品部分未逐条核实（`br-b3`/`in-nse`/`za-jse`/`sa-tadawul`），顶层字段因此整体留空——4 家都不是无法归类，而是顶层字段的设计本身没给"现货+衍生品分别描述"留出空间。

**定了什么：**

1. **`review_system` 枚举从 3 值扩到 5 值**（`schema/enums.yml`）：
   - `registration` 注册制（不变，2 家）
   - `disclosure_with_discretion` 披露为本+交易所（或代为把关的保荐人/自律机构）享有实质裁量权——新增，覆盖 11 家（`au-asx`/`ca-tsx`/`ch-six`/`hk-hkex`/`in-nse`/`jp-jpx`/`tw-twse`/`uk-lse`/`us-nasdaq`/`us-nyse`/`za-jse`），是目前样本里最常见的模式
   - `dual_track` 交易所审核 + 监管机构对发行本身另有独立平行程序——新增，覆盖 3 家（`br-b3`=CVM注册、`de-xetra`=BaFin核准招股说明书、`kr-krx`=FSC证券注册），区别于 `disclosure_with_discretion` 的判据是"监管机构是否对同一发行单独跑一遍注册/审批"，而不只是"报告"或"规则本身经监管机构核准"（`jp-jpx`"重大事项报告金融厅"、`ca-tsx`"Company Manual经OSC核准"、`tw-twse`"报请金管会备查"均不满足这条，仍归 `disclosure_with_discretion`）
   - `approval` 核准制（不变，1 家 `sa-tadawul`）
   - `mixed_by_board` 板块间审核逻辑不统一（原 `hybrid` 重命名，1 家 `sg-sgx`，语义不变仅标签更准确）
   - 20 家里 18 家现在有 enum 值；剩余 2 家维持留空——`de-eurex` 是设计上的正确留空（纯衍生品交易所，`listing` 整章不适用，[ADR-009]/`OPEN-QUESTIONS.md` 已有定论），`fr-euronext` 是真实数据缺口（`detail` 字段已有说明：七个市场各自审核制度未逐一拆解核实），两者性质不同，均不属于本条要解决的"枚举装不下"问题
   - 只改了 `enum:` 取值与相应 `detail` 文字；`zh`/`en`/`quote`/`sources`/`confidence` 一律不动——这是对已核实事实的重新归类，不是重新抓取

2. **`delivery_method` 新增 `clearing.derivatives`（可选子块，复用 `market_structure.derivatives` 的既有模式，[ADR-019]）：**
   - `taxonomy.yml` 新增 `clearing.derivatives.delivery_method`（`optional: true`，未启用时不计入 `chapter_status()` 分母，逻辑与 `market_structure.derivatives` 完全复用 [ADR-020] 的 `count_chapter_leaves()`，未新增机制）
   - 顶层 `clearing.delivery_method` 的含义收窄为「只描述现货/主板市场」；`na` 现在明确表示"不涉及实物/现金交割二选一（如证券记账过户）"，而不再暗示"该所没有衍生品业务"——两者此前被同一个 `na` 值混着表达
   - `sg-sgx`：原顶层 `either`（合并现货+衍生品两个业务面的近似值，`quote`/`sources` 完整）拆分为顶层 `na`（现货，新配 T+2 结算规则引文佐证）+ `clearing.derivatives.delivery_method: either`（衍生品，原 `quote`/`sources` 原样迁移，事实未变）
   - `br-b3`/`in-nse`/`za-jse`/`sa-tadawul`：顶层从空/未套用改填 `na`（现货记账过户，`br-b3`/`za-jse`/`sa-tadawul` 三家复用各自 `settlement_cycle` 字段已核实过的官方来源作为佐证，`in-nse` 因暂无可复用来源标 `confidence: medium`）；衍生品部分本次未逐产品线核实，`clearing.derivatives.delivery_method` 显式留空（`zh: ""`、`confidence: low`），记入本条供下次专项抓取，不强行编造
   - `de-eurex`（纯衍生品，无现货业务）：顶层字段本来就在直接描述衍生品，不涉及"两个业务面"问题，不加子块，不改
   - `au-asx`/`cn-szse`/`fr-euronext`/`kr-krx`：顶层已是 `na` 且无争议，仅补一个空的 `clearing.derivatives.delivery_method` 占位（与 `market_structure.derivatives` 已有数据的交易所范围一致），衍生品交割方式细则留待下次专项抓取

3. **`PROJECT/OPEN-QUESTIONS.md` 框架性问题第3条按文件头部规则整条删除**（结论已转记于此）；条目 25/39 里指向"第3条"的引用改为指向本条 ADR；`ROADMAP.md`「Wave 1 启动前置条件」勾选项据此标记完成。

**为什么不是"字段不适合矩阵横向比较"（`in_matrix: false`）：** 这是 `OPEN-QUESTIONS` 原文提出的替代方案，本条没有采纳——18/20（`review_system`）与 20/20（`delivery_method`）在重新归类后都能被干净覆盖，说明问题出在枚举维度不够、不是字段本身不可比较；真到了"多数样本都装不下"才该考虑摘出矩阵（如 [ADR-022] P4 对 `costs_taxes` 等四章的处理），这里样本证明枚举扩容就能解决，摘出矩阵是过度反应。

**验证：** `make build` 0 错误 0 警告，20 家交易所；`make sync` 二次幂等（`git diff` 为空）；逐一核对 `sg-sgx`/`br-b3`/`za-jse`/`sa-tadawul` 新增 `sources`/`quote` 均为已有来源原样复用或原文精确子串，未新造引文。

**日期：** 2026-08-19

### ADR-024 — 英文模式"中英夹杂"第一层修复：`en_required` 补机器强制校验 + 9 处违规字段补齐；补齐时的语言来源优先级

**背景：** 用户走查英文版站点，观察到症状"中英夹杂"——切到英文模式后部分内容仍显示中文原文。审查发现根因是前端 `docs/assets/app.js` 的语言回退逻辑（`if (langMode==="en" && env.en) return env.en; return env.zh || ""`）：设计意图是"英文缺失时优雅降级显示中文，总比空白好"（[ADR-013] 既定设计），但这个回退悄悄掩盖了两类完全不同的情况——"字段设计上就不要求双语"（无害）与"标了 `en_required` 却真的漏填英文"（真实 schema 违规，此前从未被机器拦截过）。逐字段核对发现 `taxonomy.yml` 里标了 `en_required` 的专有名词类字段（机制名/规则名/法规名）中，`cn-sse`/`hk-hkex`/`tw-twse` 三家共 9 处实际缺英文，`validate.py` 对这个标记从未做过校验。

**定了什么：**

1. **`validate.py` 新增机器校验**：`validate_data()` 逐字段循环里加一条——`fdef.get("en_required")` 为真但 `env.get("en")` 为空即 `err()`。这类"taxonomy 标记了但从未被校验"的漏洞与 `OPEN-QUESTIONS.md` 框架性问题第6条（"第三方来源 confidence 上限 medium"同样长期未被机器强制）是同一类问题，本条只解决 `en_required` 这一处，第6条仍待办。（第6条已由 [ADR-033] 解决。）
2. **9 处违规字段的补齐口径，按用户明确指示定为**：核查交易所原语言是中文还是英文，优先用交易所官方原语言文本（中文优先、英文次之、其他语言再次之）；若交易所自身提供中英双语官方内容，直接采用官方译文，不自己翻译；只有查无官方对应语言版本时才由已核实的另一语言内容转译。实际执行：`cn-sse` 的 `core_laws`/`circuit_breaker`/`volatility_interruption`/`delisting_conditions` 四处 找到 SSE 官方英文版交易规则原文直接引用（`core_laws`/`circuit_breaker` 因此升级为 `confidence: high`）；`settlement_cycle`（"T+1"）内容本身语言无关，直接复用；`tw-twse.circuit_breaker` 同样以 TWSE 官方英文页交叉核实结论；`hk-hkex` 三处，`matching_principle`/`order_types` 见下条，`clearing.settlement_cycle`（"T+2"）与 `cn-sse.settlement_cycle` 同理，属语言无关的记号，直接复用无需另查来源。
3. **`hk-hkex.market_structure.matching_principle`/`order_types` 补齐过程中顺带查出一处实质性数据错误，不只是补翻译**：这两个字段此前内容一个未摘引任何原文，另一个经核实是把**衍生品市场（HKATS 期货期权交易系统）的撮合规则误当成了证券现货市场规则**——`SOURCES.md` 此前只登记了同名的"衍生品市场"交易机制页面 URL，未意识到证券市场有独立的同名页面。本次定位到港交所证券市场自己的官方交易机制页（`sc_lang=en`/`sc_lang=zh-hk` 双语对照），补登 `SOURCES.md`，重新核实两个字段并升级为 `confidence: high`。**教训**：字段内容与 `SOURCES.md` 登记的 URL 是否真的对应同一业务线，不能只看页面标题相似就当作已核实。
4. **不处理的部分（用户明确决定"先只报告规模，不处理"）**：`en_required` 之外，还有 114 个字段是设计上不要求双语（数字/日期/描述性文本）但英文模式仍回退显示中文，集中在 `cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse` 四家中文源交易所（约占94%）。规模与候选处理方向记入 `OPEN-QUESTIONS.md` 第45条，本条不展开、不预判处理方式。

**为什么不直接改前端回退逻辑掩盖问题**：改 `app.js` 让"无 en 时不回退显示中文"能立刻让症状消失，但会把 114 个本无需双语的字段在英文模式下变成空白——从"中英夹杂"换成"英文模式内容大面积消失"，不是修复，是转移问题；且会掩盖未来真正的 `en_required` 违规（少了兜底显示，反而更难发现该报错的字段被漏填）。机器校验 + 补数据这条路径解决的是"真违规"，前端回退逻辑本身对"设计上不需要双语"的字段仍是对的，留给 `OPEN-QUESTIONS.md` 第45条继续评估。

**验证：** `make build` 0 错误 0 警告；`make sync` 二次幂等（`git diff` 为空）；补入的 9 处字段逐一核对 `quote` 系当次抓取原文精确子串，无编造；故意还原一处 `en_required` 缺失验证新校验能拦下后改回。

**日期：** 2026-08-20

### ADR-025 — 前端可读性审查：矩阵工具栏去筛选项、时区午休独立配色、字号排版调整

**背景：** 用户要求审查前端 UI、设计优化方案以增强阅读友好度，过程中另追加两条明确指令：矩阵工具栏去掉「标杆批次 Tier」筛选框；时区甘特条午休时段改用独立颜色标识、不再重复出现在右侧括号文字里。三者一并处理，记一条 ADR。

**定了什么：**

1. **矩阵工具栏移除「标杆批次 Tier」与「搜索」两个筛选项**（[ADR-014]/v0.3 加的 `tier`/`q` 参数与对应 UI 全部删除，`app.js` 的 `renderMatrix` 与 change/input 事件委托一并简化）。`tier` 是建档阶段的内部批次标记（[ADR-016] 的 Wave 1/Wave 2 分批依据），对最终读者没有横向比较价值；搜索框在样本量固定在 20 家、地区筛选已能有效收窄范围的规模下是冗余交互。`data/exchanges/*.yml` 里的 `tier` 字段本身不受影响，只是前端不再拿它筛选。
2. **时区甘特条午休时段改独立配色**：`tradingBarSegments()` 从返回单一线段数组改为返回 `{open, lunch}` 两组线段，午休单独渲染成 `.tz-bar-lunch`（新增语义色 `--info`，与 `--accent`/`--warn`/`--danger` 同一套三态主题令牌体系），图例同步加一项说明；原来右侧 `tz-times` 里"（午休 Lunch HH:MM–HH:MM）"的文字括注删除，避免同一信息图形+文字重复表达。
3. **通用可读性调整**（审查后判断的一揽子低风险改动，零构建 vanilla JS 架构、UI 标签恒双语的约定均未变，[ADR-006]）：正文基准字号/行高从 14px/1.55 提到 15px/1.65；矩阵单元格与多处 10.5–12px 的辅助文字（表头英文子标签、地区标签、时区偏移量等）统一提到至少 11–11.5px 的可读下限；矩阵表新增 `--bg-zebra` 隔行底色与整行悬停高亮，帮助 20 家交易所横向对比时视线沿行扫读；档案页字段卡片内边距与卡片间距加宽，标签改为大写字距的"眉标"样式（呼应出处浮层已有的 `overlay-section h4` 视觉语言），长文本字段（`field-detail`/`overlay-detail`/`overlay-quote`）加 `max-width: 70ch` 控制单行长度。

**为什么不做更大改动：** 审查中识别出的其余项（矩阵表移动端体验、健康度视图加轻量可视化等）判断为"值得做但不紧急、且会明显放大改动面"，本条不处理，留作后续可选项，不在这轮一并做掉。

**验证：** `node --check docs/assets/app.js` 语法通过；`make check` 全量校验通过（20 家交易所，0 警告 0 错误，未改 `schema/`/`data/`，`make sync` 无需重跑）；本环境无可用无头浏览器，改用 Node `vm` 搭建的 DOM 桩加载真实 `app.js` + 真实 `docs/data/*.json`，跑矩阵/时区/健康度视图的路由渲染，确认 Tier 筛选框与搜索框已从渲染输出消失、地区筛选仍可用、`tz-bar-lunch` 正确渲染（以 `jp-jpx` 11:30–12:30 午休为例）、右侧不再出现"（午休...)"文字、渲染过程无未捕获异常；**未做真人浏览器可视化验收**，尤其明暗主题下新增 `--info` 蓝色的对比度，留待 `make serve` 人工过一遍。

**日期：** 2026-08-20


### ADR-026 — `OPEN-QUESTIONS.md` 第45条方案②落地：英文模式区分"设计不需双语"与"真漏填"；`kr-krx` night_session 顶层字段订正

**背景：** [ADR-024] 解决了「中英夹杂」问题里"真违规"的一半（`en_required` 机器校验 + 9 处补齐），把另一半——114 个设计上不要求双语的字段在英文模式下仍静默回退显示中文——明确记入 `OPEN-QUESTIONS.md` 第45条，留三个候选方向（①批量翻译 ②前端加占位提示 ③承认现状）供后续评估，未预判处理方式。本条实施方向②。

**定了什么：**

1. **`docs/assets/app.js` 新增 `isZhFallback(env, hasEnumRef)` 判据**：`state.langMode === "en" && !hasEnumRef && env.zh && !env.en` 时为真——即英文模式下、非枚举字段、有中文值但没有英文值。矩阵格子（`renderMatrix`）与档案页字段卡片（`renderObjectChapter`）两处调用 `displayValue()` 的地方，命中时分别追加一个小标记：矩阵格子加 `<span class="zh-tag">中</span>`（样式仿 `stale-dot`，同一视觉语言），字段卡片加 `（中文原文）` 灰色斜体小字，两处均带 `title` 说明"该字段未要求双语"。**不改 `displayValue()` 本身的回退取值逻辑**——取值仍是"英文缺失就显示中文"（[ADR-013] 既定设计，[ADR-024] 已论证过不能改成回退空白，否则从"中英夹杂"变成"英文模式内容大面积消失"），本条只加视觉标记，不改数据可见性。
2. **出处浮层（`openCellOverlay`）不需要同样处理**：浮层本就把"中文 Chinese"/"英文 English"分成两个独立带标题的小节，英文缺失时该小节直接不渲染，读者看到的是"只有中文小节"而不是"一段文字看不出语言"，本身已无歧义，核对后未改动。
3. **enum 类字段（`enumDisplay`）不在本条范围内**：枚举的双语标签来自 `schema/enums.yml`，是另一套独立维护的数据源，不是 114 个字段统计口径里的"事实信封 zh/en 缺失"问题，混进来会扩大改动面且脱离原始症状，留待以后单独评估枚举标签完整性。
4. **`OPEN-QUESTIONS.md` 第45条未删除，仅更新**：标记方案②已实施，候选方向①（批量翻译 114 字段，规模接近半个 Wave）与③（不作为）仍待决策，条目保留以便下次会话接续判断要不要做①。

**顺带修复：`kr-krx` 顶层 `market_structure.night_session` 与衍生品子块 `derivatives.trading_sessions.night_session`（[ADR-021] 补齐时留下的已知不一致，原记入 `OPEN-QUESTIONS.md` 具体数据悬案）。** 重新 `make fetch EX=kr-krx` 抓取《Guide to Night Session in KRX Derivatives Market》官方 PDF 核实：顶层字段此前仍按"CME（2009年起）/Eurex（2010年起）联动夜盘"的旧表述，实际 CME 联动已于 2020 年 4 月先行终止（比 Eurex 更早，此前的表述遗漏了这一点）、Eurex 联动已于 2025 年 6 月终止、KRX 现已转自主运营夜盘——按官方 PDF 原文（"August 2009~April 2020" / "August 2010~June 2025" 表格脚注 + "KRX is now transitioning to its own night session" 正文句）重写顶层字段并升级为 `confidence: high`，两处表述已一致，`OPEN-QUESTIONS.md` 对应条目已删除。与本条主线（英文回退提示）无直接关联，顺路一并处理，不单开 ADR。

**验证：** `node --check docs/assets/app.js` 语法通过；`make build`（sync+check）0 错误 0 警告，20 家交易所；`kr-krx.yml` 新 `quote` 逐字核对为 `.cache/kr-krx/` 本次重新抓取的 PDF 原文精确子串，未编造。

**日期：** 2026-08-20

### ADR-027 — 六家交易所悬案批量清理：`sa-tadawul`/`kr-krx`/`tw-twse`/`ch-six`/`br-b3`/`fr-euronext`；`isolation: worktree` 在"因限额中断后经 SendMessage 恢复"路径上再次失效的证据

**背景：** `PROJECT/OPEN-QUESTIONS.md`「具体数据悬案」一节积压了多条来自 v1.0 各 Wave 的遗留问题，按每家交易所打包分派 6 个独立子代理（每个用 `isolation: "worktree"` 启动），核实能否找到官方一手原文解决。中途全部 6 个子代理因账号会话额度耗尽同时失败（2026-08-20 深夜），额度恢复（2026-08-21 00:30 后）用 `SendMessage` 逐一恢复。

**结果（按交易所）：**

- **`sa-tadawul`**（4 条 → 3 条解决）：母公司改制历史（2021年5月20日改制、同年12月8日IPO，来源 CMA 招股书+官方年报页）、外资持股上限（10%/49%，来源 CMA 修订版《外资证券投资规则》第6条+QFI取消官方公告）、卖空机制（枚举从推断的 `restricted_list` 订正为 `restricted_uptick`，来源官方《Short Selling Regulations》第5(a)/3(b)(4)条）均解决并升 `confidence: high`，顺带升级了引用同一事实的 `foreign_access_channel`/`regulatory_change_risk_note` 两个字段。TASI 基日基点复查仍未找到官方原文，如实保留悬案。
- **`kr-krx`**（3 条 → 2 条解决）：KONEX 上市门槛（官方原文明确"不适用财务类门槛，只有5项非财务量化标准+定性审查"）、KOSPI综合指数基日基点（1980年1月4日=100，区别于已有的KOSPI200 1990年数据）已解决。KOSDAQ综合指数基日基点确认卡在 `eindex.krx.co.kr` 的两步OTP鉴权AJAX接口（`GenerateOTP.jspx`→`IDXE99000001.jspx`），性质与`sg-sgx` SPA空壳问题同类，判断不值得为一个字段逆向鉴权流程，如实保留悬案。
- **`tw-twse`**（2 条 → 全部解决）：市值/上市家数/年成交额三字段找到 Fact Book 具体章节静态页（此前只看到索引页误判为纯JS渲染）拿到官方汇总数字；《营业细则》第50条之1终止上市完整条文定位到，两字段均升 `confidence: high`。
- **`ch-six`**（3 条 → 2 条解决 + 1 条从"未查到"重新定性为"官方确认不披露"）：上市公司数（约250家）与年成交额（CHF 1,135.0亿）找到 SIX 官方年报+统计月报解决；MiFID II等效性时间线解决，**过程中发现并订正了一处既有数据错误**（原记录2017年批准失效于2017-12-31，官方 Implementing Decision (EU) 2018/2047 原文显示实为2018-12-31）；印花税税率改查 ESTV 德语版页面找到官方数字（1.5‰/3.0‰，即0.15%/0.3%）。总市值经逐份官方材料核实后确认 SIX 公开体系本就不按"全市场总市值"口径披露，从"检索不足"重新定性为"官方确认无此数据"，悬案措辞相应收窄。
- **`br-b3`**（2 条 → 全部解决）：股息预扣税找到《第15.270/2025号法律》官方原文（10%税率，2026-01-01起生效），**确认了 B3 官网自身说明页尚未同步最新立法的真实出入**（不是抓取问题，是官网确实滞后）；`core_laws`（Lei 6.385/1976）找到 CVM 官方"关于CVM"页正面确认颁布日期与创设CVM的历史作用，两字段均升 `confidence: high`。
- **`fr-euronext`**（CSD具体名称，1条主任务 → 解决）：阿姆斯特丹→Euroclear Nederland、布鲁塞尔→Euroclear Belgium、巴黎→Euroclear France、都柏林→Euroclear Bank，四地均找到 `euronext.com` 官方文件原文确认（`euroclear.com` 本身对curl仍403，与`uk-lse`此前记录一致）。市值口径歧义与雅典整合两条按任务范围明确不处理，原样保留。

**合计**：6 家共 17 条具体悬案里 13 条解决、1 条重新定性（ch-six市值）、3 条如实保留（sa-tadawul TASI、kr-krx KOSDAQ、以及任务范围外的 fr-euronext 市值口径/雅典整合不计入本次"处理"范畴）。全部新增/升级字段的 `quote` 均逐一核对为当次 `make fetch` 抓取到的 `.cache/` 原始文件精确子串，无一处编造；抓不到的一律如实保留悬案并记录已排除的候选路径，供下次直接跳过重复踩坑。

**工程教训：`isolation: "worktree"` 在"账号限额中断→ SendMessage 恢复"路径上再次失效，与 [ADR-021] 的怀疑吻合、补充了新证据。** 6 个子代理里有 3 个（`kr-krx`/`tw-twse`/`fr-euronext`）恢复后被接回了 orchestrator 自己的共享 worktree（非独立隔离环境），其中 `kr-krx`/`tw-twse` 直接在共享目录完成编辑并提交、`fr-euronext` 发现问题后另起一个真正隔离的子代理完成最终提交。三者均**自发**在提交前核对了改动没有污染邻居未提交的工作（`kr-krx` 报告明确写"detected an unrelated tw-twse hunk... isolated it... restored their uncommitted WIP"），复现了 [ADR-021] 记录的"精确暂存兜底"模式，本次同样有效，未造成数据丢失，也再次印证 [ADR-021] 建议②——**orchestrator 侧必须假设隔离不可靠、合并前逐一核对**。本次做法：每个子代理完成通知后先 `git status --short` 确认工作区干净才 `cherry-pick`，遇到 OPEN-QUESTIONS.md/SOURCES.md/ROADMAP.md（生成块）冲突时手工核对两侧取正确并集（不简单二选一），全部 6 次合并均未丢失任何一方内容。**"因限额中断需要 SendMessage 恢复"这条路径本身值得后续专门排查根因**（怀疑与 [ADR-021] 一致：恢复路径可能没有重新走独立 worktree 创建），暂不深入，先记录第二次独立复现的证据。

**验证：** 每次 cherry-pick 后单独跑 `make build`（sync+check），6 次全部 0 错误 0 警告；最终整个批次合并完成后再跑一次全量 `make build` 确认幂等；`git log` 确认 6 个交易所的提交均已线性合入 `worktree-followup-en-fallback-cleanup` 分支并推送到远程。

**日期：** 2026-08-21

### ADR-028 — 下一阶段方向定为"深度优先"（Category B 数据深耕），并刷新 [ADR-020] 的字段清单与规模估计

**背景：** [ADR-023]/[ADR-024] 相继解决了 `review_system`/`delivery_method` 枚举问题与 `en_required` 违规后，`ROADMAP.md`「v1.0 计划」一节遗留的"下一步待决策"仍未拍板：是开 Wave 3（新增交易所）还是排期 [ADR-020] 点名的 Category B 数据缺口。用户就此拍板：**深度优先**——先把现有 20 家交易所做扎实，Wave 3 暂缓。

**实测依据（复用 `tools/sync.py` 的 `expand_exchange`/`walk_chapter_fields`，对全部 115 个非衍生品叶子字段重新审计在 20 家交易所的填充率，方法与 [ADR-020]/[ADR-022] 相同，这次跑出完整清单而非举例）：**

按章节汇总（排除 `market_structure.derivatives`/`clearing.derivatives` 这类 `optional` 子块——9-10 家已启用的填充率本身已经健康，不算缺口）：

| 章节 | 填充率 | 字段数 |
|---|---|---|
| `infrastructure` | 18% | 7 |
| `costs` | 19% | 9 |
| `participants` | 27% | 6 |
| `risks` | 35% | 5 |
| `listing` | 42% | 9 |
| `clearing` | 43% | 10（含下述有语义歧义的4个） |
| `regulation` | 57% | 8 |

**规模比 [ADR-020] 当初"~21 个字段"的举例性描述（原文以"等"结尾，非穷举）更大**：完整清单是 36 个字段（`regulation` 4 个、`listing` 6 个、`clearing.default_management` 1 个、`participants` 5 个、`infrastructure` 7 个、`costs` 9 个、`risks` 4 个），另有 4 个 `clearing` 字段因下述歧义单独处理。按 20 家计约 720 个字段位，虽不少已有部分填充，仍接近 1.5-2 个 Wave 的规模（对照 [ADR-017] 单个 Wave 7-8 家 × 全 11 章的工作量级）。`costs.regulatory_fees` 沿用 [ADR-020] 已有判断——多数法域没有独立于交易所费用之外的"监管费"概念，预期填充后大部分仍是合理留空，不强求。

**新发现：`clearing.initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency`/`last_trading_day_rule` 四个字段存在真实语义歧义，填充前必须先定义清楚，否则会重演 [ADR-018] 的教训。** `de-eurex.initial_margin_practice` 填的是 Eurex Clearing Prisma——CCP 层面对衍生品持仓组合的保证金方法论；`br-b3` 同一字段填 CORE 方法论（同类语义），`mark_to_market_frequency`/`last_trading_day_rule` 两字段也都填衍生品持仓每日盯市、期权到期日自动履约——四字段在这两家均锚定"衍生品 CCP 清算"语境。但 `tw-twse` 同一对字段（`initial_margin_practice`/`maintenance_margin_practice`）填的是完全不同的概念：现货信用交易（融资融券）的自备款/担保维持率（130%），是"券商对客户的现货保证金交易"语境，与前两家"CCP 对衍生品持仓的保证金方法论"是两套不相干的制度，只是共享了"保证金"这个中文词。这与 [ADR-019]/[ADR-023] 已处理的"顶层字段隐含单一产品线假设"是同一根问题——只有 `clearing.delivery_method` 在 [ADR-023] 时新增了 `clearing.derivatives.delivery_method` 子块分流，这四个字段当时未一并处理。

**定了什么：**
1. 下一阶段（`v1.1`）方向确定为 Category B 数据深耕，Wave 3（新增交易所）推迟，具体重启时机留待深耕告一段落后再评估，不在本条锁定日期。
2. 上述 36 个字段 + 4 个待厘清语义的 `clearing` 字段，作为 `v1.1` 的完整候选清单，取代 [ADR-020] 原先举例性的"~21 个"表述——本条不废止 [ADR-020] 的分类结论（Category A/B 判断依然成立），只是把规模估计做实。
3. `clearing` 那四个字段的歧义**在批量填充前必须先解决**，具体方案（如仿照 `delivery_method` 拆出 `clearing.derivatives.*` 四个镜像字段承接衍生品语义、顶层字段收窄为"现货保证金交易"语境；或反过来）留给动手时依据更多样本判断，本条只锁定"必须先处理、不能像 [ADR-018] 那样拖到批量执行完才发现"这个时点决策——这正是 [ADR-013]/[ADR-018] 反复验证过的教训：模型级改动要趁样本少时做。

**执行设计建议（留待启动 v1.1 时确认，非本条锁定）：** 按"交易所"而非"字段"分批更省检索成本——同一交易所研究监管环境时，`regulation`/`participants`/`costs`/`risks` 几章的信息源高度重合（监管机构官网、交易所 Investor Relations 页），比逐字段切换交易所抓取更连贯。建议沿用 [ADR-017] 的并行子代理模式，仍按 7-8 家一批分 2-3 批处理 20 家；质量门槛沿用 [CLAUDE.md 四] 的 ≥95%，抽检量比照 [ADR-017] 先例（10 字段/所）。同一批顺带处理该交易所名下已知的英文缺失字段（`OPEN-QUESTIONS.md` 框架性问题第45条，114 个字段集中在 `cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse`，[ADR-024] 已解决其中真违规部分，这里指剩余非强制双语字段）与已知的 `sec.gov`/`finra.org`/`dtcc.com` 反爬突破尝试（框架性问题14/15/32条，集中影响 `us-nyse`/`us-nasdaq` 的 `regulation`/`clearing` 字段）——都是同一批交易所、同一次检索窗口内可以顺手做的事，不必单独开工。

**退出标准（草案）：** 不追求 36 个字段在 20 家全部填满——大量留空预期本就是 Category A（如 `costs.regulatory_fees`）。追求"消灭完全没碰过的 0/20 字段"（`implicit_costs_note`/`regulatory_fees`/`data_pricing_model`/`historical_data_availability`/`post_delisting_venue`/`broker_landscape`/`liquidity_risk_note`/`political_risk_note` 八个目前挂零的字段，逐一变成"有值+来源"或"明确 detail 说明为什么该所查不到/不适用"），其余字段填充率显著提升但不强求 100%。

**日期：** 2026-08-21

### ADR-029 — PR #15（`worktree-category-b-planning`）合并冲突处理：并行分支 ADR 编号撞号，改用 merge 而非 rebase 解决

**背景：** PR #15 是后台 worktree 任务在 2026-08-21 拍出的"深度优先"规划（原文自称 [ADR-026]），但分支拉出之后、PR 打开之前，main 上通过 #13/#14 两个 PR 先落了 [ADR-026]（第45条方案②落地）与 [ADR-027]（六家悬案批量清理）——两条互不知情的分支各自把自己新增的决议记成了同一个编号，PR 因此在 `PROJECT/DECISIONS.md`/`PROJECT/ROADMAP.md` 上产生冲突（`mergeStateStatus: DIRTY`）。

**定了什么：**
1. **解决顺序按"谁先落 main 谁保留原编号"**：main 上已有的 [ADR-026]/[ADR-027] 不动，PR #15 的内容重新编号为 [ADR-028]，`DECISIONS.md` 正文与 `ROADMAP.md` 里所有指向它的引用一并同步改掉，PR 标题也同步更新（原标题括注的 `ADR-026` 会误导后续读者）。`ROADMAP.md`「当前进度」一节两条"待决策"表述有实质重叠（是否开 Wave 3、`OPEN-QUESTIONS.md` 第45条方案①要不要做），未做简单二选一，而是核对后合并成一条不丢信息的表述。
2. **合入方式选 `git merge`，不用 `git rebase`**——PR 分支的单个提交已经推送到远程（`origin/worktree-category-b-planning`），rebase 会改写这个已推送的提交并需要 force-push 完成，直接违反 [CLAUDE.md 六] "不改写已推送的历史、不 force push"的明文约束。改为在 PR 分支上 `merge origin/main`，冲突用与 rebase 完全相同的内容手工解决后得到一个合并提交，普通 `git push`（非 force）即可推到 PR 分支，GitHub 侧 PR 随即从 `CONFLICTING` 变回 `MERGEABLE`。
3. **顺带修了一个和本冲突无关但挡住验证的 main 既有 bug**：`PROJECT/OPEN-QUESTIONS.md` 里一段描述 `eindex.krx.co.kr` 站内脚本路径的文字用反引号包住了 res/pc/js/func.js，被 `tools/validate.py` 的仓库路径引用校验（第10-11条）误判为"引用了不存在的仓库文件"，导致 main 在 [ADR-027] 落地后 `make check` 就一直是失败状态（无人注意到，因为没人在那之后跑过 `make build`）。单独提交修掉（去掉反引号），不与本条冲突解决混在一次提交里。

**通用教训（下次遇到并行分支/后台任务同时在写 `DECISIONS.md` 时适用）：** ADR 编号是每条分支各自"预支"的，只要两条分支都在同一个 base 之后各自新增了 ADR 条目，编号就有很高概率撞——这次是两条完全独立的后台任务链（`worktree-followup-en-fallback-cleanup` 与 `worktree-category-b-planning`）各自往 main 报告"下一个 ADR 编号"时都以为自己是唯一的新增者。合并冲突时不要图省事直接"选一边留一边删"，要先看两条内容是否都该保留（这次两边都是真实决策，不是同一件事的两种写法），确认都保留后再重新编号里较晚落地的那条，并全仓库搜索该编号的引用一并更新，别漏改标题/正文交叉引用。

**验证：** 两处冲突文件手工解决后跑 `make build`（sync+check），0 错误 0 警告；`gh pr view 15` 确认 `mergeStateStatus` 从 `DIRTY`/`CONFLICTING` 变为 `CLEAN`/`MERGEABLE`；合并后本地 `git pull` + 再跑一次 `make build` 确认幂等；`git log` 确认历史无重写，PR 分支只多了一个 merge 提交。

**日期：** 2026-08-22

### ADR-030 — v1.1 前置事项解决：`clearing` 四个保证金/盯市字段的语义歧义，仿照 `delivery_method` 拆出 `clearing.derivatives.*` 镜像字段

**背景：** [ADR-028] 把 `clearing.initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency`/`last_trading_day_rule` 四字段的语义歧义定为 v1.1 批量填充前必须先解决的前置事项——`de-eurex`/`br-b3` 按"衍生品CCP保证金方法论"填写，`tw-twse` 按"现货融资融券"填写同一字段，两套不相干的制度共用一个字段。本条解决该前置事项，`ROADMAP.md`「v1.1 计划」的前置事项勾选项据此标记完成。

**定了什么：**

1. **`schema/taxonomy.yml` 的 `clearing.derivatives` 子块（[ADR-023] 为 `delivery_method` 新增的既有子块）扩容，新增四个镜像字段** `initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency`/`last_trading_day_rule`，字段定义（`label_zh`/`label_en`/`volatility`）与顶层同名字段一致，插入顺序对齐顶层字段顺序。子块本身的 `label_zh`/`label_en` 相应从"衍生品交割方式（如适用）"改为"衍生品保证金、盯市与交割（如适用）"以反映扩容后的范围；`note` 同步扩写，统一说明五个字段（含既有的 `delivery_method`）的收窄规则：**顶层字段收窄为「描述现货/主板市场的对应制度」**——现货有可比概念（如 `tw-twse` 的融资融券保证金）则顶层照填；纯现货市场没有对应概念（如现货没有"最后交易日"）则顶层如实留空+`detail`说明"不适用于现货"；衍生品部分统一移到 `clearing.derivatives.*` 描述。纯衍生品交易所（`de-eurex`）不用子块，直接用顶层字段描述衍生品——与 `delivery_method` 完全同构的处理方式，不新增机制，只复用既有模式（`optional: true`，未启用时不计入 `chapter_status()` 完成度分母，逻辑见 [ADR-020] 的 `count_chapter_leaves()`）。
2. **`market_structure.derivatives.margin_practice_note` 字段的交叉引用文字更新**，从"与 clearing 章节的 initial_margin_practice 字段呼应"改为明确指向 `clearing.derivatives.initial_margin_practice`（子块新增后，交叉引用需要精确到子字段，避免后来者分不清指的是顶层还是子块）。
3. **迁移已知受影响的交易所数据**（复用既有 `quote`/`sources`/`confidence`，不重新抓取、不新造事实）：
   - **`tw-twse`**：`initial_margin_practice`/`maintenance_margin_practice`（融资融券自备款/维持担保率130%）本就是"现货信用交易"语境，恰好符合收窄后的顶层语义，**不改**——原先被误判为"与 br-b3/de-eurex 共用字段但语义冲突"，现在有了明确的顶层='现货'语义后，这条数据本来就是对的。
   - **`de-eurex`**：纯衍生品交易所，无 `clearing.derivatives` 子块，顶层字段继续直接描述衍生品，**不改**。
   - **`br-b3`**（现货+衍生品双业务，实际需要migration的唯一样本）：顶层 `initial_margin_practice`（CORE方法论）、`mark_to_market_frequency`（衍生品逐日盯市）、`last_trading_day_rule`（期权到期日规则）三处内容原样迁移到 `clearing.derivatives.*` 对应字段（`quote`/`sources`/`confidence` 逐字不变）；顶层三字段清空，`detail` 注明迁移原因与"B3现货证券市场自身是否有可比保证金/盯市/最后交易日概念本次未核实"，避免用留空暗示"确认不适用"（`last_trading_day_rule` 例外——现货证券本身无"最后交易日"概念，这条明确写"预期长期留空不适用"）。**`initial_margin_practice` 迁移时额外标注一处遗留不确定性**：原始 `quote`（CORE方法论三个计算模块的说明）本身未逐字限定"仅适用于衍生品"，B3 的 CORE 是否是覆盖现货+衍生品的统一CCP风险模型、还是仅衍生品适用，本次未重新抓取核实，暂沿用 [ADR-028] 已作出的"衍生品语境"判断迁移，但在 `detail` 里如实记录这一判断未被重新验证，留给下次专项抓取核实（不排除结论是"顶层也该保留一份"而非"整体移空"）。
4. **不处理的部分**：`clearing.derivatives.delivery_method` 与 [ADR-023] 已完成的迁移（`sg-sgx`/`au-asx`/`cn-szse`/`fr-euronext`/`kr-krx`/`za-jse`/`sa-tadawul`/`in-nse`）不受影响，未改动；这些交易所在新增的四个字段上暂不补空占位（`br-b3`除外，因其确有迁移数据）——按 `optional: true` 的设计，完全不填不影响任何一家的章节完成度分母，留给 v1.1 批量执行阶段按需补齐，不在本条 ADR 里为所有 20 家逐一造占位，那是数据填充工作不是 schema 决策。

**为什么方案是"镜像四个字段"而不是拆成正交维度或改用 enum：** 沿用 [ADR-023] 已验证过的 `delivery_method` 模式是成本最低的选择——四字段与 `delivery_method` 面对的是同一根问题（顶层字段隐含单一产品线假设），`delivery_method` 已经证明"顶层收窄+衍生品子块镜像"能干净解决，没有必要为同一类问题发明第二套机制；且四字段本身是自由文本（无 `enum_ref`），不存在"枚举装不下"的问题（那是 [ADR-023] 解决的 `review_system` 类问题），不需要走枚举扩容路线。

**验证：** `make build`（sync+check）0 错误 0 警告，20 家交易所；`make sync` 二次幂等（`docs/data/*.json` 逐文件 md5 比对，连续两次运行输出完全一致）；`br-b3.yml` 新迁移的三处字段 `quote`/`sources`/`confidence` 逐字核对为原内容原样搬移，未新造或修改任何事实性内容。

**日期：** 2026-08-22

### ADR-031 — v1.1 Batch 1（8 家）执行结果：Category B 数据补全 + 英文回填 + `sec.gov`/`finra.org` 反爬攻克；`isolation: worktree` 第三次复现失效及新发现

**做了什么：** 按 [ADR-028] 定下的方向启动 v1.1 第一批数据深耕，选定 `cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse`（一并回填英文缺失字段，`OPEN-QUESTIONS.md` 框架性问题第45条约94%集中在这四家）+ `us-nyse`/`us-nasdaq`（一并尝试突破框架性问题14/15/32条记录的 `sec.gov`/`finra.org`/`dtcc.com` 反爬）+ `uk-lse`/`jp-jpx`（补地区多样性）共 8 家，沿用 [ADR-017] 并行子代理模式（`isolation: "worktree"`），每个子代理独立跑该所 40 个候选字段清单中适用的部分（`clearing.derivatives.*` 四个镜像字段只对已有真实衍生品业务的 `hk-hkex`/`cn-szse` 启用，其余 6 家按 [ADR-030] 设计跳过）。8 个子代理中途因账号会话额度耗尽反复中断（先后触及三个不同的额度重置窗口），全部用 `SendMessage` 逐一恢复，`us-nasdaq` 还额外遇到一次服务端限流（非额度问题，直接重试即解决）。

**数据结果：** 全库已填字段从 1162 增至 1360（+198，含英文回填）。按所摘要：

- `cn-sse`：19 个候选字段中 18 个转为有值（多为 `confidence: high`），1 个（`risks.political_risk_note`）如实留空转悬案；英文回填 47 个字段。
- `cn-szse`：27 个候选字段（含 4 个衍生品镜像字段，该所已有期权业务）多数转为有值，`costs.regulatory_fees` 如实留空；英文回填约 25 个字段。
- `hk-hkex`：32 个候选字段中 30 个转为有值（含 4 个衍生品镜像字段），2 个（政治/流动性风险）留空；**顺带纠正了任务描述里"该所可能无独立监管费概念"的预设**——实测 SFC/AFRC 两项独立征费确实存在，已据实填入；英文回填 20 个字段。
- `tw-twse`：16 个候选字段转为有值，3 个（`regulatory_fees`/`implicit_costs_note`/`major_outage_history`）如实留空；英文回填 27 个字段。
- `us-nyse`：20 个候选字段全部转为有值，另顺带解决 4 个此前因反爬留空的既有字段（`clearing.ccp_name`/`csd_name`/`costs.regulatory_fees`/`market_structure.short_selling` 阈值），见下方反爬突破。
- `us-nasdaq`：26 个候选字段全部转为有值，其中 `regulation.core_laws`/`market_structure.short_selling` 是此前 `OPEN-QUESTIONS.md` 框架性问题第32条点名的既有缺口，本次一并解决。
- `uk-lse`：23 个候选字段中 19 个 `confidence: high`、3 个 `medium`、1 个（`major_outage_history`）留空转悬案。
- `jp-jpx`：33 个候选字段中 27 个 `confidence: high`、2 个 `medium`、4 个（含 `post_delisting_venue`/`regulatory_fees`/`implicit_costs_note`）留空转悬案。

**质量核验：** 8 个子代理各自按任务要求做了 10 字段抽样自查（合计 80 个样本），全部 100% 通过。合并阶段协调者额外做了两轮独立复核：① 逐一 grep 核对每个子代理声称对 `SOURCES.md`/`OPEN-QUESTIONS.md`/`glossary.yml` 追加的关键词/条目，确认全部仍在最终态（无 [ADR-021] 式静默丢失）；② 独立重新抽样 16 个 `confidence: high` 字段跑 `quote` 与 `.cache/` 原文核对，初次用粗糙脚本比对出现多次"未命中"，逐一人工排查后确认**全部是脚本本身的局限**（PDF 需要 `pdftotext` 提取而非直接读二进制、`.cache` 目录本身不入库导致部分交易所的历史缓存不在本次协调者环境里、quote 用"／"衔接非连续原文段落属已确立合法写法），未发现一例真实编造或数字失实；对 `cn-szse.regulation.foreign_ownership_limit`（10%/30%持股上限）额外用 `make fetch` 重新抓取官方原文逐字复核通过。全程 `make build` 保持 0 错误 0 警告，`make sync` 二次幂等。远超 [CLAUDE.md 四] 的 ≥95% 门槛。

**反爬突破（本批最大的额外收获）：** 两个子代理（`us-nyse`/`us-nasdaq`）独立尝试并各自成功突破了 v0.2 以来悬置的 `sec.gov`/`finra.org` 反爬缺口，方法互补：`us-nyse` 发现 `sec.gov` 的 403 实为其自己文档化的"Fair Access"限流机制而非反爬，换成"机构名+邮箱"格式的身份声明式 UA（而非伪装浏览器）即可稳定复现地转为 200，同一 UA 对 `finra.org` 的部分服务端渲染路径也意外有效；`us-nasdaq` 独立找到另一条路线——`govinfo.gov`（官方制定法汇编）、`ecfr.gov` 的公开 versioner API（前端是 JS 壳但 API 本身返回官方 XML 全文）、`federalregister.gov`（SEC 规则修改通知里复述现行条文）三个政府镜像站均可绕开 `sec.gov`/`finra.org` 直接取得同等权威的一手原文。`dtcc.com` 内容子页仍被 Cloudflare 硬拦截（首页与静态资产路径不受影响），降级为改引 SEC 官方监管文件间接确认 NSCC/DTC 角色，已解决受影响的四个字段，`dtcc.com` 本身留待未来专门攻坚。两条路线的完整操作细节已写入 `PROJECT/SOURCES.md`「突破记录」一节，供后续会话直接复用而非重新试错。

**工程教训——`isolation: "worktree"` 第三次独立复现失效（继 [ADR-021]、[ADR-027] 之后），规模更大且有新发现：** 8 个子代理里只有 1 个（`uk-lse`）全程保持真正独立隔离，其余 7 个因账号额度中断后经 `SendMessage` 恢复而落入 orchestrator 共享目录，与前两次记录的现象一致，但本次规模更大（此前两次分别是 9 中 7、6 中 3）。新发现三点，已回写 `.claude/skills/add-exchange/SKILL.md`：① 隔离状态可能在同一个子代理的不同恢复节点之间来回切换，不是"一旦共享就一直共享"，每次被恢复都要重新自检；② 由于严格遵守既有 SKILL.md 建议的"精确 `git add`+`git commit -- <files>`"纪律，本次**没有发生数据丢失**，但观察到一种此前未记录的良性副作用——某子代理暂存但未提交的改动，有一定概率被邻居子代理的提交顺带收纳，导致自己事后 `git diff` 为空却并非"活没做"，需要改用 `git log` 排查而非重新再写一遍；③ 8 个子代理中有 2 个各自独立为同一个英文概念（"Default Waterfall"）新造了不同的中文译法（`hk-hkex` 造"违约损失分摊阶梯"、`uk-lse` 造"违约处置瀑布"），合并阶段才发现重名，协调者手工合并为一条 `glossary.yml` 词条（保留 `uk-lse` 版作为日后统一译法，`hk-hkex` 已落库的 `zh` 字段原文不回改）。"因限额中断需要 `SendMessage` 恢复"这条路径本身仍未排查根因（[ADR-021]/[ADR-027] 均已提出怀疑），三次独立复现后判断已经是稳定可复现的平台层面限制而非偶发，后续批次应默认假设隔离不可靠、按 SKILL.md 已记录的应对纪律执行，不再视为需要"排查"的异常。

**退出标准对照：** [ADR-028]/ROADMAP 定的退出标准是"8 个 0/20 字段清零"——本批已使其中 5 个（`data_pricing_model`/`historical_data_availability`/`broker_landscape`/`liquidity_risk_note`/`political_risk_note`）在至少一家交易所转为有值，`implicit_costs_note`/`regulatory_fees`/`post_delisting_venue` 三个在本批 8 家里也多数转为有值或明确留空转悬案，全部 20 家的清零状态需等 Batch 2/3 覆盖剩余 12 家后再评估，本条不重复判定。

**验证：** `make build`（sync+check）0 错误 0 警告，20 家交易所；`make sync` 二次幂等；8 个子代理分支全部合并（`uk-lse` 走独立分支 `merge --no-ff`，其余 7 家因共享目录直接以线性提交落在同一分支，含 1 处 `cn-szse`/`tw-twse` 内容误混入的订正提交、1 处术语重名的合并订正）；协调者独立抽检 16+1 个字段全部核实通过（过程与排除的脚本假阳性见上）。

**日期：** 2026-08-25

### ADR-032 — v1.1 Batch 3/3：verbatim-quote 反查机器化 + 引用来源全量落盘，固化为 `make check` 关卡

**做了什么：**
- 新增 `tools/verify_quotes.py`：离线只比对 `.cache/<id>/_manifest.json` 中实际落盘且被字段引用的来源正文（剥离 HTML 标签 + PDF/Office 文本提取），判定每个 `confidence: high` 字段的 `quote` 是否为连续 verbatim 子串；未落盘来源记 `CACHE_MISS`（不误判为 FAIL），`--live` 额外现场抓取（JS 页/被拦记 `LIVE_ERR`）。已接入 `make check`（仅 `FAIL` 才非零退出，可阻断构建），并加 `make verify-quotes` / `make verify-quotes-live` 两个独立命令。
- 新增 `tools/fetch_sources.py`：收割 yml 里所有 `sources` URL 落盘 `.cache`，按内容类型定扩展名、为 PDF/Office 生成 `.txt` 伴随文本、sec.gov 等 `.gov` 用 Fair Access 格式 UA（"机构标识 邮箱"）。批量抓得 632 个来源。
- 运营规则落地：反查 `FAIL` 的处置为「改写 `quote` 为来源里连续 verbatim 子串」或「来源确无 verbatim 措辞（404/JS 壳/纯图片 PDF/仅第三方 paraphrase）→ 降级 `medium` 保留 `sources` 并 `detail` 说明」。分 11 个交易所并行子代理修复 34 处确属非 verbatim / 引用错页 / 抓到错误页的字段。
- Batch 3/3 收尾：`.cache` 落盘来源全量反查使 OK 由 27 升至 929、`FAIL` 归零；`SOURCES.md` 的 Batch 2 堆块并入各交易所小节；Batch B 教训回写 `.claude/skills/add-exchange/SKILL.md`（verbatim 反查步骤 + 不可核验即降级 `medium`）；每家 10 字段抽检（quote vs 落盘来源）200/200 通过（100%）；`OPEN-QUESTIONS.md` + `glossary` 经 `make sync` 重新生成；本 ADR 记录上述决策。

**为什么：** CLAUDE.md 二.5 要求 `high` 字段 `quote` 必须 verbatim 且数字可反查，但此前只能靠人工抽检（[ADR-017]/[ADR-031] 的抽检都靠临时脚本且多次假阴性：PDF 未提取、`.cache` 不入库、quote 用"／"衔接非连续段落）。把反查机器化并接入 `make check`，使"防幻觉铁律"从自觉变为可阻断构建的硬关卡，杜绝子代理静默写入编造/改写 `quote`。

**验证：** `make build` 全绿（validate 0/0、verify_quotes OK=929 FAIL=0）；`PROJECT/SPOT-CHECK-v1.1.md` 记录 20 家各 10 字段抽检 100% 通过；残 61 个 `CACHE_MISS` 为引用来源未落盘或错误页，按 CLAUDE.md §四 留人工抽检。

**日期：** 2026-08-27

### ADR-033 — A1：防幻觉机器校验补完（第三方来源封顶 + 数值反查收紧 + 路径引用收窄 + spec 反查预埋）

**背景：** v2.0 可视化转向前的加固任务（见 `ROADMAP.md`「v2.0 计划」/ 记忆 `v2-visualization-pivot`）。CLAUDE.md 二节的防幻觉铁律里，verbatim-quote 已由 [ADR-032] 机器化，但还有三条只靠自觉：第三方来源 `confidence` 上限 medium（`OPEN-QUESTIONS.md` 框架性问题 #6）、数字反查可被绕过（#12）、路径引用校验会误报站外路径（#35）。Phase 1 要给 `market_structure` 加结构化 `spec` 层并用并行子代理回填，这几条届时是硬拦截，必须先补。

**定了什么（`tools/validate.py` 四项改动，均 0 存量违规——preventive）：**

1. **第三方来源封顶（#6）**：新增 `SOURCES_TAG_RE` 解析 `PROJECT/SOURCES.md` 每条域名行的「官方/监管/第三方」标签（标签后可跟括注，取首词判定），`main()` 构建 `domain → {primary|third_party}` 映射。`validate_data()` 里：某 `confidence: high` 字段若**全部**来源域名在 SOURCES.md 都标为「第三方」→ `err()`。取宽松并集——有任意一个官方/监管/未标签来源即放行（`mgzq.com` + `english.sse.com.cn` 这种混合仍可 high）。标签格式不符的域名按「非第三方」处理，不制造假报错。

2. **数值反查收紧但不改判据语义（#12）**：`NUMBER_RE` 从 `\d[\d,]*\.?\d*` 收紧为 `\d+(?:,\d{3})*(?:\.\d+)?`（严格千分位分组），杜绝 `45,`、`15:30,15:30`、`6.385/76，1976` 被切成 `45,197`/`3015`/`761976` 这类垃圾 token 混进数字集合、在 `quote` 里制造假命中。**散文 `zh`/`en` 仍用「至少一个数字命中」判据**——实测把它改成「全部命中」在真实数据上产生 223 处假阳性（12/24 小时制改写、中文数字、含数字的产品名如 MT30/Nifty 50、小数点与千分位习惯、多来源综合的叙述性字段），收窄到「量化章节 + 短 zh + 无多段引用」后仍有 14 处、几乎全是时间记法与名称噪声——**「全部命中」对散文是死路，不再尝试**。

3. **结构化 spec 值按「全部命中」严判（新增 5b，#12 的真正出口）**：`confidence: high` 且带 `spec` 子块的字段，`spec` 里每个数值（递归收集 int/float/纯数字串叶子）都必须能在 `quote` 里找到，缺一个即 `err()`。`spec` 是精确定型值（`limit_pct: 10`、`threshold_pct: 7`），没有散文那些噪声，可以严。**Phase 1 给 `market_structure` 加 `spec` 后这条才有对象，在那之前 `spec_number_strings()` 返回空、是 no-op。**

4. **路径引用收窄（#35）**：`validate_path_references()` 只对「首段是仓库顶层条目（`ROOT.iterdir()` 的名字）且不含 `..`」的反引号 token 校验。站内相对路径片段（`res/pc/js/func.js`）、绝对路径示例（`/tmp/x.html`）、别的仓库/网站的路径不再是校验对象——此前会误报，靠「文档里别用行内反引号包非仓库路径」的约定绕，现在从校验侧根治。

**复用工具**：抽出 `numbers_in(text)` / `numbers_missing_from_quote(value_texts, quote)` / `spec_number_strings(spec)` 三个纯函数，散文反查与 `spec` 反查共用同一套数字提取逻辑（对应 A1 提案的「④ spec 反查框架预埋」）。

**为什么不为 #12 的散文场景发明豁免机制：** 提案原设想「改全部命中 + `detail` 标注豁免」，实测豁免面是 223 → 即使全部标注，校验也退化成「几乎全部字段都豁免」，没有信号。散文里「显示值是否忠实呈现 quote」本质是语义问题，数字子串匹配逼近得很差；这层交给 [ADR-032] 的 verbatim-quote 反查（quote ⊆ 来源）+ 未来 `spec` 层（typed 值 ⊆ quote）两道关卡，散文数字检查维持「挡整条编造」的下限即可。

**OPEN-QUESTIONS 处置：** #6、#35 已解决 → 按文件头规则删除，结论转本条。#12 **不删除**——散文场景的绕过空间仍在（本条只关掉垃圾 token 通道、把严判移到 `spec`），条目更新为记录「全部命中已实测否决、真正出口是 `spec` 层 + verbatim 反查」，避免下一个会话重走这条死路。[ADR-024] 里「第6条仍待办」一句加了已解决指向。

**验证：** `make check` 全绿（20 家，0/0）；四项校验各构造一个反例（`matching_principle` 引 mgzq.com 标 high / `main_board.zh` 全编造数字 / `main_board.spec.limit_pct: 77` / `.md` 里写坏仓库路径）确认能拦下，站内路径 `res/pc/js/func.js`、绝对路径 `/tmp/x.html`、真实路径 `tools/validate.py` 确认放行；`spec` 正例（`limit_pct: 10`，quote 含「10%」）放行。`docs/data/freshness.json` 的日期漂移（`age_days` 按当天重算）是既有现象、与本条无关，未纳入本 PR。

**日期：** 2026-08-29

### ADR-034 — A2：v1.1 尾巴收口（verify_quotes 走 expand / br-b3 裸串 source 归一 / 英文回填 #45 清零 / 61 CACHE_MISS 归零）

**背景：** v2.0 前置加固第二步（A1 见 [ADR-033]）。清 v1.1 收口时明确留下的两条尾巴——`OPEN-QUESTIONS.md` 框架性问题 #45（英文模式"中英夹杂"）与 [ADR-032] 残留的 61 个 `verify_quotes` `CACHE_MISS`。

**定了什么：**

1. **`tools/verify_quotes.py` 的 walk 改走 `sync.expand_exchange` 后的数据**（跟 `validate.py` 一致），跳过 `_meta` 键本身。此前它读原始 YAML，只看字段自己的 `sources`，看不到章节级 `_meta.sources` 级联——导致 ~40 个"字段有自己的 quote + 章节 `_meta` 提供 sources"的字段被误报 `CACHE_MISS`。改后 `OK` 929→1017（同一批数据），并**暴露 6 个此前被 `_meta` 级联掩盖的真实 FAIL**：3 个 `de-eurex` 交易时段字段的 quote 出自 Eurex 官网「Trading hours」页而非章节 `_meta` 指向的《Conditions for Trading》PDF；`hk-hkex.price_limits.type` 出自 VCM FAQ；`sg-sgx.price_limits.other_boards` 出自 Circuit Breaker 通知 8.14.1；`us-nyse.listing.continuing_obligations` 出自 `nyse.com/regulation`。均逐字段补显式 `sources`（指向 quote 真实所在页，都已在 `.cache` 里）后转 OK。

2. **`br-b3.yml` 的 34 处裸字符串 `sources`（`- "https://…"`）统一转成 `- {url, accessed}` 字典**。裸串是 br-b3 独有的非标准写法（其余 19 家都是字典形式），后果是一连串工具静默漏处理：`fetch_sources.py` 的 `cited_urls()` 只认字典→从不抓这些 URL；`validate.py` 的"域名已登记"与 [ADR-033] 的"第三方封顶"校验对裸串取 `url=None`→整个跳过。归一后 `fetch_sources.py` 正常收割，`valorinternational.globo.com`（第三方新闻，两处 `confidence: medium` 字段引用）被"域名未登记"校验抓出→补登记 `SOURCES.md`。`fetch_sources.py` 的 `cited_urls()` 同时加了防御性兼容（两种写法都收），防同类问题复发。

3. **英文回填 #45 全库清零**：扫全部 20 家的"`zh` 已填 / `en` 空 / 非枚举 / 非 `en_required`"叶子字段，逐个补 `en`（多为 `dst_rule`、`settlement_currency`、`trading_sessions.*`、`fx_risk_note` 这类短字段；纯时刻区间如"9:30-11:30"补相同值消除前端"（中文原文）"误标）。此前 [ADR-031] 的方案①只覆盖了四家中文源的 `{zh,en}` 信封字段，漏了裸字符串字段与 `sa-tadawul`/`za-jse`/`au-asx`/`uk-lse`/`us-*` 等 `source_lang: en` 家的散字段。补完后全库该类字段 = 0，#45 按文件头规则删除。

4. **61 个 `CACHE_MISS` → 0**：#1 消化 42（`_meta` 级联可见），#2 + `fetch_sources.py` 消化 ~13（br-b3 裸串归一后可抓），4 个 python-requests 走本机代理 SSL/Proxy 失败的域名（`planalto.gov.br`/`szse.cn`/`jipf.or.jp` + `in-nse` 的 SEBI FPI PDF）改用 curl 手工落盘，1 个（`in-nse.participants.foreign_access_channel`）是 URL 里 `1919` typo（应为 `2019`）导致抓到 404 壳——修正 URL 后 verbatim 命中。最终 `verify_quotes` OK=1024 FAIL=0 CACHE_MISS=0（在 `.cache/` 已由 `fetch_sources.py` 落盘的前提下——`.cache/` 不入库 [ADR-002]，新克隆需先 `python3 tools/fetch_sources.py`）。

**为什么改工具而不是逐字段补 `sources`：** ~40 个"(no sources)"字段本就靠 `_meta` 级联拿到 sources（CLAUDE.md 一节的 DRY 机制），逐个复制一份 `sources` 到字段级正是该原则反对的"同一件事两处手写"。让 `verify_quotes` 跟 `validate.py` 一样看展开后数据，是把两个校验器对齐到同一套语义。

顺带：`validate.py` 的路径引用校验（[ADR-033] ③）把 `skip_dirs` 也从"顶层条目"集合里减掉——文档里写 `.cache/<id>/_manifest.json` 这类示意路径不再被当作"仓库应存在此文件"误报。

**未处理 / 留给后续：** `.cache/<id>/_manifest.json` 是否入库（入库则 `verify_quotes` 离线校验在 CI / 新克隆才有意义）是 [ADR-002]"零 CI 部署 / `.cache` 不入库"的再评估，属 Phase 0 范畴，本条不动。`OPEN-QUESTIONS.md` #20（`in-nse` STT 税率表覆盖面 / `overview.foreign_ownership_limit` 留空）只顺带订正了其中 `foreign_access_channel` 的来源 URL，STT 与外资持股上限两处仍如实保留。

**验证：** `make build` 全绿（validate 0/0、verify_quotes OK=1024 FAIL=0 CACHE_MISS=0）；`make sync` 两次连续运行产物 md5 一致（幂等）；6 个新暴露 FAIL 逐一核对补入的 `sources` 页正文含该 quote 的 verbatim 窗口；英文回填字段的数字与既有 `zh`/`quote` 一致（[ADR-033] 的散文数字反查通过）。

**日期：** 2026-08-30

### ADR-035 — v2.0 Phase 0：范式转向（主视图=交易日平面图）+ `spec` 结构化层契约 + 零构建 / 诚实渲染 / 非现货降级

**背景：** 2026-08-29 用户校准项目目标（见记忆 `v2-visualization-pivot` 与 `ROADMAP.md`「v2.0 计划」）：当前网页本质是分类数据表，可视化程度低，没服务到「交易员首次接触一个陌生市场就快速建立认知」这个真实主用例。核心范式是「日内时间 × 相对前收价」二维平面——第五章几乎每个字段都是对这个空间的约束。本条是 v2.0 Phase 0 的定案集（几乎不写代码，产出是本 ADR + [ADR-036] + `ROADMAP` 骨架），Phase 1 起才动 schema/数据/前端。四项决策（主视图、`spec` 层、零构建、诚实渲染）在 Phase 0 讨论时用 AskUserQuestion 逐项确认。

---

#### A. 主视图范式转向——修订 [ADR-005]

**定了什么：** 站点默认首屏从对比矩阵（[ADR-005]）改为**单市场「交易日平面图」**：顶部市场下拉；中央 SVG 平面，x = 日内时间（分钟精度，覆盖盘前到盘后），y = 涨跌幅（相对前收价 / 前结算价）。矩阵降级为「对比模式」，移到 `#view=matrix`。

**平面元素 ← 第五章字段映射**（Phase 2 据此渲染，Phase 1 据此决定 `spec` 结构化哪些字段）：交易时段→x 轴分段着色；开/收盘机制→首尾集合竞价区块；价格限制类型→y 轴处理方式；主板幅度→y 轴边界墙 + 墙外阴影；熔断→y 轴多档触发线 + 触发后 x 轴时间缺口 + 恢复标记；波动性中断→贴价格路径的走廊；临时停牌→"任意时刻"斜纹条；回转交易 T+N→x 轴右缘箭头；撮合原则 / 订单类型 / 做空 / 做市商→标注层。

**为什么修订而非废弃 [ADR-005]：** [ADR-005] 的「横向可比是核心差异化」在校准后不再是唯一立论——「首次接触即看懂」成为新的主用例，它天然是单市场、图形化的。矩阵不消失（对比模式保留），但「默认首屏 = 矩阵」这个决定要改。[ADR-005] 条目保留作历史，加一行指向本条。

**Phase 2 要改的（本条只记，不动）：** `app.js` `render()` L603 的 `params.view || "matrix"` 默认值、L632/L673 的初始 hash、`updateActiveTab`、`docs/index.html` 的 tab 按钮顺序（对比矩阵 / 交易日平面图 / 时区 / 健康度）。矩阵/时区/健康度三视图的渲染逻辑不动。

---

#### B. `spec` 结构化层——契约

**问题：** 分钟级、每个元素挂 quote 的平面图需要机器可读的量化参数（时段起止 HH:MM、涨跌停 ±%、熔断档位表 …）。现在这些是散文（`price_limits.main_board.zh = "±10%"`，数字漂在字里）。[ADR-015] 当初为时区甘特条选了「构建期正则从散文推导」，并自己承认是近似（"误差量级是分钟"）——正则推导撑不起分钟级 + 逐元素溯源的图。

**定了什么：**

1. **新增 `spec` 为事实信封的一个键**，与 `zh`/`en`/`enum`/`quote`/`confidence`/`sources`/`detail`/`verified` 并列（Phase 1 加进 `sync.ENVELOPE_KEYS`，原样导出到 `docs/data/exchanges/<id>.json`）。`spec` 存该字段量化机制的结构化形式：
   ```yaml
   price_limits:
     main_board:
       spec: { limit_pct: 10, reference: prev_close, symmetric: true }
       zh:   "±10%（风险警示股票 ±5%，科创板见 other_boards）"
       quote: "涨跌幅限制比例为 10%"
       confidence: high
   ```

2. **与 CLAUDE.md §一「一处手写」的共存——`spec` 是量化事实的机器形式，`zh`/`detail` 是同一事实的人读渲染 + 语境，同构于既有的 `enum` + `zh` 关系**（`price_limits.type` 早就同时有 `enum: percentage_band` 和 `zh: "百分比涨跌幅"`，没人当"写两遍"）。**纪律规则：驱动图的量化值只在 `spec` 手写；`zh`/`detail` 可以为读者复述它，但不得携带 `spec` 里没有的量化事实，反之亦然。** `quote` 仍是一切的 verbatim 底稿，`spec` 是"从 `quote` 提取并被 `quote` 反查"的派生值。

3. **校验**：[ADR-033] 校验 5b 已预埋——`confidence: high` 且带 `spec` 的字段，`spec` 里每个数值都必须能在 `quote` 里逐字找到（`spec` 是 typed 值，没有散文那些 12/24 小时改写 / 中文数字 / 含数字产品名的噪声，可严判）。Phase 1 另加：`spec` 结构合法性校验（见下条）；`zh` 里 ≥2 位数字若既不在 `spec` 也不在 `detail` → **warn**（不 err，[ADR-033] 已论证散文数字严查是死路）。

4. **`spec` 形状的权威定义放新文件 `schema/spec.yml`**（Phase 0 已建 stub，含设计说明 + `market_structure.price_limits.main_board` 一条示范条目；Phase 1 填充第五章其余字段并给 `validate.py` 加结构校验），按 `fields.<chapter>.<field path>` 列出每个字段 `spec` 的可用键与类型；**不塞进 `taxonomy.yml`**（已 818 行，见 [ADR-036] 对框架性问题 #5 的裁定）。

5. **`null` / 不适用 / 未填 三态**（喂给 D 节的诚实渲染）：
   - `spec: { limit_pct: null, note: "官方未公布 Tier 档位" }` —— 机制存在、数值查不到 → 平面图画幽灵墙 + "数值未公布"角标。**这正是 [OPEN-QUESTIONS 已删除的 #13] 在问的"半成品状态视觉区分"。**
   - `spec: { type: none }` —— 机制确实不存在（无涨跌停 / 无熔断）→ 平面图该轴不设线。
   - `spec` 键整个缺省 —— Phase 1 尚未填 → 平面图省略该元素。三态前端必须能区分。

6. **取代 [ADR-015] 对第五章的做法**：Phase 1 让 `spec.trading_sessions` 成为权威，`sync.compute_trading_window()` 改读 `spec`、删 `_parse_hour_tokens` 正则；时区甘特条退化成 `spec` 的一个投影。[ADR-015] 的"派生值不需 quote/confidence"论述对其余派生仍成立，只是第五章时刻不再走"推导"而走"结构化存储 + 反查"。

7. **连带解决**：[OPEN-QUESTIONS #12]（散文数字反查绕过）——`spec` 给出精确 typed 值让 5b 严查；#13（已删除，见上）。

---

#### C. 前端技术栈——守零构建

**定了什么：** 平面图 + 后续十章图形，全部用 **vanilla JS + 手写 SVG 字符串**（与现有 `app.js` 拼 DOM 字符串的风格一致），**不引图表库（D3/visx）、不引打包器 / 框架、不加构建步骤**。

**为什么：** 呼应 [ADR-002]（产物入库、推送即上线、零 CI 部署）与 [ADR-008]（不为用而用）。平面图需要的东西——坐标轴、色块、水平线、时间缺口、走廊、点击浮层——手写 SVG 完全够，且风格可控、无供应链。代价（`app.js` 会显著变大、坐标换算得自己写）可接受；真到手写 SVG 撑不住某个图形（如力导向的监管关系图）时再单独评估，不预先破例。

---

#### D. 图形诚实呈现规则

平面图（及后续所有图形）不得宣称比来源更高的精度。规则：

1. `spec` 值有 + `confidence: high` → 实线 / 实心渲染。
2. `spec` 值 `null`（带 `note`）→ 虚线 / 幽灵 + "数值未公布"角标。
3. 来源只给区间不给点 → 渲染成半透明带，不是线。
4. `confidence: medium/low` → 元素照渲染，但加"未完全核实"视觉线索（更淡 / 点边框）。
5. **时间精度**：`spec.trading_sessions.*` 的 `start`/`end` 是 HH:MM；x 轴分钟分辨率，但不得暗示到秒。来源给随机窗口（如 ASX「09:59:00 randomised 15s」）→ `spec` 存名义时刻 + `randomised_seconds`，图上画一小段模糊区。
6. **每个渲染元素可点击 → 弹出该字段的 `zh`/`detail`/`quote`/`sources` 全套溯源**（复用现有 `openCellOverlay`）。平面图永远不是某个事实的唯一表示。
7. 延续 [ADR-015] 的自律：视图文案与浮层带原始散文，图不假装比档案页更权威。

---

#### E. 非现货所在交易日平面图上的降级

「时间 × 相对前收价」平面默认现货股票市场。处理：

- **纯衍生品所（`de-eurex`）**：y 轴 reference 从"前收盘价"改标"前结算价"（期货涨跌停、股指期货熔断本来就按 % from prev settlement 表达）。平面语法不变，只换 y 轴标签——`spec` 里带 `reference: prev_settlement`，前端据此选标签。`de-eurex` 的顶层第五章字段本就在描述衍生品（[ADR-009]/[ADR-019]），其 `spec` 直接用；无涨跌停 / 无股票式熔断的地方走 D 节 `type: none`。
- **一所现货+衍生品双业务、合并单条目（`sg-sgx`/`kr-krx` 等）**：平面图**默认显示现货**（顶层 `market_structure.*` 的 `spec`），提供切换到衍生品视图（`market_structure.derivatives.*` 的 `spec`）——同一套语法，两份数据。
- **衍生品由集团内独立法人经营、不在本记录范围（`de-xetra`→Eurex、`ca-tsx`→Montréal）**：平面图只显示现货。

**更新 [OPEN-QUESTIONS #17]**：市场结构 / 平面图这一侧本条已解决（平面图靠 `reference` 标签 + `type: none` 泛化到衍生品）；`listing` 整章对纯衍生品所的系统性不适配是另一回事，[ADR-036] 给方向（把 [ADR-020] 的 `optional`/`count_chapter_leaves` 推广到章节级"仅现货适用"标记，Phase 3 做第六章可视化时一并落地）。

---

**验证：** 本条不写代码，无 `make check` 影响。[ADR-005] 加了指向本条的修订注。

**日期：** 2026-08-30

### ADR-036 — 积累的 schema 框架性问题批量裁定（Wave 3 前置）

**背景：** [ADR-035] 之外，`OPEN-QUESTIONS.md`「框架性问题」里攒了一批"等样本更多再评估 schema"的条目。v2.0 Phase 0 一并坐下来逐条裁定——20 家样本已经不少，且 Phase 4（Wave 3）一开就是 6-8 个并行子代理，不先裁定会把同样的判断错误复制 6-8 遍（[ADR-018] 的教训）。**裁定逐条对照真实数据，不转述 OPEN-QUESTIONS 的归纳。** 大多数结论是"暂不改 + 写明确触发条件"——不是拖延，是把"什么时候该动"从模糊变成可执行。

**逐条裁定：**

1. **#39 `short_selling_stance` 缺"备兑卖空"档 —— 落地：加 `covered_only`。** 逐读 `za-jse`（"允许备兑、禁止裸卖空、无报升规则、无名单"，当前无 enum 只有自由文本）与 `sa-tadawul`（`restricted_uptick`，备兑 + 类报升价格条件 + 动态限额）。`covered_only`（允许备兑卖空 / 禁止裸卖空 / 无报升规则 / 无指定名单）是全球最常见的卖空规制形态，四个法律区分（备兑 vs 报升 vs 名单 vs 禁止）本身很清晰——不像 `review_system` 需要 11 个样本才看出形态（[ADR-023]）。**`enums.yml` 加 `covered_only`；`za-jse.short_selling` 从自由文本改填 `enum: covered_only`（`zh`/`en`/`quote`/`sources` 不动，只是把已核实的事实归类）；`sa-tadawul` 保持 `restricted_uptick`（报升条件是更具约束力的特征）。** `OPEN-QUESTIONS #39` 删除。

2. **#38 `region` 枚举粒度（`mena_africa` 混装中东 + 非洲）—— 暂不拆，触发条件写明。** 现 2 样本（`sa-tadawul` 中东、`za-jse` 撒哈拉以南非洲）。**触发：Phase 4（Wave 3）若纳入第 3 个 MENA/非洲所（如 `eg-egx`/`ng-ngx`），则把 `mena_africa` 拆成 `middle_east` + `africa`，`za-jse`→`africa`、`sa-tadawul`→`middle_east`，前端矩阵地区筛选自动跟随（读 enum，无需改代码）。** 在那之前 4 档够用。`OPEN-QUESTIONS #38` 更新为记录本裁定（保留，因为还没到触发点）。

3. **#1 `federation_of`（Euronext 联邦制，整体收录为一条）—— 暂不加字段。** 1 样本。现状"如实列出七国监管机构对照 + `detail`"字段变长但不失真。**触发：Phase 4 若再纳入第 2 个"多国联邦、整体收录为一条"的所（另一个泛区域交易所），再评估 `federation_of` 反向字段。**

4. **#5 `taxonomy.yml` 单文件失控 —— 暂不拆，设阈值。** 现 818 行；[ADR-035] 的 `spec` 形状定义已决定放独立文件 `schema/spec.yml` 而非塞回 taxonomy，缓解了主要增长压力。**触发：`taxonomy.yml` 超过 ~1200 行，或需要新增第 12 个顶层章节时，按章拆 `schema/chapters/*.yml` 由 `sync.py` 汇总。**

5. **#17 `listing` 整章对纯衍生品所不适配 —— 平面图侧已由 [ADR-035] E 解决；`listing` 侧给方向。** 决定**不引入"按交易所类型的章节级条件适用机制"**这种大改，改为把 [ADR-020] 已有的 `optional: true` + `count_chapter_leaves()`（"整组未启用则不计入完成度分母"）**推广到章节级**：给 `listing` 章节加一个"仅现货适用"标记，纯衍生品所（`de-eurex`）整章不计入分母、前端档案页折叠显示。低成本、复用现有机制。**Phase 3 做第六章「上市生命周期」可视化时一并落地**，Phase 0 只锁方向。`OPEN-QUESTIONS #17` 更新。

6. **#19 跨交易所指数熔断（`in-nse` 的熔断看 Nifty 50 或竞争对手 BSE Sensex 先触发者）—— 不加 enum 维度，`spec` 结构承接。** [ADR-035] 的 `circuit_breaker.spec` 结构里，`reference` 允许是列表并带跨所标注（如 `reference: [{index: "Nifty 50", exchange: self}, {index: "Sensex", exchange: "bse"}]`）——Phase 1 设计 `spec` 形状时纳入，不动 `circuit_breaker_type` enum。1 样本，够了。

7. **#27 一所现货 + 衍生品双业务合并单条目（`sg-sgx`）—— 现有机制够用，不加新机制。** `market_structure.derivatives` / `clearing.derivatives` 子块（[ADR-019]/[ADR-030]）已承接"同实体两条产品线"；[ADR-035] E 明确了平面图对这类所"默认现货 + 切换衍生品"。`clearing.delivery_method` 顶层收窄（[ADR-030]）也已处理取值模糊。不再加机制。

8. **#30 `au-asx` 单层准入名单（无多层级板块）—— 不改 schema。** `listing.boards` 是 list 类型，ASX 填两条"伪板块"（Official List / Foreign Exempt）+ `transfer_between_boards: 不适用` 是可接受的近似。list 结构本就容得下 1 条或 N 条，不存在"装不下"。

9. **#36 监管层级（欧盟 MiFID II / SSR 等超国家规则，既非交易所自定也非单一国家监管）—— 暂不加"监管层级"维度。** 现 2 个欧盟成员国样本（`fr-euronext` 联邦、`de-xetra` 德国）+ `uk-lse`（脱欧后不适用）。受影响的是 `market_structure.tick_size`/`short_selling`、`regulation.regulator`/`core_laws` 等约 3-5 个字段，现状"如实留空 + `detail` 说明规则来自欧盟层级"够用，收益小。**若真要做，形状是给受影响字段加可选 `rule_level: exchange|national|supranational` 标记。触发：Phase 4 若纳入 ≥2 个新的欧盟成员国现货所。**

10. **#41 `overview.market_cap_usd_bn`/`annual_turnover_usd_bn` 字段名假设美元、实际多按本币披露 —— 暂维持现状，触发条件收紧。** 现 2 样本（`cn-sse` 人民币、`ca-tsx` 加元，均"如实存本币数字 + `detail` 说明"）。`OPEN-QUESTIONS #41` 已写"下次遇到第三家非美元官方披露口径的交易所时应动手解决"——**本条确认这个触发：第 3 家即动手，方案是字段改名去掉 `usd`、配一个可选 `currency` 键（不接实时汇率，避免"什么时点汇率"的新可追溯性问题）。** `OPEN-QUESTIONS #41` 保留（还没到第 3 家）。

**未纳入本条的框架性问题**（属数据缺口或已另有归属，非 schema 结构问题）：#4（quote 粒度成本，方法论）、#7/#8/#9/#10/#11（具体来源缺口）、#16（jp-jpx 熔断存疑，[ADR-035] D 节的 `null` 约定让它可诚实呈现，数据本身仍是悬案）、#18（`official_languages` 口径，`in-nse` 已临时判断）、#25/#40（`organization_form`/`ccp_name` 单一制假设，样本仍不足，各 1-2 家，`de-xetra`/`za-jse` 已"留空 enum + 文字描述"吸收）、#20-#24/#26/#28/#29/#31/#33/#34/#37/#43（具体交易所数据 / 抓取缺口）。

**关于 `.cache/` 入库（[ADR-034] 留给 Phase 0 的问题）：** `verify_quotes` 离线校验只在本地 `.cache/` 已 `fetch_sources` 落盘时有意义；`make check` 里 `verify_quotes` 对 `CACHE_MISS` 不 fail，新克隆构建不受影响。**裁定：暂不入库**（保 [ADR-002] 的 `.cache` 不入库 + 仓库体积可控）。若未来真上 CI 且要 CI 跑 verbatim 反查，方案是只入库规范化文本提取（`.pdf.txt` + 每个来源一份 normalized `.txt`），不入库原始 HTML/PDF 快照——留待有 CI 需求时再做。

**验证：** `enums.yml` 加 `covered_only` + `za-jse.short_selling` 改 `enum: covered_only`（`quote`/`sources` 不动）后 `make build` 全绿（20 家，0/0、verify_quotes OK=1024 FAIL=0）；`make sync` 幂等；其余裁定不写代码。

**日期：** 2026-08-30

### ADR-037 — Phase 1a：`spec` 层实装（sync/validate 接入）+ 第五章契约 + 5 家示范回填

**做了什么（v2.0 Phase 1 拆成 1a 基建 + 示范、1b 全量回填两步；本条是 1a）：**

1. **`schema/spec.yml` 写全第五章 13 个字段的 `spec` 形状**（`trading_sessions.*` 六个 + `opening/closing_mechanism` + `price_limits.main_board` + `circuit_breaker` + `volatility_interruption` + `short_selling` + `market_maker_scheme`），每个列 `keys`（键名 → 类型/枚举描述）与 `forms`（允许的键组合，散文）。深层形态合法性暂不强校验。

2. **`tools/sync.py`**：`spec` 加进 `ENVELOPE_KEYS`（→ 每个字段 JSON 里多一个 `"spec"`，未填为 `null`，与 `enum`/`quote` 等既有键一致）。`compute_trading_window()` 的 `session_hours()` 改为**优先读 `spec.{start,end}`（HH:MM）**，`spec.kind == "none"` 视作该时段不存在，没有 `spec` 才退回 `_parse_hour_tokens` 从散文正则抽（[ADR-015] 旧路径，Phase 1b 未结构化的所仍走）。

3. **`tools/validate.py`**：新增 `spec` 结构校验——`spec` 必须是 dict；`spec` 里每个键必须在 `schema/spec.yml` 对应字段的 `keys` 里声明过（挡拼写错）；字段有 `spec` 但 `spec.yml` 无定义 → err。5b 数值反查（[ADR-033] 已预埋）现在有对象了：`confidence: high` 字段 `spec` 里每个**纯数值**都要在 `quote` 里逐字找到。**HH:MM 时刻串不参与 5b**（`spec_number_strings` 的 `re.fullmatch(r"-?\d+(?:\.\d+)?%?")` 天然排除带冒号的串）——12/24 小时制、前导零等格式差异会制造假阳性（[ADR-033] 的教训），时刻值靠结构校验 + `quote` 散文 + 人工抽检，不靠 5b。

4. **5 家示范 `spec` 回填**，覆盖形态多样性：
   - `cn-sse`——`price_limits` 百分比 `{limit_pct: 10, reference: prev_close}`；`circuit_breaker: {type: none}`（2016 暂停史留 `detail`）；集合竞价起止。
   - `us-nyse`——`price_limits: {type: dynamic, band_pct: null, note}`（LULD，Tier 百分比未公布 → `band_pct: null` = [ADR-035] D 的"存在未公布"三态之一）；`circuit_breaker` MWCB `levels: [{7}, {13}, {20}]`（停牌时长在 `detail` 未逐字核实，暂不入 `spec`）；`continuous_am/lunch: {kind: none}`（无上下午分段）。
   - `jp-jpx`——`price_limits: {type: stepwise, ladder: [首尾两档锚点], full_table_note}`（值幅制限，本条原写「37 档」系笔误，实为 **34 档**，Phase 1b [ADR-039] 逐行核实并填全）；`circuit_breaker: {type: stock_level, note}`。
   - `de-eurex`——**`price_limits.reference: prev_settlement`**（[ADR-035] E：衍生品所 y 轴基准换标"前结算价"，平面语法不变）；`{type: dynamic, band_pct: null}`；准全天候时段 01:00-22:00 CET。
   - `in-nse`——**`circuit_breaker` 跨交易所联动**：`reference: [{index: "Nifty 50", exchange: self}, {index: "BSE Sensex", exchange: "bse"}]`（[ADR-036] #6 / OPEN-QUESTIONS #19 的 schema 承接方式，验证通过）；`price_limits: {limit_pct: null, note}`（按证券分类分档 2/5/10/20%，非单一幅度）。

**为什么先做 1a 而非一次性 20 家：** 沿 [ADR-019] 先例——先示范性填几家验证 schema 能不能用、契约定得对不对，再铺开。5 家覆盖了百分比 / 无 / 动态未公布 / 阶梯 / 前结算价 / 跨所联动六种形态，`schema/spec.yml` 的键与三态设计经此验证够用。Phase 1b（[ADR-038] + [ADR-039]）补其余 15 家 + `volatility_interruption`/`short_selling`/`market_maker_scheme` 的 `spec` + JPX 34 档全表 + `matching_principle` 转 enum（20 家）。

**回归：全 20 家时区甘特条 `trading_hours` 数据与结构化前逐字节一致**（5 家 spec-driven 的 `compute_trading_window` 输出 == 原散文推导）。`in-nse` 本就不在 `EXCHANGE_IANA_TZ`（无甘特条），不受影响；Phase 1b/2 可考虑补上。

**验证：** `make build` 全绿（20 家、validate 0/0、verify_quotes OK=1024 FAIL=0 CACHE_MISS=0）；`make sync` 幂等；`spec` 结构校验对 4 个反例（键拼错 / 非 dict / 未定义字段 / 5b 编造数字）逐一确认能拦下；5 家示范 `spec` 无报错。

**日期：** 2026-08-30

### ADR-038 — Phase 1b（其一）：`matching_principle` 转 enum + `in-nse` 补入时区甘特条

**背景：** Phase 1b 的五项子任务里，`matching_principle` 转 enum 与 `in-nse` 加进 `EXCHANGE_IANA_TZ` 是纯 schema/工程改动（分类既有已核实数据、加一行时区表项），不涉及新抓取，与其余三项（15 家第五章 `spec` 回填 / `volatility_interruption`·`short_selling`·`market_maker_scheme` 的 `spec` / JPX 值幅制限 37 档全表——这三项按 [ADR-017] 并行子代理模式、每家对来源复核）性质不同，先单独落地。

---

#### A. `matching_principle` 受控词表——4 值

**定了什么：** `schema/enums.yml` 新增 `matching_principle` 词表，`taxonomy.yml` 的顶层 `market_structure.matching_principle` 与 `market_structure.derivatives.matching_principle` 两处加 `enum_ref: matching_principle`。4 个值：

| id | 含义 | 归入的交易所（顶层 / 衍生品） |
|---|---|---|
| `price_time` | 纯「价格优先、时间优先」连续订单簿——全球订单驱动市场的通用模型 | 顶层 15 家：au-asx / br-b3 / ch-six / cn-sse / cn-szse / de-eurex / de-xetra / fr-euronext / hk-hkex / jp-jpx / kr-krx / sa-tadawul / sg-sgx / tw-twse / us-nyse；衍生品：au-asx / br-b3 / cn-szse / hk-hkex / in-nse / kr-krx / sa-tadawul |
| `price_display_time` | 价格 → 显示优先（同价位显示单优先于隐藏/非展示单）→ 时间 | 顶层：uk-lse / us-nasdaq / za-jse；衍生品：za-jse |
| `price_time_broker_priority` | 价格时间优先叠加「经纪商优先撮合」（Broker Preferencing，同一经纪商双边挂单可越过队列原有排序） | 顶层：ca-tsx |
| `price_time_or_pro_rata` | 逐合约在「价格/时间优先」与「按比例分配（Pro-Rata）」之间设定——多见于衍生品 | 衍生品：fr-euronext / sg-sgx |

**为什么是这 4 个而非更细/更粗（[ADR-023] 的教训——`review_system` 逼早了粒度）：** 与 `review_system`（监管哲学，需 11 样本才看出形态）不同，撮合优先级是**具体机械规则**，20+ 样本下形态已清晰。绝大多数所是纯 `price_time`；另外三档各自对应一个交易员必须知道的结构性偏离——隐藏流动性被降级（北美常见）、经纪商自成交插队（加拿大市场的标志特征）、非纯时间优先的比例分配（利率/能源期货常见）。市价优先于限价（de-eurex/de-xetra/jp-jpx/sa-tadawul 的散文都提到）是连续竞价的固有属性、非独立形态，留在 `zh`/`detail` 不进 enum。

**未归类：** `in-nse` **顶层** `matching_principle` 保持不填 enum——该字段 `zh` 为空、`confidence: low`，字段自己的 `detail` 已写明「未找到对具体撮合优先顺序逐条说明的官方原文，未采纳常识性印象」，加 enum 会违反防幻觉铁律第 4 条。NSE 现货撮合原则待后续抓取坐实后再归类（衍生品 F&O 系统有高置信原文，已填 `price_time`）。

**enum 是同一事实的渲染，不动 `zh`/`en`/`quote`/`sources`（[ADR-035] B 的纪律，同 [ADR-036] #1 对 `covered_only` 的处理）。** `us-nyse` 归 `price_time` 是本次最软的一处：其 `matching_principle` 字段 `zh` 主要在讲 DMM 主持的开收盘竞价（`confidence: medium`），但开收盘竞价属 `opening_mechanism`/`closing_mechanism`（已填 `spec: {type: dmm_auction}`），本字段只描述盘中连续撮合，NYSE Pillar 盘中为价格-时间优先。若日后有人落实 Pillar 的 parity/setter-priority 细则，可再加值。

**前端：** 无代码改动——`app.js` 对带 `enum_ref` 的字段已统一走 `enumDisplay()`（矩阵格 L211、档案页 L318），矩阵 `trading_mechanism` 组的撮合原则列自动从散文截断改为短标签。

---

#### B. `in-nse` 补入 `EXCHANGE_IANA_TZ`

**定了什么：** `tools/sync.py` 的 `EXCHANGE_IANA_TZ` 加 `"in-nse": "Asia/Kolkata"`（印度不实行夏令时，恒 UTC+5:30）。[ADR-037] 已把 `in-nse` 第五章 `trading_sessions` 结构化为 `spec`，`compute_trading_window()` 据此算出 09:00–15:30 IST（无午休），`docs/data/manifest.json` 的 `in-nse.trading_hours` 从 `null` 变为完整窗口，时区甘特条视图多一条印度柱。

**回归：** 其余 5 家（cn-sse / hk-hkex / us-nyse / jp-jpx / de-eurex）的 `trading_hours` 逐字节不变（`git diff docs/data/manifest.json` 仅 `in-nse` 一处）。**其余 14 家仍不在 `EXCHANGE_IANA_TZ`**——待 15 家 `spec` 回填完成后，是否把甘特条铺到全 20 家属 Phase 2 范畴（届时甘特条会有可见变化，不在 Phase 1b「回归无变化」的约束内），本次只按 ROADMAP 点名补 `in-nse` 一家。

---

**验证：** `make build` 全绿（20 家、validate 0 警告 0 错误、verify_quotes OK=0 FAIL=0 CACHE_MISS=1024——本地 `.cache` 未落盘的信息性计数，非失败）；`make sync` 幂等（`git diff` 仅预期产物变化 + `freshness.json` 的 `age_days` 时间漂移）；`matching_principle` 的 29 个 enum 值（19 顶层 + 10 衍生品）经结构校验，无 `en_required` 缺失。

**日期：** 2026-08-30

### ADR-039 — Phase 1b（其二）：15 家第五章 `spec` 数据回填 + 全 20 家三个补充字段 + JPX 34 档全表

**做了什么：** 承 [ADR-037] Phase 1a 的 5 家示范，把第五章 `spec` 铺到其余 15 家（`au-asx` / `br-b3` / `ca-tsx` / `ch-six` / `cn-szse` / `de-xetra` / `fr-euronext` / `hk-hkex` / `kr-krx` / `sa-tadawul` / `sg-sgx` / `tw-twse` / `uk-lse` / `us-nasdaq` / `za-jse`），并给全 20 家补 `volatility_interruption` / `short_selling` / `market_maker_scheme` 的 `spec`、填全 JPX 值幅制限 ladder。

**执行方式偏离 [ADR-017]（并行子代理）：** 本次由协调者串行逐家完成，非派子代理。理由：(a) 运行环境为后台任务，不宜自行大量派子代理；(b) 15 家的第五章绝大多数字段在 v1.0/v1.1 已抓取核实、`verify_quotes` OK=929，本次是把**既有已核实 `quote` 结构化**，非新抓事实——风险与「[ADR-018] 教训」针对的「批量新抓」不同类；(c) 少数需补 `quote` 的（JPX 34 档、KRX 三级熔断、NYSE MWCB 停牌时长）由协调者现场 `curl` + `pdftotext` 抓官方 PDF 逐行核实。

**结构化纪律（[ADR-035] B/D 三态）：**
- 值只放当次 `quote` 撑得住的：`confidence: high` 字段经 `validate.py` 5b 逐字反查（本次新增 spec 数值 0 FAIL）。
- 机制存在但数值分组/未公开 → 该键 `null` + `note`（如 `ch-six` / `de-xetra` / `fr-euronext` / `hk-hkex` 的动态价格区间 `band_pct: null`，多市场分档写进 `note`）。
- 机制确不存在 → `type: none`（`au-asx` / `tw-twse` 无熔断，`cn-szse` / `jp-jpx` 无独立波动中断层）。
- `market_structure._meta.confidence` 多为 `high`——**新填的空字段若不显式给 `confidence`/`quote` 会继承 `high` 并触发「high 缺 quote」err**（`au-asx` / `hk-hkex` 的 `price_limits.main_board` 踩到，已补 `quote` + 显式 `confidence`）。教训已回写 `add-exchange` SKILL。

**新增到 `schema/spec.yml` 的键：** `opening_mechanism` / `closing_mechanism` 加 `randomised_seconds`（ASX 开收盘随机窗口）、`closing_mechanism` 加 `random_close_window_min`（HKEX 4:08–4:10 随机收盘）。

**JPX 值幅制限：** 抓 TSE 官方英文版 PDF（`bids_and_offers_price_limits_20141201.pdf`，现行版）逐行核实——Rule 2 Paragraph 1 股票值幅表实为 **34 档**，非 [ADR-037] / `SOURCES.md` 所写的「37 档」（笔误，已改）。`jp-jpx.price_limits.main_board.spec.ladder` 填全 34 档（`base_min` / `base_max` / `band_abs`），`quote` 扩为完整表格逐字原文；`main_board` 维持 `confidence: medium`（PDF 自标 "Provisional Reference Translation"、日文本为准）。

**`matching_principle` → `enum`（20 家）与 `in-nse` → `EXCHANGE_IANA_TZ`：** 属 Phase 1b 但已在 其一（[ADR-038]）完成。

**已知数据缺口（按三态留缺省，非本次能力问题）：** `in-nse` 的 `volatility_interruption` / `market_maker_scheme`、`de-eurex` / `fr-euronext` 的 `short_selling`、`jp-jpx` 的 `market_maker_scheme`——这些字段数据文件本身 `zh` 为空、`confidence: low`，待后续抓取坐实后再结构化。`uk-lse` / `fr-euronext` 的部分 `trading_sessions` 只填 `kind`（官方静态钟点表未定位）。

**时区甘特条回归：** 6 家（cn-sse / hk-hkex / us-nyse / jp-jpx / de-eurex / in-nse）`docs/data/manifest.json` 的 `trading_hours` 与 [ADR-038] 后逐字节一致（`hk-hkex` 已把 `trading_sessions` 结构化为 `spec`，`compute_trading_window` 改走 `spec` 后输出不变）。其余 14 家不在 `EXCHANGE_IANA_TZ`，无甘特条。

**验证：** `make build` 全绿（validate 0/0；verify_quotes 离线 CACHE_MISS，非失败）；`spec` 5b 手工复核 JPX ladder + 5 家 index-level 熔断 `levels`，spec 数值全部 quote 命中；`make sync` 幂等。

**日期：** 2026-08-30
