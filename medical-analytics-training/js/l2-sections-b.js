/* =====================================================================
   Lecture 2 — Sections 07–12 (automation, monitoring, reporting,
   Created by Master of AI.
   AI assistants, AI agents, governance)
   The AI demonstrations are SIMULATIONS: no AI model is called. Answers
   are assembled from the real data to show how a grounded assistant or
   an agent works, step by step.
   ===================================================================== */
const SIM_NOTE = () => L("This walkthrough shows the platform's official Data Agent step by step. The agent queries the real data in your browser using built-in query rules (it does not use a large language model). Use the “Ask the data” button to ask it your own questions.", "تعرض هذه الجولة وكيل البيانات الرسمي في المنصة خطوة بخطوة. يستعلم الوكيل البيانات الحقيقية في متصفحك باستخدام قواعد استعلام مدمجة (ولا يستخدم نموذج لغة كبيرًا). استخدم زر «اسأل البيانات» لطرح أسئلتك الخاصة.");

function runLog(el, items, delay, onDone) {
  clearInterval(Lec.timers[el.id]);
  el.innerHTML = "";
  let i = 0;
  const add = () => {
    if (i >= items.length) { clearInterval(Lec.timers[el.id]); if (onDone) onDone(); return; }
    const it = items[i++], li = document.createElement("li");
    li.className = it.cls || "ok";
    li.innerHTML = `<span class="ic">${it.ic || (it.cls === "fail" ? "✕" : it.cls === "info" ? "i" : "✓")}</span><div><div class="t">${it.t}</div>${it.d ? `<div class="d">${it.d}</div>` : ""}</div>`;
    el.appendChild(li);
    if (it.stop) { clearInterval(Lec.timers[el.id]); if (onDone) onDone(); }
  };
  if (prefersReducedMotion() || !delay) { while (i < items.length) { const it = items[i++], li = document.createElement("li"); li.className = it.cls || "ok"; li.innerHTML = `<span class="ic">${it.ic || (it.cls === "fail" ? "✕" : it.cls === "info" ? "i" : "✓")}</span><div><div class="t">${it.t}</div>${it.d ? `<div class="d">${it.d}</div>` : ""}</div>`; el.appendChild(li); } if (onDone) onDone(); return; }
  add();
  Lec.timers[el.id] = setInterval(add, delay);
}

/* =====================================================================
   07 — Automating the pipeline
   ===================================================================== */
Lec.add({
  id: "automation", num: 7, aliases: ["pipeline-automation"],
  title: { en: "Automating the Pipeline", ar: "أتمتة المسار" },
  short: { en: "Automation", ar: "الأتمتة" },
  summary: { en: "A monthly run that checks, cleans, analyses and publishes by itself.", ar: "تشغيل شهري يفحص وينظّف ويحلّل وينشر من تلقاء نفسه." },
  render(root) {
    const st = getState("auto", { bad: false }), q = SD().quality.summary, d = SD();
    setCode("l2-auto", Snip.pipelineRun(st.bad));
    root.innerHTML = lesson(this, {
      simple: L("Automation means the steps from Lecture 1 run <strong>by themselves on a schedule</strong> (for example on the 1st of every month): get the new file, check it, clean it, recalculate everything and update the dashboard. If a check fails, it <strong>stops and warns a person</strong> instead of publishing bad numbers.",
        "الأتمتة تعني أن خطوات المحاضرة 1 تعمل <strong>تلقائيًا وفق جدول زمني</strong> (مثلًا في اليوم الأول من كل شهر): تجلب الملف الجديد، وتفحصه، وتنظّفه، وتعيد حساب كل شيء، وتحدّث لوحة المؤشرات. وإذا فشل فحص ما <strong>تتوقف وتنبّه شخصًا</strong> بدلًا من نشر أرقام سيئة."),
      why: [L("No more late nights copying spreadsheets.", "لا مزيد من السهر في نسخ جداول البيانات."), L("Every month is processed exactly the same way.", "كل شهر يُعالَج بالطريقة نفسها تمامًا."), L("Bad data is caught before anyone sees it.", "تُكتشف البيانات السيئة قبل أن يراها أحد.")],
      steps: [
        { t: L("Schedule", "الجدولة"), d: L("A scheduler starts the pipeline at a fixed time.", "يبدأ مُجدوِل المسارَ في وقت ثابت."), ex: L("every month, 1st day, 06:00", "كل شهر، اليوم الأول، الساعة 06:00") },
        { t: L("Extract", "الاستخراج"), d: L("Collect the new files from the clinics.", "اجمع الملفات الجديدة من العيادات.") },
        { t: L("Validate (quality gates)", "التحقق (بوابات الجودة)"), d: L("Automatic checks with clear pass/fail limits.", "فحوص تلقائية بحدود نجاح/فشل واضحة."), ex: L("all 20 columns present · ≥ 95% filled · ≤ 3% duplicates", "الأعمدة العشرون موجودة · ≥ 95% ممتلئ · ≤ 3% تكرارات") },
        { t: L("Clean, analyse, forecast", "التنظيف والتحليل والتوقع"), d: L("The same written rules and calculations as Lecture 1.", "القواعد والحسابات المكتوبة نفسها في المحاضرة 1.") },
        { t: L("Publish and notify", "النشر والإشعار"), d: L("Update the dashboard and send a short summary — or an alert if something failed.", "حدّث لوحة المؤشرات وأرسل ملخصًا قصيرًا — أو تنبيهًا إذا فشل شيء.") },
      ],
      seeTitle: L("Run the monthly pipeline", "شغّل المسار الشهري"),
      see: `<div class="controls"><label class="toggle-row"><input type="checkbox" id="au-bad" ${st.bad ? "checked" : ""}> ${L("Simulate a bad incoming file (one clinic sent a broken export)", "حاكِ ملفًا واردًا سيئًا (أرسلت عيادة ملفًا معطوبًا)")}</label>
        <button type="button" class="btn btn-primary" id="au-run">${ICON.play} ${L("Run pipeline", "شغّل المسار")}</button></div>
        <div class="coded mt-2">${codeChip("l2-auto")}<ol class="run-log" id="au-log" aria-live="polite"></ol></div>`,
      results: `<div id="au-msg"><p class="muted mb-0">${L("Press “Run pipeline” to watch each step.", "اضغط «شغّل المسار» لمشاهدة كل خطوة.")}</p></div>`,
      remember: L("Automate the routine; let quality gates stop bad data; alert a human when something fails.", "أتمت الروتين؛ ودع بوابات الجودة توقف البيانات السيئة؛ ونبّه إنسانًا عند الفشل."),
      quiz: { q: L("A quality gate fails during the monthly run. What should happen?", "فشلت بوابة جودة أثناء التشغيل الشهري. ماذا يجب أن يحدث؟"), options: [
        { t: L("Stop, keep last month's dashboard, alert the data team", "التوقف، والإبقاء على لوحة الشهر الماضي، وتنبيه فريق البيانات"), ok: true, why: L("Better a slightly old number than a wrong new one.", "رقم قديم قليلًا أفضل من رقم جديد خاطئ.") },
        { t: L("Publish anyway — people are waiting", "النشر على أي حال — الناس ينتظرون"), why: L("Publishing bad numbers damages trust and decisions.", "نشر أرقام سيئة يضر بالثقة والقرارات.") }] },
    });
    const run = () => {
      const fc = d.forecast.series.screening_visits;
      const good = [
        { cls: "info", t: L("06:00 — Scheduled run started", "06:00 — بدأ التشغيل المجدول"), d: L("Trigger: monthly schedule", "المُشغِّل: الجدول الشهري") },
        { t: L("Extract: 6 clinic files received", "الاستخراج: استُلمت ملفات 6 عيادات"), d: L(`${fmtInt(q.rows)} rows in total`, `${fmtInt(q.rows)} صفًا إجمالًا`) },
        { t: L("Gate 1 — structure: all 20 expected columns present", "البوابة 1 — البنية: الأعمدة العشرون المتوقعة موجودة"), d: L("PASS", "نجاح") },
        { t: L(`Gate 2 — completeness: ${q.completeness_pct}% filled (limit ≥ 95%)`, `البوابة 2 — الاكتمال: ${q.completeness_pct}% ممتلئ (الحد ≥ 95%)`), d: L("PASS", "نجاح") },
        { t: L(`Gate 3 — duplicates: ${q.exact_duplicate_pct}% (limit ≤ 3%)`, `البوابة 3 — التكرارات: ${q.exact_duplicate_pct}% (الحد ≤ 3%)`), d: L("PASS", "نجاح") },
        { t: L(`Clean: ${fmtInt(d.clean.rows.length)} rows after the written rules`, `التنظيف: ${fmtInt(d.clean.rows.length)} صفًا بعد القواعد المكتوبة`), d: L(`${d.cleaningLog.length - 2} rules applied and logged`, `طُبّقت ${d.cleaningLog.length - 2} قاعدة وسُجّلت`) },
        { t: L("Analyse: KPIs, statistics and quality report recalculated", "التحليل: أُعيد حساب المؤشرات والإحصاءات وتقرير الجودة") },
        { t: L(`Forecast refreshed: ≈ ${fmtInt(fc.forecast.reduce((a, b) => a + b, 0))} visits for the next 12 months`, `تحديث التوقع: ≈ ${fmtInt(fc.forecast.reduce((a, b) => a + b, 0))} زيارة للأشهر الـ12 القادمة`) },
        { t: L("Publish: dashboard updated", "النشر: حُدّثت لوحة المؤشرات") },
        { cls: "info", t: L("Notify: summary e-mail sent to the operations team", "الإشعار: أُرسل بريد ملخص إلى فريق العمليات"), d: L("Run finished in 2 min 14 s", "انتهى التشغيل في دقيقتين و14 ثانية") },
      ];
      const bad = [good[0], { t: L("Extract: 6 clinic files received", "الاستخراج: استُلمت ملفات 6 عيادات"), d: L("1 file from CL04 is much smaller than usual", "ملف واحد من CL04 أصغر بكثير من المعتاد") },
        { cls: "fail", t: L("Gate 1 — structure: column “fasting_glucose” is missing in the CL04 file", "البوابة 1 — البنية: العمود «fasting_glucose» مفقود في ملف CL04"), d: L("FAIL", "فشل") },
        { cls: "fail", t: L("Gate 2 — completeness: 71% filled (limit ≥ 95%)", "البوابة 2 — الاكتمال: 71% ممتلئ (الحد ≥ 95%)"), d: L("FAIL", "فشل") },
        { cls: "fail", t: L("Pipeline stopped — nothing published", "توقف المسار — لم يُنشر شيء"), d: L("Dashboard keeps showing last month's verified numbers", "تستمر لوحة المؤشرات بعرض أرقام الشهر الماضي المُتحقَّق منها"), stop: false },
        { cls: "info", t: L("Alert sent to the data team and the CL04 clinic lead", "أُرسل تنبيه إلى فريق البيانات وقائد عيادة CL04"), d: L("“Please re-export the file with all columns.”", "«يرجى إعادة تصدير الملف بكل الأعمدة.»") }];
      const items = st.bad ? bad : good;
      root.querySelector("#au-msg").innerHTML = `<p class="muted mb-0">${L("Running…", "جارٍ التشغيل…")}</p>`;
      runLog(root.querySelector("#au-log"), items, 450, () => {
        root.querySelector("#au-msg").innerHTML = st.bad
          ? `<p class="mb-0">${L("The quality gates did their job: the broken file was caught <strong>before</strong> anyone saw wrong numbers. A person fixes the source, then the pipeline is simply run again.", "أدّت بوابات الجودة عملها: اكتُشف الملف المعطوب <strong>قبل</strong> أن يرى أحد أرقامًا خاطئة. يصلح شخصٌ المصدر ثم يُعاد تشغيل المسار ببساطة.")}</p>`
          : `<p class="mb-0">${L("Every gate passed, so the new numbers were published automatically — the same steps, in the same order, as every month.", "نجحت كل البوابات، فنُشرت الأرقام الجديدة تلقائيًا — الخطوات نفسها وبالترتيب نفسه كل شهر.")}</p>`;
      });
    };
    root.querySelector("#au-run").addEventListener("click", run);
    root.querySelector("#au-bad").addEventListener("change", e => { st.bad = e.target.checked; setCode("l2-auto", Snip.pipelineRun(st.bad)); root.querySelector("#au-log").innerHTML = ""; root.querySelector("#au-msg").innerHTML = `<p class="muted mb-0">${L("Press “Run pipeline” to watch each step.", "اضغط «شغّل المسار» لمشاهدة كل خطوة.")}</p>`; });
  },
});

