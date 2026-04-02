-- name: CountCampaignsByAgency :one
SELECT COUNT(*)
FROM campaigns
WHERE agency_id = $1
  AND archived_at IS NULL;

-- name: ListCampaignsByAgency :many
SELECT
  cm.*,
  c.name AS client_name,
  COALESCE(u.email, '') AS owner_email,
  ARRAY(
    SELECT s.name
    FROM campaign_assignments ca
    JOIN specialists s
      ON s.id = ca.specialist_id
    WHERE ca.campaign_id = cm.id
    ORDER BY s.name ASC
  ) AS specialist_names,
  (
    SELECT COUNT(*)::bigint
    FROM campaign_approvals ap
    WHERE ap.campaign_id = cm.id
      AND ap.status = 'pending'
  ) AS pending_approvals_count
FROM campaigns cm
JOIN clients c
  ON c.id = cm.client_id
LEFT JOIN users u
  ON u.id = cm.owner_user_id
WHERE cm.agency_id = $1
  AND cm.archived_at IS NULL
ORDER BY cm.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetCampaignByIDAndAgency :one
SELECT *
FROM campaigns
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
LIMIT 1;

-- name: GetCampaignSummaryByIDAndAgency :one
SELECT
  cm.*,
  c.name AS client_name,
  COALESCE(u.email, '') AS owner_email,
  ARRAY(
    SELECT s.name
    FROM campaign_assignments ca
    JOIN specialists s
      ON s.id = ca.specialist_id
    WHERE ca.campaign_id = cm.id
    ORDER BY s.name ASC
  ) AS specialist_names,
  (
    SELECT COUNT(*)::bigint
    FROM campaign_approvals ap
    WHERE ap.campaign_id = cm.id
      AND ap.status = 'pending'
  ) AS pending_approvals_count
FROM campaigns cm
JOIN clients c
  ON c.id = cm.client_id
LEFT JOIN users u
  ON u.id = cm.owner_user_id
WHERE cm.agency_id = $1
  AND cm.id = $2
  AND cm.archived_at IS NULL
LIMIT 1;

-- name: CreateCampaign :one
INSERT INTO campaigns (
  agency_id,
  owner_user_id,
  client_id,
  brief_id,
  name,
  status,
  budget_cents,
  due_at,
  progress_percent,
  risk_level,
  budget_currency,
  deliverable_count,
  approved_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
)
RETURNING *;

-- name: UpdateCampaign :one
UPDATE campaigns
SET
  client_id = $3,
  brief_id = $4,
  owner_user_id = $5,
  name = $6,
  status = $7,
  budget_cents = $8,
  due_at = $9,
  progress_percent = $10,
  risk_level = $11,
  budget_currency = $12,
  deliverable_count = $13,
  approved_at = $14,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
RETURNING *;

-- name: UpdateCampaignWorkflowState :one
UPDATE campaigns
SET
  status = $3,
  progress_percent = $4,
  approved_at = $5,
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL
RETURNING *;

-- name: SetCampaignDeliverableCount :exec
UPDATE campaigns
SET
  deliverable_count = (
    SELECT COUNT(*)::integer
    FROM campaign_deliverables cd
    WHERE cd.campaign_id = $2
  ),
  updated_at = NOW()
WHERE agency_id = $1
  AND id = $2
  AND archived_at IS NULL;

-- name: CreateCampaignFromBrief :one
INSERT INTO campaigns (
  agency_id,
  owner_user_id,
  client_id,
  brief_id,
  name,
  status,
  budget_cents,
  due_at,
  progress_percent,
  risk_level,
  budget_currency,
  deliverable_count
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING *;

-- name: CreateCampaignStatusHistory :one
INSERT INTO campaign_status_history (
  campaign_id,
  from_status,
  to_status,
  changed_by_user_id,
  note
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: ListCampaignStatusHistoryByCampaign :many
SELECT *
FROM campaign_status_history
WHERE campaign_id = $1
ORDER BY created_at DESC;

-- name: GetSpecialistsByCodes :many
SELECT *
FROM specialists
WHERE code = ANY($1::text[])
ORDER BY name ASC;

-- name: ListCampaignAssignmentsByCampaign :many
SELECT
  ca.*,
  s.name AS specialist_name,
  s.code AS specialist_code,
  COALESCE(u.email, '') AS assigned_user_email
FROM campaign_assignments ca
JOIN specialists s
  ON s.id = ca.specialist_id
LEFT JOIN users u
  ON u.id = ca.assigned_user_id
WHERE ca.campaign_id = $1
ORDER BY s.name ASC;

-- name: CreateCampaignAssignment :one
INSERT INTO campaign_assignments (
  campaign_id,
  specialist_id,
  assigned_user_id,
  status,
  load_units,
  started_at,
  completed_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: UpdateCampaignAssignment :one
UPDATE campaign_assignments
SET
  assigned_user_id = $3,
  status = $4,
  load_units = $5,
  started_at = $6,
  completed_at = $7,
  updated_at = NOW()
WHERE id = $1
  AND campaign_id = $2
RETURNING *;

-- name: DeleteCampaignAssignment :exec
DELETE FROM campaign_assignments
WHERE id = $1
  AND campaign_id = $2;

-- name: ListCampaignDeliverablesByCampaign :many
SELECT *
FROM campaign_deliverables
WHERE campaign_id = $1
ORDER BY created_at ASC;

-- name: CreateCampaignDeliverable :one
INSERT INTO campaign_deliverables (
  campaign_id,
  name,
  deliverable_type,
  status,
  file_url
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: UpdateCampaignDeliverable :one
UPDATE campaign_deliverables
SET
  name = $3,
  deliverable_type = $4,
  status = $5,
  file_url = $6,
  updated_at = NOW()
WHERE id = $1
  AND campaign_id = $2
RETURNING *;

-- name: DeleteCampaignDeliverable :exec
DELETE FROM campaign_deliverables
WHERE id = $1
  AND campaign_id = $2;

-- name: ListCampaignApprovalsByCampaign :many
SELECT *
FROM campaign_approvals
WHERE campaign_id = $1
ORDER BY requested_at DESC, created_at DESC;

-- name: CreateCampaignApproval :one
INSERT INTO campaign_approvals (
  campaign_id,
  approver_name,
  approver_email,
  status,
  feedback,
  responded_at
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: UpdateCampaignApproval :one
UPDATE campaign_approvals
SET
  approver_name = $3,
  approver_email = $4,
  status = $5,
  feedback = $6,
  responded_at = $7,
  updated_at = NOW()
WHERE id = $1
  AND campaign_id = $2
RETURNING *;

-- name: DeleteCampaignApproval :exec
DELETE FROM campaign_approvals
WHERE id = $1
  AND campaign_id = $2;

-- name: SetClientOpenApprovalsCountFromCampaigns :exec
UPDATE clients c
SET
  open_approvals_count = (
    SELECT COUNT(*)::integer
    FROM campaign_approvals ap
    JOIN campaigns cm
      ON cm.id = ap.campaign_id
    WHERE cm.client_id = c.id
      AND cm.archived_at IS NULL
      AND ap.status = 'pending'
  ),
  updated_at = NOW()
WHERE c.agency_id = $1
  AND c.id = $2
  AND c.archived_at IS NULL;
