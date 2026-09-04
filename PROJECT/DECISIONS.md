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

   **补记（2026-08-30，后台任务同步时发现）：** 本项漏了 `hk-hkex.price_limits.type` 的孪生字段 `main_board`——二者携带同一句 VCM 原文，`type` 补了显式 `sources` 而 `main_board` 没补，仍靠 `_meta` 级联继承到章节级「Trading Hours」页，`fetch_sources.py` 把该页落盘后 `verify_quotes` 转 FAIL=1。已给 `main_board` 补上与 `type` 相同的 VCM FAQ 来源（quote 的 verbatim 窗口确在该页 `.cache` 快照内），`verify_quotes` OK=1027 FAIL=0。教训：给某字段补显式 `sources` 修 FAIL 时，同一句 `quote` 若被相邻字段复用，相邻字段要一并补。

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

### ADR-040 — Phase 2：交易日平面图（v2.0 主视图落地）

**做了什么：** 按 [ADR-035] A 的「第五章字段 → 平面元素」映射与 D 的诚实渲染规则，在 `docs/assets/app.js` 新增 `renderTradingDay` / `tdBuild`（手写 SVG 字符串，零依赖、零构建，[ADR-035] C）。改动仅前端三文件（`app.js` / `assets/styles.css` / `index.html`），不动 schema / 数据 / `docs/data/` 产物。

**字段 → 元素映射的实现选择：**
- **交易时段** → 全高背景淡带（按 `kind` 着色）+ 底部时段 ribbon 色条。`kind: none` 的时段不渲染。
- **开 / 收盘机制** → 竞价窗口：`auction_start`+`auction_end` 齐全 → 45° 斜纹块；仅 `auction_end` → 竖虚线；`randomised_seconds` / `random_close_window_min` → 出清边缘一道模糊竖条（[ADR-035] D5）。`trade_at_close_end` → 竞价后一段极淡延长块。
- **主板幅度** → y 轴墙 + 墙外阴影。五态分开处理：`limit_pct` 数值 → 实线（`confidence != high` 转虚线，D4）；`type: stepwise` → 由 `ladder` 算出百分比包络（`band_abs/base_max`…`band_abs/base_min`，`base_min<300` 的低价档跳过以免失真）画**半透明带**（D3）；`type: dynamic` + `band_pct` 数值 → info 色虚线软带；`band_pct: null` → 幽灵虚线 + 「数值未公布」角标（D2）；`type: none` → 明确文字「无每日涨跌停墙」；spec 在但形态未识别（如 `in-nse` 分档 `limit_pct: null`）→ 兜底幽灵线 + 「分档 / 见 type」。
- **熔断** → `type: index_level` 才画 y 轴多档触发线（跌侧，`day_end` / `halt_minutes` 进标签，跨所 `reference` 加「跨所联动」）；`stock_level` / `contract_level` 不画线，只在 chips 里出 enum 标签（静态平面画不出「个股各自阈值」，硬画会假装精度）。
- **波动性中断** → 有 `static_pct` / `dynamic_pct` 数值才画中心走廊带（warn 色点线）；`type: none` 或 pct 全 null → 不画（避免与动态带混淆），信息进 chips。
- **临时停牌** → 顶边一道 45° 斜纹条 +「可发生于任意时刻」。
- **回转交易 T+N** → 右缘一行 `↺ T+0` / `→ T+1` 标记。
- **撮合原则 / 订单类型 / 做空 / 做市商 / 价格限制类型 / 熔断类型** → SVG 下方「标注层」chips（点击进浮层）。

**诚实渲染三态（[ADR-035] D）在代码里的落点：** `spec` 缺省 → 元素整体不渲染；`spec` 键 `null` → 幽灵虚线 + 角标；`type: none` → 明确「无」文字。`confidence: medium/low` → `tdConfClass()` 给 chips 加虚线边框；墙线在 `!= high` 时转虚线。`haveTimes` 为假（`fr-euronext` 全部 `trading_sessions` 只有 `kind`）→ x 轴退回默认 09:00–17:30，ribbon 显示「钟点未结构化——见档案页」，仍渲染价格维度。

**每个元素可点击（[ADR-035] D6）：** 每个渲染组包成 `<g data-role="cell" data-exchange data-path data-chapter="market_structure">`，复用既有的 `openCellOverlay` 事件委托（`Element.closest` 对 SVG 元素成立）。顺带给 `openCellOverlay` 加一节「结构化 Spec」（`<pre>` 展示 `env.spec` JSON），矩阵视图点开同一字段也受益。

**路由 / tab（[ADR-035] A「Phase 2 要改的」）：**
- `route()` 默认 `params.view` 从 `"matrix"` 改为 `"trading-day"`；`matrix` 改为显式分支，新增 `else renderTradingDay`。启动初始 hash、`index.html` 品牌链接同步改。
- **交易日平面图作为第一个 tab**（顺序：平面图 / 对比矩阵 / 时区甘特条 / 数据健康度）。[ADR-035] A「要改的」括注里把矩阵列在前是 Phase 0 时按旧顺序随手写的；这里以「默认首屏 = 平面图」为准——默认视图不做成第一个 tab 是 UX 反直觉。矩阵 / 时区 / 健康度三视图渲染逻辑一字未动，`#view=exchange` 档案页仍高亮矩阵 tab。
- 顶部「市场 Market」下拉（`data-role="td-exchange"`）切换交易所，写 `#view=trading-day&id=<id>`；无 `id` 时默认 `cn-sse`（干净的百分比墙样本，不过载）。

**非现货降级（[ADR-035] E）：** `price_limits.main_board.spec.reference === "prev_settlement"`（`de-eurex`）→ y 轴标签换「相对前结算价」+ 顶部 banner。检测到 `market_structure.derivatives` 子块有内容（10 家）→ 一行淡 banner「平面图显示现货，衍生品 spec 待 Phase 3」。**现货 / 衍生品切换开关未做**——`derivatives.*.spec` 尚无数据，留到 Phase 3。

**验证：** `node --check` 通过；`make build` 全绿、`docs/data/` 无 diff（未动数据）；Chrome headless 截图核对 `cn-sse`（百分比墙）/ `us-nyse`（动态 null 幽灵 + 三档熔断）/ `jp-jpx`（阶梯半透明带）/ `kr-krx`（±30 墙 + 三档熔断 + 波动走廊）/ `fr-euronext`（无时段退化）/ 深色模式（`cn-szse`）六种形态渲染正确；矩阵 / 时区 / 健康度视图无回归。

**打磨迭代（2026-08-30，同 Phase 2 窗口，PR #29）：** 落地上一段列的三个待打磨点 + 一轮 20 家全渲染巡检修出的问题——
① 线条视觉语言去重：涨跌停墙 = 红实线（`confidence != high` 转红虚线）；熔断触发线 = 红长虚线；动态带 = 蓝虚线；波动性中断走廊 = 灰细点线（原为橙色，与集合竞价块同色，已改）。图例补三条线样条目。
② `jp-jpx` 阶梯带：填充 `opacity` 0.13→0.08 + 加红短虚线边界线，读作「有边缘的近似区间」而非实心块。
③ 标注层 chips：定宽 176px + `min-height` 62px + `-webkit-line-clamp: 2` + `title` 挂完整值，长文本不再撑高；JS 侧去掉字符截断，交给 CSS。新增第 7 个 chip「波动性中断」（pct 全 null 的所此前该字段在平面上不可见）。
④ **`band_pct: null` / `limit_pct: null` 兜底不再画幽灵线**——线的位置无数据依据、且 `yR` 由熔断档位驱动时会与熔断线撞（`br-b3` / `us-nyse` / `ca-tsx` 实测），改为右上角 / 左上角一行文字角标。
⑤ **右缘标签叠字修复**：波动走廊 pct 与涨跌停 pct 相等时（`sa-tadawul` 均 ±10%）两个右缘标签重叠成乱码——波动走廊标签移到左侧内缘。
⑥ **跨所联动熔断**（[ADR-036] #6：`in-nse` 看 Nifty 50 或 BSE Sensex、`ca-tsx` 看 S&P 500 或 S&P/TSX）→ 平面中部加一行「熔断触发依据：X（本所）或 Y（bse）先触发者」。

**20 家巡检结论：** 全部 6 种价格限制形态（百分比 / 阶梯 / 动态有值 / 动态 null / 无 / 分档 null）、指数级 vs 个股级熔断、有 / 无午休、宽时段（`de-eurex` 01:00–22:00）、无钟点退化（`fr-euronext`）、深色模式均渲染正确，无 JS 报错。

**Phase 2 收口审查反馈（2026-08-30，用户「30 秒看懂」审查）——两点，已实装：**

1. **图例移到主图上方** —— `tdLegend()` 从 `svg` 之后移到之前，加边框卡片样式，成为读图前先看的说明条。

2. **中心留白 → 中心信息卡**（`tdHeadlineParts` + 平面中央 callout card）。审查指出主图中心大量空白、信息效率低。核心洞察：这张图的核心事实（**日内价格受什么约束**）此前全在边缘（墙线、熔断线、走廊），中心是空的。现在中心放一张 1–3 行卡片，把第五章三个字段综述成一句话：
   - 价格限制：`当日价格限制 ±10%（相对前收盘价）` / `阶梯值幅：涨跌幅随基准价分档` / `动态价格带 ±5%（随参考价滚动）` / `设动态价格带，档位官方未公布` / `无每日涨跌停墙` / `价格限制按品种 / 证券分类分档`
   - 熔断：`指数跌 7/13/20% 触发全市场熔断`（跨所联动时主语换成 `Nifty 50 或 BSE Sensex`，[ADR-036] #6 的信息并入此处，删掉原来单独一行的「熔断触发依据」note）/ `无全市场熔断` / `仅个股 / 合约级熔断`
   - 回转：`当日可回转（T+0）` / `T+1：当日买入次日才可卖` / `回转交易分品种不同`
   这对 `au-asx` / `hk-hkex` 这类「以没有涨跌停 / 熔断为特征」的市场尤其有用——空白的中心现在直接说出结论。
   连带：`band_pct: null` / `type: none` / 分档 null 三种「墙画不出」的情形不再单独在角落标注（中心卡已说明），`yR` 系数 1.3→1.15（墙贴近边缘、减少墙外空白），0 基准线加「0 = 前收盘价」标签。

**收口审查第二轮（2026-08-30）——三点，已实装：**

3. **x 轴时间坐标上下各一排** —— 时刻标签原来只在图下方，现在图上方也加一排（`PT` 从 46 增到 62 腾出空间，标题上移到 `PT−40`、时刻上排 `PT−16`）。
4. **x 轴网格恒 30 分钟** —— 原 `xStep = span>300min ? 60 : 30`，改为网格线恒 30 分钟；**标签**跨度 >10h（如 `de-eurex` 01:00–22:00）时降为每 60 分钟贴标，避免叠字（`xLabelEvery`）。
5. **个股 / 合约级熔断展开具体机制** —— 审查指出「个股级」这个分类标签本身不说明任何东西。现在：`circuit_breaker` chip 对 `stock_level` / `contract_level` 直接展示 `spec.note`（机制描述，如 hk-hkex「VCM 5 分钟冷静期不停牌」、jp-jpx「特別気配控幅」、za-jse「波动性拍卖冷静期」），2 行截断 + `title` 挂全文；中心卡的熔断行也从泛泛的「仅个股 / 合约级熔断」改为「无全市场熔断；靠个股 / 品种级波动中断（见下方「熔断」）」/「…合约级波动中断可扩至全合约暂停」。`index_level` / `none` 的 chip 维持枚举标签（档位在中心卡与平面线上）。chip 宽度从定宽 176px 放宽为 `min 148 / max 264`（高度仍靠 `min-height` + 2 行截断保持齐平），让机制描述有空间。

**收口审查第三轮（2026-08-30）——主图补 tick size / 费用 / 特殊规则，已实装：**

6. 标注层 chips 从「只有第五章 7 个」扩为**两组**：
   - **交易机制**（原 7 个）：价格限制类型 / 熔断 / 撮合原则 / 订单类型 / 做空 / 做市商 / 波动性中断
   - **交易细则 · 成本**（新 6 个，跨章）：最小报价单位（`market_structure.tick_size`）/ 最小交易单位（`board_lot_size`）/ 交收周期（`clearing.settlement_cycle`，enum）/ 佣金（`costs.commission_structure`）/ 印花税 or 金融交易税（`costs.stamp_duty` 优先，其次 `financial_transaction_tax`，都无则「无 / 未见征收」）/ 跨境 · 互联互通（`market_structure.connect_schemes`，仅在有值时出）
   `chip()` 加 `chapter` 参数，`openCellOverlay` 本就按 `data-chapter` 取值，跨章浮层直接可用。未填字段照常显示「—」+ 虚线（诚实呈现数据缺口，与既有 chip 行为一致；`us-nyse`/`uk-lse` 的 tick / lot / 佣金 目前是真空）。
   `tdBuild` / `tdSidePanels` 签名从 `(id, ms)` 改为 `(id, data)` 以拿到跨章数据。

**未完（Phase 2 的验收 gate，不是本条范围）：** [ADR-035] A 收尾要求「交付后停下评估『30 秒看懂』由非专业读者实测」——**该实测尚未进行**，是 Phase 3 启动前的门槛。

**补记（2026-08-30，[ADR-042] 同批）——主视图更名「交易日平面图」→「市场机制剖面」：** 用户指出旧名「只描述形式（一张 2D 平面图 / floor-plan），不反映所呈现信息的内核」。内核是**一个市场的交易机制**（第五章 spec：撮合模型 / 涨跌停 / 熔断 / 波动走廊 / 时段 / 订单类型 / tick / 成本…），用一个交易日的时间轴作画布。「剖面」取「结构性横切、非某一具体交易日的行情数据」之意（图上没有真实价格路径，只有机制画出的边界）。斟酌过的备选：「交易日剖面图」（保留「交易日」锚点、但内核仍偏时间轴）、「市场机制全景图」（「全景」偏营销、弱化「一日」框架）、「交易机制图谱」（「图谱」偏关系网络，此图非此义）——取「市场机制剖面」：内核（机制）在前，「剖面」修正旧名的形式偏差，6 字无「图」与同级 tab（对比矩阵 / 时区甘特条 / 数据健康度）齐整。**改动面**：`docs/index.html` tab（中「市场机制剖面」/ 英「Market Mechanics」）、`app.js` 3 处显示串（标题 / aria-label / 加载态 / prose / banner）、`styles.css` 注释。**未改**：路由键 `#view=trading-day`（URL 兼容，内部标识非用户可见）、CSS 类名 `td-*`、历史 ADR 正文（[ADR-035]/[ADR-039] 等仍称「交易日平面图」为当时名，本补记为唯一更名锚点）。

**日期：** 2026-08-30

### ADR-041 — 广度扩张（新增交易所，原 Wave 3 / Phase 4）从计划阶段改为按需可选能力

**背景：** v1.0 把交易所做到 20 家后，[ADR-028] 定「深度优先」、Wave 3 暂缓；v2.0 转向后 Wave 3 挂在 `ROADMAP.md` 作 `Phase 4 · Wave 3 广度扩张（搁置）`，写「Phase 1–2 稳定后解冻」，隐含「迟早会做、是既定路线的一环」。用户重新定调：**继续新增交易所不再是既定路线上的一个阶段，改为一项按需可选能力——只在用户主动要求时执行，agent 不再主动规划、提议或启动新增交易所。**

**为什么改：**
1. 20 家已覆盖四大区域主要市场，且有现货 / 纯衍生品 / 联邦制三类结构样本，"广度不够"已不是当前主要短板；v2.0 的价值增量在可视化与既有 20 家的深度（Phase 2–3），不在再堆交易所数量。
2. "搁置但迟早解冻"的措辞会让不带记忆的新会话把开 Wave 3 当成"待办的既定下一步"，可能在深度 / 可视化工作之间主动插入一次广度扩张——与用户实际优先级相反。
3. 新增交易所本就是高成本、强依赖用户在场的动作（[ADR-017]：一波 6–8 个并行子代理 + 逐家抽检回写；[CLAUDE.md 四]：每家要用户人工抽检 10 字段验收）——做成"用户触发"名实相符。

**定了什么：**
1. **`add-exchange` skill 与其十一章完整工作流程原样保留**，不删不改（除下述一句触发限定提示）。它是这项可选能力的实现载体，不是被废弃的东西——用户日后想加哪家，`/add-exchange` 或口头要求即可，流程即刻可用。
2. **`ROADMAP.md` 的 `Phase 4 · Wave 3` 条目从"搁置中的计划阶段"改写为"按需可选能力"**：不再带 `- [ ]` 进度框、不再排进 Phase 序列、不再写"解冻条件"。v2.0 的 Phase 序列到 Phase 3 为止。
3. **agent 行为约束：不主动提议、规划或启动新增交易所。** 含不在给用户的下一步任务建议里列「开 Wave 3 / 加某家交易所」，除非用户先明确提出。用户主动要求后，按 [ADR-017] 模式正常执行，不受本条限制。
4. **[ADR-036] 里以"Phase 4（Wave 3）"为触发条件的 schema 裁定（#1 `federation_of`、#2 `region` 拆分、#9 `rule_level`）继续有效**，触发语义改为"当用户触发的某次新增交易所满足该条件时"，不再绑定"Phase 4"这个不会到来的阶段名。这些 ADR 正文不逐条改写，本条统一说明。

**没改什么：** `CLAUDE.md`（本决策属 scope / roadmap，非防幻觉铁律，按职责边界表不进宪法）；`README.md`「覆盖范围」（生成块，随数据变）；已有 20 家数据；`add-exchange` 的任何执行步骤。

**日期：** 2026-08-30

### ADR-042 — schema 对齐资深交易员心智模型：第五章补三字段 + 四个 spec 形状 + 覆盖边界显式化

**背景：** 一位资深交易员（对照 Larry Harris《Trading and Exchanges》）总结了「交易员首次接触一个陌生市场需要知道什么」的清单，用户要求据此审查项目目标与架构。逐条比对结论：v2.0 的「交易日平面图」范式（[ADR-035]）与这份清单高度一致——清单里「写进规则、可查证」的主干（时段 / 撮合 / 涨跌停 / 熔断 / 波动中断 / 卖空 / 结算）已是 schema 的一等公民。但有三个交易员点名、明确「写进交易所规则手册、可查证」的维度当前**完全没有字段**，另有两处「字段在但没结构化」，还有一处是项目边界正确但从未写明。本条只做 schema / spec / 文档改动，**数据回填并入 Phase 3**（每章一次小型 spec 补充的既有节奏，不单开 Wave）。

**逐项：**

1. **`market_structure.execution_model`（新增，enum）** —— 市场组织的基本形态：订单驱动 / 报价驱动 / 混合 / 经纪撮合。交易员判断陌生市场结构的第一问，此前只能从 `matching_principle` + `market_maker_scheme` + `trading_system_name` 间接拼。`enums.yml` 加 `execution_model` 4 值词表；`matching_principle` 明确为「订单驱动模型内部的优先级细化」，两者不同层次、不重复。口头 vs 电子喊价的差异写 `detail`（20 家样本已基本全电子，不单开枚举维度）。**暂不标 `in_matrix`**——按 [ADR-014]/[ADR-022] 的纪律，覆盖率不足 16/20 时进矩阵只会得到一整列「—」，误读成「数据没填全」。Phase 3 回填达门槛后再加 `in_matrix: trading_mechanism`（`in_matrix` 是纯声明式标记，[ADR-011]，届时改动风险为零）。

2. **`market_structure.error_trade_rule`（新增，散文 + spec）** —— 「明显错误」/ 误发注 / clearly-erroneous 成交的事后处置：可否作废、复核时限、价格偏离阈值、作废还是调价。交易员点名的「交易所正式制度」，且跨所差异实打实（日本「成交不可作废」出了名的严 vs 美国 clearly-erroneous 复核窗口 vs Xetra mistrade 阈值）。此前全项目无字段——仅 `au-asx` 衍生品 `circuit_breaker` 里偶带一句 ETR 复核。与 `trading_halt_mechanism`（盘中停牌 / 复牌）视角不同，不合并。归第五章而非第十二章（风险）：它是交易机制的一部分，且平面图的 chip 层能直接承接。

3. **`market_structure.order_book_transparency`（新增，散文）** —— 盘前透明度（订单簿公开程度 + 是否支持冰山 / 隐藏限价单）+ 盘后成交披露与延迟。交易员要点 3「信息机制与透明度」里「订单簿公开程度」「是否允许提交不披露的限价指令」当前无正面字段，只有 `dark_pool`（独立暗池实体）和第十章 `market_data_levels`（行情层级）两个侧面。三者职责重新划清并互相指向：本字段管「本所订单簿内部的（非）展示流动性」，`dark_pool` 收窄为「与本所并列的独立暗池 / MTF」，行情层级 / 收费留第十章。`regulation.disclosure_requirements` 是**发行人**披露，与本字段无关。

4. **四个 `spec` 形状（`schema/spec.yml`）** —— `execution_model`（`electronic` / `dealer_intermediated` 布尔）、`error_trade_rule`（`bust_allowed` / `review_window_min` / `deviation_threshold_pct` / `resolution`）、`order_types`（标准指令类型布尔位 + `tif` 列表：day/gtc/gtd/fok/ioc）、`tick_size`（`regime` + `min_tick` + 可选 `ladder`，仿 `price_limits.main_board` 的「锚点 + full_table_note」先例，不强求 MiFID II 式完整表）。`order_types` / `tick_size` 本就是字段、只是自由文本进不了平面图量化层，加 spec 让它们与 v2.0 方向一致（校验 5b 严查 spec 数值 ⊆ quote）。`short_selling.spec` 加可选 `margin_note` 键承接「卖空保证金」（交易员要点 4a），不值得为它单开字段。

5. **覆盖边界显式化（`README.md` + `CLAUDE.md`）** —— 交易员清单第二部分「执行风险 / 市场冲击 / 真实流动性 / 价格聚簇」明确只能靠小额实盘测试暴露，项目其实**已按防幻觉铁律事实上排除**（[ADR-020] §4 记录 `liquidity_risk_note` / `implicit_costs_note` / `political_risk_note` 结构性只能 low/medium），但 `README` / `CLAUDE.md` 从没把这条边界写明，导致新会话反复尝试用第三方推断去填这些字段（`OPEN-QUESTIONS` 里多条 `*_risk_note` 悬案是同一根因）。`README`「这是什么」顺带从「一张对比矩阵」（v2.0 前的旧定位）改为以平面图为主。`CLAUDE.md` 补一句写进开篇项目定位——**这一条是对项目范围的澄清、不是新增铁律**，按职责边界表属「对外定位」（README）与「项目是什么」（CLAUDE 开篇），不进第二节五条铁律。

**不做：** ①「交易定价规则」（连续竞价价格歧视 vs 集合竞价统一价）单独字段——已被 `opening/closing_mechanism`(call_auction) + `matching_principle`(pro-rata) 隐含，且近乎普适微观结构，加字段是噪声。②「官方市场数据产品去匿名化」（北欧部分交易所）单独字段——太细，`market_data_levels.detail` 足够。③ 新字段暂不镜像进 `market_structure.derivatives` 子块——`error_trade_rule` / `execution_model` 对衍生品同样适用，但 derivatives 子块字段集是 [ADR-019] 精心裁剪的、且已填 10 家（镜像 = 每家多 2 个空缺口）；Phase 3 回填时若发现衍生品线的这两项与现货线实质不同，再按 [ADR-019]/[ADR-030] 先例加镜像字段。

**验证：** 只加 taxonomy 字段 + enums 词表 + spec 形状，不动任何 `data/`。`make build` 全绿：validate 0 错误 0 警告、verify_quotes FAIL=0、`node --check app.js` 通过。生成块变动**仅一处且符合预期**——`progress-matrix` 里 `za-jse` 第五章 ✅→🟡：该所此前是 20 家里唯一第五章填满的（`filled == total`），新增 3 个空字段后 `count_chapter_leaves` 分母 +3、`filled < total` → 🟡；其余 19 家本就 🟡（`filled < total`），不变。这三个字段对现货所普遍适用，**不加 `optional` 标记**（`optional` 是给「仅部分所有的产品线」用的，见 [ADR-020]），🟡 如实反映「第五章还有未坐实字段」是正确状态。`health-summary` / `auto-issues` / `exchange-list` 零变化；`docs/data/*.json` 每家 +3 个 `null` 叶子（构建产物，随 schema 走）。`in_matrix` 未新增，矩阵列不变。

**关联的前端改动（同一 PR）：** 主视图「交易日平面图」更名为「**市场机制剖面**」（用户指出旧名只描述形式不反映内核）——见 [ADR-040] 补记。

**日期：** 2026-08-30

### ADR-043 — Phase 3 首棒：[ADR-042] 第五章三字段 + 四个 spec 形状的 20 家回填

**做了什么：** 把 [ADR-042] 只落了 schema / spec / 文档骨架的三个新字段（`execution_model` / `error_trade_rule` / `order_book_transparency`）与四个 spec 形状（`execution_model` / `error_trade_rule` / `order_types` / `tick_size`）在全 20 家交易所回填到位。`execution_model` 覆盖率 20/20 达 [ADR-022] 门槛后，`taxonomy.yml` 给它加 `in_matrix: trading_mechanism`。**只动 `data/` + `schema/taxonomy.yml`（一处 `in_matrix`）+ `PROJECT/`（SOURCES / OPEN-QUESTIONS）+ 生成产物，不动前端、不动 `spec.yml` 形状定义。**

**执行方式——偏离 [ADR-017] 并行子代理，改协调者串行：** 首次尝试按 [ADR-042] 计划派 7 个并行子代理（Wave 1），**7 路并发瞬间打爆账号 session limit（HTTP 429），7 个子代理全部提前终止、零产出**。改为协调者一家一家串行：读官方规则手册 → 派生 `execution_model`、实抓 `error_trade_rule` / `order_book_transparency`、从既有 quote 结构化 `order_types` / `tick_size` spec → 单文件 `validate` → 提交 → 下一家。共 20 个 commit（每家一个）+ 3 个收尾 commit。串行在后台任务里比并行更稳：单条 API 流、可控、每家即时校验即时提交，session limit 风险归零。

**`execution_model` 判定结果（10 order_driven / 10 hybrid，无 quote_driven / brokered）：**
- **hybrid**（做市商有合同义务、承担点差 / 持续报价约束、实质参与价格形成）：`us-nyse`（DMM）、`us-nasdaq`（竞争性注册做市商）、`uk-lse`（订单驱动 + 报价驱动双轨）、`de-xetra`（Designated Sponsor）、`de-eurex`（受监管做市商，期权强制）、`ch-six`（书面 Market Maker Agreement）、`ca-tsx`（Market Maker Firm）、`sa-tadawul`（CMA《做市商规则》）、`fr-euronext`（多类流动性提供者 + 零售流动性厂商）、`br-b3`（三类注册做市商）。
- **order_driven**（纯中央订单簿；做市仅激励型或限 ETF / 结构性产品 / SME 等产品线，不改变市场基本形态）：`jp-jpx`、`hk-hkex`、`cn-sse`、`cn-szse`、`tw-twse`、`kr-krx`、`sg-sgx`、`au-asx`、`za-jse`、`in-nse`。
- 判定统一从既有 `matching_principle` + `market_maker_scheme` 的已核实 quote 派生（同 [ADR-038] 把 `matching_principle` 转 enum 的先例），`detail` 写推理链。8 家标 `medium`（做市商 quote 撑得住 enum、但「hybrid vs order_driven」是综合判断），12 家 `high`。

