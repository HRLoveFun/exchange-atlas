# 英文版可用性审查 + 修订计划（2026-08-30）

> 状态：**已归档**（四批次全部执行完毕，2026-08-31）。本文件是一次性的审查报告 + 实施计划，延续 [ADR-024]/[ADR-026] 的英文版审查线。
> 决策落点：`PROJECT/DECISIONS.md` [ADR-049]（逐批补记，含「方案 B ③ 为什么不选另外两条路」等论证）；执行结果与验收：`PROJECT/ROADMAP.md` 对应条目。**本文件不再更新**，仅作历史记录保留。
> 职责边界（CLAUDE.md §一）：本文件只管「英文版当前差在哪、怎么修」；决策理由落地时进 DECISIONS.md，进度进 ROADMAP.md，不在此重复。

---

## 0. 触发与范围

「英文版」在本项目里指 **数据语言开关 `langMode: en`**（[ADR-006]/[ADR-013]），不是一个独立站点。审查覆盖：

- `schema/taxonomy.yml` / `enums.yml` / `glossary.yml` 的英文标签
- `docs/assets/app.js` 全部渲染路径
- `docs/index.html` 站点外壳
- 20 个 `data/exchanges/*.yml` 的 `en` 覆盖率（独立脚本核验）、术语一致性、`en` 值内混入中文的情况
- 相关历史：[ADR-013]（zh/en 两态）、[ADR-024]（`en_required` 机器校验 + 9 处补齐）、[ADR-026]（前端「中文原文」标记）、[ADR-034]（#45 英文回填全库清零）

---

## 1. 审查结论

**问题集中在结构层，不在译文层。**

一句话：**「英文版」目前只在「对比矩阵 / 交易所档案 / 数据健康度」三个视图里部分成立；v2.0 的两个旗舰视图——「市场机制剖面」（默认首屏）和「交易成本瀑布」——几乎完全无视语言开关，全中文。** 再加上 1028 个 `detail` 字段从不翻译、始终渲染。

### 1.1 现状认定（已达标的部分，不要动）

| 项 | 状态 | 证据 |
|---|---|---|
| 事实信封 `en` 覆盖率 | **完整** | 独立脚本扫全库：`zh` 有值但 `en` 缺失的非枚举叶子字段 = **0**（[ADR-034] 生效） |
| `en` 译文质量 | **高** | 抽查 `cn-sse` 等：`central order book on price-then-time priority`、`call auction`、`risk-warning (ST/*ST) stocks`，地道金融英语 |
| `taxonomy.yml` / `enums.yml` `label_en` | **完整、准确** | 全字段、全枚举有英文标签 |
| `glossary.yml` en/zh 术语对 | **完整、严谨** | — |
| `en` 值混入中文字符 | 仅 6 处，多为有意的原文括注（`呼値`/`特別気配`/`融資融券`） | 见 F6 |

---

## 2. 问题清单

严重度：🔴 严重（英文版名不副实）/ 🟠 中等（明显夹杂或缺失）/ 🟡 轻微（打磨）。
行号对应审查时的 `docs/assets/app.js`，执行前以当时代码为准。

### F1 🔴 — 市场机制剖面 + 成本瀑布对语言开关几乎零响应

`renderTradingDay`（默认首屏兼第一个 tab）与 `renderCostWaterfall`（第二个 tab）是 Phase 2/3（[ADR-040]～[ADR-047]）新写的，除极少数 `dv()` 处理 chip「值」外，**整段不读 `state.langMode`**。切到英文模式后仍是硬编码中文的部分：

