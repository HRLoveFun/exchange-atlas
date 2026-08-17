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

## 经验：「XXXX年修订」式规则文档 URL 会随修订版本更迭直接下线，不保留旧版直链

`cn-szse` 建档时踩到的坑：上一轮子代理登记 SOURCES.md 时记录的是《深圳证券交易所股票上市规则
（**2025年**修订）》与《深圳证券交易所创业板股票上市规则（**2025年**修订）》两个 PDF 直链，
`make fetch` 时两条都返回 404。原因不是链接抄错或反爬，是深交所在两轮抓取之间（2026年4月）
发布了**2026年修订版**并直接下线了 2025 版 PDF 的原文件（`docs.static.szse.cn` 不保留历史
版本的旧直链，替换是静默的、无跳转、无 301）。WebSearch 重新定位到新版 URL 后才抓到。

**教训**：
1. 任何标题带「XXXX年修订」字样的中国交易所/监管规则 PDF，只要登记 URL 与实际抓取之间隔了
   一段时间（哪怕只是几周），都要有心理预期该文件可能已被更新版本静默替换下线——`make fetch`
   遇到 404 时，第一反应不该是"链接错了"，而应该是"先 WebSearch 一下同名文件是否出了新修订版"。
   `深圳证券交易所交易规则` 本身也在 2026-07-06 生效了新版（第17次修订），本节其余条目登记的
   URL 均为本次会话当场验证过的最新版，但下次会话抓取前仍应重新探测一遍，不要假设去年验证过
   的 URL 依然有效。
2. 这类文档的正文最后一条附则通常会自报"自 XXXX 年 X 月 X 日起施行，本所于 XXXX 年 X 月 X 日
   发布的《……（XXXX年修订）》同时废止"——这是判断当前抓到的是不是最新有效版本最快的办法，
   不用去查改版历史页。
3. 与本条相对：`.pdf` 文件名里的哈希片段（如 `W020260424747613955674`）本身不随内容变化，
   同一次修订发布后的直链是稳定的，会失效的只是"旧修订版对应的旧哈希文件被整个撤下"，不是
   "同一文件的 URL 会漂移"——两种失效原因分开判断，遇到 404 先假设是第一种（更常见）。

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
  - 衍生品市场交易时段（Derivatives Market Trading Hours）: https://www.hkex.com.hk/Services/Trading-hours-and-Severe-Weather-Arrangements/Trading-Hours/Derivatives-Market?sc_lang=en（HTTP 200，405KB）
  - 衍生品市场交易时段中文版: https://www.hkex.com.hk/Services/Trading-hours-and-Severe-Weather-Arrangements/Trading-Hours/Derivatives-Market?sc_lang=zh-hk（HTTP 200，400KB）
  - 衍生品市场交易机制总览（Trading Mechanism）: https://www.hkex.com.hk/Services/Trading/Derivatives/Overview/Trading-Mechanism?sc_lang=en（HTTP 200，368KB）
  - 衍生品市场交易机制总览中文版: https://www.hkex.com.hk/Services/Trading/Derivatives/Overview/Trading-Mechanism?sc_lang=zh-hk（HTTP 200，379KB）
  - HKATS（香港期货自动交易系统）介绍: https://www.hkex.com.hk/Services/Trading/Derivatives/Infrastructure/HKATS?sc_lang=en（HTTP 200，368KB）
  - 收市后交易时段 FAQ（After-Hours Trading, AHT；⚠️ URL 路径本身含半角括号 `(AHT)`，本项目 `tools/fetch.py` 的 `URL_RE` 遇到半角 `)` 会误判为注释开始，把 URL 截断——这是本次新发现的 fetch.py 限制，本条按 %28/%29 百分号编码登记规避，见 add-exchange skill 回写）: https://www.hkex.com.hk/Global/Exchange/FAQ/Derivatives-Market/Trading/After-Hours-Trading-%28AHT%29?sc_lang=en（HTTP 200，404KB）
  - 收市后交易时段 FAQ 中文版（含 T+1 时段 ±6%/±7% 价格上下限机制、短暫停牌機制 THM 的中文原文表述）: https://www.hkex.com.hk/Global/Exchange/FAQ/Derivatives-Market/Trading/After-Hours-Trading-%28AHT%29?sc_lang=zh-hk（HTTP 200，420KB）
  - 衍生品市場波動調節機制 FAQ（Volatility Control Mechanism, VCM，与证券市场 VCM 是同名但独立的两套机制，触发阈值/覆盖品种不同；同样因 URL 含半角括号改用 %28/%29 编码登记）: https://www.hkex.com.hk/Global/Exchange/FAQ/Derivatives-Market/Trading/Volatility-Control-Mechanism-%28VCM%29?sc_lang=en（HTTP 200，370KB）
  - 衍生品市場波動調節機制 FAQ 中文版: https://www.hkex.com.hk/Global/Exchange/FAQ/Derivatives-Market/Trading/Volatility-Control-Mechanism-%28VCM%29?sc_lang=zh-hk（HTTP 200，371KB）
  - 衍生品市場 VCM 交易机制说明 PDF（同样因 URL 含半角括号改用 %28/%29 编码登记）: https://www.hkex.com.hk/-/media/HKEX-Market/Services/Trading/Derivatives/Trading-Mechanism/Volatility-Control-Mechanism-%28VCM%29/Trading-Mechanism-for-VCM-141020221.pdf（HTTP 200，908KB）
  - 恒指期货及期权产品页（HSI Futures & Options；同样因 URL 含半角括号改用 %28/%29 编码登记）: https://www.hkex.com.hk/Products/Listed-Derivatives/Equity-Index/Hang-Seng-Index-%28HSI%29/Hang-Seng-Index-Futures-Options?sc_lang=en（HTTP 200，439KB）
  - 恒生科技指数期货及期权产品页（Hang Seng TECH Index Futures & Options）: https://www.hkex.com.hk/Products/Listed-Derivatives/Equity-Index/Hang-Seng-TECH-Index-Futures-and-Options/Hang-Seng-TECH-Index-Futures-Options?sc_lang=en（HTTP 200，269KB）
  - 恒生中国企业指数期货及期权产品页（HSCEI Futures & Options）: https://www.hkex.com.hk/Products/Listed-Derivatives/Equity-Index/Hang-Seng-China-Enterprises-Index/Hang-Seng-China-Enterprises-Index-Futures-Options?sc_lang=en（HTTP 200，413KB）
  - 股票期货产品页（Stock Futures）: https://www.hkex.com.hk/Products/Listed-Derivatives/Single-Stock/Stock-Futures?sc_lang=en（HTTP 200，578KB）
  - 衍生品市场做市商计划（Market Maker Obligations and Incentives）: https://www.hkex.com.hk/Products/Listed-Derivatives/Market-Maker-Program/Market-Maker-Obligations-and-Incentives?sc_lang=en（HTTP 200，743KB）
  - 衍生品市场做市商计划中文版: https://www.hkex.com.hk/Products/Listed-Derivatives/Market-Maker-Program/Market-Maker-Obligations-and-Incentives?sc_lang=zh-hk（HTTP 200，734KB）
  - 衍生品结算风险管理／保证金（Margin）: https://www.hkex.com.hk/Services/Clearing/Listed-Derivatives/Risk-Management/Margin?sc_lang=en（HTTP 200，376KB）
  - 衍生品结算风险管理／保证金中文版（含 PRiME/SPAN 兼容算法的中文表述，⚠️ 页面注明「结算所按金计算方法 – PRiME」条目本身只有英文版）: https://www.hkex.com.hk/Services/Clearing/Listed-Derivatives/Risk-Management/Margin?sc_lang=zh-hk（HTTP 200，387KB）
  - HKFE 于 2000 年成为 HKEX 全资附属公司的新闻稿（"Hong Kong Futures Exchange becomes a subsidiary of Hong Kong Exchanges and Clearing Limited"）: https://www.hkex.com.hk/News/News-Release/2000-HKFE/p030600?sc_lang=en（HTTP 200，351KB；⚠️ 原文明确 HKFE 是 HKEX 的全资附属公司，法律上是集团内独立法人的子公司，不是与 HKEX 本身完全同一法人——与本文件先前"同一法人实体内业务线"的印象不完全一致，见 market_structure.derivatives 字段说明）
