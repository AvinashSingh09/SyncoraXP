import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { z } from "zod";

const rootEnvironmentPath = resolve(import.meta.dirname, "../../../.env");
if (existsSync(rootEnvironmentPath)) loadEnvFile(rootEnvironmentPath);

const EnvironmentSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .default("postgres://postgres:postgres@localhost:5432/voice_meetings"),
    LIVEKIT_URL: z.string().trim().min(1),
    LIVEKIT_WORKER_URL: z.string().trim().min(1).optional(),
    LIVEKIT_API_KEY: z.string().trim().min(1),
    LIVEKIT_API_SECRET: z.string().trim().min(1),
    OPENAI_API_KEY: z.string().trim().optional(),
    OPENAI_REALTIME_TRANSLATION_MODEL: z
      .literal("gpt-realtime-translate")
      .default("gpt-realtime-translate"),
    OPENAI_TRANSCRIPTION_MODEL: z.literal("gpt-4o-transcribe").default("gpt-4o-transcribe"),
    GEMINI_API_KEY: z.string().trim().optional(),
    GEMINI_LIVE_TRANSLATION_MODEL: z
      .literal("gemini-3.5-live-translate-preview")
      .default("gemini-3.5-live-translate-preview"),
    GEMINI_ECHO_TARGET_LANGUAGE: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    TRANSLATION_PROVIDER: z.enum(["fake", "openai", "gemini"]).default("fake"),
    TRANSLATION_WORKER_ID: z.string().trim().optional(),
    TRANSLATION_JOB_POLL_MS: z.coerce.number().int().min(250).max(30_000).default(1_000),
    TRANSLATION_WORKER_HEARTBEAT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(30_000)
      .default(5_000),
    TRANSLATION_WORKER_LEASE_MS: z.coerce
      .number()
      .int()
      .min(5_000)
      .max(120_000)
      .default(20_000),
    TRANSLATION_LANGUAGE_IDLE_GRACE_MS: z.coerce
      .number()
      .int()
      .min(0)
      .max(300_000)
      .default(30_000),
    TRANSLATION_MAX_QUEUE_MS: z.coerce.number().int().min(500).max(15_000).default(4_000),
    TRANSLATION_FAKE_DELAY_MS: z.coerce.number().int().min(0).max(10_000).default(300),
  })
  .superRefine((environment, context) => {
    if (environment.TRANSLATION_PROVIDER === "openai" && !environment.OPENAI_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when TRANSLATION_PROVIDER=openai",
      });
    }
    if (environment.TRANSLATION_PROVIDER === "gemini" && !environment.GEMINI_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY is required when TRANSLATION_PROVIDER=gemini",
      });
    }
  });

export type TranslationWorkerConfig = z.infer<typeof EnvironmentSchema>;

export function loadTranslationWorkerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): TranslationWorkerConfig {
  return EnvironmentSchema.parse(environment);
}
