# 路线图 ROADMAP

进度状态放这里；「为什么这么排」去 `DECISIONS.md`，这里不重复。

> **怎么读这份文件**
> - **现在该做什么** → 一、当前状态
> - **数据现状快照** → 二、数据看板（`make sync` 算出，不手改）
> - **当前版本的计划与进度** → 三、v2.0 计划：高度可视化转向
> - **v0.x / v1.x 已全部完成** → 四、历史归档，只在需要追溯时读
>
> **怎么改这份文件**：§三详版就地改；**§一「下一步」「最近完成」是单写者资源**——后台任务 / worktree 只往 `ROADMAP-INBOX.md` 追加便签，由交互式会话折叠进 §一（机制见 [ADR-069]、`CLAUDE.md` §八）。

---

## 一、当前状态

### 当前阶段：v2.0 高度可视化转向（2026-08-29 校准）

主视图从对比矩阵改为单市场「市场机制剖面」（旧名「交易日平面图」，[ADR-042] 更名），新增结构化 `spec` 层作为图形的数据源。方向与契约定案见 [ADR-033]～[ADR-036]，工程取舍不在此重复。

北极星（[ADR-057]）：这几个按主题分的视图是过渡形态，终态合并为单页可视化画布、其余视图（矩阵 / 时区 / 健康度 / 档案页）降级到「更多」入口。Phase 3 剩余模块按 [ADR-057] 的 merge-ready 清单设计。**合并本身是 Phase 4，硬前置：Phase 3 全部单项章节可视化模块做齐才启动，不插队。**

### 下一步（按此顺序）

1. **风险旗标 · 数据子棒**（[ADR-066] 分棒 ①）— `fx_risk_note` 就地清（17 家 `confidence: low` → `make fetch` 央行 / IMF AREAER / 交易所外资指南补一手源升 medium）+ 补 3 处空 `political_risk_note`（`cn-sse`/`hk-hkex`/`tw-twse`）+ 复核 `enforcement_note` low 簇（`cn-sse`/`cn-szse` 空、`kr-krx` low）。触及约 22 字段（近 [CLAUDE.md §四] 的 30 字段第二人复核门槛，回填前先估清）；与 [ADR-060] 任务四并轨。风险旗标渲染层已落地（[ADR-066] 分棒 ②，2026-09-04）。
2. **→ Phase 3 六个可视化模块做齐（硬前置）→ Phase 4 单页画布合并解锁**（[ADR-057]）— 成本瀑布 / 交割管线 / 上市生命周期 / 监管图 / 参与者图 / 风险旗标**六个模块渲染层均已落地**（[ADR-057] #4 按渲染层口径满足）；只差上面风险旗标数据子棒。合并画布整体布局形态 / 「更多」入口形态 / 各模块排序，Phase 4 启动时 Q&A 定；**该数据子棒是否也是硬前置留待拍板**（[ADR-066] 文末）。
3. **已做齐模块的视觉迭代**（交互式会话，不阻断 Phase 4，与上并行）— 成本瀑布（[ADR-047]：单一费种远大于其余时左半留白 / 全零市场「合计 0.00 bp」/ 暗色「此侧不征」虚线偏弱 / 按股·定额费折算粗，佣金行降级+`rate_raw` 已由 [ADR-071] 落地）、交割管线（[ADR-051]：深色预防层偏淡 / T+1 现货所右半留白 / 违约瀑布 `resource` 短语无 `en`、英文态仍中文）、上市生命周期（[ADR-059]：散文无 spec 阶段块硬裁剪 / 停复牌 ↻ 偏淡 / 8 个时长 spec 语义忠实度待第二人复核 / 给更多所补时长 spec）、监管图（[ADR-061]：卡正文 ≤4 行硬裁剪 / 中英混排 Latin 词逐字折断 / 长文卡「先摘要后全文」）、参与者图（[ADR-064]：节点卡硬裁剪 / 同上 Latin 折断）、风险旗标（[ADR-066]：制度泳道 3 卡窄 + 长散文按卡 5 行硬裁剪 / 同上 Latin 折断 / `low` 卡左缘色条暗色下几乎不可见）。剖面机制核心面板右缘避让（[ADR-070]）与零轴刻度改标参考价名称（[ADR-073]）已落地。
4. **数据空缺复核轨剩余**（横切，与上并行；[ADR-060]/[ADR-062]）— **任务三**（9 家衍生品子章 C 桶 40 处，穿插 viz）；**任务四**（5 家旗舰所深度 F 桶 78 处，`us-nyse`/`hk-hkex`/`uk-lse`/`cn-sse`/`jp-jpx`，执行方案已定案 [ADR-078]，建议 Phase 4 前完成、非硬前置）。任务二第二人独立复核已完成（[ADR-074]，2026-09-05，79 处终态 96.2% 达标）；任务五 ①② 已完成（[ADR-075]，2026-09-05，`[OTP]` 抓取 + wayback 回退 + `za-jse` 缓存重建），③（`make check` stale 清单）未做、留独立排期，`kr-krx` 剩 8 处 low 待人工投喂。另有已收口的成本瀑布残差（[ADR-065]）/ 长尾（[ADR-067]）遗留移交项：`kr-krx exchange_fees` 当期档位（KRX 数据端点对数据中心 IP 封锁，[ADR-075] 已探明，仍需人工投喂）、`us` Section 31 FY2027 公告（未发布，OPEN-QUESTIONS #88）、`fr-euronext stamp_duty`（一所多国、`rate: null` 是正确终态）。详版见三节。

完整清单与每章的小型 `spec` 补充见三节 `- [ ] **Phase 3 · 其余章节可视化**`。

### 最近完成（滚动窗口，只留最近 3 条；更早的见三节）

- **2026-09-05 · 数据空缺复核轨任务五 · 抓取基础设施修复**（[ADR-075]）— `fetch.py` 加 `[OTP]` 两步抓取 + 通用 wayback 回退（`fetch_sources.py` 复用，顺带修 `verify_quotes.py` 两处消费侧回归）；探明 KRX 数据端点对数据中心 IP 封锁、`za-jse` `.cache` 重建（CACHE_MISS 77→39）；`kr-krx` 2 处 low 坐实（`market_maker_scheme`/`dividend_withholding_tax`）；`selfcheck` 43→48，`make build` 全绿。
- **2026-09-05 · 数据空缺复核轨任务二 · 第二人独立复核完成**（[ADR-074]）— 4 个独立视角复核 79 处交易所×字段，初检 91.1%、4 处 FIX 就地订正后终态 76/79=96.2%，达 [CLAUDE.md §四] 95% 阈值，零幻觉；3 处转 OPEN-QUESTIONS。任务二「第二人独立复核待人工」标注解除。
- **2026-09-04 · Phase 3 六个 viz 模块渲染层全部落地**（[ADR-066]/[ADR-070]/[ADR-071]/[ADR-072]/[ADR-073]）— 风险旗标渲染层（`renderRiskFlags` 两泳道 5 卡 + 置信度四态 + 常驻「非评分」声明，tab 9→10）收官，[ADR-057] #4 按渲染层口径满足；穿插剖面机制核心面板右缘避让收盘竞价条（[ADR-070]）、成本瀑布佣金行降级为说明 + `cost_layer` 加 `rate_raw`（[ADR-071]）、前端隐去 taxonomy 章序数（[ADR-072]）、剖面零轴刻度改标参考价名称（[ADR-073]）四项迭代；`make build` 全绿。

---

## 二、数据看板

两处表格均由 `make sync` 扫描 `data/` 算出（`CLAUDE.md` §四：🟡 会一直挂着，直到字段真的被坐实），生成块内**不手改**。

### 交易所填充进度

<!-- BEGIN:GENERATED progress-matrix -->
| 交易所 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `au-asx` | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `br-b3` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| `ca-tsx` | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `ch-six` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| `cn-sse` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `cn-szse` | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `de-eurex` | ✅ | ✅ | ✅ | 🟡 | ➖ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | 🟡 |
| `de-xetra` | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `fr-euronext` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ |
| `hk-hkex` | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `in-nse` | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 |
| `jp-jpx` | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | 🟡 | 🟡 |
| `kr-krx` | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| `sa-tadawul` | 🟡 | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 | ✅ | 🟡 |
| `sg-sgx` | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| `tw-twse` | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| `uk-lse` | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| `us-nasdaq` | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | ✅ | 🟡 | 🟡 |
| `us-nyse` | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| `za-jse` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

列说明：2 基本信息、3 监管与法律环境、4 产品体系、5 市场结构与交易机制、6 上市、持续监管与退市、7 指数体系、8 清算、结算与交割、9 市场参与者、10 市场数据与技术基础设施、11 交易成本与税费、12 风险与特殊考量
<!-- END:GENERATED progress-matrix -->

### 数据健康度摘要

<!-- BEGIN:GENERATED health-summary -->
共 1920 个已填字段，其中 0 个超过复核阈值待复核。

| 交易所 | 已填字段 | 待复核 |
|---|---|---|
| `au-asx` | 114 | 0 |
| `br-b3` | 113 | 0 |
| `ca-tsx` | 89 | 0 |
| `ch-six` | 90 | 0 |
| `cn-sse` | 75 | 0 |
| `cn-szse` | 110 | 0 |
| `de-eurex` | 73 | 0 |
| `de-xetra` | 85 | 0 |
| `fr-euronext` | 107 | 0 |
| `hk-hkex` | 98 | 0 |
| `in-nse` | 108 | 0 |
| `jp-jpx` | 81 | 0 |
| `kr-krx` | 114 | 0 |
| `sa-tadawul` | 111 | 0 |
| `sg-sgx` | 110 | 0 |
| `tw-twse` | 83 | 0 |
| `uk-lse` | 77 | 0 |
| `us-nasdaq` | 83 | 0 |
| `us-nyse` | 76 | 0 |
| `za-jse` | 123 | 0 |
<!-- END:GENERATED health-summary -->

---

## 三、v2.0 计划：高度可视化转向

方向与契约定案见 [ADR-033]～[ADR-036]。目标：主视图从对比矩阵改为单市场「市场机制剖面」（旧名「交易日平面图」，更名见 [ADR-042]；x=日内时间/分钟，y=涨跌幅/相对前结算价），让交易员首次接触一个市场即 30 秒看懂其微观结构。本节只记进度，工程设计与取舍见 DECISIONS。

- [x] **立即执行 · A1 防幻觉机器校验补完**（2026-08-29，[ADR-033]）— `tools/validate.py` 补完防幻觉铁律的机器强制：第三方来源 `confidence` 封顶、`NUMBER_RE` 收紧杜绝垃圾 token、路径引用校验收窄到仓库内路径、结构化 `spec` 值的逐字反查（Phase 1 前 no-op）。0 存量违规，均为 preventive；`OPEN-QUESTIONS` 框架性问题 #6/#35 已解决删除、#12 更新为"此路不通"路标。
- [x] **立即执行 · A2 v1.1 尾巴收口**（2026-08-30，[ADR-034]）— `verify_quotes.py` 走 `expand_exchange`（消化 42 个假 CACHE_MISS，暴露并修 6 个真 FAIL）；`br-b3.yml` 34 处裸字符串 `sources` 归一为字典；英文回填 #45 **全库清零**（20 家）；61 个 CACHE_MISS → 0。`OPEN-QUESTIONS` #45 删除。
- [x] **Phase 0 · 范式与数据模型定案**（2026-08-30，[ADR-035] + [ADR-036]）— 修订 ADR-005（主视图=交易日平面图，矩阵降为 `#view=matrix`）；定 `spec` 结构化层契约（新文件 `schema/spec.yml` 存形状定义，含 1 条示范条目）、零构建守则、图形诚实呈现规则（`spec` 三态 null/type:none/缺省）、非现货所 y 轴 `reference` 降级；框架性问题 #39 落地（`enums.yml` 加 `covered_only`，`za-jse` 归类），#13 删除，#17/#38 更新，其余（#1/#5/#36/#41 等）"暂不改 + 明确触发条件"。
- [x] **Phase 1a · spec 层实装 + 第五章契约 + 5 家示范**（2026-08-30，[ADR-037]）— `schema/spec.yml` 写全第五章 13 字段 `spec` 形状；`sync.py` 加 `spec` 到 `ENVELOPE_KEYS` + `compute_trading_window` 优先读 `spec.{start,end}`（散文回退）；`validate.py` 加 `spec` 结构校验（键名 + dict + 5b 数值反查）；`cn-sse`/`us-nyse`/`jp-jpx`/`de-eurex`/`in-nse` 五家回填 `spec`，覆盖百分比 / 无 / 动态未公布(band_pct null) / 阶梯 / 前结算价 / 跨所联动六种形态。全 20 家时区甘特条数据零变化。
- [x] **Phase 1b · 其余 15 家 spec + 补齐**（2026-08-30 完成）— 拆两步：
  - [x] **其一 · schema/工程部分**（[ADR-038]）— `matching_principle` 转 enum：`enums.yml` 新增 4 值词表（`price_time` / `price_display_time` / `price_time_broker_priority` / `price_time_or_pro_rata`），`taxonomy.yml` 两处加 `enum_ref`，29 个字段回填 enum（19 顶层 + 10 衍生品；`in-nse` 顶层因原文缺失如实不填）；`in-nse` 加进 `EXCHANGE_IANA_TZ`（Asia/Kolkata），甘特条多一条印度柱、其余 5 家 `trading_hours` 逐字节不变。
  - [x] **其二 · 数据回填部分**（[ADR-039]，协调者串行——非并行子代理，理由见 ADR）— 15 家第五章 `spec`（`trading_sessions` / `opening`·`closing_mechanism` / `price_limits.main_board` / `circuit_breaker`）从既有已核实 `quote` 结构化；全 20 家 `volatility_interruption`(19/20)·`short_selling`(18/20)·`market_maker_scheme`(18/20) 的 `spec`（缺口均为数据文件本身 `zh` 空的真实缺口）；JPX 值幅制限**完整 34 档** `ladder`（抓官方 PDF 逐行核实，此前误记 37 档已改）；`schema/spec.yml` 加 `randomised_seconds` / `random_close_window_min` 键。`make build` 全绿、`spec` 5b 0 FAIL、时区甘特条 6 家 `trading_hours` 逐字节不变。
- [x] **Phase 2 · 交易日平面图**（2026-08-30 实装，[ADR-040]）— `app.js` 新增 `renderTradingDay` / `tdBuild`（手写 SVG，按 [ADR-035] A 字段→元素映射 + D 诚实渲染三态 + C 零构建）；顶部「市场 Market」下拉；路由默认值改 `trading-day`，`renderMatrix` 转显式分支，矩阵仍在 `#view=matrix`；`index.html` tab 调整（平面图为第一个 tab，理由见 [ADR-040]）。非现货所按 [ADR-035] E：`de-eurex` y 轴换「前结算价」+ banner；10 家有衍生品子块的加淡 banner（现货 / 衍生品切换开关待 Phase 3 补 `derivatives.*.spec`）。`openCellOverlay` 加「结构化 Spec」节。改动仅前端三文件，`docs/data/` 无 diff。**Chrome headless 六形态截图核对通过；矩阵 / 时区 / 健康度无回归。**
  - [x] **打磨迭代 + 20 家巡检**（2026-08-30，[ADR-040]「打磨迭代」段，PR #29）— 线条视觉语言去重（墙=红实线 / 熔断=红长虚线 / 动态带=蓝虚线 / 波动走廊=灰点线，图例补齐）、JPX 阶梯带降透明度 + 边界线、chips 定宽定高 + 2 行截断 + title + 加「波动性中断」chip、`band_pct`/`limit_pct` null 兜底改角标（不臆造墙线位置）、sa-tadawul 右缘叠字修复、跨所联动熔断说明行。20 家全形态渲染巡检通过。
  - [x] **收口审查第一轮反馈已处理**（2026-08-30，[ADR-040]「收口审查反馈」段）— ① 图例移到主图上方；② 中心留白 → 中心信息卡：把「日内价格受什么约束」（价格限制 + 熔断 + 回转）综述成 1–3 行放平面中央，`au-asx`/`hk-hkex` 这类「以无涨跌停为特征」的市场空白中心现在直接说结论；连带 `yR` 系数收紧、0 基准线加标签、画不出墙的情形不再角落标注。
  - [x] **收口审查二轮 / 三轮反馈已处理**（2026-08-30，[ADR-040]「收口审查第二/三轮」段）— 二轮：x 轴时间坐标上下各一排、网格恒 30 分钟、个股/合约级熔断 chip 展开机制描述。三轮：标注层 chips 分「交易机制」+「交易细则·成本」两组，新增 tick size / 交易单位 / 交收周期 / 佣金 / 印花税·交易税 / 跨境互联互通 六个跨章 chip。
  - [x] **收口审查四轮 · 更名 + schema 对齐交易员心智模型**（2026-08-30，[ADR-042]）— 主视图更名「交易日平面图」→「**市场机制剖面**」（旧名只描述形式不反映内核，[ADR-040] 补记）。据资深交易员（对照 Harris《Trading and Exchanges》）的「首次接触陌生市场需知」清单审查 schema：第五章补 `execution_model`（执行模型，enum）/ `error_trade_rule`（错误交易处理规则）/ `order_book_transparency`（订单簿透明度）三字段；`schema/spec.yml` 加 `execution_model`/`error_trade_rule`/`order_types`/`tick_size` 四个 spec 形状 + `short_selling.margin_note` 键；`README` / `CLAUDE.md` 写明「执行风险 / 市场冲击 / 真实流动性 / 价格聚簇不在覆盖范围，需实盘验证」。**只动 schema/spec/文档 + 前端更名，不动 `data/`；`make build` 全绿。生成块唯一变动：`za-jse` 第五章 ✅→🟡（此前 20 家里唯一填满，新增 3 空字段后分母 +3，符合预期、不加 `optional`）。数据回填并入下方 Phase 3。**
  - [x] **收口 gate 达标**（2026-08-30）— 用户执行「30 秒看懂」非专业读者实测，通过。Phase 3 解锁。
