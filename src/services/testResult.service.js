const mongoose = require('mongoose');
const TestResult = require('../models/TestResult');
const Test = require('../models/Test');
const Topic = require('../models/Topic');

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

      // Support both Array (legacy) and Map (new) formats for correct_answers
      const correctAnswersArray = Array.isArray(a.correct_answers) 
        ? a.correct_answers
        : (typeof a.correct_answers === 'object' && a.correct_answers)
        ? Object.keys(a.correct_answers)
        : [];

      if (
        correctAnswersArray.length === 0 ||
        !correctAnswersArray.every((x) => MC_LABELS.includes(x))
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

  const t = await Test.findById(testId).populate('topic_id', 'name sub_topics').lean();
  if (!t) throw new ServiceError('Test not found', 404, 'NOT_FOUND');

  // Find subtopic name if subtopic_id exists
  let subTopicName = t.sub_topic || '';
  if (t.subtopic_id && t.topic_id?.sub_topics) {
    const subtopic = t.topic_id.sub_topics.find(st => 
      String(st._id) === String(t.subtopic_id)
    );
    subTopicName = subtopic?.name || subTopicName;
  }

  return {
    test_id: testId,
    test_title: t.test_title,
    main_topic: t.topic_id?.name || t.main_topic || '',
    sub_topic: subTopicName,
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
  });
};

/* =====================================================
 * QUERIES
 * ===================================================== */
const getAllTestResults = async (filters = {}, requesterId, role) => {
  const q = {};

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
    'test_snapshot',
    'user_id',
    'answers',
    'total_questions',
    'correct_count',
    'percentage',
    'duration_ms',
    'status',
    'created_at',
    'updated_at',
  ]);

  const updateFields = {};
  for (const k of Object.keys(payload || {})) {
    if (!blocked.has(k)) updateFields[k] = payload[k];
  }

  // Use findByIdAndUpdate to avoid validation issues with old data
  const updatedDoc = await TestResult.findByIdAndUpdate(
    id,
    updateFields,
    { new: true, runValidators: false }
  );
  
  return updatedDoc;
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

  // Use findByIdAndUpdate to avoid validation issues with old data
  const updatedDoc = await TestResult.findByIdAndUpdate(
    id,
    { status: nextStatus },
    { new: true, runValidators: false }
  );
  
  return updatedDoc;
};

/* =====================================================
 * DELETE / RESTORE
 * ===================================================== */
const softDeleteTestResult = async (id, requesterId, role) => {
  ensureObjectId(id);
  const doc = await TestResult.findById(id);
  if (!doc) throw new ServiceError('Not found', 404);

  assertView(doc, requesterId, role);
  
  // Use findByIdAndUpdate to avoid validation issues with old data
  const updatedDoc = await TestResult.findByIdAndUpdate(
    id,
    { status: 'deleted' },
    { new: true, runValidators: false }
  );
  
  return updatedDoc;
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

  // Use findByIdAndUpdate to avoid validation issues with old data
  const updatedDoc = await TestResult.findByIdAndUpdate(
    id,
    { status: 'active' },
    { new: true, runValidators: false }
  );
  
  return updatedDoc;
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
 * LEADERBOARD - TOP USERS BY TIME PERIOD
 * ===================================================== */
const getTopUsersByWeek = async (limit = 3) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await getTopUsersInPeriod(oneWeekAgo, new Date(), limit);
};

const getTopUsersByMonth = async (limit = 3) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return await getTopUsersInPeriod(oneMonthAgo, new Date(), limit);
};

