BEGIN;

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS waiting_room_enabled boolean NOT NULL DEFAULT true;

COMMIT;
