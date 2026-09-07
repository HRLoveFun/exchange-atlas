# 胡志明市证券交易所 Ho Chi Minh Stock Exchange (HOSE) `vn-hose`

> 建档轨：[ADR-add-exchange-skill-forge]（用实际新增越南市场迭代 add-exchange skill，2026-09-07 起）。
> **越南市场的一手规则语言是越南语**，`source_lang: en`（`vi` 不在 [ADR-013] 的 zh/en 二分内，
> 同 `sa-tadawul`/`br-b3`/`kr-krx`）——官方英译普遍带「非官方、仅供参考」免责，据此 confidence
> 封顶 medium（同 `english.sse.com.cn`/`elaw.klri.re.kr` 先例）；越南语一手文件可作事实来源支撑
> medium（同 `kr-krx` 규정 포털韩文一手先例，[ADR-kr-krx-legacy-closeout]），不升 high。
>
> **HOSE 官网 `www.hsx.vn` 是 React SPA**，curl 只得 ~1.9KB 空壳（`main.*.js` + "You need to
> enable JavaScript"）——同 SGX 主站坑（CLAUDE.md 二）。HNX 官网 `www.hnx.vn` 同为 Vue SPA。
> 越南两所的规则文本改从 **① VNX（母公司）法规登记栏目 `vnx.vn/van-ban-phap-ly`（服务端渲染，
> PDF 附件在 `stream.vnx.vn/VNX//Legal/`）② SSC 文件服务器 `idcplg GET_FILE` 直链 ③ 法律英文库**
> 取。

- `vnx.vn` | 官方（越南交易所 VNX，HOSE + HNX 的 100% 控股母公司，2021-02-20 依 37/2020/QĐ-TTg 成立） | vi（部分 VNX 决定带英译附件，附件名含「TA」= Tiếng Anh） | curl 常规 UA 200，`/van-ban-phap-ly/{1..6}` 法规登记栏目为服务端渲染（1 Nghị định 政府令/2 Thông tư 通函/3 Luật 法律/4 Quyết định 决定/6 Quy chế của VNX 业务规则）、表格行含文号+名称+发布/生效日期+附件名，可直接 grep；文档正文在 `stream.vnx.vn` 附件 PDF | HOSE/HNX 共同规则框架的一手登记处——VNX 依 37/2020/QĐ-TTg「统一设计、监督两所」，交易/上市业务规则由 VNX 理事会（HĐTV）颁布、两所各自制定实施细则
  - 法规栏目·Quy chế của VNX（业务规则列表）: https://vnx.vn/van-ban-phap-ly/6
  - 法规栏目·Quyết định（决定列表，含财政部定价决定 1541/QĐ-BTC、PM 设立 VNX 的 37/2020/QĐ-TTg）: https://vnx.vn/van-ban-phap-ly/4
  - 法规栏目·Luật（法律列表，含《证券法》54/2019/QH14）: https://vnx.vn/van-ban-phap-ly/3
  - 法规栏目·Nghị định（政府令列表，含 155/2020/NĐ-CP、158/2020/NĐ-CP）: https://vnx.vn/van-ban-phap-ly/1
  - 法规栏目·Thông tư（财政部通函列表，含 119/2020/TT-BTC 登记结算、96/2020/TT-BTC 信息披露）: https://vnx.vn/van-ban-phap-ly/2
  - VNX 简介 / 职能任务页（overview.history、self_regulatory_org 出处）: https://vnx.vn/chuc-nang-nhiem-vu
