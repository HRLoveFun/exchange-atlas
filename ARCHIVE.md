# ARCHIVE —— 永久保存的快照分支，请勿改动

本分支 **`0001`** 是一个**永久保存的历史快照**。不要向它推送、变基、强制更新，也不要删除它。

- **内容 =** 提交 `2e1ba34741b7bdb3aef7cba427c9572f86855e9a`（`guard e2e C (#111)`，2026-09-06）的树，其上只追加本归档说明这一个提交。
- **是什么 =** `main` 线性历史上的一个冻结点。本分支创建时指向 `main` 倒数第 16 个提交。
- **为什么留 =** 用户明确要求长期保留此版本作为存档。

## 操作约定

**永远不要**：

- 向本分支推送新提交
- 变基 / 强制更新 / 让它跟随 `main`
- 删除本分支（`git push origin --delete 0001`）

`git diff origin/0001 origin/main` 会显示大量差异——那只是因为 `main` 在本快照之后继续前进，**不代表本分支可以清理或需要更新**。

依据见 `main` 分支上的 `PROJECT/DECISIONS.md`（`ADR-supply-chain-ci-hardening`）与 `PROJECT/GIT-RUNBOOK.md`「定期清理残留分支」一节的例外条。

---

# ARCHIVE — permanently preserved snapshot branch, do not modify

Branch **`0001`** is a **permanently preserved historical snapshot**. Do not push to it, rebase it, force-update it, or delete it.

- **Contents** = the tree of commit `2e1ba34` (`guard e2e C (#111)`, 2026-09-06) plus this single archive-notice commit on top.
- **What it is** = a frozen point on `main`'s linear history (the 16th commit back from `main` when this branch was created).
- **Why it's kept** = the repository owner explicitly asked for this version to be preserved long-term.

A large `git diff` against `origin/main` only means `main` moved on afterwards — it does **not** mean this branch is stale or needs updating.

See `ADR-supply-chain-ci-hardening` in `PROJECT/DECISIONS.md` and the exception note in the "定期清理残留分支" section of `PROJECT/GIT-RUNBOOK.md` on the `main` branch.
