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
- 并行分支 ADR 编号撞号、已推送提交不能 rebase（改用 `merge origin/main`）的处理，见 `DECISIONS.md` [ADR-029]（编号预支的根治见 [ADR-069] 的 `ADR-LEDGER.md`）。
- `isolation: "worktree"` 在「因限额中断后经 SendMessage 恢复」路径上多次失效的证据，见 [ADR-021] / [ADR-027] / [ADR-031]。
- `.cache/` 被误提交为符号链接导致 `git pull` 静默抹掉本地来源快照，见 [ADR-044]。
