const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Public routes (for quiz taking)
router.get('/search', vocabularyController.searchVocabularies);
router.get('/', vocabularyController.getAllVocabularies);
router.get('/:id', vocabularyController.getVocabularyById);

// Protected routes (for vocabulary management)
router.post('/', authMiddleware, authorize('admin', 'teacher'), vocabularyController.createVocabulary);
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), vocabularyController.updateVocabulary);
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), vocabularyController.deleteVocabulary);

module.exports = router;