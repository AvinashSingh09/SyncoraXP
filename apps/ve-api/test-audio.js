require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAudioOut() {
    try {
        const key = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-native-audio-latest' });
        
        const result = await model.generateContent("Say 'Hello world' and return ONLY the audio.");
        const response = await result.response;
        if (response.candidates && response.candidates[0]) {
            console.log("Candidate content parts:", response.candidates[0].content.parts.map(p => Object.keys(p)));
            const parts = response.candidates[0].content.parts;
            const audioPart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio/'));
            if (audioPart) {
                console.log("Found audio part!");
            } else {
                console.log("No audio part found. Text:", response.text());
            }
        }
    } catch (e) {
        console.error("Audio generation failed:", e.message);
    }
}
testAudioOut();
