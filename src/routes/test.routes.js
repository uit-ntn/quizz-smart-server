const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authMiddleware, authorize, optionalAuthMiddleware } = require('../middleware/auth.middleware');

router.get('/multiple-choices', optionalAuthMiddleware, testController.getAllMultipleChoicesTests);

router.get('/multiple-choices/main-topics', testController.getAllMultipleChoicesMainTopics);

router.get('/multiple-choices/sub-topics/:mainTopic', testController.getAllMultipleChoicesSubTopicsByMainTopic);

router.get('/grammars', optionalAuthMiddleware, testController.getAllGrammarsTests);

router.get('/vocabularies', optionalAuthMiddleware, testController.getAllVocabulariesTests);

router.get('/search', optionalAuthMiddleware, testController.searchTests);

router.get('/', optionalAuthMiddleware, testController.getAllTests);

// Get tests created by current user (requires authentication)
router.get('/my-tests', authMiddleware, testController.getMyTests);

router.get('/type/:testType', optionalAuthMiddleware, testController.getTestsByType);

router.get('/topic/:mainTopic/:subTopic', optionalAuthMiddleware, testController.getTestsByTopic);

router.get('/topic/:mainTopic', optionalAuthMiddleware, testController.getTestsByTopic);

router.get('/:id', optionalAuthMiddleware, testController.getTestById);

// Allow authenticated users to create tests (for their own vocabulary tests)
router.post('/', authMiddleware, testController.createTest);

router.put('/:id', authMiddleware, testController.updateTest);

router.delete('/:id', authMiddleware, testController.deleteTest);

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
 *     description: >
 *       Get all tests with visibility filtering:
 *       - Unauthenticated users: Only public tests
 *       - Authenticated users (non-admin): Only public tests
 *       - Admin users: All tests (public + private)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all accessible tests
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
 * /api/tests/my-tests:
 *   get:
 *     summary: Get tests created by current user
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
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
 *         name: test_type
 *         schema:
 *           type: string
 *           enum: [vocabulary, grammar, multiple_choice]
 *         description: Filter by test type
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
 *           enum: [active, inactive, deleted]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of tests created by current user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *                   test_title:
 *                     type: string
 *                     example: "My Vocabulary Test"
 *                   description:
 *                     type: string
 *                     example: "Custom vocabulary test"
 *                   main_topic:
 *                     type: string
 *                     example: "Business English"
 *                   sub_topic:
 *                     type: string
 *                     example: "Office Communication"
 *                   test_type:
 *                     type: string
 *                     example: "vocabulary"
 *                   difficulty:
 *                     type: string
 *                     example: "medium"
 *                   time_limit_minutes:
 *                     type: integer
 *                     example: 15
 *                   total_questions:
 *                     type: integer
 *                     example: 20
 *                   status:
 *                     type: string
 *                     example: "active"
 *                   visibility:
 *                     type: string
 *                     example: "public"
 *                   created_by:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
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
 *     description: >
 *       Get test details with visibility check:
 *       - Public tests: Accessible by everyone
 *       - Private tests: Only accessible by admin or creator
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
 *         description: Test details
 *       404:
 *         description: Test not found or access denied
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test (Authenticated users)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_title
 *               - main_topic
 *               - sub_topic
 *               - test_type
 *             properties:
 *               test_title:
 *                 type: string
 *                 description: Title of the test
 *                 example: "My Custom Vocabulary Test"
 *               description:
 *                 type: string
 *                 description: Description of the test
 *                 example: "A custom vocabulary test for business English"
 *               main_topic:
 *                 type: string
 *                 description: Main topic category
 *                 example: "Business English"
 *               sub_topic:
 *                 type: string
 *                 description: Sub topic category
 *                 example: "Office Communication"
 *               test_type:
 *                 type: string
 *                 enum: [vocabulary, grammar, multiple_choice]
 *                 description: Type of the test
 *                 example: "vocabulary"
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Difficulty level
 *                 default: easy
 *                 example: "medium"
 *               time_limit_minutes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *                 description: Time limit in minutes
 *                 default: 10
 *                 example: 15
 *               total_questions:
 *                 type: integer
 *                 description: Total number of questions
 *                 example: 20
 *               status:
 *                 type: string
 *                 enum: [active, inactive, deleted]
 *                 description: Test status
 *                 default: active
 *                 example: "active"
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 description: Test visibility - public tests can be seen by everyone, private tests can only be seen by admin or creator
 *                 default: public
 *                 example: "public"
 *           example:
 *             test_title: "Business Vocabulary Test"
 *             description: "Essential vocabulary for business communication"
 *             main_topic: "Business English"
 *             sub_topic: "Office Communication"
 *             test_type: "vocabulary"
 *             difficulty: "medium"
 *             time_limit_minutes: 15
 *             total_questions: 20
 *             status: "active"
 *             visibility: "public"
 *     responses:
 *       201:
 *         description: Test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 test_title:
 *                   type: string
 *                   example: "Business Vocabulary Test"
 *                 description:
 *                   type: string
 *                   example: "Essential vocabulary for business communication"
 *                 main_topic:
 *                   type: string
 *                   example: "Business English"
 *                 sub_topic:
 *                   type: string
 *                   example: "Office Communication"
 *                 test_type:
 *                   type: string
 *                   example: "vocabulary"
 *                 difficulty:
 *                   type: string
 *                   example: "medium"
 *                 time_limit_minutes:
 *                   type: integer
 *                   example: 15
 *                 total_questions:
 *                   type: integer
 *                   example: 20
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 visibility:
 *                   type: string
 *                   example: "public"
 *                 created_by:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error: test_title is required"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid token"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */


/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Update test (Admin or creator only)
 *     tags: [Tests]
 *     description: Update test - accessible by admin or test creator
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
 *         description: Forbidden - Admin or creator access required
 *       404:
 *         description: Test not found or access denied
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Delete test (Admin or creator only)
 *     description: Delete test - accessible by admin or test creator
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
 *         description: Forbidden - Admin or creator access required
 *       404:
 *         description: Test not found or access denied
 *       500:
 *         description: Server error
 */
