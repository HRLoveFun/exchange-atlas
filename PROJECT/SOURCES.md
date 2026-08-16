# 资料来源地图 SOURCES

本项目**最高价值的资产**——查交易所规则最费时的不是读，是找到并抓到权威原始出处。查明一次「这份文件在哪、要怎么抓、多久改版」就要记下来，否则下次重查一遍。

`tools/fetch.py` 按本文件登记的抓取方式取页；`tools/validate.py` 校验 `data/` 里引用的来源域名是否已在本文件登记。

## 条目格式（供 `tools/fetch.py` 与 `validate.py` 解析，首行务必遵守）

```markdown
### 交易所中文名 English Name `<exchange-id>`
- `域名` | 官方/监管/第三方 | 语言 | 抓取备注 | 内容备注
  - 具体页面标题: URL
```

标题行末尾反引号包裹的 `<exchange-id>` 必须与 `data/exchanges/<exchange-id>.yml` 的文件名一致——`make fetch EX=<exchange-id>` 靠这个 id 定位本节，抓取本节内所有 URL。

抓取备注写清楚：要不要自定义 UA、WebFetch 能不能用、是 HTML 还是 PDF、要不要多跳导航、改版周期、译本滞后情况。

## 经验：来源 URL 要精确到信息页，不要停在网站首页

v0.1 人工抽检（2026-08-13）时发现的一条通用问题：个别字段的 `sources[].url` 只写到网站首页（如
`https://www.hkex.com.hk/`），而不是真正承载该条事实的具体页面。首页几乎不构成对具体数值/条款的
独立证据——它只能证明"这是官方域名"，证明不了"这个数字/条款真是官方说的"。

**要求：** 每条 `sources` 尽量精确到能让人（或下次核实的 AI）不用搜索就直接看到该事实原文的页面
或 PDF；确实找不到更具体页面的（如仅用于确认机构名称/域名归属这类不需要逐条溯源的场景），要在
`title` 里写明这一点是有意为之（例如"仅用于确认域名归属"），不要让人误以为首页是原文出处。
`csrc.gov.cn` 一节已按这个约定标注；已知还有 2-3 处历史字段未达标，见
`PROJECT/OPEN-QUESTIONS.md`。

---

### 上海证券交易所 Shanghai Stock Exchange (SSE) `cn-sse`
- `sse.com.cn` | 官方 | zh | WebFetch 对规则总览页（`lawandrules/sselawsrules/overview/`）返回 403；换 `lawandrules/sselawsrules2025/overview/`（新版路径）+ curl 常规 UA 可过（HTTP 200）；PDF 用 `pdftotext -layout` 提取纯文本再 grep 定位条款，比逐页翻 PDF 快得多 | 规则总览页本身不含全文直链，需从站内导航多跳到具体规则文档；官网有《现行有效的业务规则清单》目录 PDF（见下）能确认某规则「现行有效」，但清单本身不含可点击的逐条直达链接，还没找到《交易规则》全文在 sse.com.cn 上的直接 URL——这是本节唯一的已知缺口，下次找到了请替换掉 mgzq.com 那条并把相关字段 confidence 升回 high
  - 规则总览: https://www.sse.com.cn/lawandrules/sselawsrules2025/overview/
  - 现行有效的业务规则清单（PDF，确认《交易规则》仍现行有效，但只是目录不含全文）: https://www.sse.com.cn/lawandrules/sselawsrules2025/overview/c/10778726/files/ddfc82e93a85496bb075175d9a8d811d.pdf
  - 上证综合指数编制方案 PDF: https://www.sse.com.cn/market/sseindex/indexlist/indexdetails/indexmethods/c1/000001_000001_CN.pdf
  - 指数熔断暂停通知（2016，上证发〔2016〕4号）: http://www.sse.com.cn/aboutus/mediacenter/hotandd/c/c_20160107_4033450.shtml
  - 沪市市场运行情况例行发布（周度市值/上市公司数统计，URL 每周变化，需重新搜索定位当期文件）: http://www.sse.com.cn/aboutus/mediacenter/conference/
