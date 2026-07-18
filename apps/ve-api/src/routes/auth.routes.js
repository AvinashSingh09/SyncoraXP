const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/users', authMiddleware, authController.getUsersStats);
router.post('/visit-booth/:boothId', authMiddleware, authController.visitBooth);
router.get('/leaderboard', authMiddleware, authController.getLeaderboard);
router.post('/add-points', authMiddleware, authController.addPoints);

module.exports = router;
