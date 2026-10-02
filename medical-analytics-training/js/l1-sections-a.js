/* =====================================================================
   Lecture 1 — configuration + Sections 01–07
   Created by Master of AI.
   ===================================================================== */
Lec.configure({
  key: "lecture1",
  title: { en: "Lecture 1", ar: "المحاضرة 1" },
  subtitle: { en: "From messy data to insight", ar: "من البيانات غير المنظمة إلى الرؤية" },
  fullTitle: { en: "From Messy Medical Data to Statistical Insight, Machine Learning and Forecasting", ar: "من البيانات الطبية غير المنظمة إلى الرؤية الإحصائية وتعلّم الآلة والتنبؤ" },
  intro: {
    en: "We follow one (made-up) patient-screening dataset from a messy file all the way to trustworthy numbers, simple predictions and a forecast. Every step is explained in plain language and shown live on the data — there is nothing to download or install.",
    ar: "نتتبع مجموعة بيانات فحص مرضى (مُختلَقة) واحدة من ملف غير منظم حتى الوصول إلى أرقام موثوقة وتنبؤات بسيطة وتوقع مستقبلي. كل خطوة مشروحة بلغة بسيطة ومعروضة مباشرة على البيانات — لا شيء لتنزيله أو تثبيته.",
  },
  groups: [
    { from: 1, to: 5, en: "The big picture", ar: "الصورة الكاملة" },
    { from: 6, to: 8, en: "Preparing the data", ar: "تجهيز البيانات" },
    { from: 9, to: 14, en: "Understanding the data (statistics)", ar: "فهم البيانات (الإحصاء)" },
    { from: 15, to: 19, en: "Predicting & forecasting", ar: "التنبؤ والتوقع" },
    { from: 20, to: 20, en: "Putting it together", ar: "تجميع كل شيء" },
  ],
  homeExtra: () => `<section class="block">${datasetDownloads()}</section>`,
  other: { href: "lecture-2.html", dir: "next", label: { en: "Go to Lecture 2", ar: "الانتقال إلى المحاضرة 2" }, short: { en: "Lecture 2", ar: "المحاضرة 2" } },
});

/* frequently used facts, all computed from the generated data */
function facts() {
  const d = SD(), fc = d.forecast.series.screening_visits, gb = d.evaluation.classification["Gradient Boosting"], ci = d.ci.overall.fasting_glucose["0.95"];
  return {
    rawRows: d.quality.summary.rows, cleanRows: d.clean.rows.length, cols: d.quality.summary.columns,
    exactDup: d.quality.summary.exact_duplicates, keyDup: d.quality.summary.key_duplicates,
    completeness: d.quality.summary.completeness_pct, invalidDates: d.quality.summary.invalid_dates,
    glucoseMean: ci.mean, glucoseLo: ci.lower, glucoseHi: ci.upper, gbAcc: gb.accuracy, gbF1: gb.macro_f1,
    fcTotal: fc.forecast.reduce((a, b) => a + b, 0), fcMape: fc.holdout[fc.best_method].mape, counts: d.eda.counts.risk_group,
  };
}
const RISK_NOTE = () => L("risk_group is a made-up teaching label calculated by a simple rule — it is not a real medical assessment.", "risk_group تسمية تعليمية مُختلَقة تُحسب بقاعدة بسيطة — وليست تقييمًا طبيًا حقيقيًا.");

/* =====================================================================
   01 — The big picture
   ===================================================================== */
Lec.add({
  id: "executive-overview", num: 1, aliases: ["overview"],
  title: { en: "The Big Picture", ar: "الصورة الكاملة" },
  summary: { en: "The whole journey from messy data to a decision, and the dataset we use.", ar: "الرحلة كاملة من البيانات غير المنظمة إلى القرار، والبيانات التي نستخدمها." },
  render(root) {
    const f = facts(), messy = Data.messy();
    const sample = [3, 11, 25, 40, 57, 88].map(i => messy[i]);
    const cols = ["patient_id", "visit_date", "sex", "systolic_bp", "fasting_glucose", "hba1c", "smoking_status"];
    root.innerHTML = lesson(this, {
      simple: L("Raw medical data is almost always messy. Before we can trust any number we must <strong>check</strong> it, <strong>clean</strong> it and only then <strong>analyse</strong> it. This lecture walks one dataset through every one of those steps.",
        "البيانات الطبية الخام تكون غير منظمة دائمًا تقريبًا. قبل أن نثق بأي رقم يجب أن <strong>نفحصها</strong> و<strong>ننظّفها</strong> ثم <strong>نحلّلها</strong>. تمرّ هذه المحاضرة بمجموعة بيانات واحدة عبر كل هذه الخطوات."),
      why: [
        L("Decisions are only as good as the data behind them.", "القرارات جيدة بقدر جودة البيانات التي تستند إليها."),
        L("Knowing the steps helps you ask the right questions about any report or dashboard.", "معرفة الخطوات تساعدك على طرح الأسئلة الصحيحة عن أي تقرير أو لوحة مؤشرات."),
        L("Each step produces something the next step depends on — a mistake early on spreads everywhere.", "كل خطوة تنتج شيئًا تعتمد عليه الخطوة التالية — والخطأ المبكر ينتشر في كل مكان."),
      ],
      stepsTitle: L("The journey — step by step", "الرحلة — خطوة بخطوة"),
      steps: [
        { t: L("Receive the raw data", "استلام البيانات الخام"), d: L("A file exported from several clinics, typed by different people.", "ملف مُصدَّر من عدة عيادات، أدخله أشخاص مختلفون."), ex: L(`${fmtInt(f.rawRows)} rows, ${f.cols} columns`, `${fmtInt(f.rawRows)} صفًا، ${f.cols} عمودًا`) },
        { t: L("Check the quality", "فحص الجودة"), d: L("Find what is missing, duplicated, impossible or written inconsistently.", "اكتشاف المفقود والمكرر والمستحيل وما كُتب بطرق غير متسقة."), ex: L(`${f.exactDup} duplicate rows, ${f.invalidDates} impossible dates`, `${f.exactDup} صفًا مكررًا، ${f.invalidDates} تواريخ مستحيلة`) },
        { t: L("Clean it with clear rules", "تنظيفها بقواعد واضحة"), d: L("Fix formats, remove duplicates, and mark impossible values as missing.", "إصلاح التنسيقات، وإزالة التكرارات، ووسم القيم المستحيلة كمفقودة."), ex: L(`${fmtInt(f.rawRows)} → ${fmtInt(f.cleanRows)} reliable rows`, `${fmtInt(f.rawRows)} ← ${fmtInt(f.cleanRows)} صفًا موثوقًا`) },
        { t: L("Describe and explore", "الوصف والاستكشاف"), d: L("Averages, spread, charts and comparisons between groups.", "المتوسطات والتشتت والرسوم والمقارنة بين المجموعات."), ex: L(`average fasting glucose ≈ ${fmt(f.glucoseMean, 1)} mg/dL`, `متوسط سكر الصائم ≈ ${fmt(f.glucoseMean, 1)} ملغ/دل`) },
        { t: L("Test what we see", "اختبار ما نراه"), d: L("Check whether a difference is real or could just be chance.", "التحقق مما إذا كان الفرق حقيقيًا أم قد يكون مجرد صدفة."), ex: L("smokers vs non-smokers: heart rate differs; average glucose does not clearly differ", "المدخنون مقابل غير المدخنين: النبض يختلف؛ ومتوسط السكر لا يختلف بوضوح") },
        { t: L("Predict and forecast", "التنبؤ والتوقع"), d: L("Train simple models and forecast future workload.", "تدريب نماذج بسيطة وتوقع حجم العمل المستقبلي."), ex: L(`≈ ${fmtInt(f.fcTotal)} screening visits expected next year`, `≈ ${fmtInt(f.fcTotal)} زيارة فحص متوقعة العام القادم`) },
        { t: L("Decide", "اتخاذ القرار"), d: L("Turn the evidence into actions, saying clearly how certain we are.", "تحويل الأدلة إلى إجراءات مع توضيح درجة اليقين."), ex: L("plan capacity · fix data entry at the source", "تخطيط السعة · إصلاح إدخال البيانات من المصدر") },
      ],
      seeTitle: L("Meet our dataset", "تعرّف على بياناتنا"),
      seeNote: L("All patients are invented by a computer program — no real people. Here are six rows exactly as they arrived. Notice the different ways of writing the same thing.",
        "جميع المرضى من اختلاق برنامج حاسوبي — لا أشخاص حقيقيون. هذه ستة صفوف كما وصلت تمامًا. لاحظ الطرق المختلفة لكتابة الشيء نفسه."),
      see: `<div class="grid grid-4">${kpi(L("Raw rows", "الصفوف الخام"), fmtInt(f.rawRows), "", "warn", Snip.rawShape(`${fmtInt(f.rawRows)} × ${f.cols}`))}${kpi(L("Columns", "الأعمدة"), f.cols, "", "", Snip.rawShape(`${fmtInt(f.rawRows)} × ${f.cols}`))}${kpi(L("Clean rows", "الصفوف المنظّفة"), fmtInt(f.cleanRows), "", "accent", Snip.cleanRows(fmtInt(f.cleanRows)))}${kpi(L("Months of clinic activity", "أشهر نشاط العيادات"), SD().monthly.rows.length, "", "primary", Snip.monthsCount(SD().monthly.rows.length))}</div>
        <div class="mt-2">${withCode("s1-sample", Snip.rawSample([3, 11, 25, 40, 57, 88], cols), miniTable(cols.map(c => `<code>${c}</code>`), sample.map(r => cols.map(c => CleanRules.isMiss(r[c]) ? null : `<span class="mono">${esc(String(r[c]).replace(/ /g, "␠"))}</span>`))))}</div>
        <div class="mt-3">${datasetDownloads()}</div>`,
      results: `<ul><li>${L("“M”, “male” and “Male” all mean the same thing — the computer does not know that until we tell it.", "«M» و«male» و«Male» تعني الشيء نفسه — والحاسوب لا يعرف ذلك حتى نخبره.")}</li>
        <li>${L("Some numbers carry units inside them (“110 mg/dL”) or two values in one cell (“138/88”).", "بعض الأرقام تحمل وحداتها داخلها («110 mg/dL») أو قيمتين في خلية واحدة («138/88»).")}</li>
        <li>${L("Empty cells (∅) and words like “NA” or “?” mean the value is missing.", "الخلايا الفارغة (∅) وكلمات مثل «NA» أو «?» تعني أن القيمة مفقودة.")}</li></ul>`,
      remember: L("Check → Clean → Analyse → Decide. Skipping a step makes every later number less trustworthy.", "افحص ← نظّف ← حلّل ← قرّر. تجاوز أي خطوة يجعل كل رقم لاحق أقل موثوقية."),
      quiz: { q: L("What should happen first when a new data file arrives?", "ما الذي يجب أن يحدث أولًا عند وصول ملف بيانات جديد؟"), options: [
        { t: L("Build a prediction model", "بناء نموذج تنبؤ"), why: L("Models built on unchecked data learn the errors too.", "النماذج المبنية على بيانات غير مفحوصة تتعلم الأخطاء أيضًا.") },
        { t: L("Check its quality", "فحص جودته"), ok: true, why: L("We first need to know what is missing, duplicated or wrong.", "نحتاج أولًا إلى معرفة ما هو مفقود أو مكرر أو خاطئ.") },
        { t: L("Publish a dashboard", "نشر لوحة مؤشرات"), why: L("A dashboard would show the errors to everyone.", "لوحة المؤشرات ستعرض الأخطاء على الجميع.") }] },
    });
  },
});

