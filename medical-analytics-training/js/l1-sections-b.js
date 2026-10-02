/* =====================================================================
   Lecture 1 — Sections 08–14 (missing data + statistics)
   Created by Master of AI.
   All numbers are computed live from the clean dataset with the same
   conventions as pandas / SciPy.
   ===================================================================== */
const NUM_VARS = ["age", "bmi", "fasting_glucose", "hba1c", "total_cholesterol", "systolic_bp", "diastolic_bp", "heart_rate"];
function filterOptions() {
  const opts = [{ value: "all", label: L("All patients", "جميع المرضى") }];
  ["risk_group", "sex", "smoking_status"].forEach(col => Data.levels(Data.clean(), col).forEach(l => opts.push({ value: `${col}:${l}`, label: `${glabel(col)}: ${levlabel(l)}` })));
  return opts;
}
function applyFilter(rows, key) { if (!key || key === "all") return rows; const [col, lev] = key.split(":"); return rows.filter(r => String(r[col]) === lev); }
function effectWord(g) { const a = Math.abs(g); return a < 0.2 ? L("very small", "صغير جدًا") : a < 0.5 ? L("small", "صغير") : a < 0.8 ? L("medium", "متوسط") : L("large", "كبير"); }

/* =====================================================================
   08 — Missing data
   ===================================================================== */
Lec.add({
  id: "missing-data", num: 8, aliases: ["missing"],
  title: { en: "Handling Missing Data", ar: "التعامل مع البيانات المفقودة" },
  short: { en: "Missing data", ar: "البيانات المفقودة" },
  summary: { en: "Why values go missing, and what filling them in really does.", ar: "لماذا تُفقد القيم، وماذا يفعل ملؤها فعلًا." },
  render(root) {
    const st = getState("missing", { v: "medication_adherence_pct", m: "median" });
    const rows = Data.clean();
    const missPct = SD().clean.columns.filter(c => c !== "patient_id").map(c => ({ c, p: (100 * rows.filter(r => r[c] == null).length) / rows.length })).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
    root.innerHTML = lesson(this, {
      simple: L("Some values are simply not there. Before deciding what to do, ask <strong>why</strong> they are missing — because filling gaps with a guess can quietly change your results.",
        "بعض القيم غير موجودة ببساطة. قبل أن تقرر ماذا تفعل، اسأل <strong>لماذا</strong> هي مفقودة — لأن ملء الفجوات بتخمين قد يغيّر نتائجك بصمت."),
      why: [L("Ignoring missing values can bias averages.", "تجاهل القيم المفقودة قد يُحدث انحيازًا في المتوسطات."), L("Filling them in carelessly makes data look more certain than it is.", "ملؤها دون عناية يجعل البيانات تبدو أكثر يقينًا مما هي عليه.")],
      steps: [
        { t: L("Measure how much is missing", "قِس مقدار المفقود"), d: L("Count the gaps in every column.", "عدّ الفجوات في كل عمود."), ex: L(`adherence: ${fmt(missPct.find(x => x.c === "medication_adherence_pct").p, 1)}% missing`, `الالتزام: ${fmt(missPct.find(x => x.c === "medication_adherence_pct").p, 1)}% مفقود`) },
        { t: L("Ask why it is missing", "اسأل لماذا هو مفقود"), d: L("Three possibilities: (1) completely at random — e.g. a lab machine failed by chance; (2) linked to something else we recorded — e.g. tests ordered less for young patients; (3) linked to the missing value itself — e.g. people with poor adherence don't report it.",
          "ثلاثة احتمالات: (1) عشوائي تمامًا — مثل تعطل جهاز مختبر بالصدفة؛ (2) مرتبط بشيء آخر سجلناه — مثل طلب تحاليل أقل للمرضى الصغار؛ (3) مرتبط بالقيمة المفقودة نفسها — مثل أن ذوي الالتزام الضعيف لا يُبلغون عنه."),
          ex: L("In our data, adherence is case (3): low adherence was more often left blank.", "في بياناتنا، الالتزام هو الحالة (3): الالتزام المنخفض تُرك فارغًا أكثر.") },
        { t: L("Choose a strategy", "اختر استراتيجية"), d: L("Leave the gaps out, fill with an average/median, fill with a group's median, or use a model.", "استبعد الفجوات، أو املأها بالمتوسط/الوسيط، أو بوسيط المجموعة، أو استخدم نموذجًا."), ex: L("simplest: use only rows that have a value", "الأبسط: استخدام الصفوف التي فيها قيمة فقط") },
        { t: L("Check what the choice did", "تحقق مما فعله الاختيار"), d: L("Compare the numbers before and after — try it below.", "قارن الأرقام قبل وبعد — جرّب ذلك أدناه.") },
        { t: L("Keep a note", "احتفظ بملاحظة"), d: L("Add a “was missing” flag so nobody mistakes a filled value for a measured one.", "أضف علامة «كان مفقودًا» حتى لا يظن أحد أن القيمة المملوءة قيمة مقيسة.") },
      ],
      seeTitle: L("Try it: what does filling in do?", "جرّبها: ماذا يفعل الملء؟"),
      see: `<div class="chart-card">${codeChip("s8-bars")}<div class="chart-title">${L("Share of missing values per column (after cleaning)", "نسبة القيم المفقودة لكل عمود (بعد التنظيف)")}</div><div id="miss-bars"></div></div>
        <div class="controls mt-2">${selectEl("mi-var", varOptions(["medication_adherence_pct", "total_cholesterol", "hba1c", "fasting_glucose", "bmi"]), st.v, L("Column", "العمود"))}
          <div class="field"><span class="field-label">${L("What to do with the gaps", "ماذا نفعل بالفجوات")}</span>${segmented("mi-m", [{ value: "drop", label: L("Leave them out", "استبعادها") }, { value: "mean", label: L("Fill with mean", "الملء بالمتوسط") }, { value: "median", label: L("Fill with median", "الملء بالوسيط") }, { value: "group", label: L("Fill with group median", "الملء بوسيط المجموعة") }], st.m)}</div></div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s8-mi")}<div id="mi-hist"></div><div id="mi-legend"></div></div><div class="card" id="mi-table"></div></div>`,
      results: `<div id="mi-msg"></div>`,
      remember: L("Ask why data is missing before filling it. Filling in makes data look more certain than it is.", "اسأل لماذا البيانات مفقودة قبل ملئها. فالملء يجعل البيانات تبدو أكثر يقينًا مما هي عليه."),
      quiz: { q: L("You fill 120 missing values with the average. What happens to the spread (standard deviation)?", "ملأت 120 قيمة مفقودة بالمتوسط. ماذا يحدث للتشتت (الانحراف المعياري)؟"), options: [
        { t: L("It gets smaller — the data looks less variable than it is", "يصغر — فتبدو البيانات أقل تباينًا مما هي عليه"), ok: true, why: L("120 identical values sit exactly at the centre, squeezing the spread.", "120 قيمة متطابقة تقع في المركز تمامًا فتضغط التشتت.") },
        { t: L("It gets bigger", "يكبر"), why: L("Values at the centre reduce spread, not increase it.", "القيم في المركز تقلل التشتت ولا تزيده.") },
        { t: L("Nothing changes", "لا شيء يتغير"), why: L("Try it above — the spread shrinks.", "جرّبها أعلاه — التشتت يتقلص.") }] },
    });
    setCode("s8-bars", Snip.missingBars());
    Charts.bar(root.querySelector("#miss-bars"), { horizontal: true, labelWidth: 190, format: v => `${fmt(v, 1)}%`, data: missPct.map(x => ({ label: x.c, value: x.p, cls: x.p > 5 ? "c3" : "c1" })) });
    const draw = () => {
      const v = st.v, observed = Data.values(rows, v), gaps = rows.filter(r => r[v] == null);
      let filled = [];
      if (st.m === "mean") filled = gaps.map(() => Stats.mean(observed));
      else if (st.m === "median") filled = gaps.map(() => Stats.median(observed));
      else if (st.m === "group") { const med = {}; ["Low", "Moderate", "High"].forEach(g => { med[g] = Stats.median(Data.values(rows.filter(r => r.risk_group === g), v)); }); filled = gaps.map(r => med[r.risk_group] ?? Stats.median(observed)); }
      const a = Stats.describe(observed), b = Stats.describe(observed.concat(filled)), sdChange = 100 * (b.std - a.std) / a.std;
      setCode("s8-mi", Snip.imputation(v, st.m, `${L("spread (SD)", "التشتت (الانحراف المعياري)")}: ${fmt(a.std)} → ${fmt(b.std)}`));
      Charts.histogram(root.querySelector("#mi-hist"), { series: [{ values: observed, cls: "c1", name: L("measured", "مقيسة") }, ...(filled.length ? [{ values: filled, cls: "c3", name: L("filled in", "مملوءة") }] : [])], bins: 30, xLabel: `${vlabel(v)} (${vunit(v)})`, yLabel: L("Patients", "المرضى") });
      root.querySelector("#mi-legend").innerHTML = Charts.legend([{ cls: "c1", label: L("Measured values", "القيم المقيسة") }, ...(filled.length ? [{ cls: "c3", label: L("Filled-in values", "القيم المملوءة") }] : [])]);
      root.querySelector("#mi-table").innerHTML = codeChip("s8-mi") + miniTable(["", { t: L("Measured only", "المقيسة فقط"), num: true }, { t: L("After your choice", "بعد اختيارك"), num: true }], [
        [L("Number of values", "عدد القيم"), fmtInt(a.n), fmtInt(b.n)], [L("Average", "المتوسط"), fmt(a.mean), fmt(b.mean)], [L("Median", "الوسيط"), fmt(a.median), fmt(b.median)], [L("Spread (SD)", "التشتت (الانحراف المعياري)"), fmt(a.std), fmt(b.std)]]);
      root.querySelector("#mi-msg").innerHTML = st.m === "drop"
        ? `<p class="mb-0">${L(`We use only the ${fmtInt(a.n)} measured values. The picture stays honest, but for adherence the average is probably a little too high, because low values were more often missing.`, `نستخدم القيم المقيسة فقط وعددها ${fmtInt(a.n)}. تبقى الصورة صادقة، لكن متوسط الالتزام غالبًا أعلى قليلًا من الحقيقة لأن القيم المنخفضة فُقدت أكثر.`)}</p>`
        : `<p class="mb-0">${L(`We added ${filled.length} filled-in values (the orange spike in the chart). The spread changed by <strong>${fmt(sdChange, 1)}%</strong> — the data now looks more uniform than it really is.`, `أضفنا ${filled.length} قيمة مملوءة (القمة البرتقالية في الرسم). تغيّر التشتت بنسبة <strong>${fmt(sdChange, 1)}%</strong> — فتبدو البيانات الآن أكثر تجانسًا مما هي عليه فعلًا.`)}</p>`;
    };
    draw();
    root.querySelector("#mi-var").addEventListener("change", e => { st.v = e.target.value; draw(); });
    bindSeg(root, "mi-m", v => { st.m = v; draw(); });
  },
});

