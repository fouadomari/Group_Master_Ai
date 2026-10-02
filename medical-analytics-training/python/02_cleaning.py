"""
02_cleaning.py — turn the messy raw extract into an analysis-ready dataset.
Created by Master of AI.

    python python/02_cleaning.py

Creates
    data/clean_patient_screening_data.csv
    data/outliers_patient_data.csv
    outputs/cleaning_log.csv

Cleaning principles used in this training
  1. Never overwrite the raw file — cleaning is a reproducible script.
  2. Standardise formats (whitespace, case, units, codes) before validating.
  3. Impossible values become MISSING; they are never silently "corrected".
  4. Plausible extreme values are KEPT and flagged for review (outliers file).
  5. Every rule is logged with the number of rows it affected.

Synthetic educational data only — not for clinical use.
"""
import numpy as np
import pandas as pd

from medlib import CLEAN_CSV, OUTLIERS_CSV, OUTPUTS, clean_dataset, load_messy

OUTLIER_VARS = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose",
                "hba1c", "total_cholesterol", "medication_adherence_pct", "visits_last_year"]


def find_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """Tukey IQR fences (1.5 x IQR = mild, 3 x IQR = extreme) plus z-score."""
    records = []
    for col in OUTLIER_VARS:
        s = df[col].astype(float)
        q1, q3 = s.quantile([0.25, 0.75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        lo3, hi3 = q1 - 3 * iqr, q3 + 3 * iqr
        z = (s - s.mean()) / s.std()
        mask = (s < lo) | (s > hi)
        for idx in df.index[mask.fillna(False)]:
            v = s[idx]
            records.append({
                "patient_id": df.at[idx, "patient_id"],
                "visit_date": df.at[idx, "visit_date"].date() if pd.notna(df.at[idx, "visit_date"]) else "",
                "clinic_id": df.at[idx, "clinic_id"],
                "variable": col,
                "value": v,
                "lower_fence": round(lo, 2),
                "upper_fence": round(hi, 2),
                "z_score": round(z[idx], 2),
                "outlier_type": "extreme (>3 IQR)" if (v < lo3 or v > hi3) else "mild (1.5-3 IQR)",
                "action": "Retained (valid range) - review source record; consider robust statistics",
            })
    return pd.DataFrame(records)


if __name__ == "__main__":
    raw = load_messy()
    clean, log = clean_dataset(raw)
    clean.to_csv(CLEAN_CSV, index=False, date_format="%Y-%m-%d")
    log.to_csv(OUTPUTS / "cleaning_log.csv", index=False)
    outliers = find_outliers(clean)
    outliers.to_csv(OUTLIERS_CSV, index=False)

    pd.set_option("display.width", 160, "display.max_colwidth", 90)
    print(log.to_string(index=False))
    print(f"\nRaw rows: {len(raw)}   Clean rows: {len(clean)}   Outlier flags: {len(outliers)}")
    print("\nMissing values after cleaning (%):")
    print((clean.isna().mean() * 100).round(1).to_string())
