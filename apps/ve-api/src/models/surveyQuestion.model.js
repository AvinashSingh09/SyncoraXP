const mongoose = require('mongoose');

const surveyQuestionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['rating', 'yes_no', 'text'],
        required: true
    },
    options: {
        type: [String],
        default: []
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('SurveyQuestion', surveyQuestionSchema);
