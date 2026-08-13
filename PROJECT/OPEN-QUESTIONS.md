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
9. **上交所《交易规则》官方英文译本显示已有 2026 年修订版，本项目现有中文数据仍锚定 mgzq.com 镜像的 2023 年修订版。** ADR-013 迁移时（2026-08-13）在 `english.sse.com.cn` 发现官方英文译本明确标注 "(2026 Revision)"，修订历史显示 2026-04-24 发布，晚于现有中文来源引用的 2023-02-17 版本。两版之间是否有实质性条款变化（尤其 `market_structure`/`costs` 等引用 mgzq.com 的字段）尚未逐条核对，下次有空应优先找到官网直链的 2026 年中文版核对差异（这同时也能解决第 7 条的第三方镜像依赖问题）。
10. **`hk-hkex` 部分 `en_required` 字段的 `quote` 仍是英文，与该所 `source_lang: zh` 的声明不完全一致。** ADR-013 迁移（2026-08-13）把 `native` 字段机械改名为 `en`，但 `regulator`/`core_laws`/`short_selling`/`market_maker_scheme`/`ccp_name`/`csd_name`/`opening_mechanism`/`closing_mechanism` 等字段的 `quote` 仍是 v0.1 首次抓取时留下的英文原文，未重新核实对应的中文官方页面。`circuit_breaker`/`volatility_interruption` 两个字段已在本次迁移中实际抓取港交所中文版（`sc_lang=zh-hk`）升级为中文 quote 锚定，且中文版内容比英文版更精确（点明了 ±10%/±15%/±20% 对应恒生综合大/中/小型股哪个分组），可作为后续补齐其余字段的操作范本。
11. **3 处字段的 `sources` 仍引用交易所官网首页而非具体信息页。** `hk-hkex.yml` 的 `overview.organization_form`、`overview.self_listed`、`clearing.delivery_method` 三处（详见各字段 `detail` 说明）。前两处已尝试在 `hkexgroup.com` 的 About HKEX / Investor Relations 页寻找能直接佐证"股票代码 0388"的更精确来源页，未找到（页面正文未出现股票代码，可能靠动态组件渲染）；第三处本质是对本文件自身 `products` 章节的内部推断，不是独立外部证据。这是 v0.1 人工抽检反馈（见 `SOURCES.md`「经验：来源 URL 要精确到信息页」）尚未完全落实的已知缺口。
12. **`quote` 数字反查用的是"任一数字命中即通过"，不是"全部数字都要命中"，存在被绕过的空间。** ADR-013 迁移时做对抗测试发现：`validate.py` 的判据是 `nums and not any(n in quote for n in nums)`——只要 `zh`/`en` 里**至少一个**数字能在 `quote` 里找到就算通过，不要求每个数字都对得上。故意把 `hk-hkex.yml` `volatility_interruption.en` 里塞一个编造的 "99%" 进去（`zh` 里原有的 10/15/20 仍对得上 quote），`make check` 没有报错——说明**一个字段里混入一个编造数字、只要同字段还有其他真实数字在，检测不出来**。已实测确认把判据改严成"全部数字都要在 quote 里找到"会在真实数据上产生 5 处假阳性（`cn-sse.founded_year` 把"11月26日"与"12月19日"两个不同来源的日期拼进一个字段、`market_cap_usd_bn`/`listed_companies_count` 是主板+科创板两个数字相加算出的合计数、`hk-hkex` 两个交易时段字段同理）——这些都是合法的「多来源合并」或「算出来的数」，quote 只摘了其中一部分数字，不是编造。所以简单改成"必须全部命中"不是免费的改进，需要更细的方案（比如区分"直接摘引"与"由多个 quote 片段推导"两种字段，或者在 detail 里显式标注推导来源），本次迁移未处理，记在这里留待专门解决。

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
