// services/topic.service.js
const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Test = require('../models/Test');
const Vocabulary = require('../models/Vocabulary');
const MultipleChoice = require('../models/MultipleChoice');

// Custom error class for service errors
class ServiceError extends Error {
  constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.name = 'ServiceError';
  }
}

/* =========================
   Helpers
========================= */

function ensureObjectId(id, name = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ServiceError(`Invalid ${name} format`, 400, 'VALIDATION_ERROR');
  }
}

/* =========================
   CRUD Operations
========================= */

// Get all topics with full information including stats
const getAllTopics = async (includeInactive = false) => {
  try {
    const query = includeInactive ? {} : { active: true };
    
    // Get basic topics
    const topics = await Topic.find(query)
      .select('name active views avatar_url sub_topics created_at updated_at')
      .sort({ name: 1 })
      .lean();

    // ✅ Get test statistics for all topics using topic_id
    const testStatsPromise = Test.aggregate([
      {
        $match: {
          status: { $ne: 'deleted' },
          topic_id: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$topic_id',
          total_tests: { $sum: 1 },
          total_questions: { $sum: '$total_questions' },
          unique_subtopics: { $addToSet: '$subtopic_id' },
          vocabulary_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, 1, 0] }
          },
          multiple_choice_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, 1, 0] }
          },
          grammar_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, 1, 0] }
          }
        }
      }
    ]);

    const testStats = await testStatsPromise;

    // Create a map for quick lookup by topic_id (ObjectId)
    const statsMap = {};
    testStats.forEach(stat => {
      const topicIdStr = stat._id.toString();
      statsMap[topicIdStr] = {
        total_tests: stat.total_tests || 0,
        total_questions: stat.total_questions || 0,
        total_subtopics_from_tests: stat.unique_subtopics ? stat.unique_subtopics.length : 0,
        vocabulary_tests: stat.vocabulary_tests || 0,
        multiple_choice_tests: stat.multiple_choice_tests || 0,
        grammar_tests: stat.grammar_tests || 0
      };
    });

    // Enhance topics with statistics
    const enhancedTopics = topics.map(topic => {
      const stats = statsMap[topic._id.toString()] || {};
      const activeSubTopics = topic.sub_topics ? topic.sub_topics.filter(st => includeInactive || st.active) : [];
      
      return {
        ...topic,
        // Basic counts
        total_subtopics: activeSubTopics.length,
        total_tests: stats.total_tests || 0,
        total_questions: stats.total_questions || 0,
        total_subtopics_from_tests: stats.total_subtopics_from_tests || 0,
        
        // Test type breakdown
        vocabulary_tests: stats.vocabulary_tests || 0,
        multiple_choice_tests: stats.multiple_choice_tests || 0,
        grammar_tests: stats.grammar_tests || 0,
        
        // Views calculation
        topic_views: topic.views || 0,
        subtopic_views: activeSubTopics.reduce((sum, st) => sum + (st.views || 0), 0),
        total_views: (topic.views || 0) + activeSubTopics.reduce((sum, st) => sum + (st.views || 0), 0)
      };
    });

    return enhancedTopics;
  } catch (error) {
    console.error('Error in getAllTopics:', error);
    throw new ServiceError('Failed to fetch topics', 500, 'DATABASE_ERROR');
  }
};

