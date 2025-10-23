const MultipleChoice = require('../models/MultipleChoice');
const mongoose = require('mongoose');

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
        return await MultipleChoice.find(filters);
    } catch (error) {
        throw error;
    }
};

// Get all multiple choice main topics
const getAllMultipleChoicesMainTopics = async () => {
    return await MultipleChoice.distinct('main_topic');
};

// Get all multiple choice sub topics
const getAllMultipleChoicesSubTopicsByMainTopic = async (mainTopic) => {
    return await MultipleChoice.distinct('sub_topic', { main_topic: mainTopic });
};

const getAllMultipleChoicesByTestId = async (testId) => {
    return await MultipleChoice.find({ test_id: new mongoose.Types.ObjectId(testId) });
};

// Get multiple choice question by ID
const getMultipleChoiceById = async (id) => {
    try {
        return await MultipleChoice.findById(id)
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
        )
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

module.exports = {
    createMultipleChoice,
    getAllMultipleChoices,
    getMultipleChoiceById,
    updateMultipleChoice,
    deleteMultipleChoice,
    getAllMultipleChoicesByTestId
};