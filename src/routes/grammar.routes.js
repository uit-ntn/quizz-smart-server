const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammar.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateGrammarRequest:
 *       type: object
 *       required:
 *         - main_topic
 *         - sub_topic
 *         - question_text
 *         - correct_answers
 *         - explanation_text
 *         - example_sentence
 *       properties:
 *         main_topic:
 *           type: string
 *           example: "Grammar"
 *         sub_topic:
 *           type: string
 *           example: "Present Simple"
 *         question_text:
 *           type: string
 *           example: "She ___ to school every day."
 *         correct_answers:
 *           type: array
 *           items:
 *             type: string
 *           example: ["goes"]
 *         explanation_text:
 *           type: string
 *           example: "Ngôi thứ ba số ít → động từ thêm 'es'."
 *         example_sentence:
 *           type: string
 *           example: "She goes to school every day."
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           default: medium
 *           example: "easy"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["present simple", "sv-agreement"]
 *         status:
 *           type: string
 *           enum: [active, inactive, draft]
 *           default: active
 *           example: "active"
 */

// GET routes - static paths first, then dynamic paths
router.get('/', grammarController.getAllGrammars);
router.get('/sub-topics', grammarController.getAllSubTopics);
router.get('/sub-topics-grouped', grammarController.getAllGroupedSubTopics);
router.get('/sub-topics/:main_topic', grammarController.getSubTopicsByMainTopic);
router.get('/search', grammarController.searchGrammars);
router.get('/random', grammarController.getRandomQuestions);
router.get('/topic/:mainTopic/:subTopic', grammarController.getQuestionsByTopic);
router.get('/topic/:mainTopic', grammarController.getQuestionsByTopic);
// Dynamic :id routes
router.get('/:id', grammarController.getGrammarById);

// POST routes
router.post('/', authMiddleware, authorize('admin', 'teacher'), grammarController.createGrammar);

// PUT routes
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.updateGrammar);

// DELETE routes
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.deleteGrammar);

module.exports = router;