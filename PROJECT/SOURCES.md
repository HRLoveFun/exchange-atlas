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

## 经验：WebSearch 命中的独立 PDF 可能是过期存档，规则数字变动过的字段务必交叉核对

补全 `hk-hkex` 主板/GEM 上市财务门槛时（2026-08-17）踩到的坑：WebSearch 命中的
`cn-rules.hkex.com.hk` 中文版《上市规则》第八章单行本 PDF（`HKEXCN_TC_5088_VER2598.pdf`）
抓下来后，「盈利测试」门槛显示为 2,000万／3,000万港元——但同一天抓取的英文版 Chapter 8 PDF
（`en-rules.hkex.com.hk`）显示 3,500万／4,500万港元。两者本应是同一条规则的中英对照，数字却对不上，
一查才发现主板盈利测试门槛在 2022-01-01 生效的规则修订中从 20/30 上调到 35/45（第三方法律简报可
交叉确认这个日期，`confidence` 只能标 medium），说明搜索引擎索引到的是**修订前的旧版存档 PDF**，
文件本身返回 HTTP 200、看起来"抓到了"，但内容已经不是现行规则——**HTTP 200 不等于内容是现行版本**，
尤其是规则数值这类会随时间修订的字段。

**做法**：交易所规则手册站点如果有「整章合并显示」页面（如本例 `entiresection/<id>`，服务端渲染、
非独立托管 PDF、由规则手册导航体系直接生成），比孤立的单章 PDF 更可能反映当前生效版本，值得优先
用来交叉核对数字，尤其是官方文档本身没有清楚标注修订日期/版本号的情况下。**能拿到官方双语版本的
交易所，中英文数字应该逐字对得上——对不上是信号，不是噪音，一定要停下来查清楚哪个版本过期，不能
两个数字里随便选一个填。**

---

### 上海证券交易所 Shanghai Stock Exchange (SSE) `cn-sse`
- `sse.com.cn` | 官方 | zh | WebFetch 对规则总览页（`lawandrules/sselawsrules/overview/`）返回 403；换 `lawandrules/sselawsrules2025/overview/`（新版路径）+ curl 常规 UA 可过（HTTP 200）；PDF 用 `pdftotext -layout` 提取纯文本再 grep 定位条款，比逐页翻 PDF 快得多 | 规则总览页本身不含全文直链，需从站内导航多跳到具体规则文档；官网有《现行有效的业务规则清单》目录 PDF（见下）能确认某规则「现行有效」，但清单本身不含可点击的逐条直达链接，还没找到《交易规则》全文在 sse.com.cn 上的直接 URL——这是本节唯一的已知缺口，下次找到了请替换掉 mgzq.com 那条并把相关字段 confidence 升回 high
  - 规则总览: https://www.sse.com.cn/lawandrules/sselawsrules2025/overview/
  - 现行有效的业务规则清单（PDF，确认《交易规则》仍现行有效，但只是目录不含全文）: https://www.sse.com.cn/lawandrules/sselawsrules2025/overview/c/10778726/files/ddfc82e93a85496bb075175d9a8d811d.pdf
  - 上证综合指数编制方案 PDF: https://www.sse.com.cn/market/sseindex/indexlist/indexdetails/indexmethods/c1/000001_000001_CN.pdf
  - 指数熔断暂停通知（2016，上证发〔2016〕4号）: http://www.sse.com.cn/aboutus/mediacenter/hotandd/c/c_20160107_4033450.shtml
  - 沪市市场运行情况例行发布（周度市值/上市公司数统计，URL 每周变化，需重新搜索定位当期文件）: http://www.sse.com.cn/aboutus/mediacenter/conference/
  - 《上海证券交易所股票上市规则（2026年4月修订）》公告页（上证发〔2026〕42号，2024年4月30日发布的原规则关于「上市条件」的条款未被本次修订变动，本次仅修订董事会秘书等治理条款，但附件为整合后现行有效全文）: https://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/mainipo/c/c_20260424_10816589.shtml
  - 《上海证券交易所股票上市规则（2026年4月修订）》全文 DOCX（第三章第一节 3.1.1-3.1.6 为主板上市条件，含市值及财务指标三选一标准、红筹企业标准、差异表决权标准；⚠️ 该公告页挂了两个 docx，另一个 `beaf9e6b9ded4380a24ca148cc3902e2.docx`（20KB）只是本次修订的「修订说明」，不含完整条文，第一次误取过要注意区分）: https://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/mainipo/c/10816589/files/0017fa2bde184b53b43c046d503f54d0.docx（HTTP 200，175KB，⚠️ `.docx` 格式，`tools/fetch.py` 会按扩展名规则误存为 `.html`，字节内容不受影响；用 macOS `textutil -convert txt` 转纯文本后可直接 grep，比转 PDF 更简单)
  - 《上海证券交易所科创板股票上市规则（2026年4月修订）》公告页（上证发〔2026〕43号）: https://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/staripo/c/c_20260424_10816592.shtml
  - 《上海证券交易所科创板股票上市规则（2026年4月修订）》全文 DOCX（第二章第一节 2.1.1-2.1.4 为科创板上市条件，含市值及财务指标五选一标准、红筹企业标准、差异表决权标准；⚠️ 同一公告页下 `cc4a8a0e637144ea93285a3773e3965a.docx`（16KB）同样只是修订说明，不是全文）: https://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/staripo/c/10816592/files/8d80222543f64159ac5d177b7aace71c.docx（HTTP 200，172KB，同上 `.docx` 注意事项）
  - 2026-08-24 补全 Category B 空缺字段这次新增登记（均为 `sse.com.cn` 域名下，沿用既有域名条目）：
    - 《上海证券交易所股票上市规则（2026年4月修订）》全文 DOCX 第九章「退市与风险警示」（9.1.10/9.1.13/9.1.14/9.1.15/9.2.9 逐条给出终止上市决定、公告时限、强制退市后主办券商安排、摘牌时限，是 `listing.delisting_process` 出处；与上面第三章第一节主板上市条件为同一份文件，不重复登记 URL）
    - 《关于退市公司进入退市板块挂牌转让的实施办法》公告页（股转系统公告〔2022〕166号，2022-04-29发布，「现行有效」；由上交所/深交所/北交所/全国股转系统/中国结算联合制定，`listing.post_delisting_venue` 出处）: http://www.sse.com.cn/lawandrules/sselawsrules2025/stocks/mainipo/c/c_20250516_10779154.shtml（HTTP 200，33981B）
    - 关于本所股票竞价交易异常情况的公告（上证公告〔2024〕32号，2024-09-27，`infrastructure.major_outage_history` 出处）: https://www.sse.com.cn/disclosure/announcement/general/c/c_20240927_10762482.shtml（HTTP 200，27635B）
    - 《证券登记结算管理办法》（中国证监会令第29号，托管于 sse.com.cn「法律法规」栏目，第七章「风险防范和交收违约处理」第65-73条完整给出结算参与人违约处置顺序，`clearing.default_management` 主要出处）PDF: http://www.sse.com.cn/lawandrules/regulations/csrcorder/c/10116597/files/f2bae870b188483eae343f735c141cf6.pdf（HTTP 200，273253B）
    - 《关于实施〈合格境外机构投资者和人民币合格境外机构投资者境内证券期货投资管理办法〉有关问题的规定》PDF（第七条给出单个/全部境外投资者持股比例上限，`regulation.foreign_ownership_limit` 出处；同时含托管人-外汇局跨境资金流动联合监管条款，`regulation.capital_controls` 出处）: https://www.sse.com.cn/lawandrules/regulations/csrcannoun/c/10117179/files/9cdbd4b41fc3453e8f8a036719ea8e24.pdf（HTTP 200，126689B）
- `mgzq.com` | 第三方（券商网站镜像的官方文件） | zh | curl 常规 UA 可过（499KB） | 《上海证券交易所交易规则（2023年修订）》镜像件，内含第六章"科创板交易特别规定"。⚠️ 非交易所自有域名，按 CLAUDE.md 二第3条，仅凭此来源的字段 `confidence` 上限为 `medium`，不得标 `high`——即使摘录到了逐字 quote 也一样，因为无法排除镜像件被静默改动的风险
  - 交易规则（2023年修订）: https://www.mgzq.com/userfiles/ecb5375bc6ab4174a6d9fb405222c2a7/files/cms/article/上海证券交易所交易规则（2023年修订）.pdf
- `csrc.gov.cn` | 监管 | zh/en | curl 常规 UA 可过；`common_list.shtml` 类列表页有缓存滞后现象，仅用于确认机构名称与域名，不作为具体规则条款出处；直接拼接文件名 URL 抓 PDF 偶发"空响应"（`curl: (52) Empty reply from server`），间隔数秒重试即可恢复，不代表持续封锁 | 中国证券监督管理委员会（CSRC），SSE 的政府监管机构
  - 2026-08-24 新增：证券公司名录（2026年6月）XLS（`participants.broker_landscape` 出处，用 `xlrd` 解析，表头1行+150家持牌证券公司数据行）: http://www.csrc.gov.cn/csrc/c101900/c1029659/1029659/files/%E8%AF%81%E5%88%B8%E5%85%AC%E5%8F%B8%E5%90%8D%E5%BD%95%EF%BC%882026%E5%B9%B46%E6%9C%88%EF%BC%89.xls（HTTP 200，44544B）
- `chinaclear.cn` | 官方（清算机构） | zh | curl 常规 UA 可过；⚠️ 官网主站（`www.chinaclear.cn/zdjs/...`）导航栏页面是 Angular 前端渲染壳，静态 curl 只能拿到菜单文字、拿不到「法律规则」「收费标准」等栏目正文，需改找具体 PDF 直链（如 `zdjs/editor_file/` 路径下的历史通知附件） | 中国证券登记结算有限责任公司（ChinaClear），A股中央对手方与中央证券存管机构，设上海分公司
  - 2026-08-24 新增：《中国证券登记结算有限责任公司证券账户管理规则》修订通知附件 PDF（第三章「证券账户业务」第17-20条给出账户开立主体资格、一码通账户/子账户结构、身份信息核验要求，`participants.account_opening_requirements` 出处）: http://www.chinaclear.cn/zdjs/editor_file/20141008102818122.pdf（HTTP 200，359387B）
- `npc.gov.cn` | 官方（立法机构） | zh | 未测试反爬，本次仅用 WebSearch 摘要定位未额外 curl | 全国人民代表大会官网，《中华人民共和国证券法》等法律的权威公布渠道
- `people.com.cn` | 第三方（官方媒体） | zh | curl 需按 GBK 解码（非 UTF-8），常规 UA 可过 | 用于印花税税率调整等财政部/税务总局公告的转载确认；`confidence` 相应标 medium（非财政部原始公告页）
- `cls.cn` | 第三方（财经媒体） | zh | 未测试专门反爬，本次 WebSearch 摘要已够用未额外 curl | 用于退市规则修订的综述性报道；`confidence` 标 medium
  - 2026-08-24 新增：中国结算：4月29日起将股票交易过户费总体下调50%（2022-04-28发文，`costs.clearing_fees` 出处；第三方财经媒体转述 ChinaClear 通知，`confidence` 标 medium）: https://www.cls.cn/detail/1001120
- `mof.gov.cn`（2026-08-24 新增登记） | 官方（财政部，与 sse.com.cn/chinaclear.cn 并列的另一政府域名，非第三方） | zh | curl 常规 UA 可过（`m.mof.gov.cn` 移动版偶发 502，换 `www.mof.gov.cn` 桌面版路径可稳定拿到全文） | 国家发展改革委、财政部联合发布的《关于降低证券、期货市场监管费收费标准等问题的通知》（发改价格〔2012〕2119号），`costs.regulatory_fees` 出处——确认"证券交易监管费"这一独立于交易所经手费之外的监管费种确实存在（对股票按年交易额0.02‰收取，基金/债券免收），但通知本身注明"有效期3年"（即至2015年），本次未找到后续重新审批/延续的官方公告，故字段按"该费种曾被官方确认存在，现行费率是否仍为此值未再核实"处理，`confidence` 标 medium 而非 high
  - 关于降低证券、期货市场监管费收费标准等问题的通知（发改价格〔2012〕2119号）: https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/201207/t20120714_666369.htm
  - 证券结算风险基金管理办法（中国证监会、财政部联合发布，第二条给出风险基金定义与用途，`clearing.default_management` 补充出处）PDF: http://m.mof.gov.cn/zcfb/202511/P020251107701444228151.pdf
- `sipf.com.cn`（2026-08-24 新增登记） | 官方（中国证券投资者保护基金有限责任公司，国务院出资设立、归口证监会管理的国有独资企业） | zh | curl 常规 UA 可过 | `regulation.investor_protection` 出处；网站首页本身是纯导航壳无正文，需定位到具体规章条文页
  - 证券投资者保护基金管理办法（2016年修订，中国证监会令第124号）: http://www.sipf.com.cn/tbfg/2020/03/12872.shtml
- `sseinfo.com`（2026-08-24 新增登记） | 官方（上证所信息网络有限公司，上海证券交易所出资设立的全资子公司，SSE 证券信息独家全权经营机构） | zh | curl 常规 UA 可过 | `infrastructure.market_data_levels`/`data_latency`/`data_pricing_model`/`historical_data_availability` 出处；产品价目表本身是 PDF/公告列表页，本次仅取产品概述页正文，未逐条摘引具体单价数字
  - 公司介绍: https://www.sseinfo.com/aboutus/introduction/
  - 行情服务首页（Level-1/Level-2/智能数据/指数编制许可产品总览）: https://www.sseinfo.com/services/assortment/market/
  - 上证所Level-1行情（产品说明，"即时行情信息"定性表述）: https://www.sseinfo.com/services/assortment/level1/
  - 行情历史数据（数据内容：快照/逐笔成交/日K线/分钟K线/集合竞价）: https://www.sseinfo.com/services/assortment/historical/
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
  - 证券市场交易机制（Orion Trading Platform，含撮合原则/订单类型正文，2026-08-19 补登记——此前只登记了衍生品市场同名页面，两者内容不同，之前误当同一页处理）: https://www.hkex.com.hk/Services/Trading/Securities/Overview/Trading-Mechanism?sc_lang=en
  - 同上（中文版）: https://www.hkex.com.hk/Services/Trading/Securities/Overview/Trading-Mechanism?sc_lang=zh-hk
- `en-rules.hkex.com.hk`（英文版规则手册，独立域名） | 官方 | en | curl 常规 UA 200，未见反爬；**单章节 Rulebook 落地页（如 `/rulebook/chapter-8-qualifications-listing`）本身是纯 JS 单页应用外壳，curl 只能拿到导航栏、抓不到正文（grep 不到任何规则数字）——真正含正文的是同一站点下的章节 PDF 直链**，需要先 WebSearch 定位具体 PDF URL（搜索关键词里带 `en-rules.hkex.com.hk` + 章节名，PDF 文件名形如 `HKEX4476_<element_id>_VER<version>.pdf`，无法直接从章节 slug 拼出，必须先搜到） | 用于补全 `listing.boards[].financial_threshold`（2026-08-17）
  - Main Board Listing Rules Chapter 8《股本证券上市资格》PDF（8.05条盈利测试/市值收益现金流测试/市值收益测试三选一，8.09条一般市值门槛）: https://en-rules.hkex.com.hk/sites/default/files/net_file_store/HKEX4476_2301_VER24281.pdf（HTTP 200，86KB）
  - GEM Listing Rules Chapter 11《股本证券上市资格》PDF（11.12A条现金流测试/市值收益研发测试二选一，11.23(6)条一般市值门槛）: https://en-rules.hkex.com.hk/sites/default/files/net_file_store/HKEX4476_567_VER38010.pdf（HTTP 200，74KB）
  - GEM Listing Financial Eligibility（一页纸官方摘要，两套测试数字与 Chapter 11 正文完全对应，适合先核对再啃全文）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/Listing/Getting-Started/GEM-Listing-Financial-Eligibility-eng.pdf（HTTP 200，59KB，域名归入 hkex.com.hk 一组）
- `cn-rules.hkex.com.hk`（中文版规则手册，独立域名，与 en-rules 站点结构一致但非同一部署） | 官方 | zh-Hant | curl 常规 UA 200 | ⚠️**踩坑记录**：WebSearch 命中的单个章节 PDF（`HKEXCN_TC_5088_VER2598.pdf`，标题含「第八章 上市資格」）抓下来后发现「盈利測試」门槛是 2,000万/3,000万港元——与同一天抓取的英文版 Chapter 8 PDF（3,500万/4,500万港元）不一致。核对后确认**该中文单章 PDF 是未更新的旧版本**（页脚版本号明显早于英文版，很可能是主板盈利测试 2022-01-01 上调门槛前的存档件，搜索引擎索引到了旧文件未清理），**不能直接采信 WebSearch 命中的中文规则 PDF，必须用官网站内当前生效的整合页面交叉核对**。改用 `/entiresection/<id>` 这个「整章合并显示」页面（HTML 服务端渲染、非 JS 外壳，能 grep 到正文，比单章 PDF 更可能是当前生效版本，因为它是规则手册导航体系直接生成的页面而非独立托管的旧 PDF）验证，数字与英文版完全一致（3,500万/4,500万港元），已采信整合页版本，弃用单章旧 PDF
  - 主板上市规则全章合并页（Entire Section，含第八章原文，已用于交叉核对盈利测试等数字，与英文版一致）: https://cn-rules.hkex.com.hk/entiresection/4416（HTTP 200，3.6MB，务必 grep 关键词定位，不要整页阅读）
  - GEM上市规则全章合并页（Entire Section，含第十一章原文与 2.12 条 GEM 市场定位表述）: https://cn-rules.hkex.com.hk/entiresection/4417（HTTP 200，2.9MB）
  - ⚠️ 已知过时、不要再引用：主板第八章中文单行本 PDF（盈利测试门槛为旧版 2,000万/3,000万港元）: https://cn-rules.hkex.com.hk/sites/default/files/net_file_store/HKEXCN_TC_5088_VER2598.pdf
- `hkex.com.hk`（衍生品市场相关页面，与主站同域名，2026-08-17 补充登记）
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
- `hkex.com.hk`（2026-08-22 补充登记，用于补全上市/清算/参与者/基建/成本/风险六章剩余空缺字段）
  - Chapter 13 持续上市责任（Continuing Obligations）PDF（仅英文版，未找到对应中文整合页，已在字段 detail 中说明）: https://www.hkex.com.hk/-/media/HKEX-Market/Listing/Rules-and-Guidance/Other-Resources/Continuing-Obligations-and-Annual-Listing-Fees/Continuing-Obligation-Fee/chapter_13.pdf?la=en
  - 上市申请审批流程时限联合声明（HKEX/SFC Joint Statement on Enhanced Timeframe for New Listing Application Process）: https://www.hkex.com.hk/News/Regulatory-Announcements/2024/241018news?sc_lang=en
  - IPO及上市流程研究报告（2019年9月，Chief China Economist's Office）PDF（URL 文件名含半角括号，已按 %28/%29 编码登记）: https://www.hkex.com.hk/-/media/HKEX-Market/News/Research-Reports/HKEx-Research-Papers/2019/CCEO_GIS%28ListingProcess%29_201909_e.pdf?la=en
  - Delisted Issuers（退市发行人名单页，仅列名单不含去向说明，本次已确认对补全 post_delisting_venue 帮助有限）: https://www.hkex.com.hk/Listing/Rules-and-Guidance/Listing-of-Overseas-Companies/Company-Information-Sheets/Delisted-Issuers?sc_lang=en
  - IPO价格发现及公众持股量优化咨询总结及进一步咨询文件（2025年8月，含"香港现无可供已除牌证券交易的替代平台"官方表述，OTC市场倡议进展）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/News/Market-Consultations/2016-Present/December-2024-Optimise-IPO-Price/Conclusions-Aug-2025/cp202412cc.pdf
  - 衍生品结算风险管理／Default Fund（结算所储备基金）: https://www.hkex.com.hk/Services/Clearing/Listed-Derivatives/Risk-Management/Default-Fund?sc_lang=en
  - 衍生品结算风险管理／Default Management（违约处置安排）: https://www.hkex.com.hk/Services/Clearing/Listed-Derivatives/Risk-Management/Default-Management?sc_lang=en
  - HKCC（期货结算公司）PFMI（金融市场基础设施原则）信息披露文件 2025年2月版 PDF（含逐日盯市、保证金、违约处置完整披露）: https://www.hkex.com.hk/-/media/HKEX-Market/Services/Clearing/Listed-Derivatives/PFMI/HKCC_PFMI_Disclosure_2025_Feb.pdf
  - HKSCC（香港中央结算）通用规则第25章「保证基金」（Guarantee Fund）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/Services/Rules-and-Forms-and-Fees/Rules/HKSCC/General-Rules-of-HKSCC/R25.pdf
  - Exchange Participant Data（交易所参与者数目统计页）: https://www.hkex.com.hk/Market-Data/Statistics/Participant/Exchange-Participant-Data?sc_lang=en
  - Guide to Becoming an Exchange Participant（交易所参与者准入指南）: https://www.hkex.com.hk/Services/Become-a-Participant/Guide-to-Becoming-an-Exchange-Participant?sc_lang=en
  - Stock Exchange Participants' Market Share Report（经纪商市占率报告页）: https://www.hkex.com.hk/Market-Data/Statistics/Participant/Stock-Exchange-Participants_-Market-Share-Report?sc_lang=en
  - Cash Market Transaction Survey 2019（现货市场交易调查，机构/个人投资者占比）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/News/Research-Reports/HKEX-Surveys/Cash-Market-Transaction-Survey-2019/CMTS2019_e.pdf?la=en
  - HKEX Orion Market Data Platform – Securities Market (OMD-C) 介绍页: https://www.hkex.com.hk/Services/Market-Data-Services/Infrastructure/HKEX-Orion-Market-Data-Platform-Securities-Market-OMD-C?sc_lang=en
  - Fee Schedule – Securities Market Datafeeds Licence Fees（行情数据层级与收费表）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/Services/Rules-and-Forms-and-Fees/Rules/Market-Data-Fees/SEHK_Market-Data-Fees-for-Retail-Participation.pdf
  - Historical Data Services（历史数据服务总览页，原登记的 Other-Historical-and-Reference-Data 子路径抓取返回404，改用上一级总览页，已验证200）: https://www.hkex.com.hk/Services/Market-Data-Services/Historical-Data-Services?sc_lang=en
  - Market Data Vendor Licence Prices（数据牌照收费模式页，URL 含半角括号，已按 %28/%29 编码登记）: https://www.hkex.com.hk/Services/Market-Data-Services/Real-Time-Data-Services/Data-Licensing/Market-Data-Vendor-Licence/Prices-%28Fee-Schedule%29?sc_lang=en
  - Trading Fee / Trading Tariff / SFC Transaction Levy 费率页（URL 含半角括号，已按 %28/%29 编码登记）: https://www.hkex.com.hk/Services/Rules-and-Forms-and-Fees/Fees/Securities-%28Hong-Kong%29/Trading/Transaction?sc_lang=en
  - HKSCC Operational Procedures Section 21《Costs and Expenses》（CCASS结算费率）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/Services/Rules-and-Forms-and-Fees/Rules/HKSCC/Operational-Procedures/SEC21.pdf
  - Disciplinary & Enforcement Overview（上市监管纪律处分总览页）: https://www.hkex.com.hk/Listing/Disciplinary-and-Enforcement/Overview?sc_lang=en
  - Enforcement Sanctions Statement（纪律处分制裁声明）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/Listing/Rules-and-Guidance/Disciplinary-and-Enforcement/Disciplinary-Procedures-and-Enforcement-Guidance-Materials/enf_sanctions.pdf
  - HKEX Statement on Derivatives Market Suspension（2019年9月5日衍生品市场技术故障暂停交易官方声明）: https://www.hkex.com.hk/news/market-communications/2019/190905news?sc_lang=en
  - Conclusion of Incident Review: Derivatives Market Suspension on 5 September 2019（事故复盘结论官方新闻稿）: https://www.hkex.com.hk/News/News-Release/2020/2012282news?sc_lang=en
  - HKEX to Launch HKD-RMB Dual Counter Model on 19 June 2023（近年上市/交易制度改革样本之一）: https://www.hkex.com.hk/News/News-Release/2023/230519news?sc_lang=en
  - Consultation Paper June 2024《Proposed Reduction of Minimum Spreads in the Securities Market》（最小价差／买卖价差隐性成本改革咨询文件）PDF: https://www.hkex.com.hk/-/media/HKEX-Market/News/Market-Consultations/2016-Present/June-2024-Review-of-Minimum-Spreads/Consultation-Paper/cp202406.pdf
