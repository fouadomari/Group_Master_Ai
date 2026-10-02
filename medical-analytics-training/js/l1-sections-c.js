/* =====================================================================
   Lecture 1 — Sections 15–20 (processing pipeline, features,
   Created by Master of AI.
   machine learning, evaluation, forecasting, the full case)
   ===================================================================== */

/* =====================================================================
   15 — The processing pipeline (data transformation)
   ===================================================================== */
Lec.add({
  id: "data-pipeline", num: 15, aliases: ["data-transformation", "pipeline"],
  title: { en: "The Processing Pipeline (Data Transformation)", ar: "مسار المعالجة (تحويل البيانات)" },
  short: { en: "Processing pipeline", ar: "مسار المعالجة" },
  summary: { en: "How raw data flows, step by step, into an analysis-ready table.", ar: "كيف تتدفق البيانات الخام خطوة بخطوة إلى جدول جاهز للتحليل." },
  render(root) {
    const d = SD(), q = d.quality.summary, st = getState("pipe", { step: 0, tr: "raw" });
    const steps = [
      { t: L("Raw data", "البيانات الخام"), op: L("Load the file exactly as delivered; never edit it by hand.", "حمّل الملف كما وصل تمامًا؛ ولا تعدّله يدويًا أبدًا."), out: L(`${fmtInt(q.rows)} rows, all stored as text`, `${fmtInt(q.rows)} صفًا، كلها مخزّنة كنص`) },
      { t: L("Validation", "التحقق"), op: L("Check formats, ranges, codes, dates and duplicates.", "افحص التنسيقات والنطاقات والرموز والتواريخ والتكرارات."), out: L(`${fmtInt(q.invalid_values)} invalid values, ${q.exact_duplicates} duplicates found`, `وُجدت ${fmtInt(q.invalid_values)} قيمة غير صالحة و${q.exact_duplicates} تكرارًا`) },
      { t: L("Cleaning", "التنظيف"), op: L("Apply the written rules from Section 07.", "طبّق القواعد المكتوبة من القسم 07."), out: L(`${fmtInt(d.clean.rows.length)} unique, consistent rows`, `${fmtInt(d.clean.rows.length)} صفًا فريدًا ومتسقًا`) },
      { t: L("Transformation", "التحويل"), op: L("Make numbers comparable (one unit, rescaling) and add useful new columns.", "اجعل الأرقام قابلة للمقارنة (وحدة واحدة، إعادة تقييس) وأضف أعمدة جديدة مفيدة."), out: L(`${d.features.n_features_before} → ${d.features.n_features_after} columns`, `${d.features.n_features_before} ← ${d.features.n_features_after} عمودًا`) },
      { t: L("Analysis dataset", "جدول التحليل"), op: L("Freeze one agreed table that every analysis uses.", "ثبّت جدولًا واحدًا متفقًا عليه تستخدمه كل التحليلات."), out: L("one trusted table", "جدول واحد موثوق") },
      { t: L("Analysis", "التحليل"), op: L("Statistics, tests and charts (Sections 09–14).", "الإحصاء والاختبارات والرسوم (الأقسام 09–14)."), out: L("evidence with uncertainty", "أدلة مع درجة عدم اليقين") },
      { t: L("Modelling", "النمذجة"), op: L("Predictions and forecasts (Sections 17–19).", "التنبؤات والتوقعات (الأقسام 17–19)."), out: L(`${d.ml.n_train} rows to learn from, ${d.ml.n_test} to test`, `${d.ml.n_train} صفًا للتعلم و${d.ml.n_test} للاختبار`) },
    ];
    const cur = steps[st.step];
    setCode("s15-step", Snip.pipeStep(st.step));
    root.innerHTML = lesson(this, {
      simple: L("A pipeline is a fixed chain of steps: each step takes the result of the previous one. Writing it down turns a one-off analysis into a process that can be repeated every month and checked by anyone.",
        "المسار سلسلة ثابتة من الخطوات: كل خطوة تأخذ نتيجة الخطوة السابقة. تدوينه يحوّل التحليل لمرة واحدة إلى عملية يمكن تكرارها كل شهر والتحقق منها من قِبل أي شخص."),
      why: [L("Same input → same output, every time.", "المُدخل نفسه ← المُخرَج نفسه، في كل مرة."), L("When a number looks odd, you can trace it back step by step.", "عندما يبدو رقم غريبًا يمكنك تتبعه للخلف خطوة بخطوة.")],
      steps: steps.map(s => ({ t: s.t, d: s.op, ex: s.out })),
      seeTitle: L("Walk through the pipeline", "تجوّل في المسار"),
      see: `<div class="pipeline" role="group" aria-label="${L("Pipeline steps", "خطوات المسار")}">${steps.map((s, i) => `${i ? `<span class="flow-arrow" aria-hidden="true">${ICON.chevR}</span>` : ""}<button type="button" class="flow-step" data-step="${i}" aria-pressed="${i === st.step}"><span class="n">${pad2(i + 1)}</span><span class="t">${s.t}</span></button>`).join("")}</div>
        <div class="card detail-panel" aria-live="polite">${codeChip("s15-step")}<div class="io-grid">
          <div class="io-box"><div class="k">${L("Input", "المُدخل")}</div>${st.step ? steps[st.step - 1].out : L("files from the clinics", "ملفات من العيادات")}</div><span class="arrow">${ICON.arrowR}</span>
          <div class="io-box"><div class="k">${L("What happens", "ماذا يحدث")}</div>${cur.op}</div><span class="arrow">${ICON.arrowR}</span>
          <div class="io-box out"><div class="k">${L("Output", "المُخرَج")}</div><strong>${cur.out}</strong></div></div></div>
        <h3 class="mt-3">${L("One transformation up close: making skewed numbers easier to work with", "تحويل واحد عن قرب: جعل الأرقام الملتوية أسهل في التعامل")}</h3>
        <div class="controls">${segmented("tr", [{ value: "raw", label: L("Original glucose", "السكر الأصلي") }, { value: "log", label: L("Logarithm", "اللوغاريتم") }, { value: "z", label: L("Standardised (z)", "معياري (z)") }], st.tr)}</div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s15-tr")}<div id="tr-hist"></div></div><div class="card" id="tr-note"></div></div>`,
      remember: L("Write the process as a pipeline — repeatable, traceable, and nothing done by hand.", "اكتب العملية كمسار — قابلًا للتكرار والتتبع، ولا شيء يُنجز يدويًا."),
    });
    const drawTr = () => {
      const g = Data.values(Data.clean(), "fasting_glucose"); let vals = g, xl = "mg/dL";
      if (st.tr === "log") { vals = g.map(Math.log); xl = "log(mg/dL)"; }
      if (st.tr === "z") { const m = Stats.mean(g), s = Stats.sd(g); vals = g.map(x => (x - m) / s); xl = "z"; }
      const s = Stats.describe(vals);
      Charts.histogram(root.querySelector("#tr-hist"), { values: vals, bins: 36, xLabel: xl, yLabel: L("Patients", "المرضى") });
      const notes = {
        raw: L("Original values: most patients are near 90, but a long tail stretches to 400. Some methods struggle with tails like this.", "القيم الأصلية: معظم المرضى قرب 90، لكن ذيلًا طويلًا يمتد إلى 400. بعض الطرق تواجه صعوبة مع ذيول كهذه."),
        log: L("Taking the logarithm squeezes the long tail, so the shape becomes much more balanced (lower skewness).", "أخذ اللوغاريتم يضغط الذيل الطويل، فيصبح الشكل أكثر توازنًا بكثير (التواء أقل)."),
        z: L("Standardising re-centres the values at 0 with a spread of 1. The shape does not change — it just puts different measurements on a common scale.", "التقييس المعياري يُعيد تمركز القيم عند 0 بتشتت 1. لا يتغير الشكل — بل يضع القياسات المختلفة على مقياس مشترك."),
      };
      const tc = Snip.transform(st.tr, `${L("skewness", "الالتواء")} ${fmt(s.skewness, 2)}`); setCode("s15-tr", tc);
      root.querySelector("#tr-note").innerHTML = `<div class="stat-grid">${stat(L("Skewness", "الالتواء"), fmt(s.skewness, 2), "", tc)}${stat(L("Average", "المتوسط"), fmt(s.mean, 2), "", tc)}</div><p class="mt-2 mb-0">${notes[st.tr]}</p>`;
    };
    drawTr();
    root.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => { st.step = +b.dataset.step; this.render(root); root.querySelector(`[data-step="${st.step}"]`).focus(); }));
    bindSeg(root, "tr", v => { st.tr = v; drawTr(); });
  },
});

