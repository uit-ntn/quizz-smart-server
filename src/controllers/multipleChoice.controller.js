const multipleChoiceService = require('../services/multipleChoice.service');

// Create new multiple choice question
const createMultipleChoice = async (req, res) => {
    try {
        const question = await multipleChoiceService.createMultipleChoice({
            ...req.body,
            created_by: req.user._id,
            updated_by: req.user._id
        });
        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all multiple choice questions
const getAllMultipleChoices = async (req, res) => {
    try {
        const filters = {};
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;
        if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.status) filters.status = req.query.status;

        const questions = await multipleChoiceService.getAllMultipleChoices(filters);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get multiple choice question by ID
const getMultipleChoiceById = async (req, res) => {
    try {
        const question = await multipleChoiceService.getMultipleChoiceById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update multiple choice question
const updateMultipleChoice = async (req, res) => {
    try {
        const question = await multipleChoiceService.updateMultipleChoice(
            req.params.id,
            {
                ...req.body,
                updated_by: req.user._id
            }
        );
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete multiple choice question
const deleteMultipleChoice = async (req, res) => {
    try {
        const question = await multipleChoiceService.deleteMultipleChoice(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search multiple choice questions
const searchMultipleChoices = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search term is required' });
        }
        const questions = await multipleChoiceService.searchMultipleChoices(q);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get questions by topic
const getQuestionsByTopic = async (req, res) => {
    try {
        const { mainTopic, subTopic } = req.params;
        const questions = await multipleChoiceService.getQuestionsByTopic(mainTopic, subTopic);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get random questions for quiz
const getRandomQuestions = async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 10;
        const filters = {};
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;

        const questions = await multipleChoiceService.getRandomQuestions(count, filters);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    getRandomQuestions
};