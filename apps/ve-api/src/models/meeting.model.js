const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    zoomLink: {
        type: String,
        required: false,
        trim: true
    },
    isCustom: {
        type: Boolean,
        default: false
    },
    topic: {
        type: String,
        trim: true
    },
    layoutTop: {
        type: Number,
        default: 10.5
    },
    layoutLeft: {
        type: Number,
        default: 18.0
    },
    layoutWidth: {
        type: Number,
        default: 64.0
    },
    layoutHeight: {
        type: Number,
        default: 41.2
    },
    hoverTop: {
        type: Number,
        default: 70.0
    },
    hoverLeft: {
        type: Number,
        default: 50.0
    },
    hoverWidth: {
        type: Number,
        default: 13.0
    },
    hoverHeight: {
        type: Number,
        default: 6.0
    },
    hostEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