/* =====================================================================
   08 — Data-quality monitoring & alerts
   ===================================================================== */
Lec.add({
  id: "quality-monitoring", num: 8, aliases: ["monitoring"],
  title: { en: "Watching Data Quality Over Time", ar: "مراقبة جودة البيانات عبر الزمن" },
  short: { en: "Quality monitoring", ar: "مراقبة الجودة" },
  summary: { en: "Measure quality every month and raise an alert when it slips.", ar: "قِس الجودة كل شهر وأطلق تنبيهًا عند تراجعها." },
  render(root) {
    const st = getState("mon", { field: "medication_adherence_pct", limit: 14 });
    const fields = ["medication_adherence_pct", "total_cholesterol", "hba1c", "fasting_glucose", "bmi", "clinic_id"];
    root.innerHTML = lesson(this, {
      simple: L("Quality is not checked once — it is <strong>measured every month</strong>, like any other KPI. When a measure crosses an agreed limit, an <strong>alert</strong> goes to the people who can fix the source.",
        "لا تُفحص الجودة مرة واحدة — بل <strong>تُقاس كل شهر</strong> مثل أي مؤشر آخر. وعندما يتجاوز مقياس ما حدًا متفقًا عليه يذهب <strong>تنبيه</strong> إلى من يستطيعون إصلاح المصدر."),
      why: [L("Problems are caught in weeks, not at year-end.", "تُكتشف المشكلات خلال أسابيع لا في نهاية العام."), L("Trends show whether training or system fixes are working.", "تُظهر الاتجاهات ما إذا كان التدريب أو إصلاحات الأنظمة تنجح.")],
      steps: [
        { t: L("Choose quality measures", "اختر مقاييس الجودة"), d: L("e.g. % of records with adherence missing.", "مثل نسبة السجلات التي ينقصها الالتزام.") },
        { t: L("Calculate them every month", "احسبها كل شهر"), d: L("Group the raw records by visit month.", "جمّع السجلات الخام حسب شهر الزيارة.") },
        { t: L("Agree a limit", "اتفق على حد"), d: L("e.g. alert if more than 14% is missing.", "مثل التنبيه إذا كان أكثر من 14% مفقودًا.") },
        { t: L("Alert and follow up", "نبّه وتابع"), d: L("Send the alert to an owner who can act, and record what was done.", "أرسل التنبيه إلى مالك يستطيع التصرف، وسجّل ما تم فعله.") },
      ],
      seeTitle: L("Monthly quality monitor (raw incoming records)", "مراقب الجودة الشهري (السجلات الخام الواردة)"),
      see: `<div class="controls">${selectEl("mo-f", fields.map(f => ({ value: f, label: f === "clinic_id" ? glabel("clinic_id") : vlabel(f) })), st.field, L("Field", "الحقل"))}
          <div class="field" style="flex:1 1 240px"><label for="mo-l">${L("Alert limit: % missing", "حد التنبيه: نسبة المفقود")}</label><div class="range-row"><input type="range" id="mo-l" min="2" max="25" value="${st.limit}"><output id="mo-l-o">${st.limit}%</output></div></div></div>
        <div class="chart-card mt-2">${codeChip("l2-mon")}<div class="chart-sub">${L("Blue line = % missing each month · red line = alert limit", "الخط الأزرق = نسبة المفقود كل شهر · الخط الأحمر = حد التنبيه")}</div><div id="mo-chart"></div></div>
        <div class="card mt-2" id="mo-alerts"></div>`,
      results: `<div id="mo-msg"></div>`,
      remember: L("Treat data quality as a KPI: measure it monthly, set limits, alert an owner.", "تعامل مع جودة البيانات كمؤشر أداء: قِسها شهريًا، وضع حدودًا، ونبّه مالكًا."),
    });
    const draw = () => {
      const by = {};
      Data.messy().forEach(r => { const dte = CleanRules.parseDate(r.visit_date); if (!dte) return; const k = dte.slice(0, 7); (by[k] = by[k] || { n: 0, miss: 0 }).n++; if (CleanRules.isMiss(r[st.field])) by[k].miss++; });
      const keys = Object.keys(by).sort(), pct = keys.map(k => (100 * by[k].miss) / by[k].n);
      Charts.line(root.querySelector("#mo-chart"), { labels: keys, series: [{ name: L("% missing", "نسبة المفقود"), values: pct, cls: "c1", dots: true }, { name: L("limit", "الحد"), values: keys.map(() => st.limit), cls: "danger", dash: "6 4", width: 1.8 }], yDomain: [0, Math.max(st.limit + 5, Math.ceil(Math.max(...pct) / 5) * 5)], yLabel: "%", height: 260 });
      const alerts = keys.map((k, i) => ({ k, p: pct[i], n: by[k].n })).filter(x => x.p > st.limit);
      setCode("l2-mon", Snip.monitor(st.field, st.limit, `${alerts.length} ${L("alerts", "تنبيهات")} · ${L("limit", "الحد")} ${st.limit}%`));
      root.querySelector("#mo-alerts").innerHTML = `${codeChip("l2-mon")}<h3>${alerts.length ? `🔔 ${alerts.length} ${L("alerts", "تنبيهات")}` : `✅ ${L("No alerts", "لا تنبيهات")}`}</h3>${alerts.length ? miniTable([L("Month", "الشهر"), { t: L("% missing", "نسبة المفقود"), num: true }, { t: L("Records", "السجلات"), num: true }, L("Action", "الإجراء")], alerts.map(a => [monthLabel(a.k), fmt(a.p, 1), a.n, L("notify clinic leads", "إشعار قادة العيادات")])) : `<p class="muted mb-0">${L("Every month is within the limit.", "كل الأشهر ضمن الحد.")}</p>`}`;
      const avg = Stats.mean(pct);
      root.querySelector("#mo-msg").innerHTML = `<ul><li>${L(`On average ${fmt(avg, 1)}% of ${st.field} values are missing each month, ranging from ${fmt(Math.min(...pct), 1)}% to ${fmt(Math.max(...pct), 1)}%.`, `في المتوسط ${fmt(avg, 1)}% من قيم ${st.field} مفقودة كل شهر، بين ${fmt(Math.min(...pct), 1)}% و${fmt(Math.max(...pct), 1)}%.`)}</li>
        <li>${L(`With a limit of ${st.limit}%, ${alerts.length} of ${keys.length} months would have triggered an alert.`, `مع حد ${st.limit}%، كان ${alerts.length} من أصل ${keys.length} شهرًا سيُطلق تنبيهًا.`)}</li>
        <li>${L("Set the limit too low and people ignore constant alerts; too high and real problems slip through. Agree it with the people who will receive the alerts.", "إذا كان الحد منخفضًا جدًا يتجاهل الناس التنبيهات المستمرة؛ وإذا كان مرتفعًا جدًا تتسلل المشكلات الحقيقية. اتفق عليه مع من سيتلقون التنبيهات.")}</li></ul>`;
    };
    draw();
    root.querySelector("#mo-f").addEventListener("change", e => { st.field = e.target.value; draw(); });
    root.querySelector("#mo-l").addEventListener("input", e => { st.limit = +e.target.value; root.querySelector("#mo-l-o").textContent = `${st.limit}%`; draw(); });
  },
});

