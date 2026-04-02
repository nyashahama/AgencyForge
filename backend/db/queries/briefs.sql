-- name: CountBriefsByAgency :one
SELECT COUNT(*)
FROM briefs
WHERE agency_id = $1;

-- name: ListBriefsByAgency :many
SELECT
  b.*,
  c.name AS client_name,
  (
    SELECT COUNT(*)
    FROM brief_documents bd
    WHERE bd.brief_id = b.id
  ) AS document_count
FROM briefs b
JOIN clients c
  ON c.id = b.client_id
WHERE b.agency_id = $1
ORDER BY b.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetBriefByIDAndAgency :one
SELECT *
FROM briefs
WHERE agency_id = $1
  AND id = $2
LIMIT 1;

-- name: CreateBrief :one
INSERT INTO briefs (
  agency_id,
  client_id,
  created_by_user_id,
  title,
  channel,
  status,
  pages,
  owner_email,
  source_type,
  next_action
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
)
RETURNING *;

-- name: UpdateBriefLaunchState :one
UPDATE briefs
SET
  status = $3,
  next_action = $4,
  launched_at = $5,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
RETURNING *;

-- name: CreateBriefDocument :one
INSERT INTO brief_documents (
  brief_id,
  storage_key,
  original_filename,
  media_type,
  byte_size,
  page_count,
  uploaded_by_user_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: ListBriefDocumentsByBrief :many
SELECT *
FROM brief_documents
WHERE brief_id = $1
ORDER BY created_at ASC;

-- name: CreateBriefStatusHistory :one
INSERT INTO brief_status_history (
  brief_id,
  from_status,
  to_status,
  changed_by_user_id,
  note
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: ListBriefStatusHistoryByBrief :many
SELECT *
FROM brief_status_history
WHERE brief_id = $1
ORDER BY created_at DESC;
