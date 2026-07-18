const authService = require('../services/auth.service');
const validationResult = () => ({ isEmpty: () => true, array: () => [] });
const User = require('../models/user.model');
const Config = require('../models/config.model');

class AuthController {
    constructor(service) {
        this.authService = service;
    }

    register = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await this.authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    login = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    getUsersStats = async (req, res, next) => {
        try {
            const users = await User.find({}, '-password').sort({ createdAt: -1 });
            const onlineUsers = req.app.get('onlineUsers') || new Set();
            
            const usersWithStatus = users.map(user => {
                const isOnline = onlineUsers.has(user._id.toString());
                return {
                    ...user.toObject(),
                    status: isOnline ? 'online' : 'offline'
                };
            });

            const totalRegistered = users.length;
            const totalOnline = usersWithStatus.filter(u => u.status === 'online').length;

            res.json({
                success: true,
                data: {
                    totalRegistered,
                    totalOnline,
                    users: usersWithStatus
                }
            });
        } catch (error) {
            next(error);
        }
    }

    visitBooth = async (req, res, next) => {
        try {
            const { boothId } = req.params;
            const userId = req.user.id;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (!user.visitedBooths) {
                user.visitedBooths = [];
            }
            if (user.points === undefined) user.points = 0;
            if (user.boothPoints === undefined) user.boothPoints = 0;

            let earned = false;
            if (!user.visitedBooths.includes(boothId)) {
                user.visitedBooths.push(boothId);

                let pointsToAward = 50;
                try {
                    const boothConfig = await Config.findOne({ key: 'points_booth_visit' });
                    if (boothConfig && boothConfig.value) {
                        const parsed = parseInt(boothConfig.value);
                        if (!isNaN(parsed) && parsed > 0) {
                            pointsToAward = parsed;
                        }
                    }
                } catch (confErr) {
                    console.error('Failed to load points_booth_visit config', confErr);
                }

                user.boothPoints += pointsToAward;
                user.points += pointsToAward;
                await user.save();
                earned = true;
            }

            const userWithoutPassword = user.toObject();
            delete userWithoutPassword.password;

            res.json({
                success: true,
                points: user.points,
                visitedBooths: user.visitedBooths,
                user: userWithoutPassword,
                earned
            });
        } catch (error) {
            next(error);
        }
    }

    getLeaderboard = async (req, res, next) => {
        try {
            const topUsers = await User.find({}, 'firstName lastName points company')
                .sort({ points: -1 })
                .limit(10);
            res.json({
                success: true,
                data: topUsers
            });
        } catch (error) {
            next(error);
        }
    }

    addPoints = async (req, res, next) => {
        try {
            const { points, category } = req.body;
            const userId = req.user.id;

            if (!points || typeof points !== 'number' || points <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid points value' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.points === undefined) user.points = 0;
            if (user.gamePoints === undefined) user.gamePoints = 0;
            if (user.boothPoints === undefined) user.boothPoints = 0;

            if (category === 'game') {
                user.gamePoints += points;
            } else if (category === 'booth') {
                user.boothPoints += points;
            }

            user.points += points;
            await user.save();

            const userWithoutPassword = user.toObject();
            delete userWithoutPassword.password;

            res.json({
                success: true,
                points: user.points,
                user: userWithoutPassword
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController(authService);
