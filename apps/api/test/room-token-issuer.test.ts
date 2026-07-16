import assert from "node:assert/strict";
import test from "node:test";
import { LiveKitRoomTokenIssuer } from "../src/livekit/room-token-issuer";

function decodePayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  assert.ok(payload);
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

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