**`error_trade_rule` 谱系（跨所差异如 [ADR-042] 预期，是这次回填最有价值的发现）：**
- **阈值 + 时限复核制**：`us-nyse`（Rule 7.10，30 分钟、10/5/3% 分档、LULD 内不可复核、只作废不调价）、`us-nasdaq`（Rule 11890，同框架）、`de-xetra`（FWB Mistrade §24/§27，两交易小时、分板块 %+€ 双条件）、`de-eurex`（Conditions 2.9，30 分钟、Mistrade Ranges 逐产品公布、期权可价格修正）、`au-asx`（Procedure 3200/3210，30 分钟、NCR/QCR/ETR 三段、ETR 内 ASX 单方作废、阈值按价格分档）、`br-b3`（10 分钟电话 + BRL 10M 损失门槛 + 20% 罚款）、`in-nse`（Trade Annulment：30 分钟、Rs 10 Cr 订单门槛、须在价格带外、对手方须接受）。
- **纯裁量 / 双边合意制**：`uk-lse`（Rule 2120–2121，manifestly erroneous + contra-first + £100k/£200k 损失门槛，交易所决定终局）、`sg-sgx`（Rule 11.4，无 % 阈值、综合多因素裁量、SGX 决定不受复议）、`ch-six`（Directive 3 §23.2.1，双方申请、信息一致才作废、次一交易日窗口）、`ca-tsx`（§6.8：双边合意 + CIRO 裁决，技术故障可单方作废）、`fr-euronext`（Rule 4403/3：manifest material error 依职权 + aberrant price / 对手方合意）。
- **成交近乎终局，无常规作废流程**：`jp-jpx`（TSE Rule 13，仅『交收极难 + 市场可能混乱』的窄口径例外，resolution=`no_bust`，日本以此著称）、`hk-hkex`（SEHK Rule 567，证券市场自动对盘成交为终局，无常规错误交易流程；HKATS 期货另有 10 分钟窗口 Error Trade Rule）、`tw-twse`（营业细则第 87 条，经纪商错单进『错帐处理专户』自行平仓、原成交不撤销，resolution=`no_bust`）、`cn-sse` / `cn-szse`（交易规则 3.5.5 / 3.4.5，成交即生效、买卖双方必须承认；仅不可抗力 / 系统被侵入 / 显失公平等窄口径可认定无效）。
- `kr-krx` 标 `low`：KRX Business Regulation 主要为韩文、英文栏目为 JS 壳，误单救济制度存在（源于 2013 HanMag 事件）但具体门槛未从一手英文核实，转 OPEN-QUESTIONS。`sa-tadawul` 标 `medium`：官方《Trading Procedures》无成交后作废专章，事前控制有据。

**`tick_size` spec 的三种来源路径：**
- 美股两家走 **17 CFR 242.612（eCFR versioner API 直取 XML）**：2025-11-03 起两档制（$0.005 / $0.01 按 TWAQS ≤/> $0.015，$1 以下 $0.0001）。
- 欧洲三家（`uk-lse` / `de-xetra` / `fr-euronext`）走 **MiFID II RTS 11（Commission Delegated Regulation (EU) 2017/588，legislation.gov.uk）**：价格 × 日均成交笔数二维表，`regime: tiered_by_price_and_liquidity`，`min_tick: null`。三家共用同一份技术标准（英国脱欧后自留）。
- 其余按各所自有表结构化 `ladder`：`jp-jpx` 呼値 11 档、`hk-hkex` 上落价位表 12 档（含 2025–26 分阶段下调）、`sa-tadawul` 6 档、`tw-twse` 6 档、`kr-krx` KOSPI/KOSDAQ 分表、`au-asx` Price Steps 3 档（以澳分记 spec 避开 5b 单位歧义）、`ca-tsx` $0.005/$0.01 两档、`sg-sgx` 3 档、`za-jse` uniform 1 分、`cn-sse`/`cn-szse` per-instrument（按证券类型）、`de-eurex`/`br-b3` per-instrument（无统一表，`min_tick: null` + `full_table_note` 指向合约规格 / 门户）。

**5b 校验（spec 数值逐字 ⊆ quote）踩到的坑，回写 SKILL：**
- **单位不一致**：官方表以「分 / cents」列示、spec 想用「元 / dollars」→ 十进制值对不上（`au-asx` 澳分表、`tw-twse` 官方英译用「5 cents」而非「0.05」）。对策：spec 直接用官方表的单位（`currency: AUD_cents`），或 ladder 留 null 用 `full_table_note` 散文。
- **欧陆逗号小数**：RTS 11 原文「0,01」，validate 5b 做 `quote.replace(",","")` → 「001」，与 spec 的 repr「0.01」不匹配 → 这类表一律 `min_tick: null` + 散文 note，不放数值 ladder（SIX 用句点小数，可放 ladder，是例外）。
- **规则 / 条款号进 zh/en**：`NUMBER_RE` 把「Rule 4403」「RTS 11」「§ 87」里的数字当反查目标，在 quote 里找不到就 fail。对策：条款号只写进 `detail` / `note` / `sources` title，不写进 `zh` / `en` 正文。
- **flow-mapping spec 里的长字符串**：`spec: {a: b, note: "很长…含半角逗号…"}` PyYAML 偶发 parse error；长 note 用块式 `spec:` 换行写。

**质量关：**
- `validate.py`：20 家，0 错误 0 警告。
- `verify_quotes.py`（离线，逐字反查 `.cache` 落盘来源）：**OK 1027 → 1071（+44 个新增 `confidence: high` 字段全部通过），FAIL=0，CACHE_MISS=0**。协调者用 `fetch_sources.py` 把新引用的 sec.gov 规则申请、eCFR versioner XML、legislation.gov.uk、各所规则手册 PDF 等落盘（+21 个 URL）。
- 手工语义抽检：8 家 × 2 字段（`enum` / `spec` 与 `quote` 语义一致性），全部通过。
- 全库已填字段 1770 → 1844（+74）；0 个超复核阈值。生成块变动：`progress-matrix` 里 `za-jse` 第五章 🟡→✅（[ADR-042] 加的 3 空字段本次填满，回到「唯一填满第五章」），`matrix.json` 加 `execution_model` 列，`health-summary` +74。

**新增第三方来源登记（`PROJECT/SOURCES.md`，均按 CLAUDE.md 二.3 封顶 `medium`）：** `archives.nseindia.com`（NSE 官方文档归档子域，一手）、`ricago.com`（compliance-tech 公司逐字转载 NSEIL Consolidated Circular，用于 `in-nse.error_trade_rule`——NSE 一手页面为 JS 壳）、`business-standard.com`（印度财经日报，用于 `in-nse.tick_size` 数值转述）。

**遗留（已进 OPEN-QUESTIONS）：** `kr-krx` error_trade_rule / order_book_transparency（`low`，待官方英文规则）、`sa-tadawul` error_trade_rule（`medium`）/ order_book_transparency（`low`）、`in-nse` 多字段（`medium`，一手页面 JS 壳）、`br-b3` order_book_transparency（`medium`，手册未提非展示订单类型）。

**下一步（Phase 3 后续）：** 其余章节可视化——成本瀑布 → 交割管线 → 上市生命周期 → 监管图 → 参与者 → 风险旗标，每章带一次小型 spec 补充（见 `ROADMAP.md` Phase 3 条目）。

**日期：** 2026-08-30

### ADR-044 — 修复：`.cache` 被误提交为符号链接，导致 `git pull` 静默抹掉本地来源快照

**现象：** ADR-043 收尾的 `4fc61db`（PR #35 内）在 `data/exchanges/us-nyse.yml` 那次提交里顺带 `git add` 进了一个 `.cache` **符号链接**（指向 `/Users/hrche/dev/exchange-atlas/.cache`，即协调者在 worktree 里为复用主 checkout 的来源缓存手建、却没排除掉的软链）。commit body 未提及，属误提交。后果分两层：

1. **任何 checkout 都会长出这个软链。** 在主 checkout 里它指向自己（自引用软链，`ELOOP`）；`fetch_sources.py` / `verify_quotes.py` 的 `CACHE = ROOT / ".cache"` 全部失效。
2. **`git pull` 会为放置该 tracked 软链而静默删除被 `.gitignore` 忽略的 `.cache/` 目录。** `.gitignore` 当时写的是 `.cache/`（带斜杠，只匹配目录不匹配同名软链），git checkout 遇到「要放一个 tracked 软链、位置上却有个被忽略的目录」时不会报错，直接抹掉忽略目录 —— 本地 1071 个来源快照（verbatim-quote 离线反查的凭据基）就此丢失，`verify_quotes` 从 `OK=1071` 跌到 `OK=0 / CACHE_MISS=1071`（信息性、不阻断构建，但校验网失明）。

**修复：**
- `git rm --cached .cache` + 删除磁盘上的软链。
- `.gitignore`：`.cache/` → `.cache`（去掉斜杠，同时挡住目录、目录内容、以及误建的同名软链）。
- `.cache/` 内容按项目设计本就不入库、可由 `python3 tools/fetch_sources.py` 全量重建（见 [ADR-032]）；本次丢失的 1071 份快照通过重跑该脚本恢复，`data/` 未受影响、数据可信度不变（ADR-043 已验过 `FAIL=0`）。

**教训（已回写）：**
- `.claude/skills/add-exchange/SKILL.md`：worktree 里若为复用主 checkout 缓存手建 `.cache` 软链，务必确认它在 `.gitignore` 覆盖内、绝不 `git add`；提交前 `git status` 看一眼有没有 `.cache` 冒出来。
- `PROJECT/SOURCES.md`：记「`git pull` 会静默删除被忽略、但位置上要放 tracked 文件的目录」这一 git 行为，避免再次误判缓存丢失原因。

**日期：** 2026-08-30

### ADR-045 — Phase 3 第二棒：成本瀑布的 spec 形状 + 20 家数据层回填（渲染层留交互式迭代）

**背景 / 四个设计轴（2026-08-30 用户 Q&A 定案）：** 市场机制剖面目前只有一个「印花税/交易税」chip，交易员看不到一笔往返交易被抽走多少、抽在哪几层。第十一章 9 个字段全是散文、`spec` 层为零。用 AskUserQuestion 定死四轴：

1. **费种范围**：6 个「按笔显性成本」字段进瀑布条 —— `commission_structure` / `exchange_fees` / `clearing_fees` / `regulatory_fees` / `stamp_duty` / `financial_transaction_tax`。`capital_gains_tax` / `dividend_withholding_tax` 不是按笔成本，前端作「退出/持有税」注解另列，无 spec。隐性成本（买卖价差）按 CLAUDE.md 覆盖边界不收。
2. **买卖不对称**：镜像双瀑布（买入侧 / 卖出侧各一条，底部各一小计 + 往返合计）。`side: buy/sell/both` 键承接（英股 SDRT 仅买方、A 股印花税仅卖方、港股双边、美股无）。
3. **计量口径**：全部归一到「bp of 成交额」在**渲染层**做；`spec` 只存 quote 逐字撑得住的**原始值 + 单位**（`unit`: pct/permille/bp/per_share/per_lakh/per_crore/per_million/flat_*）。定额费 / 按股费按图上标注的假设成交额换算，脚注写明假设。
4. **放置**：新增顶层 tab「成本瀑布 / Costs」。⚠️ Phase 3 后面还有 5 个章节可视化，全做顶层 tab 会到 10 个 —— 届时可能收拢成子导航，本棒先按顶层 tab 落地。

**spec 形状（`schema/spec.yml` 新增 `costs.*` 共用 `cost_layer`）：** `rate`（number 或 null）/ `unit` / `currency` / `side` / `cap` + `cap_scope` / `floor` / `components`（多项分征费如 hk SFC+AFRC，逐项 name+rate，渲染层求和）/ `tiered`（按量/价分档，rate 取代表档）/ `type: none`（本市场不征该费种 —— 是关键事实不是空缺）/ `note`。三态同 [ADR-035] D：`rate: null`=费种存在但未摘引数值（幽灵条）、`type: none`=明确不征、键缺省=尚未填。

**回填结果（协调者串行，3 个 commit，未并行——[ADR-043] 教训）：** 全 20 家共 **103 个 costs spec**。
- **实体费率 bp 化**（`exchange_fees` / `clearing_fees` 多数、`regulatory_fees` 部分）：hk 0.00565%/0.0042%、cn-szse 经手费 0.0341‰、in-nse Rs 2.97/lakh、uk 0.45 bp（月封顶 £15,000）、ch 清算 CHF 0.80/settlement、au 清算 0.225 bp、sa 0.009%/0.005%/0.030%、de-xetra 清算 0.08 bp（€4 封顶）…
- **多项分征费 `components`**：hk `regulatory_fees`（SFC 0.0027% + AFRC 0.00015%）、us-nyse/nasdaq `clearing_fees`（NSCC value-into/out-of-net per_million）、br-b3 `clearing_fees`（CCP + asset transfer）。
- **`type: none`**（关键事实）：澳/加/巴/沙 `stamp_duty` + `financial_transaction_tax`、日 FTT（1999 废止）、德 印花税（1991 废止）、新 印花税（CDP 电子过户豁免）、多国 `regulatory_fees`（无按笔监管费）。
- **`rate: null` 幽灵条**：所有 `commission_structure`（市场化议价，20/20 无统一费率）、maker-taker 所的 `exchange_fees`（us-nyse/nasdaq——quote 只含挂单返佣）、`tw-twse` 税/费（quote 为国字数字「千分之三」）、`za-jse` STT（quote 逗号小数「0,25%」）—— 后两类是 [ADR-039]「非阿拉伯数字 quote 不放数值 spec」纪律的一致处理。
- **衍生品所**：`de-eurex` 成本按合约计、费率未摘引 → 多为 `rate: null` / `type: none`，瀑布近空（符合 [ADR-035] E 非现货降级）。

**质量关：** `validate` 20 家 0/0（5b 逐字反查：44 个 `confidence: high` 且带数值的 spec 全部命中 quote）。`verify_quotes` FAIL=0（未动任何 quote / zh，只加 spec 键）。全库已填字段随 spec 增加。生成块无变化（`spec` 不进 progress-matrix / matrix.json）。

**未做（本棒不含，留交互式会话按 Phase 2 节奏迭代）：** `docs/assets/app.js` 的 `renderCostWaterfall`（镜像双瀑布 SVG）+ 顶层 tab + 路由 + `index.html` tab + 假设成交额脚注 + 税注解摆位。渲染器要几轮视觉对齐，不宜后台任务单方面定死。

**日期：** 2026-08-30

### ADR-046 — 删除 `tier`（标杆批次）身份字段：交易所加入先后不是读者需要的信息

**背景：** `exchange_identity` 有个 `tier` 字段（`标杆批次` / Tier，枚举 `pilot` 首批标杆 / `standard` 标杆扩展 / `extended` 横向铺开），记的是每家交易所是在哪一轮铺开里建档的。用户判定这是无效信息——读者要看懂一个市场的交易机制，"这家是第几批加进来的"没有任何价值，反而占着一个身份字段和 README 的一列。前端早在 [ADR-025] 就把"标杆批次 Tier"筛选框从矩阵工具栏删了（20 家规模下地区筛选已够用），此后 `tier` 只剩 README「批次」列和站点 `manifest.json` 两处出口，是纯粹的历史包袱。

**决定：** 整字段删除，连同全部 surface：
- `schema/enums.yml`：删 `tier:` 词表；`schema/taxonomy.yml`：删 `exchange_identity` 里的 `tier` 字段定义 + 文件头注释里的「标杆批次」。
- `data/exchanges/*.yml`：20 家逐一删 `tier:` 行。
- `tools/sync.py`：`REQUIRED_IDENTITY_FIELDS` 去掉 `tier`；`build_enum_label_maps` 去掉 `tier` 映射；`render_exchange_list` 去掉「批次」列（README 表回到 `ID | 名称 | 地区` 三列）。
- `.claude/skills/add-exchange/SKILL.md`：填写步骤「确定 `region`、`tier`」改为「确定 `region`」。
- `make sync` 重新生成：`README.md` exchange-list、`docs/data/{_schema,enums,manifest}.json` + 20 份 `docs/data/exchanges/*.json`。

**未动（用户明确选最窄范围，见当次 AskUserQuestion）：** `PROJECT/ROADMAP.md` 里 v1.0 Wave 1 / Wave 2、v1.1 Batch 1–3 的进度日志；本文件里 [ADR-016]（候选清单与分波依据）/[ADR-017]/[ADR-021]/[ADR-025] 等提到 Wave/Batch 的历史 ADR；`schema/glossary.yml` +（生成的）`PROJECT/GLOSSARY.md` 里"违约处置瀑布"词条的"v1.1 Batch 1 并行补全时被两个子代理各自造词"说明。理由：这些是"当时怎么把数据建起来的"工作日志，不是挂在交易所记录上的分类元数据；改写不可变的 ADR 与 CLAUDE.md 第一节的文档纪律冲突。[ADR-016] 里"按 Tier 分波"作为历史决策仍然成立，只是它当初落地成的 `tier` 枚举现在没了。

**验证：** `make check` → `validate` 20 家 0 警告 0 错误；`verify_quotes` FAIL=0（未动任何 `quote`/`zh`/`spec`，只删身份字段）；`make sync` 后 `git diff` 生成块与重算一致。（worktree 内 `.cache/` 未重建，`verify_quotes` 显示 `OK=0 / CACHE_MISS≈1071`，属 [ADR-044] 已知信息性状态，非本次回归。）

**日期：** 2026-08-30

### ADR-047 — 成本瀑布渲染层首版：镜像双瀑布 SVG + 顶层 tab

**背景：** [ADR-045] 已把第十一章 6 费种的 `spec` 层（`cost_layer` 形状）在 20 家全部回填，渲染层按当时判断留交互式会话做。用户此后明确要求推进首版实现；本条记首版落地的形态与取舍，后续视觉迭代仍走交互式会话。

**定了什么（`docs/assets/app.js` `renderCostWaterfall` / `cwBuild` + `docs/index.html` 新 tab + `styles.css` `.cw-*`，仅前端三文件，`docs/data/` 零 diff）：**

1. **顶层 tab「交易成本瀑布 / Cost Waterfall」**，路由键 `cost-waterfall`，排在「市场机制剖面」之后。市场下拉与「市场机制剖面」同构（`data-role="cw-exchange"` → `setHash({view,id})`）。默认市场 `hk-hkex`（6 费种里 5 种有实体费率、印花税双边、监管费多项分征——首屏信息最全）。
2. **镜像双瀑布**：中轴 = 0 bp，左半买入侧、右半卖出侧。6 费种逐行，`spec.side`（buy/sell/both）决定条落哪侧；单边费种的另一侧画灰虚线示意「此侧不征」。底部「合计」行 = 各侧小计，标题下副标 = 单边 buy/sell bp + 往返合计 bp（≥1 bp 才附 %）。
3. **归一到 bp of 成交额（渲染层做，[ADR-045] 轴③）：** `cwToBp(spec)` 按 `unit` 换算——`pct`×100 / `permille`×10 / `bp`×1 / `per_lakh`÷10 / `per_crore`÷1000 / `per_million`÷100 直接换；`per_share` 按「假设股价 50」、`flat_*` 按「假设单笔成交额 100,000」换（标 `≈`，脚注写明假设）。`components` 求和；`tiered` 取 `rate` 首档（标 `▸`）；`cap` 记入 tooltip、bp 不扣封顶（标 `^`）。
4. **诚实三态（同 [ADR-035] D）：** `rate` 有值 → 实心条 + bp 数；`rate: null` → 斜纹幽灵条 +「议价/未披露」；`type: none` → 中轴细线 +「不征收 / 不适用」；费种无 `spec` → 「未结构化」。全 20 家 buy/sell 均为 0（jp-jpx / de-eurex）时副标改为「未摘引到可折算为 bp 的费率」。
5. **持有 / 退出税另列**（[ADR-045] 轴①）：`capital_gains_tax` / `dividend_withholding_tax` 无 `spec`，作图下方两行文本（`.cw-tax-line`，可点开出处），标题「持有 / 退出税（非按笔成本，另计）」。
6. **点击任意条 / 税行**复用 `openCellOverlay`（`data-chapter="costs"`，path 用裸字段名如 `stamp_duty`——与 `tdSidePanels` 的 costs chip 一致）。
7. **`de-eurex` 淡 banner**：`price_limits.main_board.spec.reference === "prev_settlement"` → 「费用多按合约计，bp 折算仅供参考」。

**为什么这样：** 镜像布局把「单边税一眼可见」做成主信息（英股 50 bp 仅买、A股/韩国仅卖、港股双边、美股 SEC 费仅卖——4 种形态在 4 张图上立刻区分）。bp 归一让不同计量口径（%/‰/bp/每股/每十万/定额）可比。三态渲染避免把「市场化议价的佣金」画成 0 或留白误导。手写 SVG、零依赖，与 `renderTradingDay` 同套路（[ADR-035] C）。

**验证：** `node -c` 通过；`make build` 全绿（validate 0/0、verify_quotes FAIL=0、生成块无 diff）。Chrome headless 截图核对 13 家 × 明暗两主题：hk/uk/cn-sse/kr/in-nse/us-nyse/au/de-eurex/jp/za/tw/br/ca，镜像不对称、幽灵条、`type:none` 行、多分量求和、阶梯/封顶/近似标记均按预期渲染；矩阵 / 时区 / 健康度 / 市场机制剖面无回归。

**已知局限（留交互式迭代）：** ① 单一费种（印花税）远大于其余时左半大量留白——镜像条形图的固有形态，改累积式瀑布可填满但是更大改动；② 全零市场（jp-jpx/de-eurex）「合计 0.00 bp」行略显尴尬，可考虑抑制；③ 暗色下「此侧不征」灰虚线偏弱；④ `per_share`/`flat_*` 的假设成交额 / 股价折算较粗（只影响 ca-tsx 交易所费、ch-six/uk-lse 清算费）。

**日期：** 2026-08-30

### ADR-048 — Phase 3 第三棒：交割管线可视化的设计定案（双泳道 + 常驻违约瀑布 + `guarantee_model` 维度）

**背景（2026-08-30 用户 Q&A 定案，接 [ADR-045] 成本瀑布的节奏）：** 市场机制剖面目前把「结算周期」压成一个 `T+2` chip，交易员看不到成交到最终交收之间发生了什么——谁做 CCP novation、什么时候盯市 / 追保、违约了损失谁按序吸收、实物还是现金交割。第 8 章 8 个字段全散文、`spec` 层为零（继第 11 章成本瀑布之后第二个零 spec 章节）。

**查数据（`schema/taxonomy.yml` 第 8 章、`schema/spec.yml`、`schema/enums.yml`、20 家 `clearing`）确认的三个约束：**

1. `settlement_cycle` 20/20 有 `enum`（t1/t2/t3），是第 8 章唯一天然量化字段。
2. 顶层 `initial_margin` / `maintenance_margin` / `mark_to_market_frequency` / `last_trading_day_rule` 在**现货所几乎全空**（[ADR-030] 已把顶层收窄为「现货语境」，现货没这些概念就留空）；衍生品的盯市 / 到期数据在 11 家的 `clearing.derivatives` 子块里（PRiME 每日两次盯市、股票期货「倒数第二交易日」等）。
3. `default_management` **20/20 全填**，形态高度一致——都是「先动用 X，不足动用 Y，再动用 Z」的有序层级（5–8 层），标准 CCP default waterfall / JSE 的 Lines of Defence。

**三个设计决策（AskUserQuestion 逐项定）：**

1. **两种时间结构 = 双泳道并列**（不是切换）。现货 T+N 是「有终点的短流水线」，衍生品是「循环 + 一个不定位的终点」，这个结构差本身是交易员该建立的清算认知，并列比切换更能传达。
   - x 轴 = 相对交易日天数（T+0 / T+1 / T+2 / T+3 …）。
   - 上泳道「现货」：成交 → novation → 净额轧差 → 保证金 → DvP 终局交收，2–3 格封口符号。
   - 下泳道「衍生品」：成交 → 每日盯市循环 motif（每格重复一个 ↻）→ 右端一个**不按比例的「到期」抽象区块**（`last_trading_day_rule` 是「因产品而异」，不锚定具体天数，区块内放该字段文字）→ 最终结算（现金 / 实物 icon）。
   - 纯现货所：下泳道 `type: none` 灰条「本所无自营衍生品清算」；纯衍生品所（`de-eurex`）：只画下泳道，上泳道标不适用；双业务所（11 家）：两条都画。
   - 唯一硬约束：衍生品到期日不能假装锚定某个 T+N —— 接受「右端一个不按比例的到期区块」。

2. **违约瀑布 = 主图下方常驻附图**（与成本瀑布「主图 + 常驻持有 / 退出税注解」[ADR-047] 轴① 同版式，不折叠、不切换，一屏看完）。
   - 纵向层级堆叠，从上到下 = 动用顺序，**按「谁的钱」上色**：违约方自己（红）/ CCP 自有资金 SITG（橙）/ 存续清算会员共同（黄）/ 法定风险基金（灰）。交易员真正关心的是「作为存续会员，我什么时候被拉下水」。
   - 各层绝对金额基本查不到 → `spec` 只存「层级顺序 + 每层是谁的钱（bearer）」，**不存金额** → 不涉及 [ADR-033] 校验 5b 的数值逐字反查（比成本瀑布好办）。
   - 结构化不出干净层级的所（`us-nyse`「NSCC/DTC 共享框架」的模糊表述）走 [ADR-035] D 三态的「机制存在、结构查不到」→ 画「N 层防线，细节见 detail」占位。

3. **新增 `guarantee_model` 枚举维度。** `ccp_name` 字段隐含「存在单一 CCP novation」，实际 20 家至少 4 种形态：
   - `ccp_novation` —— 独立法人 CCP 把自己插入买卖双方之间做净额担保（多数所）
   - `exchange_as_ccp` —— 交易所自身充当 CCP 实质角色（`tw-twse`、`kr-krx`）
   - `lines_of_defence` —— 现货无 novation、靠多层结算保障防线（`za-jse` 现货：JSE Settlement Authority 的会员准入 → 资本监控 → 资产透明度 → CSDP 承诺 → T+2 结算保证金 → 失败处置 → 违约管理 → 治理）
   - `shared_ccp` —— 跨市场共享的独立 CCP（`us-nyse` / `us-nasdaq` 的 NSCC）
   前端据此选「CCP 介入」节点的图形（实心菱形 / 交易所图标叠加 / 盾牌 / 共享标记）与文案，把散文降级为结构化标签，一次覆盖 tw / kr / za 三种「非标准 CCP」，不再每个在 `zh` 里写一段。
   - `za-jse` 现货的「8 层防线」和它的 `default_management` 8 层几乎是同一串 —— `guarantee_model: lines_of_defence` 只是标签，指向 `default_management.spec.layers`，不重复建模。
   - 认知：`za-jse` 不是「要特殊照顾的麻烦样本」，它揭示了「清算保障模式」本该是一个显式维度（如同 `execution_model` 之于市场组织形态）。

**本棒只定方向，不动 schema / enums / spec / data（留后续，可能再一轮 `spec` 形状细化确认）：**
`schema/spec.yml` 的 `clearing.*` 形状具体键（`default_management.spec` 的 `model` / `layers`（`order` / `resource` / `bearer`）、settlement 时间轴的 spec 形状）；`schema/enums.yml` 加 `guarantee_model`；`taxonomy` 是否给它加 `enum_ref`（会给第 8 章多一个空字段、牵动 progress-matrix 生成块，类 [ADR-042] 的 `za-jse` 第五章 ✅→🟡）；20 家 `default_management.spec` + `guarantee_model` 值回填；`docs/assets/app.js` 的 `renderSettlementPipeline` + 顶层 tab + 路由键。数据回填按 [ADR-043] 教训协调者串行、不并行子代理。

**为什么现在只定方向：** 到目前用户定的是三个高层设计方向，`spec` 形状的具体键（`layers` 里 `resource` / `bearer` 的枚举取值、`guarantee_model` 是否进 `enum_ref`）还没细化。[ADR-045] 定 `spec` 形状时是连着数据回填一起做、形状经过推敲的；贸然写 `spec.yml` 但不回填会留「形状定了但没验证能装下 20 家实际数据」的半成品。

**验证：** 本条不写代码。只改 `PROJECT/DECISIONS.md` + `PROJECT/ROADMAP.md` 叙述条目（非生成块），`make check` 的 `validate` 20 家 0/0、生成块无 diff。

**日期：** 2026-08-30

### ADR-049 — 英文版可用性修订：图形视图接语言开关 + `detail` 折叠降级 + UI 双语机器校验

**背景：** 2026-08-30 的英文版走查（`PROJECT/ENGLISH-REVISION-PLAN.md`，本条是它的决策落点，审查结论不在此复述）发现「英文版」名不副实：事实信封 `en` 覆盖率与译文质量本身达标（[ADR-034]），但 **Phase 2/3 新写的两个旗舰视图（市场机制剖面 = 默认首屏、交易成本瀑布）几乎完全无视 `state.langMode`**，加上 1028 个 `detail` 字段从不翻译且始终渲染、[ADR-006] 的 UI 双语约定在多处漏网。按该计划的批次顺序落地，本条逐批补记。

#### 批次 1（2026-08-30）方案 A + C

1. **`[ADR-006]` 边界细化——UI 文案分两种形态。** 原约定「UI 标签恒双语」只覆盖**短标签**（表头 / 下拉框 / 筛选器 / 状态徽章）；**图形视图的合成语句 / 轴名 / 图例 / banner / 说明段**改为**跟随语言开关**（toggled），不恒双语。
   - 为什么：中心信息卡、说明段这类长句若中英并列，版面会挤爆；而带数字的**合成数据语句**（「涨停 +10%」「指数跌 7% 触发全市场熔断」）本就与 `displayValue()` 同理，理应跟随 `langMode`。这条边界此前没人写清楚，是 Phase 2/3 静默劣化的根因——写 `renderTradingDay` 时理解为「UI 恒双语 → 不必接开关」。
   - 实现：零依赖小工具 `t(zh, en)` / `tSel({zh,en}字典, key)` / `sep()`，符合 [ADR-035] C 零构建守则。

