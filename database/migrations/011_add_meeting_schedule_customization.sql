BEGIN;

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS scheduled_timezone varchar(64) NOT NULL DEFAULT 'UTC';

ALTER TABLE meeting_translation_settings
  ADD COLUMN IF NOT EXISTS transcription_enabled boolean NOT NULL DEFAULT false;

COMMIT;