- [ ] **Phase 3 · 其余章节可视化** — 成本瀑布 → 交割管线 → 上市生命周期（三棒做齐 [ADR-059]，含 [ADR-036] #5 的章节级 `only_spot` 标记 + `renderListingLifecycle` + 顶层 tab + 档案页折叠）→ 监管图 → 参与者 → 风险旗标（B 组 `fx_risk_note`/`kr-krx` low 簇就地清）→ …按交易员价值迭代，每章带一次小型 `spec` 补充。**并入 [ADR-042] 的第五章三字段 + 四个 spec 形状的 20 家回填**（`execution_model` 达 ≥16/20 后补 `in_matrix: trading_mechanism`）。
  - [x] **Phase 3 首棒 · [ADR-042] 三字段 + 四 spec 形状 20 家回填**（2026-08-30 完成，[ADR-043]）— `execution_model`（20/20，10 order_driven + 10 hybrid，从既有 `matching_principle`+`market_maker_scheme` 派生）/ `error_trade_rule`（20/20，17 high + 2 medium + 1 low，实抓官方规则，呈现「阈值复核制 / 双边合意制 / 成交终局」三谱系）/ `order_book_transparency`（20/20，6 high + 12 medium + 2 low）；`order_types` + `tick_size` 的 spec 从既有 quote 结构化（美股走 17 CFR 242.612、欧洲走 RTS 11、其余按各所自有表）；`short_selling.spec.margin_note` 各所均不具区分性、未补。**偏离 [ADR-017]：7 路并行子代理瞬间打爆 session limit（429），改协调者串行**，20 个 commit（每家一个）+ 3 收尾 commit。`execution_model` 覆盖 20/20 → taxonomy 加 `in_matrix: trading_mechanism`。退出验收：`validate` 0/0、`verify_quotes` OK 1027→1071 / FAIL=0 / CACHE_MISS=0（44 个新 high 字段逐字反查全过）+ 8 家×2 字段语义抽检全过；全库已填字段 1770→1844。`kr-krx`/`sa-tadawul`/`in-nse`/`br-b3` 几个 medium/low 缺口已进 OPEN-QUESTIONS。
  - [x] **修复 · `.cache` 误提交为符号链接**（2026-08-30，[ADR-044]，PR #36）— `4fc61db`（PR #35 内）随 us-nyse 提交误 `git add` 进一个 `.cache` 软链，后果：任何 checkout 都长出该软链使工具 `CACHE` 路径失效；且 `git pull` 到该提交时会为放置这个 tracked 软链而静默删除被 `.gitignore` 忽略的 `.cache/` 目录，本地 1071 份 verbatim-quote 反查凭据丢失。已 `git rm --cached` + `.gitignore` `.cache/`→`.cache`。⚠️ **`.cache/` 需 `python3 tools/fetch_sources.py` 全量重跑重建**——重建前 `make check` 的 `verify_quotes` 会显示 `OK=0 / CACHE_MISS≈1071`（信息性、不阻断，`data/` 未受影响、ADR-043 已验过 FAIL=0）。**这是重建前那一刻的快照，不是当前状态**——`.cache/` 是环境局部的（`.gitignore` 排除，`git worktree` 也不复制），是否已重建、重建到几分，跑 `make verify-quotes` 看当前实际输出（见 [ADR-053]）。
  - [x] **Phase 3 第二棒（数据层）· 成本瀑布 spec 形状 + 20 家回填**（2026-08-30，[ADR-045]）— 四个设计轴用户 Q&A 定案：① 6 费种进瀑布（佣金/交易所费/清算费/监管费/印花税/金融交易税；资本利得税·股息预扣税作注解另列）② 镜像双瀑布（买入侧/卖出侧，`side: buy/sell/both` 键）③ 归一 bp 在渲染层做，spec 只存 quote 撑得住的原始值 + `unit` ④ 新增顶层 tab「交易成本瀑布」（`index.html` 实际文案，见 [ADR-047] 渲染层落地的 tab）。`schema/spec.yml` 加 `costs.*` 共用 `cost_layer` 形状（`rate`/`unit`/`currency`/`side`/`cap`/`components`/`tiered`/`type:none`/`note`）。协调者串行 3 commit，全 20 家共 **103 个 costs spec**：实体费率 bp 化（hk/cn-szse/in-nse/uk/ch/au/sa/de-xetra…）、多项分征费 `components`（hk SFC+AFRC、us NSCC）、`type: none` 关键事实（澳/加/巴/沙/日/德 印花税·FTT）、`rate: null` 幽灵条（全部佣金 + maker-taker 所 + tw/za 非阿拉伯数字 quote）。`validate` 0/0（5b 44 个 high 数值 spec 全过）、`verify_quotes` FAIL=0（未动 quote）。
  - [x] **清理 · 删除 `tier`（标杆批次）身份字段**（2026-08-30，[ADR-046]）— 用户判定"交易所是第几批建档的"是无效信息。整字段删除：`schema/enums.yml` 词表 + `taxonomy.yml` 字段定义、20 家 `data/exchanges/*.yml` 的 `tier:` 行、`sync.py`（`REQUIRED_IDENTITY_FIELDS` / `build_enum_label_maps` / README exchange-list 的「批次」列）、`SKILL.md` 填写步骤。前端自 [ADR-025] 起已无 `tier` 引用。`make check` 0/0、`verify_quotes` FAIL=0（未动 quote/zh/spec）。**未动**：ROADMAP 的 Wave/Batch 进度日志、历史 ADR（[ADR-016] 等）、glossary 词条里的"v1.1 Batch 1"造词说明——工作日志不是交易所元数据（用户选最窄范围）。
  - [x] **Phase 3 第二棒（渲染层首版）· 成本瀑布 `renderCostWaterfall`**（2026-08-30，[ADR-047]）— `docs/assets/app.js` `renderCostWaterfall` / `cwBuild`（手写 SVG 镜像双瀑布：中轴 0 bp、左买右卖，6 费种逐行按 `spec.side` 落侧 + 底部小计 + 往返合计）、`cwToBp` 归一（pct/permille/bp/per_lakh/per_crore/per_million 直换，per_share/flat_* 按假设成交额 100,000·股价 50 折算标 `≈`，`components` 求和、`tiered` 取首档标 `▸`、`cap` 记 tooltip 标 `^`）、诚实三态（实心条 / 幽灵斜纹条「议价·未披露」/ `type:none`「不征收」/ 无 spec「未结构化」）、持有·退出税（资本利得税·股息预扣税）图下方另列、点击复用 `openCellOverlay`、`de-eurex` prev_settlement 淡 banner；`index.html` 加顶层 tab（排「市场机制剖面」后）、路由键 `cost-waterfall`、`styles.css` `.cw-*`。**仅前端三文件，`docs/data/` 零 diff；`make build` 全绿（生成块无变化）；Chrome headless 13 家 × 明暗两主题截图核对通过，其余四视图无回归。** 已知局限（留交互式迭代）：单一费种远大于其余时左半留白、全零市场「合计 0.00 bp」略尴尬、暗色「此侧不征」虚线偏弱、按股/定额费折算较粗——见 [ADR-047]。
  - [x] **Phase 3 第三棒 · 交割管线可视化 — 设计定案**（2026-08-30，[ADR-048]）— 用户 Q&A 定三个方向：① **双泳道并列**（x=相对交易日天数；上泳道现货 T+N 流水线「成交→novation→轧差→保证金→DvP 终局」2–3 格封口，下泳道衍生品「成交→每日盯市循环 motif→不按比例的『到期』抽象区块→最终结算」；纯现货所下泳道 `type: none` 灰条、de-eurex 只画下泳道）② **违约瀑布作主图下方常驻附图**（与成本瀑布「主图+常驻税注解」同版式），纵向层级堆叠 = 动用顺序，按「谁的钱」上色（违约方红 / CCP SITG 橙 / 存续会员黄 / 法定风险基金灰）；`spec` 只存层级顺序+bearer 不存金额（不触校验 5b）③ **新增 `guarantee_model` 枚举**。本棒只定方向、未动 `schema` / `data`。
  - [x] **Phase 3 第三棒（数据层）· `default_management.spec` 形状 + `guarantee_model` 枚举 + 20 家回填**（2026-08-31，[ADR-050]；ADR-049 归英文版修订条）— 实施前一轮 `spec` 形状细化 Q&A（三题全取推荐）：本棒范围=只做数据层 / `layers` 粒度=`bearer` 枚举 + `resource` 自由短语 / `guarantee_model`=taxonomy 第 8 章正式字段 + `enum_ref`。**`schema/` 三文件**：`enums.yml` 加 `guarantee_model` 4 值（`ccp_novation` 15 家 / `exchange_as_ccp` br·kr·tw / `lines_of_defence` za 现货 / `shared_ccp` us×2 的 NSCC）；`spec.yml` 加 `clearing.default_management` 形状（`model` + `layers`〔`order`/`resource`/`bearer`〕+ `note`，`bearer` 5 值——[ADR-048] 的 4 类 + 新增 `external` 外部授信 / 保险，因 cn-sse·hk·sg 有明确外部资源层）；`taxonomy.yml` 第 8 章 `csd_name` 后加 `guarantee_model`（`en_required` + `enum_ref`，**不加 `in_matrix`**）。**回填 20/20**：`default_management.spec` = 12 家完整 `ccp_default_waterfall` layers（hk 8 层 706 条、sg 6 层 (a)–(f)、uk 8 层、de-eurex/xetra 6–7 层、cn-sse 5 层 68 条…）+ 1 家 `lines_of_defence`（za）+ 7 家 `unstructured` 三态占位（ca/jp/sa/tw/us×2——框架存在、逐层瀑布未在一手页呈现，[ADR-048] 预期）；`guarantee_model` 20/20（7 high + 13 medium，`quote` 全复用同文件既有已核实字段）。**只动 `schema/` + `data/` + `PROJECT/`（DECISIONS / ROADMAP / SKILL）+ 生成产物；未动前端、未动 `docs/data/freshness.json`（依 ADR-043/045 惯例）。** 退出验收：`make check` 全绿——`validate` 20 家 0/0、`verify_quotes` FAIL=0（CACHE_MISS=1079 为 [ADR-044] 待重建已知态，当次快照非当前状态，见 [ADR-053]）；生成块唯一变动 `health-summary` +20（1844→1864），`progress-matrix` **零 diff**（`guarantee_model` 20/20 全填、`za-jse` 第 8 章仍 ✅）。**渲染层（`renderSettlementPipeline` + 顶层 tab，动前端三件套）留英文版修订合并后**——避让并行前端工作，同 [ADR-045]/[ADR-047] 分棒。
  - [x] **Phase 3 第三棒（渲染层）· `renderSettlementPipeline`**（2026-09-01 完成，[ADR-051]）— `docs/assets/app.js` `renderSettlementPipeline` / `spLanes`（双泳道手写 SVG：上「现货」`成交→CCP 介入→净额轧差·保证金→DvP 终局 T+N`，下「衍生品」`成交→每日盯市 ↻ 循环→不按比例断口→到期抽象区块→最终结算`；三态 `only`/`both`/`none` 由 `spDerivState()` 定，`none` 用软表述不硬断言「本所无衍生品」）/ `spWaterfall`（违约瀑布常驻附图，按 `default_management.spec.layers[].order` 堆叠、按 `bearer` 上色，`unstructured` 三态占位，`spec.note` 走 `zhNoteBlock` 英文态折叠）/ `guarantee_model` 四形 CCP 节点（菱形 / 叠方孔 / 套小菱形 / 空心盾）/ 顶层 tab「交割管线」+ 路由键 `settlement-pipeline` + `styles.css` `.sp-*` + `--sp-gold` 令牌。`Nmax = max(settleDays, 2)`。从一开始接语言开关（`t()`/`tSel()`/`fieldLabel`/`enumDisplay`）。顺带修 `tools/check_ui_i18n.py` 的 `enclosing_callees` O(位置×字面量数) 性能（命中 `t`/`tSel` 提前返回 + 二分判定，行为等价，7 分钟→数秒）。纯前端四文件、`data/` 与 `docs/data/` 零 diff、`make sync` 幂等。Chrome headless `hk-hkex`/`de-eurex`/`za-jse`/`us-nyse`/`cn-sse`/`br-b3`/`uk-lse`/`sg-sgx` × 中英 × 明暗核对通过，五视图无回归。**已知局限**：违约瀑布 `resource` 短语无 `en`、英文态仍中文（同 [ADR-049] 对 `detail` 的结构性处置，触发条件见 ADR-051）；深色预防层色块偏淡、T+1 现货所右半留白（留交互式迭代）。见 [ADR-048] 三方向。
  - [x] **修复 · `freshness.json` 的 `age_days`/`stale` 改由前端现算**（2026-09-01，[ADR-052]，PR 待合并）— 这两个键是构建时刻的派生值，落盘会导致① 每次 `make build` 在 1864 条记录上造出与内容无关的 diff，② 线上过期判定冻结在上次构建那天。`sync.py` 不再把 `age_days`/`stale` 写进 `freshness.json`（`render_health_summary` 仍用 Python 侧算出的完整值，不受影响）；`manifest.json` 新增 `volatility_months`（`VOLATILITY_MONTHS` 常量的唯一生成出口）；`app.js` 新增 `daysSince`/`applyStaleness`，在 `loadCore()` 用 `verified`+`volatility`+`volatility_months` 按访客当天现算，下游 `staleSet`/矩阵 stale-dot/健康度页零改动。`make build` 全绿、`make sync` 二次幂等；Chrome headless 核对健康度页「0 个超过复核阈值待复核」与服务端 health-summary 生成块一致，矩阵视图 280 个 `<td>` 正常渲染无回归。**同棒顺带**：ROADMAP 里 [ADR-044]/[ADR-050] 记录的 `verify_quotes` 历史快照数字补限定语，指向 `make verify-quotes` 看当前实际状态（不改写数字本身，见 [ADR-053]）——起因是本棒验证时撞上 `git worktree` 不复制 `.cache/` 的现场例证（同一仓库、同一提交，worktree 内 `CACHE_MISS=1078` 而主 checkout 是 `OK=1000/CACHE_MISS=78`）。
