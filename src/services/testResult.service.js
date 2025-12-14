const mongoose = require('mongoose');
const TestResult = require('../models/TestResult');
const Test = require('../models/Test');

/* =====================================================
 * ERROR
 * ===================================================== */
class ServiceError extends Error {
  constructor(message, statusCode = 400, type = 'BAD_REQUEST') {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.type = type;
  }
}

/* =====================================================
 * CONSTANTS
 * ===================================================== */
const ALLOWED_STATUS = ['draft', 'active', 'deleted'];
const MC_LABELS = ['A', 'B', 'C', 'D', 'E'];

/* =====================================================
 * HELPERS
 * ===================================================== */
const ensureObjectId = (id, name = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ServiceError(`Invalid ${name}`, 400, 'INVALID_ID');
  }
};

const normalizeStatus = (status) => {
  const s = status || 'draft';
  if (!ALLOWED_STATUS.includes(s)) {
    throw new ServiceError('Invalid status', 400, 'VALIDATION_ERROR');
  }
  return s;
};

const computeStats = (answers = []) => {
  const total_questions = answers.length;
  const correct_count = answers.filter((a) => a?.is_correct === true).length;
  const percentage =
    total_questions > 0
      ? Math.round((correct_count / total_questions) * 100)
      : 0;

  return { total_questions, correct_count, percentage };
};

/* =====================================================
 * VALIDATE ANSWERS (THE MOST IMPORTANT PART)
 * ===================================================== */
const validateAnswers = (answers) => {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ServiceError('answers must be a non-empty array', 400, 'VALIDATION_ERROR');
  }

  for (const a of answers) {
    if (!a?.question_id) throw new ServiceError('answer.question_id is required');
    if (!a?.question_collection) throw new ServiceError('answer.question_collection is required');
    if (typeof a.is_correct !== 'boolean')
      throw new ServiceError('answer.is_correct must be boolean');

    // ===== MULTIPLE CHOICE =====
    if (a.question_collection === 'multiple_choices') {
      if (typeof a.question_text !== 'string' || !a.question_text.trim())
        throw new ServiceError('MCQ.question_text is required');

      if (!Array.isArray(a.options) || a.options.length < 2)
        throw new ServiceError('MCQ.options must be an array (>=2)');

      for (const o of a.options) {
        if (!MC_LABELS.includes(o.label))
          throw new ServiceError('MCQ.options.label invalid');
        if (typeof o.text !== 'string' || !o.text.trim())
          throw new ServiceError('MCQ.options.text is required');
      }

      if (
        !Array.isArray(a.correct_answers) ||
        a.correct_answers.length === 0 ||
        !a.correct_answers.every((x) => MC_LABELS.includes(x))
      ) {
        throw new ServiceError('MCQ.correct_answers invalid');
      }

      if (
        !Array.isArray(a.user_answers) ||
        !a.user_answers.every((x) => MC_LABELS.includes(x))
      ) {
        throw new ServiceError('MCQ.user_answers invalid');
      }
    }

    // ===== VOCABULARY =====
    else if (a.question_collection === 'vocabularies') {
      if (typeof a.word !== 'string' || !a.word.trim())
        throw new ServiceError('Vocabulary.word is required');

      if (typeof a.meaning !== 'string' || !a.meaning.trim())
        throw new ServiceError('Vocabulary.meaning is required');

      if (typeof a.example_sentence !== 'string' || !a.example_sentence.trim())
        throw new ServiceError('Vocabulary.example_sentence is required');

      if (!['word_to_meaning', 'meaning_to_word'].includes(a.question_mode))
        throw new ServiceError('Vocabulary.question_mode invalid');

      if (typeof a.correct_answer !== 'string')
        throw new ServiceError('Vocabulary.correct_answer is required');

      if (typeof a.user_answer !== 'string')
        throw new ServiceError('Vocabulary.user_answer is required');
    }

    // ===== GENERIC TEXT (grammar, listening, spelling) =====
    else {
      if (typeof a.question_text !== 'string' || !a.question_text.trim())
        throw new ServiceError('Text.question_text is required');

      if (typeof a.correct_answer !== 'string')
        throw new ServiceError('Text.correct_answer is required');

      if (typeof a.user_answer !== 'string')
        throw new ServiceError('Text.user_answer is required');
    }
  }
};

/* =====================================================
 * PERMISSION
 * ===================================================== */
const canView = (doc, requesterId, role) =>
  role === 'admin' || String(doc.user_id) === String(requesterId);

