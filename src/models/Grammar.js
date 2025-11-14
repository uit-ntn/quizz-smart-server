const mongoose = require('mongoose');

const grammarSchema = new mongoose.Schema({
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: false // optional: nếu không thuộc test nào
    },
    question_text: {
        type: String,
        required: true
    },
    task_instruction: {
        type: String,
        required: false
    },
    blanks: {
        type: Number,
        required: false
    },
    correct_answers: [{
        type: String,
        required: true
    }],
    answer_pattern: {
        type: String,
        required: false
    },
    explanation_text: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'draft', 'archived'],
        default: 'active'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Grammar', grammarSchema, 'grammars');