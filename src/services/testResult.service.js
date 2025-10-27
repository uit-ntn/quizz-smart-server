const TestResult = require('../models/TestResult');
const mongoose = require('mongoose');

// Custom error class for service errors
class ServiceError extends Error {
    constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.name = 'ServiceError';
    }
}

// Tạo mới test result
const createTestResult = async (resultData) => {
    try {
        // Validate required fields
        if (!resultData.test_id || !resultData.user_id) {
            throw new ServiceError('Missing required fields: test_id and user_id are required', 400, 'VALIDATION_ERROR');
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(resultData.test_id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        if (!mongoose.Types.ObjectId.isValid(resultData.user_id)) {
            throw new ServiceError('Invalid user ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate score data
        if (resultData.total_questions !== undefined && resultData.total_questions <= 0) {
            throw new ServiceError('Total questions must be greater than 0', 400, 'VALIDATION_ERROR');
        }

        if (resultData.correct_count !== undefined && resultData.correct_count < 0) {
            throw new ServiceError('Correct count cannot be negative', 400, 'VALIDATION_ERROR');
        }

        if (resultData.percentage !== undefined && (resultData.percentage < 0 || resultData.percentage > 100)) {
            throw new ServiceError('Percentage must be between 0 and 100', 400, 'VALIDATION_ERROR');
        }

        const result = new TestResult({
            ...resultData,
            status: 'active'
        });

        return await result.save();
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }

        // Handle mongoose duplicate key error
        if (error.code === 11000) {
            throw new ServiceError('Test result already exists for this combination', 409, 'DUPLICATE_ERROR');
        }

        throw new ServiceError('Failed to create test result', 500, 'DATABASE_ERROR');
    }
};

// Lấy tất cả test results admin thấy tất cả (kể cả xoá mềm), user chỉ thấy của mình (không bao gồm xoá mềm)
const getAllTestResults = async (filters = {}, userId = null, userRole = null) => {
    try {
        // Validate filters if provided
        if (filters.test_id && !mongoose.Types.ObjectId.isValid(filters.test_id)) {
            throw new ServiceError('Invalid test ID in filters', 400, 'VALIDATION_ERROR');
        }
        
        if (filters.user_id && !mongoose.Types.ObjectId.isValid(filters.user_id)) {
            throw new ServiceError('Invalid user ID in filters', 400, 'VALIDATION_ERROR');
        }

        let query = {};
        
        // Apply additional filters first
        if (filters.test_id) query.test_id = filters.test_id;
        if (filters.user_id) query.user_id = filters.user_id;
        
        // Handle status filter với admin/user permissions
        if (filters.status) {
            // Nếu có filter status cụ thể
            if (userRole === 'admin') {
                query.status = filters.status; // Admin có thể filter bất kỳ status nào
            } else {
                // User chỉ có thể filter active, không thể filter deleted
                if (filters.status === 'deleted') {
                    throw new ServiceError('Access denied: Cannot filter deleted records', 403, 'ACCESS_DENIED');
                }
                query.status = filters.status;
            }
        } else {
            // Nếu không có filter status, apply default logic
            if (userRole === 'admin') {
                query.status = { $in: ['draft', 'active', 'deleted'] }; // Admin thấy tất cả
            } else {
                query.status = { $ne: 'deleted' }; // User không thấy deleted
            }
        }

        // Nếu không phải admin, chỉ thấy test results của mình
        if (userRole !== 'admin' && userId) {
            // Nếu user filter by user_id khác với userId của họ, không cho phép
            if (filters.user_id && filters.user_id.toString() !== userId.toString()) {
                throw new ServiceError('Access denied: Cannot view other users\' test results', 403, 'ACCESS_DENIED');
            }
            query.user_id = userId;
        }

        const testResults = await TestResult.find(query)
            .populate('test_id', 'test_title main_topic sub_topic')
            .populate('user_id', 'email full_name')
            .sort({ created_at: -1 });

        return testResults; // Return array directly for consistency
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid filter parameters provided', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch test results', 500, 'DATABASE_ERROR');
    }
};

// Lấy test result theo ID (admin hoặc owner)
const getTestResultById = async (id, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        let query = {
            _id: id,
            status: { $ne: 'deleted' }
        };

        // Nếu không phải admin, chỉ thấy test results của mình
        if (userRole !== 'admin' && userId) {
            query.user_id = userId;
        }

        const result = await TestResult.findOne(query)
            .populate('test_id', 'test_title main_topic sub_topic')
            .populate('user_id', 'email full_name');

        if (!result) {
            throw new ServiceError('Test result not found or access denied', 404, 'NOT_FOUND');
        }

        return result;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch test result', 500, 'DATABASE_ERROR');
    }
};

// Cập nhật test result
const updateTestResult = async (id, updateData, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate update data
        if (updateData.total_questions !== undefined && updateData.total_questions <= 0) {
            throw new ServiceError('Total questions must be greater than 0', 400, 'VALIDATION_ERROR');
        }

        if (updateData.correct_count !== undefined && updateData.correct_count < 0) {
            throw new ServiceError('Correct count cannot be negative', 400, 'VALIDATION_ERROR');
        }

        if (updateData.percentage !== undefined && (updateData.percentage < 0 || updateData.percentage > 100)) {
            throw new ServiceError('Percentage must be between 0 and 100', 400, 'VALIDATION_ERROR');
        }

        let query = {
            _id: id,
            status: { $ne: 'deleted' }
        };

        // Nếu không phải admin, chỉ update test results của mình
        if (userRole !== 'admin' && userId) {
            query.user_id = userId;
        }

        const updatedResult = await TestResult.findOneAndUpdate(
            query,
            {
                ...updateData,
                updated_at: new Date()
            },
            { new: true, runValidators: true }
        )
            .populate('test_id', 'test_title main_topic sub_topic')
            .populate('user_id', 'email full_name');

        if (!updatedResult) {
            throw new ServiceError('Test result not found or access denied', 404, 'NOT_FOUND');
        }

        return updatedResult;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to update test result', 500, 'DATABASE_ERROR');
    }
};

