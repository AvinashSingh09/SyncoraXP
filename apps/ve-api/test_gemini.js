require('dotenv').config();
const WebSocket = require('ws');

const key = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
if (!key) {
    console.error("No API key");
    process.exit(1);
}

const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log("Connected to Gemini Live API");
    const setupMessage = {
        setup: {
            model: "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
                responseModalities: ["AUDIO"]
            },
            systemInstruction: {
                parts: [{ text: "You are a translator. Translate into Spanish. Say 'Hello' in Spanish." }]
            }
        }
    };
    ws.send(JSON.stringify(setupMessage));
    console.log("Sent setup message");
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log("Received from Gemini:", Object.keys(msg));
    if (msg.setupComplete) {
        console.log("Setup complete, sending client content to trigger response");
        const clientContent = {
            clientContent: {
                turns: [{
                    role: "user",
                    parts: [{ text: "Hello, please start translating now." }]
                }],
                turnComplete: true
            }
        };
        ws.send(JSON.stringify(clientContent));
    }
    if (msg.serverContent) {
        console.log("Got server content!");
        if (msg.serverContent.modelTurn) {
             console.log("Parts count:", msg.serverContent.modelTurn.parts.length);
        }
    }
});

ws.on('close', (code, reason) => {
    console.log(`Connection closed: code=${code}, reason=${reason.toString()}`);
});

ws.on('error', (err) => {
    console.error("WebSocket error:", err);
});
