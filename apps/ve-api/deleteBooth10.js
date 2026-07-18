const mongoose = require('mongoose');
const Config = require('./src/models/config.model');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        await Config.deleteOne({ key: 'booth_10_layout' });
        
        console.log('Booth 10 layout deleted from DB!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
