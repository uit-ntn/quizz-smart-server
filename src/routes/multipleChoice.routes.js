const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize, optionalAuthMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Multiple Choice
 *   description: Multiple choice question management endpoints
 */

// ===== Public (optionalAuth) — để service áp dụng visibility =====
router.get('/', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoices);
router.get('/main-topics', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoicesMainTopics);
router.get('/sub-topics/:mainTopic', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoicesSubTopicsByMainTopic);
router.get('/test/:testId', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoicesByTestId);
router.get('/:id', optionalAuthMiddleware, multipleChoiceController.getMultipleChoiceById);

// ===== Protected (admin/teacher) =====
router.post('/', authMiddleware, authorize(['admin']), multipleChoiceController.createMultipleChoice);
router.put('/:id', authMiddleware, authorize(['admin']), multipleChoiceController.updateMultipleChoice);
router.delete('/:id', authMiddleware, authorize(['admin']), multipleChoiceController.deleteMultipleChoice);

module.exports = router;

/**
 * @swagger
 * /api/multiple-choices:
 *   get:
 *     summary: Get all multiple choice questions
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: query
 *         name: main_topic
 *         schema: { type: string }
 *       - in: query
 *         name: sub_topic
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [easy, medium, hard] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, deleted] }
 *       - in: query
 *         name: test_id
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       500: { description: Server error }
 *
 * /api/multiple-choices/main-topics:
 *   get:
 *     summary: Get all main topics
 *     tags: [Multiple Choice]
 *     responses:
 *       200: { description: OK }
 *
 * /api/multiple-choices/sub-topics/{mainTopic}:
 *   get:
 *     summary: Get all sub topics by main topic
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *
 * /api/multiple-choices/test/{testId}:
 *   get:
 *     summary: Get all questions by test ID
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *
 * /api/multiple-choices/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *
 *   put:
 *     summary: Update question (Admin/Teacher)
 *     tags: [Multiple Choice]
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
 *     summary: Delete question (Admin/Teacher)
 *     tags: [Multiple Choice]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/multiple-choices:
 *   post:
 *     summary: Create question (Admin/Teacher)
 *     tags: [Multiple Choice]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Created }
 */
