# Git runbook — 后台任务 PR 与 worktree 清理

推送原则（默认推 main、交互式 vs 后台任务、受保护文件走审批、不 force push / 不改写已推送历史）在 `CLAUDE.md` §六，不在这里重复。本文件只收后台任务 PR 合并时的操作细则与踩坑记录。

---

## 通用纪律：提交前先核对暂存内容

任何一次 `git commit` 前先跑 `git status` 核对暂存范围与本次改动是否一致，再按需要精确 `git add` 具体文件；不要用 `git add -A` 一把梭扫全工作区——工作区里可能混着其他并行改动、临时文件或不该入库的产物，`-A` 会把它们一起带进提交。

---

## 自动合并流水线（[ADR-081]）——默认路径

后台任务开 PR 后，正常情况下**不需要人做任何事**：

1. 后台任务开 PR 时自带 `gh pr merge --auto --squash --subject "<标题>" --body ""`（`--subject` / `--body` 必须显式给，见下方「`gh pr merge` 非交互执行」；不需要 `--delete-branch`，仓库已开 `deleteBranchOnMerge`，远端分支合并后服务端自动删）。
2. `.github/workflows/pr-build.yml` 在 PR 上跑 `make build`，绿了 GitHub 服务端执行 auto-merge、squash 进 main——这一步是服务端异步完成的，**不触碰本地 worktree 检出的分支**，「先摘 worktree 再 merge」那个坑天然不会发生。

**什么时候还需要人工介入（两种情况）**：

- **CI 报红**（`make build` 不过）——auto-merge 会一直等，PR 不会被错误地合进去；人 / 协调者去看 `gh pr checks <n>` 找出哪里红了，修完再等它自动合并，不需要重新设置 auto-merge。
- **真实内容冲突**（两条分支改了同一处，git 判定不可自动合并）——auto-merge 同样会一直等；这种情况本就该露出来给人看，走下面「人工兜底合并」。`ROADMAP.md` §一「下一步」并行改同一处即属此类——只在阶段切换时才会撞，撞了按内容冲突处理。

- **触及受保护文件的 PR**（清单见 `.github/CODEOWNERS`）——`protected-paths-guard.yml` 的 required check `guard` 会因缺 `owner-approved` 标签而失败，把 PR 挡在 `BLOCKED`；owner 审阅后在 PR 上打 `owner-approved` 标签，`guard` 转绿、auto-merge 放行（见 [ADR-protected-paths-ci-guard]）。

以下两节是上面走不通时的**人工兜底流程**，不再是默认路径。

## 人工兜底：合并后台任务留下的 PR——先摘 worktree，再 merge

**现象**：`gh pr merge <n> --squash --delete-branch` 先删本地分支、再删远端。而 PR 的 head 分支通常正被 `.claude/worktrees/<name>` 检出，git 会以

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
git pull --ff-only && make build             # gh 在删分支失败时会跳过本地 main 的同步，合并后自己补一次；build 红则停
```

## 一次只合一个后台 PR，合完必 `make build`（[ADR-069]）——人工兜底合并时仍适用

后台 PR 分支拉出时对 `main` 是绿的，但两条并行分支的改动**合并时**可能语义冲突而 git 不报——生成块块内重复表头、`DECISIONS.md` 里两条并行 ADR 用了同名 `### ADR-<slug>`（2026-09-04 PR #61/#62 就是这样把 `main` 的 `make check` 合红的，PR #63 收拾）。人工兜底合并走网页 / `gh` 直接 merge，没有 CI 卡点，合并动作本身不验证。所以：

- **串行合并**：一次只 merge 一个后台 PR。`git pull --ff-only && make build` 确认绿，**再**处理下一个。
- **红了先修**：`make build` 红就地修（多半是生成块跑 `make sync`、或同名 slug ADR 的合并残留），修完再合下一个。**绝不把第二个 PR 叠在未验证的 `main` 上**。
- 多个后台 PR 待合并时，先各自 `gh pr view <n>` 看 `mergeStateStatus`；`BEHIND` 的先在其分支上 `merge origin/main`（不 rebase，[ADR-029]）解冲突、`make build` 绿了再推。

**走自动合并流水线时的同类风险（未开 Merge Queue 前的已知局限）**：`pr-build.yml` 的检查是在 PR 开出 / 更新那一刻的内容上跑的；两个后台 PR 前后脚都设了 auto-merge，第一个合并后 `main` 往前走了，第二个的检查结果不会自动重跑（GitHub 只保证没有文本冲突就按 PR 自己的内容合并，不保证「合并后语义」仍一致）。缓解：给 `main` 开 GitHub 原生 **Merge Queue**（仓库设置勾选，需 branch protection + `build` 为 required check）——排队项自动 rebase 到最新 `main` 再重跑检查、一次只处理一个；没开之前，多个后台 PR 密集合并后手动跑一次 `make build` 确认 `main` 仍绿。