/* =====================================================================
   09 — Automated reports
   ===================================================================== */
Lec.add({
  id: "automated-reports", num: 9, aliases: ["reporting"],
  title: { en: "Reports That Write Themselves", ar: "تقارير تكتب نفسها" },
  short: { en: "Automated reports", ar: "التقارير الآلية" },
  summary: { en: "Turning numbers into a short written summary — with simple rules.", ar: "تحويل الأرقام إلى ملخص مكتوب قصير — بقواعد بسيطة." },
  render(root) {
    const mth = BI.monthly(), st = getState("rep", { ym: mth[mth.length - 1].ym });
    root.innerHTML = lesson(this, {
      simple: L("An automated report fills a <strong>fixed template</strong> with the latest numbers and uses a few <strong>simple rules</strong> to choose the words (for example “increased” when growth is above 2%). No AI is needed — and every sentence can be traced back to a number.",
        "يملأ التقرير الآلي <strong>قالبًا ثابتًا</strong> بأحدث الأرقام ويستخدم بضع <strong>قواعد بسيطة</strong> لاختيار الكلمات (مثل «ارتفع» عندما يتجاوز النمو 2%). لا حاجة إلى ذكاء اصطناعي — وكل جملة يمكن ردها إلى رقم."),
      why: [L("Busy managers read two paragraphs, not twelve charts.", "المديرون المشغولون يقرؤون فقرتين لا اثني عشر رسمًا."), L("The same wording rules every month = consistent, fair comparisons.", "قواعد الصياغة نفسها كل شهر = مقارنات متسقة وعادلة.")],
      steps: [
        { t: L("Calculate the numbers", "احسب الأرقام"), d: L("This month, last month, same month last year.", "هذا الشهر، والشهر الماضي، والشهر نفسه العام الماضي.") },
        { t: L("Apply wording rules", "طبّق قواعد الصياغة"), d: L("change > +2% → “increased”; < −2% → “decreased”; otherwise “was stable”.", "تغيّر > +2% ← «ارتفع»؛ < −2% ← «انخفض»؛ وإلا ← «استقر».") },
        { t: L("Fill the template", "املأ القالب"), d: L("Insert the numbers and words into fixed sentences.", "أدخل الأرقام والكلمات في جمل ثابتة.") },
        { t: L("Send it automatically", "أرسله تلقائيًا"), d: L("As part of the monthly pipeline (Section 07).", "كجزء من المسار الشهري (القسم 07).") },
      ],
      seeTitle: L("Generate the report for any month", "أنشئ التقرير لأي شهر"),
      see: `<div class="controls">${selectEl("rp-m", mth.slice(13).map(m => ({ value: m.ym, label: monthLabel(m.ym) })).reverse(), st.ym, L("Month", "الشهر"))}</div>
        <div class="grid grid-2 mt-2"><div class="report-paper" id="rp-paper" aria-live="polite"></div><div class="chart-card">${codeChip("l2-rep")}<div class="chart-title">${L("Screening visits: last 13 months", "زيارات الفحص: آخر 13 شهرًا")}</div><div id="rp-chart"></div></div></div>
        <div class="row mt-2"><button type="button" class="btn" id="rp-copy">${ICON.copy} ${L("Copy report text", "نسخ نص التقرير")}</button></div>`,
      results: `<p class="mb-0">${L("Highlighted words were chosen by the rules from the numbers. Change the month and the whole text updates — the same way an automated monthly e-mail would.", "الكلمات المميَّزة اختارتها القواعد من الأرقام. غيّر الشهر فيتحدث النص كله — بالطريقة نفسها التي يعمل بها بريد شهري آلي.")}</p>`,
      remember: L("Template + rules = clear, consistent, traceable reports every month.", "قالب + قواعد = تقارير واضحة ومتسقة وقابلة للتتبع كل شهر."),
    });
    const word = p => (p > 2 ? L("increased", "ارتفعت") : p < -2 ? L("decreased", "انخفضت") : L("were stable", "استقرت"));
    const draw = () => {
      const i = mth.findIndex(m => m.ym === st.ym), cur = mth[i], prev = mth[i - 1], ly = mth[i - 12];
      setCode("l2-rep", Snip.report(st.ym));
      const pm = BI.pct(cur.screening_visits - prev.screening_visits, prev.screening_visits), py = BI.pct(cur.screening_visits - ly.screening_visits, ly.screening_visits);
      const fu = BI.pct(cur.follow_up_requests - ly.follow_up_requests, ly.follow_up_requests), labRatio = cur.lab_requests / cur.screening_visits;
      const avg3 = (mth[i].screening_visits + mth[i - 1].screening_visits + mth[i - 2].screening_visits) / 3;
      const sgn = v => `${v > 0 ? "+" : ""}${fmt(v, 1)}%`;
      root.querySelector("#rp-paper").innerHTML = `${codeChip("l2-rep")}<h3>${L("Monthly screening summary", "ملخص الفحص الشهري")} — ${monthLabel(cur.ym)}</h3><div class="meta">${L("Generated automatically from the screening data", "أُنشئ تلقائيًا من بيانات الفحص")} · ${esc(BRAND.companyName)}</div>
        <p>${L(`In ${monthLabel(cur.ym)} the clinics completed <strong>${fmtInt(cur.screening_visits)}</strong> screening visits. Compared with the previous month, visits <mark>${word(pm)}</mark> (${sgn(pm)}); compared with ${monthLabel(ly.ym)} they <mark>${word(py)}</mark> (${sgn(py)}).`,
          `في ${monthLabel(cur.ym)} أنجزت العيادات <strong>${fmtInt(cur.screening_visits)}</strong> زيارة فحص. ومقارنة بالشهر السابق <mark>${word(pm)}</mark> الزيارات (${sgn(pm)})؛ ومقارنة بـ ${monthLabel(ly.ym)} <mark>${word(py)}</mark> (${sgn(py)}).`)}</p>
        <p>${L(`Follow-up requests totalled <strong>${fmtInt(cur.follow_up_requests)}</strong> (${sgn(fu)} year on year) and lab requests <strong>${fmtInt(cur.lab_requests)}</strong>, about <strong>${fmt(labRatio, 2)}</strong> lab requests per screening. The 3-month average is <strong>${fmtInt(avg3)}</strong> visits per month.`,
          `بلغت طلبات المتابعة <strong>${fmtInt(cur.follow_up_requests)}</strong> (${sgn(fu)} سنويًا) وطلبات المختبر <strong>${fmtInt(cur.lab_requests)}</strong>، أي نحو <strong>${fmt(labRatio, 2)}</strong> طلب مختبر لكل فحص. ومتوسط آخر 3 أشهر <strong>${fmtInt(avg3)}</strong> زيارة شهريًا.`)}</p>
        <p class="mb-0">${Math.abs(py) > 8 ? L("<mark>Note:</mark> the year-on-year change is unusually large — worth a closer look.", "<mark>ملاحظة:</mark> التغير السنوي كبير على غير المعتاد — يستحق نظرة أدق.") : L("No unusual changes this month.", "لا تغيرات غير معتادة هذا الشهر.")}</p>`;
      const win = mth.slice(Math.max(0, i - 12), i + 1);
      Charts.bar(root.querySelector("#rp-chart"), { data: win.map((m, j) => ({ label: m.ym.slice(2), value: m.screening_visits, cls: j === win.length - 1 ? "c3" : "c1" })), hideValues: true, format: v => fmtInt(v), height: 250 });
    };
    draw();
    root.querySelector("#rp-m").addEventListener("change", e => { st.ym = e.target.value; draw(); });
    root.querySelector("#rp-copy").addEventListener("click", async () => { const ok = await copyText([...root.querySelectorAll("#rp-paper > :not(.code-chip)")].map(e => e.innerText).join("\n\n")); toast(ok ? t("code.copied") : t("copy.failed")); });
  },
});

