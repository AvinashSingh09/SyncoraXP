import type { TranslationLanguageCode } from "@voice/shared";
import {
  GoogleGenAI,
  Modality,
  type LiveServerMessage,
  type Session,
} from "@google/genai";
import { Pcm16FrameAccumulator } from "../audio/pcm16-frame-accumulator";
import type {
  TranslationSession,
  TranslationSessionHandlers,
  TranslationTranscriptDelta,
} from "./translation-session";

const INPUT_SAMPLE_RATE = 16_000;
const INPUT_CHUNK_MS = 100;
const OPEN_TIMEOUT_MS = 10_000;

export class GeminiTranslationSession implements TranslationSession {
  private session: Session | null = null;
  private opening: Promise<void> | null = null;
  private closing: Promise<void> | null = null;
  private closedByClient = false;
  private terminalErrorReported = false;
  private readonly inputFrames = new Pcm16FrameAccumulator(
    Math.round((INPUT_SAMPLE_RATE * INPUT_CHUNK_MS) / 1_000),
  );
  private readonly transcripts: Record<TranslationTranscriptDelta["kind"], string> = {
    source: "",
    target: "",
  };

  constructor(
    readonly language: TranslationLanguageCode,
    private readonly handlers: TranslationSessionHandlers,
    private readonly config: {
      apiKey: string;
      model: "gemini-3.5-live-translate-preview";
      echoTargetLanguage: boolean;
    },
  ) {}

  open(): Promise<void> {
    if (this.opening) return this.opening;
    this.opening = this.connect();
    return this.opening;
  }

  appendAudio(pcm16: Int16Array): void {
    if (!this.session || pcm16.length === 0) return;
    for (const frame of this.inputFrames.push(pcm16)) {
      const bytes = Buffer.from(frame.buffer, frame.byteOffset, frame.byteLength);
      this.session.sendRealtimeInput({
        audio: {
          data: bytes.toString("base64"),
          mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
        },
      });
    }
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.closedByClient = true;
    this.inputFrames.reset();
    this.closing = Promise.resolve().then(() => {
      this.session?.close();
      this.session = null;
    });
    return this.closing;
  }

  private async connect(): Promise<void> {
    const client = new GoogleGenAI({ apiKey: this.config.apiKey });
    let rejectDisconnected!: (error: Error) => void;
    const disconnected = new Promise<never>((_, reject) => {
      rejectDisconnected = reject;
    });
    let timedOut = false;
    let timeoutHandle: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        reject(new Error(`Gemini ${this.language} translation session timed out while opening`));
      }, OPEN_TIMEOUT_MS);
    });
    const connection = client.live.connect({
      model: this.config.model,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        translationConfig: {
          targetLanguageCode: this.language,
          echoTargetLanguage: this.config.echoTargetLanguage,
        },
      },
      callbacks: {
        onmessage: (message) => this.handleMessage(message),
        onerror: (event) => {
          const error = this.errorFromEvent(event);
          rejectDisconnected(error);
          this.reportTerminalError(error);
        },
        onclose: (event) => {
          if (this.closedByClient) return;
          const suffix = event.reason ? `: ${event.reason}` : "";
          const error = new Error(
            `Gemini ${this.language} translation session disconnected (${event.code}${suffix})`,
          );
          rejectDisconnected(error);
          this.reportTerminalError(error);
        },
      },
    });

    try {
      this.session = await Promise.race([connection, disconnected, timeout]);
    } catch (error) {
      if (timedOut) void connection.then((session) => session.close()).catch(() => undefined);
      throw error;
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  private handleMessage(message: LiveServerMessage): void {
    const content = message.serverContent;
    if (content?.inputTranscription?.text) {
      this.appendTranscript("source", content.inputTranscription.text);
    }
    if (content?.outputTranscription?.text) {
      this.appendTranscript("target", content.outputTranscription.text);
    }
    if (content?.inputTranscription?.finished) this.finishTranscript("source");
    if (content?.outputTranscription?.finished) this.finishTranscript("target");

    for (const part of content?.modelTurn?.parts ?? []) {
      const encoded = part.inlineData?.data;
      if (!encoded) continue;
      const decoded = Buffer.from(encoded, "base64");
      if (decoded.byteLength < 2) continue;
      const evenLength = decoded.byteLength - (decoded.byteLength % 2);
      const copy = Uint8Array.from(decoded.subarray(0, evenLength));
      this.handlers.onAudio(new Int16Array(copy.buffer, copy.byteOffset, copy.byteLength / 2));
    }

    if (content?.generationComplete || content?.turnComplete || content?.interrupted) {
      this.finishTranscript("source");
      this.finishTranscript("target");
    }
    if (message.goAway) {
      this.reportTerminalError(
        new Error(
          `Gemini Live requested a reconnect${message.goAway.timeLeft ? ` in ${message.goAway.timeLeft}` : ""}`,
        ),
      );
    }
  }

  private errorFromEvent(event: ErrorEvent): Error {
    if (event.error instanceof Error) return event.error;
    return new Error(event.message || `Gemini ${this.language} Live translation error`);
  }

  private appendTranscript(kind: TranslationTranscriptDelta["kind"], text: string): void {
    this.transcripts[kind] += text;
    this.handlers.onTranscript({ kind, text, final: false });
  }

  private finishTranscript(kind: TranslationTranscriptDelta["kind"]): void {
    const text = this.transcripts[kind];
    if (!text) return;
    this.transcripts[kind] = "";
    this.handlers.onTranscript({ kind, text, final: true });
  }

  private reportTerminalError(error: Error): void {
    if (this.closedByClient || this.terminalErrorReported) return;
    this.terminalErrorReported = true;
    this.handlers.onError(error);
  }
}
