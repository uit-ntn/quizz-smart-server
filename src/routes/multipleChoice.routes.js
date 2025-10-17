const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMultipleChoiceRequest:
 *       type: object
 *       required:
 *         - main_topic
 *         - sub_topic
 *         - question_text
 *         - options
 *         - correct_answers
 *         - explanation
 *       properties:
 *         main_topic:
 *           type: string
 *           example: "TOEIC"
 *         sub_topic:
 *           type: string
 *           example: "Part 5 - Incomplete Sentences"
 *         question_text:
 *           type: string
 *           example: "The new policy will be effective _____ next Monday."
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "A"
 *               text:
 *                 type: string
 *                 example: "in"
 *         correct_answers:
 *           type: array
 *           items:
 *             type: string
 *           example: ["B"]
 *         explanation:
 *           type: object
 *           properties:
 *             correct:
 *               type: string
 *               example: "Dùng 'on' với ngày cụ thể (on Monday)."
 *             incorrect_choices:
 *               type: object
 *               example: {
 *                 "A": "'in' dùng cho tháng/năm/khoảng thời gian.",
 *                 "C": "'at' dùng cho thời điểm giờ cụ thể.",
 *                 "D": "'for' dùng chỉ khoảng thời lượng."
 *               }
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           default: medium
 *           example: "easy"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["toeic", "preposition", "part5"]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           example: "active"
 */

/**
 * @swagger
 * /api/multiple-choices:
 *   get:
 *     summary: Get all multiple choice questions
 *     tags: [Multiple Choice]
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
 *         description: Multiple choice questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MultipleChoice'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', multipleChoiceController.getAllMultipleChoices);

/**
 * @swagger
 * /api/multiple-choices/{id}:
 *   get:
 *     summary: Get multiple choice question by ID
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Multiple choice question ID
 *     responses:
 *       200:
 *         description: Multiple choice question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MultipleChoice'
 *       404:
 *         description: Question not found
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
router.get('/:id', multipleChoiceController.getMultipleChoiceById);

/**
 * @swagger
 * /api/multiple-choices/search:
 *   get:
 *     summary: Search multiple choice questions
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Multiple choice questions found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MultipleChoice'
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
router.get('/search', multipleChoiceController.searchMultipleChoices);

/**
 * @swagger
 * /api/multiple-choices/topic/{mainTopic}:
 *   get:
 *     summary: Get questions by main topic
 *     tags: [Multiple Choice]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic name
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MultipleChoice'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topic/:mainTopic', multipleChoiceController.getQuestionsByTopic);

/**
 * @swagger
 * /api/multiple-choices/topic/{mainTopic}/{subTopic}:
 *   get:
 *     summary: Get questions by main topic and sub topic
 *     tags: [Multiple Choice]
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
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MultipleChoice'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topic/:mainTopic/:subTopic', multipleChoiceController.getQuestionsByTopic);

/**
 * @swagger
 * /api/multiple-choices/random:
 *   get:
 *     summary: Get random multiple choice questions for quiz
 *     tags: [Multiple Choice]
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
 *         description: Random questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MultipleChoice'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/random', multipleChoiceController.getRandomQuestions);

/**
 * @swagger
 * /api/multiple-choices:
 *   post:
 *     summary: Create new multiple choice question (Admin/Teacher only)
 *     tags: [Multiple Choice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMultipleChoiceRequest'
 *     responses:
 *       201:
 *         description: Multiple choice question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MultipleChoice'
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
router.post('/', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.createMultipleChoice);

/**
 * @swagger
 * /api/multiple-choices/{id}:
 *   put:
 *     summary: Update multiple choice question by ID (Admin/Teacher only)
 *     tags: [Multiple Choice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Multiple choice question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMultipleChoiceRequest'
 *     responses:
 *       200:
 *         description: Multiple choice question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MultipleChoice'
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
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.updateMultipleChoice);

/**
 * @swagger
 * /api/multiple-choices/{id}:
 *   delete:
 *     summary: Delete multiple choice question by ID (Admin/Teacher only)
 *     tags: [Multiple Choice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Multiple choice question ID
 *     responses:
 *       200:
 *         description: Multiple choice question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question deleted successfully"
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
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.deleteMultipleChoice);

module.exports = router;