const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let GEMINI_KEY = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
if (GEMINI_KEY) {
    GEMINI_KEY = GEMINI_KEY.trim().replace(/^["']|["']$/g, '');
}
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;


const GEMINI_MODELS = [
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest'
];

async function translateWithGemini(text, targetLanguage) {
    if (!genAI) throw new Error('No Gemini API key configured');

    const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else, no quotes, no notes.\n\nText: "${text}"`;

    for (const modelName of GEMINI_MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translated = response.text().trim();
            console.log(`[Gemini] Translated using model: ${modelName}`);
            return translated;
        } catch (err) {
            console.warn(`[Gemini] Model "${modelName}" failed: ${err.message}`);
        }
    }
    throw new Error('All Gemini models failed');
}

async function translateWithGoogleFree(text, targetLangCode) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
    const data = await res.json();
    return data[0].map(item => item[0]).filter(Boolean).join('');
}

router.post('/', async (req, res) => {
    try {
        const { text, targetLanguage, targetLangCode } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({ error: 'Text and targetLanguage are required' });
        }

        console.log(`[Translate] "${text}" → ${targetLanguage} (${targetLangCode})`);

        let translatedText = '';
        let method = '';

        // Try Gemini first
        try {
            translatedText = await translateWithGemini(text, targetLanguage);
            method = 'Gemini';
        } catch (geminiError) {
            console.warn(`[Translate] Gemini failed (${geminiError.message}), trying Google Translate free API...`);
            try {
                const fallbackLang = targetLangCode || 'hi';
                translatedText = await translateWithGoogleFree(text, fallbackLang);
                method = 'Google Translate (free)';
            } catch (googleError) {
                console.error(`[Translate] Both APIs failed. Google error: ${googleError.message}`);
                return res.status(500).json({ error: 'All translation services failed' });
            }
        }

        console.log(`[Translate] Success via ${method}: "${translatedText}"`);
        res.json({ translatedText, method });
    } catch (error) {
        console.error('[Translate] Unexpected error:', error);
        res.status(500).json({ error: 'Failed to translate' });
    }
});

module.exports = router;
