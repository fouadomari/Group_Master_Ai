"""
build_site_data.py — bundle datasets + script results into js/site-data.js
Created by Master of AI.

The website never invents numbers: everything it displays is either computed
in the browser from the embedded clean dataset (same conventions as pandas)
or read from the JSON files written by python/01 ... 11.

Embedding the data in a .js file (instead of fetch()) lets the site work
from file:// as well as from GitHub Pages.
"""
import json
import sys
from datetime import date
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))
import medlib as m  # noqa: E402

OUT = ROOT / "js" / "site-data.js"


def load_json(name):
    return json.loads((m.OUTPUTS / f"{name}.json").read_text(encoding="utf-8"))


def cleaning_examples(raw: pd.DataFrame):
    """Real raw values from the messy file and what the documented rule returns."""
    ex = []

    def first(col, pattern, case=True):
        s = raw[col][raw[col].str.contains(pattern, regex=True, case=case, na=False)]
        return s.iloc[0] if len(s) else None

    def add(col, raw_value, rule, clean_value):
        if raw_value is not None:
            ex.append({"column": col, "raw": raw_value, "rule": rule, "clean": clean_value})

    v = first("systolic_bp", r"^\d+/\d+$")
    if v:
        s, d = m.parse_bp(v)
        add("systolic_bp", v, "split_bp", f"systolic_bp = {s:.0f} ; diastolic_bp = {d:.0f}")
    v = first("fasting_glucose", "mg/dL")
    add("fasting_glucose", v, "strip_unit", f"fasting_glucose = {m.parse_glucose(v):.0f}")
    v = first("fasting_glucose", "mmol")
    add("fasting_glucose", v, "mmol_convert", f"fasting_glucose = {m.parse_glucose(v):.0f}")
    v = first("hba1c", "%")
    add("hba1c", v, "strip_percent", f"hba1c = {m.extract_number(v)}")
    v = first("bmi", "kg")
    add("bmi", v, "strip_unit", f"bmi = {m.extract_number(v)}")
    v = first("bmi", ",")
    add("bmi", v, "comma_decimal", f"bmi = {m.extract_number(v)}")
    v = first("age", "yrs")
    add("age", v, "strip_unit", f"age = {m.extract_number(v):.0f}")
    add("age", "999" if (raw["age"] == "999").any() else None, "out_of_range", "age = NaN (missing)")
    add("age", "-5" if (raw["age"] == "-5").any() else None, "out_of_range", "age = NaN (missing)")
    for val in ["M", "female", "FEMALE"]:
        if (raw["sex"].str.strip() == val).any():
            add("sex", val, "map_sex", f"sex = {m.map_label(val, m.SEX_MAP)}")
    for val in ["Y", "1", "N", "never"]:
        if (raw["smoking_status"] == val).any():
            add("smoking_status", val, "map_smoking", f"smoking_status = {m.map_label(val, m.SMOKING_MAP)}")
    for val in ["TRUE", "No"]:
        if (raw["family_history_flag"] == val).any():
            add("family_history_flag", val, "map_bool", f"family_history_flag = {m.map_label(val, m.BOOL_MAP)}")
    v = first("clinic_id", "Clinic")
    add("clinic_id", v, "clinic_code", f"clinic_id = {m.parse_clinic(v)}")
    v = first("clinic_id", "^cl", case=True)
    add("clinic_id", v, "clinic_code", f"clinic_id = {m.parse_clinic(v)}")
    v = first("visit_date", r"^\d{2}/\d{2}/\d{4}$")
    add("visit_date", v, "parse_date", f"visit_date = {m.parse_date(v):%Y-%m-%d}")
    add("visit_date", "2024-02-30" if (raw["visit_date"] == "2024-02-30").any() else None,
        "invalid_date", "visit_date = NaT (missing)")
    v = first("risk_group", r"^\s+|\s+$|^[A-Z]+$")
    add("risk_group", repr(v)[1:-1] if v else None, "map_risk", f"risk_group = {m.map_label(v, m.RISK_MAP)}")
    add("risk_group", "Med" if (raw["risk_group"] == "Med").any() else None, "map_risk", "risk_group = Moderate")
    v = first("heart_rate", r"^-")
    add("heart_rate", v, "out_of_range", "heart_rate = NaN (missing)")
    add("risk_score", "105" if (raw["risk_score"] == "105").any() else None, "out_of_range", "risk_score = NaN (missing)")
    add("medication_adherence_pct", "N/A" if (raw["medication_adherence_pct"] == "N/A").any() else "",
        "placeholder", "medication_adherence_pct = NaN (missing)")
    v = first("bmi", "null")
    add("bmi", v, "placeholder", "bmi = NaN (missing)")
    return ex


