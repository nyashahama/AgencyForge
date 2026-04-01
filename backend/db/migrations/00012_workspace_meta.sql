-- +goose Up
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  body TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT playbooks_status_chk CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT playbooks_agency_name_key UNIQUE (agency_id, name)
);

CREATE INDEX idx_playbooks_agency_id_status ON playbooks (agency_id, status);

CREATE TABLE setting_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT setting_groups_key_format_chk CHECK (key = lower(key)),
  CONSTRAINT setting_groups_agency_key_key UNIQUE (agency_id, key)
);

CREATE TABLE setting_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_group_id UUID NOT NULL REFERENCES setting_groups(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT setting_items_key_format_chk CHECK (key = lower(key)),
  CONSTRAINT setting_items_group_key_key UNIQUE (setting_group_id, key)
);

CREATE INDEX idx_setting_items_setting_group_id ON setting_items (setting_group_id);

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  portal_id UUID REFERENCES portals(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT '',
  subject_id UUID,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_events_agency_id_occurred_at ON activity_events (agency_id, occurred_at DESC);
CREATE INDEX idx_activity_events_client_id_occurred_at ON activity_events (client_id, occurred_at DESC);
CREATE INDEX idx_activity_events_campaign_id_occurred_at ON activity_events (campaign_id, occurred_at DESC);

CREATE TRIGGER set_playbooks_updated_at
BEFORE UPDATE ON playbooks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_setting_groups_updated_at
BEFORE UPDATE ON setting_groups
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_setting_items_updated_at
BEFORE UPDATE ON setting_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS set_setting_items_updated_at ON setting_items;
DROP TRIGGER IF EXISTS set_setting_groups_updated_at ON setting_groups;
DROP TRIGGER IF EXISTS set_playbooks_updated_at ON playbooks;

DROP TABLE IF EXISTS activity_events;
DROP TABLE IF EXISTS setting_items;
DROP TABLE IF EXISTS setting_groups;
DROP TABLE IF EXISTS playbooks;
