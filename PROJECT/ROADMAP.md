# 路线图 ROADMAP

进度状态放这里；「为什么这么排」去 `DECISIONS.md`，这里不重复。

## 当前阶段：v0.3 前端完善已完成，下一步 v1.0 横向铺开

## 阶段路线

- [x] **v0.0 立项 + 可达性探针** — 仓库骨架、`CLAUDE.md`、`PROJECT/` 四件套、`schema/`、`Makefile`、三个 tool 跑通、LICENSE、`.claude/settings.json`；五家标杆抓取方式探明（见 `SOURCES.md`）
- [x] **v0.1 骨架验证** — `taxonomy.yml` 十一章字段字典、上交所+港交所填满、前端矩阵+档案视图最小可用、Pages 上线；人工抽检 20 字段（2026-08-13，基本准确，反馈已回写 `SOURCES.md`「来源 URL 应精确到信息页」一节）
- [x] **语言模型简化**（v0.1 收尾后、v0.2 开始前，独立迁移）— 数据语言从 zh/native/native_lang 三态简化为 zh/en 两态 + 交易所级 `source_lang` 标记，见 `PROJECT/DECISIONS.md` [ADR-013]；两家现有交易所数据已迁移
- [x] **v0.2 标杆扩展** — NYSE / JPX / Eurex 三家数据均已补齐（均 `source_lang: en`）；Eurex 是首个衍生品交易所样本，暴露出 `listing` 章节与 `settlement_cycle`/`short_selling`/`intraday_reversal` 三个字段对非股票交易所不适配，见 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第17条。矩阵维度组已按实测填充率重新校准（[ADR-014]）；`add-exchange` skill 已吸收三次实操教训定型
- [x] **v0.3 前端完善** — 修复语言模式切换的遗留 bug：交易所名称（矩阵行/档案页标题/浮层）、矩阵行地区标签、健康度视图字段名此前都不随模式切换，只是英文模式下用 `en_required` 字段本身的回退掩盖了部分（见 [ADR-013] 的回退设计），这几处是取值路径完全绕过了 langMode 判断；格子浮层加双语标题、章节面包屑、加载态；健康度视图加交易所/类型筛选并支持点行跳出处；矩阵加标杆批次筛选；新增时区甘特条视图（`#view=timezone`），推导方式见 `PROJECT/DECISIONS.md` [ADR-015]
- [ ] **v1.0 横向铺开** — 按 Tier 扩到 20+ 家

## 交易所填充进度

<!-- BEGIN:GENERATED progress-matrix -->
| 交易所 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `cn-sse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `de-eurex` | 🟡 | 🟡 | ✅ | 🟡 | ⬜ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `hk-hkex` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |
| `jp-jpx` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | ⬜ | 🟡 |
| `us-nyse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |

列说明：2 基本信息、3 监管与法律环境、4 产品体系、5 市场结构与交易机制、6 上市、持续监管与退市、7 指数体系、8 清算、结算与交割、9 市场参与者、10 市场数据与技术基础设施、11 交易成本与税费、12 风险与特殊考量
<!-- END:GENERATED progress-matrix -->

## 数据健康度摘要

<!-- BEGIN:GENERATED health-summary -->
共 205 个已填字段，其中 0 个超过复核阈值待复核。

| 交易所 | 已填字段 | 待复核 |
|---|---|---|
| `cn-sse` | 52 | 0 |
| `de-eurex` | 33 | 0 |
| `hk-hkex` | 39 | 0 |
| `jp-jpx` | 40 | 0 |
| `us-nyse` | 41 | 0 |
<!-- END:GENERATED health-summary -->
