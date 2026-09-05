# 资料来源地图 SOURCES

本项目**最高价值的资产**——查交易所规则最费时的不是读，是找到并抓到权威原始出处。查明一次「这份文件在哪、要怎么抓、多久改版」就要记下来，否则下次重查一遍。

`tools/fetch.py` 按来源分片登记的抓取方式取页；`tools/validate.py` 校验 `data/` 里引用的来源域名是否已在来源登记（本文件 + 分片）中。

**各交易所的来源记录已按所拆分到 `PROJECT/sources/<id>.md`**（文件名 = `data/exchanges/<id>.yml` 的 id，两侧一一对应、由 `make check` 强制）——来源记录是并发写入点，拆分让「多写者共写一个大文件」物理分离，单所经验/探测记录写进对应分片即可（[ADR-077]）。本文件只保留条目格式规范与跨所通用经验。

## 交易所来源分片索引（`make sync` 生成，不手改）

<!-- BEGIN:GENERATED sources-index -->
- `au-asx` 澳大利亚证券交易所 — [sources/au-asx.md](sources/au-asx.md)
- `br-b3` 巴西B3交易所 — [sources/br-b3.md](sources/br-b3.md)
- `ca-tsx` 多伦多证券交易所 — [sources/ca-tsx.md](sources/ca-tsx.md)
- `ch-six` 瑞士证券交易所 — [sources/ch-six.md](sources/ch-six.md)
- `cn-sse` 上海证券交易所 — [sources/cn-sse.md](sources/cn-sse.md)
- `cn-szse` 深圳证券交易所 — [sources/cn-szse.md](sources/cn-szse.md)
- `de-eurex` 欧洲期货交易所 — [sources/de-eurex.md](sources/de-eurex.md)
- `de-xetra` 法兰克福证券交易所 — [sources/de-xetra.md](sources/de-xetra.md)
- `fr-euronext` 泛欧交易所 — [sources/fr-euronext.md](sources/fr-euronext.md)
- `hk-hkex` 香港交易及结算所 — [sources/hk-hkex.md](sources/hk-hkex.md)
- `in-nse` 印度国家证券交易所 — [sources/in-nse.md](sources/in-nse.md)
- `jp-jpx` 东京证券交易所 — [sources/jp-jpx.md](sources/jp-jpx.md)
- `kr-krx` 韩国交易所 — [sources/kr-krx.md](sources/kr-krx.md)
- `sa-tadawul` 沙特交易所 — [sources/sa-tadawul.md](sources/sa-tadawul.md)
- `sg-sgx` 新加坡交易所 — [sources/sg-sgx.md](sources/sg-sgx.md)
- `tw-twse` 台湾证券交易所 — [sources/tw-twse.md](sources/tw-twse.md)
- `uk-lse` 伦敦证券交易所 — [sources/uk-lse.md](sources/uk-lse.md)
- `us-nasdaq` 纳斯达克证券交易所 — [sources/us-nasdaq.md](sources/us-nasdaq.md)
- `us-nyse` 纽约证券交易所 — [sources/us-nyse.md](sources/us-nyse.md)
- `za-jse` 约翰内斯堡证券交易所 — [sources/za-jse.md](sources/za-jse.md)
<!-- END:GENERATED sources-index -->

## 条目格式（供 `tools/fetch.py` 与 `validate.py` 解析，每家分片首行务必遵守）

```markdown
# 交易所中文名 English Name `<exchange-id>`
- `域名` | 官方/监管/第三方 | 语言 | 抓取备注 | 内容备注
  - 具体页面标题: URL
```

分片文件名（= 首行反引号包裹的 `<exchange-id>`）必须与 `data/exchanges/<exchange-id>.yml` 的文件名一致——`make fetch EX=<exchange-id>` 直接读 `PROJECT/sources/<exchange-id>.md`，抓取其中所有 URL。

抓取备注写清楚：要不要自定义 UA、WebFetch 能不能用、是 HTML 还是 PDF、要不要多跳导航、改版周期、译本滞后情况。

## 经验：来源 URL 要精确到信息页，不要停在网站首页

v0.1 人工抽检（2026-08-13）时发现的一条通用问题：个别字段的 `sources[].url` 只写到网站首页（如
`https://www.hkex.com.hk/`），而不是真正承载该条事实的具体页面。首页几乎不构成对具体数值/条款的
独立证据——它只能证明"这是官方域名"，证明不了"这个数字/条款真是官方说的"。

**要求：** 每条 `sources` 尽量精确到能让人（或下次核实的 AI）不用搜索就直接看到该事实原文的页面
或 PDF；确实找不到更具体页面的（如仅用于确认机构名称/域名归属这类不需要逐条溯源的场景），要在
`title` 里写明这一点是有意为之（例如"仅用于确认域名归属"），不要让人误以为首页是原文出处。
`csrc.gov.cn` 一节已按这个约定标注；已知还有 2-3 处历史字段未达标，见
`PROJECT/OPEN-QUESTIONS.md`。

## 经验：「XXXX年修订」式规则文档 URL 会随修订版本更迭直接下线，不保留旧版直链