- **SVG 标题 / 轴名**：`· 市场机制剖面`（app.js:875）、`涨跌幅 %（相对前收盘价）`（:876）、`日内时间（当地）`（:877）、`· 交易成本瀑布`（:1209）、`bp of 成交额（1 bp = 0.01%）· 买卖两侧各自计`（:1205）
- **中心信息卡整句**：`当日价格限制 ±X%（相对…）`（:565）、`当日涨跌停 +X% / −X%`（:567）、`阶梯值幅：…`（:569）、`动态价格带 ±X%（随参考价滚动）`（:570-571）、`无每日涨跌停墙`（:572）、`指数跌 X% 触发全市场熔断`（:582）、`无全市场熔断`（:583）、`无全市场熔断；靠个股 / 品种级波动中断…`（:584-585）、回转 `当日可回转（T+0）` / `T+1：当日买入次日才可卖` / `T+2 交收`（:588）
- **图元标注**：`涨停 +X%` / `跌停 X%`（:717-718）、`阶梯值幅` / `约 ±X–Y%`（:731-732）、`动态带 ±X%` / `相对滚动参考价`（:743-744）、`波动走廊 ±X`（:764）、`熔断 X`（:781）、`临时停牌可发生于任意时刻`（:812）、`开盘竞价` / `收盘竞价`（:805-806）、`↺ T+0 当日可回转` 等（:819）、`交易时段钟点未结构化——见档案页第五章`（:870）
- **时段类型字典**（:521-523）：`挂单排队·不成交` / `开盘集合竞价` / `连续竞价` / `收盘集合竞价` / `固定价格交易` / `午间休市` / `盘后连续交易` / `夜盘` / `不设`
- **chip 组标题**：`交易机制`（:946）、`交易细则 · 成本`（:965）
- **chip 名**（全部硬编码中文，`chip(path,label,…)` 的 `label` 参数）：`价格限制类型` / `熔断` / `撮合原则` / `订单类型` / `做空机制` / `做市商` / `波动性中断`（:920-944）、`最小报价单位` / `最小交易单位` / `交收周期` / `佣金` / `印花税` / `印花税 / 交易税` / `跨境 / 互联互通`（:951-964）
- **合成 chip 值**：`有 · 强制双边报价` / `无`（:935-936）、`无独立层` / `走廊 ±X%`（:940-942）、`无 / 未见征收`（:962）
- **图例**（:972-978）：`连续竞价` / `集合竞价 / 挂单排队` / `午休` / `固定价 / 盘后` / `涨跌停墙（硬）` / `熔断触发线` / `动态带（蓝） / 波动走廊（灰）`；成本图（:1240-1242）：`买 / 卖合计` / `幽灵条 = 议价 / 未披露` / `▸阶梯首档　^设封顶　≈按假设折算`
- **banner**：`纯衍生品交易所：y 轴基准为前结算价…`（:901）、`本所记录含衍生品市场字段；本剖面显示现货…`（:903）、成本图（:1230）
- **说明段**：`tdProse()`（:983-987）、`cwProse()`（:1260-1266）整段中文
- **成本瀑布另有**：`← 买入 BUY` / `卖出 SELL →`（半双语，:1136-1137）、`未结构化（本所该费种未填 spec）`（:1146）、`不征收 / 不适用`（:1153）、`阶梯·议价/未披露`（:1170）、`合计`（:1186）、费种字典（:1006-1011：`佣金`/`交易所费`/`清算费`/`监管费`/`印花税`/`金融交易税`）、`持有 / 退出税（非按笔成本，另计）` / `资本利得税` / `股息预扣税`（:1255-1256）、tooltip 拼接串（:1067-1072：`≈ X bp/边` / `原始 X` / `多项分征费求和` / `▸阶梯首档 / 代表档` / `^设封顶（bp 未扣封顶）` / `≈按假设成交额折算`）、`未结构化` / `不征收` tooltip（:1147/1154）、小计副标题（:1212-1219）

**净效果**：英文用户一进默认视图就是满屏中文。**最大缺口，落在最重要、访问最频繁的视图上。**

### F2 🔴 — `detail` 字段从不翻译，且始终渲染

- 全库 **1028 个 `detail` 字段，全部纯中文字符串**（0 个是 dict；schema 里 `detail` 本就没有 `en`——按设计是「自己写的解释」）。
- `renderObjectChapter`（app.js:324）与 `openCellOverlay`（app.js:1300）**无条件**渲染 `env.detail`。
- 英文模式下每张档案字段卡片的英文值下面都挂着一段中文，`detail` 往往是卡里最长的文字。
- [ADR-024]/[ADR-026] 只处理了事实信封的值，`detail` 从未纳入范围，`OPEN-QUESTIONS #45` 又已删除——**没人跟踪的开放缺口**。

