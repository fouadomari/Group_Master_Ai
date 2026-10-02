"""
make_share_package.py — build the two zip files used to share the project.
Created by Master of AI.

    python tools/make_share_package.py

share/medical-analytics-training-website.zip
    Only what the website needs (4 pages, css, js, logos, the five CSV files)
    plus OPEN-ME.txt. Colleagues unzip it and double-click index.html.
share/medical-analytics-training-full-project.zip
    Everything a maintainer needs to rebuild the data and results
    (python, sql, notebooks, exercises, tools), without generated model files.
"""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "share"
NAME = "medical-analytics-training"

WEBSITE = ["index.html", "lecture-1.html", "lecture-2.html", "agent-report.html",
           "css/*.css", "js/*.js", "assets/*.png", "data/*.csv"]

SKIP_DIRS = {"share", "__pycache__", ".ipynb_checkpoints", ".git", "models"}
SKIP_SUFFIX = {".pyc", ".db"}

OPEN_ME = """Medical Analytics Training - Created by Master of AI
Al-Ahliyya Amman University

HOW TO OPEN
1. Unzip this folder (right-click > Extract All). Do not open the pages from inside the zip.
2. Double-click index.html. It opens in your web browser (Chrome, Edge, Firefox or Safari).
3. Choose Lecture 1 or Lecture 2. The "Ask the data" button (bottom corner of every page)
   opens the Data Agent chatbot. It works in English and Arabic.

Nothing needs to be installed and no internet connection is required
(with internet the pages use nicer fonts; without it they use the system fonts).

PAGES
index.html          Home - choose a lecture, download the data
lecture-1.html      Lecture 1 (20 sections)
lecture-2.html      Lecture 2 (12 sections)
agent-report.html   How the Data Agent works (official report)

All data is synthetic. No real patient information.
"""


def website_files():
    for pattern in WEBSITE:
        yield from sorted(ROOT.glob(pattern))


def project_files():
    for p in sorted(ROOT.rglob("*")):
        rel = p.relative_to(ROOT)
        if p.is_file() and not (set(rel.parts) & SKIP_DIRS) and p.suffix not in SKIP_SUFFIX:
            yield p


def write_zip(path, files, extra=None):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, f"{NAME}/{f.relative_to(ROOT).as_posix()}")
        for arcname, text in (extra or {}).items():
            z.writestr(f"{NAME}/{arcname}", text)
    print(f"wrote {path.relative_to(ROOT)}  ({len(z.namelist())} files, {path.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    write_zip(OUT / f"{NAME}-website.zip", website_files(), {"OPEN-ME.txt": OPEN_ME})
    write_zip(OUT / f"{NAME}-full-project.zip", project_files(), {"OPEN-ME.txt": OPEN_ME})
