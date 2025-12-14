// controllers/multipleChoice.controller.js
const multipleChoiceService = require('../services/multipleChoice.service');
const Test = require('../models/Test'); // ✅ NEW: check quyền khi create theo test_id

// Chuẩn hoá trả lỗi từ service
function handleServiceError(error, res) {
  if (error && error.name === 'ServiceError') {
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

/**
 * ✅ NEW: user tạo câu hỏi phải có quyền với test_id
 * - admin: OK
 * - user: chỉ được tạo vào test của chính mình
 */
async function ensureCanCreateOnTest(testId, userId, userRole) {
  const test = await Test.findById(testId).select('created_by');
  if (!test) {
    // dùng format giống phần còn lại
    const err = new Error('Test not found');
    err.name = 'ServiceError';
    err.statusCode = 404;
    err.type = 'NOT_FOUND';
    throw err;
  }

  if (userRole === 'admin') return true;

  if (!userId || test.created_by.toString() !== userId.toString()) {
    const err = new Error('Access denied');
    err.name = 'ServiceError';
    err.statusCode = 403;
    err.type = 'ACCESS_DENIED';
    throw err;
  }

  return true;
}

// Create
const createMultipleChoice = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    // ✅ NEW: nếu có test_id -> check quyền tạo vào test đó
    if (req.body?.test_id) {
      await ensureCanCreateOnTest(req.body.test_id, userId, userRole);
    }

    const question = await multipleChoiceService.createMultipleChoice({
      ...req.body,
      created_by: userId,
      updated_by: userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get all (permission theo service)
const getAllMultipleChoices = async (req, res) => {
  try {
    const filters = {};
    if (req.query.test_id) filters.test_id = req.query.test_id;

    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const questions = await multipleChoiceService.getAllMultipleChoices(
      filters,
      userId,
      userRole
    );

    return res.json({
      message: 'Questions fetched successfully',
      count: questions.length,
      questions,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get by id (service tự check quyền theo test)
const getMultipleChoiceById = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const question = await multipleChoiceService.getMultipleChoiceById(
      req.params.id,
      userId,
      userRole
    );

    return res.json({
      message: 'Question fetched successfully',
      question,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Update (admin/creator)
const updateMultipleChoice = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    // load bản ghi (service đã check quyền xem theo test)
    const existing = await multipleChoiceService.getMultipleChoiceById(
      req.params.id,
      userId,
      userRole
    );

    if (
      userRole !== 'admin' &&
      existing.created_by?._id?.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const question = await multipleChoiceService.updateMultipleChoice(req.params.id, {
      ...req.body,
      updated_by: userId,
    });

    return res.json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Delete (admin/creator)
const deleteMultipleChoice = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const existing = await multipleChoiceService.getMultipleChoiceById(
      req.params.id,
      userId,
      userRole
    );

    if (
      userRole !== 'admin' &&
      existing.created_by?._id?.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const question = await multipleChoiceService.deleteMultipleChoice(req.params.id);

    return res.json({
      message: 'Question deleted successfully',
      question,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Get all by testId (service check quyền theo test)
const getAllMultipleChoicesByTestId = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const questions = await multipleChoiceService.getAllMultipleChoicesByTestId(
      req.params.testId,
      userId,
      userRole
    );

    return res.json({
      message: 'Questions by test fetched successfully',
      count: questions.length,
      questions,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

module.exports = {
  createMultipleChoice,
  getAllMultipleChoices,
  getMultipleChoiceById,
  updateMultipleChoice,
  deleteMultipleChoice,
  getAllMultipleChoicesByTestId,
};