/* =====================================================================
   09 — Describing the data (descriptive statistics)
   ===================================================================== */
const STAT_DEFS = [
  ["n", { en: "Count (n)", ar: "العدد (n)" }, { en: "How many values we have", ar: "عدد القيم المتوفرة" }, 0],
  ["mean", { en: "Mean (average)", ar: "المتوسط الحسابي" }, { en: "Add up, divide by n", ar: "اجمع ثم اقسم على n" }, 2],
  ["median", { en: "Median (middle)", ar: "الوسيط (القيمة الوسطى)" }, { en: "Half below, half above", ar: "نصف القيم أقل ونصفها أعلى" }, 2],
  ["mode", { en: "Mode", ar: "المنوال" }, { en: "Most common value", ar: "القيمة الأكثر تكرارًا" }, 2],
  ["min", { en: "Minimum", ar: "أدنى قيمة" }, { en: "Smallest value", ar: "أصغر قيمة" }, 2],
  ["max", { en: "Maximum", ar: "أعلى قيمة" }, { en: "Largest value", ar: "أكبر قيمة" }, 2],
  ["range", { en: "Range", ar: "المدى" }, { en: "Max − min", ar: "الأعلى − الأدنى" }, 2],
  ["std", { en: "Standard deviation", ar: "الانحراف المعياري" }, { en: "Typical distance from the average", ar: "المسافة المعتادة عن المتوسط" }, 2],
  ["variance", { en: "Variance", ar: "التباين" }, { en: "Standard deviation squared", ar: "مربع الانحراف المعياري" }, 2],
  ["q1", { en: "Q1 (25%)", ar: "الربيع الأول (25%)" }, { en: "A quarter of values are below", ar: "ربع القيم أقل منه" }, 2],
  ["q3", { en: "Q3 (75%)", ar: "الربيع الثالث (75%)" }, { en: "Three quarters are below", ar: "ثلاثة أرباع القيم أقل منه" }, 2],
  ["iqr", { en: "IQR", ar: "المدى الربيعي" }, { en: "Q3 − Q1: spread of the middle half", ar: "Q3 − Q1: تشتت النصف الأوسط" }, 2],
  ["p5", { en: "5th percentile", ar: "المئين 5" }, { en: "Only 5% are lower", ar: "5% فقط أقل منه" }, 2],
  ["p95", { en: "95th percentile", ar: "المئين 95" }, { en: "Only 5% are higher", ar: "5% فقط أعلى منه" }, 2],
  ["skewness", { en: "Skewness", ar: "الالتواء" }, { en: "> 0: long tail of high values", ar: "> 0: ذيل طويل من القيم المرتفعة" }, 2],
];
Lec.add({
  id: "statistics", num: 9, aliases: ["descriptive-statistics"],
  title: { en: "Describing the Data (Descriptive Statistics)", ar: "وصف البيانات (الإحصاء الوصفي)" },
  short: { en: "Descriptive statistics", ar: "الإحصاء الوصفي" },
  summary: { en: "Centre, spread and position — recalculated live.", ar: "المركز والتشتت والموقع — تُحسب مباشرة." },
  render(root) {
    const st = getState("desc", { v: "fasting_glucose", f: "all" });
    root.innerHTML = lesson(this, {
      simple: L("Descriptive statistics turn a long column of numbers into a few easy facts: what is <strong>typical</strong>, how much values <strong>vary</strong>, and where a value <strong>sits</strong> compared with others.",
        "يحوّل الإحصاء الوصفي عمودًا طويلًا من الأرقام إلى حقائق قليلة وسهلة: ما <strong>المعتاد</strong>، ومدى <strong>تباين</strong> القيم، وأين <strong>تقع</strong> قيمة ما مقارنة بغيرها."),
      why: [L("An average alone can mislead — you also need the spread.", "المتوسط وحده قد يضلل — تحتاج أيضًا إلى التشتت."), L("These numbers are the foundation for every later step.", "هذه الأرقام هي الأساس لكل خطوة لاحقة.")],
      steps: [
        { t: L("Count", "العدّ"), d: L("How many real values do we have? (Missing ones are left out.)", "كم قيمة حقيقية لدينا؟ (تُستبعد المفقودة.)") },
        { t: L("Find the centre", "إيجاد المركز"), d: L("Mean = add up and divide. Median = the middle value when sorted.", "المتوسط = اجمع واقسم. الوسيط = القيمة الوسطى بعد الترتيب."), ex: L("values 90, 92, 95, 300 → mean 144, median 93.5", "القيم 90، 92، 95، 300 ← المتوسط 144، الوسيط 93.5") },
        { t: L("Measure the spread", "قياس التشتت"), d: L("Range (max − min), standard deviation (typical distance from the average) and IQR (spread of the middle half).", "المدى (الأعلى − الأدنى)، والانحراف المعياري (المسافة المعتادة عن المتوسط)، والمدى الربيعي (تشتت النصف الأوسط).") },
        { t: L("Describe position", "وصف الموقع"), d: L("Quartiles and percentiles tell where a value stands.", "الربيعات والمئينات تخبرنا بموقع القيمة."), ex: L("95th percentile = only 5% of patients are higher", "المئين 95 = 5% فقط من المرضى أعلى") },
        { t: L("Check the shape", "فحص الشكل"), d: L("If a few very high values pull the mean above the median, the data is “skewed” — then the median is the better summary.", "إذا سحبت قيم مرتفعة قليلة المتوسطَ فوق الوسيط فالبيانات «ملتوية» — والوسيط عندها هو الملخص الأفضل.") },
      ],
      seeTitle: L("Pick a measurement and a group", "اختر قياسًا ومجموعة"),
      see: `<div class="controls">${selectEl("ds-var", varOptions(NUM_VARS), st.v, L("Measurement", "القياس"))}${selectEl("ds-f", filterOptions(), st.f, L("Which patients", "أي المرضى"))}</div>
        <div id="ds-out" class="mt-2"></div>
        <div class="chart-card mt-2">${codeChip("s9-hist")}<div class="chart-title" id="ds-ctitle"></div><div class="chart-sub">${L("Dashed line = mean · solid line = median · shaded = middle half (Q1 to Q3)", "الخط المتقطع = المتوسط · الخط المتصل = الوسيط · المظلل = النصف الأوسط (Q1 إلى Q3)")}</div><div id="ds-hist"></div></div>`,
      results: `<div id="ds-msg"></div>`,
      code: { code: `g = df["fasting_glucose"].dropna()
g.describe()          # count, mean, std, min, quartiles, max
g.median(), g.skew()`, result: `<div id="ds-code-res"></div>` },
      remember: L("Always report a centre AND a spread. With skewed data, prefer the median and IQR.", "اعرض دائمًا المركز والتشتت معًا. ومع البيانات الملتوية فضّل الوسيط والمدى الربيعي."),
      quiz: { q: L("Most glucose values are around 90, but a few are above 300. Which is the better “typical” value?", "معظم قيم السكر حول 90 لكن قليلًا منها فوق 300. أيهما القيمة «النموذجية» الأفضل؟"), options: [
        { t: L("The median", "الوسيط"), ok: true, why: L("The median is not pulled up by a few extreme values.", "الوسيط لا يتأثر بقيم متطرفة قليلة.") },
        { t: L("The mean", "المتوسط"), why: L("The mean is pulled towards the extreme values.", "المتوسط ينسحب نحو القيم المتطرفة.") },
        { t: L("The maximum", "أعلى قيمة"), why: L("The maximum describes one extreme patient, not a typical one.", "أعلى قيمة تصف مريضًا متطرفًا واحدًا لا مريضًا نموذجيًا.") }] },
    });
    const draw = () => {
      const vals = Data.values(applyFilter(Data.clean(), st.f), st.v), s = Stats.describe(vals), u = vunit(st.v);
      root.querySelector("#ds-out").innerHTML = `<div class="stat-grid">${STAT_DEFS.map(([k, n, d, dp]) => { const val = k === "n" ? fmtInt(s[k]) : fmt(s[k], dp); return stat(LT(n), val, LT(d), Snip.descStat(k, st.v, st.f, val)); }).join("")}</div>`;
      setCode("s9-hist", Snip.descHist(st.v, st.f));
      root.querySelector("#ds-ctitle").textContent = `${vlabel(st.v)} (${u}) — ${filterOptions().find(o => o.value === st.f).label}`;
      Charts.histogram(root.querySelector("#ds-hist"), { values: vals, bins: 30, xLabel: `${vlabel(st.v)} (${u})`, yLabel: L("Patients", "المرضى"), bands: [{ from: s.q1, to: s.q3, cls: "c2" }],
        markers: [{ value: s.mean, label: `${L("mean", "المتوسط")} ${fmt(s.mean, 1)}`, cls: "c3", dash: true }, { value: s.median, label: `${L("median", "الوسيط")} ${fmt(s.median, 1)}`, cls: "c4" }] });
      const skewed = s.skewness > 0.5;
      root.querySelector("#ds-msg").innerHTML = `<ul>
        <li>${L(`A typical patient: median <strong>${fmt(s.median, 1)} ${u}</strong> (mean ${fmt(s.mean, 1)}).`, `المريض النموذجي: الوسيط <strong>${fmt(s.median, 1)} ${u}</strong> (المتوسط ${fmt(s.mean, 1)}).`)}</li>
        <li>${L(`The middle half of patients lies between <strong>${fmt(s.q1, 1)}</strong> and <strong>${fmt(s.q3, 1)}</strong>.`, `يقع النصف الأوسط من المرضى بين <strong>${fmt(s.q1, 1)}</strong> و<strong>${fmt(s.q3, 1)}</strong>.`)}</li>
        <li>${skewed ? L("The mean is above the median: a few very high values pull it up (right-skewed). The median describes the typical patient better.", "المتوسط أعلى من الوسيط: قيم مرتفعة قليلة تسحبه للأعلى (التواء لليمين). والوسيط يصف المريض النموذجي بشكل أفضل.") : L("Mean and median are close: the values are fairly balanced, so either describes the centre well.", "المتوسط والوسيط متقاربان: القيم متوازنة نسبيًا، فأيٌّ منهما يصف المركز جيدًا.")}</li></ul>`;
      const py = st.f === "all" ? SD().descriptive.overall[st.v] : null;
      root.querySelector("#ds-code-res").innerHTML = py ? `<span class="ltr">count ${py.n} · mean ${fmt(py.mean, 3)} · std ${fmt(py.std, 3)} · min ${py.min} · 25% ${py.q1} · 50% ${py.median} · 75% ${py.q3} · max ${py.max} · skew ${fmt(py.skewness, 3)}</span><br><span class="small muted">${L("Python gives exactly the same numbers as the live calculation above.", "تعطي بايثون الأرقام نفسها تمامًا كالحساب المباشر أعلاه.")}</span>` : `<span class="small muted">${L("Choose “All patients” to compare with the Python result.", "اختر «جميع المرضى» للمقارنة بنتيجة بايثون.")}</span>`;
    };
    draw();
    root.querySelector("#ds-var").addEventListener("change", e => { st.v = e.target.value; draw(); });
    root.querySelector("#ds-f").addEventListener("change", e => { st.f = e.target.value; draw(); });
  },
});

