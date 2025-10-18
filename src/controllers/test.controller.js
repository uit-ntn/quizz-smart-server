const testService = require('../services/test.service');

// Create new test
const createTest = async (req, res) => {
    try {
        const test = await testService.createTest({
            ...req.body,
            created_by: req.user._id,
            updated_by: req.user._id
        });
        res.status(201).json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all tests
const getAllTests = async (req, res) => {
    try {
        const filters = {};
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;
        if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
        if (req.query.test_type) filters.test_type = req.query.test_type;
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.status) filters.status = req.query.status;

        const tests = await testService.getAllTests(filters);
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get test by ID
const getTestById = async (req, res) => {
    try {
        const test = await testService.getTestById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update test
const updateTest = async (req, res) => {
    try {
        const test = await testService.updateTest(
            req.params.id,
            {
                ...req.body,
                updated_by: req.user._id
            }
        );
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete test
const deleteTest = async (req, res) => {
    try {
        const test = await testService.deleteTest(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search tests
const searchTests = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search term is required' });
        }
        const tests = await testService.searchTests(q);
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get tests by topic
const getTestsByTopic = async (req, res) => {
    try {
        const { mainTopic, subTopic } = req.params;
        const tests = await testService.getTestsByTopic(mainTopic, subTopic);
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get tests by type
const getTestsByType = async (req, res) => {
    try {
        const { testType } = req.params;
        const tests = await testService.getTestsByType(testType);
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