## 分支保护现状（留档）

`main` 分支保护（`gh api repos/HRLoveFun/exchange-atlas/branches/main/protection` 可查）：

```json
{
  "required_status_checks": {"strict": false, "contexts": ["build", "guard"]},
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

- `build` required check（2026-09-05 设，[ADR-081]）：`gh pr merge --auto` 只有在 `build` 是 required check 时才真的等它跑完、失败就不合并（实测 PR #82：故意弄红后 `mergeStateStatus` 稳定停在 `BLOCKED`）。
- `guard` required check（`protected-paths-guard.yml`，[ADR-protected-paths-ci-guard]）：碰 `.github/CODEOWNERS` 列出路径的 PR，缺 `owner-approved` 标签则 `guard` 红、PR 停在 `BLOCKED`；打标签后转绿。**取代**原 `require_code_owner_reviews`——后者配 `count: 0` 不阻断（实测 PR #107 照样合入），配 `count: 1` 会卡住所有 PR。
- `enforce_admins: false`：仓库 owner（admin）直接推 main、以及 admin 手动合并受保护文件 PR 不受 required checks 约束（`CLAUDE.md` §六 交互式会话默认直推的约定不变）。

改 branch protection 需 admin 权限、且值日会话的 auto-mode 权限分类器会拦——由用户手动跑 `gh api -X PUT ...`。

## 定期清理残留分支

`deleteBranchOnMerge` 已开，但后台任务的 `worktree-*` 分支在 PR 被 **close**（而非 merge）时不会自动删；本地那份可能还留在别的并行会话摘不掉的 worktree 里。隔一阵扫一次。

安全删除判据（逐条过）：`gh pr view <n> --json state,mergeCommit` 为 `MERGED` 且 merge commit 是 `origin/main` 祖先（`git merge-base --is-ancestor <merge> origin/main`）；或 PR `CLOSED` 且确认被取代、`git diff <branch> origin/main` 为空。确认后：

```bash
gh pr list --state open ; git worktree list    # 先看清：别碰有 open PR 的分支、别碰活 worktree 占用的分支
git push origin --delete <b1> <b2> ...          # 远端（不碰 main）
git branch -D <local>                           # 本地（squash 合并后 -d 会误判"未合并"）
git worktree unlock <path> && git worktree remove <path> && git worktree prune   # 分支被 worktree 占用时
git fetch --prune
```

⚠️ 并行会话的活分支：它的 commit 若已 push + 开 PR，删掉本地那份不丢东西，但会打断它收尾——`git worktree remove` 尤其会把它正在写的目录端掉。删前务必对一遍 open PR 列表。

## `gh pr merge` 非交互执行

不带 `--subject` / `--body` 会弹 `$EDITOR` 让人编辑 squash 提交信息，非交互执行必须显式给：

- `--subject`——GitHub 不会自动追加 `(#n)`，要自己带上；
- `--body ""`。

## 相关历史

- 自动合并流水线（CI build 检查 + auto-merge，取代人工点 merge），见 `DECISIONS.md` [ADR-081]。
- 受保护文件审批闸：方案 [ADR-protected-files-approval-gate]（CODEOWNERS）+ 实测修正 [ADR-protected-paths-ci-guard]（改用 `protected-paths-guard.yml` 的 required check + `owner-approved` 标签，因 solo 仓库 GitHub 原生 code-owner review 不阻断）。
- 并行 worktree 防失序四道护栏 [ADR-069] 里的「§一 单写者 + ROADMAP-INBOX + ADR 编号台账」两道已随「协调机器精简」删除（[ADR-slim-coordination-machinery]）——§一「下一步」改为不编号、任何会话直接改、并行冲突走内容冲突路径；ADR 改 slug 标识、同名 slug 撞车即 `DECISIONS.md` 上的可见文本冲突。留下的是「串行合并、每合一个 `make build`」这道纪律。
- 并行分支已推送提交不能 rebase（改用 `merge origin/main`）的处理，见 [ADR-029]。
- `isolation: "worktree"` 在「因限额中断后经 SendMessage 恢复」路径上多次失效的证据，见 [ADR-021] / [ADR-027] / [ADR-031]。
- `.cache/` 被误提交为符号链接导致 `git pull` 静默抹掉本地来源快照，见 [ADR-044]。
