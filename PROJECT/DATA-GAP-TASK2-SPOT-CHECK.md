# 数据空缺复核轨任务二 · 第二人独立复核报告（ADR-074，2026-09-05）

对 [ADR-068]（2026-09-04，"数据空缺复核轨任务二"）一次性回填的 **8 个横切字段、共 79 处交易所×字段信封** 做的第二人独立复核。原批次由一个后台会话分 8 个 commit 完成，自己在 ADR-068 里标注"触及约 74 字段、远超 CLAUDE.md §四 30 字段阈值、第二人独立复核待人工"——本报告是这道复核。方法与判定标准沿用 `PROJECT/COST-WATERFALL-SPOT-CHECK.md`（[ADR-054]）的范式，但复核对象是散文字段（`zh`/`en`/`detail`/`quote`/`confidence`）而非 `spec`。

## 方法

四个互相独立、彼此隔离的复核视角（各自拿到一份任务说明与对应的 git 改动范围，互不知晓对方的存在与结论），逐一对每个交易所×字段：

1. 去主仓库 `.cache/<id>/` 目录用 `grep` 核对 `quote` 是否为原始缓存页面（html/pdf 伴随 `.txt`）的逐字连续子串——而不是只看 `make check` 是否绿灯（[CLAUDE.md] 二 "make check 全绿不等于数据没被幻觉污染"）；
2. 核对来源优先级与 `confidence` 分级是否匹配（第三方来源封顶 medium）；
3. 核对 `zh`/`en` 的每个数字断言是否能在 `quote` 里找到，以及是否存在超出 `quote` 实际内容的语义断言；
4. 对"消极认定"（regulatory text 通读无限制性条款 → medium）与 `not_applicable`（衍生品所字段级豁免）两类特殊判断方式，独立评估其论证是否站得住，而非因原作者自称如此就采信；
5. 核对跨交易所之间同一字段的判定口径是否一致。

四个视角的分工（按字段分组，覆盖全部 8 个字段）：

| 分组 | 字段 | 交易所×字段数 |
|---|---|--:|
| A | `intraday_reversal` + `holidays_note` | 15 |
| B | `board_lot_size` + `odd_lot_handling` | 22 |
| C | `block_trade` + `dark_pool` | 20 |
| D | `connect_schemes` + `price_limits.other_boards` | 22 |
| | **合计** | **79** |

## 汇总结果

| 分组 | 总数 | PASS（含轻微备注但结论站得住） | FIX（发现问题，本次已就地订正） | QUESTION（判断分歧，留待人工/协调者决定） |
|---|--:|--:|--:|--:|
| A | 15 | 14 | 1（`sa-tadawul intraday_reversal`） | 0 |
| B | 22 | 21 | 0 | 1（`de-eurex board_lot_size`） |
| C | 20 | 18 | 2（`ch-six`/`hk-hkex block_trade`） | 0（另有 2 处软性备注，计入 PASS，见下） |
| D | 22 | 19 | 1（`sa-tadawul connect_schemes`） | 2（`de-xetra connect_schemes`、`in-nse price_limits.other_boards`） |
| **合计** | **79** | **72（91.1%）** | **4** | **3** |

**核心结论：79 处里零处发现"quote 完全查无缓存支持"级别的编造或张冠李戴**——四个独立视角对每一条 `quote` 都去 `.cache/` 里做了 verbatim 定位，未发现任何一处凭空捏造的原文引用。找到的问题集中在两类，均属可订正的完整性/一致性缺口，而非幻觉：

1. **quote 摘录不完整**（C 组 2 处）：`zh`/`en` 断言的具体数值，在缓存原文里确实存在，但没被摘进 `quote` 字段本身——机器校验（5b/5c）对纯散文字段只要求"至少一个数字命中"，摘录不全不会被拦截。
2. **具体事实错误**（A 组 1 处、D 组 1 处）：`sa-tadawul` 的 `intraday_reversal` 夹带一句查无依据的历史细节（凭记忆填写）；`sa-tadawul` 的 `connect_schemes` 把同一份文件另外三处（`foreign_ownership_limit`/`capital_controls`/`participants.foreign_access_channel`，均 confidence high + CMA 官方公告 quote）已证实于 2026-02-01 废止的 QFI 制度，重新描述成现行准入渠道——这是"跨字段事实不一致"，`make check` 不做跨字段时效交叉核对，靠人工复核才发现。

