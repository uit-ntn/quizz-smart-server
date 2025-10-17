const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateVocabularyRequest:
 *       type: object
 *       required:
 *         - main_topic
 *         - sub_topic
 *         - word
 *         - meaning
 *         - example_sentence
 *       properties:
 *         main_topic:
 *           type: string
 *           example: "Vocabulary"
 *         sub_topic:
 *           type: string
 *           example: "Education"
 *         word:
 *           type: string
 *           example: "scholarship"
 *         meaning:
 *           type: string
 *           example: "học bổng"
 *         example_sentence:
 *           type: string
 *           example: "She won a full scholarship to study abroad."
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           default: medium
 *           example: "easy"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["education", "noun", "vocabulary"]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           example: "active"
 */

/**
 * @swagger
 * /api/vocabularies:
 *   get:
 *     summary: Get all vocabularies
 *     tags: [Vocabularies]
 *     parameters:
 *       - in: query
 *         name: main_topic
 *         schema:
 *           type: string
 *         description: Filter by main topic
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
 *         description: Vocabularies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vocabulary'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', vocabularyController.getAllVocabularies);

/**
 * @swagger
 * /api/vocabularies/{id}:
 *   get:
 *     summary: Get vocabulary by ID
 *     tags: [Vocabularies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vocabulary ID
 *     responses:
 *       200:
 *         description: Vocabulary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vocabulary'
 *       404:
 *         description: Vocabulary not found
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
router.get('/:id', vocabularyController.getVocabularyById);

/**
 * @swagger
 * /api/vocabularies/search:
 *   get:
 *     summary: Search vocabularies
 *     tags: [Vocabularies]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Vocabularies found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vocabulary'
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
router.get('/search', vocabularyController.searchVocabularies);

/**
 * @swagger
 * /api/vocabularies:
 *   post:
 *     summary: Create new vocabulary (Admin/Teacher only)
 *     tags: [Vocabularies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVocabularyRequest'
 *     responses:
 *       201:
 *         description: Vocabulary created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vocabulary'
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
router.post('/', authMiddleware, authorize('admin', 'teacher'), vocabularyController.createVocabulary);

/**
 * @swagger
 * /api/vocabularies/{id}:
 *   put:
 *     summary: Update vocabulary by ID (Admin/Teacher only)
 *     tags: [Vocabularies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vocabulary ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVocabularyRequest'
 *     responses:
 *       200:
 *         description: Vocabulary updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vocabulary'
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
 *         description: Vocabulary not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), vocabularyController.updateVocabulary);

/**
 * @swagger
 * /api/vocabularies/{id}:
 *   delete:
 *     summary: Delete vocabulary by ID (Admin/Teacher only)
 *     tags: [Vocabularies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vocabulary ID
 *     responses:
 *       200:
 *         description: Vocabulary deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vocabulary deleted successfully"
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
 *         description: Vocabulary not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), vocabularyController.deleteVocabulary);

module.exports = router;