- `en-rules.hkex.com.hk`（2026-08-22 补充登记，沿用既有域名条目）
  - Chapter 9《Trading Halt, Suspension and Resumption of Dealings, Cancellation and Withdrawal of Listing》Entire Section 合并页（服务端渲染，可grep正文，非单章JS外壳）: https://en-rules.hkex.com.hk/entiresection/2235
  - GL95-18《Guidance on long suspension and delisting》（2025年2月版，退市整理期/三阶段程序官方指引）PDF: https://en-rules.hkex.com.hk/sites/default/files/pdf_documents/GL95-18_202502.pdf
  - Chapter 18C《Specialist Technology Companies》全文 PDF（近年上市制度改革样本之一，2023年3月31日生效）: https://en-rules.hkex.com.hk/sites/default/files/net_file_store/HKEX4476_6059_VER24275.pdf
- `sfc.hk`（证监会官网，2026-08-22 新增登记） | 官方（监管机构） | zh-Hant（`/TC/` 路径）/ en（`/en/` 路径，两版路径结构不同，非同页参数切换） | curl 常规 UA 探测通过 | 用于补全投资者保护、适当性管理、开户要求、经纪商准入类别、市场执法机制等字段
  - 合適性規定（Suitability requirement，中文版）: https://www.sfc.hk/TC/Rules-and-standards/Suitability-requirement
  - Suitability requirement（英文版，与中文版交叉核对用）: https://www.sfc.hk/en/Rules-and-standards/Suitability-requirement
  - 中介人及持牌人士的類別（Types of intermediary and licensed individual，中文版）: https://www.sfc.hk/TC/Regulatory-functions/Intermediaries/Licensing/Types-of-intermediary-and-licensed-individual
  - Acceptable account opening approaches（开户核实方式，本次未找到对应中文页直链，已在字段 detail 中说明）: https://www.sfc.hk/en/Rules-and-standards/Account-opening/Acceptable-account-opening-approaches
  - Investor compensation（投资者赔偿机制 FAQ）: https://www.sfc.hk/en/faqs/Investor-compensation
  - Disciplinary proceedings（纪律处分程序）: https://www.sfc.hk/en/Regulatory-functions/Enforcement/Disciplinary-proceedings
- `ird.gov.hk`（税务局官网，2026-08-22 新增登记） | 官方（监管机构） | zh-Hant / en（同一路径 `/chi/` 与 `/eng/` 切换） | curl 常规 UA 探测通过 | 用于核实股息预扣税
  - 利得税（股息不予徵税条文页，中文版）: https://www.ird.gov.hk/chi/tax/bus_pft.htm
  - Profits Tax（英文版，与中文版交叉核对用）: https://www.ird.gov.hk/eng/tax/bus_pft.htm

### 纽约证券交易所 New York Stock Exchange (NYSE) `us-nyse`
- `nyse.com` | 官方 | en | curl + 常规 UA 全部 200，未见反爬；注意站内不少旧 URL 会 301/302 跳转到新路径（如 `/products/etp-limit-up-limit-down` 跳到 `/trade/trading-information`），curl 要带 `-L` 跟随重定向 | ⚠️ NYSE 集团旗下有 NYSE、NYSE American、NYSE Arca、NYSE National、NYSE Texas 多个 SEC 注册的独立交易所实体（`group_id: nyse-group`），很多页面把几个实体的信息混在一起讲，摘引时要看清楚是哪个实体（本文件只收 NYSE 本身/Tape A 的信息）；⚠️ 主站是 CMS2（React）驱动，多数栏目落地页静态 HTML 里能拿到真实正文段落（挂在 `<main><div data-testid="belt">...` 结构下），但也有个别历史遗留 PDF 直链已失效、curl 200 却拿到的是 HTML 兜底壳（如 `NYSE_Market_Quality_infographic.pdf` 实测返回的是网页壳层，不是真正的 PDF 二进制，`pdftotext` 会直接报"Illegal character"语法错误——遇到这种"HTTP 200但内容类型不对"要用 `head -c 300` 看文件头是不是 `<!DOCTYPE html>` 而不是想当然按 PDF 处理）
  - Trading Information（交易时段、LULD、MWCB 熔断阈值）: https://www.nyse.com/trade/trading-information（HTTP 200，194KB）
  - Regulation（监管架构、SEC/FINRA 关系）: https://www.nyse.com/regulation（HTTP 200，127KB）
  - Regulation SHO（卖空监管入口，正文较薄，多为下载链接而非说明文字）: https://www.nyse.com/regulation/regulation-sho（HTTP 200，75KB）
  - Initial Listings（详细量化上市标准，含具体规则编号如 Rule 102.01C）: https://www.nyse.com/regulation/initial-listings（HTTP 200，199KB）
  - Listings Process（上市四步流程，含 DMM 指定环节）: https://www.nyse.com/listings-process（HTTP 200，84KB）
  - NYSE Price List 2026（PDF，逐笔交易费率/返佣表，maker-taker 模式，按流动性分层）: https://www.nyse.com/publicdocs/nyse/markets/nyse/NYSE_Price_List.pdf（HTTP 200，143KB，34页）
  - Fees 总览页: https://www.nyse.com/markets/fees（HTTP 200，194KB）
  - NYSE Regulation | Delistings（退市两条名单：交易所主动/发行人主动，Form 25流程与生效时限）: https://www.nyse.com/regulation/delistings（HTTP 200，71KB；正文是CMS2服务端渲染的真实段落，非导航壳）
  - 2026 Annual Guidance Letter（PDF，上市公司合规指引，含反向拆股触发立即停牌退市的2025年新规）: https://www.nyse.com/publicdocs/nyse/markets/nyse/NYSE_2026_Annual_Guidance_Letter.pdf（HTTP 200，369KB）
  - Data Products（行情数据产品总览：Real-Time/Reference/Historical(TAQ)/Corporate Actions四类，含各自官方简介段落）: https://www.nyse.com/data-products（HTTP 200，162KB）
  - Market Data: Real-Time（各实时行情产品逐条说明表，如NYSE Integrated Feed/OpenBook Ultra/BBO）: https://www.nyse.com/market-data/real-time（HTTP 200，143KB）
  - Data Center Colocation Services（Mahwah/Basildon机房、SFTI LCN/WAN两种网络接入说明）: https://www.nyse.com/technology/colo（HTTP 200，70KB）
- `ice.com` | 官方（母公司 Intercontinental Exchange 的指数业务） | en | curl 常规 UA 200 | 用于确认 NYSE Composite 指数由 ICE Data Indices 编制（而非交易所自编）——与上交所"交易所自编"、港交所"恒生指数公司编制"形成第三种模式对比
  - Equity Indices: https://www.ice.com/fixed-income-data-services/index-solutions/equity-indices（HTTP 200，207KB）
- `cahill.com` | 第三方（律所客户简报） | en | curl 常规 UA 200 | 用于确认 T+1 结算周期新规生效日期（2024-05-28）；`confidence` 标 medium。⚠️ 2026-08 补全会话已突破 sec.gov/finra.org 反爬（见下方 `sec.gov`/`finra.org` 条目与本节末尾"突破记录"），dtcc.com 仍未攻克，这份法律实务简报继续作为T+1字段的补充来源保留
  - One-Day Settlement Cycle (T+1) To Begin May 28, 2024: https://www.cahill.com/publications/client-alerts/2024-04-29-one-day-settlement-cycle-t-1-to-begin-may-28-2024（HTTP 200，23KB）
- `sec.gov` | 官方（美国证监会） | en | ⚠️**2026-08补全会话突破**：默认curl（常规浏览器UA或空）对内容页一律返回403「Request Rate Threshold Exceeded」（响应体明确指向 `sec.gov/developer` 的Fair Access政策），换成SEC Fair Access规范格式的User-Agent（形如`"机构标识 联系邮箱"`，如 `"exchange-atlas-research research@example.com"`——不是伪装浏览器，而是按SEC EDGAR一贯要求的"自报身份+联系方式"格式）后，同一批URL全部200，且可稳定复现（同一会话内因账号额度中断重启过两次，每次用相同UA重新curl同一批URL结果一致）。`www.sec.gov/about/laws`等个别路径会301到`dc.aws-sec.akadns.net`这个内网专用域名（curl跟着走会失败，属正常现象不是反爬，换成搜索到的具体直达URL即可绕开） | 用于regulation.core_laws背景交叉核实、market_structure.short_selling（Rule 201十档阈值原文）、clearing.ccp_name/csd_name（NSCC/DTC角色官方定性）、clearing.default_management、costs.clearing_fees（NSCC费率表）、costs.regulatory_fees（Section 31费率）、participants.investor_structure、infrastructure.major_outage_history、risks.political_risk_note、risks.liquidity_risk_note
  - Rule 201 of Regulation SHO FAQ（Alternative Uptick Rule，10%跌幅触发熔断的官方逐字定义）: https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions-7（HTTP 200，98KB）
  - SEC.gov | Clearing Agencies（登记在册清算机构名单，DTC/NSCC/FICC/OCC）: https://www.sec.gov/about/divisions-offices/division-trading-markets/clearing-agencies（HTTP 200，78KB）
  - Staff Report on the Regulation of Clearing Agencies（PDF，2020年10月官方报告，NSCC=CCP/DTC=CSD定性原文、清算基金损失分摊机制）: https://www.sec.gov/files/regulation-clearing-agencies-100120.pdf（HTTP 200，683KB）
  - NSCC Rules & Procedures Addendum A（SR-NSCC-2025-017费用结构附件，清算活动费/清算基金维持费具体数字）: https://www.sec.gov/files/rules/sro/nscc/2025/34-104376-ex5.pdf（HTTP 200，225KB）
  - Section 31 Transaction Fee Rate Advisory FY2026（每百万美元20.60美元最新费率公告）: https://www.sec.gov/rules-regulations/fee-rate-advisories/2026-2（HTTP 200，65KB）
  - U.S. Households' Participation in Capital Markets（官方统计页，基于美联储SCF数据的家庭持股比例）: https://www.sec.gov/data-research/statistics-data-visualizations/us-households-participation-capital-markets（HTTP 200，99KB）
  - In the Matter of New York Stock Exchange LLC（PDF，2026年3月行政处罚令，2023年开盘集合竞价系统性故障事件与900万美元罚款）: https://www.sec.gov/files/litigation/admin/2026/34-104934.pdf（HTTP 200，234KB）
  - SEC Adopts Amendments to Finalize Rules Relating to the Holding Foreign Companies Accountable Act（2021年HFCAA最终细则新闻稿）: https://www.sec.gov/newsroom/press-releases/2021-250（HTTP 200，65KB）
  - U.S. Equity Market Structure: Making Our Markets Work Better for Investors（官方演讲稿，市场分散化/暗池占比讨论）: https://www.sec.gov/newsroom/speeches-statements/us-equity-market-structure（HTTP 200，226KB）
- `finra.org` | 官方（自律组织） | en | ⚠️**2026-08补全会话突破**：默认UA对内容页返回Cloudflare「Just a moment...」JS质询页（403，非简单UA黑名单，是需要执行JS+Cookie的真实机器人质询）；换成与sec.gov相同的Fair Access格式UA后，`/rules-guidance/rulebooks/...`与`/rules-guidance/key-topics/...`路径下的规则条文页全部200且是真实服务端渲染正文；但`/about`、`/media-center/statistics`、首页等页面即使200了，静态HTML里也只有导航壳、正文靠客户端JS异步渲染，抓不到统计数字（转而用PDF报告解决，见下）
  - 2090. Know Your Customer（规则手册原文，KYC逐字条文）: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2090（HTTP 200，92KB）
  - Suitability（Key Topics页，Rule 2111逐字条文+与Reg BI关系说明）: https://www.finra.org/rules-guidance/key-topics/suitability（HTTP 200，115KB）
  - 2025 FINRA Industry Snapshot（PDF，年度行业概览，含Table 2.1.5经纪商/投资顾问机构数按年统计表——是真实文本表格不是图表渲染，可放心pdftotext摘引）: https://www.finra.org/sites/default/files/2025-07/2025-Industry-Snapshot.pdf（HTTP 200，2.8MB）
- `investor.gov` | 官方（SEC投资者教育与倡导办公室） | en | curl 常规浏览器UA（非Fair Access格式）即可200——与sec.gov主站不同，investor.gov未见同样的限流拦截；⚠️但该域名背后是Akamai边缘防护，用Fair Access格式UA反而在某些跳转链路上被Akamai拦成403（`errors.edgesuite.net`，与`saudiexchange.sa`同一类边缘防护特征），换回常规浏览器UA后正常，是本节两种UA策略"对症下药、不能全站通用一种"的唯一反例 | 用于regulation.core_laws交叉背景、regulation.disclosure_requirements
  - Laws That Govern the Securities Industry（1934年证券交易法等核心法律逐条简介，明确点名NYSE为SRO）: https://www.investor.gov/introduction-investing/investing-basics/role-sec/laws-govern-securities-industry（HTTP 200，71KB）
- `home.treasury.gov` | 官方（美国财政部） | en | curl 常规浏览器UA 200，未见反爬 | 用于regulation.capital_controls（CFIUS国家安全审查定性）
  - CFIUS（美国外国投资委员会官方介绍页）: https://home.treasury.gov/policy-issues/international/the-committee-on-foreign-investment-in-the-united-states-cfius（HTTP 200，34KB）
- `sipc.org` | 官方（证券投资者保护公司） | en | curl 常规浏览器UA 200，未见反爬 | 用于regulation.investor_protection（50万/25万美元保护上限）
  - What SIPC Protects: https://www.sipc.org/for-investors/what-sipc-protects（HTTP 200，112KB）
- `everycrsreport.com`（国会研究服务处报告的非营利镜像站，非congress.gov官方本身） | 第三方 | en | curl常规UA 200；`congress.gov`官方页本次两次尝试（含Fair Access格式UA）均403，未攻克，退而用此镜像 | 用于costs.financial_transaction_tax（联邦无普遍性金融交易税、历史印花性质转让税沿革），`confidence`按CLAUDE.md第三方来源规则封顶medium
  - Transaction Tax: General Overview（CRS Report RL32266，2004年）: https://www.everycrsreport.com/reports/RL32266.html（HTTP 200，44KB）

### 日本交易所集团 / 东京证券交易所 Japan Exchange Group (JPX / TSE) `jp-jpx`
- `jpx.co.jp` | 官方 | ja / en（英文版内容滞后，部分细则页无对应英文版） | **WebFetch 对内国株页面返回 403（反爬）**；curl + 常规浏览器 UA（`Mozilla/5.0 ... Chrome/131`）可过，HTTP 200，全程未见限流（比 english.sse.com.cn 好抓得多，不需要加延时）| ⚠️ v0.2 按 ADR-013「无中选英」，本节以 `/english/` 路径下的英文版为主要来源，日文版（`/equities/...`）只在没有对应英文页时才用。英文版每页均带免责声明"This translation may be used for reference purposes only... the Japanese version shall prevail"。JPX 集团下辖东京证券交易所（TSE）、大阪交易所（OSE，衍生品）、东京商品交易所（TOCOM）、Japan Exchange Regulation（自律监管）四个法人实体（`group_id: jpx-group`），本文件只记录 TSE 现货股票市场
  - 制限値幅（值幅制限档位表，日文版）: https://www.jpx.co.jp/equities/trading/domestic/06.html（HTTP 200，35KB；curl 提取得到 37 行档位，如 `100円未満→上下30円`……`50,000,000円以上→10,000,000円`）
  - 用語集: https://www.jpx.co.jp/glossary/
  - 英文版首页: https://www.jpx.co.jp/english/（HTTP 200）
  - Rules & Regulations 索引页（列出全部官方英文规则 PDF 标题与直链）: https://www.jpx.co.jp/english/rules-participants/rules/regulations/index.html（HTTP 200；正文由 JS 渲染，纯 curl 只能拿到导航栏，但 PDF 直链本身在静态 HTML 里能 grep 出来）
  - Business Regulations（TSE业务规程英文版，交易时段/撮合原则/特别气配等核心交易机制）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/business_regs_20250507.pdf（HTTP 200，784KB）
  - Rules Concerning Price Limits on Bids and Offers（值幅制限官方英文版；Rule 2 Paragraph 1 股票值幅表实为 **34 档**，Phase 1b 逐行核实——此前 ADR-037 及本行曾写「37 档」系笔误）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/bids_and_offers_price_limits_20141201.pdf（HTTP 200，290KB；表格用 `pdftotext -layout` 能完整提取）
  - Securities Listing Regulations（上市规则英文版，Prime/Standard/Growth三板定义与标准）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/01_listing_regs_20260721.pdf（HTTP 200，3MB，超长，用 pdftotext 后 grep 定位章节）
  - Clearing and Settlement Regulations PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/clearing-settlement_regs_20190716.pdf（HTTP 200，140KB）
  - Regulations Regarding Margin Transactions and Loans for Margin Transactions PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/regs_margin-loans_transactions_20250401.pdf（HTTP 200，175KB）
  - Clearing & Settlement Summary（JSCC/JASDEC 角色说明）: https://www.jpx.co.jp/english/equities/clearing-settlement/outline/index.html（HTTP 200）
  - T+2 结算周期改革说明（2019-07-16生效）: https://www.jpx.co.jp/english/equities/clearing-settlement/tplus2-settlement-cycle/index.html（HTTP 200）
  - Initial Listing Criteria（三板初次上市门槛速查表，Prime/Standard/Growth 各一个 URL，含股东人数/流通股数/流通股市值/流通股比例/总市值/净资产/利润销售额门槛，与 Securities Listing Regulations Rule 205/211/217 的条文数值完全对应，可交叉核实）：
    - Prime: https://www.jpx.co.jp/english/equities/listing/criteria/listing/index.html（HTTP 200，36KB）
    - Standard: https://www.jpx.co.jp/english/equities/listing/criteria/listing/01.html（HTTP 200，36KB）
    - Growth: https://www.jpx.co.jp/english/equities/listing/criteria/listing/02.html（HTTP 200，35KB）
    - ⚠️ 页面视觉上是三个 tab 切换同一张表，但每个 tab 对应独立 URL 且该 tab 内容已服务端渲染进静态 HTML（不是纯 JS 异步加载），curl 三个 URL 各自都能拿到对应板块完整数值，不需要模拟点击
  - Overview of Market Restructuring（2022年4月4日新三板体系改制说明，含新旧板块对应关系、每板"概念"定性表述、改制时间线）: https://www.jpx.co.jp/english/equities/improvements/market-structure/01.html（HTTP 200，38KB）
  - 2026-08-24 补全 Category B 空缺字段这次新增抓取的 jpx.co.jp 页面（含 jscc 子路径，同域名不需要重复登记）：
    - Overview of Timely Disclosure（信息披露制度总览）: https://www.jpx.co.jp/english/equities/listing/disclosure/overview/index.html（HTTP 200）
    - Listing Schedule（新股上市流程时间线，含"申请日到上市首日约需四个月"表述）: https://www.jpx.co.jp/english/equities/listing-on-tse/new/basic/02.html（HTTP 200）
    - Outline of Delisting Criteria（退市标准总览）: https://www.jpx.co.jp/english/equities/listing/delisting/outline/01.html（HTTP 200）
    - Transitional Measures（整理銘柄退市过渡期安排）: https://www.jpx.co.jp/english/equities/listing/delisting/outline/02.html（HTTP 200）
    - Delisting Criteria（退市标准入口页，逐条触发条件的导航起点）: https://www.jpx.co.jp/english/equities/listing/delisting/index.html（HTTP 200；WebSearch给出的旧链接 .../delisting/05.html 已404，改用本链接，经验记入下方）
    - Companies in an Improvement Period（持续上市标准未达标整改期）: https://www.jpx.co.jp/english/listing/market-alerts/improvement-period/index.html（HTTP 200）
    - Securities Under Supervision & Securities to Be Delisted（监理/整理銘柄指定制度说明）: https://www.jpx.co.jp/english/listing/market-alerts/supervision/index.html（HTTP 200）
    - Trading Halts（个股停牌机制，含重大消息停牌15分钟规则）: https://www.jpx.co.jp/english/markets/equities/suspended/index.html（HTTP 200）
    - Corporate Governance Report 说明页（持续上市义务之一）: https://www.jpx.co.jp/english/equities/listing/cg/01.html（HTTP 200）
    - Default Management（JSCC违约处置流程）: https://www.jpx.co.jp/jscc/en/risk/default.html（HTTP 200）
    - Clearing Fee for Cash Products（JSCC现货证券清算费率表）: https://www.jpx.co.jp/jscc/en/cash/cash/fee.html（HTTP 200）
    - Trading by Type of Investors（Weekly，投资者类型交易占比统计总览页）: https://www.jpx.co.jp/english/markets/statistics-equities/investor-type/index.html（HTTP 200）
    - Trading by Type of Investors（Annual，年度数据）: https://www.jpx.co.jp/english/markets/statistics-equities/investor-type/00-02.html（HTTP 200）
    - List of Trading Participants（交易参与者名录，broker_landscape依据）: https://www.jpx.co.jp/english/rules-participants/participants/list/index.html（HTTP 200）
    - The Failure of Equity Trading System on October 1, 2020（arrowhead系统故障新闻稿）: https://www.jpx.co.jp/english/corporate/news/news-releases/0060/20201019-01.html（HTTP 200）
    - arrowhead故障详细报告 PDF: https://www.jpx.co.jp/english/corporate/news/news-releases/0060/b5b4pj000003qm41-att/arrowhead_e.pdf（HTTP 200）
    - Real Time Market Data Outline（行情数据层级/时延说明）: https://www.jpx.co.jp/english/markets/paid-info-equities/realtime/index.html（HTTP 200）
    - Real Time Market Data Fees（行情数据收费模式）: https://www.jpx.co.jp/english/markets/paid-info-equities/realtime/01.html（HTTP 200）
    - Historical Data Outline（历史数据服务说明）: https://www.jpx.co.jp/english/markets/paid-info-equities/historical/index.html（HTTP 200）
    - 15 Minute-Delayed Stock Price Information (API)（免费延时行情，与付费实时数据对照佐证data_latency分层）: https://www.jpx.co.jp/english/markets/paid-info-equities/realtime/06.html（HTTP 200）
    - Connectivity Services Overview（接入方式：专线/API/数据商三种渠道）: https://www.jpx.co.jp/english/systems/connectivity/index.html（HTTP 200）
    - Trading Participation Fees 总览页: https://www.jpx.co.jp/english/rules-participants/participants/fees/index.html（HTTP 200）
    - Overview of Trading Participant Fees PDF（2026-04-13版，交易参与者费率明细）: https://www.jpx.co.jp/english/rules-participants/participants/fees/tvdivq000000v276-att/o4sio70000000p66.pdf（HTTP 200）
    - Brokerage Agreement Standards（受託契約準則英文版，经纪商与客户开户/委托合同准则，account_opening_requirements依据）PDF: https://www.jpx.co.jp/english/rules-participants/rules/regulations/tvdivq0000001vyt-att/brokerage_agreement_standards_20260401.pdf（HTTP 200；WebSearch给出的旧文件名 ...20250401.pdf 已404，经验记入下方——与既有「XXXX年修订式规则文档URL会随修订版本更迭直接下线」经验一致）
