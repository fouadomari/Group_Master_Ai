# Exercise 1 — Data Quality & Cleaning

*Created by Master of AI.*

> **Realistic training data, prepared for teaching.**

**Lecture 1 sections:** 06 Data Quality · 07 Data Cleaning · 08 Missing Data
**Level:** Beginner · **Time:** ~45 minutes

## Objective

Profile a raw medical screening extract *before* analysing it, quantify its quality problems along the six dimensions (completeness, uniqueness, validity, consistency, accuracy, timeliness), and write small, reproducible cleaning rules.

## Dataset

`data/messy_patient_screening_data.csv` — 1,236 rows × 20 columns, every column delivered as text.
Column definitions and valid ranges: `data/data_dictionary.csv`.

## Tasks

1. Load the file with **every column as text** (`dtype=str, keep_default_na=False`). How many rows and columns are there?
2. Compute the **percentage of missing values per column**, counting placeholder text (`""`, `NA`, `N/A`, `null`, `?`, `Unknown` …) as missing. Which five columns are the least complete?
3. Count **exact duplicate rows**, then count duplicates of `patient_id` + `visit_date` **after** trimming whitespace and lower-casing.
4. List every distinct spelling used in `sex` and in `smoking_status`, before and after trimming whitespace.
5. Count ages that are **outside the valid range 18–100** (extract the number first: `"45 yrs"` → 45).
6. Write three cleaning functions and test them on the examples:
   - `parse_bp("138/88")` → `(138.0, 88.0)`
   - `parse_glucose("110 mg/dL")` → `110.0` and `parse_glucose("6.1 mmol/L")` → `110.0` (mg/dL = mmol/L × 18.016)
   - `map_sex("M")` → `"Male"`, `map_sex("female")` → `"Female"`, `map_sex("Unknown")` → `NaN`
7. Run `python python/02_cleaning.py` and compare its row count and category counts with your own results.

## Hints

- `df.apply(lambda s: s.str.strip().str.lower().isin(tokens))` gives a Boolean "is missing" table.
- `df.duplicated()` finds exact duplicates; `df.duplicated(subset=[...])` finds key duplicates.
- `s.str.extract(r"(-?\d+)")` pulls the first integer out of a string.
- Impossible values should become **missing** — never guess a "corrected" value.

## Expected output

| Check | Expected result |
|---|---|
| Shape | 1,236 rows × 20 columns |
| Least complete columns | `medication_adherence_pct` 9.87 %, `diastolic_bp` 7.04 %, `total_cholesterol` 7.04 %, `hba1c` 5.91 %, `exercise_days_per_week` 5.02 % |
| Exact duplicate rows | 24 |
| `patient_id` + `visit_date` duplicates (normalised) | 36 |
| Distinct raw `sex` values | 18 as delivered (e.g. `" Male"` and `"Female "` with stray spaces); 15 after trimming (`Male`, `male`, `M`, `m`, `MALE`, `Female`, `F`, `f`, `FEMALE`, `female`, `Unknown`, `UNKNOWN`, `U`, `?`, empty) |
| Distinct raw `smoking_status` values | 16 (`Yes`, `Y`, `1`, `yes`, `Smoker`, `No`, `N`, `0`, `no`, `Non-Smoker`, `never`, `NA`, `N/A`, `null`, `?`, empty) |
| Numeric ages outside 18–100 | 7 (plus 1 non-numeric value, `abc`) |
| Clean dataset (from `02_cleaning.py`) | 1,200 rows; sex: Female 616, Male 572, missing 12; smoking: Non-Smoker 907, Smoker 257, missing 36 |

## Solution

```python
import numpy as np
import pandas as pd

raw = pd.read_csv("data/messy_patient_screening_data.csv", dtype=str, keep_default_na=False)
print(raw.shape)                                                     # (1236, 20)

# 2. completeness, counting placeholder text as missing
tokens = {"", "na", "n/a", "nan", "null", "none", "?", "-", "missing", "not recorded", "unknown"}
missing = raw.apply(lambda s: s.str.strip().str.lower().isin(tokens))
missing_pct = (missing.mean() * 100).round(2).sort_values(ascending=False)
print(missing_pct.head(5))

# 3. uniqueness
print("exact duplicates:", raw.duplicated().sum())                   # 24
norm = raw.apply(lambda s: s.str.strip().str.lower())
print("key duplicates:", norm.duplicated(subset=["patient_id", "visit_date"]).sum())   # 36

# 4. consistency
print(len(raw["sex"].unique()), sorted(raw["sex"].unique()))                    # 18 as delivered
print(len(raw["sex"].str.strip().unique()), sorted(raw["sex"].str.strip().unique()))   # 15 after trimming
print(len(raw["smoking_status"].unique()), sorted(raw["smoking_status"].unique()))     # 16

# 5. validity
age = pd.to_numeric(raw["age"].str.extract(r"(-?\d+)")[0], errors="coerce")
print("ages outside 18-100:", ((age < 18) | (age > 100)).sum())     # 7

# 6. cleaning rules
def extract_number(value):
    match = pd.Series([value]).astype(str).str.extract(r"(-?\d+(?:[.,]\d+)?)")[0].iloc[0]
    return np.nan if pd.isna(match) else float(match.replace(",", "."))

def parse_bp(value):
    if "/" in str(value):
        systolic, diastolic = str(value).split("/", 1)
        return extract_number(systolic), extract_number(diastolic)
    return extract_number(value), np.nan

def parse_glucose(value):
    number = extract_number(value)
    return round(number * 18.016) if "mmol" in str(value).lower() else number

def map_sex(value):
    return {"male": "Male", "m": "Male", "female": "Female", "f": "Female"}.get(str(value).strip().lower(), np.nan)

assert parse_bp("138/88") == (138.0, 88.0)
assert parse_glucose("110 mg/dL") == 110.0 and parse_glucose("6.1 mmol/L") == 110
assert map_sex("M") == "Male" and map_sex("female") == "Female" and pd.isna(map_sex("Unknown"))

# 7. compare with the reference pipeline (run python/02_cleaning.py first)
clean = pd.read_csv("data/clean_patient_screening_data.csv")
print(len(clean))                                                    # 1200
print(clean["sex"].value_counts(dropna=False))
print(clean["smoking_status"].value_counts(dropna=False))
```

**Discussion.** Note that `diastolic_bp` looks *less* complete in the raw file than after cleaning: about 4 % of rows store blood pressure as `"138/88"` in the systolic column with the diastolic field left blank. Splitting the combined field recovers those values — a reminder that "missing" in a raw file is not always truly missing.
