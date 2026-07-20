import type { TranslationLanguageCode } from "@voice/shared";
import type {
  TranslationSession,
  TranslationSessionHandlers,
} from "./translation-session";

export class FakeTranslationSession implements TranslationSession {
  private opened = false;
  private closed = false;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    readonly language: TranslationLanguageCode,
    private readonly handlers: TranslationSessionHandlers,
    private readonly delayMs: number,
  ) {}

  async open(): Promise<void> {
    if (this.closed) throw new Error("Cannot reopen a closed fake translation session");
    this.opened = true;
  }

  appendAudio(pcm16: Int16Array): void {
    if (!this.opened || this.closed) return;
    const copy = new Int16Array(pcm16);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.closed) this.handlers.onAudio(copy);
    }, this.delayMs);
    this.timers.add(timer);
  }

  async close(): Promise<void> {
    this.closed = true;
    this.opened = false;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }
}
