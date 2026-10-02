# Exercise 4 — Machine Learning & Model Evaluation

*Created by Master of AI.*

> **Synthetic educational data only.** This training is not intended for diagnosis, treatment, triage, medication decisions, or clinical decision-making.
>
> **Educational synthetic target — not a clinically validated prediction.**

**Lecture 1 sections:** 16 Feature Engineering · 17 Machine Learning · 18 Model Evaluation
**Level:** Intermediate · **Time:** ~60 minutes

## Objective

Build a leakage-free modelling dataset, train and compare classifiers on a stratified train/test split, evaluate them with appropriate metrics, and demonstrate why data leakage produces misleading results.

## Dataset

`data/clean_patient_screening_data.csv` — target: `risk_group` (Low / Moderate / High), a **synthetic, rule-generated** label.

## Tasks

1. Engineer `is_smoker` and `is_male` (0/1). Use these 14 features:
   `age, bmi, systolic_bp, diastolic_bp, heart_rate, fasting_glucose, hba1c, total_cholesterol, exercise_days_per_week, family_history_flag, medication_adherence_pct, visits_last_year, is_smoker, is_male`.
   Explain why `risk_score` and `follow_up_days` must **not** be features.
2. Split 75 % / 25 %, stratified by the target, `random_state=42`.
3. Build pipelines that **impute missing values inside the pipeline** (median) and train:
   Logistic Regression (with `StandardScaler`, `max_iter=2000`), Random Forest (`n_estimators=300, min_samples_leaf=3, random_state=42`) and Gradient Boosting (`random_state=42`).
4. Report training and test accuracy for each model. Which one overfits most?
5. For Gradient Boosting, print the confusion matrix (labels in the order Low, Moderate, High) and the classification report. Which class is hardest?
6. **Leakage demo:** add `risk_score` to the features and retrain the Random Forest. What happens to test accuracy, and why is that result useless?
7. *Bonus:* fit a Linear Regression for the numeric `risk_score` (rows where it is not missing, same features, 75/25 split, `random_state=42`) and report MAE, RMSE and R². Why is R² not "accuracy"?

## Hints

- `make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(max_iter=2000))`
- Fitting the imputer on the full dataset before splitting would leak test-set information.
- `confusion_matrix(y_test, pred, labels=["Low", "Moderate", "High"])`
- Exact scores can differ by a few thousandths between scikit-learn versions.

## Expected output (scikit-learn 1.6)

| Model | Train accuracy | Test accuracy |
|---|---|---|
| Logistic Regression | 0.750 | 0.737 |
| Random Forest | 0.980 | 0.747 |
| Gradient Boosting | 0.954 | **0.760** |

Gradient Boosting confusion matrix (rows = actual, columns = predicted; Low, Moderate, High):

```
[[79 14  1]
 [20 60 17]
 [ 1 19 89]]
```

Macro F1 = 0.757. Leakage demo: Random Forest test accuracy jumps from **0.747 → 0.990**.
Bonus: Linear Regression on `risk_score` — MAE ≈ 9.52, RMSE ≈ 11.55, R² ≈ 0.827 (baseline "predict the mean": MAE 24.3, R² ≈ 0).

## Solution

```python
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix, mean_absolute_error,
                             mean_squared_error, r2_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("data/clean_patient_screening_data.csv")
df = df[df["risk_group"].notna()].copy()
df["is_smoker"] = (df["smoking_status"] == "Smoker").astype(int)
df["is_male"] = (df["sex"] == "Male").astype(int)
features = ["age", "bmi", "systolic_bp", "diastolic_bp", "heart_rate", "fasting_glucose", "hba1c",
            "total_cholesterol", "exercise_days_per_week", "family_history_flag",
            "medication_adherence_pct", "visits_last_year", "is_smoker", "is_male"]
X, y = df[features].astype(float), df["risk_group"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)

models = {
    "Logistic Regression": make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(max_iter=2000)),
    "Random Forest": make_pipeline(SimpleImputer(strategy="median"),
                                   RandomForestClassifier(n_estimators=300, min_samples_leaf=3, random_state=42, n_jobs=-1)),
    "Gradient Boosting": make_pipeline(SimpleImputer(strategy="median"), GradientBoostingClassifier(random_state=42)),
}
for name, model in models.items():
    model.fit(X_train, y_train)
    print(f"{name:<20} train {model.score(X_train, y_train):.3f}  test {model.score(X_test, y_test):.3f}")

labels = ["Low", "Moderate", "High"]
pred = models["Gradient Boosting"].predict(X_test)
print(confusion_matrix(y_test, pred, labels=labels))
print(classification_report(y_test, pred, labels=labels, digits=3))

# 6. leakage demonstration — DO NOT do this in practice
Xl = df[features + ["risk_score"]].astype(float)
a, b, c, d = train_test_split(Xl, y, test_size=0.25, stratify=y, random_state=42)
leaky = make_pipeline(SimpleImputer(strategy="median"), RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1))
print("test accuracy WITH leakage:", round(leaky.fit(a, c).score(b, d), 3))

# 7. bonus: regression on the numeric synthetic score
reg = df[df["risk_score"].notna()]
rX_tr, rX_te, ry_tr, ry_te = train_test_split(reg[features].astype(float), reg["risk_score"], test_size=0.25, random_state=42)
lin = make_pipeline(SimpleImputer(strategy="median"), LinearRegression()).fit(rX_tr, ry_tr)
p = lin.predict(rX_te)
print("MAE", round(mean_absolute_error(ry_te, p), 2), "RMSE", round(np.sqrt(mean_squared_error(ry_te, p)), 2),
      "R2", round(r2_score(ry_te, p), 3))
```

**Answers**

- **(1)** `risk_group` is computed directly from `risk_score` (Low < 35 ≤ Moderate < 65 ≤ High), and `follow_up_days` is assigned *after* the group is known. Both encode the answer and would not be available at prediction time.
- **(4)** Random Forest: 0.980 on training data vs 0.747 on test data — the largest gap, i.e. the most overfitting. Test accuracy is the honest estimate.
- **(5)** *Moderate* — the middle class is confused with both neighbours; Low and High are almost never confused with each other.
- **(6)** Accuracy ≈ 0.99 because the model just learns the thresholds on `risk_score`. It looks excellent but has learned nothing usable — a classic "too good to be true" signal.
- **(7)** R² is the share of variance in the target explained relative to always predicting the mean. It says nothing about the share of "correct" predictions; always report MAE/RMSE in the target's units too.