- `mgzq.com` | 第三方（券商网站镜像的官方文件） | zh | curl 常规 UA 可过（499KB） | 《上海证券交易所交易规则（2023年修订）》镜像件，内含第六章"科创板交易特别规定"。⚠️ 非交易所自有域名，按 CLAUDE.md 二第3条，仅凭此来源的字段 `confidence` 上限为 `medium`，不得标 `high`——即使摘录到了逐字 quote 也一样，因为无法排除镜像件被静默改动的风险
  - 交易规则（2023年修订）: https://www.mgzq.com/userfiles/ecb5375bc6ab4174a6d9fb405222c2a7/files/cms/article/上海证券交易所交易规则（2023年修订）.pdf
- `csrc.gov.cn` | 监管 | zh/en | curl 常规 UA 可过；`common_list.shtml` 类列表页有缓存滞后现象，仅用于确认机构名称与域名，不作为具体规则条款出处 | 中国证券监督管理委员会（CSRC），SSE 的政府监管机构
- `chinaclear.cn` | 官方（清算机构） | zh | curl 常规 UA 可过 | 中国证券登记结算有限责任公司（ChinaClear），A股中央对手方与中央证券存管机构，设上海分公司
- `npc.gov.cn` | 官方（立法机构） | zh | 未测试反爬，本次仅用 WebSearch 摘要定位未额外 curl | 全国人民代表大会官网，《中华人民共和国证券法》等法律的权威公布渠道
- `people.com.cn` | 第三方（官方媒体） | zh | curl 需按 GBK 解码（非 UTF-8），常规 UA 可过 | 用于印花税税率调整等财政部/税务总局公告的转载确认；`confidence` 相应标 medium（非财政部原始公告页）
- `cls.cn` | 第三方（财经媒体） | zh | 未测试专门反爬，本次 WebSearch 摘要已够用未额外 curl | 用于退市规则修订的综述性报道；`confidence` 标 medium
- `english.sse.com.cn` | 官方（英文版） | en | curl 常规 UA 前 1-2 次请求 200，此后短时间内连续请求会被 WAF 拒绝（返回通用 `403 Forbidden webserver` 页，非针对具体路径）；实测同一路径间隔 10-15 秒重试即可恢复 200，抓多个页面务必逐个加延时，不要连续快速请求 | ADR-013（source_lang: zh）迁移时发现。⚠️ 每页均带免责声明"This courtesy translation is for reference only. The original text in Chinese shall prevail"——SSE 自己声明英文版不具约束力，佐证了 source_lang: zh 的选择。首页 `/` 与 `/start/trading/mechanism/`（交易机制，含开支盘集合竞价/撮合原则/订单类型正文）可直接拿到实质内容；`/start/sserules/stocks/trading/` 是规则文档索引页，指向的 PDF《Trading Rules of Shanghai Stock Exchange (2026 Revision)》是官方英文译本——**修订版本比本节引用的 mgzq.com 中文镜像件（2023年修订）更新**，两者内容是否有实质差异尚未逐条核对，见 OPEN-QUESTIONS
  - 首页: https://english.sse.com.cn/
  - 交易机制（含撮合原则/订单类型正文）: https://english.sse.com.cn/start/trading/mechanism/
  - Trading Rules of Shanghai Stock Exchange (2026 Revision) PDF: https://english.sse.com.cn/start/sserules/stocks/trading/c/10825757/files/d263e3a87f37436ca2f8e5bcfc4ff001.pdf
  - Implementing Rules of the Shanghai Stock Exchange for Margin Trading and Securities Lending Transactions PDF（融资融券实施细则英文版，本次仅确认标题与存在，未逐条抓取内容）: https://english.sse.com.cn/start/sserules/stocks/trading/c/10647720/files/95943f34d9d74a5f87b8581d793829bc.pdf

