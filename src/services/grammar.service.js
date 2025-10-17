const Grammar = require('../models/Grammar');

// Create new grammar question
const createGrammar = async (grammarData) => {
    try {
        const grammar = new Grammar(grammarData);
        return await grammar.save();
    } catch (error) {
        throw error;
    }
};

// Get all grammar questions with optional filters
const getAllGrammars = async (filters = {}) => {
    try {
        const query = { ...filters };
        return await Grammar.find(query)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

// Get grammar question by ID
const getGrammarById = async (id) => {
    try {
        return await Grammar.findById(id)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

// Update grammar question
const updateGrammar = async (id, updateData) => {
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
};

// Delete grammar question
const deleteGrammar = async (id) => {
    try {
        return await Grammar.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

// Search grammar questions
const searchGrammars = async (searchTerm) => {
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
};

// Get questions by topic
const getQuestionsByTopic = async (mainTopic, subTopic = null) => {
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
};

// Get random questions for quiz
const getRandomQuestions = async (count = 10, filters = {}) => {
    try {
        const questions = await Grammar.aggregate([
            { $match: { status: 'active', ...filters } },
            { $sample: { size: count } }
        ]);
        return questions;
    } catch (error) {
        throw error;
    }
};

// Get all grammar topics
const getAllGrammarTopics = async () => {
    try {
        const topics = await Grammar.distinct('main_topic');
        const topicDetails = await Promise.all(
            topics.map(async (mainTopic) => {
                const subTopics = await Grammar.distinct('sub_topic', { main_topic: mainTopic });
                const count = await Grammar.countDocuments({ main_topic: mainTopic });
                return {
                    main_topic: mainTopic,
                    sub_topics: subTopics,
                    total_questions: count,
                    type: 'grammar'
                };
            })
        );
        return topicDetails;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createGrammar,
    getAllGrammars,
    getGrammarById,
    updateGrammar,
    deleteGrammar,
    searchGrammars,
    getQuestionsByTopic,
    getRandomQuestions,
    getAllGrammarTopics
};