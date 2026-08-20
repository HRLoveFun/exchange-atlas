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

**执行进度补记（2026-08-17）：** 本条要求"必须在 v1.0 Wave 1 正式启动前解决"，但实际 Wave 1（8家）与 Wave 2（7家）均已在未处理本条的情况下执行完毕——`review_system` 枚举覆盖率不足的问题未被拦截，而是像本条警告的那样，15 个子代理各自独立产出了退化成自由文本的 `review_system`（`PROJECT/OPEN-QUESTIONS.md` 框架性问题第3条的案例数从本条写下时的 5 个滚到了 11 个）。本条阻塞未能生效的直接原因是：`PROJECT/DECISIONS.md` 与 `PROJECT/OPEN-QUESTIONS.md` 在 Wave 1/2 执行期间分处两条不同的分支演进（`main` 与 `worktree-v1-wave1`），本条写下时人在其中一侧、Wave 1 启动时另一侧的会话未同步读到——这是执行流程的疏漏，不是本条决策本身错了，枚举覆盖率不足的判断与"应该现在修"的结论依然成立，只是"现在"已经错过了 Wave 1 启动前这个时点。**不追溯返工已完成的 15 家**（返工成本此时已经沉没，见本条"为什么现在必须处理"第2点的逻辑本身也说明了越晚改代价越高，但已发生的代价不该导致重复付出两次），改为：枚举怎么拆这个设计工作与已积累的 11 个真实案例一起，作为下一次专项处理的既定任务，不再是"阻塞项"而是"高优先级待办"，与 [ADR-019] 记录的另外两处 schema 缺口（衍生品市场机制、指数口径）一起排期。

**已解决（2026-08-19）：** 见 [ADR-023]，`review_system` 枚举从 3 值扩到 5 值，18/20 家现在有归类；`OPEN-QUESTIONS.md` 框架性问题第3条已按规则删除。

### ADR-019 — 市场结构增设 `derivatives` 子块表达同一实体的第二条产品线；指数体系增设 `scope` 区分交易所自身指数与跨交易所市场基准

**编号说明：** 本条在两条独立分支（`worktree-v1-wave1` 与其上派生的 hk-hkex 衍生品补全子代理分支）上各自被独立起草过一次，编号分别是"ADR-018"（因为各自分支当时看到的 `DECISIONS.md` 最后一条都是 ADR-017，误以为 018 是下一个可用编号）；两分支汇合后发现 `main` 分支上已经有一条独立的、更早（2026-08-14）写下的真正 ADR-018（即上一条，`review_system` 枚举覆盖率问题）。按"日期更早者保留原编号"处理，本条统一改记为 ADR-019。