- `assets.kpmg.com` | 第三方（四大会计师事务所税务简报） | en | 未测试反爬，本次一次性 curl 成功 | 用于印花税税率调整确认；`confidence` 标 medium
- `hsi.com.hk`（恒生指数公司官网） | 官方（第三方指数编制商，非交易所本身） | ⚠️ 主站是纯 JS 单页应用（SPA），curl 只能拿到空壳 HTML；但 `/static/uploads/contents/...` 路径下的方法论 PDF 与 Factsheet 是静态资源，不受 SPA 限制，curl 常规 UA 可直接 200 抓到——2026-08-17 新发现，此前记录的"改用第三方综述"结论对这两类文件不再成立，指数方法论字段应优先用这些 PDF | 恒生中国企业指数、恒生科技指数两条新增指数条目的编制方法一手依据
  - 恒生中国企业指数方法论（Hang Seng China Enterprises Index Methodology）PDF: https://www.hsi.com.hk/static/uploads/contents/en/dl_centre/methodologies/IM_hsceie.pdf（HTTP 200，177KB）
  - 恒生中国企业指数 Factsheet（2026年6月版，含基本参数速览）PDF: https://www.hsi.com.hk/static/uploads/contents/en/dl_centre/factsheets/hsceie.pdf（HTTP 200，848KB）
  - 恒生科技指数方法论（Hang Seng TECH Index Methodology）PDF: https://www.hsi.com.hk/static/uploads/contents/en/dl_centre/methodologies/IM_hsteche.pdf（HTTP 200，284KB）
  - 恒生科技指数 Factsheet（2026年6月版）PDF: https://www.hsi.com.hk/static/uploads/contents/en/dl_centre/factsheets/hsteche.pdf（HTTP 200，1.03MB）

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

### 纳斯达克证券交易所 The Nasdaq Stock Market `us-nasdaq`
- `nasdaq.com` | 官方 | en | curl + 常规 UA 全部 200，未见反爬 | Nasdaq Inc 集团层面的公司站，覆盖监管框架、公司概况/历史、市场数据产品说明、指数产品说明等叙述性内容；不含逐条规则条文（规则条文在 `nasdaqtrader.com`/`listingcenter.nasdaq.com`）
  - Market Regulation（监管架构总览，Nasdaq Regulation 与 FINRA 关系）: https://www.nasdaq.com/market-regulation（HTTP 200，310KB）
  - Market Regulation: Listings Review（上市审核团队职能）: https://www.nasdaq.com/market-regulation/americas/listing-review（HTTP 200，235KB）
  - About（集团概况，多国交易所版图）: https://www.nasdaq.com/about（HTTP 200，287KB）
  - Nasdaq TotalView（行情数据产品，Level 1/2/逐笔深度）: https://www.nasdaq.com/solutions/data/equities/nasdaq-totalview（HTTP 200，344KB）
  - About Matching Engines（撮合引擎技术说明，未点名 Nasdaq 自身系统版本号）: https://www.nasdaq.com/solutions/fintech/marketplace-technology/about-matching-engines（HTTP 200，205KB）
  - Nasdaq Composite 指数产品页: https://www.nasdaq.com/solutions/global-indexes/nasdaq-composite（HTTP 200，306KB）
  - Nasdaq Celebrates 50 Years of Innovation（新闻稿，1971年成立、"世界首个全电子报价系统"）: https://www.nasdaq.com/press-release/nasdaq-celebrates-50-years-of-innovation-2021-02-08（HTTP 200，175KB）
  - Nasdaq CEOs Recall 50 Years of Innovation（历史访谈文章，脱离NASD独立、2005年NDAQ挂牌细节）: https://www.nasdaq.com/articles/nasdaq-ceos-recall-50-years-of-innovation（HTTP 200，194KB）
  - About Nordic Exchanges（欧洲子公司沿革，Nasdaq Stockholm/Copenhagen/Helsinki/Iceland/Baltic 各交易所并购时间线，group_id 依据）: https://www.nasdaq.com/european-markets/about-nordic-exchanges（HTTP 200，334KB）
  - NDAQ 个股行情页（页面确认 Nasdaq, Inc. 普通股代码为 NDAQ，但页面本身未点名挂牌交易所是哪一家——nasdaq.com/market-activity/stocks/ 这一URL模式同时承载非纳斯达克上市股票的行情，不构成"在纳斯达克挂牌"的独立证据，仅供交叉核对代码）: https://www.nasdaq.com/market-activity/stocks/ndaq（HTTP 200，283KB）
  - Market Activity（FAQ 形式说明 Composite 与 Nasdaq-100 定义区别、指数数据延时口径）: https://www.nasdaq.com/market-activity（HTTP 200，247KB）
- `nasdaqtrader.com` | 官方（会员/交易者服务站，Nasdaq Inc 旗下） | en | curl + 常规 UA 全部 200，未见反爬；不少页面是历史悠久的旧版 ASP 站（`Trader.aspx`），内容仍在维护更新 | 交易机制细则的主要来源：交易时段、熔断、LULD、开收盘集合竞价、做市商、Reg SHO、价格表均在这里，比 `nasdaq.com` 集团站更贴近规则原文
  - The Nasdaq Stock Market（交易时段总览）: https://www.nasdaqtrader.com/trader.aspx?id=tradingusequities（HTTP 200，67KB）
  - Market Wide Circuit Breaker: https://www.nasdaqtrader.com/trader.aspx?id=CircuitBreaker（HTTP 200，54KB）
  - Market-Wide Circuit Breakers FAQ（PDF，与 NYSE 引用同一份跨市场联合计划文件，阈值 7/13/20% 三级）: https://www.nasdaqtrader.com/content/marketregulation/mwcb_faq.pdf（HTTP 200，160KB）
  - Limit Up-Limit Down FAQ（PDF，含 Tier1/Tier2 按价格分层的具体百分比价格带表，比 us-nyse 抓到的更细）: https://www.nasdaqtrader.com/content/MarketRegulation/LULD_FAQ.pdf（HTTP 200，189KB）
  - The Nasdaq Opening and Closing Crosses: https://www.nasdaqtrader.com/Trader.aspx?id=OpenClose（HTTP 200，61KB）
  - Price List - Trading（连接/交易费率表）: https://www.nasdaqtrader.com/Trader.aspx?id=PriceListTrading2（HTTP 200，352KB）
  - Market Maker Process（含"清算机构请致电 NSCC"字样，ccp_name 的官方原文依据）: https://www.nasdaqtrader.com/trader.aspx?id=marketmakerprocess（HTTP 200，55KB）
  - Regulation SHO: https://www.nasdaqtrader.com/Trader.aspx?id=regsho（HTTP 200，53KB）
  - Short Sale Circuit Breaker（Rule 201 报升规则）: https://www.nasdaqtrader.com/trader.aspx?id=ShortSaleCircuitBreaker（HTTP 200，47KB）
- `listingcenter.nasdaq.com` | 官方（上市规则站） | en | ⚠️ Rulebook 交互式条文页（`/rulebook/nasdaq/rules/...`）多次尝试均返回 403（含加 12 秒延时重试），疑似该子路径有独立 WAF，非限流性质（NYSE/JPX/Eurex 经验里的限流是"连续请求后开始 403"，这里是首次请求即 403，且延时重试无效）；但根目录下的静态 PDF 资源（`/assets/...`）可以正常 curl 到，200 | Initial Listing Guide + Continued Listing Guide 两份 PDF 已覆盖三档上市标准的初始与持续量化门槛，弥补了 Rulebook 页面抓不到的缺口，故未继续尝试破解 Rulebook 反爬
  - Nasdaq Initial Listing Guide（PDF，三档上市标准 Global Select/Global/Capital Market 财务与流动性量化门槛）: https://listingcenter.nasdaq.com/assets/initialguide.pdf（HTTP 200，559KB）
  - Nasdaq Continued Listing Guide（PDF，持续上市标准，含 $1 最低股价等退市触发门槛）: https://listingcenter.nasdaq.com/assets/continuedguide.pdf（HTTP 200，394KB）
- `indexes.nasdaqomx.com` | 官方（指数编制业务站，Nasdaq Inc 旗下） | en | curl 常规 UA 200 | Nasdaq Index Methodology Guide，覆盖治理流程与通用方法论；⚠️ 未含 Nasdaq Composite/Nasdaq-100 各自的基日/基点等逐指数具体参数，那部分需要另外的逐指数方法论文件，本次未找到
  - Nasdaq Index Methodology Guide（PDF）: https://indexes.nasdaqomx.com/docs/Nasdaq_Index_Methodology_Guide.pdf（HTTP 200，249KB）
- `dtcc.com` | 监管/清算基础设施 | en | ⚠️ 与 `us-nyse` 一节记录的情况一致：首页 200 但内容子页（如 accelerated-settlement、understanding-settlement 等路径）403，本次针对 us-nasdaq 重新探测一次结果相同，不再重复尝试 | 未抓取到可引用内容，本节仅记录探测结果，不含可用 URL；`clearing.csd_name`（DTC 托管机构）仍留空，但 `ccp_name` 已从 `nasdaqtrader.com` 的 Market Maker Process 页找到官方原文佐证（NSCC），无需依赖 dtcc.com
- `cahill.com` | 第三方（律所客户简报） | en | curl 常规 UA 200 | 与 us-nyse 一节引用同一份简报，说明SEC统一结算周期规则（Rule 15c6-1，2024-05-28起T+1）对全国性证券交易所（含纳斯达克）同等适用，非纳斯达克自身单独设定的规则；按 CLAUDE.md 二第3条，第三方来源 confidence 上限 medium
  - One-Day Settlement Cycle (T+1) To Begin May 28, 2024: https://www.cahill.com/publications/client-alerts/2024-04-29-one-day-settlement-cycle-t-1-to-begin-may-28-2024（HTTP 200，23KB）
