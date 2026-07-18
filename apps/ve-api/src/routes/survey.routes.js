const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/survey.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/questions', surveyController.getQuestions);
router.post('/questions', surveyController.createQuestion);
router.put('/questions/:id', surveyController.updateQuestion);
router.delete('/questions/:id', surveyController.deleteQuestion);

router.post('/', surveyController.submitSurvey);
router.get('/', surveyController.getSurveys);
router.get('/status', surveyController.checkUserSurveyStatus);

module.exports = router;
