"""
05_correlation.py — measure association between numeric variables.
Created by Master of AI.

    python python/05_correlation.py

  covariance  : direction of joint variation (unit-dependent, hard to compare)
  Pearson r   : strength of LINEAR association (-1 .. +1), sensitive to outliers
  Spearman rho: strength of MONOTONIC association, based on ranks, more robust

Correlation does NOT imply causation. Associations in this synthetic dataset
were programmed into the generator — they are not medical findings.

Outputs: outputs/correlation_pearson.csv, outputs/correlation_spearman.csv,
         outputs/fig_correlation_heatmap.png, outputs/05_correlation.json
"""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy import stats

from medlib import OUTPUTS, load_clean, r, save_results

VARS = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose",
        "hba1c", "total_cholesterol", "exercise_days_per_week", "medication_adherence_pct",
        "visits_last_year", "risk_score"]
PAIRS = [("bmi", "fasting_glucose"), ("hba1c", "fasting_glucose"), ("age", "systolic_bp"),
         ("exercise_days_per_week", "heart_rate"), ("age", "total_cholesterol")]

if __name__ == "__main__":
    df = load_clean()[VARS].astype(float)
    pearson = df.corr(method="pearson")      # pairwise complete observations
    spearman = df.corr(method="spearman")
    pearson.round(3).to_csv(OUTPUTS / "correlation_pearson.csv")
    spearman.round(3).to_csv(OUTPUTS / "correlation_spearman.csv")

    pairs = []
    for x, y in PAIRS:
        sub = df[[x, y]].dropna()
        pr, pp = stats.pearsonr(sub[x], sub[y])
        sr, sp = stats.spearmanr(sub[x], sub[y])
        pairs.append({"x": x, "y": y, "n": len(sub), "covariance": r(sub[x].cov(sub[y])),
                      "pearson_r": r(pr), "pearson_p": float(pp), "spearman_rho": r(sr), "spearman_p": float(sp),
                      "r_squared": r(pr ** 2)})
        print(f"{x:>24} vs {y:<16} n={len(sub):4d}  cov={sub[x].cov(sub[y]):9.2f}  "
              f"Pearson r={pr:+.3f}  Spearman rho={sr:+.3f}")

    fig, ax = plt.subplots(figsize=(9, 8))
    im = ax.imshow(pearson, cmap="RdBu_r", vmin=-1, vmax=1)
    ax.set_xticks(range(len(VARS)), VARS, rotation=60, ha="right")
    ax.set_yticks(range(len(VARS)), VARS)
    for i in range(len(VARS)):
        for j in range(len(VARS)):
            ax.text(j, i, f"{pearson.iat[i, j]:.2f}", ha="center", va="center", fontsize=7)
    fig.colorbar(im)
    ax.set_title("Pearson correlation (synthetic data)")
    fig.tight_layout()
    fig.savefig(OUTPUTS / "fig_correlation_heatmap.png", dpi=120)

    save_results("05_correlation", {
        "variables": VARS,
        "pearson": np.round(pearson.values, 3), "spearman": np.round(spearman.values, 3),
        "pairs": pairs,
    })
