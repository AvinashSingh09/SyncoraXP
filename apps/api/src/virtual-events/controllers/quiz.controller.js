const Quiz = require('../models/quiz.model');
const User = require('../models/user.model');
const Config = require('../models/config.model');

exports.getQuizzes = async (req, res) => {
    try {
        const { type } = req.query;
        const quizzes = await Quiz.find(type ? { type } : {})
            .populate('options.votes', 'firstName lastName email designation')
            .sort({ createdAt: -1 });

        const now = new Date();
        let hasExpiredUpdate = false;
        for (const q of quizzes) {
            if (q.isActive && q.expiresAt && new Date(q.expiresAt) <= now) {
                q.isActive = false;
                await q.save();
                hasExpiredUpdate = true;
            }
        }

        if (hasExpiredUpdate) {
            const io = req.app.get('io');
            if (io) {
                quizzes.forEach(q => {
                    if (!q.isActive && q.expiresAt && new Date(q.expiresAt) <= now) {
                        io.emit('quiz-update', q);
                    }
                });
            }
        }

        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { question, options, correctOptionIndex, type, chartType, hideResultsUntilClosed, duration } = req.body;
        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'Question and at least 2 options are required' });
        }
        if (correctOptionIndex === undefined || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
            return res.status(400).json({ message: 'Valid correctOptionIndex is required' });
        }

        const quizOptions = options.map(opt => ({ text: typeof opt === 'object' ? opt.text : opt, votes: [] }));
        const durationSec = duration !== undefined ? (parseInt(duration) || 0) : 0;
        const expiresAt = durationSec > 0 ? new Date(Date.now() + durationSec * 1000) : null;

        const quiz = new Quiz({
            question,
            options: quizOptions,
            correctOptionIndex: Number(correctOptionIndex),
            type: type || 'auditorium',
            chartType: chartType || 'bar',
            hideResultsUntilClosed: hideResultsUntilClosed !== undefined ? (hideResultsUntilClosed === true || String(hideResultsUntilClosed) === 'true') : false,
            duration: durationSec,
            expiresAt,
            isActive: true
        });

        const savedQuiz = await quiz.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('new-quiz', savedQuiz);
        }

        res.status(201).json(savedQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
};

exports.submitAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionId } = req.body;
        const userId = req.user.id;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!quiz.isActive) {
            return res.status(400).json({ message: 'Quiz is not active' });
        }

        const hasAnsweredBefore = quiz.options.some(opt => opt.votes.some(v => v.toString() === userId.toString()));
        const selectedIndex = quiz.options.findIndex(opt => opt._id.toString() === optionId.toString());
        const isCorrect = selectedIndex === quiz.correctOptionIndex;

        // Clean user's previous votes/answers on this quiz to allow changing answer
        quiz.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.toString() !== userId.toString());
        });

        // Add answer to selected option
        const targetOption = quiz.options.find((option) => String(option._id || option.id) === String(optionId));
        if (!targetOption) {
            return res.status(404).json({ message: 'Option not found' });
        }

        targetOption.votes.push(userId);
        const savedQuiz = await quiz.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('quiz-update', savedQuiz);
        }

        let earnedPoints = 0;
        let updatedUser = null;

        if (!hasAnsweredBefore && isCorrect) {
            try {
                const enabledConfig = await Config.findOne({ key: 'reward_quiz_enabled' });
                if (enabledConfig && enabledConfig.value === 'true') {
                    const pointsConfig = await Config.findOne({ key: 'points_quiz_correct' });
                    const pointsToAward = pointsConfig && pointsConfig.value ? parseInt(pointsConfig.value) : 10;
                    if (!isNaN(pointsToAward) && pointsToAward > 0) {
                        const user = await User.findById(userId);
                        if (user) {
                            if (user.points === undefined) user.points = 0;
                            if (user.boothPoints === undefined) user.boothPoints = 0;
                            user.points += pointsToAward;
                            user.boothPoints += pointsToAward;
                            await user.save();
                            earnedPoints = pointsToAward;
                            const userObject = user.toObject();
                            delete userObject.password;
                            updatedUser = userObject;
                        }
                    }
                }
            } catch (err) {
                console.error('Error awarding quiz points', err);
            }
        }

        res.json({
            quiz: savedQuiz,
            user: updatedUser,
            earnedPoints
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting answer', error: error.message });
    }
};

exports.toggleQuizActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        quiz.isActive = isActive;
        const savedQuiz = await quiz.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('quiz-update', savedQuiz);
        }

        res.json(savedQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz status', error: error.message });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await Quiz.findByIdAndDelete(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('quiz-deleted', id);
        }

        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};

exports.clearQuizzes = async (req, res) => {
    try {
        const Quiz = require('../models/quiz.model');
        await Quiz.deleteMany({});
        const io = req.app.get('io');
        if (io) {
            io.emit('all-quizzes-cleared');
        }
        res.json({ message: 'All quizzes deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing quizzes', error: error.message });
    }
};

exports.updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, options, correctOptionIndex, chartType, hideResultsUntilClosed, duration, isActive } = req.body;
        const crypto = require('crypto');

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (question !== undefined) quiz.question = question.trim();
        if (correctOptionIndex !== undefined) quiz.correctOptionIndex = Number(correctOptionIndex);
        if (chartType !== undefined) quiz.chartType = chartType;
        if (hideResultsUntilClosed !== undefined) quiz.hideResultsUntilClosed = (hideResultsUntilClosed === true || String(hideResultsUntilClosed) === 'true');
        if (isActive !== undefined) quiz.isActive = Boolean(isActive);

        if (duration !== undefined) {
            const dur = parseInt(duration) || 0;
            quiz.duration = dur;
            quiz.expiresAt = dur > 0 ? new Date(Date.now() + dur * 1000) : null;
        }

        if (options && Array.isArray(options)) {
            quiz.options = options.map((opt, idx) => {
                const optText = typeof opt === 'object' ? opt.text : opt;
                const existing = quiz.options[idx];
                return {
                    _id: existing?._id || crypto.randomBytes(12).toString('hex'),
                    text: optText,
                    votes: existing?.votes || []
                };
            });
        }

        const savedQuiz = await quiz.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('quiz-update', savedQuiz);
        }

        res.json(savedQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz', error: error.message });
    }
};