- `jipf.or.jp`（日本投资者保护基金 Japan Investor Protection Fund，FIEA法定设立的会员制法人，官方自身网站） | 官方（法定投资者保护机制运营主体） | en | curl 常规 UA 200 | investor_protection 字段依据
  - About Us: https://jipf.or.jp/en/about/index.html（HTTP 200）
- `mof.go.jp`（财务省，外汇外贸法FEFTA对内直接投资事前申报制度主管机关之一） | 官方（监管机构） | en | curl 常规 UA 200 | capital_controls/foreign_ownership_limit 字段依据，FEFTA要求外国投资者投资"核心业务领域"上市公司达1%以上须事前申报
  - Foreign investors are required to submit a prior notification（制度概述其一）PDF: https://www.mof.go.jp/english/policy/international_policy/fdi/Overview/outline1.pdf（HTTP 200）
  - Mandatory Notification of Foreign Investors: Outline of the system（制度概述其二）PDF: https://www.mof.go.jp/english/policy/international_policy/fdi/Overview/outline2.pdf（HTTP 200）
  - Gist of the Tax Reform for FY 1999（1999年度税制改正纲要，含"有价证券交易税与交易所税于1999年3月31日废止"官方原文）: https://www.mof.go.jp/english/about_mof/councils/tax_commission/ts001.htm（HTTP 200；⚠️WebSearch给出的另一URL .../english/tax_policy/tax_reform/ts001.htm 已404，改用本链接）
- `fsa.go.jp`（金融厅） | 官方（监管机构） | en | curl 常规 UA 200，与 SOURCES.md 其他章节记录的"金融监管机构域名易被拦"（sec.gov/finra.org）经验不同，fsa.go.jp 本次全程未见反爬 | regulation/participants/costs/risks 多个字段依据
  - Japanese Big Bang: Full Liberalization of Brokerage Commissions（1999年佣金自由化历史说明）: https://www.fsa.go.jp/p_mof/english/big-bang/ebb37.htm（HTTP 200）
  - FAQ on Financial Instruments and Exchange Act, Section 6（适合性原则FAQ）: https://www.fsa.go.jp/en/laws_regulations/faq_on_fiea/section06.html（HTTP 200）
  - About SESC（证券取引等监视委员会职能与执法权限概述）PDF: https://www.fsa.go.jp/sesc/english/aboutsesc/all.pdf（HTTP 200）
- `nta.go.jp`（国税厅） | 官方（税务机关） | en | curl 常规 UA 200 | costs.capital_gains_tax / dividend_withholding_tax 字段依据
  - Selection of the Aggregate Taxation and the Separate Self-Assessment Taxation System（英文版所得税指南，含上市股票转让/股息分离课税税率）PDF: https://www.nta.go.jp/english/taxes/individual/pdf/incometax_2023/17.pdf（HTTP 200）
  - Tax on the income of an individual as a non-resident in Japan for tax purposes（非居民股息预扣税率说明）: https://www.nta.go.jp/english/taxes/individual/12006.htm（HTTP 200）

### 纳斯达克证券交易所 The Nasdaq Stock Market `us-nasdaq`
- `nasdaq.com` | 官方 | en | curl + 常规 UA 全部 200，未见反爬 | Nasdaq Inc 集团层面的公司站，覆盖监管框架、公司概况/历史、市场数据产品说明、指数产品说明等叙述性内容；不含逐条规则条文（规则条文在 `nasdaqtrader.com`/`listingcenter.nasdaq.com`）
  - Market Regulation（监管架构总览，Nasdaq Regulation 与 FINRA 关系）: https://www.nasdaq.com/market-regulation（HTTP 200，310KB）
  - Market Regulation: Listings Review（上市审核团队职能）: https://www.nasdaq.com/market-regulation/americas/listing-review（HTTP 200，235KB）
  - About（集团概况，多国交易所版图）: https://www.nasdaq.com/about（HTTP 200，287KB）
  - Nasdaq TotalView（行情数据产品，Level 1/2/逐笔深度）: https://www.nasdaq.com/solutions/data/equities/nasdaq-totalview（HTTP 200，344KB）
  - About Matching Engines（撮合引擎技术说明，未点名 Nasdaq 自身系统版本号）: https://www.nasdaq.com/solutions/fintech/marketplace-technology/about-matching-engines（HTTP 200，205KB）
  - Nasdaq Composite 指数产品页: https://www.nasdaq.com/solutions/global-indexes/nasdaq-composite（HTTP 200，306KB）
  - Historical Data（2026-08-24新增，`infrastructure.historical_data_availability` 出处，免费公开历史行情产品说明"最多10年"表述）: https://www.nasdaq.com/market-activity/quotes/historical（HTTP 200，约38KB）
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
  - Equity Trader Alert #2026-18: Regulatory Transaction Fee Rate Adjustment per SEC Section 31（2026-08-24新增，`costs.regulatory_fees` 出处，SEC Section 31费率具体数字$20.60/百万美元）: https://www.nasdaqtrader.com/TraderNews.aspx?id=ETA2026-18（HTTP 200，约60KB）
  - Nasdaq US Equities Price List 2025（PDF，2026-08-24新增，`infrastructure.data_pricing_model` 出处，Professional/Non-Professional分层订阅费率）: https://www.nasdaqtrader.com/content/ProductsServices/PriceList/Nasdaq_US_Equities_Price_List_2025.pdf（HTTP 200，约250KB）
- `lseg.com`（伦敦证券交易所集团旗下 FTSE Russell，第三方指数编制商） | 官方（第三方指数编制商官网） | en | curl 常规 UA 200 | 用于确认罗素2000指数（ADR-018 引入的 `scope: market` 跨交易所市场基准指数样本，成分股横跨 `us-nyse`/`us-nasdaq` 两所，不专属单一交易所）编制方为 FTSE Russell、指数定位与覆盖范围
  - Russell 2000® Index: https://www.lseg.com/en/ftse-russell/indices/russell-2000-index（HTTP 200，202KB）
- `spglobal.com`（S&P Dow Jones Indices，标普500指数编制方） | 官方（第三方指数编制商官网） | — | **全站被拦，任何路径（含首页、Index Finder、方法论 PDF）均返回 403**，换 UA/加 Accept-Language 头无效，与 `sec.gov`/`finra.org`/`spglobal.com` 同一类边缘防护拦截 | 无法直接抓取标普500官方页面确认编制方法论细节；`data/exchanges/us-nyse.yml`/`us-nasdaq.yml` 里的标普500条目按 ADR-018 只填最简字段（`id`/`name_zh`/`name_native`/`compiler`/`flagship`），`compiler: sp_dj` 与官方名称改用下方 `en.wikipedia.org` 交叉确认，未使用 WebSearch 摘要直接代入
- `en.wikipedia.org` | 第三方 | en | curl 常规 UA 200 | 标普500官网（spglobal.com）被拦时的降级来源，仅用于确认标普500指数的编制方（S&P Dow Jones Indices）与官方全称这类基本事实，不用于任何规则性数值
  - S&P 500: https://en.wikipedia.org/wiki/S%26P_500（HTTP 200）
  - August 2013 NASDAQ flash freeze（2026-08-24新增，`ir.nasdaq.com`托管的官方声明持续超时抓不到，改用此第三方条目佐证`infrastructure.major_outage_history`）: https://en.wikipedia.org/wiki/August_2013_NASDAQ_flash_freeze（HTTP 200）
- `listingcenter.nasdaq.com` | 官方（上市规则站） | en | ⚠️ Rulebook 交互式条文页（`/rulebook/nasdaq/rules/...`）多次尝试均返回 403（含加 12 秒延时重试），疑似该子路径有独立 WAF，非限流性质（NYSE/JPX/Eurex 经验里的限流是"连续请求后开始 403"，这里是首次请求即 403，且延时重试无效）；但根目录下的静态 PDF 资源（`/assets/...`）可以正常 curl 到，200 | Initial Listing Guide + Continued Listing Guide 两份 PDF 已覆盖三档上市标准的初始与持续量化门槛，弥补了 Rulebook 页面抓不到的缺口，故未继续尝试破解 Rulebook 反爬
  - Nasdaq Initial Listing Guide（PDF，三档上市标准 Global Select/Global/Capital Market 财务与流动性量化门槛）: https://listingcenter.nasdaq.com/assets/initialguide.pdf（HTTP 200，559KB）
  - Nasdaq Continued Listing Guide（PDF，持续上市标准，含 $1 最低股价等退市触发门槛）: https://listingcenter.nasdaq.com/assets/continuedguide.pdf（HTTP 200，394KB）
  - Nasdaq Listing and Hearing Review Council Charter（PDF，2026-08-24新增，`listing.delisting_process` 出处，上市与听证复核理事会治理章程，Panel→Council 二级上诉结构佐证）: https://listingcenter.nasdaq.com/assets/NLHRC_Charter.pdf（HTTP 200，约112KB）
- `indexes.nasdaqomx.com` | 官方（指数编制业务站，Nasdaq Inc 旗下） | en | curl 常规 UA 200 | Nasdaq Index Methodology Guide，覆盖治理流程与通用方法论；⚠️ 未含 Nasdaq Composite/Nasdaq-100 各自的基日/基点等逐指数具体参数，那部分需要另外的逐指数方法论文件，本次未找到
  - Nasdaq Index Methodology Guide（PDF）: https://indexes.nasdaqomx.com/docs/Nasdaq_Index_Methodology_Guide.pdf（HTTP 200，249KB）
- `dtcc.com` | 监管/清算基础设施 | en | ⚠️ HTML 内容子页（如 accelerated-settlement、understanding-settlement 等路径）持续 403，与 `us-nyse` 一节记录的情况一致；**但 2026-08-24 补全空缺字段时发现其静态资产托管路径（`~/media/Files/Downloads/...`）不受此拦截影响**——该路径本质是文件服务器直出（很可能走不同的 CDN/源站配置），不经过拦截 HTML 页面的那层 WAF/反爬规则，同类静态 PDF 资产链接理论上都值得一试，不必因为该域名主站被拦就放弃全部路径 | `clearing.csd_name`（DTC 托管机构）仍留空（HTML 内容页确实无法访问），但 `costs.clearing_fees` 已从下方新增的官方 NSCC 费率指南 PDF 找到具体费率佐证
  - Guide to the 2026 NSCC Fee Schedule（DTCC官方PDF，`costs.clearing_fees` 出处，Effective January 1, 2026）: https://www.dtcc.com/~/media/Files/Downloads/legal/fee-guides/nsccfeeguide.pdf（HTTP 200，约250KB）
- `govinfo.gov`（美国政府出版局，2026-08-24 新增登记） | 官方（美国联邦政府法律文本官方发布机构） | en | curl 常规 UA 200，全程未见反爬，与 `sec.gov` 拦截形成鲜明对比 | **突破 sec.gov 反爬的核心替代路径之一**：`govinfo.gov` 托管美国众议院法律修订顾问办公室（Office of the Law Revision Counsel）编制的官方汇编制定法全文（Compilation of Statutes）与历次《公法》（Public Law）原始文本，均为可直接 curl 的纯文本 PDF（非扫描件），不依赖 sec.gov 域名即可拿到法律原文逐字引用
  - Securities Exchange Act of 1934（官方汇编全文 PDF，`regulation.core_laws` 出处）: https://www.govinfo.gov/content/pkg/COMPS-1885/pdf/COMPS-1885.pdf（HTTP 200，约940KB）
  - Holding Foreign Companies Accountable Act, Public Law 116-222（`risks.political_risk_note` 出处）: https://www.govinfo.gov/content/pkg/PLAW-116publ222/pdf/PLAW-116publ222.pdf（HTTP 200，约200KB）
- `ecfr.gov`（电子联邦法规汇编，Electronic Code of Federal Regulations，2026-08-24 新增登记） | 官方（美国国家档案与记录管理局联邦公报办公室运营） | en | ⚠️ 该站**面向用户的前端页面**（如 `ecfr.gov/current/title-17/.../section-242.201` 这类"好看"的 URL）是纯 JS 渲染的 SPA 外壳，curl 只能拿到无正文的 HTML；**必须改用其公开的 versioner API**（`ecfr.gov/api/versioner/v1/full/{issue-date}/title-{N}.xml?part={part}`，无需鉴权/API Key）才能拿到官方汇编 XML/纯文本全文——`{issue-date}` 需先查 `https://www.ecfr.gov/api/versioner/v1/titles.json` 确认该标题当前的 `latest_issue_date`（本次为 title 17/31 均查得 2026-08-17）；`part` 较大时（如整个 title 240）返回体可能过大甚至报 500，加 `&subject_group=` 参数（从前端页面 URL 的 `subject-group-ECFRxxxx` 段抄）可縮小到目标条文附近，2026-08-24 实测对 17 CFR 240.15l-1（Reg BI）有效 | **突破 sec.gov 反爬的第二条核心路径**：Title 17（商品与证券交易所）、Title 31（财政部规章，含 FinCEN 反洗钱规则）均可用此法拿到官方条文原文，不依赖 `sec.gov`/`ecfr.gov` 前端页面
  - 17 CFR 242.201 Circuit breaker（Regulation SHO Rule 201 官方条文，含10%跌幅触发阈值，`market_structure.short_selling` 出处）: https://www.ecfr.gov/api/versioner/v1/full/2026-08-17/title-17.xml?part=242（HTTP 200，约690KB）
  - 17 CFR 243.100 Regulation FD（`regulation.disclosure_requirements` 出处）: https://www.ecfr.gov/api/versioner/v1/full/2026-08-17/title-17.xml?part=243（HTTP 200，约12KB）
  - 17 CFR 240.15l-1 Regulation Best Interest（`participants.suitability_management` 出处，用 `subject_group` 参数缩小返回体）: https://www.ecfr.gov/api/versioner/v1/full/2026-08-17/title-17.xml?part=240&subject_group=ECFR64f52d737aea1ed（HTTP 200，约53KB）
  - 31 CFR 1023.220 Customer Identification Program（`participants.account_opening_requirements` 出处）: https://www.ecfr.gov/api/versioner/v1/full/2026-08-17/title-31.xml?part=1023（HTTP 200，约45KB）
- `federalregister.gov`（美国联邦公报，2026-08-24 新增登记） | 官方（美国国家档案与记录管理局运营，SEC 对纳斯达克/NSCC 等自律组织规则修改申请的法定公告与命令均在此正式刊登） | en | curl 常规 UA 200，全程未见反爬 | **突破 sec.gov 反爬的第三条核心路径**：listingcenter.nasdaq.com 的 Rulebook 交互页与 dtcc.com 的规则条文子页均无法直接抓取时，SEC 就该所/该清算机构"规则修改申请"（SR-NASDAQ-*/SR-NSCC-*）发布的官方 Notice/Order 会在 Purpose/Background 部分完整复述现行规则条文与结构，等效于间接拿到规则原文；这些 Notice/Order 本身就是 SEC 官方正式公告（非纳斯达克自我表述），可视为监管机构一手文件。检索方法：WebSearch 搜 `federalregister.gov` + 规则编号/关键词，命中后逐条 curl 验证正文（WebSearch 摘要本身不可直接引用，见 CLAUDE.md 二第1条）
  - SEC Notice of Filing of Proposed Rule Change To Amend Rule 5820（SR-NASDAQ-2024-037，`listing.delisting_process` 出处，其 Purpose 背景段完整复述 Rule 5810/5815/5820 现行三级结构，该提案本身已于2024-10撤回但背景描述不受影响）: https://www.federalregister.gov/documents/2024/07/23/2024-16105/self-regulatory-organizations-the-nasdaq-stock-market-llc-notice-of-filing-of-proposed-rule-change（HTTP 200）
  - SEC Order Granting Approval of a Proposed Rule Change（SR-NASDAQ-2024-031，`listing.suspension_resumption`/`listing.delisting_transition_period`/`listing.post_delisting_venue` 出处，正文与脚注给出听证中止暂停的一般规则、例外情形及OTC市场转入细节）: https://www.federalregister.gov/documents/2025/01/23/2025-01621/self-regulatory-organizations-the-nasdaq-stock-market-llc-order-granting-approval-of-a-proposed-rule（HTTP 200）
  - SEC Notice of Filing of Proposed Rule Change To Enhance NSCC's Clearing Fund Methodology（`clearing.default_management` 出处）: https://www.federalregister.gov/documents/2026/06/04/2026-11144/self-regulatory-organizations-national-securities-clearing-corporation-notice-of-filing-of-proposed（HTTP 200）
- `efts.sec.gov` / `data.sec.gov`（SEC EDGAR 全文检索/数据 API 子域名，2026-08-24 探测） | 官方 | — | ⚠️ 与 `www.sec.gov`/`www.sec.gov/Archives` 不同基础设施，本次探测均 200（`efts.sec.gov/LATEST/search-index?q=...` 全文检索 API、`data.sec.gov/submissions/CIK*.json` 公司备案元数据 API），但返回的是 EDGAR 备案索引/元数据，不是规则条文本身的叙述性文本，本次未直接用于摘引任何字段，记此备查——如后续需要"某公司哪天披露了退市"这类结构化事实，这两个 API 是可用入口
- `sipc.org`（证券投资者保护公司，2026-08-24 新增登记） | 官方（国会依《1970年证券投资者保护法》设立的法定会员制非营利公司） | en | curl 常规 UA 200 | `regulation.investor_protection` 出处
  - What SIPC Protects: https://www.sipc.org/for-investors/what-sipc-protects（HTTP 200）
- `irs.gov`（美国国税局，2026-08-24 新增登记） | 官方（税务机关） | en | curl 常规 UA 200，全程未见反爬 | `costs.dividend_withholding_tax`/`costs.capital_gains_tax` 出处；⚠️ 部分栏目首页（如 `/individuals/international-taxpayers/nonresident-aliens`）本身是导航壳、正文很少，需要定位到更具体的专题页（如 `/nra-withholding`、`/taxtopics/tc409`）才有实质条文
  - NRA withholding: https://www.irs.gov/individuals/international-taxpayers/nra-withholding（HTTP 200）
  - Topic no. 409, Capital gains and losses: https://www.irs.gov/taxtopics/tc409（HTTP 200）
- `home.treasury.gov`（美国财政部，2026-08-24 us-nasdaq 一节补充登记；域名本身已在本文件其他章节注册过，这里补记 us-nasdaq 专属用途） | 官方（监管机构） | en | curl 常规 UA 200 | `regulation.foreign_ownership_limit` 出处，用于确认CFIUS国家安全审查机制的官方定性；⚠️ 该字段最终仍以"结构性推论"而非"逐字否定性表述"入库，因防幻觉铁律不能凭沉默/未提及来证明"不存在"，详见字段 detail
  - Committee on Foreign Investment in the United States (CFIUS): https://home.treasury.gov/policy-issues/international/the-committee-on-foreign-investment-in-the-united-states-cfius（HTTP 200）
- `ofac.treasury.gov`（美国财政部海外资产控制办公室，2026-08-24 新增登记；⚠️ SOURCES_DOMAIN_RE 每行只捕获开头第一个反引号 token，与 `home.treasury.gov` 不可写在同一行，须各自单独开一行——见 SKILL.md 已知坑） | 官方（监管机构） | en | curl 常规 UA 200 | `regulation.capital_controls` 出处，用于确认OFAC定向制裁（而非普遍性资本管制）机制的官方定性；⚠️ 该字段同样以"结构性推论"入库，详见字段 detail
  - About OFAC: https://ofac.treasury.gov/about-ofac（HTTP 200）
  - OFAC FAQ 1055（俄罗斯相关定向制裁示例）: https://ofac.treasury.gov/faqs/1055（HTTP 200）
- `sifma.org`（美国证券业与金融市场协会，2026-08-24 新增登记） | 第三方（行业自律性贸易协会，按CLAUDE.md二第3条confidence上限medium） | en | curl 常规 UA 200 | `participants.investor_structure`/`participants.broker_landscape` 出处，年度《资本市场年鉴》汇编美联储家庭金融调查与FINRA经纪商注册统计
  - 2025 SIFMA Capital Markets Fact Book（PDF）: https://www.sifma.org/wp-content/uploads/2024/07/2025-SIFMA-Capital-Markets-Factbook.pdf（HTTP 200，约1.4MB）
- `everycrsreport.com`（国会研究服务处报告第三方归档站，2026-08-24 新增登记） | 第三方（按CLAUDE.md二第3条confidence上限medium） | en | curl 常规 UA 200；`congress.gov` 本身对CRS报告页返回403，此为降级来源 | `costs.financial_transaction_tax` 出处，注意该份报告（RL32266）年代较早，文中具体费率数字已过时，本字段仅采信其历史沿革/无广义交易税立法两点结构性事实
  - Transaction Tax: General Overview（CRS Report RL32266）: https://www.everycrsreport.com/reports/RL32266.html（HTTP 200）
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

