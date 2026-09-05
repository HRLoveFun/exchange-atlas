# 约翰内斯堡证券交易所 Johannesburg Stock Exchange (JSE) `za-jse`
- `jse.co.za` | 官方 | en（南非无为JSE本身立法声明的"官方语言"，但全部规则/上市文件/技术规范均只有英文版，未见南非其他官方语言的对照版本，与美股NYSE同理按实际使用语言取 official_languages: [en]） | 建档时（2026-08-16）curl 常规 UA 全部 200、全程未见反爬/限流；⚠️ 2026-08-30 一个后台任务里三个子域名（`www.` / `group.` / `clientportal.`）**全部返回 Cloudflare「Access Denied」403**（首页、深层页、多种 UA + Referer 头均无效），见本节末尾探测记录 2026-08-30 补记——疑似环境相关（数据中心/云出口比住宅 IP 更易被 Cloudflare 拦），住宅 IP 下可能仍可访问 | 官网横跨三个子域名：`www.jse.co.za`（产品/服务介绍页）、`group.jse.co.za`（集团概况、历史沿革、投资者关系）、`clientportal.jse.co.za`（规则文档/市场通知/技术规格 PDF 的实际托管域名，很多深层 PDF 链接指向这里，三者按 `validate.py` 的域名后缀匹配规则统一登记为 `jse.co.za` 一条即可覆盖）。⚠️ 部分关键 PDF（如权益市场交易时段表、熔断阈值表）正文数据是图片渲染，`pdftotext -layout` 抓不出表格数字；换成同信息的另一份《交易信息系统概念培训》PDF（`Conceptual Training_v2.pdf`）才拿到可摘引的纯文本版本（含 ZA01/ZA02 分段的静态/动态熔断阈值百分比表），这是本次抓取里唯一能完整摘引熔断具体数值的来源，下次抓类似"阈值表"类内容时优先找培训/说明类文档而非官方摘要通知
  - 首页: https://www.jse.co.za/
  - 现货股票市场总览: https://www.jse.co.za/trade/equities-market
  - 主板: https://www.jse.co.za/raise-capital/equities-market/main-board
  - AltX（另类市场）: https://www.jse.co.za/raise-capital/equities-market/altx
  - 专项证券（ETF/AMETF/ETN/AMC/权证做市商制度介绍）: https://www.jse.co.za/raise-capital/specialist-securities
  - 集团概况与历史沿革（1887年成立、2005年改制上市、2016年T+3、Millennium Exchange交易系统等关键年表，逐条注明年份可直接摘引）: https://group.jse.co.za/group-overview/history
  - 公司信息页（JSE Limited自身股票代码JSE、ISIN ZAE000079711、注册号2005/022939/06）: https://group.jse.co.za/investor-relations/company-information
  - T+3结算说明（含Lines of Defence多层结算保障机制，注意：现货证券市场靠此机制而非CCP净额担保，与衍生品市场的JSE Clear CCP模式不同）: https://www.jse.co.za/services/post-trade-services/t3settlement
  - 清算结算服务总览: https://www.jse.co.za/services/clearing-and-settlement-operations
  - 指数服务总览: https://www.jse.co.za/services/indices/ftsejse-africa-index-series
  - JSE Clear（衍生品市场中央对手方）授牌新闻: https://www.jse.co.za/news/news/jse-clear-granted-independent-clearing-house-central-counterparty-licence
  - 打击裸卖空市场通知（Market Notice 293/2021，引用交易规则10.50.1/10.50.2条）PDF: https://clientportal.jse.co.za/Content/JSENoticesandCircularsItems/JSE%20Market%20Notice%2029321%20EQM%20-%20Reminder%20on%20the%20Prohibition%20of%20Naked%20Short-Selling%20in%20JSE%20Equities%20Market.pdf
  - 权益市场交易时段 PDF（仅含开收盘时刻，表格式）: https://clientportal.jse.co.za/Content/JSE%20Trading%20Dates%20and%20Calendars%20Items/EquityMarketTradingHours.pdf
  - 熔断与拍卖机制摘要通知 PDF（阈值表为图片，仅正文定义可摘引）: https://clientportal.jse.co.za/Content/JSEHotlinesItems/JSE%20Service%20Hotline%2006220%20EQM%20and%20EDM%20-%20Upgrade%20Summary%20of%20JSE%20Circuit%20Breakers%20and%20Auctions.pdf
  - 权益市场交易信息总览（Volume 00E，含撮合原则、订单类型、静态/动态参考价定义正文，114页）PDF: https://clientportal.jse.co.za/Content/JSE%20Contract%20Specification%20Items/Volume%2000E%20-%20Trading%20and%20Information%20Overview%20for%20Equity%20Market%20v4.08.pdf
  - 交易信息系统概念培训（含交易时段表与ZA01/ZA02熔断阈值百分比表的纯文本版）PDF: https://clientportal.jse.co.za/Content/JSE%20Technology%20Document%20Items/Equity%20Market_Trading%20%20Information%20System_Conceptual%20Training_v2.pdf
  - 上市规则（简化版，2025年12月）PDF: https://www.jse.co.za/sites/default/files/media/documents/jse-listings-requirements-simplified/JSE_Listings_Requirements_Simplified_Final_@_12_December_2025_Final.pdf
  - 权益市场指引（Equities Directives）PDF: https://www.jse.co.za/sites/default/files/media/documents/equities-directives/Equities%20Directives.pdf
  - 衍生品市场总览（2026-08-18补充抓取，补齐market_structure.derivatives子块）: https://www.jse.co.za/trade/derivative-market
  - 利率衍生品概览（含Jibar期货/掉期期货/债券期货期权说明）: https://www.jse.co.za/trade/derivative-market/interest-rate-derivatives
  - 衍生品规则（Derivatives Rules，2019年4月29日版，含保证金8.60/9.20条、场外协商交易7.114/7.115条、监管性停牌7.190条）PDF: https://www.jse.co.za/sites/default/files/jse_document_manager/RW/Internal/Trade/Derivative%20Market/Derivatives%20Market/DerivativesRules.pdf
  - 衍生品市场交易信息总览（Volume 00D，v2.04，2026年5月28日版，含交易时段/订单类型/熔断阈值表，112页；⚠️WebSearch摘要给出的clientportal旧版直链v2.03已失效，改经 clientportal.jse.co.za/technical-library/trading-and-market-data-documentation 落地页定位到当前版本v2.04）PDF: https://clientportal.jse.co.za/Content/JSE%20Contract%20Specification%20Items/Volume%2000D%20-%20Trading%20and%20Information%20Overview%20for%20Derivative%20Markets%20v2.04.pdf
  - 权益衍生品市场交易时段 PDF: https://clientportal.jse.co.za/Content/JSE%20Trading%20Dates%20and%20Calendars%20Items/EquityDerivativesTradingHours.pdf
  - 货币衍生品市场交易时段 PDF: https://www.jse.co.za/sites/default/files/jse_document_manager/RW/Internal/Currency%20Derivatives/Currency%20Derivatives%20Trading%20Hours.pdf
  - 指数期权做市商计划说明页: https://www.jse.co.za/trade/derivatives-market/equity-derivatives/market-making-index-options
  - 股指期货合约规格Fact Sheet（2012年8月版，ALSI/Mini等FTSE/JSE Top40系列期货；⚠️年代较久，本次未找到更新版本，合约乘数/最小变动单位等结构性事实按medium confidence处理）PDF: https://www.jse.co.za/sites/default/files/jse_document_manager/RW/Internal/Equity%20Index%20Futures/ContractSpecifications.pdf
  - SAFCOM保证金方法论说明（Portfolio Scanning模型概述，2012年10月版）PDF: https://www.jse.co.za/sites/default/files/jse_document_manager/RW/Internal/Post%20Trade%20Services/Regulatory%20Compliance/SAFCOM%20Margin%20Methodology.pdf
  - JSE Clear保证金方法论（JSPAN算法，2019年2月版）PDF: https://www.jse.co.za/sites/default/files/media/documents/2020-08/JSE%20Clear%20Margin%20Methdology.pdf