const assertView = (doc, requesterId, role) => {
  if (!canView(doc, requesterId, role)) {
    throw new ServiceError('Access denied', 403, 'ACCESS_DENIED');
  }
};

/* =====================================================
 * SNAPSHOT TEST
 * ===================================================== */
const buildSnapshotFromTest = async (testId) => {
  ensureObjectId(testId, 'test_id');

  const t = await Test.findById(testId).lean();
  if (!t) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

  return {
    test_id: t._id,
    test_title: t.test_title,
    main_topic: t.main_topic,
    sub_topic: t.sub_topic || '',
    test_type: t.test_type,
    difficulty: t.difficulty || 'medium',
  };
};

/* =====================================================
 * CREATE
 * ===================================================== */
const createTestResult = async (payload, requesterRole = null) => {
  const { test_id, user_id, answers } = payload || {};

  if (!test_id) throw new ServiceError('test_id is required');
  if (!user_id) throw new ServiceError('user_id is required');

  ensureObjectId(test_id, 'test_id');
  ensureObjectId(user_id, 'user_id');
  validateAnswers(answers);

  const test_snapshot = payload.test_snapshot
    ? payload.test_snapshot
    : await buildSnapshotFromTest(test_id);

  const stats = computeStats(answers);
  const duration_ms = Number.isFinite(payload.duration_ms)
    ? payload.duration_ms
    : 0;

  // Đảm bảo chỉ admin mới có thể tạo với status 'active'
  // User thường chỉ tạo với status 'draft', sau đó chuyển sang 'active' khi bấm "Lưu kết quả"
  let finalStatus = normalizeStatus(payload.status);
  if (finalStatus === 'active' && requesterRole !== 'admin') {
    finalStatus = 'draft'; // Force 'draft' cho user thường
  }

  return TestResult.create({
    test_id,
    test_snapshot,
    user_id,

    total_questions: stats.total_questions,
    correct_count: stats.correct_count,
    percentage: stats.percentage,
    duration_ms,

    start_time: payload.start_time || new Date(),
    end_time: payload.end_time || new Date(),
    device_info: payload.device_info,
    ip_address: payload.ip_address,

    answers,
    status: finalStatus,
    deleted_at: null,
  });
};

/* =====================================================
 * QUERIES
 * ===================================================== */
const getAllTestResults = async (filters = {}, requesterId, role) => {
  const q = {};

  if (filters.test_id) {
    ensureObjectId(filters.test_id, 'test_id');
    q.test_id = filters.test_id;
  }

  if (filters.user_id) {
    ensureObjectId(filters.user_id, 'user_id');
    q.user_id = filters.user_id;
  }

  if (filters.status) q.status = filters.status;
  if (role !== 'admin') q.user_id = requesterId;

  return TestResult.find(q).sort({ created_at: -1 }).lean();
};

const getTestResultById = async (id, requesterId, role) => {
  ensureObjectId(id);
  const doc = await TestResult.findById(id);
  if (!doc) throw new ServiceError('Test result not found', 404);

  assertView(doc, requesterId, role);
  return doc;
};

const getMyTestResults = async (userId, filters = {}) => {
  ensureObjectId(userId, 'user_id');
  const q = { 
    user_id: userId, 
    status: 'active',
    // Loại bỏ các test result có vẻ là draft/bỏ dở:
    // - Có điểm 0% VÀ thời gian < 10 giây (có thể là test bị bỏ dở)
    $or: [
      { percentage: { $gt: 0 } }, // Có điểm > 0%
      { duration_ms: { $gte: 10000 } } // Hoặc thời gian >= 10 giây
    ]
  };

  if (filters.test_id) {
    ensureObjectId(filters.test_id, 'test_id');
    q.test_id = filters.test_id;
  }

  return TestResult.find(q).sort({ created_at: -1 }).lean();
};

/* =====================================================
 * UPDATE (NON-CRITICAL FIELDS ONLY)
 * ===================================================== */
const updateTestResult = async (id, payload, requesterId, role) => {
  ensureObjectId(id);
  const doc = await TestResult.findById(id);
  if (!doc) throw new ServiceError('Test result not found', 404);

  assertView(doc, requesterId, role);

  const blocked = new Set([
    'test_id',
    'test_snapshot',
    'user_id',
    'answers',
    'total_questions',
    'correct_count',
    'percentage',
    'duration_ms',
    'status',
    'deleted_at',
    'created_at',
    'updated_at',
  ]);

  for (const k of Object.keys(payload || {})) {
    if (!blocked.has(k)) doc[k] = payload[k];
  }

  await doc.save();
  return doc;
};

