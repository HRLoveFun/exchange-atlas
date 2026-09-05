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

> **汇总表口径勘误（2026-09-05 复核后自查发现，未回填数字）**：C 视角分录 10+3+5=18，比该视角范围 19 少 1（A/B/D 三个视角分录各自与范围对得上）。底稿 `.cache/task4_review_data.md` 按当时约定复核后已删除，无法复原缺的那一条属于 PASS / FIX / QUESTION 哪一栏，因此**不臆造数字凑平**——此处如实记录差异。终态结论不受这 1 条分录影响：22 处订正已就地落地并全部复验 PASS，67/67 filled 全过、11 处合规留空，零幻觉。若日后发现缺项归属，按实际值回填本表并同步更正「初检通过率」分母（65 filled 不变）。

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

---

# 第二轮整批第二人独立复核（2026-09-05，用户指定加验）

**背景与范围**：第一轮复核（上方）之后，收尾会话回填了原留空的 11 处（hk-hkex×5、us-nyse×1、uk-lse×3、cn-sse×2）并再更新 uk-lse 2 处（`holidays_note` 升 high、`major_outage_history` 换锚 2023-12-05 官方公告，commit `9f99035`）——合计 **13 处终态未经第二人复核**。虽第一轮裁定「回填后逐处自检即可」，用户 2026-09-05 指定加验一轮整批复核，本轮照办：**78 处终态全量重核**（67 处已复核字段做机器复检 + 漂移审计，13 处新终态做全视角深读）。

## 方法（四视角，与第一轮同构）

- **视角1 · 机器反查（78 处全量，脚本化 `/tmp/review_task4.py`）**：逐字段 quote 对其所引每个来源的缓存文本做 verbatim 连续窗口反查（复用 `verify_quotes.quote_in`，含 wayback 标记识别）；high 字段散文数值按 validate 真口径（至少一个 ≥2 位数字命中）+ strict 视角（逐个命中，仅信息性）双记；spec 子块按 5b 严口径（`spec_number_strings` 逐个命中）。
- **视角2 · 来源工程（78 处全量）**：来源域名是否在 SOURCES.md/分片登记（含子域归并规则）；来源是否实际落盘且 `ok:true`；medium+ 字段无来源检测。
- **视角3 · 语义保真（13 处新终态深读 + 67 处抽读）**：zh/en 主张与 quote/缓存原文逐句比对，标注推断性质是否就地声明。
- **视角4 · 结构一致 + 漂移审计**：spec↔prose↔跨字段（pre_market 时刻 vs continuous_pm vs XLSX Early Close 12:30 等）；`git diff 1cd06d3..HEAD` 限定 5 家数据文件，确认上次复核基线以来只有本收尾会话的 13 字段变化（jp-jpx 零漂移；hk-hkex 另含任务三棒3 对 `derivatives.price_limits.other_boards` 的一处 detail 改写，非任务四字段）。

## 判定汇总（第二轮）

| 视角 | 范围 | PASS | FIX | QUESTION |
|---|---|---|---|---|
| 1 机器反查 | 78 全量 | 78 | 0 | 0 |
| 2 来源工程 | 78 全量 | 78 | 0 | 0 |
| 3 语义保真 | 13 深读 + 抽读 | 13 | 2（均 detail 级） | 0 未决 |
| 4 结构一致+漂移 | 78 全量 | 78 | 0 | 0（1 项 Q 就地证伪） |
| **合计** | **78** | **76** | **2** | **0** |

- 机器层零问题：78/78 quote 逐源命中；4 处 quote 仅存于 wayback 快照（us `post_delisting_venue`/`last_trading_day_rule`/`implicit_costs_note`、hk `foreign_ownership_limit`），沿用 [ADR-075] 口径（同一官方原文的历史快照，confidence 判定不变）；strict-miss（zh/en 个别数字不在 quote、但至少一个命中）13 处，均为叙述性改写或含数字的规则名/文件名，抽读无语义风险。
- **FIX（2 处，均已订正并复验）**：
  1. us `participants.foreign_access_channel`：en「not ordinary portfolio purchases of publicly traded securities」为推断句，detail 原未给依据——补记 CRS 同报告 FDI/组合投资区分句（「It is distinct from portfolio investment…」）作为推断基础。
  2. uk `infrastructure.major_outage_history`：zh「2019年8月16日」具体到日超出 AR2019 官方口径（官方仅记「August 2019」）——detail 补注「16日」与时长/波及面同为媒体报道口径。
- **QUESTION → 就地证伪/存档（3 项，未订正数据）**：
  1. uk `pre_market` `spec.kind: pre_open_queue`（挂单排队不成交）系对 XLSX 交易循环表的结构性读表（05:05–07:50 区间无成交时段、开盘集合竞价 07:50 起）——MIT201 15.9 无盘前行为描述，属「时段时刻逐字、性质结构推断」，spec note 已声明，接受。
  2. cn `investor_structure`「其中沪股通」归属——用 2024 卷同表证实「其中: 沪股通」（其后随公募基金分项）确挂在专业机构名下，zh 表述无误。
  3. hk `foreign_access_channel`「无类似内地 QFII 的额度审批」与 hk `foreign_ownership_limit`「例外均不涉及证券市场持股」为结构性对照/清单内推理——detail 均已声明推断性质，接受。
- 本轮新引用来源的登记状态：`api.londonstockexchange.com`（官方内容 API，SPA 页数据层）、`congress.gov`、`basiclaw.gov.hk`、`state.gov`（wayback 回退）均已在分片登记且缓存 `ok:true`。

## 第二轮终态

- **78/78 filled 全部 PASS**（2 处 detail 级订正已落地复验）；11 处原留空字段全部回填，无合规空字段残留。
- 零幻觉确认维持：78 处 quote 无一条查无缓存支持；本轮未发现新的素材错挂/来源错挂。
- `make build` 全绿（selfcheck 78 不变式、validate 0/0、`verify_quotes` OK=1113 / FAIL=0）。
- 残存微缺口（非字段缺失，记录于字段 detail）：uk-lse 逐日假日表的半日市具体钟点（12:30）锚在 detail 与 XLSX 侧、cn-sse 交易占比口径（官方现期年鉴不再按投资者类型发布成交占比）。
