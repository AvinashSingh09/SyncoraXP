BEGIN;

ALTER TABLE meeting_translation_settings
ADD COLUMN IF NOT EXISTS subtitles_enabled boolean NOT NULL DEFAULT false;

COMMIT;
