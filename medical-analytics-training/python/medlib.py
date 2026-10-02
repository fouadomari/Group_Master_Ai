"""
medlib.py — shared helpers for the Lecture 1 training scripts.
Created by Master of AI.

Realistic training data. Nothing in this package is intended for
diagnosis, treatment, triage, medication decisions or clinical decision-making.

Every learner script (01_ ... 11_) imports from this module so that the
cleaning rules, valid ranges and file paths are defined in ONE place.
"""
from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUTPUTS = ROOT / "outputs"
OUTPUTS.mkdir(exist_ok=True)

MESSY_CSV = DATA / "messy_patient_screening_data.csv"
CLEAN_CSV = DATA / "clean_patient_screening_data.csv"
OUTLIERS_CSV = DATA / "outliers_patient_data.csv"
DICTIONARY_CSV = DATA / "data_dictionary.csv"
MONTHLY_CSV = DATA / "monthly_clinic_activity.csv"

SEED = 42
EXTRACT_DATE = pd.Timestamp("2024-12-31")  # data extraction date (no visits after this)

COLUMNS = [
    "patient_id", "visit_date", "clinic_id", "age", "sex", "bmi",
    "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose", "hba1c",
    "total_cholesterol", "smoking_status", "exercise_days_per_week",
    "family_history_flag", "medication_adherence_pct", "visits_last_year",
    "risk_score", "risk_group", "follow_up_days",
]

NUMERIC_COLUMNS = [
    "age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate",
    "fasting_glucose", "hba1c", "total_cholesterol", "exercise_days_per_week",
    "medication_adherence_pct", "visits_last_year", "risk_score", "follow_up_days",
]

# Valid (plausible) ranges used by the validation step. Values outside these
# ranges are treated as data-entry errors and set to missing (NaN).
VALID_RANGES = {
    "age": (18, 100),                 # adult screening programme
    "bmi": (12, 70),
    "systolic_bp": (70, 250),
    "diastolic_bp": (40, 150),
    "heart_rate": (30, 220),
    "fasting_glucose": (40, 600),
    "hba1c": (3, 20),
    "total_cholesterol": (80, 500),
    "exercise_days_per_week": (0, 7),
    "medication_adherence_pct": (0, 100),
    "visits_last_year": (0, 60),
    "risk_score": (0, 100),
    "follow_up_days": (0, 365),
}

MISSING_TOKENS = {"", "na", "n/a", "nan", "null", "none", "?", "-", "missing", "not recorded", "unknown"}

RISK_THRESHOLDS = (35, 65)  # Low < 35 <= Moderate < 65 <= High (teaching rule)
RISK_ORDER = ["Low", "Moderate", "High"]


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------
def load_messy() -> pd.DataFrame:
    """Load the raw file with every column as text (exactly as delivered)."""
    return pd.read_csv(MESSY_CSV, dtype=str, keep_default_na=False)


def load_clean() -> pd.DataFrame:
    df = pd.read_csv(CLEAN_CSV, parse_dates=["visit_date"])
    df["risk_group"] = pd.Categorical(df["risk_group"], categories=RISK_ORDER, ordered=True)
    return df


def load_monthly() -> pd.DataFrame:
    return pd.read_csv(MONTHLY_CSV, parse_dates=["month"])


# --------------------------------------------------------------------------
# Value-level cleaning rules (each one is small, testable and documented)
# --------------------------------------------------------------------------
_NUM_RE = re.compile(r"-?\d+(?:[.,]\d+)?")


def is_missing_token(value) -> bool:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return True
    return str(value).strip().lower() in MISSING_TOKENS


def extract_number(value) -> float:
    """'110 mg/dL' -> 110.0 ; '27,4' -> 27.4 ; '6.2%' -> 6.2 ; 'abc' -> NaN"""
    if is_missing_token(value):
        return np.nan
    match = _NUM_RE.search(str(value))
    if not match:
        return np.nan
    return float(match.group().replace(",", "."))


