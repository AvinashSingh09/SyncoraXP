BEGIN;

ALTER TABLE meetings
  ADD COLUMN is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN waiting_room_enabled boolean NOT NULL DEFAULT true;

COMMIT;
