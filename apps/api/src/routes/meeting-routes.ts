import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  AdmissionDecisionInputSchema,
  CreateMeetingInputSchema,
  type CreateMeetingResponse,
  GuestAdmissionInputSchema,
  type GuestAdmissionResponse,
  type GuestAdmissionStatusResponse,
  type HostMeetingResponse,
  type HostAdmissionListResponse,
  type MeetingSettingsResponse,
  type MyMeetingsResponse,
  GuestRoomSessionInputSchema,
  type RoomSessionResponse,
  type PublicMeetingResponse,
  UpdateMeetingSettingsInputSchema,
} from "@voice/shared";
import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config";
import type { AuthService, AuthenticatedUser } from "../auth/auth-service";
import type { MeetingRepository, StoredMeeting } from "../db/meeting-repository";
import type { InvitationMailer } from "../email/invitation-mailer";
import type { RoomTokenIssuer } from "../livekit/room-token-issuer";
import type { TranslationRepository } from "../translation/translation-repository";

interface MeetingRouteDependencies {
  config: Pick<AppConfig, "APP_BASE_URL">;
  repository: MeetingRepository;
  mailer: InvitationMailer;
  auth: AuthService;
  roomTokens: RoomTokenIssuer;
  translations: TranslationRepository;
}

function joinUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/$/, "")}/join/${code}`;
}

function hostUrl(baseUrl: string, id: string): string {
  return `${baseUrl.replace(/\/$/, "")}/meetings/${id}/host`;
}

function hashAdmissionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function bearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function meetingSummary(meeting: StoredMeeting, baseUrl: string) {
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    organizerName: meeting.organizerName,
    scheduledFor: meeting.scheduledFor?.toISOString() ?? null,
    joinUrl: joinUrl(baseUrl, meeting.joinCode),
    hostUrl: hostUrl(baseUrl, meeting.id),
    status: meeting.status,
    createdAt: meeting.createdAt.toISOString(),
  };
}

async function requireUser(
  dependencies: MeetingRouteDependencies,
  request: Parameters<AuthService["authenticate"]>[0],
  reply: { status(code: number): { send(body: unknown): unknown } },
): Promise<AuthenticatedUser | null> {
  const user = await dependencies.auth.authenticate(request);
  if (!user) reply.status(401).send({ error: "Sign in to continue" });
  return user;
}

function publicMeeting(meeting: StoredMeeting): PublicMeetingResponse {
  return {
    meeting: {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      organizerName: meeting.organizerName,
      scheduledFor: meeting.scheduledFor?.toISOString() ?? null,
      status: meeting.status,
    },
  };
}

export async function registerMeetingRoutes(
  app: FastifyInstance,
  dependencies: MeetingRouteDependencies,
) {
  app.post("/api/meetings", async (request, reply) => {
    const user = await requireUser(dependencies, request, reply);
    if (!user) return;
    const parsed = CreateMeetingInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid meeting details",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    const uniqueInvitees = Array.from(
      new Map(parsed.data.invitees.map((invitee) => [invitee.email, invitee])).values(),
    );
    const id = randomUUID();
    const code = randomBytes(24).toString("base64url");
    const created = await dependencies.repository.createMeeting({
      id,
      joinCode: code,
      livekitRoomName: `meeting_${id}`,
      creator: user,
      input: { ...parsed.data, invitees: uniqueInvitees },
      invitations: uniqueInvitees.map((invitee) => ({ id: randomUUID(), ...invitee })),
    });
    const url = joinUrl(dependencies.config.APP_BASE_URL, code);

    for (const invitation of created.invitations) {
      try {
        const delivery = await dependencies.mailer.sendInvitation({
          invitationId: invitation.id,
          recipientEmail: invitation.recipientEmail,
          recipientName: invitation.recipientName,
          organizerName: created.meeting.organizerName,
          meetingTitle: created.meeting.title,
          joinUrl: url,
          scheduledFor: created.meeting.scheduledFor,
        });
        invitation.status = delivery.status;
        invitation.providerRequestId = delivery.providerRequestId;
        await dependencies.repository.updateInvitationDelivery(invitation.id, delivery);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email delivery error";
        invitation.status = "failed";
        invitation.lastError = message;
        await dependencies.repository.updateInvitationDelivery(invitation.id, {
          status: "failed",
          error: message,
        });
      }
    }

    const response: CreateMeetingResponse = {
      meeting: meetingSummary(created.meeting, dependencies.config.APP_BASE_URL),
      invitations: created.invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.recipientEmail,
        name: invitation.recipientName,
        status: invitation.status,
        ...(invitation.lastError ? { error: invitation.lastError } : {}),
      })),
    };
    return reply.status(201).send(response);
  });

  app.get("/api/meetings", async (request, reply) => {
    const user = await requireUser(dependencies, request, reply);
    if (!user) return;
    const meetings = await dependencies.repository.listByOwner(user.id);
    const response: MyMeetingsResponse = {
      meetings: meetings.map((meeting) => meetingSummary(meeting, dependencies.config.APP_BASE_URL)),
    };
    return response;
  });

  app.delete<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const deleted = await dependencies.repository.deleteByOwner(request.params.meetingId, user.id);
      if (!deleted) return reply.status(404).send({ error: "Meeting not found" });
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/host",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const meeting = await dependencies.repository.findByIdForHost(request.params.meetingId, user.id);
      if (!meeting) return reply.status(404).send({ error: "Host meeting not found" });
      const response: HostMeetingResponse = {
        meeting: meetingSummary(meeting, dependencies.config.APP_BASE_URL),
        role: "host",
        settings: {
          isLocked: meeting.isLocked,
          waitingRoomEnabled: meeting.waitingRoomEnabled,
          allowGuestCamera: meeting.allowGuestCamera,
          allowGuestMicrophone: meeting.allowGuestMicrophone,
        },
      };
      return response;
    },
  );

  app.patch<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/settings",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const parsed = UpdateMeetingSettingsInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Choose a valid host setting to update" });
      }
      const meeting = await dependencies.repository.updateSettingsForHost(
        request.params.meetingId,
        user.id,
        parsed.data,
      );
      if (!meeting) return reply.status(404).send({ error: "Host meeting not found" });
      if (parsed.data.allowGuestCamera !== undefined || parsed.data.allowGuestMicrophone !== undefined) {
        try {
          await dependencies.roomTokens.updateGuestMediaPermissions(
            meeting.livekitRoomName,
            meeting.allowGuestCamera,
            meeting.allowGuestMicrophone,
          );
        } catch (error) {
          request.log.warn({ error }, "Could not sync guest media permissions");
        }
      }
      const response: MeetingSettingsResponse = {
        settings: {
          isLocked: meeting.isLocked,
          waitingRoomEnabled: meeting.waitingRoomEnabled,
          allowGuestCamera: meeting.allowGuestCamera,
          allowGuestMicrophone: meeting.allowGuestMicrophone,
        },
      };
      return response;
    },
  );

  app.post<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/end",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const meeting = await dependencies.repository.findByIdForHost(request.params.meetingId, user.id);
      if (!meeting) return reply.status(404).send({ error: "Host meeting not found" });
      if (!dependencies.roomTokens.isConfigured()) {
        return reply.status(503).send({ error: "LiveKit is not configured" });
      }
      const ended = await dependencies.repository.endForHost(meeting.id, user.id);
      if (!ended) return reply.status(404).send({ error: "Host meeting not found" });
      await dependencies.translations.requestStop(ended.id);
      try {
        await dependencies.roomTokens.endRoom(ended.livekitRoomName);
      } catch (error) {
        request.log.error(error);
        return reply.status(502).send({
          error: "The meeting was closed to new guests, but connected participants could not be disconnected. Try again.",
        });
      }
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/host-session",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const meeting = await dependencies.repository.findByIdForHost(request.params.meetingId, user.id);
      if (!meeting || meeting.status === "ended") {
        return reply.status(404).send({ error: "Host meeting not found or no longer available" });
      }
      if (!dependencies.roomTokens.isConfigured()) {
        return reply.status(503).send({
          error: "LiveKit is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET to .env.",
        });
      }
      const issued = await dependencies.roomTokens.issue({
        roomName: meeting.livekitRoomName,
        meetingId: meeting.id,
        name: user.name,
        role: "host",
        userId: user.id,
        allowCamera: true,
        allowMicrophone: true,
      });
      let translation = await dependencies.translations.getSettings(meeting.id);
      if (translation.enabled) {
        translation = await dependencies.translations.updateSettings(meeting.id, {
          designatedSpeakerIdentity: issued.participantIdentity,
        });
        await dependencies.translations.queueRun({
          id: randomUUID(),
          meetingId: meeting.id,
          livekitRoomName: meeting.livekitRoomName,
          speakerParticipantIdentity: issued.participantIdentity,
          provider: translation.provider,
          model: translation.model,
        });
      }
      const response: RoomSessionResponse = {
        serverUrl: issued.serverUrl,
        participantToken: issued.participantToken,
        meetingId: meeting.id,
        participantIdentity: issued.participantIdentity,
        roomName: meeting.livekitRoomName,
        role: "host",
        translation,
      };
      return reply.status(201).send(response);
    },
  );

  app.get<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/admissions",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const meeting = await dependencies.repository.findByIdForHost(request.params.meetingId, user.id);
      if (!meeting) return reply.status(404).send({ error: "Host meeting not found" });
      const admissions = await dependencies.repository.listPendingAdmissionRequests(meeting.id, user.id);
      const response: HostAdmissionListResponse = {
        requests: admissions.map((admission) => ({
          id: admission.id,
          displayName: admission.displayName,
          status: admission.status,
          requestedAt: admission.requestedAt.toISOString(),
        })),
      };
      return response;
    },
  );

  app.patch<{ Params: { meetingId: string; admissionId: string } }>(
    "/api/meetings/:meetingId/admissions/:admissionId",
    async (request, reply) => {
      const user = await requireUser(dependencies, request, reply);
      if (!user) return;
      const parsed = AdmissionDecisionInputSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "Choose admit or deny" });
      const admission = await dependencies.repository.decideAdmissionRequest(
        request.params.meetingId,
        request.params.admissionId,
        user.id,
        parsed.data.decision,
      );
      if (!admission) return reply.status(404).send({ error: "Pending guest not found" });
      return { status: admission.status };
    },
  );

  app.get<{ Params: { joinCode: string } }>("/api/join/:joinCode", async (request, reply) => {
    const meeting = await dependencies.repository.findByJoinCode(request.params.joinCode);
    if (!meeting || meeting.status === "ended") {
      return reply.status(404).send({ error: "Meeting not found or no longer available" });
    }
    return publicMeeting(meeting);
  });

  app.post<{ Params: { joinCode: string } }>(
    "/api/join/:joinCode/admissions",
    async (request, reply) => {
      const parsed = GuestAdmissionInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid display name" });
      }
      const meeting = await dependencies.repository.findByJoinCode(request.params.joinCode);
      if (!meeting || meeting.status === "ended") {
        return reply.status(404).send({ error: "Meeting not found or no longer available" });
      }
      if (meeting.isLocked) {
        return reply.status(423).send({ error: "This meeting is locked by the host" });
      }
      const token = randomBytes(32).toString("base64url");
      const admission = await dependencies.repository.createAdmissionRequest({
        id: randomUUID(),
        meetingId: meeting.id,
        displayName: parsed.data.displayName,
        tokenHash: hashAdmissionToken(token),
        status: meeting.waitingRoomEnabled ? "pending" : "admitted",
      });
      const response: GuestAdmissionResponse = {
        admissionId: admission.id,
        admissionToken: token,
        status: admission.status,
      };
      return reply.status(201).send(response);
    },
  );

  app.get<{ Params: { joinCode: string; admissionId: string } }>(
    "/api/join/:joinCode/admissions/:admissionId",
    async (request, reply) => {
      const token = bearerToken(request.headers.authorization);
      if (!token) return reply.status(401).send({ error: "Admission credential required" });
      const meeting = await dependencies.repository.findByJoinCode(request.params.joinCode);
      if (!meeting || meeting.status === "ended") {
        return reply.status(404).send({ error: "Meeting not found or no longer available" });
      }
      const admission = await dependencies.repository.findAdmissionRequest(
        meeting.id,
        request.params.admissionId,
        hashAdmissionToken(token),
      );
      if (!admission) return reply.status(404).send({ error: "Admission request not found" });
      const response: GuestAdmissionStatusResponse = { status: admission.status };
      return response;
    },
  );

  app.post<{ Params: { joinCode: string } }>(
    "/api/join/:joinCode/session",
    async (request, reply) => {
      const parsed = GuestRoomSessionInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "A valid admission request is required" });
      }
      const token = bearerToken(request.headers.authorization);
      if (!token) return reply.status(401).send({ error: "Admission credential required" });
      const meeting = await dependencies.repository.findByJoinCode(request.params.joinCode);
      if (!meeting || meeting.status === "ended") {
        return reply.status(404).send({ error: "Meeting not found or no longer available" });
      }
      if (meeting.isLocked) {
        return reply.status(423).send({ error: "This meeting is locked by the host" });
      }
      const admission = await dependencies.repository.findAdmissionRequest(
        meeting.id,
        parsed.data.admissionId,
        hashAdmissionToken(token),
      );
      if (!admission || admission.status !== "admitted") {
        return reply.status(403).send({ error: "Wait for the host to admit you" });
      }
      if (!dependencies.roomTokens.isConfigured()) {
        return reply.status(503).send({
          error: "This meeting room is not connected to LiveKit yet. Ask the host to finish LiveKit setup.",
        });
      }
      const issued = await dependencies.roomTokens.issue({
        roomName: meeting.livekitRoomName,
        meetingId: meeting.id,
        name: admission.displayName,
        role: "guest",
        allowCamera: meeting.allowGuestCamera,
        allowMicrophone: meeting.allowGuestMicrophone,
      });
      const response: RoomSessionResponse = {
        serverUrl: issued.serverUrl,
        participantToken: issued.participantToken,
        meetingId: meeting.id,
        participantIdentity: issued.participantIdentity,
        roomName: meeting.livekitRoomName,
        role: "guest",
        translation: await dependencies.translations.getSettings(meeting.id),
      };
      return reply.status(201).send(response);
    },
  );
}
