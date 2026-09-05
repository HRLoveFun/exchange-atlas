# ADR-dev-automation — 开发流程自动化：CI 作合并关卡 + 一条 ADR 一个文件（编号与台账退役）

**背景：** 用户明确提出：疲于「开 PR 等人工审、跑 `make assign-adr` 定号、反复解 PR 冲突」这三件事，要求高度自动化、摆脱人工干预。核对历史后确认这不是主观感受——近 12 个 PR 里有 4 次是「让号 / 解冲突」提交，且 [ADR-029]（让号协议）→ [ADR-069]（编号台账）→ [ADR-076]（占位符 + 合并前定号）**三条 ADR 管理的是同一个症状**，每版减轻一点却没有消除来源。本条把 [ADR-069]「未做」清单里挂着的两项（`DECISIONS.md` 拆文件、CI）执行掉。

**两条结构性根因（实测）：**

1. **ADR 编号是全局串行的人读标识，而 80 条 ADR 全部追加在同一个 2183 行文件的尾部。** 两条并行分支各写一条 ADR 就必然在文件尾撞车（本次 PR #78 即是）；[ADR-076] 为消除撞号引入的 `make assign-adr` 本身成了新的人工步骤，且**漏跑一次 main 就是红的**——PR #77 合并时正是漏跑，`ADR-PENDING-risk-flags-data-plan` 残留在 main 上，而占位符校验对 main 判 `err`。
2. **仓库没有 CI、没有分支保护，`allow_auto_merge` 为 `false`。** 「人工点合并」既是瓶颈又不是真关卡——它不跑 `make build`，PR #61/#62 就这样把 main 合红（`c0c2b04`，PR #63 收拾）。护栏 3（[ADR-069]「串行合并、合完必 `make build`」）当时只能写成纪律，正是因为没有 CI。

**定了什么：**

**一、CI 作合并关卡（轨 A）**

- 新增 `.github/workflows/build.yml`：`pull_request` 与 `push: main` 上跑 `make build` + `git diff --exit-code`（生成块与 `docs/data/` 产物零 diff）。依赖只有 `pyyaml` / `jsonschema`，跑得很轻。
- 仓库设置打开 `allow_auto_merge` 与 `delete_branch_on_merge`（用户 2026-09-05 授权代跑）。后台任务收尾改用 `gh pr merge --auto --squash`，`delete_branch_on_merge` 顺带消掉 `GIT-RUNBOOK.md` 记的那个坑（`--delete-branch` 因本地分支被 worktree 检出而报错）。
- **⚠️ 「CI 绿了才合」需要两步，只做第一步不成立。** GitHub 的 auto-merge 等的是**必需的状态检查 / 必需审阅**；仓库当前没有分支保护、没有必需检查，`--auto` 会在 PR 一 mergeable 时**立刻合并、不等 CI**。要真正落地这道关，还需给 `main` 加一条 classic 分支保护：required status check = `build`，且 **`enforce_admins: false`**——这样必需检查只约束 PR 合并路径，交互式会话仍可直推 main（[CLAUDE.md §六] 不受影响）。
- **这一步必须等 workflow 先进 main**：GitHub 只允许把「至少上报过一次的检查」设为必需。**本次 PR 上 CI 未触发**——该仓库 107 次 Actions 运行全部是 Pages 的 `dynamic` 事件，从未跑过任何自定义 workflow（`event=pull_request` 计数为 0），workflow 文件确认已在远端分支上（1267 字节）。合进 main 后 `push: main` 会触发一次，届时才能确认 Actions 在本仓库确实可用、并把 `build` 设为必需检查。若那次仍不触发，要去仓库 Settings → Actions 查账号层面的限制。**在配好必需检查之前，后台任务不要用 `--auto`**（那等于无条件立即合并），仍按人工确认合并。
- **覆盖边界（诚实说明）：** `.cache/` 不入库（[ADR-044]），CI 里 `verify_quotes` 全是 CACHE_MISS、`FAIL=0`——**CI 守的是结构与一致性（schema / 枚举 / 生成块零 diff / 引用完整性），不是引文核对**。防幻觉那道关仍靠本地 `make check`（有 `.cache`）与第二人复核（[CLAUDE.md §四]），CI 不能替代，也不该让人误以为替代了。

