const testResultService = require('../services/testResult.service');

// Chuẩn hoá trả lỗi từ service
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

// Tạo mới test result (submit)
const createTestResult = async (req, res) => {
  try {
    const result = await testResultService.createTestResult({
      ...req.body,
      user_id: req.user._id,
      ip_address: req.ip,
      device_info: req.get('User-Agent'),
    });
    return res.status(201).json({
      success: true,
      message: 'Test result created successfully',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Lấy tất cả (admin thấy tất cả; user chỉ thấy của mình)
const getAllTestResults = async (req, res) => {
  try {
    const filters = {};
    if (req.query.test_id) filters.test_id = req.query.test_id;
    if (req.query.user_id) filters.user_id = req.query.user_id;
    if (req.query.status) filters.status = req.query.status;

    const results = await testResultService.getAllTestResults(
      filters,
      req.user._id,
      req.user.role
    );
    return res.json({
      success: true,
      message: 'Test results fetched successfully',
      count: results.length,
      results,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Lấy theo ID (admin/owner)
const getTestResultById = async (req, res) => {
  try {
    const result = await testResultService.getTestResultById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    return res.json({
      success: true,
      message: 'Test result fetched successfully',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Update (admin/owner)
const updateTestResult = async (req, res) => {
  try {
    const updated = await testResultService.updateTestResult(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );
    return res.json({
      success: true,
      message: 'Test result updated successfully',
      result: updated,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Update status theo ID (admin)
const updateStatusById = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await testResultService.updateStatusById(
      req.params.id,
      status
    );
    return res.json({
      success: true,
      message: 'Status updated successfully',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Update status theo testId (admin)
const updateStatusByTestId = async (req, res) => {
  try {
    const { status } = req.body;
    const outcome = await testResultService.updateStatusByTestId(
      req.params.testId,
      status
    );
    return res.json({
      success: true,
      message: 'Statuses updated successfully',
      modifiedCount: outcome.modifiedCount,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Lấy results của tôi
const getMyTestResults = async (req, res) => {
  try {
    const results = await testResultService.getTestResultsByUser(req.user._id);
    return res.json({
      success: true,
      message: 'My test results fetched successfully',
      results,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Lấy results theo test (admin thấy all; user chỉ thấy của mình)
const getTestResultsByTest = async (req, res) => {
  try {
    const results = await testResultService.getTestResultsByTest(
      req.params.testId,
      req.user._id,
      req.user.role
    );
    return res.json({
      success: true,
      message: 'Test results by test fetched successfully',
      results,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Thống kê của tôi
const getMyStatistics = async (req, res) => {
  try {
    const statistics = await testResultService.getUserStatistics(req.user._id);
    return res.json({
      success: true,
      message: 'My statistics fetched successfully',
      statistics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Thống kê theo userId (admin)
const getUserStatistics = async (req, res) => {
  try {
    const statistics = await testResultService.getUserStatistics(
      req.params.userId
    );
    return res.json({
      success: true,
      message: 'User statistics fetched successfully',
      statistics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Soft delete (admin/owner)
const softDeleteTestResult = async (req, res) => {
  try {
    const result = await testResultService.softDeleteTestResult(
      req.params.id,
      req.user._id,
      req.user.role
    );
    return res.json({
      success: true,
      message: 'Test result deleted successfully',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Hard delete (admin)
const hardDeleteTestResult = async (req, res) => {
  try {
    const result = await testResultService.hardDeleteTestResult(req.params.id);
    return res.json({
      success: true,
      message: 'Test result permanently deleted',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Restore (admin)
const restoreTestResult = async (req, res) => {
  try {
    const result = await testResultService.restoreTestResult(req.params.id);
    return res.json({
      success: true,
      message: 'Test result restored successfully',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

module.exports = {
  createTestResult,
  getAllTestResults,
  getTestResultById,
  updateTestResult,
  updateStatusById,
  updateStatusByTestId,
  getMyTestResults,
  getTestResultsByTest,
  getMyStatistics,
  getUserStatistics,
  softDeleteTestResult,
  hardDeleteTestResult,
  restoreTestResult,
};
