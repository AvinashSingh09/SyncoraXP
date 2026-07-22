BEGIN;

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS allow_guest_screen_share boolean NOT NULL DEFAULT false;

COMMIT;
