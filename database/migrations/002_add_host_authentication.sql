BEGIN;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  name varchar(120) NOT NULL,
  email varchar(320) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_unique_idx ON users (lower(email));

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_sessions_user_id_idx ON auth_sessions (user_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth_sessions (expires_at);

ALTER TABLE meetings
  ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE RESTRICT;

CREATE INDEX meetings_created_by_created_at_idx
  ON meetings (created_by, created_at DESC);

CREATE TABLE meeting_members (
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN ('host', 'moderator', 'speaker', 'attendee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meeting_id, user_id)
);

COMMIT;