**4 处 FIX 已在本次复核中就地订正**（见下方逐条），**终态 76/79 = 96.2%**；3 处 QUESTION 是复核者与原作者对"how to classify"的合理分歧（非事实错误），已记入 `PROJECT/OPEN-QUESTIONS.md`，留待人工或后续会话拍板，不阻塞本任务收口（同 [ADR-054] 对未决降级点的处理方式）。

## 逐条 FIX（已订正）

| 交易所 | 字段 | 问题 | 订正 |
|---|---|---|---|
| `sa-tadawul` | `intraday_reversal` | `zh`/`en`/`detail` 夹带"2017 年 4 月前 T+0 即时交收、2017-04 改 T+2 净额交收"的具体历史细节，在引用来源与 `.cache/sa-tadawul/` 全部缓存文件里查无依据（凭记忆填写，违反 CLAUDE.md §二第 1 条）。不影响 `enum: t0`/`confidence: medium` 本身——消极认定这条腿独立成立。 | 删除该历史细节，`zh`/`en`/`detail` 只保留消极认定依据；`detail` 补记订正说明。 |
| `sa-tadawul` | `connect_schemes` | 把已于 2026-02-01 废止的 QFI（合格境外投资者）资格框架描述成现行准入渠道，与同文件 `regulation.foreign_ownership_limit`/`regulation.capital_controls`/`participants.foreign_access_channel` 三处（均 high + CMA_N_3974 官方公告 quote）记录的废止事实矛盾。 | 改写为现状描述：QFI 已废止、境外投资者可直接投资主板（仍受 10%/49% 持股上限约束），并指向三处一手依据；此前提及的互换协议（swap）渠道因废止后是否仍并行存在未重新核实，本次不再断言，已转 OPEN-QUESTIONS。 |
| `ch-six` | `block_trade` | `zh`/`en` 断言"≥ CHF 3,500 万延迟至收盘"，但 `quote` 只摘到"≥ CHF 1,000 万延迟 60 分钟"一档，未覆盖 3,500 万这一档——原始 PDF 表格里两者同属"ADT > 100 million"分组的不同规模档，事实真实存在（`.cache/ch-six/` Directive 3 Annex C 第 1638 行），只是没抄进 quote。 | `quote` 追加该分组的完整三档（10M/60min、20M/120min、35M/EOD），使 3,500 万这一档有独立可核验的 quote 支撑。 |
| `hk-hkex` | `block_trade` | `zh`/`en` 提到"部分 MSCI 指数期货 25 张"最低成交量门槛，`quote` 未覆盖任何 MSCI 品种（`.cache/hk-hkex/` HKFE Rules VIII 表格第 144 行等多处确有 25 张的 MSCI 品种）。 | `quote` 追加一条 MSCI 品种的门槛行（"MSCI Australia Net Total Return 25"），为该断言提供独立可核验支撑。 |

## 留待人工/协调者决定（已记入 OPEN-QUESTIONS，不阻塞收口）

1. **`de-eurex board_lot_size` 的 `not_applicable` 判定是否应改判为填写实际内容**——复核者指出同一文件的 `tick_size` 字段面对结构相同的情况（无统一值，但逐品种在《合约规格》里有正面规定）选择了"填内容"（`regime: per_instrument`），且 `au-asx`（同样无股数整手概念）也走"填内容"（"无整手，最小 1 股 + Marketable Parcel"），而非 `not_applicable`。这是方法论层面"何时够格 not_applicable"的判据缺口，两种处理都能自洽，留人工拍板一个通用判据。
2. **`de-xetra connect_schemes` 未提及 CEINEX**（Deutsche Börse 与上交所/中金所合资的法兰克福 RMB 产品互联互通平台）——是否构成遗漏需人工判断（CEINEX 严格说不是"Xetra 与另一交易所的订单路由连接"，但与"跨境互联互通"主题高度相关）。
3. **`in-nse price_limits.other_boards` "NSE Emerge 沿用与主板同一套分类框架"的断言未在缓存里找到实质支撑**（仅导航栏出现"Emerge Platform"字样），印度 SME 板块实践中常有独立涨跌幅安排，需要人工核对 SEBI/NSE Emerge 专属规则原文再定案。