- [x] **Phase 3 第二棒（数据层收尾）· 成本瀑布 13 降级点 + 6 补强点逐条复核 + `validate.py` 5c 机器化**（2026-09-01 落地、2026-09-02 收尾审查修订，5c 见 [ADR-058]；数据层部分承接 [ADR-054] 留下的坐实项）— 分三棒 + 收尾审查：
  - **A1 · 5c 机器化**（[ADR-058]）— `validate.py` 在 5b 外新增 **5c**：`spec.note` 字符串里的数字必须在**本交易所文件内任一字段的 `quote`/`zh`**（或本字段 `detail`）命中，把「note 夹带无出处数字」从人工抽检变成构建关卡；连带清现网 13 处残差（多为跨字段复述 `price_limits` 阈值、少数无源折算值）。做过正负向探针。
  - **A2 · 13 个 `type: none` 降级点逐条复核** — 用 `make fetch` 重抓税法/税务局原文。方法学结论：**`rate: null` 本身是审慎正确的终态**——税务局页只覆盖自身税种、**不证伪** FTT/监管费。终态：`kr-krx stamp_duty` 判 `type: none`（**第三方综述 PwC 支撑、标暂定**，收尾审查把「一手源」措辞收敛为四大税务简报）；`hk-hkex FTT` **收尾审查回退 `rate: null`**（此前据 IRD 页翻 `type: none`，但引文讲的是印花税减免、不支撑「无独立 FTT」）；`au-asx FTT` 源升级为 Baker McKenzie（第三方律所综述）仍 `rate: null`；`ca-tsx`/`kr-krx regulatory_fees` 缺干净源维持 `rate: null`；余 8 点维持并在 OPEN-QUESTIONS #88 留痕。
  - **A3 · 6 个 `side`/费率补强点复核** — `kr-krx` STT `side: sell`（韩国《证券取引税法》英文版 elaw.klri.re.kr 一手，transferor=卖方，✅ 逐字）、`us-nasdaq regulatory_fees`（eCFR 17 CFR 240.31『covered sale = a sale of a security』逐字，✅）、`br-b3` IOF `side: buy`（B3 "incoming resources"）；**残差**：`uk-lse` SDRT `side: buy`（gov.uk/HMRC 为 SPA）、`za-jse` STT `side: buy`（**收尾审查**：ADR-058 曾记「SARS applies to the purchase」但本字段 quote 未含该措辞，改为保留 `side: buy` + 待补强）。
  - **收尾审查修订**（2026-09-02，[ADR-058]「收尾审查修订」段）— 对 A1–A3 落地做第二视角复核，逐条落地 8 项改进（B1 hk-hkex 回退 / B2 「一手源」措辞收敛 / B3 补 5 个 `verified` / B4 复核 12 处 note 删数：5 处还原为文件级合法交叉引用、6 处确认删除正确〔含 cn-szse 102/98、ch-six 随机 30 秒本就无源〕/ B5 5c 放宽到文件级 / B6 5c 补法规引用号剥离 / B7 校准为「文件级 quote/zh + 本字段 detail」/ B8 文档收尾）。
  - **退出验收**：`make check` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make build` 全绿、`make sync` 二次幂等；`PROJECT/COST-WATERFALL-SPOT-CHECK.md` 已回写 A2/A3/收尾状态。新增登记来源域名：`ecfr.gov`（一手，联邦法规）、`elaw.klri.re.kr`（一手，韩国法令英文版）、`resourcehub.bakermckenzie.com` / `taxsummaries.pwc.com`（第三方税法综述，封顶 medium）。
  - [x] **残差收口**（2026-09-04，[ADR-065]）— 收尾审查留下的 `side`/`type: none`/触发点残差逐条处理，触及 7 字段：`uk-lse stamp_duty` `side: buy` 坐实（HMRC/gov.uk『Tax when you buy shares』——『you pay tax when you buy』，非 SPA 页）；`za-jse stamp_duty` `side: buy` 坐实（SARS『Who is it for?』段——member/participant『may recover the tax payable from the persons to whom the securities were transferred』；顺带把 `.cache/za-jse` 从空重建到含 SARS 页）；`kr-krx stamp_duty` `type: none` 由「暂定」转韩国《印花税法》第 1 条一手支撑（税基=文书、纳税人=文书制备者，非证券转让）；`ca-tsx regulatory_fees` **实质修正**——不是「查不到」是「查到了、是浮动费」：CIRO《Equity Market Regulation Fee Model》成本回收制（Message Processing Fee + Trade Fee，Participants 缴纳，OSC Bulletin 24-0154 第 8 节），`rate: null` 保留；`hk-hkex FTT` 按「审慎终态」关闭（香港列举式税制 + IRD 征费封闭清单无 FTT 条例，仍是推断、不足以翻 `type: none`）；`us-nyse`/`us-nasdaq regulatory_fees` FY2027 无变更（SEC Latest Section 31 仍 FY2026 公告，FY2027 未发布），加 `verified: 2026-09-04` + 触发点跟踪句；`kr-krx exchange_fees` 无 rate 变更（KRX 站 JS）、补 KED Global 佐证。`make check` 全绿、`make sync` 二次幂等；生成块变动仅 `matrix.json`/`freshness.json`（zh/en 文本 + `verified` 日期 + `has_detail` 派生），`progress-matrix`/`health-summary` 零 diff。新登记 URL（域名均已在册）：`gov.uk/tax-buy-shares`、`elaw.klri.re.kr` 印花税法、`osc.ca` CIRO Bulletin 24-0154、`kedglobal.com` 费率沿革、`sec.gov` fee-rate-advisories 列表页。**剩**：`kr-krx exchange_fees`/`regulatory_fees`（KRX 非 JS 端点）、`us` FY2027 公告（待发布）、若干 `type: none` 长尾（见 OPEN-QUESTIONS #88）。
  - [x] **长尾收口**（2026-09-04，[ADR-067]）— [ADR-065]「剩」段的 `type: none` 长尾。范式（本条确立）：一国「证券交易环节流转税」有一部**完整立法**、把证券交易明文并入征税范围且无独立「金融交易税」税目时，按 [ADR-002] 语义映射至 `stamp_duty`，则 `financial_transaction_tax` 判 `type: none`（confidence medium，结构性推断）；监管费同理靠监管机构**经费来源立法**（机构分担金 vs 按交易计收）。触及 8 字段 / 7 家：`cn-szse regulatory_fees` 补 `rate: 0.02 permille`（发改价格规〔2018〕917号，ndrc.gov.cn，现行标准无有效期限）+ `cn-sse` 同步换 2018 通知去 hedge；`cn-sse`/`cn-szse stamp_duty` `side: sell` 升《印花税法》第三条一手（fgk.chinatax.gov.cn『对证券交易的出让方征收，不对受让方征收』）；`cn-sse`/`cn-szse financial_transaction_tax` `type: none`（《印花税法》即完整立法）；`de-eurex stamp_duty`+`FTT` `type: none`（自持 Bundestag BT-Drs.16/12571 + 衍生品无过户结构性论据，同 de-xetra）；`za-jse FTT` `type: none`（SARS『levied on every transfer of a security』）；`za-jse regulatory_fees` 补 `rate: 0.0002 pct`（Investor Protection Levy，sharenet 第三方逐字，jse.co.za 全 Cloudflare 403、2026 现行 ~0.000345% 未一手核实）；`sg-sgx regulatory_fees`+`FTT` `type: none`（SGX-ST Rule 4.23.2：客户须知按笔费用 = CDP/SGX-ST 收费 + 印花税 + GST）；`au-asx FTT` `type: none`（州可流通证券印花税对上市已全废 + PwC Australia 综述无 FTT 条目）；`kr-krx regulatory_fees` `type: none`（《金融委员会设置法》第 46/47 条：FSS 经费 = 政府/韩行拨款 + 受检机构分担金，同 au-asx ASIC 先例）。`make check` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 二次幂等；生成块变动 `health-summary` +2（1855→1857，cn-sse/cn-szse 各 +1）、`OPEN-QUESTIONS auto-issues` −2 行（cn-szse FTT / kr-krx regulatory_fees 由 low 升 medium），`progress-matrix` 零 diff。新登记 URL：`ndrc.gov.cn` 2018 监管费通知、`fgk.chinatax.gov.cn` 印花税法、`rulebook.sgx.com` 4.23、`taxsummaries.pwc.com` Australia、`elaw.klri.re.kr` 金融委员会设置法、`sharenet.co.za` 费率表。**剩（已移交，非本轨）**：`kr-krx exchange_fees` 当期档位（→ 任务五 KRX OTP-AJAX）、`us` Section 31 FY2027（触发点未到）、`fr-euronext stamp_duty`（一所多国、`rate: null` 是正确终态）。
  - [x] **剖面视觉迭代 · 机制核心面板 + 透视开关**（2026-09-01，[ADR-055]，PR #49 已合并）— [ADR-040]/[ADR-042] 后重开的剖面打磨。「交易机制」七项事实（价格约束结论句 + 撮合/订单类型 · 熔断/波动中断 · 卖空/做市商 六格）从主图下方 `flex-wrap` chip 收进主图中心一块**固定 628×276、垂直居中于零轴**的 `<foreignObject>` 面板（`tdCorePanel`）；切换 20 家交易所每个槽位屏幕坐标不变、顶栏结论句恒一行。面板右上角 `◐/●` **透视开关**（`role="td-ghost"` + `localStorage`）：一点面板退成虚线轮廓、内容淡出，露出被它盖住的零轴 / 熔断线 / 走廊（透视态面板 `pointer-events:none`、只按钮可点）。四向边距按用户建议收到原来一半（左右各 60px、上下各约 28px，仍上下对称）。`tdHeadlineParts` → `tdEnvelopeLine`（恒 1 行）；`tdChip` 提升为模块级两处共用；banner 移到 SVG 之前；`tdSidePanels` 瘦身为只剩「交易细则·成本」组、容器改定宽 6 列 grid（`.td-chips-6`）。纯前端两文件（`app.js` / `styles.css`），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化。`validate` 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK。Chrome headless `cn-sse`/`kr-krx`/`de-eurex`/`us-nyse`（英）/`kr-krx`（暗）× 透视开关两态核对通过，成本瀑布 / 矩阵无回归。**已知局限**：① 纯衍生品所（`de-eurex`）无涨跌停线时对称性退化为单纯居中（不影响可读性）；② ~~面板占绘图区 ~84%×69%，某些所收盘竞价竖条被盖~~ → 已由 [ADR-070] 落地（右缘避让）；③ 首档熔断线默认被面板盖住（几何必然，透视按钮兜底，见 [ADR-055]）；④ 长值仍 2 行截断、未追求 3 行。
    - [x] **右缘避让收盘集合竞价竖条**（2026-09-04，[ADR-070]，PR #66 已合并）— [ADR-055] 已知局限②落地。`tdBuild` 算 `clsLeftX`（收盘竞价块左缘 `X()`，判定与 `auc()` 画不画逐条一致），`tdCorePanel` 右缘收到 `min(748, clsLeftX−14)`、宽度 `max(430, …)`，左缘 / 行高 / 垂直居中不动。受影响 7 家（`cn-sse`/`cn-szse` x≈719、`tw-twse` x≈655、`kr-krx` x≈610 等）面板宽 476–605，其余 13 家 + `auc()` 不画收盘竞价的所（`de-eurex`/`de-xetra`/`uk-lse`）保持 628。纯前端一文件（`docs/assets/app.js`），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化；`make build` 全绿（`selfcheck` 43/43、`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）；`node --check` 通过；20 家逐一按 `X()` 重算核对无重叠、宽度下限 430 未触发。**已知局限**：下限 430 若被未来某所触发会重新压住竞价条（下限优先）；开盘竞价条伸进面板左侧的所仍未处理（本条只动右缘）；面板宽度不再是跨所常数。
    - [x] **零轴刻度改标参考价名称 / 删 y 轴标题与内嵌批注 / 临时停牌文案居中**（2026-09-04，[ADR-073]，PR 待合并）— 剖面 y 轴此前三处重复表达同一件事（顶栏工具条一句 + 旋转 y 轴标题「涨跌幅 %（相对前收盘价）」+ 零轴旁批注「0 = 前收盘价」），零轴刻度本身只写无信息量的「0%」。删旋转标题与内嵌批注，零轴刻度直接画参考价名称（按空格拆词、超两词短语两行右对齐防溢出，`de-eurex` 的 `previous settlement` 最长词组仍在 `PL−8=52px` 预算内），新增 `.td-tick-0`（无衬线 8.5px，与数字刻度等宽字体区分）。「临时停牌可发生于任意时刻」从左对齐斜纹条改水平居中。纯前端两文件（`app.js`/`styles.css`），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化；`make build` 全绿（`selfcheck` 43/43、`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）；`node --check` 通过；20 家 `yRef` 两种取值逐一按字符宽度估算核对不溢出、垂直方向不与相邻刻度碰撞。**已知局限**：未做 headless 截图核对像素级排版（本环境 Chrome 在 worktree 沙箱下签名校验失败，同 [ADR-070]），以上为字符级估算非渲染实测。
  - [x] **Phase 3 · 成本瀑布数据层核查 · 103 个 `costs` spec 独立复核**（2026-09-01，[ADR-054]）— 对 [ADR-045] 回填的 103 个 `costs.*` spec 做第二人独立复核（离线 spec-vs-quote，四档深度 × 6 维度，逐条结论表 `PROJECT/COST-WATERFALL-SPOT-CHECK.md`）：**8 FIX + 13 DOWNGRADE，初检通过 82/103 = 79.6%，全部就地处置后终态 100%、`make check` 全绿、`PROJECT/` 生成块零 diff**。三类系统性缺口：① `note` 字符串数字无机器覆盖（`cn-sse` 夹带深交所费率、`br-b3`/`fr-euronext` 夹带无源税率、`sg-sgx` 币种错）→ 4 处 FIX；② `type: none` 正面依据缺失 → 13 个降级 `rate: null`（根因：把「费率页没列」当「不征收」）；③ `tiered`/`side` 时间性键（`kr-krx` 临时阶梯 2026-02-13 已到期）。`side` 裁定细则已立（未明说则保留 + OPEN-Q，不移除——渲染层缺省回退 `both`）。后续：13 个降级点待重抓税法原文坐实 + `validate.py` 5b 补 `note` 数字反查（见「下一步」）。

  - [x] **Phase 3 · 成本瀑布迭代 · 佣金行降级为说明 + `cost_layer` 加 `rate_raw`**（2026-09-04，[ADR-071]，用户 Q&A 定案）— 用户问「佣金字段是否所有交易所都空白、要不要保留」。核查确认 `commission_structure` 是 6 费种里唯一「20 家 0 个数值、0 个明确不征」的费种（15 幽灵条 + 5 未结构化），根因结构性（佣金去管制、不写进交易所/清算所规则、落在覆盖边界外，[CLAUDE.md]），非抓取缺口。**两处改动**：① **佣金退出瀑布条**（`app.js`：`CW_FEE_ORDER` 6→5）——降为图下方一行说明（券商议价、通常零售最大一笔显性成本、按覆盖边界不量化），点击复用 `openCellOverlay` 看本所佣金结构；`costs.commission_structure` 数据字段不动，仍在剖面 chip / 档案页出现。② **`cost_layer` 加 `rate_raw`**（`schema/spec.yml`）——原文非阿拉伯数字给费率时 `rate` 填人工转写值、`rate_raw` 存原文逐字串；`tw-twse.stamp_duty` `{rate: 3, rate_raw: "千分之三", permille, sell}` + `za-jse.stamp_duty` `{rate: 0.25, rate_raw: "0,25%", pct, buy}`——两市场最大的一笔成本此前渲染成幽灵条，现为实心条 + `*` 标记（解决 OPEN-QUESTIONS「`cost_layer` 加原文数值串键」悬案）。`validate.py` 加 `rate_raw` 校验（verbatim 子串反查 quote + ASCII 纯数字型比对 `rate`，5b 相应豁免；[CLAUDE.md §四] 新不变式机器化，含 2 条负向测试）。**退出验收**：`make build` 全绿（`selfcheck` 43/43、`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK、6 处生成块零 diff）、`make sync` 二次幂等；`docs/data/` 仅 `tw-twse`/`za-jse` 两 JSON 变（spec 加键）。Chrome headless 5 家 × 核对通过（`tw-twse` 印花税 30bp 实心条 / `za-jse` STT 25bp / `hk-hkex` 默认 / `jp-jpx` 全零 / `uk-lse` SDRT 仅买侧）。人工核对 2 处转写（千分之三=0.3% / 0,25%=0.25%）通过率 2/2（< §四「>30 字段第二人复核」门槛，协调者自检）。

  - [x] **Phase 3 第四棒 · 上市生命周期剖面 · 设计 + 数据层 + 渲染层（三棒做齐）**（2026-09-02 设计 / 数据层，2026-09-03 渲染层，[ADR-059]）— Phase 3 剩余四个章节可视化模块的首棒。**流程**：先做仿真数据 MVP 原型（三个虚构「示例所」× 中英 × 明暗，验证「证券的一生」时间轴形态 / 诚实三态 / `only_spot` 折叠 / 语言开关 / 零构建，**未落库**），用户确认形态可以，7 个设计轴按推荐项定案（时间轴形态 / 板块阶梯 + 转板 / 停复牌 ↻ 回环 / 退市不分叉 + 触发框 / merge-ready 独立分区「年」尺度 / 只加两段时长 spec / `only_spot`）。**数据层 + 渲染层分棒落地**（同 [ADR-045]/[ADR-050]）：
    - **章节级 `only_spot`**（承接 [ADR-036] #5）：`taxonomy.yml` `listing` 章加 `only_spot: true`；`de-eurex.yml` `listing._meta.not_applicable: true` + note、**删 9 个「N/A —…」占位字段 + `boards: []`**；`sync.py` `chapter_status` 短路返回 `➖`、`compute_freshness` 跳过；`validate.py` 加两条不变式（`not_applicable` 仅限 `only_spot` 章 / 被标章不留带 zh 的 leaf），正负向探针过。
    - **两段时长 `spec` 形状**（`schema/spec.yml` 新增，`value`/`unit`/`range`/`type:none`/`note`）+ **8 家从既有 `quote` 结构化回填**：`listing_process_duration` 5 家（`br-b3` 12/39 工作日、`fr-euronext` 8 周、`hk-hkex` 30/40 营业日、`kr-krx` 45/65 工作日、`sa-tadawul` 6–12 个月 medium）；`delisting_transition_period` 3 家（`br-b3`/`ca-tsx` 30 日、`uk-lse` 20 工作日）。**其余 12 家 spec 缺省是预期**——多数市场不设法定固定时长，或唯一来源把数字拼写成单词 / 中文数字（5b 逐字反查拿不到）。`hk-hkex`/`us-nyse` 退市侧刻意不收（补救期限 / Form 25 生效期与「可继续交易的整理期」语义不同，满条填充会误导），转 OPEN-QUESTIONS。
    - **退出验收**：`make check` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 二次幂等；生成块变动**仅 `de-eurex`**——`progress-matrix` 第 6 列 ✅→`➖`、`health-summary` 已填字段 80→71（总 1864→1855），其余 19 家零变动，符合预期。触及约 17 个字段（8 spec + de-eurex 9 字段清理），在 §四「> 30 字段第二人复核」门槛之下——协调者逐条 spec-vs-quote 自检。
    - **渲染层（2026-09-03）**：`docs/assets/app.js` `renderListingLifecycle` / `llBuild`（手写 SVG「证券的一生」水平轴，节点 / 阶段块 `data-role="cell"` 复用 `openCellOverlay`，从第一版接 `t()`/`tSel()`；诚实三态：有 `spec` 画比例填充条 / `type:none` 空心点 / 有散文无 spec 硬裁剪 + `<title>` / 缺省虚线框）+ 顶层 tab「上市生命周期 / Listing Lifecycle」排「交割管线」后（tab 6→7）+ 路由键 `listing-lifecycle` + `styles.css` `.ll-*` + 档案页 `renderObjectChapter` 对 `_meta.not_applicable` 折叠。纯前端三文件（`app.js` +370 / `styles.css` +24 / `index.html` +1），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等；`check_ui_i18n` OK；Chrome headless `hk-hkex`/`br-b3`/`uk-lse`(EN·暗)/`za-jse`/`de-eurex`(折叠) + 档案页 + 交割管线 / 剖面无回归。**已知局限**：有散文无 spec 的阶段块内是硬裁剪片段（全文在 `<title>` + 浮层）；停复牌 `↻` 偏淡；给更多所补时长 spec 是数据层活。
    - **待复核**：8 个时长 spec 的语义忠实度未经第二人独立复核（触及字段 < §四 硬门槛，协调者自检）；建议做视觉迭代时一并过一遍。

  - [x] **Phase 3 第五棒 · 监管图 Regulation Map — 设计定案 + 渲染层（两棒做齐）**（2026-09-03，[ADR-061]）— Phase 3 剩余章节可视化模块的第二棒（首棒 [ADR-059]）。
    - **流程**：仿真数据 MVP 原型（三个虚构市场 × 中英 × 明暗，验证四层槽位 / 空白虚线态 / 长文多辖区 / 暖色法律基座，未落库）形态通过；设计轴按推荐项定案（无人值守自动续跑会话，未现场 Q&A——用户异议可在本棒两个 commit 上回滚，回滚依据 = [ADR-061]）。
    - **设计**：第三章 8 字段固定槽位纵向四层「监管截面」（SVG W=1180）——监管主体三卡（`regulator` / `self_regulatory_org` / `clearing_regulator`，左缘 `--info`）→ 法律基座 `core_laws` 满宽暖色卡（`--warn`）→ 外资与资金两卡（`foreign_ownership_limit` / `capital_controls`，左缘 `--accent`）→ 透明与保护两卡（`disclosure_requirements` / `investor_protection`）。卡头 `fieldLabel`、正文 `dv()` 折 ≤4 行、全文进 `<title>` + 点击复用 `openCellOverlay`；诚实三态退化为实心 / 虚线「未记录」（本章无 spec、无 `type:none`，[ADR-035] D 退化两态）。
    - **数据层评估 = 零 spec 需求**：8 字段全为散文、无量化机制值可结构化（[ADR-035] B）——`spec` 缺省是预期，非缺口。现网 9 处空白是真实研究缺口、走 [ADR-060] 任务二 / 四轨道，本棒不代劳。纯衍生品所（de-eurex）第三章全章适用、无 `only_spot`。**本棒未动** `data/`、`schema/`、`tools/`。
    - **渲染层（2026-09-03）**：`docs/assets/app.js` `renderRegulationMap` / `rmBuild`（+171；`rmEnvCard` / `rmLawStrip` / `rmLaneLabel` / `rmWrap` / `rmLegend` / `rmProse`）+ 顶层 tab「监管图 / Regulation Map」（排「上市生命周期」后，tab 数 7→8）+ 路由键 `regulation-map` + `styles.css` `.rm-*`（+19）+ `index.html`（+1）。纯前端三文件、`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化、`check_ui_i18n` OK。Chrome headless `sg-sgx`（EN 暗色）/ `fr-euronext`（中文亮色，多辖区长文 + 2 空白）/ `hk-hkex`（中文，闸门 2 空白 + 保护 1 空白）核对通过，其余视图无回归。**已知局限**：① 卡片正文按卡高 ≤4 行硬裁剪（全文在 `<title>` + 浮层；长文卡「先摘要后全文」散文精修属数据层活）；② 空白虚线卡点击后浮层无正文（部分空白带 `detail` 草稿、en 态走 `zhNoteBlock` 折叠）；③ 全 20 家图高一致、空白多的市场纵向留白一致（诚实呈现，非 bug）；④ 中英混排时 Latin 词 / 数字被 `llWrap` 逐字切分从中间断开（与 `renderListingLifecycle` 共用 `llWrap` 的既有局限）。
    - **视觉修订（2026-09-03，接审查反馈）**：审查方对 5 家长文所 × 明暗做 headless + SVG 几何实测，抓出**卡内密排 CJK 长行越过卡片右沿约 6px**——`rmWrap` 的 `per` 只扣 4px、没算正文 `x+14` 左内边距 + 右留白。修：`rmWrap` 改扣 24px，`per` 43/27。几何复测每卡右侧余量 ≥14px、纵向本就无裁剪。纯前端一处、`docs/data/` 零 diff。设计七轴经审查确认、不回滚。见 [ADR-061] 视觉修订段。

  - [x] **Phase 3 第六棒 · 参与者图 Participant Map — 设计定案 + 数据层评估 + 渲染层（做齐）**（2026-09-04，[ADR-064]）— Phase 3 剩余章节可视化模块的第三棒（首棒 [ADR-059]、第二棒 [ADR-061]），Phase 4 硬前置之一（[ADR-057] #4）。
    - **流程**：仿真数据 MVP 原型（两个虚构市场样例「环宇交易所 GLOBEX」全填 / 「京华交易所 JINGHUA-EX」多空白 + 一个「投资者结构迷你构成条」设计轴变体 × 中英 × 明暗，验证三层槽位 / 接入链 / 外资平行道 / 诚实两态 / 语言开关 / 零构建，**未落库**、放 `/tmp/pt-mvp/`），用户 2026-09-04 现场确认形态**按此定案**、7 个设计轴逐条拍板。
    - **设计**：第九章 6 字段固定槽位纵向三层「参与者截面」（SVG `W=1180`，与 [ADR-059]/[ADR-061] 同版式）——① **谁在场上** `investor_structure` 满宽单卡（左缘 `--info`）→ ② **我怎么进场** `membership_structure`→`broker_landscape`→`account_opening_requirements`→`suitability_management` 四节点「接入链」（前两环 `--accent` 中间机构层 / 后两环 `--warn` 准入门槛，节点序号 1–4，链末终点小圆「你」）→ ③ **外资走哪条道** `foreign_access_channel` 满宽平行道（左缘 `--accent`），肘形虚线汇入**同一终点「你」**+ caption「会员环并入 / 额度·互联互通绕过」。卡头 `fieldLabel`、正文按卡宽 / 卡高硬裁剪、全文进 `<title>` + 点击复用 `openCellOverlay`；诚实退化为实心 / 虚线「未记录」两态（本章无 spec、无 `type:none`，[ADR-035] D 退化）。接入链方向 = 机构侧 → 终端投资者，不加独立「交易所」起点节点；外资通道不做精确并入连线（各所并入点不同、精确连线误导）。
    - **数据层评估 = 零 spec 需求**：6 字段全为散文（占比描述 / 机构名 / 法定义务），无量化机制值可结构化（[ADR-035] B）——`investor_structure` 的百分比经轴 5 权衡后**取纯散文不 spec 化**（用户拍板；口径不统一 + `confidence` 多 medium + `volatility: moderate` 年更负担 + 一句话散文同样承载「机构 vs 散户 vs 外资主导」），同 [ADR-061] 先例。现网 6 处空白（`cn-sse` ×3、`cn-szse` / `hk-hkex` / `us-nyse` 的 `foreign_access_channel`）是真实研究缺口、走 [ADR-060] 任务二 / 四轨道，本棒不代劳。纯衍生品所（`de-eurex`）第九章全章适用（Eurex 有完整「交易参与者准入」体系，正是 OPEN-Q #17 点名的衍生品对应概念）、无 `only_spot`。**本棒未动** `data/`、`schema/`、`tools/`——只改 `PROJECT/DECISIONS.md`（[ADR-064]）+ `PROJECT/ROADMAP.md`。
    - **设计层验证**：MVP 截图（明 / 暗 × 中英 × 散文 / 构成条）三层槽位对齐、接入链 4 节点 + 终点「你」+ 外资平行道汇入清晰、空白虚线 / 实心左缘差异可见、卡头随 langMode 正确切换。
    - **渲染层落地（2026-09-04，[ADR-064] 文末「渲染层落地」段）**：`docs/assets/app.js` `renderParticipantMap` / `ptBuild`（+160，手写 SVG `W=1180` 三层槽位；`ptEnvCard` 满宽 / 节点共用、`ptWrap` 独立折行、终点小圆「你」+ 外资平行道肘形虚线汇入、节点序号 + 箭头）+ 顶层 tab「参与者图 / Participant Map」（排「监管图」后，`index.html` tab 数 8→9）+ 路由键 `participant-map`（`route()` + `change` 事件 `pt-exchange` 分支）+ `styles.css` `.pt-*`（+26）+ 图例复用 `.rm-legend`。从第一版接 `t()` / `tSel()` / `fieldLabel` / `dv()`。**顺带修 `.header-tabs`**：9 tab 一行放不下，`flex-wrap: wrap` + `.tab-btn { white-space: nowrap }` —— 放不下整块换第二行、不再把 CJK 标签从字当中折断。纯前端三文件、`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化、`check_ui_i18n` OK。Chrome headless 核对 `hk-hkex` / `cn-sse`（3 空白）/ `za-jse`（EN 暗）/ `de-eurex`（纯衍生品全章渲染）/ `us-nyse`（暗）/ `uk-lse`（EN）/ `br-b3` × 1440/1280/1024 三档宽，`regulation-map` / `trading-day` / `matrix` 无回归。**已知局限**：① 散文长 → 节点卡按卡高硬裁剪 + 全文进 `<title>` + 浮层（[ADR-035] D，同 [ADR-059]/[ADR-061]）；② 中英混排 Latin 词被 `llWrap` 逐字切断（[ADR-061] 已知局限④，三模块共用）；③ 固定槽位使全 20 家图高一致；④ < 1080px SVG 在容器内横向滚动。见 [ADR-064] 文末。

  - [x] **Phase 3 第七棒（设计 + 数据层评估）· 风险旗标 Risk Flags**（2026-09-04，[ADR-066]）— Phase 3 剩余章节可视化模块的第四棒（首三棒 [ADR-059]/[ADR-061]/[ADR-064]），四个 viz 模块里最后一个拿到设计 ADR。Phase 4 硬前置（[ADR-057] #4）= 四个模块**均落地**——参与者图与本模块的渲染层棒 + 本模块 `fx_risk_note` 数据子棒仍未做，Phase 4 未解锁。
    - **本章的结构性差异**：第十二章 5 字段（`fx_risk_note` / `political_risk_note` / `liquidity_risk_note` / `regulatory_change_risk_note` / `enforcement_note`）全为分析性 `*_note` 散文——宪法「覆盖边界」段与 [ADR-020] 点 4 已定：这类字段**结构性停留在 `confidence: low/medium`**（没有官方文件会写「本国流动性风险是 X」）。所以「我们对这条掌握到什么程度」本身就是信息——决定了轴 3，也是本模块区别于监管图 / 参与者图（置信度多 medium/high、退化两态）之处。
    - **流程**：MVP 原型（3 个虚构市场「北岸 / 南港 / 海峡」× 中英 × 明暗，验证两泳道固定槽位 5 卡 / 置信度四态 / 「非评分」常驻声明 / 语言开关 / 零构建，**未落库**）——本次为 **Artifact**（后台任务、用户异步复核）而非 `/tmp/`；7 轴按推荐 + 用户经 3 个结构化问题当场确认（形态 OK / 分组取「交易层面 vs 制度·地缘·执法」两泳道 / `fx_risk_note` 就地清纳入作独立数据层子棒）。
    - **设计**：第十二章 5 字段固定槽位两泳道「旗标面板」（SVG `W=1180`，与前三棒同版式）——① **交易层面**（`--info` 蓝）`liquidity_risk_note` / `fx_risk_note` 两卡；② **制度 · 地缘 · 执法**（`--warn` 琥珀）`regulatory_change_risk_note` / `political_risk_note` / `enforcement_note` 三卡。**置信度作一等视觉信号**（轴 3）：旗标字形填充度四态——`high` 实心「有据可查」（规则 / 案例 + 逐字 quote）/ `medium` 半填「综合判断」/ `low` 空心「定性背景 · 无官方来源」+ 极淡斜纹卡底 / 缺省 虚线框「未记录」；**旗标填充度 = 取证程度，不是市场风险高低**（图例 + 常驻声明写明）；卡面置信度走中性梯度（accent → warn → faint），红 `.badge-low` 只在出处浮层。**常驻「这不是风险评分」声明**（轴 4，同成本瀑布「主图 + 常驻附注」版式）：本图汇总已写进规则 / 已发生的信号（在途制度变更 / 已执行的制裁与暂停 / 公开在案的执法个案），不打分不排名；执行风险 / 市场冲击 / 价差深度须实盘验证、不在覆盖范围。明确不做：时间轴 / 评分表盘 / 热力图 / 市场排名。
    - **数据层评估 = 零 schema/data 改动（本设计棒）+ 一次 `fx_risk_note` 就地清作独立数据层子棒**：5 字段全散文、无量化机制值可结构化（[ADR-035] B），同 [ADR-061]/[ADR-064] 零 spec。承接 [ADR-020] 欠的 Category B：`fx_risk_note` 近全库 `confidence: low`（多家 `detail` 写「本次未附官方来源」），可按各国央行 / IMF AREAER / 交易所外资指南补一手源升 medium（汇率**制度**可逐字记录；「历史波动较大」这类定性判断仍停 medium）；顺带填 3 处空 `political_risk_note`（`cn-sse` / `hk-hkex` / `tw-twse`）、复核 `enforcement_note` low 簇（`cn-sse` / `cn-szse` / `kr-krx`）。作独立数据层子棒（保持设计棒零 data 改动），与 [ADR-060] 任务二 / 四并轨。纯衍生品所（`de-eurex`）第十二章全章适用、无 `only_spot`（轴 7）。**本棒未动** `data/`、`schema/`、`tools/`——只改 `PROJECT/DECISIONS.md`（[ADR-066]）+ `PROJECT/ROADMAP.md`。
    - **分棒 —— 留给后续棒**：① 数据层子棒（`fx_risk_note` 就地清 + 第 12 章 low 簇复核，> 30 字段则第二人复核）；② 渲染层棒 = `docs/assets/app.js` `renderRiskFlags` / `rfBuild`（手写 SVG 两泳道 5 卡 + 置信度旗标字形 + 诚实四态 + `rfWrap` 折行）+ `docs/index.html` 顶层 tab「风险旗标 / Risk Flags」（排「参与者图」后）+ 路由键 `risk-flags` + `styles.css` `.rf-*` + 档案页第十二章**不折叠** + headless 核对。新代码从一开始接语言开关。MVP 原型（Artifact，未落库）已验证形态。
    - **并行分支双重撞号（同 [ADR-029]）**：起初 ADR-064 撞并行「参与者图」→ 让号 065 又撞并行 PR #58「成本瀑布残差」→ 最终 **066**、「第六棒」改「第七棒」、分支基于 `worktree-participant-map-design` 栈式叠放。
    - **验证（设计 + 数据层评估棒）**：MVP 原型（明 / 暗 / 中英）两泳道槽位对齐、四态视觉差异可见（实心 / 半填 / 空心旗标 + 虚线缺口）、常驻「非评分」声明在位、卡头随 langMode 切换；`make check` 基线不受影响（未触碰被 `sync.py` 扫描的文件）、生成块零 diff。
    - **渲染层落地（2026-09-04，[ADR-066] 文末「渲染层落地」段）**：`docs/assets/app.js` `renderRiskFlags` / `rfBuild`（手写 SVG `W=1180` 两泳道固定槽位 5 卡；`rfCard` 诚实四态 = `rfFlag` 三角旗字形按 `env.confidence`〔high 实心 + 左缘不透明度 1 / medium `fill-opacity 0.32` + 0.6 / low 空心 + `#rf-hatch` 斜纹 + 0.3 / 无值虚线框「未记录」〕；取证词走中性梯度色，红 `.badge-low` 只在浮层；卡 `data-role="cell" data-chapter="risks"` 复用 `openCellOverlay`；`rfWrap` 同 `rmWrap` 思路）+ `rfDisclaimer` 常驻「这不是风险评分」声明块（`.rf-disclaimer` + 红 `.rf-hard`）+ `rfProse` 说明段 + 顶层 tab「风险旗标 / Risk Flags」排「参与者图」后（`index.html` tab 9→10）+ 路由键 `risk-flags`（`route()` + `change` 事件 `rf-exchange` 分支）+ `styles.css` `.rf-*`（+31）。从第一版接 `t()` / `tSel()` / `fieldLabel` / `dv()`。档案页第十二章不折叠（无 `only_spot`）。纯前端三文件（`app.js` +206 / `styles.css` +31 / `index.html` +1），`data/` 与 `docs/data/` 零 diff、`make sync` 幂等、生成块无变化、`check_ui_i18n` OK。Chrome headless 核对 `us-nyse`（四态全出）/ `cn-sse`（制度泳道 3 卡全缺口）/ `hk-hkex`（2 缺口）/ `de-eurex`（纯衍生品全章）/ `za-jse`（全 medium）× 中英 × 明暗 + DOM dump 5 cell 齐无加载错误；`participant-map` / `trading-day` 无回归。**已知局限**：① 制度泳道 3 卡窄（`w3 ≈ 313px`）、长散文按卡 5 行硬裁剪 + 全文进 `<title>` + 浮层（[ADR-035] D，同前三棒）；② 中英混排 Latin 词被 `llWrap` 逐字切断（[ADR-061] 局限 ④，四模块共用）；③ 固定槽位使全 20 家图高一致；④ 窄于 1080px SVG 横向滚动；⑤ `low` 卡 0.3 左缘色条暗色下几乎不可见（意图内，旗标字形 + 斜纹承载信号）。
    - **Phase 4 前置进度**：四个 viz 模块（[ADR-059]/[ADR-061]/[ADR-064]/[ADR-066]）**渲染层均已落地**，[ADR-057] #4 按渲染层口径满足。仍未做：`fx_risk_note` 数据层子棒（[ADR-066] 轴 6 定为独立子棒 / 与 [ADR-060] 任务二·四并轨；§一「下一步」与 auto-memory 并列进「Phase 3 做齐」两棒之一）——**是否也是 Phase 4 启动硬前置，留合并协调者 / 用户按 §一 拍板**。

