import assert from "node:assert/strict";
import test from "node:test";
import type { TranslationLanguageCode } from "@voice/shared";
import { FakeTranslationSession } from "../src/providers/fake-translation-session";
import type { TranslationSessionFactory } from "../src/providers/translation-session";
import { LanguageSessionManager } from "../src/sessions/language-session-manager";

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

test("shares one session per language and closes it after the final listener grace period", async () => {
  let created = 0;
  let closed = 0;
  const audio: Array<{ language: TranslationLanguageCode; sample: number }> = [];
  const factory: TranslationSessionFactory = (language, handlers) => {
    created += 1;
    const session = new FakeTranslationSession(language, handlers, 0);
    return {
      language,
      open: () => session.open(),
      appendAudio: (frame) => session.appendAudio(frame),
      close: async () => {
        closed += 1;
        await session.close();
      },
    };
  };
  const manager = new LanguageSessionManager(
    ["hi", "ta"],
    factory,
    {
      onStatus: () => undefined,
      onAudio: (language, pcm) => audio.push({ language, sample: pcm[0] ?? 0 }),
      onTranscript: () => undefined,
      onClosed: () => undefined,
    },
    10,
  );

  await manager.setPreference("guest-1", "hi");
  await manager.setPreference("guest-2", "hi");
  assert.equal(created, 1);
  assert.deepEqual(manager.getStatus("hi"), { status: "live", listenerCount: 2 });

  manager.appendAudio(new Int16Array([42]));
  await wait(5);
  assert.deepEqual(audio, [{ language: "hi", sample: 42 }]);

  await manager.setPreference("guest-1", "original");
  await wait(15);
  assert.equal(closed, 0);
  await manager.setPreference("guest-2", "original");
  await wait(15);
  assert.equal(closed, 1);
  assert.deepEqual(manager.getStatus("hi"), { status: "idle", listenerCount: 0 });

  await manager.close();
});

test("isolates active languages and removes disconnected participants", async () => {
  const appended = new Map<TranslationLanguageCode, number>();
  const factory: TranslationSessionFactory = (language, handlers) => ({
    language,
    async open() {},
    appendAudio(frame) {
      appended.set(language, (appended.get(language) ?? 0) + frame.length);
      handlers.onAudio(frame);
    },
    async close() {},
  });
  const manager = new LanguageSessionManager(
    ["hi", "te"],
    factory,
    { onStatus() {}, onAudio() {}, onTranscript() {}, onClosed() {} },
    0,
  );

  await manager.setPreference("guest-hi", "hi");
  await manager.setPreference("guest-te", "te");
  manager.appendAudio(new Int16Array([1, 2, 3]));
  assert.equal(appended.get("hi"), 3);
  assert.equal(appended.get("te"), 3);

  manager.removeParticipant("guest-hi");
  await wait(5);
  manager.appendAudio(new Int16Array([4, 5]));
  assert.equal(appended.get("hi"), 3);
  assert.equal(appended.get("te"), 5);
  await manager.close();
});

test("marks a language unavailable when its provider is not configured", async () => {
  const statuses: Array<{ status: string; errorCode?: string }> = [];
  const manager = new LanguageSessionManager(
    ["mr"],
    () => {
      const error = new Error("Gemini Live translation is not configured");
      error.name = "provider_not_configured";
      throw error;
    },
    {
      onStatus(_language, status, _listenerCount, errorCode) {
        statuses.push({ status, errorCode });
      },
      onAudio() {},
      onTranscript() {},
      onClosed() {},
    },
    0,
  );

  await manager.setPreference("guest-mr", "mr");

  assert.deepEqual(manager.getStatus("mr"), { status: "unavailable", listenerCount: 1 });
  assert.deepEqual(statuses.at(-1), {
    status: "unavailable",
    errorCode: "provider_not_configured",
  });
  await manager.close();
});
