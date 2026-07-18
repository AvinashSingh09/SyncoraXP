const express = require('express');
const router = express.Router();
const pollController = require('../controllers/poll.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', pollController.getPolls);
router.post('/', pollController.createPoll);
router.post('/:id/vote', pollController.votePoll);
router.patch('/:id/toggle', pollController.togglePollActive);
router.delete('/clear', pollController.clearPolls);
router.delete('/:id', pollController.deletePoll);

module.exports = router;
