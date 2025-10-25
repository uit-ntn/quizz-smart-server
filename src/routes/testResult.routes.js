const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResult.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Test Results
 *   description: Test result management endpoints
 */

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/test-results:
 *   get:
 *     summary: Lấy tất cả test results
 *     tags: [Test Results]
 *     description: >
 *       Admin: Thấy tất cả test results
 *       User: Chỉ thấy test results của mình
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accessible test results
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', testResultController.getAllTestResults);

/**
 * @swagger
 * /api/test-results/my-results:
 *   get:
 *     summary: Get current user's test results
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's test results
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-results', testResultController.getMyTestResults);

/**
 * @swagger
 * /api/test-results/my-statistics:
 *   get:
 *     summary: Get current user's statistics
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-statistics', testResultController.getMyStatistics);

/**
 * @swagger
 * /api/test-results/test/{testId}:
 *   get:
 *     summary: Lấy test results theo test ID
 *     tags: [Test Results]
 *     description: >
 *       Admin: Thấy tất cả test results của test
 *       User: Chỉ thấy test results của mình trong test đó
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test results for specified test
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */
router.get('/test/:testId', testResultController.getTestResultsByTest);

/**
 * @swagger
 * /api/test-results/user/{userId}/statistics:
 *   get:
 *     summary: Get user statistics by user ID (Admin only)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userId/statistics', authorize('admin'), testResultController.getUserStatistics);

/**
 * @swagger
 * /api/test-results/{id}:
 *   get:
 *     summary: Lấy test result theo ID
 *     tags: [Test Results]
 *     description: >
 *       Admin hoặc owner của test result mới thấy được
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test result ID
 *     responses:
 *       200:
 *         description: Test result details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Test result not found
 *       500:
 *         description: Server error
 */
router.get('/:id', testResultController.getTestResultById);

/**
 * @swagger
 * /api/test-results:
 *   post:
 *     summary: Create a new test result
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_id
 *               - answers
 *               - score
 *               - total_questions
 *               - time_taken
 *             properties:
 *               test_id:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: string
 *                     user_answer:
 *                       type: string
 *                     is_correct:
 *                       type: boolean
 *               score:
 *                 type: number
 *               total_questions:
 *                 type: integer
 *               time_taken:
 *                 type: integer
 *                 description: Time taken in seconds
 *     responses:
 *       201:
 *         description: Test result created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Server error
 */
router.post('/', testResultController.createTestResult);

/**
 * @swagger
 * /api/test-results/{id}:
 *   put:
 *     summary: Cập nhật test result
 *     tags: [Test Results]
 *     description: >
 *       Admin hoặc owner của test result mới cập nhật được
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test result ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, deleted]
 *               device_info:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test result updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Test result not found or access denied
 *       500:
 *         description: Server error
 */
router.put('/:id', testResultController.updateTestResult);

/**
 * @swagger
 * /api/test-results/{id}/status:
 *   patch:
 *     summary: Update test result status
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test result ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, deleted]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Test result not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', authorize('admin'), testResultController.updateStatusById);

/**
 * @swagger
 * /api/test-results/test/{testId}/status:
 *   patch:
 *     summary: Update all test results status by test ID (Admin only)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, deleted]
 *     responses:
 *       200:
 *         description: Test results status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.patch('/test/:testId/status', authorize('admin'), testResultController.updateStatusByTestId);

/**
 * @swagger
 * /api/test-results/{id}:
 *   delete:
 *     summary: Xóa mềm test result
 *     tags: [Test Results]
 *     description: >
 *       Admin hoặc owner của test result mới xóa được
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test result ID
 *     responses:
 *       200:
 *         description: Test result deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Test result not found or access denied
 *       500:
 *         description: Server error
 */
router.delete('/:id', testResultController.softDeleteTestResult);

/**
 * @swagger
 * /api/test-results/{id}/hard-delete:
 *   delete:
 *     summary: Permanently delete test result (Admin only)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test result ID
 *     responses:
 *       200:
 *         description: Test result permanently deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Test result not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/hard-delete', authorize('admin'), testResultController.hardDeleteTestResult);

/**
 * @swagger
 * /api/test-results/{id}/restore:
 *   patch:
 *     summary: Restore deleted test result (Admin only)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test result ID
 *     responses:
 *       200:
 *         description: Test result restored successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Deleted test result not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/restore', authorize('admin'), testResultController.restoreTestResult);




module.exports = router;