/* =====================================================================
   16 — Creating useful columns (feature engineering)
   ===================================================================== */
Lec.add({
  id: "feature-engineering", num: 16, aliases: ["features"],
  title: { en: "Creating Useful Columns (Feature Engineering)", ar: "إنشاء أعمدة مفيدة (هندسة الخصائص)" },
  short: { en: "Feature engineering", ar: "هندسة الخصائص" },
  summary: { en: "Turning raw measurements into helpful categories and flags.", ar: "تحويل القياسات الخام إلى فئات وعلامات مفيدة." },
  render(root) {
    const st = getState("fe", { f: "bmi_category" }), rows = Data.clean();
    const feats = {
      bmi_category: { t: L("BMI category", "فئة BMI"), rule: "<18.5 · 18.5–25 · 25–30 · ≥30", get: r => r.bmi == null ? null : r.bmi < 18.5 ? "Underweight" : r.bmi < 25 ? "Normal" : r.bmi < 30 ? "Overweight" : "Obese", order: ["Underweight", "Normal", "Overweight", "Obese"] },
      age_group: { t: L("Age group", "الفئة العمرية"), rule: "18–34 · 35–49 · 50–64 · 65+", get: r => r.age_group, order: ["18-34", "35-49", "50-64", "65+"] },
      pulse_pressure: { t: L("Pulse pressure", "ضغط النبض"), rule: "systolic − diastolic", get: r => r.systolic_bp == null || r.diastolic_bp == null ? null : (pp => pp < 40 ? "<40" : pp < 50 ? "40–49" : pp < 60 ? "50–59" : "≥60")(r.systolic_bp - r.diastolic_bp), order: ["<40", "40–49", "50–59", "≥60"] },
      frequent_visitor: { t: L("Frequent visitor", "زائر متكرر"), rule: "visits_last_year ≥ 4", get: r => r.visits_last_year == null ? null : r.visits_last_year >= 4 ? "≥4" : "0–3", order: ["0–3", "≥4"] },
      adherence_missing: { t: L("“Was missing” flag", "علامة «كان مفقودًا»"), rule: "1 if adherence is missing", get: r => r.medication_adherence_pct == null ? "missing" : "recorded", order: ["recorded", "missing"] },
    };
    const cur = feats[st.f];
    root.innerHTML = lesson(this, {
      simple: L("A “feature” is simply a column used for analysis. Feature engineering means <strong>creating new, more useful columns</strong> from the ones we have — for example turning BMI numbers into categories.",
        "«الخاصية» ببساطة عمود يُستخدم في التحليل. وهندسة الخصائص تعني <strong>إنشاء أعمدة جديدة أكثر فائدة</strong> من الأعمدة الموجودة — مثل تحويل أرقام BMI إلى فئات."),
      why: [L("Categories are easier to read in reports.", "الفئات أسهل في القراءة في التقارير."), L("Good features help models find patterns.", "الخصائص الجيدة تساعد النماذج على إيجاد الأنماط.")],
      steps: [
        { t: L("Start from a raw column", "ابدأ من عمود خام"), d: L("e.g. bmi = 27.4", "مثل bmi = 27.4") },
        { t: L("Decide a clear rule", "حدّد قاعدة واضحة"), d: L("e.g. 25–30 → “Overweight”. Write down who chose the rule and why.", "مثل 25–30 ← «زيادة وزن». دوّن من اختار القاعدة ولماذا.") },
        { t: L("Compute the new column", "احسب العمود الجديد"), d: L("Apply the rule to every patient.", "طبّق القاعدة على كل مريض."), ex: L(`${SD().features.n_features_before} → ${SD().features.n_features_after} columns in our data`, `${SD().features.n_features_before} ← ${SD().features.n_features_after} عمودًا في بياناتنا`) },
        { t: L("Check the result", "تحقق من النتيجة"), d: L("How many patients in each category? Does it make sense?", "كم مريضًا في كل فئة؟ هل يبدو ذلك منطقيًا؟") },
        { t: L("Remember the limits", "تذكّر الحدود"), d: L("A category loses detail (49 and 50 years fall in different groups) and is not a medical diagnosis.", "الفئة تُفقد تفاصيل (عمر 49 و50 يقعان في فئتين مختلفتين) وليست تشخيصًا طبيًا.") },
      ],
      seeTitle: L("Pick a new column to see it", "اختر عمودًا جديدًا لرؤيته"),
      see: `<div class="compare-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))" role="group">${Object.entries(feats).map(([k, f]) => `<button type="button" class="compare-card" data-f="${k}" aria-pressed="${k === st.f}"><div class="t">${f.t}</div><div class="s ltr">${esc(f.rule)}</div></button>`).join("")}</div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s16-a")}<div class="chart-title">${L("Patients per category", "المرضى لكل فئة")}</div><div id="fe-count"></div></div>
          <div class="chart-card">${codeChip("s16-b")}<div class="chart-title">${L("% in the “High” teaching group", "النسبة في المجموعة التعليمية «مرتفعة»")}</div><div id="fe-rate"></div></div></div>`,
      results: `<div id="fe-msg"></div>`,
      remember: L("New columns are useful shortcuts — but they are our own rules, not medical facts.", "الأعمدة الجديدة اختصارات مفيدة — لكنها قواعدنا الخاصة وليست حقائق طبية."),
    });
    const counts = {}, high = {};
    cur.order.forEach(k => { counts[k] = 0; high[k] = 0; });
    rows.forEach(r => { const k = cur.get(r); if (k == null || !(k in counts)) return; counts[k]++; if (r.risk_group === "High") high[k]++; });
    Charts.bar(root.querySelector("#fe-count"), { data: cur.order.map((k, i) => ({ label: k, value: counts[k], cls: `c${(i % 6) + 1}` })), yLabel: L("Patients", "المرضى"), format: v => fmtInt(v) });
    const rates = cur.order.map(k => (counts[k] ? (100 * high[k]) / counts[k] : 0));
    const fcd = Snip.feature(st.f, cur.order.map((k, i) => `${k}: ${counts[k]} (${fmt(rates[i], 0)}%)`).join(" · ")); setCode("s16-a", fcd); setCode("s16-b", fcd);
    Charts.bar(root.querySelector("#fe-rate"), { data: cur.order.map((k, i) => ({ label: k, value: rates[i], cls: `c${(i % 6) + 1}` })), yLabel: "%", format: v => `${fmt(v, 0)}%`, max: 100 });
    const top = cur.order[rates.indexOf(Math.max(...rates))], biggest = cur.order.reduce((a, b) => (counts[b] > counts[a] ? b : a));
    root.querySelector("#fe-msg").innerHTML = `<ul><li>${L(`The largest category is <strong>${biggest}</strong> (${fmtInt(counts[biggest])} patients).`, `الفئة الأكبر هي <strong>${biggest}</strong> (${fmtInt(counts[biggest])} مريضًا).`)}</li>
      <li>${L(`The “High” teaching group is most common in <strong>${top}</strong> (${fmt(Math.max(...rates), 0)}%). The new column clearly carries useful information for analysis.`, `المجموعة التعليمية «مرتفعة» أكثر شيوعًا في <strong>${top}</strong> (${fmt(Math.max(...rates), 0)}%). يحمل العمود الجديد بوضوح معلومات مفيدة للتحليل.`)}</li>
      <li class="small muted">${RISK_NOTE()}</li></ul>`;
    root.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => { st.f = b.dataset.f; this.render(root); root.querySelector(`[data-f="${st.f}"]`).focus(); }));
  },
});

