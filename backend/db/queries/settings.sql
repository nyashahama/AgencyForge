-- name: ListSettingGroupsByAgency :many
SELECT *
FROM setting_groups
WHERE agency_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: GetAgencyByID :one
SELECT *
FROM agencies
WHERE id = $1
LIMIT 1;

-- name: ListSettingItemsByGroupIDs :many
SELECT *
FROM setting_items
WHERE setting_group_id = ANY($1::uuid[])
ORDER BY setting_group_id, sort_order ASC, created_at ASC;

-- name: CreateSettingGroup :one
INSERT INTO setting_groups (
  agency_id,
  key,
  name,
  description,
  sort_order
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: CreateSettingItem :one
INSERT INTO setting_items (
  setting_group_id,
  key,
  label,
  value,
  sort_order
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetSettingItemByGroupKeyAndItemKey :one
SELECT
  si.*
FROM setting_items si
JOIN setting_groups sg
  ON sg.id = si.setting_group_id
WHERE sg.agency_id = $1
  AND sg.key = $2
  AND si.key = $3
LIMIT 1;

-- name: UpdateSettingItem :one
UPDATE setting_items
SET
  value = $2,
  updated_at = NOW()
WHERE id = $1
RETURNING *;
