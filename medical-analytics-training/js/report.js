/* =====================================================================
   report.js — "Data Agent: Official Report" page.
   Created by Master of AI.
   Every example and verification on this page is run live through the
   real Data Agent (js/agent.js) on the platform's data.
   ===================================================================== */
const REPORT_META = { version: "1.0", date: "2026-10-02" };

function miniTable(head, rows, opts = {}) {
  return `<div class="table-wrap" ${opts.maxH ? `style="max-height:${opts.maxH}px"` : ""}><table class="data"><thead><tr>${head.map(h => `<th scope="col" class="${h.num ? "num" : ""}">${h.t ?? h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${head[i] && head[i].num ? "num" : ""}">${c ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/* reference values computed independently with pandas (python) */
const VERIFY = [
  { q: { en: "What is the average fasting glucose?", ar: "ما متوسط سكر الصائم؟" }, expect: "96.92", how: "df['fasting_glucose'].mean()" },
  { q: { en: "What is the average fasting glucose for smokers?", ar: "ما متوسط سكر الصائم لدى المدخنين؟" }, expect: "98.30", how: "df.loc[df.smoking_status=='Smoker','fasting_glucose'].mean()" },
  { q: { en: "How many smokers are there?", ar: "كم عدد المدخنين؟" }, expect: "257", how: "(df.smoking_status=='Smoker').sum()" },
  { q: { en: "How many female patients are over 65?", ar: "كم عدد المرضى الإناث فوق 65؟" }, expect: "110", how: "((df.sex=='Female') & (df.age>65)).sum()" },
  { q: { en: "How many patients are in the high risk group?", ar: "كم عدد المرضى في المجموعة المرتفعة الخطورة؟" }, expect: "436", how: "(df.risk_group=='High').sum()" },
  { q: { en: "Which clinic has the most patients?", ar: "أي عيادة لديها أكثر المرضى؟" }, expect: "271", how: "df.clinic_id.value_counts().max()" },
  { q: { en: "What is the relationship between HbA1c and glucose?", ar: "ما العلاقة بين HbA1c والسكر؟" }, expect: "0.69", how: "df[['hba1c','fasting_glucose']].corr()" },
  { q: { en: "How many screening visits were there in 2024?", ar: "كم زيارة فحص في 2024؟" }, expect: "14,059", how: "ts[ts.month.dt.year==2024].screening_visits.sum()" },
  { q: { en: "How many visits should we plan for next year?", ar: "كم زيارة يجب أن نخطط لها العام القادم؟" }, expect: "14,907", how: "sum(forecast['screening_visits'])" },
];

function renderReport() {
  const d = window.SITE_DATA, main = document.getElementById("main");
  if (!d) { main.innerHTML = callout("danger", "Data not found", "<p>js/site-data.js is missing.</p>"); return; }
  const rows = Data.clean(), mth = d.monthly.rows.length;
  const caps = [
    [L("Count patients", "عدّ المرضى"), L("How many female patients are over 65?", "كم عدد المرضى الإناث فوق 65؟"), L("Clean patient table", "جدول المرضى المنظّف"), L("Filter and count rows", "التصفية وعدّ الصفوف")],
    [L("Summarise a measurement", "تلخيص قياس"), L("What is the average fasting glucose for smokers?", "ما متوسط سكر الصائم لدى المدخنين؟"), L("Clean patient table", "جدول المرضى المنظّف"), L("Average, median, minimum, maximum", "المتوسط والوسيط والأدنى والأعلى")],
    [L("Summarise by group", "التلخيص حسب المجموعة"), L("Average BMI by risk group", "متوسط BMI حسب مجموعة الخطورة"), L("Clean patient table", "جدول المرضى المنظّف"), L("Group by, then summarise", "التجميع ثم التلخيص")],
    [L("Compare two groups", "مقارنة مجموعتين"), L("Compare heart rate between smokers and non-smokers", "قارن النبض بين المدخنين وغير المدخنين"), L("Clean patient table", "جدول المرضى المنظّف"), L("Welch's t-test + Mann–Whitney check", "اختبار ويلش t + تحقق مان-ويتني")],
    [L("Relationship between measurements", "العلاقة بين القياسات"), L("What is the relationship between HbA1c and glucose?", "ما العلاقة بين HbA1c والسكر؟"), L("Clean patient table", "جدول المرضى المنظّف"), L("Pearson and Spearman correlation", "ارتباط بيرسون وسبيرمان")],
    [L("Data completeness", "اكتمال البيانات"), L("How much data is missing?", "ما نسبة البيانات المفقودة؟"), L("Clean patient table", "جدول المرضى المنظّف"), L("Share of missing values vs target", "نسبة القيم المفقودة مقابل الهدف")],
    [L("Rank clinics", "ترتيب العيادات"), L("Which clinic has the most patients?", "أي عيادة لديها أكثر المرضى؟"), L("Clean patient table", "جدول المرضى المنظّف"), L("Count per clinic, with total check", "العدّ لكل عيادة مع تحقق المجموع")],
    [L("Activity volume", "حجم النشاط"), L("How many screening visits were there in 2024?", "كم زيارة فحص في 2024؟"), L("Monthly clinic activity", "نشاط العيادات الشهري"), L("Yearly totals and change", "المجاميع السنوية والتغير")],
    [L("Forecast workload", "توقع حجم العمل"), L("Forecast screening visits for next quarter", "ما توقع الزيارات للربع القادم؟"), L("Platform forecast results", "نتائج التوقع في المنصة"), L("Sum of forecast with likely range", "مجموع التوقع مع النطاق المرجح")],
  ];
  const steps = [
    [L("Receive", "الاستلام"), L("The user types a question in English or Arabic in the “Ask the data” panel, available on every page.", "يكتب المستخدم سؤالًا بالعربية أو الإنجليزية في لوحة «اسأل البيانات» المتاحة في كل صفحة.")],
    [L("Understand", "الفهم"), L("The agent normalises the text (including Arabic letter forms) and detects the language, the intent, the measurement(s), any groups (smokers, women, high-risk group, a clinic) and filters (age, year).", "يوحّد الوكيل النص (بما فيه أشكال الحروف العربية) ويحدد اللغة والنية والقياس/القياسات وأي مجموعات (المدخنون، النساء، المجموعة المرتفعة، عيادة) وعوامل التصفية (العمر، السنة).")],
    [L("Guardrails", "الضوابط"), L("Before any query, requests for clinical decisions or individual patient records are refused and logged.", "قبل أي استعلام تُرفض طلبات القرارات السريرية أو سجلات المرضى الأفراد وتُسجَّل.")],
    [L("Plan & query", "التخطيط والاستعلام"), L("The intent is mapped to one approved query on the platform's own datasets — filtering, counting, summarising, testing or reading the forecast.", "تُربط النية باستعلام معتمد واحد على بيانات المنصة نفسها — تصفية أو عدّ أو تلخيص أو اختبار أو قراءة التوقع.")],
    [L("Check", "التحقق"), L("The result is validated: totals must add up, missing values are excluded and counted, small groups (< 30 patients) trigger a caution.", "يُتحقق من النتيجة: يجب أن تتطابق المجاميع، وتُستبعد القيم المفقودة وتُعدّ، وتُطلق المجموعات الصغيرة (أقل من 30 مريضًا) تحذيرًا.")],
    [L("Answer with evidence", "الإجابة مع الدليل"), L("A plain-language answer is returned with the evidence table, the reasoning steps (“How I answered”) and the exact Python query, which can be opened and copied.", "تُعاد إجابة بلغة بسيطة مع جدول الدليل وخطوات الاستدلال («كيف أجبت») واستعلام بايثون الدقيق الذي يمكن فتحه ونسخه.")],
    [L("Log", "التسجيل"), L("Every question, its detected intent and its outcome (answered, refused, not understood) are written to the session activity log.", "يُكتب كل سؤال ونيته المكتشفة ونتيجته (أُجيب، رُفض، لم يُفهم) في سجل نشاط الجلسة.")],
  ];
  main.innerHTML = `
  <section class="l2-hero" style="padding:48px 0 36px;border-bottom:1px solid var(--border)"><div class="container report-hero">
    <img src="assets/logo.png" alt="${esc(BRAND.department)}" class="report-crest">
    <div><div class="eyebrow">${L("Official report", "تقرير رسمي")} · ${L("Version", "الإصدار")} ${REPORT_META.version}</div>
      <h1 id="report-title" tabindex="-1">${L("The Data Agent: How the Platform's Official Data Chatbot Works", "وكيل البيانات: كيف يعمل روبوت المحادثة الرسمي للبيانات في المنصة")}</h1>
      <p class="lead">${L("This report explains what the platform's Data Agent does, how it turns a question into a data query, which safeguards it applies, how its answers were verified, and where its limits are.", "يشرح هذا التقرير ما يفعله وكيل البيانات في المنصة، وكيف يحوّل السؤال إلى استعلام بيانات، وما الضمانات التي يطبقها، وكيف تم التحقق من إجاباته، وما حدوده.")}</p>
      <div class="row mt-2"><button type="button" class="btn btn-primary" id="rp-open-agent">${ICON.search} ${L("Open the Data Agent", "افتح وكيل البيانات")}</button><button type="button" class="btn" id="rp-print">${ICON.file} ${L("Print / save as PDF", "طباعة / حفظ PDF")}</button></div></div>
  </div></section>
  <div class="container report-body">
    <div class="card mt-3">${miniTable([L("Item", "البند"), L("Details", "التفاصيل")], [
      [L("Prepared by", "إعداد"), `<strong>${esc(BRAND.createdBy)}</strong>`], [L("Institution", "المؤسسة"), esc(BRAND.department)],
      [L("System", "النظام"), L("Data Agent — the official “Ask the data” chatbot of the Medical Analytics Training platform", "وكيل البيانات — روبوت المحادثة الرسمي «اسأل البيانات» في منصة تدريب تحليلات البيانات الطبية")],
      [L("Date", "التاريخ"), REPORT_META.date], [L("Data", "البيانات"), L("Realistic training data, prepared for teaching", "بيانات تدريبية واقعية مُعدّة للتعليم")]])}</div>

    <section class="block"><h2>1. ${L("Executive summary", "الملخص التنفيذي")}</h2><div class="card"><ul class="mb-0">
      <li>${L("The Data Agent is the platform's official chatbot for asking questions about the data in plain English or Arabic. It is available on every page through the <strong>“Ask the data”</strong> button.", "وكيل البيانات هو روبوت المحادثة الرسمي في المنصة لطرح الأسئلة عن البيانات بالعربية أو الإنجليزية البسيطة. وهو متاح في كل صفحة عبر زر <strong>«اسأل البيانات»</strong>.")}</li>
      <li>${L(`It queries the platform's datasets directly: ${fmtInt(rows.length)} cleaned patient records and ${mth} months of clinic activity, plus the platform's forecasts.`, `يستعلم بيانات المنصة مباشرة: ${fmtInt(rows.length)} سجل مريض منظّف و${mth} شهرًا من نشاط العيادات، إضافة إلى توقعات المنصة.`)}</li>
      <li>${L("Every answer comes with its evidence, its reasoning steps and the exact Python query, so any result can be checked.", "تأتي كل إجابة مع دليلها وخطوات استدلالها واستعلام بايثون الدقيق، فيمكن التحقق من أي نتيجة.")}</li>
      <li>${L("It refuses clinical decisions and individual patient look-ups, and records every request in an activity log.", "يرفض القرارات السريرية والبحث عن مرضى أفراد، ويسجّل كل طلب في سجل نشاط.")}</li>
      <li>${L("It works entirely inside the browser with built-in query rules. It does not use a large language model and sends nothing to external services.", "يعمل بالكامل داخل المتصفح بقواعد استعلام مدمجة. ولا يستخدم نموذج لغة كبيرًا ولا يرسل أي شيء إلى خدمات خارجية.")}</li>
      <li>${L(`All ${VERIFY.length} reference questions in Section 6 match values computed independently with Python.`, `جميع الأسئلة المرجعية الـ${VERIFY.length} في القسم 6 تطابق قيمًا حُسبت بشكل مستقل ببايثون.`)}</li></ul></div></section>

    <section class="block"><h2>2. ${L("What the agent can answer", "ما الذي يستطيع الوكيل الإجابة عنه")}</h2>
      ${miniTable([L("Capability", "القدرة"), L("Example question", "مثال سؤال"), L("Data queried", "البيانات المستعلمة"), L("Method", "الطريقة")], caps.map(c => [`<strong>${c[0]}</strong>`, `<button type="button" class="chip-btn" data-try="${esc(c[1])}">${esc(c[1])}</button>`, c[2], c[3]]))}
      <p class="small muted mt-1">${L("Click any example to run it below. Filters can be combined, e.g. “median BMI for women over 65”.", "انقر أي مثال لتشغيله أدناه. يمكن الجمع بين عوامل التصفية، مثل «الوسيط BMI للنساء فوق 65».")}</p></section>

    <section class="block"><h2>3. ${L("How the agent works — step by step", "كيف يعمل الوكيل — خطوة بخطوة")}</h2>
      <ol class="steps">${steps.map((s, i) => `<li class="step"><span class="step-n">${i + 1}</span><div class="step-body"><h3>${s[0]}</h3><p>${s[1]}</p></div></li>`).join("")}</ol></section>

    <section class="block"><h2>4. ${L("See inside: trace a question", "انظر إلى الداخل: تتبّع سؤالًا")}</h2>
      <p class="muted">${L("Type any question. The panel shows what the agent understood, which checks it applied, the query it ran, and the answer — exactly as in the chat.", "اكتب أي سؤال. تُظهر اللوحة ما فهمه الوكيل، والفحوص التي طبّقها، والاستعلام الذي شغّله، والإجابة — تمامًا كما في المحادثة.")}</p>
      <form class="agent-form card" id="tr-form" style="border-top:0"><label class="sr-only" for="tr-q">${L("Question", "السؤال")}</label><input id="tr-q" type="text" dir="auto" value="${esc(L("What is the average fasting glucose for smokers?", "ما متوسط سكر الصائم لدى المدخنين؟"))}"><button class="btn btn-primary btn-sm" type="submit">${L("Trace", "تتبّع")}</button></form>
      <div class="grid grid-2 mt-2"><div class="card" id="tr-understand"></div><div class="card report-chat" id="tr-answer"></div></div></section>

    <section class="block"><h2>5. ${L("Data the agent queries", "البيانات التي يستعلمها الوكيل")}</h2>
      ${miniTable([L("Source", "المصدر"), L("Contents", "المحتوى"), { t: L("Size", "الحجم"), num: true }, L("Used for", "يُستخدم لـ")], [
        ["<code>clean_patient_screening_data</code>", L("One row per screening visit after cleaning", "صف لكل زيارة فحص بعد التنظيف"), `${fmtInt(rows.length)} × ${d.clean.columns.length}`, L("counts, statistics, comparisons, correlation, completeness, clinics", "الأعداد والإحصاءات والمقارنات والارتباط والاكتمال والعيادات")],
        ["<code>monthly_clinic_activity</code>", L("Monthly screening, follow-up and lab totals 2019–2024", "مجاميع الفحص والمتابعة والمختبر شهريًا 2019–2024"), `${mth} × 4`, L("activity volumes and yearly change", "أحجام النشاط والتغير السنوي")],
        ["<code>forecast results</code>", L("12-month forecasts with likely ranges (Lecture 1, Section 19)", "توقعات 12 شهرًا مع النطاقات المرجحة (المحاضرة 1، القسم 19)"), "3 × 12", L("capacity planning questions", "أسئلة تخطيط السعة")]])}
      <p class="small muted mt-1">${L("The agent reads only aggregated results from these tables. It never displays a single patient's record.", "يقرأ الوكيل نتائج مجمّعة فقط من هذه الجداول. ولا يعرض سجل مريض واحد أبدًا.")}</p></section>

    <section class="block"><h2>6. ${L("Verification of answers", "التحقق من الإجابات")}</h2>
      <p class="muted">${L("Each question below is run live through the agent now, and its answer is compared with the value computed independently in Python (pandas).", "يُشغَّل كل سؤال أدناه مباشرة عبر الوكيل الآن، وتُقارن إجابته بالقيمة المحسوبة بشكل مستقل ببايثون (pandas).")}</p>
      <div id="verify"></div></section>

    <section class="block"><h2>7. ${L("Guardrails, privacy and governance", "الضوابط والخصوصية والحوكمة")}</h2><div class="grid grid-2">
      <div class="card"><h3>${L("What the agent will not do", "ما لن يفعله الوكيل")}</h3><ul class="mb-0">
        <li>${L("Give diagnosis, treatment, triage or medication advice — it refers the user to the responsible clinician.", "تقديم تشخيص أو علاج أو فرز أو نصيحة دوائية — بل يحيل المستخدم إلى الطبيب المسؤول.")}</li>
        <li>${L("Look up, display or discuss an individual patient's record.", "البحث عن سجل مريض فرد أو عرضه أو مناقشته.")}</li>
        <li>${L("Invent numbers: if a question cannot be matched to an approved query, it says so and suggests supported questions.", "اختلاق أرقام: إذا تعذّر ربط السؤال باستعلام معتمد يقول ذلك ويقترح أسئلة مدعومة.")}</li>
        <li>${L("Send data anywhere: all processing happens in the user's browser.", "إرسال البيانات إلى أي مكان: كل المعالجة تتم في متصفح المستخدم.")}</li></ul></div>
      <div class="card"><h3>${L("How it stays accountable", "كيف يبقى خاضعًا للمساءلة")}</h3><ul class="mb-0">
        <li>${L("Every answer shows its evidence table, reasoning and Python query.", "كل إجابة تُظهر جدول الدليل والاستدلال واستعلام بايثون.")}</li>
        <li>${L("Every request is logged with its intent and outcome (Section 9).", "كل طلب يُسجَّل مع نيته ونتيجته (القسم 9).")}</li>
        <li>${L("Comparisons and correlations are worded as associations, never as causes.", "تُصاغ المقارنات والارتباطات كارتباطات لا كأسباب أبدًا.")}</li>
        <li>${L("Small groups trigger a caution; forecasts always include a likely range.", "تُطلق المجموعات الصغيرة تحذيرًا؛ وتتضمن التوقعات دائمًا نطاقًا مرجحًا.")}</li></ul></div></div></section>

    <section class="block"><h2>8. ${L("Limitations", "القيود")}</h2><div class="card"><ul class="mb-0">
      <li>${L("Understanding is rule-based: the agent recognises the measurements, groups and question types listed in Section 2. Unusual wording may not be understood — it then says so instead of guessing.", "الفهم قائم على القواعد: يتعرف الوكيل على القياسات والمجموعات وأنواع الأسئلة المذكورة في القسم 2. وقد لا يُفهم الأسلوب غير المعتاد — فيقول ذلك بدل التخمين.")}</li>
      <li>${L("One measurement per question (two for relationships); one comparison dimension at a time.", "قياس واحد لكل سؤال (اثنان للعلاقات)؛ وبُعد مقارنة واحد في كل مرة.")}</li>
      <li>${L("It answers from the platform's training data only; results describe that data, not wider populations.", "يجيب من بيانات المنصة التدريبية فقط؛ والنتائج تصف تلك البيانات لا مجتمعات أوسع.")}</li>
      <li>${L("“risk_group” is a teaching label created by a simple rule, not a clinical assessment.", "«risk_group» تسمية تعليمية أُنشئت بقاعدة بسيطة، وليست تقييمًا سريريًا.")}</li></ul></div></section>

    <section class="block"><h2>9. ${L("Activity log (this browser session)", "سجل النشاط (جلسة هذا المتصفح)")}</h2><div id="audit"></div></section>

    <section class="block"><h2>10. ${L("Ownership", "الملكية")}</h2><div class="card"><p class="mb-0">${L(`The Data Agent and the Medical Analytics Training platform were created by <strong>${esc(BRAND.createdBy)}</strong> (${esc(BRAND.department)}). Changes to the agent's capabilities or guardrails are made in <code>js/agent.js</code> and should be re-verified with the checks in Section 6.`, `أُنشئ وكيل البيانات ومنصة تدريب تحليلات البيانات الطبية من قِبل <strong>${esc(BRAND.createdBy)}</strong> (${esc(BRAND.department)}). تُجرى التغييرات على قدرات الوكيل أو ضوابطه في <code>js/agent.js</code> ويجب إعادة التحقق منها بفحوص القسم 6.`)}</p></div></section>
  </div>`;

  const trace = text => {
    const it = Agent.understand(text), res = Agent.ask(text);
    const filt = it.filters.length ? it.filters.map(f => `<span class="chip">${esc(f[0])} = ${esc(f[1])}</span>`).join(" ") : "—";
    document.getElementById("tr-understand").innerHTML = `<h3>${L("What the agent understood", "ما فهمه الوكيل")}</h3>${miniTable([L("Element", "العنصر"), L("Detected", "المكتشف")], [
      [L("Language", "اللغة"), res.lang === "ar" ? "العربية" : "English"], [L("Intent", "النية"), `<code>${it.intent}</code>`],
      [L("Measurement(s)", "القياس/القياسات"), it.vars.length ? it.vars.map(v => `<code>${v}</code>`).join(" ") : "—"], [L("Statistic", "الإحصاءة"), `<code>${it.stat}</code>`],
      [L("Groups & filters", "المجموعات والتصفية"), filt], [L("Grouped by", "مجمّع حسب"), it.by ? `<code>${it.by}</code>` : "—"],
      [L("Outcome", "النتيجة"), `<span class="badge ${res.status === "answered" ? "success" : res.status === "refused" ? "warn" : "danger"}">${res.status}</span>`]])}`;
    document.getElementById("tr-answer").innerHTML = `<h3>${L("Answer", "الإجابة")}</h3>${AgentUI.renderAnswer(res).replace("<details class=\"agent-how\">", "<details class=\"agent-how\" open>")}`;
    renderAudit();
  };
  const renderAudit = () => {
    const h = Agent.history().slice().reverse();
    document.getElementById("audit").innerHTML = h.length ? miniTable([L("Time", "الوقت"), L("Question", "السؤال"), L("Intent", "النية"), L("Outcome", "النتيجة")], h.slice(0, 40).map(x => [new Date(x.t).toLocaleTimeString(App.lang === "ar" ? "ar" : "en-GB"), esc(x.q), `<code>${x.i}</code>`, x.s]), { maxH: 360 }) : `<p class="muted">${L("No questions yet in this session.", "لا أسئلة بعد في هذه الجلسة.")}</p>`;
  };
  const verify = () => {
    const out = VERIFY.map(v => { const q = LT(v.q), res = Agent.ask(q), text = res.answer.replace(/<[^>]+>/g, ""); return [esc(q), `<span class="small">${esc(text.slice(0, 110))}${text.length > 110 ? "…" : ""}</span>`, `<code>${esc(v.how)}</code> = <strong>${v.expect}</strong>`, text.includes(v.expect) ? `<span class="badge success">✓ ${L("match", "مطابق")}</span>` : `<span class="badge danger">✗</span>`]; });
    const ok = out.filter(r => r[3].includes("success")).length;
    document.getElementById("verify").innerHTML = `${miniTable([L("Question", "السؤال"), L("Agent's answer", "إجابة الوكيل"), L("Python reference", "مرجع بايثون"), L("Result", "النتيجة")], out)}<p class="mt-1"><strong>${ok} / ${out.length}</strong> ${L("answers match the independent Python values.", "إجابات تطابق قيم بايثون المستقلة.")}</p>`;
  };
  verify(); trace(document.getElementById("tr-q").value);
  document.getElementById("tr-form").addEventListener("submit", e => { e.preventDefault(); trace(document.getElementById("tr-q").value); });
  main.querySelectorAll("[data-try]").forEach(b => b.addEventListener("click", () => { document.getElementById("tr-q").value = b.dataset.try; trace(b.dataset.try); document.getElementById("tr-q").scrollIntoView({ block: "center" }); }));
  document.getElementById("rp-open-agent").addEventListener("click", () => AgentUI.open());
  document.getElementById("rp-print").addEventListener("click", () => window.print());
}

document.addEventListener("DOMContentLoaded", () => {
  Shell.init({ page: "report", current: "report" });
  renderReport();
  document.title = `${L("Data Agent — Official Report", "وكيل البيانات — التقرير الرسمي")} · ${BRAND.createdBy}`;
  App.on("lang", () => { renderReport(); document.title = `${L("Data Agent — Official Report", "وكيل البيانات — التقرير الرسمي")} · ${BRAND.createdBy}`; });
});
