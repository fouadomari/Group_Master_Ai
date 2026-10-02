/* =====================================================================
   home.js — landing page: choose Lecture 1 or Lecture 2.
   Created by Master of AI.
   ===================================================================== */
function renderHome() {
  const d = window.SITE_DATA, main = document.getElementById("main");
  if (!d) { main.innerHTML = `<div class="container page-section">${callout("danger", "Data not found", "<p>js/site-data.js is missing.</p>")}</div>`; return; }
  const fc = d.forecast.series.screening_visits, q = d.quality.summary;
  const l1 = [L("Check the data", "افحص البيانات"), L("Clean it", "نظّفها"), L("Describe & explore", "صِف واستكشف"), L("Test", "اختبر"), L("Predict & forecast", "تنبأ وتوقّع")];
  const l2 = [L("KPIs", "مؤشرات الأداء"), L("SQL & dashboards", "SQL ولوحات المؤشرات"), L("Automation", "الأتمتة"), L("AI assistants & agents", "المساعدون والوكلاء الأذكياء"), L("Governance", "الحوكمة")];
  const pills = arr => `<div class="pill-steps">${arr.map((s, i) => `${i ? '<span class="arrow">→</span>' : ""}<span class="pill">${s}</span>`).join("")}</div>`;
  main.innerHTML = `
  <section class="home-hero" aria-labelledby="hero-title"><div class="container hero-grid">
    <div>
      <div class="eyebrow">${esc(BRAND.companyName)} · ${esc(BRAND.department)}</div>
      <h1 id="hero-title">${L("Medical analytics, explained step by step", "تحليلات البيانات الطبية، مشروحة خطوة بخطوة")}</h1>
      <p class="lead">${L("Two interactive lectures that follow one realistic patient-screening training dataset — from a messy file to trustworthy insight, and from insight to dashboards, automation and AI assistance. Every step is explained in plain language and shown live; there is nothing to download.",
        "محاضرتان تفاعليتان تتبعان مجموعة بيانات تدريبية واقعية لفحص المرضى — من ملف غير منظم إلى رؤية موثوقة، ومن الرؤية إلى لوحات المؤشرات والأتمتة والمساعدة بالذكاء الاصطناعي. كل خطوة مشروحة بلغة بسيطة ومعروضة مباشرة؛ ولا شيء لتنزيله.")}</p>
      <p class="small muted mt-3 mb-0">${L("Presenter", "المقدّم")}: ${esc(BRAND.presenterName)}</p>
    </div>
    <div class="hero-panel"><div class="chart-title">${L("Monthly screening visits", "زيارات الفحص الشهرية")}</div><div class="chart-sub">${L("History and 12-month forecast — one of the things you will build", "التاريخ وتوقع 12 شهرًا — أحد الأشياء التي ستبنيها")}</div><div id="hero-chart"></div></div>
  </div></section>
  <section class="page-section"><div class="container"><div class="grid grid-2">
    <article class="card lecture-card"><div class="num-big">01</div><div class="meta"><span class="badge">${L("20 sections", "20 قسمًا")}</span></div>
      <h2 style="font-size:1.35rem">${L("From Messy Medical Data to Statistical Insight, Machine Learning and Forecasting", "من البيانات الطبية غير المنظمة إلى الرؤية الإحصائية وتعلّم الآلة والتنبؤ")}</h2>
      <p class="muted">${L(`How ${fmtInt(q.rows)} messy records become trustworthy numbers: quality checks, cleaning, statistics, exploration, testing, prediction and forecasting.`, `كيف تتحول ${fmtInt(q.rows)} سجلًا غير منظم إلى أرقام موثوقة: فحوص الجودة، والتنظيف، والإحصاء، والاستكشاف، والاختبار، والتنبؤ، والتوقع.`)}</p>
      ${pills(l1)}</article>
    <article class="card lecture-card"><div class="num-big">02</div><div class="meta"><span class="badge">${L("12 sections", "12 قسمًا")}</span></div>
      <h2 style="font-size:1.35rem">${L("From Statistical Insight to BI, Automation and AI Agents", "من الرؤية الإحصائية إلى ذكاء الأعمال والأتمتة ووكلاء الذكاء الاصطناعي")}</h2>
      <p class="muted">${L("How organisations use those numbers: good KPIs, SQL, a working dashboard, automatic pipelines and reports, and AI assistants and agents kept safe with guardrails.", "كيف تستخدم المؤسسات هذه الأرقام: مؤشرات أداء جيدة، وSQL، ولوحة مؤشرات عاملة، ومسارات وتقارير آلية، ومساعدون ووكلاء أذكياء تحميهم الضوابط.")}</p>
      ${pills(l2)}</article>
  </div></div></section>
  <section class="page-section" id="data" aria-labelledby="data-title"><div class="container">
    <div class="eyebrow">${L("The data", "البيانات")}</div><h2 id="data-title">${L("Download the data used in both lectures", "نزّل البيانات المستخدمة في المحاضرتين")}</h2>
    <p class="lead">${L("Explore the same files yourself — the raw file, the cleaned version, and the monthly activity used for forecasting.", "استكشف الملفات نفسها بنفسك — الملف الخام، والنسخة المنظّفة، والنشاط الشهري المستخدم للتوقع.")}</p>
    ${datasetDownloads({ title: false })}</div></section>`;
  const labels = fc.months.concat(fc.future_months), n = fc.values.length;
  Charts.line(document.getElementById("hero-chart"), { labels, height: 230,
    series: [{ name: L("actual", "فعلي"), values: fc.values.concat(Array(fc.forecast.length).fill(null)), cls: "c1" }, { name: L("forecast", "التوقع"), values: Array(n - 1).fill(null).concat([fc.values[n - 1]], fc.forecast), cls: "c2", width: 2.6 }],
    band: { lower: Array(n).fill(null).concat(fc.lower), upper: Array(n).fill(null).concat(fc.upper), cls: "c2", name: L("likely range", "النطاق المرجح") }, vline: n - 1 });
}

document.addEventListener("DOMContentLoaded", () => {
  Shell.init({ page: "home", current: "home" });
  renderHome();
  document.title = LT(BRAND.courseTitle);
  App.on("lang", () => { renderHome(); document.title = LT(BRAND.courseTitle); });
  // content is rendered by JavaScript, so jump to #data (etc.) once it exists
  const jump = () => { const el = location.hash && document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); };
  jump();
  window.addEventListener("hashchange", jump);
});
