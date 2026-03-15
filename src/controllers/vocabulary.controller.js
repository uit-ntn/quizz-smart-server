// controllers/vocabulary.controller.js
const vocabularyService = require('../services/vocabulary.service');

// ⚠️ CHỈNH PATH cho đúng file GeminiService của bạn:
// Ví dụ nếu file là: services/gemini.service.js  -> require('../services/gemini.service')
// hoặc: services/geminiService.js               -> require('../services/geminiService')
const geminiService = require('../services/gemini.service');

/* =========================
   Helpers
========================= */

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

// Lấy userId/role từ req.user (nếu có auth middleware)
function getAuth(req) {
  const userId = req.user?._id || null;
  const userRole = req.user?.role || null;
  return { userId, userRole };
}

/* =========================
   AI: GENERATE VOCABULARY ✅
   Endpoint gợi ý: POST /api/vocabularies/generate
   Body: { topic, category, description, count }
   Response khớp FE:
   { success: true, data: { vocabulary: [...] } }
========================= */
const generateVocabulary = async (req, res) => {
  try {
    const { topic, category, description, count } = req.body || {};

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({
        message: 'Topic is required',
        type: 'VALIDATION_ERROR',
      });
    }

    const safeCount = Math.max(1, Math.min(50, parseInt(count, 10) || 10));

    const vocabulary = await geminiService.generateVocabulary({
      topic: String(topic).trim(),
      category: category ? String(category).trim() : '',
      description: description ? String(description).trim() : '',
      count: safeCount,
    });

    return res.json({
      success: true,
      message: 'Vocabulary generated successfully',
      data: { vocabulary: Array.isArray(vocabulary) ? vocabulary : [] },
    });
  } catch (error) {
    // geminiService không dùng ServiceError, nên mình trả INTERNAL_ERROR trực tiếp
    console.error('❌ generateVocabulary error:', error);
    return res.status(500).json({
      message: error?.message || 'Failed to generate vocabulary',
      type: 'INTERNAL_ERROR',
    });
  }
};

/* =========================
   CREATE
========================= */

// 🟢 Create new vocabulary
const createVocabulary = async (req, res) => {
  try {
    const { userId, userRole } = getAuth(req);

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

/* =========================
   READ
========================= */

// 📘 Get all vocabularies (hỗ trợ filters + permission theo Test)
const getAllVocabularies = async (req, res) => {
  try {
    const { userId, userRole } = getAuth(req);

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
    const { userId, userRole } = getAuth(req);

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
    const { userId, userRole } = getAuth(req);

    const { id } = req.params;
    const vocabulary = await vocabularyService.getVocabularyById(
      id,
      userId,
      userRole
    );

    return res.json({
      message: 'Vocabulary fetched successfully',
      vocabulary,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

/* =========================
   UPDATE / DELETE
========================= */

// 🟡 Update vocabulary (admin/creator; và nếu đổi test_id thì phải có quyền với test đó)
const updateVocabulary = async (req, res) => {
  try {
    const { userId, userRole } = getAuth(req);

    // Load existing (service đã check quyền xem theo test)
    const existing = await vocabularyService.getVocabularyById(
      req.params.id,
      userId,
      userRole
    );

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
    const { userId, userRole } = getAuth(req);

    const existing = await vocabularyService.getVocabularyById(
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

    const deleted = await vocabularyService.deleteVocabulary(req.params.id);

    return res.json({
      message: 'Vocabulary deleted successfully',
      vocabulary: deleted,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

/* =========================
   SEARCH
========================= */

// 🔍 Search vocabularies (permission theo Test)
const searchVocabularies = async (req, res) => {
  try {
    const { userId, userRole } = getAuth(req);

    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        message: 'Search term is required',
        type: 'VALIDATION_ERROR',
      });
    }

    const vocabularies = await vocabularyService.searchVocabularies(
      q,
      userId,
      userRole
    );

    return res.json({
      message: 'Search vocabularies successfully',
      vocabularies,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

module.exports = {
  // AI
  generateVocabulary,

  // CRUD
  createVocabulary,
  getAllVocabularies,
  getAllVocabulariesByTestId,
  getVocabularyById,
  updateVocabulary,
  deleteVocabulary,

  // Search
  searchVocabularies,
};
