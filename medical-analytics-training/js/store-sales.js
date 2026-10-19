/* =====================================================================
   store-sales.js — reads the Kaggle "Store Sales" CSV files in the
   browser and computes the same results as the Python code shown in
   Lecture 2 (Data Analysis with Python).
   Created by Master of AI.

   • The files never leave the viewer's computer: they are read with the
     File API, streamed line by line, and only a small summary is kept.
   • This is a JavaScript re-implementation of the pandas steps (read_csv,
     isnull, duplicated, to_datetime, merge, groupby, resample, quantile).
     Python itself does not run in the page.
   • The summary is remembered in this browser (localStorage) so every
     section can show it after a page reload.
   ===================================================================== */
const StoreSales = (() => {
  const KEY = "mat-store-sales-v1";
  const REQUIRED = {
    train: ["id", "date", "store_nbr", "family", "sales", "onpromotion"],
    stores: ["store_nbr", "city", "state", "type", "cluster"],
  };
  // pandas.read_csv default missing-value markers
  const NA = new Set(["", "#N/A", "#N/A N/A", "#NA", "-1.#IND", "-1.#QNAN", "-NaN", "-nan", "1.#IND", "1.#QNAN", "<NA>", "N/A", "NA", "NULL", "NaN", "None", "n/a", "nan", "null"]);
  const INT_RE = /^[+-]?\d+$/, NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  let R = null, job = null;
  const subs = new Set();
  try { const raw = localStorage.getItem(KEY); if (raw) R = JSON.parse(raw); if (R && R.version !== 1) R = null; } catch (e) { R = null; }

  /* ---------- CSV helpers ---------- */
  function splitLine(line) {
    if (line.indexOf('"') < 0) return line.split(",");
    const out = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  }
  const isNA = v => NA.has(v);
  const num = v => (NUM_RE.test(v) ? parseFloat(v) : NaN);
  function keyOf(v) { if (isNA(v)) return null; const t = v.trim(); return NUM_RE.test(t) ? String(parseFloat(t)) : t; }
  function parseDate(v) {
    if (isNA(v)) return null;
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/), y, mo, d;
    if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
    else if ((m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [mo, d, y] = [+m[1], +m[2], +m[3]];   // pandas default: month first
    else return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, y, m: mo, dow: (dt.getUTCDay() + 6) % 7 };
  }
  // 53-bit string hash (cyrb53) — used to find exact duplicate rows without keeping every row
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* growable Float64Array */
  function Grow(cap) { this.a = new Float64Array(Math.max(1024, cap)); this.n = 0; }
  Grow.prototype.push = function (v) { if (this.n === this.a.length) { const b = new Float64Array(this.a.length * 2); b.set(this.a); this.a = b; } this.a[this.n++] = v; };
  Grow.prototype.view = function () { return this.a.subarray(0, this.n); };

  /* per-column profile, mirroring df.info() / df.describe(include="all").
     Numeric values are kept as a frequency table while there are few distinct values
     (store_nbr, onpromotion) and as a plain array otherwise (id, sales). */
  function ColProfile(name, cap) { this.name = name; this.cap = cap; this.nonNull = 0; this.isInt = true; this.isNum = true; this.freq = new Map(); this.arr = null; this.counts = new Map(); this.countsCapped = false; }
  ColProfile.prototype.add = function (v) {
    if (isNA(v)) return;
    this.nonNull++;
    if (this.isNum) {
      if (NUM_RE.test(v)) {
        if (this.isInt && !INT_RE.test(v)) this.isInt = false;
        const x = parseFloat(v);
        if (this.arr) this.arr.push(x);
        else { this.freq.set(x, (this.freq.get(x) || 0) + 1); if (this.freq.size > 20000) { this.arr = new Grow(this.cap); this.freq.forEach((c, val) => { for (let i = 0; i < c; i++) this.arr.push(val); }); this.freq = null; } }
        return;
      }
      // first non-numeric value: the column is text (object) from now on
      this.isNum = false;
      if (this.freq) this.freq.forEach((c, val) => this.counts.set(String(val), c)); else this.countsCapped = true;
      this.freq = null; this.arr = null;
    }
    if (!this.countsCapped) { this.counts.set(v, (this.counts.get(v) || 0) + 1); if (this.counts.size > 200000) { this.countsCapped = true; this.counts = new Map(); } }
  };
  /* a sorted numeric column, either as an array or as (value, count) pairs */
  function Sorted(p) {
    if (p.arr) { const a = p.arr.view(); a.sort(); this.n = a.length; this.at = i => a[i]; this.each = fn => { for (let i = 0; i < a.length; i++) fn(a[i], 1); }; return; }
    const keys = [...p.freq.keys()].sort((x, y) => x - y), cum = []; let c = 0;
    keys.forEach(k => { c += p.freq.get(k); cum.push(c); });
    this.n = c;
    this.at = i => { let lo = 0, hi = cum.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] > i) hi = mid; else lo = mid + 1; } return keys[lo]; };
    this.each = fn => keys.forEach(k => fn(k, p.freq.get(k)));
  }
  // linear interpolation between order statistics, like pandas Series.quantile()
  Sorted.prototype.q = function (q) { if (!this.n) return NaN; const pos = (this.n - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos); const a = this.at(lo), b = this.at(hi); return a + (b - a) * (pos - lo); };
  function finishProfile(p, rows) {
    const missing = rows - p.nonNull;
    const dtype = p.isNum && p.nonNull ? (p.isInt && missing === 0 ? "int64" : "float64") : p.nonNull ? "object" : "float64";
    const d = { column: p.name, nonNull: p.nonNull, missing, dtype };
    if (dtype === "object") {
      let top = null, freq = 0;
      p.counts.forEach((c, v) => { if (c > freq) { freq = c; top = v; } });
      Object.assign(d, { count: p.nonNull, unique: p.countsCapped ? null : p.counts.size, top: p.countsCapped ? null : top, freq: p.countsCapped ? null : freq });
    } else if (p.nonNull) {
      const s = new Sorted(p);
      let sum = 0; s.each((v, c) => { sum += v * c; });
      const mean = sum / s.n; let ss = 0; s.each((v, c) => { ss += c * (v - mean) ** 2; });
      Object.assign(d, { count: s.n, mean, std: s.n > 1 ? Math.sqrt(ss / (s.n - 1)) : NaN, min: s.at(0), q1: s.q(.25), median: s.q(.5), q3: s.q(.75), max: s.at(s.n - 1) });
      p.sorted = s;
    } else Object.assign(d, { count: 0 });
    return d;
  }

  /* ---------- reading ---------- */
  async function readLines(file, onLine, onProgress, signal) {
    const reader = file.stream().getReader(), dec = new TextDecoder("utf-8");
    let rest = "", done = 0, lastTick = 0;
    for (;;) {
      if (signal.cancelled) { try { reader.cancel(); } catch (e) { /* ignore */ } throw new Error("cancelled"); }
      const { value, done: end } = await reader.read();
      if (end) break;
      done += value.length;
      const text = rest + dec.decode(value, { stream: true });
      const lines = text.split("\n");
      rest = lines.pop();
      for (let i = 0; i < lines.length; i++) onLine(lines[i].endsWith("\r") ? lines[i].slice(0, -1) : lines[i]);
      if (done - lastTick > 2e6) { lastTick = done; onProgress(done / file.size); await new Promise(r => setTimeout(r, 0)); }
    }
    rest += dec.decode();
    if (rest.length) onLine(rest.endsWith("\r") ? rest.slice(0, -1) : rest);
    onProgress(1);
  }
  function headerCheck(name, header, required) {
    const missing = required.filter(c => !header.includes(c));
    if (missing.length) throw new Error(L(`${name} is missing the column(s): ${missing.join(", ")}. Columns found: ${header.join(", ") || "(none)"}. Check that you chose the right file.`,
      `ينقص الملف ${name} العمود (الأعمدة): ${missing.join(", ")}. الأعمدة الموجودة: ${header.join(", ") || "(لا شيء)"}. تحقّق من أنك اخترت الملف الصحيح.`));
  }

  async function parseStores(file, signal) {
    let header = null, rows = 0, bad = 0; const profs = [], raw = [], seen = new Map(), head = [];
    await readLines(file, line => {
      if (header === null) { header = splitLine(line.replace(/^﻿/, "")).map(h => h.trim()); header.forEach(h => profs.push(new ColProfile(h, 64))); return; }
      if (line === "") return;
      const f = splitLine(line);
      if (f.length !== header.length) { bad++; return; }
      rows++; f.forEach((v, j) => profs[j].add(v)); raw.push(f);
      const h = hash(line); seen.set(h, (seen.get(h) || 0) + 1);
      if (head.length < 5) head.push(f);
    }, () => {}, signal);
    if (!header) throw new Error(L(`${file.name} is empty.`, `الملف ${file.name} فارغ.`));
    headerCheck(file.name, header, REQUIRED.stores);
    const col = c => header.indexOf(c);
    const info = profs.map(p => finishProfile(p, rows));
    let dupRows = 0; seen.forEach(c => { dupRows += c - 1; });
    const byKey = new Map();
    raw.forEach(f => { const k = keyOf(f[col("store_nbr")]); if (k === null) return; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(f); });
    const dupKeyList = [...byKey.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => ({ key: k, count: v.length }));
    const nullKeys = raw.filter(f => keyOf(f[col("store_nbr")]) === null).length;
    const dupKeys = raw.length - byKey.size - (nullKeys ? 1 : 0);   // like stores["store_nbr"].duplicated().sum()
    const attr = (f, c) => (isNA(f[col(c)]) ? null : f[col(c)]);
    const meta = new Map();
    byKey.forEach((list, k) => meta.set(k, { city: attr(list[0], "city"), state: attr(list[0], "state"), type: attr(list[0], "type"), cluster: attr(list[0], "cluster"), copies: list.length }));
    return { name: file.name, size: file.size, rows, cols: header, head, info, dupRows, dupKeys, dupKeyList, badLines: bad, meta };
  }

  async function parseTrain(file, stores, signal, onProgress) {
    let header = null, ix = {}, rows = 0, bad = 0;
    const est = Math.ceil(file.size / 38);
    let profs = [];
    const hashes = new Grow(est);
    const dates = new Map();          // date string -> parsed or null
    const keyRows = new Map();        // store key -> train rows
    const byStore = new Map(), byFamily = new Map(), monthly = new Map(), dow = new Array(7).fill(0), moy = new Array(12).fill(0);
    const head = [];
    let invalidDates = 0, negSales = 0, negPromo = 0, zeros = 0;
    let sN = 0, sMean = 0, sM2 = 0, sMin = Infinity, sMax = -Infinity;
    let pN = 0, mx = 0, my = 0, cxy = 0, m2x = 0, m2y = 0, noPromoSum = 0, noPromoN = 0, promoSum = 0, promoN = 0;
    const SAMPLE = 5000, sample = [], rand = rng(42);
    let seenPairs = 0;
    await readLines(file, line => {
      if (header === null) {
        header = splitLine(line.replace(/^﻿/, "")).map(h => h.trim());
        headerCheck(file.name, header, REQUIRED.train);
        header.forEach(h => { ix[h] = header.indexOf(h); });
        profs = header.map(h => new ColProfile(h, est));
        return;
      }
      if (line === "") return;
      const f = splitLine(line);
      if (f.length !== header.length) { bad++; return; }
      rows++;
      for (let j = 0; j < f.length; j++) profs[j].add(f[j]);
      hashes.push(hash(line));
      if (head.length < 5) head.push(f);
      const ds = f[ix.date];
      let di = dates.get(ds);
      if (di === undefined) { di = parseDate(ds); dates.set(ds, di); }
      if (!di) invalidDates++;
      const s = num(f[ix.sales]), p = num(f[ix.onpromotion]);
      const k = keyOf(f[ix.store_nbr]), fam = isNA(f[ix.family]) ? null : f[ix.family];
      keyRows.set(k, (keyRows.get(k) || 0) + 1);
      let st = byStore.get(k);
      if (!st) { st = { sum: 0, cnt: 0, rows: 0, sumValid: 0, days: new Set() }; byStore.set(k, st); }
      st.rows++;
      if (di) st.days.add(di.iso);
      if (!Number.isNaN(s)) {
        st.sum += s; st.cnt++;
        if (di) st.sumValid += s;
        if (fam !== null) { let fm = byFamily.get(fam); if (!fm) { fm = { sum: 0, cnt: 0 }; byFamily.set(fam, fm); } fm.sum += s; fm.cnt++; }
        if (di) { const ym = di.iso.slice(0, 7); monthly.set(ym, (monthly.get(ym) || 0) + s); dow[di.dow] += s; moy[di.m - 1] += s; }
        sN++; const dl = s - sMean; sMean += dl / sN; sM2 += dl * (s - sMean);
        if (s < sMin) sMin = s; if (s > sMax) sMax = s;
        if (s < 0) negSales++; if (s === 0) zeros++;
        if (!Number.isNaN(p)) {
          pN++; const dx = p - mx; mx += dx / pN; const dy = s - my; my += dy / pN; cxy += dx * (s - my); m2x += dx * (p - mx); m2y += dy * (s - my);
          if (p > 0) { promoSum += s; promoN++; } else { noPromoSum += s; noPromoN++; }
          seenPairs++;
          if (sample.length < SAMPLE) sample.push([p, s]);
          else { const r = Math.floor(rand() * seenPairs); if (r < SAMPLE) sample[r] = [p, s]; }
        }
      }
      if (!Number.isNaN(p) && p < 0) negPromo++;
    }, onProgress, signal);
    if (!header) throw new Error(L(`${file.name} is empty.`, `الملف ${file.name} فارغ.`));

    const info = profs.map(p => finishProfile(p, rows));
    // duplicate rows (exact, based on each row's text)
    const hv = hashes.view(); hv.sort(); let dupRows = 0; for (let i = 1; i < hv.length; i++) if (hv[i] === hv[i - 1]) dupRows++;
    const validDates = [...dates.values()].filter(Boolean).map(d => d.iso).sort();
    const datesPerDow = new Array(7).fill(0), datesPerMoy = new Array(12).fill(0);
    new Set(validDates).forEach(iso => { const d = parseDate(iso); datesPerDow[d.dow]++; datesPerMoy[d.m - 1]++; });

    // sales statistics + IQR fences
    const sv = profs[ix.sales].sorted;
    if (!sv) throw new Error(L(`The sales column in ${file.name} is not numeric, so sums and averages cannot be calculated. Check the file for text values in that column.`, `عمود sales في ${file.name} ليس رقميًا، لذا لا يمكن حساب المجاميع والمتوسطات. افحص الملف بحثًا عن قيم نصية في هذا العمود.`));
    const q1 = sv.q(.25), q3 = sv.q(.75), iqr = q3 - q1;
    const countOutside = (lo, hi) => { let a = 0, b = 0; sv.each((v, c) => { if (v < lo) a += c; else if (v > hi) b += c; }); return { low: a, high: b, count: a + b }; };
    const fence = kk => { const lo = q1 - kk * iqr, hi = q3 + kk * iqr; return { k: kk, lower: lo, upper: hi, ...countOutside(lo, hi) }; };
    // histogram with numpy-style bins (50 equal-width bins from min to max)
    const BINS = 50, counts = new Array(BINS).fill(0), w = (sMax - sMin) / BINS || 1;
    sv.each((v, c) => { let b = Math.floor((v - sMin) / w); if (b >= BINS) b = BINS - 1; counts[b] += c; });

    // merge arithmetic: m_k = copies of key k in stores
    const copies = k => (k !== null && stores.meta.has(k) ? stores.meta.get(k).copies : 0);
    let left = 0, inner = 0, leftOnly = 0, missingCity = 0, missingType = 0;
    const unmatchedTrain = [];
    keyRows.forEach((n, k) => {
      const m = copies(k);
      left += n * Math.max(1, m); inner += n * m;
      if (!m) { leftOnly += n; missingCity += n; missingType += n; unmatchedTrain.push({ key: k, rows: n }); }
      else { const mt = stores.meta.get(k); if (mt.city === null) missingCity += n * m; if (mt.type === null) missingType += n * m; }
    });
    let rightOnlyRows = 0; const unmatchedStores = [];
    stores.meta.forEach((mt, k) => { if (!keyRows.has(k)) { rightOnlyRows += mt.copies; unmatchedStores.push({ key: k, copies: mt.copies }); } });
    const merge = { valid: stores.dupKeyList.length === 0, trainRows: rows, storesRows: stores.rows, left, inner, right: inner + rightOnlyRows, outer: left + rightOnlyRows, both: inner, leftOnly, rightOnly: rightOnlyRows, missingCity, missingType, unmatchedTrain, unmatchedStores };

    // group-bys (train side + store attributes; groupby drops missing keys)
    const storeRows = [...byStore.entries()].filter(([k]) => k !== null).map(([k, v]) => {
      const mt = stores.meta.get(k) || {};
      return { store: k, city: mt.city ?? null, state: mt.state ?? null, type: mt.type ?? null, cluster: mt.cluster ?? null, total: v.sum, mean: v.cnt ? v.sum / v.cnt : NaN, count: v.cnt, rows: v.rows, storeDays: v.days.size, totalValid: v.sumValid, avgDaily: v.days.size ? v.sumValid / v.days.size : NaN };
    }).sort((a, b) => b.total - a.total);
    const groupBy = attr => {
      const g = new Map();
      storeRows.forEach(s => { if (s[attr] === null || !stores.meta.has(s.store)) return; const m = stores.meta.get(s.store).copies; let o = g.get(s[attr]); if (!o) { o = { key: s[attr], total: 0, cnt: 0, stores: 0, storeDays: 0, totalValid: 0 }; g.set(s[attr], o); } o.total += s.total * m; o.cnt += s.count * m; o.stores++; o.storeDays += s.storeDays * m; o.totalValid += s.totalValid * m; });
      return [...g.values()].map(o => ({ ...o, mean: o.cnt ? o.total / o.cnt : NaN, avgDaily: o.storeDays ? o.totalValid / o.storeDays : NaN })).sort((a, b) => b.total - a.total);
    };
    const famRows = [...byFamily.entries()].map(([k, v]) => ({ family: k, total: v.sum, mean: v.cnt ? v.sum / v.cnt : NaN, count: v.cnt })).sort((a, b) => b.total - a.total);
    // monthly / yearly with empty periods filled (resample fills gaps with 0)
    const months = [...monthly.keys()].sort(), monthlyArr = [];
    if (months.length) {
      let [y, m] = months[0].split("-").map(Number); const [ye, me] = months[months.length - 1].split("-").map(Number);
      while (y < ye || (y === ye && m <= me)) { const k = `${y}-${String(m).padStart(2, "0")}`; monthlyArr.push([k, monthly.get(k) || 0]); m++; if (m > 12) { m = 1; y++; } }
    }
    const years = new Map(); monthlyArr.forEach(([k, v]) => { const y = k.slice(0, 4); years.set(y, (years.get(y) || 0) + v); });
    const dateMin = validDates[0] || null, dateMax = validDates[validDates.length - 1] || null;
    const yearly = [...years.entries()].map(([y, v]) => {
      const first = validDates.find(d => d.startsWith(y)), last = [...validDates].reverse().find(d => d.startsWith(y));
      return { year: y, total: v, first, last, partial: first !== `${y}-01-01` || last !== `${y}-12-31` };
    });
    const r = pN > 1 && m2x > 0 && m2y > 0 ? cxy / Math.sqrt(m2x * m2y) : NaN;

    return {
      train: { name: file.name, size: file.size, rows, cols: header, head, info, dupRows, badLines: bad, invalidDates, dateMin, dateMax, distinctDates: new Set(validDates).size, negSales, negPromo },
      merge, byStore: storeRows, byFamily: famRows, byCity: groupBy("city"), byType: groupBy("type"),
      monthly: monthlyArr, yearly,
      weekday: DAY_NAMES.map((n, i) => ({ day: n, total: dow[i], dates: datesPerDow[i], avg: datesPerDow[i] ? dow[i] / datesPerDow[i] : NaN })),
      monthOfYear: moy.map((v, i) => ({ month: i + 1, total: v, dates: datesPerMoy[i], avg: datesPerMoy[i] ? v / datesPerMoy[i] : NaN })),
      stats: { count: sN, mean: sN ? sMean : NaN, median: sv.q(.5), std: sN > 1 ? Math.sqrt(sM2 / (sN - 1)) : NaN, min: sN ? sMin : NaN, max: sN ? sMax : NaN, q1, q3, iqr, zeros, negatives: negSales, fences: [fence(1.5), fence(3)] },
      hist: { min: sMin, max: sMax, counts },
      promo: { n: pN, r, meanNoPromo: noPromoN ? noPromoSum / noPromoN : NaN, nNoPromo: noPromoN, meanPromo: promoN ? promoSum / promoN : NaN, nPromo: promoN, sample, sampleSize: sample.length },
    };
  }

  /* ---------- public API ---------- */
  function notify() { subs.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
  async function run(trainFile, storesFile) {
    if (job) return;
    const signal = { cancelled: false };
    job = { phase: "stores", pct: 0, signal, error: null };
    notify();
    try {
      if (!trainFile || !storesFile) throw new Error(L("Choose both files: train.csv and stores.csv.", "اختر الملفين كليهما: train.csv و stores.csv."));
      const stores = await parseStores(storesFile, signal);
      job.phase = "train"; notify();
      const t = await parseTrain(trainFile, stores, signal, pct => { job.pct = pct; notify(); });
      const { meta, ...storesOut } = stores;
      R = { version: 1, loadedAt: new Date().toISOString(), stores: storesOut, ...t };
      try { localStorage.setItem(KEY, JSON.stringify(R)); R.saved = true; } catch (e) { R.saved = false; }
      job = null;
    } catch (e) {
      const msg = e && e.message === "cancelled" ? null : (e && e.message) || String(e);
      job = msg ? { error: msg } : null;
    }
    notify();
  }
  function clear() { R = null; job = null; try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } notify(); }
  return {
    REQUIRED, DAY_NAMES,
    get result() { return R; }, get job() { return job; },
    run, clear, cancel() { if (job && job.signal) job.signal.cancelled = true; },
    dismissError() { if (job && job.error) { job = null; notify(); } },
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    // exposed for tests
    _splitLine: splitLine, _parseDate: parseDate,
  };
})();
