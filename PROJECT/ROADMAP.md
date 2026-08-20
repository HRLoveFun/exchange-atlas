# 路线图 ROADMAP

进度状态放这里；「为什么这么排」去 `DECISIONS.md`，这里不重复。

## 当前阶段：v1.0 已完成（20 家），转入 v1.1 Category B 数据深耕（规划中，待启动）

## 阶段路线

- [x] **v0.0 立项 + 可达性探针** — 仓库骨架、`CLAUDE.md`、`PROJECT/` 四件套、`schema/`、`Makefile`、三个 tool 跑通、LICENSE、`.claude/settings.json`；五家标杆抓取方式探明（见 `SOURCES.md`）
- [x] **v0.1 骨架验证** — `taxonomy.yml` 十一章字段字典、上交所+港交所填满、前端矩阵+档案视图最小可用、Pages 上线；人工抽检 20 字段（2026-08-13，基本准确，反馈已回写 `SOURCES.md`「来源 URL 应精确到信息页」一节）
- [x] **语言模型简化**（v0.1 收尾后、v0.2 开始前，独立迁移）— 数据语言从 zh/native/native_lang 三态简化为 zh/en 两态 + 交易所级 `source_lang` 标记，见 `PROJECT/DECISIONS.md` [ADR-013]；两家现有交易所数据已迁移
- [x] **v0.2 标杆扩展** — NYSE / JPX / Eurex 三家数据均已补齐（均 `source_lang: en`）；Eurex 是首个衍生品交易所样本，暴露出 `listing` 章节与 `settlement_cycle`/`short_selling`/`intraday_reversal` 三个字段对非股票交易所不适配，见 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第17条。矩阵维度组已按实测填充率重新校准（[ADR-014]）；`add-exchange` skill 已吸收三次实操教训定型
- [x] **v0.3 前端完善** — 修复语言模式切换的遗留 bug：交易所名称（矩阵行/档案页标题/浮层）、矩阵行地区标签、健康度视图字段名此前都不随模式切换，只是英文模式下用 `en_required` 字段本身的回退掩盖了部分（见 [ADR-013] 的回退设计），这几处是取值路径完全绕过了 langMode 判断；格子浮层加双语标题、章节面包屑、加载态；健康度视图加交易所/类型筛选并支持点行跳出处；矩阵加标杆批次筛选；新增时区甘特条视图（`#view=timezone`），推导方式见 `PROJECT/DECISIONS.md` [ADR-015]
- [x] **v1.0 横向铺开** — 按 Tier 扩到 20+ 家；Wave 1（8 家）+ Wave 2（7 家）均已完成，加上 v0.1/v0.2 五家标杆共 20 家；计划任务/工程设计/验收标准/进度见下方「v1.0 计划」一节
- [x] **前端阅读性优化**（v1.0 收尾后）— 矩阵工具栏去掉「标杆批次 Tier」筛选框与搜索框（v0.3 加的两个交互，20 家规模下地区筛选已够用，搜索是冗余项；`v0.3` 那条历史记录不改，此处记录后续变更）；时区甘特条午休时段从"柱状条空白+右侧括号文字"改为独立蓝色色块；正文字号/行高、矩阵斑马纹与悬停高亮、档案页字段卡片间距与长文本限宽等一轮可读性调整，见 `PROJECT/DECISIONS.md` [ADR-025]

## 交易所填充进度

<!-- BEGIN:GENERATED progress-matrix -->
| 交易所 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `au-asx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `br-b3` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `ca-tsx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `ch-six` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `cn-sse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `cn-szse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `de-eurex` | 🟡 | 🟡 | ✅ | 🟡 | ⬜ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `de-xetra` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `fr-euronext` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `hk-hkex` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `in-nse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `jp-jpx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 |
| `kr-krx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `sa-tadawul` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 |
| `sg-sgx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `tw-twse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `uk-lse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `us-nasdaq` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `us-nyse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `za-jse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |

列说明：2 基本信息、3 监管与法律环境、4 产品体系、5 市场结构与交易机制、6 上市、持续监管与退市、7 指数体系、8 清算、结算与交割、9 市场参与者、10 市场数据与技术基础设施、11 交易成本与税费、12 风险与特殊考量
<!-- END:GENERATED progress-matrix -->

## 数据健康度摘要

<!-- BEGIN:GENERATED health-summary -->
共 1157 个已填字段，其中 0 个超过复核阈值待复核。

| 交易所 | 已填字段 | 待复核 |
|---|---|---|
| `au-asx` | 73 | 0 |
| `br-b3` | 76 | 0 |
| `ca-tsx` | 54 | 0 |
| `ch-six` | 50 | 0 |
| `cn-sse` | 52 | 0 |
| `cn-szse` | 76 | 0 |
| `de-eurex` | 33 | 0 |
| `de-xetra` | 49 | 0 |
| `fr-euronext` | 62 | 0 |
| `hk-hkex` | 58 | 0 |
| `in-nse` | 61 | 0 |
| `jp-jpx` | 40 | 0 |
| `kr-krx` | 70 | 0 |
| `sa-tadawul` | 67 | 0 |
| `sg-sgx` | 68 | 0 |
| `tw-twse` | 59 | 0 |
| `uk-lse` | 44 | 0 |
| `us-nasdaq` | 47 | 0 |
| `us-nyse` | 41 | 0 |
| `za-jse` | 77 | 0 |
<!-- END:GENERATED health-summary -->

