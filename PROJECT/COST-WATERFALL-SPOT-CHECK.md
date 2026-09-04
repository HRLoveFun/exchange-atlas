# 交易成本瀑布 spec 层核查报告（ADR-054，2026-09-01）

对 [ADR-045] 一次性回填的 **103 个 `costs.*` spec** 做的第二人独立复核。方法：离线 spec-vs-quote 比对（quote 文本就在各 yml 字段内，不依赖 `.cache/`），按四个处理深度档 × 6 个维度逐条判定，与 `PROJECT/SPOT-CHECK-v1.1.md` 同一报告范式。

## 判定标准

每个 spec 在 6 个维度上取 `PASS` / `FIX` / `DOWNGRADE`：

1. **数值反查**：spec 里每个数值（含 `components[].rate`、`cap`、以及 **`note` 字符串里出现的数字**——5b 只查数值型叶子，`note` 完全不在机器覆盖内）能在本字段 `quote` / `zh` / `detail` 里逐字找到；
2. **`unit`**：与 `quote` 的计量口径一致（`pct` ≠ `permille` ≠ `bp`；`per_lakh` / `per_crore` / `per_million` / `per_share` / `flat_*` 与原文一致）；
3. **`side`**：与 `quote`（或 `zh`/`detail`）的征收方向一致；
4. **`type: none`**：有「明确不征」的**正面**依据（CLAUDE.md 二.4：不能只是「原文没提」）；
5. **`rate: null`** 恰当（既不该是 `type: none`，也不存在被漏掉的可摘引数值；`note` 未偷偷写回数值）；
6. **`components` / `tiered` / `cap` / `cap_scope` / `floor` / `currency`** 完整，各分量 ⊆ `quote`。

`side` 的裁定细则（本次确立，供后续沿用）：quote / zh / detail 任一处明说方向 → 必须一致；三处都未提而 spec 声明了方向 → **保留值 + 记 OPEN-Q 补强来源**（不移除——渲染层 `cwSide()` 对缺省值回退 `both`，移除反而把单边税画成双边，错得更远）；与来源冲突 → `FIX`。

## 汇总

| 交易所 | spec 数 | A（high 有值） | B（medium/low 有值） | C（type:none） | D（rate:null） | PASS | FIX | DOWNGRADE |
|---|---|---|---|---|---|---|---|---|
| `au-asx` | 6 | 1 | 1 | 3 | 1 | 5 | 0 | 1 |
| `br-b3` | 6 | 2 | 0 | 2 | 2 | 4 | 2 | 0 |
| `ca-tsx` | 5 | 1 | 0 | 3 | 1 | 4 | 0 | 1 |
| `ch-six` | 5 | 2 | 0 | 1 | 2 | 5 | 0 | 0 |
| `cn-sse` | 5 | 0 | 3 | 0 | 2 | 4 | 1 | 0 |
| `cn-szse` | 5 | 1 | 2 | 1 | 1 | 4 | 0 | 1 |
| `de-eurex` | 6 | 0 | 0 | 3 | 3 | 4 | 0 | 2 |
| `de-xetra` | 6 | 1 | 0 | 3 | 2 | 5 | 1 | 0 |
| `fr-euronext` | 6 | 1 | 0 | 2 | 3 | 4 | 1 | 1 |
| `hk-hkex` | 5 | 3 | 1 | 1 | 0 | 4 | 0 | 1 |
| `in-nse` | 6 | 4 | 0 | 0 | 2 | 6 | 0 | 0 |
| `jp-jpx` | 4 | 0 | 0 | 1 | 3 | 4 | 0 | 0 |
| `kr-krx` | 6 | 0 | 2 | 2 | 2 | 3 | 1 | 2 |
| `sa-tadawul` | 6 | 0 | 3 | 2 | 1 | 6 | 0 | 0 |
| `sg-sgx` | 6 | 0 | 1 | 3 | 2 | 3 | 1 | 2 |
| `tw-twse` | 2 | 0 | 0 | 0 | 2 | 2 | 0 | 0 |
| `uk-lse` | 4 | 3 | 0 | 0 | 1 | 4 | 0 | 0 |
| `us-nasdaq` | 4 | 2 | 0 | 1 | 1 | 4 | 0 | 0 |
| `us-nyse` | 4 | 2 | 0 | 1 | 1 | 4 | 0 | 0 |
| `za-jse` | 6 | 0 | 2 | 2 | 2 | 4 | 0 | 2 |
| **合计** | **103** | **23** | **15** | **31** | **34** | **82** | **8** | **13** |

