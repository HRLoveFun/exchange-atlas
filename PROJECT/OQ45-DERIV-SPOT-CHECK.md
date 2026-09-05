# OQ45-DERIV-SPOT-CHECK.md — 衍生品覆盖缺口回填 独立视角复核判定表

复核日期：2026-09-05。任务：对 `data/exchanges/` 四家刚完成的衍生品覆盖缺口回填做 [ADR-081] 口径独立视角盲审（复核者与执行者互不共享信念，全新上下文进场）。方法沿用 [ADR-021]/[ADR-080]/[ADR-074]：机器层（validate + verify_quotes 全跑，预期 FAIL=0）→ 逐字层（high 字段 quote 放回 `.cache/<id>/` 原始快照逐字核对，theocc.com 一律以 wayback `id_` 快照为准）→ 语义层（zh/en 忠实度、confidence 分级、负面断言支撑）→ 结构层（products 条目、子块与顶层现货字段的边界、跨字段矛盾）→ 留空合规层（[ADR-067]「断言不征收需正面文本」判据）→ 来源层（新登记 URL 落盘与 manifest 抽检）。判定词汇：PASS / FIX / QUESTION。

> 本文件按分部组织，两批复核各写各的分部、互不动对方内容：
> - `jp-jpx` / `cn-sse` 分部：由复核者 A 负责（见下方预留章节）。
> - `us-nyse` / `us-nasdaq` 分部：由复核者 B（本文件下半部）完成。

---

# 分部一：jp-jpx / cn-sse（复核者 A）

（待复核者 A 填写）

---

# 分部二：us-nyse / us-nasdaq（复核者 B）

## 判定汇总

| 所 | 复核单元 | PASS | FIX | QUESTION |
|---|---|---|---|---|
| us-nyse | 27 | 27 | 0 | 0 |
| us-nasdaq | 24 | 21 | 2 | 1 |
| 合计 | 51 | **48** | **2** | **1**（另有备注级微瑕 2 项，见 QUESTION 分级说明） |

复核单元口径：products 章期权条目组各记 1 单 + market_structure.derivatives 全部 leaf（含留空 leaf）+ clearing.derivatives 全部 leaf；同块多个留空 price_limits 子 leaf 按独立单元计。

- **机器层**：`validate.py` 20 家 0 警告 0 错误；`verify_quotes --ex us-nyse` OK=66/FAIL=0、`--ex us-nasdaq` OK=58/FAIL=0。机器绿灯之外，复核另发现 1 处 prose-有据-but-quote-缺句与 1 处元数据不一致（见 FIX）。
- **零幻觉确认**：两家本批全部抽检 quote（us-nyse 36 段、us-nasdaq 41 段，归一化 HTML 实体/连字后逐字反查缓存原文）全部命中，**未发现一条凭空编造的素材或错挂来源**。仅有的 4 处初检 FAIL 均为伪影级：3 处 HTML 实体（`&nbsp;`/`&#39;`/`&quot;`）、1 处 PDF 行尾连字（"two- sided"）。

## FIX（2 处，us-nasdaq）

1. **`market_structure.derivatives.trading_halt_mechanism` — zh/en 含 quote 未覆盖的主张**。zh「标的处于 Limit/Straddle 状态时期权不开盘」/ en "an option will not open while the underlying NMS stock is **in** a Limit or Straddle state" 在本字段 quote 四段中均无对应句；缓存 LULD FAQ 实际原文是问答体 "Q: Will an option open if the underlying NMS stock is **on** a Limit or Straddle state? A: **No**"（en 还把原文的 "on a" 转写成了 "in a"）。主张本身有缓存支撑、非幻觉，但 high 字段的断言必须 verbatim 落 quote。**修复方案**：把该 FAQ 问答原句逐字补进本字段 quote（注意保留原文 "on a" 的原貌），en 措辞随原文对齐或以 quote 为准加注。
2. **`market_structure.derivatives` 子块 7 个 leaf 缺 `verified: 2026-09-05`**：`trading_sessions.pre_market`、`continuous_am`、`lunch_break`、`after_market`、`night_session`、`block_trade`、`connect_schemes`。同块其余 14 个 leaf 均有日期，本批"leaf 级 verified 即新增"的识别口径在这 7 处断裂（对照 us-nyse 同块 21 leaf 全部带日期）。**修复方案**：统一补 `verified: 2026-09-05`（纯元数据，validate 不拦）。

