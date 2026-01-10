const testResultService = require('../services/testResult.service');
const TestResult = require('../models/TestResult');

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
 * BEHAVIOR & SESSION LOGGING
 * ===================================================== */
const addBehavior = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_type, at, ...payload } = req.body || {};

    if (!event_type) {
      return res.status(400).json({
        success: false,
        message: 'event_type is required',
        type: 'VALIDATION_ERROR',
      });
    }

    const safePayload =
      payload && typeof payload === 'object' ? payload : {};

    const updated = await TestResult.findByIdAndUpdate(
      id,
      {
        $push: {
          behaviors: {
            event_type,
            at: at ? new Date(at) : new Date(),
            payload: safePayload,
          },
        },
      },
      { new: false }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'TestResult not found',
        type: 'NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      ok: true,
      message: 'Behavior logged successfully',
    });
  } catch (err) {
    console.error('addBehavior error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      type: 'INTERNAL_ERROR',
    });
  }
};

const startSessionMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { started_at, user_agent } = req.body || {};

    const updated = await TestResult.findByIdAndUpdate(
      id,
      {
        $set: {
          'session.started_at': started_at ? new Date(started_at) : new Date(),
          'session.user_agent': user_agent || '',
        },
      },
      { new: false }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'TestResult not found',
        type: 'NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      ok: true,
      message: 'Session start meta saved',
    });
  } catch (err) {
    console.error('startSession error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      type: 'INTERNAL_ERROR',
    });
  }
};

const endSessionMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { ended_at, duration_ms } = req.body || {};

    const updated = await TestResult.findByIdAndUpdate(
      id,
      {
        $set: {
          'session.ended_at': ended_at ? new Date(ended_at) : new Date(),
          'session.duration_ms': Number(duration_ms) || 0,
        },
      },
      { new: false }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'TestResult not found',
        type: 'NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      ok: true,
      message: 'Session end meta saved',
    });
  } catch (err) {
    console.error('endSession error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      type: 'INTERNAL_ERROR',
    });
  }
};

/* =====================================================
 * LEADERBOARD ENDPOINTS
 * ===================================================== */
const getTopUsersByWeek = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50',
        type: 'VALIDATION_ERROR'
      });
    }

    const leaderboard = await testResultService.getTopUsersByWeek(limit);

    return res.json({
      success: true,
      message: 'Weekly leaderboard fetched successfully',
      period: 'week',
      count: leaderboard.length,
      leaderboard,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getTopUsersByMonth = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50',
        type: 'VALIDATION_ERROR'
      });
    }

    const leaderboard = await testResultService.getTopUsersByMonth(limit);

    return res.json({
      success: true,
      message: 'Monthly leaderboard fetched successfully',
      period: 'month',
      count: leaderboard.length,
      leaderboard,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getTopUsersByCustomPeriod = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const limit = parseInt(req.query.limit) || 3;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required (YYYY-MM-DD format)',
        type: 'VALIDATION_ERROR'
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50',
        type: 'VALIDATION_ERROR'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
        type: 'VALIDATION_ERROR'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'start_date must be before end_date',
        type: 'VALIDATION_ERROR'
      });
    }

    // Giới hạn khoảng thời gian tối đa 1 năm
    const maxPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
    if (endDate - startDate > maxPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Period cannot exceed 1 year',
        type: 'VALIDATION_ERROR'
      });
    }

    const leaderboard = await testResultService.getTopUsersInPeriod(startDate, endDate, limit);

    return res.json({
      success: true,
      message: 'Custom period leaderboard fetched successfully',
      period: 'custom',
      start_date: start_date,
      end_date: end_date,
      count: leaderboard.length,
      leaderboard,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get top test takers (users who completed the most tests)
const getTopTestTakers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    if (limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 20',
        type: 'VALIDATION_ERROR'
      });
    }

    const users = await testResultService.getTopTestTakers(limit);

    return res.json({
      success: true,
      message: 'Top test takers fetched successfully',
      count: users.length,
      users,
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
  getTopUsersByWeek,
  getTopUsersByMonth,
  getTopUsersByCustomPeriod,

  // Get top performers
  getTopPerformers: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      
      if (limit < 1 || limit > 20) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 20',
          type: 'VALIDATION_ERROR'
        });
      }

      const performers = await testResultService.getTopPerformers(limit);

      return res.json({
        success: true,
        message: 'Top performers fetched successfully',
        count: performers.length,
        performers,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      return handleServiceError(error, res);
    }
  },

  // Get top test takers (users who completed the most tests)
  getTopTestTakers,

  addBehavior,
  startSessionMeta,
  endSessionMeta,
};
