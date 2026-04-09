-- +goose Up
CREATE TABLE operator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT operator_invites_role_chk CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

CREATE UNIQUE INDEX operator_invites_active_email_idx
  ON operator_invites (agency_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX idx_operator_invites_agency_created_at
  ON operator_invites (agency_id, created_at DESC);

CREATE INDEX idx_operator_invites_token_hash
  ON operator_invites (token_hash);

-- +goose Down
DROP INDEX IF EXISTS idx_operator_invites_token_hash;
DROP INDEX IF EXISTS idx_operator_invites_agency_created_at;
DROP INDEX IF EXISTS operator_invites_active_email_idx;
DROP TABLE IF EXISTS operator_invites;
