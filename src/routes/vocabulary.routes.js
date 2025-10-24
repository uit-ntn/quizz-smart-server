const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/', vocabularyController.getAllVocabularies);
router.get('/search', vocabularyController.searchVocabularies);
router.get('/main-topics', vocabularyController.getAllVocabularyMainTopics);
router.get('/sub-topics/:mainTopic', vocabularyController.getAllVocabularySubTopicsByMainTopic);
router.get('/test/:testId', vocabularyController.getAllVocabulariesByTestId);
router.get('/:id', vocabularyController.getVocabularyById);

// Protected routes (authentication required)
router.post('/', authMiddleware, vocabularyController.createVocabulary);
router.put('/:id', authMiddleware, vocabularyController.updateVocabulary);
router.delete('/:id', authMiddleware, authorize(['admin', 'teacher']), vocabularyController.deleteVocabulary);

// AI-powered routes (authentication required)
router.post('/generate', authMiddleware, vocabularyController.generateVocabulary);
router.get('/ai/test-connection', authMiddleware, vocabularyController.testGeminiConnection);
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

/**
 * @swagger
 * /api/vocabularies/generate:
 *   post:
 *     summary: Generate vocabulary using AI (Gemini)
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
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Main topic for vocabulary generation
 *                 example: "Business Communication"
 *               category:
 *                 type: string
 *                 description: Category or subcategory
 *                 example: "Professional Skills"
 *               description:
 *                 type: string
 *                 description: Additional description for context
 *                 example: "Essential vocabulary for workplace communication"
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Number of vocabulary words to generate
 *                 example: 15
 *           example:
 *             topic: "Travel and Tourism"
 *             category: "Transportation"
 *             description: "Vocabulary for booking flights and hotels"
 *             count: 20
 *     responses:
 *       200:
 *         description: Vocabulary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Generated 15 vocabulary words for topic: Business Communication"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                       example: "Business Communication"
 *                     category:
 *                       type: string
 *                       example: "Professional Skills"
 *                     description:
 *                       type: string
 *                       example: "Generated vocabulary"
 *                     count:
 *                       type: integer
 *                       example: 15
 *                     vocabulary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           word:
 *                             type: string
 *                             example: "negotiate"
 *                           meaning:
 *                             type: string
 *                             example: "thương lượng"
 *                           example_sentence:
 *                             type: string
 *                             example: "We need to negotiate the contract terms before signing."
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                     generated_by:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Topic is required"
 *                 example:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                       example: "Business Communication"
 *                     category:
 *                       type: string
 *                       example: "Professional Skills"
 *                     description:
 *                       type: string
 *                       example: "Essential vocabulary for workplace communication"
 *                     count:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: AI generation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to generate vocabulary"
 *                 error:
 *                   type: string
 *                 suggestion:
 *                   type: string
 *                   example: "Please try again with a more specific topic or check your API configuration"
 */

/**
 * @swagger
 * /api/vocabularies/ai/test-connection:
 *   get:
 *     summary: Test Gemini AI connection and configuration
 *     tags: [Vocabularies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI connection test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gemini AI Service Status"
 *                 connection:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                 configuration:
 *                   type: object
 *                   properties:
 *                     apiKey:
 *                       type: string
 *                       example: "Configured"
 *                     model:
 *                       type: string
 *                       example: "gemini-pro"
 *                     service:
 *                       type: string
 *                       example: "Google Generative AI"
 *                     status:
 *                       type: string
 *                       example: "Ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Connection test failed
 */

/**
 * @swagger
 * /api/vocabularies/main-topics:
 *   get:
 *     summary: Get all vocabulary main topics
 *     tags: [Vocabularies]
 *     responses:
 *       200:
 *         description: List of main topics
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/vocabularies/sub-topics/{mainTopic}:
 *   get:
 *     summary: Get sub topics by main topic
 *     tags: [Vocabularies]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic name
 *     responses:
 *       200:
 *         description: List of sub topics
 *       500:
 *         description: Server error
 */

