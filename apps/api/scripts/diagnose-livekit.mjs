import { loadEnvFile } from "node:process";
import { RoomServiceClient } from "livekit-server-sdk";

loadEnvFile(new URL("../../../.env", import.meta.url));

const websocketUrl = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
if (!websocketUrl || !apiKey || !apiSecret) {
  throw new Error("LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are required");
}

const serviceUrl = websocketUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
const client = new RoomServiceClient(serviceUrl, apiKey, apiSecret);
const rooms = await client.listRooms();

if (rooms.length === 0) {
  console.log("No active LiveKit rooms.");
  process.exit(0);
}

for (const room of rooms) {
  const participants = await client.listParticipants(room.name);
  console.log(`Room ${room.name}: ${participants.length} participant(s)`);
  for (const participant of participants) {
    console.log(`- ${participant.name || participant.identity} (${participant.identity})`);
    for (const track of participant.tracks) {
      const layers = track.layers
        .map((layer) => `${layer.width}x${layer.height}@${layer.bitrate}`)
        .join(", ");
      console.log(
        `  ${track.source}: ${track.width}x${track.height}, codec=${track.codec || "unknown"}, simulcast=${track.simulcast}, muted=${track.muted}, layers=[${layers}]`,
      );
    }
  }
}
