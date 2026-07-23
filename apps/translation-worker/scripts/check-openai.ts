import { createHash } from "node:crypto";
import { loadTranslationWorkerConfig } from "../src/config";
import { OpenAITranslationSession } from "../src/providers/openai-translation-session";
import { OpenAITranscriptionSession } from "../src/providers/openai-transcription-session";

const config = loadTranslationWorkerConfig();
if (!config.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured");
}

let providerError: Error | null = null;
const session = new OpenAITranslationSession(
  "mr",
  {
    onAudio() {},
    onTranscript() {},
    onError(error) {
      providerError = error;
    },
  },
  {
    apiKey: config.OPENAI_API_KEY,
    model: config.OPENAI_REALTIME_TRANSLATION_MODEL,
    safetyIdentifier: createHash("sha256")
      .update("syncoraxp-openai-translation-check")
      .digest("hex"),
  },
);
const transcription = new OpenAITranscriptionSession(
  {
    onTranscript() {},
    onError(error) {
      providerError = error;
    },
  },
  {
    apiKey: config.OPENAI_API_KEY,
    model: config.OPENAI_TRANSCRIPTION_MODEL,
  },
);

try {
  await session.open();
  await transcription.open();
  if (providerError) throw providerError;
  console.log("OpenAI Realtime translation and transcription sessions opened successfully.");
} finally {
  await transcription.close();
  await session.close();
}