2. **chip 名不新写英文——按 `chapter` + `path` 到 `cache.taxonomy` 查字段定义的 `label_en`。** 新增 `fieldLabel(chapterId, path)`，chips 与持有 / 退出税行的标签全部改走它。
   - 为什么：chip 名（「最小报价单位」「印花税」…）此前是手写字面量，等于把 taxonomy 里已有的 `label_en` 又抄一遍，正是 `CLAUDE.md` §一 反对的「同一标签两处手写」。顺手消除，也保证 taxonomy 改标签时 chip 自动跟随。
   - **取舍：`zh` 态的 5 个 chip 名因此变了**，这是本条唯一偏离「`zh` 态逐字不变」验收标准处。改动是 `熔断→熔断机制`、`做市商→做市商制度`、`交收周期→结算周期`、`佣金→佣金结构`、`跨境 / 互联互通→互联互通/跨境安排`——全部是 chip 手写简称向 taxonomy 规范名的收敛。留手写字面量则同一字段在剖面 chip 与档案页字段卡上叫两个名字，与 §一 直接冲突；且 §3 方案 A 第 3 条明写了「按 `path` 查 taxonomy」，与「逐字不变」冲突时按更具体的实现指令走。中文模式因此**不是**逐字不变，逐屏核对见下。
   - 反向例外一个：`price_limits.type` 在 taxonomy 里挂在 `price_limits` 组下，`build.py` 扁平化时只留叶子、组名进不了 `docs/data/taxonomy.json`，标签只剩「类型 / Type」——脱离分组上下文不知所云。为此留了 `LABEL_OVERRIDE`（→「价格限制类型 / Price Limit Type」）这一处兜底，是「两处手写」原则在标签本身不自洽时的必要例外。

3. **方案 C 的机器校验：`tools/check_ui_i18n.py`，接入 `make check`。** 扫 `docs/assets/app.js` 的字符串字面量，含 CJK 且①不在 `t()`/`tSel()` 调用内、②不是 `{zh,en}` 字典的 `zh:` 值、③不是双语串（含 ≥2 连续 ASCII 字母）、④行内未标 `// i18n-exempt` → 报错。
   - 为什么：[ADR-006] 是硬约定但无机器强制，Phase 2/3 就是这么静默烂掉的；不加校验，修完还会再烂（对照 [ADR-024]/[ADR-033]「加机器校验锁住铁律」）。
   - 扫描器自己实现极小 JS 词法（跳 `//` 与 `/* */` 注释、正确处理三种引号与转义、**识别正则字面量**——`esc()` 里的 `/[&<>"']/g` 曾让朴素实现把引号误判为字符串边界，产生大量假阳性）。
   - `// i18n-exempt` 是显式逃生口，目前两处：`sep()`（分隔符的 i18n 本体）与语言切换按钮（显示的是「当前数据语言」本身，写成「中文 Chinese」反而不知所云）。
   - 验收：故意塞 `var _probe = "裸露的中文串";` 确认能报错定位到行（`app.js:1612`，exit 1），改回后 `make check` 恢复绿。

**逐屏核对（Chrome headless `--dump-dom`，比对渲染后的可见文本）：** 6 家代表交易所 × {市场机制剖面, 成本瀑布, 档案页} + 时区 + 矩阵，`zh` 态以 `git show HEAD` 的前端代码为基线逐行 diff。结果：成本瀑布 6/6、档案页 6/6、矩阵/时区（时钟数字除外）逐字一致；市场机制剖面 6/6 仅差上述 5 个 chip 改名。

**过程中抓到的两个坑（都已修，值得记）：**

- **`var t` 遮蔽 `t()`**：`cwBuild()` 里 bp 刻度轴的 `for (var t = 0; …)` 因 `var` 提升到函数顶部，把模块级的 `t()` 文案助手整个遮蔽，成本瀑布在**两种语言模式下**都直接抛 `t is not a function` 白屏。同名遮蔽在 JS 里不报任何错、只在运行到那一行才炸，而 `t()` 这种「两字母的全局小工具」被局部变量撞上的概率不低。已在三处（`cwBuild` 循环变量、`tdBuild` 回调形参、点击处理器的 `var t`）全部改名，并就地留注释。
- **`t()` 套模板字符串时把数据值也语言化了**：`t(zo + "跌 …", …)` 里的 `zo` 本身走过 `t()`，导致中文态输出「S&P 500跌」而非原文的「指数跌」（HEAD 逻辑是「单一参考指数时一律说『指数』、不写指数名」）。教训：`t()` 的参数应是**整句字面量**，拼进来的值要在两种语言下都成立。

**范围：** 仅 `docs/assets/app.js` + `styles.css`（`.zh-note`）+ `tools/check_ui_i18n.py` + `Makefile`，`data/` 与 `docs/data/` 零改动。

#### 批次 2（2026-08-30）方案 B —— `detail` / `spec.note` 的诚实降级

**定了什么：** 英文模式下，`renderObjectChapter` 的 `field-detail` 与 `openCellOverlay` 的 `detail` 段落、以及 `spec` 里所有 `*note` 键（`note` / `full_table_note` / `margin_note` / `*_note`，由 `splitSpecNotes()` 按 `/note$/i` 从 JSON dump 里摘出）**收进默认折叠的 `<details>` 小块**，摘要行 `Analyst note (Chinese) ▾`，点开显示中文原文；`spec` 的其余部分照旧 `JSON.stringify` 展示。中文模式逐字不变。

**为什么不选另外两条路：**

- ① **schema 的 `detail` 升 `{zh, en}` 回填 1028 条** —— 否。`detail` 是**分析性散文**（含对来源的推理、归纳改写），翻译漂移风险高；更要命的是每新增一个带 `detail` 的字段就多一份长期双语负担，会持续拖慢 [ADR-017] 的建档流程。
- ② **构建期机翻进 `docs/data/`** —— 否。与「每条事实可溯源、不编造」直接冲突：`detail` 有时写的是「为什么这条查不到」「这个数字为什么可疑」，机翻会把它变成一句看似肯定的译文。
- ③ **前端折叠 + 视觉标记** —— 选它。沿用 [ADR-026] 的哲学：**加视觉标记、不改数据可见性**。读者看到的是「这是一段中文分析注记」而不是「译文缺失」或「这里本来就该有英文」；要读原文点开即可，信息量零损失。

**顺带的取舍：** `spec` 的 note 类键从 JSON dump 里**摘出来单独渲染**而不是留在 dump 里——JSON 里夹中文句子既难读又像 bug；摘出后 dump 只剩纯结构化键值，反而更好读。

**逐屏核对：** `us-nyse` 档案页 `en` 态出现 14 个 `Analyst note (Chinese) ▾` 折叠块、中文原文在其内；同一页 `zh` 态 0 个、与基线逐字一致（上面批次 1 的全量 diff 已覆盖档案页 6/6）。

#### 批次 3（2026-08-31）方案 D —— 站点外壳 + `README.en.md`

1. **外壳 i18n 走计划的方案 (b)，即纯 CSS 双写切换。** `index.html` 的静态文案（加载提示、页脚免责声明）写成 `<span class="i18n-zh">` / `<span class="i18n-en">` 两份，`toggleLang()` 设 `<html data-lang>`，`styles.css` 用 `html[data-lang="en"] .i18n-zh { display:none }` 切。
   - 为什么选 (b) 而不是 (a)（文案移进 JS）：外壳文案与数据渲染解耦，**首屏在 `app.js` 加载前就是正确语言**——(a) 必然有一帧中文闪现。代价是 HTML 里同一句话写两遍，但外壳文案一共只有 2 处、且几乎不变。
   - `title=` 是属性，塞不下双 span，改由 `data-title-zh` / `data-title-en` 驱动，`applyLang()` 统一赋值。
   - `<html lang>` 在 `applyLang()` 里同步切（`zh-CN` ↔ `en`）——这是给浏览器、读屏和搜索引擎看的，与 `data-lang`（给 CSS 看）是两个用途。
   - **`tab` 标签的双语不动**：计划第 2 节已认定「tab 标签本身是双语的（OK）」，它们是短标签、按 [ADR-006] 恒双语，属于本条边界细化的另一半。

2. **`README.en.md` 独立文件 + 手工同步，只有 `exchange-list` 块是生成的。**
   - 为什么不把英文塞进 `README.md`：两份完整正文并列会让中文读者先读一遍英文，反之亦然；两个文件 + 顶部互链是 GitHub 上的通行做法。
   - 为什么同步靠手工：`README.md` 极少变动（v2.0 期间只改过覆盖范围表一处），自动翻译 / 自动同步的成本都大于收益。文件头已写明「本文件与 README.md 手工同步」。
   - `exchange-list` 块必须生成：它是 `data/exchanges/*.yml` 的投影，手工维护必然过期。`sync.render_exchange_list()` 加 `lang=` 参数输出英文变体（列头 `| ID | Name | Region |`，名称取 `name_native.en`，地区取 `enums.yml` 的 `label_en`），`apply_blocks()` 对两个 README 各写一次；`validate.py` 的生成块新鲜度校验从五处变六处。
   - **数据补了 5 个 `name_native.en`**（`br-b3` / `cn-sse` / `cn-szse` / `kr-krx` / `tw-twse` 此前只有本地语言写法）。全部取各所官网的官方英文名，与既有 15 家同字段同性质（`name_native` 是身份元数据，不挂 `sources`，见 `schema/taxonomy.yml` 该字段 note）。`render_exchange_list(en)` 在英文名缺失时退回中文名而不是留空——留空会让整列表格断一列，而「这家所没有官方英文名」不是读者需要在此处知道的信息。

#### 批次 4（2026-08-31）方案 E —— `en` 术语一致性

1. **`tools/check_en_terms.py` 只出建议清单，不自动改、也不进 `make check`。**
   - 为什么：扫出来的 55 处候选里，**绝大多数是合法的市场特定用法**——SSE 官方自己就叫 call auction（36 处 call auction 几乎全在 cn-sse / cn-szse，且各自文件内前后一致，是正确的）；美股 round lot、日本 trading unit 同理。还有一类是**同名不同概念**：`trading unit` 在 cn-sse / cn-szse / tw-twse 里指券商接入交易所的「交易单元」，和 lot 毫无关系。机器分不清这三类，自动改会把对的改成错的。
   - 为什么也不进 `make check`：挂上去要么长期红（逼人写豁免，把它变成橡皮图章），要么逼着把合法用法改掉。作为 `make check-en-terms` 独立命令存在，谁想清理谁跑。
   - **人工逐条判断后实改 4 处**：`cn-sse` `trading_currency` / `settlement_currency`、`cn-szse` `settlement_currency` 的 `Renminbi` → `RMB`（全库 20 家同字段既成写法是 ISO 代码/简称，`Renminbi` 是孤例）；`za-jse` `board_lot_size` 的「lot size … minimum board-lot」同句混用统一为 `board lot`。
   - **判断为不改的**：散文里的 "the renminbi"（小写、作普通名词，是正确英文，不是漂移）；`br-b3` 的 `round lot`（B3 自身英文材料不统一，留待维护者决断，不在本轮替他拍板）；derivatives 语境的 `lot size` / `contract size`（标准英文，非 lot 概念）。
2. **house style 落进 `schema/glossary.yml` 头注**（货币 / 集合竞价 / 最小交易单位三条 + 上述「同名不同概念」的警告），与 `check_en_terms.py` 互相指向。
3. **修确定性小错**：`tw-twse` `historical_data_availability` 的来源标题原写作简繁混种的 `证交所网路资讯商店（Data E-Shop）`，改为 TWSE 官方页名原文「證交所網路資訊商店（Data E-Shop）」（已开官网核对确认）。`zh` / `en` 散文里的店名按全库「`zh` 列统一简体、`quote` 作繁体原文锚点」的既定约定保持简体 `网路资讯商店`（与同句『公开资讯观测站』一致）；同文件其余简体文本一并不动。

> 补记（2026-08-31，收尾审查）：ADR-048 的 `**日期：**` 行此前被本条挤到 ADR-050 之前、成了孤儿，已移回；本条 `tw-twse` 简繁修订初版把 `zh` / `en` 散文也改成了繁体、与同句『公开资讯观测站』不一致，已按上述约定收敛回简体。同批还清掉 `zhNoteBlock()` 未用形参、`check_en_terms.py` 头注与 `glossary.yml` house style 对齐、站点 `<title>` 接语言开关。

**日期：** 2026-08-31

### ADR-050 — Phase 3 第三棒（数据层）：交割管线的 `default_management.spec` 形状 + `guarantee_model` 枚举 + 20 家回填

> ADR-049 预留给「英文版可用性修订」（`PROJECT/ENGLISH-REVISION-PLAN.md` 文首已写明），本条取 ADR-050 避让并行进行中的英文版工作。

**做了什么：** 把 [ADR-048] 只定了方向的交割管线**数据层**落地——`schema/` 三文件 + 全 20 家 `data/exchanges/*.yml` 第八章回填。**渲染层（`docs/assets/app.js` 的 `renderSettlementPipeline` + 顶层 tab + 路由键 + Chrome headless 截图）留后续**，与 [ADR-045]（成本瀑布数据层，PR #37）/ [ADR-047]（渲染层，PR #39）分棒同构。分棒的直接原因：英文版可用性修订正在并行改前端三件套（`app.js` / `index.html` / `styles.css`，见 `ENGLISH-REVISION-PLAN.md` 批次 A–D），交割管线渲染层动同一批文件会撞合并冲突；数据层的文件集（`schema/` + `data/` + `PROJECT/`）与之零重叠。

**实施前一轮 `spec` 形状细化 Q&A（[ADR-048] 预告的「可能再一轮」，AskUserQuestion 三题全取推荐项）：**
1. **本棒范围** = 只做数据层（渲染层留英文版修订合并后）。
2. **`default_management.spec.layers` 粒度** = `bearer` 用枚举（驱动违约瀑布附图配色）、`resource` 留自由短语（从 quote 摘的人读标签）、`order` 整数。
3. **`guarantee_model` 落点** = `taxonomy` 第 8 章正式字段 + `enum_ref`，20/20 全填。

**`schema/` 改动（三文件）：**
- `enums.yml` 加 `guarantee_model` 词表 4 值：`ccp_novation`（独立法人 CCP 更替担保，15 家）/ `exchange_as_ccp`（交易所自身充当 CCP，`br-b3` `kr-krx` `tw-twse`）/ `lines_of_defence`（无 novation 的多层结算保障防线，`za-jse` 现货）/ `shared_ccp`（跨市场共享独立 CCP，`us-nyse` `us-nasdaq` 的 NSCC）。把 `ccp_name` 里三种「非标准 CCP」散文降级为结构化标签。
- `spec.yml` 加 `clearing.default_management` 形状：`model`（`ccp_default_waterfall` / `lines_of_defence` / `unstructured`）+ `layers`（list，每项 `order` int / `resource` string / `bearer` 可选）+ `note`。`bearer` 取值 **5 个**——[ADR-048] 原定的 4 个（`defaulter` 红 / `ccp` 橙 / `surviving_members` 黄 / `statutory_fund` 灰）+ 本棒新增 `external`（外部授信 / 保险 / 流动性安排，灰蓝）：`cn-sse`（商业银行授信）/ `hk-hkex`（保险 + 担保信贷安排）/ `sg-sgx`（Other Resources 含外部授信）三家有明确的外部资源层，硬套进 4 类会失真。**spec 只存层级顺序 + bearer，不存金额**——`layers[].order`（1..8）是唯一数值，个位数不进校验 5b 的数字反查（`NUMBER_RE` 只收 ≥2 位），故此形状完全不涉及逐字数值反查（比成本瀑布好办）。
- `taxonomy.yml` 第 8 章 `csd_name` 后加 `guarantee_model` 字段（`en_required: true` + `enum_ref`）。**不加 `in_matrix`**——是「市场机制剖面 / 交割管线」图形层的维度，矩阵列不因它加宽；progress-matrix 的第 8 章完成度分母 +1，但因 20/20 全填、分子同步 +1，**生成块 `progress-matrix` 零 diff（`za-jse` 第 8 章仍 ✅）**，只 `health-summary` 每家 +1（1844→1864）。
- **settlement 时间轴不新增 spec**：双泳道渲染由既有 `settlement_cycle` enum（t1/t2/t3，20/20）+ `delivery_method` + `last_trading_day_rule` + 本棒的 `guarantee_model` + `default_management.spec` 驱动，不需要每所一份时间轴 spec。

**`default_management.spec` 回填结果（20/20）：**
- **`model: ccp_default_waterfall` + 完整 `layers`（12 家）**：`au-asx`（4 层）/ `br-b3`（2 层，官方仅「defaulters pay / survivors pay」二段）/ `ch-six`（4）/ `cn-sse`（5，《证券登记结算管理办法》68 条明列）/ `cn-szse`（4）/ `de-eurex`（6）/ `de-xetra`（7，含 assessments + DB 安慰函）/ `fr-euronext`（3，EMIR 标准层级，逐层参数未逐条核实）/ `hk-hkex`（8，HKCC 规则 706 条 (a)–(h)）/ `in-nse`（8，前 4 层 + Core SGF 有原文，第 5–8 层据 SEBI 2025-09 新闻稿）/ `kr-krx`（3，FSCMA §397/§394/§399）/ `sg-sgx`（6，SGX-DC Clearing Rules 7A.01A.2B.2 (a)–(f)）/ `uk-lse`（8，LCH EquityClear 违约瀑布）。
- **`model: lines_of_defence`（1 家）**：`za-jse` 现货，8 项「防线」（会员准入→资本充足监控→资产透明度→CSDP 承诺→T+2 保证金→失败交易处置→违约管理→治理），多为预防 / 程序性措施，只 T+2 结算保证金标 `bearer: defaulter`、违约管理标 `surviving_members`，其余不标 bearer（形状允许 lines_of_defence 的预防层省 bearer）。`guarantee_model: lines_of_defence` 指向这串 layers，不重复建模。
- **`model: unstructured`（7 家）**：`ca-tsx`（CDS Participant Rules 有框架、逐层瀑布未摘引）/ `jp-jpx`（官方页描述违约处置流程而非损失分摊瀑布）/ `sa-tadawul`（Muqassa 有风险框架、逐层顺序未在一手页呈现）/ `tw-twse`（TWSE 自身承担交割履约、指定他方代交付，非标准 CCP 瀑布）/ `us-nasdaq`（已知两级：会员保证金→Clearing Fund；损失分摊触发条件未找到、引用页为反爬验证页）/ `us-nyse`（NSCC/DTC/FICC 共享框架，[ADR-048] 明确预期的「结构查不到」情形）。三态占位，前端画「N 层防线 / 机制存在结构查不到」。

**`guarantee_model` 回填结果（20/20）+ 置信度定级规则：** 规则是「quote 里逐字出现 `central counterparty` / `CCP` / `novat*` / `buyer to every seller` → 可标 `high`，否则 `medium`」。
- **high（7 家）**：`au-asx`（"novated … ASX Clear as the Central Counterparty"）/ `ch-six`（FINMA licensed "as a central counterparty"）/ `de-eurex`（"in its capacity as a central counterparty"）/ `kr-krx`（"KRX, as a CCP, … buyer to all sellers and a seller to all buyers"）/ `uk-lse`（"we stand as a central counterparty (CCP), acting as a buyer to every seller"）/ `us-nyse`（"NSCC serves as a CCP for virtually all broker-to-broker trades"）/ `za-jse`（"settlement assurance … various measures" + "JSE Clear … Central Counterparty (CCP)"）。
- **medium（13 家）**：`br-b3`（"B3 acts as a central counterparty … through the B3 Clearinghouse"——归 `exchange_as_ccp` 是判断：B3 自身内设、非独立法人，与 `kr-krx` 同类但 B3 有 novation）/ `ca-tsx` / `cn-sse` / `cn-szse` / `de-xetra`（quote 只到 "netting … via Eurex Clearing AG"，无 "central counterparty" 字样）/ `fr-euronext` / `hk-hkex` / `in-nse` / `jp-jpx` / `sa-tadawul` / `sg-sgx` / `tw-twse` / `us-nasdaq`——多数是「NCL/HKSCC/CDP/JSCC 等确是 CCP，但『4 种模式里选哪个』是分类判断，且 quote 未逐字给『central counterparty』」。
- **每家 `guarantee_model` 的 `quote` 均直接复用同文件既有已核实字段（`ccp_name` / `default_management` / `csd_name`）的 verbatim quote**，不新造 quote → `verify_quotes` 天然安全（未新增待反查凭据）。

**质量关：** `make check` 全绿——`validate` 20 家 0/0；`verify_quotes` **FAIL=0**（CACHE_MISS=1079 是 [ADR-044] 后 `.cache/` 待 `fetch_sources.py` 重建的已知状态，信息性、不阻断）。生成块唯一变动：`health-summary` 每家 +1（1844→1864）；`progress-matrix` 零 diff。`docs/data/freshness.json` 按仓库惯例（ADR-043/045/046/047 的数据提交均未动它）不随本棒重生成。**未动前端、未动 `docs/data/freshness.json`。**

**留给渲染层棒的清单（英文版修订合并后）：** `docs/assets/app.js` 的 `renderSettlementPipeline`（[ADR-048] 三方向：双泳道并列 / 违约瀑布常驻附图按 bearer 上色 / `guarantee_model` 选「CCP 介入」节点图形）+ `index.html` 顶层 tab + 路由键 `settlement-pipeline` + `styles.css` `.sp-*` + Chrome headless 截图核对。新代码从一开始就接语言开关（吸取 [ADR-047] 渲染层没接、留给英文版修订补的教训）。

**日期：** 2026-08-31

### ADR-051 — Phase 3 第三棒（渲染层）：交割管线 `renderSettlementPipeline`（双泳道 + 常驻违约瀑布 + 顶层 tab）

**做了什么：** 把 [ADR-048] 定方向、[ADR-050] 落数据层的交割管线**渲染层**实装。纯前端四文件改动（`docs/assets/app.js` +359 / `docs/index.html` +1 / `docs/assets/styles.css` +24 / `tools/check_ui_i18n.py` 见下），`data/` 与 `docs/data/` 零 diff，`make sync` 幂等、生成块无变化。新增顶层 tab「交割管线 / Settlement」，排在「交易成本瀑布」之后（tab 数 5→6），路由键 `settlement-pipeline`。

**渲染形态（按 [ADR-048] 三方向落地）：**
1. **双泳道并列**（手写 SVG，`spLanes`）。x 轴 = 相对成交日的营业日 T+0…T+N，竖网格。
   - **上泳道「现货」**：`成交 →〔CCP 介入〕→ 净额轧差·保证金 → DvP 终局交收（T+N 封口双竖条）`。CCP 节点图形按 `guarantee_model` 分四形：`ccp_novation` 实心菱形 / `exchange_as_ccp` 菱形叠中心方孔 / `shared_ccp` 空心菱形套实心小菱形 / `lines_of_defence` 空心盾形（无更替），未知则空心菱形。节点上方恒为「CCP 介入」、下方为 `guarantee_model` 短名（`SP_GM_SHORT`，enum 的 label 偏长、图上另用短名）。
   - **下泳道「衍生品」**：`成交 → 每日盯市循环 ↻（3 枚，mark_to_market_frequency 含「两次/twice」时画 ↻↻）→ 断口斜线「//」（不按比例信号）→ 到期抽象区块（虚线框，「因产品而异·不锚定 T+N」）→ 最终结算圆点（现金 / 实物 / 现金·实物，取 `derivatives.delivery_method` enum）`。
   - 三态：`spDerivState()` 返回 `only`（`price_limits.main_board.spec.reference === "prev_settlement"`，`de-eurex` → 只画下泳道、上泳道虚线「本所无现货市场」）/ `both`（`clearing.derivatives` 有内容 → 两条都画）/ `none`（→ 下泳道虚线 **「第 8 章未记录衍生品清算数据（不代表无衍生品市场）」**——刻意不写 [ADR-048] 原设想的「本所无自营衍生品清算」硬断言：`jp-jpx` 等确有大宗衍生品市场只是第 8 章 `derivatives` 子块未回填，硬断言会失真。`de-xetra` / `us-nyse` 等实际在别的法人清算衍生品的，也用同一句软表述兜住）。
   - `Nmax = max(settleDays, 2)`（原设想 `max(..,3)`：T+1 交易所现货流水线被压进左 1/3、节点标签互相叠字。收到 2 后 T+1 铺满左半、T+2/T+3 照常）。
2. **违约瀑布 = 主图下方常驻附图**（`spWaterfall`，另一张 SVG，不折叠）。按 `default_management.spec.layers[].order` 自上而下堆叠，每层：左侧序号徽标 + 色块（`spBearerFill`：`defaulter` `var(--danger)` 红 / `ccp` `var(--warn)` 橙 / `surviving_members` `var(--sp-gold)` 金〔本视图新增令牌〕/ `statutory_fund` `var(--fg-faint)` 灰 / `external` `var(--info)` 灰蓝 / 无 bearer〔`lines_of_defence` 预防层〕→ `var(--border-strong)` opacity 0.22 淡框）+ `resource` 文本（截断 58 字，完整进 `<title>`）+ 右侧 bearer 中文/英文名。`model: unstructured` → 单个虚线占位框「机制存在，逐层损失分摊结构未在一手来源逐条呈现」。`spec.note`（中文分析散文）在图下方以 `zhNoteBlock()` 渲染（英文态折叠为 `Analyst note (Chinese) ▾`，沿用 [ADR-049] 方案 B）。
3. **`guarantee_model` 驱动 CCP 节点**——见方向 1 的四形描述。另在图下「清算·结算关键事实」chips 里作独立 chip（连同 `settlement_cycle` / `ccp_name` / `csd_name` / `delivery_method`），点击复用 `openCellOverlay`。

**语言开关从一开始就接**（吸取 [ADR-047] 教训）：所有 UI 串走新增的 `t(zh,en)` / `tSel()`；chip 标签按 chapter+path 查 `taxonomy.label_zh/en`（`fieldLabel`）；enum 值走 `enumDisplay`。`tools/check_ui_i18n.py` 对新代码 **OK**（无中文单语 UI 串）。**已知局限**：违约瀑布每层的 `resource` 文本是 [ADR-050] 定的「从 quote 摘的中文自由短语」、无 `en`，英文态仍显示中文——与 [ADR-049] 对 `detail`（1028 段中文分析散文）的处置同构（结构性状态、非漏译），但 SVG 内嵌无法像 `detail` 那样折叠。图的主信息（层级顺序 + 每层谁的钱 + 色）由序号 / 色块 / 英文 bearer 名承载，仍完整双语。**触发**：若某次要补齐英文态，把 `schema/spec.yml` 的 `clearing.default_management.layers[].resource` 从 `string` 放宽为 `{zh,en}`，随一次数据窗口回填 13 家共约 70 个短语（属数据层任务，不在渲染层棒范围）。

**顺带修 `tools/check_ui_i18n.py` 的性能**（[ADR-049] 引入，本次前已慢）：`enclosing_callees()` 对每个中文字面量从其位置逐字回溯到文件头、且内层对全部 ~2000 个字符串字面量做线性扫描 → 每个字面量 O(位置 × 字面量数)，全文件 ~130 个中文字面量累计 5–7 分钟；本棒新增约 40 个串把它推到 7+ 分钟。两处改动，均行为等价（调用方只判断 `EXEMPT_CALLEES` 是否出现）：① 命中 `t` / `tSel` 即 `return`（不再回溯到文件头——t() 包裹的串占 95%，立刻命中）；② 「位置是否落在某字面量内」改二分。改后 `check_ui_i18n.py` 数秒完成。合成用例回归：裸中文串仍 FLAG、t() 包裹（含嵌套条件表达式）仍豁免、`zh:` 字典值仍豁免、`// i18n-exempt` 仍豁免。

**验证：** `make check` 全绿——`validate` 20 家 0/0；`verify_quotes` FAIL=0（CACHE_MISS=1079 为 [ADR-044] 已知态）；`check_ui_i18n` OK；`make sync` 二次幂等、生成块零 diff、`docs/data/` 零 diff。Chrome headless 截图核对 `hk-hkex`（双业务 8 层）/ `de-eurex`（纯衍生品）/ `za-jse`（lines_of_defence T+3）/ `us-nyse`（unstructured + shared_ccp + 现货 T+1）/ `cn-sse`（现货 + external 层）/ `br-b3`（exchange_as_ccp 2 层）/ `uk-lse`（现货 8 层）/ `sg-sgx`（双业务 6 层）× {中文, 英文} × {浅色, 深色} 通过；成本瀑布 / 市场机制剖面 / 矩阵 / 时区 / 健康度五视图无回归。

