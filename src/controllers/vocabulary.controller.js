// controllers/vocabulary.controller.js
const vocabularyService = require('../services/vocabulary.service');

// Helper: chuẩn hoá trả lỗi từ service
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

// 🟢 Create new vocabulary
const createVocabulary = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const vocabulary = await vocabularyService.createVocabulary(
      {
        ...req.body,
        created_by: userId,
        updated_by: userId,
      },
      userId,
      userRole
    );

    return res.status(201).json({
      message: 'Vocabulary created successfully',
      vocabulary,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 📘 Get all vocabularies (hỗ trợ filters + permission theo Test)
const getAllVocabularies = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const vocabularies = await vocabularyService.getAllVocabularies(
      { ...req.query },
      userId,
      userRole
    );

    return res.json({
      message: 'Vocabularies fetched successfully',
      vocabularies,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 📘 Get all vocabularies by Test ID (permission theo Test)
const getAllVocabulariesByTestId = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const { testId } = req.params;
    const vocabularies = await vocabularyService.getAllVocabulariesByTestId(
      testId,
      userId,
      userRole
    );

    return res.json({
      message: 'Vocabularies by test fetched successfully',
      vocabularies,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 📘 Get vocabulary by ID (permission theo Test của vocabulary)
const getVocabularyById = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const { id } = req.params;
    const vocabulary = await vocabularyService.getVocabularyById(id, userId, userRole);

    return res.json({
      message: 'Vocabulary fetched successfully',
      vocabulary,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 🟡 Update vocabulary (admin/creator; và nếu đổi test_id thì phải có quyền với test đó)
const updateVocabulary = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    // Load existing (service đã check quyền xem theo test)
    const existing = await vocabularyService.getVocabularyById(req.params.id, userId, userRole);

    // Check quyền sửa theo creator/admin
    if (
      userRole !== 'admin' &&
      existing.created_by?._id?.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const updated = await vocabularyService.updateVocabulary(
      req.params.id,
      {
        ...req.body,
        updated_by: userId,
      },
      userId,
      userRole
    );

    return res.json({
      message: 'Vocabulary updated successfully',
      vocabulary: updated,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 🔴 Delete vocabulary (admin/creator)
const deleteVocabulary = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const existing = await vocabularyService.getVocabularyById(req.params.id, userId, userRole);

    if (
      userRole !== 'admin' &&
      existing.created_by?._id?.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const deleted = await vocabularyService.deleteVocabulary(req.params.id);

    return res.json({
      message: 'Vocabulary deleted successfully',
      vocabulary: deleted,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 🔍 Search vocabularies (permission theo Test)
const searchVocabularies = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        message: 'Search term is required',
        type: 'VALIDATION_ERROR',
      });
    }

    const vocabularies = await vocabularyService.searchVocabularies(q, userId, userRole);

    return res.json({
      message: 'Search vocabularies successfully',
      vocabularies,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

module.exports = {
  createVocabulary,
  getAllVocabularies,
  getAllVocabulariesByTestId,
  getVocabularyById,
  updateVocabulary,
  deleteVocabulary,
  searchVocabularies,
};
