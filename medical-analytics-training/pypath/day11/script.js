/*
 * PyPath — page script
 * ====================
 * Makes the code boxes on the page work:
 *   1. Loads Python into the browser (Pyodide, downloaded from the internet the first time).
 *   2. "▶ Run" runs a code box and shows what it printed, or a friendly error.
 *   3. "✓ Check" runs an exercise answer and then its hidden tests.
 *   4. Remembers exercise progress in this browser (localStorage).
 *
 * The same script.js is used by every day, so the page itself (index.html) only
 * contains the lesson. Nothing here needs a server: open index.html straight from disk.
 */

"use strict";

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
const SOLUTION_AFTER_TRIES = 3;      // failed checks before "Show solution" appears
const MAX_OUTPUT_CHARS = 200000;     // stop showing output after this much text


/* ------------------------------------------------------------------
 * 1. The Python side
 * ------------------------------------------------------------------
 * This Python code is loaded once. It runs the learner's code, captures what
 * it prints, keeps the error messages short, and stops code that runs too long.
 * (String.raw keeps the Python text exactly as written.)
 */
const PYTHON_HELPER = String.raw`
import ast, base64, builtins, contextlib, importlib, io, linecache, os, sys, time, traceback, warnings
from pyodide.code import eval_code_async

os.environ["MPLBACKEND"] = "AGG"          # draw charts as images
warnings.filterwarnings("ignore", message=".*non-interactive.*")
warnings.filterwarnings("ignore", message=".*as_object_map.*")

CELL = "<cell>"     # the name Python uses for the learner's code in error messages
TIME_LIMIT = 20     # seconds; Python runs on the page, so an endless loop would freeze it


def _no_input(prompt=""):
    raise RuntimeError("input() can't ask questions on this page. "
                       "Put the value straight into a variable instead, like: name = \"Sara\"")

builtins.input = _no_input


class TimeLimitExceeded(Exception):
    pass


def _time_limit():
    """A tracer that stops the learner's own code after TIME_LIMIT seconds."""
    deadline = time.monotonic() + TIME_LIMIT

    def check_line(frame, event, arg):
        if time.monotonic() > deadline:
            raise TimeLimitExceeded(f"Your code ran for more than {TIME_LIMIT} seconds, "
                                    "so it was stopped. Is there a loop that never ends?")
        return check_line

    def on_call(frame, event, arg):      # only trace the learner's code, not libraries
        return check_line if frame.f_code.co_filename == CELL else None

    return on_call


def preimport(code):
    """Import the libraries the code uses before the time limit starts."""
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return
    for node in ast.walk(tree):
        names = []
        if isinstance(node, ast.Import):
            names = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom) and node.module and not node.level:
            names = [node.module]
        for name in names:
            try:
                importlib.import_module(name)
            except Exception:
                pass        # the learner sees the real error when the code runs


class _Stream(io.TextIOBase):
    """Sends printed text to the page (and optionally keeps a copy)."""
    def __init__(self, kind, emit, keep=None):
        self.kind, self.emit, self.keep = kind, emit, keep
    def write(self, text):
        if text:
            if self.keep is not None:
                self.keep.append(text)
            self.emit(self.kind, text)
        return len(text)


def _error_info(err):
    """A short error message that only shows the learner's own lines."""
    if isinstance(err, SyntaxError):
        lines = traceback.format_exception_only(type(err), err)
    else:
        te = traceback.TracebackException.from_exception(err)
        te.stack = traceback.StackSummary.from_list([f for f in te.stack if f.filename == CELL])
        lines = list(te.format(chain=False))   # skip "During handling…" errors from libraries
        if len(lines) > 1 and not te.stack:
            lines = lines[1:]
    text = "".join(lines).replace('File "<cell>", ', "")
    return {"type": type(err).__name__, "text": text}


def _send_charts(emit):
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is None:
        return
    for number in plt.get_fignums():
        buffer = io.BytesIO()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            plt.figure(number).savefig(buffer, format="png", dpi=100, bbox_inches="tight")
        emit("image", base64.b64encode(buffer.getvalue()).decode("ascii"))
    plt.close("all")


async def _run(code, namespace, emit, keep=None, show_last=True):
    linecache.cache[CELL] = (len(code), None, code.splitlines(True), CELL)
    try:
        sys.settrace(_time_limit())
        with contextlib.redirect_stdout(_Stream("text", emit, keep)), \
             contextlib.redirect_stderr(_Stream("warning", emit)):
            value = await eval_code_async(code, globals=namespace, filename=CELL,
                                          return_mode="last_expr" if show_last else "none")
        if show_last and value is not None:
            html = getattr(value, "_repr_html_", None)       # e.g. pandas tables
            if callable(html) and not isinstance(value, type):
                emit("html", html())
            else:
                emit("text", repr(value) + "\n")
        return None
    except BaseException as err:
        return _error_info(err)
    finally:
        sys.settrace(None)
        _send_charts(emit)


# All lesson code boxes on a page share one set of variables, like a notebook.
lesson_namespace = {"__name__": "__main__"}


def reset_lesson():
    lesson_namespace.clear()
    lesson_namespace["__name__"] = "__main__"


async def run_lesson_code(code, emit):
    return await _run(code, lesson_namespace, emit)


async def check_exercise(code, tests, emit):
    """Run the answer in a fresh namespace, then the hidden tests.

    Tests can use __output__ (all printed text), __lines__ (printed lines,
    trimmed, blanks removed), __code__ (the answer as text) and the answer's variables.
    """
    namespace = {"__name__": "__main__"}
    printed = []
    error = await _run(code, namespace, emit, keep=printed, show_last=False)
    if error:
        return {"passed": False, "error": error}
    output = "".join(printed)
    namespace["__output__"] = output
    namespace["__lines__"] = [line.strip() for line in output.splitlines() if line.strip()]
    namespace["__code__"] = code
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            await eval_code_async(tests, globals=namespace, filename="<tests>", return_mode="none")
    except AssertionError as err:
        return {"passed": False, "message": str(err) or "Not quite yet. Read the task again."}
    except Exception as err:
        return {"passed": False, "message": f"{type(err).__name__}: {err}"}
    return {"passed": True}
`;