- `fsca.co.za` | 监管 | en | curl 常规 UA 200 | 金融部门行为监管局（Financial Sector Conduct Authority），南非"双峰"（Twin Peaks）监管架构下的市场行为监管方，2018年由原金融服务局（FSB）改制而来
  - 关于我们: https://www.fsca.co.za/about-us/
- `strate.co.za` | 官方（中央证券存管机构） | en | curl 常规 UA 200（575KB，内容较厚） | Strate Limited，南非法定中央证券存管机构（CSD），负责JSE现货证券市场的电子结算
  - 关于我们: https://www.strate.co.za/about-us/
- `sars.gov.za` | 监管（税务机关） | en | curl 常规 UA 200 | 南非税务局（South African Revenue Service），股息预扣税与证券转让税的法定征收与规则发布方；`costs.stamp_duty` 的 `side: buy` 方向措辞出处（『Who is it for?』段：member/participant『may recover the tax payable from the persons to whom the securities were transferred』——ADR-065 坐实）
  - 股息预扣税: https://www.sars.gov.za/types-of-tax/dividends-tax/
  - 证券转让税: https://www.sars.gov.za/types-of-tax/securities-transfer-tax/
- `sharenet.co.za`（2026-09-04 新增登记，ADR-067） | 第三方（南非老牌投资门户 / JSE 会员券商，费率表转述 JSE 官方收费） | en | curl 常规 UA 200 | `za-jse costs.regulatory_fees` 出处——`/feeschedule/` 页逐项列出 JSE 交易的法定征费：『Investor Protection levy at 0.0002% of trade value』『Securities Transfer Tax (STT) of 0.25% ... levied on the value of purchase transactions』『Strate levy of R8.25 to R88.92』。⚠️ jse.co.za 三个子域名 + WebFetch 均 Cloudflare 403（本轮再确认），JSE 一手价目表未取到；本页费率可能滞后（IPL 记 0.0002%，2026 现行据 Market Notice 37025 约 0.000345%），`confidence` 封顶 medium
- `lseg.com` | 第三方（伦敦证券交易所集团旗下 FTSE Russell，与JSE联合编制指数） | en | curl 常规 UA 200（586KB） | 《FTSE/JSE Africa Index Series Ground Rules》官方编制细则文档，JSE与FTSE Russell联合发布，用于确认指数编制方非JSE自编而是合资/授权模式
  - FTSE/JSE Africa Index Series Ground Rules（v9.1，2026年2月）PDF: https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-jse-africa-index-series-ground-rules.pdf