## v1.0 计划：横向铺开到 20+ 家

工程设计与取舍依据见 `PROJECT/DECISIONS.md` [ADR-016]（候选清单与分波依据）、[ADR-017]（并行执行模式与质量门槛）；验收阈值见 `CLAUDE.md` 四。本节只管任务清单与进度，不重复决策理由。

### 工程设计摘要

- **执行模式**：不再逐家串行，改为每波内用 Agent 工具并行派发子代理，一个子代理独立跑完一家交易所的 `add-exchange` skill 全部步骤；波次结束后统一 `make build` 复核一次。
- **验收标准**：每家新交易所人工抽检 10 个字段核对 `quote` 与原始出处，通过率需 ≥95%（阈值不变，样本量比 v0.1 缩小，理由见 [ADR-017]）；未过阈值只暂停复核该家，不影响同批次其他交易所。每波结束后额外过一遍各子代理执行记录，把新教训回写 `add-exchange` skill，再开下一波。
- **退出标准**：两波（15 家）全部完成且各自通过验收 → 总数达到 20 家；`region: mena_africa` 与 `americas` 不再是明显空白；至少新增一个"一所多国"结构样本（Euronext）供 `OPEN-QUESTIONS.md` 框架性问题第17条积累更多真实证据。

### Wave 1 启动前置条件

- [x] `review_system` 矩阵列的枚举覆盖率问题——实际未在 Wave 1 启动前解决（见 [ADR-018] 执行进度补记），Wave 1/2 完成后作为高优先级待办于 2026-08-19 解决，枚举从 3 值扩到 5 值，见 `PROJECT/DECISIONS.md` [ADR-023]。

### Wave 1（8 家，优先，待启动）

| 交易所（草案 id） | 地区（初判，待建档时核实） | 压测点 |
|---|---|---|
| `us-nasdaq` 纳斯达克 | americas | 同法域对照 NYSE（做市商电子市场 vs DMM） |
| `cn-szse` 深圳证券交易所 | apac | 同国对照 SSE（创业板 vs 科创板） |
| `uk-lse` 伦敦证券交易所 | europe | 脱欧后独立监管框架 |
| `de-xetra` 法兰克福证券交易所/Xetra | europe | 同集团对照 Eurex（`deutsche-boerse-group` 内首个现货所） |
| `sg-sgx` 新加坡交易所 | apac | 地区补充 |
| `au-asx` 澳大利亚证券交易所 | apac | 地区补充 |
| `in-nse` 印度国家证券交易所 | apac（待核实） | 地区补充 |
| `sa-tadawul` 沙特交易所 | mena_africa | 该地区首个样本（现有 5 家里是 0） |

进度：8/8 已完成（并行子代理模式，2026-08-14/15）。人工抽检见 `PROJECT/DECISIONS.md` [ADR-017] 执行记录；子代理踩出的新坑已回写 `.claude/skills/add-exchange/SKILL.md`。

### Wave 2（7 家，视 Wave 1 结果调整，非最终锁定）

| 交易所（草案 id） | 地区（初判） | 压测点 |
|---|---|---|
| `fr-euronext` Euronext | europe | 一所横跨多国市场，结构性新样本 |
| `kr-krx` 韩国交易所 | apac | 地区补充 |
| `ca-tsx` 多伦多证券交易所 | americas | 地区补充 |
| `br-b3` 巴西 B3 | americas | 拉美首个样本 |
| `tw-twse` 台湾证券交易所 | apac | 地区补充 |
| `ch-six` 瑞士证券交易所 | europe | 地区补充 |
| `za-jse` 约翰内斯堡证券交易所 | mena_africa | 非洲首个样本 |

进度：7/7 已完成（并行子代理模式，2026-08-16/17，中途两次撞到账号月度支出限额，恢复后续跑完成）。人工抽检见 `PROJECT/DECISIONS.md` [ADR-017] 执行记录；子代理踩出的新坑已回写 `.claude/skills/add-exchange/SKILL.md`。

### 当前进度

