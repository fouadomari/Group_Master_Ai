-- =====================================================================
-- 04_dashboard_queries.sql  —  KPI & trend queries for an operations dashboard
-- Created by Master of AI.
-- Tables: patients, clinics, monthly_activity (SQLite ≥ 3.25 for window functions)
-- Realistic training data — aggregate operational planning, not clinical use.
-- =====================================================================

-- 1. KPI tiles
SELECT
    COUNT(*)                                                         AS screened_patients,
    COUNT(DISTINCT clinic_id)                                        AS clinics,
    ROUND(AVG(age), 1)                                               AS mean_age,
    ROUND(100.0 * AVG(CASE WHEN risk_group = 'High' THEN 1.0 ELSE 0 END), 1) AS pct_high_risk_group,
    ROUND(100.0 * AVG(CASE WHEN medication_adherence_pct IS NULL THEN 1.0 ELSE 0 END), 1) AS pct_adherence_missing
FROM patients;

-- 2. Patients screened per month (from the patient-level table)
SELECT STRFTIME('%Y-%m', visit_date) AS month, COUNT(*) AS visits
FROM patients
WHERE visit_date IS NOT NULL
GROUP BY month
ORDER BY month;

-- 3. Monthly activity with month-over-month change (LAG)
SELECT month, screening_visits,
       LAG(screening_visits) OVER (ORDER BY month)                      AS previous_month,
       screening_visits - LAG(screening_visits) OVER (ORDER BY month)   AS change
FROM monthly_activity
ORDER BY month DESC
LIMIT 12;

-- 4. 3-month rolling average (smooths noise for the trend tile)
SELECT month, screening_visits,
       ROUND(AVG(screening_visits) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS rolling_3m
FROM monthly_activity
ORDER BY month;

-- 5. Year-over-year growth (same month last year, LAG 12)
SELECT month, screening_visits,
       LAG(screening_visits, 12) OVER (ORDER BY month) AS same_month_last_year,
       ROUND(100.0 * (screening_visits - LAG(screening_visits, 12) OVER (ORDER BY month))
             / LAG(screening_visits, 12) OVER (ORDER BY month), 1) AS yoy_pct
FROM monthly_activity
ORDER BY month DESC
LIMIT 12;

-- 6. Annual totals with a CTE and running total
WITH yearly AS (
    SELECT SUBSTR(month, 1, 4) AS year,
           SUM(screening_visits)   AS screening,
           SUM(follow_up_requests) AS follow_ups,
           SUM(lab_requests)       AS labs
    FROM monthly_activity
    GROUP BY year
)
SELECT year, screening, follow_ups, labs,
       SUM(screening) OVER (ORDER BY year) AS cumulative_screening,
       ROUND(1.0 * labs / screening, 3)    AS labs_per_screening
FROM yearly
ORDER BY year;

-- 7. Seasonality profile: average volume per calendar month
SELECT SUBSTR(month, 6, 2) AS calendar_month,
       ROUND(AVG(screening_visits), 0) AS avg_screening,
       ROUND(AVG(follow_up_requests), 0) AS avg_follow_up
FROM monthly_activity
GROUP BY calendar_month
ORDER BY calendar_month;

-- 8. Clinic league table (JOIN + window RANK + HAVING)
SELECT c.clinic_name,
       COUNT(*) AS patients,
       ROUND(AVG(p.medication_adherence_pct), 1) AS mean_adherence,
       RANK() OVER (ORDER BY COUNT(*) DESC)      AS volume_rank
FROM patients p
JOIN clinics c ON c.clinic_id = p.clinic_id
GROUP BY c.clinic_name
HAVING COUNT(*) >= 50
ORDER BY volume_rank;

-- 9. Data-quality tile: completeness of key fields in the clean table
SELECT 'bmi' AS field, ROUND(100.0 * COUNT(bmi) / COUNT(*), 1) AS completeness_pct FROM patients
UNION ALL SELECT 'fasting_glucose', ROUND(100.0 * COUNT(fasting_glucose) / COUNT(*), 1) FROM patients
UNION ALL SELECT 'hba1c', ROUND(100.0 * COUNT(hba1c) / COUNT(*), 1) FROM patients
UNION ALL SELECT 'total_cholesterol', ROUND(100.0 * COUNT(total_cholesterol) / COUNT(*), 1) FROM patients
UNION ALL SELECT 'medication_adherence_pct', ROUND(100.0 * COUNT(medication_adherence_pct) / COUNT(*), 1) FROM patients;
