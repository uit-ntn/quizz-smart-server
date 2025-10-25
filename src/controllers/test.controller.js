const testService = require('../services/test.service');

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

// Create new test
const createTest = async (req, res) => {
    try {
        const test = await testService.createTest({
            ...req.body,
            created_by: req.user._id,
            updated_by: req.user._id
        });
        res.status(201).json({
            success: true,
            ...test
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get all tests
const getAllTests = async (req, res) => {
    try {
        const filters = {};
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;
        if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
        if (req.query.test_type) filters.test_type = req.query.test_type;
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.status) filters.status = req.query.status;

        // Pass user info to service (admin gets all, others get public only)
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.getAllTests(filters, userId, userRole);
        
        res.json({
            success: true,
            ...tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get tests created by current user
const getMyTests = async (req, res) => {
    try {
        const filters = { created_by: req.user._id };
        
        // Allow additional filtering
        if (req.query.main_topic) filters.main_topic = req.query.main_topic;
        if (req.query.sub_topic) filters.sub_topic = req.query.sub_topic;
        if (req.query.test_type) filters.test_type = req.query.test_type;
        if (req.query.difficulty) filters.difficulty = req.query.difficulty;
        if (req.query.status) filters.status = req.query.status;

        const tests = await testService.getAllTests(filters, req.user._id, req.user.role);
        
        console.log(`📋 User ${req.user._id} requested ${tests.tests.length} of their tests`);
        res.json({
            success: true,
            ...tests
        });
    } catch (error) {
        console.error('❌ Error fetching user tests:', error);
        return handleServiceError(error, res);
    }
};

const getAllMultipleChoicesTests = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.getAllMultipleChoicesTests(userId, userRole);
        res.json({
            success: true,
            tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllGrammarsTests = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.getAllGrammarsTests(userId, userRole);
        res.json({
            success: true,
            tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllVocabulariesTests = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.getAllVocabulariesTests(userId, userRole);
        res.json({
            success: true,
            tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};


// Get test by ID
const getTestById = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const test = await testService.getTestById(req.params.id, userId, userRole);
        
        res.json({
            success: true,
            test
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Update test
const updateTest = async (req, res) => {
    try {
        // First check if test exists and user has permission
        const existingTest = await testService.getTestById(req.params.id, req.user._id, req.user.role);
        
        // Check if user can edit (admin or creator)
        if (req.user.role !== 'admin' && existingTest.created_by._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied',
                type: 'ACCESS_DENIED'
            });
        }
        
        const test = await testService.updateTest(
            req.params.id,
            {
                ...req.body,
                updated_by: req.user._id
            }
        );
        
        res.json({
            success: true,
            test
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Delete test
const deleteTest = async (req, res) => {
    try {
        // First check if test exists and user has permission
        const existingTest = await testService.getTestById(req.params.id, req.user._id, req.user.role);
        
        // Check if user can delete (admin or creator)
        if (req.user.role !== 'admin' && existingTest.created_by._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied',
                type: 'ACCESS_DENIED'
            });
        }
        
        await testService.hardDeleteTest(req.params.id);
        
        res.json({ 
            success: true,
            message: 'Test deleted successfully' 
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Search tests
const searchTests = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ 
                success: false,
                message: 'Search term is required',
                type: 'VALIDATION_ERROR'
            });
        }
        
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.searchTests(q, userId, userRole);
        
        res.json({
            success: true,
            tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get tests by topic
const getTestsByTopic = async (req, res) => {
    try {
        const { mainTopic, subTopic } = req.params;
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.getTestsByTopic(mainTopic, subTopic, userId, userRole);
        
        res.json({
            success: true,
            tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get tests by type
const getTestsByType = async (req, res) => {
    try {
        const { testType } = req.params;
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const tests = await testService.getTestsByType(testType, userId, userRole);
        
        res.json({
            success: true,
            tests
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};



// Get all multiple choice main topics
const getAllMultipleChoicesMainTopics = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const mainTopics = await testService.getAllMultipleChoicesMainTopics(userId, userRole);

        res.json({
            success: true,
            mainTopics
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllMultipleChoicesSubTopicsByMainTopic = async (req, res) => {
    try {
        const { mainTopic } = req.params;
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const subTopics = await testService.getAllMultipleChoicesSubTopicsByMainTopic(mainTopic, userId, userRole);

        res.json({
            success: true,
            subTopics
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllGrammarsMainTopics = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const mainTopics = await testService.getAllGrammarsMainTopics(userId, userRole);
        
        res.json({
            success: true,
            mainTopics
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllGrammarsSubTopicsByMainTopic = async (req, res) => {
    try {
        const { mainTopic } = req.params;
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const subTopics = await testService.getAllGrammarsSubTopicsByMainTopic(mainTopic, userId, userRole);
        
        res.json({
            success: true,
            subTopics
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllVocabulariesMainTopics = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const mainTopics = await testService.getAllVocabulariesMainTopics(userId, userRole);
        
        res.json({
            success: true,
            mainTopics
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

const getAllVocabulariesSubTopicsByMainTopic = async (req, res) => {
    try {
        const { mainTopic } = req.params;
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;
        const subTopics = await testService.getAllVocabulariesSubTopicsByMainTopic(mainTopic, userId, userRole);
        
        res.json({
            success: true,
            subTopics
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

module.exports = {
    createTest,
    getAllTests,
    getMyTests,
    getAllMultipleChoicesTests,
    getAllGrammarsTests,
    getAllVocabulariesTests,
    getTestById,
    updateTest,
    deleteTest,
    searchTests,
    getTestsByTopic,
    getTestsByType,
    getAllMultipleChoicesMainTopics,
    getAllMultipleChoicesSubTopicsByMainTopic,
    getAllGrammarsMainTopics,
    getAllGrammarsSubTopicsByMainTopic,
    getAllVocabulariesMainTopics,
    getAllVocabulariesSubTopicsByMainTopic
};