- [ ] **Phase 3 第七棒分棒① · 风险旗标数据子棒**（方案定案 2026-09-05，[ADR-080]；执行未开始）— [ADR-066] 轴 6 留的独立数据层子棒，与 [ADR-060] 任务二 / 四并轨。渲染层已把 `confidence` 做成该章面板一等视觉信号（[ADR-066] 轴 3），`fx_risk_note` 近全库 `low` 使 20 家「交易层面」泳道恒显空心旗标、读不出跨市场差异——子棒目标是**让这一格在图上重新携带信息**，不是把 low 改成 medium 这个动作本身。
    - **估清结果（§一 #1 要求的「回填前先估清」，实算 20 家 × 5 字段 = 100 个字段位：`low` 21 / `medium` 44 / `high` 27 / 空 8）** —— 三点勘误：① `fx_risk_note` = 17 `low` + **1 空（`uk-lse`，属补填非就地清）** + 2 `medium`（`fr-euronext` **零 `sources`** / `za-jse` 2 源），实质动 18 家、须 20 家全扫；② 第 12 章空缺是 **8 处不是 5 处**，ROADMAP 原口径漏了 `cn-sse.regulatory_change_risk_note` 与 `hk-hkex.liquidity_risk_note`，按原口径做完两家面板仍各留 1 虚线框；③ **「第 12 章结构性停留 low/medium」在数据上已不成立**（27 处 `high`，全是「具名法条 / 具名个案 + 逐字 `quote`」）——宪法「覆盖边界」约束的是分析性**内容**、非整章字段。
    - **方案要点** —— ① `*_note` 按「**制度核 / 分析尾**」二分写，`confidence` 取整条下限（留了 `quote` 撑不住的分析尾即封顶 `medium`）；`fx_risk_note` 一律删分析尾（波动率 / 风险情绪判断本就在覆盖边界外，且现有 17 条夹着「本次未附官方来源」这类**自述性免责**——渲染层已把 `confidence` 画成旗标，散文再写一遍是两处渲染）。② **边界三分**：`fx_risk_note` 只负责**汇率制度本身** + 政策主体 + 一句敞口指向，资金进出 / 换汇管制归 `regulation.capital_controls`，币种归 `overview.*_currency`——现有 6 家（`cn-sse`/`cn-szse`/`in-nse`/`tw-twse`/`kr-krx`/`za-jse`）在此复述了 `capital_controls`，改交叉引用（`kr-krx`/`za-jse` 已是范式）。③ **IMF AREAER 按第三方（国际组织）计、封顶 `medium`**，要 `high` 必须该国央行一手可引正文；终态因此分两级，不设一刀切。④ 来源登记是前置工序：17 个候选域名（16 家央行 / 货币当局 + `imf.org`）**14 个未登记**（仅 `mas.gov.sg`/`rbi.org.in`/`resbank.co.za` 有）。⑤ **不折入** `fx_regime` 枚举 / `spec`（[ADR-066] 轴 6 已定零 `spec`），但 `quote` 须摘到官方对本国汇率制度的定性表述原文，日后另立枚举棒零重抓。⑥ 作业串行、单所闭环（[ADR-043] 教训）。
    - **机器校验缺口（执行时同批实装，[CLAUDE.md §四]）** —— `fx_risk_note` 的 `volatility: stable` 使它**不受校验 4（`volatile`/`moderate` 必须有 `sources`）约束**，这正是 18 家零来源停在 `low` 而 `make check` 全绿的原因。加**限定第 12 章**的不变式：5 字段的 `confidence: medium|high` 必须有**字段级** `sources`、不接受章节 `_meta` 继承（`expand_field` 的继承正是 [ADR-074] 复核者点名的漏洞——消极认定类字段静默继承与断言无关的章节默认来源）；今日按字段级口径 2 处违反（`fr-euronext.fx_risk_note` / `de-eurex.liquidity_risk_note`，后者靠继承蒙混、展开后口径只剩 1 处）。全库 `medium` 零来源按展开口径 **64 处且全部 `volatility: stable`**（`moderate`/`volatile` 已被校验 4 兜住，能零来源的只剩 `stable` 一档——`fx_risk_note` 正踩在这缺口上），远超本子棒，**不折入**、转 `OPEN-QUESTIONS`。
    - **范围三档** —— 核心 **24 字段**（`fx_risk_note` 20 家全扫 / 18 处实质改动 + 3 处空 `political_risk_note` + `enforcement_note` low 簇 3 处）；建议扩容 **+2**（`cn-sse.regulatory_change_risk_note` / `hk-hkex.liquidity_risk_note`，补上则第 12 章 8 处空缺全清、20 家面板零虚线框，两家均在 [ADR-060] 任务四名单；⚠️ `liquidity_risk_note` 只填官方**结构性**数据，价差 / 深度按覆盖边界不填）；顺带 **+2**（`ch-six`/`cn-szse` `political_risk_note` low 就地清）。**第二、三档留用户拍板。**
    - **验收** —— [CLAUDE.md §四] 95% 抽检；24（三档全取 ≤28）**未过 30 的强制第二人复核线**，但**建议自愿走一次第二人独立复核**（[ADR-054] 串行回填初检约 80%、[ADR-074] 任务二初检 91.1%，本批跨 17 种货币制度、多语种一手源，错误率结构上更高）。
    - **本条只出方案，零 `data/` 改动**（同 [ADR-066] 设计棒处置）：只改 `PROJECT/DECISIONS.md` + 本文件 + `PROJECT/OPEN-QUESTIONS.md` + `PROJECT/ROADMAP-INBOX.md`。