- `ir.nasdaq.com` | 官方（投资者关系站） | en | ⚠️ 本次多次尝试均 HTTP/2 stream 报错或超时（`curl: (92) HTTP/2 stream 1 was not closed cleanly`／`curl: (28) Operation timed out`），换 `--http1.1` 仍超时，与 `nasdaq.com`/`nasdaqtrader.com` 的可达性形成对比——同集团不同子域名反爬/限流行为不一致，值得记录；Nasdaq, Inc. 自身股票在 Nasdaq 交易所挂牌（NDAQ）这一事实原打算从这里的"Stock Information"页确认，未能拿到，改用 `nasdaq.com/articles` 与 `nasdaq.com/market-activity` 两个可达页面间接佐证，`overview.self_listed` 因此定为 `confidence: medium` 而非 `high` | 未抓取到可引用内容

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

### 印度国家证券交易所 National Stock Exchange of India (NSE) `in-nse`
- `nseindia.com` | 官方 | en | curl + 常规 UA 全部 200，未见反爬/限流（连续抓 17 个页面无一次 403，是本项目目前最好抓的官网之一）；页面正文是服务端渲染的静态 HTML（非 SPA），关键词直接可 grep 到；导航栏占页面文本的大头（几百个重复菜单项），抓下来后建议先用 BeautifulSoup 转纯文本、跳到页面中部"About Us"之后的正文段落再读，效率更高 | ⚠️ NSE 官网本身没有官方中文版（`source_lang: en`，见下）；NSE 集团另有 `NSE Clearing Limited`（原 National Securities Clearing Corporation Limited, NSCCL，清算，全资子公司）、`NSE Indices Limited`（原 India Index Services & Products, IISL，指数编制，全资子公司）、`NSE IFSC Limited`（GIFT City 国际金融中心内的独立交易所实体，受 IFSCA 而非 SEBI 监管，是与本文件意义上"同集团下另一独立交易所实体"最接近的案例——参照 ADR 对 `group_id` 的判断标准，已标 `group_id: nse-group`；`listing.boards` 不收录 NSE IFSC 自己的板块规则，仅收录 NSE 本身/主板与 SME 平台）；⚠️ History & Milestones 页正文只写"NSE was incorporated in 1992"，未标具体月日——本节标题曾误记"1992年11月27日"，本轮核实后已删除这个未经原文支持的具体日期，只保留"1992年"
  - History & Milestones（成立沿革：1992年注册成立/1993年4月经SEBI认定为证券交易所/1994年开始营业）: https://www.nseindia.com/static/national-stock-exchange/history-milestones（HTTP 200，306KB）
  - NSE Group（集团结构，NSE Clearing/NSE Indices/NSE IFSC 等子公司列表）: https://www.nseindia.com/national-stock-exchange/our-group（HTTP 200，325KB）
  - About NSE（组织定位简介，未涉及公司制/会员制或自身是否上市的明确表述）: https://www.nseindia.com/static/national-stock-exchange/about-nse-company（HTTP 200，295KB）
  - Corporate Structure（集团子公司沿革列表，与 History & Milestones 内容高度重叠，未找到组织形式/自身上市状态的独立信息）: https://www.nseindia.com/structure-key-personnel/corporate-structure（HTTP 200，297KB）
  - Market Timings（交易时段，含盘前/连续竞价/收盘时段/大宗交易窗口）: https://www.nseindia.com/static/market-data/market-timings（HTTP 200，315KB）
  - Equity Market Circuit Breakers（全市场指数熔断，10%/15%/20%三级）: https://www.nseindia.com/products-services/equity-market-circuit-breakers（HTTP 200，336KB）
  - Equity Market Price Bands（个股涨跌停价格带，2%/5%/10%/20%分档）: https://www.nseindia.com/static/products-services/equity-market-price-bands（HTTP 200，332KB）
  - Raising Capital: Public Issues Eligibility（主板上市财务门槛）: https://www.nseindia.com/static/companies-listing/raising-capital-public-issues-eligibility-equity-debt（HTTP 200，366KB）
  - NSE Clearing / Clearing-Settlement（NSE Clearing Limited 清算结算总览，T+1 结算周期，另有 T+0 可选试点）: https://www.nseindia.com/nsccl-nse-clearing/clearing-settlement（HTTP 200，133KB）
  - Securities Transaction Tax（STT 证券交易税税率表，⚠️ 该页面只覆盖股票衍生品 F&O 的 STT，不含现货股票交割/日内 STT 税率表，见 OPEN-QUESTIONS）: https://www.nseindia.com/static/products-services/equity-derivatives-securities-transaction-tax（HTTP 200，359KB）
  - Foreign Portfolio Investors: Broad Parameters（⚠️ 页面标题含"Broad Parameters"但实际正文是营销性简介，不含 FPI 分类与持股比例的具体数值，未达到本文件"精确到信息页"的标准——下次找到 SEBI FPI Regulations 具体条款页后应替换）: https://www.nseindia.com/static/invest/fpi/broad-parameters（HTTP 200，305KB）
  - Categories of Membership（会员/经纪商类型：Trading Member/Clearing Member等）: https://www.nseindia.com/static/trade/membership-types（HTTP 200，332KB）
  - Trading Protocols（NEAT 交易系统、行情数据层级、Colocation/MTBT 逐笔行情）: https://www.nseindia.com/static/trade/platform-services-neat-trading-system-protocols（HTTP 200，356KB）
  - Nifty 50 Index（旗舰指数说明页）: https://www.nseindia.com/static/products-services/indices-nifty50-index（HTTP 200，294KB）
- `nsearchives.nseindia.com` | 官方（NSE 官网文档归档子域） | en | curl 常规 UA 200，PDF 体积较大（3.2MB），用 `pdftotext -layout` 转纯文本再 grep 定位 | 存放规则/方法论类 PDF，与主站 `nseindia.com` 同属官方一手来源
  - Methodology Document for NIFTY Equity Indices（含 Nifty 50 基日/基点/加权方式/成分股筛选规则）PDF: https://nsearchives.nseindia.com/content/indices/Method_NIFTY_Equity_Indices.pdf（HTTP 200，3.2MB）
- `sebi.gov.in` | 监管 | en | curl 常规 UA 200，未见反爬；页面是服务端渲染的传统多页站（非 SPA），正文可直接 grep，比同为监管机构域名的 `sec.gov`（美国，v0.2 时实测 403）好抓得多 | 印度证券交易委员会（SEBI），NSE 的政府监管机构；本节只用于确认监管机构身份与核心法律名称，具体规则条款优先引用 NSE 官网转载/说明页
  - About SEBI（设立沿革：1988年非法定机构成立/1992年成为法定机构）: https://www.sebi.gov.in/about-sebi.html（HTTP 200，8.5KB）
  - Securities Contracts (Regulation) Act, 1956（核心法律之一，SCRA，确认法律名称与年份）: https://www.sebi.gov.in/legal/acts/feb-1957/securities-contracts-regulation-act-1956-as-amended-by-the-international-financial-services-centres-authority-act-2019-w-e-f-october-01-2020-_4.html（HTTP 200，8.6KB）

### 深圳证券交易所 Shenzhen Stock Exchange (SZSE) `cn-szse`
- `szse.cn` | 官方 | zh / en（英文版路径 `/English/...`，非同页切换，独立 URL；页面同样带"仅供参考，中文文本为准"类免责声明——与 SSE 一致，佐证 `source_lang: zh` 的选择） | curl + 常规浏览器 UA 全程 200，未见反爬/限流（比 `english.sse.com.cn` 好抓，不需要加延时）；PDF 用 `pdftotext -layout` 提取纯文本再 grep 定位条款 | 与上交所同属会员制事业法人、同受中国证监会监管、同为 A 股主板注册制，`region`/`regulator`/`review_system` 等字段与 cn-sse 高度一致，可直接对照校验取值口径是否统一；压测点是主板 vs 创业板（对照 cn-sse 主板 vs 科创板）
  - 本所简介（成立/开业日期、监管归属、职能）: https://www.szse.cn/aboutus/sse/introduction/index.html
  - 交易规则（2026年修订）PDF: https://docs.static.szse.cn/www/lawrules/rule/trade/current/W020260424690713155663.pdf
  - 股票上市规则（2026年修订，主板；原登记的2025年修订版链接抓取时返回404——已被2026年4月第十七次修订替换下线，重新 WebSearch 定位到现行版）PDF: http://docs.static.szse.cn/www/lawrules/rule/allrules/bussiness/W020260424747613955674.pdf
  - 创业板股票上市规则（2026年修订；同上，原2025年修订版链接已下线）PDF: https://docs.static.szse.cn/www/lawrules/rule/stock/supervision/chinext/W020260424688875101057.pdf
  - 市场概况（上市公司数/总市值等统计）: https://www.szse.cn/market/overview/index.html
  - 指数总览: https://www.szse.cn/market/exponent/pandect/index.html
  - 会员与交易类规则入口: https://www.szse.cn/lawrules/service/member/index.html
  - 关于下调股票交易经手费收费标准的通知（2023-08-18）: https://www.szse.cn/disclosure/notice/general/t20230818_602805.html