def parse_glucose(value) -> float:
    """Glucose in mg/dL. Values recorded in mmol/L are converted (x 18.016)."""
    num = extract_number(value)
    if np.isnan(num):
        return num
    if "mmol" in str(value).lower():
        return round(num * 18.016, 0)
    return num


def parse_bp(value):
    """'138/88' -> (138.0, 88.0) ; '138' -> (138.0, NaN)"""
    if is_missing_token(value):
        return np.nan, np.nan
    text = str(value)
    if "/" in text:
        left, right = text.split("/", 1)
        return extract_number(left), extract_number(right)
    return extract_number(text), np.nan


SEX_MAP = {"male": "Male", "m": "Male", "female": "Female", "f": "Female"}
SMOKING_MAP = {
    "yes": "Smoker", "y": "Smoker", "1": "Smoker", "smoker": "Smoker", "current": "Smoker",
    "no": "Non-Smoker", "n": "Non-Smoker", "0": "Non-Smoker", "non-smoker": "Non-Smoker",
    "nonsmoker": "Non-Smoker", "never": "Non-Smoker",
}
BOOL_MAP = {"yes": 1, "y": 1, "true": 1, "1": 1, "no": 0, "n": 0, "false": 0, "0": 0}
RISK_MAP = {
    "low": "Low", "l": "Low",
    "moderate": "Moderate", "mod": "Moderate", "med": "Moderate", "medium": "Moderate",
    "high": "High", "h": "High",
}


def map_label(value, mapping):
    if is_missing_token(value):
        return np.nan
    return mapping.get(str(value).strip().lower(), np.nan)


def parse_clinic(value):
    """' cl01 ' / 'Clinic 1' / 'CL-1' -> 'CL01'"""
    if is_missing_token(value):
        return np.nan
    digits = re.findall(r"\d+", str(value))
    if not digits:
        return np.nan
    return f"CL{int(digits[0]):02d}"


def parse_date(value):
    """Accepts YYYY-MM-DD, YYYY/MM/DD and DD/MM/YYYY (source-system convention).
    Impossible dates (2024-02-30) and dates after the extraction date -> NaT."""
    if is_missing_token(value):
        return pd.NaT
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            ts = pd.to_datetime(text, format=fmt)
        except (ValueError, TypeError):
            continue
        if ts > EXTRACT_DATE or ts < pd.Timestamp("2015-01-01"):
            return pd.NaT
        return ts
    return pd.NaT


def risk_group_from_score(score):
    if pd.isna(score):
        return np.nan
    low, high = RISK_THRESHOLDS
    return "Low" if score < low else ("Moderate" if score < high else "High")


def apply_range(series: pd.Series, column: str) -> pd.Series:
    low, high = VALID_RANGES[column]
    return series.where(series.between(low, high))


