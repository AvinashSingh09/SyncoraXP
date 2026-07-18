const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SurveyQuestion',
            required: true
        },
        answer: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Survey', surveySchema);