---

- `www.resbank.co.za` | 官方（南非储备银行 SARB） | en | curl 常规 UA 200；⚠️ 2026-09-05 复测：`/content/dam/` 下的 PDF 直链与 `mpc-statements` 列表页被 WAF 拦（HTTP 200 但响应体为 244B「Request Rejected」，F5/BIG-IP 特征），普通说明页仍可达——PDF 类来源走 wayback 回退；已实测 SARB 一手材料（MPC 声明 2026-03 / MPR April 2025）**均无汇率制度定性表述**，兰特自由浮动的制度性原文需另寻来源（fx_risk_note 改用 IMF，见下） | 资本管制/外汇/退市后转移（capital_controls/post_delisting_venue 出处）
- `imf.org` | 第三方（国际组织，IMF——按 CLAUDE.md 二第3条与 [ADR-079]，confidence 封顶 medium，即便摘到逐字原文也一样；仅作 AREAER / 第四条款磋商类兜底与交叉印证，不作主源） | en | ⚠️ `www.elibrary.imf.org` 直连 403，经 wayback 快照抓取 | 汇率制度定性（fx_risk_note 出处）：SARB 一手页面无「兰特自由浮动」的定性原文（已实测 MPC 声明与 MPR），IMF 第四条款磋商报告的 Exchange Rate Arrangement 小节是该断言当前可得的最正式来源
  - South Africa: 2022 Article IV Consultation—Staff Report（IMF Country Report No. 22/37，Exchange Rate Arrangement 小节：rand 自由浮动 + de jure free floating / de facto floating；直连 403，经 wayback 快照 20240529213244 抓取，392KB）PDF: https://www.elibrary.imf.org/downloadpdf/view/journals/002/2022/037/article-A002-en.pdf
