const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    collection: {
        type: String,
        required: true,
        enum: ['multiple_choices', 'grammars', 'vocabularies']
    },
    user_answer: {
        type: mongoose.Schema.Types.Mixed, // String hoặc [String]
        required: true
    },
    is_correct: {
        type: Boolean,
        required: true
    }
}, { _id: false });

const testResultSchema = new mongoose.Schema({
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    total_questions: {
        type: Number,
        required: true
    },
    correct_count: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    duration_ms: {
        type: Number,
        required: true
    },
    answers: [answerSchema]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('TestResult', testResultSchema, 'test_results');
