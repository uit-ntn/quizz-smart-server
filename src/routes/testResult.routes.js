const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth.middleware');
const controller = require('../controllers/testResult.controller');

/* =====================================================
 * ADMIN ONLY MIDDLEWARE
 * ===================================================== */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin only',
      type: 'ACCESS_DENIED',
    });
  }
  next();
};

/* =====================================================
 * LEADERBOARD - PUBLIC ACCESS (BEFORE AUTH MIDDLEWARE)
 * ===================================================== */

/**
 * @swagger
 * /api/test-results/leaderboard/week:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get top users by week
 *     description: Retrieve top performing users in the last 7 days based on composite score
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 3
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Weekly leaderboard retrieved successfully
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
 *                   example: "Weekly leaderboard fetched successfully"
 *                 period:
 *                   type: string
 *                   example: "week"
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardUser'
 *                 generated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid limit parameter
 */
router.get('/leaderboard/week', controller.getTopUsersByWeek);

/**
 * @swagger
 * /api/test-results/leaderboard/month:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get top users by month
 *     description: Retrieve top performing users in the last 30 days based on composite score
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 3
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Monthly leaderboard retrieved successfully
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
 *                   example: "Monthly leaderboard fetched successfully"
 *                 period:
 *                   type: string
 *                   example: "month"
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardUser'
 *                 generated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid limit parameter
 */
router.get('/leaderboard/month', controller.getTopUsersByMonth);

/**
 * @swagger
 * /api/test-results/leaderboard/custom:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get top users by custom period
 *     description: Retrieve top performing users in a custom date range based on composite score
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date (YYYY-MM-DD format)
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         description: End date (YYYY-MM-DD format)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 3
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Custom period leaderboard retrieved successfully
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
 *                   example: "Custom period leaderboard fetched successfully"
 *                 period:
 *                   type: string
 *                   example: "custom"
 *                 start_date:
 *                   type: string
 *                   format: date
 *                 end_date:
 *                   type: string
 *                   format: date
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardUser'
 *                 generated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters (dates, limit, or date range too large)
 */
router.get('/leaderboard/custom', controller.getTopUsersByCustomPeriod);
router.get('/top-performers', controller.getTopPerformers);
router.get('/top-test-takers', controller.getTopTestTakers);

/* =====================================================
 * AUTH REQUIRED
 * ===================================================== */
router.use(authMiddleware);

/* =====================================================
 * CREATE + LIST
 * ===================================================== */
router.post('/', controller.createTestResult);
router.get('/', controller.getAllTestResults);

/* =====================================================
 * MY TEST RESULTS (ACTIVE ONLY)
 * ===================================================== */
// user lấy kết quả test active của mình
router.get('/my-results', controller.getMyTestResults);

/* =====================================================
 * STATISTICS
 * ===================================================== */
// user tự xem thống kê của mình
router.get('/my-statistics', controller.getMyStatistics);

// admin xem thống kê user bất kỳ
router.get('/user/:userId/statistics', adminOnly, controller.getUserStatistics);

/* =====================================================
 * STATUS
 * ===================================================== */
// owner: draft -> active
// admin: đổi tự do
router.patch('/:id/status', controller.updateStatusById);

/* =====================================================
 * RESTORE / HARD DELETE (ADMIN)
 * ===================================================== */
router.patch('/:id/restore', adminOnly, controller.restoreTestResult);
router.delete('/:id/hard-delete', adminOnly, controller.hardDeleteTestResult);

/* =====================================================
 * BEHAVIOR & SESSION LOGGING
 * ===================================================== */
router.post('/:id/behaviors', controller.addBehavior);
router.post('/:id/session/start', controller.startSessionMeta);
router.post('/:id/session/end', controller.endSessionMeta);

/* =====================================================
 * READ / UPDATE / SOFT DELETE
 * ===================================================== */
router.get('/:id', controller.getTestResultById);
router.put('/:id', controller.updateTestResult);
router.delete('/:id', controller.softDeleteTestResult);

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *           example: "60f1b2b3e4b0c1d2e3f4g5h6"
 *         user_id:
 *           type: string
 *           description: User ID (same as _id)
 *           example: "60f1b2b3e4b0c1d2e3f4g5h6"
 *         full_name:
 *           type: string
 *           description: User's full name
 *           example: "Nguyễn Văn A"
 *         email:
 *           type: string
 *           description: User's email (partially hidden for privacy)
 *           example: "nguyenvana@gmail.com"
 *         avatar_url:
 *           type: string
 *           nullable: true
 *           description: User's avatar URL
 *           example: "https://example.com/avatar.jpg"
 *         rank:
 *           type: integer
 *           description: User's rank in leaderboard
 *           example: 1
 *         total_tests:
 *           type: integer
 *           description: Total number of tests completed
 *           example: 15
 *         total_questions:
 *           type: integer
 *           description: Total number of questions answered
 *           example: 150
 *         total_correct:
 *           type: integer
 *           description: Total number of correct answers
 *           example: 135
 *         average_percentage:
 *           type: number
 *           format: float
 *           description: Average percentage score
 *           example: 90.5
 *         best_percentage:
 *           type: number
 *           format: float
 *           description: Best percentage score achieved
 *           example: 98.0
 *         accuracy_rate:
 *           type: number
 *           format: float
 *           description: Overall accuracy rate
 *           example: 90.0
 *         composite_score:
 *           type: number
 *           format: float
 *           description: Composite score used for ranking
 *           example: 12150.75
 *         total_duration_ms:
 *           type: integer
 *           description: Total time spent on tests (milliseconds)
 *           example: 450000
 */

/* =====================================================
 * EXPORT
 * ===================================================== */
module.exports = router;