/* =====================================================================
   02 — Data analysis vs data science
   ===================================================================== */
Lec.add({
  id: "data-analysis-vs-data-science", num: 2, aliases: ["analysis-vs-science"],
  title: { en: "Data Analysis, Statistics, Data Science, ML and AI", ar: "تحليل البيانات والإحصاء وعلم البيانات وتعلّم الآلة والذكاء الاصطناعي" },
  short: { en: "Five fields explained", ar: "خمسة مجالات" },
  summary: { en: "Five words people mix up — what each one really means.", ar: "خمس كلمات يخلط الناس بينها — وما يعنيه كل منها فعلًا." },
  render(root) {
    const st = getState("cmp", { a: "da", b: "ml" });
    const D = {
      da: { t: L("Data analysis", "تحليل البيانات"), q: L("What happened?", "ماذا حدث؟"), m: L("Counting, averages, tables, charts, dashboards", "العدّ، المتوسطات، الجداول، الرسوم، لوحات المؤشرات"), o: L("Reports and KPIs", "تقارير ومؤشرات أداء"), e: L("Screenings per clinic per month", "عدد الفحوص لكل عيادة شهريًا") },
      st: { t: L("Statistics", "الإحصاء"), q: L("Is it real, and how sure are we?", "هل هو حقيقي، وما مدى تأكدنا؟"), m: L("Tests, confidence intervals, sampling", "الاختبارات، فترات الثقة، المعاينة"), o: L("Conclusions with a level of certainty", "استنتاجات مع درجة من اليقين"), e: L("Do smokers have a higher heart rate — or is it chance?", "هل نبض المدخنين أعلى — أم هي صدفة؟") },
      ds: { t: L("Data science", "علم البيانات"), q: L("What can we learn or predict end to end?", "ماذا يمكننا أن نتعلم أو نتنبأ من البداية إلى النهاية؟"), m: L("All of the above + programming + domain knowledge", "كل ما سبق + البرمجة + المعرفة بالمجال"), o: L("Complete data pipelines and data products", "مسارات بيانات كاملة ومنتجات بيانات"), e: L("This whole lecture, from raw file to forecast", "هذه المحاضرة كلها، من الملف الخام إلى التوقع") },
      ml: { t: L("Machine learning", "تعلّم الآلة"), q: L("Can a computer learn a pattern from examples?", "هل يستطيع الحاسوب تعلّم نمط من الأمثلة؟"), m: L("Training on past examples, testing on new ones", "التدريب على أمثلة سابقة، والاختبار على أمثلة جديدة"), o: L("A model that makes predictions", "نموذج يقدّم تنبؤات"), e: L("Predicting the teaching label risk_group from measurements", "التنبؤ بالتسمية التعليمية risk_group من القياسات") },
      ai: { t: L("Artificial intelligence", "الذكاء الاصطناعي"), q: L("Can a system do tasks that need human-like intelligence?", "هل يستطيع نظام أداء مهام تحتاج ذكاءً شبيهًا بالبشر؟"), m: L("Machine learning, but also rules, search, planning, language", "تعلّم الآلة، وأيضًا القواعد والبحث والتخطيط واللغة"), o: L("Assistants and automated systems", "مساعدون وأنظمة مؤتمتة"), e: L("An assistant that explains a dashboard (Lecture 2)", "مساعد يشرح لوحة مؤشرات (المحاضرة 2)") },
    };
    const keys = Object.keys(D), rows = [["q", L("Main question", "السؤال الرئيسي")], ["m", L("Typical methods", "الطرق المعتادة")], ["o", L("What it produces", "ماذا ينتج")], ["e", L("Example from our data", "مثال من بياناتنا")]];
    const draw = () => {
      root.querySelector("#cmp-table").innerHTML = miniTable(["", D[st.a].t, D[st.b].t], rows.map(([k, lb]) => [`<strong>${lb}</strong>`, D[st.a][k], D[st.b][k]]));
    };
    root.innerHTML = lesson(this, {
      simple: L("These five words are often used as if they meant the same thing. They don't: each one answers a different kind of question.", "تُستخدم هذه الكلمات الخمس كأنها تعني الشيء نفسه، لكنها ليست كذلك: كل منها يجيب عن نوع مختلف من الأسئلة."),
      why: [L("Asking for the right kind of work saves time and money.", "طلب النوع الصحيح من العمل يوفّر الوقت والمال."), L("Not every problem needs “AI” — many need a clean report.", "ليست كل مشكلة بحاجة إلى «ذكاء اصطناعي» — كثير منها يحتاج تقريرًا نظيفًا.")],
      stepsTitle: L("The five fields, one by one", "المجالات الخمسة، واحدًا تلو الآخر"),
      steps: keys.map(k => ({ t: D[k].t, d: `${D[k].q} — ${D[k].m}.`, ex: D[k].e })),
      seeTitle: L("Compare any two side by side", "قارن أي اثنين جنبًا إلى جنب"), codeHint: false,
      see: `<div class="controls">${selectEl("cmp-a", keys.map(k => ({ value: k, label: D[k].t })), st.a, L("First", "الأول"))}${selectEl("cmp-b", keys.map(k => ({ value: k, label: D[k].t })), st.b, L("Second", "الثاني"))}</div><div id="cmp-table" class="mt-2"></div>`,
      remember: L("Match the method to the question: report → analysis; “is it real?” → statistics; “predict it” → machine learning.", "طابق الطريقة مع السؤال: تقرير ← تحليل؛ «هل هو حقيقي؟» ← إحصاء؛ «تنبّأ به» ← تعلّم الآلة."),
      quiz: { q: L("“Is the difference between two clinics real, or just chance?” Which field answers this?", "«هل الفرق بين عيادتين حقيقي أم مجرد صدفة؟» أي مجال يجيب عن هذا؟"), options: [
        { t: L("Statistics", "الإحصاء"), ok: true, why: L("Statistics measures how sure we can be.", "الإحصاء يقيس مدى تأكدنا.") },
        { t: L("Machine learning", "تعلّم الآلة"), why: L("ML predicts; it does not tell you whether a difference is real.", "تعلّم الآلة يتنبأ؛ ولا يخبرك ما إذا كان الفرق حقيقيًا.") },
        { t: L("Artificial intelligence", "الذكاء الاصطناعي"), why: L("This is a classic statistics question.", "هذا سؤال إحصائي تقليدي.") }] },
    });
    draw();
    root.querySelector("#cmp-a").addEventListener("change", e => { st.a = e.target.value; draw(); });
    root.querySelector("#cmp-b").addEventListener("change", e => { st.b = e.target.value; draw(); });
  },
});

