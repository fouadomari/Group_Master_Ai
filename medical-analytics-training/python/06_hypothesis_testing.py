"""
06_hypothesis_testing.py — is an observed difference supported by evidence?
Created by Master of AI.

    python python/06_hypothesis_testing.py

Example 1  fasting_glucose : Smoker vs Non-Smoker   (two independent samples)
Example 2  heart_rate      : Smoker vs Non-Smoker
Example 3  smoking_status x risk_group               (chi-square, categorical)

Test selection depends on assumptions:
  * Welch's t-test compares MEANS and does not assume equal variances.
    With large samples it is fairly robust to non-normality (CLT), but heavy
    skew/outliers still matter -> we also run Mann-Whitney U (rank-based).
  * A p-value is the probability of data at least this extreme IF H0 were
    true. It is NOT the probability that H0 is true.
  * Statistical significance != practical importance -> report effect sizes
    and confidence intervals.

Realistic training data. These are not clinical findings.
"""
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import ttest_ind

from medlib import load_clean, r, save_results

ALPHA = 0.05


def hedges_g(a, b):
    na, nb = len(a), len(b)
    pooled = np.sqrt(((na - 1) * a.var(ddof=1) + (nb - 1) * b.var(ddof=1)) / (na + nb - 2))
    d = (b.mean() - a.mean()) / pooled
    return d * (1 - 3 / (4 * (na + nb) - 9))


def welch_ci(a, b, level=0.95):
    diff = b.mean() - a.mean()
    va, vb = a.var(ddof=1) / len(a), b.var(ddof=1) / len(b)
    se = np.sqrt(va + vb)
    dof = (va + vb) ** 2 / (va ** 2 / (len(a) - 1) + vb ** 2 / (len(b) - 1))
    t_crit = stats.t.ppf(1 - (1 - level) / 2, dof)
    return diff - t_crit * se, diff + t_crit * se


def compare(df, variable, group_col="smoking_status", a_label="Non-Smoker", b_label="Smoker"):
    group_a = df.loc[df[group_col] == a_label, variable].dropna().astype(float)
    group_b = df.loc[df[group_col] == b_label, variable].dropna().astype(float)

    stat, p_value = ttest_ind(group_a, group_b, equal_var=False)       # Welch
    u_stat, u_p = stats.mannwhitneyu(group_a, group_b, alternative="two-sided")
    lev_stat, lev_p = stats.levene(group_a, group_b)
    lo, hi = welch_ci(group_a, group_b)
    g = hedges_g(group_a, group_b)

    result = {
        "variable": variable, "group_a": a_label, "group_b": b_label,
        "n_a": len(group_a), "n_b": len(group_b),
        "mean_a": r(group_a.mean(), 2), "mean_b": r(group_b.mean(), 2),
        "median_a": r(group_a.median(), 2), "median_b": r(group_b.median(), 2),
        "sd_a": r(group_a.std(), 2), "sd_b": r(group_b.std(), 2),
        "skew_a": r(group_a.skew(), 2), "skew_b": r(group_b.skew(), 2),
        "mean_difference": r(group_b.mean() - group_a.mean(), 2),
        "ci95_difference": [r(lo, 2), r(hi, 2)],
        "welch_t": r(stat, 4), "welch_p": r(p_value, 6),
        "mann_whitney_u": r(u_stat, 1), "mann_whitney_p": r(u_p, 6),
        "levene_p": r(lev_p, 6), "hedges_g": r(g, 3),
        "reject_h0": bool(p_value < ALPHA),
    }
    print(f"\n=== {variable}: {b_label} vs {a_label} ===")
    print(f"n = {len(group_a)} vs {len(group_b)} | mean {group_a.mean():.2f} vs {group_b.mean():.2f} "
          f"| skew {group_a.skew():.2f} / {group_b.skew():.2f}")
    print("t-statistic:", round(stat, 4))
    print("p-value:", round(p_value, 6))
    print(f"Mann-Whitney U p = {u_p:.6f} | Levene p = {lev_p:.4f} | Hedges g = {g:.3f}")
    print(f"95% CI for difference in means: [{lo:.2f}, {hi:.2f}]")
    print("Decision at alpha=0.05:", "reject H0" if p_value < ALPHA else "fail to reject H0 (not 'H0 is true')")
    return result


if __name__ == "__main__":
    df = load_clean()
    glucose = compare(df, "fasting_glucose")
    heart = compare(df, "heart_rate")

    table = pd.crosstab(df["smoking_status"], df["risk_group"])
    chi2, chi_p, dof, expected = stats.chi2_contingency(table)
    cramers_v = np.sqrt(chi2 / (table.values.sum() * (min(table.shape) - 1)))
    print("\n=== smoking_status x risk_group (chi-square test of independence) ===")
    print(table)
    print(f"chi2 = {chi2:.3f}, dof = {dof}, p = {chi_p:.3g}, Cramer's V = {cramers_v:.3f}")

    save_results("06_hypothesis_testing", {
        "alpha": ALPHA, "glucose_smoking": glucose, "heart_rate_smoking": heart,
        "chi_square": {"table": {k: v for k, v in table.to_dict(orient="index").items()},
                       "chi2": r(chi2, 3), "dof": int(dof), "p": float(chi_p), "cramers_v": r(cramers_v, 3)},
    })
