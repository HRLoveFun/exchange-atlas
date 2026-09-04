/* exchange-atlas 前端 — 零依赖 vanilla JS
 * 数据源：docs/data/*.json（由 tools/sync.py 从 schema/ + data/ 生成，见 CLAUDE.md）
 * 路由：hash 驱动，#view=matrix|exchange|health
 * 两个全局开关（存 localStorage）：
 *   - 数据语言模式：zh（中文）⇄ en（英文）—— 只影响数据值，UI 标签恒双语。
 *     哪个是原文锚点由各交易所的 source_lang 决定（见 DECISIONS.md ADR-013），
 *     前端不关心这个区分，两个模式都是直接读字段，谁在谁不在由数据决定。
 *   - 明暗主题
 */
(function () {
  "use strict";

  var DATA_BASE = "data/";
  var savedLang = localStorage.getItem("ea-lang");
  var state = {
    theme: localStorage.getItem("ea-theme") || "system",
    // 旧版本用过 "native" 这个值（迁移前的原语言模式），localStorage 里可能还残留；
    // 不识别的值一律归一成 "zh"，避免切换按钮显示与实际内容对不上。
    langMode: savedLang === "zh" || savedLang === "en" ? savedLang : "zh",
  };
  var cache = { exchanges: {} };

  // ── 小工具 ──
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // age_days/stale 现算（见 ADR-052）：freshness.json 只带 verified/volatility 这两个
  // 建库事实，age_days/stale 是「今天」的派生值，在访客本地按访问日现算，不用构建
  // 那天冻结在产物里的值——否则站点的过期标记会在两次 make sync 之间失真。
  function daysSince(isoDate) {
    var today = new Date();
    var todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate));
    if (!m) return null;
    var verifiedUTC = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return Math.round((todayUTC - verifiedUTC) / 86400000);
  }
  function applyStaleness(rows, volatilityMonths) {
    rows.forEach(function (f) {
      var ageDays = f.verified ? daysSince(f.verified) : null;
      f.age_days = ageDays;
      f.stale = ageDays == null ? true : ageDays > (volatilityMonths[f.volatility] || 12) * 30;
    });
    return rows;
  }
  function getByPath(obj, pathStr) {
    return pathStr.split(".").reduce(function (o, k) {
      return o && typeof o === "object" ? o[k] : undefined;
    }, obj);
  }
  function fetchJSON(path) {
    return fetch(DATA_BASE + path).then(function (res) {
      if (!res.ok) throw new Error(path + " (" + res.status + ")");
      return res.json();
    });
  }
  function enumLabel(enumRef, enumId) {
    var table = cache.enums && cache.enums[enumRef];
    if (!table || enumId == null) return enumId || "";
    var v = table.values.filter(function (x) { return x.id === enumId; })[0];
    return v ? v.label_zh : enumId;
  }
  function enumLabelEn(enumRef, enumId) {
    var table = cache.enums && cache.enums[enumRef];
    if (!table || enumId == null) return "";
    var v = table.values.filter(function (x) { return x.id === enumId; })[0];
    return v ? v.label_en : "";
  }
  // enumLabel/enumLabelEn 是取值原语，UI 标签（如地区筛选下拉框、档案页头部标签）
  // 恒双语显示时两个都会被用到，不受语言模式影响，符合 ADR-006。但矩阵格子、
  // 字段卡片、列表条目里展示的是"数据值"而不是"UI 标签"，要跟 displayValue() 一样
  // 服从 state.langMode——用这个函数代替裸调用 enumLabel()。
  function enumDisplay(enumRef, enumId) {
    if (state.langMode === "en") {
      var en = enumLabelEn(enumRef, enumId);
      if (en) return en;
    }
    return enumLabel(enumRef, enumId);
  }
  function nativeText(native) {
    if (!native) return "";
    if (typeof native === "object") return Object.keys(native).map(function (k) { return native[k]; }).filter(Boolean).join(" / ");
    return native;
  }
  function displayValue(env) {
    if (!env) return "";
    if (state.langMode === "en" && env.en) return env.en;
    return env.zh || "";
  }
  // displayValue 的「允许空」变体：拼进 tooltip / 条件判断时要的是 undefined 而不是 ""
  function dv(env) {
    if (!env) return undefined;
    if (state.langMode === "en" && env.en) return env.en;
    return env.zh;
  }
  // 区分"这个字段设计上不要求双语（数字/日期类），回退显示中文是正常状态"与
  // "en_required 字段真漏填"——后者现在由 validate.py 机器校验拦截，不会出现
  // 在已发布数据里；前端只需要在英文模式下把回退显示的中文标出来，别让读者
  // 误以为是漏译（见 OPEN-QUESTIONS.md 框架性问题第45条）。enum 字段不受影响：
  // 它们的双语标签来自 enums.yml，走 enumDisplay，不经过这里。
  function isZhFallback(env, hasEnumRef) {
    return state.langMode === "en" && !hasEnumRef && !!(env && env.zh && !env.en);
  }
  // 交易所显示名——同样是"数据值"，要服从 langMode。name_native 是 {语言代码: 名称}
  // 对象，只有当 en 是其中一个键时才有真正的英文名（如 us-nyse/jp-jpx/de-eurex/hk-hkex）；
  // 没有（如 cn-sse 目前只有 zh-Hans）就诚实回退 name_zh，不臆造英文名。
  function exchangeDisplayName(identity) {
    if (!identity) return "";
    if (state.langMode === "en") {
      var en = identity.name_native && identity.name_native.en;
      if (en) return en;
    }
    return identity.name_zh || "";
  }
  function isStale(exchangeId, fieldPath) {
    return cache.staleSet && cache.staleSet.has(exchangeId + "|" + fieldPath);
  }
  function confBadgeClass(c) {
    return c === "high" ? "badge-high" : c === "medium" ? "badge-medium" : "badge-low";
  }
  function confLabel(c) {
    return c === "high" ? "高 High" : c === "medium" ? "中 Medium" : c === "low" ? "低 Low" : "—";
  }

  // ── 中文分析注记的诚实降级（方案 B ③，见 ADR-049）──
  // 全库 ~1000 段 `detail` 与 `spec` 里的 note 类键都是自己写的中文分析散文，
  // 短期不可能全量翻译（翻译漂移风险高、每新增字段多一份长期负担），也不该在
  // 英文模式下与英文正文混排。沿用 [ADR-026]「加视觉标记、不改数据可见性」的
  // 哲学：英文模式收进默认折叠的小块，标清楚「这是中文分析注记，不是译文缺失」，
  // 点开仍是原文。中文模式逐字不变。
  var ZH_NOTE_SUMMARY = "Analyst note (Chinese) ▾";
  function zhNoteBlock(inner) {
    if (state.langMode !== "en") return inner;
    return '<details class="zh-note"><summary>' + ZH_NOTE_SUMMARY + "</summary>" + inner + "</details>";
  }
  // spec 里 key 以 note 结尾的（note / full_table_note / margin_note / *_note）
  // 都是成句中文，从 JSON dump 里摘出来单独按 detail 同样的方式处理。
  function splitSpecNotes(spec) {
    var notes = {}, rest = {};
    Object.keys(spec || {}).forEach(function (k) {
      if (/note$/i.test(k) && typeof spec[k] === "string") notes[k] = spec[k];
      else rest[k] = spec[k];
    });
    return { notes: notes, rest: rest };
  }

  // ── UI 文案的两种形态（[ADR-006] 边界细化，见 ADR-049）──
  //   短标签（表头 / 下拉框 / 筛选器 / 状态徽章）→ 恒双语 "中文 English"，调用处直接写字面量。
  //   图形视图的合成语句 / 轴名 / 图例 / banner / 说明段 → 跟随语言开关，走 t()。
  //   理由：中心信息卡、说明段这类长句若也恒双语并列会挤爆版面；而带数字的合
  //   成语句（墙标注、中心卡）本就与 displayValue() 同理，该跟随 langMode。
  function t(zh, en) { return state.langMode === "en" ? en : zh; }
  // 集中的中文字典（时段类型 / 回转制度 / 费种）改 {zh, en} 结构后按 key 取值
  function tSel(dict, key) {
    var e = dict == null ? null : dict[key];
    if (e == null) return key;
    return state.langMode === "en" ? (e.en || e.zh) : e.zh;
  }
  // "字段：内容" 里的分隔符——en 模式用 ASCII 冒号 + 空格
  function sep() { return state.langMode === "en" ? ": " : "："; } // i18n-exempt：本函数就是分隔符的 i18n 本体
  // 字段标签按 chapter + path 查 taxonomy 的 label_zh / label_en。
  // chip 名因此不再手写第二份英文，消除「同一标签两处手写」（CLAUDE.md §一），
  // 也顺带保证了「同一个字段在档案页和剖面 chip 上叫同一个名字」。
  // 极少数例外：taxonomy 建库时把字段挂在分组下（如 price_limits → type），
  // build.py 扁平化时只留叶子，组名进不了 docs/data/taxonomy.json，
  // 于是标签只剩「类型 / Type」——脱离分组上下文就不知所云，只能在这里兜一层。
  var LABEL_OVERRIDE = {
    "market_structure:price_limits.type": { zh: "价格限制类型", en: "Price Limit Type" }
  };
  function fieldLabel(chapterId, path) {
    var ov = LABEL_OVERRIDE[chapterId + ":" + path];
    if (ov) return state.langMode === "en" ? ov.en : ov.zh;
    var ch = (cache.taxonomy.chapters || []).filter(function (c) { return c.id === chapterId; })[0];
    var f = ch && (ch.fields || []).filter(function (x) { return x.path === path; })[0];
    if (!f) return path;
    return state.langMode === "en" ? (f.label_en || f.label_zh) : f.label_zh;
  }

  // ── hash 路由 ──
  function parseHash() {
    var h = location.hash.replace(/^#/, "");
    var params = new URLSearchParams(h);
    var out = {};
    params.forEach(function (v, k) { out[k] = v; });
    return out;
  }
  function setHash(params, replace) {
    var usp = new URLSearchParams(params);
    var newHash = "#" + usp.toString();
    if (replace) history.replaceState(null, "", newHash);
    else location.hash = newHash;
  }

  // ── 数据加载 ──
  function loadCore() {
    return Promise.all([
      fetchJSON("manifest.json"),
      fetchJSON("taxonomy.json"),
      fetchJSON("matrix.json"),
      fetchJSON("freshness.json"),
      fetchJSON("enums.json"),
    ]).then(function (r) {
      cache.manifest = r[0];
      cache.taxonomy = r[1];
      cache.matrix = r[2].cells;
      cache.freshness = applyStaleness(r[3].fields, cache.manifest.volatility_months || {});
      cache.enums = r[4];
      cache.staleSet = new Set(
        cache.freshness.filter(function (f) { return f.stale; }).map(function (f) { return f.exchange_id + "|" + f.field_path; })
      );
      cache.exchangeById = {};
      cache.manifest.exchanges.forEach(function (e) { cache.exchangeById[e.id] = e; });
    });
  }
  function loadExchange(id) {
    if (cache.exchanges[id]) return Promise.resolve(cache.exchanges[id]);
    return fetchJSON("exchanges/" + id + ".json").then(function (d) {
      cache.exchanges[id] = d;
      return d;
    });
  }

  // ══════════════════════════════════════════════
  // 矩阵视图
  // ══════════════════════════════════════════════
  function renderMatrix(app, params) {
    var groups = cache.taxonomy.dimension_groups;
    var activeGroup = groups.some(function (g) { return g.id === params.group; }) ? params.group : groups[0].id;
    var region = params.region || "all";

    var columns = [];
    cache.taxonomy.chapters.forEach(function (ch) {
      if (ch.kind === "list") return;
      (ch.fields || []).forEach(function (f) {
        if (f.in_matrix === activeGroup) columns.push(Object.assign({ chapter: ch.id }, f));
      });
    });

    var regions = Array.from(new Set(cache.manifest.exchanges.map(function (e) { return e.region; })));
    var exchanges = cache.manifest.exchanges.slice();
    if (region !== "all") exchanges = exchanges.filter(function (e) { return e.region === region; });

    var cellIndex = {};
    cache.matrix.forEach(function (c) { cellIndex[c.exchange_id + "|" + c.field_path] = c; });

    var html = "";
    html += '<div class="view-toolbar">';
    html += '<label for="regionFilter">地区 Region</label>';
    html += '<select id="regionFilter" data-role="region">';
    html += '<option value="all"' + (region === "all" ? " selected" : "") + ">全部 All</option>";
    regions.forEach(function (r) {
      html += '<option value="' + esc(r) + '"' + (region === r ? " selected" : "") + ">" + esc(enumLabel("region", r)) + " " + esc(enumLabelEn("region", r)) + "</option>";
    });
    html += "</select>";
    html += "</div>";

    html += '<div class="group-tabs">';
    groups.forEach(function (g) {
      html += '<button type="button" class="group-tab' + (g.id === activeGroup ? " active" : "") + '" data-role="group" data-group="' + esc(g.id) + '">' +
        esc(g.label_zh) + ' <span style="opacity:.65">' + esc(g.label_en) + "</span></button>";
    });
    html += "</div>";

    if (!exchanges.length) {
      html += '<p style="color:var(--fg-muted)">' + t("没有符合条件的交易所。", "No exchanges match the current filters.") + "</p>";
    } else if (!columns.length) {
      html += '<p style="color:var(--fg-muted)">' +
        t("该维度组下暂无矩阵列（taxonomy.yml 里还没有字段标记 in_matrix: " + activeGroup + "）。",
          "No matrix columns under this dimension group yet (no field in taxonomy.yml is tagged in_matrix: " + activeGroup + ").") + "</p>";
    } else {
      html += '<div class="matrix-scroll"><table class="matrix"><thead><tr>';
      html += '<th class="col-exchange">交易所<span class="th-label-en">Exchange</span></th>';
      columns.forEach(function (col) {
        html += "<th><span class=\"th-label-zh\">" + esc(col.label_zh) + "</span><span class=\"th-label-en\">" + esc(col.label_en) + "</span></th>";
      });
      html += "</tr></thead><tbody>";

      exchanges.forEach(function (ex) {
        html += "<tr>";
        html += '<td class="col-exchange"><a class="exchange-link" href="#view=exchange&id=' + esc(ex.id) + '" data-role="goto-exchange" data-id="' + esc(ex.id) + '">' +
          esc(exchangeDisplayName(ex)) + "</a><span class=\"exchange-region\">" + esc(enumDisplay("region", ex.region)) + "</span></td>";
        columns.forEach(function (col) {
          var cell = cellIndex[ex.id + "|" + col.path];
          if (!cell) {
            html += '<td><span class="cell-btn empty">—</span></td>';
            return;
          }
          var label = col.enum_ref && cell.enum ? enumDisplay(col.enum_ref, cell.enum) : displayValue(cell);
          var stale = isStale(ex.id, col.path);
          var lowConf = cell.confidence === "low";
          var zhFallback = isZhFallback(cell, !!col.enum_ref);
          html += '<td><button type="button" class="cell-btn' + (lowConf ? " low-conf" : "") + '" data-role="cell" data-exchange="' + esc(ex.id) +
            '" data-path="' + esc(col.path) + '" data-chapter="' + esc(col.chapter) + '">' + esc(label || t("（空）", "(empty)")) +
            (zhFallback ? '<span class="zh-tag" title="该字段未要求双语，此处为中文原文 ZH source, not translated">中</span>' : "") +
            (stale ? '<span class="stale-dot" title="待复核 Stale"></span>' : "") + "</button></td>";
        });
        html += "</tr>";
      });
      html += "</tbody></table></div>";
    }

    app.innerHTML = html;
  }

  // ══════════════════════════════════════════════
  // 单所档案视图
  // ══════════════════════════════════════════════
  function renderExchange(app, params) {
    var id = params.id;
    var identity = cache.exchangeById[id];
    if (!identity) {
      app.innerHTML = '<p style="color:var(--danger)">' + t("找不到交易所 `", "Exchange not found: `") + esc(id) + t("`。", "`.") + "</p>";
      return Promise.resolve();
    }
    app.innerHTML = '<div class="loading">' + t("加载 ", "Loading profile for ") + esc(exchangeDisplayName(identity)) + "…</div>";
    return loadExchange(id).then(function (data) {
      var chapters = cache.taxonomy.chapters;
      var defaultCh = cache.taxonomy.default_chapter;
      if (!chapters.some(function (c) { return c.id === defaultCh; })) defaultCh = chapters[0].id;
      var activeCh = chapters.some(function (c) { return c.id === params.ch; }) ? params.ch : defaultCh;
      var chDef = chapters.filter(function (c) { return c.id === activeCh; })[0];

      var html = "";
      html += '<div class="archive-header">';
      html += "<h2>" + esc(exchangeDisplayName(identity)) + "</h2>";
      html += '<span class="native-name">' + esc(nativeText(identity.name_native)) + "</span>";
      html += '<div class="archive-meta">';
      html += "<span>" + esc(enumLabel("region", identity.region)) + " " + esc(enumLabelEn("region", identity.region)) + "</span>";
      html += "<span>" + esc(identity.official_languages.join(", ")) + "</span>";
      if (identity.group_id) html += "<span>集团 Group: " + esc(identity.group_id) + "</span>";
      html += "</div></div>";

      html += '<div class="archive-layout"><nav class="archive-nav">';
      chapters.forEach(function (c) {
        html += '<button type="button" class="' + (c.id === activeCh ? "active" : "") + '" data-role="goto-chapter" data-ch="' + esc(c.id) + '">' +
          esc(c.chapter_no) + ". " + esc(c.label_zh) + "<br><span style=\"font-size:10.5px;opacity:.65\">" + esc(c.label_en) + "</span></button>";
      });
      html += "</nav>";

      html += '<div class="archive-main">';
      var chapterData = data.chapters[activeCh];
      if (chDef.kind === "list") {
        html += renderListChapter(chDef, chapterData);
      } else {
        html += renderObjectChapter(chDef, chapterData, identity.id);
      }
      html += "</div></div>";

      app.innerHTML = html;
    }).catch(function (e) {
      app.innerHTML = '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  // itemFields: [{id, label_zh, label_en, enum_ref}]，items: [{...}]。
  // 供顶层列表章节（products/indices）与 object 章节里嵌套的 list 字段
  // （如 listing.boards）共用——两者的行数据形状一致，都是轻量条目，不是事实信封。
  function renderItemsTable(itemFields, items) {
    if (!items || !items.length) return '<p style="color:var(--fg-muted)">' + t("暂无数据。", "No data yet.") + "</p>";
    var html = '<div style="overflow-x:auto"><table class="list-table"><thead><tr>';
    itemFields.forEach(function (f) { html += "<th>" + esc(f.label_zh) + "<br><span style=\"opacity:.6;font-weight:400\">" + esc(f.label_en) + "</span></th>"; });
    html += "</tr></thead><tbody>";
    items.forEach(function (item) {
      html += "<tr>";
      itemFields.forEach(function (f) {
        var raw = item[f.id];
        var text = f.enum_ref && raw ? enumDisplay(f.enum_ref, raw) : raw;
        html += "<td>" + esc(text == null ? "" : text) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    return html;
  }

  function renderListChapter(chDef, chapterData) {
    return renderItemsTable(chDef.fields || [], (chapterData && chapterData.items) || []);
  }

  function renderObjectChapter(chDef, chapterData, exchangeId) {
    var fields = chDef.fields || [];
    if (!fields.length) return '<p style="color:var(--fg-muted)">' + t("本章节暂无字段定义。", "No field definitions for this chapter yet.") + "</p>";
    // 章节级不适用（only_spot + _meta.not_applicable，ADR-036 #5 / ADR-059）：折叠为一行说明，
    // 不逐字段渲染空信封。目前仅纯衍生品所（de-eurex）的「上市」章。
    if (chapterData && chapterData._meta && chapterData._meta.not_applicable) {
      return '<div class="field-card"><div class="field-label">' + esc(chDef.label_zh) + " · " + esc(chDef.label_en) + "</div>" +
        '<p style="color:var(--fg-muted);margin:0">' + t(
          "本所为衍生品交易所，不上市公司——本章整章不适用（<code>_meta.not_applicable</code>，见 ADR-036 #5 / ADR-059）。对应概念是交易员准入（见「市场参与者」）与合约挂牌 / 到期（见「产品体系」「清算、结算与交割」）。",
          "This is a derivatives exchange and does not list corporations — the whole chapter is not applicable (<code>_meta.not_applicable</code>; see ADR-036 #5 / ADR-059). The analogous concepts are trader admission (see “Market Participants”) and contract listing / expiry (see “Products”, “Clearing, Settlement & Delivery”).") +
        "</p></div>";
    }
    var html = "";
    fields.forEach(function (f) {
      if (f.kind === "list") {
        var nestedItems = getByPath(chapterData, f.path) || [];
        html += '<div class="field-card">';
        html += '<div class="field-label">' + esc(f.label_zh) + " · " + esc(f.label_en) + "</div>";
        html += renderItemsTable(f.item_schema || [], nestedItems);
        html += "</div>";
        return;
      }
      var env = getByPath(chapterData, f.path);
      var hasValue = env && env.zh;
      var value = f.enum_ref && env && env.enum ? enumDisplay(f.enum_ref, env.enum) : displayValue(env);
      var zhFallback = isZhFallback(env, !!f.enum_ref);
      html += '<div class="field-card">';
      html += '<div class="field-label">' + esc(f.label_zh) + " · " + esc(f.label_en) + "</div>";
      html += '<div class="field-value' + (hasValue ? "" : " empty") + '">' + esc(hasValue ? value : t("（暂缺，见 OPEN-QUESTIONS）", "(missing, see OPEN-QUESTIONS)")) +
        (zhFallback ? ' <span class="zh-fallback-note" title="该字段未要求双语，此处为中文原文 ZH source, not translated">（中文原文）</span>' : "") + "</div>";
      if (env && env.detail) {
        html += zhNoteBlock('<div class="field-detail">' + esc(env.detail) + "</div>");
      }
      if (hasValue) {
        html += '<div class="field-foot">';
        if (env.confidence) html += '<span class="badge ' + confBadgeClass(env.confidence) + '">' + confLabel(env.confidence) + "</span>";
        if (env.verified) html += '<span style="font-size:11.5px;color:var(--fg-faint)">' + t("核实于 ", "Verified ") + esc(env.verified) + "</span>";
        if (isStale(exchangeId, f.path)) html += '<span style="font-size:11.5px;color:var(--warn)">' + t("● 待复核", "● Stale") + "</span>";
        if (env.quote || (env.sources && env.sources.length)) {
          html += '<button type="button" class="action-btn" data-role="cell" data-exchange="' + esc(exchangeId) +
            '" data-path="' + esc(f.path) + '" data-chapter="' + esc(chDef.id) + '" style="margin-left:auto">查看出处 Sources</button>';
        }
        html += "</div>";
      }
      html += "</div>";
    });
    return html;
  }

  // ══════════════════════════════════════════════
  // 数据健康度视图
  // ══════════════════════════════════════════════
  function renderHealth(app, params) {
    var exFilter = params.hex || "all";
    var typeFilter = params.htype || "stale";

    var total = cache.freshness.length;
    var stale = cache.freshness.filter(function (f) { return f.stale; });
    var lowConf = cache.freshness.filter(function (f) { return f.confidence === "low"; });

    var html = "";
    html += '<div class="health-summary">';
    html += statTile(total, "已填字段 Filled Fields");
    html += statTile(stale.length, "待复核 Stale");
    html += statTile(lowConf.length, "低置信度 Low Confidence");
    html += statTile(cache.manifest.exchanges.length, "交易所 Exchanges");
    html += "</div>";

    html += '<div class="view-toolbar">';
    html += '<label for="healthExchange">交易所 Exchange</label>';
    html += '<select id="healthExchange" data-role="health-exchange">';
    html += '<option value="all"' + (exFilter === "all" ? " selected" : "") + ">全部 All</option>";
    cache.manifest.exchanges.forEach(function (e) {
      html += '<option value="' + esc(e.id) + '"' + (exFilter === e.id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
    });
    html += "</select>";
    html += '<label for="healthType">范围 Scope</label>';
    html += '<select id="healthType" data-role="health-type">';
    [["stale", "待复核 Stale"], ["low", "低置信度 Low Confidence"], ["all", "全部 All"]].forEach(function (opt) {
      html += '<option value="' + opt[0] + '"' + (typeFilter === opt[0] ? " selected" : "") + ">" + esc(opt[1]) + "</option>";
    });
    html += "</select>";
    html += "</div>";

    var rows = cache.freshness.filter(function (f) {
      if (exFilter !== "all" && f.exchange_id !== exFilter) return false;
      if (typeFilter === "stale" && !f.stale) return false;
      if (typeFilter === "low" && f.confidence !== "low") return false;
      return true;
    }).sort(function (a, b) { return (b.age_days || 0) - (a.age_days || 0); });

    var headingMap = {
      stale: "复核队列（按超期天数排序）Review Queue",
      low: "低置信度字段 Low-Confidence Fields",
      all: "全部已填字段（按超期天数排序）All Filled Fields",
    };
    html += "<h3>" + esc(headingMap[typeFilter] || headingMap.all) + "</h3>";
    if (rows.length) {
      html += '<div class="matrix-scroll"><table class="matrix"><thead><tr>' +
        '<th><span class="th-label-zh">交易所</span><span class="th-label-en">Exchange</span></th>' +
        '<th><span class="th-label-zh">章节</span><span class="th-label-en">Chapter</span></th>' +
        '<th><span class="th-label-zh">字段</span><span class="th-label-en">Field</span></th>' +
        '<th><span class="th-label-zh">时效等级</span><span class="th-label-en">Volatility</span></th>' +
        '<th><span class="th-label-zh">置信度</span><span class="th-label-en">Confidence</span></th>' +
        '<th><span class="th-label-zh">核实日期</span><span class="th-label-en">Verified</span></th>' +
        '<th><span class="th-label-zh">超期天数</span><span class="th-label-en">Age (days)</span></th>' +
        "</tr></thead><tbody>";
      rows.forEach(function (f) {
        var ex = cache.exchangeById[f.exchange_id];
        html += "<tr data-role=\"goto-health-field\" data-exchange=\"" + esc(f.exchange_id) + "\" data-path=\"" + esc(f.field_path) +
          "\" data-chapter=\"" + esc(f.chapter) + "\" style=\"cursor:pointer\">";
        html += "<td>" + esc(ex ? exchangeDisplayName(ex) : f.exchange_id) + "</td>";
        html += "<td>" + esc(f.chapter_label_zh) + " <span style=\"opacity:.6\">" + esc(f.chapter_label_en) + "</span></td>";
        html += "<td>" + esc(f.label_zh) + " <span style=\"opacity:.6\">" + esc(f.label_en) + "</span></td>";
        html += "<td>" + esc(f.volatility) + "</td>";
        html += "<td>" + (f.confidence ? '<span class="badge ' + confBadgeClass(f.confidence) + '">' + confLabel(f.confidence) + "</span>" : "—") + "</td>";
        html += "<td>" + esc(f.verified || "—") + "</td>";
        html += "<td>" + esc(f.age_days == null ? "—" : f.age_days) + (f.stale ? '<span class="stale-dot" title="待复核 Stale"></span>' : "") + "</td>";
        html += "</tr>";
      });
      html += "</tbody></table></div>";
    } else {
      html += '<p style="color:var(--fg-muted)">' + t("没有符合条件的字段。", "No fields match the current filters.") + "</p>";
    }

    app.innerHTML = html;

    function statTile(num, label) {
      return '<div class="stat-tile"><div class="stat-num">' + esc(num) + '</div><div class="stat-label">' + esc(label) + "</div></div>";
    }
  }

  // ══════════════════════════════════════════════
  // 时区甘特条视图
  // trading_hours 由 tools/sync.py 从交易时段文本近似换算并按 UTC 对齐（见
  // manifest.json 里的 compute_trading_window 注释），前端这里只管渲染，不
  // 重新解析文本。
  // ══════════════════════════════════════════════
  function _fmtHourLabel(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
    return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }
  // 把一段可能跨 UTC 零点的 [start,end) 折成 24 小时轴上 1-2 段不跨界线段。
  function normalizeSegment(startRaw, endRaw) {
    if (startRaw == null || endRaw == null) return [];
    var start = ((startRaw % 24) + 24) % 24;
    var end = ((endRaw % 24) + 24) % 24;
    if (end <= start) return [[start, 24], [0, end]];
    return [[start, end]];
  }
  function tradingBarSegments(th) {
    if (!th || th.open_utc == null || th.close_utc == null) return { open: [], lunch: [] };
    if (th.lunch_start_utc != null && th.lunch_end_utc != null) {
      return {
        open: normalizeSegment(th.open_utc, th.lunch_start_utc).concat(normalizeSegment(th.lunch_end_utc, th.close_utc)),
        lunch: normalizeSegment(th.lunch_start_utc, th.lunch_end_utc),
      };
    }
    return { open: normalizeSegment(th.open_utc, th.close_utc), lunch: [] };
  }
  function renderTimezone(app, params) {
    var now = new Date();
    var nowUtc = now.getUTCHours() + now.getUTCMinutes() / 60;
    var nowLocal = now.getHours() + now.getMinutes() / 60;

    var rows = cache.manifest.exchanges.filter(function (e) { return e.trading_hours; }).slice();
    rows.sort(function (a, b) {
      return (((a.trading_hours.open_utc % 24) + 24) % 24) - (((b.trading_hours.open_utc % 24) + 24) % 24);
    });
    var missing = cache.manifest.exchanges.filter(function (e) { return !e.trading_hours; });

    var html = "";
    html += '<p style="color:var(--fg-muted);font-size:12.5px;margin:0 0 14px;max-width:72ch">';
    html += t(
      "各所交易时段按 UTC 对齐展示，由「市场结构与交易机制」章节的交易时段文本近似换算而来（不保证分钟级精确，含夏令时的所已按今天的日期自动折算），精确时段与出处见各所档案页。当前 <strong>",
      "Session times are shown aligned to UTC, converted approximately from the session text of the “Market Structure & Trading Mechanics” chapter (not minute-exact; exchanges observing DST are converted using today’s date). Exact times and sources are on each exchange’s profile. The current time "
    );
    html += esc(_fmtHourLabel(nowUtc)) + " UTC</strong>" + t("（本地 ", " (local ") + esc(_fmtHourLabel(nowLocal)) + t("）用竖线标出。", ") is marked with a vertical line.") + "</p>";

    html += '<div class="tz-legend"><span><i class="tz-swatch tz-swatch-open"></i>' + t("连续交易 Continuous Trading", "Continuous Trading") +
      '</span><span><i class="tz-swatch tz-swatch-lunch"></i>' + t("午休 Lunch Break", "Lunch Break") +
      '</span><span><i class="tz-swatch tz-swatch-now"></i>' + t("当前时刻 Now", "Now") + "</span></div>";

    html += '<div class="tz-chart">';
    html += '<div class="tz-axis"><span class="tz-axis-spacer"></span><span class="tz-axis-ticks">';
    for (var h = 0; h <= 24; h += 3) {
      html += '<i style="left:' + (h / 24 * 100) + '%">' + h + "</i>";
    }
    html += "</span></div>";

    rows.forEach(function (e) {
      var th = e.trading_hours;
      var segs = tradingBarSegments(th);
      html += '<div class="tz-row">';
      html += '<a class="tz-label" href="#view=exchange&id=' + esc(e.id) + '&ch=market_structure">' + esc(exchangeDisplayName(e)) +
        '<span class="tz-offset">UTC' + (th.utc_offset_hours >= 0 ? "+" : "") + th.utc_offset_hours + "</span></a>";
      html += '<div class="tz-track">';
      segs.open.forEach(function (seg) {
        html += '<div class="tz-bar tz-bar-open" style="left:' + (seg[0] / 24 * 100) + "%;width:" + ((seg[1] - seg[0]) / 24 * 100) + '%" title="' +
          esc(th.open_local + "–" + th.close_local + t(" 本地 Local, UTC", " local, UTC") + (th.utc_offset_hours >= 0 ? "+" : "") + th.utc_offset_hours) + '"></div>';
      });
      segs.lunch.forEach(function (seg) {
        html += '<div class="tz-bar tz-bar-lunch" style="left:' + (seg[0] / 24 * 100) + "%;width:" + ((seg[1] - seg[0]) / 24 * 100) + '%" title="' +
          esc(t("午休 Lunch Break ", "Lunch Break ") + th.lunch_start_local + "–" + th.lunch_end_local + t(" 本地 Local", " local")) + '"></div>';
      });
      html += '<div class="tz-now-line" style="left:' + (nowUtc / 24 * 100) + '%"></div>';
      html += "</div>";
      html += '<span class="tz-times">' + esc(th.open_local) + "–" + esc(th.close_local) + "</span>";
      html += "</div>";
    });
    html += "</div>";

    if (missing.length) {
      html += '<p style="color:var(--fg-muted);font-size:12px;margin-top:14px">' +
        t("时段数据不足，未列入 Insufficient session data, excluded：", "Insufficient session data, excluded: ") +
        missing.map(function (e) { return esc(exchangeDisplayName(e)); }).join(t("、", ", ")) + "</p>";
    }

    app.innerHTML = html;
  }

  // ══════════════════════════════════════════════
  // 市场机制剖面（v2.0 主视图，见 PROJECT/DECISIONS.md ADR-035 / 更名见 ADR-040/042）
  //   旧名「交易日平面图」——只描述形式不反映内核；内核是「一个市场的交易机制」，
  //   用一个交易日的时间轴作画布。路由键 trading-day 保持不变（URL 兼容）。
  //   x = 日内时间（分钟精度，覆盖盘前到盘后），y = 涨跌幅（相对前收盘价 / 前结算价）
  //   数据源：第五章 spec 层（sync.py 原样导出到 exchanges/<id>.json）。
  //   手写 SVG 字符串，不引图表库（ADR-035 C 零构建守则）。
  //   诚实渲染三态（ADR-035 D）：spec 有值+high → 实线；spec 值 null → 幽灵虚线+"未公布"角标；
  //   medium/low → 更淡 / 虚线。每个渲染元素带 data-role="cell"，点击复用 openCellOverlay 弹出处。
  // ══════════════════════════════════════════════
  var TD_DEFAULT_EX = "cn-sse";
  var TD_SESSION_ORDER = ["pre_market", "continuous_am", "lunch_break", "continuous_pm", "after_market", "night_session"];
  // 时段类型字典：{zh, en} 结构，用 tSel() 取值（跟随语言开关）
  var TD_KIND_LABEL = {
    pre_open_queue: { zh: "挂单排队·不成交", en: "Order queue · no fills" },
    opening_auction: { zh: "开盘集合竞价", en: "Opening auction" },
    continuous: { zh: "连续竞价", en: "Continuous trading" },
    closing_auction: { zh: "收盘集合竞价", en: "Closing auction" },
    fixed_price: { zh: "固定价格交易", en: "Fixed-price trading" },
    lunch_recess: { zh: "午间休市", en: "Lunch recess" },
    after_hours_continuous: { zh: "盘后连续交易", en: "After-hours continuous" },
    night: { zh: "夜盘", en: "Night session" },
    none: { zh: "不设", en: "Not held" }
  };
  function tdKindFill(kind) {
    if (kind === "continuous") return "var(--accent)";
    if (kind === "lunch_recess") return "var(--info)";
    if (kind === "night") return "var(--fg-muted)";
    if (kind === "pre_open_queue" || kind === "opening_auction" || kind === "closing_auction") return "var(--warn)";
    return "var(--border-strong)";
  }
  function tdParseHM(s) {
    var m = typeof s === "string" && s.match(/^(\d{1,2}):(\d{2})$/);
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }
  function tdFmtHM(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), mm = min % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }
  // ADR-035 D4：medium/low 置信度元素加"未完全核实"视觉线索（虚线边框 / 更淡）
  function tdConfClass(env) {
    if (!env || !env.confidence || env.confidence === "high") return "";
    return env.confidence === "low" ? " td-uncertain td-low" : " td-uncertain";
  }
  function tdFieldLabel(path) {
    return fieldLabel("market_structure", path);
  }
  // "字段标签：内容"——en 模式换 ASCII 冒号，去掉全角括号
  function tdTip(path, body) {
    return tdFieldLabel(path) + sep() + body;
  }
  function tdResolveId(params) {
    var l = cache.manifest.exchanges;
    if (l.some(function (e) { return e.id === params.id; })) return params.id;
    return l.some(function (e) { return e.id === TD_DEFAULT_EX; }) ? TD_DEFAULT_EX : l[0].id;
  }
  function tdCell(id, path, inner, title) {
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="market_structure">' + (title ? "<title>" + esc(title) + "</title>" : "") + inner + "</g>";
  }
  // 标注 chip（tdCorePanel 的六格 + tdSidePanels 的「交易细则·成本」组共用；ADR-055）。
  // val 传完整串，CSS 用 -webkit-line-clamp 截断，title 给完整内容；标签按 chapter+path 查 taxonomy。
  function tdChip(id, path, val, env, chapter) {
    var has = env && (env.zh || env.enum || env.spec);
    val = String(val == null || val === "" ? "—" : val);
    return '<button type="button" class="td-chip' + tdConfClass(env) + (has ? "" : " td-chip-empty") +
      '" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="' + esc(chapter || "market_structure") + '" title="' + esc(val) + '">' +
      '<span class="td-chip-k">' + esc(fieldLabel(chapter || "market_structure", path)) + '</span><span class="td-chip-v">' + esc(val) + '</span></button>';
  }
  // 透视开关状态（面板退成虚线轮廓、露出零轴/熔断线/走廊），按访客持久化。
  function tdGhostOn() {
    try { return localStorage.getItem("ea-td-ghost") === "1"; } catch (e) { return false; }
  }
  // 价格约束结论句（机制核心面板顶栏，恒 1 行）——只综述主板价格限制，不含熔断/回转
  // （熔断进面板槽③，回转已是平面右外缘标记）。
  function tdEnvelopeLine(ms, yRef) {
    var s = ms.price_limits && ms.price_limits.main_board && ms.price_limits.main_board.spec;
    if (s) {
      if (typeof s.limit_pct === "number") return t("当日价格限制 ±" + s.limit_pct + "%（相对" + yRef + "）", "Daily price limit ±" + s.limit_pct + "% (vs " + yRef + ")");
      if (typeof s.limit_pct_up === "number" || typeof s.limit_pct_down === "number")
        return t("当日涨跌停 +" + (s.limit_pct_up != null ? s.limit_pct_up : "?") + "% / −" + (s.limit_pct_down != null ? Math.abs(s.limit_pct_down) : "?") + "%",
          "Daily limit up +" + (s.limit_pct_up != null ? s.limit_pct_up : "?") + "% / down −" + (s.limit_pct_down != null ? Math.abs(s.limit_pct_down) : "?") + "%");
      if (s.type === "stepwise") return t("阶梯值幅：涨跌幅随基准价分档", "Stepwise limits: the band depends on the base price");
      if (s.type === "dynamic" && typeof s.band_pct === "number") return t("动态价格带 ±" + s.band_pct + "%（随参考价滚动）", "Dynamic price band ±" + s.band_pct + "% (rolling reference price)");
      if (s.type === "dynamic") return t("设动态价格带，档位官方未公布", "Dynamic price band in place; thresholds not published");
      if (s.type === "none") return t("无每日涨跌停墙", "No daily price-limit wall");
      return t("价格限制按品种 / 证券分类分档", "Price limits are tiered by instrument / security class");
    }
    var pt = getByPath(ms, "price_limits.type");
    if (pt && pt.enum) return enumDisplay("price_limit_type", pt.enum);
    if (pt && pt.zh) return dv(pt);
    return t("价格约束未结构化——见档案页第五章", "Price constraints not structured — see Chapter 5 of the profile");
  }

  function renderTradingDay(app, params) {
    var list = cache.manifest.exchanges;
    var id = tdResolveId(params);
    var toolbar = '<div class="view-toolbar">' +
      '<label for="tdExchange">市场 Market</label>' +
      '<select id="tdExchange" data-role="td-exchange">' +
      list.map(function (e) {
        return '<option value="' + esc(e.id) + '"' + (e.id === id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
      }).join("") + "</select>" +
      '<span class="td-tb-note">' + t("x = 日内时间 · y = 涨跌幅相对前收盘价 · 点击任意元素看出处",
        "x = time of day · y = % change vs previous close · click any element for sources") + "</span>" +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">' + t("加载机制剖面中…", "Loading market mechanics profile…") + "</div>";
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "trading-day") || tdResolveId(cur) !== id) return;
      app.innerHTML = toolbar + tdBuild(id, data);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  function tdBuild(id, data) {
    var ms = (data.chapters && data.chapters.market_structure) || {};
    var n = function (v) { return (+v).toFixed(1); };
    var sessions = ms.trading_sessions || {};
    var mb = ms.price_limits && ms.price_limits.main_board, mbS = (mb && mb.spec) || null;
    var cb = ms.circuit_breaker, cbS = (cb && cb.spec) || null;
    var vi = ms.volatility_interruption, viS = (vi && vi.spec) || null;
    var opnS = (ms.opening_mechanism && ms.opening_mechanism.spec) || null;
    var clsS = (ms.closing_mechanism && ms.closing_mechanism.spec) || null;
    var yRef = (mbS && mbS.reference === "prev_settlement") ? t("前结算价", "previous settlement") : t("前收盘价", "previous close");

    // ── x 轴范围：所有已知时刻的包络 + 15 分钟留白 ──
    var T = [];
    TD_SESSION_ORDER.forEach(function (k) {
      var s = sessions[k] && sessions[k].spec;
      if (!s || s.kind === "none") return;
      var a = tdParseHM(s.start), b = tdParseHM(s.end);
      if (a != null) T.push(a);
      if (b != null) T.push(b);
    });
    [opnS, clsS].forEach(function (s) {
      if (!s) return;
      // 同理，别在这儿用 t 做形参名（会遮蔽 t() 文案助手）
      [s.auction_start, s.auction_end, s.trade_at_close_end].forEach(function (hm) {
        var m = tdParseHM(hm); if (m != null) T.push(m);
      });
    });
    var haveTimes = T.length >= 2;
    var xMin = haveTimes ? Math.min.apply(null, T) - 15 : 540;
    var xMax = haveTimes ? Math.max.apply(null, T) + 15 : 1050;
    if (xMax - xMin < 90) { xMin -= 45; xMax += 45; }

    // ── y 轴范围：涨跌停 / 动态带 / 熔断档位 / 波动中断 的最大量级 × 1.3（封顶 40）──
    var mags = [];
    if (mbS) {
      [mbS.limit_pct, mbS.limit_pct_up, mbS.limit_pct_down, mbS.band_pct].forEach(function (v) {
        if (typeof v === "number") mags.push(Math.abs(v));
      });
    }
    var ladderPct = null;
    if (mbS && mbS.type === "stepwise" && mbS.ladder && mbS.ladder.length) {
      var ps = [];
      mbS.ladder.forEach(function (r) {
        if (typeof r.band_abs !== "number") return;
        if (r.base_max) ps.push(r.band_abs / r.base_max * 100);
        if (r.base_min && r.base_min >= 300) ps.push(r.band_abs / r.base_min * 100);
      });
      if (ps.length) { ladderPct = [Math.min.apply(null, ps), Math.max.apply(null, ps)]; mags.push(ladderPct[1]); }
    }
    if (cbS && cbS.levels) cbS.levels.forEach(function (lv) {
      if (typeof lv.threshold_pct === "number") mags.push(Math.abs(lv.threshold_pct));
    });
    if (viS) [viS.static_pct, viS.dynamic_pct].forEach(function (v) {
      if (typeof v === "number") mags.push(Math.abs(v));
    });
    var yR = Math.min(40, Math.max(5, mags.length ? Math.ceil(Math.max.apply(null, mags) * 1.15) : 9));

    // ── 画布 ──
    var W = 960, H = 556, PL = 60, PR = 152, PT = 62, PB = 106;
    var pw = W - PL - PR, ph = H - PT - PB;
    var X = function (m) { return PL + (m - xMin) / (xMax - xMin) * pw; };
    var Y = function (p) { return PT + (yR - p) / (2 * yR) * ph; };
    var g = [];

    g.push('<defs>' +
      '<pattern id="tdAuc" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="7" height="7" fill="var(--warn)" opacity="0.09"/>' +
      '<line x1="0" y1="0" x2="0" y2="7" stroke="var(--warn)" stroke-width="2.5" opacity="0.34"/></pattern>' +
      '<pattern id="tdHalt" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">' +
      '<rect width="8" height="8" fill="var(--fg-muted)" opacity="0.05"/>' +
      '<line x1="0" y1="0" x2="0" y2="8" stroke="var(--fg-muted)" stroke-width="2" opacity="0.26"/></pattern></defs>');

    g.push('<rect x="' + PL + '" y="' + PT + '" width="' + pw + '" height="' + ph + '" fill="var(--bg-elevated)" stroke="var(--border)"/>');

    // ── 时段：全高背景淡带（x 轴分段着色）──
    var drawn = [];
    TD_SESSION_ORDER.forEach(function (k) {
      var env = sessions[k], s = env && env.spec;
      if (!s || s.kind === "none") return;
      var a = tdParseHM(s.start), b = tdParseHM(s.end);
      if (a == null || b == null) return;
      if (b <= a) b += 1440;
      drawn.push({ k: k, env: env, s: s, a: a, b: b });
    });
    drawn.forEach(function (d) {
      var x1 = X(d.a), w = Math.max(1, X(d.b) - x1);
      g.push('<rect x="' + n(x1) + '" y="' + PT + '" width="' + n(w) + '" height="' + ph + '" fill="' + tdKindFill(d.s.kind) + '" opacity="0.06"/>');
    });

    // ── 涨跌停墙 + 墙外阴影（ADR-035 A：主板幅度 → y 轴边界墙 + 墙外阴影）──
    // 画不出墙的情形（无墙 / 动态 null / 分档 null）不在此标注，交给中心信息卡
    var wUp = null, wDn = null;
    if (mbS) {
      if (typeof mbS.limit_pct === "number") { wUp = mbS.limit_pct; wDn = -mbS.limit_pct; }
      if (typeof mbS.limit_pct_up === "number") wUp = mbS.limit_pct_up;
      if (typeof mbS.limit_pct_down === "number") wDn = -Math.abs(mbS.limit_pct_down);
    }
    if (wUp != null && wDn != null) {
      var dash = (mb && mb.confidence && mb.confidence !== "high") ? ' stroke-dasharray="6 3"' : "";
      g.push('<rect x="' + PL + '" y="' + PT + '" width="' + pw + '" height="' + n(Math.max(0, Y(wUp) - PT)) + '" fill="var(--danger)" opacity="0.07"/>');
      g.push('<rect x="' + PL + '" y="' + n(Y(wDn)) + '" width="' + pw + '" height="' + n(Math.max(0, PT + ph - Y(wDn))) + '" fill="var(--danger)" opacity="0.07"/>');
      g.push(tdCell(id, "price_limits.main_board",
        '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(wUp)) + '" y2="' + n(Y(wUp)) + '" stroke="var(--danger)" stroke-width="1.6"' + dash + '/>' +
        '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(wDn)) + '" y2="' + n(Y(wDn)) + '" stroke="var(--danger)" stroke-width="1.6"' + dash + '/>' +
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(wUp) + 4) + '" class="td-wl" fill="var(--danger)">' + t("涨停 ", "Limit up ") + "+" + wUp + '%</text>' +
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(wDn) + 4) + '" class="td-wl" fill="var(--danger)">' + t("跌停 ", "Limit down ") + wDn + '%</text>',
        tdTip("price_limits.main_board", "±" + wUp + "% " + t("相对", "vs") + yRef)));
    }
    // 阶梯绝对值幅 → 半透明带（ADR-035 D3：来源给区间不给点）
    if (ladderPct) {
      var lp0 = ladderPct[0], lp1 = ladderPct[1];
      function ladBand(a, b) {
        return '<rect x="' + PL + '" y="' + n(Y(b)) + '" width="' + pw + '" height="' + n(Y(a) - Y(b)) + '" fill="var(--danger)" opacity="0.08"/>' +
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(a)) + '" y2="' + n(Y(a)) + '" stroke="var(--danger)" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>' +
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(b)) + '" y2="' + n(Y(b)) + '" stroke="var(--danger)" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>';
      }
      g.push(tdCell(id, "price_limits.main_board",
        ladBand(lp0, lp1) + ladBand(-lp1, -lp0) +
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(lp1) + 4) + '" class="td-wl" fill="var(--danger)">' + t("阶梯值幅", "Stepwise limits") + '</text>' +
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(lp1) + 16) + '" class="td-wl-sub">' + t("约 ±", "approx ±") + Math.round(lp0) + "–" + Math.round(lp1) + '%</text>',
        tdTip("price_limits.main_board", t("阶梯绝对值幅，幅度随基准价变化（点击看完整档位）", "Stepwise absolute limits; the band varies with the base price (click for the full ladder)"))));
    }
    // 动态参考价区间
    if (mbS && mbS.type === "dynamic") {
      if (typeof mbS.band_pct === "number") {
        var bp = mbS.band_pct;
        g.push(tdCell(id, "price_limits.main_board",
          '<rect x="' + PL + '" y="' + n(Y(bp)) + '" width="' + pw + '" height="' + n(Y(-bp) - Y(bp)) + '" fill="var(--info)" opacity="0.10"/>' +
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(bp)) + '" y2="' + n(Y(bp)) + '" stroke="var(--info)" stroke-width="1.2" stroke-dasharray="5 4"/>' +
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(-bp)) + '" y2="' + n(Y(-bp)) + '" stroke="var(--info)" stroke-width="1.2" stroke-dasharray="5 4"/>' +
          '<text x="' + (PL + pw + 7) + '" y="' + n(Y(bp) + 4) + '" class="td-wl" fill="var(--info)">' + t("动态带 ", "Dynamic band ") + "±" + bp + '%</text>' +
          '<text x="' + (PL + pw + 7) + '" y="' + n(Y(bp) + 16) + '" class="td-wl-sub">' + t("相对滚动参考价", "vs rolling reference price") + '</text>',
          tdTip("price_limits.main_board", t("动态价格带 ±" + bp + "%（相对滚动参考价，非固定墙）", "Dynamic price band ±" + bp + "% (vs a rolling reference price, not a fixed wall)"))));
      }
      // band_pct: null / type: none / 分档 null 三种「墙画不出」的情形，
      // 不再单独标注——中心信息卡已用一句话说明（ADR-040 收口反馈）。
    }

    // ── 波动性中断走廊（ADR-035 A：贴价格路径的走廊；静态平面上呈中心走廊带）──
    // 视觉语言：细点线灰色 = "频繁触发的软护栏"，与红墙（硬）/蓝动态带（滚动）区分
    if (viS && viS.type !== "none") {
      var cor = [];
      if (typeof viS.dynamic_pct === "number") cor.push(viS.dynamic_pct);
      if (typeof viS.static_pct === "number") cor.push(viS.static_pct);
      if (cor.length) {
        var vf = "";
        cor.forEach(function (p) {
          vf += '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(p)) + '" y2="' + n(Y(p)) + '" stroke="var(--fg-muted)" stroke-width="1" stroke-dasharray="2 2"/>' +
            '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(-p)) + '" y2="' + n(Y(-p)) + '" stroke="var(--fg-muted)" stroke-width="1" stroke-dasharray="2 2"/>';
        });
        // 标签放左侧内缘（右侧留给涨跌停墙/熔断标签，避免与同 % 的墙标签叠字，如 sa-tadawul）
        vf += '<text x="' + (PL + 6) + '" y="' + n(Y(Math.max.apply(null, cor)) - 4) + '" class="td-wl-sub" fill="var(--fg-muted)">' +
          t("波动走廊 ", "Volatility corridor ") + "±" + cor.join("/") + '%</text>';
        g.push(tdCell(id, "volatility_interruption", vf, tdTip("volatility_interruption",
          t("出走廊触发短暂集合竞价", "Breaching the corridor triggers a short call auction"))));
      }
    }

    // ── 熔断（ADR-035 A：指数级 → y 轴多档触发线）──
    if (cbS && cbS.type === "index_level" && cbS.levels) {
      // 跨所联动（ADR-036 #6，如 in-nse 看 Nifty 50 或 BSE Sensex 先触发者）——
      // 触发依据已并入中心信息卡的熔断行，这里只在档位标签的 tooltip 里带一句
      var xref = (cbS.reference || []).some(function (r) { return r.exchange && r.exchange !== "self"; }) ? t(" ·跨所联动", " · cross-exchange") : "";
      cbS.levels.forEach(function (lv) {
        if (typeof lv.threshold_pct !== "number") return;
        var yy = Y(-lv.threshold_pct), lab = "−" + lv.threshold_pct + "%";
        if (lv.day_end) lab += t(" 全日休市", " · close for the day");
        else if (typeof lv.halt_minutes === "number") lab += t(" 停", " · halt ") + lv.halt_minutes + t("分", " min");
        g.push(tdCell(id, "circuit_breaker",
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(yy) + '" y2="' + n(yy) + '" stroke="var(--danger)" stroke-width="1.3" stroke-dasharray="8 3" opacity="0.85"/>' +
          '<text x="' + (PL + pw + 7) + '" y="' + n(yy + 4) + '" class="td-wl" fill="var(--danger)">' + t("熔断 ", "Halt ") + esc(lab) + '</text>',
          tdTip("circuit_breaker", t("指数级 ", "Index-level ") + lab + xref)));
      });
    }

    // ── 开 / 收盘集合竞价区块（ADR-035 A：首尾集合竞价区块）──
    function auc(spec, path, tag) {
      if (!spec) return;
      var a = tdParseHM(spec.auction_start), b = tdParseHM(spec.auction_end), tc = tdParseHM(spec.trade_at_close_end);
      var f = "";
      if (a != null && b != null && b > a) {
        f += '<rect x="' + n(X(a)) + '" y="' + PT + '" width="' + n(Math.max(2, X(b) - X(a))) + '" height="' + ph + '" fill="url(#tdAuc)"/>';
        if (typeof spec.randomised_seconds === "number" || typeof spec.random_close_window_min === "number") {
          f += '<rect x="' + n(X(b) - 3) + '" y="' + PT + '" width="6" height="' + ph + '" fill="var(--warn)" opacity="0.18"/>';
        }
      } else if (b != null) {
        f += '<line x1="' + n(X(b)) + '" x2="' + n(X(b)) + '" y1="' + PT + '" y2="' + (PT + ph) + '" stroke="var(--warn)" stroke-width="1.4" stroke-dasharray="4 3"/>';
      } else { return; }
      if (tc != null && b != null && tc > b) {
        f += '<rect x="' + n(X(b)) + '" y="' + PT + '" width="' + n(X(tc) - X(b)) + '" height="' + ph + '" fill="var(--warn)" opacity="0.05"/>';
      }
      f += '<text x="' + n((a != null ? X(a) : X(b)) + 2) + '" y="' + (PT - 6) + '" class="td-inl" fill="var(--warn)">' + esc(tag) + '</text>';
      g.push(tdCell(id, path, f, tdFieldLabel(path)));
    }
    auc(opnS, "opening_mechanism", t("开盘竞价", "Opening auction"));
    auc(clsS, "closing_mechanism", t("收盘竞价", "Closing auction"));

    // ── 临时停牌：顶边斜纹条（ADR-035 A："任意时刻"斜纹条）──
    if (ms.trading_halt_mechanism && ms.trading_halt_mechanism.zh) {
      g.push(tdCell(id, "trading_halt_mechanism",
        '<rect x="' + PL + '" y="' + (PT + 1) + '" width="' + pw + '" height="9" fill="url(#tdHalt)"/>' +
        '<text x="' + (PL + 5) + '" y="' + (PT + 8.5) + '" class="td-inl" fill="var(--fg-muted)">' +
          t("临时停牌可发生于任意时刻", "Temporary halts may occur at any time") + '</text>',
        tdFieldLabel("trading_halt_mechanism")));
    }

    // ── 回转交易 T+N：右缘标记（ADR-035 A：x 轴右缘箭头）──
    var ir = ms.intraday_reversal;
    if (ir && (ir.enum || ir.zh)) {
      var irm = {
        t0: { zh: "↺ T+0 当日可回转", en: "↺ T+0 reversal" },
        t1: { zh: "→ T+1 次日可卖", en: "→ T+1 next-day sale" },
        t2: { zh: "→ T+2", en: "→ T+2" },
        mixed: { zh: "⇄ 分品种不同", en: "⇄ varies by instrument" },
      };
      g.push(tdCell(id, "intraday_reversal",
        '<text x="' + (PL + pw + 7) + '" y="' + n(PT + ph - 2) + '" class="td-margin">' +
          esc(irm[ir.enum] ? tSel(irm, ir.enum) : t("回转制度见档案", "See profile for reversal rules")) + '</text>',
        tdTip("intraday_reversal", dv(ir) || "")));
    }

    // ── 网格 + 轴刻度 ──
    var yStep = yR <= 8 ? 2 : yR <= 16 ? 4 : yR <= 30 ? 5 : 10;
    for (var p = -Math.floor(yR / yStep) * yStep; p <= yR; p += yStep) {
      var yy2 = Y(p), zero = p === 0;
      g.push('<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(yy2) + '" y2="' + n(yy2) + '" stroke="var(--border)" stroke-width="' + (zero ? 1.5 : 0.5) + '"' + (zero ? "" : ' opacity="0.55"') + '/>');
      g.push('<text x="' + (PL - 8) + '" y="' + n(yy2 + 3.5) + '" class="td-tick" text-anchor="end">' + (p > 0 ? "+" : "") + p + '%</text>');
      if (zero) g.push('<text x="' + (PL + 6) + '" y="' + n(yy2 - 5) + '" class="td-wl-sub">' + t("0 = ", "0 = ") + esc(yRef) + "</text>");
    }

    // ── 机制核心面板（ADR-055）：第五章七项机制事实（价格约束结论句 + 撮合/订单类型/
    //    熔断/波动中断/卖空/做市商 六格）收进平面中心一块固定 628×276 的 foreignObject。
    //    在 g[] 末尾 push（见下方），使其压在几何层之上；透视开关可让它退成虚线轮廓。
    // x 轴刻度：网格线恒 30 分钟；标签宽跨度（>10h，如 de-eurex）降为每 60 分钟避免叠字。
    // 时间坐标上下各一排（收口审查反馈）。
    var xLabelEvery = (xMax - xMin) > 600 ? 60 : 30;
    for (var mx = Math.ceil(xMin / 30) * 30; mx <= xMax; mx += 30) {
      g.push('<line x1="' + n(X(mx)) + '" x2="' + n(X(mx)) + '" y1="' + PT + '" y2="' + (PT + ph) + '" stroke="var(--border)" stroke-width="0.5" opacity="0.45"/>');
      if (mx % xLabelEvery === 0) {
        g.push('<text x="' + n(X(mx)) + '" y="' + (PT - 16) + '" class="td-tick" text-anchor="middle">' + tdFmtHM(mx) + '</text>');
        g.push('<text x="' + n(X(mx)) + '" y="' + (PT + ph + 15) + '" class="td-tick" text-anchor="middle">' + tdFmtHM(mx) + '</text>');
      }
    }

    // ── 时段 ribbon（x 轴分段着色的图例条）──
    var ry = PT + ph + 26, rh = 15;
    if (drawn.length) {
      drawn.forEach(function (d) {
        var x1 = X(d.a), w = Math.max(2, X(d.b) - x1);
        var kind = tSel(TD_KIND_LABEL, d.s.kind) || d.s.kind;
        var f = '<rect x="' + n(x1) + '" y="' + ry + '" width="' + n(w) + '" height="' + rh + '" rx="2" fill="' + tdKindFill(d.s.kind) + '" opacity="0.9"/>';
        if (w > 64) f += '<text x="' + n(x1 + w / 2) + '" y="' + (ry + 11) + '" class="td-rib" text-anchor="middle">' + esc(kind) + '</text>';
        var span = tdFmtHM(d.a) + "–" + tdFmtHM(d.b % 1440);
        g.push(tdCell(id, "trading_sessions." + d.k, f,
          tdTip("trading_sessions." + d.k, t(span + "（" + kind + "）", span + " (" + kind + ")"))));
      });
    } else {
      g.push('<rect x="' + PL + '" y="' + ry + '" width="' + pw + '" height="' + rh + '" rx="2" fill="var(--border)" opacity="0.4"/>');
      g.push('<text x="' + (PL + 6) + '" y="' + (ry + 11) + '" class="td-rib" fill="var(--fg-muted)">' +
        t("交易时段钟点未结构化——见档案页第五章", "Session times not structured — see Chapter 5 of the profile") + '</text>');
    }

    // ── 标题 / 轴名 ──
    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    g.push('<text x="' + PL + '" y="' + (PT - 40) + '" class="td-title">' + esc(exName) + t(" · 市场机制剖面", " · Market Mechanics Profile") + "</text>");
    g.push('<text transform="translate(15,' + n(PT + ph / 2) + ') rotate(-90)" class="td-axis-name" text-anchor="middle">' +
      t("涨跌幅 %（相对" + yRef + "）", "% change (vs " + yRef + ")") + "</text>");
    g.push('<text x="' + n(PL + pw / 2) + '" y="' + (H - 5) + '" class="td-axis-name" text-anchor="middle">' +
      t("日内时间（当地）", "Time of day (local)") + "</text>");

    // 机制核心面板压在几何层之上（透视态 = 面板退成虚线轮廓，露出零轴/熔断线/走廊）
    var ghostOn = tdGhostOn();
    g.push(tdCorePanel(id, ms, yRef, ghostOn));

    var svg = '<div class="td-plot-wrap' + (ghostOn ? " td-ghost" : "") + '"><svg viewBox="0 0 ' + W + ' ' + H + '" class="td-svg" role="img" aria-label="' +
      esc(exName) + t(" 市场机制剖面", " market mechanics profile") + '">' + g.join("") + "</svg></div>";
    return tdBanner(ms) + tdLegend() + svg + tdSidePanels(id, data) + tdProse();
  }

  // 机制核心面板（ADR-055）——固定 628×276 的 foreignObject，水平居中、垂直居中于零轴
  // （Y(0)=PT+ph/2=256）。涨/跌停线因 yR 自适应恒在 Y≈90/420，面板居中 → 上下气口自动对称。
  function tdCorePanel(id, ms, yRef, ghostOn) {
    var W = 960, PL = 60, PR = 152, PT = 62, PB = 106;
    var pw = W - PL - PR, ph = 556 - PT - PB;
    var fw = pw - 120, fx = PL + 60, fh = 276, fy = PT + ph / 2 - fh / 2;

    var cells = [];
    var mp = ms.matching_principle;
    cells.push(tdChip(id, "matching_principle", mp && mp.enum ? enumDisplay("matching_principle", mp.enum) : dv(mp), mp));
    cells.push(tdChip(id, "order_types", dv(ms.order_types), ms.order_types));
    // 熔断：个股/合约级 → 展示机制描述（en 模式下信封 en 优先于中文 spec.note）；指数级/无 → 枚举标签
    var cbf = ms.circuit_breaker, cbfS = cbf && cbf.spec, cbv;
    if (cbfS && (cbfS.type === "stock_level" || cbfS.type === "contract_level")) {
      cbv = (state.langMode === "en" && cbf && cbf.en) ? cbf.en : (cbfS.note || (cbf && cbf.zh));
    } else if (cbf && cbf.enum) cbv = enumDisplay("circuit_breaker_type", cbf.enum);
    else cbv = dv(cbf);
    cells.push(tdChip(id, "circuit_breaker", cbv, cbf));
    var vic = ms.volatility_interruption, vicS = vic && vic.spec, vicv;
    if (vicS && vicS.type === "none") vicv = t("无独立层", "No separate layer");
    else if (vicS && (typeof vicS.dynamic_pct === "number" || typeof vicS.static_pct === "number")) {
      vicv = t("走廊 ", "Corridor ") + "±" + [vicS.dynamic_pct, vicS.static_pct].filter(function (x) { return typeof x === "number"; }).join("/") + "%";
    } else vicv = dv(vic);
    cells.push(tdChip(id, "volatility_interruption", vicv, vic));
    var ss = ms.short_selling;
    cells.push(tdChip(id, "short_selling", ss && ss.enum ? enumDisplay("short_selling_stance", ss.enum) : dv(ss), ss));
    var mm = ms.market_maker_scheme, mmS = mm && mm.spec;
    var mmv = mmS && mmS.present === true ? (t("有", "Yes") + (mmS.quote_obligation ? t(" · 强制双边报价", " · mandatory two-sided quotes") : "")) :
      (mmS && mmS.present === false ? t("无", "No") : dv(mm));
    cells.push(tdChip(id, "market_maker_scheme", mmv, mm));

    var gt = ghostOn ? t("恢复面板", "Restore panel")
      : t("透视面板：露出零轴 / 熔断线 / 走廊", "See-through: reveal zero line, halts, corridor");
    return '<foreignObject x="' + fx + '" y="' + Math.round(fy) + '" width="' + fw + '" height="' + fh + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" class="td-core">' +
      '<button type="button" class="td-core-ghost" data-role="td-ghost" aria-pressed="' + (ghostOn ? "true" : "false") +
      '" title="' + esc(gt) + '">' + (ghostOn ? "●" : "◐") + '</button>' +
      '<div class="td-core-head"><span class="td-core-tag">' + t("价格约束", "Price envelope") + '</span>' +
      '<span class="td-core-line">' + esc(tdEnvelopeLine(ms, yRef)) + '</span></div>' +
      '<div class="td-core-grid">' + cells.join("") + '</div></div></foreignObject>';
  }

  // 非现货 / 衍生品字段 banner（移到 SVG 之前——读图前要知道的前提；ADR-055）
  function tdBanner(ms) {
    var mbRef = ms.price_limits && ms.price_limits.main_board && ms.price_limits.main_board.spec && ms.price_limits.main_board.spec.reference;
    if (mbRef === "prev_settlement") {
      return t(
        '<p class="td-banner">纯衍生品交易所：y 轴基准为<strong>前结算价</strong>，第五章字段描述衍生品市场（ADR-035 E）。</p>',
        '<p class="td-banner">Derivatives-only exchange: the y axis is benchmarked to the <strong>previous settlement price</strong>, and Chapter 5 fields describe the derivatives market (ADR-035 E).</p>');
    }
    var hasDeriv = ms.derivatives && Object.keys(ms.derivatives).some(function (k) {
      var v = ms.derivatives[k];
      function content(o) {
        if (!o || typeof o !== "object") return false;
        if (o.zh || o.enum || o.spec) return true;
        return Object.keys(o).some(function (kk) { return ["zh", "en", "quote", "sources", "detail", "confidence", "verified", "enum", "spec", "_meta"].indexOf(kk) < 0 && content(o[kk]); });
      }
      return content(v);
    });
    if (hasDeriv) {
      return t(
        '<p class="td-banner td-banner-soft">本所记录含衍生品市场字段；本剖面显示<strong>现货</strong>（衍生品 spec 待 Phase 3 补充）。</p>',
        '<p class="td-banner td-banner-soft">This exchange has derivatives-market fields on record; this profile shows the <strong>cash market</strong> (derivatives specs are pending Phase 3).</p>');
    }
    return "";
  }

  // 交易细则 · 成本组（tick size / 交易单位 / 交收 / 佣金 / 交易税 / 互联互通）——图下方保留，
  // 「交易机制」七项已移入机制核心面板（ADR-055）。定宽 6 列，不随交易所换行漂移。
  function tdSidePanels(id, data) {
    var ms = (data.chapters && data.chapters.market_structure) || {};
    var costs = (data.chapters && data.chapters.costs) || {};
    var clearing = (data.chapters && data.chapters.clearing) || {};
    function chip(path, val, env, chapter) { return tdChip(id, path, val, env, chapter); }

    var chips2 = [];
    var ts = ms.tick_size;
    chips2.push(chip("tick_size", dv(ts), ts));
    var bl = ms.board_lot_size;
    chips2.push(chip("board_lot_size", dv(bl), bl));
    var sc = clearing.settlement_cycle;
    chips2.push(chip("settlement_cycle", sc && sc.enum ? enumDisplay("settlement_cycle", sc.enum) : dv(sc), sc, "clearing"));
    var cm = costs.commission_structure;
    chips2.push(chip("commission_structure", dv(cm), cm, "costs"));
    // 交易税：印花税优先，其次金融交易税；都没有则指向印花税字段（多为空=不征）
    var sd = costs.stamp_duty, ftt = costs.financial_transaction_tax;
    if (sd && sd.zh) chips2.push(chip("stamp_duty", dv(sd), sd, "costs"));
    else if (ftt && ftt.zh) chips2.push(chip("financial_transaction_tax", dv(ftt), ftt, "costs"));
    else chips2.push(chip("stamp_duty", t("无 / 未见征收", "None / not found"), sd, "costs"));
    var cs = ms.connect_schemes;
    if (cs && cs.zh) chips2.push(chip("connect_schemes", dv(cs), cs));

    return '<div class="td-chips-label">' + t("交易细则 · 成本", "Trading Rules · Costs") +
      '</div><div class="td-chips td-chips-6">' + chips2.join("") + "</div>";
  }

  function tdLegend() {
    return '<div class="td-legend">' +
      '<span><i class="td-sw" style="background:var(--accent)"></i>' + t("连续竞价", "Continuous trading") + "</span>" +
      '<span><i class="td-sw" style="background:var(--warn)"></i>' + t("集合竞价 / 挂单排队", "Call auction / order queue") + "</span>" +
      '<span><i class="td-sw" style="background:var(--info)"></i>' + t("午休", "Lunch break") + "</span>" +
      '<span><i class="td-sw" style="background:var(--border-strong)"></i>' + t("固定价 / 盘后", "Fixed price / after hours") + "</span>" +
      '<span><i class="td-sw td-sw-solid"></i>' + t("涨跌停墙（硬）", "Price limit wall (hard)") + "</span>" +
      '<span><i class="td-sw td-sw-dash"></i>' + t("熔断触发线", "Circuit-breaker trigger") + "</span>" +
      '<span><i class="td-sw td-sw-band"></i>' + t("动态带（蓝） / 波动走廊（灰）", "Dynamic band (blue) / volatility corridor (grey)") + "</span>" +
      "</div>";
  }

  function tdProse() {
    return '<p class="td-prose">' + t(
      '本剖面由第五章「市场结构与交易机制」的结构化 <code>spec</code> 层驱动（见 ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-035</a>）：' +
      '实线 / 实心为已核实数值，虚线 / 幽灵为「机制存在、数值官方未公布」，更淡的元素为 medium/low 置信度。' +
      '时间轴为分钟精度，不表示到秒；随机开 / 收盘窗口以模糊边缘示意。点击任意元素查看原文摘录与出处。' +
      '规则以各交易所官方发布为准，不构成投资建议。',
      'This profile is driven by the structured <code>spec</code> layer of Chapter 5, “Market Structure &amp; Trading Mechanics” (see ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-035</a>): ' +
      'solid lines / fills are verified values; dashed lines and ghost elements mean “the mechanism exists but the official figure is unpublished”; ' +
      'fainter elements are medium/low confidence. The time axis is minute-precision, not second-precision; randomised open/close windows are shown ' +
      'as blurred edges. Click any element to see the verbatim excerpt and its source. Rules are as officially published by each exchange; ' +
      'nothing here is investment advice.') + "</p>";
  }

  // ══════════════════════════════════════════════
  // 交易成本瀑布（v2.0 Phase 3 第二棒：数据层 ADR-045 / 渲染层 ADR-047 / ADR-071 迭代，见 PROJECT/DECISIONS.md）
  //   镜像双瀑布：中轴 = 0 bp；左半 = 买入侧、右半 = 卖出侧，向中间对齐。
  //   五费种（交易所费 / 清算费 / 监管费 / 印花税 / 金融交易税）逐行，
  //   spec.side（buy/sell/both）决定落在哪一侧；底部买 / 卖小计 + 往返合计。
  //   佣金（commission_structure）不进瀑布条（ADR-071：券商议价、20/20 无统一费率、
  //   恒幽灵条零对比价值）——降为图下方一行说明，点击仍可看出处；数据字段仍在剖面 chip / 档案页。
  //   数据源：第十一章 costs.* 的 spec 层（cost_layer 形状：rate + unit + side +
  //   components / tiered / cap / type:none / rate:null / rate_raw）。归一到 bp 在渲染层做（ADR-045 轴③）。
  //   诚实三态：rate 有值 → 实心条 + bp 数；rate:null → 幽灵虚线条 +「议价 / 未披露」；
  //   type:none → 中轴细线 +「不征收」。rate_raw（原文非阿拉伯数字、已人工转写，如 tw/za 的
  //   证券交易税）→ 实心条 + 「*」标记。资本利得税 / 股息预扣税为持有 / 退出税，
  //   非按笔成本，另列图下方（ADR-045 轴①）。手写 SVG，不引图表库。
  // ══════════════════════════════════════════════
  var CW_DEFAULT_EX = "hk-hkex";
  var CW_ASSUMED_NOTIONAL = 100000; // 单笔成交金额（当地货币），折算定额 / 按笔费种
  var CW_ASSUMED_PRICE = 50;        // 单股价格（当地货币），折算按股费种
  var CW_FEE_ORDER = ["exchange_fees", "clearing_fees", "regulatory_fees", "stamp_duty", "financial_transaction_tax"];
  var CW_FEE_META = {
    // 佣金不在 CW_FEE_ORDER（ADR-071）——保留元数据供图下方说明行的 cwFeeName / openCellOverlay 用
    commission_structure:      { zh: "佣金", en: "Commission", color: "var(--fg-faint)" },
    exchange_fees:             { zh: "交易所费", en: "Exchange fees", color: "var(--accent)" },
    clearing_fees:             { zh: "清算费", en: "Clearing fees", color: "var(--info)" },
    regulatory_fees:           { zh: "监管费", en: "Regulatory fees", color: "var(--fg-muted)" },
    stamp_duty:                { zh: "印花税", en: "Stamp duty", color: "var(--danger)" },
    financial_transaction_tax: { zh: "金融交易税", en: "Financial transaction tax", color: "var(--warn)" }
  };
  // 费种名跟随语言开关（tSel 用法与 TD_KIND_LABEL 一致）
  function cwFeeName(key) { return tSel(CW_FEE_META, key); }

  // spec（cost_layer 形状）→ null（无 spec）| {none} | {ghost,tiered} | {bp,tiered,capped,components,approx}
  function cwToBp(spec) {
    if (!spec) return null;
    if (spec.type === "none") return { none: true };
    var comps = spec.components && spec.components.length ? spec.components : null;
    var rate = spec.rate;
    if (comps) {
      var sum = 0, ok = false;
      comps.forEach(function (c) { if (typeof c.rate === "number") { sum += c.rate; ok = true; } });
      if (ok) rate = sum;
    }
    if (typeof rate !== "number") return { ghost: true, tiered: !!spec.tiered };
    var bp = null, approx = false;
    switch (spec.unit) {
      case "pct": bp = rate * 100; break;
      case "permille": bp = rate * 10; break;
      case "bp": bp = rate; break;
      case "per_lakh": bp = rate / 1e5 * 1e4; break;
      case "per_crore": bp = rate / 1e7 * 1e4; break;
      case "per_million": bp = rate / 1e6 * 1e4; break;
      case "per_share": bp = rate / CW_ASSUMED_PRICE * 1e4; approx = true; break;
      case "flat_per_trade": case "flat_per_settlement": case "flat_per_order":
        bp = rate / CW_ASSUMED_NOTIONAL * 1e4; approx = true; break;
      default: return { ghost: true, tiered: !!spec.tiered };
    }
    // rate_raw（ADR-071）：原文非阿拉伯数字（「千分之三」/「0,25%」），rate 为人工转写 → 标 *
    return { bp: bp, tiered: !!spec.tiered, capped: spec.cap != null, components: !!comps, approx: approx, raw: !!spec.rate_raw };
  }
  function cwSide(spec) {
    return spec && (spec.side === "buy" || spec.side === "sell") ? spec.side : "both";
  }
  function cwFmtBp(v) {
    if (v >= 10) return v.toFixed(0);
    if (v >= 1) return v.toFixed(1);
    return v.toFixed(2);
  }
  // 小计 / 往返合计保留 1 位小数，避免「11 + 11 = 23」这类肉眼不一致
  function cwFmtBp2(v) {
    if (v >= 100) return v.toFixed(0);
    if (v >= 1) return v.toFixed(1);
    return v.toFixed(2);
  }
  function cwResolveId(params) {
    var l = cache.manifest.exchanges;
    if (l.some(function (e) { return e.id === params.id; })) return params.id;
    return l.some(function (e) { return e.id === CW_DEFAULT_EX; }) ? CW_DEFAULT_EX : l[0].id;
  }
  function cwCell(id, key, inner, title) {
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(key) +
      '" data-chapter="costs">' + (title ? "<title>" + esc(title) + "</title>" : "") + inner + "</g>";
  }
  function cwTitle(r) {
    var s = (r.env && r.env.spec) || {};
    var parts = [cwFeeName(r.key) + sep()];
    if (r.d && typeof r.d.bp === "number") parts.push("≈ " + cwFmtBp(r.d.bp) + t(" bp/边", " bp per side"));
    if (s.unit) parts.push(t("原始 ", "raw ") + (s.rate_raw != null ? s.rate_raw : (s.rate != null ? s.rate : "?")) + " " + s.unit);
    if (r.d && r.d.components) parts.push(t("多项分征费求和", "sum of multiple levies"));
    if (r.d && r.d.tiered) parts.push(t("▸阶梯首档 / 代表档", "▸ first tier / representative tier"));
    if (r.d && r.d.capped) parts.push(t("^设封顶（bp 未扣封顶）", "^ capped (bp not net of the cap)"));
    if (r.d && r.d.approx) parts.push(t("≈按假设成交额折算", "≈ converted using an assumed notional"));
    if (r.d && r.d.raw) parts.push(t("*原文非阿拉伯数字，已人工转写", "* transcribed from non-Arabic source numerals"));
    parts.push("side=" + r.side);
    return parts.join(" · ");
  }

  function renderCostWaterfall(app, params) {
    var list = cache.manifest.exchanges;
    var id = cwResolveId(params);
    var toolbar = '<div class="view-toolbar">' +
      '<label for="cwExchange">市场 Market</label>' +
      '<select id="cwExchange" data-role="cw-exchange">' +
      list.map(function (e) {
        return '<option value="' + esc(e.id) + '"' + (e.id === id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
      }).join("") + "</select>" +
      '<span class="td-tb-note">' + t("左 = 买入侧 · 右 = 卖出侧 · 归一到 bp of 成交额 · 点击任意条看出处",
        "left = buy side · right = sell side · normalised to bp of notional · click any bar for sources") + "</span>" +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">' + t("加载成本瀑布中…", "Loading cost waterfall…") + "</div>";
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "cost-waterfall") || cwResolveId(cur) !== id) return;
      app.innerHTML = toolbar + cwBuild(id, data);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  function cwBuild(id, data) {
    var costs = (data.chapters && data.chapters.costs) || {};
    var ms = (data.chapters && data.chapters.market_structure) || {};
    var n = function (v) { return (+v).toFixed(1); };

    var rows = CW_FEE_ORDER.map(function (key) {
      var env = costs[key] || null;
      var d = cwToBp(env && env.spec);
      return { key: key, env: env, meta: CW_FEE_META[key], d: d, side: cwSide(env && env.spec) };
    });

    var buySum = 0, sellSum = 0, vMax = 0;
    rows.forEach(function (r) {
      if (!r.d || typeof r.d.bp !== "number") return;
      if (r.side !== "sell") buySum += r.d.bp;
      if (r.side !== "buy") sellSum += r.d.bp;
      vMax = Math.max(vMax, r.d.bp);
    });
    vMax = Math.max(vMax, buySum, sellSum, 2);
    var vStep = vMax > 40 ? 10 : vMax > 16 ? 5 : vMax > 8 ? 2 : vMax > 3 ? 1 : 0.5;
    var vTop = Math.ceil(vMax / vStep) * vStep;

    var W = 960, labelW = 118, PL = 14, PR = 14;
    var half = (W - PL - PR - labelW) / 2;
    var cx = PL + labelW + half;
    var PT = 112, rowH = 40, barH = 19, padOut = 54;
    var sc = function (v) { return Math.max(0, v) / vTop * (half - padOut); };
    var totalY = PT + CW_FEE_ORDER.length * rowH + 14;
    var axisY = totalY + rowH + 6;
    var H = axisY + 34;
    var g = [];

    g.push('<defs><pattern id="cwGhost" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="6" height="6" fill="transparent"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--fg-faint)" stroke-width="1.4" opacity="0.55"/></pattern></defs>');

    // 中轴 + 顶部侧标
    g.push('<line x1="' + n(cx) + '" x2="' + n(cx) + '" y1="' + (PT - 22) + '" y2="' + n(axisY + 4) + '" stroke="var(--border-strong)" stroke-width="1.2"/>');
    g.push('<text x="' + n(cx) + '" y="' + (PT - 26) + '" text-anchor="middle" class="cw-0">0</text>');
    g.push('<text x="' + n(cx - 14) + '" y="' + (PT - 26) + '" text-anchor="end" class="cw-side">' + t("← 买入 BUY", "← BUY") + '</text>');
    g.push('<text x="' + n(cx + 14) + '" y="' + (PT - 26) + '" text-anchor="start" class="cw-side">' + t("卖出 SELL →", "SELL →") + '</text>');

    rows.forEach(function (r, i) {
      var y = PT + i * rowH, yc = y + barH / 2 + 4;
      g.push('<text x="' + (PL + labelW - 8) + '" y="' + n(yc) + '" text-anchor="end" class="cw-flabel">' + esc(cwFeeName(r.key)) + '</text>');
      g.push('<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + (y + rowH - 6) + '" y2="' + (y + rowH - 6) + '" stroke="var(--border)" stroke-width="0.5" opacity="0.5"/>');

      if (!r.d) {
        g.push(cwCell(id, r.key,
          '<text x="' + n(cx + 8) + '" y="' + n(yc) + '" class="cw-none">' +
            t("未结构化（本所该费种未填 spec）", "Not structured (no spec recorded for this fee)") + '</text>',
          cwFeeName(r.key) + sep() + t("本所该费种数据尚无结构化 spec，点击看散文字段",
            "no structured spec for this fee at this exchange; click to see the prose field")));
        return;
      }
      if (r.d.none) {
        g.push(cwCell(id, r.key,
          '<rect x="' + n(cx - 26) + '" y="' + n(y + barH / 2) + '" width="52" height="2" fill="var(--border-strong)"/>' +
          '<text x="' + n(cx + 32) + '" y="' + n(yc) + '" class="cw-none">' + t("不征收 / 不适用", "Not levied / N/A") + '</text>',
          cwFeeName(r.key) + sep() + t("本市场不征该费种 / 税目（type: none）",
            "this fee / tax is not levied in this market (type: none)")));
        return;
      }
      [-1, 1].forEach(function (dir) {
        var active = dir < 0 ? r.side !== "sell" : r.side !== "buy";
        if (!active) {
          g.push('<line x1="' + n(cx + dir * 5) + '" x2="' + n(cx + dir * 19) + '" y1="' + n(y + barH / 2 + 1) + '" y2="' + n(y + barH / 2 + 1) +
            '" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="2 2"/>');
          return;
        }
        if (typeof r.d.bp !== "number") {
          var gw = 34;
          g.push(cwCell(id, r.key,
            '<rect x="' + n(dir < 0 ? cx - gw : cx) + '" y="' + n(y + 1) + '" width="' + gw + '" height="' + barH +
            '" fill="url(#cwGhost)" stroke="var(--fg-faint)" stroke-width="1" stroke-dasharray="3 2" opacity="0.85"/>' +
            '<text x="' + n(dir < 0 ? cx - gw - 4 : cx + gw + 4) + '" y="' + n(yc) + '" text-anchor="' + (dir < 0 ? "end" : "start") +
            '" class="cw-ghost-l">' + (r.d.tiered ? t("阶梯·", "Tiered · ") : "") + t("议价/未披露", "negotiated / undisclosed") + '</text>',
            cwTitle(r)));
          return;
        }
        var w = Math.max(1.5, sc(r.d.bp));
        var bx = dir < 0 ? cx - w : cx;
        var mark = (r.d.tiered ? "▸" : "") + (r.d.capped ? "^" : "") + (r.d.approx ? "≈" : "") + (r.d.raw ? "*" : "");
        g.push(cwCell(id, r.key,
          '<rect x="' + n(bx) + '" y="' + n(y + 1) + '" width="' + n(w) + '" height="' + barH + '" fill="' + r.meta.color + '" opacity="0.82"/>' +
          '<text x="' + n(dir < 0 ? bx - 4 : bx + w + 4) + '" y="' + n(yc) + '" text-anchor="' + (dir < 0 ? "end" : "start") +
          '" class="cw-vlab">' + esc(cwFmtBp(r.d.bp) + (mark ? " " + mark : "")) + '</text>',
          cwTitle(r)));
      });
    });

    // 小计行
    g.push('<text x="' + (PL + labelW - 8) + '" y="' + n(totalY + barH / 2 + 4) + '" text-anchor="end" class="cw-flabel cw-total-l">' + t("合计", "Total") + '</text>');
    [[-1, buySum], [1, sellSum]].forEach(function (p) {
      var dir = p[0], v = p[1], w = Math.max(1.5, sc(v));
      var bx = dir < 0 ? cx - w : cx;
      g.push('<rect x="' + n(bx) + '" y="' + n(totalY + 1) + '" width="' + n(w) + '" height="' + barH + '" fill="var(--fg)" opacity="0.86"/>');
      g.push('<text x="' + n(dir < 0 ? bx - 4 : bx + w + 4) + '" y="' + n(totalY + barH / 2 + 4) + '" text-anchor="' + (dir < 0 ? "end" : "start") +
        '" class="cw-vlab cw-total-v">' + cwFmtBp2(v) + ' bp</text>');
    });

    // bp 刻度轴（双向）
    g.push('<line x1="' + n(cx - sc(vTop)) + '" x2="' + n(cx + sc(vTop)) + '" y1="' + n(axisY) + '" y2="' + n(axisY) + '" stroke="var(--border)" stroke-width="1"/>');
    // 循环变量不能叫 t——var 提升会把本模块的 t() 文案助手整个遮蔽掉（ADR-049 踩过的坑）
    for (var tick = 0; tick <= vTop + 0.001; tick += vStep) {
      [-1, 1].forEach(function (dir) {
        if (tick === 0 && dir > 0) return;
        var xx = cx + dir * sc(tick);
        g.push('<line x1="' + n(xx) + '" x2="' + n(xx) + '" y1="' + n(axisY) + '" y2="' + n(axisY + 4) + '" stroke="var(--border-strong)" stroke-width="1"/>');
        g.push('<text x="' + n(xx) + '" y="' + n(axisY + 16) + '" text-anchor="middle" class="cw-tick">' + tick + '</text>');
      });
    }
    g.push('<text x="' + n(cx) + '" y="' + n(axisY + 30) + '" text-anchor="middle" class="cw-axis-name">' +
      t("bp of 成交额（1 bp = 0.01%）· 买卖两侧各自计", "bp of notional (1 bp = 0.01%), counted separately per side") + "</text>");

    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    var rt = buySum + sellSum;
    g.push('<text x="' + PL + '" y="34" class="td-title">' + esc(exName) + t(" · 交易成本瀑布", " · Cost Waterfall") + "</text>");
    var sub;
    if (buySum === 0 && sellSum === 0) {
      sub = t("显性成本按笔 / 按合约计，本所未摘引到可折算为 bp 的费率（见下方各费种）",
        "Explicit costs are charged per trade / per contract; no rate convertible to bp was cited for this exchange (see the fee rows below)");
    } else {
      sub = t("单边显性成本 买 " + cwFmtBp2(buySum) + " bp / 卖 " + cwFmtBp2(sellSum) + " bp　·　往返合计 ≈ " + cwFmtBp2(rt) + " bp" +
        (rt >= 1 ? "（约 " + (rt / 100).toFixed(rt >= 10 ? 2 : 3) + "%）" : ""),
        "One-way explicit cost: buy " + cwFmtBp2(buySum) + " bp / sell " + cwFmtBp2(sellSum) + " bp　·　round trip ≈ " + cwFmtBp2(rt) + " bp" +
        (rt >= 1 ? " (about " + (rt / 100).toFixed(rt >= 10 ? 2 : 3) + "%)" : ""));
    }
    g.push('<text x="' + PL + '" y="55" class="cw-rt">' + esc(sub) + "</text>");
    if (rt > 0 && rt < 2) {
      g.push('<text x="' + PL + '" y="73" class="cw-rt cw-rt-note">' +
        t("按笔显性成本极低；实际成本主要在买卖价差 / 市场冲击，不在本项目覆盖范围",
          "Per-trade explicit cost is very low; the real cost sits in the bid-ask spread / market impact, which is outside this project’s scope") + "</text>");
    }

    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + ' ' + n(H) + '" class="td-svg cw-svg" role="img" aria-label="' +
      esc(exName) + t(" 交易成本瀑布", " cost waterfall") + '">' + g.join("") + "</svg></div>";
    return cwLegend() + cwBanner(ms) + svg + cwCommissionNote(id, data) + cwTaxPanel(id, data) + cwProse();
  }

  function cwBanner(ms) {
    var ref = ms.price_limits && ms.price_limits.main_board && ms.price_limits.main_board.spec && ms.price_limits.main_board.spec.reference;
    if (ref === "prev_settlement") {
      return '<p class="td-banner td-banner-soft">' + t(
        "纯衍生品交易所：费用多按合约计（非按成交额比例），下图 bp 折算仅供参考，多数费种未摘引费率。",
        "Derivatives-only exchange: fees are mostly charged per contract (not as a share of notional), so the bp conversion below is indicative only and no rate was cited for most fee types.") + "</p>";
    }
    return "";
  }

  function cwLegend() {
    var items = CW_FEE_ORDER.map(function (k) {
      return '<span><i class="td-sw" style="background:' + CW_FEE_META[k].color + '"></i>' + esc(cwFeeName(k)) + '</span>';
    }).join("");
    return '<div class="td-legend">' + items +
      '<span><i class="td-sw" style="background:var(--fg);opacity:.86"></i>' + t("买 / 卖合计", "Buy / sell total") + "</span>" +
      '<span><i class="td-sw td-sw-ghost"></i>' + t("幽灵条 = 议价 / 未披露", "Ghost bar = negotiated / undisclosed") + "</span>" +
      '<span class="cw-mk">' + t("▸阶梯首档　^设封顶　≈按假设折算　*原文非阿拉伯数字已人工转写",
        "▸ first tier　^ capped　≈ assumed notional　* transcribed from non-Arabic numerals") + "</span>" +
      "</div>";
  }

  // 佣金说明行（ADR-071）：佣金不进瀑布条——券商议价、20/20 无统一费率、恒幽灵条零对比价值。
  // 但对零售交易者通常是最大的一笔显性成本，图下方留一行说明，点击仍可看 commission_structure 出处。
  function cwCommissionNote(id, data) {
    var costs = (data.chapters && data.chapters.costs) || {};
    var v = dv(costs.commission_structure);
    return '<div class="td-chips-label">' + t("佣金（不在瀑布条内）", "Commission (not a waterfall bar)") + "</div>" +
      '<button type="button" class="cw-tax-line cw-commission-line' + (v ? "" : " td-chip-empty") +
      '" data-role="cell" data-exchange="' + esc(id) + '" data-path="commission_structure" data-chapter="costs" title="' + esc(v || "—") + '">' +
      '<span class="cw-tax-v">' + t(
        "券商与客户议价，不写进交易所 / 清算所规则——对零售交易者通常是最大的一笔显性成本，按覆盖边界不量化。点击看本所佣金结构。",
        "Set by broker-client negotiation, not written into exchange / clearing rules — usually the largest single explicit cost for a retail trader, and not quantified under this project’s coverage boundary. Click for this market’s commission structure.") +
      '</span></button>';
  }

  function cwTaxPanel(id, data) {
    var costs = (data.chapters && data.chapters.costs) || {};
    // 与 chip 同理：标签按 chapter + path 查 taxonomy，不手写第二份英文名
    function line(key) {
      var env = costs[key];
      var v = dv(env);
      return '<button type="button" class="cw-tax-line' + (v ? "" : " td-chip-empty") +
        '" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(key) + '" data-chapter="costs" title="' + esc(v || "—") + '">' +
        '<span class="cw-tax-k">' + esc(fieldLabel("costs", key)) + '</span><span class="cw-tax-v">' +
        esc(v || t("暂缺，见 OPEN-QUESTIONS", "missing, see OPEN-QUESTIONS")) + '</span></button>';
    }
    return '<div class="td-chips-label">' + t("持有 / 退出税（非按笔成本，另计）", "Holding / exit taxes (not per-trade costs, listed separately)") + "</div>" +
      '<div class="cw-tax-lines">' + line("capital_gains_tax") + line("dividend_withholding_tax") + "</div>";
  }

  function cwProse() {
    return '<p class="td-prose">' + t(
      '本图由第十一章 <code>costs.*</code> 的结构化 <code>spec</code> 层驱动（见 ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-045</a>、' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-071</a>）。' +
      '五费种（交易所费 / 清算费 / 监管费 / 印花税 / 金融交易税）为按笔（per-trade）显性成本，按 <code>side</code> 落在买入侧 / 卖出侧 / 双边。各费种原始计量单位不一' +
      '（% / ‰ / bp / 每股 / 每十万 / 定额），此处统一折算为 bp of 成交额：按股 / 定额费种按「假设单笔成交金额 100,000（当地货币）、' +
      '假设股价 50」折算（标 ≈）；阶梯费率取首档 / 代表档（标 ▸）；封顶（标 ^）在该假设成交额下未必触及、bp 未扣封顶；' +
      '原文以非阿拉伯数字给出费率（台湾「千分之三」、南非「0,25%」）的，rate 为人工转写、原文逐字串经校验器 verbatim 反查（标 *）。' +
      '实心条为已摘引官方费率；幽灵虚线条为「费种存在、无可摘引费率」（maker-taker 净费率、市场化议价费等）。' +
      '佣金券商议价、不在交易所规则内，不作瀑布条，见图下方说明。买卖价差等隐性成本按本项目覆盖边界不收录（见 CLAUDE.md）。规则以各交易所官方发布为准，不构成投资建议。',
      'This chart is driven by the structured <code>spec</code> layer of Chapter 11 <code>costs.*</code> (see ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-045</a>, ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-071</a>). ' +
      'The five fee types (exchange, clearing, regulatory, stamp duty, financial transaction tax) are per-trade explicit costs, placed on the buy side / sell side / both according to <code>side</code>. ' +
      'Their native units differ (%, ‰, bp, per share, per lakh, flat), so all are converted here to bp of notional: per-share and flat fees are ' +
      'converted using “assumed notional 100,000 (local currency), assumed share price 50” (marked ≈); tiered rates use the first / a representative ' +
      'tier (marked ▸); caps (marked ^) may not be reached at that assumed notional and are not netted off the bp figure; where the source gives the rate ' +
      'in non-Arabic numerals (Taiwan “per mille three”, South Africa “0,25%”), the rate is a manual transcription and the verbatim source string is ' +
      'reverse-checked by the validator (marked *). Solid bars are officially cited rates; ghost hatched bars are “fee exists, no citable rate” ' +
      '(net maker-taker rates, negotiated fees, etc.). Commission is broker-negotiated and outside exchange rules, so it is not a waterfall bar — see the note below the chart. ' +
      'Implicit costs such as the bid-ask spread are out of scope by this project’s coverage boundary (see CLAUDE.md). Rules are as officially published by each exchange; ' +
      'nothing here is investment advice.') + "</p>";
  }

  // ══════════════════════════════════════════════
  // 交割管线（v2.0 Phase 3 第三棒：设计 ADR-048 / 数据层 ADR-050 / 渲染层本条，见 PROJECT/DECISIONS.md）
  //   双泳道并列，x = 相对交易日天数（T+0…T+N）：
  //   上泳道「现货」 成交 →〔CCP 更替〕→ 净额轧差 · 保证金 → DvP 终局交收（T+N 封口）；
  //   下泳道「衍生品」 成交 → 每日盯市循环 ↻ → 不按比例的「到期」抽象区块 → 最终结算（现金 / 实物）。
  //   纯衍生品所（de-eurex）只画下泳道；第 8 章无衍生品清算数据时下泳道留空（不断言"本所无衍生品"）。
  //   主图下方常驻「违约损失吸收顺序」附图：按 default_management.spec.layers[].order 自上而下堆叠，
  //   按 bearer 上色（违约方红 / CCP 橙 / 存续会员金 / 法定基金灰 / 外部灰蓝）；model: unstructured 走三态占位。
  //   guarantee_model 枚举决定「CCP 介入」节点图形。手写 SVG，不引图表库（ADR-035 C）。
  //   新代码从一开始接语言开关（吸取 ADR-047 教训）：所有文案走 t() / tSel() / enumDisplay()。
  // ══════════════════════════════════════════════
  var SP_DEFAULT_EX = "hk-hkex";
  function spNum(v) { return (+v).toFixed(1); }

  // bearer → 填色（[ADR-048] 轴②：按「谁的钱」上色）。除存续会员金色外均复用既有主题令牌；
  // --sp-gold 为本视图新增（styles.css 三处主题块），保证明暗主题下都与橙色 --warn 可区分。
  var SP_BEARER = {
    defaulter:         { zh: "违约方", en: "Defaulter" },
    ccp:               { zh: "CCP 自有出资（SITG）", en: "CCP capital (SITG)" },
    surviving_members: { zh: "存续会员共担", en: "Surviving members" },
    statutory_fund:    { zh: "法定风险基金", en: "Statutory fund" },
    external:          { zh: "外部授信 / 保险", en: "External credit / insurance" }
  };
  function spBearerFill(b) {
    return b === "defaulter" ? "var(--danger)" :
      b === "ccp" ? "var(--warn)" :
      b === "surviving_members" ? "var(--sp-gold)" :
      b === "statutory_fund" ? "var(--fg-faint)" :
      b === "external" ? "var(--info)" : "var(--border-strong)";
  }
  function spBearerName(b) {
    return b && SP_BEARER[b] ? tSel(SP_BEARER, b) : t("未标注", "unspecified");
  }

  // guarantee_model → 「CCP 介入」节点的短名 + 一句话释义（enums.yml 的 label 偏长，图上另用短名）
  var SP_GM_SHORT = {
    ccp_novation:     { zh: "CCP 更替担保", en: "CCP novation" },
    exchange_as_ccp:  { zh: "交易所即 CCP", en: "Exchange as CCP" },
    lines_of_defence: { zh: "无更替 · 多层防线", en: "No novation · lines of defence" },
    shared_ccp:       { zh: "跨市场共享 CCP", en: "Shared CCP" }
  };
  var SP_GM_GLOSS = {
    ccp_novation:     { zh: "独立法人 CCP 经更替（novation）插入买卖双方之间、做净额担保", en: "An independent CCP is substituted between buyer and seller by novation and guarantees the net position" },
    exchange_as_ccp:  { zh: "交易所自身承担中央对手方的实质角色", en: "The exchange itself performs the central-counterparty role" },
    lines_of_defence: { zh: "现货无 novation，靠会员准入 / 资本监控 / 结算保证金等多层防线", en: "No novation in the cash market; relies on layered defences — member admission, capital monitoring, settlement margin, etc." },
    shared_ccp:       { zh: "跨市场共享的独立 CCP（如 NSCC 覆盖多家美国交易所）", en: "An independent CCP shared across markets (e.g. NSCC covering multiple U.S. exchanges)" }
  };

  function spResolveId(params) {
    var l = cache.manifest.exchanges;
    if (l.some(function (e) { return e.id === params.id; })) return params.id;
    return l.some(function (e) { return e.id === SP_DEFAULT_EX; }) ? SP_DEFAULT_EX : l[0].id;
  }
  function spCell(id, path, inner, title) {
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="clearing">' + (title ? "<title>" + esc(title) + "</title>" : "") + inner + "</g>";
  }
  function spSettleDays(cl) {
    var e = cl.settlement_cycle && cl.settlement_cycle.enum;
    return e === "t0" ? 0 : e === "t1" ? 1 : e === "t3" ? 3 : 2;
  }
  // 下泳道三态：only（纯衍生品所）/ both（有衍生品清算数据）/ none（第 8 章未记录）
  function spDerivState(data) {
    var ms = (data.chapters && data.chapters.market_structure) || {};
    var cl = (data.chapters && data.chapters.clearing) || {};
    var mbRef = ms.price_limits && ms.price_limits.main_board && ms.price_limits.main_board.spec && ms.price_limits.main_board.spec.reference;
    if (mbRef === "prev_settlement") return "only";
    var d = cl.derivatives || {};
    var has = Object.keys(d).some(function (k) {
      var v = d[k];
      return v && typeof v === "object" && (v.zh || v.enum || v.spec);
    });
    return has ? "both" : "none";
  }
  function spClip(s, max) {
    s = String(s == null ? "" : s);
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }
  function spArrow(x1, x2, y, color) {
    return '<line x1="' + spNum(x1) + '" x2="' + spNum(x2 - 5) + '" y1="' + spNum(y) + '" y2="' + spNum(y) +
      '" stroke="' + color + '" stroke-width="1.5"/>' +
      '<path d="M' + spNum(x2) + ' ' + spNum(y) + ' L' + spNum(x2 - 6) + ' ' + spNum(y - 3.6) + ' L' + spNum(x2 - 6) + ' ' + spNum(y + 3.6) + ' Z" fill="' + color + '"/>';
  }
  function spDiamond(x, y, r) {
    return 'M' + spNum(x) + ' ' + spNum(y - r) + ' L' + spNum(x + r) + ' ' + spNum(y) +
      ' L' + spNum(x) + ' ' + spNum(y + r) + ' L' + spNum(x - r) + ' ' + spNum(y) + ' Z';
  }
  function spCcpNode(id, gm, x, y) {
    var label = gm && SP_GM_SHORT[gm] ? tSel(SP_GM_SHORT, gm) : t("CCP 介入", "CCP steps in");
    var gloss = gm && SP_GM_GLOSS[gm] ? tSel(SP_GM_GLOSS, gm) : "";
    var shape;
    if (gm === "lines_of_defence") {
      shape = '<path d="M' + spNum(x) + ' ' + spNum(y - 8) + ' L' + spNum(x + 7) + ' ' + spNum(y - 4) +
        ' L' + spNum(x + 7) + ' ' + spNum(y + 3) + ' Q' + spNum(x) + ' ' + spNum(y + 10) + ' ' + spNum(x - 7) + ' ' + spNum(y + 3) +
        ' L' + spNum(x - 7) + ' ' + spNum(y - 4) + ' Z" fill="none" stroke="var(--fg-muted)" stroke-width="1.6"/>';
    } else if (gm === "exchange_as_ccp") {
      shape = '<path d="' + spDiamond(x, y, 8) + '" fill="var(--info)" opacity="0.9"/>' +
        '<rect x="' + spNum(x - 2.4) + '" y="' + spNum(y - 2.4) + '" width="4.8" height="4.8" fill="var(--bg-elevated)"/>';
    } else if (gm === "shared_ccp") {
      shape = '<path d="' + spDiamond(x, y, 9) + '" fill="none" stroke="var(--accent)" stroke-width="1.4"/>' +
        '<path d="' + spDiamond(x, y, 5) + '" fill="var(--accent)"/>';
    } else if (gm === "ccp_novation") {
      shape = '<path d="' + spDiamond(x, y, 8) + '" fill="var(--accent)"/>';
    } else {
      shape = '<path d="' + spDiamond(x, y, 8) + '" fill="none" stroke="var(--accent)" stroke-width="1.4"/>';
    }
    return spCell(id, "guarantee_model",
      shape +
      '<text x="' + spNum(x) + '" y="' + spNum(y - 14) + '" text-anchor="middle" class="sp-node-t">' + esc(t("CCP 介入", "CCP steps in")) + '</text>' +
      '<text x="' + spNum(x) + '" y="' + spNum(y + 22) + '" text-anchor="middle" class="sp-node-s">' + esc(label) + '</text>',
      t("结算担保模式", "Settlement guarantee model") + sep() + label + (gloss ? " — " + gloss : ""));
  }

  function spLanes(id, data, derivState) {
    var cl = (data.chapters && data.chapters.clearing) || {};
    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    var W = 960, PL = 134, PR = 46, PT = 60;
    var plotW = W - PL - PR;
    var settleDays = spSettleDays(cl);
    var Nmax = Math.max(settleDays, 2);
    var dayX = function (d) { return PL + (d / Nmax) * plotW; };
    var topMid = PT + 44, botMid = topMid + 104;
    var gridTop = PT + 14, gridBot = botMid + 40;
    var H = gridBot + 44;
    var g = [];

    g.push('<text x="14" y="30" class="td-title">' + esc(exName) + esc(t(" · 交割管线", " · Settlement Pipeline")) + '</text>');

    // ── T+k 天数轴 + 竖网格 ──
    for (var d = 0; d <= Nmax; d++) {
      var gx = dayX(d);
      g.push('<line x1="' + spNum(gx) + '" x2="' + spNum(gx) + '" y1="' + spNum(gridTop) + '" y2="' + spNum(gridBot) +
        '" stroke="var(--border)" stroke-width="0.6" opacity="0.7"/>');
      g.push('<text x="' + spNum(gx) + '" y="' + spNum(PT + 2) + '" text-anchor="middle" class="sp-day">T+' + d + '</text>');
    }
    g.push('<text x="' + spNum(W - PR) + '" y="' + spNum(gridBot + 30) + '" text-anchor="end" class="sp-axis-name">' +
      esc(t("相对成交日的营业日", "business days from trade date")) + '</text>');

    // ── 上泳道：现货 ──
    g.push('<text x="' + spNum(PL - 14) + '" y="' + spNum(topMid - 3) + '" text-anchor="end" class="sp-lane-l">' + esc(t("现货", "Cash")) + '</text>');
    g.push('<text x="' + spNum(PL - 14) + '" y="' + spNum(topMid + 10) + '" text-anchor="end" class="sp-lane-s">' + esc(t("T+N 流水线", "T+N pipeline")) + '</text>');
    if (derivState === "only") {
      g.push('<line x1="' + spNum(dayX(0)) + '" x2="' + spNum(dayX(Nmax)) + '" y1="' + spNum(topMid) + '" y2="' + spNum(topMid) +
        '" stroke="var(--fg-faint)" stroke-width="1.2" stroke-dasharray="4 4"/>');
      g.push('<text x="' + spNum((dayX(0) + dayX(Nmax)) / 2) + '" y="' + spNum(topMid - 10) + '" text-anchor="middle" class="sp-empty">' +
        esc(t("本所无现货市场（纯衍生品交易所）", "No cash market (derivatives-only exchange)")) + '</text>');
    } else {
      var sx = dayX(Math.max(settleDays, 1));
      g.push(spArrow(dayX(0), sx, topMid, "var(--border-strong)"));
      g.push('<circle cx="' + spNum(dayX(0)) + '" cy="' + spNum(topMid) + '" r="5" fill="var(--fg)"/>');
      g.push('<text x="' + spNum(dayX(0)) + '" y="' + spNum(topMid + 20) + '" text-anchor="middle" class="sp-node-s">' + esc(t("成交", "Trade")) + '</text>');
      var gm = cl.guarantee_model && cl.guarantee_model.enum;
      g.push(spCcpNode(id, gm, dayX(0) + (sx - dayX(0)) * 0.30, topMid));
      var midx = dayX(0) + (sx - dayX(0)) * 0.58;
      g.push('<line x1="' + spNum(midx) + '" x2="' + spNum(midx) + '" y1="' + spNum(topMid - 5) + '" y2="' + spNum(topMid + 5) + '" stroke="var(--fg-muted)" stroke-width="1.2"/>');
      g.push('<text x="' + spNum(midx) + '" y="' + spNum(topMid + 33) + '" text-anchor="middle" class="sp-node-s">' + esc(t("净额轧差 · 保证金", "Netting · margin")) + '</text>');
      g.push(spCell(id, "settlement_cycle",
        '<rect x="' + spNum(sx - 3.4) + '" y="' + spNum(topMid - 9) + '" width="2.4" height="18" fill="var(--accent)"/>' +
        '<rect x="' + spNum(sx + 1) + '" y="' + spNum(topMid - 9) + '" width="2.4" height="18" fill="var(--accent)"/>' +
        '<text x="' + spNum(sx) + '" y="' + spNum(topMid - 15) + '" text-anchor="middle" class="sp-node-t">' + esc(t("DvP 终局", "DvP final")) + '</text>' +
        '<text x="' + spNum(sx) + '" y="' + spNum(topMid + 22) + '" text-anchor="middle" class="sp-node-s">' +
        esc(settleDays === 0 ? t("当日交收", "same-day") : t("交收 T+", "settles T+") + settleDays) + '</text>',
        t("结算周期", "Settlement cycle") + sep() + (dv(cl.settlement_cycle) || ("T+" + settleDays))));
    }

    // ── 下泳道：衍生品 ──
    g.push('<text x="' + spNum(PL - 14) + '" y="' + spNum(botMid - 3) + '" text-anchor="end" class="sp-lane-l">' + esc(t("衍生品", "Derivatives")) + '</text>');
    g.push('<text x="' + spNum(PL - 14) + '" y="' + spNum(botMid + 10) + '" text-anchor="end" class="sp-lane-s">' + esc(t("盯市循环", "MTM loop")) + '</text>');
    if (derivState === "none") {
      g.push('<line x1="' + spNum(dayX(0)) + '" x2="' + spNum(dayX(Nmax)) + '" y1="' + spNum(botMid) + '" y2="' + spNum(botMid) +
        '" stroke="var(--fg-faint)" stroke-width="1.2" stroke-dasharray="4 4"/>');
      g.push('<text x="' + spNum((dayX(0) + dayX(Nmax)) / 2) + '" y="' + spNum(botMid - 10) + '" text-anchor="middle" class="sp-empty">' +
        esc(t("第 8 章未记录衍生品清算数据（不代表无衍生品市场）", "No derivatives-clearing data in Chapter 8 (does not imply there is no derivatives market)")) + '</text>');
    } else {
      var loopEnd = PL + plotW * 0.48;
      var brk = loopEnd + 12;
      var expX = brk + 16, expW = (W - PR) - expX - 78, expR = expX + expW;
      var finX = expR + 22;
      g.push('<line x1="' + spNum(dayX(0)) + '" x2="' + spNum(loopEnd) + '" y1="' + spNum(botMid) + '" y2="' + spNum(botMid) + '" stroke="var(--border-strong)" stroke-width="1.5"/>');
      g.push('<circle cx="' + spNum(dayX(0)) + '" cy="' + spNum(botMid) + '" r="5" fill="var(--fg)"/>');
      g.push('<text x="' + spNum(dayX(0)) + '" y="' + spNum(botMid + 20) + '" text-anchor="middle" class="sp-node-s">' + esc(t("成交", "Trade")) + '</text>');
      var mtm = cl.derivatives && cl.derivatives.mark_to_market_frequency;
      var mtmTxt = (mtm && ((mtm.zh || "") + " " + (mtm.en || ""))) || "";
      var twice = /两次|twice|two times|2 times|per day two/i.test(mtmTxt);
      var glyph = twice ? "↻↻" : "↻";
      var loopLabel = twice ? t("每日两次盯市", "Twice-daily mark-to-market") : t("每日盯市 · 追收变动保证金", "Daily mark-to-market · variation margin");
      var inner = "";
      for (var k = 1; k <= 3; k++) {
        var lx = dayX(0) + (loopEnd - dayX(0)) * (k / 4);
        inner += '<text x="' + spNum(lx) + '" y="' + spNum(botMid + 5) + '" text-anchor="middle" class="sp-loop">' + glyph + '</text>';
      }
      inner += '<text x="' + spNum((dayX(0) + loopEnd) / 2) + '" y="' + spNum(botMid - 12) + '" text-anchor="middle" class="sp-node-s">' + esc(loopLabel) + '</text>';
      g.push(spCell(id, "derivatives.mark_to_market_frequency", inner,
        t("盯市频率", "Mark-to-market frequency") + sep() + (dv(mtm) ? spClip(dv(mtm), 90) : t("每日", "daily"))));
      g.push('<line x1="' + spNum(brk - 3) + '" x2="' + spNum(brk + 3) + '" y1="' + spNum(botMid + 5) + '" y2="' + spNum(botMid - 5) + '" stroke="var(--fg-faint)" stroke-width="1.2"/>');
      g.push('<line x1="' + spNum(brk + 2) + '" x2="' + spNum(brk + 8) + '" y1="' + spNum(botMid + 5) + '" y2="' + spNum(botMid - 5) + '" stroke="var(--fg-faint)" stroke-width="1.2"/>');
      g.push('<line x1="' + spNum(brk + 8) + '" x2="' + spNum(expX) + '" y1="' + spNum(botMid) + '" y2="' + spNum(botMid) + '" stroke="var(--border-strong)" stroke-width="1.5"/>');
      var ltd = cl.derivatives && cl.derivatives.last_trading_day_rule;
      g.push(spCell(id, "derivatives.last_trading_day_rule",
        '<rect x="' + spNum(expX) + '" y="' + spNum(botMid - 16) + '" width="' + spNum(expW) + '" height="32" rx="4" fill="var(--bg-hover)" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="4 3"/>' +
        '<text x="' + spNum(expX + expW / 2) + '" y="' + spNum(botMid - 1) + '" text-anchor="middle" class="sp-node-t">' + esc(t("到期", "Expiry")) + '</text>' +
        '<text x="' + spNum(expX + expW / 2) + '" y="' + spNum(botMid + 11) + '" text-anchor="middle" class="sp-node-s">' + esc(t("因产品而异 · 不锚定 T+N", "product-specific · not anchored to T+N")) + '</text>',
        t("最后交易日规则", "Last trading day rule") + sep() + (dv(ltd) ? spClip(dv(ltd), 110) : t("因合约而异", "varies by contract"))));
      g.push(spArrow(expR, finX + 4, botMid, "var(--border-strong)"));
      var dm2 = cl.derivatives && cl.derivatives.delivery_method;
      var dme = dm2 && dm2.enum;
      var fLab = dme === "cash" ? t("现金结算", "Cash-settled") : dme === "physical" ? t("实物交割", "Physical delivery") :
        dme === "either" ? t("现金 / 实物", "Cash / physical") : t("最终结算", "Final settlement");
      g.push(spCell(id, "derivatives.delivery_method",
        '<circle cx="' + spNum(finX + 12) + '" cy="' + spNum(botMid) + '" r="5.5" fill="none" stroke="var(--accent)" stroke-width="1.6"/>' +
        '<text x="' + spNum(finX + 12) + '" y="' + spNum(botMid + 20) + '" text-anchor="middle" class="sp-node-s">' + esc(fLab) + '</text>',
        t("交割方式（衍生品）", "Delivery method (derivatives)") + sep() + (dv(dm2) ? spClip(dv(dm2), 90) : fLab)));
    }

    return '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + ' ' + spNum(H) + '" class="td-svg sp-svg" role="img" aria-label="' +
      esc(exName) + esc(t(" 交割管线", " settlement pipeline")) + '">' + g.join("") + '</svg></div>';
  }

  function spWaterfall(id, data) {
    var cl = (data.chapters && data.chapters.clearing) || {};
    var dm = cl.default_management || {};
    var spec = dm.spec || {};
    var model = spec.model;
    var layers = (spec.layers || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var W = 960, badgeX = 34, boxX = 66, boxW = 612, tagX = boxX + boxW + 16;
    var rowH = 42, boxH = 30, body, H;

    if (model === "unstructured" || !layers.length) {
      H = 84;
      body = '<rect x="' + boxX + '" y="16" width="' + (W - boxX - 44) + '" height="46" rx="4" fill="var(--bg-hover)" stroke="var(--border-strong)" stroke-dasharray="4 3"/>' +
        '<text x="' + spNum(boxX + 14) + '" y="37" class="sp-wf-res">' +
        esc(t("机制存在，逐层损失分摊结构未在一手来源逐条呈现", "The mechanism exists, but a layer-by-layer loss-allocation structure is not set out in primary sources")) + '</text>' +
        '<text x="' + spNum(boxX + 14) + '" y="53" class="sp-wf-tag">' + esc(t("点此看散文说明与出处", "click for the prose description and its sources")) + '</text>';
    } else {
      H = layers.length * rowH + 18;
      body = layers.map(function (L, i) {
        var y = 14 + i * rowH, cyc = y + boxH / 2, hasB = !!L.bearer;
        return '<circle cx="' + badgeX + '" cy="' + spNum(cyc) + '" r="11" fill="var(--bg-elevated)" stroke="var(--border-strong)"/>' +
          '<text x="' + badgeX + '" y="' + spNum(cyc + 4) + '" text-anchor="middle" class="sp-wf-ord">' + (L.order || (i + 1)) + '</text>' +
          '<rect x="' + boxX + '" y="' + spNum(y) + '" width="' + boxW + '" height="' + boxH + '" rx="4" fill="' + spBearerFill(L.bearer) +
          '" opacity="' + (hasB ? "0.82" : "0.22") + '"' + (hasB ? "" : ' stroke="var(--border-strong)"') + '/>' +
          '<text x="' + spNum(boxX + 12) + '" y="' + spNum(cyc + 4) + '" class="sp-wf-res">' + esc(spClip(L.resource, 58)) + '</text>' +
          '<text x="' + spNum(tagX) + '" y="' + spNum(cyc + 4) + '" class="sp-wf-tag">' + esc(spBearerName(L.bearer)) + '</text>' +
          (i < layers.length - 1 ? '<path d="M' + badgeX + ' ' + spNum(y + boxH + 2) + ' l 0 ' + spNum(rowH - boxH - 7) +
            ' m -3 -4 l 3 4 l 3 -4" fill="none" stroke="var(--fg-faint)" stroke-width="1.3"/>' : "");
      }).join("");
    }

    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + ' ' + spNum(H) + '" class="td-svg sp-svg" role="img" aria-label="' +
      esc(t("违约损失吸收顺序", "default loss-absorption order")) + '">' +
      spCell(id, "default_management", body,
        t("违约处置与风险共担", "Default management") + sep() + (dv(dm) ? spClip(dv(dm), 120) : "—")) +
      '</svg></div>';
    var note = spec.note ? '<div class="td-prose sp-wf-note">' + zhNoteBlock(esc(t("附注：", "Note: ") + spec.note)) + '</div>' : "";
    return svg + note;
  }

  function spChipEnumRef(path) {
    return path === "guarantee_model" || path === "settlement_cycle" || path === "delivery_method" ? path : null;
  }
  function spChipsBlock(id, data) {
    function chip(path) {
      var env = getByPath(data.chapters.clearing || {}, path);
      var enumRef = spChipEnumRef(path);
      var val = (enumRef && env && env.enum) ? enumDisplay(enumRef, env.enum) : dv(env);
      var has = env && (env.zh || env.enum || env.spec);
      return '<button type="button" class="td-chip' + (has ? "" : " td-chip-empty") +
        '" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) + '" data-chapter="clearing" title="' + esc(dv(env) || "—") + '">' +
        '<span class="td-chip-k">' + esc(fieldLabel("clearing", path)) + '</span>' +
        '<span class="td-chip-v">' + esc(val || t("暂缺", "not recorded")) + '</span></button>';
    }
    return '<div class="td-chips-label">' + t("清算 · 结算关键事实", "Clearing & settlement — key facts") + '</div>' +
      '<div class="td-chips">' + ["guarantee_model", "settlement_cycle", "ccp_name", "csd_name", "delivery_method"].map(chip).join("") + '</div>';
  }

  function spLaneLegend() {
    return '<div class="td-legend">' +
      '<span><i class="sp-lg-dot"></i>' + t("成交", "Trade") + '</span>' +
      '<span><i class="sp-lg-dia"></i>' + t("CCP 介入", "CCP steps in") + '</span>' +
      '<span><i class="sp-lg-seal"></i>' + t("DvP 终局交收", "DvP final settlement") + '</span>' +
      '<span class="sp-lg-loop">↻ ' + t("每日盯市", "daily mark-to-market") + '</span>' +
      '<span><i class="sp-lg-exp"></i>' + t("到期区块（不按比例）", "expiry block (not to scale)") + '</span>' +
      "</div>";
  }
  function spBearerLegend() {
    var items = ["defaulter", "ccp", "surviving_members", "statutory_fund", "external"].map(function (b) {
      return '<span><i class="td-sw" style="background:' + spBearerFill(b) + '"></i>' + esc(spBearerName(b)) + '</span>';
    }).join("");
    return '<div class="td-legend">' + items +
      '<span><i class="td-sw" style="background:var(--border-strong);opacity:.4"></i>' +
      t("非损失吸收层（准入 / 监控等）", "non-loss-absorbing layer (admission / monitoring, etc.)") + '</span></div>';
  }
  function spBanner(derivState) {
    if (derivState === "only") {
      return '<p class="td-banner">' + t(
        "纯衍生品交易所：本所无现货 DvP 交收环节，下方只呈现衍生品泳道与违约瀑布。",
        "Derivatives-only exchange: there is no cash-market DvP settlement leg here; only the derivatives lane and the default waterfall are shown.") + "</p>";
    }
    if (derivState === "none") {
      return '<p class="td-banner td-banner-soft">' + t(
        "本所记录中无独立的衍生品清算数据；下方衍生品泳道留空，不代表本所无衍生品市场。",
        "No separate derivatives-clearing data is on record for this exchange; the derivatives lane below is left blank, which does not imply the exchange has no derivatives market.") + "</p>";
    }
    return "";
  }
  function spProse() {
    return '<div class="td-prose">' + t(
      '本视图由第八章「清算、结算与交割」的 <code>guarantee_model</code> 枚举与 <code>default_management.spec</code> 结构化层驱动（见 ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-048 / ADR-050</a>）。' +
      '上泳道现货 T+N 的天数轴为「相对成交日的营业日」，节点位置示意先后、不表示精确时点；下泳道衍生品的「每日盯市」只示意「每个交易日重复」，' +
      '「到期」区块<strong>不按比例</strong>——衍生品最后交易日因合约而异，不锚定某个 T+N。违约瀑布只结构化「层级顺序 + 每层由谁的钱吸收损失」，不含金额；' +
      '<code>model: unstructured</code> 表示机制存在但一手来源未给出可结构化的干净层级。规则以各交易所官方发布为准，不构成投资建议。',
      'This view is driven by the <code>guarantee_model</code> enum and the structured <code>default_management.spec</code> layer of Chapter 8, ' +
      '“Clearing, Settlement &amp; Delivery” (see ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-048 / ADR-050</a>). ' +
      'On the cash lane, the T+N axis counts business days from the trade date; node positions show sequence, not exact timing. On the derivatives lane, ' +
      'the “daily mark-to-market” glyphs simply mean “repeats every trading day”, and the “expiry” block is <strong>not to scale</strong> — a derivative’s ' +
      'last trading day varies by contract and is not anchored to any T+N. The default waterfall structures only “layer order + whose funds absorb the loss ' +
      'at each layer”, with no amounts; <code>model: unstructured</code> means the mechanism exists but primary sources do not set out a clean layer-by-layer ' +
      'structure. Rules are as officially published by each exchange; nothing here is investment advice.') + "</div>";
  }

  function spBuild(id, data) {
    var derivState = spDerivState(data);
    return spBanner(derivState) +
      spLaneLegend() +
      spLanes(id, data, derivState) +
      '<div class="td-chips-label">' + t("违约损失吸收顺序（自上而下 = 动用先后）", "Default loss-absorption order (top → bottom = order of use)") + "</div>" +
      spBearerLegend() +
      spWaterfall(id, data) +
      spChipsBlock(id, data) +
      spProse();
  }

  function renderSettlementPipeline(app, params) {
    var list = cache.manifest.exchanges;
    var id = spResolveId(params);
    var toolbar = '<div class="view-toolbar">' +
      '<label for="spExchange">市场 Market</label>' +
      '<select id="spExchange" data-role="sp-exchange">' +
      list.map(function (e) {
        return '<option value="' + esc(e.id) + '"' + (e.id === id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
      }).join("") + "</select>" +
      '<span class="td-tb-note">' + t("上 = 现货 T+N · 下 = 衍生品盯市循环 · 点任意节点看出处",
        "top = cash T+N · bottom = derivatives mark-to-market loop · click any node for sources") + "</span>" +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">' + t("加载交割管线中…", "Loading settlement pipeline…") + "</div>";
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "settlement-pipeline") || spResolveId(cur) !== id) return;
      app.innerHTML = toolbar + spBuild(id, data);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  // ══════════════════════════════════════════════
  // 上市生命周期剖面（v2.0 Phase 3 第四棒，ADR-059）
  //   一条水平「证券的一生」时间轴：上市审核 → 上市流程周期 → 挂牌 → 持续义务存续带
  //   →〔停牌/复牌 ↻〕→ 退市触发 →〔触发条件框〕→ 退市流程 → 退市整理期 → 退市后去向。
  //   阶段块等宽示意（一家公司上市多久没有固定值）；唯「上市流程周期」「退市整理期」两块
  //   按 spec 实际月数画填充条（满条 = 9 个月）。诚实三态：缺省虚线框 / type:none 空心点 /
  //   null 斜体灰。纯衍生品所（listing._meta.not_applicable，ADR-036 #5）整图折叠为一行。
  //   每个渲染元素带 data-role="cell"，点击复用 openCellOverlay。
  // ══════════════════════════════════════════════
  var LL_DEFAULT_EX = "hk-hkex";
  // review_system 枚举 label 偏长（"交易所审核+监管机构平行注册"），阶段块里放不下——
  // 图上用短名，全称进 tooltip / 顶栏描述 / 出处浮层。
  var LL_REVIEW_SHORT = {
    registration: { zh: "注册制", en: "Registration" },
    disclosure_with_discretion: { zh: "披露为本", en: "Disclosure-based" },
    dual_track: { zh: "审核 + 平行注册", en: "Review + registration" },
    approval: { zh: "核准制", en: "Approval-based" },
    mixed_by_board: { zh: "分板块不一", en: "Varies by board" }
  };

  function llResolveId(params) {
    var l = cache.manifest.exchanges;
    if (l.some(function (e) { return e.id === params.id; })) return params.id;
    return l.some(function (e) { return e.id === LL_DEFAULT_EX; }) ? LL_DEFAULT_EX : l[0].id;
  }
  function llN(v) { return Math.round(v * 10) / 10; }
  function llCell(id, path, inner, title) {
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="listing">' + (title ? "<title>" + esc(title) + "</title>" : "") + inner + "</g>";
  }
  // CJK 按字数断行、拉丁按空格断行；最多 maxLines 行，超出末行省略号
  function llWrap(s, per, maxLines) {
    s = String(s == null ? "" : s).trim();
    var out = [];
    if (/[一-鿿]/.test(s)) {
      for (var i = 0; i < s.length; i += per) out.push(s.slice(i, i + per));
    } else {
      var cur = "";
      s.split(/\s+/).forEach(function (w) {
        if (cur && (cur + " " + w).length > per) { out.push(cur); cur = w; }
        else cur = cur ? cur + " " + w : w;
      });
      if (cur) out.push(cur);
    }
    if (out.length > maxLines) { out = out.slice(0, maxLines); out[maxLines - 1] = spClip(out[maxLines - 1] + "…", per + 1); }
    return out;
  }
  // 时长 spec → { months, label } | { none: true } | null
  function llDurInfo(env) {
    var sp = env && env.spec;
    if (!sp) return null;
    if (sp.type === "none") return { none: true };
    if (typeof sp.value !== "number") return null;
    var per = { months: 1, weeks: 1 / 4.35, business_days: 1 / 21, trading_days: 1 / 21, calendar_days: 1 / 30.4 }[sp.unit] || 1;
    var unitTxt = ({
      months: t("个月", " mo"), weeks: t(" 周", " wk"), business_days: t(" 个工作日", " business days"),
      trading_days: t(" 个交易日", " trading days"), calendar_days: t(" 日", " days")
    })[sp.unit] || "";
    var lbl = (sp.unit === "months" ? "≈ " + sp.value + " " : sp.value) + unitTxt;
    return { months: sp.value * per, label: lbl.trim() };
  }
  function llBoardName(b) {
    if (state.langMode === "en" && typeof b.name_native === "string" && b.name_native) return b.name_native;
    return b.name_zh || (typeof b.name_native === "string" ? b.name_native : "");
  }

  var LL_BLOCK_H = 30;
  // 阶段块：块内放标题（上）+ 短标签 / 时长条 / 换行正文（下）。全文进 <title>。
  function llPhaseBlock(id, path, x, w, cy, label, opts) {
    opts = opts || {};
    var h = LL_BLOCK_H, y = cy - h / 2;
    var fill = ({ info: "var(--info-soft)", danger: "var(--danger-soft)" })[opts.kind] || "var(--bg-hover)";
    var stroke = ({ info: "var(--info)", danger: "var(--danger)" })[opts.kind] || "var(--border-strong)";
    var g = "";
    var dash = opts.dashed ? ' stroke-dasharray="4 3"' : "";
    var rectFill = opts.hatch ? "url(#ll-hatch)" : fill;
    g += '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + llN(w) + '" height="' + h + '" rx="4" fill="' + rectFill +
      '" stroke="' + stroke + '" stroke-width="1"' + dash + "/>";
    g += '<text x="' + llN(x + w / 2) + '" y="' + llN(y - 7) + '" text-anchor="middle" class="ll-phase-k">' + esc(label) + "</text>";
    if (opts.dur && typeof opts.dur.months === "number") {
      var frac = Math.max(0.04, Math.min(1, opts.dur.months / 9));
      var tw = w - 18, bx = x + 9, by = y + h - 9;
      g += '<rect x="' + llN(bx) + '" y="' + llN(by) + '" width="' + llN(tw) + '" height="3.5" rx="1.8" fill="var(--border)"/>';
      g += '<rect x="' + llN(bx) + '" y="' + llN(by) + '" width="' + llN(tw * frac) + '" height="3.5" rx="1.8" fill="' + stroke + '"/>';
      g += '<text x="' + llN(x + w / 2) + '" y="' + llN(y + 13) + '" text-anchor="middle" class="ll-dur">' + esc(opts.dur.label) + "</text>";
    } else if (opts.durMissing) {
      g += '<text x="' + llN(x + w / 2) + '" y="' + llN(cy + 3.5) + '" text-anchor="middle" class="ll-dur">' + esc(t("未记录", "not recorded")) + "</text>";
    } else if (opts.body && opts.body.length) {
      var by0 = cy + 3.5 - (opts.body.length - 1) * 5;
      opts.body.forEach(function (ln, i) {
        g += '<text x="' + llN(x + w / 2) + '" y="' + llN(by0 + i * 10) + '" text-anchor="middle" class="ll-phase-s">' + esc(ln) + "</text>";
      });
    } else if (opts.sub) {
      var sw = /[一-鿿]/.test(opts.sub) ? Math.floor((w - 10) / 9.5) : Math.floor((w - 10) / 5);
      g += '<text x="' + llN(x + w / 2) + '" y="' + llN(cy + 3.5) + '" text-anchor="middle" class="ll-phase-s">' + esc(spClip(opts.sub, Math.max(4, sw))) + "</text>";
    }
    return path ? llCell(id, path, g, opts.title) : ("<g>" + (opts.title ? "<title>" + esc(opts.title) + "</title>" : "") + g + "</g>");
  }
  function llNode(x, cy, shape, color, kLabel, opts) {
    opts = opts || {};
    var g = "";
    if (shape === "diamond") {
      g += '<path d="M' + llN(x) + " " + llN(cy - 7) + " L" + llN(x + 7) + " " + llN(cy) + " L" + llN(x) + " " + llN(cy + 7) + " L" + llN(x - 7) + " " + llN(cy) + ' Z" fill="' + color + '"/>';
    } else if (shape === "hollow") {
      g += '<circle cx="' + llN(x) + '" cy="' + llN(cy) + '" r="5.5" fill="var(--bg-elevated)" stroke="' + color + '" stroke-width="1.7"/>';
    } else {
      g += '<circle cx="' + llN(x) + '" cy="' + llN(cy) + '" r="5.5" fill="' + color + '"/>';
    }
    if (kLabel) {
      var ky = opts.above ? cy - 14 : cy + 19;
      g += '<text x="' + llN(x) + '" y="' + llN(ky) + '" text-anchor="middle" class="ll-node-k">' + esc(kLabel) + "</text>";
    }
    return g;
  }

  function llCollapsed(id, name) {
    var W = 1180, PR = 40, PL = 80, H = 150, midY = 84;
    return '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + " " + H + '" class="td-svg ll-svg" role="img" aria-label="' +
      esc(t("纯衍生品交易所，无公司上市生命周期", "derivatives-only exchange, no corporate listing lifecycle")) + '">' +
      '<text x="18" y="28" class="ll-title">' + esc(name) + esc(t(" · 上市生命周期", " · Listing Lifecycle")) + "</text>" +
      '<line x1="' + PL + '" y1="' + midY + '" x2="' + (W - PR) + '" y2="' + midY + '" stroke="var(--fg-faint)" stroke-width="1.4" stroke-dasharray="5 4"/>' +
      '<text x="' + W / 2 + '" y="' + (midY - 16) + '" text-anchor="middle" class="ll-empty-strong">' +
      esc(t("衍生品交易所 · 无公司上市生命周期", "Derivatives-only exchange · no corporate listing lifecycle")) + "</text>" +
      '<text x="' + W / 2 + '" y="' + (midY + 22) + '" text-anchor="middle" class="ll-empty">' +
      esc(t("第六章标记「仅现货适用」：整章不计入完成度（ADR-036 #5 / ADR-059）",
        'Chapter 6 flagged "spot-only": excluded from the completeness count (ADR-036 #5 / ADR-059)')) + "</text>" +
      "</svg></div>";
  }

  function llBuild(id, data) {
    var L = (data.chapters && data.chapters.listing) || {};
    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    if (L._meta && L._meta.not_applicable) return llCollapsed(id, exName) + llProse(true);

    var W = 1180, PL = 80, PR = 40;
    var boards = L.boards || [];
    var reviewEnv = L.review_system, lpEnv = L.listing_process_duration;
    var contEnv = L.continuing_obligations, suspEnv = L.suspension_resumption;
    var condEnv = L.delisting_conditions, procEnv = L.delisting_process;
    var transEnv = L.delisting_transition_period, postEnv = L.post_delisting_venue;
    var xferEnv = L.transfer_between_boards;
    var has = function (e) { return e && (e.zh || e.en); };

    var hasCond = !!has(condEnv);
    // 板块阶梯最多画 5 行；超出折成「+N」一行（ch-six 有 11 个板块）
    var boardRows = boards.length > 5 ? boards.slice(0, 4) : boards;
    var boardMore = boards.length - boardRows.length;
    var ladderN = boardRows.length + (boardMore > 0 ? 1 : 0);
    var tierRowH = 13, tierStackH = ladderN * tierRowH;
    var bandY = 66 + (boards.length > 1 ? tierStackH : 18) + 44;
    var calloutTop = bandY + 40, calloutH = 44;
    var axisY = calloutTop + (hasCond ? calloutH : 16) + 24, H = axisY + 24;

    var g = [];
    g.push('<text x="18" y="26" class="ll-title">' + esc(exName) + esc(t(" · 上市生命周期", " · Listing Lifecycle")) + "</text>");
    // 派生一句描述：审核制度 · N 个板块 [· 可转板]
    var desc = [];
    if (reviewEnv && reviewEnv.enum) desc.push(enumDisplay("review_system", reviewEnv.enum));
    else if (has(reviewEnv)) desc.push(spClip(dv(reviewEnv), 18));
    if (boards.length) desc.push(boards.length + t(" 个板块", boards.length === 1 ? " board" : " boards"));
    if (has(xferEnv) && boards.length > 1) desc.push(t("可转板", "transferable"));
    g.push('<text x="18" y="43" class="ll-archetype">' + esc(desc.join(" · ")) + "</text>");

    // ── 横向布局（顺序推进） ──
    var x = PL + 18;
    var reviewX = x, reviewW = 96; x += reviewW + 20;
    var filingX = x, filingW = 104; x += filingW + 18;
    var bandX = x, bandW = 330; x = bandX + bandW;
    var triggerX = x + 16; x += 46;
    var procX = x, procW = 100; x += procW + 22;
    var transInfo = llDurInfo(transEnv);
    var transNone = transInfo && transInfo.none;
    var transX = x, transW = 108;
    x += transNone ? 64 : transW + 22;
    var postX = x, postW = 120; x += postW;
    var spineEnd = x;

    // 连续生命周期基线（挂牌 → 退市后去向）
    g.push('<line x1="' + llN(bandX) + '" y1="' + llN(bandY) + '" x2="' + llN(spineEnd) + '" y2="' + llN(bandY) + '" stroke="var(--border-strong)" stroke-width="1.4"/>');

    // ── 板块阶梯（挂牌点正上方）：多板画阶梯 + 转板箭头；单板一行紧凑标签 ──
    var stackBot = bandY - 22, stackTop = stackBot - tierStackH;
    if (boards.length > 1) {
      var transferable = has(xferEnv);
      g.push('<text x="' + llN(bandX) + '" y="' + llN(stackTop - 6) + '" class="ll-tier">' +
        esc(t("板块体系", "Boards") + (transferable ? t(" · 可转板", " · transferable") : "")) + "</text>");
      boardRows.forEach(function (b, i) {
        var ty = stackTop + i * tierRowH;
        g.push('<rect x="' + llN(bandX) + '" y="' + llN(ty) + '" width="90" height="9" rx="2" fill="var(--info-soft)" stroke="var(--info)" stroke-width="0.8"/>');
        g.push('<text x="' + llN(bandX + 98) + '" y="' + llN(ty + 8) + '" class="ll-tier">' + esc(spClip(llBoardName(b), 11)) + "</text>");
      });
      if (boardMore > 0) {
        var my = stackTop + boardRows.length * tierRowH;
        g.push('<text x="' + llN(bandX + 4) + '" y="' + llN(my + 8) + '" class="ll-tier">+ ' + boardMore + t(" 个板块", " more") + "</text>");
      }
      if (transferable) {
        var axc = bandX - 9;
        g.push('<g><title>' + esc(dv(xferEnv)) + "</title>" +
          '<line x1="' + llN(axc) + '" y1="' + llN(stackTop + 3) + '" x2="' + llN(axc) + '" y2="' + llN(stackBot - 3) + '" stroke="var(--info)" stroke-width="1.3"/>' +
          '<path d="M' + llN(axc - 3) + " " + llN(stackTop + 6) + " L" + llN(axc) + " " + llN(stackTop + 2) + " L" + llN(axc + 3) + " " + llN(stackTop + 6) + '" fill="none" stroke="var(--info)" stroke-width="1.3"/>' +
          '<path d="M' + llN(axc - 3) + " " + llN(stackBot - 6) + " L" + llN(axc) + " " + llN(stackBot - 2) + " L" + llN(axc + 3) + " " + llN(stackBot - 6) + '" fill="none" stroke="var(--info)" stroke-width="1.3"/></g>');
      }
    } else if (boards.length === 1) {
      g.push('<rect x="' + llN(bandX) + '" y="' + llN(stackBot - 10) + '" width="10" height="9" rx="2" fill="var(--info-soft)" stroke="var(--info)" stroke-width="0.8"/>');
      g.push('<text x="' + llN(bandX + 16) + '" y="' + llN(stackBot - 2.5) + '" class="ll-tier">' +
        esc(t("板块：", "Board: ") + spClip(llBoardName(boards[0]), 14)) + "</text>");
    }
    g.push('<line x1="' + llN(bandX) + '" y1="' + llN(stackBot) + '" x2="' + llN(bandX) + '" y2="' + llN(bandY - 7) + '" stroke="var(--border-strong)" stroke-width="0.8" stroke-dasharray="2 2"/>');

    // ── 阶段块：上市审核 ──
    var rEnum = reviewEnv && reviewEnv.enum;
    var rShort = rEnum && LL_REVIEW_SHORT[rEnum] ? tSel(LL_REVIEW_SHORT, rEnum) : (has(reviewEnv) ? dv(reviewEnv) : "");
    g.push(llPhaseBlock(id, "review_system", reviewX, reviewW, bandY, t("上市审核", "Listing review"),
      { kind: "info",
        title: (rEnum ? enumDisplay("review_system", rEnum) + (has(reviewEnv) ? sep() : "") : "") + (has(reviewEnv) ? dv(reviewEnv) : "") || t("未记录", "not recorded"),
        sub: rShort, dashed: !rEnum && !has(reviewEnv) }));

    // ── 阶段块：上市流程周期 ──
    var lpInfo = llDurInfo(lpEnv);
    g.push(llPhaseBlock(id, "listing_process_duration", filingX, filingW, bandY, t("上市流程周期", "Listing process"),
      { kind: "info", title: has(lpEnv) ? dv(lpEnv) : t("未记录", "not recorded"),
        dur: lpInfo && !lpInfo.none ? lpInfo : null,
        sub: !lpInfo && has(lpEnv) ? dv(lpEnv) : "",
        dashed: !has(lpEnv), durMissing: !lpInfo && !has(lpEnv) }));

    // ── 持续义务存续带 ──
    var hasCont = has(contEnv);
    g.push(llCell(id, "continuing_obligations",
      '<rect x="' + llN(bandX) + '" y="' + llN(bandY - 6) + '" width="' + llN(bandW) + '" height="12" rx="3" fill="' +
      (hasCont ? "var(--accent)" : "var(--bg-hover)") + '" opacity="' + (hasCont ? 0.85 : 1) + '"' +
      (hasCont ? "" : ' stroke="var(--border-strong)" stroke-dasharray="4 3"') + "/>",
      t("持续上市义务", "Continuing obligations") + sep() + (hasCont ? spClip(dv(contEnv), 120) : "—")));
    if (!hasCont) {
      g.push('<text x="' + llN(bandX + bandW / 2) + '" y="' + llN(bandY - 12) + '" text-anchor="middle" class="ll-phase-s">' +
        esc(t("持续上市义务（未记录）", "Continuing obligations (not recorded)")) + "</text>");
    }

    // ── 挂牌 / 停复牌 ↻ / 退市触发 ──
    g.push(llNode(bandX, bandY, "solid", "var(--accent)", t("挂牌", "Listed")));
    if (has(suspEnv)) {
      var loopX = bandX + bandW * 0.52;
      g.push(llCell(id, "suspension_resumption",
        '<text x="' + llN(loopX) + '" y="' + llN(bandY + 6) + '" text-anchor="middle" class="ll-loop-glyph">↻</text>' +
        '<text x="' + llN(loopX) + '" y="' + llN(bandY - 16) + '" text-anchor="middle" class="ll-loop-k">' + esc(t("停牌 / 复牌", "Halt / resume")) + "</text>",
        t("停牌 / 复牌规则", "Suspension / resumption") + sep() + spClip(dv(suspEnv), 120)));
    }
    g.push(llNode(triggerX, bandY, "diamond", "var(--danger)", t("退市触发", "Delisting trigger"), { above: true }));

    // ── 退市触发条件（有内容画常驻框；缺省只在触发点下一行灰字，不画空框）──
    if (hasCond) {
      var condTxt = dv(condEnv);
      var cbW = 340, cbX = triggerX - 150;
      if (cbX + cbW > W - PR) cbX = W - PR - cbW;
      if (cbX < PL) cbX = PL;
      g.push('<line x1="' + llN(triggerX) + '" y1="' + llN(bandY + 8) + '" x2="' + llN(triggerX) + '" y2="' + llN(calloutTop) + '" stroke="var(--danger)" stroke-width="0.9"/>');
      g.push(llCell(id, "delisting_conditions",
        '<rect x="' + llN(cbX) + '" y="' + llN(calloutTop) + '" width="' + cbW + '" height="' + calloutH + '" rx="4" fill="var(--danger-soft)" stroke="var(--danger)" stroke-width="0.9"/>' +
        '<text x="' + llN(cbX + 12) + '" y="' + llN(calloutTop + 15) + '" class="ll-callout-k">' + esc(t("退市触发条件", "Delisting triggers")) + "</text>" +
        llWrap(condTxt, state.langMode === "en" ? 64 : 32, 2).map(function (ln, i) {
          return '<text x="' + llN(cbX + 12) + '" y="' + llN(calloutTop + 29 + i * 12) + '" class="ll-callout-v">' + esc(ln) + "</text>";
        }).join(""),
        t("退市条件", "Delisting conditions") + sep() + spClip(condTxt, 140)));
    } else {
      g.push(llCell(id, "delisting_conditions",
        '<text x="' + llN(triggerX) + '" y="' + llN(bandY + 30) + '" text-anchor="middle" class="ll-callout-muted">' +
        esc(t("触发条件未记录", "triggers not recorded")) + "</text>",
        t("退市条件", "Delisting conditions") + sep() + "—"));
    }

    // ── 退市流程 ──
    g.push(llPhaseBlock(id, "delisting_process", procX, procW, bandY, t("退市流程", "Delisting process"),
      { kind: "danger", title: has(procEnv) ? dv(procEnv) : t("未记录", "not recorded"),
        sub: has(procEnv) ? dv(procEnv) : "", dashed: !has(procEnv) }));

    // ── 退市整理期 ──
    if (transNone) {
      var tnx = transX + 26;
      g.push(llCell(id, "delisting_transition_period",
        '<circle cx="' + llN(tnx) + '" cy="' + llN(bandY) + '" r="3" fill="var(--bg-elevated)" stroke="var(--fg-faint)" stroke-width="1.2"/>' +
        '<text x="' + llN(tnx) + '" y="' + llN(bandY - 12) + '" text-anchor="middle" class="ll-phase-s">' + esc(t("无整理期", "No transition")) + "</text>" +
        '<text x="' + llN(tnx) + '" y="' + llN(bandY + 17) + '" text-anchor="middle" class="ll-node-s">' + esc(t("摘牌日停止交易", "trading stops on removal")) + "</text>",
        t("退市整理期", "Transition period") + sep() + (has(transEnv) ? spClip(dv(transEnv), 120) : t("无", "none"))));
    } else {
      g.push(llPhaseBlock(id, "delisting_transition_period", transX, transW, bandY, t("退市整理期", "Transition period"),
        { kind: "danger", hatch: true, title: has(transEnv) ? dv(transEnv) : t("未记录", "not recorded"),
          dur: transInfo && !transInfo.none ? transInfo : null,
          sub: !transInfo && has(transEnv) ? dv(transEnv) : "",
          dashed: !has(transEnv), durMissing: !transInfo && !has(transEnv) }));
    }

    // ── 退市后去向 ──
    var pvTxt = has(postEnv) ? dv(postEnv) : t("去向未记录", "destination not recorded");
    g.push(llPhaseBlock(id, "post_delisting_venue", postX, postW, bandY, t("退市后去向", "After delisting"),
      { title: pvTxt, dashed: !has(postEnv), body: llWrap(pvTxt, state.langMode === "en" ? 18 : 9, 2) }));

    // ── 基线 + 尺度说明 ──
    g.push('<line x1="' + llN(PL) + '" y1="' + llN(axisY) + '" x2="' + llN(spineEnd + 4) + '" y2="' + llN(axisY) + '" stroke="var(--border)" stroke-width="1"/>');
    g.push('<text x="' + llN(PL) + '" y="' + llN(axisY + 18) + '" class="ll-axis-end">' + esc(t("上市前", "pre-listing")) + " →</text>");
    g.push('<text x="' + llN(W - PR) + '" y="' + llN(axisY + 18) + '" text-anchor="end" class="ll-axis-name">' +
      esc(t("证券的一生 · 尺度为年，阶段块不按真实时长比例", "life of a security · years-scale; blocks not to real-time proportion")) + "</text>");

    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + " " + llN(H) + '" class="td-svg ll-svg" role="img" aria-label="' +
      esc(exName) + esc(t(" 上市生命周期", " listing lifecycle")) + '">' +
      '<defs><pattern id="ll-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
      '<rect width="6" height="6" fill="var(--danger-soft)"/>' +
      '<line x1="0" y1="0" x2="0" y2="6" stroke="var(--danger)" stroke-width="1.4" opacity="0.5"/></pattern></defs>' +
      g.join("") + "</svg></div>";
    return llLegend() + svg + llProse(false);
  }

  function llLegend() {
    return '<div class="td-legend">' +
      '<span><i class="td-sw" style="background:var(--accent)"></i>' + t("已挂牌 · 持续义务", "Listed · continuing obligations") + "</span>" +
      '<span><i class="td-sw" style="background:var(--danger)"></i>' + t("退市路径", "Delisting path") + "</span>" +
      '<span class="ll-lg-loop">↻ ' + t("停牌 / 复牌", "Suspension / resumption") + "</span>" +
      '<span><i class="td-sw" style="background:var(--info)"></i>' + t("板块 · 转板", "Boards · transfer") + "</span>" +
      '<span><i class="ll-lg-dash"></i>' + t("缺省 / 不适用（诚实三态）", "blank / N.A. (honest three-state)") + "</span>" +
      "</div>";
  }
  function llProse(collapsed) {
    if (collapsed) {
      return '<div class="td-prose">' + t(
        "本所在数据文件里把第六章《上市、持续监管与退市》整章标记为不适用（<code>_meta.not_applicable</code>）——衍生品交易所不上市公司，对应概念是交易员准入（见「参与者」）与合约挂牌 / 到期（见「产品」「交割管线」）。见 " +
        '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-036 #5 / ADR-059</a>。',
        "This exchange marks the whole of Chapter 6 (“Listing, Continuing Obligations &amp; Delisting”) as not applicable (<code>_meta.not_applicable</code>) — a derivatives exchange does not list corporations; the analogous concepts are trader admission (see “Participants”) and contract listing / expiry (see “Products”, “Settlement”). See " +
        '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-036 #5 / ADR-059</a>.') + "</div>";
    }
    return '<div class="td-prose">' + t(
      "本视图由第六章《上市、持续监管与退市》的字段驱动（见 " +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-059</a>）。' +
      "时间尺度是<strong>一只证券的一生（年）</strong>——与「市场机制剖面」的一个交易日、「交割管线」的成交后 T+N 天构成同一只证券的三级缩放。阶段块只示意先后、<strong>不按真实时长比例</strong>（一家公司上市多久没有固定值）；只有「上市流程周期」「退市整理期」两块画按 <code>spec</code> 实际月数的填充条（满条 = 9 个月）。诚实三态：虚线框 =「尚未填」，空心点 = 规则明确「不设」，斜体灰 =「存在但未公布」。点任意元素看出处。规则以各交易所官方发布为准，不构成投资建议。",
      "This view is driven by Chapter 6 (“Listing, Continuing Obligations &amp; Delisting”; see " +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-059</a>). ' +
      "The time scale is <strong>the life of a security (years)</strong> — a third zoom level alongside the one-trading-day of “Market Mechanics” and the T+N business days of “Settlement”. Phase blocks show sequence only and are <strong>not to real-time scale</strong> (how long a company stays listed has no fixed value); only “Listing process” and “Transition period” carry a fill bar scaled to their <code>spec</code> months (full bar = 9 months). Honest three-state: a dashed block = “not yet filled”, a hollow dot = the rule explicitly sets none, italic grey = “exists but not published”. Click any element for sources. Rules are as officially published by each exchange; nothing here is investment advice.") + "</div>";
  }

  function renderListingLifecycle(app, params) {
    var list = cache.manifest.exchanges;
    var id = llResolveId(params);
    var toolbar = '<div class="view-toolbar">' +
      '<label for="llExchange">市场 Market</label>' +
      '<select id="llExchange" data-role="ll-exchange">' +
      list.map(function (e) {
        return '<option value="' + esc(e.id) + '"' + (e.id === id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
      }).join("") + "</select>" +
      '<span class="td-tb-note">' + t("一只证券的一生：上市审核 → 挂牌 → 持续义务 → 退市 → 去向 · 点任意元素看出处",
        "a security's lifetime: review → listed → obligations → delisting → destination · click any element for sources") + "</span>" +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">' + t("加载上市生命周期中…", "Loading listing lifecycle…") + "</div>";
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "listing-lifecycle") || llResolveId(cur) !== id) return;
      app.innerHTML = toolbar + llBuild(id, data);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  // ══════════════════════════════════════════════
  // 监管图 Regulation Map（v2.0 Phase 3 第五棒，ADR-061）
  //   第三章「监管与法律环境」8 字段的固定槽位「监管截面」单画布：
  //     监管主体（regulator / self_regulatory_org / clearing_regulator）
  //   → 法律基座 core_laws → 外资与资金（foreign_ownership_limit /
  //     capital_controls）→ 透明与保护（disclosure_requirements /
  //     investor_protection）。
  //   本章 8 字段全为散文、无 spec 字段（[ADR-061] 轴 6），故 [ADR-035] D 的
  //   诚实三态退化为「有值实心卡 / 未记录虚线框」两态；点卡片复用 openCellOverlay。
  //   固定槽位：每个字段固定位置、跨 20 家不变，「换所即对比」。
  // ══════════════════════════════════════════════
  var RM_DEFAULT_EX = "sg-sgx";
  function rmResolveId(params) {
    var l = cache.manifest.exchanges;
    if (l.some(function (e) { return e.id === params.id; })) return params.id;
    return l.some(function (e) { return e.id === RM_DEFAULT_EX; }) ? RM_DEFAULT_EX : l[0].id;
  }
  // 折行：CJK 按字数、拉丁按单词，per 由可用像素反推（与 llWrap 同思路）。
  // innerW 传的是整卡宽 w，正文实际从 x+14 起排、右侧还要留白——扣 24px
  // （14 左内边距 + 10 右内边距），否则密排 CJK 长行会越过卡片右沿约 6px
  // （[ADR-061] 渲染层视觉修订，2026-09-03 审查反馈，几何实测）。
  function rmWrap(text, innerW, maxLines) {
    var avail = innerW - 24;
    var per = /[一-鿿]/.test(text)
      ? Math.max(6, Math.floor(avail / 10.5))
      : Math.max(10, Math.floor(avail / 5.6));
    return llWrap(text, per, maxLines);
  }
  // 三张监管机构卡 / 两张闸门卡 / 两张保护卡共用：有值 = 实心 + 左缘色条；
  // 缺省 = 虚线框 + 居中「未记录」。卡整体走 openCellOverlay。
  function rmEnvCard(id, R, path, x, y, w, h, keyColor) {
    var env = R[path] || {};
    var has = !!(env.zh || env.en);
    var inner, titleTxt;
    if (!has) {
      inner = '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + w + '" height="' + h + '" rx="5" fill="none" stroke="var(--fg-faint)" stroke-dasharray="4 3"/>' +
        '<text x="' + llN(x + w / 2) + '" y="' + llN(y + h / 2 + 3.5) + '" text-anchor="middle" class="rm-card-empty">' +
        esc(t("未记录", "not recorded")) + "</text>";
      titleTxt = t("此字段暂无数据（未记录）", "No data recorded for this field");
    } else {
      var text = dv(env) || "";
      var lines = rmWrap(text, w, Math.max(1, Math.floor((h - 36) / 14)));
      var bodyY = y + 36;
      inner = '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--bg-hover)" stroke="var(--border-strong)"/>' +
        '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="3.5" height="' + h + '" fill="' + keyColor + '" rx="1.5"/>' +
        '<text x="' + llN(x + 14) + '" y="' + llN(y + 19) + '" class="rm-card-k">' + esc(fieldLabel("regulation", path)) + "</text>" +
        lines.map(function (ln, i) {
          return '<text x="' + llN(x + 14) + '" y="' + llN(bodyY + i * 14) + '" class="rm-card-v">' + esc(ln) + "</text>";
        }).join("");
      titleTxt = (fieldLabel("regulation", path) + " · ") + (text.length > 200 ? text.slice(0, 200) + "…" : text);
    }
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="regulation">' + "<title>" + esc(titleTxt) + "</title>" + inner + "</g>";
  }
  // 法律基座：core_laws 满宽一条，暖色（--warn）作整图底座
  function rmLawStrip(id, R, path, x, y, w, h) {
    var env = R[path] || {};
    var has = !!(env.zh || env.en);
    var inner, titleTxt;
    if (!has) {
      inner = '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + w + '" height="' + h + '" rx="5" fill="none" stroke="var(--fg-faint)" stroke-dasharray="4 3"/>' +
        '<text x="' + llN(x + w / 2) + '" y="' + llN(y + h / 2 + 3.5) + '" text-anchor="middle" class="rm-card-empty">' +
        esc(t("未记录", "not recorded")) + "</text>";
      titleTxt = t("核心法律法规体系（未记录）", "Core laws — no data recorded");
    } else {
      var text = dv(env) || "";
      var lines = rmWrap(text, w, 2);
      inner = '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--warn-soft)" stroke="var(--warn)"/>' +
        '<text x="' + llN(x + 14) + '" y="' + llN(y + 19) + '" class="rm-law-k">' + esc(fieldLabel("regulation", path)) + "</text>" +
        lines.map(function (ln, i) {
          return '<text x="' + llN(x + 14) + '" y="' + llN(y + 37 + i * 15) + '" class="rm-law-v">' + esc(ln) + "</text>";
        }).join("");
      titleTxt = (fieldLabel("regulation", path) + " · ") + (text.length > 200 ? text.slice(0, 200) + "…" : text);
    }
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="regulation">' + "<title>" + esc(titleTxt) + "</title>" + inner + "</g>";
  }
  // 左槽 lane label（主 + 副，随语言开关）
  function rmLaneLabel(x, y, main, sub) {
    return '<text x="' + (x - 16) + '" y="' + llN(y) + '" text-anchor="end" class="rm-lane-l">' + esc(t(main.zh, main.en)) + "</text>" +
      '<text x="' + (x - 16) + '" y="' + llN(y + 13) + '" text-anchor="end" class="rm-lane-s">' + esc(t(sub.zh, sub.en)) + "</text>";
  }

  function rmLegend() {
    return '<div class="td-legend rm-legend">' +
      '<span><i class="rm-lg-solid"></i>' + t("已填事实", "Filled fact") + "</span>" +
      '<span><i class="rm-lg-dash"></i>' + t("未记录（真实数据缺口）", "Not recorded (genuine data gap)") + "</span>" +
      '<span><i class="rm-lg-key" style="background:var(--info)"></i>' + t("监管主体 · 透明保护", "regulators · disclosure/protection") + "</span>" +
      '<span><i class="rm-lg-key" style="background:var(--accent)"></i>' + t("外资与资金闸门", "foreign access & capital gates") + "</span>" +
      '<span><i class="rm-lg-key" style="background:var(--warn)"></i>' + t("法律基座", "legal basis") + "</span>" +
      "</div>";
  }
  function rmProse() {
    return '<div class="td-prose">' + t(
      '本视图把第三章《监管与法律环境》八个字段压进一屏固定槽位（见 ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-061</a>）。' +
      '自上而下四层 = 交易员接触陌生市场时的一阶问题：谁在管（监管主体）、依什么法（法律基座）、钱怎么进出（外资与资金）、信息透不透明 / 出事赔不赔（透明与保护）。' +
      '槽位固定：同一字段在 20 家交易所位于同一位置，「换所即对比」。本章八个字段全为散文（机构名 / 法名 / 制度描述），无 spec 层——' +
      '<strong>虚线框 = 数据真缺口</strong>（多数在「数据空缺复核轨」[ADR-060] 轨道上），不是渲染问题；点任意卡片看全文与出处。' +
      '规则以各交易所官方发布为准，不构成投资建议。',
      'This view condenses the eight fields of Chapter 3 (“Regulation &amp; Legal Environment”) into one fixed-slot canvas (see ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-061</a>). ' +
      'Top-to-bottom the four lanes answer a trader\'s first-order questions about a new market: who regulates (regulators), under what law (legal basis), ' +
      'how money moves in and out (foreign access &amp; capital), and how transparent / protected the market is (disclosure &amp; protection). ' +
      'Slots are fixed, so the same field sits in the same place across all twenty exchanges. All eight fields are prose (institutions, laws, rule descriptions) with no spec layer — ' +
      '<strong>a dashed box is a genuine data gap</strong> (most sit on the “data-gap track”, ADR-060), not a rendering problem; click any card for the full text and its sources. ' +
      'Rules are as officially published by each exchange; nothing here is investment advice.') + "</div>";
  }
  function rmBuild(id, data) {
    var R = (data.chapters && data.chapters.regulation) || {};
    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    var W = 1180, PL = 150, PR = 44;
    var g = [];
    g.push('<text x="18" y="28" class="rm-title">' + esc(exName) + esc(t(" · 监管图", " · Regulation Map")) + "</text>");

    // 四层纵向槽位（y 固定，不随内容伸缩）
    var rowA = { top: 74, h: 100 };
    var rowB = { top: 200, h: 58 };
    var rowC = { top: 282, h: 100 };
    var rowD = { top: 406, h: 96 };
    var H = rowD.top + rowD.h + 12;
    var cardX1 = PL, cardW3 = Math.floor((W - PR - PL - 48) / 3), gap3 = 24;
    var cardW2 = 480, gap2 = 26;

    // ── 监管主体（谁在管）──
    g.push(rmLaneLabel(PL, rowA.top + 18, { zh: "监管主体", en: "Who regulates" }, { zh: "政府 · 自律 · 清算", en: "govt · SRO · clearing" }));
    ["regulator", "self_regulatory_org", "clearing_regulator"].forEach(function (p, i) {
      g.push(rmEnvCard(id, R, p, cardX1 + i * (cardW3 + gap3), rowA.top, cardW3, rowA.h, "var(--info)"));
    });

    // ── 法律基座（依什么法）──
    g.push(rmLaneLabel(PL, rowB.top + 18, { zh: "法律基座", en: "Legal basis" }, { zh: "核心法律法规", en: "core laws" }));
    g.push(rmLawStrip(id, R, "core_laws", PL, rowB.top, W - PR - PL, rowB.h));

    // ── 外资与资金（钱怎么进出）──
    g.push(rmLaneLabel(PL, rowC.top + 18, { zh: "外资与资金", en: "Foreign access" }, { zh: "进得来？出得去？", en: "capital in · out?" }));
    ["foreign_ownership_limit", "capital_controls"].forEach(function (p, i) {
      g.push(rmEnvCard(id, R, p, cardX1 + i * (cardW2 + gap2), rowC.top, cardW2, rowC.h, "var(--accent)"));
    });

    // ── 透明与保护 ──
    g.push(rmLaneLabel(PL, rowD.top + 18, { zh: "透明与保护", en: "Transparency" }, { zh: "披露 · 赔付", en: "disclosure · safety" }));
    ["disclosure_requirements", "investor_protection"].forEach(function (p, i) {
      g.push(rmEnvCard(id, R, p, cardX1 + i * (cardW2 + gap2), rowD.top, cardW2, rowD.h, "var(--info)"));
    });

    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + " " + llN(H) + '" class="td-svg rm-svg" role="img" aria-label="' +
      esc(exName) + esc(t(" 监管图", " regulation map")) + '">' + g.join("") + "</svg></div>";
    return rmLegend() + svg + rmProse();
  }
  function renderRegulationMap(app, params) {
    var list = cache.manifest.exchanges;
    var id = rmResolveId(params);
    var toolbar = '<div class="view-toolbar">' +
      '<label for="rmExchange">市场 Market</label>' +
      '<select id="rmExchange" data-role="rm-exchange">' +
      list.map(function (e) {
        return '<option value="' + esc(e.id) + '"' + (e.id === id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
      }).join("") + "</select>" +
      '<span class="td-tb-note">' + t("第三章 8 字段固定槽位：谁在管 · 依什么法 · 外资与资金 · 透明与保护 —— 点任意卡片看全文与出处",
        "Chapter 3, 8 fixed slots: who regulates · legal basis · access & capital · disclosure & protection — click any card for full text and sources") + "</span>" +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">' + t("加载监管图中…", "Loading regulation map…") + "</div>";
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "regulation-map") || rmResolveId(cur) !== id) return;
      app.innerHTML = toolbar + rmBuild(id, data);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  // ══════════════════════════════════════════════
  // 参与者图 Participant Map（v2.0 Phase 3 第六棒，ADR-064）
  //   第九章「市场参与者」6 字段的固定槽位「参与者截面」单画布，自上而下三层：
  //     ① 谁在场上 —— investor_structure（跟谁做对手盘：机构 / 散户 / 本地 / 外资）
  //     ② 我怎么进场 —— membership_structure → broker_landscape →
  //        account_opening_requirements → suitability_management 四节点「接入链」，
  //        节点间 → 箭头、链末终点小圆「你」。前两环 --accent（中间机构层）、
  //        后两环 --warn（准入门槛）。
  //     ③ 外资走哪条道 —— foreign_access_channel 平行道，肘形虚线汇入同一终点「你」
  //   本章 6 字段全为散文、无 spec（[ADR-064] 轴 5/7），[ADR-035] D 诚实三态
  //   退化为「有值实心卡 + 左缘色条 / 未记录虚线框」两态；点卡片复用 openCellOverlay。
  //   固定槽位：每个字段固定位置、跨 20 家不变，「换所即对比」。
  //   纯衍生品所（de-eurex）第九章全章适用、无 only_spot（[ADR-064] 轴 8）。
  // ══════════════════════════════════════════════
  var PT_DEFAULT_EX = "hk-hkex";
  function ptResolveId(params) {
    var l = cache.manifest.exchanges;
    if (l.some(function (e) { return e.id === params.id; })) return params.id;
    return l.some(function (e) { return e.id === PT_DEFAULT_EX; }) ? PT_DEFAULT_EX : l[0].id;
  }
  // 折行：CJK 按字数、拉丁按单词，per 由可用像素反推（同 [ADR-061] rmWrap 思路，
  // innerW 传整卡宽、扣 24px 左右内边距）。独立一份，便于各模块单独微调。
  function ptWrap(text, innerW, maxLines) {
    var avail = innerW - 24;
    var per = /[一-鿿]/.test(text)
      ? Math.max(6, Math.floor(avail / 10.5))
      : Math.max(10, Math.floor(avail / 5.6));
    return llWrap(text, per, maxLines);
  }
  // 一张信封卡（满宽 / 接入链节点共用）：有值 = 实心 + 左缘色条 + 角色头 + 折行正文；
  // 缺省 = 虚线框 + 角色头 + 居中斜体「未记录」。卡整体走 openCellOverlay。
  function ptEnvCard(id, P, path, x, y, w, h, keyColor) {
    var env = P[path] || {};
    var has = !!(env.zh || env.en);
    var label = fieldLabel("participants", path);
    var head = '<text x="' + llN(x + 14) + '" y="' + llN(y + 19) + '" class="pt-card-k">' + esc(label) + "</text>";
    var inner, titleTxt;
    if (!has) {
      inner = '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + w + '" height="' + h + '" rx="5" fill="none" stroke="var(--fg-faint)" stroke-dasharray="4 3"/>' +
        head +
        '<text x="' + llN(x + w / 2) + '" y="' + llN(y + h / 2 + 9) + '" text-anchor="middle" class="pt-card-empty">' +
        esc(t("未记录", "not recorded")) + "</text>";
      titleTxt = label + " · " + t("此字段暂无数据（未记录）", "No data recorded for this field");
    } else {
      var text = dv(env) || "";
      var lines = ptWrap(text, w, Math.max(1, Math.floor((h - 34) / 14)));
      inner = '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="' + w + '" height="' + h + '" rx="5" fill="var(--bg-hover)" stroke="var(--border-strong)"/>' +
        '<rect x="' + llN(x) + '" y="' + llN(y) + '" width="3.5" height="' + h + '" fill="' + keyColor + '" rx="1.5"/>' +
        head +
        lines.map(function (ln, i) {
          return '<text x="' + llN(x + 14) + '" y="' + llN(y + 34 + i * 14) + '" class="pt-card-v">' + esc(ln) + "</text>";
        }).join("");
      titleTxt = label + " · " + (text.length > 200 ? text.slice(0, 200) + "…" : text);
    }
    return '<g class="td-hit" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
      '" data-chapter="participants">' + "<title>" + esc(titleTxt) + "</title>" + inner + "</g>";
  }
  function ptLaneLabel(x, y, main, sub) {
    return '<text x="' + (x - 16) + '" y="' + llN(y) + '" text-anchor="end" class="pt-lane-l">' + esc(t(main.zh, main.en)) + "</text>" +
      '<text x="' + (x - 16) + '" y="' + llN(y + 13) + '" text-anchor="end" class="pt-lane-s">' + esc(t(sub.zh, sub.en)) + "</text>";
  }
  function ptLegend() {
    return '<div class="td-legend rm-legend">' +
      '<span><i class="rm-lg-solid"></i>' + t("已填事实", "Filled fact") + "</span>" +
      '<span><i class="rm-lg-dash"></i>' + t("未记录（真实数据缺口）", "Not recorded (genuine data gap)") + "</span>" +
      '<span><i class="rm-lg-key" style="background:var(--info)"></i>' + t("谁在场上", "who's on the floor") + "</span>" +
      '<span><i class="rm-lg-key" style="background:var(--accent)"></i>' + t("接入 · 会员 / 经纪 / 外资", "access · member / broker / foreign") + "</span>" +
      '<span><i class="rm-lg-key" style="background:var(--warn)"></i>' + t("准入门槛 · 开户 / 适当性", "gates · account / suitability") + "</span>" +
      "</div>";
  }
  function ptProse() {
    return '<div class="td-prose">' + t(
      '本视图把第九章《市场参与者》六个字段压进一屏固定槽位（见 ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-064</a>）。' +
      '自上而下三层 = 交易员接触陌生市场时的一阶问题：谁在场上跟我做对手盘（投资者结构）、我怎么才能进场（会员 → 经纪商 → 开户 → 适当性 这条接入链，链末是「你」）、如果我是外资走哪条道（外资通道，一条汇入同一终点的平行道——可在「会员」环直接并入，或整体绕过前几环）。' +
      '槽位固定：同一字段在 20 家交易所位于同一位置，「换所即对比」。本章六个字段全为散文（占比描述 / 机构名 / 法定义务），无 spec 层——' +
      '<strong>虚线框 = 数据真缺口</strong>（多在「数据空缺复核轨」[ADR-060] 轨道上），不是渲染问题；卡内为按卡宽 / 卡高硬裁剪的片段，点任意卡片看全文与出处。' +
      '规则以各交易所官方发布为准，不构成投资建议。',
      'This view condenses the six fields of Chapter 9 (“Market Participants”) into one fixed-slot canvas (see ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-064</a>). ' +
      'Top-to-bottom the three lanes answer a trader\'s first-order questions about a new market: who is on the other side of my trades (investor structure), how I get in at all (the access chain: member firm → broker → account opening → suitability, ending at “you”), and — if I\'m a foreign investor — which lane I take (foreign access, a parallel path that merges into the same endpoint: it may join at the “member” stage or bypass the earlier stages entirely). ' +
      'Slots are fixed, so the same field sits in the same place across all twenty exchanges. All six fields are prose (share-of-turnover descriptions, institution names, statutory duties) with no spec layer — ' +
      '<strong>a dashed box is a genuine data gap</strong> (most sit on the “data-gap track”, ADR-060), not a rendering problem; card text is a fragment clipped to the card, so click any card for the full text and its sources. ' +
      'Rules are as officially published by each exchange; nothing here is investment advice.') + "</div>";
  }
  function ptBuild(id, data) {
    var P = (data.chapters && data.chapters.participants) || {};
    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    var W = 1180, PL = 150, PR = 44, CW = W - PL - PR; // 986
    var g = [];
    g.push('<text x="18" y="26" class="pt-title">' + esc(exName) + esc(t(" · 参与者图", " · Participant Map")) + "</text>");
    g.push('<text x="18" y="42" class="pt-sub">' + esc(t("谁在场上 → 我怎么进场 → 外资走哪条道", "who's on the floor → how you get in → the foreign lane")) + "</text>");

    // ── 层 1 · 谁在场上（investor_structure）──
    var y1 = 66, h1 = 90;
    g.push(ptLaneLabel(PL, y1 + 18, { zh: "谁在场上", en: "Who's here" }, { zh: "投资者结构", en: "investor structure" }));
    g.push(ptEnvCard(id, P, "investor_structure", PL, y1, CW, h1, "var(--info)"));

    // ── 层 2 · 我怎么进场（接入链 4 节点 + 终点「你」）──
    var chain = ["membership_structure", "broker_landscape", "account_opening_requirements", "suitability_management"];
    var y2 = y1 + h1 + 44, h2 = 120;
    var endW = 88, gap = 24;
    var nodeW = Math.floor((CW - endW - chain.length * gap) / chain.length);
    var baseY = y2 + h2 / 2;
    g.push(ptLaneLabel(PL, y2 + 18, { zh: "我怎么进场", en: "How you get in" }, { zh: "会员→经纪→我", en: "member→broker→you" }));
    chain.forEach(function (p, i) {
      var nx = PL + i * (nodeW + gap);
      g.push('<text x="' + llN(nx + 2) + '" y="' + llN(y2 - 5) + '" class="pt-node-n">' + (i + 1) + "</text>");
      g.push(ptEnvCard(id, P, p, nx, y2, nodeW, h2, i < 2 ? "var(--accent)" : "var(--warn)"));
      var ax = nx + nodeW;
      g.push('<path d="M ' + llN(ax + 4) + ' ' + baseY + ' L ' + llN(ax + gap - 3) + ' ' + baseY + '" stroke="var(--fg-faint)" stroke-width="1.5" marker-end="url(#pt-arr)"/>');
    });
    var cx = PL + chain.length * (nodeW + gap) + 22;
    g.push('<text x="' + llN(cx) + '" y="' + llN(baseY - 27) + '" text-anchor="middle" class="pt-lane-s">' + esc(t("终端投资者", "end investor")) + "</text>");
    g.push('<circle cx="' + llN(cx) + '" cy="' + baseY + '" r="17" fill="var(--accent-soft)" stroke="var(--accent)"/>');
    g.push('<text x="' + llN(cx) + '" y="' + llN(baseY + 4) + '" text-anchor="middle" class="pt-end">' + esc(t("你", "you")) + "</text>");

    // ── 层 3 · 外资走哪条道（平行道，肘形汇入同一终点「你」）──
    var y3 = y2 + h2 + 52, h3 = 86;
    var fcW = CW - 132, fcR = PL + fcW;
    g.push(ptLaneLabel(PL, y3 + 18, { zh: "外资走哪条道", en: "Foreign lane" }, { zh: "会员 / 额度 / 互联互通", en: "member / quota / Connect" }));
    g.push(ptEnvCard(id, P, "foreign_access_channel", PL, y3, fcW, h3, "var(--accent)"));
    g.push('<path d="M ' + llN(fcR + 4) + ' ' + llN(y3 + h3 / 2) + ' L ' + llN(cx) + ' ' + llN(y3 + h3 / 2) + ' L ' + llN(cx) + ' ' + llN(baseY + 18) + '" fill="none" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="5 3" marker-end="url(#pt-arr-a)"/>');
    g.push('<text x="' + llN(fcR + 8) + '" y="' + llN(y3 + h3 / 2 - 7) + '" class="pt-conn">' + esc(t("→「你」", "→ you")) + "</text>");
    g.push('<text x="' + llN(PL) + '" y="' + llN(y3 + h3 + 16) + '" class="pt-conn">' + esc(t("外资可在「会员」环直接并入（直接会员），或整体绕过前几环（额度 / 互联互通）", "foreign investors may merge at the 'member' stage, or bypass the earlier stages entirely (quota / Connect)")) + "</text>");

    var H = y3 + h3 + 30;
    var defs = "<defs>" +
      '<marker id="pt-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fg-faint)"/></marker>' +
      '<marker id="pt-arr-a" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"/></marker>' +
      "</defs>";
    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + " " + llN(H) + '" class="td-svg pt-svg" role="img" aria-label="' +
      esc(exName) + esc(t(" 参与者图", " participant map")) + '">' + defs + g.join("") + "</svg></div>";
    return ptLegend() + svg + ptProse();
  }
  function renderParticipantMap(app, params) {
    var list = cache.manifest.exchanges;
    var id = ptResolveId(params);
    var toolbar = '<div class="view-toolbar">' +
      '<label for="ptExchange">市场 Market</label>' +
      '<select id="ptExchange" data-role="pt-exchange">' +
      list.map(function (e) {
        return '<option value="' + esc(e.id) + '"' + (e.id === id ? " selected" : "") + ">" + esc(exchangeDisplayName(e)) + "</option>";
      }).join("") + "</select>" +
      '<span class="td-tb-note">' + t("第九章 6 字段固定槽位：谁在场上 · 接入链（会员 → 经纪 → 开户 → 适当性 → 你）· 外资平行道 —— 点任意卡片看全文与出处",
        "Chapter 9, 6 fixed slots: who's on the floor · access chain (member → broker → account → suitability → you) · the foreign lane — click any card for full text and sources") + "</span>" +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">' + t("加载参与者图中…", "Loading participant map…") + "</div>";
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "participant-map") || ptResolveId(cur) !== id) return;
      app.innerHTML = toolbar + ptBuild(id, data);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }

  // ══════════════════════════════════════════════
  // 出处浮层
  // ══════════════════════════════════════════════
  function openCellOverlay(exchangeId, fieldPath, chapterId) {
    closeOverlay();
    var backdrop = document.createElement("div");
    backdrop.className = "overlay-backdrop";
    backdrop.setAttribute("data-role", "overlay-backdrop");
    backdrop.innerHTML = '<div class="overlay-panel"><button type="button" class="overlay-close" data-role="close-overlay">&times;</button>' +
      '<div class="loading">加载中… Loading…</div></div>';
    document.body.appendChild(backdrop);

    loadExchange(exchangeId).then(function (data) {
      // 用户可能在这次抓取完成前已经点开了别的格子（closeOverlay 会把这个
      // backdrop 从 DOM 移走）——这时不该再把旧请求的结果写进去，否则会有
      // 极小概率把过期数据糊到新打开的浮层上。
      if (!document.body.contains(backdrop)) return;
      var env = getByPath(data.chapters[chapterId], fieldPath);
      var identity = cache.exchangeById[exchangeId];
      var fieldDef = null;
      var chDef = cache.taxonomy.chapters.filter(function (c) { return c.id === chapterId; })[0];
      (chDef.fields || []).forEach(function (f) { if (f.path === fieldPath) fieldDef = f; });

      var html = '<button type="button" class="overlay-close" data-role="close-overlay">&times;</button>';
      html += "<h3>" + esc(fieldDef ? fieldDef.label_zh : fieldPath) +
        ' <span style="font-weight:400;opacity:.6;font-size:13px">' + esc(fieldDef ? fieldDef.label_en : "") + "</span></h3>";
      html += '<div class="overlay-sub">' + esc(identity ? exchangeDisplayName(identity) : exchangeId) + " · " + esc(chDef ? chDef.label_zh + " " + chDef.label_en : chapterId) + "</div>";

      if (env) {
        html += '<div class="overlay-section"><h4>中文 Chinese</h4><div>' + esc(env.zh || "—") + "</div></div>";
        if (env.en) html += '<div class="overlay-section"><h4>英文 English</h4><div>' + esc(env.en) + "</div></div>";
        if (env.detail) {
          html += zhNoteBlock('<div class="overlay-section"><h4>细则 Detail</h4><div class="overlay-detail">' + esc(env.detail) + "</div></div>");
        }
        if (env.spec) {
          var sp = splitSpecNotes(env.spec);
          var noteKeys = Object.keys(sp.notes);
          if (Object.keys(sp.rest).length) {
            html += '<div class="overlay-section"><h4>结构化 Spec</h4><pre class="overlay-spec">' + esc(JSON.stringify(sp.rest, null, 2)) + "</pre></div>";
          }
          if (noteKeys.length) {
            html += zhNoteBlock('<div class="overlay-section"><h4>Spec 注记 Spec note</h4><div class="overlay-detail">' +
              noteKeys.map(function (k) { return esc(sp.notes[k]); }).join("\n") + "</div></div>");
          }
        }
        if (env.quote) html += '<div class="overlay-section"><h4>原文摘录 Quote</h4><div class="overlay-quote">' + esc(env.quote) + "</div></div>";
        if (env.sources && env.sources.length) {
          html += '<div class="overlay-section"><h4>来源 Sources</h4><ul class="overlay-sources">';
          env.sources.forEach(function (s) {
            html += "<li><a href=\"" + esc(s.url) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(s.title || s.url) + "</a>" +
              (s.accessed ? t(" — 访问于 ", " — accessed ") + esc(s.accessed) : "") + "</li>";
          });
          html += "</ul></div>";
        }
        html += '<div class="overlay-section"><h4>状态 Status</h4><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
        if (env.confidence) html += '<span class="badge ' + confBadgeClass(env.confidence) + '">' + confLabel(env.confidence) + "</span>";
        if (env.verified) html += "<span>" + t("核实于 ", "Verified ") + esc(env.verified) + "</span>";
        if (isStale(exchangeId, fieldPath)) html += '<span style="color:var(--warn)">' + t("● 已超过复核阈值", "● Past review threshold") + "</span>";
        html += "</div></div>";
      } else {
        html += '<p style="color:var(--fg-muted)">' + t("此字段暂无数据。", "No data for this field.") + "</p>";
      }

      var panel = backdrop.querySelector(".overlay-panel");
      if (panel) panel.innerHTML = html;
    }).catch(function (e) {
      if (!document.body.contains(backdrop)) return;
      var panel = backdrop.querySelector(".overlay-panel");
      if (panel) panel.innerHTML = '<button type="button" class="overlay-close" data-role="close-overlay">&times;</button>' +
        '<p style="color:var(--danger)">' + t("加载失败：", "Failed to load: ") + esc(e.message) + "</p>";
    });
  }
  function closeOverlay() {
    $all(".overlay-backdrop").forEach(function (n) { n.remove(); });
  }

  // ══════════════════════════════════════════════
  // 主题 / 语言模式开关
  // ══════════════════════════════════════════════
  function applyTheme() {
    if (state.theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", state.theme);
  }
  function toggleTheme() {
    var order = ["system", "light", "dark"];
    state.theme = order[(order.indexOf(state.theme) + 1) % order.length];
    localStorage.setItem("ea-theme", state.theme);
    applyTheme();
  }
  function applyLang() {
    var en = state.langMode === "en";
    var root = document.documentElement;
    // <html lang> 与 <html data-lang> 一起设：前者给浏览器 / 读屏 / 搜索引擎，
    // 后者给 styles.css 切 .i18n-zh / .i18n-en（方案 D）。
    root.lang = en ? "en" : "zh-CN";
    root.setAttribute("data-lang", state.langMode);
    // 按钮显示的是「当前数据语言」本身（zh 态「中文」/ en 态 "English"），不是需要
    // 双语并列的 UI 标签——写成 "中文 Chinese" 反而不知所云，故行内标 i18n-exempt。
    $("#langToggle").textContent = en ? "English" : "中文"; // i18n-exempt
    // title= 提示：HTML 属性塞不下双 span，改由 index.html 的 data-title-zh / data-title-en 驱动。
    // <title> 元素也挂同一对属性，但它要设的是 document.title（浏览器标签页 / 搜索结果），
    // 不是自身的 title 属性——单独分流。
    $all("[data-title-zh]").forEach(function (el) {
      var val = en ? (el.dataset.titleEn || el.dataset.titleZh) : el.dataset.titleZh;
      if (el.tagName === "TITLE") document.title = val;
      else el.title = val;
    });
  }
  function toggleLang() {
    state.langMode = state.langMode === "zh" ? "en" : "zh";
    localStorage.setItem("ea-lang", state.langMode);
    applyLang();
    route();
  }

  // ══════════════════════════════════════════════
  // 路由
  // ══════════════════════════════════════════════
  function updateActiveTab(view) {
    $all(".tab-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.view === view); });
  }
  function route() {
    closeOverlay();
    var params = parseHash();
    var view = params.view || "trading-day";
    updateActiveTab(view === "exchange" ? "matrix" : view);
    var app = $("#app");
    if (view === "exchange") renderExchange(app, params);
    else if (view === "health") renderHealth(app, params);
    else if (view === "timezone") renderTimezone(app, params);
    else if (view === "matrix") renderMatrix(app, params);
    else if (view === "cost-waterfall") renderCostWaterfall(app, params);
    else if (view === "settlement-pipeline") renderSettlementPipeline(app, params);
    else if (view === "listing-lifecycle") renderListingLifecycle(app, params);
    else if (view === "regulation-map") renderRegulationMap(app, params);
    else if (view === "participant-map") renderParticipantMap(app, params);
    else renderTradingDay(app, params);
  }

  // ══════════════════════════════════════════════
  // 事件委托
  // ══════════════════════════════════════════════
  document.addEventListener("click", function (e) {
    // 点击遮罩本身（不是里面的面板）关闭浮层——必须在 data-role 分派之前单独判断，
    // 否则面板内部没有 data-role 的普通文字（如摘录段落）点击后，
    // closest("[data-role]") 会一路冒泡穿过面板找到外层遮罩的 data-role，误触发关闭。
    if (e.target.classList && e.target.classList.contains("overlay-backdrop")) {
      closeOverlay();
      return;
    }
    // 变量名避开 t——它会遮蔽模块级 t() 文案助手（ADR-049 踩过的坑）
    var hit = e.target.closest("[data-role]");
    if (!hit) return;
    var role = hit.dataset.role;
    if (role === "cell" || role === "goto-health-field") {
      openCellOverlay(hit.dataset.exchange, hit.dataset.path, hit.dataset.chapter);
    } else if (role === "td-ghost") {
      // 机制核心面板透视开关（ADR-055）：切 .td-plot-wrap 的 td-ghost 类 + 持久化
      var gon = hit.getAttribute("aria-pressed") !== "true";
      try { localStorage.setItem("ea-td-ghost", gon ? "1" : "0"); } catch (err) { /* 隐私模式忽略 */ }
      var gwrap = hit.closest(".td-plot-wrap");
      if (gwrap) gwrap.classList.toggle("td-ghost", gon);
      hit.setAttribute("aria-pressed", gon ? "true" : "false");
      hit.textContent = gon ? "●" : "◐";
      hit.title = gon ? t("恢复面板", "Restore panel")
        : t("透视面板：露出零轴 / 熔断线 / 走廊", "See-through: reveal zero line, halts, corridor");
    } else if (role === "close-overlay") {
      closeOverlay();
    } else if (role === "group") {
      var params = parseHash();
      params.view = "matrix";
      params.group = hit.dataset.group;
      setHash(params);
    } else if (role === "goto-chapter") {
      var p2 = parseHash();
      p2.ch = hit.dataset.ch;
      setHash(p2);
    } else if (role === "goto-exchange") {
      // 交由默认 <a href> 行为处理 hash 跳转
    }
  });
  document.addEventListener("change", function (e) {
    var role = e.target.dataset && e.target.dataset.role;
    if (role === "region") {
      var params = parseHash();
      params[role] = e.target.value;
      setHash(params);
    } else if (role === "health-exchange" || role === "health-type") {
      var p3 = parseHash();
      p3[role === "health-exchange" ? "hex" : "htype"] = e.target.value;
      setHash(p3);
    } else if (role === "td-exchange") {
      setHash({ view: "trading-day", id: e.target.value });
    } else if (role === "cw-exchange") {
      setHash({ view: "cost-waterfall", id: e.target.value });
    } else if (role === "sp-exchange") {
      setHash({ view: "settlement-pipeline", id: e.target.value });
    } else if (role === "ll-exchange") {
      setHash({ view: "listing-lifecycle", id: e.target.value });
    } else if (role === "rm-exchange") {
      setHash({ view: "regulation-map", id: e.target.value });
    } else if (role === "pt-exchange") {
      setHash({ view: "participant-map", id: e.target.value });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOverlay();
  });

  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#langToggle").addEventListener("click", toggleLang);
  $all(".tab-btn").forEach(function (b) {
    b.addEventListener("click", function () { setHash({ view: b.dataset.view }); });
  });

  // ══════════════════════════════════════════════
  // 启动
  // ══════════════════════════════════════════════
  applyTheme();
  applyLang();
  loadCore()
    .then(function () {
      window.addEventListener("hashchange", route);
      if (!location.hash) setHash({ view: "trading-day" }, true);
      route();
    })
    .catch(function (e) {
      $("#app").innerHTML = '<p style="color:var(--danger)">' + t("数据加载失败：", "Failed to load data: ") + esc(e.message) +
        t("（先跑 make build 生成 docs/data/）", " (run `make build` first to generate docs/data/)") + "</p>";
    });
})();