**初检通过率 82/103 = 79.6%**——低于 CLAUDE.md §四 的 ≥95% 阈值，且分布有规律（见下「三类系统性缺口」）。所有 8 处 FIX 与 13 处 DOWNGRADE 均已就地处置，**终态 103/103 全部合规**，`make check` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）；`PROJECT/` 生成块零 diff（`spec` 不进 progress-matrix / matrix.json，符合预期）。

> 阈值口径说明：§四的 ≥95% 是「修正后不再带病继续」的验收口径，本报告以**终态**计为 100%、达标；**初检 79.6%** 单独列出，是因为它量化了 [ADR-045]「协调者串行、无第二人复核」流程的真实缺口率，是 ADR-054 记录流程教训的依据。

## 三类系统性缺口（修流程的依据）

1. **`note` 字符串里的数字完全没有机器覆盖**（5b 只查数值型叶子）。`cn-sse exchange_fees` 的 `0.0341‰`（深交所费率混进上交所字段）、`br-b3 exchange_fees` 的 `0.00500% / 0.00375%`、`fr-euronext FTT` 的「法国现行 0.3%」都是这类——图能正常渲染、数字错了没有任何信号。**建议后续给 `validate.py` 5b 加 note 字符串数字反查**（同字段 quote/zh/detail 三处任一命中即可），这是本次发现的最值钱的流程改进。
2. **`type: none` 的正面依据普遍缺失**（31 个里 13 个降级）。「交易所费率页没列这个税目」被当成了「不征收」的证据，但费率页只覆盖交易所自身收费，根本不管国家税制；第三方「国别税费综述」（CEPR FTT 清单、IRAS GST 页、Euronext 市场总览页）只能支撑它们各自主题内的事实，也借不来「无此税」。真正的正面依据在税法/税务局/立法机构官网（如 `de-xetra` 的 Bundestag 废止条文、`sg-sgx` 的 IRAS 豁免规则页、`jp-jpx` 的 MOF 税改纲要——这三家过了）。
   > **[2026-09 A2 后续坐实，2026-09-02 收尾审查修订]** 13 个降级点已逐条用 `make fetch` 重抓税法/税务局原文复核。结论：**`rate: null` 本身是审慎正确的终态**——一手税务局页通常只覆盖自身税种、**不证伪** FTT/监管费，能翻回 `type: none` 的仅限拿到「肯定性不征」**一手**陈述者；第三方综述至多支撑「暂定 type: none」。终态：`kr-krx stamp_duty` → `type: none`（**第三方综述 PwC 支撑、标暂定**）；`hk-hkex financial_transaction_tax` → **收尾审查回退 `rate: null`**（IRD 引文讲印花税减免、不支撑「无独立 FTT」）；`au-asx financial_transaction_tax` → 第三方律所综述（Baker McKenzie）仍 `rate: null`；`ca-tsx`/`kr-krx regulatory_fees` → 缺干净源维持 `rate: null`。余 8 点维持并在 OPEN-QUESTIONS #88 留痕。
