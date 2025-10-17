const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammar.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Public routes (for quiz taking)
router.get('/search', grammarController.searchGrammars);
router.get('/random', grammarController.getRandomQuestions);
// Topic routes: explicit routes instead of optional param
router.get('/topic/:mainTopic/:subTopic', grammarController.getQuestionsByTopic);
router.get('/topic/:mainTopic', grammarController.getQuestionsByTopic);
router.get('/', grammarController.getAllGrammars);
router.get('/:id', grammarController.getGrammarById);

// Protected routes (for question management)
router.post('/', authMiddleware, authorize('admin', 'teacher'), grammarController.createGrammar);
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.updateGrammar);
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.deleteGrammar);

module.exports = router;