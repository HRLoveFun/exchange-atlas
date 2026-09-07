# 河内证券交易所 Hanoi Stock Exchange (HNX) `vn-hnx`

> 建档轨：[ADR-add-exchange-skill-forge]（用实际新增越南市场迭代 add-exchange skill）。
> HNX 与 HOSE 同属越南交易所（VNX）控股，共用《证券法》54/2019/QH14、政府令 155/2020·
> 158/2020/NĐ-CP、财政部通函、VNX 业务规则（QĐ 22 上市与交易）与 VSDC 清算结算体系。
> **共用来源不在此重复登记全部说明**——见 `PROJECT/sources/vn-hose.md` 对 `vnx.vn` /
> `stream.vnx.vn` / `ssc.gov.vn` / `vsdc.vn` / `economica.vn` / `english.luatvietnam.vn`
> 的抓取备注；本分片补 HNX 特有来源 + 衍生品市场来源。
>
> `source_lang: en`（同 HOSE，越南语不在 ADR-013 zh/en 二分）；越南语一手 / OCR / 第三方
> 英译一律 confidence 封顶 medium。**HNX 官网 `www.hnx.vn` 是 Vue SPA**（`{{mustache}}`
> 模板，curl 得模板壳 + 部分服务端渲染文章片段）；规则文本从 VNX 法规登记栏目 +
> 政府令 + 券商托管的英文合约规格取。
>
> HNX 组织四个市场：① 上市股票市场（HNX-Index）② UPCoM 注册交易市场 ③ 政府债券市场
> ④ 衍生品市场（VN30 指数期货、政府债券期货）。本文件 `market_structure` 顶层描述上市
> 股票市场；`market_structure.derivatives` 描述衍生品市场；UPCoM / 政府债券在 boards /
> products 记录。**姊妹所 HOSE 的板块 / 规则不塞进本文件。**

- `vnx.vn` / `stream.vnx.vn` | 官方（越南交易所 VNX，HNX 母公司）| vi | 见 vn-hose.md 说明 | HNX 与 HOSE 共用的 VNX 上市与交易业务规则 QĐ 22（附录 II 含 HNX 上市股票交易时间表 / 交易单位 / 报价单位 / 涨跌幅），以及 158/2020/NĐ-CP（衍生品市场框架）
  - VNX《上市证券的上市与交易业务规则》QĐ 22 正文: https://stream.vnx.vn/VNX//Legal/2026031816145088VNX.Quy-che-niem-yet_QD22.pdf
  - VNX QĐ 22 附录 II（HNX 上市股票交易时间表：无开盘集合竞价、连续 09h00–11h30·13h00–14h30、收盘集合竞价 14h30–14h45、盘后 PLO 14h45–15h00；报价单位股票恒 100 đ；涨跌幅 ±10%·±30%）: https://stream.vnx.vn/VNX//Legal/20260318161451415VNX.-PL-Quy-che-niem-yet_QD22.pdf
  - 政府令 158/2020/NĐ-CP（衍生证券与衍生品市场：衍生品类型〔第14条〕/ 上市〔第15条〕/ 投资者资格〔第16条〕/ 市场组织〔第17条〕/ 交易〔第20条〕/ 稳定市场措施〔第21条〕/ 做市商〔第24条〕/ 清算结算〔第27–35条，VSDC 作 CCP、清算会员、保证金、风险防范机制第35条〕；越南语签署版图片型 PDF，已 tesseract OCR，sidecar 在 .cache）: https://stream.vnx.vn/VNX//Legal/20211122160710946158.signed.pdf
  - VNX 法规栏目·Quy chế của VNX（业务规则列表，含 CW 做市 QĐ 49 等）: https://vnx.vn/van-ban-phap-ly/6
- `www.hnx.vn` | 官方（河内证券交易所） | vi/en | curl 常规 UA 200；`www.hnx.vn/vi-vn/` 与 `/en-gb/` 首页 ~78KB 为 Vue SPA（`{{DataChiSo...}}` 模板占位），菜单栏「REGULATION」等为 JS；文章详情页 `/en-gb/huong-dan/chi-tiet-thu-tuc-*.html` 有部分服务端渲染正文（`New listing / Condition, dossier for listing ...`）；⚠️ WebFetch 对 hnx.vn 报证书链错误，须 curl | HNX 机构信息、上市指引、市场概览的交叉印证（confidence medium）
  - 英文站首页（仅确认域名归属与市场结构：STOCK / BOND / DERIVATIVES / CARBON PRODUCTS）: https://www.hnx.vn/en-gb/
  - 上市新股指引详情页: https://www.hnx.vn/en-gb/huong-dan/chi-tiet-thu-tuc-21-32.html
- `vsdc.vn` | 官方（越南证券存托与清算总公司） | en/vi | 见 vn-hose.md 说明 | HNX 衍生品市场的 CCP 清算结算——`Clearing and Settlement` 服务页 II 节明确：衍生品盈亏结算 T+1 现金（经越南工商银行 Vietinbank）、指数期货现金结算 T+1、政府债券期货实物交割 E+3、依 VSDC 理事会决定 26/QĐ-HĐTV（2025-04-16）
  - Clearing and Settlement（II. Clearing and settlement of derivative securities transactions）: https://vsdc.vn/en/sd/XAz40d2Q-9j569TvBgLQaQ
- `en.wikipedia.org` | 第三方（百科） | en | curl 常规 UA 200 | HNX 沿革交叉印证（2005 河内证券交易中心开业、2009 依 01/2009/QĐ-TTg 升格河内证券交易所、2017-08-10 VN30 指数期货上线），confidence medium 且需一手复核
  - Hanoi Stock Exchange: https://en.wikipedia.org/wiki/Hanoi_Stock_Exchange
- `www.ssi.com.vn` | 第三方（SSI 证券，越南头部券商，托管 HNX VN30 指数期货合约规格英文版） | en | curl 常规 UA 200，`application/pdf` | VN30 指数期货合约规格（乘数 VND 100,000/点、涨跌幅 ±7%、交易时段、月份序列、现金结算 T+1、保证金）；confidence 封顶 medium
  - VN30 – INDEX FUTURES CONTRACT Specification（英文）: https://www.ssi.com.vn/upload/files/KHCN/TA%20-SSI_HDTLVN30_English.pdf
- `www.kgieworld.sg` | 第三方（KGI 证券新加坡，托管 HNX VN30 指数期货合约规格英文说明） | en | curl 常规 UA 200 | VN30 指数期货合约规格交叉核对（乘数、涨跌幅 7%、交易时间），confidence medium
  - HNX VN30 Index Futures Contract Specifications: https://www.kgieworld.sg/futures/HNX%20VN30%20Index%20Futures%20Contract%20Specifications
