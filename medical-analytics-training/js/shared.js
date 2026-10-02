/* =====================================================================
   shared.js — branding, language, theme, navigation shell, statistics,
   Created by Master of AI.
   SVG charts, code blocks, data explorer. Used by every page.
   No external libraries. Works from GitHub Pages and from file://.
   Synthetic educational data only — not for clinical decision-making.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. BRANDING — change these values to re-brand the whole application.
   Logos live in assets/ (logo-dark.png is shown on the dark theme,
   logo-light.png on the light theme). Nothing else is hard-coded.
   --------------------------------------------------------------------- */
const BRAND = {
  companyName: "Master of AI",
  createdBy: "Master of AI",
  presenterName: "Master of AI",
  department: "Al-Ahliyya Amman University",
  defaultLanguage: "en",          // "en" | "ar"
  defaultTheme: "dark",           // "dark" | "light"
  logos: { dark: "assets/logo-dark.png", light: "assets/logo-light.png" },
  courseTitle: { en: "Medical Analytics Training", ar: "برنامج تدريب تحليلات البيانات الطبية" },
  contactEmail: "",               // optional, shown in About when set
  year: new Date().getFullYear(),
};

/* ---------------------------------------------------------------------
   2. Safe storage (private mode / blocked storage must never break the app)
   --------------------------------------------------------------------- */
const Store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } },
};

/* ---------------------------------------------------------------------
   3. App state, events, language & theme
   --------------------------------------------------------------------- */
const App = {
  lang: ["en", "ar"].includes(Store.get("mat-lang", BRAND.defaultLanguage)) ? Store.get("mat-lang", BRAND.defaultLanguage) : "en",
  theme: ["dark", "light"].includes(Store.get("mat-theme", BRAND.defaultTheme)) ? Store.get("mat-theme", BRAND.defaultTheme) : "dark",
  listeners: {},
  on(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); },
  emit(evt, payload) { (this.listeners[evt] || []).forEach(fn => fn(payload)); },
};

/** Pick the string for the active language: L("Hello", "مرحبا") */
function L(en, ar) { return App.lang === "ar" && ar !== undefined ? ar : en; }
/** Same as L but for {en, ar} objects */
function LT(obj) { return obj ? (App.lang === "ar" && obj.ar ? obj.ar : obj.en) : ""; }

const I18N = {
  en: {
    "nav.home": "Home", "nav.l1": "Lecture 1", "nav.l2": "Lecture 2", "nav.downloads": "Downloads",
    "nav.exercises": "Exercises", "nav.about": "About", "nav.menu": "Open menu", "nav.close": "Close menu",
    "nav.main": "Main navigation", "nav.sections": "Sections",
    "theme.toDark": "Switch to dark mode", "theme.toLight": "Switch to light mode", "theme.label": "Theme",
    "lang.label": "Language", "skip": "Skip to main content",
    "footer.about": "Two interactive lectures that explain, step by step, how raw medical data becomes insight — and how insight becomes dashboards, automation and AI assistance.",
    "footer.learn": "Learn", "footer.resources": "Resources", "footer.rights": "All rights reserved.",
    "footer.built": "Static site — no backend, no tracking.",
    "code.copy": "Copy", "code.copied": "Copied to clipboard", "code.download": "Download", "code.downloaded": "Download started",
    "copy.failed": "Copy failed — select the text manually",
    "ex.search": "Search all columns", "ex.dataset": "Dataset", "ex.messy": "Messy (raw)", "ex.clean": "Clean",
    "ex.filterCol": "Filter column", "ex.op": "Condition", "ex.value": "Value", "ex.none": "— none —",
    "ex.contains": "contains", "ex.equals": "equals", "ex.gt": "greater than", "ex.lt": "less than",
    "ex.isMissing": "is missing", "ex.notMissing": "is not missing", "ex.columns": "Columns",
    "ex.rows": "rows", "ex.of": "of", "ex.showing": "Showing", "ex.page": "Page", "ex.prev": "Previous page", "ex.next": "Next page",
    "ex.perPage": "Rows per page", "ex.missing": "missing", "ex.suspect": "suspicious / invalid value",
    "ex.download": "Download filtered CSV", "ex.reset": "Reset", "ex.all": "All", "ex.noRows": "No rows match the current search and filter.",
    "ex.legendMissing": "Missing value", "ex.legendSuspect": "Format issue or outside valid range",
    "ex.sortHint": "Click a column header to sort",
  },
  ar: {
    "nav.home": "الرئيسية", "nav.l1": "المحاضرة 1", "nav.l2": "المحاضرة 2", "nav.downloads": "التنزيلات",
    "nav.exercises": "التمارين", "nav.about": "حول", "nav.menu": "فتح القائمة", "nav.close": "إغلاق القائمة",
    "nav.main": "التنقل الرئيسي", "nav.sections": "الأقسام",
    "theme.toDark": "التبديل إلى الوضع الداكن", "theme.toLight": "التبديل إلى الوضع الفاتح", "theme.label": "المظهر",
    "lang.label": "اللغة", "skip": "انتقل إلى المحتوى الرئيسي",
    "footer.about": "محاضرتان تفاعليتان تشرحان خطوة بخطوة كيف تتحول البيانات الطبية الخام إلى رؤية — وكيف تتحول الرؤية إلى لوحات مؤشرات وأتمتة ومساعدة بالذكاء الاصطناعي.",
    "footer.learn": "التعلّم", "footer.resources": "الموارد", "footer.rights": "جميع الحقوق محفوظة.",
    "footer.built": "موقع ثابت — بلا خادم وبلا تتبّع.",
    "code.copy": "نسخ", "code.copied": "تم النسخ إلى الحافظة", "code.download": "تنزيل", "code.downloaded": "بدأ التنزيل",
    "copy.failed": "تعذّر النسخ — حدّد النص يدويًا",
    "ex.search": "ابحث في جميع الأعمدة", "ex.dataset": "مجموعة البيانات", "ex.messy": "غير منظّفة (خام)", "ex.clean": "منظّفة",
    "ex.filterCol": "عمود التصفية", "ex.op": "الشرط", "ex.value": "القيمة", "ex.none": "— بلا —",
    "ex.contains": "يحتوي", "ex.equals": "يساوي", "ex.gt": "أكبر من", "ex.lt": "أصغر من",
    "ex.isMissing": "مفقودة", "ex.notMissing": "غير مفقودة", "ex.columns": "الأعمدة",
    "ex.rows": "صفًا", "ex.of": "من", "ex.showing": "عرض", "ex.page": "صفحة", "ex.prev": "الصفحة السابقة", "ex.next": "الصفحة التالية",
    "ex.perPage": "صفوف لكل صفحة", "ex.missing": "مفقودة", "ex.suspect": "قيمة مشبوهة / غير صالحة",
    "ex.download": "تنزيل CSV المُصفّى", "ex.reset": "إعادة ضبط", "ex.all": "الكل", "ex.noRows": "لا توجد صفوف مطابقة للبحث والتصفية الحالية.",
    "ex.legendMissing": "قيمة مفقودة", "ex.legendSuspect": "مشكلة تنسيق أو خارج النطاق الصالح",
    "ex.sortHint": "انقر على عنوان العمود للفرز",
  },
};
function t(key) { return (I18N[App.lang] && I18N[App.lang][key]) || I18N.en[key] || key; }

function applyLang(lang, silent) {
  App.lang = lang === "ar" ? "ar" : "en";
  Store.set("mat-lang", App.lang);
  const html = document.documentElement;
  html.lang = App.lang;
  html.dir = App.lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-aria-en]").forEach(el => el.setAttribute("aria-label", el.dataset[App.lang === "ar" ? "ariaAr" : "ariaEn"]));
  document.querySelectorAll("[data-ph-en]").forEach(el => el.setAttribute("placeholder", el.dataset[App.lang === "ar" ? "phAr" : "phEn"]));
  if (!silent) App.emit("lang", App.lang);
}

function applyTheme(theme, silent) {
  App.theme = theme === "light" ? "light" : "dark";
  Store.set("mat-theme", App.theme);
  document.documentElement.setAttribute("data-theme", App.theme);
  document.querySelectorAll("img[data-logo]").forEach(img => { img.src = BRAND.logos[App.theme]; });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", App.theme === "dark" ? "#0a1120" : "#f4f7fc");
  if (!silent) App.emit("theme", App.theme);
}

/* Apply as early as possible to avoid a flash of the wrong theme/direction */
applyLang(App.lang, true);
applyTheme(App.theme, true);

/* ---------------------------------------------------------------------
   4. Icons (inline SVG, currentColor)
   --------------------------------------------------------------------- */
const ICON = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="flip-rtl"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="flip-rtl"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M12 8v5M12 16v.5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  sidebar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>',
  data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  zip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16v13H4zM2 4h20v3H2zM10 11h4"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L20 8l-4-4L4 16z"/></svg>',
  notebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 7H3M5 12H3M5 17H3M9 8h7M9 12h7"/></svg>',
  db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
};

/* ---------------------------------------------------------------------
   5. Small helpers
   --------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmt(x, d = 2) {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtInt(x) { return x === null || x === undefined || Number.isNaN(x) ? "—" : Math.round(x).toLocaleString("en-US"); }
function fmtP(p) {
  if (p === null || p === undefined || Number.isNaN(p)) return "—";
  if (p < 0.001) return "< 0.001";
  return p.toFixed(p < 0.01 ? 4 : 3);
}
function fmtPct(x, d = 1) { return x === null || x === undefined ? "—" : `${fmt(x, d)}%`; }
function fmtBytes(b) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`; }
function debounce(fn, ms = 150) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; }
const prefersReducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function toast(msg) {
  let host = $(".toast-host");
  if (!host) { host = document.createElement("div"); host.className = "toast-host"; host.setAttribute("role", "status"); host.setAttribute("aria-live", "polite"); document.body.appendChild(host); }
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg; host.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* fall through */ }
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

function callout(type, title, body) {
  const icon = { info: ICON.info, tip: ICON.bulb, warn: ICON.warn, danger: ICON.warn, safety: ICON.shield }[type] || ICON.info;
  return `<div class="callout ${type}" role="note"><span class="callout-icon">${icon}</span><div class="callout-body">${title ? `<strong class="callout-title">${title}</strong>` : ""}${body}</div></div>`;
}
function kpi(label, value, sub = "", cls = "", code = null) {
  return `<div class="kpi ${cls}${code ? " has-code" : ""}"${code ? codeAttr(code) : ""}><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ""}</div>`;
}
function segmented(name, options, active, label) {
  return `<div class="segmented" role="group" aria-label="${esc(label || name)}" data-seg="${name}">${options.map(o =>
    `<button type="button" data-value="${esc(o.value)}" aria-pressed="${String(o.value) === String(active)}">${o.label}</button>`).join("")}</div>`;
}
function selectEl(id, options, active, label) {
  return `<div class="field"><label for="${id}">${label}</label><select id="${id}">${options.map(o =>
    `<option value="${esc(o.value)}" ${String(o.value) === String(active) ? "selected" : ""}>${o.label}</option>`).join("")}</select></div>`;
}
/** Wire a segmented control: calls fn(value) on click */
function bindSeg(root, name, fn) {
  const seg = root.querySelector(`[data-seg="${name}"]`);
  if (!seg) return;
  seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-value]");
    if (!b) return;
    seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    fn(b.dataset.value);
  });
}

