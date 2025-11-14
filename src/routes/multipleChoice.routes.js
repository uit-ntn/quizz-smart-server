const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize, optionalAuthMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Multiple Choice
 *   description: Multiple choice question management endpoints
 */

// ===== Public (optionalAuth) — để service áp dụng visibility =====
router.get('/', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoices);
router.get('/test/:testId', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoicesByTestId);
router.get('/:id', optionalAuthMiddleware, multipleChoiceController.getMultipleChoiceById);

// ===== Protected (admin/teacher) =====
router.post('/', authMiddleware, authorize(['admin']), multipleChoiceController.createMultipleChoice);
router.put('/:id', authMiddleware, authorize(['admin']), multipleChoiceController.updateMultipleChoice);
router.delete('/:id', authMiddleware, authorize(['admin']), multipleChoiceController.deleteMultipleChoice);

module.exports = router;