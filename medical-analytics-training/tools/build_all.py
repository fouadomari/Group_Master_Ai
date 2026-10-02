"""
build_all.py — regenerate EVERYTHING from the fixed random seed.
Created by Master of AI.

    python tools/build_all.py

Order: data -> cleaning -> analysis scripts -> SQLite -> notebooks -> site data.
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STEPS = [
    "python/00_generate_data.py", "python/02_cleaning.py", "python/01_data_quality.py",
    "python/03_descriptive_statistics.py", "python/04_eda.py", "python/05_correlation.py",
    "python/06_hypothesis_testing.py", "python/07_confidence_intervals.py",
    "python/08_feature_engineering.py", "python/09_machine_learning.py",
    "python/10_model_evaluation.py", "python/11_forecasting.py",
    "tools/build_sqlite.py", "tools/build_notebooks.py", "tools/make_logo_png.py",
    "tools/build_site_data.py",
]

if __name__ == "__main__":
    env = {**os.environ, "PYTHONIOENCODING": "utf-8", "MPLBACKEND": "Agg"}
    for step in STEPS:
        print(f"\n>>> {step}", flush=True)
        subprocess.run([sys.executable, str(ROOT / step)], cwd=ROOT / step.split("/")[0], env=env, check=True,
                       stdout=subprocess.DEVNULL if step.startswith("python/") else None)
    print("\nAll artefacts rebuilt.")
