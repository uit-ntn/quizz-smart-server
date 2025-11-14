const mongoose = require('mongoose');
const Vocabulary = require('../models/Vocabulary');

// Custom error class for service errors
class ServiceError extends Error {
    constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.name = 'ServiceError';
    }
}

// Create new vocabulary
const createVocabulary = async (vocabularyData) => {
    try {
        // Validate required fields
        if (!vocabularyData.word || !vocabularyData.meaning) {
            throw new ServiceError('Missing required fields: word and meaning are required', 400, 'VALIDATION_ERROR');
        }

        // Validate test_id if provided
        if (vocabularyData.test_id && !mongoose.Types.ObjectId.isValid(vocabularyData.test_id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate word and meaning are strings
        if (typeof vocabularyData.word !== 'string' || vocabularyData.word.trim().length === 0) {
            throw new ServiceError('Word must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        if (typeof vocabularyData.meaning !== 'string' || vocabularyData.meaning.trim().length === 0) {
            throw new ServiceError('Meaning must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        const vocabulary = new Vocabulary(vocabularyData);
        return await vocabulary.save();
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }
        
        // Handle mongoose duplicate key error
        if (error.code === 11000) {
            throw new ServiceError('Vocabulary with this combination already exists', 409, 'DUPLICATE_ERROR');
        }
        
        throw new ServiceError('Failed to create vocabulary', 500, 'DATABASE_ERROR');
    }
};

// Get all vocabularies with optional filters
const getAllVocabularies = async (filters = {}) => {
    try {
        // Validate filters if provided
        if (filters.test_id && !mongoose.Types.ObjectId.isValid(filters.test_id)) {
            throw new ServiceError('Invalid test ID in filters', 400, 'VALIDATION_ERROR');
        }

        return await Vocabulary.find(filters)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid filter parameters provided', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to fetch vocabularies', 500, 'DATABASE_ERROR');
    }
};

// Get vocabulary by ID
const getVocabularyById = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
        }

        const vocabulary = await Vocabulary.findById(id)
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name');

        if (!vocabulary) {
            throw new ServiceError('Vocabulary not found', 404, 'NOT_FOUND');
        }

        return vocabulary;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to fetch vocabulary', 500, 'DATABASE_ERROR');
    }
};

// Get all vocabularies by test ID
const getAllVocabulariesByTestId = async (testId) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        return await Vocabulary.find({ test_id: new mongoose.Types.ObjectId(testId) })
            .populate('created_by', 'username full_name')
            .populate('updated_by', 'username full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to fetch vocabularies by test ID', 500, 'DATABASE_ERROR');
    }
};

// Update vocabulary
const updateVocabulary = async (id, updateData) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
        }

        // Validate update data
        if (updateData.word !== undefined) {
            if (typeof updateData.word !== 'string' || updateData.word.trim().length === 0) {
                throw new ServiceError('Word must be a non-empty string', 400, 'VALIDATION_ERROR');
            }
        }

        if (updateData.meaning !== undefined) {
            if (typeof updateData.meaning !== 'string' || updateData.meaning.trim().length === 0) {
                throw new ServiceError('Meaning must be a non-empty string', 400, 'VALIDATION_ERROR');
            }
        }

        if (updateData.test_id && !mongoose.Types.ObjectId.isValid(updateData.test_id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        const updatedVocabulary = await Vocabulary.findByIdAndUpdate(
            id,
            { ...updateData, updated_at: new Date() },
            { new: true, runValidators: true }
        ).populate('created_by', 'username full_name')
         .populate('updated_by', 'username full_name');

        if (!updatedVocabulary) {
            throw new ServiceError('Vocabulary not found', 404, 'NOT_FOUND');
        }

        return updatedVocabulary;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to update vocabulary', 500, 'DATABASE_ERROR');
    }
};

// Delete vocabulary
const deleteVocabulary = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
        }

        const deletedVocabulary = await Vocabulary.findByIdAndDelete(id);
        
        if (!deletedVocabulary) {
            throw new ServiceError('Vocabulary not found', 404, 'NOT_FOUND');
        }
        
        return deletedVocabulary;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid vocabulary ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to delete vocabulary', 500, 'DATABASE_ERROR');
    }
};

// Search vocabularies by word or meaning
const searchVocabularies = async (searchTerm) => {
    try {
        // Validate search term
        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
            throw new ServiceError('Search term is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        const trimmedSearchTerm = searchTerm.trim();
        
        return await Vocabulary.find({
            $or: [
                { word: { $regex: trimmedSearchTerm, $options: 'i' } },
                { meaning: { $regex: trimmedSearchTerm, $options: 'i' } }
            ]
        }).populate('created_by', 'username full_name')
         .populate('updated_by', 'username full_name')
         .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to search vocabularies', 500, 'DATABASE_ERROR');
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