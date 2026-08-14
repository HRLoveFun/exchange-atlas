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
    var tier = params.tier || "all";
    var q = (params.q || "").toLowerCase();

    var columns = [];
    cache.taxonomy.chapters.forEach(function (ch) {
      if (ch.kind === "list") return;
      (ch.fields || []).forEach(function (f) {
        if (f.in_matrix === activeGroup) columns.push(Object.assign({ chapter: ch.id }, f));
      });
    });

    var regions = Array.from(new Set(cache.manifest.exchanges.map(function (e) { return e.region; })));
    var tiers = Array.from(new Set(cache.manifest.exchanges.map(function (e) { return e.tier; })));
    var exchanges = cache.manifest.exchanges.slice();
    if (region !== "all") exchanges = exchanges.filter(function (e) { return e.region === region; });
    if (tier !== "all") exchanges = exchanges.filter(function (e) { return e.tier === tier; });
    if (q) {
      exchanges = exchanges.filter(function (e) {
        return (e.name_zh || "").toLowerCase().indexOf(q) >= 0 ||
          e.id.toLowerCase().indexOf(q) >= 0 ||
          nativeText(e.name_native).toLowerCase().indexOf(q) >= 0;
      });
    }

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
    html += '<label for="tierFilter">标杆批次 Tier</label>';
    html += '<select id="tierFilter" data-role="tier">';
    html += '<option value="all"' + (tier === "all" ? " selected" : "") + ">全部 All</option>";
    tiers.forEach(function (t) {
      html += '<option value="' + esc(t) + '"' + (tier === t ? " selected" : "") + ">" + esc(enumLabel("tier", t)) + " " + esc(enumLabelEn("tier", t)) + "</option>";
    });
    html += "</select>";
    html += '<div class="spacer"></div>';
    html += '<label for="searchBox">搜索 Search</label>';
    html += '<input type="search" id="searchBox" data-role="search" placeholder="交易所名称 / ID" value="' + esc(params.q || "") + '" />';
    html += "</div>";

    html += '<div class="group-tabs">';
    groups.forEach(function (g) {
      html += '<button type="button" class="group-tab' + (g.id === activeGroup ? " active" : "") + '" data-role="group" data-group="' + esc(g.id) + '">' +
        esc(g.label_zh) + ' <span style="opacity:.65">' + esc(g.label_en) + "</span></button>";
    });
    html += "</div>";

    if (!exchanges.length) {
      html += '<p style="color:var(--fg-muted)">没有符合条件的交易所。</p>';
    } else if (!columns.length) {
      html += '<p style="color:var(--fg-muted)">该维度组下暂无矩阵列（taxonomy.yml 里还没有字段标记 in_matrix: ' + esc(activeGroup) + '）。</p>';
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
          html += '<td><button type="button" class="cell-btn' + (lowConf ? " low-conf" : "") + '" data-role="cell" data-exchange="' + esc(ex.id) +
            '" data-path="' + esc(col.path) + '" data-chapter="' + esc(col.chapter) + '">' + esc(label || "（空）") +
            (stale ? '<span class="stale-dot" title="待复核"></span>' : "") + "</button></td>";
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
      app.innerHTML = '<p style="color:var(--danger)">找不到交易所 `' + esc(id) + '`。</p>';
      return Promise.resolve();
    }
    app.innerHTML = '<div class="loading">加载 ' + esc(exchangeDisplayName(identity)) + " 档案中…</div>";
    return loadExchange(id).then(function (data) {
      var chapters = cache.taxonomy.chapters;
      var activeCh = chapters.some(function (c) { return c.id === params.ch; }) ? params.ch : chapters[0].id;
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
      app.innerHTML = '<p style="color:var(--danger)">加载失败：' + esc(e.message) + "</p>";
    });
  }

  // itemFields: [{id, label_zh, label_en, enum_ref}]，items: [{...}]。
  // 供顶层列表章节（products/indices）与 object 章节里嵌套的 list 字段
  // （如 listing.boards）共用——两者的行数据形状一致，都是轻量条目，不是事实信封。
  function renderItemsTable(itemFields, items) {
    if (!items || !items.length) return '<p style="color:var(--fg-muted)">暂无数据。</p>';
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
    if (!fields.length) return '<p style="color:var(--fg-muted)">本章节暂无字段定义。</p>';
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
      html += '<div class="field-card">';
      html += '<div class="field-label">' + esc(f.label_zh) + " · " + esc(f.label_en) + "</div>";
      html += '<div class="field-value' + (hasValue ? "" : " empty") + '">' + esc(hasValue ? value : "（暂缺，见 OPEN-QUESTIONS）") + "</div>";
      if (env && env.detail) html += '<div class="field-detail">' + esc(env.detail) + "</div>";
      if (hasValue) {
        html += '<div class="field-foot">';
        if (env.confidence) html += '<span class="badge ' + confBadgeClass(env.confidence) + '">' + confLabel(env.confidence) + "</span>";
        if (env.verified) html += '<span style="font-size:11.5px;color:var(--fg-faint)">核实于 ' + esc(env.verified) + "</span>";
        if (isStale(exchangeId, f.path)) html += '<span style="font-size:11.5px;color:var(--warn)">● 待复核</span>';
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
      html += '<p style="color:var(--fg-muted)">没有符合条件的字段。</p>';
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
    if (!th || th.open_utc == null || th.close_utc == null) return [];
    if (th.lunch_start_utc != null && th.lunch_end_utc != null) {
      return normalizeSegment(th.open_utc, th.lunch_start_utc).concat(normalizeSegment(th.lunch_end_utc, th.close_utc));
    }
    return normalizeSegment(th.open_utc, th.close_utc);
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
    html += "各所交易时段按 UTC 对齐展示，由「市场结构与交易机制」章节的交易时段文本近似换算而来（不保证分钟级精确，含夏令时的所已按今天的日期自动折算），精确时段与出处见各所档案页。当前 <strong>";
    html += esc(_fmtHourLabel(nowUtc)) + " UTC</strong>（本地 " + esc(_fmtHourLabel(nowLocal)) + "）用竖线标出。</p>";

    html += '<div class="tz-legend"><span><i class="tz-swatch tz-swatch-open"></i>连续交易 Continuous Trading</span><span><i class="tz-swatch tz-swatch-now"></i>当前时刻 Now</span></div>';

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
      segs.forEach(function (seg) {
        html += '<div class="tz-bar" style="left:' + (seg[0] / 24 * 100) + "%;width:" + ((seg[1] - seg[0]) / 24 * 100) + '%" title="' +
          esc(th.open_local + "–" + th.close_local + " 本地 Local, UTC" + (th.utc_offset_hours >= 0 ? "+" : "") + th.utc_offset_hours) + '"></div>';
      });
      html += '<div class="tz-now-line" style="left:' + (nowUtc / 24 * 100) + '%"></div>';
      html += "</div>";
      html += '<span class="tz-times">' + esc(th.open_local) + "–" + esc(th.close_local) +
        (th.lunch_start_local ? "（午休 Lunch " + esc(th.lunch_start_local) + "–" + esc(th.lunch_end_local) + "）" : "") + "</span>";
      html += "</div>";
    });
    html += "</div>";

    if (missing.length) {
      html += '<p style="color:var(--fg-muted);font-size:12px;margin-top:14px">时段数据不足，未列入 Insufficient session data, excluded：' +
        missing.map(function (e) { return esc(exchangeDisplayName(e)); }).join("、") + "</p>";
    }

    app.innerHTML = html;
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
        if (env.detail) html += '<div class="overlay-section"><h4>细则 Detail</h4><div class="overlay-detail">' + esc(env.detail) + "</div></div>";
        if (env.quote) html += '<div class="overlay-section"><h4>原文摘录 Quote</h4><div class="overlay-quote">' + esc(env.quote) + "</div></div>";
        if (env.sources && env.sources.length) {
          html += '<div class="overlay-section"><h4>来源 Sources</h4><ul class="overlay-sources">';
          env.sources.forEach(function (s) {
            html += "<li><a href=\"" + esc(s.url) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(s.title || s.url) + "</a>" +
              (s.accessed ? " — 访问于 " + esc(s.accessed) : "") + "</li>";
          });
          html += "</ul></div>";
        }
        html += '<div class="overlay-section"><h4>状态 Status</h4><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
        if (env.confidence) html += '<span class="badge ' + confBadgeClass(env.confidence) + '">' + confLabel(env.confidence) + "</span>";
        if (env.verified) html += "<span>核实于 " + esc(env.verified) + "</span>";
        if (isStale(exchangeId, fieldPath)) html += '<span style="color:var(--warn)">● 已超过复核阈值</span>';
        html += "</div></div>";
      } else {
        html += '<p style="color:var(--fg-muted)">此字段暂无数据。</p>';
      }

      var panel = backdrop.querySelector(".overlay-panel");
      if (panel) panel.innerHTML = html;
    }).catch(function (e) {
      if (!document.body.contains(backdrop)) return;
      var panel = backdrop.querySelector(".overlay-panel");
      if (panel) panel.innerHTML = '<button type="button" class="overlay-close" data-role="close-overlay">&times;</button>' +
        '<p style="color:var(--danger)">加载失败 Failed to load: ' + esc(e.message) + "</p>";
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
  function applyLangButtonLabel() {
    $("#langToggle").textContent = state.langMode === "zh" ? "中文" : "English";
  }
  function toggleLang() {
    state.langMode = state.langMode === "zh" ? "en" : "zh";
    localStorage.setItem("ea-lang", state.langMode);
    applyLangButtonLabel();
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
    var view = params.view || "matrix";
    updateActiveTab(view === "exchange" ? "matrix" : view);
    var app = $("#app");
    if (view === "exchange") renderExchange(app, params);
    else if (view === "health") renderHealth(app, params);
    else if (view === "timezone") renderTimezone(app, params);
    else renderMatrix(app, params);
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
    var t = e.target.closest("[data-role]");
    if (!t) return;
    var role = t.dataset.role;
    if (role === "cell" || role === "goto-health-field") {
      openCellOverlay(t.dataset.exchange, t.dataset.path, t.dataset.chapter);
    } else if (role === "close-overlay") {
      closeOverlay();
    } else if (role === "group") {
      var params = parseHash();
      params.view = "matrix";
      params.group = t.dataset.group;
      setHash(params);
    } else if (role === "goto-chapter") {
      var p2 = parseHash();
      p2.ch = t.dataset.ch;
      setHash(p2);
    } else if (role === "goto-exchange") {
      // 交由默认 <a href> 行为处理 hash 跳转
    }
  });
  document.addEventListener("change", function (e) {
    var role = e.target.dataset && e.target.dataset.role;
    if (role === "region" || role === "tier") {
      var params = parseHash();
      params[role] = e.target.value;
      setHash(params);
    } else if (role === "health-exchange" || role === "health-type") {
      var p3 = parseHash();
      p3[role === "health-exchange" ? "hex" : "htype"] = e.target.value;
      setHash(p3);
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target.dataset && e.target.dataset.role === "search") {
      var params = parseHash();
      if (e.target.value) params.q = e.target.value; else delete params.q;
      setHash(params, true);
      // renderMatrix 整体重绘 #app，会连搜索框本身一起换成新 DOM 节点，
      // 不手动还原焦点和光标位置的话，每敲一个字符输入框就会丢焦点。
      var cursor = e.target.selectionStart;
      renderMatrix($("#app"), params);
      var newBox = $("#searchBox");
      if (newBox) {
        newBox.focus();
        try { newBox.setSelectionRange(cursor, cursor); } catch (err) { /* 部分浏览器 search input 不支持，忽略 */ }
      }
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
  applyLangButtonLabel();
  loadCore()
    .then(function () {
      window.addEventListener("hashchange", route);
      if (!location.hash) setHash({ view: "matrix" }, true);
      route();
    })
    .catch(function (e) {
      $("#app").innerHTML = '<p style="color:var(--danger)">数据加载失败：' + esc(e.message) + "（先跑 make build 生成 docs/data/）</p>";
    });
})();