### 香港交易及结算所 Hong Kong Exchanges and Clearing (HKEX) `hk-hkex`
- `hkex.com.hk` | 官方 | zh-Hant / en（官方双语，逐页各有独立 URL，非同页切换） | curl + 常规 UA 全部 200，未见反爬 | Rulebook 站另有独立域名；不少栏目页（如上市规则总览、结算总览）正文夹在大量导航菜单文字里，抓到后要按关键词（而非直接取前 N 段）定位正文
  - Rulebook: https://en-rules.hkex.com.hk/（HTTP 200，170KB）
  - VCM（波动性中断机制）FAQ: https://www.hkex.com.hk/Global/Exchange/FAQ/Securities-Market/Trading/VCM?sc_lang=en（HTTP 200，405KB，含精确阈值 ±10%/±15%/±20%、5分钟冷静期）
  - 中文版页面把 `sc_lang=en` 换成 `sc_lang=zh-hk`，两版 URL 结构一致，抓取时两个语言版本都要各取一次。ADR-013 迁移时（2026-08-13）正式抓取中文版：https://www.hkex.com.hk/Global/Exchange/FAQ/Securities-Market/Trading/VCM?sc_lang=zh-hk（HTTP 200，402KB）。**官方全称是「市場波動調節機制」，「市調機制」是其简称**（此前只记录了简称，未区分全称/简称）；中文版正文比英文版更精确一层：明确写出 ±10%/±15%/±20% 分别对应恒生综合大型股/中型股/小型股指数成份股三个分组，英文版 FAQ 原文只笼统写 "depending on stock group" 未点明具体分组维度
  - 交易时段（含北向沪深港通对照表）: https://www.hkex.com.hk/Services/Trading-hours-and-Severe-Weather-Arrangements/Trading-Hours/Securities-Market?sc_lang=en
  - 卖空监管规则: https://www.hkex.com.hk/Services/Trading/Securities/Overview/Regulated-Short-Selling?sc_lang=en
  - 结算总览（CCASS）: https://www.hkex.com.hk/Services/Clearing/Securities/Overview?sc_lang=en
  - 上市规则总览: https://www.hkex.com.hk/Listing/Rules-and-Guidance/Listing-Rules?sc_lang=en
- `assets.kpmg.com` | 第三方（四大会计师事务所税务简报） | en | 未测试反爬，本次一次性 curl 成功 | 用于印花税税率调整确认；`confidence` 标 medium
- `hsi.com.hk`（恒生指数公司官网） | 官方（第三方指数编制商，非交易所本身） | ⚠️ 纯 JS 单页应用（SPA），curl 只能拿到空壳 HTML，需改用可执行 JS 的方式（如 headless browser）才能抓到真实内容——本次未采用，指数体系相关字段改用第三方综述作为来源

### 纽约证券交易所 New York Stock Exchange (NYSE) `us-nyse`
- `nyse.com` | 官方 | en | curl + 常规 UA 全部 200，未见反爬；注意站内不少旧 URL 会 301/302 跳转到新路径（如 `/products/etp-limit-up-limit-down` 跳到 `/trade/trading-information`），curl 要带 `-L` 跟随重定向 | ⚠️ NYSE 集团旗下有 NYSE、NYSE American、NYSE Arca、NYSE National、NYSE Texas 多个 SEC 注册的独立交易所实体（`group_id: nyse-group`），很多页面把几个实体的信息混在一起讲，摘引时要看清楚是哪个实体（本文件只收 NYSE 本身/Tape A 的信息）
  - Trading Information（交易时段、LULD、MWCB 熔断阈值）: https://www.nyse.com/trade/trading-information（HTTP 200，194KB）
  - Regulation（监管架构、SEC/FINRA 关系）: https://www.nyse.com/regulation（HTTP 200，127KB）
  - Regulation SHO（卖空监管入口，正文较薄，多为下载链接而非说明文字）: https://www.nyse.com/regulation/regulation-sho（HTTP 200，75KB）
  - Initial Listings（详细量化上市标准，含具体规则编号如 Rule 102.01C）: https://www.nyse.com/regulation/initial-listings（HTTP 200，199KB）
  - Listings Process（上市四步流程，含 DMM 指定环节）: https://www.nyse.com/listings-process（HTTP 200，84KB）
  - NYSE Price List 2026（PDF，逐笔交易费率/返佣表，maker-taker 模式，按流动性分层）: https://www.nyse.com/publicdocs/nyse/markets/nyse/NYSE_Price_List.pdf（HTTP 200，143KB，34页）
  - Fees 总览页: https://www.nyse.com/markets/fees（HTTP 200，194KB）
- `ice.com` | 官方（母公司 Intercontinental Exchange 的指数业务） | en | curl 常规 UA 200 | 用于确认 NYSE Composite 指数由 ICE Data Indices 编制（而非交易所自编）——与上交所"交易所自编"、港交所"恒生指数公司编制"形成第三种模式对比
  - Equity Indices: https://www.ice.com/fixed-income-data-services/index-solutions/equity-indices（HTTP 200，207KB）