/* =====================================================
 * STATUS
 * ===================================================== */
const updateStatusById = async (id, status, requesterId, role) => {
  ensureObjectId(id);
  const nextStatus = normalizeStatus(status);

  const doc = await TestResult.findById(id);
  if (!doc) throw new ServiceError('Test result not found', 404);

  const isAdmin = role === 'admin';
  const isOwner = String(doc.user_id) === String(requesterId);

  if (!isAdmin) {
    if (!isOwner)
      throw new ServiceError('Access denied', 403);
    if (!(doc.status === 'draft' && nextStatus === 'active')) {
      throw new ServiceError('Only allow draft -> active', 403);
    }
  }

  doc.status = nextStatus;
  doc.deleted_at = nextStatus === 'deleted' ? new Date() : null;
  await doc.save();
  return doc;
};

/* =====================================================
 * DELETE / RESTORE
 * ===================================================== */
const softDeleteTestResult = async (id, requesterId, role) => {
  ensureObjectId(id);
  const doc = await TestResult.findById(id);
  if (!doc) throw new ServiceError('Not found', 404);

  assertView(doc, requesterId, role);
  doc.status = 'deleted';
  doc.deleted_at = new Date();
  await doc.save();
  return doc;
};

const hardDeleteTestResult = async (id) => {
  ensureObjectId(id);
  const doc = await TestResult.findByIdAndDelete(id);
  if (!doc) throw new ServiceError('Not found', 404);
  return doc;
};

const restoreTestResult = async (id) => {
  ensureObjectId(id);
  const doc = await TestResult.findById(id);
  if (!doc) throw new ServiceError('Not found', 404);

  doc.status = 'active';
  doc.deleted_at = null;
  await doc.save();
  return doc;
};

/* =====================================================
 * STATISTICS
 * ===================================================== */
const getUserStatistics = async (userId) => {
  ensureObjectId(userId, 'user_id');

  // Lấy tất cả test results active của user
  const results = await TestResult.find({
    user_id: userId,
    status: 'active',
  }).lean();

  if (results.length === 0) {
    return {
      total_tests: 0,
      total_questions: 0,
      total_correct: 0,
      average_percentage: 0,
      average_duration_ms: 0,
      tests_by_type: {},
      tests_by_difficulty: {},
      recent_tests: [],
    };
  }

  // Tính tổng
  const total_tests = results.length;
  const total_questions = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);
  const total_correct = results.reduce((sum, r) => sum + (r.correct_count || 0), 0);
  const total_duration_ms = results.reduce((sum, r) => sum + (r.duration_ms || 0), 0);

  // Tính trung bình
  const average_percentage =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
        )
      : 0;
  const average_duration_ms = Math.round(total_duration_ms / results.length);

  // Thống kê theo test_type
  const tests_by_type = {};
  results.forEach((r) => {
    const type = r.test_snapshot?.test_type || 'unknown';
    tests_by_type[type] = (tests_by_type[type] || 0) + 1;
  });

  // Thống kê theo difficulty
  const tests_by_difficulty = {};
  results.forEach((r) => {
    const diff = r.test_snapshot?.difficulty || 'medium';
    tests_by_difficulty[diff] = (tests_by_difficulty[diff] || 0) + 1;
  });

  // Lấy 10 test gần nhất
  const recent_tests = results
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map((r) => ({
      _id: r._id,
      test_id: r.test_id,
      test_title: r.test_snapshot?.test_title,
      test_type: r.test_snapshot?.test_type,
      percentage: r.percentage,
      total_questions: r.total_questions,
      correct_count: r.correct_count,
      duration_ms: r.duration_ms,
      created_at: r.created_at,
    }));

  return {
    total_tests,
    total_questions,
    total_correct,
    average_percentage,
    average_duration_ms,
    tests_by_type,
    tests_by_difficulty,
    recent_tests,
  };
};

/* =====================================================
 * EXPORT
 * ===================================================== */
module.exports = {
  ServiceError,
  createTestResult,
  getAllTestResults,
  getTestResultById,
  getMyTestResults,
  updateTestResult,
  updateStatusById,
  softDeleteTestResult,
  hardDeleteTestResult,
  restoreTestResult,
  getUserStatistics,
};
