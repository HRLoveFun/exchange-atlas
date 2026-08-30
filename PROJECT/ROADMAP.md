# 路线图 ROADMAP

进度状态放这里；「为什么这么排」去 `DECISIONS.md`，这里不重复。

## 当前阶段：**v2.0 高度可视化转向**（2026-08-29 校准）——主视图从对比矩阵改为单市场「交易日平面图」，新增结构化 `spec` 层。加固组 A1/A2（[ADR-033]/[ADR-034]）、Phase 0 范式定案（[ADR-035]/[ADR-036]）、Phase 1a `spec` 层实装 + 5 家示范（[ADR-037]）、Phase 1b 其一 schema/工程部分（`matching_principle` 转 enum + `in-nse` 时区，[ADR-038]）均已完成。**下一步：Phase 1b 其二 · 15 家第五章 `spec` 数据回填 + 三个补充字段 `spec` + JPX 37 档全表**（[ADR-017] 并行子代理，见下方「v2.0 计划」）。

## 阶段路线

- [x] **v0.0 立项 + 可达性探针** — 仓库骨架、`CLAUDE.md`、`PROJECT/` 四件套、`schema/`、`Makefile`、三个 tool 跑通、LICENSE、`.claude/settings.json`；五家标杆抓取方式探明（见 `SOURCES.md`）
- [x] **v0.1 骨架验证** — `taxonomy.yml` 十一章字段字典、上交所+港交所填满、前端矩阵+档案视图最小可用、Pages 上线；人工抽检 20 字段（2026-08-13，基本准确，反馈已回写 `SOURCES.md`「来源 URL 应精确到信息页」一节）
- [x] **语言模型简化**（v0.1 收尾后、v0.2 开始前，独立迁移）— 数据语言从 zh/native/native_lang 三态简化为 zh/en 两态 + 交易所级 `source_lang` 标记，见 `PROJECT/DECISIONS.md` [ADR-013]；两家现有交易所数据已迁移
- [x] **v0.2 标杆扩展** — NYSE / JPX / Eurex 三家数据均已补齐（均 `source_lang: en`）；Eurex 是首个衍生品交易所样本，暴露出 `listing` 章节与 `settlement_cycle`/`short_selling`/`intraday_reversal` 三个字段对非股票交易所不适配，见 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第17条。矩阵维度组已按实测填充率重新校准（[ADR-014]）；`add-exchange` skill 已吸收三次实操教训定型
- [x] **v0.3 前端完善** — 修复语言模式切换的遗留 bug：交易所名称（矩阵行/档案页标题/浮层）、矩阵行地区标签、健康度视图字段名此前都不随模式切换，只是英文模式下用 `en_required` 字段本身的回退掩盖了部分（见 [ADR-013] 的回退设计），这几处是取值路径完全绕过了 langMode 判断；格子浮层加双语标题、章节面包屑、加载态；健康度视图加交易所/类型筛选并支持点行跳出处；矩阵加标杆批次筛选；新增时区甘特条视图（`#view=timezone`），推导方式见 `PROJECT/DECISIONS.md` [ADR-015]
- [x] **v1.0 横向铺开** — 按 Tier 扩到 20+ 家；Wave 1（8 家）+ Wave 2（7 家）均已完成，加上 v0.1/v0.2 五家标杆共 20 家；计划任务/工程设计/验收标准/进度见下方「v1.0 计划」一节
- [x] **前端阅读性优化**（v1.0 收尾后）— 矩阵工具栏去掉「标杆批次 Tier」筛选框与搜索框（v0.3 加的两个交互，20 家规模下地区筛选已够用，搜索是冗余项；`v0.3` 那条历史记录不改，此处记录后续变更）；时区甘特条午休时段从"柱状条空白+右侧括号文字"改为独立蓝色色块；正文字号/行高、矩阵斑马纹与悬停高亮、档案页字段卡片间距与长文本限宽等一轮可读性调整，见 `PROJECT/DECISIONS.md` [ADR-025]
- [x] **v2.0 前置加固 A1**（2026-08-29）— `tools/validate.py` 补完防幻觉铁律的机器强制：第三方来源 `confidence` 封顶、`NUMBER_RE` 收紧杜绝垃圾 token、路径引用校验收窄到仓库内路径、结构化 `spec` 值的逐字反查（Phase 1 前 no-op）。0 存量违规，均为 preventive；`OPEN-QUESTIONS` 框架性问题 #6/#35 已解决删除、#12 更新为"此路不通"路标。见 `PROJECT/DECISIONS.md` [ADR-033]
- [x] **v2.0 前置加固 A2 + Phase 0**（2026-08-30）— A2 尾巴收口（英文回填 #45 全库清零、CACHE_MISS 归零、`verify_quotes` 走 expand，[ADR-034]）；Phase 0 范式与数据模型定案（修订 ADR-005、`spec` 层契约 + `schema/spec.yml`、零构建/诚实渲染/非现货降级、框架性问题批量裁定含 `covered_only` 落地，[ADR-035] + [ADR-036]）。详见下方「v2.0 计划」。

