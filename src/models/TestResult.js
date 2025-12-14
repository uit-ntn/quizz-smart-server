const mongoose = require('mongoose');

/* =====================================================
 * OPTION SNAPSHOT (dùng cho Multiple Choice)
 * ===================================================== */
const optionSnapshotSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

/* =====================================================
 * MULTIPLE CHOICE ANSWER SNAPSHOT
 * ===================================================== */
const multipleChoiceAnswerSchema = new mongoose.Schema(
  {
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    question_collection: {
      type: String,
      enum: ['multiple_choices'],
      required: true,
    },

    // 🔒 Snapshot câu hỏi
    question_text: {
      type: String,
      required: true,
    },

    // 🔒 Snapshot toàn bộ đáp án
    options: {
      type: [optionSnapshotSchema],
      required: true,
    },

    // 🔒 Snapshot đáp án đúng
    correct_answers: [
      {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E'],
        required: true,
      },
    ],

    // Đáp án user chọn
    user_answers: [
      {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E'],
        required: true,
      },
    ],

    is_correct: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

/* =====================================================
 * VOCABULARY ANSWER SNAPSHOT
 * ===================================================== */
const vocabularyAnswerSchema = new mongoose.Schema(
  {
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    question_collection: {
      type: String,
      enum: ['vocabularies'],
      required: true,
    },

    // 🔒 Snapshot vocab
    word: {
      type: String,
      required: true,
    },

    meaning: {
      type: String,
      required: true,
    },

    example_sentence: {
      type: String,
      required: true,
    },

    // Dạng câu hỏi để FE render
    question_mode: {
      type: String,
      enum: ['word_to_meaning', 'meaning_to_word'],
      required: true,
    },

    correct_answer: {
      type: String,
      required: true,
    },

    user_answer: {
      type: String,
      required: true,
    },

    is_correct: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

/* =====================================================
 * GENERIC TEXT ANSWER (Grammar / Listening / Spelling)
 * ===================================================== */
const textAnswerSchema = new mongoose.Schema(
  {
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    question_collection: {
      type: String,
      required: true,
    },

    question_text: {
      type: String,
      required: true,
    },

    correct_answer: {
      type: String,
      required: true,
    },

    user_answer: {
      type: String,
      required: true,
    },

    is_correct: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

/* =====================================================
 * TEST SNAPSHOT (đóng băng bài test)
 * ===================================================== */
const testSnapshotSchema = new mongoose.Schema(
  {
    test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },

    test_title: {
      type: String,
      required: true,
    },

    main_topic: {
      type: String,
      required: true,
    },

    sub_topic: {
      type: String,
      default: '',
    },

    test_type: {
      type: String,
      enum: ['multiple_choice', 'grammar', 'vocabulary', 'spelling', 'listening'],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { _id: false }
);

/* =====================================================
 * MAIN TEST RESULT SCHEMA
 * ===================================================== */
const testResultSchema = new mongoose.Schema(
  {
    // giữ để query nhanh + backward compatibility
    test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },

    // 🔒 Snapshot test
    test_snapshot: {
      type: testSnapshotSchema,
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Thống kê
    total_questions: {
      type: Number,
      required: true,
    },

    correct_count: {
      type: Number,
      required: true,
    },

    percentage: {
      type: Number,
      required: true,
    },

    duration_ms: {
      type: Number,
      required: true,
    },

    // Thông tin test run
    start_time: {
      type: Date,
      default: Date.now,
    },

    end_time: {
      type: Date,
    },

    device_info: {
      type: String,
    },

    ip_address: {
      type: String,
    },

    // 🔥 Answers snapshot (đa hình)
    answers: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },

    // Trạng thái
    status: {
      type: String,
      enum: ['draft', 'active', 'deleted'],
      default: 'draft',
      index: true,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

/* =====================================================
 * INDEXES
 * ===================================================== */
testResultSchema.index({
  test_id: 1,
  user_id: 1,
  status: 1,
  created_at: -1,
});

/* =====================================================
 * METHODS
 * ===================================================== */
testResultSchema.methods.softDelete = async function () {
  this.status = 'deleted';
  this.deleted_at = new Date();
  await this.save();
};

/* =====================================================
 * EXPORT
 * ===================================================== */
module.exports = mongoose.model(
  'TestResult',
  testResultSchema,
  'test_results'
);