**二、一条 ADR 一个文件，数字编号冻结（轨 B）**

- `PROJECT/decisions/` 下**一条 ADR 一个文件，文件名即身份**：历史条目 `ADR-001.md`–`ADR-080.md`（编号**冻结**，不再新增），新条目 `ADR-<slug>.md`（本文件即首例）。**新增一条 ADR = 新建一个文件**，并行分支各写各的 → git 层面无从冲突，**不取号、无台账、无合并前定号步骤**。
- `PROJECT/DECISIONS.md` 退化为「说明 + `make sync` 生成的索引」（历史条目按编号、新条目按日期），角色同 `PROJECT/GLOSSARY.md`。
- **1270 处存量 `[ADR-NNN]` 引用一处不用改**：引用解析改为「解析到 `PROJECT/decisions/<id>.md` 是否存在」，数字引用沿用裸/带括号两种写法，slug 引用要求带方括号 `[ADR-<slug>]`（裸 slug 会和正文普通短语混淆）。
- **删除**（写成裸文件名而非仓库路径：它们已不存在，写成路径会被路径校验判为失效引用）：编号台账 `ADR-LEDGER.md`、定号脚本 `assign_adr_number.py`、`make assign-adr`、`validate.py` 的 `adr_ledger_violations` / `pending_adr_placeholder_violations` / 两个对应 `validate_*` 函数与 `ADR-PENDING` 正则。[ADR-029]/[ADR-069]/[ADR-076] 三条 ADR 本身**不删不改**（[ADR-046] 历史不可变），本条是它们的继任者。
- **新增机器校验**（[CLAUDE.md §四]：新不变式同批加校验）：`adr_file_violations()` 三条——文件名 = 首行 id、id 不重复、标题非空；`selfcheck` 换 8 条用例（原台账 7 条 + 占位符 6 条退役）。

**为什么选「历史冻结 + 新条 slug」而不是全量重编号：** 零迁移风险、零引用改写。数字与 slug 混排是诚实的——编号是一段历史身份，不是必须贯彻到底的规范。这与 [ADR-046]「历史 ADR 不可变」、[ADR-077]「零迁移缓解认知负荷」的既有取舍一致。切分本身是机械的，带零丢失断言（区块拼接 == 原文、每个文件正文能在原文里逐字找到），80/80 全过。

**三、宪法与运行手册相应改写（轨 D）**

`CLAUDE.md` §一 职责边界表（删 `ADR-LEDGER.md` 行、改 `DECISIONS.md` 行）、§六 Git 推送方式（后台任务改为「开 PR + `--auto`，CI 绿了自动合并」）、§八 记录纪律（ADR 触发时机改为「新建文件」，删占位符与定号步骤）；`PROJECT/GIT-RUNBOOK.md` 里被 CI 与 `delete_branch_on_merge` 取代的手工纪律相应改写。宪法改动经用户 2026-09-05 明确选择「A+B+D」授权。

**没做 / 留后续：**

- **轨 C 未做**（用户本次未选）：`ROADMAP-INBOX.md` 虽是 append-only 但**最后一行照样撞**（本次即撞），彻底解法是一便签一文件；`ROADMAP.md` §三 相邻条目各自重写也会撞。收益/成本比不如 A、B，留作下次。
- 分支保护 / 必需状态检查：见上，与 [CLAUDE.md §六] 的直推 main 冲突，本次刻意不加。
- CI 里跑不了引文核对（`.cache/` 不入库）；是否给 CI 加一条「只在 `data/` 有改动时提示需本地 `make check`」的软提醒，留观察。

**验证：** `make build` 全绿；`make sync` 二次幂等、生成块零 diff；`selfcheck` 用例全过；切分零丢失断言 80/80；本条 ADR 自身即新机制的首例（文件名 slug、无编号、被 `make check` 的引用解析覆盖）。

**日期：** 2026-09-05
