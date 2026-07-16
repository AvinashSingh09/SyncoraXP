BEGIN;

CREATE TABLE meetings (
  id uuid PRIMARY KEY,
  join_code varchar(80) NOT NULL UNIQUE,
  livekit_room_name varchar(160) NOT NULL UNIQUE,
  title varchar(160) NOT NULL,
  description text NOT NULL DEFAULT '',
  organizer_name varchar(120) NOT NULL,
  organizer_email varchar(320) NOT NULL,
  scheduled_for timestamptz,
  status varchar(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meeting_invitations (
  id uuid PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  recipient_email varchar(320) NOT NULL,
  recipient_name varchar(120) NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'simulated', 'failed')),
  provider_request_id varchar(255),
  last_error text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, recipient_email)
);

CREATE INDEX meetings_organizer_email_created_at_idx
  ON meetings (organizer_email, created_at DESC);

CREATE INDEX meeting_invitations_meeting_id_idx
  ON meeting_invitations (meeting_id);

COMMIT;
