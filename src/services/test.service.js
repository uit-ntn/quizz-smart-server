// services/test.service.js
const mongoose = require('mongoose');
const Test = require('../models/Test');
const User = require('../models/User');
const MultipleChoice = require('../models/MultipleChoice');
const Vocabulary = require('../models/Vocabulary');
const Grammar = require('../models/Grammar');
const Topic = require('../models/Topic');

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
    test_type,
    difficulty,
    status,      // admin có thể dùng
    visibility,  // admin có thể dùng
    // ✅ Topic references (required now)
    topic_id,
    subtopic_id,
    created_by,
    limit,
    offset,
    sort_by,
    sort_order
  } = filters || {};

  const safe = {};
  
  // ✅ Topic references (required now)
  if (topic_id && mongoose.Types.ObjectId.isValid(topic_id)) {
    safe.topic_id = new mongoose.Types.ObjectId(topic_id);
  }
  if (subtopic_id && mongoose.Types.ObjectId.isValid(subtopic_id)) {
    safe.subtopic_id = new mongoose.Types.ObjectId(subtopic_id);
  }
  if (created_by && mongoose.Types.ObjectId.isValid(created_by)) {
    safe.created_by = new mongoose.Types.ObjectId(created_by);
  }

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

/** Lấy model câu hỏi theo type */
function getQuestionModelByType(testType) {
  if (testType === 'multiple_choice') return MultipleChoice;
  if (testType === 'grammar') return Grammar;
  if (testType === 'vocabulary') return Vocabulary;
  throw new ServiceError('Unsupported test type for this operation', 400, 'VALIDATION_ERROR');
}

/* ------------------------- CRUD ------------------------- */

