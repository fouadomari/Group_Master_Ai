"""
07_confidence_intervals.py — quantify the uncertainty of an estimate.
Created by Master of AI.

    python python/07_confidence_intervals.py

Correct (frequentist) interpretation of a 95% confidence interval:
  If we repeated the sampling process many times and built an interval each
  time with this method, about 95% of those intervals would contain the true
  population value. A single computed interval either contains it or not —
  we do NOT say "there is a 95% probability the true value is in this interval".

Also shown: a simulation of coverage and a bootstrap CI for the median.
Realistic training data.
"""
import numpy as np
import pandas as pd
from scipy import stats

from medlib import SEED, load_clean, r, save_results

VARS = ["fasting_glucose", "bmi", "systolic_bp", "hba1c", "total_cholesterol", "age"]


def mean_ci(s, level=0.95):
    s = s.dropna().astype(float)
    n, mean, se = len(s), s.mean(), s.std(ddof=1) / np.sqrt(len(s))
    t_crit = stats.t.ppf(1 - (1 - level) / 2, n - 1)
    return {"n": n, "mean": r(mean), "sd": r(s.std()), "se": r(se, 4), "t_crit": r(t_crit, 4),
            "lower": r(mean - t_crit * se), "upper": r(mean + t_crit * se), "level": level}


def bootstrap_median_ci(s, reps=5000, level=0.95, seed=SEED):
    rng = np.random.default_rng(seed)
    s = s.dropna().astype(float).values
    meds = np.median(rng.choice(s, size=(reps, len(s)), replace=True), axis=1)
    lo, hi = np.percentile(meds, [100 * (1 - level) / 2, 100 * (1 + level) / 2])
    return {"median": r(np.median(s)), "lower": r(lo), "upper": r(hi), "reps": reps}


def coverage_simulation(s, n=50, reps=1000, seed=SEED):
    """Treat the full dataset as the 'population'; repeatedly sample n rows."""
    rng = np.random.default_rng(seed)
    pop = s.dropna().astype(float).values
    true_mean = pop.mean()
    hits = 0
    for _ in range(reps):
        sample = rng.choice(pop, n, replace=False)
        half = stats.t.ppf(0.975, n - 1) * sample.std(ddof=1) / np.sqrt(n)
        hits += abs(sample.mean() - true_mean) <= half
    return {"population_mean": r(true_mean), "sample_size": n, "reps": reps, "coverage_pct": r(100 * hits / reps, 1)}


if __name__ == "__main__":
    df = load_clean()
    overall = {v: {lvl: mean_ci(df[v], lvl) for lvl in (0.90, 0.95, 0.99)} for v in VARS}
    by_group = {v: {str(g): mean_ci(sub[v]) for g, sub in df.groupby("risk_group", observed=True)} for v in VARS}
    by_smoking = {v: {str(g): mean_ci(sub[v]) for g, sub in df.groupby("smoking_status")} for v in VARS}
    boot = bootstrap_median_ci(df["fasting_glucose"])
    sim = {v: coverage_simulation(df[v]) for v in ["systolic_bp", "fasting_glucose"]}

    rows = [{"variable": v, **overall[v][0.95]} for v in VARS]
    print(pd.DataFrame(rows).to_string(index=False))
    print("\nBootstrap 95% CI for median glucose:", boot)
    print("Coverage simulation:", sim)

    save_results("07_confidence_intervals", {
        "overall": {v: {str(k): val for k, val in d.items()} for v, d in overall.items()},
        "by_risk_group": by_group, "by_smoking": by_smoking,
        "bootstrap_median_glucose": boot, "coverage_simulation": sim,
    })
