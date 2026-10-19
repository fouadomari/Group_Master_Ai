# Medical Analytics Training

**Created by Master of AI** · Al-Ahliyya Amman University

Two interactive, bilingual (English / العربية) lectures that explain medical data analytics **step by step, in plain language** — with every example shown live in the browser. Learners never need to download, install or run anything.

| | |
|---|---|
| **Lecture 1** | *From Messy Medical Data to Statistical Insight, Machine Learning and Forecasting* — 20 sections |
| **Lecture 2** | *Data Analysis with Python — From Raw Data to Business Insights* (Kaggle Store Sales data) — 15 sections |
| **PyPath** | A 30-day beginner Python course (Python → data science → machine learning → deep learning → NLP), linked from the **PyPath** button in the top bar. Days 1–2 are ready. |
| **Data** | One realistic patient-screening training dataset (1,236 messy → 1,200 clean records) and 72 months of clinic activity. |

---

## How every section is organised

Every section in both lectures follows the same simple layout:

1. **In simple terms** — the idea in one or two sentences
2. **Why it matters** — two or three short points
3. **Step by step** — the process, one small step at a time, each with an example from our data
4. **See it on our data** — a live, interactive demonstration (charts, tables, simulations)
5. **What this shows** — the result explained in words
6. **Behind the scenes** *(optional, collapsed)* — the Python/SQL code with the result it produces
7. **Remember** — one key message, plus a quick check question

### Lecture 1 — sections
The big picture · Five fields explained (analysis, statistics, data science, ML, AI) · How AI/ML/data science fit together · Asking the right questions · Our tools (Python) · Checking data quality · Cleaning the data · Handling missing data · Descriptive statistics · Shape and spread · Exploring the data · Correlation · Hypothesis testing · Confidence intervals · The processing pipeline · Feature engineering · Machine learning · Model evaluation · Forecasting · The full journey

### Lecture 2 — Data Analysis with Python (15 sections)
Introduction to data analysis · The Kaggle Store Sales dataset (and loading your copies) · Python setup and loading · Data exploration · Data quality and cleaning · Merging the two files · The four join types · Feature engineering · GroupBy and aggregation · Time-series analysis · Statistics and outliers · Visualisation · Cities and store types · Business insights · Limitations and conclusion

- Data: `train.csv` and `stores.csv` from https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data (not included — download them from Kaggle; the competition rules must be accepted first).
- The Python code runs in Google Colab. `notebooks/06_store_sales_analysis.ipynb` contains all of it in order; it is built from `js/store-sales-code.js` by `python tools/build_store_sales_notebook.py`, so the page and the notebook always show the same code.
- **Results on the page:** in Section 2 the viewer chooses their copies of the two files. `js/store-sales.js` reads them **in the browser** (nothing is uploaded), computes the same results as the Python code (shape, info, describe, missing values, duplicates, merge checks, the four joins, group-bys, monthly/yearly totals, statistics, IQR outliers, charts) and keeps a small summary in the browser so every section can show it. Without files, sections say clearly where the results will appear; no results are invented.
- The JavaScript results were checked against pandas on test files with the same structure: all values matched. Reading a file of 3,000,888 rows takes about 9 seconds in a desktop browser.


---

## Website features

