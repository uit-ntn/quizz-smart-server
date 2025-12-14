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

const getAllMultipleChoicesMainTopics = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const mainTopics = await testService.getAllMultipleChoicesMainTopics(userId, userRole);

    return res.json({
      success: true,
      message: 'Get all multiple choices main topics successfully',
      mainTopics,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllMultipleChoicesSubTopicsByMainTopic = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const subTopics = await testService.getAllMultipleChoicesSubTopicsByMainTopic(
      req.params.mainTopic,
      userId,
      userRole
    );

    return res.json({
      success: true,
      message: 'Get all multiple choices sub topics by main topic successfully',
      subTopics,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllGrammarsMainTopics = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const mainTopics = await testService.getAllGrammarsMainTopics(userId, userRole);

    return res.json({
      success: true,
      message: 'Get all grammars main topics successfully',
      mainTopics,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllGrammarsSubTopicsByMainTopic = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const subTopics = await testService.getAllGrammarsSubTopicsByMainTopic(
      req.params.mainTopic,
      userId,
      userRole
    );

    return res.json({
      success: true,
      message: 'Get all grammars sub topics by main topic successfully',
      subTopics,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllVocabulariesMainTopics = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const mainTopics = await testService.getAllVocabulariesMainTopics(userId, userRole);

    return res.json({
      success: true,
      message: 'Get all vocabularies main topics successfully',
      mainTopics,
    });
  } catch (e) {
    return handleServiceError(e, res);
  }
};

const getAllVocabulariesSubTopicsByMainTopic = async (req, res) => {
  try {
    const { userId, userRole } = getUserCtx(req);
    const subTopics = await testService.getAllVocabulariesSubTopicsByMainTopic(
      req.params.mainTopic,
      userId,
      userRole
    );

    return res.json({
      success: true,
      message: 'Get all vocabularies sub topics by main topic successfully',
      subTopics,
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
  softDeleteTest,
  hardDeleteTest,

  searchTests,
  getTestsByTopic,
  getTestsByType,

  getAllMultipleChoicesTests,
  getAllGrammarsTests,
  getAllVocabulariesTests,

  getAllMultipleChoicesMainTopics,
  getAllMultipleChoicesSubTopicsByMainTopic,

  getAllGrammarsMainTopics,
  getAllGrammarsSubTopicsByMainTopic,

  getAllVocabulariesMainTopics,
  getAllVocabulariesSubTopicsByMainTopic,
};