/* =====================================================================
   17 — Teaching a computer to predict (machine learning)
   ===================================================================== */
Lec.add({
  id: "machine-learning", num: 17, aliases: ["ml"],
  title: { en: "Teaching a Computer to Predict (Machine Learning)", ar: "تعليم الحاسوب التنبؤ (تعلّم الآلة)" },
  short: { en: "Machine learning", ar: "تعلّم الآلة" },
  summary: { en: "Learn from examples, test on new ones, avoid the common traps.", ar: "تعلّم من الأمثلة، واختبر على أمثلة جديدة، وتجنّب الفخاخ الشائعة." },
  render(root) {
    const M = SD().ml, st = getState("ml", { depth: 5, leak: false });
    const names = Object.keys(M.classifiers), dc = M.depth_curve, cur = dc.find(x => x.depth === st.depth);
    const zone = st.depth <= 3 ? "under" : st.depth >= 9 ? "over" : "good";
    const nameL = n => ({ "Logistic Regression": L("Logistic regression", "الانحدار اللوجستي"), "Random Forest": L("Random forest", "الغابة العشوائية"), "Gradient Boosting": L("Gradient boosting", "التعزيز التدريجي") }[n] || n);
    const shown = st.leak ? M.leakage.test_accuracy_with_leakage : M.leakage.test_accuracy_without;
    setCode("s17-acc", Snip.mlAcc(names.map(n => `${n}: ${fmtPct(M.classifiers[n].test_accuracy * 100)}`).join(" · ")));
    setCode("s17-depth", Snip.mlDepth(st.depth, `${L("depth", "العمق")} ${st.depth}: ${fmt(cur.train * 100, 0)}% / ${fmt(cur.test * 100, 0)}%`));
    setCode("s17-leak", Snip.mlLeak(st.leak, fmtPct(shown * 100)));
    root.innerHTML = lesson(this, {
      simple: L("Machine learning means showing a computer many <strong>examples with known answers</strong> so it can learn a pattern, then checking it on <strong>new examples it has never seen</strong>. Here it learns to predict our teaching label (Low / Moderate / High) from the measurements.",
        "تعلّم الآلة يعني أن نُري الحاسوب <strong>أمثلة كثيرة بإجابات معروفة</strong> ليتعلم نمطًا، ثم نتحقق منه على <strong>أمثلة جديدة لم يرها قط</strong>. هنا يتعلم التنبؤ بالتسمية التعليمية (منخفضة / متوسطة / مرتفعة) من القياسات."),
      why: [L("Predictions can help plan work and prioritise reviews.", "التنبؤات قد تساعد في تخطيط العمل وترتيب أولويات المراجعة."), L("Knowing the traps helps you challenge results that look too good.", "معرفة الفخاخ تساعدك على مساءلة النتائج التي تبدو أجمل من الحقيقة.")],
      steps: [
        { t: L("Choose inputs and the answer", "اختر المُدخلات والإجابة"), d: L(`Inputs (“features”): ${M.features.length} measurements like age, BMI, blood pressure. Answer (“target”): the teaching label.`, `المُدخلات («الخصائص»): ${M.features.length} قياسًا مثل العمر وBMI وضغط الدم. والإجابة («الهدف»): التسمية التعليمية.`) },
        { t: L("Split the data", "قسّم البيانات"), d: L("Keep some patients aside for the final test — the model never sees them while learning.", "احتفظ ببعض المرضى جانبًا للاختبار النهائي — لا يراهم النموذج أثناء التعلم."), ex: L(`${M.n_train} patients to learn from · ${M.n_test} kept aside to test`, `${M.n_train} مريضًا للتعلم · ${M.n_test} محجوزون للاختبار`) },
        { t: L("Train a few models", "درّب بضعة نماذج"), d: L("Logistic regression (a weighted formula), random forest (many decision trees voting), gradient boosting (trees that correct each other).", "الانحدار اللوجستي (صيغة موزونة)، والغابة العشوائية (أشجار قرار كثيرة تصوّت)، والتعزيز التدريجي (أشجار يصحح بعضها بعضًا).") },
        { t: L("Test on the patients kept aside", "اختبر على المرضى المحجوزين"), d: L("Only this score tells us how well the model works on new patients.", "هذه الدرجة وحدها تخبرنا بمدى جودة النموذج على مرضى جدد.") },
        { t: L("Watch for two traps", "انتبه لفخّين"), d: L("<strong>Overfitting</strong>: memorising the training examples. <strong>Leakage</strong>: accidentally giving the model the answer.", "<strong>فرط التخصيص</strong>: حفظ أمثلة التدريب. <strong>التسرّب</strong>: إعطاء النموذج الإجابة دون قصد.") },
      ],
      seeTitle: L("See the models — and the traps — on our data", "شاهد النماذج — والفخاخ — على بياناتنا"),
      seeNote: RISK_NOTE(),
      see: `<div class="chart-card">${codeChip("s17-acc")}<div class="chart-title">${L("Accuracy: on the training patients vs on new patients", "الدقة: على مرضى التدريب مقابل المرضى الجدد")}</div><div id="ml-acc"></div>${Charts.legend([{ cls: "c1", label: L("Training patients (seen)", "مرضى التدريب (مرئيون)") }, { cls: "c2", label: L("New patients (unseen)", "مرضى جدد (غير مرئيين)") }])}</div>
        <h3 class="mt-3">${L("Trap 1 — overfitting: make the model more and more complex", "الفخ 1 — فرط التخصيص: اجعل النموذج أكثر تعقيدًا")}</h3>
        <div class="controls"><div class="field" style="flex:1 1 260px"><label for="ml-depth">${L("Complexity (depth of a decision tree)", "التعقيد (عمق شجرة القرار)")}</label><div class="range-row"><input type="range" id="ml-depth" min="1" max="15" value="${st.depth}"><output>${st.depth}</output></div></div>
          ${stat(L("Training / new patients", "التدريب / المرضى الجدد"), `${fmt(cur.train * 100, 0)}% / ${fmt(cur.test * 100, 0)}%`, "", CodeRefs.get("s17-depth"))}
          <span class="badge ${zone === "good" ? "success" : zone === "over" ? "danger" : "warn"}">${zone === "under" ? L("Too simple", "بسيط جدًا") : zone === "over" ? L("Memorising (overfitting)", "يحفظ (فرط تخصيص)") : L("About right", "مناسب تقريبًا")}</span></div>
        <div class="chart-card mt-2">${codeChip("s17-depth")}<div id="ml-depth-chart"></div>${Charts.legend([{ cls: "c1", label: L("Training patients", "مرضى التدريب"), line: true }, { cls: "c2", label: L("New patients", "مرضى جدد"), line: true }])}</div>
        <h3 class="mt-3">${L("Trap 2 — leakage: give the model the answer by mistake", "الفخ 2 — التسرّب: إعطاء النموذج الإجابة خطأً")}</h3>
        <div class="grid grid-2"><div class="card">${codeChip("s17-leak")}<label class="toggle-row"><input type="checkbox" id="ml-leak" ${st.leak ? "checked" : ""}> ${L("Also give the model risk_score (the number the label is calculated from)", "أعطِ النموذج أيضًا risk_score (الرقم الذي تُحسب منه التسمية)")}</label>
          <div class="kpi-value mt-2" style="color:var(${st.leak ? "--danger" : "--accent"})">${fmtPct(shown * 100)}</div><div class="leak-meter mt-1"><span style="width:${shown * 100}%;background:var(${st.leak ? "--danger" : "--accent"})"></span></div><p class="small muted mt-1 mb-0">${L("accuracy on new patients", "الدقة على المرضى الجدد")}</p></div>
          <div class="card"><p class="mb-0">${st.leak ? L("Almost perfect — but fake. The label is calculated directly from risk_score, so the model simply copies the answer. In real life that number would not be known in advance.", "شبه مثالية — لكنها زائفة. تُحسب التسمية مباشرة من risk_score، فالنموذج ينسخ الإجابة ببساطة. وفي الواقع لن يكون ذلك الرقم معروفًا مسبقًا.") : L("Without the leaking column the model reaches a realistic accuracy. Tick the box to see what leakage does.", "بدون العمود المسرّب يصل النموذج إلى دقة واقعية. فعّل المربع لترى ماذا يفعل التسرّب.")}</p></div></div>`,
      results: `<ul><li>${L(`On new patients the models are right about ${fmt(M.classifiers["Logistic Regression"].test_accuracy * 100, 0)}–${fmt(M.classifiers["Gradient Boosting"].test_accuracy * 100, 0)}% of the time. The simple formula (logistic regression) is almost as good as the complex ones.`, `على المرضى الجدد تصيب النماذج نحو ${fmt(M.classifiers["Logistic Regression"].test_accuracy * 100, 0)}–${fmt(M.classifiers["Gradient Boosting"].test_accuracy * 100, 0)}% من الوقت. والصيغة البسيطة (الانحدار اللوجستي) جيدة تقريبًا مثل النماذج المعقدة.`)}</li>
        <li>${L(`The random forest scores ${fmt(M.classifiers["Random Forest"].train_accuracy * 100, 0)}% on patients it has seen but only ${fmt(M.classifiers["Random Forest"].test_accuracy * 100, 0)}% on new ones — the gap is the sign of memorising.`, `تحقق الغابة العشوائية ${fmt(M.classifiers["Random Forest"].train_accuracy * 100, 0)}% على المرضى الذين رأتهم لكن ${fmt(M.classifiers["Random Forest"].test_accuracy * 100, 0)}% فقط على الجدد — والفجوة علامة على الحفظ.`)}</li>
        <li>${L("A result that looks too good to be true usually is — check for leakage.", "النتيجة التي تبدو أجمل من الحقيقة غالبًا ليست حقيقية — ابحث عن التسرّب.")}</li></ul>`,
      code: { code: `from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier

X = df[features]                     # 14 measurements (NOT risk_score)
y = df["risk_group"]                 # the teaching label
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)

model = GradientBoostingClassifier().fit(X_train, y_train)
model.score(X_test, y_test)          # accuracy on patients the model never saw`,
        result: miniTable([L("Model", "النموذج"), { t: L("Training patients", "مرضى التدريب"), num: true }, { t: L("New patients", "مرضى جدد"), num: true }], names.map(n => [nameL(n), fmtPct(M.classifiers[n].train_accuracy * 100), `<strong>${fmtPct(M.classifiers[n].test_accuracy * 100)}</strong>`])) },
      remember: L("Judge a model only on data it has never seen — and be suspicious of near-perfect scores.", "احكم على النموذج فقط بالبيانات التي لم يرها قط — وكن متشككًا في الدرجات شبه المثالية."),
      quiz: { q: L("A model is 99% right on its training data but 70% on new data. What is happening?", "نموذج يصيب 99% على بيانات التدريب لكن 70% على البيانات الجديدة. ماذا يحدث؟"), options: [
        { t: L("Overfitting — it memorised the training examples", "فرط التخصيص — حفظ أمثلة التدريب"), ok: true, why: L("The big gap between seen and unseen data is the classic sign.", "الفجوة الكبيرة بين البيانات المرئية وغير المرئية هي العلامة التقليدية.") },
        { t: L("It is an excellent model", "إنه نموذج ممتاز"), why: L("Only the 70% on new data counts.", "الـ70% على البيانات الجديدة هي وحدها المعتبرة.") }] },
    });
    Charts.groupedBar(root.querySelector("#ml-acc"), { categories: names.map(nameL), series: [{ name: L("Training", "التدريب"), values: names.map(n => M.classifiers[n].train_accuracy * 100), cls: "c1" }, { name: L("New patients", "مرضى جدد"), values: names.map(n => M.classifiers[n].test_accuracy * 100), cls: "c2" }], format: v => `${fmt(v, 0)}%`, max: 100, min: 0, yLabel: L("Accuracy (%)", "الدقة (%)") });
    Charts.line(root.querySelector("#ml-depth-chart"), { labels: dc.map(x => String(x.depth)), series: [{ name: L("training", "التدريب"), values: dc.map(x => x.train * 100), cls: "c1", dots: true }, { name: L("new", "الجدد"), values: dc.map(x => x.test * 100), cls: "c2", dots: true }], yDomain: [50, 100], yLabel: "%", xLabel: L("complexity (tree depth)", "التعقيد (عمق الشجرة)"), vline: st.depth - 1 });
    root.querySelector("#ml-depth").addEventListener("input", e => { st.depth = +e.target.value; this.render(root); root.querySelector("#ml-depth").focus(); });
    root.querySelector("#ml-leak").addEventListener("change", e => { st.leak = e.target.checked; this.render(root); root.querySelector("#ml-leak").focus(); });
  },
});

