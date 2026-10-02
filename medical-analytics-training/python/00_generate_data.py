"""
00_generate_data.py — reproducibly generate every synthetic dataset.
Created by Master of AI.

    python python/00_generate_data.py

Creates
    data/messy_patient_screening_data.csv   (intentionally dirty raw extract)
    data/monthly_clinic_activity.csv        (aggregate operational activity)
    data/data_dictionary.csv

Then run 02_cleaning.py to create the clean and outlier files.

SYNTHETIC EDUCATIONAL DATA ONLY. No real patients, PHI or PII. The
relationships between variables were invented for teaching and must not be
interpreted as medical knowledge.
"""
import numpy as np
import pandas as pd

from medlib import (COLUMNS, DATA, DICTIONARY_CSV, MESSY_CSV, MONTHLY_CSV, SEED,
                    VALID_RANGES, risk_group_from_score)

N_PATIENTS = 1200
rng = np.random.default_rng(SEED)


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


# ---------------------------------------------------------------------------
# 1. The "true" synthetic population
# ---------------------------------------------------------------------------
def make_population(n: int) -> pd.DataFrame:
    patient_id = [f"PT{100001 + i}" for i in range(n)]
    clinic = rng.choice([f"CL0{i}" for i in range(1, 7)], size=n, p=[.22, .20, .18, .15, .13, .12])
    visit = pd.Timestamp("2023-01-01") + pd.to_timedelta(rng.integers(0, 731, n), unit="D")
    age = np.clip(np.round(rng.normal(52, 15, n)), 18, 90)
    sex = rng.choice(["Male", "Female"], size=n, p=[.48, .52])
    male = sex == "Male"
    smoker = rng.random(n) < np.where(male, 0.27, 0.17)
    exercise = rng.binomial(7, np.clip(0.42 - 0.004 * (age - 50) - 0.08 * smoker, 0.05, 0.95))
    family = (rng.random(n) < 0.30).astype(int)
    bmi = 17.5 + rng.gamma(4.5, 2.1, n) + 0.03 * (age - 50) - 0.45 * (exercise - 3)
    bmi = np.round(np.clip(bmi, 15.5, 60), 1)
    sbp = 118 + 0.45 * (age - 50) + 0.7 * (bmi - 27) + 3 * smoker + 2 * male + rng.normal(0, 12, n)
    dbp = 0.45 * sbp + 22 + rng.normal(0, 7, n)
    dbp = np.minimum(dbp, sbp - 18)
    hr = 72 + 4 * smoker - 1.3 * (exercise - 3) + 0.2 * (bmi - 27) + rng.normal(0, 9, n)
    p_diab = sigmoid(-3.2 + 0.09 * (bmi - 27) + 0.035 * (age - 50) + 0.9 * family)
    tail = (rng.random(n) < p_diab) * rng.gamma(2.2, 22, n)
    glucose = 89 + 1.4 * (bmi - 27) + 0.22 * (age - 50) + 5 * family + 3 * smoker + rng.normal(0, 9, n) + tail
    glucose = np.clip(glucose, 62, 420)
    hba1c = np.round((glucose + 46.7) / 28.7 + 0.5 + rng.normal(0, 0.3, n), 1)
    chol = 190 + 0.5 * (age - 50) + 1.0 * (bmi - 27) + 4 * smoker + rng.normal(0, 32, n)
    adherence = np.round(100 * rng.beta(6, 2, n))
    visits = rng.poisson(np.clip(1.4 + 0.03 * (age - 50) + 1.2 * (glucose > 126) + 0.6 * family, 0.3, None))
    lin = (-0.25 + 0.035 * (age - 50) + 0.07 * (bmi - 27) + 0.03 * (sbp - 120) + 0.025 * (glucose - 95)
           + 0.6 * smoker + 0.45 * family - 0.12 * (exercise - 3) + 0.004 * (chol - 190)
           - 0.01 * (adherence - 75) + rng.normal(0, 0.55, n))
    risk = np.round(100 * sigmoid(lin), 1)
    group = np.array([risk_group_from_score(s) for s in risk])
    follow = np.select([group == "High", group == "Moderate"],
                       [rng.integers(14, 31, n), rng.integers(60, 91, n)], rng.integers(180, 366, n))
    return pd.DataFrame({
        "patient_id": patient_id, "visit_date": visit.strftime("%Y-%m-%d"), "clinic_id": clinic,
        "age": age.astype(int), "sex": sex, "bmi": bmi,
        "systolic_bp": np.round(sbp).astype(int), "diastolic_bp": np.round(dbp).astype(int),
        "heart_rate": np.round(hr).astype(int), "fasting_glucose": np.round(glucose).astype(int),
        "hba1c": hba1c, "total_cholesterol": np.round(chol).astype(int),
        "smoking_status": np.where(smoker, "Smoker", "Non-Smoker"),
        "exercise_days_per_week": exercise, "family_history_flag": family,
        "medication_adherence_pct": adherence.astype(int), "visits_last_year": visits,
        "risk_score": risk, "risk_group": group, "follow_up_days": follow,
    })[COLUMNS]