const getTopUsersInPeriod = async (startDate, endDate, limit = 3) => {
  try {
    const pipeline = [
      // Lọc test results trong khoảng thời gian và status active
      {
        $match: {
          status: 'active',
          created_at: {
            $gte: startDate,
            $lte: endDate
          },
          // Loại bỏ các test có vẻ là draft/bỏ dở
          $or: [
            { percentage: { $gt: 0 } },
            { duration_ms: { $gte: 10000 } }
          ]
        }
      },
      // Group theo user_id và tính toán điểm số
      {
        $group: {
          _id: '$user_id',
          total_tests: { $sum: 1 },
          total_questions: { $sum: '$total_questions' },
          total_correct: { $sum: '$correct_count' },
          average_percentage: { $avg: '$percentage' },
          best_percentage: { $max: '$percentage' },
          total_duration_ms: { $sum: '$duration_ms' },
          // Tính điểm tổng hợp: trung bình % * số câu đúng * hệ số số bài test
          composite_score: {
            $sum: {
              $multiply: [
                '$percentage',
                '$correct_count',
                { $add: [1, { $multiply: [0.1, 1] }] } // Bonus nhỏ cho mỗi bài test
              ]
            }
          }
        }
      },
      // Lookup thông tin user
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user_info'
        }
      },
      // Unwind user info
      {
        $unwind: '$user_info'
      },
      // Project fields cần thiết
      {
        $project: {
          _id: 1,
          user_id: '$_id',
          full_name: '$user_info.full_name',
          email: '$user_info.email',
          avatar_url: '$user_info.avatar_url',
          total_tests: 1,
          total_questions: 1,
          total_correct: 1,
          average_percentage: { $round: ['$average_percentage', 1] },
          best_percentage: 1,
          total_duration_ms: 1,
          composite_score: { $round: ['$composite_score', 2] },
          // Tính accuracy rate
          accuracy_rate: {
            $round: [
              {
                $cond: [
                  { $gt: ['$total_questions', 0] },
                  { $multiply: [{ $divide: ['$total_correct', '$total_questions'] }, 100] },
                  0
                ]
              },
              1
            ]
          }
        }
      },
      // Sắp xếp theo composite_score giảm dần
      {
        $sort: { composite_score: -1 }
      },
      // Giới hạn số lượng kết quả
      {
        $limit: limit
      }
    ];

    const results = await TestResult.aggregate(pipeline);
    
    // Thêm ranking
    return results.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

  } catch (error) {
    console.error('❌ Error in getTopUsersInPeriod:', error);
    throw new ServiceError('Failed to fetch leaderboard data', 500, 'INTERNAL_ERROR');
  }
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
  getTopUsersByWeek,
  getTopUsersByMonth,
  getTopUsersInPeriod,

  // Get top performers (highest average scores)
  getTopPerformers: async (limit = 5) => {
    try {
      const pipeline = [
        {
          $match: {
            status: 'active',
            // Chỉ tính những test có ít nhất 3 câu hỏi
            total_questions: { $gte: 3 }
          }
        },
        {
          $group: {
            _id: '$user_id',
            total_tests: { $sum: 1 },
            total_questions: { $sum: '$total_questions' },
            total_correct: { $sum: '$correct_count' },
            average_percentage: { $avg: '$percentage' },
            best_percentage: { $max: '$percentage' },
            total_duration_ms: { $sum: '$duration_ms' }
          }
        },
        // Chỉ lấy users đã làm ít nhất 3 bài test
        {
          $match: {
            total_tests: { $gte: 3 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: '$user_info'
        },
        {
          $project: {
            _id: 0,
            user_id: '$_id',
            full_name: '$user_info.full_name',
            email: '$user_info.email',
            avatar_url: '$user_info.avatar_url',
            total_tests: 1,
            total_questions: 1,
            total_correct: 1,
            average_percentage: { $round: ['$average_percentage', 1] },
            best_percentage: 1,
            consistency_score: {
              // Điểm nhất quán = avg_percentage * (1 - độ lệch chuẩn/100)
              $round: ['$average_percentage', 1]
            }
          }
        },
        {
          $sort: { average_percentage: -1 }
        },
        {
          $limit: limit
        }
      ];

      const results = await TestResult.aggregate(pipeline);
      
      return results.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    } catch (error) {
      console.error('❌ Error in getTopPerformers:', error);
      throw new ServiceError('Failed to fetch top performers', 500, 'INTERNAL_ERROR');
    }
  },

  // Get top users who completed the most tests (by number of test results)
  getTopTestTakers: async (limit = 5) => {
    try {
      const User = require('../models/User');
      
      const pipeline = [
        {
          $match: {
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$user_id',
            total_completed: { $sum: 1 },
            total_questions: { $sum: '$total_questions' },
            total_correct: { $sum: '$correct_count' },
            average_percentage: { $avg: '$percentage' }
          }
        },
        {
          $sort: { total_completed: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: '$user_info'
        },
        {
          $project: {
            _id: 0,
            user_id: '$_id',
            full_name: '$user_info.full_name',
            email: '$user_info.email',
            avatar_url: '$user_info.avatar_url',
            created_at: '$user_info.created_at',
            total_completed: 1,
            total_questions: 1,
            total_correct: 1,
            average_percentage: { $round: ['$average_percentage', 1] }
          }
        }
      ];
      
      const results = await TestResult.aggregate(pipeline);
      
      // Add ranking
      return results.map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    } catch (error) {
      console.error('❌ Error in getTopTestTakers:', error);
      throw new ServiceError('Failed to fetch top test takers', 500, 'INTERNAL_ERROR');
    }
  },
};