/* ---------------------------------------------------------------------
   6. Variable metadata (labels in both languages + units)
   --------------------------------------------------------------------- */
const VARMETA = {
  age: { en: "Age", ar: "العمر", unit: "years", unitAr: "سنة" },
  bmi: { en: "BMI", ar: "مؤشر كتلة الجسم (BMI)", unit: "kg/m²", unitAr: "كغ/م²" },
  systolic_bp: { en: "Systolic BP", ar: "ضغط الدم الانقباضي", unit: "mmHg", unitAr: "ملم زئبق" },
  diastolic_bp: { en: "Diastolic BP", ar: "ضغط الدم الانبساطي", unit: "mmHg", unitAr: "ملم زئبق" },
  heart_rate: { en: "Heart rate", ar: "معدل نبض القلب", unit: "bpm", unitAr: "نبضة/دقيقة" },
  fasting_glucose: { en: "Fasting glucose", ar: "سكر الدم الصائم", unit: "mg/dL", unitAr: "ملغ/دل" },
  hba1c: { en: "HbA1c", ar: "الهيموغلوبين السكري HbA1c", unit: "%", unitAr: "%" },
  total_cholesterol: { en: "Total cholesterol", ar: "الكوليسترول الكلي", unit: "mg/dL", unitAr: "ملغ/دل" },
  exercise_days_per_week: { en: "Exercise days / week", ar: "أيام الرياضة أسبوعيًا", unit: "days", unitAr: "أيام" },
  medication_adherence_pct: { en: "Medication adherence", ar: "الالتزام بالدواء", unit: "%", unitAr: "%" },
  visits_last_year: { en: "Visits last year", ar: "الزيارات في العام الماضي", unit: "visits", unitAr: "زيارات" },
  risk_score: { en: "Risk score (synthetic)", ar: "درجة الخطورة (اصطناعية)", unit: "points", unitAr: "نقطة" },
  follow_up_days: { en: "Follow-up days", ar: "أيام المتابعة", unit: "days", unitAr: "أيام" },
  family_history_flag: { en: "Family history", ar: "التاريخ العائلي", unit: "", unitAr: "" },
};
const GROUPMETA = {
  none: { en: "No grouping", ar: "بدون تجميع" },
  risk_group: { en: "Risk group", ar: "مجموعة الخطورة" },
  sex: { en: "Sex", ar: "الجنس" },
  smoking_status: { en: "Smoking status", ar: "حالة التدخين" },
  clinic_id: { en: "Clinic", ar: "العيادة" },
  age_group: { en: "Age group", ar: "الفئة العمرية" },
  family_history_flag: { en: "Family history", ar: "التاريخ العائلي" },
};
const LEVEL_LABELS = {
  Low: { en: "Low", ar: "منخفضة" }, Moderate: { en: "Moderate", ar: "متوسطة" }, High: { en: "High", ar: "مرتفعة" },
  Male: { en: "Male", ar: "ذكر" }, Female: { en: "Female", ar: "أنثى" },
  Smoker: { en: "Smoker", ar: "مدخّن" }, "Non-Smoker": { en: "Non-Smoker", ar: "غير مدخّن" },
  "0": { en: "No family history", ar: "لا تاريخ عائلي" }, "1": { en: "Family history", ar: "تاريخ عائلي" },
};
const vlabel = v => (VARMETA[v] ? LT(VARMETA[v]) : v);
const vunit = v => (VARMETA[v] ? (App.lang === "ar" ? VARMETA[v].unitAr : VARMETA[v].unit) : "");
const glabel = g => (GROUPMETA[g] ? LT(GROUPMETA[g]) : g);
const levlabel = l => (LEVEL_LABELS[String(l)] ? LT(LEVEL_LABELS[String(l)]) : String(l));

/* ---------------------------------------------------------------------
   7. Data access (window.SITE_DATA is generated by tools/build_site_data.py)
   --------------------------------------------------------------------- */
const Data = {
  _clean: null, _messy: null,
  get site() { return window.SITE_DATA || null; },
  clean() {
    if (!this._clean && this.site) {
      const { columns, rows } = this.site.clean;
      this._clean = rows.map(r => {
        const o = {};
        columns.forEach((c, i) => { o[c] = r[i]; });
        o.age_group = o.age == null ? null : o.age < 35 ? "18-34" : o.age < 50 ? "35-49" : o.age < 65 ? "50-64" : "65+";
        return o;
      });
    }
    return this._clean || [];
  },
  messy() {
    if (!this._messy && this.site) {
      const { columns, rows } = this.site.messy;
      this._messy = rows.map(r => { const o = {}; columns.forEach((c, i) => { o[c] = r[i]; }); return o; });
    }
    return this._messy || [];
  },
  values(rows, col) {
    const out = [];
    for (const r of rows) { const v = r[col]; if (v !== null && v !== undefined && v !== "" && !Number.isNaN(+v)) out.push(+v); }
    return out;
  },
  levels(rows, col) {
    const order = { risk_group: ["Low", "Moderate", "High"], age_group: ["18-34", "35-49", "50-64", "65+"], sex: ["Female", "Male"], smoking_status: ["Non-Smoker", "Smoker"], family_history_flag: [0, 1] };
    if (order[col]) return order[col];
    return Array.from(new Set(rows.map(r => r[col]).filter(v => v !== null && v !== undefined))).sort();
  },
};

/* ---------------------------------------------------------------------
   8. Statistics (same conventions as pandas / SciPy)
   --------------------------------------------------------------------- */
const Stats = {
  sorted(xs) { return Float64Array.from(xs).sort(); },
  sum(xs) { let s = 0; for (const x of xs) s += x; return s; },
  mean(xs) { return xs.length ? this.sum(xs) / xs.length : NaN; },
  /** Linear interpolation quantile (numpy/pandas default). Expects sorted input. */
  quantileSorted(s, p) {
    if (!s.length) return NaN;
    const pos = (s.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  },
  quantile(xs, p) { return this.quantileSorted(this.sorted(xs), p); },
  median(xs) { return this.quantile(xs, 0.5); },
  /** Smallest of the most frequent values (pandas .mode().iloc[0]) */
  mode(xs) {
    const m = new Map(); let best = NaN, bestN = 0;
    for (const x of xs) m.set(x, (m.get(x) || 0) + 1);
    for (const [v, n] of m) if (n > bestN || (n === bestN && v < best)) { best = v; bestN = n; }
    return best;
  },
  variance(xs) { const n = xs.length; if (n < 2) return NaN; const m = this.mean(xs); let s = 0; for (const x of xs) s += (x - m) ** 2; return s / (n - 1); },
  sd(xs) { return Math.sqrt(this.variance(xs)); },
  /** Adjusted Fisher-Pearson skewness (pandas .skew()) */
  skew(xs) {
    const n = xs.length; if (n < 3) return NaN;
    const m = this.mean(xs); let m2 = 0, m3 = 0;
    for (const x of xs) { const d = x - m; m2 += d * d; m3 += d * d * d; }
    m2 /= n; m3 /= n;
    if (m2 === 0) return 0;
    return (Math.sqrt(n * (n - 1)) / (n - 2)) * (m3 / Math.pow(m2, 1.5));
  },
  /** Excess kurtosis, bias-corrected (pandas .kurt()) */
  kurt(xs) {
    const n = xs.length; if (n < 4) return NaN;
    const m = this.mean(xs); let m2 = 0, m4 = 0;
    for (const x of xs) { const d = x - m; m2 += d * d; m4 += d ** 4; }
    const v = m2 / (n - 1);
    const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * (m4 / (v * v));
    return a - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  },
  describe(xs) {
    const s = this.sorted(xs), n = s.length;
    if (!n) return { n: 0 };
    const mean = this.mean(s), q1 = this.quantileSorted(s, .25), q3 = this.quantileSorted(s, .75);
    const variance = this.variance(s);
    return {
      n, mean, median: this.quantileSorted(s, .5), mode: this.mode(s), min: s[0], max: s[n - 1], range: s[n - 1] - s[0],
      variance, std: Math.sqrt(variance), q1, q3, iqr: q3 - q1, p5: this.quantileSorted(s, .05), p95: this.quantileSorted(s, .95),
      p10: this.quantileSorted(s, .1), p90: this.quantileSorted(s, .9),
      skewness: this.skew(s), kurtosis: this.kurt(s), cv: 100 * Math.sqrt(variance) / mean,
    };
  },
  fences(xs, k = 1.5) {
    const s = this.sorted(xs), q1 = this.quantileSorted(s, .25), q3 = this.quantileSorted(s, .75), iqr = q3 - q1;
    return { q1, q3, iqr, lo: q1 - k * iqr, hi: q3 + k * iqr };
  },
  pairs(rows, a, b) {
    const xs = [], ys = [];
    for (const r of rows) { const x = r[a], y = r[b]; if (x != null && y != null) { xs.push(+x); ys.push(+y); } }
    return [xs, ys];
  },
  covariance(xs, ys) { const n = xs.length, mx = this.mean(xs), my = this.mean(ys); let s = 0; for (let i = 0; i < n; i++) s += (xs[i] - mx) * (ys[i] - my); return s / (n - 1); },
  pearson(xs, ys) { return this.covariance(xs, ys) / (this.sd(xs) * this.sd(ys)); },
  ranks(xs) {
    const idx = xs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(xs.length);
    for (let i = 0; i < idx.length;) {
      let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
      i = j + 1;
    }
    return r;
  },
  spearman(xs, ys) { return this.pearson(this.ranks(xs), this.ranks(ys)); },
  linreg(xs, ys) { const b = this.covariance(xs, ys) / this.variance(xs); return { slope: b, intercept: this.mean(ys) - b * this.mean(xs) }; },

  /* --- distributions --- */
  lgamma(z) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - this.lgamma(1 - z);
    z -= 1; let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const tt = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(tt) - tt + Math.log(x);
  },
  betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  },
  ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(this.lgamma(a + b) - this.lgamma(a) - this.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * this.betacf(a, b, x) / a : 1 - bt * this.betacf(b, a, 1 - x) / b;
  },
  tcdf(tv, df) { const x = df / (df + tv * tv); const p = 0.5 * this.ibeta(x, df / 2, 0.5); return tv >= 0 ? 1 - p : p; },
  tpdf(tv, df) { return Math.exp(this.lgamma((df + 1) / 2) - this.lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + tv * tv / df)); },
  tinv(p, df) { // quantile by bisection (robust, fast enough for UI use)
    let lo = -1000, hi = 1000;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (this.tcdf(mid, df) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  },
  /** Welch two-sample t-test (scipy.stats.ttest_ind(a, b, equal_var=False)) */
  welch(a, b, level = 0.95) {
    const na = a.length, nb = b.length, ma = this.mean(a), mb = this.mean(b);
    const va = this.variance(a) / na, vb = this.variance(b) / nb, se = Math.sqrt(va + vb);
    const tv = (ma - mb) / se;
    const df = (va + vb) ** 2 / (va * va / (na - 1) + vb * vb / (nb - 1));
    const p = 2 * (1 - this.tcdf(Math.abs(tv), df));
    const tc = this.tinv(1 - (1 - level) / 2, df), diff = mb - ma;
    const pooled = Math.sqrt(((na - 1) * this.variance(a) + (nb - 1) * this.variance(b)) / (na + nb - 2));
    const g = ((mb - ma) / pooled) * (1 - 3 / (4 * (na + nb) - 9));
    return { t: tv, df, p, diff, lo: diff - tc * se, hi: diff + tc * se, se, g, na, nb, ma, mb, tcrit: tc };
  },
  /** Standard normal CDF (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7) */
  ncdf(z) {
    const x = Math.abs(z) / Math.SQRT2, tt = 1 / (1 + 0.3275911 * x);
    const erf = 1 - (((((1.061405429 * tt - 1.453152027) * tt) + 1.421413741) * tt - 0.284496736) * tt + 0.254829592) * tt * Math.exp(-x * x);
    return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
  },
  /** Mann–Whitney U, two-sided, normal approximation with tie & continuity
      correction (scipy.stats.mannwhitneyu default for large samples) */
  mannWhitney(a, b) {
    const n1 = a.length, n2 = b.length, all = a.concat(b), r = this.ranks(all), N = n1 + n2;
    let R1 = 0; for (let i = 0; i < n1; i++) R1 += r[i];
    const U1 = R1 - (n1 * (n1 + 1)) / 2, U = Math.max(U1, n1 * n2 - U1);
    const counts = new Map(); for (const v of all) counts.set(v, (counts.get(v) || 0) + 1);
    let ties = 0; for (const c of counts.values()) ties += c ** 3 - c;
    const sigma = Math.sqrt((n1 * n2 / 12) * ((N + 1) - ties / (N * (N - 1))));
    const z = (U - (n1 * n2) / 2 - 0.5) / sigma;
    return { U: U1, z, p: Math.min(1, 2 * (1 - this.ncdf(z))) };
  },
  meanCI(xs, level = 0.95) {
    const n = xs.length, m = this.mean(xs), se = this.sd(xs) / Math.sqrt(n), tc = this.tinv(1 - (1 - level) / 2, n - 1);
    return { n, mean: m, se, tcrit: tc, lo: m - tc * se, hi: m + tc * se };
  },
  /** Seeded PRNG (mulberry32) for reproducible simulations */
  rng(seed = 42) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let z = Math.imul(a ^ a >>> 15, 1 | a); z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z; return ((z ^ z >>> 14) >>> 0) / 4294967296; }; },
  sampleWithoutReplacement(xs, n, rand) {
    const arr = Array.from(xs), out = [];
    for (let i = 0; i < n && arr.length; i++) { const j = Math.floor(rand() * arr.length); out.push(arr[j]); arr[j] = arr[arr.length - 1]; arr.pop(); }
    return out;
  },
};

