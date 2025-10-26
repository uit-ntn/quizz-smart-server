const testService = require('../services/test.service');

// Helper: chuẩn hoá trả lỗi từ service
function handleServiceError(error, res) {
  if (error.name === 'ServiceError') {
    return res.status(error.statusCode).json({
      message: error.message,
      type: error.type,
    });
  }
  console.error('❌ Unexpected error:', error);
  return res.status(500).json({
    message: 'Internal server error',
    type: 'INTERNAL_ERROR',
  });
}

// Create new test
const createTest = async (req, res) => {
  try {
    const result = await testService.createTest({
      ...req.body,
      created_by: req.user._id,
      updated_by: req.user._id,
    });
    return res.status(201).json({
      success: true,
      ...result, // { message, test }
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get all tests (có lọc + phân quyền)
const getAllTests = async (req, res) => {
  try {
    const filters = {};
    if (req.query.main_topic) filters.main_topic = req.query.main_topic;
    if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
    if (req.query.test_type) filters.test_type = req.query.test_type;
    if (req.query.difficulty) filters.difficulty = req.query.difficulty;
    if (req.query.status) filters.status = req.query.status;

    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const result = await testService.getAllTests(filters, userId, userRole);
    return res.json({
      success: true,
      ...result, // { message, tests }
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get tests của chính user
const getMyTests = async (req, res) => {
  try {
    const filters = { created_by: req.user._id };

    if (req.query.main_topic) filters.main_topic = req.query.main_topic;
    if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
    if (req.query.test_type) filters.test_type = req.query.test_type;
    if (req.query.difficulty) filters.difficulty = req.query.difficulty;
    if (req.query.status) filters.status = req.query.status;

    const result = await testService.getAllTests(filters, req.user._id, req.user.role);
    return res.json({
      message: 'Get my tests successfully',
      ...result, // { message, tests }
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Danh sách theo type chi tiết
const getAllMultipleChoicesTests = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const tests = await testService.getAllMultipleChoicesTests(userId, userRole);
    return res.json({
      success: true,
      message: 'Get all multiple choices tests successfully',
      tests,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllGrammarsTests = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const tests = await testService.getAllGrammarsTests(userId, userRole);
    return res.json({
      success: true,
      message: 'Get all grammars tests successfully',
      tests,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllVocabulariesTests = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const tests = await testService.getAllVocabulariesTests(userId, userRole);
    return res.json({
      success: true,
      message: 'Get all vocabularies tests successfully',
      tests,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get by ID (kèm check quyền trong service)
const getTestById = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const test = await testService.getTestById(req.params.id, userId, userRole);
    return res.json({
      message: 'Test fetched successfully',
      test,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Update (admin hoặc creator)
const updateTest = async (req, res) => {
  try {
    // verify quyền bằng cách lấy test trước
    const existingTest = await testService.getTestById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    if (
      req.user.role !== 'admin' &&
      existingTest.created_by._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const test = await testService.updateTest(req.params.id, {
      ...req.body,
      updated_by: req.user._id,
    });

    return res.json({
      success: true,
      message: 'Test updated successfully',
      test,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Hard delete (admin hoặc creator)
const hardDeleteTest = async (req, res) => {
  try {
    const existingTest = await testService.getTestById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    if (
      req.user.role !== 'admin' &&
      existingTest.created_by._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    await testService.hardDeleteTest(req.params.id);
    return res.json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Soft delete (admin hoặc creator)
const softDeleteTest = async (req, res) => {
  try {
    const existingTest = await testService.getTestById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    if (
      req.user.role !== 'admin' &&
      existingTest.created_by._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const test = await testService.softDeleteTest(req.params.id);
    return res.json({
      success: true,
      message: 'Test soft-deleted successfully',
      test,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Search
const searchTests = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required',
        type: 'VALIDATION_ERROR',
      });
    }
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const tests = await testService.searchTests(q, userId, userRole);
    return res.json({
      success: true,
      message: 'Search tests successfully',
      tests,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// By topic
const getTestsByTopic = async (req, res) => {
  try {
    const { mainTopic, subTopic } = req.params;
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const tests = await testService.getTestsByTopic(mainTopic, subTopic, userId, userRole);
    return res.json({
      success: true,
      message: 'Get all tests by topic successfully',
      tests,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// By type
const getTestsByType = async (req, res) => {
  try {
    const { testType } = req.params;
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const tests = await testService.getTestsByType(testType, userId, userRole);
    return res.json({
      success: true,
      message: 'Get all tests by type successfully',
      tests,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Topics/ Sub-topics theo type
const getAllMultipleChoicesMainTopics = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const mainTopics = await testService.getAllMultipleChoicesMainTopics(userId, userRole);
    return res.json({
      success: true,
      message: 'Get all multiple choices main topics successfully',
      mainTopics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllMultipleChoicesSubTopicsByMainTopic = async (req, res) => {
  try {
    const { mainTopic } = req.params;
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const subTopics = await testService.getAllMultipleChoicesSubTopicsByMainTopic(
      mainTopic,
      userId,
      userRole
    );
    return res.json({
      success: true,
      message: 'Get all multiple choices sub topics by main topic successfully',
      subTopics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllGrammarsMainTopics = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const mainTopics = await testService.getAllGrammarsMainTopics(userId, userRole);
    return res.json({
      success: true,
      message: 'Get all grammars main topics successfully',
      mainTopics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllGrammarsSubTopicsByMainTopic = async (req, res) => {
  try {
    const { mainTopic } = req.params;
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const subTopics = await testService.getAllGrammarsSubTopicsByMainTopic(mainTopic, userId, userRole);
    return res.json({
      success: true,
      message: 'Get all grammars sub topics by main topic successfully',
      subTopics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllVocabulariesMainTopics = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const mainTopics = await testService.getAllVocabulariesMainTopics(userId, userRole);
    return res.json({
      success: true,
      message: 'Get all vocabularies main topics successfully',
      mainTopics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

const getAllVocabulariesSubTopicsByMainTopic = async (req, res) => {
  try {
    const { mainTopic } = req.params;
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;
    const subTopics = await testService.getAllVocabulariesSubTopicsByMainTopic(
      mainTopic,
      userId,
      userRole
    );
    return res.json({
      success: true,
      message: 'Get all vocabularies sub topics by main topic successfully',
      subTopics,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
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