**背景：** 用户实测发现两处系统性缺口，不是个别交易所漏填，而是 schema 本身没预留位置：
1. **市场结构与产品体系脱节**：`schema/taxonomy.yml` 第五章 `market_structure` 是单一扁平结构，隐含"一个实体只有一类产品的交易机制"的假设。但检查后发现至少 9 家交易所（`au-asx`/`br-b3`/`cn-szse`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse`）的第四章「产品体系」里明确列了期货/期权类产品，第五章却完全没有衍生品自己的交易时段/撮合机制/价格限制/熔断规则——不是"查不到"，是这些字段从未被要求覆盖现货以外的产品线，第四章列出的衍生品业务因此在第五章里"查无此产品线"。这与 `de-eurex`（纯衍生品所，`listing` 整章不适用，已有先例）和 `sg-sgx`（`OPEN-QUESTIONS.md` 第 27 条已记录"一所多业务合并单条目"这类不适配模式）是同一根问题的更严重表现——那两处是"字段取值被迫近似/整章空置"，这里是"整整一条产品线的机制信息从未被建模"。
2. **指数体系的"交易所"与"市场"两种颗粒度混淆**：港交所只收了恒生指数，未收同一家公司（恒生指数有限公司）编制、成分股同样来自港交所上市证券的国企指数与恒生科技指数——这是纯粹的数据缺口，不需要改 schema。但美股两家分别只收了自编指数（纳斯达克综合/100、纽约综合），未收标普500/罗素2000/道指——这类指数的成分股天然横跨多个交易所（标普500同时含纽交所与纳斯达克上市公司），本项目的记录单元是单个交易所，"这个指数该算哪家的"这个问题不存在唯一正确答案，不能简单当成缺口去补，需要 schema 层面先想清楚怎么表达。

**定了什么：**
1. **`market_structure` 增设 `derivatives`（`kind: object`）子字段**，字段集合以第五章顶层字段集合为基础裁剪：保留 `trading_sessions`/`opening_mechanism`/`closing_mechanism`/`matching_principle`/`order_types`/`tick_size`/`price_limits`/`circuit_breaker`/`volatility_interruption`/`trading_halt_mechanism`/`block_trade`/`market_maker_scheme`/`connect_schemes`；去掉现货语境特有、对标准化合约类衍生品普遍不适用的 `board_lot_size`/`odd_lot_handling`/`intraday_reversal`/`short_selling`/`dark_pool`（沿用第六节已确立的"如实留空 + detail 说明设计前提不适用"惯例，但既然这五个字段对衍生品场景几乎必然不适用，直接不放进子字段结构，比让每个填写者对同五个字段重复写"不适用"更干净）；新增两个衍生品特有字段 `contract_specs_note`（合约规格摘要，如合约乘数/到期月份序列）与 `margin_practice_note`（交易端保证金制度摘要，与 `clearing.initial_margin_practice`——清算端保证金方法论——视角不同、不合并）。语义：顶层字段继续默认表达"现货/主板市场"的机制（对纯现货交易所无感知、无需改动），`derivatives` 只在该实体自身运营重要衍生品业务线时才填。**不新增第十二个章节**——十一章的框架在 `CLAUDE.md`/README/skill 文档里到处硬编码，新增顶层章节要处处联动改名，收益（多一层"这是第几章"的语义）远小于代价；挂在现有第五章下、按 `sync.py`/`app.js` 已经支持的"嵌套 object 递归渲染"（`trading_sessions`/`price_limits` 已是先例）直接工作，不用改任何 Python/JS 代码，是纯 schema+数据层面的改动。`derivatives` 子字段不挂 `in_matrix`——9/20 家有数据、11/20 家常年空白的列会把矩阵稀释成"一眼看不出是没有还是没填"，这类深度信息留在档案页，不上矩阵。
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

**执行中的意外情况：并行子代理未如预期各自隔离，7/9 落入同一共享 worktree。** 派发时对每个子代理都请求了独立 worktree 隔离，但实际只有 2 家（`au-asx`/`in-nse`）拿到真正独立的 worktree/分支；`za-jse`/`sg-sgx`/`fr-euronext`/`cn-szse`/`br-b3`/`sa-tadawul`/`kr-krx` 七个子代理全部落在了 orchestrator 自己所在的 `field-audit` worktree 里、直接对同一工作目录并发读写（根因未深究，怀疑与"orchestrator 自身已处于一个 worktree 内、且过程中多次因账号会话限额中断后经 `SendMessage` 恢复"有关，恢复路径可能没有重新走一遍独立 worktree 的创建逻辑）。这七个子代理在各自报告里都主动发现并处理了这个情况：用 `git apply --cached` 或手工 `git hash-object`/`update-index` 精确暂存自己那部分改动、用 `git commit -- <specific files>` 只提交自己负责的文件，避免把邻居未完成的编辑一并提交或误删——这是子代理自发的应对，不是任务指令里设计好的机制。

**发现并修复了一处真实数据丢失：** `fr-euronext` 提交（`678f87f`）在给共享的 `PROJECT/SOURCES.md` 打补丁时依据了过期快照，静默删除了 `za-jse` 提交（`319c080`）此前刚写入的 10 行衍生品来源 URL 登记——不是工作目录层面的短暂冲突，是**已提交历史**上发生的丢失，若不核查会直接合入主分支。合并阶段系统性核对了全部 7 个共享 worktree 提交新增的每一行 SOURCES.md 内容是否都还存在于最终状态，只发现这一处丢失，已用一条单独的修复提交（`8708155`）补回；同时核对了全部 9 个 `data/exchanges/*.yml` 文件在自己提交后再无变化（行数比对），确认实际数据文件本身未被覆盖，只是这条来源文档的可核查凭据链条短暂断过。`br-b3`/`sa-tadawul`/`kr-krx` 三个子代理的报告里也各自独立提到"观察到自己未提交的改动被邻居的非原子写入覆盖过"，但均在提交前发现并重做，最终提交内容验证无误。

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

1. **`validate.py` 新增机器校验**：`validate_data()` 逐字段循环里加一条——`fdef.get("en_required")` 为真但 `env.get("en")` 为空即 `err()`。这类"taxonomy 标记了但从未被校验"的漏洞与 `OPEN-QUESTIONS.md` 框架性问题第6条（"第三方来源 confidence 上限 medium"同样长期未被机器强制）是同一类问题，本条只解决 `en_required` 这一处，第6条仍待办。
2. **9 处违规字段的补齐口径，按用户明确指示定为**：核查交易所原语言是中文还是英文，优先用交易所官方原语言文本（中文优先、英文次之、其他语言再次之）；若交易所自身提供中英双语官方内容，直接采用官方译文，不自己翻译；只有查无官方对应语言版本时才由已核实的另一语言内容转译。实际执行：`cn-sse` 的 `core_laws`/`circuit_breaker`/`volatility_interruption`/`delisting_conditions` 四处 找到 SSE 官方英文版交易规则原文直接引用（`core_laws`/`circuit_breaker` 因此升级为 `confidence: high`）；`settlement_cycle`（"T+1"）内容本身语言无关，直接复用；`tw-twse.circuit_breaker` 同样以 TWSE 官方英文页交叉核实结论；`hk-hkex` 两处见下条。
3. **`hk-hkex.market_structure.matching_principle`/`order_types` 补齐过程中顺带查出一处实质性数据错误，不只是补翻译**：这两个字段此前内容一个未摘引任何原文，另一个经核实是把**衍生品市场（HKATS 期货期权交易系统）的撮合规则误当成了证券现货市场规则**——`SOURCES.md` 此前只登记了同名的"衍生品市场"交易机制页面 URL，未意识到证券市场有独立的同名页面。本次定位到港交所证券市场自己的官方交易机制页（`sc_lang=en`/`sc_lang=zh-hk` 双语对照），补登 `SOURCES.md`，重新核实两个字段并升级为 `confidence: high`。**教训**：字段内容与 `SOURCES.md` 登记的 URL 是否真的对应同一业务线，不能只看页面标题相似就当作已核实。
4. **不处理的部分（用户明确决定"先只报告规模，不处理"）**：`en_required` 之外，还有 114 个字段是设计上不要求双语（数字/日期/描述性文本）但英文模式仍回退显示中文，集中在 `cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse` 四家中文源交易所（约占94%）。规模与候选处理方向记入 `OPEN-QUESTIONS.md` 第45条，本条不展开、不预判处理方式。

**为什么不直接改前端回退逻辑掩盖问题**：改 `app.js` 让"无 en 时不回退显示中文"能立刻让症状消失，但会把 114 个本无需双语的字段在英文模式下变成空白——从"中英夹杂"换成"英文模式内容大面积消失"，不是修复，是转移问题；且会掩盖未来真正的 `en_required` 违规（少了兜底显示，反而更难发现该报错的字段被漏填）。机器校验 + 补数据这条路径解决的是"真违规"，前端回退逻辑本身对"设计上不需要双语"的字段仍是对的，留给 `OPEN-QUESTIONS.md` 第45条继续评估。

**验证：** `make build` 0 错误 0 警告；`make sync` 二次幂等（`git diff` 为空）；补入的 9 处字段逐一核对 `quote` 系当次抓取原文精确子串，无编造；故意还原一处 `en_required` 缺失验证新校验能拦下后改回。

**日期：** 2026-08-20
