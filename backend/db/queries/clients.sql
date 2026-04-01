-- name: ListClients :many
SELECT *
FROM clients
ORDER BY created_at DESC;

-- name: GetClient :one
SELECT *
FROM clients
WHERE id = $1
LIMIT 1;

-- name: CreateClient :one
INSERT INTO clients (
  name,
  slug,
  lead_email,
  health,
  notes
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;
