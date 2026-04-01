-- +goose Up
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agencies_slug_format_chk CHECK (slug = lower(slug)),
  CONSTRAINT agencies_slug_key UNIQUE (slug)
);

INSERT INTO agencies (id, name, slug, created_at, updated_at)
SELECT DISTINCT
  u.agency_id,
  'Agency ' || SUBSTRING(u.agency_id::TEXT, 1, 8),
  'agency-' || SUBSTRING(u.agency_id::TEXT, 1, 8),
  NOW(),
  NOW()
FROM users u
ON CONFLICT (id) DO NOTHING;

ALTER TABLE users
  ADD COLUMN name TEXT NOT NULL DEFAULT '',
  ADD CONSTRAINT users_role_chk CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

ALTER TABLE users
  ALTER COLUMN agency_id DROP DEFAULT;

ALTER TABLE users
  ADD CONSTRAINT users_agency_id_fkey
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT;

CREATE INDEX idx_users_agency_id ON users (agency_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE TABLE agency_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agency_memberships_role_chk CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  CONSTRAINT agency_memberships_status_chk CHECK (status IN ('active', 'invited', 'disabled')),
  CONSTRAINT agency_memberships_agency_user_key UNIQUE (agency_id, user_id)
);

INSERT INTO agency_memberships (agency_id, user_id, role, status, created_at, updated_at)
SELECT
  u.agency_id,
  u.id,
  u.role,
  'active',
  u.created_at,
  u.updated_at
FROM users u
ON CONFLICT (agency_id, user_id) DO NOTHING;

CREATE INDEX idx_agency_memberships_user_id ON agency_memberships (user_id);

CREATE TRIGGER set_agencies_updated_at
BEFORE UPDATE ON agencies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_agency_memberships_updated_at
BEFORE UPDATE ON agency_memberships
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS set_agency_memberships_updated_at ON agency_memberships;
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
DROP TRIGGER IF EXISTS set_agencies_updated_at ON agencies;

DROP TABLE IF EXISTS agency_memberships;

DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_users_agency_id;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_agency_id_fkey,
  ALTER COLUMN agency_id SET DEFAULT gen_random_uuid(),
  DROP CONSTRAINT IF EXISTS users_role_chk,
  DROP COLUMN IF EXISTS name;

DROP TABLE IF EXISTS agencies;

DROP FUNCTION IF EXISTS set_updated_at();