**已知视觉局限（留交互式迭代，同 [ADR-047]）：** 深色主题下无 bearer 的预防层（`za-jse` lines_of_defence 6 层）色块极淡、近乎只剩序号与文字；T+1 现货所右半（T+1→T+2 网格区）在现货泳道留白；到期区块与「最终结算」节点排布较紧。

**日期：** 2026-09-01

### ADR-052 — `freshness.json` 不再落盘 `age_days`/`stale`，改由前端按访问日现算

**背景：** `docs/data/freshness.json` 里的 `age_days`（今天 − `verified`）与 `stale`（`age_days` 超过 `volatility` 对应阈值）是构建时刻的派生值，不是建库事实。这带来两层问题：① 每次 `make build` 都会把这两个键在全部 1864 条记录上重写一遍，造成一份与内容无关、纯粹因为「今天变了」而必然出现的 3700+ 行 diff，逼着文档类提交每次手动排除该文件才能保持「`make sync` 后 `git diff` 应为空」这条一致性判据；② 更实质的问题是**线上站点的过期判定被冻结在上次构建的那天**——两次 `make sync` 之间，一个字段可能真的跨过了复核阈值，但站点的「待复核 Stale」标记不会反映，直到下次有人跑 `make build` 才会更新，这与 CLAUDE.md §四把「进度矩阵/健康度」当作数据质量外部判据的设计意图相悖。

**决定：** `age_days`/`stale` 不进 `freshness.json`；`tools/sync.py` 的 `compute_freshness()` 内部仍算这两个值供 `render_health_summary()`（ROADMAP.md 的 health-summary 生成块，本就是构建时刻快照，冻结符合预期，不受本条影响）使用，但写盘前用 `freshness_rows_out` 过滤掉这两个键。前端 `docs/assets/app.js` 新增 `daysSince()` + `applyStaleness()`，在 `loadCore()` 里用每条记录自带的 `verified`（已有）+ `volatility`（已有）+ `manifest.json` 新增的 `volatility_months`（`sync.py` 的 `VOLATILITY_MONTHS` 常量原样 emit，唯一生成出口，前端不重复手写这三个数字）在**访客本地按当天现算**，算完仍写回 `f.age_days`/`f.stale`，下游（`staleSet`、矩阵格子的 stale-dot、健康度页排序与展示列）零改动。

**为什么 `volatility_months` 放进 `manifest.json` 而不是 `_schema.json`：** `_schema.json` 是 `build_json_schema()` 产出的 JSON-Schema 文档（`$schema: draft/2020-12`），语义上只描述字段结构，塞进业务阈值常量会污染这份文档的用途；`manifest.json` 本就是「站点级构建配置」的落点（已有 `exchanges`/`dimension_groups`/`chapters`），且已有先例——故意不放时间戳字段就是为了保 diff 干净（见文件内注释），加一个静态、跨构建不变的常量不违反这条纪律。

**验证：** worktree 内 `.cache/` 为空（`git worktree` 不复制被 `.gitignore` 忽略的目录，这本身也是 [ADR-053] 要处理的那类"环境局部状态"的现场例证），`make build` 仍全绿：`validate` 0/0、`verify_quotes` FAIL=0（CACHE_MISS=1078 为本 worktree 无缓存的信息性状态，非回归）、`check_ui_i18n` OK；`make sync` 二次幂等，`git status` 只有预期的 4 个文件（`tools/sync.py` / `docs/assets/app.js` / `docs/data/freshness.json` / `docs/data/manifest.json`）。Chrome headless `--dump-dom` 核对健康度页（`#view=health&htype=stale`）：`共 1864 个已填字段，其中 0 个超过复核阈值待复核`，与 ROADMAP.md 现有 health-summary 生成块的服务端算出的 `0` 一致；矩阵视图（`#view=matrix`）280 个 `<td>` 正常渲染、无 stale-dot（同为 0 的预期结果），未见 JS 异常。

**日期：** 2026-09-01

### ADR-053 — 受控文档记录构建态数字时，只记取数方式不记快照数字

**背景：** [ADR-044] 与 [ADR-050] 的 ROADMAP.md / DECISIONS.md 条目里写死了 `verify_quotes` 在当时环境下的具体输出（如"重建前会显示 `OK=0 / CACHE_MISS≈1071`""CACHE_MISS=1079"）。`.cache/` 是 `.gitignore` 排除的本地缓存目录（[ADR-032]），其内容量因环境而异——同一份代码在另一台机器、另一次 `git clone`、甚至同一台机器新建一个 `git worktree`（本次改动的验证过程就撞上了：worktree 内 `.cache/` 为空，`verify_quotes` 显示 `OK=0/CACHE_MISS=1078`，而主 checkout 当时已是 `OK=1000/FAIL=0/CACHE_MISS=78`）都会得到不同的数字。历史条目本身没错（记的是"当时该环境下发生了什么"），但后续读者如果把它当成"现在的状态"会被误导：以为 quote 尚不可核验、以为还需要全量重跑 `fetch_sources.py`。

**决定：** 不改写 [ADR-044]/[ADR-050] 已记录的历史数字（本就是过去某一刻的真实观测，改写违反 §八"只增补不改写"），只在 ROADMAP.md 对应条目补一句限定语，指向可执行的取数方式——`.cache/` 状态请跑 `make verify-quotes` 看当前实际输出——而不是让读者信任文档里的旧快照。以后任何要记录"构建态/环境态"（`.cache/` 覆盖率、依赖版本、机器本地状态之类，凡是 `.gitignore` 排除或环境相关的）数字的场合，同样优先记"怎么取数"而非具体数字；确需记录数字时标注"某时刻快照，非当前状态"字样。

**未做（留用户判断）：** 现存 78 个 `CACHE_MISS`（`za-jse` 71 / `cn-szse` 5 / `jp-jpx` 1 / `br-b3` 1）要不要跑 `fetch_sources.py` 补齐落盘——`FAIL=0` 已证明现有 1000 条 `quote` 未见编造，不影响数据可信度，补齐的收益只是让计数归零、看着干净，且 `za-jse` 那 71 个多半是 PDF/JS 页面，补不补得到 0 存疑，本条不代为决定。

**日期：** 2026-09-01

### ADR-055 — 市场机制剖面视觉迭代：机制核心面板（第五章七项事实收进主图中心的固定 foreignObject）+ 透视开关

**为什么需要：** [ADR-040]/[ADR-042] 定型的剖面把「交易机制」七项事实（价格限制类型 / 熔断 / 撮合原则 / 订单类型 / 卖空 / 做市商 / 波动中断）放在主图**下方**、用 `flex-wrap` 排的 13 个 chip 里。三个问题：① 读者读完坐标系要往下扫再回头对照，两个阅读焦点；② `flex-wrap` 让每家交易所因文字长短不同而换行位置不同，「撮合原则」在哪没有稳定落点；③ 中心信息卡（结论句）与下方 chip 是同一章的两种割裂呈现，且 13 个 chip 视觉权重相同，最该先看的不突出。而剖面中心（零轴附近、日内时间中段）对绝大多数交易所是结构性空地——`yR` 按涨跌停/熔断量级自适应，几何元素恒贴四条边。

**要达成的目标：** 「交易机制」七项位于主图中心一块**固定 628×276、垂直居中于零轴**的 `<foreignObject>` 面板内（顶栏价格约束结论句 + 2×3 固定网格：撮合/订单类型 · 熔断/波动中断 · 卖空/做市商）；20 家交易所逐一切换时每个槽位的屏幕坐标不变；顶栏结论句恒一行；面板右上角一个 `◐/●` 透视开关，一点让面板退成虚线轮廓、内容淡出，露出被它盖住的零轴 / 熔断线 / 走廊；`make build` 全绿、`docs/data/` 零 diff。

**如何达成（纯前端，`docs/assets/app.js` + `styles.css` 两文件）：**
- `app.js` 新增模块级 `tdChip()`（从 `tdSidePanels` 内联 `chip` 提升，两处共用）、`tdGhostOn()`（读 `localStorage["ea-td-ghost"]`）、`tdEnvelopeLine(ms, yRef)`（取代删掉的 `tdHeadlineParts`——旧函数把价格限制+熔断+回转综述成 1–3 行，现在只留价格约束一句、恒 1 行；熔断进面板槽③，回转已是平面右外缘标记）、`tdCorePanel(id, ms, yRef, ghostOn)`（产出 `foreignObject`，坐标 `x=PL+60 / y=PT+ph/2−138 / w=pw−120 / h=276`，即水平居中、垂直居中于零轴 `Y(0)=256`）、`tdBanner(ms)`（非现货/衍生品 banner 从 `tdSidePanels` 提出，移到 SVG **之前**输出——读图前的前提）。
- `tdBuild`：删中心信息卡代码块；`g.push(tdCorePanel(...))` 在几何层之后（压在上面）；`.td-plot-wrap` 按 `tdGhostOn()` 加 `td-ghost` 类；return 改 `tdBanner() + tdLegend() + svg + tdSidePanels() + tdProse()`。
- `tdSidePanels` 瘦身为只剩「交易细则·成本」组（tick/手数/交收/佣金/交易税/互联互通），容器 `flex-wrap` → `<div class="td-chips td-chips-6">`（定宽 6 列 grid，窄屏 3 列）。
- 文档级 `click` 委托加 `role === "td-ghost"` 分支：切 `.td-plot-wrap` 的 `td-ghost` 类 + 写 `localStorage`；CSS 在 `.td-ghost` 态给 `.td-core` 设 `pointer-events:none`、给 `.td-core-ghost` 设回 `auto`（透视态下只按钮可点，避免误触槽位）。
- `styles.css`：新增 `.td-core / .td-core-ghost / .td-core-head / .td-core-tag / .td-core-line / .td-core-grid` + `.td-plot-wrap.td-ghost .td-core*`（`prefers-reduced-motion` 下关过渡）+ `.td-chips-6`；删已无引用的 `.td-head` / `.td-head-1`。

**几何取舍（面板与平面元素的关系）：** 涨/跌停墙随 `yR` 自适应恒在 `Y≈90/420`，面板 `Y 118→394` 居中于零轴 → 上下气口自动对称（各约 24–32px，即建议的「原边距 ×0.5」；左右各距绘图区边 60px，同样约 ×0.5）。**代价：首档熔断线（−7~−8%，离零轴仅 40–60px < 面板半高 138px）默认被面板盖住**——几何上无法既居中对称又不遮线；扩大到 628×276 后，`kr-krx` 这类 ±30% + 三档熔断的所三条线全进面板。兜底：① 熔断全档位数字在槽③文字里完整；② 深档（多数所的 −20%）仍在面板外；③ 透视开关就在面板右上角，一点即看。经用户两轮 Q&A 拍板：面板要大、留白要收，熔断线的像素位置交给透视按钮。

**已知局限（留后续迭代）：**
- **纯衍生品所（`de-eurex`）无涨跌停线时**，面板气口没有墙作参照，对称性退化为「单纯居中」——不影响可读性。
- **面板占绘图区约 84%×69%，接近「图中图」。** 若日后某所同时有很宽的走廊 + 密集竞价竖条，可能需要给面板宽度设一个按 `xMin/xMax` 跨度收缩的下限——目前 20 家无此情况。
- 长值（订单类型、卖空）仍 2 行 `-webkit-line-clamp` 截断，全文在点击浮层；面板变宽（每列 ~300px，原 chip 148px）已明显缓解，未追求 3 行（行高会挤）。
- 透视是手动切换；未做 hover 自动半透明（会与点击槽位抢手感）。

**验证：** `make build` 全绿——`validate` 20 家 0/0、`verify_quotes` FAIL=0（CACHE_MISS 为本 worktree 无 `.cache/` 的信息性状态，见 [ADR-053]）、`check_ui_i18n` OK（面板所有 UI 串走 `t()`/`tSel()`/`fieldLabel`/`enumDisplay`，从一开始接语言开关）；`make sync` 幂等，`git status` 仅 `app.js` + `styles.css`，`docs/data/` 零 diff、生成块无变化。Chrome headless 核对：`cn-sse`（±10%）/ `kr-krx`（±30%+三档熔断，最紧）/ `de-eurex`（前结算价 + banner 上移）/ `us-nyse`（英文态）/ `kr-krx`（暗色）+ 透视开/关两态——面板槽位稳定、顶栏恒一行、透视按钮切换正确、被盖几何在透视态浮现；成本瀑布 / 对比矩阵两视图无回归。

### ADR-054 — 成本瀑布 spec 层 103 条独立复核：`note` 数字、`type: none` 依据、时间性键是三个系统性缺口

**背景：** [ADR-045] 一次性回填了 103 个 `costs.*` spec，绝大多数由协调者串行、从既有 quote 结构化而来，**未经过第二人独立复核**。机器校验 5b 只覆盖一个窄面（`confidence: high` 且 ≥2 位数字的 spec 数值 ⊆ quote），对 `unit` 混淆、`side` 错侧、`type: none` 无依据、`note` 夹带数字、`tiered` 档位漂移全部静默放行——而成本瀑布已随 [ADR-047] 上线，这些都是图能正常渲染、数字错了没有任何信号的失效面。按 CLAUDE.md §四，新数据面铺开前需人工抽检，spec 层补过这道关。

**方法：** 离线 spec-vs-quote 比对（quote 在各 yml 字段内，未新增抓取），四档深度（A 实体值+high / B 实体值+medium·low / C `type: none` / D `rate: null`）× 6 维度，逐条结论表见 `PROJECT/COST-WATERFALL-SPOT-CHECK.md`。

**结果（初检 82/103 = 79.6% 通过，全部就地处置后终态 100%、`make check` 全绿）：** 8 处 `FIX` + 13 处 `DOWNGRADE`，集中在三类系统性缺口——

1. **`note` 字符串里的数字完全没有机器覆盖**（5b 只递归查数值型叶子，`note` 是字符串）：`cn-sse exchange_fees` 夹带深交所费率 `0.0341‰`、`br-b3 exchange_fees` 夹带 `0.00500%/0.00375%`、`fr-euronext FTT` 夹带「法国现行 0.3%」、`sg-sgx clearing_fees` 币种写错（USD vs S$）。已全部改为不含数字的交叉引用表述或改回原文口径。
2. **`type: none` 的正面依据普遍缺失**：31 个 `type: none` 里 13 个降级为 `rate: null`（au FTT、ca 监管费、cn-szse FTT、de-eurex 印花税与 FTT、fr stamp_duty、hk FTT、kr 监管费与印花税、sg 监管费与 FTT、za 监管费与 FTT）。根因是把「费率页没列这个税目」当成了「不征收」——交易所费率页只覆盖自身收费，不管国家税制；第三方国别税费综述（CEPR FTT 清单、IRAS GST 页）只能支撑其主题内的事实。
3. **`tiered` / `side` 是随时间漂移或原文常缺的键**：`kr-krx exchange_fees` 的 `tiered: true` 挂在 2026-02-13 已过期的临时阶梯上（渲染层会按「阶梯首档」标注一个不存在的档位）；韩国/南非 STT、英国 SDRT 的单边方向在 quote/zh 里都没有陈述。

**决定：**

- **（数据）** 8 处 FIX 与 13 处 DOWNGRADE 全部就地处置：数值/单位/方向错但 quote 有正确值 → 改 `spec` 不改 `quote`；`type: none` 无正面依据 → 改 `rate: null` + 诚实 `note` + 转 OPEN-QUESTIONS（13 个降级点同步改写 zh/en，不再保留无依据的「不征收」断言——spec 与 zh 是同一事实的两种渲染，只改一半会自相矛盾）；`kr-krx` 移除已过期的 `tiered`；`br-b3` FTT 保留 `rate: 0` 并补 `side: buy`（`rate: 0` 与 `type: none` 的语义区分成立：税种存在但现行税率为 0，后者会渲染成「不征收」抹掉这一事实）。
- **（`side` 裁定细则，供后续沿用）** quote/zh/detail 任一处明说方向 → 必须一致；三处都未提而 spec 声明了方向 → **保留值 + 记 OPEN-Q 补强来源，不移除**——渲染层 `cwSide()` 对缺省回退 `both`，移除单边税键会把它画成双边，错得更远。
- **（流程，未实施、记为 ROADMAP 迭代点）** 给 `validate.py` 5b 增补「`spec.note` 字符串数字反查」（同字段 quote/zh/detail 任一命中即可）——本次 8 处 FIX 里有 4 处属于这个盲区，机器化后这类错误不再依赖人工抽检；另把「`type: none` 必须有正面依据句」写进 add-exchange skill（已写入）。

**未做（留用户判断）：** ① 初检 79.6% 低于 CLAUDE.md §四 的 95% 阈值——以「修正后终态」计达标，但这个数字本身量化了「协调者串行、无第二人复核」流程的缺口率；后续大棒回填（如 [ADR-050] 的 20 家 `default_management.spec`）是否要把「第二人独立复核」从可选变成必经步骤，属流程决策，不代定。② 13 个降级点大多可以靠重抓税法/税务局原文坐实回 `type: none`，清单已进 ROADMAP「下一步」与 OPEN-QUESTIONS，本次未新增抓取。


**日期：** 2026-09-01

### ADR-056 — 宪法（CLAUDE.md）审查与修订：v2.0 定位 / spec 层验收判据 / 可变性程序 / 两条交付纪律

**背景：** 用户提出「宪法服务于项目目标，世界与目标会变，条款不应教条地视为不可改；改动前描述内容与影响、由用户拍板」，要求据此审查 CLAUDE.md。逐节比对 ROADMAP 三节 + ADR-033～055 + Makefile + tools/ + README 后，漂移集中在两条缝：① v1.x「横向对比」定位 → v2.0（[ADR-035]）「单市场快速看懂」转向留下的定位句与验收判据缺口；② 工具链从 3 个脚本长到 7 个、抓取分两条路径，宪法只字未追。方案 6 项 + 用户在另一对话提出的 2 条交付纪律，逐条经用户批注拍板，本条一次落地。

**逐项（括号内为用户决定）：**

1. **开篇定位句**（不点名视图名）——「用统一框架横向记录……」改为「**核心目标：把交易员理解一个陌生市场所需的关键信息收敛到同一屏可视化**；当前按主题分成的几个视图是过渡形态，终态合并为一页、其余降级到「更多」入口；横向对比矩阵作为第二价值保留」。这条北极星此前只在记忆 `v2-visualization-pivot` 与口头，README 已是可视化优先表述（[ADR-042] §5），宪法开篇滞后会让无记忆会话把矩阵当核心。**不点名「市场机制剖面」等视图名**——视图会合并 / 更名，宪法不绑定实现形态。

2. **§四 加 v2.0 `spec` 层验收判据 + 第二人复核程序**（采「超阈值必经」）——§四 原只有 v0.1（上交所 20 字段）/ v1.0（每所 10 字段）两条 quote 抽检判据。新增：`spec` 与 `quote` 逐条比对 6 维度（数值 / `unit` / `side` / `type: none` 正面依据 / `note` 数字 / `components`·`tiered`·`cap`），范式沿用 [ADR-054]；**单批 `spec` 回填触及 > 30 个字段时，第二人独立复核为必经步骤**，ROADMAP 条目打勾前必须有非协调者的另一视角跑完。这直接解决 [ADR-054]「未做①」留给用户的问题（[ADR-054] 实测串行回填初检约 80%，正是 95% 阈值要拦的个案错误）。v0.1 / v1.0 两条旧判据降为「历史实例」，通用原则（任何批量数据 / `spec` 工作抽检 ≥95%，否则停）上提。§四 标题从「数据质量」放宽为「质量」。

3. **可变性程序写进宪法自身**（要，位置措辞由 agent 定）——文件顶部「会话宪法」标题下加一段「本文件的性质」：宪法服务于项目目标、条款可随目标演进修订、修订须先描述改动与影响并由用户拍板、执行中发现条款与现实脱节先提出（不擅改也不盲从）。此前这条元规则只在对话里，无记忆会话不知道，可能把 CLAUDE.md 当绝对不可动、或反过来随手改。

4. **§二.5 术语更正 + §二 补机器强制现状原则**（平衡维护成本与腐烂速度：不做清单，只留原则）——`zh`/`native`（[ADR-013] 已删除的旧三态术语）改 `zh`/`en`；§二 末尾加一句不会腐烂的原则：部分铁律已是 `make check` 硬关卡（[ADR-032]/[ADR-033]），`spec.note` 数字 / `type: none` 依据 / 散文语义仍是盲区（[ADR-054]），**`make check` 全绿不等于数据没被幻觉污染**——不逐条列「哪条已机器化」（会随 `validate.py` 演进腐烂），指向 ADR。§一 那句「5b 反查 spec 数字 ⊆ quote」补限定语（只覆盖 `confidence: high` 数值叶子）。

5. **抓取工具链**（按现实需求）——`tools/fetch_sources.py`（收割全库 `sources` URL 落盘、PDF 生成 `.txt`、`verify_quotes` 全库反查前置，`SKILL.md` 已在用）此前不在 Makefile，直接违反 §一「Makefile ＝命令唯一权威」。**新增 `make fetch-sources` target**（支持 `EX=<id>`），恢复不变式；§二 抓取段改为「单家 `make fetch EX=` / 全库 `make fetch-sources`」，UA / 反爬门道（含 sec.gov Fair Access 身份 UA、全量重跑覆盖好缓存的坑）指向 `PROJECT/SOURCES.md` 不写死在宪法；§五、§七 同步。

6. **§六 Git 章瘦身**（新建 `PROJECT/GIT-RUNBOOK.md`，§六 指过去）——`gh pr merge --delete-branch` 与 worktree 冲突的处理顺序 + 代码块 + `--subject` 注移入新文件；§六 正文留推送原则 + 一行指引。§一 表格加 `GIT-RUNBOOK.md` 行。

7. **两条交付纪律写进宪法**（用户另一对话提出，本次一并改，不下放）——判断依据：两条都属「什么算做完」，与 §八「没回写视为没做完」同源，各几句 prose。
   - **A（每个逻辑改动一个 commit）**：落 §六——便于单独回溯 / 回滚，不把不相关改动攒进一个大提交；一次成体系改动（如一条 ADR 完整落地）可为一个提交。
   - **B（改动补校验 + 交付前全绿）**：收敛措辞后落 §四——纯数据回填不需要新测试，准确说法是「改动**引入新结构 / 不变式**时必须同时加机器校验（[ADR-024]/[ADR-033]/[ADR-049] 的既有模式），交付前 `make build` 全绿」。§八 加一句把 commit + 校验列为收尾的另两件事，指向 §六 / §四。

**没改：** §二 五条铁律的实质（只修术语 + 补现状说明，不增删条）；§三 降级方案；README（[ADR-042] §5 已做可视化优先重写，「终态合并一页」属 roadmap 性质、不进对外定位）；`add-exchange` skill 执行步骤；[ADR-041] 关于「新增交易所是按需能力、agent 不主动提议」——[ADR-041] 已明确该约束按职责边界表不进宪法、只在 ROADMAP，本次维持。

**遗留（未纳入本条，留后续）：** 「把 `市场机制剖面` / `成本瀑布` / `交割管线` / 后续模块合并为单页画布、其余降级到『更多』入口」这条北极星只在本 ADR 与开篇定位句里点到，**尚无独立 ADR 与 ROADMAP Phase 条目**——影响每个后续可视化模块的设计（要按 merge-ready 造），建议用户确认后单开一条。

> 补记（2026-09-01）：本段「遗留」已由 [ADR-057] 承接——北极星立为独立 ADR、`ROADMAP.md` §三 新增 Phase 4 条目、merge-ready 设计清单成文。

**验证：** 纯文档 + Makefile 一个 target。`make build` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 幂等、`make help` 列出 `fetch-sources`；`data/` 与 `docs/data/` 零 diff、生成块无变化（CLAUDE.md / Makefile / 新文件都不被 `sync.py` 扫描）。

**日期：** 2026-09-01

### ADR-057 — 北极星：可视化模块终态合并为单页画布，其余视图降级到「更多」入口

**背景：** v2.0 转向（[ADR-035]）的真实用例是「交易员首次接触一个陌生市场，30 秒看懂它怎么运转」。当前实现把这件事拆成三个并列顶层 tab（市场机制剖面 / 成本瀑布 / 交割管线），读者要自己在脑子里把几张图拼成一个市场的完整画像——与「同一屏看懂」的目标有结构性落差。用户 2026-08-29 当面明确了终态方向（记忆 `v2-visualization-pivot`），[ADR-056] §1 已把它写进宪法开篇定位句，并在「遗留」段点明「尚无独立 ADR 与 ROADMAP Phase 条目，影响每个后续可视化模块的设计，建议单开一条」。本条承接该遗留。

**定了什么（北极星，用户已拍板，本条给它一个可引用的落点）：**

1. **终态 = 单页画布。** 市场机制剖面 / 成本瀑布 / 交割管线 / Phase 3 剩余模块（上市生命周期 / 监管图 / 参与者 / 风险旗标）最终合并为**同一页的一块可视化画布**，一次滚动 / 平移看完一个市场的全貌，不再切 tab。当前顶层 tab 是过渡形态。
2. **其余视图降级到「更多」入口。** 对比矩阵（`#view=matrix`）、时区甘特条（`#view=timezone`）、数据健康度（`#view=health`）、交易所档案页（`#view=exchange`）不进主画布，收进一个次级入口。矩阵作为项目第二价值保留（[ADR-005] 状态段 + [ADR-035] A）——不是删除，只是不占首屏。
3. **每个新可视化模块从设计阶段就按 merge-ready 造。** 这是本条对当下工作的**直接约束**：Phase 4 合并还远（见下），但 Phase 3 剩余的每个模块在其设计 ADR 里必须逐条回答下面的 merge-ready 清单，否则合并时要推倒重来。[ADR-055] 把「机制核心面板」从主图下方 chip 收进主图中心固定面板，就是第一个按这个方向做的迭代。
4. **Phase 4 的启动前置条件（硬顺序，非「视情况」）：Phase 3 的全部章节可视化模块——上市生命周期 / 监管图 / 参与者 / 风险旗标——均已落地。** 在此之前不启动合并、不动前端做画布布局。单项模块还没做齐就合并，等于每加一个模块重排一次画布，是明确要避免的返工。用户 2026-09-01 复述强调过这一条。

**merge-ready 设计清单（每个新模块的设计 ADR 必须逐条回答）：**

- **锚定关系**：这个模块与主图（市场机制剖面的「日内时间 × 相对前收价」平面）是什么空间关系——共用 x 轴（如交割管线的相对天数是剖面日内时间的自然延伸）？叠加在平面某区域？还是独立分区、只靠视觉语言（配色 / 线型，[ADR-040] 的线条语言表）与主图呼应？
- **占位**：在合并画布里常驻显示还是可折叠？默认展开还是收起？占多大纵向 / 横向空间？
- **诚实三态**：模块对「数据缺省 / `type: none` / null」的降级呈现（[ADR-035] D）在分区缩小后是否仍成立，三态提示会不会被挤没。
- **语言开关**：从第一版就接 `t()` / `tSel()` / `fieldLabel` / `enumDisplay`（[ADR-049] 教训，[ADR-051]/[ADR-055] 已照做）。
- **零构建**：手写 SVG + vanilla JS，不引入渲染库（[ADR-035] C）。

**为什么现在单开一条 ADR，而不并进 [ADR-056]：** [ADR-056] 是**宪法审查**（元规则 / 验收判据 / 交付纪律），北极星是**产品路线决策**——混在一条里会模糊「宪法条款」与「路线图决策」的边界（§一 职责边界表：CLAUDE.md 管铁律与定位，DECISIONS 管为什么这么排 + 对后续的约束，ROADMAP 管什么时候做）。宪法开篇定位句是「是什么」，本条是「为什么这么排 + merge-ready 约束」，Phase 4 是「什么时候做」。无记忆会话读 DECISIONS 才能找到「为什么剩余模块都强调 merge-ready」的权威依据，否则容易把某个模块设计成难以合并的形态。

**为什么 Phase 4 排在 Phase 3 之后，不插队：**

- Phase 3 章节可视化还有 4 个模块没做（上市生命周期 / 监管图 / 参与者 / 风险旗标）。模块数量还在增长时合并，等于每加一个就要重排一次画布布局，反复推倒。
- 正确顺序：按 merge-ready 清单把 Phase 3 剩余模块逐个做齐 → 模块集合稳定 → Phase 4 一次性设计合并画布的整体布局 + 「更多」入口。
- 这也给「合并画布该用什么形态」积累判断依据——到 Phase 4 时已有约 7 个成型模块可据实排布，而非现在拍脑袋。

