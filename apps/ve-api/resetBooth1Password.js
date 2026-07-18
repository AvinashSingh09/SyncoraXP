const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const email = 'booth1@virtualevent.com';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found!');
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash('password123', 10);
        user.password = hashedPassword;
        await user.save();

        console.log('Password reset to: password123 for booth1@virtualevent.com');
        process.exit(0);
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
