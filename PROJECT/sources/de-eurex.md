# 欧洲期货交易所 Eurex `de-eurex`
- `ecb.europa.eu` | 官方（货币当局——欧洲中央银行 ECB，欧元汇率政策主体；2026-09-05 新增登记，[ADR-079] 风险旗标子棒） | en（主站多语版同路径换语言码） | curl + 常规 UA 200，说明页/explainer 服务端渲染可 grep（导航占大头，跳到正文标题后读） | 欧元汇率制度（fx_risk_note 出处）；ECB 明文「汇率不是政策目标」的 explainer 是欧元区制度核的一手锚
  - What is the role of exchange rates?（ECB 官方 explainer：汇率在全球外汇市场不断变动、**The exchange rate is not a policy target of the ECB**，fx_risk_note 出处）: https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/role_of_exchange_rates.en.html（HTTP 200，103KB）
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
