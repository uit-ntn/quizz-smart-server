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

module.exports = {
    createTest,
    getAllTests,
    getTestById,
    updateTest,
    deleteTest,
    searchTests,
    getTestsByTopic,
    getTestsByType
};
