const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
    main_topic: {
        type: String,
        required: true
    },
    sub_topic: {
        type: String,
        required: true
    },
    word: {
        type: String,
        required: true,
        unique: true
    },
    meaning: {
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
        enum: ['active', 'inactive'],
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

module.exports = mongoose.model('Vocabulary', vocabularySchema);