## QUESTION（1 项待协调者裁定 + 2 项备注级微瑕）

1. **负面断言处置的跨文件口径不一致（提请协调者定标）**：同批次、同一认知处境（「无正面明文可引」），两家选择了不同终态——
   - us-nyse `derivatives.connect_schemes` / `volatility_interruption`：**留空** + detail 引 [ADR-082] 棒 2 判据（「不存在」需穷举性原文）；
   - us-nasdaq `derivatives.connect_schemes`（"无（未找到…官方说明…）" medium）/ `volatility_interruption`（"无自设的波动性中断" medium）：**填负面结论** + detail 声明结构性推断、按各自顶层既有字段先例。
   两边各自都有 detail 声明、均不违反铁律字面，但同一批交付两种终态会让后续读者无所适从。建议协调者明确一种口径（倾向：跟 us-nyse 的留空处置，与 [ADR-082] 更一致；若保留 nasdaq 现状，需在 [ADR-082] 或 glossary 层把「结构性推断的负面断言可 medium 入库」的边界写清楚）。
2. **备注级·quote 逐字连续性微瑕（非错误，不改亦可）**：us-nasdaq `clearing.derivatives.initial_margin_practice` quote 中 "…a 99% expected shortfall over a two-day time horizon"，govinfo 原文在 "shortfall" 与 "over" 之间夹有行内脚注标记 `\8\`——quote 跳过了标记，严格连续子串口径下不成立（语义零损失，脚注是引用标记非正文）。同类：`market_maker_scheme` NOM 60% 段的 "two-sided" 在 pdftotext 落盘为行尾连字 "two- sided"。如日后收紧 quote 连续性校验，这两处需处理；现状建议原样保留。
3. **备注级·支撑句未随引**：us-nasdaq `margin_practice_note` zh「以向 Nasdaq Regulation 提交书面通知选定为准」的逐字依据（NOM Options 13, Sec. 3(b) "Such election shall be made in writing by a notice filed with Nasdaq Regulation."）在缓存规则书内、但未进 quote。非数值、来源同字段已引，无实质风险。

## 执行者自报疑点的独立判定

| 疑点 | 判定 | 依据 |
|---|---|---|
| us-nasdaq investor.gov 两段 quote 来自 wayback 回退快照 | **PASS（内容成立）** | "An option contract generally represents 100 shares…" 与 "Generally, the expiration date…Saturday after the third Friday…" 逐字命中缓存 wayback 快照；CDX 核实该 URL 快照链健康（最近 2026-08-22，距抓取 2026-09-05 约 2 周），时效无虞。来源登记已如实记 wayback（登记行写 curl 200 与 manifest `via: wayback` 并存，属登记粒度小瑕疵，不影响核伪） |
| us-nasdaq `tick_size` 引 2019 规则书快照（执行者标 medium 并声明时效疑点） | **PASS（分级恰当）** | 三段 quote（<$3 五美分/≥$3 十美分/下单一律 1 美分）逐字命中；detail 明记 Wolters Kluwer 2019 快照 + Penny Pilot 条款载明到期日、2019 后未逐条核实——medium 是该处境下的正确终态，不应升 high |
| us-nasdaq `matching_principle` enum `price_time_or_pro_rata`（逐合约二选一） | **PASS（映射成立）** | 该 enum 档的 label 即「价格-时间优先/按比例分配（逐合约）」，词表注释明言此档专为「逐合约在时间优先与按比例分配间切换」而设；规则原文 "The Exchange will determine to apply, **for each option**, one of the following execution algorithms" 精确落档 |
| us-nyse `circuit_breaker` 引 MWCB FAQ Q10（期权随标的市场停牌且成交作废） | **PASS** | Q10 全句（含 "Any trades that occur after the halt is triggered will be nullified"）与 Q11 自动复牌句、7%/13%/20% 阈值句均逐字命中缓存 FAQ；enum/spec 与顶层 MWCB 同构、note 指明阈值见顶层，边界清晰 |
| us-nyse `holidays_note` 以「All NYSE markets observe U.S. holidays」正面坐实含期权 | **PASS（足以支撑）** | 该句逐字命中；且同页缓存含期权市场的行文佐证（早收市脚注 "1:15 p.m. for eligible options"、分市场时段表的 "American Options Arca Options" Late Close Exceptions 行）——「All NYSE markets」的覆盖范围在同页有期权侧内证，非仅凭孤句外推 |
| 两家 `price_limits` 均不设 `type: none`、留空 + detail | **PASS（符合 [ADR-067]）** | [ADR-067] 判据：`type: none` 需「完整立法/规则把约束列尽」式的结构性正面依据，不能以「查不到」充数。两家 detail 均如实写明未定位正面文本、并明确 Trading Collar/LULD 是订单级机制不冒充合约级涨跌停——留空是判据下的正确终态，反设 `none` 才违规 |

## 留空合规层

- **us-nyse 7 处留空**（`matching_principle`、`tick_size`、`price_limits.type/main_board/other_boards`、`volatility_interruption`、`connect_schemes`）：每处 detail 均写清阻断原因（Exhibit 5 为修订汇编、Rule 964NYP 仅引用级出现 / MPV 档位条文未获 / 无正面文本 / 无穷举性清单）并给「可补方向」——是「查不到」而非该填没填，全部合规。
- **us-nasdaq `block_trade` 留空**：复核独立验证了留空声明——对 208 页 NASDAQ OPTIONS RULES 缓存全文做大小写不敏感检索，**"block" 零命中**，「所引规则书快照中未见大宗交易条款」属实，留空合规。

## 结构层与来源层

- **products 条目与来源一致**：us-nyse AMEX 条目（2008 年收购、"becoming the third largest U.S. options market"）逐字命中官网历史页缓存；us-nasdaq 三条目（NOM "price/time priority…INET"、BX 以 ORA #2024-40（2024-08-13，Markets Impacted 明列 NOM/Phlx/BX Options）佐证运营中、六家 SRO 法人列名）逐字命中 govinfo FR-2025-12-23 缓存（"The Nasdaq Stock Market LLC; Nasdaq BX, Inc.; Nasdaq GEMX, LLC; Nasdaq MRX, LLC; Nasdaq PHLX LLC; Nasdaq ISE, LLC"）。集团单记录覆盖姊妹交易所法人的处理已在 products 注释声明，与既有先例一致。
- **子块与顶层边界**：两家顶层 `clearing.ccp_name` 均为 NSCC（现货语境）、derivatives 子块均按 OCC（期权语境）记录，子块注释与字段 detail 双向声明了「两回事」；`circuit_breaker`/`holidays_note` 子块引用顶层阈值与假日表、不重复手写——边界无混写。us-nasdaq `delivery_method` 的 `enum: physical` 为归纳（个股/ETF 实物为主、指数期权现金结算例外写入 zh/detail），detail 已声明、词表无「分品种」档，接受。
- **来源落盘抽检**：本批新登记 URL（theocc wayback ×2、govinfo FR ×3、sec.gov PHLX/nyseamer PDF、nasdaqtrader 规则书/时段页/ORA、investor.gov bulletin、nyse hours-calendars、纽约联储 FX 季报）全部在分片登记且 manifest `ok: true`；SR-OCC/SR-NASDAQ 公报所引文字在 govinfo 转载原文中逐字核实。
- **wayback 快照时效核对**：`equity-options-product-specifications` 快照 2025-08-08、`margin-methodology` 快照 2025-12-09（CDX 核实），与数据文件及来源登记声明一致；两页均为静态方法论/规格页，距核验日 9–13 个月，可接受（字段与登记均已如实标注快照日期）。
- **confidence 分级**：本批全部抽检字段的来源均为官方一手（SEC 备案规则、交易所规则书/官网、OCC 经 wayback、govinfo 转载公报），无第三方来源越级；反向推断（时段穷举反推无某时段）均落 medium 并在 detail 声明，`block_trade`（结构化归纳 + Arca 侧未并核）medium 自抑恰当。zh/en 互译抽检（订单类型、保证金公式、熔断条款、做市商义务）未见失真。

## 复核工具说明

复核用归一化（HTML 去标签 + `html.unescape` + NFKC + 空白折叠）后做连续子串反查，与 `verify_quotes.quote_in` 口径一致并额外覆盖 PDF 连字与实体解码；本分部抽检脚本为一次性内存脚本、未落盘。
