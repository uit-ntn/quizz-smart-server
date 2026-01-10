// controllers/topic.controller.js
const topicService = require('../services/topic.service');

/* =========================
   Helpers
========================= */

function handleServiceError(error, res) {
  if (error && error.name === 'ServiceError') {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      type: error.type,
    });
  }
  console.error('❌ Unexpected error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    type: 'INTERNAL_ERROR',
  });
}

const getUserCtx = (req) => ({
  userId: req.user?._id || null,
  userRole: req.user?.role || null,
});

const requireAdmin = (req, res, next) => {
  const { userRole } = getUserCtx(req);
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      type: 'ACCESS_DENIED',
    });
  }
  next();
};

/* =========================
   Controllers
========================= */

// GET /api/topics - Get all topics
const getAllTopics = async (req, res) => {
  try {
    const { userRole } = getUserCtx(req);
    const includeInactive = req.query.include_inactive === 'true' && userRole === 'admin';
    
    const topics = await topicService.getAllTopics(includeInactive);
    
    res.json({
      success: true,
      message: 'Topics fetched successfully',
      data: topics,
      count: topics.length
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// GET /api/topics/:topicName - Get topic by name
const getTopicByName = async (req, res) => {
  try {
    const { topicName } = req.params;
    const { userRole } = getUserCtx(req);
    const includeInactive = req.query.include_inactive === 'true' && userRole === 'admin';
    const includeStats = req.query.include_stats === 'true';
    
    const topic = await topicService.getTopicByName(topicName, includeInactive, includeStats);
    
    res.json({
      success: true,
      message: 'Topic fetched successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// GET /api/topics/:topicName/subtopics - Get subtopics by main topic
const getSubTopicsByMainTopic = async (req, res) => {
  try {
    const { topicName } = req.params;
    const { userRole } = getUserCtx(req);
    const includeInactive = req.query.include_inactive === 'true' && userRole === 'admin';
    
    const subtopics = await topicService.getSubTopicsByMainTopic(topicName, includeInactive);
    
    res.json({
      success: true,
      message: 'Subtopics fetched successfully',
      data: subtopics,
      count: subtopics.length
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// GET /api/topics/:topicName/subtopics/:subtopicId - Get specific subtopic
const getSubTopicById = async (req, res) => {
  try {
    const { topicName, subtopicId } = req.params;
    const { userRole } = getUserCtx(req);
    const includeInactive = req.query.include_inactive === 'true' && userRole === 'admin';
    
    const subtopic = await topicService.getSubTopicById(topicName, subtopicId, includeInactive);
    
    res.json({
      success: true,
      message: 'Subtopic fetched successfully',
      data: subtopic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// POST /api/topics - Create new topic (Admin only)
const createTopic = async (req, res) => {
  try {
    const topic = await topicService.createTopic(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// PUT /api/topics/:topicName - Update topic (Admin only)
const updateTopic = async (req, res) => {
  try {
    const { topicName } = req.params;
    const topic = await topicService.updateTopic(topicName, req.body);
    
    res.json({
      success: true,
      message: 'Topic updated successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// POST /api/topics/:topicName/subtopics - Add subtopic (Admin only)
const addSubTopic = async (req, res) => {
  try {
    const { topicName } = req.params;
    const topic = await topicService.addSubTopic(topicName, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Subtopic added successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// PUT /api/topics/:topicName/subtopics/:subtopicId - Update subtopic (Admin only)
const updateSubTopic = async (req, res) => {
  try {
    const { topicName, subtopicId } = req.params;
    const topic = await topicService.updateSubTopic(topicName, subtopicId, req.body);
    
    res.json({
      success: true,
      message: 'Subtopic updated successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// PUT /api/topics/:topicName/subtopics - Bulk update subtopics (Admin only)
const bulkUpdateSubTopics = async (req, res) => {
  try {
    const { topicName } = req.params;
    const { subtopics } = req.body;
    
    if (!Array.isArray(subtopics)) {
      return res.status(400).json({
        success: false,
        message: 'Subtopics must be an array',
        type: 'VALIDATION_ERROR'
      });
    }
    
    const topic = await topicService.bulkUpdateSubTopics(topicName, subtopics);
    
    res.json({
      success: true,
      message: 'Subtopics updated successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// POST /api/topics/:topicName/views - Increment topic views
const incrementTopicViews = async (req, res) => {
  try {
    const { topicName } = req.params;
    const { subtopic } = req.body;
    
    const topic = await topicService.incrementViews(topicName, subtopic);
    
    res.json({
      success: true,
      message: 'Views incremented successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// POST /api/topics/:topicName/subtopics/:subtopicId/views - Increment subtopic views
const incrementSubTopicViews = async (req, res) => {
  try {
    const { topicName, subtopicId } = req.params;
    
    const result = await topicService.incrementSubTopicViews(topicName, subtopicId);
    
    res.json({
      success: true,
      message: 'Subtopic views incremented successfully',
      data: result,
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// DELETE /api/topics/:topicName/subtopics/:subtopicId - Delete subtopic (Admin only)
const deleteSubTopic = async (req, res) => {
  try {
    const { topicName, subtopicId } = req.params;
    const topic = await topicService.deleteSubTopic(topicName, subtopicId);
    
    res.json({
      success: true,
      message: 'Subtopic deleted successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// DELETE /api/topics/:topicName - Delete topic (Admin only)
const deleteTopic = async (req, res) => {
  try {
    const { topicName } = req.params;
    const topic = await topicService.deleteTopic(topicName);
    
    res.json({
      success: true,
      message: 'Topic deleted successfully',
      data: topic
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

// GET /api/topics/statistics - Get topic statistics
const getTopicStatistics = async (req, res) => {
  try {
    const stats = await topicService.getTopicStatistics();
    
    res.json({
      success: true,
      message: 'Topic statistics fetched successfully',
      data: stats
    });
  } catch (error) {
    handleServiceError(error, res);
  }
};

module.exports = {
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
  incrementTopicViews,
  incrementSubTopicViews,
  deleteTopic,
  getTopicStatistics,
  requireAdmin
};
