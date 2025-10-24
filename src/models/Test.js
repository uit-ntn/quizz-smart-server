const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    test_title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    main_topic: {
        type: String,
        required: true
    },
    sub_topic: {
        type: String,
        required: true
    },
    test_type: {
        type: String,
        required: true,
        enum: ['multiple_choice', 'grammar', 'vocabulary', 'spelling', 'listening']
    },
    total_questions: {
        type: Number,
        required: true,
        default: 0
    },
    time_limit_minutes: {
        type: Number,
        required: false
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
    visibility: {
        type: String,
        enum: ['private', 'public'],
        default: 'public'
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

module.exports = mongoose.model('Test', testSchema, 'tests');