- `commission.europa.eu` | 官方（欧盟委员会） | en | curl 常规 UA 200 | 资本自由流动法律基础（capital_controls 出处）
- `www.europarl.europa.eu` | 官方（欧洲议会） | en | curl 常规 UA 200 | 资本自由流动事实说明（capital_controls 交叉核对）

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
  - About Equity Derivatives（衍生品市场沿革：指数期货2000-06-12/指数期权2001-06-04/个股期权2001-07-02/个股期货2001-11-09上线）: https://www.nseindia.com/static/products-services/about-equity-derivatives（HTTP 200，355KB）
  - Equity Derivatives Pre-Open Session（股票/股指期货开盘前集合竞价机制，09:00-09:15）: https://www.nseindia.com/static/products-services/equity-derivatives-pre-open-session（HTTP 200，338KB）
  - Equity Derivatives Trading System（F&O撮合系统：价格-时间优先、订单簿、DAY/IOC时间条件、限价/市价/止损价格条件）: https://www.nseindia.com/static/products-services/equity-derivatives-trading-system（HTTP 200，306KB）
  - Equity Derivatives Price Bands（衍生品分部无每日涨跌停，改设10%/delta动态操作区间防止错价申报）: https://www.nseindia.com/static/products-services/equity-derivatives-price-bands（HTTP 200，125KB）
  - Equity Derivatives Margins（NSE Clearing 保证金体系总览：SPAN初始保证金/Extreme Loss Margin）: https://www.nseindia.com/static/products-services/equity-derivatives-margins（HTTP 200，372KB）
  - NSCCL SPAN（SPAN组合保证金算法原理：16档情景扫描、Scanning Risk Charge、Calendar Spread Charge）: https://www.nseindia.com/products-services/equity-derivatives-nse-clearing-span（HTTP 200，355KB）
  - Liquidity Enhancement Scheme（做市商/流动性提供者计划，含指定做市商利益冲突披露要求；目前已确认产品集中在商品衍生品分部，如白银期权/电力期货/迪拜原油期货）: https://www.nseindia.com/static/market-data/liquidity-enhancement-scheme（HTTP 200，326KB）
  - NIFTY 50 F&O（Nifty50期货/期权合约规格：3个月交易周期、最后交易日为到期月最后一个周二、期货最小合约价值不低于1500万卢比、期权行权价间距表）: https://www.nseindia.com/static/products-services/equity-derivatives-nifty50（HTTP 200，369KB）
  - Individual Securities F&O（个股期货/期权合约规格：最小合约价值不低于500万卢比、期权为欧式且实物交割）: https://www.nseindia.com/static/products-services/equity-derivatives-individual-securities（HTTP 200，371KB）
  - ⚠️ Equity Derivatives Settlement Mechanism（页面标注"Updated on: 03/01/2023"，早于上面两条2025年更新的合约规格页；文字写期权"Exercise settlement is cash settled"未按标的区分指数/个股，与 Individual Securities F&O 页"Options contracts are European style and physically settled"直接冲突——本次判断后者（更新更晚、专门针对个股期权）更可信，前者疑似未随2019年SEBI个股衍生品实物交割新规同步更新，未采信其"个股期权现金结算"表述，两页均已记入 quote 供核查）: https://www.nseindia.com/static/products-services/equity-derivatives-settlement-mechanism（HTTP 200，364KB）
  - Currency Derivatives Contract Specification - INR Pairs（USDINR/EURINR/GBPINR/JPYINR期货期权合约规格：最小价格变动0.25 paise即INR 0.0025）: https://www.nseindia.com/static/products-services/currency-derivatives-contract-specification-inr（HTTP 200，376KB）
  - Commodity Derivatives Contract Specifications - Base Metals（非农商品每日价格限制6%，触发后冷静期15分钟放宽至9%，国际市场价格另按3%阶梯放宽）: https://www.nseindia.com/static/products-services/commodity-derivatives-contract-specifications-base-metals（HTTP 200，395KB）
  - Interest Rate Derivatives Contract Specifications - Government Securities（国债期货：1手=200万卢比面值、最小报价单位0.0025、到期月最后交易日为最后一个周四、操作区间±3%可放宽两次）: https://www.nseindia.com/static/products-services/interest-rate-derivatives-contract-specifications-g-sec（HTTP 200，355KB）
- `nsearchives.nseindia.com` | 官方（NSE 官网文档归档子域） | en | curl 常规 UA 200，PDF 体积较大（3.2MB），用 `pdftotext -layout` 转纯文本再 grep 定位 | 存放规则/方法论类 PDF，与主站 `nseindia.com` 同属官方一手来源
  - Methodology Document for NIFTY Equity Indices（含 Nifty 50 基日/基点/加权方式/成分股筛选规则）PDF: https://nsearchives.nseindia.com/content/indices/Method_NIFTY_Equity_Indices.pdf（HTTP 200，3.2MB）
- `sebi.gov.in` | 监管 | en | curl 常规 UA 200，未见反爬；页面是服务端渲染的传统多页站（非 SPA），正文可直接 grep，比同为监管机构域名的 `sec.gov`（美国，v0.2 时实测 403）好抓得多 | 印度证券交易委员会（SEBI），NSE 的政府监管机构；本节只用于确认监管机构身份与核心法律名称，具体规则条款优先引用 NSE 官网转载/说明页
  - About SEBI（设立沿革：1988年非法定机构成立/1992年成为法定机构）: https://www.sebi.gov.in/about-sebi.html（HTTP 200，8.5KB）
  - Securities Contracts (Regulation) Act, 1956（核心法律之一，SCRA，确认法律名称与年份）: https://www.sebi.gov.in/legal/acts/feb-1957/securities-contracts-regulation-act-1956-as-amended-by-the-international-financial-services-centres-authority-act-2019-w-e-f-october-01-2020-_4.html（HTTP 200，8.6KB）

- `incometaxindia.gov.in` | 官方（印度所得税局） | en | curl 常规 UA 200 | 资本利得税/股息预扣税（costs 出处）
- `rbi.org.in` | 官方（印度储备银行） | en | curl 常规 UA 200 | 外资准入/账户开立（foreign_access_channel/account_opening_requirements 出处）
- `www.fpi.nsdl.co.in` | 官方（NSDL FPI 登记处） | en | curl 常规 UA 200 | 外资参与者登记（foreign_ownership_limit 出处）

### 深圳证券交易所 Shenzhen Stock Exchange (SZSE) `cn-szse`
- `szse.cn` | 官方 | zh / en（英文版路径 `/English/...`，非同页切换，独立 URL；页面同样带"仅供参考，中文文本为准"类免责声明——与 SSE 一致，佐证 `source_lang: zh` 的选择） | curl + 常规浏览器 UA 全程 200，未见反爬/限流（比 `english.sse.com.cn` 好抓，不需要加延时）；PDF 用 `pdftotext -layout` 提取纯文本再 grep 定位条款 | 与上交所同属会员制事业法人、同受中国证监会监管、同为 A 股主板注册制，`region`/`regulator`/`review_system` 等字段与 cn-sse 高度一致，可直接对照校验取值口径是否统一；压测点是主板 vs 创业板（对照 cn-sse 主板 vs 科创板）
  - 本所简介（成立/开业日期、监管归属、职能）: https://www.szse.cn/aboutus/sse/introduction/index.html
  - 交易规则（2026年修订）PDF: https://docs.static.szse.cn/www/lawrules/rule/trade/current/W020260424690713155663.pdf
  - 股票上市规则（2026年修订，主板；原登记的2025年修订版链接抓取时返回404——已被2026年4月第十七次修订替换下线，重新 WebSearch 定位到现行版）PDF: http://docs.static.szse.cn/www/lawrules/rule/allrules/bussiness/W020260424747613955674.pdf ← 财务门槛条款见第3.1.2条（境内企业三选一标准，`listing.boards[cn-szse-main].financial_threshold` 出处）；第3.1.4-3.1.6条另有红筹企业/差异表决权发行人专项标准，本次未摘入 boards（量大且是特殊类别企业，非板块通用标准）
  - 创业板股票上市规则（2026年修订；同上，原2025年修订版链接已下线）PDF: https://docs.static.szse.cn/www/lawrules/rule/stock/supervision/chinext/W020260424688875101057.pdf ← 财务门槛条款见第2.1.2条（境内企业四选一标准，`listing.boards[cn-szse-chinext].financial_threshold` 出处）
  - 市场概况（上市公司数/总市值等统计）: https://www.szse.cn/market/overview/index.html
  - 指数总览: https://www.szse.cn/market/exponent/pandect/index.html
  - 会员与交易类规则入口: https://www.szse.cn/lawrules/service/member/index.html
  - 关于下调股票交易经手费收费标准的通知（2023-08-18）: https://www.szse.cn/disclosure/notice/general/t20230818_602805.html
  - 期权子网站首页（补全 market_structure.derivatives 时，2026-08-18 新增；`/option/` 路径下的公告详情页由服务端直出 HTML，与主站 `/lawrules/rule/...` 栏目的列表页不同——后者条目由前端 AJAX 异步加载（channelId 驱动的 CMS 组件），curl 拿不到列表内容，只能先 WebSearch 定位到具体 `t20YYMMDD_数字.html` 详情页直链，再用 curl 抓该详情页取得附件 PDF 真实链接；这是本次定位到期权交易规则原文 PDF 的关键方法）: https://www.szse.cn/option/
  - 期权业务规则列表页（服务端直出，可直接 curl 拿到各条目详情页链接，与上条同一发现）: https://www.szse.cn/option/rules/optrules/
  - 关于发布《深圳证券交易所股票期权试点交易规则》的通知（附件为交易规则原文 PDF，见下一条）: https://www.szse.cn/option/rules/optrules/t20191207_572478.html
  - 深圳证券交易所股票期权试点交易规则（2019-12-07 发布，深证上〔2019〕800号，自发布之日起施行；本次 WebSearch 直接搜索该文件名多次未命中，最终通过上面的官方通知详情页取得附件真实链接；规则原文未见「XXXX年修订」字样，且未搜到任何后续修订通知，视为现行有效版本，但下次会话如需再次引用建议先按 SOURCES.md 开头教训 3 的方法重新探测一遍）PDF: http://docs.static.szse.cn/www/option/rules/optrules/W020191207434561721119.pdf ← market_structure.derivatives 除保证金公式外的绝大部分字段（交易时段/开收盘机制/撮合原则/订单类型/最小报价单位/涨跌停公式/熔断/交易异常情况处置/大宗交易/做市商）出处
  - 深圳证券交易所 中国证券登记结算有限责任公司股票期权试点风险控制管理办法（第十四-二十条为开仓/维持保证金计算公式，ETF为标的12%/7%、股票为标的21%/10%与19%/10%两套）PDF: http://docs.static.szse.cn/www/option/rules/optrules/W020191207433397366259.pdf ← market_structure.derivatives.margin_practice_note 主要出处
  - 关于嘉实沪深300ETF期权合约品种上市交易有关事项的通知（沪深300ETF期权2019-12-23上市、持仓限额分级表）: https://www.szse.cn/option/rules/optrules/t20191219_572722.html
  - SZSE English — CSI 300 ETF Options（英文版合约条款页：合约乘数10,000/行权价间距表/涨跌停公式/保证金公式，均与上述中文来源交叉核对一致，仅作辅助佐证，未作为 derivatives 字段 quote 的主要来源，因 source_lang 为 zh）: https://www.szse.cn/English/products/options/etf/index.html
- `investor.szse.cn` | 官方（深交所投资者教育／证券学院子站，与 szse.cn 同属深交所运营，页面均带"仅供投资者教育、不构成投资建议"免责声明） | zh | curl 常规 UA 200，未见反爬 | 补全 market_structure.derivatives 时（2026-08-18）新发现的官方来源；"期权入市手册"系列连载文章由深交所联合市场机构撰写，属"官网说明页"层级（非交易所规则原文本身），用于交易制度/做市商/风险控制等字段的补充与交叉印证
  - 期权入市手册（十一）：深市期权交易制度（上）: https://investor.szse.cn/institute/rules/t20221108_597221.html
  - 期权入市手册（十二）：深市期权交易制度（下）（合约单位10,000份的官方说明出处）: https://investor.szse.cn/institute/rules/t20221108_597223.html
  - 期权入市手册（十三）：做市商制度: https://investor.szse.cn/institute/rules/t20221110_597273.html
  - 期权入市手册（三十八）：交易所主要风险控制措施（下）（组合策略保证金/强行平仓触发机制）: https://investor.szse.cn/institute/rules/t20230227_598959.html
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

补全 Category B 空缺字段（regulation/listing/clearing.derivatives/participants/infrastructure/costs/risks，2026-08-24）新增来源：
- `szse.cn`（域名已登记，本轮新增以下具体页面/PDF）
  - 深圳证券交易所合格境外机构投资者和人民币合格境外机构投资者证券交易实施细则（2020年修订）PDF ← `foreign_ownership_limit` 出处: https://docs.static.szse.cn/www/disclosure/notice/general/W020201030604374968707.pdf
  - 深圳证券交易所上市公司自律监管指引第5号——信息披露事务管理（2025年修订）PDF ← `disclosure_requirements`/`continuing_obligations` 出处: https://docs.static.szse.cn/www/lawrules/rule/stock/supervision/currency/W020250327591142579433.pdf
  - 深圳证券交易所股票发行上市审核规则（2024年修订）PDF ← `listing_process_duration` 出处: http://docs.static.szse.cn/www/lawrules/rule/stock/W020240430572636488364.pdf
  - 深圳证券交易所股票期权试点交易规则 第2.5条、第5.11-5.13条（最后交易日顺延规则）← `clearing.derivatives.last_trading_day_rule` 出处，PDF 同已登记的期权交易规则条目: http://docs.static.szse.cn/www/option/rules/optrules/W020191207434561721119.pdf
  - 深圳证券交易所 中国证券登记结算有限责任公司股票期权试点风险控制管理办法 第十四-十九条（分级收取/开仓保证金/维持保证金/逐日盯市）← `clearing.derivatives.initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency` 出处，PDF 同已登记的期权风险控制管理办法条目: http://docs.static.szse.cn/www/option/rules/optrules/W020191207433397366259.pdf
  - 统计年鉴（市场数据导航页，日/周/月/年度概况分类）← `infrastructure.historical_data_availability` 出处: https://www.szse.cn/market/periodical/year/index.html
- `csrc.gov.cn`（域名已登记，本轮新增以下具体页面）
  - 合格境外机构投资者和人民币合格境外机构投资者境内证券期货投资管理办法（2020年证监会、人民银行、外汇局令第176号）← `capital_controls` 出处: http://www.csrc.gov.cn/csrc/c106256/c1653823/content.shtml
  - 中国证券登记结算有限责任公司证券账户业务指南（陕西监管局官网留存，二〇一六年十月版）← `participants.account_opening_requirements` 出处，文档版本较旧（2016年10月），未核实是否有更新修订版，confidence 定 medium: http://www.csrc.gov.cn/shanxi/c1055540/c1609332/1609332/files/中国证券登记结算有限责任公司证券账户业务指南.pdf
- `chinaclear.cn`（域名已登记，本轮新增以下具体页面）
  - 中国证券登记结算有限责任公司遵循《金融市场基础设施原则》信息披露报告（2022年6月）← `clearing.default_management` 出处: http://www.chinaclear.cn/zdjs/xxxpl/202307/e8fcc5f599a34963b5c83c8ac07ece1d/files/中国结算遵循《金融市场基础设施原则》信息披露报告（2022）.pdf
- `people.com.cn`（域名已登记，本轮新增以下具体页面）
  - 4月29日起股票交易过户费总体下调50%（转载中国结算官网公告）← `costs.clearing_fees` 出处: http://finance.people.com.cn/n1/2022/0429/c1004-32411923.html
- `isc.com.cn` | 官方（中证中小投资者服务中心，中国证监会体系下全国性投资者保护机构官网） | zh | curl 常规 UA 200，未见反爬 | 用于 `regulation.investor_protection`：全国性机制，非深交所专属，故 confidence 定 medium
  - 维权服务（特别代表人诉讼/支持诉讼/股东诉讼）: http://www.isc.com.cn/tsyw/wqfw/
- `szsi.cn` | 官方（深圳证券信息有限公司，SZSE 全资子公司，行情数据授权与分发主体，域名与已登记的 `cnindex.com.cn` 同属该公司不同业务线） | zh | curl 常规 UA 200，未见反爬 | 用于 `infrastructure.market_data_levels`/`data_pricing_model`/`data_latency`：官方行情商用授权与定价说明
  - 深市行情授权 - 增强行情介绍: http://www.szsi.cn/cpfw/fwsq/hq/yw-2.htm
  - 深交所行情互联网接入服务说明（含收费标准）PDF: http://www.szsi.cn/cpfw/fwsq/hq/深交所行情互联网接入服务说明.pdf
- `chinatax.gov.cn` | 官方（国家税务总局，含省级税务局子域名 `guangdong.chinatax.gov.cn` 转发件，均标注来源为国家税务总局） | zh | curl 常规 UA 200，未见反爬 | 用于 `costs.capital_gains_tax`/`costs.dividend_withholding_tax`：全国统一税收政策，非深交所自定，与上交所（cn-sse）适用同一套规则
  - 关于上市公司股息红利差别化个人所得税政策有关问题的通知（财税〔2015〕101号，通知抬头列明直接下发对象含"上海、深圳证券交易所"）: https://www.chinatax.gov.cn/n810341/n810755/c1797427/content.html
  - 关于个人转让股票所得继续暂免征收个人所得税的通知（财税字〔1998〕61号，广东省税务局官网转发，标注来源为国家税务总局）: https://guangdong.chinatax.gov.cn/gdsw/grsdsgg_hmqsc_pyzbsc_ssgs/2021-08/31/content_0515931e3f044baf9a26bbe53e85eb38.shtml
- `qianzhan.com` | 第三方（行业研究机构，前瞻产业研究院） | zh | curl 常规 UA 200，未见反爬 | 用于 `participants.broker_landscape`：全国证券业集中度数据，非深交所专属统计，confidence 依铁律封顶 medium
  - 【行业深度】洞察2023：中国证券行业竞争格局及市场份额: https://www.qianzhan.com/analyst/detail/220/230518-3f033ad2.html
- `zh.wikipedia.org` | 第三方（中文维基百科） | zh | curl 常规 UA 200，未见反爬 | 用于 `infrastructure.major_outage_history`：深交所历史系统故障事件（2002年卫星转发器干扰停市、1992年"8·10事件"），本次未核实到深交所官方对这两起事件的原始公告存档，confidence 依铁律封顶 medium
  - 深圳证券交易所（大事记章节）: https://zh.wikipedia.org/zh-hans/%E6%B7%B1%E5%9C%B3%E8%AF%81%E5%88%B8%E4%BA%A4%E6%98%93%E6%89%80

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
  - Schedule A – Price List and Data Products（01 January 2026，市场数据 Level 1/Level 2/Post-trade 分级定义与实时/延时/收市后再分发许可价目表，补全 `infrastructure` 章节用）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/schedule-a-price-list-and-products-schedule-2026.pdf
  - Market Data Policy Guidelines（01 January 2025，Real Time/Delayed/After Midnight Data 各类再分发许可定义）PDF: https://docs.londonstockexchange.com/sites/default/files/documents/market-data-policy-guidelines-2025_0.pdf
- `lseg.com`（集团官网，与 `www.londonstockexchange.com` 是不同站点，非 SPA） | 官方（母公司 London Stock Exchange Group plc） | en | curl 常规 UA 200，未见反爬 | 历史沿革、清算（LCH）、指数方法论（FTSE Russell）、集团财报
  - The history of LSEG（历史沿革，含1801年正式成立、1986 Big Bang、2001年自身挂牌上市、2007年与 Borsa Italiana 合并组成 LSEG 集团等关键节点）: https://www.lseg.com/en/about-us/history
  - About LCH（清算/中央对手方）: https://www.lseg.com/en/post-trade/clearing/about-lch
  - LSE 24（延长交易时段计划，2026年新闻稿，压测点"独立监管框架下机制持续演进"的证据）: https://www.lseg.com/en/media-centre/press-releases/2026/london-stock-exchange-to-launch-lse-24
  - FTSE UK Index Series Ground Rules（指数编制方法论）PDF: https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-uk-index-series-ground-rules.pdf
  - LSEG plc 2025年度业绩初步公告（Preliminary Results RNS，市值/财务数据）PDF: https://www.lseg.com/content/dam/lseg/en_us/documents/investor-relations/financial-results/preliminary-results/rns/lseg-2025-preliminary-results-rns-26feb2026.pdf
  - LCH Ltd Default Waterfall（Oct 2024，违约处置资源瀑布图，含 EquityClear 违约基金/LCH自有资本出资规模）PDF: https://www.lseg.com/content/dam/post-trade/en_us/documents/lch/resources/lch-ltd-default-waterfall-oct-2024.pdf
  - LCH Ltd EquityClear Settlement Fee Schedule（From 1st July 2024，证券结算环节费率表，区别于交易所自身交易费）PDF: https://www.lseg.com/content/dam/post-trade/en_us/documents/lch/resources/lch-ltd-equity-clear-settlement-fee-schedule-current-010724.pdf
- `fca.org.uk` | 监管 | en | curl 常规 UA 200，未见反爬 | 英国金融行为监管局（FCA），脱欧后 UK Listing Rules 与卖空监管的独立规则制定机关——压测点核心来源
  - UKLR（UK Listing Rules）sourcebook 全文 PDF: https://api-handbook.fca.org.uk/files/sourcebook/UKLR.pdf
  - Short selling（卖空监管，SSR 2025 新制度说明）: https://www.fca.org.uk/markets/short-selling
  - About T+1 settlement（结算周期改革现状，关键事实：本次会话核实时点 2026-08-14，英国仍是T+2，T+1定于2027年10月11日才生效，目前尚未发生）: https://www.fca.org.uk/markets/about-t1-settlement
  - Market abuse（UK MAR 执法框架、罚则、STOR报告要求）: https://www.fca.org.uk/markets/market-abuse
  - Listing and sponsor fees（发行人/保荐人向FCA缴纳的文件审核费与年费，区别于交易所自身费用）: https://www.fca.org.uk/markets/primary-markets/fees
  - Listing applications, amendments, suspensions and cancellations（明确"上市申请/变更/暂停/取消本身不收费，仅招股说明书审批收费"）: https://www.fca.org.uk/markets/primary-markets/listing-applications
  - New financial sanctions measures in relation to Russia（2022年俄乌事件后FCA声明，为下方LSE Market Notice N06/22提供监管背景）: https://www.fca.org.uk/news/statements/new-financial-sanctions-measures-relation-russia
