const MultipleChoice = require('../models/MultipleChoice');
const Test = require('../models/Test');
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

/**
 * ✅ NEW: Check quyền xem TEST (ngăn leak câu hỏi test private)
 * - Admin: xem tất cả
 * - Guest: chỉ public + active
 * - User: public hoặc test của mình
 */
const ensureCanAccessTest = async (testId, userId = null, userRole = null) => {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId)) {
        throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }

    const test = await Test.findById(testId).select('visibility status created_by');
    if (!test) {
        throw new ServiceError('Test not found', 404, 'NOT_FOUND');
    }

    // Admin sees all
    if (userRole === 'admin') return test;

    // Guest: only public + active
    if (!userId) {
        if (test.visibility !== 'public' || test.status !== 'active') {
            throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
        }
        return test;
    }

    // Logged in: public OR own test
    if (
        test.visibility === 'public' ||
        test.created_by?.toString() === userId.toString()
    ) {
        return test;
    }

    throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
};

// Create new multiple choice question
const createMultipleChoice = async (questionData) => {
    try {
        // Validate required fields
        if (!questionData.question_text || !questionData.options || !questionData.correct_answers) {
            throw new ServiceError('Missing required fields: question_text, options, and correct_answers are required', 400, 'VALIDATION_ERROR');
        }

        // Validate test_id if provided
        if (questionData.test_id && !mongoose.Types.ObjectId.isValid(questionData.test_id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate question_text is string
        if (typeof questionData.question_text !== 'string' || questionData.question_text.trim().length === 0) {
            throw new ServiceError('Question text must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        // Validate options is array and has at least 2 options
        if (!Array.isArray(questionData.options) || questionData.options.length < 2) {
            throw new ServiceError('Options must be an array with at least 2 choices', 400, 'VALIDATION_ERROR');
        }

        // Validate correct_answers is array and not empty
        if (!Array.isArray(questionData.correct_answers) || questionData.correct_answers.length === 0) {
            throw new ServiceError('Correct answers must be a non-empty array', 400, 'VALIDATION_ERROR');
        }

        const question = new MultipleChoice(questionData);
        return await question.save();
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
            throw new ServiceError('Multiple choice question with this combination already exists', 409, 'DUPLICATE_ERROR');
        }

        throw new ServiceError('Failed to create multiple choice question', 500, 'DATABASE_ERROR');
    }
};

// Get all multiple choice questions with optional filters
// ✅ FIX: nếu có test_id thì phải check quyền xem test trước
const getAllMultipleChoices = async (filters = {}, userId = null, userRole = null) => {
    try {
        // Validate filters if provided
        if (filters.test_id && !mongoose.Types.ObjectId.isValid(filters.test_id)) {
            throw new ServiceError('Invalid test ID in filters', 400, 'VALIDATION_ERROR');
        }

        // ✅ NEW: nếu filter theo test_id -> check quyền access test
        if (filters.test_id) {
            await ensureCanAccessTest(filters.test_id, userId, userRole);
        }

        let query = {
            ...filters
        };

        return await MultipleChoice.find(query)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid filter parameters provided', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch multiple choice questions', 500, 'DATABASE_ERROR');
    }
};

// Get all multiple choice questions by test ID
// ✅ FIX: check quyền truy cập test trước khi trả danh sách câu hỏi
const getAllMultipleChoicesByTestId = async (testId, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        // ✅ NEW: check quyền access test
        await ensureCanAccessTest(testId, userId, userRole);

        let query = {
            test_id: new mongoose.Types.ObjectId(testId)
        };

        return await MultipleChoice.find(query)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch multiple choice questions by test ID', 500, 'DATABASE_ERROR');
    }
};

// Get multiple choice question by ID
// ✅ FIX: check quyền truy cập test_id của question để tránh đoán id xem lén
const getMultipleChoiceById = async (id, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }

        const question = await MultipleChoice.findById(id)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');

        if (!question) {
            throw new ServiceError('Multiple choice question not found', 404, 'NOT_FOUND');
        }

        // ✅ NEW: check quyền access test của câu hỏi
        if (question.test_id) {
            await ensureCanAccessTest(question.test_id, userId, userRole);
        }

        return question;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to fetch multiple choice question', 500, 'DATABASE_ERROR');
    }
};

// Update multiple choice question
const updateMultipleChoice = async (id, updateData) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate update data
        if (updateData.question_text !== undefined) {
            if (typeof updateData.question_text !== 'string' || updateData.question_text.trim().length === 0) {
                throw new ServiceError('Question text must be a non-empty string', 400, 'VALIDATION_ERROR');
            }
        }

        if (updateData.options !== undefined) {
            if (!Array.isArray(updateData.options) || updateData.options.length < 2) {
                throw new ServiceError('Options must be an array with at least 2 choices', 400, 'VALIDATION_ERROR');
            }
        }

        if (updateData.correct_answers !== undefined) {
            if (!Array.isArray(updateData.correct_answers) || updateData.correct_answers.length === 0) {
                throw new ServiceError('Correct answers must be a non-empty array', 400, 'VALIDATION_ERROR');
            }
        }

        if (updateData.test_id && !mongoose.Types.ObjectId.isValid(updateData.test_id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        const updatedQuestion = await MultipleChoice.findByIdAndUpdate(
            id,
            { ...updateData, updated_at: new Date() },
            { new: true, runValidators: true }
        ).populate('created_by', 'username full_name')
         .populate('updated_by', 'username full_name');

        if (!updatedQuestion) {
            throw new ServiceError('Multiple choice question not found', 404, 'NOT_FOUND');
        }

        return updatedQuestion;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to update multiple choice question', 500, 'DATABASE_ERROR');
    }
};

// Delete multiple choice question
const deleteMultipleChoice = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }

        const deletedQuestion = await MultipleChoice.findByIdAndDelete(id);

        if (!deletedQuestion) {
            throw new ServiceError('Multiple choice question not found', 404, 'NOT_FOUND');
        }

        return deletedQuestion;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }

        if (error.name === 'CastError') {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }

        throw new ServiceError('Failed to delete multiple choice question', 500, 'DATABASE_ERROR');
    }
};

module.exports = {
    ServiceError,
    createMultipleChoice,
    getAllMultipleChoices,
    getMultipleChoiceById,
    updateMultipleChoice,
    deleteMultipleChoice,
    getAllMultipleChoicesByTestId
};