/* ---------------------------------------------------------------------
   9. Charts — tiny responsive SVG chart engine (theme-aware via CSS vars)
   --------------------------------------------------------------------- */
const Charts = (() => {
  const registry = new WeakMap();
  const lastWidth = new WeakMap();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(entries => {
    for (const e of entries) {
      const w = Math.round(e.contentRect.width);
      if (w && Math.abs((lastWidth.get(e.target) || 0) - w) > 4) paint(e.target);
    }
  }) : null;

  function paint(el) {
    const draw = registry.get(el);
    if (!draw) return;
    const w = Math.max(260, Math.round(el.clientWidth || (el.parentNode && el.parentNode.clientWidth) || 640));
    lastWidth.set(el, w);
    el.innerHTML = draw(w);
  }
  function mount(el, draw) {
    if (!el) return;
    el.classList.add("chart");
    registry.set(el, draw);
    paint(el);
    if (ro) ro.observe(el);
  }

  function niceStep(span, count) {
    const raw = span / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  }
  function ticks(min, max, count = 5) {
    if (min === max) { min -= 1; max += 1; }
    const step = niceStep(max - min, count), out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function niceDomain(min, max, count = 5) {
    if (min === max) { min -= 1; max += 1; }
    const step = niceStep(max - min, count);
    return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
  }
  const scale = (d0, d1, r0, r1) => v => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
  const tickFmt = v => Math.abs(v) >= 10000 ? (v / 1000).toFixed(0) + "k" : Math.abs(v) >= 100 || Number.isInteger(v) ? String(Math.round(v * 100) / 100) : v.toFixed(Math.abs(v) < 1 ? 2 : 1);
  const tip = s => ` data-tip="${esc(s)}"`;

  function frame(w, h, m, inner, label) {
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || "chart")}">${inner}</svg>`;
  }
  function axes({ w, h, m, x, y, xTicks, yTicks, xLabel, yLabel, xFmt = tickFmt, yFmt = tickFmt, xCat }) {
    let s = "";
    if (yTicks) for (const v of yTicks) {
      const yy = y(v);
      s += `<line class="gridline" x1="${m.l}" x2="${w - m.r}" y1="${yy}" y2="${yy}"/><text class="lbl" x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${esc(yFmt(v))}</text>`;
    }
    s += `<g class="axis"><line x1="${m.l}" x2="${w - m.r}" y1="${h - m.b}" y2="${h - m.b}"/></g>`;
    if (xTicks) for (const v of xTicks) {
      const xx = x(v);
      s += `<text class="lbl" x="${xx}" y="${h - m.b + 17}" text-anchor="middle">${esc(xFmt(v))}</text>`;
    }
    if (xCat) s += xCat;
    if (xLabel) s += `<text class="lbl" x="${m.l + (w - m.l - m.r) / 2}" y="${h - 6}" text-anchor="middle" font-weight="600">${esc(xLabel)}</text>`;
    if (yLabel) s += `<text class="lbl" transform="translate(13 ${m.t + (h - m.t - m.b) / 2}) rotate(-90)" text-anchor="middle" font-weight="600">${esc(yLabel)}</text>`;
    return s;
  }

  /* Histogram — supports stacked series: series:[{values, cls, name}] */
  function histogram(el, o) {
    mount(el, w => {
      const h = o.height || 280, m = { t: 14, r: 16, b: o.xLabel ? 46 : 30, l: 52 };
      const series = o.series || [{ values: o.values, cls: o.cls || "c1", name: o.name || "" }];
      const all = series.flatMap(s => s.values);
      if (!all.length) return `<p class="muted small">No data</p>`;
      let min = o.min ?? Math.min(...all), max = o.max ?? Math.max(...all);
      if (min === max) { min -= 1; max += 1; }
      const nb = o.bins || 24, step = o.binWidth || niceStep(max - min, nb);
      const start = Math.floor(min / step) * step, nBins = Math.max(1, Math.ceil((max - start) / step + 1e-9));
      const counts = series.map(s => { const c = new Array(nBins).fill(0); for (const v of s.values) { let i = Math.floor((v - start) / step); if (i >= nBins) i = nBins - 1; if (i >= 0) c[i]++; } return c; });
      const totals = counts[0].map((_, i) => counts.reduce((a, c) => a + c[i], 0));
      const yMax = Math.max(...totals) || 1;
      const x = scale(start, start + nBins * step, m.l, w - m.r), y = scale(0, yMax * 1.08, h - m.b, m.t);
      const yT = ticks(0, yMax * 1.08, 4).filter(v => v <= yMax * 1.08);
      let bars = "";
      for (let i = 0; i < nBins; i++) {
        let base = 0;
        const x0 = x(start + i * step), bw = Math.max(1, x(start + (i + 1) * step) - x0 - 1);
        series.forEach((s, k) => {
          const c = counts[k][i]; if (!c) return;
          const y0 = y(base + c), y1 = y(base);
          bars += `<rect class="mark f-${s.cls}" x="${x0 + .5}" y="${y0}" width="${bw}" height="${Math.max(0, y1 - y0)}" rx="1.5"${tip(`${s.name ? s.name + "\n" : ""}${tickFmt(start + i * step)} – ${tickFmt(start + (i + 1) * step)}\nn = ${c}`)}/>`;
          base += c;
        });
      }
      let marks = "";
      (o.markers || []).forEach((mk, i) => {
        if (mk.value == null || Number.isNaN(mk.value)) return;
        const xx = x(mk.value);
        marks += `<line x1="${xx}" x2="${xx}" y1="${m.t}" y2="${h - m.b}" class="s-${mk.cls || "c3"}" stroke-width="2" ${mk.dash ? 'stroke-dasharray="5 4"' : ""}/>`;
        const anchor = xx > w - 110 ? "end" : "start", dx = anchor === "end" ? -5 : 5;
        marks += `<text class="lbl-strong" x="${xx + dx}" y="${m.t + 12 + i * 15}" text-anchor="${anchor}">${esc(mk.label)}</text>`;
      });
      (o.bands || []).forEach(b => {
        const x0 = Math.max(m.l, x(b.from)), x1 = Math.min(w - m.r, x(b.to));
        if (x1 > x0) marks = `<rect x="${x0}" y="${m.t}" width="${x1 - x0}" height="${h - m.t - m.b}" class="f-${b.cls || "c3"}" opacity=".09"/>` + marks;
      });
      const xT = ticks(start, start + nBins * step, Math.max(3, Math.floor(w / 90)));
      return frame(w, h, m, axes({ w, h, m, x, y, xTicks: xT.filter(v => v >= start && v <= start + nBins * step), yTicks: yT, xLabel: o.xLabel, yLabel: o.yLabel }) + bars + marks, o.label || o.xLabel);
    });
  }

  /* Box plots: groups:[{label, values, cls}] */
  function boxplot(el, o) {
    mount(el, w => {
      const groups = o.groups.filter(g => g.values.length);
      const h = o.height || 300, m = { t: 16, r: 16, b: 46, l: 56 };
      const all = groups.flatMap(g => g.values);
      if (!all.length) return `<p class="muted small">No data</p>`;
      const [d0, d1] = niceDomain(Math.min(...all), Math.max(...all));
      const y = scale(d0, d1, h - m.b, m.t), band = (w - m.l - m.r) / groups.length, bw = Math.min(70, band * .45);
      let s = "";
      groups.forEach((g, i) => {
        const st = Stats.sorted(g.values), q1 = Stats.quantileSorted(st, .25), md = Stats.quantileSorted(st, .5), q3 = Stats.quantileSorted(st, .75);
        const iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
        let wl = st[0], wh = st[st.length - 1];
        for (const v of st) { if (v >= lo) { wl = v; break; } }
        for (let k = st.length - 1; k >= 0; k--) { if (st[k] <= hi) { wh = st[k]; break; } }
        const cx = m.l + band * i + band / 2, cls = g.cls || `c${(i % 6) + 1}`, mean = Stats.mean(st);
        const outs = st.filter(v => v < lo || v > hi);
        const tipTxt = `${g.label}\nn = ${st.length}\nmedian = ${tickFmt(md)}\nQ1 = ${tickFmt(q1)}, Q3 = ${tickFmt(q3)}\nIQR = ${tickFmt(iqr)}\nmean = ${mean.toFixed(2)}\noutliers = ${outs.length}`;
        s += `<line x1="${cx}" x2="${cx}" y1="${y(wh)}" y2="${y(q3)}" class="s-muted" stroke-width="1.5"/><line x1="${cx}" x2="${cx}" y1="${y(q1)}" y2="${y(wl)}" class="s-muted" stroke-width="1.5"/>`;
        s += `<line x1="${cx - bw / 4}" x2="${cx + bw / 4}" y1="${y(wh)}" y2="${y(wh)}" class="s-muted" stroke-width="1.5"/><line x1="${cx - bw / 4}" x2="${cx + bw / 4}" y1="${y(wl)}" y2="${y(wl)}" class="s-muted" stroke-width="1.5"/>`;
        s += `<rect class="mark f-${cls}" x="${cx - bw / 2}" y="${y(q3)}" width="${bw}" height="${Math.max(1, y(q1) - y(q3))}" rx="4" fill-opacity=".35" stroke-width="1.5" style="stroke:var(--${cls})"${tip(tipTxt)}/>`;
        s += `<line x1="${cx - bw / 2}" x2="${cx + bw / 2}" y1="${y(md)}" y2="${y(md)}" class="s-text" stroke-width="2.5"/>`;
        s += `<path d="M${cx} ${y(mean) - 5}l5 5-5 5-5-5z" class="f-text"${tip(`mean = ${mean.toFixed(2)}`)}/>`;
        const maxPts = 60;
        outs.slice(0, maxPts).forEach((v, k) => { s += `<circle cx="${cx + ((k % 5) - 2) * 2.5}" cy="${y(v)}" r="2.6" class="f-danger" fill-opacity=".7"${tip(`outlier: ${v}`)}/>`; });
        s += `<text class="lbl-strong" x="${cx}" y="${h - m.b + 18}" text-anchor="middle">${esc(g.label)}</text><text class="lbl" x="${cx}" y="${h - m.b + 33}" text-anchor="middle">n=${st.length}</text>`;
      });
      return frame(w, h, m, axes({ w, h, m, x: v => v, y, yTicks: ticks(d0, d1, 5), yLabel: o.yLabel }) + s, o.label || o.yLabel);
    });
  }

  /* Vertical or horizontal bars: data:[{label, value, cls, tip}] */
  function bar(el, o) {
    mount(el, w => {
      const data = o.data, fmtV = o.format || (v => tickFmt(v));
      if (o.horizontal) {
        const rowH = o.rowHeight || 26, labelW = o.labelWidth || Math.min(200, Math.max(90, w * .32));
        const m = { t: 8, r: 56, b: 24, l: labelW }, h = m.t + m.b + rowH * data.length;
        const maxV = o.max ?? (Math.max(...data.map(d => d.value), 0) * 1.05 || 1);
        const x = scale(0, maxV, m.l, w - m.r);
        let s = "";
        ticks(0, maxV, 4).forEach(v => { if (v <= maxV) s += `<line class="gridline" x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${h - m.b}"/><text class="lbl" x="${x(v)}" y="${h - 6}" text-anchor="middle">${esc(fmtV(v))}</text>`; });
        data.forEach((d, i) => {
          const yy = m.t + i * rowH, bw = Math.max(0, x(d.value) - m.l);
          s += `<text class="lbl" x="${m.l - 8}" y="${yy + rowH / 2 + 4}" text-anchor="end">${esc(d.label)}</text>`;
          s += `<rect class="mark f-${d.cls || o.cls || "c1"}" x="${m.l}" y="${yy + 4}" width="${bw}" height="${rowH - 8}" rx="3"${tip(d.tip || `${d.label}: ${fmtV(d.value)}`)}/>`;
          s += `<text class="val" x="${m.l + bw + 5}" y="${yy + rowH / 2 + 4}">${esc(fmtV(d.value))}</text>`;
        });
        return frame(w, h, m, s, o.label);
      }
      const h = o.height || 280, m = { t: 22, r: 12, b: o.xLabel ? 56 : 40, l: 52 };
      const maxV = o.max ?? (Math.max(...data.map(d => d.value), 0) * 1.12 || 1);
      const y = scale(0, maxV, h - m.b, m.t), band = (w - m.l - m.r) / data.length, bw = Math.min(64, band * .68);
      let s = "";
      const rotate = band < 52;
      data.forEach((d, i) => {
        const cx = m.l + band * i + band / 2, y0 = y(d.value);
        s += `<rect class="mark f-${d.cls || o.cls || "c1"}" x="${cx - bw / 2}" y="${y0}" width="${bw}" height="${Math.max(0, h - m.b - y0)}" rx="4"${tip(d.tip || `${d.label}: ${fmtV(d.value)}`)}/>`;
        if (!o.hideValues) s += `<text class="val" x="${cx}" y="${y0 - 5}" text-anchor="middle">${esc(fmtV(d.value))}</text>`;
        s += rotate ? `<text class="lbl" transform="translate(${cx + 4} ${h - m.b + 10}) rotate(40)" text-anchor="start">${esc(d.label)}</text>`
          : `<text class="lbl" x="${cx}" y="${h - m.b + 17}" text-anchor="middle">${esc(d.label)}</text>`;
      });
      return frame(w, h, m, axes({ w, h, m, x: v => v, y, yTicks: ticks(0, maxV, 4).filter(v => v <= maxV), yLabel: o.yLabel, yFmt: fmtV, xLabel: o.xLabel }) + s, o.label || o.yLabel);
    });
  }

  /* Grouped bars: categories:[...], series:[{name, values, cls}] */
  function groupedBar(el, o) {
    mount(el, w => {
      const h = o.height || 280, m = { t: 22, r: 12, b: 40, l: 52 }, fmtV = o.format || tickFmt;
      const maxV = o.max ?? Math.max(...o.series.flatMap(s => s.values)) * 1.12;
      const minV = o.min ?? 0;
      const y = scale(minV, maxV, h - m.b, m.t), band = (w - m.l - m.r) / o.categories.length;
      const bw = Math.min(40, (band * .8) / o.series.length);
      let s = "";
      o.categories.forEach((c, i) => {
        const x0 = m.l + band * i + (band - bw * o.series.length) / 2;
        o.series.forEach((se, k) => {
          const v = se.values[i], y0 = y(v);
          s += `<rect class="mark f-${se.cls}" x="${x0 + k * bw + 1}" y="${y0}" width="${bw - 2}" height="${Math.max(0, h - m.b - y0)}" rx="3"${tip(`${c}\n${se.name}: ${fmtV(v)}`)}/>`;
          if (bw > 26) s += `<text class="val" x="${x0 + k * bw + bw / 2}" y="${y0 - 5}" text-anchor="middle" font-size="10">${esc(fmtV(v))}</text>`;
        });
        s += `<text class="lbl" x="${m.l + band * i + band / 2}" y="${h - m.b + 17}" text-anchor="middle">${esc(c)}</text>`;
      });
      return frame(w, h, m, axes({ w, h, m, x: v => v, y, yTicks: ticks(minV, maxV, 4).filter(v => v <= maxV && v >= minV), yLabel: o.yLabel, yFmt: fmtV }) + s, o.label || o.yLabel);
    });
  }

  /* Scatter with optional least-squares line */
  function scatter(el, o) {
    mount(el, w => {
      const h = o.height || 320, m = { t: 14, r: 16, b: 46, l: 56 };
      const pts = o.points;
      if (!pts.length) return `<p class="muted small">No data</p>`;
      const [x0, x1] = niceDomain(Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x)));
      const [y0, y1] = niceDomain(Math.min(...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)));
      const x = scale(x0, x1, m.l, w - m.r), y = scale(y0, y1, h - m.b, m.t);
      let s = "";
      const r = pts.length > 600 ? 2.4 : 3.2;
      for (const p of pts) s += `<circle class="mark f-${p.cls || o.cls || "c1"}" cx="${x(p.x).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="${r}" fill-opacity="${o.opacity || .5}"${p.tip ? tip(p.tip) : ""}/>`;
      if (o.trend) {
        const lr = Stats.linreg(pts.map(p => p.x), pts.map(p => p.y));
        const ya = lr.intercept + lr.slope * x0, yb = lr.intercept + lr.slope * x1;
        s += `<line x1="${x(x0)}" y1="${y(ya)}" x2="${x(x1)}" y2="${y(yb)}" class="s-c3" stroke-width="2.5"/>`;
      }
      if (o.diagonal) s += `<line x1="${x(Math.max(x0, y0))}" y1="${y(Math.max(x0, y0))}" x2="${x(Math.min(x1, y1))}" y2="${y(Math.min(x1, y1))}" class="s-muted" stroke-dasharray="5 4" stroke-width="1.5"/>`;
      return frame(w, h, m, axes({ w, h, m, x, y, xTicks: ticks(x0, x1, Math.max(3, Math.floor(w / 90))), yTicks: ticks(y0, y1, 5), xLabel: o.xLabel, yLabel: o.yLabel }) + s, o.label || `${o.xLabel} vs ${o.yLabel}`);
    });
  }

  /* Line chart over categorical x (labels). series:[{name, values, cls, dash, width, dots}] */
  function line(el, o) {
    mount(el, w => {
      const h = o.height || 300, m = { t: 16, r: 16, b: 42, l: 56 }, n = o.labels.length;
      const vals = o.series.flatMap(s => s.values).concat(o.band ? [...o.band.lower, ...o.band.upper] : []).filter(v => v != null);
      const [y0, y1] = o.yDomain || niceDomain(Math.min(...vals), Math.max(...vals));
      const x = i => m.l + (n === 1 ? 0 : (i / (n - 1)) * (w - m.l - m.r)), y = scale(y0, y1, h - m.b, m.t);
      let s = "";
      if (o.shade) o.shade.forEach(sh => { s += `<rect x="${x(sh.from)}" y="${m.t}" width="${x(sh.to) - x(sh.from)}" height="${h - m.t - m.b}" class="f-${sh.cls || "c7"}" opacity=".08"/>${sh.label ? `<text class="lbl" x="${x(sh.from) + 4}" y="${m.t + 12}">${esc(sh.label)}</text>` : ""}`; });
      if (o.band) {
        let d = "";
        o.band.lower.forEach((v, i) => { if (v != null) d += `${d ? "L" : "M"}${x(i)} ${y(o.band.upper[i])}`; });
        for (let i = o.band.lower.length - 1; i >= 0; i--) if (o.band.lower[i] != null) d += `L${x(i)} ${y(o.band.lower[i])}`;
        s += `<path d="${d}Z" class="f-${o.band.cls || "c2"}" opacity=".16"/>`;
      }
      for (const se of o.series) {
        let d = "", pen = false;
        se.values.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; pen = true; });
        s += `<path d="${d}" fill="none" class="s-${se.cls}" stroke-width="${se.width || 2.2}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ""} stroke-linejoin="round"/>`;
        if (se.dots) se.values.forEach((v, i) => { if (v != null) s += `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" class="mark f-${se.cls}"${tip(`${o.labels[i]}\n${se.name}: ${tickFmt(v)}`)}/>`; });
      }
      // invisible hover columns for tooltips
      const colW = (w - m.l - m.r) / Math.max(1, n - 1);
      for (let i = 0; i < n; i++) {
        const lines = o.series.filter(se => se.values[i] != null).map(se => `${se.name}: ${tickFmt(se.values[i])}`);
        if (o.band && o.band.lower[i] != null) lines.push(`${o.band.name || "interval"}: ${tickFmt(o.band.lower[i])} – ${tickFmt(o.band.upper[i])}`);
        if (lines.length) s += `<rect x="${x(i) - colW / 2}" y="${m.t}" width="${colW}" height="${h - m.t - m.b}" fill="transparent"${tip(`${o.labels[i]}\n${lines.join("\n")}`)}/>`;
      }
      const every = Math.max(1, Math.ceil(n / Math.max(3, Math.floor((w - m.l - m.r) / 70))));
      let xl = "";
      o.labels.forEach((lb, i) => { if (i % every === 0) xl += `<text class="lbl" x="${x(i)}" y="${h - m.b + 17}" text-anchor="middle">${esc(lb)}</text>`; });
      if (o.vline != null) s += `<line x1="${x(o.vline)}" x2="${x(o.vline)}" y1="${m.t}" y2="${h - m.b}" class="s-muted" stroke-dasharray="4 4"/>`;
      return frame(w, h, m, axes({ w, h, m, x, y, yTicks: ticks(y0, y1, 5), yLabel: o.yLabel, xCat: xl, xLabel: o.xLabel }) + s, o.label || o.yLabel);
    });
  }

  /* Heatmap (correlation / confusion). cell value colours via fill-opacity. */
  function heatmap(el, o) {
    mount(el, w => {
      const n = o.yLabels.length, k = o.xLabels.length;
      const labelW = o.labelWidth || Math.min(150, Math.max(70, w * .24));
      const cell = Math.max(18, Math.min(o.maxCell || 64, (w - labelW - 10) / k));
      const top = o.rotateX === false ? 26 : Math.min(130, 8 + Math.max(...o.xLabels.map(s => s.length)) * 6.2);
      const h = top + n * cell + 8, width = labelW + k * cell + 10;
      let s = "";
      o.yLabels.forEach((lb, i) => { s += `<text class="lbl" x="${labelW - 6}" y="${top + i * cell + cell / 2 + 4}" text-anchor="end">${esc(lb)}</text>`; });
      o.xLabels.forEach((lb, j) => {
        const cx = labelW + j * cell + cell / 2;
        s += o.rotateX === false ? `<text class="lbl" x="${cx}" y="${top - 8}" text-anchor="middle">${esc(lb)}</text>`
          : `<text class="lbl" transform="translate(${cx + 4} ${top - 6}) rotate(-50)" text-anchor="start">${esc(lb)}</text>`;
      });
      for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) {
        const v = o.matrix[i][j];
        const inten = o.intensity ? o.intensity(v, i, j) : Math.abs(v);
        const cls = o.colorFor ? o.colorFor(v, i, j) : (v >= 0 ? "c1" : "c4");
        const x0 = labelW + j * cell, y0 = top + i * cell;
        const sel = o.selected && o.selected[0] === i && o.selected[1] === j;
        const label = o.cellLabel ? o.cellLabel(v, i, j) : `${o.yLabels[i]} × ${o.xLabels[j]}: ${o.format ? o.format(v) : v}`;
        s += `<g ${o.clickable ? `class="hm-cell" role="button" tabindex="0" data-i="${i}" data-j="${j}" aria-label="${esc(label)}" style="cursor:pointer"` : ""}>`;
        s += `<rect x="${x0 + 1}" y="${y0 + 1}" width="${cell - 2}" height="${cell - 2}" rx="4" class="f-${cls}" fill-opacity="${Math.max(.06, Math.min(1, inten)).toFixed(3)}"${tip(label)}/>`;
        if (sel) s += `<rect x="${x0 + 1}" y="${y0 + 1}" width="${cell - 2}" height="${cell - 2}" rx="4" fill="none" class="s-text" stroke-width="2.5"/>`;
        if (cell >= 30) s += `<text x="${x0 + cell / 2}" y="${y0 + cell / 2 + 4}" text-anchor="middle" class="${inten > .55 ? "val-inv" : "val"}" pointer-events="none" font-size="${cell > 44 ? 12 : 10}">${esc(o.format ? o.format(v) : v)}</text>`;
        s += `</g>`;
      }
      return `<svg width="${Math.min(w, width)}" height="${h}" viewBox="0 0 ${width} ${h}" role="img" aria-label="${esc(o.label || "heatmap")}">${s}</svg>`;
    });
    if (o.clickable && o.onClick && !el.dataset.hmBound) {
      el.dataset.hmBound = "1";
      const act = e => { const g = e.target.closest(".hm-cell"); if (g) o.onClick(+g.dataset.i, +g.dataset.j); };
      el.addEventListener("click", act);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(e); } });
    }
  }

  /* Interval plot (confidence intervals). items:[{label, lo, mid, hi, cls}] */
  function intervals(el, o) {
    mount(el, w => {
      const rowH = o.rowHeight || 22, labelW = o.labelWidth ?? Math.min(150, w * .26);
      const m = { t: 10, r: 20, b: 40, l: labelW };
      const h = m.t + m.b + rowH * o.items.length;
      const vals = o.items.flatMap(i => [i.lo, i.hi]).concat(o.ref != null ? [o.ref] : []);
      const [d0, d1] = o.domain || niceDomain(Math.min(...vals), Math.max(...vals));
      const x = scale(d0, d1, m.l, w - m.r);
      let s = "";
      ticks(d0, d1, 5).forEach(v => { s += `<line class="gridline" x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${h - m.b}"/><text class="lbl" x="${x(v)}" y="${h - m.b + 16}" text-anchor="middle">${tickFmt(v)}</text>`; });
      if (o.ref != null) s += `<line x1="${x(o.ref)}" x2="${x(o.ref)}" y1="${m.t - 4}" y2="${h - m.b}" class="s-c3" stroke-width="2" stroke-dasharray="5 4"/>`;
      o.items.forEach((it, i) => {
        const yy = m.t + i * rowH + rowH / 2, cls = it.cls || "c1";
        if (labelW > 0) s += `<text class="lbl" x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${esc(it.label)}</text>`;
        s += `<line x1="${x(it.lo)}" x2="${x(it.hi)}" y1="${yy}" y2="${yy}" class="s-${cls}" stroke-width="${rowH > 14 ? 3 : 2}" stroke-linecap="round"${tip(it.tip || `${it.label}: ${tickFmt(it.lo)} – ${tickFmt(it.hi)}`)}/>`;
        s += `<circle cx="${x(it.mid)}" cy="${yy}" r="${rowH > 14 ? 4.5 : 2.6}" class="f-${cls}"/>`;
      });
      if (o.xLabel) s += `<text class="lbl" x="${m.l + (w - m.l - m.r) / 2}" y="${h - 6}" text-anchor="middle" font-weight="600">${esc(o.xLabel)}</text>`;
      return frame(w, h, m, s, o.label || o.xLabel);
    });
  }

  /* Student t density with shaded rejection regions and the observed statistic */
  function tdist(el, o) {
    mount(el, w => {
      const h = o.height || 240, m = { t: 16, r: 16, b: 34, l: 16 };
      const lim = Math.max(4.5, Math.min(12, Math.abs(o.t) + 1));
      const x = scale(-lim, lim, m.l, w - m.r), pk = Stats.tpdf(0, o.df), y = scale(0, pk * 1.12, h - m.b, m.t);
      const steps = 220, pts = [];
      for (let i = 0; i <= steps; i++) { const tv = -lim + (2 * lim * i) / steps; pts.push([tv, Stats.tpdf(tv, o.df)]); }
      const area = (from, to) => {
        const seg = pts.filter(p => p[0] >= from && p[0] <= to);
        if (!seg.length) return "";
        return `M${x(seg[0][0])} ${y(0)}` + seg.map(p => `L${x(p[0])} ${y(p[1])}`).join("") + `L${x(seg[seg.length - 1][0])} ${y(0)}Z`;
      };
      const tc = o.tcrit;
      let s = `<path d="${area(-lim, -tc)}" class="f-danger" opacity=".35"/><path d="${area(tc, lim)}" class="f-danger" opacity=".35"/>`;
      const at = Math.abs(o.t);
      s += `<path d="${area(-lim, -at)}" class="f-c1" opacity=".35"/><path d="${area(at, lim)}" class="f-c1" opacity=".35"/>`;
      s += `<path d="${pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join("")}" fill="none" class="s-text" stroke-width="2"/>`;
      s += `<line x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}" class="s-muted"/>`;
      ticks(-lim, lim, 8).forEach(v => { s += `<text class="lbl" x="${x(v)}" y="${h - m.b + 16}" text-anchor="middle">${tickFmt(v)}</text>`; });
      [-tc, tc].forEach(v => { s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t + 10}" y2="${y(0)}" class="s-danger" stroke-dasharray="4 3"/>`; });
      s += `<line x1="${x(o.t)}" x2="${x(o.t)}" y1="${m.t}" y2="${y(0)}" class="s-c3" stroke-width="3"/><text class="lbl-strong" x="${x(o.t) + (o.t > lim - 2 ? -6 : 6)}" y="${m.t + 12}" text-anchor="${o.t > lim - 2 ? "end" : "start"}">t = ${o.t.toFixed(2)}</text>`;
      return frame(w, h, m, s, o.label || "t distribution");
    });
  }

  /* Tooltip (mouse) */
  function initTooltip() {
    if (document.querySelector(".chart-tip")) return;
    const tipEl = document.createElement("div");
    tipEl.className = "chart-tip"; tipEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(tipEl);
    document.addEventListener("mousemove", e => {
      const t0 = e.target.closest && e.target.closest("[data-tip]");
      if (!t0 || !t0.closest(".chart")) { tipEl.classList.remove("show"); return; }
      tipEl.textContent = t0.getAttribute("data-tip");
      tipEl.classList.add("show");
      const pad = 14, r = tipEl.getBoundingClientRect();
      let left = e.clientX + pad, top = e.clientY + pad;
      if (left + r.width > window.innerWidth - 8) left = e.clientX - r.width - pad;
      if (top + r.height > window.innerHeight - 8) top = e.clientY - r.height - pad;
      tipEl.style.left = `${left}px`; tipEl.style.top = `${top}px`;
    });
    document.addEventListener("scroll", () => tipEl.classList.remove("show"), { passive: true });
  }

  function legend(items) {
    return `<div class="chart-legend">${items.map(i => `<span><i class="${i.line ? "line" : ""}" style="background:var(--${i.cls})"></i>${esc(i.label)}</span>`).join("")}</div>`;
  }

  return { mount, histogram, boxplot, bar, groupedBar, scatter, line, heatmap, intervals, tdist, initTooltip, legend, ticks, tickFmt };
})();

