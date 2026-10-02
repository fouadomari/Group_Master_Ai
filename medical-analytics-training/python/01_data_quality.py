"""
01_data_quality.py — profile the RAW extract before touching it.
Created by Master of AI.

    python python/01_data_quality.py

Measures the six data-quality dimensions used in the lecture:
  Completeness  -> missing values (including placeholder text such as 'NA', '?')
  Uniqueness    -> exact and key-based duplicate rows
  Validity      -> values outside documented ranges / unparseable values
  Consistency   -> many spellings for one category, mixed formats, whitespace
  Accuracy      -> statistical outliers that need source verification
  Timeliness    -> visit dates that are impossible or after the extraction date

Outputs: outputs/data_quality_report.csv, outputs/01_data_quality.json,
         outputs/fig_missing_by_column.png

Synthetic educational data only.
"""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from medlib import OUTPUTS, duplicate_summary, load_messy, parse_date, quality_report, save_results

raw = load_messy()
report = quality_report(raw)
dups = duplicate_summary(raw)

total_cells = raw.shape[0] * raw.shape[1]
missing_cells = int(report["missing_count"].sum())
dates = raw["visit_date"].map(parse_date)

summary = {
    **dups,
    "columns": raw.shape[1],
    "total_cells": total_cells,
    "missing_cells": missing_cells,
    "completeness_pct": round(100 * (1 - missing_cells / total_cells), 2),
    "columns_with_format_issues": int((report["format_issues"] > 0).sum()),
    "invalid_values": int(report["invalid_values"].sum()),
    "invalid_dates": int(dates.isna().sum()),
    "raw_sex_labels": sorted(raw["sex"].str.strip().unique().tolist()),
    "raw_smoking_labels": sorted(raw["smoking_status"].str.strip().unique().tolist()),
    "raw_family_history_labels": sorted(raw["family_history_flag"].str.strip().unique().tolist()),
    "raw_risk_group_labels": sorted(raw["risk_group"].unique().tolist()),
}

if __name__ == "__main__":
    report.to_csv(OUTPUTS / "data_quality_report.csv", index=False)
    save_results("01_data_quality", {"summary": summary, "columns": report.to_dict(orient="records")})

    fig, ax = plt.subplots(figsize=(9, 6))
    rep = report.sort_values("missing_pct")
    ax.barh(rep["column"], rep["missing_pct"], color="#2f6fde")
    ax.set_xlabel("Missing (%) — includes placeholder text")
    ax.set_title("Completeness by column (raw synthetic extract)")
    fig.tight_layout()
    fig.savefig(OUTPUTS / "fig_missing_by_column.png", dpi=120)

    print(f"Rows: {dups['rows']}  exact duplicates: {dups['exact_duplicates']}  "
          f"patient+date duplicates: {dups['key_duplicates']}")
    print(f"Overall completeness: {summary['completeness_pct']}%   invalid dates: {summary['invalid_dates']}")
    print("\nRaw sex labels:", summary["raw_sex_labels"])
    print("Raw smoking labels:", summary["raw_smoking_labels"])
    print()
    print(report.to_string(index=False))
