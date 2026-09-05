# Git runbook — 后台任务 PR 与 worktree 清理

推送原则（默认推 main、交互式 vs 后台任务、不 force push / 不改写已推送历史）在 `CLAUDE.md` §六，不在这里重复。本文件只收后台任务留下的 PR 合并时的操作细则与踩坑记录。

---

## 合并后台任务留下的 PR：先摘 worktree，再 merge

**现象**：`gh pr merge <n> --squash --delete-branch` 的删分支顺序是「先删本地分支、再删远端分支」。而 PR 的 head 分支通常正被 `.claude/worktrees/<name>` 检出，git 会以

```
cannot delete branch '<branch>' used by worktree at '...'
```

拒绝。**此时远端其实已经合并成功，但命令以非零码退出、且远端分支残留**——只看退出码会误判成「合并失败」，再跑一次只会得到 `was already merged`，又卡在同一个本地错误上。

**正确顺序**：

```bash
git -C .claude/worktrees/<name> status -sb   # 先确认无未提交内容；squash 合并后提交已被 main 的 merge commit 收走，删掉不丢东西
git worktree unlock .claude/worktrees/<name> # 后台任务的 worktree 往往是 locked，不 unlock 不能 remove
git worktree remove .claude/worktrees/<name>
git branch -D <head-branch>                  # squash 合并后 -d 会判"未合并"，需 -D
gh pr merge <n> --squash --delete-branch
git pull --ff-only && make build             # gh 在删分支失败时会跳过本地 main 的同步，合并后自己补一次；build 红则停（见下）
```

## 常态：不用手动合并（[ADR-dev-automation]）

目标形态：后台任务收尾时开 PR 并跟一句 `gh pr merge --auto --squash`，CI（`.github/workflows/build.yml`）跑完 `make build` 绿了就自动合并、自动删远端分支（仓库已开 `delete_branch_on_merge`），**人不需要点合并**。

**⚠️ 前置未完成前不要用 `--auto`。** auto-merge 等的是**必需状态检查**；`main` 上还没配 required check `build` 之前，`--auto` 会在 PR 一 mergeable 时立刻合并、**完全不等 CI**。配置方法与为什么要 `enforce_admins: false`，见 [ADR-dev-automation] 轨 A。在那之前，后台任务照旧留 PR、由人确认后合并，下面的手动步骤仍然适用。

**原「合并前先给占位符 ADR 定号」一节已删除**：数字编号在 001–080 冻结、新 ADR 一律是 `PROJECT/decisions/ADR-<slug>.md` 不取号，没有号可撞，也就没有「合并前先定号」这一步了（[ADR-dev-automation]）。`make assign-adr`、定号脚本、编号台账三者均已随之删除。

## 一次只合一个后台 PR，合完必 `make build`（[ADR-069]）

后台 PR 分支拉出时对 `main` 是绿的，但两条并行分支的改动**合并时**可能语义冲突而 git 不报——`ROADMAP.md` §一 重号、生成块块内重复表头、`DECISIONS.md` ADR 撞号（2026-09-04 PR #61/#62 就是这样把 `main` 的 `make check` 合红的，PR #63 收拾）。后台 PR 走的是网页 / `gh` 直接 merge，没有 CI 卡点，合并动作本身不验证。所以：

- **串行合并**：一次只 merge 一个后台 PR。`git pull --ff-only && make build` 确认绿，**再**处理下一个。
- **红了先修**：`make build` 红就地修（多半是生成块跑 `make sync`、或 §一 / ADR 编号的合并残留），修完再合下一个。**绝不把第二个 PR 叠在未验证的 `main` 上**——叠上去之后两个问题混在一起，难拆。
- 多个后台 PR 待合并时，先各自 `gh pr view <n>` 看 `mergeStateStatus`；`BEHIND` 的先在其分支上 `merge origin/main`（不 rebase，[ADR-029]）解冲突、`make build` 绿了再推。

## `gh pr merge` 非交互执行

不带 `--subject` / `--body` 会弹 `$EDITOR` 让人编辑 squash 提交信息，非交互执行必须显式给：

- `--subject`——GitHub 不会自动追加 `(#n)`，要自己带上；
- `--body ""`。

## 相关历史

- 并行 worktree 防失序的四道护栏（§一 单写者 + ADR 台账 + 生成块 + 本节的串行合并纪律），见 `DECISIONS.md` [ADR-069]。
- 并行分支 ADR 编号撞号、已推送提交不能 rebase（改用 `merge origin/main`）的处理，见 `DECISIONS.md` [ADR-029]（编号预支的第一版根治是 [ADR-069] 的编号台账；批量并行下该版仍会撞，占位符 + 合并时定号的第二版见 [ADR-076]。两版都已随 [ADR-dev-automation] 退役——ADR 改为一条一个文件、不再取号，根本没有号可撞）。
- `isolation: "worktree"` 在「因限额中断后经 SendMessage 恢复」路径上多次失效的证据，见 [ADR-021] / [ADR-027] / [ADR-031]。
- `.cache/` 被误提交为符号链接导致 `git pull` 静默抹掉本地来源快照，见 [ADR-044]。