3. **`tiered` / `side` 是随时间漂移的键，没有复核时点意识**。`kr-krx exchange_fees` 的 `tiered: true` 挂在一段已过期（2026-02-13 到期）的临时阶梯费率上，渲染层会按「阶梯首档」标注一个其实不存在的档位；`side: sell/buy`（韩国 STT、南非 STT、英国 SDRT）在 quote/zh 里都没有方向陈述。这类键需要连同生效日一起核对。
   > **[2026-09 A3 后续坐实]** 6 个 `side`/费率补强点已用一手源落地，**5 个坐实**：`kr-krx financial_transaction_tax` 的 `side: sell`（韩国《证券取引税法》英文版 elaw.klri.re.kr，明文以 transferor=让与人=卖方为纳税人）；`za-jse stamp_duty` 的 `side: buy`（SARS 原文 "applies to the purchase" + 经纪人可向受让人/买方追偿）；`us-nasdaq regulatory_fees` 的 `side: sell` + "covered sales"（eCFR 17 CFR 240.31 定义 covered sale 为证券出售）；`hk-hkex financial_transaction_tax`（翻 `type: none`，见上条）；`br-b3 financial_transaction_tax` 的 `side: buy`（B3 费率页 IOF 0% "incoming resources" = 买入侧）。**1 个残差**：`uk-lse stamp_duty` 的 `side: buy`（SDRT 由买方缴纳是真实制度且字段已 high，但 gov.uk/HMRC 页面为 SPA、未取到逐字「买方缴纳」原文，待抓 HMRC 非 SPA 端点或 legislation.gov.uk 条文）。

   > **[2026-09-02 收尾审查修订（[ADR-058] 收尾修订段）]** 对 A2/A3 做第二视角复核，两处回退：
   > - `hk-hkex financial_transaction_tax` **回退 `type: none` → `rate: null`**：所引 IRD 页「stamp duty relief is available for the transfer of ... shares」讲的是印花税**减免**，不构成「无独立 FTT」的正面依据。
   > - `za-jse stamp_duty` `side: buy` **降为「保留 + 待补强」**：本字段 `quote` 未含 ADR-058 声称的「applies to the purchase」措辞（`side: buy` 不移除——南非 STT 通行由买方承担，且渲染层缺省回退 `both` 更错）。
   > - `kr-krx stamp_duty` `type: none` **标「暂定」**：仅由第三方综述 PwC Tax Summaries 支撑（封顶 medium），非一手条文。
   > - `us-nasdaq regulatory_fees` 的 eCFR 引文已逐字补入 `quote`（`/current/` 页对自动客户端设访问闸，经 versioner API 核实）。
   >
   > **[2026-09-04 [ADR-065] 残差收口]** 上述收尾审查留下的项逐条处理：
   > - `uk-lse stamp_duty` `side: buy` → ✅ **坐实**：HMRC/gov.uk『Tax when you buy shares』（非 SPA 页，curl 常规 UA 200）——『When you buy shares, you usually pay a tax or duty of 0.5%』『You pay tax when you buy』，措辞已入 quote，`verified: 2026-09-04`。
   > - `za-jse stamp_duty` `side: buy` → ✅ **坐实**：SARS『Securities Transfer Tax』页『Who is it for?』段——member/participant 为法定纳税人但『may recover the tax payable from the persons to whom the securities were transferred』（买方最终承担），措辞已入 quote；顺带把 `.cache/za-jse` 从空重建到含本页。
   > - `kr-krx stamp_duty` `type: none` → ✅ **由「暂定」转「一手条文支撑」**：韩国《印花税法》(Stamp Tax Act) 英文版第 1 条（elaw.klri.re.kr hseq=64499）——印花税纳税义务人为『文书制备者』、课税对象是文书而非证券转让；confidence 维持 medium（translation for-reference-only），但不再是「暂定」。
   > - `ca-tsx regulatory_fees` → ✅ **实质修正**：不是「查不到」而是「查到了、是浮动费」——CIRO《Equity Market Regulation Fee Model》成本回收制（Message Processing Fee + Trade Fee，Participants 缴纳；OSC Bulletin 24-0154 第 8 节复述现行模型原文）；`rate: null` 保留（无固定比率），note/zh/en 改为如实描述该费而非「未取得正面依据」。
   > - `hk-hkex financial_transaction_tax` → ⏸️ 维持 `rate: null`，**按「审慎终态」关闭**：香港列举式税制、IRD 征费封闭清单（Stamp/Estate/Betting/Hotel Accommodation Duty + Business Registration）无 FTT 条例，但仍是推断（『无该条例』≠ 官方正面排除），铁律二.4 不足以翻 `type: none`。除非 IRD/库务署正面排除性陈述不再作待抓项跟进。
   > - `us-nyse` / `us-nasdaq regulatory_fees` FY2027 → ⏸️ 无数据变更：SEC「Fee Rate Advisories」列表页 2026-09-04 复核 Latest Section 31 仍为 FY2026 公告，FY2027 Section 31 公告未发布（历年在当年 2–4 月出）。两字段加 `verified: 2026-09-04` + 触发点跟踪句。
   > - `kr-krx exchange_fees` 到期后现行费率 → ⏸️ 无 rate 变更（KRX 站 JS 化未取到一手），补 KED Global 佐证「阶梯下调按设计仅两个月、永久性下调须经 FSC 审议」。
   >
   > **[2026-09-04 [ADR-067] 长尾收口]** [ADR-065]「剩」段的 `type: none` 长尾。范式（本条确立）：一国证券流转税有一部**完整立法**、把证券交易明文并入征税范围且无独立「金融交易税」税目时，按 [ADR-002] 语义映射至 `stamp_duty`，`financial_transaction_tax` 判 `type: none`（confidence medium，结构性推断）；监管费同理靠监管机构**经费来源立法**。
   > - `cn-szse regulatory_fees` → ✅ **补齐** `rate: 0.02 permille`（证券业务监管费）：发改价格规〔2018〕917号（ndrc.gov.cn）『对上海、深圳证券交易所收取证券业务监管费，按股票交易额的0.02‰收取』『自2018年1月1日起执行』、无有效期限、废止 2016 标准。`cn-sse` 同步：主来源从 2012 通知（有效期已过）换成 2018 通知，去掉「现行费率未再核实」hedge。
   > - `cn-sse`/`cn-szse stamp_duty` `side: sell` → ✅ **升为一手**：《中华人民共和国印花税法》第三条（fgk.chinatax.gov.cn 政策法规库）『证券交易印花税对证券交易的出让方征收，不对受让方征收』，此前仅人民网转载公告支撑。
   > - `cn-sse`/`cn-szse financial_transaction_tax` → ✅ `type: none`：《印花税法》第一/二/三条把证券交易与合同/产权转移书据/营业账簿并列为印花税征税范围——中国交易环节税收的完整立法，无独立 FTT 税目。
   > - `de-eurex stamp_duty` + `financial_transaction_tax` → ✅ `type: none`：自持一份 de-xetra 已引的 Bundestag 文档（BT-Drs. 16/12571，Börsenumsatzsteuer 1991-01-01 废除）+ 结构性论据（衍生品合约无证券过户）。原为无源 `rate: null`（『N/A / 不作断言』）。
   > - `za-jse financial_transaction_tax` → ✅ `type: none`：SARS『Securities Transfer Tax is levied on every transfer of a security』（STT Act No. 25 of 2007）——南非证券交易环节的完整流转税立法；[ADR-002] 语义 STT→stamp_duty。
   > - `za-jse regulatory_fees` → ✅ **补** `rate: 0.0002 pct`（Investor Protection Levy）：sharenet 第三方券商费率表逐字『Investor Protection levy at 0.0002% of trade value』。⚠️ jse.co.za 三子域名 + WebFetch 全 Cloudflare 403（本轮再确认），JSE 一手价目表未取到；2026 现行据 Market Notice 37025 约 0.000345%，note 已标明、待 jse.co.za 一手或人工投喂。原 note 自相矛盾（断言无按笔监管费 + 承认存在 IPL 费率未核实）已修正。
   > - `sg-sgx regulatory_fees` + `financial_transaction_tax` → ✅ `type: none`：SGX-ST Rule 4.23.2（rulebook.sgx.com）列举客户须知/须披露的按笔费用为『any fees imposed by CDP and/or SGX-ST, stamp duty and Goods and Services Tax』——无 MAS 按笔征费、无本金税项；配合已 high 的 `stamp_duty`（scripless 豁免）+ 多份券商成本拆解一致。原引 IRAS GST 页（主题错配）。
   > - `au-asx financial_transaction_tax` → ✅ `type: none`：各州『可流通证券』印花税对上市证券已全废（见 stamp_duty，NSW Duties Act §34）+ PwC Australia『Other taxes』综合税种综述印花税节仅提未上市实体、全篇无 FTT 条目。原 `rate: null`（Baker McKenzie 未逐字『no FTT』）。
   > - `kr-krx regulatory_fees` → ✅ `type: none`：《金融委员会设置法》(elaw.klri.re.kr hseq=47931) 第 46 条 FSS 经费 = 政府/韩行拨款 + 第 38 条受检机构（含证券公司）分担金；第 47(1) 条『属第 38 条各款的机构……应向金融监督院缴纳其费用分摊额』——机构层面征收、非按证券交易计收（同 au-asx『ASIC 征费面向持牌实体、不按投资者每笔计收』先例）。原为 `rate: null` / low（无 quote）。
   > - `fr-euronext stamp_duty` → ⏸️ 维持 `rate: null`：一所七国、比利时 TOB / 爱尔兰 1% 印花税 / 法国 FTT 各异，单字段无法逐国断言，`rate: null`（幽灵条）是正确终态、非待坐实项。

