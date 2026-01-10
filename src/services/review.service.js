// services/review.service.js
const mongoose = require('mongoose');
const Review = require('../models/Review');

/** ServiceError chuẩn */
class ServiceError extends Error {
  constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.name = 'ServiceError';
  }
}

/**
 * Tạo đánh giá mới
 * @param {Object} data - { user_id, rating, comment }
 * @returns {Promise<Object>} Review document
 */
async function createReview(data) {
  try {
    const { user_id, rating, comment = '' } = data;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      throw new ServiceError('Invalid user_id', 400, 'INVALID_USER_ID');
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new ServiceError('Rating must be an integer between 1 and 5', 400, 'INVALID_RATING');
    }

    // User có thể tạo nhiều đánh giá, không giới hạn
    const review = await Review.create({
      user_id: new mongoose.Types.ObjectId(user_id),
      rating,
      comment: comment.trim(),
      status: 'active'
    });

    return await Review.findById(review._id).populate('user_id', 'full_name email avatar_url');
  } catch (error) {
    if (error.name === 'ServiceError') throw error;
    throw error;
  }
}

/**
 * Cập nhật đánh giá (chỉ admin)
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID (không dùng để check quyền, chỉ để log)
 * @param {string} userRole - User role (phải là 'admin')
 * @param {Object} data - { rating, comment }
 * @returns {Promise<Object>} Updated review
 */
async function updateReview(reviewId, userId, userRole, data) {
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new ServiceError('Invalid review ID', 400, 'INVALID_REVIEW_ID');
    }

    // Chỉ admin mới được sửa
    if (userRole !== 'admin') {
      throw new ServiceError('Only admin can update reviews', 403, 'ACCESS_DENIED');
    }

    const { rating, comment } = data;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ServiceError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new ServiceError('Rating must be an integer between 1 and 5', 400, 'INVALID_RATING');
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) {
      updateData.comment = comment.trim();
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user_id', 'full_name email avatar_url');

    return updatedReview;
  } catch (error) {
    if (error.name === 'ServiceError') throw error;
    throw error;
  }
}

/**
 * Xóa đánh giá (hard delete, chỉ admin)
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID (không dùng để check quyền, chỉ để log)
 * @param {string} userRole - User role (phải là 'admin')
 * @returns {Promise<Object>} Deleted review
 */
async function deleteReview(reviewId, userId, userRole) {
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new ServiceError('Invalid review ID', 400, 'INVALID_REVIEW_ID');
    }

    // Chỉ admin mới được xóa
    if (userRole !== 'admin') {
      throw new ServiceError('Only admin can delete reviews', 403, 'ACCESS_DENIED');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ServiceError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    // Hard delete - xóa thực sự khỏi database
    const deletedReview = await Review.findByIdAndDelete(reviewId).populate('user_id', 'full_name email avatar_url');
    
    if (!deletedReview) {
      throw new ServiceError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    return deletedReview;
  } catch (error) {
    if (error.name === 'ServiceError') throw error;
    throw error;
  }
}

/**
 * Lấy đánh giá của user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Review document
 */
async function getReviewByUserId(userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ServiceError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    const review = await Review.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      status: 'active'
    }).populate('user_id', 'full_name email avatar_url');

    return review;
  } catch (error) {
    if (error.name === 'ServiceError') throw error;
    throw error;
  }
}

/**
 * Lấy danh sách đánh giá
 * @param {Object} filters - { limit, offset, sort_by, sort_order }
 * @returns {Promise<Object>} { reviews, total, average_rating }
 */
async function getAllReviews(filters = {}) {
  try {
    const {
      limit = 10,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const query = { status: 'active' };
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user_id', 'full_name email avatar_url')
        .sort(sort)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean(),
      Review.countDocuments(query)
    ]);

    // Tính điểm trung bình
    const avgResult = await Review.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          average_rating: { $avg: '$rating' },
          total_reviews: { $sum: 1 }
        }
      }
    ]);

    const average_rating = avgResult.length > 0 
      ? Math.round(avgResult[0].average_rating * 10) / 10 
      : 0;
    const total_reviews = avgResult.length > 0 ? avgResult[0].total_reviews : 0;

    return {
      reviews,
      total,
      average_rating,
      total_reviews
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy thống kê đánh giá
 * @returns {Promise<Object>} Statistics
 */
async function getReviewStatistics() {
  try {
    const stats = await Review.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          average_rating: { $avg: '$rating' },
          total_reviews: { $sum: 1 },
          min_rating: { $min: '$rating' },
          max_rating: { $max: '$rating' },
          rating_distribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        min_rating: 0,
        max_rating: 0,
        rating_distribution: {}
      };
    }

    const result = stats[0];
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = result.rating_distribution.filter(r => r === i).length;
    }

    return {
      average_rating: Math.round(result.average_rating * 10) / 10,
      total_reviews: result.total_reviews,
      min_rating: result.min_rating,
      max_rating: result.max_rating,
      rating_distribution: distribution
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getReviewByUserId,
  getAllReviews,
  getReviewStatistics
};

