const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Public routes (for quiz taking)
router.get('/search', multipleChoiceController.searchMultipleChoices);
router.get('/random', multipleChoiceController.getRandomQuestions);
// Topic routes: provide two explicit routes instead of using an inline optional param
router.get('/topic/:mainTopic/:subTopic', multipleChoiceController.getQuestionsByTopic);
router.get('/topic/:mainTopic', multipleChoiceController.getQuestionsByTopic);
router.get('/', multipleChoiceController.getAllMultipleChoices);
router.get('/:id', multipleChoiceController.getMultipleChoiceById);

// Protected routes (for question management)
router.post('/', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.createMultipleChoice);
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.updateMultipleChoice);
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.deleteMultipleChoice);

module.exports = router;