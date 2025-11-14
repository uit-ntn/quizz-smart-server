const vocabularyService = require('../services/vocabulary.service');

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

// 🟢 Create new vocabulary
const createVocabulary = async (req, res) => {
  try {
    const vocabulary = await vocabularyService.createVocabulary({
      ...req.body,
      created_by: req.user?._id,
      updated_by: req.user?._id,
    });
    return res.status(201).json({
      message: 'Vocabulary created successfully',
      vocabulary,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 📘 Get all vocabularies (hỗ trợ filters)
const getAllVocabularies = async (req, res) => {
  try {
    // Pass toàn bộ req.query làm filters (service sẽ tự validate test_id, ...)
    const vocabularies = await vocabularyService.getAllVocabularies({ ...req.query });
    return res.json({
      message: 'Vocabularies fetched successfully',
      vocabularies,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 📘 Get all vocabularies by Test ID
const getAllVocabulariesByTestId = async (req, res) => {
  try {
    const { testId } = req.params;
    const vocabularies = await vocabularyService.getAllVocabulariesByTestId(testId);
    return res.json({
      message: 'Vocabularies by test fetched successfully',
      vocabularies,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 📘 Get vocabulary by ID
const getVocabularyById = async (req, res) => {
  try {
    const { id } = req.params;
    const vocabulary = await vocabularyService.getVocabularyById(id);
    return res.json({
      message: 'Vocabulary fetched successfully',
      vocabulary,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 🟡 Update vocabulary
const updateVocabulary = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await vocabularyService.updateVocabulary(id, {
      ...req.body,
      updated_by: req.user?._id,
    });
    return res.json({
      message: 'Vocabulary updated successfully',
      vocabulary: updated,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 🔴 Delete vocabulary
const deleteVocabulary = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await vocabularyService.deleteVocabulary(id);
    return res.json({
      message: 'Vocabulary deleted successfully',
      vocabulary: deleted,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// 🔍 Search vocabularies (by word or meaning)
const searchVocabularies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        message: 'Search term is required',
        type: 'VALIDATION_ERROR',
      });
    }
    const vocabularies = await vocabularyService.searchVocabularies(q);
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
