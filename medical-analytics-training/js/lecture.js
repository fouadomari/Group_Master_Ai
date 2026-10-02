/* =====================================================================
   lecture.js — shared engine for Lecture 1 and Lecture 2.
   Created by Master of AI.

   Every section follows the same simple layout (see lesson() below):
     1. In simple terms      — one or two plain sentences
     2. Why it matters       — short bullets
     3. Step by step         — the process, one small step at a time,
                               each with an example from our data
     4. See it on our data   — an interactive, live demonstration
     5. What this shows      — the results explained in words
     6. Behind the scenes    — optional code with its result (collapsed)
     7. Remember             — one-line takeaway + a quick check question

   Navigation: unique URL per section, Back/Forward, sidebar, progress,
   Previous/Next, mobile drawer + bottom bar, swipe, and the keyboard
   (← previous · → next · Home first · End last · Esc close menu).
   ===================================================================== */

const Lec = {
  config: null,
  sections: [],
  HOME: "start",
  current: null,
  state: {},
  timers: {},
  configure(cfg) { this.config = cfg; },
  add(section) { this.sections.push(section); },
};

/* ---------- small helpers for sections ---------- */
const SD = () => window.SITE_DATA;
const pad2 = n => String(n).padStart(2, "0");
const sectionById = id => Lec.sections.find(s => s.id === id || (s.aliases || []).includes(id));
function groupOf(num) { return (Lec.config.groups.find(g => num >= g.from && num <= g.to)) || Lec.config.groups[0]; }
function getState(id, defaults) { if (!Lec.state[id]) Lec.state[id] = { ...defaults }; return Lec.state[id]; }
function sectionLink(id, label) { const s = sectionById(id); return s ? `<a href="#${s.id}">${label || LT(s.title)}</a>` : (label || ""); }
function varOptions(list) { return list.map(v => ({ value: v, label: `${vlabel(v)}${vunit(v) ? ` (${vunit(v)})` : ""}` })); }
function stat(k, v, d, code) { return `<div class="stat${code ? " has-code" : ""}"${code ? codeAttr(code) : ""}><div class="k">${k}</div><div class="v">${v}</div>${d ? `<div class="d">${d}</div>` : ""}</div>`; }
function miniTable(head, rows, opts = {}) {
  return `<div class="table-wrap" ${opts.maxH ? `style="max-height:${opts.maxH}px"` : ""}><table class="data ${opts.cls || ""}"><thead><tr>${head.map(h => `<th scope="col" class="${h.num ? "num" : ""}">${h.t ?? h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i] && head[i].num ? "num" : ""}">${c ?? '<span class="cell-missing">∅</span>'}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
const fmtCell = v => (v === null || v === undefined ? null : typeof v === "number" ? (Number.isInteger(v) ? String(v) : fmt(v, 1)) : esc(v));

/** wrap a table/log/panel with a "</> Code" button that opens `spec` */
function withCode(key, spec, html) { setCode(key, spec); return `<div class="coded">${codeChip(key)}${html}</div>`; }

function sectionHead(s) {
  return `<header class="section-head">
    <div class="eyebrow"><span class="section-num">${L("Section", "القسم")} ${pad2(s.num)} / ${Lec.sections.length}</span><span>·</span><span>${LT(groupOf(s.num))}</span></div>
    <h1 id="section-title" tabindex="-1">${LT(s.title)}</h1></header>`;
}

/**
 * The standard simple lesson layout.
 * o = { simple, why:[..], steps:[{t, d, ex}], seeTitle, see (html), seeNote, results (html or id placeholder),
 *       code:{code, lang, title, result}, remember, quiz:{q, options:[{t, ok, why}]}, extra (html after steps) }
 */
