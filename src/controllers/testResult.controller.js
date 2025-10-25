const testResultService = require('../services/testResult.service');

// Helper function to handle service errors
function handleServiceError(error, res) {
    if (error.name === 'ServiceError') {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            type: error.type
        });
    }
    
    // Default error handling
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        type: 'INTERNAL_ERROR'
    });
}

// Tạo mới test result (submit test)
const createTestResult = async (req, res) => {
    try {
        const result = await testResultService.createTestResult({
            ...req.body,
            user_id: req.user._id,
            ip_address: req.ip,
            device_info: req.get('User-Agent')
        });
        res.status(201).json({
            success: true,
            result
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Lấy tất cả test results (admin thấy tất cả, user chỉ thấy của mình)
const getAllTestResults = async (req, res) => {
    try {
        const filters = {};
        if (req.query.test_id) filters.test_id = req.query.test_id;
        if (req.query.user_id) filters.user_id = req.query.user_id;
        if (req.query.status) filters.status = req.query.status;

        const results = await testResultService.getAllTestResults(filters, req.user._id, req.user.role);
        res.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Cập nhật test result (admin hoặc owner)
const updateTestResult = async (req, res) => {
    try {
        const updatedResult = await testResultService.updateTestResult(
            req.params.id, 
            req.body, 
            req.user._id, 
            req.user.role
        );
        
        res.json({
            success: true,
            result: updatedResult
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Cập nhật status theo ID (admin only)
const updateStatusById = async (req, res) => {
    try {
        const { status } = req.body;
        
        const result = await testResultService.updateStatusById(req.params.id, status);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Cập nhật status theo test ID (admin only)
const updateStatusByTestId = async (req, res) => {
    try {
        const { status } = req.body;

        const result = await testResultService.updateStatusByTestId(req.params.testId, status);
        res.json({
            success: true,
            message: 'Test results status updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Lấy test result theo ID (admin hoặc owner)
const getTestResultById = async (req, res) => {
    try {
        const result = await testResultService.getTestResultById(
            req.params.id, 
            req.user._id, 
            req.user.role
        );
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Lấy test results của tôi
const getMyTestResults = async (req, res) => {
    try {
        const results = await testResultService.getTestResultsByUser(req.user._id);
        res.json({
            success: true,
            results
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Lấy test results theo test (admin hoặc creator của test)
const getTestResultsByTest = async (req, res) => {
    try {
        const results = await testResultService.getTestResultsByTest(
            req.params.testId, 
            req.user._id, 
            req.user.role
        );
        res.json({
            success: true,
            results
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Lấy thống kê của tôi
const getMyStatistics = async (req, res) => {
    try {
        const stats = await testResultService.getUserStatistics(req.user._id);
        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Lấy thống kê user (admin only)
const getUserStatistics = async (req, res) => {
    try {
        const stats = await testResultService.getUserStatistics(req.params.userId);
        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Xóa mềm test result (admin hoặc owner)
const softDeleteTestResult = async (req, res) => {
    try {
        const result = await testResultService.softDeleteTestResult(
            req.params.id, 
            req.user._id, 
            req.user.role
        );
        
        res.json({ 
            success: true,
            message: 'Test result deleted successfully',
            result
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Xóa cứng test result (admin only)
const hardDeleteTestResult = async (req, res) => {
    try {
        const result = await testResultService.hardDeleteTestResult(req.params.id);
        
        res.json({ 
            success: true,
            message: 'Test result permanently deleted',
            result
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Khôi phục test result đã xóa (admin only)
const restoreTestResult = async (req, res) => {
    try {
        const result = await testResultService.restoreTestResult(req.params.id);
        
        res.json({
            success: true,
            message: 'Test result restored successfully',
            result
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

module.exports = {
    createTestResult,
    getAllTestResults,
    updateTestResult,
    updateStatusById,
    updateStatusByTestId,
    getTestResultById,
    getMyTestResults,
    getTestResultsByTest,
    getMyStatistics,
    getUserStatistics,
    softDeleteTestResult,
    hardDeleteTestResult,
    restoreTestResult
};
