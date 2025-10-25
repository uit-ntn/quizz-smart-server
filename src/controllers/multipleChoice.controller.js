const multipleChoiceService = require('../services/multipleChoice.service');

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

// Create new multiple choice question
const createMultipleChoice = async (req, res) => {
    try {
        const question = await multipleChoiceService.createMultipleChoice({
            ...req.body,
            created_by: req.user?._id,
            updated_by: req.user?._id
        });
        res.status(201).json({
            success: true,
            question
        });
    } catch (error) {
        return handleServiceError(error, res);
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
        if (req.query.test_id) filters.test_id = req.query.test_id;

        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const questions = await multipleChoiceService.getAllMultipleChoices(filters, userId, userRole);
        
        res.json({
            success: true,
            questions,
            count: questions.length
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get multiple choice question by ID
const getMultipleChoiceById = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const question = await multipleChoiceService.getMultipleChoiceById(req.params.id, userId, userRole);
        
        res.json({
            success: true,
            question
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Update multiple choice question
const updateMultipleChoice = async (req, res) => {
    try {
        // First check if question exists and user has permission
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const existingQuestion = await multipleChoiceService.getMultipleChoiceById(req.params.id, userId, userRole);
        
        // Check if user can edit (admin or creator)
        if (userRole !== 'admin' && existingQuestion.created_by._id.toString() !== userId?.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied',
                type: 'ACCESS_DENIED'
            });
        }
        
        const question = await multipleChoiceService.updateMultipleChoice(
            req.params.id,
            {
                ...req.body,
                updated_by: userId
            }
        );
        
        res.json({
            success: true,
            question
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Delete multiple choice question
const deleteMultipleChoice = async (req, res) => {
    try {
        // First check if question exists and user has permission
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const existingQuestion = await multipleChoiceService.getMultipleChoiceById(req.params.id, userId, userRole);
        
        // Check if user can delete (admin or creator)
        if (userRole !== 'admin' && existingQuestion.created_by._id.toString() !== userId?.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied',
                type: 'ACCESS_DENIED'
            });
        }
        
        const question = await multipleChoiceService.deleteMultipleChoice(req.params.id);
        
        res.json({
            success: true,
            message: 'Question deleted successfully',
            question
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get all multiple choice questions by test ID
const getAllMultipleChoicesByTestId = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const questions = await multipleChoiceService.getAllMultipleChoicesByTestId(req.params.testId, userId, userRole);
        
        res.json({
            success: true,
            questions,
            count: questions.length
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get all main topics
const getAllMultipleChoicesMainTopics = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const mainTopics = await multipleChoiceService.getAllMultipleChoicesMainTopics(userId, userRole);
        
        res.json({
            success: true,
            mainTopics,
            count: mainTopics.length
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get all sub topics by main topic
const getAllMultipleChoicesSubTopicsByMainTopic = async (req, res) => {
    try {
        const { mainTopic } = req.params;
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const subTopics = await multipleChoiceService.getAllMultipleChoicesSubTopicsByMainTopic(mainTopic, userId, userRole);
        
        res.json({
            success: true,
            subTopics,
            count: subTopics.length
        });
    } catch (error) {
        return handleServiceError(error, res);
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