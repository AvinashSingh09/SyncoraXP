BEGIN;

CREATE TABLE IF NOT EXISTS meeting_transcript_segments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES meeting_translation_runs(id) ON DELETE CASCADE,
  speaker_identity text NOT NULL,
  text text NOT NULL CHECK (length(btrim(text)) > 0),
  spoken_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_transcript_segments_meeting_spoken_at_idx
  ON meeting_transcript_segments (meeting_id, spoken_at, id);

ALTER TABLE meeting_transcript_segments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE meeting_transcript_segments FROM anon, authenticated;
REVOKE ALL ON SEQUENCE meeting_transcript_segments_id_seq FROM anon, authenticated;

COMMIT;
