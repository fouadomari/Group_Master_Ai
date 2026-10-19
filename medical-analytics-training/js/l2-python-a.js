/* =====================================================================
   Lecture 2 — Data Analysis with Python
   From Raw Data to Business Insights (Kaggle Store Sales)
   Created by Master of AI.

   Configuration, shared helpers + Sections 1–7.
   The Python code lives in js/store-sales-code.js (PYS) and runs in
   Google Colab. Results shown on the page are computed in the browser by
   js/store-sales.js from the files the viewer chooses.
   ===================================================================== */
Lec.configure({
  key: "lecture2",
  title: { en: "Lecture 2", ar: "المحاضرة 2" },
  subtitle: { en: "Data analysis with Python", ar: "تحليل البيانات باستخدام بايثون" },
  fullTitle: { en: "Data Analysis with Python — From Raw Data to Business Insights", ar: "تحليل البيانات باستخدام بايثون — من البيانات الخام إلى رؤى الأعمال" },
  intro: {
    en: "A hands-on course on the real Kaggle Store Sales data: inspect it, clean it, merge two files, analyse sales over time, visualise the results and turn them into business insights. The Python code runs in Google Colab; every step is explained here, and the page can show the results computed from your own copy of the files.",
    ar: "دورة تطبيقية على بيانات Store Sales الحقيقية من Kaggle: افحصها، ونظّفها، وادمج ملفين، وحلّل المبيعات عبر الزمن، واعرض النتائج بصريًا، وحوّلها إلى رؤى أعمال. يعمل كود بايثون في Google Colab؛ وتُشرح هنا كل خطوة، ويمكن للصفحة عرض النتائج المحسوبة من نسختك من الملفات.",
  },
  groups: [
    { from: 1, to: 3, en: "Getting started", ar: "البداية" },
    { from: 4, to: 7, en: "Preparing the data", ar: "تجهيز البيانات" },
    { from: 8, to: 11, en: "Analysing", ar: "التحليل" },
    { from: 12, to: 15, en: "Presenting insights", ar: "عرض الرؤى" },
  ],
  homeExtra: () => `<section class="block"><div class="card py-part">
      <h2 class="mt-0">${L("The path from raw data to insight", "المسار من البيانات الخام إلى الرؤية")}</h2>
      <div class="pill-steps">${PY_STAGES().map((s, i) => `${i ? '<span class="arrow">→</span>' : ""}<span class="pill">${s.t}</span>`).join("")}</div>
      <p class="small muted mt-2 mb-0">${L(`Data: <a href="${KAGGLE_URL}" target="_blank" rel="noopener">Kaggle · Store Sales — Time Series Forecasting</a> (train.csv and stores.csv).`, `البيانات: <a href="${KAGGLE_URL}" target="_blank" rel="noopener">Kaggle · Store Sales — Time Series Forecasting</a> (الملفان train.csv و stores.csv).`)}</p></div></section>`,
  other: { href: "lecture-1.html", dir: "prev", label: { en: "Back to Lecture 1", ar: "العودة إلى المحاضرة 1" }, short: { en: "Lecture 1", ar: "المحاضرة 1" } },
});
const MONTHS = () => (App.lang === "ar" ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);

/* ---------- small helpers ---------- */
const KAGGLE_URL = "https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data";
const SSR = () => StoreSales.result;
const f2 = v => fmt(v, 2);
const pyCode = (key, title) => Code.block({ code: PYS[key], lang: "python", title: title || "Python · Google Colab", filename: `${key}.py` });
const pySpec = (key, title, result) => ({ title, result, code: PYS[key] });
function more(summary, body, cls = "") { return `<details class="py-more ${cls}"><summary>${summary}</summary><div class="py-more-body">${body}</div></details>`; }
function pyLines(rows) {
  return `<div class="table-wrap"><table class="data py-lines"><thead><tr><th scope="col">${L("Code", "الكود")}</th><th scope="col">${L("What it does", "ماذا يفعل")}</th></tr></thead>
    <tbody>${rows.map(([c, d]) => `<tr><td><code>${esc(c)}</code></td><td>${d}</td></tr>`).join("")}</tbody></table></div>`;
}
function mistakes(list) {
  return `<ul class="py-mistakes">${list.map(([err, fix]) => `<li><code class="py-err">${esc(err)}</code><span>${fix}</span></li>`).join("")}</ul>`;
}
/**
 * One teaching unit: concept → purpose → example → code → line by line → expected output
 * → interpretation → common mistakes → business relevance.
 */
function concept(o) {
  return `<article class="card py-concept">
    <h3 class="py-title">${o.title}</h3>
    <dl class="py-facts">
      <div><dt>${L("What is it?", "ما هو؟")}</dt><dd>${o.what}</dd></div>
      <div><dt>${L("Why do we need it?", "لماذا نحتاجه؟")}</dt><dd>${o.why}</dd></div>
      ${o.example ? `<div><dt>${L("Example", "مثال")}</dt><dd>${o.example}</dd></div>` : ""}
    </dl>
    ${(o.code || []).map(k => pyCode(k)).join("")}
    ${o.lines ? more(L("Line-by-line explanation", "شرح الكود سطرًا بسطر"), pyLines(o.lines)) : ""}
    ${o.expect ? more(L("Expected output and how to read it", "المخرجات المتوقعة وكيف تقرؤها"), `${o.expect}${o.interpret ? `<p class="mb-0"><strong>${L("Interpretation:", "التفسير:")}</strong> ${o.interpret}</p>` : ""}`) : ""}
    ${o.mistakes ? more(L("Common mistakes and how to fix them", "أخطاء شائعة وكيف تُصلحها"), mistakes(o.mistakes)) : ""}
    ${o.business ? `<p class="py-biz"><span class="badge accent">${L("Business relevance", "الأهمية للأعمال")}</span> ${o.business}</p>` : ""}
  </article>`;
}
function answer(q, a) { return `<div class="card py-q"><p class="mb-1"><strong>${q}</strong></p>${more(L("Show answer", "اعرض الإجابة"), a, "py-answer")}</div>`; }
function exampleTag() { return `<span class="badge warn">${L("Teaching example — not Kaggle results", "مثال تعليمي — ليس نتائج Kaggle")}</span>`; }
function ssBar() {
  const R = SSR();
  if (!R) return `<div class="ss-bar empty">${ICON.data}<span>${L("No files loaded yet.", "لم تُحمَّل أي ملفات بعد.")} <a href="#py-dataset">${L("Load train.csv and stores.csv (Section 2)", "حمّل train.csv و stores.csv (القسم 2)")}</a></span></div>`;
  return `<div class="ss-bar">${ICON.data}<span><strong>${esc(R.train.name)}</strong> · ${fmtInt(R.train.rows)} ${L("rows", "صف")} · <strong>${esc(R.stores.name)}</strong> · ${fmtInt(R.stores.rows)} ${L("rows", "صف")}</span><a href="#py-dataset">${L("Change files", "غيّر الملفات")}</a></div>`;
}
const LIVE_NOTE = () => L("Computed in this browser with JavaScript from the files you loaded — the same calculation as the Python code above. Python itself does not run inside this page; run the code in Google Colab to get the same numbers.",
  "حُسبت في هذا المتصفح بلغة JavaScript من الملفات التي حمّلتها — وهو الحساب نفسه الذي يجريه كود بايثون أعلاه. لا يعمل بايثون نفسه داخل هذه الصفحة؛ شغّل الكود في Google Colab لتحصل على الأرقام نفسها.");
function waiting(what) {
  return `<div class="ss-wait">${callout("info", L("Your results will appear here", "ستظهر نتائجك هنا"), `<p class="mb-0">${L(`Load <code>train.csv</code> and <code>stores.csv</code> in ${sectionLink("py-dataset", "Section 2")} and this area will show ${what}, computed from your files. Until then, run the Python code in Google Colab to see the results there.`, `حمّل <code>train.csv</code> و <code>stores.csv</code> في ${sectionLink("py-dataset", "القسم 2")} وستعرض هذه المساحة ${what} محسوبة من ملفاتك. وإلى ذلك الحين، شغّل كود بايثون في Google Colab لترى النتائج هناك.`)}</p>`)}</div>`;
}
/** standard "see it" block: data status + live results (or a clear placeholder) */
function liveSee(what, fn) { return `${ssBar()}${SSR() ? fn(SSR()) : waiting(what)}`; }
const pending = what => `<p class="mb-0 muted">${L(`The ${what} will be available after you load the files or run the Python code.`, `سيتوفّر ${what} بعد تحميل الملفات أو تشغيل كود بايثون.`)}</p>`;
function infoTable(info) {
  return miniTable([{ t: "#", num: true }, "Column", { t: "Non-Null Count", num: true }, "Dtype"], info.map((c, i) => [i, `<code>${esc(c.column)}</code>`, `${fmtInt(c.nonNull)} non-null`, `<code>${c.dtype}</code>`]));
}
function describeTable(info) {
  const v = (c, k) => (c[k] === undefined || c[k] === null || Number.isNaN(c[k]) ? null : typeof c[k] === "number" ? (Math.abs(c[k]) >= 1e5 || Number.isInteger(c[k]) ? fmt(c[k], Number.isInteger(c[k]) ? 0 : 2) : fmt(c[k], 3)) : esc(c[k]));
  const cols = ["count", "unique", "top", "freq", "mean", "std", "min", "q1", "median", "q3", "max"];
  const head = ["", ...["count", "unique", "top", "freq", "mean", "std", "min", "25%", "50%", "75%", "max"].map(t => ({ t, num: t !== "top" }))];
  return miniTable(head, info.map(c => [`<code>${esc(c.column)}</code>`, ...cols.map(k => v(c, k))]), { cls: "py-desc" });
}
function headTable(R, which) {
  const d = R[which];
  return miniTable(["", ...d.cols.map(c => `<code>${esc(c)}</code>`)], d.head.map((r, i) => [i, ...r.map(x => esc(x))]));
}

/* ---------- the analysis workflow ---------- */
const PY_STAGES = () => [
  { t: L("Data Collection", "جمع البيانات"), d: L("Get the files and understand where they come from (Kaggle, Section 2).", "احصل على الملفات وافهم مصدرها (Kaggle، القسم 2)."), py: "pd.read_csv()", sec: "py-dataset" },
  { t: L("Data Exploration", "استكشاف البيانات"), d: L("Look at size, columns, types and summary statistics before analysing anything.", "انظر إلى الحجم والأعمدة والأنواع والإحصاءات الموجزة قبل تحليل أي شيء."), py: "head() · info() · describe()", sec: "py-explore" },
  { t: L("Data Cleaning", "تنظيف البيانات"), d: L("Find missing values, duplicates and invalid dates; decide — and record — what to do.", "اكتشف القيم المفقودة والتكرارات والتواريخ غير الصالحة؛ وقرّر ما تفعله وسجّله."), py: "isnull() · duplicated() · to_datetime()", sec: "py-cleaning" },
  { t: L("Data Merging", "دمج البيانات"), d: L("Attach store information (city, type) to every sales record.", "أضف معلومات المتجر (المدينة، النوع) إلى كل سجل مبيعات."), py: "merge()", sec: "py-merge" },
  { t: L("Data Analysis", "تحليل البيانات"), d: L("Group, aggregate, look at time and spot unusual values.", "جمّع، ولخّص، وانظر إلى الزمن، واكتشف القيم غير المعتادة."), py: "groupby() · resample() · quantile()", sec: "py-groupby" },
  { t: L("Data Visualization", "التمثيل البصري"), d: L("Charts that make patterns visible to everyone.", "رسوم تجعل الأنماط واضحة للجميع."), py: "matplotlib · seaborn", sec: "py-visualization" },
  { t: L("Business Insights", "رؤى الأعمال"), d: L("What we observed, possible explanations and what to check next.", "ما لاحظناه، والتفسيرات الممكنة، وما يجب التحقق منه لاحقًا."), py: "—", sec: "py-insights" },
];

/* ---------- re-render the open section when the analysis changes ---------- */
(() => {
  let last = null;
  const state = () => { const j = StoreSales.job; return j ? (j.error ? "error" : "running") : SSR() ? "ready:" + SSR().loadedAt : "empty"; };
  StoreSales.on(() => {
    const now = state(), j = StoreSales.job;
    const bar = document.getElementById("ss-progress-bar");
    if (now === "running" && last === "running" && bar) {
      const pct = j.phase === "train" ? Math.round(100 * j.pct) : 0;
      bar.style.width = pct + "%"; bar.parentElement.setAttribute("aria-valuenow", pct);
      const txt = document.getElementById("ss-progress-text");
      if (txt) txt.textContent = j.phase === "train" ? L(`Reading train.csv… ${pct}%`, `جارٍ قراءة train.csv… ${pct}%`) : L("Reading stores.csv…", "جارٍ قراءة stores.csv…");
      return;
    }
    if (now === last) return;
    last = now;
    const s = sectionById(Lec.current);
    if (!s) return;
    const y = window.scrollY, root = $("#section-root");
    CodeRefs.clear(); s.render(root, s); window.scrollTo(0, y);
    const focusEl = root.querySelector("#ss-status");
    if (focusEl && now !== "running") focusEl.focus({ preventScroll: true });
  });
})();

