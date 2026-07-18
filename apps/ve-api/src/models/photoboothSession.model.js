const mongoose = require('mongoose');

const photoboothSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sourceImage: {
        type: String,
        required: true
    },
    resultImage: {
        type: String,
        required: true
    },
    style: {
        type: String,
        required: true
    },
    nickname: {
        type: String
    },
    backstory: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PhotoboothSession', photoboothSessionSchema);
