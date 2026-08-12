# 悬案 OPEN-QUESTIONS

查不清的、存疑的、正在改革中的、结构性待验证的问题记在这里，避免反复踩同一个坑。**解决后删除该条目**（把结论转进对应 `data/` 字段与一条 `DECISIONS.md` ADR），不留"已解决"标记——已解决的东西属于别的文件，不属于这里。

## 框架性问题（v0.1 要试出答案）

这几条不是某个具体字段的悬案，是整个 schema 设计的待验证假设，填完上交所/港交所两家后逐条检验：

1. **交易所集团 vs 单个交易所的粒度** — CME 集团下辖 CBOT/NYMEX/COMEX，Euronext 下辖 7 个国家市场。当前方案：数据实体是「交易所/市场」本身，用 `group_id` 关联集团，矩阵未来可折叠成集团视图。v0.1 的 SSE/HKEX 都无此复杂度，暂未实测 `group_id` 的实际使用体验；等 v0.2 引入 CME 系交易所时才会真正压测。
2. ~~schema 会不会被列表型章节撑破~~ — **已验证，够用。** 上交所产品体系（6条）、指数体系（2条）用轻量列表条目填起来很顺，没有感到结构性约束。列表项不需要逐条 quote/confidence 这个简化是对的，继续沿用。
3. **受控词表（enums.yml）够不够用** — 五家标杆的机制差异能否被现有枚举值（如 `price_limit_type`: none/percentage_band/absolute_tiered/dynamic_reference）概括，还是每家都要新增例外值。如果某个字段的例外多到枚举失去意义，结论应该是这个字段不适合进矩阵（改 `in_matrix: false`），而不是无限加枚举值。
4. **`quote` 的粒度与成本——填 SSE 后确认这是真实瓶颈。** 十一章约 80 个可填的叶子字段（不含空章节骨架），实际只有约 20 个做到了 `confidence: high`+完整 quote；其余约 15 个因为"没有当次抓取到的原文可摘录"被迫清空转悬案（监管/参与者/风险等章节尤其明显）。这不是偷懒，是铁律生效的结果——但说明 v0.2 铺开更多交易所时，**每家所投入的检索时间要比"填一个字段"直觉上预期的更多**，排期要按此调整。
5. **`taxonomy.yml` 单文件是否会失控** — 十一章 + 矩阵定义已经不短，未来加字段、加章节细分（如市场结构章节的产品适用范围差异）可能让单文件难以维护，或需要按章拆分成 `schema/chapters/*.yml` 由 sync.py 汇总。
6. **「第三方来源 confidence 上限 medium」这条铁律目前没有被 `validate.py` 机器强制**，只写在 CLAUDE.md/SOURCES.md 里靠自觉遵守。填 SSE 时人工审计出 3 处字段引用第三方镜像（mgzq.com）却误标 `high`，已手工改正，但下次很可能再犯——这正是 CLAUDE.md 6.1 一直在提醒的「文档职责边界靠自觉 vs 靠机器」的活生生案例。v0.2 前应该给 `validate.py` 加一条：按 SOURCES.md 里登记的「官方/监管/第三方」标签反查每条 `sources[].url`，`confidence: high` 但来源标了「第三方」就直接 fail。
7. **上交所现行《交易规则》全文在 sse.com.cn 官网上没能找到直接 URL**——官网只有一份《现行有效业务规则清单》PDF（确认该规则仍生效），但清单本身不含逐条可点击直链，最终改用第三方镜像 mgzq.com（已按第6条降级为 medium）。下次有空定位到官网直链后，把 `market_structure`/`costs`/`products` 里引用 mgzq.com 的字段替换掉，可以合理升回 `high`。
8. **中国证券业协会（SAC，`sac.net.cn`）官网本次抓取返回异常状态码 567**，未排查原因（可能是反爬、可能是该 URL 已失效）。`regulation.self_regulatory_org` 因此留空。

## 具体数据悬案

（填数据时遇到查不清的，按下面格式加条目；`make sync` 会额外从 `data/` 里 `confidence: low` 或空字段生成一份自动清单，附在下面，不需要手动同步那部分）

<!-- BEGIN:GENERATED auto-issues -->
- `cn-sse` 监管与法律环境 / 自律组织（self_regulatory_org）— confidence: low
- `cn-sse` 市场结构与交易机制 / 做空机制（short_selling）— confidence: low
- `cn-sse` 市场结构与交易机制 / 互联互通/跨境安排（connect_schemes）— confidence: low
- `cn-sse` 市场数据与技术基础设施 / 接入方式（access_methods）— confidence: low
- `cn-sse` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
- `hk-hkex` 监管与法律环境 / 自律组织（self_regulatory_org）— confidence: low
- `hk-hkex` 市场结构与交易机制 / 最小交易单位（board_lot_size）— confidence: low
- `hk-hkex` 清算、结算与交割 / 交割方式（delivery_method）— confidence: low
- `hk-hkex` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
<!-- END:GENERATED auto-issues -->