function lesson(s, o) {
  const steps = o.steps || [];
  return `${sectionHead(s)}
  <div class="lesson">
    <div class="simple-box"><span class="simple-ic" aria-hidden="true">${ICON.bulb}</span><div><div class="simple-k">${L("In simple terms", "ببساطة")}</div><p class="simple-t">${o.simple}</p></div></div>
    ${o.why ? `<section class="block"><h2>${L("Why it matters", "لماذا هذا مهم")}</h2><ul class="why-list">${o.why.map(w => `<li>${w}</li>`).join("")}</ul></section>` : ""}
    ${steps.length ? `<section class="block"><h2>${o.stepsTitle || L("How it works — step by step", "كيف يعمل — خطوة بخطوة")}</h2>
      <ol class="steps">${steps.map((st, i) => `<li class="step"><span class="step-n" aria-hidden="true">${i + 1}</span><div class="step-body">
        <h3>${st.t}</h3><p>${st.d}</p>${st.ex ? `<div class="step-ex"><span class="step-ex-k">${L("Example", "مثال")}</span>${st.ex}</div>` : ""}</div></li>`).join("")}</ol></section>` : ""}
    ${o.extra || ""}
    ${o.see ? `<section class="block see-it"><h2>${o.seeTitle || L("See it on our data", "شاهده على بياناتنا")}</h2>${o.seeNote ? `<p class="muted">${o.seeNote}</p>` : ""}
      ${o.codeHint === false ? "" : `<p class="code-hint">${ICON.code.replace("<svg", '<svg width="16" height="16"')}<span>${L("Click any number, or the <b>&lt;/&gt; Code</b> button on a chart or table, to see the exact code that produced it.", "انقر أي رقم، أو زر <b>&lt;/&gt; الكود</b> على أي رسم أو جدول، لترى الكود الذي أنتجه بالضبط.")}</span></p>`}${o.see}</section>` : ""}
    ${o.results !== undefined ? `<section class="block"><h2>${L("What this shows", "ماذا يُظهر هذا")}</h2><div class="card result-card" id="results" aria-live="polite">${o.results}</div></section>` : ""}
    ${o.code ? `<section class="block"><details class="code-peek"><summary>${ICON.code}<span>${L("Behind the scenes: the Python code (optional)", "خلف الكواليس: كود بايثون (اختياري)")}</span></summary>
      <p class="small muted">${L("You do not need to run anything — this is the code that produced the result shown below it.", "لا تحتاج إلى تشغيل أي شيء — هذا هو الكود الذي أنتج النتيجة المعروضة أسفله.")}</p>
      ${Code.block({ code: o.code.code, lang: o.code.lang || "python", title: o.code.title || L("Python", "بايثون"), filename: o.code.filename, result: o.code.result })}</details></section>` : ""}
    ${o.remember ? `<section class="block"><div class="remember"><span class="remember-k">${L("Remember", "تذكّر")}</span><p>${o.remember}</p></div></section>` : ""}
    ${o.quiz ? quizHTML(o.quiz) : ""}
  </div>`;
}

