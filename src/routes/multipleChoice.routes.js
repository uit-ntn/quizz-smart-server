const express = require('express');
const router = express.Router();
const multipleChoiceController = require('../controllers/multipleChoice.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

router.get('/', multipleChoiceController.getAllMultipleChoices);
router.post('/', authMiddleware, authorize('admin'), multipleChoiceController.createMultipleChoice);
router.put('/:id', authMiddleware, authorize('admin'), multipleChoiceController.updateMultipleChoice);
router.delete('/:id', authMiddleware, authorize('admin'), multipleChoiceController.deleteMultipleChoice);

module.exports = router;