async function createTest(testData) {
  try {
    const { test_title, topic_id, subtopic_id, test_type, created_by, updated_by } = testData || {};
    if (!test_title || !topic_id || !subtopic_id || !test_type) {
      throw new ServiceError(
        'Missing required fields: test_title, topic_id, subtopic_id, test_type',
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
      topic_id: testData.topic_id,
      subtopic_id: testData.subtopic_id,
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

    // ✅ FIX: Lấy full_name từ User để lưu vào test
    let created_by_full_name = null;
    let updated_by_full_name = null;

    if (created_by) {
      const creator = await User.findById(created_by).select('full_name').lean();
      if (creator) created_by_full_name = creator.full_name;
    }

    if (updated_by) {
      const updater = await User.findById(updated_by).select('full_name').lean();
      if (updater) updated_by_full_name = updater.full_name;
    }

    const saved = await new Test({
      ...testData,
      created_by_full_name,
      updated_by_full_name,
    }).save();
    
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
      .populate('topic_id', 'name avatar_url sub_topics')
      .sort({ created_at: -1 });

    // Add backward compatibility fields
    const testsWithBackwardCompat = tests.map(test => {
      const testObj = test.toObject();
      if (testObj.topic_id && typeof testObj.topic_id === 'object') {
        testObj.main_topic = testObj.topic_id.name || testObj.main_topic || '';
        
        // Find subtopic name if subtopic_id exists
        if (testObj.subtopic_id && testObj.topic_id.sub_topics) {
          const subtopic = testObj.topic_id.sub_topics.find(st => 
            String(st._id) === String(testObj.subtopic_id)
          );
          testObj.sub_topic = subtopic?.name || testObj.sub_topic || '';
        }
      }
      return testObj;
    });

    return { message: 'Tests fetched successfully', tests: testsWithBackwardCompat };
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
      .populate('updated_by', 'email full_name')
      .populate('topic_id', 'name sub_topics');

    if (!test) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

    if (role !== 'admin') {
      if (test.status === 'deleted') {
        throw new ServiceError('Test not found', 404, 'NOT_FOUND');
      }
      if (test.visibility === 'private' && String(test.created_by?._id) !== String(userId)) {
        throw new ServiceError('Access denied to private test', 403, 'ACCESS_DENIED');
      }
    }

    // Add backward compatibility fields
    const testObj = test.toObject();
    if (testObj.topic_id && typeof testObj.topic_id === 'object') {
      testObj.main_topic = testObj.topic_id.name || testObj.main_topic || '';
      
      // Find subtopic name if subtopic_id exists
      if (testObj.subtopic_id && testObj.topic_id.sub_topics) {
        const subtopic = testObj.topic_id.sub_topics.find(st => 
          String(st._id) === String(testObj.subtopic_id)
        );
        testObj.sub_topic = subtopic?.name || testObj.sub_topic || '';
      }
    }

    return testObj;
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

    // ✅ FIX: Lấy full_name từ User nếu có updated_by
    let updated_by_full_name = null;
    if (updateData.updated_by) {
      const updater = await User.findById(updateData.updated_by).select('full_name').lean();
      if (updater) updated_by_full_name = updater.full_name;
    }

    const updated = await Test.findByIdAndUpdate(
      id,
      { 
        ...updateData, 
        updated_by_full_name: updated_by_full_name || undefined, // Chỉ update nếu có giá trị
        updated_at: new Date() 
      },
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

/** Merge multiple tests into target test (move questions + mark sources deleted) */
async function mergeTests({ targetTestId, sourceTestIds = [], userId = null, userRole = null, updatedBy = null }) {
  const session = await mongoose.startSession();
  try {
    if (!targetTestId || !Array.isArray(sourceTestIds) || sourceTestIds.length === 0) {
      throw new ServiceError('targetTestId and sourceTestIds are required', 400, 'VALIDATION_ERROR');
    }

    const uniqueSourceIds = [...new Set(sourceTestIds.filter((id) => id && id !== targetTestId))];
    if (uniqueSourceIds.length === 0) {
      throw new ServiceError('sourceTestIds must contain at least one test different from target', 400, 'VALIDATION_ERROR');
    }

    ensureObjectId(targetTestId, 'targetTestId');
    uniqueSourceIds.forEach((id) => ensureObjectId(id, 'sourceTestId'));

    session.startTransaction();

    const allIds = [targetTestId, ...uniqueSourceIds].map((id) => new mongoose.Types.ObjectId(id));
    const tests = await Test.find({ _id: { $in: allIds } }).session(session);

    const targetTest = tests.find((t) => t._id.toString() === targetTestId);
    if (!targetTest || targetTest.status === 'deleted') {
      throw new ServiceError('Target test not found', 404, 'NOT_FOUND');
    }

    const sourceTests = uniqueSourceIds.map((id) => {
      const found = tests.find((t) => t._id.toString() === id);
      if (!found || found.status === 'deleted') {
        throw new ServiceError(`Source test ${id} not found`, 404, 'NOT_FOUND');
      }
      return found;
    });

    const testType = targetTest.test_type;
    sourceTests.forEach((t) => {
      if (t.test_type !== testType) {
        throw new ServiceError('All tests must share the same test_type', 400, 'VALIDATION_ERROR');
      }
    });

    // Permission: admin or owner of all involved tests
    if (userRole !== 'admin') {
      if (!userId) {
        throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
      }
      const ownsAll = [targetTest, ...sourceTests].every(
        (t) => String(t.created_by) === String(userId)
      );
      if (!ownsAll) {
        throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    const QuestionModel = getQuestionModelByType(testType);
    let movedQuestions = 0;
    const now = new Date();

    // Move questions from each source to target
    for (const src of sourceTests) {
      const srcId = src._id;
      const count = await QuestionModel.countDocuments({ test_id: srcId }).session(session);
      if (count > 0) {
        await QuestionModel.updateMany(
          { test_id: srcId },
          { $set: { test_id: targetTest._id, updated_at: now } },
          { session }
        );
      }
      movedQuestions += count;
    }

    // Recalculate totals
    const targetTotal = await QuestionModel.countDocuments({ test_id: targetTest._id }).session(session);
    const targetUpdate = { total_questions: targetTotal, updated_at: now };
    if (updatedBy) targetUpdate.updated_by = updatedBy;

    await Test.findByIdAndUpdate(targetTest._id, { $set: targetUpdate }, { session, new: true });

    // Delete source tests (hard) after questions were moved
    if (sourceTests.length) {
      await Test.deleteMany(
        { _id: { $in: sourceTests.map((t) => t._id) } },
        { session }
      );
    }

    await session.commitTransaction();

    return {
      message: 'Tests merged successfully',
      target_test_id: targetTest._id,
      merged_source_ids: sourceTests.map((t) => t._id),
      moved_questions: movedQuestions,
      target_total_questions: targetTotal,
    };
  } catch (err) {
    await session.abortTransaction();
    if (err instanceof ServiceError) throw err;
    throw new ServiceError('Failed to merge tests', 500, 'DATABASE_ERROR');
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

    // ✅ Search in Topic model first to get matching topic_ids and subtopic_ids
    const topicMatches = await Topic.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { 'sub_topics.name': { $regex: q, $options: 'i' } }
      ]
    }).select('_id sub_topics').lean();

    const topicIds = [];
    const subtopicIds = [];
    
    topicMatches.forEach(topic => {
      topicIds.push(topic._id);
      if (topic.sub_topics) {
        topic.sub_topics.forEach(subtopic => {
          if (subtopic.name.match(new RegExp(q, 'i'))) {
            subtopicIds.push(subtopic._id);
          }
        });
      }
    });

    let query = {
      $or: [
        { test_title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        ...(topicIds.length > 0 ? [{ topic_id: { $in: topicIds } }] : []),
        ...(subtopicIds.length > 0 ? [{ subtopic_id: { $in: subtopicIds } }] : [])
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
async function getTestsByTopic(topicName, subtopicName = null, userId = null, role = null) {
  if (!topicName || !String(topicName).trim()) {
    throw new ServiceError('Topic name is required', 400, 'VALIDATION_ERROR');
  }

  // ✅ Find topic by name to get topic_id and subtopic_id
  const topic = await Topic.findOne({ name: String(topicName).trim() }).lean();
  
  if (!topic) {
    throw new ServiceError('Topic not found', 404, 'NOT_FOUND');
  }

  const base = { topic_id: topic._id };
  
  if (subtopicName && String(subtopicName).trim()) {
    const subtopic = topic.sub_topics.find(st => st.name === String(subtopicName).trim());
    if (!subtopic) {
      throw new ServiceError('Subtopic not found', 404, 'NOT_FOUND');
    }
    base.subtopic_id = subtopic._id;
  }

  const query = buildVisibilityQuery(base, userId, role);

  return Test.find(query)
    .populate('created_by', 'email full_name')
    .populate('updated_by', 'email full_name')
    .populate('topic_id', 'name avatar_url')
    .sort({ created_at: -1 });
}

/* =========================================================
   ✅ Topic statistics (main_topic / sub_topic) - NEW VERSION
   - Sử dụng collection Topic mới để lấy danh sách topics/subtopics
   - Tính toán test count và question count từ collection Test
   - Tôn trọng visibility giống list test
   - Response format giữ nguyên để FE không cần sửa
========================================================= */
async function getTopicStats({ test_type, field, mainTopic }, userId = null, role = null) {
  if (!['multiple_choice', 'grammar', 'vocabulary'].includes(test_type)) {
    throw new ServiceError('Invalid test type', 400, 'VALIDATION_ERROR');
  }
  if (!['main_topic', 'sub_topic'].includes(field)) {
    throw new ServiceError('Invalid field', 400, 'VALIDATION_ERROR');
  }

  if (field === 'main_topic') {
    // Lấy danh sách main topics từ collection Topic với đầy đủ thông tin
    const topics = await Topic.find({ active: true }).select('name active views avatar_url sub_topics created_at updated_at').lean();
    
    // Tính toán test count và question count cho mỗi main topic
    const result = await Promise.all(
      topics.map(async (topic) => {
        // ✅ Use topic_id instead of main_topic
        const baseMatch = {
          test_type,
          status: { $ne: 'deleted' },
          topic_id: topic._id
        };
        
        // Áp dụng visibility
        const match = buildVisibilityQuery(baseMatch, userId, role);
        
        // Aggregate để tính total tests và total questions
        const stats = await Test.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total_tests: { $sum: 1 },
              total_questions: { $sum: { $ifNull: ['$total_questions', 0] } }
            }
          }
        ]);
        
        const { total_tests = 0, total_questions = 0 } = stats[0] || {};
        
        // Đếm active subtopics
        const activeSubtopics = topic.sub_topics ? topic.sub_topics.filter(st => st.active) : [];
        
        return {
          main_topic: topic.name,
          active: topic.active,
          views: topic.views || 0,
          avatar_url: topic.avatar_url || null,
          total_tests,
          total_questions,
          total_subtopics: activeSubtopics.length,
          created_at: topic.created_at,
          updated_at: topic.updated_at
        };
      })
    );
    
    // Chỉ trả về topics có ít nhất 1 test hoặc subtopic
    return result.filter(item => item.total_tests > 0 || item.total_subtopics > 0)
                 .sort((a, b) => a.main_topic.localeCompare(b.main_topic));
                 
  } else {
    // field === 'sub_topic'
    if (!mainTopic || !String(mainTopic).trim()) {
      throw new ServiceError('Main topic is required for sub_topic stats', 400, 'VALIDATION_ERROR');
    }
    
    const mainTopicName = String(mainTopic).trim();
    
    // Lấy topic và subtopics từ collection Topic với đầy đủ thông tin
    const topic = await Topic.findOne({ 
      name: mainTopicName, 
      active: true 
    }).select('sub_topics').lean();
    
    if (!topic || !topic.sub_topics) {
      return [];
    }
    
    // Lọc active subtopics
    const activeSubtopics = topic.sub_topics.filter(st => st.active);
    
    // Tính toán test count và question count cho mỗi subtopic
    const result = await Promise.all(
      activeSubtopics.map(async (subtopic) => {
        // ✅ Use topic_id and subtopic_id instead of main_topic/sub_topic
        const baseMatch = {
          test_type,
          status: { $ne: 'deleted' },
          topic_id: topic._id,
          subtopic_id: subtopic._id
        };
        
        // Áp dụng visibility
        const match = buildVisibilityQuery(baseMatch, userId, role);
        
        // Aggregate để tính total tests và total questions
        const stats = await Test.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total_tests: { $sum: 1 },
              total_questions: { $sum: { $ifNull: ['$total_questions', 0] } }
            }
          }
        ]);
        
        const { total_tests = 0, total_questions = 0 } = stats[0] || {};
        
        return {
          main_topic: mainTopicName,
          sub_topic: subtopic.name,
          subtopic_id: subtopic._id,
          active: subtopic.active,
          views: subtopic.views || 0,
          total_tests,
          total_questions
        };
      })
    );
    
    // Chỉ trả về subtopics có ít nhất 1 test
    return result.filter(item => item.total_tests > 0)
                 .sort((a, b) => a.sub_topic.localeCompare(b.sub_topic));
  }
}

/* =====================================================
 * GET NEWEST TESTS (most recently created)
 * ===================================================== */
async function getNewestTests(filters = {}, limit = 10) {
  try {
    const { topic_id, subtopic_id, test_type } = filters;
    
    // Build query
    const query = {
      status: { $ne: 'deleted' }, // Exclude deleted tests
      visibility: { $in: ['public', 'private'] }
    };

    // Filter by topic
    if (topic_id) {
      query.topic_id = new mongoose.Types.ObjectId(topic_id);
    }

    // Filter by subtopic
    if (subtopic_id) {
      query.subtopic_id = new mongoose.Types.ObjectId(subtopic_id);
    }

    // Filter by test type
    if (test_type) {
      query.test_type = test_type;
    }

    const tests = await Test.find(query)
      .populate('created_by', 'full_name email')
      .populate('topic_id', 'name avatar_url')
      .sort({ created_at: -1 }) // Sort by newest first
      .limit(limit)
      .lean();

    // Transform to match expected format
    return tests.map(test => ({
      test_id: test._id,
      _id: test._id,
      id: test._id,
      test_title: test.test_title,
      test_type: test.test_type,
      difficulty: test.difficulty || 'medium',
      visibility: test.visibility || 'public',
      main_topic: test.topic_id?.name || test.main_topic || '',
      sub_topic: test.sub_topic || '',
      topic_id: test.topic_id?._id || test.topic_id,
      subtopic_id: test.subtopic_id,
      total_questions: test.total_questions || 0,
      time_limit_minutes: test.time_limit_minutes || 0,
      created_at: test.created_at,
      created_by_full_name: test.created_by?.full_name || 'Ẩn danh',
      description: test.description || '',
      status: test.status || 'active'
    }));
  } catch (error) {
    console.error('Error getting newest tests:', error);
    throw new ServiceError('Failed to fetch newest tests', 500, 'DATABASE_ERROR');
  }
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
  mergeTests,

  // search & filter
  searchTests,
  getTestsByTopic,

  // type
  getAllByType,
  getAllMultipleChoicesTests,
  getAllGrammarsTests,
  getAllVocabulariesTests,

  // Get top tests that were taken the most
  getTopTakenTests: async (filters = {}, limit = 5) => {
    const TestResult = require('../models/TestResult');
    
    const { topic_id, subtopic_id, main_topic, sub_topic } = filters;
    
    // Build match query for test results
    const matchQuery = {
      status: 'active'
    };
    
    // ✅ Support both new (topic_id/subtopic_id) and old (main_topic/sub_topic) filters
    if (topic_id) {
      matchQuery['test_snapshot.topic_id'] = new mongoose.Types.ObjectId(topic_id);
    } else if (main_topic) {
      matchQuery['test_snapshot.main_topic'] = String(main_topic).trim();
    }
    
    if (subtopic_id) {
      matchQuery['test_snapshot.subtopic_id'] = new mongoose.Types.ObjectId(subtopic_id);
    } else if (sub_topic) {
      matchQuery['test_snapshot.sub_topic'] = String(sub_topic).trim();
    }
    
    const pipeline = [
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$test_snapshot.test_id',
          test_title: { $first: '$test_snapshot.test_title' },
          main_topic: { $first: '$test_snapshot.main_topic' },
          sub_topic: { $first: '$test_snapshot.sub_topic' },
          test_type: { $first: '$test_snapshot.test_type' },
          difficulty: { $first: '$test_snapshot.difficulty' },
          taken_count: { $sum: 1 },
          average_percentage: { $avg: '$percentage' },
          total_questions_answered: { $sum: '$total_questions' }
        }
      },
      {
        $sort: { taken_count: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          test_id: '$_id',
          test_title: 1,
          main_topic: 1,
          sub_topic: 1,
          test_type: 1,
          difficulty: 1,
          taken_count: 1,
          average_percentage: { $round: ['$average_percentage', 2] },
          total_questions_answered: 1
        }
      }
    ];
    
    return await TestResult.aggregate(pipeline);
  },

  // Get top tests with highest average scores
  getTopScoringTests: async (filters = {}, limit = 5) => {
    const TestResult = require('../models/TestResult');
    
    const { topic_id, subtopic_id, main_topic, sub_topic, test_type } = filters;
    
    const matchQuery = {
      status: 'active',
      total_questions: { $gte: 3 } // Chỉ tính test có ít nhất 3 câu
    };
    
    // ✅ Support both new (topic_id/subtopic_id) and old (main_topic/sub_topic) filters
    if (topic_id) {
      matchQuery['test_snapshot.topic_id'] = new mongoose.Types.ObjectId(topic_id);
    } else if (main_topic) {
      matchQuery['test_snapshot.main_topic'] = String(main_topic).trim();
    }
    
    if (subtopic_id) {
      matchQuery['test_snapshot.subtopic_id'] = new mongoose.Types.ObjectId(subtopic_id);
    } else if (sub_topic) {
      matchQuery['test_snapshot.sub_topic'] = String(sub_topic).trim();
    }
    if (test_type) {
      matchQuery['test_snapshot.test_type'] = test_type;
    }
    
    const pipeline = [
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$test_snapshot.test_id',
          test_title: { $first: '$test_snapshot.test_title' },
          main_topic: { $first: '$test_snapshot.main_topic' },
          sub_topic: { $first: '$test_snapshot.sub_topic' },
          test_type: { $first: '$test_snapshot.test_type' },
          difficulty: { $first: '$test_snapshot.difficulty' },
          total_attempts: { $sum: 1 },
          average_percentage: { $avg: '$percentage' },
          highest_score: { $max: '$percentage' },
          total_questions: { $first: '$total_questions' }
        }
      },
      // Chỉ lấy test có ít nhất 5 lần làm
      {
        $match: {
          total_attempts: { $gte: 5 }
        }
      },
      {
        $sort: { average_percentage: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          test_id: '$_id',
          test_title: 1,
          main_topic: 1,
          sub_topic: 1,
          test_type: 1,
          difficulty: 1,
          total_attempts: 1,
          average_percentage: { $round: ['$average_percentage', 1] },
          highest_score: 1,
          total_questions: 1
        }
      }
    ];
    
    return await TestResult.aggregate(pipeline);
  },

  // Get test attempt count
  getTestAttemptCount: async (testId) => {
    try {
      ensureObjectId(testId, 'test_id');
      
      const TestResult = require('../models/TestResult');
      const count = await TestResult.countDocuments({
        test_id: testId,
        status: 'active'
      });
      
      return count;
    } catch (error) {
      console.error('Error getting test attempt count:', error);
      return 0;
    }
  },

  // Get topic attempt count (total attempts for all tests in a main topic)
  getTopicAttemptCount: async (topicIdentifier, testType = null) => {
    try {
      const TestResult = require('../models/TestResult');
      
      let matchQuery = {
        status: 'active'
      };
      
      // ✅ Support both topic_id (ObjectId) and topic name (string)
      if (mongoose.Types.ObjectId.isValid(topicIdentifier)) {
        matchQuery['test_snapshot.topic_id'] = new mongoose.Types.ObjectId(topicIdentifier);
      } else {
        matchQuery['test_snapshot.main_topic'] = String(topicIdentifier).trim();
      }
      
      if (testType) {
        matchQuery['test_snapshot.test_type'] = String(testType).trim();
      }
      
      const count = await TestResult.countDocuments(matchQuery);
      return count;
    } catch (error) {
      console.error('Error getting topic attempt count:', error);
      return 0;
    }
  },

  // Get test with attempt count
  getTestWithStats: async (testId, userId = null, role = null) => {
    try {
      const test = await testService.getTestById(testId, userId, role);
      const attemptCount = await testService.getTestAttemptCount(testId);
      
      return {
        ...test,
        attempt_count: attemptCount
      };
    } catch (error) {
      throw error;
    }
  },

  // ✅ NEW: Migration helper methods
  getTestsByTopicName: async (topicName, subtopicName = null) => {
    try {
      // ✅ Find topic by name to get topic_id and subtopic_id
      const topic = await Topic.findOne({ name: String(topicName).trim() }).lean();
      if (!topic) {
        return [];
      }

      const query = { topic_id: topic._id, status: { $ne: 'deleted' } };
      
      if (subtopicName) {
        const subtopic = topic.sub_topics.find(st => st.name === String(subtopicName).trim());
        if (!subtopic) {
          return [];
        }
        query.subtopic_id = subtopic._id;
      }
      
      return await Test.find(query)
        .select('test_title test_type total_questions topic_id subtopic_id')
        .populate('topic_id', 'name')
        .lean();
    } catch (error) {
      throw new ServiceError('Failed to get tests by topic name', 500, 'DATABASE_ERROR');
    }
  },

  updateTestTopicReferences: async (testId, topicId, subtopicId) => {
    try {
      const updateData = { topic_id: topicId };
      if (subtopicId) {
        updateData.subtopic_id = subtopicId;
      }
      
      return await Test.findByIdAndUpdate(testId, updateData, { new: true });
    } catch (error) {
      throw new ServiceError('Failed to update test topic references', 500, 'DATABASE_ERROR');
    }
  },

  getTopicStatsFromTests: async () => {
    try {
      return await Test.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        {
          $group: {
            _id: '$topic_id',
            total_tests: { $sum: 1 },
            total_questions: { $sum: '$total_questions' },
            test_types: { $addToSet: '$test_type' },
            subtopics: { $addToSet: '$subtopic_id' },
            vocabulary_tests: {
              $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, 1, 0] }
            },
            multiple_choice_tests: {
              $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, 1, 0] }
            },
            grammar_tests: {
              $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      throw new ServiceError('Failed to get topic stats from tests', 500, 'DATABASE_ERROR');
    }
  },

  // Get newest tests (most recently created)
  getNewestTests,
};