- 20/20+ 已完成（v0.1/v0.2 五家标杆 `cn-sse`/`hk-hkex`/`us-nyse`/`jp-jpx`/`de-eurex` + v1.0 Wave 1 八家 `us-nasdaq`/`cn-szse`/`uk-lse`/`de-xetra`/`sg-sgx`/`au-asx`/`in-nse`/`sa-tadawul` + v1.0 Wave 2 七家 `fr-euronext`/`kr-krx`/`ca-tsx`/`br-b3`/`tw-twse`/`ch-six`/`za-jse`，见上方填充进度表）
- v1.0 横向铺开阶段已完成，达成 20 家目标；`review_system` 枚举覆盖率问题（下方"Wave 1 启动前置条件"）未在 Wave 1 启动前解决，属流程疏漏，见 `PROJECT/DECISIONS.md` [ADR-018] 执行进度补记，已于 2026-08-19 解决（[ADR-023]，连带修了 `delivery_method` 同类问题）；市场结构/指数体系两处 schema 缺口已设计并示范填一家（[ADR-019]）。9 家交易所的衍生品市场机制已按 [ADR-017] 并行子代理模式补齐，人工抽检 90 字段全部通过，见 [ADR-021]。前端矩阵/章节结构审查见 [ADR-022]。
- **英文版审查（2026-08-20 启动）**：走查发现"中英夹杂"症状，拆成两层——① `en_required` 字段真违规（9 处，`cn-sse`/`hk-hkex`/`tw-twse`），已补齐数据并给 `validate.py` 加永久机器校验，附带查出并修正一处 `hk-hkex` 撮合规则误引衍生品市场规则的数据错误，见 [ADR-024]；② 114 个非强制双语字段在英文模式下仍回退显示中文，按用户决定暂只记录规模与候选方案，见 `PROJECT/OPEN-QUESTIONS.md` 第45条，未处理。
- **下一步方向已定：深度优先（v1.1 Category B 数据深耕），Wave 3 暂缓**，见 `PROJECT/DECISIONS.md` [ADR-026]。`OPEN-QUESTIONS.md` 第45条（114 字段英文回退显示）随 v1.1 一并处理，不单独开工。详见下方「v1.1 计划」一节。

## v1.1 计划：Category B 数据深耕（规划中，待启动执行）

依据与规模估计见 `PROJECT/DECISIONS.md` [ADR-026]，本节只管任务清单与进度，不重复决策理由。

### 前置事项（批量执行前必须先解决，否则会重演 [ADR-018] 的教训）

- [ ] **`clearing.initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency`/`last_trading_day_rule` 四字段语义歧义澄清**——`de-eurex`/`br-b3` 已按"衍生品CCP保证金方法论"填写，`tw-twse` 却按"现货融资融券"填写同一字段，两套不相干的制度共用一个字段。需先定下方案（如仿照 `delivery_method` 拆出 `clearing.derivatives.*` 镜像字段）再批量填充，见 [ADR-026]。

### 候选字段清单（36 个确定 Category B 字段 + 4 个待澄清语义的 `clearing` 字段，2026-08-21 审计）

| 章节 | 填充率 | 字段（括号内为当前 X/20） |
|---|---|---|
| `regulation` | 57% | `capital_controls`(2)、`foreign_ownership_limit`(3)、`investor_protection`(5)、`disclosure_requirements`(7) |
| `listing` | 42% | `post_delisting_venue`(0)、`listing_process_duration`(1)、`delisting_transition_period`(4)、`delisting_process`(7)、`suspension_resumption`(10)、`continuing_obligations`(11) |
| `clearing` | 43% | `default_management`(4)；另 4 个见上方前置事项 |
| `participants` | 27% | `broker_landscape`(0)、`investor_structure`(1)、`suitability_management`(1)、`account_opening_requirements`(3)、`foreign_access_channel`(7) |
| `infrastructure` | 18% | `data_pricing_model`(0)、`historical_data_availability`(0)、`data_latency`(1)、`market_data_levels`(1)、`major_outage_history`(2)、`access_methods`(8)、`trading_system_name`(13) |
| `costs` | 19% | `implicit_costs_note`(0)、`regulatory_fees`(0，预期多数合理留空)、`clearing_fees`(2)、`commission_structure`(2)、`financial_transaction_tax`(2)、`capital_gains_tax`(3)、`dividend_withholding_tax`(6)、`stamp_duty`(9)、`exchange_fees`(10) |
| `risks` | 35% | `liquidity_risk_note`(0)、`political_risk_note`(0)、`enforcement_note`(6)、`regulatory_change_risk_note`(11) |

### 顺带处理（同一批交易所研究窗口内一起做，不单独开工）

- 英文缺失字段回填（`OPEN-QUESTIONS.md` 框架性问题第45条，114 个非强制双语字段，集中在 `cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse`；`en_required` 真违规部分已由 [ADR-024] 解决，这里指剩余部分）
- `sec.gov`/`finra.org`/`dtcc.com` 反爬突破尝试（框架性问题14/15/32条，集中影响 `us-nyse`/`us-nasdaq`）

### 执行设计（草案，启动时确认）

- 按交易所分批（非按字段），沿用 [ADR-017] 并行子代理模式，7-8 家/批分 2-3 批
- 质量门槛沿用 [CLAUDE.md 四]（≥95%），抽检量比照 [ADR-017]（10 字段/所）
- 退出标准：8 个当前 0/20 的字段（`implicit_costs_note`/`regulatory_fees`/`data_pricing_model`/`historical_data_availability`/`post_delisting_venue`/`broker_landscape`/`liquidity_risk_note`/`political_risk_note`）全部转为"有值+来源"或"明确 detail 说明不适用/查不到"；其余字段填充率显著提升，不强求 100%

### 进度

- 尚未启动，等待前置事项（`clearing` 字段语义澄清）解决后开第一批