/* =====================================================================
   18 — How good is the model? (evaluation)
   ===================================================================== */
Lec.add({
  id: "model-evaluation", num: 18, aliases: ["evaluation"],
  title: { en: "How Good Is the Model? (Evaluation)", ar: "ما مدى جودة النموذج؟ (التقييم)" },
  short: { en: "Model evaluation", ar: "تقييم النموذج" },
  summary: { en: "Right vs wrong predictions, and the measures that summarise them.", ar: "التنبؤات الصحيحة مقابل الخاطئة، والمقاييس التي تلخصها." },
  render(root) {
    const E = SD().evaluation, st = getState("eval", { m: "Gradient Boosting" });
    const C = E.classification[st.m], labels = C.labels, cm = C.confusion_matrix, total = cm.flat().reduce((a, b) => a + b, 0), correct = cm.reduce((a, r, i) => a + r[i], 0);
    const lin = E.regression["Linear Regression"], base = E.regression["Baseline (predict training mean)"];
    const ec = Snip.evalCM(st.m, `${correct} / ${total} ${L("correct", "صحيحة")} · ${fmtPct(C.accuracy * 100)}`); setCode("s18-cm", ec);
    root.innerHTML = lesson(this, {
      simple: L("To judge a model we compare its predictions with the true answers for patients it has never seen. A <strong>confusion matrix</strong> is simply a table of “what it predicted” against “what was true”.",
        "للحكم على نموذج نقارن تنبؤاته بالإجابات الحقيقية لمرضى لم يرهم قط. و<strong>مصفوفة الالتباس</strong> ببساطة جدول «ماذا تنبأ» مقابل «ماذا كان صحيحًا»."),
      why: [L("One headline number can hide important mistakes.", "رقم رئيسي واحد قد يخفي أخطاء مهمة."), L("Different mistakes have different costs.", "للأخطاء المختلفة تكاليف مختلفة.")],
      steps: [
        { t: L("Put predictions next to the truth", "ضع التنبؤات بجانب الحقيقة"), d: L(`For each of the ${total} test patients.`, `لكل واحد من مرضى الاختبار البالغ عددهم ${total}.`) },
        { t: L("Build the confusion matrix", "ابنِ مصفوفة الالتباس"), d: L("Rows = true group, columns = predicted group. The diagonal = correct.", "الصفوف = المجموعة الحقيقية، والأعمدة = المتوقعة. والقطر = الصحيح.") },
        { t: L("Accuracy", "الدقة الإجمالية"), d: L("Correct ÷ all.", "الصحيح ÷ الكل."), ex: `${correct} ÷ ${total} = ${fmtPct(100 * correct / total)}` },
        { t: L("Precision and recall for each group", "الدقة النوعية والاستدعاء لكل مجموعة"), d: L("Precision: when it says “High”, how often is it right? Recall: of the real “High” patients, how many did it find? F1 balances the two.", "الدقة النوعية: عندما يقول «مرتفعة»، كم مرة يصيب؟ الاستدعاء: من المرضى «المرتفعين» فعلًا، كم وجد؟ وF1 يوازن بينهما.") },
        { t: L("For number predictions: average error", "لتنبؤات الأرقام: متوسط الخطأ"), d: L("MAE = average size of the error. R² = how much better than always guessing the average (not “% correct”).", "MAE = متوسط حجم الخطأ. وR² = كم هو أفضل من تخمين المتوسط دائمًا (ليس «نسبة الصحيح»)."), ex: L(`predicting the risk score: average error ${fmt(lin.mae, 1)} points (vs ${fmt(base.mae, 1)} by guessing the average), R² = ${fmt(lin.r2, 2)}`, `التنبؤ بدرجة الخطورة: متوسط الخطأ ${fmt(lin.mae, 1)} نقطة (مقابل ${fmt(base.mae, 1)} بتخمين المتوسط)، R² = ${fmt(lin.r2, 2)}`) },
      ],
      seeTitle: L("Explore the results on the test patients", "استكشف النتائج على مرضى الاختبار"),
      seeNote: RISK_NOTE(),
      see: `<div class="row" style="margin-bottom:12px">${segmented("ev-m", Object.keys(E.classification).map(k => ({ value: k, label: k })), st.m)}</div>
        <div class="grid grid-2"><div class="chart-card">${codeChip("s18-cm")}<div class="chart-title">${L("Confusion matrix", "مصفوفة الالتباس")}</div><div class="chart-sub">${L("Rows = true group · columns = predicted · green = correct", "الصفوف = المجموعة الحقيقية · الأعمدة = المتوقعة · الأخضر = صحيح")}</div><div id="ev-cm"></div></div>
          <div class="card">${codeChip("s18-cm")}${miniTable([L("Group", "المجموعة"), { t: L("Precision", "الدقة النوعية"), num: true }, { t: L("Recall", "الاستدعاء"), num: true }, { t: "F1", num: true }], labels.map(l => [levlabel(l), fmt(C.per_class[l].precision, 2), fmt(C.per_class[l].recall, 2), fmt(C.per_class[l].f1, 2)]))}
            <div class="stat-grid mt-2">${stat(L("Accuracy", "الدقة الإجمالية"), fmtPct(C.accuracy * 100), "", ec)}${stat("F1", fmt(C.macro_f1, 2), "", ec)}</div></div></div>`,
      results: `<ul><li>${L(`${st.m} is right for ${correct} of ${total} test patients (${fmtPct(100 * correct / total)}).`, `${st.m} يصيب مع ${correct} من أصل ${total} مريض اختبار (${fmtPct(100 * correct / total)}).`)}</li>
        <li>${L(`Most mistakes are between neighbouring groups (Low ↔ Moderate, Moderate ↔ High). Low and High are almost never confused (${cm[0][2] + cm[2][0]} times).`, `معظم الأخطاء بين المجموعات المتجاورة (منخفضة ↔ متوسطة، متوسطة ↔ مرتفعة). ونادرًا ما يحدث خلط بين المنخفضة والمرتفعة (${cm[0][2] + cm[2][0]} مرات).`)}</li>
        <li>${L(`“Moderate” is hardest (recall ${fmt(C.per_class.Moderate.recall, 2)}) — middle categories usually are.`, `«المتوسطة» هي الأصعب (الاستدعاء ${fmt(C.per_class.Moderate.recall, 2)}) — والفئات الوسطى عادة كذلك.`)}</li></ul>`,
      remember: L("Look at which mistakes a model makes, not just how many. And R² is not “accuracy”.", "انظر إلى نوع الأخطاء التي يرتكبها النموذج لا عددها فقط. وR² ليس «دقة»."),
      quiz: { q: L("Missing a truly high-risk case is worse than a false alarm. Which measure matters most?", "تفويت حالة عالية الخطورة فعلًا أسوأ من إنذار كاذب. أي مقياس يهم أكثر؟"), options: [
        { t: L("Recall for the High group", "الاستدعاء للمجموعة المرتفعة"), ok: true, why: L("Recall = how many real High cases were found.", "الاستدعاء = عدد الحالات المرتفعة الحقيقية التي وُجدت.") },
        { t: L("Overall accuracy", "الدقة الإجمالية"), why: L("Accuracy mixes all mistakes together.", "الدقة الإجمالية تخلط كل الأخطاء معًا.") }] },
    });
    Charts.heatmap(root.querySelector("#ev-cm"), { matrix: cm, xLabels: labels.map(l => `→ ${levlabel(l)}`), yLabels: labels.map(levlabel), rotateX: false, maxCell: 96, labelWidth: 90,
      intensity: (v, i) => v / cm[i].reduce((a, b) => a + b, 0), colorFor: (v, i, j) => (i === j ? "c2" : "c4"), format: v => String(v),
      cellLabel: (v, i, j) => `${L("true", "حقيقي")} ${labels[i]}, ${L("predicted", "متوقع")} ${labels[j]}: ${v}` });
    bindSeg(root, "ev-m", v => { st.m = v; this.render(root); });
  },
});

