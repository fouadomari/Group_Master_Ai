# Exercise 2 — Descriptive Statistics, Distributions & Correlation

*Created by Master of AI.*

> **Realistic training data, prepared for teaching.**

**Lecture 1 sections:** 09 Descriptive Statistics · 10 Distribution & Variability · 11 EDA · 12 Correlation
**Level:** Beginner · **Time:** ~45 minutes

## Objective

Describe clinical measurements with measures of centre, spread and position; detect outliers with Tukey fences; compare groups; and measure association with Pearson and Spearman correlation — without making causal claims.

## Dataset

`data/clean_patient_screening_data.csv` (1,200 rows, output of `python/02_cleaning.py`).

## Tasks

1. For `hba1c` and `bmi`, compute: n, mean, median, standard deviation, Q1, Q3, IQR and skewness.
2. Is each distribution symmetric? Which measure of centre would you report, and why?
3. Compute the mean and median `hba1c` for each `risk_group` (Low / Moderate / High), with counts.
4. For `fasting_glucose`, compute the Tukey fences (Q1 − 1.5·IQR, Q3 + 1.5·IQR) and count the values outside them.
5. Compute Pearson and Spearman correlations for **BMI vs fasting glucose** and **HbA1c vs fasting glucose** (pairwise complete rows). Why do Pearson and Spearman differ for BMI vs glucose?
6. Write one sentence describing the BMI–glucose relationship that a manager could read **without** implying causation.

## Hints

- pandas uses the sample standard deviation (`ddof=1`) and linear interpolation for quantiles by default — the website uses the same conventions.
- `df.groupby("risk_group")["hba1c"].agg(["count", "mean", "median"])`
- `df[["bmi", "fasting_glucose"]].dropna()` keeps only complete pairs; then use `scipy.stats.pearsonr` / `spearmanr`.
- Spearman uses ranks — it is less affected by a long tail of extreme values.

## Expected output

| Statistic | HbA1c (%) | BMI (kg/m²) |
|---|---|---|
| n | 1,125 | 1,147 |
| Mean | 5.463 | 27.105 |
| Median | 5.3 | 26.4 |
| SD | 0.798 | 4.868 |
| Q1 / Q3 | 5.0 / 5.7 | 23.7 / 29.7 |
| IQR | 0.7 | 6.0 |
| Skewness | 2.31 | 1.45 |

- HbA1c by risk group — Low: n = 355, mean 5.09, median 5.1 · Moderate: n = 359, mean 5.29, median 5.3 · High: n = 411, mean 5.94, median 5.7
- Glucose Tukey fences: **[58.5, 126.5]** mg/dL → **62** values outside (all above the upper fence)
- BMI vs glucose (n = 1,088): Pearson r = **0.276**, Spearman ρ = **0.503**
- HbA1c vs glucose (n = 1,067): Pearson r = **0.690**, Spearman ρ = **0.803**

## Solution

```python
import pandas as pd
from scipy import stats

df = pd.read_csv("data/clean_patient_screening_data.csv")

# 1. descriptive statistics
for col in ["hba1c", "bmi"]:
    s = df[col].dropna()
    q1, q3 = s.quantile([0.25, 0.75])
    print(col, dict(n=s.size, mean=round(s.mean(), 3), median=s.median(), sd=round(s.std(), 3),
                    q1=q1, q3=q3, iqr=round(q3 - q1, 3), skew=round(s.skew(), 2)))

# 3. group comparison
print(df.groupby("risk_group")["hba1c"].agg(["count", "mean", "median"]).round(3))

# 4. outliers with Tukey fences
g = df["fasting_glucose"].dropna()
q1, q3 = g.quantile([0.25, 0.75]); iqr = q3 - q1
lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
print(f"fences [{lower}, {upper}]  outliers: {((g < lower) | (g > upper)).sum()}")

# 5. correlation
for x in ["bmi", "hba1c"]:
    pair = df[[x, "fasting_glucose"]].dropna()
    r, _ = stats.pearsonr(pair[x], pair["fasting_glucose"])
    rho, _ = stats.spearmanr(pair[x], pair["fasting_glucose"])
    print(f"{x} vs glucose: n={len(pair)}  Pearson r={r:.3f}  Spearman rho={rho:.3f}")
```

**Answers to the discussion questions**

- **(2)** Both distributions are right-skewed (skewness > 0.5; mean > median). The **median** (with the IQR) is the better "typical" value; report the mean too, but explain the skew.
- **(5)** Glucose has a long upper tail of extreme values. Pearson measures *linear* association and is pulled around by those points; Spearman works on ranks, so it captures the consistent *monotonic* tendency (higher BMI → higher glucose rank) more robustly.
- **(6)** *"In this screening sample, patients with higher BMI tend to have higher fasting glucose (Spearman ρ ≈ 0.50). This is an association in observational data and does not show that BMI causes higher glucose."*
