BEGIN;

ALTER TABLE meeting_translation_settings
  DROP CONSTRAINT IF EXISTS meeting_translation_settings_provider_check,
  DROP CONSTRAINT IF EXISTS meeting_translation_settings_model_check;

ALTER TABLE meeting_translation_settings
  ADD CONSTRAINT meeting_translation_settings_provider_model_check
  CHECK (
    (provider = 'openai' AND model = 'gpt-realtime-translate')
    OR
    (provider = 'gemini' AND model = 'gemini-3.5-live-translate-preview')
  );

ALTER TABLE meeting_translation_runs
  ADD COLUMN provider varchar(32) NOT NULL DEFAULT 'openai',
  ADD COLUMN model varchar(80) NOT NULL DEFAULT 'gpt-realtime-translate',
  ADD CONSTRAINT meeting_translation_runs_provider_model_check
  CHECK (
    (provider = 'openai' AND model = 'gpt-realtime-translate')
    OR
    (provider = 'gemini' AND model = 'gemini-3.5-live-translate-preview')
  );

ALTER TABLE meeting_translation_language_usage
  ADD COLUMN provider varchar(32) NOT NULL DEFAULT 'openai',
  ADD COLUMN model varchar(80) NOT NULL DEFAULT 'gpt-realtime-translate',
  ADD CONSTRAINT meeting_translation_language_usage_provider_model_check
  CHECK (
    (provider = 'openai' AND model = 'gpt-realtime-translate')
    OR
    (provider = 'gemini' AND model = 'gemini-3.5-live-translate-preview')
  );

COMMIT;
