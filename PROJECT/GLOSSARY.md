# 术语对照表 GLOSSARY

⚠️ 本文件由 `make sync` 从 `schema/glossary.yml` 全量生成，不要手改——改 `glossary.yml`。

| 中文 | English | 原文对照 | 说明 |
|---|---|---|---|
| 指数熔断 | Market-wide Circuit Breaker |  | 大盘指数触发阈值后全市场暂停交易的机制，区别于个股级的波动性中断 |
| 波动性中断机制 | Volatility Control Mechanism (VCM) | en: Volatility Control Mechanism (VCM) | 港交所个股级机制，触发后进入冷静期，非全市场停牌 |
| 波动性中断 | Volatility Interruption | en: Volatility Interruption | Eurex机制，预期成交价超出动态/静态价格区间即触发，以集合竞价恢复交易；官方英文名与港交所VCM不同，且身兼波动性中断与"涨跌停执行方式"双重角色，不与volatility-control-mechanism合并一条 |
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
| 异常订单阈值机制 | Anomalous Order Threshold (AOT) | en: Anomalous Order Threshold (AOT) | ASX等澳大利亚市场使用的订单级价格校验机制，每分钟更新基准价，拒绝偏离基准价±10%以上的激进订单；是ASIC统一市场诚信规则(MIR)的一部分，功能定位介于逐笔价格校验与传统涨跌停之间，官方立场是"替代熔断机制"而非熔断机制本身 |
| 极端成交区间机制 | Extreme Trade Range (ETR) | en: Extreme Trade Range (ETR) | ASX个股级机制，成交价触及每只股票各自设定的区间即暂停该股交易2分钟，与AOT搭配构成ASX应对价格异常波动的组合机制，功能上对应其他交易所的波动性中断，但官方明确区别于circuit breaker |
| 持续披露义务 | Continuous Disclosure |  | 上市实体一旦知悉可能对证券价格或价值产生重大影响的信息即须立即向市场披露的义务；澳大利亚由ASX Listing Rule 3.1规定，并经《公司法》第674条赋予法定效力，触发标准是"合理人预期有重大价格影响"而非固定周期披露 |
