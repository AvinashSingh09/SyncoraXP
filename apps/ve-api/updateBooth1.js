const mongoose = require('mongoose');
const Config = require('./src/models/config.model');
const User = require('./src/models/user.model');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const assistantUser = await User.findOne({ email: 'booth1@virtualevent.com' });
        if (!assistantUser) {
            console.error('Error: booth1@virtualevent.com user not found. Please create this user first.');
            process.exit(1);
        }
        const assistantId = assistantUser._id.toString();

        const config = await Config.findOne({ key: 'booth_1_layout' });
        if (config) {
            let layout = JSON.parse(config.value);
            console.log(JSON.stringify(layout.points, null, 2));
            let updated = false;
            
            layout.points = layout.points.map(point => {
                if (point.targetPage === 'chat:booth1team') {
                    point.targetPage = `user-chat:${assistantId}`;
                    updated = true;
                }
                return point;
            });

            if (updated) {
                config.value = JSON.stringify(layout);
                await config.save();
                console.log('Successfully updated Booth 1 Chat point to 1-on-1 chat.');
            } else {
                console.log('No point with targetPage "chat: Booth 1 Chat" found in Booth 1 layout.');
            }
        } else {
            console.log('Booth 1 layout config not found in DB. You may need to create it first in the admin console.');
        }

        process.exit(0);
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