/* ------------------------------------------------------------------
 * 2. Loading Python
 * ------------------------------------------------------------------ */

let pyodide = null;
const statusBox = document.getElementById("python-status");

function setStatus(text, state) {
  statusBox.textContent = text;
  statusBox.dataset.state = state;      // "loading" | "ready" | "running" | "error"
}

const pythonReady = (async () => {
  setStatus("⏳ Loading Python… (the first time can take a minute)", "loading");
  try {
    pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
    pyodide.runPython(PYTHON_HELPER);
    setStatus("✅ Python is ready", "ready");
  } catch (err) {
    setStatus("❌ Python could not load. Check your internet connection and reload the page.", "error");
    throw err;
  }
})();

// Only one piece of code runs at a time; others wait in this queue.
let queue = Promise.resolve();

function runInPython(task) {
  const job = queue.then(async () => {
    await pythonReady;
    return task();
  });
  queue = job.catch(() => {});
  return job;
}

// Gives the browser a moment to update the screen before Python takes over.
function waitForScreen() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

// Downloads and imports the libraries the code uses (numpy, pandas, ...).
async function prepare(code) {
  await pyodide.loadPackagesFromImports(code, {
    messageCallback: (msg) => setStatus("⏳ " + msg, "loading"),
  });
  setStatus("⏳ Running…", "running");
  await waitForScreen();
  pyodide.globals.get("preimport")(code);
}

// Converts a Python result into a normal JavaScript object.
function toJs(pyResult) {
  if (!pyResult) return null;
  const value = pyResult.toJs({ dict_converter: Object.fromEntries });
  pyResult.destroy();
  return value;
}


/* ------------------------------------------------------------------
 * 3. Showing output
 * ------------------------------------------------------------------ */

const ERROR_HINTS = {
  SyntaxError: "Python couldn't read this code. Look for a missing quote, bracket, colon or comma near the line shown.",
  IndentationError: "The spaces at the start of a line are not right.",
  NameError: "Python doesn't know this name. Check the spelling (capital letters matter), put quotes around it if it's text, or run the box that creates it first.",
  TypeError: "You combined things that don't fit together, like text + a number.",
  ValueError: "The kind of value is right but the value itself isn't, like int(\"hello\").",
  ZeroDivisionError: "You divided by zero, which maths doesn't allow.",
  IndexError: "You asked for a position that doesn't exist. Counting starts at 0.",
  KeyError: "That key or column name doesn't exist. Check the spelling.",
  AttributeError: "This kind of value doesn't have that. Check the spelling after the dot.",
  ModuleNotFoundError: "That library isn't available here. Check the spelling of the import.",
  TimeLimitExceeded: "A while loop needs something inside it that eventually makes its condition False.",
};