def dataset_files():
    """CSV files offered for download on the website (path, size, row count)."""
    order = ["messy_patient_screening_data.csv", "clean_patient_screening_data.csv", "outliers_patient_data.csv",
             "monthly_clinic_activity.csv", "data_dictionary.csv"]
    out = []
    for name in order:
        f = m.DATA / name
        if f.exists():
            out.append({"path": f"data/{name}", "name": name, "bytes": f.stat().st_size,
                        "rows": len(pd.read_csv(f, dtype=str)), "cols": len(pd.read_csv(f, nrows=0).columns)})
    return out


def frame_rows(df: pd.DataFrame):
    out = []
    for row in df.itertuples(index=False):
        rec = []
        for v in row:
            if v is None or (not isinstance(v, str) and pd.isna(v)):
                rec.append(None)
            elif isinstance(v, pd.Timestamp):
                rec.append(v.strftime("%Y-%m-%d"))
            elif isinstance(v, float) and v.is_integer():
                rec.append(int(v))
            elif hasattr(v, "item"):
                rec.append(v.item())
            else:
                rec.append(v)
        out.append(rec)
    return out



if __name__ == "__main__":
    raw = m.load_messy()
    clean = pd.read_csv(m.CLEAN_CSV)
    monthly = pd.read_csv(m.MONTHLY_CSV)
    dictionary = pd.read_csv(m.DICTIONARY_CSV)
    log = pd.read_csv(m.OUTPUTS / "cleaning_log.csv")
    outliers = pd.read_csv(m.OUTLIERS_CSV)

    data = {
        "generated": date.today().isoformat(),
        "seed": m.SEED,
        "messy": {"columns": list(raw.columns), "rows": raw.values.tolist()},
        "clean": {"columns": list(clean.columns), "rows": frame_rows(clean)},
        "monthly": {"columns": list(monthly.columns), "rows": monthly.values.tolist()},
        "dictionary": dictionary.fillna("").to_dict(orient="records"),
        "cleaningLog": log.to_dict(orient="records"),
        "cleaningExamples": cleaning_examples(raw),
        "validRanges": m.VALID_RANGES,
        "riskThresholds": m.RISK_THRESHOLDS,
        "datasets": dataset_files(),
        "outliers": {"count": len(outliers),
                     "byVariable": outliers["variable"].value_counts().to_dict(),
                     "extreme": int((outliers["outlier_type"].str.startswith("extreme")).sum())},
        "quality": load_json("01_data_quality"),
        "descriptive": load_json("03_descriptive_statistics"),
        "eda": load_json("04_eda"),
        "correlation": load_json("05_correlation"),
        "hypothesis": load_json("06_hypothesis_testing"),
        "ci": load_json("07_confidence_intervals"),
        "features": load_json("08_feature_engineering"),
        "ml": load_json("09_machine_learning"),
        "evaluation": load_json("10_model_evaluation"),
        "forecast": load_json("11_forecasting"),
    }
    payload = json.dumps(data, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    OUT.write_text("/* Master of AI — generated by tools/build_site_data.py, do not edit by hand. Synthetic educational data only. */\n"
                   f"window.SITE_DATA={payload};\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size / 1024:.0f} KB), "
          f"{len(data['cleaningExamples'])} cleaning examples")
