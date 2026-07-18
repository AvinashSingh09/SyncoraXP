import assert from "node:assert/strict";
import test from "node:test";
import { Pcm16FrameAccumulator } from "../src/audio/pcm16-frame-accumulator";

test("emits provider-sized PCM frames without changing sample order", () => {
  const accumulator = new Pcm16FrameAccumulator(5);

  assert.deepEqual(accumulator.push(Int16Array.from([1, 2, 3])), []);
  assert.deepEqual(
    accumulator
      .push(Int16Array.from([4, 5, 6, 7, 8, 9, 10]))
      .map((frame) => Array.from(frame)),
    [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
    ],
  );
});

test("retains a partial frame and can reset it during reconnects", () => {
  const accumulator = new Pcm16FrameAccumulator(4);

  accumulator.push(Int16Array.from([1, 2, 3]));
  accumulator.reset();

  assert.deepEqual(
    accumulator.push(Int16Array.from([4, 5, 6, 7])).map((frame) => Array.from(frame)),
    [[4, 5, 6, 7]],
  );
});
