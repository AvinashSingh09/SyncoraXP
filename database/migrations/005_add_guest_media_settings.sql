BEGIN;

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS allow_guest_camera boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_guest_microphone boolean NOT NULL DEFAULT true;

COMMIT;