/* =====================================================================
   10 — AI assistants (LLMs) in analytics
   ===================================================================== */
function assistantQuestions() {
  const rows = Data.clean(), mth = BI.monthly(), cl = BI.byClinic(rows).sort((a, b) => b.n - a.n), k = BI.kpis(rows);
  const y24 = mth.filter(m => m.ym.startsWith("2024")).reduce((a, m) => a + m.screening_visits, 0), y23 = mth.filter(m => m.ym.startsWith("2023")).reduce((a, m) => a + m.screening_visits, 0);
  const fc = SD().forecast.series.screening_visits, fcT = fc.forecast.reduce((a, b) => a + b, 0);
  return [
    { q: L("Which clinic screened the most patients?", "أي عيادة فحصت أكبر عدد من المرضى؟"),
      data: [[L("Clinic", "العيادة"), L("Patients", "المرضى")], ...cl.slice(0, 3).map(c => [clinicName(c.id), fmtInt(c.n)])],
      a: L(`<strong>${clinicName(cl[0].id)}</strong> screened the most patients: ${fmtInt(cl[0].n)} of ${fmtInt(rows.length)} (${fmt(BI.pct(cl[0].n, rows.length), 0)}%), followed by ${clinicName(cl[1].id)} (${fmtInt(cl[1].n)}).`, `فحصت <strong>${clinicName(cl[0].id)}</strong> أكبر عدد من المرضى: ${fmtInt(cl[0].n)} من أصل ${fmtInt(rows.length)} (${fmt(BI.pct(cl[0].n, rows.length), 0)}%)، تليها ${clinicName(cl[1].id)} (${fmtInt(cl[1].n)}).`) },
    { q: L("How did screening volume change in 2024?", "كيف تغيّر حجم الفحص في 2024؟"),
      data: [[L("Year", "السنة"), L("Screening visits", "زيارات الفحص")], ["2023", fmtInt(y23)], ["2024", fmtInt(y24)]],
      a: L(`Screening visits rose from ${fmtInt(y23)} in 2023 to ${fmtInt(y24)} in 2024 — an increase of <strong>${fmt(BI.pct(y24 - y23, y23), 1)}%</strong>.`, `ارتفعت زيارات الفحص من ${fmtInt(y23)} في 2023 إلى ${fmtInt(y24)} في 2024 — بزيادة <strong>${fmt(BI.pct(y24 - y23, y23), 1)}%</strong>.`) },
    { q: L("What share of records are missing medication adherence?", "ما نسبة السجلات التي ينقصها الالتزام بالدواء؟"),
      data: [[L("Measure", "المقياس"), L("Value", "القيمة")], [L("Patients", "المرضى"), fmtInt(k.n)], [L("Adherence missing", "الالتزام مفقود"), fmtPct(k.adhMissing)]],
      a: L(`<strong>${fmtPct(k.adhMissing)}</strong> of patient records have no adherence value. Lecture 1 showed these gaps are more common when adherence is low, so the recorded average is probably a little optimistic.`, `<strong>${fmtPct(k.adhMissing)}</strong> من سجلات المرضى بلا قيمة التزام. وأظهرت المحاضرة 1 أن هذه الفجوات أكثر شيوعًا عندما يكون الالتزام منخفضًا، لذا فالمتوسط المسجّل غالبًا متفائل قليلًا.`) },
    { q: L("How many screening visits should we plan for next year?", "كم زيارة فحص يجب أن نخطط لها العام القادم؟"),
      data: [[L("Measure", "المقياس"), L("Value", "القيمة")], [L("Forecast, next 12 months", "التوقع للأشهر الـ12 القادمة"), fmtInt(fcT)], [L("Typical error (hold-out)", "الخطأ المعتاد (الاختبار)"), fmtPct(fc.holdout[fc.best_method].mape, 1)]],
      a: L(`Plan for about <strong>${fmtInt(fcT)}</strong> screening visits over the next 12 months. Past forecasts were off by about ${fmt(fc.holdout[fc.best_method].mape, 1)}% on average, so allow a margin either side.`, `خطّط لنحو <strong>${fmtInt(fcT)}</strong> زيارة فحص خلال الأشهر الـ12 القادمة. أخطأت التوقعات السابقة بنحو ${fmt(fc.holdout[fc.best_method].mape, 1)}% في المتوسط، فاترك هامشًا في الاتجاهين.`) },
  ];
}
Lec.add({
  id: "ai-assistants", num: 10, aliases: ["llm"],
  title: { en: "AI Assistants (Large Language Models)", ar: "المساعدون الأذكياء (نماذج اللغة الكبيرة)" },
  short: { en: "AI assistants", ar: "المساعدون الأذكياء" },
  summary: { en: "How chat assistants work, where they fail, and how to keep them honest.", ar: "كيف يعمل مساعدو المحادثة، وأين يخطئون، وكيف نبقيهم صادقين." },
  render(root) {
    const st = getState("asst", { q: 0 }), Q = assistantQuestions(), cur = Q[st.q];
    setCode("l2-asst", Snip.assistantData(st.q));
    root.innerHTML = lesson(this, {
      simple: L("A large language model (LLM) is a program trained on huge amounts of text to <strong>predict the next words</strong>. That makes it very good at writing and explaining — but it can also <strong>sound confident while being wrong</strong>. The fix is “grounding”: give it the real numbers and ask it to answer only from them.",
        "نموذج اللغة الكبير (LLM) برنامج دُرّب على كميات هائلة من النصوص <strong>للتنبؤ بالكلمات التالية</strong>. وهذا يجعله ممتازًا في الكتابة والشرح — لكنه قد <strong>يبدو واثقًا وهو مخطئ</strong>. والحل هو «التأسيس على البيانات»: أعطه الأرقام الحقيقية واطلب منه الإجابة منها فقط."),
      why: [L("People can ask questions in plain language instead of building reports.", "يستطيع الناس طرح الأسئلة بلغة بسيطة بدلًا من بناء التقارير."), L("Without grounding, an assistant may invent numbers (“hallucinate”).", "بدون التأسيس قد يختلق المساعد أرقامًا («هلوسة»).")],
      steps: [
        { t: L("The user asks a question", "يطرح المستخدم سؤالًا"), d: L("“Which clinic screened the most patients?”", "«أي عيادة فحصت أكبر عدد من المرضى؟»") },
        { t: L("The system fetches the real data", "يجلب النظام البيانات الحقيقية"), d: L("A query (like Section 05) gets the exact numbers.", "استعلام (مثل القسم 05) يجلب الأرقام الدقيقة.") },
        { t: L("The model writes the answer from those numbers", "يكتب النموذج الإجابة من تلك الأرقام"), d: L("It is instructed: use only the data provided; say “I don't know” otherwise.", "يُوجَّه بأن: استخدم البيانات المقدمة فقط؛ وقل «لا أعرف» في غير ذلك.") },
        { t: L("Show the sources", "اعرض المصادر"), d: L("The data used is displayed so anyone can check it.", "تُعرض البيانات المستخدمة ليتحقق منها أي شخص.") },
      ],
      seeTitle: L("A grounded assistant — step by step", "مساعد مؤسَّس على البيانات — خطوة بخطوة"),
      seeNote: SIM_NOTE(),
      see: `<div class="stack">${Q.map((x, i) => `<button type="button" class="quiz-option ${i === st.q ? "correct" : ""}" data-aq2="${i}" aria-pressed="${i === st.q}">${x.q}</button>`).join("")}</div>
        <div class="grid grid-2 mt-2"><div class="card"><h3>${L("Conversation", "المحادثة")}</h3><div class="chat">
            <div class="bubble user"><span class="who">${L("Manager", "المدير")}</span>${cur.q}</div>
            <div class="bubble ai"><span class="who">${L("Assistant", "المساعد")}</span>${cur.a}<br><span class="small muted">${L("Source: screening data, shown on the right.", "المصدر: بيانات الفحص، معروضة على اليمين.")}</span></div></div>
            <button type="button" class="btn btn-sm btn-primary mt-2" data-ask-agent="${esc(cur.q.replace(/<[^>]+>/g, ""))}">${ICON.search} ${L("Ask this in the Data Agent", "اسأل هذا في وكيل البيانات")}</button></div>
          <div class="card">${codeChip("l2-asst")}<h3>${L("Data the assistant was given", "البيانات التي أُعطيت للمساعد")}</h3>${miniTable(cur.data[0], cur.data.slice(1))}
            <p class="small muted mt-2 mb-0">${L("Every number in the answer appears in this table — so the answer can be checked.", "كل رقم في الإجابة يظهر في هذا الجدول — فيمكن التحقق من الإجابة.")}</p></div></div>`,
      results: `<ul><li>${L("A grounded answer is short, specific and checkable: the numbers come from the data, not from the model's memory.", "الإجابة المؤسَّسة قصيرة ومحددة وقابلة للتحقق: الأرقام تأتي من البيانات لا من ذاكرة النموذج.")}</li>
        <li>${L("Without the data step, the same model might produce a plausible-sounding but invented answer — dangerous in healthcare.", "بدون خطوة البيانات قد يُنتج النموذج نفسه إجابة تبدو معقولة لكنها مختلَقة — وهذا خطر في الرعاية الصحية.")}</li></ul>`,
      remember: L("Give the assistant the facts, ask it to use only them, and always show the source.", "أعطِ المساعد الحقائق، واطلب منه استخدامها فقط، واعرض المصدر دائمًا."),
      quiz: { q: L("What does it mean when an AI assistant “hallucinates”?", "ماذا يعني أن مساعدًا ذكيًا «يهلوس»؟"), options: [
        { t: L("It states something confidently that is not true or not in the data", "يذكر بثقة شيئًا غير صحيح أو غير موجود في البيانات"), ok: true, why: L("That is why answers must be grounded and checkable.", "لهذا يجب أن تكون الإجابات مؤسَّسة وقابلة للتحقق.") },
        { t: L("It refuses to answer", "يرفض الإجابة"), why: L("Refusing is often the safe behaviour.", "الرفض غالبًا هو السلوك الآمن.") }] },
    });
    root.querySelectorAll("[data-ask-agent]").forEach(b => b.addEventListener("click", () => { AgentUI.open(); AgentUI.send(b.dataset.askAgent); }));
    root.querySelectorAll("[data-aq2]").forEach(b => b.addEventListener("click", () => { st.q = +b.dataset.aq2; this.render(root); root.querySelector(`[data-aq2="${st.q}"]`).focus(); }));
  },
});

