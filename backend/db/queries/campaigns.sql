-- name: ListCampaigns :many
SELECT *
FROM campaigns
ORDER BY created_at DESC;

-- name: GetCampaign :one
SELECT *
FROM campaigns
WHERE id = $1
LIMIT 1;

-- name: CreateCampaign :one
INSERT INTO campaigns (
  client_id,
  brief_id,
  name,
  status,
  budget_cents,
  due_at
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: CreateCampaignFromBrief :one
INSERT INTO campaigns (
  agency_id,
  owner_user_id,
  client_id,
  brief_id,
  name,
  status,
  budget_cents,
  due_at,
  progress_percent,
  risk_level,
  budget_currency,
  deliverable_count
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING *;

-- name: CreateCampaignStatusHistory :one
INSERT INTO campaign_status_history (
  campaign_id,
  from_status,
  to_status,
  changed_by_user_id,
  note
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;
