/* =====================================================================
   Lecture 2 — Data Analysis with Python (continued)
   Sections 08–15: features, group-by, time series, statistics and
   outliers, visualisation, comparisons, business insights, conclusion.
   Created by Master of AI.
   ===================================================================== */
/* short numbers for charts and text: 1.25B · 18.4M · 890k · 4.2k · 873 · 12.5 */
const compact = v => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const a = Math.abs(v), trim = (x, d) => String(+x.toFixed(d));
  if (a >= 1e9) return `${trim(v / 1e9, 2)}B`;
  if (a >= 1e6) return `${trim(v / 1e6, a >= 1e8 ? 0 : a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${trim(v / 1e3, a >= 1e5 ? 0 : 1)}k`;
  return v === 0 ? "0" : trim(v, a >= 100 ? 0 : a >= 10 ? 1 : 2);
};
const share = (a, b) => (b ? (100 * a) / b : NaN);
const totalSales = R => R.byStore.reduce((a, s) => a + s.total, 0);
const dayName = d => ({ Monday: L("Monday", "الاثنين"), Tuesday: L("Tuesday", "الثلاثاء"), Wednesday: L("Wednesday", "الأربعاء"), Thursday: L("Thursday", "الخميس"), Friday: L("Friday", "الجمعة"), Saturday: L("Saturday", "السبت"), Sunday: L("Sunday", "الأحد") }[d] || d);
const fullYears = R => R.yearly.filter(y => !y.partial);

/* =====================================================================
   08 — Feature engineering
   ===================================================================== */
Lec.add({
  id: "py-features", num: 8, aliases: ["feature-engineering-python", "date-features"],
  title: { en: "Feature Engineering from Dates", ar: "هندسة الخصائص من التواريخ" },
  short: { en: "Feature engineering", ar: "هندسة الخصائص" },
  summary: { en: "Year, month, day and weekday columns — and what they reveal.", ar: "أعمدة السنة والشهر واليوم ويوم الأسبوع — وما تكشفه." },
  render(root) {
    root.innerHTML = lesson(this, {
      simple: L("A <strong>feature</strong> is a column we create from existing data to make a pattern easier to see. From one <code>date</code> column we derive the year, month, day of the month and day of the week — so we can ask “are Saturdays different?” or “is December special?”.",
        "<strong>الخاصية</strong> عمود ننشئه من بيانات موجودة ليسهل رؤية نمط ما. ومن عمود <code>date</code> واحد نشتق السنة والشهر ويوم الشهر ويوم الأسبوع — فنستطيع أن نسأل «هل أيام السبت مختلفة؟» أو «هل ديسمبر مميز؟»."),
      why: [L("Grouping by weekday or month is impossible while the date is a single value.", "التجميع حسب يوم الأسبوع أو الشهر مستحيل ما دام التاريخ قيمة واحدة."), L("The same features later help forecasting and machine-learning models.", "الخصائص نفسها تساعد لاحقًا نماذج التنبؤ وتعلّم الآلة.")],
      extra: `<section class="block">${miniTable([L("Original variable", "المتغير الأصلي"), L("Derived feature", "الخاصية المشتقة"), L("Example value", "قيمة مثال"), L("Question it helps answer", "السؤال الذي تساعد في الإجابة عنه")], [
          ["date", "year", "2016", L("Are sales growing year on year?", "هل تنمو المبيعات عامًا بعد عام؟")],
          ["date", "month", "12", L("Is there a seasonal (monthly) pattern?", "هل هناك نمط موسمي (شهري)؟")],
          ["date", "day", "15", L("Do sales change around paydays?", "هل تتغير المبيعات حول أيام صرف الرواتب؟")],
          ["date", "day_name", "Saturday", L("Are weekends busier? (readable)", "هل نهايات الأسبوع أكثر ازدحامًا؟ (مقروء)")],
          ["date", "weekday", "5", L("Same, as a number (Monday = 0 … Sunday = 6) for sorting and models", "الشيء نفسه كرقم (الاثنين = 0 … الأحد = 6) للترتيب والنماذج")],
        ])}
        <p class="small muted">${L("<strong>Original variables</strong> come from the source files; <strong>derived features</strong> are calculated by us and can always be recalculated. Keep them clearly separate in documentation.", "<strong>المتغيرات الأصلية</strong> تأتي من الملفات المصدرية؛ و<strong>الخصائص المشتقة</strong> نحسبها نحن ويمكن إعادة حسابها دائمًا. افصل بينها بوضوح في التوثيق.")}</p></section>
        <section class="block">${concept({
          title: L("Date features with the .dt accessor", "خصائص التاريخ باستخدام ‎.dt"),
          what: L("<code>.dt</code> gives access to the parts of a datetime column.", "يتيح <code>.dt</code> الوصول إلى أجزاء عمود التاريخ والوقت."),
          why: L("To group and compare sales by calendar periods.", "لتجميع المبيعات ومقارنتها حسب فترات التقويم."),
          code: ["features", "features_weekday"],
          lines: [
            ['merged["date"].dt.year', L("The year as a number for each row.", "السنة كرقم لكل صف.")],
            ['.dt.day_name()', L("The weekday as text (Monday, Tuesday…). It is a method, so it needs brackets.", "يوم الأسبوع كنص (Monday و Tuesday…). وهي دالة، لذلك تحتاج إلى أقواس.")],
            ['.dt.dayofweek', L("The weekday as a number: Monday = 0, Sunday = 6.", "يوم الأسبوع كرقم: الاثنين = 0، والأحد = 6.")],
            ['merged.groupby("date")["sales"].sum()', L("First the total sales of the whole chain on each date…", "أولًا إجمالي مبيعات السلسلة كلها في كل تاريخ…")],
            ['.groupby("day_name")["sales"].mean()', L("…then the average of those daily totals for each weekday. This compares typical days, not numbers of rows.", "…ثم متوسط تلك المجاميع اليومية لكل يوم من أيام الأسبوع. وهذا يقارن الأيام النموذجية لا أعداد الصفوف.")],
            ['.reindex(weekday_order)', L("Puts the days in calendar order instead of alphabetical order.", "يرتّب الأيام بترتيب التقويم بدلًا من الترتيب الأبجدي.")],
          ],
          expect: `<pre class="py-out">day_name
Monday       …
Tuesday      …
…
Sunday       …
Name: sales, dtype: float64</pre>`,
          interpret: L("Each number is the average total sales of the whole chain on that weekday. Compare the highest and lowest days to judge how strong the weekly pattern is.", "كل رقم هو متوسط إجمالي مبيعات السلسلة كلها في ذلك اليوم من الأسبوع. قارن أعلى يوم وأدناه لتحكم على قوة النمط الأسبوعي."),
          mistakes: [
            ["AttributeError: Can only use .dt accessor with datetimelike values", L("The date column is still text. Run the <code>pd.to_datetime(...)</code> step from Section 5 first (on <code>train</code>, before merging).", "عمود التاريخ لا يزال نصًا. شغّل خطوة <code>pd.to_datetime(...)</code> من القسم 5 أولًا (على <code>train</code>، قبل الدمج).")],
            ['merged["date"].dt.day_name', L("Missing brackets — <code>day_name()</code> is a method; <code>year</code>, <code>month</code>, <code>day</code> and <code>dayofweek</code> are attributes.", "أقواس ناقصة — <code>day_name()</code> دالة؛ أما <code>year</code> و <code>month</code> و <code>day</code> و <code>dayofweek</code> فخصائص.")],
            [L("Averaging the rows by weekday", "حساب متوسط الصفوف حسب يوم الأسبوع"), L("<code>merged.groupby(\"day_name\")[\"sales\"].mean()</code> averages single family records, not days. Sum per date first.", "<code>merged.groupby(\"day_name\")[\"sales\"].mean()</code> يحسب متوسط سجلات الفئات المفردة لا الأيام. اجمع لكل تاريخ أولًا.")],
          ],
          business: L("Weekly and monthly patterns drive staffing, stock levels and the timing of promotions.", "الأنماط الأسبوعية والشهرية توجّه توزيع الموظفين ومستويات المخزون وتوقيت التخفيضات."),
        })}</section>`,
      seeTitle: L("Results from your files: weekday and month patterns", "النتائج من ملفاتك: أنماط أيام الأسبوع والأشهر"), seeNote: LIVE_NOTE(),
      see: liveSee(L("average daily sales by weekday and by month", "متوسط المبيعات اليومية حسب يوم الأسبوع وحسب الشهر"), () => `<div class="grid grid-2">
          <div class="chart-card">${codeChip("py-wd")}<div class="chart-title">${L("Average daily total sales by weekday", "متوسط إجمالي المبيعات اليومية حسب يوم الأسبوع")}</div><div id="py-wd-chart"></div></div>
          <div class="chart-card">${codeChip("py-moy")}<div class="chart-title">${L("Average daily total sales by month of the year", "متوسط إجمالي المبيعات اليومية حسب شهر السنة")}</div><div id="py-moy-chart"></div></div></div>`),
      results: SSR() ? (() => {
        const w = SSR().weekday.filter(d => d.dates), hi = w.reduce((a, b) => (b.avg > a.avg ? b : a)), lo = w.reduce((a, b) => (b.avg < a.avg ? b : a));
        const m = SSR().monthOfYear.filter(d => d.dates), mh = m.reduce((a, b) => (b.avg > a.avg ? b : a));
        return `<p class="mb-0">${L(`On average, <strong>${dayName(hi.day)}</strong> has the highest daily total (${compact(hi.avg)}) and <strong>${dayName(lo.day)}</strong> the lowest (${compact(lo.avg)}) — a difference of ${fmtPct(share(hi.avg - lo.avg, lo.avg), 0)}. The month with the highest average daily total is <strong>${MONTHS()[mh.month - 1]}</strong>. These are associations in historical data; holidays, paydays and promotions may explain part of them.`, `في المتوسط، يحقق <strong>${dayName(hi.day)}</strong> أعلى إجمالي يومي (${compact(hi.avg)}) و<strong>${dayName(lo.day)}</strong> الأدنى (${compact(lo.avg)}) — بفرق ${fmtPct(share(hi.avg - lo.avg, lo.avg), 0)}. والشهر الذي له أعلى متوسط إجمالي يومي هو <strong>${MONTHS()[mh.month - 1]}</strong>. هذه ارتباطات في بيانات تاريخية؛ وقد تفسّر العطل وأيام الرواتب والتخفيضات جزءًا منها.`)}</p>`;
      })() : pending(L("weekday pattern", "نمط أيام الأسبوع")),
      remember: L("Convert the date first, then derive year, month, day and weekday. Sum per date before averaging per weekday.", "حوّل التاريخ أولًا، ثم اشتق السنة والشهر واليوم ويوم الأسبوع. واجمع لكل تاريخ قبل حساب المتوسط لكل يوم أسبوع."),
      quiz: { q: L("merged[\"date\"].dt.dayofweek returns 6. Which day is it?", "أعادت merged[\"date\"].dt.dayofweek القيمة 6. أي يوم هذا؟"), options: [
        { t: L("Saturday", "السبت"), why: L("Saturday is 5.", "السبت هو 5.") },
        { t: L("Sunday", "الأحد"), ok: true, why: L("Monday = 0 … Sunday = 6.", "الاثنين = 0 … الأحد = 6.") }] },
    });
    const R = SSR();
    if (!R) return;
    setCode("py-wd", pySpec("features_weekday", L("Average daily total by weekday", "متوسط الإجمالي اليومي حسب يوم الأسبوع"), L("the chart", "الرسم")));
    setCode("py-moy", { title: L("Average daily total by month", "متوسط الإجمالي اليومي حسب الشهر"), result: L("the chart", "الرسم"), code: `${PYS.features_weekday}\n\ndaily_total["month"] = daily_total["date"].dt.month\ndisplay(daily_total.groupby("month")["sales"].mean())` });
    Charts.bar(root.querySelector("#py-wd-chart"), { data: R.weekday.map(d => ({ label: dayName(d.day).slice(0, App.lang === "ar" ? 8 : 3), value: d.avg || 0, cls: d.day === "Saturday" || d.day === "Sunday" ? "c2" : "c1", tip: `${dayName(d.day)}: ${fmt(d.avg, 0)}` })), format: compact, yLabel: L("Sales", "المبيعات"), height: 260 });
    Charts.bar(root.querySelector("#py-moy-chart"), { data: R.monthOfYear.map(d => ({ label: MONTHS()[d.month - 1].slice(0, App.lang === "ar" ? 7 : 3), value: d.avg || 0, tip: `${MONTHS()[d.month - 1]}: ${fmt(d.avg, 0)} (${d.dates} ${L("days", "يومًا")})` })), format: compact, yLabel: L("Sales", "المبيعات"), height: 260, hideValues: true });
  },
});

/* =====================================================================
   09 — GroupBy and aggregation
   ===================================================================== */
