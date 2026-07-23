BEGIN;

ALTER TABLE meeting_translation_runs
  DROP CONSTRAINT IF EXISTS meeting_translation_runs_status_check;

ALTER TABLE meeting_translation_runs
  ADD CONSTRAINT meeting_translation_runs_status_check
  CHECK (status IN (
    'queued', 'queued_scoped',
    'starting', 'starting_scoped',
    'active', 'active_scoped',
    'reconnecting', 'reconnecting_scoped',
    'stopping', 'stopping_scoped',
    'completed', 'failed'
  ));

DROP INDEX IF EXISTS meeting_translation_runs_one_live_run_idx;

CREATE UNIQUE INDEX meeting_translation_runs_one_live_run_idx
  ON meeting_translation_runs (meeting_id)
  WHERE status IN (
    'queued', 'queued_scoped',
    'starting', 'starting_scoped',
    'active', 'active_scoped',
    'reconnecting', 'reconnecting_scoped',
    'stopping', 'stopping_scoped'
  );

COMMIT;
