// controllers/review.controller.js
const reviewService = require('../services/review.service');

/* =========================
   Helpers
========================= */

function handleServiceError(error, res) {
  if (error && error.name === 'ServiceError') {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      type: error.type,
    });
  }
  console.error('❌ Unexpected error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    type: 'INTERNAL_ERROR',
  });
}

const getUserCtx = (req) => ({
  userId: req.user?._id || null,
  userRole: req.user?.role || null,
});

const deny = (res) =>
  res.status(403).json({
    success: false,
    message: 'Access denied',
    type: 'ACCESS_DENIED',
  });

/* =========================
   Controllers
========================= */

/**
 * Tạo đánh giá mới
 * POST /api/reviews
 */
async function createReview(req, res) {
  try {
    const { userId } = getUserCtx(req);
    if (!userId) {
      return deny(res);
    }

    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required',
        type: 'MISSING_RATING',
      });
    }

    const review = await reviewService.createReview({
      user_id: userId,
      rating,
      comment: comment || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
}

/**
 * Cập nhật đánh giá (chỉ admin)
 * PUT /api/reviews/:id
 */
async function updateReview(req, res) {
  try {
    const { userId, userRole } = getUserCtx(req);
    if (!userId) {
      return deny(res);
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await reviewService.updateReview(id, userId, userRole, {
      rating,
      comment,
    });

    return res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
}

/**
 * Xóa đánh giá (chỉ admin)
 * DELETE /api/reviews/:id
 */
async function deleteReview(req, res) {
  try {
    const { userId, userRole } = getUserCtx(req);
    if (!userId) {
      return deny(res);
    }

    const { id } = req.params;

    const review = await reviewService.deleteReview(id, userId, userRole);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      data: review,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
}

/**
 * Lấy đánh giá của user hiện tại
 * GET /api/reviews/my-review
 */
async function getMyReview(req, res) {
  try {
    const { userId } = getUserCtx(req);
    if (!userId) {
      return deny(res);
    }

    const review = await reviewService.getReviewByUserId(userId);

    return res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
}

/**
 * Lấy danh sách đánh giá
 * GET /api/reviews
 */
async function getAllReviews(req, res) {
  try {
    const { limit, offset, sort_by, sort_order } = req.query;

    const result = await reviewService.getAllReviews({
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0,
      sort_by: sort_by || 'created_at',
      sort_order: sort_order || 'desc',
    });

    return res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        limit: parseInt(limit) || 10,
        offset: parseInt(offset) || 0,
      },
      statistics: {
        average_rating: result.average_rating,
        total_reviews: result.total_reviews,
      },
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
}

/**
 * Lấy thống kê đánh giá
 * GET /api/reviews/statistics
 */
async function getReviewStatistics(req, res) {
  try {
    const stats = await reviewService.getReviewStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
}

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getMyReview,
  getAllReviews,
  getReviewStatistics,
};

