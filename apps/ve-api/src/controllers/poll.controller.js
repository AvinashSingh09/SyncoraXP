const Poll = require('../models/poll.model');
const User = require('../models/user.model');
const Config = require('../models/config.model');

exports.getPolls = async (req, res) => {
    try {
        const polls = await Poll.find()
            .populate('options.votes', 'firstName lastName email designation')
            .sort({ createdAt: -1 });
        res.json(polls);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching polls', error: error.message });
    }
};

exports.createPoll = async (req, res) => {
    try {
        const { question, options } = req.body;
        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'Question and at least 2 options are required' });
        }

        const pollOptions = options.map(opt => ({ text: opt, votes: [] }));
        const poll = new Poll({
            question,
            options: pollOptions,
            isActive: true
        });

        const savedPoll = await poll.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('new-poll', savedPoll);
        }

        res.status(201).json(savedPoll);
    } catch (error) {
        res.status(500).json({ message: 'Error creating poll', error: error.message });
    }
};

exports.votePoll = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionId } = req.body;
        const userId = req.user.id;

        const poll = await Poll.findById(id);
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        if (!poll.isActive) {
            return res.status(400).json({ message: 'Poll is not active' });
        }

        // Check if user voted before
        const hasVotedBefore = poll.options.some(opt => opt.votes.some(v => v.toString() === userId.toString()));

        // Clean user's previous votes on this poll to allow changing vote
        poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.toString() !== userId.toString());
        });

        // Add vote to the new option
        const targetOption = poll.options.id(optionId);
        if (!targetOption) {
            return res.status(404).json({ message: 'Option not found' });
        }

        targetOption.votes.push(userId);
        const savedPoll = await poll.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('poll-update', savedPoll);
        }

        let earnedPoints = 0;
        let updatedUser = null;

        if (!hasVotedBefore) {
            try {
                const enabledConfig = await Config.findOne({ key: 'reward_poll_enabled' });
                if (enabledConfig && enabledConfig.value === 'true') {
                    const pointsConfig = await Config.findOne({ key: 'points_poll_vote' });
                    const pointsToAward = pointsConfig && pointsConfig.value ? parseInt(pointsConfig.value) : 15;
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
                console.error('Error awarding poll vote points', err);
            }
        }

        res.json({
            poll: savedPoll,
            user: updatedUser,
            earnedPoints
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting vote', error: error.message });
    }
};

exports.togglePollActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const poll = await Poll.findById(id);
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        poll.isActive = isActive;
        const savedPoll = await poll.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('poll-update', savedPoll);
        }

        res.json(savedPoll);
    } catch (error) {
        res.status(500).json({ message: 'Error updating poll status', error: error.message });
    }
};

exports.deletePoll = async (req, res) => {
    try {
        const { id } = req.params;

        const poll = await Poll.findByIdAndDelete(id);
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('poll-deleted', id);
        }

        res.json({ message: 'Poll deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting poll', error: error.message });
    }
};

exports.clearPolls = async (req, res) => {
    try {
        await Poll.deleteMany({});
        const io = req.app.get('io');
        if (io) {
            io.emit('all-polls-cleared');
        }
        res.json({ message: 'All polls deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing polls', error: error.message });
    }
};
