const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

router.get('/', vocabularyController.getAllVocabularies);
router.get('/test/:testId', vocabularyController.getAllVocabulariesByTestId);
router.get('/:id', vocabularyController.getVocabularyById);
router.post('/', vocabularyController.createVocabulary);
router.put('/:id', vocabularyController.updateVocabulary);
router.delete('/:id', vocabularyController.deleteVocabulary);
router.get('/search', vocabularyController.searchVocabularies);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Vocabularies
 *   description: Vocabulary management endpoints
 */

/**
 * @swagger
 * /api/vocabularies:
 *   get:
 *     summary: Get all vocabularies
 *     tags: [Vocabularies]
 *     responses:
 *       200:
 *         description: List of all vocabularies
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/vocabularies/sub-topics:
 *   get:
 *     summary: Get all sub topics
 *     tags: [Vocabularies]
 *     responses:
 *       200:
 *         description: List of all sub topics
 *       500:
 *         description: Server error
 */

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
 *         description: Vocabulary details
 *       404:
 *         description: Vocabulary not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/vocabularies:
 *   post:
 *     summary: Create a new vocabulary (Admin/Teacher only)
 *     tags: [Vocabularies]
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
 *               - word
 *               - meaning
 *               - example_sentence
 *             properties:
 *               main_topic:
 *                 type: string
 *               sub_topic:
 *                 type: string
 *               word:
 *                 type: string
 *               meaning:
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
 *         description: Vocabulary created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/vocabularies/{id}:
 *   put:
 *     summary: Update vocabulary (Admin/Teacher only)
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
 *             type: object
 *             properties:
 *               main_topic:
 *                 type: string
 *               sub_topic:
 *                 type: string
 *               word:
 *                 type: string
 *               meaning:
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
 *         description: Vocabulary updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *       404:
 *         description: Vocabulary not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/vocabularies/{id}:
 *   delete:
 *     summary: Delete vocabulary (Admin/Teacher only)
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Teacher access required
 *       404:
 *         description: Vocabulary not found
 *       500:
 *         description: Server error
 */