`cn-szse` 建档时踩到的坑：上一轮子代理登记 SOURCES.md 时记录的是《深圳证券交易所股票上市规则
（**2025年**修订）》与《深圳证券交易所创业板股票上市规则（**2025年**修订）》两个 PDF 直链，
`make fetch` 时两条都返回 404。原因不是链接抄错或反爬，是深交所在两轮抓取之间（2026年4月）
发布了**2026年修订版**并直接下线了 2025 版 PDF 的原文件（`docs.static.szse.cn` 不保留历史
版本的旧直链，替换是静默的、无跳转、无 301）。WebSearch 重新定位到新版 URL 后才抓到。

**教训**：
1. 任何标题带「XXXX年修订」字样的中国交易所/监管规则 PDF，只要登记 URL 与实际抓取之间隔了
   一段时间（哪怕只是几周），都要有心理预期该文件可能已被更新版本静默替换下线——`make fetch`
   遇到 404 时，第一反应不该是"链接错了"，而应该是"先 WebSearch 一下同名文件是否出了新修订版"。
   `深圳证券交易所交易规则` 本身也在 2026-07-06 生效了新版（第17次修订），本节其余条目登记的
   URL 均为本次会话当场验证过的最新版，但下次会话抓取前仍应重新探测一遍，不要假设去年验证过
   的 URL 依然有效。
2. 这类文档的正文最后一条附则通常会自报"自 XXXX 年 X 月 X 日起施行，本所于 XXXX 年 X 月 X 日
   发布的《……（XXXX年修订）》同时废止"——这是判断当前抓到的是不是最新有效版本最快的办法，
   不用去查改版历史页。
3. 与本条相对：`.pdf` 文件名里的哈希片段（如 `W020260424747613955674`）本身不随内容变化，
   同一次修订发布后的直链是稳定的，会失效的只是"旧修订版对应的旧哈希文件被整个撤下"，不是
   "同一文件的 URL 会漂移"——两种失效原因分开判断，遇到 404 先假设是第一种（更常见）。

---

## 经验：WebSearch 命中的独立 PDF 可能是过期存档，规则数字变动过的字段务必交叉核对

补全 `hk-hkex` 主板/GEM 上市财务门槛时（2026-08-17）踩到的坑：WebSearch 命中的
`cn-rules.hkex.com.hk` 中文版《上市规则》第八章单行本 PDF（`HKEXCN_TC_5088_VER2598.pdf`）
抓下来后，「盈利测试」门槛显示为 2,000万／3,000万港元——但同一天抓取的英文版 Chapter 8 PDF
（`en-rules.hkex.com.hk`）显示 3,500万／4,500万港元。两者本应是同一条规则的中英对照，数字却对不上，
一查才发现主板盈利测试门槛在 2022-01-01 生效的规则修订中从 20/30 上调到 35/45（第三方法律简报可
交叉确认这个日期，`confidence` 只能标 medium），说明搜索引擎索引到的是**修订前的旧版存档 PDF**，
文件本身返回 HTTP 200、看起来"抓到了"，但内容已经不是现行规则——**HTTP 200 不等于内容是现行版本**，
尤其是规则数值这类会随时间修订的字段。

**做法**：交易所规则手册站点如果有「整章合并显示」页面（如本例 `entiresection/<id>`，服务端渲染、
非独立托管 PDF、由规则手册导航体系直接生成），比孤立的单章 PDF 更可能反映当前生效版本，值得优先
用来交叉核对数字，尤其是官方文档本身没有清楚标注修订日期/版本号的情况下。**能拿到官方双语版本的
交易所，中英文数字应该逐字对得上——对不上是信号，不是噪音，一定要停下来查清楚哪个版本过期，不能
两个数字里随便选一个填。**

---

## 经验：`.cache/` 突然全空 / 全 CACHE_MISS，先查是不是 `git pull` 把它删了

2026-08-30 发现（[ADR-044]）：`verify_quotes` 从 `OK=1071` 一夜变成 `OK=0 / CACHE_MISS=1071`，
`.cache/` 目录整个消失。根因不是抓取失效，是 **git 的一个隐蔽行为**——

`.gitignore` 里写 `.cache/`（带斜杠）时，一个**同名的 tracked 文件/符号链接** `.cache` 不被这条规则
挡住。一旦某次提交误把 `.cache` 软链（worktree 里为复用主 checkout 缓存手建的那种）`git add` 进去，
之后任何人 `git pull` / `git checkout` 到该提交时，git 为了在 `.cache` 这个位置放下那个 tracked 软链，
会**静默删除**位置上原有的、被 `.gitignore` 忽略的 `.cache/` 目录（忽略文件在 checkout 时可被覆盖，
git 不报错、不提示）。本地几百上千份来源快照就这么没了。

**排查顺序**：① `git log --oneline -- .cache` 看有没有它的提交记录（正常应该没有，它全程 gitignore）；
② `ls -la .cache` 看是不是变成了符号链接。**修复**：`git rm --cached .cache && rm .cache`，把
`.gitignore` 的 `.cache/` 改成 `.cache`（无斜杠，连软链一起挡），再 `python3 tools/fetch_sources.py`
全量重建。**预防**：worktree 里绝不 `git add .cache`；提交前 `git status` 扫一眼有没有 `.cache` 冒出来。

