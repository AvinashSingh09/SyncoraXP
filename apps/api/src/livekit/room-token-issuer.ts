import { randomUUID } from "node:crypto";
import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import type { MeetingTranslationSettings, ParticipantMediaPermissionsResponse } from "@voice/shared";

type RoomService = Pick<
  RoomServiceClient,
  "listRooms" | "listParticipants" | "mutePublishedTrack" | "updateParticipant" | "updateRoomMetadata" | "deleteRoom"
>;

type RoomServiceFactory = (serviceUrl: string, apiKey: string, apiSecret: string) => RoomService;

export interface RoomTokenRequest {
  roomName: string;
  meetingId: string;
  name: string;
  role: "host" | "guest";
  userId?: string;
  allowCamera?: boolean;
  allowMicrophone?: boolean;
}

export interface IssuedRoomToken {
  serverUrl: string;
  participantToken: string;
  participantIdentity: string;
}

export interface RoomTokenIssuer {
  isConfigured(): boolean;
  issue(request: RoomTokenRequest): Promise<IssuedRoomToken>;
  updateGuestMediaPermissions(roomName: string, allowCamera: boolean, allowMicrophone: boolean): Promise<void>;
  updateParticipantMediaPermissions(
    roomName: string,
    participantIdentity: string,
    change: { allowCamera?: boolean; allowMicrophone?: boolean },
  ): Promise<ParticipantMediaPermissionsResponse | null>;
  updateTranslationSettings(roomName: string, settings: MeetingTranslationSettings): Promise<void>;
  endRoom(roomName: string): Promise<void>;
}