// Cập nhật status theo test result ID (admin only)
const updateStatusById = async (id, status) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate status
        const validStatuses = ['draft', 'active', 'deleted'];
        if (!validStatuses.includes(status)) {
            throw new ServiceError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'VALIDATION_ERROR');
        }

        const updatedResult = await TestResult.findOneAndUpdate(
            { _id: id, status: { $ne: 'deleted' } },
            {
                status,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!updatedResult) {
            throw new ServiceError('Test result not found', 404, 'NOT_FOUND');
        }

        return updatedResult;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to update test result status', 500, 'DATABASE_ERROR');
    }
};

// Cập nhật status theo test ID (admin only - áp dụng cho tất cả test results của test đó)
const updateStatusByTestId = async (testId, status) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate status
        const validStatuses = ['draft', 'active', 'deleted'];
        if (!validStatuses.includes(status)) {
            throw new ServiceError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'VALIDATION_ERROR');
        }

        const result = await TestResult.updateMany(
            { test_id: testId, status: { $ne: 'deleted' } },
            {
                status,
                updated_at: new Date()
            }
        );

        return result;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to update test results status by test ID', 500, 'DATABASE_ERROR');
    }
};

// Lấy test results theo user (active only)
const getTestResultsByUser = async (userId) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ServiceError('Invalid user ID format', 400, 'VALIDATION_ERROR');
        }

        return await TestResult.find({
            user_id: userId,
            status: { $ne: 'deleted' }
        })
            .populate('test_id', 'test_title main_topic sub_topic')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid user ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch test results by user', 500, 'DATABASE_ERROR');
    }
};

// Lấy test results theo test (admin hoặc creator của test)
const getTestResultsByTest = async (testId, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        let query = {
            test_id: testId,
            status: { $ne: 'deleted' }
        };

        // Nếu không phải admin, chỉ thấy test results của mình
        if (userRole !== 'admin' && userId) {
            query.user_id = userId;
        }

        return await TestResult.find(query)
            .populate('user_id', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch test results by test', 500, 'DATABASE_ERROR');
    }
};

// Lấy thống kê user (active only)
const getUserStatistics = async (userId) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ServiceError('Invalid user ID format', 400, 'VALIDATION_ERROR');
        }

        const results = await TestResult.find({
            user_id: userId,
            status: { $ne: 'deleted' }
        });

        if (results.length === 0) {
            return {
                total_tests: 0,
                average_score: 0,
                total_questions: 0,
                total_correct: 0
            };
        }

        const totalTests = results.length;
        const totalQuestions = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);
        const totalCorrect = results.reduce((sum, r) => sum + (r.correct_count || 0), 0);
        const averageScore = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalTests;

        return {
            total_tests: totalTests,
            average_score: Math.round(averageScore * 100) / 100,
            total_questions: totalQuestions,
            total_correct: totalCorrect
        };
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid user ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch user statistics', 500, 'DATABASE_ERROR');
    }
};

// Xóa mềm test result
const softDeleteTestResult = async (id, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        let query = {
            _id: id,
            status: { $ne: 'deleted' }
        };

        // Nếu không phải admin, chỉ xóa test results của mình
        if (userRole !== 'admin' && userId) {
            query.user_id = userId;
        }

        const result = await TestResult.findOneAndUpdate(
            query,
            {
                status: 'deleted',
                deleted_at: new Date(),
                updated_at: new Date()
            },
            { new: true }
        );

        if (!result) {
            throw new ServiceError('Test result not found or access denied', 404, 'NOT_FOUND');
        }

        return result;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to delete test result', 500, 'DATABASE_ERROR');
    }
};

// Xóa cứng test result (admin only)
const hardDeleteTestResult = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        const deletedResult = await TestResult.findByIdAndDelete(id);

        if (!deletedResult) {
            throw new ServiceError('Test result not found', 404, 'NOT_FOUND');
        }

        return deletedResult;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to permanently delete test result', 500, 'DATABASE_ERROR');
    }
};

// Khôi phục test result đã xóa (admin only)
const restoreTestResult = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        const restoredResult = await TestResult.findOneAndUpdate(
            { _id: id, status: 'deleted' },
            {
                status: 'active',
                deleted_at: null,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!restoredResult) {
            throw new ServiceError('Deleted test result not found', 404, 'NOT_FOUND');
        }

        return restoredResult;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test result ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to restore test result', 500, 'DATABASE_ERROR');
    }
};

module.exports = {
    createTestResult,
    getAllTestResults,
    getTestResultById,
    updateTestResult,
    updateStatusById,
    updateStatusByTestId,
    getTestResultsByUser,
    getTestResultsByTest,
    getUserStatistics,
    softDeleteTestResult,
    hardDeleteTestResult,
    restoreTestResult
};