各所 `detail` 数量：`in-nse` 85、`sa-tadawul` 71、`cn-szse` 69、`ch-six` 68、`us-nyse` 65、`za-jse` 63、`ca-tsx` 62 …（最少 `de-eurex` 21）。

### F3 🟠 — `spec.note` 等内嵌散文是中文，还以裸 JSON 展示

- 浮层（app.js:1301）用 `JSON.stringify(env.spec, null, 2)` 直接打印 `spec`。很多 `spec` 带 `note:` / `full_table_note:`，是成句中文（如 `cn-sse` `execution_model` 的 spec note）。
- 英文用户在「结构化 Spec」块里看到 JSON 中夹着中文。
- 市场机制剖面里部分 chip / 标注也从 `spec` 派生出中文文本（与 F1 重叠）。

### F4 🟠 — 各视图普遍存在中文单语 UI 串，违反 [ADR-006]

即便「能用」的双语视图也有漏网（[ADR-006] 有约定但无机器强制，Phase 2/3 期间静默劣化）：

- `renderObjectChapter`：`本章节暂无字段定义。`（:305）、`（暂缺，见 OPEN-QUESTIONS）`（:322）、`核实于 X`（:328）、`● 待复核`（:329）
- `renderMatrix`：`没有符合条件的交易所。`（:190）、`该维度组下暂无矩阵列（…）`（:192）、`（空）`（:216）、`待复核`（:218 title）、`找不到交易所`（:235）、`加载 X 档案中…`（:238）
- `renderExchange`：`加载失败：`（:274）
- 浮层：`此字段暂无数据。`（:1317）、`访问于 X`（:1307）、`核实于 X`（:1313）、`● 已超过复核阈值`（:1314）
- `renderTimezone`：说明段整段中文（:466-467）
- 根级：`数据加载失败：…（先跑 make build 生成 docs/data/）`（:1445）

（`renderHealth` 基本合规，可作正例：`statTile(total, "已填字段 Filled Fields")`、`th-label-zh` / `th-label-en` 双 span。）

### F5 🟠 — 站点外壳完全没有英文

- `index.html`：`<html lang="zh-CN">`、`<meta name="description">` 纯中文、`<div class="loading">加载中…</div>` 纯中文、footer 免责声明纯中文、按钮 `title=` 提示纯中文（`切换数据语言模式` / `切换明暗主题` / `GitHub 仓库`）。tab 标签本身是双语的（OK）。
- `README.md`：**整篇中文**，GitHub 上仓库的对外门面，一句英文都没有。

### F6 🟡 — `en` 值跨交易所术语漂移

分批由不同子代理回填，漂移可预期：

- `RMB`(26) / `Renminbi`(7) / `CNY`(2) 混用——`cn-sse.yml` 一个文件内部就不统一
- `closing auction`(26) vs `closing call auction`(7)；`opening auction`(16) vs `opening call auction`(4)。glossary 标准是 `Closing Auction` / `Opening Auction`，但部分 `call auction` 忠实于该市场官方用语（SSE 官方即 call auction）——**逐案判断，不一刀切**
- `board lot`(12) / `round lot`(7) / `trading unit`(5) / `lot size`(4)——部分是市场特定用法（美股 round lot、日本 trading unit），部分是漂移
- `tw-twse` 用简体 `网路资讯商店`，TWSE（台湾）官方写法应是繁体 `網路資訊商店`——真实小错
- 目前没有针对 `en` 值的 glossary 一致性校验（`make check` 只校中文 detail / 矩阵标签）

---

## 3. 修订方案

按 CLAUDE.md §九 逐条三层。前三批纯前端、零数据改动、零构建变化，照 [ADR-040]/[ADR-047] 的 headless 截图法验收。

### 方案 A — 市场机制剖面 + 成本瀑布 + 时区甘特条全面接入语言开关（F1）