// Get topic by name with full information and stats
const getTopicByName = async (topicName, includeInactive = false, includeStats = false) => {
  try {
    if (!topicName || !String(topicName).trim()) {
      throw new ServiceError('Topic name is required', 400, 'VALIDATION_ERROR');
    }

    const query = { name: String(topicName).trim() };
    if (!includeInactive) {
      query.active = true;
    }

    const topic = await Topic.findOne(query)
      .select('name active views avatar_url sub_topics created_at updated_at')
      .lean();

    if (!topic) {
      throw new ServiceError('Topic not found', 404, 'NOT_FOUND');
    }

    // If stats not requested, return basic topic
    if (!includeStats) {
      return topic;
    }

    // ✅ Get simplified statistics using topic_id
    const testStats = await Test.aggregate([
      {
        $match: {
          topic_id: topic._id,
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: null,
          total_tests: { $sum: 1 },
          total_questions: { $sum: '$total_questions' },
          unique_subtopics: { $addToSet: '$subtopic_id' },
          vocabulary_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, 1, 0] }
          },
          multiple_choice_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, 1, 0] }
          },
          grammar_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, 1, 0] }
          },
          vocabulary_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, '$total_questions', 0] }
          },
          multiple_choice_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, '$total_questions', 0] }
          },
          grammar_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, '$total_questions', 0] }
          }
        }
      }
    ]);

    const stats = testStats[0] || {};
    const activeSubTopics = topic.sub_topics ? topic.sub_topics.filter(st => includeInactive || st.active) : [];

    return {
      ...topic,
      total_subtopics: activeSubTopics.length,
      total_tests: stats.total_tests || 0,
      total_questions: stats.total_questions || 0,
      total_subtopics_from_tests: stats.unique_subtopics ? stats.unique_subtopics.length : 0,
      topic_views: topic.views || 0,
      subtopic_views: activeSubTopics.reduce((sum, st) => sum + (st.views || 0), 0),
      total_views: (topic.views || 0) + activeSubTopics.reduce((sum, st) => sum + (st.views || 0), 0),
      vocabulary_tests: stats.vocabulary_tests || 0,
      multiple_choice_tests: stats.multiple_choice_tests || 0,
      grammar_tests: stats.grammar_tests || 0,
      vocabulary_questions: stats.vocabulary_questions || 0,
      multiple_choice_questions: stats.multiple_choice_questions || 0,
      grammar_questions: stats.grammar_questions || 0
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    console.error('Error in getTopicByName:', error);
    throw new ServiceError('Failed to fetch topic', 500, 'DATABASE_ERROR');
  }
};

