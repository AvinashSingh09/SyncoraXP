import type {
  MeetingTranslationRuntime,
  MeetingTranslationSettings,
  TranslationModel,
  TranslationProvider,
  TranslationRunStatus,
  UpdateMeetingTranslationInput,
} from "@voice/shared";

export interface StoredTranslationRun {
  id: string;
  meetingId: string;
  livekitRoomName: string;
  status: Exclude<TranslationRunStatus, "idle">;
  workerInstanceId: string | null;
  leaseExpiresAt: Date | null;
  speakerParticipantIdentity: string;
  provider: TranslationProvider;
  model: TranslationModel;
  startedAt: Date | null;
  endedAt: Date | null;
  lastHeartbeatAt: Date | null;
  errorCode: string | null;
}

export interface TranslationJob extends StoredTranslationRun {
  settings: MeetingTranslationSettings;
}

export interface TranslationRepository {
  getSettings(meetingId: string): Promise<MeetingTranslationSettings>;
  getRuntime(meetingId: string): Promise<MeetingTranslationRuntime>;
  updateSettings(
    meetingId: string,
    update: UpdateMeetingTranslationInput,
  ): Promise<MeetingTranslationSettings>;
  queueRun(record: {
    id: string;
    meetingId: string;
    livekitRoomName: string;
    speakerParticipantIdentity: string;
    provider: TranslationProvider;
    model: TranslationModel;
  }): Promise<StoredTranslationRun>;
  requestStop(meetingId: string): Promise<void>;
}
