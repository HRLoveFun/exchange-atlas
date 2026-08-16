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
| 最大可执行数量原则 | Principle of Highest Executable Volume |  | SIX瑞士交易所集合竞价定价原则——按能撮合出最大成交量的单一价格确定开/收盘价；与Eurex"Netting"流程（同样以最大撮合量定价）是同一类集合竞价定价逻辑在不同交易所的对应表述，比较时可互相参照 |
| 远程会员 | Remote Member |  | 境外证券商无需在本地设立实体、经监管机构授权即可直接成为交易所交易参与者的会员类别；SIX瑞士交易所（FINMA授权）是本项目首个明确记录该制度的样本，日后遇到其他交易所的同类"跨境直接会员"安排应统一使用这一译法比较 |
| 属地监管机关 | Competent State Authority |  | 德国/瑞士等联邦制国家里，交易所设立与运作的监管职能可能落在邦/州一级（如Eurex的黑森州监管机关），而非全国性金融监管总局；与"金融业务行为监管"（如BaFin/FINMA）是两个不同层面的监管，比较跨国交易所监管框架时注意区分 |
