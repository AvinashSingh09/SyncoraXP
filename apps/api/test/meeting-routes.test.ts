import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { CreateMeetingInput } from "@voice/shared";
import { buildApp } from "../src/app";
import { AuthService } from "../src/auth/auth-service";
import { MemoryAuthRepository } from "../src/auth/memory-auth-repository";
import { MemoryMeetingRepository } from "../src/db/memory-meeting-repository";
import type { InvitationMailer, InvitationMessage } from "../src/email/invitation-mailer";
import type {
  RoomTokenIssuer,
  RoomTokenRequest,
} from "../src/livekit/room-token-issuer";

class FakeMailer implements InvitationMailer {
  messages: InvitationMessage[] = [];
  async sendInvitation(message: InvitationMessage) {
    this.messages.push(message);
    return { status: "sent" as const, providerRequestId: randomUUID() };
  }
}

class FakeRoomTokenIssuer implements RoomTokenIssuer {
  requests: RoomTokenRequest[] = [];
  constructor(private readonly configured = true) {}
  isConfigured() { return this.configured; }
  async issue(request: RoomTokenRequest) {
    this.requests.push(request);
    return {
      serverUrl: "wss://test.livekit.cloud",
      participantToken: `token-${request.role}`,
      participantIdentity: `${request.role}-test-identity`,
    };
  }
}

const config = {
  NODE_ENV: "test" as const,
  PORT: 3000,
  SESSION_DAYS: 7,
  DATABASE_MODE: "memory" as const,
  DATABASE_URL: "postgres://unused",
  APP_BASE_URL: "https://meet.example.com",
  CORS_ORIGIN: "https://meet.example.com",
  EMAIL_MODE: "console" as const,
  ZEPTOMAIL_API_URL: "https://api.zeptomail.in/v1.1/email",
  ZEPTOMAIL_FROM_NAME: "VoiceMeet",
};

const validMeeting: CreateMeetingInput = {
  title: "Weekly product seminar",
  description: "Roadmap and questions",
  scheduledFor: "2026-07-20T10:00:00.000Z",
  invitees: [{ email: "sam@example.com", name: "Sam" }],
};

async function setup(liveKitConfigured = true) {
  const repository = new MemoryMeetingRepository();
  const authRepository = new MemoryAuthRepository();
  const mailer = new FakeMailer();
  const roomTokens = new FakeRoomTokenIssuer(liveKitConfigured);
  const auth = new AuthService(authRepository, 7);
  const app = await buildApp({ config, repository, mailer, auth, roomTokens });
  return { app, mailer, roomTokens };
}

async function registerHost(app: Awaited<ReturnType<typeof buildApp>>, email = "asha@example.com") {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { name: "Asha Rao", email, password: "a-secure-password" },
  });
  assert.equal(response.statusCode, 201);
  const setCookie = response.headers["set-cookie"];
  assert.ok(setCookie);
  const cookieValue = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  assert.ok(cookieValue);
  return cookieValue.split(";")[0];
}

test("requires a host account to create a meeting", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());
  const response = await app.inject({ method: "POST", url: "/api/meetings", payload: validMeeting });
  assert.equal(response.statusCode, 401);
});

test("creates an owned meeting, sends invitations, and keeps the guest link public", async (t) => {
  const { app, mailer } = await setup();
  t.after(() => app.close());
  const cookie = await registerHost(app);

  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie },
    payload: validMeeting,
  });
  assert.equal(created.statusCode, 201);
  const payload = created.json();
  assert.match(payload.meeting.joinUrl, /^https:\/\/meet\.example\.com\/join\//);
  assert.match(payload.meeting.hostUrl, /^https:\/\/meet\.example\.com\/meetings\/.+\/host$/);
  assert.equal(payload.meeting.organizerName, "Asha Rao");
  assert.equal(payload.invitations[0].status, "sent");
  assert.equal(mailer.messages.length, 1);

  const joinCode = payload.meeting.joinUrl.split("/").at(-1);
  const joined = await app.inject({ method: "GET", url: `/api/join/${joinCode}` });
  assert.equal(joined.statusCode, 200);
  assert.equal(joined.json().meeting.title, validMeeting.title);
  assert.equal(joined.json().meeting.organizerEmail, undefined);

  const host = await app.inject({
    method: "GET",
    url: `/api/meetings/${payload.meeting.id}/host`,
    headers: { cookie },
  });
  assert.equal(host.statusCode, 200);
  assert.equal(host.json().role, "host");
});

test("rejects malformed meeting input", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());
  const cookie = await registerHost(app);
  const response = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie },
    payload: { ...validMeeting, title: "x" },
  });
  assert.equal(response.statusCode, 400);
});

test("deduplicates invitation recipients by normalized email", async (t) => {
  const { app, mailer } = await setup();
  t.after(() => app.close());
  const cookie = await registerHost(app);
  const response = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie },
    payload: {
      ...validMeeting,
      invitees: [
        { email: "SAM@example.com", name: "Sam" },
        { email: "sam@example.com", name: "Duplicate" },
      ],
    },
  });
  assert.equal(response.statusCode, 201);
  assert.equal(response.json().invitations.length, 1);
  assert.equal(mailer.messages.length, 1);
});

test("prevents another host from opening an owned host room", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());
  const ownerCookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie: ownerCookie },
    payload: validMeeting,
  });
  const otherCookie = await registerHost(app, "other@example.com");
  const response = await app.inject({
    method: "GET",
    url: `/api/meetings/${created.json().meeting.id}/host`,
    headers: { cookie: otherCookie },
  });
  assert.equal(response.statusCode, 404);
});