- `cahill.com` | 第三方（律所客户简报） | en | curl 常规 UA 200 | 用于确认 T+1 结算周期新规生效日期（2024-05-28）；`confidence` 标 medium。⚠️ SEC.gov、finra.org、dtcc.com 的具体内容页（DTCC 首页 200 但 `/accelerated-settlement`、`/about` 等子页均 403）本次多次尝试均被拒（见下方"探测记录"），未能拿到监管机构或清算机构自己的原始表述，只能退而求其次用这份法律实务简报，且它本身也不是 SEC 规则原文
  - One-Day Settlement Cycle (T+1) To Begin May 28, 2024: https://www.cahill.com/publications/client-alerts/2024-04-29-one-day-settlement-cycle-t-1-to-begin-may-28-2024（HTTP 200，23KB）

### 日本交易所集团 / 东京证券交易所 Japan Exchange Group (JPX / TSE) `jp-jpx`
- `jpx.co.jp` | 官方 | ja / en（英文版内容滞后，部分细则页无对应英文版） | **WebFetch 对内国株页面返回 403（反爬）**；curl + 常规浏览器 UA（`Mozilla/5.0 ... Chrome/131`）可过，HTTP 200，全程未见限流（比 english.sse.com.cn 好抓得多，不需要加延时）| ⚠️ v0.2 按 ADR-013「无中选英」，本节以 `/english/` 路径下的英文版为主要来源，日文版（`/equities/...`）只在没有对应英文页时才用。英文版每页均带免责声明"This translation may be used for reference purposes only... the Japanese version shall prevail"。JPX 集团下辖东京证券交易所（TSE）、大阪交易所（OSE，衍生品）、东京商品交易所（TOCOM）、Japan Exchange Regulation（自律监管）四个法人实体（`group_id: jpx-group`），本文件只记录 TSE 现货股票市场
  - 制限値幅（值幅制限档位表，日文版）: https://www.jpx.co.jp/equities/trading/domestic/06.html（HTTP 200，35KB；curl 提取得到 37 行档位，如 `100円未満→上下30円`……`50,000,000円以上→10,000,000円`）
  - 用語集: https://www.jpx.co.jp/glossary/
  - 英文版首页: https://www.jpx.co.jp/english/（HTTP 200）
  - Rules & Regulations 索引页（列出全部官方英文规则 PDF 标题与直链）: https://www.jpx.co.jp/english/rules-participants/rules/regulations/index.html（HTTP 200；正文由 JS 渲染，纯 curl 只能拿到导航栏，但 PDF 直链本身在静态 HTML 里能 grep 出来）
  - Business Regulations（TSE业务规程英文版，交易时段/撮合原则/特别气配等核心交易机制）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/business_regs_20250507.pdf（HTTP 200，784KB）
  - Rules Concerning Price Limits on Bids and Offers（值幅制限官方英文版，与日文版37档完全对应）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/bids_and_offers_price_limits_20141201.pdf（HTTP 200，290KB）
  - Securities Listing Regulations（上市规则英文版，Prime/Standard/Growth三板定义与标准）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/01_listing_regs_20260721.pdf（HTTP 200，3MB，超长，用 pdftotext 后 grep 定位章节）
  - Clearing and Settlement Regulations PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/clearing-settlement_regs_20190716.pdf（HTTP 200，140KB）
  - Regulations Regarding Margin Transactions and Loans for Margin Transactions PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/regs_margin-loans_transactions_20250401.pdf（HTTP 200，175KB）
  - Clearing & Settlement Summary（JSCC/JASDEC 角色说明）: https://www.jpx.co.jp/english/equities/clearing-settlement/outline/index.html（HTTP 200）
  - T+2 结算周期改革说明（2019-07-16生效）: https://www.jpx.co.jp/english/equities/clearing-settlement/tplus2-settlement-cycle/index.html（HTTP 200）

