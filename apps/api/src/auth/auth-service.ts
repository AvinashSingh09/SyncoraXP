import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { LoginInput, RegisterInput } from "@voice/shared";
import type { FastifyRequest } from "fastify";
import type { AuthRepository, StoredUser } from "./auth-repository";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "voicemeet_session";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionResult {
  user: AuthenticatedUser;
  token: string;
  expiresAt: Date;
}

function publicUser(user: StoredUser): AuthenticatedUser {
  return { id: user.id, name: user.name, email: user.email };
}

function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    cookies.set(part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim()));
  }
  return cookies;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly sessionDays: number,
  ) {}

  async register(input: RegisterInput): Promise<SessionResult> {
    const user = await this.repository.createUser({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
    return this.createSession(user);
  }

  async login(input: LoginInput): Promise<SessionResult | null> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return null;
    return this.createSession(user);
  }

  async authenticate(request: FastifyRequest): Promise<AuthenticatedUser | null> {
    const token = parseCookies(request.headers.cookie).get(SESSION_COOKIE);
    if (!token) return null;
    const user = await this.repository.findUserBySessionTokenHash(hashSessionToken(token));
    return user ? publicUser(user) : null;
  }

  async logout(request: FastifyRequest): Promise<void> {
    const token = parseCookies(request.headers.cookie).get(SESSION_COOKIE);
    if (token) await this.repository.deleteSession(hashSessionToken(token));
  }

  private async createSession(user: StoredUser): Promise<SessionResult> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.sessionDays * 24 * 60 * 60 * 1_000);
    await this.repository.createSession({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });
    return { user: publicUser(user), token, expiresAt };
  }
}

export function sessionCookie(token: string, expiresAt: Date, secure: boolean): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure ? "; Secure" : ""}`;
}

export function expiredSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
