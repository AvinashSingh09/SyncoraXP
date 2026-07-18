BEGIN;

CREATE TABLE meeting_translation_settings (
  meeting_id uuid PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  source_language varchar(8) NOT NULL DEFAULT 'en'
    CHECK (source_language = 'en'),
  allowed_target_languages text[] NOT NULL DEFAULT ARRAY['hi', 'bn', 'mr', 'ta', 'te']::text[],
  provider varchar(32) NOT NULL DEFAULT 'openai'
    CHECK (provider = 'openai'),
  model varchar(80) NOT NULL DEFAULT 'gpt-realtime-translate'
    CHECK (model = 'gpt-realtime-translate'),
  designated_speaker_identity varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(allowed_target_languages) BETWEEN 1 AND 5),
  CHECK (allowed_target_languages <@ ARRAY['hi', 'bn', 'mr', 'ta', 'te']::text[])
);

CREATE TABLE meeting_translation_runs (
  id uuid PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  livekit_room_name varchar(160) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN (
      'queued', 'starting', 'active', 'reconnecting', 'stopping', 'completed', 'failed'
    )),
  worker_instance_id varchar(160),
  lease_expires_at timestamptz,
  speaker_participant_identity varchar(255) NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  last_heartbeat_at timestamptz,
  error_code varchar(120),
  error_detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX meeting_translation_runs_one_live_run_idx
  ON meeting_translation_runs (meeting_id)
  WHERE status IN ('queued', 'starting', 'active', 'reconnecting', 'stopping');

CREATE INDEX meeting_translation_runs_claim_idx
  ON meeting_translation_runs (status, lease_expires_at, created_at);

CREATE TABLE meeting_translation_language_usage (
  id bigserial PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES meeting_translation_runs(id) ON DELETE CASCADE,
  target_language varchar(8) NOT NULL
    CHECK (target_language IN ('hi', 'bn', 'mr', 'ta', 'te')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  billed_audio_seconds numeric(14, 3) NOT NULL DEFAULT 0 CHECK (billed_audio_seconds >= 0),
  reconnect_count integer NOT NULL DEFAULT 0 CHECK (reconnect_count >= 0),
  first_audio_latency_ms_p50 integer,
  first_audio_latency_ms_p95 integer,
  max_queue_depth_ms integer,
  failure_code varchar(120)
);

CREATE INDEX meeting_translation_language_usage_run_idx
  ON meeting_translation_language_usage (run_id, target_language);

COMMIT;