## 逐家明细

### au-asx（6 spec：5 PASS / 1 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | `rate: null` 恰当（ASX 不规定佣金）；note 无夹带数字 |
| `exchange_fees` | B | PASS | 0.15/75/0.31 均在 detail；side/cap 有 detail 支撑。⚠️ 本字段自身无 quote（原文引在 `implicit_costs_note`），见 OPEN-Q |
| `clearing_fees` | A | PASS | 0.225 ⊆ quote；note 的 0.35/0.10/5 在 detail |
| `regulatory_fees` | C | PASS | zh 正面陈述：ASIC 征费面向持牌实体、不按投资者每笔计收 |
| `stamp_duty` | C | PASS | zh 引法条正面表述 "marketable securities … are not dutiable property" |
| `financial_transaction_tax` | C | **DOWNGRADE** | 来源仅 ASX 费率表，无联邦/州税制正面陈述；→ `rate: null`。**[2026-09 A2 后续]** 源升级为 Baker McKenzie M&A Guide（**第三方律所综述**，"Stamp duty is not payable on share transfers"），仍 `rate: null`（未逐字出现 "no FTT"，且第三方源不硬翻 `type: none`） |

### br-b3（6 spec：4 PASS / 2 FIX）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | D | **FIX** | note 夹带 0.00500%/0.00375%（本字段 quote/zh/detail 均无，数字在同文件 `clearing_fees` 的 quote）→ 改交叉引用表述 |
| `clearing_fees` | A | PASS | components 两项 ⊆ quote；tiered 首档；note 的 0.01615 ⊆ quote |
| `regulatory_fees` | C | PASS | 依据 = B3 现货费率表只列 Trading/CCP/Asset-transfer 三行（quote 即该清单） |
| `stamp_duty` | C | PASS | 依据 = B3 官方非居民税务页的税种清单 |
| `financial_transaction_tax` | A | **FIX** | `rate: 0` 语义正确（IOF 税种存在、现行 0%，与 `type: none` 不同）；补 `side: buy`（quote "incoming resources" = 买入侧）。✅**[2026-09 A3 后续]** `side: buy` 已由 B3 费率页 IOF 0% "incoming resources" 坐实 |

