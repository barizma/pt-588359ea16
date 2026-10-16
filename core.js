/* Hesap çekirdeği: arayüzden bağımsız, saf fonksiyonlar. Node ile sınanır. */
(function (root) {
  "use strict";

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var FULL_MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Excel ROUND gibi: yarımı sıfırdan uzağa yuvarla (kayan nokta hatasına karşı 1e-9 pay)
  function r2(x) {
    var s = x < 0 ? -1 : 1;
    return s * Math.round(Math.abs(x) * 100 + 1e-9) / 100;
  }

  function num(x) {
    var n = typeof x === "number" ? x : parseFloat(x);
    return isFinite(n) ? n : 0;
  }

  function feeFor(sale, channels) {
    var amt = num(sale.amount);
    for (var i = 0; i < channels.length; i++) {
      if (channels[i].name === sale.channel) {
        return r2(amt * num(channels[i].pct) + num(channels[i].fixed));
      }
    }
    return 0;
  }

  function netFor(sale, channels) {
    return num(sale.amount) - num(sale.cost) - feeFor(sale, channels);
  }

  function monthOf(iso, year) {
    // "yyyy-mm-dd" -> 0..11 ya da -1 (başka yıl / geçersiz)
    if (typeof iso !== "string" || iso.length < 10) return -1;
    var y = parseInt(iso.slice(0, 4), 10), m = parseInt(iso.slice(5, 7), 10);
    if (y !== year || !(m >= 1 && m <= 12)) return -1;
    return m - 1;
  }

  function emptyMonth() {
    return { orders: 0, revenue: 0, cost: 0, fees: 0, gross: 0, contrib: 0, byCat: {}, other: 0, opex: 0,
      net: 0, margin: 0, tax: 0, after: 0 };
  }

  function finish(m, taxRate) {
    m.gross = m.revenue - m.cost;
    m.contrib = m.gross - m.fees;
    m.opex = m.other;
    for (var k in m.byCat) m.opex += m.byCat[k];
    m.net = m.contrib - m.opex;
    m.margin = m.revenue === 0 ? 0 : m.net / m.revenue;
    m.tax = Math.max(0, m.net) * taxRate;
    m.after = m.net - m.tax;
    return m;
  }

  function summarize(state, year) {
    year = year || state.settings.year;
    var taxRate = num(state.settings.tax);
    var months = [], i;
    for (i = 0; i < 12; i++) months.push(emptyMonth());
    var chan = {}, cats = {}, other = 0;
    state.channels.forEach(function (c) { chan[c.name] = { orders: 0, revenue: 0, fees: 0, net: 0 }; });
    state.categories.forEach(function (c) { cats[c] = 0; });

    state.sales.forEach(function (s) {
      var mi = monthOf(s.date, year);
      if (mi < 0 || s.amount === "" || s.amount == null) return;
      var m = months[mi], f = feeFor(s, state.channels);
      m.orders += 1;
      m.revenue += num(s.amount);
      m.cost += num(s.cost);
      m.fees += f;
      var c = chan[s.channel];
      if (c) { c.orders += 1; c.revenue += num(s.amount); c.fees += f; c.net += num(s.amount) - num(s.cost) - f; }
    });

    state.expenses.forEach(function (e) {
      var mi = monthOf(e.date, year);
      if (mi < 0) return;
      var a = num(e.amount);
      if (Object.prototype.hasOwnProperty.call(cats, e.cat)) {
        months[mi].byCat[e.cat] = (months[mi].byCat[e.cat] || 0) + a;
        cats[e.cat] += a;
      } else {
        months[mi].other += a;
        other += a;
      }
    });

    months.forEach(function (m) { finish(m, taxRate); });

    // yıl toplamı: vergi payı yıllık net üzerinden (aylık negatifler birbirini götürür)
    var y = emptyMonth();
    months.forEach(function (m) {
      y.orders += m.orders; y.revenue += m.revenue; y.cost += m.cost; y.fees += m.fees;
    });
    y.byCat = cats;
    y.other = other;
    finish(y, taxRate);
    return { year: year, months: months, total: y, channels: chan, categories: cats, other: other };
  }

  var api = { MONTHS: MONTHS, FULL_MONTHS: FULL_MONTHS, r2: r2, num: num, feeFor: feeFor, netFor: netFor,
    monthOf: monthOf, summarize: summarize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
