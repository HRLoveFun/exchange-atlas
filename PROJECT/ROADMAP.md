# 路线图 ROADMAP

进度状态放这里；「为什么这么排」去 `DECISIONS.md`，这里不重复。

## 当前阶段：v0.1 骨架验证

## 阶段路线

- [x] **v0.0 立项 + 可达性探针** — 仓库骨架、`CLAUDE.md`、`PROJECT/` 四件套、`schema/`、`Makefile`、三个 tool 跑通、LICENSE、`.claude/settings.json`；五家标杆抓取方式探明（见 `SOURCES.md`）
- [x] **v0.1 骨架验证** — `taxonomy.yml` 十一章字段字典、上交所+港交所填满、前端矩阵+档案视图最小可用、Pages 上线；人工抽检 20 字段（2026-08-13，基本准确，反馈已回写 `SOURCES.md`「来源 URL 应精确到信息页」一节）
- [x] **语言模型简化**（v0.1 收尾后、v0.2 开始前，独立迁移）— 数据语言从 zh/native/native_lang 三态简化为 zh/en 两态 + 交易所级 `source_lang` 标记，见 `PROJECT/DECISIONS.md` [ADR-013]；两家现有交易所数据已迁移
- [ ] **v0.2 标杆扩展**（当前）— 补齐 NYSE / JPX / Eurex（预期均 `source_lang: en`，无需啃日语/德语原文）；维度组完善；`add-exchange` skill 定型
- [ ] **v0.3 前端完善** — 语言模式切换、格子浮层出处展示、健康度视图、搜索筛选、时区甘特条
- [ ] **v1.0 横向铺开** — 按 Tier 扩到 20+ 家

## 交易所填充进度

<!-- BEGIN:GENERATED progress-matrix -->
| 交易所 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `cn-sse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `hk-hkex` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ⬜ | 🟡 | 🟡 |

列说明：2 基本信息、3 监管与法律环境、4 产品体系、5 市场结构与交易机制、6 上市、持续监管与退市、7 指数体系、8 清算、结算与交割、9 市场参与者、10 市场数据与技术基础设施、11 交易成本与税费、12 风险与特殊考量
<!-- END:GENERATED progress-matrix -->

## 数据健康度摘要

<!-- BEGIN:GENERATED health-summary -->
共 91 个已填字段，其中 0 个超过复核阈值待复核。

| 交易所 | 已填字段 | 待复核 |
|---|---|---|
| `cn-sse` | 52 | 0 |
| `hk-hkex` | 39 | 0 |
<!-- END:GENERATED health-summary -->
