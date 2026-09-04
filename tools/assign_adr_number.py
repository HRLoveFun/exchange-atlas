#!/usr/bin/env python3
"""tools/assign_adr_number.py — 把当前分支引入的 ADR-PENDING-<slug> 占位符定号为
台账下一个真实编号，并全库替换所有引用（[ADR-076]）。

**为什么需要**：并行 worktree 开工时如果各自预支具体数字号，几条分支几乎必撞
（PR69-72 一批连撞四次：070→071→072→073→074→075）。根因是「取号」这个必须
串行化的动作被绑在了「分支开工」这个天然并行的时刻上。

**这个脚本改绑的时刻**：分支写作时不再猜数字，`DECISIONS.md` 新条目的标题写成
`### ADR-PENDING-<slug> — <一句话主题>`，正文/其他文件的交叉引用写
`[ADR-PENDING-<同一 slug>]`。合并协调者串行合并某条后台 PR **之前**，在该分支上
跑这个脚本一次：读取当前 main 上 `PROJECT/ADR-LEDGER.md` 的最大已占号，把这条
分支引入的占位符依次分配 max+1, max+2, ...，改写 `DECISIONS.md` 的标题、全库所有
`ADR-PENDING-<slug>` 字面引用，并在台账追加登记行。因为合并本身是串行的
（[ADR-069] 已规定一次只合一个后台 PR），把取号绑在这一刻上就不会撞。

改动只 stage 到工作区，不自动 commit——人工确认 diff 后照常提交（谨慎执行原则，
CLAUDE.md「执行动作的克制」）。真撞了（两条分支的脚本恰好在同一瞬间基于同一个
main 状态各自跑，概率极低但非零）：仍按 [ADR-029] 协议手工让号 + 全库 grep 兜底。

用法：
    python tools/assign_adr_number.py            # 处理 DECISIONS.md 里找到的全部占位符
    python tools/assign_adr_number.py --dry-run   # 只打印将要做的替换，不改任何文件
"""
import argparse
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DECISIONS = ROOT / "PROJECT" / "DECISIONS.md"
LEDGER = ROOT / "PROJECT" / "ADR-LEDGER.md"

PLACEHOLDER_HEADING_RE = re.compile(
    r"^### ADR-PENDING-([A-Za-z0-9][A-Za-z0-9_-]*)(?:\s+—\s+(.*))?$", re.M)
LEDGER_SINGLE_RE = re.compile(r"^-\s*ADR-(\d{3})\b", re.M)
LEDGER_RANGE_RE = re.compile(r"ADR-(\d{3})\s*(?:…|\.\.\.|—|~)\s*ADR-(\d{3})")


def current_branch():
    out = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                          cwd=ROOT, capture_output=True, text=True, check=True)
    return out.stdout.strip()


def ledger_max(ledger_text):
    """台账里出现过的最大编号（含区间行的右端点）。台账为空则视为无法确定起点。"""
    nums = []
    for line in ledger_text.splitlines():
        s = line.strip()
        if not s.startswith("- ADR-"):
            continue
        rng = LEDGER_RANGE_RE.search(s)
        if rng:
            nums.append(int(rng.group(2)))
            continue
        m = LEDGER_SINGLE_RE.match(s)
        if m:
            nums.append(int(m.group(1)))
    if not nums:
        sys.exit("[assign-adr] PROJECT/ADR-LEDGER.md 里没找到任何登记行，无法确定起始号")
    return max(nums)


def find_placeholders(decisions_text):
    """按标题在文件里出现的顺序去重，返回 [(slug, title), ...]。"""
    seen = []
    slugs = set()
    for slug, title in PLACEHOLDER_HEADING_RE.findall(decisions_text):
        if slug not in slugs:
            slugs.add(slug)
            seen.append((slug, title.strip()))
    return seen


def repo_tracked_files():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT,
                          capture_output=True, text=True, check=True)
    return [ROOT / p for p in out.stdout.splitlines() if p]


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                  formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="只打印将要做的替换，不改任何文件")
    args = ap.parse_args()

    if not DECISIONS.exists() or not LEDGER.exists():
        sys.exit("[assign-adr] 找不到 PROJECT/DECISIONS.md 或 PROJECT/ADR-LEDGER.md")

    decisions_text = DECISIONS.read_text(encoding="utf-8")
    placeholders = find_placeholders(decisions_text)
    if not placeholders:
        print("[assign-adr] 没有找到 ADR-PENDING-* 占位符，无需处理。")
        return

    ledger_text = LEDGER.read_text(encoding="utf-8")
    next_num = ledger_max(ledger_text) + 1
    branch = current_branch()
    today = date.today().isoformat()

    assignments = {}
    ledger_lines = []
    for slug, title in placeholders:
        num = next_num
        next_num += 1
        assignments[slug] = num
        topic = title if title else "（见 DECISIONS.md）"
        ledger_lines.append(f"- ADR-{num:03d} · {topic} · {branch} · {today}")
        print(f"[assign-adr] ADR-PENDING-{slug} → ADR-{num:03d}")

    if args.dry_run:
        print("[assign-adr] --dry-run，未改动任何文件。")
        return

    changed = []
    for path in repo_tracked_files():
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new_text = text
        for slug, num in assignments.items():
            new_text = new_text.replace(f"ADR-PENDING-{slug}", f"ADR-{num:03d}")
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            changed.append(path.relative_to(ROOT))

    ledger_existing = LEDGER.read_text(encoding="utf-8")
    if not ledger_existing.endswith("\n"):
        ledger_existing += "\n"
    ledger_existing += "\n".join(ledger_lines) + "\n"
    LEDGER.write_text(ledger_existing, encoding="utf-8")
    if LEDGER.relative_to(ROOT) not in changed:
        changed.append(LEDGER.relative_to(ROOT))

    print(f"[assign-adr] 已改写 {len(changed)} 个文件：")
    for c in sorted(changed):
        print(f"  {c}")
    print("[assign-adr] 改动未提交——检查 diff 后按常规流程 commit。")


if __name__ == "__main__":
    main()
