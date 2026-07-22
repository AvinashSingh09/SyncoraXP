import { randomUUID } from "node:crypto";
import {
  UpdateMeetingTranslationInputSchema,
  type MeetingTranslationResponse,
} from "@voice/shared";
import type { FastifyInstance } from "fastify";
import type { AuthService } from "../auth/auth-service";
import type { MeetingRepository } from "../db/meeting-repository";
import type { RoomTokenIssuer } from "../livekit/room-token-issuer";
import type { TranslationRepository } from "../translation/translation-repository";

interface TranslationRouteDependencies {
  auth: AuthService;
  repository: MeetingRepository;
  roomTokens: RoomTokenIssuer;
  translations: TranslationRepository;
}

export async function registerTranslationRoutes(
  app: FastifyInstance,
  dependencies: TranslationRouteDependencies,
) {
  app.get<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/translation",
    async (request, reply) => {
      const user = await dependencies.auth.authenticate(request);
      if (!user) return reply.status(401).send({ error: "Sign in to continue" });
      const meeting = await dependencies.repository.findByIdForHost(
        request.params.meetingId,
        user.id,
      );
      if (!meeting) return reply.status(404).send({ error: "Host meeting not found" });
      const response: MeetingTranslationResponse = {
        settings: await dependencies.translations.getSettings(meeting.id),
        runtime: await dependencies.translations.getRuntime(meeting.id),
      };
      return response;
    },
  );

  app.patch<{ Params: { meetingId: string } }>(
    "/api/meetings/:meetingId/translation",
    async (request, reply) => {
      const user = await dependencies.auth.authenticate(request);
      if (!user) return reply.status(401).send({ error: "Sign in to continue" });
      const meeting = await dependencies.repository.findByIdForHost(
        request.params.meetingId,
        user.id,
      );
      if (!meeting) return reply.status(404).send({ error: "Host meeting not found" });
      if (meeting.status === "ended") {
        return reply.status(409).send({ error: "An ended meeting cannot start interpretation" });
      }

      const parsed = UpdateMeetingTranslationInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: parsed.error.issues[0]?.message ?? "Choose valid interpretation settings",
        });
      }

      const current = await dependencies.translations.getSettings(meeting.id);
      const nextEnabled = parsed.data.enabled ?? current.enabled;
      if (
        current.enabled &&
        parsed.data.provider !== undefined &&
        parsed.data.provider !== current.provider
      ) {
        return reply.status(409).send({
          error: "Stop interpretation before changing the translation provider",
        });
      }
      const nextSpeaker =
        parsed.data.designatedSpeakerIdentity === undefined
          ? current.designatedSpeakerIdentity
          : parsed.data.designatedSpeakerIdentity;
      if (nextEnabled && !nextSpeaker) {
        return reply.status(400).send({
          error: "Choose a connected speaker before enabling interpretation",
        });
      }

      const settings = await dependencies.translations.updateSettings(meeting.id, parsed.data);
      await dependencies.roomTokens.updateTranslationSettings(meeting.livekitRoomName, settings);
      if (settings.enabled && settings.designatedSpeakerIdentity) {
        await dependencies.translations.queueRun({
          id: randomUUID(),
          meetingId: meeting.id,
          livekitRoomName: meeting.livekitRoomName,
          speakerParticipantIdentity: settings.designatedSpeakerIdentity,
          provider: settings.provider,
          model: settings.model,
        });
      } else {
        await dependencies.translations.requestStop(meeting.id);
      }

      const response: MeetingTranslationResponse = {
        settings,
        runtime: await dependencies.translations.getRuntime(meeting.id),
      };
      return response;
    },
  );
}
