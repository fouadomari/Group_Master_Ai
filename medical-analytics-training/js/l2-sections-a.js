/* =====================================================================
   Lecture 2 — configuration, shared helpers + Sections 01–06
   Created by Master of AI.
   From Statistical Insight to BI, Automation and AI Agents
   Everything is computed live from the same synthetic data used in
   Lecture 1. Nothing to download or install.
   ===================================================================== */
Lec.configure({
  key: "lecture2",
  title: { en: "Lecture 2", ar: "المحاضرة 2" },
  subtitle: { en: "From insight to BI, automation & AI", ar: "من الرؤية إلى ذكاء الأعمال والأتمتة والذكاء الاصطناعي" },
  fullTitle: { en: "From Statistical Insight to BI, Automation and AI Agents", ar: "من الرؤية الإحصائية إلى ذكاء الأعمال والأتمتة ووكلاء الذكاء الاصطناعي" },
  intro: {
    en: "Lecture 1 turned messy data into trustworthy numbers. Lecture 2 shows how organisations put those numbers to work: KPIs and dashboards, pipelines that run by themselves, automatic checks and reports — and AI assistants that help, under human control. Everything is explained step by step and demonstrated live.",
    ar: "حوّلت المحاضرة 1 البيانات غير المنظمة إلى أرقام موثوقة. وتُظهر المحاضرة 2 كيف تُشغّل المؤسسات هذه الأرقام: مؤشرات الأداء ولوحات المؤشرات، ومسارات تعمل تلقائيًا، وفحوص وتقارير آلية — ومساعدون بالذكاء الاصطناعي يساعدون تحت سيطرة بشرية. كل شيء مشروح خطوة بخطوة ومعروض مباشرة.",
  },
  groups: [
    { from: 1, to: 2, en: "The idea", ar: "الفكرة" },
    { from: 3, to: 6, en: "Business intelligence (BI)", ar: "ذكاء الأعمال" },
    { from: 7, to: 9, en: "Automation", ar: "الأتمتة" },
    { from: 10, to: 12, en: "AI assistants & agents", ar: "المساعدون والوكلاء الأذكياء" },
  ],
  homeExtra: () => `<section class="block">${datasetDownloads()}</section>`,
  other: { href: "lecture-1.html", dir: "prev", label: { en: "Back to Lecture 1", ar: "العودة إلى المحاضرة 1" }, short: { en: "Lecture 1", ar: "المحاضرة 1" } },
});

