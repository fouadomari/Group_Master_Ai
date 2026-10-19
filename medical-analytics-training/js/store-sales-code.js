/* =====================================================================
   store-sales-code.js — the Python code taught in Lecture 2
   (Data Analysis with Python — Kaggle Store Sales).
   Created by Master of AI.

   One source for both places the code appears:
     • the lesson pages (copyable code blocks), and
     • notebooks/06_store_sales_analysis.ipynb, which
       tools/build_store_sales_notebook.py builds from this file.
   Keep every snippet a plain template string (no ${...}).
   ===================================================================== */
const PYS = {
  colab_upload: `# Run this cell in Google Colab, then choose train.csv and stores.csv
from google.colab import files

uploaded = files.upload()
print("Uploaded:", list(uploaded.keys()))`,

  setup: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from IPython.display import display

sns.set_theme(style="whitegrid")
plt.rcParams["figure.figsize"] = (12, 6)`,

  check_files: `import os

REQUIRED_COLUMNS = {
    "train.csv": ["id", "date", "store_nbr", "family", "sales", "onpromotion"],
    "stores.csv": ["store_nbr", "city", "state", "type", "cluster"],
}

for file_name, required in REQUIRED_COLUMNS.items():
    if not os.path.exists(file_name):
        raise FileNotFoundError(
            f"{file_name} was not found in {os.getcwd()}. "
            "Upload it first (Files panel or files.upload()) or fix the path."
        )
    found = pd.read_csv(file_name, nrows=0).columns.tolist()
    missing = [col for col in required if col not in found]
    if missing:
        raise ValueError(f"{file_name} is missing columns {missing}. Found: {found}")

print("Both files found and all required columns are present.")`,

  load: `train = pd.read_csv("train.csv")
stores = pd.read_csv("stores.csv")

print("Train shape:", train.shape)
print("Stores shape:", stores.shape)

display(train.head())
display(stores.head())`,

  explore: `train.info()
stores.info()

display(train.describe(include="all").T)
display(stores.describe(include="all").T)

print("Train columns:", train.columns.tolist())
print("Stores columns:", stores.columns.tolist())

print(train.dtypes)`,

  quality: `print(train.isnull().sum())
print(stores.isnull().sum())

print("Duplicate rows in train:", train.duplicated().sum())
print("Duplicate rows in stores:", stores.duplicated().sum())

print(
    "Duplicate store keys:",
    stores["store_nbr"].duplicated().sum()
)`,

  unexpected: `# Values that are possible to store but unexpected for this business
print("Negative sales:", (train["sales"] < 0).sum())
print("Negative promotion counts:", (train["onpromotion"] < 0).sum())
print("Zero-sales records:", (train["sales"] == 0).sum())
print("Product families:", train["family"].nunique())`,

  keep_raw: `# Keep an untouched copy before changing anything, so every change can be audited
train_raw = train.copy()`,

  dates: `train["date"] = pd.to_datetime(
    train["date"],
    errors="coerce"
)

print("Invalid dates:", train["date"].isna().sum())
print("Date range:", train["date"].min(), train["date"].max())`,

  cleaning_log: `# Record every cleaning decision: what we found, what we decided, and why
cleaning_log = []

def log_decision(issue, evidence, decision, reason):
    cleaning_log.append(
        {"issue": issue, "evidence": evidence, "decision": decision, "reason": reason}
    )

invalid_dates = int(train["date"].isna().sum())
log_decision(
    "Invalid dates",
    f"{invalid_dates} rows could not be converted",
    "Keep the rows; time-based summaries will skip them automatically",
    "Their sales still count in store and product totals",
)

missing_sales = int(train["sales"].isna().sum())
log_decision(
    "Missing sales",
    f"{missing_sales} rows",
    "Keep; pandas sum() and mean() skip missing values",
    "Filling them with 0 would invent sales information",
)

display(pd.DataFrame(cleaning_log))`,

  merge: `merged = train.merge(
    stores,
    on="store_nbr",
    how="left",
    validate="many_to_one"
)

print("Train rows:", len(train))
print("Stores rows:", len(stores))
print("Merged rows:", len(merged))`,

  merge_check: `print("Rows before merge:", len(train))
print("Rows after merge:", len(merged))

print("Missing city values:", merged["city"].isna().sum())
print("Missing store type:", merged["type"].isna().sum())`,

  merge_investigate: `# 1) Store numbers that appear in train but not in stores
missing_keys = sorted(set(train["store_nbr"]) - set(stores["store_nbr"]))
print("Store numbers without store information:", missing_keys)

# 2) Store numbers that appear more than once in stores (these break many_to_one)
repeated_keys = stores[stores["store_nbr"].duplicated(keep=False)]
display(repeated_keys.sort_values("store_nbr"))`,

  join_demo: `# Teaching example: tiny made-up tables, NOT the Kaggle data
demo_sales = pd.DataFrame({
    "store_nbr": [1, 1, 2, 4],
    "sales": [100, 80, 50, 30],
})
demo_stores = pd.DataFrame({
    "store_nbr": [1, 2, 3],
    "city": ["Quito", "Guayaquil", "Cuenca"],
})

for how in ["left", "right", "inner", "outer"]:
    result = demo_sales.merge(demo_stores, on="store_nbr", how=how, indicator=True)
    print(f"--- how='{how}': {len(result)} rows")
    display(result)`,

  joins: `left_join = train.merge(
    stores,
    on="store_nbr",
    how="left"
)

right_join = train.merge(
    stores,
    on="store_nbr",
    how="right"
)

inner_join = train.merge(
    stores,
    on="store_nbr",
    how="inner"
)

outer_join = train.merge(
    stores,
    on="store_nbr",
    how="outer",
    indicator=True
)`,

  joins_check: `for name, table in [("left", left_join), ("right", right_join),
                    ("inner", inner_join), ("outer", outer_join)]:
    print(f"{name:>5} join: {len(table):,} rows")

print(outer_join["_merge"].value_counts())

# The four tables are large; free the memory once you have compared them
del left_join, right_join, inner_join, outer_join`,

  features: `merged["year"] = merged["date"].dt.year
merged["month"] = merged["date"].dt.month
merged["day"] = merged["date"].dt.day
merged["day_name"] = merged["date"].dt.day_name()
merged["weekday"] = merged["date"].dt.dayofweek`,

  features_weekday: `# Total sales of the whole chain on each date, then the average per weekday
daily_total = merged.groupby("date", as_index=False)["sales"].sum()
daily_total["day_name"] = daily_total["date"].dt.day_name()

weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday",
                 "Friday", "Saturday", "Sunday"]
