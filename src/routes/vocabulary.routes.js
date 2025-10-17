const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

router.get('/', vocabularyController.getAllVocabularies);
router.get('/:id', vocabularyController.getVocabularyById);
router.get('/search', vocabularyController.searchVocabularies);
router.post('/', authMiddleware, authorize('admin'), vocabularyController.createVocabulary);
router.put('/:id', authMiddleware, authorize('admin'), vocabularyController.updateVocabulary);
router.delete('/:id', authMiddleware, authorize('admin'), vocabularyController.deleteVocabulary);

module.exports = router;