## 交易所填充进度

<!-- BEGIN:GENERATED progress-matrix -->
| 交易所 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `au-asx` | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `br-b3` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| `ca-tsx` | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `ch-six` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| `cn-sse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `cn-szse` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `de-eurex` | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | 🟡 |
| `de-xetra` | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `fr-euronext` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ |
| `hk-hkex` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `in-nse` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `jp-jpx` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | 🟡 | 🟡 |
| `kr-krx` | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| `sa-tadawul` | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 | ✅ | 🟡 |
| `sg-sgx` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| `tw-twse` | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| `uk-lse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| `us-nasdaq` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | 🟡 | 🟡 |
| `us-nyse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `za-jse` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

列说明：2 基本信息、3 监管与法律环境、4 产品体系、5 市场结构与交易机制、6 上市、持续监管与退市、7 指数体系、8 清算、结算与交割、9 市场参与者、10 市场数据与技术基础设施、11 交易成本与税费、12 风险与特殊考量
<!-- END:GENERATED progress-matrix -->

## 数据健康度摘要

<!-- BEGIN:GENERATED health-summary -->
共 1768 个已填字段，其中 0 个超过复核阈值待复核。

| 交易所 | 已填字段 | 待复核 |
|---|---|---|
| `au-asx` | 102 | 0 |
| `br-b3` | 103 | 0 |
| `ca-tsx` | 82 | 0 |
| `ch-six` | 82 | 0 |
| `cn-sse` | 70 | 0 |
| `cn-szse` | 105 | 0 |
| `de-eurex` | 75 | 0 |
| `de-xetra` | 77 | 0 |
| `fr-euronext` | 99 | 0 |
| `hk-hkex` | 89 | 0 |
| `in-nse` | 98 | 0 |
| `jp-jpx` | 70 | 0 |
| `kr-krx` | 106 | 0 |
| `sa-tadawul` | 102 | 0 |
| `sg-sgx` | 104 | 0 |
| `tw-twse` | 78 | 0 |
| `uk-lse` | 67 | 0 |
| `us-nasdaq` | 74 | 0 |
| `us-nyse` | 66 | 0 |
| `za-jse` | 119 | 0 |
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
- **英文版审查（2026-08-20 启动）**：走查发现"中英夹杂"症状，拆成两层——① `en_required` 字段真违规（9 处，`cn-sse`/`hk-hkex`/`tw-twse`），已补齐数据并给 `validate.py` 加永久机器校验，附带查出并修正一处 `hk-hkex` 撮合规则误引衍生品市场规则的数据错误，见 [ADR-024]；② 114 个非强制双语字段在英文模式下仍回退显示中文，方案②（前端加视觉标记区分"设计不需双语"与"真漏填"）已实施，见 [ADR-026]，方案①（批量翻译114字段）随 v1.1 一并评估，不单独开工。
- **悬案批量清理（2026-08-20/21）**：`sa-tadawul`/`kr-krx`/`tw-twse`/`ch-six`/`br-b3`/`fr-euronext` 六家共 17 条 `PROJECT/OPEN-QUESTIONS.md` 具体数据悬案，13 条解决、1 条重新定性为"官方确认不披露"、3 条如实保留（sa-tadawul TASI基日、kr-krx KOSDAQ基日、fr-euronext市值口径不在本次任务范围），见 [ADR-027]。
- **下一步方向已定：深度优先（v1.1 Category B 数据深耕），Wave 3 暂缓**，见 `PROJECT/DECISIONS.md` [ADR-028]。详见下方「v1.1 计划」一节。

## v1.1 计划：Category B 数据深耕（Batch 1/3 / Batch 2/3 / Batch 3/3 均已完成，2026-08-27）

依据与规模估计见 `PROJECT/DECISIONS.md` [ADR-028]，本节只管任务清单与进度，不重复决策理由。

### 前置事项（批量执行前必须先解决，否则会重演 [ADR-018] 的教训）

- [x] **`clearing.initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency`/`last_trading_day_rule` 四字段语义歧义澄清**——已于 2026-08-22 解决，见 [ADR-030]：仿照 `delivery_method` 先例扩容 `clearing.derivatives` 子块，顶层收窄为「现货语境」、衍生品语境统一移到子块；`tw-twse` 数据本就符合收窄后的顶层语义无需改动，`de-eurex`（纯衍生品）无需改动，`br-b3` 三个字段已完成迁移（`quote`/`sources` 原样搬移，未新造事实）。批量填充的前置阻塞已清除。

### 候选字段清单（36 个确定 Category B 字段，2026-08-21 审计；另 4 个原待澄清语义的 `clearing` 字段已于 2026-08-22 解决语义歧义，见 [ADR-030]，现并入候选范围，合计 40 个）

| 章节 | 填充率 | 字段（括号内为当前 X/20） |
|---|---|---|
| `regulation` | 57% | `capital_controls`(2)、`foreign_ownership_limit`(3)、`investor_protection`(5)、`disclosure_requirements`(7) |
| `listing` | 42% | `post_delisting_venue`(0)、`listing_process_duration`(1)、`delisting_transition_period`(4)、`delisting_process`(7)、`suspension_resumption`(10)、`continuing_obligations`(11) |
| `clearing` | 43% | `default_management`(4)；另 4 个字段的语义歧义已解决（[ADR-030]），`clearing.derivatives.*` 镜像字段已就绪，可与 `default_management` 一并纳入批量填充范围 |
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

- 前置事项已解决（2026-08-22，见 [ADR-030]），批量填充的阻塞已清除。
- **Batch 1（8 家）已完成（2026-08-22/25）**：`cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse`/`us-nyse`/`us-nasdaq`/`uk-lse`/`jp-jpx`。选取逻辑：优先覆盖「顺带处理」一节点名的两个批量任务——前四家一并回填英文缺失字段，`us-nyse`/`us-nasdaq` 一并尝试反爬突破，`uk-lse`/`jp-jpx` 补地区多样性。执行结果、字段明细、人工抽检通过率、反爬突破方法与并行执行的工程教训见 `PROJECT/DECISIONS.md` [ADR-031]，本条不重复：全库已填字段 1162→1360（+198）；8 个子代理各自 10 字段自查 + 协调者独立复核 16+1 个字段，全部通过，远超 ≥95% 门槛；`sec.gov`/`finra.org` 反爬已攻克（方法见 `PROJECT/SOURCES.md`「突破记录」），`dtcc.com` 仍未攻克但已降级绕过；`make build` 0 错误 0 警告。
- **Batch 2/3（剩余 12 家：`au-asx`/`br-b3`/`ca-tsx`/`ch-six`/`de-eurex`/`de-xetra`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse`）已完成（2026-08-27）**。按原执行设计分两批（各 6 家）并行子代理执行，沿用 [ADR-017] 模式但收紧隔离：子代理只写各自 `data/exchanges/<id>.yml` 并把来源落盘到 `.cache/<id>/`，`PROJECT/SOURCES.md`/`OPEN-QUESTIONS.md`/`schema/glossary.yml` 由协调者统一合并，避免共享文件冲突。`make build` 0 错误 0 警告；全库已填字段 1360→1766（+406）。8 个原 0/20 字段（`implicit_costs_note`/`regulatory_fees`/`data_pricing_model`/`historical_data_availability`/`post_delisting_venue`/`broker_landscape`/`liquidity_risk_note`/`political_risk_note`）在 12 家中全部转为有值（个别 `low` 置信度，属"查不清已如实标注"，见 `OPEN-QUESTIONS.md` auto-issues）。质量关：协调者用脚本对全部 40 个 Category B 高置信字段做"quote 是否在落盘来源原文中"反查，命中 19/22 不匹配后逐一核实——其中 19 个实为来源页未落盘（现场抓取官方页均可命中原文），仅 3 个确属 quote 与原文不符（`ca-tsx` 两个 participants 字段引用的 OSC NI 31-103 着陆页无规则正文；`fr-euronext` `clearing.derivatives.delivery_method` 的 "EDSP=CTD/CF" 公式原文未出现），已修正（前两例降级 `medium` 保留官方来源、后一例改为 PDF 中真实存在的 EDSP 措辞并重新 verbatim 引用）。`kr-krx` 多处 costs/infrastructure 字段仍 `low`，属真实未核实，已记入悬案。
- **Repo 级 verbatim-quote 反查（2026-08-27，接续 Batch 2）**：用脚本对全库 20 家共 ~671 个 `confidence: high` 字段的 `quote` 逐一比对落盘 `.cache/<id>/` 原文与现场抓取来源，先发现 48 处 quote 与来源不符（多为缺 `sources` 或 quote 为改写/编造），分 11 个交易所并行子代理修复——其中确属编造/改写并已修正的代表：`fr-euronext` `clearing.derivatives.delivery_method`（"EDSP=CTD/CF" 公式原文无）、`ch-six` `clearing.csd_name`（quote 指非 CSD 内容）、`ca-tsx` 两 participants 字段（引 OSC NI 31-103 着陆页无规则正文）、`hk-hkex` `clearing.ccp_name`（quote 指 CSDC 非 HKSCC）、`tw-twse` `market_structure.closing_mechanism`、`cn-sse` 若干（数字跨表格行无法成连续 verbatim）。修复后重查，可证伪的失配降至 0；残留"未命中"均为 JS 渲染页（curl 拿不到正文）或来源页未落盘，属检查器局限非数据缺陷。教训：verify 脚本必须做 HTML 标签剥离+PDF 文本提取，否则表格单元/标签会制造大量假阴性。该反查已固化为 `tools/verify_quotes.py`：离线只比对 `.cache/<id>/_manifest.json` 中实际落盘的引用来源（没抓过的来源记为 CACHE_MISS 不误判），`--live` 额外现场抓取（JS 页/被拦记为 LIVE_ERR）；已接入 `make check`（仅 FAIL 才非零退出），并加 `make verify-quotes` / `make verify-quotes-live` 两个独立命令。
- **落盘全部引用来源 + 复核（2026-08-27，接续上条）**：新增 `tools/fetch_sources.py`（收割 yml 里所有 `sources` URL 落盘 `.cache`，按内容类型定扩展名、为 PDF/Office 生成 `.txt` 伴随文本、sec.gov 用 Fair Access UA），批量抓得 632 个来源。重跑反查后 OK 由 27 升到 929、FAIL 由 44 暴露并归零——其中确属"quote 非 verbatim / 引用错页 / 抓到 404/JS 壳/图片 PDF"的 34 处，分 11 个交易所并行子代理修复（重引正确来源并改写 verbatim quote，或降级 `medium` 保留 sources）。最终 `make build` 全绿：validate 0/0、verify_quotes OK=929 FAIL=0。残 61 个 CACHE_MISS 为引用来源未落盘或错误页，按 CLAUDE.md §四 留人工抽检。
- **Batch 3/3 收尾（2026-08-27，v1.1 全部完成）**：① `SOURCES.md` 末尾「Batch 2 补充登记」堆块已按交易所 id 去重并入各 `### <exchange>` 小节；② Batch B 并行执行教训回写 `.claude/skills/add-exchange/SKILL.md`（verbatim 反查步骤、不可核验即降级 `medium` 的规则）；③ 每家抽 10 个「全部引用来源已落盘」的 `high` 字段做 quote-vs-来源 核验，20 家共 200/200 通过（100%，≥95% 阈值），报告见 `PROJECT/SPOT-CHECK-v1.1.md`；④ `OPEN-QUESTIONS.md` 与 glossary 经 `make sync` 重新生成；⑤ 上述 verbatim-quote 机器化反查 + 来源全量落盘的决策记入 `PROJECT/DECISIONS.md` [ADR-032]。`make build` 全绿（validate 0/0、verify_quotes OK=929 FAIL=0）。v1.1 至此收口。

