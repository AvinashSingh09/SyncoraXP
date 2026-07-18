import { createHash } from "node:crypto";
import { loadTranslationWorkerConfig } from "../src/config";
import { OpenAITranslationSession } from "../src/providers/openai-translation-session";

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

try {
  await session.open();
  if (providerError) throw providerError;
  console.log("OpenAI Realtime translation session opened successfully for Marathi.");
} finally {
  await session.close();
}