# --------------------------------------------------------------------------
# Dataset-level cleaning
# --------------------------------------------------------------------------
def clean_dataset(raw: pd.DataFrame):
    """Return (clean_df, cleaning_log_df). `raw` must be all-text (load_messy)."""
    log = []

    def record(step, column, rule, affected):
        log.append({"step": step, "column": column, "rule": rule, "rows_affected": int(affected)})

    df = raw.copy()
    record(0, "*", "Rows received", len(df))

    # 1. Whitespace + placeholder missing tokens
    for col in df.columns:
        stripped = df[col].astype(str).str.strip()
        changed = (stripped != df[col].astype(str)).sum()
        tokens = stripped.str.lower().isin(MISSING_TOKENS) & (stripped != "")
        df[col] = stripped.mask(stripped.str.lower().isin(MISSING_TOKENS), np.nan)
        if changed:
            record(1, col, "Trim leading/trailing whitespace", changed)
        if tokens.sum():
            record(1, col, "Placeholder text (NA, null, ?, Unknown...) -> missing", tokens.sum())

    out = pd.DataFrame(index=df.index)
    out["patient_id"] = df["patient_id"].str.upper()

    # 2. Dates
    out["visit_date"] = df["visit_date"].map(parse_date)
    record(2, "visit_date", "Parse YYYY-MM-DD / YYYY/MM/DD / DD/MM/YYYY; impossible or future dates -> missing",
           (out["visit_date"].isna() & df["visit_date"].notna()).sum())

    # 3. Clinic IDs
    out["clinic_id"] = df["clinic_id"].map(parse_clinic)
    record(3, "clinic_id", "Standardise to CLnn (upper case, no spaces)",
           (out["clinic_id"].astype(str) != df["clinic_id"].astype(str)).sum())

    # 4. Categorical labels
    out["sex"] = df["sex"].map(lambda v: map_label(v, SEX_MAP))
    record(4, "sex", "Male/male/M -> Male ; Female/female/F -> Female",
           (out["sex"].astype(str) != df["sex"].astype(str)).sum())
    out["smoking_status"] = df["smoking_status"].map(lambda v: map_label(v, SMOKING_MAP))
    record(4, "smoking_status", "Yes/Y/1 -> Smoker ; No/N/0 -> Non-Smoker",
           (out["smoking_status"].astype(str) != df["smoking_status"].astype(str)).sum())
    out["family_history_flag"] = df["family_history_flag"].map(lambda v: map_label(v, BOOL_MAP))
    record(4, "family_history_flag", "Yes/TRUE/Y/1 -> 1 ; No/FALSE/N/0 -> 0",
           (df["family_history_flag"].notna() & ~df["family_history_flag"].isin(["0", "1"])).sum())
    out["family_history_flag"] = out["family_history_flag"].astype("Int64")

    # 5. Blood pressure stored as '138/88'
    bp = df["systolic_bp"].map(parse_bp)
    sys_vals = bp.map(lambda t: t[0])
    dia_from_combined = bp.map(lambda t: t[1])
    combined = df["systolic_bp"].astype(str).str.contains("/", na=False)
    out["systolic_bp"] = sys_vals
    out["diastolic_bp"] = df["diastolic_bp"].map(extract_number)
    out.loc[combined, "diastolic_bp"] = out.loc[combined, "diastolic_bp"].fillna(dia_from_combined[combined])
    record(5, "systolic_bp", "Split '138/88' into systolic_bp=138 and diastolic_bp=88", combined.sum())

    # 6. Numbers stored as text with units
    for col in ["age", "bmi", "heart_rate", "total_cholesterol", "exercise_days_per_week",
                "medication_adherence_pct", "visits_last_year", "risk_score", "follow_up_days"]:
        out[col] = df[col].map(extract_number)
        has_text = df[col].notna() & ~df[col].astype(str).str.fullmatch(r"-?\d+(\.\d+)?")
        if has_text.sum():
            record(6, col, "Extract number from text (units, %, commas)", has_text.sum())
    out["fasting_glucose"] = df["fasting_glucose"].map(parse_glucose)
    record(6, "fasting_glucose", "Remove 'mg/dL'; convert mmol/L x 18.016",
           df["fasting_glucose"].astype(str).str.contains("mg|mmol", case=False, na=False).sum())
    out["hba1c"] = df["hba1c"].map(extract_number)
    record(6, "hba1c", "Remove '%' sign", df["hba1c"].astype(str).str.contains("%", na=False).sum())

    # 7. Validity ranges -> NaN (never silently 'fixed')
    for col in NUMERIC_COLUMNS:
        before = out[col].notna().sum()
        out[col] = apply_range(out[col], col)
        dropped = before - out[col].notna().sum()
        if dropped:
            low, high = VALID_RANGES[col]
            record(7, col, f"Out of valid range [{low}, {high}] (negative / impossible) -> missing", dropped)
    bad_bp = out["diastolic_bp"] >= out["systolic_bp"]
    out.loc[bad_bp, ["systolic_bp", "diastolic_bp"]] = np.nan
    if bad_bp.sum():
        record(7, "diastolic_bp", "Diastolic >= systolic (physiologically inconsistent) -> both missing", bad_bp.sum())

    # 8. Integer columns
    for col in ["age", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose",
                "total_cholesterol", "exercise_days_per_week", "visits_last_year", "follow_up_days"]:
        out[col] = out[col].round().astype("Int64")

    # 9. Risk group labels
    out["risk_group"] = df["risk_group"].map(lambda v: map_label(v, RISK_MAP))
    record(9, "risk_group", "Normalise labels (high/ HIGH /H -> High, Med -> Moderate ...)",
           (out["risk_group"].astype(str) != df["risk_group"].astype(str)).sum())
    derive = out["risk_group"].isna() & out["risk_score"].notna()
    out.loc[derive, "risk_group"] = out.loc[derive, "risk_score"].map(risk_group_from_score)
    record(9, "risk_group", "Missing label derived from valid risk_score using documented thresholds", derive.sum())

    # 10. Duplicates
    n = len(out)
    out = out.drop_duplicates()
    record(10, "*", "Remove exact duplicate rows (after standardisation)", n - len(out))
    n = len(out)
    out = out.drop_duplicates(subset=["patient_id", "visit_date"], keep="first")
    record(10, "*", "Remove repeated patient_id + visit_date (keep first)", n - len(out))

    out = out[COLUMNS].sort_values(["visit_date", "patient_id"], na_position="last").reset_index(drop=True)
    record(11, "*", "Rows in clean analysis dataset", len(out))
    return out, pd.DataFrame(log)