- [ ] **Phase 4 · 单页画布合并** — 把市场机制剖面 / 成本瀑布 / 交割管线 / Phase 3 剩余模块合并为同一页的一块可视化画布，对比矩阵 / 时区甘特条 / 数据健康度 / 档案页降级到「更多」入口（北极星定案见 [ADR-057]，此前只在 [ADR-056] 与宪法开篇点到）。Phase 3 剩余每个模块的设计定案按 [ADR-057] 的 merge-ready 清单逐条回答（锚定关系 / 占位 / 诚实三态 / 语言开关 / 零构建）。
  - **启动前置条件（硬顺序，不插队）：Phase 3 的全部章节可视化模块——上市生命周期（三棒做齐 [ADR-059]）/ 监管图 / 参与者 / 风险旗标——均已落地。** 在此之前不启动合并、不动前端做画布布局；单项没做齐就合并会反复重排（[ADR-057] 定了什么 #4，用户 2026-09-01 复述强调）。
  - [x] **方向定案**（2026-09-01，[ADR-057]）— 终态形态 + 「更多」降级 + merge-ready 设计清单立项，承接 [ADR-056]「遗留」。**本条不做**：合并画布的整体布局形态（纵向滚动 / 缩放平移 / 分区网格）、「更多」入口形态、各模块排序 —— 留 Phase 4 启动时 Q&A。（注：原「Phase 4 · Wave 3」已被 [ADR-041] 解散为按需能力、不再是 Phase，此编号在此复用。）

**v2.0 的 Phase 序列到 Phase 4 为止。**

- [x] **英文版可用性修订**（横切条目，不属于 Phase 序列；审查 2026-08-30，四批次全部执行完 2026-08-31，[ADR-049]）— 走查发现「英文版」（`langMode: en`）只在矩阵 / 档案 / 健康度三视图部分成立；市场机制剖面 + 成本瀑布几乎全中文（Phase 2/3 新代码未接语言开关），另 1028 个 `detail` 从不翻译、[ADR-006] UI 双语约定多处漏网、站点外壳与 `README` 无英文。**完整审查 + 修订计划见 `PROJECT/ENGLISH-REVISION-PLAN.md`（已归档），决策落点见 [ADR-049]，此处只记执行结果。**
  - **批次 1（方案 A + C，[ADR-049]）**：市场机制剖面 / 成本瀑布 / 时区甘特条全面接入语言开关，约 180 个串走新增的零依赖 `t(zh, en)` / `tSel()`；chip 名改为按 `chapter` + `path` 查 taxonomy 的 `label_zh` / `label_en`（**中文态因此有 5 个 chip 改名**，是唯一偏离「zh 逐字不变」处，理由见 ADR）。新增 `tools/check_ui_i18n.py` 并入 `make check`（已用探针串验证能拦下）。
  - **批次 2（方案 B，[ADR-049]）**：`detail` / `spec` 的 `*note` 键在英文模式下收进默认折叠的 `<details>`，摘要 `Analyst note (Chinese) ▾`，沿用 [ADR-026]「加视觉标记、不改数据可见性」。
  - **批次 3（方案 D，[ADR-049]）**：`index.html` 外壳文案（加载提示、页脚免责声明、`title=` 提示、`<html lang>`、`<meta description>`）随开关切换，走纯 CSS 双写方案；新增 `README.en.md`（手工同步，`exchange-list` 块由 `sync.py` 生成，中文版英文版同一函数两个 `lang`）。数据侧补 5 个 `name_native.en`。`make check` 的生成块新鲜度校验五处 → 六处。
  - **批次 4（方案 E，[ADR-049]）**：新增 `tools/check_en_terms.py`（`make check-en-terms`，只出建议清单、不自动改、不进 `make check`）；house style 写进 `schema/glossary.yml` 头注；55 处候选人工逐条判断后实改 4 处（3 个 `Renminbi` → `RMB`、1 处 `lot size` / `board lot` 同句混用），修 `tw-twse` 简繁错字 `网路资讯商店` → `網路資訊商店`（已开官网核对）。
  - **验收**：`make build` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK、`make sync` 二次幂等）。Chrome headless `--dump-dom` 逐屏核对 6 家 × {剖面, 瀑布, 档案} + 时区 + 矩阵：中文态与 `git show HEAD` 前端逐行 diff，**成本瀑布 6/6、档案页 6/6、矩阵 逐字一致**，剖面仅差上述 5 个 chip 改名；英文态外壳 / 折叠块 / 语言切换按钮均正确。
  - **过程中修掉两个真 bug**（详见 ADR）：`cwBuild` 里 `for (var t …)` 因 `var` 提升遮蔽了模块级 `t()` 文案助手，导致成本瀑布两种语言模式都白屏；`tdHeadlineParts` 把已语言化的变量再套进 `t()` 模板，中文态输出「S&P 500跌」而非原文「指数跌」。

- [x] **不变式纯函数合成用例自检**（横切条目，2026-09-03，[ADR-063]；接 [ADR-062] 审查反馈）— [ADR-059]/[ADR-062] 的 `not_applicable` / `optional` 判定抽了纯函数但探针一次性跑过就丢，B/D 桶勘误回 F 后**全库无真实 `not_applicable`**，`validate.py` 这两条检查跑不到核心分支。新增 `tools/selfcheck.py`（stdlib，无 pytest）固化 24 条正负向用例（`field_na_violations` 6 / `chapter_na_violations` 6 / `count_chapter_leaves` 8 / `chapter_is_not_applicable` 4），接入 `make check`（排 `validate` 前）；`validate.py` 抽 `chapter_na_violations()` 纯函数（内联调用点行为等价）。负向探针确认失配 → 退出码 1。今后新增 / 改一条不变式纯函数 = 顺手补 `selfcheck.py` 用例（[CLAUDE.md §四] 操作化落点）。

- [x] **并行 worktree 防失序 · 四道护栏**（横切条目，2026-09-04，[ADR-069]）— 2026-09-03/04 三条后台 worktree 并行 → 合并把 `main` 的 `make check` 合红（`c0c2b04`，PR #63 收拾）。四类失序、成因各异，共同点是并行分支各自手写 git 无法语义合并的单写者资源。四道护栏：① `validate.py` 加 `roadmap_nextstep_violations` / `roadmap_recent_violations`（§一「下一步」编号 `1..n` 连续无重复、「最近完成」≤3）+ `validate_no_conflict_markers`（全库扫 `<<<<<<< ` / `||||||| ` / `>>>>>>> ` 残留），`selfcheck` 加 12 条用例；② §一 改单写者——新增 `PROJECT/ROADMAP-INBOX.md`，后台任务只往收件箱追加便签、由交互式会话折进 §一，`CLAUDE.md §八` 改写；③ `GIT-RUNBOOK.md` 定「后台 PR 串行合并、每合一个 `git pull --ff-only && make build`、红则停」；④ 新增 ADR 编号台账（当时的 `ADR-LEDGER.md`）+ `validate.py` `adr_ledger_violations`（`DECISIONS.md` 每条 ADR 都登记过、台账编号连续无重复），`selfcheck` 加 7 条用例。**（台账与占位符两套机制已于 2026-09-05 随 [ADR-dev-automation] 退役——ADR 改为一条一个文件、不再取号；本条其余三道护栏仍在。）** `selfcheck` 24→43。**未做（列 [ADR-069]）**：`renumber_adr.py` 机械让号、`DECISIONS.md` 拆文件、CI。**已知局限**：护栏 3 是纪律非机器强制（后台任务平台限制不能装 CI 卡点）；§一 折叠动作仍靠交互式会话记得做；`make check` 全绿 ≠ 无并行风险，只覆盖这四类已复现的。`make build` 全绿、`data/` 与 `docs/data/` 零 diff。

