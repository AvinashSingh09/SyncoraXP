import type { Pool, PoolClient } from "pg";
import type {
  DeliveryUpdate,
  MeetingRepository,
  NewMeetingRecord,
  StoredAdmissionRequest,
  StoredInvitation,
  StoredMeeting,
} from "./meeting-repository";

interface MeetingRow {
  id: string;
  join_code: string;
  livekit_room_name: string;
  title: string;
  description: string;
  organizer_name: string;
  organizer_email: string;
  created_by: string | null;
  scheduled_for: Date | null;
  status: StoredMeeting["status"];
  is_locked: boolean;
  waiting_room_enabled: boolean;
  created_at: Date;
}

interface InvitationRow {
  id: string;
  meeting_id: string;
  recipient_email: string;
  recipient_name: string;
  status: StoredInvitation["status"];
  provider_request_id: string | null;
  last_error: string | null;
}

interface AdmissionRow {
  id: string;
  meeting_id: string;
  display_name: string;
  token_hash: string;
  status: StoredAdmissionRequest["status"];
  requested_at: Date;
  decided_at: Date | null;
}

function mapMeeting(row: MeetingRow): StoredMeeting {
  return {
    id: row.id,
    joinCode: row.join_code,
    livekitRoomName: row.livekit_room_name,
    title: row.title,
    description: row.description,
    organizerName: row.organizer_name,
    organizerEmail: row.organizer_email,
    createdBy: row.created_by,
    scheduledFor: row.scheduled_for,
    status: row.status,
    isLocked: row.is_locked,
    waitingRoomEnabled: row.waiting_room_enabled,
    createdAt: row.created_at,
  };
}

function mapInvitation(row: InvitationRow): StoredInvitation {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    status: row.status,
    providerRequestId: row.provider_request_id,
    lastError: row.last_error,
  };
}

function mapAdmission(row: AdmissionRow): StoredAdmissionRequest {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    displayName: row.display_name,
    tokenHash: row.token_hash,
    status: row.status,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
  };
}

export class PostgresMeetingRepository implements MeetingRepository {
  constructor(private readonly pool: Pool) {}

  async createMeeting(record: NewMeetingRecord) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const meeting = await this.insertMeeting(client, record);
      const invitations: StoredInvitation[] = [];

      for (const invitation of record.invitations) {
        const result = await client.query<InvitationRow>(
          `INSERT INTO meeting_invitations
            (id, meeting_id, recipient_email, recipient_name)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [invitation.id, record.id, invitation.email, invitation.name],
        );
        const row = result.rows[0];
        if (row) invitations.push(mapInvitation(row));
      }

      await client.query(
        `INSERT INTO meeting_members (meeting_id, user_id, role)
         VALUES ($1, $2, 'host')`,
        [record.id, record.creator.id],
      );

      await client.query("COMMIT");
      return { meeting, invitations };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertMeeting(client: PoolClient, record: NewMeetingRecord) {
    const result = await client.query<MeetingRow>(
      `INSERT INTO meetings
        (id, join_code, livekit_room_name, title, description, organizer_name,
         organizer_email, scheduled_for, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        record.id,
        record.joinCode,
        record.livekitRoomName,
        record.input.title,
        record.input.description,
        record.creator.name,
        record.creator.email,
        record.input.scheduledFor ? new Date(record.input.scheduledFor) : null,
        record.creator.id,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Meeting insert did not return a row");
    return mapMeeting(row);
  }

  async updateInvitationDelivery(invitationId: string, update: DeliveryUpdate): Promise<void> {
    await this.pool.query(
      `UPDATE meeting_invitations
       SET status = $2::text,
           provider_request_id = $3,
           last_error = $4,
           attempt_count = attempt_count + 1,
           sent_at = CASE
             WHEN $2::text IN ('sent', 'simulated') THEN now()
             ELSE sent_at
           END,
           updated_at = now()
       WHERE id = $1`,
      [invitationId, update.status, update.providerRequestId ?? null, update.error ?? null],
    );
  }

  async findByJoinCode(joinCode: string): Promise<StoredMeeting | null> {
    const result = await this.pool.query<MeetingRow>(
      "SELECT * FROM meetings WHERE join_code = $1 LIMIT 1",
      [joinCode],
    );
    return result.rows[0] ? mapMeeting(result.rows[0]) : null;
  }

  async findByIdForHost(meetingId: string, userId: string): Promise<StoredMeeting | null> {
    const result = await this.pool.query<MeetingRow>(
      `SELECT meetings.*
       FROM meetings
       JOIN meeting_members ON meeting_members.meeting_id = meetings.id
       WHERE meetings.id = $1 AND meeting_members.user_id = $2
         AND meeting_members.role IN ('host', 'moderator')
       LIMIT 1`,
      [meetingId, userId],
    );
    return result.rows[0] ? mapMeeting(result.rows[0]) : null;
  }

  async updateSettingsForHost(
    meetingId: string,
    userId: string,
    settings: { isLocked?: boolean; waitingRoomEnabled?: boolean },
  ): Promise<StoredMeeting | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<MeetingRow>(
        `UPDATE meetings
         SET is_locked = COALESCE($3, is_locked),
             waiting_room_enabled = COALESCE($4, waiting_room_enabled),
             updated_at = now()
         WHERE id = $1
           AND EXISTS (
             SELECT 1 FROM meeting_members
             WHERE meeting_id = meetings.id
               AND user_id = $2
               AND role IN ('host', 'moderator')
           )
         RETURNING *`,
        [meetingId, userId, settings.isLocked ?? null, settings.waitingRoomEnabled ?? null],
      );
      const row = result.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return null;
      }
      if (settings.waitingRoomEnabled === false) {
        await client.query(
          `UPDATE meeting_admission_requests
           SET status = 'admitted', decided_at = now(), updated_at = now()
           WHERE meeting_id = $1 AND status = 'pending'`,
          [meetingId],
        );
      }
      await client.query("COMMIT");
      return mapMeeting(row);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async endForHost(meetingId: string, userId: string): Promise<StoredMeeting | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<MeetingRow>(
        `UPDATE meetings
         SET status = 'ended', updated_at = now()
         WHERE id = $1
           AND EXISTS (
             SELECT 1 FROM meeting_members
             WHERE meeting_id = meetings.id
               AND user_id = $2
               AND role IN ('host', 'moderator')
           )
         RETURNING *`,
        [meetingId, userId],
      );
      const row = result.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        `UPDATE meeting_admission_requests
         SET status = 'denied', decided_at = now(), updated_at = now()
         WHERE meeting_id = $1 AND status = 'pending'`,
        [meetingId],
      );
      await client.query("COMMIT");
      return mapMeeting(row);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listByOwner(userId: string): Promise<StoredMeeting[]> {
    const result = await this.pool.query<MeetingRow>(
      `SELECT meetings.*
       FROM meetings
       JOIN meeting_members ON meeting_members.meeting_id = meetings.id
       WHERE meeting_members.user_id = $1 AND meeting_members.role = 'host'
       ORDER BY meetings.created_at DESC`,
      [userId],
    );
    return result.rows.map(mapMeeting);
  }