test("allows only the owner to delete a meeting and invalidates its guest link", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());
  const ownerCookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie: ownerCookie },
    payload: validMeeting,
  });
  const meeting = created.json().meeting;
  const joinCode = meeting.joinUrl.split("/").at(-1);

  const unauthenticated = await app.inject({
    method: "DELETE",
    url: `/api/meetings/${meeting.id}`,
  });
  assert.equal(unauthenticated.statusCode, 401);

  const otherCookie = await registerHost(app, "other-delete@example.com");
  const otherHost = await app.inject({
    method: "DELETE",
    url: `/api/meetings/${meeting.id}`,
    headers: { cookie: otherCookie },
  });
  assert.equal(otherHost.statusCode, 404);

  const owner = await app.inject({
    method: "DELETE",
    url: `/api/meetings/${meeting.id}`,
    headers: { cookie: ownerCookie },
  });
  assert.equal(owner.statusCode, 204);

  const listed = await app.inject({
    method: "GET",
    url: "/api/meetings",
    headers: { cookie: ownerCookie },
  });
  assert.deepEqual(listed.json().meetings, []);
  const guest = await app.inject({ method: "GET", url: `/api/join/${joinCode}` });
  assert.equal(guest.statusCode, 404);
});

test("supports login, current-user lookup, logout, and duplicate-email protection", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());
  const cookie = await registerHost(app);

  const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.email, "asha@example.com");

  const duplicate = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { name: "Asha", email: "ASHA@example.com", password: "another-password" },
  });
  assert.equal(duplicate.statusCode, 409);

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "asha@example.com", password: "a-secure-password" },
  });
  assert.equal(login.statusCode, 200);

  const logout = await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie } });
  assert.equal(logout.statusCode, 204);
  const afterLogout = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
  assert.equal(afterLogout.statusCode, 401);
});

test("keeps guests in the waiting room until the host admits them", async (t) => {
  const { app, roomTokens } = await setup();
  t.after(() => app.close());
  const cookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie },
    payload: validMeeting,
  });
  const meeting = created.json().meeting;
  const joinCode = meeting.joinUrl.split("/").at(-1);

  const hostSession = await app.inject({
    method: "POST",
    url: `/api/meetings/${meeting.id}/host-session`,
    headers: { cookie },
  });
  assert.equal(hostSession.statusCode, 201);
  assert.equal(hostSession.json().role, "host");

  const directGuestSession = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    payload: { displayName: "Guest Person" },
  });
  assert.equal(directGuestSession.statusCode, 400);

  const requested = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Guest Person" },
  });
  assert.equal(requested.statusCode, 201);
  const admission = requested.json();
  assert.equal(admission.status, "pending");

  const beforeAdmission = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    headers: { authorization: `Bearer ${admission.admissionToken}` },
    payload: { admissionId: admission.admissionId },
  });
  assert.equal(beforeAdmission.statusCode, 403);

  const pending = await app.inject({
    method: "GET",
    url: `/api/meetings/${meeting.id}/admissions`,
    headers: { cookie },
  });
  assert.equal(pending.statusCode, 200);
  assert.equal(pending.json().requests[0].displayName, "Guest Person");

  const accepted = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/admissions/${admission.admissionId}`,
    headers: { cookie },
    payload: { decision: "admitted" },
  });
  assert.equal(accepted.statusCode, 200);

  const status = await app.inject({
    method: "GET",
    url: `/api/join/${joinCode}/admissions/${admission.admissionId}`,
    headers: { authorization: `Bearer ${admission.admissionToken}` },
  });
  assert.equal(status.statusCode, 200);
  assert.equal(status.json().status, "admitted");

  const guestSession = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    headers: { authorization: `Bearer ${admission.admissionToken}` },
    payload: { admissionId: admission.admissionId },
  });
  assert.equal(guestSession.statusCode, 201);
  assert.equal(guestSession.json().role, "guest");
  assert.deepEqual(roomTokens.requests.map((request) => request.role), ["host", "guest"]);
  assert.equal(roomTokens.requests[0]?.name, "Asha Rao");
  assert.equal(roomTokens.requests[1]?.name, "Guest Person");
});

test("protects admission requests from other hosts and denied guests", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());
  const ownerCookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie: ownerCookie },
    payload: validMeeting,
  });
  const meeting = created.json().meeting;
  const joinCode = meeting.joinUrl.split("/").at(-1);
  const requested = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Waiting Guest" },
  });
  const admission = requested.json();

  const wrongCredential = await app.inject({
    method: "GET",
    url: `/api/join/${joinCode}/admissions/${admission.admissionId}`,
    headers: { authorization: "Bearer definitely-the-wrong-token" },
  });
  assert.equal(wrongCredential.statusCode, 404);

  const otherCookie = await registerHost(app, "lobby-other@example.com");
  const otherHost = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/admissions/${admission.admissionId}`,
    headers: { cookie: otherCookie },
    payload: { decision: "admitted" },
  });
  assert.equal(otherHost.statusCode, 404);

  const denied = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/admissions/${admission.admissionId}`,
    headers: { cookie: ownerCookie },
    payload: { decision: "denied" },
  });
  assert.equal(denied.statusCode, 200);

  const deniedSession = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    headers: { authorization: `Bearer ${admission.admissionToken}` },
    payload: { admissionId: admission.admissionId },
  });
  assert.equal(deniedSession.statusCode, 403);
});

test("returns actionable setup guidance when LiveKit is not configured", async (t) => {
  const { app } = await setup(false);
  t.after(() => app.close());
  const cookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie },
    payload: validMeeting,
  });
  const response = await app.inject({
    method: "POST",
    url: `/api/meetings/${created.json().meeting.id}/host-session`,
    headers: { cookie },
  });
  assert.equal(response.statusCode, 503);
  assert.match(response.json().error, /LIVEKIT_URL/);
});