## v2.0 计划：高度可视化转向

方向与契约定案见 [ADR-033]～[ADR-036]。目标：主视图从对比矩阵改为单市场「交易日平面图」（x=日内时间/分钟，y=涨跌幅/相对前结算价），让交易员首次接触一个市场即 30 秒看懂其微观结构。本节只记进度，工程设计与取舍见 DECISIONS。

- [x] **立即执行 · A1 防幻觉机器校验补完**（2026-08-29，[ADR-033]）— 见上方「阶段路线」。
- [x] **立即执行 · A2 v1.1 尾巴收口**（2026-08-30，[ADR-034]）— `verify_quotes.py` 走 `expand_exchange`（消化 42 个假 CACHE_MISS，暴露并修 6 个真 FAIL）；`br-b3.yml` 34 处裸字符串 `sources` 归一为字典；英文回填 #45 **全库清零**（20 家）；61 个 CACHE_MISS → 0。`OPEN-QUESTIONS` #45 删除。
- [x] **Phase 0 · 范式与数据模型定案**（2026-08-30，[ADR-035] + [ADR-036]）— 修订 ADR-005（主视图=交易日平面图，矩阵降为 `#view=matrix`）；定 `spec` 结构化层契约（新文件 `schema/spec.yml` 存形状定义，含 1 条示范条目）、零构建守则、图形诚实呈现规则（`spec` 三态 null/type:none/缺省）、非现货所 y 轴 `reference` 降级；框架性问题 #39 落地（`enums.yml` 加 `covered_only`，`za-jse` 归类），#13 删除，#17/#38 更新，其余（#1/#5/#36/#41 等）"暂不改 + 明确触发条件"。
- [x] **Phase 1a · spec 层实装 + 第五章契约 + 5 家示范**（2026-08-30，[ADR-037]）— `schema/spec.yml` 写全第五章 13 字段 `spec` 形状；`sync.py` 加 `spec` 到 `ENVELOPE_KEYS` + `compute_trading_window` 优先读 `spec.{start,end}`（散文回退）；`validate.py` 加 `spec` 结构校验（键名 + dict + 5b 数值反查）；`cn-sse`/`us-nyse`/`jp-jpx`/`de-eurex`/`in-nse` 五家回填 `spec`，覆盖百分比 / 无 / 动态未公布(band_pct null) / 阶梯 / 前结算价 / 跨所联动六种形态。全 20 家时区甘特条数据零变化。
- [ ] **Phase 1b · 其余 15 家 spec + 补齐** — 拆两步：
  - [x] **其一 · schema/工程部分**（2026-08-30，[ADR-038]）— `matching_principle` 转 enum：`enums.yml` 新增 4 值词表（`price_time` / `price_display_time` / `price_time_broker_priority` / `price_time_or_pro_rata`），`taxonomy.yml` 两处加 `enum_ref`，29 个字段回填 enum（19 顶层 + 10 衍生品；`in-nse` 顶层因原文缺失如实不填）；`in-nse` 加进 `EXCHANGE_IANA_TZ`（Asia/Kolkata），甘特条多一条印度柱、其余 5 家 `trading_hours` 逐字节不变。`make build` 全绿。
  - [ ] **其二 · 数据回填部分**（[ADR-017] 并行子代理，每家 `spec` 对来源复核）— 剩余 15 家第五章 `spec`（`trading_sessions` / `opening`·`closing_mechanism` / `price_limits.main_board` / `circuit_breaker`）；全 20 家 `volatility_interruption`·`short_selling`·`market_maker_scheme` 的 `spec`；JPX 值幅制限 37 档全表（需抓 `bids_and_offers_price_limits` PDF 补全 `quote` 后填 `ladder`）。退出：`make build` 全绿、`spec` 5b 0 FAIL、时区甘特条回归无变化（现有 6 家不变）。
- [ ] **Phase 2 · 交易日平面图** — `app.js` 新增 `renderTradingDay`（手写 SVG，按 [ADR-035] A 的字段→元素映射 + D 的诚实渲染规则），市场下拉，路由默认值改 `trading-day`，矩阵移 `#view=matrix`，`index.html` tab 调整。非现货所按 [ADR-035] E 渲染。交付后**停下评估**「30 秒看懂」由非专业读者实测。
- [ ] **Phase 3 · 其余章节可视化** — 成本瀑布 → 交割管线 → 上市生命周期（一并落地 [ADR-036] #5 的章节级"仅现货适用"标记）→ 监管图 → 参与者 → 风险旗标（B 组 `fx_risk_note`/`kr-krx` low 簇就地清）→ …按交易员价值迭代，每章带一次小型 `spec` 补充。
- [ ] **Phase 4 · Wave 3 广度扩张（搁置）** — Phase 1–2 稳定后解冻。候选见 [ADR-016] 思路 + 东南亚/中东/非洲/拉美补白；若纳入第 3 个 MENA/非洲所则同时执行 [ADR-036] #2 的 `region` 拆分。子代理任务里加"第五章直接填 `spec`、并在平面图里自检"。