- `stream.vnx.vn` | 官方（VNX 法规附件 PDF 存储，`/VNX//Legal/` 路径，文件名带上传日期前缀） | vi（QĐ 76 另有独立英译 PDF） | curl 常规 UA 200，均 `application/pdf`；大文件（QĐ22 正文 12.7MB + 附录 10.5MB、证券法 5.8MB、155 号令 8.2MB），`pdftotext -layout` 提取纯文本后 grep 条款 | 越南证券市场规则条文一手全文
  - 《VNX 上市证券的上市与交易业务规则》QĐ 22/QĐ-HĐTV 正文（Quy chế Niêm yết và giao dịch chứng khoán niêm yết；交易时段/撮合方式/价格波动幅度 ±7%·±20%/订单类型/交易单位/最小价差/交收 的一手条文；取代 2022 年 QĐ 17）: https://stream.vnx.vn/VNX//Legal/2026031816145088VNX.Quy-che-niem-yet_QD22.pdf
  - 同上·附录（Phụ lục，价差档表 / 表单模板等）: https://stream.vnx.vn/VNX//Legal/20260318161451415VNX.-PL-Quy-che-niem-yet_QD22.pdf
  - 《VNX 关于 FTSE Russell 指数调整期强化监察业务规则》QĐ 76/QĐ-HĐTV（2026-08-28，**官方英译版**，short_selling / 交易监察出处）: https://stream.vnx.vn/VNX//Legal/202608281819229476.QD-HDTV-28.08.2026-TA.pdf
  - 财政部《在 VNX 及子公司、VSDC 适用的证券领域服务价格》决定 1541/QĐ-BTC（2025-04-29，交易费 / 结算费 / 上市费费率——第十一章成本一手）: https://stream.vnx.vn/VNX//Legal/20250913170108484QD1541.QD.BTC.29042025.full.pdf
  - 《证券法》54/2019/QH14（2019-11-26 国会通过，越南语签署版；监管框架 / SSC 职权 / 上市与退市 / 信息披露 / 执法措施）: https://stream.vnx.vn/VNX//Legal/2021112211275354854.signed.pdf
  - 政府令 155/2020/NĐ-CP（细化《证券法》：上市条件 / 外资持股比例 / 公开发行；越南语签署版）: https://stream.vnx.vn/VNX//Legal/20211122161440105155.signed.pdf
  - 政府令 155/2020/NĐ-CP 附录 1（PL1）: https://stream.vnx.vn/VNX//Legal/20211122161441436155_PL1.pdf
  - 政府令 158/2020/NĐ-CP（衍生证券与衍生品市场；越南语签署版——第四/五章衍生品子块、HNX 衍生品市场出处）: https://stream.vnx.vn/VNX//Legal/20211122160710946158.signed.pdf
  - 财政部通函 34/2026/TT-BTC（2026-03-30，VNX / VSDC 证券服务的经济技术特征，国家定价——成本章补充）: https://stream.vnx.vn/VNX//Legal/202604060859492234.2026.TT.BTC_30032026.pdf
  - 财政部通函 77/2025/TT-BTC（依政府令 181/2025/NĐ-CP 细化证券经营与证券转让服务，增值税口径）: https://stream.vnx.vn/VNX//Legal/2025091515450754477-btc.pdf
  - 总理决定 37/2020/QĐ-TTg 相关（设立、组织与运行 VNX；group_id / self_regulatory_org 出处）: https://stream.vnx.vn/VNX//Legal/2021112413444382337.signed.pdf
  - 总理决定 1726/QĐ-TTg（2023-12-29，越南证券市场发展战略至 2030；overview 补充 / 市场分类升级背景）: https://stream.vnx.vn/VNX//Legal/202402021016568811726QDTTg.pdf
- `ssc.gov.vn` | 官方（越南国家证券委员会 SSC，隶属财政部；亦托管财政部证券法规英译） | vi/en（英译带官方免责「not official / for reference only」→ confidence 封顶 medium） | portal 页（`/webcenter/portal/...`）为 Oracle WebCenter JS 壳、curl 仅得 ~6.7KB "requires JavaScript"；**文档下载走 `idcplg?IdcService=GET_FILE&dDocName=<id>&dID=<id>&filename=<name>` 直链**，可 curl，均 `application/pdf` | 证券法规英文译本 + SSC 机构信息
  - 通函 99/2020/TT-BTC 英译全文（证券公司业务活动指引；participants / 做市 / 自营出处）: https://ssc.gov.vn/cs/idcplg?IdcService=GET_FILE&allowInterrupt=1&dDocName=APPSSCGOVVN1620129765&dID=130632&filename=Thong+tu+99+Tieng+Anh+%28Full+15.5.2023%29.pdf
  - 政府令 245/2025/NĐ-CP 英译（修订政府令 155/2020/NĐ-CP，含外资持股与公开发行的最新调整）: https://ssc.gov.vn/cs/idcplg?IdcService=GET_FILE&allowInterrupt=1&dID=166306&dDocName=APPSSCGOVVN1620159819&filename=Eng+-+Decree+245+amending+Decree+155+in+English+translation+final.pdf
- `vsdc.vn` | 官方（越南证券存托与清算总公司 Vietnam Securities Depository and Clearing Corporation，2023-08 由 VSD 改制；股票 CSD + 结算、衍生品市场 CCP） | vi | curl 常规 UA 200，首页 ~115KB、`/vi/gioi-thieu-chung` 等简介页部分服务端渲染可 grep；业务规则栏目多为前端渲染，需定位具体 PDF | 第八章清算结算 / guarantee_model / default_management 一手（结算周期 T+2、结算支持基金、衍生品 CCP 违约瀑布）
  - 首页: https://vsdc.vn/vi/
  - 简介（Giới thiệu chung——机构定位、职能）: https://vsdc.vn/vi/gioi-thieu-chung
- `www.sbv.gov.vn` | 官方（越南国家银行 SBV，越南盾汇率制度与外汇管理主体） | en/vi | curl 常规 UA 200，英文站 `/en/` 服务端渲染（首页 ~1.5MB）| 第十二章 fx_risk_note 一手（越南盾管理浮动、中心汇率机制、资本项目外汇管理）
  - 英文站首页: https://www.sbv.gov.vn/en/home
- `www.hsx.vn` | 官方（HOSE） | vi/en | **`www.hsx.vn` 是 React SPA，curl 仅得 1.9KB 空壳**（`<div id="HOSE">` + `main.<hash>.js`）；实质数据经 `api.hsx.vn/{a,c,i,l,m,mk,n,s}/api/v1/...` JSON 端点（端点路径需从 `main.js` 逆推，`main.js` 约 2.4MB 抓取偶超时）；文档/图片在 `staticfile.hsx.vn` | 市场统计（上市公司数 / 市值 / 参与者）、HOSE 公告
  - SPA 壳（仅确认官网域名归属，非事实来源）: https://www.hsx.vn/
