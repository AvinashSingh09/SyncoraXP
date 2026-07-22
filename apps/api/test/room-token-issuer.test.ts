import assert from "node:assert/strict";
import test from "node:test";
import { TrackSource } from "livekit-server-sdk";
import { LiveKitRoomTokenIssuer } from "../src/livekit/room-token-issuer";

function decodePayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  assert.ok(payload);
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

const config = {
  serverUrl: "wss://livekit.example.com",
  apiKey: "test-key",
  apiSecret: "test-secret",
};

test("creates host grants only from the server-selected role", async () => {
  const issuer = new LiveKitRoomTokenIssuer({
    serverUrl: "wss://example.livekit.cloud",
    apiKey: "test-key",
    apiSecret: "a-test-secret-that-is-long-enough-for-signing",
  });
  const issued = await issuer.issue({
    roomName: "room-123",
    meetingId: "meeting-123",
    name: "Host Person",
    role: "host",
    userId: "user-123",
  });
  const claims = decodePayload(issued.participantToken) as {
    video?: Record<string, unknown>;
    attributes?: Record<string, string>;
  };
  assert.equal(claims.video?.roomJoin, true);
  assert.equal(claims.video?.roomAdmin, true);
  assert.equal(claims.video?.room, "room-123");
  assert.equal(claims.attributes?.role, "host");
  assert.equal(claims.attributes?.meetingId, "meeting-123");
});

test("guest grants allow media but never room administration", async () => {
  const issuer = new LiveKitRoomTokenIssuer({
    serverUrl: "wss://example.livekit.cloud",
    apiKey: "test-key",
    apiSecret: "a-test-secret-that-is-long-enough-for-signing",
  });
  const issued = await issuer.issue({
    roomName: "room-123",
    meetingId: "meeting-123",
    name: "Guest Person",
    role: "guest",
  });
  const claims = decodePayload(issued.participantToken) as { video?: Record<string, unknown> };
  assert.equal(claims.video?.roomJoin, true);
  assert.equal(claims.video?.canPublish, true);
  assert.equal(claims.video?.canSubscribe, true);
  assert.notEqual(claims.video?.roomAdmin, true);
});

test("guest media updates preserve subscription and data permissions", async () => {
  const mutedTracks: Array<{ identity: string; trackSid: string }> = [];
  const permissionUpdates: Array<{ identity: string; permission: Record<string, unknown> }> = [];
  const roomService = {
    async listRooms() { return [{ name: "meeting-1" }]; },
    async listParticipants() {
      return [{
        identity: "guest-1",
        attributes: { role: "guest" },
        tracks: [{ sid: "TR_MIC", source: TrackSource.MICROPHONE }],
        permission: {
          canSubscribe: true,
          canPublish: true,
          canPublishData: true,
          canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
          canSubscribeMetrics: true,
        },
      }];
    },
    async mutePublishedTrack(_room: string, identity: string, trackSid: string) {
      mutedTracks.push({ identity, trackSid });
      return {};
    },
    async updateParticipant(_room: string, identity: string, options: { permission: Record<string, unknown> }) {
      permissionUpdates.push({ identity, permission: options.permission });
      return {};
    },
    async deleteRoom() {},
  };
  const issuer = new LiveKitRoomTokenIssuer(config, () => roomService as never);

  await issuer.updateGuestMediaPermissions("meeting-1", true, false);

  assert.deepEqual(mutedTracks, [{ identity: "guest-1", trackSid: "TR_MIC" }]);
  assert.equal(permissionUpdates.length, 1);
  assert.equal(permissionUpdates[0]?.permission.canSubscribe, true);
  assert.equal(permissionUpdates[0]?.permission.canPublishData, true);
  assert.equal(permissionUpdates[0]?.permission.canSubscribeMetrics, true);
  assert.deepEqual(permissionUpdates[0]?.permission.canPublishSources, [
    TrackSource.CAMERA,
    TrackSource.SCREEN_SHARE,
    TrackSource.SCREEN_SHARE_AUDIO,
  ]);
});

test("guest media updates attempt every guest before reporting failures", async () => {
  const attemptedIdentities: string[] = [];
  const roomService = {
    async listRooms() { return [{ name: "meeting-1" }]; },
    async listParticipants() {
      return [
        { identity: "guest-1", attributes: { role: "guest" }, tracks: [], permission: {} },
        { identity: "guest-2", attributes: { role: "guest" }, tracks: [], permission: {} },
      ];
    },
    async mutePublishedTrack() { return {}; },
    async updateParticipant(_room: string, identity: string) {
      attemptedIdentities.push(identity);
      if (identity === "guest-1") throw new Error("guest disconnected");
      return {};
    },
    async deleteRoom() {},
  };
  const issuer = new LiveKitRoomTokenIssuer(config, () => roomService as never);

  await assert.rejects(
    issuer.updateGuestMediaPermissions("meeting-1", true, true),
    /Could not update media permissions for 1 guest/,
  );
  assert.deepEqual(attemptedIdentities.sort(), ["guest-1", "guest-2"]);
});
