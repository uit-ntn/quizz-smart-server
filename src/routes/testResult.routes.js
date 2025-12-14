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
 * READ / UPDATE / SOFT DELETE
 * ===================================================== */
router.get('/:id', controller.getTestResultById);
router.put('/:id', controller.updateTestResult);
router.delete('/:id', controller.softDeleteTestResult);

/* =====================================================
 * EXPORT
 * ===================================================== */
module.exports = router;
