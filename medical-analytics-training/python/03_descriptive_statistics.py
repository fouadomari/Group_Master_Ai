"""
03_descriptive_statistics.py — summarise each clinical measurement.
Created by Master of AI.

    python python/03_descriptive_statistics.py

Conventions (the website uses exactly the same ones):
  * variance / standard deviation use the SAMPLE formula (ddof = 1)
  * quartiles & percentiles use linear interpolation (pandas default)
  * skewness = adjusted Fisher-Pearson coefficient (pandas .skew())
  * missing values are excluded; n is reported for every variable

Outputs: outputs/descriptive_statistics.csv, outputs/03_descriptive_statistics.json
Realistic training data.
"""
import pandas as pd

from medlib import OUTPUTS, load_clean, r, save_results

VARIABLES = ["age", "bmi", "fasting_glucose", "hba1c", "total_cholesterol",
             "systolic_bp", "diastolic_bp", "heart_rate"]


def describe(s: pd.Series) -> dict:
    s = s.dropna().astype(float)
    q = s.quantile([0.05, 0.25, 0.5, 0.75, 0.95])
    mode = s.mode()
    return {
        "n": int(s.size), "mean": r(s.mean()), "median": r(s.median()),
        "mode": r(mode.iloc[0]) if len(mode) else None,
        "min": r(s.min()), "max": r(s.max()), "range": r(s.max() - s.min()),
        "variance": r(s.var()), "std": r(s.std()),
        "q1": r(q[0.25]), "q3": r(q[0.75]), "iqr": r(q[0.75] - q[0.25]),
        "p5": r(q[0.05]), "p95": r(q[0.95]),
        "skewness": r(s.skew()), "kurtosis": r(s.kurt()),
        "cv_pct": r(100 * s.std() / s.mean(), 2),
    }


if __name__ == "__main__":
    df = load_clean()
    stats = {v: describe(df[v]) for v in VARIABLES}
    table = pd.DataFrame(stats).T
    table.to_csv(OUTPUTS / "descriptive_statistics.csv")

    by_group = {v: {str(g): describe(sub[v]) for g, sub in df.groupby("risk_group", observed=True)}
                for v in VARIABLES}
    save_results("03_descriptive_statistics", {"overall": stats, "by_risk_group": by_group})

    pd.set_option("display.width", 200)
    print(table[["n", "mean", "median", "std", "min", "q1", "q3", "max", "iqr", "skewness"]].to_string())
    print("\nMean fasting glucose by teaching risk group:")
    print(df.groupby("risk_group", observed=True)["fasting_glucose"].agg(["count", "mean", "median", "std"]).round(2))
