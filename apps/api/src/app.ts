import cors from "@fastify/cors";
import Fastify from "fastify";
import type { AppConfig } from "./config";
import type { MeetingRepository } from "./db/meeting-repository";
import type { InvitationMailer } from "./email/invitation-mailer";
import type { AuthService } from "./auth/auth-service";
import { registerAuthRoutes } from "./routes/auth-routes";
import type { RoomTokenIssuer } from "./livekit/room-token-issuer";
import { registerMeetingRoutes } from "./routes/meeting-routes";
import { registerDemoRoutes } from "./routes/demo-routes";
import virtualEventsModule from "./virtual-events/index.cjs";

const { registerVirtualEvents } = virtualEventsModule as { registerVirtualEvents: (app: ReturnType<typeof Fastify>) => Promise<void> };
interface BuildAppDependencies {
  config: AppConfig;
  repository: MeetingRepository;
  mailer: InvitationMailer;
  auth: AuthService;
  roomTokens: RoomTokenIssuer;
}

export async function buildApp(dependencies: BuildAppDependencies) {
  const app = Fastify({ logger: dependencies.config.NODE_ENV !== "test" });
  await app.register(cors, {
    origin: dependencies.config.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  });

  app.get("/api/health", async () => ({ status: "ok" }));
  await registerAuthRoutes(app, dependencies);
  await registerMeetingRoutes(app, dependencies);
  await registerDemoRoutes(app, dependencies);

  if (dependencies.config.NODE_ENV !== "test") {
    await registerVirtualEvents(app);
  }

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    void reply.status(500).send({ error: "An unexpected server error occurred" });
  });

  return app;
}
