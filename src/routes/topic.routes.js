const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Topic:
 *       type: object
 *       properties:
 *         main_topic:
 *           type: string
 *           example: "TOEIC"
 *         sub_topics:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Part 5 - Incomplete Sentences"
 *               count:
 *                 type: integer
 *                 example: 25
 *         total_questions:
 *           type: integer
 *           example: 100
 *         type:
 *           type: string
 *           enum: [multiple-choice, grammar]
 *           example: "multiple-choice"
 *     Test:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "toeic_part5_multiple-choice"
 *         title:
 *           type: string
 *           example: "Part 5 - Incomplete Sentences"
 *         main_topic:
 *           type: string
 *           example: "TOEIC"
 *         sub_topic:
 *           type: string
 *           example: "Part 5 - Incomplete Sentences"
 *         type:
 *           type: string
 *           enum: [multiple-choice, grammar]
 *           example: "multiple-choice"
 *         total_questions:
 *           type: integer
 *           example: 25
 *         difficulties:
 *           type: array
 *           items:
 *             type: string
 *           example: ["easy", "medium", "hard"]
 *         description:
 *           type: string
 *           example: "25 câu hỏi trắc nghiệm về Part 5 - Incomplete Sentences"
 *     TestResult:
 *       type: object
 *       properties:
 *         test_info:
 *           type: object
 *           properties:
 *             main_topic:
 *               type: string
 *               example: "TOEIC"
 *             sub_topic:
 *               type: string
 *               example: "Part 5"
 *             type:
 *               type: string
 *               example: "multiple-choice"
 *             difficulty:
 *               type: string
 *               example: "medium"
 *             total_questions:
 *               type: integer
 *               example: 10
 *         questions:
 *           type: array
 *           items:
 *             oneOf:
 *               - $ref: '#/components/schemas/MultipleChoice'
 *               - $ref: '#/components/schemas/Grammar'
 */

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Get all topics with question counts
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [multiple-choice, grammar]
 *         description: Filter by question type
 *     responses:
 *       200:
 *         description: Topics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', topicController.getAllTopics);

/**
 * @swagger
 * /api/topics/{mainTopic}/{type}/tests:
 *   get:
 *     summary: Get tests by topic and type
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: mainTopic
 *         required: true
 *         schema:
 *           type: string
 *         description: Main topic name
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [multiple-choice, grammar]
 *         description: Question type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Test'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:mainTopic/:type/tests', topicController.getTestsByTopic);

/**
 * @swagger
 * /api/topics/{mainTopic}/{subTopic}/{type}/questions:
 *   get:
 *     summary: Get test questions for specific topic and sub-topic
 *     tags: [Topics]
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
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [multiple-choice, grammar]
 *         description: Question type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard, all]
 *         description: Filter by difficulty
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of questions
 *     responses:
 *       200:
 *         description: Test questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestResult'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:mainTopic/:subTopic/:type/questions', topicController.getTestQuestions);

/**
 * @swagger
 * /api/topics/random/{type}:
 *   get:
 *     summary: Get random test questions
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [multiple-choice, grammar]
 *         description: Question type
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of questions
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard, all]
 *         description: Filter by difficulty
 *     responses:
 *       200:
 *         description: Random test questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestResult'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/random/:type', topicController.getRandomTest);

module.exports = router;