/* Arayüz: tek sayfa, durum -> HTML metni -> olay devri. Hesap core.js'te, metin i18n.js'te. */
(function () {
  "use strict";

  var KEY = "etsyapp.v1";
  var t = I18n.t, C = Core;
  var S = load();
  var view = "dashboard", modal = null;

  var ICONS = {
    dashboard: '<path d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
    sales: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>',
    expenses: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
    reports: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
  };
  var VIEWS = ["dashboard", "sales", "expenses", "reports", "settings"];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      var j = localStorage.getItem(KEY);
      if (j) return JSON.parse(j);
    } catch (e) { /* depolama kapalı */ }
    return fresh();
  }
  function fresh() {
    var s = clone(window.DEMO_STATE);
    s.demo = true;
    s.settings.shop = "";
    return s;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* yoksay */ }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cur() { return S.settings.cur || "$"; }
  // Dil değişince para simgesi de o ülkenin birimine geçer; müşteri simgeyi kendisi yazdıysa (curManual) dokunulmaz
  var LANG_CUR = { en: "$", tr: "₺", de: "€", fr: "€", es: "€", it: "€", pt: "€", nl: "€", pl: "zł", ru: "₽", ar: "$" };
  function applyLangCur(code) {
    var st = S.settings, c = st.cur || "$";
    if (st.curManual) return;
    var isDefault = Object.keys(LANG_CUR).some(function (k) { return LANG_CUR[k] === c; });
    if (!isDefault) return; // eski kayıtta elle yazılmış başka simge
    var want = LANG_CUR[code] || "$";
    if (want !== c) { st.cur = want; save(); }
  }
  function money(x) { return I18n.money(x, cur()); }
  function shopName() { return S.settings.shop || t("demo.shop"); }
  function today() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : NaN;
  }
  function nextId(arr) {
    return arr.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0) + 1;
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  /* ---------- parçalar ---------- */

  function kpi(labelKey, value, opts) {
    opts = opts || {};
    return '<div class="card kpi' + (opts.small ? " small" : "") + '"><div class="lbl">' + esc(t(labelKey)) +
      '</div><div class="val ' + (opts.cls || "") + '">' + esc(value) + "</div></div>";
  }

  function chart(s) {
    var W = 640, H = 190, pl = 6, pb = 22, pt = 8, gw = (W - 2 * pl) / 12, plotH = H - pb - pt;
    var rev = s.months.map(function (m) { return m.revenue; }), net = s.months.map(function (m) { return m.net; });
    var mx = Math.max(1, Math.max.apply(null, rev)), mn = Math.min(0, Math.min.apply(null, net)), rng = mx - mn;
    function Y(v) { return pt + (mx - v) / rng * plotH; }
    var y0 = Y(0), out = "", names = t("months");
    for (var i = 0; i < 12; i++) {
      var x = pl + i * gw;
      [[rev[i], "b1", 0.12], [net[i], "b2" + (net[i] < 0 ? " n" : ""), 0.5]].forEach(function (b) {
        var top = Math.min(Y(b[0]), y0), h = Math.max(1, Math.abs(Y(b[0]) - y0));
        out += '<rect class="' + b[1] + '" x="' + (x + gw * b[2]).toFixed(1) + '" y="' + top.toFixed(1) +
          '" width="' + (gw * 0.34).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"/>';
      });
      out += '<text x="' + (x + gw / 2).toFixed(1) + '" y="' + (H - 6) + '">' + esc(names[i]) + "</text>";
    }
    out += '<line x1="' + pl + '" x2="' + (W - pl) + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) +
      '" stroke="#E5E7EB"/>';
    return '<div class="chart"><svg viewBox="0 0 ' + W + " " + H + '" role="img">' + out + "</svg>" +
      '<div class="legend"><span><i style="background:#D1D5DB"></i>' + esc(t("card.revenue")) +
      '</span><span><i style="background:var(--accent)"></i>' + esc(t("card.net")) + "</span></div></div>";
  }

  /* ---------- ekranlar ---------- */

  function vDashboard() {
    var s = C.summarize(S), y = s.total, h = "";
    if (S.demo) {
      h += '<div class="note"><span>' + esc(t("msg.demo")) + '</span><button class="btn ghost" data-act="clear-demo">' +
        esc(t("btn.clearDemo")) + "</button></div>";
    }
    h += '<div class="grid g4">' + kpi("card.revenue", money(y.revenue)) + kpi("card.fees", money(y.fees)) +
      kpi("card.expenses", money(y.opex)) + kpi("card.net", money(y.net), { cls: y.net < 0 ? "neg" : "pos" }) + "</div>";
    h += '<div class="grid g4 sec">' + kpi("card.margin", I18n.pct(y.margin), { small: true }) +
      kpi("card.orders", String(y.orders), { small: true }) +
      kpi("card.avg", money(y.orders ? y.revenue / y.orders : 0), { small: true }) +
      kpi("card.tax", money(y.tax), { small: true }) + "</div>";
    h += '<div class="card plain sec"><h3>' + esc(t("sec.monthly")) + "</h3>" + chart(s) + "</div>";

    var rows = S.channels.map(function (c) {
      var d = s.channels[c.name];
      return "<tr><td>" + esc(I18n.label("ch", c.name)) + "</td><td>" + d.orders + "</td><td>" + money(d.revenue) +
        "</td><td>" + money(d.fees) + "</td><td>" + money(d.net) + "</td></tr>";
    }).join("");
    var cats = S.categories.map(function (c) { return [c, s.categories[c] || 0]; })
      .filter(function (p) { return p[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
    var cmax = cats.length ? cats[0][1] : 1;
    var bars = cats.map(function (p) {
      return '<div class="barrow"><span>' + esc(I18n.label("cat", p[0])) + "</span><b>" + esc(money(p[1])) +
        '</b><div class="bar"><i style="width:' + (p[1] / cmax * 100).toFixed(0) + '%"></i></div></div>';
    }).join("") || '<div class="empty">' + esc(t("msg.empty")) + "</div>";
    h += '<div class="grid g2 sec"><div class="card plain"><h3>' + esc(t("sec.byChannel")) + '</h3><div class="tblwrap"><table><thead><tr><th>' +
      esc(t("col.channel")) + "</th><th>" + esc(t("col.orders")) + "</th><th>" + esc(t("card.revenue")) + "</th><th>" +
      esc(t("col.fees")) + "</th><th>" + esc(t("col.net")) + "</th></tr></thead><tbody>" + rows +
      '</tbody></table></div></div><div class="card plain"><h3>' + esc(t("sec.byCategory")) + "</h3>" + bars + "</div></div>";
    h += '<div class="foot">' + esc(t("msg.disclaimer")) + "</div>";
    return h;
  }

  function sortDesc(arr) {
    return arr.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id || 0) - (a.id || 0);
    });
  }

  var flt = {
    sales: { from: "", to: "", a: "", b: "", q: "" },
    exp: { from: "", to: "", a: "", b: "", q: "" }
  };

  function distinct(arr, key) {
    var seen = {}, out = [];
    arr.forEach(function (r) {
      var v = r[key];
      if (v && !seen[v]) { seen[v] = 1; out.push(v); }
    });
    return out.sort(function (x, y) { return x.localeCompare(y); });
  }

  function filtered(kind) {
    var f = flt[kind], isS = kind === "sales", src = isS ? S.sales : S.expenses, q = f.q.trim().toLowerCase();
    return sortDesc(src).filter(function (r) {
      if (f.from && r.date < f.from) return false;
      if (f.to && r.date > f.to) return false;
      if (f.a && r[isS ? "item" : "cat"] !== f.a) return false;
      if (f.b && r[isS ? "channel" : "payee"] !== f.b) return false;
      if (q) {
        var hay = (isS ? [r.ref, r.item, I18n.label("ch", r.channel), r.amount]
          : [r.payee, r.note, I18n.label("cat", r.cat), r.amount]).join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function filterBar(kind) {
    var f = flt[kind], isS = kind === "sales", src = isS ? S.sales : S.expenses;
    function sel(field, label, list, fmt) {
      return '<div class="field"><label>' + esc(label) + '</label><select data-f="' + kind + '.' + field + '"><option value="">' +
        esc(t("flt.all")) + "</option>" + list.map(function (v) {
          return '<option value="' + esc(v) + '"' + (v === f[field] ? " selected" : "") + ">" + esc(fmt ? fmt(v) : v) + "</option>";
        }).join("") + "</select></div>";
    }
    var a = isS ? sel("a", t("col.item"), distinct(src, "item"))
      : sel("a", t("col.category"), S.categories, function (v) { return I18n.label("cat", v); });
    var b = isS ? sel("b", t("col.channel"), S.channels.map(function (c) { return c.name; }), function (v) { return I18n.label("ch", v); })
      : sel("b", t("col.paidTo"), distinct(src, "payee"));
    return '<div class="card plain fbar"><div class="field"><label>' + esc(t("col.date")) + ' ↓</label><input type="date" data-f="' + kind +
      '.from" value="' + esc(f.from) + '"></div><div class="field"><label>' + esc(t("col.date")) + ' ↑</label><input type="date" data-f="' +
      kind + '.to" value="' + esc(f.to) + '"></div>' + a + b + '<div class="field fq"><label>&nbsp;</label><input type="search" data-f="' +
      kind + '.q" placeholder="' + esc(t("flt.search")) + '" value="' + esc(f.q) + '"></div><div class="field"><label>&nbsp;</label>' +
      '<button class="btn ghost" data-act="clear-flt" data-kind="' + kind + '">' + esc(t("flt.clear")) + "</button></div></div>";
  }

  var sub = { sales: "overview", expenses: "overview", reports: "pl" };
  var SUBS = {
    sales: ["overview", "list", "item", "channel", "month"],
    expenses: ["overview", "list", "category", "payee", "month"],
    reports: ["pl", "quarter", "item", "channel", "category"]
  };
  var SUBKEY = { overview: "sub.overview", list: "sub.list", item: "sub.byItem", channel: "sec.byChannel", month: "sec.monthly",
    category: "sec.byCategory", payee: "sub.byPayee", quarter: "sub.byQuarter", pl: "sec.pl" };

  function subBar(v) {
    return '<div class="subs">' + SUBS[v].map(function (k) {
      return '<button class="sub' + (sub[v] === k ? " on" : "") + '" data-sub="' + k + '">' + esc(t(SUBKEY[k])) + "</button>";
    }).join("") + "</div>";
  }

  function yearRows(arr) {
    var y = String(S.settings.year);
    return arr.filter(function (r) { return String(r.date).slice(0, 4) === y; });
  }

  function groupKey(k, r) {
    if (k === "item") return r.item || "—";
    if (k === "channel") return r.channel;
    if (k === "category") return r.cat;
    if (k === "payee") return r.payee || "—";
    if (k === "month") return String(r.date).slice(0, 7);
    return "";
  }
  function groupLabel(k, key) {
    if (k === "channel") return I18n.label("ch", key);
    if (k === "category") return I18n.label("cat", key);
    if (k === "month") return t("months")[parseInt(key.slice(5, 7), 10) - 1] + " " + key.slice(0, 4);
    return key;
  }
  function groupHead(k) {
    return { item: "col.item", channel: "col.channel", category: "col.category", payee: "col.paidTo", month: "col.month" }[k];
  }

  function groupTable(kind, k, rows) {
    var isS = kind === "sales", g = {}, keys = [];
    rows.forEach(function (r) {
      var key = groupKey(k, r);
      if (!g[key]) { g[key] = { n: 0, rev: 0, cost: 0, fees: 0, net: 0 }; keys.push(key); }
      var o = g[key];
      o.n++; o.rev += C.num(r.amount);
      if (isS) { o.cost += C.num(r.cost); o.fees += C.feeFor(r, S.channels); o.net += C.netFor(r, S.channels); }
    });
    keys.sort(function (a, b) {
      if (k === "month") return a < b ? -1 : 1;
      return isS ? g[b].net - g[a].net : g[b].rev - g[a].rev;
    });
    var T = { n: 0, rev: 0, cost: 0, fees: 0, net: 0 };
    keys.forEach(function (key) { for (var f in T) T[f] += g[key][f]; });
    function line(label, o, strong) {
      var h = "<tr" + (strong ? ' class="strong"' : "") + '><td class="txt">' + esc(label) + "</td><td>" + o.n + "</td>";
      if (isS) {
        h += "<td>" + money(o.rev) + "</td><td>" + money(o.cost) + "</td><td>" + money(o.fees) + '</td><td class="' + (o.net < 0 ? "neg" : "") +
          '">' + money(o.net) + "</td><td>" + esc(I18n.pct(o.rev ? o.net / o.rev : 0)) + "</td>";
      } else {
        h += "<td>" + money(o.rev) + "</td><td>" + esc(I18n.pct(T.rev ? o.rev / T.rev : 0)) + "</td><td>" + money(o.n ? o.rev / o.n : 0) + "</td>";
      }
      return h + "</tr>";
    }
    var head = '<th class="txt">' + esc(t(groupHead(k))) + "</th><th>" + esc(t("col.orders")) + "</th>" + (isS
      ? "<th>" + esc(t("card.revenue")) + "</th><th>" + esc(t("col.cost")) + "</th><th>" + esc(t("col.fees")) + "</th><th>" +
        esc(t("col.net")) + "</th><th>" + esc(t("card.margin")) + "</th>"
      : "<th>" + esc(t("col.amount")) + "</th><th>%</th><th>" + esc(t("card.avg")) + "</th>");
    var body = keys.map(function (key) { return line(groupLabel(k, key), g[key]); }).join("") + line(t("col.total"), T, true);
    return '<div class="card plain"><div class="tblwrap"><table><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div></div>";
  }

  function listHtml(kind) {
    var isS = kind === "sales", k = sub[isS ? "sales" : "expenses"], rows = filtered(kind), total = isS ? S.sales.length : S.expenses.length;
    var sum = 0, net = 0;
    rows.forEach(function (r) {
      sum += C.num(r.amount);
      if (isS) net += C.netFor(r, S.channels);
    });
    var summary = '<div class="fsum"><span>' + esc(t("flt.shown")) + ": <b>" + rows.length + " / " + total + "</b></span><span>" +
      esc(t(isS ? "card.revenue" : "card.expenses")) + ": <b>" + esc(money(round2(sum))) + "</b></span>" +
      (isS ? "<span>" + esc(t("col.net")) + ": <b>" + esc(money(round2(net))) + "</b></span>" : "") + "</div>";
    if (!rows.length) return summary + '<div class="card plain"><div class="empty">' + esc(t("msg.empty")) + "</div></div>";
    if (k !== "list") return summary + groupTable(kind, k, rows);
    var body = rows.map(function (r) {
      if (isS) {
        var f = C.feeFor(r, S.channels), n = C.netFor(r, S.channels);
        return '<tr class="click" data-act="edit-sale" data-id="' + r.id + '"><td>' + esc(I18n.dateShort(r.date)) +
          '</td><td class="txt">' + esc(r.ref) + '</td><td class="txt">' + esc(r.item) + '</td><td class="txt">' +
          esc(I18n.label("ch", r.channel)) + "</td><td>" + money(C.num(r.amount)) + "</td><td>" + money(C.num(r.cost)) +
          "</td><td>" + money(f) + '</td><td class="' + (n < 0 ? "neg" : "") + '">' + money(n) + "</td></tr>";
      }
      return '<tr class="click" data-act="edit-exp" data-id="' + r.id + '"><td>' + esc(I18n.dateShort(r.date)) +
        '</td><td class="txt">' + esc(I18n.label("cat", r.cat)) + '</td><td class="txt">' + esc(r.payee) +
        '</td><td class="txt">' + esc(r.note) + "</td><td>" + money(C.num(r.amount)) + "</td></tr>";
    }).join("");
    var head = isS
      ? "<th>" + esc(t("col.date")) + '</th><th class="txt">' + esc(t("col.order")) + '</th><th class="txt">' + esc(t("col.item")) +
        '</th><th class="txt">' + esc(t("col.channel")) + "</th><th>" + esc(t("col.amount")) + "</th><th>" + esc(t("col.cost")) +
        "</th><th>" + esc(t("col.fees")) + "</th><th>" + esc(t("col.net")) + "</th>"
      : "<th>" + esc(t("col.date")) + '</th><th class="txt">' + esc(t("col.category")) + '</th><th class="txt">' + esc(t("col.paidTo")) +
        '</th><th class="txt">' + esc(t("col.note")) + "</th><th>" + esc(t("col.amount")) + "</th>";
    return summary + '<div class="card plain"><div class="tblwrap"><table><thead><tr>' + head + "</tr></thead><tbody>" + body +
      "</tbody></table></div></div>";
  }

  function catBars(s) {
    var cats = S.categories.map(function (c) { return [c, s.categories[c] || 0]; })
      .filter(function (p) { return p[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
    var cmax = cats.length ? cats[0][1] : 1;
    return cats.map(function (p) {
      return '<div class="barrow"><span>' + esc(I18n.label("cat", p[0])) + "</span><b>" + esc(money(p[1])) +
        '</b><div class="bar"><i style="width:' + (p[1] / cmax * 100).toFixed(0) + '%"></i></div></div>';
    }).join("") || '<div class="empty">' + esc(t("msg.empty")) + "</div>";
  }

  function emptyCard() { return '<div class="card plain"><div class="empty">' + esc(t("msg.empty")) + "</div></div>"; }

  function salesOverview() {
    var s = C.summarize(S), y = s.total, rows = yearRows(S.sales);
    return '<div class="grid g4">' + kpi("card.revenue", money(y.revenue)) + kpi("card.fees", money(y.fees)) +
      kpi("card.orders", String(y.orders)) + kpi("pl.contrib", money(y.contrib), { cls: y.contrib < 0 ? "neg" : "pos" }) + "</div>" +
      '<div class="card plain sec"><h3>' + esc(t("sec.monthly")) + " · " + esc(s.year) + "</h3>" + chart(s) + "</div>" +
      '<div class="sec"><div class="fsum"><span><b>' + esc(t("sub.byItem")) + "</b></span></div>" +
      (rows.length ? groupTable("sales", "item", rows) : emptyCard()) + "</div>";
  }

  function expOverview() {
    var s = C.summarize(S), y = s.total, rows = yearRows(S.expenses);
    var big = S.categories.map(function (c) { return [c, s.categories[c] || 0]; }).sort(function (a, b) { return b[1] - a[1]; })[0];
    return '<div class="grid g2">' + kpi("card.expenses", money(y.opex)) +
      kpi("col.category", big && big[1] > 0 ? I18n.label("cat", big[0]) : "—", { small: true }) + "</div>" +
      '<div class="card plain sec"><h3>' + esc(t("sec.byCategory")) + " · " + esc(s.year) + "</h3>" + catBars(s) + "</div>" +
      (rows.length ? '<div class="sec"><div class="fsum"><span><b>' + esc(t("sub.byPayee")) + "</b></span></div>" + groupTable("exp", "payee", rows) + "</div>" : "");
  }

  function vSales() {
    return subBar("sales") + (sub.sales === "overview" ? salesOverview() : filterBar("sales") + '<div id="flist">' + listHtml("sales") + "</div>");
  }
  function vExpenses() {
    return subBar("expenses") + (sub.expenses === "overview" ? expOverview() : filterBar("exp") + '<div id="flist">' + listHtml("exp") + "</div>");
  }

  function quarterTable() {
    var s = C.summarize(S), qs = [0, 1, 2, 3].map(function (q) {
      var o = { revenue: 0, cost: 0, gross: 0, fees: 0, contrib: 0, opex: 0, net: 0 };
      s.months.slice(q * 3, q * 3 + 3).forEach(function (m) { for (var f in o) o[f] += m[f]; });
      return o;
    });
    var cols = qs.concat([s.total]);
    function line(label, fn, strong, fmt) {
      return "<tr" + (strong ? ' class="strong"' : "") + "><td>" + esc(label) + "</td>" + cols.map(function (m) {
        var v = fn(m);
        return "<td" + (v < 0 && !fmt ? ' class="neg"' : "") + ">" + esc(fmt ? fmt(v) : money(v)) + "</td>";
      }).join("") + "</tr>";
    }
    var head = "<tr><th>" + esc(s.year) + "</th>" + [1, 2, 3, 4].map(function (q) { return "<th>Q" + q + "</th>"; }).join("") +
      "<th>" + esc(t("col.total")) + "</th></tr>";
    var body = line(t("pl.revenue"), function (m) { return m.revenue; }) + line(t("pl.cost"), function (m) { return m.cost; }) +
      line(t("pl.gross"), function (m) { return m.gross; }, true) + line(t("pl.fees"), function (m) { return m.fees; }) +
      line(t("pl.contrib"), function (m) { return m.contrib; }, true) + line(t("pl.opex"), function (m) { return m.opex; }) +
      line(t("pl.net"), function (m) { return m.net; }, true) +
      line(t("pl.margin"), function (m) { return m.revenue ? m.net / m.revenue : 0; }, false, function (v) { return I18n.pct(v); });
    return '<div class="card plain"><div class="tblwrap"><table><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div></div>";
  }

  function vReports() {
    var k = sub.reports, h = subBar("reports");
    if (k === "pl") return h + vPL();
    if (k === "quarter") return h + quarterTable();
    if (k === "category") {
      var er = yearRows(S.expenses);
      return h + (er.length ? groupTable("exp", "category", er) : emptyCard());
    }
    var rows = yearRows(S.sales);
    return h + (rows.length ? groupTable("sales", k, rows) : emptyCard());
  }

  function vPL() {
    var s = C.summarize(S), cols = s.months.concat([s.total]), names = t("months");
    function line(label, fn, strong, fmt) {
      return "<tr" + (strong ? ' class="strong"' : "") + "><td>" + esc(label) + "</td>" + cols.map(function (m) {
        var v = fn(m);
        return "<td" + (v < 0 && !fmt ? ' class="neg"' : "") + ">" + esc(fmt ? fmt(v) : money(v)) + "</td>";
      }).join("") + "</tr>";
    }
    var head = "<tr><th>" + esc(s.year) + "</th>" + names.map(function (n) { return "<th>" + esc(n) + "</th>"; }).join("") +
      "<th>" + esc(t("col.total")) + "</th></tr>";
    var body = line(t("pl.revenue"), function (m) { return m.revenue; }) +
      line(t("pl.cost"), function (m) { return m.cost; }) +
      line(t("pl.gross"), function (m) { return m.gross; }, true) +
      line(t("pl.fees"), function (m) { return m.fees; }) +
      line(t("pl.contrib"), function (m) { return m.contrib; }, true);
    S.categories.forEach(function (c) {
      body += line(I18n.label("cat", c), function (m) { return m.byCat[c] || 0; });
    });
    if (s.other) body += line(t("pl.otherExp"), function (m) { return m.other; });
    body += line(t("pl.opex"), function (m) { return m.opex; }, true) +
      line(t("pl.net"), function (m) { return m.net; }, true) +
      line(t("pl.margin"), function (m) { return m.margin; }, false, function (v) { return I18n.pct(v); }) +
      line(t("pl.tax"), function (m) { return m.tax; }) +
      line(t("pl.after"), function (m) { return m.after; }, true);
    return '<div class="card plain"><div class="tblwrap"><table class="sticky"><thead>' + head + "</thead><tbody>" +
      body + "</tbody></table></div></div>";
  }

  function vSettings() {
    var st = S.settings, used = {}, usedCat = {};
    S.sales.forEach(function (r) { used[r.channel] = 1; });
    S.expenses.forEach(function (r) { usedCat[r.cat] = 1; });
    var langs = Object.keys(I18n.LANGS).map(function (k) {
      return '<option value="' + k + '"' + (k === I18n.lang ? " selected" : "") + ">" + esc(I18n.LANGS[k]) + "</option>";
    }).join("");
    var chs = S.channels.map(function (c, i) {
      return '<div class="mini"><input data-ch="name" data-i="' + i + '" value="' + esc(I18n.label("ch", c.name)) +
        '"><input data-ch="pct" data-i="' + i + '" inputmode="decimal" value="' + round2(c.pct * 100) +
        '"><input data-ch="fixed" data-i="' + i + '" inputmode="decimal" value="' + c.fixed + '">' +
        (used[c.name] ? '<span class="x"></span>' : '<button class="x" data-act="del-ch" data-i="' + i + '">×</button>') + "</div>";
    }).join("");
    var cts = S.categories.map(function (c, i) {
      return '<div class="catrow"><input data-cat="' + i + '" value="' + esc(I18n.label("cat", c)) + '">' +
        (usedCat[c] ? '<span class="x"></span>' : '<button class="x" data-act="del-cat" data-i="' + i + '">×</button>') + "</div>";
    }).join("");
    return '<div class="setgrid"><div class="card plain"><div class="form">' +
      '<div class="field"><label>' + esc(t("lang.label")) + '</label><select id="langSel2">' + langs + "</select></div>" +
      '<div class="field"><label>' + esc(t("set.shop")) + '</label><input data-set="shop" value="' + esc(st.shop) +
      '" placeholder="' + esc(t("demo.shop")) + '"></div>' +
      '<div class="row2"><div class="field"><label>' + esc(t("set.year")) + '</label><input data-set="year" inputmode="numeric" value="' +
      esc(st.year) + '"></div><div class="field"><label>' + esc(t("set.tax")) +
      '</label><input data-set="tax" inputmode="decimal" value="' + round2(st.tax * 100) + '"></div></div>' +
      '<div class="field"><label>' + esc(t("set.currency")) + '</label><input data-set="cur" maxlength="4" value="' + esc(cur()) + '"></div>' +
      '</div></div><div class="card plain"><h3>' + esc(t("set.data")) + '</h3><div class="form">' +
      '<button class="btn ghost" data-act="export">' + esc(t("btn.export")) + "</button>" +
      '<button class="btn ghost" data-act="import">' + esc(t("btn.import")) + "</button>" +
      '<input type="file" id="impFile" accept="application/json" hidden>' +
      '<button class="btn ghost" data-act="load-demo">' + esc(t("btn.loadDemo")) + "</button>" +
      '<button class="btn danger" data-act="clear-demo">' + esc(t("btn.clearDemo")) + "</button></div></div></div>" +
      '<div class="card plain sec"><h3>' + esc(t("set.channels")) + '</h3><div class="mini" style="color:var(--muted);font-size:11px"><span>' +
      esc(t("set.channelName")) + "</span><span>" + esc(t("set.pct")) + "</span><span>" + esc(t("set.fixed")) + "</span><span></span></div>" +
      chs + '<button class="btn ghost" data-act="add-ch">' + esc(t("set.addChannel")) + '</button><div class="foot">' +
      esc(t("set.feeNote")) + '</div></div><div class="card plain sec"><h3>' + esc(t("set.categories")) + "</h3>" + cts +
      '<button class="btn ghost" data-act="add-cat">' + esc(t("set.addCategory")) + "</button></div>" +
      '<div class="foot">' + esc(t("msg.disclaimer")) + "</div>";
  }

  /* ---------- formlar ---------- */

  function opts(list, kind, sel) {
    return list.map(function (n) {
      var name = typeof n === "string" ? n : n.name;
      return '<option value="' + esc(name) + '"' + (name === sel ? " selected" : "") + ">" +
        esc(I18n.label(kind, name)) + "</option>";
    }).join("");
  }

  function saleForm(r) {
    var isNew = !r;
    r = r || { date: today(), ref: "", item: "", channel: S.channels[0].name, amount: "", cost: "" };
    return '<form class="form" data-form="sale" data-id="' + (r.id || "") + '"><h2>' +
      esc(t(isNew ? "btn.addSale" : "btn.edit")) + "</h2>" +
      '<div class="row2"><div class="field"><label>' + esc(t("col.date")) + '</label><input type="date" name="date" required value="' + esc(r.date) +
      '"></div><div class="field"><label>' + esc(t("col.order")) + '</label><input name="ref" value="' + esc(r.ref) + '"></div></div>' +
      '<div class="field"><label>' + esc(t("col.item")) + '</label><input name="item" value="' + esc(r.item) + '"></div>' +
      '<div class="field"><label>' + esc(t("col.channel")) + '</label><select name="channel">' + opts(S.channels, "ch", r.channel) + "</select></div>" +
      '<div class="row2"><div class="field"><label>' + esc(t("col.amount")) + '</label><input name="amount" inputmode="decimal" required value="' +
      esc(r.amount) + '"><div class="hint">' + esc(t("hint.amount")) + '</div></div><div class="field"><label>' + esc(t("col.cost")) +
      '</label><input name="cost" inputmode="decimal" value="' + esc(r.cost) + '"><div class="hint">' + esc(t("hint.cost")) + "</div></div></div>" +
      '<div class="preview"><span id="pvf"></span><b id="pvn"></b></div><div class="acts">' +
      (isNew ? "" : '<button type="button" class="btn danger" data-act="del-sale" data-id="' + r.id + '">' + esc(t("btn.delete")) + "</button>") +
      '<span class="sp"></span><button type="button" class="btn ghost" data-act="close">' + esc(t("btn.cancel")) +
      '</button><button class="btn">' + esc(t("btn.save")) + "</button></div></form>";
  }

  function expForm(r) {
    var isNew = !r;
    r = r || { date: today(), cat: S.categories[0], payee: "", amount: "", note: "" };
    return '<form class="form" data-form="exp" data-id="' + (r.id || "") + '"><h2>' + esc(t(isNew ? "btn.addExpense" : "btn.edit")) + "</h2>" +
      '<div class="row2"><div class="field"><label>' + esc(t("col.date")) + '</label><input type="date" name="date" required value="' + esc(r.date) +
      '"></div><div class="field"><label>' + esc(t("col.amount")) + '</label><input name="amount" inputmode="decimal" required value="' +
      esc(r.amount) + '"></div></div><div class="field"><label>' + esc(t("col.category")) + '</label><select name="cat">' +
      opts(S.categories, "cat", r.cat) + "</select></div>" +
      '<div class="field"><label>' + esc(t("col.paidTo")) + '</label><input name="payee" value="' + esc(r.payee) + '"></div>' +
      '<div class="field"><label>' + esc(t("col.note")) + '</label><input name="note" value="' + esc(r.note) + '"></div><div class="acts">' +
      (isNew ? "" : '<button type="button" class="btn danger" data-act="del-exp" data-id="' + r.id + '">' + esc(t("btn.delete")) + "</button>") +
      '<span class="sp"></span><button type="button" class="btn ghost" data-act="close">' + esc(t("btn.cancel")) +
      '</button><button class="btn">' + esc(t("btn.save")) + "</button></div></form>";
  }

  function updatePreview(form) {
    var f = form.elements, amt = parseNum(f.amount.value), cost = parseNum(f.cost.value);
    var sale = { amount: isNaN(amt) ? 0 : amt, cost: isNaN(cost) ? 0 : cost, channel: f.channel.value };
    var fee = C.feeFor(sale, S.channels);
    document.getElementById("pvf").textContent = t("col.fees") + ": " + money(fee);
    var n = document.getElementById("pvn");
    n.textContent = t("col.net") + ": " + money(sale.amount - sale.cost - fee);
  }

  /* ---------- çizim ---------- */

  function render() {
    var main = document.getElementById("main"), sc = main.scrollTop;
    var titles = { dashboard: "nav.dashboard", sales: "nav.sales", expenses: "nav.expenses", reports: "nav.reports", settings: "nav.settings" };
    var action = "";
    if (view === "sales" || view === "dashboard") {
      action = '<button class="btn" data-act="add-sale">+ <span class="long">' + esc(t("btn.addSale")) + "</span></button>";
    } else if (view === "expenses") {
      action = '<button class="btn" data-act="add-exp">+ <span class="long">' + esc(t("btn.addExpense")) + "</span></button>";
    }
    var langOpts = Object.keys(I18n.LANGS).map(function (k) {
      return '<option value="' + k + '"' + (k === I18n.lang ? " selected" : "") + ">" + esc(I18n.LANGS[k]) + "</option>";
    }).join("");
    var top = '<div class="top"><h1>' + esc(view === "dashboard" ? shopName() : t(titles[view])) + "<small>" +
      esc(view === "dashboard" ? t("app.tagline") : shopName()) + '</small></h1><select class="lang" id="langSel" aria-label="' +
      esc(t("lang.label")) + '">' + langOpts + "</select>" + action + "</div>";
    var body = { dashboard: vDashboard, sales: vSales, expenses: vExpenses, reports: vReports, settings: vSettings }[view]();
    main.innerHTML = top + body;
    main.scrollTop = sc;

    document.getElementById("nav").innerHTML = '<div class="brand"><div class="logo">$</div><span>' + esc(t("app.name")) + "</span></div>" +
      VIEWS.map(function (v) {
        return '<button class="navbtn' + (v === view ? " on" : "") + '" data-nav="' + v + '"><svg viewBox="0 0 24 24">' + ICONS[v] +
          "</svg><span>" + esc(t("nav." + v)) + "</span></button>";
      }).join("");
    document.title = t("app.name");

    var mo = document.getElementById("modal");
    if (modal) {
      mo.innerHTML = '<div class="ov" data-act="ov"><div class="dlg">' + modal.html + "</div></div>";
      var form = mo.querySelector('form[data-form="sale"]');
      if (form) updatePreview(form);
    } else mo.innerHTML = "";
  }

  /* ---------- olaylar ---------- */

  function download(name, text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function setFilter(key, val) {
    var p = key.split(".");
    flt[p[0]][p[1]] = val;
    var box = document.getElementById("flist");
    if (box) box.innerHTML = listHtml(p[0]);
  }

  function uniqueName(base, taken) {
    var n = taken.length + 1, name = base + " " + n;
    while (taken.indexOf(name) >= 0) { n++; name = base + " " + n; }
    return name;
  }

  document.addEventListener("click", function (e) {
    var nb = e.target.closest("[data-nav]");
    if (nb) { view = nb.getAttribute("data-nav"); modal = null; render(); document.getElementById("main").scrollTop = 0; return; }
    var sb = e.target.closest("[data-sub]");
    if (sb) { sub[view] = sb.getAttribute("data-sub"); render(); return; }
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act"), id = parseInt(el.getAttribute("data-id"), 10), i = parseInt(el.getAttribute("data-i"), 10);
    if (act === "ov") { if (e.target === el) { modal = null; render(); } return; }
    var find = function (arr) { return arr.filter(function (x) { return x.id === id; })[0]; };
    switch (act) {
      case "close": modal = null; break;
      case "clear-flt": flt[el.getAttribute("data-kind")] = { from: "", to: "", a: "", b: "", q: "" }; break;
      case "add-sale": modal = { html: saleForm() }; break;
      case "edit-sale": modal = { html: saleForm(find(S.sales)) }; break;
      case "add-exp": modal = { html: expForm() }; break;
      case "edit-exp": modal = { html: expForm(find(S.expenses)) }; break;
      case "del-sale": S.sales = S.sales.filter(function (x) { return x.id !== id; }); save(); modal = null; break;
      case "del-exp": S.expenses = S.expenses.filter(function (x) { return x.id !== id; }); save(); modal = null; break;
      case "clear-demo": S.sales = []; S.expenses = []; S.demo = false; save(); break;
      case "load-demo": S = fresh(); save(); applyLangCur(I18n.lang); break;
      case "export": download("seller-profit-backup-" + today() + ".json", JSON.stringify(S, null, 1)); return;
      case "import": document.getElementById("impFile").click(); return;
      case "add-ch": S.channels.push({ name: uniqueName(t("set.channelName"), S.channels.map(function (c) { return c.name; })), pct: 0, fixed: 0 }); save(); break;
      case "del-ch": S.channels.splice(i, 1); save(); break;
      case "add-cat": S.categories.push(uniqueName(t("col.category"), S.categories)); save(); break;
      case "del-cat": S.categories.splice(i, 1); save(); break;
      default: return;
    }
    render();
  });

  document.addEventListener("submit", function (e) {
    var f = e.target, kind = f.getAttribute("data-form");
    if (!kind) return;
    e.preventDefault();
    var v = f.elements, id = parseInt(f.getAttribute("data-id"), 10) || 0, amt = parseNum(v.amount.value);
    if (isNaN(amt) || amt < 0) { v.amount.focus(); return; }
    if (kind === "sale") {
      var cost = v.cost.value.trim() === "" ? 0 : parseNum(v.cost.value);
      if (isNaN(cost) || cost < 0) { v.cost.focus(); return; }
      var rec = { id: id || nextId(S.sales), date: v.date.value, ref: v.ref.value.trim(), item: v.item.value.trim(),
        channel: v.channel.value, amount: amt, cost: cost };
      var k = S.sales.map(function (x) { return x.id; }).indexOf(id);
      if (k >= 0) S.sales[k] = rec; else S.sales.push(rec);
    } else {
      var er = { id: id || nextId(S.expenses), date: v.date.value, cat: v.cat.value, payee: v.payee.value.trim(),
        amount: amt, note: v.note.value.trim() };
      var j = S.expenses.map(function (x) { return x.id; }).indexOf(id);
      if (j >= 0) S.expenses[j] = er; else S.expenses.push(er);
    }
    save(); modal = null; render();
  });

  document.addEventListener("input", function (e) {
    var fk = e.target.getAttribute && e.target.getAttribute("data-f");
    if (fk) { setFilter(fk, e.target.value); return; }
    var form = e.target.closest && e.target.closest('form[data-form="sale"]');
    if (form) updatePreview(form);
  });

  document.addEventListener("change", function (e) {
    var el = e.target;
    var fk = el.getAttribute("data-f");
    if (fk) { setFilter(fk, el.value); return; }
    if (el.id === "langSel" || el.id === "langSel2") { I18n.setLang(el.value); applyLangCur(I18n.lang); render(); return; }
    if (el.id === "impFile") {
      var file = el.files[0];
      if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var d = JSON.parse(rd.result);
          if (!d.sales || !d.expenses || !d.channels || !d.categories || !d.settings) throw new Error("format");
          S = d; save(); render();
        } catch (err) { alert("Invalid backup file."); }
      };
      rd.readAsText(file);
      return;
    }
    var set = el.getAttribute("data-set"), st = S.settings;
    if (set) {
      if (set === "shop") st.shop = el.value.trim();
      else if (set === "cur") { st.cur = el.value.trim() || LANG_CUR[I18n.lang] || "$"; st.curManual = !!el.value.trim(); }
      else if (set === "year") { var yr = parseInt(el.value, 10); if (yr > 1990 && yr < 2200) st.year = yr; }
      else if (set === "tax") { var tx = parseNum(el.value); if (!isNaN(tx) && tx >= 0 && tx <= 100) st.tax = tx / 100; }
      save(); render(); return;
    }
    var ch = el.getAttribute("data-ch"), ci = parseInt(el.getAttribute("data-i"), 10);
    if (ch) {
      var c = S.channels[ci];
      if (ch === "name") {
        var nm = el.value.trim();
        if (nm && nm !== I18n.label("ch", c.name) && !S.channels.some(function (x) { return x.name === nm; })) {
          S.sales.forEach(function (r) { if (r.channel === c.name) r.channel = nm; });
          c.name = nm;
        }
      } else {
        var nv = parseNum(el.value);
        if (!isNaN(nv) && nv >= 0) c[ch] = ch === "pct" ? nv / 100 : nv;
      }
      save(); render(); return;
    }
    var cat = el.getAttribute("data-cat");
    if (cat !== null) {
      var idx = parseInt(cat, 10), old = S.categories[idx], nn = el.value.trim();
      if (nn && nn !== I18n.label("cat", old) && S.categories.indexOf(nn) < 0) {
        S.expenses.forEach(function (r) { if (r.cat === old) r.cat = nn; });
        S.categories[idx] = nn;
      }
      save(); render();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal) { modal = null; render(); }
  });

  I18n.setLang(I18n.detect());
  // Bağlantıyla doğrudan görünüm açma (?view=sales&sub=item&lang=de): ilan görselleri ve destek için
  (function () {
    var q = new URLSearchParams(location.search), v = q.get("view"), s = q.get("sub"), l = q.get("lang");
    if (l && I18n.LANGS[l]) I18n.setLang(l);
    if (v && SUBS[v] !== undefined || v === "dashboard" || v === "settings") view = v;
    if (s && SUBS[view] && SUBS[view].indexOf(s) >= 0) sub[view] = s;
    applyLangCur(I18n.lang);
  })();
  render();
})();
