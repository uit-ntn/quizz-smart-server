// services/vocabulary.service.js
const mongoose = require('mongoose');
const Vocabulary = require('../models/Vocabulary');
const Test = require('../models/Test');

// Custom error class for service errors
class ServiceError extends Error {
  constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.name = 'ServiceError';
  }
}

/* =========================
   Helpers
========================= */

function ensureObjectId(id, name = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ServiceError(`Invalid ${name} format`, 400, 'VALIDATION_ERROR');
  }
}

// Chỉ cho phép filter “an toàn” (tránh FE truyền difficulty/status làm query rỗng)
function sanitizeFilters(filters = {}) {
  const safe = {};
  const { test_id, word, meaning } = filters;

  if (test_id) safe.test_id = String(test_id).trim();
  if (word) safe.word = String(word).trim();
  if (meaning) safe.meaning = String(meaning).trim();

  return safe;
}

/**
 * Quyền truy cập test:
 * - admin: all
 * - guest: public + active
 * - user: public (không deleted) + test của mình (không deleted)
 */
async function ensureCanAccessTest(testId, userId = null, role = null) {
  ensureObjectId(testId, 'test ID');

  const test = await Test.findById(testId).select('visibility status created_by');
  if (!test) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

  if (role === 'admin') return test;

  if (!userId) {
    if (test.visibility !== 'public' || test.status !== 'active') {
      throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
    }
    return test;
  }

  // logged in
  if (test.status === 'deleted') {
    throw new ServiceError('Test not found', 404, 'NOT_FOUND');
  }

  if (
    test.visibility === 'public' ||
    test.created_by?.toString() === userId.toString()
  ) {
    return test;
  }

  throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
}

/**
 * Quyền sửa test (gắn vocab vào test):
 * - admin: OK
 * - user: chỉ owner test
 */
async function ensureCanModifyTest(testId, userId = null, role = null) {
  ensureObjectId(testId, 'test ID');

  const test = await Test.findById(testId).select('created_by');
  if (!test) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

  if (role === 'admin') return test;
  if (!userId) throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');

  if (test.created_by?.toString() !== userId.toString()) {
    throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
  }

  return test;
}

/**
 * Lấy danh sách testId được phép xem để filter Vocabulary
 * - guest: public + active
 * - user: public (not deleted) + own (not deleted)
 * - admin: null (không cần)
 */
async function getAllowedTestIds(userId = null, role = null) {
  if (role === 'admin') return null;

  if (!userId) {
    const tests = await Test.find({ visibility: 'public', status: 'active' }).select('_id');
    return tests.map(t => t._id);
  }

  const tests = await Test.find({
    status: { $ne: 'deleted' },
    $or: [{ visibility: 'public' }, { created_by: userId }],
  }).select('_id');

  return tests.map(t => t._id);
}

/* =========================
   CREATE
========================= */

const createVocabulary = async (vocabularyData, userId = null, role = null) => {
  try {
    // Validate required fields
    if (!vocabularyData.word || !vocabularyData.meaning) {
      throw new ServiceError('Missing required fields: word and meaning are required', 400, 'VALIDATION_ERROR');
    }

    // Validate test_id if provided
    if (vocabularyData.test_id) {
      ensureObjectId(vocabularyData.test_id, 'test ID');
      // ✅ phải có quyền gắn vào test (admin/owner)
      await ensureCanModifyTest(vocabularyData.test_id, userId, role);
    }

    // Validate word and meaning are strings
    if (typeof vocabularyData.word !== 'string' || vocabularyData.word.trim().length === 0) {
      throw new ServiceError('Word must be a non-empty string', 400, 'VALIDATION_ERROR');
    }

    if (typeof vocabularyData.meaning !== 'string' || vocabularyData.meaning.trim().length === 0) {
      throw new ServiceError('Meaning must be a non-empty string', 400, 'VALIDATION_ERROR');
    }

    const vocabulary = new Vocabulary(vocabularyData);
    return await vocabulary.save();
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    if (error.code === 11000) {
      throw new ServiceError('Vocabulary with this combination already exists', 409, 'DUPLICATE_ERROR');
    }

    throw new ServiceError('Failed to create vocabulary', 500, 'DATABASE_ERROR');
  }
};

/* =========================
   READ
========================= */

// Get all vocabularies with optional filters + permission theo Test
const getAllVocabularies = async (filters = {}, userId = null, role = null) => {
  try {
    const safe = sanitizeFilters(filters);

    if (safe.test_id) {
      // Nếu filter theo test_id: check quyền test rồi query theo test_id đó
      await ensureCanAccessTest(safe.test_id, userId, role);

      return await Vocabulary.find({ ...safe })
        .populate('created_by', 'username full_name')
        .populate('updated_by', 'username full_name')
        .sort({ created_at: -1 });
    }

    // Không filter test_id: chỉ trả vocab thuộc các test được phép xem
    const allowedTestIds = await getAllowedTestIds(userId, role);

    const query = allowedTestIds
      ? { ...safe, test_id: { $in: allowedTestIds } }
      : { ...safe }; // admin

    return await Vocabulary.find(query)
      .populate('created_by', 'username full_name')
      .populate('updated_by', 'username full_name')
      .sort({ created_at: -1 });
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'CastError') {
      throw new ServiceError('Invalid filter parameters provided', 400, 'VALIDATION_ERROR');
    }

    throw new ServiceError('Failed to fetch vocabularies', 500, 'DATABASE_ERROR');
  }
};

