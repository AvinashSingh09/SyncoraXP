import { randomUUID } from "node:crypto";
import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";

export interface RoomTokenRequest {
  roomName: string;
  meetingId: string;
  name: string;
  role: "host" | "guest";
  userId?: string;
}

export interface IssuedRoomToken {
  serverUrl: string;
  participantToken: string;
  participantIdentity: string;
}

export interface RoomTokenIssuer {
  isConfigured(): boolean;
  issue(request: RoomTokenRequest): Promise<IssuedRoomToken>;
  endRoom(roomName: string): Promise<void>;
}

export class LiveKitRoomTokenIssuer implements RoomTokenIssuer {
  constructor(
    private readonly config: {
      serverUrl?: string;
      apiKey?: string;
      apiSecret?: string;
    },
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
    token.addGrant({
      roomJoin: true,
      room: request.roomName,
      roomAdmin: request.role === "host",
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: [
        TrackSource.CAMERA,
        TrackSource.MICROPHONE,
        TrackSource.SCREEN_SHARE,
        TrackSource.SCREEN_SHARE_AUDIO,
      ],
    });

    return {
      serverUrl: this.config.serverUrl,
      participantToken: await token.toJwt(),
      participantIdentity,
    };
  }

  async endRoom(roomName: string): Promise<void> {
    if (!this.config.serverUrl || !this.config.apiKey || !this.config.apiSecret) {
      throw new Error("LiveKit is not configured");
    }
    const serviceUrl = this.config.serverUrl
      .replace(/^wss:/, "https:")
      .replace(/^ws:/, "http:");
    const rooms = new RoomServiceClient(serviceUrl, this.config.apiKey, this.config.apiSecret);
    await rooms.deleteRoom(roomName);
  }
}
