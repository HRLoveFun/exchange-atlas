# ROADMAP 收件箱 INBOX

**这个文件存在的理由**：并行 worktree / 后台任务各自编辑 `ROADMAP.md` §一「下一步」「最近完成」两个散文子节，git 把不同分支的行看成互不冲突 → 三方合并静默产出重号列表、超窗窗口（2026-09-04 PR #61/#62 的教训，见 `DECISIONS.md` [ADR-069]）。§一 因此是**单写者资源**。

**纪律**（`CLAUDE.md` §八 的落点）：

- **后台任务 / worktree 收尾时**：完成事实写进 `ROADMAP.md` §三详版条目（逐条 checklist，并行改不同条目不冲突）；然后**只往本文件下方「待折叠」区末尾追加一行**，不碰 §一。追加行是纯 append，git 对不同分支的 append 合并干净、不产生重号。
- **交互式会话 / 合并协调者开工时**：先把「待折叠」区堆积的行折进 `ROADMAP.md` §一——「最近完成」按时间插入并裁到最近 3 条、「下一步」按新情况重排编号并划掉完成项——然后**清空「待折叠」区**（只留标题与本说明）。这一步串行、单写者，不会撞。

事实仍只在 §三详版写一遍（[CLAUDE.md 一]）；本文件的行是给折叠动作看的临时便签，折叠后即删，不是第二份记录。

---

## 待折叠

- 2026-09-05 · 架构优化任务B完成：新增 `tools/data_files.py` 收敛4处 `data/exchanges/*.yml` 遍历样板，`make build` 全绿零 diff（[ADR-PENDING-tools-dedup]）
- 2026-09-05 · 架构优化任务C完成：DECISIONS.md 归档阈值定案（超3500行触发），validate.py 加非阻断 warn（[ADR-PENDING-decisions-archive-threshold]）
