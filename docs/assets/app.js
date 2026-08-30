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
          var zhFallback = isZhFallback(cell, !!col.enum_ref);
          html += '<td><button type="button" class="cell-btn' + (lowConf ? " low-conf" : "") + '" data-role="cell" data-exchange="' + esc(ex.id) +
            '" data-path="' + esc(col.path) + '" data-chapter="' + esc(col.chapter) + '">' + esc(label || "（空）") +
            (zhFallback ? '<span class="zh-tag" title="该字段未要求双语，此处为中文原文 ZH source, not translated">中</span>' : "") +
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
      var zhFallback = isZhFallback(env, !!f.enum_ref);
      html += '<div class="field-card">';
      html += '<div class="field-label">' + esc(f.label_zh) + " · " + esc(f.label_en) + "</div>";
      html += '<div class="field-value' + (hasValue ? "" : " empty") + '">' + esc(hasValue ? value : "（暂缺，见 OPEN-QUESTIONS）") +
        (zhFallback ? ' <span class="zh-fallback-note" title="该字段未要求双语，此处为中文原文 ZH source, not translated">（中文原文）</span>' : "") + "</div>";
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
    html += "各所交易时段按 UTC 对齐展示，由「市场结构与交易机制」章节的交易时段文本近似换算而来（不保证分钟级精确，含夏令时的所已按今天的日期自动折算），精确时段与出处见各所档案页。当前 <strong>";
    html += esc(_fmtHourLabel(nowUtc)) + " UTC</strong>（本地 " + esc(_fmtHourLabel(nowLocal)) + "）用竖线标出。</p>";

    html += '<div class="tz-legend"><span><i class="tz-swatch tz-swatch-open"></i>连续交易 Continuous Trading</span><span><i class="tz-swatch tz-swatch-lunch"></i>午休 Lunch Break</span><span><i class="tz-swatch tz-swatch-now"></i>当前时刻 Now</span></div>';

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
          esc(th.open_local + "–" + th.close_local + " 本地 Local, UTC" + (th.utc_offset_hours >= 0 ? "+" : "") + th.utc_offset_hours) + '"></div>';
      });
      segs.lunch.forEach(function (seg) {
        html += '<div class="tz-bar tz-bar-lunch" style="left:' + (seg[0] / 24 * 100) + "%;width:" + ((seg[1] - seg[0]) / 24 * 100) + '%" title="' +
          esc("午休 Lunch Break " + th.lunch_start_local + "–" + th.lunch_end_local + " 本地 Local") + '"></div>';
      });
      html += '<div class="tz-now-line" style="left:' + (nowUtc / 24 * 100) + '%"></div>';
      html += "</div>";
      html += '<span class="tz-times">' + esc(th.open_local) + "–" + esc(th.close_local) + "</span>";
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
  // 交易日平面图（v2.0 主视图，见 PROJECT/DECISIONS.md ADR-035）
  //   x = 日内时间（分钟精度，覆盖盘前到盘后），y = 涨跌幅（相对前收盘价 / 前结算价）
  //   数据源：第五章 spec 层（sync.py 原样导出到 exchanges/<id>.json）。
  //   手写 SVG 字符串，不引图表库（ADR-035 C 零构建守则）。
  //   诚实渲染三态（ADR-035 D）：spec 有值+high → 实线；spec 值 null → 幽灵虚线+"未公布"角标；
  //   medium/low → 更淡 / 虚线。每个渲染元素带 data-role="cell"，点击复用 openCellOverlay 弹出处。
  // ══════════════════════════════════════════════
  var TD_DEFAULT_EX = "cn-sse";
  var TD_SESSION_ORDER = ["pre_market", "continuous_am", "lunch_break", "continuous_pm", "after_market", "night_session"];
  var TD_KIND_LABEL = {
    pre_open_queue: "挂单排队·不成交", opening_auction: "开盘集合竞价", continuous: "连续竞价",
    closing_auction: "收盘集合竞价", fixed_price: "固定价格交易", lunch_recess: "午间休市",
    after_hours_continuous: "盘后连续交易", night: "夜盘", none: "不设"
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
    var ch = (cache.taxonomy.chapters || []).filter(function (c) { return c.id === "market_structure"; })[0];
    var f = ch && (ch.fields || []).filter(function (x) { return x.path === path; })[0];
    return f ? f.label_zh : path;
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
      if (typeof s.limit_pct === "number") out.push("当日价格限制 ±" + s.limit_pct + "%（相对" + yRef + "）");
      else if (typeof s.limit_pct_up === "number" || typeof s.limit_pct_down === "number") {
        out.push("当日涨跌停 +" + (s.limit_pct_up != null ? s.limit_pct_up : "?") + "% / −" +
          (s.limit_pct_down != null ? Math.abs(s.limit_pct_down) : "?") + "%");
      } else if (s.type === "stepwise") out.push("阶梯值幅：涨跌幅随基准价分档");
      else if (s.type === "dynamic" && typeof s.band_pct === "number") out.push("动态价格带 ±" + s.band_pct + "%（随参考价滚动）");
      else if (s.type === "dynamic") out.push("设动态价格带，档位官方未公布");
      else if (s.type === "none") out.push("无每日涨跌停墙");
      else out.push("价格限制按品种 / 证券分类分档");
    }
    var c = ms.circuit_breaker && ms.circuit_breaker.spec;
    if (c) {
      if (c.type === "index_level" && c.levels) {
        var t = c.levels.filter(function (l) { return typeof l.threshold_pct === "number"; })
          .map(function (l) { return l.threshold_pct; });
        var idxNames = (c.reference || []).map(function (r) { return r.index; }).filter(Boolean);
        var subj = idxNames.length > 1 ? idxNames.join(" 或 ") + " " : "指数";
        if (t.length) out.push(subj + "跌 " + t.join("/") + "% 触发全市场熔断");
      } else if (c.type === "none") out.push("无全市场熔断");
      else if (c.type === "stock_level" || c.type === "contract_level") out.push("仅个股 / 合约级熔断，无全市场熔断");
    }
    var ir = ms.intraday_reversal;
    var irm = { t0: "当日可回转（T+0）", t1: "T+1：当日买入次日才可卖", t2: "T+2 交收", mixed: "回转交易分品种不同" };
    if (ir && irm[ir.enum]) out.push(irm[ir.enum]);
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
      '<span class="td-tb-note">x = 日内时间 · y = 涨跌幅相对前收盘价 · 点击任意元素看出处</span>' +
      "</div>";
    app.innerHTML = toolbar + '<div class="loading">加载平面图中…</div>';
    return loadExchange(id).then(function (data) {
      var cur = parseHash();
      if ((cur.view && cur.view !== "trading-day") || tdResolveId(cur) !== id) return;
      var ms = (data.chapters && data.chapters.market_structure) || {};
      app.innerHTML = toolbar + tdBuild(id, ms);
    }).catch(function (e) {
      app.innerHTML = toolbar + '<p style="color:var(--danger)">加载失败：' + esc(e.message) + "</p>";
    });
  }

  function tdBuild(id, ms) {
    var n = function (v) { return (+v).toFixed(1); };
    var sessions = ms.trading_sessions || {};
    var mb = ms.price_limits && ms.price_limits.main_board, mbS = (mb && mb.spec) || null;
    var cb = ms.circuit_breaker, cbS = (cb && cb.spec) || null;
    var vi = ms.volatility_interruption, viS = (vi && vi.spec) || null;
    var opnS = (ms.opening_mechanism && ms.opening_mechanism.spec) || null;
    var clsS = (ms.closing_mechanism && ms.closing_mechanism.spec) || null;
    var yRef = (mbS && mbS.reference === "prev_settlement") ? "前结算价" : "前收盘价";

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
      [s.auction_start, s.auction_end, s.trade_at_close_end].forEach(function (t) {
        var m = tdParseHM(t); if (m != null) T.push(m);
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
    var W = 960, H = 544, PL = 60, PR = 152, PT = 46, PB = 106;
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
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(wUp) + 4) + '" class="td-wl" fill="var(--danger)">涨停 +' + wUp + '%</text>' +
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(wDn) + 4) + '" class="td-wl" fill="var(--danger)">跌停 ' + wDn + '%</text>',
        tdFieldLabel("price_limits.main_board") + "：±" + wUp + "% 相对" + yRef));
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
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(lp1) + 4) + '" class="td-wl" fill="var(--danger)">阶梯值幅</text>' +
        '<text x="' + (PL + pw + 7) + '" y="' + n(Y(lp1) + 16) + '" class="td-wl-sub">约 ±' + Math.round(lp0) + "–" + Math.round(lp1) + '%</text>',
        tdFieldLabel("price_limits.main_board") + "：阶梯绝对值幅，幅度随基准价变化（点击看完整档位）"));
    }
    // 动态参考价区间
    if (mbS && mbS.type === "dynamic") {
      if (typeof mbS.band_pct === "number") {
        var bp = mbS.band_pct;
        g.push(tdCell(id, "price_limits.main_board",
          '<rect x="' + PL + '" y="' + n(Y(bp)) + '" width="' + pw + '" height="' + n(Y(-bp) - Y(bp)) + '" fill="var(--info)" opacity="0.10"/>' +
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(bp)) + '" y2="' + n(Y(bp)) + '" stroke="var(--info)" stroke-width="1.2" stroke-dasharray="5 4"/>' +
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(Y(-bp)) + '" y2="' + n(Y(-bp)) + '" stroke="var(--info)" stroke-width="1.2" stroke-dasharray="5 4"/>' +
          '<text x="' + (PL + pw + 7) + '" y="' + n(Y(bp) + 4) + '" class="td-wl" fill="var(--info)">动态带 ±' + bp + '%</text>' +
          '<text x="' + (PL + pw + 7) + '" y="' + n(Y(bp) + 16) + '" class="td-wl-sub">相对滚动参考价</text>',
          tdFieldLabel("price_limits.main_board") + "：动态价格带 ±" + bp + "%（相对滚动参考价，非固定墙）"));
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
        vf += '<text x="' + (PL + 6) + '" y="' + n(Y(Math.max.apply(null, cor)) - 4) + '" class="td-wl-sub" fill="var(--fg-muted)">波动走廊 ±' + cor.join("/") + '%</text>';
        g.push(tdCell(id, "volatility_interruption", vf, tdFieldLabel("volatility_interruption") + "：出走廊触发短暂集合竞价"));
      }
    }

    // ── 熔断（ADR-035 A：指数级 → y 轴多档触发线）──
    if (cbS && cbS.type === "index_level" && cbS.levels) {
      // 跨所联动（ADR-036 #6，如 in-nse 看 Nifty 50 或 BSE Sensex 先触发者）——
      // 触发依据已并入中心信息卡的熔断行，这里只在档位标签的 tooltip 里带一句
      var xref = (cbS.reference || []).some(function (r) { return r.exchange && r.exchange !== "self"; }) ? " ·跨所联动" : "";
      cbS.levels.forEach(function (lv) {
        if (typeof lv.threshold_pct !== "number") return;
        var yy = Y(-lv.threshold_pct), lab = "−" + lv.threshold_pct + "%";
        if (lv.day_end) lab += " 全日休市";
        else if (typeof lv.halt_minutes === "number") lab += " 停" + lv.halt_minutes + "分";
        g.push(tdCell(id, "circuit_breaker",
          '<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(yy) + '" y2="' + n(yy) + '" stroke="var(--danger)" stroke-width="1.3" stroke-dasharray="8 3" opacity="0.85"/>' +
          '<text x="' + (PL + pw + 7) + '" y="' + n(yy + 4) + '" class="td-wl" fill="var(--danger)">熔断 ' + esc(lab) + '</text>',
          tdFieldLabel("circuit_breaker") + "：指数级 " + lab + xref));
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
    auc(opnS, "opening_mechanism", "开盘竞价");
    auc(clsS, "closing_mechanism", "收盘竞价");

    // ── 临时停牌：顶边斜纹条（ADR-035 A："任意时刻"斜纹条）──
    if (ms.trading_halt_mechanism && ms.trading_halt_mechanism.zh) {
      g.push(tdCell(id, "trading_halt_mechanism",
        '<rect x="' + PL + '" y="' + (PT + 1) + '" width="' + pw + '" height="9" fill="url(#tdHalt)"/>' +
        '<text x="' + (PL + 5) + '" y="' + (PT + 8.5) + '" class="td-inl" fill="var(--fg-muted)">临时停牌可发生于任意时刻</text>',
        tdFieldLabel("trading_halt_mechanism")));
    }

    // ── 回转交易 T+N：右缘标记（ADR-035 A：x 轴右缘箭头）──
    var ir = ms.intraday_reversal;
    if (ir && (ir.enum || ir.zh)) {
      var irm = { t0: "↺ T+0 当日可回转", t1: "→ T+1 次日可卖", t2: "→ T+2", mixed: "⇄ 分品种不同" };
      g.push(tdCell(id, "intraday_reversal",
        '<text x="' + (PL + pw + 7) + '" y="' + n(PT + ph - 2) + '" class="td-margin">' + esc(irm[ir.enum] || "回转制度见档案") + '</text>',
        tdFieldLabel("intraday_reversal") + "：" + (ir.zh || "")));
    }

    // ── 网格 + 轴刻度 ──
    var yStep = yR <= 8 ? 2 : yR <= 16 ? 4 : yR <= 30 ? 5 : 10;
    for (var p = -Math.floor(yR / yStep) * yStep; p <= yR; p += yStep) {
      var yy2 = Y(p), zero = p === 0;
      g.push('<line x1="' + PL + '" x2="' + (PL + pw) + '" y1="' + n(yy2) + '" y2="' + n(yy2) + '" stroke="var(--border)" stroke-width="' + (zero ? 1.5 : 0.5) + '"' + (zero ? "" : ' opacity="0.55"') + '/>');
      g.push('<text x="' + (PL - 8) + '" y="' + n(yy2 + 3.5) + '" class="td-tick" text-anchor="end">' + (p > 0 ? "+" : "") + p + '%</text>');
      if (zero) g.push('<text x="' + (PL + 6) + '" y="' + n(yy2 - 5) + '" class="td-wl-sub">0 = ' + yRef + '</text>');
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
    var xStep = (xMax - xMin) > 300 ? 60 : 30;
    for (var mx = Math.ceil(xMin / xStep) * xStep; mx <= xMax; mx += xStep) {
      g.push('<line x1="' + n(X(mx)) + '" x2="' + n(X(mx)) + '" y1="' + PT + '" y2="' + (PT + ph) + '" stroke="var(--border)" stroke-width="0.5" opacity="0.45"/>');
      g.push('<text x="' + n(X(mx)) + '" y="' + (PT + ph + 15) + '" class="td-tick" text-anchor="middle">' + tdFmtHM(mx) + '</text>');
    }

    // ── 时段 ribbon（x 轴分段着色的图例条）──
    var ry = PT + ph + 26, rh = 15;
    if (drawn.length) {
      drawn.forEach(function (d) {
        var x1 = X(d.a), w = Math.max(2, X(d.b) - x1);
        var f = '<rect x="' + n(x1) + '" y="' + ry + '" width="' + n(w) + '" height="' + rh + '" rx="2" fill="' + tdKindFill(d.s.kind) + '" opacity="0.9"/>';
        if (w > 64) f += '<text x="' + n(x1 + w / 2) + '" y="' + (ry + 11) + '" class="td-rib" text-anchor="middle">' + esc(TD_KIND_LABEL[d.s.kind] || d.s.kind) + '</text>';
        g.push(tdCell(id, "trading_sessions." + d.k, f,
          tdFieldLabel("trading_sessions." + d.k) + "：" + tdFmtHM(d.a) + "–" + tdFmtHM(d.b % 1440) + "（" + (TD_KIND_LABEL[d.s.kind] || d.s.kind) + "）"));
      });
    } else {
      g.push('<rect x="' + PL + '" y="' + ry + '" width="' + pw + '" height="' + rh + '" rx="2" fill="var(--border)" opacity="0.4"/>');
      g.push('<text x="' + (PL + 6) + '" y="' + (ry + 11) + '" class="td-rib" fill="var(--fg-muted)">交易时段钟点未结构化——见档案页第五章</text>');
    }

    // ── 标题 / 轴名 ──
    var exName = (cache.exchangeById[id] && exchangeDisplayName(cache.exchangeById[id])) || id;
    g.push('<text x="' + PL + '" y="' + (PT - 22) + '" class="td-title">' + esc(exName) + ' · 交易日平面图</text>');
    g.push('<text transform="translate(15,' + n(PT + ph / 2) + ') rotate(-90)" class="td-axis-name" text-anchor="middle">涨跌幅 %（相对' + yRef + '）</text>');
    g.push('<text x="' + n(PL + pw / 2) + '" y="' + (H - 5) + '" class="td-axis-name" text-anchor="middle">日内时间（当地）</text>');

    var svg = '<div class="td-plot-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" class="td-svg" role="img" aria-label="' +
      esc(exName) + ' 交易日平面图">' + g.join("") + "</svg></div>";
    return tdLegend() + svg + tdSidePanels(id, ms) + tdProse();
  }

  // 标注层 chips（ADR-035 A：撮合原则 / 订单类型 / 做空 / 做市商 → 标注层）+ 非现货降级提示
  function tdSidePanels(id, ms) {
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
      out.push('<p class="td-banner">纯衍生品交易所：y 轴基准为<strong>前结算价</strong>，第五章字段描述衍生品市场（ADR-035 E）。</p>');
    } else if (hasDeriv) {
      out.push('<p class="td-banner td-banner-soft">本所记录含衍生品市场字段；平面图显示<strong>现货</strong>（衍生品 spec 待 Phase 3 补充）。</p>');
    }

    // val 传完整串；CSS 用 -webkit-line-clamp 截断到 2 行，title 给完整内容
    function chip(path, label, val, env) {
      var has = env && (env.zh || env.enum || env.spec);
      val = String(val == null || val === "" ? "—" : val);
      return '<button type="button" class="td-chip' + tdConfClass(env) + (has ? "" : " td-chip-empty") +
        '" data-role="cell" data-exchange="' + esc(id) + '" data-path="' + esc(path) + '" data-chapter="market_structure" title="' + esc(val) + '">' +
        '<span class="td-chip-k">' + esc(label) + '</span><span class="td-chip-v">' + esc(val) + '</span></button>';
    }

    var chips = [];
    var pt = getByPath(ms, "price_limits.type");
    chips.push(chip("price_limits.type", "价格限制类型", pt && pt.enum ? enumDisplay("price_limit_type", pt.enum) : (pt && pt.zh), pt));
    var cbf = ms.circuit_breaker;
    chips.push(chip("circuit_breaker", "熔断", cbf && cbf.enum ? enumDisplay("circuit_breaker_type", cbf.enum) : (cbf && cbf.zh), cbf));
    var mp = ms.matching_principle;
    chips.push(chip("matching_principle", "撮合原则", mp && mp.enum ? enumDisplay("matching_principle", mp.enum) : (mp && mp.zh), mp));
    var ot = ms.order_types;
    chips.push(chip("order_types", "订单类型", ot && (state.langMode === "en" && ot.en ? ot.en : ot.zh), ot));
    var ss = ms.short_selling;
    chips.push(chip("short_selling", "做空机制", ss && ss.enum ? enumDisplay("short_selling_stance", ss.enum) : (ss && ss.zh), ss));
    var mm = ms.market_maker_scheme, mmS = mm && mm.spec;
    var mmv = mmS && mmS.present === true ? ("有" + (mmS.quote_obligation ? " · 强制双边报价" : "")) :
      (mmS && mmS.present === false ? "无" : (mm && mm.zh));
    chips.push(chip("market_maker_scheme", "做市商", mmv, mm));
    var vic = ms.volatility_interruption, vicS = vic && vic.spec;
    var vicv;
    if (vicS && vicS.type === "none") vicv = "无独立层";
    else if (vicS && (typeof vicS.dynamic_pct === "number" || typeof vicS.static_pct === "number")) {
      vicv = "走廊 ±" + [vicS.dynamic_pct, vicS.static_pct].filter(function (x) { return typeof x === "number"; }).join("/") + "%";
    } else vicv = vic && vic.zh;
    chips.push(chip("volatility_interruption", "波动性中断", vicv, vic));

    out.push('<div class="td-chips">' + chips.join("") + "</div>");
    return out.join("");
  }

  function tdLegend() {
    return '<div class="td-legend">' +
      '<span><i class="td-sw" style="background:var(--accent)"></i>连续竞价</span>' +
      '<span><i class="td-sw" style="background:var(--warn)"></i>集合竞价 / 挂单排队</span>' +
      '<span><i class="td-sw" style="background:var(--info)"></i>午休</span>' +
      '<span><i class="td-sw" style="background:var(--border-strong)"></i>固定价 / 盘后</span>' +
      '<span><i class="td-sw td-sw-solid"></i>涨跌停墙（硬）</span>' +
      '<span><i class="td-sw td-sw-dash"></i>熔断触发线</span>' +
      '<span><i class="td-sw td-sw-band"></i>动态带（蓝） / 波动走廊（灰）</span>' +
      "</div>";
  }

  function tdProse() {
    return '<p class="td-prose">平面图由第五章「市场结构与交易机制」的结构化 <code>spec</code> 层驱动（见 ' +
      '<a href="https://github.com/HRLoveFun/exchange-atlas/blob/main/PROJECT/DECISIONS.md" target="_blank" rel="noopener noreferrer">ADR-035</a>）：' +
      '实线 / 实心为已核实数值，虚线 / 幽灵为「机制存在、数值官方未公布」，更淡的元素为 medium/low 置信度。' +
      '时间轴为分钟精度，不表示到秒；随机开 / 收盘窗口以模糊边缘示意。点击任意元素查看原文摘录与出处。' +
      '规则以各交易所官方发布为准，不构成投资建议。</p>';
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
        if (env.spec) html += '<div class="overlay-section"><h4>结构化 Spec</h4><pre class="overlay-spec">' + esc(JSON.stringify(env.spec, null, 2)) + "</pre></div>";
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
    var view = params.view || "trading-day";
    updateActiveTab(view === "exchange" ? "matrix" : view);
    var app = $("#app");
    if (view === "exchange") renderExchange(app, params);
    else if (view === "health") renderHealth(app, params);
    else if (view === "timezone") renderTimezone(app, params);
    else if (view === "matrix") renderMatrix(app, params);
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
      if (!location.hash) setHash({ view: "trading-day" }, true);
      route();
    })
    .catch(function (e) {
      $("#app").innerHTML = '<p style="color:var(--danger)">数据加载失败：' + esc(e.message) + "（先跑 make build 生成 docs/data/）</p>";
    });
})();
