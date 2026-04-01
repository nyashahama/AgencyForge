-- name: CreateAgency :one
INSERT INTO agencies (
  name,
  slug
) VALUES (
  $1, $2
)
RETURNING *;

-- name: CreateUser :one
INSERT INTO users (
  agency_id,
  name,
  email,
  password_hash,
  role
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: CreateAgencyMembership :one
INSERT INTO agency_memberships (
  agency_id,
  user_id,
  role,
  status
) VALUES (
  $1, $2, $3, $4
)
RETURNING *;

-- name: GetUserAuthByEmail :one
SELECT
  u.id,
  u.agency_id,
  u.name,
  u.email,
  u.password_hash,
  u.role,
  u.created_at,
  u.updated_at,
  a.name AS agency_name,
  a.slug AS agency_slug,
  COALESCE(am.status, 'active')::text AS membership_status
FROM users u
JOIN agencies a
  ON a.id = u.agency_id
LEFT JOIN agency_memberships am
  ON am.user_id = u.id
 AND am.agency_id = u.agency_id
WHERE u.email = $1
LIMIT 1;

-- name: GetUserAuthByID :one
SELECT
  u.id,
  u.agency_id,
  u.name,
  u.email,
  u.password_hash,
  u.role,
  u.created_at,
  u.updated_at,
  a.name AS agency_name,
  a.slug AS agency_slug,
  COALESCE(am.status, 'active')::text AS membership_status
FROM users u
JOIN agencies a
  ON a.id = u.agency_id
LEFT JOIN agency_memberships am
  ON am.user_id = u.id
 AND am.agency_id = u.agency_id
WHERE u.id = $1
LIMIT 1;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (
  token,
  user_id,
  expires_at
) VALUES (
  $1, $2, $3
)
RETURNING *;

-- name: GetRefreshToken :one
SELECT *
FROM refresh_tokens
WHERE token = $1
LIMIT 1;

-- name: DeleteRefreshTokensByUserID :exec
DELETE FROM refresh_tokens
WHERE user_id = $1;

-- name: DeleteRefreshToken :exec
DELETE FROM refresh_tokens
WHERE token = $1;
