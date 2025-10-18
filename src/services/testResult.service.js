const TestResult = require('../models/TestResult');

// Create new test result
const createTestResult = async (resultData) => {
    const result = new TestResult(resultData);
    return await result.save();
};

// Get all test results with optional filters
const getAllTestResults = async (filters = {}) => {
    const query = { ...filters };
    return await TestResult.find(query)
        .populate('test_id', 'test_title main_topic sub_topic')
        .populate('user_id', 'email full_name');
};

// Get test result by ID
const getTestResultById = async (id) => {
    return await TestResult.findById(id)
        .populate('test_id', 'test_title main_topic sub_topic')
        .populate('user_id', 'email full_name');
};

// Get test results by user
const getTestResultsByUser = async (userId) => {
    return await TestResult.find({ user_id: userId })
        .populate('test_id', 'test_title main_topic sub_topic')
        .sort({ created_at: -1 });
};

// Get test results by test
const getTestResultsByTest = async (testId) => {
    return await TestResult.find({ test_id: testId })
        .populate('user_id', 'email full_name')
        .sort({ created_at: -1 });
};

// Get user statistics
const getUserStatistics = async (userId) => {
    const results = await TestResult.find({ user_id: userId });
    
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

// Delete test result
const deleteTestResult = async (id) => {
    return await TestResult.findByIdAndDelete(id);
};

module.exports = {
    createTestResult,
    getAllTestResults,
    getTestResultById,
    getTestResultsByUser,
    getTestResultsByTest,
    getUserStatistics,
    deleteTestResult
};
