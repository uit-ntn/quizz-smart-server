const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateVocabularyRequest:
 *       type: object
 *       required:
 *         - main_topic
 *         - sub_topic
 *         - word
 *         - meaning
 *         - example_sentence
 *       properties:
 *         main_topic:
 *           type: string
 *           example: "Vocabulary"
 *         sub_topic:
 *           type: string
 *           example: "Education"
 *         word:
 *           type: string
 *           example: "scholarship"
 *         meaning:
 *           type: string
 *           example: "học bổng"
 *         example_sentence:
 *           type: string
 *           example: "She won a full scholarship to study abroad."
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           default: medium
 *           example: "easy"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["education", "noun", "vocabulary"]
 *         status:
 *           type: string
 *           enum: [active, inactive, draft]
 *           default: active
 *           example: "active"
 */

// GET routes - static paths first, then dynamic paths
router.get('/', vocabularyController.getAllVocabularies);
router.get('/sub-topics', vocabularyController.getAllSubTopics);
router.get('/sub-topics-grouped', vocabularyController.getAllGroupedSubTopics);
router.get('/sub-topics/:main_topic', vocabularyController.getSubTopicsByMainTopic);
router.get('/search', vocabularyController.searchVocabularies);
// Dynamic :id routes
router.get('/:id', vocabularyController.getVocabularyById);

// POST routes
router.post('/', authMiddleware, authorize('admin', 'teacher'), vocabularyController.createVocabulary);

// PUT routes
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), vocabularyController.updateVocabulary);

// DELETE routes
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), vocabularyController.deleteVocabulary);

module.exports = router;