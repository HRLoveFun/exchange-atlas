# 悬案 OPEN-QUESTIONS

查不清的、存疑的、正在改革中的、结构性待验证的问题记在这里，避免反复踩同一个坑。**解决后删除该条目**（把结论转进对应 `data/` 字段与一条 `DECISIONS.md` ADR），不留"已解决"标记——已解决的东西属于别的文件，不属于这里。

## 框架性问题（v0.1 要试出答案）

这几条不是某个具体字段的悬案，是整个 schema 设计的待验证假设，填完上交所/港交所两家后逐条检验：

1. **交易所集团 vs 单个交易所的粒度** — CME 集团下辖 CBOT/NYMEX/COMEX，Euronext 下辖 7 个国家市场。当前方案：数据实体是「交易所/市场」本身，用 `group_id` 关联集团，矩阵未来可折叠成集团视图。**v0.2 填 NYSE 时首次真正用到**：`us-nyse.yml` 标了 `group_id: nyse-group`，因为 NYSE、NYSE American、NYSE Arca、NYSE National、NYSE Texas 是同集团下各自独立注册的 SEC 交易所实体（不是同一实体内部的板块）——这直接影响了 `listing.boards` 怎么填：不能把 NYSE American/Arca 当成 `us-nyse` 的板块塞进 `boards` 列表（那样会歪曲"哪个实体拥有哪条规则"这个事实），只能靠 `group_id` 表达"同集团、不同实体"的关系，`boards` 留空。矩阵折叠视图本身仍未实现（只是数据字段填了），等 CME 系交易所加入时可以再压测一次多层级集团（CME 是单一交易所法人下辖多个产品条线，与 NYSE Group「多个独立法人共享集团」不是同一种集团结构，两种情况 `group_id` 字段够不够表达还需要再观察）。**v1.0 Wave2 填 `fr-euronext` 时出现了第三种、方向相反的集团结构**：Euronext 品牌本身 = Euronext N.V.（荷兰控股实体，自身在 Euronext Paris 挂牌）+ 七个「Euronext Market Undertaking」（Euronext Amsterdam N.V./Euronext Brussels S.A.-N.V./Euronext Dublin/Euronext Lisbon S.A./Euronext Paris S.A./Borsa Italiana/Oslo Børs），逐一是独立注册、分别受本国法律与本国监管机构管辖的法人实体（Harmonised Rulebook Rule 1.7 Governing Law 逐一列明七个法域），但七者共享同一部规则手册与同一交易平台 Optiq。与 NYSE Group/JPX Group「同一国家下多个独立法人」不同，这是「同一部规则、跨多国法人」的结构；且本项目对 `fr-euronext` 的收录颗粒度是把整个联邦结构当成*一条*记录（ROADMAP 没有规划另建 `nl-euronext-amsterdam`/`be-euronext-brussels` 等姊妹记录），所以本行本身就处于"集团"这一层，没有再设置 `group_id` 指向上级——这与此前"本行是集团下一个实体，还有姊妹实体计划单独收录"的 `group_id` 用法方向相反。这暴露出 `group_id` 目前只表达了"松散关联"这一种语义，没有区分"我是联邦制集团里的一员，集团整体也可能被当成一条记录"这种情况；是否需要新增一个反向字段（如 `federation_of`，列出本记录内部实际打包了哪些法人）来承接 Euronext 这类样本，值得在样本更多后评估，暂不动 schema。
2. ~~schema 会不会被列表型章节撑破~~ — **已验证，够用。** 上交所产品体系（6条）、指数体系（2条）用轻量列表条目填起来很顺，没有感到结构性约束。列表项不需要逐条 quote/confidence 这个简化是对的，继续沿用。
3. **受控词表（enums.yml）够不够用** — 五家标杆的机制差异能否被现有枚举值（如 `price_limit_type`: none/percentage_band/absolute_tiered/dynamic_reference）概括，还是每家都要新增例外值。如果某个字段的例外多到枚举失去意义，结论应该是这个字段不适合进矩阵（改 `in_matrix: false`），而不是无限加枚举值。**`review_system` 已经积累了四个互不相同的真实案例**：上交所"注册制"（`registration`枚举）、港交所"披露为本但上市委员会有实质审核权"（未套用枚举，直接留 zh 文字说明）、NYSE"披露为本+非常具体的量化规则编号（如 Rule 102.01C(I)）+ 广泛自由裁量权"（同样未套枚举）、JPX"披露为本，交易所审核+重大事项另须向金融厅报告"（同样未套枚举）——四家没有一家能被现有 `review_system` 枚举值干净覆盖，这个字段目前实质上已经退化成自由文本描述而非可比较的枚举，值得考虑要么扩充枚举维度（如拆成"审核严格度"+"规则形式化程度"两个正交维度），要么承认这个字段不适合进矩阵横向比较，只适合放在档案页。
4. **`quote` 的粒度与成本——填 SSE 后确认这是真实瓶颈。** 十一章约 80 个可填的叶子字段（不含空章节骨架），实际只有约 20 个做到了 `confidence: high`+完整 quote；其余约 15 个因为"没有当次抓取到的原文可摘录"被迫清空转悬案（监管/参与者/风险等章节尤其明显）。这不是偷懒，是铁律生效的结果——但说明 v0.2 铺开更多交易所时，**每家所投入的检索时间要比"填一个字段"直觉上预期的更多**，排期要按此调整。
5. **`taxonomy.yml` 单文件是否会失控** — 十一章 + 矩阵定义已经不短，未来加字段、加章节细分（如市场结构章节的产品适用范围差异）可能让单文件难以维护，或需要按章拆分成 `schema/chapters/*.yml` 由 sync.py 汇总。
6. **「第三方来源 confidence 上限 medium」这条铁律目前没有被 `validate.py` 机器强制**，只写在 CLAUDE.md/SOURCES.md 里靠自觉遵守。填 SSE 时人工审计出 3 处字段引用第三方镜像（mgzq.com）却误标 `high`，已手工改正，但下次很可能再犯——这正是 CLAUDE.md 6.1 一直在提醒的「文档职责边界靠自觉 vs 靠机器」的活生生案例。v0.2 前应该给 `validate.py` 加一条：按 SOURCES.md 里登记的「官方/监管/第三方」标签反查每条 `sources[].url`，`confidence: high` 但来源标了「第三方」就直接 fail。
7. **上交所现行《交易规则》全文在 sse.com.cn 官网上没能找到直接 URL**——官网只有一份《现行有效业务规则清单》PDF（确认该规则仍生效），但清单本身不含逐条可点击直链，最终改用第三方镜像 mgzq.com（已按第6条降级为 medium）。下次有空定位到官网直链后，把 `market_structure`/`costs`/`products` 里引用 mgzq.com 的字段替换掉，可以合理升回 `high`。
8. **中国证券业协会（SAC，`sac.net.cn`）官网本次抓取返回异常状态码 567**，未排查原因（可能是反爬、可能是该 URL 已失效）。`regulation.self_regulatory_org` 因此留空。
9. **上交所《交易规则》官方英文译本显示已有 2026 年修订版，本项目现有中文数据仍锚定 mgzq.com 镜像的 2023 年修订版。** ADR-013 迁移时（2026-08-13）在 `english.sse.com.cn` 发现官方英文译本明确标注 "(2026 Revision)"，修订历史显示 2026-04-24 发布，晚于现有中文来源引用的 2023-02-17 版本。两版之间是否有实质性条款变化（尤其 `market_structure`/`costs` 等引用 mgzq.com 的字段）尚未逐条核对，下次有空应优先找到官网直链的 2026 年中文版核对差异（这同时也能解决第 7 条的第三方镜像依赖问题）。
10. **`hk-hkex` 部分 `en_required` 字段的 `quote` 仍是英文，与该所 `source_lang: zh` 的声明不完全一致。** ADR-013 迁移（2026-08-13）把 `native` 字段机械改名为 `en`，但 `regulator`/`core_laws`/`short_selling`/`market_maker_scheme`/`ccp_name`/`csd_name`/`opening_mechanism`/`closing_mechanism` 等字段的 `quote` 仍是 v0.1 首次抓取时留下的英文原文，未重新核实对应的中文官方页面。`circuit_breaker`/`volatility_interruption` 两个字段已在本次迁移中实际抓取港交所中文版（`sc_lang=zh-hk`）升级为中文 quote 锚定，且中文版内容比英文版更精确（点明了 ±10%/±15%/±20% 对应恒生综合大/中/小型股哪个分组），可作为后续补齐其余字段的操作范本。
11. **3 处字段的 `sources` 仍引用交易所官网首页而非具体信息页。** `hk-hkex.yml` 的 `overview.organization_form`、`overview.self_listed`、`clearing.delivery_method` 三处（详见各字段 `detail` 说明）。前两处已尝试在 `hkexgroup.com` 的 About HKEX / Investor Relations 页寻找能直接佐证"股票代码 0388"的更精确来源页，未找到（页面正文未出现股票代码，可能靠动态组件渲染）；第三处本质是对本文件自身 `products` 章节的内部推断，不是独立外部证据。这是 v0.1 人工抽检反馈（见 `SOURCES.md`「经验：来源 URL 要精确到信息页」）尚未完全落实的已知缺口。
12. **`quote` 数字反查用的是"任一数字命中即通过"，不是"全部数字都要命中"，存在被绕过的空间。** ADR-013 迁移时做对抗测试发现：`validate.py` 的判据是 `nums and not any(n in quote for n in nums)`——只要 `zh`/`en` 里**至少一个**数字能在 `quote` 里找到就算通过，不要求每个数字都对得上。故意把 `hk-hkex.yml` `volatility_interruption.en` 里塞一个编造的 "99%" 进去（`zh` 里原有的 10/15/20 仍对得上 quote），`make check` 没有报错——说明**一个字段里混入一个编造数字、只要同字段还有其他真实数字在，检测不出来**。已实测确认把判据改严成"全部数字都要在 quote 里找到"会在真实数据上产生 5 处假阳性（`cn-sse.founded_year` 把"11月26日"与"12月19日"两个不同来源的日期拼进一个字段、`market_cap_usd_bn`/`listed_companies_count` 是主板+科创板两个数字相加算出的合计数、`hk-hkex` 两个交易时段字段同理）——这些都是合法的「多来源合并」或「算出来的数」，quote 只摘了其中一部分数字，不是编造。所以简单改成"必须全部命中"不是免费的改进，需要更细的方案（比如区分"直接摘引"与"由多个 quote 片段推导"两种字段，或者在 detail 里显式标注推导来源），本次迁移未处理，记在这里留待专门解决。
13. **`price_limits.type` 的 `dynamic_reference` 枚举值目前只有 NYSE 一个样本**，且填入时只能定性描述"以过去5分钟均价为基准动态计算"，未找到官方原文给出 Tier 1/Tier 2 具体价格带百分比（`market_structure.price_limits.main_board` 因此留了半句话说明"具体档位数值本次未在抓取页面中找到"）。这类"机制存在但具体数值缺失"的半成品状态，在矩阵格子上会显示成有内容但点开细则不完整，需要考虑前端是否要对这种情况加一个视觉区分（不同于完全空的格子，也不同于完整填好的格子）。
14. **`us-nyse` 的清算机构（NSCC/DTCC）字段整体留空。** `clearing.ccp_name`/`csd_name` 按常识应该是 National Securities Clearing Corporation / Depository Trust Company（均为 DTCC 子公司），但 `dtcc.com` 的所有内容子页（`/accelerated-settlement`、`/about` 等）本次多次尝试均返回 403，只有首页能访问且无实质内容（见 `SOURCES.md` 探测记录）。这是本项目第一次因为"常识性事实"和"能否找到可引用原文"发生冲突而选择遵守铁律留空的案例——诱惑很大（这个事实几乎不可能错），但按 CLAUDE.md 二第1条，没有当次抓取的原文撑腰就不填，哪怕是几乎确定正确的内容。下次有空应该专门想办法绕过 DTCC 的反爬（换 UA、加 Referer，或找 DTCC 年报/SEC备案文件里对 NSCC 角色的官方表述作为替代来源）。
15. **`us-nyse.short_selling` 的具体触发阈值（Reg SHO Alternative Uptick Rule 的"较前收盘价下跌几%触发"）未能确认。** 与第14条类似，`sec.gov` 与 `finra.org` 本次分别尝试抓取相关规则页均返回403，无法核实这个业内广为人知的具体数字（常识印象是10%，但没有当次抓取的原文，按铁律不采纳）。这三个域名（sec.gov/finra.org/dtcc.com）叠加起来构成了美股监管/清算类信息目前最大的抓取缺口，值得作为一个整体去想解决方案，而不是逐字段单独想办法绕过。
16. **`jp-jpx` 是否存在独立于「特別気配」之外的全市场级熔断机制，本次未能确认。** TSE《业务规程》里明确的波动控制手段是个股级的「特別気配」（申报价超出值幅制限时不成交、改显示指示性价格），这本质是值幅制限的执行方式；本次抓取的官方英文文档中没有找到类似美股 MWCB（基于大盘指数跌幅触发全市场停牌）那种独立机制的条文，但也不能排除是本次检索范围没覆盖到相关规则（如更晚修订的规程或大阪交易所衍生品市场的规则）。`circuit_breaker` 字段的 `detail` 里已如实标注这一点为未确认状态，而不是断言"日本没有市场级熔断"。
17. **`taxonomy.yml` 假设的「公司上市」范式在衍生品交易所（`de-eurex`）不成立，这是 ADR-009 当初就预期要压测的问题，现在有了真实结果。** 六｜上市章节的全部字段（`boards`/`review_system`/`delisting_conditions`等）对期货期权交易所都不适用——衍生品交易所没有公司上市，只有「交易员/交易参与者准入」（更接近 `participants` 章节）与「合约挂牌」（更接近 `products` 章节）两个概念，`de-eurex.yml` 对 `listing` 整章如实留空并在章节顶部注释说明，没有强行把交易员准入规则套进上市字段。同样不完全适用的还有三个具体字段：`clearing.settlement_cycle`（衍生品是"每日盯市+到期日交割"，不是"买入后T+N天收货"的时间结构）、`market_structure.short_selling`（衍生品"卖出开仓"不涉及股票式的借券，机制前提不同）、`market_structure.intraday_reversal`（衍生品开平仓当日自由进行，T+0/T+1式限制的设计前提不成立）——这三个字段 `de-eurex.yml` 都如实留空并在 `detail` 里说明"设计前提不适用"，没有强行选一个enum凑数。**结论：`taxonomy.yml` 目前是以现货股票市场为默认范式设计的，六｜上市章节与三个具体字段对衍生品交易所存在系统性不适配，比"受控词表不够用"（第3条）更严重——那是"选项不够"，这是"整章/整个字段的前提假设都不成立"。** 是否需要给 `taxonomy.yml` 引入按交易所类型（现货/衍生品）的章节级条件适用机制，还是继续用"留空+detail说明"的方式吸收这类差异，等 v0.2 五家标杆全部完成、有更多样本后再评估，不要现在就动 schema。
18. **`taxonomy.yml` 假设的「一个交易所=一个法域=一个监管机构」在多国联邦制交易所（`fr-euronext`）同样不成立，是第17条"单一法域假设"问题的另一种表现形式——这次不是产品类型不适配，而是法域数量不适配。** `regulation.regulator`/`regulation.core_laws` 这类设计为单值描述的字段，在 Euronext 实际对应的是七个国家、七个监管机构、七部国内法（见 `regulator` 字段 detail）；`overview.timezone` 也因都柏林（西欧时间）与其余六市场（中欧时间）不一致而无法用单一时区表达清楚。本文件对这类字段采用"列出全部结构、不强行选一个国家代表整体"的处理方式（如 `regulator` 字段完整列出七国监管机构对照），字段变长但没有失真；`market_structure.tick_size` 与 `market_structure.short_selling` 两个字段则暴露了这套结构性问题的另一层——欧盟层面的 MiFID II（tick size 分层表）与卖空规则 SSR (EU) No 236/2012 是跨越整个欧盟统一适用的监管层级，既不是"Euronext 交易所自己定的规则"（字段设计假设的主体），也不是能归到某一个国家监管机构头上的国别规则，这是继"衍生品 vs 现货"、"单交易所 vs 多法域集团"之后，第三种让 taxonomy 单值字段吃不消的情况——"规则制定层级本身就在交易所与单一国家监管机构之上（欧盟层面）"。三个字段均如实留空 + detail 说明，未强行代入某一国的规则或猜一个欧盟层面数值。是否需要给 taxonomy 增加"监管层级"（交易所自定/国家监管/超国家联盟监管）这个维度，待更多欧盟成员国交易所样本（如 Xetra、LSE）积累后再评估。
19. **Euronext 的标准每日开收盘时刻表（几点几分进入连续交易、几点几分收盘集合竞价）本次未能在静态可抓取的官方页面中定位到。** `trading/trading-hours-holidays` 页只公布节假日例外与半日交易安排（如都柏林收盘13:28-13:30 CET这类片段时刻），不含常态时刻表；`Notice n°4-01 Trading Manual` PDF 详细描述了开盘/收盘集合竞价的撮合机制，但同样不含具体钟点，钟点表实际发布在该 Notice 的附件（`Appendix to Euronext Instructions 4-01 4-03 Trading Manuals`，xlsx 格式）里——本次抓取范围未纳入 xlsx 解析。业内常见印象是主交易时段 09:00-17:30 CET，但未经当次抓取原文核实，`market_structure.trading_sessions.continuous_am`/`continuous_pm` 按铁律留空未采纳这一印象。下次有空应把该 xlsx 附件纳入 `fetch.py` 抓取范围（目前 `fetch.py` 已支持 PDF，需确认是否也能正常落盘 xlsx；若不能需要专门下载后用 Python `openpyxl` 解析）。

