-- =====================================================================
-- 02_patient_statistics.sql  —  descriptive statistics in SQL (SQLite)
-- Created by Master of AI.
-- Table: patients (clean, typed). Synthetic educational data only.
-- NULLs are ignored by AVG / MIN / MAX / COUNT(column).
-- =====================================================================

-- 1. COUNT / AVG / MIN / MAX for fasting glucose
SELECT
    COUNT(*)                         AS rows_total,
    COUNT(fasting_glucose)           AS n_glucose,
    ROUND(AVG(fasting_glucose), 2)   AS mean_glucose,
    MIN(fasting_glucose)             AS min_glucose,
    MAX(fasting_glucose)             AS max_glucose,
    MAX(fasting_glucose) - MIN(fasting_glucose) AS range_glucose
FROM patients;

-- 2. Sample variance and standard deviation (SQLite has no STDEV):
--    var = SUM((x - mean)^2) / (n - 1)   -> identical to pandas .var() / .std()
WITH s AS (
    SELECT AVG(fasting_glucose) AS mean_x, COUNT(fasting_glucose) AS n
    FROM patients
)
SELECT
    ROUND(SUM((p.fasting_glucose - s.mean_x) * (p.fasting_glucose - s.mean_x)) / (s.n - 1), 3)        AS sample_variance,
    ROUND(SQRT(SUM((p.fasting_glucose - s.mean_x) * (p.fasting_glucose - s.mean_x)) / (s.n - 1)), 3)  AS sample_sd
FROM patients p, s
WHERE p.fasting_glucose IS NOT NULL;

-- 3. MEDIAN alternative #1: ROW_NUMBER() over the ordered values
WITH ordered AS (
    SELECT fasting_glucose AS x,
           ROW_NUMBER() OVER (ORDER BY fasting_glucose) AS rn,
           COUNT(*)     OVER ()                         AS n
    FROM patients
    WHERE fasting_glucose IS NOT NULL
)
SELECT AVG(x) AS median_glucose
FROM ordered
WHERE rn IN ((n + 1) / 2, (n + 2) / 2);

-- 4. MEDIAN alternative #2: LIMIT / OFFSET
SELECT AVG(bmi) AS median_bmi
FROM (
    SELECT bmi FROM patients
    WHERE bmi IS NOT NULL
    ORDER BY bmi
    LIMIT 2 - (SELECT COUNT(bmi) FROM patients) % 2
    OFFSET (SELECT (COUNT(bmi) - 1) / 2 FROM patients)
);

-- 5. Quartiles with NTILE(4) (approximate: boundaries of each quarter)
WITH q AS (
    SELECT hba1c, NTILE(4) OVER (ORDER BY hba1c) AS quartile
    FROM patients
    WHERE hba1c IS NOT NULL
)
SELECT quartile, COUNT(*) AS n, MIN(hba1c) AS from_value, MAX(hba1c) AS to_value, ROUND(AVG(hba1c), 2) AS mean_value
FROM q
GROUP BY quartile
ORDER BY quartile;

-- 6. Percentile rank of each patient's cholesterol (window function)
SELECT patient_id, total_cholesterol,
       ROUND(PERCENT_RANK() OVER (ORDER BY total_cholesterol), 3) AS percentile_rank
FROM patients
WHERE total_cholesterol IS NOT NULL
ORDER BY total_cholesterol DESC
LIMIT 10;

-- 7. Mode (most frequent value) of exercise days
SELECT exercise_days_per_week AS mode_exercise_days, COUNT(*) AS frequency
FROM patients
WHERE exercise_days_per_week IS NOT NULL
GROUP BY exercise_days_per_week
ORDER BY frequency DESC
LIMIT 1;

-- 8. Summary for several variables in one result (UNION ALL)
SELECT 'age' AS variable, COUNT(age) AS n, ROUND(AVG(age), 2) AS mean, MIN(age) AS min, MAX(age) AS max FROM patients
UNION ALL SELECT 'bmi', COUNT(bmi), ROUND(AVG(bmi), 2), MIN(bmi), MAX(bmi) FROM patients
UNION ALL SELECT 'systolic_bp', COUNT(systolic_bp), ROUND(AVG(systolic_bp), 2), MIN(systolic_bp), MAX(systolic_bp) FROM patients
UNION ALL SELECT 'fasting_glucose', COUNT(fasting_glucose), ROUND(AVG(fasting_glucose), 2), MIN(fasting_glucose), MAX(fasting_glucose) FROM patients
UNION ALL SELECT 'hba1c', COUNT(hba1c), ROUND(AVG(hba1c), 2), MIN(hba1c), MAX(hba1c) FROM patients
UNION ALL SELECT 'total_cholesterol', COUNT(total_cholesterol), ROUND(AVG(total_cholesterol), 2), MIN(total_cholesterol), MAX(total_cholesterol) FROM patients;

-- 9. Tukey outlier fences for glucose using NTILE-based quartiles
WITH q AS (
    SELECT fasting_glucose AS x, NTILE(4) OVER (ORDER BY fasting_glucose) AS quartile
    FROM patients WHERE fasting_glucose IS NOT NULL
), b AS (
    SELECT MAX(CASE WHEN quartile = 1 THEN x END) AS q1,
           MAX(CASE WHEN quartile = 3 THEN x END) AS q3
    FROM q
)
SELECT q1, q3, q3 - q1 AS iqr,
       q1 - 1.5 * (q3 - q1) AS lower_fence,
       q3 + 1.5 * (q3 - q1) AS upper_fence,
       (SELECT COUNT(*) FROM patients, b b2
         WHERE fasting_glucose > b2.q3 + 1.5 * (b2.q3 - b2.q1)) AS high_outliers
FROM b;
