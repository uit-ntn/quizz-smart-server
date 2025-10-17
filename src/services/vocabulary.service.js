const Vocabulary = require('../models/Vocabulary');

class VocabularyService {
    // Create new vocabulary
    async createVocabulary(vocabularyData) {
        try {
            const vocabulary = new Vocabulary(vocabularyData);
            return await vocabulary.save();
        } catch (error) {
            throw error;
        }
    }

    // Get all vocabularies with optional filters
    async getAllVocabularies(filters = {}) {
        try {
            const query = { ...filters };
            return await Vocabulary.find(query);
        } catch (error) {
            throw error;
        }
    }

    // Get vocabulary by ID
    async getVocabularyById(id) {
        try {
            return await Vocabulary.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Update vocabulary
    async updateVocabulary(id, updateData) {
        try {
            return await Vocabulary.findByIdAndUpdate(
                id,
                { ...updateData, updated_at: new Date() },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }

    // Delete vocabulary
    async deleteVocabulary(id) {
        try {
            return await Vocabulary.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }

    // Search vocabularies by word or meaning
    async searchVocabularies(searchTerm) {
        try {
            return await Vocabulary.find({
                $or: [
                    { word: { $regex: searchTerm, $options: 'i' } },
                    { meaning: { $regex: searchTerm, $options: 'i' } }
                ]
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new VocabularyService();