/* ---------- BI helpers (shared by all Lecture 2 sections) ---------- */
const CLINICS = {
  CL01: { name: { en: "North Screening Hub", ar: "مركز الشمال للفحص" }, region: { en: "North", ar: "الشمال" } },
  CL02: { name: { en: "Central Clinic", ar: "العيادة المركزية" }, region: { en: "Central", ar: "الوسط" } },
  CL03: { name: { en: "East Community Centre", ar: "مركز الشرق المجتمعي" }, region: { en: "East", ar: "الشرق" } },
  CL04: { name: { en: "West Wellness Clinic", ar: "عيادة الغرب للعافية" }, region: { en: "West", ar: "الغرب" } },
  CL05: { name: { en: "South Health Point", ar: "نقطة الجنوب الصحية" }, region: { en: "South", ar: "الجنوب" } },
  CL06: { name: { en: "Riverside Clinic", ar: "عيادة ضفة النهر" }, region: { en: "Central", ar: "الوسط" } },
};
const clinicName = id => (CLINICS[id] ? LT(CLINICS[id].name) : L("Unknown clinic", "عيادة غير معروفة"));
const MONTHS = () => (App.lang === "ar" ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
const monthLabel = ym => { const [y, m] = ym.split("-"); return `${MONTHS()[+m - 1]} ${y}`; };
const BI = {
  monthly() { const { columns, rows } = SD().monthly; return rows.map(r => { const o = {}; columns.forEach((c, i) => { o[c] = r[i]; }); o.ym = String(o.month).slice(0, 7); return o; }); },
  pct(a, b) { return b ? (100 * a) / b : 0; },
  kpis(rows) {
    const n = rows.length, high = rows.filter(r => r.risk_group === "High").length;
    const keyCols = ["bmi", "fasting_glucose", "hba1c", "total_cholesterol", "medication_adherence_pct"];
    const filled = keyCols.reduce((a, c) => a + rows.filter(r => r[c] != null).length, 0);
    return { n, highPct: BI.pct(high, n), complete: BI.pct(filled, n * keyCols.length), adhMissing: BI.pct(rows.filter(r => r.medication_adherence_pct == null).length, n),
      avgAge: Stats.mean(Data.values(rows, "age")), followDays: Stats.median(Data.values(rows, "follow_up_days")) };
  },
  byClinic(rows) {
    return Object.keys(CLINICS).map(id => { const sub = rows.filter(r => r.clinic_id === id); return { id, n: sub.length, highPct: BI.pct(sub.filter(r => r.risk_group === "High").length, sub.length), glucose: Stats.mean(Data.values(sub, "fasting_glucose")), adherence: Stats.mean(Data.values(sub, "medication_adherence_pct")) }; });
  },
  byMonth(rows) {
    const m = {};
    rows.forEach(r => { if (!r.visit_date) return; const k = r.visit_date.slice(0, 7); m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).sort().map(k => ({ ym: k, n: m[k] }));
  },
};

/* =====================================================================
   01 — From insight to action
   ===================================================================== */
Lec.add({
  id: "insight-to-action", num: 1, aliases: ["overview"],
  title: { en: "From Insight to Action", ar: "من الرؤية إلى الفعل" },
  summary: { en: "What happens after the analysis is done.", ar: "ماذا يحدث بعد انتهاء التحليل." },
  render(root) {
    const k = BI.kpis(Data.clean()), fc = SD().forecast.series.screening_visits;
    root.innerHTML = lesson(this, {
      simple: L("An analysis is only valuable if it changes what people do. Lecture 2 is about the “last mile”: putting reliable numbers in front of the right people, <strong>keeping them up to date automatically</strong>, and using <strong>AI assistants</strong> to make them easier to use — safely.",
        "التحليل لا قيمة له إلا إذا غيّر ما يفعله الناس. تدور المحاضرة 2 حول «الميل الأخير»: وضع أرقام موثوقة أمام الأشخاص المناسبين، و<strong>تحديثها تلقائيًا</strong>، واستخدام <strong>المساعدين الأذكياء</strong> لتسهيل استخدامها — بأمان."),
      why: [L("A report nobody reads changes nothing.", "التقرير الذي لا يقرؤه أحد لا يغيّر شيئًا."), L("Manual monthly work is slow, costly and error-prone.", "العمل الشهري اليدوي بطيء ومكلف وعرضة للأخطاء."), L("AI can help people ask questions of the data — if it is kept honest and under control.", "يمكن للذكاء الاصطناعي مساعدة الناس على سؤال البيانات — إذا بقي صادقًا وتحت السيطرة.")],
      stepsTitle: L("The path we will follow", "المسار الذي سنتبعه"),
      steps: [
        { t: L("Decide what to measure (KPIs)", "قرّر ماذا تقيس (مؤشرات الأداء)"), d: L("A few clear numbers that match the organisation's goals.", "أرقام قليلة وواضحة تطابق أهداف المؤسسة."), ex: L(`e.g. ${fmtInt(k.n)} patients screened`, `مثل ${fmtInt(k.n)} مريضًا مفحوصًا`) },
        { t: L("Organise the data for reporting", "نظّم البيانات للتقارير"), d: L("A simple data model makes every question easy to answer.", "نموذج بيانات بسيط يجعل كل سؤال سهل الإجابة.") },
        { t: L("Ask questions with SQL", "اسأل بلغة SQL"), d: L("The standard language for pulling numbers out of databases.", "اللغة القياسية لاستخراج الأرقام من قواعد البيانات.") },
        { t: L("Show it on a dashboard", "اعرضها على لوحة مؤشرات"), d: L("The right numbers, at a glance, with filters.", "الأرقام الصحيحة بلمحة، مع عوامل تصفية.") },
        { t: L("Automate it", "أتمتها"), d: L("Pipelines, quality checks and reports that run by themselves.", "مسارات وفحوص جودة وتقارير تعمل تلقائيًا."), ex: L(`forecast of ≈ ${fmtInt(fc.forecast.reduce((a, b) => a + b, 0))} visits refreshed every month`, `توقع ≈ ${fmtInt(fc.forecast.reduce((a, b) => a + b, 0))} زيارة يُحدَّث كل شهر`) },
        { t: L("Add AI assistance — with guardrails", "أضف مساعدة الذكاء الاصطناعي — مع ضوابط"), d: L("Assistants and agents that answer questions from the data, with humans in charge.", "مساعدون ووكلاء يجيبون عن الأسئلة من البيانات، والبشر هم المسؤولون.") },
      ],
      seeTitle: L("The numbers we start from (from Lecture 1)", "الأرقام التي نبدأ منها (من المحاضرة 1)"),
      see: `<div class="grid grid-4">${kpi(L("Patients screened", "المرضى المفحوصون"), fmtInt(k.n), "", "primary", Snip.l2Patients(fmtInt(k.n)))}${kpi(L("In “High” teaching group", "في المجموعة التعليمية «مرتفعة»"), fmtPct(k.highPct), "", "warn", Snip.l2High(fmtPct(k.highPct)))}${kpi(L("Key fields filled in", "الحقول الرئيسية الممتلئة"), fmtPct(k.complete), "", "accent", Snip.l2Complete(fmtPct(k.complete)))}${kpi(L("Clinics", "العيادات"), Object.keys(CLINICS).length, "", "", Snip.l2Clinics(Object.keys(CLINICS).length))}</div>`,
      results: `<p class="mb-0">${L("These four numbers are already “insight”. The rest of this lecture shows how to deliver them to people automatically, keep them trustworthy, and let people ask follow-up questions in plain language.", "هذه الأرقام الأربعة «رؤية» بالفعل. ويُظهر باقي المحاضرة كيف نوصلها إلى الناس تلقائيًا، ونحافظ على موثوقيتها، ونتيح لهم طرح أسئلة متابعة بلغة بسيطة.")}</p>`,
      remember: L("Insight → measure → show → automate → assist. Each step needs the trustworthy data from Lecture 1.", "رؤية ← قياس ← عرض ← أتمتة ← مساعدة. وكل خطوة تحتاج البيانات الموثوقة من المحاضرة 1."),
    });
  },
});

/* =====================================================================
   02 — What is BI?
   ===================================================================== */
Lec.add({
  id: "what-is-bi", num: 2, aliases: ["bi"],
  title: { en: "What Is Business Intelligence (BI)?", ar: "ما هو ذكاء الأعمال (BI)؟" },
  short: { en: "What is BI?", ar: "ما هو ذكاء الأعمال؟" },
  summary: { en: "Reports, dashboards and self-service — in plain words.", ar: "التقارير ولوحات المؤشرات والخدمة الذاتية — بكلمات بسيطة." },
  render(root) {
    const st = getState("bi", { level: 0 });
    const levels = [
      { t: L("Static report", "تقرير ثابت"), d: L("A PDF or spreadsheet sent once a month. Easy to make, quickly out of date.", "ملف PDF أو جدول يُرسل مرة شهريًا. سهل الإعداد ويتقادم سريعًا."), who: L("Everyone receives the same view", "الجميع يتلقى العرض نفسه") },
      { t: L("Interactive dashboard", "لوحة مؤشرات تفاعلية"), d: L("Always-current numbers with filters (clinic, month, group).", "أرقام محدّثة دائمًا مع عوامل تصفية (العيادة، الشهر، المجموعة)."), who: L("Managers explore their own area", "يستكشف المديرون مجالهم الخاص") },
      { t: L("Self-service analysis", "تحليل الخدمة الذاتية"), d: L("Trained users build their own views from a trusted data model.", "يبني المستخدمون المدرَّبون عروضهم الخاصة من نموذج بيانات موثوق."), who: L("Analysts and power users", "المحللون والمستخدمون المتقدمون") },
      { t: L("Conversational BI (AI)", "ذكاء الأعمال الحواري (بالذكاء الاصطناعي)"), d: L("Ask a question in plain language and get an answer from the data (Sections 10–11).", "اسأل سؤالًا بلغة بسيطة واحصل على إجابة من البيانات (القسمان 10–11)."), who: L("Anyone — with guardrails", "أي شخص — مع ضوابط") },
    ];
    root.innerHTML = lesson(this, {
      simple: L("Business intelligence (BI) means <strong>turning data into clear, regularly updated information for decision-makers</strong> — usually as reports and dashboards. Statistics asks “is it real?”; BI asks “what does each team need to see every day?”.",
        "ذكاء الأعمال (BI) يعني <strong>تحويل البيانات إلى معلومات واضحة ومحدّثة بانتظام لمتخذي القرار</strong> — عادة على شكل تقارير ولوحات مؤشرات. الإحصاء يسأل «هل هو حقيقي؟»؛ وذكاء الأعمال يسأل «ماذا يحتاج كل فريق أن يرى يوميًا؟»."),
      why: [L("Everyone works from the same numbers (“one version of the truth”).", "الجميع يعمل من الأرقام نفسها («نسخة واحدة من الحقيقة»)."), L("Problems are spotted early, not at year-end.", "تُكتشف المشكلات مبكرًا لا في نهاية العام.")],
      stepsTitle: L("How BI works, step by step", "كيف يعمل ذكاء الأعمال، خطوة بخطوة"),
      steps: [
        { t: L("Collect", "الجمع"), d: L("Data arrives from clinics, labs and systems.", "تصل البيانات من العيادات والمختبرات والأنظمة.") },
        { t: L("Clean and store", "التنظيف والتخزين"), d: L("The Lecture 1 pipeline produces one trusted table, stored in a database.", "مسار المحاضرة 1 ينتج جدولًا موثوقًا واحدًا يُخزَّن في قاعدة بيانات.") },
        { t: L("Model", "النمذجة"), d: L("Arrange tables so questions are easy to answer (Section 04).", "رتّب الجداول بحيث يسهل الإجابة عن الأسئلة (القسم 04).") },
        { t: L("Calculate KPIs", "احسب مؤشرات الأداء"), d: L("Agreed formulas, calculated the same way every time (Section 03).", "صيغ متفق عليها، تُحسب بالطريقة نفسها في كل مرة (القسم 03).") },
        { t: L("Present", "اعرض"), d: L("Reports and dashboards for each audience (Section 06).", "تقارير ولوحات مؤشرات لكل جمهور (القسم 06).") },
      ],
      seeTitle: L("Four levels of BI — click each", "أربعة مستويات لذكاء الأعمال — انقر كلًا منها"), codeHint: false,
      see: `<div class="ladder" role="group">${levels.map((l, i) => `<button type="button" class="ladder-step" data-lv="${i}" aria-pressed="${i === st.level}"><span class="lv" style="background:var(--c${i + 1})">${i + 1}</span><span class="q">${l.t}<small>${l.d}</small></span><span class="badge">${l.who}</span></button>`).join("")}</div>`,
      results: `<p class="mb-0">${L(`<strong>${levels[st.level].t}:</strong> ${levels[st.level].d} Most organisations use several levels at once; each level only works if the data underneath is trustworthy.`, `<strong>${levels[st.level].t}:</strong> ${levels[st.level].d} تستخدم معظم المؤسسات عدة مستويات في آن واحد؛ وكل مستوى لا يعمل إلا إذا كانت البيانات تحته موثوقة.`)}</p>`,
      remember: L("BI = the right numbers, for the right people, always up to date.", "ذكاء الأعمال = الأرقام الصحيحة، للأشخاص المناسبين، ومحدّثة دائمًا."),
      quiz: { q: L("What is the main difference between a static report and a dashboard?", "ما الفرق الرئيسي بين التقرير الثابت ولوحة المؤشرات؟"), options: [
        { t: L("A dashboard stays up to date and can be filtered", "لوحة المؤشرات تبقى محدّثة ويمكن تصفيتها"), ok: true, why: L("Reports are snapshots; dashboards are live views.", "التقارير لقطات؛ ولوحات المؤشرات عروض حية.") },
        { t: L("A dashboard uses different data", "لوحة المؤشرات تستخدم بيانات مختلفة"), why: L("Both should use the same trusted data.", "يجب أن يستخدم الاثنان البيانات الموثوقة نفسها.") }] },
    });
    root.querySelectorAll("[data-lv]").forEach(b => b.addEventListener("click", () => { st.level = +b.dataset.lv; this.render(root); root.querySelector(`[data-lv="${st.level}"]`).focus(); }));
  },
});

/* =====================================================================
   03 — Choosing good KPIs
   ===================================================================== */
Lec.add({
  id: "kpis", num: 3, aliases: ["kpi"],
  title: { en: "Choosing Good KPIs", ar: "اختيار مؤشرات أداء جيدة" },
  short: { en: "KPIs", ar: "مؤشرات الأداء" },
  summary: { en: "What makes a good key performance indicator — with live examples.", ar: "ما الذي يجعل مؤشر الأداء الرئيسي جيدًا — مع أمثلة حية." },
  render(root) {
    const rows = Data.clean(), k = BI.kpis(rows), st = getState("kpi", { pick: 0 });
    const mth = BI.monthly(), last = mth[mth.length - 1], prevYear = mth[mth.length - 13];
    const K = [
      { t: L("Screening volume", "حجم الفحص"), v: fmtInt(last.screening_visits), sub: L(`visits in ${monthLabel(last.ym)}`, `زيارة في ${monthLabel(last.ym)}`), f: L("count of screening visits per month", "عدد زيارات الفحص في الشهر"), why: L("Shows demand and workload.", "يُظهر الطلب وحجم العمل."), target: L("track against the forecast", "يُتابَع مقابل التوقع"), owner: L("Operations manager", "مدير العمليات"), good: true },
      { t: L("Year-on-year change", "التغير السنوي"), v: fmtPct(BI.pct(last.screening_visits - prevYear.screening_visits, prevYear.screening_visits)), sub: L(`vs ${monthLabel(prevYear.ym)}`, `مقارنة بـ ${monthLabel(prevYear.ym)}`), f: L("(this month − same month last year) ÷ same month last year", "(هذا الشهر − الشهر نفسه العام الماضي) ÷ الشهر نفسه العام الماضي"), why: L("Removes seasonal effects from the comparison.", "يزيل أثر الموسم من المقارنة."), target: L("≥ planned growth", "≥ النمو المخطط"), owner: L("Operations manager", "مدير العمليات"), good: true },
      { t: L("Data completeness", "اكتمال البيانات"), v: fmtPct(k.complete), sub: L("key clinical fields filled in", "الحقول السريرية الرئيسية الممتلئة"), f: L("filled key fields ÷ all key fields", "الحقول الرئيسية الممتلئة ÷ كل الحقول الرئيسية"), why: L("Every other number depends on it.", "كل رقم آخر يعتمد عليه."), target: "≥ 97%", owner: L("Data quality lead", "مسؤول جودة البيانات"), good: true },
      { t: L("Adherence not recorded", "الالتزام غير المسجّل"), v: fmtPct(k.adhMissing), sub: L("of patients", "من المرضى"), f: L("patients without an adherence value ÷ all patients", "المرضى بلا قيمة التزام ÷ كل المرضى"), why: L("Gaps hide patients who may need support.", "الفجوات تُخفي مرضى قد يحتاجون الدعم."), target: "≤ 5%", owner: L("Clinic leads", "قادة العيادات"), good: true },
      { t: L("Number of rows in the database", "عدد الصفوف في قاعدة البيانات"), v: fmtInt(SD().quality.summary.rows), sub: L("a “vanity metric”", "«مقياس شكلي»"), f: L("count of rows", "عدد الصفوف"), why: L("Not a good KPI: it includes duplicates and says nothing about performance or a decision.", "ليس مؤشرًا جيدًا: يشمل التكرارات ولا يقول شيئًا عن الأداء أو القرار."), target: "—", owner: "—", good: false },
    ];
    const c = K[st.pick];
    setCode("l2-kpi", Snip.kpiCard(st.pick, c.v));
    root.innerHTML = lesson(this, {
      simple: L("A <strong>KPI</strong> (key performance indicator) is one number that tells you whether you are on track for a goal. Good KPIs are <strong>few, clearly defined, owned by someone, and linked to a decision</strong>.",
        "<strong>مؤشر الأداء الرئيسي (KPI)</strong> رقم واحد يخبرك ما إذا كنت على المسار نحو هدف. المؤشرات الجيدة <strong>قليلة، ومعرّفة بوضوح، ولها مالك، ومرتبطة بقرار</strong>."),
      why: [L("Too many numbers = no focus.", "أرقام كثيرة جدًا = لا تركيز."), L("Vague definitions = different teams get different answers.", "تعريفات غامضة = فرق مختلفة تحصل على إجابات مختلفة.")],
      steps: [
        { t: L("Start from a goal", "ابدأ من هدف"), d: L("e.g. “screen everyone eligible without long waits”.", "مثل «فحص كل المؤهلين دون انتظار طويل».") },
        { t: L("Pick a number that shows progress", "اختر رقمًا يُظهر التقدم"), d: L("e.g. screening visits per month.", "مثل زيارات الفحص شهريًا.") },
        { t: L("Write an exact formula", "اكتب صيغة دقيقة"), d: L("What is counted, from which table, over which period — so everyone gets the same answer.", "ماذا يُعدّ، ومن أي جدول، وعلى أي فترة — ليحصل الجميع على الإجابة نفسها.") },
        { t: L("Set a target and an owner", "حدّد هدفًا ومالكًا"), d: L("A number without a target can't be judged; a KPI without an owner is ignored.", "رقم بلا هدف لا يمكن الحكم عليه؛ ومؤشر بلا مالك يُهمَل.") },
        { t: L("Link it to an action", "اربطه بإجراء"), d: L("If it goes red, who does what?", "إذا تحوّل إلى الأحمر، من يفعل ماذا؟") },
      ],
      seeTitle: L("Five candidate KPIs, calculated from our data", "خمسة مؤشرات مرشحة، محسوبة من بياناتنا"),
      see: `<div class="grid grid-auto">${K.map((x, i) => `<button type="button" class="compare-card" data-k="${i}" aria-pressed="${i === st.pick}"><div class="kpi-label">${x.t}</div><div class="kpi-value" style="font-size:1.5rem">${x.v}</div><div class="s">${x.sub}</div></button>`).join("")}</div>
        <div class="card mt-2" aria-live="polite">${codeChip("l2-kpi")}<div class="row"><h3 class="mb-0">${c.t}</h3><span class="badge ${c.good ? "success" : "danger"}">${c.good ? L("Good KPI", "مؤشر جيد") : L("Weak KPI", "مؤشر ضعيف")}</span></div>
          <dl class="def-list mt-2"><dt>${L("Formula", "الصيغة")}</dt><dd>${c.f}</dd><dt>${L("Why it matters", "لماذا يهم")}</dt><dd>${c.why}</dd><dt>${L("Target", "الهدف")}</dt><dd>${c.target}</dd><dt>${L("Owner", "المالك")}</dt><dd>${c.owner}</dd></dl></div>`,
      results: `<ul><li>${L("The first four are good KPIs: each has an exact formula, a target, an owner and an action.", "المؤشرات الأربعة الأولى جيدة: لكل منها صيغة دقيقة وهدف ومالك وإجراء.")}</li>
        <li>${L(`“Adherence not recorded” is at ${fmtPct(k.adhMissing)} against a target of 5% — it would show red and trigger action at the clinics.`, `«الالتزام غير المسجّل» عند ${fmtPct(k.adhMissing)} مقابل هدف 5% — فسيظهر باللون الأحمر ويستدعي إجراءً في العيادات.`)}</li>
        <li>${L("“Rows in the database” is a vanity metric: it grows, but tells nobody what to do.", "«الصفوف في قاعدة البيانات» مقياس شكلي: يكبر لكنه لا يخبر أحدًا بما يجب فعله.")}</li></ul>`,
      remember: L("A good KPI has a clear formula, a target, an owner and an action.", "المؤشر الجيد له صيغة واضحة وهدف ومالك وإجراء."),
    });
    root.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => { st.pick = +b.dataset.k; this.render(root); root.querySelector(`[data-k="${st.pick}"]`).focus(); }));
  },
});

