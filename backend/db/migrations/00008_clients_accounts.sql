-- +goose Up
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_slug_key;

ALTER TABLE clients
  ADD COLUMN agency_id UUID,
  ADD COLUMN owner_user_id UUID,
  ADD COLUMN mrr_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN open_approvals_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_touchpoint_at TIMESTAMPTZ,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD CONSTRAINT clients_health_chk CHECK (health IN ('strong', 'watch', 'risk'));

-- +goose StatementBegin
DO $$
DECLARE
  default_agency_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM clients WHERE agency_id IS NULL) THEN
    SELECT id INTO default_agency_id
    FROM agencies
    ORDER BY created_at
    LIMIT 1;

    IF default_agency_id IS NULL THEN
      INSERT INTO agencies (name, slug)
      VALUES ('AgencyForge Starter', 'agencyforge-starter')
      RETURNING id INTO default_agency_id;
    END IF;

    UPDATE clients
    SET agency_id = default_agency_id
    WHERE agency_id IS NULL;
  END IF;
END
$$;
-- +goose StatementEnd

ALTER TABLE clients
  ALTER COLUMN agency_id SET NOT NULL,
  ADD CONSTRAINT clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  ADD CONSTRAINT clients_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_clients_agency_slug ON clients (agency_id, slug);
CREATE INDEX idx_clients_owner_user_id ON clients (owner_user_id);
CREATE INDEX idx_clients_agency_id_created_at ON clients (agency_id, created_at DESC);

CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_contacts_client_email_key UNIQUE (client_id, email)
);

INSERT INTO client_contacts (client_id, name, email, role, is_primary, created_at, updated_at)
SELECT
  c.id,
  c.name || ' Primary Contact',
  c.lead_email,
  'lead',
  TRUE,
  c.created_at,
  c.updated_at
FROM clients c
ON CONFLICT (client_id, email) DO NOTHING;

CREATE INDEX idx_client_contacts_client_id ON client_contacts (client_id);

CREATE TABLE client_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_touchpoints_client_id_happened_at ON client_touchpoints (client_id, happened_at DESC);

CREATE TRIGGER set_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_client_contacts_updated_at
BEFORE UPDATE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS set_client_contacts_updated_at ON client_contacts;
DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;

DROP TABLE IF EXISTS client_touchpoints;
DROP TABLE IF EXISTS client_contacts;

DROP INDEX IF EXISTS idx_clients_agency_id_created_at;
DROP INDEX IF EXISTS idx_clients_owner_user_id;
DROP INDEX IF EXISTS idx_clients_agency_slug;

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_owner_user_id_fkey,
  DROP CONSTRAINT IF EXISTS clients_agency_id_fkey,
  DROP CONSTRAINT IF EXISTS clients_health_chk,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS last_touchpoint_at,
  DROP COLUMN IF EXISTS open_approvals_count,
  DROP COLUMN IF EXISTS mrr_cents,
  DROP COLUMN IF EXISTS owner_user_id,
  DROP COLUMN IF EXISTS agency_id;

ALTER TABLE clients
  ADD CONSTRAINT clients_slug_key UNIQUE (slug);
