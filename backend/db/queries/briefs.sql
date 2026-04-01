-- name: ListBriefs :many
SELECT *
FROM briefs
ORDER BY created_at DESC;

-- name: GetBrief :one
SELECT *
FROM briefs
WHERE id = $1
LIMIT 1;

-- name: CreateBrief :one
INSERT INTO briefs (
  client_id,
  title,
  channel,
  status,
  pages,
  owner_email
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING *;
