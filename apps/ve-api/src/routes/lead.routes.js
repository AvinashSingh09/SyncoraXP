const express = require('express');
const router = express.Router();
const Lead = require('../models/lead.model');
const authMiddleware = require('../middlewares/auth.middleware');

// Create a new product inquiry lead
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { boothId, productId, productName, queryText } = req.body;
        if (!boothId || !productId || !productName || !queryText) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const newLead = new Lead({
            boothId,
            productId,
            productName,
            user: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userEmail: req.user.email,
            queryText
        });

        await newLead.save();

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully',
            data: newLead
        });
    } catch (error) {
        next(error);
    }
});

// Get leads, optionally filtered by boothId
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const { boothId } = req.query;
        const filter = {};
        if (boothId) {
            filter.boothId = boothId;
        }

        const leads = await Lead.find(filter).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        next(error);
    }
});

// Delete a lead
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedLead = await Lead.findByIdAndDelete(id);
        if (!deletedLead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
