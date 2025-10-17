const vocabularyService = require('../services/vocabulary.service');

// Create new vocabulary
const createVocabulary = async (req, res) => {
    try {
        const vocabulary = await vocabularyService.createVocabulary({
            ...req.body,
            created_by: req.user?._id,
            updated_by: req.user?._id
        });
        res.status(201).json(vocabulary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all vocabularies
const getAllVocabularies = async (req, res) => {
    try {
        const filters = {};
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.status) filters.status = req.query.status;

        const vocabularies = await vocabularyService.getAllVocabularies(filters);
        res.json(vocabularies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get vocabulary by ID
const getVocabularyById = async (req, res) => {
    try {
        const vocabulary = await vocabularyService.getVocabularyById(req.params.id);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json(vocabulary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update vocabulary
const updateVocabulary = async (req, res) => {
    try {
        const vocabulary = await vocabularyService.updateVocabulary(
            req.params.id,
            {
                ...req.body,
                updated_by: req.user?._id
            }
        );
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json(vocabulary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete vocabulary
const deleteVocabulary = async (req, res) => {
    try {
        const vocabulary = await vocabularyService.deleteVocabulary(req.params.id);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json({ message: 'Vocabulary deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search vocabularies
const searchVocabularies = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search term is required' });
        }
        const vocabularies = await vocabularyService.searchVocabularies(q);
        res.json(vocabularies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createVocabulary,
    getAllVocabularies,
    getVocabularyById,
    updateVocabulary,
    deleteVocabulary,
    searchVocabularies
};