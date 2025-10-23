const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammar.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');


router.get('/', grammarController.getAllGrammars);
router.get('/:id', grammarController.getGrammarById);
router.post('/', authMiddleware, authorize('admin'), grammarController.createGrammar);
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.updateGrammar);
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), grammarController.deleteGrammar);

module.exports = router;

/**
 * @swagger
 * /api/grammars:
 *   post:
 *     summary: Create a new grammar question (Admin/Teacher only)
 *     tags: [Grammar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - main_topic
 *               - sub_topic
 *               - question_text
 *               - correct_answers
 *               - explanation_text
 *               - example_sentence
 *             properties:
 *               main_topic:
 *                 type: string
 *               sub_topic:
 *                 type: string
 *               question_text:
 *                 type: string
 *               correct_answers:
 *                 type: array
 *                 items:
 *                   type: string
 *               explanation_text:
 *                 type: string
 *               example_sentence:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Question created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/grammars/{id}:
 *   put:
 *     summary: Update grammar question (Admin/Teacher only)
 *     tags: [Grammar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               main_topic:
 *                 type: string
 *               sub_topic:
 *                 type: string
 *               question_text:
 *                 type: string
 *               correct_answers:
 *                 type: array
 *                 items:
 *                   type: string
 *               explanation_text:
 *                 type: string
 *               example_sentence:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/grammars/{id}:
 *   delete:
 *     summary: Delete grammar question (Admin/Teacher only)
 *     tags: [Grammar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
