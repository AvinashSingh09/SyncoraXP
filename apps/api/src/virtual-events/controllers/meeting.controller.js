const Meeting = require('../models/meeting.model');

// Create or Update meeting mapping (Admin only)
exports.createOrUpdateMeeting = async (req, res) => {
    try {
        const { code, zoomLink, topic, isCustom, layoutTop, layoutLeft, layoutWidth, layoutHeight, hoverTop, hoverLeft, hoverWidth, hoverHeight, hostEmail } = req.body;
        if (!code || (!isCustom && !zoomLink)) {
            return res.status(400).json({ message: 'Code and Zoom Link are required' });
        }

        const trimmedCode = code.trim().toUpperCase();

        let meeting = await Meeting.findOne({ code: trimmedCode });
        if (meeting) {
            meeting.zoomLink = isCustom ? '' : (zoomLink ? zoomLink.trim() : '');
            meeting.topic = topic ? topic.trim() : '';
            meeting.isCustom = !!isCustom;
            meeting.hostEmail = hostEmail ? hostEmail.trim().toLowerCase() : '';
            if (layoutTop !== undefined) meeting.layoutTop = Number(layoutTop);
            if (layoutLeft !== undefined) meeting.layoutLeft = Number(layoutLeft);
            if (layoutWidth !== undefined) meeting.layoutWidth = Number(layoutWidth);
            if (layoutHeight !== undefined) meeting.layoutHeight = Number(layoutHeight);
            if (hoverTop !== undefined) meeting.hoverTop = Number(hoverTop);
            if (hoverLeft !== undefined) meeting.hoverLeft = Number(hoverLeft);
            if (hoverWidth !== undefined) meeting.hoverWidth = Number(hoverWidth);
            if (hoverHeight !== undefined) meeting.hoverHeight = Number(hoverHeight);
            await meeting.save();
        } else {
            meeting = new Meeting({
                code: trimmedCode,
                zoomLink: isCustom ? '' : (zoomLink ? zoomLink.trim() : ''),
                topic: topic ? topic.trim() : '',
                isCustom: !!isCustom,
                hostEmail: hostEmail ? hostEmail.trim().toLowerCase() : '',
                layoutTop: layoutTop !== undefined ? Number(layoutTop) : 10.5,
                layoutLeft: layoutLeft !== undefined ? Number(layoutLeft) : 18.0,
                layoutWidth: layoutWidth !== undefined ? Number(layoutWidth) : 64.0,
                layoutHeight: layoutHeight !== undefined ? Number(layoutHeight) : 41.2,
                hoverTop: hoverTop !== undefined ? Number(hoverTop) : 70.0,
                hoverLeft: hoverLeft !== undefined ? Number(hoverLeft) : 50.0,
                hoverWidth: hoverWidth !== undefined ? Number(hoverWidth) : 13.0,
                hoverHeight: hoverHeight !== undefined ? Number(hoverHeight) : 6.0
            });
            await meeting.save();
        }

        res.status(200).json({ message: 'Meeting saved successfully', data: meeting });
    } catch (error) {
        res.status(500).json({ message: 'Error saving meeting', error: error.message });
    }
};

// Get all meetings (Admin only)
exports.getMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find().sort({ createdAt: -1 });
        res.status(200).json({ data: meetings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meetings', error: error.message });
    }
};

// Delete a meeting (Admin only)
exports.deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        await Meeting.findByIdAndDelete(id);
        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting meeting', error: error.message });
    }
};

// Join meeting by code (Attendee & Admin)
exports.joinMeeting = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'Meeting code is required' });
        }

        const trimmedCode = code.trim().toUpperCase();
        const meeting = await Meeting.findOne({ code: trimmedCode });

        if (!meeting) {
            return res.status(404).json({ message: 'Invalid meeting code' });
        }

        res.status(200).json({ 
            zoomLink: meeting.zoomLink, 
            topic: meeting.topic, 
            isCustom: meeting.isCustom,
            hostEmail: meeting.hostEmail || '',
            layoutTop: meeting.layoutTop,
            layoutLeft: meeting.layoutLeft,
            layoutWidth: meeting.layoutWidth,
            layoutHeight: meeting.layoutHeight,
            hoverTop: meeting.hoverTop,
            hoverLeft: meeting.hoverLeft,
            hoverWidth: meeting.hoverWidth,
            hoverHeight: meeting.hoverHeight
        });
    } catch (error) {
        res.status(500).json({ message: 'Error joining meeting', error: error.message });
    }
};