---

## 经验：`fetch_sources.py` 全量重跑会用「抓取失败页」覆盖已有好缓存，制造 `verify_quotes` 假 FAIL

2026-08-30 一个后台任务里踩到：`make check` 本来 `verify_quotes OK=993 FAIL=0`，跑了一次
`python3 tools/fetch_sources.py` 重建 `.cache/` 之后变成 `OK=1000 FAIL=64`，`make check` 直接
非零退出。64 个 FAIL **全部集中在 `za-jse` 一家**。

**根因**：`fetch_sources.py` 会 re-fetch `data/` 里登记的**所有** `sources` URL 并覆盖
`.cache/<id>/`。这次运行环境对 `jse.co.za` 三个子域名全部拿到 Cloudflare「Access Denied」403
（响应体仍是一个 ~170KB 的 HTML 页，不是网络错误），对多个 PDF 拿到 ~6KB 的错误页存成 `.pdf`
（伴随 `.txt` 为 0 字节）。这些「坏正文」把 `za-jse` 建档时抓到的好快照整个盖掉了，`verify_quotes`
拿坏正文去比对 `quote` 当然一个连续窗口都命中不了 → 报 **FAIL**（不是 CACHE_MISS）。

**CACHE_MISS vs 这种 FAIL**：CACHE_MISS = 这条来源从没抓到过，信息性、不阻断（[ADR-044] 后
`.cache/` 重建期间的正常状态）；这里是「抓到了一个拦截页 / 壳页」被当成「来源正文可取到但
quote 不在里面」，落进 FAIL 桶，会让 `make check` 变红。

**排查顺序**：① 看 FAIL 是否**高度集中在一两家** + 这些家的来源域名是否同源（同一个官网）；
② `curl -sS -o /dev/null -w '%{http_code}'` 手测那几个域名，确认是不是这次环境访问不到；
③ 看 `fetch_sources.py` 自己末行报的 `OK=/FAIL=` 比例——FAIL 占比高（这次是 `OK=16 FAIL=55`）
说明这次抓取整体不可信，别拿它的 `.cache` 覆盖结果当真。

**补救**：把受影响那几家的 `.cache/<id>/` 整个删掉（`rm -rf .cache/<id>`），`verify_quotes`
会把它们的来源重新记为 CACHE_MISS，`make check` 恢复退出 0；等换到能正常访问该官网的环境
（住宅 IP 通常比数据中心 IP 少遇 Cloudflare 拦截）再 `python3 tools/fetch_sources.py` 重抓。
`data/` 不受影响——这纯粹是本地核查凭据的临时退化。

**预防**：`fetch_sources.py` 跑完先扫一眼它报的成功率；成功率低时先查是不是这次网络环境的问题，
不要立刻相信新的 `.cache/` 状态。

---

## 探测记录（v0.0 可达性探针，2026-08-12）

上述五家标杆逐一测试：WebSearch 定位官方页均准确命中；WebFetch 直接抓取在 SSE 规则总览页与 JPX 值幅制限页均遇 403，换用 `curl` + 常规浏览器 UA 后全部转为 200。**结论：本项目的抓取一律走 `tools/fetch.py`（curl 封装），不要用 WebFetch 直连交易所官网。** 尚未遇到强反爬到 curl 也过不去、或只有付费规则库/扫描件 PDF 的情况——五家标杆全部可达，`CLAUDE.md` §三的降级方案暂未被触发。

## 查证经验（成本瀑布 spec 核查，2026-09，[ADR-054]）

本次为离线 spec-vs-quote 比对，未新增抓取；记三条判断「某市场是否征收某税费」时的来源取舍经验：

- **交易所费率页只能证明「交易所收什么」，不能证明「市场不征什么」。** 它不覆盖国家税制（印花税 / FTT / 监管征费都由税务局 / 立法机构定）。「费率页没列」≠「不征收」——本次 31 个 `type: none` 里 13 个因此降级。正面依据要去税法原文、税务局说明页或立法机构文档找（过了的三家正是这类：`de-xetra` 的 Bundestag 废止条文、`sg-sgx` 的 IRAS 豁免规则页、`jp-jpx` 的 MOF 税改纲要）。
- **第三方「国别税费综述」只在其主题范围内有效。** CEPR 的 FTT 国别清单支撑得了「无 FTT」（它就是干这个的），支撑不了「无监管费」；IRAS 的 GST 税率页支撑得了「券商服务费适用 9% GST」，支撑不了「无按笔征费」。来源主题与断言错配，比没有来源更危险——它看起来有据。
- **含税率的官方页常是 JS 渲染或图像型 PDF（sgx.com 主站 SPA、ASX/JSE 价目 PDF），而「不征」类断言的来源反而多为静态 HTML 立法/税局页。** 后者用 `make fetch` 常规 curl 即可落盘，坐实降级点的成本不高，见 OPEN-QUESTIONS 的清单。