/* =====================================================================
   03 — How AI, ML and data science fit together
   ===================================================================== */
Lec.add({
  id: "ai-ml-data-science", num: 3, aliases: ["ai-ml"],
  title: { en: "How AI, ML and Data Science Fit Together", ar: "كيف يرتبط الذكاء الاصطناعي وتعلّم الآلة وعلم البيانات" },
  short: { en: "AI / ML / Data Science", ar: "الذكاء الاصطناعي / تعلّم الآلة" },
  summary: { en: "A simple map of the overlaps — and common myths.", ar: "خريطة بسيطة للتداخلات — والخرافات الشائعة." },
  render(root) {
    const st = getState("venn", { region: "ai" });
    const R = {
      ai: { c: "c1", t: L("Artificial Intelligence", "الذكاء الاصطناعي"), d: L("The biggest circle: any system doing tasks that need intelligence. It includes machine learning, but also rule-based systems, search and planning. So AI is <strong>broader</strong> than ML — not the same thing.", "الدائرة الأكبر: أي نظام يؤدي مهام تحتاج إلى ذكاء. يشمل تعلّم الآلة، وأيضًا الأنظمة القائمة على القواعد والبحث والتخطيط. لذا فالذكاء الاصطناعي <strong>أوسع</strong> من تعلّم الآلة — وليس الشيء نفسه.") },
      ml: { c: "c5", t: L("Machine Learning", "تعلّم الآلة"), d: L("Inside AI: computers learn patterns from examples instead of being given rules.", "داخل الذكاء الاصطناعي: تتعلم الحواسيب الأنماط من الأمثلة بدلًا من إعطائها قواعد.") },
      dl: { c: "c4", t: L("Deep Learning", "التعلّم العميق"), d: L("Inside ML: very large neural networks (used for images and chatbots). Usually not needed for small tables like ours.", "داخل تعلّم الآلة: شبكات عصبية كبيرة جدًا (تُستخدم للصور وروبوتات المحادثة). غالبًا لا حاجة إليها لجداول صغيرة مثل جدولنا.") },
      st: { c: "c3", t: L("Statistics", "الإحصاء"), d: L("The science of learning from data when there is uncertainty. It overlaps with ML and supports all the other fields.", "علم التعلّم من البيانات في ظل عدم اليقين. يتداخل مع تعلّم الآلة ويدعم كل المجالات الأخرى.") },
      ds: { c: "c2", t: L("Data Science", "علم البيانات"), d: L("A practical mix of statistics, programming, ML and domain knowledge. Not every data-science project uses ML.", "مزيج عملي من الإحصاء والبرمجة وتعلّم الآلة والمعرفة بالمجال. ليس كل مشروع علم بيانات يستخدم تعلّم الآلة.") },
      da: { c: "c6", t: L("Data Analysis", "تحليل البيانات"), d: L("Cleaning, summarising and charting data to answer specific questions — a core part of data science.", "تنظيف البيانات وتلخيصها ورسمها للإجابة عن أسئلة محددة — جزء أساسي من علم البيانات.") },
    };
    const region = (k, shape) => `<${shape} class="region f-${R[k].c}" data-region="${k}" fill-opacity=".16" style="stroke:var(--${R[k].c})" stroke-width="2" ${k === "ds" ? 'stroke-dasharray="7 5"' : ""} tabindex="0" role="button" aria-pressed="${st.region === k}" aria-label="${esc(R[k].t)}"/>`;
    const myths = [
      [L("“AI is simply machine learning.”", "«الذكاء الاصطناعي هو ببساطة تعلّم الآلة.»"), L("Myth — ML is only one part of AI.", "خرافة — تعلّم الآلة جزء واحد فقط من الذكاء الاصطناعي.")],
      [L("“Every data project needs machine learning.”", "«كل مشروع بيانات يحتاج إلى تعلّم الآلة.»"), L("Myth — many valuable projects only need clean data and good statistics.", "خرافة — كثير من المشاريع القيّمة تحتاج فقط إلى بيانات نظيفة وإحصاء جيد.")],
      [L("“Statistics and ML are unrelated.”", "«الإحصاء وتعلّم الآلة غير مرتبطين.»"), L("Myth — ML is built on statistical ideas.", "خرافة — تعلّم الآلة مبني على أفكار إحصائية.")],
    ];
    const cur = R[st.region];
    root.innerHTML = lesson(this, {
      simple: L("Think of nested and overlapping circles: <strong>AI</strong> is the biggest; <strong>machine learning</strong> sits inside it; <strong>statistics</strong> overlaps with ML; <strong>data science</strong> combines them in practice.",
        "فكّر في دوائر متداخلة: <strong>الذكاء الاصطناعي</strong> هو الأكبر؛ و<strong>تعلّم الآلة</strong> داخله؛ و<strong>الإحصاء</strong> يتداخل مع تعلّم الآلة؛ و<strong>علم البيانات</strong> يجمعها عمليًا."),
      steps: [
        { t: L("Start with AI", "ابدأ بالذكاء الاصطناعي"), d: L("Any system doing intelligent tasks — with or without learning from data.", "أي نظام يؤدي مهام ذكية — سواء تعلّم من البيانات أم لا.") },
        { t: L("Inside it: machine learning", "داخله: تعلّم الآلة"), d: L("The part of AI that learns from examples.", "الجزء من الذكاء الاصطناعي الذي يتعلم من الأمثلة.") },
        { t: L("Inside ML: deep learning", "داخل تعلّم الآلة: التعلّم العميق"), d: L("Very large neural networks.", "شبكات عصبية كبيرة جدًا.") },
        { t: L("Next to them: statistics", "بجانبها: الإحصاء"), d: L("Gives the tools for measuring uncertainty, and overlaps with ML.", "يقدّم أدوات قياس عدم اليقين، ويتداخل مع تعلّم الآلة.") },
        { t: L("Around them: data science and analysis", "حولها: علم البيانات والتحليل"), d: L("The practical work of using all of this on real questions.", "العمل العملي لاستخدام كل ذلك في أسئلة حقيقية.") },
      ],
      seeTitle: L("Explore the map (click any circle)", "استكشف الخريطة (انقر أي دائرة)"), codeHint: false,
      see: `<div class="venn-wrap"><div class="card venn"><svg viewBox="0 0 640 440" role="group" aria-label="${L("Relationship diagram", "مخطط العلاقات")}">
          ${region("ai", 'ellipse cx="215" cy="220" rx="200" ry="195"')}${region("ds", 'circle cx="455" cy="255" r="160"')}${region("st", 'circle cx="445" cy="140" r="105"')}
          ${region("ml", 'ellipse cx="270" cy="250" rx="125" ry="112"')}${region("da", 'circle cx="525" cy="335" r="78"')}${region("dl", 'ellipse cx="235" cy="285" rx="58" ry="50"')}
          <text x="70" y="95">${L("AI", "الذكاء الاصطناعي")}</text><text x="205" y="180">${L("Machine Learning", "تعلّم الآلة")}</text><text x="190" y="290">${L("Deep Learning", "التعلّم العميق")}</text>
          <text x="455" y="95">${L("Statistics", "الإحصاء")}</text><text x="470" y="250">${L("Data Science", "علم البيانات")}</text><text x="478" y="345">${L("Data Analysis", "تحليل البيانات")}</text></svg></div>
        <div class="card" aria-live="polite"><span class="badge" style="background:var(--${cur.c});color:#fff;border:0">${L("Selected", "المحدد")}</span><h3 class="mt-1">${cur.t}</h3><p class="mb-0">${cur.d}</p></div></div>
        <h3 class="mt-3">${L("Myth or fact?", "خرافة أم حقيقة؟")}</h3><div class="grid grid-3">${myths.map(([c, a]) => `<button type="button" class="flip" aria-expanded="false"><span class="claim">${c}</span><span class="answer">${a}</span></button>`).join("")}</div>`,
      remember: L("AI is broader than ML. ML relies on statistics. Data science puts them to work.", "الذكاء الاصطناعي أوسع من تعلّم الآلة. وتعلّم الآلة يعتمد على الإحصاء. وعلم البيانات يضعها موضع التطبيق."),
      quiz: { q: L("Is a simple rule like “alert if glucose > 300” an example of AI?", "هل قاعدة بسيطة مثل «نبّه إذا كان السكر > 300» مثال على الذكاء الاصطناعي؟"), options: [
        { t: L("Yes — a rule-based system, which is part of AI (but not machine learning)", "نعم — نظام قائم على القواعد، وهو جزء من الذكاء الاصطناعي (لكنه ليس تعلّم آلة)"), ok: true, why: L("Rule-based systems are a classic branch of AI; nothing is learned from data.", "الأنظمة القائمة على القواعد فرع تقليدي من الذكاء الاصطناعي؛ ولا يُتعلَّم فيها شيء من البيانات.") },
        { t: L("No — only machine learning counts as AI", "لا — تعلّم الآلة فقط يُعدّ ذكاءً اصطناعيًا"), why: L("That is the myth: AI is broader than ML.", "هذه هي الخرافة: الذكاء الاصطناعي أوسع من تعلّم الآلة.") }] },
    });
    const pick = k => { st.region = k; this.render(root); const el = root.querySelector(`[data-region="${k}"]`); if (el) el.focus(); };
    root.querySelectorAll("[data-region]").forEach(el => {
      if (el.dataset.region === st.region) el.classList.add("active");
      el.addEventListener("click", () => pick(el.dataset.region));
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(el.dataset.region); } });
    });
    root.querySelectorAll(".flip").forEach(b => b.addEventListener("click", () => b.setAttribute("aria-expanded", String(b.getAttribute("aria-expanded") !== "true"))));
  },
});

