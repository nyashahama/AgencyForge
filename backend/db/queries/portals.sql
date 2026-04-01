-- name: ListPortals :many
SELECT *
FROM portals
ORDER BY created_at DESC;

-- name: GetPortal :one
SELECT *
FROM portals
WHERE id = $1
LIMIT 1;

-- name: CreatePortal :one
INSERT INTO portals (
  client_id,
  name,
  theme,
  review_mode,
  share_state
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;
