BEGIN;

ALTER TABLE meeting_translation_runs
  ADD COLUMN IF NOT EXISTS worker_scope varchar(255) NOT NULL DEFAULT 'legacy',
  DROP CONSTRAINT IF EXISTS meeting_translation_runs_status_check;

ALTER TABLE meeting_translation_runs
  ADD CONSTRAINT meeting_translation_runs_status_check
  CHECK (status IN (
    'queued', 'queued_scoped', 'starting', 'active', 'reconnecting',
    'stopping', 'completed', 'failed'
  ));

DROP INDEX IF EXISTS meeting_translation_runs_one_live_run_idx;

CREATE UNIQUE INDEX meeting_translation_runs_one_live_run_idx
  ON meeting_translation_runs (meeting_id)
  WHERE status IN (
    'queued', 'queued_scoped', 'starting', 'active', 'reconnecting', 'stopping'
  );

CREATE INDEX IF NOT EXISTS meeting_translation_runs_scope_claim_idx
  ON meeting_translation_runs (worker_scope, status, lease_expires_at, created_at);

COMMIT;