avg_by_weekday = (
    daily_total.groupby("day_name")["sales"]
    .mean()
    .reindex(weekday_order)
)
display(avg_by_weekday)`,

  groupby: `sales_by_store = (
    merged.groupby("store_nbr", as_index=False)
    .agg(
        total_sales=("sales", "sum"),
        average_sales=("sales", "mean"),
        sales_records=("sales", "count")
    )
    .sort_values("total_sales", ascending=False)
)

sales_by_family = (
    merged.groupby("family", as_index=False)
    .agg(
        total_sales=("sales", "sum"),
        average_sales=("sales", "mean")
    )
    .sort_values("total_sales", ascending=False)
)

sales_by_city = (
    merged.groupby("city", as_index=False)
    .agg(
        total_sales=("sales", "sum"),
        average_sales=("sales", "mean")
    )
    .sort_values("total_sales", ascending=False)
)

display(sales_by_store.head(10))
display(sales_by_family.head(10))
display(sales_by_city.head(10))`,

  avg_daily_store: `# Average DAILY TOTAL per store: first add up each store's sales per date,
# then average those daily totals
daily_store_sales = (
    merged.groupby(["store_nbr", "date"], as_index=False)["sales"].sum()
)

avg_daily_by_store = (
    daily_store_sales.groupby("store_nbr", as_index=False)
    .agg(
        avg_daily_sales=("sales", "mean"),
        days=("date", "nunique")
    )
    .sort_values("avg_daily_sales", ascending=False)
)
display(avg_daily_by_store.head(10))`,

  resample: `monthly_sales = (
    merged.set_index("date")["sales"]
    .resample("MS")
    .sum()
)

yearly_sales = (
    merged.set_index("date")["sales"]
    .resample("YS")
    .sum()
)

display(monthly_sales.head())
display(yearly_sales)`,

  stats: `sales_stats = merged["sales"].agg([
    "count",
    "mean",
    "median",
    "std",
    "min",
    "max"
])

display(sales_stats)`,

  iqr: `q1 = merged["sales"].quantile(0.25)
q3 = merged["sales"].quantile(0.75)

iqr = q3 - q1

lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr

outliers = merged[
    (merged["sales"] < lower_bound) |
    (merged["sales"] > upper_bound)
]

print("Potential outliers:", len(outliers))`,

  viz_monthly: `monthly_sales.plot(kind="line", marker="o")