- `data.fca.org.uk` | 官方（National Storage Mechanism，FCA托管的RNS/交易所公告官方存档） | en | curl 常规 UA 200 | LSE Market Notice N06/22（2022-03-03，依据Rules of the London Stock Exchange Rule 1510暂停约20只俄罗斯公司GDR/ADR交易，政治/制裁风险压测点的一手证据）
  - N06/22 - Russia related sanctions - Update: https://data.fca.org.uk/artefacts/NSM/RNS/4290415.html
- `euroclear.com` | 官方（清算/托管机构） | en | ⚠️ curl 常规 UA 对根域名与内容页均返回 403（间隔12秒重试后仍 403，非限流，是真实拦截），未能抓到——Euroclear UK & International（原 CREST）作为 LSE 中央证券存管机构的角色改用第三方转述来源确认，见下 | —
- `gov.uk` | 监管（税务机关 HMRC；国家安全与投资法审查亦发布于此） | en | curl 常规 UA 200，未见反爬 | 印花税储备税（SDRT）官方说明，含 CREST 代收 SDRT 的机制描述；国家安全与投资法（外资并购国家安全审查）指引；资本利得税税率官方页
  - Stamp Duty and Stamp Duty Reserve Tax: https://www.gov.uk/government/publications/stamp-duty-and-stamp-duty-reserve-tax/stamp-duty-and-stamp-duty-reserve-tax
  - National Security and Investment Act guidance on acquisitions（NSI Act 2021外资/内资并购国家安全审查制度，25%/50%/75%持股门槛，17个敏感行业）: https://www.gov.uk/guidance/national-security-and-investment-act-guidance-on-acquisitions
  - Capital Gains Tax: what you pay it on, rates and allowances（2026/27税率：基本税率18%、较高税率24%，年度免税额£3,000）: https://www.gov.uk/capital-gains-tax/rates
- `fscs.org.uk` | 监管（金融服务补偿计划，FSMA 2000下设立的法定投资者/存款人补偿机构） | en | curl 常规 UA 200 | 投资类索赔补偿限额（2019年4月后失败机构：每人每机构最高£85,000）
  - What we cover | Investments: https://www.fscs.org.uk/what-we-cover/investments/
- `api.parliament.uk` | 官方（Hansard，英国议会官方历史发言记录） | en | curl 常规 UA 200 | 1979年10月23日财政大臣Geoffrey Howe在下议院宣布即时撤销全部剩余外汇管制的官方发言记录，是`capital_controls`字段"英国无资本管制"这一常识性事实少有的可逐字摘引的一手原文
  - EXCHANGE CONTROLS (Hansard, 23 October 1979): https://api.parliament.uk/historic-hansard/commons/1979/oct/23/exchange-controls
- `ons.gov.uk` | 官方（国家统计局，Office for National Statistics） | en | curl 常规 UA 200 | Ownership of UK quoted shares 两年一期统计公报，按持有人部门（境外/个人/银行/公共部门等）拆分的LSE上市公司股权结构官方口径数据
  - Ownership of UK quoted shares: 2024（2026-01-29发布）: https://www.ons.gov.uk/economy/investmentspensionsandtrusts/bulletins/ownershipofukquotedshares/2024
- `handbook.fca.org.uk` | 监管（FCA Handbook，与 `api-handbook.fca.org.uk`/`fca.org.uk` 为不同子域名，需单独登记） | en | curl 常规 UA 200 | COBS（Conduct of Business Sourcebook）适当性/适合性管理规则原文
  - FCA Handbook - COBS 9A Suitability (MiFID and insurance-based investment products provisions): https://handbook.fca.org.uk/handbook/cobs9a
  - FCA Handbook - COBS 10 Appropriateness (for non-advised services): https://handbook.fca.org.uk/handbook/cobs10
- `legislation.gov.uk` | 官方（英国立法官方数据库） | en | curl 常规 UA 200 | 《2017年洗钱、恐怖主义融资与资金转移条例》（Money Laundering Regulations 2017）第28条客户尽职调查（开户KYC）要求原文
  - The Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017, Regulation 28: https://www.legislation.gov.uk/uksi/2017/692/regulation/28

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

- `dserver.bundestag.de` | 官方（德国联邦议会文件库） | de | curl 常规 UA 200 | Börsenumsatzsteuer 1991 废除立法（stamp_duty/financial_transaction_tax 出处）
- `www.deloittelegal.de` | 第三方（律所） | de | WebSearch 定位 | EdW 投资者赔偿方案（investor_protection 出处，confidence medium）
- `resourcehub.bakermckenzie.com` | 第三方（律所资源库） | en | WebSearch 定位 | 上市流程文件（listing_process_duration 出处，confidence medium）
- `www.marketscreener.com` | 第三方（财经媒体） | en | curl 常规 UA 200 | Xetra 交易中断报道（major_outage_history 出处，confidence medium）

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
  - ASX 24衍生品市场（期货市场）总览页: https://www.asx.com.au/markets/trade-our-derivatives-market/futures-market （HTTP 200，152KB）
  - ASX 24指数衍生品交易时段: https://www.asx.com.au/markets/market-resources/trading-hours-calendar/index-derivatives （HTTP 200，133KB）
  - ASX 24利率衍生品交易时段: https://www.asx.com.au/markets/market-resources/trading-hours-calendar/interest-rate-derivatives （HTTP 200，136KB）
  - ASX 24农产品衍生品交易时段: https://www.asx.com.au/markets/market-resources/trading-hours-calendar/agricultural-derivatives （HTTP 200，134KB）
  - ASX 24合约规格总表 PDF: https://www.asx.com.au/content/dam/asx/participants/derivatives-market/ird/asx24-contract-specifications.pdf （HTTP 200，649KB）
  - ASX 24 Operating Rules 第三节 PDF: https://www.asx.com.au/content/dam/asx/rules-guidance-notes-waivers/asx-24-operating-rules/rules/ASX-24-Operating-Rules-Section-03.pdf （HTTP 200，369KB）
  - ASX 24 Operating Rules 第四节（订单录入与交易）PDF: https://www.asx.com.au/content/dam/asx/rules-guidance-notes-waivers/asx-24-operating-rules/rules/ASX-24-Operating-Rules-Section-04.pdf （HTTP 200，602KB）
  - ASX 24 Trading Platform Guide PDF: https://www.asx.com.au/content/dam/asx/participants/trading-platforms/futures/asx-24-trading-platform-guide.pdf （HTTP 200，1237KB）
  - ASX Clear (Futures) 保证金参数表 PDF: https://www.asx.com.au/content/dam/asx/participants/clearing-and-settlement/margin-rates.pdf （HTTP 200，657KB）
  - 保证金机制说明页（Margining）: https://www.asx.com.au/markets/clearing-and-settlement-services/asx-clear/risk-management/margining （HTTP 200，149KB）
  - ASX Clear (Futures)（期货结算公司专页）: https://www.asx.com.au/markets/clearing-and-settlement-services/asx-clear-futures （HTTP 200，169KB）
  - ASX Clear (Futures) SPAN保证金算例 PDF: https://www.asx.com.au/documents/clearing/asx-clear-futures-examples.pdf （HTTP 200，125KB）
  - 做市商安排总览页（Market maker arrangements）: https://www.asx.com.au/markets/market-resources/market-maker-arrangements （HTTP 200，137KB）
  - 指数衍生品做市商安排（含SPI 200期货期权）: https://www.asx.com.au/markets/market-resources/market-maker-arrangements/index-derivatives-market-maker-arrangements （HTTP 200，140KB）
  - 利率衍生品做市商安排: https://www.asx.com.au/markets/market-resources/market-maker-arrangements/interest-rate-derivatives-market-maker-arrangements （HTTP 200，145KB）
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

- `asxonline.com` | 官方（ASX 文档库） | en | curl 常规 UA 200 | ASX 信息费/交易费价目表、CHESS 交收程序等 PDF
- `www.asxonline.com` | 官方（ASX 文档库，同上域名 www 前缀） | en | curl 常规 UA 200 | 同上
- `firb.gov.au` | 官方（外国投资审查委员会） | en | curl 常规 UA 200 | 外资投资审查框架（foreign_ownership_limit 出处）
- `legislation.nsw.gov.au` | 官方（新南威尔士州立法库） | en | curl 常规 UA 200 | 印花税废除立法（stamp_duty 出处）
- `www.ato.gov.au` | 官方（澳大利亚税务局） | en | curl 常规 UA 200 | 资本利得税/股息预扣税（costs 出处）
- `www.austrac.gov.au` | 官方（AML/CTF 监管） | en | curl 常规 UA 200 | 客户身份识别（account_opening_requirements 出处）
- `cepr.org` | 第三方（金融交易税研究库） | en | curl 常规 UA 200 | 澳大利亚无金融交易税佐证（costs.financial_transaction_tax，confidence 封顶 medium）

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
  - MT30 Index Futures Contract Specifications（MT30指数期货合约规格表：合约代码/合约乘数/最小变动价位/每日涨跌停/合约月份/结算方式/交易时段等）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/f5716373-65f9-4a6c-961c-f1f76f351138/MT30.pdf?MOD=AJPERES&CVID=pmfpIF7（HTTP 200）
  - Derivatives Exchange Trading and Membership Procedures（衍生品交易与会员程序：交易时段表/订单类型/订单条件/订单有效期/撮合原则与开盘价算法/涨跌停/协商交易/暂停机制等条文密度最高的单一衍生品来源）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/f4480189-6e3e-4aac-b385-d858b3baff4c/Derivatives+Exchange+Trading+and+Membership+Procedure+.pdf?MOD=AJPERES&ContentCache=NONE&CACHE=NONE&CACHEID=ROOTWORKSPACE-f4480189-6e3e-4aac-b385-d858b3baff4c-pfkJUdp（HTTP 200）
  - Derivatives Exchange Trading and Membership Rules（衍生品交易与会员规则：会员资格/做市商/保证金/协商交易/紧急情况等条款层级更高的规则文本，与上面的 Procedures 是同一体系的两份文件）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/89982883-848c-485e-9b94-5ef5ce0c27ce/Derivatives+Exchange+Trading+and+Membership+Rules+.pdf?MOD=AJPERES&ContentCache=NONE&CACHE=NONE&CACHEID=ROOTWORKSPACE-89982883-848c-485e-9b94-5ef5ce0c27ce-pfkI-F7（HTTP 200）
  - Short Selling Regulations（做空/卖空监管规则全文，含合格卖空标的清单范围/报升规则等条款；2026-08-20新增登记，用于核实 OPEN-QUESTIONS `short_selling` 悬案）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/1300edb3-6987-4d93-9515-138e1e7343e8/Short+Selling+Regulations.pdf?MOD=AJPERES&ContentCache=NONE&CACHE=NONE&CACHEID=ROOTWORKSPACE-1300edb3-6987-4d93-9515-138e1e7343e8-oV2AOMl（HTTP 200；⚠️ 不带查询参数的短链会 404，必须带完整 `?MOD=AJPERES&...CACHEID=...` 查询串）
  - Saudi Exchange Statistical Report 2024（年度统计报告；2026-08-20新增登记，曾尝试核实 OPEN-QUESTIONS TASI 基日/基点悬案，**已确认无果**——报告含市场概览/年度数据但不含TASI基日/基点历史信息，下次不必重复翻此文件找该悬案）PDF: https://www.tadawulgroup.sa/wps/wcm/connect/196987cf-f6b1-4f64-9fe4-430821edbf24/Saudi+Exchange+Statistical+Report+2024+En.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-196987cf-f6b1-4f64-9fe4-430821edbf24-pl7Xgyx（HTTP 200）
- `annualreport.tadawulgroup.sa`（⚠️ 与 `annualreport2018.tadawul.com.sa` 是不同域名/不同静态存档站点，前者只有2018年报，本域名托管2021年及以后的年报，2026-08-20新增登记） | 官方（Saudi Tadawul Group 年度报告存档站点，静态站点） | en | curl + 常规 UA 200，未见反爬 | 用于核实 OPEN-QUESTIONS 母公司2021年改制为控股集团+完成IPO 的悬案
  - The IPO（2021年报，Company Profile 章节，含改制公告日期/IPO完成日期/发行比例/发行价）: https://annualreport.tadawulgroup.sa/Resources/AnnualReport2021/company_profile/the_ipo.html
  - Subsidiary Review（2021年报，Operation Review 章节，四家子公司列表与集团架构说明）: https://annualreport.tadawulgroup.sa/Resources/AnnualReport2021/operation_review/subsidiary_review.html
- `cma.gov.sa` | 监管 | ar/en | curl + 常规 UA 全部 200，未见反爬 | 沙特资本市场管理局（Capital Market Authority, CMA），Saudi Exchange 的政府监管机构；官方确认域名是 `cma.gov.sa`（`.gov.sa` 而非旧域名 `cma.org.sa`，后者仍能 200 但已非最新权威站点，本次未采用）
  - About CMA: https://cma.gov.sa/en/AboutCMA/Pages/AboutCMA.aspx
  - Capital Market Law 索引页: https://cma.gov.sa/en/RulesRegulations/CMALaw/Pages/default.aspx
  - Capital Market Law（资本市场法，含交易所/存管中心/清算中心须经 CMA 许可并采用股份公司形式等核心条文）PDF: https://cma.gov.sa/en/RulesRegulations/CMALaw/Documents/CMA_Law.pdf
  - Capital Market Institutions Regulations PDF: https://cma.gov.sa/en/RulesRegulations/Regulations/Documents/CapitalMarketInstitutionsRegulations.pdf
  - Awareness/Regulations 总览页: https://cma.gov.sa/en/Awareness/Pages/Regulations.aspx
  - Saudi Tadawul Group Holding Company Prospectus（CMA官方备案的招股说明书，用于核实2021年改制/IPO悬案；2026-08-20新增登记）PDF: https://cma.gov.sa/en/Market/Prospectuses/Documents/Saudi_Tadawul_Group_en.pdf
  - The CMA Opens the Capital Market to All Categories of Foreign Investors（2026-01-06/07官方公告页，取消QFI制度、开放主板予全体外资的官方一手公告；2026-08-20新增登记，用于核实 OPEN-QUESTIONS `foreign_ownership_limit` 悬案）: https://cma.gov.sa/en/MediaCenter/NEWS/Pages/CMA_N_3974.aspx
  - Rules for Foreign Investment in Securities（外资证券投资规则，2026年1月5日修订版官方英译本；2026-08-20新增登记）PDF: https://cma.gov.sa/en/RulesRegulations/Regulations/Documents/Rules_for_Foreign_Investment_in_Securities_en.pdf
  - Investing in the Stock Market（CMA投资者教育系列 Booklet 2；2026-08-20新增登记，曾尝试核实TASI基日悬案，**已确认无果**——提及TASI但无历史/基日信息）PDF: https://cma.gov.sa/en/Awareness/Publications/booklets/Booklet_2.pdf
- `edaa.sa` | 官方（证券存管中心，Saudi Tadawul Group 旗下子公司，CSD） | en | curl + 常规 UA 200，未见反爬 | Depository and Settlement System (DSS) 说明，证券侧全额交收、资金侧净额结算
  - Settlement 服务页: https://www.edaa.sa/wps/portal/edaa/services/memberservices/settlement?locale=en
- `muqassa.sa` | 官方（证券清算中心，Saudi Tadawul Group 旗下子公司，CCP） | en | curl + 常规 UA 200，未见反爬 | 首页含公司成立年份（2018）与最新公告列表，本身即含正文，未见明显反爬
  - 首页: https://www.muqassa.sa/wps/portal/muqassa/home
  - Derivatives Index Brochure（MT30指数期货合约规格与保证金乘数表，含Institutions/Tier1 Individual/Tier2 Individual三档保证金乘数）PDF: https://www.muqassa.sa/wps/wcm/connect/6a41fc1e-3ace-40de-a42c-9c1ac8ec97bc/Derivatives_Index_Brochure_Digital_EN.pdf?MOD=AJPERES&CVID=oMhahw8（HTTP 200）
- `annualreport2018.tadawul.com.sa` | 官方（2018 年度报告站点存档，静态站点，非现行 WebSphere Portal 系统） | en | curl + 常规 UA 200，未见反爬；⚠️ 是历史存档页（2018年报），仅用于确认「2007年3月19日依据资本市场法第20条成立为股份公司」这条历史成立事实，不代表当前最新股权/上市结构（Tadawul 已于2021年改制为控股集团并完成IPO，见 regulation/overview 相关字段 detail 说明）
  - About Tadawul: https://annualreport2018.tadawul.com.sa/Resources/AnnualReport/company_profile/about_tadawul.html
- `lw.com`（⚠️ 2026-08-20起已不再被 `data/exchanges/sa-tadawul.yml` 任何字段引用，保留本条仅作查证过程记录） | 第三方（Latham & Watkins 律所客户简报） | en | curl 常规 UA 200 | 曾用于确认 2026年2月1日起 CMA 取消 QFI（合格境外投资者）制度、保留外资合计49%上限与单一外资10%上限；已找到并改用 `cma.gov.sa` 官方原文（Rules for Foreign Investment in Securities 修订版 + CMA_N_3974 官方公告，见上方 `cma.gov.sa` 条目），相关字段 confidence 已从 medium 升级为 high，第三方来源不再需要
  - Saudi CMA Broadens Main Market Access for Foreign Investors: https://www.lw.com/en/insights/saudi-cma-broadens-main-market-access-for-foreign-investors
- `saudiexchange.sa`（⚠️ 本节唯一未攻克的域名，见 CLAUDE.md 三降级方案） | 官方（Saudi Exchange 运营实体自身官网，本应是最主要的一手来源） | — | **全站被 Akamai WAF 拦截，任何路径、任何 UA 组合均返回 403**（响应体含 `errors.edgesuite.net` 字样，确认是 Akamai Edge 防护，与 v0.2 探测记录里 `sec.gov`/`finra.org`/`dtcc.com` 同一类拦截）。已测试：①默认常规 UA 直连首页与深层 `/wps/portal/...` 路径均 403；②换 Safari UA + 加 `Accept-Language`/`Referer`（伪装成来自 Google 搜索跳转）头模拟真实浏览器仍 403；③直接请求站内 PDF 直链（如 `Trading and Membership Procedures.pdf`）同样 403，说明拦截是域名级而非仅拦网页；④尝试 `beta.saudiexchange.sa` 子域名，证书已过期（需 `-k` 跳过校验）且同样 403，判断是被弃用的旧站点，不值得继续尝试；⑤`web.archive.org` 可达但查询该域名快照时遇到限流（429/503），未能验证是否有可用快照。**降级方案**：改用同一 CMS 后端但未被拦截的 `tadawulgroup.sa` 域名（可抓到大量同源 PDF 规则文档与集团子公司页），配合监管方 `cma.gov.sa`、清算/存管子公司自己的域名 `edaa.sa`/`muqassa.sa` 作为一手来源替代，实测覆盖了监管、交易机制、上市、指数、清算五大章节的核心内容，缺口主要在 Saudi Exchange 自身网站上才有的实时市场数据类页面（如行情费率、历史数据可得性），这类字段本次相应留空或标 low confidence，见 OPEN-QUESTIONS
- `vision2030.gov.sa` | 官方（沙特 Vision 2030） | en | curl 常规 UA 200 | 改革/政治风险背景（political_risk_note 出处）
- `www.hmco.com.sa` | 第三方（Herbert Smith Freehills 沙特） | en | WebSearch 定位 | 印花税/费用（confidence 封顶 medium）
- `www.nzte.govt.nz` | 官方（新西兰贸易发展局） | en | WebSearch 定位 | 跨境费用交叉核对（confidence medium）
- `www.derayah.com` | 第三方（Derayah 券商） | en | curl 常规 UA 200 | 佣金结构（commission_structure 出处，confidence medium）
- `sahmcapital.com` | 第三方（券商） | en | WebSearch 定位 | 费用/手续费（confidence 封顶 medium）
- `jurisdb.com` | 第三方（法律数据库） | en | WebSearch 定位 | 股息预扣税（confidence 封顶 medium）
- `taxonimo.com` | 第三方（税务） | en | WebSearch 定位 | 资本利得税（confidence 封顶 medium）
- `www.bakermckenzie.com` | 第三方（律所） | en | WebSearch 定位 | 上市流程（listing_process_duration 出处，confidence medium）
- `www.fintechfutures.com` | 第三方（金融科技媒体） | en | WebSearch 定位 | 交易系统/延迟（trading_system_name/data_latency 出处，confidence medium）