// Collects what a run prints and shows it in an output area.
function makePrinter(outputArea) {
  outputArea.innerHTML = "";
  let total = 0;
  let cut = false;

  return function print(kind, content) {
    if (cut) return;
    if (kind !== "image") {
      total += content.length;
      if (total > MAX_OUTPUT_CHARS) {
        cut = true;
        content = "\n… too much output, the rest is hidden.\n";
        kind = "warning";
      }
    }
    if (kind === "image") {
      const img = document.createElement("img");
      img.src = "data:image/png;base64," + content;
      img.alt = "Chart made by your code";
      outputArea.append(img);
    } else if (kind === "html") {
      const box = document.createElement("div");
      box.className = "output-table";
      box.innerHTML = content;
      outputArea.append(box);
    } else {
      // Join text to the previous block of the same kind, so lines stay together.
      let last = outputArea.lastElementChild;
      if (!last || last.tagName !== "PRE" || last.dataset.kind !== kind) {
        last = document.createElement("pre");
        last.dataset.kind = kind;
        outputArea.append(last);
      }
      last.textContent += content;
    }
  };
}

function showError(outputArea, error) {
  const box = document.createElement("div");
  box.className = "error";
  const title = document.createElement("strong");
  title.textContent = "⚠️ " + error.type;
  box.append(title);
  if (ERROR_HINTS[error.type]) {
    const hint = document.createElement("p");
    hint.textContent = ERROR_HINTS[error.type];
    box.append(hint);
  }
  const details = document.createElement("pre");
  details.textContent = error.text;
  box.append(details);
  outputArea.append(box);
}


/* ------------------------------------------------------------------
 * 4. Code boxes: typing comfort
 * ------------------------------------------------------------------ */

// Makes a textarea grow to fit its code.
function fitHeight(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + 2 + "px";
}

// Tab inserts 4 spaces; Shift+Enter (or Ctrl+Enter) presses the box's main button.
function setUpEditor(textarea, onRun) {
  textarea.spellcheck = false;
  textarea.setAttribute("autocapitalize", "off");
  textarea.setAttribute("autocomplete", "off");
  fitHeight(textarea);
  textarea.addEventListener("input", () => fitHeight(textarea));
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onRun();
    } else if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      textarea.setRangeText("    ", textarea.selectionStart, textarea.selectionEnd, "end");
      fitHeight(textarea);
    }
  });
}


/* ------------------------------------------------------------------
 * 5. Lesson code boxes (<div class="cell">)
 * ------------------------------------------------------------------ */

document.querySelectorAll(".cell").forEach((cell) => {
  const editor = cell.querySelector("textarea");
  const runButton = cell.querySelector(".run");
  const resetButton = cell.querySelector(".reset");
  const outputArea = cell.querySelector(".output");
  const original = editor.value;

  async function run() {
    if (runButton.disabled) return;
    runButton.disabled = true;
    runButton.textContent = "⏳ Running…";
    const print = makePrinter(outputArea);
    const code = editor.value;
    try {
      const error = toJs(await runInPython(async () => {
        await prepare(code);
        return pyodide.globals.get("run_lesson_code")(code, print);
      }));
      if (error) showError(outputArea, error);
    } catch (err) {
      showError(outputArea, { type: "Problem", text: String(err.message || err) });
    } finally {
      runButton.disabled = false;
      runButton.textContent = "▶ Run";
      if (pyodide) setStatus("✅ Python is ready", "ready");
    }
  }

  setUpEditor(editor, run);
  runButton.addEventListener("click", run);
  editor.addEventListener("input", () => { resetButton.hidden = editor.value === original; });
  resetButton.addEventListener("click", () => {
    editor.value = original;
    fitHeight(editor);
    resetButton.hidden = true;
  });
});

// "Forget variables" button: clears everything the lesson boxes created.
document.getElementById("reset-variables")?.addEventListener("click", async () => {
  await runInPython(async () => pyodide.globals.get("reset_lesson")());
  alert("Done. Python forgot all the variables from this page's code boxes.");
});


/* ------------------------------------------------------------------
 * 6. Progress, saved in this browser
 * ------------------------------------------------------------------
 * Stored as: { "exercise-id": { passed: true, tries: 2, code: "..." }, ... }
 * Browsers can block storage (private windows), so failures are ignored.
 */

const STORAGE_KEY = "pypath-" + document.body.dataset.day;

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
}

