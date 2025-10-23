const mongoose = require('mongoose');
const vocabularyService = require('../services/vocabulary.service');

// =========================
// 🟢 Create new vocabulary
// =========================
const createVocabulary = async (req, res) => {
    try {
        const vocabulary = await vocabularyService.createVocabulary({
            ...req.body,
            created_by: req.user?._id,
            updated_by: req.user?._id,
        });
        res.status(201).json(vocabulary);
    } catch (error) {
        console.error('Error creating vocabulary:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 📘 Get all vocabularies
// =========================
const getAllVocabularies = async (req, res) => {
    try {
        const vocabularies = await vocabularyService.getAllVocabularies();
        res.status(200).json(vocabularies);
    } catch (error) {
        console.error('Error fetching vocabularies:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 📘 Get all vocabularies by Test ID
// =========================
const getAllVocabulariesByTestId = async (req, res) => {
    try {
        const { testId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ message: 'Invalid test ID' });
        }

        const vocabularies = await vocabularyService.getAllVocabulariesByTestId(testId);
        res.status(200).json(vocabularies);
    } catch (error) {
        console.error('Error fetching vocabularies by test ID:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 📘 Get vocabulary by ID
// =========================
const getVocabularyById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vocabulary ID' });
        }

        const vocabulary = await vocabularyService.getVocabularyById(id);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.status(200).json(vocabulary);
    } catch (error) {
        console.error('Error fetching vocabulary by ID:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 🟡 Update vocabulary
// =========================
const updateVocabulary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vocabulary ID' });
        }

        const updated = await vocabularyService.updateVocabulary(id, {
            ...req.body,
            updated_by: req.user?._id,
        });

        if (!updated) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }

        res.status(200).json(updated);
    } catch (error) {
        console.error('Error updating vocabulary:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 🔴 Delete vocabulary
// =========================
const deleteVocabulary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vocabulary ID' });
        }

        const deleted = await vocabularyService.deleteVocabulary(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }

        res.status(200).json({ message: 'Vocabulary deleted successfully' });
    } catch (error) {
        console.error('Error deleting vocabulary:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 🔍 Search vocabularies (by word or meaning)
// =========================
const searchVocabularies = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search term is required' });
        }

        const vocabularies = await vocabularyService.searchVocabularies(q);
        res.status(200).json(vocabularies);
    } catch (error) {
        console.error('Error searching vocabularies:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 📘 Get all vocabulary main topics
// =========================
const getAllVocabularyMainTopics = async (req, res) => {
    try {
        const mainTopics = await vocabularyService.getAllVocabularyMainTopics();
        res.status(200).json(mainTopics);
    } catch (error) {
        console.error('Error fetching vocabulary main topics:', error);
        res.status(500).json({ message: error.message });
    }
};

// =========================
// 📘 Get all vocabulary sub topics by main topic
// =========================
const getAllVocabularySubTopicsByMainTopic = async (req, res) => {
    try {
        const { mainTopic } = req.params;
        const subTopics = await vocabularyService.getAllVocabularySubTopicsByMainTopic(mainTopic);
        res.status(200).json(subTopics);
    } catch (error) {
        console.error('Error fetching vocabulary sub topics by main topic:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createVocabulary,
    getAllVocabularies,
    getAllVocabulariesByTestId,
    getVocabularyById,
    updateVocabulary,
    deleteVocabulary,
    searchVocabularies
};
