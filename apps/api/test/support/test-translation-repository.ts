import {
  DEFAULT_TRANSLATION_SETTINGS,
  IDLE_TRANSLATION_RUNTIME,
  translationModelForProvider,
  type MeetingTranslationRuntime,
  type MeetingTranslationSettings,
  type TranslationModel,
  type TranslationProvider,
  type UpdateMeetingTranslationInput,
} from "@voice/shared";
import type {
  StoredTranscriptSegment,
  StoredTranslationRun,
  TranslationRepository,
} from "../../src/translation/translation-repository";

function cloneSettings(settings: MeetingTranslationSettings): MeetingTranslationSettings {
  return { ...settings, allowedTargetLanguages: [...settings.allowedTargetLanguages] };
}

export class TestTranslationRepository implements TranslationRepository {
  private readonly settings = new Map<string, MeetingTranslationSettings>();
  private readonly runs = new Map<string, StoredTranslationRun>();
  readonly transcript = new Map<string, StoredTranscriptSegment[]>();

  async getSettings(meetingId: string): Promise<MeetingTranslationSettings> {
    return cloneSettings(this.settings.get(meetingId) ?? DEFAULT_TRANSLATION_SETTINGS);
  }

  async getRuntime(meetingId: string): Promise<MeetingTranslationRuntime> {
    const run = Array.from(this.runs.values())
      .filter((candidate) => candidate.meetingId === meetingId)
      .at(-1);
    if (!run) return { ...IDLE_TRANSLATION_RUNTIME, languages: [] };
    return {
      runId: run.id,
      status: run.status,
      workerConnected: Boolean(run.workerInstanceId && run.lastHeartbeatAt),
      languages: [],
    };
  }

  async updateSettings(
    meetingId: string,
    update: UpdateMeetingTranslationInput,
  ): Promise<MeetingTranslationSettings> {
    const current = await this.getSettings(meetingId);
    const next: MeetingTranslationSettings = {
      ...current,
      ...(update.enabled !== undefined ? { enabled: update.enabled } : {}),
      ...(update.allowedTargetLanguages
        ? { allowedTargetLanguages: [...update.allowedTargetLanguages] }
        : {}),
      ...(update.provider
        ? {
            provider: update.provider,
            model: translationModelForProvider(update.provider),
          }
        : {}),
      ...(update.designatedSpeakerIdentity !== undefined
        ? { designatedSpeakerIdentity: update.designatedSpeakerIdentity }
        : {}),
    };
    this.settings.set(meetingId, next);
    return cloneSettings(next);
  }

  async queueRun(record: {
    id: string;
    meetingId: string;
    livekitRoomName: string;
    speakerParticipantIdentity: string;
    provider: TranslationProvider;
    model: TranslationModel;
  }): Promise<StoredTranslationRun> {
    const existing = Array.from(this.runs.values()).find(
      (run) =>
        run.meetingId === record.meetingId &&
        ["queued", "starting", "active", "reconnecting", "stopping"].includes(run.status),
    );
    if (
      existing &&
      existing.status !== "stopping" &&
      existing.speakerParticipantIdentity === record.speakerParticipantIdentity &&
      existing.provider === record.provider &&
      existing.model === record.model
    ) {
      return existing;
    }
    if (existing) {
      this.runs.set(existing.id, {
        ...existing,
        status: "completed",
        endedAt: new Date(),
        leaseExpiresAt: null,
        errorCode:
          existing.errorCode ??
          (existing.status === "stopping"
            ? "superseded_by_reenable"
            : existing.provider !== record.provider || existing.model !== record.model
              ? "superseded_by_provider_change"
              : "superseded_by_speaker_change"),
      });
    }
    const run: StoredTranslationRun = {
      ...record,
      status: "queued",
      workerInstanceId: null,
      leaseExpiresAt: null,
      startedAt: null,
      endedAt: null,
      lastHeartbeatAt: null,
      errorCode: null,
    };
    this.runs.set(run.id, run);
    return run;
  }

  async requestStop(meetingId: string): Promise<void> {
    for (const [id, run] of this.runs) {
      if (
        run.meetingId === meetingId &&
        ["queued", "starting", "active", "reconnecting"].includes(run.status)
      ) {
        this.runs.set(id, { ...run, status: "stopping" });
      }
    }
  }

  async listTranscript(meetingId: string): Promise<StoredTranscriptSegment[]> {
    return [...(this.transcript.get(meetingId) ?? [])];
  }
}