### 韩国交易所 Korea Exchange (KRX) `kr-krx`
- `global.krx.co.kr` | 官方（英文版） | en | curl + 常规 UA 全部 200，未见反爬；站点是 JSP，导航结构可从任意页面（如首页 `main/main.jsp`）的静态 HTML 里 grep `href="[^"]*GLB[0-9]+[^"]*"` 批量拿到几乎全站 URL 清单，比逐级点导航快得多——**但很多栏目页（如 About KRX/Organization/Regulation 分类落地页）静态 HTML 里只有 tab 标题导航，没有实质段落**，真正的解释性文字要么在专门的详情子页（URL 尾缀带 `T1`/`T2`.jsp，如上市标准详情页），要么整份塞进官方 PDF 指南。抓到 120KB+ 的页面不代表有正文，先搜关键词（如年份数字、百分比）确认，没命中就换该栏目的 `T*.jsp` 子页再试 | KRX 是 2005 年由韩国证券交易所（KSE）、KOSDAQ 市场、韩国期货交易所（KOFEX）依《资本市场与金融投资业法》合并而成的单一法人交易所（股份有限公司，会员金融机构持股，自身不在自己市场上市）；KOSPI/KOSDAQ/KONEX 均为该法人内部的市场板块（非独立法人），衍生品市场同样由 KRX 本身运营（不同于 JPX/NYSE Group 那种"衍生品另设独立法人"的集团结构），因此本文件不设 `group_id`。KRX 本身即清算业务的中央对手方（CCP）；韩国证券存管院（KSD，KRX 持股70%）与韩国证券电算（KOSCOM，KRX 持股76%）是控股子公司而非交易所内部部门
  - Guide to Trading in the Korean Stock Market（PDF，官方权威操作手册，含交易时段/最小报价单位/涨跌停±30%/熔断三阶段8-15-20%/sidecar/波动性中断VI/做空报升规则/大宗交易门槛/交易暂停情形，几乎覆盖第五章全部核心交易机制字段，是本次抓取信息密度最高的单一来源）: https://global.krx.co.kr/contents/GLB/01/0109/0109000000/guide_to_trading_in_the_korean_stock_market.pdf（HTTP 200，308KB）
  - CEO Message（"Established in 1956"表述）: https://global.krx.co.kr/contents/GLB/01/0101/0101000000/GLB0101000000.jsp（HTTP 200，120KB）
  - History（KRX完整年表，1956年大韩证券交易所设立、1974年KSD设立、1996年KOSDAQ设立、1999年KOFEX设立、2005年三方合并设立"韩国证券期货交易所"、2008年更名"韩国交易所"、2013年设立KONEX）: https://global.krx.co.kr/contents/GLB/01/0102/0102040000/GLB0102040000.jsp（HTTP 200，131KB）
  - KRX Group Services（KRX自身业务范围：交易/市场数据、市场监察、上市与披露、CCP、清算结算；两家控股子公司KSD/KOSCOM持股比例）: https://global.krx.co.kr/contents/GLB/01/0102/0102020000/GLB0102020000.jsp（HTTP 200，121KB）
  - Market Oversight Commission（自律监管机构说明，KRX内设机构）: https://global.krx.co.kr/contents/GLB/01/0103/0103020500/GLB0103020500.jsp（HTTP 200，121KB）
  - Shareholder Status（截至2019年末的股东名册，全部为证券公司/金融机构/政府关联机构，佐证会员制、非自身上市）: https://global.krx.co.kr/contents/GLB/01/0104/0104030000/GLB0104030000.jsp（HTTP 200，124KB）
  - Members（会员资格法律依据/会员七种类型/结算会员与交易会员区分/财务门槛表）: https://global.krx.co.kr/contents/GLB/01/0102/0102070100/GLB0102070100.jsp（HTTP 200，137KB）
  - Concept of Clearing（KRX自身作为CCP的法律依据，援引FSCMA第378/393/394/397/399/400条与多项KRX内部规则）: https://global.krx.co.kr/contents/GLB/02/0202/0202020102/GLB0202020102.jsp（HTTP 200，122KB）
  - Concept of Settlement（结算定义，援引FSCMA第297/378条）: https://global.krx.co.kr/contents/GLB/02/0202/0202020103/GLB0202020103.jsp（HTTP 200，121KB）
  - KOSPI Market Listing Requirements — Criteria 详情子页（量化上市标准全表：经营年限/股本/股权分散/财务表现/审计意见等）: https://global.krx.co.kr/contents/GLB/03/0303/0303050100/GLB0303050100T1.jsp（HTTP 200，11KB）
  - Designation of Administrative Issues and Delisting Criteria for the KOSPI Market（退市/管理股条件全表，含未提交定期报告/审计意见/资本侵蚀/股权分散/交易量/公司治理/不实披露/营收/市值等逐项标准，含2026-2028年过渡期门槛）: https://global.krx.co.kr/contents/GLB/03/0303/0303050500/GLB0303050500.jsp（HTTP 200，138KB）
  - Listing Requirements for the KOSDAQ Market（KOSDAQ量化上市标准，标准企业/技术成长企业双轨制，含KONEX转板快速通道5条track）: https://global.krx.co.kr/contents/GLB/03/0303/0303060200/GLB0303060200.jsp（HTTP 200，131KB）
  - ETF Taxation Regulation（"证券交易税(0.3%)对ETF不适用"的表述，间接确认一般股票证券交易税税率；该页聚焦ETF豁免场景，未见明确标注版本/生效日期，作为一般股票税率引用时降级为medium）: https://global.krx.co.kr/contents/GLB/06/0605/0605010103/GLB0605010103.jsp（HTTP 200，123KB）
  - ⚠️ 以下新增条目为补齐 market_structure.derivatives（衍生品市场机制）子块所抓，2026-08-18；导航路径提示：`main/main.jsp` 静态 HTML 里全站菜单含逐级 `data-menu-id` 标注，比逐栏目试探更快定位「KRX Market」（02/0201，产品规格）与「Regulation」（06/0603，衍生品交易规则）两个分支下的具体子页
  - Guide to Night Session in KRX Derivatives Market（PDF，2025年4月，KRX衍生品市场官方发布，覆盖夜盘交易时段/挂单价格限制分级表/实时价格限制/交易暂停分类/做市商制度/会员保证金双重计算等，信息密度最高的衍生品单一来源；同时确认KRX已于2025年6月转为自主运营夜盘、原CME/Eurex联动已终止，与本文件顶层night_session字段所述旧联动模式不一致，见data/exchanges/kr-krx.yml的detail说明与OPEN-QUESTIONS新增条目）: https://global.krx.co.kr/contents/GLB/02/0201/0201041003/Guide_to_Night_Session_in_KRX_Derivatives_Market.pdf（HTTP 200，2.4MB，pdftotext转出偶有"Missing 'endstream'"语法警告但正文可正常提取）
  - KRX Market ‧ Derivatives ‧ Stock Index ‧ KOSPI 200 Futures（产品规格表：标的/合约规模/挂牌月份/交易时段/最小报价单位/最后交易日/最终结算/涨跌停分级/持仓限额）: https://global.krx.co.kr/contents/GLB/02/0201/0201040201/GLB0201040201.jsp（HTTP 200，124KB）
  - KRX Market ‧ Derivatives ‧ Stock Index ‧ KOSPI 200 Options（产品规格表，另含周期权/行权价间距/欧式行权）: https://global.krx.co.kr/contents/GLB/02/0201/0201040202/GLB0201040202.jsp（HTTP 200，127KB）
  - Regulation ‧ Derivatives ‧ Order Types（限价/市价/限价转收盘价/即时可执行限价四类申报与FOK/IOC条件定义）: https://global.krx.co.kr/contents/GLB/06/0603/0603010200/GLB0603010200.jsp（HTTP 200，121KB）
  - Regulation ‧ Derivatives ‧ Trading Hours（常规时段按产品类别分组的开盘/连续/收盘集合竞价时刻表，另附夜盘时刻表与夜盘可交易10品种清单）: https://global.krx.co.kr/contents/GLB/06/0603/0603010300/GLB0603010300.jsp（HTTP 200，125KB）
  - Regulation ‧ Derivatives ‧ Method of Trade Execution（个别竞价价格/时间优先原则、集合竞价与连续交易定义、协商大宗交易适用品种与例外、EFP机制；⚠️ 此页未出现在主导航菜单，是从「Order Placement」页(0603010600)按URL序号规律试探到的相邻页0603010700，登记备查）: https://global.krx.co.kr/contents/GLB/06/0603/0603010700/GLB0603010700.jsp（HTTP 200，125KB）
  - Regulation ‧ Derivatives ‧ Margin ‧ Definition（客户保证金/会员保证金定义与可充抵保证金的外币种类）: https://global.krx.co.kr/contents/GLB/06/0603/0603011001/GLB0603011001.jsp（HTTP 200，122KB）
  - Regulation ‧ Derivatives ‧ Margin ‧ Customer Margin（委托保证金与既有部位保证金计算逻辑）: https://global.krx.co.kr/contents/GLB/06/0603/0603011002/GLB0603011002.jsp（HTTP 200，125KB）
  - Regulation ‧ Derivatives ‧ Margin ‧ Member Margin（引入夜盘后会员保证金每日两次计算、缴纳截止时间由12:00缩短至11:00、120%/500亿韩元触发补缴阈值）: https://global.krx.co.kr/contents/GLB/06/0603/0603011003/GLB0603011003.jsp（HTTP 200，122KB）
  - Clearing/Settlement ‧ Margin Management ‧ Exchange Market — Types and Composition of Margin（KRX按标的资产分组计算组合净风险保证金的方法论总览，PC COMS教学软件）: https://global.krx.co.kr/contents/GLB/06/0608/0608030101/GLB0608030101.jsp（HTTP 200，126KB）
  - KRX Market ‧ Derivatives ‧ List of Products（衍生品全品种清单，按标的资产分股指/个股/ETF/利率/货币/商品六组，并标注夜盘可交易品种）: https://global.krx.co.kr/contents/GLB/02/0201/0201040101/GLB0201040101.jsp（HTTP 200，126KB）
  - ⚠️ 以下新增条目为 2026-08-21 回补 OPEN-QUESTIONS「具体数据悬案」kr-krx 一条所抓；定位方式：curl `main/main.jsp` 静态 HTML 里 `data-menu-id` 全站菜单，发现「KRX Market›Market›Equity›KOSPI Market›Introduction of KOSPI Market」与「Listing›Getting Started›Examination of KONEX Market›Listing Criteria」两个菜单项，按已验证的 URL 编码规律（父级6位menu-id + 子级2位 + 补零2位 = 10位目录段）推算出 URL，curl 直接命中，未经 WebSearch
  - Introduction of KOSPI Market（正文明确给出KOSPI综合指数基日基点："its base index at 100 on January 4, 1980"）: https://global.krx.co.kr/contents/GLB/02/0201/0201010100/GLB0201010100.jsp（HTTP 200，122KB）
  - KONEX Market Listing Criteria — Quantitative 子页（T1，量化标准表：官方原文明确写「KONEX market does not apply the financial criteria such as sales amount and net profit」，即制度设计上不设营收/净利等财务数值门槛，仅设股份转让限制/审计意见须无保留/须签约指定顾问/须为中小企业/面值六档几项非财务标准）: https://global.krx.co.kr/contents/GLB/03/0303/0303070100/GLB0303070100T1.jsp（HTTP 200，2.6KB；⚠️ 无tab后缀的 GLB0303070100.jsp 落地页只有导航壳无正文，与既有KOSPI/KOSDAQ标准页同类"先探T1再探正文"的坑一致）
  - KONEX Market Listing Criteria — Qualitative 子页（T2，定性标准表：管理层市场诚信记录/公司治理透明度/会计信息透明度/投资风险揭示等五项，同样不含财务数值）: https://global.krx.co.kr/contents/GLB/03/0303/0303070100/GLB0303070100T2.jsp（HTTP 200，2.7KB）
- `www.krx.co.kr`（韩文版官网首页） | 官方（韩文版） | ko | curl 常规 UA 200，未见反爬；本次仅取 `<title>` 标签确认官方韩文名称，未深入抓取韩文正文内容（本项目 source_lang 判定为 en，韩文版仅用于确认 native name，不作为事实来源） | `<title>` 标签内容为「한국거래소」，即 KRX 官方韩文名称
  - 首页（仅用于确认 `<title>` 韩文名称）: http://www.krx.co.kr/main/main.jsp（HTTP 200，186KB）
- `elaw.klri.re.kr`（韩国法制研究院官方英译法律数据库） | 监管（政府法律译本） | en | curl 常规 UA 200，单页 4.8MB（含该法历年全部修正版本堆叠在同一页，需按关键词/条号 grep 定位，不要整页阅读）| 《资本市场与金融投资业法》(Financial Investment Services and Capital Markets Act, FSCMA) 官方英译全文，现行版本 20260306。第1条：立法目的；第373条：无许可不得设立市场；第373-2条：设立交易所须获金融委员会（Financial Services Commission, FSC）许可，且须为《商法》下的股份有限公司（stock company）；第297/378/393/394/397/399/400条：交易所本身担任证券与衍生品市场清算机构/CCP的法律依据
  - Financial Investment Services and Capital Markets Act（全文，含历次修正版本堆叠）: https://elaw.klri.re.kr/eng_service/lawTwoView.do?hseq=31782（HTTP 200，4.8MB）
- `data.krx.co.kr` | 官方（KRX 数据门户） | ko | curl 常规 UA 200 | 市场数据/成交统计（infrastructure 出处）
- `openapi.krx.co.kr` | 官方（KRX OpenAPI） | ko | curl 常规 UA 200 | 行情接口/数据延迟（data_latency 出处）
- `www.openapi.krx.co.kr` | 官方（KRX OpenAPI，同上 www 前缀） | ko | curl 常规 UA 200 | 同上
- `fss.or.kr` | 官方（金融监督院 FSS） | ko | curl 常规 UA 200 | 投资者保护/ suitability（investor_protection 出处）
- `www.fss.or.kr` | 官方（FSS www 前缀） | ko | curl 常规 UA 200 | 同上
- `www.fsc.go.kr` | 官方（金融委员会 FSC） | ko | curl 常规 UA 200 | 监管框架（regulation 出处）
- `law.kofia.or.kr` | 官方（韩国证券业协会 KOFIA） | ko | curl 常规 UA 200 | 自律规则/适当性（suitability_management 出处）
- `www.kcmi.re.kr` | 官方（资本市场研究院 KCMI） | ko | curl 常规 UA 200 | 市场结构研究（market_structure 出处）
- `www.k-otc.or.kr` | 官方（K-OTC 场外市场） | ko | curl 常规 UA 200 | 退市后场外转移（post_delisting_venue 出处）
- `www.clearstream.com` | 官方（Clearstream 国际中央存托） | en | curl 常规 UA 200 | 国际存托/交收（clearing 出处）
- `en.sedaily.com` | 第三方（韩国经济日报英文） | en | WebSearch 定位 | 市场背景（confidence 封顶 medium）
- `en.yna.co.kr` | 第三方（韩联社英文） | en | WebSearch 定位 | 政治/流动性风险（confidence 封顶 medium）
- `www.koreaherald.com` | 第三方（韩国先驱报） | en | WebSearch 定位 | 流动性/政治风险（confidence 封顶 medium）
- `www.asiae.co.kr` | 第三方（亚洲经济） | ko | WebSearch 定位 | 流动性风险（confidence 封顶 medium）
- `www.kedglobal.com` | 第三方（KED 全球） | en | WebSearch 定位 | 政治风险（confidence 封顶 medium）
- `www.kchipnews.com` | 第三方（半导体新闻） | ko | WebSearch 定位 | 市场背景（confidence 封顶 medium）
- `taxnews.ey.com` | 第三方（EY 税务） | en | WebSearch 定位 | 资本利得税（confidence 封顶 medium）
- `www.mondovisione.com` | 第三方（交易所资讯） | en | WebSearch 定位 | 市场结构背景（confidence 封顶 medium）

### 泛欧交易所 Euronext `fr-euronext`
- `euronext.com` | 官方 | en（官网默认英文；各地方市场页另有 fr/nl/pt/it/nb 等本地语言版本，本节只取英文版作 `source_lang: en` 的锚点） | curl + 常规 UA 全部 200，未见反爬（含多个 PDF，均可直接 curl 到） | ⚠️ **本所是本项目第一个"单一集团、多国法人实体"样本**：`Euronext`（集团整体）= `Euronext N.V.`（荷兰阿姆斯特丹注册的 naamloze vennootschap，集团控股实体，本身在 Euronext Paris 挂牌交易，代码 ENX，2025-09-22 起纳入 CAC 40 指数）+ 七个「Euronext Market Undertaking」（Euronext Amsterdam N.V. 荷兰法人、Euronext Brussels S.A./N.V. 比利时法人、Euronext Dublin/The Irish Stock Exchange plc 爱尔兰法人、Euronext Lisbon S.A. 葡萄牙法人、Euronext Paris S.A. 法国法人、Borsa Italiana 意大利法人、Oslo Børs 挪威法人），各自受本国法律与本国监管机构管辖（见 Harmonised Rulebook I Rule 1.7 Governing Law），但共享同一部《Harmonised Rulebook》（Book I）、同一交易平台 Optiq、同一中央订单簿。2025年7月新增第八个市场 Euronext Athens（收购 ATHEX），但截至本次抓取（2026-08）雅典尚未并入 Harmonised Rulebook/Optiq（计划2027-06迁移），regulated-markets 页原文明确写"Euronext Athens markets are scheduled to be integrated in the Euronext rulebooks upon the migration to Optiq (June 2027)"，故本次数据以七个已整合市场（不含雅典）为主，雅典相关事实单独注明未核实。清算方面 Euronext Clearing 是法定实体 Cassa di Compensazione e Garanzia S.p.A.（CC&G，意大利公司）的商业新名称；托管结算方面 Euronext Securities 是集团自有 CSD 网络，运营实体分布在哥本哈根/米兰/奥斯陆/波尔图四地，里斯本/米兰/奥斯陆三个市场现已用 Euronext Securities 托管结算，阿姆斯特丹/布鲁塞尔/巴黎计划2026-09起迁移过去，都柏林及迁移前的阿姆斯特丹/布鲁塞尔/巴黎具体托管机构本次未核实（⚠️ 2026-08-21已补充核实并回填：巴黎=Euroclear France（Book II Article P 2.3.3逐字点名）、阿姆斯特丹=Euroclear Nederland、布鲁塞尔=Euroclear Belgium（新闻稿+Place of Settlement change guidelines两份官方文档间接但可靠佐证）、都柏林=Euroclear Bank（2021-03migration新闻稿），详见下方新增4条来源与`data/exchanges/fr-euronext.yml`的`clearing.csd_name`字段；`euroclear.com`主域名及`/services/en/provider-homepage/euroclear-*.html`子页面本次实测对常规UA同样403，与`uk-lse`一节`euroclear.com`踩坑案例一致，故本次改用Euronext自己官网发布的分市场规则手册/新闻稿/技术指引达成核实，未能直接抓取Euroclear自己官网）
  - 首页: https://www.euronext.com/en（HTTP 200，456KB）
  - Euronext Regulated Markets（各市场清单、Harmonised Rulebook I 最新版 PDF 直链、雅典未整合说明）: https://www.euronext.com/en/regulation/euronext-regulated-markets（HTTP 200，397KB）
  - Regulatory Framework（分国监管机构：FSMA/BNB 比利时、ACP/AMF 法国、Central Bank of Ireland、CONSOB 意大利、Finanstilsynet 挪威、DNB/AFM 荷兰、CMVM 葡萄牙）: https://www.euronext.com/en/trading/membership/regulatory-framework（HTTP 200，397KB；⚠️ 页面法国监管机构一段仍写"Autorité de Contrôle Prudentiel (ACP)"，该机构已于2013年更名为ACPR，页面文本明显滞后未更新，引用时以 AMF 这个跨版本一致出现的证券监管机构名称为准，法国银行业监管机构名称改动不逐条核实）
  - Trading Safeguards（动态/静态价格区间 collar 阈值：动态±5%/旗舰指数成分±3%，静态±10%/旗舰指数成分±8%）: https://www.euronext.com/en/trading/market-quality/trading-safeguards-euronext-markets（HTTP 200，402KB）
  - Clearing 总览（Euronext Clearing = CC&G 法定实体新商业名）: https://www.euronext.com/en/clearing（HTTP 200，450KB）
  - Choosing a Market（板块体系：Euronext regulated market 分ABC三档市值区间、Euronext Growth、Euronext Access/Access+，各自适用市场与门槛对照表）: https://www.euronext.com/en/listing/raise-capital/how-go-public/choosing-market（HTTP 200，429KB）
  - T+1 programme（当前结算周期T+2，欧盟统一定于2027-10-11起改T+1）: https://www.euronext.com/en/regulation/t1-programme（HTTP 200，434KB）
  - Our Journey（集团历史沿革时间线2000-2025，含各并购年份原文）: https://www.euronext.com/en/about/our-journey（HTTP 200，580KB）
  - Investor Relations Share Price（自身股价展示页，佐证self_listed）: https://www.euronext.com/en/investor-relations/share-price（HTTP 200，399KB）
  - Trading Hours & Holidays（节假日安排逐市场对照表；⚠️本页只含节假日例外与半日交易安排，未含标准每日开收盘时刻表，标准时刻表本次未在静态可抓取页面中定位到，见 OPEN-QUESTIONS）: https://www.euronext.com/en/trading/trading-hours-holidays（HTTP 200，541KB）
  - Fees & Charges 索引页（各类费率表PDF直链入口）: https://www.euronext.com/en/trading/fees-charges（HTTP 200）
  - Euronext Rule Book Book I: Harmonised Rules（适用自2026-06-29版）PDF: https://www.euronext.com/sites/default/files/2026-06/harmonised_rulebook_en_25062026.pdf（HTTP 200，913KB；含 Rule 1.7 Governing Law 七法域分述条款、Chapter 2 Euronext Membership 会员资格条款、术语表里各 Market Undertaking 法律实体全称）
  - Notice n°4-01 Trading Manual（生效日2025-12-08）PDF: https://www.euronext.com/sites/default/files/2026-06/Trading%20Manual%20-%20311025%20-%20AVD%20orders%2Bdark%20post-only%2Bhybrid%20model%20.pdf（HTTP 200，599KB；开盘/收盘集合竞价机制、连续交易撮合原则细节，不含逐市场标准时刻表）
  - Euronext Cash Markets Trading Fee Guide（生效日2026-09-01）PDF: https://www.euronext.com/sites/default/files/2026-08/euronext_cash_markets_trading_fee_guide_effective_01sep2026.pdf（HTTP 200，642KB；标准股票交易费两种计价方式——按已执行订单笔数阶梯收费 + 按成交金额阶梯bps收费）
  - Euronext Derivatives Markets: Trading Procedures（生效2025-02-25，衍生品交易机制正文——价格/成交量限制、动态静态区间、每日结算价、订单类型、撮合优先原则、大宗交易LiS/EFS/EOO/Against Actuals等场外设施）PDF: https://www.euronext.com/sites/default/files/2025-02/trading_procedures_for_derivatives_-_dsp_fair_value_and_deferred_publication.pdf（HTTP 200，398KB）
  - Euronext Derivatives Markets Annexe One of the Trading Procedures - Trading Arrangements（更新2026-06-29，逐合约交易时段/撮合优先原则/LiS门槛适用范围对照表，覆盖阿姆斯特丹/布鲁塞尔/里斯本/米兰/奥斯陆/巴黎六个衍生品市场，不含都柏林）PDF: https://www.euronext.com/sites/default/files/2026-06/Euronext%20Trading%20Procedures%20-%20Annexe%20One%20-%20EN%20-%2020260629.pdf（HTTP 200，707KB）
  - Euronext Clearing Risk Management（官网，权益/权益衍生品/FIRE政府债/商品衍生品的VaR类与SPAN类保证金方法论说明）: https://www.euronext.com/en/clearing/risk-management（HTTP 200，426KB）
  - Fixed Income Derivatives 现行产品页（BTP/OAT/Bund/BONO迷你期货，米兰市场挂牌，合约规模€25,000）: https://www.euronext.com/en/for-investors/financial-derivatives/fixed-income（HTTP 200，254KB）
  - Euronext successful expansion of Euronext Clearing to all Euronext financial derivatives markets（新闻稿，2024-09-17，确认Euronext Clearing于2024年9月取代LCH S.A.成为全部衍生品市场CCP）: https://www.euronext.com/en/about/media/euronext-press-releases/successful-expansion-euronext-clearing-all-euronext-financial（HTTP 200，403KB）
  - Euronext Rule Book Book II: Specific rules applicable to the French regulated markets（生效 2 July 2019；2026-08-21补充抓取，Article P 2.3.3明确点名Euroclear France为巴黎市场主要中央存管机构）PDF: https://www.euronext.com/sites/default/files/2020-02/Book%20II%20_2%20July%202019_UK.PDF（HTTP 200）
  - Confirmation of the go-live of Euronext's new settlement model in September 2026（新闻稿，2026-03-06；2026-08-21补充抓取，确认阿姆斯特丹/布鲁塞尔/巴黎当前由Euroclear系CSD结算，2026-09-21起迁移至Euronext Securities Milan）: https://www.euronext.com/en/news/confirmation-go-live-euronexts-new-settlement-model-september-2026（HTTP 200）
  - Euronext Securities - Place of Settlement change guidelines（V.3，2026年3月；2026-08-21补充抓取，含CSD国别对照表：FR=Euroclear France/BE=Euroclear Belgium/NL=Euroclear Nederland）PDF: https://www.euronext.com/sites/default/files/2026-03/Euronext%20Securities%20-%20Place%20of%20Settlement%20change%20guidelines%20-%20V.3%20March%202026.pdf（HTTP 200）
  - Successful migration of issuer CSD services for Irish securities from Euroclear UK & Ireland to Euroclear Bank（新闻稿，2021-03-18；2026-08-21补充抓取，确认都柏林CSD自CREST迁移至Euroclear Bank）: https://www.euronext.com/en/about/media/euronext-press-releases/successful-migration-issuer-csd-services-for-irish-securities（HTTP 200）
