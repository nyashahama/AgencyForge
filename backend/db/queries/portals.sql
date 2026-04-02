-- name: CountPortalsByAgency :one
SELECT COUNT(*)
FROM portals
WHERE agency_id = $1
  AND archived_at IS NULL;

-- name: ListPortalsByAgency :many
SELECT
  p.*,
  c.name AS client_name,
  COALESCE((
    SELECT MAX(pp.version_number)
    FROM portal_publications pp
    WHERE pp.portal_id = p.id
  ), 0)::integer AS latest_publication_version,
  (
    SELECT COUNT(*)::bigint
    FROM portal_shares ps
    WHERE ps.portal_id = p.id
      AND ps.status = 'active'
  ) AS active_share_count
FROM portals p
JOIN clients c
  ON c.id = p.client_id
WHERE p.agency_id = $1
  AND p.archived_at IS NULL
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetPortalByIDAndAgency :one
SELECT *
FROM portals
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
LIMIT 1;

-- name: GetPortalSummaryByIDAndAgency :one
SELECT
  p.*,
  c.name AS client_name,
  COALESCE((
    SELECT MAX(pp.version_number)
    FROM portal_publications pp
    WHERE pp.portal_id = p.id
  ), 0)::integer AS latest_publication_version,
  (
    SELECT COUNT(*)::bigint
    FROM portal_shares ps
    WHERE ps.portal_id = p.id
      AND ps.status = 'active'
  ) AS active_share_count
FROM portals p
JOIN clients c
  ON c.id = p.client_id
WHERE p.agency_id = $1
  AND p.id = $2
  AND p.archived_at IS NULL
LIMIT 1;

-- name: UpdatePortal :one
UPDATE portals
SET
  name = $3,
  theme = $4,
  review_mode = $5,
  share_state = $6,
  description = $7,
  published_at = $8,
  last_published_at = $9,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
RETURNING *;

-- name: ListPortalReviewFlowsByPortal :many
SELECT *
FROM portal_review_flows
WHERE portal_id = $1
ORDER BY is_default DESC, created_at ASC;

-- name: GetDefaultPortalReviewFlowByPortal :one
SELECT *
FROM portal_review_flows
WHERE portal_id = $1
  AND is_default = TRUE
ORDER BY created_at ASC
LIMIT 1;

-- name: CreatePortalReviewFlow :one
INSERT INTO portal_review_flows (
  portal_id,
  name,
  review_mode,
  config_json,
  is_default
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: UpdatePortalReviewFlow :one
UPDATE portal_review_flows
SET
  name = $3,
  review_mode = $4,
  config_json = $5,
  is_default = $6,
  updated_at = NOW()
WHERE id = $1
  AND portal_id = $2
RETURNING *;

-- name: ListPortalPublicationsByPortal :many
SELECT *
FROM portal_publications
WHERE portal_id = $1
ORDER BY version_number DESC;

-- name: GetLatestPortalPublicationByPortal :one
SELECT *
FROM portal_publications
WHERE portal_id = $1
ORDER BY version_number DESC
LIMIT 1;

-- name: SupersedePublishedPortalPublications :exec
UPDATE portal_publications
SET
  status = 'superseded',
  updated_at = NOW()
WHERE portal_id = $1
  AND status = 'published';

-- name: CreatePortalPublication :one
INSERT INTO portal_publications (
  portal_id,
  version_number,
  status,
  published_by_user_id,
  payload,
  published_at
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: ListPortalSharesByPortal :many
SELECT *
FROM portal_shares
WHERE portal_id = $1
ORDER BY created_at DESC;

-- name: GetActivePortalShareByPortal :one
SELECT *
FROM portal_shares
WHERE portal_id = $1
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- name: CreatePortalShare :one
INSERT INTO portal_shares (
  portal_id,
  status,
  expires_at
) VALUES (
  $1, $2, $3
)
RETURNING *;

-- name: UpdatePortalShare :one
UPDATE portal_shares
SET
  status = $3,
  expires_at = $4,
  updated_at = NOW()
WHERE id = $1
  AND portal_id = $2
RETURNING *;

-- name: RevokeActivePortalSharesByPortal :exec
UPDATE portal_shares
SET
  status = 'revoked',
  updated_at = NOW()
WHERE portal_id = $1
  AND status = 'active';
