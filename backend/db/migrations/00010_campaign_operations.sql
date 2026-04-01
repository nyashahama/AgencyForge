-- +goose Up
ALTER TABLE campaigns
  ADD COLUMN agency_id UUID,
  ADD COLUMN owner_user_id UUID,
  ADD COLUMN progress_percent INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN risk_level TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN budget_currency CHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN deliverable_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD CONSTRAINT campaigns_status_chk CHECK (status IN ('draft', 'generating', 'review', 'approved', 'paused', 'cancelled')),
  ADD CONSTRAINT campaigns_progress_percent_chk CHECK (progress_percent >= 0 AND progress_percent <= 100),
  ADD CONSTRAINT campaigns_risk_level_chk CHECK (risk_level IN ('low', 'medium', 'high')),
  ADD CONSTRAINT campaigns_budget_currency_chk CHECK (budget_currency = upper(budget_currency));

UPDATE campaigns cm
SET agency_id = c.agency_id
FROM clients c
WHERE c.id = cm.client_id
  AND cm.agency_id IS NULL;

ALTER TABLE campaigns
  ALTER COLUMN agency_id SET NOT NULL,
  ADD CONSTRAINT campaigns_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  ADD CONSTRAINT campaigns_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_campaigns_agency_id_created_at ON campaigns (agency_id, created_at DESC);
CREATE INDEX idx_campaigns_client_id_status ON campaigns (client_id, status);

CREATE TABLE specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  specialty_type TEXT NOT NULL DEFAULT 'delivery',
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT specialists_code_format_chk CHECK (code = lower(code)),
  CONSTRAINT specialists_code_key UNIQUE (code)
);

INSERT INTO specialists (name, code, specialty_type, is_system)
VALUES
  ('Copy', 'copy', 'creative', TRUE),
  ('Design', 'design', 'creative', TRUE),
  ('Media', 'media', 'strategy', TRUE),
  ('Legal', 'legal', 'compliance', TRUE),
  ('Budget', 'budget', 'finance', TRUE),
  ('Portal', 'portal', 'delivery', TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE campaign_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE RESTRICT,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  load_units INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_assignments_status_chk CHECK (status IN ('queued', 'active', 'blocked', 'complete')),
  CONSTRAINT campaign_assignments_load_units_chk CHECK (load_units > 0),
  CONSTRAINT campaign_assignments_campaign_specialist_key UNIQUE (campaign_id, specialist_id)
);

CREATE INDEX idx_campaign_assignments_campaign_id ON campaign_assignments (campaign_id);
CREATE INDEX idx_campaign_assignments_assigned_user_id ON campaign_assignments (assigned_user_id);

CREATE TABLE campaign_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_status_history_to_status_chk CHECK (to_status IN ('draft', 'generating', 'review', 'approved', 'paused', 'cancelled'))
);

INSERT INTO campaign_status_history (campaign_id, from_status, to_status, note, created_at)
SELECT
  c.id,
  NULL,
  c.status,
  'Initial imported state',
  c.created_at
FROM campaigns c;

CREATE INDEX idx_campaign_status_history_campaign_id_created_at ON campaign_status_history (campaign_id, created_at DESC);

CREATE TABLE campaign_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deliverable_type TEXT NOT NULL DEFAULT 'asset',
  status TEXT NOT NULL DEFAULT 'draft',
  file_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_deliverables_status_chk CHECK (status IN ('draft', 'generating', 'review', 'approved', 'delivered'))
);

CREATE INDEX idx_campaign_deliverables_campaign_id ON campaign_deliverables (campaign_id);

CREATE TABLE campaign_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  approver_name TEXT NOT NULL,
  approver_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  feedback TEXT NOT NULL DEFAULT '',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_approvals_status_chk CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected'))
);

CREATE INDEX idx_campaign_approvals_campaign_id_status ON campaign_approvals (campaign_id, status);

CREATE TRIGGER set_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_specialists_updated_at
BEFORE UPDATE ON specialists
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_campaign_assignments_updated_at
BEFORE UPDATE ON campaign_assignments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_campaign_deliverables_updated_at
BEFORE UPDATE ON campaign_deliverables
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_campaign_approvals_updated_at
BEFORE UPDATE ON campaign_approvals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS set_campaign_approvals_updated_at ON campaign_approvals;
DROP TRIGGER IF EXISTS set_campaign_deliverables_updated_at ON campaign_deliverables;
DROP TRIGGER IF EXISTS set_campaign_assignments_updated_at ON campaign_assignments;
DROP TRIGGER IF EXISTS set_specialists_updated_at ON specialists;
DROP TRIGGER IF EXISTS set_campaigns_updated_at ON campaigns;

DROP TABLE IF EXISTS campaign_approvals;
DROP TABLE IF EXISTS campaign_deliverables;
DROP TABLE IF EXISTS campaign_status_history;
DROP TABLE IF EXISTS campaign_assignments;
DROP TABLE IF EXISTS specialists;

DROP INDEX IF EXISTS idx_campaigns_client_id_status;
DROP INDEX IF EXISTS idx_campaigns_agency_id_created_at;

ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_owner_user_id_fkey,
  DROP CONSTRAINT IF EXISTS campaigns_agency_id_fkey,
  DROP CONSTRAINT IF EXISTS campaigns_budget_currency_chk,
  DROP CONSTRAINT IF EXISTS campaigns_risk_level_chk,
  DROP CONSTRAINT IF EXISTS campaigns_progress_percent_chk,
  DROP CONSTRAINT IF EXISTS campaigns_status_chk,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS deliverable_count,
  DROP COLUMN IF EXISTS budget_currency,
  DROP COLUMN IF EXISTS risk_level,
  DROP COLUMN IF EXISTS progress_percent,
  DROP COLUMN IF EXISTS owner_user_id,
  DROP COLUMN IF EXISTS agency_id;