**本条不做（留 Phase 4 启动时 Q&A）：**

- 合并画布的整体布局形态（纵向滚动长图 / 缩放平移画布 / 固定分区网格）。
- 「更多」入口的具体形态（顶栏下拉 / 二级导航 / 页脚链接 / 独立落地页）。
- 各模块在画布里的最终排序与常驻 / 折叠策略（每个模块的设计 ADR 先给一个 merge-ready 意向，Phase 4 统一定稿）。
- 路由与深链兼容（现有 `#view=cost-waterfall` 等是否保留为画布内锚点）。

**没改：** README（[ADR-042] §5 已做可视化优先重写，「终态合并一页」属 roadmap 性质、不进对外定位，[ADR-056] 已判过）；`add-exchange` skill（merge-ready 是可视化模块设计约束，与新增交易所流程无关）；前端（Phase 4 才动）。

**验证：** 纯文档。改 `PROJECT/DECISIONS.md`（本条 + [ADR-056]「遗留」段补一句承接）+ `PROJECT/ROADMAP.md`（§三 新增 Phase 4 条目、§一 三处同步）+ `CLAUDE.md` 开篇定位句补 `[ADR-057]` 引用。`make check` 的 `validate` 20 家 0/0、生成块无 diff（三个文件都不被 `sync.py` 扫描）。

**日期：** 2026-09-01

### ADR-058 — `validate.py` 5b 增补 `spec.note` 数字反查（5c）：把「note 夹带数字」变成构建关卡

**背景：** [ADR-054] 成本瀑布 103 条独立复核里，8 处 FIX 有 4 处属于同一个机器盲区——`spec` 自由文本键（`note` / `*_note`）里夹带的数字完全不被 `make check` 覆盖。典型是 `cn-sse` `exchange_fees`（medium）的 `note` 写进了深交所费率，图照常渲染、数字错了零信号；5b 只反查 `confidence: high` 的**数值叶子**，这类散文式字符串连高门槛都进不去。[ADR-054] 把「给 5b 增补 note 数字反查」记为「未实施、留 ROADMAP 迭代点」。

**决定：** 在 `validate.py` 落地 5c——

- **对象**：`spec` 子块里自由文本键（`note` / `*_note`）的字符串，不限 `confidence`（medium/low 的 note 正是盲区重灾区）。
- **命中范围**：note 常做交叉引用（如「见 price_limits」），允许复述人读文本里已有的数字，但**不得夹带谁都没有的数字**。〔收尾修订 B5/B7：范围由「同字段 quote/zh/detail」放宽为「本交易所文件内所有 quote/zh + 本字段 detail」，见下方「收尾审查修订」段〕
- **非数值 token 剥离后再比对**：ISO 日期、时刻、孤立年份、条款号（Rule / § / 第 N 条）、ADR / 悬案编号引用、字母粘连代码（MT30、ZA01、FE10）——这些不是量化机制值，挡的是「费率 / 阈值 / 金额」这类静默错误。小数尾随零归一（`0.50 ≡ 0.5`）避免书写精度误报。
- **报错即阻断构建**，与 5b 同等级。

**落地残差（现网数据）：** 5c 跑在现网抓出 13 处违例——全在第五章 `market_structure` 的 `spec.note`（+ 1 处 `costs.clearing_fees`），正是 [ADR-054] 抽检只覆盖 `costs` 章而漏掉的盲区。初次修复一律删数字；收尾审查（见下方「收尾审查修订」B4）逐条复核：其中 5 处是**在兄弟字段有源**的合法交叉引用，文件级 5c（B5）下已还原带数字；6 处确认删除正确（无源 / 派生值，含 `cn-szse` 价格笼子 `102%/98%` 与 `ch-six`「随机 30 秒」——后者 SIX 实为 2 分钟随机窗口、`30 秒` 系误植）。

**文档回写：** `CLAUDE.md` §一 / §二 移除「`spec.note` 数字是机器盲区」的旧表述（改指向本条）；`schema/spec.yml` 头部补 5c 说明。

**验证：** `make check` 20 家 0/0；负向探针确认——注入 `note: "测试费率 0.0341‰ 已确认"`（无底稿）被拦，同数字出现在 `quote` 则放行。

**没改：** 5b 的高门槛数值叶子反查不变；medium/low 的**数值叶子**（非 note 字符串）仍靠人——5c 只管 note 里的数字，不把 5b 的覆盖扩到 medium/low 数值叶子。

**日期：** 2026-09-01

---

**收尾审查修订（2026-09-02）** — 对 A1（5c）+ A2/A3（数据层坐实，记录在 `ROADMAP` 第三节 + OPEN-QUESTIONS #88，非本 ADR 正文）做第二视角复核，逐条落地 8 项（B1–B8）：

- **B1（数据）· `hk-hkex financial_transaction_tax` 回退 `type: none` → `rate: null`。** A2 据 IRD 印花税页翻的 `type: none`，其引文「stamp duty relief is available for the transfer of ... shares」讲的是印花税**减免**，不构成「除印花税外无独立证券交易税」的正面依据（CLAUDE.md 二.4）。回退 `rate: null` + 诚实 `note`，IRD 源保留为补充但注明不支撑结论，转 OPEN-QUESTIONS。
- **B2（措辞）· 「一手源」收敛为「第三方综述」。** A2/A3 的 `kr-krx stamp_duty`（PwC Tax Summaries）、`au-asx FTT`（Baker McKenzie M&A Guide）此前在 note / source title / ROADMAP 里被称「一手税法综述 / 一手源」——它们是第三方顾问综述（一手＝韩国《印花税法》/ ATO 裁定本身），`confidence` 已封顶 `medium` 合规，但表述夸大。全部改「第三方（律所 / 四大税务简报）综述」。`kr-krx stamp_duty` 保留 `type: none` 但 `note`/`zh`/`en` 标「第三方综述支撑、暂定」并转 OPEN-QUESTIONS。`elaw.klri.re.kr`（韩国法令英文版）、`ecfr.gov`（联邦法规）是真一手，不改。
- **B3（流程）· 补 5 个字段的 `verified: 2026-09-01`。** `kr-krx stamp_duty` / `kr-krx FTT` / `za-jse stamp_duty` / `us-nasdaq regulatory_fees` / `hk-hkex FTT` 均在 2026-09-01 按新源重核过，但只有 `au-asx FTT` 补了字段级 `verified`，其余继承 chapter-meta 的旧日期。按新源重核的字段应带当日 `verified`。
- **B4（数据）· 复核 A1 顺带删掉的 12 处第五章 `spec.note` 数字。** 逐条核对被删数字是否在兄弟字段有源：**5 处还原**（`fr-euronext` / `sg-sgx` / `uk-lse` 波动性中断的走廊阈值、`za-jse` ZA01 分段阈值、`tw-twse` 瞬间价格稳定 ±3.5%/2min——均在同文件 `price_limits` / `volatility_interruption` 的 `quote`/`zh` 逐字可查，文件级 5c〔见 B5〕下合法）；**6 处确认删除正确**（`au-asx` 澳分→澳元折算、`br-b3` "实务 R$0.01"、`tw-twse` 派生 `0.0014625%` 均为无源 / 派生值；`cn-szse` 价格笼子 `102%/98%` 与 `ch-six` 「随机 30 秒」在本所文件里**哪都没有**——后者 SIX 实为 2 分钟随机窗口，`30 秒` 系误植，5c 顺带纠了一个真错）。
- **B5（工具）· 5c 命中范围从「同字段」放宽到「本交易所文件内所有 `quote`/`zh`」。** 原「同字段」逼出「删除」作为默认修法，删掉了 `cn-szse 102/98` 之外一批**正确且在兄弟字段有源**的交叉引用数字。文件级保住合法交叉引用（`note` 引 `price_limits` 阈值），同时仍拦跨所造假（A 所费率写进 B 所字段在 B 所文件里找不到）。代价：同文件跨字段数字碰撞的漏报风险略升（`cn-szse 102` 就因碰撞 5c 放行、靠人工核对才发现无源）——**5c 全绿不代表 note 数字都有源，仍需抽检**。实现见 `collect_verbatim_texts`。
- **B6（工具）· `NOTE_NON_VALUE_RE` 补法规引用号剥离。** 探针确认 `17 CFR 240.31`→误报 `17`/`240.31`、`RTS 11`→误报 `11`。补 `\d+ CFR \d+`、`RTS \d+`、`MiFID [IVX]+`、`(EU) YYYY/NNN`、`Procedure N`、`Ref N/YYYY`、`No. N` 等。
- **B7（工具）· B「收紧到 quote+zh」校准为「文件级 quote/zh + 本字段 detail」。** 实测「彻底去掉 detail」会打到 [ADR-045] 起的既定写法——「主档费率进 `spec`/`zh`、次级档进同字段 `detail`」（次级档常无 verbatim quote，放 `detail` 比塞 `zh` 更合 §一）。只把**本字段自己的 detail** 并进目标，不吃全文件 detail。
- **B8（文档）· `ROADMAP` 下一步列表编号 6→5 重编；`us-nasdaq regulatory_fees` 补 eCFR『covered sale』逐字引文（经 eCFR versioner API 2026-09-01 核实——`/current/` HTML 页对自动客户端设访问闸；`.cache/us-nasdaq/` 已手动播种，post-merge 可 `make fetch-sources EX=us-nasdaq` 复核）；本「收尾审查修订」段本身。**

**收尾审查验证：** `make check` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK；`make sync` 二次幂等；5c 正负向探针复跑通过（跨所造假拦下、跨字段合法引用放行、法规引用号不误报）。

**日期（收尾修订）：** 2026-09-02

---

### ADR-059 — Phase 3 第四棒：上市生命周期剖面的设计定案 + 章节级 `only_spot` 标记 + 两段时长 spec

**背景：** Phase 3 剩余四个章节可视化模块（上市生命周期 / 监管图 / 参与者 / 风险旗标）的第一棒，也是 Phase 4 单页画布合并的硬前置之一（[ADR-057] #4）。第六章《上市、持续监管与退市》20 家数据已相当完整（× 10 字段基本 high/medium），但只在矩阵两列 + 档案页散文里呈现，零可视化——「一只票怎么上来、上来后守什么、怎么下去、下去之后去哪」是交易员认知一个陌生市场的一层，与盘中机制、交割同等重要。[ADR-036] #5 裁定的「`listing` 章节级『仅现货适用』标记」也挂在「Phase 3 做第六章可视化时一并落地」——`de-eurex` 现在用 9 个「N/A —…」medium 占位字段硬凑第六章，OPEN-QUESTIONS #17 还挂着。

**流程：** 先做仿真数据 MVP 原型（三个虚构「示例所」× 中英 × 明暗，验证时间轴形态 / 诚实三态 / `only_spot` 折叠 / 语言开关 / 零构建，未落库），用户看过确认形态可以，7 个设计轴按推荐项定案。本 ADR 记设计定案 + 数据层落地；渲染层（`renderListingLifecycle` + 顶层 tab）留后续棒，与 [ADR-045]/[ADR-047]、[ADR-048]/[ADR-050]/[ADR-051] 的「设计→数据层→渲染层」分棒同构（数据层文件集 = `schema/` + `data/` + `PROJECT/`，与前端三件套零重叠）。

**定了什么（7 个设计轴，全取推荐项）：**

1. **时间轴形态 = 一条水平「证券的一生」轴。** 顺序：`上市审核 → 上市流程周期 → 挂牌 → 持续义务存续带 →〔停牌/复牌 ↻ 回环〕→ 退市触发 → 退市流程 → 退市整理期 → 退市后去向`，一条连续基线串起全程。阶段块**等宽示意**（一家公司上市多久没有固定值，不按真实时长比例），**唯「上市流程周期」「退市整理期」两块**画按 `spec` 实际月数的比例填充条（满条 = 9 个月）+ 时长标签。
2. **板块体系。** 多板 → 挂牌点上方一条板块阶梯 + 左侧 ↕ 转板箭头（tooltip 带 `transfer_between_boards` 规则）；单板 → 挂牌点上方一行紧凑标签「板块：X」，无阶梯无箭头；`transfer` 缺省 → 无箭头。
3. **停牌/复牌 = 存续带中段一个 `↻` 回环 motif**（复用 [ADR-051] 交割管线衍生品泳道的循环视觉语言），琥珀色（`--warn`）；`suspension_resumption` 缺省 → 不画回环。
4. **退市路径不分叉。** `delisting_conditions` 拆「定量触发 / 违规触发」两行进红色触发框（挂在退市触发菱形节点下方，与成本瀑布「主图 + 常驻附注」同版式）；退市流程单线，不区分主动 / 强制退市为两条泳道。
5. **merge-ready 锚定（逐条答 [ADR-057] 清单）：**
   - **锚定关系**：独立分区。时间尺度 = **证券的一生（年）**，与「市场机制剖面」的一个交易日（分钟）、「交割管线」的成交后 T+N 天，构成同一只证券的三级时间缩放（右下角标注尺度免责）。不共用 x 轴、不叠加在剖面平面上。
   - **占位**：合并画布里常驻显示、默认展开；纵向约 1 块（≈ 剖面主图的 1/2 高），横向满宽。
   - **诚实三态**（[ADR-035] D）：缺省 → 阶段块虚线框 +「未记录」，不画填充条；`type: none` → 不画块，代之以基线上一个空心点 + 说明（如「无整理期，摘牌日停止交易」）；`null`（存在未公布）→ 触发框斜体灰「规则未公开具体数值」，不留白不臆造。分区缩小后仍成立（三态提示是块级 / 节点级，不依赖大面积留白）。
   - **语言开关**：从第一版即接 `t()` / `tSel()` / `fieldLabel` / `enumDisplay`（[ADR-049] 教训，[ADR-051]/[ADR-055] 已照做）。
   - **零构建**：手写 SVG + vanilla JS，配色 / 字体用主站 `styles.css` 令牌，线条语言复用 [ADR-040] 表（红 = 退市路径、绿 = 存续、琥珀 = 停复牌、蓝 = 板块）。
6. **小型 `spec` 补充只加两段时长**（`listing_process_duration` / `delisting_transition_period`），`boards` 不加 spec（list 结构已够）。
7. **`de-eurex` 第六章处置** = 章节级 `only_spot` 标记（见下），不引入「按交易所类型的章节条件适用」大改。

**章节级 `only_spot` 标记（承接 [ADR-036] #5，把 [ADR-020] 的 `optional` 机制推广到章节级）：**

- **`schema/taxonomy.yml`**：`listing` 章加 `only_spot: true`——语义是「纯衍生品交易所可将本章整体标记为不适用」，不是自动豁免。
- **`data/exchanges/de-eurex.yml`**：`listing._meta.not_applicable: true` + 一条 `note` 说明「Eurex 为衍生品交易所，不上市公司；对应概念是交易员准入（见 participants）与合约挂牌（见 products）」；**删掉原 9 个「N/A —…」leaf 字段 + `boards: []`**（占位散文是 [ADR-036] #5 之前的临时办法，标记落地后是死重）。
- **`tools/sync.py`**：`chapter_status` 在 `count_chapter_leaves` 之前短路——章节 `only_spot: true` 且该所 `_meta.not_applicable: true` → 返回新状态 **`➖`**（不计入完成度、progress-matrix 显 `➖`）；`compute_freshness` 同样跳过该章（不产 freshness 行，health-summary 分母减）；`expand_object_chapter` 把 `_meta.not_applicable` 透传进 `docs/data/exchanges/<id>.json` 的 `chapters.<ch>._meta`，给渲染层棒一个干净的「本章不适用」信号（其余 `_meta` 字段仍按既有机制继承进各字段信封，不单独透传）。
- **`tools/validate.py`**：新不变式机器校验——`_meta.not_applicable: true` 只允许出现在 taxonomy 里标了 `only_spot: true` 的章节（否则 err）；被标 N/A 的章节里不允许再有带 `zh` 的 leaf 字段（保持干净，否则 err）。两条 `compute_freshness` 调用点（`sync.py` 主流程 + `validate.py` 生成块新鲜度）都传 `raw_exchanges[eid]`，否则两侧 health-summary 会算不一致。
- **生成块预期变动**：`progress-matrix` 仅 `de-eurex` 第 6 列 ✅→`➖`；`health-summary` 仅 `de-eurex` 已填字段 80→71（总 1864→1855）。其余 19 家第六章 progress / health **零变动**（加 `spec` 不改 `zh`，不产新 freshness 行、不改 `chapter_status`）；`matrix.json` 少 30 行（de-eurex 的 `review_system`/`delisting_conditions` 两个 `in_matrix` 字段随之从矩阵消失——衍生品所本就不该有公司上市 / 退市维度）。

**两段时长 `spec` 形状（`schema/spec.yml` 新增，键 `listing.listing_process_duration` / `listing.delisting_transition_period` 共用）：**

- `value`（number，代表值，与 `unit` 同单位）/ `unit`（`business_days` / `trading_days` / `calendar_days` / `weeks` / `months`）/ `range`（`[min, max]`，可选——板块 / 注册路径 / 境内外不同导致的跨度）/ `type: none`（仅规则明确不设此时长且有正面原文依据时）/ `note`（可选）。
- **只有能从 `quote` 拿到干净数字的交易所才填。** 20 家里实际可结构化的：
  - `listing_process_duration` **5 家**：`br-b3`（12/39 工作日，按 CVM 注册路径）、`fr-euronext`（8 周 / 15 工作日按板块）、`hk-hkex`（30/40 营业日监管确认窗口）、`kr-krx`（45/65 工作日按境内外）、`sa-tadawul`（6–12 个月，medium）。
  - `delisting_transition_period` **3 家**：`br-b3`（≤30 日临时交易窗口）、`ca-tsx`（第 30 个日历日，过渡期内继续受 TSX 约束）、`uk-lse`（决议后 ≥20 个工作日，证券持续交易至取消生效）。**刻意不收** `hk-hkex`（18 个月「订明补救期限」是「强制除牌前的整改窗口、期间停牌」，与「退市决定后可继续交易的整理期」是两回事，满条填充会视觉误导）与 `us-nyse`（Form 25 生效前证券多已停牌，非可交易缓冲期）——两者散文承载、转 OPEN-QUESTIONS。
- **其余 12 家 spec 缺省是预期，不是缺口**：多数市场不设法定固定时长（`au-asx`/`ca-tsx` 上市侧 /`ch-six`/`sg-sgx`/`za-jse` 明确「无硬性法定期限」），或唯一来源把数字拼写成英文单词 / 中文数字（`jp-jpx`「about four months」/「一年」、`cn-szse`「十五个交易日」、`de-xetra`「three months」、`us-nasdaq`「four to six weeks」——5b 逐字数字反查拿不到）。散文承载，`OPEN-QUESTIONS` 记下「有拼写数字、缺可逐字反查一手 quote」的几家（`jp-jpx` 上市/退市、`cn-szse` 退市整理期、`kr-krx` 退市整理卖出 7 交易日、`hk-hkex`/`us-nyse` 退市语义）。
- `validate.py` 5b（`confidence: high` + spec 数值 ⊆ quote）对 ≥2 位数字自动生效：`br-b3` 12/39/20、`fr-euronext` 15、`hk-hkex` 30/40/60、`kr-krx` 45/65、`ca-tsx`/`br-b3` 30、`uk-lse` 20 均已逐字核对在 quote 里；`sa-tadawul`（medium）5b 不跑、`range [6,12]` 的 12 溯源自本文件 `zh`「6–12 个月」；单位 / `type` 是字符串不进 5b；`note` 里数字走 5c 文件级反查。

**分棒 —— 留给渲染层棒的清单：** `docs/assets/app.js` 的 `renderListingLifecycle` / `llBuild`（手写 SVG 生命周期轴，按上述 7 轴 + 诚实三态）+ `docs/index.html` 顶层 tab「上市生命周期 / Listing Lifecycle」（排「交割管线」后，tab 数 6→7）+ 路由键 `listing-lifecycle` + `docs/assets/styles.css` `.ll-*` + 档案页第六章折叠逻辑（`de-eurex`）+ Chrome headless 截图核对。新代码从一开始接语言开关。MVP 原型（仿真数据，不落库）已验证形态，可作渲染层参考。

**没改：** 前端（渲染层留后续棒，避让 / 分棒同 [ADR-050]）；`taxonomy.yml` 的两个时长字段不加 `spec:` 标记（taxonomy 里根本没有 `spec:` 标记这回事，spec 形状纯在 `schema/spec.yml` 按 `chapter.field` 键定义、`validate.py` 按键查）；`review_system` 已是 enum，不动；其余第六章字段不加 spec。

**验证：** `make build` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 二次幂等；新不变式已加 `validate.py` 机器校验 + 三个探针复跑通过——① `not_applicable` 放非 `only_spot` 章 → 拦；② `not_applicable` 章塞带 `zh` 的 leaf → 拦；③ 新时长 spec 注入 quote 里没有的数字（`97`）→ 5b 拦。生成块变动仅 `de-eurex`（progress `✅→➖` + health 80→71 + matrix -30 行），逐条核对符合预期。**本棒触及约 17 个字段（8 spec + de-eurex 9 字段清理），在 [CLAUDE.md §四] 的「> 30 字段第二人独立复核」硬门槛之下——协调者做了逐条 spec-vs-quote 自检；渲染层棒前建议再过一遍 8 个 spec 的语义忠实度（尤其两个「时长块只画真实跨度」的字段）。**

**日期：** 2026-09-02

---

**渲染层落地（2026-09-03）** — 把 MVP 原型移植进主前端，纯前端三文件（`docs/assets/app.js` +370 / `docs/assets/styles.css` +24 / `docs/index.html` +1），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化。

- **`app.js` `renderListingLifecycle` / `llBuild`**：手写 SVG「证券的一生」水平轴（`W=1180` viewBox）：板块阶梯 → 连续基线上的 `上市审核 → 上市流程周期 → 挂牌 → 持续义务存续带 →〔停复牌 ↻〕→ 退市触发 ◆ →〔触发条件框〕→ 退市流程 → 退市整理期 → 退市后去向`。节点 / 阶段块全部 `<g class="td-hit" data-role="cell" data-chapter="listing">` 包裹 → 点击复用 `openCellOverlay`（不新增浮层代码）。从第一版接 `t()` / `tSel()` / `dv()` / `enumDisplay` / `exchangeDisplayName`。
- **诚实三态**照 [ADR-035] D 分岔：字段有 `spec.value` → 阶段块内画按月数比例的填充条（`llDurInfo` 把 `business_days`/`trading_days` 归一 ÷21，满条 = 9 个月）+ 时长标签；`spec.type: none`（仅 `delisting_transition_period`）→ 不画块、基线上一个空心点 +「无整理期 / 摘牌日停止交易」；有散文无 spec → 块内按块宽估字数的极短裁剪 + 全文进 `<title>` + 点击浮层；整字段缺省 → 虚线块 +「未记录」。`delisting_conditions` 缺省时不画空红框，只在触发点下一行灰字「触发条件未记录」。
- **`review_system`**：enum label 偏长（"交易所审核+监管机构平行注册"），图上用 `LL_REVIEW_SHORT` 短名（"审核 + 平行注册"），全称进 `<title>` / 顶栏派生描述 / 出处浮层。
- **板块阶梯**：`boards.length > 1` 画阶梯 + `transfer_between_boards` 有内容画左侧 ↕ 转板箭头（`<title>` 带规则）；`=== 1` 一行紧凑标签；`> 5`（`ch-six` 11 个）折成前 4 行 +「+N 个板块」。
- **纯衍生品所折叠**：`data.chapters.listing._meta.not_applicable`（数据层 `expand_object_chapter` 已透传）→ `llCollapsed`（一条虚线 + 说明）+ `llProse(true)`，不画时间轴。档案页 `renderObjectChapter` 同一信号 → 折叠为一行说明卡（取代逐字段渲染 9 个空信封）。
- **接线**：顶层 tab「上市生命周期 / Listing Lifecycle」排「交割管线」后（tab 6→7）；路由键 `listing-lifecycle`；`LL_DEFAULT_EX = "hk-hkex"`；`change` 事件加 `ll-exchange` 分支。`styles.css` `.ll-*` 复用 `.td-svg` / `.td-plot-wrap` / `.td-legend` / `.td-hit` / `.td-sw`，只加字号与令牌。
- **验证**：`make build` 全绿（`validate` 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK——新串全走 `t()`/`tSel()`）；Chrome headless 核对 `hk-hkex`（1 spec + 停复牌 + 缺 `delisting_conditions`）/ `br-b3`（双 spec + 6 板块）/ `uk-lse`（EN + 暗色 + `delisting_process` 缺省虚线）/ `za-jse`（全填无 spec）/ `de-eurex`（折叠）+ 档案页 de-eurex 第六章 + 交割管线 / 剖面无回归。**已知局限**：① 有散文无 spec 的阶段块内文字是硬裁剪片段（"This field captur…"），全文在 `<title>` + 浮层——真正解法是给更多所补时长 spec（数据层）；② 停复牌 `↻` 字形偏淡；③ 7 个 tab 在窄屏靠既有 `@media` 换行。

**渲染层日期：** 2026-09-03

---

### ADR-060 — 数据空缺复核轨：`optional` / `not_applicable` 下沉到字段级 + 五任务分解

**背景：** [ADR-020]（2026-08-17）做过一次全库空值率审计，定了 `count_chapter_leaves()` 的**分组级** `optional`（`market_structure.derivatives` 先例），并把「其余约 21 个 Category B 字段」的回填**留给用户排期**。2026-09-03 重跑一次全库空缺实算（`sync.expand_exchange` 逐所展开 + `count_chapter_leaves` 口径，空缺 = 无 `zh` 的 leaf）：2,171 个适用槽位、已填 1,855（85%）、空缺 316；另有 62 处已填但 `confidence: low`（`risks.fx_risk_note` 近全库、`kr-krx` 13 处成簇，余零散）。这次把 316 处分类到可执行粒度，并落地 [ADR-020] 欠的排期。

**六桶分类（316 处空缺）：**

| 桶 | 处数 | 内容 | 处置 |
|---|--:|---|---|
| A | 58 | `overview` 的 `market_cap_usd_bn` / `annual_turnover_usd_bn` / `global_ranking` / `listed_companies_count` | **搁置** → leaf 级 `optional` |
| B | 50 | 现货所 `clearing` 的 `initial_margin_practice` / `maintenance_margin_practice` / `mark_to_market_frequency` / `last_trading_day_rule` | leaf 级 `not_applicable`（[ADR-030] 已定现货无此概念） |
| C | 40 | ~9 家 `clearing.derivatives.*` 与 `market_structure.derivatives.*` 残余（主体已 [ADR-021] 补齐） | 真缺口 → 任务三 |
| D | 10 | 单层板块所 `listing.transfer_between_boards` | leaf 级 `not_applicable` |
| E | 10 | `risks.*_note` / `costs.implicit_costs_note` | 不动（[ADR-020] 点 4 已定：结构性 low/medium，不为此改结构） |
| F | 148 | 真实研究缺口 | 任务二（横切 8 高频字段 ≈ 70）+ 任务四（旗舰所逐所 ≈ 78） |

真正要抓取回填的 ≈ 188 处（F + C）。

**三个决策点（2026-09-03 用户拍板）：**

1. **A 桶 = 搁置。** 不改字段名（`*_usd_bn` 留）、不强制回填、不接汇率换算展示层。理由：这 4 个是 `volatility: volatile` 的市场运行结果快照、非「写进规则的机制」、不驱动任何可视化——「美元硬口径 + 必填 + volatile」三者叠加是无止境维护。落地 = leaf 级 `optional`。计价口径的实质决定（改名存本币 vs 展示层换算）留 `PROJECT/OPEN-QUESTIONS.md` #41，维持打开、注明「已明确搁置，日后再议」。
2. **建字段级 `not_applicable` 机制。** 把 [ADR-059] 的章节级 `only_spot` / `_meta.not_applicable` 下沉到字段级，B + D 桶 60 处据此移出完成度分母。
3. **作为与 Phase 3 并行的横切轨。** 不打断在做的 viz 模块；任务一先做（纯收益前置），任务二三穿插 viz 模块间，任务四建议 Phase 4 合并启动前完成（**非硬前置**——Phase 4 硬前置仍是四个 viz 模块，[ADR-057] #4），任务五按触发点。

**字段级标记设计（任务一实装，本 ADR 只定形状与语义）：**