/* =====================================================================
   10 — Shape and spread (distribution & variability)
   ===================================================================== */
Lec.add({
  id: "distribution-variability", num: 10, aliases: ["distribution"],
  title: { en: "Shape and Spread of the Data", ar: "شكل البيانات وتشتتها" },
  short: { en: "Distribution & spread", ar: "التوزيع والتشتت" },
  summary: { en: "Histograms, box plots and unusual values.", ar: "المدرجات التكرارية والمخططات الصندوقية والقيم غير المعتادة." },
  render(root) {
    const st = getState("dist", { v: "fasting_glucose", bins: 30, sex: "all", smoking: "all" });
    root.innerHTML = lesson(this, {
      simple: L("A <strong>distribution</strong> shows how often each value occurs. Two simple pictures show it best: the <strong>histogram</strong> (bars) and the <strong>box plot</strong> (a box with whiskers).",
        "يُظهر <strong>التوزيع</strong> مدى تكرار كل قيمة. وأفضل صورتين بسيطتين لعرضه: <strong>المدرج التكراري</strong> (أعمدة) و<strong>المخطط الصندوقي</strong> (صندوق بشوارب)."),
      why: [L("The same average can hide very different patients.", "المتوسط نفسه قد يخفي مرضى مختلفين جدًا."), L("Charts reveal unusual values that need checking.", "تكشف الرسوم القيم غير المعتادة التي تحتاج إلى تحقق.")],
      steps: [
        { t: L("Group values into bins", "جمّع القيم في فئات"), d: L("A histogram counts how many patients fall into each range, e.g. 80–90, 90–100 mg/dL.", "يعدّ المدرج التكراري المرضى في كل نطاق، مثل 80–90 و90–100 ملغ/دل.") },
        { t: L("Read the shape", "اقرأ الشكل"), d: L("Symmetric like a bell, or with a long tail on one side (skewed)?", "متماثل كالجرس، أم بذيل طويل في جهة واحدة (ملتوٍ)؟") },
        { t: L("Draw a box plot", "ارسم مخططًا صندوقيًا"), d: L("The box holds the middle half of patients, the line is the median, the whiskers reach the usual range, and dots are unusual values.", "الصندوق يضم النصف الأوسط من المرضى، والخط هو الوسيط، والشوارب تمتد للنطاق المعتاد، والنقاط قيم غير معتادة.") },
        { t: L("Flag unusual values", "علّم القيم غير المعتادة"), d: L("A common rule: more than 1.5 × IQR beyond the box. These are checked — not automatically deleted.", "قاعدة شائعة: أبعد من 1.5 × المدى الربيعي خارج الصندوق. هذه تُراجع — ولا تُحذف تلقائيًا.") },
      ],
      seeTitle: L("Explore a distribution", "استكشف توزيعًا"),
      see: `<div class="controls">${selectEl("dv-var", varOptions(NUM_VARS), st.v, L("Measurement", "القياس"))}
          ${selectEl("dv-sex", [{ value: "all", label: L("All", "الكل") }, { value: "Female", label: levlabel("Female") }, { value: "Male", label: levlabel("Male") }], st.sex, glabel("sex"))}
          ${selectEl("dv-sm", [{ value: "all", label: L("All", "الكل") }, { value: "Non-Smoker", label: levlabel("Non-Smoker") }, { value: "Smoker", label: levlabel("Smoker") }], st.smoking, glabel("smoking_status"))}
          <div class="field"><label for="dv-bins">${L("Number of bars", "عدد الأعمدة")}</label><div class="range-row"><input type="range" id="dv-bins" min="5" max="60" value="${st.bins}"><output id="dv-bins-o">${st.bins}</output></div></div></div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s10-hist")}<div class="chart-title">${L("Histogram", "المدرج التكراري")}</div><div class="chart-sub">${L("Red dashed lines = limits for “unusual”", "الخطوط الحمراء المتقطعة = حدود «غير المعتاد»")}</div><div id="dv-hist"></div></div>
          <div class="chart-card">${codeChip("s10-box")}<div class="chart-title">${L("Box plot by teaching risk group", "مخطط صندوقي حسب مجموعة الخطورة التعليمية")}</div><div class="chart-sub">${L("Hover a box to see its numbers", "مرّر فوق الصندوق لرؤية أرقامه")}</div><div id="dv-box"></div></div></div>`,
      results: `<div id="dv-msg"></div>`,
      remember: L("Look at the shape before trusting an average. Unusual values are checked, not deleted.", "انظر إلى الشكل قبل الوثوق بالمتوسط. القيم غير المعتادة تُراجع ولا تُحذف."),
      quiz: { q: L("In a box plot, what does the box itself show?", "في المخطط الصندوقي، ماذا يُظهر الصندوق نفسه؟"), options: [
        { t: L("The middle half of the values (Q1 to Q3)", "النصف الأوسط من القيم (Q1 إلى Q3)"), ok: true, why: L("Its edges are the 25th and 75th percentiles.", "حافتاه هما المئينان 25 و75.") },
        { t: L("All the values", "كل القيم"), why: L("The whiskers and dots show the rest.", "الشوارب والنقاط تُظهر الباقي.") },
        { t: L("Only the unusual values", "القيم غير المعتادة فقط"), why: L("Unusual values are the dots outside the whiskers.", "القيم غير المعتادة هي النقاط خارج الشوارب.") }] },
    });
    const draw = () => {
      let rows = Data.clean();
      if (st.sex !== "all") rows = rows.filter(r => r.sex === st.sex);
      if (st.smoking !== "all") rows = rows.filter(r => r.smoking_status === st.smoking);
      const vals = Data.values(rows, st.v), s = Stats.describe(vals), fen = Stats.fences(vals), outs = vals.filter(v => v < fen.lo || v > fen.hi).length;
      Charts.histogram(root.querySelector("#dv-hist"), { values: vals, bins: st.bins, xLabel: `${vlabel(st.v)} (${vunit(st.v)})`, yLabel: L("Patients", "المرضى"),
        markers: [{ value: s.median, label: L("median", "الوسيط"), cls: "c4" }, { value: fen.hi, label: L("upper limit", "الحد الأعلى"), cls: "danger", dash: true }, ...(fen.lo > s.min ? [{ value: fen.lo, label: L("lower limit", "الحد الأدنى"), cls: "danger", dash: true }] : [])] });
      Charts.boxplot(root.querySelector("#dv-box"), { groups: ["Low", "Moderate", "High"].map((g, i) => ({ label: levlabel(g), values: Data.values(rows.filter(r => r.risk_group === g), st.v), cls: ["c2", "c3", "c4"][i] })), yLabel: `${vlabel(st.v)} (${vunit(st.v)})` });
      const shape = s.skewness > 0.5 ? L("has a long tail of high values (right-skewed)", "له ذيل طويل من القيم المرتفعة (ملتوٍ لليمين)") : s.skewness < -0.5 ? L("has a long tail of low values (left-skewed)", "له ذيل طويل من القيم المنخفضة (ملتوٍ لليسار)") : L("is fairly symmetric", "متماثل نسبيًا");
      const oc = Snip.distOutliers(st.v, st.sex, st.smoking, `${outs} / ${fmtInt(s.n)}`);
      setCode("s10-hist", Snip.distHist(st.v, st.sex, st.smoking, st.bins)); setCode("s10-box", Snip.distBox(st.v, st.sex, st.smoking));
      root.querySelector("#dv-msg").innerHTML = `<div class="stat-grid" style="margin-bottom:12px">${stat(L("Skewness", "الالتواء"), fmt(s.skewness, 2), "", oc)}${stat(L("Limits for “unusual”", "حدود «غير المعتاد»"), `${fmt(fen.lo, 1)} – ${fmt(fen.hi, 1)}`, "", oc)}${stat(L("Unusual values", "القيم غير المعتادة"), `${outs} / ${fmtInt(s.n)}`, "", oc)}</div><ul><li>${L(`The distribution ${shape} (skewness ${fmt(s.skewness, 2)}).`, `التوزيع ${shape} (الالتواء ${fmt(s.skewness, 2)}).`)}</li>
        <li>${L(`Values outside <strong>${fmt(fen.lo, 1)} – ${fmt(fen.hi, 1)}</strong> count as unusual: <strong>${outs}</strong> of ${fmtInt(s.n)} patients (${fmt(100 * outs / s.n, 1)}%).`, `القيم خارج <strong>${fmt(fen.lo, 1)} – ${fmt(fen.hi, 1)}</strong> تُعدّ غير معتادة: <strong>${outs}</strong> من ${fmtInt(s.n)} مريضًا (${fmt(100 * outs / s.n, 1)}%).`)}</li>
        <li>${L("In the box plot, compare the boxes: higher boxes mean higher typical values in that group.", "في المخطط الصندوقي قارن الصناديق: الصندوق الأعلى يعني قيمًا نموذجية أعلى في تلك المجموعة.")}</li></ul>`;
    };
    draw();
    root.querySelector("#dv-var").addEventListener("change", e => { st.v = e.target.value; draw(); });
    root.querySelector("#dv-sex").addEventListener("change", e => { st.sex = e.target.value; draw(); });
    root.querySelector("#dv-sm").addEventListener("change", e => { st.smoking = e.target.value; draw(); });
    root.querySelector("#dv-bins").addEventListener("input", e => { st.bins = +e.target.value; root.querySelector("#dv-bins-o").textContent = st.bins; draw(); });
  },
});