- [x] **前端隐去 taxonomy 章序数**（横切条目，2026-09-04，[ADR-072]，原占 ADR-070，撞已合并的 [ADR-070]/[ADR-071]，按 ADR-029 协议让号）— 六个可视化视图的设计思想段落写「本视图由第X章《XXX》……驱动」，SVG 空态 / 工具条另有「见档案页第五章」「第 8 章未记录」「第三章 8 字段固定槽位」等，档案页左栏以 `chapter_no + ". "` 渲染「2. … 12.」——这套序数来自 `taxonomy.yml` 的 `chapter_no`（源自原始十三章大纲，[ADR-010]），前端没有一个页面把它当目录呈现，读者看到「第五章」无从知道是什么的第五章。二选一（加框架标签页 / 隐去）取**隐去**：与北极星逆行的是加标签（[ADR-057] Phase 4 要减标签），且病灶是序数不是章名。改法：`docs/assets/app.js` 约 15 处 reader-facing 串删序数、保留章节名 + 「每所档案页某章」的指向（英文态用 `taxonomy` 的 `label_en` 原词），档案页导航去掉数字前缀（`chapter_no` 仍留 `taxonomy` / `docs/data`，只是不进 DOM）。新增 `tools/check_no_chapter_ordinals.py`（复用 `check_ui_i18n.scan` 扫 app.js 字面量 + index.html 正文，命中 `第X章` / `Chapter N` 即 FAIL，注释放行），并入 `make check`。**未做**：档案页导航顶部框架说明行 + footer 链接（「可选补强」，留 Phase 4）；`[ADR-xxx]` 链接改人话（相关但独立）。合并 `origin/main`（含 [ADR-070] 面板避让 / [ADR-071] 成本瀑布佣金迭代 / [ADR-066] 风险旗标渲染层）后：语义合并了 `cwProse()` 一处真实代码冲突（保留 [ADR-071] 的 5 费种新内容，套用本条去序数改法）；新加的 `check_no_chapter_ordinals.py` 当场抓出风险旗标模块（合并前不存在、不在本条原始 15 处范围内）也带同款「第十二章」/`Chapter 12` 悬空引用（`rfProse` 说明段 + 工具条note，共 4 处），一并按同一改法修掉——验证了本条机器校验拦「后续新视图再犯」的设计意图确实生效。`make build` 全绿（`check_no_chapter_ordinals` OK、`check_ui_i18n` OK、`validate` 0/0、`verify_quotes` FAIL=0）、`make sync` 幂等、`data/` 与 `docs/data/` 及生成块零 diff（只动前端 + `tools/` + `Makefile` + `PROJECT/`）。

- [x] **开发流程自动化 · CI 作合并关卡 + ADR 一条一个文件**（横切条目，2026-09-05，[ADR-dev-automation]）— 用户提出疲于「开 PR 等人工点、跑 `make assign-adr` 定号、反复解 PR 冲突」三件事。核对确认非主观感受：近 12 个 PR 里 4 次是「让号 / 解冲突」提交，且 [ADR-029]/[ADR-069]/[ADR-076] 三条 ADR 管理的是同一个症状。两条根因：① ADR 编号是全局串行标识而 80 条全追加在同一个 2183 行文件尾 → 并行必撞，[ADR-076] 为消除撞号引入的定号步骤本身成了新人工动作、漏跑一次 main 就红（PR #77 即是）；② 无 CI、无分支保护、`allow_auto_merge` 为 false → 人工点合并既是瓶颈又不是真关卡（不跑 `make build`，PR #61/#62 因此把 main 合红）。**轨 A**：新增 `.github/workflows/build.yml`（PR + push main 上跑 `make build` + 产物零 diff），仓库开 `allow_auto_merge` / `delete_branch_on_merge`（用户授权代跑）。**⚠️ 轨 A 只完成了一半**：auto-merge 等的是必需状态检查，`main` 未配 required check 前 `--auto` 等于无条件立即合并、不等 CI；且**本次 PR 上 CI 未触发**（该仓库 107 次 Actions 运行全是 Pages 的 `dynamic` 事件，`event=pull_request` 为 0，从未跑过自定义 workflow，文件确认已在远端）。**待办**：合进 main 后由 `push: main` 触发一次确认 Actions 可用，再给 `main` 配 required check `build` + `enforce_admins: false`（后者保住 [CLAUDE.md §六] 的交互式直推）；在那之前后台任务不要用 `--auto`。**轨 B**：80 条 ADR 机械切分到 `PROJECT/decisions/` 下逐条成文件（零丢失断言 80/80），数字编号**冻结**、新条目一律 `ADR-<slug>.md` 不取号；`DECISIONS.md` 退化为生成索引；**1270 处存量 `[ADR-NNN]` 引用一处未改**；删除编号台账、定号脚本、`make assign-adr` 与 `validate.py` 两套对应机制。**轨 D**：`CLAUDE.md` §一/§六/§八 + `GIT-RUNBOOK.md` + add-exchange skill 同步改写。新增 `adr_file_violations()` 三条不变式（文件名 = 首行 id / id 不重复 / 标题非空），`selfcheck` 换 8 条用例、总数 63 全过；路径校验对历史 ADR 文件豁免（[ADR-046] 不可变，写下时存在的文件后来被删是正常演进）。两条反向验活通过（改坏首行 id、引用不存在的 slug 均被拦，恢复后复绿）；`make build` 0 警告 0 错误、`make sync` 幂等。**未做（轨 C，用户本次未选）**：`ROADMAP-INBOX.md` 一便签一文件、ROADMAP §三 条目下沉——append-only 的最后一行照样撞（本次即撞）。
- [x] **抗膨胀落地 · 来源文件下沉 + 靠自觉约定变构建关卡**（横切条目，2026-09-05，[ADR-077]）— 文档膨胀已致真实事故（PR #69–72 连撞四次、main c0c2b04 转红），根因是「膨胀文件同时是并发写入点」+「靠自觉的约定无机器上限」。四轨落地：① `PROJECT/SOURCES.md` 20 个交易所节（1041 行）按所下沉到 `PROJECT/sources/<id>.md`（文件名 = data id，与 `data/exchanges/` 一一对应、校验 17 强制），SOURCES.md 收缩为「条目格式 + 跨所经验册 + 生成分片索引」；`fetch.py` 删 `extract_section` 直接读分片，`validate.py` 域名/标签/`[OTP]` 校验改扫拼接全文。② `DECISIONS.md` 生成 adr-index 块（按编号排序，物理顺序不动，零迁移缓解认知负荷）。③ INBOX「一句话」加机器上限（校验 18：「待折叠」区每条 ≤200 字，只限行长不限堆积）。④ ADR 引用完整性扩面到 .py/.yml/.js/.css/.json。生成块六处 → 八处；`selfcheck` 48→68；迁移零丢失断言全过；`make fetch EX=cn-sse`/`EX=za-jse` 验活走通（顺带修 za-jse 探测记录 URL 被反引号包裹致 `URL_RE` 误捕的潜伏问题）；反向验活（临时删分片 make check 红）通过。

### 数据空缺复核轨（横切条目，不属于 Phase 序列；与 Phase 3 并行，[ADR-060]）

2026-09-03 全库空缺实算（`sync.expand_exchange` 逐所展开 + `count_chapter_leaves` 口径，空缺 = 无 `zh` 的 leaf）：2,171 个适用字段槽位、已填 1,855（85%）、空缺 316；另 62 处已填但 `confidence: low`（`risks.fx_risk_note` 近全库、`kr-krx` 13 处成簇，余零散）。316 处分六桶——A 58（`overview` 市值/成交额/排名/上市公司数，搁置）、B 50（现货所 `clearing` 保证金四字段）、C 40（9 家衍生品子章残余，真缺口）、D 10（多板块所 `listing.transfer_between_boards` 空缺）、E 10（`risks.*_note` 等，宪法覆盖边界，[ADR-020] 点 4 已定不动）、F 148（真实研究缺口）。承接 [ADR-020] 欠的 Category B 排期；三决策点用户 2026-09-03 拍板见 [ADR-060]。**任务一落地勘误（[ADR-062]）**：B+D 桶 60 处经逐所核对（现货 CCP / 融资融券机制已在各所文件内证实）不是"设计不适用"而是可回填真实缺口，整体回 F 桶并入任务二/四——任务一因此不标任何字段级 `not_applicable`（机制保留待真正适用的场景），结构性幽灵缺口仅 A 桶 58 处（本任务标 leaf `optional`）+ [ADR-059] 已落地的 de-eurex 章节级 9 处。

- [x] **任务一 · 字段级 `optional` / `not_applicable` 机制 + A 桶标注**（2026-09-03 完成，[ADR-060] 实装 / [ADR-062]，1 次会话，不抓取）
  - **目标（修订）**：进度矩阵的 🟡 只剩真实未完成项——A 桶 58 处 `overview` 4 字段标 leaf 级 `optional`（空不计入分母、已填保留）；字段级 `not_applicable` 机制建好并加机器校验。**B/D 桶不标 `not_applicable`**（逐所核对后回 F 桶，见下方勘误与 [ADR-062]）。
  - **落地**：`schema/taxonomy.yml` A 桶 4 字段（`market_cap_usd_bn` / `annual_turnover_usd_bn` / `global_ranking` / `listed_companies_count`）加 `optional: true`；`tools/sync.py` `count_chapter_leaves()` 把分组 `optional` 逻辑扩展到 leaf、新增字段级 `not_applicable` 跳过、`compute_freshness()` 跳过 `not_applicable`、`expand_field()` 透传 `not_applicable`；`tools/validate.py` 抽 `field_na_violations()` 纯函数，两条不变式机器化（`not_applicable` 字段不得带 `zh`；taxonomy 侧 leaf `optional` 与 data 侧 `not_applicable` 不同时生效）+ 正负向探针通过。
  - **B/D 桶勘误**：ADR-060 把 50 + 10 处空缺粗分为"现货所保证金 / 单层板块无转板不适用"，逐所核对 `data/` 现状后不成立——B 桶涉及所的现货端 CCP（NSCC / LCH EquityClear / ASX Clear / CDS / Eurex Clearing）或融资融券（cn-sse / cn-szse / tw-twse）机制已在各所文件内被证实存在，是**可回填真实缺口**；D 桶 10 所（hk-hkex / jp-jpx / sg-sgx / us-nasdaq / cn-sse 等）均为多板块结构、转板机制真实存在或 detail 自述"未核实留空"。因此 B+D 处均不标 `not_applicable`、整体回 F 桶（并入任务二 / 四回填）。字段级 `not_applicable` 机制保留待真正适用的场景。结构性缺口实算修正为 ≈ 58（A 桶）+ 9（[ADR-059] de-eurex 章节级）——见 [ADR-062]。
  - **验收**：`make build` 全绿（`validate` 20 家 0/0、`verify_quotes` FAIL=0、`check_ui_i18n` OK）、`make sync` 二次幂等；生成块变动仅 `progress-matrix` 第 2 列 12 家 🟡→✅（`au-asx` / `ca-tsx` / `cn-szse` / `de-eurex` / `de-xetra` / `jp-jpx` / `kr-krx` / `sg-sgx` / `tw-twse` / `uk-lse` / `us-nasdaq` / `us-nyse` 的 `overview` 章随 A 桶 optional 分母缩小到 ✅）；`health-summary` 无变化（optional 只改完成度分母，freshness 行只计已填字段，B/D 未落地 N/A）——预期内的收窄版。未动 `quote` / 已填 `zh`。
- [x] **任务二 · 横切 8 高频字段批量回填**（2026-09-04 完成，[ADR-068]〔原始 commit 写作 ADR-065，与并行 PR #58「成本瀑布残差」撞号，事后让号〕，1 个后台会话 / 8 个 commit，按字段推进）
  - **目标**：`odd_lot_handling`(12) / `dark_pool`(10) / `board_lot_size`(9) / `price_limits.other_boards`(9) / `block_trade`(9) / `connect_schemes`(8) / `intraday_reversal`(8) / `holidays_note`(7) 在所有缺失所填到有 `quote` 的 high/medium，或确认 `type: none` / `not_applicable` 并写 `detail`；`price_limits.other_boards` / `intraday_reversal` 覆盖率达 ≥16/20 后评估补 `in_matrix`。
  - **结果**：8 字段结构性空缺清零（`holidays_note` 余 4 家 `ca-tsx`/`uk-lse`/`ch-six`/`de-eurex` 因官方交易日历 JS-SPA、按 [CLAUDE.md §三] 降级留空、已文档化）。全库已填字段 1,900→1,918（+18）；`de-eurex` 5 字段标字段级 `not_applicable`（`intraday_reversal`/`board_lot_size`/`odd_lot_handling`/`price_limits.other_boards`/`dark_pool`——全库首次真实使用该机制，`validate.py` `field_na_violations` 首跑真数据分支通过）。26 个新 high-confidence 字段 `verify_quotes` 逐条反查缓存 FAIL=0。`price_limits.other_boards` 评估后**不补 `in_matrix`**（内容结构异质、不可归约为可比标量，理由见 [ADR-068]）；`intraday_reversal` 本就有 `in_matrix`。新增来源域名登记 6 个。
  - **已知局限**：① `holidays_note` 4 家 JS-SPA 待人工 / 任务五渲染型抓取；② `ca-tsx block_trade` 的 CIRO UMIR 6.6 跨市场 block 门槛因 `ciro.ca` Cloudflare 403 未取到一手原文；③ `dark_pool` 5 家 medium（`hk-hkex`/`sg-sgx`/`kr-krx`/`jp-jpx`/`in-nse`）可日后升 high——均已记 OPEN-QUESTIONS。
  - **✅ 第二人独立复核已完成**（2026-09-05，[ADR-074]）：4 个互相隔离的独立视角，逐条去 `.cache/` 核对 `quote` 真实性、confidence 分级、语义忠实度、跨所口径一致性，共复核 79 处交易所×字段。初检 72/79=91.1%；4 处 FIX（`sa-tadawul intraday_reversal` 删无据历史细节、`sa-tadawul connect_schemes` 订正 QFI 已废止的跨字段矛盾、`ch-six`/`hk-hkex block_trade` 补全 quote 摘录）已就地订正，终态 76/79=96.2%，达 [CLAUDE.md §四] 95% 阈值；3 处 QUESTION（`de-eurex board_lot_size` 的 `not_applicable` 判据分歧、`de-xetra connect_schemes` CEINEX 遗漏、`in-nse price_limits.other_boards` Emerge 断言未证实）非事实错误、转 OPEN-QUESTIONS 留待人工。**零处发现幻觉/编造**。逐条判定表见 `PROJECT/DATA-GAP-TASK2-SPOT-CHECK.md`。
