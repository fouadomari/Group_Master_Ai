/* =====================================================================
   code-snippets.js — the exact code behind every result on the pages.
   Created by Master of AI.

   Each function returns { title, code, lang, result } for one result.
   Sections attach them to tiles/charts with codeAttr() / setCode(), and
   clicking the result opens them (see CodeModal in shared.js).
   Every snippet runs from the project folder and prints its result.
   ===================================================================== */
const pyStr = v => JSON.stringify(String(v));
const PY = {
  load: `import pandas as pd

df = pd.read_csv("data/clean_patient_screening_data.csv")`,
  raw: `import pandas as pd

raw = pd.read_csv("data/messy_patient_screening_data.csv", dtype=str, keep_default_na=False)`,
  medlib: `import sys
sys.path.append("python")                # the project's documented cleaning rules (python/medlib.py)`,
  tokens: `missing_words = {"", "na", "n/a", "nan", "null", "none", "?", "-", "missing", "not recorded", "unknown"}`,
  monthly: `import pandas as pd

ts = pd.read_csv("data/monthly_clinic_activity.csv", parse_dates=["month"]).set_index("month")`,
};
const ML_FEATURES = `features = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose", "hba1c",
            "total_cholesterol", "exercise_days_per_week", "family_history_flag",
            "medication_adherence_pct", "visits_last_year", "is_smoker", "is_male"]`;
const ML_SETUP = `import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv("data/clean_patient_screening_data.csv")
df = df[df["risk_group"].notna()].copy()
df["is_smoker"] = (df["smoking_status"] == "Smoker").astype(int)
df["is_male"] = (df["sex"] == "Male").astype(int)
${ML_FEATURES}
X, y = df[features].astype(float), df["risk_group"]          # risk_group = teaching label
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)`;
const ML_MODELS = `from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

models = {
    "Logistic Regression": make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(max_iter=2000)),
    "Random Forest": make_pipeline(SimpleImputer(strategy="median"),
                                   RandomForestClassifier(n_estimators=300, min_samples_leaf=3, random_state=42, n_jobs=-1)),
    "Gradient Boosting": make_pipeline(SimpleImputer(strategy="median"), GradientBoostingClassifier(random_state=42)),
}`;

/** pandas filter line for "all" | "<column>:<level>" */
function pyFilter(key) {
  if (!key || key === "all") return `data = df                                    # all patients`;
  const [col, lev] = key.split(":");
  return `data = df[df[${pyStr(col)}] == ${col === "family_history_flag" ? lev : pyStr(lev)}]`;
}
const AGE_GROUP_PY = `df["age_group"] = pd.cut(df["age"], [0, 34, 49, 64, 200], labels=["18-34", "35-49", "50-64", "65+"])`;
const STAT_PY = {
  n: ["g.count()", "how many values"], mean: ["g.mean()", "average"], median: ["g.median()", "middle value"], mode: ["g.mode().iloc[0]", "most common value"],
  min: ["g.min()", "smallest"], max: ["g.max()", "largest"], range: ["g.max() - g.min()", "max − min"], std: ["g.std()", "sample standard deviation (n − 1)"],
  variance: ["g.var()", "sample variance (n − 1)"], q1: ["g.quantile(0.25)", "25th percentile"], q3: ["g.quantile(0.75)", "75th percentile"],
  iqr: ["g.quantile(0.75) - g.quantile(0.25)", "spread of the middle half"], p5: ["g.quantile(0.05)", "5th percentile"], p95: ["g.quantile(0.95)", "95th percentile"],
  skewness: ["g.skew()", "adjusted Fisher–Pearson skewness"],
};
const RULE_PY = {
  systolic_bp: v => `from medlib import parse_bp, apply_range
systolic, diastolic = parse_bp(${pyStr(v)})          # '138/88' -> (138.0, 88.0)
systolic = apply_range(pd.Series([systolic]), "systolic_bp")[0]      # impossible -> NaN
diastolic = apply_range(pd.Series([diastolic]), "diastolic_bp")[0]
print(systolic, diastolic)`,
  fasting_glucose: v => `from medlib import parse_glucose, apply_range
value = parse_glucose(${pyStr(v)})                  # removes 'mg/dL'; mmol/L x 18.016
print(apply_range(pd.Series([value]), "fasting_glucose")[0])       # outside 40-600 -> NaN`,
  visit_date: v => `from medlib import parse_date
print(parse_date(${pyStr(v)}))                       # impossible or future date -> NaT`,
  sex: v => `from medlib import map_label, SEX_MAP
print(map_label(${pyStr(v)}, SEX_MAP))              # unknown code -> NaN`,
  smoking_status: v => `from medlib import map_label, SMOKING_MAP
print(map_label(${pyStr(v)}, SMOKING_MAP))`,
  family_history_flag: v => `from medlib import map_label, BOOL_MAP
print(map_label(${pyStr(v)}, BOOL_MAP))`,
  risk_group: v => `from medlib import map_label, RISK_MAP
print(map_label(${pyStr(v)}, RISK_MAP))             # missing label -> derived from risk_score`,
  clinic_id: v => `from medlib import parse_clinic
print(parse_clinic(${pyStr(v)}))`,
};
const TRY_TO_COL = { bp: "systolic_bp", glucose: "fasting_glucose", hba1c: "hba1c", bmi: "bmi", age: "age", sex: "sex", smoking: "smoking_status", bool: "family_history_flag", clinic: "clinic_id", date: "visit_date", risk: "risk_group" };

