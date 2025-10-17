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
const getAllVocabularies = async (filters = {}) => {
    try {
        const query = { ...filters };
        return await Vocabulary.find(query);
    } catch (error) {
        throw error;
    }
};

// Get vocabulary by ID
const getVocabularyById = async (id) => {
    try {
        return await Vocabulary.findById(id);
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
        );
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
        });
    } catch (error) {
        throw error;
    }
};


const getVocabularyByMainTopic = async (mainTopic) => {
    try {
        return await Vocabulary.find({ main_topic: mainTopic });
    } catch (error) {
        throw error;
    }
};

const getVocabularyBySubTopic = async (subTopic) => {
    try {
        return await Vocabulary.find({ sub_topic: subTopic });
    } catch (error) {
        throw error;
    }
};

// Get all vocabulary topics
const getAllVocabularyTopics = async () => {
    try {
        const topics = await Vocabulary.distinct('main_topic');
        const topicDetails = await Promise.all(
            topics.map(async (mainTopic) => {
                const subTopics = await Vocabulary.distinct('sub_topic', { main_topic: mainTopic });
                const count = await Vocabulary.countDocuments({ main_topic: mainTopic });
                return {
                    main_topic: mainTopic,
                    sub_topics: subTopics,
                    total_questions: count,
                    type: 'vocabulary'
                };
            })
        );
        return topicDetails;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createVocabulary,
    getAllVocabularies,
    getVocabularyById,
    updateVocabulary,
    deleteVocabulary,
    searchVocabularies,
    getVocabularyByMainTopic,
    getVocabularyBySubTopic,
    getAllVocabularyTopics
};