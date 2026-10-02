/* =====================================================================
   agent.js — the platform's Data Agent ("Ask the data" chatbot).

   Created by Master of AI.

   The agent answers questions about the platform's training datasets in
   English or Arabic. It works in five steps for every question:
     1. Understand  — detect language, intent, measurement, groups, filters
     2. Guardrails  — refuse clinical advice and individual patient records
     3. Plan        — decide which query answers the question
     4. Query       — run the query on the clean dataset / monthly activity
     5. Check       — validate the result (totals, sample size) and answer
   Every answer shows its evidence table and the equivalent Python code,
   and every question is written to an activity (audit) log.

   It is rule-based: no large language model and no external service is
   used. Nothing leaves the browser.
   ===================================================================== */
const Agent = (() => {
  /* ---------- text normalisation (Arabic + English) ---------- */
  const norm = s => String(s || "").toLowerCase()
    .replace(/[ً-ْـ]/g, "")            // harakat + tatweel
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[؟?!.,،]/g, " ").replace(/\s+/g, " ").trim();
  const nk = w => norm("x" + w + "x").slice(1, -1);          // normalise but keep edge spaces
  const has = (q, words) => words.some(w => (w instanceof RegExp ? w.test(q) : q.includes(nk(w))));
  const isArabic = s => /[؀-ۿ]/.test(s);

  /* ---------- vocabulary ---------- */
  const VARS = [
    { key: "diastolic_bp", w: ["diastolic", "انبساطي"] },
    { key: "systolic_bp", w: ["systolic", "blood pressure", "pressure", "انقباضي", "ضغط"] },
    { key: "hba1c", w: ["hba1c", "a1c", "التراكمي", "هيموغلوبين", "الهيموجلوبين"] },
    { key: "fasting_glucose", w: ["glucose", "sugar", "سكر", "جلوكوز", "الجلوكوز"] },
    { key: "total_cholesterol", w: ["cholesterol", "كوليسترول", "كولسترول", "الكوليسترول"] },
    { key: "heart_rate", w: ["heart rate", "pulse", "heart", "نبض", "النبض"] },
    { key: "bmi", w: ["bmi", "body mass", "كتله الجسم", "مؤشر كتله"] },
    { key: "medication_adherence_pct", w: ["adherence", "التزام", "الالتزام"] },
    { key: "exercise_days_per_week", w: ["exercise", "رياضه", "الرياضه"] },
    { key: "risk_score", w: ["risk score", "درجه الخطوره"] },
    { key: "age", w: [/\b(age|ages|aged)\b/, "how old", "عمر", "العمر", "اعمار"] },
  ];
  const DIMS = [
    { key: "risk_group", w: ["risk group", "group", "مجموعه", "مجموعات", "الخطوره"] },
    { key: "clinic_id", w: ["clinic", "عياده", "العيادات", "عيادات"] },
    { key: "sex", w: ["sex", "gender", "الجنس", "جنس"] },
    { key: "smoking_status", w: ["smoking", "smoker", "التدخين", "مدخن"] },
    { key: "age_group", w: ["age group", "الفئه العمريه", "فئات العمر"] },
  ];
  const CLINIC_NAMES = { CL01: ["north", "شمال"], CL02: ["central", "مركزي", "المركزيه"], CL03: ["east", "شرق"], CL04: ["west", "غرب"], CL05: ["south", "جنوب"], CL06: ["riverside", "النهر"] };
  const CLINIC_LABEL = { CL01: { en: "North Screening Hub", ar: "مركز الشمال للفحص" }, CL02: { en: "Central Clinic", ar: "العيادة المركزية" }, CL03: { en: "East Community Centre", ar: "مركز الشرق المجتمعي" }, CL04: { en: "West Wellness Clinic", ar: "عيادة الغرب للعافية" }, CL05: { en: "South Health Point", ar: "نقطة الجنوب الصحية" }, CL06: { en: "Riverside Clinic", ar: "عيادة ضفة النهر" } };

  /* ---------- helpers ---------- */
  let lang = "en";
  const T = (en, ar) => (lang === "ar" ? ar : en);
  const n0 = v => fmtInt(v), n1 = v => fmt(v, 1), n2 = v => fmt(v, 2);
  const varName = k => (VARMETA[k] ? (lang === "ar" ? VARMETA[k].ar : VARMETA[k].en) : k);
  const unit = k => (VARMETA[k] ? (lang === "ar" ? VARMETA[k].unitAr : VARMETA[k].unit) : "");
  const level = v => (LEVEL_LABELS[String(v)] ? LEVEL_LABELS[String(v)][lang] : CLINIC_LABEL[v] ? `${CLINIC_LABEL[v][lang]} (${v})` : String(v));
  const pyS = v => JSON.stringify(String(v));
  const LOAD = `import pandas as pd

df = pd.read_csv("data/clean_patient_screening_data.csv")`;
  const AGE_PY = `df["age_group"] = pd.cut(df["age"], [0, 34, 49, 64, 200], labels=["18-34", "35-49", "50-64", "65+"])`;

  /* ---------- understanding ---------- */
  function findVars(q) {
    const found = [];
    for (const v of VARS) {
      let pos = -1;
      for (const w of v.w) { const i = w instanceof RegExp ? q.search(w) : q.indexOf(nk(w)); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
      if (pos >= 0 && !found.some(f => f.key === v.key)) found.push({ key: v.key, pos });
    }
    // "blood pressure" should not also match diastolic twice; keep order of appearance
    return found.sort((a, b) => a.pos - b.pos).map(f => f.key);
  }
  function findFilters(q) {
    const f = [];
    if (has(q, ["non-smoker", "non smoker", "nonsmoker", "غير مدخن", "غير المدخنين", "لا يدخن"])) f.push(["smoking_status", "Non-Smoker"]);
    else if (has(q, ["smoker", "smoking patients", "مدخن", "المدخنين"])) f.push(["smoking_status", "Smoker"]);
    if (has(q, ["female", "women", "woman", "اناث", "نساء", "الاناث", "النساء"])) f.push(["sex", "Female"]);
    else if (/\b(male|males|men|man)\b/.test(q) || has(q, ["ذكور", "رجال", "الذكور", "الرجال"])) f.push(["sex", "Male"]);
    if (/\bhigh[- ]?(risk|group)\b/.test(q) || has(q, ["المرتفعه", "مرتفعه الخطوره", "الخطوره المرتفعه", "عاليه الخطوره"])) f.push(["risk_group", "High"]);
    else if (/\blow[- ]?(risk|group)\b/.test(q) || has(q, ["المنخفضه", "منخفضه الخطوره", "الخطوره المنخفضه"])) f.push(["risk_group", "Low"]);
    else if (/\bmoderate\b/.test(q) || has(q, ["المتوسطه", "متوسطه الخطوره"])) f.push(["risk_group", "Moderate"]);
    const cl = q.match(/cl[- ]?0?([1-6])\b/) || q.match(/clinic ([1-6])\b/) || q.match(/عياده ([1-6])/);
    if (cl) f.push(["clinic_id", `CL0${cl[1]}`]);
    else for (const [id, ws] of Object.entries(CLINIC_NAMES)) if (has(q, ws) && has(q, ["clinic", "hub", "centre", "center", "point", "عياده", "مركز", "نقطه"])) { f.push(["clinic_id", id]); break; }
    const over = q.match(/(?:over|above|older than|at least|فوق|اكبر من|اكثر من)\s*(\d{2})/);
    const under = q.match(/(?:under|below|younger than|less than|تحت|اصغر من|اقل من)\s*(\d{2})/);
    if (over && !/visits|زيارات/.test(q)) f.push(["age>", +over[1]]);
    if (under && !/visits|زيارات/.test(q)) f.push(["age<", +under[1]]);
    if (/\b65\s*\+/.test(q)) f.push(["age>", 64]);
    const yr = q.match(/\b(2023|2024)\b/);
    if (yr && !isVolumeQ(q)) f.push(["year", yr[1]]);
    return f;
  }
  const isVolumeQ = q => has(q, ["screening visits", "visits", "volume", "workload", "زيارات", "الزيارات", "زياره", "حجم الفحص", "عدد الزيارات"]) && !has(q, ["visits last year"]);
  function findBy(q) {
    const m = q.match(/(?:\bby\b|\bper\b|for each|across|حسب|لكل|بحسب)\s+(.*)$/);
    if (!m) return null;
    const rest = m[1];
    for (const d of DIMS.slice().reverse()) if (has(" " + rest, d.w)) return d.key;
    return null;
  }

  function understand(text) {
    const q = " " + norm(text) + " ";
    const it = { text, q, vars: findVars(q), filters: findFilters(q), by: findBy(q) };
    const stat = has(q, ["median", "middle", "وسيط", "الوسيط"]) ? "median"
      : has(q, ["highest", "maximum", "max ", "largest", "اعلى قيمه", "اقصى", "الحد الاعلى"]) ? "max"
      : has(q, ["lowest", "minimum", "min ", "smallest", "ادنى", "اقل قيمه"]) ? "min" : "mean";
    it.stat = stat;
    if (has(q, ["prescribe", "treatment", "treat ", "medication should", "start a new medication", "start medication", "dose", "diagnos", "should patient", "should i give", "علاج", "دواء", "جرعه", "تشخيص", "يصف", "وصف دواء"]) && !has(q, ["adherence", "التزام"])) it.intent = "refuse_clinical";
    else if (/\bpt\s?\d{3,}/.test(q) || has(q, ["patient id", "patient number", "رقم المريض", "المريض رقم", "name of the patient", "اسم المريض"])) it.intent = "refuse_individual";
    else if (has(q, ["help", "what can you", "what can i ask", "examples", "مساعده", "ماذا يمكنك", "ماذا تستطيع", "امثله"])) it.intent = "help";
    else if (has(q, ["forecast", "predict", "next year", "next quarter", "next 12", "capacity", "plan for", "توقع", "العام القادم", "السنه القادمه", "الربع القادم", "الاشهر القادمه", "السعه"])) it.intent = "forecast";
    else if (has(q, ["correlat", "relationship", "related", "associated", "علاقه", "ارتباط", "مرتبط"]) && it.vars.length >= 2) it.intent = "correlation";
    else if (has(q, ["compare", "difference", "differ", " vs ", "versus", "higher in", "lower in", "مقارنه", "قارن", "فرق", "الفرق", "يختلف"]) && it.vars.length >= 1) it.intent = "compare";
    else if (has(q, ["missing", "complete", "completeness", "data quality", "quality", "gaps", "مفقود", "المفقوده", "اكتمال", "جوده البيانات", "الجوده", "نواقص"])) it.intent = "missing";
    else if (has(q, ["busiest", "most patients", "which clinic", "rank", "ranking", "largest clinic", "top clinic", "اكثر عياده", "اي عياده", "ترتيب العيادات", "اكبر عياده", "اكثر العيادات"])) it.intent = "clinics";
    else if (isVolumeQ(q)) it.intent = "volume";
    else if (it.vars.length && has(q, ["average", "mean", "median", "highest", "lowest", "maximum", "minimum", "typical", "level", "متوسط", "معدل", "وسيط", "اعلى", "ادنى", "اقصى", "مستوى", "ما هو", "كم"])) it.intent = "stat";
    else if (it.vars.length && it.by) it.intent = "stat";
    else if (has(q, ["risk group", "risk groups", "مجموعات الخطوره", "توزيع الخطوره"])) it.intent = "risk_groups";
    else if (has(q, ["how many", "number of", "count", "total patients", "patients", "كم عدد", "عدد", "كم مريض", "المرضى"])) it.intent = "count";
    else if (it.vars.length) it.intent = "stat";
    else it.intent = "unknown";
    return it;
  }

  /* ---------- querying ---------- */
  function applyFilters(rows, filters) {
    let r = rows;
    for (const [k, v] of filters) {
      if (k === "age>") r = r.filter(x => x.age != null && x.age > v);
      else if (k === "age<") r = r.filter(x => x.age != null && x.age < v);
      else if (k === "year") r = r.filter(x => x.visit_date && x.visit_date.startsWith(v));
      else r = r.filter(x => String(x[k]) === String(v));
    }
    return r;
  }
  function filterText(filters) {
    if (!filters.length) return T("all patients", "جميع المرضى");
    return filters.map(([k, v]) => k === "age>" ? T(`aged over ${v}`, `فوق ${v} سنة`) : k === "age<" ? T(`aged under ${v}`, `تحت ${v} سنة`) : k === "year" ? T(`visits in ${v}`, `زيارات ${v}`) : level(v)).join(" · ");
  }
  function filterPy(filters) {
    const lines = [];
    for (const [k, v] of filters) {
      if (k === "age>") lines.push(`data = data[data["age"] > ${v}]`);
      else if (k === "age<") lines.push(`data = data[data["age"] < ${v}]`);
      else if (k === "year") lines.push(`data = data[data["visit_date"].str.startswith(${pyS(v)}, na=False)]`);
      else lines.push(`data = data[data[${pyS(k)}] == ${k === "family_history_flag" ? v : pyS(v)}]`);
    }
    return ["data = df.copy()", ...lines].join("\n");
  }
  const rowsWithAge = () => Data.clean();
  const statFn = { mean: Stats.mean.bind(Stats), median: Stats.median.bind(Stats), max: xs => Math.max(...xs), min: xs => Math.min(...xs) };
  const statPy = { mean: "mean()", median: "median()", max: "max()", min: "min()" };
  const statWord = s => ({ mean: T("average", "متوسط"), median: T("median", "وسيط"), max: T("highest value of", "أعلى قيمة لـ"), min: T("lowest value of", "أدنى قيمة لـ") }[s]);
  const caution = n => (n < 30 ? T(`Only ${n} patients match — treat this result with caution.`, `يطابق ${n} مريضًا فقط — تعامل مع هذه النتيجة بحذر.`) : null);

  /* ---------- intent handlers: each returns { answer, table, code, steps, status } ---------- */
  const H = {
    help() {
      return { status: "answered", answer: T("I am the platform's Data Agent. I answer questions about the screening training data and the monthly clinic activity. For example:", "أنا وكيل البيانات الرسمي في المنصة. أجيب عن أسئلة حول بيانات الفحص التدريبية ونشاط العيادات الشهري. مثلًا:")
        + `<ul class="small">${examples().map(e => `<li>${esc(e)}</li>`).join("")}</ul>`, steps: [T("Recognised a request for help.", "تم التعرف على طلب مساعدة.")] };
    },
    refuse_clinical() {
      return { status: "refused", answer: T("I can't help with diagnosis, treatment, triage or medication decisions. Please refer this to the responsible clinician. I can help with screening volumes, data quality, statistics, reports and forecasts.", "لا يمكنني المساعدة في التشخيص أو العلاج أو الفرز أو قرارات الدواء. يرجى إحالة ذلك إلى الطبيب المسؤول. يمكنني المساعدة في أحجام الفحص وجودة البيانات والإحصاءات والتقارير والتوقعات."),
        steps: [T("Guardrail: the question asks for a clinical decision.", "ضابط: السؤال يطلب قرارًا سريريًا."), T("Refused and recorded in the activity log.", "رُفض وسُجّل في سجل النشاط.")] };
    },
    refuse_individual() {
      return { status: "refused", answer: T("I only answer with aggregated information (counts, averages, trends). I don't look up or reveal individual patient records.", "أجيب فقط بمعلومات مجمّعة (أعداد، متوسطات، اتجاهات). ولا أبحث في سجلات المرضى الأفراد ولا أكشفها."),
        steps: [T("Guardrail: the question refers to an individual patient.", "ضابط: السؤال يشير إلى مريض فرد."), T("Refused and recorded in the activity log.", "رُفض وسُجّل في سجل النشاط.")] };
    },
    count(it) {
      const rows = applyFilters(rowsWithAge(), it.filters);
      if (it.by) return grouped(it, null);
      return { status: "answered", answer: T(`<strong>${n0(rows.length)}</strong> patients match (${filterText(it.filters)}) out of ${n0(Data.clean().length)} screened.`, `<strong>${n0(rows.length)}</strong> مريضًا يطابقون (${filterText(it.filters)}) من أصل ${n0(Data.clean().length)} مفحوصًا.`),
        table: [[T("Filter", "التصفية"), T("Patients", "المرضى")], [filterText(it.filters), n0(rows.length)]],
        code: `${LOAD}\n${it.filters.some(f => f[0] === "age_group") ? AGE_PY + "\n" : ""}${filterPy(it.filters)}\nprint(len(data))`,
        steps: [T(`Filters: ${filterText(it.filters)}.`, `عوامل التصفية: ${filterText(it.filters)}.`), T("Counted matching rows in the clean table.", "عُدّت الصفوف المطابقة في الجدول المنظّف.")] };
    },
    risk_groups(it) {
      if (it.filters.some(f => f[0] === "risk_group")) return H.count(it);
      const rows = applyFilters(rowsWithAge(), it.filters), g = ["Low", "Moderate", "High"].map(x => rows.filter(r => r.risk_group === x).length);
      return { status: "answered", answer: T(`Teaching risk groups (${filterText(it.filters)}): Low ${n0(g[0])}, Moderate ${n0(g[1])}, High ${n0(g[2])} — ${n1(100 * g[2] / rows.length)}% High.`, `مجموعات الخطورة التعليمية (${filterText(it.filters)}): منخفضة ${n0(g[0])}، متوسطة ${n0(g[1])}، مرتفعة ${n0(g[2])} — ${n1(100 * g[2] / rows.length)}% مرتفعة.`) + note(),
        table: [[T("Group", "المجموعة"), T("Patients", "المرضى"), "%"], ...["Low", "Moderate", "High"].map((x, i) => [level(x), n0(g[i]), n1(100 * g[i] / rows.length)])],
        code: `${LOAD}\n${filterPy(it.filters)}\nprint(data["risk_group"].value_counts())\nprint((100 * data["risk_group"].value_counts(normalize=True)).round(1))`,
        steps: [T("Counted patients per teaching risk group.", "عُدّ المرضى لكل مجموعة خطورة تعليمية."), T(`Check: groups add up to ${n0(g[0] + g[1] + g[2])} of ${n0(rows.length)} rows.`, `تحقق: مجموع المجموعات ${n0(g[0] + g[1] + g[2])} من ${n0(rows.length)} صفًا.`)] };
    },
    stat(it) {
      const v = it.vars[0];
      if (!v) return H.unknown(it);
      if (it.by) return grouped(it, v);
      const rows = applyFilters(rowsWithAge(), it.filters), vals = Data.values(rows, v);
      if (!vals.length) return { status: "answered", answer: T("No patients match these filters.", "لا يوجد مرضى يطابقون هذه التصفية."), steps: [] };
      const val = statFn[it.stat](vals), s = Stats.describe(vals);
      return { status: "answered", answer: T(`The ${statWord(it.stat)} ${varName(v)} for ${filterText(it.filters)} is <strong>${n2(val)} ${unit(v)}</strong> (based on ${n0(vals.length)} patients; median ${n1(s.median)}, middle half ${n1(s.q1)}–${n1(s.q3)}).`, `${statWord(it.stat)} ${varName(v)} لدى ${filterText(it.filters)} هو <strong>${n2(val)} ${unit(v)}</strong> (بناءً على ${n0(vals.length)} مريضًا؛ الوسيط ${n1(s.median)}، والنصف الأوسط ${n1(s.q1)}–${n1(s.q3)}).`) + (caution(vals.length) ? `<br><span class="small">${caution(vals.length)}</span>` : ""),
        table: [[T("Measure", "المقياس"), T("Value", "القيمة")], ["n", n0(vals.length)], [T("Average", "المتوسط"), n2(s.mean)], [T("Median", "الوسيط"), n2(s.median)], [T("Min – max", "الأدنى – الأعلى"), `${n1(s.min)} – ${n1(s.max)}`]],
        code: `${LOAD}\n${filterPy(it.filters)}\nvalues = data[${pyS(v)}].dropna()\nprint(round(values.${statPy[it.stat]}, 2), "from", values.count(), "patients")`,
        steps: [T(`Measurement: ${varName(v)} · statistic: ${statWord(it.stat)}.`, `القياس: ${varName(v)} · الإحصاءة: ${statWord(it.stat)}.`), T(`Filters: ${filterText(it.filters)}.`, `عوامل التصفية: ${filterText(it.filters)}.`), T(`Check: ${n0(vals.length)} non-missing values used${vals.length < 30 ? " — small group" : ""}.`, `تحقق: استُخدمت ${n0(vals.length)} قيمة غير مفقودة${vals.length < 30 ? " — مجموعة صغيرة" : ""}.`)] };
    },
    compare(it) {
      const v = it.vars[0];
      let dim = it.filters.find(f => f[0] === "smoking_status" || f[0] === "sex");
      const dimKey = dim ? dim[0] : (has(it.q, ["sex", "gender", "male", "female", "men", "women", "الجنس", "ذكور", "اناث"]) ? "sex" : "smoking_status");
      const [la, lb] = dimKey === "sex" ? ["Female", "Male"] : ["Non-Smoker", "Smoker"];
      const rest = it.filters.filter(f => f[0] !== dimKey), base = applyFilters(rowsWithAge(), rest);
      const a = Data.values(base.filter(r => r[dimKey] === la), v), b = Data.values(base.filter(r => r[dimKey] === lb), v);
      const w = Stats.welch(a, b), mw = Stats.mannWhitney(a, b), sig = w.p < 0.05;
      return { status: "answered", answer: T(`Average ${varName(v)}: ${level(la)} ${n2(w.ma)} vs ${level(lb)} ${n2(w.mb)} ${unit(v)} (difference ${n2(w.diff)}). Welch's t-test p = ${fmtP(w.p)} → ${sig ? "the difference is unlikely to be chance alone" : "not enough evidence of a difference"}. This is an association in observational data, not proof of a cause.`,
          `متوسط ${varName(v)}: ${level(la)} ${n2(w.ma)} مقابل ${level(lb)} ${n2(w.mb)} ${unit(v)} (الفرق ${n2(w.diff)}). اختبار ويلش p = ${fmtP(w.p)} ← ${sig ? "من غير المرجح أن يكون الفرق صدفة فقط" : "لا يوجد دليل كافٍ على فرق"}. هذا ارتباط في بيانات رصدية وليس دليلًا على سبب.`),
        table: [["", level(la), level(lb)], ["n", n0(w.na), n0(w.nb)], [T("Average", "المتوسط"), n2(w.ma), n2(w.mb)], ["p (Welch)", fmtP(w.p), ""], ["p (Mann–Whitney)", fmtP(mw.p), ""]],
        code: `${LOAD}\nfrom scipy.stats import ttest_ind, mannwhitneyu\n\n${filterPy(rest)}\na = data.loc[data[${pyS(dimKey)}] == ${pyS(la)}, ${pyS(v)}].dropna()\nb = data.loc[data[${pyS(dimKey)}] == ${pyS(lb)}, ${pyS(v)}].dropna()\nprint(round(a.mean(), 2), round(b.mean(), 2))\nprint("Welch p:", ttest_ind(a, b, equal_var=False).pvalue)\nprint("Mann-Whitney p:", mannwhitneyu(a, b).pvalue)`,
        steps: [T(`Measurement: ${varName(v)} · groups: ${level(la)} vs ${level(lb)}.`, `القياس: ${varName(v)} · المجموعتان: ${level(la)} مقابل ${level(lb)}.`), T("Ran Welch's t-test and a Mann–Whitney check.", "أُجري اختبار ويلش t وتحقق مان-ويتني."), T(`Check: ${n0(w.na)} and ${n0(w.nb)} patients.`, `تحقق: ${n0(w.na)} و${n0(w.nb)} مريضًا.`)] };
    },
    correlation(it) {
      const [a, b] = it.vars, [xs, ys] = Stats.pairs(applyFilters(rowsWithAge(), it.filters), a, b), r = Stats.pearson(xs, ys), rho = Stats.spearman(xs, ys);
      const strength = Math.abs(r) < 0.1 ? T("almost no", "شبه معدوم") : Math.abs(r) < 0.3 ? T("a weak", "ضعيف") : Math.abs(r) < 0.5 ? T("a moderate", "متوسط") : T("a strong", "قوي");
      return { status: "answered", answer: T(`There is ${strength} ${r >= 0 ? "positive" : "negative"} relationship between ${varName(a)} and ${varName(b)}: Pearson r = <strong>${n2(r)}</strong>, Spearman ρ = ${n2(rho)} (${n0(xs.length)} patients). Correlation does not show that one causes the other.`, `هناك ارتباط ${r >= 0 ? "موجب" : "سالب"} ${strength} بين ${varName(a)} و${varName(b)}: بيرسون r = <strong>${n2(r)}</strong>، سبيرمان ρ = ${n2(rho)} (${n0(xs.length)} مريضًا). الارتباط لا يُثبت أن أحدهما يسبب الآخر.`),
        table: [["", T("Value", "القيمة")], ["n", n0(xs.length)], ["Pearson r", n2(r)], ["Spearman ρ", n2(rho)]],
        code: `${LOAD}\n${filterPy(it.filters)}\npair = data[[${pyS(a)}, ${pyS(b)}]].dropna()\nprint(len(pair), round(pair.corr().iloc[0, 1], 2), round(pair.corr(method="spearman").iloc[0, 1], 2))`,
        steps: [T(`Measurements: ${varName(a)} and ${varName(b)}.`, `القياسان: ${varName(a)} و${varName(b)}.`), T("Kept patients with both values, computed Pearson and Spearman.", "أُبقي المرضى الذين لديهم القيمتان، وحُسب بيرسون وسبيرمان.")] };
    },
    missing(it) {
      const rows = Data.clean(), fields = it.vars.length ? it.vars : ["bmi", "fasting_glucose", "hba1c", "total_cholesterol", "medication_adherence_pct"];
      const pct = fields.map(f => [f, 100 * rows.filter(r => r[f] == null).length / rows.length]).sort((x, y) => y[1] - x[1]);
      const overall = 100 - Stats.mean(pct.map(p => p[1]));
      return { status: "answered", answer: it.vars.length ? T(`${varName(fields[0])} is missing for <strong>${n1(pct[0][1])}%</strong> of patients (${n0(Math.round(pct[0][1] * rows.length / 100))} of ${n0(rows.length)}).`, `${varName(fields[0])} مفقود لدى <strong>${n1(pct[0][1])}%</strong> من المرضى (${n0(Math.round(pct[0][1] * rows.length / 100))} من ${n0(rows.length)}).`)
          : T(`Key clinical fields are <strong>${n1(overall)}%</strong> complete. The biggest gap is ${varName(pct[0][0])} (${n1(pct[0][1])}% missing) — below the 5% target.`, `الحقول السريرية الرئيسية مكتملة بنسبة <strong>${n1(overall)}%</strong>. وأكبر فجوة في ${varName(pct[0][0])} (${n1(pct[0][1])}% مفقود) — دون هدف 5%.`),
        table: [[T("Field", "الحقل"), T("% missing", "نسبة المفقود")], ...pct.map(([f, p]) => [varName(f), n1(p)])],
        code: `${LOAD}\nfields = ${JSON.stringify(fields)}\nprint((100 * df[fields].isna().mean()).round(1).sort_values(ascending=False))`,
        steps: [T("Measured missing values in the clean table.", "قيست القيم المفقودة في الجدول المنظّف."), T("Compared with the 5% target.", "قورنت بهدف 5%.")] };
    },
    clinics(it) {
      const rows = applyFilters(rowsWithAge(), it.filters.filter(f => f[0] !== "clinic_id"));
      const c = Object.keys(CLINIC_LABEL).map(id => [id, rows.filter(r => r.clinic_id === id).length]).sort((x, y) => y[1] - x[1]);
      const avg = Stats.mean(c.map(x => x[1])), noClinic = rows.filter(r => !r.clinic_id).length;
      return { status: "answered", answer: T(`<strong>${level(c[0][0])}</strong> has the most patients (${n0(c[0][1])}), ${n0(100 * (c[0][1] - avg) / avg)}% above the average clinic. Smallest: ${level(c[5][0])} (${n0(c[5][1])}).`, `<strong>${level(c[0][0])}</strong> لديها أكبر عدد من المرضى (${n0(c[0][1])})، أعلى بنسبة ${n0(100 * (c[0][1] - avg) / avg)}% من العيادة المتوسطة. الأصغر: ${level(c[5][0])} (${n0(c[5][1])}).`),
        table: [[T("Clinic", "العيادة"), T("Patients", "المرضى")], ...c.map(([id, n]) => [level(id), n0(n)])],
        code: `${LOAD}\n${filterPy(it.filters.filter(f => f[0] !== "clinic_id"))}\nprint(data["clinic_id"].value_counts())`,
        steps: [T("Counted patients per clinic.", "عُدّ المرضى لكل عيادة."), T(`Check: ${n0(c.reduce((a, x) => a + x[1], 0))} + ${noClinic} without a clinic = ${n0(rows.length)}.`, `تحقق: ${n0(c.reduce((a, x) => a + x[1], 0))} + ${noClinic} بلا عيادة = ${n0(rows.length)}.`)] };
    },
    volume(it) {
      const { columns, rows } = window.SITE_DATA.monthly, m = rows.map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
      const metric = has(it.q, ["follow", "متابعه"]) ? "follow_up_requests" : has(it.q, ["lab", "مختبر", "تحاليل"]) ? "lab_requests" : "screening_visits";
      const mName = { screening_visits: T("screening visits", "زيارات الفحص"), follow_up_requests: T("follow-up requests", "طلبات المتابعة"), lab_requests: T("lab requests", "طلبات المختبر") }[metric];
      const yr = (it.q.match(/\b(2019|2020|2021|2022|2023|2024)\b/) || [])[1] || "2024", prev = String(+yr - 1);
      const sum = y => m.filter(x => String(x.month).startsWith(y)).reduce((a, x) => a + x[metric], 0);
      const cur = sum(yr), before = sum(prev), ch = before ? 100 * (cur - before) / before : null;
      return { status: "answered", answer: T(`In ${yr} there were <strong>${n0(cur)}</strong> ${mName}${ch != null ? ` — ${ch >= 0 ? "up" : "down"} ${n1(Math.abs(ch))}% from ${n0(before)} in ${prev}` : ""}.`, `في ${yr} بلغت ${mName} <strong>${n0(cur)}</strong>${ch != null ? ` — ${ch >= 0 ? "بزيادة" : "بانخفاض"} ${n1(Math.abs(ch))}% عن ${n0(before)} في ${prev}` : ""}.`),
        table: [[T("Year", "السنة"), mName], ...(before ? [[prev, n0(before)]] : []), [yr, n0(cur)]],
        code: `import pandas as pd\n\nts = pd.read_csv("data/monthly_clinic_activity.csv", parse_dates=["month"])\nyearly = ts.groupby(ts["month"].dt.year)[${pyS(metric)}].sum()\nprint(yearly.loc[[${prev}, ${yr}]] if ${prev} in yearly.index else yearly.loc[[${yr}]])`,
        steps: [T(`Source: monthly clinic activity · measure: ${mName}.`, `المصدر: نشاط العيادات الشهري · المقياس: ${mName}.`), T(`Summed the 12 months of ${yr} and compared with ${prev}.`, `جُمعت أشهر ${yr} الاثنا عشر وقورنت بـ ${prev}.`)] };
    },
    forecast(it) {
      const metric = has(it.q, ["follow", "متابعه"]) ? "follow_up_requests" : has(it.q, ["lab", "مختبر", "تحاليل"]) ? "lab_requests" : "screening_visits";
      const F = window.SITE_DATA.forecast.series[metric], quarter = has(it.q, ["quarter", "ربع", "3 months", "three months", "ثلاثه اشهر", "3 اشهر"]), k = quarter ? 3 : 12;
      const tot = F.forecast.slice(0, k).reduce((a, b) => a + b, 0), lo = F.lower.slice(0, k).reduce((a, b) => a + b, 0), hi = F.upper.slice(0, k).reduce((a, b) => a + b, 0), mape = F.holdout[F.best_method].mape;
      const mName = { screening_visits: T("screening visits", "زيارات الفحص"), follow_up_requests: T("follow-up requests", "طلبات المتابعة"), lab_requests: T("lab requests", "طلبات المختبر") }[metric];
      return { status: "answered", answer: T(`Plan for about <strong>${n0(tot)}</strong> ${mName} over the next ${k} months (likely range ${n0(lo)}–${n0(hi)}). Past forecasts were off by about ${n1(mape)}% on average. This forecasts total workload, not individual patients.`, `خطّط لنحو <strong>${n0(tot)}</strong> من ${mName} خلال الأشهر الـ${k} القادمة (النطاق المرجح ${n0(lo)}–${n0(hi)}). أخطأت التوقعات السابقة بنحو ${n1(mape)}% في المتوسط. هذا توقع لحجم العمل الإجمالي لا للمرضى الأفراد.`),
        table: [[T("Month", "الشهر"), T("Forecast", "التوقع"), T("Likely range", "النطاق المرجح")], ...F.future_months.slice(0, k).map((mm, i) => [mm, n0(F.forecast[i]), `${n0(F.lower[i])}–${n0(F.upper[i])}`])],
        code: `import json\n\nfc = json.load(open("outputs/11_forecasting.json"))["series"][${pyS(metric)}]   # produced by python/11_forecasting.py\nprint(round(sum(fc["forecast"][:${k}])), round(sum(fc["lower"][:${k}])), round(sum(fc["upper"][:${k}])))\nprint("typical error %:", fc["holdout"][fc["best_method"]]["mape"])`,
        steps: [T(`Read the platform's ${F.best_method} forecast.`, `قُرئ توقع المنصة (${F.best_method}).`), T(`Added up the next ${k} months with the likely range.`, `جُمعت الأشهر الـ${k} القادمة مع النطاق المرجح.`), T(`Check: hold-out error ${n1(mape)}%.`, `تحقق: خطأ فترة الاختبار ${n1(mape)}%.`)] };
    },
    unknown() {
      return { status: "not understood", answer: T("I'm not sure I understood. I can answer questions about counts, averages, comparisons, relationships, missing data, clinics, screening volumes and forecasts. Try one of these:", "لست متأكدًا من أنني فهمت. يمكنني الإجابة عن أسئلة حول الأعداد والمتوسطات والمقارنات والعلاقات والبيانات المفقودة والعيادات وأحجام الفحص والتوقعات. جرّب أحد هذه:")
        + `<ul class="small">${examples().slice(0, 4).map(e => `<li>${esc(e)}</li>`).join("")}</ul>`, steps: [T("Could not match the question to a supported query.", "تعذّر ربط السؤال باستعلام مدعوم.")] };
    },
  };
  const dimName = d => (GROUPMETA[d] ? GROUPMETA[d][lang].toLowerCase() : d);
  function grouped(it, v) {
    const dim = it.by, base = applyFilters(rowsWithAge(), it.filters);
    const lv = Data.levels(base, dim);
    const rows = lv.map(l => { const sub = base.filter(r => String(r[dim]) === String(l)); const vals = v ? Data.values(sub, v) : []; return [level(l), n0(v ? vals.length : sub.length), v ? n2(statFn[it.stat](vals)) : null]; }).filter(r => r[1] !== "0");
    const head = v ? [T("Group", "المجموعة"), "n", `${statWord(it.stat)} ${varName(v)}`] : [T("Group", "المجموعة"), T("Patients", "المرضى")];
    const prep = dim === "age_group" ? AGE_PY + "\n" : "";
    return { status: "answered", answer: v ? T(`${statWord(it.stat)} ${varName(v)} by ${dimName(dim)} (${filterText(it.filters)}):`, `${statWord(it.stat)} ${varName(v)} حسب ${dimName(dim)} (${filterText(it.filters)}):`) : T(`Patients by ${dimName(dim)}:`, `المرضى حسب ${dimName(dim)}:`),
      table: [head, ...rows.map(r => (v ? r : r.slice(0, 2)))],
      code: `${LOAD}\n${prep}${filterPy(it.filters)}\nprint(data.groupby(${pyS(dim)})${v ? `[${pyS(v)}].${statPy[it.stat]}.round(2)` : ".size()"})`,
      steps: [T(`Grouped by ${dimName(dim)}.`, `جُمّعت حسب ${dimName(dim)}.`), v ? T(`Computed the ${statWord(it.stat)} of ${varName(v)} in each group.`, `حُسب ${statWord(it.stat)} ${varName(v)} في كل مجموعة.`) : T("Counted patients in each group.", "عُدّ المرضى في كل مجموعة.")] };
  }
  const note = () => `<br><span class="small muted">${T("risk_group is a teaching label from a simple rule, not a medical assessment.", "risk_group تسمية تعليمية من قاعدة بسيطة، وليست تقييمًا طبيًا.")}</span>`;
  function examples() {
    return lang === "ar"
      ? ["ما متوسط سكر الصائم لدى المدخنين؟", "قارن النبض بين المدخنين وغير المدخنين", "كم عدد المرضى الإناث فوق 65؟", "أي عيادة لديها أكثر المرضى؟", "ما العلاقة بين HbA1c والسكر؟", "ما نسبة البيانات المفقودة؟", "كم زيارة فحص في 2024؟", "ما توقع الزيارات للربع القادم؟"]
      : ["What is the average fasting glucose for smokers?", "Compare heart rate between smokers and non-smokers", "How many female patients are over 65?", "Which clinic has the most patients?", "What is the relationship between HbA1c and glucose?", "How much data is missing?", "How many screening visits were there in 2024?", "Forecast screening visits for next quarter", "Average BMI by risk group"];
  }

  /* ---------- public API ---------- */
  const log = [];
  function ask(text) {
    lang = isArabic(text) ? "ar" : (App.lang === "ar" && !/[a-z]{3,}/i.test(text) ? "ar" : "en");
    const it = understand(text);
    const res = (H[it.intent] || H.unknown)(it);
    res.intent = it.intent; res.lang = lang; res.question = text;
    res.steps = [T(`Understood the question as: <strong>${intentName(it.intent)}</strong>.`, `فُهم السؤال على أنه: <strong>${intentName(it.intent)}</strong>.`), ...(res.steps || [])];
    log.push({ time: new Date(), question: text, intent: it.intent, status: res.status });
    try { const saved = JSON.parse(sessionStorage.getItem("mat-agent-log") || "[]"); saved.push({ t: Date.now(), q: text, i: it.intent, s: res.status }); sessionStorage.setItem("mat-agent-log", JSON.stringify(saved.slice(-100))); } catch (e) { /* storage blocked */ }
    App.emit("agent", res);
    return res;
  }
  function intentName(i) {
    return ({ count: T("count patients", "عدّ المرضى"), stat: T("summarise a measurement", "تلخيص قياس"), compare: T("compare two groups", "مقارنة مجموعتين"), correlation: T("relationship between two measurements", "العلاقة بين قياسين"), missing: T("data completeness", "اكتمال البيانات"), clinics: T("rank clinics", "ترتيب العيادات"), volume: T("activity volume", "حجم النشاط"), forecast: T("forecast", "التوقع"), risk_groups: T("teaching risk groups", "مجموعات الخطورة التعليمية"), help: T("help", "مساعدة"), refuse_clinical: T("clinical decision — not allowed", "قرار سريري — غير مسموح"), refuse_individual: T("individual patient record — not allowed", "سجل مريض فرد — غير مسموح"), unknown: T("not recognised", "غير معروف") }[i]);
  }
  function history() { try { return JSON.parse(sessionStorage.getItem("mat-agent-log") || "[]"); } catch (e) { return log.map(x => ({ t: +x.time, q: x.question, i: x.intent, s: x.status })); } }
  return { ask, examples: () => { lang = App.lang; return examples(); }, history, understand };
})();

