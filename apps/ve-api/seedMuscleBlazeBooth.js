const mongoose = require('mongoose');
const Config = require('./src/models/config.model');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const User = require('./src/models/user.model');
        const assistantUser = await User.findOne({ email: 'mb10@gmail.com' });
        const assistantId = assistantUser ? assistantUser._id.toString() : 'mock-id';

        const boothConfig = {
            bgImage: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=1920&q=80',
            points: [
                {
                    id: 1,
                    top: 50,
                    left: 50,
                    text: 'Chat with MuscleBlaze',
                    targetPage: `user-chat:${assistantId}`
                }
            ],
            posters: [],
            socialLinks: [],
            resources: { documents: [], videos: [] },
            products: []
        };

        await Config.findOneAndUpdate(
            { key: 'booth_10_layout' },
            { value: JSON.stringify(boothConfig) },
            { new: true, upsert: true }
        );

        console.log('MuscleBlaze booth seeded!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