## 具体数据悬案

（填数据时遇到查不清的，按下面格式加条目；`make sync` 会额外从 `data/` 里 `confidence: low` 或空字段生成一份自动清单，附在下面，不需要手动同步那部分）

- `fr-euronext` 阿姆斯特丹/布鲁塞尔/巴黎三个市场（迁移至 Euronext Securities Milan 前）与都柏林市场，具体使用哪家中央证券存管机构（CSD）本次未找到官方原文明确点名（`clearing.csd_name` 已如实说明这一缺口，只确认了里斯本/米兰/奥斯陆三地已用集团自有 Euronext Securities）。业内印象前三者历史上分别用各国 Euroclear 系统，但未经当次抓取原文核实，不采纳。下次有空可查 Euroclear Nederland/Belgium/France 官网或 Euronext Securities European Offering 页面找到明确表述。
- `fr-euronext` `overview.market_cap_usd_bn` 存在口径歧义未填：Euronext N.V. 作为一家自身上市公司的市值（约€14.5bn，2025-08-22）与"七个市场上全部挂牌公司的总市值"是两个不同的数，本字段设计意图显然是后者，但本次抓取材料只找到前者，为避免混淆两种口径，选择留空而非拿前者凑数，见字段 `detail`。
- `fr-euronext` 2025年7月新收购的雅典市场（Euronext Athens）尚未整合进 Harmonised Rulebook 与 Optiq 平台（官方原文给出的迁移目标是2027年6月），本文件多数字段的"七个市场"表述均不含雅典；待迁移完成后需要专门复查一遍雅典是否已可与其余七个市场同等对待、本文件是否要相应改写为"八个市场"。