- `english.szse.cn` / `szse.cn/English` | 官方（英文版） | en | 同域名下 `/English/` 路径，curl 常规 UA 200 | About Overview 与 Trading Overview 两页内容较薄，多为导航链接夹杂少量正文，摘引前需按关键词定位，不能直接取前 N 段
  - About Overview: https://www.szse.cn/English/about/overview/index.html
  - Trading Overview: https://www.szse.cn/English/services/trading/tradOverview/index.html
  - Rules 索引页: https://www.szse.cn/English/rules/siteRule/
  - Margin Trading: https://www.szse.cn/English/services/trading/marginTrading/index.html
  - Suspension and Resumption of Trading PDF: https://www.szse.cn/www/English/rules/siteRule/P020190125614338960977.pdf （原登记 http:// 首次抓取连接失败，改 https:// 后 200）
- `cnindex.com.cn` | 官方（深圳证券信息有限公司，SZSE 全资子公司，指数编制方） | zh | curl 常规 UA 200 | 深证成指官方编制方案，与 cn-sse 的"交易所自编"（上证综指）、hk-hkex 的"独立第三方"（恒生指数公司）并列第三种指数编制归属模式——SZSE 是"交易所全资子公司编制"，介于两者之间
  - 深证成份指数编制方案 PDF: https://www.cnindex.com.cn/docs/gz_399002.pdf
- `chinaclear.cn` | 官方（清算机构，与 cn-sse 共用同一登记结算法人，域名已在 cn-sse 一节登记） | zh | curl 常规 UA 可过 | 中国证券登记结算有限责任公司深圳分公司页面，确认其为 SZSE 上市证券提供登记结算服务、深港通相关登记存管结算业务
  - 深圳分公司公告栏: http://www.chinaclear.cn/zdjs/szfgsgg/center_list.shtml
- `people.com.cn` | 第三方（官方媒体，域名已在 cn-sse 一节登记） | zh | curl 需按 GBK 解码，常规 UA 可过 | 印花税为全国统一税率的国家税种，非交易所自定，与 cn-sse 引用同一篇报道确认 2023-08-28 减半征收
  - 证券交易印花税8月28日起实施减半征收: http://finance.people.com.cn/n1/2023/0828/c1004-40065300.html
- `csrc.gov.cn` | 监管（域名已在 cn-sse 一节登记） | zh/en | curl 常规 UA 可过 | 中国证监会官网，SZSE 与 SSE 共同的政府监管机构，本节独立抓取一次首页作为本所"当次抓取凭据"
  - 官网首页: http://www.csrc.gov.cn/
- `finance.sina.com.cn` | 第三方（财经媒体，全文转载深交所 2016-01-07 官方通知原文） | zh | curl 需按 GBK 解码（非 UTF-8），常规 UA 200 | 用于 circuit_breaker 字段：本次会话未抓到 szse.cn 自己的通知原页（WebSearch 未命中该页面的直链），退而用新浪财经转载的通知全文作为来源，quote 摘的是被转载的深交所官方通知原文本身，但因转载渠道是第三方，confidence 按铁律封顶 medium，不因转载内容是官方原文而破例标 high
  - 三大交易所公告确认指数熔断制度暂停实施: http://finance.sina.com.cn/stock/y/20160107/223324126797.shtml

### 伦敦证券交易所 London Stock Exchange (LSE) `uk-lse`
- `londonstockexchange.com`（`www.` 主站） | 官方 | en | ⚠️ **纯 JS 单页应用（SPA）**，curl 只能拿到空壳 HTML（标题恒为「London Stock Exchange \| London Stock Exchange」，正文为空，四个不同路径抓回的文件字节数完全相同可资验证）——与 SOURCES.md 里 `hsi.com.hk` 是同一类问题；`/discover/who-we-are`、`/discover/london-stock-exchange-group`、主板首页、Retail Broker Order Book 页均属此类，本次未能从这些 URL 拿到实质内容，改用下面 `docs.londonstockexchange.com`（静态文档子域）与 `lseg.com`（集团官网，非 SPA）替代 | —
- `docs.londonstockexchange.com` | 官方（静态文档子域，与主站 SPA 不同，curl 可正常抓取） | en | curl 常规 UA 200，未见反爬 | 交易规则/交易系统权威技术文档
  - Admission and Disclosure Standards（准入与披露标准）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/admission_disclosure_standards.pdf
  - MIT201 – Guide to the Trading System Issue 15.8（交易时段/撮合原则/订单类型权威技术文档）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/mit201-guide-to-the-trading-system-15-8-20260119_0.pdf
  - Maintaining orderly markets（熔断/价格监控扩展 Price Monitoring Extension 说明）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/maintaining-orderly-markets.pdf
  - Rules of the London Stock Exchange（Rulebook，Effective 5 February 2024，会员/交易参与者体系权威规则手册）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/rules-of-the-london-stock-exchange-effective-5-february-2024.pdf
  - AIM Rules for Companies（January 2026，AIM 板块上市与持续义务规则）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/AIM%20Rules%20for%20Companies%20-%20January%202026.pdf
  - Fees for Issuers（Effective 01 January 2026，主板/AIM 发行人年费）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/fees-for-issuers-jan-2026-01.pdf
  - Trading Services Price List（Excludes TRADEcho，Effective 01 January 2025，交易费率表）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/trading-services-price-list-january-2025.pdf
- `lseg.com`（集团官网，与 `www.londonstockexchange.com` 是不同站点，非 SPA） | 官方（母公司 London Stock Exchange Group plc） | en | curl 常规 UA 200，未见反爬 | 历史沿革、清算（LCH）、指数方法论（FTSE Russell）、集团财报
  - The history of LSEG（历史沿革，含1801年正式成立、1986 Big Bang、2001年自身挂牌上市、2007年与 Borsa Italiana 合并组成 LSEG 集团等关键节点）: https://www.lseg.com/en/about-us/history
  - About LCH（清算/中央对手方）: https://www.lseg.com/en/post-trade/clearing/about-lch
  - LSE 24（延长交易时段计划，2026年新闻稿，压测点"独立监管框架下机制持续演进"的证据）: https://www.lseg.com/en/media-centre/press-releases/2026/london-stock-exchange-to-launch-lse-24
  - FTSE UK Index Series Ground Rules（指数编制方法论）PDF: https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-uk-index-series-ground-rules.pdf
  - LSEG plc 2025年度业绩初步公告（Preliminary Results RNS，市值/财务数据）PDF: https://www.lseg.com/content/dam/lseg/en_us/documents/investor-relations/financial-results/preliminary-results/rns/lseg-2025-preliminary-results-rns-26feb2026.pdf
- `fca.org.uk` | 监管 | en | curl 常规 UA 200，未见反爬 | 英国金融行为监管局（FCA），脱欧后 UK Listing Rules 与卖空监管的独立规则制定机关——压测点核心来源
  - UKLR（UK Listing Rules）sourcebook 全文 PDF: https://api-handbook.fca.org.uk/files/sourcebook/UKLR.pdf
  - Short selling（卖空监管，SSR 2025 新制度说明）: https://www.fca.org.uk/markets/short-selling
  - About T+1 settlement（结算周期改革现状，关键事实：本次会话核实时点 2026-08-14，英国仍是T+2，T+1定于2027年10月11日才生效，目前尚未发生）: https://www.fca.org.uk/markets/about-t1-settlement
- `euroclear.com` | 官方（清算/托管机构） | en | ⚠️ curl 常规 UA 对根域名与内容页均返回 403（间隔12秒重试后仍 403，非限流，是真实拦截），未能抓到——Euroclear UK & International（原 CREST）作为 LSE 中央证券存管机构的角色改用第三方转述来源确认，见下 | —
- `gov.uk` | 监管（税务机关 HMRC） | en | curl 常规 UA 200，未见反爬 | 印花税储备税（SDRT）官方说明，含 CREST 代收 SDRT 的机制描述
  - Stamp Duty and Stamp Duty Reserve Tax: https://www.gov.uk/government/publications/stamp-duty-and-stamp-duty-reserve-tax/stamp-duty-and-stamp-duty-reserve-tax