1. **为什么需要**：默认首屏在英文模式下满屏中文，是「英文版」名不副实最刺眼处；这三个视图是 v2.0 核心产出，不修则语言开关对新用户等于失效。
2. **要达成的目标**：切到 `en` 后，这三个视图里**每一个可见字符串**（轴名、标题、图例、banner、chip 组标题、chip 名、合成 chip 值、中心信息卡整句、图元标注、说明段）都显示英文；`zh` 模式逐字不变；`make build` 生成块零 diff；四视图（矩阵 / 时区 / 健康度 / 档案）无回归。
3. **如何达成**：
   - `app.js` 顶部加零依赖小工具 `t(zh, en)`，按 `state.langMode` 返回（符合 [ADR-035] C 零构建）。
   - 三处集中的中文字典改 `{zh, en}` 结构：时段类型（:521-523）、回转制度（:588 / :819）、费种（:1006-1011）。
   - **chip 名不新写英文**——`chip(path, …)` 已带 `path`，改为按 `path` 到 `cache.taxonomy` 查字段定义的 `label_en`（顺带消除 CLAUDE.md §一 反对的「同一标签两处手写」）。跨章 chip（`tick_size` / `settlement_cycle` / `commission_structure` / `stamp_duty` / `connect_schemes` 等）同理按各自 `chapter` + `path` 查。
   - 其余散串逐个包 `t()`。工作量集中在 `renderTradingDay` / `renderCostWaterfall` / `renderTimezone` 及其子函数，约 150 个串。
   - **ADR 需记一条边界细化**：[ADR-006]「UI 标签恒双语」只覆盖短标签；图形视图的合成语句 / 轴名 / 图例 / 说明段改为**跟随语言开关**（toggled），不恒双语——否则中心信息卡等长句双语并列会挤爆版面。合成的**数据语句**（带数字的墙标注、中心卡）本就该跟随 `langMode`，与 `displayValue()` 同理。
   - 验收：Chrome headless 对 6 家代表交易所（`de-eurex` 衍生品 / `jp-jpx` 阶梯 / `cn-sse` 百分比 / `au-asx` 无涨跌停 / `us-nyse` maker-taker / `in-nse` 跨所联动熔断）跑 `zh/en × 明/暗` 四态截图核对。

### 方案 B — `detail` 与 `spec.note` 在英文模式下的诚实降级（F2、F3）

1. **为什么需要**：1028 段中文 `detail` 无条件显示，是英文模式「中英夹杂」的主要来源；[ADR-024] 论证过「不能直接回退空白，否则从『夹杂』变成『大面积消失』」，同一逻辑适用——要标记、不要藏、也不要不管。
2. **要达成的目标**：英文模式下，`detail` / `spec.note` 不再与英文正文混排；读者清楚知道「这是中文分析注记、非译文缺失」；中文模式行为不变；不新增 1028 条翻译债。
3. **如何达成**（三选一，**定 ③**）：
   - ① schema 的 `detail` 升 `{zh, en}` 回填 1028 条——**否**：分析性散文翻译漂移风险高，每新增字段多一份长期负担。
   - ② 构建期机翻进 `docs/data/`——**否**：与「每条事实可溯源、不编造」冲突，`detail` 有时含对来源的推理。
   - ③ **前端**：英文模式下把 `detail` / `spec.note`（含 `full_table_note`）收进默认折叠小块，标 `Analyst note (Chinese) ▾`，点开显示原文。复用 [ADR-026]「加视觉标记、不改数据可见性」哲学。改 `renderObjectChapter`（:324）与 `openCellOverlay`（:1300-1301）两处，浮层 Spec 块把 `note` 类键从 JSON dump 里摘出来单独按同样方式处理。
   - 之后**可选**：对少数英文读者极需的 `detail`（如 `us-nyse.overview.self_listed`、`fr-euronext` 多法域结构）走一条轻量可选键 `detail_en` 单独人工补，不强制全量。
   - 验收：headless 截图档案页 + 浮层 `en` 态；确认 `zh` 态零变化。

