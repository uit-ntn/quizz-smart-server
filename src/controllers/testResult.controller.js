const testResultService = require('../services/testResult.service');

// Create new test result (submit test)
const createTestResult = async (req, res) => {
    try {
        const result = await testResultService.createTestResult({
            ...req.body,
            user_id: req.user._id
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all test results (admin only)
const getAllTestResults = async (req, res) => {
    try {
        const filters = {};
        if (req.query.test_id) filters.test_id = req.query.test_id;
        if (req.query.user_id) filters.user_id = req.query.user_id;

        const results = await testResultService.getAllTestResults(filters);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get test result by ID
const getTestResultById = async (req, res) => {
    try {
        const result = await testResultService.getTestResultById(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Test result not found' });
        }
        
        // Check if user owns this result or is admin
        if (result.user_id._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get my test results
const getMyTestResults = async (req, res) => {
    try {
        const results = await testResultService.getTestResultsByUser(req.user._id);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get test results by test
const getTestResultsByTest = async (req, res) => {
    try {
        const results = await testResultService.getTestResultsByTest(req.params.testId);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get my statistics
const getMyStatistics = async (req, res) => {
    try {
        const stats = await testResultService.getUserStatistics(req.user._id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user statistics (admin only)
const getUserStatistics = async (req, res) => {
    try {
        const stats = await testResultService.getUserStatistics(req.params.userId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete test result
const deleteTestResult = async (req, res) => {
    try {
        const result = await testResultService.deleteTestResult(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Test result not found' });
        }
        res.json({ message: 'Test result deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTestResult,
    getAllTestResults,
    getTestResultById,
    getMyTestResults,
    getTestResultsByTest,
    getMyStatistics,
    getUserStatistics,
    deleteTestResult
};