/* =====================================================================
   04 — Asking the right questions
   ===================================================================== */
Lec.add({
  id: "analytical-questions", num: 4, aliases: ["questions"],
  title: { en: "Asking the Right Questions", ar: "طرح الأسئلة الصحيحة" },
  short: { en: "Analytical questions", ar: "الأسئلة التحليلية" },
  summary: { en: "Five levels of questions — and association vs. causation.", ar: "خمسة مستويات من الأسئلة — والارتباط مقابل السببية." },
  render(root) {
    const d = SD(), f = facts(), gm = d.eda.group_means, c = f.counts, n = c.Low + c.Moderate + c.High, hr = d.hypothesis.heart_rate_smoking;
    const st = getState("q", { quiz: {} });
    const quiz = [
      { s: L(`“In our data, people with higher BMI tend to have higher glucose.”`, `«في بياناتنا، يميل الأشخاص ذوو BMI الأعلى إلى سكر أعلى.»`), ok: "assoc" },
      { s: L("“Smokers have a higher heart rate, so smoking raises heart rate.”", "«المدخنون نبضهم أعلى، إذن التدخين يرفع النبض.»"), ok: "causal" },
      { s: L("“People who visit more often have higher risk scores, so fewer visits would lower risk.”", "«من يزورون أكثر لديهم درجات خطورة أعلى، إذن تقليل الزيارات يخفض الخطورة.»"), ok: "causal" },
    ];
    root.innerHTML = lesson(this, {
      simple: L("Good analysis starts with a clear question. Questions go up in five levels — from “what happened?” to “what should we do?”. Each level needs stronger methods and more careful wording.",
        "التحليل الجيد يبدأ بسؤال واضح. تتدرج الأسئلة في خمسة مستويات — من «ماذا حدث؟» إلى «ماذا يجب أن نفعل؟». وكل مستوى يحتاج طرقًا أقوى وصياغة أكثر حذرًا."),
      stepsTitle: L("The five levels — answered with our data", "المستويات الخمسة — مُجابة ببياناتنا"),
      steps: [
        { t: L("1 · Descriptive — What happened?", "1 · وصفي — ماذا حدث؟"), d: L("Count and summarise.", "العدّ والتلخيص."), ex: L(`${fmtInt(n)} patients: ${fmt(100 * c.High / n, 0)}% in the “High” teaching group`, `${fmtInt(n)} مريضًا: ${fmt(100 * c.High / n, 0)}% في المجموعة التعليمية «مرتفعة»`) },
        { t: L("2 · Diagnostic — Why might it happen?", "2 · تشخيصي — لماذا قد يحدث؟"), d: L("Compare groups to find possible explanations.", "قارن المجموعات لإيجاد تفسيرات محتملة."), ex: L(`“High” group is older on average: ${fmt(gm.High.age, 0)} vs ${fmt(gm.Low.age, 0)} years`, `المجموعة «المرتفعة» أكبر سنًا في المتوسط: ${fmt(gm.High.age, 0)} مقابل ${fmt(gm.Low.age, 0)} سنة`) },
        { t: L("3 · Statistical — Is it real?", "3 · إحصائي — هل هو حقيقي؟"), d: L("Test whether a difference could be chance.", "اختبر ما إذا كان الفرق قد يكون صدفة."), ex: L(`smokers' heart rate is ${fmt(hr.mean_difference, 1)} bpm higher — very unlikely to be chance`, `نبض المدخنين أعلى بـ ${fmt(hr.mean_difference, 1)} نبضة/دقيقة — ومن غير المرجح أن يكون صدفة`) },
        { t: L("4 · Predictive — What might happen?", "4 · تنبؤي — ماذا قد يحدث؟"), d: L("Use patterns to predict new cases.", "استخدم الأنماط للتنبؤ بحالات جديدة."), ex: L(`a model gets the teaching label right ${fmt(f.gbAcc * 100, 0)}% of the time`, `نموذج يصيب التسمية التعليمية ${fmt(f.gbAcc * 100, 0)}% من الوقت`) },
        { t: L("5 · Operational — What should we do?", "5 · تشغيلي — ماذا يجب أن نفعل؟"), d: L("Turn evidence into plans.", "حوّل الأدلة إلى خطط."), ex: L(`plan for ≈ ${fmtInt(f.fcTotal)} screening visits next year`, `خطّط لنحو ${fmtInt(f.fcTotal)} زيارة فحص العام القادم`) },
      ],
      seeTitle: L("Practice: association or cause?", "تدريب: ارتباط أم سبب؟"), codeHint: false,
      seeNote: L("“Association” means two things move together. “Cause” means one makes the other happen. Our data can show associations; it cannot prove causes, because nobody was randomly assigned to smoke, exercise or visit. Decide for each sentence:",
        "«الارتباط» يعني أن شيئين يتحركان معًا. و«السبب» يعني أن أحدهما يُحدث الآخر. بياناتنا يمكن أن تُظهر ارتباطات؛ لكنها لا تُثبت أسبابًا، لأن أحدًا لم يُعيَّن عشوائيًا للتدخين أو الرياضة أو الزيارة. قرّر لكل جملة:"),
      see: `<div class="stack">${quiz.map((q, i) => { const a = st.quiz[i]; return `<div class="card"><p><strong>${q.s}</strong></p><div class="grid grid-2">
          <button type="button" class="quiz-option ${a ? (q.ok === "assoc" ? "correct" : a === "assoc" ? "wrong" : "") : ""}" data-aq="${i}" data-ans="assoc">${L("A fair association statement", "عبارة ارتباط مقبولة")}</button>
          <button type="button" class="quiz-option ${a ? (q.ok === "causal" ? "correct" : a === "causal" ? "wrong" : "") : ""}" data-aq="${i}" data-ans="causal">${L("A cause claim we cannot prove", "ادعاء سبب لا يمكننا إثباته")}</button></div>
          ${a ? `<p class="feedback">${a === q.ok ? "✅" : "❌"} ${q.ok === "assoc" ? L("It only says the two move together.", "إنها تقول فقط إن الاثنين يتحركان معًا.") : L("It claims one thing causes another. Other factors (age, habits) or reverse direction could explain it.", "إنها تدّعي أن شيئًا يسبب آخر. وقد تفسّره عوامل أخرى (العمر، العادات) أو اتجاه معكوس.")}</p>` : ""}</div>`; }).join("")}</div>`,
      remember: L("Say “is associated with”, not “causes”, unless a properly designed study shows the cause.", "قل «مرتبط بـ» وليس «يسبب»، ما لم تُظهر دراسة مصممة بشكل صحيح السبب."),
    });
    root.querySelectorAll("[data-aq]").forEach(b => b.addEventListener("click", () => { st.quiz[b.dataset.aq] = b.dataset.ans; this.render(root); root.querySelector(`[data-aq="${b.dataset.aq}"][data-ans="${b.dataset.ans}"]`).focus(); }));
  },
});