  async deleteByOwner(meetingId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM meetings
       WHERE id = $1 AND created_by = $2`,
      [meetingId, userId],
    );
    return result.rowCount === 1;
  }

  async createAdmissionRequest(record: {
    id: string;
    meetingId: string;
    displayName: string;
    tokenHash: string;
    status?: StoredAdmissionRequest["status"];
  }): Promise<StoredAdmissionRequest> {
    const result = await this.pool.query<AdmissionRow>(
      `INSERT INTO meeting_admission_requests
        (id, meeting_id, display_name, token_hash, status, decided_at)
       VALUES (
         $1, $2, $3, $4, $5::varchar(20),
         CASE WHEN $5::varchar(20) = 'admitted' THEN now() ELSE NULL END
       )
       RETURNING *`,
      [record.id, record.meetingId, record.displayName, record.tokenHash, record.status ?? "pending"],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Admission request insert did not return a row");
    return mapAdmission(row);
  }

  async findAdmissionRequest(
    meetingId: string,
    admissionId: string,
    tokenHash: string,
  ): Promise<StoredAdmissionRequest | null> {
    const result = await this.pool.query<AdmissionRow>(
      `SELECT * FROM meeting_admission_requests
       WHERE id = $1 AND meeting_id = $2 AND token_hash = $3
       LIMIT 1`,
      [admissionId, meetingId, tokenHash],
    );
    return result.rows[0] ? mapAdmission(result.rows[0]) : null;
  }

  async listPendingAdmissionRequests(
    meetingId: string,
    userId: string,
  ): Promise<StoredAdmissionRequest[]> {
    const result = await this.pool.query<AdmissionRow>(
      `SELECT admission.*
       FROM meeting_admission_requests admission
       JOIN meeting_members members ON members.meeting_id = admission.meeting_id
       WHERE admission.meeting_id = $1
         AND admission.status = 'pending'
         AND members.user_id = $2
         AND members.role IN ('host', 'moderator')
       ORDER BY admission.requested_at ASC`,
      [meetingId, userId],
    );
    return result.rows.map(mapAdmission);
  }

  async decideAdmissionRequest(
    meetingId: string,
    admissionId: string,
    userId: string,
    decision: "admitted" | "denied",
  ): Promise<StoredAdmissionRequest | null> {
    const result = await this.pool.query<AdmissionRow>(
      `UPDATE meeting_admission_requests admission
       SET status = $4,
           decided_by = $3,
           decided_at = now(),
           updated_at = now()
       WHERE admission.id = $1
         AND admission.meeting_id = $2
         AND admission.status = 'pending'
         AND EXISTS (
           SELECT 1 FROM meeting_members members
           WHERE members.meeting_id = admission.meeting_id
             AND members.user_id = $3
             AND members.role IN ('host', 'moderator')
         )
       RETURNING admission.*`,
      [admissionId, meetingId, userId, decision],
    );
    return result.rows[0] ? mapAdmission(result.rows[0]) : null;
  }
}
