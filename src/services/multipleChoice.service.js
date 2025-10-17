const MultipleChoice = require('../models/MultipleChoice');

class MultipleChoiceService {
    // Create new multiple choice question
    async createMultipleChoice(questionData) {
        try {
            const question = new MultipleChoice(questionData);
            return await question.save();
        } catch (error) {
            throw error;
        }
    }

    // Get all multiple choice questions with optional filters
    async getAllMultipleChoices(filters = {}) {
        try {
            const query = { ...filters };
            return await MultipleChoice.find(query)
                .populate('created_by', 'username full_name')
                .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Get multiple choice question by ID
    async getMultipleChoiceById(id) {
        try {
            return await MultipleChoice.findById(id)
                .populate('created_by', 'username full_name')
                .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Update multiple choice question
    async updateMultipleChoice(id, updateData) {
        try {
            return await MultipleChoice.findByIdAndUpdate(
                id,
                { ...updateData, updated_at: new Date() },
                { new: true }
            ).populate('created_by', 'username full_name')
             .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Delete multiple choice question
    async deleteMultipleChoice(id) {
        try {
            return await MultipleChoice.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }

    // Search multiple choice questions
    async searchMultipleChoices(searchTerm) {
        try {
            return await MultipleChoice.find({
                $or: [
                    { question_text: { $regex: searchTerm, $options: 'i' } },
                    { main_topic: { $regex: searchTerm, $options: 'i' } },
                    { sub_topic: { $regex: searchTerm, $options: 'i' } }
                ]
            }).populate('created_by', 'username full_name')
             .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Get questions by topic
    async getQuestionsByTopic(mainTopic, subTopic = null) {
        try {
            const query = { main_topic: mainTopic };
            if (subTopic) {
                query.sub_topic = subTopic;
            }
            return await MultipleChoice.find(query)
                .populate('created_by', 'username full_name')
                .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Get random questions for quiz
    async getRandomQuestions(count = 10, filters = {}) {
        try {
            const questions = await MultipleChoice.aggregate([
                { $match: { status: 'active', ...filters } },
                { $sample: { size: count } }
            ]);
            return questions;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MultipleChoiceService();