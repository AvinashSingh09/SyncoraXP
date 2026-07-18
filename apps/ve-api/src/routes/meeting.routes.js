const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

// Public/Attendee route to join a meeting
router.post('/join', meetingController.joinMeeting);

// Admin routes to manage meetings
router.get('/', meetingController.getMeetings);
router.post('/', meetingController.createOrUpdateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;
