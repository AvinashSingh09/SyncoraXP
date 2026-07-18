export class RealtimePcmPump {
  private readonly samplesPerFrame: number;
  private readonly maxBufferedSamples: number;
  private readonly chunks: Int16Array[] = [];
  private firstChunkOffset = 0;
  private bufferedSamples = 0;

  constructor(
    private readonly sampleRate = 24_000,
    private readonly frameDurationMs = 20,
    maxBufferedMs = 500,
  ) {
    this.samplesPerFrame = Math.round((sampleRate * frameDurationMs) / 1_000);
    this.maxBufferedSamples = Math.round((sampleRate * maxBufferedMs) / 1_000);
  }

  push(samples: Int16Array): void {
    if (samples.length === 0) return;
    const copy = new Int16Array(samples);
    this.chunks.push(copy);
    this.bufferedSamples += copy.length;
    this.discard(this.bufferedSamples - this.maxBufferedSamples);
  }

  dequeueFrame(): Int16Array {
    const frame = new Int16Array(this.samplesPerFrame);
    let outputOffset = 0;
    while (outputOffset < frame.length && this.chunks.length > 0) {
      const chunk = this.chunks[0]!;
      const available = chunk.length - this.firstChunkOffset;
      const count = Math.min(available, frame.length - outputOffset);
      frame.set(
        chunk.subarray(this.firstChunkOffset, this.firstChunkOffset + count),
        outputOffset,
      );
      outputOffset += count;
      this.firstChunkOffset += count;
      this.bufferedSamples -= count;
      if (this.firstChunkOffset === chunk.length) {
        this.chunks.shift();
        this.firstChunkOffset = 0;
      }
    }
    return frame;
  }

  async run(consume: (frame: Int16Array) => void, shouldStop: () => boolean): Promise<void> {
    let nextFrameAt = Date.now();
    while (!shouldStop()) {
      consume(this.dequeueFrame());
      nextFrameAt += this.frameDurationMs;
      const now = Date.now();
      if (now - nextFrameAt > this.frameDurationMs * 5) nextFrameAt = now;
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, nextFrameAt - now)));
    }
  }

  private discard(count: number): void {
    let remaining = Math.max(0, count);
    while (remaining > 0 && this.chunks.length > 0) {
      const chunk = this.chunks[0]!;
      const available = chunk.length - this.firstChunkOffset;
      const discarded = Math.min(available, remaining);
      this.firstChunkOffset += discarded;
      this.bufferedSamples -= discarded;
      remaining -= discarded;
      if (this.firstChunkOffset === chunk.length) {
        this.chunks.shift();
        this.firstChunkOffset = 0;
      }
    }
  }
}
