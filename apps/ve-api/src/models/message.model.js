const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    replyTo: {
        text: String,
        senderName: String
    },
    reactions: [{
        emoji: String,
        userId: mongoose.Schema.Types.ObjectId,
        userName: String
    }],
    edited: { type: Boolean, default: false },
    forwarded: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    seenAt: { type: Date },
    deliveredTo: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now }
    }],
    seenBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seenAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
