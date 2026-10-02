-- =====================================================================
-- 03_group_analysis.sql  —  GROUP BY, CASE, HAVING, JOIN, CTE (SQLite)
-- Created by Master of AI.
-- Tables: patients, clinics. Realistic training data.
-- Group differences are DESCRIPTIVE; use statistical tests (Section 13)
-- before claiming a difference is supported by evidence.
-- =====================================================================

-- 1. Measurements by teaching risk group
SELECT risk_group,
       COUNT(*)                          AS patients,
       ROUND(AVG(age), 1)                AS mean_age,
       ROUND(AVG(bmi), 1)                AS mean_bmi,
       ROUND(AVG(fasting_glucose), 1)    AS mean_glucose,
       ROUND(AVG(hba1c), 2)              AS mean_hba1c,
       ROUND(AVG(systolic_bp), 1)        AS mean_sbp
FROM patients
GROUP BY risk_group
ORDER BY CASE risk_group WHEN 'Low' THEN 1 WHEN 'Moderate' THEN 2 ELSE 3 END;

-- 2. CASE: derive BMI categories, then group (teaching cut-offs)
SELECT CASE
           WHEN bmi IS NULL THEN 'Missing'
           WHEN bmi < 18.5  THEN 'Underweight'
           WHEN bmi < 25    THEN 'Normal'
           WHEN bmi < 30    THEN 'Overweight'
           ELSE 'Obese'
       END AS bmi_category,
       COUNT(*) AS patients,
       ROUND(AVG(fasting_glucose), 1) AS mean_glucose
FROM patients
GROUP BY bmi_category
ORDER BY patients DESC;

-- 3. WHERE + GROUP BY + HAVING: age bands with at least 100 patients
SELECT CASE
           WHEN age < 35 THEN '18-34'
           WHEN age < 50 THEN '35-49'
           WHEN age < 65 THEN '50-64'
           ELSE '65+'
       END AS age_group,
       COUNT(*) AS patients,
       ROUND(AVG(systolic_bp), 1) AS mean_sbp
FROM patients
WHERE age IS NOT NULL
GROUP BY age_group
HAVING COUNT(*) >= 100
ORDER BY age_group;

-- 4. Smoking status x risk group (contingency table with conditional aggregation)
SELECT smoking_status,
       SUM(CASE WHEN risk_group = 'Low'      THEN 1 ELSE 0 END) AS low,
       SUM(CASE WHEN risk_group = 'Moderate' THEN 1 ELSE 0 END) AS moderate,
       SUM(CASE WHEN risk_group = 'High'     THEN 1 ELSE 0 END) AS high,
       ROUND(100.0 * SUM(CASE WHEN risk_group = 'High' THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_high
FROM patients
WHERE smoking_status IS NOT NULL
GROUP BY smoking_status;

-- 5. JOIN: clinic reference data + patient measurements
SELECT c.clinic_id, c.clinic_name, c.region,
       COUNT(p.patient_id)              AS patients,
       ROUND(AVG(p.fasting_glucose), 1) AS mean_glucose,
       ROUND(100.0 * AVG(CASE WHEN p.risk_group = 'High' THEN 1.0 ELSE 0 END), 1) AS pct_high_risk
FROM clinics c
LEFT JOIN patients p ON p.clinic_id = c.clinic_id
GROUP BY c.clinic_id, c.clinic_name, c.region
ORDER BY c.clinic_id;

-- 6. Regional view: JOIN + GROUP BY on the joined attribute
SELECT c.region, COUNT(*) AS patients, ROUND(AVG(p.bmi), 1) AS mean_bmi
FROM patients p
JOIN clinics c ON c.clinic_id = p.clinic_id
GROUP BY c.region
ORDER BY patients DESC;

-- 7. CTE: compare each clinic with the overall mean glucose
WITH overall AS (
    SELECT AVG(fasting_glucose) AS mean_all FROM patients
), clinic_stats AS (
    SELECT clinic_id, COUNT(*) AS n, AVG(fasting_glucose) AS mean_clinic
    FROM patients
    WHERE clinic_id IS NOT NULL
    GROUP BY clinic_id
)
SELECT cs.clinic_id, cs.n,
       ROUND(cs.mean_clinic, 1)                 AS mean_glucose,
       ROUND(cs.mean_clinic - o.mean_all, 1)    AS difference_vs_overall
FROM clinic_stats cs CROSS JOIN overall o
ORDER BY difference_vs_overall DESC;

-- 8. Window function inside groups: rank patients by HbA1c within each clinic
SELECT clinic_id, patient_id, hba1c, rank_in_clinic
FROM (
    SELECT clinic_id, patient_id, hba1c,
           RANK() OVER (PARTITION BY clinic_id ORDER BY hba1c DESC) AS rank_in_clinic
    FROM patients
    WHERE hba1c IS NOT NULL AND clinic_id IS NOT NULL
)
WHERE rank_in_clinic <= 3
ORDER BY clinic_id, rank_in_clinic;

-- 9. Share of each risk group within each clinic (window SUM over partition)
SELECT clinic_id, risk_group, COUNT(*) AS n,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY clinic_id), 1) AS pct_of_clinic
FROM patients
WHERE clinic_id IS NOT NULL
GROUP BY clinic_id, risk_group
ORDER BY clinic_id, risk_group;
