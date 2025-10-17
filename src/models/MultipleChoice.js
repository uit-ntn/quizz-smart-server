const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D', 'E']
    },
    text: {
        type: String,
        required: true
    }
}, { _id: false });

const explanationSchema = new mongoose.Schema({
    correct: {
        type: String,
        required: true
    },
    incorrect_choices: {
        type: Map,
        of: String
    }
}, { _id: false });

const multipleChoiceSchema = new mongoose.Schema({
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
    options: [optionSchema],
    correct_answers: [{
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D', 'E']
    }],
    explanation: explanationSchema,
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

module.exports = mongoose.model('MultipleChoice', multipleChoiceSchema);