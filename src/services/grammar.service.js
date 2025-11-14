const mongoose = require('mongoose');
const Grammar = require('../models/Grammar');

// Custom error class for service errors
class ServiceError extends Error {
  constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.name = 'ServiceError';
  }
}

// Create
const createGrammar = async (grammarData) => {
  try {
    // Required fields
    if (!grammarData.question_text || !grammarData.correct_answers || !grammarData.explanation_text) {
      throw new ServiceError(
        'Missing required fields: question_text, correct_answers, explanation_text',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate test_id if provided
    if (grammarData.test_id && !mongoose.Types.ObjectId.isValid(grammarData.test_id)) {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }

    // question_text
    if (typeof grammarData.question_text !== 'string' || !grammarData.question_text.trim()) {
      throw new ServiceError('question_text must be a non-empty string', 400, 'VALIDATION_ERROR');
    }

    // correct_answers
    if (!Array.isArray(grammarData.correct_answers) || grammarData.correct_answers.length === 0) {
      throw new ServiceError('correct_answers must be a non-empty array', 400, 'VALIDATION_ERROR');
    }

    // explanation_text
    if (typeof grammarData.explanation_text !== 'string' || !grammarData.explanation_text.trim()) {
      throw new ServiceError('explanation_text must be a non-empty string', 400, 'VALIDATION_ERROR');
    }

    const grammar = new Grammar(grammarData);
    return await grammar.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    if (error.code === 11000) {
      throw new ServiceError('Grammar with this combination already exists', 409, 'DUPLICATE_ERROR');
    }

    throw new ServiceError('Failed to create grammar', 500, 'DATABASE_ERROR');
  }
};

// List (admin: all; user: exclude archived by default)
const getAllGrammars = async (filters = {}, userId = null, userRole = null) => {
  try {
    const query = {};

    if (filters.test_id) {
      if (!mongoose.Types.ObjectId.isValid(filters.test_id)) {
        throw new ServiceError('Invalid test ID in filters', 400, 'VALIDATION_ERROR');
      }
      query.test_id = filters.test_id;
    }
    if (filters.difficulty) query.difficulty = filters.difficulty;

    // status filter logic
    if (filters.status) {
      if (userRole === 'admin') {
        query.status = filters.status;
      } else {
        if (filters.status === 'archived') {
          throw new ServiceError('Access denied: Cannot view archived records', 403, 'ACCESS_DENIED');
        }
        query.status = filters.status;
      }
    } else {
      // default
      query.status = userRole === 'admin' ? { $in: ['active', 'draft', 'archived'] } : { $ne: 'archived' };
    }

    return await Grammar.find(query)
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name')
      .sort({ created_at: -1 });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error.name === 'CastError') {
      throw new ServiceError('Invalid filter parameters provided', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to fetch grammars', 500, 'DATABASE_ERROR');
  }
};

// By ID (respect status visibility)
const getGrammarById = async (id, userId = null, userRole = null) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ServiceError('Invalid grammar ID format', 400, 'VALIDATION_ERROR');
    }

    const grammar = await Grammar.findById(id)
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name');

    if (!grammar) throw new ServiceError('Grammar not found', 404, 'NOT_FOUND');

    // Non-admin cannot see archived
    if (userRole !== 'admin' && grammar.status === 'archived') {
      throw new ServiceError('Grammar not found or access denied', 404, 'NOT_FOUND');
    }

    return grammar;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error.name === 'CastError') {
      throw new ServiceError('Invalid grammar ID format', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to fetch grammar', 500, 'DATABASE_ERROR');
  }
};

// By testId
const getAllGrammarsByTestId = async (testId, userId = null, userRole = null) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }

    const query = {
      test_id: new mongoose.Types.ObjectId(testId),
      status: userRole === 'admin' ? { $in: ['active', 'draft', 'archived'] } : { $ne: 'archived' },
    };

    return await Grammar.find(query)
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name')
      .sort({ created_at: -1 });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error.name === 'CastError') {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to fetch grammars by test ID', 500, 'DATABASE_ERROR');
  }
};

// Update (admin or creator)
const updateGrammar = async (id, updateData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ServiceError('Invalid grammar ID format', 400, 'VALIDATION_ERROR');
    }

    if (updateData.test_id && !mongoose.Types.ObjectId.isValid(updateData.test_id)) {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }
    if (updateData.question_text !== undefined) {
      if (typeof updateData.question_text !== 'string' || !updateData.question_text.trim()) {
        throw new ServiceError('question_text must be a non-empty string', 400, 'VALIDATION_ERROR');
      }
    }
    if (updateData.correct_answers !== undefined) {
      if (!Array.isArray(updateData.correct_answers) || updateData.correct_answers.length === 0) {
        throw new ServiceError('correct_answers must be a non-empty array', 400, 'VALIDATION_ERROR');
      }
    }
    if (updateData.explanation_text !== undefined) {
      if (typeof updateData.explanation_text !== 'string' || !updateData.explanation_text.trim()) {
        throw new ServiceError('explanation_text must be a non-empty string', 400, 'VALIDATION_ERROR');
      }
    }
    if (updateData.status !== undefined && !['active', 'draft', 'archived'].includes(updateData.status)) {
      throw new ServiceError('Invalid status value', 400, 'VALIDATION_ERROR');
    }

    const updated = await Grammar.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    )
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name');

    if (!updated) throw new ServiceError('Grammar not found', 404, 'NOT_FOUND');
    return updated;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
    if (error.name === 'CastError') {
      throw new ServiceError('Invalid grammar ID format', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to update grammar', 500, 'DATABASE_ERROR');
  }
};

// Hard delete
const deleteGrammar = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ServiceError('Invalid grammar ID format', 400, 'VALIDATION_ERROR');
    }
    const deleted = await Grammar.findByIdAndDelete(id);
    if (!deleted) throw new ServiceError('Grammar not found', 404, 'NOT_FOUND');
    return deleted;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (error.name === 'CastError') {
      throw new ServiceError('Invalid grammar ID format', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to delete grammar', 500, 'DATABASE_ERROR');
  }
};

module.exports = {
  createGrammar,
  getAllGrammars,
  getGrammarById,
  getAllGrammarsByTestId,
  updateGrammar,
  deleteGrammar,
  ServiceError, // optional export if reused
};
