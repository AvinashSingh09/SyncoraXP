const Qna = require('../models/qna.model');
const User = require('../models/user.model');

exports.getQuestions = async (req, res) => {
    try {
        const questions = await Qna.find().sort({ createdAt: 1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
};

exports.askQuestion = async (req, res) => {
    try {
        const { text } = req.body;
        const senderId = req.user.id;

        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const question = new Qna({
            sender: senderId,
            senderName: `${user.firstName} ${user.lastName}`,
            text
        });

        const savedQuestion = await question.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('new-question', savedQuestion);
        }

        res.status(201).json(savedQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Error saving question', error: error.message });
    }
};

exports.clearQuestions = async (req, res) => {
    try {
        await Qna.deleteMany({});
        const io = req.app.get('io');
        if (io) {
            io.emit('all-questions-cleared');
        }
        res.json({ message: 'All questions deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing questions', error: error.message });
    }
};

exports.upvoteQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.id;

        const question = await Qna.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        if (!question.upvotes) {
            question.upvotes = [];
        }

        const index = question.upvotes.indexOf(userId);
        if (index > -1) {
            question.upvotes.splice(index, 1);
        } else {
            question.upvotes.push(userId);
        }

        const savedQuestion = await question.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('question-updated', savedQuestion);
        }

        res.json(savedQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Error upvoting question', error: error.message });
    }
};