- **`optional`（taxonomy 侧）**：`schema/taxonomy.yml` 的 leaf 字段定义加 `optional: true`。语义 = 「填了算数、空着不算缺口」。`tools/sync.py` `count_chapter_leaves()` 现只对**分组**识别 `optional`，扩展到 leaf：`optional: true` 且未填 → 不计入 `total`；已填（`cn-sse` / `ca-tsx` 的本币值）正常计入并要求 confidence。`compute_freshness()` 对空 `optional` leaf 不产 freshness 行。
- **`not_applicable`（data 侧）**：数据文件字段信封写 `not_applicable: true`（与 `zh` / `confidence` 同级）。语义比 `optional` 强 = 「本所设计前提不成立」。`count_chapter_leaves()` / `compute_freshness()` 跳过；`expand_field` 透传进 `docs/data/exchanges/<id>.json` 给渲染层信号。逐所仍写一句 `detail`。
- **`tools/validate.py` 新不变式**：标 `not_applicable` 的字段不得再有 `zh`（否则 err）；`optional`（taxonomy）与 `not_applicable`（data）不同层，同一字段不应同时生效——加探针。
- **两者区别**：`optional` = 项目优先级选择（可回填）；`not_applicable` = 该所现实（不可填）。前端：`optional` 空 → 「未记录」；`not_applicable` → 「设计前提不适用」灰条。
- **生成块预期变动**：`progress-matrix` 若干 `overview` / `clearing` 格 🟡→✅；`health-summary` 分母减、已填字段数不变（这些本就没填）；`de-eurex` 不受影响。具体数字任务一落地时核。

**五任务**（进度与验收判据见 `PROJECT/ROADMAP.md` 三节「数据空缺复核轨」）：

1. 字段级 `optional` / `not_applicable` 机制 + A/B/D 桶标注（本 ADR 实装，1 会话，不抓取）
2. 横切 8 高频字段批量回填（`odd_lot_handling` 12 / `dark_pool` 10 / `board_lot_size`·`price_limits.other_boards`·`block_trade` 各 9 / `connect_schemes`·`intraday_reversal` 各 8 / `holidays_note` 7）
3. 9 家衍生品子章残余补全（C 桶 40）
4. 5 家旗舰所深度补全（`us-nyse` 15 / `hk-hkex` 13 / `uk-lse` 13 / `cn-sse` 11 / `jp-jpx` 9）
5. 抓取基础设施：`tools/fetch.py` 通用 OTP-AJAX 两步抓取（`kr-krx`）+ `za-jse` 缓存重建 + `tools/validate.py` stale 清单输出

**没定 / 留后续：** A 桶计价口径实质决定（OPEN-Q #41）；任务二～五各自执行时的抽检 / 第二人复核按 [CLAUDE.md §四]；任务五 OTP-AJAX 若 `kr-krx` 单点不划算则回退降级方案（人工 PDF）；stale 复核节奏是否固化进 `CLAUDE.md` §八（宪法改动走 §一 程序）待任务五时评估。

**本 ADR 不动代码**：只加本条 + `PROJECT/ROADMAP.md` 进度条目。字段级标记的机器校验随任务一实装（[CLAUDE.md §四]：新不变式必须同时加 `validate.py` 检查——任务一的验收判据已列）。

**日期：** 2026-09-03

---

### ADR-061 — Phase 3 第五棒：监管图 Regulation Map 的设计定案 + 数据层评估（无需 spec）

**背景：** Phase 3 剩余四个章节可视化模块（上市生命周期 / 监管图 / 参与者 / 风险旗标）的第二棒，Phase 4 单页画布合并的硬前置之一（[ADR-057] #4）。第三章《监管与法律环境》8 个字段（`regulator` / `self_regulatory_org` / `clearing_regulator` / `core_laws` / `foreign_ownership_limit` / `capital_controls` / `disclosure_requirements` / `investor_protection`）目前只在对比矩阵两列 + 档案页文字块里呈现，零图形——交易员接触陌生市场的一阶问题恰是「谁在管、外资能不能进、钱能不能出去、出事赔不赔」，这几个字段把它们分散在章内各处，没有一屏把它们收敛成「一眼读懂这座市场的监管截面」。

**流程：** 沿用 [ADR-059] 三棒走法。① 先做仿真数据 MVP 原型（三个虚构市场样本 × 中英 × 明暗，验证四层纵向槽位 / 空白虚线态 / 长文多辖区 / 暖色法律基座 / 语言开关 / 零构建，**未落库**、放 `/tmp/rm-mvp/`），形态验证通过；② 数据层评估结论 = **本棒零 spec 需求**（见轴 6），无 schema/data 改动；③ 渲染层（`renderRegulationMap` + 顶层 tab + 路由 + `.rm-*` 样式）留本 ADR 文末的渲染层棒。设计轴在无人值守自动续跑会话中按推荐项定案（未能像 [ADR-048]/[ADR-059] 那样现场 Q&A——如用户对任一轴有异议，可在本棒两个 commit 上直接回滚重排，本 ADR 即回滚依据）。

**定了什么（7 个设计轴）：**

1. **形态 = 一张固定槽位的「监管截面」单画布（手写 SVG，`W=1180`，与 [ADR-059] 同版式）。** 第三章 8 字段全为散文（机构名 / 法名 / 制度描述），无量化机制值可结构化成 bar / 轴——图的几何只能来自**语义槽位**：每个字段固定槽位、跨 20 家位置不变，「换所即对比」。诚实渲染走 [ADR-035] D（结构定形 → 散文硬裁剪 + 全文走浮层），与 [ADR-059] 的「有散文无 spec 的阶段块」同一处置。
2. **四层纵向「监管截面」（自上而下，回应交易员三个一阶问题）：**
   - **监管主体（谁在管）**——`regulator`（政府监管机构）/ `self_regulatory_org`（自律组织）/ `clearing_regulator`（清算监管机构）三卡横排，左缘色条 `--info`。
   - **法律基座（依什么法）**——`core_laws` 满宽单卡（`--warn-soft` 底 + `--warn` 描边），作整图视觉底座。
   - **外资与资金（钱怎么进出）**——`foreign_ownership_limit`（外资进入与持股）/ `capital_controls`（资本跨境进出）两卡并排，左缘色条 `--accent`（呼应「通道」语义）。
   - **透明与保护**——`disclosure_requirements` / `investor_protection` 两卡并排，左缘色条 `--info`。
   四层顺序 = 监管 → 法 → 资金闸门 → 保护网，线性推进、槽位稳定。
3. **每卡结构**：卡内顶部角色头（`fieldLabel("regulation", path)` 双语取 taxonomy label，langMode 跟随）+ 正文 `dv(env)` 经 [ADR-059] `llWrap` 按卡宽折 ≤4 行 + 截断省略号；全文进 `<title>`、点开走 `openCellOverlay`（复用现有出处浮层）。卡宽按层定档：监管三卡 312、法律基座整宽 984、闸门 / 保护层两卡 480，全图 y 坐标固定、不随内容伸缩。
4. **诚实三态（[ADR-035] D）**：有值 → 实心卡 + 左缘色条；**null / 缺省 → 虚线边框 + 居中斜体「未记录 not recorded」，不画左缘色条**；**本章无 `type:none` 形态**——8 字段无 spec，`type:none` 语义不存在，三态在本模块实际退化为「有值 / 未记录」两态（`detail` 草稿注记的诚实呈现与 [ADR-049] 方案 B ③ 同源，浮层里仍可见）。分区缩小后仍成立（三态提示是卡级，不依赖大面积留白）。
5. **merge-ready 清单（逐条答 [ADR-057]）**：
   - **锚定关系**：独立分区——时间 / 空间尺度 = 一座市场的制度截面，与主图剖面的「一个交易日」、交割管线「T+N 天」、listing-lifecycle「证券的一生」无共同 x 轴、不叠加；视觉呼应走主站令牌 + [ADR-040] 线条语言（机构 = 蓝 `--info`、资金通道 = 绿 `--accent`、法律基座 = 琥珀 `--warn`），与交割管线违约瀑布的 bearer 色同源。
   - **占位**：合并画布常驻显示、默认展开；纵向 ≈ listing-lifecycle 档位（约 0.8 主图高）、横向满宽。
   - **诚实三态 / 语言开关 / 零构建**：见轴 4 与 [ADR-049]/[ADR-035] 既有约定（卡头走 `fieldLabel`、合成文案走 `t()`、无第三方渲染库）。
6. **数据层评估 = 本棒不新增 spec、零 schema/data 改动。** 第三章 8 字段全是「机构名 / 法名 / 制度描述」，属 [ADR-035] B 不可结构化类；按「quote 撑得住才结构化」原则（[ADR-045]/[ADR-050]），无量化机制值可摘——spec 缺省是预期而非缺口。现网 9 处空白（hk-hkex 外资 / 资本 / 披露、us-nyse 外资、tw-twse 资本 / 投资者保护、de-xetra / fr-euronext / uk-lse 清算监管、fr-euronext 自律组织）是真实研究缺口、已分布在 [ADR-060] 任务二 / 四轨道（穿插 viz 模块间推进），**本棒不替数据层代劳、不造 spec 撑图表**——诚实虚线框就是当前数据层的正确呈现。
7. **纯衍生品所 = 全章适用，无 `only_spot`。** 第三章对衍生品所同样成立（de-eurex 有完整的监管 / 法律 / CCP 授权体系），[ADR-059] 的 `listing` 章级 `only_spot` 机制不适用于本章——本棒不引入新形态，de-eurex 走正常全章渲染。

**没改：** `data/` 与 `docs/data/`（无 spec、无枚举、不增字段）；`schema/`（`spec.yml` / `taxonomy.yml` / `enums.yml` 零 diff）；`tools/validate.py`（无新不变式——本棒未引入新结构）；[ADR-060] 五任务轨道不受影响。

**分棒 —— 留给渲染层棒（本 ADR 文末落实现）：** `docs/assets/app.js` 的 `renderRegulationMap` / `rmBuild`（手写 SVG，按上述轴 1–4；卡 `data-role="cell"` 复用 `openCellOverlay`；`llWrap` 复用）+ `docs/index.html` 顶层 tab「监管图 / Regulation Map」（排「上市生命周期」后，tab 数 7→8）+ 路由键 `regulation-map` + `styles.css` `.rm-*`。新代码从一开始接 `t()` / `tSel()` / `fieldLabel` / `dv()` / `enumDisplay`。MVP 原型已做自检（`/tmp/rm-mvp/`，不落库）。

**验证（本棒 = 设计文档 + 数据层评估）：** MVP 截图（明 / 暗两态）四层槽位对齐、空白虚线 / 实心左缘差异可见、法律基座暖色、中英卡头随 langMode 正确切换；`make build` 基线不受影响（未触碰任何被扫描文件）。

**日期：** 2026-09-03

---

**渲染层落地（2026-09-03）** — 把设计定案移植进主前端，纯前端三文件（`docs/assets/app.js` +171 / `docs/assets/styles.css` +19 / `docs/index.html` +1），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化。

- **`app.js` `renderRegulationMap` / `rmBuild`**：手写 SVG（`W=1180`）固定槽位纵向四层——监管主体三卡（`regulator`/`self_regulatory_org`/`clearing_regulator`，左缘 `var(--info)`）→ 法律基座 `core_laws` 满宽暖色卡（`--warn-soft` + `--warn`）→ 外资与资金两卡（`foreign_ownership_limit`/`capital_controls`，左缘 `var(--accent)`）→ 透明与保护两卡（`disclosure_requirements`/`investor_protection`）。卡 = `<g class="td-hit" data-role="cell" data-chapter="regulation">`、点击复用 `openCellOverlay`；从第一版接 `t()` / `tSel()` / `fieldLabel` / `dv()` / `llWrap`（[ADR-059] 折行复用；`rmWrap` 按内容 CJK / 拉丁推 `per`）。
- **诚实三态（本章无 spec，退化为两态）**：有值 → 实心卡 + 左缘色条 + 角色头（`fieldLabel`）+ 正文折 ≤ 4 行 + 全文进 `<title>`；**缺省 → 虚线框 + 居中斜体「未记录 / not recorded」**——现网 9 处空白如实呈现（hk-hkex 外资 / 资本 / 披露、us-nyse 外资、tw-twse 资本 / 投资者保护、de-xetra / fr-euronext / uk-lse 清算监管、fr-euronext 自律组织），均为真实数据缺口、不造 spec 撑图表（轴 6）。
- **merge-ready 逐条**：锚定关系 = 独立分区、无共同 x 轴 / 不叠加（与剖面一个交易日、交割 T+N、listing 证券一生构成「同一市场四视角」）；占位 = 合并画布常驻、默认展开、纵 ≈ listing 档、横满宽；语言开关从第一版接（图例 / lane label / prose 全走 `t()`，卡头走 `fieldLabel`）；零构建（手写 SVG + 主题令牌，无新增 CSS 变量）。
- **接线**：顶层 tab「监管图 / Regulation Map」排「上市生命周期」后（tab 数 7→8）；路由键 `regulation-map`；`RM_DEFAULT_EX = "sg-sgx"`；`change` 事件加 `rm-exchange` 分支；`styles.css` `.rm-*`（含图例 `.rm-lg-solid / .rm-lg-dash / .rm-lg-key`）。`check_ui_i18n` OK（新串全走 `t()` / `tSel()`）。
- **验证**：`make build` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）；Chrome headless 核对 `sg-sgx`（EN + 暗色）/ `fr-euronext`（中文 + 亮色，多辖区长文 + 2 空白）/ `hk-hkex`（中文，闸门区 2 空白 + 保护层 1 空白）——四层槽位对齐、虚线 / 实心差异可见、卡头随语言切换正确、其余视图无回归。**已知局限**：① 卡片正文按卡高硬裁剪 ≤ 4 行（全文在 `<title>` + 浮层；长文卡「先摘要后全文」散文精修属数据层活，不进渲染层）；② 空白虚线卡点击后浮层无正文（部分空白带 `detail` 草稿注记，en 态走 `zhNoteBlock` 折叠）；③ 槽位 y 坐标固定使全 20 家图高一致、空白多的市场纵向留白一致（诚实呈现，非 bug）。

**渲染层日期：** 2026-09-03

---

**视觉修订（2026-09-03，接审查反馈）** — 审查方对长文所（`cn-sse` / `za-jse` / `uk-lse` / `hk-hkex` / `sa-tadawul`）× 亮暗做 headless + SVG 几何实测（`<g data-path>` 的 `<rect>` 右沿 vs 卡内 `<text>` 行右端）：**卡内密排 CJK 长行越过卡片右沿约 6px**。根因 `rmWrap(text, w, …)` 传的 `innerW` 是整卡宽，正文实际从 `x+14` 起排、右侧还要留白，而 `per` 只扣了 4px。修：`rmWrap` 改扣 24px（14 左内边距 + 10 右内边距），`per` 43/27（cardW2/cardW3）。修后几何复测每卡右侧余量 ≥14px、纵向本就无裁剪（末行 y 远在卡底之上）。纯前端一处、`data/` 与 `docs/data/` 零 diff。**未修**：中英混排时 Latin 词 / 数字被 `llWrap` 的 CJK 逐字切分从中间断开（`Recognis|ed`、`20|26年`）——与 `renderListingLifecycle` 共用 `llWrap` 的既有局限，改需两模块一起上更聪明的混排折行，超出本次范围，记 [ADR-061] 已知局限④。设计七轴（四层固定槽位 / 暖色法律基座 / 诚实两态）经审查确认，不回滚。

**视觉修订日期：** 2026-09-03

### ADR-062 — 数据空缺复核轨任务一实装：leaf 级 `optional` / 字段级 `not_applicable` 机制 + A 桶标注；B/D 桶勘误回 F

**背景：** [ADR-060]（2026-09-03）把任务一定为"A 桶 4 字段标 `optional`、B+D 桶 60 处标 `not_applicable`、清 ≈ 116 处结构性幽灵缺口"。实装前逐所核对 `data/` 现状，发现 **B/D 桶的"不适用"前提不成立**，需要勘误后再落地。

**B/D 桶勘误（用户拍板，2026-09-03）：** 原六桶分类把 60 处空缺按字段名粗分为"现货所 `clearing` 保证金四字段不适用"（B 50）与"单层板块所无转板"（D 10），但逐所核对后：

- **B 桶**：空缺所的现货市场几乎都已被证实存在对应机制——`au-asx` 现货由 ASX Clear（现金市场 CCP）清算（其 `default_management` 首层即"参与人缴存的保证金"）、`us-nyse`/`us-nasdaq` 有 NSCC Required Fund Deposit、`uk-lse`/`fr-euronext` 走 LCH EquityClear、`de-xetra` Eurex Clearing 承担 CCP 职能、`ca-tsx` 现货由 CDS 清算、`cn-sse`/`cn-szse`/`tw-twse` 交易所层面融资融券、`jp-jpx`/`kr-krx` 有信用取引/信用거래。这些是**可回填的真实研究缺口**（`tw-twse` 已按此先例填了 `initial_margin_practice`/`maintenance_margin_practice`），标 `not_applicable` 会写入"本所无此机制"的假断言。
- **D 桶**：`listing.transfer_between_boards` 空缺的 10 家（`br-b3`/`ch-six`/`cn-sse`/`cn-szse`/`hk-hkex`/`jp-jpx`/`sg-sgx`/`uk-lse`/`us-nasdaq`/`us-nyse`）几乎全是多板块结构且转板机制真实存在（`hk-hkex` GEM→主板、`jp-jpx` Prime/Standard/Growth、`sg-sgx` Catalist→Mainboard、`us-nasdaq` 三档、`uk-lse` AIM→Main…），现有 detail 也自述"未核实留空"——是研究缺口而非结构不适用。
- **结论**：B+D 桶整体回 F 桶（真实研究缺口，并入任务二/四回填），任务一**不标任何字段级 `not_applicable`**；该机制仍落地（代码 + 校验器 + 探针），留待真正"本所设计前提不成立"的场景（现有唯一先例是 [ADR-059] 的章节级 `only_spot`）。结构性幽灵缺口实为 A 桶 58 处 + [ADR-059] 已落地的 de-eurex 章节级 9 处。

**定了什么（任务一实装）：**

1. **A 桶 = leaf 级 `optional`（taxonomy 侧）**：`schema/taxonomy.yml` 的 `overview.market_cap_usd_bn` / `listed_companies_count` / `annual_turnover_usd_bn` / `global_ranking` 四个 `volatility: volatile` 市场结果快照字段标 `optional: true`。语义同 [ADR-020] 的分组级 `optional`：填了算数、空着不算缺口——空不计入 `chapter_status()` 完成度分母、不产 freshness 行；已填正常计入并要求 confidence。
2. **`tools/sync.py` 机制扩展**：
 - `count_chapter_leaves()` 把分组级 `optional` 的识别扩展到 leaf；新增字段级 `not_applicable`（data 侧信封标记）整字段跳过。
 - `compute_freshness()` 跳过字段级 `not_applicable`（空 optional leaf 因无 zh 本就不产行）。
 - `expand_field()` 透传信封中的 `not_applicable`（dict 原样保留，不裁剪），前端可据此渲染"本所不适用"信号。
3. **`tools/validate.py` 两条新不变式（机器化）**：抽 `field_na_violations()` 纯函数（便于正负向探针），对每个标 `not_applicable: true` 的字段信封：① 不得再有 `zh`（N/A = 干净空，与 [ADR-059] 章节级同构）；② 同一字段不得同时带 taxonomy 侧 leaf `optional` 与 data 侧 `not_applicable`（两层语义不同，[ADR-060] 决策点 2）。正负向探针通过。
4. **不改** `data/exchanges/*.yml`（B/D 回 F，无 N/A 落地）、不改前端（`not_applicable` 渲染留到真正使用时按 [ADR-059] 的 `_meta` 先例做）。

**验证：** `make build` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 二次幂等。生成块变动仅 `progress-matrix` 第 2 列 12 家 🟡→✅（`au-asx`/`ca-tsx`/`cn-szse`/`de-eurex`/`de-xetra`/`jp-jpx`/`kr-krx`/`sg-sgx`/`tw-twse`/`uk-lse`/`us-nasdaq`/`us-nyse` 的 overview 章随 A 桶 optional 分母缩小到 ✅）；`health-summary` 无变化（optional 只改完成度分母，freshness 行只计已填字段，B/D 未落地 N/A）——比 [ADR-060] 预期的"health 分母减"窄，属勘误后的正确预期。未动 `quote` / 已填 `zh`。

**日期：** 2026-09-03

---

### ADR-063 — 不变式纯函数的合成用例自检：`tools/selfcheck.py` 接入 `make check`

**背景：** [ADR-059] 章节级 `not_applicable`、[ADR-062] 字段级 `not_applicable` 与 leaf/分组级 `optional` 完成度豁免，判定逻辑都抽成了纯函数（`chapter_na_violations` / `field_na_violations` / `count_chapter_leaves` / `chapter_is_not_applicable`），落地时各跑一次"正负向探针"就丢。审查（2026-09-03）指出：B/D 桶勘误回 F 后**全库无一处真实 `not_applicable`**，`validate.py` 里这两条检查跑不到自己的核心分支，`field_na_violations` 若回归，首次真正使用前无人拦。[CLAUDE.md §四] 要求"新引入的不变式已加机器校验"——检查本身加了，但探针不入库 = 覆盖不可重复。

**定了什么：**

1. **新增 `tools/selfcheck.py`（stdlib，无 pytest）** —— 把那批探针固化成 `(name, got, want)` 用例表，喂**合成输入**锁住纯函数在"当前无真实数据触发"分支上的行为。当前 24 条：`field_na_violations` 6（含 YAML 字符串 `"true"` 不触发的兜底）、`chapter_na_violations` 6、`count_chapter_leaves` 8（普通 / leaf `optional` 空与非空 / 字段级 `not_applicable` / 分组 `optional` 空与非空——[ADR-020] 回归护栏）、`chapter_is_not_applicable` 4。失配 → 打印 `got`/`want` + 退出码 1。
2. **接入 `make check`**，排在 `validate.py` 前（最快、纯逻辑、不读 `data/`）。
3. **`validate.py` 抽 `chapter_na_violations()` 纯函数** —— [ADR-059] 的章节级判定此前内联在 `validate_data` 里，抽出来与 `field_na_violations` 对齐（调用方先算好"该章展开后仍带 zh 的 leaf 路径"再传进来，函数无 I/O），`selfcheck.py` 才能复用同一判定。内联调用点行为等价。

**为什么不上 pytest（用户 2026-09-03 明确）：** 项目此前无 `tests/`、无测试依赖，`make check` 已是"stdlib 脚本挨个跑"的形态。为几个纯函数引一套 pytest + 目录约定 + 依赖，比问题本身重。`selfcheck.py` 与 `check_ui_i18n.py` / `check_en_terms.py` 同形态——一个自带用例、`sys.exit` 表态、`make check` 串起来的脚本。

**边界：** `selfcheck.py` 只测**判定纯函数**，不测 `validate.py` 对真实 `data/` 的扫描（那是 `validate.py` 自己的职责，跑真数据）。真实数据一旦用上 `not_applicable`（未来 B/D 之外真有"设计前提不成立"的字段 / 章节），`validate.py` 的真数据校验自然接管，`selfcheck.py` 仍守合成边界用例。

**今后：** 新增或改动一条不变式纯函数时，在 `selfcheck.py` 补对应正负向用例——和写 `validate.py` 检查是同一个动作（[CLAUDE.md §四] 的操作化落点）。