function quizHTML(qz) {
  return `<section class="block"><h2>${L("Quick check", "اختبار سريع")}</h2><div class="card quiz" data-quiz>
    <p class="quiz-q"><strong>${qz.q}</strong></p>
    <div class="quiz-opts">${qz.options.map((op, i) => `<button type="button" class="quiz-option" data-quiz-opt="${i}" data-ok="${op.ok ? 1 : 0}">${op.t}</button>`).join("")}</div>
    <div class="feedback" role="status" aria-live="polite"></div>
    <template>${qz.options.map(op => `<div>${op.why || ""}</div>`).join("")}</template></div></section>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-quiz-opt]");
  if (!b) return;
  const box = b.closest("[data-quiz]"), why = box.querySelector("template").content.children[+b.dataset.quizOpt];
  box.querySelectorAll("[data-quiz-opt]").forEach(x => { x.classList.remove("correct", "wrong"); if (x.dataset.ok === "1" && b.dataset.ok === "1") x.classList.add("correct"); });
  b.classList.add(b.dataset.ok === "1" ? "correct" : "wrong");
  box.querySelector(".feedback").innerHTML = `${b.dataset.ok === "1" ? "✅ " + L("Correct.", "صحيح.") : "❌ " + L("Not quite.", "ليس تمامًا.")} ${why ? why.innerHTML : ""}`;
});

/* ---------- documented cleaning rules (JavaScript port of python/medlib.py) ---------- */
const CleanRules = (() => {
  const MISSING = new Set(["", "na", "n/a", "nan", "null", "none", "?", "-", "missing", "not recorded", "unknown"]);
  const isMiss = v => MISSING.has(String(v ?? "").trim().toLowerCase());
  const num = v => { if (isMiss(v)) return NaN; const m = String(v).match(/-?\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(",", ".")) : NaN; };
  const range = (col, x) => { const r = SD().validRanges[col]; return Number.isNaN(x) ? { v: NaN, why: L("not a number", "ليست رقمًا") } : r && (x < r[0] || x > r[1]) ? { v: NaN, why: L(`outside the valid range ${r[0]}–${r[1]}`, `خارج النطاق الصالح ${r[0]}–${r[1]}`) } : { v: x }; };
  const maps = {
    sex: { male: "Male", m: "Male", female: "Female", f: "Female" },
    smoking: { yes: "Smoker", y: "Smoker", 1: "Smoker", smoker: "Smoker", current: "Smoker", no: "Non-Smoker", n: "Non-Smoker", 0: "Non-Smoker", "non-smoker": "Non-Smoker", nonsmoker: "Non-Smoker", never: "Non-Smoker" },
    bool: { yes: 1, y: 1, true: 1, 1: 1, no: 0, n: 0, false: 0, 0: 0 },
    risk: { low: "Low", l: "Low", moderate: "Moderate", mod: "Moderate", med: "Moderate", medium: "Moderate", high: "High", h: "High" },
  };
  const mapv = (m, v) => (isMiss(v) ? undefined : m[String(v).trim().toLowerCase()]);
  function parseDate(v) {
    if (isMiss(v)) return null;
    const s = String(v).trim(); let y, mo, d, m;
    if ((m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/))) [y, mo, d] = [+m[1], +m[2], +m[3]];
    else if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) [d, mo, y] = [+m[1], +m[2], +m[3]];
    else return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    if (dt > new Date(Date.UTC(2024, 11, 31)) || y < 2015) return null;
    return `${y}-${pad2(mo)}-${pad2(d)}`;
  }
  const miss = why => `${L("missing", "مفقودة")}${why ? " (" + why + ")" : ""}`;
  const apply = {
    bp(v) { if (isMiss(v)) return miss(); const [a, b] = String(v).includes("/") ? String(v).split("/") : [v, ""]; const s = range("systolic_bp", num(a)), dd = b === "" ? { v: NaN, why: L("not given", "غير موجودة") } : range("diastolic_bp", num(b)); return `systolic_bp = ${Number.isNaN(s.v) ? miss(s.why) : s.v} · diastolic_bp = ${Number.isNaN(dd.v) ? miss(dd.why) : dd.v}`; },
    glucose(v) { if (isMiss(v)) return `fasting_glucose = ${miss()}`; let x = num(v); if (/mmol/i.test(v)) x = Math.round(x * 18.016); const r = range("fasting_glucose", x); return `fasting_glucose = ${Number.isNaN(r.v) ? miss(r.why) : r.v}`; },
    hba1c(v) { const r = range("hba1c", num(v)); return `hba1c = ${Number.isNaN(r.v) ? miss(isMiss(v) ? "" : r.why) : r.v}`; },
    bmi(v) { const r = range("bmi", num(v)); return `bmi = ${Number.isNaN(r.v) ? miss(isMiss(v) ? "" : r.why) : r.v}`; },
    age(v) { const r = range("age", num(v)); return `age = ${Number.isNaN(r.v) ? miss(isMiss(v) ? "" : r.why) : Math.round(r.v)}`; },
    sex(v) { const r = mapv(maps.sex, v); return `sex = ${r || miss(isMiss(v) ? "" : L("unknown code", "رمز غير معروف"))}`; },
    smoking(v) { const r = mapv(maps.smoking, v); return `smoking_status = ${r || miss(isMiss(v) ? "" : L("unknown code", "رمز غير معروف"))}`; },
    bool(v) { const r = mapv(maps.bool, v); return `family_history_flag = ${r === undefined ? miss(isMiss(v) ? "" : L("unknown code", "رمز غير معروف")) : r}`; },
    clinic(v) { if (isMiss(v)) return `clinic_id = ${miss()}`; const m = String(v).match(/\d+/); return `clinic_id = ${m ? "CL" + pad2(+m[0]) : miss(L("no number", "لا يوجد رقم"))}`; },
    date(v) { const r = parseDate(v); return `visit_date = ${r || miss(L("impossible or future date", "تاريخ مستحيل أو مستقبلي"))}`; },
    risk(v) { const r = mapv(maps.risk, v); return `risk_group = ${r || miss(isMiss(v) ? "" : L("unknown label", "تسمية غير معروفة"))}`; },
  };
  return { apply, isMiss, parseDate, num };
})();

/* ---------- visited tracking (per browser) ---------- */
const Visited = {
  key: () => `mat-${Lec.config.key}-visited`,
  get() { try { return new Set(JSON.parse(Store.get(this.key(), "[]"))); } catch (e) { return new Set(); } },
  add(id) { const s = this.get(); s.add(id); Store.set(this.key(), JSON.stringify([...s])); },
};

/* ---------- layout ---------- */
function orderedIds() { return [Lec.HOME, ...Lec.sections.map(s => s.id)]; }
function neighbours(id) { const ids = orderedIds(), i = ids.indexOf(id); return { prev: i > 0 ? ids[i - 1] : null, next: i < ids.length - 1 ? ids[i + 1] : null }; }
function titleFor(id) { if (id === Lec.HOME) return L("Start here", "ابدأ من هنا"); const s = sectionById(id); return s ? LT(s.title) : ""; }
function numFor(id) { const s = sectionById(id); return s ? s.num : 0; }
const otherLecture = () => Lec.config.other;

function renderSidebar() {
  const sb = $("#lecture-sidebar"), collapsed = $("#lecture-layout").classList.contains("collapsed");
  const visited = Visited.get(), total = Lec.sections.length, done = Lec.sections.filter(s => visited.has(s.id)).length;
  sb.setAttribute("aria-label", t("nav.sections"));
  let list = `<li><a href="#${Lec.HOME}" ${Lec.current === Lec.HOME ? 'aria-current="page"' : ""} title="${L("Start here", "ابدأ من هنا")}"><span class="num">${ICON.home.replace("<svg", '<svg width="14" height="14"')}</span><span class="lbl">${L("Start here", "ابدأ من هنا")}</span></a></li>`;
  Lec.config.groups.forEach(g => {
    list += `<li class="sidebar-group">${LT(g)}</li>`;
    Lec.sections.filter(s => s.num >= g.from && s.num <= g.to).forEach(s => {
      list += `<li class="${visited.has(s.id) ? "visited" : ""}"><a href="#${s.id}" ${Lec.current === s.id ? 'aria-current="page"' : ""} title="${esc(pad2(s.num) + " " + LT(s.title))}">
        <span class="num">${pad2(s.num)}</span><span class="lbl">${LT(s.short || s.title)}</span>${visited.has(s.id) ? `<span class="tick" aria-label="${L("visited", "تمت زيارته")}">${ICON.check}</span>` : ""}</a></li>`;
    });
  });
  sb.innerHTML = `<div class="sidebar-head"><div class="title">${LT(Lec.config.title)}<small>${LT(Lec.config.subtitle)}</small></div>
      <button type="button" class="icon-btn collapse-btn" id="collapse-btn" aria-expanded="${!collapsed}" aria-controls="lecture-sidebar" aria-label="${collapsed ? L("Expand section list", "توسيع قائمة الأقسام") : L("Collapse section list", "طيّ قائمة الأقسام")}">${ICON.sidebar}</button></div>
    <div class="sidebar-progress">${L("Sections visited", "الأقسام التي تمت زيارتها")}: <strong>${done} / ${total}</strong><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="${L("Sections visited", "الأقسام التي تمت زيارتها")}"><span style="width:${(100 * done) / total}%"></span></div></div>
    <nav aria-label="${t("nav.sections")}"><ul class="sidebar-list">${list}</ul></nav>
    <div class="sidebar-foot"><a class="btn btn-sm btn-primary" href="${otherLecture().href}">${otherLecture().dir === "next" ? ICON.arrowR : ICON.arrowL}<span>${LT(otherLecture().label)}</span></a></div>`;
  const active = sb.querySelector('[aria-current="page"]');
  if (active) active.scrollIntoView({ block: "nearest" });
}

function drawerSections() {
  return `<div class="drawer-section-title">${LT(Lec.config.title)} · ${t("nav.sections")}</div>
    <nav aria-label="${t("nav.sections")}" class="drawer-sections"><a href="#${Lec.HOME}" ${Lec.current === Lec.HOME ? 'aria-current="page" data-current-section' : ""}>${ICON.home.replace("<svg", '<svg width="16" height="16"')} ${L("Start here", "ابدأ من هنا")}</a>
    ${Lec.sections.map(s => `<a href="#${s.id}" ${Lec.current === s.id ? 'aria-current="page" data-current-section' : ""}><span class="badge">${pad2(s.num)}</span> ${LT(s.title)}</a>`).join("")}</nav>`;
}

function renderToolbar() {
  const id = Lec.current, { prev, next } = neighbours(id), num = numFor(id), total = Lec.sections.length, o = otherLecture();
  $("#lecture-toolbar").innerHTML = `
    <a class="btn btn-sm" href="#${Lec.HOME}">${ICON.home}<span class="hide-sm">${L("Lecture start", "بداية المحاضرة")}</span></a>
    <div class="crumb"><span class="counter" aria-live="polite">${id === Lec.HOME ? L("Overview", "نظرة عامة") : `${L("Section", "القسم")} ${num} / ${total}`}</span>
      <div class="progress" role="progressbar" aria-label="${L("Lecture progress", "تقدّم المحاضرة")}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${num}"><span style="width:${(100 * num) / total}%"></span></div></div>
    <div class="toolbar-nav">
      <a class="btn btn-sm" ${prev ? `href="#${prev}"` : 'aria-disabled="true"'} rel="prev" aria-label="${L("Previous section", "القسم السابق")}${prev ? ": " + esc(titleFor(prev)) : ""}">${ICON.arrowL}<span class="hide-sm">${L("Previous", "السابق")}</span></a>
      <button type="button" class="btn btn-sm" data-drawer-open data-drawer-focus="[data-current-section]" aria-controls="site-drawer" aria-expanded="false">${ICON.list}<span class="hide-sm">${L("Sections", "الأقسام")}</span></button>
      <a class="btn btn-sm" ${next ? `href="#${next}"` : `href="${o.href}"`} rel="next" aria-label="${next ? L("Next section", "القسم التالي") + ": " + esc(titleFor(next)) : LT(o.label)}"><span class="hide-sm">${L("Next", "التالي")}</span>${ICON.arrowR}</a>
      <a class="btn btn-sm btn-primary hide-md" href="${o.href}">${LT(o.label)}</a></div>`;
}

function renderPager() {
  const { prev, next } = neighbours(Lec.current), o = otherLecture();
  const card = (id, dir) => {
    if (!id) return `<span class="pager-card placeholder" aria-hidden="true"></span>`;
    const n = numFor(id);
    return `<a class="pager-card ${dir}" href="#${id}" rel="${dir}"><span class="dir">${dir === "prev" ? ICON.arrowL + L("Previous", "السابق") : L("Next", "التالي") + ICON.arrowR}</span>
      <span class="ttl">${n ? pad2(n) + " · " : ""}${esc(titleFor(id))}</span></a>`;
  };
  const nextCard = next ? card(next, "next") : `<a class="pager-card next l2" href="${o.href}"><span class="dir">${L("Continue", "تابع")}${ICON.arrowR}</span><span class="ttl">${LT(o.label)}</span></a>`;
  $("#pager-cards").setAttribute("aria-label", L("Section navigation", "التنقل بين الأقسام"));
  $("#pager-cards").innerHTML = card(prev, "prev") + nextCard;
  $("#mobile-bar").setAttribute("aria-label", L("Section navigation", "التنقل بين الأقسام"));
  $("#mobile-bar").innerHTML = `
    <a class="btn" ${prev ? `href="#${prev}"` : 'aria-disabled="true"'} aria-label="${L("Previous section", "القسم السابق")}">${ICON.arrowL}<span>${L("Previous", "السابق")}</span></a>
    <button type="button" class="btn sections" data-drawer-open data-drawer-focus="[data-current-section]" aria-controls="site-drawer" aria-expanded="false">${ICON.list}<span>${Lec.current === Lec.HOME ? "—" : pad2(numFor(Lec.current))}/${Lec.sections.length}</span></button>
    <a class="btn btn-primary" ${next ? `href="#${next}"` : `href="${o.href}"`} aria-label="${next ? L("Next section", "القسم التالي") : LT(o.label)}"><span>${next ? L("Next", "التالي") : LT(o.short)}</span>${ICON.arrowR}</a>`;
}

/* ---------- lecture start page ---------- */
function renderHome(root) {
  const c = Lec.config, visited = Visited.get();
  root.innerHTML = `
  <div class="hero-lecture">
    <div class="eyebrow">${LT(c.title)} · ${esc(BRAND.companyName)}</div>
    <h1 id="section-title" tabindex="-1">${LT(c.fullTitle)}</h1>
    <p class="lead">${LT(c.intro)}</p>
    <div class="row mt-2"><a class="btn btn-primary btn-lg" href="#${Lec.sections[0].id}">${L("Start with Section 01", "ابدأ بالقسم 01")} ${ICON.arrowR}</a>
      <span class="muted small">${L("Presenter", "المقدّم")}: ${esc(BRAND.presenterName)}</span></div>
  </div>
  <section class="block"><h2>${L("How every section works", "كيف يعمل كل قسم")}</h2>
    <div class="how-grid">
      <div class="how"><span class="how-n">1</span><strong>${L("In simple terms", "ببساطة")}</strong><span>${L("The idea in one or two sentences.", "الفكرة في جملة أو جملتين.")}</span></div>
      <div class="how"><span class="how-n">2</span><strong>${L("Step by step", "خطوة بخطوة")}</strong><span>${L("The process, one small step at a time, with examples.", "العملية خطوة صغيرة في كل مرة، مع أمثلة.")}</span></div>
      <div class="how"><span class="how-n">3</span><strong>${L("See it on our data", "شاهده على بياناتنا")}</strong><span>${L("A live, interactive demonstration — nothing to install or download.", "عرض حي وتفاعلي — لا شيء لتثبيته أو تنزيله.")}</span></div>
      <div class="how"><span class="how-n">4</span><strong>${L("Remember & check", "تذكّر وتحقّق")}</strong><span>${L("One key message and a quick question.", "رسالة أساسية واحدة وسؤال سريع.")}</span></div>
    </div></section>
  ${c.homeExtra ? c.homeExtra() : ""}
  <section class="block"><h2>${L("All sections", "جميع الأقسام")}</h2>${c.groups.map(g => `<h3 class="mt-3">${LT(g)}</h3><div class="section-grid">${Lec.sections.filter(s => s.num >= g.from && s.num <= g.to).map(s => `
      <a class="section-tile ${visited.has(s.id) ? "visited" : ""}" href="#${s.id}"><span class="num">${pad2(s.num)}</span><span><span class="ttl">${LT(s.title)}</span><span class="sub">${LT(s.summary || {})}</span></span></a>`).join("")}</div>`).join("")}</section>`;
}

/* ---------- router ---------- */
function resolve(hash) {
  const id = decodeURIComponent((hash || "").replace(/^#/, "")).trim();
  if (!id || id === Lec.HOME) return Lec.HOME;
  const s = sectionById(id);
  return s ? s.id : null;
}
let firstRender = true;
function route() {
  const raw = location.hash.replace(/^#/, "");
  let id = resolve(raw);
  if (id === null) { id = Lec.HOME; history.replaceState(null, "", `#${Lec.HOME}`); }
  else if (raw && raw !== id) history.replaceState(null, "", `#${id}`);
  render(id, !firstRender);
  firstRender = false;
}
function render(id, moveFocus = true) {
  Object.values(Lec.timers).forEach(clearInterval);
  CodeModal.close(); CodeRefs.clear();
  Lec.current = id;
  const root = $("#section-root");
  root.innerHTML = "";
  if (id === Lec.HOME) renderHome(root);
  else {
    const s = sectionById(id);
    try { s.render(root, s); } catch (err) { console.error(err); root.innerHTML = callout("danger", "Rendering error", `<p>${esc(err.message)}</p>`); }
    Visited.add(id);
  }
  document.title = `${id === Lec.HOME ? LT(Lec.config.title) : `${pad2(numFor(id))} ${titleFor(id)}`} — ${LT(BRAND.courseTitle)}`;
  renderSidebar(); renderToolbar(); renderPager(); Shell.renderDrawer();
  window.scrollTo({ top: 0, behavior: "auto" });
  if (moveFocus) { const h = $("#section-title"); if (h) h.focus({ preventScroll: true }); }
}
function go(id) { if (id) location.hash = id; }