- Navigation: **Lecture 1 · Lecture 2 · PyPath** in the top bar (PyPath is a button). When the bar collapses (980 px and below) the menu holds the same links, with a full-width **PyPath** button just above the language and theme options; section sidebar (collapsible) with progress; Previous / Next; "Lecture start"; mobile menu, bottom bar and swipe.
- Every section has its own URL (e.g. `lecture-1.html#data-cleaning`, `lecture-2.html#dashboard`); browser Back / Forward work.
- Keyboard: `←` previous · `→` next · `Home` first · `End` last · `Esc` closes the menu.
- English / Arabic with right-to-left layout; light / dark themes with automatic logo switching. Choices are remembered in the browser.
- All statistics are computed live with the same conventions as pandas / SciPy and were cross-checked against the Python results.
- **See the code behind any result:** click any number tile, or the **`</> Code`** button on a chart, table or log, and a window shows the exact Python (or SQL) code that produced that result — using the selections currently made on the page — next to the result itself. Snippets live in `js/code-snippets.js`; all of them were executed in Python and reproduce the numbers shown (the confidence-interval simulation uses fresh random samples, so its count varies by design).
- **Data Agent ("Ask the data"):** the platform's official chatbot, available on every page. It answers questions in English or Arabic by querying the platform's data (counts, averages, group comparisons, correlations, missing data, clinics, activity volumes, forecasts), shows its evidence, reasoning and Python query, refuses clinical decisions and individual patient look-ups, and keeps an activity log. It is rule-based (no large language model) and runs entirely in the browser. Code: `js/agent.js`.
- **Official agent report:** `agent-report.html` explains how the Data Agent works — capabilities, query process, live trace of any question, data sources, guardrails, limitations and a live verification table (all reference answers match independent pandas results).
- **Download the data:** the five CSV files (raw file, cleaned file, outliers, monthly clinic activity, data dictionary) can be downloaded from the home page (`index.html#data`), from the start page of each lecture, and from Lecture 1 Section 01. Everything else is shown on the page.
- **PyPath:** `pypath/index.html` lists the 30 days by phase (Python Basics, Data Science, Machine Learning, Deep Learning, NLP), with a lesson link and a printable PDF for each finished day and "coming soon" for the rest. Each day (`pypath/dayNN/`) is a readable, hand-written page where Python really runs in the browser ([Pyodide](https://pyodide.org)); exercises check themselves and progress is saved in the browser. The day pages are copied unchanged from the PyPath course folder.
- No external libraries; works directly from disk (`file://`) and on GitHub Pages. **Exception:** PyPath lessons need internet the first time they are opened, because they download Python (Pyodide) from a CDN; the browser caches it after that.

---

## Project structure

```
medical-analytics-training/
├── index.html            Home: choose Lecture 1 or Lecture 2
├── lecture-1.html        Lecture 1
├── lecture-2.html        Lecture 2
├── agent-report.html     Data Agent — official report
├── assets/               logo-dark.png · logo-light.png · logo.png · favicon.png (built from assets/source/university-logo.jpg)
├── css/                  shared.css · lecture.css
├── js/
│   ├── shared.js         BRAND config, language, theme, navigation, statistics, charts, data explorer
│   ├── lecture.js        lecture engine (router, sidebar, progress, simple lesson layout)
│   ├── l1-sections-a/b/c.js   Lecture 1 content
│   ├── l2-python-a/b.js       Lecture 2: Data Analysis with Python (15 sections)
│   ├── store-sales.js    in-browser analysis of the Kaggle Store Sales files
│   ├── store-sales-code.js    the Python code of Lecture 2 (also builds notebook 06)
│   ├── home.js           home page
│   ├── agent.js          Data Agent (chatbot) engine and chat panel
│   ├── report.js         official agent report page
│   ├── code-snippets.js  the code shown behind every result
│   └── site-data.js      generated: the datasets and analysis results used by the pages
├── pypath/               PyPath, a 30-day beginner Python course
│   ├── index.html        the path: all 30 days by phase, links back to the home page
│   ├── home.css          extra styles for the path page (the rest comes from day01/style.css)
│   └── dayNN/            one finished day: index.html · style.css · script.js · dayNN.pdf
├── data/  python/  sql/  notebooks/  exercises/   source material used to generate and verify the content
└── tools/                build scripts (maintainers only)
```

Learners only need the four HTML pages and the `pypath/` folder. The `data/`, `python/`, `sql/`, `notebooks/` and `exercises/` folders are the maintainers' source material: the Python scripts build the training data and every result shown on the site. They are not linked from the website.

---

## Open the website

Double-click `medical-analytics-training/index.html`, or serve the folder and open it in a browser:

```bash
python -m http.server 8000
```

### Share with colleagues

```bash
python tools/make_share_package.py
```

This writes two zips to `share/`:

- `medical-analytics-training-website.zip`: the four pages, styles, scripts, logos, the five CSV files, PyPath (`pypath/`: the path page and each finished day's page, style, script and PDF) and `OPEN-ME.txt`. Colleagues extract it and double-click `index.html`. It works offline and the Data Agent works too (only the PyPath lessons need internet the first time).
- `medical-analytics-training-full-project.zip` (about 1.4 MB): adds the Python, SQL, notebooks, exercises and build tools, for maintainers.

To give everyone a single link instead, publish the website zip's contents on GitHub Pages (below), Netlify Drop or a university web server.

### Deploy to GitHub Pages

1. Push this repository to GitHub. The `index.html` at the repository root forwards visitors to `medical-analytics-training/index.html`.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
3. The site appears at `https://<user>.github.io/<repo>/`.

---

## Change the branding

Edit the `BRAND` object at the top of `js/shared.js` (`createdBy`, `companyName`, `department`, default language and theme). The crest in `assets/source/university-logo.jpg` is turned into transparent website logos by `python tools/make_logo_png.py` (it removes the white background and writes `logo.png`, `logo-dark.png`, `logo-light.png` and `favicon.png`). To use a different logo, replace the source image and run the script again. Colours are CSS variables at the top of `css/shared.css`.

---

## For maintainers: regenerate the data and results

```bash
pip install -r requirements.txt
cd medical-analytics-training
python tools/build_all.py
```

This rebuilds the training data (fixed seed 42), runs every analysis script, and rewrites `js/site-data.js`, so the website always shows numbers produced by the scripts.

---

© Master of AI — Al-Ahliyya Amman University. Realistic training data, prepared for teaching.
