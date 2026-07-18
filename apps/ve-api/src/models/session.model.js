const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
        trim: true
    },
    time: {
        type: String,
        required: true,
        trim: true
    },
    videoUrl: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