**验证：** `make build` 全绿（`selfcheck` 24/24、`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 二次幂等、`docs/data/` 零 diff。负向探针：注入一条必失配用例 → `main()` 退出码 1，确认失配会红。`validate.py` 重构后 20 家扫描结果不变（`de-eurex` 的 `listing._meta.not_applicable` 仍正常通过、无新误报）。

**日期：** 2026-09-03

---

### ADR-068 — 数据空缺复核轨任务二实装：横切 8 高频字段批量回填清零

> **编号说明：** 本条实装于 2026-09-04（PR #62），原始 commit 写作 ADR-065——与并行 PR #58「成本瀑布数据层残差」（见下条，[ADR-066] 的编号链已确认其为 065）撞号。#62 合并时冲突未清理即入 `main`，`make check` 因「ADR 编号重复」+ ROADMAP 生成块重复转红。事后让号 **068**（066 风险旗标 / 067 成本瀑布长尾均已占用）。教训：栈式并行分支合并前必跑 `make build`（[CLAUDE.md §四 / §六]）。

**背景：** [ADR-060] 把任务二定为「`odd_lot_handling`(12) / `dark_pool`(10) / `board_lot_size`(9) / `price_limits.other_boards`(9) / `block_trade`(9) / `connect_schemes`(8) / `intraday_reversal`(8) / `holidays_note`(7) 在所有缺失所填到带 `quote` 的 high/medium，或确认 `not_applicable` 并写 `detail`」，方法明确「按字段而非按所推进（保证跨所口径一致）」。2026-09-04 一个后台会话分 8 个 commit（每字段一个）执行完毕。

**做了什么（8 字段逐条）：**

| 字段 | 结果 | 关键决策 |
|---|---|---|
| `intraday_reversal` | 8 家清零（`ca-tsx`/`ch-six`/`de-xetra`/`fr-euronext`/`sa-tadawul`/`uk-lse` medium `t0` + `au-asx`/`sg-sgx` 复核）；`de-eurex` → `not_applicable` | 消极认定范式（见下）；已 `in_matrix: trading_mechanism` |
| `holidays_note` | 3 家回填（`au-asx` high / `br-b3`·`us-nasdaq` medium）；`ca-tsx`/`uk-lse`/`ch-six`/`de-eurex` 4 家因官方交易日历是 JS-SPA 维持 low，记 OPEN-Q + tried-URL 清单 | JS-SPA 阻塞降级（见下） |
| `connect_schemes` | 8 家回填 + 3 家 low→medium/high（`kr-krx`/`cn-sse` high，含 CME/Eurex 夜盘、沪港通逐字原文） | `de-eurex`/`fr-euronext` 如实说明「无股票互联互通」对衍生品所范畴不适配（框架性问题 #17） |
| `board_lot_size` + `odd_lot_handling` | 缺失所清零（`us-nasdaq`/`us-nyse` 17 CFR 242.600(b) 定义 high；`sa-tadawul`/`hk-hkex`/`jp-jpx` 官方规则 high；余 medium）；`de-eurex` 两字段 → `not_applicable` | 数值年份不入 `zh` 只入 `detail`（避开 5b 反查假阳性，见 [ADR-032] 教训） |
| `price_limits.other_boards` | 9 家回填；`de-eurex` → `not_applicable`；`fr-euronext` low→medium；`kr-krx` 维持 low（KONEX 未证实）| **不加 `in_matrix`**（见下） |
| `block_trade` | 10 家（8 high / 2 medium）：`de-eurex` TES Block Trades·`jp-jpx` ToSTNeT·`ch-six` off-order-book 延迟公布·`sg-sgx` Direct Business 门槛·`uk-lse` LIS/negotiated·`hk-hkex` HKFE 815·`us-nyse` Rule 127·`us-nasdaq` FINRA 5270 为 high；`fr-euronext` Euronext Block·`ca-tsx` Cross facilities 为 medium | `de-eurex` **不**标 `not_applicable`（Eurex 确有 TES Block Trades）；`ca-tsx` CIRO/UMIR 跨市场 block 门槛因 `ciro.ca` Cloudflare 403 未取到，记 OPEN-Q |
| `dark_pool` | 10 家：`au-asx`（ASX Centre Point）·`br-b3`（B3 Midpoint）·`us-nyse`（Reg ATS 17 CFR 242.300）为 high；`hk-hkex`/`in-nse`/`jp-jpx`/`kr-krx`/`sa-tadawul`/`sg-sgx` medium；`de-eurex` → `not_applicable` | 字段口径「仅记与本所并列的独立机制」——`au-asx`/`br-b3` 是本项目仅有的「本所自营暗池」肯定案例；`in-nse`「NSE Alpha 暗池」二手说法查无一手依据、判为不实 |

净效果：全库已填字段 1,900 → 1,918（+18；`de-eurex` 5 字段 `not_applicable` 不计入）；8 个字段的结构性空缺清零（`holidays_note` 余 4 家为降级留空、已文档化）。

**反复出现、影响后续做法的决策：**

1. **消极认定（negative inference）作为 `medium` 的合法依据。** `intraday_reversal` 6 个发达市场所：通读交易规则手册后「不含持有期 / 交收前不得卖出限制」+ 与中国 A 股 T+1 明文条款对照 → 填 `enum: t0` / `medium` / `detail` 显式写「消极认定」。这**不是** [ADR-054] 的反模式（那是「费率页没列 = 不征收」）——区别在于：同日转售禁令若存在，会是交易规则里的显眼条款（像 A 股那样），其缺席是有信息量的；而税率页的沉默不能证伪一个税种。范式：消极认定可支撑 `medium`，升 `high` 需正面官方陈述。
2. **`not_applicable` 的边界。** `de-eurex` 5 个字段（`intraday_reversal`/`board_lot_size`/`odd_lot_handling`/`price_limits.other_boards`/`dark_pool`）标字段级 `not_applicable`——判据是「本字段的设计前提（现货持有期 / 板手 / 碎股 / 板块涨跌停 / 竞争性暗池生态）对纯衍生品所结构性不成立」，与 [ADR-059] 章节级 `only_spot` 同源。**但 `block_trade` 与 `connect_schemes` 不标 `not_applicable`**：Eurex 确有 TES Block Trades（真实机制、可填 high）；`connect_schemes` 虽「无股票互联互通」但可如实描述 Eurex 的跨境直接准入形态。「概念不适配」≠「无内容可填」——能如实描述实际形态的就填、不能的才 `not_applicable`。这是 [ADR-062] 「B/D 桶回 F」判断的延续：`not_applicable` 是最后手段。此前全库无真实字段级 `not_applicable`（[ADR-063] 记录），本轮 `de-eurex` 5 处是首次实际使用，`validate.py` 的 `field_na_violations` 两条不变式（无 `zh` / 不与 leaf `optional` 并存）首次跑到真实数据分支、通过。
3. **`price_limits.other_boards` 不进对比矩阵。** 覆盖率达 19/20（≥16 阈值），按 [ADR-060] 需「评估补 `in_matrix`」。评估结论：**不补**。该字段内容结构异质——有的「无分层板块」、有的给创业板 / SME 板幅度、有的描述衍生品合约带、`us` 两所是「LULD 按指数分层非按板」——无法归约为矩阵列所需的可比标量；`price_limits.main_board`（已 `in_matrix`）已承载涨跌停的矩阵相关信号。`intraday_reversal` 本就有 `in_matrix`，无需改动。`schema/taxonomy.yml` 零改动。
4. **JS-SPA 交易日历阻塞的降级。** `ca-tsx`/`uk-lse`/`ch-six`/`de-eurex` 的官方年度交易日历页是纯前端渲染，curl 与 WebFetch 都只拿到外壳。按 [CLAUDE.md §三] 降级：`holidays_note` 维持 low 留空，OPEN-Q 记具体 tried-URL 清单待人工投喂或任务五渲染型抓取器，**不**据往年骨架或第三方推断填写。
5. **规则手册重编号要重抓当前版。** `sg-sgx` Direct Business 从 SGX-ST Rule 8.7 重编为 8.10（缓存的旧版仍写 8.7）——子代理转述与现行版本不一致时以现场重抓的官方页为准（`verify_quotes` 反查的是本地缓存，故必须重抓入缓存）。
6. **大文件缓存截取。** `us-nyse` 的 `NYSE_Rules.pdf` 28MB，`verify_quotes` 每次 `make check` 都要读——缓存 PDF 原件 + 手工把 `pdftotext` 结果截到 Rules 70–127 段（约 500KB）作 `.txt` 伴随，兼顾可核查与构建速度。
7. **子代理调研 + 本地缓存直读互补。** 两个 `dark_pool` / `block_trade` 调研子代理各跑约 15–18 分钟收集官方 URL + 候选原文，主线负责抓取入缓存 + `verify_quotes` 反查 + 填写。一处子代理漏判被本地缓存直读纠正：`br-b3` 有自营中点暗池 **Midpoint**（《Trading Procedures Manual》Title II 明文「not displayed in the Market Data」），子代理因 B3 的 PDF 未解析而判「无」。

**踩坑（已在提交中修复）：** `sg-sgx` `block_trade` 首个 commit 的 `Edit` `old_string` 含了下一字段 `dark_pool` 的空信封、`new_string` 未带回 → 空 `dark_pool` 字段被删（`make check` 不报错，因缺字段=缺口非错误）。`dark_pool` commit 一并恢复并填充。教训同 kr-krx `derivatives:` 键删除（早前会话）——**编辑某字段时，`old_string` 若纳入了下一个键，`new_string` 必须原样带回**。

**第二人独立复核（[CLAUDE.md §四]，待人工）：** 本轮触及约 74 个字段填写（8 字段 × 约 9–12 家），远超「> 30 字段须第二人独立复核」阈值。后台会话无法充当真正的第二个视角——**本条目打勾前的第二人复核尚未进行，标为待人工**。已做的自检：每字段批 `make check` 全绿（`verify_quotes` 对 26 个新 high-confidence 字段逐条反查缓存 FAIL=0）、`make sync` 幂等、跨字段口径一致性自查（如「本所自营暗池 vs 市场有第三方」两栏在 `dark_pool` 10 家统一表述）。

**验证：** `make build` 全绿（`selfcheck` 24/24、`validate` 20 家 0/0、`verify_quotes` OK=1023 / FAIL=0 / CACHE_MISS=77 均为既有无关字段、`check_ui_i18n` OK）、`make sync` 二次幂等。新增来源域名登记 6 个（`info.gov.hk` / `jsri.or.jp` / `nextrade.co.kr` + `asic.gov.au` / `fsc.go.kr` 补子链）。

**已知局限（下一迭代点）：** ① `holidays_note` 4 家 JS-SPA 待人工 / 渲染型抓取；② `ca-tsx block_trade` CIRO UMIR 6.6 跨市场 block 门槛待人工原文；③ `dark_pool` 5 家 medium（`hk-hkex` SFC 操守准则第 19 段 / `sg-sgx` MAS RMO 现行待遇 / `kr-krx` NXT 市场规则 / `jp-jpx` FSA-PTS 细则 / `in-nse` SEBI 正面禁止性表述）可日后升 high，均已记 OPEN-Q。

### ADR-065 — 成本瀑布数据层残差处理：`side` / `type: none` / 触发点残差逐条坐实

> **编号说明：** ADR-064 由并行会话的「参与者图设计定案 + 数据层评估」占用（见 auto-memory），本条取 065 避让。

**背景：** [ADR-054] 成本瀑布 spec 层核查（103 个 `costs` spec 第二人复核）留下 13 个 `type: none` 降级点 + 6 个 `side`/费率补强点；[ADR-058] A2/A3 坐实了一部分，收尾审查又回退了两处（`hk-hkex FTT` → `rate: null`、`za-jse STT side: buy` → 保留待补）。ROADMAP「下一步 #1」把剩余项列为「成本瀑布数据层残差（按触发时点推进）」，明细在 OPEN-QUESTIONS #88。本条是这批残差的一轮集中处理（2026-09-04）。

**共同模式（承接 [ADR-054] 三类系统性缺口）：** 断言「本市场不征某税费」需税法/税务局/立法机构的**正面**文本；`side` 方向键需来源逐字方向措辞（quote / zh / detail 三处任一），未取到则**保留值 + 记 OPEN-Q**（渲染层 `cwSide()` 对缺省回退 `both`，移除单边税键错得更远，[ADR-054] 裁定细则）。

**逐条结果：**

| 字段 | 处理前 | 处理后 | 依据 |
|---|---|---|---|
| `uk-lse stamp_duty` `side: buy` | high，quote 无方向措辞、待补 | ✅ 坐实，`verified: 2026-09-04` | HMRC / gov.uk『Tax when you buy shares』：『When you buy shares, you usually pay a tax or duty of 0.5%』『You pay tax when you buy』（非 SPA 页、curl 常规 UA 200，已入 quote + `.cache/uk-lse`） |
| `za-jse stamp_duty` `side: buy` | high，quote 无方向措辞、[ADR-058] 收尾回退为「保留待补」 | ✅ 坐实，`verified: 2026-09-04` | SARS『Securities Transfer Tax』页『Who is it for?』段：member/participant 为法定纳税人但『may recover the tax payable from the persons to whom the securities were transferred』——买方（受让人）最终承担。措辞已入 quote，并顺带把 `.cache/za-jse` 从 0/空重建到含本页（该所缓存此前坏，见 SOURCES.md） |
| `kr-krx stamp_duty` `type: none` | medium，[ADR-058] 标「暂定、仅 PwC 支撑」 | ✅ `type: none` 由「暂定」转「一手条文 + 第三方佐证」，`verified: 2026-09-04`，confidence 维持 medium | 韩国《印花税法》(Stamp Tax Act) 英文版第 1 条（elaw.klri.re.kr hseq=64499，同 STT Act 已登记域名）：印花税纳税义务人为『文书制备者』、课税对象是文书而非证券转让。translation 页标注 for-reference-only，故 confidence 不升 high |
| `ca-tsx regulatory_fees` | medium `rate: null`，[ADR-054] 从 `type: none` 降级，理由「来源主题错配、查不到」 | ✅ 实质修正：`rate: null` 保留（无固定比率），但从「查不到」改为「查到了——是浮动费」，`verified: 2026-09-04` | OSC Bulletin 24-0154（osc.ca 托管的 CIRO 费模型征求意见公告，第 8 节复述现行模型原文）：CIRO《Equity Market Regulation Fee Model》为成本回收制，按 Message Processing Fee + Trade Fee 两部分对 Marketplace 成交按月征收、由 Participants（券商）缴纳。ciro.ca 官网仍 403，续用 OSC 托管件 |
| `hk-hkex financial_transaction_tax` `type: none` | medium `rate: null`，[ADR-058] 收尾回退 | ⏸️ 维持 `rate: null`，**按「审慎终态」关闭**（不再作待抓项跟进），`verified: 2026-09-04` | 香港列举式税制，IRD 所辖征费为封闭清单（Stamp Duty / Estate Duty / Betting Duty / Hotel Accommodation Tax / Business Registration），其中无「证券交易税 / FTT」条例——比一般税法典国家的「未提及」更接近否定，但仍是推断（『无该条例』≠ 官方正面排除），铁律二.4 不足以翻 `type: none` |
| `us-nyse` / `us-nasdaq regulatory_fees` FY2027 | high，$20.60/百万（2026-04-04 起） | ⏸️ 无数据变更，`verified: 2026-09-04` | SEC「Fee Rate Advisories」列表页 2026-09-04 复核：Latest Section 31 仍为 FY2026 公告（Feb. 27, 2026），FY2027 Section 31 公告尚未发布（历年在当年 2–4 月出）。触发点仍挂 OPEN-Q，$20.60 现行 |
| `kr-krx exchange_fees` 到期后现行费率 | medium `rate: 0.0023`（[ADR-054] 移除 `tiered`） | ⏸️ 无 rate 变更，sourcing 强化（+KED Global），`.cache/kr-krx` 补 | KED Global（第三方）：KRX『single fee rate of 0.0023% for nearly 20 years』、2025-12 阶梯下调『initially in effect for two months』、永久性下调须经 FSC 市场效率委员会审议。到期后 KRX 当期收费表 JS 化未取到一手确认——仍挂 OPEN-Q |

**没改：** `spec.rate` / `spec.type` 的实质值除 ca-tsx 的框架描述外均未动（本轮是「坐实既有值」不是「改值」）；渲染层（成本瀑布 SVG 无改动）；`schema/`；`tools/`。

**验证：** `make check` 全绿（`selfcheck` 24/24、`validate` 20 家 0/0、`verify_quotes` OK=1001 / FAIL=0 / CACHE_MISS=77〔含 za-jse 未重建缓存的既有态〕、`check_ui_i18n` OK）、`make sync` 二次幂等。触及 7 个字段（< [CLAUDE.md §四] 的 >30 字段第二人复核门槛），协调者逐条 spec/quote-vs-source 自检；每条改动均带 `.cache/` 落盘凭据（除 `sec.gov` 走 Fair Access UA 外均常规 UA）。生成块变动仅 `matrix.json` / `freshness.json`（zh/en 文本 + `verified` 日期 + `has_detail` 派生），`progress-matrix` / `health-summary` 零 diff。
### ADR-064 — Phase 3 第六棒：参与者图 Participant Map 的设计定案 + 数据层评估（无需 spec）

**背景：** Phase 3 剩余章节可视化模块的第三棒（首棒 [ADR-059] 上市生命周期、第二棒 [ADR-061] 监管图），也是 Phase 4 单页画布合并的硬前置之一（[ADR-057] #4）。第九章《市场参与者》6 个字段（`investor_structure` / `membership_structure` / `broker_landscape` / `account_opening_requirements` / `suitability_management` / `foreign_access_channel`）目前只在档案页文字块里呈现，零图形——交易员接触陌生市场的一阶问题是「谁在场上跟我做对手盘（机构还是散户、本地还是外资）、我怎么才能进场、如果我是外资走哪条道」，这几个字段把答案分散在章内各处，没有一屏把它们收敛成「一眼读懂谁在这个市场里」。第九章数据相当完整（6 字段全库 M/H，仅 6 处真实空白，均在 [ADR-060] F 桶轨道）。

**流程：** 沿用 [ADR-059]/[ADR-061] 三棒走法。① 先做仿真数据 MVP 原型（两个虚构市场样例 + 一个设计轴变体 × 中英 × 明暗，验证三层槽位 / 接入链 / 外资平行道 / 诚实两态 / 语言开关 / 零构建，**未落库**、放 `/tmp/pt-mvp/`），用户看过**确认形态按此定案**；② 数据层评估结论 = **本棒零 spec 需求**（见轴 5，用户拍板取纯散文），无 schema/data 改动；③ 渲染层（`renderParticipantMap` + 顶层 tab + 路由 + `.pt-*` 样式）留后续棒，与 [ADR-059] 的「设计 / 数据层 → 渲染层」分棒同构（MVP 原型即渲染层参考）。

**定了什么（7 个设计轴，用户 2026-09-04 拍板轴 1–7；轴 5 取「纯散文」）：**

1. **形态 = 固定槽位的「参与者截面」单画布（手写 SVG，`W=1180`，与 [ADR-059]/[ADR-061] 同版式）。** 第九章 6 字段全为散文（占比描述 / 机构名 / 法定义务），无量化机制值可结构化成 bar / 轴——图的几何只能来自**语义槽位**：每个字段固定槽位、跨 20 家位置不变，「换所即对比」。诚实渲染走 [ADR-035] D（结构定形 → 散文按卡宽 / 卡高硬裁剪 + 全文走 `<title>` + 点击 `openCellOverlay`），与 [ADR-059]/[ADR-061] 的同类处置一致。

2. **三层纵向槽位（自上而下 = 交易员三个一阶问题）：**
   - **谁在场上**——`investor_structure` 满宽单卡，左缘色条 `--info`。这是「跟谁做对手盘」的一句话画像（机构 / 散户 / 本地 / 外资的成交占比描述）。
   - **我怎么进场**——`membership_structure` → `broker_landscape` → `account_opening_requirements` → `suitability_management` 四张节点卡横排成一条「接入链」，节点间 → 箭头，链末一个终点节点「你」（`--accent-soft` 底 + `--accent` 描边的小圆，上方 `终端投资者 / end investor` 小标）。前两环（会员 / 经纪，中间机构层）左缘 `--accent`；后两环（开户 / 适当性，准入门槛）左缘 `--warn`。节点带序号 1–4。
   - **外资走哪条道**——`foreign_access_channel` 满宽平行道单卡（右侧留一条并入通道），左缘 `--accent`；一条肘形虚线（`--accent`、`stroke-dasharray`）从卡右沿上折汇入接入链的**同一终点「你」**，卡下一行 caption 说明语义：「外资可在『会员』环直接并入（直接会员），或整体绕过前几环（额度 / 互联互通）」。
   三层顺序 = 场上人口 → 接入链 → 外资通道，线性推进、槽位稳定。

3. **接入链方向 = 机构侧 → 终端投资者**（交易所接纳会员 → 会员 / 经纪面向客户 → 开户 → 适当性门槛 → 你），**不加独立「交易所」起点节点**——交易所是隐含的链头，画出来占空间、无新信息。

4. **外资通道 = 平行道汇入同一终点**，不做「在某一环精确并入」的连线——各所并入点不同（直接会员在链首、QFII 额度 / 互联互通整体绕过），精确连线会把某一家的形态当通用形态、误导读者。用「平行道 + 肘形虚线汇终点 + 一行 caption」表达「另一条通向同一目的地的路」。

5. **`investor_structure` = 纯散文卡，不加 spec（用户 2026-09-04 拍板，与 [ADR-061] 先例一致）。** 该字段散文里常带硬百分比（港交所机构 53% / 散户 20% / 境外 43%，LSE 境外 58.8%），MVP 的「样例 C」把「加 `investor_structure.spec`（`by`: turnover/accounts + `segments` 数组）」的迷你构成条形态画了出来供权衡。权衡结论取**纯散文**：① 口径不统一——各所报告基准不同（成交额 vs 账户数、本地/外资 vs 机构/散户），强行进同一根 100% 堆叠条会制造可比性假象；② `confidence` 多为 medium、`volatility: moderate` 需年更，spec 化会把年更负担 + 5b 数值反查 + 口径字段 + 第二人复核都引进来；③ 「机构主导还是散户主导」的一眼判断，散文首句同样能承载。**本章因此 6 字段全散文、零 spec**——与 [ADR-061] 监管图同构。

6. **merge-ready 清单（逐条答 [ADR-057]）：**
   - **锚定关系**：独立分区——尺度 = 一座市场的「参与者截面」，与主图剖面的「一个交易日」、交割管线「T+N 天」、上市生命周期「证券的一生」、监管图「制度截面」无共同 x 轴、不叠加；构成「同一市场的第五个视角——谁在里面」。视觉呼应走主站令牌 + [ADR-040] 线条语言：`--info` = 场上人口（与监管图监管主体 / 透明保护同源）、`--accent` = 接入通道（与监管图资金闸门、交割管线违约瀑布 bearer 同源）、`--warn` = 准入门槛（与监管图法律基座暖色呼应）。
   - **占位**：合并画布常驻显示、默认展开；纵向 ≈ 监管图档（约 0.8 主图高）、横向满宽。
   - **诚实两态 / 语言开关 / 零构建**：见轴 1 与 [ADR-049]/[ADR-035] 既有约定——卡头走 `fieldLabel("participants", path)`、合成文案走 `t()` / `tSel()`、无第三方渲染库；本章无 `type: none` 形态（6 字段无 spec），三态退化为「有值实心卡 + 左缘色条 / 缺省虚线框 + 居中斜体『未记录 not recorded』」两态（同 [ADR-061] 轴 4）。分区缩小后仍成立（三态提示是卡级 / 节点级，不依赖大面积留白）。

7. **数据层评估 = 本棒不新增 spec、零 schema/data 改动。** 第九章 6 字段全是「占比描述 / 机构名 / 法定义务」，属 [ADR-035] B 不可结构化类；按「quote 撑得住才结构化」原则（[ADR-045]/[ADR-050]/[ADR-061]），`investor_structure` 的百分比经轴 5 权衡后不 spec 化，其余 5 字段本无量化机制值——spec 缺省是预期而非缺口。现网 6 处空白（`cn-sse` 的 `investor_structure` / `suitability_management` / `foreign_access_channel`、`cn-szse` / `hk-hkex` / `us-nyse` 的 `foreign_access_channel`）是真实研究缺口、已在 [ADR-060] 任务二 / 四轨道，**本棒不替数据层代劳、不造 spec 撑图表**——诚实虚线框就是当前数据层的正确呈现。

8. **纯衍生品所（`de-eurex`）= 全章适用，无 `only_spot`。** 第九章对衍生品所同样成立——Eurex 有完整的「交易参与者准入」体系，这正是 OPEN-QUESTIONS #17 点名的「衍生品所对应概念（交易员 / 交易参与者准入）」；[ADR-059] 的 `listing` 章级 `only_spot` 机制不适用于本章。`de-eurex` 走正常全章渲染（`investor_structure` 对纯衍生品所可能偏薄，但 `membership_structure` / `foreign_access_channel` 等完全适用）。

**没改：** `data/` 与 `docs/data/`（无 spec、无枚举、不增字段）；`schema/`（`spec.yml` / `taxonomy.yml` / `enums.yml` 零 diff）；`tools/validate.py`（无新不变式——本棒未引入新结构）；[ADR-060] 五任务轨道不受影响；前端（渲染层留后续棒）。

**分棒 —— 留给渲染层棒：** `docs/assets/app.js` 的 `renderParticipantMap` / `ptBuild`（手写 SVG，按上述轴 1–4；卡 / 节点 `data-role="cell"` 复用 `openCellOverlay`；折行复用 [ADR-059] `llWrap` + [ADR-061] `rmWrap` 思路的 `ptWrap`）+ `docs/index.html` 顶层 tab「参与者图 / Participant Map」（排「监管图」后，tab 数 8→9）+ 路由键 `participant-map` + `styles.css` `.pt-*`。新代码从一开始接 `t()` / `tSel()` / `fieldLabel` / `dv()`。MVP 原型（`/tmp/pt-mvp/`，仿真数据、不落库）已验证形态，`ptBuild` 可直接移植其 `build()` 逻辑（三层槽位 + `envCard` + 接入链节点 + 终点「你」+ 外资平行道肘形连线）。

**验证（本棒 = 设计文档 + 数据层评估）：** MVP 截图（明 / 暗 × 中英）三层槽位对齐、接入链 4 节点 + 终点「你」+ 外资平行道汇入清晰、空白虚线 / 实心左缘差异可见、卡头随 langMode 正确切换；`make build` 基线不受影响（未触碰任何被 `sync.py` 扫描的文件——只改 `PROJECT/DECISIONS.md` + `PROJECT/ROADMAP.md`）。

**日期：** 2026-09-04

---

**渲染层落地（2026-09-04）** — 把设计定案移植进主前端，纯前端三文件（`docs/assets/app.js` +160 / `docs/assets/styles.css` +26 / `docs/index.html` +1），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化、`check_ui_i18n` OK。

- **`app.js` `renderParticipantMap` / `ptBuild`**：手写 SVG（`W=1180`）固定槽位纵向三层——① `investor_structure` 满宽单卡（左缘 `var(--info)`）→ ② 接入链 `membership_structure`→`broker_landscape`→`account_opening_requirements`→`suitability_management` 四张 `ptEnvCard` 节点（前两环 `var(--accent)` / 后两环 `var(--warn)`，节点序号 1–4，节点间 `<path marker-end>` 箭头）+ 终点小圆「你」（`--accent-soft` 底 + `--accent` 描边，上方 `终端投资者 / end investor` 小标）→ ③ `foreign_access_channel` 满宽平行道（宽度 `CW-132`，左缘 `var(--accent)`），肘形虚线（`stroke-dasharray`）从卡右沿汇入终点「你」+ 卡下 caption「外资可在『会员』环直接并入 / 整体绕过（额度 / 互联互通）」。卡 / 节点 = `<g class="td-hit" data-role="cell" data-chapter="participants">`、点击复用 `openCellOverlay`；从第一版接 `t()` / `tSel()` / `fieldLabel` / `dv()` / `exchangeDisplayName`。`ptWrap` 独立一份（同 [ADR-061] `rmWrap` 思路：整卡宽扣 24px 内边距、CJK 按字数 / 拉丁按词、委托 `llWrap`）。
- **诚实两态（本章无 spec / 无 `type:none`，退化为两态）**：有值 → 实心卡 `var(--bg-hover)` + 左缘色条 + 角色头（`fieldLabel("participants", path)`）+ 正文按卡高折行（满宽卡 3 行 / 节点卡 6 行）+ 全文进 `<title>`（≤200 字截断）；缺省 → 虚线框 + 角色头 + 居中斜体「未记录 / not recorded」。现网 6 处空白（`cn-sse` ×3、`cn-szse` / `hk-hkex` / `us-nyse` 的 `foreign_access_channel`）如实呈现虚线框，接入链箭头照常穿过缺省节点（链的视觉完整性不因单节点缺口断裂）。
- **接线**：顶层 tab「参与者图 / Participant Map」排「监管图」后（`index.html`，tab 数 8→9）；路由键 `participant-map`（`route()` 分派 + `change` 事件 `pt-exchange` 分支）；`PT_DEFAULT_EX = "hk-hkex"`；`styles.css` `.pt-*`（`.pt-title` / `.pt-sub` / `.pt-lane-l` / `.pt-lane-s` / `.pt-card-k` / `.pt-card-v` / `.pt-card-empty` / `.pt-node-n` / `.pt-end` / `.pt-conn`），图例复用 `.rm-legend` / `.rm-lg-*`。
- **顺带修 `.header-tabs`**：9 个 tab 在标准宽度下一行放不下，原 `display:flex; flex:1` 会压缩 flex 项把 CJK 标签从字当中折断（「对比矩\n阵」）。改 `flex-wrap: wrap` + `.tab-btn { white-space: nowrap }` —— 宽屏能放下时不换行，放不下时整块换到第二行（headless 实测 1440/1280/1024 三档均干净换行、无字内折断）。不预判 Phase 4 的「更多」入口形态（[ADR-057] 已把它留给 Phase 4）。
- **验证**：`make build` 全绿（`selfcheck` 24/24、`validate` 20 家 0/0、`verify_quotes` FAIL=0〔CACHE_MISS=1078 为 [ADR-044] worktree 未复制 `.cache/` 已知态〕、`check_ui_i18n` OK）、`make sync` 二次幂等、`docs/data/` 与生成块零 diff。Chrome headless 核对 `hk-hkex`（1 空白 + 停复牌无关，zh 亮）/ `cn-sse`（3 空白，zh 亮）/ `za-jse`（全填，EN 暗）/ `de-eurex`（纯衍生品，全填，zh 亮——全章渲染无 `only_spot`，轴 8 成立）/ `us-nyse`（1 空白，zh 暗）/ `uk-lse`（全填，EN）/ `br-b3`（全填，zh）× 1440/1280/1024 三档宽度：三层槽位对齐、接入链 4 节点 + 终点「你」+ 外资平行道汇入清晰、虚线 / 实心差异可见、卡头随 langMode 切换正确；`regulation-map` / `trading-day` / `matrix` 三视图无回归。
- **已知局限**：① 6 字段散文均较长（`broker_landscape` / `account_opening_requirements` 常 150–250 字），节点卡 6 行放不下 → 按卡高硬裁剪 + 全文进 `<title>` + 点击浮层（[ADR-035] D / [ADR-064] 轴 1 的既定处置，同 [ADR-059]/[ADR-061]）；真正解法是散文「先摘要后全文」精修，属数据层活。② 中英混排时 Latin 词 / 数字被 `llWrap` 的 CJK 逐字切分从中间断开（`Exchange Partic|ipant`、`CMN 4.37|3`）——与 `renderListingLifecycle` / `renderRegulationMap` 共用 `llWrap` 的既有局限（[ADR-061] 已知局限④），改需三模块一起上混排折行，超出本棒范围。③ 固定槽位使全 20 家图高一致、空白多的市场（`cn-sse`）纵向留白一致（诚实呈现，非 bug）。④ 窄于 1080px 时 SVG 在 `.td-plot-wrap` 内横向滚动（同 `rm-svg` / `ll-svg`，页面 body 不横向滚动）。

**渲染层日期：** 2026-09-04
### ADR-066 — Phase 3 第七棒：风险旗标 Risk Flags 的设计定案 + 数据层评估（零 spec + 一次 `fx_risk_note` 就地清）

**背景：** Phase 3 剩余章节可视化模块的第四棒（首三棒 [ADR-059] 上市生命周期 / [ADR-061] 监管图 / [ADR-064] 参与者图），也是四个 viz 模块里最后一个拿到设计 ADR 的。Phase 4 单页画布合并的硬前置（[ADR-057] #4）是四个模块**均落地**——参与者图与本模块的渲染层棒（外加本模块的 `fx_risk_note` 数据子棒）仍未做，Phase 4 尚未解锁。第十二章《风险与特殊考量》5 个字段（`fx_risk_note` / `political_risk_note` / `liquidity_risk_note` / `regulatory_change_risk_note` / `enforcement_note`）目前一列都没进对比矩阵（[ADR-020]/[ADR-022]：覆盖率个位数是数据缺口、不通过「重选列」掩盖），只在档案页散文里呈现，零图形——「这个市场**正在**改什么规则、被制裁 / 冻结过没有、流动性有多集中、谁在盯操纵」是交易员认知陌生市场的一层，与盘中机制、交割、上市、监管截面、参与者截面同等重要。

**本章与前三棒的结构性差异：** 第 12 章 5 字段全是分析性 `*_note` 散文——宪法「覆盖边界」段与 [ADR-020] 点 4 已定：这类字段（连同 `costs.implicit_costs_note`）**结构性停留在 `confidence: low/medium`**，因为没有一份官方文件会写「本国流动性风险是 X」。所以本模块里「我们对这条掌握到什么程度」本身就是要呈现的信息——不是脚注，是主信号。这决定了轴 3，也是本模块区别于监管图 / 参与者图（两者置信度多为 medium/high、退化为两态）之处。

**流程：** 沿用 [ADR-059]/[ADR-061]/[ADR-064] 三棒走法。① MVP 原型（3 个虚构市场「北岸 / 南港 / 海峡」× 中英 × 明暗，验证两泳道固定槽位 5 卡 / 置信度四态 / 「非评分」常驻声明 / 语言开关 / 零构建，**未落库**）——本次为 Artifact（`claude.ai/code/artifact/81c033eb…`）而非 `/tmp/`，因本棒在后台任务里跑、用户异步复核，Artifact 是更合适的复核载体；② 7 个设计轴按推荐 + 用户经 3 个结构化问题当场确认（形态 OK、按 7 轴定案 / 分组取「交易层面 vs 制度·地缘·执法」两泳道 / `fx_risk_note` 就地清纳入作独立数据层子棒）；③ 数据层评估见下（结论 = 零 schema/data 改动 + 一次 `fx_risk_note` 就地清子棒）；渲染层留文末分棒清单。

**定了什么（7 个设计轴）：**

1. **形态 = 一张固定槽位「旗标面板」单画布（手写 SVG，`W=1180`，与 [ADR-059]/[ADR-061]/[ADR-064] 同版式）。** 第 12 章 5 字段全为散文、无量化机制值可结构化成 bar / 轴（[ADR-035] B）——图的几何只能来自**语义槽位**：每字段固定位置、跨 20 家不变，「换所即对比」。**明确不做**：时间轴（本章无时序）、评分表盘 / 风险评级、热力图、市场排名——见轴 4。诚实渲染走 [ADR-035] D（结构定形 → 散文硬裁剪 ≤4–5 行 + 全文进 `<title>` + 点击走 `openCellOverlay`），与前三棒同一处置。
2. **两泳道分组（用户确认）：**
   - **交易层面**（`--info` 蓝，左缘色条）——`liquidity_risk_note` / `fx_risk_note` 两卡横排。
   - **制度 · 地缘 · 执法**（`--warn` 琥珀，左缘色条）——`regulatory_change_risk_note` / `political_risk_note` / `enforcement_note` 三卡横排。
   泳道颜色复用 [ADR-040] 线条语言 + [ADR-061]/[ADR-064] 的「蓝 = 主体 / 人口、琥珀 = 制度 / 门槛」呼应。
3. **置信度作一等视觉信号（本模块的区别性轴）。** 每卡显式标三档 + 空态共四态：`high`「有据可查」（具体规则 / 案例 + 逐字 `quote`）→ 实心旗标字形 + 全不透明左缘色条；`medium`「综合判断」（多项事实综合）→ 半填充旗标 + 0.6 色条；`low`「定性背景 · 无官方来源」→ 空心旗标 + 极淡斜纹卡底 + 0.3 色条；**缺省**「未记录」→ 虚线框 + 居中斜体 + 无旗标（真实数据缺口）。**关键语义**：旗标填充度 = 我们的取证程度，**不是**市场风险高低——图例与常驻声明都写明。**不复用 `.badge-low` 的红**（`--danger`）到卡面：红在风险语境会被误读成「高风险」；卡面置信度走中性梯度（accent 绿 → warn 琥珀 → faint 灰），红色 `.badge-low` 只出现在点开后的出处浮层（与全站一致）。
4. **「这不是风险评分」写进模块，不是脚注。** 常驻说明句（图下方，与成本瀑布「主图 + 常驻税注解」、上市生命周期「触发条件框」同版式）明确：本图汇总各市场**已写进规则 / 已发生**的风险信号（在途制度变更、已执行的制裁与暂停、公开在案的执法个案），**不打分、不给市场排名**；执行风险、真实市场冲击、流动性深度与买卖价差动态只能靠小额实盘暴露，不在本图、也不在本项目覆盖范围（宪法「覆盖边界」/ [ADR-020] / [ADR-042]）。这条直接化解「一个风险面板会不会被当成风险评级」的宪法顾虑。
5. **merge-ready 清单（逐条答 [ADR-057]）：**
   - **锚定关系**：独立分区。尺度 = 一座市场当下的风险姿态（非时间轴），与剖面「一个交易日」、交割「T+N 天」、上市「证券一生」、监管图「制度截面」、参与者图「参与者截面」无共同 x 轴、不叠加。视觉呼应走主站令牌 + [ADR-040] 线条语言（交易层面 = `--info`、制度地缘执法 = `--warn`，与监管图 / 参与者图 lane 色同源）。合并画布里与监管图 / 参与者图相邻（三者都是「市场级制度背景」，与前四个「同一只证券的多级时间缩放」分区并置）。
   - **占位**：合并画布常驻显示、默认展开；纵向 ≈ 监管图档（约 0.7 主图高），横向满宽。
   - **诚实三态**：本章降级是常态而非例外，退化为**四态**（有据可查 / 综合判断 / 定性背景 / 未记录）——比监管图 / 参与者图的两态更宽，因为置信度在本章携带信息。提示是卡级，不依赖大面积留白，分区缩小后仍成立。`type:none` 不适用（无 spec、无「本市场无汇率风险」这类正面断言）。
   - **语言开关**：第一版即接 `t()` / `tSel()` / `fieldLabel` / `dv()` / `enumDisplay`（[ADR-049] 教训）；`detail` 与 `*_note` 在 en 态走 `zhNoteBlock` 折叠（同 [ADR-061]/[ADR-064]）。
   - **零构建**：手写 SVG + vanilla JS + 主题令牌，无渲染库（[ADR-035] C）。
6. **数据层评估 = 零 schema/data 改动（本设计棒）+ 一次 `fx_risk_note` 就地清作独立数据层子棒。** 第 12 章 5 字段全是「分析性散文」，属 [ADR-035] B 不可结构化类，按「quote 撑得住才结构化」原则（[ADR-045]/[ADR-050]/[ADR-061]/[ADR-064]），无量化机制值可摘——`spec` 缺省是预期而非缺口，本模块与 [ADR-061]/[ADR-064] 同为零 spec。**但**承接 [ADR-020] 欠的 Category B、`ROADMAP` §一下一步点名的「`fx_risk_note` 就地清」：`fx_risk_note` 近全库 `confidence: low`（多家 `detail` 直接写「本次未附官方来源」「一般性市场认知」），可按各国央行 / IMF AREAER / 交易所自有外资指南补一手源升 medium（汇率**制度**——自由浮动 / 盯住 / 有管理浮动 / 资本项目状态——是可逐字记录的；「历史波动较大」这类定性判断仍停 medium，与宪法覆盖边界一致）；顺带填 3 处空的 `political_risk_note`（`cn-sse` / `hk-hkex` / `tw-twse`）、复核 `enforcement_note` 的 low 簇（`cn-sse` / `cn-szse` / `kr-krx`）。作**独立数据层子棒**（不并进本设计棒，保持设计棒零 data 改动、子棒可单独验收），排在渲染层棒之前或并行；与 [ADR-060] 任务二 / 四的横切回填目标一致，落地时并轨执行、不重复排期。
7. **纯衍生品所（`de-eurex`）= 第 12 章全章适用，无 `only_spot`。** `de-eurex` 有多币种敞口（`fx_risk`）、EU 制度变更（EMIR 3.0，`regulatory_change_risk`）、BaFin/ESMA 执法（`enforcement_note`）——数据已填、全 medium。[ADR-059] 的 `listing` 章级 `only_spot` 不适用于本章，走正常全章渲染，同 [ADR-061]/[ADR-064]。

**没改：** `data/` 与 `docs/data/`（无 spec、无枚举、不增字段——`fx_risk_note` 就地清是独立子棒，本棒不动）；`schema/`（`spec.yml` / `taxonomy.yml` / `enums.yml` 零 diff）；`tools/`（无新不变式——本棒未引入新结构，与 [ADR-061]/[ADR-064] 同）；前端（渲染层留后续棒，避让 / 分棒同 [ADR-050]/[ADR-059]/[ADR-061]/[ADR-064]）；[ADR-060] 五任务轨道（`fx_risk_note` 就地清与任务二 / 四的横切回填目标一致，落地时并轨执行）。

**分棒 —— 留给后续棒的清单：**

- **数据层子棒**：`fx_risk_note` 就地清 + 第 12 章 low 簇复核（见轴 6）。触及 > 30 字段则第二人独立复核（[CLAUDE.md §四]）；`make fetch` 补抓的央行 / 外资指南来源登记进 `PROJECT/SOURCES.md`。
- **渲染层棒**：`docs/assets/app.js` `renderRiskFlags` / `rfBuild`（手写 SVG，按轴 1–4；两泳道固定槽位 5 卡 + 置信度旗标字形 + 诚实四态；卡 `data-role="cell"` 复用 `openCellOverlay`；折行复用 `llWrap` / `rmWrap` / `ptWrap` 思路的 `rfWrap`）+ `docs/index.html` 顶层 tab「风险旗标 / Risk Flags」（排「参与者图」后——若参与者图渲染层先落地则 tab 数 9→10，否则按落地顺序）+ 路由键 `risk-flags` + `docs/assets/styles.css` `.rf-*` + 档案页第十二章**不折叠**（无 `only_spot`）+ Chrome headless 截图核对（含缺口多的所 / 长文所 × 明暗 × 中英）。新代码从一开始接语言开关。MVP 原型（Artifact，未落库）已验证形态，可作渲染层参考。

**验证（本棒 = 设计文档 + 数据层评估，纯文档）：** MVP 原型（明 / 暗 / 中英）两泳道槽位对齐、四态视觉差异可见（实心 / 半填 / 空心旗标 + 虚线缺口）、常驻「非评分」声明在位、卡头随 langMode 切换；改 `PROJECT/DECISIONS.md`（本条）+ `PROJECT/ROADMAP.md`（§三 Phase 3 新增第七棒条目、§一 两处同步）——两文件都不被 `sync.py` 扫描，`make check` 的 `validate` 20 家 0/0、生成块零 diff。

**并行分支双重撞号（同 [ADR-029]）：** 本条起初写作 ADR-064 → 撞并行后台会话「参与者图」的 ADR-064（`worktree-participant-map-design`，先 commit + push）→ 让号 065 又撞并行 PR #58「成本瀑布数据层残差」的 ADR-065（`worktree-cost-waterfall-residuals`，2026-09-03 更早）→ 最终让号 **066**、「第六棒」改「第七棒」。分支基于 `worktree-participant-map-design` 栈式叠放（stacked PR）；三条 unmerged 分支的 `PROJECT/DECISIONS.md` 插入点都在 ADR-063 之后，合并时按 [ADR-029] 用 merge 而非 rebase 处理，最终顺序不影响正文（ADR 编号是引用键，非物理顺序契约）。

**日期：** 2026-09-04

---

### ADR-067 — 成本瀑布数据层长尾：`type: none` 正面依据的结构性补齐 + cn 监管费现行标准

> **编号说明：** ADR-066 由并行会话的「风险旗标 Risk Flags 设计定案」占用（PR #59），本条取 067。承接 [ADR-065]「剩」段所列的 `type: none` 长尾。

**背景：** [ADR-054] 把 13 个 `type: none` 降为 `rate: null`（根因：把「费率页没列」当「不征收」）；[ADR-058]/[ADR-065] 逐条重抓，方法学结论是「税务局页只覆盖自身税种、不证伪 FTT/监管费，`rate: null` 是审慎终态」。但 [ADR-065] 收尾时对 `hk-hkex FTT` 用了一个更强的论证——**「该国某类税的完整立法把 X 并入征税范围、无独立 Y 税目」是结构性正面依据**（香港列举式税制虽仍判不足）。本条把这个论证范式系统应用到剩余长尾，并顺带把中国监管费换成现行标准。

**处理范式（本条确立）：** 当一国「证券交易环节的流转税」有一部**完整立法**（印花税法 / STT Act / 州印花税），且该法把证券交易明文并入征税范围、通篇无独立「金融交易税」税目时——按 [ADR-002] 语义把该税映射至 `stamp_duty`，则 `financial_transaction_tax` 判 `type: none`（confidence medium：这是对「该法即完整立法」的结构性推断，非法条明文否定句）。监管费同理：当一国证券监管机构的**经费来源立法**明定「政府拨款 + 机构层面分担金」、不含按交易计收时，`regulatory_fees` 判 `type: none`（与 `au-asx` 的 ASIC 机构征费先例同构）。

**逐条结果（8 字段，触及 7 家）：**

| 字段 | 处理前 | 处理后 | 一手/官方依据 |
|---|---|---|---|
| `cn-szse regulatory_fees` | 空 / low | ✅ 补齐 `rate: 0.02 permille`（证券业务监管费）| 发改价格规〔2018〕917号（ndrc.gov.cn，现行标准、无有效期限、废止 2016 标准）：『对上海、深圳证券交易所收取证券业务监管费，按股票交易额的0.02‰收取』 |
| `cn-sse regulatory_fees` | 0.02‰ / 2012 通知 + 「未再核实」hedge | ✅ 主来源换 2018 通知、去 hedge | 同上（顺带对齐 cn-szse） |
| `cn-szse` / `cn-sse stamp_duty` | `side: sell` 由人民网转载公告支撑 | ✅ `side: sell` 升为《印花税法》第三条一手 | 《印花税法》(fgk.chinatax.gov.cn 政策法规库) 第三条『证券交易印花税对证券交易的出让方征收，不对受让方征收』 |
| `cn-szse` / `cn-sse financial_transaction_tax` | `rate: null`（『检索未发现』/ 空）| ✅ `type: none` medium | 《印花税法》第一/二/三条把证券交易与合同/产权转移书据/营业账簿并列为印花税征税范围——中国交易环节税收的完整立法，无独立 FTT 税目 |
| `de-eurex stamp_duty` + `financial_transaction_tax` | 无源 `rate: null`（『N/A / 不作断言』）| ✅ `type: none` medium | 自持一份 de-xetra 已引的 Bundestag 文档（BT-Drs. 16/12571，Börsenumsatzsteuer 1991-01-01 废除）+ 结构性论据（衍生品合约无证券过户）；与 de-xetra FTT 同处置 |
| `za-jse financial_transaction_tax` | `rate: null` | ✅ `type: none` medium | SARS：STT『levied on every transfer of a security』（Securities Transfer Tax Act No. 25 of 2007）——南非证券交易环节的完整流转税立法；[ADR-002] 语义 STT→stamp_duty，故 FTT 判 `type: none` |
| `za-jse regulatory_fees` | `rate: null`，note 自相矛盾 | ✅ `rate: 0.0002 pct`（Investor Protection Levy）| sharenet 第三方券商费率表『Investor Protection levy at 0.0002% of trade value』（jse.co.za 三子域名 + WebFetch 全 Cloudflare 403；2026 据 Market Notice 37025 约 0.000345%，未一手核实）。confidence medium |
| `sg-sgx regulatory_fees` + `financial_transaction_tax` | `rate: null`（IRAS GST 页主题错配）| ✅ `type: none` medium | SGX-ST Rule 4.23.2：客户须知/须披露的按笔费用 =『any fees imposed by CDP and/or SGX-ST, stamp duty and Goods and Services Tax』——无 MAS 按笔征费、无本金税项；配合已 high 的 `stamp_duty`（scripless 豁免）+ 多份券商成本拆解一致 |
| `au-asx financial_transaction_tax` | `rate: null`（Baker McKenzie 未逐字『no FTT』）| ✅ `type: none` medium | 各州『可流通证券』印花税对上市证券已全废（见 stamp_duty，NSW Duties Act §34）+ PwC Australia『Other taxes』综合税种综述印花税节仅提未上市实体、全篇无 FTT 条目。[ADR-002] 语义映射 |
| `kr-krx regulatory_fees` | 无 quote / low | ✅ `type: none` medium | 《金融委员会设置法》(elaw.klri.re.kr) 第 46 条 FSS 经费 = 政府/韩行拨款 + 第 38 条受检机构（含证券公司）分担金；第 47(1) 条『属第 38 条各款的机构……应向金融监督院缴纳其费用分摊额』——机构层面征收、非按交易计收（同 au-asx ASIC 先例） |

**仍为 `rate: null`（长尾未竟，非本条范围）：** `au-asx` / `ca-tsx` / `kr-krx` 的 `regulatory_fees` 已在本条或 [ADR-065] 处理；`fr-euronext stamp_duty`（一所多国、七国税制各异，`rate: null` 是正确的「无法逐国断言」）；`kr-krx exchange_fees`（KRX 站 JS，当期档位未取到——与「有无税/费」无关，见 OPEN-QUESTIONS）。

**没改：** `spec` 形状、`schema/`、`tools/`、前端（成本瀑布 SVG 对 `type: none` 已有「不征收」渲染，无需改）；未新增不变式（本条未引入新结构）。

**验证：** `make check` 全绿（`selfcheck` 24/24、`validate` 20 家 0/0、`verify_quotes` OK=1001 / FAIL=0 / CACHE_MISS=77、`check_ui_i18n` OK）、`make sync` 二次幂等。触及 8 字段（< [CLAUDE.md §四] 的 >30 门槛），协调者逐条 spec/quote-vs-source 自检；每条改动带 `.cache/` 落盘凭据（curl 常规 UA，除 fgk/ndrc/pwc/sgx/sars/elaw/bundestag 均已在册域名）。生成块变动：`health-summary` +2（1855→1857，cn-sse/cn-szse 各 +1）、`OPEN-QUESTIONS auto-issues` 移除 2 行（cn-szse FTT / kr-krx regulatory_fees 由 low 升 medium），`progress-matrix` 零 diff。

**日期：** 2026-09-04

---

### ADR-069 — 并行 worktree 防失序：ROADMAP §一 / ADR 编号 / 生成块 / 合并纪律四道护栏

**背景：** 2026-09-03/04 同时有三条后台 worktree 在跑（参与者图渲染层、成本瀑布残差、数据空缺轨任务二），各自开 PR。合并后 `main` 的 `make check` 转红（`c0c2b04`），PR #63 事后收拾。四类失序，成因各不相同，共同点是**把 git 无法语义合并的「单写者资源」交给并行分支各自手写**：

1. **ADR 编号预支撞号。** 每条分支拉出时取「下一个空号」，N 条并行 → 几乎必撞。[ADR-029] 定的对策（晚合并方让号 + 全库 grep 改引用）是纯手工：`ADR-065` 这次被三条分支同时预支，PR #63 手工让号 `ADR-068`，commit message 里仍永久写着旧号。
2. **`ROADMAP.md` §一「下一步」是共享散文编号列表。** 每条分支重排它，git 把不同分支的行看成互不冲突，**不报冲突**，直接三方合并 → 编号乱成 `1-6, 4-6, 4-8`。最坏的失效：没有冲突标记，静默错误。
3. **§一「最近完成」滚动窗口每条分支各自 prepend。** 合并保留全部 → 窗口从「只留 3 条」涨到 9 条（含 2 条逐字重复）。同样不报冲突。
4. **生成块每条分支各自 `make sync`。** 各自基于自己那部分 `data/` 视图重算 `health-summary`，合并把两个重算版本并在同一个 `<!-- BEGIN/END -->` 块里 → 块内两张表头。`validate.py` §8 能抓（重算 ≠ 已提交），**但前提是合并后有人真跑了 `make build`**——PR #61/#62 的合并者做完 `git pull --ff-only` 没跑 check，红 `main` 溜过。

**定了什么（四道护栏，按失效模式）：**

1. **`validate.py` 加 §一防失序两条不变式（[CLAUDE.md §四]「新不变式必须机器化」）：**
   - `roadmap_nextstep_violations(block)`：§一「下一步」顶层有序列表编号必须 `1..n` 连续、无重复。
   - `roadmap_recent_violations(block, limit=3)`：§一「最近完成」顶层条目数 ≤ `ROADMAP_RECENT_MAX`（=3，`CLAUDE.md §八` 的窗口大小）。
   - 两个纯函数无 I/O，`validate_roadmap_section_one()` 切 §一两子节文本喂进去；`tools/selfcheck.py` 加 12 条合成用例（含「重号各报一条 + 不连续 → 2 条消息」「缩进子编号不计入顶层」等边界），`selfcheck` 24→36。
   - 顺带 `validate_no_conflict_markers()`：全库文本文件扫 `<<<<<<< ` / `||||||| ` / `>>>>>>> ` 残留（裸 `=======` 会撞 markdown 标题，不收）——PR #61/#62「冲突未清理即入库」这一类的兜底。
   - 顺带修一个既有 bug：`validate.py` 三处 `rglob` 用**绝对路径** `.parts` 判 `skip_dirs`，而 validate 跑在 `.claude/worktrees/<name>/` 分支上时绝对路径必含 `"worktrees"` → 整个仓库被跳过，`validate_adr_anchors` 的跨文件 ADR 引用扫描等在 worktree 里静默失效。抽 `under_skip_dir(p)` 按 ROOT 相对路径判，三处统一。
2. **§一 改为单写者，后台任务走收件箱。** [CLAUDE.md 一] 早已规定「§一 只是速览索引、事实不在这写」——本就不该由干活的分支维护。新增 `PROJECT/ROADMAP-INBOX.md`（纯 append，不同分支的 append git 合并干净）：**后台任务 / worktree 收尾只往收件箱追加一行完成便签，不碰 §一**；**§三详版就地改**（逐条 checklist，改不同条目不冲突）。**交互式会话 / 合并协调者开工时**把收件箱堆积的行折进 §一（「最近完成」裁到 3 条、「下一步」重排编号）再清空——串行、单写者、不会撞。`CLAUDE.md §八`「ROADMAP 回写要动两处」相应改写为「详版就地改、§一 走收件箱」。
3. **合并协调纪律入 `GIT-RUNBOOK.md`。** 后台 PR 无 CI（[CLAUDE.md §六] 有意选择），合并动作本身不验证——红 `main` 正是这样溜过的。定：多个后台 PR **串行合并，一次一个**；每合一个立即 `git pull --ff-only && make build`，红了先修再合下一个，**绝不把第二个 PR 叠在未验证的 `main` 上**。RUNBOOK 的合并步骤序列末尾把 `git pull --ff-only` 改成 `&& make build`。
4. **ADR 编号预留台账。** 新增 `PROJECT/ADR-LEDGER.md`（append-only）：开工写 ADR 前，先在台账登记要用的号（交互式会话直接推 `main`；后台任务走一个只改这一个文件的快速 PR 先合）。`validate.py` 加 `adr_ledger_violations()`：`DECISIONS.md` 每条 `### ADR-NNN` 都必须在台账登记过、台账编号 `1..max` 连续不重复——**把「加 ADR 必先登记」变成构建关卡**，撞号从常态降为「两条分支同一分钟登记」的罕见事件。台账用一条范围行 `ADR-001 … ADR-068` 兜住建台账前的历史条目（不重列 68 条标题，[CLAUDE.md 一]「事实只在一处」），之后逐条登记。

