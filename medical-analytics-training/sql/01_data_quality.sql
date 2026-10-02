-- =====================================================================
-- 01_data_quality.sql  —  profile the RAW extract (SQLite)
-- Created by Master of AI.
-- Lecture 1 · Synthetic educational data only — not for clinical use.
--
-- Setup (either option):
--   python tools/build_sqlite.py          -> outputs/medical_training.db
--   or in the sqlite3 shell:
--     .import --csv data/messy_patient_screening_data.csv patients_raw
--     .import --csv data/clean_patient_screening_data.csv  patients
--     .import --csv data/monthly_clinic_activity.csv       monthly_activity
-- Table patients_raw stores every column as TEXT, exactly as delivered.
-- =====================================================================

-- 1. Row count and completeness of key columns (COUNT + CASE)
SELECT
    COUNT(*)                                                                  AS total_rows,
    SUM(CASE WHEN TRIM(clinic_id) = '' OR UPPER(TRIM(clinic_id)) IN ('NA','N/A','NULL','?') THEN 1 ELSE 0 END) AS missing_clinic_id,
    SUM(CASE WHEN TRIM(bmi) = '' OR UPPER(TRIM(bmi)) IN ('NA','N/A','NULL','?') THEN 1 ELSE 0 END)             AS missing_bmi,
    SUM(CASE WHEN TRIM(fasting_glucose) = '' OR UPPER(TRIM(fasting_glucose)) IN ('NA','N/A','NULL','?') THEN 1 ELSE 0 END) AS missing_glucose,
    SUM(CASE WHEN TRIM(medication_adherence_pct) = '' THEN 1 ELSE 0 END)     AS missing_adherence,
    ROUND(100.0 * SUM(CASE WHEN TRIM(medication_adherence_pct) = '' THEN 1 ELSE 0 END) / COUNT(*), 2) AS missing_adherence_pct
FROM patients_raw;

-- 2. Exact duplicate rows (GROUP BY every column + HAVING)
SELECT patient_id, visit_date, COUNT(*) AS copies
FROM patients_raw
GROUP BY patient_id, visit_date, clinic_id, age, sex, bmi, systolic_bp, diastolic_bp, heart_rate,
         fasting_glucose, hba1c, total_cholesterol, smoking_status, exercise_days_per_week,
         family_history_flag, medication_adherence_pct, visits_last_year, risk_score, risk_group, follow_up_days
HAVING COUNT(*) > 1
ORDER BY copies DESC, patient_id
LIMIT 20;

-- 3. Key-based duplicates after normalising whitespace and case
SELECT UPPER(TRIM(patient_id)) AS patient_key, TRIM(visit_date) AS visit_date, COUNT(*) AS records
FROM patients_raw
GROUP BY UPPER(TRIM(patient_id)), TRIM(visit_date)
HAVING COUNT(*) > 1
ORDER BY records DESC
LIMIT 20;

-- 4. Consistency: every spelling used for "sex"
SELECT sex AS raw_value, LENGTH(sex) AS characters, COUNT(*) AS n
FROM patients_raw
GROUP BY sex
ORDER BY n DESC;

-- 5. Consistency: smoking status codes
SELECT smoking_status AS raw_value, COUNT(*) AS n
FROM patients_raw
GROUP BY smoking_status
ORDER BY n DESC;

-- 6. Format issues: numbers stored with units or symbols
SELECT 'fasting_glucose' AS column_name, fasting_glucose AS example, COUNT(*) OVER () AS rows_with_issue
FROM patients_raw WHERE fasting_glucose LIKE '%mg%' OR fasting_glucose LIKE '%mmol%'
UNION ALL
SELECT 'hba1c', hba1c, COUNT(*) OVER () FROM patients_raw WHERE hba1c LIKE '%\%%' ESCAPE '\'
UNION ALL
SELECT 'systolic_bp', systolic_bp, COUNT(*) OVER () FROM patients_raw WHERE systolic_bp LIKE '%/%'
LIMIT 30;

-- 7. Validity: ages outside the programme range (18-100) or not numeric
SELECT age AS raw_age, COUNT(*) AS n
FROM patients_raw
WHERE TRIM(age) <> ''
  AND (age GLOB '*[^0-9]*' OR CAST(age AS INTEGER) NOT BETWEEN 18 AND 100)
GROUP BY age
ORDER BY n DESC;

-- 8. Validity: negative or impossible vital signs
SELECT patient_id, heart_rate, systolic_bp, exercise_days_per_week, risk_score
FROM patients_raw
WHERE CAST(heart_rate AS REAL) < 30 AND TRIM(heart_rate) NOT IN ('', 'NA', 'N/A', 'null', '?')
   OR CAST(heart_rate AS REAL) > 220
   OR CAST(exercise_days_per_week AS REAL) NOT BETWEEN 0 AND 7 AND TRIM(exercise_days_per_week) NOT IN ('', 'NA', 'N/A', 'null', '?')
   OR (CAST(risk_score AS REAL) > 100 OR CAST(risk_score AS REAL) < 0)
ORDER BY patient_id;

-- 9. Timeliness / validity of dates: anything that is not ISO YYYY-MM-DD
SELECT visit_date, COUNT(*) AS n
FROM patients_raw
WHERE visit_date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
   OR DATE(visit_date) IS NULL
   OR DATE(visit_date) > '2024-12-31'
GROUP BY visit_date
ORDER BY n DESC
LIMIT 25;
