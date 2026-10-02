"""
09_machine_learning.py — train educational models on the synthetic target.
Created by Master of AI.

    python python/09_machine_learning.py

EDUCATIONAL SYNTHETIC TARGET — NOT A CLINICALLY VALIDATED PREDICTION.

  Features : MODEL_FEATURES in medlib (measurements, lifestyle, utilisation)
  Target   : risk_group (Low / Moderate / High) — synthetic, rule-generated
  Split    : 75% training / 25% testing, stratified, fixed random_state
  Models   : Logistic Regression, Random Forest, Gradient Boosting
             (+ Linear Regression for the numeric risk_score)

Also demonstrates
  * under/over-fitting with a decision-tree depth curve
  * data leakage: adding risk_score (from which the label is computed) makes
    test accuracy look almost perfect — a result that would never generalise.

Outputs: outputs/models/*.joblib, outputs/09_machine_learning.json
"""
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.tree import DecisionTreeClassifier

from medlib import (MODEL_FEATURES, OUTPUTS, SEED, load_clean, make_classifiers,
                    model_frame, r, save_results)

MODELS_DIR = OUTPUTS / "models"
MODELS_DIR.mkdir(exist_ok=True)

if __name__ == "__main__":
    df = load_clean()
    X, y, feat = model_frame(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=SEED)
    joblib.dump((X_train, X_test, y_train, y_test), MODELS_DIR / "split.joblib")
    print(f"Training rows: {len(X_train)}  Testing rows: {len(X_test)}  Features: {X.shape[1]}")

    trained = {}
    for name, model in make_classifiers().items():
        model.fit(X_train, y_train)
        trained[name] = {"train_accuracy": r(model.score(X_train, y_train)),
                         "test_accuracy": r(model.score(X_test, y_test))}
        joblib.dump(model, MODELS_DIR / f"{name.lower().replace(' ', '_')}.joblib")
        print(f"{name:<20} train acc {trained[name]['train_accuracy']:.3f}   test acc {trained[name]['test_accuracy']:.3f}")

    # Under- vs over-fitting: decision tree depth
    depth_curve = []
    for depth in range(1, 16):
        tree = make_pipeline(SimpleImputer(strategy="median"),
                             DecisionTreeClassifier(max_depth=depth, random_state=SEED))
        tree.fit(X_train, y_train)
        depth_curve.append({"depth": depth, "train": r(tree.score(X_train, y_train)),
                            "test": r(tree.score(X_test, y_test))})
    best = max(depth_curve, key=lambda d: d["test"])
    print(f"\nDecision tree: best test accuracy {best['test']:.3f} at depth {best['depth']}; "
          f"depth 15 train {depth_curve[-1]['train']:.3f} vs test {depth_curve[-1]['test']:.3f}")

    # Data leakage demonstration (DO NOT do this in practice)
    leak_features = MODEL_FEATURES + ["risk_score"]
    leak_X = feat[leak_features].astype(float)
    lx_tr, lx_te, ly_tr, ly_te = train_test_split(leak_X, y, test_size=0.25, stratify=y, random_state=SEED)
    leak_model = make_pipeline(SimpleImputer(strategy="median"),
                               RandomForestClassifier(n_estimators=300, random_state=SEED, n_jobs=-1))
    leak_model.fit(lx_tr, ly_tr)
    leak = {"test_accuracy_with_leakage": r(leak_model.score(lx_te, ly_te)),
            "test_accuracy_without": trained["Random Forest"]["test_accuracy"]}
    print(f"Leakage demo: accuracy with risk_score = {leak['test_accuracy_with_leakage']:.3f} "
          f"(without = {leak['test_accuracy_without']:.3f}) -> too good to be true")

    # Feature importance (impurity based, Random Forest)
    rf = joblib.load(MODELS_DIR / "random_forest.joblib")
    importances = rf[-1].feature_importances_
    importance = sorted(({"feature": f, "importance": r(v, 4)} for f, v in zip(MODEL_FEATURES, importances)),
                        key=lambda d: -d["importance"])

    # Regression on the numeric synthetic score
    reg_df = feat[feat["risk_score"].notna()]
    rX, ry = reg_df[MODEL_FEATURES].astype(float), reg_df["risk_score"].astype(float)
    rX_tr, rX_te, ry_tr, ry_te = train_test_split(rX, ry, test_size=0.25, random_state=SEED)
    regressors = {
        "Linear Regression": make_pipeline(SimpleImputer(strategy="median"), LinearRegression()),
        "Random Forest Regressor": make_pipeline(SimpleImputer(strategy="median"),
                                                 RandomForestRegressor(n_estimators=300, min_samples_leaf=3,
                                                                       random_state=SEED, n_jobs=-1)),
    }
    for name, model in regressors.items():
        model.fit(rX_tr, ry_tr)
        joblib.dump(model, MODELS_DIR / f"{name.lower().replace(' ', '_')}.joblib")
    joblib.dump((rX_tr, rX_te, ry_tr, ry_te), MODELS_DIR / "split_regression.joblib")

    lin = regressors["Linear Regression"][-1]
    coefficients = sorted(({"feature": f, "coef": r(c, 4)} for f, c in zip(MODEL_FEATURES, lin.coef_)),
                          key=lambda d: -abs(d["coef"]))

    save_results("09_machine_learning", {
        "n_train": len(X_train), "n_test": len(X_test), "features": MODEL_FEATURES,
        "class_balance": y.value_counts().to_dict(),
        "classifiers": trained, "depth_curve": depth_curve, "leakage": leak,
        "rf_importance": importance, "linear_coefficients": coefficients,
        "regression_n_train": len(rX_tr), "regression_n_test": len(rX_te),
    })
    print("\nTop RF features:", [d["feature"] for d in importance[:5]])
