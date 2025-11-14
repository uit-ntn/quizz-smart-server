const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');

// ===== Public/Optional Auth listing =====
router.get('/search', optionalAuthMiddleware, testController.searchTests);

router.get('/multiple-choices', optionalAuthMiddleware, testController.getAllMultipleChoicesTests);
router.get('/grammars', optionalAuthMiddleware, testController.getAllGrammarsTests);
router.get('/vocabularies', optionalAuthMiddleware, testController.getAllVocabulariesTests);

router.get('/multiple-choices/main-topics', optionalAuthMiddleware, testController.getAllMultipleChoicesMainTopics);
router.get('/multiple-choices/sub-topics/:mainTopic', optionalAuthMiddleware, testController.getAllMultipleChoicesSubTopicsByMainTopic);

router.get('/grammars/main-topics', optionalAuthMiddleware, testController.getAllGrammarsMainTopics);
router.get('/grammars/sub-topics/:mainTopic', optionalAuthMiddleware, testController.getAllGrammarsSubTopicsByMainTopic);

router.get('/vocabularies/main-topics', optionalAuthMiddleware, testController.getAllVocabulariesMainTopics);
router.get('/vocabularies/sub-topics/:mainTopic', optionalAuthMiddleware, testController.getAllVocabulariesSubTopicsByMainTopic);

router.get('/type/:testType', optionalAuthMiddleware, testController.getTestsByType);
router.get('/topic/:mainTopic/:subTopic', optionalAuthMiddleware, testController.getTestsByTopic);
router.get('/topic/:mainTopic', optionalAuthMiddleware, testController.getTestsByTopic);

router.get('/', optionalAuthMiddleware, testController.getAllTests);

// ===== User-specific =====
router.get('/my-tests', authMiddleware, testController.getMyTests);

// ===== CRUD =====
router.post('/', authMiddleware, testController.createTest);
router.put('/:id', authMiddleware, testController.updateTest);

// Soft delete (đánh dấu deleted)
router.patch('/:id/soft-delete', authMiddleware, testController.softDeleteTest);

// Hard delete (xóa hẳn DB) - Admin or creator only
router.delete('/:id/hard-delete', authMiddleware, testController.hardDeleteTest);

// Default delete (soft delete)
router.delete('/:id', authMiddleware, testController.softDeleteTest);

// ===== Get by ID (đặt cuối để không nuốt các route cụ thể) =====
router.get('/:id', optionalAuthMiddleware, testController.getTestById);

module.exports = router;