### 方案 C — 清剩余中文单语 UI 串 + 加防回归校验（F4）

1. **为什么需要**：[ADR-006] 是硬约定但无机器强制，Phase 2/3 期间就是这么静默烂掉的；不加校验，修完还会再烂（对照 [ADR-024]/[ADR-033] 「加机器校验锁住铁律」的做法）。
2. **要达成的目标**：`app.js` 里所有进入 DOM 的字符串，要么走 `t()`，要么是 `"中文 English"` 双语串；`make check` 能拦下新写的中文单语串。
3. **如何达成**：
   - 逐个改 F4 列出的串（约 30 处），统一用 `renderHealth` 已有的双语写法。
   - 加一条粗粒度校验（新增 `tools/` 脚本或并进 `validate.py`）：扫 `docs/assets/app.js`，字符串字面量含 CJK 但既不在 `t(` / `tSel(` 调用内、也不含配对 ASCII 字母的 → 报错；`t()` 字典区与 `//` 注释豁免。接进 `make check`。
   - 验收：`make check` 故意塞一个裸中文串确认能拦，再改回。

### 方案 D — 站点外壳 + README 的英文层，**完整版**（F5）

1. **为什么需要**：仓库公开在 GitHub，`README.md` 零英文；`index.html` 的 `lang` / `meta` / 免责声明零英文，英文用户与搜索引擎拿不到任何英文语境。既然要做就做全，避免「改一半」留半吊子状态。
2. **要达成的目标**：
   - `index.html`：`<html lang>` 随语言开关切换（`zh` ↔ `en`）；`<title>` 保持中英并列；`<meta name="description">` 出英文版（或 `zh` 一句 + `en` 一句）；`loading` / footer 免责声明 / 所有 `title=` 提示随开关切换或恒双语。
   - 站点静态文案（header actions、footer、footer 链接文字、根级错误提示）全部 i18n，跟随语言开关。
   - `README.en.md`：README.md 的完整英文对照版，两文件顶部互链（`[English](README.en.md) · [中文](README.md)`）。
   - `README.en.md` 的覆盖范围表由 `make sync` 生成（与中文版同一机制），英文名 + 英文地区标签。
3. **如何达成**：
   - **外壳 i18n**：并进方案 A 的 `t()` 体系。header/footer 文案当前写死在 `index.html` 静态 HTML、不被 `route()` 重渲染——两条路径二选一：
     (a) 把这些文案移进 JS，`applyLangButtonLabel()` / `toggleLang()` 时一并更新；
     (b) 保留 `<span class="i18n-zh">…</span><span class="i18n-en">…</span>` 双写，`toggleLang()` 设 `document.documentElement.dataset.lang`，CSS 按 `[data-lang=en] .i18n-zh { display:none }` 切换。
     **建议 (b)**：零 JS 逻辑增量、外壳文案与数据渲染解耦，且首屏（JS 加载前）就有正确语言。`document.documentElement.lang` 也在 `toggleLang()` 里同步设置。
   - **`README.en.md`**：
     - 人手写英文正文（README.md 很少变，手工同步成本低）；顶部加「本文件与 README.md 手工同步」提示注释。
     - `tools/sync.py`：`render_exchange_list()` 增加英文变体（列头 `| ID | Name | Region |`，名称取 `name_native.en`，地区取 `enum_label_maps["region"]` 的 `label_en`）；`apply_blocks()` 对 `README.en.md` 也写一次 `exchange-list` 块。
     - 先核验 20 家是否都有可用英文名：`name_native.en` 缺的（中文源所可能是 `{zh-Hans: …}`）补一个官方英文名或规范音译到 `name_native.en`（属数据补全，走正常核实流程，多数所官网有英文名，`confidence` 视来源定）。
     - `CLAUDE.md §一` 边界表补一行：`README.en.md` | 对外定位（英文） | 同 README.md 的「绝不写」；生成块清单（[ADR 里的那段]）加 `README.en.md 的 exchange-list`。
     - `make check` 的生成块一致性校验覆盖 `README.en.md`（`sync` 后 `git diff` 应为空）。
   - 验收：`make build` 全绿、生成块二次幂等；目视 `index.html` 中英切换、`README.en.md` 渲染。