/* =====================================================================
   05 — Our tools: Python in plain words
   ===================================================================== */
Lec.add({
  id: "python", num: 5, aliases: ["python-for-medical-data", "tools"],
  title: { en: "Our Tools: Python in Plain Words", ar: "أدواتنا: بايثون بكلمات بسيطة" },
  short: { en: "Our tools (Python)", ar: "أدواتنا (بايثون)" },
  summary: { en: "What each tool does, and a first look at the data table.", ar: "ماذا تفعل كل أداة، ونظرة أولى على جدول البيانات." },
  render(root) {
    const rows = Data.clean(), cols = SD().clean.columns;
    const show = ["patient_id", "visit_date", "clinic_id", "age", "sex", "bmi", "systolic_bp", "fasting_glucose", "hba1c", "smoking_status", "risk_group"];
    const typeOf = c => { const v = rows.find(r => r[c] != null)?.[c]; return typeof v === "number" ? (rows.some(r => r[c] != null && !Number.isInteger(r[c])) ? L("decimal number", "رقم عشري") : L("whole number", "رقم صحيح")) : c === "visit_date" ? L("date", "تاريخ") : L("text / category", "نص / فئة"); };
    const info = cols.map(c => { const nn = rows.filter(r => r[c] != null).length; return [`<code>${c}</code>`, typeOf(c), fmtInt(nn), nn < rows.length ? `<span class="badge warn">${rows.length - nn}</span>` : "0"]; });
    root.innerHTML = lesson(this, {
      simple: L("All the work in this lecture was done with <strong>Python</strong>, a free programming language, and a few add-on “libraries”. You don't need to code to follow along — think of them as very precise, repeatable spreadsheets.",
        "كل العمل في هذه المحاضرة أُنجز بلغة <strong>بايثون</strong> المجانية وبعض «المكتبات» الإضافية. لا تحتاج إلى البرمجة للمتابعة — فكّر فيها كجداول بيانات دقيقة جدًا وقابلة للتكرار."),
      why: [L("A script gives the same answer every time — no manual copy-paste errors.", "السكربت يعطي الإجابة نفسها في كل مرة — بلا أخطاء نسخ ولصق يدوية."), L("Every step is written down, so anyone can check it.", "كل خطوة مكتوبة، فيمكن لأي شخص التحقق منها.")],
      stepsTitle: L("The tools and what they do", "الأدوات وماذا تفعل"),
      steps: [
        { t: "pandas", d: L("Works with tables: load, clean, filter, group.", "يعمل مع الجداول: التحميل والتنظيف والتصفية والتجميع."), ex: `<code>pd.read_csv("clean_patient_screening_data.csv")</code>` },
        { t: "NumPy", d: L("Fast maths on lists of numbers.", "رياضيات سريعة على قوائم الأرقام."), ex: `<code>np.median(glucose)</code>` },
        { t: "SciPy / statsmodels", d: L("Statistical tests, confidence intervals and forecasting.", "الاختبارات الإحصائية وفترات الثقة والتوقع."), ex: `<code>ttest_ind(group_a, group_b)</code>` },
        { t: "scikit-learn", d: L("Machine-learning models and their evaluation.", "نماذج تعلّم الآلة وتقييمها."), ex: `<code>RandomForestClassifier().fit(X, y)</code>` },
        { t: "Matplotlib", d: L("Charts. (On this website the charts are drawn live in your browser instead.)", "الرسوم البيانية. (في هذا الموقع تُرسم الرسوم مباشرة في متصفحك بدلًا من ذلك.)"), ex: `<code>plt.hist(glucose)</code>` },
      ],
      seeTitle: L("A first look at the clean data table", "نظرة أولى على جدول البيانات المنظّف"),
      seeNote: L(`This is what a data table looks like to Python: rows are patients, columns are measurements. Below: the first 8 of ${fmtInt(rows.length)} rows, then a summary of every column.`, `هكذا يبدو جدول البيانات لبايثون: الصفوف مرضى والأعمدة قياسات. أدناه: أول 8 من أصل ${fmtInt(rows.length)} صفًا، ثم ملخص لكل عمود.`),
      see: `${withCode("s5-head", Snip.head(show), miniTable(show.map(c => `<code>${c}</code>`), rows.slice(0, 8).map(r => show.map(c => fmtCell(r[c])))))}
        <h3 class="mt-3">${L("Column summary", "ملخص الأعمدة")}</h3>${withCode("s5-info", Snip.columnSummary(), miniTable([L("Column", "العمود"), L("Type", "النوع"), { t: L("Values present", "القيم الموجودة"), num: true }, { t: L("Missing", "المفقود"), num: true }], info, { maxH: 360 }))}`,
      results: `<ul><li>${L(`The table has ${fmtInt(rows.length)} rows (patients) and ${cols.length} columns (measurements).`, `يحتوي الجدول على ${fmtInt(rows.length)} صفًا (مريضًا) و${cols.length} عمودًا (قياسًا).`)}</li>
        <li>${L("Each column has one type: numbers, dates or categories. Cleaning made sure of that.", "لكل عمود نوع واحد: أرقام أو تواريخ أو فئات. والتنظيف ضمن ذلك.")}</li>
        <li>${L("Some columns still have missing values — Section 08 explains how to handle them.", "ما زالت بعض الأعمدة تحوي قيمًا مفقودة — يشرح القسم 08 كيفية التعامل معها.")}</li></ul>`,
      code: { code: `import pandas as pd

df = pd.read_csv("data/clean_patient_screening_data.csv")
df.head(8)          # the first 8 rows
df.info()           # every column: type and number of values present`, result: L(`A table of ${fmtInt(rows.length)} rows × ${cols.length} columns — exactly the two tables shown above.`, `جدول من ${fmtInt(rows.length)} صفًا × ${cols.length} عمودًا — وهما الجدولان المعروضان أعلاه تمامًا.`) },
      remember: L("Python turns analysis into a written recipe: clear, repeatable and checkable.", "بايثون يحوّل التحليل إلى وصفة مكتوبة: واضحة وقابلة للتكرار والتحقق."),
    });
  },
});

