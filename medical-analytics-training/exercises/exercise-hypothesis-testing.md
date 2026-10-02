# Exercise 3 — Hypothesis Testing & Confidence Intervals

*Created by Master of AI.*

> **Realistic training data, prepared for teaching.**

**Lecture 1 sections:** 13 Hypothesis Testing · 14 Confidence Intervals
**Level:** Intermediate · **Time:** ~40 minutes

## Objective

Choose an appropriate test from the data's characteristics, run it with SciPy, report the effect size and confidence interval alongside the p-value, and write a correct interpretation.

## Dataset

`data/clean_patient_screening_data.csv`

## Tasks

1. State H₀ and H₁ for: *"Does mean resting heart rate differ between smokers and non-smokers?"* Fix α = 0.05 **before** looking at the data.
2. Check assumptions: group sizes, skewness of each group, and Levene's test for equal variances. Which test do you choose?
3. Run **Welch's t-test** (`ttest_ind(..., equal_var=False)`). Report t, p, the mean difference with its 95% CI, and Hedges' g.
4. Repeat steps 2–3 for `fasting_glucose`, and also run the **Mann–Whitney U** test. Why might the two tests disagree?
5. Run a **chi-square test of independence** for `smoking_status` × `risk_group`, and compute Cramér's V.
6. Compute the 95% confidence interval for mean `hba1c`, and write its correct interpretation.
7. Which of these statements are **wrong**? (a) "p = 0.197 means there is a 19.7% chance H₀ is true." (b) "Fail to reject H₀ means the means are equal." (c) "If we repeated the study many times, 95% of the intervals built this way would contain the true mean."

## Hints

- Welch's t-test does not assume equal variances; with large samples it is fairly robust to non-normality, but extreme outliers still inflate the variance of the mean.
- Hedges' g: `(mean_b − mean_a) / pooled_sd × (1 − 3 / (4·(n_a + n_b) − 9))`
- `scipy.stats.chi2_contingency(pd.crosstab(df["smoking_status"], df["risk_group"]))`
- CI for a mean: `mean ± t(0.975, n−1) × sd / √n`

## Expected output

**Heart rate (smokers vs non-smokers)**

| | Non-Smoker | Smoker |
|---|---|---|
| n | 873 | 250 |
| Mean (bpm) | 72.15 | 77.14 |
| Skewness | 0.00 | 0.17 |

Levene p = 0.375 · Welch t = −7.597 · p < 0.001 · difference = 4.98 bpm, 95% CI [3.69, 6.27] · Hedges' g = 0.53 (medium) → **reject H₀**.

**Fasting glucose:** n = 863 vs 240; means 96.08 vs 98.30; skewness 5.96 / 2.46 · Welch t = −1.293, **p = 0.197** (difference 2.22, 95% CI [−1.15, 5.59]) · Mann–Whitney **p = 0.0032** · Hedges' g = 0.08 (negligible).

**Chi-square:** χ² = 72.90, df = 2, p ≈ 1.5 × 10⁻¹⁶, Cramér's V = 0.25.

**HbA1c:** mean 5.463 %, 95% CI [5.416, 5.510] (n = 1,125).

## Solution

```python
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import ttest_ind

df = pd.read_csv("data/clean_patient_screening_data.csv")

def compare(variable):
    group_a = df.loc[df["smoking_status"] == "Non-Smoker", variable].dropna()
    group_b = df.loc[df["smoking_status"] == "Smoker", variable].dropna()
    print(f"\n{variable}: n={len(group_a)}/{len(group_b)} means={group_a.mean():.2f}/{group_b.mean():.2f} "
          f"skew={group_a.skew():.2f}/{group_b.skew():.2f} Levene p={stats.levene(group_a, group_b).pvalue:.3f}")
    stat, p_value = ttest_ind(group_a, group_b, equal_var=False)
    va, vb = group_a.var() / len(group_a), group_b.var() / len(group_b)
    dof = (va + vb) ** 2 / (va ** 2 / (len(group_a) - 1) + vb ** 2 / (len(group_b) - 1))
    diff, se = group_b.mean() - group_a.mean(), np.sqrt(va + vb)
    t_crit = stats.t.ppf(0.975, dof)
    pooled = np.sqrt(((len(group_a) - 1) * group_a.var() + (len(group_b) - 1) * group_b.var()) / (len(group_a) + len(group_b) - 2))
    g = diff / pooled * (1 - 3 / (4 * (len(group_a) + len(group_b)) - 9))
    print(f"Welch t={stat:.3f} p={p_value:.4g}  diff={diff:.2f} 95% CI [{diff - t_crit * se:.2f}, {diff + t_crit * se:.2f}]  g={g:.2f}")
    print("Mann-Whitney U p =", round(stats.mannwhitneyu(group_a, group_b).pvalue, 4))

compare("heart_rate")
compare("fasting_glucose")

table = pd.crosstab(df["smoking_status"], df["risk_group"])
chi2, p, dof, _ = stats.chi2_contingency(table)
print(f"\nchi2={chi2:.2f} dof={dof} p={p:.2g} Cramer's V={np.sqrt(chi2 / (table.values.sum() * (min(table.shape) - 1))):.2f}")

h = df["hba1c"].dropna()
se = h.std(ddof=1) / np.sqrt(len(h)); t_crit = stats.t.ppf(0.975, len(h) - 1)
print(f"HbA1c mean {h.mean():.3f}, 95% CI [{h.mean() - t_crit * se:.3f}, {h.mean() + t_crit * se:.3f}]")
```

**Answers**

- **(2)** Heart rate is roughly symmetric, groups are large and independent, variances similar → a t-test is appropriate; Welch's version is the safe default.
- **(4)** The tests ask different questions. Welch compares **means**; glucose has extreme values (skewness ≈ 6) that make the mean noisy, so the mean difference is not distinguishable from chance. Mann–Whitney compares the overall **ranking** of values and detects a small but consistent shift (medians 92 vs 95). Decide which question matters *before* testing, and report the effect size — here it is negligible either way.
- **(5)** Smoking status and the teaching risk group are associated (the risk rule includes smoking); the strength is modest (V = 0.25). This is association, not causation.
- **(6)** *"If we repeated this sampling many times, about 95% of intervals constructed this way would contain the true mean HbA1c."*
- **(7)** (a) and (b) are wrong. A p-value is computed **assuming** H₀ is true, so it cannot be the probability that H₀ is true; failing to reject H₀ means insufficient evidence, not proof of equality. (c) is the correct frequentist interpretation.
