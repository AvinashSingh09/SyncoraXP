import { Pool } from "pg";
import { buildApp } from "./app";
import { loadConfig } from "./config";
import { MemoryMeetingRepository } from "./db/memory-meeting-repository";
import type { MeetingRepository } from "./db/meeting-repository";
import { PostgresMeetingRepository } from "./db/postgres-meeting-repository";
import { ConsoleInvitationMailer } from "./email/console-mailer";
import type { InvitationMailer } from "./email/invitation-mailer";
import { ZeptoMailInvitationMailer } from "./email/zeptomail-mailer";
import { AuthService } from "./auth/auth-service";
import { MemoryAuthRepository } from "./auth/memory-auth-repository";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import type { AuthRepository } from "./auth/auth-repository";
import { LiveKitRoomTokenIssuer } from "./livekit/room-token-issuer";

const config = loadConfig();
const pool = new Pool({ connectionString: config.DATABASE_URL, max: 10 });
let repository: MeetingRepository = new PostgresMeetingRepository(pool);
let authRepository: AuthRepository = new PostgresAuthRepository(pool);
if (config.DATABASE_MODE === "memory") {
  repository = new MemoryMeetingRepository();
  authRepository = new MemoryAuthRepository();
}
const auth = new AuthService(authRepository, config.SESSION_DAYS);
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
  });
}

const app = await buildApp({ config, repository, mailer, auth, roomTokens });

const shutdown = async () => {
  await app.close();
  if (config.DATABASE_MODE === "postgres") await pool.end();
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

await app.listen({ port: config.PORT, host: "0.0.0.0" });
