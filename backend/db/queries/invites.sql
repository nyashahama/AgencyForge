-- name: ListInvitesByAgency :many
SELECT
  oi.id,
  oi.agency_id,
  oi.email,
  oi.role,
  oi.token_hash,
  oi.invited_by_user_id,
  oi.accepted_at,
  oi.revoked_at,
  oi.expires_at,
  oi.created_at,
  u.name AS invited_by_name
FROM operator_invites oi
JOIN users u
  ON u.id = oi.invited_by_user_id
WHERE oi.agency_id = $1
ORDER BY oi.created_at DESC;

-- name: CreateInvite :one
INSERT INTO operator_invites (
  agency_id,
  email,
  role,
  token_hash,
  invited_by_user_id,
  expires_at
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetInviteByIDAndAgency :one
SELECT *
FROM operator_invites
WHERE id = $1
  AND agency_id = $2
LIMIT 1;

-- name: GetInviteByTokenHash :one
SELECT *
FROM operator_invites
WHERE token_hash = $1
LIMIT 1;

-- name: UpdateInviteToken :one
UPDATE operator_invites
SET
  token_hash = $2,
  expires_at = $3,
  revoked_at = NULL
WHERE id = $1
RETURNING *;

-- name: RevokeInvite :exec
UPDATE operator_invites
SET revoked_at = NOW()
WHERE id = $1;

-- name: AcceptInvite :exec
UPDATE operator_invites
SET accepted_at = NOW()
WHERE id = $1;