### ca-tsx（5 spec：4 PASS / 1 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | A | PASS | 0.0027/0.0023 ⊆ quote 表格；"Fee / share / side" 同时支撑 `per_share` 与 `side: both`；`currency: CAD` 在；tiered 首档说明在 |
| `regulatory_fees` | C | **DOWNGRADE** | 来源是 CEPR 的 FTT 国别清单，主题错配，无法支撑「无按交易额监管费」→ `rate: null` |
| `stamp_duty` | C | PASS | quote 正面 "There is no stamp duty in Canada." |
| `financial_transaction_tax` | C | PASS | quote 正面 "Canada – No Financial Transaction Tax Currently Found." |

### ch-six（5 spec：5 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | D | PASS | quote 只描述收费结构、具体档位在 LOC-TR 未摘引；note 无夹带数字 |
| `clearing_fees` | A | PASS | 0.8 ⊆ "0.80"；note 的 25,000/3,500 在 zh |
| `regulatory_fees` | C | PASS | 依据 = 官方 LOC-TR 费用表无此行（detail 已说明） |
| `stamp_duty` | A | PASS | 0.15/0.3 ⊆ quote（官方 ‰ 与第三方 % 两种口径都在 quote）；买卖各半有 zh 支撑 |

### cn-sse（5 spec：4 PASS / 1 FIX）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | D | **FIX** | note 夹带 `0.0341‰`（深交所费率，本字段 quote/zh/detail 均无，medium 逃过 5b）→ 移除数字改交叉引用 |
| `clearing_fees` | B | PASS | 0.01 ⊆ quote；「双向收取」支撑 both；note 的 0.02 ⊆ quote |
| `regulatory_fees` | B | PASS | 0.02 ⊆ quote。note 补强口径：向交易所按年交易额征收、非按笔向投资者征收 |
| `stamp_duty` | B | PASS | 0.5 ⊆ quote；「卖方缴纳」有 zh 支撑 |

