# Medical Analytics Training

**Created by Master of AI** · Al-Ahliyya Amman University

Two interactive, bilingual (English / العربية) lectures that explain medical data analytics **step by step, in plain language** — with every example shown live in the browser. Learners never need to download, install or run anything.

| | |
|---|---|
| **Lecture 1** | *From Messy Medical Data to Statistical Insight, Machine Learning and Forecasting* — 20 sections |
| **Lecture 2** | *From Statistical Insight to BI, Automation and AI Agents* — 12 sections |
| **Data** | One realistic, fully synthetic patient-screening dataset (1,236 messy → 1,200 clean records) and 72 months of clinic activity. No real patients. |

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

### Lecture 2 — sections
From insight to action · What is BI? · Choosing good KPIs · Organising data (star schema) · Asking questions with SQL · Building a dashboard · Automating the pipeline · Watching data quality over time · Reports that write themselves · AI assistants (LLMs) · AI agents: plan, act, check · Guardrails, privacy and governance

> The AI assistant and agent demonstrations in Lecture 2 are **simulations**: no AI model is called. Their steps and answers are built from the real data to show how a grounded, well-governed assistant works.

---

## Website features

- Navigation: **Lecture 1 · Lecture 2** in the top bar; section sidebar (collapsible) with progress; Previous / Next; "Lecture start"; mobile menu, bottom bar and swipe.
- Every section has its own URL (e.g. `lecture-1.html#data-cleaning`, `lecture-2.html#dashboard`); browser Back / Forward work.
- Keyboard: `←` previous · `→` next · `Home` first · `End` last · `Esc` closes the menu.
- English / Arabic with right-to-left layout; light / dark themes with automatic logo switching. Choices are remembered in the browser.
- All statistics are computed live with the same conventions as pandas / SciPy and were cross-checked against the Python results.
- **See the code behind any result:** click any number tile, or the **`</> Code`** button on a chart, table or log, and a window shows the exact Python (or SQL) code that produced that result — using the selections currently made on the page — next to the result itself. Snippets live in `js/code-snippets.js`; all of them were executed in Python and reproduce the numbers shown (the confidence-interval simulation uses fresh random samples, so its count varies by design).
- **Data Agent ("Ask the data"):** the platform's official chatbot, available on every page. It answers questions in English or Arabic by querying the platform's data (counts, averages, group comparisons, correlations, missing data, clinics, activity volumes, forecasts), shows its evidence, reasoning and Python query, refuses clinical decisions and individual patient look-ups, and keeps an activity log. It is rule-based (no large language model) and runs entirely in the browser. Code: `js/agent.js`.
- **Official agent report:** `agent-report.html` explains how the Data Agent works — capabilities, query process, live trace of any question, data sources, guardrails, limitations and a live verification table (all reference answers match independent pandas results).
- **Download the data:** the five CSV files (raw file, cleaned file, outliers, monthly clinic activity, data dictionary) can be downloaded from the home page (`index.html#data`), from the start page of each lecture, and from Lecture 1 Section 01. Everything else is shown on the page.
- No external libraries; works directly from disk (`file://`) and on GitHub Pages.

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
│   ├── l2-sections-a/b.js     Lecture 2 content
│   ├── home.js           home page
│   ├── agent.js          Data Agent (chatbot) engine and chat panel
│   ├── report.js         official agent report page
│   ├── code-snippets.js  the code shown behind every result
│   └── site-data.js      generated: the datasets and analysis results used by the pages
├── data/  python/  sql/  notebooks/  exercises/   source material used to generate and verify the content
└── tools/                build scripts (maintainers only)
```

Learners only need the three HTML pages. The `data/`, `python/`, `sql/`, `notebooks/` and `exercises/` folders are the maintainers' source material: the Python scripts generate the synthetic data and every result shown on the site. They are not linked from the website.

---

## Open the website

Double-click `index.html`, or serve the folder and open it in a browser:

```bash
python -m http.server 8000
```

### Share with colleagues

```bash
python tools/make_share_package.py
```

This writes two zips to `share/`:

- `medical-analytics-training-website.zip` (about 0.8 MB): the four pages, styles, scripts, logos, the five CSV files and `OPEN-ME.txt`. Colleagues extract it and double-click `index.html`. It works offline and the Data Agent works too.
- `medical-analytics-training-full-project.zip` (about 1.4 MB): adds the Python, SQL, notebooks, exercises and build tools, for maintainers.

To give everyone a single link instead, publish the website zip's contents on GitHub Pages (below), Netlify Drop or a university web server.

### Deploy to GitHub Pages

1. Push the contents of `medical-analytics-training/` to a repository (with `index.html` at the root).
2. **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
3. The site appears at `https://<user>.github.io/<repo>/`.

---

## Change the branding

Edit the `BRAND` object at the top of `js/shared.js` (`createdBy`, `companyName`, `department`, default language and theme). The crest in `assets/source/university-logo.jpg` is turned into transparent website logos by `python tools/make_logo_png.py` (it removes the white background and writes `logo.png`, `logo-dark.png`, `logo-light.png` and `favicon.png`). To use a different logo, replace the source image and run the script again. Colours are CSS variables at the top of `css/shared.css`.

---

## For maintainers: regenerate the data and results

```bash
pip install -r requirements.txt
python tools/build_all.py
```

This regenerates the synthetic data (fixed seed 42), runs every analysis script, and rewrites `js/site-data.js`, so the website always shows numbers produced by the scripts.

---

© Master of AI — Al-Ahliyya Amman University. All synthetic data; no real patient information.
