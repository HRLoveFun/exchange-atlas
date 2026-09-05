# 决策记录 DECISIONS

轻量 ADR。每条记「定了什么 / 为什么 / 何时」。改动前先看这里，避免把有意的取舍当成疏漏改掉。

**一条 ADR = 一个文件**，放在 `PROJECT/decisions/`，文件名即身份：

- **历史条目 `ADR-NNN.md`**（001–080）——数字编号已**冻结**，不再新增。
- **新条目 `ADR-<slug>.md`**——`<slug>` 是小写 kebab 主题词（如 `ADR-dev-automation.md`）。**不再取号、不再有台账、不再有合并前的定号步骤**：并行分支各写各的文件，git 层面无从冲突。

别的文档引用决策时只标 `[ADR-NNN]` 或 `[ADR-<slug>]`，不复述理由——理由的唯一权威在对应文件里。`make check` 校验每个引用都能解析到 `PROJECT/decisions/` 下的真实文件。

> ⚠️ **本文件的索引部分由 `make sync` 生成，不要手改。** 新增一条 ADR = 在 `PROJECT/decisions/` 新建一个文件，然后 `make sync`（见 `CLAUDE.md` §八）。

## ADR 索引（`make sync` 生成：历史条目按编号、新条目按日期）

<!-- BEGIN:GENERATED adr-index -->
- [ADR-001](decisions/ADR-001.md) · 2026-08-12 · 不沿用参考项目的 CSV 数据格式
- [ADR-002](decisions/ADR-002.md) · 2026-08-12 · YAML 权威 + JSON 派生，产物入库
- [ADR-003](decisions/ADR-003.md) · 2026-08-12 · 不设月度更新节奏，改用核实日期驱动
- [ADR-004](decisions/ADR-004.md) · 2026-08-12 · 横切切入：标杆交易所做全十一章，而非全量交易所做浅字段
- [ADR-005](decisions/ADR-005.md) · 2026-08-12 · 对比矩阵是默认首屏视图
- [ADR-006](decisions/ADR-006.md) · 2026-08-12 · UI 标签恒中英双语，与「数据语言模式」分离
- [ADR-007](decisions/ADR-007.md) · 2026-08-12 · 数据语言体系：纯中文 / 原语言两种模式
- [ADR-008](decisions/ADR-008.md) · 2026-08-12 · 不引入 MCP
- [ADR-009](decisions/ADR-009.md) · 2026-08-12 · v0.1/v0.2 标杆交易所选择
- [ADR-010](decisions/ADR-010.md) · 2026-08-13 · taxonomy.yml 章节划分：舍弃原大纲第一、十三章作为数据章节
- [ADR-011](decisions/ADR-011.md) · 2026-08-13 · 矩阵列不在 taxonomy 里单独维护，由字段级 `in_matrix` 标记派生
- [ADR-012](decisions/ADR-012.md) · 2026-08-13 · 列表型章节（产品体系、指数体系）使用轻量条目，不套完整事实信封
- [ADR-013](decisions/ADR-013.md) · 2026-08-13 · 数据语言体系简化为 zh/en 固定两态，取代 ADR-007
- [ADR-014](decisions/ADR-014.md) · 2026-08-14 · 矩阵维度组按实测填充率重新校准，不是拍脑袋定的
- [ADR-015](decisions/ADR-015.md) · 2026-08-14 · 时区甘特条的时段数据是构建期近似推导，不是新增的事实字段
- [ADR-016](decisions/ADR-016.md) · 2026-08-14 · v1.0 交易所候选清单与分波顺序
- [ADR-017](decisions/ADR-017.md) · 2026-08-14 · v1.0 执行模式：分波并行执行子代理 + 缩小单所抽检样本但维持通过率阈值
- [ADR-018](decisions/ADR-018.md) · 2026-08-14 · `review_system` 矩阵列的枚举覆盖率问题，定为 Wave 1 启动前必须解决的阻塞项
- [ADR-019](decisions/ADR-019.md) · 2026-08-17 · 市场结构增设 `derivatives` 子块表达同一实体的第二条产品线；指数体系增设 `scope` 区分交易所自身指数与跨交易所市场基准
- [ADR-020](decisions/ADR-020.md) · 2026-08-17 · `chapter_status()` 完成度分母排除完全未启用的 `optional` 字段组；空值率审计的分类结论
- [ADR-021](decisions/ADR-021.md) · 2026-08-18 · 9 家交易所衍生品市场机制批量补齐：执行结果与共享 worktree 并发写入的经验教训
- [ADR-022](decisions/ADR-022.md) · 2026-08-19 · 前端内容结构审查：矩阵列选取标准与章节/维度组排序
- [ADR-023](decisions/ADR-023.md) · 2026-08-19 · `review_system`/`delivery_method` 枚举重新设计：解决 `PROJECT/OPEN-QUESTIONS.md` 框架性问题第3条（已删除该条目）
- [ADR-024](decisions/ADR-024.md) · 2026-08-20 · 英文模式"中英夹杂"第一层修复：`en_required` 补机器强制校验 + 9 处违规字段补齐；补齐时的语言来源优先级
- [ADR-025](decisions/ADR-025.md) · 2026-08-20 · 前端可读性审查：矩阵工具栏去筛选项、时区午休独立配色、字号排版调整
- [ADR-026](decisions/ADR-026.md) · 2026-08-20 · `OPEN-QUESTIONS.md` 第45条方案②落地：英文模式区分"设计不需双语"与"真漏填"；`kr-krx` night_session 顶层字段订正
- [ADR-027](decisions/ADR-027.md) · 2026-08-21 · 六家交易所悬案批量清理：`sa-tadawul`/`kr-krx`/`tw-twse`/`ch-six`/`br-b3`/`fr-euronext`；`isolation: worktree` 在"因限额中断后经 SendMessage 恢复"路径上再次失效的证据
- [ADR-028](decisions/ADR-028.md) · 2026-08-21 · 下一阶段方向定为"深度优先"（Category B 数据深耕），并刷新 [ADR-020] 的字段清单与规模估计
- [ADR-029](decisions/ADR-029.md) · 2026-08-22 · PR #15（`worktree-category-b-planning`）合并冲突处理：并行分支 ADR 编号撞号，改用 merge 而非 rebase 解决
- [ADR-030](decisions/ADR-030.md) · 2026-08-22 · v1.1 前置事项解决：`clearing` 四个保证金/盯市字段的语义歧义，仿照 `delivery_method` 拆出 `clearing.derivatives.*` 镜像字段
- [ADR-031](decisions/ADR-031.md) · 2026-08-25 · v1.1 Batch 1（8 家）执行结果：Category B 数据补全 + 英文回填 + `sec.gov`/`finra.org` 反爬攻克；`isolation: worktree` 第三次复现失效及新发现
- [ADR-032](decisions/ADR-032.md) · 2026-08-27 · v1.1 Batch 3/3：verbatim-quote 反查机器化 + 引用来源全量落盘，固化为 `make check` 关卡
- [ADR-033](decisions/ADR-033.md) · 2026-08-29 · A1：防幻觉机器校验补完（第三方来源封顶 + 数值反查收紧 + 路径引用收窄 + spec 反查预埋）
- [ADR-034](decisions/ADR-034.md) · 2026-08-30 · A2：v1.1 尾巴收口（verify_quotes 走 expand / br-b3 裸串 source 归一 / 英文回填 #45 清零 / 61 CACHE_MISS 归零）
- [ADR-035](decisions/ADR-035.md) · 2026-08-30 · v2.0 Phase 0：范式转向（主视图=交易日平面图）+ `spec` 结构化层契约 + 零构建 / 诚实渲染 / 非现货降级
- [ADR-036](decisions/ADR-036.md) · 2026-08-30 · 积累的 schema 框架性问题批量裁定（Wave 3 前置）
- [ADR-037](decisions/ADR-037.md) · 2026-08-30 · Phase 1a：`spec` 层实装（sync/validate 接入）+ 第五章契约 + 5 家示范回填
- [ADR-038](decisions/ADR-038.md) · 2026-08-30 · Phase 1b（其一）：`matching_principle` 转 enum + `in-nse` 补入时区甘特条
- [ADR-039](decisions/ADR-039.md) · 2026-08-30 · Phase 1b（其二）：15 家第五章 `spec` 数据回填 + 全 20 家三个补充字段 + JPX 34 档全表
- [ADR-040](decisions/ADR-040.md) · 2026-08-30 · Phase 2：交易日平面图（v2.0 主视图落地）
- [ADR-041](decisions/ADR-041.md) · 2026-08-30 · 广度扩张（新增交易所，原 Wave 3 / Phase 4）从计划阶段改为按需可选能力
- [ADR-042](decisions/ADR-042.md) · 2026-08-30 · schema 对齐资深交易员心智模型：第五章补三字段 + 四个 spec 形状 + 覆盖边界显式化
- [ADR-043](decisions/ADR-043.md) · 2026-08-30 · Phase 3 首棒：[ADR-042] 第五章三字段 + 四个 spec 形状的 20 家回填
- [ADR-044](decisions/ADR-044.md) · 2026-08-30 · 修复：`.cache` 被误提交为符号链接，导致 `git pull` 静默抹掉本地来源快照
- [ADR-045](decisions/ADR-045.md) · 2026-08-30 · Phase 3 第二棒：成本瀑布的 spec 形状 + 20 家数据层回填（渲染层留交互式迭代）
- [ADR-046](decisions/ADR-046.md) · 2026-08-30 · 删除 `tier`（标杆批次）身份字段：交易所加入先后不是读者需要的信息
- [ADR-047](decisions/ADR-047.md) · 2026-08-30 · 成本瀑布渲染层首版：镜像双瀑布 SVG + 顶层 tab
- [ADR-048](decisions/ADR-048.md) · 2026-08-30 · Phase 3 第三棒：交割管线可视化的设计定案（双泳道 + 常驻违约瀑布 + `guarantee_model` 维度）
- [ADR-049](decisions/ADR-049.md) · 2026-08-31 · 英文版可用性修订：图形视图接语言开关 + `detail` 折叠降级 + UI 双语机器校验
- [ADR-050](decisions/ADR-050.md) · 2026-08-31 · Phase 3 第三棒（数据层）：交割管线的 `default_management.spec` 形状 + `guarantee_model` 枚举 + 20 家回填
- [ADR-051](decisions/ADR-051.md) · 2026-09-01 · Phase 3 第三棒（渲染层）：交割管线 `renderSettlementPipeline`（双泳道 + 常驻违约瀑布 + 顶层 tab）
- [ADR-052](decisions/ADR-052.md) · 2026-09-01 · `freshness.json` 不再落盘 `age_days`/`stale`，改由前端按访问日现算
- [ADR-053](decisions/ADR-053.md) · 2026-09-01 · 受控文档记录构建态数字时，只记取数方式不记快照数字
- [ADR-054](decisions/ADR-054.md) · 2026-09-01 · 成本瀑布 spec 层 103 条独立复核：`note` 数字、`type: none` 依据、时间性键是三个系统性缺口
- [ADR-055](decisions/ADR-055.md) · 市场机制剖面视觉迭代：机制核心面板（第五章七项事实收进主图中心的固定 foreignObject）+ 透视开关
- [ADR-056](decisions/ADR-056.md) · 2026-09-01 · 宪法（CLAUDE.md）审查与修订：v2.0 定位 / spec 层验收判据 / 可变性程序 / 两条交付纪律
- [ADR-057](decisions/ADR-057.md) · 2026-09-01 · 北极星：可视化模块终态合并为单页画布，其余视图降级到「更多」入口
- [ADR-058](decisions/ADR-058.md) · 2026-09-01 · `validate.py` 5b 增补 `spec.note` 数字反查（5c）：把「note 夹带数字」变成构建关卡
- [ADR-059](decisions/ADR-059.md) · 2026-09-02 · Phase 3 第四棒：上市生命周期剖面的设计定案 + 章节级 `only_spot` 标记 + 两段时长 spec
- [ADR-060](decisions/ADR-060.md) · 2026-09-03 · 数据空缺复核轨：`optional` / `not_applicable` 下沉到字段级 + 五任务分解
- [ADR-061](decisions/ADR-061.md) · 2026-09-03 · Phase 3 第五棒：监管图 Regulation Map 的设计定案 + 数据层评估（无需 spec）
- [ADR-062](decisions/ADR-062.md) · 2026-09-03 · 数据空缺复核轨任务一实装：leaf 级 `optional` / 字段级 `not_applicable` 机制 + A 桶标注；B/D 桶勘误回 F
- [ADR-063](decisions/ADR-063.md) · 2026-09-03 · 不变式纯函数的合成用例自检：`tools/selfcheck.py` 接入 `make check`
- [ADR-064](decisions/ADR-064.md) · 2026-09-04 · Phase 3 第六棒：参与者图 Participant Map 的设计定案 + 数据层评估（无需 spec）
- [ADR-065](decisions/ADR-065.md) · 成本瀑布数据层残差处理：`side` / `type: none` / 触发点残差逐条坐实
- [ADR-066](decisions/ADR-066.md) · 2026-09-04 · Phase 3 第七棒：风险旗标 Risk Flags 的设计定案 + 数据层评估（零 spec + 一次 `fx_risk_note` 就地清）
- [ADR-067](decisions/ADR-067.md) · 2026-09-04 · 成本瀑布数据层长尾：`type: none` 正面依据的结构性补齐 + cn 监管费现行标准
- [ADR-068](decisions/ADR-068.md) · 数据空缺复核轨任务二实装：横切 8 高频字段批量回填清零
- [ADR-069](decisions/ADR-069.md) · 2026-09-04 · 并行 worktree 防失序：ROADMAP §一 / ADR 编号 / 生成块 / 合并纪律四道护栏
- [ADR-070](decisions/ADR-070.md) · 2026-09-04 · 市场机制剖面视觉迭代：机制核心面板右缘避让收盘集合竞价竖条（[ADR-055] 已知局限②落地）
- [ADR-071](decisions/ADR-071.md) · 2026-09-04 · 成本瀑布迭代：佣金行降级为说明 + `cost_layer` 加 `rate_raw`（tw/za 证券交易税不再画幽灵条）
- [ADR-072](decisions/ADR-072.md) · 2026-09-04 · 前端不暴露 taxonomy 章序数，只用章节名 + 档案页 / ADR 链接
- [ADR-073](decisions/ADR-073.md) · 2026-09-04 · 市场机制剖面视觉迭代：零轴刻度改标参考价名称、删 y 轴标题与"0 = …"内嵌批注、临时停牌文案居中
- [ADR-074](decisions/ADR-074.md) · 2026-09-05 · 数据空缺复核轨任务二第二人独立复核：79 处，4 FIX + 3 QUESTION，零幻觉
- [ADR-075](decisions/ADR-075.md) · 2026-09-05 · 抓取基础设施：`fetch.py` OTP 两步 + wayback 回退 + `kr-krx`/`za-jse` 缓存重建（数据空缺复核轨任务五）
- [ADR-076](decisions/ADR-076.md) · 2026-09-05 · 并行 worktree 防撞号第二版：ADR 编号占位符 + 合并时自动定号
- [ADR-077](decisions/ADR-077.md) · 2026-09-05 · 来源文件下沉 + 把「靠自觉的约定」变成构建关卡
- [ADR-078](decisions/ADR-078.md) · 2026-09-05 · 数据空缺复核轨任务四执行方案：5 家旗舰所深度补全的字段级现状核实 + 按字段族批量回填设计
- [ADR-079](decisions/ADR-079.md) · 2026-09-05 · 数据空缺复核轨任务三执行方案：C 桶 40 处按「上次卡在哪」重排为五棒 + 三处范围裁定
- [ADR-080](decisions/ADR-080.md) · 2026-09-05 · 风险旗标数据子棒的落地方案：第 12 章 `*_note` 「制度核 / 分析尾」二分 + `fx_risk_note` 就地清作业规程
- [ADR-dev-automation](decisions/ADR-dev-automation.md) · 2026-09-05 · 开发流程自动化：CI 作合并关卡 + 一条 ADR 一个文件（编号与台账退役）
<!-- END:GENERATED adr-index -->