plt.title("Monthly Sales Over Time")
plt.xlabel("Month")
plt.ylabel("Total Sales")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,

  viz_stores: `top_stores = sales_by_store.head(10)

sns.barplot(
    data=top_stores,
    x="store_nbr",
    y="total_sales"
)

plt.title("Top 10 Stores by Total Sales")
plt.xlabel("Store Number")
plt.ylabel("Total Sales")
plt.tight_layout()
plt.show()`,

  viz_families: `top_families = sales_by_family.head(10)

sns.barplot(
    data=top_families,
    x="total_sales",
    y="family"
)

plt.title("Top 10 Product Families by Total Sales")
plt.xlabel("Total Sales")
plt.ylabel("Product Family")
plt.tight_layout()
plt.show()`,

  viz_hist: `sns.histplot(
    data=merged,
    x="sales",
    bins=50,
    kde=True
)

plt.title("Distribution of Sales")
plt.xlabel("Sales")
plt.ylabel("Frequency")
plt.tight_layout()
plt.show()`,

  viz_scatter: `sample = merged.sample(
    n=min(5000, len(merged)),
    random_state=42
)

sns.scatterplot(
    data=sample,
    x="onpromotion",
    y="sales",
    alpha=0.5
)

plt.title("Promotions vs Sales")
plt.xlabel("Items on Promotion")
plt.ylabel("Sales")
plt.tight_layout()
plt.show()`,

  promo_compare: `# Full data (not the sample): records with and without promoted items
has_promotion = merged["onpromotion"] > 0
display(merged.groupby(has_promotion)["sales"].agg(["count", "mean", "median"]))

print("Correlation:", round(merged["onpromotion"].corr(merged["sales"]), 3))`,

  compare_type: `sales_by_type = (
    merged.groupby("type", as_index=False)
    .agg(total_sales=("sales", "sum"))
    .sort_values("total_sales", ascending=False)
)

display(sales_by_type)`,

  compare_fair: `# A fairer comparison: average daily sales PER STORE
# 1) one row per store per date (the store's total for that day)
daily_store_sales = (
    merged.groupby(["store_nbr", "city", "type", "date"], as_index=False)["sales"].sum()
)

# 2) average those daily store totals within each store type
fair_by_type = (
    daily_store_sales.groupby("type", as_index=False)
    .agg(
        stores=("store_nbr", "nunique"),
        store_days=("sales", "count"),
        avg_daily_sales_per_store=("sales", "mean")
    )
    .sort_values("avg_daily_sales_per_store", ascending=False)
)
display(fair_by_type)

fair_by_city = (
    daily_store_sales.groupby("city", as_index=False)
    .agg(
        stores=("store_nbr", "nunique"),
        avg_daily_sales_per_store=("sales", "mean")
    )
    .sort_values("avg_daily_sales_per_store", ascending=False)
)
display(fair_by_city.head(10))`,

  viz_compare: `fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.barplot(data=sales_by_type, x="type", y="total_sales", ax=axes[0])
axes[0].set_title("Total Sales by Store Type")

sns.barplot(data=fair_by_type, x="type", y="avg_daily_sales_per_store", ax=axes[1])
axes[1].set_title("Average Daily Sales per Store, by Type")

plt.tight_layout()
plt.show()

top_cities = sales_by_city.head(10)
sns.barplot(data=top_cities, x="total_sales", y="city")
plt.title("Top 10 Cities by Total Sales")
plt.xlabel("Total Sales")
plt.ylabel("City")
plt.tight_layout()
plt.show()`,

  ex_share_top5: `top5_share = (
    sales_by_store["total_sales"].head(5).sum()
    / sales_by_store["total_sales"].sum()
)
print(f"The top 5 stores bring {top5_share:.1%} of total sales")`,

  ex_city_monthly: `city = "Quito"
available = sorted(merged["city"].dropna().unique())
if city not in available:
    raise ValueError(f"{city} is not in the data. Available cities: {available}")

city_monthly = (
    merged[merged["city"] == city]
    .set_index("date")["sales"]
    .resample("MS")
    .sum()
)

city_monthly.plot(kind="line", marker="o")
plt.title(f"Monthly Sales in {city}")
plt.xlabel("Month")
plt.ylabel("Total Sales")
plt.tight_layout()
plt.show()`,

  ex_weekend: `daily_total = merged.groupby("date", as_index=False)["sales"].sum()
daily_total["is_weekend"] = daily_total["date"].dt.dayofweek >= 5   # Saturday = 5, Sunday = 6

display(daily_total.groupby("is_weekend")["sales"].agg(["count", "mean", "median"]))`,

  ex_family_by_type: `family_by_type = (
    merged.groupby(["type", "family"], as_index=False)["sales"].sum()
    .sort_values("sales", ascending=False)
    .drop_duplicates("type")          # keep the first (largest) family of each type
    .sort_values("type")
)
display(family_by_type)`,
};
