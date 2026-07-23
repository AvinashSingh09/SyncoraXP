import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { CreateMeetingInput, MeetingTranslationSettings, ParticipantMediaPermissionsResponse } from "@voice/shared";
import { buildApp } from "../src/app";
import { AuthService } from "../src/auth/auth-service";
import { TestMeetingRepository } from "./support/test-meeting-repository";
import type { InvitationMailer, InvitationMessage, DemoMessage } from "../src/email/invitation-mailer";
import type {
  RoomTokenIssuer,
  RoomTokenRequest,
} from "../src/livekit/room-token-issuer";
import { TestAuthRepository } from "./support/test-auth-repository";
import { TestTranslationRepository } from "./support/test-translation-repository";

class FakeMailer implements InvitationMailer {
  messages: InvitationMessage[] = [];
  demoRequests: DemoMessage[] = [];
  async sendInvitation(message: InvitationMessage) {
    this.messages.push(message);
    return { status: "sent" as const, providerRequestId: randomUUID() };
  }
  async sendDemoRequest(message: DemoMessage) {
    this.demoRequests.push(message);
    return { status: "sent" as const, providerRequestId: randomUUID() };
  }
}

class FakeRoomTokenIssuer implements RoomTokenIssuer {
  requests: RoomTokenRequest[] = [];
  endedRooms: string[] = [];
  mediaPermissionUpdates: Array<{
    roomName: string;
    allowCamera: boolean;
    allowMicrophone: boolean;
    allowScreenShare: boolean;
  }> = [];
  translationSettingsUpdates: Array<{ roomName: string; settings: MeetingTranslationSettings }> = [];
  participantMediaPermissionUpdates: Array<{
    roomName: string;
    participantIdentity: string;
    change: { allowCamera?: boolean; allowMicrophone?: boolean };
  }> = [];
  mediaPermissionFailuresRemaining = 0;
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
  async endRoom(roomName: string) {
    this.endedRooms.push(roomName);
  }
  async updateGuestMediaPermissions(
    roomName: string,
    allowCamera: boolean,
    allowMicrophone: boolean,
    allowScreenShare: boolean,
  ) {
    this.mediaPermissionUpdates.push({ roomName, allowCamera, allowMicrophone, allowScreenShare });
    if (this.mediaPermissionFailuresRemaining > 0) {
      this.mediaPermissionFailuresRemaining -= 1;
      throw new Error("LiveKit permission update failed");
    }
  }
  async updateTranslationSettings(roomName: string, settings: MeetingTranslationSettings) {
    this.translationSettingsUpdates.push({ roomName, settings });
  }
  async updateParticipantMediaPermissions(
    roomName: string,
    participantIdentity: string,
    change: { allowCamera?: boolean; allowMicrophone?: boolean },
  ): Promise<ParticipantMediaPermissionsResponse | null> {
    this.participantMediaPermissionUpdates.push({ roomName, participantIdentity, change });
    return {
      participantIdentity,
      allowCamera: change.allowCamera ?? false,
      allowMicrophone: change.allowMicrophone ?? false,
    };
  }
}

const config = {
  NODE_ENV: "test" as const,
  PORT: 3000,
  SESSION_DAYS: 7,
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
  const repository = new TestMeetingRepository();
  const authRepository = new TestAuthRepository();
  const mailer = new FakeMailer();
  const roomTokens = new FakeRoomTokenIssuer(liveKitConfigured);
  const auth = new AuthService(authRepository, 7);
  const translations = new TestTranslationRepository();
  const app = await buildApp({
    config: config as any,
    repository,
    mailer,
    auth,
    roomTokens,
    translations,
  });
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

test("allows PATCH requests during CORS preflight", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());

  const response = await app.inject({
    method: "OPTIONS",
    url: "/api/meetings/example/settings",
    headers: {
      origin: "https://meet.example.com",
      "access-control-request-method": "PATCH",
    },
  });

  assert.equal(response.statusCode, 204);
  assert.match(response.headers["access-control-allow-methods"] ?? "", /PATCH/);
});

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

