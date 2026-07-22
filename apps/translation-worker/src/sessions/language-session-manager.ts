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
  retryTimer: ReturnType<typeof setTimeout> | null;
  stopPromise: Promise<void> | null;
  retryAttempt: number;
  generation: number;
}

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 10_000;

export interface LanguageSessionManagerHooks {
  onStatus(
    language: TranslationLanguageCode,
    status: TranslationLanguageStatus,
    listenerCount: number,
    errorCode?: string,
  ): void;
  onAudio(language: TranslationLanguageCode, pcm16: Int16Array): void;
  onTranscript(language: TranslationLanguageCode, delta: TranslationTranscriptDelta): void;
  onClosed(language: TranslationLanguageCode): void | Promise<void>;
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
        retryTimer: null,
        stopPromise: null,
        retryAttempt: 0,
        generation: 0,
      });
    }
  }

  async setPreference(participantIdentity: string, preference: TranslationPreference): Promise<void> {
    if (this.closed) return;
    const previous = this.preferences.get(participantIdentity) ?? "original";
    if (previous !== preference) {
      if (previous !== "original") this.removeListener(previous, participantIdentity);
      this.preferences.set(participantIdentity, preference);
    }
    if (preference === "original") return;

    const managed = this.languages.get(preference);
    if (!managed) throw new Error(`Translation language ${preference} is not enabled`);
    managed.listeners.add(participantIdentity);
    if (managed.idleTimer) {
      clearTimeout(managed.idleTimer);
      managed.idleTimer = null;
    }
    if (managed.retryTimer) {
      clearTimeout(managed.retryTimer);
      managed.retryTimer = null;
    }
    this.emitStatus(preference, managed);
    await managed.stopPromise;
    if (this.closed || !managed.listeners.has(participantIdentity)) return;
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
        if (managed.retryTimer) clearTimeout(managed.retryTimer);
        managed.retryTimer = null;
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
          this.handleSessionFailure(language, managed, generation, session, error);
        },
      });
    } catch (error) {
      await this.handleStartFailure(language, managed, error);
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
      managed.retryAttempt = 0;
      this.emitStatus(language, managed);
    } catch (error) {
      this.handleSessionFailure(language, managed, generation, session, error);
      await managed.stopPromise;
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
    if (managed.retryTimer) {
      clearTimeout(managed.retryTimer);
      managed.retryTimer = null;
    }
    await managed.stopPromise;
    const session = managed.session;
    if (!session) {
      managed.status = "idle";
      await this.closePublishedLanguage(language);
      this.emitStatus(language, managed);
      return;
    }
    managed.status = "draining";
    this.emitStatus(language, managed);
    managed.session = null;
    managed.generation += 1;
    const stopPromise = (async () => {
      await session.close().catch(() => undefined);
      await this.closePublishedLanguage(language);
    })();
    managed.stopPromise = stopPromise;
    await stopPromise;
    if (managed.stopPromise === stopPromise) managed.stopPromise = null;
    managed.status = "idle";
    this.emitStatus(language, managed);
  }

  private async handleStartFailure(
    language: TranslationLanguageCode,
    managed: ManagedLanguage,
    error: unknown,
  ): Promise<void> {
    const errorCode =
      error instanceof Error
        ? error.name || "provider_configuration_error"
        : "provider_configuration_error";
    managed.status = this.isPermanentError(error) ? "unavailable" : "reconnecting";
    this.emitStatus(language, managed, errorCode);
    await this.closePublishedLanguage(language);
    if (managed.status === "reconnecting") this.scheduleRestart(language, managed);
  }

  private handleSessionFailure(
    language: TranslationLanguageCode,
    managed: ManagedLanguage,
    generation: number,
    session: TranslationSession,
    error: unknown,
  ): void {
    if (managed.generation !== generation || managed.session !== session) return;
    const permanent = this.isPermanentError(error);
    const errorCode = error instanceof Error ? error.name || "provider_error" : "provider_error";
    managed.generation += 1;
    managed.session = null;
    managed.status = permanent ? "unavailable" : "reconnecting";
    this.emitStatus(language, managed, errorCode);

    const stopPromise = (async () => {
      await session.close().catch(() => undefined);
      await this.closePublishedLanguage(language);
    })();
    managed.stopPromise = stopPromise;
    void stopPromise.then(() => {
      if (managed.stopPromise === stopPromise) managed.stopPromise = null;
      if (this.closed || managed.listeners.size === 0) {
        managed.status = "idle";
        this.emitStatus(language, managed);
        return;
      }
      if (!permanent) this.scheduleRestart(language, managed);
    });
  }

  private scheduleRestart(language: TranslationLanguageCode, managed: ManagedLanguage): void {
    if (this.closed || managed.listeners.size === 0 || managed.retryTimer) return;
    managed.status = "reconnecting";
    this.emitStatus(language, managed);
    const retryDelay = Math.min(
      RETRY_BASE_MS * 2 ** Math.min(managed.retryAttempt, 4),
      RETRY_MAX_MS,
    );
    managed.retryAttempt += 1;
    managed.retryTimer = setTimeout(() => {
      managed.retryTimer = null;
      if (this.closed || managed.listeners.size === 0 || managed.session) return;
      void this.start(language, managed);
    }, retryDelay);
  }

  private isPermanentError(error: unknown): boolean {
    return error instanceof Error && error.name === "provider_not_configured";
  }

  private async closePublishedLanguage(language: TranslationLanguageCode): Promise<void> {
    await Promise.resolve(this.hooks.onClosed(language)).catch(() => undefined);
  }

  private emitStatus(
    language: TranslationLanguageCode,
    managed: ManagedLanguage,
    errorCode?: string,
  ): void {
    this.hooks.onStatus(language, managed.status, managed.listeners.size, errorCode);
  }
}
