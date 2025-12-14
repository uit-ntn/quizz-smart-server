// services/test.service.js
const mongoose = require('mongoose');
const Test = require('../models/Test');
const MultipleChoice = require('../models/MultipleChoice');
const Vocabulary = require('../models/Vocabulary');
const Grammar = require('../models/Grammar');

/** ServiceError chuẩn */
class ServiceError extends Error {
  constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.name = 'ServiceError';
  }
}

/* ------------------------- UTILS ------------------------- */

/** Chỉ cho phép các filter an toàn đi vào query */
function sanitizeFilters(filters = {}, role = null) {
  const {
    main_topic,
    sub_topic,
    test_type,
    difficulty,
    status,      // admin có thể dùng
    visibility,  // admin có thể dùng
  } = filters || {};

  const safe = {};
  if (main_topic) safe.main_topic = String(main_topic).trim();
  if (sub_topic) safe.sub_topic = String(sub_topic).trim();

  if (test_type && ['multiple_choice', 'grammar', 'vocabulary'].includes(test_type)) {
    safe.test_type = test_type;
  }
  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
    safe.difficulty = difficulty;
  }

  // Cho phép admin truyền status/visibility phục vụ dashboard
  if (role === 'admin') {
    if (status) safe.status = status;
    if (visibility) safe.visibility = visibility;
  }

  return safe;
}

/** Xây query theo quyền xem (CHO LIST/DETAIL TEST) */
function buildVisibilityQuery(baseQuery = {}, userId = null, role = null) {
  // Admin: thấy tất cả (kể cả deleted/private)
  if (role === 'admin') return baseQuery;

  // User đăng nhập: thấy public (trừ deleted) + tất cả bài của chính mình (trừ deleted)
  if (userId) {
    return {
      $and: [
        {
          $or: [
            { visibility: 'public', status: { $ne: 'deleted' } },
            { created_by: userId },
          ],
        },
        { status: { $ne: 'deleted' } },
      ],
      ...baseQuery,
    };
  }

  // Khách: chỉ public + active
  return { ...baseQuery, visibility: 'public', status: 'active' };
}

/** Kiểm tra ObjectId hợp lệ */
function ensureObjectId(id, name = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ServiceError(`Invalid ${name} format`, 400, 'VALIDATION_ERROR');
  }
}

/* ------------------------- CRUD ------------------------- */

async function createTest(testData) {
  try {
    const { test_title, main_topic, test_type } = testData || {};
    if (!test_title || !main_topic || !test_type) {
      throw new ServiceError(
        'Missing required fields: test_title, main_topic, test_type',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!['multiple_choice', 'grammar', 'vocabulary'].includes(test_type)) {
      throw new ServiceError(
        'Invalid test type. Must be: multiple_choice | grammar | vocabulary',
        400,
        'VALIDATION_ERROR'
      );
    }

    const duplicated = await Test.findOne({
      test_title,
      main_topic: testData.main_topic,
      sub_topic: testData.sub_topic,
      test_type,
      status: 'active',
    });

    if (duplicated) {
      throw new ServiceError(
        'Test title already exists for this topic & type',
        409,
        'DUPLICATE_ERROR'
      );
    }

    const saved = await new Test(testData).save();
    return { message: 'Test created successfully', test: saved };
  } catch (err) {
    if (err instanceof ServiceError) throw err;

    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map((e) => e.message).join(', ');
      throw new ServiceError(`Validation failed: ${msg}`, 400, 'VALIDATION_ERROR');
    }
    if (err.code === 11000) {
      throw new ServiceError('Duplicate key', 409, 'DUPLICATE_ERROR');
    }
    throw new ServiceError('Failed to create test', 500, 'DATABASE_ERROR');
  }
}

