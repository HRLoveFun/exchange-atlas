# ROADMAP 收件箱 INBOX

**这个文件存在的理由**：并行 worktree / 后台任务各自编辑 `ROADMAP.md` §一「下一步」「最近完成」两个散文子节，git 把不同分支的行看成互不冲突 → 三方合并静默产出重号列表、超窗窗口（2026-09-04 PR #61/#62 的教训，见 `DECISIONS.md` [ADR-069]）。§一 因此是**单写者资源**。

**纪律**（`CLAUDE.md` §八 的落点）：

- **后台任务 / worktree 收尾时**：完成事实写进 `ROADMAP.md` §三详版条目（逐条 checklist，并行改不同条目不冲突）；然后**只往本文件下方「待折叠」区末尾追加一行**，不碰 §一。追加行是纯 append，git 对不同分支的 append 合并干净、不产生重号。
- **交互式会话 / 合并协调者开工时**：先把「待折叠」区堆积的行折进 `ROADMAP.md` §一——「最近完成」按时间插入并裁到最近 3 条、「下一步」按新情况重排编号并划掉完成项——然后**清空「待折叠」区**（只留标题与本说明）。这一步串行、单写者，不会撞。

事实仍只在 §三详版写一遍（[CLAUDE.md 一]）；本文件的行是给折叠动作看的临时便签，折叠后即删，不是第二份记录。

---

## 待折叠

<!-- 一行一条，格式：`- YYYY-MM-DD · <一句话结果> · [ADR-NNN] · <分支或 PR>` -->
<!-- 折叠进 ROADMAP §一 后删除该行。 -->

- 2026-09-04 · 风险旗标渲染层落地：`renderRiskFlags` 两泳道旗标面板 + 置信度旗标字形四态 + 常驻「非评分」声明 + tab（9→10）+ 路由 `risk-flags` + `.rf-*`；纯前端三文件、headless 5 家 × 中英 × 明暗核对、零 diff、`make build` 全绿。四个 viz 模块渲染层均已落地（[ADR-057] #4 按渲染层口径满足）；剩 `fx_risk_note` 数据层子棒（是否 Phase 4 硬前置留协调者按 §一 拍板） · [ADR-066] · worktree-risk-flags-render
- 2026-09-04 · 剖面机制核心面板右缘避让收盘集合竞价竖条（[ADR-055] 已知局限②落地，7 家面板收窄 476–605、其余不变） · [ADR-070] · worktree-td-corepanel-right-edge
- 2026-09-04 · 成本瀑布迭代：佣金行降级为图下方说明（`CW_FEE_ORDER` 6→5）+ `cost_layer` 加 `rate_raw`（tw-twse 证券交易税 0.3% / za-jse STT 0.25% 由幽灵条转实心条 + `*` 标记，`validate.py` 加 verbatim 子串校验，解决 OPEN-QUESTIONS「原文数值串键」悬案） · [ADR-071] · worktree-cost-waterfall-commission
- 2026-09-04 · 前端隐去 taxonomy 章序数（六视图说明段 + SVG/工具条 + 档案页导航去「第X章」，改用章节名 + 档案页指向）+ 新增 `check_no_chapter_ordinals.py` 并入 `make check`；原占 ADR-070，撞已合并的 [ADR-070]/[ADR-071]，按 ADR-029 协议让号 · [ADR-072] · worktree-frontend-hide-chapter-ordinals
- 2026-09-04 · 剖面零轴刻度改标参考价名称、删 y 轴标题与"0 = …"批注、临时停牌文案居中；原占 ADR-071，撞已合并的 [ADR-071]（PR #68），按 ADR-029 协议让号 · [ADR-073] · worktree-td-axis-labels
- 2026-09-05 · 数据空缺复核轨任务二第二人独立复核完成：4 个独立视角复核 79 处交易所×字段，终态 76/79=96.2% 达标、零幻觉；4 处 FIX 就地订正（`sa-tadawul` 两处、`ch-six`/`hk-hkex block_trade` 各一处），3 处 QUESTION 转 OPEN-QUESTIONS 待人工；任务二 ROADMAP 条目「第二人独立复核待人工」标注解除；原占 ADR-072，撞已合并的 [ADR-072]（PR #69），按 ADR-029 协议让号 · [ADR-074] · worktree-data-q-task2-review
- 2026-09-05 · 数据空缺复核轨任务五完成 ①②（不做 ③，理由见详版）：`fetch.py` 加 `[OTP]` 两步抓取 + 通用 wayback 回退（`fetch_sources.py` 复用，顺带修 `verify_quotes.py` 两处消费侧回归——`manifest_map` 不看 `ok` 挖出的 `au-asx` 假阳性、wayback 快照滞后导致的假 FAIL）；探明 KRX 数据端点对数据中心 IP 封锁（OTP 换 code 能通、数据步骤被拒）；`za-jse` CACHE_MISS 77→39；`kr-krx` 2 处 low 坐实（`market_maker_scheme`/`dividend_withholding_tax`）、`price_limits.other_boards` 判定不填（如实记 OPEN-QUESTIONS，避免过度推断）；`make build` 全绿、`selfcheck` 43→48；原占 ADR-072，撞已合并的 [ADR-072]（PR #69），按 ADR-029 协议让号 · [ADR-075] · worktree-fetch-infra-otp