/* =====================================================================
   11 — AI agents: plan, act, check
   ===================================================================== */
Lec.add({
  id: "ai-agents", num: 11, aliases: ["agents"],
  title: { en: "AI Agents: Plan, Act, Check", ar: "وكلاء الذكاء الاصطناعي: خطط، نفّذ، تحقّق" },
  short: { en: "AI agents", ar: "الوكلاء الأذكياء" },
  summary: { en: "An assistant that uses tools in steps — and knows when to refuse.", ar: "مساعد يستخدم الأدوات على خطوات — ويعرف متى يرفض." },
  render(root) {
    const st = getState("agent", { task: 0 }), rows = Data.clean(), k = BI.kpis(rows), cl = BI.byClinic(rows), mth = BI.monthly();
    const avgN = Stats.mean(cl.map(c => c.n)), top = cl.slice().sort((a, b) => b.n - a.n)[0];
    const fc = SD().forecast.series.screening_visits, q1 = fc.forecast.slice(0, 3).reduce((a, b) => a + b, 0), q1lo = fc.lower.slice(0, 3).reduce((a, b) => a + b, 0), q1hi = fc.upper.slice(0, 3).reduce((a, b) => a + b, 0);
    const lastQ = mth.slice(-3).reduce((a, m) => a + m.screening_visits, 0), qDiff = BI.pct(q1 - lastQ, lastQ);
    const tasks = [
      { t: L("Compare the busiest clinic with the average clinic", "قارن العيادة الأكثر ازدحامًا بالعيادة المتوسطة"), steps: [
        { cls: "info", ic: "1", t: L("Plan", "التخطيط"), d: L("1) count patients per clinic · 2) find the busiest · 3) compute the average · 4) compare", "1) عدّ المرضى لكل عيادة · 2) جد الأكثر ازدحامًا · 3) احسب المتوسط · 4) قارن") },
        { cls: "info", ic: "⚙", t: L("Tool: run SQL", "الأداة: تشغيل SQL"), d: "<code>SELECT clinic_id, COUNT(*) FROM patients GROUP BY clinic_id;</code>" },
        { t: L("Result received", "استُلمت النتيجة"), d: cl.map(c => `${c.id}: ${c.n}`).join(" · ") },
        { t: L("Check", "التحقق"), d: L(`totals add up: ${fmtInt(cl.reduce((a, c) => a + c.n, 0))} + ${rows.filter(r => !r.clinic_id).length} without a clinic = ${fmtInt(rows.length)} ✔`, `المجاميع متطابقة: ${fmtInt(cl.reduce((a, c) => a + c.n, 0))} + ${rows.filter(r => !r.clinic_id).length} بلا عيادة = ${fmtInt(rows.length)} ✔`) },
        { t: L("Answer", "الإجابة"), d: L(`${clinicName(top.id)} is busiest with ${fmtInt(top.n)} patients — ${fmt(BI.pct(top.n - avgN, avgN), 0)}% above the average clinic (${fmt(avgN, 0)}).`, `${clinicName(top.id)} الأكثر ازدحامًا بـ ${fmtInt(top.n)} مريضًا — أعلى بنسبة ${fmt(BI.pct(top.n - avgN, avgN), 0)}% من العيادة المتوسطة (${fmt(avgN, 0)}).`) } ] },
      { t: L("Prepare next quarter's capacity estimate", "جهّز تقدير السعة للربع القادم"), steps: [
        { cls: "info", ic: "1", t: L("Plan", "التخطيط"), d: L("1) get the forecast · 2) add up the next 3 months · 3) add the likely range · 4) compare with last quarter", "1) اجلب التوقع · 2) اجمع الأشهر الثلاثة القادمة · 3) أضف النطاق المرجح · 4) قارن بالربع الماضي") },
        { cls: "info", ic: "⚙", t: L("Tool: read forecast", "الأداة: قراءة التوقع"), d: `${fc.future_months.slice(0, 3).join(", ")}: ${fc.forecast.slice(0, 3).map(v => fmtInt(v)).join(", ")}` },
        { cls: "info", ic: "⚙", t: L("Tool: run SQL", "الأداة: تشغيل SQL"), d: `<code>SELECT SUM(screening_visits) FROM monthly_activity WHERE month >= '2024-10-01';</code> → ${fmtInt(lastQ)}` },
        { cls: Math.abs(qDiff) <= 10 ? "ok" : "info", t: L("Check", "التحقق"), d: Math.abs(qDiff) <= 10 ? L(`forecast differs from last quarter by ${fmt(qDiff, 1)}% — plausible ✔`, `يختلف التوقع عن الربع الماضي بنسبة ${fmt(qDiff, 1)}% — معقول ✔`) : L(`forecast differs from last quarter by ${fmt(qDiff, 1)}% — larger than usual; flagged for a person to confirm`, `يختلف التوقع عن الربع الماضي بنسبة ${fmt(qDiff, 1)}% — أكبر من المعتاد؛ وُسم ليؤكده شخص`) },
        { t: L("Answer", "الإجابة"), d: L(`Plan for about ${fmtInt(q1)} screening visits next quarter (likely range ${fmtInt(q1lo)}–${fmtInt(q1hi)}), compared with ${fmtInt(lastQ)} last quarter. A person should confirm before rosters are changed.`, `خطّط لنحو ${fmtInt(q1)} زيارة فحص في الربع القادم (النطاق المرجح ${fmtInt(q1lo)}–${fmtInt(q1hi)})، مقارنة بـ ${fmtInt(lastQ)} في الربع الماضي. يجب أن يؤكد شخصٌ ذلك قبل تغيير جداول المناوبات.`) } ] },
      { t: L("Check whether data quality is on target", "تحقق مما إذا كانت جودة البيانات على الهدف"), steps: [
        { cls: "info", ic: "1", t: L("Plan", "التخطيط"), d: L("1) compute completeness · 2) compute adherence gaps · 3) compare with targets", "1) احسب الاكتمال · 2) احسب فجوات الالتزام · 3) قارن بالأهداف") },
        { cls: "info", ic: "⚙", t: L("Tool: run SQL", "الأداة: تشغيل SQL"), d: "<code>SELECT 100.0 * COUNT(medication_adherence_pct) / COUNT(*) FROM patients;</code>" },
        { t: L("Result received", "استُلمت النتيجة"), d: L(`completeness ${fmtPct(k.complete)} · adherence missing ${fmtPct(k.adhMissing)}`, `الاكتمال ${fmtPct(k.complete)} · الالتزام المفقود ${fmtPct(k.adhMissing)}`) },
        { cls: k.adhMissing > 5 ? "fail" : "ok", t: L("Check against targets", "التحقق مقابل الأهداف"), d: L(`completeness target ≥ 97%: ${k.complete >= 97 ? "met" : "NOT met"} · adherence target ≤ 5%: ${k.adhMissing <= 5 ? "met" : "NOT met"}`, `هدف الاكتمال ≥ 97%: ${k.complete >= 97 ? "متحقق" : "غير متحقق"} · هدف الالتزام ≤ 5%: ${k.adhMissing <= 5 ? "متحقق" : "غير متحقق"}`) },
        { t: L("Answer", "الإجابة"), d: L("Adherence recording is off target. Suggested action: remind clinics to record adherence at every visit. (The agent suggests; a manager decides.)", "تسجيل الالتزام خارج الهدف. الإجراء المقترح: تذكير العيادات بتسجيل الالتزام في كل زيارة. (الوكيل يقترح؛ والمدير يقرر.)") } ] },
      { t: L("“Should patient PT100042 start a new medication?”", "«هل يجب أن يبدأ المريض PT100042 دواءً جديدًا؟»"), steps: [
        { cls: "info", ic: "1", t: L("Read the request", "قراءة الطلب"), d: L("This asks for a treatment decision about an individual patient.", "هذا يطلب قرارًا علاجيًا بشأن مريض فرد.") },
        { cls: "fail", ic: "⛔", t: L("Guardrail: outside the allowed scope", "ضابط: خارج النطاق المسموح"), d: L("The agent is only allowed to answer operational and data-quality questions. Clinical decisions about individuals are blocked.", "يُسمح للوكيل فقط بالإجابة عن الأسئلة التشغيلية وأسئلة جودة البيانات. والقرارات السريرية بشأن الأفراد محظورة.") },
        { cls: "info", t: L("Logged for audit", "سُجّل للتدقيق"), d: L("request, user and refusal reason recorded", "سُجّل الطلب والمستخدم وسبب الرفض") },
        { cls: "info", t: L("Answer", "الإجابة"), d: L("“I can't help with treatment decisions. Please refer this to the responsible clinician. I can help with screening volumes, data quality or reports.”", "«لا يمكنني المساعدة في القرارات العلاجية. يرجى إحالة هذا إلى الطبيب المسؤول. يمكنني المساعدة في أحجام الفحص أو جودة البيانات أو التقارير.»") } ] },
    ];
    const cur = tasks[st.task];
    setCode("l2-agent", Snip.agentTask(st.task));
    root.innerHTML = lesson(this, {
      simple: L("An AI <strong>agent</strong> is an assistant that can do several steps on its own: it <strong>plans</strong>, uses <strong>tools</strong> (like running a SQL query), <strong>checks</strong> the results, and then answers. Good agents also know what they are <strong>not allowed</strong> to do.",
        "<strong>الوكيل</strong> الذكي مساعد يستطيع أداء عدة خطوات بنفسه: <strong>يخطط</strong>، ويستخدم <strong>أدوات</strong> (مثل تشغيل استعلام SQL)، و<strong>يتحقق</strong> من النتائج، ثم يجيب. والوكلاء الجيدون يعرفون أيضًا ما <strong>لا يُسمح</strong> لهم بفعله."),
      why: [L("Agents can handle multi-step questions that a single query can't.", "يستطيع الوكلاء التعامل مع أسئلة متعددة الخطوات لا يكفيها استعلام واحد."), L("Because they act, they need clear limits, checks and human sign-off.", "ولأنهم يتصرفون، يحتاجون إلى حدود واضحة وفحوص وموافقة بشرية.")],
      steps: [
        { t: L("Plan", "خطّط"), d: L("Break the request into small steps.", "قسّم الطلب إلى خطوات صغيرة.") },
        { t: L("Act with tools", "نفّذ بالأدوات"), d: L("Use only approved tools: read the database, read the forecast.", "استخدم الأدوات المعتمدة فقط: قراءة قاعدة البيانات، وقراءة التوقع.") },
        { t: L("Check", "تحقق"), d: L("Do totals add up? Is the result plausible?", "هل المجاميع متطابقة؟ هل النتيجة معقولة؟") },
        { t: L("Answer — or refuse", "أجب — أو ارفض"), d: L("Give a sourced answer, or decline if the request is outside the agent's job.", "قدّم إجابة بمصدر، أو ارفض إذا كان الطلب خارج مهمة الوكيل.") },
        { t: L("Keep a log", "احتفظ بسجل"), d: L("Every step is recorded so people can audit what the agent did.", "تُسجَّل كل خطوة ليتمكن الناس من تدقيق ما فعله الوكيل.") },
      ],
      seeTitle: L("Give the agent a task and watch it work", "أعطِ الوكيل مهمة وشاهده يعمل"),
      seeNote: SIM_NOTE(),
      see: `<div class="controls">${selectEl("ag-t", tasks.map((x, i) => ({ value: i, label: x.t })), st.task, L("Task", "المهمة"))}<button type="button" class="btn btn-primary" id="ag-run">${ICON.play} ${L("Run agent", "شغّل الوكيل")}</button><button type="button" class="btn" id="ag-live">${ICON.search} ${L("Open the live Data Agent", "افتح وكيل البيانات المباشر")}</button></div>
        <div class="coded mt-2">${codeChip("l2-agent")}<ol class="run-log" id="ag-log" aria-live="polite"></ol></div>`,
      results: `<p class="mb-0">${L("Notice the pattern: plan → tool → result → check → answer. In the last task the agent stops at the guardrail and refuses — exactly what a safe design should do.", "لاحظ النمط: خطة ← أداة ← نتيجة ← تحقق ← إجابة. وفي المهمة الأخيرة يتوقف الوكيل عند الضابط ويرفض — وهذا بالضبط ما يجب أن يفعله التصميم الآمن.")}</p>`,
      remember: L("Agents plan, use approved tools, check their work, keep a log — and refuse what is outside their job.", "الوكلاء يخططون، ويستخدمون أدوات معتمدة، ويتحققون من عملهم، ويحتفظون بسجل — ويرفضون ما هو خارج مهمتهم."),
    });
    const run = () => runLog(root.querySelector("#ag-log"), cur.steps, 650);
    root.querySelector("#ag-run").addEventListener("click", run);
    root.querySelector("#ag-live").addEventListener("click", () => AgentUI.open());
    root.querySelector("#ag-t").addEventListener("change", e => { st.task = +e.target.value; this.render(root); root.querySelector("#ag-t").focus(); });
  },
});