/* =====================================================================
   04 — Organising data for BI (data model)
   ===================================================================== */
Lec.add({
  id: "data-model", num: 4, aliases: ["star-schema"],
  title: { en: "Organising Data for Reporting (Data Model)", ar: "تنظيم البيانات للتقارير (نموذج البيانات)" },
  short: { en: "Data model", ar: "نموذج البيانات" },
  summary: { en: "Facts in the middle, descriptions around them — the “star”.", ar: "الحقائق في الوسط والأوصاف حولها — «النجمة»." },
  render(root) {
    const st = getState("dm", { tbl: "fact" }), rows = Data.clean();
    const tables = {
      fact: { name: "fact_screening", cls: "fact", cols: ["visit_id", "patient_key", "clinic_key", "date_key", "systolic_bp", "fasting_glucose", "hba1c", "risk_group"], d: L("One row per screening visit, with the measurements (the “facts”). It holds keys that point to the description tables.", "صف واحد لكل زيارة فحص، مع القياسات («الحقائق»). ويحمل مفاتيح تشير إلى جداول الأوصاف."),
        sample: () => rows.slice(0, 6).map((r, i) => [`V${String(i + 1).padStart(5, "0")}`, r.patient_id, r.clinic_id ?? null, r.visit_date ? r.visit_date.replace(/-/g, "") : null, r.systolic_bp, r.fasting_glucose, r.hba1c, r.risk_group]) },
      clinic: { name: "dim_clinic", cls: "", cols: ["clinic_key", "clinic_name", "region"], d: L("One row per clinic: names and regions, stored once.", "صف واحد لكل عيادة: الأسماء والمناطق، تُخزَّن مرة واحدة."), sample: () => Object.keys(CLINICS).map(k => [k, clinicName(k), LT(CLINICS[k].region)]) },
      date: { name: "dim_date", cls: "", cols: ["date_key", "date", "month", "quarter", "year"], d: L("One row per day, so you can group by month, quarter or year easily.", "صف واحد لكل يوم، فيمكنك التجميع حسب الشهر أو الربع أو السنة بسهولة."),
        sample: () => ["2024-01-15", "2024-04-02", "2024-08-20", "2024-12-31"].map(dt => [dt.replace(/-/g, ""), dt, MONTHS()[+dt.slice(5, 7) - 1], `Q${Math.ceil(+dt.slice(5, 7) / 3)}`, dt.slice(0, 4)]) },
      patient: { name: "dim_patient", cls: "", cols: ["patient_key", "sex", "age_group", "smoking_status"], d: L("One row per patient with descriptive attributes (no names — synthetic IDs only).", "صف واحد لكل مريض مع صفات وصفية (بلا أسماء — معرّفات اصطناعية فقط)."), sample: () => rows.slice(0, 6).map(r => [r.patient_id, r.sex, r.age_group, r.smoking_status]) },
    };
    const T = tables[st.tbl];
    setCode("l2-dim", Snip.dimTable(st.tbl));
    const tbl = k => `<div class="tbl ${tables[k].cls}" data-tbl="${k}" role="button" tabindex="0" aria-pressed="${st.tbl === k}"><h4>${tables[k].name}</h4><ul>${tables[k].cols.map(c => `<li class="${c.endsWith("_key") ? "key" : ""}">${c.endsWith("_key") ? "🔑 " : ""}${c}</li>`).join("")}</ul></div>`;
    root.innerHTML = lesson(this, {
      simple: L("For reporting, data is usually arranged as a <strong>star</strong>: one central table of events (each screening visit) surrounded by small tables that describe them (clinic, date, patient). They are linked by <strong>keys</strong> — ID codes.",
        "للتقارير تُرتَّب البيانات عادة على شكل <strong>نجمة</strong>: جدول مركزي للأحداث (كل زيارة فحص) تحيط به جداول صغيرة تصفها (العيادة، التاريخ، المريض). وتُربط بـ<strong>مفاتيح</strong> — رموز تعريفية."),
      why: [L("Each fact is stored once, so totals always add up.", "كل حقيقة تُخزَّن مرة واحدة، فتتطابق المجاميع دائمًا."), L("Any question (“by clinic”, “by month”) becomes a simple join.", "أي سؤال («حسب العيادة»، «حسب الشهر») يصبح ربطًا بسيطًا.")],
      steps: [
        { t: L("Find the events", "حدّد الأحداث"), d: L("What do we count? Screening visits → the central “fact” table.", "ماذا نعدّ؟ زيارات الفحص ← جدول «الحقائق» المركزي.") },
        { t: L("Find the descriptions", "حدّد الأوصاف"), d: L("Who, where, when? → patient, clinic and date tables (“dimensions”).", "من، وأين، ومتى؟ ← جداول المريض والعيادة والتاريخ («الأبعاد»).") },
        { t: L("Connect them with keys", "اربطها بالمفاتيح"), d: L("The fact table stores clinic_key; dim_clinic tells us its name and region.", "يخزّن جدول الحقائق clinic_key؛ ويخبرنا dim_clinic باسمها ومنطقتها."), ex: `<span class="mono">CL01</span> → ${clinicName("CL01")}` },
        { t: L("Agree on definitions", "اتفق على التعريفات"), d: L("KPIs are calculated from this one model, so everybody gets the same answer.", "تُحسب المؤشرات من هذا النموذج الواحد، فيحصل الجميع على الإجابة نفسها.") },
      ],
      seeTitle: L("Our star schema — click a table to see its rows", "مخطط النجمة لدينا — انقر جدولًا لرؤية صفوفه"),
      see: `<div class="schema"><div class="col">${tbl("clinic")}${tbl("date")}</div>${tbl("fact")}<div class="col">${tbl("patient")}</div></div>
        <div class="card mt-2" aria-live="polite">${codeChip("l2-dim")}<h3 class="mono ltr" style="text-align:start">${T.name}</h3><p class="muted">${T.d}</p>${miniTable(T.cols.map(c => `<code>${c}</code>`), T.sample().map(r => r.map(fmtCell)))}</div>`,
      results: `<p class="mb-0">${L("The central table is long (one row per visit); the description tables are short. To show “visits by region”, the dashboard joins the fact table to dim_clinic on clinic_key and counts — Section 05 shows exactly that.", "الجدول المركزي طويل (صف لكل زيارة)؛ وجداول الأوصاف قصيرة. ولعرض «الزيارات حسب المنطقة» تربط لوحة المؤشرات جدول الحقائق بـ dim_clinic عبر clinic_key ثم تعدّ — ويُظهر القسم 05 ذلك تمامًا.")}</p>`,
      remember: L("Facts in the middle, descriptions around them, connected by keys.", "الحقائق في الوسط والأوصاف حولها، مربوطة بالمفاتيح."),
    });
    root.querySelectorAll("[data-tbl]").forEach(el => {
      const pick = () => { st.tbl = el.dataset.tbl; this.render(root); root.querySelector(`[data-tbl="${st.tbl}"]`).focus(); };
      el.addEventListener("click", pick); el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
  },
});

/* =====================================================================
   05 — Asking questions with SQL
   ===================================================================== */
Lec.add({
  id: "sql", num: 5, aliases: ["sql-for-dashboards"],
  title: { en: "Asking Questions with SQL", ar: "طرح الأسئلة بلغة SQL" },
  short: { en: "SQL questions", ar: "أسئلة SQL" },
  summary: { en: "Plain question → SQL query → result table, explained.", ar: "سؤال بسيط ← استعلام SQL ← جدول نتائج، مع الشرح." },
  render(root) {
    const st = getState("sql", { q: 0 }), rows = Data.clean(), mth = BI.monthly();
    const Q = [
      { q: L("How many patients were screened at each clinic?", "كم مريضًا فُحص في كل عيادة؟"),
        sql: `SELECT c.clinic_name, COUNT(*) AS patients
FROM patients p
JOIN clinics c ON c.clinic_id = p.clinic_id
GROUP BY c.clinic_name
ORDER BY patients DESC;`,
        parts: [["SELECT", L("which columns to show", "أي الأعمدة تُعرض")], ["FROM … JOIN", L("which tables, and how they connect", "أي الجداول، وكيف تتصل")], ["GROUP BY", L("one result row per clinic", "صف نتيجة واحد لكل عيادة")], ["ORDER BY", L("biggest first", "الأكبر أولًا")]],
        run: () => { const r = BI.byClinic(rows).sort((a, b) => b.n - a.n); return { head: ["clinic_name", { t: "patients", num: true }], rows: r.map(x => [clinicName(x.id), fmtInt(x.n)]) }; } },
      { q: L("What share of each clinic's patients are in the “High” teaching group?", "ما نسبة مرضى كل عيادة في المجموعة التعليمية «مرتفعة»؟"),
        sql: `SELECT clinic_id,
       COUNT(*) AS patients,
       ROUND(100.0 * SUM(CASE WHEN risk_group = 'High' THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_high
FROM patients
WHERE clinic_id IS NOT NULL
GROUP BY clinic_id
ORDER BY clinic_id;`,
        parts: [["CASE WHEN", L("count 1 for “High”, 0 otherwise", "عُدّ 1 لـ«مرتفعة» و0 لغيرها")], ["SUM / COUNT", L("turn the count into a percentage", "حوّل العدد إلى نسبة مئوية")], ["WHERE", L("leave out rows with no clinic", "استبعد الصفوف بلا عيادة")]],
        run: () => { const r = BI.byClinic(rows); return { head: ["clinic_id", { t: "patients", num: true }, { t: "pct_high", num: true }], rows: r.map(x => [x.id, fmtInt(x.n), fmt(x.highPct, 1)]) }; } },
      { q: L("How did screening visits change month by month in 2024?", "كيف تغيّرت زيارات الفحص شهرًا بعد شهر في 2024؟"),
        sql: `SELECT month,
       screening_visits,
       screening_visits - LAG(screening_visits) OVER (ORDER BY month) AS change
FROM monthly_activity
WHERE month >= '2024-01-01'
ORDER BY month;`,
        parts: [["LAG(…) OVER", L("look at the previous month's value", "انظر إلى قيمة الشهر السابق")], ["WHERE", L("only 2024", "2024 فقط")]],
        run: () => { const all = mth; return { head: ["month", { t: "screening_visits", num: true }, { t: "change", num: true }], rows: all.map((m, i) => ({ m, prev: all[i - 1] })).filter(x => x.m.ym >= "2024-01").map(x => [x.m.ym, fmtInt(x.m.screening_visits), x.prev ? `${x.m.screening_visits - x.prev.screening_visits > 0 ? "+" : ""}${x.m.screening_visits - x.prev.screening_visits}` : null]) }; } },
      { q: L("Which key fields have the most missing values?", "أي الحقول الرئيسية فيها أكثر القيم المفقودة؟"),
        sql: `SELECT 'bmi' AS field, ROUND(100.0 * COUNT(bmi) / COUNT(*), 1) AS completeness_pct FROM patients
UNION ALL SELECT 'fasting_glucose', ROUND(100.0 * COUNT(fasting_glucose) / COUNT(*), 1) FROM patients
UNION ALL SELECT 'hba1c', ROUND(100.0 * COUNT(hba1c) / COUNT(*), 1) FROM patients
UNION ALL SELECT 'medication_adherence_pct', ROUND(100.0 * COUNT(medication_adherence_pct) / COUNT(*), 1) FROM patients;`,
        parts: [["COUNT(column)", L("counts only filled-in values", "يعدّ القيم الممتلئة فقط")], ["COUNT(*)", L("counts all rows", "يعدّ كل الصفوف")], ["UNION ALL", L("stack the four answers into one table", "يجمع الإجابات الأربع في جدول واحد")]],
        run: () => ({ head: ["field", { t: "completeness_pct", num: true }], rows: ["bmi", "fasting_glucose", "hba1c", "medication_adherence_pct"].map(c => [c, fmt(BI.pct(rows.filter(r => r[c] != null).length, rows.length), 1)]) }) },
      { q: L("Which clinics rank highest by number of patients (with a rank number)?", "أي العيادات في المرتبة الأعلى حسب عدد المرضى (مع رقم الترتيب)؟"),
        sql: `SELECT clinic_id,
       COUNT(*) AS patients,
       RANK() OVER (ORDER BY COUNT(*) DESC) AS volume_rank
FROM patients
WHERE clinic_id IS NOT NULL
GROUP BY clinic_id
HAVING COUNT(*) >= 50;`,
        parts: [["RANK() OVER", L("give each clinic a position", "أعطِ كل عيادة ترتيبًا")], ["HAVING", L("keep only clinics with at least 50 patients", "احتفظ فقط بالعيادات التي لديها 50 مريضًا على الأقل")]],
        run: () => { const r = BI.byClinic(rows).filter(x => x.n >= 50).sort((a, b) => b.n - a.n); return { head: ["clinic_id", { t: "patients", num: true }, { t: "volume_rank", num: true }], rows: r.map((x, i) => [x.id, fmtInt(x.n), r.findIndex(y => y.n === x.n) + 1]) }; } },
    ];
    const cur = Q[st.q], res = cur.run();
    setCode("l2-sql", Snip.sqlPandas(st.q));
    root.innerHTML = lesson(this, {
      simple: L("SQL (“sequel”) is the standard language for asking a database a question. A query reads almost like English: <em>SELECT</em> these columns <em>FROM</em> this table, <em>WHERE</em> this is true, <em>GROUP BY</em> this.",
        "SQL هي اللغة القياسية لطرح سؤال على قاعدة بيانات. ويُقرأ الاستعلام تقريبًا كالإنجليزية: <em>SELECT</em> (اختر) هذه الأعمدة <em>FROM</em> (من) هذا الجدول، <em>WHERE</em> (حيث) يتحقق هذا، <em>GROUP BY</em> (جمّع حسب) هذا."),
      why: [L("Almost every dashboard tile is one SQL query.", "كل مربع تقريبًا في لوحة المؤشرات هو استعلام SQL واحد."), L("Being able to read SQL lets you check how a number was calculated.", "القدرة على قراءة SQL تتيح لك التحقق من كيفية حساب رقم ما.")],
      steps: [
        { t: L("Write the question in plain words", "اكتب السؤال بكلمات بسيطة"), d: L("“How many patients per clinic?”", "«كم مريضًا لكل عيادة؟»") },
        { t: L("Choose the table(s)", "اختر الجدول (الجداول)"), d: "<code>FROM patients JOIN clinics</code>" },
        { t: L("Filter the rows", "صفِّ الصفوف"), d: "<code>WHERE clinic_id IS NOT NULL</code>" },
        { t: L("Group and calculate", "جمّع واحسب"), d: "<code>GROUP BY clinic_id</code> · <code>COUNT(*)</code>, <code>AVG(…)</code>" },
        { t: L("Sort and check", "رتّب وتحقق"), d: L("<code>ORDER BY</code>, then sanity-check: do the totals add up to the number of patients?", "<code>ORDER BY</code>، ثم تحقق من المنطق: هل تتطابق المجاميع مع عدد المرضى؟") },
      ],
      seeTitle: L("Pick a question — see the SQL and its result", "اختر سؤالًا — وشاهد SQL ونتيجته"),
      see: `<div class="stack">${Q.map((x, i) => `<button type="button" class="quiz-option ${i === st.q ? "correct" : ""}" data-sq="${i}" aria-pressed="${i === st.q}">${i + 1}. ${x.q}</button>`).join("")}</div>
        <div class="grid grid-2 mt-2"><div>${Code.block({ code: cur.sql, lang: "sql", title: "SQL" })}
          <div class="card mt-2"><h3>${L("Reading it", "قراءته")}</h3><dl class="def-list">${cur.parts.map(([k, v]) => `<dt><code>${k}</code></dt><dd>${v}</dd>`).join("")}</dl></div></div>
          <div class="card">${codeChip("l2-sql")}<h3>${L("Result", "النتيجة")}</h3>${miniTable(res.head.map(h => (typeof h === "string" ? `<code>${h}</code>` : { ...h, t: `<code>${h.t}</code>` })), res.rows)}</div></div>`,
      results: `<p class="mb-0">${L("The results above were calculated live from the same clean data you explored in Lecture 1 — they are exactly what this SQL returns on that table.", "حُسبت النتائج أعلاه مباشرة من البيانات المنظّفة نفسها التي استكشفتها في المحاضرة 1 — وهي بالضبط ما يُرجعه SQL هذا على ذلك الجدول.")}</p>`,
      remember: L("SELECT what · FROM where · WHERE which rows · GROUP BY how to summarise · ORDER BY how to sort.", "SELECT ماذا · FROM من أين · WHERE أي الصفوف · GROUP BY كيف نلخص · ORDER BY كيف نرتب."),
      quiz: { q: L("Which part of a query keeps only some rows (e.g. only 2024)?", "أي جزء من الاستعلام يحتفظ ببعض الصفوف فقط (مثل 2024 فقط)؟"), options: [
        { t: "WHERE", ok: true, why: L("WHERE filters rows before grouping.", "WHERE يصفّي الصفوف قبل التجميع.") }, { t: "SELECT", why: L("SELECT chooses columns, not rows.", "SELECT يختار الأعمدة لا الصفوف.") }, { t: "ORDER BY", why: L("ORDER BY only sorts.", "ORDER BY يرتّب فقط.") }] },
    });
    root.querySelectorAll("[data-sq]").forEach(b => b.addEventListener("click", () => { st.q = +b.dataset.sq; this.render(root); root.querySelector(`[data-sq="${st.q}"]`).focus(); }));
  },
});

/* =====================================================================
   06 — Building a dashboard
   ===================================================================== */
Lec.add({
  id: "dashboard", num: 6, aliases: ["dashboards"],
  title: { en: "Building a Dashboard", ar: "بناء لوحة مؤشرات" },
  short: { en: "Dashboard", ar: "لوحة المؤشرات" },
  summary: { en: "A working dashboard with filters — and the design rules behind it.", ar: "لوحة مؤشرات عاملة مع عوامل تصفية — وقواعد التصميم وراءها." },
  render(root) {
    const st = getState("dash", { clinic: "all", year: "all", group: "all" });
    root.innerHTML = lesson(this, {
      simple: L("A dashboard puts the few numbers that matter on one screen, keeps them up to date, and lets people <strong>filter</strong> to their own clinic or period. Below is a working one, built from our data.",
        "تضع لوحة المؤشرات الأرقام القليلة المهمة على شاشة واحدة، وتبقيها محدّثة، وتتيح للناس <strong>التصفية</strong> حسب عيادتهم أو فترتهم. أدناه لوحة عاملة مبنية من بياناتنا."),
      why: [L("Managers see the situation in seconds.", "يرى المديرون الوضع في ثوانٍ."), L("Filters let each team answer its own questions without new reports.", "تتيح عوامل التصفية لكل فريق الإجابة عن أسئلته دون تقارير جديدة.")],
      stepsTitle: L("Designing a good dashboard, step by step", "تصميم لوحة مؤشرات جيدة، خطوة بخطوة"),
      steps: [
        { t: L("Start with the audience", "ابدأ بالجمهور"), d: L("Who uses it, and which decisions do they make?", "من يستخدمها، وما القرارات التي يتخذونها؟") },
        { t: L("Put KPIs at the top", "ضع المؤشرات في الأعلى"), d: L("3–5 headline numbers with context (compared with what?).", "3–5 أرقام رئيسية مع سياق (مقارنة بماذا؟).") },
        { t: L("Add one chart per question", "أضف رسمًا واحدًا لكل سؤال"), d: L("Trend over time → line chart. Comparing clinics → bar chart.", "الاتجاه عبر الزمن ← رسم خطي. مقارنة العيادات ← رسم أعمدة.") },
        { t: L("Add filters", "أضف عوامل تصفية"), d: L("Clinic, period, group.", "العيادة، الفترة، المجموعة.") },
        { t: L("Show data quality and freshness", "اعرض جودة البيانات وحداثتها"), d: L("“Last updated” and “% complete” build trust.", "«آخر تحديث» و«نسبة الاكتمال» تبني الثقة.") },
      ],
      seeTitle: L("A live screening-operations dashboard", "لوحة مؤشرات حية لعمليات الفحص"),
      see: `<div class="controls">${selectEl("db-clinic", [{ value: "all", label: L("All clinics", "كل العيادات") }, ...Object.keys(CLINICS).map(k => ({ value: k, label: clinicName(k) }))], st.clinic, glabel("clinic_id"))}
          ${selectEl("db-year", [{ value: "all", label: L("2023–2024", "2023–2024") }, { value: "2023", label: "2023" }, { value: "2024", label: "2024" }], st.year, L("Year", "السنة"))}
          ${selectEl("db-group", [{ value: "all", label: L("All groups", "كل المجموعات") }, ...["Low", "Moderate", "High"].map(g => ({ value: g, label: levlabel(g) }))], st.group, glabel("risk_group"))}</div>
        <div id="db-body" class="mt-2"></div>`,
      results: `<div id="db-msg"></div>`,
      remember: L("A dashboard is a few honest numbers, the right charts, useful filters — and a visible data-quality signal.", "لوحة المؤشرات أرقام صادقة قليلة، ورسوم مناسبة، وعوامل تصفية مفيدة — وإشارة واضحة لجودة البيانات."),
    });
    const draw = () => {
      let rows = Data.clean();
      if (st.clinic !== "all") rows = rows.filter(r => r.clinic_id === st.clinic);
      if (st.year !== "all") rows = rows.filter(r => r.visit_date && r.visit_date.startsWith(st.year));
      if (st.group !== "all") rows = rows.filter(r => r.risk_group === st.group);
      const k = BI.kpis(rows), bm = BI.byMonth(rows), cl = BI.byClinic(rows);
      const mix = ["Low", "Moderate", "High"].map(g => rows.filter(r => r.risk_group === g).length);
      setCode("l2-trend", Snip.dashChart("trend", st)); setCode("l2-clinic", Snip.dashChart("clinic", st)); setCode("l2-mix", Snip.dashChart("mix", st));
      root.querySelector("#db-body").innerHTML = `<div class="grid grid-4">${kpi(L("Patients screened", "المرضى المفحوصون"), fmtInt(k.n), "", "primary", Snip.dashTile("patients", st, fmtInt(k.n)))}${kpi(L("“High” teaching group", "المجموعة التعليمية «مرتفعة»"), fmtPct(k.highPct), "", "warn", Snip.dashTile("high", st, fmtPct(k.highPct)))}${kpi(L("Average age", "متوسط العمر"), fmt(k.avgAge, 1), L("years", "سنة"), "", Snip.dashTile("age", st, fmt(k.avgAge, 1)))}${kpi(L("Data complete", "اكتمال البيانات"), fmtPct(k.complete), L("updated: Dec 2024", "آخر تحديث: ديسمبر 2024"), k.complete >= 97 ? "accent" : "danger", Snip.dashTile("complete", st, fmtPct(k.complete)))}</div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("l2-trend")}<div class="chart-title">${L("Patients screened per month", "المرضى المفحوصون شهريًا")}</div><div id="db-trend"></div></div>
          <div class="chart-card">${codeChip("l2-clinic")}<div class="chart-title">${L("Patients per clinic", "المرضى لكل عيادة")}</div><div id="db-cl-chart"></div></div></div>
        <div class="chart-card mt-2">${codeChip("l2-mix")}<div class="chart-title">${L("Mix of teaching risk groups", "توزيع مجموعات الخطورة التعليمية")}</div><div id="db-mix"></div></div>`;
      if (bm.length) Charts.line(root.querySelector("#db-trend"), { labels: bm.map(x => x.ym), series: [{ name: L("patients", "المرضى"), values: bm.map(x => x.n), cls: "c1", dots: true }], height: 230 });
      else root.querySelector("#db-trend").innerHTML = `<p class="muted">${t("ex.noRows")}</p>`;
      Charts.bar(root.querySelector("#db-cl-chart"), { horizontal: true, labelWidth: 160, data: cl.map(x => ({ label: clinicName(x.id), value: x.n, cls: x.id === st.clinic ? "c3" : "c1" })), format: v => fmtInt(v) });
      Charts.bar(root.querySelector("#db-mix"), { horizontal: true, labelWidth: 110, data: ["Low", "Moderate", "High"].map((g, i) => ({ label: levlabel(g), value: rows.length ? (100 * mix[i]) / rows.length : 0, cls: ["c2", "c3", "c4"][i] })), format: v => `${fmt(v, 0)}%`, max: 100 });
      const busiest = cl.slice().sort((a, b) => b.n - a.n)[0];
      root.querySelector("#db-msg").innerHTML = rows.length ? `<ul><li>${L(`${fmtInt(k.n)} patients match the filters; ${fmtPct(k.highPct)} are in the “High” teaching group.`, `${fmtInt(k.n)} مريضًا يطابقون عوامل التصفية؛ ${fmtPct(k.highPct)} منهم في المجموعة التعليمية «مرتفعة».`)}</li>
        <li>${L(`Busiest clinic in this view: <strong>${clinicName(busiest.id)}</strong> (${fmtInt(busiest.n)} patients).`, `العيادة الأكثر ازدحامًا في هذا العرض: <strong>${clinicName(busiest.id)}</strong> (${fmtInt(busiest.n)} مريضًا).`)}</li>
        <li>${L(`Data completeness is ${fmtPct(k.complete)} — ${k.complete >= 97 ? "above" : "below"} the 97% target, so the tile is ${k.complete >= 97 ? "green" : "red"}.`, `اكتمال البيانات ${fmtPct(k.complete)} — ${k.complete >= 97 ? "فوق" : "تحت"} هدف 97%، لذا المربع ${k.complete >= 97 ? "أخضر" : "أحمر"}.`)}</li></ul>` : `<p class="mb-0">${t("ex.noRows")}</p>`;
    };
    draw();
    root.querySelector("#db-clinic").addEventListener("change", e => { st.clinic = e.target.value; draw(); });
    root.querySelector("#db-year").addEventListener("change", e => { st.year = e.target.value; draw(); });
    root.querySelector("#db-group").addEventListener("change", e => { st.group = e.target.value; draw(); });
  },
});
