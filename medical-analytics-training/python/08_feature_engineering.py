"""
08_feature_engineering.py — derive analytical features from raw variables.
Created by Master of AI.

    python python/08_feature_engineering.py

Derived features (see medlib.add_features):
  age_group, bmi_category, pulse_pressure, mean_arterial_pressure,
  exercise_category, frequent_visitor, *_missing indicators, is_smoker, is_male

IMPORTANT: a derived feature is an analytical convenience. Category cut-offs
used here are for teaching; a feature does not automatically have clinical
validity, and binning always discards information.

Outputs: outputs/features_dataset.csv, outputs/08_feature_engineering.json
Synthetic educational data only.
"""
from medlib import OUTPUTS, add_features, load_clean, r, save_results

if __name__ == "__main__":
    df = load_clean()
    feat = add_features(df)
    feat.to_csv(OUTPUTS / "features_dataset.csv", index=False, date_format="%Y-%m-%d")

    cats = {}
    for col in ["age_group", "bmi_category", "exercise_category"]:
        counts = feat[col].value_counts(sort=False, dropna=False)
        cats[col] = {str(k): int(v) for k, v in counts.items()}
        print(f"\n{col}\n{counts.to_string()}")

    missing_flags = {c: int(feat[c].sum()) for c in feat.columns if c.endswith("_missing")}
    print("\nMissingness indicators:", missing_flags)
    print("\nPulse pressure:", feat["pulse_pressure"].describe().round(1).to_dict())

    save_results("08_feature_engineering", {
        "categories": cats,
        "missing_indicators": missing_flags,
        "frequent_visitors": int(feat["frequent_visitor"].sum()),
        "pulse_pressure": {"mean": r(feat["pulse_pressure"].mean(), 1), "median": r(feat["pulse_pressure"].median(), 1)},
        "map": {"mean": r(feat["mean_arterial_pressure"].mean(), 1)},
        "glucose_mean_by_bmi_category": {str(k): r(v, 1) for k, v in
                                         feat.groupby("bmi_category", observed=True)["fasting_glucose"].mean().items()},
        "n_features_before": int(df.shape[1]), "n_features_after": int(feat.shape[1]),
    })
