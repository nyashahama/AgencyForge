-- name: CreateActivityEvent :one
INSERT INTO activity_events (
  agency_id,
  actor_user_id,
  client_id,
  brief_id,
  campaign_id,
  portal_id,
  event_type,
  subject_type,
  subject_id,
  message,
  metadata,
  occurred_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING *;
