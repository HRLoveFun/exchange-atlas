# CLAUDE.md — 会话宪法

exchange-atlas《全球交易所图鉴》：用统一框架横向记录全球主要交易所的交易机制与市场制度，每条事实可溯源、标注核实日期。公开仓库，不主动征集外部贡献。

新会话开始时，只需读本文件 + `PROJECT/ROADMAP.md` 就应该知道现在该做什么。不确定下一步时先看 ROADMAP。

---

## 一、文档职责边界表（先查这张表，再决定东西写在哪）

**核心原则：任何一个事实只在一处手写，其余位置要么生成、要么引用、要么被校验。** 发现自己在两个文件写同一件事，说明这张表哪里划错了，先改表，别继续复制。

| 文件 | 唯一负责 | 绝不写（改为指向） |
|---|---|---|
| `CLAUDE.md`（本文件） | 铁律、职责边界、降级方案 | 决策理由 → `DECISIONS.md`；命令列表 → `Makefile`（跑 `make help`） |
| `README.md` | 对外定位、免责声明、授权 | 干活流程 → skill；进度 → `ROADMAP.md` |
| `Makefile` | **命令的唯一权威** | — |
| `schema/taxonomy.yml` | 字段结构、双语标签、矩阵列归属、时效等级、原文要求 | 具体数据值 → `data/` |
| `schema/glossary.yml` | 术语译法唯一裁决 | 字段结构 → `taxonomy.yml` |
| `schema/enums.yml` | 受控词表唯一裁决 | — |
| `PROJECT/SOURCES.md` | 资料入口、抓取方式、查证经验 | 从来源抄来的事实 → `data/` |
| `PROJECT/ROADMAP.md` | 进度状态 | 为什么这么排 → `DECISIONS.md` |
| `PROJECT/DECISIONS.md` | **为什么这么定** | 是什么 → 各自权威文件 |
| `PROJECT/OPEN-QUESTIONS.md` | 尚未解决的疑问 | 已解决的 → 删除该条目（转 `data/` + 一条 ADR） |
| `PROJECT/GLOSSARY.md` | ⚠️ 由 `schema/glossary.yml` 生成，**不要手改** | — |
| `.claude/skills/add-exchange/` | 可执行步骤 | 铁律复述 → 引用本文件章节号，如"见 CLAUDE.md §二" |

生成块（`<!-- BEGIN:GENERATED ... -->`）只在五处使用：`ROADMAP.md` 的 progress-matrix 与 health-summary、`README.md` 的 exchange-list、`GLOSSARY.md` 全文、`OPEN-QUESTIONS.md` 的 auto-issues。这些由 `make sync` 重新生成；`make check` 会验证生成块内容与重新生成的结果一致，跑完 `make sync` 后 `git diff` 应为空——不为空说明有文档忘了同步。

---

## 二、防幻觉铁律（本文件是这五条的唯一权威）

这是本项目最大的风险，而且是静默失效的那种：对「上交所涨跌停 ±10%」这类常识可靠，但对某交易所某个具体机制的档位表、比例、条款编号的记忆**不可靠，且不会知道自己不可靠**。数据一旦被幻觉污染，项目价值归零，且很难事后发现。

1. **禁止凭记忆填写规则数值。** 每条事实必须来自当次实际抓取、存在 `.cache/` 里的原始页面，而不是"我记得"。
2. **来源优先级**：交易所官方规则手册 > 官网说明页 > 监管机构文件 > 第三方（研报/维基/新闻）。
3. **第三方来源的字段 `confidence` 最高只能标 `medium`。** 只有直接读到官方原始文本、且填了 `quote` 的字段才能标 `high`。
4. **查不清就留空，写进 `OPEN-QUESTIONS.md`，绝不猜。** 空字段不算失败，猜的字段才是。
5. **`confidence: high` 的字段必须有 `quote`**（原文照抄，一字不改），且 `zh`/`native` 里出现的数字必须能在 `quote` 里找到——`make check` 会做反向校验，填 `700円` 却引不出含 `700` 的原文会直接 fail。

`detail` 与 `quote` 不要混淆：`detail` 是自己写的解释，允许归纳改写；`quote` 是原文照抄，是抽检凭据。

抓取一律用 `make fetch EX=<id>`（内部走 curl + 常规浏览器 UA，见 `PROJECT/SOURCES.md`）——**不要用 WebFetch 直接抓交易所官网**，已实测多个交易所对 WebFetch 返回 403，换 curl UA 可以过。抓到的原始页存 `.cache/`，是「这条数据不是编的」的可核查凭据。

---

## 三、降级方案（遇阻即启用，不是失败）

若某交易所确实抓不到（强反爬、付费规则库、扫描件 PDF），不代表项目卡死，只是把「获取原文」这一环换成人工提供：

| 环节 | 正常 | 降级 |
|---|---|---|
| 找到出处 | AI 搜索 | 不变 |
| **获取原文** | AI curl | **人提供原文/PDF** |
| 结构化填充、术语统一、一致性维护、前端 | AI | 不变 |

也就是说抓不到某一家，先在 `PROJECT/SOURCES.md` 记清楚"这家为什么抓不到、试过什么方式"，在 `OPEN-QUESTIONS.md` 记下待人工提供的具体页面，然后换下一家或等人工投喂，不要因此放松第二节的铁律去"先凑合填上"。

---

## 四、数据质量的外部判据（不靠自觉）

- `PROJECT/ROADMAP.md` 的进度矩阵是 `make sync` 扫描 `data/` **算出来的**，不是手写"做完了"就算数。🟡（部分完成，含 low confidence 或空字段）会一直挂着，直到字段真的被坐实。
- v0.1 阶段性验收：上交所填完后人工抽检 20 个字段核对 `quote` 与原始出处，**通过率需 ≥95% 才能继续铺开其他交易所**；低于此数先停下来修流程，不要带着已知的高错误率继续扩张。

---

## 五、常用命令

跑 `make help` 看完整命令列表（`Makefile` 是命令的唯一权威，这里不重复）。最常用的：`make fetch EX=<id>`、`make build`、`make check`、`make serve`。

---

## 六、目录地图（简要，详细结构见各目录内文件）

```
schema/       数据结构、术语表、枚举表的权威（YAML）
data/         各交易所权威数据（YAML，人手写）
tools/        fetch.py / sync.py / validate.py
docs/         GitHub Pages 站点根目录（含构建产物 docs/data/）
PROJECT/      进度、决策、悬案、资料来源
.cache/       抓取的原始页快照（不入库，供核查）
```
