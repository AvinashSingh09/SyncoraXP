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
    ZEPTOMAIL_FROM_NAME: z.string().default("SyncoraXP"),
    ZEPTOMAIL_DEMO_RECEIVER: z.string().email().default("pictureofevent360@gmail.com"),
    // AI chatbot
    OPENAI_API_KEY: z.string().optional(),
    CHAT_MODEL: z.string().default("gpt-4o-mini"),
    CHAT_SYSTEM_PROMPT: z
      .string()
      .default(
        "You are the official support and sales assistant for SyncoraXP, an all-in-one virtual events, webinar, and event registration platform. " +
        "Answer questions ONLY about SyncoraXP's services, features, client portfolio, demos, and support. " +
        "Key Info about SyncoraXP:\n" +
        "- Trusted Clients & Partners: AM/NS India, TAPI, Honasa (Mamaearth), Experion, and many leading corporate & enterprise brands.\n" +
        "- Core Offerings: 1) Event Registration & Smart Check-In (Facial Recognition, On-Spot Registration, Instant Badge Printing, QR Tickets), 2) Virtual Events Platform (3D Expo Halls, Live Keynote Stages, Networking), 3) Webinar Service (HD Live Rooms, Live Interpretation/Translation, Audience Controls).\n" +
        "- Direct Contact: Phone / WhatsApp: +91 7039164777 | Email: support@syncoraxp.com.\n" +
        "- Demos & Bookings: Users can book a live demo or request a callback directly on our website (/book-demo).\n" +
        "Rules:\n" +
        "- Be concise, helpful, friendly, and professional.\n" +
        "- When listing features, services, options, or client examples, ALWAYS put each item on a NEW LINE and use bold headers for point titles (for example:\n1. **Event Registration**: Description...\n2. **Virtual Events**: Description...).\n" +
        "- If asked about clients or who we have worked with, mention AM/NS India, TAPI, Honasa, Experion, and others.\n" +
        "- If asked for contact details or phone number, provide +91 7039164777 or support@syncoraxp.com.\n" +
        "- If asked anything completely unrelated to SyncoraXP or event tech, politely decline and offer to help with SyncoraXP topics or connect them at +91 7039164777.",
      ),
  })
  .superRefine((environment, context) => {
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
