# DATA-GAP-TASK4-SPOT-CHECK.md — 任务四（[ADR-078]）第二人独立复核判定表

复核日期：2026-09-05。方法论复刻 [ADR-074]：4 个互相隔离、彼此不知情的独立复核视角（A=us-nyse 17 处、B=hk-hkex 17 处、C=cn-sse 19 处、D=uk-lse+jp-jpx 25 处），逐条核对 quote 是否原始缓存页面的逐字连续子串（`grep`/pdftotext 自查，而非只看 `make check`）、数字溯源、confidence 与来源优先级匹配、语义忠实度（双向）、消极判断、同文件跨字段一致性。底稿：`.cache/task4_review_data.md`（78 处终态导出，复核后删除）。

## 判定汇总

| 视角 | 范围 | PASS | FIX | QUESTION | 备注 |
|---|---|---|---|---|---|
| A | us-nyse 17 | 9 | 7 | 1 | 含 1 个合规空字段 |
| B | hk-hkex 17 | 13 | 1 | 3 | |
| C | cn-sse 19 | 10 | 3 | 5 | 含 2 个合规空字段；1 处占位（overview.history 当时漏写，已补） |
| D | uk-lse+jp-jpx 25 | 16 | 3 | 6 | uk 4 字段当时因 LCH PDF 无 .txt 不可核验（后解除） |
| 合计 | 78 | **48** | **14** | **15** | 初检通过率 48/65 filled = 73.8% |

## 最优先发现（零凭空编造，1 处素材错挂 + 1 处来源错挂）

1. **cn `participants.foreign_access_channel` quote 素材错挂**：原 quote「第七条 境外投资者的合格境外机构投资者证券账户…」系从来源登记批注误转写——QFII 实施规定 PDF 用「一、二、三…」条目编号、全文无「第七条」。**FIX（已订正）**：改摘缓存真实原文（第四条托管人开户、第七条 10%/30% 持股上限）。
2. **jp `costs.stamp_duty` 分档税额错挂**：分档表真实存在，但第17号文書注2明确将「株券等の譲渡代金」排除在「売上代金」之外——证券转让价款收据适用的是无分档简表（5万円未満非課税、5万円以上一律200円），原「1億円超2億円以下 4万円」是商品销售代金收据的档位。**FIX（已订正）**。
3. **jp `listing.transfer_between_boards` quote 段出处错位**：段2 逐字出自同 PDF 的 Rule 714（COVID-19 特别条款）而非第3章第2节。**FIX（已订正）**：换为 Rule 308(1) 原文。
4. **hk `listing.delisting_conditions` 6.12 条文归属错误**：替代上市路径是 6.11（仍须股东批准），6.12 恰是无替代上市的情形（另须联交所许可）。**FIX（已订正）**，quote 补 6.11/6.12 两条原文。

## 系统性发现（复核工具层，非数据错误）

4 个视角均报告一批「quote 查无缓存文本」——经协调者用 `pdftotext` 直接验证，**9 条争议 quote 全部逐字命中**（us DTCC guide、hk IM Guide v14、cn 中国结算两份办法、uk LCH EquityClear 程序手册）。根因：这批 PDF 落盘时未生成 .txt 伴随文本（`fetch_sources` 的 `doc_companion` 对「URL 以 .html 结尾但实为 PDF」的文件不触发），复核工具对二进制文件不可见。**已为 4 个 PDF 补齐 .txt 伴随**。此为 [ADR-074] 系统性问题③（「多来源合成的 high 字段」盲区）的工具层变体：`verify_quotes` 运行时会自提取 PDF 文本所以全绿，但独立复核者必须能看见同一文本层。

## FIX 明细（22 处，均已就地订正）

**us-nyse（6）**：
1. `regulation.foreign_ownership_limit` detail 残留升级前「留空」旧文案，与已填 zh/en 自相矛盾——重写并注明「无统一比例上限」的判断性质。
2. `listing.post_delisting_venue` SRC1（investor.gov 术语表）实为 403 失败页且正文 JS 渲染——移除；quote 段1 悬断句补全。
3. `clearing.last_trading_day_rule` SRC 归属错误（quote 实出自 SEC Staff Report PDF，非 clearing-agencies HTML 壳）——改指 PDF。
4. `infrastructure.data_pricing_model` 「无统一定价公开页」与 NYSE Price List 2026 的「Market Data Fees」专节直接冲突——改写并补 SRC。
5. `costs.commission_structure` 「1 May 1975」缓存查无（演讲仅 1975-06-03 落款与 May Day 概念）——改为「1975 年」；quote 词中截断「ENTIRELY CLEA」补全。
6. `costs.stamp_duty` 「不存在印花税税种」绝对化表述超出 CRS 引文支撑——收紧为「联邦层面未设立普遍适用的证券交易印花税」。

