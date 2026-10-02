"""
11_forecasting.py — forecast AGGREGATE monthly clinic activity.
Created by Master of AI.

    python python/11_forecasting.py

We forecast operational volumes (screening visits, follow-up requests, lab
requests) for capacity planning. We do NOT forecast individual patients or
disease progression.

Method
  1. Decompose the series (trend + seasonality + remainder).
  2. Hold out the last 12 months as a test period.
  3. Compare: seasonal naive, linear trend + month effects, Holt-Winters.
  4. Score on the hold-out with MAE, RMSE and MAPE.
  5. Refit the chosen method on all history and forecast 12 months ahead
     with an approximate 95% interval (± 1.96 × hold-out RMSE).

Realistic training data.
"""
import warnings

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose

from medlib import OUTPUTS, load_monthly, r, save_results

warnings.filterwarnings("ignore")
H = 12
SERIES = ["screening_visits", "follow_up_requests", "lab_requests"]


def metrics(actual, pred):
    actual, pred = np.asarray(actual, float), np.asarray(pred, float)
    err = actual - pred
    return {"mae": r(np.mean(np.abs(err)), 2), "rmse": r(np.sqrt(np.mean(err ** 2)), 2),
            "mape": r(100 * np.mean(np.abs(err / actual)), 2)}


def seasonal_naive(train, h):
    return np.array([train.iloc[-12 + (i % 12)] for i in range(h)])


def trend_season(train, h):
    t = np.arange(len(train))
    months = np.arange(len(train)) % 12
    X = np.column_stack([np.ones_like(t), t] + [(months == m).astype(float) for m in range(1, 12)])
    beta, *_ = np.linalg.lstsq(X, train.values, rcond=None)
    tf = np.arange(len(train), len(train) + h)
    mf = tf % 12
    Xf = np.column_stack([np.ones_like(tf), tf] + [(mf == m).astype(float) for m in range(1, 12)])
    return Xf @ beta


def holt_winters(train, h):
    model = ExponentialSmoothing(train.values, trend="add", seasonal="add", seasonal_periods=12).fit()
    return model.forecast(h)


METHODS = {"Seasonal naive": seasonal_naive, "Trend + seasonality (regression)": trend_season,
           "Holt-Winters (additive)": holt_winters}

if __name__ == "__main__":
    df = load_monthly().set_index("month")
    results = {}
    for col in SERIES:
        y = df[col].astype(float)
        train, test = y.iloc[:-H], y.iloc[-H:]
        holdout = {}
        for name, fn in METHODS.items():
            pred = fn(train, H)
            holdout[name] = {"pred": np.round(pred, 1), **metrics(test, pred)}
        best = min(holdout, key=lambda k: holdout[k]["rmse"])
        future = METHODS[best](y, H)
        band = 1.96 * holdout[best]["rmse"]
        future_idx = pd.date_range(y.index[-1] + pd.offsets.MonthBegin(), periods=H, freq="MS")
        dec = seasonal_decompose(y, model="additive", period=12)
        results[col] = {
            "months": y.index.strftime("%Y-%m"), "values": y.values.astype(int),
            "trend": [r(v, 1) for v in dec.trend], "seasonal": np.round(dec.seasonal.values[:12], 1),
            "holdout_start": test.index[0].strftime("%Y-%m"), "holdout": holdout, "best_method": best,
            "future_months": future_idx.strftime("%Y-%m"), "forecast": np.round(future, 1),
            "lower": np.round(future - band, 1), "upper": np.round(future + band, 1),
            "annual_growth_pct": r(100 * (y.iloc[-12:].sum() / y.iloc[-24:-12].sum() - 1), 2),
        }
        print(f"\n=== {col} (hold-out = last {H} months) ===")
        for name, m in holdout.items():
            print(f"  {name:<34} MAE {m['mae']:7.2f}  RMSE {m['rmse']:7.2f}  MAPE {m['mape']:5.2f}%")
        print(f"  -> chosen: {best}; next-12-month total forecast: {future.sum():,.0f}")

        if col == "screening_visits":
            fig, ax = plt.subplots(figsize=(11, 4.5))
            ax.plot(y.index, y.values, label="history", color="#2f6fde")
            ax.plot(dec.trend.index, dec.trend.values, label="trend", color="#868e96", ls="--")
            ax.plot(test.index, holdout[best]["pred"], label=f"hold-out: {best}", color="#d9480f")
            ax.plot(future_idx, future, label="forecast", color="#2b8a3e")
            ax.fill_between(future_idx, future - band, future + band, color="#2b8a3e", alpha=.15, label="≈95% interval")
            ax.set_title("Monthly screening visits — aggregate training data")
            ax.legend()
            fig.tight_layout()
            fig.savefig(OUTPUTS / "fig_forecast_screening.png", dpi=120)

    save_results("11_forecasting", {"horizon": H, "series": results})