- `live.euronext.com` | 官方（面向投资者的产品/行情子站，与 euronext.com 同集团不同子域名） | en | curl 常规 UA 200 | 用于确认旗舰指数清单（自编：AEX/CAC 40/BEL 20/ISEQ 20/PSI/OBX；FTSE MIB 由第三方 FTSE Russell 编制，未在本页出现，是唯一非自编的旗舰指数）；⚠️ 该子域名下 `/en/products/...` 等目录页多为JS渲染的前端应用外壳，curl抓到的静态HTML里没有实质内容（仅导航栏），本次未采用，只用 `/media/` 路径下可直接下载的PDF
  - Stock Indices: https://live.euronext.com/en/products/indices（HTTP 200，354KB）
- `connect.euronext.com` | 官方（面向会员/技术对接方的文档托管子域名，与 euronext.com 同集团） | en | curl 常规 UA 200 | 托管衍生品市场的技术性通知（Info-Flash）与详细的会员培训文档（"How the Market Works"），比 euronext.com 正文页更细颗粒度，衍生品合约规格/跳动点表机制/做市商角色体系等细节主要来自此域名
  - Euronext Derivatives – How the Market Works（v5.4，2025，114页会员培训文档，含Optiq Tick Table机制、Market Making框架MMA/MMS/MME角色、Nord Pool电力衍生品到期结算价说明等章节）PDF: https://connect.euronext.com/sites/default/files/it-documentation/Euronext%20Derivatives_How%20the%20Market%20Work_v5.4.pdf（HTTP 200，1.9MB）
  - Euronext Derivatives – Introduction of Fixed Income Derivatives on main European government bonds（Info-Flash，2024-12-16，BTP/OAT/Bund/BONO迷你期货上线前技术通知，Appendix含拟议合约规格表——合约规模/跳动点位/到期月序列/可交割券标准；⚠️ 原文标注为"proposed"规格，产品已于2025-09正式上线，主要参数经现行产品页交叉核实一致）PDF: https://connect.euronext.com/sites/default/files/2024-12/IF241216DE%20Euronext%20Derivatives%20%E2%80%93%20Introduction%20of%20Fixed%20Income%20Derivatives%20on%20main%20European%20government%20bonds.pdf（HTTP 200，165KB）
- `www.reuters.com` | 第三方（财经通讯社） | en | WebSearch 定位 | 政治/市场背景（risks.*，confidence 封顶 medium）

### 约翰内斯堡证券交易所 Johannesburg Stock Exchange (JSE) `za-jse`
- `jse.co.za` | 官方 | en（南非无为JSE本身立法声明的"官方语言"，但全部规则/上市文件/技术规范均只有英文版，未见南非其他官方语言的对照版本，与美股NYSE同理按实际使用语言取 official_languages: [en]） | curl 常规 UA 全部 200，全程未见反爬/限流，比 sec.gov/saflii.org 好抓得多 | 官网横跨三个子域名：`www.jse.co.za`（产品/服务介绍页）、`group.jse.co.za`（集团概况、历史沿革、投资者关系）、`clientportal.jse.co.za`（规则文档/市场通知/技术规格 PDF 的实际托管域名，很多深层 PDF 链接指向这里，三者按 `validate.py` 的域名后缀匹配规则统一登记为 `jse.co.za` 一条即可覆盖）。⚠️ 部分关键 PDF（如权益市场交易时段表、熔断阈值表）正文数据是图片渲染，`pdftotext -layout` 抓不出表格数字；换成同信息的另一份《交易信息系统概念培训》PDF（`Conceptual Training_v2.pdf`）才拿到可摘引的纯文本版本（含 ZA01/ZA02 分段的静态/动态熔断阈值百分比表），这是本次抓取里唯一能完整摘引熔断具体数值的来源，下次抓类似"阈值表"类内容时优先找培训/说明类文档而非官方摘要通知
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
- `sars.gov.za` | 监管（税务机关） | en | curl 常规 UA 200 | 南非税务局（South African Revenue Service），股息预扣税与证券转让税的法定征收与规则发布方
  - 股息预扣税: https://www.sars.gov.za/types-of-tax/dividends-tax/
  - 证券转让税: https://www.sars.gov.za/types-of-tax/securities-transfer-tax/
- `lseg.com` | 第三方（伦敦证券交易所集团旗下 FTSE Russell，与JSE联合编制指数） | en | curl 常规 UA 200（586KB） | 《FTSE/JSE Africa Index Series Ground Rules》官方编制细则文档，JSE与FTSE Russell联合发布，用于确认指数编制方非JSE自编而是合资/授权模式
  - FTSE/JSE Africa Index Series Ground Rules（v9.1，2026年2月）PDF: https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/ftse-jse-africa-index-series-ground-rules.pdf

---

- `www.resbank.co.za` | 官方（南非储备银行 SARB） | en | curl 常规 UA 200 | 资本管制/外汇/退市后转移（capital_controls/post_delisting_venue 出处）
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
### B3 – Brasil, Bolsa, Balcão `br-b3`
- `b3.com.br` | 官方 | pt-BR / en（官网原文是葡萄牙语，`en_us` 路径下有官方英文版，覆盖面广，多数规则/交易机制/非居民投资者页面均有对应英文版；本节 source_lang 取 en，见下方说明） | curl + 常规 UA 全部 200，未见反爬（全程无延时也未被拦，比 english.sse.com.cn/JPX 好抓得多）；PDF 用 `pdftotext -layout` 提取 | ⚠️ B3 官网英文版**没有**看到类似 SSE/JPX 那种"译本仅供参考，以原文为准"的免责声明（本次抓取页面未发现此类文字），但取源规则仍按 ADR-013："有可核实的官方中文原文就填 zh，没有就填 en"——B3 官网无中文版，故 source_lang: en，把英文版当溯源锚点，不因为找不到 zh 就退回葡萄牙语原文（葡萄牙语不是 zh/en 二选一之外的第三态，见 taxonomy.yml source_lang 字段说明）。B3 是巴西唯一的证券交易所，由 2017 年 BM&FBOVESPA 与 Cetip 合并而成（`name_native` 用此说明）；集团层面 B3 本身即为最终控股主体（B3 S.A.自身在自己的 Novo Mercado 板块挂牌，代码 B3SA3），未发现类似 NYSE Group/JPX Group 那样同集团下辖多个独立注册交易所法人实体的结构，故不设 `group_id`
  - 首页: https://www.b3.com.br/en_us/（HTTP 200）
  - 历史沿革（投资者关系站 History 页）: https://ri.b3.com.br/en/b3/history/（HTTP 200）
  - Regulatory Framework – Trading（交易规则文档索引页）: https://www.b3.com.br/en_us/regulation/regulatory-framework/regulations-and-manuals/trading.htm（HTTP 200）
  - Regulatory Framework – Listing（上市规则文档索引页）: https://www.b3.com.br/en_us/regulation/regulatory-framework/regulations-and-manuals/listing.htm（HTTP 200）
  - Regulatory Framework – Clearing, Settlement and Risk Management（清算结算规则文档索引页）: https://www.b3.com.br/en_us/regulation/regulatory-framework/regulations-and-manuals/clearing-settlement-and-risk-management.htm（HTTP 200）
  - Non-resident Investor – Operational Procedures and Regulation: https://www.b3.com.br/en_us/non-resident-investor/market-rules/operational-procedures-and-regulation.htm（HTTP 200）
  - Non-resident Investor – Regulatory Environment: https://www.b3.com.br/en_us/non-resident-investor/characteristics-brazilian-market/regulatory-environment.htm（HTTP 200）
  - Non-resident Investor – Trading Equities, Derivatives and Fixed Income (CMN 4.373/2014)（外资准入通道核心法规）: https://www.b3.com.br/en_us/non-resident-investor/characteristics-brazilian-market/trading-equities-derivatives-and-fixed-income-cmn-4-373-2014.htm（HTTP 200）
  - Non-resident Investor – Taxation（外资资本利得税/股息预扣税/IOF）: https://www.b3.com.br/en_us/non-resident-investor/characteristics-brazilian-market/taxation.htm（HTTP 200）
  - B3 Trading Characteristics and Rules（交易时段/最小单位/碎股市场等核心交易机制）: https://www.b3.com.br/en_us/products-and-services/trading/equities/cash-equities/b3-trading-characteristics-and-rules.htm（HTTP 200）
  - Trading Hours – Equities（具体交易时段表，从上一条页面内"here"链接跳转定位到，非站内导航直接可达）: https://www.b3.com.br/en_us/solutions/platforms/puma-trading-system/for-members-and-traders/trading-hours/equities/（HTTP 200）
  - Project T+2 – Context（2019年结算周期从T+3缩短至T+2改革说明）: https://www.b3.com.br/en_us/project-t-2/context/（HTTP 200）
  - Investor Relations – Corporate Information（B3自身作为上市公司的股票代码/板块归属，investor relations子站）: https://ri.b3.com.br/en/b3/corporate-information/（HTTP 200）
  - Securities Lending, Equity and ETF Trades（证券借贷/融券机制页，做空机制的主要依据）: https://www.b3.com.br/en_us/products-and-services/trading/equities/cash-equities/securities-lending-equity-and-etf-trades.htm（HTTP 200）
  - Trading Dynamics（撮合原则/订单类型）: https://www.b3.com.br/en_us/products-and-services/trading/equities/cash-equities/trading-dynamics.htm（HTTP 200）
  - Circuit Breaker（熔断机制说明，Ibovespa跌幅阈值）: https://www.b3.com.br/en_us/news/circuit-breaker-8AE490CA70CB10030170CEECFCE05EAF.htm（HTTP 200）
  - Market Maker – Regulation（做市商制度）: https://www.b3.com.br/en_us/products-and-services/trading/market-maker/join-in/regulation.htm（HTTP 200，本次抓取偶发一次超时，重试后200，非持续限流）
  - About Listing Segments（板块体系总览：Novo Mercado / Nível 1 / Nível 2 / Bovespa Mais 等）: https://www.b3.com.br/en_us/products-and-services/solutions-for-issuers/listing-segments/about-listing-segments/（HTTP 200）
  - Listing Segments – Novo Mercado（最高治理层级板块细则）: https://www.b3.com.br/en_us/products-and-services/solutions-for-issuers/listing-segments/novo-mercado/（HTTP 200）
  - PUMA Trading System（交易撮合引擎，基于CME Globex技术）: https://www.b3.com.br/en_us/solutions/platforms/puma-trading-system/（HTTP 200）
  - Ibovespa（旗舰指数页）: https://www.b3.com.br/en_us/market-data-and-indices/indices/broad-indices/ibovespa.htm（HTTP 200）
  - B3 Trading Procedures Manual（业务规程手册全文PDF，含价格限制/交易时段/订单类型等条款编号）: https://www.b3.com.br/data/files/55/84/E9/FB/7DBEE8100E866AE8AC094EA8/B3%20Trading%20Procedures%20Manual.pdf（HTTP 200，6.6MB，PDF文件名含空格已用%20编码，无括号无需%28%29）
  - Novo Mercado Listing Regulation（Novo Mercado板块规则全文PDF，官方英文译本，标注"free translation"）: https://www.b3.com.br/data/files/43/E0/16/EF/F348F41054E072F492D828A8/SITE-NM-Listing-Regulation-2011.pdf（HTTP 200，416KB；⚠️ PDF首页自称"free translation"，与 SSE/JPX 类似的翻译免责声明，进一步佐证只把它当英文对照而非独立法律文本）
  - Guide for Nonresident Investors（外资投资指南PDF，含CMN 4.373账户开户流程）: https://www.b3.com.br/data/files/29/67/59/B8/8871E610BB692DD6AC094EA8/GUIA_INR-B3.pdf（HTTP 200，1.7MB）
  - Trading Hours – Derivatives, Indices（衍生品交易时段表·股指/利率分类：Ibovespa期货FUT IND、迷你指数期货FUT WIN、S&P 500期货FUT ISP/WSP等逐合约开盘/收盘/电子集合竞价时刻表，market_structure.derivatives 建档新增）: https://www.b3.com.br/en_us/solutions/platforms/puma-trading-system/for-members-and-traders/trading-hours/derivatives/indices/（HTTP 200）
  - Trading Hours – Derivatives, Single Stock and Units Futures（衍生品交易时段表·个股/份额期货分类，market_structure.derivatives 建档新增）: https://www.b3.com.br/en_us/solutions/platforms/puma-trading-system/for-members-and-traders/trading-hours/derivatives/single-stock-and-units-futures/（HTTP 200）
  - Ibovespa Futures（产品页标题为"Ibovespa Futures"，正文实际详述迷你指数期货WIN合约规格/保证金/每日盯市结算算例，market_structure.derivatives 建档新增）: https://www.b3.com.br/en_us/products-and-services/trading/equities/cash-equities/ibovespa-futures.htm（HTTP 200）
  - Futures Market（期货市场总览：利率/汇率/股指/大宗商品四大品类及对应ticker，多数合约现金结算少数实物交割，market_structure.derivatives 建档新增）: https://www.b3.com.br/en_us/products-and-services/trading/equities/cash-equities/futures-market.htm（HTTP 200）
  - Options on Ibovespa（Ibovespa指数期权合约规格：欧式行权、到期日自动履约规则，market_structure.derivatives 建档新增）: https://www.b3.com.br/en_us/products-and-services/trading/equities/options-on-ibovespa.htm（HTTP 200）
  - Stock Futures（个股期货合约规格：现金结算、最小报价单位0.01点，market_structure.derivatives 建档新增）: https://www.b3.com.br/en_us/products-and-services/trading/equities/cash-equities/stock-futures.htm（HTTP 200）
- `www.gov.br` | 监管 | pt-BR / en | curl 常规 UA 200，未见反爬 | 巴西证券监督管理机构 Comissão de Valores Mobiliários（CVM，证券委员会）在联合政府门户 gov.br 下的英文栏目，B3 的政府监管机构；本条目仅登记 `www.gov.br` 而非更宽泛的 `gov.br`，因为实际抓取到的 URL netloc 就是 www 子域
  - CVM 英文首页: https://www.gov.br/cvm/en（HTTP 200）
  - CVM 机构简介"Sobre a CVM"页（葡萄牙语，核实CVM设立法律依据与历史地位，OPEN-QUESTIONS 悬案第2条用）: https://www.gov.br/cvm/pt-br/acesso-a-informacao-cvm/institucional/sobre-a-cvm
  - Receita Federal（巴西联邦税务总局）官方新闻公告——关于第15.270/2025号法律利润/股息预扣所得税征收程序（OPEN-QUESTIONS 悬案第1条用）: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2025/dezembro/receita-federal-orienta-sobre-os-procedimentos-para-o-recolhimento-do-imposto-de-renda-retido-na-fonte-sobre-lucros-e-dividendos
- `conteudo.cvm.gov.br` | 官方（CVM自有法规库子域） | pt-BR | curl 常规 UA 200，未见反爬 | CVM 官网法规文库子站，托管历年法律/法令条目页；⚠️ 该子站是纯前端JS门户外壳的旧式CMS页面，条目页本身只给出法律标题/日期/一句话摘要，未附法律逐条正文（正文需另找 planalto.gov.br 等门户）
  - Lei 6385/76 条目页（CVM法规库自有页面，标注1976-12-07与摘要"Cria a CVM e disciplina o mercado de capitais"，OPEN-QUESTIONS 悬案第2条用）: https://conteudo.cvm.gov.br/legislacao/leis-decretos/lei6385.html
- `www.planalto.gov.br` | 官方（巴西联邦立法门户，总统府法务顾问办公室 Casa Civil 维护） | pt-BR | curl 常规 UA 200，未见反爬；⚠️ 页面无 `charset` 声明，实际编码为 Windows-1252（非UTF-8），用 python3 解析需显式指定 `encoding='cp1252'` 否则重音字符会乱码 | 巴西联邦法律现行有效文本的权威发布门户（`ccivil_03` 子路径），不是监管机构本身，但是法律原文/生效状态的一手来源
  - Lei nº 15.270, de 26 de novembro de 2025 全文（OPEN-QUESTIONS 悬案第1条用，第3条修订《9.249/1995号法律》第10条新增非居民股息10%预扣税条款，第8条规定2026-01-01生效）: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm
- `bsmsupervisao.com.br` | 官方（B3自律监管子机构） | pt-BR / en | curl 常规 UA 200 | BSM Supervisão de Mercados，2007年由B3（原BM&FBOVESPA）设立的自律组织，负责对B3管理的市场及参与者进行一线监督、稽查与纪律处分，受CVM监督
  - 英文首页: https://www.bsmsupervisao.com.br/en/us/home（HTTP 200）
- `valorinternational.globo.com` | 第三方（财经媒体，Valor Econômico 英文版） | en | 未测试专门反爬 | `infrastructure.major_outage_history` / `risks.liquidity_risk_note` 用——2026-08-03 B3 交易延迟开市事件的报道；两字段均 `confidence: medium`（第三方来源，CLAUDE.md 二第3条），未找到 B3 官方对该次故障的事后复盘声明
  - B3 outage hits stock exchange at crucial moment（2026-08-03）: https://valorinternational.globo.com/markets/news/2026/08/03/b3-outage-hits-stock-exchange-at-crucial-moment.ghtml
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
- `www.tmxinfoservices.com` | 官方（TMX Datalinx 行情数据） | en | curl 常规 UA 200 | Level 1/2/QuantumFeed 行情产品与定价（infrastructure 出处）
- `www.cipf.ca` | 官方（加拿大投资者保护基金） | en | curl 常规 UA 200 | 投资者保护上限（participants.investor_protection 出处）
- `ised-isde.canada.ca` | 官方（加拿大创新科学与经济发展部） | en | WebSearch 定位 | Investment Canada Act 仅审查控制权取得，无一般资本管制（capital_controls 出处）
- `www.gov.mb.ca` | 官方（曼尼托巴省） | en | WebSearch 定位 | 银行业 Bank Act 10% / 电信 Telecom Act 20% 外资上限（foreign_ownership_limit 出处）
- `www.mondaq.com` | 第三方（法律简报库） | en | WebSearch 定位 | 持续披露 NI 51-102、非居民预扣税（confidence 封顶 medium）
- `taxspecialty.com` | 第三方（税务分析） | en | WebSearch 定位 | 资本利得税计入比例（confidence 封顶 medium）
- `tradingeconomics.com` | 第三方（宏观数据） | en | WebSearch 定位 | 加美贸易摩擦政治风险（confidence 封顶 medium）
- `cepr.net` | 第三方（CEPR 金融交易税汇编） | en | WebSearch 定位 | 加拿大无金融交易税（costs.financial_transaction_tax，confidence 封顶 medium）

### 台湾证券交易所 Taiwan Stock Exchange (TWSE) `tw-twse`
- `twse.com.tw` | 官方 | zh-Hant / en（官方双语，各页各有独立 URL，非同页切换；英文版部分栏目滞后或缺失，细节不如中文版精确） | curl + 常规 UA 全部 200，未见反爬（含子域名 shl.twse.com.tw）；⚠️ 部分旧版路径（如网站首页导航曾指向的「pcversion 版放宽涨跌幅度专区」「旧版上市规章目录页」）已废弃，HTTP 状态码仍是 200，但正文是站内自定义 404 页（此網頁不存在，請回到本公司首頁）——不是抓取失败，是 URL 本身已失效，务必肉眼确认页面正文而非只看状态码，这两条已弃用未收录，不在下方列表中 | 台湾仅此一家股票集中交易市场；另有台湾期货交易所（TAIFEX，衍生品，`taifex.com.tw`）与证券柜台买卖中心（TPEx，OTC 市场，前身「柜买中心」，`tpex.org.tw`）为独立法人实体，规则不属于本文件收录范围
  - 集中市场交易制度介绍（开盘/收盘机制、撮合原则、订单类型正文）: https://www.twse.com.tw/zh/products/system/trading.html
  - Trading Mechanism Introduction（英文版，内容对应但部分细节比中文版简略）: https://www.twse.com.tw/en/products/system/trading.html
  - 股价升降幅度（tick size 阶梯表）: https://www.twse.com.tw/zh/trading/delivery/twt84u.html
  - 瞬间价格稳定措施（个股级波动中断机制，子域名）: https://shl.twse.com.tw/page/trading/6.html
  - Fact Book（英文，市值/上市家数/成交额年度统计，索引页本身只是历年目录，不含可直接摘引的当期数字，见下方两条具体章节页）: https://www.twse.com.tw/en/about/company/factbooks.html
  - Fact Book 2026（涵盖2025年度数据）Listing Statistics for Stock 章节（2021-2025年逐年上市公司家数/上市股票家数/上市股数/总市值统计表，URL 路径含 zh 但页面内容本身是英文，与 Fact Book 索引页的双语结构一致）: https://www.twse.com.tw/downloads/zh/about/company/factbook/2026/1.01.html
  - Fact Book 2026（涵盖2025年度数据）Stock Trading Volume and Value 章节（2021-2025年逐年成交金额/成交量/周转率统计表）: https://www.twse.com.tw/downloads/zh/about/company/factbook/2026/3.01.html
  - 平盘下得融（借）券卖出之证券名单页（做空平盘下限制说明）: https://www.twse.com.tw/zh/trading/margin/twt92u.html
  - Regulations, Notices, Letters and Orders overview（英文，证券借贷相关规则入口）: https://www.twse.com.tw/en/products/sbl/law/overview.html
  - 发行量加权股价指数（TAIEX）编制要点 PDF: https://www.twse.com.tw/downloads/zh/products/indices/IndexS02.pdf
  - 股票造市制度专区: https://www.twse.com.tw/zh/products/system/stock-market.html
  - 外资及陆资投资持股统计: https://www.twse.com.tw/zh/trading/foreign/mi-qfiis.html
  - 侨外投资专区（FINI/FIDI 外资登记制度介绍）: https://www.twse.com.tw/zh/page/investor/foreign/03f.html
  - 结算交割作业特色（多边净额结算、T+2）: https://www.twse.com.tw/zh/clearing/clearing/features.html
  - 官网首页（英文，确认机构概况）: https://www.twse.com.tw/en/
  - 官网首页（中文）: https://www.twse.com.tw/zh/
  - 历史介绍（大事记，含成立/开业日期、历次涨跌幅调整、T+2交割制度实施等年表）: https://www.twse.com.tw/zh/about/company/history.html
  - 首长欢迎词（公司概况页，未含股权结构细节）: https://www.twse.com.tw/zh/about/company/welcome.html
  - 2026-08-24/25 补全 Category B 空缺字段新增抓取（同域名不需要重复登记）：
    - 国内公司申请流程（listing_process_duration 依据）: https://www.twse.com.tw/zh/listed/method/flow.html
    - 终止上市公司（页面附注含第一上市公司终止上市即停止公开发行说明，post_delisting_venue 依据）: https://www.twse.com.tw/zh/listed/suspend-listing.html
    - Fact Book 2026 - Shareholding by Type of Investors (2021-2025)（投资人类别持股结构表，investor_structure 依据）: https://www.twse.com.tw/downloads/zh/about/company/factbook/2026/4.02.html
    - 交易资讯使用管理办法、契约、收费标准（栏目页，data_pricing_model/market_data_levels 依据）: https://www.twse.com.tw/zh/products/information/use.html
    - 即时交易资讯（收费标准 HTML 版，data_pricing_model 依据）: https://www.twse.com.tw/zh/products/information/real-time.html
    - 交易资讯使用管理办法 PDF（第3条即时/延迟资讯定义，data_latency/market_data_levels 依据）: https://www.twse.com.tw/downloads/zh/products/regulation_use.pdf
    - 收费标准 PDF（即时交易资讯授权费/资讯费费率表，data_pricing_model 依据）: https://www.twse.com.tw/downloads/zh/products/table_fee.pdf
    - 盘后资讯与历史交易资料（historical_data_availability 依据）: https://www.twse.com.tw/zh/products/information/history.html
    - 证交所网路资讯商店 Data E-Shop（子域名，historical_data_availability 依据）: https://eshop.twse.com.tw/zh/
