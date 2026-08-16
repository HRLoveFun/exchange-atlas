# 路线图 ROADMAP

进度状态放这里；「为什么这么排」去 `DECISIONS.md`，这里不重复。

## 当前阶段：v0.3 前端完善已完成，下一步 v1.0 横向铺开

## 阶段路线

- [x] **v0.0 立项 + 可达性探针** — 仓库骨架、`CLAUDE.md`、`PROJECT/` 四件套、`schema/`、`Makefile`、三个 tool 跑通、LICENSE、`.claude/settings.json`；五家标杆抓取方式探明（见 `SOURCES.md`）
- [x] **v0.1 骨架验证** — `taxonomy.yml` 十一章字段字典、上交所+港交所填满、前端矩阵+档案视图最小可用、Pages 上线；人工抽检 20 字段（2026-08-13，基本准确，反馈已回写 `SOURCES.md`「来源 URL 应精确到信息页」一节）
- [x] **语言模型简化**（v0.1 收尾后、v0.2 开始前，独立迁移）— 数据语言从 zh/native/native_lang 三态简化为 zh/en 两态 + 交易所级 `source_lang` 标记，见 `PROJECT/DECISIONS.md` [ADR-013]；两家现有交易所数据已迁移
- [x] **v0.2 标杆扩展** — NYSE / JPX / Eurex 三家数据均已补齐（均 `source_lang: en`）；Eurex 是首个衍生品交易所样本，暴露出 `listing` 章节与 `settlement_cycle`/`short_selling`/`intraday_reversal` 三个字段对非股票交易所不适配，见 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第17条。矩阵维度组已按实测填充率重新校准（[ADR-014]）；`add-exchange` skill 已吸收三次实操教训定型
- [x] **v0.3 前端完善** — 修复语言模式切换的遗留 bug：交易所名称（矩阵行/档案页标题/浮层）、矩阵行地区标签、健康度视图字段名此前都不随模式切换，只是英文模式下用 `en_required` 字段本身的回退掩盖了部分（见 [ADR-013] 的回退设计），这几处是取值路径完全绕过了 langMode 判断；格子浮层加双语标题、章节面包屑、加载态；健康度视图加交易所/类型筛选并支持点行跳出处；矩阵加标杆批次筛选；新增时区甘特条视图（`#view=timezone`），推导方式见 `PROJECT/DECISIONS.md` [ADR-015]
- [ ] **v1.0 横向铺开** — 按 Tier 扩到 20+ 家，计划任务/工程设计/验收标准/进度见下方「v1.0 计划」一节

## 交易所填充进度

<!-- BEGIN:GENERATED progress-matrix -->
| 交易所 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `ca-tsx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `cn-sse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `de-eurex` | 🟡 | 🟡 | ✅ | 🟡 | ⬜ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `hk-hkex` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `jp-jpx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 |
| `us-nyse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |

列说明：2 基本信息、3 监管与法律环境、4 产品体系、5 市场结构与交易机制、6 上市、持续监管与退市、7 指数体系、8 清算、结算与交割、9 市场参与者、10 市场数据与技术基础设施、11 交易成本与税费、12 风险与特殊考量
<!-- END:GENERATED progress-matrix -->

## 数据健康度摘要

<!-- BEGIN:GENERATED health-summary -->
共 259 个已填字段，其中 0 个超过复核阈值待复核。

| 交易所 | 已填字段 | 待复核 |
|---|---|---|
| `ca-tsx` | 54 | 0 |
| `cn-sse` | 52 | 0 |
| `de-eurex` | 33 | 0 |
| `hk-hkex` | 39 | 0 |
| `jp-jpx` | 40 | 0 |
| `us-nyse` | 41 | 0 |
<!-- END:GENERATED health-summary -->

## v1.0 计划：横向铺开到 20+ 家

工程设计与取舍依据见 `PROJECT/DECISIONS.md` [ADR-016]（候选清单与分波依据）、[ADR-017]（并行执行模式与质量门槛）；验收阈值见 `CLAUDE.md` 四。本节只管任务清单与进度，不重复决策理由。

### 工程设计摘要

- **执行模式**：不再逐家串行，改为每波内用 Agent 工具并行派发子代理，一个子代理独立跑完一家交易所的 `add-exchange` skill 全部步骤；波次结束后统一 `make build` 复核一次。
- **验收标准**：每家新交易所人工抽检 10 个字段核对 `quote` 与原始出处，通过率需 ≥95%（阈值不变，样本量比 v0.1 缩小，理由见 [ADR-017]）；未过阈值只暂停复核该家，不影响同批次其他交易所。每波结束后额外过一遍各子代理执行记录，把新教训回写 `add-exchange` skill，再开下一波。
- **退出标准**：两波（15 家）全部完成且各自通过验收 → 总数达到 20 家；`region: mena_africa` 与 `americas` 不再是明显空白；至少新增一个"一所多国"结构样本（Euronext）供 `OPEN-QUESTIONS.md` 框架性问题第17条积累更多真实证据。

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

进度：0/8 已启动。

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

进度：0/7 已启动，名单待 Wave 1 完成后按 [ADR-016] 复核调整。

### 当前进度

- 5/20+ 已完成（`cn-sse`、`hk-hkex`、`us-nyse`、`jp-jpx`、`de-eurex`，见上方填充进度表）
- v1.0 尚未启动，0/15 候选交易所已建档；本节清单是待确认草案，`id`/`region`/`group_id` 以实际建档时核实为准