// Get subtopics by main topic name with detailed stats
const getSubTopicsByMainTopic = async (mainTopicName, includeInactive = false) => {
  try {
    const topic = await getTopicByName(mainTopicName, includeInactive);
    
    if (!topic.sub_topics || topic.sub_topics.length === 0) {
      return [];
    }

    let subtopics = topic.sub_topics;
    if (!includeInactive) {
      subtopics = subtopics.filter(st => st.active);
    }

    // ✅ Get test statistics for each subtopic using topic_id and subtopic_id
    const testStats = await Test.aggregate([
      {
        $match: {
          topic_id: topic._id,
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: '$subtopic_id',
          total_tests: { $sum: 1 },
          total_questions: { $sum: '$total_questions' },
          vocabulary_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, 1, 0] }
          },
          multiple_choice_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, 1, 0] }
          },
          grammar_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, 1, 0] }
          },
          vocabulary_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, '$total_questions', 0] }
          },
          multiple_choice_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, '$total_questions', 0] }
          },
          grammar_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, '$total_questions', 0] }
          }
        }
      }
    ]);

    // Create a map for quick lookup by subtopic_id (ObjectId)
    const statsMap = {};
    testStats.forEach(stat => {
      const subtopicIdStr = stat._id ? stat._id.toString() : null;
      if (subtopicIdStr) {
        statsMap[subtopicIdStr] = stat;
      }
    });

    // Enhance subtopics with statistics
    const enhancedSubtopics = subtopics.map(subtopic => {
      const stats = statsMap[subtopic._id.toString()] || {};
      
      return {
        subtopic_id: subtopic._id,
        topic_id: topic._id, // ✅ NEW: Add topic_id for frontend
        name: subtopic.name,
        active: subtopic.active,
        views: subtopic.views || 0,
        main_topic: topic.name,
        total_tests: stats.total_tests || 0,
        total_questions: stats.total_questions || 0,
        vocabulary_tests: stats.vocabulary_tests || 0,
        multiple_choice_tests: stats.multiple_choice_tests || 0,
        grammar_tests: stats.grammar_tests || 0,
        vocabulary_questions: stats.vocabulary_questions || 0,
        multiple_choice_questions: stats.multiple_choice_questions || 0,
        grammar_questions: stats.grammar_questions || 0
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return enhancedSubtopics;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    console.error('Error in getSubTopicsByMainTopic:', error);
    throw new ServiceError('Failed to fetch subtopics', 500, 'DATABASE_ERROR');
  }
};

// Get specific subtopic by ID with detailed stats
const getSubTopicById = async (mainTopicName, subtopicId, includeInactive = false) => {
  try {
    if (!mainTopicName || !String(mainTopicName).trim()) {
      throw new ServiceError('Main topic name is required', 400, 'VALIDATION_ERROR');
    }
    if (!subtopicId || !String(subtopicId).trim()) {
      throw new ServiceError('Subtopic ID is required', 400, 'VALIDATION_ERROR');
    }

    const topic = await Topic.findOne({ 
      name: String(mainTopicName).trim(),
      ...(includeInactive ? {} : { active: true })
    }).lean();

    if (!topic) {
      throw new ServiceError('Main topic not found', 404, 'NOT_FOUND');
    }

    // Find subtopic by ID or name (for flexibility)
    const subtopic = topic.sub_topics.find(st => 
      st._id.toString() === String(subtopicId).trim() || 
      st.name === String(subtopicId).trim()
    );

    if (!subtopic) {
      throw new ServiceError('Subtopic not found', 404, 'NOT_FOUND');
    }

    if (!includeInactive && !subtopic.active) {
      throw new ServiceError('Subtopic is inactive', 404, 'NOT_FOUND');
    }

    // ✅ Get detailed test statistics for this subtopic using topic_id and subtopic_id
    const testStats = await Test.aggregate([
      {
        $match: {
          topic_id: topic._id,
          subtopic_id: subtopic._id,
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: '$test_type',
          total_tests: { $sum: 1 },
          total_questions: { $sum: '$total_questions' },
          tests: {
            $push: {
              test_id: '$_id',
              test_title: '$test_title',
              total_questions: '$total_questions',
              difficulty: '$difficulty',
              created_at: '$created_at'
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          test_types: {
            $push: {
              type: '$_id',
              total_tests: '$total_tests',
              total_questions: '$total_questions',
              tests: '$tests'
            }
          },
          total_tests: { $sum: '$total_tests' },
          total_questions: { $sum: '$total_questions' }
        }
      }
    ]);

    const stats = testStats[0] || {};
    const testTypes = stats.test_types || [];

    return {
      subtopic_id: subtopic._id,
      topic_id: topic._id, // ✅ NEW: Add topic_id for frontend
      name: subtopic.name,
      active: subtopic.active,
      views: subtopic.views || 0,
      main_topic: topic.name,
      total_tests: stats.total_tests || 0,
      total_questions: stats.total_questions || 0,
      test_types: testTypes,
      // Breakdown by test type
      vocabulary_tests: testTypes.find(t => t.type === 'vocabulary')?.total_tests || 0,
      multiple_choice_tests: testTypes.find(t => t.type === 'multiple_choice')?.total_tests || 0,
      grammar_tests: testTypes.find(t => t.type === 'grammar')?.total_tests || 0,
      vocabulary_questions: testTypes.find(t => t.type === 'vocabulary')?.total_questions || 0,
      multiple_choice_questions: testTypes.find(t => t.type === 'multiple_choice')?.total_questions || 0,
      grammar_questions: testTypes.find(t => t.type === 'grammar')?.total_questions || 0,
      // Recent tests
      recent_tests: testTypes.reduce((acc, tt) => {
        return acc.concat(tt.tests.slice(0, 5)); // Top 5 recent tests per type
      }, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    console.error('Error in getSubTopicById:', error);
    throw new ServiceError('Failed to fetch subtopic', 500, 'DATABASE_ERROR');
  }
};

// Create new topic
const createTopic = async (topicData) => {
  try {
    const { name, sub_topics = [] } = topicData;

    if (!name || !String(name).trim()) {
      throw new ServiceError('Topic name is required', 400, 'VALIDATION_ERROR');
    }

    // Check if topic already exists
    const existing = await Topic.findOne({ name: String(name).trim() });
    if (existing) {
      throw new ServiceError('Topic already exists', 409, 'DUPLICATE_ERROR');
    }

    const topic = new Topic({
      name: String(name).trim(),
      active: topicData.active !== undefined ? topicData.active : true,
      views: topicData.views || 0,
      avatar_url: topicData.avatar_url || null,
      sub_topics: sub_topics.map(st => ({
        name: String(st.name || st).trim(),
        active: st.active !== undefined ? st.active : true,
        views: st.views || 0
      }))
    });

    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    if (error.code === 11000) {
      throw new ServiceError('Topic name already exists', 409, 'DUPLICATE_ERROR');
    }

    throw new ServiceError('Failed to create topic', 500, 'DATABASE_ERROR');
  }
};

// Update topic
const updateTopic = async (topicName, updateData) => {
  try {
    if (!topicName || !String(topicName).trim()) {
      throw new ServiceError('Topic name is required', 400, 'VALIDATION_ERROR');
    }

    const topic = await Topic.findOne({ name: String(topicName).trim() });
    if (!topic) {
      throw new ServiceError('Topic not found', 404, 'NOT_FOUND');
    }

    // Update basic fields
    if (updateData.active !== undefined) topic.active = updateData.active;
    if (updateData.views !== undefined) topic.views = updateData.views;
    if (updateData.avatar_url !== undefined) topic.avatar_url = updateData.avatar_url;

    // Update subtopics if provided
    if (updateData.sub_topics) {
      topic.sub_topics = updateData.sub_topics.map(st => ({
        name: String(st.name || st).trim(),
        active: st.active !== undefined ? st.active : true,
        views: st.views || 0
      }));
    }

    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    throw new ServiceError('Failed to update topic', 500, 'DATABASE_ERROR');
  }
};

// Add subtopic to existing topic
const addSubTopic = async (mainTopicName, subTopicData) => {
  try {
    if (!mainTopicName || !String(mainTopicName).trim()) {
      throw new ServiceError('Main topic name is required', 400, 'VALIDATION_ERROR');
    }

    if (!subTopicData.name || !String(subTopicData.name).trim()) {
      throw new ServiceError('Subtopic name is required', 400, 'VALIDATION_ERROR');
    }

    const topic = await Topic.findOne({ name: String(mainTopicName).trim() });
    if (!topic) {
      throw new ServiceError('Main topic not found', 404, 'NOT_FOUND');
    }

    const subtopicName = String(subTopicData.name).trim();
    
    // Check if subtopic already exists
    const existingSubtopic = topic.sub_topics.find(st => st.name === subtopicName);
    if (existingSubtopic) {
      throw new ServiceError('Subtopic already exists in this topic', 409, 'DUPLICATE_ERROR');
    }

    // Add new subtopic
    topic.sub_topics.push({
      name: subtopicName,
      active: subTopicData.active !== undefined ? subTopicData.active : true,
      views: subTopicData.views || 0
    });

    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to add subtopic', 500, 'DATABASE_ERROR');
  }
};

// Update subtopic
const updateSubTopic = async (mainTopicName, subtopicId, updateData) => {
  try {
    ensureObjectId(subtopicId, 'subtopic ID');

    const topic = await Topic.findOne({ name: String(mainTopicName).trim() });
    if (!topic) {
      throw new ServiceError('Main topic not found', 404, 'NOT_FOUND');
    }

    const subtopic = topic.sub_topics.id(subtopicId);
    if (!subtopic) {
      throw new ServiceError('Subtopic not found', 404, 'NOT_FOUND');
    }

    // Update subtopic fields
    if (updateData.name !== undefined) subtopic.name = String(updateData.name).trim();
    if (updateData.active !== undefined) subtopic.active = updateData.active;
    if (updateData.views !== undefined) subtopic.views = updateData.views;

    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to update subtopic', 500, 'DATABASE_ERROR');
  }
};

// Bulk update subtopics
const bulkUpdateSubTopics = async (mainTopicName, subtopicsData) => {
  try {
    if (!mainTopicName || !String(mainTopicName).trim()) {
      throw new ServiceError('Main topic name is required', 400, 'VALIDATION_ERROR');
    }

    if (!Array.isArray(subtopicsData)) {
      throw new ServiceError('Subtopics data must be an array', 400, 'VALIDATION_ERROR');
    }

    const topic = await Topic.findOne({ name: String(mainTopicName).trim() });
    if (!topic) {
      throw new ServiceError('Main topic not found', 404, 'NOT_FOUND');
    }

    // Process each subtopic update
    subtopicsData.forEach(subtopicData => {
      if (subtopicData._id || subtopicData.subtopic_id) {
        // Update existing subtopic
        const subtopicId = subtopicData._id || subtopicData.subtopic_id;
        const subtopic = topic.sub_topics.id(subtopicId);
        if (subtopic) {
          if (subtopicData.name !== undefined) subtopic.name = String(subtopicData.name).trim();
          if (subtopicData.active !== undefined) subtopic.active = subtopicData.active;
          if (subtopicData.views !== undefined) subtopic.views = subtopicData.views;
        }
      } else if (subtopicData.name) {
        // Add new subtopic
        const existingSubtopic = topic.sub_topics.find(st => st.name === String(subtopicData.name).trim());
        if (!existingSubtopic) {
          topic.sub_topics.push({
            name: String(subtopicData.name).trim(),
            active: subtopicData.active !== undefined ? subtopicData.active : true,
            views: subtopicData.views || 0
          });
        }
      }
    });

    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    console.error('Error in bulkUpdateSubTopics:', error);
    throw new ServiceError('Failed to bulk update subtopics', 500, 'DATABASE_ERROR');
  }
};

// Increment topic/subtopic views
const incrementViews = async (mainTopicName, subtopicName = null) => {
  try {
    const topic = await Topic.findOne({ name: String(mainTopicName).trim() });
    if (!topic) {
      throw new ServiceError('Topic not found', 404, 'NOT_FOUND');
    }

    if (subtopicName) {
      // Increment subtopic views
      const subtopic = topic.sub_topics.find(st => st.name === String(subtopicName).trim());
      if (subtopic) {
        subtopic.views = (subtopic.views || 0) + 1;
      }
    } else {
      // Increment main topic views
      topic.views = (topic.views || 0) + 1;
    }

    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to increment views', 500, 'DATABASE_ERROR');
  }
};

// Delete subtopic
const deleteSubTopic = async (mainTopicName, subtopicId) => {
  try {
    if (!mainTopicName || !String(mainTopicName).trim()) {
      throw new ServiceError('Main topic name is required', 400, 'VALIDATION_ERROR');
    }
    if (!subtopicId || !String(subtopicId).trim()) {
      throw new ServiceError('Subtopic ID is required', 400, 'VALIDATION_ERROR');
    }

    const topic = await Topic.findOne({ name: String(mainTopicName).trim() });
    if (!topic) {
      throw new ServiceError('Main topic not found', 404, 'NOT_FOUND');
    }

    // Find subtopic by ID or name (for flexibility)
    const subtopicIndex = topic.sub_topics.findIndex(st => 
      st._id.toString() === String(subtopicId).trim() || 
      st.name === String(subtopicId).trim()
    );
    
    if (subtopicIndex === -1) {
      throw new ServiceError('Subtopic not found', 404, 'NOT_FOUND');
    }

    // Remove subtopic
    topic.sub_topics.splice(subtopicIndex, 1);
    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to delete subtopic', 500, 'DATABASE_ERROR');
  }
};

// Delete topic
const deleteTopic = async (topicName) => {
  try {
    if (!topicName || !String(topicName).trim()) {
      throw new ServiceError('Topic name is required', 400, 'VALIDATION_ERROR');
    }

    const result = await Topic.findOneAndDelete({ name: String(topicName).trim() });
    if (!result) {
      throw new ServiceError('Topic not found', 404, 'NOT_FOUND');
    }

    return result;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to delete topic', 500, 'DATABASE_ERROR');
  }
};

// Get comprehensive topic statistics
const getTopicStatistics = async () => {
  try {
    // Get basic topic stats
    const topicStats = await Topic.aggregate([
      {
        $group: {
          _id: null,
          total_topics: { $sum: 1 },
          active_topics: {
            $sum: { $cond: ['$active', 1, 0] }
          },
          total_subtopics: {
            $sum: { $size: '$sub_topics' }
          },
          active_subtopics: {
            $sum: {
              $size: {
                $filter: {
                  input: '$sub_topics',
                  cond: { $eq: ['$$this.active', true] }
                }
              }
            }
          },
          total_topic_views: { $sum: '$views' },
          total_subtopic_views: {
            $sum: {
              $sum: '$sub_topics.views'
            }
          }
        }
      }
    ]);

    // Get test statistics
    const testStats = await Test.aggregate([
      {
        $match: {
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: null,
          total_tests: { $sum: 1 },
          total_questions: { $sum: '$total_questions' },
          vocabulary_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, 1, 0] }
          },
          multiple_choice_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, 1, 0] }
          },
          grammar_tests: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, 1, 0] }
          },
          vocabulary_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, '$total_questions', 0] }
          },
          multiple_choice_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, '$total_questions', 0] }
          },
          grammar_questions: {
            $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, '$total_questions', 0] }
          },
          unique_topics: { $addToSet: '$topic_id' },
          unique_subtopics: { $addToSet: { topic_id: '$topic_id', subtopic_id: '$subtopic_id' } }
        }
      }
    ]);

    const basicStats = topicStats[0] || {};
    const testStatsData = testStats[0] || {};

    return {
      // Topic stats
      total_topics: basicStats.total_topics || 0,
      active_topics: basicStats.active_topics || 0,
      total_subtopics: basicStats.total_subtopics || 0,
      active_subtopics: basicStats.active_subtopics || 0,
      
      // View stats
      total_topic_views: basicStats.total_topic_views || 0,
      total_subtopic_views: basicStats.total_subtopic_views || 0,
      total_views: (basicStats.total_topic_views || 0) + (basicStats.total_subtopic_views || 0),
      
      // Test stats
      total_tests: testStatsData.total_tests || 0,
      total_questions: testStatsData.total_questions || 0,
      vocabulary_tests: testStatsData.vocabulary_tests || 0,
      multiple_choice_tests: testStatsData.multiple_choice_tests || 0,
      grammar_tests: testStatsData.grammar_tests || 0,
      vocabulary_questions: testStatsData.vocabulary_questions || 0,
      multiple_choice_questions: testStatsData.multiple_choice_questions || 0,
      grammar_questions: testStatsData.grammar_questions || 0,
      
      // Coverage stats
      topics_with_tests: testStatsData.unique_topics ? testStatsData.unique_topics.length : 0,
      subtopics_with_tests: testStatsData.unique_subtopics ? testStatsData.unique_subtopics.length : 0,
      
      // Averages
      avg_tests_per_topic: testStatsData.unique_topics && testStatsData.unique_topics.length > 0 
        ? Math.round((testStatsData.total_tests || 0) / testStatsData.unique_topics.length * 100) / 100 
        : 0,
      avg_questions_per_test: testStatsData.total_tests > 0 
        ? Math.round((testStatsData.total_questions || 0) / testStatsData.total_tests * 100) / 100 
        : 0
    };
  } catch (error) {
    console.error('Error in getTopicStatistics:', error);
    throw new ServiceError('Failed to get topic statistics', 500, 'DATABASE_ERROR');
  }
};

