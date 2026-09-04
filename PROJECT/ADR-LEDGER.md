# ADR 编号台账 ADR-LEDGER

**这个文件存在的理由**：ADR 编号是每条分支各自「预支」的——两条分支在同一 base 之后各自新增 ADR，编号就有很高概率撞（[ADR-029] 与 [ADR-068] 两次实例）。台账把「取号」这一步串行化：开工写 ADR 前先在这里登记要用的号，后续会话看这个文件就知道最大已占号，直接取下一个。

**纪律**：

- 往 `DECISIONS.md` 写 `### ADR-NNN` 之前，先往下方「已登记」区末尾追加一行：`- ADR-NNN · <一句话主题> · <分支或会话> · <日期>`。
- 交互式会话可直接推 `main`；后台任务走一个只改本文件的快速 PR 先合，再开工。
- 真撞了（两条分支同一窗口都登记了同一号）：按 [ADR-029] 晚合并方让号 + 全库 grep 改所有引用。
- `make check` 校验（`validate.py`，见 [ADR-069]）：`DECISIONS.md` 每条 `### ADR-NNN` 都必须在本文件登记过；本文件编号 `1..max` 连续、不重复。

事实（每条 ADR「定了什么 / 为什么」）的唯一权威仍是 `DECISIONS.md`；本文件只登记「号被谁占了」，主题一句话即可。

---

## 已登记

- ADR-001 … ADR-068 · 台账建立前的历史条目（主题见 `DECISIONS.md`） · pre-ledger
- ADR-069 · 并行 worktree 防失序四道护栏 · worktree-antidisorder · 2026-09-04
- ADR-070 · 剖面机制核心面板右缘避让收盘集合竞价竖条（ADR-055 已知局限②） · worktree-td-corepanel-right-edge · 2026-09-04
- ADR-071 · 成本瀑布：佣金行降级为说明 + cost_layer 加 rate_raw（tw/za 证券交易税不再画幽灵条） · worktree-cost-waterfall-commission · 2026-09-04
- ADR-072 · 前端不暴露 taxonomy 章序数，只用章节名 + 档案页 / ADR 链接（原占 ADR-070，撞已合并的 PR #66，按 ADR-029 协议让号） · worktree-frontend-hide-chapter-ordinals · 2026-09-04
