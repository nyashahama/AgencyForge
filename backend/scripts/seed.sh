#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

DATABASE_URL="${DATABASE_URL:-postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to seed the database" >&2
  exit 1
fi

echo "Seeding database fixtures into ${DATABASE_URL}"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;

INSERT INTO agencies (id, name, slug, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'AgencyForge Demo',
  'agencyforge-demo',
  '2026-01-10T09:00:00Z',
  '2026-01-10T09:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = EXCLUDED.updated_at;

INSERT INTO users (id, agency_id, name, email, password_hash, role, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000101',
    'Agency Owner',
    'owner@agencyforge.test',
    '$2a$10$MIU2h1RR5zxK5o5phnUMReCDa/LHJOYJFChbCXvsqJ6IEYZzr3eVK',
    'owner',
    '2026-01-10T09:05:00Z',
    '2026-01-10T09:05:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000101',
    'Agency Admin',
    'admin@agencyforge.test',
    '$2a$10$MIU2h1RR5zxK5o5phnUMReCDa/LHJOYJFChbCXvsqJ6IEYZzr3eVK',
    'admin',
    '2026-01-10T09:06:00Z',
    '2026-01-10T09:06:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000101',
    'Agency Member',
    'member@agencyforge.test',
    '$2a$10$MIU2h1RR5zxK5o5phnUMReCDa/LHJOYJFChbCXvsqJ6IEYZzr3eVK',
    'member',
    '2026-01-10T09:07:00Z',
    '2026-01-10T09:07:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  agency_id = EXCLUDED.agency_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = EXCLUDED.updated_at;

INSERT INTO agency_memberships (id, agency_id, user_id, role, status, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000111',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    'owner',
    'active',
    '2026-01-10T09:05:00Z',
    '2026-01-10T09:05:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000112',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000103',
    'admin',
    'active',
    '2026-01-10T09:06:00Z',
    '2026-01-10T09:06:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000113',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000104',
    'member',
    'active',
    '2026-01-10T09:07:00Z',
    '2026-01-10T09:07:00Z'
  )
ON CONFLICT (agency_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

INSERT INTO clients (
  id,
  agency_id,
  owner_user_id,
  name,
  slug,
  lead_email,
  health,
  notes,
  mrr_cents,
  open_approvals_count,
  last_touchpoint_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    'Northstar Labs',
    'northstar-labs',
    'ops@northstar.test',
    'strong',
    'Weekly stakeholder sync and active media expansion.',
    2400000,
    1,
    '2026-02-18T09:00:00Z',
    '2026-01-20T12:00:00Z',
    '2026-02-18T09:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000103',
    'Evergreen Foods',
    'evergreen-foods',
    'marketing@evergreen.test',
    'watch',
    'Legal review bottleneck on seasonal claims copy.',
    1850000,
    2,
    '2026-02-16T16:15:00Z',
    '2026-01-22T15:30:00Z',
    '2026-02-16T16:15:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  agency_id = EXCLUDED.agency_id,
  owner_user_id = EXCLUDED.owner_user_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  lead_email = EXCLUDED.lead_email,
  health = EXCLUDED.health,
  notes = EXCLUDED.notes,
  mrr_cents = EXCLUDED.mrr_cents,
  open_approvals_count = EXCLUDED.open_approvals_count,
  last_touchpoint_at = EXCLUDED.last_touchpoint_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO client_contacts (id, client_id, name, email, role, is_primary, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000211',
    '00000000-0000-0000-0000-000000000201',
    'Dana Avery',
    'ops@northstar.test',
    'operations lead',
    TRUE,
    '2026-01-20T12:05:00Z',
    '2026-01-20T12:05:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000212',
    '00000000-0000-0000-0000-000000000202',
    'Maya Singh',
    'marketing@evergreen.test',
    'marketing director',
    TRUE,
    '2026-01-22T15:35:00Z',
    '2026-01-22T15:35:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_primary = EXCLUDED.is_primary,
  updated_at = EXCLUDED.updated_at;

INSERT INTO client_touchpoints (id, client_id, author_user_id, note, happened_at, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000221',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000102',
    'Aligned on launch narrative and final CTA variants.',
    '2026-02-18T09:00:00Z',
    '2026-02-18T09:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000222',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000103',
    'Awaiting compliance signoff for nutritional claims.',
    '2026-02-16T16:15:00Z',
    '2026-02-16T16:15:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  note = EXCLUDED.note,
  happened_at = EXCLUDED.happened_at;

INSERT INTO briefs (
  id,
  agency_id,
  client_id,
  created_by_user_id,
  title,
  channel,
  status,
  pages,
  owner_email,
  source_type,
  next_action,
  launched_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000102',
    'Northstar spring campaign intake',
    'paid-social',
    'new',
    14,
    'owner@agencyforge.test',
    'upload',
    'Normalize intake brief',
    NULL,
    '2026-02-15T08:30:00Z',
    '2026-02-15T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000103',
    'Evergreen compliance update brief',
    'email',
    'launched',
    8,
    'admin@agencyforge.test',
    'email',
    'Campaign package launched',
    '2026-02-14T13:20:00Z',
    '2026-02-14T11:00:00Z',
    '2026-02-14T13:20:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  pages = EXCLUDED.pages,
  owner_email = EXCLUDED.owner_email,
  source_type = EXCLUDED.source_type,
  next_action = EXCLUDED.next_action,
  launched_at = EXCLUDED.launched_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO brief_documents (
  id,
  brief_id,
  storage_key,
  original_filename,
  media_type,
  byte_size,
  page_count,
  uploaded_by_user_id,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000311',
    '00000000-0000-0000-0000-000000000301',
    'uploads/northstar-spring-brief.pdf',
    'northstar-spring-brief.pdf',
    'application/pdf',
    184320,
    14,
    '00000000-0000-0000-0000-000000000102',
    '2026-02-15T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000312',
    '00000000-0000-0000-0000-000000000302',
    'uploads/evergreen-compliance-notes.txt',
    'evergreen-compliance-notes.txt',
    'text/plain',
    4096,
    8,
    '00000000-0000-0000-0000-000000000103',
    '2026-02-14T11:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  storage_key = EXCLUDED.storage_key,
  original_filename = EXCLUDED.original_filename,
  media_type = EXCLUDED.media_type,
  byte_size = EXCLUDED.byte_size,
  page_count = EXCLUDED.page_count;

INSERT INTO brief_status_history (
  id,
  brief_id,
  from_status,
  to_status,
  changed_by_user_id,
  note,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000321',
    '00000000-0000-0000-0000-000000000301',
    NULL,
    'new',
    '00000000-0000-0000-0000-000000000102',
    'Brief created',
    '2026-02-15T08:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000322',
    '00000000-0000-0000-0000-000000000302',
    NULL,
    'new',
    '00000000-0000-0000-0000-000000000103',
    'Brief created',
    '2026-02-14T11:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000323',
    '00000000-0000-0000-0000-000000000302',
    'new',
    'launched',
    '00000000-0000-0000-0000-000000000103',
    'Brief launched into campaign execution',
    '2026-02-14T13:20:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  from_status = EXCLUDED.from_status,
  to_status = EXCLUDED.to_status,
  note = EXCLUDED.note,
  created_at = EXCLUDED.created_at;

INSERT INTO campaigns (
  id,
  agency_id,
  client_id,
  brief_id,
  owner_user_id,
  name,
  status,
  budget_cents,
  budget_currency,
  due_at,
  progress_percent,
  risk_level,
  deliverable_count,
  approved_at,
  archived_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000103',
    'Evergreen Seasonal Launch',
    'generating',
    550000,
    'USD',
    '2026-03-10T00:00:00Z',
    48,
    'medium',
    3,
    NULL,
    NULL,
    '2026-02-14T13:25:00Z',
    '2026-02-18T07:45:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    NULL,
    '00000000-0000-0000-0000-000000000102',
    'Northstar Performance Retargeting',
    'review',
    720000,
    'USD',
    '2026-03-06T00:00:00Z',
    72,
    'low',
    5,
    NULL,
    NULL,
    '2026-02-12T10:00:00Z',
    '2026-02-18T06:40:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  budget_cents = EXCLUDED.budget_cents,
  budget_currency = EXCLUDED.budget_currency,
  due_at = EXCLUDED.due_at,
  progress_percent = EXCLUDED.progress_percent,
  risk_level = EXCLUDED.risk_level,
  deliverable_count = EXCLUDED.deliverable_count,
  updated_at = EXCLUDED.updated_at;

INSERT INTO campaign_status_history (
  id,
  campaign_id,
  from_status,
  to_status,
  changed_by_user_id,
  note,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000411',
    '00000000-0000-0000-0000-000000000401',
    NULL,
    'generating',
    '00000000-0000-0000-0000-000000000103',
    'Campaign created from brief launch',
    '2026-02-14T13:25:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000412',
    '00000000-0000-0000-0000-000000000402',
    NULL,
    'review',
    '00000000-0000-0000-0000-000000000102',
    'Campaign entered client review',
    '2026-02-17T09:15:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  from_status = EXCLUDED.from_status,
  to_status = EXCLUDED.to_status,
  note = EXCLUDED.note,
  created_at = EXCLUDED.created_at;

INSERT INTO specialists (name, code, specialty_type, is_system, created_at, updated_at)
VALUES
  ('Copy', 'copy', 'creative', TRUE, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
  ('Design', 'design', 'creative', TRUE, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
  ('Media', 'media', 'strategy', TRUE, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
  ('Legal', 'legal', 'compliance', TRUE, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
  ('Budget', 'budget', 'finance', TRUE, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
  ('Portal', 'portal', 'delivery', TRUE, '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  specialty_type = EXCLUDED.specialty_type,
  is_system = EXCLUDED.is_system,
  updated_at = EXCLUDED.updated_at;

INSERT INTO campaign_assignments (
  id,
  campaign_id,
  specialist_id,
  assigned_user_id,
  status,
  load_units,
  started_at,
  completed_at,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000421',
  '00000000-0000-0000-0000-000000000401',
  s.id,
  '00000000-0000-0000-0000-000000000104',
  'active',
  3,
  '2026-02-15T08:00:00Z',
  NULL,
  '2026-02-15T08:00:00Z',
  '2026-02-18T06:20:00Z'
FROM specialists s
WHERE s.code = 'copy'
ON CONFLICT (campaign_id, specialist_id) DO UPDATE SET
  assigned_user_id = EXCLUDED.assigned_user_id,
  status = EXCLUDED.status,
  load_units = EXCLUDED.load_units,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO campaign_assignments (
  id,
  campaign_id,
  specialist_id,
  assigned_user_id,
  status,
  load_units,
  started_at,
  completed_at,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000422',
  '00000000-0000-0000-0000-000000000402',
  s.id,
  '00000000-0000-0000-0000-000000000103',
  'blocked',
  2,
  '2026-02-16T10:30:00Z',
  NULL,
  '2026-02-16T10:30:00Z',
  '2026-02-18T06:55:00Z'
FROM specialists s
WHERE s.code = 'legal'
ON CONFLICT (campaign_id, specialist_id) DO UPDATE SET
  assigned_user_id = EXCLUDED.assigned_user_id,
  status = EXCLUDED.status,
  load_units = EXCLUDED.load_units,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO campaign_deliverables (
  id,
  campaign_id,
  name,
  deliverable_type,
  status,
  file_url,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000431',
    '00000000-0000-0000-0000-000000000401',
    'Launch ad set copy',
    'copy',
    'review',
    'https://example.test/assets/copy-v2',
    '2026-02-15T09:00:00Z',
    '2026-02-18T06:30:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000432',
    '00000000-0000-0000-0000-000000000402',
    'Retargeting visual set',
    'design',
    'approved',
    'https://example.test/assets/design-v4',
    '2026-02-13T14:15:00Z',
    '2026-02-18T06:10:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  file_url = EXCLUDED.file_url,
  updated_at = EXCLUDED.updated_at;

INSERT INTO campaign_approvals (
  id,
  campaign_id,
  approver_name,
  approver_email,
  status,
  feedback,
  requested_at,
  responded_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000441',
    '00000000-0000-0000-0000-000000000401',
    'Maya Singh',
    'marketing@evergreen.test',
    'pending',
    '',
    '2026-02-18T06:00:00Z',
    NULL,
    '2026-02-18T06:00:00Z',
    '2026-02-18T06:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000442',
    '00000000-0000-0000-0000-000000000402',
    'Dana Avery',
    'ops@northstar.test',
    'approved',
    'Approved for launch window.',
    '2026-02-17T15:00:00Z',
    '2026-02-17T17:20:00Z',
    '2026-02-17T15:00:00Z',
    '2026-02-17T17:20:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  feedback = EXCLUDED.feedback,
  responded_at = EXCLUDED.responded_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO portals (
  id,
  agency_id,
  client_id,
  name,
  slug,
  theme,
  review_mode,
  share_state,
  description,
  published_at,
  last_published_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    'Northstar Client Portal',
    'northstar-client-portal',
    'graphite-lime',
    'stage-gate',
    'published',
    'Primary delivery portal for Northstar campaign approvals.',
    '2026-02-18T05:45:00Z',
    '2026-02-18T05:45:00Z',
    '2026-02-01T12:00:00Z',
    '2026-02-18T05:45:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  share_state = EXCLUDED.share_state,
  theme = EXCLUDED.theme,
  review_mode = EXCLUDED.review_mode,
  description = EXCLUDED.description,
  published_at = EXCLUDED.published_at,
  last_published_at = EXCLUDED.last_published_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO portal_review_flows (
  id,
  portal_id,
  name,
  review_mode,
  config_json,
  is_default,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000511',
    '00000000-0000-0000-0000-000000000501',
    'Northstar Client Portal Default Flow',
    'stage-gate',
    '{"steps":["creative-review","client-review","publish"]}'::jsonb,
    TRUE,
    '2026-02-01T12:05:00Z',
    '2026-02-18T05:40:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  review_mode = EXCLUDED.review_mode,
  config_json = EXCLUDED.config_json,
  updated_at = EXCLUDED.updated_at;

INSERT INTO portal_publications (
  id,
  portal_id,
  version_number,
  status,
  published_by_user_id,
  payload,
  published_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000521',
    '00000000-0000-0000-0000-000000000501',
    1,
    'published',
    '00000000-0000-0000-0000-000000000102',
    '{"theme":"graphite-lime","review_mode":"stage-gate","share_state":"published"}'::jsonb,
    '2026-02-18T05:45:00Z',
    '2026-02-18T05:45:00Z',
    '2026-02-18T05:45:00Z'
  )
ON CONFLICT (portal_id, version_number) DO UPDATE SET
  status = EXCLUDED.status,
  payload = EXCLUDED.payload,
  published_at = EXCLUDED.published_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO portal_shares (
  id,
  portal_id,
  access_token,
  status,
  expires_at,
  last_accessed_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000531',
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000532',
    'active',
    '2026-03-01T00:00:00Z',
    '2026-02-18T08:15:00Z',
    '2026-02-18T05:45:00Z',
    '2026-02-18T08:15:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  expires_at = EXCLUDED.expires_at,
  last_accessed_at = EXCLUDED.last_accessed_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO playbooks (
  id,
  agency_id,
  name,
  category,
  owner_user_id,
  status,
  body,
  published_at,
  created_at,
  updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000101',
    'Delivery QA Checklist',
    'Operations',
    '00000000-0000-0000-0000-000000000102',
    'published',
    '1. Validate campaign scope.\n2. Confirm approvals.\n3. Publish delivery package.',
    '2026-02-10T11:00:00Z',
    '2026-02-10T10:00:00Z',
    '2026-02-10T11:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  owner_user_id = EXCLUDED.owner_user_id,
  status = EXCLUDED.status,
  body = EXCLUDED.body,
  published_at = EXCLUDED.published_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO setting_groups (id, agency_id, key, name, description, sort_order, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000611',
    '00000000-0000-0000-0000-000000000101',
    'branding',
    'Branding',
    'Brand defaults applied to client output.',
    1,
    '2026-01-10T09:00:00Z',
    '2026-02-01T12:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000612',
    '00000000-0000-0000-0000-000000000101',
    'notifications',
    'Notifications',
    'Delivery and approval alerts.',
    2,
    '2026-01-10T09:00:00Z',
    '2026-02-01T12:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = EXCLUDED.updated_at;

INSERT INTO setting_items (id, setting_group_id, key, label, value, sort_order, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000621',
    '00000000-0000-0000-0000-000000000611',
    'primary_color',
    'Primary color',
    '#84cc16',
    1,
    '2026-01-10T09:00:00Z',
    '2026-02-01T12:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000622',
    '00000000-0000-0000-0000-000000000612',
    'approval_digest',
    'Approval digest',
    'daily',
    1,
    '2026-01-10T09:00:00Z',
    '2026-02-01T12:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

INSERT INTO activity_events (
  id,
  agency_id,
  actor_user_id,
  client_id,
  brief_id,
  campaign_id,
  portal_id,
  event_type,
  subject_type,
  subject_id,
  message,
  metadata,
  occurred_at,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000401',
    NULL,
    'brief.launched',
    'brief',
    '00000000-0000-0000-0000-000000000302',
    'Launched brief Evergreen compliance update brief into campaign Evergreen Seasonal Launch',
    '{"campaign_name":"Evergreen Seasonal Launch"}'::jsonb,
    '2026-02-14T13:25:00Z',
    '2026-02-14T13:25:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000702',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000201',
    NULL,
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000501',
    'portal.published',
    'portal',
    '00000000-0000-0000-0000-000000000501',
    'Published Northstar Client Portal',
    '{"version":1}'::jsonb,
    '2026-02-18T05:45:00Z',
    '2026-02-18T05:45:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  message = EXCLUDED.message,
  metadata = EXCLUDED.metadata,
  occurred_at = EXCLUDED.occurred_at;

INSERT INTO operator_invites (
  id,
  agency_id,
  email,
  role,
  token_hash,
  invited_by_user_id,
  accepted_at,
  revoked_at,
  expires_at,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000101',
    'operator@agencyforge.test',
    'member',
    'a4d1f4ec9a6d11c91e5f0ebf9bd5b6a9f8ddf4e71434ff9da4ae1d6c3931f21c',
    '00000000-0000-0000-0000-000000000102',
    NULL,
    NULL,
    '2026-03-15T00:00:00Z',
    '2026-02-18T06:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  token_hash = EXCLUDED.token_hash,
  invited_by_user_id = EXCLUDED.invited_by_user_id,
  accepted_at = EXCLUDED.accepted_at,
  revoked_at = EXCLUDED.revoked_at,
  expires_at = EXCLUDED.expires_at;

COMMIT;
SQL

echo "Seed complete."
echo "Demo logins:"
echo "  owner@agencyforge.test  / Password123!"
echo "  admin@agencyforge.test  / Password123!"
echo "  member@agencyforge.test / Password123!"
