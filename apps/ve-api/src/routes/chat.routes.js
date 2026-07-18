const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/rooms', chatController.getRooms);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);
router.get('/users', chatController.getUsers);
router.get('/messages/:room', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.post('/messages/reaction', chatController.addReaction);
router.patch('/messages/:id', chatController.editMessage);
router.delete('/clear', chatController.clearChat);

module.exports = router;