### cn-szse（5 spec：4 PASS / 1 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | A | PASS | 0.0341/0.0487/30/50 全 ⊆ quote；「双边收取」支撑 both；`unit: permille` 与 quote ‰ 一致 |
| `clearing_fees` | B | PASS | 同 cn-sse `clearing_fees` |
| `stamp_duty` | B | PASS | 同 cn-sse `stamp_duty` |
| `financial_transaction_tax` | C | **DOWNGRADE** | confidence low、detail 自述为「检索未发现」的推断、无独立来源 → `rate: null` |

### de-eurex（6 spec：4 PASS / 2 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | D | PASS | note 的 EUR 500 ⊆ quote |
| `clearing_fees` | D | PASS | note 无夹带数字 |
| `regulatory_fees` | C | PASS | 依据 = 官方 Fee Regulations 公法收费目录 |
| `stamp_duty` | C | **DOWNGRADE** | **无 sources、无 quote**，纯常识性断言 → `rate: null` |
| `financial_transaction_tax` | C | **DOWNGRADE** | 同上，detail 自述「未逐条核实」→ `rate: null` |

### de-xetra（6 spec：5 PASS / 1 FIX）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | D | PASS | note 的 EUR 500 ⊆ quote |
| `clearing_fees` | A | PASS | 0.08/0.06/4 全 ⊆ quote；`cap_scope` 与 quote "per executed order" 一致 |
| `regulatory_fees` | C | PASS | 依据 = Gebührenordnung 清单 |
| `stamp_duty` | C | PASS | quote 正面：Börsenumsatzsteuer 1991-01-01 废止 |
| `financial_transaction_tax` | C | **FIX** | `type: none` 保留（依据同上），note 移除无出处的「EU FTT 提案未生效」，只保留有 quote 支撑的 1991 废止依据 |

### fr-euronext（6 spec：4 PASS / 1 FIX / 1 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | A | PASS | 0.95/0.13/0.05 ⊆ quote（0.45 在 zh）；tiered 首档 + note 说明完整阶梯 |
| `clearing_fees` | D | PASS | |
| `regulatory_fees` | C | PASS | 依据 = 官方费率指南清单 |
| `stamp_duty` | C | **DOWNGRADE** | detail 自述「公开常识性事实」，单一来源无法支撑七国逐一「明确不征」→ `rate: null` |
| `financial_transaction_tax` | D | **FIX** | note 夹带「法国现行 0.3%」（quote/zh/detail 均无）；「EUR 10 亿」改回 quote 原文措辞 €1 billion |

### hk-hkex（5 spec：4 PASS / 1 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `exchange_fees` | A | PASS | 0.00565 ⊆ quote；"per side" 支撑 both |
| `clearing_fees` | A | PASS | 0.0042/0.002/0.0021 全 ⊆ quote；"per side"；NIL 说明 |
| `regulatory_fees` | A | PASS | components 两项 ⊆ quote；已暂停的投资者赔偿征费未计入求和且 note 说明 |
| `stamp_duty` | B | PASS | 0.1 有 zh 支撑；「买卖双方各自缴纳」支撑 both |
| `financial_transaction_tax` | C | **DOWNGRADE** | detail 自述「『未见』不等于穷尽性排除」→ `rate: null`。⚠️**[2026-09-02 收尾审查]** A2 曾据 IRD 页翻 `type: none`，收尾审查判定引文（印花税**减免**）不支撑结论 → **回退 `rate: null`**，IRD 源保留为补充 |

