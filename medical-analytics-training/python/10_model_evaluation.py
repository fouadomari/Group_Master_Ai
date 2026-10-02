"""
10_model_evaluation.py — evaluate the models trained in 09 on UNSEEN test data.
Created by Master of AI.

    python python/09_machine_learning.py   (first)
    python python/10_model_evaluation.py

Classification metrics : accuracy, precision, recall, F1 (per class + macro), confusion matrix
Regression metrics     : MAE, RMSE, R²   (R² is explained variance — NOT "accuracy")
Robustness             : 5-fold cross-validated accuracy (mean ± sd)

Teaching target — not a clinically validated prediction.
"""
import joblib
import numpy as np
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score, mean_absolute_error,
                             mean_squared_error, precision_recall_fscore_support, r2_score)
from sklearn.model_selection import StratifiedKFold, cross_val_score

from medlib import OUTPUTS, RISK_ORDER, SEED, make_classifiers, r, save_results

MODELS_DIR = OUTPUTS / "models"

if __name__ == "__main__":
    X_train, X_test, y_train, y_test = joblib.load(MODELS_DIR / "split.joblib")
    X_all = np.vstack([X_train, X_test])
    y_all = np.concatenate([y_train, y_test])
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    classification = {}
    for name, fresh in make_classifiers().items():
        model = joblib.load(MODELS_DIR / f"{name.lower().replace(' ', '_')}.joblib")
        pred = model.predict(X_test)
        p, rc, f, s = precision_recall_fscore_support(y_test, pred, labels=RISK_ORDER, zero_division=0)
        cm = confusion_matrix(y_test, pred, labels=RISK_ORDER)
        cv_scores = cross_val_score(fresh, X_all, y_all, cv=cv, scoring="accuracy")
        classification[name] = {
            "accuracy": r(accuracy_score(y_test, pred)),
            "macro_precision": r(p.mean()), "macro_recall": r(rc.mean()),
            "macro_f1": r(f1_score(y_test, pred, average="macro")),
            "per_class": {c: {"precision": r(p[i]), "recall": r(rc[i]), "f1": r(f[i]), "support": int(s[i])}
                          for i, c in enumerate(RISK_ORDER)},
            "confusion_matrix": cm, "labels": RISK_ORDER,
            "cv_accuracy_mean": r(cv_scores.mean()), "cv_accuracy_sd": r(cv_scores.std()),
        }
        print(f"\n=== {name} ===")
        print(f"accuracy {classification[name]['accuracy']:.3f} | macro F1 {classification[name]['macro_f1']:.3f} "
              f"| 5-fold CV {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        print("confusion matrix (rows = actual, cols = predicted):", RISK_ORDER)
        print(cm)

    rX_tr, rX_te, ry_tr, ry_te = joblib.load(MODELS_DIR / "split_regression.joblib")
    baseline = np.full(len(ry_te), ry_tr.mean())
    regression = {"Baseline (predict training mean)": {
        "mae": r(mean_absolute_error(ry_te, baseline)),
        "rmse": r(np.sqrt(mean_squared_error(ry_te, baseline))),
        "r2": r(r2_score(ry_te, baseline))}}
    sample = {}
    for name in ["Linear Regression", "Random Forest Regressor"]:
        model = joblib.load(MODELS_DIR / f"{name.lower().replace(' ', '_')}.joblib")
        pred = model.predict(rX_te)
        regression[name] = {"mae": r(mean_absolute_error(ry_te, pred)),
                            "rmse": r(np.sqrt(mean_squared_error(ry_te, pred))),
                            "r2": r(r2_score(ry_te, pred))}
        sample[name] = {"actual": np.round(ry_te.values[:150], 1), "predicted": np.round(pred[:150], 1)}
    print("\nRegression on the teaching risk_score:")
    for k, v in regression.items():
        print(f"  {k:<34} MAE {v['mae']:.2f}  RMSE {v['rmse']:.2f}  R² {v['r2']:.3f}")

    save_results("10_model_evaluation", {"classification": classification, "regression": regression,
                                         "regression_sample": sample})