### 欧洲期货交易所 Eurex `de-eurex`
- `eurex.com` | 官方 | de / en（官方英文版为主，德文版覆盖度低于英文版） | curl + 常规 UA 200，未见反爬（全程无限流，比 english.sse.com.cn 好抓得多） | 保证金具体数值走在线计算器（JS 交互），静态页只有方法论说明，产品级保证金参数需要用 Prisma Margin Calculator 交互获取或找按品种的公开参数文件，不能只靠抓静态 HTML。⚠️ 法律实体名是「Eurex Deutschland」（德国法批准设立，注册地法兰克福，受黑森州最高监管机关监督，不是联邦金融监管局BaFin——这点容易凭常识猜错，本次已实测确认），品牌名"Eurex"，隶属 Deutsche Börse Group（`group_id: deutsche-boerse-group`）
  - 交易时段: https://www.eurex.com/ex-en/trade/trading-hours（HTTP 200，134KB，含欧洲/美国/亚洲三段准全天候交易时段）
  - 保证金方法论（Prisma / VaR）: https://www.eurex.com/ec-en/services/margining/margining-process（HTTP 200，112KB，含"Prisma""value-at-risk"关键内容）
  - Prisma 在线保证金计算器（交互式，非静态可抓）: https://cpme.eurex.com/
  - About us / The Market Place（公司概况，1998年成立信息）: https://www.eurex.com/ex-en/find/about-us/the-market-place（HTTP 200）
  - Rules & Regs 索引页: https://www.eurex.com/ex-en/rules-regs/eurex-rules-regulations（HTTP 200；含9类规则文档的直链，正文导航为主，PDF直链可从静态HTML里grep出）
  - Exchange Rules（「Börsenordnung」，法律地位/监管机关/中央对手方/做市商等核心制度条款）PDF: https://www.eurex.com/resource/blob/334918/a72a2163fa0bb8fac8d6c710e244bfd8/data/2026_07_07_eurex_d_boersenordnung_en.pdf（HTTP 200，592KB）
  - Conditions for Trading（「Handelsbedingungen」，交易时段结构/订单类型/波动性中断等交易机制细则）PDF: https://www.eurex.com/resource/blob/311224/9f99369a56e0d49b6ecb0038cfbf6e79/data/2026_07_27_eurex_d_handelsbedingungen_en.pdf（HTTP 200，497KB）
  - Admission Regulations for Exchange Traders（「Zulassungsordnung」，交易员准入资格，⚠️不是公司上市规则——衍生品交易所没有"公司上市"概念，这是与现货股票交易所的结构性差异，见 OPEN-QUESTIONS）PDF: https://www.eurex.com/resource/blob/3354190/02b3ede980a95392ae1001a592930a81/data/2025-07-07_eurex_d_zulassungsordnung_en.pdf（HTTP 200，124KB）
  - Fee Regulations（「Gebührenordnung」）PDF: https://www.eurex.com/resource/blob/311122/413cca981529493937c4c381408291e7/data/2022_12_01_eurex_d_gebuehrenordnung_en.pdf（HTTP 200，95KB）

### 多伦多证券交易所 Toronto Stock Exchange (TSX) `ca-tsx`
- `tsx.com` | 官方 | en / fr（`/en/` 与 `/fr/` 路径均可直接访问，法语版正文与英文版对应，如 `/fr/trading/calendars-and-trading-hours/trading-hours` 返回「Heures de négociation」正文；本次抓取全部走英文版，法语版未逐条比对） | curl + 常规 UA 全部 200，未见反爬，未加延时 | ⚠️ TSX 隶属 TMX Group（`group_id: tmx-group`），集团下还有 TSX Venture Exchange（TSXV，创业板，独立交易所实体非本文件板块）、TSX Alpha Exchange（另一撮合场所/marketplace）、Montréal Exchange（衍生品）、CDS（清算/托管）等实体，很多页面把 TSX/TSXV/Alpha 三个 marketplace 的规则并排列在同一张表里，摘引时要看清楚列头对应哪个实体——本文件只收 TSX 本身
  - 交易时段（含 MOO/MOC/PME 收盘流程完整时间表）: https://www.tsx.com/en/trading/calendars-and-trading-hours/trading-hours
  - Toronto Stock Exchange Rule Book（PDF，全文，Effective January 13, 2026，含会员准入/交易时段/结算规则等 Part 1-8）: https://www.tsx.com/en/resource/1464
  - Order Types 页面（订单类型/匿名单/Odd Lot Dealer 说明正文）: https://www.tsx.com/en/trading/toronto-stock-exchange/order-types-and-features/order-types
  - Order Types and Functionality Guide（PDF，TMX GROUP，Version 1.75，2025-11-03，含 6.1.2 最小报价单位表、6.2.4 Single Stock Circuit Breakers、6.7 清算安排等章节）: https://www.tsx.com/ebooks/en/order-types-guide/files/assets/common/downloads/Order%20Types%20and%20Functionality%20Guide.pdf
  - Technical Guide to Listing（PDF，©2023 TSX Inc.，含上市财务门槛表/300名公众股东要求/做市商角色说明，Appendix C 为 Industrial/Technology/R&D 上市要求表）: https://www.tsx.com/ebooks/en/technical-guide-to-listing/files/assets/common/downloads/Technical%20Guide%20to%20Listing.pdf
  - TSX Trading Fee Schedule effective July 2, 2026（PDF，会员费/逐笔交易费率，maker-taker 结构）: https://www.tsx.com/en/resource/3521/tsx-trading-fee-schedule-effective-july-2-2026-en.pdf
  - TMX Group Consolidated Trading Statistics – December 2025（PDF，官方新闻稿，含 TSX 单独统计口径的 2025 全年成交额/成交量）: https://www.tsx.com/en/resource/3443
  - S&P/TSX Canadian Indices Methodology（PDF，S&P Dow Jones Indices 编制，June 2016 版本，tsx.com 自行托管；⚠️ 版本较旧，编制方/加权方式等稳定事实可用，具体数值门槛可能已更新，未找到 tsx.com 上更新版本的直链，spglobal.com 官网当前版 PDF 直链本次访问返回 403）: https://www.tsx.com/en/resource/1330
