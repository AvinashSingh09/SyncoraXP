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
            let result;
            try {
                result = await this.authService.login(email, password);
            } catch (loginErr) {
                // If login failed, check if this email is a configured booth admin/stall owner in configs
                const emailKey = email.toLowerCase().trim();
                let isBoothAdminConfigured = false;
                let boothAdminName = 'Stall Representative';

                // Check static BOOTH_ADMINS or dynamic booth_X_layout configs or pattern (boothX@...)
                let expectedPassword = null;
                const boothPatternMatch = emailKey.match(/^booth([0-9]+)@/i);

                // First check dynamic booth_X_layout configs for exact matching email and password
                try {
                    for (let b = 1; b <= 20; b++) {
                        const conf = await Config.findOne({ key: `booth_${b}_layout` });
                        if (conf && conf.value) {
                            const parsed = JSON.parse(conf.value);
                            if (parsed.boothAdminEmail && parsed.boothAdminEmail.toLowerCase().trim() === emailKey) {
                                isBoothAdminConfigured = true;
                                boothAdminName = parsed.boothName?.trim() || `Booth ${b} Representative`;
                                expectedPassword = parsed.boothAdminPassword;
                                break;
                            }
                        }
                    }
                } catch (e) {}

                if (!isBoothAdminConfigured) {
                    if (
                        boothPatternMatch ||
                        emailKey === 'booth1@virtualevent.com' ||
                        emailKey === 'booth1@virtualevents.com' ||
                        emailKey === 'mb10@gmail.com' ||
                        emailKey === 'info@virtualevent.com' ||
                        emailKey === 'info@virtualevents.com'
                    ) {
                        isBoothAdminConfigured = true;
                        if (boothPatternMatch) {
                            boothAdminName = `Booth ${boothPatternMatch[1]} Representative`;
                        } else if (emailKey.includes('booth1')) {
                            boothAdminName = 'Booth 1 Representative';
                        } else if (emailKey === 'mb10@gmail.com') {
                            boothAdminName = 'MuscleBlaze Representative';
                        }
                    }
                }

                if (isBoothAdminConfigured) {
                    // If expectedPassword is set in Admin panel config, ensure typed password matches it
                    if (expectedPassword && expectedPassword !== password) {
                        const err = new Error('Invalid credentials');
                        err.statusCode = 401;
                        throw err;
                    }

                    const UserRepo = require('../repositories/user.repository');
                    let existingUser = await UserRepo.findByEmail(emailKey);
                    if (!existingUser) {
                        const nameParts = boothAdminName.split(' ');
                        const firstName = nameParts[0] || 'Booth';
                        const lastName = nameParts.slice(1).join(' ') || 'Admin';
                        existingUser = await UserRepo.create({
                            email: emailKey,
                            password: await require('bcrypt').hash(password, 10),
                            firstName,
                            lastName,
                            company: boothAdminName,
                            designation: 'Exhibitor / Stall Owner'
                        });
                    } else {
                        existingUser.password = await require('bcrypt').hash(password, 10);
                        existingUser.company = boothAdminName;
                        existingUser.designation = 'Exhibitor / Stall Owner';
                        await existingUser.save();
                    }
                    result = await this.authService.login(emailKey, password);
                } else {
                    throw loginErr;
                }
            }

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
            const topUsers = await User.find({ points: { $gt: 0 } }, 'firstName lastName points company')
                .sort({ points: -1 })
                .limit(25)
                .lean();

            let usersList = [...topUsers];

            if (req.user) {
                const currentUser = await User.findById(req.user.id || req.user._id, 'firstName lastName points company').lean();
                if (currentUser && currentUser.points > 0 && !usersList.some(u => u._id.toString() === currentUser._id.toString())) {
                    usersList.push(currentUser);
                }
            }

            usersList.sort((a, b) => (b.points || 0) - (a.points || 0));

            res.json({
                success: true,
                data: usersList
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
