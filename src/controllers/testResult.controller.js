const testResultService = require('../services/testResult.service');

/* =====================================================
 * ERROR HANDLER
 * ===================================================== */
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

/* =====================================================
 * CREATE
 * ===================================================== */
const createTestResult = async (req, res) => {
  try {
    const result = await testResultService.createTestResult(
      {
        ...req.body,
        user_id: req.user._id,
        ip_address: req.ip,
        device_info: req.get('User-Agent'),
      },
      req.user.role // Truyền role để kiểm tra quyền tạo với status 'active'
    );

    return res.status(201).json({
      success: true,
      message: 'Test result created successfully',
      result,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

/* =====================================================
 * GET ALL (ADMIN / OWNER)
 * ===================================================== */
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

/* =====================================================
 * GET MY TEST RESULTS (ACTIVE ONLY)
 * ===================================================== */
const getMyTestResults = async (req, res) => {
  try {
    const filters = {};
    if (req.query.test_id) filters.test_id = req.query.test_id;

    const results = await testResultService.getMyTestResults(
      req.user._id,
      filters
    );

    return res.json({
      success: true,
      message: 'My test results fetched successfully',
      count: results.length,
      results,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

/* =====================================================
 * GET BY ID
 * ===================================================== */
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

/* =====================================================
 * UPDATE (NON-CRITICAL FIELDS)
 * ===================================================== */
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

/* =====================================================
 * UPDATE STATUS
 * ===================================================== */
const updateStatusById = async (req, res) => {
  try {
    const { status } = req.body;

    const result = await testResultService.updateStatusById(
      req.params.id,
      status,
      req.user._id,
      req.user.role
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

/* =====================================================
 * USER STATISTICS
 * ===================================================== */
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

const getUserStatistics = async (req, res) => {
  try {
    const statistics = await testResultService.getUserStatistics(req.params.userId);

    return res.json({
      success: true,
      message: 'User statistics fetched successfully',
      statistics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

/* =====================================================
 * DELETE / RESTORE
 * ===================================================== */
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

/* =====================================================
 * EXPORT
 * ===================================================== */
module.exports = {
  createTestResult,
  getAllTestResults,
  getMyTestResults,
  getTestResultById,
  updateTestResult,
  updateStatusById,
  getMyStatistics,
  getUserStatistics,
  softDeleteTestResult,
  hardDeleteTestResult,
  restoreTestResult,
};