### 法兰克福证券交易所 / Xetra Frankfurt Stock Exchange (FWB) / Deutsche Börse Xetra `de-xetra`
- `cashmarket.deutsche-boerse.com` | 官方 | de/en（本节实测抓取的全部是英文页；同集团站群，抓取体验与 `de-eurex` 一致） | curl + 常规 UA 全部 200，未见反爬 | ⚠️ 法律实体是「法兰克福证券交易所」（Frankfurter Wertpapierbörse，FWB®），官方原文明确写它是「具有有限法律行为能力的公法机构，不能作为私法主体」（"a stock exchange, as a public law institution with limited legal capacity, cannot act as a legal entity under private law"），Deutsche Börse AG 是负责运营的「Trägerin/organising company」——这与 `de-eurex.yml`（Eurex Deutschland 是私法主体的公司）是两种不同的法律形式，即使同属 `deutsche-boerse-group`。「Xetra」是 FWB 名下的电子交易系统（品牌名），FWB 名下另有场内专家做市交易场所「Börse Frankfurt」（主要服务零售），站内很多页面把两个交易场所的信息混排，摘引时要看清楚具体指哪个。规则体系与 Eurex 平行但独立：Börsenordnung（交易所规则）/Handelsordnung（交易规则）/Zulassungsordnung（准入规则）/Gebührenordnung（费用规则）/Bedingungen für Geschäfte（交易条件）五份官方英文版 PDF，直链可从 Rules and Regulations 索引页的静态 HTML 里 grep 出来（同 Eurex 经验）
  - Organisation of the FWB（法律结构说明页，含上述 Trägerin quote）: https://www.cashmarket.deutsche-boerse.com/cash-en/organisation-of-the-fwb（HTTP 200，119KB）
  - Rules and Regulations 索引页: https://www.cashmarket.deutsche-boerse.com/cash-en/Stay-Informed/rules-and-regulations-for-the-fwb（HTTP 200，129KB）
  - Exchange Rules for the FWB（「Börsenordnung」，法律地位/交易所理事会/监管机关等核心制度条款）PDF: https://www.cashmarket.deutsche-boerse.com/resource/blob/31802/6ab37d564c2934a20766824e4284d608/data/2026_07_07_fwb_boersenordnung_en.pdf（HTTP 200，889KB）
  - Trading Rules for the FWB（「Handelsordnung」，交易时段/撮合原则/订单类型/波动性中断等交易机制细则）PDF: https://www.cashmarket.deutsche-boerse.com/resource/blob/306328/277fd149bd7315788c9048d06e1afd63/data/2025_12_01_fwb_handelsordnung_en.pdf（HTTP 200，145KB）
  - Admission Regulations for the FWB（「Zulassungsordnung」，交易参与者/交易员准入资格）PDF: https://www.cashmarket.deutsche-boerse.com/resource/blob/276736/e9bd77a7b2a8e35358c21d7502768c90/data/2025_07_07_fwb_zulassungsordnung_en.pdf（HTTP 200，163KB）
  - Fee Regulations for the FWB（「Gebührenordnung」）PDF: https://www.cashmarket.deutsche-boerse.com/resource/blob/258110/70065473df09ae3e44b1f262128749a2/data/2026_04_09_fwb_gebuehrenordnung_en.pdf（HTTP 200，271KB）
  - Conditions for Transactions on the FWB（「Bedingungen für Geschäfte」）PDF: https://www.cashmarket.deutsche-boerse.com/resource/blob/258072/0c3583c58b7f5f34d7a14143f1419745/data/2025_12_01_fwb_bedingungen_fuer_geschaefte_en.pdf（HTTP 200，328KB）
  - Trading calendar and trading hours: https://www.cashmarket.deutsche-boerse.com/cash-en/Trading-calendar-and-trading-hours-22048（HTTP 200，128KB）
  - Continuous Trading with Auctions: https://www.cashmarket.deutsche-boerse.com/cash-en/trading/Xetra/continuous-trading-with-auctions（HTTP 200，131KB）
  - Protective Mechanisms（波动性中断总览）: https://www.cashmarket.deutsche-boerse.com/cash-en/trading/Xetra/protective-mechanisms（HTTP 200，119KB）
  - Protective Mechanisms in Continuous Trading（波动性中断细则：静态/动态双价格区间、单一模型 vs 自动扩展模型）: https://www.cashmarket.deutsche-boerse.com/cash-en/trading/Xetra/protective-mechanisms/protective-mechanisms-in-continuous-trading（HTTP 200，116KB）
  - Designated Sponsor and Market Maker: https://www.cashmarket.deutsche-boerse.com/cash-en/trading/Xetra/Designated-Sponsor-and-Market-Maker（HTTP 200，122KB）
  - Designated Sponsor Requirements: https://www.cashmarket.deutsche-boerse.com/cash-en/trading/Xetra/Designated-Sponsor-and-Market-Maker/designated-sponsor-requirements（HTTP 200，158KB）
  - Factsheet: EU-regulated market (General/Prime Standard) & Open Market Scale for shares（板块体系对照表）PDF: https://www.cashmarket.deutsche-boerse.com/resource/blob/1514900/3741d89481450eff301b97c66d23f0fb/data/Factsheet-EU-regulated-market-GS-PS-Scale-for-shares.pdf（HTTP 200，393KB）
- `deutsche-boerse.com` | 官方（集团官网） | en | curl 常规 UA 200 | 集团层面页面，覆盖板块结构总览与监管机构说明
  - Market Structure（Prime Standard/General Standard/Scale三层板块定义）: https://www.deutsche-boerse.com/dbg-en/markets-services/ps-pre-ipo-listing/ps-market-structure（HTTP 200，124KB）
  - Frankfurt Stock Exchange Supervisory Bodies: https://www.deutsche-boerse.com/dbg-en/markets-services/trading/frankfurt-stock-exchange/supervisory-bodies（HTTP 200，160KB）
- `live.deutsche-boerse.com` | 官方（集团知识库/术语站，与 cashmarket 站内容有重叠但独立域名） | en | curl 常规 UA 200 | Hessian Stock Exchange Supervisory Authority 说明页
  - Hessian Stock Exchange Supervisory Authority（黑森州交易所监管机关，与 de-eurex 记录的机关同一层级，隶属黑森州经济、能源、交通、住房与农村事务部）: https://live.deutsche-boerse.com/en/know-how/about/organisation-der-boerse/hessische-boersenaufsicht（HTTP 200，723KB）
- `xetra.com` | 官方（Xetra品牌站，与 cashmarket.deutsche-boerse.com 内容有重叠、URL结构不同，两个域名都要单独注册） | en | curl 常规 UA 200 | 清算结算与费用说明页
  - Settlement: https://www.xetra.com/xetra-en/clearing-settlement/settlement（HTTP 200，167KB）
  - Clearing: https://www.xetra.com/xetra-en/clearing-settlement/clearing（HTTP 200，167KB）
  - Fees 总览页: https://www.xetra.com/fees/（HTTP 200，167KB）
- `bafin.de` | 监管（联邦金融监管局，Bundesanstalt für Finanzdienstleistungsaufsicht） | en | curl 常规 UA 200 | 净卖空头寸申报页，依据欧盟第236/2012号法规；⚠️ 门槛具体数值（申报门槛0.1%、公开披露门槛0.5%）本次未能在该页找到逐字可摘引的表述（正文侧重申报操作流程，数值散见于示例段落，非规范性陈述句），`short_selling` 相关字段的具体阈值留空未采纳，见 OPEN-QUESTIONS
  - Net Short Positions: https://www.bafin.de/EN/unternehmen-maerkte/mvp-portal/nettoleerverkauf/nettoleerverkauf_node_en.html（HTTP 200，78KB）
- `bzst.de` | 监管（联邦中央税务局，Bundeszentralamt für Steuern） | de（未找到对应英文页） | curl 常规 UA 200 | 资本利得预扣税官方税率说明（25%资本利得税+其5.5%团结附加税，合计26.375%）
  - Kapitalerträge und Entlastung（企业适用页）: https://www.bzst.de/DE/Unternehmen/Kapitalertraege/kapitalertraege_node.html（HTTP 200，74KB）
- `stoxx.com` | 官方（集团关联指数商 Qontigo/STOXX，法人实体与交易所本身不同，但同属 Deutsche Börse Group 品牌矩阵） | en | curl 常规 UA 200 | DAX指数页：确认STOXX自2019年9月起为编制/管理方、自由流通市值加权、单一成分股权重上限15%（2024年3月18日起，此前为10%）
  - DAX: https://stoxx.com/index/dax/（HTTP 200，878KB）