const progress = loadProgress();


/* ------------------------------------------------------------------
 * 7. Exercises (<section class="exercise">)
 * ------------------------------------------------------------------ */

const exercises = [...document.querySelectorAll(".exercise")];

function updateScore() {
  const done = exercises.filter((ex) => progress[ex.id]?.passed).length;
  document.getElementById("score-text").textContent = `${done} / ${exercises.length} done`;
  document.getElementById("score-bar").style.width = (done / exercises.length) * 100 + "%";
  document.getElementById("finished").hidden = done !== exercises.length;
}

exercises.forEach((exercise) => {
  const id = exercise.id;
  const editor = exercise.querySelector("textarea");
  const checkButton = exercise.querySelector(".check");
  const startOverButton = exercise.querySelector(".start-over");
  const hintButton = exercise.querySelector(".hint");
  const solutionButton = exercise.querySelector(".show-solution");
  const triesNote = exercise.querySelector(".tries-note");
  const hints = [...exercise.querySelectorAll(".hints li")];
  const outputArea = exercise.querySelector(".output");
  const resultBox = exercise.querySelector(".result");
  const tests = exercise.querySelector(".tests").textContent;
  const solution = exercise.querySelector(".solution").textContent.trim();
  const starter = editor.value;

  const saved = progress[id] || { passed: false, tries: 0 };
  if (saved.code) editor.value = saved.code;

  function refresh() {
    exercise.classList.toggle("passed", saved.passed);
    const solutionUnlocked = saved.passed || saved.tries >= SOLUTION_AFTER_TRIES;
    solutionButton.hidden = !solutionUnlocked;
    const left = SOLUTION_AFTER_TRIES - saved.tries;
    triesNote.hidden = solutionUnlocked || saved.tries === 0;
    triesNote.textContent = `Solution unlocks after ${left} more ${left === 1 ? "try" : "tries"}`;
    updateScore();
  }

  function remember() {
    progress[id] = saved;
    saveProgress(progress);
  }

  function showResult(passed, message) {
    resultBox.hidden = false;
    resultBox.className = "result " + (passed ? "good" : "bad");
    resultBox.textContent = message;
  }

  async function check() {
    if (checkButton.disabled) return;
    checkButton.disabled = true;
    checkButton.textContent = "⏳ Checking…";
    resultBox.hidden = true;
    const print = makePrinter(outputArea);
    const code = editor.value;
    try {
      const result = toJs(await runInPython(async () => {
        await prepare(code + "\n" + tests);
        return pyodide.globals.get("check_exercise")(code, tests, print);
      }));
      saved.tries += 1;
      saved.passed = saved.passed || result.passed;
      saved.code = code;
      remember();
      if (result.passed) showResult(true, "🎉 Correct! Well done.");
      else if (result.error) showError(outputArea, result.error);
      else showResult(false, "🤔 " + result.message);
      refresh();
    } catch (err) {
      showResult(false, "Something went wrong: " + (err.message || err));
    } finally {
      checkButton.disabled = false;
      checkButton.textContent = "✓ Check my answer";
      if (pyodide) setStatus("✅ Python is ready", "ready");
    }
  }

  setUpEditor(editor, check);
  checkButton.addEventListener("click", check);

  editor.addEventListener("input", () => {
    saved.code = editor.value;
    remember();
  });

  startOverButton.addEventListener("click", () => {
    editor.value = starter;
    fitHeight(editor);
    saved.code = starter;
    remember();
  });

  let hintsShown = 0;
  hintButton.addEventListener("click", () => {
    hints[hintsShown].hidden = false;
    hintsShown += 1;
    exercise.querySelector(".hints").hidden = false;
    hintButton.textContent = "💡 Another hint";
    hintButton.hidden = hintsShown === hints.length;
  });

  solutionButton.addEventListener("click", () => {
    const box = exercise.querySelector(".solution-box");
    box.querySelector("pre").textContent = solution;
    box.hidden = false;
    solutionButton.hidden = true;
  });

  exercise.querySelector(".copy-solution").addEventListener("click", () => {
    editor.value = solution;
    fitHeight(editor);
  });

  fitHeight(editor);
  refresh();
});

// "Erase my progress" button at the bottom of the page.
document.getElementById("erase-progress")?.addEventListener("click", () => {
  if (confirm("Erase your answers and progress for this day? This cannot be undone.")) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    location.reload();
  }
});

updateScore();