# ---------------------------------------------------------------------------
# 2. Inject realistic data-quality problems
# ---------------------------------------------------------------------------
def pick(df, frac=None, k=None, mask=None):
    pool = df.index if mask is None else df.index[mask]
    k = k if k is not None else int(round(frac * len(df)))
    return rng.choice(pool, size=min(k, len(pool)), replace=False)


def make_messy(pop: pd.DataFrame) -> pd.DataFrame:
    df = pop.astype(str).copy()
    missing_tokens = ["", "", "", "NA", "N/A", "null", "?"]

    # Plausible but extreme values (real outliers — should be KEPT and reviewed)
    df.loc[pick(df, k=6), "fasting_glucose"] = rng.choice(["365", "380", "402", "344", "390", "371"], 6)
    df.loc[pick(df, k=5), "total_cholesterol"] = rng.choice(["398", "412", "420", "386", "405"], 5)
    df.loc[pick(df, k=4), "bmi"] = rng.choice(["52.3", "55.8", "58.1", "49.6"], 4)
    df.loc[pick(df, k=4), "systolic_bp"] = rng.choice(["204", "212", "198", "221"], 4)

    # Missing values (missingness rates differ by column)
    rates = {"bmi": .04, "systolic_bp": .03, "diastolic_bp": .03, "heart_rate": .03,
             "fasting_glucose": .05, "hba1c": .06, "total_cholesterol": .07,
             "exercise_days_per_week": .05, "family_history_flag": .03,
             "visits_last_year": .02, "risk_score": .02, "clinic_id": .02, "smoking_status": .03}
    for col, rate in rates.items():
        idx = pick(df, frac=rate)
        df.loc[idx, col] = rng.choice(missing_tokens, len(idx))
    # Missing-not-at-random: low adherence is more often unreported
    adh = pop["medication_adherence_pct"].astype(float)
    p_miss = np.where(adh < 60, 0.35, 0.06)
    df.loc[rng.random(len(df)) < p_miss, "medication_adherence_pct"] = ""

    # Sex: inconsistent coding
    sex_variants = {"Male": ["Male", "male", "M", "m", "MALE", " Male"],
                    "Female": ["Female", "female", "F", "f", "FEMALE", "Female "]}
    idx = pick(df, frac=.35)
    df.loc[idx, "sex"] = [rng.choice(sex_variants[v]) for v in df.loc[idx, "sex"]]
    df.loc[pick(df, k=12), "sex"] = rng.choice(["", "Unknown", "U", "?"], 12)

    # Smoking: Yes / Y / 1 / No / N / 0
    smoke_variants = {"Smoker": ["Yes", "Y", "1", "yes", "Smoker"],
                      "Non-Smoker": ["No", "N", "0", "no", "Non-Smoker", "never"]}
    idx = pick(df, frac=.45, mask=df["smoking_status"].isin(["Smoker", "Non-Smoker"]))
    df.loc[idx, "smoking_status"] = [rng.choice(smoke_variants[v]) for v in df.loc[idx, "smoking_status"]]

    # Family history: inconsistent booleans
    bool_variants = {"1": ["Yes", "TRUE", "Y", "true", "1"], "0": ["No", "FALSE", "N", "false", "0"]}
    idx = pick(df, frac=.40, mask=df["family_history_flag"].isin(["0", "1"]))
    df.loc[idx, "family_history_flag"] = [rng.choice(bool_variants[v]) for v in df.loc[idx, "family_history_flag"]]

    # Numbers stored as text with units
    idx = pick(df, frac=.10, mask=df["bmi"].str.fullmatch(r"\d+\.\d"))
    df.loc[idx, "bmi"] = [f"{v} kg/m2" for v in df.loc[idx, "bmi"]]
    idx = pick(df, frac=.03, mask=df["bmi"].str.fullmatch(r"\d+\.\d"))
    df.loc[idx, "bmi"] = [v.replace(".", ",") for v in df.loc[idx, "bmi"]]
    idx = pick(df, frac=.15, mask=df["fasting_glucose"].str.fullmatch(r"\d+"))
    df.loc[idx, "fasting_glucose"] = [f"{v} mg/dL" for v in df.loc[idx, "fasting_glucose"]]
    idx = pick(df, k=14, mask=df["fasting_glucose"].str.fullmatch(r"\d+"))
    df.loc[idx, "fasting_glucose"] = [f"{float(v) / 18.016:.1f} mmol/L" for v in df.loc[idx, "fasting_glucose"]]
    idx = pick(df, frac=.30, mask=df["hba1c"].str.fullmatch(r"\d+\.\d"))
    df.loc[idx, "hba1c"] = [f"{v}%" for v in df.loc[idx, "hba1c"]]
    idx = pick(df, frac=.05, mask=df["medication_adherence_pct"].str.fullmatch(r"\d+"))
    df.loc[idx, "medication_adherence_pct"] = [f"{v}%" for v in df.loc[idx, "medication_adherence_pct"]]
    idx = pick(df, k=9, mask=df["age"].str.fullmatch(r"\d+"))
    df.loc[idx, "age"] = [f"{v} yrs" for v in df.loc[idx, "age"]]

    # Blood pressure stored as '138/88' in the systolic column
    idx = pick(df, frac=.08, mask=df["systolic_bp"].str.fullmatch(r"\d+") & df["diastolic_bp"].str.fullmatch(r"\d+"))
    df.loc[idx, "systolic_bp"] = [f"{s}/{d}" for s, d in zip(df.loc[idx, "systolic_bp"], df.loc[idx, "diastolic_bp"])]
    df.loc[idx[: len(idx) // 2], "diastolic_bp"] = ""

    # Invalid / impossible / negative values
    df.loc[pick(df, k=8), "age"] = rng.choice(["-5", "0", "150", "999", "212", "-1", "7", "abc"], 8)
    df.loc[pick(df, k=5), "bmi"] = rng.choice(["0", "250", "-22.5", "999", "4.1"], 5)
    df.loc[pick(df, k=4), "systolic_bp"] = rng.choice(["400", "0", "-120", "15"], 4)
    df.loc[pick(df, k=6), "heart_rate"] = rng.choice(["-72", "0", "400", "720", "-80", "999"], 6)
    df.loc[pick(df, k=4), "fasting_glucose"] = rng.choice(["0", "-95", "1500", "9999"], 4)
    df.loc[pick(df, k=3), "hba1c"] = rng.choice(["0", "62", "-6.1"], 3)
    df.loc[pick(df, k=3), "total_cholesterol"] = rng.choice(["0", "1900", "-180"], 3)
    df.loc[pick(df, k=6), "exercise_days_per_week"] = rng.choice(["-2", "9", "10", "14", "-1", "8"], 6)
    df.loc[pick(df, k=4), "medication_adherence_pct"] = rng.choice(["120", "-10", "250%", "101"], 4)
    df.loc[pick(df, k=3), "visits_last_year"] = rng.choice(["-1", "-3", "400"], 3)
    df.loc[pick(df, k=7), "risk_score"] = rng.choice(["105", "-3", "150.2", "-0.5", "999", "120", "high"], 7)
    df.loc[pick(df, k=4), "follow_up_days"] = rng.choice(["-30", "-7", "999", "4000"], 4)

    # Dates: other formats + invalid
    idx = pick(df, frac=.08)
    df.loc[idx, "visit_date"] = [pd.Timestamp(v).strftime("%d/%m/%Y") for v in df.loc[idx, "visit_date"]]
    idx = pick(df, frac=.04, mask=df["visit_date"].str.fullmatch(r"\d{4}-\d{2}-\d{2}"))
    df.loc[idx, "visit_date"] = [v.replace("-", "/") for v in df.loc[idx, "visit_date"]]
    df.loc[pick(df, k=9), "visit_date"] = rng.choice(
        ["2024-02-30", "2023-13-05", "31/04/2024", "not recorded", "2031-06-01", "", "2023-00-10", "99/99/9999", "2024-06-31"], 9)

    # Clinic IDs: case, whitespace, alternative spellings
    idx = pick(df, frac=.12, mask=df["clinic_id"].str.fullmatch(r"CL\d{2}"))
    df.loc[idx, "clinic_id"] = [rng.choice([v.lower(), f" {v} ", f"Clinic {int(v[2:])}", f"CL-{int(v[2:])}"])
                                for v in df.loc[idx, "clinic_id"]]

    # Risk group: whitespace / capitalisation / abbreviations / missing
    idx = pick(df, frac=.18)
    variants = {"Low": ["low", " Low", "LOW", "L"], "Moderate": ["moderate", "MODERATE", "Med", " Moderate "],
                "High": ["high", " High ", "HIGH", "H"]}
    df.loc[idx, "risk_group"] = [rng.choice(variants[v]) for v in df.loc[idx, "risk_group"]]
    df.loc[pick(df, frac=.02), "risk_group"] = ""

    # Whitespace noise in IDs
    idx = pick(df, frac=.03)
    df.loc[idx, "patient_id"] = [f" {v}" if rng.random() < .5 else f"{v} " for v in df.loc[idx, "patient_id"]]

    # Duplicates: exact copies + near duplicates (same patient & date, formatting differs)
    exact = df.loc[pick(df, k=24)]
    near = df.loc[pick(df, k=12, mask=df["visit_date"].str.fullmatch(r"\d{4}-\d{2}-\d{2}"))].copy()
    near["sex"] = near["sex"].str.upper()
    near["patient_id"] = near["patient_id"].str.strip() + " "
    df = pd.concat([df, exact, near], ignore_index=True)
    return df.sample(frac=1, random_state=SEED).reset_index(drop=True)


# ---------------------------------------------------------------------------
# 3. Monthly aggregate clinic activity (for forecasting)
# ---------------------------------------------------------------------------
def make_monthly() -> pd.DataFrame:
    months = pd.date_range("2019-01-01", "2024-12-01", freq="MS")
    t = np.arange(len(months))
    m = months.month.values
    season = 70 * np.cos(2 * np.pi * (m - 1) / 12) + 35 * np.isin(m, [9, 10]) - 60 * (m == 8)
    screening = 820 + 5.5 * t + season + rng.normal(0, 22, len(t))
    follow = 0.27 * screening + 8 * np.isin(m, [1, 2]) + rng.normal(0, 9, len(t))
    labs = 0.64 * screening + 0.9 * t + rng.normal(0, 18, len(t))
    return pd.DataFrame({"month": months.strftime("%Y-%m-%d"),
                         "screening_visits": np.round(screening).astype(int),
                         "follow_up_requests": np.round(follow).astype(int),
                         "lab_requests": np.round(labs).astype(int)})


# ---------------------------------------------------------------------------
# 4. Data dictionary
# ---------------------------------------------------------------------------
def make_dictionary() -> pd.DataFrame:
    def rng_txt(c):
        lo, hi = VALID_RANGES[c]
        return f"{lo} - {hi}"

    rows = [
        ("patient_id", "Synthetic patient identifier (not real)", "string", "PT100001 - PT101200", "-", "No",
         "Trim whitespace, upper case", "Uniqueness & duplicate detection"),
        ("visit_date", "Date of the screening visit", "date (YYYY-MM-DD)", "2023-01-01 - 2024-12-31", "-", "Yes",
         "Parse YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY; impossible/future dates -> missing", "Validity & timeliness of dates"),
        ("clinic_id", "Screening clinic code", "category", "CL01 - CL06", "-", "Yes",
         "Upper case, remove spaces, 'Clinic 1'/'CL-1' -> CL01", "Consistency of codes; group comparisons"),
        ("age", "Age at visit", "integer", rng_txt("age"), "years", "Yes",
         "Extract number ('45 yrs'); outside 18-100 -> missing", "Invalid values; age groups"),
        ("sex", "Recorded sex", "category", "Male, Female", "-", "Yes",
         "Male/male/M -> Male; Female/female/F -> Female; Unknown -> missing", "Inconsistent categorical coding"),
        ("bmi", "Body-mass index", "float", rng_txt("bmi"), "kg/m2", "Yes",
         "Remove unit text, comma decimal -> point; outside range -> missing", "Numbers stored as text; skewed distribution"),
        ("systolic_bp", "Systolic blood pressure", "integer", rng_txt("systolic_bp"), "mmHg", "Yes",
         "Split '138/88'; outside range or <= diastolic -> missing", "Combined fields; impossible values"),
        ("diastolic_bp", "Diastolic blood pressure", "integer", rng_txt("diastolic_bp"), "mmHg", "Yes",
         "Filled from '138/88' when blank; outside range -> missing", "Derived from combined field"),
        ("heart_rate", "Resting heart rate", "integer", rng_txt("heart_rate"), "beats/min", "Yes",
         "Negative / impossible values -> missing", "Negative & impossible values"),
        ("fasting_glucose", "Fasting plasma glucose", "integer", rng_txt("fasting_glucose"), "mg/dL", "Yes",
         "Remove 'mg/dL'; mmol/L x 18.016; outside range -> missing", "Units in text; unit conversion; right skew"),
        ("hba1c", "Glycated haemoglobin", "float", rng_txt("hba1c"), "%", "Yes",
         "Remove '%'; outside range -> missing", "Percent stored as text; correlation with glucose"),
        ("total_cholesterol", "Total cholesterol", "integer", rng_txt("total_cholesterol"), "mg/dL", "Yes",
         "Outside range -> missing; plausible extremes kept & flagged", "Outliers vs errors"),
        ("smoking_status", "Smoking status", "category", "Smoker, Non-Smoker", "-", "Yes",
         "Yes/Y/1 -> Smoker; No/N/0/never -> Non-Smoker", "Inconsistent categorical coding; group tests"),
        ("exercise_days_per_week", "Self-reported exercise days", "integer", rng_txt("exercise_days_per_week"), "days", "Yes",
         "Outside 0-7 -> missing", "Logical range checks"),
        ("family_history_flag", "Family history flag (synthetic)", "integer (0/1)", "0, 1", "-", "Yes",
         "Yes/TRUE/Y/1 -> 1; No/FALSE/N/0 -> 0", "Inconsistent booleans"),
        ("medication_adherence_pct", "Self-reported adherence", "integer", rng_txt("medication_adherence_pct"), "%", "Yes",
         "Remove '%'; outside 0-100 -> missing", "Missing-not-at-random example"),
        ("visits_last_year", "Visits in previous 12 months", "integer", rng_txt("visits_last_year"), "count", "Yes",
         "Negative / impossible -> missing", "Count data; feature engineering"),
        ("risk_score", "Synthetic educational risk score (NOT clinical)", "float", rng_txt("risk_score"), "points", "Yes",
         "Outside 0-100 or text -> missing", "Invalid scores; regression target; leakage example"),
        ("risk_group", "Group derived from risk_score (<35 Low, 35-<65 Moderate, >=65 High)", "category",
         "Low, Moderate, High", "-", "Yes", "Normalise labels; derive from score when missing",
         "Classification target (educational only)"),
        ("follow_up_days", "Synthetic follow-up interval assigned AFTER grouping", "integer", rng_txt("follow_up_days"), "days", "Yes",
         "Negative / > 365 -> missing", "Data-leakage example (must not be a model feature)"),
    ]
    return pd.DataFrame(rows, columns=["Column", "Description", "Data Type", "Expected Range", "Unit",
                                       "Missing Allowed", "Cleaning Rule", "Educational Purpose"])


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    population = make_population(N_PATIENTS)
    messy = make_messy(population)
    messy.to_csv(MESSY_CSV, index=False)
    make_monthly().to_csv(MONTHLY_CSV, index=False)
    make_dictionary().to_csv(DICTIONARY_CSV, index=False)
    print(f"messy rows: {len(messy)}  ->  {MESSY_CSV.name}")
    print(f"monthly rows: 72  ->  {MONTHLY_CSV.name}")
    print(f"dictionary  ->  {DICTIONARY_CSV.name}")
    print("Next: python python/02_cleaning.py")
