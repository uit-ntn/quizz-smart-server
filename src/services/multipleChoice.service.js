const MultipleChoice = require('../models/MultipleChoice');

// Create new multiple choice question
const createMultipleChoice = async (questionData) => {
    try {
        const question = new MultipleChoice(questionData);
        return await question.save();
    } catch (error) {
        throw error;
    }
};

// Get all multiple choice questions with optional filters
const getAllMultipleChoices = async (filters = {}) => {
    try {
        const query = { ...filters };
        return await MultipleChoice.find(query)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

// Get multiple choice question by ID
const getMultipleChoiceById = async (id) => {
    try {
        return await MultipleChoice.findById(id)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

// Update multiple choice question
const updateMultipleChoice = async (id, updateData) => {
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
};

// Delete multiple choice question
const deleteMultipleChoice = async (id) => {
    try {
        return await MultipleChoice.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

// Search multiple choice questions
const searchMultipleChoices = async (searchTerm) => {
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
};

// Get questions by topic
const getQuestionsByTopic = async (mainTopic, subTopic = null) => {
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
};

// Get random questions for quiz
const getRandomQuestions = async (count = 10, filters = {}) => {
    try {
        const questions = await MultipleChoice.aggregate([
            { $match: { status: 'active', ...filters } },
            { $sample: { size: count } }
        ]);
        return questions;
    } catch (error) {
        throw error;
    }
};

// Get all multiple choice topics
const getAllMultipleChoiceTopics = async () => {
    try {
        const topics = await MultipleChoice.distinct('main_topic');
        const topicDetails = await Promise.all(
            topics.map(async (mainTopic) => {
                const subTopics = await MultipleChoice.distinct('sub_topic', { main_topic: mainTopic });
                const count = await MultipleChoice.countDocuments({ main_topic: mainTopic });
                return {
                    main_topic: mainTopic,
                    sub_topics: subTopics,
                    total_questions: count,
                    type: 'multiple-choice'
                };
            })
        );
        return topicDetails;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createMultipleChoice,
    getAllMultipleChoices,
    getMultipleChoiceById,
    updateMultipleChoice,
    deleteMultipleChoice,
    searchMultipleChoices,
    getQuestionsByTopic,
    getRandomQuestions,
    getAllMultipleChoiceTopics
};