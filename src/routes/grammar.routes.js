const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammar.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

router.get('/', grammarController.getAllGrammars);
router.get('/:id', grammarController.getGrammarById);
router.get('/search', grammarController.searchGrammars);
router.get('/topic/:mainTopic', grammarController.getQuestionsByTopic);
router.get('/topic/:mainTopic/:subTopic', grammarController.getQuestionsByTopic);
router.get('/random', grammarController.getRandomQuestions);
router.post('/', authMiddleware, authorize('admin', 'teacher'), grammarController.createGrammar);
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.updateGrammar);
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.deleteGrammar);

module.exports = router;