/* ---------- the file loader (Section 2) ---------- */
function loaderHTML() {
  const R = SSR(), j = StoreSales.job, running = j && !j.error;
  return `<div class="card ss-loader">
    <div class="ss-files">
      <label class="ss-file" for="ss-train"><span class="ss-file-k">${ICON.file}<code>train.csv</code></span><span class="small muted">${L("sales records", "سجلات المبيعات")}</span><input type="file" id="ss-train" accept=".csv,text/csv" ${running ? "disabled" : ""}></label>
      <label class="ss-file" for="ss-stores"><span class="ss-file-k">${ICON.file}<code>stores.csv</code></span><span class="small muted">${L("store information", "معلومات المتاجر")}</span><input type="file" id="ss-stores" accept=".csv,text/csv" ${running ? "disabled" : ""}></label>
    </div>
    <div class="row mt-2">
      <button type="button" class="btn btn-primary" id="ss-run" disabled>${ICON.play}<span>${L("Analyse the files", "حلّل الملفات")}</span></button>
      ${running ? `<button type="button" class="btn" id="ss-cancel">${ICON.x}<span>${L("Cancel", "إلغاء")}</span></button>` : ""}
      ${R && !running ? `<button type="button" class="btn" id="ss-clear">${ICON.x}<span>${L("Forget these results", "انسَ هذه النتائج")}</span></button>` : ""}
    </div>
    <div id="ss-status" tabindex="-1" class="mt-2" role="status" aria-live="polite">
      ${running ? `<div class="ss-progress"><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${L("Analysis progress", "تقدّم التحليل")}"><span id="ss-progress-bar" style="width:0%"></span></div><p class="small muted mt-1 mb-0" id="ss-progress-text">${L("Reading stores.csv…", "جارٍ قراءة stores.csv…")}</p></div>` : ""}
      ${j && j.error ? callout("danger", L("The files could not be analysed", "تعذّر تحليل الملفات"), `<p class="mb-0">${esc(j.error)}</p>`) : ""}
      ${R && !running ? callout("tip", L("Results ready", "النتائج جاهزة"), `<p class="mb-0">${L(`Analysed <strong>${esc(R.train.name)}</strong> (${fmtInt(R.train.rows)} rows) and <strong>${esc(R.stores.name)}</strong> (${fmtInt(R.stores.rows)} rows) on ${new Date(R.loadedAt).toLocaleString("en-GB")}. Every section from 3 to 15 now shows results from these files.${R.saved ? " The summary is remembered in this browser." : ""}`, `حُلِّل <strong>${esc(R.train.name)}</strong> (${fmtInt(R.train.rows)} صف) و <strong>${esc(R.stores.name)}</strong> (${fmtInt(R.stores.rows)} صف) في ${new Date(R.loadedAt).toLocaleString("en-GB")}. كل قسم من 3 إلى 15 يعرض الآن نتائج من هذه الملفات.${R.saved ? " ويُحفظ الملخص في هذا المتصفح." : ""}`)}</p>`) : ""}
    </div>
    <p class="small muted mt-2 mb-0">${ICON.shield.replace("<svg", '<svg width="14" height="14" style="vertical-align:-2px"')} ${L("Your files stay on your computer: the browser reads them locally and keeps only a small summary (totals, counts and a 5,000-row sample for one chart). train.csv is large (about 120 MB), so use a desktop or laptop browser; reading it takes a few seconds.", "تبقى ملفاتك على جهازك: يقرؤها المتصفح محليًا ولا يحتفظ إلا بملخص صغير (مجاميع وأعداد وعينة من 5,000 صف لرسم واحد). الملف train.csv كبير (نحو 120 ميغابايت)، لذا استخدم متصفحًا على حاسوب مكتبي أو محمول؛ تستغرق قراءته بضع ثوانٍ.")}</p>
  </div>`;
}
function bindLoader(root) {
  const tr = root.querySelector("#ss-train"), st = root.querySelector("#ss-stores"), run = root.querySelector("#ss-run");
  if (!tr) return;
  const ready = () => { run.disabled = !(tr.files.length && st.files.length) || !!(StoreSales.job && !StoreSales.job.error); };
  // a single picker can hold both files: sort them by name
  const pick = input => () => {
    if (input.files.length > 1) return;
    const name = (input.files[0] || {}).name || "";
    if (input === tr && /^stores/i.test(name)) { st.files = tr.files; tr.value = ""; }
    if (input === st && /^train/i.test(name)) { tr.files = st.files; st.value = ""; }
    ready();
  };
  tr.addEventListener("change", pick(tr)); st.addEventListener("change", pick(st));
  run.addEventListener("click", () => { StoreSales.dismissError(); StoreSales.run(tr.files[0], st.files[0]); });
  const cancel = root.querySelector("#ss-cancel"); if (cancel) cancel.addEventListener("click", () => StoreSales.cancel());
  const clear = root.querySelector("#ss-clear"); if (clear) clear.addEventListener("click", () => StoreSales.clear());
}

/* =====================================================================
   01 — Introduction to data analysis
   ===================================================================== */
Lec.add({
  id: "py-intro", num: 1, aliases: ["python-data-analysis", "part-2"],
  title: { en: "Introduction to Data Analysis with Python", ar: "مقدمة في تحليل البيانات باستخدام بايثون" },
  short: { en: "Intro to data analysis", ar: "مقدمة في تحليل البيانات" },
  summary: { en: "Raw data → information → insight, and the seven stages of an analysis.", ar: "البيانات الخام ← المعلومات ← الرؤية، والمراحل السبع للتحليل." },
  render(root) {
    const st = getState("py-intro", { stage: 0 }), stages = PY_STAGES(), cur = stages[st.stage];
    root.innerHTML = lesson(this, {
      simple: L("<strong>Data analysis</strong> means examining data carefully to answer a question: what happened, why it might have happened, and what we should check or do next. In Part 2 we analyse the real sales of a grocery chain with <strong>Python</strong>, step by step, from the raw files to evidence a manager can use.",
        "<strong>تحليل البيانات</strong> يعني فحص البيانات بعناية للإجابة عن سؤال: ماذا حدث، ولماذا ربما حدث، وما الذي ينبغي التحقق منه أو فعله بعد ذلك. في الجزء الثاني نحلّل المبيعات الحقيقية لسلسلة متاجر بقالة باستخدام <strong>بايثون</strong>، خطوة بخطوة، من الملفات الخام حتى أدلة يستطيع المدير استخدامها."),
      why: [
        L("Decisions based on evidence are easier to explain, check and improve than decisions based on impressions.", "القرارات المبنية على الأدلة أسهل في الشرح والتحقق والتحسين من القرارات المبنية على الانطباعات."),
        L("Real business data is large and imperfect: millions of rows, gaps and surprises. A clear process keeps the analysis honest.", "بيانات الأعمال الحقيقية كبيرة وغير مثالية: ملايين الصفوف وفجوات ومفاجآت. والعملية الواضحة تُبقي التحليل أمينًا."),
        L("<strong>Python</strong> (with the pandas library) handles millions of rows on an ordinary laptop, is free, and every step is written down — so anyone can re-run and check it.", "<strong>بايثون</strong> (مع مكتبة pandas) يتعامل مع ملايين الصفوف على حاسوب عادي، وهو مجاني، وكل خطوة مكتوبة — فيستطيع أي شخص إعادة تشغيلها والتحقق منها."),
      ],
      stepsTitle: L("Raw data, information and insight", "البيانات الخام والمعلومات والرؤية"),
      steps: [
        { t: L("Raw data", "البيانات الخام"), d: L("Individual records exactly as they were collected. On their own they answer almost nothing.", "سجلات منفردة كما جُمعت تمامًا. وهي وحدها لا تجيب عن شيء تقريبًا."), ex: L("One row of train.csv: a date, a store number, a product family, its sales and the number of items on promotion.", "صف واحد من train.csv: تاريخ، ورقم متجر، وفئة منتجات، ومبيعاتها، وعدد الأصناف المعروضة بتخفيض.") },
        { t: L("Information", "المعلومات"), d: L("Data that has been organised and summarised so a person can read it.", "بيانات نُظّمت ولُخّصت بحيث يستطيع الشخص قراءتها."), ex: L("Total sales per store per month; the 10 best-selling product families.", "إجمالي المبيعات لكل متجر في كل شهر؛ أعلى 10 فئات منتجات مبيعًا.") },
        { t: L("Business insight", "رؤية الأعمال"), d: L("A finding that matters for a decision, with its evidence and its limits stated.", "نتيجة مهمة لقرار ما، مع ذكر أدلتها وحدودها."), ex: L("“Per store and per day, type A stores sell the most. Before opening a new store, check whether this holds after accounting for city size.”", "«لكل متجر ولكل يوم، تبيع متاجر النوع A أكثر من غيرها. وقبل افتتاح متجر جديد، تحقّق مما إذا كان ذلك صحيحًا بعد مراعاة حجم المدينة.»") },
      ],
      extra: `<section class="block"><h2>${L("The seven stages of an analysis project — click each stage", "المراحل السبع لمشروع التحليل — انقر كل مرحلة")}</h2>
        <div class="pipeline" role="group" aria-label="${L("Analysis stages", "مراحل التحليل")}">${stages.map((s, i) => `${i ? `<span class="flow-arrow" aria-hidden="true">${ICON.arrowR}</span>` : ""}<button type="button" class="flow-step" data-stage="${i}" aria-pressed="${i === st.stage}"><span class="n">${pad2(i + 1)}</span><span class="t">${s.t}</span></button>`).join("")}</div>
        <div class="card mt-2" aria-live="polite"><h3 class="mt-0">${pad2(st.stage + 1)} · ${cur.t}</h3><p>${cur.d}</p><p class="small mb-0"><span class="muted">${L("Main Python tools", "أدوات بايثون الرئيسية")}:</span> <code>${esc(cur.py)}</code> · ${sectionLink(cur.sec, L("Go to the section", "انتقل إلى القسم"))}</p></div></section>
        <section class="block"><h2>${L("The business scenario", "سيناريو الأعمال")}</h2>
        <div class="card"><p>${L("The data comes from <strong>Corporación Favorita</strong>, a large grocery retailer in Ecuador, published on Kaggle. Imagine its management asks the analytics team: <em>“How are our stores performing, and where should we look more closely?”</em> To answer, we turn the request into concrete questions:", "تأتي البيانات من <strong>Corporación Favorita</strong>، وهي سلسلة بقالة كبيرة في الإكوادور، ونُشرت على Kaggle. تخيّل أن إدارتها تسأل فريق التحليل: <em>«كيف أداء متاجرنا، وأين يجب أن ننظر عن قرب؟»</em> وللإجابة نحوّل الطلب إلى أسئلة محددة:")}</p>
        <ol class="py-hyp">${[
          L("Which stores and product families bring in the most sales?", "ما المتاجر وفئات المنتجات التي تحقق أعلى المبيعات؟"),
          L("Are sales growing over time, and is there a seasonal pattern?", "هل تنمو المبيعات مع الوقت، وهل هناك نمط موسمي؟"),
          L("Do some cities or store types sell more — even after a fair comparison?", "هل تبيع بعض المدن أو أنواع المتاجر أكثر — حتى بعد مقارنة عادلة؟"),
          L("Are records with more items on promotion associated with higher sales?", "هل ترتبط السجلات التي فيها أصناف أكثر بتخفيض بمبيعات أعلى؟"),
          L("Are there unusual values that need checking before anyone relies on the numbers?", "هل توجد قيم غير معتادة تحتاج إلى فحص قبل أن يعتمد أحد على الأرقام؟"),
        ].map(q => `<li>${q}</li>`).join("")}</ol>
        ${callout("warn", L("These are hypotheses to explore, not conclusions", "هذه فرضيات للاستكشاف، وليست استنتاجات"), `<p class="mb-0">${L("We do not know the answers yet. Each question is something the data may or may not support. A good analyst stays open to “no”, “it depends” and “we need more data”.", "لا نعرف الإجابات بعد. كل سؤال قد تدعمه البيانات وقد لا تدعمه. والمحلل الجيد يبقى منفتحًا على «لا» و«يعتمد» و«نحتاج إلى مزيد من البيانات».")}</p>`)}</div></section>`,
      remember: L("Data → information → insight. Every insight must say what was observed, how it was measured, and what still needs checking.", "بيانات ← معلومات ← رؤية. وكل رؤية يجب أن تذكر ما لوحظ، وكيف قيس، وما الذي لا يزال يحتاج إلى تحقق."),
      quiz: { q: L("Which of these is a business insight rather than raw data or information?", "أيٌّ مما يلي رؤية أعمال وليس بيانات خامًا أو معلومات؟"), options: [
        { t: L("A single row: one store, one product family, one day and its sales", "صف واحد: متجر واحد وفئة منتجات واحدة ويوم واحد ومبيعاته"), why: L("That is a single record — raw data.", "هذا سجل واحد — بيانات خام.") },
        { t: L("A table of total sales per month", "جدول بإجمالي المبيعات لكل شهر"), why: L("That is information: organised, but not yet interpreted for a decision.", "هذه معلومات: منظمة، لكنها لم تُفسَّر بعد من أجل قرار.") },
        { t: L("“If weekend sales are higher in most stores, weekend staffing should be reviewed — after checking the effect of holidays.”", "«إذا كانت مبيعات نهاية الأسبوع أعلى في معظم المتاجر، فيجب مراجعة توزيع الموظفين في نهاية الأسبوع — بعد التحقق من أثر العطل.»"), ok: true, why: L("It links a finding to a decision and states what to check.", "تربط نتيجة بقرار وتذكر ما يجب التحقق منه.") }] },
    });
    root.querySelectorAll("[data-stage]").forEach(b => b.addEventListener("click", () => { st.stage = +b.dataset.stage; this.render(root); root.querySelector(`[data-stage="${st.stage}"]`).focus(); }));
  },
});

/* =====================================================================
   02 — Understanding the Kaggle dataset (+ the file loader)
   ===================================================================== */
const TRAIN_COLS = () => [
  ["id", "int64", L("Row number of the record.", "رقم الصف للسجل."), L("Identifies a row; not used in calculations.", "يميّز الصف؛ لا يُستخدم في الحسابات.")],
  ["date", L("object (text) → datetime64", "object (نص) ← datetime64"), L("The day the sales happened (YYYY-MM-DD).", "يوم حدوث المبيعات (YYYY-MM-DD).")
    , L("Time analysis: days, months, years, weekdays.", "تحليل الزمن: الأيام والأشهر والسنوات وأيام الأسبوع.")],
  ["store_nbr", "int64", L("The store that made the sales.", "المتجر الذي حقق المبيعات."), L("The key that links to stores.csv.", "المفتاح الذي يربط بالملف stores.csv.")],
  ["family", L("object (text)", "object (نص)"), L("Product family, e.g. GROCERY I, BEVERAGES.", "فئة المنتجات، مثل GROCERY I و BEVERAGES."), L("Compare product groups.", "مقارنة مجموعات المنتجات.")],
  ["sales", "float64", L("Total sales of that family in that store on that day. Can have decimals (some products are sold by weight).", "إجمالي مبيعات تلك الفئة في ذلك المتجر في ذلك اليوم. قد تحوي كسورًا (بعض المنتجات تُباع بالوزن)."), L("The main measure we add up and average.", "المقياس الرئيسي الذي نجمعه ونحسب متوسطه.")],
  ["onpromotion", "int64", L("How many items in that family were on promotion in that store on that day.", "عدد الأصناف في تلك الفئة التي كانت بتخفيض في ذلك المتجر في ذلك اليوم."), L("Explore the link between promotions and sales.", "استكشاف العلاقة بين التخفيضات والمبيعات.")],
];
const STORE_COLS = () => [
  ["store_nbr", "int64", L("Store number — one row per store.", "رقم المتجر — صف واحد لكل متجر."), L("The key used for merging.", "المفتاح المستخدم في الدمج.")],
  ["city", L("object (text)", "object (نص)"), L("City where the store is located.", "المدينة التي يقع فيها المتجر."), L("Compare cities.", "مقارنة المدن.")],
  ["state", L("object (text)", "object (نص)"), L("Province (state) of the city.", "المقاطعة (الولاية) التي تتبعها المدينة."), L("Regional comparisons.", "مقارنات إقليمية.")],
  ["type", L("object (text)", "object (نص)"), L("Store type, a letter code (A–E) defined by the company.", "نوع المتجر، رمز بحرف (A–E) تحدده الشركة."), L("Compare store formats.", "مقارنة أشكال المتاجر.")],
  ["cluster", "int64", L("A grouping of similar stores, defined by the company.", "تجميع للمتاجر المتشابهة تحدده الشركة."), L("Compare groups of similar stores.", "مقارنة مجموعات المتاجر المتشابهة.")],
];
const colTable = rows => miniTable([L("Column", "العمود"), L("Expected type", "النوع المتوقع"), L("Meaning", "المعنى"), L("How we use it", "كيف نستخدمه")], rows.map(r => [`<code>${r[0]}</code>`, `<code>${r[1]}</code>`, r[2], r[3]]));

Lec.add({
  id: "py-dataset", num: 2, aliases: ["kaggle-dataset", "store-sales-data"],
  title: { en: "Understanding the Kaggle Store Sales Dataset", ar: "فهم مجموعة بيانات Store Sales من Kaggle" },
  short: { en: "The Kaggle dataset", ar: "مجموعة بيانات Kaggle" },
  summary: { en: "train.csv and stores.csv, what each column means, and how to get the files.", ar: "الملفان train.csv و stores.csv، ومعنى كل عمود، وكيف تحصل على الملفين." },
  render(root) {
    const R = SSR();
    const check = (which, req) => { const found = R[which].cols; return miniTable([L("Expected column", "العمود المتوقع"), L("Found in your file", "موجود في ملفك")], req.map(c => [`<code>${c}</code>`, found.includes(c) ? `<span class="badge success">✓ ${L("yes", "نعم")}</span>` : `<span class="badge danger">✗ ${L("missing", "مفقود")}</span>`]).concat(found.filter(c => !req.includes(c)).map(c => [`<code>${esc(c)}</code>`, `<span class="badge">${L("extra column", "عمود إضافي")}</span>`]))); };
    root.innerHTML = lesson(this, {
      simple: L(`We use two files from the Kaggle competition <a href="${KAGGLE_URL}" target="_blank" rel="noopener">Store Sales — Time Series Forecasting</a>. <code>train.csv</code> holds the <strong>sales records</strong> — one row for each store, date and product family. <code>stores.csv</code> holds <strong>store information</strong> — one row for each store.`,
        `نستخدم ملفين من مسابقة Kaggle <a href="${KAGGLE_URL}" target="_blank" rel="noopener">Store Sales — Time Series Forecasting</a>. يحتوي <code>train.csv</code> على <strong>سجلات المبيعات</strong> — صف لكل متجر وتاريخ وفئة منتجات. ويحتوي <code>stores.csv</code> على <strong>معلومات المتاجر</strong> — صف لكل متجر.`),
      why: [
        L("You cannot analyse a column correctly until you know what one row represents.", "لا يمكنك تحليل عمود بشكل صحيح قبل أن تعرف ماذا يمثّل الصف الواحد."),
        L("Knowing which column links the two files (<code>store_nbr</code>) is what makes the merge in Section 6 possible.", "معرفة العمود الذي يربط الملفين (<code>store_nbr</code>) هي ما يجعل الدمج في القسم 6 ممكنًا."),
      ],
      stepsTitle: L("Two kinds of record", "نوعان من السجلات"),
      steps: [
        { t: L("A sales record (train.csv)", "سجل مبيعات (train.csv)"), d: L("Describes an <strong>event</strong>: how much one product family sold in one store on one day. The same store appears on thousands of rows — once per family, per day.", "يصف <strong>حدثًا</strong>: كم باعت فئة منتجات واحدة في متجر واحد في يوم واحد. ويظهر المتجر نفسه في آلاف الصفوف — مرة لكل فئة في كل يوم."), ex: "date · store_nbr · family → sales, onpromotion" },
        { t: L("A store record (stores.csv)", "سجل متجر (stores.csv)"), d: L("Describes a <strong>thing</strong>: where a store is and what kind of store it is. Each store appears once.", "يصف <strong>شيئًا</strong>: أين يقع المتجر وما نوعه. ويظهر كل متجر مرة واحدة."), ex: "store_nbr → city, state, type, cluster" },
        { t: L("Why the row counts differ so much", "لماذا تختلف أعداد الصفوف كثيرًا"), d: L("Rows in train ≈ number of stores × number of days × number of product families. A few dozen stores, several years of days and about thirty families quickly give millions of rows.", "صفوف train ≈ عدد المتاجر × عدد الأيام × عدد فئات المنتجات. بضع عشرات من المتاجر وسنوات من الأيام ونحو ثلاثين فئة تعطي سريعًا ملايين الصفوف."), ex: L("54 stores × 1,684 days × 33 families = 3,000,888 (the size reported for the Kaggle file)", "54 متجرًا × 1,684 يومًا × 33 فئة = 3,000,888 (الحجم المذكور لملف Kaggle)") },
      ],
      extra: `<section class="block"><h2>${L("Columns of train.csv", "أعمدة train.csv")}</h2>${colTable(TRAIN_COLS())}
        <h2 class="mt-3">${L("Columns of stores.csv", "أعمدة stores.csv")}</h2>${colTable(STORE_COLS())}
        <p class="small muted">${L("These are the <em>expected</em> columns and types. Always check the actual file: a different version or a re-saved file can differ. The check below does this for your copy.", "هذه هي الأعمدة والأنواع <em>المتوقعة</em>. افحص الملف الفعلي دائمًا: قد تختلف نسخة أخرى أو ملف أعيد حفظه. والفحص أدناه يفعل ذلك لنسختك.")}</p></section>
        <section class="block"><h2>${L("Get the files from Kaggle", "احصل على الملفات من Kaggle")}</h2><div class="grid grid-2">
          <div class="card"><h3 class="mt-0">${L("1 · Download", "1 · التنزيل")}</h3><ol class="py-steps">
            <li>${L("Sign in to <strong>kaggle.com</strong> (creating an account is free).", "سجّل الدخول إلى <strong>kaggle.com</strong> (إنشاء الحساب مجاني).")}</li>
            <li>${L(`Open the <a href="${KAGGLE_URL}" target="_blank" rel="noopener">competition's Data page</a>.`, `افتح <a href="${KAGGLE_URL}" target="_blank" rel="noopener">صفحة البيانات في المسابقة</a>.`)}</li>
            <li>${L("Accept the competition rules if Kaggle asks you to (needed before downloading).", "اقبل قواعد المسابقة إذا طلب Kaggle ذلك (مطلوب قبل التنزيل).")}</li>
            <li>${L("Download <code>train.csv</code> and <code>stores.csv</code> — or “Download All” and unzip it. The other files (oil, holidays, transactions, test) are not needed for this lesson.", "نزّل <code>train.csv</code> و <code>stores.csv</code> — أو «Download All» ثم فك الضغط. الملفات الأخرى (oil و holidays و transactions و test) غير مطلوبة لهذا الدرس.")}</li></ol></div>
          <div class="card"><h3 class="mt-0">${L("2 · Upload to Google Colab", "2 · الرفع إلى Google Colab")}</h3><ol class="py-steps">
            <li>${L("Open <strong>colab.research.google.com</strong> and create a new notebook — or upload our ready notebook (Section 3).", "افتح <strong>colab.research.google.com</strong> وأنشئ دفترًا جديدًا — أو ارفع دفترنا الجاهز (القسم 3).")}</li>
            <li>${L("Click the folder icon (Files) on the left and drag both CSV files into it, or run the cell below.", "انقر أيقونة المجلد (Files) على اليسار واسحب ملفي CSV إليه، أو شغّل الخلية أدناه.")}</li>
            <li>${L("Uploaded files are deleted when the Colab session ends. For repeated work, store them in Google Drive and read them from there.", "تُحذف الملفات المرفوعة عند انتهاء جلسة Colab. وللعمل المتكرر، احفظها في Google Drive واقرأها من هناك.")}</li></ol>${pyCode("colab_upload")}</div>
        </div></section>
        <section class="block"><h2>${L("Knowledge check", "تحقّق من فهمك")}</h2>${answer(L("Why can train.csv contain millions of rows while stores.csv contains only a few dozen? Should we delete rows so the two files match?", "لماذا يحتوي train.csv على ملايين الصفوف بينما يحتوي stores.csv على بضع عشرات فقط؟ وهل يجب أن نحذف صفوفًا ليتطابق الملفان؟"),
          `<p class="mb-0">${L("They describe different things. Each store has one row in stores.csv, but one row per product family per day in train.csv. The difference is expected — deleting rows would throw away real sales. Instead, we <em>merge</em>: each sales row receives the information of its store (Section 6).", "يصفان أشياء مختلفة. لكل متجر صف واحد في stores.csv، لكن له صفًا لكل فئة منتجات في كل يوم في train.csv. الفرق متوقع — وحذف الصفوف يعني رمي مبيعات حقيقية. بدلًا من ذلك نقوم بـ<em>الدمج</em>: يتلقى كل صف مبيعات معلومات متجره (القسم 6).")}</p>`)}</section>`,
      seeTitle: L("Load your copies of the files", "حمّل نسختك من الملفات"), codeHint: false,
      seeNote: L("Choose the two CSV files you downloaded. The page checks the actual column names and then computes the results shown in Sections 3–15.", "اختر ملفي CSV اللذين نزّلتهما. تفحص الصفحة أسماء الأعمدة الفعلية ثم تحسب النتائج المعروضة في الأقسام 3–15."),
      see: `${loaderHTML()}${R ? `<div class="grid grid-2 mt-3"><div><h3>${esc(R.train.name)}</h3>${check("train", StoreSales.REQUIRED.train)}</div><div><h3>${esc(R.stores.name)}</h3>${check("stores", StoreSales.REQUIRED.stores)}</div></div>` : ""}`,
      results: R ? `<p class="mb-0">${L(`Your train file has <strong>${fmtInt(R.train.rows)}</strong> sales records in ${R.train.cols.length} columns; your stores file has <strong>${fmtInt(R.stores.rows)}</strong> store records in ${R.stores.cols.length} columns. All required columns are present.`, `يحتوي ملف train لديك على <strong>${fmtInt(R.train.rows)}</strong> سجل مبيعات في ${R.train.cols.length} أعمدة؛ ويحتوي ملف stores على <strong>${fmtInt(R.stores.rows)}</strong> سجل متجر في ${R.stores.cols.length} أعمدة. وجميع الأعمدة المطلوبة موجودة.`)}</p>`
        : pending(L("column check", "فحص الأعمدة")),
      remember: L("One row of train.csv = one store × one date × one product family. One row of stores.csv = one store. store_nbr links them.", "صف واحد في train.csv = متجر واحد × تاريخ واحد × فئة منتجات واحدة. وصف واحد في stores.csv = متجر واحد. ويربط بينهما store_nbr."),
      quiz: { q: L("Which column links train.csv to stores.csv?", "أي عمود يربط train.csv بالملف stores.csv؟"), options: [
        { t: "id", why: L("id only numbers the rows of train.csv.", "id يرقّم صفوف train.csv فقط.") },
        { t: "store_nbr", ok: true, why: L("Both files have store_nbr, and it identifies the store.", "كلا الملفين فيه store_nbr، وهو يحدد المتجر.") },
        { t: "cluster", why: L("cluster exists only in stores.csv.", "cluster موجود في stores.csv فقط.") }] },
    });
    bindLoader(root);
  },
});

/* =====================================================================
   03 — Setting up the Python environment
   ===================================================================== */
Lec.add({
  id: "py-setup", num: 3, aliases: ["colab", "python-setup"],
  title: { en: "Setting Up the Python Environment", ar: "تجهيز بيئة بايثون" },
  short: { en: "Python setup & loading", ar: "تجهيز بايثون والتحميل" },
  summary: { en: "Libraries, Google Colab, loading the CSV files and reading their shape.", ar: "المكتبات وGoogle Colab وتحميل ملفات CSV وقراءة أبعادها." },
  render(root) {
    root.innerHTML = lesson(this, {
      simple: L("We write the analysis in <strong>Google Colab</strong>, a free Python notebook that runs in the browser — nothing to install. First we import the libraries, then we load the two CSV files into <strong>DataFrames</strong> (tables in memory) and check their size.",
        "نكتب التحليل في <strong>Google Colab</strong>، وهو دفتر بايثون مجاني يعمل في المتصفح — دون تثبيت أي شيء. أولًا نستورد المكتبات، ثم نحمّل ملفي CSV في <strong>DataFrames</strong> (جداول في الذاكرة) ونفحص حجمهما."),
      why: [L("Every later step uses these libraries and these two tables.", "كل خطوة لاحقة تستخدم هذه المكتبات وهذين الجدولين."), L("Checking the shape immediately catches a wrong or truncated file.", "فحص الأبعاد فورًا يكشف ملفًا خاطئًا أو مقطوعًا.")],
      extra: `<section class="block"><div class="card py-notebook"><div><h3 class="mt-0">${ICON.notebook.replace("<svg", '<svg width="20" height="20" style="vertical-align:-4px"')} ${L("Ready-made notebook", "دفتر جاهز")}</h3>
          <p class="mb-0 small">${L("All the code of Sections 2–13, in order, in one notebook. In Colab choose <em>File → Upload notebook</em>, then upload the two CSV files and run the cells from top to bottom.", "كل كود الأقسام 2–13، بالترتيب، في دفتر واحد. في Colab اختر <em>File → Upload notebook</em>، ثم ارفع ملفي CSV وشغّل الخلايا من الأعلى إلى الأسفل.")}</p></div>
          <a class="btn btn-primary" href="notebooks/06_store_sales_analysis.ipynb" download="06_store_sales_analysis.ipynb">${ICON.download}<span>${L("Download the notebook (.ipynb)", "نزّل الدفتر (.ipynb)")}</span></a></div></section>
        <section class="block"><h2>${L("Step 1 — Import the libraries", "الخطوة 1 — استيراد المكتبات")}</h2>${concept({
          title: L("Libraries and settings", "المكتبات والإعدادات"),
          what: L("A <strong>library</strong> is ready-made code you load with <code>import</code>. Each one does one job well.", "<strong>المكتبة</strong> كود جاهز تحمّله باستخدام <code>import</code>. وكل مكتبة تؤدي مهمة واحدة بإتقان."),
          why: L("pandas reads and transforms tables, NumPy does fast maths, Matplotlib and seaborn draw charts.", "pandas تقرأ الجداول وتحوّلها، وNumPy تجري الحسابات بسرعة، وMatplotlib وseaborn ترسمان المخططات."),
          code: ["setup"],
          lines: [
            ["import pandas as pd", L("Tables (DataFrames): reading CSV files, filtering, grouping, merging. <code>pd</code> is the usual short name.", "الجداول (DataFrames): قراءة ملفات CSV والتصفية والتجميع والدمج. و<code>pd</code> هو الاسم المختصر المعتاد.")],
            ["import numpy as np", L("Fast numerical maths on whole columns; pandas is built on it.", "رياضيات عددية سريعة على أعمدة كاملة؛ وpandas مبنية عليها.")],
            ["import matplotlib.pyplot as plt", L("The basic plotting library: titles, axes labels, showing a figure.", "مكتبة الرسم الأساسية: العناوين وتسميات المحاور وعرض الشكل.")],
            ["import seaborn as sns", L("Statistical charts built on Matplotlib with less code.", "رسوم إحصائية مبنية على Matplotlib بكود أقل.")],
            ["from IPython.display import display", L("Shows a DataFrame as a neat table inside the notebook.", "يعرض DataFrame كجدول مرتب داخل الدفتر.")],
            ['sns.set_theme(style="whitegrid")', L("A clean style with light grid lines for every chart.", "نمط نظيف بخطوط شبكة خفيفة لكل رسم.")],
            ['plt.rcParams["figure.figsize"] = (12, 6)', L("Default chart size: 12 × 6 inches, wide enough for monthly data.", "الحجم الافتراضي للرسم: 12 × 6 بوصة، عريض بما يكفي للبيانات الشهرية.")],
          ],
          expect: `<p>${L("Nothing is printed — that is success. An error here means a library is missing.", "لا يُطبع شيء — وهذا يعني النجاح. ووجود خطأ هنا يعني أن مكتبة ما مفقودة.")}</p>`,
          mistakes: [
            ["ModuleNotFoundError: No module named 'seaborn'", L("On your own computer run <code>pip install pandas numpy matplotlib seaborn</code>. In Colab these are already installed.", "على حاسوبك شغّل <code>pip install pandas numpy matplotlib seaborn</code>. وفي Colab هي مثبتة مسبقًا.")],
            ["NameError: name 'pd' is not defined", L("The import cell was not run (or the session restarted). Run the cells from the top.", "لم تُشغَّل خلية الاستيراد (أو أُعيد تشغيل الجلسة). شغّل الخلايا من الأعلى.")],
          ],
          business: L("A shared, standard setup means colleagues get identical charts and numbers from the same notebook.", "الإعداد الموحد يعني أن الزملاء يحصلون على رسوم وأرقام متطابقة من الدفتر نفسه."),
        })}</section>
        <section class="block"><h2>${L("Step 2 — Check the files, then load them", "الخطوة 2 — افحص الملفات ثم حمّلها")}</h2>${concept({
          title: L("Loading CSV files into DataFrames", "تحميل ملفات CSV في DataFrames"),
          what: L("<code>pd.read_csv()</code> reads a comma-separated file into a DataFrame. The optional first cell checks that the files exist and have the expected columns, with clear error messages.", "تقرأ <code>pd.read_csv()</code> ملفًا مفصولًا بفواصل إلى DataFrame. والخلية الأولى الاختيارية تتحقق من وجود الملفات ومن أعمدتها المتوقعة، مع رسائل خطأ واضحة."),
          why: L("All analysis happens on these DataFrames. A clear error now saves confusion later.", "كل التحليل يجري على هذه الجداول. والخطأ الواضح الآن يوفّر الحيرة لاحقًا."),
          example: L("Example from a previous execution on the Kaggle files (your numbers depend on the files you load): <code>Train shape: (3000888, 6)</code> and <code>Stores shape: (54, 5)</code>.", "مثال من تشغيل سابق على ملفات Kaggle (أرقامك تعتمد على الملفات التي تحمّلها): <code>Train shape: (3000888, 6)</code> و <code>Stores shape: (54, 5)</code>."),
          code: ["check_files", "load"],
          lines: [
            ["os.path.exists(file_name)", L("True if the file is in the current folder. If not, we stop with a message that says what to do.", "تعيد True إذا كان الملف في المجلد الحالي. وإلا نتوقف برسالة تشرح ما يجب فعله.")],
            ["pd.read_csv(file_name, nrows=0)", L("Reads only the header row — a fast way to check column names without loading millions of rows.", "تقرأ صف العناوين فقط — طريقة سريعة لفحص أسماء الأعمدة دون تحميل ملايين الصفوف.")],
            ['train = pd.read_csv("train.csv")', L("Loads all sales records into a DataFrame called <code>train</code>.", "تحمّل كل سجلات المبيعات في DataFrame اسمه <code>train</code>.")],
            ['stores = pd.read_csv("stores.csv")', L("Loads the store information into <code>stores</code>.", "تحمّل معلومات المتاجر في <code>stores</code>.")],
            ['print("Train shape:", train.shape)', L("<code>shape</code> is a pair <code>(rows, columns)</code>. It is an attribute, so there are no brackets after it.", "<code>shape</code> زوج <code>(صفوف، أعمدة)</code>. وهو خاصية، لذلك لا توجد أقواس بعده.")],
            ["display(train.head())", L("Shows the first 5 rows, so you can see real values and spot obvious problems.", "يعرض أول 5 صفوف، لترى قيمًا حقيقية وتلاحظ المشكلات الواضحة.")],
          ],
          expect: `<pre class="py-out">Train shape: (rows, 6)
Stores shape: (rows, 5)</pre><p>${L("…followed by two small tables with the first five rows of each file.", "…يليهما جدولان صغيران يعرضان أول خمسة صفوف من كل ملف.")}</p>`,
          interpret: L("The second number must match the expected number of columns (6 and 5). The first number is the row count; a very small number usually means a truncated download.", "يجب أن يطابق الرقم الثاني عدد الأعمدة المتوقع (6 و5). والرقم الأول هو عدد الصفوف؛ والرقم الصغير جدًا يعني عادةً تنزيلًا مقطوعًا."),
          mistakes: [
            ["FileNotFoundError: [Errno 2] No such file or directory: 'train.csv'", L("The file is not in the notebook's folder. Upload it again (Colab deletes files when the session ends) or give the full path.", "الملف ليس في مجلد الدفتر. ارفعه مجددًا (يحذف Colab الملفات عند انتهاء الجلسة) أو اكتب المسار الكامل.")],
            ["train.shape()", L("<code>shape</code> is not a function — write <code>train.shape</code> without brackets.", "<code>shape</code> ليست دالة — اكتب <code>train.shape</code> دون أقواس.")],
            ["MemoryError / session crashed", L("The machine ran out of memory. In Colab use <em>Runtime → Restart</em> and avoid keeping many copies of the 3-million-row table.", "نفدت ذاكرة الجهاز. في Colab استخدم <em>Runtime → Restart</em> وتجنب الاحتفاظ بنسخ كثيرة من الجدول ذي الثلاثة ملايين صف.")],
          ],
          business: L("Knowing the size of the data tells you how much history you have and how much computing it will need.", "معرفة حجم البيانات تخبرك بمقدار التاريخ المتاح لديك وبمقدار الحوسبة التي ستحتاجها."),
        })}</section>`,
      seeTitle: L("Results from your files: shape and first rows", "النتائج من ملفاتك: الأبعاد وأول الصفوف"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the shape and first rows of each file", "أبعاد كل ملف وأول صفوفه"), R => `<div class="stat-grid">
          ${stat("train.shape", `(${fmtInt(R.train.rows)}, ${R.train.cols.length})`, L("(rows, columns)", "(صفوف، أعمدة)"), pySpec("load", L("Shape of train", "أبعاد train"), `(${R.train.rows}, ${R.train.cols.length})`))}
          ${stat("stores.shape", `(${fmtInt(R.stores.rows)}, ${R.stores.cols.length})`, L("(rows, columns)", "(صفوف، أعمدة)"), pySpec("load", L("Shape of stores", "أبعاد stores"), `(${R.stores.rows}, ${R.stores.cols.length})`))}
          ${stat(L("File size", "حجم الملف"), fmtBytes(R.train.size), esc(R.train.name))}</div>
        <h3 class="mt-3">train.head()</h3>${withCode("py-head-train", pySpec("load", "train.head()", L("the table", "الجدول")), headTable(R, "train"))}
        <h3 class="mt-3">stores.head()</h3>${withCode("py-head-stores", pySpec("load", "stores.head()", L("the table", "الجدول")), headTable(R, "stores"))}
        ${R.train.badLines || R.stores.badLines ? callout("warn", L("Lines with the wrong number of fields", "أسطر بعدد حقول خاطئ"), `<p class="mb-0">${L(`${fmtInt(R.train.badLines + R.stores.badLines)} line(s) did not have the expected number of fields and were skipped here. pandas would stop with a ParserError on such lines — open the file and check them.`, `${fmtInt(R.train.badLines + R.stores.badLines)} سطر لم تحتوِ على العدد المتوقع من الحقول وتم تخطيها هنا. وستتوقف pandas بخطأ ParserError عند هذه الأسطر — افتح الملف وافحصها.`)}</p>`) : ""}`),
      results: SSR() ? `<p class="mb-0">${L(`Shape is always <code>(rows, columns)</code>. Your sales table has ${fmtInt(SSR().train.rows)} rows and your store table ${fmtInt(SSR().stores.rows)}: very different sizes, as expected, because they describe different things.`, `الأبعاد دائمًا <code>(صفوف، أعمدة)</code>. يحتوي جدول المبيعات لديك على ${fmtInt(SSR().train.rows)} صف وجدول المتاجر على ${fmtInt(SSR().stores.rows)}: حجمان مختلفان جدًا، كما هو متوقع، لأنهما يصفان أشياء مختلفة.`)}</p>` : pending(L("shape", "الأبعاد")),
      remember: L("Import → check → load → look at shape and head() before doing anything else.", "استورد ← افحص ← حمّل ← انظر إلى الأبعاد و head() قبل أي شيء آخر."),
      quiz: { q: L("train.shape returns (3000888, 6). What does 6 mean?", "أعادت train.shape القيمة (3000888, 6). ماذا يعني الرقم 6؟"), options: [
        { t: L("6 columns", "6 أعمدة"), ok: true, why: L("shape is (rows, columns).", "shape هي (صفوف، أعمدة).") },
        { t: L("6 stores", "6 متاجر"), why: L("The number of stores is not part of shape.", "عدد المتاجر ليس جزءًا من shape.") },
        { t: L("6 missing values", "6 قيم مفقودة"), why: L("Missing values are counted with isnull().sum() (Section 5).", "تُحسب القيم المفقودة باستخدام isnull().sum() (القسم 5).") }] },
    });
  },
});

/* =====================================================================
   04 — Data exploration
   ===================================================================== */
Lec.add({
  id: "py-explore", num: 4, aliases: ["data-exploration"],
  title: { en: "Data Exploration", ar: "استكشاف البيانات" },
  short: { en: "Exploring the data", ar: "استكشاف البيانات" },
  summary: { en: "head, info, describe, shape, columns and dtypes — what each tells you.", ar: "head و info و describe و shape و columns و dtypes — ماذا يخبرك كل منها." },
  render(root) {
    const R = SSR();
    const tools = [
      ["head()", L("The first rows (5 by default)", "أول الصفوف (5 افتراضيًا)"), L("See real values and formats", "رؤية القيم والتنسيقات الحقيقية"), "DataFrame"],
      ["info()", L("Row count, each column's non-null count and type, memory", "عدد الصفوف، وعدد القيم غير الفارغة ونوع كل عمود، والذاكرة"), L("Spot missing values and wrong types", "اكتشاف القيم المفقودة والأنواع الخاطئة"), L("prints a report", "يطبع تقريرًا")],
      ["describe()", L("Summary statistics: count, mean, std, min, quartiles, max (and unique/top/freq for text with include=\"all\")", "إحصاءات موجزة: العدد والمتوسط والانحراف المعياري والحد الأدنى والأرباع والحد الأعلى (وunique/top/freq للنص مع include=\"all\")"), L("Ranges, typical values, odd extremes", "النطاقات والقيم النموذجية والقيم المتطرفة الغريبة"), "DataFrame"],
      ["shape", L("(rows, columns)", "(صفوف، أعمدة)"), L("Size check", "فحص الحجم"), "tuple"],
      ["columns", L("The column names", "أسماء الأعمدة"), L("Exact spelling before using a column", "التهجئة الدقيقة قبل استخدام عمود"), "Index"],
      ["dtypes", L("The type of each column", "نوع كل عمود"), L("Numbers stored as text? Dates as text?", "أرقام مخزنة كنص؟ تواريخ كنص؟"), "Series"],
    ];
    root.innerHTML = lesson(this, {
      simple: L("Before analysing, we <strong>look</strong>: how big is the data, what columns and types does it have, what values are typical, and does anything look strange? pandas gives us six quick tools for this.",
        "قبل التحليل <strong>ننظر</strong>: ما حجم البيانات، وما أعمدتها وأنواعها، وما القيم النموذجية، وهل يبدو شيء غريبًا؟ تمنحنا pandas ست أدوات سريعة لذلك."),
      why: [L("Most analysis mistakes come from wrong assumptions about the data, not from wrong formulas.", "معظم أخطاء التحليل تأتي من افتراضات خاطئة عن البيانات، لا من صيغ خاطئة."), L("Exploration tells you what needs cleaning (Section 5).", "الاستكشاف يخبرك بما يحتاج إلى تنظيف (القسم 5).")],
      extra: `<section class="block"><h2>${L("Six tools at a glance", "ست أدوات بلمحة")}</h2>${miniTable([L("Tool", "الأداة"), L("What it shows", "ماذا يعرض"), L("Use it to…", "استخدمه من أجل…"), L("Returns", "يعيد")], tools.map(r => [`<code>${esc(r[0])}</code>`, r[1], r[2], `<code>${r[3]}</code>`]))}
        <p class="small muted">${L("<code>head()</code>, <code>info()</code> and <code>describe()</code> are methods (with brackets); <code>shape</code>, <code>columns</code> and <code>dtypes</code> are attributes (no brackets).", "<code>head()</code> و <code>info()</code> و <code>describe()</code> دوال (بأقواس)؛ أما <code>shape</code> و <code>columns</code> و <code>dtypes</code> فخصائص (دون أقواس).")}</p></section>
        <section class="block">${concept({
          title: L("Inspecting structure and summary statistics", "فحص البنية والإحصاءات الموجزة"),
          what: L("Commands that describe the tables without changing them.", "أوامر تصف الجداول دون تغييرها."),
          why: L("To confirm the data matches what we expect (Section 2) and to find problems early.", "للتأكد من أن البيانات تطابق ما نتوقعه (القسم 2) ولاكتشاف المشكلات مبكرًا."),
          code: ["explore"],
          lines: [
            ["train.info()", L("Prints the number of entries (rows), and for each column how many values are not empty and its type.", "يطبع عدد المدخلات (الصفوف)، ولكل عمود عدد القيم غير الفارغة ونوعه.")],
            ['train.describe(include="all").T', L("Statistics for every column — numbers and text. <code>.T</code> turns it so each column becomes a row, which is easier to read.", "إحصاءات لكل عمود — أرقامًا ونصوصًا. و<code>.T</code> تقلب الجدول ليصبح كل عمود صفًا، فتسهل قراءته.")],
            ["train.columns.tolist()", L("The column names as a simple Python list.", "أسماء الأعمدة كقائمة بايثون بسيطة.")],
            ["print(train.dtypes)", L("One line per column with its type: int64 (whole numbers), float64 (decimals), object (text).", "سطر لكل عمود مع نوعه: int64 (أعداد صحيحة)، float64 (كسور)، object (نص).")],
          ],
          expect: `<pre class="py-out">&lt;class 'pandas.core.frame.DataFrame'&gt;
RangeIndex: N entries, 0 to N-1
Data columns (total 6 columns):
 #   Column       Non-Null Count  Dtype
---  ------       --------------  -----
 0   id           N non-null      int64
 1   date         N non-null      object   ← ${L("text, not yet a date", "نص، وليس تاريخًا بعد")}
 ...</pre><p>${L("In describe(): <strong>count</strong> = non-missing values; <strong>unique/top/freq</strong> (text columns) = number of different values, the most common one and how often it appears; <strong>mean/std</strong> = average and spread; <strong>min, 25%, 50%, 75%, max</strong> = the range and quartiles.", "في describe(): <strong>count</strong> = القيم غير المفقودة؛ و<strong>unique/top/freq</strong> (أعمدة النص) = عدد القيم المختلفة، والقيمة الأكثر تكرارًا وعدد مرات ظهورها؛ و<strong>mean/std</strong> = المتوسط والتشتت؛ و<strong>min و25% و50% و75% و max</strong> = النطاق والأرباع.")}</p>`,
          interpret: L("If a column's Non-Null Count is lower than the number of entries, it has missing values. If a number column shows <code>object</code>, some values are not numbers. <code>date</code> shows <code>object</code> because CSV files store dates as text — we convert it in Section 5.", "إذا كان Non-Null Count لعمود أقل من عدد المدخلات، ففيه قيم مفقودة. وإذا ظهر عمود رقمي بنوع <code>object</code>، فبعض قيمه ليست أرقامًا. ويظهر <code>date</code> بنوع <code>object</code> لأن ملفات CSV تخزّن التواريخ كنص — ونحوّله في القسم 5."),
          mistakes: [
            ["train.describe() shows no 'family' or 'date'", L("Without <code>include=\"all\"</code>, describe() only summarises number columns.", "دون <code>include=\"all\"</code>، تلخّص describe() أعمدة الأرقام فقط.")],
            ["Reading 'mean' of store_nbr or id", L("These are labels, not quantities: their mean has no business meaning.", "هذه تسميات وليست كميات: لا معنى تجاريًا لمتوسطها.")],
          ],
          business: L("A quick, documented look at the data lets you tell managers early how complete and how recent the data is.", "النظرة السريعة الموثقة إلى البيانات تتيح لك أن تخبر المديرين مبكرًا بمدى اكتمال البيانات وحداثتها."),
        })}</section>`,
      seeTitle: L("Results from your files: info() and describe()", "النتائج من ملفاتك: info() و describe()"), seeNote: LIVE_NOTE(),
      see: liveSee(L("info() and describe() for both files", "info() و describe() للملفين"), R => `
        <h3>train.info() — ${fmtInt(R.train.rows)} entries</h3>${withCode("py-info-train", pySpec("explore", "train.info()", L("the table", "الجدول")), infoTable(R.train.info))}
        <h3 class="mt-3">stores.info() — ${fmtInt(R.stores.rows)} entries</h3>${withCode("py-info-stores", pySpec("explore", "stores.info()", L("the table", "الجدول")), infoTable(R.stores.info))}
        <h3 class="mt-3">train.describe(include="all").T</h3>${withCode("py-desc-train", pySpec("explore", 'train.describe(include="all").T', L("the table", "الجدول")), describeTable(R.train.info))}
        <h3 class="mt-3">stores.describe(include="all").T</h3>${withCode("py-desc-stores", pySpec("explore", 'stores.describe(include="all").T', L("the table", "الجدول")), describeTable(R.stores.info))}
        <p class="small muted mt-1">${L("Text columns with more than 200,000 different values show “—” for unique/top/freq here.", "تُظهر أعمدة النص التي فيها أكثر من 200,000 قيمة مختلفة «—» في unique/top/freq هنا.")}</p>`),
      results: R ? (() => {
        const c = n => R.train.info.find(i => i.column === n) || {};
        const notes = [];
        notes.push(L(`<code>date</code> is stored as <code>${c("date").dtype}</code>${c("date").dtype === "object" ? " (text) — it must be converted before any time analysis" : ""}; it has ${fmtInt(c("date").unique)} different days.`, `<code>date</code> مخزَّن بنوع <code>${c("date").dtype}</code>${c("date").dtype === "object" ? " (نص) — ويجب تحويله قبل أي تحليل زمني" : ""}؛ وفيه ${fmtInt(c("date").unique)} يومًا مختلفًا.`));
        notes.push(L(`<code>family</code> has ${fmtInt(c("family").unique)} different product families.`, `<code>family</code> فيه ${fmtInt(c("family").unique)} فئة منتجات مختلفة.`));
        notes.push(L(`<code>sales</code> is <code>${c("sales").dtype}</code>: mean ${f2(c("sales").mean)} but median ${f2(c("sales").median)} — the mean is pulled up by a few very large values (Section 11).`, `<code>sales</code> بنوع <code>${c("sales").dtype}</code>: المتوسط ${f2(c("sales").mean)} لكن الوسيط ${f2(c("sales").median)} — إذ ترفع قيم قليلة كبيرة جدًا المتوسط (القسم 11).`));
        const miss = R.train.info.filter(i => i.missing > 0).concat(R.stores.info.filter(i => i.missing > 0));
        notes.push(miss.length ? L(`Columns with missing values: ${miss.map(i => `<code>${esc(i.column)}</code> (${fmtInt(i.missing)})`).join(", ")}.`, `أعمدة فيها قيم مفقودة: ${miss.map(i => `<code>${esc(i.column)}</code> (${fmtInt(i.missing)})`).join("، ")}.`) : L("No column has missing values (Non-Null Count equals the number of entries everywhere).", "لا يوجد عمود فيه قيم مفقودة (Non-Null Count يساوي عدد المدخلات في كل مكان)."));
        return `<ul class="mb-0">${notes.map(n => `<li>${n}</li>`).join("")}</ul>`;
      })() : pending(L("summary", "الملخص")),
      remember: L("Look before you analyse: size, columns, types, typical values and anything strange.", "انظر قبل أن تحلّل: الحجم والأعمدة والأنواع والقيم النموذجية وأي شيء غريب."),
      quiz: { q: L("The sales column has a mean much larger than its median. What does that suggest?", "متوسط عمود sales أكبر بكثير من وسيطه. ماذا يشير ذلك؟"), options: [
        { t: L("A few very large values pull the mean up (right-skewed data)", "قيم قليلة كبيرة جدًا ترفع المتوسط (بيانات ملتوية إلى اليمين)"), ok: true, why: L("The median is not affected by extremes; the mean is.", "الوسيط لا يتأثر بالقيم المتطرفة؛ أما المتوسط فيتأثر.") },
        { t: L("The data must be wrong", "البيانات خاطئة بالضرورة"), why: L("Retail sales are naturally uneven; it is a pattern to understand, not an error.", "مبيعات التجزئة غير متساوية بطبيعتها؛ إنه نمط يجب فهمه، لا خطأ.") }] },
    });
  },
});

/* =====================================================================
   05 — Data quality and cleaning
   ===================================================================== */
Lec.add({
  id: "py-cleaning", num: 5, aliases: ["data-quality-python", "cleaning-python"],
  title: { en: "Data Quality and Data Cleaning", ar: "جودة البيانات وتنظيفها" },
  short: { en: "Quality & cleaning", ar: "الجودة والتنظيف" },
  summary: { en: "Missing values, duplicates, duplicate keys, invalid dates — and auditable decisions.", ar: "القيم المفقودة والتكرارات والمفاتيح المكررة والتواريخ غير الصالحة — وقرارات قابلة للتدقيق." },
  render(root) {
    root.innerHTML = lesson(this, {
      simple: L("Cleaning has two separate steps. First we <strong>identify</strong> problems — missing values, duplicate rows, duplicate keys, invalid dates, unexpected values. Then we <strong>decide</strong> what to do about each one, and write the decision down. Identifying is technical; deciding needs business judgement.",
        "للتنظيف خطوتان منفصلتان. أولًا <strong>نكتشف</strong> المشكلات — القيم المفقودة والصفوف المكررة والمفاتيح المكررة والتواريخ غير الصالحة والقيم غير المتوقعة. ثم <strong>نقرّر</strong> ما نفعله بكل منها، ونكتب القرار. الاكتشاف عمل تقني؛ أما القرار فيحتاج إلى حكم تجاري."),
      why: [L("Deleting rows “to be safe” can silently remove real sales and bias every total.", "حذف الصفوف «للاحتياط» قد يزيل مبيعات حقيقية بصمت ويُحرّف كل المجاميع."), L("A written cleaning log lets anyone check, repeat or challenge your choices.", "سجل التنظيف المكتوب يتيح لأي شخص التحقق من خياراتك أو تكرارها أو الاعتراض عليها.")],
      extra: `<section class="block"><h2>${L("Identify the problems", "اكتشف المشكلات")}</h2>${concept({
          title: L("Missing values, duplicates and duplicate keys", "القيم المفقودة والتكرارات والمفاتيح المكررة"),
          what: L("Counts of empty cells per column, of rows that appear twice, and of store numbers that appear more than once in <code>stores</code>.", "أعداد الخلايا الفارغة لكل عمود، والصفوف التي تظهر مرتين، وأرقام المتاجر التي تظهر أكثر من مرة في <code>stores</code>."),
          why: L("Missing values change sums and averages; duplicate rows double-count sales; a duplicated store key would multiply rows when merging (Section 6).", "القيم المفقودة تغيّر المجاميع والمتوسطات؛ والصفوف المكررة تحسب المبيعات مرتين؛ والمفتاح المكرر للمتجر يضاعف الصفوف عند الدمج (القسم 6)."),
          code: ["quality", "unexpected"],
          lines: [
            ["train.isnull().sum()", L("<code>isnull()</code> marks every empty cell as True; <code>sum()</code> counts the Trues in each column.", "تضع <code>isnull()</code> القيمة True لكل خلية فارغة؛ وتعدّ <code>sum()</code> قيم True في كل عمود.")],
            ["train.duplicated().sum()", L("Counts rows that are exact copies of an earlier row (all columns equal). The first copy is not counted.", "تعدّ الصفوف التي هي نسخ مطابقة لصف سابق (كل الأعمدة متساوية). ولا تُحسب النسخة الأولى.")],
            ['stores["store_nbr"].duplicated().sum()', L("Counts store numbers that appear again. Must be 0, because each store should have exactly one row.", "تعدّ أرقام المتاجر التي تظهر مجددًا. ويجب أن يكون 0، لأن لكل متجر صفًا واحدًا بالضبط.")],
            ['(train["sales"] < 0).sum()', L("Possible but unexpected values: negative sales would need an explanation (returns? errors?).", "قيم ممكنة لكنها غير متوقعة: المبيعات السالبة تحتاج إلى تفسير (مرتجعات؟ أخطاء؟).")],
          ],
          expect: `<pre class="py-out">id             0
date           0
store_nbr      0
family         0
sales          0
onpromotion    0
dtype: int64
Duplicate rows in train: 0</pre><p>${L("(The zeros above show the format only — your counts appear in the results box below.)", "(الأصفار أعلاه توضح التنسيق فقط — تظهر أعدادك في صندوق النتائج أدناه.)")}</p>`,
          interpret: L("Zero everywhere means no empty cells and no exact duplicates. Any non-zero count is a finding to investigate and record — not something to delete automatically.", "الصفر في كل مكان يعني عدم وجود خلايا فارغة ولا تكرارات مطابقة. وأي عدد غير صفري نتيجة يجب التحقيق فيها وتسجيلها — لا شيء يُحذف تلقائيًا."),
          mistakes: [
            ["train.isnull.sum()", L("Missing brackets: <code>isnull</code> is a method — write <code>isnull().sum()</code>.", "أقواس ناقصة: <code>isnull</code> دالة — اكتب <code>isnull().sum()</code>.")],
            ["train = train.dropna()", L("Removes every row with any empty cell, without knowing why it is empty. Only do this after deciding it is justified.", "يزيل كل صف فيه أي خلية فارغة دون معرفة سبب فراغها. لا تفعل ذلك إلا بعد أن تقرر أنه مبرَّر.")],
            ["Zero sales treated as missing", L("A sale of 0 is a real value (nothing sold that day) — it is not a missing value.", "مبيعات بقيمة 0 قيمة حقيقية (لم يُبع شيء ذلك اليوم) — وليست قيمة مفقودة.")],
          ],
          business: L("Data quality numbers belong in every report: they tell decision-makers how far to trust the totals.", "أرقام جودة البيانات مكانها في كل تقرير: فهي تخبر صانعي القرار إلى أي مدى يمكنهم الوثوق بالمجاميع."),
        })}</section>
        <section class="block"><h2>${L("Convert dates — and keep an audit trail", "حوّل التواريخ — واحتفظ بسجل للتدقيق")}</h2>${concept({
          title: L("Converting the date column", "تحويل عمود التاريخ"),
          what: L("<code>pd.to_datetime()</code> turns text such as <code>2017-08-15</code> into real dates that pandas can sort, group by month or year, and subtract.", "تحوّل <code>pd.to_datetime()</code> نصًا مثل <code>2017-08-15</code> إلى تواريخ حقيقية تستطيع pandas ترتيبها وتجميعها حسب الشهر أو السنة وطرحها."),
          why: L("Every time-based step (Sections 8 and 10) needs real dates.", "كل خطوة زمنية (القسمان 8 و10) تحتاج إلى تواريخ حقيقية."),
          code: ["keep_raw", "dates", "cleaning_log"],
          lines: [
            ["train_raw = train.copy()", L("A safe, untouched copy of the data as loaded. You can always compare against it.", "نسخة آمنة لم تُمس من البيانات كما حُمّلت. ويمكنك دائمًا المقارنة بها.")],
            ['errors="coerce"', L("If a value cannot be read as a date, it becomes <code>NaT</code> (“not a time”) instead of stopping the program. This makes problems countable.", "إذا تعذّرت قراءة قيمة كتاريخ، تصبح <code>NaT</code> («ليس وقتًا») بدلًا من إيقاف البرنامج. وهذا يجعل المشكلات قابلة للعد.")],
            ['train["date"].isna().sum()', L("Counts the dates that could not be converted.", "يعدّ التواريخ التي تعذّر تحويلها.")],
            ['train["date"].min(), train["date"].max()', L("The first and last day in the data — the period your analysis covers.", "أول يوم وآخر يوم في البيانات — الفترة التي يغطيها تحليلك.")],
            ["log_decision(...)", L("Adds one line to the cleaning log: the issue, the evidence, the decision and the reason.", "تضيف سطرًا إلى سجل التنظيف: المشكلة والدليل والقرار والسبب.")],
          ],
          expect: `<pre class="py-out">Invalid dates: 0
Date range: YYYY-MM-DD 00:00:00 YYYY-MM-DD 00:00:00</pre>`,
          interpret: L("Invalid dates = 0 means every date was understood. The date range tells you, for example, whether the last year is complete — important for yearly comparisons (Section 10).", "التواريخ غير الصالحة = 0 تعني أن كل التواريخ فُهمت. ويخبرك نطاق التواريخ مثلًا ما إذا كانت السنة الأخيرة كاملة — وهذا مهم للمقارنات السنوية (القسم 10)."),
          mistakes: [
            ["ParserError / ValueError when converting", L("Without <code>errors=\"coerce\"</code> one bad value stops the whole conversion. Use coerce, then count and inspect the NaT rows.", "دون <code>errors=\"coerce\"</code> توقف قيمة سيئة واحدة التحويل كله. استخدم coerce، ثم عُدّ صفوف NaT وافحصها.")],
            ["Converting twice or after merging", L("Convert once, early, on <code>train</code>; the merged table then inherits real dates.", "حوّل مرة واحدة، مبكرًا، على <code>train</code>؛ فيرث الجدول المدموج تواريخ حقيقية.")],
          ],
          business: L("Stating the exact period covered prevents comparing a full year with a partial one.", "ذكر الفترة المغطاة بدقة يمنع مقارنة سنة كاملة بسنة جزئية."),
        })}</section>
        <section class="block"><h2>${L("Identifying is not deciding", "الاكتشاف ليس قرارًا")}</h2>${miniTable([L("Problem found", "المشكلة المكتشفة"), L("Questions before deciding", "أسئلة قبل القرار"), L("Possible decisions", "قرارات ممكنة")], [
          [L("Missing sales", "مبيعات مفقودة"), L("Did the store close? Was it a system error?", "هل أُغلق المتجر؟ هل كان خطأ في النظام؟"), L("Keep as missing (sum/mean skip them) · ask the data owner · never fill with 0 silently", "أبقِها مفقودة (يتخطاها sum/mean) · اسأل مالك البيانات · لا تملأها بصفر بصمت")],
          [L("Exact duplicate rows", "صفوف مكررة تمامًا"), L("Same id too? Loaded twice?", "هل لها المعرّف نفسه؟ هل حُمّلت مرتين؟"), L("Remove only true copies, log how many", "أزل النسخ الحقيقية فقط، وسجّل عددها")],
          [L("Duplicate store keys", "مفاتيح متاجر مكررة"), L("Are the two rows identical or contradictory?", "هل الصفان متطابقان أم متناقضان؟"), L("Identical: keep one, log it · contradictory: ask which is right — do not guess", "متطابقان: احتفظ بواحد وسجّل ذلك · متناقضان: اسأل أيهما الصحيح — لا تخمّن")],
          [L("Invalid dates", "تواريخ غير صالحة"), L("Typo? Different format?", "خطأ كتابي؟ تنسيق مختلف؟"), L("Keep the rows for non-time totals; time summaries skip them", "أبقِ الصفوف للمجاميع غير الزمنية؛ والملخصات الزمنية تتخطاها")],
          [L("Zero or extreme sales", "مبيعات صفرية أو متطرفة"), L("Closed day? Big order? Holiday?", "يوم إغلاق؟ طلب كبير؟ عطلة؟"), L("Investigate (Section 11) — usually keep", "حقّق (القسم 11) — والإبقاء عليها هو الغالب")],
        ])}</section>`,
      seeTitle: L("Results from your files: quality checks", "النتائج من ملفاتك: فحوص الجودة"), seeNote: LIVE_NOTE(),
      see: liveSee(L("missing values, duplicates, invalid dates and the date range", "القيم المفقودة والتكرارات والتواريخ غير الصالحة ونطاق التواريخ"), R => {
        const miss = d => d.info.map(c => [`<code>${esc(c.column)}</code>`, fmtInt(c.missing)]);
        return `<div class="grid grid-2"><div><h3>train.isnull().sum()</h3>${withCode("py-null-train", pySpec("quality", "train.isnull().sum()", L("the table", "الجدول")), miniTable(["", { t: L("missing", "مفقود"), num: true }], miss(R.train)))}</div>
          <div><h3>stores.isnull().sum()</h3>${withCode("py-null-stores", pySpec("quality", "stores.isnull().sum()", L("the table", "الجدول")), miniTable(["", { t: L("missing", "مفقود"), num: true }], miss(R.stores)))}</div></div>
          <div class="stat-grid mt-3">
            ${stat(L("Duplicate rows in train", "صفوف مكررة في train"), fmtInt(R.train.dupRows), "", pySpec("quality", L("Duplicate rows in train", "صفوف مكررة في train"), fmtInt(R.train.dupRows)))}
            ${stat(L("Duplicate rows in stores", "صفوف مكررة في stores"), fmtInt(R.stores.dupRows), "", pySpec("quality", L("Duplicate rows in stores", "صفوف مكررة في stores"), fmtInt(R.stores.dupRows)))}
            ${stat(L("Duplicate store keys", "مفاتيح متاجر مكررة"), fmtInt(R.stores.dupKeys), "", pySpec("quality", L("Duplicate store keys", "مفاتيح متاجر مكررة"), fmtInt(R.stores.dupKeys)))}
            ${stat(L("Invalid dates", "تواريخ غير صالحة"), fmtInt(R.train.invalidDates), "", pySpec("dates", L("Invalid dates", "تواريخ غير صالحة"), fmtInt(R.train.invalidDates)))}
            ${stat(L("First date", "أول تاريخ"), R.train.dateMin || "—", "", pySpec("dates", L("Date range", "نطاق التواريخ"), `${R.train.dateMin} – ${R.train.dateMax}`))}
            ${stat(L("Last date", "آخر تاريخ"), R.train.dateMax || "—", "", pySpec("dates", L("Date range", "نطاق التواريخ"), `${R.train.dateMin} – ${R.train.dateMax}`))}
            ${stat(L("Negative sales", "مبيعات سالبة"), fmtInt(R.train.negSales), "", pySpec("unexpected", L("Negative sales", "مبيعات سالبة"), fmtInt(R.train.negSales)))}
            ${stat(L("Zero-sales records", "سجلات بمبيعات صفرية"), fmtInt(R.stats.zeros), fmtPct(100 * R.stats.zeros / R.stats.count), pySpec("unexpected", L("Zero-sales records", "سجلات بمبيعات صفرية"), fmtInt(R.stats.zeros)))}
          </div>
          <h3 class="mt-3">${L("Draft cleaning log for your files", "مسودة سجل التنظيف لملفاتك")}</h3>
          ${miniTable([L("Issue", "المشكلة"), L("Evidence", "الدليل"), L("Suggested decision — confirm with the data owner", "القرار المقترح — أكّده مع مالك البيانات")], [
            [L("Missing values", "قيم مفقودة"), fmtInt(R.train.info.reduce((a, c) => a + c.missing, 0) + R.stores.info.reduce((a, c) => a + c.missing, 0)) + L(" cells", " خلية"), L("Keep and report; pandas sums and means skip them", "أبقِها وأبلغ عنها؛ مجاميع pandas ومتوسطاتها تتخطاها")],
            [L("Duplicate rows", "صفوف مكررة"), `${fmtInt(R.train.dupRows + R.stores.dupRows)}`, R.train.dupRows + R.stores.dupRows ? L("Inspect them; remove exact copies only and log the number", "افحصها؛ أزل النسخ المطابقة فقط وسجّل العدد") : L("Nothing to do", "لا شيء يُفعل")],
            [L("Duplicate store keys", "مفاتيح متاجر مكررة"), fmtInt(R.stores.dupKeys), R.stores.dupKeys ? L("Stop: resolve with the data owner before merging", "توقف: احسمها مع مالك البيانات قبل الدمج") : L("Safe to merge many-to-one", "الدمج many-to-one آمن")],
            [L("Invalid dates", "تواريخ غير صالحة"), fmtInt(R.train.invalidDates), R.train.invalidDates ? L("Keep rows; exclude only from time analysis; inspect the original text", "أبقِ الصفوف؛ استبعدها من التحليل الزمني فقط؛ افحص النص الأصلي") : L("Nothing to do", "لا شيء يُفعل")],
            [L("Zero sales", "مبيعات صفرية"), fmtInt(R.stats.zeros), L("Keep: a real value (nothing sold); worth explaining in reports", "أبقِها: قيمة حقيقية (لم يُبع شيء)؛ ويستحق الأمر الشرح في التقارير")],
          ])}`;
      }),
      results: SSR() ? `<p class="mb-0">${L(`Your data covers <strong>${SSR().train.dateMin}</strong> to <strong>${SSR().train.dateMax}</strong> (${fmtInt(SSR().train.distinctDates)} distinct days). ${SSR().stats.zeros ? `About ${fmtPct(100 * SSR().stats.zeros / SSR().stats.count, 0)} of sales records are exactly zero — common in retail (a family not sold that day in that store), and a reason the median is low.` : ""} Nothing has been deleted: the log above records what was found and what is suggested.`, `تغطي بياناتك الفترة من <strong>${SSR().train.dateMin}</strong> إلى <strong>${SSR().train.dateMax}</strong> (${fmtInt(SSR().train.distinctDates)} يومًا مختلفًا). ${SSR().stats.zeros ? `نحو ${fmtPct(100 * SSR().stats.zeros / SSR().stats.count, 0)} من سجلات المبيعات صفر تمامًا — وهذا شائع في التجزئة (فئة لم تُبع ذلك اليوم في ذلك المتجر)، وسبب في انخفاض الوسيط.` : ""} لم يُحذف شيء: يسجّل الجدول أعلاه ما وُجد وما يُقترح.`)}</p>` : pending(L("quality summary", "ملخص الجودة")),
      remember: L("Identify → investigate → decide → log. Never delete data just because it looks odd.", "اكتشف ← حقّق ← قرّر ← سجّل. لا تحذف البيانات لمجرد أنها تبدو غريبة."),
      quiz: { q: L("You find 1,000 rows with missing sales. What should you do first?", "وجدت 1,000 صف بمبيعات مفقودة. ماذا تفعل أولًا؟"), options: [
        { t: L("Fill them with 0", "املأها بصفر"), why: L("That invents information: “unknown” is not the same as “nothing sold”.", "هذا يخترع معلومات: «غير معروف» ليس مثل «لم يُبع شيء».") },
        { t: L("Delete the rows", "احذف الصفوف"), why: L("Maybe — but only after understanding why they are missing.", "ربما — لكن فقط بعد فهم سبب فقدانها.") },
        { t: L("Investigate the pattern (which stores, which dates), record it, then decide", "حقّق في النمط (أي متاجر، أي تواريخ)، وسجّله، ثم قرّر"), ok: true, why: L("The cause decides the right treatment.", "السبب هو ما يحدد المعالجة الصحيحة.") }] },
    });
  },
});

/* =====================================================================
   06 — Data merging
   ===================================================================== */
Lec.add({
  id: "py-merge", num: 6, aliases: ["merge", "merging"],
  title: { en: "Data Merging — Combining the Two Files", ar: "دمج البيانات — الجمع بين الملفين" },
  short: { en: "Merging the files", ar: "دمج الملفين" },
  summary: { en: "merge(on, how, validate): attach store details to every sales row — and check it.", ar: "merge(on, how, validate): إرفاق تفاصيل المتجر بكل صف مبيعات — والتحقق من ذلك." },
  render(root) {
    root.innerHTML = lesson(this, {
      simple: L("<code>train</code> knows the store <em>number</em> of each sale but not its city or type; <code>stores</code> knows each store's city and type but nothing about sales. A <strong>merge</strong> looks up each sales row's <code>store_nbr</code> in <code>stores</code> and copies that store's details onto the row — like VLOOKUP in Excel or a JOIN in SQL.",
        "يعرف <code>train</code> <em>رقم</em> المتجر لكل عملية بيع لكنه لا يعرف مدينته أو نوعه؛ ويعرف <code>stores</code> مدينة كل متجر ونوعه لكنه لا يعرف شيئًا عن المبيعات. و<strong>الدمج</strong> يبحث عن <code>store_nbr</code> لكل صف مبيعات في <code>stores</code> وينسخ تفاصيل ذلك المتجر إلى الصف — مثل VLOOKUP في Excel أو JOIN في SQL."),
      why: [L("Questions like “sales by city” or “by store type” need columns from both files in one table.", "أسئلة مثل «المبيعات حسب المدينة» أو «حسب نوع المتجر» تحتاج إلى أعمدة من الملفين في جدول واحد."), L("A wrong merge can silently lose or duplicate sales — so we validate it every time.", "الدمج الخاطئ قد يفقد المبيعات أو يكررها بصمت — لذلك نتحقق منه في كل مرة.")],
      stepsTitle: L("How a many-to-one merge works", "كيف يعمل الدمج many-to-one"),
      steps: [
        { t: L("Find the shared key", "حدّد المفتاح المشترك"), d: L("Both tables have <code>store_nbr</code>. In <code>stores</code> it is unique (one row per store); in <code>train</code> it repeats on many rows.", "كلا الجدولين فيه <code>store_nbr</code>. وهو فريد في <code>stores</code> (صف لكل متجر)؛ ويتكرر في صفوف كثيرة في <code>train</code>.") },
        { t: L("Look up each sales row", "ابحث لكل صف مبيعات"), d: L("Many sales rows point to the same single store row: <strong>many-to-one</strong>.", "صفوف مبيعات كثيرة تشير إلى صف المتجر الواحد نفسه: <strong>many-to-one</strong>."), ex: `<span class="py-m2o">${[1, 1, 1, 2].map(s => `<code>store_nbr ${s}</code>`).join(" ")} → <code>store 1: city, type</code> · <code>store 2: city, type</code></span>` },
        { t: L("Keep every sales row", "احتفظ بكل صف مبيعات"), d: L("With <code>how=\"left\"</code> every row of <code>train</code> stays. If each store appears once in <code>stores</code>, the merged table has <strong>exactly</strong> as many rows as <code>train</code>.", "مع <code>how=\"left\"</code> يبقى كل صف من <code>train</code>. وإذا ظهر كل متجر مرة واحدة في <code>stores</code>، يكون للجدول المدموج عدد الصفوف نفسه <strong>تمامًا</strong> الذي لـ<code>train</code>.") },
      ],
      extra: `<section class="block">${callout("info", L("Different row counts are expected — do not delete rows to make them equal", "اختلاف أعداد الصفوف متوقع — لا تحذف صفوفًا لتتساوى"), `<p>${L("Example output from a previous execution on the Kaggle files (not a guarantee for every version or upload):", "مثال على مخرجات تشغيل سابق على ملفات Kaggle (وليس ضمانًا لكل نسخة أو ملف مرفوع):")}</p><pre class="py-out">Train shape: (3000888, 6)
Stores shape: (54, 5)</pre><p class="mb-0">${L("3 million sales rows and 54 store rows describe different things. Removing sales rows “so the files match” would destroy real data; the merge is the correct way to combine them.", "ثلاثة ملايين صف مبيعات و54 صف متجر تصف أشياء مختلفة. وحذف صفوف المبيعات «لتتطابق الملفات» يدمّر بيانات حقيقية؛ والدمج هو الطريقة الصحيحة للجمع بينهما.")}</p>`)}</section>
        <section class="block">${concept({
          title: L("The merge and its parameters", "الدمج ومعاملاته"),
          what: L("<code>DataFrame.merge()</code> combines two tables using one or more key columns.", "تجمع <code>DataFrame.merge()</code> بين جدولين باستخدام عمود مفتاح أو أكثر."),
          why: L("To analyse sales by city, state, store type or cluster.", "لتحليل المبيعات حسب المدينة أو الولاية أو نوع المتجر أو المجموعة."),
          code: ["merge", "merge_check"],
          lines: [
            ["train.merge(stores, ...)", L("<code>train</code> is the <em>left</em> table, <code>stores</code> the <em>right</em> table. The order matters for “left” and “right”.", "<code>train</code> هو الجدول <em>الأيسر</em>، و<code>stores</code> الجدول <em>الأيمن</em>. والترتيب مهم لمعنى «يسار» و«يمين».")],
            ['on="store_nbr"', L("The shared key: rows are matched when their store numbers are equal. The column must exist in both tables with the same type.", "المفتاح المشترك: تتطابق الصفوف عندما تتساوى أرقام متاجرها. ويجب أن يوجد العمود في الجدولين بالنوع نفسه.")],
            ['how="left"', L("A LEFT JOIN: keep <strong>all</strong> rows of the left table (train) and add matching store information. Sales rows without a matching store keep empty (NaN) city/type.", "LEFT JOIN: احتفظ <strong>بكل</strong> صفوف الجدول الأيسر (train) وأضف معلومات المتجر المطابقة. وصفوف المبيعات التي ليس لها متجر مطابق تبقى بمدينة/نوع فارغين (NaN).")],
            ['validate="many_to_one"', L("A safety check: pandas confirms each key appears at most once in the right table. If not, it raises <code>MergeError</code> instead of silently multiplying rows.", "فحص أمان: تتأكد pandas من أن كل مفتاح يظهر مرة واحدة على الأكثر في الجدول الأيمن. وإن لم يكن كذلك ترفع <code>MergeError</code> بدلًا من مضاعفة الصفوف بصمت.")],
            ['len(merged)', L("Number of rows after the merge — compare it with <code>len(train)</code>.", "عدد الصفوف بعد الدمج — قارنه بـ<code>len(train)</code>.")],
            ['merged["city"].isna().sum()', L("Sales rows that found no store (or whose store has no city).", "صفوف المبيعات التي لم تجد متجرًا (أو التي ليس لمتجرها مدينة).")],
          ],
          expect: `<pre class="py-out">Rows before merge: N
Rows after merge: N        ← ${L("the same number", "العدد نفسه")}
Missing city values: 0
Missing store type: 0</pre>`,
          interpret: L("Same row count + zero missing city/type = every sale found its store exactly once. That is the result we want.", "عدد الصفوف نفسه + صفر في المدينة/النوع المفقود = كل عملية بيع وجدت متجرها مرة واحدة بالضبط. وهذه النتيجة التي نريدها."),
          mistakes: [
            ["MergeError: Merge keys are not unique in right dataset; not a many-to-one merge", L("Some store number appears more than once in <code>stores</code>. Investigate with the code below; do <strong>not</strong> just call <code>drop_duplicates()</code> to make the error disappear.", "رقم متجر ما يظهر أكثر من مرة في <code>stores</code>. حقّق بالكود أدناه؛ و<strong>لا</strong> تستدعِ <code>drop_duplicates()</code> لمجرد إخفاء الخطأ.")],
            ["Rows after merge > rows before", L("Duplicate keys multiplied rows (possible without <code>validate</code>). Totals would be inflated.", "المفاتيح المكررة ضاعفت الصفوف (ممكن دون <code>validate</code>). وستتضخم المجاميع.")],
            ["ValueError: You are trying to merge on int64 and object columns", L("store_nbr is a number in one table and text in the other. Convert one explicitly (e.g. <code>pd.to_numeric</code>) and check what changed.", "store_nbr رقم في جدول ونص في الآخر. حوّل أحدهما صراحةً (مثل <code>pd.to_numeric</code>) وافحص ما تغيّر.")],
            ["KeyError: 'city'", L("The column has a different name (e.g. a space or capital letter). Check <code>stores.columns.tolist()</code>.", "للعمود اسم مختلف (مثل مسافة أو حرف كبير). افحص <code>stores.columns.tolist()</code>.")],
          ],
          business: L("Without the merge you can rank individual stores; with it you can compare cities, regions and store formats — the level where many decisions are made.", "دون الدمج يمكنك ترتيب المتاجر منفردة؛ ومعه يمكنك مقارنة المدن والمناطق وأشكال المتاجر — وهو المستوى الذي تُتخذ فيه قرارات كثيرة."),
        })}
        ${concept({
          title: L("Investigating a merge that looks wrong", "التحقيق في دمج يبدو خاطئًا"),
          what: L("Two checks: store numbers in <code>train</code> that are missing from <code>stores</code>, and store numbers repeated in <code>stores</code>.", "فحصان: أرقام المتاجر في <code>train</code> المفقودة من <code>stores</code>، وأرقام المتاجر المكررة في <code>stores</code>."),
          why: L("They explain the two classic symptoms: missing city values and unexpected extra rows.", "يفسّران العَرَضين التقليديين: قيم المدينة المفقودة والصفوف الإضافية غير المتوقعة."),
          code: ["merge_investigate"],
          lines: [
            ['set(train["store_nbr"]) - set(stores["store_nbr"])', L("Store numbers that have sales but no store information.", "أرقام متاجر لها مبيعات لكن ليست لها معلومات متجر.")],
            ['stores["store_nbr"].duplicated(keep=False)', L("Marks <em>every</em> copy of a repeated key, so you can see the conflicting rows side by side.", "تحدد <em>كل</em> نسخة من مفتاح مكرر، لترى الصفوف المتعارضة جنبًا إلى جنب.")],
          ],
          expect: `<pre class="py-out">Store numbers without store information: []</pre><p>${L("…and an empty table of repeated keys.", "…وجدولًا فارغًا للمفاتيح المكررة.")}</p>`,
          interpret: L("Empty results mean the keys are clean. Anything listed must be resolved with whoever owns the data — not patched in code.", "النتائج الفارغة تعني أن المفاتيح نظيفة. وأي شيء يظهر يجب حسمه مع مالك البيانات — لا ترقيعه في الكود."),
          business: L("Unmatched stores often reveal real business events: a new store not yet registered, a closed store, a renumbering.", "المتاجر غير المطابقة تكشف غالبًا أحداثًا تجارية حقيقية: متجر جديد لم يُسجَّل بعد، أو متجر مغلق، أو إعادة ترقيم."),
        })}</section>`,
      seeTitle: L("Results from your files: merge validation", "النتائج من ملفاتك: التحقق من الدمج"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the row counts before and after the merge and the validation checks", "أعداد الصفوف قبل الدمج وبعده وفحوص التحقق"), R => {
        const m = R.merge;
        return `${m.valid ? "" : callout("danger", L("validate=\"many_to_one\" would raise MergeError", "سيرفع validate=\"many_to_one\" الخطأ MergeError"), `<p class="mb-0">${L(`These store numbers appear more than once in ${esc(R.stores.name)}: ${R.stores.dupKeyList.map(d => `<code>${esc(d.key)}</code> (${d.count}×)`).join(", ")}. Resolve them before merging.`, `أرقام المتاجر هذه تظهر أكثر من مرة في ${esc(R.stores.name)}: ${R.stores.dupKeyList.map(d => `<code>${esc(d.key)}</code> (${d.count}×)`).join("، ")}. احسمها قبل الدمج.`)}</p>`)}
          <div class="stat-grid">
            ${stat(L("Rows before merge", "الصفوف قبل الدمج"), fmtInt(m.trainRows), "len(train)", pySpec("merge_check", L("Rows before merge", "الصفوف قبل الدمج"), fmtInt(m.trainRows)))}
            ${stat(L("Stores rows", "صفوف المتاجر"), fmtInt(m.storesRows), "len(stores)", pySpec("merge", L("Stores rows", "صفوف المتاجر"), fmtInt(m.storesRows)))}
            ${stat(L("Rows after merge", "الصفوف بعد الدمج"), fmtInt(m.left), m.left === m.trainRows ? L("same as before ✓", "مثل ما قبله ✓") : L("different!", "مختلف!"), pySpec("merge_check", L("Rows after merge", "الصفوف بعد الدمج"), fmtInt(m.left)))}
            ${stat(L("Missing city values", "قيم مدينة مفقودة"), fmtInt(m.missingCity), "", pySpec("merge_check", L("Missing city values", "قيم مدينة مفقودة"), fmtInt(m.missingCity)))}
            ${stat(L("Missing store type", "نوع متجر مفقود"), fmtInt(m.missingType), "", pySpec("merge_check", L("Missing store type", "نوع متجر مفقود"), fmtInt(m.missingType)))}
            ${stat("validate", m.valid ? L("passes ✓", "ينجح ✓") : "MergeError", "many_to_one", pySpec("merge", "validate=\"many_to_one\"", m.valid ? "OK" : "MergeError"))}
          </div>
          ${m.unmatchedTrain.length ? `<h3 class="mt-3">${L("Store numbers with sales but no store information", "أرقام متاجر لها مبيعات دون معلومات متجر")}</h3>${withCode("py-unmatched", pySpec("merge_investigate", L("Unmatched store numbers", "أرقام متاجر غير مطابقة"), m.unmatchedTrain.map(u => u.key).join(", ")), miniTable(["store_nbr", { t: L("sales rows", "صفوف المبيعات"), num: true }], m.unmatchedTrain.map(u => [esc(u.key ?? "NaN"), fmtInt(u.rows)])))}` : ""}`;
      }),
      results: SSR() ? (() => { const m = SSR().merge; return `<p class="mb-0">${m.valid && m.left === m.trainRows && !m.missingCity
        ? L(`The merge is clean: ${fmtInt(m.left)} rows before and after, and every sales row received its store's city and type. From now on we analyse <code>merged</code>.`, `الدمج نظيف: ${fmtInt(m.left)} صف قبله وبعده، وتلقى كل صف مبيعات مدينة متجره ونوعه. ومن الآن نحلّل <code>merged</code>.`)
        : L(`The merge needs attention: ${m.valid ? "" : "duplicate store keys would stop it; "}${fmtInt(m.missingCity)} rows have no city. Investigate with the code above before continuing.`, `يحتاج الدمج إلى انتباه: ${m.valid ? "" : "المفاتيح المكررة ستوقفه؛ "}${fmtInt(m.missingCity)} صف بلا مدينة. حقّق بالكود أعلاه قبل المتابعة.`)}</p>`; })() : pending(L("merge check", "فحص الدمج")),
      remember: L("Merge with a key, keep all sales rows (how=\"left\"), validate the relationship, and compare row counts before and after.", "ادمج بمفتاح، واحتفظ بكل صفوف المبيعات (how=\"left\")، وتحقّق من العلاقة، وقارن أعداد الصفوف قبل الدمج وبعده."),
      quiz: { q: L("After a left merge the row count went from 3,000,888 to 3,056,454. What is the most likely cause?", "بعد دمج left ارتفع عدد الصفوف من 3,000,888 إلى 3,056,454. ما السبب الأرجح؟"), options: [
        { t: L("Some store numbers appear more than once in stores", "بعض أرقام المتاجر تظهر أكثر من مرة في stores"), ok: true, why: L("Each duplicate store copy creates an extra copy of that store's sales rows. validate=\"many_to_one\" would have caught it.", "كل نسخة مكررة لمتجر تنشئ نسخة إضافية من صفوف مبيعاته. وكان validate=\"many_to_one\" سيكتشف ذلك.") },
        { t: L("Some sales rows had no matching store", "بعض صفوف المبيعات لم يكن لها متجر مطابق"), why: L("Unmatched rows are kept once with NaN — they do not add rows.", "الصفوف غير المطابقة تبقى مرة واحدة مع NaN — ولا تضيف صفوفًا.") }] },
    });
  },
});

/* =====================================================================
   07 — The four join types
   ===================================================================== */
const JOIN_DEMO = {
  sales: [{ store_nbr: 1, sales: 100 }, { store_nbr: 1, sales: 80 }, { store_nbr: 2, sales: 50 }, { store_nbr: 4, sales: 30 }],
  stores: [{ store_nbr: 1, city: "Quito" }, { store_nbr: 2, city: "Guayaquil" }, { store_nbr: 3, city: "Cuenca" }],
};
/** pandas-style merge of the tiny teaching tables (keys sorted for outer, like pandas) */
function demoJoin(how, stores) {
  const S = JOIN_DEMO.sales, out = [];
  const add = (l, r, ind) => out.push({ store_nbr: (l || r).store_nbr, sales: l ? l.sales : null, city: r ? r.city : null, _merge: ind });
  if (how === "right") stores.forEach(r => { const ls = S.filter(l => l.store_nbr === r.store_nbr); if (ls.length) ls.forEach(l => add(l, r, "both")); else add(null, r, "right_only"); });
  else {
    S.forEach(l => { const rs = stores.filter(r => r.store_nbr === l.store_nbr); if (rs.length) rs.forEach(r => add(l, r, "both")); else if (how !== "inner") add(l, null, "left_only"); });
    if (how === "outer") { stores.filter(r => !S.some(l => l.store_nbr === r.store_nbr)).forEach(r => add(null, r, "right_only")); out.sort((a, b) => a.store_nbr - b.store_nbr); }
  }
  return out;
}
Lec.add({
  id: "py-joins", num: 7, aliases: ["join-types", "joins"],
  title: { en: "Understanding the Four Join Types", ar: "فهم أنواع الدمج الأربعة" },
  short: { en: "The four join types", ar: "أنواع الدمج الأربعة" },
  summary: { en: "LEFT, RIGHT, INNER and OUTER — what each keeps, on a tiny example and on your files.", ar: "LEFT و RIGHT و INNER و OUTER — ماذا يحتفظ به كل منها، على مثال صغير وعلى ملفاتك." },
  render(root) {
    const st = getState("py-joins", { how: "left", dup: false });
    const stores = st.dup ? [...JOIN_DEMO.stores, { store_nbr: 2, city: "Guayaquil (copy)" }] : JOIN_DEMO.stores;
    const res = demoJoin(st.how, stores);
    const tbl = (rows, cols) => miniTable(cols, rows.map(r => cols.map(c => r[c] === null || r[c] === undefined ? null : esc(r[c]))));
    const kinds = [
      ["left", "LEFT JOIN", L("All rows of the left table + matching data from the right. Unmatched left rows get NaN.", "كل صفوف الجدول الأيسر + البيانات المطابقة من الأيمن. وصفوف اليسار غير المطابقة تأخذ NaN."), L("Enrich sales with store details without losing any sale (our main merge).", "إثراء المبيعات بتفاصيل المتاجر دون فقدان أي بيع (دمجنا الرئيسي).")],
      ["right", "RIGHT JOIN", L("All rows of the right table + matching data from the left. Unmatched right rows get NaN.", "كل صفوف الجدول الأيمن + البيانات المطابقة من الأيسر. وصفوف اليمين غير المطابقة تأخذ NaN."), L("List every store, including stores with no sales.", "عرض كل متجر، بما في ذلك المتاجر التي ليست لها مبيعات.")],
      ["inner", "INNER JOIN", L("Only rows whose key exists in both tables. Unmatched rows disappear.", "الصفوف التي يوجد مفتاحها في الجدولين فقط. وتختفي الصفوف غير المطابقة."), L("Analyses that must have complete information on both sides.", "التحليلات التي يجب أن تتوفر لها معلومات كاملة من الجانبين.")],
      ["outer", "OUTER JOIN", L("All rows from both tables. Missing side gets NaN; <code>indicator=True</code> adds <code>_merge</code>.", "كل الصفوف من الجدولين. ويأخذ الجانب الناقص NaN؛ وتضيف <code>indicator=True</code> العمود <code>_merge</code>."), L("Reconciliation: find everything that does not match.", "المطابقة والتسوية: اكتشاف كل ما لا يتطابق.")],
    ];
    root.innerHTML = lesson(this, {
      simple: L("A join decides <strong>which rows survive</strong> when the keys of two tables do not match perfectly. LEFT keeps everything from the left table, RIGHT everything from the right table, INNER only the matches, and OUTER everything from both. “Left” and “right” simply mean the table before and after <code>.merge(</code>.",
        "يحدد الدمج <strong>أي الصفوف تبقى</strong> عندما لا تتطابق مفاتيح جدولين تمامًا. LEFT يحتفظ بكل شيء من الجدول الأيسر، وRIGHT بكل شيء من الأيمن، وINNER بالمتطابقات فقط، وOUTER بكل شيء من الجدولين. و«الأيسر» و«الأيمن» تعنيان ببساطة الجدول قبل <code>.merge(</code> وبعدها."),
      why: [L("Choosing the wrong join can silently drop sales (INNER) or add empty rows (RIGHT/OUTER).", "اختيار نوع الدمج الخاطئ قد يُسقط المبيعات بصمت (INNER) أو يضيف صفوفًا فارغة (RIGHT/OUTER)."), L("The same idea exists in SQL, Excel Power Query and every BI tool.", "الفكرة نفسها موجودة في SQL وExcel Power Query وكل أدوات ذكاء الأعمال.")],
      extra: `<section class="block"><h2>${L("Try it on a tiny teaching example", "جرّبها على مثال تعليمي صغير")} ${exampleTag()}</h2>
        <div class="grid grid-2"><div><h3>${L("Left table: demo_sales", "الجدول الأيسر: demo_sales")}</h3>${tbl(JOIN_DEMO.sales, ["store_nbr", "sales"])}</div>
        <div><h3>${L("Right table: demo_stores", "الجدول الأيمن: demo_stores")}</h3>${tbl(stores, ["store_nbr", "city"])}</div></div>
        <p class="small muted">${L("Store 4 has sales but no store information. Store 3 has information but no sales.", "المتجر 4 له مبيعات لكن ليست له معلومات متجر. والمتجر 3 له معلومات لكن ليست له مبيعات.")}</p>
        <div class="controls">${segmented("how", kinds.map(k => ({ value: k[0], label: k[1] })), st.how, L("Join type", "نوع الدمج"))}
          <label class="py-check"><input type="checkbox" id="jn-dup" ${st.dup ? "checked" : ""}> ${L("Add a duplicate row for store 2 in demo_stores", "أضف صفًا مكررًا للمتجر 2 في demo_stores")}</label></div>
        <div class="card mt-2" aria-live="polite"><h3 class="mt-0"><code>demo_sales.merge(demo_stores, on="store_nbr", how="${st.how}", indicator=True)</code> → ${res.length} ${L("rows", "صفوف")}</h3>
          ${tbl(res, ["store_nbr", "sales", "city", "_merge"])}
          <p class="small mb-0">${kinds.find(k => k[0] === st.how)[2]}${st.dup ? ` <strong>${L("Notice: store 2 has one sales row, but it now appears twice in the result — a duplicated key multiplies rows.", "لاحظ: للمتجر 2 صف مبيعات واحد، لكنه يظهر الآن مرتين في النتيجة — فالمفتاح المكرر يضاعف الصفوف.")}</strong>` : ""}</p></div></section>
        <section class="block"><h2>${L("Comparison", "مقارنة")}</h2>${miniTable([L("Join", "الدمج"), L("Keeps", "يحتفظ بـ"), L("Typical use", "الاستخدام المعتاد"), { t: L("Rows in the demo", "الصفوف في المثال"), num: true }], kinds.map(k => [`<code>how="${k[0]}"</code><br><small>${k[1]}</small>`, k[2], k[3], demoJoin(k[0], JOIN_DEMO.stores).length]))}
        <p>${L("<strong>The <code>_merge</code> column</strong> (added by <code>indicator=True</code>) labels each row: <code>both</code> = key found in both tables, <code>left_only</code> = only in the left table, <code>right_only</code> = only in the right table. It is the quickest way to see what did not match.", "<strong>العمود <code>_merge</code></strong> (تضيفه <code>indicator=True</code>) يصنّف كل صف: <code>both</code> = المفتاح موجود في الجدولين، و<code>left_only</code> = في الجدول الأيسر فقط، و<code>right_only</code> = في الجدول الأيمن فقط. وهو أسرع طريقة لرؤية ما لم يتطابق.")}</p></section>
        <section class="block">${concept({
          title: L("The four joins in pandas", "أنواع الدمج الأربعة في pandas"),
          what: L("The same <code>merge()</code> call with a different <code>how=</code>.", "استدعاء <code>merge()</code> نفسه مع قيمة مختلفة لـ<code>how=</code>."),
          why: L("Comparing the four row counts is a fast health check of how well two tables match.", "مقارنة أعداد الصفوف الأربعة فحص سريع لمدى تطابق جدولين."),
          code: ["join_demo", "joins", "joins_check"],
          lines: [
            ['how="right"', L("Keeps every store; a store with no sales appears once with NaN in the sales columns.", "يحتفظ بكل متجر؛ ويظهر المتجر الذي ليست له مبيعات مرة واحدة مع NaN في أعمدة المبيعات.")],
            ['how="inner"', L("Drops sales whose store is unknown and stores without sales.", "يُسقط المبيعات التي متجرها غير معروف والمتاجر التي ليست لها مبيعات.")],
            ['how="outer", indicator=True', L("Keeps everything and labels the origin of each row in <code>_merge</code>.", "يحتفظ بكل شيء ويصنّف مصدر كل صف في <code>_merge</code>.")],
            ['outer_join["_merge"].value_counts()', L("How many rows matched (both) and how many did not (left_only, right_only).", "عدد الصفوف المتطابقة (both) وعدد غير المتطابقة (left_only و right_only).")],
            ["del left_join, ...", L("Each join of 3 million rows uses a lot of memory; delete them when done.", "كل دمج لثلاثة ملايين صف يستهلك ذاكرة كبيرة؛ احذفها عند الانتهاء.")],
          ],
          expect: `<pre class="py-out"> left join: N rows
right join: N rows
inner join: N rows
outer join: N rows
_merge
both          N
left_only     0
right_only    0</pre>`,
          interpret: L("If all keys match and are unique on the right, all four joins return the same number of rows and <code>_merge</code> shows only <code>both</code>. Differences point exactly to the unmatched stores.", "إذا تطابقت كل المفاتيح وكانت فريدة في الجانب الأيمن، تُعيد أنواع الدمج الأربعة العدد نفسه من الصفوف ولا يظهر في <code>_merge</code> إلا <code>both</code>. والفروق تشير بالضبط إلى المتاجر غير المطابقة."),
          mistakes: [
            [L("Using inner because “it is the default”", "استخدام inner «لأنه الافتراضي»"), L("<code>merge()</code> does default to inner — which silently drops unmatched sales. Always write <code>how=</code> explicitly.", "القيمة الافتراضية لـ<code>merge()</code> هي inner فعلًا — وهي تُسقط المبيعات غير المطابقة بصمت. اكتب <code>how=</code> صراحةً دائمًا.")],
            [L("Swapping the tables", "تبديل الجدولين"), L("<code>stores.merge(train, how=\"left\")</code> is the same as <code>train.merge(stores, how=\"right\")</code> (apart from column order).", "<code>stores.merge(train, how=\"left\")</code> يساوي <code>train.merge(stores, how=\"right\")</code> (ما عدا ترتيب الأعمدة).")],
          ],
          business: L("Reconciling two systems (sales vs. store master data) is daily work in BI; the outer join with <code>_merge</code> is the tool for it.", "التسوية بين نظامين (المبيعات مقابل البيانات الرئيسية للمتاجر) عمل يومي في ذكاء الأعمال؛ والدمج outer مع <code>_merge</code> هو أداته."),
        })}</section>
        <section class="block"><h2>${L("Exercise", "تمرين")}</h2>${answer(L("Using demo_sales and demo_stores (without the duplicate row), predict the number of rows for each join before trying it.", "باستخدام demo_sales و demo_stores (دون الصف المكرر)، توقّع عدد الصفوف لكل نوع دمج قبل تجربته."),
          `<p class="mb-0">${L("left = 4 (all four sales; store 4 gets NaN city) · right = 4 (stores 1, 1, 2 matched + store 3 with NaN sales) · inner = 3 (stores 1, 1, 2) · outer = 5 (everything: 3 matched + store 4 left_only + store 3 right_only).", "left = 4 (المبيعات الأربع؛ والمتجر 4 مدينته NaN) · right = 4 (المتاجر 1 و1 و2 متطابقة + المتجر 3 بمبيعات NaN) · inner = 3 (المتاجر 1 و1 و2) · outer = 5 (كل شيء: 3 متطابقة + المتجر 4 left_only + المتجر 3 right_only).")}</p>`)}</section>`,
      seeTitle: L("Results from your files: the four joins", "النتائج من ملفاتك: أنواع الدمج الأربعة"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the row counts of the four joins and the _merge breakdown", "أعداد صفوف أنواع الدمج الأربعة وتوزيع _merge"), R => {
        const m = R.merge;
        return `<div class="stat-grid">${[["left", m.left], ["right", m.right], ["inner", m.inner], ["outer", m.outer]].map(([k, v]) => stat(`how="${k}"`, fmtInt(v), L("rows", "صفوف"), pySpec("joins_check", `${k} join`, fmtInt(v)))).join("")}</div>
          <h3 class="mt-3">outer_join["_merge"].value_counts()</h3>${withCode("py-merge-ind", pySpec("joins_check", "_merge", `both ${m.both}`), miniTable(["_merge", { t: L("rows", "صفوف"), num: true }], [["both", fmtInt(m.both)], ["left_only", fmtInt(m.leftOnly)], ["right_only", fmtInt(m.rightOnly)]]))}
          ${m.unmatchedStores.length ? `<p class="small">${L(`Stores with no sales rows (right_only): ${m.unmatchedStores.map(u => `<code>${esc(u.key)}</code>`).join(", ")}`, `متاجر ليست لها صفوف مبيعات (right_only): ${m.unmatchedStores.map(u => `<code>${esc(u.key)}</code>`).join("، ")}`)}</p>` : ""}`;
      }),
      results: SSR() ? `<p class="mb-0">${SSR().merge.left === SSR().merge.inner && SSR().merge.right === SSR().merge.inner
        ? L("All four joins give the same row count: every sales row has a store and every store has sales. For these files, the join type would not change the result — but writing how=\"left\" still documents your intention.", "تعطي أنواع الدمج الأربعة عدد الصفوف نفسه: لكل صف مبيعات متجر ولكل متجر مبيعات. وفي هذه الملفات لن يغيّر نوع الدمج النتيجة — لكن كتابة how=\"left\" توثّق نيتك مع ذلك.")
        : L("The joins differ, so some keys do not match. The _merge counts above show exactly how many rows exist on one side only.", "تختلف أنواع الدمج، إذن بعض المفاتيح لا تتطابق. وتُظهر أعداد _merge أعلاه بالضبط كم صفًا يوجد في جانب واحد فقط.")}</p>` : pending(L("join comparison", "مقارنة أنواع الدمج")),
      remember: L("LEFT keeps the left table, RIGHT the right, INNER only matches, OUTER everything. Duplicate keys multiply rows.", "LEFT يحتفظ بالجدول الأيسر، وRIGHT بالأيمن، وINNER بالمتطابقات فقط، وOUTER بكل شيء. والمفاتيح المكررة تضاعف الصفوف."),
      quiz: { q: L("Which join would silently drop sales of a store missing from stores.csv?", "أي نوع دمج سيُسقط بصمت مبيعات متجر مفقود من stores.csv؟"), options: [
        { t: "INNER", ok: true, why: L("INNER keeps only keys present in both tables.", "INNER يحتفظ فقط بالمفاتيح الموجودة في الجدولين.") },
        { t: "LEFT (train on the left)", why: L("LEFT keeps all train rows; the store columns are just NaN.", "LEFT يحتفظ بكل صفوف train؛ وتكون أعمدة المتجر NaN فقط.") },
        { t: "OUTER", why: L("OUTER keeps everything from both sides.", "OUTER يحتفظ بكل شيء من الجانبين.") }] },
    });
    root.querySelectorAll('[data-seg="how"] button').forEach(b => b.addEventListener("click", () => { st.how = b.dataset.value; this.render(root); root.querySelector(`[data-seg="how"] [data-value="${st.how}"]`).focus(); }));
    root.querySelector("#jn-dup").addEventListener("change", e => { st.dup = e.target.checked; this.render(root); root.querySelector("#jn-dup").focus(); });
  },
});
