import type { TranslationLanguageCode } from "@voice/shared";
import {
  AudioFrame,
  AudioSource,
  LocalAudioTrack,
  TrackPublishOptions,
  TrackSource,
  type LocalTrackPublication,
  type Room,
} from "@livekit/rtc-node";

interface PublishedLanguageTrack {
  source: AudioSource;
  track: LocalAudioTrack;
  publication: LocalTrackPublication;
  captureChain: Promise<void>;
}

export class TranslationTrackPublisher {
  private readonly tracks = new Map<TranslationLanguageCode, PublishedLanguageTrack>();
  private readonly starting = new Map<TranslationLanguageCode, Promise<PublishedLanguageTrack>>();

  constructor(
    private readonly room: Room,
    private readonly maxQueueMs: number,
    private readonly onDelayed: (language: TranslationLanguageCode) => void,
  ) {}

  async ensure(language: TranslationLanguageCode): Promise<void> {
    await this.getOrCreate(language);
  }

  capture(language: TranslationLanguageCode, pcm16: Int16Array): void {
    void this.getOrCreate(language)
      .then((published) => {
        const copy = new Int16Array(pcm16);
        published.captureChain = published.captureChain
          .then(async () => {
            if (published.source.queuedDuration > this.maxQueueMs) {
              published.source.clearQueue();
              this.onDelayed(language);
            }
            await published.source.captureFrame(
              new AudioFrame(copy, 24_000, 1, copy.length),
            );
          })
          .catch(() => this.onDelayed(language));
      })
      .catch(() => this.onDelayed(language));
  }

  async closeLanguage(language: TranslationLanguageCode): Promise<void> {
    await this.starting.get(language)?.catch(() => undefined);
    const published = this.tracks.get(language);
    if (!published) return;
    this.tracks.delete(language);
    await published.captureChain.catch(() => undefined);
    if (published.publication.sid) {
      await this.room.localParticipant?.unpublishTrack(published.publication.sid, true);
    }
    await published.source.close();
  }

  async close(): Promise<void> {
    await Promise.all(Array.from(this.tracks.keys()).map((language) => this.closeLanguage(language)));
  }

  private async getOrCreate(language: TranslationLanguageCode): Promise<PublishedLanguageTrack> {
    const existing = this.tracks.get(language);
    if (existing) return existing;
    const pending = this.starting.get(language);
    if (pending) return pending;
    const starting = this.publish(language);
    this.starting.set(language, starting);
    try {
      const published = await starting;
      this.tracks.set(language, published);
      return published;
    } finally {
      this.starting.delete(language);
    }
  }

  private async publish(language: TranslationLanguageCode): Promise<PublishedLanguageTrack> {
    const participant = this.room.localParticipant;
    if (!participant) throw new Error("Translation worker is not connected to LiveKit");
    const source = new AudioSource(24_000, 1, this.maxQueueMs);
    const track = LocalAudioTrack.createAudioTrack(`translation-${language}`, source);
    const options = new TrackPublishOptions();
    options.source = TrackSource.SOURCE_MICROPHONE;
    const publication = await participant.publishTrack(track, options);
    return { source, track, publication, captureChain: Promise.resolve() };
  }
}
