"""
build_store_sales_notebook.py — build notebooks/06_store_sales_analysis.ipynb
from the Python code shown in Lecture 2 (js/store-sales-code.js).
Created by Master of AI.

    python tools/build_store_sales_notebook.py            # write the notebook
    python tools/build_store_sales_notebook.py --test DIR # also run every cell on
                                                          # train.csv / stores.csv in DIR
"""
import re
import sys
from pathlib import Path

import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "js" / "store-sales-code.js"
OUT = ROOT / "notebooks" / "06_store_sales_analysis.ipynb"


def snippets():
    text = SRC.read_text(encoding="utf-8")
    found = dict(re.findall(r"^  (\w+): `(.*?)`,$", text, flags=re.S | re.M))
    assert "${" not in "".join(found.values()), "snippets must not use ${...}"
    return found


# (markdown, snippet key) in teaching order; None = markdown only
PLAN = [
    ("# Data Analysis with Python — From Raw Data to Business Insights\n\n"
     "Lecture 2 · Kaggle *Store Sales — Time Series Forecasting* · Created by Master of AI\n\n"
     "Data: https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data — download `train.csv` and `stores.csv`.\n\n"
     "Run the cells from top to bottom. Every result depends on the files you load.", None),
    ("## 1. Upload the files (Google Colab only)\nSkip this cell if the CSV files are already next to the notebook.", "colab_upload"),
    ("## 2. Set up the environment", "setup"),
    ("Check that both files exist and have the expected columns before loading them.", "check_files"),
    ("## 3. Load the data", "load"),
    ("## 4. Explore the data", "explore"),
    ("## 5. Data quality", "quality"),
    ("Values that are allowed but unexpected:", "unexpected"),
    ("Keep an untouched copy before any change:", "keep_raw"),
    ("Convert the date column (invalid dates become `NaT`):", "dates"),
    ("Record each cleaning decision so it can be audited:", "cleaning_log"),
    ("## 6. Merge sales with store information", "merge"),
    ("Validate the merge:", "merge_check"),
    ("If something looks wrong, investigate before fixing:", "merge_investigate"),
    ("## 7. The four join types\nFirst on a tiny teaching example (made-up data):", "join_demo"),
    ("Then on the real files:", "joins"),
    (None, "joins_check"),
    ("## 8. Feature engineering", "features"),
    ("Average daily total sales for each day of the week:", "features_weekday"),
    ("## 9. GroupBy and aggregation", "groupby"),
    ("Average of individual records vs average daily total per store:", "avg_daily_store"),
    ("## 10. Time-series analysis", "resample"),
    ("## 11. Statistics and outlier detection", "stats"),
    ("Interquartile range (IQR) method:", "iqr"),
    ("## 12. Visualisation\nMonthly total sales:", "viz_monthly"),
    ("Top 10 stores:", "viz_stores"),
    ("Top 10 product families:", "viz_families"),
    ("Distribution of sales (`kde=True` on millions of rows can take a while):", "viz_hist"),
    ("Promotions vs sales (a random sample of 5,000 records):", "viz_scatter"),
    ("The same question on the full data:", "promo_compare"),
    ("## 13. Comparing store types and cities", "compare_type"),
    ("A fairer comparison — average daily sales per store:", "compare_fair"),
    (None, "viz_compare"),
    ("## 14. Exercises — one possible solution each\nTry each exercise yourself first.\n\n"
     "**Exercise 1.** What share of total sales comes from the 5 best-selling stores?", "ex_share_top5"),
    ("**Exercise 2.** Plot the monthly sales of one city.", "ex_city_monthly"),
    ("**Exercise 3.** Is the average daily total higher on weekends?", "ex_weekend"),
    ("**Exercise 4.** Which product family sells the most in each store type?", "ex_family_by_type"),
    ("## 15. Business insights\nFor each question write: **observed result → possible explanation → recommendation to validate**.\n\n"
     "> The goal of data analysis is not merely to produce charts. It is to understand what is happening, investigate possible "
     "explanations, and provide reliable evidence to support better decisions.", None),
]


def build():
    code = snippets()
    book = new_notebook()
    book.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
    book.metadata["language_info"] = {"name": "python"}
    cells = []
    for md, key in PLAN:
        if md:
            cells.append(new_markdown_cell(md))
        if key:
            cells.append(new_code_cell(code[key]))
    book.cells = cells
    nbformat.validate(book)
    OUT.parent.mkdir(exist_ok=True)
    nbformat.write(book, OUT)
    unused = set(code) - {k for _, k in PLAN if k}
    print(f"wrote {OUT.relative_to(ROOT)} ({len(cells)} cells); snippets not in notebook: {sorted(unused) or 'none'}")
    return code


def test(code, data_dir):
    """Run every snippet in order against the CSV files in data_dir (no Colab upload)."""
    import os
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    os.chdir(data_dir)
    ns = {}
    for _, key in PLAN:
        if not key or key == "colab_upload":
            continue
        src = code[key].replace("from IPython.display import display", "display = print")
        exec(compile(src, key, "exec"), ns)
        plt.close("all")
        print(f"ok  {key}")
    print("all snippets ran without errors")


if __name__ == "__main__":
    c = build()
    if "--test" in sys.argv:
        test(c, sys.argv[sys.argv.index("--test") + 1])
