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
 *           enum: [active, inactive, draft]
 *           default: active
 *           example: "active"
 */

// GET routes - static paths first, then dynamic paths
router.get('/', multipleChoiceController.getAllMultipleChoices);
router.get('/main-topics', multipleChoiceController.getAllMainTopics);
router.get('/sub-topics-grouped', multipleChoiceController.getAllGroupedSubTopics);
router.get('/sub-topics/:main_topic', multipleChoiceController.getSubTopicsByMainTopic);
router.get('/search', multipleChoiceController.searchMultipleChoices);
router.get('/random', multipleChoiceController.getRandomQuestions);
router.get('/topic/:mainTopic/:subTopic', multipleChoiceController.getQuestionsByTopic);
router.get('/topic/:mainTopic', multipleChoiceController.getQuestionsByTopic);
// Dynamic :id routes (static routes above ensure no conflicts)
router.get('/:id', multipleChoiceController.getMultipleChoiceById);

// POST routes
router.post('/', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.createMultipleChoice);

// PUT routes
router.put('/:id', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.updateMultipleChoice);

// DELETE routes
router.delete('/:id', authMiddleware, authorize('admin', 'teacher'), multipleChoiceController.deleteMultipleChoice);

module.exports = router;