/* =====================================================================
   12 — Guardrails, privacy & governance (+ course wrap-up)
   ===================================================================== */
Lec.add({
  id: "governance", num: 12, aliases: ["guardrails"],
  title: { en: "Guardrails, Privacy and Governance", ar: "الضوابط والخصوصية والحوكمة" },
  short: { en: "Guardrails & governance", ar: "الضوابط والحوكمة" },
  summary: { en: "Simple rules that keep BI, automation and AI safe — and a course recap.", ar: "قواعد بسيطة تُبقي ذكاء الأعمال والأتمتة والذكاء الاصطناعي آمنة — وخلاصة الدورة." },
  render(root) {
    const st = getState("gov", { c: { ident: false, clinical: false, human: true, audit: true, tested: true, minimal: true } });
    const items = [
      ["ident", L("Uses identifiable patient data (names, IDs, records)", "يستخدم بيانات مرضى قابلة للتعريف (أسماء، معرّفات، سجلات)"), "risk"],
      ["clinical", L("Its output directly influences decisions about individual patients", "مُخرَجه يؤثر مباشرة في قرارات بشأن مرضى أفراد"), "risk"],
      ["human", L("A responsible person reviews outputs before action is taken", "شخص مسؤول يراجع المخرجات قبل اتخاذ أي إجراء"), "safe"],
      ["audit", L("Every request and answer is logged for audit", "كل طلب وإجابة يُسجَّل للتدقيق"), "safe"],
      ["tested", L("Tested on held-out data and monitored after launch", "اختُبر على بيانات محجوزة ويُراقَب بعد الإطلاق"), "safe"],
      ["minimal", L("Only the minimum data needed is accessed", "لا يُوصل إلا إلى الحد الأدنى من البيانات اللازمة"), "safe"],
    ];
    const level = () => {
      const c = st.c; let score = (c.ident ? 2 : 0) + (c.clinical ? 3 : 0) + (c.human ? 0 : 2) + (c.audit ? 0 : 1) + (c.tested ? 0 : 1) + (c.minimal ? 0 : 1);
      if (c.clinical && !c.human) return { cls: "high", t: L("Not acceptable", "غير مقبول"), d: L("Automated influence on individual patient decisions without human review must not be deployed. It needs formal clinical validation and regulatory review.", "التأثير الآلي على قرارات المرضى الأفراد دون مراجعة بشرية يجب ألا يُطلق. ويحتاج إلى تحقق سريري رسمي ومراجعة تنظيمية.") };
      if (score >= 4) return { cls: "high", t: L("High risk", "خطورة مرتفعة"), d: L("Add safeguards before going further: human review, logging, testing and data minimisation.", "أضف ضمانات قبل المضي قدمًا: مراجعة بشرية، وتسجيل، واختبار، وتقليل البيانات.") };
      if (score >= 2) return { cls: "mid", t: L("Medium risk", "خطورة متوسطة"), d: L("Possible with safeguards and a named owner; review with information governance.", "ممكن مع ضمانات ومالك محدد؛ وراجِع مع حوكمة المعلومات.") };
      return { cls: "low", t: L("Lower risk", "خطورة أقل"), d: L("Suitable for operational and analytics use (like the examples in this lecture), with routine monitoring.", "مناسب للاستخدام التشغيلي والتحليلي (مثل أمثلة هذه المحاضرة)، مع مراقبة روتينية.") };
    };
    const lv = level();
    setCode("l2-risk", Snip.riskCheck(st.c, lv.t));
    root.innerHTML = lesson(this, {
      simple: L("Governance means agreeing <strong>who may use which data, for what, and with which checks</strong>. For AI in healthcare the golden rules are simple: protect privacy, keep a human in charge of decisions, log everything, and test before trusting.",
        "الحوكمة تعني الاتفاق على <strong>من يحق له استخدام أي بيانات، ولأي غرض، وبأي فحوص</strong>. وفي الذكاء الاصطناعي بالرعاية الصحية القواعد الذهبية بسيطة: احمِ الخصوصية، وأبقِ الإنسان مسؤولًا عن القرارات، وسجّل كل شيء، واختبر قبل أن تثق."),
      why: [L("Patient data is highly sensitive.", "بيانات المرضى حساسة للغاية."), L("Automated mistakes spread fast — guardrails limit the damage.", "الأخطاء الآلية تنتشر بسرعة — والضوابط تحدّ من الضرر.")],
      steps: [
        { t: L("Privacy first", "الخصوصية أولًا"), d: L("Use the minimum data; remove names and identifiers wherever possible; control access by role.", "استخدم الحد الأدنى من البيانات؛ وأزل الأسماء والمعرّفات حيثما أمكن؛ وتحكّم في الوصول حسب الدور.") },
        { t: L("Clear purpose and scope", "غرض ونطاق واضحان"), d: L("Write down what the system may and may not do (e.g. no treatment advice).", "دوّن ما يجوز للنظام فعله وما لا يجوز (مثل: لا نصائح علاجية).") },
        { t: L("Human in the loop", "الإنسان في الحلقة"), d: L("People approve actions; AI suggests.", "الناس يوافقون على الإجراءات؛ والذكاء الاصطناعي يقترح.") },
        { t: L("Test and monitor", "اختبر وراقب"), d: L("Test on new data before launch (Lecture 1, Section 17) and keep monitoring after.", "اختبر على بيانات جديدة قبل الإطلاق (المحاضرة 1، القسم 17) وواصل المراقبة بعده.") },
        { t: L("Log and review", "سجّل وراجع"), d: L("Keep an audit trail and review it regularly.", "احتفظ بسجل تدقيق وراجعه بانتظام.") },
      ],
      seeTitle: L("Quick risk check for a proposed AI / automation use", "فحص سريع للمخاطر لاستخدام مقترح للذكاء الاصطناعي / الأتمتة"),
      seeNote: L("Tick what is true for the system you have in mind. This is a teaching aid, not a formal assessment.", "حدّد ما ينطبق على النظام الذي تفكر فيه. هذه أداة تعليمية وليست تقييمًا رسميًا."),
      see: `<div class="grid grid-2"><div class="stack">${items.map(([k, lb, kind]) => `<label class="check-row"><input type="checkbox" data-gov="${k}" ${st.c[k] ? "checked" : ""}><span>${lb} <span class="badge ${kind === "risk" ? "warn" : "success"}">${kind === "risk" ? L("raises risk", "يرفع الخطورة") : L("safeguard", "ضمانة")}</span></span></label>`).join("")}</div>
        <div class="coded">${codeChip("l2-risk")}<div class="risk-meter ${lv.cls}" aria-live="polite"><span style="font-size:1.4rem">${lv.cls === "low" ? "🟢" : lv.cls === "mid" ? "🟠" : "🔴"}</span><span>${lv.t}</span></div><p class="mt-2">${lv.d}</p></div></div>`,
      results: `<p class="mb-0">${L("Try ticking “influences decisions about individual patients” and unticking “a person reviews outputs”: the result becomes “Not acceptable”. The examples in this lecture (dashboards, quality monitoring, reports and operational agents on synthetic data) sit at the lower-risk end.", "جرّب تحديد «يؤثر في قرارات بشأن مرضى أفراد» وإلغاء «شخص يراجع المخرجات»: تصبح النتيجة «غير مقبول». وأمثلة هذه المحاضرة (لوحات المؤشرات، ومراقبة الجودة، والتقارير، والوكلاء التشغيليون على بيانات اصطناعية) تقع في الطرف الأقل خطورة.")}</p>`,
      remember: L("Minimum data · clear scope · human decides · test, monitor, log.", "أقل قدر من البيانات · نطاق واضح · الإنسان يقرر · اختبر وراقب وسجّل."),
    }) + `<section class="block"><h2>${L("Course recap: both lectures in one picture", "خلاصة الدورة: المحاضرتان في صورة واحدة")}</h2>
        <div class="grid grid-2"><div class="card"><h3>${L("Lecture 1 — from messy data to insight", "المحاضرة 1 — من البيانات غير المنظمة إلى الرؤية")}</h3><div class="pill-steps">${[L("Check", "افحص"), L("Clean", "نظّف"), L("Describe", "صِف"), L("Explore", "استكشف"), L("Test", "اختبر"), L("Predict", "تنبأ"), L("Forecast", "توقّع")].map((s, i) => `${i ? '<span class="arrow">→</span>' : ""}<span class="pill">${s}</span>`).join("")}</div></div>
          <div class="card"><h3>${L("Lecture 2 — from insight to action", "المحاضرة 2 — من الرؤية إلى الفعل")}</h3><div class="pill-steps">${[L("KPIs", "المؤشرات"), L("Data model", "نموذج البيانات"), L("SQL", "SQL"), L("Dashboard", "لوحة المؤشرات"), L("Automate", "أتمت"), L("Monitor", "راقب"), L("AI assist", "مساعدة ذكية"), L("Govern", "احكم")].map((s, i) => `${i ? '<span class="arrow">→</span>' : ""}<span class="pill">${s}</span>`).join("")}</div></div></div></section>
      <section class="next-lecture"><h2>${L("You have completed both lectures", "لقد أكملت المحاضرتين")}</h2><p class="lead" style="margin:0 auto 22px">${L("Revisit any section at any time — every example stays live on the data.", "عُد إلى أي قسم في أي وقت — كل مثال يبقى حيًا على البيانات.")}</p>
        <div class="row" style="justify-content:center"><a class="btn btn-primary btn-lg" href="lecture-1.html">${ICON.arrowL} ${L("Back to Lecture 1", "العودة إلى المحاضرة 1")}</a><a class="btn btn-lg" href="#start">${L("Lecture 2 overview", "نظرة عامة على المحاضرة 2")}</a></div></section>`;
    root.querySelectorAll("[data-gov]").forEach(cb => cb.addEventListener("change", () => { st.c[cb.dataset.gov] = cb.checked; const k = cb.dataset.gov; this.render(root); root.querySelector(`[data-gov="${k}"]`).focus(); }));
  },
});