/* ---------------------------------------------------------------------
   10. Code blocks: syntax highlight + Copy + Download
   --------------------------------------------------------------------- */
const Code = (() => {
  const store = new Map();
  let counter = 0;
  const PY_KW = new Set("False None True and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield print".split(" "));
  const SQL_KW = new Set("select from where group by order having join left right inner outer on as and or not null is in case when then else end with over partition count avg sum min max distinct limit offset union all between like glob escape cast round lag lead rank row_number ntile percent_rank asc desc rows preceding current row create table insert into values sqrt strftime substr date length upper lower trim cross integer real text".split(" "));

  function highlight(src, lang) {
    const re = lang === "sql"
      ? /(--[^\n]*)|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g
      : /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|[rfbu]{0,2}"(?:[^"\\\n]|\\.)*"|[rfbu]{0,2}'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?(?:e[-+]?\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()?/g;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      const [tok, com, str, num, word] = m;
      if (com) out += `<span class="tok-com">${esc(tok)}</span>`;
      else if (str) out += `<span class="tok-str">${esc(tok)}</span>`;
      else if (num) out += `<span class="tok-num">${esc(tok)}</span>`;
      else if (word) {
        const kw = lang === "sql" ? SQL_KW.has(word.toLowerCase()) : PY_KW.has(word);
        if (kw) out += `<span class="tok-kw">${esc(tok)}</span>`;
        else if (lang !== "sql" && src[m.index + tok.length] === "(") out += `<span class="tok-fn">${esc(tok)}</span>`;
        else out += esc(tok);
      }
      last = m.index + tok.length;
    }
    return out + esc(src.slice(last));
  }

  function block({ code, lang = "python", filename, title, result }) {
    const id = `code-${++counter}`;
    const fname = filename || (lang === "sql" ? "example.sql" : lang === "bash" ? "commands.txt" : "example.py");
    store.set(id, { code: code.replace(/^\n+|\s+$/g, ""), filename: fname });
    const label = title || fname;
    return `<div class="code-block" data-code-id="${id}">
      <div class="code-head"><span class="lang">${esc(lang)}</span><span class="file">${esc(label)}</span><span class="spacer"></span>
        <button type="button" data-code-action="copy" aria-label="${esc(t("code.copy"))} ${esc(fname)}">${ICON.copy}<span>${esc(t("code.copy"))}</span></button>
      </div>
      <pre tabindex="0"><code>${lang === "bash" ? esc(store.get(id).code) : highlight(store.get(id).code, lang)}</code></pre>
      ${result ? `<div class="code-result"><div class="code-result-k">${L("Result on our data", "النتيجة على بياناتنا")}</div>${result}</div>` : ""}</div>`;
  }

  document.addEventListener("click", async e => {
    const btn = e.target.closest("[data-code-action]");
    if (!btn) return;
    const host = btn.closest("[data-code-id]");
    const item = host && store.get(host.dataset.codeId);
    if (!item) return;
    if (btn.dataset.codeAction === "copy") {
      const ok = await copyText(item.code);
      toast(ok ? t("code.copied") : t("copy.failed"));
    } else {
      downloadText(item.filename, item.code + "\n", item.filename.endsWith(".sql") ? "application/sql" : "text/x-python");
      toast(t("code.downloaded"));
    }
  });
  return { block, highlight };
})();