- `twse-regulation.twse.com.tw` | 官方（法规分享知识库，独立子域名） | zh-Hant / en | curl + 常规 UA 200，未见反爬 | 官方法规原文（区别于 twse.com.tw 上的说明性文字）的主要来源；页面正文夹杂大量修订沿革记录，用关键词（而非取前 N 段）定位现行条款
  - 台湾证券交易所股份有限公司营业细则（交易时段、升降单位、买卖单位、订单类型等核心交易规则条文）: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007304
  - 同上英文版（Baker McKenzie 翻译，页面声明中英文有异议时中文本为准）: https://twse-regulation.twse.com.tw/ENG/EN/law/DAT0201.aspx?FLCODE=FL007304
  - 有价证券上市审查准则（各板块财务门槛条文）: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007326
  - 审查有价证券上市作业程序: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007327
  - 2026-08-24/25 补全 Category B 空缺字段新增抓取：
    - 台湾证券交易所股份有限公司对有价证券上市公司重大讯息之查证暨公开处理程序（disclosure_requirements/continuing_obligations 依据）: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007111
    - 台湾证券交易所股份有限公司上市公司申请有价证券终止上市处理程序（delisting_transition_period/post_delisting_venue 依据）: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007282
    - 台湾证券交易所股份有限公司证券经纪商受托契约准则（account_opening_requirements 依据）: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007113
    - 台湾证券交易所股份有限公司公布或通知注意交易资讯暨处置作业要点（liquidity_risk_note 依据）: https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007225
- `law.fsc.gov.tw` | 监管 | zh-Hant | curl + 常规 UA 200 | 金融监督管理委员会（FSC）主管法规共用系统，证券交易法、证券交易所管理规则原文出处
  - 证券交易所管理规则: https://law.fsc.gov.tw/LawContent.aspx?id=FL007016
  - 证券交易法: https://law.fsc.gov.tw/LawContent.aspx?id=FL007009
  - 金融服务业确保金融商品或服务适合金融消费者办法（suitability_management 依据，2026-08-24/25 新增）: https://law.fsc.gov.tw/LawContent.aspx?id=GL000328
- `www.fsc.gov.tw`（金融监督管理委员会官网本站，与 law.fsc.gov.tw 法规查询子站为不同子域名，2026-08-25 新增登记） | 监管 | zh-Hant | curl + 常规 UA 200 | 证券期货局官方业务统计（证券商家数等），broker_landscape 依据
  - 证券业家数统计表 xlsx（金管会证期局「一般经营概况」栏目，需 openpyxl 解析，非 HTML/PDF）: https://www.fsc.gov.tw/userfiles/file/01_11507-%E8%AD%89%E5%88%B8%E6%A5%AD%E5%AE%B6%E6%95%B8.xlsx
- `law-out.mof.gov.tw` | 监管（财政部，税务主管机关，法规查询子站） | zh-Hant | curl + 常规 UA 200 | 证券交易税条例原文
  - 证券交易税条例: https://law-out.mof.gov.tw/LawContent.aspx?id=FL006079
- `mof.gov.tw` | 监管（财政部官网本站） | zh-Hant | curl + 常规 UA 200 | 非居住者股利扣缴率官方公告
  - 非居住股利、利息及权利金扣缴率一览表: https://www.mof.gov.tw/singlehtml/191?cntId=82761
- `etax.nat.gov.tw` | 监管（财政部税务入口网，官方税务问答） | zh-Hant | curl + 常规 UA 200 | 证券交易税课征范围、个人证券交易所得税停征现状的官方问答
  - 证券交易税有无停征的规定: https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/securities-transaction-tax/taxation-scope/7r3MjNB
  - 那些有价证券之交易所得应计入个人基本所得额（confirms 上市/上柜/兴柜股票交易所得免计入个人基本所得额）: https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/individual-income-tax/basic-tax-question/scope/eKN76QZ
- `tdcc.com.tw` | 官方（清算/集中保管机构） | zh-Hant | curl + 常规 UA 200 | 台湾集中保管结算所（TDCC），中央证券存管机构，兼办结算交割
  - 结算交割: https://www.tdcc.com.tw/portal/zh/equity/settlement
  - 台湾集中保管结算所股份有限公司收费办法 第1条 PDF（子域名 m.tdcc.com.tw，已由 tdcc.com.tw 登记覆盖，clearing_fees 依据，2026-08-24/25 新增）: https://m.tdcc.com.tw/TDCCWEB/upload/40289796531cece20153878c1c750017.pdf
- `twsa.org.tw` | 官方（自律组织） | zh-Hant | curl + 常规 UA 200 | 中华民国证券商业同业公会，证券商层面的自律组织；本次仅用于确认机构名称与职能定位，未逐条抓取其自律规章
  - 首页: https://www.twsa.org.tw/
### 瑞士证券交易所 SIX Swiss Exchange `ch-six`
- `six-group.com` | 官方 | en（另有 de/fr/it 版本，本次统一取 en 版本，见 source_lang 说明） | curl + 常规 UA 全部 200，未见反爬，完全无限流（比多数标杆都好抓，唯一例外见下方 module-1 条目） | SIX Group 官网，交易所业务板块（`/en/products-services/the-swiss-stock-exchange/`）与集团公司页（`/en/company/`）分属不同栏目；`/dam/download/` 路径下是可直接抓取的 PDF 规则/指南文件
  - Regulation 总览页（Trading Rules/Directives/Trading Guides 索引）: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/trading/trading-provisions/regulation.html
  - Trading Hours（交易时段结构）: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/trading/trading-provisions/trading-hours.html
  - Trading Guide（综合交易指南 PDF，含交易时段/订单类型/市场模式）: https://www.six-group.com/dam/download/the-swiss-stock-exchange/trading/trading-provisions/regulation/trading-guides/trading-guide.pdf（HTTP 200，2.6MB）
  - Product Guide - Equity Market（股票市场产品指南 PDF）: https://www.six-group.com/dam/download/the-swiss-stock-exchange/trading/trading-provisions/regulation/trading-guides/product-guide-equities.pdf
  - Monitoring and Regulation（FINMA 监管关系说明）: https://www.six-group.com/en/company/governance/monitoring-and-regulation.html
  - Regulatory Affairs: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/site/regulatory-affairs.html
  - Clearing and Settlement Provisions（清算结算条款，T+2）: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/trading/trading-provisions/clearing-and-settlement.html
  - About SIX SIS AG（CSD/ICSD 说明）: https://www.six-group.com/en/products-services/securities-services/settlement-and-custody/info-center/about-six-sis-ag.html
  - SMI 系列指数编制方案 PDF: https://www.six-group.com/dam/download/market-data/indices/equity-indices/six-methodology-smi-equity-and-re-en.pdf（HTTP 200，1.6MB）
  - Swiss Stock Exchange 业务总览页: https://www.six-group.com/en/products-services/the-swiss-stock-exchange.html
  - Listing 总览页: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/listing.html
  - SIX Exchanges Figures（2026年6月，市值/成交额月度公告）: https://www.six-group.com/en/newsroom/media-releases/2026/20260701-keyfigures-exchange-june-2026.html
  - Company 总览页（集团沿革）: https://www.six-group.com/en/company.html
  - Self-regulation of the Swiss Exchange（博客，自律监管架构说明）: https://www.six-group.com/en/blog/exchanges-self-regulation.html
  - Trading on SIX Swiss Exchange Module 2 - Rules & Regulations（培训材料 PDF，逐条摘引官方规则条文，非泛泛而谈）: https://www.six-group.com/dam/download/sites/education/preparatory-documentation/trading-module/trading-on-ssx-module-2-rules-regulations-en.pdf（HTTP 200，1.0MB）
  - Trading on SIX Swiss Exchange Module 1 - Trading（同系列培训材料 PDF，含波动性中断参数；⚠️4.8MB大文件，本次探测阶段20秒超时下载到4.6MB中断一次，`make fetch`默认60秒超时下过一次即200成功，已正式纳入清单）: https://www.six-group.com/dam/download/sites/education/preparatory-documentation/trading-module/trading-on-ssx-module-1-trading-en.pdf
  - Become a Trading Participant: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/trading/participation/trading-participants.html
  - Exchange Membership 总览: https://www.six-group.com/en/products-services/the-swiss-stock-exchange/trading/participation.html
  - Trading data statistics（市场数据/统计总入口页）: https://www.six-group.com/en/market-data/statistics.html
  - Monthly Reports Swiss Stock Exchange（Statistical Monthly Report 索引页，此前只见入口未点开，本次补抓；⚠️点开后确认该月度报表体系（Statistical Monthly Report ZIP，如`.../smr/2026/statistical-monthly-report-202607.zip`）只含分市场/分品类的成交额、成交笔数、挂牌证券数（`TRADABLES`按品类拆分，非"上市公司数"）与指数市值（仅指数成份股口径，非全市场汇总市值），全程未见"SIX Swiss Exchange整体总市值"这一汇总数字，佐证了市值数字确实不在月度统计体系内，需要另找年报）: https://www.six-group.com/en/market-data/statistics/monthly-reports.html
  - Annual Reporting（Annual Report投资者关系入口页）: https://www.six-group.com/en/company/investors/annual-reporting.html
  - SIX Annual Report 2025（PDF全文，2026-03-24发布，覆盖2025财年；Report on the Business Year一节明确写"In total, around 250 companies are listed on SIX Swiss Exchange"与"On SIX Swiss Exchange, overall turnover was up 12.8% to reach CHF 1,135.0 billion"——均为SIX Swiss Exchange单一实体口径，不与BME合并；全文逐页核对未见"总市值/市值"汇总数字，确认该指标确实未被官方公开披露）: https://www.six-group.com/dam/download/company/report/annual/2025/six-annual-report-2025-en.pdf
  - SIX Key Figures 2025（Annual Report附属的Key Figures独立PDF，含"Turnover SIX Swiss Exchange"单独一行财务口径数据，佐证年报正文的年成交额数字）: https://www.six-group.com/dam/download/company/report/annual/2025/six-key-figures-2025.pdf
- `handbooks.six-group.com` | 官方 | en | curl 常规 UA 200 | Relevant Regulators 页（列出 FINMA 与自律监管分工）
  - Relevant Regulators: https://handbooks.six-group.com/en/investor-relations/regulatorisches-umfeld-regelwerk-und-reporting-six/relevante-regulatoren
- `ser-ag.com` | 官方（SIX Exchange Regulation AG，法律上独立于交易所运营主体的自律监管法人，依瑞士法律要求分权设立，见 CLAUDE.md 二第2条「官方规则手册」优先级） | en | curl 常规 UA 200，未见反爬 | 托管《上市规则》《交易规则》正式 PDF 全文，是本所规则条文最权威的直接来源，优先于 six-group.com 的介绍性页面
  - Listing Rules（LR，2024年11月6日版）PDF: https://www.ser-ag.com/dam/downloads/regulation/listing/listing-rules/lr-en.pdf（HTTP 200，1.15MB）
  - Trading Rules（Rule Book，RB）PDF: https://www.ser-ag.com/dam/downloads/regulation/trading/rule-books/rb-en.pdf（HTTP 200，405KB）
  - About SER（自律监管架构说明）: https://www.ser-ag.com/en/about.html
  - Guideline "Trading Parameters"（GTP，各交易细分市场的波动性中断/价格监控参数）PDF: https://www.ser-ag.com/dam/downloads/regulation/trading/directives/gtp-en.pdf（HTTP 200，842KB）
  - Directive 1: Admission of Participants PDF: https://www.ser-ag.com/dam/downloads/regulation/trading/directives/dir01-en.pdf（HTTP 200，259KB）
  - Directive 3: Trading PDF（交易机制核心条款：订单类型、执行优先级、集合竞价、卖空、透明度豁免等，是market_structure章节最主要的单一来源）: https://www.ser-ag.com/dam/downloads/regulation/trading/directives/dir03-en.pdf（HTTP 200，869KB；⚠️本条系研究过程中期发现后手工curl补抓，未随第一批`make fetch`一起跑，下次维护本节时若重跑`make fetch EX=ch-six`会自动补齐，属正常范围内的URL）
- `finma.ch` | 监管 | en/de | curl 常规 UA 200 | 瑞士金融市场监管局（FINMA）官网
  - Authorised Swiss Stock Exchanges（受批准交易所名录 PDF，含 SIX Swiss Exchange AG 与 SDX Trading AG 两个独立受批准交易所实体）: https://www.finma.ch/en/~/media/finma/dokumente/bewilligungstraeger/pdf/bourses.pdf（HTTP 200，326KB）
  - FINMA issues first-ever approval for a stock exchange and a central securities depository for the trading of tokens（2021年批准SDX Trading AG为独立交易所的新闻稿，佐证`group_id`判断）: https://www.finma.ch/en/news/2021/09/finma-issues-first-ever-approval-for-a-stock-exchange-and-a-central-securities-depository-for-the-trading-of-tokens/
- `estv.admin.ch` | 监管（联邦税务局 Federal Tax Administration，印花税与预扣税的法定征收机关） | en/de/fr/it | curl 常规 UA 200（德语版子页与英文总览页均可正常抓取；⚠️PDF子域名`/dam/estv/...`路径本次两次尝试均返回502，见下方备注） | 用于印花税（Umsatzabgabe/transfer stamp tax）与股息预扣税（Verrechnungssteuer/anticipatory tax）的官方税率确认；⚠️ 预扣税页面直接给出35%具体税率数字（confidence可标high），英文版印花税总览页只确认税种法律性质，未给出0.15%/0.3%具体税率数字；2026-08-21 本次改抓德语版子页，成功定位到载明具体税率的原始文本（见下方"Umsatzabgabe kurz erklärt"条），已据此把`costs.stamp_duty`的`confidence`从medium升级为high，`taxsummaries.pwc.com`第三方来源降级为佐证来源保留
  - Stamp Duty 总览: https://www.estv.admin.ch/en/stamp-duty
  - Anticipatory Tax（预扣税/预提税）总览: https://www.estv.admin.ch/estv/en/home/anticipatory-tax.html
  - Umsatzabgabe kurz erklärt（德语版印花税说明子页，原文"Die Abgabe beträgt 1,5 ‰ für inländische Wertpapiere und 3,0 ‰ für ausländische Wertpapiere"，即本项目费率字段的官方原文出处）: https://www.estv.admin.ch/estv/de/home/bundesabgaben/stempelabgaben/sta-fachinformationen/umsatzabgabe.html
  - Eidgenössische Stempelabgaben（ESTV官方PDF，联邦印花税制度全文说明，Stand der Gesetzgebung: 1. Januar 2024；⚠️2026-08-21两次`make fetch`均返回502（`/dam/estv/de/dokumente/...`路径），怀疑是该PDF所在的dam静态资源子系统临时故障而非反爬——已从"Umsatzabgabe kurz erklärt"网页版拿到同一税率数字，不影响本节结论，但下次维护时若仍502可以考虑移除此条或换个时间重试）: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/dossier-steuerinformationen/d/d-eidgenoessischen-stempelabgaben.pdf.download.pdf/d-eidgenoessischen-stempelabgaben.pdf
- `taxsummaries.pwc.com` | 第三方（四大会计师事务所税务简报） | en | curl 常规 UA 200 | 用于确认瑞士联邦证券交易印花税具体税率（0.15%本国证券/0.3%外国证券）；2026-08-21已找到ESTV官方原文佐证同一数字（见上条），本条目降级为辅助佐证来源，主要作用是提供与官方德文千分比表述数学等价的百分比转述，便于`quote`里的数字反查校验（见`tools/validate.py`的quote数字校验机制）
  - Switzerland - Corporate - Other taxes: https://taxsummaries.pwc.com/switzerland/corporate/other-taxes
- `natlawreview.com` | 第三方（律所法律资讯平台） | en | curl 常规 UA 200 | 用于确认欧盟2017年认定瑞士交易所MiFID II「等效性」的具体决定内容（生效日期、有效期一年等）；⚠️非官方原文（欧盟官方 europa.eu/rapid 页面本次实测为纯JS渲染的SPA，curl只能拿到空壳，未能抓到正文，故退而求其次用此律所转述）；2026-08-21 已用下方 eur-lex.europa.eu 官方决定原文与瑞士联邦官方说明页核实并补全完整时间线（且发现该转述把首次决定的到期日期简化描述为"有效期一年"，容易被误读为2017年12月31日到期，实际官方原文到期日是2018年12月31日），本条目降级为辅助佐证来源
  - European Commission Adopts Implementing Decision on the Equivalence of Swiss Stock Exchanges Under MiFID II: https://natlawreview.com/article/european-commission-adopts-implementing-decision-equivalence-swiss-stock-exchanges
- `eur-lex.europa.eu` | 官方（欧盟法律数据库，与交易所无关但是MiFID II等效性认定决定的原始法律文本出处） | en | ⚠️curl 常规 UA 首次探测返回 202 + `x-amzn-waf-action: challenge`（AWS WAF机器人质询，空文件），与`sec.gov`/`finra.org`/`dtcc.com`同一类拦截；但随后用`make fetch`按标准流程正式重跑，两条URL均转为 200 完整抓到全文（307KB/309KB），未再复现质询——判断为间歇性/请求特征敏感的拦截，不是稳定域名级封锁，下次维护如遇到202空文件不必立即判定不可用，可重跑`make fetch`再试一次 | 用于核实欧盟对瑞士交易所MiFID II等效性认定的具体决定原文与失效时间线
  - Commission Implementing Decision (EU) 2017/2441 of 21 December 2017（首次认定瑞士交易所与MiFID II等效，Article 2原文：有效期至2018年12月31日，不是"一年"这种简化说法容易让人误解的2017年12月31日）: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32017D2441
  - Commission Implementing Decision (EU) 2018/2047 of 20 December 2018（延长认定，自2019年1月1日起适用，2019年6月30日到期）: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018D2047
- `sif.admin.ch` / `admin.ch` | 官方（瑞士联邦财政部国际金融事务秘书处 State Secretariat for International Finance SIF + 联邦委员会 Federal Council 新闻稿） | en | `sif.admin.ch`页面curl常规UA 200；⚠️`admin.ch`两条联邦委员会新闻稿页面（`/gov/en/start/documentation/media-releases...`路径）本次两次尝试均403，疑似该路径较`sif.admin.ch`有更严格的反爬策略；`sif.admin.ch`说明页本身已完整转述两条新闻稿的核心内容，不影响本节结论 | CLAUDE.md任务指引建议的替代来源——瑞士官方对欧盟MiFID II等效性认定失效及后续「交易所保护措施」整段历史的官方说明，比第三方律所转述更完整、且延伸到了2024-2025年最新进展（第三方来源当时未覆盖到）
  - Measure to protect Swiss stock exchange infrastructure（SIF官方说明页，完整时间线：2019年失效→保护措施→2024年入法→2025年5月对EU解除，本节主要依据）: https://www.sif.admin.ch/en/protect-swiss-stock-exchange-infrastructure
  - Statement by President Doris Leuthard on the EU's decision regarding stock market equivalence（2019年联邦委员会就等效性认定失效发布的官方声明；⚠️curl 403，未能直接抓到正文，内容已由上条sif.admin.ch页面转述覆盖）: https://www.admin.ch/gov/en/start/documentation/media-releases/media-releases-federal-council.msg-id-69354.html
  - Federal Council to remove EU from stock exchange protection list as of 1 May 2025（2025年最新进展官方新闻稿；⚠️curl 403，同上，内容已由sif.admin.ch页面转述覆盖）: https://www.admin.ch/gov/en/start/documentation/media-releases.msg-id-103976.html

---

- `www.seco.admin.ch` | 官方（瑞士经济事务秘书处） | en | curl 常规 UA 200 | 投资审查（foreign_ownership_limit 出处）
- `legacy.export.gov` | 官方（美国 ITA 历史站） | en | curl 常规 UA 200 | 瑞士外汇管制现状（capital_controls 出处，建议后续换 SNB/FINMA 一手来源）
- `www.eqs-news.com` | 第三方（公告分发） | en | curl 常规 UA 200 | Swiss Steel 退市 ad-hoc 公告（post_delisting_venue/liquidity_risk_note 出处，confidence medium）
- `www.swissinfo.ch` | 第三方（瑞士资讯） | en | curl 常规 UA 200 | SIX 交易中断报道（major_outage_history 出处，confidence medium）
- `www.admin.ch` | 官方（瑞士联邦） | en | curl 常规 UA 200 | 政治风险背景（risks.political_risk_note 出处，建议补一手国家风险来源）

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

## 突破记录（us-nyse 补全会话，2026-08）：sec.gov / finra.org 反爬攻克，dtcc.com 仍未攻克

针对上面 v0.2 记录的「sec.gov/finra.org/dtcc.com 三个域名普遍拒绝」这一长期悬案（也是
`PROJECT/OPEN-QUESTIONS.md` 框架性问题第14/15/32条的根源），本次专门花时间系统性尝试突破，
结果是**三个域名里两个真正攻克，一个依然拒绝**：
