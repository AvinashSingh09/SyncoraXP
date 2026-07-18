/**
 * Utility to combine generated AI restyled image with guest name, badge, and quote
 * on an HTML5 canvas, outputting a consolidated high-res downloadable image.
 */

// List of curated quotes mapped by persona style
export const PERSONA_QUOTES = {
    CREATOR: [
        "Art is not what you see, but what you make others see.",
        "To create is to live twice.",
        "Everything you can imagine is real.",
        "Creativity is intelligence having fun.",
        "Design is the silent ambassador of your brand."
    ],
    INNOVATOR: [
        "I imagine energy born from altitude — peaks as power plants of tomorrow.",
        "The best way to predict the future is to invent it.",
        "Innovation distinguishes between a leader and a follower.",
        "Ideas are easy. Implementation is everything.",
        "Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!"
    ],
    LEADER: [
        "A leader is one who knows the way, goes the way, and shows the way.",
        "Leadership is the capacity to translate vision into reality.",
        "Great leaders don't set out to be leaders... they set out to make a difference.",
        "The supreme quality of leadership is unquestionably integrity.",
        "To lead people, walk beside them."
    ],
    DREAMER: [
        "Keep your eyes on the stars, and your feet on the ground.",
        "The future belongs to those who believe in the beauty of their dreams.",
        "A dream you dream alone is only a dream. A dream you dream together is reality.",
        "Dream big and dare to fail.",
        "Miracles start to happen when you give as much energy to your dreams as you do to your fears."
    ],
    EXPLORER: [
        "Not all those who wander are lost.",
        "To explore, to dream, to discover.",
        "The journey of a thousand miles begins with one step.",
        "Adventure is worthwhile in itself.",
        "Only those who will risk going too far can possibly find out how far one can go."
    ]
};

// Badges with colors mapped by persona (no emojis)
export const PERSONA_BADGES = {
    CREATOR: { text: "CREATOR", gradient: ["#FF416C", "#FF4B2B"], icon: "🎨" },
    INNOVATOR: { text: "INNOVATOR", gradient: ["#00F2FE", "#4FACFE"], icon: "💡" },
    LEADER: { text: "LEADER", gradient: ["#F5576C", "#F093FB"], icon: "👑" },
    DREAMER: { text: "DREAMER", gradient: ["#A18CD1", "#FBC2EB"], icon: "✨" },
    EXPLORER: { text: "EXPLORER", gradient: ["#11998E", "#38EF7D"], icon: "🧭" }
};

/**
 * Loads an image from URL and returns a Promise.
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (src.startsWith('http') || src.startsWith('https')) {
            img.crossOrigin = "anonymous"; // Essential to prevent tainted canvas with remote S3/CDN URLs
        }
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error("Failed to load image: " + src));
        img.src = src;
    });
}

/**
 * Text wrapping helper for HTML5 Canvas context.
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + " ";
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    let currentY = y;
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x, currentY);
        currentY += lineHeight;
    }
    return lines.length * lineHeight;
}

/**
 * Combines AI illustration, typed name, quote, and badge into a 9:16 portrait poster.
 * Returns a base64 encoded PNG.
 */
export async function renderPersonaCard(resultImageUrl, name, personaKey, quote) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Standard high-resolution widescreen landscape dimensions (1920 x 1080)
    canvas.width = 1920;
    canvas.height = 1080;

    // 1. Load generated background image
    const bgImage = await loadImage(resultImageUrl);

    // 2. Draw background image covering 100% of widescreen canvas (exact match)
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // 3. Draw a gorgeous dark bottom gradient for text contrast
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.45)");
    gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.82)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);

    // Get persona badge details
    const badge = PERSONA_BADGES[personaKey.toUpperCase()] || PERSONA_BADGES.CREATOR;

    // 4. Render Guest Name (Centered Golden Typography)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Setup Name Font
    ctx.font = "bold 66px 'Outfit', 'Inter', 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "#FFD700"; // Rich Golden
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    const nameY = canvas.height * 0.83;
    ctx.fillText(name, canvas.width / 2, nameY);

    // Reset shadow for general text
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 5. Render Inspiring Quote (Centered Column)
    const quoteY = canvas.height * 0.88;
    const maxQuoteWidth = canvas.width - 400; // Large center margins

    // Draw actual quote text wrapped in smart quotes directly
    ctx.font = "italic 30px 'Inter', 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const wrappedQuote = `“${quote}”`;
    wrapText(ctx, wrappedQuote, canvas.width / 2, quoteY, maxQuoteWidth, 42);

    // 6. Render Badge Capsule (Centered Aligned at Bottom)
    const badgeY = canvas.height * 0.94;
    const badgeWidth = 360;
    const badgeHeight = 64;
    const radius = badgeHeight / 2;
    const badgeX = (canvas.width - badgeWidth) / 2;

    // Draw Capsule Path
    ctx.beginPath();
    ctx.moveTo(badgeX + radius, badgeY);
    ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
    ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
    ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
    ctx.lineTo(badgeX, badgeY + radius);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
    ctx.closePath();

    // Fill Badge Gradient
    const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY);
    badgeGradient.addColorStop(0, badge.gradient[0]);
    badgeGradient.addColorStop(1, badge.gradient[1]);
    ctx.fillStyle = badgeGradient;
    ctx.fill();

    // Draw Badge Text
    ctx.font = "bold 30px 'Outfit', 'Inter', sans-serif";
    ctx.fillStyle = "#0A0A0A"; // Dark contrast text on gradient
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge.text, canvas.width / 2, badgeY + badgeHeight / 2);

    // 7. Export combined poster
    return canvas.toDataURL("image/png");
}
