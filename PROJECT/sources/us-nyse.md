# 纽约证券交易所 New York Stock Exchange (NYSE) `us-nyse`
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
  - Fee Rate Advisories（列表页，用于核对 Latest Section 31 公告——2026-09-04 ADR-065 复核仍为 FY2026 / Feb. 27, 2026，FY2027 Section 31 公告未发布；`us-nyse`/`us-nasdaq costs.regulatory_fees` 触发点跟踪）: https://www.sec.gov/rules-regulations/fee-rate-advisories（HTTP 200，81KB）
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