// Get vocabulary by ID (permission theo Test)
const getVocabularyById = async (id, userId = null, role = null) => {
  try {
    ensureObjectId(id, 'vocabulary ID');

    const vocabulary = await Vocabulary.findById(id)
      .populate('created_by', 'username full_name')
      .populate('updated_by', 'username full_name');

    if (!vocabulary) throw new ServiceError('Vocabulary not found', 404, 'NOT_FOUND');

    // ✅ check quyền theo test_id nếu có
    if (vocabulary.test_id) {
      await ensureCanAccessTest(vocabulary.test_id, userId, role);
    } else if (role !== 'admin') {
      // nếu có vocab không gắn test_id, chỉ cho admin (an toàn)
      throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
    }

    return vocabulary;
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'CastError') {
      throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
    }

    throw new ServiceError('Failed to fetch vocabulary', 500, 'DATABASE_ERROR');
  }
};

// Get all vocabularies by test ID (permission theo Test)
const getAllVocabulariesByTestId = async (testId, userId = null, role = null) => {
  try {
    ensureObjectId(testId, 'test ID');
    await ensureCanAccessTest(testId, userId, role);

    return await Vocabulary.find({ test_id: new mongoose.Types.ObjectId(testId) })
      .populate('created_by', 'username full_name')
      .populate('updated_by', 'username full_name')
      .sort({ created_at: -1 });
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'CastError') {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }

    throw new ServiceError('Failed to fetch vocabularies by test ID', 500, 'DATABASE_ERROR');
  }
};

/* =========================
   UPDATE / DELETE
========================= */

const updateVocabulary = async (id, updateData, userId = null, role = null) => {
  try {
    ensureObjectId(id, 'vocabulary ID');

    // Nếu user đổi test_id -> phải có quyền gắn vào test đó
    if (updateData.test_id) {
      ensureObjectId(updateData.test_id, 'test ID');
      await ensureCanModifyTest(updateData.test_id, userId, role);
    }

    // Validate update data
    if (updateData.word !== undefined) {
      if (typeof updateData.word !== 'string' || updateData.word.trim().length === 0) {
        throw new ServiceError('Word must be a non-empty string', 400, 'VALIDATION_ERROR');
      }
    }

    if (updateData.meaning !== undefined) {
      if (typeof updateData.meaning !== 'string' || updateData.meaning.trim().length === 0) {
        throw new ServiceError('Meaning must be a non-empty string', 400, 'VALIDATION_ERROR');
      }
    }

    const updatedVocabulary = await Vocabulary.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    )
      .populate('created_by', 'username full_name')
      .populate('updated_by', 'username full_name');

    if (!updatedVocabulary) throw new ServiceError('Vocabulary not found', 404, 'NOT_FOUND');

    return updatedVocabulary;
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    if (error.name === 'CastError') {
      throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
    }

    throw new ServiceError('Failed to update vocabulary', 500, 'DATABASE_ERROR');
  }
};

const deleteVocabulary = async (id) => {
  try {
    ensureObjectId(id, 'vocabulary ID');

    const deletedVocabulary = await Vocabulary.findByIdAndDelete(id);
    if (!deletedVocabulary) throw new ServiceError('Vocabulary not found', 404, 'NOT_FOUND');

    return deletedVocabulary;
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    if (error.name === 'CastError') {
      throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
    }

    throw new ServiceError('Failed to delete vocabulary', 500, 'DATABASE_ERROR');
  }
};

/* =========================
   SEARCH (permission theo Test)
========================= */

const searchVocabularies = async (searchTerm, userId = null, role = null) => {
  try {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      throw new ServiceError('Search term is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
    }

    const q = searchTerm.trim();

    const allowedTestIds = await getAllowedTestIds(userId, role);

    const base = {
      $or: [
        { word: { $regex: q, $options: 'i' } },
        { meaning: { $regex: q, $options: 'i' } },
      ],
    };

    const query = allowedTestIds
      ? { $and: [base, { test_id: { $in: allowedTestIds } }] }
      : base; // admin

    return await Vocabulary.find(query)
      .populate('created_by', 'username full_name')
      .populate('updated_by', 'username full_name')
      .sort({ created_at: -1 });
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    throw new ServiceError('Failed to search vocabularies', 500, 'DATABASE_ERROR');
  }
};

module.exports = {
  ServiceError,
  createVocabulary,
  getAllVocabularies,
  getVocabularyById,
  getAllVocabulariesByTestId,
  updateVocabulary,
  deleteVocabulary,
  searchVocabularies,
};
