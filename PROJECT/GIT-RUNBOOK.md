# Git runbook — 后台任务 PR 与 worktree 清理

推送原则（默认推 main、交互式 vs 后台任务、不 force push / 不改写已推送历史）在 `CLAUDE.md` §六，不在这里重复。本文件只收后台任务留下的 PR 合并时的操作细则与踩坑记录。

---

## 自动合并流水线（[ADR-081]）——现在是默认路径

后台任务开 PR 后，正常情况下**不需要人做任何事**：

1. 后台任务开 PR 时自带 `gh pr merge --auto --squash --subject "<标题>" --body ""`（`--subject`/`--body` 必须显式给，见下方「`gh pr merge` 非交互执行」一节；不需要 `--delete-branch`，仓库已开 `deleteBranchOnMerge`，远端分支合并后服务端自动删）。
2. `.github/workflows/pr-build.yml` 在 PR 上跑 `make build`，绿了 GitHub 服务端执行 auto-merge，squash 进 main——这一步不是本地 `gh` 命令做的，是 GitHub 服务端异步完成的，所以**不会触碰本地 worktree 检出的分支**，「先摘 worktree 再 merge」那个坑天然不会发生。
3. 若 `DECISIONS.md` 里带 `ADR-PENDING-<slug>` 占位符，合并进 main 之后由 `.github/workflows/adr-heal.yml`（`push: main` 触发，`concurrency: group: main-adr-heal` 保证多个后台 PR 连续合并时逐条串行处理，不会重现 PR69-72 那次连撞四次）自动跑 `make assign-adr`，把占位符定号并直接 commit + push 回 main。全程无需协调者手动跑 `make assign-adr`。

**什么时候还需要人工介入（仅剩两种情况）**：

- **CI 报红**（`make build` 不过）——auto-merge 会一直等，PR 不会被错误地合进去；需要人/协调者去看 `gh pr checks <n>` 找出哪里红了，修完再等它自动合并，不需要重新设置 auto-merge。
- **真实内容冲突**（两条分支改了同一处，git 判定不可自动合并）——auto-merge 同样会一直等；这种情况本来就该露出来给人看，走下面「人工兜底合并」的老流程。

以下两节（先摘 worktree / 定号）是上面走不通时的**人工兜底流程**，不再是默认路径。

## 人工兜底：合并后台任务留下的 PR——先摘 worktree，再 merge

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

## 人工兜底：合并前先给占位符 ADR 定号（[ADR-076]）

正常路径下这一步已经由 `.github/workflows/adr-heal.yml` 在合并进 main 之后自动做掉（见上方「自动合并流水线」），不需要协调者手动跑。仅当 CI/healer workflow 本身出故障、或走人工兜底合并时才需要下面这套手动步骤：某条后台 PR 的 `DECISIONS.md` 里如果带着 `### ADR-PENDING-<slug>` 占位符（并行分支不再预支具体数字号的新纪律，见 `PROJECT/ADR-LEDGER.md`），**在 `gh pr merge` 之前**先在该分支上跑一次定号：

```bash
cd .claude/worktrees/<name>       # 或该分支已签出的任意目录
git pull --ff-only                # 确保台账是 main 最新状态，定号才准
make assign-adr                   # 把占位符改写成台账下一个真实编号 + 全库替换引用
git status -s                     # 确认只改了 DECISIONS.md / ADR-LEDGER.md 及被引用的文件
git add -A
git commit -m "编号定案：ADR-PENDING-<slug> → ADR-0NN（assign_adr_number.py）"
git push
```

再按下面「一次只合一个后台 PR」的正常步骤 `gh pr merge`。**多个待合并 PR 都带占位符时仍要逐条串行处理**——定号、合并、`make build` 绿了，再处理下一个的定号，不要一次性给所有分支批量定号（那样又回到「预支」竞态，见 [ADR-076]）。

## 一次只合一个后台 PR，合完必 `make build`（[ADR-069]）——人工兜底合并时仍适用

后台 PR 分支拉出时对 `main` 是绿的，但两条并行分支的改动**合并时**可能语义冲突而 git 不报——`ROADMAP.md` §一 重号、生成块块内重复表头、`DECISIONS.md` ADR 撞号（2026-09-04 PR #61/#62 就是这样把 `main` 的 `make check` 合红的，PR #63 收拾）。这一节讲的是**人工兜底合并**时的纪律：走网页 / `gh` 直接 merge，没有 CI 卡点，合并动作本身不验证。所以：

- **串行合并**：一次只 merge 一个后台 PR。`git pull --ff-only && make build` 确认绿，**再**处理下一个。
- **红了先修**：`make build` 红就地修（多半是生成块跑 `make sync`、或 §一 / ADR 编号的合并残留），修完再合下一个。**绝不把第二个 PR 叠在未验证的 `main` 上**——叠上去之后两个问题混在一起，难拆。
- 多个后台 PR 待合并时，先各自 `gh pr view <n>` 看 `mergeStateStatus`；`BEHIND` 的先在其分支上 `merge origin/main`（不 rebase，[ADR-029]）解冲突、`make build` 绿了再推。

**走自动合并流水线时的同类风险（未开 Merge Queue 前的已知局限）**：`pr-build.yml` 的 `make build` 检查是在 PR 开出/更新那一刻的内容上跑的；如果两个后台 PR 前后脚都设了 auto-merge，第一个合并后 `main` 往前走了，第二个的检查结果不会自动重新验证（GitHub 只保证没有文本冲突就按你 PR 自己的内容合并，不保证生成块 / ADR 台账这类"合并后语义" 仍然一致）。缓解办法：给 `main` 开 GitHub 原生 **Merge Queue**（仓库设置里勾选，需要基本的 branch protection + 把 `build` 设成 required check）——开了之后每条排队项会自动 rebase 到最新 `main` 再重跑检查、一次只处理一个，从根上解决这个残余风险；没开之前，多个后台 PR 密集合并后建议手动跑一次 `make build` 确认 `main` 仍绿。

## `gh pr merge` 非交互执行

不带 `--subject` / `--body` 会弹 `$EDITOR` 让人编辑 squash 提交信息，非交互执行必须显式给：

- `--subject`——GitHub 不会自动追加 `(#n)`，要自己带上；
- `--body ""`。

## 相关历史

- 自动合并流水线（CI build 检查 + auto-merge + `adr-heal` post-merge 定号，取代人工点 merge / 人工跑 `assign-adr`），见 `DECISIONS.md` [ADR-081]。
- 并行 worktree 防失序的四道护栏（§一 单写者 + ADR 台账 + 生成块 + 本节的串行合并纪律），见 `DECISIONS.md` [ADR-069]。
- 并行分支 ADR 编号撞号、已推送提交不能 rebase（改用 `merge origin/main`）的处理，见 `DECISIONS.md` [ADR-029]（编号预支的第一版根治见 [ADR-069] 的 `ADR-LEDGER.md`；批量并行下该版仍会撞，占位符 + 合并时定号的第二版见 [ADR-076]）。
- `isolation: "worktree"` 在「因限额中断后经 SendMessage 恢复」路径上多次失效的证据，见 [ADR-021] / [ADR-027] / [ADR-031]。
- `.cache/` 被误提交为符号链接导致 `git pull` 静默抹掉本地来源快照，见 [ADR-044]。