Lec.add({
  id: "py-groupby", num: 9, aliases: ["groupby", "aggregation"],
  title: { en: "GroupBy and Aggregation", ar: "التجميع والتلخيص (GroupBy)" },
  short: { en: "GroupBy & aggregation", ar: "التجميع والتلخيص" },
  summary: { en: "Sales by store, product family and city — and which average answers which question.", ar: "المبيعات حسب المتجر وفئة المنتجات والمدينة — وأي متوسط يجيب عن أي سؤال." },
  render(root) {
    const st = getState("py-groupby", { by: "store", metric: "total" });
    root.innerHTML = lesson(this, {
      simple: L("<code>groupby()</code> splits the table into groups — one per store, per family or per city — and <code>agg()</code> calculates numbers for each group, such as the total or the average. It is the pandas version of a pivot table or SQL <code>GROUP BY</code>.",
        "تقسم <code>groupby()</code> الجدول إلى مجموعات — مجموعة لكل متجر أو لكل فئة أو لكل مدينة — وتحسب <code>agg()</code> أرقامًا لكل مجموعة، مثل الإجمالي أو المتوسط. وهي نسخة pandas من الجدول المحوري أو <code>GROUP BY</code> في SQL."),
      why: [L("Managers think in groups: which stores, which products, which cities.", "يفكر المديرون بالمجموعات: أي المتاجر، وأي المنتجات، وأي المدن."), L("Choosing the right metric (total vs. average of what?) decides whether a comparison is fair.", "اختيار المقياس الصحيح (الإجمالي أم متوسط ماذا؟) يحدد ما إذا كانت المقارنة عادلة.")],
      stepsTitle: L("Split → apply → combine", "قسّم ← طبّق ← اجمع"),
      steps: [
        { t: L("Split", "قسّم"), d: L("<code>groupby(\"store_nbr\")</code> puts all rows of each store together.", "تضع <code>groupby(\"store_nbr\")</code> كل صفوف كل متجر معًا.") },
        { t: L("Apply", "طبّق"), d: L("<code>agg(total_sales=(\"sales\", \"sum\"), …)</code> calculates each named result on the <code>sales</code> column of each group.", "تحسب <code>agg(total_sales=(\"sales\", \"sum\"), …)</code> كل نتيجة مسماة على عمود <code>sales</code> لكل مجموعة.") },
        { t: L("Combine and rank", "اجمع ورتّب"), d: L("One row per group; <code>sort_values(..., ascending=False)</code> puts the largest first and <code>head(10)</code> keeps the top 10.", "صف واحد لكل مجموعة؛ وتضع <code>sort_values(..., ascending=False)</code> الأكبر أولًا وتحتفظ <code>head(10)</code> بأعلى 10.") },
      ],
      extra: `<section class="block">${concept({
          title: L("Sales by store, product family and city", "المبيعات حسب المتجر وفئة المنتجات والمدينة"),
          what: L("Three group-by summaries with named aggregations.", "ثلاثة ملخصات تجميع مع تلخيصات مسماة."),
          why: L("To rank stores, products and cities and see where sales are concentrated.", "لترتيب المتاجر والمنتجات والمدن ورؤية أين تتركز المبيعات."),
          code: ["groupby"],
          lines: [
            ['merged.groupby("store_nbr", as_index=False)', L("One group per store. <code>as_index=False</code> keeps <code>store_nbr</code> as a normal column (easier to chart and merge).", "مجموعة لكل متجر. وتُبقي <code>as_index=False</code> العمود <code>store_nbr</code> عمودًا عاديًا (أسهل في الرسم والدمج).")],
            ['total_sales=("sales", "sum")', L("<strong>sum</strong>: total sales of the group. Missing values are skipped.", "<strong>sum</strong>: إجمالي مبيعات المجموعة. وتُتخطى القيم المفقودة.")],
            ['average_sales=("sales", "mean")', L("<strong>mean</strong>: the average of the individual records — one product family, in one store, on one day.", "<strong>mean</strong>: متوسط السجلات المفردة — فئة منتجات واحدة في متجر واحد في يوم واحد.")],
            ['sales_records=("sales", "count")', L("<strong>count</strong>: number of non-missing sales values in the group.", "<strong>count</strong>: عدد قيم المبيعات غير المفقودة في المجموعة.")],
            ['.sort_values("total_sales", ascending=False)', L("Sort by total sales; <code>ascending=False</code> means largest first.", "رتّب حسب إجمالي المبيعات؛ و<code>ascending=False</code> تعني الأكبر أولًا.")],
            ["sales_by_store.head(10)", L("The first 10 rows of the sorted table = the top 10.", "أول 10 صفوف من الجدول المرتب = الأعلى 10.")],
          ],
          expect: `<pre class="py-out">   store_nbr  total_sales  average_sales  sales_records
…          …            …              …              …</pre>`,
          interpret: L("Read totals for “who sells the most overall”. Read averages carefully: <code>average_sales</code> is per product-family record, so it is much smaller than a store's daily sales.", "اقرأ المجاميع لمعرفة «من يبيع أكثر إجمالًا». واقرأ المتوسطات بحذر: <code>average_sales</code> لكل سجل فئة منتجات، لذا فهو أصغر بكثير من المبيعات اليومية للمتجر."),
          mistakes: [
            ['merged.groupby("store_nbr")["sales"].sum().head(10)', L("Not sorted first, so this is not the top 10 — just the first 10 store numbers.", "لم يُرتَّب أولًا، لذا ليس هذا الأعلى 10 — بل أول 10 أرقام متاجر فقط.")],
            ["KeyError: 'Column not found: sales'", L("A spelling or capitalisation mismatch; check <code>merged.columns</code>.", "اختلاف في التهجئة أو حالة الأحرف؛ افحص <code>merged.columns</code>.")],
            [L("Calling average_sales “average daily sales”", "تسمية average_sales «متوسط المبيعات اليومية»"), L("It is the average per record. For daily store sales use the second code block.", "إنه المتوسط لكل سجل. وللمبيعات اليومية للمتجر استخدم كتلة الكود الثانية.")],
          ],
          business: L("Concentration matters: if a few stores or families bring most of the sales, they deserve the most attention — and the most careful checking.", "التركّز مهم: إذا جلبت متاجر أو فئات قليلة معظم المبيعات، فهي تستحق أكبر اهتمام — وأدق فحص."),
        })}
        ${concept({
          title: L("Average per record vs. average daily total", "المتوسط لكل سجل مقابل متوسط الإجمالي اليومي"),
          what: L("Two different averages. <strong>Per record</strong>: total ÷ number of family-day records. <strong>Daily total per store</strong>: first add up each store's sales per date, then average those daily totals.", "متوسطان مختلفان. <strong>لكل سجل</strong>: الإجمالي ÷ عدد سجلات الفئة-اليوم. و<strong>الإجمالي اليومي لكل متجر</strong>: اجمع أولًا مبيعات كل متجر لكل تاريخ، ثم احسب متوسط تلك المجاميع اليومية."),
          why: L("“How much does a store sell on a typical day?” is answered only by the second one.", "«كم يبيع المتجر في يوم نموذجي؟» لا يجيب عنه إلا المتوسط الثاني."),
          code: ["avg_daily_store"],
          lines: [
            ['groupby(["store_nbr", "date"])["sales"].sum()', L("One row per store per day: that store's total for the day.", "صف لكل متجر لكل يوم: إجمالي ذلك المتجر في ذلك اليوم.")],
            ['avg_daily_sales=("sales", "mean")', L("The average of those daily totals.", "متوسط تلك المجاميع اليومية.")],
            ['days=("date", "nunique")', L("How many different days the store has data for — stores opened later have fewer.", "عدد الأيام المختلفة التي للمتجر بيانات عنها — والمتاجر التي افتُتحت لاحقًا لها أيام أقل.")],
          ],
          business: L("Average daily sales per store is a fairer basis for comparing stores that were open for different lengths of time.", "متوسط المبيعات اليومية لكل متجر أساس أعدل لمقارنة متاجر عملت لفترات مختلفة."),
        })}
        ${miniTable([L("Metric", "المقياس"), L("How it is calculated", "كيف يُحسب"), L("Question it answers", "السؤال الذي يجيب عنه")], [
          ["total_sales", L("sum of all sales of the group", "مجموع كل مبيعات المجموعة"), L("Who contributes most to the business overall?", "من يساهم أكثر في العمل إجمالًا؟")],
          ["average_sales", L("total ÷ number of records (family × day)", "الإجمالي ÷ عدد السجلات (فئة × يوم)"), L("How large is a typical product-family record?", "ما حجم سجل فئة المنتجات النموذجي؟")],
          ["avg_daily_sales", L("mean of daily store totals = total ÷ store-days", "متوسط المجاميع اليومية للمتجر = الإجمالي ÷ أيام المتجر"), L("How much does a store sell on a typical day?", "كم يبيع المتجر في يوم نموذجي؟")],
        ])}</section>`,
      seeTitle: L("Results from your files: top 10", "النتائج من ملفاتك: الأعلى 10"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the top 10 stores, product families and cities", "أعلى 10 متاجر وفئات منتجات ومدن"), () => `<div class="controls">${segmented("gb-by", [{ value: "store", label: L("By store", "حسب المتجر") }, { value: "family", label: L("By product family", "حسب فئة المنتجات") }, { value: "city", label: L("By city", "حسب المدينة") }], st.by, L("Group by", "جمّع حسب"))}
          ${st.by === "family" ? "" : segmented("gb-metric", [{ value: "total", label: "total_sales" }, { value: "mean", label: "average_sales" }, { value: "daily", label: L("avg daily per store", "المتوسط اليومي لكل متجر") }], st.metric, L("Metric", "المقياس"))}</div>
          <div class="grid grid-2"><div id="gb-table"></div><div class="chart-card">${codeChip("py-gb")}<div id="gb-chart"></div></div></div>`),
      results: SSR() ? (() => {
        const R = SSR(), tot = totalSales(R), k = Math.min(10, R.byStore.length), top10 = R.byStore.slice(0, k).reduce((a, s) => a + s.total, 0), famTop = R.byFamily[0], fam3 = R.byFamily.slice(0, 3).reduce((a, f) => a + f.total, 0);
        return `<p class="mb-0">${L(`The top ${k} of ${R.byStore.length} stores bring <strong>${fmtPct(share(top10, tot))}</strong> of all sales. The largest product family, <strong>${esc(famTop.family)}</strong>, alone accounts for ${fmtPct(share(famTop.total, tot))}; the top three families for ${fmtPct(share(fam3, tot))}. Sales are concentrated — so the ranking depends strongly on which metric you choose: switch the metric above and watch the order change.`, `أعلى ${k} متاجر من أصل ${R.byStore.length} تجلب <strong>${fmtPct(share(top10, tot))}</strong> من كل المبيعات. وأكبر فئة منتجات، <strong>${esc(famTop.family)}</strong>، تمثّل وحدها ${fmtPct(share(famTop.total, tot))}؛ وأعلى ثلاث فئات ${fmtPct(share(fam3, tot))}. المبيعات متركّزة — لذا يعتمد الترتيب كثيرًا على المقياس الذي تختاره: غيّر المقياس أعلاه ولاحظ تغيّر الترتيب.`)}</p>`;
      })() : pending(L("ranking", "الترتيب")),
      remember: L("groupby → agg → sort_values(ascending=False) → head(10). Always say which average you mean.", "groupby ← agg ← sort_values(ascending=False) ← head(10). وقل دائمًا أي متوسط تقصد."),
      quiz: { q: L("A store has the highest total_sales but only an average average_sales. Is that a contradiction?", "متجر له أعلى total_sales لكن average_sales عنده متوسط فقط. هل هذا تناقض؟"), options: [
        { t: L("No — totals add up many records and days; average_sales is per single record", "لا — المجاميع تجمع سجلات وأيامًا كثيرة؛ و average_sales لكل سجل مفرد"), ok: true, why: L("Different metrics answer different questions.", "المقاييس المختلفة تجيب عن أسئلة مختلفة.") },
        { t: L("Yes — one of the numbers must be wrong", "نعم — أحد الرقمين خاطئ بالضرورة"), why: L("Both can be right; they measure different things.", "قد يكون الاثنان صحيحين؛ فهما يقيسان أشياء مختلفة.") }] },
    });
    const R = SSR();
    if (!R) return;
    const draw = () => {
      const by = st.by, metric = by === "family" ? "total" : st.metric;
      let rows, label, key;
      if (by === "store") { rows = [...R.byStore]; label = s => `${L("Store", "متجر")} ${s.store}`; key = "store_nbr"; }
      else if (by === "family") { rows = [...R.byFamily]; label = s => s.family; key = "family"; }
      else { rows = [...R.byCity]; label = s => s.key; key = "city"; }
      const val = s => (metric === "total" ? s.total : metric === "mean" ? s.mean : s.avgDaily);
      rows.sort((a, b) => val(b) - val(a));
      const top = rows.slice(0, 10), mName = metric === "total" ? "total_sales" : metric === "mean" ? "average_sales" : "avg_daily_sales";
      const head = [key, { t: mName, num: true }, ...(by === "family" ? [{ t: "average_sales", num: true }] : by === "store" ? [L("city · type", "المدينة · النوع")] : [{ t: L("stores", "المتاجر"), num: true }])];
      root.querySelector("#gb-table").innerHTML = withCode("py-gb-t", metric === "daily" ? pySpec(by === "city" ? "compare_fair" : "avg_daily_store", mName, fmt(val(top[0]), 2)) : pySpec("groupby", `sales_by_${by}.head(10)`, fmt(val(top[0]), 2)),
        miniTable(head, top.map(s => [esc(by === "store" ? s.store : label(s)), fmt(val(s), metric === "total" ? 0 : 2), ...(by === "family" ? [fmt(s.mean, 2)] : by === "store" ? [`${esc(s.city ?? "—")} · ${esc(s.type ?? "—")}`] : [s.stores])])));
      setCode("py-gb", metric === "daily" ? pySpec(by === "city" ? "compare_fair" : "avg_daily_store", mName, L("the chart", "الرسم")) : pySpec("groupby", `sales_by_${by}`, L("the chart", "الرسم")));
      Charts.bar(root.querySelector("#gb-chart"), { horizontal: true, data: top.map(s => ({ label: String(label(s)), value: val(s) })), format: compact, labelWidth: by === "family" ? 170 : 110 });
    };
    draw();
    root.querySelectorAll('[data-seg="gb-by"] button, [data-seg="gb-metric"] button').forEach(b => b.addEventListener("click", () => {
      const seg = b.closest("[data-seg]").dataset.seg;
      if (seg === "gb-by") st.by = b.dataset.value; else st.metric = b.dataset.value;
      this.render(root); root.querySelector(`[data-seg="${seg}"] [data-value="${b.dataset.value}"]`)?.focus();
    }));
  },
});

/* =====================================================================
   10 — Time-series analysis
   ===================================================================== */
Lec.add({
  id: "py-timeseries", num: 10, aliases: ["resample", "time-series-python"],
  title: { en: "Time-Series Analysis", ar: "تحليل السلاسل الزمنية" },
  short: { en: "Time-series analysis", ar: "السلاسل الزمنية" },
  summary: { en: "Monthly and yearly totals with resample(), trends and seasonality.", ar: "المجاميع الشهرية والسنوية باستخدام resample()، والاتجاهات والموسمية." },
  render(root) {
    root.innerHTML = lesson(this, {
      simple: L("A time series is a measurement in time order — here, total sales per month. <code>resample()</code> regroups dated rows into calendar periods (months, years) and adds them up. Then we look for a <strong>trend</strong> (up or down over years), <strong>seasonality</strong> (a pattern that repeats every year) and unusual months.",
        "السلسلة الزمنية قياس مرتب زمنيًا — وهنا إجمالي المبيعات لكل شهر. وتعيد <code>resample()</code> تجميع الصفوف المؤرخة في فترات تقويمية (أشهر وسنوات) وتجمعها. ثم نبحث عن <strong>اتجاه</strong> (صعود أو هبوط عبر السنين)، و<strong>موسمية</strong> (نمط يتكرر كل عام)، وأشهر غير معتادة."),
      why: [L("Totals over the whole period hide whether the business is growing or shrinking.", "المجاميع على كامل الفترة تُخفي ما إذا كان العمل ينمو أو يتراجع."), L("Seasonality tells planners when to expect peaks and quiet months.", "الموسمية تخبر المخططين متى يتوقعون الذروات والأشهر الهادئة.")],
      extra: `<section class="block">${concept({
          title: L("Resampling to months and years", "إعادة التجميع إلى أشهر وسنوات"),
          what: L("<code>resample()</code> works like <code>groupby()</code> on a date index, but it understands calendar periods and also creates periods that have no data (with a total of 0).", "تعمل <code>resample()</code> مثل <code>groupby()</code> على فهرس تاريخ، لكنها تفهم فترات التقويم وتنشئ أيضًا الفترات التي ليست فيها بيانات (بإجمالي 0)."),
          why: L("To see sales month by month and year by year.", "لرؤية المبيعات شهرًا بشهر وعامًا بعام."),
          code: ["resample"],
          lines: [
            ['merged.set_index("date")', L("Makes the date the index (row label). resample() needs a datetime index — which is why the conversion in Section 5 matters.", "يجعل التاريخ هو الفهرس (تسمية الصف). وتحتاج resample() إلى فهرس من نوع تاريخ — ولهذا يهم التحويل في القسم 5.")],
            ['["sales"]', L("We only need the sales column.", "نحتاج إلى عمود المبيعات فقط.")],
            ['.resample("MS")', L("“Month Start”: one group per calendar month, labelled with the first day of the month.", "«Month Start»: مجموعة لكل شهر تقويمي، تحمل تسمية اليوم الأول من الشهر.")],
            ['.resample("YS")', L("“Year Start”: one group per calendar year, labelled 1 January.", "«Year Start»: مجموعة لكل سنة تقويمية، تحمل تسمية 1 يناير.")],
            [".sum()", L("Adds up all sales in each period. Rows whose date could not be converted (NaT) are left out.", "يجمع كل المبيعات في كل فترة. وتُستبعد الصفوف التي تعذّر تحويل تاريخها (NaT).")],
          ],
          expect: `<pre class="py-out">date
YYYY-01-01    …
YYYY-02-01    …
Freq: MS, Name: sales, dtype: float64</pre>`,
          interpret: L("Compare the same months across years (seasonality) and full years with each other (trend). A first or last year that is not complete will look smaller — that is not a decline.", "قارن الأشهر نفسها عبر السنوات (الموسمية) والسنوات الكاملة ببعضها (الاتجاه). والسنة الأولى أو الأخيرة غير المكتملة ستبدو أصغر — وهذا ليس تراجعًا."),
          mistakes: [
            ["TypeError: Only valid with DatetimeIndex…", L("The index is not a datetime. Convert <code>date</code> with <code>pd.to_datetime</code> and use <code>set_index(\"date\")</code>.", "الفهرس ليس من نوع تاريخ. حوّل <code>date</code> باستخدام <code>pd.to_datetime</code> واستخدم <code>set_index(\"date\")</code>.")],
            ['resample("M")', L("“M” labels months by their <em>end</em> (and is being renamed to “ME” in new pandas versions). Use “MS” for month starts as in this lesson.", "«M» يسمّي الأشهر بـ<em>نهايتها</em> (ويُعاد تسميته «ME» في إصدارات pandas الجديدة). استخدم «MS» لبدايات الأشهر كما في هذا الدرس.")],
            [L("Comparing a partial year", "مقارنة سنة جزئية"), L("Check the date range first; compare partial years only for the same months.", "افحص نطاق التواريخ أولًا؛ وقارن السنوات الجزئية للأشهر نفسها فقط.")],
          ],
          business: L("Monthly totals are the basis of budgets, targets and forecasts (Lecture 1, Section 19).", "المجاميع الشهرية أساس الميزانيات والأهداف والتوقعات (المحاضرة 1، القسم 19)."),
        })}
        ${miniTable([L("", ""), "groupby()", "resample()"], [
          [L("Groups by", "يجمّع حسب"), L("the values of any column", "قيم أي عمود"), L("calendar periods of a datetime index", "فترات تقويمية لفهرس تاريخ")],
          [L("Empty periods", "الفترات الفارغة"), L("not shown", "لا تظهر"), L("shown (sum = 0)", "تظهر (المجموع = 0)")],
          [L("Typical use", "الاستخدام المعتاد"), L("stores, families, cities", "المتاجر والفئات والمدن"), L("days → weeks, months, years", "أيام ← أسابيع وأشهر وسنوات")],
        ])}</section>`,
      seeTitle: L("Results from your files: monthly and yearly sales", "النتائج من ملفاتك: المبيعات الشهرية والسنوية"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the monthly sales chart and yearly totals", "رسم المبيعات الشهرية والمجاميع السنوية"), R => `<div class="chart-card">${codeChip("py-ts")}<div class="chart-title">${L("Monthly total sales — monthly_sales", "إجمالي المبيعات الشهرية — monthly_sales")}</div><div id="py-ts-chart"></div></div>
          <h3 class="mt-3">yearly_sales</h3>${withCode("py-ys", pySpec("resample", "yearly_sales", L("the table", "الجدول")), miniTable([L("Year", "السنة"), { t: L("Total sales", "إجمالي المبيعات"), num: true }, L("Days covered", "الأيام المغطاة"), { t: L("Change vs previous full year", "التغيّر عن السنة الكاملة السابقة"), num: true }],
            R.yearly.map((y, i) => { const prev = R.yearly[i - 1]; return [y.year, fmt(y.total, 0), `${y.first} → ${y.last}${y.partial ? ` <span class="badge warn">${L("partial year", "سنة جزئية")}</span>` : ""}`, prev && !prev.partial && !y.partial ? fmtPct(share(y.total - prev.total, prev.total)) : "—"]; })))}`),
      results: SSR() ? (() => {
        const R = SSR(), fy = fullYears(R), mo = R.monthOfYear.filter(m => m.dates), peak = mo.reduce((a, b) => (b.avg > a.avg ? b : a)), low = mo.reduce((a, b) => (b.avg < a.avg ? b : a));
        const growth = fy.length >= 2 ? share(fy[fy.length - 1].total - fy[0].total, fy[0].total) : NaN;
        return `<ul class="mb-0">
          <li>${fy.length >= 2 ? L(`Between the full years ${fy[0].year} and ${fy[fy.length - 1].year}, total sales changed by <strong>${fmtPct(growth)}</strong>.`, `بين السنتين الكاملتين ${fy[0].year} و ${fy[fy.length - 1].year}، تغيّر إجمالي المبيعات بنسبة <strong>${fmtPct(growth)}</strong>.`) : L("There are fewer than two complete calendar years, so year-on-year growth is not reported.", "توجد أقل من سنتين تقويميتين كاملتين، لذلك لا يُعرض النمو السنوي.")}</li>
          ${R.yearly.some(y => y.partial) ? `<li>${L(`Partial years (${R.yearly.filter(y => y.partial).map(y => y.year).join(", ")}) are marked: their totals are smaller because they cover fewer days, not necessarily because sales fell.`, `السنوات الجزئية (${R.yearly.filter(y => y.partial).map(y => y.year).join("، ")}) مُعلَّمة: مجاميعها أصغر لأنها تغطي أيامًا أقل، لا بالضرورة لأن المبيعات انخفضت.`)}</li>` : ""}
          <li>${L(`Per day, the strongest month of the year on average is <strong>${MONTHS()[peak.month - 1]}</strong> and the weakest is <strong>${MONTHS()[low.month - 1]}</strong> — a possible seasonal pattern to confirm year by year in the chart.`, `لكل يوم، أقوى شهر في السنة في المتوسط هو <strong>${MONTHS()[peak.month - 1]}</strong> وأضعفها <strong>${MONTHS()[low.month - 1]}</strong> — نمط موسمي محتمل يجب تأكيده سنة بسنة في الرسم.`)}</li>
          <li>${L("Look in the chart for single months far below their neighbours: they often reveal missing data or closures rather than real drops.", "ابحث في الرسم عن أشهر منفردة أدنى بكثير من جاراتها: فهي تكشف غالبًا بيانات مفقودة أو إغلاقات لا انخفاضات حقيقية.")}</li></ul>`;
      })() : pending(L("trend summary", "ملخص الاتجاه")),
      remember: L("Datetime index → resample(\"MS\" or \"YS\") → sum. Compare full years only, and the same months across years.", "فهرس تاريخ ← resample(\"MS\" أو \"YS\") ← sum. وقارن السنوات الكاملة فقط، والأشهر نفسها عبر السنوات."),
      quiz: { q: L("The last year in your data is much lower than the others. What do you check first?", "السنة الأخيرة في بياناتك أقل بكثير من غيرها. ماذا تفحص أولًا؟"), options: [
        { t: L("Whether the year is complete (the date range)", "ما إذا كانت السنة كاملة (نطاق التواريخ)"), ok: true, why: L("A partial year naturally has a smaller total.", "السنة الجزئية لها مجموع أصغر بطبيعة الحال.") },
        { t: L("Report a sales collapse", "أبلغ عن انهيار في المبيعات"), why: L("Not before checking coverage.", "ليس قبل فحص التغطية.") }] },
    });
    const R = SSR();
    if (!R) return;
    setCode("py-ts", pySpec("viz_monthly", L("Monthly sales over time", "المبيعات الشهرية عبر الزمن"), L("the chart", "الرسم")));
    Charts.line(root.querySelector("#py-ts-chart"), { labels: R.monthly.map(m => m[0]), series: [{ name: L("Total sales", "إجمالي المبيعات"), values: R.monthly.map(m => m[1]), cls: "c1", dots: R.monthly.length <= 80 }], height: 300, yLabel: L("Total sales", "إجمالي المبيعات"), label: L("Monthly total sales", "إجمالي المبيعات الشهرية") });
  },
});

/* =====================================================================
   11 — Statistics and outlier detection
   ===================================================================== */
Lec.add({
  id: "py-outliers", num: 11, aliases: ["outliers-python", "iqr"],
  title: { en: "Statistical Analysis and Outlier Detection", ar: "التحليل الإحصائي واكتشاف القيم المتطرفة" },
  short: { en: "Statistics & outliers", ar: "الإحصاء والقيم المتطرفة" },
  summary: { en: "count, mean, median, std, min, max — and the IQR method for unusual values.", ar: "العدد والمتوسط والوسيط والانحراف المعياري والحد الأدنى والأعلى — وطريقة IQR للقيم غير المعتادة." },
  render(root) {
    const st = getState("py-outliers", { k: 0 });
    root.innerHTML = lesson(this, {
      simple: L("Six summary numbers describe the sales column: how many values, the typical value (mean and median), how spread out they are (standard deviation) and the extremes. The <strong>IQR method</strong> then flags values far outside the middle half of the data as <strong>potential</strong> outliers — values to look at, not to delete.",
        "ستة أرقام موجزة تصف عمود المبيعات: عدد القيم، والقيمة النموذجية (المتوسط والوسيط)، ومدى تشتتها (الانحراف المعياري)، والقيم القصوى. ثم تحدد <strong>طريقة IQR</strong> القيم البعيدة عن النصف الأوسط من البيانات بوصفها قيمًا متطرفة <strong>محتملة</strong> — قيمًا للنظر فيها لا للحذف."),
      why: [L("The mean alone can mislead when a few values are huge.", "المتوسط وحده قد يضلّل عندما تكون قيم قليلة ضخمة."), L("Unusual values are often the most interesting part of the data: big orders, holidays, errors.", "القيم غير المعتادة غالبًا أكثر أجزاء البيانات إثارة للاهتمام: طلبات كبيرة أو عطل أو أخطاء.")],
      extra: `<section class="block">${concept({
          title: L("Descriptive statistics", "الإحصاء الوصفي"),
          what: L("<code>agg([...])</code> calculates several statistics of one column at once.", "تحسب <code>agg([...])</code> عدة إحصاءات لعمود واحد دفعة واحدة."),
          why: L("To describe what a typical record looks like and how much records differ.", "لوصف شكل السجل النموذجي ومدى اختلاف السجلات."),
          code: ["stats"],
          lines: [
            ['"count"', L("Number of non-missing sales values.", "عدد قيم المبيعات غير المفقودة.")],
            ['"mean"', L("The arithmetic average: sum ÷ count. Pulled up by very large values.", "المتوسط الحسابي: المجموع ÷ العدد. وترفعه القيم الكبيرة جدًا.")],
            ['"median"', L("The middle value when sorted: half the records are below it. Not affected by extremes.", "القيمة الوسطى بعد الترتيب: نصف السجلات أقل منها. ولا تتأثر بالقيم القصوى.")],
            ['"std"', L("Standard deviation: the typical distance of values from the mean. Large = very spread out.", "الانحراف المعياري: المسافة النموذجية للقيم عن المتوسط. وكبره يعني تشتتًا كبيرًا.")],
            ['"min", "max"', L("The smallest and largest values — check that they are plausible.", "أصغر قيمة وأكبرها — تحقّق من أنهما معقولتان.")],
          ],
          business: L("Reporting the median next to the mean gives managers a realistic picture of a “typical” day.", "عرض الوسيط إلى جانب المتوسط يعطي المديرين صورة واقعية عن اليوم «النموذجي»."),
        })}
        ${concept({
          title: L("The IQR method for potential outliers", "طريقة IQR للقيم المتطرفة المحتملة"),
          what: L("Q1 and Q3 are the values below which 25% and 75% of records fall. The interquartile range IQR = Q3 − Q1 is the width of the middle half. Values below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR are flagged.", "Q1 وQ3 هما القيمتان اللتان يقع تحتهما 25% و75% من السجلات. والمدى الربيعي IQR = Q3 − Q1 هو عرض النصف الأوسط. وتُعلَّم القيم الأقل من Q1 − 1.5 × IQR أو الأعلى من Q3 + 1.5 × IQR."),
          why: L("A simple, transparent rule that does not depend on the data being bell-shaped.", "قاعدة بسيطة وشفافة لا تعتمد على أن تكون البيانات جرسية الشكل."),
          code: ["iqr"],
          lines: [
            ['merged["sales"].quantile(0.25)', L("Q1: 25% of sales records are at or below this value.", "Q1: ‏25% من سجلات المبيعات عند هذه القيمة أو أقل.")],
            ["iqr = q3 - q1", L("The spread of the middle 50% of records.", "تشتت الـ50% الوسطى من السجلات.")],
            ["lower_bound = q1 - 1.5 * iqr", L("The lower fence. For sales it is often negative — so no low outliers are possible.", "السياج الأدنى. وهو غالبًا سالب في المبيعات — فلا يمكن وجود قيم متطرفة منخفضة.")],
            ["upper_bound = q3 + 1.5 * iqr", L("The upper fence: values above it are flagged.", "السياج الأعلى: تُعلَّم القيم التي فوقه.")],
            ["merged[(…) | (…)]", L("Keeps rows below the lower fence <em>or</em> (<code>|</code>) above the upper fence. Each condition needs its own brackets.", "يحتفظ بالصفوف الأدنى من السياج الأدنى <em>أو</em> (<code>|</code>) الأعلى من السياج الأعلى. ويحتاج كل شرط إلى أقواسه الخاصة.")],
          ],
          expect: `<pre class="py-out">Potential outliers: N</pre>`,
          interpret: L("Retail sales are strongly right-skewed: many small or zero records and a long tail of large ones. The IQR rule therefore flags many records, mostly large stores and big product families on busy days. They are <strong>potential</strong> outliers — real sales, not errors, unless an investigation shows otherwise.", "مبيعات التجزئة ملتوية بقوة إلى اليمين: سجلات كثيرة صغيرة أو صفرية وذيل طويل من السجلات الكبيرة. لذا تعلّم قاعدة IQR سجلات كثيرة، معظمها لمتاجر كبيرة وفئات منتجات كبيرة في أيام مزدحمة. إنها قيم متطرفة <strong>محتملة</strong> — مبيعات حقيقية لا أخطاء، ما لم يُظهر التحقيق غير ذلك."),
          mistakes: [
            ['merged[merged["sales"] < lower_bound | merged["sales"] > upper_bound]', L("Missing brackets around each condition gives a TypeError or wrong result. Write <code>(…) | (…)</code>.", "غياب الأقواس حول كل شرط يعطي TypeError أو نتيجة خاطئة. اكتب <code>(…) | (…)</code>.")],
            [L("merged = merged[~outlier_mask]  # “clean” the data", "merged = merged[~outlier_mask]  # «تنظيف» البيانات"), L("Removing outliers removes your biggest real sales and lowers every total. Remove only values proven to be errors, and log it.", "إزالة القيم المتطرفة تزيل أكبر مبيعاتك الحقيقية وتخفض كل المجاميع. لا تُزِل إلا القيم التي ثبت أنها أخطاء، وسجّل ذلك.")],
          ],
          business: L("Flagged records are a list for investigation: a data-entry error, a holiday, a bulk order or a store event — each leads to a different action.", "السجلات المعلَّمة قائمة للتحقيق: خطأ إدخال أو عطلة أو طلب جملة أو حدث في المتجر — ولكل منها إجراء مختلف."),
        })}</section>`,
      seeTitle: L("Results from your files: statistics and IQR fences", "النتائج من ملفاتك: الإحصاءات وأسوار IQR"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the summary statistics and the IQR outlier count", "الإحصاءات الموجزة وعدد القيم المتطرفة بطريقة IQR"), R => {
        const s = R.stats, f = s.fences[st.k];
        return `<h3>sales_stats</h3><div class="stat-grid">${[["count", fmtInt(s.count)], ["mean", f2(s.mean)], ["median", f2(s.median)], ["std", f2(s.std)], ["min", f2(s.min)], ["max", f2(s.max)]].map(([k, v]) => stat(k, v, "", pySpec("stats", `sales ${k}`, v))).join("")}</div>
          <h3 class="mt-3">${L("IQR fences", "أسوار IQR")}</h3>
          <div class="controls">${segmented("iqr-k", [{ value: 0, label: "1.5 × IQR" }, { value: 1, label: L("3 × IQR (extreme only)", "3 × IQR (المتطرفة جدًا فقط)") }], st.k, L("Fence multiplier", "معامل السياج"))}</div>
          <div class="stat-grid">
            ${stat("q1", f2(s.q1), "25%", pySpec("iqr", "q1", f2(s.q1)))}${stat("q3", f2(s.q3), "75%", pySpec("iqr", "q3", f2(s.q3)))}${stat("iqr", f2(s.iqr), "q3 − q1", pySpec("iqr", "iqr", f2(s.iqr)))}
            ${stat("lower_bound", f2(f.lower), f.lower < s.min ? L("below the minimum", "أدنى من الحد الأدنى") : "", pySpec("iqr", "lower_bound", f2(f.lower)))}${stat("upper_bound", f2(f.upper), "", pySpec("iqr", "upper_bound", f2(f.upper)))}
            ${stat(L("Potential outliers", "قيم متطرفة محتملة"), fmtInt(f.count), fmtPct(share(f.count, s.count)) + L(" of records", " من السجلات"), pySpec("iqr", L("Potential outliers", "قيم متطرفة محتملة"), fmtInt(f.count)))}
          </div>
          ${st.k === 1 ? `<p class="small muted">${L("The 3 × IQR version is not in the Python code above: replace 1.5 with 3 in both bounds.", "نسخة 3 × IQR ليست في كود بايثون أعلاه: استبدل 1.5 بـ3 في الحدّين.")}</p>` : ""}`;
      }),
      results: SSR() ? (() => { const s = SSR().stats, f = s.fences[0]; return `<p class="mb-0">${L(`The mean (${f2(s.mean)}) is ${s.median ? fmt(s.mean / s.median, 1) + " times" : "far above"} the median (${f2(s.median)}) and the standard deviation (${f2(s.std)}) is larger than the mean: a strongly right-skewed distribution. With 1.5 × IQR, <strong>${fmtInt(f.count)}</strong> records (${fmtPct(share(f.count, s.count))}) are potential outliers${f.low ? "" : ", all of them above the upper fence"}. That many flags is a property of skewed sales data, not a sign of that many errors — investigate a sample before deciding anything.`, `المتوسط (${f2(s.mean)}) ${s.median ? `يساوي ${fmt(s.mean / s.median, 1)} ضعف` : "أعلى بكثير من"} الوسيط (${f2(s.median)})، والانحراف المعياري (${f2(s.std)}) أكبر من المتوسط: توزيع ملتوٍ بقوة إلى اليمين. ومع 1.5 × IQR هناك <strong>${fmtInt(f.count)}</strong> سجلًا (${fmtPct(share(f.count, s.count))}) قيمًا متطرفة محتملة${f.low ? "" : "، وكلها فوق السياج الأعلى"}. وهذا العدد الكبير من العلامات خاصية لبيانات المبيعات الملتوية، لا دليل على هذا العدد من الأخطاء — حقّق في عينة قبل أن تقرر شيئًا.`)}</p>`; })() : pending(L("outlier summary", "ملخص القيم المتطرفة")),
      remember: L("Report the median with the mean. An IQR flag means “look at this”, not “delete this”.", "اعرض الوسيط مع المتوسط. وعلامة IQR تعني «انظر إلى هذا» لا «احذف هذا»."),
      quiz: { q: L("The IQR rule flags 8% of sales records. What is the right next step?", "تعلّم قاعدة IQR نسبة 8% من سجلات المبيعات. ما الخطوة التالية الصحيحة؟"), options: [
        { t: L("Delete them to make the averages cleaner", "احذفها لتصبح المتوسطات أنظف"), why: L("That removes real, important sales.", "هذا يزيل مبيعات حقيقية ومهمة.") },
        { t: L("Look at which stores, families and dates they come from, and check a sample with the business", "انظر من أي متاجر وفئات وتواريخ تأتي، وافحص عينة مع أصحاب العمل"), ok: true, why: L("Understanding comes before any removal.", "الفهم يأتي قبل أي إزالة.") }] },
    });
    root.querySelectorAll('[data-seg="iqr-k"] button').forEach(b => b.addEventListener("click", () => { st.k = +b.dataset.value; this.render(root); root.querySelector(`[data-seg="iqr-k"] [data-value="${st.k}"]`).focus(); }));
  },
});

/* =====================================================================
   12 — Data visualisation
   ===================================================================== */
const VIZ = () => [
  { id: "monthly", key: "viz_monthly", t: L("Monthly sales (line)", "المبيعات الشهرية (خط)"), why: L("Shows the trend and the yearly rhythm (seasonality) at a glance.", "يُظهر الاتجاه والإيقاع السنوي (الموسمية) بلمحة."), read: L("Look for the long-term direction, repeating peaks in the same months and sudden drops (missing data or closures?).", "ابحث عن الاتجاه طويل المدى، والذروات المتكررة في الأشهر نفسها، والانخفاضات المفاجئة (بيانات مفقودة أو إغلاق؟).") },
  { id: "stores", key: "viz_stores", t: L("Top 10 stores (bar)", "أعلى 10 متاجر (أعمدة)"), why: L("Compares the biggest contributors.", "يقارن أكبر المساهمين."), read: L("Bar length = total sales. Seaborn orders numeric store numbers ascending; add <code>order=top_stores[\"store_nbr\"]</code> to keep the ranking order.", "طول العمود = إجمالي المبيعات. ويرتّب seaborn أرقام المتاجر الرقمية تصاعديًا؛ أضف <code>order=top_stores[\"store_nbr\"]</code> للحفاظ على ترتيب الأعلى.") },
  { id: "families", key: "viz_families", t: L("Top 10 product families (bar)", "أعلى 10 فئات منتجات (أعمدة)"), why: L("Shows which product groups drive the business. Horizontal bars keep long names readable.", "يُظهر مجموعات المنتجات التي تقود العمل. والأعمدة الأفقية تُبقي الأسماء الطويلة مقروءة."), read: L("Compare the first bar with the rest: a big gap means strong concentration.", "قارن العمود الأول بالبقية: الفجوة الكبيرة تعني تركّزًا قويًا.") },
  { id: "hist", key: "viz_hist", t: L("Sales distribution (histogram)", "توزيع المبيعات (مدرج تكراري)"), why: L("Shows how often each size of sales record occurs.", "يُظهر عدد مرات ظهور كل حجم من سجلات المبيعات."), read: L("A tall first bar and a long tail to the right = right-skewed: most records are small, a few are very large. Computed on all records.", "عمود أول طويل وذيل طويل إلى اليمين = التواء إلى اليمين: معظم السجلات صغيرة وقليل منها كبير جدًا. محسوب على كل السجلات.") },
  { id: "scatter", key: "viz_scatter", t: L("Promotions vs sales (scatter)", "التخفيضات مقابل المبيعات (انتشار)"), why: L("Explores whether records with more promoted items tend to have higher sales.", "يستكشف ما إذا كانت السجلات ذات الأصناف المخفّضة الأكثر تميل إلى مبيعات أعلى."), read: L("Each dot is one record from a random sample of 5,000 — plotting millions of points would be unreadable. Judge the pattern from the full-data numbers below the chart.", "كل نقطة سجل واحد من عينة عشوائية من 5,000 — فرسم ملايين النقاط لن يكون مقروءًا. احكم على النمط من أرقام البيانات الكاملة تحت الرسم.") },
  { id: "compare", key: "viz_compare", t: L("Cities and store types (bar)", "المدن وأنواع المتاجر (أعمدة)"), why: L("Compares groups of stores; covered in detail in Section 13.", "يقارن مجموعات المتاجر؛ ويُشرح بالتفصيل في القسم 13."), read: L("Compare totals with averages per store: a group with many stores can have a large total but a modest average.", "قارن المجاميع بالمتوسطات لكل متجر: المجموعة ذات المتاجر الكثيرة قد يكون مجموعها كبيرًا لكن متوسطها متواضع.") },
];
Lec.add({
  id: "py-visualization", num: 12, aliases: ["visualisation", "charts-python"],
  title: { en: "Data Visualization with Matplotlib and Seaborn", ar: "التمثيل البصري للبيانات باستخدام Matplotlib و Seaborn" },
  short: { en: "Data visualization", ar: "التمثيل البصري" },
  summary: { en: "Six charts — line, bars, histogram, scatter — and how to read each one.", ar: "ستة رسوم — خطي وأعمدة ومدرج تكراري وانتشار — وكيف تقرأ كلًا منها." },
  render(root) {
    const st = getState("py-viz", { chart: "monthly" }), list = VIZ(), cur = list.find(v => v.id === st.chart);
    root.innerHTML = lesson(this, {
      simple: L("A good chart answers one question at a glance. We use <strong>Matplotlib</strong> for the basics (titles, labels, layout) and <strong>seaborn</strong> for statistical charts with little code. Choose the chart from the question: change over time → line; compare groups → bars; distribution → histogram; relationship → scatter.",
        "الرسم الجيد يجيب عن سؤال واحد بلمحة. نستخدم <strong>Matplotlib</strong> للأساسيات (العناوين والتسميات والتخطيط) و<strong>seaborn</strong> للرسوم الإحصائية بكود قليل. اختر الرسم من السؤال: التغيّر عبر الزمن ← خطي؛ مقارنة مجموعات ← أعمدة؛ التوزيع ← مدرج تكراري؛ العلاقة ← انتشار."),
      why: [L("Managers remember a clear chart far better than a table of numbers.", "يتذكر المديرون الرسم الواضح أفضل بكثير من جدول أرقام."), L("Charts reveal problems (gaps, spikes) that summary numbers hide.", "تكشف الرسوم مشكلات (فجوات وقفزات) تخفيها الأرقام الموجزة.")],
      extra: `<section class="block"><h2>${L("Choose a chart", "اختر رسمًا")}</h2>
        <div class="controls">${segmented("viz", list.map(v => ({ value: v.id, label: v.t })), st.chart, L("Chart", "الرسم"))}</div>
        <div class="grid grid-2 py-viz-grid"><div>${pyCode(cur.key)}${cur.id === "scatter" ? pyCode("promo_compare", L("Python · the same question on the full data", "بايثون · السؤال نفسه على البيانات الكاملة")) : ""}</div>
          <div class="card"><h3 class="mt-0">${cur.t}</h3><p><strong>${L("Purpose:", "الغرض:")}</strong> ${cur.why}</p><p class="mb-0"><strong>${L("How to read it:", "كيف تقرؤه:")}</strong> ${cur.read}</p>
          ${cur.id === "scatter" ? callout("warn", L("Correlation is not causation", "الارتباط ليس سببية"), `<p class="mb-0">${L("Even if records with promotions sell more, promotions may simply be placed on products and days that already sell well. Proving an effect needs a fair comparison (for example, the same products with and without promotion, or a planned test).", "حتى لو باعت السجلات ذات التخفيضات أكثر، فقد تكون التخفيضات وُضعت ببساطة على منتجات وأيام تبيع جيدًا أصلًا. وإثبات الأثر يحتاج إلى مقارنة عادلة (مثل المنتجات نفسها مع التخفيض ودونه، أو اختبار مخطط له).")}</p>`) : ""}</div></div>
        ${more(L("Chart checklist before you share it", "قائمة فحص الرسم قبل مشاركته"), `<ul class="mb-0"><li>${L("A title that states the question; labelled axes with units.", "عنوان يذكر السؤال؛ ومحاور مسماة بوحداتها.")}</li><li>${L("Say if it shows a sample or all the data, and which period.", "اذكر ما إذا كان يعرض عينة أم كل البيانات، وأي فترة.")}</li><li>${L("Bars start at zero; do not cut the axis to exaggerate differences.", "تبدأ الأعمدة من الصفر؛ لا تقطع المحور لتضخيم الفروق.")}</li><li>${L("<code>plt.tight_layout()</code> stops long labels from being cut off.", "تمنع <code>plt.tight_layout()</code> قص التسميات الطويلة.")}</li></ul>`)}
        ${more(L("Common mistakes", "أخطاء شائعة"), mistakes([
          ["NameError: name 'monthly_sales' is not defined", L("Charts use results from earlier sections (monthly_sales from Section 10, sales_by_store from 21). Run those cells first.", "تستخدم الرسوم نتائج من أقسام سابقة (monthly_sales من القسم 10 و sales_by_store من 21). شغّل تلك الخلايا أولًا.")],
          [L("Two charts drawn on top of each other", "رسمان فوق بعضهما"), L("Call <code>plt.show()</code> after each chart (or create a new figure with <code>plt.figure()</code>).", "استدعِ <code>plt.show()</code> بعد كل رسم (أو أنشئ شكلًا جديدًا باستخدام <code>plt.figure()</code>).")],
          [L("The histogram takes very long", "المدرج التكراري يستغرق وقتًا طويلًا جدًا"), L("<code>kde=True</code> on millions of rows is slow. Use the sample, or <code>kde=False</code>.", "<code>kde=True</code> على ملايين الصفوف بطيء. استخدم العينة، أو <code>kde=False</code>.")],
        ]))}</section>`,
      seeTitle: L("Results from your files: the chart", "النتائج من ملفاتك: الرسم"), seeNote: LIVE_NOTE(),
      see: liveSee(L("this chart drawn from your data", "هذا الرسم مرسومًا من بياناتك"), R => `<div class="chart-card">${codeChip("py-viz")}<div class="chart-title">${cur.t}</div>${cur.id === "scatter" ? `<div class="chart-sub">${L(`Random sample of ${fmtInt(R.promo.sampleSize)} records (seeded) — not the same rows pandas picks with random_state=42.`, `عينة عشوائية من ${fmtInt(R.promo.sampleSize)} سجل (ببذرة ثابتة) — ليست الصفوف نفسها التي تختارها pandas مع random_state=42.`)}</div>` : cur.id === "hist" ? `<div class="chart-sub">${L(`All ${fmtInt(R.stats.count)} records in 50 equal-width bins from ${f2(R.hist.min)} to ${f2(R.hist.max)}.`, `كل السجلات (${fmtInt(R.stats.count)}) في 50 فئة متساوية العرض من ${f2(R.hist.min)} إلى ${f2(R.hist.max)}.`)}</div>` : ""}<div id="py-viz-chart"></div></div>
        ${cur.id === "scatter" ? `<div class="stat-grid mt-2">${stat(L("Mean sales, no promotion", "متوسط المبيعات دون تخفيض"), f2(R.promo.meanNoPromo), `${fmtInt(R.promo.nNoPromo)} ${L("records", "سجل")}`, pySpec("promo_compare", L("Mean sales without promotion", "متوسط المبيعات دون تخفيض"), f2(R.promo.meanNoPromo)))}${stat(L("Mean sales, with promotion", "متوسط المبيعات مع تخفيض"), f2(R.promo.meanPromo), `${fmtInt(R.promo.nPromo)} ${L("records", "سجل")}`, pySpec("promo_compare", L("Mean sales with promotion", "متوسط المبيعات مع تخفيض"), f2(R.promo.meanPromo)))}${stat(L("Correlation (all records)", "الارتباط (كل السجلات)"), fmt(R.promo.r, 3), "Pearson r", pySpec("promo_compare", "Correlation", fmt(R.promo.r, 3)))}</div>` : ""}`),
      results: SSR() ? `<p class="mb-0">${{
        monthly: L("Read the line from left to right: the overall direction is the trend; peaks that return every year are seasonality.", "اقرأ الخط من اليسار إلى اليمين: الاتجاه العام هو الاتجاه؛ والذروات التي تعود كل عام هي الموسمية."),
        stores: L(`Store ${SSR().byStore[0].store} leads with ${compact(SSR().byStore[0].total)}; the 10th store has ${compact(SSR().byStore[Math.min(9, SSR().byStore.length - 1)].total)}.`, `يتصدر المتجر ${SSR().byStore[0].store} بمبلغ ${compact(SSR().byStore[0].total)}؛ وللمتجر العاشر ${compact(SSR().byStore[Math.min(9, SSR().byStore.length - 1)].total)}.`),
        families: L(`${esc(SSR().byFamily[0].family)} is the largest family with ${fmtPct(share(SSR().byFamily[0].total, totalSales(SSR())))} of all sales.`, `${esc(SSR().byFamily[0].family)} هي أكبر فئة بنسبة ${fmtPct(share(SSR().byFamily[0].total, totalSales(SSR())))} من كل المبيعات.`),
        hist: L(`${fmtPct(share(SSR().hist.counts[0], SSR().stats.count))} of all records fall in the first bin (the smallest values, including the ${fmtInt(SSR().stats.zeros)} zero-sales records). The distribution is strongly right-skewed.`, `${fmtPct(share(SSR().hist.counts[0], SSR().stats.count))} من كل السجلات تقع في الفئة الأولى (أصغر القيم، بما في ذلك ${fmtInt(SSR().stats.zeros)} سجلًا بمبيعات صفرية). والتوزيع ملتوٍ بقوة إلى اليمين.`),
        scatter: L(`On all records, the correlation between items on promotion and sales is r = ${fmt(SSR().promo.r, 3)}, and records with at least one promoted item have mean sales of ${f2(SSR().promo.meanPromo)} vs ${f2(SSR().promo.meanNoPromo)} without. This is an association — not proof that promotions cause the difference.`, `على كل السجلات، الارتباط بين الأصناف المخفّضة والمبيعات r = ${fmt(SSR().promo.r, 3)}، ومتوسط مبيعات السجلات التي فيها صنف مخفّض واحد على الأقل ${f2(SSR().promo.meanPromo)} مقابل ${f2(SSR().promo.meanNoPromo)} دونها. هذا ارتباط — لا دليل على أن التخفيضات سبب الفرق.`),
        compare: L(`Type ${esc(SSR().byType[0].key)} has the highest total; see Section 13 for the fairer per-store comparison.`, `للنوع ${esc(SSR().byType[0].key)} أعلى مجموع؛ وانظر القسم 13 للمقارنة الأعدل لكل متجر.`),
      }[cur.id]}</p>` : pending(L("chart reading", "قراءة الرسم")),
      remember: L("Pick the chart from the question, label it fully, and say whether it shows a sample or all the data.", "اختر الرسم من السؤال، وسمِّه بالكامل، واذكر ما إذا كان يعرض عينة أم كل البيانات."),
      quiz: { q: L("Which chart best shows how sales changed month by month?", "أي رسم يُظهر أفضل تغيّر المبيعات شهرًا بشهر؟"), options: [
        { t: L("Line chart", "الرسم الخطي"), ok: true, why: L("Lines show change over ordered time.", "الخطوط تُظهر التغيّر عبر زمن مرتب.") },
        { t: L("Histogram", "المدرج التكراري"), why: L("A histogram shows a distribution, not time.", "المدرج التكراري يُظهر توزيعًا لا زمنًا.") },
        { t: L("Scatter plot", "رسم الانتشار"), why: L("Scatter shows the relationship between two numbers.", "الانتشار يُظهر العلاقة بين رقمين.") }] },
    });
    root.querySelectorAll('[data-seg="viz"] button').forEach(b => b.addEventListener("click", () => { st.chart = b.dataset.value; this.render(root); root.querySelector(`[data-seg="viz"] [data-value="${st.chart}"]`).focus(); }));
    const R = SSR(), el = root.querySelector("#py-viz-chart");
    if (!R || !el) return;
    setCode("py-viz", pySpec(cur.key, cur.t, L("the chart", "الرسم")));
    if (cur.id === "monthly") Charts.line(el, { labels: R.monthly.map(m => m[0]), series: [{ name: L("Total sales", "إجمالي المبيعات"), values: R.monthly.map(m => m[1]), cls: "c1", dots: R.monthly.length <= 80 }], height: 300, yLabel: L("Total Sales", "إجمالي المبيعات"), xLabel: L("Month", "الشهر") });
    if (cur.id === "stores") Charts.bar(el, { data: R.byStore.slice(0, 10).map(s => ({ label: String(s.store), value: s.total })), format: compact, yLabel: L("Total Sales", "إجمالي المبيعات"), xLabel: L("Store Number", "رقم المتجر"), height: 300 });
    if (cur.id === "families") Charts.bar(el, { horizontal: true, data: R.byFamily.slice(0, 10).map(f => ({ label: f.family, value: f.total })), format: compact, labelWidth: 180 });
    if (cur.id === "hist") { const w = (R.hist.max - R.hist.min) / R.hist.counts.length; Charts.bar(el, { data: R.hist.counts.map((c, i) => ({ label: i % 10 === 0 ? compact(R.hist.min + i * w) : "", value: c, tip: `${compact(R.hist.min + i * w)} – ${compact(R.hist.min + (i + 1) * w)}: ${fmtInt(c)}` })), hideValues: true, format: compact, yLabel: L("Frequency", "التكرار"), xLabel: L("Sales", "المبيعات"), height: 300 }); }
    if (cur.id === "scatter") Charts.scatter(el, { points: R.promo.sample.map(([x, y]) => ({ x, y })), xLabel: L("Items on Promotion", "الأصناف المخفّضة"), yLabel: L("Sales", "المبيعات"), opacity: .35, height: 320 });
    if (cur.id === "compare") Charts.bar(el, { data: R.byType.map(t => ({ label: `${L("Type", "النوع")} ${t.key}`, value: t.total })), format: compact, yLabel: L("Total Sales", "إجمالي المبيعات"), height: 280 });
  },
});

/* =====================================================================
   13 — Comparing cities and store types
   ===================================================================== */
Lec.add({
  id: "py-compare", num: 13, aliases: ["store-types", "cities"],
  title: { en: "Comparing Cities and Store Types", ar: "مقارنة المدن وأنواع المتاجر" },
  short: { en: "Cities & store types", ar: "المدن وأنواع المتاجر" },
  summary: { en: "Totals vs. a fair metric: average daily sales per store.", ar: "المجاميع مقابل مقياس عادل: متوسط المبيعات اليومية لكل متجر." },
  render(root) {
    const st = getState("py-compare", { metric: "fair" });
    root.innerHTML = lesson(this, {
      simple: L("Comparing totals between groups is easy — and often unfair. A store type with 18 stores will usually sell more in total than a type with 4, even if each of its stores sells less. A fairer question is: <strong>how much does one store of this type sell on a typical day?</strong>",
        "مقارنة المجاميع بين المجموعات سهلة — وغالبًا غير عادلة. فنوع متاجر فيه 18 متجرًا سيبيع عادةً إجمالًا أكثر من نوع فيه 4، حتى لو باع كل متجر منه أقل. والسؤال الأعدل: <strong>كم يبيع متجر واحد من هذا النوع في يوم نموذجي؟</strong>"),
      why: [L("Totals depend on how many stores, records and days each group has.", "المجاميع تعتمد على عدد المتاجر والسجلات والأيام في كل مجموعة."), L("Decisions such as “which format should we open next?” need a per-store comparison.", "قرارات مثل «أي شكل متجر نفتتح تاليًا؟» تحتاج إلى مقارنة لكل متجر.")],
      extra: `<section class="block">${concept({
          title: L("Total sales by store type", "إجمالي المبيعات حسب نوع المتجر"),
          what: L("The group total for each store type.", "مجموع كل نوع من أنواع المتاجر."),
          why: L("Shows each type's share of the business.", "يُظهر حصة كل نوع من العمل."),
          code: ["compare_type"],
          business: L("Good for “where does our revenue come from?” — not for “which type performs best?”.", "مناسب لسؤال «من أين تأتي إيراداتنا؟» — لا لسؤال «أي نوع أفضل أداءً؟»."),
        })}
        ${concept({
          title: L("A fair metric: average daily sales per store", "مقياس عادل: متوسط المبيعات اليومية لكل متجر"),
          what: L("First each store's total for each day (a “store-day”), then the average of those store-days within each group. Mathematically: group total ÷ number of store-days.", "أولًا إجمالي كل متجر لكل يوم («يوم-متجر»)، ثم متوسط أيام-المتجر داخل كل مجموعة. رياضيًا: مجموع المجموعة ÷ عدد أيام-المتجر."),
          why: L("It removes the effect of how many stores a group has and how long they were open.", "يزيل أثر عدد المتاجر في المجموعة ومدة عملها."),
          code: ["compare_fair", "viz_compare"],
          lines: [
            ['groupby(["store_nbr", "city", "type", "date"])', L("One row per store per day. city and type are included only to keep them available for the next step.", "صف لكل متجر لكل يوم. وتُضمَّن city و type فقط لإبقائهما متاحتين للخطوة التالية.")],
            ['stores=("store_nbr", "nunique")', L("How many different stores are in the group.", "عدد المتاجر المختلفة في المجموعة.")],
            ['store_days=("sales", "count")', L("How many store-days the average is based on.", "عدد أيام-المتجر التي يستند إليها المتوسط.")],
            ['avg_daily_sales_per_store=("sales", "mean")', L("The fair metric.", "المقياس العادل.")],
          ],
          mistakes: [
            [L("Dividing the total by the number of stores only", "قسمة المجموع على عدد المتاجر فقط"), L("Stores opened at different times have different numbers of days; divide by store-days instead.", "المتاجر التي افتُتحت في أوقات مختلفة لها أعداد أيام مختلفة؛ اقسم على أيام-المتجر بدلًا من ذلك.")],
            [L("Ranking groups with one store", "ترتيب مجموعات فيها متجر واحد"), L("A city with one store reflects that single store. Show the number of stores next to every average.", "المدينة ذات المتجر الواحد تعكس ذلك المتجر وحده. اعرض عدد المتاجر بجانب كل متوسط.")],
          ],
          business: L("This is the number to discuss when comparing formats or locations; totals are for describing the size of the business.", "هذا هو الرقم الذي يُناقش عند مقارنة الأشكال أو المواقع؛ أما المجاميع فلوصف حجم العمل."),
        })}</section>`,
      seeTitle: L("Results from your files: store types and cities", "النتائج من ملفاتك: أنواع المتاجر والمدن"), seeNote: LIVE_NOTE(),
      see: liveSee(L("the comparison of store types and cities", "مقارنة أنواع المتاجر والمدن"), R => `<div class="controls">${segmented("cmp-metric", [{ value: "fair", label: L("Average daily sales per store", "متوسط المبيعات اليومية لكل متجر") }, { value: "total", label: "total_sales" }], st.metric, L("Metric", "المقياس"))}</div>
          <div class="grid grid-2"><div class="chart-card">${codeChip("py-cmp-type")}<div class="chart-title">${L("By store type", "حسب نوع المتجر")}</div><div id="cmp-type-chart"></div></div>
          <div class="chart-card">${codeChip("py-cmp-city")}<div class="chart-title">${L("Top 10 cities", "أعلى 10 مدن")}</div><div id="cmp-city-chart"></div></div></div>
          <h3 class="mt-3">${L("Store types side by side", "أنواع المتاجر جنبًا إلى جنب")}</h3>
          ${withCode("py-cmp-t", pySpec("compare_fair", "fair_by_type", L("the table", "الجدول")), miniTable(["type", { t: "stores", num: true }, { t: "store_days", num: true }, { t: "total_sales", num: true }, { t: L("rank (total)", "الترتيب (المجموع)"), num: true }, { t: "avg_daily_sales_per_store", num: true }, { t: L("rank (fair)", "الترتيب (العادل)"), num: true }],
            [...R.byType].sort((a, b) => b.avgDaily - a.avgDaily).map(t => [esc(t.key), t.stores, fmtInt(t.storeDays), fmt(t.total, 0), R.byType.findIndex(x => x.key === t.key) + 1, fmt(t.avgDaily, 2), [...R.byType].sort((a, b) => b.avgDaily - a.avgDaily).findIndex(x => x.key === t.key) + 1])))}`),
      results: SSR() ? (() => {
        const R = SSR(), byTot = R.byType[0], byFair = [...R.byType].sort((a, b) => b.avgDaily - a.avgDaily)[0];
        const cityFair = [...R.byCity].sort((a, b) => b.avgDaily - a.avgDaily)[0], one = R.byCity.filter(c => c.stores === 1).length;
        return `<p class="mb-0">${L(`By total, type <strong>${esc(byTot.key)}</strong> leads (${byTot.stores} stores). Per store and per day, type <strong>${esc(byFair.key)}</strong> leads (${compact(byFair.avgDaily)} per store-day). ${byTot.key === byFair.key ? "Here both metrics agree." : "The two metrics disagree — the total mostly reflects how many stores the type has."} Among cities, <strong>${esc(cityFair.key)}</strong> has the highest average daily sales per store, but ${one} of ${R.byCity.length} cities have only one store, so city rankings largely compare individual stores.`, `حسب المجموع، يتصدر النوع <strong>${esc(byTot.key)}</strong> (${byTot.stores} متجرًا). ولكل متجر ولكل يوم، يتصدر النوع <strong>${esc(byFair.key)}</strong> (${compact(byFair.avgDaily)} لكل يوم-متجر). ${byTot.key === byFair.key ? "وهنا يتفق المقياسان." : "ويختلف المقياسان — فالمجموع يعكس في الغالب عدد متاجر النوع."} ومن بين المدن، لـ<strong>${esc(cityFair.key)}</strong> أعلى متوسط مبيعات يومية لكل متجر، لكن ${one} من ${R.byCity.length} مدن فيها متجر واحد فقط، لذا تقارن ترتيبات المدن في الغالب متاجر منفردة.`)}</p>`;
      })() : pending(L("comparison", "المقارنة")),
      remember: L("Totals describe size; average daily sales per store compares performance. Always show the number of stores.", "المجاميع تصف الحجم؛ ومتوسط المبيعات اليومية لكل متجر يقارن الأداء. واعرض عدد المتاجر دائمًا."),
      quiz: { q: L("City X has the highest total sales and 18 stores. Can we say its stores perform best?", "للمدينة X أعلى إجمالي مبيعات و18 متجرًا. هل يمكن القول إن متاجرها الأفضل أداءً؟"), options: [
        { t: L("Yes, it has the highest total", "نعم، لها أعلى مجموع"), why: L("The total grows with the number of stores.", "المجموع يكبر مع عدد المتاجر.") },
        { t: L("Not yet — compare average daily sales per store", "ليس بعد — قارن متوسط المبيعات اليومية لكل متجر"), ok: true, why: L("That removes the effect of the number of stores and days.", "هذا يزيل أثر عدد المتاجر والأيام.") }] },
    });
    root.querySelectorAll('[data-seg="cmp-metric"] button').forEach(b => b.addEventListener("click", () => { st.metric = b.dataset.value; this.render(root); root.querySelector(`[data-seg="cmp-metric"] [data-value="${st.metric}"]`).focus(); }));
    const R = SSR();
    if (!R) return;
    const val = g => (st.metric === "fair" ? g.avgDaily : g.total);
    setCode("py-cmp-type", pySpec(st.metric === "fair" ? "compare_fair" : "compare_type", L("By store type", "حسب نوع المتجر"), L("the chart", "الرسم")));
    setCode("py-cmp-city", pySpec(st.metric === "fair" ? "compare_fair" : "groupby", L("Top 10 cities", "أعلى 10 مدن"), L("the chart", "الرسم")));
    const types = [...R.byType].sort((a, b) => val(b) - val(a)), cities = [...R.byCity].sort((a, b) => val(b) - val(a)).slice(0, 10);
    Charts.bar(root.querySelector("#cmp-type-chart"), { data: types.map(t => ({ label: `${t.key} (${t.stores})`, value: val(t), cls: "c2", tip: `${L("Type", "النوع")} ${t.key}: ${compact(val(t))} · ${t.stores} ${L("stores", "متاجر")}` })), format: compact, height: 260, yLabel: st.metric === "fair" ? L("per store-day", "لكل يوم-متجر") : L("Total Sales", "إجمالي المبيعات"), xLabel: L("type (number of stores)", "النوع (عدد المتاجر)") });
    Charts.bar(root.querySelector("#cmp-city-chart"), { horizontal: true, data: cities.map(c => ({ label: `${c.key} (${c.stores})`, value: val(c), cls: "c3" })), format: compact, labelWidth: 150 });
  },
});

/* =====================================================================
   14 — Business insights
   ===================================================================== */
function insightRows(R) {
  const tot = totalSales(R), s0 = R.byStore[0], f0 = R.byFamily[0], fy = fullYears(R);
  const fair = [...R.byType].sort((a, b) => b.avgDaily - a.avgDaily), mo = R.monthOfYear.filter(m => m.dates), peak = mo.reduce((a, b) => (b.avg > a.avg ? b : a));
  const wd = R.weekday.filter(d => d.dates), whi = wd.reduce((a, b) => (b.avg > a.avg ? b : a));
  const growth = fy.length >= 2 ? share(fy[fy.length - 1].total - fy[0].total, fy[0].total) : NaN;
  return [
    { q: L("Which stores have the highest total sales?", "ما المتاجر صاحبة أعلى إجمالي مبيعات؟"),
      obs: L(`Store ${esc(s0.store)} (${esc(s0.city ?? "?")}, type ${esc(s0.type ?? "?")}) has the highest total: ${compact(s0.total)}, ${fmtPct(share(s0.total, tot))} of all sales. The top 10 stores together: ${fmtPct(share(R.byStore.slice(0, 10).reduce((a, s) => a + s.total, 0), tot))}.`, `المتجر ${esc(s0.store)} (${esc(s0.city ?? "?")}، النوع ${esc(s0.type ?? "?")}) له أعلى مجموع: ${compact(s0.total)}، أي ${fmtPct(share(s0.total, tot))} من كل المبيعات. وأعلى 10 متاجر معًا: ${fmtPct(share(R.byStore.slice(0, 10).reduce((a, s) => a + s.total, 0), tot))}.`),
      why: L("Size of the store, location (large city), store format and how long it has been open.", "حجم المتجر، والموقع (مدينة كبيرة)، وشكل المتجر، ومدة عمله."),
      rec: L("Before treating them as models for other stores, compare average daily sales per store and check floor space and opening dates.", "قبل اعتبارها نماذج لمتاجر أخرى، قارن متوسط المبيعات اليومية لكل متجر وافحص المساحة وتواريخ الافتتاح.") },
    { q: L("Which product families generate the highest total sales?", "ما فئات المنتجات التي تحقق أعلى إجمالي مبيعات؟"),
      obs: L(`${esc(f0.family)} leads with ${fmtPct(share(f0.total, tot))} of sales, followed by ${R.byFamily.slice(1, 3).map(f => esc(f.family)).join(" and ")}.`, `تتصدر ${esc(f0.family)} بنسبة ${fmtPct(share(f0.total, tot))} من المبيعات، تليها ${R.byFamily.slice(1, 3).map(f => esc(f.family)).join(" و")}.`),
      why: L("Everyday essentials are bought often. “sales” mixes units and weights, so families are not perfectly comparable.", "السلع الأساسية اليومية تُشترى كثيرًا. ويخلط «sales» بين الوحدات والأوزان، لذا لا تُقارن الفئات مقارنة تامة."),
      rec: L("Use revenue and margin data (not in this dataset) before deciding where to invest shelf space.", "استخدم بيانات الإيرادات والهوامش (غير موجودة في هذه البيانات) قبل تقرير أين تستثمر مساحة الرفوف.") },
    { q: L("How do sales change over time?", "كيف تتغير المبيعات عبر الزمن؟"),
      obs: fy.length >= 2 ? L(`From ${fy[0].year} to ${fy[fy.length - 1].year} (full years) total sales changed by ${fmtPct(growth)}. Per day, ${MONTHS()[peak.month - 1]} is the strongest month on average and ${dayName(whi.day)} the strongest weekday.`, `من ${fy[0].year} إلى ${fy[fy.length - 1].year} (سنوات كاملة) تغيّر إجمالي المبيعات بنسبة ${fmtPct(growth)}. ولكل يوم، ${MONTHS()[peak.month - 1]} أقوى شهر في المتوسط و${dayName(whi.day)} أقوى أيام الأسبوع.`)
        : L(`Fewer than two full years are available; per day, ${MONTHS()[peak.month - 1]} is the strongest month on average.`, `تتوفر أقل من سنتين كاملتين؛ ولكل يوم، ${MONTHS()[peak.month - 1]} أقوى شهر في المتوسط.`),
      why: L("Store openings, inflation, holidays and the end-of-year season can all contribute.", "قد تساهم في ذلك افتتاحات المتاجر والتضخم والعطل وموسم نهاية العام."),
      rec: L("Separate growth from new stores and growth within existing stores (like-for-like) before reporting “growth”.", "افصل النمو الناتج عن متاجر جديدة عن النمو داخل المتاجر القائمة (المقارنة المماثلة) قبل الإبلاغ عن «النمو».") },
    { q: L("Are there meaningful differences between cities or store types?", "هل توجد فروق ذات معنى بين المدن أو أنواع المتاجر؟"),
      obs: L(`Per store and per day, type ${esc(fair[0].key)} sells the most (${compact(fair[0].avgDaily)}) and type ${esc(fair[fair.length - 1].key)} the least (${compact(fair[fair.length - 1].avgDaily)}).`, `لكل متجر ولكل يوم، يبيع النوع ${esc(fair[0].key)} أكثر (${compact(fair[0].avgDaily)}) والنوع ${esc(fair[fair.length - 1].key)} أقل (${compact(fair[fair.length - 1].avgDaily)}).`),
      why: L("Store type probably reflects size and assortment; cities differ in population and income.", "يعكس نوع المتجر على الأرجح الحجم وتشكيلة المنتجات؛ وتختلف المدن في عدد السكان والدخل."),
      rec: L("Ask the business what the type letters mean, and compare stores of similar size before drawing conclusions.", "اسأل أصحاب العمل عن معنى حروف الأنواع، وقارن متاجر ذات حجم متقارب قبل الاستنتاج.") },
    { q: L("What patterns should be investigated further?", "ما الأنماط التي يجب التحقيق فيها أكثر؟"),
      obs: L(`${fmtPct(share(R.stats.zeros, R.stats.count))} of records have zero sales; ${fmtInt(R.stats.fences[0].count)} records are flagged by the 1.5 × IQR rule; ${fmtInt(R.train.invalidDates)} invalid dates and ${fmtInt(R.train.info.reduce((a, c) => a + c.missing, 0))} missing values were found.`, `${fmtPct(share(R.stats.zeros, R.stats.count))} من السجلات بمبيعات صفرية؛ و${fmtInt(R.stats.fences[0].count)} سجلًا معلَّمة بقاعدة 1.5 × IQR؛ ووُجدت ${fmtInt(R.train.invalidDates)} تواريخ غير صالحة و${fmtInt(R.train.info.reduce((a, c) => a + c.missing, 0))} قيمة مفقودة.`),
      why: L("Zeros can mean a product not stocked, a closed store or missing reporting; large values can be holidays or bulk orders.", "قد تعني الأصفار منتجًا غير متوفر أو متجرًا مغلقًا أو عدم إبلاغ؛ وقد تكون القيم الكبيرة عطلًا أو طلبات جملة."),
      rec: L("Check a sample of zero and extreme records with store managers; add the holidays file to explain peaks.", "افحص عينة من السجلات الصفرية والمتطرفة مع مديري المتاجر؛ وأضف ملف العطل لتفسير الذروات.") },
    { q: L("What additional data would help evaluate promotions?", "ما البيانات الإضافية التي تساعد في تقييم التخفيضات؟"),
      obs: L(`Records with promoted items average ${f2(R.promo.meanPromo)} vs ${f2(R.promo.meanNoPromo)} without (r = ${fmt(R.promo.r, 3)} on all records).`, `متوسط السجلات التي فيها أصناف مخفّضة ${f2(R.promo.meanPromo)} مقابل ${f2(R.promo.meanNoPromo)} دونها (r = ${fmt(R.promo.r, 3)} على كل السجلات).`),
      why: L("Promotions may be placed on products, stores and days that already sell well — the difference is not necessarily caused by the promotion.", "قد توضع التخفيضات على منتجات ومتاجر وأيام تبيع جيدًا أصلًا — فالفرق ليس بالضرورة ناتجًا عن التخفيض."),
      rec: L("Add discount depth, promotion cost and margin, holidays (holidays_events.csv), store traffic (transactions.csv) and ideally a planned test with comparable control stores.", "أضف عمق الخصم وتكلفة التخفيض والهامش، والعطل (holidays_events.csv)، وحركة المتاجر (transactions.csv)، ويُفضَّل اختبار مخطط له مع متاجر ضابطة قابلة للمقارنة.") },
  ];
}
Lec.add({
  id: "py-insights", num: 14, aliases: ["business-insights"],
  title: { en: "From Analysis to Business Insights", ar: "من التحليل إلى رؤى الأعمال" },
  short: { en: "Business insights", ar: "رؤى الأعمال" },
  summary: { en: "Observed result → possible explanation → recommendation to validate.", ar: "النتيجة الملاحظة ← التفسير الممكن ← توصية تحتاج إلى تحقق." },
  render(root) {
    const R = SSR();
    const rows = R ? insightRows(R) : null;
    const qs = [L("Which stores have the highest total sales?", "ما المتاجر صاحبة أعلى إجمالي مبيعات؟"), L("Which product families generate the highest total sales?", "ما فئات المنتجات التي تحقق أعلى إجمالي مبيعات؟"), L("How do sales change over time?", "كيف تتغير المبيعات عبر الزمن؟"), L("Are there meaningful differences between cities or store types?", "هل توجد فروق ذات معنى بين المدن أو أنواع المتاجر؟"), L("What patterns should be investigated further?", "ما الأنماط التي يجب التحقيق فيها أكثر؟"), L("What additional data would help evaluate promotions?", "ما البيانات الإضافية التي تساعد في تقييم التخفيضات؟")];
    const card = (r, i) => `<article class="card py-insight"><h3 class="mt-0"><span class="py-ins-n">${i + 1}</span>${r ? r.q : qs[i]}</h3>
      <dl class="py-facts"><div><dt><span class="badge primary">${L("1 · Observed result", "1 · النتيجة الملاحظة")}</span></dt><dd>${r ? r.obs : L("Available after you load the files (Section 2) or run the Python code of Sections 9–13.", "متاحة بعد تحميل الملفات (القسم 2) أو تشغيل كود بايثون في الأقسام 9–13.")}</dd></div>
      <div><dt><span class="badge">${L("2 · Possible explanation", "2 · تفسير ممكن")}</span></dt><dd>${r ? r.why : "—"}</dd></div>
      <div><dt><span class="badge warn">${L("3 · Recommendation to validate", "3 · توصية تحتاج إلى تحقق")}</span></dt><dd>${r ? r.rec : "—"}</dd></div></dl></article>`;
    root.innerHTML = lesson(this, {
      simple: L("An insight is useful only if a manager can trust it and act on it. For every question we separate three things: <strong>what we observed</strong> in the data, <strong>a possible explanation</strong> (a hypothesis, not a fact), and <strong>a recommendation</strong> that still needs to be validated.",
        "الرؤية مفيدة فقط إذا استطاع المدير الوثوق بها والعمل بها. ولكل سؤال نفصل بين ثلاثة أشياء: <strong>ما لاحظناه</strong> في البيانات، و<strong>تفسير ممكن</strong> (فرضية لا حقيقة)، و<strong>توصية</strong> لا تزال تحتاج إلى تحقق."),
      why: [L("Mixing observation and explanation is the most common way analyses mislead.", "خلط الملاحظة بالتفسير هو أكثر الطرق شيوعًا التي تضلّل بها التحليلات."), L("Clear recommendations with next steps turn analysis into action.", "التوصيات الواضحة مع الخطوات التالية تحوّل التحليل إلى فعل.")],
      extra: R ? "" : `<section class="block">${callout("info", L("Observed results are not shown yet", "النتائج الملاحظة غير معروضة بعد"), `<p class="mb-0">${L(`No numbers are invented here. Load the files in ${sectionLink("py-dataset", "Section 2")} (or run the notebook) and each observed result will be filled in from your data.`, `لا تُخترع أي أرقام هنا. حمّل الملفات في ${sectionLink("py-dataset", "القسم 2")} (أو شغّل الدفتر) وستُملأ كل نتيجة ملاحظة من بياناتك.`)}</p>`)}</section>`,
      seeTitle: L("Six business questions", "ستة أسئلة أعمال"), codeHint: false,
      see: `${ssBar()}<div class="py-insights">${qs.map((_, i) => card(rows && rows[i], i)).join("")}</div>
        ${R ? `<div class="row mt-2"><button type="button" class="btn btn-primary" id="ins-copy">${ICON.copy}<span>${L("Copy as a summary for management", "انسخ كملخص للإدارة")}</span></button><span class="small muted" id="ins-copy-status" role="status" aria-live="polite"></span></div>
          <label class="sr-only" for="ins-text">${L("Summary text", "نص الملخص")}</label><textarea id="ins-text" class="py-summary" rows="8" readonly hidden></textarea>` : ""}`,
      results: R ? `<p class="mb-0">${L("Every observed result above is computed from your files; explanations and recommendations are deliberately written as hypotheses and next steps.", "كل نتيجة ملاحظة أعلاه محسوبة من ملفاتك؛ وقد كُتبت التفسيرات والتوصيات عمدًا كفرضيات وخطوات تالية.")}</p>` : pending(L("insights", "الرؤى")),
      remember: L("Observed → possible explanation → recommendation to validate. Never present a hypothesis as a fact.", "ملاحظ ← تفسير ممكن ← توصية تحتاج إلى تحقق. ولا تعرض فرضية على أنها حقيقة."),
      quiz: { q: L("“Promotions increase sales by 40%.” What is wrong with this statement based on our analysis?", "«التخفيضات تزيد المبيعات بنسبة 40%». ما الخطأ في هذه العبارة بناءً على تحليلنا؟"), options: [
        { t: L("It presents an association as a cause", "تعرض ارتباطًا على أنه سبب"), ok: true, why: L("We only compared records with and without promotions; we did not test the effect of promotions.", "قارنّا فقط سجلات مع التخفيض ودونه؛ ولم نختبر أثر التخفيضات.") },
        { t: L("Nothing — the numbers support it", "لا شيء — الأرقام تدعمها"), why: L("A difference in averages does not show why it exists.", "الفرق في المتوسطات لا يُظهر سبب وجوده.") }] },
    });
    const btn = root.querySelector("#ins-copy");
    if (btn && rows) btn.addEventListener("click", async () => {
      const text = `${L("Store Sales analysis — summary for management", "تحليل Store Sales — ملخص للإدارة")}\n${L("Data", "البيانات")}: ${R.train.name} (${fmtInt(R.train.rows)} ${L("rows", "صف")}, ${R.train.dateMin} – ${R.train.dateMax}) + ${R.stores.name}\n\n` +
        rows.map((r, i) => `${i + 1}. ${r.q}\n   ${L("Observed", "الملاحظ")}: ${r.obs.replace(/<[^>]+>/g, "")}\n   ${L("Possible explanation", "تفسير ممكن")}: ${r.why}\n   ${L("To validate", "للتحقق")}: ${r.rec}`).join("\n\n");
      const ta = root.querySelector("#ins-text"), status = root.querySelector("#ins-copy-status");
      ta.value = text;
      try { await navigator.clipboard.writeText(text); status.textContent = L("Copied to the clipboard.", "تم النسخ إلى الحافظة."); ta.hidden = true; }
      catch (e) { ta.hidden = false; ta.focus(); ta.select(); status.textContent = L("Copy blocked by the browser — the text is selected below; press Ctrl+C.", "منع المتصفح النسخ — النص محدد أدناه؛ اضغط Ctrl+C."); }
    });
  },
});

/* =====================================================================
   15 — Challenges, limitations and conclusion
   ===================================================================== */
Lec.add({
  id: "py-conclusion", num: 15, aliases: ["limitations", "python-conclusion"],
  title: { en: "Challenges, Limitations and Conclusion", ar: "التحديات والقيود والخلاصة" },
  short: { en: "Limitations & conclusion", ar: "القيود والخلاصة" },
  summary: { en: "What can go wrong, how to say it honestly, discussion questions and exercises.", ar: "ما قد يسوء، وكيف تقوله بأمانة، وأسئلة للنقاش وتمارين." },
  render(root) {
    const lim = [
      [L("Missing values and data quality", "القيم المفقودة وجودة البيانات"), L("Totals and averages are only as good as the data. Report how many values were missing or invalid.", "المجاميع والمتوسطات جيدة بقدر جودة البيانات فقط. أبلغ عن عدد القيم المفقودة أو غير الصالحة.")],
      [L("Duplicates and merge keys", "التكرارات ومفاتيح الدمج"), L("A duplicated key silently multiplies rows; an unmatched key silently loses information. Validate every merge.", "المفتاح المكرر يضاعف الصفوف بصمت؛ والمفتاح غير المطابق يفقد المعلومات بصمت. تحقّق من كل دمج.")],
      [L("Interpreting outliers", "تفسير القيم المتطرفة"), L("A flagged value is a question, not an error. Removing real extremes biases results downwards.", "القيمة المعلَّمة سؤال لا خطأ. وإزالة القيم المتطرفة الحقيقية تُحرّف النتائج نحو الأسفل.")],
      [L("Limits of totals and averages", "حدود المجاميع والمتوسطات"), L("Totals reward size; means are pulled by extremes. Use per-store, per-day metrics and medians where they answer the question better.", "المجاميع تكافئ الحجم؛ والمتوسطات تجرّها القيم القصوى. استخدم مقاييس لكل متجر ولكل يوم والوسيط حيث تجيب عن السؤال أفضل.")],
      [L("Correlation versus causation", "الارتباط مقابل السببية"), L("Promotions and sales move together, but that does not prove promotions cause the sales.", "تتحرك التخفيضات والمبيعات معًا، لكن ذلك لا يثبت أن التخفيضات سبب المبيعات.")],
      [L("Bias in comparisons", "التحيّز في المقارنات"), L("Groups differ in number of stores, opening dates, size and location. Compare like with like.", "تختلف المجموعات في عدد المتاجر وتواريخ الافتتاح والحجم والموقع. قارن المتماثل بالمتماثل.")],
      [L("The past does not guarantee the future", "الماضي لا يضمن المستقبل"), L("Patterns can change with new competitors, prices, the economy or unusual events. Forecasts need uncertainty ranges and regular checks.", "قد تتغير الأنماط مع منافسين جدد أو أسعار أو الاقتصاد أو أحداث غير معتادة. والتوقعات تحتاج إلى نطاقات عدم يقين وفحوص منتظمة.")],
    ];
    const discuss = [
      [L("Our top store sells the most in total. What other information would you want before calling it the best-run store?", "متجرنا الأعلى يبيع أكثر إجمالًا. ما المعلومات الأخرى التي تريدها قبل وصفه بأنه المتجر الأفضل إدارةً؟"), L("Size and floor space, opening date, location and footfall, average daily sales per store, margins and costs, staff numbers.", "الحجم والمساحة، وتاريخ الافتتاح، والموقع وحركة الزوار، ومتوسط المبيعات اليومية لكل متجر، والهوامش والتكاليف، وعدد الموظفين.")],
      [L("Which cleaning decision in this analysis would you discuss with the data owner first, and why?", "أي قرار تنظيف في هذا التحليل ستناقشه مع مالك البيانات أولًا، ولماذا؟"), L("Usually zero-sales records or any duplicate/unmatched store keys: they affect totals and merges, and only the business knows their cause.", "عادةً سجلات المبيعات الصفرية أو أي مفاتيح متاجر مكررة/غير مطابقة: فهي تؤثر في المجاميع والدمج، والعمل وحده يعرف سببها.")],
      [L("How would you test whether a promotion really increases sales?", "كيف تختبر ما إذا كان التخفيض يزيد المبيعات فعلًا؟"), L("Plan a test: run the promotion in some stores and not in comparable ones over the same period, then compare the change in sales; account for holidays and seasonality.", "خطّط لاختبار: نفّذ التخفيض في بعض المتاجر لا في متاجر مماثلة خلال الفترة نفسها، ثم قارن التغيّر في المبيعات؛ مع مراعاة العطل والموسمية.")],
      [L("Which single chart would you show a busy manager, and what would its title say?", "أي رسم واحد ستعرضه على مدير مشغول، وماذا سيقول عنوانه؟"), L("For example the monthly line chart titled with the finding itself, e.g. “Sales grew year on year, with a peak every December” — if your data shows that.", "مثلًا الرسم الخطي الشهري بعنوان يذكر النتيجة نفسها، مثل «نمت المبيعات عامًا بعد عام، مع ذروة كل ديسمبر» — إذا أظهرت بياناتك ذلك.")],
    ];
    const ex = [
      ["ex_share_top5", L("What share of total sales comes from the 5 best-selling stores?", "ما حصة أعلى 5 متاجر مبيعًا من إجمالي المبيعات؟")],
      ["ex_city_monthly", L("Plot the monthly sales of one city (for example Quito).", "ارسم المبيعات الشهرية لمدينة واحدة (مثل Quito).")],
      ["ex_weekend", L("Is the average daily total higher on weekends than on weekdays?", "هل متوسط الإجمالي اليومي أعلى في نهايات الأسبوع منه في أيام العمل؟")],
      ["ex_family_by_type", L("Which product family has the highest total sales in each store type?", "ما فئة المنتجات صاحبة أعلى إجمالي مبيعات في كل نوع متجر؟")],
    ];
    root.innerHTML = lesson(this, {
      simple: L("Every analysis has limits. Saying them clearly is not a weakness — it is what makes the conclusions trustworthy and tells decision-makers what to check next.", "لكل تحليل حدود. وذكرها بوضوح ليس ضعفًا — بل هو ما يجعل الاستنتاجات جديرة بالثقة ويخبر صانعي القرار بما يجب فحصه لاحقًا."),
      extra: `<section class="block"><h2>${L("Challenges and limitations", "التحديات والقيود")}</h2><div class="grid grid-2">${lim.map(([t, d]) => `<div class="card py-lim"><h3 class="mt-0">${t}</h3><p class="mb-0">${d}</p></div>`).join("")}</div></section>
        <section class="block"><blockquote class="py-quote"><p>${L("“The goal of data analysis is not merely to produce charts. It is to understand what is happening, investigate possible explanations, and provide reliable evidence to support better decisions.”", "«هدف تحليل البيانات ليس مجرد إنتاج الرسوم. بل فهم ما يحدث، والتحقيق في التفسيرات الممكنة، وتقديم أدلة موثوقة تدعم قرارات أفضل.»")}</p></blockquote></section>
        <section class="block"><h2>${L("Discussion questions", "أسئلة للنقاش")}</h2>${discuss.map(([q, a]) => answer(q, `<p class="mb-0">${a}</p>`)).join("")}</section>
        <section class="block"><h2>${L("Practical exercises", "تمارين تطبيقية")}</h2><p class="muted">${L("Try each one in Colab after running Sections 3–13, then compare with the solution.", "جرّب كلًا منها في Colab بعد تشغيل الأقسام 3–13، ثم قارن بالحل.")}</p>
          ${ex.map(([k, q], i) => `<div class="card py-q"><p class="mb-1"><strong>${L("Exercise", "تمرين")} ${i + 1}.</strong> ${q}</p>${more(L("Show a solution", "اعرض حلًا"), pyCode(k, L("Python · one possible solution", "بايثون · حل ممكن")), "py-answer")}</div>`).join("")}</section>
        <section class="block"><div class="card py-part"><h2 class="mt-0">${L("Where to go next", "إلى أين بعد ذلك")}</h2><p>${L("Lecture 1, Sections 16–19 show how the same steps lead to machine learning and forecasting.", "تُظهر المحاضرة 1، الأقسام 16–19، كيف تقود الخطوات نفسها إلى تعلّم الآلة والتنبؤ.")}</p>
          <div class="row"><a class="btn" href="lecture-1.html#forecasting">${L("Lecture 1 · Forecasting", "المحاضرة 1 · التنبؤ")}</a><a class="btn btn-primary" href="#start">${ICON.home}<span>${L("Lecture 2 start", "بداية المحاضرة 2")}</span></a></div></div></section>`,
      remember: L("Charts are the means; reliable evidence for better decisions is the goal.", "الرسوم وسيلة؛ والهدف أدلة موثوقة لقرارات أفضل."),
      quiz: { q: L("Which statement is the most honest way to report a pattern?", "أي عبارة هي الطريقة الأكثر أمانة للإبلاغ عن نمط؟"), options: [
        { t: L("“Weekends cause higher sales.”", "«نهايات الأسبوع تسبب مبيعات أعلى.»"), why: L("That claims a cause.", "هذا يدّعي سببًا.") },
        { t: L("“In the period covered by our data, average daily sales were X% higher on weekends; holidays and promotions may contribute.”", "«في الفترة التي تغطيها بياناتنا، كان متوسط المبيعات اليومية أعلى بنسبة X% في نهايات الأسبوع؛ وقد تساهم العطل والتخفيضات.»"), ok: true, why: L("It states the period, the measure and the uncertainty.", "تذكر الفترة والمقياس وعدم اليقين.") }] },
    });
  },
});
