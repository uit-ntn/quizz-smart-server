const mongoose = require('mongoose');
const Test = require('../models/Test');

// Create new test
const createTest = async (testData) => {
    const test = new Test(testData);
    return await test.save();
};

// Get all tests with optional filters
const getAllTests = async (filters = {}) => {
    const query = { ...filters };
    return await Test.find(query)
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

const getAllMultipleChoicesTests = async () => {
    return await Test.find({ test_type: 'multiple_choice' })
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

const getAllGrammarsTests = async () => {
    return await Test.find({ test_type: 'grammar' })
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

const getAllVocabulariesTests = async () => {
    return await Test.find({ test_type: 'vocabulary' })
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};
// Get test by ID
const getTestById = async (id) => {
    return await Test.findById(id)
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

// Update test
const updateTest = async (id, updateData) => {
    return await Test.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true }
    ).populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

// Delete test
const deleteTest = async (id) => {
    return await Test.findByIdAndDelete(id);
};

// Search tests
const searchTests = async (searchTerm) => {
    return await Test.find({
        $or: [
            { test_title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { main_topic: { $regex: searchTerm, $options: 'i' } },
            { sub_topic: { $regex: searchTerm, $options: 'i' } }
        ]
    }).populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

// Get tests by topic
const getTestsByTopic = async (mainTopic, subTopic = null) => {
    const query = { main_topic: mainTopic };
    if (subTopic) {
        query.sub_topic = subTopic;
    }
    return await Test.find(query)
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

// Get tests by type
const getTestsByType = async (testType) => {
    return await Test.find({ test_type: testType })
        .populate('created_by', 'email full_name')
        .populate('updated_by', 'email full_name');
};

// Get all multiple choice main topics
const getAllMultipleChoicesMainTopics = async () => {
    return await Test.distinct('main_topic', { test_type: 'multiple_choice' });
};

// Get all multiple choice sub topics by main topic
const getAllMultipleChoicesSubTopicsByMainTopic = async (mainTopic) => {
    const subTopics = await Test.distinct('sub_topic', {
        test_type: 'multiple_choice',
        main_topic: { $regex: new RegExp(mainTopic, 'i') }
    });
    return subTopics;
};

const getAllGrammarsMainTopics = async () => {
    return await Test.distinct('main_topic', { test_type: 'grammar' });
};

const getAllGrammarsSubTopicsByMainTopic = async (mainTopic) => {
    const subTopics = await Test.distinct('sub_topic', {
        test_type: 'grammar',
        main_topic: { $regex: new RegExp(mainTopic, 'i') }
    });
    return subTopics;
};

const getAllVocabulariesMainTopics = async () => {
    return await Test.distinct('main_topic', { test_type: 'vocabulary' });
};

const getAllVocabulariesSubTopicsByMainTopic = async (mainTopic) => {
    const subTopics = await Test.distinct('sub_topic', {
        test_type: 'vocabulary',
        main_topic: { $regex: new RegExp(mainTopic, 'i') }
    });
    return subTopics;
};

module.exports = {
    createTest,
    getAllTests,
    getAllMultipleChoicesTests,
    getAllGrammarsTests,
    getAllVocabulariesTests,
    getTestById,
    updateTest,
    deleteTest,
    searchTests,
    getTestsByTopic,
    getTestsByType,
    getAllMultipleChoicesMainTopics,
    getAllMultipleChoicesSubTopicsByMainTopic,
    getAllGrammarsMainTopics,
    getAllGrammarsSubTopicsByMainTopic,
    getAllVocabulariesMainTopics,
    getAllVocabulariesSubTopicsByMainTopic
};