# --------------------------------------------------------------------------
# Data-quality profiling of the RAW file
# --------------------------------------------------------------------------
def quality_report(raw: pd.DataFrame) -> pd.DataFrame:
    rows = []
    n = len(raw)
    for col in raw.columns:
        s = raw[col].astype(str)
        stripped = s.str.strip()
        missing = stripped.str.lower().isin(MISSING_TOKENS)
        present = stripped[~missing]
        whitespace = (s != stripped).sum()
        type_issue = 0
        invalid = 0
        outliers = 0
        if col in NUMERIC_COLUMNS or col in ("systolic_bp", "diastolic_bp"):
            type_issue = int((~present.str.fullmatch(r"-?\d+(\.\d+)?")).sum())
            if col == "systolic_bp":
                nums = present.map(lambda v: parse_bp(v)[0])
            elif col == "fasting_glucose":
                nums = present.map(parse_glucose)
            else:
                nums = present.map(extract_number)
            low, high = VALID_RANGES[col]
            invalid = int((nums.notna() & ~nums.between(low, high)).sum() + nums.isna().sum())
            valid = nums[nums.between(low, high)]
            if len(valid) > 4:
                q1, q3 = valid.quantile([0.25, 0.75])
                iqr = q3 - q1
                outliers = int(((valid < q1 - 1.5 * iqr) | (valid > q3 + 1.5 * iqr)).sum())
        elif col == "visit_date":
            parsed = present.map(parse_date)
            invalid = int(parsed.isna().sum())
            type_issue = int((~present.str.fullmatch(r"\d{4}-\d{2}-\d{2}")).sum())
        elif col in ("sex", "smoking_status", "family_history_flag", "risk_group", "clinic_id"):
            mapping = {"sex": SEX_MAP, "smoking_status": SMOKING_MAP,
                       "family_history_flag": BOOL_MAP, "risk_group": RISK_MAP}.get(col)
            if mapping:
                invalid = int(present.map(lambda v: map_label(v, mapping)).isna().sum())
            else:
                invalid = int(present.map(parse_clinic).isna().sum())
            canonical = {"sex": {"Male", "Female"}, "smoking_status": {"Smoker", "Non-Smoker"},
                         "family_history_flag": {"0", "1"}, "risk_group": set(RISK_ORDER)}.get(col)
            if canonical:
                type_issue = int((~present.isin(canonical)).sum())
            else:
                type_issue = int((~present.str.fullmatch(r"CL\d{2}")).sum())
        rows.append({
            "column": col,
            "missing_count": int(missing.sum()),
            "missing_pct": round(100 * missing.sum() / n, 2),
            "distinct_raw_values": int(present.nunique()),
            "format_issues": int(type_issue),
            "invalid_values": int(invalid),
            "iqr_outliers": int(outliers),
            "whitespace_issues": int(whitespace),
        })
    return pd.DataFrame(rows)


