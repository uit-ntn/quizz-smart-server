const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

router.get('/', multipleChoiceController.getAllMultipleChoices);
router.get('/main-topics', multipleChoiceController.getAllMultipleChoicesMainTopics);
router.get('/sub-topics/:mainTopic', multipleChoiceController.getAllMultipleChoicesSubTopicsByMainTopic);
router.get('/test/:testId', multipleChoiceController.getAllMultipleChoicesByTestId);
router.get('/:id', multipleChoiceController.getMultipleChoiceById);
router.post('/', multipleChoiceController.createMultipleChoice);
router.put('/:id', multipleChoiceController.updateMultipleChoice);
router.delete('/:id', multipleChoiceController.deleteMultipleChoice);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Multiple Choice
 *   description: Multiple choice question management endpoints
 */

/**
 * @swagger
 * /api/multiple-choices:
 *   get:
 *     summary: Get all multiple choice questions
 *     tags: [Multiple Choice]
 *     responses:
 *       200:
 *         description: List of all multiple choice questions
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/multiple-choices/main-topics:
 *   get:
 *     summary: Get all main topics
 *     tags: [Multiple Choice]
 *     responses:
 *       200:
 *         description: List of all main topics
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/multiple-choices:
 *   post:
 *     summary: Create a new multiple choice question (Admin/Teacher only)
 *     tags: [Multiple Choice]
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
 *               - options
 *               - correct_answers
 *               - explanation
 *             properties:
 *               main_topic:
 *                 type: string
 *               sub_topic:
 *                 type: string
 *               question_text:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     text:
 *                       type: string
 *               correct_answers:
 *                 type: array
 *                 items:
 *                   type: string
 *               explanation:
 *                 type: object
 *                 properties:
 *                   correct:
 *                     type: string
 *                   incorrect_choices:
 *                     type: object
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
 * /api/multiple-choices/{id}:
 *   put:
 *     summary: Update multiple choice question (Admin)
 *     tags: [Multiple Choice]
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
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     text:
 *                       type: string
 *               correct_answers:
 *                 type: array
 *                 items:
 *                   type: string
 *               explanation:
 *                 type: object
 *                 properties:
 *                   correct:
 *                     type: string
 *                   incorrect_choices:
 *                     type: object
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
 * /api/multiple-choices/{id}:
 *   delete:
 *     summary: Delete multiple choice question (Admin/Teacher only)
 *     tags: [Multiple Choice]
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
/*
*@swagger
* /api/multiple-choices/test/{testId}:
*   get:
*     summary: Get all multiple choice questions by test ID
*     tags: [Multiple Choice]
*     parameters:
*       - in: path
*         name: testId
*         required: true
*         schema:
*           type: string
*         description: Test ID
*     responses:
*       200:
*         description: List of all multiple choice questions by test ID
*       500:
*         description: Server error
*/

/**
 * @swagger
 * /api/multiple-choices/test/{testId}:
 *   post:
 *     summary: Create a new multiple choice question by test ID
 *     tags: [Multiple Choice]
 *     security:
 *       - bearerAuth: []
 */