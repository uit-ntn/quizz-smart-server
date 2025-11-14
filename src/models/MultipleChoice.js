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
        of: String,
        validate: {
            validator: function(v) {
                const validLabels = ['A', 'B', 'C', 'D', 'E'];
                for (let key of v.keys()) {
                    if (!validLabels.includes(key)) {
                        return false;
                    }
                }
                return true;
            },
            message: 'Invalid option label in incorrect_choices. Must be A, B, C, D, or E.'
        }
    }
}, { _id: false });

const multipleChoiceSchema = new mongoose.Schema({
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: false // optional: nếu không thuộc test nào
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

module.exports = mongoose.model('MultipleChoice', multipleChoiceSchema, 'multiple_choices');