const Snip = {
  /* ---------------- Lecture 1 ---------------- */
  rawShape(result) { return { title: L("Size of the raw file", "حجم الملف الخام"), result, code: `${PY.raw}
print(raw.shape)                         # (rows, columns)` }; },
  cleanRows(result) { return { title: L("Rows after cleaning", "الصفوف بعد التنظيف"), result, code: `${PY.medlib}
from medlib import load_messy, clean_dataset

clean, log = clean_dataset(load_messy())  # all documented cleaning rules
print(len(clean))` }; },
  monthsCount(result) { return { title: L("Months of clinic activity", "أشهر نشاط العيادات"), result, code: `${PY.monthly}
print(len(ts), ts.index.min().date(), ts.index.max().date())` }; },
  rawSample(idx, cols) { return { title: L("Six raw rows", "ستة صفوف خام"), result: L("the table shown", "الجدول المعروض"), code: `${PY.raw}
cols = ${JSON.stringify(cols)}
print(raw.loc[${JSON.stringify(idx)}, cols])` }; },
  head(cols) { return { title: L("First 8 rows of the clean table", "أول 8 صفوف من الجدول المنظّف"), result: L("the table shown", "الجدول المعروض"), code: `${PY.load}
print(df[${JSON.stringify(cols)}].head(8))` }; },
  columnSummary() { return { title: L("Column summary", "ملخص الأعمدة"), result: L("the table shown", "الجدول المعروض"), code: `${PY.load}
summary = pd.DataFrame({
    "type": df.dtypes,
    "values_present": df.notna().sum(),
    "missing": df.isna().sum(),
})
print(summary)` }; },
  completeness(result) { return { title: L("Share of cells filled in", "نسبة الخلايا الممتلئة"), result, code: `${PY.raw}
${PY.tokens}
missing = raw.apply(lambda col: col.str.strip().str.lower().isin(missing_words))
print(round(100 * (1 - missing.values.mean()), 1))` }; },
  duplicates(result) { return { title: L("Identical duplicate rows", "الصفوف المكررة المتطابقة"), result, code: `${PY.raw}
print(raw.duplicated().sum())             # rows that are exact copies of an earlier row` }; },
  invalidDates(result) { return { title: L("Impossible or missing visit dates", "تواريخ زيارة مستحيلة أو مفقودة"), result, code: `${PY.medlib}
${PY.raw}
from medlib import parse_date

dates = raw["visit_date"].map(parse_date)    # 2024-02-30, future dates ... -> NaT
print(dates.isna().sum())` }; },
  qualityReport() { return { title: L("Data-quality report", "تقرير جودة البيانات"), result: L("the table shown (10 columns with most problems)", "الجدول المعروض (الأعمدة العشرة الأكثر مشكلات)"), code: `${PY.medlib}
${PY.raw}
from medlib import quality_report

report = quality_report(raw)
print(report[["column", "missing_pct", "format_issues", "invalid_values"]])` }; },
  explorer() { return { title: L("Looking through the data", "تصفّح البيانات"), result: L("the data viewer", "عارض البيانات"), code: `${PY.raw}
${PY.tokens}
# rows that contain at least one missing or oddly written value
missing = raw.apply(lambda col: col.str.strip().str.lower().isin(missing_words))
print(raw[missing.any(axis=1)].head(25))
print(raw[raw["sex"] == "M"])            # example filter: sex equals "M"` }; },
  cleanValue(col, rawValue, result) {
    const fn = RULE_PY[col] || (v => `from medlib import extract_number, apply_range
value = extract_number(${pyStr(v)})                 # keeps the number, drops units / % / text
print(apply_range(pd.Series([value]), ${pyStr(col)})[0])      # outside the valid range -> NaN`);
    return { title: L(`Cleaning rule for ${col}`, `قاعدة تنظيف ${col}`), result, code: `${PY.medlib}
import pandas as pd
${fn(rawValue)}` };
  },
  beforeAfter(pid) { return { title: L("One record before and after cleaning", "سجل واحد قبل التنظيف وبعده"), result: L("the table shown", "الجدول المعروض"), code: `${PY.medlib}
from medlib import load_messy, clean_dataset

raw = load_messy()
clean, log = clean_dataset(raw)
print(raw[raw["patient_id"].str.strip() == ${pyStr(pid)}].T)        # before
print(clean[clean["patient_id"] == ${pyStr(pid)}].T)                 # after` }; },
  missingBars() { return { title: L("Missing values per column", "القيم المفقودة لكل عمود"), result: L("the bar chart", "رسم الأعمدة"), code: `${PY.load}
missing_pct = (df.isna().mean() * 100).round(1)
print(missing_pct[missing_pct > 0].sort_values(ascending=False))` }; },
  imputation(v, m, result) {
    const fill = { drop: `handled = df[col].dropna()                         # leave the gaps out`, mean: `handled = df[col].fillna(df[col].mean())          # fill gaps with the average`, median: `handled = df[col].fillna(df[col].median())        # fill gaps with the median`, group: `group_median = df.groupby("risk_group")[col].transform("median")
handled = df[col].fillna(group_median)              # fill with each group's median` }[m];
    return { title: L("Effect of handling missing values", "أثر معالجة القيم المفقودة"), result, code: `${PY.load}
col = ${pyStr(v)}
measured = df[col].dropna()
${fill}

print("count ", measured.count(), handled.count())
print("mean  ", round(measured.mean(), 2), round(handled.mean(), 2))
print("median", measured.median(), handled.median())
print("sd    ", round(measured.std(), 2), round(handled.std(), 2))` };
  },
  descStat(key, v, f, result) {
    const [expr, what] = STAT_PY[key];
    return { title: L(`${vlabel(v)}: ${key}`, `${vlabel(v)}: ${key}`), result, code: `${PY.load}
${pyFilter(f)}
g = data[${pyStr(v)}].dropna()                # leave out missing values

result = ${expr}                 # ${what}
print(round(result, 2))` };
  },
  descHist(v, f) { return { title: L(`Histogram of ${vlabel(v)}`, `مدرج تكراري لـ ${vlabel(v)}`), result: L("the chart", "الرسم"), code: `${PY.load}
import matplotlib.pyplot as plt

${pyFilter(f)}
g = data[${pyStr(v)}].dropna()

fig, ax = plt.subplots(figsize=(9, 4))
ax.hist(g, bins=30)
ax.axvspan(g.quantile(0.25), g.quantile(0.75), alpha=0.15)        # middle half
ax.axvline(g.mean(), linestyle="--", label=f"mean {g.mean():.1f}")
ax.axvline(g.median(), label=f"median {g.median():.1f}")
ax.legend(); plt.show()` }; },
  distFilterLines(sex, smoking) { return [sex !== "all" ? `data = data[data["sex"] == ${pyStr(sex)}]` : "", smoking !== "all" ? `data = data[data["smoking_status"] == ${pyStr(smoking)}]` : ""].filter(Boolean).join("\n"); },
  distHist(v, sex, smoking, bins) { return { title: L("Histogram with the limits for unusual values", "مدرج تكراري مع حدود القيم غير المعتادة"), result: L("the chart", "الرسم"), code: `${PY.load}
import matplotlib.pyplot as plt

data = df
${Snip.distFilterLines(sex, smoking)}
g = data[${pyStr(v)}].dropna()
q1, q3 = g.quantile([0.25, 0.75]); iqr = q3 - q1

plt.hist(g, bins=${bins})
plt.axvline(g.median(), label="median")
plt.axvline(q3 + 1.5 * iqr, linestyle="--", color="red", label="upper limit")
plt.axvline(q1 - 1.5 * iqr, linestyle="--", color="red", label="lower limit")
plt.legend(); plt.show()` }; },
  distBox(v, sex, smoking) { return { title: L("Box plot by teaching risk group", "مخطط صندوقي حسب مجموعة الخطورة التعليمية"), result: L("the chart", "الرسم"), code: `${PY.load}
import matplotlib.pyplot as plt

data = df
${Snip.distFilterLines(sex, smoking)}
groups = ["Low", "Moderate", "High"]
plt.boxplot([data.loc[data["risk_group"] == g, ${pyStr(v)}].dropna() for g in groups], labels=groups)
plt.ylabel(${pyStr(v)}); plt.show()

print(data.groupby("risk_group")[${pyStr(v)}].describe())` }; },
  distOutliers(v, sex, smoking, result) { return { title: L("Shape and unusual values", "الشكل والقيم غير المعتادة"), result, code: `${PY.load}
data = df
${Snip.distFilterLines(sex, smoking)}
g = data[${pyStr(v)}].dropna()

q1, q3 = g.quantile([0.25, 0.75]); iqr = q3 - q1
lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr           # Tukey fences
unusual = g[(g < lower) | (g > upper)]
print("skewness", round(g.skew(), 2))
print("limits  ", round(lower, 1), round(upper, 1))
print("unusual ", len(unusual), "of", len(g))` }; },
  edaChart(v, grp, type) {
    const prep = grp === "age_group" ? `\n${AGE_GROUP_PY}` : "";
    const body = grp === "none"
      ? { hist: `plt.hist(df[${pyStr(v)}].dropna(), bins=30)`, box: `plt.boxplot(df[${pyStr(v)}].dropna())`, mean: `g = df[${pyStr(v)}].dropna()
half = stats.t.ppf(0.975, len(g) - 1) * g.std() / len(g) ** 0.5
print(round(g.mean(), 2), "range", round(g.mean() - half, 2), "to", round(g.mean() + half, 2))` }[type]
      : { hist: `parts = [sub[${pyStr(v)}].dropna() for _, sub in df.groupby(${pyStr(grp)})]
names = [name for name, _ in df.groupby(${pyStr(grp)})]
plt.hist(parts, bins=30, stacked=True, label=names); plt.legend()`, box: `df.boxplot(column=${pyStr(v)}, by=${pyStr(grp)})`, mean: `for name, sub in df.groupby(${pyStr(grp)}):
    g = sub[${pyStr(v)}].dropna()
    half = stats.t.ppf(0.975, len(g) - 1) * g.std() / len(g) ** 0.5      # 95% range of the average
    print(name, round(g.mean(), 2), "range", round(g.mean() - half, 2), "to", round(g.mean() + half, 2))` }[type];
    return { title: L("Exploration chart", "رسم الاستكشاف"), result: L("the chart", "الرسم"), code: `${PY.load}
import matplotlib.pyplot as plt
from scipy import stats${prep}

${body}
plt.show()` };
  },
  edaTable(v, grp) { return { title: L("Summary per group", "ملخص لكل مجموعة"), result: L("the table shown", "الجدول المعروض"), code: `${PY.load}${grp === "age_group" ? `\n${AGE_GROUP_PY}` : ""}

${grp === "none" ? `print(df[${pyStr(v)}].agg(["count", "mean", "median"]).round(2))` : `print(df.groupby(${pyStr(grp)})[${pyStr(v)}].agg(["count", "mean", "median"]).round(2))`}` }; },
  corrMatrix(method, vars) { return { title: L(`${method === "pearson" ? "Pearson" : "Spearman"} correlation table`, `جدول ارتباط ${method === "pearson" ? "بيرسون" : "سبيرمان"}`), result: L("the coloured table", "الجدول الملوّن"), code: `${PY.load}
cols = ${JSON.stringify(vars)}
corr = df[cols].corr(method=${pyStr(method)})       # uses all complete pairs
print(corr.round(2))` }; },
  corrPair(a, b, result) { return { title: `${vlabel(a)} × ${vlabel(b)}`, result, code: `${PY.load}
import matplotlib.pyplot as plt

pair = df[[${pyStr(a)}, ${pyStr(b)}]].dropna()      # patients with both values
print("n        ", len(pair))
print("Pearson  ", round(pair.corr(method="pearson").iloc[0, 1], 2))
print("Spearman ", round(pair.corr(method="spearman").iloc[0, 1], 2))

pair.plot.scatter(x=${pyStr(a)}, y=${pyStr(b)}, alpha=0.4); plt.show()` }; },
  htGroups(v, col, la, lb) { const val = x => (col === "family_history_flag" ? x : pyStr(x)); return `group_a = df.loc[df[${pyStr(col)}] == ${val(la)}, ${pyStr(v)}].dropna()
group_b = df.loc[df[${pyStr(col)}] == ${val(lb)}, ${pyStr(v)}].dropna()`; },
  htBox(v, col, la, lb) { return { title: L("The two groups", "المجموعتان"), result: L("the chart", "الرسم"), code: `${PY.load}
import matplotlib.pyplot as plt

${Snip.htGroups(v, col, la, lb)}
plt.boxplot([group_a, group_b], labels=[${pyStr(la)}, ${pyStr(lb)}]); plt.show()` }; },
  htTest(v, col, la, lb, result) { return { title: L("Welch's t-test and Mann–Whitney test", "اختبار ويلش t واختبار مان-ويتني"), result, code: `${PY.load}
import numpy as np
from scipy import stats
from scipy.stats import ttest_ind, mannwhitneyu

${Snip.htGroups(v, col, la, lb)}

t, p = ttest_ind(group_a, group_b, equal_var=False)          # Welch's t-test (averages)
diff = group_b.mean() - group_a.mean()
va, vb = group_a.var() / len(group_a), group_b.var() / len(group_b)
dof = (va + vb) ** 2 / (va ** 2 / (len(group_a) - 1) + vb ** 2 / (len(group_b) - 1))
half = stats.t.ppf(0.975, dof) * np.sqrt(va + vb)              # 95% range of the difference
pooled = np.sqrt(((len(group_a) - 1) * group_a.var() + (len(group_b) - 1) * group_b.var()) / (len(group_a) + len(group_b) - 2))
g = diff / pooled * (1 - 3 / (4 * (len(group_a) + len(group_b)) - 9))   # Hedges' g (size)

print("n          ", len(group_a), len(group_b))
print("averages   ", round(group_a.mean(), 1), round(group_b.mean(), 1))
print("difference ", round(diff, 2), "range", round(diff - half, 2), "to", round(diff + half, 2))
print("p (Welch)  ", p)
print("p (Mann-W) ", mannwhitneyu(group_a, group_b).pvalue)
print("Hedges g   ", round(g, 2))` }; },
  ciSim(v, n, k, result) { return { title: L("Repeating the study many times", "تكرار الدراسة مرات كثيرة"), result, explain: L("The browser draws its own random samples, so the exact samples differ from Python's — but the share of ranges that catch the true average behaves the same way (close to 95%).", "يسحب المتصفح عيناته العشوائية الخاصة، لذا تختلف العينات بالضبط عن عينات بايثون — لكن نسبة النطاقات التي تلتقط المتوسط الحقيقي تتصرف بالطريقة نفسها (قرب 95%)."), code: `${PY.load}
import numpy as np
from scipy import stats

population = df[${pyStr(v)}].dropna().values
true_mean = population.mean()
rng = np.random.default_rng(42)

hits = 0
for _ in range(${k}):
    sample = rng.choice(population, ${n}, replace=False)
    half = stats.t.ppf(0.975, ${n} - 1) * sample.std(ddof=1) / np.sqrt(${n})   # 95% range
    hits += abs(sample.mean() - true_mean) <= half
print(round(true_mean, 1), hits, "of", ${k}, "ranges contain the true average")` }; },
  pipeStep(i) {
    const steps = [
      `${PY.raw}
print(raw.shape)                         # step 1: load exactly as delivered`,
      `${PY.medlib}
from medlib import load_messy, quality_report, duplicate_summary

raw = load_messy()
print(quality_report(raw)["invalid_values"].sum())       # step 2: validation
print(duplicate_summary(raw)["exact_duplicates"])`,
      `${PY.medlib}
from medlib import load_messy, clean_dataset

clean, log = clean_dataset(load_messy())                 # step 3: cleaning
print(len(clean))`,
      `${PY.medlib}
import pandas as pd
from medlib import add_features

df = pd.read_csv("data/clean_patient_screening_data.csv")
features = add_features(df)                              # step 4: transformation
print(df.shape[1], "->", features.shape[1], "columns")`,
      `${PY.medlib}
import pandas as pd
from medlib import add_features

df = pd.read_csv("data/clean_patient_screening_data.csv")
add_features(df).to_csv("outputs/features_dataset.csv", index=False)   # step 5: one agreed table`,
      `${PY.load}
print(df.describe().round(1))                           # step 6: analysis`,
      `${ML_SETUP}
print(len(X_train), "to learn from,", len(X_test), "to test")          # step 7: modelling`,
    ];
    return { title: L(`Pipeline step ${i + 1}`, `خطوة المسار ${i + 1}`), result: L("the step's output", "مُخرَج الخطوة"), code: steps[i] };
  },
  transform(tr, result) { return { title: L("Transforming glucose", "تحويل السكر"), result, code: `${PY.load}
import numpy as np

g = df["fasting_glucose"].dropna()
${tr === "raw" ? "values = g                                   # original" : tr === "log" ? "values = np.log(g)                           # logarithm squeezes the long tail" : "values = (g - g.mean()) / g.std()            # z-score: centre 0, spread 1"}
print("skewness", round(values.skew(), 2))` }; },
  feature(f, result) {
    const make = {
      bmi_category: `feature = pd.cut(df["bmi"], [0, 18.5, 25, 30, 200], right=False, labels=["Underweight", "Normal", "Overweight", "Obese"])`,
      age_group: `feature = pd.cut(df["age"], [0, 34, 49, 64, 200], labels=["18-34", "35-49", "50-64", "65+"])`,
      pulse_pressure: `pp = df["systolic_bp"] - df["diastolic_bp"]
feature = pd.cut(pp, [-np.inf, 40, 50, 60, np.inf], right=False, labels=["<40", "40–49", "50–59", "≥60"])`,
      frequent_visitor: `feature = np.where(df["visits_last_year"].isna(), None, np.where(df["visits_last_year"] >= 4, "≥4", "0–3"))`,
      adherence_missing: `feature = np.where(df["medication_adherence_pct"].isna(), "missing", "recorded")`,
    }[f];
    return { title: L("Creating the new column", "إنشاء العمود الجديد"), result, code: `${PY.load}
import numpy as np

${make}
summary = pd.DataFrame({"feature": feature, "high": df["risk_group"] == "High"}).groupby("feature", observed=True)
print(summary.size())                                  # patients per category
print((summary["high"].mean() * 100).round(0))         # % in the "High" teaching group` };
  },
  mlAcc(result) { return { title: L("Training vs new-patient accuracy", "دقة التدريب مقابل المرضى الجدد"), result, code: `${ML_SETUP}
${ML_MODELS}

for name, model in models.items():
    model.fit(X_train, y_train)
    print(f"{name:<20} training {100 * model.score(X_train, y_train):.1f}%   new patients {100 * model.score(X_test, y_test):.1f}%")` }; },
  mlDepth(depth, result) { return { title: L("Complexity and overfitting", "التعقيد وفرط التخصيص"), result, code: `${ML_SETUP}
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.tree import DecisionTreeClassifier

for depth in range(1, 16):
    tree = make_pipeline(SimpleImputer(strategy="median"), DecisionTreeClassifier(max_depth=depth, random_state=42))
    tree.fit(X_train, y_train)
    print(f"depth {depth:>2}: training {100 * tree.score(X_train, y_train):.0f}%  new patients {100 * tree.score(X_test, y_test):.0f}%")   # depth ${depth} is the one selected` }; },
  mlLeak(on, result) { return { title: L("Data leakage", "تسرّب البيانات"), result, code: `${ML_SETUP}
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

columns = features${on ? ' + ["risk_score"]       # LEAK: the label is calculated from this column' : "                         # no leaking column"}
${on ? `X_train, X_test, y_train, y_test = train_test_split(df[columns].astype(float), y, test_size=0.25, stratify=y, random_state=42)
model = make_pipeline(SimpleImputer(strategy="median"), RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1))` : `model = make_pipeline(SimpleImputer(strategy="median"), RandomForestClassifier(n_estimators=300, min_samples_leaf=3, random_state=42, n_jobs=-1))`}
model.fit(X_train, y_train)
print(f"{100 * model.score(X_test, y_test):.1f}% right on new patients")` }; },
  evalCM(model, result) { return { title: L(`Confusion matrix — ${model}`, `مصفوفة الالتباس — ${model}`), result, code: `${ML_SETUP}
${ML_MODELS}
from sklearn.metrics import confusion_matrix, classification_report

model = models[${pyStr(model)}].fit(X_train, y_train)
predicted = model.predict(X_test)
print((predicted == y_test).sum(), "/", len(y_test), "correct", f"({100 * (predicted == y_test).mean():.1f}%)")
labels = ["Low", "Moderate", "High"]
print(confusion_matrix(y_test, predicted, labels=labels))           # rows = true, columns = predicted
print(classification_report(y_test, predicted, labels=labels, digits=2))` }; },
  forecast(series, method, result) {
    const fit = method === "Holt-Winters (additive)" ? `from statsmodels.tsa.holtwinters import ExponentialSmoothing

def forecast(history, h):
    return ExponentialSmoothing(history.values, trend="add", seasonal="add", seasonal_periods=12).fit().forecast(h)` : `def forecast(history, h):
    """straight-line trend + one effect per calendar month"""
    t = np.arange(len(history)); m = t % 12
    X = np.column_stack([np.ones_like(t), t] + [(m == k).astype(float) for k in range(1, 12)])
    beta, *_ = np.linalg.lstsq(X, history.values, rcond=None)
    tf = np.arange(len(history), len(history) + h); mf = tf % 12
    Xf = np.column_stack([np.ones_like(tf), tf] + [(mf == k).astype(float) for k in range(1, 12)])
    return Xf @ beta`;
    return { title: L("The forecast", "التوقع"), result, code: `${PY.monthly}
import numpy as np

y = ts[${pyStr(series)}].astype(float)

${fit}

train, test = y[:-12], y[-12:]                   # pretend 2024 has not happened yet
pred = forecast(train, 12)
rmse = np.sqrt(np.mean((test.values - pred) ** 2))
mape = 100 * np.mean(np.abs((test.values - pred) / test.values))

future = forecast(y, 12)                          # the next 12 months
lower, upper = future - 1.96 * rmse, future + 1.96 * rmse
print("typical error %", round(mape, 2))
print("next 12 months ", round(future.sum()))
print("last 12 months ", int(y[-12:].sum()))` };
  },
  seasonal(series) { return { title: L("Seasonal pattern", "النمط الموسمي"), result: L("the chart", "الرسم"), code: `${PY.monthly}
from statsmodels.tsa.seasonal import seasonal_decompose

parts = seasonal_decompose(ts[${pyStr(series)}], model="additive", period=12)
print(parts.seasonal[:12].round(1))              # Jan ... Dec: above (+) or below (−) the trend` }; },

  /* ---------------- Lecture 2 ---------------- */
  l2Patients(result) { return { title: L("Patients screened", "المرضى المفحوصون"), result, code: `${PY.load}
print(len(df))` }; },
  l2High(result) { return { title: L("Share in the “High” teaching group", "النسبة في المجموعة التعليمية «مرتفعة»"), result, code: `${PY.load}
print(round(100 * (df["risk_group"] == "High").mean(), 1))` }; },
  l2Complete(result) { return { title: L("Key fields filled in", "الحقول الرئيسية الممتلئة"), result, code: `${PY.load}
key_fields = ["bmi", "fasting_glucose", "hba1c", "total_cholesterol", "medication_adherence_pct"]
print(round(100 * df[key_fields].notna().values.mean(), 1))` }; },
  l2Clinics(result) { return { title: L("Number of clinics", "عدد العيادات"), result, code: `${PY.load}
print(df["clinic_id"].nunique())` }; },
  kpiCard(i, result) {
    const code = [
      `${PY.monthly}
last = ts.iloc[-1]
print(last.name.date(), int(last["screening_visits"]))`,
      `${PY.monthly}
this_month, same_month_last_year = ts["screening_visits"].iloc[-1], ts["screening_visits"].iloc[-13]
print(round(100 * (this_month - same_month_last_year) / same_month_last_year, 1))`,
      `${PY.load}
key_fields = ["bmi", "fasting_glucose", "hba1c", "total_cholesterol", "medication_adherence_pct"]
print(round(100 * df[key_fields].notna().values.mean(), 2))`,
      `${PY.load}
print(round(100 * df["medication_adherence_pct"].isna().mean(), 2))`,
      `${PY.raw}
print(len(raw))          # counts every row, duplicates included — a "vanity metric"`,
    ][i];
    return { title: L("KPI calculation", "حساب مؤشر الأداء"), result, code };
  },
  dimTable(tbl) {
    const code = {
      fact: `${PY.load}
fact = df.reset_index(drop=True)
fact["visit_id"] = ["V" + str(i + 1).zfill(5) for i in fact.index]
fact["date_key"] = fact["visit_date"].str.replace("-", "")
fact = fact.rename(columns={"patient_id": "patient_key", "clinic_id": "clinic_key"})
print(fact[["visit_id", "patient_key", "clinic_key", "date_key", "systolic_bp", "fasting_glucose", "hba1c", "risk_group"]].head(6))`,
      clinic: `import pandas as pd

dim_clinic = pd.DataFrame({
    "clinic_key": ["CL01", "CL02", "CL03", "CL04", "CL05", "CL06"],
    "clinic_name": ["North Screening Hub", "Central Clinic", "East Community Centre",
                    "West Wellness Clinic", "South Health Point", "Riverside Clinic"],
    "region": ["North", "Central", "East", "West", "South", "Central"],
})
print(dim_clinic)`,
      date: `import pandas as pd

dates = pd.date_range("2023-01-01", "2024-12-31", freq="D")
dim_date = pd.DataFrame({"date_key": dates.strftime("%Y%m%d"), "date": dates.date,
                         "month": dates.strftime("%b"), "quarter": "Q" + dates.quarter.astype(str), "year": dates.year})
print(dim_date[dim_date["date_key"].isin(["20240115", "20240402", "20240820", "20241231"])])`,
      patient: `${PY.load}
${AGE_GROUP_PY}
dim_patient = df[["patient_id", "sex", "age_group", "smoking_status"]].rename(columns={"patient_id": "patient_key"})
print(dim_patient.head(6))`,
    }[tbl];
    return { title: L("Building this table", "بناء هذا الجدول"), result: L("the table shown", "الجدول المعروض"), code };
  },
  sqlPandas(i) {
    const code = [
      `${PY.load}
names = {"CL01": "North Screening Hub", "CL02": "Central Clinic", "CL03": "East Community Centre",
         "CL04": "West Wellness Clinic", "CL05": "South Health Point", "CL06": "Riverside Clinic"}
result = df["clinic_id"].map(names).value_counts()      # JOIN + GROUP BY + ORDER BY
print(result)`,
      `${PY.load}
data = df[df["clinic_id"].notna()]
result = data.groupby("clinic_id").agg(patients=("risk_group", "size"),
                                       pct_high=("risk_group", lambda s: round(100 * (s == "High").mean(), 1)))
print(result)`,
      `${PY.monthly}
data = ts.loc["2024-01-01":, ["screening_visits"]].copy()
data["change"] = ts["screening_visits"].diff().loc["2024-01-01":]    # LAG(...) OVER (ORDER BY month)
print(data)`,
      `${PY.load}
fields = ["bmi", "fasting_glucose", "hba1c", "medication_adherence_pct"]
print((100 * df[fields].notna().mean()).round(1))      # COUNT(column) / COUNT(*)`,
      `${PY.load}
counts = df["clinic_id"].value_counts()
counts = counts[counts >= 50]                                            # HAVING COUNT(*) >= 50
print(pd.DataFrame({"patients": counts, "volume_rank": counts.rank(method="min", ascending=False).astype(int)}))`,
    ][i];
    return { title: L("The same question in Python (pandas)", "السؤال نفسه ببايثون (pandas)"), result: L("the result table", "جدول النتيجة"), code };
  },
  dashFilters(f) {
    return [`data = df.copy()`, f.clinic !== "all" ? `data = data[data["clinic_id"] == ${pyStr(f.clinic)}]` : "", f.year !== "all" ? `data = data[data["visit_date"].str.startswith(${pyStr(f.year)}, na=False)]` : "", f.group !== "all" ? `data = data[data["risk_group"] == ${pyStr(f.group)}]` : ""].filter(Boolean).join("\n");
  },
  dashTile(which, f, result) {
    const calc = { patients: `print(len(data))`, high: `print(round(100 * (data["risk_group"] == "High").mean(), 1))`, age: `print(round(data["age"].mean(), 1))`,
      complete: `key_fields = ["bmi", "fasting_glucose", "hba1c", "total_cholesterol", "medication_adherence_pct"]
print(round(100 * data[key_fields].notna().values.mean(), 1))      # target: at least 97%` }[which];
    return { title: L("Dashboard tile", "مربع لوحة المؤشرات"), result, code: `${PY.load}
${Snip.dashFilters(f)}
${calc}` };
  },
  dashChart(which, f) {
    const calc = { trend: `per_month = data["visit_date"].str[:7].value_counts().sort_index()
print(per_month)
per_month.plot(marker="o"); plt.show()`, clinic: `per_clinic = data["clinic_id"].value_counts().sort_index()
print(per_clinic)
per_clinic.plot.barh(); plt.show()`, mix: `mix = (100 * data["risk_group"].value_counts(normalize=True)).round(0)
print(mix)
mix.plot.barh(); plt.show()` }[which];
    return { title: L("Dashboard chart", "رسم لوحة المؤشرات"), result: L("the chart", "الرسم"), code: `${PY.load}
import matplotlib.pyplot as plt

${Snip.dashFilters(f)}
${calc}` };
  },
  pipelineRun(bad) { return { title: L("The monthly pipeline with quality gates", "المسار الشهري مع بوابات الجودة"), result: bad ? L("stopped at the quality gates", "توقف عند بوابات الجودة") : L("all gates passed — published", "نجحت كل البوابات — نُشر"), code: `${PY.medlib}
from medlib import load_messy, clean_dataset, quality_report, duplicate_summary, COLUMNS

def run_monthly_pipeline():
    raw = load_messy()                                             # extract
    if list(raw.columns) != COLUMNS:                               # gate 1: structure
        return alert("unexpected columns")
    report = quality_report(raw)
    completeness = 100 - report["missing_count"].sum() / raw.size * 100
    if completeness < 95:                                          # gate 2: completeness
        return alert(f"only {completeness:.1f}% filled")
    if duplicate_summary(raw)["exact_duplicate_pct"] > 3:          # gate 3: duplicates
        return alert("too many duplicates")
    clean, log = clean_dataset(raw)                                # clean
    clean.to_csv("outputs/clean_latest.csv", index=False)            # publish the new table
    return f"published {len(clean)} rows"                          # analyse, forecast, publish ...

def alert(message):
    print("ALERT to data team:", message)                          # e-mail / chat in real life
    return "stopped - last month's dashboard kept"

print(run_monthly_pipeline())
# a scheduler (e.g. cron: 0 6 1 * *) runs this on the 1st of every month at 06:00` }; },
  monitor(field, limit, result) { return { title: L("Monthly quality monitor", "مراقب الجودة الشهري"), result, code: `${PY.medlib}
${PY.raw}
from medlib import parse_date, MISSING_TOKENS

raw["month"] = pd.to_datetime(raw["visit_date"].map(parse_date)).dt.strftime("%Y-%m")
raw = raw[raw["month"].notna()]                                    # skip impossible dates
is_missing = raw[${pyStr(field)}].str.strip().str.lower().isin(MISSING_TOKENS)

pct_missing = (is_missing.groupby(raw["month"]).mean() * 100).round(1)
alerts = pct_missing[pct_missing > ${limit}]                              # alert limit: ${limit}%
print(pct_missing)
print(len(alerts), "alerts:", list(alerts.index))` }; },
  report(ym) { return { title: L("Generating the report text", "إنشاء نص التقرير"), result: L("the report shown", "التقرير المعروض"), code: `${PY.monthly}

def word(change_pct):                         # the wording rule
    return "increased" if change_pct > 2 else "decreased" if change_pct < -2 else "were stable"

m = ts.loc[${pyStr(ym + "-01")}]
prev = ts.shift(1).loc[${pyStr(ym + "-01")}]
last_year = ts.shift(12).loc[${pyStr(ym + "-01")}]
vs_prev = 100 * (m["screening_visits"] - prev["screening_visits"]) / prev["screening_visits"]
vs_year = 100 * (m["screening_visits"] - last_year["screening_visits"]) / last_year["screening_visits"]
avg3 = ts["screening_visits"].rolling(3).mean().loc[${pyStr(ym + "-01")}]

print(f"The clinics completed {m['screening_visits']:,} screening visits. "
      f"Compared with the previous month, visits {word(vs_prev)} ({vs_prev:+.1f}%); "
      f"compared with the same month last year they {word(vs_year)} ({vs_year:+.1f}%). "
      f"Lab requests per screening: {m['lab_requests'] / m['screening_visits']:.2f}. "
      f"3-month average: {avg3:,.0f}.")` }; },
  assistantData(i) {
    const code = [
      `${PY.load}
print(df["clinic_id"].value_counts().head(3))`,
      `${PY.monthly}
print(ts["screening_visits"].groupby(ts.index.year).sum().loc[[2023, 2024]])`,
      `${PY.load}
print(len(df), round(100 * df["medication_adherence_pct"].isna().mean(), 1))`,
      `import json
results = json.load(open("outputs/11_forecasting.json"))["series"]["screening_visits"]   # from python/11_forecasting.py
print(round(sum(results["forecast"])), results["holdout"][results["best_method"]]["mape"])`,
    ][i];
    return { title: L("The data step: how the facts were fetched", "خطوة البيانات: كيف جُلبت الحقائق"), result: L("the table given to the assistant", "الجدول المُعطى للمساعد"), code };
  },
  agentTask(i) {
    const code = [
      `${PY.load}
per_clinic = df["clinic_id"].value_counts()             # tool: run SQL / query
busiest = per_clinic.idxmax()
assert per_clinic.sum() + df["clinic_id"].isna().sum() == len(df)    # check: totals add up
print(busiest, per_clinic.max(), "vs average", round(per_clinic.mean()))`,
      `import json
${PY.monthly}
fc = json.load(open("outputs/11_forecasting.json"))["series"]["screening_visits"]   # tool: read forecast
next_q = sum(fc["forecast"][:3])
last_q = ts["screening_visits"].iloc[-3:].sum()                       # tool: run SQL
change = 100 * (next_q - last_q) / last_q
print(round(next_q), "next quarter vs", last_q, f"last quarter ({change:+.1f}%)")   # check: plausible?`,
      `${PY.load}
key_fields = ["bmi", "fasting_glucose", "hba1c", "total_cholesterol", "medication_adherence_pct"]
completeness = 100 * df[key_fields].notna().values.mean()
adherence_missing = 100 * df["medication_adherence_pct"].isna().mean()
print("completeness target 97%:", "met" if completeness >= 97 else "NOT met")
print("adherence target 5%:   ", "met" if adherence_missing <= 5 else "NOT met")`,
      `ALLOWED_TOPICS = {"screening volumes", "data quality", "reports", "forecasts"}

def guardrail(request):
    """Block anything about treating an individual patient."""
    clinical_words = ["medication", "treatment", "dose", "diagnos", "should patient"]
    if any(word in request.lower() for word in clinical_words):
        log("refused", request)                                  # audit trail
        return "I can't help with treatment decisions. Please refer this to the responsible clinician."
    return None

def log(event, request):
    print("AUDIT:", event, "-", request)

print(guardrail("Should patient PT100042 start a new medication?"))`,
    ][i];
    return { title: L("The agent's tools and checks", "أدوات الوكيل وفحوصه"), result: L("the steps shown", "الخطوات المعروضة"), code };
  },
  riskCheck(c, result) { return { title: L("The risk-check rules", "قواعد فحص المخاطر"), result, code: `answers = ${JSON.stringify(c).replace(/true/g, "True").replace(/false/g, "False")}

def risk_level(a):
    if a["clinical"] and not a["human"]:
        return "Not acceptable"
    score = (2 if a["ident"] else 0) + (3 if a["clinical"] else 0) + (0 if a["human"] else 2) \\
          + (0 if a["audit"] else 1) + (0 if a["tested"] else 1) + (0 if a["minimal"] else 1)
    return "High risk" if score >= 4 else "Medium risk" if score >= 2 else "Lower risk"

print(risk_level(answers))` }; },
};
