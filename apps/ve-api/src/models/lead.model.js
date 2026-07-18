const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    boothId: {
        type: String,
        required: true,
        index: true
    },
    productId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    queryText: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
