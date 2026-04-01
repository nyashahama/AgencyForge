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
