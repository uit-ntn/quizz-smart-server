// controllers/test.controller.js
const testService = require('../services/test.service');

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

/* ------------------------- CRUD ------------------------- */

const createTest = async (req, res) => {
  try {
    const result = await testService.createTest({
      ...req.body,
      created_by: req.user._id,
      updated_by: req.user._id,
    });
    return res.status(201).json({ success: true, ...result });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllTests = async (req, res) => {
  try {
    // Chặn created_by từ user thường
    const { created_by, ...rest } = req.query || {};
    const filters = req.user?.role === 'admin' ? req.query : rest;

    const out = await testService.getAllTests(filters, req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, ...out });
  } catch (e) { return handleServiceError(e, res); }
};

const getMyTests = async (req, res) => {
  try {
    const out = await testService.getMyTests(req.query || {}, req.user._id);
    return res.json({ success: true, ...out });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllMultipleChoicesTests = async (req, res) => {
  try {
    const tests = await testService.getAllMultipleChoicesTests(req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all multiple choices tests successfully', tests });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllGrammarsTests = async (req, res) => {
  try {
    const tests = await testService.getAllGrammarsTests(req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all grammars tests successfully', tests });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllVocabulariesTests = async (req, res) => {
  try {
    const tests = await testService.getAllVocabulariesTests(req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all vocabularies tests successfully', tests });
  } catch (e) { return handleServiceError(e, res); }
};

const getTestById = async (req, res) => {
  try {
    const test = await testService.getTestById(req.params.id, req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Test fetched successfully', test });
  } catch (e) { return handleServiceError(e, res); }
};

const updateTest = async (req, res) => {
  try {
    // Kiểm tra quyền: admin hoặc owner
    const existing = await testService.getTestById(req.params.id, req.user._id, req.user.role);
    if (req.user.role !== 'admin' && String(existing.created_by._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied', type: 'ACCESS_DENIED' });
    }
    const test = await testService.updateTest(req.params.id, { ...req.body, updated_by: req.user._id });
    return res.json({ success: true, message: 'Test updated successfully', test });
  } catch (e) { return handleServiceError(e, res); }
};

const hardDeleteTest = async (req, res) => {
  try {
    const existing = await testService.getTestById(req.params.id, req.user._id, req.user.role);
    if (req.user.role !== 'admin' && String(existing.created_by._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied', type: 'ACCESS_DENIED' });
    }
    await testService.hardDeleteTest(req.params.id);
    return res.json({ success: true, message: 'Test deleted successfully' });
  } catch (e) { return handleServiceError(e, res); }
};

const softDeleteTest = async (req, res) => {
  try {
    const existing = await testService.getTestById(req.params.id, req.user._id, req.user.role);
    if (req.user.role !== 'admin' && String(existing.created_by._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied', type: 'ACCESS_DENIED' });
    }
    const test = await testService.softDeleteTest(req.params.id);
    return res.json({ success: true, message: 'Test soft-deleted successfully', test });
  } catch (e) { return handleServiceError(e, res); }
};

const searchTests = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search term is required', type: 'VALIDATION_ERROR' });

    const tests = await testService.searchTests(q, req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Search tests successfully', tests });
  } catch (e) { return handleServiceError(e, res); }
};

const getTestsByTopic = async (req, res) => {
  try {
    const { mainTopic, subTopic } = req.params;
    const tests = await testService.getTestsByTopic(mainTopic, subTopic, req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all tests by topic successfully', tests });
  } catch (e) { return handleServiceError(e, res); }
};

const getTestsByType = async (req, res) => {
  try {
    const { testType } = req.params;
    const tests = await testService.getAllByType
      ? await testService.getAllByType(testType, req.user?._id || null, req.user?.role || null)
      : await testService.getTestsByType(testType, req.user?._id || null, req.user?.role || null); // fallback nếu bạn còn giữ hàm cũ
    return res.json({ success: true, message: 'Get all tests by type successfully', tests });
  } catch (e) { return handleServiceError(e, res); }
};

/* Topics/Sub-topics */
const getAllMultipleChoicesMainTopics = async (req, res) => {
  try {
    const mainTopics = await testService.getAllMultipleChoicesMainTopics(req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all multiple choices main topics successfully', mainTopics });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllMultipleChoicesSubTopicsByMainTopic = async (req, res) => {
  try {
    const subTopics = await testService.getAllMultipleChoicesSubTopicsByMainTopic(
      req.params.mainTopic, req.user?._id || null, req.user?.role || null
    );
    return res.json({ success: true, message: 'Get all multiple choices sub topics by main topic successfully', subTopics });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllGrammarsMainTopics = async (req, res) => {
  try {
    const mainTopics = await testService.getAllGrammarsMainTopics(req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all grammars main topics successfully', mainTopics });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllGrammarsSubTopicsByMainTopic = async (req, res) => {
  try {
    const subTopics = await testService.getAllGrammarsSubTopicsByMainTopic(
      req.params.mainTopic, req.user?._id || null, req.user?.role || null
    );
    return res.json({ success: true, message: 'Get all grammars sub topics by main topic successfully', subTopics });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllVocabulariesMainTopics = async (req, res) => {
  try {
    const mainTopics = await testService.getAllVocabulariesMainTopics(req.user?._id || null, req.user?.role || null);
    return res.json({ success: true, message: 'Get all vocabularies main topics successfully', mainTopics });
  } catch (e) { return handleServiceError(e, res); }
};

const getAllVocabulariesSubTopicsByMainTopic = async (req, res) => {
  try {
    const subTopics = await testService.getAllVocabulariesSubTopicsByMainTopic(
      req.params.mainTopic, req.user?._id || null, req.user?.role || null
    );
    return res.json({ success: true, message: 'Get all vocabularies sub topics by main topic successfully', subTopics });
  } catch (e) { return handleServiceError(e, res); }
};

module.exports = {
  createTest,
  getAllTests,
  getMyTests,
  getAllMultipleChoicesTests,
  getAllGrammarsTests,
  getAllVocabulariesTests,
  getTestById,
  updateTest,
  hardDeleteTest,
  softDeleteTest,
  searchTests,
  getTestsByTopic,
  getTestsByType,
  getAllMultipleChoicesMainTopics,
  getAllMultipleChoicesSubTopicsByMainTopic,
  getAllGrammarsMainTopics,
  getAllGrammarsSubTopicsByMainTopic,
  getAllVocabulariesMainTopics,
  getAllVocabulariesSubTopicsByMainTopic,
};
