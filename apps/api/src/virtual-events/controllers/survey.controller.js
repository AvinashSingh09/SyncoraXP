const Survey = require('../models/survey.model');
const User = require('../models/user.model');
const Config = require('../models/config.model');
const SurveyQuestion = require('../models/surveyQuestion.model');

const defaultQuestions = [
    {
        text: 'How would you rate the keynote speakers?',
        type: 'rating',
        options: ['Excellent', 'Good', 'Average', 'Poor'],
        order: 1
    },
    {
        text: 'Did you find the networking lounge useful?',
        type: 'yes_no',
        options: ['Yes', 'No'],
        order: 2
    },
    {
        text: 'What topics would you like to see next year?',
        type: 'text',
        options: [],
        order: 3
    }
];

const seedDefaultQuestions = async () => {
    const count = await SurveyQuestion.countDocuments();
    if (count === 0) {
        console.log('[Survey] No questions found. Seeding defaults...');
        await SurveyQuestion.insertMany(defaultQuestions);
    }
};

// GET /api/survey/questions
exports.getQuestions = async (req, res, next) => {
    try {
        await seedDefaultQuestions();
        const questions = await SurveyQuestion.find().sort({ order: 1, createdAt: 1 });
        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/survey/questions
exports.createQuestion = async (req, res, next) => {
    try {
        const { text, type, options, order } = req.body;
        if (!text || !type) {
            return res.status(400).json({ message: 'Question text and type are required.' });
        }

        const newQuestion = new SurveyQuestion({
            text,
            type,
            options: options || [],
            order: order !== undefined ? order : 0
        });

        const savedQuestion = await newQuestion.save();
        res.status(201).json({
            success: true,
            data: savedQuestion
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/survey/questions/:id
exports.updateQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text, type, options, order } = req.body;

        const question = await SurveyQuestion.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        if (text !== undefined) question.text = text;
        if (type !== undefined) question.type = type;
        if (options !== undefined) question.options = options;
        if (order !== undefined) question.order = order;

        const updatedQuestion = await question.save();
        res.status(200).json({
            success: true,
            data: updatedQuestion
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/survey/questions/:id
exports.deleteQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await SurveyQuestion.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Question not found.' });
        }
        res.status(200).json({
            success: true,
            message: 'Question deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/survey/ (Submit Survey)
exports.submitSurvey = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Survey answers are required.' });
        }

        // Check if user already submitted a survey
        const existingSurvey = await Survey.findOne({ user: userId });
        if (existingSurvey) {
            return res.status(400).json({ message: 'You have already submitted a survey.' });
        }

        const survey = new Survey({
            user: userId,
            answers
        });

        const savedSurvey = await survey.save();

        // Award points if configured
        let earnedPoints = 0;
        let updatedUser = null;

        try {
            const enabledConfig = await Config.findOne({ key: 'reward_survey_enabled' });
            if (enabledConfig && enabledConfig.value === 'true') {
                const pointsConfig = await Config.findOne({ key: 'points_survey_complete' });
                const pointsToAward = pointsConfig && pointsConfig.value ? parseInt(pointsConfig.value) : 100;
                if (!isNaN(pointsToAward) && pointsToAward > 0) {
                    const user = await User.findById(userId);
                    if (user) {
                        if (user.points === undefined) user.points = 0;
                        if (user.boothPoints === undefined) user.boothPoints = 0;
                        user.points += pointsToAward;
                        user.boothPoints += pointsToAward; // Survey counts as Expo Points
                        await user.save();
                        earnedPoints = pointsToAward;
                        const userObject = user.toObject();
                        delete userObject.password;
                        updatedUser = userObject;
                    }
                }
            }
        } catch (err) {
            console.error('Error awarding survey points:', err);
        }

        res.status(201).json({
            success: true,
            data: savedSurvey,
            earnedPoints,
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/survey/ (Get all submissions)
exports.getSurveys = async (req, res, next) => {
    try {
        const surveys = await Survey.find()
            .populate('user', 'firstName lastName email designation company')
            .populate('answers.questionId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: surveys
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/survey/status (Check if user submitted)
exports.checkUserSurveyStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const existingSurvey = await Survey.findOne({ user: userId });
        res.status(200).json({
            success: true,
            submitted: !!existingSurvey
        });
    } catch (error) {
        next(error);
    }
};