/* =====================================================================
   06 — Checking data quality
   ===================================================================== */
Lec.add({
  id: "data-quality", num: 6, aliases: ["quality"],
  title: { en: "Checking Data Quality", ar: "فحص جودة البيانات" },
  short: { en: "Data quality", ar: "جودة البيانات" },
  summary: { en: "Six simple checks — and the real problems in our raw file.", ar: "ستة فحوص بسيطة — والمشكلات الحقيقية في ملفنا الخام." },
  render(root) {
    const d = SD(), q = d.quality, s = q.summary;
    const adh = q.columns.find(c => c.column === "medication_adherence_pct");
    const worst = q.columns.slice().sort((a, b) => (b.missing_pct + b.format_issues / 12 + b.invalid_values) - (a.missing_pct + a.format_issues / 12 + a.invalid_values)).slice(0, 10);
    root.innerHTML = lesson(this, {
      simple: L("Data quality means asking six simple questions about the data: Is anything <strong>missing</strong>? <strong>Repeated</strong>? <strong>Impossible</strong>? Written <strong>inconsistently</strong>? <strong>Wrong</strong>? <strong>Out of date</strong>?",
        "جودة البيانات تعني طرح ستة أسئلة بسيطة على البيانات: هل هناك شيء <strong>مفقود</strong>؟ <strong>مكرر</strong>؟ <strong>مستحيل</strong>؟ مكتوب <strong>بشكل غير متسق</strong>؟ <strong>خاطئ</strong>؟ <strong>قديم</strong>؟"),
      why: [L("Every chart and model inherits the problems of its data.", "كل رسم ونموذج يرث مشكلات بياناته."), L("Measuring problems is the first step to fixing them at the source.", "قياس المشكلات هو الخطوة الأولى لإصلاحها من المصدر.")],
      stepsTitle: L("The six checks — with what we found", "الفحوص الستة — مع ما وجدناه"),
      steps: [
        { t: L("Completeness — is anything missing?", "الاكتمال — هل هناك مفقود؟"), d: L("Count empty cells and words like “NA”, “null”, “?”.", "عدّ الخلايا الفارغة وكلمات مثل «NA» و«null» و«?»."), ex: L(`${s.completeness_pct}% of cells are filled; medication adherence is missing in ${fmt(adh.missing_pct, 1)}% of rows`, `${s.completeness_pct}% من الخلايا ممتلئة؛ والالتزام بالدواء مفقود في ${fmt(adh.missing_pct, 1)}% من الصفوف`) },
        { t: L("Uniqueness — is anything repeated?", "التفرّد — هل هناك تكرار؟"), d: L("Look for identical rows and the same patient on the same date.", "ابحث عن صفوف متطابقة والمريض نفسه في التاريخ نفسه."), ex: L(`${s.exact_duplicates} identical rows; ${s.key_duplicates} repeats of patient + date`, `${s.exact_duplicates} صفًا متطابقًا؛ ${s.key_duplicates} تكرارًا لمريض + تاريخ`) },
        { t: L("Validity — is anything impossible?", "الصلاحية — هل هناك مستحيل؟"), d: L("Compare each value with a sensible range.", "قارن كل قيمة بنطاق معقول."), ex: L("age 999, heart rate −72, risk score 105", "عمر 999، نبض −72، درجة خطورة 105") },
        { t: L("Consistency — is the same thing written the same way?", "الاتساق — هل يُكتب الشيء نفسه بالطريقة نفسها؟"), d: L("List every spelling used for each category.", "اسرد كل تهجئة مستخدمة لكل فئة."), ex: `${s.raw_sex_labels.filter(Boolean).slice(0, 8).map(v => `<span class="chip">${esc(v)}</span>`).join("")} → ${L("just Male / Female", "فقط Male / Female")}` },
        { t: L("Accuracy — is the value right?", "الدقة — هل القيمة صحيحة؟"), d: L("Unusual but possible values need checking at the source, not deleting.", "القيم غير المعتادة لكن الممكنة تحتاج تحققًا من المصدر، لا حذفًا."), ex: L(`${d.outliers.count} unusual values flagged for review`, `${d.outliers.count} قيمة غير معتادة وُسمت للمراجعة`) },
        { t: L("Timeliness — are the dates sensible?", "الآنية — هل التواريخ معقولة؟"), d: L("Dates must exist and must not be in the future.", "يجب أن تكون التواريخ موجودة وألا تكون في المستقبل."), ex: L(`${s.invalid_dates} impossible dates, e.g. 2024-02-30 or 2031-06-01`, `${s.invalid_dates} تواريخ مستحيلة، مثل 2024-02-30 أو 2031-06-01`) },
      ],
      seeTitle: L("The quality report for our raw file", "تقرير الجودة لملفنا الخام"),
      seeNote: L("The 10 columns with the most problems. “Format issues” = values not written in the standard way (like “110 mg/dL” or “M”).", "الأعمدة العشرة الأكثر مشكلات. «مشكلات التنسيق» = قيم غير مكتوبة بالطريقة القياسية (مثل «110 mg/dL» أو «M»)."),
      see: `<div class="grid grid-4">${kpi(L("Rows", "الصفوف"), fmtInt(s.rows), "", "", Snip.rawShape(`${fmtInt(s.rows)} × ${s.columns}`))}${kpi(L("Cells filled", "الخلايا الممتلئة"), fmtPct(s.completeness_pct), "", "accent", Snip.completeness(fmtPct(s.completeness_pct)))}${kpi(L("Duplicate rows", "الصفوف المكررة"), s.exact_duplicates, "", "warn", Snip.duplicates(s.exact_duplicates))}${kpi(L("Impossible dates", "تواريخ مستحيلة"), s.invalid_dates, "", "danger", Snip.invalidDates(s.invalid_dates))}</div>
        <div class="mt-2">${withCode("s6-report", Snip.qualityReport(), miniTable([L("Column", "العمود"), { t: L("Missing %", "نسبة المفقود"), num: true }, { t: L("Format issues", "مشكلات التنسيق"), num: true }, { t: L("Impossible values", "قيم مستحيلة"), num: true }],
          worst.map(c => [`<code>${c.column}</code>`, `${fmt(c.missing_pct, 1)}%`, c.format_issues ? `<span class="badge warn">${c.format_issues}</span>` : "0", c.invalid_values ? `<span class="badge danger">${c.invalid_values}</span>` : "0"])))}</div>
        <h3 class="mt-3">${L("Look through the raw rows yourself", "تصفّح الصفوف الخام بنفسك")}</h3>
        <p class="small muted">${L("Red ∅ = missing. Orange = a format problem or an impossible value. Tick “Only rows with issues” or switch to the clean version to compare.", "∅ الأحمر = مفقود. البرتقالي = مشكلة تنسيق أو قيمة مستحيلة. فعّل «الصفوف التي بها مشكلات فقط» أو بدّل إلى النسخة المنظّفة للمقارنة.")}</p>
        <div class="card">${withCode("s6-ex", Snip.explorer(), `<div id="dq-explorer"></div>`)}</div>`,
      results: `<ul><li>${L("Almost every row has at least one small problem — that is normal for raw operational data.", "كل صف تقريبًا فيه مشكلة صغيرة واحدة على الأقل — وهذا طبيعي في البيانات التشغيلية الخام.")}</li>
        <li>${L("Most problems are about <strong>how</strong> things are written (formats, spellings), not about wrong values. These are easy to fix with rules.", "معظم المشكلات تتعلق <strong>بطريقة</strong> الكتابة (التنسيقات والتهجئات)، لا بقيم خاطئة. ومن السهل إصلاحها بالقواعد.")}</li>
        <li>${L("Missing adherence values are the most worrying: they are more common for patients with poor adherence (Section 08).", "قيم الالتزام المفقودة هي الأكثر إثارة للقلق: فهي أكثر شيوعًا لدى المرضى ذوي الالتزام الضعيف (القسم 08).")}</li></ul>`,
      code: { code: `raw = pd.read_csv("data/messy_patient_screening_data.csv", dtype=str, keep_default_na=False)
missing_words = {"", "na", "n/a", "null", "?", "unknown"}
missing = raw.apply(lambda col: col.str.strip().str.lower().isin(missing_words))
print((missing.mean() * 100).round(1))      # % missing per column
print(raw.duplicated().sum())               # identical rows
print(sorted(raw["sex"].unique()))          # every spelling of "sex"`,
        result: L(`Missing % per column (as in the table above), ${s.exact_duplicates} identical rows, and ${s.raw_sex_labels.length} different spellings of “sex”.`, `نسبة المفقود لكل عمود (كما في الجدول أعلاه)، و${s.exact_duplicates} صفًا متطابقًا، و${s.raw_sex_labels.length} تهجئة مختلفة لـ«الجنس».`) },
      remember: L("Measure quality before analysing. If you don't measure it, you can't manage it.", "قِس الجودة قبل التحليل. ما لا تقيسه لا يمكنك إدارته."),
      quiz: { q: L("A cell says “110 mg/dL”. Which quality problem is this?", "خلية تقول «110 mg/dL». ما مشكلة الجودة هذه؟"), options: [
        { t: L("Format / consistency — a number stored together with text", "تنسيق / اتساق — رقم مخزَّن مع نص"), ok: true, why: L("The value is fine; the way it is written stops the computer from treating it as a number.", "القيمة سليمة؛ لكن طريقة كتابتها تمنع الحاسوب من التعامل معها كرقم.") },
        { t: L("A duplicate", "تكرار"), why: L("Duplicates are repeated rows.", "التكرارات صفوف مكررة.") },
        { t: L("An impossible value", "قيمة مستحيلة"), why: L("110 mg/dL is a perfectly possible glucose value.", "110 ملغ/دل قيمة سكر ممكنة تمامًا.") }] },
    });
    Explorer.mount(root.querySelector("#dq-explorer"), { dataset: "messy", hidden: ["exercise_days_per_week", "visits_last_year", "follow_up_days", "total_cholesterol", "heart_rate", "diastolic_bp", "medication_adherence_pct"] });
  },
});

