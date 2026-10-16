/* Dil katmanı: tek seçici, tüm hazır metinler buradan. Yeni dil = yeni blok. */
(function (root) {
  "use strict";

  var LANGS = { en: "English", tr: "Türkçe" };

  var D = {
    en: {
      "_loc": "en-US", "_after": false, "_dayFirst": false, "_rtl": false,
      "app.name": "Seller Profit Tracker",
      "app.tagline": "Know what you really keep after fees, shipping and ads.",
      "nav.dashboard": "Dashboard", "nav.sales": "Sales", "nav.expenses": "Expenses",
      "nav.reports": "Reports", "nav.settings": "Settings",
      "lang.label": "Language",
      "btn.addSale": "Add sale", "btn.addExpense": "Add expense", "btn.save": "Save", "btn.cancel": "Cancel",
      "btn.delete": "Delete", "btn.edit": "Edit", "btn.clearDemo": "Clear sample data", "btn.loadDemo": "Load sample data",
      "btn.export": "Export backup", "btn.import": "Import backup",
      "card.revenue": "REVENUE", "card.fees": "FEES PAID", "card.expenses": "EXPENSES", "card.net": "NET PROFIT",
      "card.margin": "MARGIN", "card.orders": "ORDERS", "card.avg": "AVERAGE ORDER", "card.tax": "TAX SET-ASIDE",
      "card.after": "AFTER TAX",
      "sec.monthly": "Month by month", "sec.byChannel": "By channel", "sec.byCategory": "Expenses by category",
      "sec.pl": "Profit & loss", "sec.sales": "Sales", "sec.expenses": "Expenses",
      "col.date": "Date", "col.order": "Order #", "col.item": "Item", "col.channel": "Channel", "col.amount": "Amount",
      "col.cost": "Product + shipping cost", "col.fees": "Fees", "col.net": "Net", "col.category": "Category",
      "col.paidTo": "Paid to", "col.note": "Note", "col.month": "Month", "col.orders": "Orders", "col.total": "Total",
      "pl.revenue": "Revenue", "pl.cost": "Product & shipping cost", "pl.gross": "Gross profit",
      "pl.fees": "Etsy / channel fees", "pl.contrib": "After fees", "pl.otherExp": "Other expenses",
      "pl.opex": "Total expenses", "pl.net": "Net profit", "pl.margin": "Net margin",
      "pl.tax": "Tax set-aside", "pl.after": "Profit after tax set-aside",
      "set.shop": "Shop name", "set.year": "Reporting year", "set.tax": "Tax set-aside %", "set.currency": "Currency symbol",
      "set.channels": "Sales channels & fees", "set.channelName": "Channel", "set.pct": "Fee %", "set.fixed": "Fixed fee",
      "set.categories": "Expense categories", "set.addChannel": "Add channel", "set.addCategory": "Add category",
      "set.feeNote": "Etsy defaults: 6.5% transaction + 3% payment processing = 9.5%, plus $0.45 per order. Offsite Ads add up to 15%. Check your own fee statement and change the numbers to match.",
      "set.data": "Your data",
      "flt.search": "Search…", "flt.all": "All", "flt.clear": "Clear filters", "flt.shown": "Shown",
      "sub.overview": "Overview", "sub.list": "List", "sub.byItem": "By product", "sub.byPayee": "By payee", "sub.byQuarter": "By quarter",
      "msg.empty": "Nothing here yet.", "msg.demo": "These are sample rows. Clear them to start your own books.",
      "msg.disclaimer": "A bookkeeping aid, not tax or accounting advice. Fee rates change; confirm them with your own statements and a qualified professional.",
      "hint.amount": "What the buyer paid you, including shipping if you charge it.",
      "hint.cost": "Materials and the postage label you paid for this order.",
      "hint.feeAuto": "Fee is calculated from the channel.",
      "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      "monthsFull": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      "ch.Etsy": "Etsy", "ch.Etsy + Offsite Ads": "Etsy + Offsite Ads", "ch.Own website": "Own website", "ch.Local / cash": "Local / cash",
      "cat.Materials & supplies": "Materials & supplies", "cat.Shipping labels": "Shipping labels", "cat.Packaging": "Packaging",
      "cat.Etsy ads": "Etsy ads", "cat.Software & tools": "Software & tools", "cat.Photography & mockups": "Photography & mockups",
      "cat.Equipment": "Equipment", "cat.Education": "Education", "cat.Home office share": "Home office share",
      "cat.Bank & card fees": "Bank & card fees", "cat.Taxes & licences": "Taxes & licences",
      "demo.shop": "My Etsy Shop"
    },
    tr: {
      "_loc": "tr-TR", "_after": true, "_dayFirst": true, "_rtl": false,
      "app.name": "Satıcı Kâr Takibi",
      "app.tagline": "Komisyon, kargo ve reklamdan sonra cebinde gerçekte ne kaldığını bil.",
      "nav.dashboard": "Panel", "nav.sales": "Satışlar", "nav.expenses": "Giderler",
      "nav.reports": "Raporlar", "nav.settings": "Ayarlar",
      "lang.label": "Dil",
      "btn.addSale": "Satış ekle", "btn.addExpense": "Gider ekle", "btn.save": "Kaydet", "btn.cancel": "Vazgeç",
      "btn.delete": "Sil", "btn.edit": "Düzenle", "btn.clearDemo": "Örnek verileri temizle", "btn.loadDemo": "Örnek verileri yükle",
      "btn.export": "Yedek indir", "btn.import": "Yedek yükle",
      "card.revenue": "CİRO", "card.fees": "ÖDENEN KOMİSYON", "card.expenses": "GİDERLER", "card.net": "NET KÂR",
      "card.margin": "KÂR MARJI", "card.orders": "SİPARİŞ", "card.avg": "ORTALAMA SİPARİŞ", "card.tax": "AYRILAN VERGİ",
      "card.after": "VERGİ SONRASI",
      "sec.monthly": "Ay ay", "sec.byChannel": "Kanala göre", "sec.byCategory": "Kategoriye göre giderler",
      "sec.pl": "Kâr ve zarar", "sec.sales": "Satışlar", "sec.expenses": "Giderler",
      "col.date": "Tarih", "col.order": "Sipariş no", "col.item": "Ürün", "col.channel": "Kanal", "col.amount": "Tutar",
      "col.cost": "Ürün + kargo maliyeti", "col.fees": "Komisyon", "col.net": "Net", "col.category": "Kategori",
      "col.paidTo": "Ödenen kişi/yer", "col.note": "Not", "col.month": "Ay", "col.orders": "Sipariş", "col.total": "Toplam",
      "pl.revenue": "Ciro", "pl.cost": "Ürün ve kargo maliyeti", "pl.gross": "Brüt kâr",
      "pl.fees": "Etsy / kanal komisyonları", "pl.contrib": "Komisyon sonrası", "pl.otherExp": "Diğer giderler",
      "pl.opex": "Toplam gider", "pl.net": "Net kâr", "pl.margin": "Net marj",
      "pl.tax": "Ayrılan vergi", "pl.after": "Vergi payı sonrası kâr",
      "set.shop": "Dükkân adı", "set.year": "Rapor yılı", "set.tax": "Vergi için ayrılacak %", "set.currency": "Para birimi simgesi",
      "set.channels": "Satış kanalları ve komisyonlar", "set.channelName": "Kanal", "set.pct": "Komisyon %", "set.fixed": "Sabit ücret",
      "set.categories": "Gider kategorileri", "set.addChannel": "Kanal ekle", "set.addCategory": "Kategori ekle",
      "set.feeNote": "Etsy varsayılanları: %6,5 işlem + %3 ödeme işleme = %9,5, ayrıca sipariş başına 0,45 $. Offsite Ads en çok %15 ekler. Kendi komisyon dökümüne bakıp rakamları ona göre değiştir.",
      "set.data": "Verilerin",
      "flt.search": "Ara…", "flt.all": "Tümü", "flt.clear": "Filtreyi temizle", "flt.shown": "Gösterilen",
      "sub.overview": "Genel", "sub.list": "Liste", "sub.byItem": "Ürüne göre", "sub.byPayee": "Ödenene göre", "sub.byQuarter": "Çeyreğe göre",
      "msg.empty": "Burada henüz bir şey yok.", "msg.demo": "Bunlar örnek satırlar. Kendi defterine başlamak için temizle.",
      "msg.disclaimer": "Bir kayıt aracıdır; vergi veya muhasebe tavsiyesi değildir. Komisyon oranları değişir; kendi dökümlerinle ve bir uzmanla doğrula.",
      "hint.amount": "Alıcının sana ödediği tutar; kargo ücreti alıyorsan dahil.",
      "hint.cost": "Bu sipariş için ödediğin malzeme ve kargo etiketi.",
      "hint.feeAuto": "Komisyon kanala göre otomatik hesaplanır.",
      "months": ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
      "monthsFull": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
      "ch.Etsy": "Etsy", "ch.Etsy + Offsite Ads": "Etsy + Offsite Ads", "ch.Own website": "Kendi web sitem", "ch.Local / cash": "Yerel / nakit",
      "cat.Materials & supplies": "Malzeme ve sarf", "cat.Shipping labels": "Kargo etiketleri", "cat.Packaging": "Ambalaj",
      "cat.Etsy ads": "Etsy reklamları", "cat.Software & tools": "Yazılım ve araçlar", "cat.Photography & mockups": "Fotoğraf ve mockup",
      "cat.Equipment": "Ekipman", "cat.Education": "Eğitim", "cat.Home office share": "Ev ofisi payı",
      "cat.Bank & card fees": "Banka ve kart ücretleri", "cat.Taxes & licences": "Vergi ve ruhsat",
      "demo.shop": "Etsy Dükkânım"
    }
  };

  var current = "en";

  // Ek dil dosyaları (lang/xx.js) kendini buraya kaydeder: register("de", "Deutsch", {...})
  function register(code, name, dict) {
    LANGS[code] = name;
    D[code] = dict;
  }

  function meta(k, dflt) {
    var v = D[current][k];
    return v === undefined ? dflt : v;
  }

  function detect() {
    try {
      var saved = root.localStorage && root.localStorage.getItem("lang");
      if (saved && D[saved]) return saved;
    } catch (e) { /* depolama kapalı olabilir */ }
    var nav = (root.navigator && (root.navigator.language || "")).slice(0, 2).toLowerCase();
    return D[nav] ? nav : "en";
  }

  function setLang(code) {
    if (!D[code]) return current;
    current = code;
    try { root.localStorage && root.localStorage.setItem("lang", code); } catch (e) { /* yoksay */ }
    if (root.document) {
      root.document.documentElement.lang = code;
      root.document.documentElement.dir = meta("_rtl", false) ? "rtl" : "ltr";
    }
    return current;
  }

  // t(anahtar): eksikse İngilizceye, o da yoksa anahtarın kendisine düşer
  function t(key) {
    var v = D[current][key];
    if (v === undefined) v = D.en[key];
    return v === undefined ? key : v;
  }

  // Hazır kategori/kanal adını çevir; müşterinin kendi yazdığı ad aynen döner
  function label(kind, name) {
    var k = kind + "." + name;
    return D[current][k] !== undefined ? D[current][k] : name;
  }

  // Sayı biçimi dilin yerel ayarına göre; para simgesi başta (en) ya da sonda (_after)
  function money(x, cur) {
    var n = Math.abs(x).toLocaleString(meta("_loc", "en-US"),
      { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (x < 0 ? "-" : "") + (meta("_after", false) ? n + " " + cur : cur + n);
  }

  function pct(x) {
    return (x * 100).toLocaleString(meta("_loc", "en-US"),
      { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  }

  function dateShort(iso) {
    var m = parseInt(iso.slice(5, 7), 10) - 1, d = parseInt(iso.slice(8, 10), 10);
    return meta("_dayFirst", false) ? d + " " + t("months")[m] : t("months")[m] + " " + d;
  }

  var api = { LANGS: LANGS, D: D, register: register, detect: detect, setLang: setLang, t: t, label: label,
    money: money, pct: pct, dateShort: dateShort, get lang() { return current; } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.I18n = api;
})(typeof window !== "undefined" ? window : globalThis);
