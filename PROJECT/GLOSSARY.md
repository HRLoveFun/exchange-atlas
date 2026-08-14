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
| 价格监控机制 | Price Monitoring (Static/Dynamic) | en: Static Price Monitoring / Dynamic Price Monitoring | 伦敦证券交易所逐证券（非全市场）的价格监控机制，静态阈值相对上一次集合竞价价、动态阈值相对最近成交价，触发后转入波动性拍卖重新形成价格而非直接停牌；与美股LULD、港交所VCM、Eurex波动性中断同属"触发后转拍卖"一类，但阈值设计（按流动性分层的静态/动态双轨）是LSE特有 |
| 认可投资交易所 | Recognised Investment Exchange (RIE) |  | 英国法律地位，交易所自身作为一线监管方对市场准入交易与市场运作负责，与FCA依UKLR对官方名册（Official List）的监管职能并行，是"交易所自身兼一线监管"与"纯外部机构监管"之外的第三种组合 |
| 保荐人 | Sponsor |  | UKLR框架下，官方名册发行人在特定触发事件（如须发布招股说明书、反向收购通函等）下须委任的保荐人角色，向FCA确认申请人/发行人符合相关上市规则要求；与AIM的Nominated Adviser不同——Sponsor只在触发事件发生时需要，不要求持续委任 |
| 认可保荐人 | Nominated Adviser (Nomad) |  | AIM市场特有的持续把关角色，AIM公司须始终委任一名，负责持续评估公司对AIM监管框架的适当性；与UKLR的Sponsor角色（仅特定触发事件下需要）不同，不要合并 |
| 公众持股比例 | Shares in Public Hands (Free Float) |  | UKLR项下官方名册的自由流通量要求，最低10%，跌破且未在合理期限内恢复可触发取消上市；概念上对应中文语境的"公众持股量" |
| 印花税储备税 | Stamp Duty Reserve Tax (SDRT) |  | 英国对电子（无纸化）证券交易征收的税种，税率0.5%，经CREST系统自动代收并划付HMRC；与适用于纸质转让文书的传统印花税（Stamp Duty，见stamp-duty条）并行，两者税率相同但适用场景（电子/纸质）不同，不是同一税种的两种叫法 |
