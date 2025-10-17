const mongoose = require('mongoose');

const grammarSchema = new mongoose.Schema({
    main_topic: {
        type: String,
        required: true
    },
    sub_topic: {
        type: String,
        required: true
    },
    question_text: {
        type: String,
        required: true
    },
    correct_answers: [{
        type: String,
        required: true
    }],
    explanation_text: {
        type: String,
        required: true
    },
    example_sentence: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    tags: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft'],
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
    timestamps: true
});

module.exports = mongoose.model('Grammar', grammarSchema);