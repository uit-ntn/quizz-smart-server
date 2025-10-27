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

// Tất cả endpoint dưới đây yêu cầu đăng nhập
router.use(authMiddleware);

// Lấy tất cả (admin thấy all; user chỉ thấy của mình) + hỗ trợ filters: test_id, user_id, status
router.get('/', testResultController.getAllTestResults);

// Kết quả của tôi
router.get('/my-results', testResultController.getMyTestResults);

// Thống kê của tôi
router.get('/my-statistics', testResultController.getMyStatistics);

// Kết quả theo test (admin: all; user: chỉ của mình)
router.get('/test/:testId', testResultController.getTestResultsByTest);

// Thống kê theo userId (admin only)
router.get('/user/:userId/statistics', authorize('admin'), testResultController.getUserStatistics);

// Lấy chi tiết theo ID (admin/owner)
router.get('/:id', testResultController.getTestResultById);

// Tạo mới result (submit)
router.post('/', testResultController.createTestResult);

// Cập nhật result (admin/owner)
router.put('/:id', testResultController.updateTestResult);

// Cập nhật status theo ID (admin)
router.patch('/:id/status', authorize('admin'), testResultController.updateStatusById);

// Cập nhật status theo testId (admin)
router.patch('/test/:testId/status', authorize('admin'), testResultController.updateStatusByTestId);

// Xoá mềm (admin/owner)
router.delete('/:id', testResultController.softDeleteTestResult);

// Xoá cứng (admin)
router.delete('/:id/hard-delete', authorize('admin'), testResultController.hardDeleteTestResult);

// Khôi phục (admin)
router.patch('/:id/restore', authorize('admin'), testResultController.restoreTestResult);

module.exports = router;
