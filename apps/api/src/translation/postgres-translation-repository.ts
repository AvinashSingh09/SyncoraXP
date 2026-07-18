import {
  DEFAULT_TRANSLATION_SETTINGS,
  IDLE_TRANSLATION_RUNTIME,
  translationModelForProvider,
  type MeetingTranslationRuntime,
  type MeetingTranslationSettings,
  type TranslationLanguageCode,
  type TranslationModel,
  type TranslationProvider,
  type UpdateMeetingTranslationInput,
} from "@voice/shared";
import type { Pool, PoolClient } from "pg";
import type {
  StoredTranslationRun,
  TranslationRepository,
} from "./translation-repository";

interface TranslationSettingsRow {
  enabled: boolean;
  source_language: "en";
  allowed_target_languages: TranslationLanguageCode[];
  provider: TranslationProvider;
  model: TranslationModel;
  designated_speaker_identity: string | null;
}

interface TranslationRunRow {
  id: string;
  meeting_id: string;
  livekit_room_name: string;
  status: StoredTranslationRun["status"];
  worker_instance_id: string | null;
  lease_expires_at: Date | null;
  speaker_participant_identity: string;
  provider: TranslationProvider;
  model: TranslationModel;
  started_at: Date | null;
  ended_at: Date | null;
  last_heartbeat_at: Date | null;
  error_code: string | null;
}

function mapSettings(row?: TranslationSettingsRow): MeetingTranslationSettings {
  if (!row) {
    return {
      ...DEFAULT_TRANSLATION_SETTINGS,
      allowedTargetLanguages: [...DEFAULT_TRANSLATION_SETTINGS.allowedTargetLanguages],
    };
  }
  return {
    enabled: row.enabled,
    sourceLanguage: row.source_language,
    allowedTargetLanguages: [...row.allowed_target_languages],
    provider: row.provider,
    model: row.model,
    designatedSpeakerIdentity: row.designated_speaker_identity,
  };
}

function mapRun(row: TranslationRunRow): StoredTranslationRun {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    livekitRoomName: row.livekit_room_name,
    status: row.status,
    workerInstanceId: row.worker_instance_id,
    leaseExpiresAt: row.lease_expires_at,
    speakerParticipantIdentity: row.speaker_participant_identity,
    provider: row.provider,
    model: row.model,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    lastHeartbeatAt: row.last_heartbeat_at,
    errorCode: row.error_code,
  };
}

export class PostgresTranslationRepository implements TranslationRepository {
  constructor(private readonly pool: Pool) {}

  async getSettings(meetingId: string): Promise<MeetingTranslationSettings> {
    const result = await this.pool.query<TranslationSettingsRow>(
      "SELECT * FROM meeting_translation_settings WHERE meeting_id = $1 LIMIT 1",
      [meetingId],
    );
    return mapSettings(result.rows[0]);
  }

  async getRuntime(meetingId: string): Promise<MeetingTranslationRuntime> {
    const result = await this.pool.query<TranslationRunRow>(
      `SELECT * FROM meeting_translation_runs
       WHERE meeting_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [meetingId],
    );
    const row = result.rows[0];
    if (!row) return { ...IDLE_TRANSLATION_RUNTIME, languages: [] };
    const run = mapRun(row);
    return {
      runId: run.id,
      status: run.status,
      workerConnected: Boolean(
        run.workerInstanceId &&
          run.lastHeartbeatAt &&
          Date.now() - run.lastHeartbeatAt.getTime() < 30_000,
      ),
      languages: [],
    };
  }

  async updateSettings(
    meetingId: string,
    update: UpdateMeetingTranslationInput,
  ): Promise<MeetingTranslationSettings> {
    const result = await this.pool.query<TranslationSettingsRow>(
      `INSERT INTO meeting_translation_settings (
         meeting_id, enabled, allowed_target_languages, designated_speaker_identity,
         provider, model
       ) VALUES (
         $1,
         COALESCE($2, false),
         COALESCE($3::text[], ARRAY['hi', 'bn', 'mr', 'ta', 'te']::text[]),
         $4,
         COALESCE($6, 'openai'),
         COALESCE($7, 'gpt-realtime-translate')
       )
       ON CONFLICT (meeting_id) DO UPDATE SET
         enabled = COALESCE($2, meeting_translation_settings.enabled),
         allowed_target_languages = COALESCE(
           $3::text[], meeting_translation_settings.allowed_target_languages
         ),
         designated_speaker_identity = CASE
           WHEN $5::boolean THEN $4
           ELSE meeting_translation_settings.designated_speaker_identity
         END,
         provider = COALESCE($6, meeting_translation_settings.provider),
         model = COALESCE($7, meeting_translation_settings.model),
         updated_at = now()
       RETURNING *`,
      [
        meetingId,
        update.enabled ?? null,
        update.allowedTargetLanguages ?? null,
        update.designatedSpeakerIdentity ?? null,
        update.designatedSpeakerIdentity !== undefined,
        update.provider ?? null,
        update.provider ? translationModelForProvider(update.provider) : null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Translation settings update did not return a row");
    return mapSettings(row);
  }

  async queueRun(record: {
    id: string;
    meetingId: string;
    livekitRoomName: string;
    speakerParticipantIdentity: string;
    provider: TranslationProvider;
    model: TranslationModel;
  }): Promise<StoredTranslationRun> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [record.meetingId]);
      const existing = await this.findLiveRun(client, record.meetingId);
      if (
        existing &&
        existing.status !== "stopping" &&
        existing.speakerParticipantIdentity === record.speakerParticipantIdentity &&
        existing.provider === record.provider &&
        existing.model === record.model
      ) {
        await client.query("COMMIT");
        return existing;
      }
      if (existing) {
        const replacementReason =
          existing.status === "stopping"
            ? "superseded_by_reenable"
            : existing.provider !== record.provider || existing.model !== record.model
              ? "superseded_by_provider_change"
              : "superseded_by_speaker_change";
        await client.query(
          `UPDATE meeting_translation_runs
           SET status = 'completed',
               ended_at = COALESCE(ended_at, now()),
               lease_expires_at = NULL,
               updated_at = now(),
               error_code = COALESCE(error_code, $2)
           WHERE id = $1`,
          [existing.id, replacementReason],
        );
      }
      const result = await client.query<TranslationRunRow>(
        `INSERT INTO meeting_translation_runs (
           id, meeting_id, livekit_room_name, speaker_participant_identity, provider, model
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          record.id,
          record.meetingId,
          record.livekitRoomName,
          record.speakerParticipantIdentity,
          record.provider,
          record.model,
        ],
      );
      await client.query("COMMIT");
      const row = result.rows[0];
      if (!row) throw new Error("Translation run insert did not return a row");
      return mapRun(row);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async findLiveRun(
    client: PoolClient,
    meetingId: string,
  ): Promise<StoredTranslationRun | null> {
    const result = await client.query<TranslationRunRow>(
      `SELECT * FROM meeting_translation_runs
       WHERE meeting_id = $1
         AND status IN ('queued', 'starting', 'active', 'reconnecting', 'stopping')
       ORDER BY created_at DESC
       LIMIT 1`,
      [meetingId],
    );
    return result.rows[0] ? mapRun(result.rows[0]) : null;
  }

  async requestStop(meetingId: string): Promise<void> {
    await this.pool.query(
      `UPDATE meeting_translation_runs
       SET status = 'stopping', updated_at = now()
       WHERE meeting_id = $1
         AND status IN ('queued', 'starting', 'active', 'reconnecting')`,
      [meetingId],
    );
  }
}