// ✅ NEW: Increment subtopic views by ID
const incrementSubTopicViews = async (mainTopicName, subtopicId) => {
  try {
    if (!mainTopicName || !String(mainTopicName).trim()) {
      throw new ServiceError('Main topic name is required', 400, 'VALIDATION_ERROR');
    }
    if (!subtopicId || !String(subtopicId).trim()) {
      throw new ServiceError('Subtopic ID is required', 400, 'VALIDATION_ERROR');
    }

    const topic = await Topic.findOne({ name: String(mainTopicName).trim() });
    if (!topic) {
      throw new ServiceError('Topic not found', 404, 'NOT_FOUND');
    }

    // Find subtopic by ID or name (for flexibility)
    const subtopic = topic.sub_topics.find(st => 
      st._id.toString() === String(subtopicId).trim() || 
      st.name === String(subtopicId).trim()
    );
    
    if (!subtopic) {
      throw new ServiceError('Subtopic not found', 404, 'NOT_FOUND');
    }

    subtopic.views = (subtopic.views || 0) + 1;
    return await topic.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to increment subtopic views', 500, 'DATABASE_ERROR');
  }
};

module.exports = {
  ServiceError,
  getAllTopics,
  getTopicByName,
  getSubTopicsByMainTopic,
  getSubTopicById,
  createTopic,
  updateTopic,
  addSubTopic,
  updateSubTopic,
  bulkUpdateSubTopics,
  deleteSubTopic,
  incrementViews,
  incrementSubTopicViews,
  deleteTopic,
  getTopicStatistics
};