### 方案 E — `en` 术语一致性一轮清理 + 可选 linter（F6）

1. **为什么需要**：20 家分批回填，术语漂移可预期；不统一削弱「横向可比」核心卖点。
2. **要达成的目标**：同一概念在 `en` 值里用词统一（或有意的市场特定用词有据可查）；确定性小错（`网路资讯商店` 等）修掉；house style 落进 glossary。
3. **如何达成**：
   - 建 glossary 概念 → `en` 映射，脚本扫 `en:` 值里偏离标准写法处（`RMB`/`Renminbi`、`auction`/`call auction`、lot 系列），**输出建议清单供人工逐条判断**（不自动改——太多合法的市场特定用法）。
   - `schema/glossary.yml` 头注加几条 house style：货币用 `RMB` + 首次出现拼全称；`Closing Auction` / `Opening Auction` 为默认，市场官方另有名称时用官方名并在该市场文件内保持一致；lot 概念默认 `board lot`，美/日等官方用语不同的沿用官方。
   - 修 `tw-twse` 简繁错误等确定性小错。
   - 打磨项，风险低，放最后批量做。

---

## 4. 执行顺序与工作量

| 批次 | 内容 | 数据改动 | 相对工作量 | 验收 |
|---|---|---|---|---|
| 1 | 方案 A + 方案 C | 无（仅 `app.js`；C 另加校验脚本） | 大（~180 串 + 校验） | headless `zh/en × 明/暗` 6 家 + 四视图无回归 |
| 2 | 方案 B | 无（仅 `app.js`；可选少量 `detail_en`） | 小 | 档案页 + 浮层 `en` 态截图；`zh` 态零变化 |
| 3 | 方案 D（完整） | 少量（`name_native.en` 补缺）+ `sync.py` + `CLAUDE.md` 边界表 | 中 | `make build` 全绿、生成块幂等；`index.html` 切换目视；`README.en.md` 渲染 |
| 4 | 方案 E | 视清单逐条人工 | 中（一次性） | `make check` + 抽查 |

批次 1 可再拆：先 A（市场机制剖面）→ A（成本瀑布 + 时区）→ C，每步单独 headless 核对。

---

## 5. 验收标准（统一）

- `make build` 全绿：`validate` 0/0、`verify_quotes` FAIL=0、`make sync` 二次幂等（`git diff` 为空）。
- 生成块唯一允许的变动：方案 D 新增 `README.en.md` 的 `exchange-list` 块。
- Chrome headless：6 家代表交易所 × `{市场机制剖面, 成本瀑布, 时区甘特条, 矩阵, 档案页, 浮层}` × `{zh, en}` × `{明, 暗}` 截图，英文态无残留中文（除 F2/F6 明确保留的中文注记、以及 `source_lang: zh` 所的 `quote` verbatim 中文原文——后者按 [ADR-013] 是溯源锚点，浮层已有「中文 Chinese」小节标题，不算夹杂）。
- `zh` 态与改动前逐屏对比无变化。

---

## 6. 收尾回写清单（CLAUDE.md §八）

- 每批次完成后 `PROJECT/ROADMAP.md` 对应条目打勾，写清楚做了哪些视图 / 多少串 / 截图核对结果。
- 全部完成后 `PROJECT/DECISIONS.md` 写一条 ADR（暂定 ADR-049），至少记：
  - [ADR-006] 边界细化（图形视图合成语句 / 长文案跟随语言开关，不恒双语）
  - 方案 B ③ 的选择理由（为何不给 `detail` 全量补 `en`）
  - 方案 D 完整版的取舍（`README.en.md` 独立文件 + 手工同步 + 生成块）
  - `CLAUDE.md §一` 边界表与生成块清单的相应改动
- 方案 C 的机器校验一旦上线，`CLAUDE.md §二`/相关处如需引用则指向该校验。
- 本文件顶部状态改「已归档」。
