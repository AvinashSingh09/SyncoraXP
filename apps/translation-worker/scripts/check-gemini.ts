import { loadTranslationWorkerConfig } from "../src/config";
import { GeminiTranslationSession } from "../src/providers/gemini-translation-session";

const config = loadTranslationWorkerConfig();
if (!config.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured");
}

let providerError: Error | null = null;
const session = new GeminiTranslationSession(
  "mr",
  {
    onAudio() {},
    onTranscript() {},
    onError(error) {
      providerError = error;
    },
  },
  {
    apiKey: config.GEMINI_API_KEY,
    model: config.GEMINI_LIVE_TRANSLATION_MODEL,
    echoTargetLanguage: config.GEMINI_ECHO_TARGET_LANGUAGE,
  },
);

try {
  await session.open();
  if (providerError) throw providerError;
  console.log("Gemini Live translation session opened successfully for Marathi.");
} finally {
  await session.close();
}