/* =====================================================================
   19 — Forecasting future activity
   ===================================================================== */
Lec.add({
  id: "forecasting", num: 19, aliases: ["forecast"],
  title: { en: "Forecasting Future Activity", ar: "توقع النشاط المستقبلي" },
  short: { en: "Forecasting", ar: "التوقع" },
  summary: { en: "Trend + seasonality → a forecast with an honest range.", ar: "الاتجاه + الموسمية ← توقع مع نطاق صادق." },
  render(root) {
    const F = SD().forecast.series, st = getState("fc", { s: "screening_visits" }), S = F[st.s];
    const names = { screening_visits: L("Screening visits", "زيارات الفحص"), follow_up_requests: L("Follow-up requests", "طلبات المتابعة"), lab_requests: L("Lab requests", "طلبات المختبر") };
    const total = S.forecast.reduce((a, b) => a + b, 0), last12 = S.values.slice(-12).reduce((a, b) => a + b, 0), best = S.holdout[S.best_method], naive = S.holdout["Seasonal naive"];
    const months = App.lang === "ar" ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const busiest = S.seasonal.indexOf(Math.max(...S.seasonal)), quietest = S.seasonal.indexOf(Math.min(...S.seasonal));
    const fcode = Snip.forecast(st.s, S.best_method, `${fmtInt(total)} · ${L("typical error", "الخطأ المعتاد")} ${fmtPct(best.mape, 1)}`); setCode("s19-fc", fcode); setCode("s19-season", Snip.seasonal(st.s));
    root.innerHTML = lesson(this, {
      simple: L("Forecasting estimates future <strong>totals</strong> — like how many screening visits we will have each month next year — by learning the past <strong>trend</strong> (going up or down) and <strong>seasonal</strong> pattern (busy and quiet months). We forecast workload, never individual patients.",
        "يقدّر التوقع <strong>المجاميع</strong> المستقبلية — مثل عدد زيارات الفحص في كل شهر من العام القادم — بتعلّم <strong>الاتجاه</strong> الماضي (صعودًا أو هبوطًا) والنمط <strong>الموسمي</strong> (أشهر مزدحمة وهادئة). نتوقع حجم العمل، ولا نتوقع حالة مرضى أفراد أبدًا."),
      why: [L("Staffing, rooms and lab capacity are planned months ahead.", "التوظيف والغرف وسعة المختبر تُخطَّط قبل أشهر."), L("A range (not one number) shows how much to plan for.", "النطاق (لا الرقم الواحد) يبيّن مقدار ما يجب التخطيط له.")],
      steps: [
        { t: L("Plot the history", "ارسم التاريخ"), d: L("72 months of activity, 2019–2024.", "72 شهرًا من النشاط، 2019–2024.") },
        { t: L("Separate trend and season", "افصل الاتجاه عن الموسم"), d: L("Trend = the slow long-term rise. Season = the repeating yearly pattern.", "الاتجاه = الصعود البطيء طويل المدى. الموسم = النمط السنوي المتكرر."), ex: L(`busiest month: ${months[busiest]} · quietest: ${months[quietest]}`, `الشهر الأكثر ازدحامًا: ${months[busiest]} · الأهدأ: ${months[quietest]}`) },
        { t: L("Test on the last year", "اختبر على العام الأخير"), d: L("Pretend 2024 hasn't happened, forecast it, and compare with what really happened.", "تظاهر بأن 2024 لم يحدث، وتوقعه، ثم قارن بما حدث فعلًا."), ex: L(`average error: ${fmt(best.mape, 1)}%`, `متوسط الخطأ: ${fmt(best.mape, 1)}%`) },
        { t: L("Beat a simple benchmark", "تفوّق على معيار بسيط"), d: L("“Same month last year” is the bar to beat.", "«الشهر نفسه من العام الماضي» هو المعيار الذي يجب التفوق عليه."), ex: L(`benchmark error ${fmt(naive.mape, 1)}% vs model ${fmt(best.mape, 1)}%`, `خطأ المعيار ${fmt(naive.mape, 1)}% مقابل النموذج ${fmt(best.mape, 1)}%`) },
        { t: L("Forecast with a range", "توقّع مع نطاق"), d: L("Give the expected value and a likely range for each month.", "قدّم القيمة المتوقعة ونطاقًا مرجحًا لكل شهر.") },
      ],
      seeTitle: L("The forecast", "التوقع"),
      see: `<div class="controls">${selectEl("fc-s", Object.keys(F).map(k => ({ value: k, label: names[k] })), st.s, L("What to forecast", "ماذا نتوقع"))}</div>
        <div class="grid grid-3 mt-2">${kpi(L("Next 12 months (forecast)", "الأشهر الـ12 القادمة (توقع)"), fmtInt(total), "", "primary", fcode)}${kpi(L("Last 12 months (actual)", "آخر 12 شهرًا (فعلي)"), fmtInt(last12), `${fmt(100 * (total / last12 - 1), 1)}% ${L("change", "تغيّر")}`, "", fcode)}${kpi(L("Typical forecast error", "خطأ التوقع المعتاد"), fmtPct(best.mape, 1), "", "accent", fcode)}</div>
        <div class="chart-card mt-2">${codeChip("s19-fc")}<div class="chart-sub">${L("Blue = history · grey dashed = trend · orange = test forecast for 2024 · green = forecast with likely range", "الأزرق = التاريخ · الرمادي المتقطع = الاتجاه · البرتقالي = توقع الاختبار لعام 2024 · الأخضر = التوقع مع النطاق المرجح")}</div><div id="fc-chart"></div></div>
        <div class="chart-card mt-2">${codeChip("s19-season")}<div class="chart-title">${L("The seasonal pattern: above or below trend, by month", "النمط الموسمي: فوق الاتجاه أو تحته حسب الشهر")}</div><div id="fc-season"></div></div>`,
      results: `<ul><li>${L(`Expect about <strong>${fmtInt(total)}</strong> ${names[st.s].toLowerCase()} over the next 12 months (${fmt(100 * (total / last12 - 1), 1)}% vs the last 12).`, `توقّع نحو <strong>${fmtInt(total)}</strong> من ${names[st.s]} خلال الأشهر الـ12 القادمة (${fmt(100 * (total / last12 - 1), 1)}% مقارنة بآخر 12 شهرًا).`)}</li>
        <li>${L(`Plan extra capacity for ${months[busiest]}; ${months[quietest]} is the quietest month.`, `خطّط لسعة إضافية في ${months[busiest]}؛ و${months[quietest]} هو الشهر الأهدأ.`)}</li>
        <li>${L("The forecast assumes the past pattern continues. New clinics, policy changes or outbreaks would break it — re-forecast every month.", "يفترض التوقع استمرار النمط الماضي. والعيادات الجديدة وتغييرات السياسات والتفشيات قد تكسره — أعد التوقع كل شهر.")}</li></ul>`,
      remember: L("Forecast totals with a range, compare with a simple benchmark, and update regularly.", "توقّع المجاميع مع نطاق، وقارن بمعيار بسيط، وحدّث بانتظام."),
    });
    const n = S.values.length, h = S.forecast.length, pad = (a, b, c) => Array(b).fill(null).concat(a, Array(c).fill(null));
    Charts.line(root.querySelector("#fc-chart"), { labels: S.months.concat(S.future_months), height: 330, yLabel: L("per month", "شهريًا"),
      series: [{ name: L("actual", "فعلي"), values: pad(S.values, 0, h), cls: "c1" }, { name: L("trend", "الاتجاه"), values: pad(S.trend, 0, h), cls: "c7", dash: "5 4", width: 1.8 },
        { name: L("test forecast", "توقع الاختبار"), values: pad(best.pred, n - 12, h), cls: "c3", width: 2.4 }, { name: L("forecast", "التوقع"), values: Array(n - 1).fill(null).concat([S.values[n - 1]], S.forecast), cls: "c2", width: 2.6 }],
      band: { lower: pad(S.lower, n, 0), upper: pad(S.upper, n, 0), cls: "c2", name: L("likely range", "النطاق المرجح") }, vline: n - 1 });
    Charts.mount(root.querySelector("#fc-season"), w => {
      const hgt = 230, m = { t: 14, r: 10, b: 32, l: 46 }, mx = Math.max(...S.seasonal.map(Math.abs)) * 1.15;
      const y = v => m.t + (hgt - m.t - m.b) * (1 - (v + mx) / (2 * mx)), band = (w - m.l - m.r) / 12, bw = band * .62;
      let s = `<line x1="${m.l}" x2="${w - m.r}" y1="${y(0)}" y2="${y(0)}" class="s-muted"/>`;
      Charts.ticks(-mx, mx, 4).forEach(tv => { s += `<line class="gridline" x1="${m.l}" x2="${w - m.r}" y1="${y(tv)}" y2="${y(tv)}"/><text class="lbl" x="${m.l - 6}" y="${y(tv) + 4}" text-anchor="end">${Charts.tickFmt(tv)}</text>`; });
      S.seasonal.forEach((v, i) => { const cx = m.l + band * i + band / 2, y0 = y(Math.max(0, v)), y1 = y(Math.min(0, v)); s += `<rect class="mark f-${v >= 0 ? "c2" : "c4"}" x="${cx - bw / 2}" y="${y0}" width="${bw}" height="${Math.max(1, y1 - y0)}" rx="3" data-tip="${months[i]}: ${v > 0 ? "+" : ""}${fmt(v, 0)}"/><text class="lbl" x="${cx}" y="${hgt - m.b + 16}" text-anchor="middle">${months[i].slice(0, 3)}</text>`; });
      return `<svg width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}" role="img" aria-label="${L("Seasonal pattern", "النمط الموسمي")}">${s}</svg>`;
    });
    root.querySelector("#fc-s").addEventListener("change", e => { st.s = e.target.value; this.render(root); root.querySelector("#fc-s").focus(); });
  },
});

