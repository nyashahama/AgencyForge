-- name: GetAnalyticsOverview :one
SELECT
  COALESCE((
    SELECT COUNT(*)::bigint
    FROM campaigns cm
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND cm.status NOT IN ('approved', 'cancelled')
  ), 0)::bigint AS live_campaigns,
  COALESCE((
    SELECT COUNT(*)::bigint
    FROM campaigns cm
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND cm.status = 'review'
  ), 0)::bigint AS reviews_due,
  COALESCE((
    SELECT COUNT(*)::bigint
    FROM briefs b
    WHERE b.agency_id = $1
      AND b.status <> 'archived'
  ), 0)::bigint AS briefs_processed,
  COALESCE((
    SELECT COUNT(*)::bigint
    FROM clients c
    WHERE c.agency_id = $1
      AND c.archived_at IS NULL
  ), 0)::bigint AS active_clients,
  COALESCE((
    SELECT ROUND(AVG(cm.progress_percent)::numeric, 0)::bigint
    FROM campaigns cm
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
  ), 0)::bigint AS avg_completion_percent,
  COALESCE((
    SELECT COUNT(DISTINCT ca.specialist_id)::bigint
    FROM campaign_assignments ca
    JOIN campaigns cm
      ON cm.id = ca.campaign_id
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ca.status IN ('queued', 'active', 'blocked')
  ), 0)::bigint AS active_specialists,
  COALESCE((
    SELECT COUNT(*)::bigint
    FROM campaign_approvals ap
    JOIN campaigns cm
      ON cm.id = ap.campaign_id
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ap.status = 'pending'
  ), 0)::bigint AS pending_approvals,
  COALESCE((
    SELECT ROUND(
      (SUM(CASE WHEN ap.status = 'approved' THEN 1 ELSE 0 END)::numeric * 100.0)
      / NULLIF(COUNT(*)::numeric, 0),
      1
    )::double precision
    FROM campaign_approvals ap
    JOIN campaigns cm
      ON cm.id = ap.campaign_id
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
  ), 0)::double precision AS approval_rate,
  COALESCE((
    SELECT ROUND(
      AVG(EXTRACT(EPOCH FROM (ap.responded_at - ap.requested_at)))::numeric / 86400.0,
      1
    )::double precision
    FROM campaign_approvals ap
    JOIN campaigns cm
      ON cm.id = ap.campaign_id
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ap.responded_at IS NOT NULL
  ), 0)::double precision AS approval_latency_days,
  COALESCE((
    SELECT ROUND(
      AVG(EXTRACT(EPOCH FROM (cm.approved_at - b.created_at)))::numeric / 86400.0,
      1
    )::double precision
    FROM campaigns cm
    JOIN briefs b
      ON b.id = cm.brief_id
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND cm.approved_at IS NOT NULL
  ), 0)::double precision AS avg_turnaround_days;

-- name: ListAnalyticsThroughputByDay :many
WITH days AS (
  SELECT generate_series(
    date_trunc('day', sqlc.arg(start_at)::timestamptz),
    date_trunc('day', sqlc.arg(end_at)::timestamptz),
    interval '1 day'
  ) AS day_bucket
),
approved_counts AS (
  SELECT
    date_trunc('day', csh.created_at) AS day_bucket,
    COUNT(DISTINCT csh.campaign_id)::bigint AS campaigns
  FROM campaign_status_history csh
  JOIN campaigns cm
    ON cm.id = csh.campaign_id
  WHERE cm.agency_id = sqlc.arg(agency_id)
    AND cm.archived_at IS NULL
    AND csh.to_status = 'approved'
    AND csh.created_at >= date_trunc('day', sqlc.arg(start_at)::timestamptz)
    AND csh.created_at < date_trunc('day', sqlc.arg(end_at)::timestamptz) + interval '1 day'
  GROUP BY 1
)
SELECT
  days.day_bucket::timestamptz AS day_bucket,
  to_char(days.day_bucket, 'Mon DD') AS day_label,
  COALESCE(approved_counts.campaigns, 0)::bigint AS campaigns
FROM days
LEFT JOIN approved_counts
  ON approved_counts.day_bucket = days.day_bucket
ORDER BY days.day_bucket ASC;

-- name: ListSpecialistUtilizationByAgency :many
SELECT
  s.id,
  s.name,
  s.code,
  s.specialty_type,
  COALESCE(COUNT(ca.id) FILTER (
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ca.status IN ('queued', 'active', 'blocked')
  ), 0)::bigint AS open_assignment_count,
  COALESCE(COUNT(ca.id) FILTER (
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ca.status = 'blocked'
  ), 0)::bigint AS blocked_assignment_count,
  COALESCE(COUNT(DISTINCT ca.campaign_id) FILTER (
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ca.status IN ('queued', 'active', 'blocked')
  ), 0)::bigint AS active_campaign_count,
  COALESCE(SUM(ca.load_units) FILTER (
    WHERE cm.agency_id = $1
      AND cm.archived_at IS NULL
      AND ca.status IN ('queued', 'active', 'blocked')
  ), 0)::bigint AS load_units
FROM specialists s
LEFT JOIN campaign_assignments ca
  ON ca.specialist_id = s.id
LEFT JOIN campaigns cm
  ON cm.id = ca.campaign_id
GROUP BY s.id, s.name, s.code, s.specialty_type
ORDER BY load_units DESC, s.name ASC;

-- name: ListCampaignStatusCountsByAgency :many
SELECT
  status,
  COUNT(*)::bigint AS campaign_count
FROM campaigns
WHERE agency_id = $1
  AND archived_at IS NULL
GROUP BY status
ORDER BY status ASC;
