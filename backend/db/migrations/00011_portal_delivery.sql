-- +goose Up
ALTER TABLE portals
  ADD COLUMN agency_id UUID,
  ADD COLUMN slug TEXT,
  ADD COLUMN description TEXT NOT NULL DEFAULT '',
  ADD COLUMN last_published_at TIMESTAMPTZ,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD CONSTRAINT portals_review_mode_chk CHECK (review_mode IN ('stage-gate', 'rolling-review', 'compliance-first', 'custom')),
  ADD CONSTRAINT portals_share_state_chk CHECK (share_state IN ('draft', 'published', 'archived'));

UPDATE portals p
SET
  agency_id = c.agency_id,
  slug = c.slug || '-' || regexp_replace(lower(p.name), '[^a-z0-9]+', '-', 'g'),
  last_published_at = p.published_at
FROM clients c
WHERE c.id = p.client_id
  AND p.agency_id IS NULL;

ALTER TABLE portals
  ALTER COLUMN agency_id SET NOT NULL,
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT portals_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX idx_portals_agency_slug ON portals (agency_id, slug);
CREATE INDEX idx_portals_client_id ON portals (client_id);

CREATE TABLE portal_review_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  review_mode TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portal_review_flows_review_mode_chk CHECK (review_mode IN ('stage-gate', 'rolling-review', 'compliance-first', 'custom'))
);

INSERT INTO portal_review_flows (portal_id, name, review_mode, is_default, created_at, updated_at)
SELECT
  p.id,
  p.name || ' Default Flow',
  p.review_mode,
  TRUE,
  p.created_at,
  p.updated_at
FROM portals p;

CREATE INDEX idx_portal_review_flows_portal_id ON portal_review_flows (portal_id);

CREATE TABLE portal_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  published_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portal_publications_status_chk CHECK (status IN ('draft', 'published', 'superseded')),
  CONSTRAINT portal_publications_portal_version_key UNIQUE (portal_id, version_number)
);

INSERT INTO portal_publications (portal_id, version_number, status, payload, published_at, created_at, updated_at)
SELECT
  p.id,
  1,
  CASE WHEN p.published_at IS NULL THEN 'draft' ELSE 'published' END,
  jsonb_build_object('theme', p.theme, 'review_mode', p.review_mode, 'share_state', p.share_state),
  p.published_at,
  p.created_at,
  p.updated_at
FROM portals p;

CREATE INDEX idx_portal_publications_portal_id_published_at ON portal_publications (portal_id, published_at DESC);

CREATE TABLE portal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portal_shares_status_chk CHECK (status IN ('active', 'revoked', 'expired')),
  CONSTRAINT portal_shares_access_token_key UNIQUE (access_token)
);

CREATE INDEX idx_portal_shares_portal_id ON portal_shares (portal_id);

CREATE TRIGGER set_portals_updated_at
BEFORE UPDATE ON portals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_portal_review_flows_updated_at
BEFORE UPDATE ON portal_review_flows
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_portal_publications_updated_at
BEFORE UPDATE ON portal_publications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_portal_shares_updated_at
BEFORE UPDATE ON portal_shares
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS set_portal_shares_updated_at ON portal_shares;
DROP TRIGGER IF EXISTS set_portal_publications_updated_at ON portal_publications;
DROP TRIGGER IF EXISTS set_portal_review_flows_updated_at ON portal_review_flows;
DROP TRIGGER IF EXISTS set_portals_updated_at ON portals;

DROP TABLE IF EXISTS portal_shares;
DROP TABLE IF EXISTS portal_publications;
DROP TABLE IF EXISTS portal_review_flows;

DROP INDEX IF EXISTS idx_portals_client_id;
DROP INDEX IF EXISTS idx_portals_agency_slug;

ALTER TABLE portals
  DROP CONSTRAINT IF EXISTS portals_agency_id_fkey,
  DROP CONSTRAINT IF EXISTS portals_share_state_chk,
  DROP CONSTRAINT IF EXISTS portals_review_mode_chk,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS last_published_at,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS slug,
  DROP COLUMN IF EXISTS agency_id;
