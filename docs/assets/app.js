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
      cache.freshness = r[3].fields;
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
  // 把价格限制 + 熔断 + 回转三件核心事实综述成 1–3 行短句，放在平面中央
  function tdHeadlineParts(ms, yRef) {
    var out = [];
    var s = ms.price_limits && ms.price_limits.main_board && ms.price_limits.main_board.spec;
    if (s) {
      if (typeof s.limit_pct === "number") out.push(t("当日价格限制 ±" + s.limit_pct + "%（相对" + yRef + "）", "Daily price limit ±" + s.limit_pct + "% (vs " + yRef + ")"));
      else if (typeof s.limit_pct_up === "number" || typeof s.limit_pct_down === "number") {
        out.push(t("当日涨跌停 +" + (s.limit_pct_up != null ? s.limit_pct_up : "?") + "% / −" +
          (s.limit_pct_down != null ? Math.abs(s.limit_pct_down) : "?") + "%",
          "Daily limit up +" + (s.limit_pct_up != null ? s.limit_pct_up : "?") + "% / down −" +
          (s.limit_pct_down != null ? Math.abs(s.limit_pct_down) : "?") + "%"));
      } else if (s.type === "stepwise") out.push(t("阶梯值幅：涨跌幅随基准价分档", "Stepwise limits: the band depends on the base price"));
      else if (s.type === "dynamic" && typeof s.band_pct === "number") out.push(t("动态价格带 ±" + s.band_pct + "%（随参考价滚动）", "Dynamic price band ±" + s.band_pct + "% (rolling reference price)"));
      else if (s.type === "dynamic") out.push(t("设动态价格带，档位官方未公布", "Dynamic price band in place; thresholds not published"));
      else if (s.type === "none") out.push(t("无每日涨跌停墙", "No daily price limit wall"));
      else out.push(t("价格限制按品种 / 证券分类分档", "Price limits are tiered by instrument / security class"));
    }
    var c = ms.circuit_breaker && ms.circuit_breaker.spec;
    if (c) {
      if (c.type === "index_level" && c.levels) {
        var ts = c.levels.filter(function (l) { return typeof l.threshold_pct === "number"; })
          .map(function (l) { return l.threshold_pct; });
        var idxNames = (c.reference || []).map(function (r) { return r.index; }).filter(Boolean);
        if (ts.length) {
          // 注意是 > 1：只有单一参考指数时，中文一律说「指数」，不写指数名（保持 HEAD 原行为）
          var zo = idxNames.length > 1 ? idxNames.join(t(" 或 ", " or ")) + " " : t("指数", "the index");
          out.push(t(zo + "跌 " + ts.join("/") + "% 触发全市场熔断",
            "A " + ts.join("/") + "% fall in " + zo.trim() + " triggers a market-wide halt"));
        }
      } else if (c.type === "none") out.push(t("无全市场熔断", "No market-wide circuit breaker"));
      else if (c.type === "contract_level") out.push(t("无全市场熔断；合约级波动中断可扩至全合约暂停", "No market-wide circuit breaker; contract-level volatility interruptions may extend to all contracts"));
      else if (c.type === "stock_level") out.push(t("无全市场熔断；靠个股 / 品种级波动中断（见下方「熔断」）", "No market-wide circuit breaker; relies on stock / instrument-level volatility interruptions (see Circuit breaker below)"));
    }
    var ir = ms.intraday_reversal;
    var irm = {
      t0: { zh: "当日可回转（T+0）", en: "Same-day reversal allowed (T+0)" },
      t1: { zh: "T+1：当日买入次日才可卖", en: "T+1: shares bought today can only be sold the next day" },
      t2: { zh: "T+2 交收", en: "T+2 settlement" },
      mixed: { zh: "回转交易分品种不同", en: "Reversal rules differ by instrument" },
    };
    if (ir && irm[ir.enum]) out.push(tSel(irm, ir.enum));
    return out;
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

    // ── 中心信息卡：把「本市场日内价格受什么约束」这一核心事实用一句话放在中央
    //    （ADR-040 收口审查反馈：中心大量留白 → 用它承载 30 秒看懂的结论）──
    var head = tdHeadlineParts(ms, yRef);
    if (head.length) {
      var hcx = PL + pw / 2, hcw = Math.min(pw - 40, 404), hlh = 21;
      var hcy = PT + ph * 0.17, hch = head.length * hlh + 15;
      g.push('<rect x="' + n(hcx - hcw / 2) + '" y="' + n(hcy) + '" width="' + n(hcw) + '" height="' + n(hch) +
        '" rx="7" fill="var(--bg-elevated)" fill-opacity="0.9" stroke="var(--border)"/>');
      head.forEach(function (line, i) {
        g.push('<text x="' + n(hcx) + '" y="' + n(hcy + 15 + i * hlh) + '" text-anchor="middle" class="td-head' +
          (i === 0 ? " td-head-1" : "") + '">' + esc(line) + "</text>");
      });
    }
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

    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" class="td-svg" role="img" aria-label="' +
      esc(exName) + t(" 市场机制剖面", " market mechanics profile") + '">' + g.join("") + "</svg></div>";
    return tdLegend() + svg + tdSidePanels(id, data) + tdProse();
  }

  // 标注层 chips（ADR-035 A：撮合原则 / 订单类型 / 做空 / 做市商 → 标注层）+ 非现货降级提示
  function tdSidePanels(id, data) {
    var ms = (data.chapters && data.chapters.market_structure) || {};
    var costs = (data.chapters && data.chapters.costs) || {};
    var clearing = (data.chapters && data.chapters.clearing) || {};
    var out = [];
    var mbRef = ms.price_limits && ms.price_limits.main_board && ms.price_limits.main_board.spec && ms.price_limits.main_board.spec.reference;
    var hasDeriv = ms.derivatives && Object.keys(ms.derivatives).some(function (k) {
      var v = ms.derivatives[k];
      function content(o) {
        if (!o || typeof o !== "object") return false;
        if (o.zh || o.enum || o.spec) return true;
        return Object.keys(o).some(function (kk) { return ["zh", "en", "quote", "sources", "detail", "confidence", "verified", "enum", "spec", "_meta"].indexOf(kk) < 0 && content(o[kk]); });
      }
      return content(v);
    });
    if (mbRef === "prev_settlement") {
      out.push(t(
        '<p class="td-banner">纯衍生品交易所：y 轴基准为<strong>前结算价</strong>，第五章字段描述衍生品市场（ADR-035 E）。</p>',
        '<p class="td-banner">Derivatives-only exchange: the y axis is benchmarked to the <strong>previous settlement price</strong>, and Chapter 5 fields describe the derivatives market (ADR-035 E).</p>'));
    } else if (hasDeriv) {
      out.push(t(
        '<p class="td-banner td-banner-soft">本所记录含衍生品市场字段；本剖面显示<strong>现货</strong>（衍生品 spec 待 Phase 3 补充）。</p>',
        '<p class="td-banner td-banner-soft">This exchange has derivatives-market fields on record; this profile shows the <strong>cash market</strong> (derivatives specs are pending Phase 3).</p>'));
    }

    // val 传完整串；CSS 用 -webkit-line-clamp 截断到 2 行，title 给完整内容。
    // chapter 默认第五章；成本 / 清算等跨章字段传对应 chapter，浮层据此取值。
    // chip 名不再由调用方传：按 chapter + path 到 taxonomy 查字段标签的 zh/en，
    // 省掉「同一标签两处手写」（CLAUDE.md §一）。
    function chip(path, val, env, chapter) {
      var has = env && (env.zh || env.enum || env.spec);
      val = String(val == null || val === "" ? "—" : val);
      return '<button type="button" class="td-chip' + tdConfClass(env) + (has ? "" : " td-chip-empty") +
        '" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) +
        '" data-chapter="' + esc(chapter || "market_structure") + '" title="' + esc(val) + '">' +
        '<span class="td-chip-k">' + esc(fieldLabel(chapter || "market_structure", path)) + '</span><span class="td-chip-v">' + esc(val) + '</span></button>';
    }

    var chips = [];
    var pt = getByPath(ms, "price_limits.type");
    chips.push(chip("price_limits.type", pt && pt.enum ? enumDisplay("price_limit_type", pt.enum) : dv(pt), pt));
    // 熔断 chip：指数级 / 无 → 枚举标签（档位见中心卡与平面线）；
    //           个股 / 合约级 → 直接展示机制描述（spec.note 优先，收口审查反馈：要「具体信息」）
    // 英文模式下数据信封的 en 优先于 spec.note（note 是中文散文，见 F3）
    var cbf = ms.circuit_breaker, cbfS = cbf && cbf.spec, cbv;
    if (cbfS && (cbfS.type === "stock_level" || cbfS.type === "contract_level")) {
      cbv = (state.langMode === "en" && cbf && cbf.en) ? cbf.en : (cbfS.note || (cbf && cbf.zh));
    } else if (cbf && cbf.enum) cbv = enumDisplay("circuit_breaker_type", cbf.enum);
    else cbv = dv(cbf);
    chips.push(chip("circuit_breaker", cbv, cbf));
    var mp = ms.matching_principle;
    chips.push(chip("matching_principle", mp && mp.enum ? enumDisplay("matching_principle", mp.enum) : dv(mp), mp));
    var ot = ms.order_types;
    chips.push(chip("order_types", dv(ot), ot));
    var ss = ms.short_selling;
    chips.push(chip("short_selling", ss && ss.enum ? enumDisplay("short_selling_stance", ss.enum) : dv(ss), ss));
    var mm = ms.market_maker_scheme, mmS = mm && mm.spec;
    var mmv = mmS && mmS.present === true ? (t("有", "Yes") + (mmS.quote_obligation ? t(" · 强制双边报价", " · mandatory two-sided quotes") : "")) :
      (mmS && mmS.present === false ? t("无", "No") : dv(mm));
    chips.push(chip("market_maker_scheme", mmv, mm));
    var vic = ms.volatility_interruption, vicS = vic && vic.spec;
    var vicv;
    if (vicS && vicS.type === "none") vicv = t("无独立层", "No separate layer");
    else if (vicS && (typeof vicS.dynamic_pct === "number" || typeof vicS.static_pct === "number")) {
      vicv = t("走廊 ", "Corridor ") + "±" + [vicS.dynamic_pct, vicS.static_pct].filter(function (x) { return typeof x === "number"; }).join("/") + "%";
    } else vicv = dv(vic);
    chips.push(chip("volatility_interruption", vicv, vic));

    out.push('<div class="td-chips-label">' + t("交易机制", "Trading Mechanics") + '</div><div class="td-chips">' + chips.join("") + "</div>");

    // ── 交易细则 · 成本 · 特殊安排（收口审查反馈：tick size / 费用 / 特殊规则 也上主图）──
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
    out.push('<div class="td-chips-label">' + t("交易细则 · 成本", "Trading Rules · Costs") + '</div><div class="td-chips">' + chips2.join("") + "</div>");

    return out.join("");
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
  // 交易成本瀑布（v2.0 Phase 3 第二棒：数据层 ADR-045 / 渲染层 ADR-047，见 PROJECT/DECISIONS.md）
  //   镜像双瀑布：中轴 = 0 bp；左半 = 买入侧、右半 = 卖出侧，向中间对齐。
  //   六费种（佣金 / 交易所费 / 清算费 / 监管费 / 印花税 / 金融交易税）逐行，
  //   spec.side（buy/sell/both）决定落在哪一侧；底部买 / 卖小计 + 往返合计。
  //   数据源：第十一章 costs.* 的 spec 层（cost_layer 形状：rate + unit + side +
  //   components / tiered / cap / type:none / rate:null）。归一到 bp 在渲染层做（ADR-045 轴③）。
  //   诚实三态：rate 有值 → 实心条 + bp 数；rate:null → 幽灵虚线条 +「议价 / 未披露」；
  //   type:none → 中轴细线 +「不征收」。资本利得税 / 股息预扣税为持有 / 退出税，
  //   非按笔成本，另列图下方（ADR-045 轴①）。手写 SVG，不引图表库。
  // ══════════════════════════════════════════════
  var CW_DEFAULT_EX = "hk-hkex";
  var CW_ASSUMED_NOTIONAL = 100000; // 单笔成交金额（当地货币），折算定额 / 按笔费种
  var CW_ASSUMED_PRICE = 50;        // 单股价格（当地货币），折算按股费种
  var CW_FEE_ORDER = ["commission_structure", "exchange_fees", "clearing_fees", "regulatory_fees", "stamp_duty", "financial_transaction_tax"];
  var CW_FEE_META = {
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
    return { bp: bp, tiered: !!spec.tiered, capped: spec.cap != null, components: !!comps, approx: approx };
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
    if (s.unit) parts.push(t("原始 ", "raw ") + (s.rate != null ? s.rate : "?") + " " + s.unit);
    if (r.d && r.d.components) parts.push(t("多项分征费求和", "sum of multiple levies"));
    if (r.d && r.d.tiered) parts.push(t("▸阶梯首档 / 代表档", "▸ first tier / representative tier"));
    if (r.d && r.d.capped) parts.push(t("^设封顶（bp 未扣封顶）", "^ capped (bp not net of the cap)"));
    if (r.d && r.d.approx) parts.push(t("≈按假设成交额折算", "≈ converted using an assumed notional"));
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
        var mark = (r.d.tiered ? "▸" : "") + (r.d.capped ? "^" : "") + (r.d.approx ? "≈" : "");
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
    return cwLegend() + cwBanner(ms) + svg + cwTaxPanel(id, data) + cwProse();
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
      '<span class="cw-mk">' + t("▸阶梯首档　^设封顶　≈按假设折算", "▸ first tier　^ capped　≈ assumed notional") + "</span>" +
      "</div>";
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
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-045</a>）。' +
      '六费种为按笔（per-trade）显性成本，按 <code>side</code> 落在买入侧 / 卖出侧 / 双边。各费种原始计量单位不一' +
      '（% / ‰ / bp / 每股 / 每十万 / 定额），此处统一折算为 bp of 成交额：按股 / 定额费种按「假设单笔成交金额 100,000（当地货币）、' +
      '假设股价 50」折算（标 ≈）；阶梯费率取首档 / 代表档（标 ▸）；封顶（标 ^）在该假设成交额下未必触及、bp 未扣封顶。' +
      '实心条为已摘引官方费率；幽灵虚线条为「费种存在、无可摘引费率」（市场化议价的佣金、maker-taker 净费率等）。' +
      '买卖价差等隐性成本按本项目覆盖边界不收录（见 CLAUDE.md）。规则以各交易所官方发布为准，不构成投资建议。',
      'This chart is driven by the structured <code>spec</code> layer of Chapter 11 <code>costs.*</code> (see ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-045</a>). ' +
      'The six fee types are per-trade explicit costs, placed on the buy side / sell side / both according to <code>side</code>. ' +
      'Their native units differ (%, ‰, bp, per share, per lakh, flat), so all are converted here to bp of notional: per-share and flat fees are ' +
      'converted using “assumed notional 100,000 (local currency), assumed share price 50” (marked ≈); tiered rates use the first / a representative ' +
      'tier (marked ▸); caps (marked ^) may not be reached at that assumed notional and are not netted off the bp figure. Solid bars are officially ' +
      'cited rates; ghost hatched bars are “fee exists, no citable rate” (negotiated commissions, net maker-taker rates, etc.). Implicit costs such as ' +
      'the bid-ask spread are out of scope by this project’s coverage boundary (see CLAUDE.md). Rules are as officially published by each exchange; ' +
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