/** Get all – áp dụng filter + visibility */
async function getAllTests(filters = {}, userId = null, role = null) {
  try {
    const safe = sanitizeFilters(filters, role);
    delete safe.created_by; // không nhận created_by từ user thường

    const query = buildVisibilityQuery(safe, userId, role);

    const tests = await Test.find(query)
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name')
      .sort({ created_at: -1 });

    return { message: 'Tests fetched successfully', tests };
  } catch (err) {
    if (err.name === 'CastError') {
      throw new ServiceError('Invalid filter parameters', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to fetch tests', 500, 'DATABASE_ERROR');
  }
}

/** Get my tests – chỉ của user */
async function getMyTests(filters = {}, userId) {
  const safe = sanitizeFilters(filters, 'user');
  const query = { ...safe, created_by: userId, status: { $ne: 'deleted' } };

  const tests = await Test.find(query)
    .populate('created_by', 'email full_name')
    .populate('updated_by', 'email full_name')
    .sort({ created_at: -1 });

  return { message: 'Get my tests successfully', tests };
}

/** Danh sách theo type với visibility */
async function getAllByType(testType, userId = null, role = null) {
  if (!['multiple_choice', 'grammar', 'vocabulary'].includes(testType)) {
    throw new ServiceError('Invalid test type', 400, 'VALIDATION_ERROR');
  }

  const query = buildVisibilityQuery({ test_type: testType }, userId, role);

  return Test.find(query)
    .populate('created_by', 'email full_name')
    .populate('updated_by', 'email full_name')
    .sort({ created_at: -1 });
}

const getAllMultipleChoicesTests = (userId, role) => getAllByType('multiple_choice', userId, role);
const getAllGrammarsTests = (userId, role) => getAllByType('grammar', userId, role);
const getAllVocabulariesTests = (userId, role) => getAllByType('vocabulary', userId, role);

/** Get by id – kiểm tra quyền với private & deleted */
async function getTestById(id, userId = null, role = null) {
  try {
    ensureObjectId(id, 'test ID');

    const test = await Test.findById(id)
      .populate('created_by', 'email full_name role')
      .populate('updated_by', 'email full_name');

    if (!test) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

    if (role !== 'admin') {
      if (test.status === 'deleted') {
        throw new ServiceError('Test not found', 404, 'NOT_FOUND');
      }
      if (test.visibility === 'private' && String(test.created_by?._id) !== String(userId)) {
        throw new ServiceError('Access denied to private test', 403, 'ACCESS_DENIED');
      }
    }

    return test;
  } catch (err) {
    if (err instanceof ServiceError) throw err;
    if (err.name === 'CastError') {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to fetch test', 500, 'DATABASE_ERROR');
  }
}

/** Update */
async function updateTest(id, updateData) {
  try {
    ensureObjectId(id, 'test ID');

    const updated = await Test.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    )
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name');

    if (!updated) throw new ServiceError('Test not found', 404, 'NOT_FOUND');
    return updated;
  } catch (err) {
    if (err instanceof ServiceError) throw err;

    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map((e) => e.message).join(', ');
      throw new ServiceError(`Validation failed: ${msg}`, 400, 'VALIDATION_ERROR');
    }
    if (err.name === 'CastError') {
      throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
    }
    throw new ServiceError('Failed to update test', 500, 'DATABASE_ERROR');
  }
}

/** Soft delete */
async function softDeleteTest(id) {
  try {
    ensureObjectId(id, 'test ID');

    const doc = await Test.findByIdAndUpdate(
      id,
      { status: 'deleted', deleted_at: new Date(), updated_at: new Date() },
      { new: true }
    );

    if (!doc) throw new ServiceError('Test not found', 404, 'NOT_FOUND');
    return doc;
  } catch (err) {
    if (err instanceof ServiceError) throw err;
    throw new ServiceError('Failed to delete test', 500, 'DATABASE_ERROR');
  }
}

/** Hard delete + xoá câu hỏi liên quan (✅ transaction + cast ObjectId) */
async function hardDeleteTest(id) {
  const session = await mongoose.startSession();
  try {
    ensureObjectId(id, 'test ID');
    const testObjectId = new mongoose.Types.ObjectId(id);

    session.startTransaction();

    const test = await Test.findById(testObjectId).session(session);
    if (!test) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

    if (test.test_type === 'multiple_choice') {
      await MultipleChoice.deleteMany({ test_id: testObjectId }).session(session);
    } else if (test.test_type === 'grammar') {
      await Grammar.deleteMany({ test_id: testObjectId }).session(session);
    } else if (test.test_type === 'vocabulary') {
      await Vocabulary.deleteMany({ test_id: testObjectId }).session(session);
    }

    // Nếu bạn có collection khác liên quan test (TestResult/Attempt/Bookmark...)
    // thì xoá thêm ở đây:
    // await TestResult.deleteMany({ test_id: testObjectId }).session(session);

    await Test.deleteOne({ _id: testObjectId }).session(session);

    await session.commitTransaction();
    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    if (err instanceof ServiceError) throw err;
    throw new ServiceError('Failed to delete test', 500, 'DATABASE_ERROR');
  } finally {
    session.endSession();
  }
}

/** Search – tôn trọng visibility */
async function searchTests(searchTerm, userId = null, role = null) {
  try {
    if (!searchTerm || !String(searchTerm).trim()) {
      throw new ServiceError('Search term is required', 400, 'VALIDATION_ERROR');
    }
    const q = String(searchTerm).trim();

    let query = {
      $or: [
        { test_title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { main_topic: { $regex: q, $options: 'i' } },
        { sub_topic: { $regex: q, $options: 'i' } },
      ],
    };

    query = buildVisibilityQuery(query, userId, role);

    return Test.find(query)
      .populate('created_by', 'email full_name')
      .populate('updated_by', 'email full_name')
      .sort({ created_at: -1 });
  } catch (err) {
    if (err instanceof ServiceError) throw err;
    throw new ServiceError('Failed to search tests', 500, 'DATABASE_ERROR');
  }
}

/** Topic listing – tôn trọng visibility (GIỮ NGUYÊN) */
async function getTestsByTopic(mainTopic, subTopic = null, userId = null, role = null) {
  if (!mainTopic || !String(mainTopic).trim()) {
    throw new ServiceError('Main topic is required', 400, 'VALIDATION_ERROR');
  }

  const base = { main_topic: String(mainTopic).trim() };
  if (subTopic && String(subTopic).trim()) base.sub_topic = String(subTopic).trim();

  const query = buildVisibilityQuery(base, userId, role);

  return Test.find(query)
    .populate('created_by', 'email full_name')
    .populate('updated_by', 'email full_name')
    .sort({ created_at: -1 });
}

/* =========================================================
   ✅ Guest/User thấy được mọi main_topic/sub_topic
   - Không lọc visibility
   - Vẫn loại deleted
   - Loại null/'' để tránh topic rỗng
========================================================= */
async function distinctTopics({ test_type, field, mainTopic }, userId = null, role = null) {
  if (!['multiple_choice', 'grammar', 'vocabulary'].includes(test_type)) {
    throw new ServiceError('Invalid test type', 400, 'VALIDATION_ERROR');
  }
  if (!['main_topic', 'sub_topic'].includes(field)) {
    throw new ServiceError('Invalid field', 400, 'VALIDATION_ERROR');
  }

  const base = {
    test_type,
    status: { $ne: 'deleted' },
    [field]: { $nin: [null, ''] },
  };

  if (field === 'sub_topic' && mainTopic) {
    base.main_topic = String(mainTopic).trim();
  }

  // ✅ Không lọc theo userId/role => guest/user thấy toàn bộ topics/subtopics
  return Test.distinct(field, base);
}

/* ---------------------- EXPORTS ---------------------- */
module.exports = {
  ServiceError,

  // CRUD
  createTest,
  getAllTests,
  getMyTests,
  getTestById,
  updateTest,
  softDeleteTest,
  hardDeleteTest,

  // search & filter
  searchTests,
  getTestsByTopic,

  // type
  getAllByType,
  getAllMultipleChoicesTests,
  getAllGrammarsTests,
  getAllVocabulariesTests,

  // topics/sub-topics
  getAllMultipleChoicesMainTopics: (uid, role) =>
    distinctTopics({ test_type: 'multiple_choice', field: 'main_topic' }, uid, role),

  getAllMultipleChoicesSubTopicsByMainTopic: (mainTopic, uid, role) =>
    distinctTopics({ test_type: 'multiple_choice', field: 'sub_topic', mainTopic }, uid, role),

  getAllGrammarsMainTopics: (uid, role) =>
    distinctTopics({ test_type: 'grammar', field: 'main_topic' }, uid, role),

  getAllGrammarsSubTopicsByMainTopic: (mainTopic, uid, role) =>
    distinctTopics({ test_type: 'grammar', field: 'sub_topic', mainTopic }, uid, role),

  getAllVocabulariesMainTopics: (uid, role) =>
    distinctTopics({ test_type: 'vocabulary', field: 'main_topic' }, uid, role),

  getAllVocabulariesSubTopicsByMainTopic: (mainTopic, uid, role) =>
    distinctTopics({ test_type: 'vocabulary', field: 'sub_topic', mainTopic }, uid, role),
};