function initLecture() {
  if (!window.SITE_DATA) { $("#section-root").innerHTML = callout("danger", "Data not found", "<p>js/site-data.js is missing.</p>"); return; }
  Lec.sections.sort((a, b) => a.num - b.num);
  const layout = $("#lecture-layout");
  if (Store.get("mat-sidebar", "open") === "collapsed") layout.classList.add("collapsed");
  Shell.init({ page: Lec.config.key, current: Lec.config.key, drawerExtra: drawerSections });

  document.addEventListener("click", e => {
    if (e.target.closest("#collapse-btn")) {
      layout.classList.toggle("collapsed");
      Store.set("mat-sidebar", layout.classList.contains("collapsed") ? "collapsed" : "open");
      renderSidebar(); $("#collapse-btn").focus(); window.dispatchEvent(new Event("resize"));
    }
    if (e.target.closest('a[aria-disabled="true"]')) e.preventDefault();
  });
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "select", "textarea"].includes(tag) || e.target.isContentEditable) return;
    if ($("#site-drawer.open") || CodeModal.isOpen() || (e.target.closest && e.target.closest(".agent-panel"))) return;
    const { prev, next } = neighbours(Lec.current);
    if (e.key === "ArrowLeft" && prev) { e.preventDefault(); go(prev); }
    else if (e.key === "ArrowRight" && next) { e.preventDefault(); go(next); }
    else if (e.key === "Home") { e.preventDefault(); go(Lec.sections[0].id); }
    else if (e.key === "End") { e.preventDefault(); go(Lec.sections[Lec.sections.length - 1].id); }
  });
  let sx = 0, sy = 0, st = 0, ok = false;
  const main = $("#main");
  main.addEventListener("touchstart", e => {
    const tch = e.touches[0];
    ok = e.touches.length === 1 && !e.target.closest(".table-wrap, .chart, .pipeline, input, select, textarea, pre, .journey-steps, .tabs-list, .segmented, .example-list");
    sx = tch.clientX; sy = tch.clientY; st = Date.now();
  }, { passive: true });
  main.addEventListener("touchend", e => {
    if (!ok) return;
    const tch = e.changedTouches[0], dx = tch.clientX - sx, dy = tch.clientY - sy;
    if (Date.now() - st > 700 || Math.abs(dx) < 80 || Math.abs(dy) > 60) return;
    const { prev, next } = neighbours(Lec.current), forward = App.lang === "ar" ? dx > 0 : dx < 0;
    if (forward && next) go(next); else if (!forward && prev) go(prev);
  }, { passive: true });
  App.on("lang", () => render(Lec.current, false));
  route();
}
document.addEventListener("DOMContentLoaded", initLecture);
