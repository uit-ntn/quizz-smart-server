const Grammar = require('../models/Grammar');

class GrammarService {
    // Create new grammar question
    async createGrammar(grammarData) {
        try {
            const grammar = new Grammar(grammarData);
            return await grammar.save();
        } catch (error) {
            throw error;
        }
    }

    // Get all grammar questions with optional filters
    async getAllGrammars(filters = {}) {
        try {
            const query = { ...filters };
            return await Grammar.find(query)
                .populate('created_by', 'username full_name')
                .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Get grammar question by ID
    async getGrammarById(id) {
        try {
            return await Grammar.findById(id)
                .populate('created_by', 'username full_name')
                .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Update grammar question
    async updateGrammar(id, updateData) {
        try {
            return await Grammar.findByIdAndUpdate(
                id,
                { ...updateData, updated_at: new Date() },
                { new: true }
            ).populate('created_by', 'username full_name')
             .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Delete grammar question
    async deleteGrammar(id) {
        try {
            return await Grammar.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }

    // Search grammar questions
    async searchGrammars(searchTerm) {
        try {
            return await Grammar.find({
                $or: [
                    { question_text: { $regex: searchTerm, $options: 'i' } },
                    { main_topic: { $regex: searchTerm, $options: 'i' } },
                    { sub_topic: { $regex: searchTerm, $options: 'i' } },
                    { explanation_text: { $regex: searchTerm, $options: 'i' } }
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
            return await Grammar.find(query)
                .populate('created_by', 'username full_name')
                .populate('updated_by', 'username full_name');
        } catch (error) {
            throw error;
        }
    }

    // Get random questions for quiz
    async getRandomQuestions(count = 10, filters = {}) {
        try {
            const questions = await Grammar.aggregate([
                { $match: { status: 'active', ...filters } },
                { $sample: { size: count } }
            ]);
            return questions;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new GrammarService();