/* ---------------------------------------------------------------------
   11. Data Explorer — search, sort, filter, pagination, column chooser,
       missing-value indicators, CSV export of the filtered view.
   --------------------------------------------------------------------- */
const Explorer = (() => {
  const MISSING = new Set(["", "na", "n/a", "nan", "null", "none", "?", "-", "missing", "not recorded", "unknown"]);
  const NUMERIC = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose", "hba1c", "total_cholesterol",
    "exercise_days_per_week", "medication_adherence_pct", "visits_last_year", "risk_score", "follow_up_days"];

  function isMissing(v, messy) { return messy ? MISSING.has(String(v ?? "").trim().toLowerCase()) : v === null || v === undefined; }
  function isSuspect(col, v) {
    const s = String(v).trim();
    const ranges = (Data.site && Data.site.validRanges) || {};
    if (col === "visit_date") return !/^\d{4}-\d{2}-\d{2}$/.test(s);
    if (col === "sex") return !["Male", "Female"].includes(s) || s !== String(v);
    if (col === "smoking_status") return !["Smoker", "Non-Smoker"].includes(String(v));
    if (col === "family_history_flag") return !["0", "1"].includes(String(v));
    if (col === "risk_group") return !["Low", "Moderate", "High"].includes(String(v));
    if (col === "clinic_id") return !/^CL\d{2}$/.test(String(v));
    if (col === "patient_id") return s !== String(v);
    if (NUMERIC.includes(col)) {
      if (!/^-?\d+(\.\d+)?$/.test(String(v))) return true;
      const r = ranges[col];
      return r ? (+v < r[0] || +v > r[1]) : false;
    }
    return false;
  }

  function mount(el, opts = {}) {
    const st = {
      dataset: opts.dataset || "messy", q: "", fcol: "", fop: "contains", fval: "",
      sort: null, dir: 1, page: 1, size: 25, hidden: new Set(opts.hidden || []), issuesOnly: false,
    };
    const rowsFor = () => (st.dataset === "messy" ? Data.messy() : Data.clean());
    const colsFor = () => (st.dataset === "messy" ? Data.site.messy.columns : Data.site.clean.columns);

    function filtered() {
      const messy = st.dataset === "messy", cols = colsFor();
      let rows = rowsFor();
      const q = st.q.trim().toLowerCase();
      if (q) rows = rows.filter(r => cols.some(c => r[c] != null && String(r[c]).toLowerCase().includes(q)));
      if (st.fcol) {
        const c = st.fcol, v = st.fval.trim().toLowerCase(), nv = parseFloat(st.fval);
        rows = rows.filter(r => {
          const val = r[c], miss = isMissing(val, messy);
          switch (st.fop) {
            case "missing": return miss;
            case "notmissing": return !miss;
            case "equals": return !miss && String(val).trim().toLowerCase() === v;
            case "gt": return !miss && !Number.isNaN(parseFloat(val)) && parseFloat(val) > nv;
            case "lt": return !miss && !Number.isNaN(parseFloat(val)) && parseFloat(val) < nv;
            default: return v === "" || (!miss && String(val).toLowerCase().includes(v));
          }
        });
      }
      if (st.issuesOnly && messy) rows = rows.filter(r => cols.some(c => isMissing(r[c], true) || isSuspect(c, r[c])));
      if (st.sort) {
        const c = st.sort, dir = st.dir;
        rows = rows.slice().sort((a, b) => {
          const ma = isMissing(a[c], messy), mb = isMissing(b[c], messy);
          if (ma && mb) return 0; if (ma) return 1; if (mb) return -1;
          const na = parseFloat(a[c]), nb = parseFloat(b[c]);
          const an = !Number.isNaN(na) && /^\s*-?\d/.test(String(a[c])), bn = !Number.isNaN(nb) && /^\s*-?\d/.test(String(b[c]));
          if (an && bn) return (na - nb) * dir;
          if (an !== bn) return an ? -1 : 1;           // numbers before text, in both directions
          return String(a[c]).localeCompare(String(b[c])) * dir;
        });
      }
      return rows;
    }

    function render() {
      const messy = st.dataset === "messy", cols = colsFor(), visible = cols.filter(c => !st.hidden.has(c));
      const rows = filtered(), total = rowsFor().length, pages = Math.max(1, Math.ceil(rows.length / st.size));
      st.page = Math.min(st.page, pages);
      const pageRows = rows.slice((st.page - 1) * st.size, st.page * st.size);
      let missingCount = 0;
      for (const r of rows) for (const c of visible) if (isMissing(r[c], messy)) missingCount++;
      const opsList = [["contains", "ex.contains"], ["equals", "ex.equals"], ["gt", "ex.gt"], ["lt", "ex.lt"], ["missing", "ex.isMissing"], ["notmissing", "ex.notMissing"]];
      const uid = el.id || "ex";
      el.innerHTML = `
      <div class="explorer">
        <div class="explorer-bar">
          <div class="field"><span class="field-label" id="${uid}-dsl">${t("ex.dataset")}</span>
            <div class="segmented" role="group" aria-labelledby="${uid}-dsl">
              <button type="button" data-ds="messy" aria-pressed="${messy}">${t("ex.messy")}</button>
              <button type="button" data-ds="clean" aria-pressed="${!messy}">${t("ex.clean")}</button>
            </div></div>
          <div class="field search"><label for="${uid}-q">${t("ex.search")}</label><input type="search" id="${uid}-q" value="${esc(st.q)}" placeholder="PT100042, mg/dL, Smoker…"></div>
          <div class="field"><label for="${uid}-fc">${t("ex.filterCol")}</label><select id="${uid}-fc"><option value="">${t("ex.none")}</option>${cols.map(c => `<option value="${c}" ${st.fcol === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label for="${uid}-fo">${t("ex.op")}</label><select id="${uid}-fo" ${st.fcol ? "" : "disabled"}>${opsList.map(([v, k]) => `<option value="${v}" ${st.fop === v ? "selected" : ""}>${t(k)}</option>`).join("")}</select></div>
          <div class="field"><label for="${uid}-fv">${t("ex.value")}</label><input type="text" id="${uid}-fv" value="${esc(st.fval)}" size="10" ${st.fcol && !["missing", "notmissing"].includes(st.fop) ? "" : "disabled"}></div>
          <details class="colpicker"><summary class="btn btn-sm">${ICON.list}<span>${t("ex.columns")} (${visible.length}/${cols.length})</span></summary>
            <div class="colpicker-panel">${cols.map(c => `<label><input type="checkbox" data-col="${c}" ${st.hidden.has(c) ? "" : "checked"}> ${c}</label>`).join("")}</div></details>
          <button type="button" class="btn btn-sm" data-act="reset">${t("ex.reset")}</button>
        </div>
        <div class="explorer-meta" aria-live="polite">
          <strong>${t("ex.showing")} ${fmtInt(rows.length)} ${t("ex.of")} ${fmtInt(total)} ${t("ex.rows")}</strong>
          <span><span class="cell-missing">∅</span> ${t("ex.legendMissing")}: ${fmtInt(missingCount)}</span>
          ${messy ? `<span><span class="cell-suspect">!</span> ${t("ex.legendSuspect")}</span>
          <label class="row" style="gap:6px"><input type="checkbox" data-act="issues" ${st.issuesOnly ? "checked" : ""}> ${L("Only rows with issues", "الصفوف التي بها مشكلات فقط")}</label>` : ""}
          <span class="spacer"></span><span class="faint">${t("ex.sortHint")}</span>
        </div>
        <div class="table-wrap"><table class="data"><caption class="sr-only">${messy ? t("ex.messy") : t("ex.clean")}</caption>
          <thead><tr><th class="num">#</th>${visible.map(c => `<th scope="col" aria-sort="${st.sort === c ? (st.dir > 0 ? "ascending" : "descending") : "none"}"><button type="button" data-sort="${c}">${c}<span aria-hidden="true">${st.sort === c ? (st.dir > 0 ? "▲" : "▼") : ""}</span></button></th>`).join("")}</tr></thead>
          <tbody>${pageRows.length ? pageRows.map((r, i) => `<tr><td class="num faint">${(st.page - 1) * st.size + i + 1}</td>${visible.map(c => {
            const v = r[c];
            if (isMissing(v, messy)) return `<td><span class="cell-missing" title="${t("ex.missing")}">∅ ${v ? esc(String(v)) : t("ex.missing")}</span></td>`;
            if (messy && isSuspect(c, v)) return `<td><span class="cell-suspect" title="${t("ex.suspect")}">${esc(String(v).replace(/ /g, "␠"))}</span></td>`;
            return `<td>${esc(v)}</td>`;
          }).join("")}</tr>`).join("") : `<tr><td colspan="${visible.length + 1}" class="muted">${t("ex.noRows")}</td></tr>`}</tbody>
        </table></div>
        <div class="row">
          <div class="pager">
            <button type="button" class="btn btn-sm" data-page="prev" aria-label="${t("ex.prev")}" ${st.page <= 1 ? "disabled" : ""}>${ICON.arrowL}</button>
            <span class="small">${t("ex.page")} <strong>${st.page}</strong> / ${pages}</span>
            <button type="button" class="btn btn-sm" data-page="next" aria-label="${t("ex.next")}" ${st.page >= pages ? "disabled" : ""}>${ICON.arrowR}</button>
          </div>
          <div class="field" style="flex-direction:row;align-items:center;gap:8px"><label for="${uid}-ps">${t("ex.perPage")}</label>
            <select id="${uid}-ps">${[10, 25, 50, 100].map(n => `<option ${n === st.size ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        </div>
      </div>`;
    }

    function rerender(focusSel) {
      const active = document.activeElement && el.contains(document.activeElement) ? document.activeElement.id : null;
      const caret = active && document.activeElement.selectionStart;
      render();
      const target = focusSel ? el.querySelector(focusSel) : active ? document.getElementById(active) : null;
      if (target) { target.focus(); if (caret != null && target.setSelectionRange) try { target.setSelectionRange(caret, caret); } catch (e) { /* noop */ } }
    }

    const uid = () => el.id || "ex";
    const onSearch = debounce(v => { st.q = v; st.page = 1; rerender(); }, 180);
    const onFilterValue = debounce(v => { st.fval = v; st.page = 1; rerender(); }, 200);
    el.addEventListener("input", e => {
      if (e.target.id === `${uid()}-q`) onSearch(e.target.value);
      else if (e.target.id === `${uid()}-fv`) onFilterValue(e.target.value);
    });
    el.addEventListener("change", e => {
      const id = e.target.id;
      if (id === `${uid()}-fc`) { st.fcol = e.target.value; st.page = 1; rerender(`#${uid()}-fc`); }
      else if (id === `${uid()}-fo`) { st.fop = e.target.value; st.page = 1; rerender(`#${uid()}-fo`); }
      else if (id === `${uid()}-ps`) { st.size = +e.target.value; st.page = 1; rerender(`#${uid()}-ps`); }
      else if (e.target.dataset.col) {
        if (e.target.checked) st.hidden.delete(e.target.dataset.col); else st.hidden.add(e.target.dataset.col);
        rerender(); const d = el.querySelector(".colpicker"); if (d) d.open = true;
      } else if (e.target.dataset.act === "issues") { st.issuesOnly = e.target.checked; st.page = 1; rerender(); }
    });
    el.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.ds) { st.dataset = b.dataset.ds; st.sort = null; st.page = 1; st.fcol = ""; st.issuesOnly = false; rerender(`[data-ds="${b.dataset.ds}"]`); }
      else if (b.dataset.sort) { if (st.sort === b.dataset.sort) { if (st.dir === 1) st.dir = -1; else { st.sort = null; st.dir = 1; } } else { st.sort = b.dataset.sort; st.dir = 1; } rerender(`[data-sort="${b.dataset.sort}"]`); }
      else if (b.dataset.page) { st.page += b.dataset.page === "next" ? 1 : -1; rerender(`[data-page="${b.dataset.page}"]`); }
      else if (b.dataset.act === "reset") { Object.assign(st, { q: "", fcol: "", fop: "contains", fval: "", sort: null, dir: 1, page: 1, issuesOnly: false }); st.hidden = new Set(); rerender(); }
    });
    document.addEventListener("click", e => { const d = el.querySelector(".colpicker[open]"); if (d && !d.contains(e.target)) d.open = false; });
    App.on("lang", () => { if (document.body.contains(el)) render(); });
    render();
    return { render, state: st };
  }
  return { mount, isMissing, isSuspect };
})();

