const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');

// ===== Public/Optional Auth listing =====
router.get('/search', optionalAuthMiddleware, testController.searchTests);

router.get('/top-taken', optionalAuthMiddleware, testController.getTopTakenTests);
router.get('/top-scoring', optionalAuthMiddleware, testController.getTopScoringTests);
router.get('/newest', optionalAuthMiddleware, testController.getNewestTests);

// Attempt count routes
router.get('/topic/:mainTopic/attempt-count', optionalAuthMiddleware, testController.getTopicAttemptCount);
router.get('/:testId/attempt-count', optionalAuthMiddleware, testController.getTestAttemptCount);

router.get('/multiple-choices', optionalAuthMiddleware, testController.getAllMultipleChoicesTests);
router.get('/grammars', optionalAuthMiddleware, testController.getAllGrammarsTests);
router.get('/vocabularies', optionalAuthMiddleware, testController.getAllVocabulariesTests);

router.get('/type/:testType', optionalAuthMiddleware, testController.getTestsByType);
router.get('/topic/:mainTopic/:subTopic', optionalAuthMiddleware, testController.getTestsByTopic);
router.get('/topic/:mainTopic', optionalAuthMiddleware, testController.getTestsByTopic);

router.get('/', optionalAuthMiddleware, testController.getAllTests);

// ===== User-specific =====
router.get('/my-tests', authMiddleware, testController.getMyTests);

// ===== CRUD =====
router.post('/', authMiddleware, testController.createTest);
router.put('/:id', authMiddleware, testController.updateTest);

// Merge tests
router.post('/merge', authMiddleware, testController.mergeTests);

// Soft delete (đánh dấu deleted)
router.patch('/:id/soft-delete', authMiddleware, testController.softDeleteTest);

// Hard delete (xóa hẳn DB) - Admin or creator only
router.delete('/:id/hard-delete', authMiddleware, testController.hardDeleteTest);

// Default delete (soft delete)
router.delete('/:id', authMiddleware, testController.softDeleteTest);

// ===== Get by ID (đặt cuối để không nuốt các route cụ thể) =====
router.get('/:id', optionalAuthMiddleware, testController.getTestById);

module.exports = router;
