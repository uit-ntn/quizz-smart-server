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
    // ✅ Reference to Topic model
    topic_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    subtopic_id: {
        type: mongoose.Schema.Types.ObjectId,
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
    created_by_full_name: {
        type: String,
        default: null
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by_full_name: {
        type: String,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
testSchema.index({ topic_id: 1, subtopic_id: 1 });
testSchema.index({ topic_id: 1 });
testSchema.index({ subtopic_id: 1 });
testSchema.index({ test_type: 1 });
testSchema.index({ status: 1 });
testSchema.index({ visibility: 1 });
testSchema.index({ created_by: 1 });
testSchema.index({ created_at: -1 });

// Virtual for topic reference
testSchema.virtual('topic', {
    ref: 'Topic',
    localField: 'topic_id',
    foreignField: '_id',
    justOne: true
});

// Instance methods
testSchema.methods.getTopicInfo = function() {
    return {
        topic_id: this.topic_id,
        subtopic_id: this.subtopic_id
    };
};

// Static methods
testSchema.statics.findByTopicId = function(topicId, subtopicId = null) {
    const query = { topic_id: topicId, status: { $ne: 'deleted' } };
    if (subtopicId) {
        query.subtopic_id = subtopicId;
    }
    return this.find(query);
};

testSchema.statics.getTopicStats = function() {
    return this.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        {
            $group: {
                _id: '$topic_id',
                total_tests: { $sum: 1 },
                total_questions: { $sum: '$total_questions' },
                test_types: { $addToSet: '$test_type' },
                subtopics: { $addToSet: '$subtopic_id' }
            }
        }
    ]);
};

module.exports = mongoose.model('Test', testSchema, 'tests');
