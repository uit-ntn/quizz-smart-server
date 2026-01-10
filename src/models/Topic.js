const mongoose = require('mongoose');

// SubTopic Schema
const subTopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  _id: true // Tự động tạo _id cho mỗi subtopic
});

// Topic Schema  
const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  active: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  avatar_url: {
    type: String,
    default: null
  },
  sub_topics: [subTopicSchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance (name index already defined in schema)
topicSchema.index({ active: 1 });
topicSchema.index({ 'sub_topics.name': 1 });
topicSchema.index({ 'sub_topics.active': 1 });

module.exports = mongoose.model('Topic', topicSchema, 'topics');