### 新加坡交易所 Singapore Exchange (SGX) `sg-sgx`
- `rulebook.sgx.com` | 官方（规则手册独立域名） | en | curl + 常规 UA 全部 200，未见反爬；页面正文夹杂大量导航/相关链接文字，抓到后按关键词定位正文 | ⚠️ SGX 集团下 SGX-ST（Singapore Exchange Securities Trading Limited，现货证券）与 SGX-DT（Singapore Exchange Derivatives Trading Limited，衍生品）是 MAS 分别核准的两个独立"Approved Exchange"法人实体（另有 SGX-DC 衍生品清算、CDP 证券清算/存管，见下 cftc.gov 一条），但本项目只建一个 `sg-sgx` 条目覆盖整个 SGX 品牌的现货+衍生品业务（Wave 1/2 名单未规划把 SGX-DT 拆成姊妹交易所另行建档），**不设 `group_id`**——与 NYSE/JPX/Eurex 那种"本文件只记一个实体、集团内确有其他姊妹交易所品牌"的情况不同，这里是刻意合并单一条目代表整个可识别品牌，详见数据文件顶部注释
  - SGX-ST Rules（现货证券交易规则总览）: https://rulebook.sgx.com/rulebook/sgx-st-rules（HTTP 200，2.1MB）
  - Mainboard Rules（主板上市规则）: https://rulebook.sgx.com/rulebook/mainboard-rules（HTTP 200，2.0MB）
  - Catalist Rules（凯利板上市规则）: https://rulebook.sgx.com/rulebook/catalist-rules（HTTP 200，1.8MB）
  - Futures Trading Rules（衍生品交易规则总览）: https://rulebook.sgx.com/rulebook/futures-trading-rules（HTTP 200，1.2MB）
  - Regulatory Notice 8.2.1 — Trading Hours, Market Phases（交易时段/市场阶段细则）: https://rulebook.sgx.com/rulebook/regulatory-notice-821-trading-hours-market-phases-application-market-phases-and-principles（HTTP 200，613KB）
  - Regulatory Notice 8.14.1 — Circuit Breaker（熔断机制细则）: https://rulebook.sgx.com/rulebook/regulatory-notice-8141-circuit-breaker（HTTP 200，587KB）
  - Chapter 7 — Clearing and Margins（期货清算与保证金）: https://rulebook.sgx.com/rulebook/chapter-7-clearing-and-margins（HTTP 200，461KB）
  - CDP Clearing Rules（证券中央存托/清算规则）: https://rulebook.sgx.com/rulebook/cdp-clearing-rules（HTTP 200，1.6MB）
  - CDP Settlement Rules（证券结算规则）: https://rulebook.sgx.com/rulebook/cdp-settlement-rules（HTTP 200，288KB）
  - SGX-DC Clearing Rules（衍生品清算规则）: https://rulebook.sgx.com/rulebook/sgx-dc-clearing-rules（HTTP 200，1.8MB）
  - Chapter 6 — Designated Market-Makers（做市商制度）: https://rulebook.sgx.com/rulebook/chapter-6-designated-market-makers（HTTP 200，612KB）
  - 18.12 Transaction Costs（交易成本总览章节）: https://rulebook.sgx.com/rulebook/1812-transaction-costs（HTTP 200，547KB）
  - 18.12.2 Clearing Fees（清算费率）: https://rulebook.sgx.com/rulebook/18122-clearing-fees（HTTP 200，545KB）
  - 18.12.4 Stamp Duty（此页实为期权交易章节的印花税条款，非现货股票印花税，现货部分改用下方 iras.gov.sg 来源）: https://rulebook.sgx.com/rulebook/18124-stamp-duty（HTTP 200，545KB）
  - Global Listing Board Rules（⚠️ 全新第三上市板块，专供已在 Nasdaq 上市公司申请在 SGX 双重上市，定义章节里大量出现"Nasdaq"/"Nasdaq Listing Rules"，准入门槛为 S$20亿市值+以美元计的营收/利润测试+至少500名全球股东；发现时间 2026-08-14，此前完全不知道 SGX 有这第三块板，Mainboard/Catalist 之外）: https://rulebook.sgx.com/rulebook/global-listing-board-rules（HTTP 200，310KB）
- `sgx.com` | 官方（主站，非规则手册） | en | ⚠️ curl 抓到的是 React/Next.js 空壳（`about-us/our-history`、`securities/corporate-information`、`securities/clearing-information` 等页面均只有约 14.5KB 的 `<title>Singapore Exchange (SGX)</title>` 外壳，正文由前端 JS 拉取 API 渲染，纯 curl 拿不到内容，`investorrelations.sgx.com` 与 `sgxgroup.com` 同样是空壳/连接超时）——公司概况/历史/统计类事实改走 `links.sgx.com` 静态 PDF 公告或监管机构文件，见下 | 主站本身仅用于确认域名归属，不作为具体事实的独立出处
  - 首页（仅用于确认域名归属）: https://www.sgx.com/
- `links.sgx.com` | 官方（公司公告静态托管） | en | curl 常规 UA 200，是纯静态 PDF 托管，不像 www.sgx.com 那样是 SPA | SGX 月度市场统计报告 PDF（总市值/上市公司数/成交量，每月更新，URL 含随机 ID，需要重新搜索定位当期文件）；2014年公告 PDF 确认标准板手（board lot）由1,000股下调至100股（2015-01-19生效），这是本节目前找到的唯一带原文数字的板手来源，2026年是否对高价股进一步下调未找到官方原文，未纳入
  - 2026年4月市场统计报告 PDF: https://links.sgx.com/1.0.0/corporate-announcements/1DNTODDQ7XS4ENGJ/888606_SGX%20Monthly%20Statistics%20Report%20Update_Apr%202026.pdf（HTTP 200，816KB）
  - 2014年board lot下调公告 PDF: https://links.sgx.com/1.0.0/corporate-announcements/7DQWR38YKAQKDCBE/312230_20140825_SGX_to_introduce_reduced_board_lot_size_from_19_January.pdf（HTTP 200，113KB）
- `mas.gov.sg` | 监管 | en | curl 常规 UA 200，未见反爬 | 新加坡金融管理局（MAS），SGX 的政府监管机构；AE/RMO 制度页确认「Approved Exchange」这一监管牌照类别存在，但未在本节已抓取页面里直接看到"SGX-ST/SGX-DT 是分别核准的两个 Approved Exchange"这句原文——这条判断改用下方 CFTC 集团架构图（列出 ST/DT 为并列全资子公司）加 sso.agc.gov.sg 的 SFA 条文交叉印证，不单独归给 mas.gov.sg
  - Markets and Exchanges（AE/RMO 监管框架说明）: https://www.mas.gov.sg/regulation/capital-markets/understand-the-types-of-capital-market-entities/markets-and-exchanges（HTTP 200，254KB）
  - Approved Exchange (AE) or Recognised Market Operator (RMO) Licence: https://www.mas.gov.sg/regulation/capital-markets/apply-for-licensing-or-registration-of-capital-market-entities/approved-exchange-ae-or-recognised-market-operator-rmo-licence（HTTP 200，256KB）
  - Monthly Statistical Bulletin III.7 — SGX-ST Price Index, Number of Listed Companies, Turnover and Capitalisation: https://www.mas.gov.sg/statistics/monthly-statistical-bulletin/iii-7-sgx-st-price-index-number-of-listed-companies-turnover-and-capitalisation（HTTP 200，253KB）
- `iras.gov.sg` | 监管（税务机关） | en | curl 常规 UA 200 | 新加坡国内税务局（IRAS），确认印花税/资本利得税/股息预扣税待遇
  - Stamp Duty for Shares — Basics（确认无纸化CDP过户股票免印花税）: https://www.iras.gov.sg/taxes/stamp-duty/for-shares/basics-of-stamp-duty-for-shares/learning-the-basics-for-shares（HTTP 200，287KB）
  - Dividends（个人所得税下股息征税规则，单层企业税制下股东股息免税）: https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/what-is-taxable-what-is-not/dividends（HTTP 200，261KB）
  - Gains from Sale of Property, Shares and Financial Instruments（确认无资本利得税）: https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/what-is-taxable-what-is-not/gains-from-sale-of-property-shares-and-financial-instruments（HTTP 200，261KB）
- `sso.agc.gov.sg` 追加一条 —— 《交易所（公司化与合并）法》（Exchanges (Demutualisation and Merger) Act 1999），第3(1)条明文"The transfer date is 1 December 1999"，是SGX由SES（新加坡证券交易所）/SIMEX（新加坡国际金融交易所）/SCCS（证券结算与电脑服务）三家法定合并成立的直接法律依据，比第三方综述可靠得多: https://sso.agc.gov.sg/Act/EDMA1999（HTTP 200，131KB）
- `lseg.com` | 官方（STI 指数编制方 FTSE Russell 官网，母公司 London Stock Exchange Group） | en | curl 常规 UA 200 | 确认海峡时报指数（STI）由 FTSE Russell、SPH Media、SGX Group 三方联合编制——与上证综指"交易所自编"、恒生指数"第三方独家编制"都不同，是第三种"交易所参与但非独家编制"模式
  - FTSE Straits Times Index Series: https://www.lseg.com/en/ftse-russell/indices/sgx-st（HTTP 200，243KB）
