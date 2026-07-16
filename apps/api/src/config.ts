import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { z } from "zod";

const rootEnvironmentPath = resolve(import.meta.dirname, "../../../.env");
if (existsSync(rootEnvironmentPath)) loadEnvFile(rootEnvironmentPath);

const EnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    DATABASE_MODE: z.enum(["postgres", "memory"]).default("postgres"),
    DATABASE_URL: z
      .string()
      .default("postgres://postgres:postgres@localhost:5432/voice_meetings"),
    APP_BASE_URL: z.url().default("http://localhost:5173"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    LIVEKIT_URL: z.string().trim().optional(),
    LIVEKIT_API_KEY: z.string().trim().optional(),
    LIVEKIT_API_SECRET: z.string().trim().optional(),
    EMAIL_MODE: z.enum(["console", "zeptomail"]).default("console"),
    ZEPTOMAIL_API_URL: z.url().default("https://api.zeptomail.in/v1.1/email"),
    ZEPTOMAIL_TOKEN: z.string().optional(),
    ZEPTOMAIL_FROM_ADDRESS: z.string().optional(),
    ZEPTOMAIL_FROM_NAME: z.string().default("VoiceMeet"),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV === "production" && environment.DATABASE_MODE === "memory") {
      context.addIssue({
        code: "custom",
        path: ["DATABASE_MODE"],
        message: "In-memory storage is not allowed in production",
      });
    }
    const liveKitValues = [
      environment.LIVEKIT_URL,
      environment.LIVEKIT_API_KEY,
      environment.LIVEKIT_API_SECRET,
    ];
    const configuredLiveKitValues = liveKitValues.filter(Boolean).length;
    if (configuredLiveKitValues > 0 && configuredLiveKitValues < liveKitValues.length) {
      context.addIssue({
        code: "custom",
        path: ["LIVEKIT_URL"],
        message: "LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET must be configured together",
      });
    }
    if (environment.EMAIL_MODE !== "zeptomail") return;
    if (!environment.ZEPTOMAIL_TOKEN) {
      context.addIssue({ code: "custom", path: ["ZEPTOMAIL_TOKEN"], message: "Required" });
    }
    if (!environment.ZEPTOMAIL_FROM_ADDRESS) {
      context.addIssue({
        code: "custom",
        path: ["ZEPTOMAIL_FROM_ADDRESS"],
        message: "Required",
      });
    }
  });

export type AppConfig = z.infer<typeof EnvironmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvironmentSchema.parse(environment);
}
