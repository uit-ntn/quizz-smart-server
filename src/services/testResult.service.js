const TestResult = require('../models/TestResult');

// Create new test result
const createTestResult = async (resultData) => {
    const result = new TestResult({
        ...resultData,
        status: 'active'
    });
    return await result.save();
};

// Get all test results with optional filters (active only by default)
const getAllTestResults = async (filters = {}) => {
    const query = { 
        status: { $ne: 'deleted' },
        ...filters 
    };
    return await TestResult.find(query)
        .populate('test_id', 'test_title main_topic sub_topic')
        .populate('user_id', 'email full_name')
        .sort({ created_at: -1 });
};

// Get test result by ID (active only)
const getTestResultById = async (id) => {
    return await TestResult.findOne({ 
        _id: id, 
        status: { $ne: 'deleted' } 
    })
        .populate('test_id', 'test_title main_topic sub_topic')
        .populate('user_id', 'email full_name');
};

// Update test result
const updateTestResult = async (id, updateData) => {
    return await TestResult.findOneAndUpdate(
        { _id: id, status: { $ne: 'deleted' } },
        { 
            ...updateData,
            updated_at: new Date()
        },
        { new: true }
    )
        .populate('test_id', 'test_title main_topic sub_topic')
        .populate('user_id', 'email full_name');
};

// Update status by test result ID
const updateStatusById = async (id, status) => {
    return await TestResult.findOneAndUpdate(
        { _id: id, status: { $ne: 'deleted' } },
        { 
            status,
            updated_at: new Date()
        },
        { new: true }
    );
};

// Update status by test ID (for all test results of a test)
const updateStatusByTestId = async (testId, status) => {
    return await TestResult.updateMany(
        { test_id: testId, status: { $ne: 'deleted' } },
        { 
            status,
            updated_at: new Date()
        }
    );
};

// Get test results by user (active only)
const getTestResultsByUser = async (userId) => {
    return await TestResult.find({ 
        user_id: userId, 
        status: { $ne: 'deleted' } 
    })
        .populate('test_id', 'test_title main_topic sub_topic')
        .sort({ created_at: -1 });
};

// Get test results by test (active only)
const getTestResultsByTest = async (testId) => {
    return await TestResult.find({ 
        test_id: testId, 
        status: { $ne: 'deleted' } 
    })
        .populate('user_id', 'email full_name')
        .sort({ created_at: -1 });
};

// Get user statistics (active only)
const getUserStatistics = async (userId) => {
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
    const totalQuestions = results.reduce((sum, r) => sum + r.total_questions, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.correct_count, 0);
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalTests;

    return {
        total_tests: totalTests,
        average_score: Math.round(averageScore * 100) / 100,
        total_questions: totalQuestions,
        total_correct: totalCorrect
    };
};

// Soft delete test result
const softDeleteTestResult = async (id) => {
    const result = await TestResult.findOne({ 
        _id: id, 
        status: { $ne: 'deleted' } 
    });
    
    if (!result) {
        return null;
    }
    
    return await result.softDelete();
};

// Hard delete test result (admin only)
const hardDeleteTestResult = async (id) => {
    return await TestResult.findByIdAndDelete(id);
};

// Restore deleted test result
const restoreTestResult = async (id) => {
    return await TestResult.findOneAndUpdate(
        { _id: id, status: 'deleted' },
        { 
            status: 'active',
            deleted_at: null,
            updated_at: new Date()
        },
        { new: true }
    );
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
