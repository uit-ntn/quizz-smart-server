const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// GET routes - static paths first, then dynamic paths
router.get('/', testController.getAllTests);
router.get('/search', testController.searchTests);
router.get('/type/:testType', testController.getTestsByType);
router.get('/topic/:mainTopic/:subTopic', testController.getTestsByTopic);
router.get('/topic/:mainTopic', testController.getTestsByTopic);
// Dynamic :id routes
router.get('/:id', testController.getTestById);

// POST routes
router.post('/', authMiddleware, authorize('admin'), testController.createTest);

// PUT routes
router.put('/:id', authMiddleware, authorize('admin'), testController.updateTest);

// DELETE routes
router.delete('/:id', authMiddleware, authorize('admin'), testController.deleteTest);

module.exports = router;