- `tmx.com` | 官方（集团层面） | en | curl + 常规 UA 200 | 用于确认 TMX Group 旗下公司清单（Toronto Stock Exchange / TSX Venture Exchange / TSX Trust / Montréal Exchange / TSX Alpha Exchange / AlphaX US / Shorcan / CDCC / CDS / TMX Datalinx 等），佐证 group_id 判断；正文本身导航链接为主，实质内容薄
  - TSX Regulatory Policies and Procedures（含 TMX Group Companies 清单导航）: https://www.tmx.com/en/tmx-group/regulatory-policies/toronto-stock-exchange-regulatory-policies-and-procedures
- `s21.q4cdn.com` | 官方（TMX Group 自有投资者关系文件托管 CDN，Q4 Inc. 提供基础设施，内容标注 "Source: TMX Group Limited"，视同集团官方新闻稿原文） | en | curl 常规 UA 200 | TMX Group Equity Financing Statistics 月度新闻稿，含 TSX 当月新上市家数/挂牌总数/总市值（区分 TSX 与 TSXV 两张表，不要混用）
  - TMX Group Equity Financing Statistics – February 2026（PDF，含 TSX Issuers Listed 2,132 家、Market Cap Listed Issues 逐笔数字）: https://s21.q4cdn.com/671813756/files/doc_news/TMX-Group-Equity-Financing-Statistics---February-2026-2026.pdf
- `osc.ca` | 监管 | en | curl + 常规 UA 全部 200，未见反爬 | 安大略省证券委员会（Ontario Securities Commission），TSX Inc. 与其母公司 TMX Group Limited 均由 OSC 认定为「recognized exchange」；CIRO（Canadian Investment Regulatory Organization，自律组织）的官网 `ciro.ca` 本次多次尝试（不同 UA/headers）均返回 403，改用 OSC 关于 CIRO 的说明页作为替代来源，见下方「探测记录」
  - Recognized Exchanges（TMX Group Limited and TSX Inc. 认定页，含关键原文「together with its parent company, TMX Group Limited, is recognized as an exchange in Ontario」）: https://www.osc.ca/en/industry/market-regulation/marketplaces/exchanges/recognized-exchanges
  - Canadian Investment Regulatory Organization (CIRO) 说明页（CIRO 定位、IIROC/MFDA 合并沿革）: https://www.osc.ca/en/industry/market-regulation/self-regulatory-organizations-sro/canadian-investment-regulatory-organization-ciro
  - Notice of Approval – Amendments to the Toronto Stock Exchange Company Manual (November 6, 2025)（PDF，OSC 托管的 TSX 规则修订核准公告，Appendix D 为最终 clean 版 Company Manual 正文，含 Part III 上市财务门槛与 Part VII 停牌/退市完整条文）: https://www.osc.ca/sites/default/files/2025-11/tsx_20251106_noa-exchange-company-manual.pdf
