// controllers/test.controller.js
const testService = require('../services/test.service');

/* =========================
   Helpers
========================= */

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

const getUserCtx = (req) => ({
  userId: req.user?._id || null,
  userRole: req.user?.role || null,
});

const deny = (res) =>
  res.status(403).json({
    success: false,
    message: 'Access denied',
    type: 'ACCESS_DENIED',
  });

/** Check quyền: admin hoặc owner */
async function ensureAdminOrOwner(req, res, testId) {
  const { userId, userRole } = getUserCtx(req);
  if (!userId) return deny(res);

  const existing = await testService.getTestById(testId, userId, userRole);
  if (userRole === 'admin') return existing;

  const ownerId = existing?.created_by?._id || existing?.created_by;
  if (String(ownerId) !== String(userId)) return null;

  return existing;
}

/* =========================
   CRUD
========================= */

const createTest = async (req, res) => {
  try {
    const result = await testService.createTest({
      ...req.body,
      created_by: req.user._id,
      updated_by: req.user._id,
    });
    return res.status(201).json({ success: true, ...result });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllTests = async (req, res) => {
  try {
    // Chặn created_by từ user thường
    const { created_by, ...rest } = req.query || {};
    const filters = req.user?.role === 'admin' ? req.query : rest;

    const { userId, userRole } = getUserCtx(req);
    const out = await testService.getAllTests(filters, userId, userRole);

    return res.json({ success: true, ...out });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getMyTests = async (req, res) => {
  try {
    const out = await testService.getMyTests(req.query || {}, req.user._id);
    return res.json({ success: true, ...out });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getTestById = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const test = await testService.getTestById(req.params.id, userId, userRole);

    return res.json({
      success: true,
      message: 'Test fetched successfully',
      test,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const updateTest = async (req, res) => {
  try {
    const existing = await ensureAdminOrOwner(req, res, req.params.id);
    if (!existing) return deny(res);

    const test = await testService.updateTest(req.params.id, {
      ...req.body,
      updated_by: req.user._id,
    });

    return res.json({
      success: true,
      message: 'Test updated successfully',
      test,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const mergeTests = async (req, res) => {
  try {
    const { targetTestId, sourceTestIds } = req.body || {};

    if (!targetTestId || !Array.isArray(sourceTestIds) || sourceTestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'targetTestId and at least one sourceTestIds item are required',
        type: 'VALIDATION_ERROR',
      });
    }

    const { userId, userRole } = getUserCtx(req);
    const result = await testService.mergeTests({
      targetTestId,
      sourceTestIds,
      userId,
      userRole,
      updatedBy: req.user?._id || null,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const softDeleteTest = async (req, res) => {
  try {
    const existing = await ensureAdminOrOwner(req, res, req.params.id);
    if (!existing) return deny(res);

    const test = await testService.softDeleteTest(req.params.id);

    return res.json({
      success: true,
      message: 'Test soft-deleted successfully',
      test,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const hardDeleteTest = async (req, res) => {
  try {
    const existing = await ensureAdminOrOwner(req, res, req.params.id);
    if (!existing) return deny(res);

    const out = await testService.hardDeleteTest(req.params.id);

    return res.json({
      success: true,
      message: 'Test deleted successfully',
      ...out, // { success: true } nếu service trả
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

/* =========================
   Filters
========================= */

const searchTests = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !String(q).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required',
        type: 'VALIDATION_ERROR',
      });
    }

    const { userId, userRole } = getUserCtx(req);
    const tests = await testService.searchTests(q, userId, userRole);

    return res.json({
      success: true,
      message: 'Search tests successfully',
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getTestsByTopic = async (req, res) => {
  try {
    const { mainTopic, subTopic } = req.params;
    const { userId, userRole } = getUserCtx(req);

    const tests = await testService.getTestsByTopic(mainTopic, subTopic, userId, userRole);

    return res.json({
      success: true,
      message: 'Get all tests by topic successfully',
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getTestsByType = async (req, res) => {
  try {
    const { testType } = req.params;
    const { userId, userRole } = getUserCtx(req);

    const tests = await testService.getAllByType(testType, userId, userRole);

    return res.json({
      success: true,
      message: 'Get all tests by type successfully',
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

/* =========================
   List tests by type shortcuts
========================= */

const getAllMultipleChoicesTests = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const tests = await testService.getAllMultipleChoicesTests(userId, userRole);

    return res.json({
      success: true,
      message: 'Get all multiple choices tests successfully',
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllGrammarsTests = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const tests = await testService.getAllGrammarsTests(userId, userRole);

    return res.json({
      success: true,
      message: 'Get all grammars tests successfully',
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllVocabulariesTests = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const tests = await testService.getAllVocabulariesTests(userId, userRole);

    return res.json({
      success: true,
      message: 'Get all vocabularies tests successfully',
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

/* =========================
   Topics/Sub-topics
   (service đã fix: guest/user thấy toàn bộ topics, không lọc visibility)
========================= */


// Get top taken tests
const getTopTakenTests = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const { main_topic, sub_topic } = req.query;
    
    const filters = {};
    if (main_topic) filters.main_topic = main_topic;
    if (sub_topic) filters.sub_topic = sub_topic;
    
    const tests = await testService.getTopTakenTests(filters, limit);
    
    return res.json({
      success: true,
      message: 'Top taken tests fetched successfully',
      count: tests.length,
      filters: filters,
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

// Get newest tests
const getNewestTests = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { topic_id, subtopic_id, test_type } = req.query;
    
    const filters = {};
    if (topic_id) filters.topic_id = topic_id;
    if (subtopic_id) filters.subtopic_id = subtopic_id;
    if (test_type) filters.test_type = test_type;
    
    const tests = await testService.getNewestTests(filters, limit);
    
    return res.json({
      success: true,
      message: 'Newest tests fetched successfully',
      count: tests.length,
      filters: filters,
      tests,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

module.exports = {
  createTest,
  getAllTests,
  getMyTests,

  getTestById,
  updateTest,
  mergeTests,
  softDeleteTest,
  hardDeleteTest,

  searchTests,
  getTestsByTopic,
  getTestsByType,

  getAllMultipleChoicesTests,
  getAllGrammarsTests,
  getAllVocabulariesTests,

  getTopTakenTests,
  getNewestTests,

  // Get top scoring tests
  getTopScoringTests: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const { main_topic, sub_topic, test_type } = req.query;
      
      const filters = {};
      if (main_topic) filters.main_topic = main_topic;
      if (sub_topic) filters.sub_topic = sub_topic;
      if (test_type) filters.test_type = test_type;
      
      const tests = await testService.getTopScoringTests(filters, limit);
      
      return res.json({
        success: true,
        message: 'Top scoring tests fetched successfully',
        count: tests.length,
        filters: filters,
        tests,
      });
    } catch (e) {
      return handleServiceError(e, res);
    }
  },

  // Get test attempt count
  getTestAttemptCount: async (req, res) => {
    try {
      const { testId } = req.params;
      const count = await testService.getTestAttemptCount(testId);
      
      res.json({
        success: true,
        message: `Attempt count for test ${testId} fetched successfully`,
        test_id: testId,
        attempt_count: count
      });
    } catch (e) {
      return handleServiceError(e, res);
    }
  },

  // Get topic attempt count
  getTopicAttemptCount: async (req, res) => {
    try {
      const { mainTopic } = req.params;
      const { test_type } = req.query;
      
      const count = await testService.getTopicAttemptCount(mainTopic, test_type);
      
      res.json({
        success: true,
        message: `Attempt count for topic ${mainTopic} fetched successfully`,
        main_topic: mainTopic,
        test_type: test_type || 'all',
        attempt_count: count
      });
    } catch (e) {
      return handleServiceError(e, res);
    }
  },
};
