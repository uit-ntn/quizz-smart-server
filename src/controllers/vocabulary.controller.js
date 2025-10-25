const mongoose = require('mongoose');
const vocabularyService = require('../services/vocabulary.service');
const geminiService = require('../services/gemini.service');

// Helper function to handle service errors
function handleServiceError(error, res) {
    if (error.name === 'ServiceError') {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            type: error.type
        });
    }
    
    // Default error handling
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        type: 'INTERNAL_ERROR'
    });
}

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
        res.status(201).json({
            success: true,
            vocabulary
        });
    } catch (error) {
        console.error('Error creating vocabulary:', error);
        return handleServiceError(error, res);
    }
};

// =========================
// 📘 Get all vocabularies
// =========================
const getAllVocabularies = async (req, res) => {
    try {
        const vocabularies = await vocabularyService.getAllVocabularies();
        res.json({
            success: true,
            vocabularies
        });
    } catch (error) {
        console.error('Error fetching vocabularies:', error);
        return handleServiceError(error, res);
    }
};

// =========================
// 📘 Get all vocabularies by Test ID
// =========================
const getAllVocabulariesByTestId = async (req, res) => {
    try {
        const { testId } = req.params;

        const vocabularies = await vocabularyService.getAllVocabulariesByTestId(testId);
        res.json({
            success: true,
            vocabularies
        });
    } catch (error) {
        console.error('Error fetching vocabularies by test ID:', error);
        return handleServiceError(error, res);
    }
};

// =========================
// 📘 Get vocabulary by ID
// =========================
const getVocabularyById = async (req, res) => {
    try {
        const { id } = req.params;

        const vocabulary = await vocabularyService.getVocabularyById(id);
        res.json({
            success: true,
            vocabulary
        });
    } catch (error) {
        console.error('Error fetching vocabulary by ID:', error);
        return handleServiceError(error, res);
    }
};

// =========================
// 🟡 Update vocabulary
// =========================
const updateVocabulary = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await vocabularyService.updateVocabulary(id, {
            ...req.body,
            updated_by: req.user?._id,
        });

        res.json({
            success: true,
            vocabulary: updated
        });
    } catch (error) {
        console.error('Error updating vocabulary:', error);
        return handleServiceError(error, res);
    }
};

// =========================
// 🔴 Delete vocabulary
// =========================
const deleteVocabulary = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await vocabularyService.deleteVocabulary(id);
        
        res.json({ 
            success: true,
            message: 'Vocabulary deleted successfully',
            vocabulary: deleted
        });
    } catch (error) {
        console.error('Error deleting vocabulary:', error);
        return handleServiceError(error, res);
    }
};

// =========================
// 🔍 Search vocabularies (by word or meaning)
// =========================
const searchVocabularies = async (req, res) => {
    try {
        const { q } = req.query;
        const vocabularies = await vocabularyService.searchVocabularies(q);
        res.json({
            success: true,
            vocabularies
        });
    } catch (error) {
        console.error('Error searching vocabularies:', error);
        return handleServiceError(error, res);
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

// =========================
// 🤖 Generate vocabulary using AI
// =========================
const generateVocabulary = async (req, res) => {
    try {
        const { topic, category, description, count } = req.body;

        // Validate required fields
        if (!topic) {
            return res.status(400).json({ 
                message: 'Topic is required',
                example: {
                    topic: "Business Communication",
                    category: "Professional Skills",
                    description: "Essential vocabulary for workplace communication",
                    count: 15
                }
            });
        }

        // Validate count parameter
        const vocabularyCount = parseInt(count) || 10;
        if (vocabularyCount < 1 || vocabularyCount > 50) {
            return res.status(400).json({ 
                message: 'Count must be between 1 and 50' 
            });
        }

        console.log(`🤖 Generating vocabulary request:`, {
            topic,
            category: category || 'General',
            description: description || 'Common vocabulary',
            count: vocabularyCount,
            userId: req.user?._id
        });

        // Generate vocabulary using Gemini AI
        const vocabularyList = await geminiService.generateVocabulary({
            topic,
            category,
            description,
            count: vocabularyCount
        });

        // Add metadata to response
        const response = {
            success: true,
            message: `Generated ${vocabularyList.length} vocabulary words for topic: ${topic}`,
            data: {
                topic,
                category: category || 'General',
                description: description || 'Generated vocabulary',
                count: vocabularyList.length,
                vocabulary: vocabularyList,
                generated_at: new Date().toISOString(),
                generated_by: req.user?._id || 'anonymous'
            }
        };

        console.log(`✅ Successfully generated ${vocabularyList.length} vocabulary words`);
        res.status(200).json(response);

    } catch (error) {
        console.error('❌ Error generating vocabulary:', error);
        
        // Return user-friendly error message
        const errorResponse = {
            success: false,
            message: 'Failed to generate vocabulary',
            error: error.message,
            suggestion: 'Please try again with a more specific topic or check your API configuration'
        };

        return handleServiceError(error, res);
    }
};

// =========================
// 🤖 Test Gemini AI connection
// =========================
const testGeminiConnection = async (req, res) => {
    try {
        const result = await geminiService.testConnection();
        const usageInfo = geminiService.getUsageInfo();

        res.status(200).json({
            message: 'Gemini AI Service Status',
            connection: result,
            configuration: usageInfo,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error testing Gemini connection:', error);
        return handleServiceError(error, res);
    }
};

module.exports = {
    createVocabulary,
    getAllVocabularies,
    getAllVocabulariesByTestId,
    getVocabularyById,
    updateVocabulary,
    deleteVocabulary,
    searchVocabularies,
    getAllVocabularyMainTopics,
    getAllVocabularySubTopicsByMainTopic,
    generateVocabulary,
    testGeminiConnection
};
