"""
04_eda.py — exploratory data analysis: look before you model.
Created by Master of AI.

    python python/04_eda.py

Produces histograms, box plots and group summaries for the clean dataset.
EDA generates QUESTIONS and hypotheses; it does not prove anything on its own.

Outputs: outputs/fig_eda_histograms.png, outputs/fig_eda_boxplots.png,
         outputs/eda_group_summary.csv, outputs/04_eda.json
Realistic training data.
"""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from medlib import OUTPUTS, RISK_ORDER, load_clean, r, save_results

VARS = ["age", "bmi", "fasting_glucose", "hba1c"]

if __name__ == "__main__":
    df = load_clean()

    fig, axes = plt.subplots(2, 2, figsize=(10, 7))
    for ax, col in zip(axes.flat, VARS):
        ax.hist(df[col].dropna().astype(float), bins=30, color="#2f6fde", edgecolor="white")
        ax.axvline(df[col].astype(float).mean(), color="#d9480f", ls="--", label="mean")
        ax.axvline(df[col].astype(float).median(), color="#2b8a3e", ls=":", label="median")
        ax.set_title(col)
        ax.legend()
    fig.suptitle("Distributions")
    fig.tight_layout()
    fig.savefig(OUTPUTS / "fig_eda_histograms.png", dpi=120)

    fig, axes = plt.subplots(1, 4, figsize=(14, 4))
    for ax, col in zip(axes, VARS):
        data = [df.loc[df["risk_group"] == g, col].dropna().astype(float) for g in RISK_ORDER]
        ax.boxplot(data, tick_labels=RISK_ORDER)
        ax.set_title(col)
    fig.suptitle("By teaching risk group")
    fig.tight_layout()
    fig.savefig(OUTPUTS / "fig_eda_boxplots.png", dpi=120)

    summary = (df.groupby("risk_group", observed=True)[VARS].mean().round(2))
    summary["n"] = df["risk_group"].value_counts().reindex(RISK_ORDER)
    summary.to_csv(OUTPUTS / "eda_group_summary.csv")

    counts = {
        "risk_group": df["risk_group"].value_counts().reindex(RISK_ORDER).to_dict(),
        "sex": df["sex"].value_counts(dropna=False).rename(index=lambda k: str(k)).to_dict(),
        "smoking_status": df["smoking_status"].value_counts(dropna=False).rename(index=lambda k: str(k)).to_dict(),
        "clinic_id": df["clinic_id"].value_counts(dropna=False).sort_index().rename(index=lambda k: str(k)).to_dict(),
    }
    crosstab = (df.pivot_table(index="clinic_id", columns="risk_group", values="patient_id",
                               aggfunc="count", observed=True).fillna(0).astype(int))
    save_results("04_eda", {
        "counts": counts,
        "group_means": {g: {v: r(summary.loc[g, v], 2) for v in VARS} for g in RISK_ORDER},
        "clinic_by_risk": {c: row.to_dict() for c, row in crosstab.iterrows()},
    })

    print(summary)
    print("\nClinic x risk group counts:\n", crosstab)
