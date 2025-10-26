const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');

// ===== Public/Optional Auth GETs =====
router.get('/', optionalAuthMiddleware, vocabularyController.getAllVocabularies);
router.get('/search', optionalAuthMiddleware, vocabularyController.searchVocabularies);
router.get('/test/:testId', optionalAuthMiddleware, vocabularyController.getAllVocabulariesByTestId);
router.get('/:id', optionalAuthMiddleware, vocabularyController.getVocabularyById);

// ===== Protected writes =====
router.post('/', authMiddleware, vocabularyController.createVocabulary);
router.put('/:id', authMiddleware, vocabularyController.updateVocabulary);
router.delete('/:id', authMiddleware, vocabularyController.deleteVocabulary);

module.exports = router;
