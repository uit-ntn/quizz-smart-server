const multipleChoiceService = require('../services/multipleChoice.service');

// Chuẩn hoá trả lỗi từ service
function handleServiceError(error, res) {
    if (error && error.name === 'ServiceError') {
        return res.status(error.statusCode).json({
            message: error.message,
            type: error.type,
        });
    }
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({
        message: 'Internal server error',
        type: 'INTERNAL_ERROR',
    });
}

// Create
const createMultipleChoice = async (req, res) => {
    try {
        const question = await multipleChoiceService.createMultipleChoice({
            ...req.body,
            created_by: req.user?._id,
            updated_by: req.user?._id,
        });
        return res.status(201).json({
            success: true,
            message: 'Question created successfully',
            question,
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get all (visibility theo service)
const getAllMultipleChoices = async (req, res) => {
    try {
        const filters = {};
        if (req.query.test_id) filters.test_id = req.query.test_id;

        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;

        const questions = await multipleChoiceService.getAllMultipleChoices(
            filters,
            userId,
            userRole
        );

        return res.json({
            message: 'Questions fetched successfully',
            count: questions.length,
            questions,
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get by id (service tự kiểm tra quyền với private)
const getMultipleChoiceById = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;

        const question = await multipleChoiceService.getMultipleChoiceById(
            req.params.id,
            userId,
            userRole
        );

        return res.json({
            message: 'Question fetched successfully',
            question,
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Update (admin/creator)
const updateMultipleChoice = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;

        // Kiểm tra quyền bằng cách load bản ghi + visibility
        const existing = await multipleChoiceService.getMultipleChoiceById(
            req.params.id,
            userId,
            userRole
        );

        if (userRole !== 'admin' && existing.created_by._id.toString() !== userId?.toString()) {
            return res.status(403).json({
                message: 'Access denied',
                type: 'ACCESS_DENIED',
            });
        }

        const question = await multipleChoiceService.updateMultipleChoice(req.params.id, {
            ...req.body,
            updated_by: userId,
        });

        return res.json({
            message: 'Question updated successfully',
            question,
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Delete (admin/creator)
const deleteMultipleChoice = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;

        const existing = await multipleChoiceService.getMultipleChoiceById(
            req.params.id,
            userId,
            userRole
        );

        if (userRole !== 'admin' && existing.created_by._id.toString() !== userId?.toString()) {
            return res.status(403).json({
                message: 'Access denied',
                type: 'ACCESS_DENIED',
            });
        }

        const question = await multipleChoiceService.deleteMultipleChoice(req.params.id);

        return res.json({
            message: 'Question deleted successfully',
            question,
        });
    } catch (error) {
        return handleServiceError(error, res);
    }
};

// Get all by testId
const getAllMultipleChoicesByTestId = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const userRole = req.user?.role || null;

        const questions = await multipleChoiceService.getAllMultipleChoicesByTestId(
            req.params.testId,
            userId,
            userRole
        );

        return res.json({
            message: 'Questions by test fetched successfully',
            count: questions.length,
            questions,
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
    getAllMultipleChoicesByTestId
};
