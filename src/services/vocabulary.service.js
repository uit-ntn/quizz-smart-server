const mongoose = require('mongoose');
const Vocabulary = require('../models/Vocabulary');

// Create new vocabulary
const createVocabulary = async (vocabularyData) => {
    try {
        const vocabulary = new Vocabulary(vocabularyData);
        return await vocabulary.save();
    } catch (error) {
        throw error;
    }
};

// Get all vocabularies with optional filters
const getAllVocabularies = async () => {
    try {
        return await Vocabulary.find()
    } catch (error) {
        throw error;
    }
};

// Get vocabulary by ID
const getVocabularyById = async (id) => {
    try {
        return await Vocabulary.findById(id)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

// Get all vocabularies by test ID
const getAllVocabulariesByTestId = async (testId) => {
    try {
        return await Vocabulary.find({ test_id: new mongoose.Types.ObjectId(testId) })
    } catch (error) {
        throw error;
    }
};

// Update vocabulary
const updateVocabulary = async (id, updateData) => {
    try {
        return await Vocabulary.findByIdAndUpdate(
            id,
            { ...updateData, updated_at: new Date() },
            { new: true }
        ).populate('created_by', 'username full_name')
         .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

// Delete vocabulary
const deleteVocabulary = async (id) => {
    try {
        return await Vocabulary.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

// Search vocabularies by word or meaning
const searchVocabularies = async (searchTerm) => {
    try {
        return await Vocabulary.find({
            $or: [
                { word: { $regex: searchTerm, $options: 'i' } },
                { meaning: { $regex: searchTerm, $options: 'i' } }
            ]
        }).populate('created_by', 'username full_name')
         .populate('updated_by', 'username full_name');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createVocabulary,
    getAllVocabularies,
    getVocabularyById,
    getAllVocabulariesByTestId,
    updateVocabulary,
    deleteVocabulary,
    searchVocabularies
};