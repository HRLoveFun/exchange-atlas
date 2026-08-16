# 术语对照表 GLOSSARY

⚠️ 本文件由 `make sync` 从 `schema/glossary.yml` 全量生成，不要手改——改 `glossary.yml`。

| 中文 | English | 原文对照 | 说明 |
|---|---|---|---|
| 指数熔断 | Market-wide Circuit Breaker |  | 大盘指数触发阈值后全市场暂停交易的机制，区别于个股级的波动性中断 |
| 波动性中断机制 | Volatility Control Mechanism (VCM) | en: Volatility Control Mechanism (VCM) | 港交所个股级机制，触发后进入冷静期，非全市场停牌 |
| 波动性中断 | Volatility Interruption | en: Volatility Interruption | Deutsche Börse Group（Eurex与Xetra/FWB）共用机制，预期成交价超出动态/静态价格区间即触发，以集合竞价恢复交易；官方英文名与港交所VCM不同，且身兼波动性中断与"涨跌停执行方式"双重角色，不与volatility-control-mechanism合并一条。Xetra（de-xetra）另设"自动扩展区间"（automated price range extension）模型用于ETF/ETN/ETC，是de-eurex没有的变体 |
| 指定发起人 | Designated Sponsor | en: Designated Sponsor | Xetra特有做市参与者角色，为流动性较低证券提供双边约束报价，须遵守最大点差/最小报价量/最小报价时长等质量标准，原则上亦受MiFID II/MiFIR监管做市商规则约束；与纽交所"指定做市商"（DMM）功能相近但制度渊源不同（欧盟MiFID II框架 vs 美国交易所规则），不合并为一条 |
| 受监管市场 | EU Regulated Market |  | 欧盟MiFID II法律意义上的"受监管市场"（如法兰克福的Prime Standard/General Standard），区别于多边交易设施（MTF）性质的"公开市场"；预计随fr-euronext等其他欧盟交易所建档时复用 |
| 公开市场（多边交易设施） | Open Market (MTF) | de: Freiverkehr | 德国交易所法意义上的"Regulierter Freiverkehr"，性质是多边交易设施（MTF）而非受监管市场；法兰克福的Scale板块即设于此，适用的监管义务比受监管市场更轻 |
| 熔断冷静期机制 | Circuit Breaker / Cooling-Off Period | en: Circuit Breaker and Cooling-Off Period | SGX机制，个股/期货合约级别，以滚动参考价（一般为5分钟前成交价）为基准±10%价格带，超出即触发5分钟冷静期（非停牌，价格带内仍可继续交易），官方原文明确"not intended to halt price movement"、区别于固定每日涨跌停模式；与港交所VCM、Eurex波动性中断概念相近但触发机制/冷静期时长/覆盖范围（限STI/MSCI Singapore Free Index成分股及价格≥0.50的产品）均不同，不合并条目 |
| 涨跌限价机制 | Limit Up-Limit Down (LULD) | en: Limit Up-Limit Down (LULD) | 美国证券市场的个股价格带机制，以过去5分钟均价为基准动态计算 |
| 涨跌幅限制 | Price Limit (Percentage Band) |  | 以前收盘价为基准的百分比涨跌幅限制，如上交所主板 ±10% |
| 值幅限制 | Price Limit (Absolute Tiered) | ja: 値幅制限 | 按价格区间分档规定绝对值幅（非百分比），日本市场典型做法；基准价称「基準値段」 |
| 基准价 | Reference Price | ja: 基準値段 |  |
| 当日回转交易 | Intraday Reversal Trading (T+0) |  | 当日买入的证券当日可卖出 |
| 不可当日回转 | No Intraday Reversal (T+1) |  | 当日买入的证券须次一交易日起才可卖出 |
| 注册制 | Registration-based (IPO Review) |  |  |
| 核准制 | Approval-based (IPO Review) |  |  |
| 中央对手方 | Central Counterparty (CCP) |  |  |
| 中央证券存管机构 | Central Securities Depository (CSD) |  |  |
| 做市商制度 | Market Maker Scheme |  |  |
| 指定做市商 | Designated Market Maker (DMM) | en: Designated Market Maker (DMM) | 纽交所特有的场内做市商角色，负责维持特定股票的公平有序市场 |
| 指定做市商 | Designated Market-Maker | en: Designated Market-Maker | SGX机制（规则手册Chapter 6），须就获批品种在交易系统持续提供有约束力的双边报价，与纽交所DMM同名但不是同一制度——纽交所DMM是场内实体角色，SGX这是电子市场下的做市义务注册资格，不与designated-market-maker合并一条 |
| 互联互通机制 | Stock Connect |  | 内地与香港市场间的跨境交易安排，如沪港通/深港通 |
| 收盘集合竞价 | Closing Auction |  |  |
| 开盘集合竞价 | Opening Auction |  |  |
| 大宗交易 | Block Trade |  |  |
| 碎股 | Odd Lot |  |  |
| 一手/整手 | Board Lot |  |  |
| 报升规则 | Uptick Rule |  | 卖空价格不得低于最近成交价的限制性规则 |
| 裸卖空 | Naked Short Selling |  |  |
| 组合保证金 | Portfolio Margining |  | 欧洲期货交易所 Prisma 等采用的基于全组合风险计算保证金的方法，区别于逐笔保证金 |
| 股息预扣税 | Dividend Withholding Tax |  |  |
| 印花税 | Stamp Duty |  |  |
| 特别气配 | Special Quote | ja: 特別気配 | 东证机制，申报价超出值幅制限时不成交、改为显示指示性价格，是值幅制限的执行方式而非独立于价格限制之外的冷静期，与港交所VCM那种独立机制不同类 |
| T+0结算（试点） | T+0 Settlement (Pilot) |  | 印度NSE 2024年起对部分股票试点的可选同日资金证券交收机制，与常规T+1结算并行、非强制；与"当日回转交易"（intraday-reversal-t0，指当日买入的证券当日可卖出，属交易层面）是两个不同维度的概念——一个是结算周期，一个是能否当日反向交易，不要混用 |
| 合格境外投资者（FPI） | Foreign Portfolio Investor (FPI) |  | 印度SEBI对境外投资者参与本地二级市场的注册分类框架，与QFII等其他新兴市场的外资准入分类属同类概念，比较时注意具体持股比例上限、审批流程等细节因市场而异 |
| 证券交易税（STT） | Securities Transaction Tax (STT) |  | 印度对证券及其衍生品交易征收的交易税，按买卖方向与交易品类分别设定税率，与印花税（stamp-duty）是并行但不同的税目，不要合并成一条 |
| 风险警示板 | Risk Warning Board |  | 沪深交易所对被实施风险警示的股票（ST/*ST）及处于退市整理期的股票设立的独立交易板块，交易信息与揭示单独处理，且往往搭配专门的投资者适当性门槛（如深交所退市整理股票要求个人投资者两年交易经验+50万元资产） |
| 价格监控机制 | Price Monitoring (Static/Dynamic) | en: Static Price Monitoring / Dynamic Price Monitoring | 伦敦证券交易所逐证券（非全市场）的价格监控机制，静态阈值相对上一次集合竞价价、动态阈值相对最近成交价，触发后转入波动性拍卖重新形成价格而非直接停牌；与美股LULD、港交所VCM、Eurex波动性中断同属"触发后转拍卖"一类，但阈值设计（按流动性分层的静态/动态双轨）是LSE特有 |
| 认可投资交易所 | Recognised Investment Exchange (RIE) |  | 英国法律地位，交易所自身作为一线监管方对市场准入交易与市场运作负责，与FCA依UKLR对官方名册（Official List）的监管职能并行，是"交易所自身兼一线监管"与"纯外部机构监管"之外的第三种组合 |
| 保荐人 | Sponsor |  | UKLR框架下，官方名册发行人在特定触发事件（如须发布招股说明书、反向收购通函等）下须委任的保荐人角色，向FCA确认申请人/发行人符合相关上市规则要求；与AIM的Nominated Adviser不同——Sponsor只在触发事件发生时需要，不要求持续委任 |
| 认可保荐人 | Nominated Adviser (Nomad) |  | AIM市场特有的持续把关角色，AIM公司须始终委任一名，负责持续评估公司对AIM监管框架的适当性；与UKLR的Sponsor角色（仅特定触发事件下需要）不同，不要合并 |
| 公众持股比例 | Shares in Public Hands (Free Float) |  | UKLR项下官方名册的自由流通量要求，最低10%，跌破且未在合理期限内恢复可触发取消上市；概念上对应中文语境的"公众持股量" |
| 印花税储备税 | Stamp Duty Reserve Tax (SDRT) |  | 英国对电子（无纸化）证券交易征收的税种，税率0.5%，经CREST系统自动代收并划付HMRC；与适用于纸质转让文书的传统印花税（Stamp Duty，见stamp-duty条）并行，两者税率相同但适用场景（电子/纸质）不同，不是同一税种的两种叫法 |
| 异常订单阈值机制 | Anomalous Order Threshold (AOT) | en: Anomalous Order Threshold (AOT) | ASX等澳大利亚市场使用的订单级价格校验机制，每分钟更新基准价，拒绝偏离基准价±10%以上的激进订单；是ASIC统一市场诚信规则(MIR)的一部分，功能定位介于逐笔价格校验与传统涨跌停之间，官方立场是"替代熔断机制"而非熔断机制本身 |
| 极端成交区间机制 | Extreme Trade Range (ETR) | en: Extreme Trade Range (ETR) | ASX个股级机制，成交价触及每只股票各自设定的区间即暂停该股交易2分钟，与AOT搭配构成ASX应对价格异常波动的组合机制，功能上对应其他交易所的波动性中断，但官方明确区别于circuit breaker |
| 持续披露义务 | Continuous Disclosure |  | 上市实体一旦知悉可能对证券价格或价值产生重大影响的信息即须立即向市场披露的义务；澳大利亚由ASX Listing Rule 3.1规定，并经《公司法》第674条赋予法定效力，触发标准是"合理人预期有重大价格影响"而非固定周期披露 |
| 波动性拍卖 | Volatility Auction | en: Volatility Auction | 沙特交易所机制，个股静态限制（Static Limit，±10%，随每次拍卖滚动重设）触发后进入5分钟集合竞价冷静期，非全面停牌；与港交所VCM、Eurex Volatility Interruption同属"个股级冷静阀"机制家族，但基准价（静态价）随拍卖滚动重设是其区别于前两者的设计特点 |
| 平行市场合格投资者 | Qualified Investor (Parallel Market) |  | 沙特Nomu平行市场准入限制——只有合格投资者可交易该板块证券，一般公众不可直接参与；与主板面向公众的开放准入形成对比，未来遇到其他市场的"合格投资者专属板块"设计可比对沿用此译法 |
| 做市商-吃单者定价模式 | Maker-Taker Pricing |  | 为市场提供流动性的报单（maker）获返佣，吃走流动性的一方（taker）付费的交易所收费结构；NYSE、Nasdaq 等美国电子化市场的主流费率模式，回填自 us-nyse（首次出现时未收录，us-nasdaq 建档时补录） |
| 竞争性做市商制度 | Competing Market Maker | en: Market Maker | Nasdaq 传统做市商模式——同一证券允许多家会员机构同时登记为做市商、彼此竞争报价，不同于 NYSE 的单一指定做市商（DMM）在同一证券上独占价格发现职责；与 designated-market-maker 是同一大类（做市商制度）下两种结构不同的具体实现，不合并 |
