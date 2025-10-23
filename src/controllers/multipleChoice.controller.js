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

// Get all multiple choice questions by test ID
const getAllMultipleChoicesByTestId = async (req, res) => {
    try {
        const questions = await multipleChoiceService.getAllMultipleChoicesByTestId(req.params.testId);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all main topics
const getAllMultipleChoicesMainTopics = async (req, res) => {
    try {
        const mainTopics = await multipleChoiceService.getAllMultipleChoicesMainTopics();
        res.json(mainTopics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all sub topics by main topic
const getAllMultipleChoicesSubTopicsByMainTopic = async (req, res) => {
    try {
        const { mainTopic } = req.params;
        const subTopics = await multipleChoiceService.getAllMultipleChoicesSubTopicsByMainTopic(mainTopic);
        res.json(subTopics);
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
    getAllMultipleChoicesByTestId,
    getAllMultipleChoicesMainTopics,
    getAllMultipleChoicesSubTopicsByMainTopic
};