**hk-hkex（2）**：
7. `listing.delisting_conditions`（见上第 4 条）。
8. `risks.liquidity_risk_note` 「高度集中于/价差偏宽」两句无缓存文本支撑——软化为分析性措辞（制度锚点 Tier P/N 分组保留）。

**cn-sse（5）**：
9. `participants.foreign_access_channel`（见上第 1 条）。
10. `costs.dividend_withholding_tax` quote 全角标点被系统性改为半角，逐字性不成立——按缓存原文恢复。
11. `regulation.self_regulatory_org` EN 尾句与 ZH 主体论断不一致（SAC 定位）——对齐。
12. `market_structure.short_selling` 缺 quote——补新闻页逐字原文。
13. `overview.history` 漏写——补（本所简介：1990-11-26 成立/12-19 开业）。

**jp-jpx（5）**：
14. `listing.transfer_between_boards`（见上第 3 条）。
15. `costs.stamp_duty`（见上第 2 条）。
16. `listing.post_delisting_venue` 「日本亦无官方场外市场」全国性断言超出规程文本（Rule 610 只证明规程层面无承接）——降级至 detail 并标注未核实。
17. `costs.implicit_costs_note` 「券商系 PTS 与 SBI Japannext 并存」表述别扭（SBI Japannext 本身即券商系 PTS）——改写。
18. `market_structure.holidays_note` SRC 标题修正（页面实为 Market Holidays）。

**uk-lse（4）**：
19. `regulation.clearing_regulator` 复核发现留空依据已失效——同一批缓存的 LCH 费率表 PDF 内有「LCH Limited is supervised by the Bank of England」原句，据此**回填**（OPEN-QUESTIONS 第22条关闭）。
20. `listing.delisting_process` 漏写——复核确认 UKLR 21.2/21.3 原文可直接摘引，补写。
21. `risks.fx_risk_note` quote 截断丢掉罗得西亚例外但书，与同文件 capital_controls 口径不一致——补注对齐。
22. `costs.financial_transaction_tax` 「欧盟 FTT 因脱欧不适用」表述不准（EU FTT 从未生效）——修正。

## QUESTION 处置（15 项 → 存留 1）

- **10 项解除**：「quote 查无缓存文本」类（us DTCC 段2、hk IM Guide×2、cn 中国结算×4、uk LCH×4 中的可核验项）经 pdftotext 逐字验证全部成立——系复核工具可见性问题（见上）。
- **3 项转 FIX**：us stamp_duty 收紧、hk liquidity 软化、uk clearing_regulator 回填。
- **1 项转 FIX**：cn short_selling 补 quote。
- **存留 1 项（备注级，转 `OPEN-QUESTIONS.md` 第29条附注）**：cn `costs.capital_gains_tax` zh 的「现行有效」时效标注无逐字来源（判断本身与来源一致，非事实错误）。

## 终态

- 78 处中 **67 处已回填/升级**（4 视角 FIX 22 处订正后全部复验 PASS）、**11 处留空**（`OPEN-QUESTIONS.md` 第29条逐字段记录已试路径与下次入口：hk-hkex×5、us-nyse×1、uk-lse×3、cn-sse×2）。
- 零幻觉确认：78 处终态无一条 quote 查无缓存支持；发现的 2 处素材错挂/来源错挂均已换为缓存真实原文。
- `make build` 全绿（verify_quotes OK=1088 / FAIL=0）；FIX 只动 zh/en/detail/quote/sources，未动 enum/spec/confidence 结构（除 short_selling 补 quote、clearing_regulator 回填）。
- 按 [CLAUDE.md §四]，78 处终态的第二人复核关卡至此关闭；后续 11 处空字段回填后无需再整批复核，逐处自检即可。
