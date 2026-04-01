-- +goose Up
ALTER TABLE briefs
  ADD COLUMN agency_id UUID,
  ADD COLUMN created_by_user_id UUID,
  ADD COLUMN source_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN next_action TEXT NOT NULL DEFAULT '',
  ADD COLUMN launched_at TIMESTAMPTZ,
  ADD CONSTRAINT briefs_status_chk CHECK (status IN ('new', 'processing', 'ready', 'blocked', 'launched', 'archived')),
  ADD CONSTRAINT briefs_source_type_chk CHECK (source_type IN ('manual', 'upload', 'email', 'api'));

UPDATE briefs b
SET agency_id = c.agency_id
FROM clients c
WHERE c.id = b.client_id
  AND b.agency_id IS NULL;

ALTER TABLE briefs
  ALTER COLUMN agency_id SET NOT NULL,
  ADD CONSTRAINT briefs_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  ADD CONSTRAINT briefs_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_briefs_agency_id_created_at ON briefs (agency_id, created_at DESC);
CREATE INDEX idx_briefs_client_id_status ON briefs (client_id, status);

CREATE TABLE brief_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  byte_size BIGINT NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brief_documents_brief_id ON brief_documents (brief_id);

CREATE TABLE brief_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT brief_status_history_to_status_chk CHECK (to_status IN ('new', 'processing', 'ready', 'blocked', 'launched', 'archived'))
);

INSERT INTO brief_status_history (brief_id, from_status, to_status, note, created_at)
SELECT
  b.id,
  NULL,
  b.status,
  'Initial imported state',
  b.created_at
FROM briefs b;

CREATE INDEX idx_brief_status_history_brief_id_created_at ON brief_status_history (brief_id, created_at DESC);

CREATE TRIGGER set_briefs_updated_at
BEFORE UPDATE ON briefs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS set_briefs_updated_at ON briefs;

DROP TABLE IF EXISTS brief_status_history;
DROP TABLE IF EXISTS brief_documents;

DROP INDEX IF EXISTS idx_briefs_client_id_status;
DROP INDEX IF EXISTS idx_briefs_agency_id_created_at;

ALTER TABLE briefs
  DROP CONSTRAINT IF EXISTS briefs_created_by_user_id_fkey,
  DROP CONSTRAINT IF EXISTS briefs_agency_id_fkey,
  DROP CONSTRAINT IF EXISTS briefs_source_type_chk,
  DROP CONSTRAINT IF EXISTS briefs_status_chk,
  DROP COLUMN IF EXISTS launched_at,
  DROP COLUMN IF EXISTS next_action,
  DROP COLUMN IF EXISTS source_type,
  DROP COLUMN IF EXISTS created_by_user_id,
  DROP COLUMN IF EXISTS agency_id;