/* =====================================================================
   07 — Cleaning the data
   ===================================================================== */
const RULE_TEXT = {
  split_bp: { en: "Split “systolic/diastolic” into two numbers", ar: "فصل «انقباضي/انبساطي» إلى رقمين" },
  strip_unit: { en: "Remove the unit text, keep the number", ar: "إزالة نص الوحدة والإبقاء على الرقم" },
  mmol_convert: { en: "Convert mmol/L to mg/dL (× 18.016)", ar: "تحويل mmol/L إلى mg/dL (× 18.016)" },
  strip_percent: { en: "Remove the % sign", ar: "إزالة علامة %" },
  comma_decimal: { en: "Use a point, not a comma, for decimals", ar: "استخدام النقطة لا الفاصلة في الكسور العشرية" },
  out_of_range: { en: "Impossible value → mark as missing (never guess)", ar: "قيمة مستحيلة ← تُوسم كمفقودة (لا تخمين أبدًا)" },
  map_sex: { en: "Translate codes into Male / Female", ar: "ترجمة الرموز إلى Male / Female" },
  map_smoking: { en: "Yes/Y/1 → Smoker; No/N/0/never → Non-Smoker", ar: "Yes/Y/1 ← Smoker؛ No/N/0/never ← Non-Smoker" },
  map_bool: { en: "TRUE/Yes → 1; FALSE/No → 0", ar: "TRUE/Yes ← 1؛ FALSE/No ← 0" },
  clinic_code: { en: "Write every clinic as CL + two digits", ar: "كتابة كل عيادة بصيغة CL + رقمين" },
  parse_date: { en: "Rewrite the date as YYYY-MM-DD", ar: "إعادة كتابة التاريخ بصيغة YYYY-MM-DD" },
  invalid_date: { en: "Date that cannot exist → missing", ar: "تاريخ لا يمكن أن يوجد ← مفقود" },
  map_risk: { en: "Fix spaces, capitals and abbreviations", ar: "إصلاح المسافات والأحرف الكبيرة والاختصارات" },
  placeholder: { en: "Words like NA / null / ? → missing", ar: "كلمات مثل NA / null / ? ← مفقود" },
};
Lec.add({
  id: "data-cleaning", num: 7, aliases: ["cleaning"],
  title: { en: "Cleaning the Data", ar: "تنظيف البيانات" },
  short: { en: "Data cleaning", ar: "تنظيف البيانات" },
  summary: { en: "Dirty value → clear rule → clean value. Try it yourself.", ar: "قيمة غير نظيفة ← قاعدة واضحة ← قيمة نظيفة. جرّبها بنفسك." },
  render(root) {
    const d = SD(), ex = d.cleaningExamples, st = getState("clean", { i: 0, val: "138/88", rule: "bp" });
    const tryRules = [["bp", L("Blood pressure", "ضغط الدم")], ["glucose", L("Glucose", "السكر")], ["hba1c", "HbA1c"], ["bmi", "BMI"], ["age", L("Age", "العمر")], ["sex", L("Sex", "الجنس")], ["smoking", L("Smoking", "التدخين")], ["bool", L("Family history", "التاريخ العائلي")], ["clinic", L("Clinic", "العيادة")], ["date", L("Visit date", "تاريخ الزيارة")], ["risk", L("Risk group", "مجموعة الخطورة")]];
    const raw = Data.messy(), clean = Data.clean();
    const pick = raw.find(r => String(r.systolic_bp).includes("/") && /mg|mmol/.test(r.fasting_glucose) && /%/.test(r.hba1c)) || raw[0];
    const after = clean.find(r => r.patient_id === String(pick.patient_id).trim().toUpperCase()) || {};
    const showCols = ["visit_date", "clinic_id", "age", "sex", "systolic_bp", "diastolic_bp", "fasting_glucose", "hba1c", "smoking_status", "family_history_flag", "risk_group"];
    const cur = ex[st.i];
    const removed = d.cleaningLog.filter(r => r.step === 10).reduce((a, r) => a + r.rows_affected, 0);
    root.innerHTML = lesson(this, {
      simple: L("Cleaning means applying small, clear rules that turn messy values into one standard form. If a value is impossible, we mark it as <strong>missing</strong> — we never guess a replacement.",
        "التنظيف يعني تطبيق قواعد صغيرة وواضحة تحوّل القيم غير المنظمة إلى صيغة قياسية واحدة. وإذا كانت القيمة مستحيلة نوسمها <strong>مفقودة</strong> — ولا نخمّن بديلًا أبدًا."),
      why: [L("The computer can only count “Male” correctly if every row says “Male”.", "لا يستطيع الحاسوب عدّ «Male» بشكل صحيح إلا إذا كانت كل الصفوف تقول «Male»."), L("Written rules can be checked and repeated next month.", "القواعد المكتوبة يمكن التحقق منها وتكرارها الشهر القادم.")],
      stepsTitle: L("The cleaning process — step by step", "عملية التنظيف — خطوة بخطوة"),
      steps: [
        { t: L("Tidy the text", "ترتيب النص"), d: L("Remove extra spaces and turn placeholder words into “missing”.", "إزالة المسافات الزائدة وتحويل الكلمات البديلة إلى «مفقود»."), ex: `<span class="mono">" Male"</span> → <span class="mono">"Male"</span> · <span class="mono">"NA"</span> → ${L("missing", "مفقود")}` },
        { t: L("Use one code for one meaning", "رمز واحد لمعنى واحد"), d: L("Translate every spelling to a standard label.", "ترجمة كل تهجئة إلى تسمية قياسية."), ex: `<span class="mono">M, m, male, MALE</span> → <span class="mono">Male</span>` },
        { t: L("Split and convert numbers", "فصل الأرقام وتحويلها"), d: L("Separate combined values, remove units, convert to one unit.", "فصل القيم المركّبة، وإزالة الوحدات، والتحويل إلى وحدة واحدة."), ex: `<span class="mono">"138/88"</span> → 138 · 88 &nbsp;|&nbsp; <span class="mono">"6.1 mmol/L"</span> → 110 mg/dL` },
        { t: L("Check sensible ranges", "التحقق من النطاقات المعقولة"), d: L("Anything impossible becomes missing.", "كل ما هو مستحيل يصبح مفقودًا."), ex: L("age 999 → missing · heart rate −72 → missing", "العمر 999 ← مفقود · النبض −72 ← مفقود") },
        { t: L("Remove duplicates", "إزالة التكرارات"), d: L("Keep one record per patient visit.", "الاحتفاظ بسجل واحد لكل زيارة مريض."), ex: L(`${removed} duplicate rows removed`, `أُزيل ${removed} صفًا مكررًا`) },
        { t: L("Write everything down", "تدوين كل شيء"), d: L("A log records each rule and how many rows it changed.", "سجلّ يدوّن كل قاعدة وعدد الصفوف التي غيّرتها."), ex: L(`${fmtInt(d.quality.summary.rows)} rows in → ${fmtInt(d.clean.rows.length)} rows out`, `${fmtInt(d.quality.summary.rows)} صفًا داخل ← ${fmtInt(d.clean.rows.length)} صفًا خارج`) },
      ],
      seeTitle: L("Real examples from our raw file", "أمثلة حقيقية من ملفنا الخام"),
      see: `<div class="example-list" role="group" aria-label="${L("Examples", "الأمثلة")}">${ex.map((e, i) => `<button type="button" data-ex="${i}" aria-pressed="${i === st.i}">${esc(e.column)}: ${esc(e.raw === "" ? "∅" : e.raw)}</button>`).join("")}</div>
        <div class="mt-2">${withCode("s7-ex", Snip.cleanValue(cur.column, cur.raw, esc(cur.clean)), `<div class="transform-row" aria-live="polite">
          <div class="transform-cell dirty"><span class="k">${L("Dirty value", "القيمة غير النظيفة")}</span><span class="v">"${esc(cur.raw)}"</span></div><span class="transform-arrow">${ICON.arrowR}</span>
          <div class="transform-cell rule"><span class="k">${L("Rule", "القاعدة")}</span><span>${LT(RULE_TEXT[cur.rule])}</span></div><span class="transform-arrow">${ICON.arrowR}</span>
          <div class="transform-cell cleanv"><span class="k">${L("Clean value", "القيمة النظيفة")}</span><span class="v">${esc(cur.clean)}</span></div></div>`)}</div>
        <h3 class="mt-3">${L("Try it yourself", "جرّب بنفسك")}</h3>
        <div class="controls">${selectEl("try-rule", tryRules.map(([v, lb]) => ({ value: v, label: lb })), st.rule, L("Which column?", "أي عمود؟"))}
          <div class="field" style="flex:1 1 220px"><label for="try-val">${L("Type any messy value", "اكتب أي قيمة غير نظيفة")}</label><input type="text" id="try-val" value="${esc(st.val)}" autocomplete="off" spellcheck="false"></div></div>
        <div class="coded mt-2">${codeChip("s7-try")}<div class="transform-row"><div class="transform-cell dirty"><span class="k">${L("You typed", "كتبت")}</span><span class="v" id="try-in"></span></div><span class="transform-arrow">${ICON.arrowR}</span>
          <div class="transform-cell rule"><span class="k">${L("Rule", "القاعدة")}</span><span>${L("The same rules used for the whole file", "القواعد نفسها المستخدمة للملف كله")}</span></div><span class="transform-arrow">${ICON.arrowR}</span>
          <div class="transform-cell cleanv"><span class="k">${L("Result", "النتيجة")}</span><span class="v" id="try-out" aria-live="polite"></span></div></div></div>
        <p class="small muted mt-1">${L("Ideas: “6.1 mmol/L”, “ HIGH ”, “Clinic 3”, “31/04/2024”, “-72”, “27,4”, “never”.", "أفكار: «6.1 mmol/L» و« HIGH » و«Clinic 3» و«31/04/2024» و«-72» و«27,4» و«never».")}</p>
        <h3 class="mt-3">${L("One real record: before and after", "سجل حقيقي واحد: قبل وبعد")}</h3>
        ${withCode("s7-ba", Snip.beforeAfter(String(pick.patient_id).trim().toUpperCase()), miniTable([L("Column", "العمود"), L("Before (raw)", "قبل (خام)"), L("After (clean)", "بعد (منظّف)")], showCols.map(c => [`<code>${c}</code>`, CleanRules.isMiss(pick[c]) ? null : `<span class="mono ${String(pick[c] ?? "") !== String(after[c] ?? "") ? "cell-suspect" : ""}">${esc(String(pick[c]).replace(/ /g, "␠"))}</span>`, after[c] == null ? null : `<strong class="mono">${esc(after[c])}</strong>`])))}`,
      results: `<ul><li>${L(`After cleaning: ${fmtInt(d.clean.rows.length)} unique rows where every column uses one format.`, `بعد التنظيف: ${fmtInt(d.clean.rows.length)} صفًا فريدًا يستخدم فيه كل عمود صيغة واحدة.`)}</li>
        <li>${L("Nothing impossible was “fixed” by guessing — it became missing, so we know exactly what we don't know.", "لم يُ«صلَح» أي شيء مستحيل بالتخمين — بل أصبح مفقودًا، فنعرف بالضبط ما لا نعرفه.")}</li>
        <li>${L("Unusual-but-possible values (e.g. glucose 380) were kept and flagged for review.", "القيم غير المعتادة لكن الممكنة (مثل سكر 380) احتُفظ بها ووُسمت للمراجعة.")}</li></ul>`,
      code: { code: `def parse_bp(value):
    """'138/88' -> (138, 88)"""
    if "/" in value:
        systolic, diastolic = value.split("/")
        return float(systolic), float(diastolic)
    return float(value), None

sex_codes = {"male": "Male", "m": "Male", "female": "Female", "f": "Female"}
df["sex"] = df["sex"].str.strip().str.lower().map(sex_codes)     # unknown codes -> missing
df["age"] = df["age"].where(df["age"].between(18, 100))         # impossible -> missing
df = df.drop_duplicates()`,
        result: miniTable([{ t: L("Step", "الخطوة"), num: true }, L("Column", "العمود"), L("Rule", "القاعدة"), { t: L("Rows changed", "الصفوف المتغيرة"), num: true }], d.cleaningLog.filter(r => r.step >= 2 && r.step <= 10).slice(0, 14).map(r => [r.step, `<code>${esc(r.column)}</code>`, `<span class="ltr">${esc(r.rule)}</span>`, fmtInt(r.rows_affected)]), { maxH: 300 }) },
      remember: L("Clean with written rules. Impossible → missing. Never guess.", "نظّف بقواعد مكتوبة. المستحيل ← مفقود. لا تخمّن أبدًا."),
      quiz: { q: L("A record says age = 999. What should cleaning do?", "سجل يقول العمر = 999. ماذا يجب أن يفعل التنظيف؟"), options: [
        { t: L("Replace it with the average age", "استبداله بمتوسط العمر"), why: L("That invents data and hides the problem.", "هذا يختلق بيانات ويخفي المشكلة.") },
        { t: L("Mark it as missing and log the rule", "وسمه كمفقود وتسجيل القاعدة"), ok: true, why: L("We record that the value is unknown, and the log explains why.", "نسجّل أن القيمة غير معروفة، والسجل يوضح السبب.") },
        { t: L("Change it to 99", "تغييره إلى 99"), why: L("A guess — we cannot know the real age.", "تخمين — لا يمكننا معرفة العمر الحقيقي.") }] },
    });
    const update = () => { st.val = root.querySelector("#try-val").value; st.rule = root.querySelector("#try-rule").value; root.querySelector("#try-in").textContent = `"${st.val}"`; root.querySelector("#try-out").textContent = CleanRules.apply[st.rule](st.val); setCode("s7-try", Snip.cleanValue(TRY_TO_COL[st.rule], st.val, esc(root.querySelector("#try-out").textContent))); };
    update();
    root.querySelector("#try-val").addEventListener("input", update);
    root.querySelector("#try-rule").addEventListener("change", update);
    root.querySelectorAll("[data-ex]").forEach(b => b.addEventListener("click", () => { st.i = +b.dataset.ex; this.render(root); root.querySelector(`[data-ex="${st.i}"]`).focus(); }));
  },
});
