// routes/topic.routes.js
const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { authMiddleware } = require('../middleware/auth.middleware');


// Public routes
router.get('/', topicController.getAllTopics);
router.get('/statistics', topicController.getTopicStatistics);
router.get('/:topicName', topicController.getTopicByName);
router.get('/:topicName/subtopics', topicController.getSubTopicsByMainTopic);
router.get('/:topicName/subtopics/:subtopicId', topicController.getSubTopicById);

// Protected routes (require authentication)
router.post('/:topicName/views', authMiddleware, topicController.incrementTopicViews);
router.post('/:topicName/subtopics/:subtopicId/views', authMiddleware, topicController.incrementSubTopicViews);

// Admin only routes
router.post('/', authMiddleware, topicController.requireAdmin, topicController.createTopic);
router.put('/:topicName', authMiddleware, topicController.requireAdmin, topicController.updateTopic);
router.post('/:topicName/subtopics', authMiddleware, topicController.requireAdmin, topicController.addSubTopic);
router.put('/:topicName/subtopics', authMiddleware, topicController.requireAdmin, topicController.bulkUpdateSubTopics);
router.put('/:topicName/subtopics/:subtopicId', authMiddleware, topicController.requireAdmin, topicController.updateSubTopic);
router.delete('/:topicName/subtopics/:subtopicId', authMiddleware, topicController.requireAdmin, topicController.deleteSubTopic);
router.delete('/:topicName', authMiddleware, topicController.requireAdmin, topicController.deleteTopic);

module.exports = router;
