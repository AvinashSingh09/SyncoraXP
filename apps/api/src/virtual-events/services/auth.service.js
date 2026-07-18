const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const jwtUtils = require('../utils/jwt.utils');

class AuthService {
    constructor(repository, jwtService) {
        this.userRepository = repository;
        this.jwtService = jwtService;
    }

    async register(userData) {
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            const error = new Error('Email already exists');
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const newUser = await this.userRepository.create({
            ...userData,
            password: hashedPassword
        });

        // Omit password from return value
        const userObj = newUser.toObject();
        delete userObj.password;

        return userObj;
    }

    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            const error = new Error('Email not registered. Please register first!');
            error.statusCode = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        const payload = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };

        const token = this.jwtService.generateToken(payload);

        const userObj = user.toObject();
        delete userObj.password;

        return { user: userObj, token };
    }
}

module.exports = new AuthService(userRepository, jwtUtils);