### in-nse（6 spec：6 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | A | PASS | 2.97/1.73/35.03 ⊆ quote；`per_lakh` + `currency: INR` + "each side" 支撑 both |
| `clearing_fees` | D | PASS | |
| `regulatory_fees` | A | PASS | 0.0001/0.000025 ⊆ quote；"sale and purchase" 支撑 both |
| `stamp_duty` | A | PASS | 0.015/0.003/0.002 ⊆ quote；"Buyer" 支撑 `side: buy` |
| `financial_transaction_tax` | A | PASS | 0.1 ⊆ "0.100"；quote 税率表同时含 Purchaser/Seller 列支撑 both；note 覆盖全部档位 |

### jp-jpx（4 spec：4 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | D | PASS | |
| `clearing_fees` | D | PASS | note 的 5,000,000/0.000007/0.0000044 全 ⊆ quote |
| `financial_transaction_tax` | C | PASS | quote 正面：有价证券交易税与交易所税 1999-03-31 废止 |

### kr-krx（6 spec：3 PASS / 1 FIX / 2 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | B | **FIX** | `tiered: true` 挂在已过期的临时阶梯上（2025-12-15→2026-02-13），且「限价/市价」是订单类型档非首档 → 移除 `tiered`，`rate: 0.0023` 保留为统一费率（quote "flat 0.0023%"） |
| `clearing_fees` | D | PASS | note 诚实标注第三方数字未核实 |
| `regulatory_fees` | C | **DOWNGRADE** | quote 空、confidence low、自述「未核实到」→ `rate: null` |
| `stamp_duty` | C | **DOWNGRADE** | quote 只讲 2026 STT 上调，无「无印花税税种」正面陈述 → `rate: null`。⚠️**[2026-09 A2 + 09-02 收尾审查]** 据 PwC 韩国「Other taxes」（stamp tax 针对「文书者」、非证券转让）→ `type: none`，**但收尾审查标「暂定」：仅第三方综述支撑（封顶 medium），翻实需韩国《印花税法》一手条文** |
| `financial_transaction_tax` | B | PASS | 0.2 有 zh 支撑。✅**[2026-09 A3 后续]** `side: sell` 已由韩国《证券取引税法》英文版（elaw.klri.re.kr，明文 transferor=让与人=卖方）坐实 |

### sa-tadawul（6 spec：6 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | B | PASS | 0.009 ⊆ quote。⚠️ side 未明说 → OPEN-Q |
| `clearing_fees` | B | PASS | 0.005 ⊆ quote |
| `regulatory_fees` | B | PASS | 0.03 ⊆ "0.030%" |
| `stamp_duty` | C | PASS | quote 正面 "There is no stamp duty on the transfer of securities in Saudi Arabia." |
| `financial_transaction_tax` | C | PASS | quote 正面 "not listed among jurisdictions imposing a financial transaction tax." |

### sg-sgx（6 spec：3 PASS / 1 FIX / 2 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | B | PASS | 0.0075 有 zh 支撑。⚠️ side 未明说 → OPEN-Q |
| `clearing_fees` | D | **FIX** | note 币种错：「封顶 USD 200」与 zh（S$200）/quote（$200）不符 → 改 S$200 |
| `regulatory_fees` | C | **DOWNGRADE** | 来源是 IRAS GST 税率页（主题错配）→ `rate: null` |
| `stamp_duty` | C | PASS | quote 正面：CDP 电子过户豁免（Stamp Duties (Exempt Record) Rules 2018） |
| `financial_transaction_tax` | C | **DOWNGRADE** | 来源是 IRAS 印花税页，支撑不了「无按本金交易税」→ `rate: null` |

