"""
build_notebooks.py — write the five teaching notebooks as valid nbformat v4 JSON.
Created by Master of AI.

Notebooks are self-contained (pandas / scipy / sklearn / statsmodels only) and
read data with paths relative to the notebooks/ folder.
"""
from pathlib import Path

import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook

ROOT = Path(__file__).resolve().parents[1]
NB_DIR = ROOT / "notebooks"
NB_DIR.mkdir(exist_ok=True)

DISCLAIMER = "> **Realistic training data, prepared for teaching.**"

SETUP = """import numpy as np
import pandas as pd
pd.set_option("display.width", 160)
DATA = "../data/"
"""

LOAD_CLEAN = """df = pd.read_csv(DATA + "clean_patient_screening_data.csv", parse_dates=["visit_date"])
print(df.shape)
df.head()"""


def nb(title, cells):
    book = new_notebook()
    book.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
    book.metadata["language_info"] = {"name": "python"}
    book.cells = [new_markdown_cell(f"# {title}\n\nLecture 1 — From Messy Medical Data to Statistical Insight\n\n*Created by Master of AI.*\n\n{DISCLAIMER}")]
    for kind, src in cells:
        book.cells.append(new_markdown_cell(src) if kind == "md" else new_code_cell(src))
    return book


NOTEBOOKS = {
    "01_data_quality.ipynb": nb("01 · Data Quality & Cleaning", [
        ("md", "## 1. Load the raw file *as text*\nReading every column as a string shows the data exactly as delivered."),
        ("code", SETUP + 'raw = pd.read_csv(DATA + "messy_patient_screening_data.csv", dtype=str, keep_default_na=False)\nraw.shape'),
        ("code", "raw.sample(8, random_state=1)"),
        ("md", "## 2. Completeness — missing values *including placeholder text*"),
        ("code", 'tokens = {"", "na", "n/a", "nan", "null", "none", "?", "-", "missing", "not recorded", "unknown"}\n'
                 "missing = raw.apply(lambda s: s.str.strip().str.lower().isin(tokens))\n"
                 "(missing.mean() * 100).round(2).sort_values(ascending=False)"),
        ("md", "## 3. Uniqueness — duplicates"),
        ("code", 'print("exact duplicates:", raw.duplicated().sum())\n'
                 "norm = raw.apply(lambda s: s.str.strip().str.lower())\n"
                 'print("patient_id + visit_date duplicates:", norm.duplicated(subset=["patient_id", "visit_date"]).sum())'),
        ("md", "## 4. Consistency — one concept, many spellings"),
        ("code", 'for col in ["sex", "smoking_status", "family_history_flag", "risk_group"]:\n'
                 '    print(col, sorted(raw[col].unique()))'),
        ("md", "## 5. Validity — numbers stored as text, impossible values"),
        ("code", 'numeric_like = raw["fasting_glucose"].str.fullmatch(r"-?\\d+(\\.\\d+)?")\n'
                 'raw.loc[~numeric_like & (raw["fasting_glucose"] != ""), "fasting_glucose"].value_counts().head(10)'),
        ("code", 'age = pd.to_numeric(raw["age"].str.extract(r"(-?\\d+)")[0], errors="coerce")\n'
                 'age[(age < 18) | (age > 100)].value_counts()'),
        ("md", "## 6. Cleaning rules (same logic as `python/medlib.py`)"),
        ("code", "def extract_number(v):\n"
                 '    m = pd.Series([v]).astype(str).str.extract(r"(-?\\d+(?:[.,]\\d+)?)")[0].iloc[0]\n'
                 '    return np.nan if pd.isna(m) else float(m.replace(",", "."))\n\n'
                 "def parse_bp(v):\n"
                 '    if "/" in str(v):\n'
                 '        s, d = str(v).split("/", 1)\n'
                 "        return extract_number(s), extract_number(d)\n"
                 "    return extract_number(v), np.nan\n\n"
                 'print(parse_bp("138/88"), extract_number("110 mg/dL"), extract_number("6.2%"), extract_number("27,4"))'),
        ("md", "## 7. Compare with the clean file produced by `python/02_cleaning.py`"),
        ("code", 'clean = pd.read_csv(DATA + "clean_patient_screening_data.csv")\n'
                 'print("raw rows:", len(raw), " clean rows:", len(clean))\n'
                 'print(clean["sex"].value_counts(dropna=False))\n'
                 'print(clean["smoking_status"].value_counts(dropna=False))'),
        ("md", "**Key idea:** impossible values become *missing* — they are never silently “fixed”. "
               "Plausible extremes are kept and flagged in `outliers_patient_data.csv`."),
    ]),
    "02_statistics.ipynb": nb("02 · Descriptive Statistics, Distributions & Correlation", [
        ("code", SETUP + LOAD_CLEAN),
        ("md", "## 1. Descriptive statistics\nSample variance/SD (ddof=1); quartiles with linear interpolation."),
        ("code", 'vars_ = ["age", "bmi", "fasting_glucose", "hba1c", "total_cholesterol", "systolic_bp"]\n'
                 "desc = df[vars_].describe(percentiles=[.05, .25, .5, .75, .95]).T\n"
                 'desc["iqr"] = desc["75%"] - desc["25%"]\n'
                 'desc["skew"] = df[vars_].skew()\n'
                 "desc.round(2)"),
        ("md", "## 2. Mean vs median — skewness\nGlucose is right-skewed, so the mean is pulled above the median."),
        ("code", 'g = df["fasting_glucose"].dropna()\n'
                 'print(f"mean={g.mean():.2f} median={g.median():.2f} skew={g.skew():.2f}")'),
        ("md", "## 3. Outliers with Tukey fences"),
        ("code", "q1, q3 = g.quantile([.25, .75]); iqr = q3 - q1\n"
                 "lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr\n"
                 'print(f"fences: [{lo:.1f}, {hi:.1f}]  outliers: {((g < lo) | (g > hi)).sum()}")'),
        ("md", "## 4. Group summaries"),
        ("code", 'df.groupby("risk_group")[vars_].agg(["mean", "median"]).round(1)'),
        ("md", "## 5. Correlation — Pearson (linear) vs Spearman (rank)\n**Correlation does not imply causation.**"),
        ("code", 'num = df[["age", "bmi", "systolic_bp", "fasting_glucose", "hba1c", "total_cholesterol"]]\n'
                 'num.corr(method="pearson").round(2)'),
        ("code", 'num.corr(method="spearman").round(2)'),
        ("code", "import matplotlib.pyplot as plt\n"
                 'ax = df.plot.scatter(x="bmi", y="fasting_glucose", alpha=.35, figsize=(6, 4))\n'
                 'ax.set_title("BMI vs fasting glucose"); plt.show()'),
    ]),
    "03_hypothesis_testing.ipynb": nb("03 · Hypothesis Testing & Confidence Intervals", [
        ("code", SETUP + "from scipy import stats\nfrom scipy.stats import ttest_ind\n" + LOAD_CLEAN),
        ("md", "## 1. Question\nIs mean fasting glucose different between smokers and non-smokers?\n\n"
               "- H0: μ(smoker) = μ(non-smoker)\n- H1: μ(smoker) ≠ μ(non-smoker)\n- α = 0.05"),
        ("code", 'group_a = df.loc[df["smoking_status"] == "Non-Smoker", "fasting_glucose"].dropna()\n'
                 'group_b = df.loc[df["smoking_status"] == "Smoker", "fasting_glucose"].dropna()\n'
                 'print(len(group_a), len(group_b), round(group_a.mean(), 2), round(group_b.mean(), 2))'),
        ("md", "## 2. Check assumptions\nSkewed data and unequal variances -> Welch's t-test, plus a rank-based check."),
        ("code", 'print("skew:", round(group_a.skew(), 2), round(group_b.skew(), 2))\n'
                 'print("Levene p:", stats.levene(group_a, group_b).pvalue)'),
        ("code", "stat, p_value = ttest_ind(group_a, group_b, equal_var=False)\n"
                 'print("t-statistic:", stat)\nprint("p-value:", p_value)\n'
                 'print("Mann-Whitney U p:", stats.mannwhitneyu(group_a, group_b).pvalue)'),
        ("md", "**Interpretation.** The p-value is the probability of observing a difference at least this large "
               "*if H0 were true*. It is **not** the probability that H0 is true. A large p-value means "
               "*insufficient evidence*, not *proof of no difference*."),
        ("md", "## 3. Effect size — practical significance"),
        ("code", "na, nb = len(group_a), len(group_b)\n"
                 "pooled = np.sqrt(((na-1)*group_a.var() + (nb-1)*group_b.var()) / (na+nb-2))\n"
                 'print("Cohen d:", round((group_b.mean() - group_a.mean()) / pooled, 3))'),
        ("md", "## 4. 95% confidence interval for a mean"),
        ("code", 'g = df["fasting_glucose"].dropna()\n'
                 "se = g.std(ddof=1) / np.sqrt(len(g))\n"
                 "t_crit = stats.t.ppf(0.975, len(g) - 1)\n"
                 'print(f"mean {g.mean():.2f}, 95% CI [{g.mean()-t_crit*se:.2f}, {g.mean()+t_crit*se:.2f}]")'),
        ("md", "**Correct interpretation:** if we repeated the sampling many times and built an interval each time, "
               "about 95% of those intervals would contain the true mean. We do **not** say there is a 95% probability "
               "that the true value lies in this particular interval."),
        ("md", "## 5. Simulation — coverage of repeated 95% intervals (systolic BP, n = 50)"),
        ("code", "rng = np.random.default_rng(42)\n"
                 'pop = df["systolic_bp"].dropna().values; mu = pop.mean(); hits = 0\n'
                 "for _ in range(1000):\n"
                 "    s = rng.choice(pop, 50, replace=False)\n"
                 "    half = stats.t.ppf(.975, 49) * s.std(ddof=1) / np.sqrt(50)\n"
                 "    hits += abs(s.mean() - mu) <= half\n"
                 'print("coverage %:", hits / 10)'),
    ]),
    "04_machine_learning.ipynb": nb("04 · Feature Engineering, Machine Learning & Evaluation", [
        ("md", "> **Teaching target — not a clinically validated prediction.**"),
        ("code", SETUP + LOAD_CLEAN),
        ("md", "## 1. Feature engineering"),
        ("code", 'df["is_smoker"] = (df["smoking_status"] == "Smoker").astype(int)\n'
                 'df["is_male"] = (df["sex"] == "Male").astype(int)\n'
                 'df["pulse_pressure"] = df["systolic_bp"] - df["diastolic_bp"]\n'
                 'df["bmi_category"] = pd.cut(df["bmi"], [0, 18.5, 25, 30, 200], right=False,\n'
                 '                            labels=["Underweight", "Normal", "Overweight", "Obese"])\n'
                 'df["bmi_category"].value_counts()'),
        ("md", "## 2. Features, target, split\n`risk_score` and `follow_up_days` are excluded — they would **leak** the answer."),
        ("code", "from sklearn.model_selection import train_test_split\n"
                 'features = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose", "hba1c",\n'
                 '            "total_cholesterol", "exercise_days_per_week", "family_history_flag",\n'
                 '            "medication_adherence_pct", "visits_last_year", "is_smoker", "is_male"]\n'
                 'data = df[df["risk_group"].notna()]\n'
                 'X, y = data[features].astype(float), data["risk_group"]\n'
                 "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.25, stratify=y, random_state=42)\n"
                 "X_train.shape, X_test.shape"),
        ("md", "## 3. Train three classifiers (imputation inside the pipeline -> no test-set leakage)"),
        ("code", "from sklearn.pipeline import make_pipeline\nfrom sklearn.impute import SimpleImputer\n"
                 "from sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\n"
                 "from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier\n"
                 "models = {\n"
                 '    "Logistic Regression": make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(max_iter=2000)),\n'
                 '    "Random Forest": make_pipeline(SimpleImputer(strategy="median"), RandomForestClassifier(n_estimators=300, min_samples_leaf=3, random_state=42)),\n'
                 '    "Gradient Boosting": make_pipeline(SimpleImputer(strategy="median"), GradientBoostingClassifier(random_state=42)),\n'
                 "}\n"
                 "for name, model in models.items():\n"
                 "    model.fit(X_train, y_train)\n"
                 '    print(f"{name:<20} train {model.score(X_train, y_train):.3f}  test {model.score(X_test, y_test):.3f}")'),
        ("md", "## 4. Evaluation — confusion matrix, precision, recall, F1"),
        ("code", "from sklearn.metrics import classification_report, confusion_matrix\n"
                 'labels = ["Low", "Moderate", "High"]\n'
                 'pred = models["Gradient Boosting"].predict(X_test)\n'
                 "print(confusion_matrix(y_test, pred, labels=labels))\n"
                 "print(classification_report(y_test, pred, labels=labels))"),
        ("md", "## 5. Regression metrics (MAE, RMSE, R²) — R² is *not* accuracy"),
        ("code", "from sklearn.linear_model import LinearRegression\n"
                 "from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score\n"
                 'reg = data[data["risk_score"].notna()]\n'
                 'Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(reg[features].astype(float), reg["risk_score"], test_size=.25, random_state=42)\n'
                 'lin = make_pipeline(SimpleImputer(strategy="median"), LinearRegression()).fit(Xr_tr, yr_tr)\n'
                 "p = lin.predict(Xr_te)\n"
                 'print("MAE", mean_absolute_error(yr_te, p), "RMSE", mean_squared_error(yr_te, p) ** .5, "R2", r2_score(yr_te, p))'),
        ("md", "## 6. Leakage demonstration — why ‘too good to be true’ results need scrutiny"),
        ("code", 'Xl = data[features + ["risk_score"]].astype(float)\n'
                 "a, b, c, d = train_test_split(Xl, y, test_size=.25, stratify=y, random_state=42)\n"
                 'leaky = make_pipeline(SimpleImputer(strategy="median"), RandomForestClassifier(random_state=42)).fit(a, c)\n'
                 'print("test accuracy WITH leakage:", round(leaky.score(b, d), 3))'),
    ]),
    "05_forecasting.ipynb": nb("05 · Forecasting Aggregate Clinic Activity", [
        ("md", "We forecast **aggregate operational volumes** for planning — never individual disease progression."),
        ("code", SETUP + 'ts = pd.read_csv(DATA + "monthly_clinic_activity.csv", parse_dates=["month"]).set_index("month")\n'
                 "ts.tail()"),
        ("code", "import matplotlib.pyplot as plt\nts.plot(figsize=(10, 4), title='Monthly activity'); plt.show()"),
        ("md", "## 1. Decomposition: trend + seasonality + remainder"),
        ("code", "from statsmodels.tsa.seasonal import seasonal_decompose\n"
                 'dec = seasonal_decompose(ts["screening_visits"], model="additive", period=12)\n'
                 "dec.plot(); plt.show()"),
        ("md", "## 2. Hold-out evaluation (last 12 months)"),
        ("code", "from statsmodels.tsa.holtwinters import ExponentialSmoothing\n"
                 'y = ts["screening_visits"].astype(float)\n'
                 "train, test = y[:-12], y[-12:]\n"
                 "naive = np.array([train.iloc[-12 + i] for i in range(12)])\n"
                 'hw = ExponentialSmoothing(train, trend="add", seasonal="add", seasonal_periods=12).fit().forecast(12)\n'
                 "def scores(a, p):\n"
                 "    e = np.asarray(a) - np.asarray(p)\n"
                 '    return {"MAE": np.abs(e).mean().round(2), "RMSE": np.sqrt((e**2).mean()).round(2),\n'
                 '            "MAPE %": (100 * np.abs(e / np.asarray(a))).mean().round(2)}\n'
                 'print("seasonal naive", scores(test, naive))\nprint("Holt-Winters  ", scores(test, hw))'),
        ("md", "## 3. Forecast the next 12 months"),
        ("code", 'model = ExponentialSmoothing(y, trend="add", seasonal="add", seasonal_periods=12).fit()\n'
                 "fc = model.forecast(12)\n"
                 "ax = y.plot(figsize=(10, 4), label='history'); fc.plot(ax=ax, label='forecast'); ax.legend(); plt.show()\n"
                 "fc.round(0)"),
        ("md", "**Limitations:** forecasts assume the past pattern continues; policy changes, outbreaks or new "
               "services break that assumption. Always communicate uncertainty ranges."),
    ]),
}

if __name__ == "__main__":
    for name, book in NOTEBOOKS.items():
        nbformat.validate(book)
        nbformat.write(book, NB_DIR / name)
        print("wrote", name, len(book.cells), "cells")
