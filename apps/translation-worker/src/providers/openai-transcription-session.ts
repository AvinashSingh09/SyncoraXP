import WebSocket, { type RawData } from "ws";

interface OpenAIRealtimeEvent {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string; code?: string };
}

interface TranscriptionHandlers {
  onTranscript(text: string, final: boolean): void;
  onError(error: Error): void;
}

const OPEN_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 1_000;

export class OpenAITranscriptionSession {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(
    private readonly handlers: TranscriptionHandlers,
    private readonly config: {
      apiKey: string;
      model: "gpt-4o-transcribe";
    },
  ) {}

  async open(): Promise<void> {
    this.closed = false;
    await this.connect();
  }

  appendAudio(pcm16: Int16Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || pcm16.length === 0) return;
    const bytes = Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
    this.socket.send(
      JSON.stringify({
        type: "input_audio_buffer.append",
        audio: bytes.toString("base64"),
      }),
    );
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const socket = this.socket;
    this.socket = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket("wss://api.openai.com/v1/realtime?intent=transcription", {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      this.socket = socket;
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.terminate();
        reject(new Error("OpenAI transcription session timed out while opening"));
      }, OPEN_TIMEOUT_MS);

      socket.once("open", () => {
        socket.send(
          JSON.stringify({
            type: "session.update",
            session: {
              type: "transcription",
              audio: {
                input: {
                  format: { type: "audio/pcm", rate: 24_000 },
                  transcription: {
                    model: this.config.model,
                    prompt:
                      "Transcribe verbatim in the original language and script. Preserve switches between Hindi and English.",
                  },
                  noise_reduction: { type: "far_field" },
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500,
                  },
                },
              },
            },
          }),
        );
      });
      socket.on("message", (data) => {
        const event = this.parseEvent(data);
        if (!event) return;
        if (event.type === "error" || event.type === "conversation.item.input_audio_transcription.failed") {
          const error = new Error(
            event.error?.message ?? event.error?.code ?? "OpenAI transcription error",
          );
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(error);
          } else {
            this.handlers.onError(error);
          }
          return;
        }
        if (
          !settled &&
          (event.type === "transcription_session.updated" || event.type === "session.updated")
        ) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
        if (
          event.type === "conversation.item.input_audio_transcription.delta" &&
          event.delta
        ) {
          this.handlers.onTranscript(event.delta, false);
        }
        if (
          event.type === "conversation.item.input_audio_transcription.completed" &&
          event.transcript
        ) {
          this.handlers.onTranscript(event.transcript, true);
        }
      });
      socket.once("error", (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(error);
        } else {
          this.handlers.onError(error);
        }
      });
      socket.once("close", (code, reason) => {
        clearTimeout(timeout);
        if (!settled) {
          settled = true;
          reject(
            new Error(
              `OpenAI transcription session closed during startup (${code}: ${reason.toString()})`,
            ),
          );
          return;
        }
        if (!this.closed) this.scheduleReconnect();
      });
    });
  }

  private scheduleReconnect(): void {
    if (this.closed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch((error: Error) => {
        this.handlers.onError(error);
        this.scheduleReconnect();
      });
    }, RECONNECT_DELAY_MS);
  }

  private parseEvent(data: RawData): OpenAIRealtimeEvent | null {
    try {
      return JSON.parse(data.toString()) as OpenAIRealtimeEvent;
    } catch {
      this.handlers.onError(new Error("OpenAI returned a malformed transcription event"));
      return null;
    }
  }
}