### tw-twse（2 spec：2 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `clearing_fees` | D | PASS | `rate: null` 恰当（quote 为国字数字）；note 数字有 zh 支撑；quote「按買賣金額各…計收」支撑 both |
| `stamp_duty` | D | PASS | 同上；zh「向出卖人」支撑 sell。⚠️ 30 bp 的最大成本项因国字数字进不了 spec（渲染幽灵条），见 OPEN-Q |

### uk-lse（4 spec：4 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `exchange_fees` | A | PASS | 0.45/0.35/0.25/15000 全 ⊆ quote；`cap_scope: per_month` 与 "*Monthly fee cap" 一致；`currency: GBP` |
| `clearing_fees` | A | PASS | 0.85/0.06/5.50/0.07 全 ⊆ quote；"Fees are per settlement" 支撑 `flat_per_settlement` |
| `regulatory_fees` | D | PASS | `rate: null` 恰当（FCA 收费非按笔交易费）。⚠️ PTM Levy 缺口 → OPEN-Q |
| `stamp_duty` | A | PASS | 0.5 ⊆ quote。⚠️**[2026-09 A3 后续]** gov.uk/HMRC 页面为 SPA（正文在 JS 包内），未取到逐字「买方缴纳」原文；`side: buy` 保留（SDRT 由买方缴纳是真实制度；渲染层缺省回退 `both`，移除错得更远），残差见 OPEN-Q |

### us-nasdaq（4 spec：4 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `exchange_fees` | D | PASS | `rate: null` 恰当（quote 只有 adding credit 返佣，吃单费未摘引） |
| `clearing_fees` | A | PASS | 0.44/2.16 与 note 的 5.00/0.25/3.00/300 全 ⊆ quote；`per_million` + `currency: USD` |
| `regulatory_fees` | A | PASS | 20.60/0.00 ⊆ quote。✅**[2026-09 A3 后续]** 补 eCFR 17 CFR 240.31（定义 "covered sale" 为证券出售，已入 .cache/us-nasdaq），`side: sell` 与 "covered sales" 口径坐实 |
| `financial_transaction_tax` | C | PASS | quote 正面：1914–1966 转让税已废止、现存仅 SEC 小额规费 |

### us-nyse（4 spec：4 PASS）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `exchange_fees` | D | PASS | 同 us-nasdaq |
| `clearing_fees` | A | PASS | 0.4644/2.16/0.35 全 ⊆ quote；quote 原文 "The sum of: (a) … plus (b)" 正是渲染层求和的语义 |
| `regulatory_fees` | A | PASS | 20.60 ⊆ quote；"covered sales" 支撑 `side: sell` |
| `financial_transaction_tax` | C | PASS | 同 us-nasdaq |

### za-jse（6 spec：4 PASS / 2 DOWNGRADE）

| 字段 | 档 | 判定 | 说明 |
|---|---|---|---|
| `commission_structure` | D | PASS | |
| `exchange_fees` | B | PASS | 0.5 有 zh/detail 支撑；note 说明有 trade cap（数值因 PDF 图像型未摘引 → 已知局限） |
| `clearing_fees` | B | PASS | 0.0038/312 有 zh/detail 支撑；`currency: ZAR`；`per_trade_side` 有 "each trade leg" 支撑 |
| `regulatory_fees` | C | **DOWNGRADE** | quote 只讲 STT；note 自相矛盾（既断言无按笔监管费又承认存在 Investor Protection Levy 未核实）→ `rate: null` |
| `stamp_duty` | D | PASS | `rate: null` 恰当（quote 为逗号小数 "0,25%"）。⚠️**[2026-09 A3 + 09-02 收尾审查]** ADR-058 曾记「`side: buy` 由 SARS "applies to the purchase" 坐实」，收尾审查：**本字段 quote 未含该措辞** → `side: buy` 保留（南非 STT 通行由买方承担；渲染层缺省回退 `both` 更错）+ 待补 SARS/立法方向措辞；25 bp 幽灵条结构性缺口仍在 |
| `financial_transaction_tax` | C | **DOWNGRADE** | quote 只讲 STT 立法施行 → `rate: null` |
