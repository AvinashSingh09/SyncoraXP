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
console.log(`Authenticated LiveKit API OK; rooms: ${rooms.length}`);
