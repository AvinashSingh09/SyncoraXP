import { Pool } from "pg";
import { buildApp } from "./app";
import { loadConfig } from "./config";
import { PostgresMeetingRepository } from "./db/postgres-meeting-repository";
import { ConsoleInvitationMailer } from "./email/console-mailer";
import type { InvitationMailer } from "./email/invitation-mailer";
import { ZeptoMailInvitationMailer } from "./email/zeptomail-mailer";
import { AuthService } from "./auth/auth-service";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import { LiveKitRoomTokenIssuer } from "./livekit/room-token-issuer";
import { PostgresTranslationRepository } from "./translation/postgres-translation-repository";

const config = loadConfig();
const isRemotePg = config.DATABASE_URL.includes("supabase") || config.DATABASE_URL.includes("neon") || config.DATABASE_URL.includes("sslmode=");
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5_000,
  ...(isRemotePg ? { ssl: { rejectUnauthorized: false } } : {}),
});
const repository = new PostgresMeetingRepository(pool);
const auth = new AuthService(new PostgresAuthRepository(pool), config.SESSION_DAYS);
const translations = new PostgresTranslationRepository(pool);
const roomTokens = new LiveKitRoomTokenIssuer({
  serverUrl: config.LIVEKIT_URL,
  apiKey: config.LIVEKIT_API_KEY,
  apiSecret: config.LIVEKIT_API_SECRET,
});

let mailer: InvitationMailer = new ConsoleInvitationMailer();
if (config.EMAIL_MODE === "zeptomail") {
  mailer = new ZeptoMailInvitationMailer({
    apiUrl: config.ZEPTOMAIL_API_URL,
    token: config.ZEPTOMAIL_TOKEN!,
    fromAddress: config.ZEPTOMAIL_FROM_ADDRESS!,
    fromName: config.ZEPTOMAIL_FROM_NAME,
    demoReceiverEmail: config.ZEPTOMAIL_DEMO_RECEIVER,
  });
}

try {
  const app = await buildApp({ config, repository, mailer, auth, roomTokens, translations });

  const shutdown = async () => {
    await app.close();
    await pool.end();
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  const address = await app.listen({ port: config.PORT, host: "0.0.0.0" });
  console.log(`API Server listening on ${address}`);
} catch (err) {
  console.error("CRITICAL: Failed to start API Server:", err);
  process.exit(1);
}
