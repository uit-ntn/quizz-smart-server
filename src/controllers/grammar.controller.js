const grammarService = require('../services/grammar.service');

// Create new grammar question
const createGrammar = async (req, res) => {
    try {
        const grammar = await grammarService.createGrammar({
            ...req.body,
            created_by: req.user._id,
            updated_by: req.user._id
        });
        res.status(201).json(grammar);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all grammar questions
const getAllGrammars = async (req, res) => {
    try {
        const filters = {};
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;
        if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.status) filters.status = req.query.status;

        const grammars = await grammarService.getAllGrammars(filters);
        res.json(grammars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get grammar question by ID
const getGrammarById = async (req, res) => {
    try {
        const grammar = await grammarService.getGrammarById(req.params.id);
        if (!grammar) {
            return res.status(404).json({ message: 'Grammar question not found' });
        }
        res.json(grammar);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update grammar question
const updateGrammar = async (req, res) => {
    try {
        const grammar = await grammarService.updateGrammar(
            req.params.id,
            {
                ...req.body,
                updated_by: req.user._id
            }
        );
        if (!grammar) {
            return res.status(404).json({ message: 'Grammar question not found' });
        }
        res.json(grammar);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete grammar question
const deleteGrammar = async (req, res) => {
    try {
        const grammar = await grammarService.deleteGrammar(req.params.id);
        if (!grammar) {
            return res.status(404).json({ message: 'Grammar question not found' });
        }
        res.json({ message: 'Grammar question deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search grammar questions
const searchGrammars = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search term is required' });
        }
        const grammars = await grammarService.searchGrammars(q);
        res.json(grammars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get questions by topic
const getQuestionsByTopic = async (req, res) => {
    try {
        const { mainTopic, subTopic } = req.params;
        const grammars = await grammarService.getQuestionsByTopic(mainTopic, subTopic);
        res.json(grammars);
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

        const grammars = await grammarService.getRandomQuestions(count, filters);
        res.json(grammars);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    getRandomQuestions
};