const express = require('express');
const router = express.Router();
const Session = require('../models/session.model');

// Get all sessions
router.get('/', async (req, res, next) => {
    try {
        const sessions = await Session.find().sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
});

// Create a session
router.post('/', async (req, res, next) => {
    try {
        const { topic, time, videoUrl } = req.body;
        const newSession = new Session({ topic, time, videoUrl });
        await newSession.save();
        res.status(201).json({
            success: true,
            data: newSession
        });
    } catch (error) {
        next(error);
    }
});

// Delete a session
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await Session.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
