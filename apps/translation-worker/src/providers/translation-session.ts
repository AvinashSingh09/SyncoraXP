import type { TranslationLanguageCode } from "@voice/shared";

export interface TranslationTranscriptDelta {
  kind: "source" | "target";
  text: string;
  final: boolean;
}

export interface TranslationSessionHandlers {
  onAudio(pcm16: Int16Array): void;
  onTranscript(delta: TranslationTranscriptDelta): void;
  onError(error: Error): void;
}

export interface TranslationSession {
  readonly language: TranslationLanguageCode;
  open(): Promise<void>;
  appendAudio(pcm16: Int16Array): void;
  close(): Promise<void>;
}

export type TranslationSessionFactory = (
  language: TranslationLanguageCode,
  handlers: TranslationSessionHandlers,
) => TranslationSession;