/* =====================================================================
   11 — Exploring the data (EDA)
   ===================================================================== */
Lec.add({
  id: "eda", num: 11, aliases: ["exploratory-data-analysis"],
  title: { en: "Exploring the Data (EDA)", ar: "استكشاف البيانات" },
  short: { en: "Exploring the data", ar: "استكشاف البيانات" },
  summary: { en: "Compare groups and look for patterns — then write down questions.", ar: "قارن المجموعات وابحث عن الأنماط — ثم دوّن الأسئلة." },
  render(root) {
    const st = getState("eda", { v: "hba1c", g: "risk_group", c: "box" });
    const counts = SD().eda.counts;
    root.innerHTML = lesson(this, {
      simple: L("Exploratory data analysis (EDA) is structured curiosity: look at each measurement, compare groups, and note what is interesting. It produces <strong>questions</strong> to test — not final answers.",
        "التحليل الاستكشافي للبيانات فضول منظَّم: انظر إلى كل قياس، وقارن المجموعات، ودوّن ما هو لافت. إنه يُنتج <strong>أسئلة</strong> للاختبار — لا إجابات نهائية."),
      why: [L("You find problems and patterns before building anything.", "تكتشف المشكلات والأنماط قبل بناء أي شيء."), L("Good questions for later testing come from here.", "الأسئلة الجيدة للاختبار لاحقًا تأتي من هنا.")],
      steps: [
        { t: L("Look at one measurement at a time", "انظر إلى قياس واحد في كل مرة"), d: L("Shape, centre, spread (Sections 09–10).", "الشكل والمركز والتشتت (القسمان 09–10).") },
        { t: L("Count the categories", "عُدّ الفئات"), d: L("How many patients per group, clinic, sex?", "كم مريضًا في كل مجموعة وعيادة وجنس؟"), ex: L(`${counts.risk_group.Low} Low · ${counts.risk_group.Moderate} Moderate · ${counts.risk_group.High} High`, `${counts.risk_group.Low} منخفضة · ${counts.risk_group.Moderate} متوسطة · ${counts.risk_group.High} مرتفعة`) },
        { t: L("Compare groups", "قارن المجموعات"), d: L("Does a measurement differ between groups? Always note how many patients are in each group.", "هل يختلف قياس ما بين المجموعات؟ دوّن دائمًا عدد المرضى في كل مجموعة.") },
        { t: L("Write down questions", "دوّن الأسئلة"), d: L("“HbA1c looks higher in the High group — is that real?” → test it in Section 13.", "«يبدو HbA1c أعلى في المجموعة المرتفعة — هل هذا حقيقي؟» ← اختبره في القسم 13.") },
      ],
      seeTitle: L("Build your own view", "ابنِ عرضك الخاص"),
      see: `<div class="controls">${selectEl("eda-v", varOptions(["age", "bmi", "fasting_glucose", "hba1c", "total_cholesterol", "systolic_bp", "heart_rate", "medication_adherence_pct"]), st.v, L("Measurement", "القياس"))}
          ${selectEl("eda-g", ["none", "risk_group", "sex", "smoking_status", "clinic_id", "age_group"].map(g => ({ value: g, label: glabel(g) })), st.g, L("Compare by", "قارن حسب"))}
          <div class="field"><span class="field-label">${L("Chart", "الرسم")}</span>${segmented("eda-c", [{ value: "hist", label: L("Histogram", "مدرج تكراري") }, { value: "box", label: L("Box plot", "مخطط صندوقي") }, { value: "mean", label: L("Average with range", "المتوسط مع النطاق") }], st.c)}</div></div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s11-chart")}<div class="chart-title" id="eda-title"></div><div id="eda-chart"></div><div id="eda-legend"></div></div><div class="card" id="eda-table"></div></div>`,
      results: `<div id="eda-msg"></div>`,
      remember: L("EDA finds questions. Testing (Section 13) decides whether the answers are real.", "الاستكشاف يجد الأسئلة. والاختبار (القسم 13) يحدد ما إذا كانت الإجابات حقيقية."),
    });
    const draw = () => {
      const rows = Data.clean(), v = st.v, g = st.g, levels = g === "none" ? [null] : Data.levels(rows, g);
      const parts = levels.map((lv, i) => ({ label: lv === null ? L("All patients", "جميع المرضى") : levlabel(lv), values: Data.values(lv === null ? rows : rows.filter(r => String(r[g]) === String(lv)), v), cls: `c${(i % 6) + 1}` })).filter(p => p.values.length);
      root.querySelector("#eda-title").textContent = `${vlabel(v)} — ${glabel(g)}`;
      const el = root.querySelector("#eda-chart");
      setCode("s11-chart", Snip.edaChart(v, g, st.c)); setCode("s11-table", Snip.edaTable(v, g));
      if (st.c === "hist") Charts.histogram(el, { series: parts.map(p => ({ values: p.values, cls: p.cls, name: p.label })), bins: 30, xLabel: `${vlabel(v)} (${vunit(v)})`, yLabel: L("Patients", "المرضى") });
      else if (st.c === "box") Charts.boxplot(el, { groups: parts, yLabel: `${vlabel(v)} (${vunit(v)})` });
      else Charts.intervals(el, { items: parts.map(p => { const ci = Stats.meanCI(p.values); return { label: p.label, lo: ci.lo, mid: ci.mean, hi: ci.hi, cls: p.cls }; }), rowHeight: 34, xLabel: `${L("Average", "المتوسط")} ${vlabel(v)}` });
      root.querySelector("#eda-legend").innerHTML = st.c === "hist" && parts.length > 1 ? Charts.legend(parts.map(p => ({ cls: p.cls, label: p.label }))) : "";
      const sums = parts.map(p => ({ ...p, s: Stats.describe(p.values) }));
      root.querySelector("#eda-table").innerHTML = `${codeChip("s11-table")}<h3>${L("Summary per group", "ملخص لكل مجموعة")}</h3>${miniTable([glabel(g), { t: "n", num: true }, { t: L("Average", "المتوسط"), num: true }, { t: L("Median", "الوسيط"), num: true }], sums.map(p => [esc(p.label), p.s.n, fmt(p.s.mean, 2), fmt(p.s.median, 2)]))}`;
      const hi = sums.reduce((a, b) => (b.s.median > a.s.median ? b : a)), lo = sums.reduce((a, b) => (b.s.median < a.s.median ? b : a));
      root.querySelector("#eda-msg").innerHTML = sums.length > 1
        ? `<p class="mb-0">${L(`The typical (median) ${vlabel(v)} is highest in <strong>${hi.label}</strong> (${fmt(hi.s.median, 1)}) and lowest in <strong>${lo.label}</strong> (${fmt(lo.s.median, 1)}). That is a question worth testing — not yet a conclusion.`, `${vlabel(v)} النموذجي (الوسيط) هو الأعلى في <strong>${hi.label}</strong> (${fmt(hi.s.median, 1)}) والأدنى في <strong>${lo.label}</strong> (${fmt(lo.s.median, 1)}). هذا سؤال يستحق الاختبار — وليس استنتاجًا بعد.`)}</p>`
        : `<p class="mb-0">${L("Choose a “Compare by” option to see differences between groups.", "اختر خيارًا في «قارن حسب» لرؤية الفروق بين المجموعات.")}</p>`;
    };
    draw();
    root.querySelector("#eda-v").addEventListener("change", e => { st.v = e.target.value; draw(); });
    root.querySelector("#eda-g").addEventListener("change", e => { st.g = e.target.value; draw(); });
    bindSeg(root, "eda-c", v => { st.c = v; draw(); });
  },
});

