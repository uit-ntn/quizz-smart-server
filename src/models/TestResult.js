const mongoose = require('mongoose');

// Schema lưu từng câu trả lời
const answerSchema = new mongoose.Schema({
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    question_collection: {
        type: String,
        required: true,
        enum: ['multiple_choices', 'grammars', 'vocabularies']
    },

    // Thông tin snapshot để vẫn hiển thị được nếu câu hỏi bị sửa / xóa
    question_text: { type: String, required: true },
    correct_answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Có thể là 'A' hoặc ['A','B']
    user_answer: { type: mongoose.Schema.Types.Mixed, required: true },
    is_correct: { type: Boolean, required: true }
}, { _id: false });

// Schema tổng kết kết quả test
const testResultSchema = new mongoose.Schema({
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Thống kê
    total_questions: { type: Number, required: true },
    correct_count: { type: Number, required: true },
    percentage: { type: Number, required: true },
    duration_ms: { type: Number, required: true },

    // Thông tin test run
    start_time: { type: Date, default: Date.now },
    end_time: { type: Date },
    device_info: { type: String },
    ip_address: { type: String },

    // Mảng câu trả lời chi tiết
    answers: [answerSchema],

    // Trạng thái điều khiển hiển thị
    status: {
        type: String,
        enum: ['draft', 'active', 'deleted'],
        default: 'draft'
    },
    deleted_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Soft delete middleware
testResultSchema.methods.softDelete = async function () {
    this.status = 'deleted';
    this.deleted_at = new Date();
    await this.save();
};

module.exports = mongoose.model('TestResult', testResultSchema, 'test_results');
