"""
build_sqlite.py — load the CSV files into a SQLite database and (optionally)
Created by Master of AI.
run every query in sql/ to prove it executes.

    python tools/build_sqlite.py            # creates outputs/medical_training.db
    python tools/build_sqlite.py --check    # also executes sql/*.sql

Tables
  patients_raw      messy file, every column TEXT (as delivered)
  patients          clean file, typed columns
  clinics           small synthetic reference table (for JOIN examples)
  monthly_activity  aggregate monthly operational activity
"""
import sqlite3
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "outputs" / "medical_training.db"

CLINICS = pd.DataFrame({
    "clinic_id": [f"CL0{i}" for i in range(1, 7)],
    "clinic_name": ["North Screening Hub", "Central Clinic", "East Community Centre",
                    "West Wellness Clinic", "South Health Point", "Riverside Clinic"],
    "region": ["North", "Central", "East", "West", "South", "Central"],
    "opened_year": [2012, 2009, 2016, 2018, 2020, 2015],
})


def build():
    DB.parent.mkdir(exist_ok=True)
    DB.unlink(missing_ok=True)
    con = sqlite3.connect(DB)
    pd.read_csv(ROOT / "data/messy_patient_screening_data.csv", dtype=str, keep_default_na=False) \
        .to_sql("patients_raw", con, index=False)
    pd.read_csv(ROOT / "data/clean_patient_screening_data.csv").to_sql("patients", con, index=False)
    pd.read_csv(ROOT / "data/monthly_clinic_activity.csv").to_sql("monthly_activity", con, index=False)
    CLINICS.to_sql("clinics", con, index=False)
    con.commit()
    return con


def check(con):
    for f in sorted((ROOT / "sql").glob("*.sql")):
        script = "\n".join(ln for ln in f.read_text(encoding="utf-8").splitlines()
                           if not ln.strip().startswith("--"))
        statements = [s.strip() for s in script.split(";") if s.strip()]
        for i, stmt in enumerate(statements, 1):
            rows = con.execute(stmt).fetchall()
            first = rows[0] if rows else ()
            print(f"{f.name} #{i:02d}: {len(rows):4d} rows  {str(first)[:90]}")


if __name__ == "__main__":
    connection = build()
    print("created", DB.relative_to(ROOT))
    if "--check" in sys.argv:
        check(connection)