/* =====================================================================
   12 — Relationships (correlation)
   ===================================================================== */
Lec.add({
  id: "correlation", num: 12, aliases: ["correlation-relationships"],
  title: { en: "Relationships Between Measurements (Correlation)", ar: "العلاقات بين القياسات (الارتباط)" },
  short: { en: "Correlation", ar: "الارتباط" },
  summary: { en: "Do two measurements move together? (And why that isn't proof.)", ar: "هل يتحرك قياسان معًا؟ (ولماذا ليس ذلك دليلًا.)" },
  render(root) {
    const C = SD().correlation, vars = C.variables;
    const st = getState("corr", { method: "pearson", i: vars.indexOf("bmi"), j: vars.indexOf("fasting_glucose") });
    const short = v => ({ exercise_days_per_week: L("exercise", "الرياضة"), medication_adherence_pct: L("adherence", "الالتزام"), visits_last_year: L("visits", "الزيارات"), total_cholesterol: L("cholesterol", "الكوليسترول"), fasting_glucose: L("glucose", "السكر"), systolic_bp: L("systolic BP", "الانقباضي"), diastolic_bp: L("diastolic BP", "الانبساطي"), heart_rate: L("heart rate", "النبض"), risk_score: L("risk score", "درجة الخطورة") }[v] || vlabel(v));
    const presets = [["bmi", "fasting_glucose", L("BMI & glucose", "BMI والسكر")], ["hba1c", "fasting_glucose", L("HbA1c & glucose", "HbA1c والسكر")], ["age", "systolic_bp", L("Age & blood pressure", "العمر وضغط الدم")], ["exercise_days_per_week", "heart_rate", L("Exercise & heart rate", "الرياضة والنبض")]];
    root.innerHTML = lesson(this, {
      simple: L("Correlation is a number between <strong>−1 and +1</strong> that says how strongly two measurements move together. +1 = rise together perfectly, 0 = no pattern, −1 = one rises while the other falls.",
        "الارتباط رقم بين <strong>−1 و+1</strong> يبيّن مدى قوة تحرك قياسين معًا. ‏+1 = يرتفعان معًا تمامًا، 0 = لا نمط، −1 = أحدهما يرتفع والآخر ينخفض."),
      why: [L("It shows which measurements are linked — useful for understanding and for models.", "يُظهر أي القياسات مترابطة — وهذا مفيد للفهم وللنماذج."), L("It is also the most misused number: correlation does not prove cause.", "وهو أيضًا الرقم الأكثر سوء استخدام: الارتباط لا يُثبت السبب.")],
      steps: [
        { t: L("Plot the two measurements", "ارسم القياسين"), d: L("Each dot is one patient (a scatter plot).", "كل نقطة مريض واحد (مخطط انتشار).") },
        { t: L("Measure direction and strength (Pearson r)", "قِس الاتجاه والقوة (بيرسون r)"), d: L("Around 0.1 weak, 0.3 moderate, 0.5+ strong.", "نحو 0.1 ضعيف، و0.3 متوسط، و0.5 فأكثر قوي.") },
        { t: L("Double-check with ranks (Spearman ρ)", "تحقق مرة أخرى بالرتب (سبيرمان ρ)"), d: L("Works on the order of values, so a few extreme values matter less.", "يعمل على ترتيب القيم، فتقل أهمية القيم المتطرفة القليلة.") },
        { t: L("Think about causes — carefully", "فكّر في الأسباب — بحذر"), d: L("A third factor (like age) may drive both, or the direction may be reversed. Correlation alone is never proof.", "قد يقود عامل ثالث (مثل العمر) الاثنين، أو قد يكون الاتجاه معكوسًا. الارتباط وحده ليس دليلًا أبدًا.") },
      ],
      seeTitle: L("Explore the relationships", "استكشف العلاقات"),
      seeNote: L("Click any square of the table to plot that pair. Darker blue = stronger positive, darker red = stronger negative.", "انقر أي مربع في الجدول لرسم ذلك الزوج. الأزرق الأغمق = موجب أقوى، والأحمر الأغمق = سالب أقوى."),
      see: `<div class="row" style="margin-bottom:10px">${segmented("cm-m", [{ value: "pearson", label: "Pearson r" }, { value: "spearman", label: "Spearman ρ" }], st.method)}</div>
        <div class="chart-card" style="overflow-x:auto">${codeChip("s12-heat")}<div id="cm-heat"></div></div>
        <div class="controls mt-2"><div class="field"><span class="field-label">${L("Quick examples", "أمثلة سريعة")}</span><div class="row">${presets.map(([a, b, lb]) => `<button type="button" class="btn btn-sm" data-preset="${a}|${b}">${lb}</button>`).join("")}</div></div></div>
        <div class="chart-card mt-2">${codeChip("s12-sc")}<div class="chart-title" id="cm-title"></div><div id="cm-scatter"></div></div>`,
      results: `<div id="cm-msg"></div>`,
      remember: L("Correlation shows that two things move together — never, by itself, that one causes the other.", "يُظهر الارتباط أن شيئين يتحركان معًا — ولا يُثبت وحده أبدًا أن أحدهما يسبب الآخر."),
      quiz: { q: L("Ice-cream sales and sunburn are correlated. Why?", "مبيعات المثلجات وحروق الشمس مرتبطتان. لماذا؟"), options: [
        { t: L("Hot sunny weather drives both — a third factor", "الطقس الحار المشمس يقود الاثنين — عامل ثالث"), ok: true, why: L("This is called confounding — the same trap exists in health data.", "يُسمى هذا عاملًا مُربِكًا — والفخ نفسه موجود في البيانات الصحية.") },
        { t: L("Ice-cream causes sunburn", "المثلجات تسبب حروق الشمس"), why: L("A correlation is not a cause.", "الارتباط ليس سببًا.") }] },
    });
    const drawHeat = () => { setCode("s12-heat", Snip.corrMatrix(st.method, vars)); Charts.heatmap(root.querySelector("#cm-heat"), { matrix: st.method === "pearson" ? C.pearson : C.spearman, xLabels: vars.map(short), yLabels: vars.map(short), format: v => v.toFixed(2), clickable: true, selected: [st.i, st.j], maxCell: 56, labelWidth: 110,
      cellLabel: (v, i, j) => `${vars[i]} × ${vars[j]}: ${v.toFixed(2)}`, onClick: (i, j) => { st.i = i; st.j = j; drawHeat(); drawScatter(); } }); };
    const drawScatter = () => {
      const a = vars[st.i], b = vars[st.j], [xs, ys] = Stats.pairs(Data.clean(), a, b);
      root.querySelector("#cm-title").textContent = `${vlabel(a)} × ${vlabel(b)}`;
      Charts.scatter(root.querySelector("#cm-scatter"), { points: xs.map((x, k) => ({ x, y: ys[k] })), xLabel: `${vlabel(a)} (${vunit(a)})`, yLabel: `${vlabel(b)} (${vunit(b)})`, trend: a !== b, opacity: .45 });
      const r = Stats.pearson(xs, ys), rho = Stats.spearman(xs, ys);
      const pc = Snip.corrPair(a, b, `n = ${fmtInt(xs.length)} · r = ${fmt(r, 2)} · ρ = ${fmt(rho, 2)}`); setCode("s12-sc", pc);
      const strength = Math.abs(r) < 0.1 ? L("almost no", "شبه معدوم") : Math.abs(r) < 0.3 ? L("a weak", "ضعيف") : Math.abs(r) < 0.5 ? L("a moderate", "متوسط") : L("a strong", "قوي");
      root.querySelector("#cm-msg").innerHTML = `<div class="stat-grid">${stat(L("Patients (pairs)", "المرضى (أزواج)"), fmtInt(xs.length), "", pc)}${stat("Pearson r", fmt(r, 2), "", pc)}${stat("Spearman ρ", fmt(rho, 2), "", pc)}</div>
        <p class="mt-2 mb-0">${a === b ? L("A measurement is always perfectly correlated with itself (1.00). Pick another square.", "القياس مرتبط دائمًا بنفسه تمامًا (1.00). اختر مربعًا آخر.") : L(`There is ${strength} ${r >= 0 ? "positive" : "negative"} relationship: patients with higher ${vlabel(a)} tend to have ${r >= 0 ? "higher" : "lower"} ${vlabel(b)}. This describes our data — it does not show that one causes the other.`, `هناك ارتباط ${r >= 0 ? "موجب" : "سالب"} ${strength}: يميل المرضى ذوو ${vlabel(a)} الأعلى إلى ${vlabel(b)} ${r >= 0 ? "أعلى" : "أدنى"}. هذا يصف بياناتنا — ولا يُثبت أن أحدهما يسبب الآخر.`)}</p>
        ${a !== b && Math.abs(rho - r) > 0.1 ? `<p class="small muted mt-1 mb-0">${L("Spearman is clearly higher than Pearson: a few extreme values weaken the straight-line measure, while the overall ordering is more consistent.", "سبيرمان أعلى من بيرسون بوضوح: قيم متطرفة قليلة تُضعف مقياس الخط المستقيم، بينما الترتيب العام أكثر اتساقًا.")}</p>` : ""}`;
    };
    drawHeat(); drawScatter();
    bindSeg(root, "cm-m", v => { st.method = v; drawHeat(); });
    root.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => { const [a, c] = b.dataset.preset.split("|"); st.i = vars.indexOf(a); st.j = vars.indexOf(c); drawHeat(); drawScatter(); }));
  },
});