**没做（`make check` 全绿 ≠ 数据没被幻觉污染，同理这四道不覆盖全部并行风险）：**

- **`renumber_adr.py` 机械让号脚本**——台账把撞号变罕见后收益下降，暂不做；真撞了仍按 [ADR-029] 手工让号 + 全库 grep。列为备选。
- **`DECISIONS.md` 拆成一 ADR 一文件**——能根除并行 ADR 碰同一文件，但要迁移 68 条 + 改交叉引用工具，收益中等，缓。
- **GitHub Actions 跑 `make check`**——[CLAUDE.md §六]「无强制 CI」是有意选择；护栏 3 用纪律替代，若纪律再被违反可重新评估。
- **生成块「块内表头只出现一次」的专项检查**——`validate.py` §8 的「重算 ≠ 已提交」已能抓块内重复，只是信息不如专项直白；护栏 3 的「合并后必 `make build`」是更根本的堵法，不叠专项检查。

**验证：** `make build` 全绿（`selfcheck` 43/43、`validate` 20 家 0/0、`check_ui_i18n` OK）、`make sync` 二次幂等、`data/` 与 `docs/data/` 零 diff（本条不碰数据 / schema / 前端）。负向验证：`selfcheck.py` 新增 19 条合成用例覆盖重号「下一步」/ 不连续 / 超窗「最近完成」/ 未登记 ADR / 台账缺口 / 台账重复登记等，注入必失配用例确认 `main()` 退出码 1。`ROADMAP-INBOX.md` 的折叠动作待本条合并后由首个交互式会话执行（把这条的完成便签折进 §一）。

**日期：** 2026-09-04

### ADR-070 — 市场机制剖面视觉迭代：机制核心面板右缘避让收盘集合竞价竖条（[ADR-055] 已知局限②落地）

**为什么需要：** [ADR-055] 把机制核心面板定为**固定 628 宽**（左缘 x=120、右缘 x=748，左右各距绘图区边 60px），并把「切换 20 家每个槽位屏幕坐标不变」列为验收目标。但收盘集合竞价竖条的横坐标由 `xMax`（= 最晚已知时刻 + 15min）决定——**有盘后时段或日内跨度窄的所，`xMax` 被盘后 / 夜盘撑远，收盘竞价条被压到绘图区中段**：`cn-sse`/`cn-szse`（盘后固定价 15:05–15:30）竞价条落在 x≈719、`tw-twse` x≈655、`kr-krx` x≈610，全部在 748 之内，被面板盖住。默认视图 `cn-sse` 即中招。[ADR-055] 已知局限②预判了这条并给了解法方向（「给面板宽度设一个按 `xMin/xMax` 跨度收缩的下限」），本条落地。

**要达成的目标：** 收盘集合竞价的图示（`auc()` 画的斜纹竖条 / 竖线）在任何一家交易所都不被机制核心面板压住，右缘至少留 14px 气口；不涉及收盘竞价可视化的所（`de-eurex`/`de-xetra`/`uk-lse` 等 `auc()` 不画的情形）面板保持默认 628 宽；`make build` 全绿、`docs/data/` 零 diff。

**如何达成（纯前端一文件 `docs/assets/app.js`）：**
- `tdBuild`：在 push `tdCorePanel` 前算 `clsLeftX`（收盘竞价块左缘的 `X()` 坐标），**判定条件与下方 `auc()` 画不画逐条一致**——`auction_start` + `auction_end` 且成区间 → `X(start)`；只有 `auction_end` → `X(end)`（`auc()` 画竖线）；只有 `auction_start` 无 `auction_end` → `auc()` 直接 `return` 不画，`clsLeftX` 留 `null`（`de-xetra` 属此）。
- `tdCorePanel(id, ms, yRef, ghostOn, clsLeftX)` 新增第 5 参：右缘 `fRight = min(748, clsLeftX − 14)`，`fw = max(430, fRight − fx)`，`fx`（左缘 x=120）/ `fy` / `fh` 不动。宽度下限 430 是防未来极端所的兜底，当前 20 家均不触及（最紧 `kr-krx` 收到 476）。
- 受影响 7 家（`br-b3`/`ca-tsx`/`cn-sse`/`cn-szse`/`kr-krx`/`sa-tadawul`/`tw-twse`）面板宽 476–605，其余 13 家不变。

**取舍：** [ADR-055]「20 家槽位坐标不变」对这 7 家退化为「左列坐标不变、右列随宽度内收」——竞价条可见性优先于横向对比时的绝对稳定（面板左缘、行高、垂直居中均未变，右列仍在 2 列网格内）。面板缩窄后每列仍 ≈ 220–290px（原 chip 148px），2 行截断不受影响。左缘不动 → 开盘集合竞价条（多在 x<120）与 y 轴刻度不受牵连；开盘竞价条伸进面板区的所（`us-nasdaq`/`au-asx` 等，[ADR-055] 已有此情况）不在本条范围。

**验证：** `make build` 全绿（`selfcheck` 43/43、`validate` 20 家 0/0、`verify_quotes` FAIL=0〔`CACHE_MISS` 为本 worktree 无 `.cache/` 的信息性状态，见 [ADR-053]〕、`check_ui_i18n` OK——本条不新增 UI 串）；`make sync` 幂等，`git diff` 仅 `docs/assets/app.js`，`docs/data/` 零 diff、生成块无变化。几何核对：按 `X()` 公式对 20 家逐一重算 `clsLeftX` 与新右缘——7 家收窄后气口 13–14px、13 家不变、`de-eurex`/`de-xetra`/`uk-lse` 保持 628、无一家仍重叠；宽度下限 430 未触发。`node --check` 通过。

**已知局限（留后续迭代）：**
- 宽度下限 430 若被未来某所触发，面板会重新压住竞价条（下限优先于避让）；届时需引入「左缘也左移」或「面板整体上/下移」，本条不做。
- 开盘集合竞价条伸进面板左侧区的所（[ADR-055] 已有）仍未处理——本条只动右缘（用户本次只提收盘侧）。
- 面板宽度不再是跨所常数，未来可视化模块若要横向对齐剖面面板，需读实际 `fw` 而非假定 628。

**日期：** 2026-09-04
