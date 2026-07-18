import assert from "node:assert/strict";
import test from "node:test";
import { RealtimePcmPump } from "../src/audio/realtime-pcm-pump";

test("emits fixed 20 ms frames and fills missing input with silence", () => {
  const pump = new RealtimePcmPump(1_000, 20, 100);
  pump.push(Int16Array.from([1, 2, 3, 4, 5]));

  assert.deepEqual(Array.from(pump.dequeueFrame()), [1, 2, 3, 4, 5, ...Array(15).fill(0)]);
  assert.deepEqual(Array.from(pump.dequeueFrame()), Array(20).fill(0));
});

test("preserves sample order across differently sized LiveKit frames", () => {
  const pump = new RealtimePcmPump(1_000, 4, 100);
  pump.push(Int16Array.from([1, 2]));
  pump.push(Int16Array.from([3, 4, 5, 6]));

  assert.deepEqual(Array.from(pump.dequeueFrame()), [1, 2, 3, 4]);
  assert.deepEqual(Array.from(pump.dequeueFrame()), [5, 6, 0, 0]);
});

test("drops the oldest buffered samples when input falls behind realtime", () => {
  const pump = new RealtimePcmPump(1_000, 4, 8);
  pump.push(Int16Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));

  assert.deepEqual(Array.from(pump.dequeueFrame()), [3, 4, 5, 6]);
  assert.deepEqual(Array.from(pump.dequeueFrame()), [7, 8, 9, 10]);
});