/* =====================================================================
   13 — Is the difference real? (hypothesis testing)
   ===================================================================== */
Lec.add({
  id: "hypothesis-testing", num: 13, aliases: ["hypothesis"],
  title: { en: "Is the Difference Real? (Hypothesis Testing)", ar: "هل الفرق حقيقي؟ (اختبار الفرضيات)" },
  short: { en: "Hypothesis testing", ar: "اختبار الفرضيات" },
  summary: { en: "Separating real differences from chance — step by step.", ar: "التمييز بين الفروق الحقيقية والصدفة — خطوة بخطوة." },
  render(root) {
    const st = getState("hyp", { v: "heart_rate", g: "smoking_status" });
    const G = SD().hypothesis.glucose_smoking;
    const groupsDef = { smoking_status: ["Non-Smoker", "Smoker"], sex: ["Female", "Male"], family_history_flag: [0, 1] };
    root.innerHTML = lesson(this, {
      simple: L("Two groups will almost always have slightly different averages just by chance. A hypothesis test asks: <strong>if there were really no difference, how surprising would our data be?</strong> The answer is the <strong>p-value</strong>.",
        "تكاد مجموعتان تختلفان دائمًا قليلًا في المتوسط بمحض الصدفة. يسأل اختبار الفرضية: <strong>لو لم يكن هناك فرق حقيقي، فكم ستكون بياناتنا مفاجئة؟</strong> والإجابة هي <strong>قيمة p</strong>."),
      why: [L("It stops us from reacting to random noise.", "يمنعنا من التفاعل مع الضجيج العشوائي."), L("It is how “is this difference real?” gets a disciplined answer.", "هكذا يحصل سؤال «هل هذا الفرق حقيقي؟» على إجابة منضبطة.")],
      steps: [
        { t: L("Ask a clear question", "اطرح سؤالًا واضحًا"), d: L("Do smokers and non-smokers differ in average heart rate?", "هل يختلف متوسط النبض بين المدخنين وغير المدخنين؟") },
        { t: L("Assume “no difference” first", "افترض «لا فرق» أولًا"), d: L("This starting assumption is called the null hypothesis (H₀).", "يُسمى هذا الافتراض الأولي الفرضية الصفرية (H₀).") },
        { t: L("Choose how strict to be", "اختر درجة الصرامة"), d: L("Usually 5% (α = 0.05): we accept a 1-in-20 risk of a false alarm.", "عادة 5% (α = 0.05): نقبل خطر إنذار كاذب واحد من كل 20.") },
        { t: L("Run a suitable test", "أجرِ اختبارًا مناسبًا"), d: L("For two group averages: Welch's t-test. For skewed data, also a rank test (Mann–Whitney).", "لمتوسطي مجموعتين: اختبار ويلش t. وللبيانات الملتوية أيضًا اختبار رتب (مان-ويتني).") },
        { t: L("Read the p-value", "اقرأ قيمة p"), d: L("p below 0.05 → the difference is unlikely to be chance alone. p above 0.05 → not enough evidence (which is NOT proof of “no difference”).", "p أقل من 0.05 ← من غير المرجح أن يكون الفرق صدفة فقط. ‏p أعلى من 0.05 ← لا دليل كافٍ (وهذا ليس دليلًا على «عدم وجود فرق»).") },
        { t: L("Report the size of the difference", "اعرض حجم الفرق"), d: L("A tiny difference can be “significant” in big data. Always say how big it is and whether it matters.", "قد يكون فرق صغير جدًا «دالًا» في البيانات الكبيرة. قل دائمًا كم هو كبير وهل يهم.") },
      ],
      seeTitle: L("Run a test yourself", "أجرِ اختبارًا بنفسك"),
      see: `<div class="controls">${selectEl("ht-v", varOptions(["heart_rate", "fasting_glucose", "systolic_bp", "bmi", "hba1c", "total_cholesterol", "age"]), st.v, L("Measurement", "القياس"))}
          ${selectEl("ht-g", Object.keys(groupsDef).map(g => ({ value: g, label: `${groupsDef[g].map(levlabel).join(" vs ")}` })), st.g, L("Compare", "قارن"))}</div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s13-box")}<div class="chart-title">${L("The two groups", "المجموعتان")}</div><div id="ht-box"></div></div><div class="card" id="ht-res" aria-live="polite"></div></div>`,
      results: `<div id="ht-msg"></div>
        ${callout("warn", L("A real example where two tests disagree", "مثال حقيقي يختلف فيه اختباران"), `<p class="mb-0">${L(`Glucose, smokers vs non-smokers: Welch's test (averages) gives p = ${fmtP(G.welch_p)} — not significant. The rank test gives p = ${fmtP(G.mann_whitney_p)} — significant. Why? A few extremely high glucose values make averages very noisy, while the rank test only looks at the ordering (medians ${fmt(G.median_a, 0)} vs ${fmt(G.median_b, 0)}). Decide which question you care about <strong>before</strong> testing — and note the difference is very small either way.`,
          `السكر لدى المدخنين مقابل غير المدخنين: اختبار ويلش (المتوسطات) يعطي p = ${fmtP(G.welch_p)} — غير دال. واختبار الرتب يعطي p = ${fmtP(G.mann_whitney_p)} — دال. لماذا؟ قيم سكر مرتفعة جدًا قليلة تجعل المتوسطات شديدة الضجيج، بينما ينظر اختبار الرتب إلى الترتيب فقط (الوسيطان ${fmt(G.median_a, 0)} مقابل ${fmt(G.median_b, 0)}). قرّر أي سؤال يهمك <strong>قبل</strong> الاختبار — ولاحظ أن الفرق صغير جدًا في الحالتين.`)}</p>`)}`,
      code: { code: `from scipy.stats import ttest_ind, mannwhitneyu

smokers     = df.loc[df["smoking_status"] == "Smoker", "fasting_glucose"].dropna()
non_smokers = df.loc[df["smoking_status"] == "Non-Smoker", "fasting_glucose"].dropna()

ttest_ind(non_smokers, smokers, equal_var=False)   # Welch's t-test (averages)
mannwhitneyu(non_smokers, smokers)                  # rank-based check`,
        result: `<span class="ltr">Welch: t = ${fmt(G.welch_t, 3)}, p = ${fmt(G.welch_p, 4)} · Mann–Whitney: p = ${fmt(G.mann_whitney_p, 4)}</span><br><span class="small muted">${L("The live test above uses the same formulas and gives the same numbers.", "يستخدم الاختبار المباشر أعلاه الصيغ نفسها ويعطي الأرقام نفسها.")}</span>` },
      remember: L("p < 0.05 means “unlikely to be chance” — not “important”, and not “proven”. Always report how big the difference is.", "p < 0.05 تعني «غير مرجح أن يكون صدفة» — لا «مهم» ولا «مُثبت». اعرض دائمًا حجم الفرق."),
      quiz: { q: L("A test gives p = 0.30. What can we say?", "أعطى اختبار p = 0.30. ماذا يمكننا أن نقول؟"), options: [
        { t: L("There is not enough evidence of a difference", "لا يوجد دليل كافٍ على وجود فرق"), ok: true, why: L("Correct — and that is different from proving there is no difference.", "صحيح — وهذا يختلف عن إثبات عدم وجود فرق.") },
        { t: L("The groups are definitely the same", "المجموعتان متطابقتان بالتأكيد"), why: L("A large p-value is not proof of “no difference”.", "قيمة p الكبيرة ليست دليلًا على «عدم وجود فرق».") },
        { t: L("There is a 30% chance the groups are the same", "هناك احتمال 30% أن المجموعتين متطابقتان"), why: L("A common misreading: p is calculated assuming no difference, so it cannot be the chance of no difference.", "قراءة خاطئة شائعة: تُحسب p بافتراض عدم وجود فرق، فلا يمكن أن تكون احتمال عدم وجود فرق.") }] },
    });
    const draw = () => {
      const [la, lb] = groupsDef[st.g], rows = Data.clean(), u = vunit(st.v);
      const a = Data.values(rows.filter(r => String(r[st.g]) === String(la)), st.v), b = Data.values(rows.filter(r => String(r[st.g]) === String(lb)), st.v);
      const w = Stats.welch(a, b), mw = Stats.mannWhitney(a, b), sig = w.p < 0.05;
      setCode("s13-box", Snip.htBox(st.v, st.g, la, lb));
      setCode("s13-test", Snip.htTest(st.v, st.g, la, lb, `p (Welch) = ${fmtP(w.p)} · p (Mann–Whitney) = ${fmtP(mw.p)} · g = ${fmt(w.g, 2)}`));
      Charts.boxplot(root.querySelector("#ht-box"), { groups: [{ label: levlabel(la), values: a, cls: "c1" }, { label: levlabel(lb), values: b, cls: "c4" }], yLabel: `${vlabel(st.v)} (${u})`, height: 270 });
      root.querySelector("#ht-res").innerHTML = codeChip("s13-test") + miniTable(["", { t: "", num: true }], [
        [L("Patients", "المرضى"), `${w.na} / ${w.nb}`], [L("Averages", "المتوسطات"), `${fmt(w.ma, 1)} / ${fmt(w.mb, 1)} ${u}`],
        [L("Difference", "الفرق"), `${fmt(w.diff, 2)} ${u}`], [L("Likely range of the difference (95%)", "النطاق المرجح للفرق (95%)"), `${fmt(w.lo, 2)} … ${fmt(w.hi, 2)}`],
        ["p (Welch)", `<strong>${fmtP(w.p)}</strong>`], ["p (Mann–Whitney)", fmtP(mw.p)], [L("Size of the difference", "حجم الفرق"), `${effectWord(w.g)} (g = ${fmt(w.g, 2)})`]]) +
        `<div class="verdict ${sig ? "yes" : "no"} mt-2">${sig ? L("Unlikely to be chance alone (p < 0.05).", "من غير المرجح أن يكون صدفة فقط (p < 0.05).") : L("Not enough evidence of a difference (p ≥ 0.05).", "لا يوجد دليل كافٍ على فرق (p ≥ 0.05).")}</div>`;
      root.querySelector("#ht-msg").innerHTML = `<p>${sig ? L(`${levlabel(lb)} patients have a ${w.diff > 0 ? "higher" : "lower"} average ${vlabel(st.v)} by about <strong>${fmt(Math.abs(w.diff), 1)} ${u}</strong>. The difference is unlikely to be chance, and its size is <strong>${effectWord(w.g)}</strong>. Remember: this is an association in observational data, not proof of a cause.`, `لدى ${levlabel(lb)} متوسط ${vlabel(st.v)} ${w.diff > 0 ? "أعلى" : "أدنى"} بنحو <strong>${fmt(Math.abs(w.diff), 1)} ${u}</strong>. من غير المرجح أن يكون الفرق صدفة، وحجمه <strong>${effectWord(w.g)}</strong>. تذكّر: هذا ارتباط في بيانات رصدية وليس دليلًا على سبب.`)
        : L(`The averages differ by ${fmt(Math.abs(w.diff), 1)} ${u}, but a difference this size could easily happen by chance. We cannot say the groups differ — but we also have not shown they are the same.`, `يختلف المتوسطان بمقدار ${fmt(Math.abs(w.diff), 1)} ${u}، لكن فرقًا بهذا الحجم قد يحدث بسهولة بالصدفة. لا يمكننا القول إن المجموعتين تختلفان — لكننا لم نُثبت أيضًا أنهما متماثلتان.`)}</p>`;
    };
    draw();
    root.querySelector("#ht-v").addEventListener("change", e => { st.v = e.target.value; draw(); });
    root.querySelector("#ht-g").addEventListener("change", e => { st.g = e.target.value; draw(); });
  },
});

