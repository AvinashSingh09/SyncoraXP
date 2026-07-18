const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const photoboothService = require('../services/photobooth.service');
const PhotoboothSession = require('../models/photoboothSession.model');

// Route to process a caricature photo swap
router.post('/process', authMiddleware, async (req, res, next) => {
    try {
        const { image, style } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, message: 'No image data provided.' });
        }
        if (!style) {
            return res.status(400).json({ success: false, message: 'No style selected.' });
        }

        const userId = req.user.id;
        const session = await photoboothService.processCaricature(userId, image, style);

        res.status(200).json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Error processing caricature:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route to get a user's caricature history
router.get('/history', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const history = await PhotoboothSession.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            history
        });
    } catch (error) {
        next(error);
    }
});

// Route to upload a rendered poster
router.post('/upload-poster', authMiddleware, async (req, res, next) => {
    try {
        const { sessionId, posterImage } = req.body;
        if (!sessionId || !posterImage) {
            return res.status(400).json({ success: false, message: 'Missing sessionId or posterImage.' });
        }
        const session = await photoboothService.uploadPoster(sessionId, posterImage);
        res.status(200).json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Error uploading poster:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