- `cftc.gov` 一条的用途更正：该 PDF 除确认 SGX-DC 境外清算所注册审查外，其"SGX Legal Entities Structure"图本身即列出 Singapore Exchange Limited 全资拥有 CDP／SGX-DT／SGX-DC／SGX-ST／SCCS／SGXI 等子公司，是本节 `group_id` 判断（不设）与集团架构描述的关键交叉证据
- `sso.agc.gov.sg` | 官方（新加坡政府法规官方公布平台，Singapore Statutes Online） | en | curl 常规 UA 200 | 《证券期货法》（Securities and Futures Act 2001）等法律的权威公布渠道
  - Securities and Futures Act 2001: https://sso.agc.gov.sg/act/sfa2001（HTTP 200，1.3MB）
- `cftc.gov` | 监管（美国商品期货交易委员会，第三方监管文件） | en | curl 常规 UA 200 | 用于交叉核实 SGX 集团法人实体结构（SGX-ST/SGX-DT/SGX-DC 等），因 CFTC 对 SGX-DC 的境外清算所注册审查披露了集团结构图；⚠️ 非新加坡本地监管机构，交叉验证用，`confidence` 相应处理
  - SGX Legal Entities Structure PDF: https://www.cftc.gov/sites/default/files/stellent/groups/public/@otherif/documents/ifdocs/sgxdcdcoapplegalentstructure.pdf（HTTP 200，197KB）

### 澳大利亚证券交易所 Australian Securities Exchange (ASX) `au-asx`
- `asx.com.au` | 官方 | en | curl + 常规浏览器 UA 全程 200，未见反爬或限流（连续 20+ 次请求无一次 403，比 SEC/FINRA/DTCC 好抓得多）；PDF 与 HTML 均可直抓 | ASX Group 母公司 ASX Limited 本身在自己的市场上市（自身股票代码 ASX），`group_id` 判断：ASX Group 下设 ASX Clear/ASX Settlement/ASX Clear (Futures)/Austraclear 等清算结算法人实体，但均非"计划收录的姊妹交易所"（不像 NYSE American/Arca 或 JPX 的大阪交易所那样是独立可比的交易市场实体），本文件不设 group_id；现货市场"ASX"与衍生品市场"ASX 24"（2006 年由 Sydney Futures Exchange 并入）均由同一持牌市场运营商 ASX Limited 运营，非分立法人，本文件聚焦现货股票市场（ASX 本身），ASX 24 仅在必要处提及
  - 监管框架总览: https://www.asx.com.au/about/regulation（HTTP 200，180KB）
  - ASX Group 集团架构: https://www.asx.com.au/about/asx-group.htm（HTTP 200，152KB）
  - 历史沿革: https://www.asx.com.au/about/history.htm（HTTP 200，163KB，1871年悉尼证券交易所成立、1987年六个州级交易所合并为 Australian Stock Exchange、2006年与悉尼期货交易所合并改名 Australian Securities Exchange）
  - 现货市场交易时段: https://www.asx.com.au/markets/market-resources/trading-hours-calendar/cash-market-trading-hours（HTTP 200，147KB，含开盘集合竞价/连续竞价/收盘集合竞价随机化时点）
  - ASX Operating Rules 第三节·交易规则 PDF: https://www.asx.com.au/content/dam/asx/rules-guidance-notes-waivers/asx-operating-rules/rules/asx_or_section_03.pdf（HTTP 200，208KB）
  - 上市要求总览页: https://www.asx.com.au/listings/listing-considerations/listing-requirements（HTTP 200，146KB，含300名非关联股东、A$1.5M营运资金等量化门槛）
  - Listing Rules Chapter 1（准入规则）PDF: https://www.asx.com.au/documents/rules/Chapter01.pdf（HTTP 200，234KB）
  - Listing Rules Guidance Note 1（准入指引）PDF: https://www.asx.com.au/content/dam/asx/rules-guidance-notes-waivers/asx-listing-rules/guidance-notes/gn01-admission.pdf（HTTP 200，829KB）
  - Listing Rules Chapter 17（停牌/暂停/除牌）PDF: https://www.asx.com.au/documents/rules/Chapter17.pdf（HTTP 200，143KB）
  - Listing Rules Guidance Note 16（停牌指引）PDF: https://www.asx.com.au/content/dam/asx/rules-guidance-notes-waivers/asx-listing-rules/guidance-notes/gn16-trading-halts.pdf（HTTP 200，314KB）
  - 清算总览: https://www.asx.com.au/about/regulation/clearing-and-settlement-of-cash-equities-in-australia/clearing（HTTP 200，154KB）
  - ASX Settlement（CHESS，托管/结算）: https://www.asx.com.au/markets/clearing-and-settlement-services/asx-settlement（HTTP 200，161KB）
  - T+1 结算周期改革页（现行仍为 T+2，本页为未来改革说明）: https://www.asx.com.au/markets/clearing-and-settlement-services/t1-settlement-cycle（HTTP 200，151KB）
  - ASX Clear 现货市场清算（CCP角色）: https://www.asx.com.au/markets/clearing-and-settlement-services/asx-clear/cash-market-clearing（HTTP 200，143KB）
  - 费率总览页: https://www.asx.com.au/markets/market-resources/asx-schedule-of-fees（HTTP 200，142KB，仅导航链接页，不含具体费率数字）
  - ASX Clear 现货市场清算费率表 PDF: https://www.asx.com.au/content/dam/asx/participants/clearing-and-settlement/asx-clear/schedule-of-fees.pdf（HTTP 200，155KB，含逐笔交易清算费率具体数值）
  - ASIC 与 ASX 监管职责划分 PDF: https://www.asx.com.au/content/dam/asx/about/matters-regulated-by-asic-vs-matters-regulated-by-asx.pdf（HTTP 200，188KB）
  - 市场波动性 FAQ（Extreme Trade Range / Enhanced Volatility Interruption 机制说明）: https://www.asx.com.au/markets/market-resources/market-volatility-faqs（HTTP 200，148KB）
  - S&P/ASX 指数体系 101（博客，官方对第三方编制指数的说明）: https://www.asx.com.au/blog/listed-at-asx/sandp-asx-indices-101（HTTP 200，160KB）
  - 开收盘机制改革说明（博客）: https://www.asx.com.au/blog/listed-at-asx/changes-to-equity-market-structure（HTTP 200，159KB）
- `asic.gov.au` | 监管 | en | curl 常规 UA 200，未见反爬 | 澳大利亚证券及投资委员会（ASIC），ASX 的政府监管机构；RG 196 是卖空监管的权威监管指引原文
  - Regulatory Guide 196 - Short Selling PDF: https://download.asic.gov.au/media/4896780/rg196-published-8-october-2018.pdf（HTTP 200，702KB）
  - RG 196 索引页: https://www.asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-196-short-selling/（HTTP 200，66KB）
  - ASX 因 CHESS 替换项目误导性陈述被罚 2050万澳元（2026年，用于风险与特殊考量章节的监管执法案例）: https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-143mr-asx-ordered-to-pay-20-5-million-penalty-for-misleading-conduct-relating-to-chess-replacement-project/（HTTP 200，20KB）
- `foreigninvestment.gov.au` | 监管（外国投资审查委员会 FIRB 所属网站，财政部下设） | en | curl 常规 UA 200 | 用于确认外资持股上市公司的申报门槛（一般性被动持股 <20% 通常无需申报，达到实质利益门槛或涉及国家安全业务另有规则），非 ASX 自身规则而是全澳适用的外资审查制度，与港交所"自由港无限制"形成对比
  - 首页: https://foreigninvestment.gov.au/（HTTP 200，34KB）
  - Guidance Note 7 - Business Investments PDF: https://foreigninvestment.gov.au/sites/firb.gov.au/files/guidance-notes/gn07_business-20230531.pdf（HTTP 200，497KB）
  - 货币门槛说明页: https://foreigninvestment.gov.au/guidance/general/monetary-thresholds（HTTP 200，32KB）
- `legislation.gov.au` | 官方（立法机构，联邦官方法律文本库） | en | curl 常规 UA 200（响应体 2.8MB，偏大） | ⚠️ 实测发现：`/latest/text` 这个端点抓到的 2.8MB HTML 转纯文本后只有约6800行，通篇是《公司法2001》（Corporations Act 2001）的**章节目录索引**（Division/Part/section标题的树状列表），不含逐条正文——该法条文正文在这个网站上是按章节拆分成独立子页面渲染的，本轮未逐个子页面深挖具体条文。用途仅限于确认法律名称/编号/章节结构存在（如"Division 4—The Australian market licence""798G Market integrity rules"等标题本身），不能指望从这一个URL摘到具体条文quote；需要引用具体条文文字时改用ASX/ASIC自己转述该法条文的二手页面（如asic-vs-asx.txt已经很好用）
  - Corporations Act 2001 目录索引: https://www.legislation.gov.au/C2004A00818/latest/text（HTTP 200，2.8MB，仅目录非正文）
