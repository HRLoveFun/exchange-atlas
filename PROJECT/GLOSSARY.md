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
