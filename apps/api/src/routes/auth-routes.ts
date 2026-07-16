import { LoginInputSchema, RegisterInputSchema, type AuthResponse } from "@voice/shared";
import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config";
import { DuplicateEmailError } from "../auth/auth-repository";
import {
  AuthService,
  expiredSessionCookie,
  sessionCookie,
} from "../auth/auth-service";

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: { auth: AuthService; config: Pick<AppConfig, "NODE_ENV"> },
) {
  const secure = dependencies.config.NODE_ENV === "production";

  app.post("/api/auth/register", async (request, reply) => {
    const parsed = RegisterInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid registration" });
    }
    try {
      const result = await dependencies.auth.register(parsed.data);
      reply.header("Set-Cookie", sessionCookie(result.token, result.expiresAt, secure));
      const response: AuthResponse = { user: result.user };
      return reply.status(201).send(response);
    } catch (error) {
      if (error instanceof DuplicateEmailError) return reply.status(409).send({ error: error.message });
      throw error;
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = LoginInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Enter a valid email and password" });
    const result = await dependencies.auth.login(parsed.data);
    if (!result) return reply.status(401).send({ error: "Incorrect email or password" });
    reply.header("Set-Cookie", sessionCookie(result.token, result.expiresAt, secure));
    const response: AuthResponse = { user: result.user };
    return response;
  });

  app.get("/api/auth/me", async (request, reply) => {
    const user = await dependencies.auth.authenticate(request);
    if (!user) return reply.status(401).send({ error: "Not signed in" });
    const response: AuthResponse = { user };
    return response;
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await dependencies.auth.logout(request);
    reply.header("Set-Cookie", expiredSessionCookie(secure));
    return reply.status(204).send();
  });
}