def duplicate_summary(raw: pd.DataFrame) -> dict:
    exact = int(raw.duplicated().sum())
    norm = raw.apply(lambda s: s.astype(str).str.strip().str.lower())
    key = int(norm.duplicated(subset=["patient_id", "visit_date"]).sum())
    return {"rows": len(raw), "exact_duplicates": exact, "key_duplicates": key,
            "exact_duplicate_pct": round(100 * exact / len(raw), 2),
            "key_duplicate_pct": round(100 * key / len(raw), 2)}


# --------------------------------------------------------------------------
# Feature engineering (educational, NOT clinically validated)
# --------------------------------------------------------------------------
def add_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["age_group"] = pd.cut(out["age"].astype(float), [17, 34, 49, 64, 120],
                              labels=["18-34", "35-49", "50-64", "65+"])
    out["bmi_category"] = pd.cut(out["bmi"], [0, 18.5, 25, 30, 200],
                                 labels=["Underweight", "Normal", "Overweight", "Obese"], right=False)
    out["pulse_pressure"] = out["systolic_bp"] - out["diastolic_bp"]
    out["mean_arterial_pressure"] = (out["systolic_bp"] + 2 * out["diastolic_bp"]) / 3
    out["exercise_category"] = pd.cut(out["exercise_days_per_week"].astype(float), [-1, 0, 2, 4, 7],
                                      labels=["None", "Low (1-2)", "Moderate (3-4)", "High (5-7)"])
    out["frequent_visitor"] = (out["visits_last_year"] >= 4).astype("Int64")
    for col in ["bmi", "fasting_glucose", "hba1c", "medication_adherence_pct"]:
        out[f"{col}_missing"] = out[col].isna().astype(int)
    out["is_smoker"] = (out["smoking_status"] == "Smoker").astype(int)
    out["is_male"] = (out["sex"] == "Male").astype(int)
    return out


def model_frame(df: pd.DataFrame):
    """X (features) and y (risk_group) for the educational classifier.
    Rows without a target are removed; missing FEATURE values are imputed
    inside the model pipeline (fitted on training data only)."""
    feat = add_features(df)
    feat = feat[feat["risk_group"].notna()]
    X = feat[MODEL_FEATURES].astype(float)
    y = feat["risk_group"].astype(str)
    return X, y, feat


def make_classifiers():
    from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler

    return {
        "Logistic Regression": make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                                             LogisticRegression(max_iter=2000)),
        "Random Forest": make_pipeline(SimpleImputer(strategy="median"),
                                       RandomForestClassifier(n_estimators=300, min_samples_leaf=3,
                                                              random_state=SEED, n_jobs=-1)),
        "Gradient Boosting": make_pipeline(SimpleImputer(strategy="median"),
                                           GradientBoostingClassifier(random_state=SEED)),
    }


def save_results(name: str, obj) -> Path:
    """Write a JSON results file to outputs/ (numpy/pandas safe). The website
    reads these files, so every number shown in the lecture comes from a script."""
    import json

    def default(o):
        if isinstance(o, (np.integer,)):
            return int(o)
        if isinstance(o, (np.floating,)):
            return None if np.isnan(o) else float(o)
        if isinstance(o, (np.ndarray, pd.Index)):
            return o.tolist()
        if isinstance(o, (pd.Timestamp,)):
            return o.strftime("%Y-%m-%d")
        if o is pd.NA or o is pd.NaT:
            return None
        raise TypeError(type(o))

    path = OUTPUTS / f"{name}.json"
    path.write_text(json.dumps(obj, default=default, indent=1, allow_nan=False), encoding="utf-8")
    return path


def r(x, digits=3):
    """Round for reporting; NaN -> None."""
    if x is None or pd.isna(x):
        return None
    return round(float(x), digits)


MODEL_FEATURES = [
    "age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose",
    "hba1c", "total_cholesterol", "exercise_days_per_week", "family_history_flag",
    "medication_adherence_pct", "visits_last_year", "is_smoker", "is_male",
]
# risk_score and follow_up_days are deliberately EXCLUDED: risk_group is derived
# from risk_score and follow_up_days is assigned after the group (data leakage).
LEAKAGE_COLUMNS = ["risk_score", "follow_up_days"]