- [ ] **任务三 · 9 家衍生品子章残余补全（C 桶 40 处）**（穿插 viz 模块之间；执行方案见 [ADR-079]，2026-09-05 实算侦察后按「上次卡在哪」重排为五棒）
  - **目标**：运营衍生品业务线的 9 家（`sg-sgx` 9 / `sa-tadawul` 7 / `in-nse` 6 / `br-b3` 5 / `hk-hkex` 5 / `fr-euronext` 3 / `au-asx` 2 / `cn-szse` 2 / `kr-krx` 1；`za-jse` 已 0 缺口），`market_structure.derivatives.*` 与 `clearing.derivatives.*` 的 40 处残余**三态收口**——填实 / 显式 `not_applicable` / 留空但 `detail` + `OPEN-QUESTIONS` 写清阻断。**不以「清零到 0」为判据**：40 处里 32 处是 [ADR-021] 当年查过并留下 `detail` 的死胡同，5 处才是从未填过的空信封，把清零当验收会把执行者推向猜测（裁定①）。
  - **棒 0 · `spec` 形状前置**（schema，不抓取，其余四棒硬前置）— `schema/spec.yml` 现无任何 `derivatives.*` 形状，`validate.py` 对无形状定义的 `spec` 直接 err，全库 derivatives `spec` 数 = 0。用 anchor 把现货侧 17 个形状复用到同名 derivatives 路径 + 一条「两侧同源防漂移」不变式与正负探针；`data/` 零改动。
  - **棒 1 · 低垂果实：`clearing.derivatives` 6 处**（`sa-tadawul` 4 + `hk-hkex`/`cn-szse` 各 1 `delivery_method`）— 40 处里唯一真正没查过的一块；源方向 Muqassa 清算规则 / HKCC 结算规则 / 深交所股票期权结算规则。**先跑这棒验证「补抓真能出货」**，出不来则整体下调后三棒预期。
  - **棒 2 · 负面断言正面化：约 14 处**（`connect_schemes` 7 + `volatility_interruption` 2 + `closing_mechanism` 2 + `after_market`/`night_session`/`block_trade`）— 换判据不换关键词重抓：找**穷举性原文**（跨境安排专章 / 官网 Connectivity 完整清单 / 全市场阶段表），找到填「无 X」+ `quote`，找不到维持留空。`kr-krx connect_schemes` 是零抓取净收益（CME/Eurex 夜盘联动一手 PDF 已在 `.cache/kr-krx/`）。
  - **棒 3 · 逐合约口径：约 13 处**（`sg-sgx` 8 + `br-b3` 3 + `hk-hkex`/`sa-tadawul`/`in-nse` 的 `price_limits.other_boards`）— 先定「代表合约 + `detail` 声明代表性范围」口径（沿用 `hk-hkex` 恒指系列样本做法），不把逐合约差异压成假的市场级数值。**`sg-sgx` 8 处走 [CLAUDE.md §三] 降级**：SGX 规则原文自述合约规格「不属于本规则手册」、`www.sgx.com` 实测 SPA 空壳，本棒只负责把所需合约规格 PDF 清单（具体到合约代码）写进 `OPEN-QUESTIONS.md` 等人工投喂。
  - **棒 4 · `holidays_note` 6 处**（`au-asx`/`br-b3`/`fr-euronext`/`hk-hkex`/`in-nse`/`sg-sgx`）— 只认两种原文：衍生品专属交易日历（`au-asx` 的 ASX 24 是这 6 处里唯一确知存在的），或现货日历页明文把衍生品纳入适用范围的句子（`br-b3` 现货 `quote` 已含此表述）。都没有则留空，不用「大概率一致」补。注意 [ADR-068] 的 JS-SPA 日历失败模式。
  - **验收**：`make build` 全绿；每处落到三态之一且 `not_applicable` 只用于设计前提不成立（裁定②，已识别合格样本仅 `in-nse`/`sa-tadawul` 的 `price_limits.other_boards` 两处）；合计 40 处 > 30 → **第二人独立复核必经**，打勾前完成；抽检沿用 [ADR-021] 口径（每家最多 10 个 `high` 字段逐字核对 `.cache/` 原文），< 95% 停下修流程。
  - **已移出本条**（裁定③，工作对象与本条几乎不相交）：衍生品 `spec` 回填 126 处、剖面业务线切换渲染层 —— 见下两条。

- [ ] **任务三附 · 衍生品 `spec` 回填（126 处）**（棒 0 合并后可启动，与任务三其余棒并行）
  - **为什么单列**：`spec` 的对象是 derivatives 子块里**已填**的 126 处（`au-asx`/`cn-szse`/`kr-krx`/`za-jse` 各 14、`br-b3`/`fr-euronext`/`hk-hkex`/`sa-tadawul` 各 13、`in-nse` 11、`sg-sgx` 7），与 C 桶 40 处缺口几乎不重叠——缺口字段本就没有值可结构化。规模是任务三的三倍，独立触发第二人复核，混在一起两份验收会互相污染（[ADR-079] 裁定③）。
  - **步骤**：建议按字段族拆两批（时段族 ≈60 / 价格限制 + 机制族 ≈66），每批独立复核；`spec` 数值须过 `validate.py` 5b（`high` 字段数值 ⊆ `quote`）与 5c（`note` 内嵌数字反查），验收范式照 [ADR-054] 六维度。
  - **验收**：`make build` 全绿；每批 > 30 字段 → 第二人独立复核。

- [ ] **任务三附 · 剖面现货 / 衍生品业务线切换（渲染层）**
  - **为什么需要**：`docs/assets/app.js` 四处直接取 `data.chapters.market_structure`，`tdBanner` 对有 derivatives 字段的所只挂一句「本剖面显示现货（衍生品 spec 待 Phase 3 补充）」——数据备齐不会自动兑现，这句 banner 也一直是欠账凭证。
  - **形态倾向**：按 [ADR-057] 北极星**不新增顶层 tab**（Phase 4 要减 tab），改为剖面内的业务线切换（可复用 [ADR-055] 透视开关的控件位与持久化模式）；诚实三态照 [ADR-035] D（衍生品侧字段缺省时不静默回落现货）。
  - **前置**：任务三附 · `spec` 回填至少完成时段族；启动时机（Phase 3 收尾小棒 vs 并入 Phase 4 单页画布）待拍板。
- [ ] **任务四 · 5 家旗舰所深度补全（F 桶逐所 78 处，执行方案已定案，[ADR-078]）**（建议 Phase 4 合并启动前完成，非硬前置）
  - **目标**：`us-nyse`(17) / `hk-hkex`(17) / `cn-sse`(19) / `uk-lse`(14) / `jp-jpx`(11)（+`de-eurex` 11 / `fr-euronext` 10 / `in-nse` 10 视精力）F 桶清零到 ✅ / 显式不适用，达到 `za-jse` 的「全章 ✅、0 low」基准。图鉴主视图讲「一眼看懂一个市场」，最该完整的恰是这几家——ROADMAP 已承认、未排期的欠账。**逐所分布已用脚本现算更新**（原 15/13/13/11/9 是 2026-09-03 estimate，其后任务二 / 成本瀑布残差长尾 / 抓取基础设施修复已动过部分交叉字段）；逐字段清单（含所属交易所与来源类型建议）见 [ADR-078]，不必重新翻 YAML 现算。
  - **步骤**：检索按 8 个字段族批量做（清算保证金四件套 20 处 / `transfer_between_boards` 5 处 / listing 其余残余 8 处 / 税费佣金 15 处 / regulation 监管细节 7 处 / participants 5 处 / infrastructure 5 处 / `overview.history` 2 处 + risks 残余 3 处待「下一步 1」完工后复用其判据），落盘提交仍按所归拢、每所一个 commit（交付粒度不变，字段族只是检索效率手段）；建议顺序与各族来源类型见 ADR 正文。**与「下一步 1」不重复认领**：`fx_risk_note`/`political_risk_note`/`enforcement_note` 共 8 处已排在该子棒范围，任务四只在其完工后复核结果。
  - **验收**：每所抽检 10 字段（历史惯例）；`make build` 全绿；**78 处总量超 [CLAUDE.md §四] 30 字段门槛，5 家全部完工后须比照 [ADR-074] 做一次第二人独立复核**，不能只靠协调者自查收尾。
- [x] **任务五 · 抓取基础设施修复**（2026-09-05 完成 ①②，[ADR-075]；不做 ③，理由见下）
  - **目标**：① `kr-krx` 13 处 low（`infrastructure` + `costs` 簇）中可升级的升到 medium/high；② `za-jse` 来源重新落盘、`verify_quotes` 能离线覆盖（当前 `.cache/za-jse` 仅 1 文件、manifest-ok 0）；③ `make check` 在 stale 字段数 > 0 时输出清单（warning、不阻断）。
  - **结果**：动手前先探明云环境（数据中心 IP）可达性——**KRX 数据端点对数据中心 IP 封锁**（`GenerateOTP` 换 code 能通，带 code 的数据端点一律拒绝：`data.krx.co.kr` 返回字面量 `LOGOUT`、`eindex.krx.co.kr` 302 跳 `SiteSearch.jsp`）；`jse.co.za` 一如既往 Cloudflare 403，但 `web.archive.org` 的 CDX + `id_` 原始快照可用。据此：
    - **① `tools/fetch.py` 加 `[OTP]` 两步抓取**（SOURCES.md 登记行含 `[OTP]` 标记，前两个 URL 依次是 GenerateOTP 端点 + 数据端点）+ **通用 wayback 回退**（403/拦截页时自动查最近 200 快照重试，`fetch_sources.py` 复用）；`validate.py`/`selfcheck.py` 加 `[OTP]` 行格式机器校验（selfcheck 43→48）。`kr-krx` 2 处 low 坐实：`market_maker_scheme`（ETF LP 制度双边报价 + 1% 价差比例豁免线，`confidence: high`）、`dividend_withholding_tax`（PwC 预提税率表，坐实原有"22%"推算链 + 纠正"美韩协定10%"为表内真实"10/15%"，`confidence: medium`）；`price_limits.other_boards`（KONEX 涨跌停）判定**不填**——找到的官网正文枚举 KONEX 交易安排"与 KOSDAQ 相同"但清单不含 price limit 字样，据此断言具体幅度是过度推断，如实记 OPEN-QUESTIONS。其余 8 处 low 未命中承载正文的页面，`fx_risk_note`/`enforcement_note` 已转 [ADR-066] 分棒①。
    - **② `.cache/za-jse/` 重建**：`verify_quotes` 全库 CACHE_MISS 77→39（za-jse 一家 70→36）、OK 1023→1062、FAIL 全程 0；`jse.co.za` 官网本身仍不可达，重建的是离线核对覆盖率，非重新核实数据，`data/` 零改动。**顺带修 `verify_quotes.py` 两处消费侧回归**（有了 wayback 回退才暴露）：`manifest_map` 原不看 `ok` 字段，把 404 错误页当正文核对，挖出一个真实假阳性（`au-asx infrastructure.access_methods`，已修复降级为 CACHE_MISS）；wayback 快照可能明显滞后官网原文（za-jse 一处仅 2020 年归档）导致假 FAIL，现降级规则：未命中时只有"当次直连"来源也确认没有才判 FAIL。
    - **不做 ③**：本棒探明的真正瓶颈是抓取能力边界（KRX 封锁 / JSE 全站 Cloudflare），stale 清单是独立小功能、不依赖此发现，留给下次单独排期。
  - **验收**：`make build` 全绿（`selfcheck` 48/48、`validate` 20/0、`verify_quotes` FAIL=0、6 处生成块零 diff）；人工核对 2 处 kr-krx `quote` 与落盘原文逐字一致（2/2，远低于第二人复核门槛）。已知局限：OTP 数据步骤端到端成功路径（住宅 IP）本次环境无法验证，仅验证机制正确接线；kr-krx 剩 8 处 low 待人工投喂。

### 广度扩张（新增交易所，原「Phase 4 · Wave 3」）——按需可选能力，非计划阶段

见 [ADR-041]。不排进 Phase 序列、无"解冻条件"，不带进度框。

- `add-exchange` skill 十一章完整流程**原样保留**，随时可用（`/add-exchange` 或口头要求）。
- **仅在用户主动要求时执行；agent 不主动提议、规划或启动新增交易所**，也不在下一步任务建议里列「加某家交易所」。
- 用户触发某次新增时：候选思路见 [ADR-016]（补东南亚 / 中东 / 非洲 / 拉美空白）；若纳入第 3 个 MENA/非洲所同步执行 [ADR-036] #2 的 `region` 拆分（#1 `federation_of` / #9 `rule_level` 触发条件同理）；子代理任务里加"第五章直接填 `spec`（含 [ADR-042] 的 `execution_model` / `error_trade_rule` / `order_book_transparency` / `order_types` / `tick_size`）、并在市场机制剖面里自检"。

---

## 四、历史归档（v0.x / v1.x 均已全部完成）

以下都是已完成阶段的原始工作日志，**只增补、不改写**（历史 ADR 与 Wave/Batch 日志的不可变性见 [ADR-046]「未动」段与 `CLAUDE.md` §八）。

### 阶段路线（v0.0 → v1.1）

- [x] **v0.0 立项 + 可达性探针** — 仓库骨架、`CLAUDE.md`、`PROJECT/` 四件套、`schema/`、`Makefile`、三个 tool 跑通、LICENSE、`.claude/settings.json`；五家标杆抓取方式探明（见 `SOURCES.md`）
- [x] **v0.1 骨架验证** — `taxonomy.yml` 十一章字段字典、上交所+港交所填满、前端矩阵+档案视图最小可用、Pages 上线；人工抽检 20 字段（2026-08-13，基本准确，反馈已回写 `SOURCES.md`「来源 URL 应精确到信息页」一节）
- [x] **语言模型简化**（v0.1 收尾后、v0.2 开始前，独立迁移）— 数据语言从 zh/native/native_lang 三态简化为 zh/en 两态 + 交易所级 `source_lang` 标记，见 `PROJECT/DECISIONS.md` [ADR-013]；两家现有交易所数据已迁移
- [x] **v0.2 标杆扩展** — NYSE / JPX / Eurex 三家数据均已补齐（均 `source_lang: en`）；Eurex 是首个衍生品交易所样本，暴露出 `listing` 章节与 `settlement_cycle`/`short_selling`/`intraday_reversal` 三个字段对非股票交易所不适配，见 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第17条。矩阵维度组已按实测填充率重新校准（[ADR-014]）；`add-exchange` skill 已吸收三次实操教训定型
- [x] **v0.3 前端完善** — 修复语言模式切换的遗留 bug：交易所名称（矩阵行/档案页标题/浮层）、矩阵行地区标签、健康度视图字段名此前都不随模式切换，只是英文模式下用 `en_required` 字段本身的回退掩盖了部分（见 [ADR-013] 的回退设计），这几处是取值路径完全绕过了 langMode 判断；格子浮层加双语标题、章节面包屑、加载态；健康度视图加交易所/类型筛选并支持点行跳出处；矩阵加标杆批次筛选；新增时区甘特条视图（`#view=timezone`），推导方式见 `PROJECT/DECISIONS.md` [ADR-015]
- [x] **v1.0 横向铺开** — 按 Tier 扩到 20+ 家；Wave 1（8 家）+ Wave 2（7 家）均已完成，加上 v0.1/v0.2 五家标杆共 20 家；计划任务/工程设计/验收标准/进度见下方「v1.0 计划」一节
- [x] **前端阅读性优化**（v1.0 收尾后）— 矩阵工具栏去掉「标杆批次 Tier」筛选框与搜索框（v0.3 加的两个交互，20 家规模下地区筛选已够用，搜索是冗余项；`v0.3` 那条历史记录不改，此处记录后续变更）；时区甘特条午休时段从"柱状条空白+右侧括号文字"改为独立蓝色色块；正文字号/行高、矩阵斑马纹与悬停高亮、档案页字段卡片间距与长文本限宽等一轮可读性调整，见 `PROJECT/DECISIONS.md` [ADR-025]
- [x] **v1.1 Category B 数据深耕**（2026-08-22/27）— Batch 1/3 + Batch 2/3 全部完成，全库已填字段 1162→1766；详见下方「v1.1 计划」一节
- [x] **v2.0 前置加固 A1 + A2**（2026-08-29/30）— A1 防幻觉机器校验补完（[ADR-033]）+ A2 v1.1 尾巴收口（英文回填 #45 全库清零、CACHE_MISS 归零、`verify_quotes` 走 expand，[ADR-034]）。明细见上方「三、v2.0 计划」
- [x] **v2.0 高度可视化转向 Phase 0 起**（2026-08-30 起，进行中）— Phase 0 范式与数据模型定案（修订 ADR-005、`spec` 层契约 + `schema/spec.yml`、零构建/诚实渲染/非现货降级、框架性问题批量裁定含 `covered_only` 落地，[ADR-035] + [ADR-036]）及其后 Phase 1a～3。明细见上方「三、v2.0 计划」

### v1.0 计划：横向铺开到 20+ 家

工程设计与取舍依据见 `PROJECT/DECISIONS.md` [ADR-016]（候选清单与分波依据）、[ADR-017]（并行执行模式与质量门槛）；验收阈值见 `CLAUDE.md` 四。本节只管任务清单与进度，不重复决策理由。

#### 工程设计摘要

- **执行模式**：不再逐家串行，改为每波内用 Agent 工具并行派发子代理，一个子代理独立跑完一家交易所的 `add-exchange` skill 全部步骤；波次结束后统一 `make build` 复核一次。
- **验收标准**：每家新交易所人工抽检 10 个字段核对 `quote` 与原始出处，通过率需 ≥95%（阈值不变，样本量比 v0.1 缩小，理由见 [ADR-017]）；未过阈值只暂停复核该家，不影响同批次其他交易所。每波结束后额外过一遍各子代理执行记录，把新教训回写 `add-exchange` skill，再开下一波。
- **退出标准**：两波（15 家）全部完成且各自通过验收 → 总数达到 20 家；`region: mena_africa` 与 `americas` 不再是明显空白；至少新增一个"一所多国"结构样本（Euronext）供 `OPEN-QUESTIONS.md` 框架性问题第17条积累更多真实证据。

