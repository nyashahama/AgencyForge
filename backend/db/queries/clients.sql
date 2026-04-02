-- name: CountClientsByAgency :one
SELECT COUNT(*)
FROM clients
WHERE agency_id = $1
  AND archived_at IS NULL;

-- name: ListClientsByAgency :many
SELECT
  c.*,
  (
    SELECT cc.name
    FROM client_contacts cc
    WHERE cc.client_id = c.id
      AND cc.is_primary = TRUE
    ORDER BY cc.created_at ASC
    LIMIT 1
  ) AS primary_contact_name,
  (
    SELECT cc.email
    FROM client_contacts cc
    WHERE cc.client_id = c.id
      AND cc.is_primary = TRUE
    ORDER BY cc.created_at ASC
    LIMIT 1
  ) AS primary_contact_email,
  (
    SELECT cc.role
    FROM client_contacts cc
    WHERE cc.client_id = c.id
      AND cc.is_primary = TRUE
    ORDER BY cc.created_at ASC
    LIMIT 1
  ) AS primary_contact_role,
  (
    SELECT ct.note
    FROM client_touchpoints ct
    WHERE ct.client_id = c.id
    ORDER BY ct.happened_at DESC
    LIMIT 1
  ) AS latest_touchpoint_note
FROM clients c
WHERE c.agency_id = $1
  AND c.archived_at IS NULL
ORDER BY c.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetClientByIDAndAgency :one
SELECT *
FROM clients
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
LIMIT 1;

-- name: CreateClient :one
INSERT INTO clients (
  agency_id,
  owner_user_id,
  name,
  slug,
  lead_email,
  health,
  notes,
  mrr_cents,
  open_approvals_count
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING *;

-- name: UpdateClient :one
UPDATE clients
SET
  name = $3,
  slug = $4,
  lead_email = $5,
  health = $6,
  notes = $7,
  mrr_cents = $8,
  open_approvals_count = $9,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
RETURNING *;

-- name: SetClientLastTouchpointAt :exec
UPDATE clients
SET
  last_touchpoint_at = $3,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL;

-- name: ListClientContactsByClient :many
SELECT *
FROM client_contacts
WHERE client_id = $1
ORDER BY is_primary DESC, created_at ASC;

-- name: UpsertPrimaryClientContact :one
WITH cleared AS (
  UPDATE client_contacts
  SET
    is_primary = FALSE,
    updated_at = NOW()
  WHERE client_id = $1
    AND is_primary = TRUE
    AND email <> $3
)
INSERT INTO client_contacts (
  client_id,
  name,
  email,
  role,
  is_primary
) VALUES (
  $1, $2, $3, $4, TRUE
)
ON CONFLICT (client_id, email) DO UPDATE
SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_primary = TRUE,
  updated_at = NOW()
RETURNING *;

-- name: CreateClientTouchpoint :one
INSERT INTO client_touchpoints (
  client_id,
  author_user_id,
  note,
  happened_at
) VALUES (
  $1, $2, $3, $4
)
RETURNING *;

-- name: ListClientTouchpointsByClient :many
SELECT *
FROM client_touchpoints
WHERE client_id = $1
ORDER BY happened_at DESC
LIMIT $2;
