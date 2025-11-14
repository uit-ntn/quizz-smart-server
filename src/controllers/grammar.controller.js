const grammarService = require('../services/grammar.service');

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

// Create
const createGrammar = async (req, res) => {
  try {
    const grammar = await grammarService.createGrammar({
      ...req.body,
      created_by: req.user?._id,
      updated_by: req.user?._id,
    });
    return res.status(201).json({
      success: true,
      message: 'Grammar created successfully',
      grammar,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// List
const getAllGrammars = async (req, res) => {
  try {
    const filters = {};
    if (req.query.test_id) filters.test_id = req.query.test_id;
    if (req.query.difficulty) filters.difficulty = req.query.difficulty;
    if (req.query.status) filters.status = req.query.status;

    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const grammars = await grammarService.getAllGrammars(filters, userId, userRole);
    return res.json({
      success: true,
      message: 'Grammars fetched successfully',
      count: grammars.length,
      grammars,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// By ID
const getGrammarById = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const grammar = await grammarService.getGrammarById(req.params.id, userId, userRole);
    return res.json({
      success: true,
      message: 'Grammar fetched successfully',
      grammar,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// By Test
const getAllGrammarsByTestId = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const grammars = await grammarService.getAllGrammarsByTestId(
      req.params.testId,
      userId,
      userRole
    );

    return res.json({
      success: true,
      message: 'Grammars by test fetched successfully',
      count: grammars.length,
      grammars,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Update (admin/creator)
const updateGrammar = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const existing = await grammarService.getGrammarById(req.params.id, userId, userRole);
    if (userRole !== 'admin' && existing.created_by._id.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const grammar = await grammarService.updateGrammar(req.params.id, {
      ...req.body,
      updated_by: userId,
    });

    return res.json({
      success: true,
      message: 'Grammar updated successfully',
      grammar,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

// Delete (admin/creator) — hard delete
const deleteGrammar = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userRole = req.user?.role || null;

    const existing = await grammarService.getGrammarById(req.params.id, userId, userRole);
    if (userRole !== 'admin' && existing.created_by._id.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        type: 'ACCESS_DENIED',
      });
    }

    const grammar = await grammarService.deleteGrammar(req.params.id);
    return res.json({
      success: true,
      message: 'Grammar deleted successfully',
      grammar,
    });
  } catch (error) {
    return handleServiceError(error, res);
  }
};

module.exports = {
  createGrammar,
  getAllGrammars,
  getGrammarById,
  getAllGrammarsByTestId,
  updateGrammar,
  deleteGrammar,
};