- `getsmarteraboutmoney.ca` | 监管（OSC Investor Office 运营的投资者教育网站，页脚署名「© Ontario Securities Commission」「Brought to you by the OSC Investor Office」） | en | curl 常规 UA 200 | 用于确认加拿大全市场熔断（market-wide circuit breaker）三级阈值（7%/13%/20%），该机制由 CIRO 监管、参照 S&P 500（美股休市时改用 S&P/TSX Composite），原始出处应是 ciro.ca（已 403，见下）
  - Market-wide circuit breakers: https://www.getsmarteraboutmoney.ca/learning-path/stocks/market-wide-circuit-breakers/
- `en.wikipedia.org` | 第三方 | en | curl 常规 UA 200 | 用于交易所历史沿革背景叙述（1852年 Association of Brokers、1861年正式创立、1999-2000年公司化、2008年与 Montréal Exchange 合并组成 TMX Group 等）；`confidence` 相应标 medium，未逐条核对一手史料
  - Toronto Stock Exchange: https://en.wikipedia.org/wiki/Toronto_Stock_Exchange
  - TMX Group（含 TMX Group Limited 股票代码 TSX:X 信息）: https://en.wikipedia.org/wiki/TMX_Group

---

## 探测记录（v0.0 可达性探针，2026-08-12）

上述五家标杆逐一测试：WebSearch 定位官方页均准确命中；WebFetch 直接抓取在 SSE 规则总览页与 JPX 值幅制限页均遇 403，换用 `curl` + 常规浏览器 UA 后全部转为 200。**结论：本项目的抓取一律走 `tools/fetch.py`（curl 封装），不要用 WebFetch 直连交易所官网。** 尚未遇到强反爬到 curl 也过不去、或只有付费规则库/扫描件 PDF 的情况——五家标杆全部可达，`CLAUDE.md` §三的降级方案暂未被触发。

## 探测记录（v0.2 NYSE 填充，2026-08-13）

**首次真正遇到 CLAUDE.md §三降级方案适用的情况**——不是交易所自己的域名，而是美国证券监管/清算基础设施相关的域名普遍拒绝 curl：

- `sec.gov`：3 次不同路径尝试（`/rules-regulations/...`、`/newsroom/press-releases/...`、`/files/risk-alert-....pdf`）全部返回 403，看起来是域名级别的边缘防护（Akamai 一类），不是针对具体路径。
- `finra.org`：1 次尝试（T+1 结算提醒页）403。
- `dtcc.com`：首页 `/` 能拿到 200，但 `/accelerated-settlement`、`/about` 等具体内容子页均 403——说明防护是按路径深度/内容页触发，不是整个域名封死，纯首页没有实质内容，意义不大。

这三个域名都是本项目大概率还会用到的（SEC 是美股监管机构官网、FINRA 是自律组织、DTCC/NSCC 是清算机构），下次有空可以试试其他 UA、加 `Referer`、或人工提供关键页面的 PDF/文本内容作为降级方案输入，而不是每次都重新撞一遍墙。本次改用第三方法律实务简报（`cahill.com`）绕过，`confidence` 相应降级为 medium。

**顺带发现并修复了 `tools/fetch.py` 的两个 bug**（本次是这个工具第一次被真正跑通——cn-sse/hk-hkex 当初实际是手工 curl 抓的，`make fetch` 从未被端到端验证过）：
1. `URL_RE` 正则没把 SOURCES.md 里紧跟 URL 的全角括号批注（如「（HTTP 200，194KB）」）当成终止符，导致抓到的"URL"带着批注文字的尾巴，请求必然失败。
2. 更根本的问题：`fetch_one()` 里拼 curl 命令参数列表时**忘了把 `url` 本身传进去**，curl 命令没有目标地址。这个 bug 不受第 1 条影响，从这个脚本写出来那天起，`make fetch` 抓到的从来都是空文件，只是因为一直没人真的靠它抓过东西才没被发现。两处都已修复并对 cn-sse/hk-hkex/us-nyse 三家重新跑通验证。

`nyse.com` 与 `ice.com`（NYSE 母公司 ICE 的指数业务站）均全程无反爬，curl 常规 UA 直接 200。