test("lets hosts disable the waiting room and admits pending and future guests", async (t) => {
  const { app } = await setup();
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

  const pending = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Already Waiting" },
  });
  assert.equal(pending.statusCode, 201);
  assert.equal(pending.json().status, "pending");

  const updated = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/settings`,
    headers: { cookie },
    payload: { waitingRoomEnabled: false },
  });
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(updated.json().settings, {
    isLocked: false,
    waitingRoomEnabled: false,
    allowGuestCamera: true,
    allowGuestMicrophone: true,
    allowGuestScreenShare: false,
  });

  const released = await app.inject({
    method: "GET",
    url: `/api/join/${joinCode}/admissions/${pending.json().admissionId}`,
    headers: { authorization: `Bearer ${pending.json().admissionToken}` },
  });
  assert.equal(released.statusCode, 200);
  assert.equal(released.json().status, "admitted");

  const immediate = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Immediate Guest" },
  });
  assert.equal(immediate.statusCode, 201);
  assert.equal(immediate.json().status, "admitted");

  const guestSession = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    headers: { authorization: `Bearer ${immediate.json().admissionToken}` },
    payload: { admissionId: immediate.json().admissionId },
  });
  assert.equal(guestSession.statusCode, 201);
  assert.equal(guestSession.json().role, "guest");
});

test("locks new guest entry without changing the host session", async (t) => {
  const { app } = await setup();
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

  await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/settings`,
    headers: { cookie },
    payload: { waitingRoomEnabled: false },
  });
  const admitted = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Admitted Before Lock" },
  });
  assert.equal(admitted.json().status, "admitted");

  const locked = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/settings`,
    headers: { cookie },
    payload: { isLocked: true },
  });
  assert.equal(locked.statusCode, 200);
  assert.deepEqual(locked.json().settings, {
    isLocked: true,
    waitingRoomEnabled: false,
    allowGuestCamera: true,
    allowGuestMicrophone: true,
    allowGuestScreenShare: false,
  });

  const newRequest = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Blocked Guest" },
  });
  assert.equal(newRequest.statusCode, 423);
  assert.match(newRequest.json().error, /locked/i);

  const blockedSession = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    headers: { authorization: `Bearer ${admitted.json().admissionToken}` },
    payload: { admissionId: admitted.json().admissionId },
  });
  assert.equal(blockedSession.statusCode, 423);

  const hostSession = await app.inject({
    method: "POST",
    url: `/api/meetings/${meeting.id}/host-session`,
    headers: { cookie },
  });
  assert.equal(hostSession.statusCode, 201);

  const hostMeeting = await app.inject({
    method: "GET",
    url: `/api/meetings/${meeting.id}/host`,
    headers: { cookie },
  });
  assert.deepEqual(hostMeeting.json().settings, {
    isLocked: true,
    waitingRoomEnabled: false,
    allowGuestCamera: true,
    allowGuestMicrophone: true,
    allowGuestScreenShare: false,
  });
});

test("applies guest media and screen-share settings to new and active guests", async (t) => {
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

  const updated = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/settings`,
    headers: { cookie },
    payload: {
      waitingRoomEnabled: false,
      allowGuestCamera: false,
      allowGuestMicrophone: false,
      allowGuestScreenShare: true,
    },
  });
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(updated.json().settings, {
    isLocked: false,
    waitingRoomEnabled: false,
    allowGuestCamera: false,
    allowGuestMicrophone: false,
    allowGuestScreenShare: true,
  });
  const roomName = roomTokens.mediaPermissionUpdates.at(-1)?.roomName;
  assert.ok(roomName);
  assert.deepEqual(roomTokens.mediaPermissionUpdates.at(-1), {
    roomName,
    allowCamera: false,
    allowMicrophone: false,
    allowScreenShare: true,
  });

  const admission = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "No Media Guest" },
  });
  const session = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/session`,
    headers: { authorization: `Bearer ${admission.json().admissionToken}` },
    payload: { admissionId: admission.json().admissionId },
  });
  assert.equal(session.statusCode, 201);
  assert.deepEqual(roomTokens.requests.at(-1), {
    roomName,
    meetingId: meeting.id,
    name: "No Media Guest",
    role: "guest",
    allowCamera: false,
    allowMicrophone: false,
    allowScreenShare: true,
  });
});

test("restores guest media settings when active LiveKit permissions cannot be synchronized", async (t) => {
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
  roomTokens.mediaPermissionFailuresRemaining = 1;

  const updated = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meeting.id}/settings`,
    headers: { cookie },
    payload: { allowGuestCamera: false },
  });

  assert.equal(updated.statusCode, 502);
  assert.deepEqual(roomTokens.mediaPermissionUpdates.slice(-2), [
    {
      roomName: roomTokens.mediaPermissionUpdates.at(-1)?.roomName,
      allowCamera: false,
      allowMicrophone: true,
      allowScreenShare: false,
    },
    {
      roomName: roomTokens.mediaPermissionUpdates.at(-1)?.roomName,
      allowCamera: true,
      allowMicrophone: true,
      allowScreenShare: false,
    },
  ]);

  const hostMeeting = await app.inject({
    method: "GET",
    url: `/api/meetings/${meeting.id}/host`,
    headers: { cookie },
  });
  assert.equal(hostMeeting.statusCode, 200);
  assert.equal(hostMeeting.json().settings.allowGuestCamera, true);
  assert.equal(hostMeeting.json().settings.allowGuestMicrophone, true);
});

