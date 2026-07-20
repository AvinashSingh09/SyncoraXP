import type {
  TranslationLanguageCode,
  TranslationLanguageStatus,
  TranslationPreference,
} from "@voice/shared";
import type {
  TranslationSession,
  TranslationSessionFactory,
  TranslationTranscriptDelta,
} from "../providers/translation-session";

interface ManagedLanguage {
  listeners: Set<string>;
  session: TranslationSession | null;
  status: TranslationLanguageStatus;
  idleTimer: ReturnType<typeof setTimeout> | null;
  generation: number;
}

export interface LanguageSessionManagerHooks {
  onStatus(
    language: TranslationLanguageCode,
    status: TranslationLanguageStatus,
    listenerCount: number,
    errorCode?: string,
  ): void;
  onAudio(language: TranslationLanguageCode, pcm16: Int16Array): void;
  onTranscript(language: TranslationLanguageCode, delta: TranslationTranscriptDelta): void;
  onClosed(language: TranslationLanguageCode): void;
}

export class LanguageSessionManager {
  private readonly preferences = new Map<string, TranslationPreference>();
  private readonly languages = new Map<TranslationLanguageCode, ManagedLanguage>();
  private closed = false;

  constructor(
    allowedLanguages: TranslationLanguageCode[],
    private readonly createSession: TranslationSessionFactory,
    private readonly hooks: LanguageSessionManagerHooks,
    private readonly idleGraceMs: number,
  ) {
    for (const language of allowedLanguages) {
      this.languages.set(language, {
        listeners: new Set(),
        session: null,
        status: "idle",
        idleTimer: null,
        generation: 0,
      });
    }
  }

  async setPreference(participantIdentity: string, preference: TranslationPreference): Promise<void> {
    if (this.closed) return;
    const previous = this.preferences.get(participantIdentity) ?? "original";
    if (previous === preference) return;

    if (previous !== "original") this.removeListener(previous, participantIdentity);
    this.preferences.set(participantIdentity, preference);
    if (preference === "original") return;

    const managed = this.languages.get(preference);
    if (!managed) throw new Error(`Translation language ${preference} is not enabled`);
    managed.listeners.add(participantIdentity);
    if (managed.idleTimer) {
      clearTimeout(managed.idleTimer);
      managed.idleTimer = null;
    }
    this.emitStatus(preference, managed);
    if (!managed.session) await this.start(preference, managed);
  }

  removeParticipant(participantIdentity: string): void {
    const previous = this.preferences.get(participantIdentity);
    this.preferences.delete(participantIdentity);
    if (previous && previous !== "original") this.removeListener(previous, participantIdentity);
  }

  appendAudio(pcm16: Int16Array): void {
    if (this.closed) return;
    for (const managed of this.languages.values()) {
      if (managed.session && managed.status === "live") managed.session.appendAudio(pcm16);
    }
  }

  getStatus(language: TranslationLanguageCode) {
    const managed = this.languages.get(language);
    return managed
      ? { status: managed.status, listenerCount: managed.listeners.size }
      : { status: "unavailable" as const, listenerCount: 0 };
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await Promise.all(
      Array.from(this.languages.entries()).map(async ([language, managed]) => {
        if (managed.idleTimer) clearTimeout(managed.idleTimer);
        managed.idleTimer = null;
        await this.stop(language, managed);
      }),
    );
  }

  private async start(language: TranslationLanguageCode, managed: ManagedLanguage): Promise<void> {
    const generation = ++managed.generation;
    managed.status = "starting";
    this.emitStatus(language, managed);
    let session: TranslationSession;
    try {
      session = this.createSession(language, {
        onAudio: (pcm16) => {
          if (managed.generation === generation && managed.status === "live") {
            this.hooks.onAudio(language, pcm16);
          }
        },
        onTranscript: (delta) => {
          if (managed.generation === generation) this.hooks.onTranscript(language, delta);
        },
        onError: (error) => {
          if (managed.generation !== generation) return;
          managed.status = "unavailable";
          this.emitStatus(language, managed, error.name || "provider_error");
        },
      });
    } catch (error) {
      managed.status = "unavailable";
      this.emitStatus(
        language,
        managed,
        error instanceof Error ? error.name || "provider_configuration_error" : "provider_configuration_error",
      );
      return;
    }
    managed.session = session;
    try {
      await session.open();
      if (managed.generation !== generation || this.closed) {
        await session.close();
        return;
      }
      managed.status = "live";
      this.emitStatus(language, managed);
    } catch (error) {
      managed.session = null;
      managed.status = "unavailable";
      this.emitStatus(
        language,
        managed,
        error instanceof Error ? error.name || "provider_start_failed" : "provider_start_failed",
      );
      await session.close().catch(() => undefined);
    }
  }

  private removeListener(language: TranslationLanguageCode, participantIdentity: string): void {
    const managed = this.languages.get(language);
    if (!managed) return;
    managed.listeners.delete(participantIdentity);
    this.emitStatus(language, managed);
    if (managed.listeners.size > 0 || managed.idleTimer) return;
    managed.idleTimer = setTimeout(() => {
      managed.idleTimer = null;
      void this.stop(language, managed);
    }, this.idleGraceMs);
  }

  private async stop(language: TranslationLanguageCode, managed: ManagedLanguage): Promise<void> {
    const session = managed.session;
    if (!session) {
      managed.status = "idle";
      this.emitStatus(language, managed);
      return;
    }
    managed.status = "draining";
    this.emitStatus(language, managed);
    managed.session = null;
    managed.generation += 1;
    await session.close().catch(() => undefined);
    managed.status = "idle";
    this.hooks.onClosed(language);
    this.emitStatus(language, managed);
  }

  private emitStatus(
    language: TranslationLanguageCode,
    managed: ManagedLanguage,
    errorCode?: string,
  ): void {
    this.hooks.onStatus(language, managed.status, managed.listeners.size, errorCode);
  }
}
