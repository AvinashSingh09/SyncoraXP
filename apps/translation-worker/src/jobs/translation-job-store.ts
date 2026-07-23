import {
  DEFAULT_TRANSLATION_SETTINGS,
  type MeetingTranslationSettings,
  type TranslationLanguageCode,
  type TranslationModel,
  type TranslationProvider,
} from "@voice/shared";
import type { Pool } from "pg";

export type WorkerRunStatus =
  | "queued"
  | "queued_scoped"
  | "starting"
  | "starting_scoped"
  | "active"
  | "active_scoped"
  | "reconnecting"
  | "reconnecting_scoped"
  | "stopping"
  | "stopping_scoped"
  | "completed"
  | "failed";

interface JobRow {
  id: string;
  meeting_id: string;
  livekit_room_name: string;
  status: WorkerRunStatus;
  speaker_participant_identity: string;
  provider: TranslationProvider;
  model: TranslationModel;
}

interface SettingsRow {
  enabled: boolean;
  source_language: "en";
  allowed_target_languages: TranslationLanguageCode[];
  provider: TranslationProvider;
  model: TranslationModel;
  designated_speaker_identity: string | null;
}

export interface ClaimedTranslationJob {
  id: string;
  meetingId: string;
  livekitRoomName: string;
  status: WorkerRunStatus;
  speakerParticipantIdentity: string;
  settings: MeetingTranslationSettings;
}

export class TranslationJobStore {
  constructor(private readonly pool: Pool) {}

  async claimNext(
    workerInstanceId: string,
    leaseMs: number,
    workerScope: string,
  ): Promise<ClaimedTranslationJob | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<JobRow>(
        `WITH candidate AS (
           SELECT run.id
           FROM meeting_translation_runs run
           JOIN meeting_translation_settings settings
             ON settings.meeting_id = run.meeting_id
           WHERE run.worker_scope = $3
             AND (
               run.status = 'queued_scoped'
              OR (
                run.status IN ('starting_scoped', 'active_scoped', 'reconnecting_scoped')
                AND run.lease_expires_at IS NOT NULL
                AND run.lease_expires_at < now()
              )
              OR (
                run.status = 'stopping_scoped'
                AND settings.enabled = true
                AND (
                  run.worker_instance_id IS NULL
                  OR run.lease_expires_at IS NULL
                  OR run.lease_expires_at < now()
                )
              )
             )
           ORDER BY run.created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE meeting_translation_runs run
         SET status = 'starting_scoped',
             worker_instance_id = $1,
             lease_expires_at = now() + ($2::text || ' milliseconds')::interval,
             last_heartbeat_at = now(),
             started_at = COALESCE(started_at, now()),
             updated_at = now()
         FROM candidate
         WHERE run.id = candidate.id
         RETURNING run.id, run.meeting_id, run.livekit_room_name, run.status,
                   run.speaker_participant_identity, run.provider, run.model`,
        [workerInstanceId, leaseMs, workerScope],
      );
      const row = result.rows[0];
      if (!row) {
        await client.query("COMMIT");
        return null;
      }
      const settingsResult = await client.query<SettingsRow>(
        "SELECT * FROM meeting_translation_settings WHERE meeting_id = $1 LIMIT 1",
        [row.meeting_id],
      );
      await client.query("COMMIT");
      const settingsRow = settingsResult.rows[0];
      const settings: MeetingTranslationSettings = settingsRow
        ? {
            enabled: settingsRow.enabled,
            sourceLanguage: settingsRow.source_language,
            allowedTargetLanguages: [...settingsRow.allowed_target_languages],
            provider: row.provider,
            model: row.model,
            designatedSpeakerIdentity: settingsRow.designated_speaker_identity,
          }
        : {
            ...DEFAULT_TRANSLATION_SETTINGS,
            allowedTargetLanguages: [...DEFAULT_TRANSLATION_SETTINGS.allowedTargetLanguages],
          };
      return {
        id: row.id,
        meetingId: row.meeting_id,
        livekitRoomName: row.livekit_room_name,
        status: row.status,
        speakerParticipantIdentity: row.speaker_participant_identity,
        settings,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async heartbeat(
    runId: string,
    workerInstanceId: string,
    status: "active" | "reconnecting",
    leaseMs: number,
  ): Promise<{ status: WorkerRunStatus; enabled: boolean } | null> {
    const result = await this.pool.query<{ status: WorkerRunStatus; enabled: boolean }>(
      `UPDATE meeting_translation_runs run
       SET status = CASE WHEN run.status = 'stopping_scoped' THEN run.status ELSE $3 END,
           lease_expires_at = now() + ($4::text || ' milliseconds')::interval,
           last_heartbeat_at = now(),
           updated_at = now()
       FROM meeting_translation_settings settings
       WHERE run.id = $1
         AND run.worker_instance_id = $2
         AND run.status IN (
           'starting_scoped', 'active_scoped', 'reconnecting_scoped', 'stopping_scoped'
         )
         AND settings.meeting_id = run.meeting_id
       RETURNING run.status, settings.enabled`,
      [runId, workerInstanceId, `${status}_scoped`, leaseMs],
    );
    return result.rows[0] ?? null;
  }

  async complete(
    runId: string,
    workerInstanceId: string,
    status: "completed" | "failed",
    error?: { code: string; detail: string },
  ): Promise<void> {
    await this.pool.query(
      `UPDATE meeting_translation_runs
       SET status = $3,
           ended_at = now(),
           lease_expires_at = NULL,
           updated_at = now(),
           error_code = $4,
           error_detail = $5
       WHERE id = $1
         AND worker_instance_id = $2
         AND status IN (
           'starting_scoped', 'active_scoped', 'reconnecting_scoped', 'stopping_scoped'
         )`,
      [runId, workerInstanceId, status, error?.code ?? null, error?.detail ?? null],
    );
  }

  async release(runId: string, workerInstanceId: string): Promise<void> {
    await this.pool.query(
      `UPDATE meeting_translation_runs
       SET status = 'queued_scoped',
           worker_instance_id = NULL,
           lease_expires_at = NULL,
           updated_at = now()
       WHERE id = $1
         AND worker_instance_id = $2
         AND status IN (
           'starting_scoped', 'active_scoped', 'reconnecting_scoped', 'stopping_scoped'
         )`,
      [runId, workerInstanceId],
    );
  }

  async appendTranscript(
    meetingId: string,
    runId: string,
    speakerIdentity: string,
    text: string,
  ): Promise<void> {
    if (!text.trim()) return;
    await this.pool.query(
      `INSERT INTO meeting_transcript_segments (
         meeting_id, run_id, speaker_identity, text
       ) VALUES ($1, $2, $3, $4)`,
      [meetingId, runId, speakerIdentity, text],
    );
  }
}