test("lets only the host update a connected guest's individual media permissions", async (t) => {
  const { app, roomTokens } = await setup();
  t.after(() => app.close());
  const cookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie },
    payload: validMeeting,
  });
  const meetingId = created.json().meeting.id;

  const unauthenticated = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/participants/guest-1/media-permissions`,
    payload: { allowMicrophone: true },
  });
  assert.equal(unauthenticated.statusCode, 401);

  const updated = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/participants/guest-1/media-permissions`,
    headers: { cookie },
    payload: { allowCamera: false, allowMicrophone: true },
  });
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(updated.json(), {
    participantIdentity: "guest-1",
    allowCamera: false,
    allowMicrophone: true,
  });
  assert.deepEqual(roomTokens.participantMediaPermissionUpdates.at(-1), {
    roomName: roomTokens.participantMediaPermissionUpdates.at(-1)?.roomName,
    participantIdentity: "guest-1",
    change: { allowCamera: false, allowMicrophone: true },
  });
});

test("lets only the host end a meeting for every participant", async (t) => {
  const { app, roomTokens } = await setup();
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
  const pending = await app.inject({
    method: "POST",
    url: `/api/join/${joinCode}/admissions`,
    payload: { displayName: "Waiting When Ended" },
  });
  assert.equal(pending.statusCode, 201);

  const unauthenticated = await app.inject({
    method: "POST",
    url: `/api/meetings/${meeting.id}/end`,
  });
  assert.equal(unauthenticated.statusCode, 401);

  const otherCookie = await registerHost(app, "other-ending@example.com");
  const otherHost = await app.inject({
    method: "POST",
    url: `/api/meetings/${meeting.id}/end`,
    headers: { cookie: otherCookie },
  });
  assert.equal(otherHost.statusCode, 404);

  const ended = await app.inject({
    method: "POST",
    url: `/api/meetings/${meeting.id}/end`,
    headers: { cookie: ownerCookie },
  });
  assert.equal(ended.statusCode, 204);
  assert.equal(roomTokens.endedRooms.length, 1);

  const hostMeeting = await app.inject({
    method: "GET",
    url: `/api/meetings/${meeting.id}/host`,
    headers: { cookie: ownerCookie },
  });
  assert.equal(hostMeeting.json().meeting.status, "ended");

  const guestLink = await app.inject({ method: "GET", url: `/api/join/${joinCode}` });
  assert.equal(guestLink.statusCode, 404);
  const hostSession = await app.inject({
    method: "POST",
    url: `/api/meetings/${meeting.id}/host-session`,
    headers: { cookie: ownerCookie },
  });
  assert.equal(hostSession.statusCode, 404);
  const pendingStatus = await app.inject({
    method: "GET",
    url: `/api/join/${joinCode}/admissions/${pending.json().admissionId}`,
    headers: { authorization: `Bearer ${pending.json().admissionToken}` },
  });
  assert.equal(pendingStatus.statusCode, 404);
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

test("handles book a demo request successfully", async (t) => {
  const { app, mailer } = await setup();
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/demo",
    payload: {
      fullName: "Jane Doe",
      workEmail: "jane@example.com",
      phone: "1234567890",
      countryCode: "+91",
      city: "Bangalore",
      company: "Acme Corp",
      category: "SaaS / Technology",
      message: "Please show me a demo",
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().success, true);
  
  // Ensure the mailer received it
  const fakeMailer = mailer as FakeMailer;
  assert.equal(fakeMailer.demoRequests.length, 1);
  assert.equal(fakeMailer.demoRequests[0]?.fullName, "Jane Doe");
  assert.equal(fakeMailer.demoRequests[0]?.workEmail, "jane@example.com");
});

test("rejects malformed demo request", async (t) => {
  const { app } = await setup();
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/demo",
    payload: {
      fullName: "J",
      workEmail: "not-an-email",
      phone: "1",
      countryCode: "+91",
      city: "",
      company: "",
      category: "",
    },
  });

  assert.equal(response.statusCode, 400);
});

