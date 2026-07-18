const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', quizController.getQuizzes);
router.post('/', quizController.createQuiz);
router.post('/:id/submit', quizController.submitAnswer);
router.patch('/:id/toggle', quizController.toggleQuizActive);
router.delete('/clear', quizController.clearQuizzes);
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;