/* =====================================================================
   Chat panel ("Ask the data") — available on every page
   ===================================================================== */
const AgentUI = (() => {
  let panel, btn, msgs;
  function renderAnswer(res) {
    const key = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (res.code) setCode(key, { title: L("Data Agent query", "استعلام وكيل البيانات"), result: res.answer.replace(/<[^>]+>/g, "").slice(0, 160), code: res.code });
    const table = res.table ? `<div class="table-wrap mt-1"><table class="data"><thead><tr>${res.table[0].map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${res.table.slice(1).map(r => `<tr>${r.map(c => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "";
    return `<div class="bubble ai ${res.status === "refused" ? "refuse" : ""}" dir="${res.lang === "ar" ? "rtl" : "ltr"}"><span class="who">${res.lang === "ar" ? "وكيل البيانات" : "Data Agent"}</span>${res.answer}${table}
      <details class="agent-how"><summary>${res.lang === "ar" ? "كيف أجبت" : "How I answered"}</summary><ol>${res.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      ${res.code ? `<button type="button" class="btn btn-sm" data-code-ref="${key}">${ICON.code}<span>${res.lang === "ar" ? "اعرض الاستعلام" : "Show the query"}</span></button>` : ""}</details></div>`;
  }
  function send(text) {
    text = (text || "").trim(); if (!text) return;
    msgs.insertAdjacentHTML("beforeend", `<div class="bubble user" dir="auto"><span class="who">${L("You", "أنت")}</span>${esc(text)}</div>`);
    const res = Agent.ask(text);
    msgs.insertAdjacentHTML("beforeend", renderAnswer(res));
    msgs.scrollTop = msgs.scrollHeight;
  }
  function build() {
    btn = document.createElement("button");
    btn.type = "button"; btn.className = "agent-fab"; btn.setAttribute("aria-controls", "agent-panel"); btn.setAttribute("aria-expanded", "false");
    panel = document.createElement("aside");
    panel.id = "agent-panel"; panel.className = "agent-panel"; panel.hidden = true;
    document.body.append(btn, panel);
    btn.addEventListener("click", () => toggle());
    panel.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); toggle(false); } });
    paint();
    App.on("lang", paint);
  }
  function paint() {
    btn.innerHTML = `<span class="agent-fab-ic">${ICON.search}</span><span>${L("Ask the data", "اسأل البيانات")}</span>`;
    btn.setAttribute("aria-label", L("Open the Data Agent", "افتح وكيل البيانات"));
    const keep = msgs && msgs.querySelector(".bubble.user") ? msgs.innerHTML : "";
    panel.setAttribute("aria-label", L("Data Agent", "وكيل البيانات"));
    panel.innerHTML = `<div class="agent-head"><img src="${BRAND.logos[App.theme]}" data-logo alt="" class="agent-logo"><div><strong>${L("Data Agent", "وكيل البيانات")}</strong><small>${L("Official assistant of the platform · by", "المساعد الرسمي للمنصة · من")} ${esc(BRAND.companyName)}</small></div>
        <button type="button" class="icon-btn" data-agent-close aria-label="${L("Close", "إغلاق")}">${ICON.close}</button></div>
      <div class="agent-msgs" aria-live="polite">${keep || `<div class="bubble ai"><span class="who">${L("Data Agent", "وكيل البيانات")}</span>${L("Hello! Ask me about the screening data — counts, averages, comparisons, clinics, missing data, visits or forecasts. I answer only from the platform's data and always show how.", "مرحبًا! اسألني عن بيانات الفحص — الأعداد والمتوسطات والمقارنات والعيادات والبيانات المفقودة والزيارات والتوقعات. أجيب من بيانات المنصة فقط وأُظهر دائمًا كيف.")}</div>`}</div>
      <div class="agent-suggest">${Agent.examples().slice(0, 4).map(e => `<button type="button" class="chip-btn" data-ask="${esc(e)}">${esc(e)}</button>`).join("")}</div>
      <form class="agent-form"><label class="sr-only" for="agent-input">${L("Your question", "سؤالك")}</label><input id="agent-input" type="text" autocomplete="off" dir="auto" placeholder="${L("Type a question…", "اكتب سؤالًا…")}"><button type="submit" class="btn btn-primary btn-sm">${L("Ask", "اسأل")}</button></form>
      <div class="agent-foot"><a href="agent-report.html">${L("How this agent works (official report)", "كيف يعمل هذا الوكيل (التقرير الرسمي)")}</a></div>`;
    msgs = panel.querySelector(".agent-msgs");
    panel.querySelector(".agent-form").addEventListener("submit", e => { e.preventDefault(); const i = panel.querySelector("#agent-input"); send(i.value); i.value = ""; i.focus(); });
    panel.querySelectorAll("[data-ask]").forEach(b => b.addEventListener("click", () => send(b.dataset.ask)));
    panel.querySelector("[data-agent-close]").addEventListener("click", () => toggle(false));
  }
  function toggle(open = panel.hidden) {
    panel.hidden = !open; btn.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("agent-open", open);
    if (open) setTimeout(() => panel.querySelector("#agent-input").focus(), 30); else btn.focus();
  }
  return { mount: () => { if (!btn) build(); }, send, open: () => { if (!btn) build(); if (panel.hidden) toggle(true); }, renderAnswer };
})();
document.addEventListener("DOMContentLoaded", () => { if (window.SITE_DATA && !document.body.classList.contains("no-agent")) AgentUI.mount(); });
