import { createHash } from "node:crypto";
import {
  TranslationDataMessageSchema,
  type TranslationDataMessage,
  type TranslationLanguageCode,
  type TranslationLanguageStatus,
} from "@voice/shared";
import {
  AudioStream,
  Room,
  RoomEvent,
  TrackKind,
  TrackSource,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "@livekit/rtc-node";
import { AccessToken, TrackSource as ServerTrackSource } from "livekit-server-sdk";
import { RealtimePcmPump } from "../audio/realtime-pcm-pump";
import type { TranslationWorkerConfig } from "../config";
import { TranslationTrackPublisher } from "../livekit/translation-track-publisher";
import { FakeTranslationSession } from "../providers/fake-translation-session";
import { GeminiTranslationSession } from "../providers/gemini-translation-session";
import { OpenAITranslationSession } from "../providers/openai-translation-session";
import type { TranslationSessionFactory } from "../providers/translation-session";
import { LanguageSessionManager } from "../sessions/language-session-manager";
import type { ClaimedTranslationJob } from "./translation-job-store";
import { TranslationJobStore } from "./translation-job-store";

const DATA_TOPIC = "syncoraxp.translation";

export class TranslationJobRunner {
  private readonly room = new Room();
  private stopped = false;
  private sourceStream: AudioStream | null = null;
  private sourceReader: ReadableStreamDefaultReader<import("@livekit/rtc-node").AudioFrame> | null = null;
  private readonly backgroundTasks = new Set<Promise<void>>();
  private sequence = 0;

  constructor(
    private readonly job: ClaimedTranslationJob,
    private readonly workerInstanceId: string,
    private readonly config: TranslationWorkerConfig,
    private readonly store: TranslationJobStore,
  ) {}

  async run(): Promise<void> {
    const sourceCaptionLanguage = this.job.settings.allowedTargetLanguages[0]!;
    const sessionManager = new LanguageSessionManager(
      this.job.settings.allowedTargetLanguages,
      this.createSessionFactory(),
      {
        onStatus: (language, status, listenerCount, errorCode) => {
          if (status === "starting" && listenerCount > 0) {
            this.runInBackground(publisher.ensure(language), `publish ${language} audio track`);
          }
          this.runInBackground(
            this.publishLanguageStatus(language, status, listenerCount, errorCode),
            `publish ${language} translation status`,
          );
        },
        onAudio: (language, pcm16) => {
          if (sessionManager.getStatus(language).listenerCount > 0) publisher.capture(language, pcm16);
        },
        onTranscript: (language, delta) => {
          if (delta.kind === "source" && language !== sourceCaptionLanguage) return;
          this.runInBackground(
            this.publishMessage({
              ...this.messageBase(),
              type: delta.kind === "source"
                ? delta.final
                  ? "translation.caption.source.final"
                  : "translation.caption.source.delta"
                : delta.final
                  ? "translation.caption.target.final"
                  : "translation.caption.target.delta",
              ...(delta.kind === "target" ? { language } : {}),
              text: delta.text,
            }),
            `publish ${language} translation transcript`,
          );
        },
        onClosed: (language) => publisher.closeLanguage(language),
      },
      this.config.TRANSLATION_LANGUAGE_IDLE_GRACE_MS,
    );
    const publisher = new TranslationTrackPublisher(
      this.room,
      this.config.TRANSLATION_MAX_QUEUE_MS,
      (language) => {
        this.runInBackground(
          this.publishLanguageStatus(
            language,
            "delayed",
            sessionManager.getStatus(language).listenerCount,
          ),
          `publish ${language} queue delay`,
        );
      },
    );

    this.room.on(RoomEvent.TrackPublished, (publication, participant) => {
      this.subscribeIfSource(publication, participant);
    });
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (this.isSourceTrack(publication, participant)) {
        void this.consumeSourceAudio(track, sessionManager).catch((error) => {
          console.error(`Translation source audio failed for run ${this.job.id}`, error);
          this.stop();
        });
      }
    });
    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      sessionManager.removeParticipant(participant.identity);
      if (participant.identity === this.job.speakerParticipantIdentity) this.stop();
    });
    this.room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
      if (topic !== DATA_TOPIC || !participant) return;
      this.handleDataMessage(payload, participant, sessionManager);
    });
    this.room.on(RoomEvent.Disconnected, () => this.stop());

    const token = await this.createLiveKitToken();
    await this.room.connect(this.config.LIVEKIT_WORKER_URL ?? this.config.LIVEKIT_URL, token, {
      autoSubscribe: false,
      dynacast: false,
    });
    for (const participant of this.room.remoteParticipants.values()) {
      for (const publication of participant.trackPublications.values()) {
        if ("setSubscribed" in publication) {
          this.subscribeIfSource(publication as RemoteTrackPublication, participant);
        }
      }
    }
    await this.publishMessage({
      ...this.messageBase(),
      type: "translation.worker.status",
      status: "active",
      sourceParticipantIdentity: this.job.speakerParticipantIdentity,
    });

    try {
      while (!this.stopped) {
        const control = await this.store.heartbeat(
          this.job.id,
          this.workerInstanceId,
          "active",
          this.config.TRANSLATION_WORKER_LEASE_MS,
        );
        if (!control || control.status === "stopping") break;
        await this.delay(this.config.TRANSLATION_WORKER_HEARTBEAT_MS);
      }
    } finally {
      this.stopped = true;
      if (this.room.isConnected) {
        await this.publishMessage({
          ...this.messageBase(),
          type: "translation.worker.status",
          status: "stopping",
          sourceParticipantIdentity: this.job.speakerParticipantIdentity,
        }).catch(() => undefined);
      }
      await this.sourceReader?.cancel().catch(() => undefined);
      await sessionManager.close();
      await this.drainBackgroundTasks();
      await publisher.close();
      await this.drainBackgroundTasks();
      if (this.room.isConnected) {
        await this.room.disconnect().catch((error: unknown) => {
          if (!this.isAbortError(error)) throw error;
        });
      }
    }
  }

  stop(): void {
    this.stopped = true;
  }

  private createSessionFactory(): TranslationSessionFactory {
    return (language, handlers) => {
      if (this.config.TRANSLATION_PROVIDER === "fake") {
        return new FakeTranslationSession(language, handlers, this.config.TRANSLATION_FAKE_DELAY_MS);
      }
      if (this.job.settings.provider === "gemini") {
        if (
          this.job.settings.model !== "gemini-3.5-live-translate-preview" ||
          !this.config.GEMINI_API_KEY
        ) {
          throw this.providerConfigurationError("Gemini Live translation is not configured");
        }
        return new GeminiTranslationSession(language, handlers, {
          apiKey: this.config.GEMINI_API_KEY,
          model: this.job.settings.model,
          echoTargetLanguage: this.config.GEMINI_ECHO_TARGET_LANGUAGE,
        });
      }
      if (
        this.job.settings.model !== "gpt-realtime-translate" ||
        !this.config.OPENAI_API_KEY
      ) {
        throw this.providerConfigurationError("OpenAI Realtime translation is not configured");
      }
      return new OpenAITranslationSession(language, handlers, {
        apiKey: this.config.OPENAI_API_KEY,
        model: this.job.settings.model,
        safetyIdentifier: createHash("sha256").update(this.job.meetingId).digest("hex"),
      });
    };
  }

  private async createLiveKitToken(): Promise<string> {
    const identity = `translation-worker:${this.job.meetingId}:${this.job.id}`;
    const token = new AccessToken(this.config.LIVEKIT_API_KEY, this.config.LIVEKIT_API_SECRET, {
      identity,
      name: "SyncoraXP Interpreter",
      ttl: "30m",
      attributes: {
        role: "translator",
        hidden: "true",
        meetingId: this.job.meetingId,
        translationRunId: this.job.id,
        sourceParticipantIdentity: this.job.speakerParticipantIdentity,
        allowedTargetLanguages: this.job.settings.allowedTargetLanguages.join(","),
        translationProvider: this.job.settings.provider,
        translationModel: this.job.settings.model,
      },
    });
    token.kind = "agent";
    token.addGrant({
      roomJoin: true,
      room: this.job.livekitRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: [ServerTrackSource.MICROPHONE],
    });
    return token.toJwt();
  }

  private subscribeIfSource(
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ): void {
    if (this.isSourceTrack(publication, participant)) publication.setSubscribed(true);
  }

  private isSourceTrack(
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ): boolean {
    return (
      participant.identity === this.job.speakerParticipantIdentity &&
      publication.kind === TrackKind.KIND_AUDIO &&
      publication.source === TrackSource.SOURCE_MICROPHONE
    );
  }

  private async consumeSourceAudio(
    track: RemoteTrack,
    manager: LanguageSessionManager,
  ): Promise<void> {
    if (this.sourceReader) return;
    const inputSampleRate =
      this.config.TRANSLATION_PROVIDER !== "fake" && this.job.settings.provider === "gemini"
        ? 16_000
        : 24_000;
    this.sourceStream = new AudioStream(track, { sampleRate: inputSampleRate, numChannels: 1 });
    this.sourceReader = this.sourceStream.getReader();
    const pump = new RealtimePcmPump(inputSampleRate);
    let inputEnded = false;
    const readInput = (async () => {
      try {
        while (!this.stopped) {
          const frame = await this.sourceReader!.read();
          if (frame.done) break;
          pump.push(frame.value.data);
        }
      } finally {
        inputEnded = true;
      }
    })();
    try {
      await pump.run(
        (frame) => manager.appendAudio(frame),
        () => this.stopped || inputEnded,
      );
      await readInput;
    } finally {
      await this.sourceReader.cancel().catch(() => undefined);
      await readInput.catch(() => undefined);
      this.sourceReader.releaseLock();
      this.sourceReader = null;
      this.sourceStream = null;
    }
  }

  private handleDataMessage(
    payload: Uint8Array,
    participant: RemoteParticipant,
    manager: LanguageSessionManager,
  ): void {
    try {
      const parsed = TranslationDataMessageSchema.safeParse(
        JSON.parse(new TextDecoder().decode(payload)),
      );
      if (!parsed.success) return;
      if (
        parsed.data.meetingId !== this.job.meetingId ||
        parsed.data.translationRunId !== this.job.id
      ) return;
      if (parsed.data.type === "translation.captions.set") {
        void manager.setSourceCaptions(participant.identity, parsed.data.enabled).catch(() => undefined);
        return;
      }
      if (parsed.data.type !== "translation.preference.set") return;
      const preferenceMessage = parsed.data;
      void manager
        .setPreference(participant.identity, preferenceMessage.language)
        .then(() =>
          this.publishMessage(
            {
              ...this.messageBase(),
              type: "translation.preference.ack",
              language: preferenceMessage.language,
              status:
                preferenceMessage.language === "original"
                  ? "idle"
                  : manager.getStatus(preferenceMessage.language).status,
            },
            [participant.identity],
          ),
        )
        .catch(() => undefined);
    } catch {
      // Untrusted room data must never terminate the media worker.
    }
  }

  private publishLanguageStatus(
    language: TranslationLanguageCode,
    status: TranslationLanguageStatus,
    listenerCount: number,
    errorCode?: string,
  ): Promise<void> {
    return this.publishMessage({
      ...this.messageBase(),
      type: "translation.language.status",
      language,
      status,
      listenerCount,
      trackName: status === "idle" || status === "unavailable" ? null : `translation-${language}`,
      sourceParticipantIdentity: this.job.speakerParticipantIdentity,
      ...(errorCode ? { errorCode } : {}),
    });
  }

  private messageBase() {
    return {
      version: 1 as const,
      meetingId: this.job.meetingId,
      translationRunId: this.job.id,
      sequence: this.sequence++,
      sentAt: new Date().toISOString(),
    };
  }

  private async publishMessage(
    message: TranslationDataMessage,
    destinationIdentities?: string[],
  ): Promise<void> {
    const participant = this.room.localParticipant;
    if (!participant) return;
    await participant.publishData(new TextEncoder().encode(JSON.stringify(message)), {
      reliable: true,
      topic: DATA_TOPIC,
      destination_identities: destinationIdentities,
    });
  }

  private delay(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  private runInBackground(operation: Promise<unknown>, description: string): void {
    let tracked: Promise<void>;
    tracked = operation
      .then(() => undefined)
      .catch((error: unknown) => {
        if (!this.stopped && !this.isAbortError(error)) {
          console.error(`Translation worker could not ${description}`, error);
        }
      })
      .finally(() => {
        this.backgroundTasks.delete(tracked);
      });
    this.backgroundTasks.add(tracked);
  }

  private async drainBackgroundTasks(timeoutMs = 2_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (this.backgroundTasks.size > 0 && Date.now() < deadline) {
      const remainingMs = Math.max(0, deadline - Date.now());
      await Promise.race([
        Promise.allSettled(Array.from(this.backgroundTasks)),
        this.delay(remainingMs),
      ]);
    }
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }

  private providerConfigurationError(message: string): Error {
    const error = new Error(message);
    error.name = "provider_not_configured";
    return error;
  }
}
