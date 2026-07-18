const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const email = 'info@virtualevent.com';
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User info@virtualevent.com already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('password123', 10);

        const newUser = new User({
            firstName: 'Info',
            lastName: 'Desk',
            designation: 'Receptionist',
            company: 'Virtual Event',
            mobileNumber: '1234567890',
            country: 'India',
            state: 'Delhi',
            city: 'New Delhi',
            email: email,
            password: hashedPassword
        });

        await newUser.save();

        console.log('User info@virtualevent.com seeded successfully! Password is: password123');
        process.exit(0);
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
