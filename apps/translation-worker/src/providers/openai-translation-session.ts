import type { TranslationLanguageCode } from "@voice/shared";
import WebSocket, { type RawData } from "ws";
import type {
  TranslationSession,
  TranslationSessionHandlers,
} from "./translation-session";

interface OpenAIRealtimeEvent {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string; code?: string };
}

const OPEN_TIMEOUT_MS = 10_000;
const CLOSE_TIMEOUT_MS = 5_000;

export class OpenAITranslationSession implements TranslationSession {
  private socket: WebSocket | null = null;
  private opening: Promise<void> | null = null;
  private closing: Promise<void> | null = null;
  private closedByClient = false;
  private terminalErrorReported = false;

  constructor(
    readonly language: TranslationLanguageCode,
    private readonly handlers: TranslationSessionHandlers,
    private readonly config: {
      apiKey: string;
      model: "gpt-realtime-translate";
      safetyIdentifier: string;
    },
  ) {}

  open(): Promise<void> {
    if (this.opening) return this.opening;
    this.opening = new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(
        `wss://api.openai.com/v1/realtime/translations?model=${encodeURIComponent(this.config.model)}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "OpenAI-Safety-Identifier": this.config.safetyIdentifier,
          },
        },
      );
      this.socket = socket;
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.terminate();
        reject(new Error(`OpenAI ${this.language} translation session timed out while opening`));
      }, OPEN_TIMEOUT_MS);

      socket.once("open", () => {
        socket.send(
          JSON.stringify({
            type: "session.update",
            session: { audio: { output: { language: this.language } } },
          }),
        );
      });
      socket.on("message", (data) => {
        const event = this.parseEvent(data);
        if (!event) return;
        if (event.type === "error") {
          const providerError = new Error(
            event.error?.message ?? event.error?.code ?? "OpenAI Realtime translation error",
          );
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(providerError);
          }
          this.reportTerminalError(providerError);
          return;
        }
        if (!settled && event.type === "session.updated") {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
        this.handleEvent(event);
      });
      socket.once("error", (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(error);
        }
        this.reportTerminalError(error);
      });
      socket.once("close", (code, reason) => {
        clearTimeout(timeout);
        if (!settled) {
          settled = true;
          reject(
            new Error(
              `OpenAI ${this.language} translation session closed during startup (${code}: ${reason.toString()})`,
            ),
          );
          return;
        }
        if (!this.closedByClient) {
          const suffix = reason.length ? `: ${reason.toString()}` : "";
          this.reportTerminalError(
            new Error(
              `OpenAI ${this.language} translation session disconnected (${code}${suffix})`,
            ),
          );
        }
      });
    });
    return this.opening;
  }

  appendAudio(pcm16: Int16Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || pcm16.length === 0) return;
    const bytes = Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
    this.socket.send(
      JSON.stringify({
        type: "session.input_audio_buffer.append",
        audio: bytes.toString("base64"),
      }),
    );
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.closedByClient = true;
    this.closing = new Promise<void>((resolve) => {
      const socket = this.socket;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (socket.readyState !== WebSocket.CLOSED) socket.close();
        resolve();
      };
      const timeout = setTimeout(() => {
        socket.terminate();
        finish();
      }, CLOSE_TIMEOUT_MS);
      const onMessage = (data: RawData) => {
        const event = this.parseEvent(data);
        if (event?.type === "session.closed") {
          socket.off("message", onMessage);
          finish();
        }
      };
      socket.on("message", onMessage);
      socket.once("close", finish);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "session.close" }));
      } else {
        finish();
      }
    });
    return this.closing;
  }

  private parseEvent(data: RawData): OpenAIRealtimeEvent | null {
    try {
      return JSON.parse(data.toString()) as OpenAIRealtimeEvent;
    } catch {
      this.handlers.onError(new Error("OpenAI returned a malformed Realtime event"));
      return null;
    }
  }

  private handleEvent(event: OpenAIRealtimeEvent): void {
    if (event.type === "session.output_audio.delta" && event.delta) {
      const decoded = Buffer.from(event.delta, "base64");
      const copy = Uint8Array.from(decoded);
      this.handlers.onAudio(
        new Int16Array(copy.buffer, copy.byteOffset, Math.floor(copy.byteLength / 2)),
      );
      return;
    }
    if (event.type === "session.output_transcript.delta" && event.delta) {
      this.handlers.onTranscript({ kind: "target", text: event.delta, final: false });
      return;
    }
    if (event.type === "session.input_transcript.delta" && event.delta) {
      this.handlers.onTranscript({ kind: "source", text: event.delta, final: false });
      return;
    }
    const finalTranscript = event.transcript ?? event.delta;
    if (event.type?.endsWith("transcript.done") && finalTranscript) {
      this.handlers.onTranscript({
        kind: event.type.includes("input") ? "source" : "target",
        text: finalTranscript,
        final: true,
      });
      return;
    }
  }

  private reportTerminalError(error: Error): void {
    if (this.closedByClient || this.terminalErrorReported) return;
    this.terminalErrorReported = true;
    this.handlers.onError(error);
  }
}