- `data.iana.org` | 官方（IANA 时区数据库，时区命名权威登记处，跨所通用——`overview.timezone` / `overview.dst_rule` 出处） | en | curl 常规 UA 200，静态纯文本 | `Asia/Ho_Chi_Minh` 的 UTC 偏移（+7）与无夏令时规则
  - tzdb「asia」zone 文件（`Zone Asia/Ho_Chi_Minh` 行给出 +7 偏移、无夏令时 Rule）: https://data.iana.org/time-zones/tzdb/asia
- `en.wikipedia.org` | 第三方（百科） | en | curl 常规 UA 200 | 仅用于沿革交叉印证（成立 2000-07 为交易中心、2007 升格交易所），confidence medium 且需一手复核
  - Ho Chi Minh City Stock Exchange: https://en.wikipedia.org/wiki/Ho_Chi_Minh_City_Stock_Exchange
- `english.luatvietnam.vn` | 第三方（越南法律英文数据库 LuatVietnam） | en | curl 常规 UA 200，部分条文全文可读、部分付费墙截断 | 越南证券法规英译（框架条款交叉核对，confidence 封顶 medium）
  - 通函 120/2020/TT-BTC 英译（上市与注册交易证券的交易规定；第4条价格波动幅度、第5条熔断、第9–12条融资/当日冲销/担保卖空/做市 的框架条款——具体数值授权 SSC/VNX 规则）: https://english.luatvietnam.vn/circular-no-120-2020-tt-btc-dated-december-31-2020-of-the-ministry-of-finance-on-transaction-of-listed-shares-registration-of-transactions-and-fund-196778-doc1.html
  - 通函 111/2013/TT-BTC 英译（个人所得税法实施细则；证券转让 0.1% 税——第十一章税费出处）: https://english.luatvietnam.vn/circular-no-111-2013-tt-btc-of-august-15-2013-guiding-the-law-on-personal-income-tax-the-law-amending-and-supplementing-a-number-of-articles-of-th-80846-doc1.html
- `www.economica.vn` | 第三方（Economica Vietnam 政策研究机构，托管《证券法 2019》官方英译 PDF） | en | curl 常规 UA 200，`application/pdf` ~473KB | 《证券法》54/2019/QH14 英译全文（与越南语签署版并列引用；confidence 封顶 medium）
  - Securities Law 2019 (No. 54/2019/QH14) English PDF（URL 内 `(1)` 须编码为 `%281%29`，否则 `tools/fetch.py` 的 `URL_RE` 遇 `)` 截断——见 SKILL.md 步骤2 坑2）: https://www.economica.vn/Content/files/LAW%20%26%20REG/Securities%20Law%202019%20ENG%281%29.pdf
- `resourcehub.bakermckenzie.com` | 第三方（Baker McKenzie 跨境上市指南） | en | curl 常规 UA 200 | HOSE 概览 / 上市要求交叉核对，confidence medium
  - Cross-Border Listings Guide — Ho Chi Minh Stock Exchange: https://resourcehub.bakermckenzie.com/en/resources/cross-border-listings-guide/asia-pacific/ho-chi-minh-stock-exchange/topics/overview-of-exchange
- `the-shiv.com` | 第三方（东南亚商业资讯站，面向外国投资者） | en | curl 常规 UA 200 | KRX 系统上线后的交易机制改革要点、T+0 / 卖空「路线图未落地」现状——confidence 封顶 medium
  - The Vietnam Stock Exchange 2026: Regulations, Indexes, Development: https://the-shiv.com/the-vietnam-stock-exchange-quick-guide/
- `www.lseg.com` | 官方（伦交所集团 / FTSE Russell，市场分类决定发布方） | en | curl 常规 UA 200 | FTSE Russell 2025-09 国别分类评审——越南前沿→次级新兴升级，2026-09-21 生效
  - FTSE Russell Country Classification September 2025（2025-10-07 发布）: https://www.lseg.com/en/media-centre/press-releases/ftse-russell/2025/ftse-russell-country-classification-september-2025
- `vietnamnews.vn` | 第三方（越南通讯社旗下英文报，半官方） | en | curl 常规 UA 200 | KRX 系统上线 / FTSE 升级 / 市场结构性变化的报道，confidence medium
  - FTSE Russell upgrades Việt Nam to secondary emerging market status: https://vietnamnews.vn/economy/1726818/ftse-russell-upgrades-viet-nam-to-secondary-emerging-market-status.html
- `vietnamnet.vn` | 第三方（越南信息传媒部旗下英文报，半官方） | en | curl 常规 UA 200 | KRX 交易系统上线报道，confidence medium
  - KRX trading system goes live, marking turning point for Vietnam's stock market: https://vietnamnet.vn/en/krx-trading-system-goes-live-marking-turning-point-for-vietnam-s-stock-market-2397688.html
