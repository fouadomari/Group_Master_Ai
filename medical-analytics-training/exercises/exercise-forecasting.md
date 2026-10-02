# Exercise 5 — Forecasting Clinic Activity

*Created by Master of AI.*

> **Synthetic educational data only.** This training is not intended for diagnosis, treatment, triage, medication decisions, or clinical decision-making.
>
> We forecast **aggregate operational volumes** only — never individual patients or disease progression.

**Lecture 1 section:** 19 Forecasting
**Level:** Intermediate · **Time:** ~45 minutes

## Objective

Decompose a monthly operational series into trend and seasonality, evaluate forecasting methods honestly on a hold-out period, and produce a 12-month forecast with an uncertainty range for capacity planning.

## Dataset

`data/monthly_clinic_activity.csv` — 72 months (Jan 2019 – Dec 2024): `month, screening_visits, follow_up_requests, lab_requests`.

## Tasks

1. Load the file with `month` parsed as a date and set it as the index. Plot `lab_requests`.
2. Run an additive `seasonal_decompose` with `period=12`. Which calendar months are busiest and quietest?
3. Hold out the **last 12 months** (2024) as a test set. Produce forecasts for that year with:
   - **Seasonal naive** — each month equals the same month one year earlier
   - **Holt-Winters** — `ExponentialSmoothing(trend="add", seasonal="add", seasonal_periods=12)`
4. Score both on the hold-out with **MAE, RMSE and MAPE**. Which method wins, and by how much?
5. Refit Holt-Winters on all 72 months and forecast the 12 months of 2025. What is the total? Add an approximate 95 % range of ± 1.96 × hold-out RMSE per month.
6. Name two events that would make this forecast unreliable.

## Hints

- `y.iloc[-12:]` is the hold-out; `y.iloc[:-12]` is the training series.
- Seasonal naive for the hold-out: `train.iloc[-12:].values`.
- MAPE = mean(|actual − forecast| / actual) × 100.
- `statsmodels` may warn that no frequency was set — pass `freq="MS"` to `pd.date_range` or ignore the warning.

## Expected output

| Method (hold-out 2024) | MAE | RMSE | MAPE |
|---|---|---|---|
| Seasonal naive | 61.25 | 69.19 | 7.45 % |
| Holt-Winters (additive) | **32.06** | **35.60** | **3.95 %** |

- Seasonality (average seasonal effect): **January** is the busiest month (+47), with November–March generally above trend; the summer months **May–August** are below trend, and **August** is clearly the quietest (−88).
- Holt-Winters roughly **halves** the error of the seasonal-naive benchmark.
- 2024 actual total: 9,694 lab requests · 2025 Holt-Winters forecast total ≈ **10,329** (≈ +6.6 %), first months ≈ 883, 868, 874.
- (`python/11_forecasting.py` also tests a trend + month-effects regression, which scores MAE 30.36 / MAPE 3.81 % on this series.)

## Solution

```python
import warnings

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose

warnings.filterwarnings("ignore")
ts = pd.read_csv("data/monthly_clinic_activity.csv", parse_dates=["month"]).set_index("month")
y = ts["lab_requests"].astype(float)
y.plot(title="Monthly lab requests (synthetic)"); plt.show()

# 2. decomposition
dec = seasonal_decompose(y, model="additive", period=12)
seasonal = dec.seasonal.groupby(dec.seasonal.index.month).mean().round(1)
print(seasonal.sort_values())

# 3-4. hold-out evaluation
train, test = y.iloc[:-12], y.iloc[-12:]
naive = train.iloc[-12:].values
hw = ExponentialSmoothing(train, trend="add", seasonal="add", seasonal_periods=12).fit().forecast(12).values

def scores(actual, pred):
    err = np.asarray(actual) - np.asarray(pred)
    return {"MAE": round(np.abs(err).mean(), 2), "RMSE": round(np.sqrt((err ** 2).mean()), 2),
            "MAPE %": round(100 * np.abs(err / np.asarray(actual)).mean(), 2)}

print("Seasonal naive", scores(test, naive))
print("Holt-Winters  ", scores(test, hw))

# 5. forecast 2025 with an approximate 95% range
rmse = scores(test, hw)["RMSE"]
final = ExponentialSmoothing(y, trend="add", seasonal="add", seasonal_periods=12).fit()
future = final.forecast(12)
band = 1.96 * rmse
print(pd.DataFrame({"forecast": future.round(), "lower": (future - band).round(), "upper": (future + band).round()}))
print("2024 actual:", int(test.sum()), " 2025 forecast:", round(future.sum()))
```

**Answers**

- **(4)** Holt-Winters wins: MAE 32 vs 61 and MAPE ≈ 4 % vs 7.5 %. Always compare against a simple benchmark — a sophisticated model that cannot beat "same month last year" adds no value.
- **(5)** ≈ 10,329 lab requests in 2025. Plan with the range, not the single number, and re-forecast monthly as new data arrives.
- **(6)** Examples: opening or closing a clinic, a change in screening policy or eligibility, a new laboratory contract, an outbreak or public-health campaign, a change in how requests are recorded. The model only knows the historical pattern.