#### Wave 1 启动前置条件

- [x] `review_system` 矩阵列的枚举覆盖率问题——实际未在 Wave 1 启动前解决（见 [ADR-018] 执行进度补记），Wave 1/2 完成后作为高优先级待办于 2026-08-19 解决，枚举从 3 值扩到 5 值，见 `PROJECT/DECISIONS.md` [ADR-023]。

#### Wave 1（8 家，优先）— 8/8 已完成

| 交易所（草案 id） | 地区（初判，待建档时核实） | 压测点 |
|---|---|---|
| `us-nasdaq` 纳斯达克 | americas | 同法域对照 NYSE（做市商电子市场 vs DMM） |
| `cn-szse` 深圳证券交易所 | apac | 同国对照 SSE（创业板 vs 科创板） |
| `uk-lse` 伦敦证券交易所 | europe | 脱欧后独立监管框架 |
| `de-xetra` 法兰克福证券交易所/Xetra | europe | 同集团对照 Eurex（`deutsche-boerse-group` 内首个现货所） |
| `sg-sgx` 新加坡交易所 | apac | 地区补充 |
| `au-asx` 澳大利亚证券交易所 | apac | 地区补充 |
| `in-nse` 印度国家证券交易所 | apac（待核实） | 地区补充 |
| `sa-tadawul` 沙特交易所 | mena_africa | 该地区首个样本（现有 5 家里是 0） |

进度：8/8 已完成（并行子代理模式，2026-08-14/15）。人工抽检见 `PROJECT/DECISIONS.md` [ADR-017] 执行记录；子代理踩出的新坑已回写 `.claude/skills/add-exchange/SKILL.md`。

#### Wave 2（7 家，视 Wave 1 结果调整，非最终锁定）— 7/7 已完成

| 交易所（草案 id） | 地区（初判） | 压测点 |
|---|---|---|
| `fr-euronext` Euronext | europe | 一所横跨多国市场，结构性新样本 |
| `kr-krx` 韩国交易所 | apac | 地区补充 |
| `ca-tsx` 多伦多证券交易所 | americas | 地区补充 |
| `br-b3` 巴西 B3 | americas | 拉美首个样本 |
| `tw-twse` 台湾证券交易所 | apac | 地区补充 |
| `ch-six` 瑞士证券交易所 | europe | 地区补充 |
| `za-jse` 约翰内斯堡证券交易所 | mena_africa | 非洲首个样本 |

进度：7/7 已完成（并行子代理模式，2026-08-16/17，中途两次撞到账号月度支出限额，恢复后续跑完成）。人工抽检见 `PROJECT/DECISIONS.md` [ADR-017] 执行记录；子代理踩出的新坑已回写 `.claude/skills/add-exchange/SKILL.md`。

#### 当前进度

- 20/20+ 已完成（v0.1/v0.2 五家标杆 `cn-sse`/`hk-hkex`/`us-nyse`/`jp-jpx`/`de-eurex` + v1.0 Wave 1 八家 `us-nasdaq`/`cn-szse`/`uk-lse`/`de-xetra`/`sg-sgx`/`au-asx`/`in-nse`/`sa-tadawul` + v1.0 Wave 2 七家 `fr-euronext`/`kr-krx`/`ca-tsx`/`br-b3`/`tw-twse`/`ch-six`/`za-jse`，见上方填充进度表）
- v1.0 横向铺开阶段已完成，达成 20 家目标；`review_system` 枚举覆盖率问题（上方"Wave 1 启动前置条件"）未在 Wave 1 启动前解决，属流程疏漏，见 `PROJECT/DECISIONS.md` [ADR-018] 执行进度补记，已于 2026-08-19 解决（[ADR-023]，连带修了 `delivery_method` 同类问题）；市场结构/指数体系两处 schema 缺口已设计并示范填一家（[ADR-019]）。9 家交易所的衍生品市场机制已按 [ADR-017] 并行子代理模式补齐，人工抽检 90 字段全部通过，见 [ADR-021]。前端矩阵/章节结构审查见 [ADR-022]。
- **英文版审查（2026-08-20 启动）**：走查发现"中英夹杂"症状，拆成两层——① `en_required` 字段真违规（9 处，`cn-sse`/`hk-hkex`/`tw-twse`），已补齐数据并给 `validate.py` 加永久机器校验，附带查出并修正一处 `hk-hkex` 撮合规则误引衍生品市场规则的数据错误，见 [ADR-024]；② 114 个非强制双语字段在英文模式下仍回退显示中文，方案②（前端加视觉标记区分"设计不需双语"与"真漏填"）已实施，见 [ADR-026]，方案①（批量翻译114字段）随 v1.1 一并评估，不单独开工。
- **悬案批量清理（2026-08-20/21）**：`sa-tadawul`/`kr-krx`/`tw-twse`/`ch-six`/`br-b3`/`fr-euronext` 六家共 17 条 `PROJECT/OPEN-QUESTIONS.md` 具体数据悬案，13 条解决、1 条重新定性为"官方确认不披露"、3 条如实保留（sa-tadawul TASI基日、kr-krx KOSDAQ基日、fr-euronext市值口径不在本次任务范围），见 [ADR-027]。
- **下一步方向已定：深度优先（v1.1 Category B 数据深耕），Wave 3 暂缓**，见 `PROJECT/DECISIONS.md` [ADR-028]。详见下方「v1.1 计划」一节。（2026-08-30 [ADR-041] 进一步将 Wave 3 / 广度扩张定为按需可选能力，不再是计划阶段——见上方「三、v2.0 计划」末尾。）

### v1.1 计划：Category B 数据深耕（Batch 1/3 / Batch 2/3 / Batch 3/3 均已完成，2026-08-27）

依据与规模估计见 `PROJECT/DECISIONS.md` [ADR-028]，本节只管任务清单与进度，不重复决策理由。

#### 前置事项（批量执行前必须先解决，否则会重演 [ADR-018] 的教训）

- [x] **`clearing.initial_margin_practice`/`maintenance_margin_practice`/`mark_to_market_frequency`/`last_trading_day_rule` 四字段语义歧义澄清**——已于 2026-08-22 解决，见 [ADR-030]：仿照 `delivery_method` 先例扩容 `clearing.derivatives` 子块，顶层收窄为「现货语境」、衍生品语境统一移到子块；`tw-twse` 数据本就符合收窄后的顶层语义无需改动，`de-eurex`（纯衍生品）无需改动，`br-b3` 三个字段已完成迁移（`quote`/`sources` 原样搬移，未新造事实）。批量填充的前置阻塞已清除。

#### 候选字段清单（填充前基线快照，非当前状态）

> 下表是 **2026-08-21 审计时、批量填充前**的基线：36 个确定 Category B 字段；另 4 个原待澄清语义的 `clearing` 字段已于 2026-08-22 解决语义歧义（见 [ADR-030]），并入候选范围，合计 40 个。**填充率与 `X/20` 均为当时的快照，实际填充结果与退出标准对照见下方「进度」。**

| 章节 | 填充率 | 字段（括号内为当前 X/20） |
|---|---|---|
| `regulation` | 57% | `capital_controls`(2)、`foreign_ownership_limit`(3)、`investor_protection`(5)、`disclosure_requirements`(7) |
| `listing` | 42% | `post_delisting_venue`(0)、`listing_process_duration`(1)、`delisting_transition_period`(4)、`delisting_process`(7)、`suspension_resumption`(10)、`continuing_obligations`(11) |
| `clearing` | 43% | `default_management`(4)；另 4 个字段的语义歧义已解决（[ADR-030]），`clearing.derivatives.*` 镜像字段已就绪，可与 `default_management` 一并纳入批量填充范围 |
| `participants` | 27% | `broker_landscape`(0)、`investor_structure`(1)、`suitability_management`(1)、`account_opening_requirements`(3)、`foreign_access_channel`(7) |
| `infrastructure` | 18% | `data_pricing_model`(0)、`historical_data_availability`(0)、`data_latency`(1)、`market_data_levels`(1)、`major_outage_history`(2)、`access_methods`(8)、`trading_system_name`(13) |
| `costs` | 19% | `implicit_costs_note`(0)、`regulatory_fees`(0，预期多数合理留空)、`clearing_fees`(2)、`commission_structure`(2)、`financial_transaction_tax`(2)、`capital_gains_tax`(3)、`dividend_withholding_tax`(6)、`stamp_duty`(9)、`exchange_fees`(10) |
| `risks` | 35% | `liquidity_risk_note`(0)、`political_risk_note`(0)、`enforcement_note`(6)、`regulatory_change_risk_note`(11) |

#### 顺带处理（同一批交易所研究窗口内一起做，不单独开工）

- 英文缺失字段回填（`OPEN-QUESTIONS.md` 框架性问题第45条，114 个非强制双语字段，集中在 `cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse`；`en_required` 真违规部分已由 [ADR-024] 解决，这里指剩余部分）
- `sec.gov`/`finra.org`/`dtcc.com` 反爬突破尝试（框架性问题14/15/32条，集中影响 `us-nyse`/`us-nasdaq`）

#### 执行设计（2026-08-21 草案，已按此执行完毕）

- 按交易所分批（非按字段），沿用 [ADR-017] 并行子代理模式，7-8 家/批分 2-3 批
- 质量门槛沿用 [CLAUDE.md 四]（≥95%），抽检量比照 [ADR-017]（10 字段/所）
- 退出标准：8 个当前 0/20 的字段（`implicit_costs_note`/`regulatory_fees`/`data_pricing_model`/`historical_data_availability`/`post_delisting_venue`/`broker_landscape`/`liquidity_risk_note`/`political_risk_note`）全部转为"有值+来源"或"明确 detail 说明不适用/查不到"；其余字段填充率显著提升，不强求 100%

#### 进度

- 前置事项已解决（2026-08-22，见 [ADR-030]），批量填充的阻塞已清除。
- **Batch 1（8 家）已完成（2026-08-22/25）**：`cn-sse`/`tw-twse`/`hk-hkex`/`cn-szse`/`us-nyse`/`us-nasdaq`/`uk-lse`/`jp-jpx`。选取逻辑：优先覆盖「顺带处理」一节点名的两个批量任务——前四家一并回填英文缺失字段，`us-nyse`/`us-nasdaq` 一并尝试反爬突破，`uk-lse`/`jp-jpx` 补地区多样性。执行结果、字段明细、人工抽检通过率、反爬突破方法与并行执行的工程教训见 `PROJECT/DECISIONS.md` [ADR-031]，本条不重复：全库已填字段 1162→1360（+198）；8 个子代理各自 10 字段自查 + 协调者独立复核 16+1 个字段，全部通过，远超 ≥95% 门槛；`sec.gov`/`finra.org` 反爬已攻克（方法见 `PROJECT/SOURCES.md`「突破记录」），`dtcc.com` 仍未攻克但已降级绕过；`make build` 0 错误 0 警告。
- **Batch 2/3（剩余 12 家：`au-asx`/`br-b3`/`ca-tsx`/`ch-six`/`de-eurex`/`de-xetra`/`fr-euronext`/`in-nse`/`kr-krx`/`sa-tadawul`/`sg-sgx`/`za-jse`）已完成（2026-08-27）**。按原执行设计分两批（各 6 家）并行子代理执行，沿用 [ADR-017] 模式但收紧隔离：子代理只写各自 `data/exchanges/<id>.yml` 并把来源落盘到 `.cache/<id>/`，`PROJECT/SOURCES.md`/`OPEN-QUESTIONS.md`/`schema/glossary.yml` 由协调者统一合并，避免共享文件冲突。`make build` 0 错误 0 警告；全库已填字段 1360→1766（+406）。8 个原 0/20 字段（`implicit_costs_note`/`regulatory_fees`/`data_pricing_model`/`historical_data_availability`/`post_delisting_venue`/`broker_landscape`/`liquidity_risk_note`/`political_risk_note`）在 12 家中全部转为有值（个别 `low` 置信度，属"查不清已如实标注"，见 `OPEN-QUESTIONS.md` auto-issues）。质量关：协调者用脚本对全部 40 个 Category B 高置信字段做"quote 是否在落盘来源原文中"反查，命中 19/22 不匹配后逐一核实——其中 19 个实为来源页未落盘（现场抓取官方页均可命中原文），仅 3 个确属 quote 与原文不符（`ca-tsx` 两个 participants 字段引用的 OSC NI 31-103 着陆页无规则正文；`fr-euronext` `clearing.derivatives.delivery_method` 的 "EDSP=CTD/CF" 公式原文未出现），已修正（前两例降级 `medium` 保留官方来源、后一例改为 PDF 中真实存在的 EDSP 措辞并重新 verbatim 引用）。`kr-krx` 多处 costs/infrastructure 字段仍 `low`，属真实未核实，已记入悬案。
- **Repo 级 verbatim-quote 反查（2026-08-27，接续 Batch 2）**：用脚本对全库 20 家共 ~671 个 `confidence: high` 字段的 `quote` 逐一比对落盘 `.cache/<id>/` 原文与现场抓取来源，先发现 48 处 quote 与来源不符（多为缺 `sources` 或 quote 为改写/编造），分 11 个交易所并行子代理修复——其中确属编造/改写并已修正的代表：`fr-euronext` `clearing.derivatives.delivery_method`（"EDSP=CTD/CF" 公式原文无）、`ch-six` `clearing.csd_name`（quote 指非 CSD 内容）、`ca-tsx` 两 participants 字段（引 OSC NI 31-103 着陆页无规则正文）、`hk-hkex` `clearing.ccp_name`（quote 指 CSDC 非 HKSCC）、`tw-twse` `market_structure.closing_mechanism`、`cn-sse` 若干（数字跨表格行无法成连续 verbatim）。修复后重查，可证伪的失配降至 0；残留"未命中"均为 JS 渲染页（curl 拿不到正文）或来源页未落盘，属检查器局限非数据缺陷。教训：verify 脚本必须做 HTML 标签剥离+PDF 文本提取，否则表格单元/标签会制造大量假阴性。该反查已固化为 `tools/verify_quotes.py`：离线只比对 `.cache/<id>/_manifest.json` 中实际落盘的引用来源（没抓过的来源记为 CACHE_MISS 不误判），`--live` 额外现场抓取（JS 页/被拦记为 LIVE_ERR）；已接入 `make check`（仅 FAIL 才非零退出），并加 `make verify-quotes` / `make verify-quotes-live` 两个独立命令。
- **落盘全部引用来源 + 复核（2026-08-27，接续上条）**：新增 `tools/fetch_sources.py`（收割 yml 里所有 `sources` URL 落盘 `.cache`，按内容类型定扩展名、为 PDF/Office 生成 `.txt` 伴随文本、sec.gov 用 Fair Access UA），批量抓得 632 个来源。重跑反查后 OK 由 27 升到 929、FAIL 由 44 暴露并归零——其中确属"quote 非 verbatim / 引用错页 / 抓到 404/JS 壳/图片 PDF"的 34 处，分 11 个交易所并行子代理修复（重引正确来源并改写 verbatim quote，或降级 `medium` 保留 sources）。最终 `make build` 全绿：validate 0/0、verify_quotes OK=929 FAIL=0。残 61 个 CACHE_MISS 为引用来源未落盘或错误页，按 CLAUDE.md §四 留人工抽检。
- **Batch 3/3 收尾（2026-08-27，v1.1 全部完成）**：① `SOURCES.md` 末尾「Batch 2 补充登记」堆块已按交易所 id 去重并入各 `### <exchange>` 小节；② Batch B 并行执行教训回写 `.claude/skills/add-exchange/SKILL.md`（verbatim 反查步骤、不可核验即降级 `medium` 的规则）；③ 每家抽 10 个「全部引用来源已落盘」的 `high` 字段做 quote-vs-来源 核验，20 家共 200/200 通过（100%，≥95% 阈值），报告见 `PROJECT/SPOT-CHECK-v1.1.md`；④ `OPEN-QUESTIONS.md` 与 glossary 经 `make sync` 重新生成；⑤ 上述 verbatim-quote 机器化反查 + 来源全量落盘的决策记入 `PROJECT/DECISIONS.md` [ADR-032]。`make build` 全绿（validate 0/0、verify_quotes OK=929 FAIL=0）。v1.1 至此收口。
