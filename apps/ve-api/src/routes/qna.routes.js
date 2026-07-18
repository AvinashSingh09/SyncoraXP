const express = require('express');
const router = express.Router();
const qnaController = require('../controllers/qna.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', qnaController.getQuestions);
router.post('/', qnaController.askQuestion);
router.post('/:id/upvote', qnaController.upvoteQuestion);
router.delete('/clear', qnaController.clearQuestions);

module.exports = router;
