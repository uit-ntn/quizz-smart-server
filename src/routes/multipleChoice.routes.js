const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Optional auth middleware - allows both authenticated and unauthenticated access
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        // If token provided, validate it using authMiddleware
        authMiddleware(req, res, next);
    } else {
        // If no token, continue without user info
        req.user = null;
        next();
    }
};

// Public routes (optional authentication)
router.get('/', optionalAuth, multipleChoiceController.getAllMultipleChoices);
router.get('/main-topics', optionalAuth, multipleChoiceController.getAllMultipleChoicesMainTopics);
router.get('/sub-topics/:mainTopic', optionalAuth, multipleChoiceController.getAllMultipleChoicesSubTopicsByMainTopic);
router.get('/test/:testId', optionalAuth, multipleChoiceController.getAllMultipleChoicesByTestId);
router.get('/:id', optionalAuth, multipleChoiceController.getMultipleChoiceById);

// Protected routes (require authentication)
router.post('/', authMiddleware, authorize(['admin', 'teacher']), multipleChoiceController.createMultipleChoice);
router.put('/:id', authMiddleware, authorize(['admin', 'teacher']), multipleChoiceController.updateMultipleChoice);
router.delete('/:id', authMiddleware, authorize(['admin', 'teacher']), multipleChoiceController.deleteMultipleChoice);

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