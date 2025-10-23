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
        const grammars = await grammarService.getAllGrammars();
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


module.exports = {
    createGrammar,
    getAllGrammars,
    getGrammarById,
    updateGrammar,
    deleteGrammar,
};