test("lets only the host configure and queue meeting interpretation", async (t) => {
  const { app, roomTokens } = await setup();
  t.after(() => app.close());
  const ownerCookie = await registerHost(app);
  const created = await app.inject({
    method: "POST",
    url: "/api/meetings",
    headers: { cookie: ownerCookie },
    payload: validMeeting,
  });
  const meetingId = created.json().meeting.id;

  const unauthenticated = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    payload: { enabled: true, designatedSpeakerIdentity: "host-speaker" },
  });
  assert.equal(unauthenticated.statusCode, 401);

  const missingSpeaker = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: { enabled: true },
  });
  assert.equal(missingSpeaker.statusCode, 400);

  const geminiSelected = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: { provider: "gemini" },
  });
  assert.equal(geminiSelected.statusCode, 200);
  assert.equal(geminiSelected.json().settings.provider, "gemini");
  assert.equal(
    geminiSelected.json().settings.model,
    "gemini-3.5-live-translate-preview",
  );

  const enabled = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: {
      enabled: true,
      designatedSpeakerIdentity: "host-original-identity",
      allowedTargetLanguages: ["hi", "bn", "mr", "ta", "te", "hi"],
    },
  });
  assert.equal(enabled.statusCode, 200);
  assert.equal(enabled.json().settings.enabled, true);
  assert.equal(enabled.json().settings.designatedSpeakerIdentity, "host-original-identity");
  assert.deepEqual(enabled.json().settings.allowedTargetLanguages, ["hi", "bn", "mr", "ta", "te"]);
  assert.equal(enabled.json().runtime.status, "queued");
  assert.ok(enabled.json().runtime.runId);
  assert.equal(roomTokens.translationSettingsUpdates.at(-1)?.settings.enabled, true);
  const firstRunId = enabled.json().runtime.runId;

  const providerChangeWhileRunning = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: { provider: "openai" },
  });
  assert.equal(providerChangeWhileRunning.statusCode, 409);

  const refreshedHostSession = await app.inject({
    method: "POST",
    url: `/api/meetings/${meetingId}/host-session`,
    headers: { cookie: ownerCookie },
  });
  assert.equal(refreshedHostSession.statusCode, 201);
  assert.equal(
    refreshedHostSession.json().translation.designatedSpeakerIdentity,
    "host-test-identity",
  );

  const fetched = await app.inject({
    method: "GET",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
  });
  assert.equal(fetched.statusCode, 200);
  assert.equal(fetched.json().settings.provider, "gemini");
  assert.equal(fetched.json().settings.model, "gemini-3.5-live-translate-preview");
  assert.equal(fetched.json().settings.designatedSpeakerIdentity, "host-test-identity");
  assert.notEqual(fetched.json().runtime.runId, firstRunId);

  const otherCookie = await registerHost(app, "translation-other@example.com");
  const forbidden = await app.inject({
    method: "GET",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: otherCookie },
  });
  assert.equal(forbidden.statusCode, 404);

  const disabled = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: { enabled: false },
  });
  assert.equal(disabled.statusCode, 200);
  assert.equal(disabled.json().settings.enabled, false);
  assert.equal(disabled.json().runtime.status, "queued");
  assert.equal(roomTokens.translationSettingsUpdates.at(-1)?.settings.enabled, false);

  const openAISelected = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: { provider: "openai" },
  });
  assert.equal(openAISelected.statusCode, 200);
  assert.equal(openAISelected.json().settings.provider, "openai");
  assert.equal(openAISelected.json().settings.model, "gpt-realtime-translate");

  const reenabled = await app.inject({
    method: "PATCH",
    url: `/api/meetings/${meetingId}/translation`,
    headers: { cookie: ownerCookie },
    payload: { enabled: true, provider: "gemini" },
  });
  assert.equal(reenabled.statusCode, 200);
  assert.equal(reenabled.json().settings.enabled, true);
  assert.equal(reenabled.json().settings.provider, "gemini");
  assert.equal(reenabled.json().settings.model, "gemini-3.5-live-translate-preview");
  assert.equal(reenabled.json().runtime.status, "queued");
  assert.notEqual(reenabled.json().runtime.runId, firstRunId);
});
