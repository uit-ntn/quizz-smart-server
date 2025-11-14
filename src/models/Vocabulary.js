const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: false // optional: nếu không thuộc test nào
    },
    word: {
        type: String,
        required: true
    },
    meaning: {
        type: String,
        required: true
    },
    example_sentence: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
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

module.exports = mongoose.model('Vocabulary', vocabularySchema, 'vocabularies');