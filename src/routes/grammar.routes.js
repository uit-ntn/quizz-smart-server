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
 *           enum: [active, inactive]
 *           default: active
 *           example: "active"
 */

/**
 * @swagger
 * /api/grammars:
 *   get:
 *     summary: Get all grammar questions
 *     tags: [Grammar]
 *     parameters:
 *       - in: query
 *         name: main_topic
 *         schema:
 *           type: string
 *         description: Filter by main topic
 *       - in: query
 *         name: sub_topic
 *         schema:
 *           type: string
 *         description: Filter by sub topic
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Grammar questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grammar'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', grammarController.getAllGrammars);

/**
 * @swagger
 * /api/grammars/{id}:
 *   get:
 *     summary: Get grammar question by ID
 *     tags: [Grammar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Grammar question ID
 *     responses:
 *       200:
 *         description: Grammar question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Grammar'
 *       404:
 *         description: Grammar question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', grammarController.getGrammarById);

/**
 * @swagger
 * /api/grammars/search:
 *   get:
 *     summary: Search grammar questions
 *     tags: [Grammar]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Grammar questions found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grammar'
 *       400:
 *         description: Bad request - Search term required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', grammarController.searchGrammars);

/**
 * @swagger
 * /api/grammars/topic/{mainTopic}:
 *   get:
 *     summary: Get grammar questions by main topic
 *     tags: [Grammar]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic name
 *     responses:
 *       200:
 *         description: Grammar questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grammar'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topic/:mainTopic', grammarController.getQuestionsByTopic);

/**
 * @swagger
 * /api/grammars/topic/{mainTopic}/{subTopic}:
 *   get:
 *     summary: Get grammar questions by main topic and sub topic
 *     tags: [Grammar]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic name
 *       - in: path
 *         name: subTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Sub topic name
 *     responses:
 *       200:
 *         description: Grammar questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grammar'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topic/:mainTopic/:subTopic', grammarController.getQuestionsByTopic);

/**
 * @swagger
 * /api/grammars/random:
 *   get:
 *     summary: Get random grammar questions for quiz
 *     tags: [Grammar]
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of questions to return
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: main_topic
 *         schema:
 *           type: string
 *         description: Filter by main topic
 *     responses:
 *       200:
 *         description: Random grammar questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grammar'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/random', grammarController.getRandomQuestions);

/**
 * @swagger
 * /api/grammars:
 *   post:
 *     summary: Create new grammar question (Admin/Teacher only)
 *     tags: [Grammar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGrammarRequest'
 *     responses:
 *       201:
 *         description: Grammar question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Grammar'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authMiddleware, authorize('admin', 'teacher'), grammarController.createGrammar);

/**
 * @swagger
 * /api/grammars/{id}:
 *   put:
 *     summary: Update grammar question by ID (Admin/Teacher only)
 *     tags: [Grammar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Grammar question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGrammarRequest'
 *     responses:
 *       200:
 *         description: Grammar question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Grammar'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Grammar question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.updateGrammar);

/**
 * @swagger
 * /api/grammars/{id}:
 *   delete:
 *     summary: Delete grammar question by ID (Admin/Teacher only)
 *     tags: [Grammar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Grammar question ID
 *     responses:
 *       200:
 *         description: Grammar question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Grammar question deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Grammar question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.deleteGrammar);

module.exports = router;