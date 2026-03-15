const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');

// ===== Public routes =====
// Lấy danh sách đánh giá (public)
router.get('/', optionalAuthMiddleware, reviewController.getAllReviews);

// Lấy thống kê đánh giá (public)
router.get('/statistics', optionalAuthMiddleware, reviewController.getReviewStatistics);

// ===== Authenticated routes =====
// Lấy đánh giá của user hiện tại
router.get('/my-review', authMiddleware, reviewController.getMyReview);

// Tạo đánh giá mới
router.post('/', authMiddleware, reviewController.createReview);

// Cập nhật đánh giá
router.put('/:id', authMiddleware, reviewController.updateReview);

// Xóa đánh giá
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;