export class LiveKitRoomTokenIssuer implements RoomTokenIssuer {
  constructor(
    private readonly config: {
      serverUrl?: string;
      apiKey?: string;
      apiSecret?: string;
    },
    private readonly roomServiceFactory: RoomServiceFactory = (serviceUrl, apiKey, apiSecret) =>
      new RoomServiceClient(serviceUrl, apiKey, apiSecret),
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.serverUrl && this.config.apiKey && this.config.apiSecret);
  }

  async issue(request: RoomTokenRequest): Promise<IssuedRoomToken> {
    if (!this.config.serverUrl || !this.config.apiKey || !this.config.apiSecret) {
      throw new Error("LiveKit is not configured");
    }

    const participantIdentity = `${request.role}-${request.userId ?? "visitor"}-${randomUUID()}`;
    const token = new AccessToken(this.config.apiKey, this.config.apiSecret, {
      identity: participantIdentity,
      name: request.name,
      ttl: "10m",
      attributes: {
        role: request.role,
        meetingId: request.meetingId,
        ...(request.userId ? { userId: request.userId } : {}),
      },
    });
    const canPublishSources = [
      ...(request.role === "host" || request.allowCamera !== false ? [TrackSource.CAMERA] : []),
      ...(request.role === "host" || request.allowMicrophone !== false ? [TrackSource.MICROPHONE] : []),
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ];
    token.addGrant({
      roomJoin: true,
      room: request.roomName,
      roomAdmin: request.role === "host",
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources,
    });

    return {
      serverUrl: this.config.serverUrl,
      participantToken: await token.toJwt(),
      participantIdentity,
    };
  }

  async updateGuestMediaPermissions(roomName: string, allowCamera: boolean, allowMicrophone: boolean): Promise<void> {
    if (!this.config.serverUrl || !this.config.apiKey || !this.config.apiSecret) return;
    const serviceUrl = this.config.serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const rooms = this.roomServiceFactory(serviceUrl, this.config.apiKey, this.config.apiSecret);
    if (!(await rooms.listRooms([roomName])).length) return;
    const sources = [
      ...(allowCamera ? [TrackSource.CAMERA] : []),
      ...(allowMicrophone ? [TrackSource.MICROPHONE] : []),
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ];
    const guests = (await rooms.listParticipants(roomName)).filter(
      (participant) => participant.attributes?.role === "guest",
    );
    const updates = await Promise.allSettled(
      guests.map(async (participant) => {
        if (!allowCamera || !allowMicrophone) {
          for (const track of participant.tracks ?? []) {
            if ((!allowCamera && track.source === TrackSource.CAMERA) ||
                (!allowMicrophone && track.source === TrackSource.MICROPHONE)) {
              await rooms.mutePublishedTrack(roomName, participant.identity, track.sid, true);
            }
          }
        }
        await rooms.updateParticipant(roomName, participant.identity, {
          permission: {
            ...participant.permission,
            canSubscribe: true,
            canPublish: true,
            canPublishData: true,
            canPublishSources: sources,
          },
        });
      }),
    );
    const failures = updates.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failures.length > 0) {
      throw new AggregateError(
        failures.map((failure) => failure.reason),
        `Could not update media permissions for ${failures.length} guest(s)`,
      );
    }
  }

  async updateParticipantMediaPermissions(
    roomName: string,
    participantIdentity: string,
    change: { allowCamera?: boolean; allowMicrophone?: boolean },
  ): Promise<ParticipantMediaPermissionsResponse | null> {
    if (!this.config.serverUrl || !this.config.apiKey || !this.config.apiSecret) return null;
    const serviceUrl = this.config.serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const rooms = this.roomServiceFactory(serviceUrl, this.config.apiKey, this.config.apiSecret);
    if (!(await rooms.listRooms([roomName])).length) return null;
    const participant = (await rooms.listParticipants(roomName)).find(
      (candidate) =>
        candidate.identity === participantIdentity && candidate.attributes?.role === "guest",
    );
    if (!participant) return null;

    const sources = new Set(participant.permission?.canPublishSources ?? []);
    if (change.allowCamera !== undefined) {
      if (change.allowCamera) sources.add(TrackSource.CAMERA);
      else sources.delete(TrackSource.CAMERA);
    }
    if (change.allowMicrophone !== undefined) {
      if (change.allowMicrophone) sources.add(TrackSource.MICROPHONE);
      else sources.delete(TrackSource.MICROPHONE);
    }

    for (const track of participant.tracks ?? []) {
      if (
        (change.allowCamera === false && track.source === TrackSource.CAMERA) ||
        (change.allowMicrophone === false && track.source === TrackSource.MICROPHONE)
      ) {
        await rooms.mutePublishedTrack(roomName, participant.identity, track.sid, true);
      }
    }

    const canPublishSources = [...sources];
    await rooms.updateParticipant(roomName, participant.identity, {
      permission: {
        ...participant.permission,
        canSubscribe: true,
        canPublish: true,
        canPublishData: true,
        canPublishSources,
      },
    });
    return {
      participantIdentity,
      allowCamera: sources.has(TrackSource.CAMERA),
      allowMicrophone: sources.has(TrackSource.MICROPHONE),
    };
  }

  async updateTranslationSettings(
    roomName: string,
    settings: MeetingTranslationSettings,
  ): Promise<void> {
    if (!this.config.serverUrl || !this.config.apiKey || !this.config.apiSecret) return;
    const serviceUrl = this.config.serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const rooms = this.roomServiceFactory(serviceUrl, this.config.apiKey, this.config.apiSecret);
    const room = (await rooms.listRooms([roomName]))[0];
    if (!room) return;

    let metadata: Record<string, unknown> = {};
    if (room.metadata) {
      try {
        const parsed = JSON.parse(room.metadata);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) metadata = parsed;
      } catch {
        // Replace malformed room metadata with a valid SyncoraXP envelope.
      }
    }
    const existingSyncora = metadata.syncoraxp;
    metadata.syncoraxp = {
      ...(existingSyncora && typeof existingSyncora === "object" && !Array.isArray(existingSyncora)
        ? existingSyncora
        : {}),
      translation: { version: 1, settings },
    };
    await rooms.updateRoomMetadata(roomName, JSON.stringify(metadata));
  }

  async endRoom(roomName: string): Promise<void> {
    if (!this.config.serverUrl || !this.config.apiKey || !this.config.apiSecret) {
      throw new Error("LiveKit is not configured");
    }
    const serviceUrl = this.config.serverUrl
      .replace(/^wss:/, "https:")
      .replace(/^ws:/, "http:");
    const rooms = this.roomServiceFactory(serviceUrl, this.config.apiKey, this.config.apiSecret);
    await rooms.deleteRoom(roomName);
  }
}