/* =====================================================================
   20 — The full journey
   ===================================================================== */
Lec.add({
  id: "end-to-end-case", num: 20, aliases: ["case-study", "end-to-end"],
  title: { en: "The Full Journey in One Place", ar: "الرحلة كاملة في مكان واحد" },
  short: { en: "The full journey", ar: "الرحلة كاملة" },
  summary: { en: "Every step's output feeds the next — through to a decision.", ar: "مُخرَج كل خطوة يغذّي التالية — حتى الوصول إلى القرار." },
  render(root) {
    const d = SD(), f = facts(), st = getState("e2e", { i: 0 }), q = d.quality.summary, gm = d.eda.group_means;
    const g = Stats.describe(Data.values(Data.clean(), "fasting_glucose")), hr = d.hypothesis.heart_rate_smoking;
    const steps = [
      [L("Raw data", "البيانات الخام"), L(`${fmtInt(q.rows)} messy rows`, `${fmtInt(q.rows)} صفًا غير منظم`), "executive-overview"],
      [L("Quality check", "فحص الجودة"), L(`${q.completeness_pct}% filled, ${q.exact_duplicates} duplicates, ${q.invalid_dates} impossible dates`, `${q.completeness_pct}% ممتلئ، ${q.exact_duplicates} تكرارًا، ${q.invalid_dates} تواريخ مستحيلة`), "data-quality"],
      [L("Cleaning", "التنظيف"), L(`${fmtInt(f.cleanRows)} reliable rows`, `${fmtInt(f.cleanRows)} صفًا موثوقًا`), "data-cleaning"],
      [L("Missing data", "البيانات المفقودة"), L("gaps measured and explained; nothing invented", "الفجوات مقيسة ومفسّرة؛ ولا شيء مختلَق"), "missing-data"],
      [L("Description", "الوصف"), L(`typical glucose ${fmt(g.median, 0)} mg/dL (middle half ${fmt(g.q1, 0)}–${fmt(g.q3, 0)})`, `السكر النموذجي ${fmt(g.median, 0)} ملغ/دل (النصف الأوسط ${fmt(g.q1, 0)}–${fmt(g.q3, 0)})`), "statistics"],
      [L("Exploration", "الاستكشاف"), L(`“High” group older on average (${fmt(gm.High.age, 0)} vs ${fmt(gm.Low.age, 0)})`, `المجموعة «المرتفعة» أكبر سنًا في المتوسط (${fmt(gm.High.age, 0)} مقابل ${fmt(gm.Low.age, 0)})`), "eda"],
      [L("Relationships", "العلاقات"), L(`HbA1c and glucose move together (r = ${fmt(d.correlation.pairs[1].pearson_r, 2)})`, `HbA1c والسكر يتحركان معًا (r = ${fmt(d.correlation.pairs[1].pearson_r, 2)})`), "correlation"],
      [L("Testing", "الاختبار"), L(`smokers' heart rate ${fmt(hr.mean_difference, 1)} bpm higher — not chance`, `نبض المدخنين أعلى بـ ${fmt(hr.mean_difference, 1)} — ليس صدفة`), "hypothesis-testing"],
      [L("Certainty", "اليقين"), L(`average glucose ${fmt(f.glucoseMean, 1)} (95% range ${fmt(f.glucoseLo, 1)}–${fmt(f.glucoseHi, 1)})`, `متوسط السكر ${fmt(f.glucoseMean, 1)} (نطاق 95%: ${fmt(f.glucoseLo, 1)}–${fmt(f.glucoseHi, 1)})`), "confidence-intervals"],
      [L("New columns", "أعمدة جديدة"), L(`${d.features.n_features_before} → ${d.features.n_features_after} columns`, `${d.features.n_features_before} ← ${d.features.n_features_after} عمودًا`), "feature-engineering"],
      [L("Prediction", "التنبؤ"), L(`right ${fmt(f.gbAcc * 100, 0)}% of the time on new patients (teaching label)`, `يصيب ${fmt(f.gbAcc * 100, 0)}% من الوقت على مرضى جدد (تسمية تعليمية)`), "model-evaluation"],
      [L("Forecast", "التوقع"), L(`≈ ${fmtInt(f.fcTotal)} visits next year (±${fmt(f.fcMape, 0)}%)`, `≈ ${fmtInt(f.fcTotal)} زيارة العام القادم (±${fmt(f.fcMape, 0)}%)`), "forecasting"],
      [L("Decision", "القرار"), L("fix data entry at source · plan capacity · investigate (not assume) associations", "إصلاح الإدخال من المصدر · تخطيط السعة · التحقيق في الارتباطات (لا افتراضها)"), null],
    ];
    const cur = steps[st.i];
    const jc = [() => Snip.rawShape(steps[0][1]), () => Snip.completeness(fmtPct(q.completeness_pct)), () => Snip.cleanRows(fmtInt(f.cleanRows)), () => Snip.missingBars(),
      () => Snip.descStat("median", "fasting_glucose", "all", fmt(g.median, 0)), () => Snip.edaTable("age", "risk_group"), () => Snip.corrPair("hba1c", "fasting_glucose", steps[6][1]),
      () => Snip.htTest("heart_rate", "smoking_status", "Non-Smoker", "Smoker", steps[7][1]),
      () => ({ title: L("95% range for the average glucose", "نطاق 95% لمتوسط السكر"), result: steps[8][1], code: `${PY.load}
from scipy import stats

g = df["fasting_glucose"].dropna()
half = stats.t.ppf(0.975, len(g) - 1) * g.std() / len(g) ** 0.5
print(round(g.mean(), 1), "range", round(g.mean() - half, 1), "to", round(g.mean() + half, 1))` }),
      () => Snip.pipeStep(3), () => Snip.evalCM("Gradient Boosting", steps[10][1]), () => Snip.forecast("screening_visits", d.forecast.series.screening_visits.best_method, steps[11][1]), null][st.i];
    if (jc) setCode("s20", jc());
    root.innerHTML = lesson(this, {
      simple: L("Now all the steps together. Each step takes the previous result as its starting point — click through to see how the chain builds up to a decision.",
        "الآن كل الخطوات معًا. كل خطوة تأخذ النتيجة السابقة نقطةَ انطلاق — انقر عبرها لترى كيف تتراكم السلسلة حتى القرار."),
      seeTitle: L("Click through the chain", "انقر عبر السلسلة"),
      see: `<div class="journey"><div class="journey-steps" role="list">${steps.map((s, i) => `<button type="button" role="listitem" data-i="${i}" class="${i < st.i ? "done" : ""}" ${i === st.i ? 'aria-current="step"' : ""}><span class="n">${pad2(i + 1)}</span><span class="lbl">${s[0]}</span></button>`).join("")}</div>
        <div><div class="card" aria-live="polite">${jc ? codeChip("s20") : ""}<h3>${pad2(st.i + 1)} · ${cur[0]}</h3>
          <div class="io-grid mt-2"><div class="io-box"><div class="k">${L("Starts from", "تبدأ من")}</div>${st.i ? steps[st.i - 1][1] : L("files from 6 clinics", "ملفات من 6 عيادات")}</div><span class="arrow">${ICON.arrowR}</span>
          <div class="io-box out"><div class="k">${L("Produces", "تُنتج")}</div><strong>${cur[1]}</strong></div><span class="arrow">${ICON.arrowR}</span>
          <div class="io-box"><div class="k">${L("Feeds into", "تغذّي")}</div>${steps[st.i + 1] ? steps[st.i + 1][0] : L("Lecture 2: dashboards & automation", "المحاضرة 2: لوحات المؤشرات والأتمتة")}</div></div>
          ${cur[2] ? `<p class="mt-2 mb-0">${sectionLink(cur[2], L("Revisit this step →", "عُد إلى هذه الخطوة ←"))}</p>` : ""}</div>
          <div class="row mt-2"><button type="button" class="btn" data-mv="-1" ${st.i === 0 ? "disabled" : ""}>${ICON.arrowL} ${L("Previous step", "الخطوة السابقة")}</button><button type="button" class="btn btn-primary" data-mv="1" ${st.i === steps.length - 1 ? "disabled" : ""}>${L("Next step", "الخطوة التالية")} ${ICON.arrowR}</button></div></div></div>`,
      results: `<ul><li>${L("Quality and cleaning set the ceiling for everything after them.", "الجودة والتنظيف يحددان سقف كل ما يأتي بعدهما.")}</li>
        <li>${L("Statistics turn numbers into evidence: centre, spread, tests and ranges.", "الإحصاء يحوّل الأرقام إلى أدلة: المركز والتشتت والاختبارات والنطاقات.")}</li>
        <li>${L("Models and forecasts are useful only when tested honestly on new data.", "النماذج والتوقعات مفيدة فقط عندما تُختبر بصدق على بيانات جديدة.")}</li>
        <li>${L("Associations are not causes — say “linked with”, not “caused by”.", "الارتباطات ليست أسبابًا — قل «مرتبط بـ» لا «ناتج عن».")}</li></ul>`,
      remember: L("Check → Clean → Describe → Test → Predict → Decide — and say how sure you are at every step.", "افحص ← نظّف ← صِف ← اختبر ← تنبأ ← قرّر — وقل مدى تأكدك في كل خطوة."),
    }) + `<section class="next-lecture"><div class="eyebrow">${L("Next", "التالي")}</div>
        <h2>${L("Next Lecture: From Statistical Insight to BI, Automation and AI Agents", "المحاضرة التالية: من الرؤية الإحصائية إلى ذكاء الأعمال والأتمتة ووكلاء الذكاء الاصطناعي")}</h2>
        <p class="lead" style="margin:0 auto 22px">${L("We turn these results into dashboards, automated pipelines and carefully supervised AI assistants.", "نحوّل هذه النتائج إلى لوحات مؤشرات ومسارات مؤتمتة ومساعدين ذكيين تحت إشراف دقيق.")}</p>
        <a class="btn btn-primary btn-xl" href="lecture-2.html">${L("GO TO LECTURE 2", "الانتقال إلى المحاضرة 2")} ${ICON.arrowR}</a></section>`;
    root.querySelectorAll(".journey-steps [data-i]").forEach(b => b.addEventListener("click", () => { st.i = +b.dataset.i; this.render(root); root.querySelector(`.journey-steps [data-i="${st.i}"]`).focus(); }));
    root.querySelectorAll("[data-mv]").forEach(b => b.addEventListener("click", () => { const dir = +b.dataset.mv; st.i = Math.max(0, Math.min(steps.length - 1, st.i + dir)); this.render(root); const nb = root.querySelector(`[data-mv="${dir}"]`); (nb.disabled ? root.querySelector(`[data-mv="${-dir}"]`) : nb).focus(); }));
  },
});
