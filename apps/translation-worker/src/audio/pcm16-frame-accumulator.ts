export class Pcm16FrameAccumulator {
  private readonly chunks: Int16Array[] = [];
  private firstChunkOffset = 0;
  private bufferedSamples = 0;

  constructor(private readonly samplesPerFrame: number) {
    if (!Number.isInteger(samplesPerFrame) || samplesPerFrame <= 0) {
      throw new Error("PCM frame size must be a positive integer");
    }
  }

  push(samples: Int16Array): Int16Array[] {
    if (samples.length > 0) {
      this.chunks.push(new Int16Array(samples));
      this.bufferedSamples += samples.length;
    }

    const frames: Int16Array[] = [];
    while (this.bufferedSamples >= this.samplesPerFrame) {
      const frame = new Int16Array(this.samplesPerFrame);
      let outputOffset = 0;
      while (outputOffset < frame.length) {
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
      frames.push(frame);
    }
    return frames;
  }

  reset(): void {
    this.chunks.length = 0;
    this.firstChunkOffset = 0;
    this.bufferedSamples = 0;
  }
}