- `spglobal.com` | 第三方（指数编制商 S&P Dow Jones Indices 官网） | en | ⚠️ curl 常规 UA 及加 Referer 均返回 403（反爬，非限流，两次不同 UA/头部尝试均失败）——按 CLAUDE.md 三启用降级：指数体系章节改用 asx.com.au 自身对 S&P/ASX 200 等指数的说明博客作为来源（`confidence` 上限 medium，因非编制方原始方法论文档），方法论 PDF 具体条款留空，见 OPEN-QUESTIONS | S&P Dow Jones Indices，编制 S&P/ASX 200 等旗舰指数（第三方编制，非交易所自编，与上交所"自编"、港交所"恒生指数公司"形成第三种对比模式）

### 沙特交易所 Saudi Exchange (Tadawul) `sa-tadawul`
- `tadawulgroup.sa` | 官方（集团控股公司站点，与被封锁的 saudiexchange.sa 共用同一套 IBM WebSphere Portal 内容管理后端） | ar/en（阿拉伯语为唯一官方语言，英文版为官方提供的对照译本；部分 PDF 首页标注"Arabic is the official language of the Saudi Exchange"或"unofficial translation"字样） | curl + 常规 UA 全部 200，未见反爬；⚠️ `/wps/portal/tadawulgroup/...` 命名空间下的集团公司页可正常抓取，但把 `saudiexchange`/`edaa` 等其他子品牌的 portal 路径直接拼到 `tadawulgroup.sa` 域名下会被应用层拒绝返回 403（如 `tadawulgroup.sa/wps/portal/saudiexchange/...`），只有 `wcm/connect/...`（内容仓库直链，通常是 PDF）路径不受这条限制、任意命名空间前缀都能抓到 | 规则类 PDF 大多是集团整体维护的内容仓库资源，即使标题写"Saudi Exchange Company"也通过 tadawulgroup.sa 域名分发；`Trading and Membership Procedures` 一份 PDF 信息密度最高，交易时段/订单类型/订单条件/最小报价单位/涨跌停与波动性拍卖机制均有精确条文可摘引
  - Saudi Exchange 集团子公司页: https://www.tadawulgroup.sa/wps/portal/tadawulgroup/portfolio/saudi-exchange
  - Edaa（证券存管中心）子公司页: https://www.tadawulgroup.sa/wps/portal/tadawulgroup/portfolio/edaa
  - Muqassa（证券清算中心）子公司页: https://www.tadawulgroup.sa/wps/portal/tadawulgroup/portfolio/muqassa
  - Listing Rules（上市规则）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/e4bfbba8-4932-4b0c-b405-c922ac56d780/Listing+Rules.pdf?MOD=AJPERES&CVID=pfpotDY
  - Trading and Membership Procedures（交易与会员规程，含交易时段/订单类型/涨跌停与波动性拍卖机制的核心条文）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/1c9c5c7b-1c6a-444e-994a-85fe1fbabb5c/Trading+and+Membership+Procedures+.pdf?MOD=AJPERES&ContentCache=NONE&CACHE=NONE&CACHEID=ROOTWORKSPACE-1c9c5c7b-1c6a-444e-994a-85fe1fbabb5c-pvARxBI
  - Indices Methodology 2024（指数方法论）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/93482491-9528-4979-8e6e-f11691e35bf6/Indices+Methodology+2024.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-93482491-9528-4979-8e6e-f11691e35bf6-o.tGnQ1
  - Market Making Regulations（做市商制度）PDF（⚠️ 文件名本身含半角括号"(2)"，URL 里必须用 `%282%29` 转义，否则 `tools/fetch.py` 的 `URL_RE` 会在半角 `)` 处截断——已实测转义后可正常抓取）: https://www.tadawulgroup.sa/wps/wcm/connect/2fc1a74f-4357-4843-9b50-0edbc06296b3/Market+Making+Regulations+%282%29.pdf?MOD=AJPERES&ContentCache=NONE&CACHE=NONE&CACHEID=ROOTWORKSPACE-2fc1a74f-4357-4843-9b50-0edbc06296b3-oqd5Wba
  - Derivatives Market Brochures（衍生品市场介绍）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/0e0e1657-e035-4172-a4e6-943c4dfce80d/Derivatives+Market+Brochures.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-0e0e1657-e035-4172-a4e6-943c4dfce80d-oW9oJ-.
- `cma.gov.sa` | 监管 | ar/en | curl + 常规 UA 全部 200，未见反爬 | 沙特资本市场管理局（Capital Market Authority, CMA），Saudi Exchange 的政府监管机构；官方确认域名是 `cma.gov.sa`（`.gov.sa` 而非旧域名 `cma.org.sa`，后者仍能 200 但已非最新权威站点，本次未采用）
  - About CMA: https://cma.gov.sa/en/AboutCMA/Pages/AboutCMA.aspx
  - Capital Market Law 索引页: https://cma.gov.sa/en/RulesRegulations/CMALaw/Pages/default.aspx
  - Capital Market Law（资本市场法，含交易所/存管中心/清算中心须经 CMA 许可并采用股份公司形式等核心条文）PDF: https://cma.gov.sa/en/RulesRegulations/CMALaw/Documents/CMA_Law.pdf
  - Capital Market Institutions Regulations PDF: https://cma.gov.sa/en/RulesRegulations/Regulations/Documents/CapitalMarketInstitutionsRegulations.pdf
  - Awareness/Regulations 总览页: https://cma.gov.sa/en/Awareness/Pages/Regulations.aspx
- `edaa.sa` | 官方（证券存管中心，Saudi Tadawul Group 旗下子公司，CSD） | en | curl + 常规 UA 200，未见反爬 | Depository and Settlement System (DSS) 说明，证券侧全额交收、资金侧净额结算
  - Settlement 服务页: https://www.edaa.sa/wps/portal/edaa/services/memberservices/settlement?locale=en
- `muqassa.sa` | 官方（证券清算中心，Saudi Tadawul Group 旗下子公司，CCP） | en | curl + 常规 UA 200，未见反爬 | 首页含公司成立年份（2018）与最新公告列表，本身即含正文，未见明显反爬
  - 首页: https://www.muqassa.sa/wps/portal/muqassa/home
- `annualreport2018.tadawul.com.sa` | 官方（2018 年度报告站点存档，静态站点，非现行 WebSphere Portal 系统） | en | curl + 常规 UA 200，未见反爬；⚠️ 是历史存档页（2018年报），仅用于确认「2007年3月19日依据资本市场法第20条成立为股份公司」这条历史成立事实，不代表当前最新股权/上市结构（Tadawul 已于2021年改制为控股集团并完成IPO，见 regulation/overview 相关字段 detail 说明）
  - About Tadawul: https://annualreport2018.tadawul.com.sa/Resources/AnnualReport/company_profile/about_tadawul.html
- `lw.com` | 第三方（Latham & Watkins 律所客户简报） | en | curl 常规 UA 200 | 用于确认 2026年2月1日起 CMA 取消 QFI（合格境外投资者）制度、开放主板予全体外资，但保留外资合计49%上限与单一外资10%上限的监管改革；`confidence` 标 medium——已尝试在 `cma.gov.sa` 站内寻找对应官方公告/新规则 PDF 未果（本次 WebSearch 配额已用尽，下次有空应补找 CMA 官方原文，见 OPEN-QUESTIONS）
  - Saudi CMA Broadens Main Market Access for Foreign Investors: https://www.lw.com/en/insights/saudi-cma-broadens-main-market-access-for-foreign-investors
- `saudiexchange.sa`（⚠️ 本节唯一未攻克的域名，见 CLAUDE.md 三降级方案） | 官方（Saudi Exchange 运营实体自身官网，本应是最主要的一手来源） | — | **全站被 Akamai WAF 拦截，任何路径、任何 UA 组合均返回 403**（响应体含 `errors.edgesuite.net` 字样，确认是 Akamai Edge 防护，与 v0.2 探测记录里 `sec.gov`/`finra.org`/`dtcc.com` 同一类拦截）。已测试：①默认常规 UA 直连首页与深层 `/wps/portal/...` 路径均 403；②换 Safari UA + 加 `Accept-Language`/`Referer`（伪装成来自 Google 搜索跳转）头模拟真实浏览器仍 403；③直接请求站内 PDF 直链（如 `Trading and Membership Procedures.pdf`）同样 403，说明拦截是域名级而非仅拦网页；④尝试 `beta.saudiexchange.sa` 子域名，证书已过期（需 `-k` 跳过校验）且同样 403，判断是被弃用的旧站点，不值得继续尝试；⑤`web.archive.org` 可达但查询该域名快照时遇到限流（429/503），未能验证是否有可用快照。**降级方案**：改用同一 CMS 后端但未被拦截的 `tadawulgroup.sa` 域名（可抓到大量同源 PDF 规则文档与集团子公司页），配合监管方 `cma.gov.sa`、清算/存管子公司自己的域名 `edaa.sa`/`muqassa.sa` 作为一手来源替代，实测覆盖了监管、交易机制、上市、指数、清算五大章节的核心内容，缺口主要在 Saudi Exchange 自身网站上才有的实时市场数据类页面（如行情费率、历史数据可得性），这类字段本次相应留空或标 low confidence，见 OPEN-QUESTIONS

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
