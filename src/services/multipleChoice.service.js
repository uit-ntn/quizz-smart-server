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

        // Validate correct_answers is Map/Object or Array and not empty
        if (!questionData.correct_answers || 
            (typeof questionData.correct_answers !== 'object') ||
            (Array.isArray(questionData.correct_answers) && questionData.correct_answers.length === 0) ||
            (!Array.isArray(questionData.correct_answers) && Object.keys(questionData.correct_answers).length === 0)) {
            throw new ServiceError('Correct answers must be a non-empty object or array', 400, 'VALIDATION_ERROR');
        }
        
        // Convert array to Map if needed for backward compatibility
        if (Array.isArray(questionData.correct_answers)) {
            const correctMap = new Map();
            questionData.correct_answers.forEach(label => {
                correctMap.set(label, '');
            });
            questionData.correct_answers = correctMap;
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
            if (!updateData.correct_answers || 
                (typeof updateData.correct_answers !== 'object') ||
                (Array.isArray(updateData.correct_answers) && updateData.correct_answers.length === 0) ||
                (!Array.isArray(updateData.correct_answers) && Object.keys(updateData.correct_answers).length === 0)) {
                throw new ServiceError('Correct answers must be a non-empty object or array', 400, 'VALIDATION_ERROR');
            }
            
            // Convert array to Map if needed for backward compatibility
            if (Array.isArray(updateData.correct_answers)) {
                const correctMap = new Map();
                updateData.correct_answers.forEach(label => {
                    correctMap.set(label, '');
                });
                updateData.correct_answers = correctMap;
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

// Move question to another multiple_choice test
const moveMultipleChoiceQuestion = async (questionId, targetTestId, userId = null, userRole = null) => {
    const session = await mongoose.startSession();
    try {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            throw new ServiceError('Invalid multiple choice question ID format', 400, 'VALIDATION_ERROR');
        }
        if (!mongoose.Types.ObjectId.isValid(targetTestId)) {
            throw new ServiceError('Invalid target test ID format', 400, 'VALIDATION_ERROR');
        }

        session.startTransaction();

        const question = await MultipleChoice.findById(questionId).session(session);
        if (!question) {
            throw new ServiceError('Multiple choice question not found', 404, 'NOT_FOUND');
        }

        const sourceTestId = question.test_id ? question.test_id.toString() : null;

        // Permission: admin or creator of the question
        if (userRole !== 'admin') {
            if (!userId || question.created_by?.toString() !== userId.toString()) {
                throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
            }
        }

        // Validate target test
        const targetTest = await Test.findById(targetTestId).session(session);
        if (!targetTest || targetTest.status === 'deleted') {
            throw new ServiceError('Target test not found', 404, 'NOT_FOUND');
        }
        if (targetTest.test_type !== 'multiple_choice') {
            throw new ServiceError('Target test must be a multiple_choice test', 400, 'VALIDATION_ERROR');
        }
        if (userRole !== 'admin' && targetTest.created_by?.toString() !== userId?.toString()) {
            throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
        }

        // Optional: ensure user also owns source test if exists
        if (sourceTestId && userRole !== 'admin') {
            const sourceTest = await Test.findById(sourceTestId).session(session);
            if (sourceTest && sourceTest.created_by?.toString() !== userId?.toString()) {
                throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
            }
        }

        const now = new Date();
        question.test_id = targetTest._id;
        if (userId) question.updated_by = userId;
        question.updated_at = now;
        await question.save({ session });

        const targetTotal = await MultipleChoice.countDocuments({ test_id: targetTest._id }).session(session);
        const targetUpdate = { total_questions: targetTotal, updated_at: now };
        if (userId) targetUpdate.updated_by = userId;
        await Test.findByIdAndUpdate(targetTest._id, { $set: targetUpdate }, { session });

        let sourceTotal = null;
        if (sourceTestId && sourceTestId !== targetTestId) {
            sourceTotal = await MultipleChoice.countDocuments({ test_id: sourceTestId }).session(session);
            const sourceUpdate = { total_questions: sourceTotal, updated_at: now };
            if (userId) sourceUpdate.updated_by = userId;
            await Test.findByIdAndUpdate(sourceTestId, { $set: sourceUpdate }, { session });
        }

        await session.commitTransaction();

        return {
            message: 'Question moved successfully',
            question,
            source_test_id: sourceTestId,
            target_test_id: targetTest._id,
            target_total_questions: targetTotal,
            ...(sourceTotal !== null ? { source_total_questions: sourceTotal } : {}),
        };
    } catch (error) {
        await session.abortTransaction();
        if (error instanceof ServiceError) {
            throw error;
        }
        throw new ServiceError('Failed to move multiple choice question', 500, 'DATABASE_ERROR');
    } finally {
        session.endSession();
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
    moveMultipleChoiceQuestion,
    deleteMultipleChoice,
    getAllMultipleChoicesByTestId
};
