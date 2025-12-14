const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammar.controller');
const { authMiddleware, authorize, optionalAuthMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Grammars
 *   description: Grammar question management endpoints
 */

// ===== Public (optional auth) =====
router.get('/', optionalAuthMiddleware, grammarController.getAllGrammars);
router.get('/test/:testId', optionalAuthMiddleware, grammarController.getAllGrammarsByTestId);
router.get('/:id', optionalAuthMiddleware, grammarController.getGrammarById);

// ===== Protected (admin/teacher) =====
router.post('/', authMiddleware, authorize(), grammarController.createGrammar);
router.put('/:id', authMiddleware, authorize(), grammarController.updateGrammar);
router.delete('/:id', authMiddleware, authorize(), grammarController.deleteGrammar);

module.exports = router;

/**
 * @swagger
 * /api/grammars:
 *   get:
 *     summary: Get all grammars
 *     tags: [Grammars]
 *     parameters:
 *       - in: query
 *         name: test_id
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [easy, medium, hard] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, draft, archived] }
 *     responses:
 *       200: { description: OK }
 *
 *   post:
 *     summary: Create a new grammar (Admin/Teacher)
 *     tags: [Grammars]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Created }
 *
 * /api/grammars/test/{testId}:
 *   get:
 *     summary: Get grammars by test ID
 *     tags: [Grammars]
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *
 * /api/grammars/{id}:
 *   get:
 *     summary: Get grammar by ID
 *     tags: [Grammars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *
 *   put:
 *     summary: Update grammar (Admin/Teacher)
 *     tags: [Grammars]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *
 *   delete:
 *     summary: Delete grammar (Admin/Teacher)
 *     tags: [Grammars]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