/* ---------------------------------------------------------------------
   12. Page shell: header, drawer, footer
   --------------------------------------------------------------------- */
const Shell = (() => {
  let page = "home";
  const links = () => [
    { key: "lecture1", href: "lecture-1.html", label: t("nav.l1") },
    { key: "lecture2", href: "lecture-2.html", label: t("nav.l2") },
  ];
  let current = "home";
  let drawerExtra = null;
  let lastFocus = null;

  function langSwitch() {
    return `<div class="lang-switch" role="group" aria-label="${t("lang.label")}">
      <button type="button" data-lang-btn="en" lang="en" aria-pressed="${App.lang === "en"}">EN</button><span class="sep" aria-hidden="true"></span>
      <button type="button" data-lang-btn="ar" lang="ar" aria-pressed="${App.lang === "ar"}">العربية</button></div>`;
  }
  function themeBtn(extraCls = "") {
    const toLight = App.theme === "dark";
    return `<button type="button" class="icon-btn theme-btn ${extraCls}" data-theme-toggle aria-label="${toLight ? t("theme.toLight") : t("theme.toDark")}" title="${toLight ? t("theme.toLight") : t("theme.toDark")}">${toLight ? ICON.sun : ICON.moon}</button>`;
  }

  function renderHeader() {
    const h = document.getElementById("site-header");
    if (!h) return;
    h.className = "site-header";
    h.innerHTML = `<div class="header-inner">
      <a class="brand" href="index.html" aria-label="${esc(LT(BRAND.courseTitle))} — ${esc(BRAND.createdBy)} — ${t("nav.home")}">
        <img data-logo src="${BRAND.logos[App.theme]}" alt="" width="36" height="44">
        <span class="brand-text"><strong>${esc(BRAND.createdBy)}</strong><span>${esc(LT(BRAND.courseTitle))}</span></span>
      </a>
      <nav class="main-nav" aria-label="${t("nav.main")}">${links().map(l => `<a href="${l.href}" ${l.key === current ? 'aria-current="page"' : ""}>${l.label}</a>`).join("")}</nav>
      <div class="header-tools">${langSwitch()}${themeBtn()}
        <button type="button" class="icon-btn menu-btn" data-drawer-open aria-label="${t("nav.menu")}" aria-controls="site-drawer" aria-expanded="false">${ICON.menu}</button>
      </div></div>`;
  }

  function renderDrawer() {
    let dr = document.getElementById("site-drawer");
    if (!dr) {
      dr = document.createElement("div"); dr.id = "site-drawer"; document.body.appendChild(dr);
      const bd = document.createElement("div"); bd.className = "drawer-backdrop"; bd.dataset.drawerClose = ""; document.body.appendChild(bd);
    }
    const wasOpen = dr.classList.contains("open");
    dr.className = `drawer${wasOpen ? " open" : ""}`;
    dr.setAttribute("role", "dialog"); dr.setAttribute("aria-modal", "true"); dr.setAttribute("aria-label", t("nav.main"));
    dr.innerHTML = `<div class="drawer-head"><span class="brand"><img data-logo src="${BRAND.logos[App.theme]}" alt="" style="height:38px;width:auto"><span class="brand-text"><strong>${esc(BRAND.createdBy)}</strong><span>${esc(LT(BRAND.courseTitle))}</span></span></span>
        <button type="button" class="icon-btn" data-drawer-close aria-label="${t("nav.close")}">${ICON.close}</button></div>
      <div class="drawer-body"><nav aria-label="${t("nav.main")}">${links().map(l => `<a href="${l.href}" ${l.key === current ? 'aria-current="page"' : ""}>${l.label}</a>`).join("")}</nav>
        ${drawerExtra ? drawerExtra() : ""}</div>
      <div class="drawer-tools"><span class="small muted">${t("lang.label")}</span>${langSwitch()}<span class="spacer"></span>${themeBtn("drawer-theme")}</div>`;
  }

  function openDrawer(focusSel) {
    const dr = document.getElementById("site-drawer"), bd = $(".drawer-backdrop");
    if (!dr) return;
    lastFocus = document.activeElement;
    dr.classList.add("open"); bd.classList.add("open");
    $$("[data-drawer-open]").forEach(b => b.setAttribute("aria-expanded", "true"));
    document.body.style.overflow = "hidden";
    setTimeout(() => { const target = (focusSel && dr.querySelector(focusSel)) || dr.querySelector("[data-drawer-close]"); if (target) { target.focus(); if (focusSel) target.scrollIntoView({ block: "center" }); } }, 60);
  }
  function closeDrawer() {
    const dr = document.getElementById("site-drawer"), bd = $(".drawer-backdrop");
    if (!dr || !dr.classList.contains("open")) return;
    dr.classList.remove("open"); bd.classList.remove("open");
    $$("[data-drawer-open]").forEach(b => b.setAttribute("aria-expanded", "false"));
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderFooter() {
    const f = document.getElementById("site-footer");
    if (!f) return;
    f.className = "site-footer";
    f.innerHTML = `<div class="container"><div class="footer-grid footer-simple">
        <div><img data-logo src="${BRAND.logos[App.theme]}" alt="${esc(BRAND.department)}" style="height:64px;width:auto;margin-bottom:10px">
          <p>${t("footer.about")}</p></div>
        <div><h4>${t("footer.learn")}</h4><ul>
          <li><a href="lecture-1.html">${t("nav.l1")} — ${L("From messy data to insight", "من البيانات غير المنظمة إلى الرؤية")}</a></li>
          <li><a href="lecture-2.html">${t("nav.l2")} — ${L("From insight to BI, automation & AI", "من الرؤية إلى ذكاء الأعمال والأتمتة والذكاء الاصطناعي")}</a></li>
          <li><a href="index.html#data">${L("Download the data", "تنزيل البيانات")}</a></li>
          <li><a href="agent-report.html">${L("Data Agent — official report", "وكيل البيانات — التقرير الرسمي")}</a></li></ul></div>
      </div>
      <div class="footer-bottom"><span>© ${BRAND.year} ${esc(BRAND.createdBy)} · ${esc(BRAND.department)}</span><span>${L("Created by", "من إعداد")} <strong>${esc(BRAND.createdBy)}</strong> · ${t("footer.built")}</span></div></div>`;
  }

  function renderAll() { renderHeader(); renderDrawer(); renderFooter(); }

  function init(opts = {}) {
    page = opts.page || "home";
    current = opts.current || page;
    drawerExtra = opts.drawerExtra || null;
    if (opts.skipTarget !== false && !$(".skip-link")) {
      const a = document.createElement("a"); a.className = "skip-link"; a.href = "#main"; a.textContent = t("skip");
      document.body.prepend(a);
    }
    renderAll();
    Charts.initTooltip();

    document.addEventListener("click", e => {
      const lb = e.target.closest("[data-lang-btn]");
      if (lb) { applyLang(lb.dataset.langBtn); return; }
      if (e.target.closest("[data-theme-toggle]")) { const wasDrawer = !!e.target.closest(".drawer"); applyTheme(App.theme === "dark" ? "light" : "dark"); if (wasDrawer) { const b = $(".drawer [data-theme-toggle]"); if (b) b.focus(); } return; }
      if (e.target.closest("[data-drawer-open]")) { openDrawer(e.target.closest("[data-drawer-open]").dataset.drawerFocus); return; }
      if (e.target.closest("[data-drawer-close]")) { closeDrawer(); return; }
      const a = e.target.closest(".drawer a[href]");
      if (a) closeDrawer();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab") { // focus trap inside the open drawer
        const dr = document.getElementById("site-drawer");
        if (dr && dr.classList.contains("open")) {
          const f = $$("a[href], button:not([disabled]), input, select", dr).filter(x => x.offsetParent !== null);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      }
    });
    App.on("lang", () => {
      const skip = $(".skip-link"); if (skip) skip.textContent = t("skip");
      const focusedLang = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.langBtn;
      const inDrawer = document.activeElement && document.activeElement.closest && document.activeElement.closest(".drawer");
      renderAll();
      if (focusedLang) { const b = $(`${inDrawer ? ".drawer " : ".site-header "}[data-lang-btn="${focusedLang}"]`); if (b) b.focus(); }
    });
    App.on("theme", () => {
      $$("[data-theme-toggle]").forEach(b => {
        const toLight = App.theme === "dark";
        b.innerHTML = toLight ? ICON.sun : ICON.moon;
        b.setAttribute("aria-label", toLight ? t("theme.toLight") : t("theme.toDark"));
        b.title = b.getAttribute("aria-label");
      });
    });
  }
  return { init, renderAll, renderDrawer, openDrawer, closeDrawer, setCurrent(k) { current = k; renderHeader(); renderDrawer(); } };
})();

/* ---------------------------------------------------------------------
   13. Dataset downloads — the CSV files behind both lectures
   --------------------------------------------------------------------- */
const DATASET_INFO = {
  "messy_patient_screening_data.csv": { en: "Raw screening file exactly as received — with missing values, duplicates and inconsistent formats.", ar: "ملف الفحص الخام كما وصل تمامًا — بقيم مفقودة وتكرارات وتنسيقات غير متسقة." },
  "clean_patient_screening_data.csv": { en: "The same records after cleaning — the table used for all analyses.", ar: "السجلات نفسها بعد التنظيف — الجدول المستخدم في كل التحليلات." },
  "outliers_patient_data.csv": { en: "Unusual (but possible) values flagged for review.", ar: "قيم غير معتادة (لكنها ممكنة) وُسمت للمراجعة." },
  "monthly_clinic_activity.csv": { en: "Monthly totals of screening visits, follow-ups and lab requests (2019–2024), used for forecasting.", ar: "المجاميع الشهرية لزيارات الفحص والمتابعات وطلبات المختبر (2019–2024)، تُستخدم للتوقع." },
  "data_dictionary.csv": { en: "What every column means: type, valid range, unit and cleaning rule.", ar: "معنى كل عمود: النوع والنطاق الصالح والوحدة وقاعدة التنظيف." },
};
function datasetDownloads(opts = {}) {
  const files = (window.SITE_DATA && window.SITE_DATA.datasets) || [];
  if (!files.length) return "";
  return `<div class="card dataset-downloads">
    ${opts.title === false ? "" : `<h3 class="row" style="gap:10px">${ICON.download}<span>${L("Download the data", "تنزيل البيانات")}</span></h3>`}
    <p class="small muted">${L("All files are synthetic (computer-generated) and open in Excel or any spreadsheet program.", "جميع الملفات اصطناعية (مولَّدة بالحاسوب) وتُفتح في Excel أو أي برنامج جداول بيانات.")}</p>
    <ul class="file-list">${files.map(f => `<li>
      <span style="flex:1;min-width:0"><span class="fname" style="display:block" title="${esc(f.path)}">${esc(f.name)}</span>
        <span class="small muted" style="display:block">${LT(DATASET_INFO[f.name] || { en: "" })}</span>
        <span class="small faint">${fmtInt(f.rows)} ${L("rows", "صفًا")} × ${f.cols} ${L("columns", "عمودًا")} · CSV · ${fmtBytes(f.bytes)}</span></span>
      <a class="btn btn-sm btn-primary" href="${f.path}" download="${esc(f.name)}" aria-label="${L("Download", "تنزيل")} ${esc(f.name)}">${ICON.download}<span>${L("Download", "تنزيل")}</span></a></li>`).join("")}</ul></div>`;
}


/* ---------------------------------------------------------------------
   14. "Show the code" — click any result to see the code behind it
   --------------------------------------------------------------------- */
const CodeRefs = new Map();
let codeRefSeq = 0;
/** attributes that make an element (tile/card) open its code when clicked */
function codeAttr(spec) {
  const id = `cr${++codeRefSeq}`;
  CodeRefs.set(id, spec);
  return ` data-code-ref="${id}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="${esc(`${L("Show the code for", "اعرض الكود لـ")}: ${spec.title}`)}"`;
}
/** a small "</> Code" button for charts and tables; its code is set later with setCode(key, spec) */
function codeChip(key) {
  return `<button type="button" class="code-chip" data-code-ref="${key}" aria-haspopup="dialog" aria-label="${L("Show the code for this result", "اعرض الكود لهذه النتيجة")}">${ICON.code}<span>${L("Code", "الكود")}</span></button>`;
}
function setCode(key, spec) { CodeRefs.set(key, spec); }

const CodeModal = (() => {
  let el = null, opener = null;
  function build() {
    el = document.createElement("div");
    el.className = "code-modal";
    el.innerHTML = `<div class="code-modal-backdrop" data-cm-close></div><div class="code-modal-box" role="dialog" aria-modal="true" aria-labelledby="cm-title"></div>`;
    document.body.appendChild(el);
    el.addEventListener("click", e => { if (e.target.closest("[data-cm-close]")) close(); });
    el.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      if (e.key === "Tab") {
        const f = $$("button, a[href], pre[tabindex]", el.querySelector(".code-modal-box"));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function open(spec, from) {
    if (!el) build();
    opener = from || document.activeElement;
    const lang = spec.lang || "python";
    el.querySelector(".code-modal-box").innerHTML = `
      <div class="cm-head"><span class="cm-ic">${ICON.code}</span><div class="cm-titles"><div class="cm-k">${L("The code behind this result", "الكود وراء هذه النتيجة")}</div><h2 id="cm-title">${esc(spec.title)}</h2></div>
        <button type="button" class="icon-btn" data-cm-close aria-label="${L("Close", "إغلاق")}">${ICON.close}</button></div>
      <div class="cm-body">
        ${spec.result !== undefined && spec.result !== null && spec.result !== "" ? `<div class="cm-result"><span class="cm-result-k">${L("Result on the page", "النتيجة في الصفحة")}</span><strong>${spec.result}</strong></div>` : ""}
        <p class="small muted">${spec.explain || L(`This ${lang === "sql" ? "SQL query" : "Python code"} produces exactly this result from the same data. Lines starting with # are explanations.`, `ينتج ${lang === "sql" ? "استعلام SQL هذا" : "كود بايثون هذا"} هذه النتيجة بالضبط من البيانات نفسها. الأسطر التي تبدأ بـ # شروح.`)}</p>
        ${Code.block({ code: spec.code, lang, title: lang === "sql" ? "SQL" : "Python", filename: lang === "sql" ? "query.sql" : "result.py" })}
      </div>`;
    el.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => el.querySelector("[data-cm-close].icon-btn").focus(), 30);
  }
  function close() {
    if (!el || !el.classList.contains("open")) return;
    el.classList.remove("open");
    document.body.style.overflow = "";
    if (opener && opener.focus && document.body.contains(opener)) opener.focus();
  }
  return { open, close, isOpen: () => !!el && el.classList.contains("open") };
})();

document.addEventListener("click", e => {
  const ref = e.target.closest("[data-code-ref]");
  if (!ref) return;
  const inner = e.target.closest("button, a, input, select, textarea, label, .hm-cell");
  if (inner && inner !== ref && ref.contains(inner)) return;   // a control inside the card was used
  const spec = CodeRefs.get(ref.dataset.codeRef);
  if (spec) { e.preventDefault(); CodeModal.open(spec, ref); }
});
document.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-code-ref]:not(button)")) {
    const spec = CodeRefs.get(e.target.dataset.codeRef);
    if (spec) { e.preventDefault(); CodeModal.open(spec, e.target); }
  }
});
