// routes/multipleChoice.routes.js
const express = require('express');
const router = express.Router();

const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Multiple Choice
 *   description: Multiple choice question management endpoints
 */

// ===== Public (optionalAuth) — service sẽ áp dụng permission theo userId/role =====
router.get('/', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoices);
router.get('/test/:testId', optionalAuthMiddleware, multipleChoiceController.getAllMultipleChoicesByTestId);
router.get('/:id', optionalAuthMiddleware, multipleChoiceController.getMultipleChoiceById);

// ===== Protected =====
router.post('/', authMiddleware, multipleChoiceController.createMultipleChoice);
router.put('/:id', authMiddleware, multipleChoiceController.updateMultipleChoice);
router.delete('/:id', authMiddleware, multipleChoiceController.deleteMultipleChoice);

module.exports = router;