<!-- BEGIN:GENERATED auto-issues -->
- `cn-sse` 监管与法律环境 / 自律组织（self_regulatory_org）— confidence: low
- `cn-sse` 市场结构与交易机制 / 做空机制（short_selling）— confidence: low
- `cn-sse` 市场结构与交易机制 / 互联互通/跨境安排（connect_schemes）— confidence: low
- `cn-sse` 市场数据与技术基础设施 / 接入方式（access_methods）— confidence: low
- `cn-sse` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
- `de-eurex` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
- `fr-euronext` 基本信息 / 结算货币（settlement_currency）— confidence: low
- `fr-euronext` 市场结构与交易机制 / 上午连续竞价（trading_sessions.continuous_am）— confidence: low
- `fr-euronext` 市场结构与交易机制 / 其他板块幅度（price_limits.other_boards）— confidence: low
- `fr-euronext` 市场结构与交易机制 / 大宗交易（block_trade）— confidence: low
- `fr-euronext` 市场结构与交易机制 / 互联互通/跨境安排（connect_schemes）— confidence: low
- `hk-hkex` 监管与法律环境 / 自律组织（self_regulatory_org）— confidence: low
- `hk-hkex` 市场结构与交易机制 / 最小交易单位（board_lot_size）— confidence: low
- `hk-hkex` 清算、结算与交割 / 交割方式（delivery_method）— confidence: low
- `hk-hkex` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
- `jp-jpx` 市场结构与交易机制 / 节假日与特殊休市（holidays_note）— confidence: low
- `jp-jpx` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
- `jp-jpx` 风险与特殊考量 / 制度变革风险（regulatory_change_risk_note）— confidence: low
- `us-nyse` 市场结构与交易机制 / 节假日与特殊休市（holidays_note）— confidence: low
- `us-nyse` 市场结构与交易机制 / 订单类型（order_types）— confidence: low
- `us-nyse` 风险与特殊考量 / 汇率风险（fx_risk_note）— confidence: low
<!-- END:GENERATED auto-issues -->
