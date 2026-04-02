-- name: CountPlaybooksByAgency :one
SELECT COUNT(*)
FROM playbooks
WHERE agency_id = $1
  AND status <> 'archived';

-- name: ListPlaybooksByAgency :many
SELECT
  p.*,
  COALESCE(u.name, u.email, '') AS owner_name
FROM playbooks p
LEFT JOIN users u
  ON u.id = p.owner_user_id
WHERE p.agency_id = $1
  AND p.status <> 'archived'
ORDER BY p.updated_at DESC, p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetPlaybookByIDAndAgency :one
SELECT *
FROM playbooks
WHERE agency_id = $1
  AND id = $2
  AND status <> 'archived'
LIMIT 1;

-- name: GetPlaybookSummaryByIDAndAgency :one
SELECT
  p.*,
  COALESCE(u.name, u.email, '') AS owner_name
FROM playbooks p
LEFT JOIN users u
  ON u.id = p.owner_user_id
WHERE p.agency_id = $1
  AND p.id = $2
  AND p.status <> 'archived'
LIMIT 1;

-- name: CreatePlaybook :one
INSERT INTO playbooks (
  agency_id,
  name,
  category,
  owner_user_id,
  status,
  body,
  published_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: UpdatePlaybook :one
UPDATE playbooks
SET
  name = $3,
  category = $4,
  status = $5,
  body = $6,
  published_at = $7,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND status <> 'archived'
RETURNING *;
