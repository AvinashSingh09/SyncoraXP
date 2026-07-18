const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PhotoboothSession = require('../models/photoboothSession.model');

const uploadToCloudinary = async (base64Data, format = 'png') => {
    try {
        const cloudName = 'dzz5belph';
        const uploadPreset = 'virtualevent';

        let filePayload = base64Data;
        if (!filePayload.startsWith('data:')) {
            filePayload = `data:image/${format};base64,${base64Data}`;
        }

        const formData = new FormData();
        formData.append('file', filePayload);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Cloudinary upload failed (${response.status}): ${errText}`);
        }

        const data = await response.json();
        return data.secure_url;
    } catch (err) {
        console.error('Cloudinary upload error:', err.message);
        return null;
    }
};

const getPromptForStyle = (style) => {
    switch (style.toUpperCase()) {
        case "CREATOR":
            return "CRITICAL INTRICATE BACKDROP REQUIREMENT: The background must be an extremely ornate, highly detailed traditional Indian miniature folk art pattern inspired by Madhubani and Kalamkari. Include stylized elements of nature: flowing rivers, decorative trees with detailed leaves, mountains, sun, moon, stars, birds, and majestic animals like horses and elephants woven beautifully into the background using a warm rich earthy palette of deep teal, terracotta, orange, and gold. Preserve exact facial identity: do not alter face shape, skin tone, eyes, hairstyle, or facial structure. The subject's portrait should seamlessly blend into a beautiful handcrafted illustration with intricate clothing motifs and premium festival poster composition. Sharp focus, vector cel-shaded outlines, digital illustration.";
        case "INNOVATOR":
            return "INNOVATIVE FOLK STORY THEME: Maintain the same highly detailed Indian folk-art landscape style. Include rivers, trees, mountains, animals, birds, and intricate decorative elements, but introduce symbols of creativity and innovation woven naturally into the scene such as books, solar panels, knowledge symbols, creative structures, and storytelling of progress. Blend traditional folk art with subtle modern inspiration while preserving handcrafted aesthetics. Warm earthy palette with teal, orange, and gold. Preserve exact facial identity: do not alter face shape, skin tone, eyes, hairstyle, or facial structure.";
        case "LEADER":
            return "LEADERSHIP FOLK THEME: Maintain the same premium Indian folk-art illustration style with intricate landscapes, mountains, rivers, elephants, trees, and decorative nature elements. Add storytelling of leadership through majestic elephants, pathways, rising sun motifs, community scenes, and symbolic formations representing strength and guidance. Use rich royal warm tones and decorative borders. Preserve exact facial identity: do not alter face shape, skin tone, eyes, hairstyle, or facial structure.";
        case "DREAMER":
            return "DREAMER FOLK THEME: Maintain the same handcrafted Indian folk-art landscape with softer dreamy storytelling. Include floating birds, moonlight scenes, stars, glowing clouds, whimsical trees, delicate rivers, and magical decorative patterns integrated into nature. Add a poetic fantasy atmosphere while preserving folk illustration style. Soft teal, lavender, warm orange, and pastel accents. Preserve exact facial identity: do not alter face shape, skin tone, eyes, hairstyle, or facial structure.";
        case "EXPLORER":
            return "EXPLORER FOLK THEME: Maintain the same rich Indian folk-art environment with rivers, forests, trees, mountains, horses, and intricate storytelling scenes. Add journey-inspired elements such as long pathways, distant mountains, travel scenes, birds in motion, and adventurous symbolic storytelling. Keep handcrafted folk-art aesthetics with rich earthy colors. Preserve exact facial identity: do not alter face shape, skin tone, eyes, hairstyle, or facial structure.";
        case "VIBRANT":
        case "VIBRANT CARTOON":
            return "A high-quality digital vector portrait of a young man with styled black hair and light stubble. Use a clean, bold-line art style with smooth cel-shading. The skin should have soft gradient highlights for a subtle 3D effect, while the hair features detailed vector strokes for texture. Set against a solid light-purple gradient background. Professional avatar aesthetic, vibrant colors, sharp focus, 2D digital illustration.";
        case "SKETCH":
        case "SKETCH ARTIST":
            return "CRITICAL WHITE BACKGROUND REQUIREMENT: The entire background MUST be solid pure white (#FFFFFF) ONLY. NO furniture, NO office elements, NO chairs, NO desks, NO computers, NO monitors, NO walls, NO rooms, NO environments, NO shadows on background, NO gradients, NO textures, NO borders, NO frames. Absolutely NOTHING in the background except pure flat white. This is the most important rule. Render the person as a clean, professional black and white line-art illustration. Rendered in a traditional comic book inking style with bold, consistent vector-style outlines. High-contrast monochrome. Minimal cross-hatching or stippling for shading. 2D graphic design, minimalist composition, pure white void background.";
        case "MODERN":
        case "MODERN 3D":
            return "A high-quality 3D cartoon portrait. Clean Pixar-inspired 3D look, soft studio lighting, smooth textures. The person is isolated on a solid white background with no other objects or real-world background elements. Professional 3D avatar aesthetic, octane render style.";
        case "PHOTOREALISTIC":
            return "CRITICAL WHITE BACKGROUND REQUIREMENT: The entire background MUST be solid pure white (#FFFFFF) ONLY. NO furniture, NO office elements, NO chairs, NO desks, NO computers, NO monitors, NO walls, NO rooms, NO environments, NO shadows on background, NO gradients, NO textures, NO borders, NO frames. Absolutely NOTHING in the background except pure flat white. This is the most important rule. If there is one person in the photo: A high-end, detailed caricature illustration of a person. The style must be a blend of a photo-realistic face with a hand-drawn, vector art line quality. Hair: styled with volume and dynamic movement, including wind-blown tendrils and visible brush-stroke textures, appropriate to the subject's hairstyle. Eyes: striking, vivid, slightly exaggerated in size, bright and expressive with clear catchlights. Expression: Preserve the exact facial expression from the uploaded photo. Do NOT change the expression. If the person is smiling with closed lips, keep it that way. If they are showing teeth, keep that. Maintain the natural expression, mouth position, and eye expression exactly as captured in the original photo. Clothing: match the outfit, fabric feel, styling, and overall fashion details from the real uploaded reference image. Preserve the real clothing design, colors, collar shape, folds, texture, accessories, and silhouette accurately from the uploaded photo. Accessories: preserve accessories from the uploaded image where visible, or adapt them naturally to match the original look. If there are two or more people in the photo: A high-end, detailed caricature illustration showing all people present in the photo. The style must be a blend of photo-realistic faces with hand-drawn, vector art line quality for each person. Hair: styled with volume and dynamic movement, including wind-blown tendrils and visible brush-stroke textures, appropriate to each subject's hairstyle. Eyes: striking, vivid, slightly exaggerated in size, bright and expressive with clear catchlights for each person. Expressions: Preserve the exact facial expression from the uploaded photo for each person. Do NOT change anyone's expression. If a person is smiling with closed lips, keep it that way. If they are showing teeth, keep that. Maintain each person's natural expression, mouth position, and eye expression exactly as captured in the original photo. Clothing: match the outfit, fabric feel, styling, and overall fashion details from the real uploaded reference image for each person. Preserve the real clothing design, colors, collar shape, folds, texture, accessories, and silhouette accurately from the uploaded photo for each person. Accessories: preserve accessories from the uploaded image where visible for each person, or adapt them naturally to match the original look. Rendering Style: clean, bold, dark outlines combined with soft digital airbrushing and defined vector-style shading. A perfect fusion of illustration and realism. Lighting: soft studio-style lighting with subtle highlights enhancing facial features. Composition: bust-up portrait, centered framing, balanced proportions. FINAL BACKGROUND RULE: Background MUST be completely empty, solid pure white. NO environment whatsoever. Only the person/people on a white void background. Preserve realistic identity from the uploaded image for all people, keep facial structure consistent, and use the real uploaded image as the reference for clothing and styling details.";
        case "BOBBLEHEAD":
            return "A 3D stylized caricature portrait in the style of a bobblehead figurine, featuring a customizable person with an exaggeratedly oversized head and a tiny, full-standing body. The character has professional, studio-style grooming with neat beard, clean-shaven, or other facial hair and hair color/style appropriate to the subject. They are smiling warmly with eye color appropriate to the subject. They are wearing clothing that matches the outfit, fabric feel, styling, and overall fashion details from the real uploaded reference image. Preserve the real clothing design, colors, collar shape, folds, texture, accessories, and silhouette accurately from the uploaded photo. The entire figure is centered against a clean, professional blue gradient studio background with soft rim lighting. Preserve realistic identity from the uploaded image, keep facial structure consistent, and use the real uploaded image as the reference for clothing and styling details. The head should be noticeably larger than the body to create the bobblehead effect while maintaining recognizability.";
        case "WATERCOLOR":
        case "WATERCOLOR ART":
        case "WATERCOLOR CARICATURE":
            return "Transform this photo into a stylized, professional, hand-drawn digital watercolor caricature portrait. CRITICAL COMPOSITION RULE: You MUST preserve and include ALL people present in the uploaded photo. Keep their exact spatial positions, arrangement, framing, and depth relative to each other. For each person in the photo, the style must use clean, detailed linework combined with soft, watercolor-like color washes. Features for each person must include an oversized head on a smaller, detailed body, large expressive eyes, a warm, genuine smile, and realistic skin texture. The background behind all people must be a soft, gradient light-blue watercolor sky-wash with no other elements (absolutely no chairs, desks, walls, or office/room background). The final image should be clean, focused, and high-resolution.";
        case "ANIME":
        case "ANIME HERO":
            return "A high-quality 2D digital anime portrait, vibrant coloring, cell shading, iconic anime facial features, colorful hair highlights, clean ink line art, studio anime key visual aesthetic, on a solid light gradient background.";
        case "GIF":
        case "GIF STYLE":
            return "A high-quality 2D digital art frame for an animated sequence. Maintain extremely high facial likeness and recognizable features. High-action, dynamic pose, vibrant streaks of color, electric energy. 2D graphic illustration style, sharp focus, clean lines.";
        case "GHIBLI":
            return "Repaint this photo in the Studio Ghibli style: soft watercolor-washed backgrounds with lush, hand-painted foliage and skies, warm diffused sunlight with golden-hour glows, large expressive eyes with detailed catchlights, gentle rounded facial features, muted earthy tones with pastel accents, loose flowing hair, fabric with subtle texture and natural drape. The atmosphere should feel nostalgic, serene, and alive with quiet magic. Preserve the person's likeness, pose, and scene layout exactly.";
        case "PIXAR":
            return "Rerender this photo in Pixar CGI style: smooth subsurface-scattered skin with soft pore detail, large luminous eyes with multi-layered iris reflections, slightly exaggerated proportions with a large head and expressive face, three-point cinematic lighting with warm key and cool fill, rich saturated colors with deep shadows, clean polished surfaces, and a warm inviting mood. The result should look like a frame from a Pixar feature film. Preserve the subject's identity, pose, and scene composition exactly.";
        case "PENCIL_SKETCH":
            return "Convert this photo into a detailed graphite pencil sketch: confident varied-pressure linework defining edges and contours, cross-hatched and blended tonal shading from bright highlights to deep shadows, visible paper grain texture throughout, softer strokes on skin and harder marks on clothing and hair, expressive detail around the eyes and face, with looser gestural marks in the background. The result should look like a skilled artist's studio portrait sketch. Preserve the subject's likeness, pose, and composition exactly.";
        case "WATERCOLOR_ART":
            return "Transform this photo into a fine-art watercolor portrait: soft wet-on-wet pigment blooms with organic color diffusion, loose flowing washes of warm skin tones, transparent layered glazes for depth, dry-brush texture on hair and fabric, crisp wet-on-dry edges at focal points like eyes and lips, visible cold-press paper texture throughout, and unpainted white paper used as highlights. Colors should be luminous and slightly desaturated. Preserve the subject's likeness, pose, and composition exactly.";
        case "OIL_PAINTING":
            return "Repaint this photo as a classical oil portrait: visible impasto brushwork with thick directional strokes, rich chiaroscuro lighting with dramatic deep shadows and warm highlights, layered glazes creating depth in skin tones, textured canvas weave visible in mid-tones, palette knife marks in background areas, Rembrandt-style warm amber key light, desaturated cool shadow zones, and gallery-quality color richness. Style references: Sargent or Rembrandt portrait. Preserve the subject's likeness, pose, and composition exactly.";
        case "COMIC_BOOK":
            return "Convert this photo into a dynamic comic-book illustration with bold black ink outlines, varied line weight, halftone texture in mid-tones, flat saturated colors, crisp high-contrast shadow shapes, and clean graphic storytelling energy. Keep it family-friendly and preserve the subject's identity, pose, and composition exactly.";
        case "CYBERPUNK":
            return "Relight and restyle this photo as a cyberpunk portrait: neon magenta, cyan, and electric blue rim lighting casting colorful shadows on the face, rain-slicked reflective surfaces, holographic UI overlays and glitch artifacts, dark moody background with blurred neon signage bokeh, high contrast between deep shadows and vivid neon accents, subtle chrome or circuit-trace skin augmentations, and a gritty atmospheric haze. Style references: Blade Runner 2049 or Cyberpunk 2077. Preserve the subject's identity, pose, and composition exactly.";
        case "POP_ART":
            return "Transform this photo into a Roy Lichtenstein or Andy Warhol-style pop art piece: bold thick black outlines around all shapes, flat unshaded color fills using a limited palette of primary and complementary colors, Ben-Day halftone dot patterns for skin and shadow areas, high-key graphic contrast with no photorealistic gradients, and a high-energy poster-print aesthetic. Preserve the subject's identity, pose, and composition exactly.";
        case "CLAYMATION":
            return "Transform this photo into a Laika or Aardman-style claymation still: the subject should appear sculpted from smooth polymer clay with visible fingerprint textures and subtle tool marks, slightly rounded exaggerated features, glass bead or acrylic eyes with painted irises, fabric clothing made of real textile, warm soft studio diffusion lighting with subtle fill shadows, and a miniature physical set background with painted backdrop feel. Style references: Coraline or Wallace & Gromit. Preserve the subject's identity, pose, and composition exactly.";
        case "PIXEL_ART":
            return "Convert this photo into a detailed retro pixel art sprite: render the entire image on a 64x64 to 128x128 pixel canvas with hard 1:1 pixel edges and zero anti-aliasing, use a strict 24-to-32 color palette with deliberate color quantization, apply ordered Bayer dithering or checkerboard dithering for mid-tone transitions, define facial features as clean readable pixel clusters, use single-pixel outlines in a darker shade of the local color, and render clothing with flat blocked color fills and minimal shading. Background should be simplified to flat geometric pixel shapes. Style references: Final Fantasy VI sprites or early Pokémon overworld art. Preserve the subject's identity, pose, and framing exactly.";
        case "VINTAGE_FILM":
            return "Regrade and restyle this photo as a vintage analog film still: lift the blacks to a milky faded gray to simulate chemical base fog, crush highlights with a warm cream roll-off, shift midtones toward amber and yellow, desaturate blues and pull cyan out of shadows, add fine silver-halide grain with slightly larger grain clusters in shadow areas, apply soft optical halation blooming around practical light sources, add a subtle S-curve contrast bend, and finish with a mild edge vignette. The overall palette should resemble Kodak Portra 400 or Fuji Superia 400 pushed one stop. Preserve the subject's identity, pose, and composition exactly.";
        case "ACTION_FIGURE":
            return "Create a retail action-figure package look while preserving the person's identity. Show the person rendered as a high-detail plastic action figure, posed dynamically, sealed inside a bright retail blister-pack card with bold graphic branding, printed character name, and accessory slots. The packaging should look like a real collectible toy shelf item.";
        default:
            return "Fun, exaggerated caricature with bold lines and vibrant colors.";
    }
};

const processCaricature = async (userId, base64Image, style) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
    const baseUrl = 'https://generativelanguage.googleapis.com';

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
    }

    // 1. Save source image locally
    const uploadDir = path.join(__dirname, '../../../temp_uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    let rawBase64 = base64Image;
    let ext = 'jpg';
    const sourceMatches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (sourceMatches && sourceMatches.length === 3) {
        ext = sourceMatches[1].split('/')[1] || 'jpg';
        rawBase64 = sourceMatches[2];
    }

    const sourceFilename = `source_${crypto.randomUUID()}.${ext}`;
    const sourcePath = path.join(uploadDir, sourceFilename);
    fs.writeFileSync(sourcePath, Buffer.from(rawBase64, 'base64'));

    let cloudinaryResultUrl = '';

    // 2. Call Gemini Image API using native fetch
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const stylePrompt = getPromptForStyle(style);
    const body = {
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: rawBase64
                        }
                    },
                    {
                        text: `Restyle this person's portrait following these exact instructions: ${stylePrompt}`
                    }
                ]
            }
        ],
        generationConfig: {
            responseModalities: ["IMAGE"]
        }
    };

    let resultUrl = '';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini Image API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const candidates = data.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData) {
                    const resultBase64 = part.inlineData.data;
                    const resultFilename = `result_${crypto.randomUUID()}.png`;
                    const resultPath = path.join(uploadDir, resultFilename);
                    fs.writeFileSync(resultPath, Buffer.from(resultBase64, 'base64'));
                    resultUrl = `/ve-api/temp_uploads/${resultFilename}`;

                    try {
                        cloudinaryResultUrl = await uploadToCloudinary(resultBase64, 'png');
                    } catch (e) {
                        console.error('Cloudinary result upload failed:', e.message);
                    }
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Caricature generation failed:', error.message);
        throw new Error(`Caricature generation failed: ${error.message}`);
    }

    // 4. Save Session to Database
    const session = new PhotoboothSession({
        userId,
        sourceImage: `/ve-api/temp_uploads/${sourceFilename}`,
        resultImage: cloudinaryResultUrl || resultUrl,
        style
    });

    await session.save();
    return session;
};

const uploadPoster = async (sessionId, posterBase64) => {
    let rawBase64 = posterBase64;
    const matches = posterBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        rawBase64 = matches[2];
    }

    const cloudinaryUrl = await uploadToCloudinary(rawBase64, 'png');
    if (!cloudinaryUrl) {
        throw new Error('Failed to upload poster to Cloudinary');
    }

    const session = await PhotoboothSession.findById(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }
    session.resultImage = cloudinaryUrl;
    await session.save();
    return session;
};

module.exports = {
    processCaricature,
    uploadPoster
};
