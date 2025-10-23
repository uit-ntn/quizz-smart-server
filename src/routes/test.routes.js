const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

router.get('/multiple-choices', testController.getAllMultipleChoicesTests);

router.get('/multiple-choices/main-topics', testController.getAllMultipleChoicesMainTopics);

router.get('/multiple-choices/sub-topics/:mainTopic', testController.getAllMultipleChoicesSubTopicsByMainTopic);

router.get('/grammars', testController.getAllGrammarsTests);

router.get('/vocabularies', testController.getAllVocabulariesTests);

router.get('/search', testController.searchTests);

router.get('/', testController.getAllTests);

router.get('/type/:testType', testController.getTestsByType);

router.get('/topic/:mainTopic/:subTopic', testController.getTestsByTopic);

router.get('/topic/:mainTopic', testController.getTestsByTopic);

router.get('/:id', testController.getTestById);

router.post('/', authMiddleware, authorize('admin'), testController.createTest);

router.put('/:id', authMiddleware, authorize('admin'), testController.updateTest);

router.delete('/:id', authMiddleware, authorize('admin'), testController.deleteTest);

router.get('/grammars/main-topics', testController.getAllGrammarsMainTopics);

router.get('/grammars/sub-topics/:mainTopic', testController.getAllGrammarsSubTopicsByMainTopic);

router.get('/vocabularies/main-topics', testController.getAllVocabulariesMainTopics);

router.get('/vocabularies/sub-topics/:mainTopic', testController.getAllVocabulariesSubTopicsByMainTopic);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Tests
 *   description: Test management endpoints
 */

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all tests
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: List of all tests
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tests/search:
 *   get:
 *     summary: Search tests
 *     tags: [Tests]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests/type/{testType}:
 *   get:
 *     summary: Get tests by type
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: testType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of test
 *     responses:
 *       200:
 *         description: Tests of specified type
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tests/topic/{mainTopic}/{subTopic}:
 *   get:
 *     summary: Get tests by main topic and sub topic
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic
 *       - in: path
 *         name: subTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Sub topic
 *     responses:
 *       200:
 *         description: Tests for specified topic
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tests/topic/{mainTopic}:
 *   get:
 *     summary: Get tests by main topic
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic
 *     responses:
 *       200:
 *         description: Tests for specified main topic
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get test by ID
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test details
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test (Admin only)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               test_type:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Test created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update test (Admin only)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               test_type:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete test (Admin only)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
