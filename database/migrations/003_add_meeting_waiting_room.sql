BEGIN;

CREATE TABLE meeting_admission_requests (
  id uuid PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  display_name varchar(80) NOT NULL,
  token_hash char(64) NOT NULL UNIQUE,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'admitted', 'denied')),
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meeting_admission_requests_pending_idx
  ON meeting_admission_requests (meeting_id, status, requested_at);

COMMIT;