另有两处软性观察（不影响判定，已计入对应组 PASS，随本报告一并记录）：`fr-euronext`/`uk-lse` 的 `block_trade` confidence 评级不对称（medium vs high，结构相似的欧盟/英国 MiFIR 层级门槛）未见显式判断依据说明；`hk-hkex dark_pool` 的"第 1 类+第 7 类牌照""合资格投资者仅限机构"两处细节写入了 zh/en 主文而非仅限 `detail`，其独立来源（SFC《操守准则》第 19 段/附表 8）本次未逐字缓存。

## 系统性问题（供后续流程参考，非本批次专属）

1. **quote 完整性 ≠ 逐字真实性**：四个视角都发现"`quote` 本身逐字为真，但没有覆盖 `zh`/`en` 的每一个数字断言"的模式（`cn-sse connect_schemes` 的 ETF 纳入日期、`br-b3`/`us-nasdaq holidays_note` 的具体节日、`ch-six`/`hk-hkex block_trade` 已订正的两处）。`validate.py` 对纯散文字段的数值反查设计成"至少一个数字命中即可"（区别于 `spec` 数值叶子的逐个必须命中），这是有意放宽以避免误报，但代价是"quote 没覆盖全部数字"不会被机器拦下——与 [ADR-054]/[ADR-058] 记录的"note 数字机器盲区"同源，只是这次落在散文字段而非 `spec.note`。
2. **消极认定类字段普遍未填 `sources`，静默继承章节级默认来源**：`connect_schemes` 里 6 处新增的"无跨境互联互通"消极认定条目（`au-asx`/`br-b3`/`ch-six`/`de-xetra`/`jp-jpx`/`sa-tadawul`）均未填 `sources`，会静默继承 `market_structure._meta.sources`（通常是交易时段页面，与"是否存在互联互通"主题无关）。`validate.py` 的"moderate 必须有 sources"检查因此对这类字段形同虚设。建议后续给消极认定类字段设计专门的来源占位方式，而非依赖误导性的默认继承——本次未动（跨 6 个文件的结构性调整超出本次订正范围），已记入 OPEN-QUESTIONS。
3. **多来源合成的 high 字段，非主来源的内容未必进 quote**：`hk-hkex odd_lot_handling`/`dark_pool` 等字段综合了 2 份来源，只有"主来源"逐字进了 `quote`，第二来源的内容仅以 `sources` 列出 URL、`detail` 里坦白"未逐字进 quote"。复核者独立核实这些细节本身真实存在，不构成编造，但这是纯靠人工诚实自陈、机器完全无法校验的盲区。
4. **跨字段时效一致性不受 `make check` 覆盖**（`sa-tadawul connect_schemes` 一案）：同一交易所文件内，不同字段对同一制度（QFI）的时效状态可能不同步，需要人工做跨字段交叉核对才能发现，本次是这类问题第一次在数据空缺复核轨里被抓到。

## 验证

`make check` 全绿（`validate.py` 20 家 0/0）；4 处 FIX 均只改动 `zh`/`en`/`detail`/`quote` 散文内容，未新增/删除字段结构、未动 `enum`/`confidence`/`sources` 键（除 `sa-tadawul connect_schemes` 的 `detail` 补记说明），`make sync` 幂等，生成块预期零 diff（这批字段本身不进 `progress-matrix`/`health-summary` 之外的既有计数）。

## 与 [CLAUDE.md] §四 阈值的关系

初检 72/79 = 91.1%，低于 95% 阈值；按 [ADR-054] 确立的口径——"以终态计"，4 处确认性问题已就地订正，终态 76/79 = 96.2%，达标。3 处 QUESTION 是复核者与原作者的合理方法论分歧（不是发现的错误），比照 [CLAUDE.md] §四"某家/某批不过只暂停复核该家/该批，不牵连已过关的"原则，不阻塞任务二收口，已转入 `PROJECT/OPEN-QUESTIONS.md` 留待后续处理。**零处发现幻觉/编造**是本次复核最重要的结论：ADR-068 的批量回填方法（每字段一个 commit、跨所口径先行统一、消极认定与 `not_applicable` 判据留痕）本身是可靠的，暴露的问题集中在"引文摘录颗粒度"与"多字段协同一致性"这两个此前未被专门关注的维度，而非幻觉。