- `www.gov.za` | 官方（南非政府） | en | curl 常规 UA 200 | 账户开立/ suitability 监管（account_opening_requirements 出处）
- `www.state.gov` | 官方（美国国务院投资环境报告） | en | WebSearch 定位 | 外资准入/政治风险（foreign_ownership_limit/political_risk_note 出处）
- `www.fatf-gafi.org` | 官方（FATF） | en | WebSearch 定位 | 政治/合规风险（political_risk_note 出处）
- `www.a2x.co.za` | 官方（A2X 交易所） | en | curl 常规 UA 200 | 另类交易场所/暗池背景（market_structure 出处）
- `www.nsx.com.na` | 官方（纳米比亚证券交易所） | en | WebSearch 定位 | 区域连接方案（market_structure.derivatives.connect_schemes 出处）
- `www.otcexpress.co.za` | 第三方（OTC 平台） | en | WebSearch 定位 | 退市后 OTC 转移（post_delisting_venue 出处，confidence medium）
- `blogs.easyequities.co.za` | 第三方（券商博客） | en | WebSearch 定位 | 退市后转移（confidence medium）
- `actacommercii.co.za` | 第三方（学术期刊） | en | WebSearch 定位 | 外资限制研究（confidence medium）
- `businesstech.co.za` | 第三方（科技财经媒体） | en | WebSearch 定位 | 投资者结构（confidence medium）
- `pmg.org.za` | 第三方（议会监测组织） | en | WebSearch 定位 | 投资者结构（confidence medium）
- `tiomarkets.com` | 第三方（券商） | en | WebSearch 定位 | 佣金结构（commission_structure 出处，confidence medium）
- `www.globallegalinsights.com` | 第三方（法律指南） | en | WebSearch 定位 | 上市流程（listing_process_duration 出处，confidence medium）
- `www.lexology.com` | 第三方（法律资讯） | en | WebSearch 定位 | 上市流程（confidence medium）

## 探测记录（za-jse 建档，2026-08-16）

与 v0.2 填 NYSE 时的情况相似，本次也踩到"监管/立法类第三方数据库域名被拦"的坑：`saflii.org`（南非法律信息研究所，用于查《金融市场法》Financial Markets Act 19 of 2012 全文）与 `lawlibrary.org.za` 两个域名对同一份法律文本的 PDF/HTML 页面均返回 403（换 UA、加延时重试均无效，与 sec.gov/finra.org 的边缘防护特征类似）。绕过方式：改用 JSE 官方《上市规则》PDF 定义章节里对该法的引用原文（"FMA the Financial Markets Act No.19 of 2012, as amended"）作为 `core_laws` 的来源——足以确认法律全称与编号且来自 JSE 自己的官方文档（未降级为 medium），但未能拿到法律条文全文逐条核对其他章节（如做空/披露的具体法条编号），这部分留待下次专门解决 saflii/lawlibrary 的反爬问题时补齐。

`jse.co.za` 三个子域名（`www.` / `group.` / `clientportal.`）加上 `fsca.co.za`、`strate.co.za`、`sars.gov.za`、`lseg.com` 全部一次性 curl 常规 UA 成功，无一例 403，是本项目目前抓取难度最低的交易所之一。

**2026-08-30 补记（一个后台任务）**：`jse.co.za` 三个子域名此时全部返回 Cloudflare「Access Denied」403
——`www.jse.co.za/`、`group.jse.co.za/group-overview/history`、`clientportal.jse.co.za/...pdf` 逐一实测，
常规 Chrome UA、Safari UA + `Accept-Language` + Referer: https://www.google.com/ 均 403，响应体是
~170KB 的 Cloudflare 拦截页（含 "Access Denied" 与 `cloudflare` 字样）。`fsca.co.za` / `gov.za` /
`sars.gov.za` / `resbank.co.za` 同批也大量 404/坏页。这与建档时「抓取难度最低」的记录相反，说明
JSE 在 2026-08 中之后对官网加了 Cloudflare 防护，**且对数据中心/云 IP 段拦得比住宅 IP 严**——
用户在自己机器上 curl 可能仍正常，但任何在云环境跑的 `make fetch` / `fetch_sources.py` 对 `za-jse`
都会拿到拦截页（并可能覆盖已有好缓存，见文首「经验」一节）。下次需要重抓 `za-jse` 来源：优先在
住宅网络环境跑；若只能在云环境，考虑找 `web.archive.org` 快照或人工投喂 PDF（CLAUDE.md 三降级）。