/* =====================================================================
   14 — How sure are we? (confidence intervals)
   ===================================================================== */
Lec.add({
  id: "confidence-intervals", num: 14, aliases: ["ci"],
  title: { en: "How Sure Are We? (Confidence Intervals)", ar: "ما مدى تأكدنا؟ (فترات الثقة)" },
  short: { en: "Confidence intervals", ar: "فترات الثقة" },
  summary: { en: "A range instead of a single number — and what “95%” really means.", ar: "نطاق بدلًا من رقم واحد — وماذا تعني «95%» فعلًا." },
  render(root) {
    const CI = SD().ci, st = getState("ci", { v: "systolic_bp", n: 30, k: 50, seed: 1 });
    const g = CI.overall.fasting_glucose["0.95"];
    root.innerHTML = lesson(this, {
      simple: L("Our patients are only a sample. A different sample would give a slightly different average. A <strong>confidence interval</strong> gives a range of plausible values instead of one number — for example: average glucose ≈ 97 mg/dL, <strong>somewhere between 95 and 99</strong>.",
        "مرضانا مجرد عينة. وعينة مختلفة ستعطي متوسطًا مختلفًا قليلًا. تعطي <strong>فترة الثقة</strong> نطاقًا من القيم المعقولة بدلًا من رقم واحد — مثلًا: متوسط السكر ≈ 97 ملغ/دل، <strong>في مكان ما بين 95 و99</strong>."),
      why: [L("One number hides how precise it is.", "الرقم الواحد يخفي مدى دقته."), L("A wide range honestly says: we need more data.", "النطاق الواسع يقول بصدق: نحتاج إلى بيانات أكثر.")],
      steps: [
        { t: L("Calculate the average", "احسب المتوسط"), d: L("This is our best single guess.", "هذا أفضل تخمين منفرد لدينا."), ex: L(`average glucose = ${fmt(g.mean, 2)} mg/dL`, `متوسط السكر = ${fmt(g.mean, 2)} ملغ/دل`) },
        { t: L("Measure how much it could wobble", "قِس مقدار تذبذبه المحتمل"), d: L("The “standard error” = spread ÷ √(number of patients). More patients → less wobble.", "«الخطأ المعياري» = التشتت ÷ √(عدد المرضى). مرضى أكثر ← تذبذب أقل."), ex: `${fmt(g.sd, 2)} ÷ √${fmtInt(g.n)} = ${fmt(g.se, 3)}` },
        { t: L("Build the range", "ابنِ النطاق"), d: L("Average ± about 2 standard errors gives a 95% interval.", "المتوسط ± نحو خطأين معياريين يعطي فترة 95%."), ex: `${fmt(g.mean, 2)} ± ${fmt(g.t_crit, 2)} × ${fmt(g.se, 3)} = [${fmt(g.lower, 2)}, ${fmt(g.upper, 2)}]` },
        { t: L("Say it correctly", "قلها بشكل صحيح"), d: L("“95%” describes the method: if we repeated the study many times, about 95 out of 100 such ranges would contain the true value. See it happen below.", "«95%» تصف الطريقة: لو كررنا الدراسة مرات كثيرة لاحتوت نحو 95 من كل 100 نطاق القيمة الحقيقية. شاهد ذلك يحدث أدناه.") },
      ],
      seeTitle: L("See what “95%” means: repeat the study many times", "شاهد معنى «95%»: كرّر الدراسة مرات كثيرة"),
      seeNote: L("We treat all our patients as the “whole population”, so we know the true average. Then we take many small random samples and build a 95% range from each. Green ranges contain the true average; red ones miss it.",
        "نعامل كل مرضانا على أنهم «المجتمع كله»، فنعرف المتوسط الحقيقي. ثم نسحب عينات عشوائية صغيرة كثيرة ونبني نطاق 95% من كل واحدة. النطاقات الخضراء تحتوي المتوسط الحقيقي، والحمراء تخطئه."),
      see: `<div class="controls">${selectEl("sim-v", varOptions(["systolic_bp", "bmi", "age", "fasting_glucose"]), st.v, L("Measurement", "القياس"))}
          <div class="field"><label for="sim-n">${L("Patients per sample", "المرضى في كل عينة")}</label><div class="range-row"><input type="range" id="sim-n" min="10" max="200" step="5" value="${st.n}"><output id="sim-n-o">${st.n}</output></div></div>
          <div class="field"><span class="field-label">${L("Number of samples", "عدد العينات")}</span>${segmented("sim-k", [{ value: 20, label: "20" }, { value: 50, label: "50" }, { value: 100, label: "100" }], st.k)}</div>
          <button type="button" class="btn btn-primary" id="sim-go">${ICON.play} ${L("Draw new samples", "اسحب عينات جديدة")}</button></div>
        <div class="grid grid-2 mt-2"><div class="chart-card">${codeChip("s14-sim")}<div class="chart-sub">${L("Dashed line = true average", "الخط المتقطع = المتوسط الحقيقي")}</div><div id="sim-chart"></div></div><div class="card" id="sim-res" aria-live="polite"></div></div>`,
      results: `<ul><li>${L("Each sample gives a different range — that is sampling variability.", "كل عينة تعطي نطاقًا مختلفًا — هذا هو تباين المعاينة.")}</li>
        <li>${L("Roughly 95% of the ranges catch the true value. Any single range either does or doesn't — we just don't know which.", "نحو 95% من النطاقات تلتقط القيمة الحقيقية. وأي نطاق منفرد إما يلتقطها أو لا — لكننا لا نعرف أيهما.")}</li>
        <li>${L("Increase “patients per sample” and the ranges get narrower: more data, more precision.", "زِد «المرضى في كل عينة» فتضيق النطاقات: بيانات أكثر، دقة أكثر.")}</li></ul>`,
      remember: L("Report a range, not just a number: “97 mg/dL (95% CI 95–99)”.", "اعرض نطاقًا لا رقمًا فقط: «97 ملغ/دل (فترة ثقة 95%: 95–99)»."),
      quiz: { q: L("How do you make a confidence interval narrower?", "كيف تجعل فترة الثقة أضيق؟"), options: [
        { t: L("Collect data from more patients", "جمع بيانات من مرضى أكثر"), ok: true, why: L("The standard error shrinks as the sample grows.", "يتقلص الخطأ المعياري كلما كبرت العينة.") },
        { t: L("Use 99% instead of 95%", "استخدام 99% بدلًا من 95%"), why: L("Higher confidence makes the interval wider, not narrower.", "الثقة الأعلى تجعل الفترة أوسع لا أضيق.") }] },
    });
    const draw = () => {
      const pop = Data.values(Data.clean(), st.v), mu = Stats.mean(pop), rand = Stats.rng(1000 + st.seed * 7919);
      const items = []; let hits = 0;
      for (let i = 0; i < st.k; i++) { const c = Stats.meanCI(Stats.sampleWithoutReplacement(pop, st.n, rand)), hit = c.lo <= mu && mu <= c.hi; hits += hit; items.push({ label: "", lo: c.lo, mid: c.mean, hi: c.hi, cls: hit ? "c2" : "danger" }); }
      Charts.intervals(root.querySelector("#sim-chart"), { items, ref: mu, rowHeight: st.k > 50 ? 5 : st.k > 20 ? 8 : 14, labelWidth: 8, xLabel: `${vlabel(st.v)} (${vunit(st.v)})` });
      const sc = Snip.ciSim(st.v, st.n, st.k, `${hits} / ${st.k} ${L("ranges in this browser draw", "نطاقًا في سحب المتصفح هذا")}`); setCode("s14-sim", sc);
      root.querySelector("#sim-res").innerHTML = `<div class="stat-grid">${stat(L("True average", "المتوسط الحقيقي"), fmt(mu, 1), "", sc)}${stat(L("Ranges that caught it", "النطاقات التي التقطته"), `${hits} / ${st.k}`, `${fmt(100 * hits / st.k, 0)}%`, sc)}</div>
        <p class="mt-2 mb-0">${L("Press “Draw new samples” a few times: the share bounces around but stays near 95%.", "اضغط «اسحب عينات جديدة» عدة مرات: تتذبذب النسبة لكنها تبقى قرب 95%.")}</p>
        ${Math.abs(Stats.skew(pop)) > 1.5 ? `<p class="small muted mt-1 mb-0">${L("Note: glucose is very skewed, so with small samples the ranges miss more often than 95% — use bigger samples for skewed measurements.", "ملاحظة: السكر ملتوٍ جدًا، لذا مع العينات الصغيرة تخطئ النطاقات أكثر من 5% — استخدم عينات أكبر للقياسات الملتوية.")}</p>` : ""}`;
    };
    draw();
    root.querySelector("#sim-v").addEventListener("change", e => { st.v = e.target.value; draw(); });
    root.querySelector("#sim-n").addEventListener("input", e => { st.n = +e.target.value; root.querySelector("#sim-n-o").textContent = st.n; draw(); });
    bindSeg(root, "sim-k", v => { st.k = +v; draw(); });
    root.querySelector("#sim-go").addEventListener("click", () => { st.seed++; draw(); });
  },
});
