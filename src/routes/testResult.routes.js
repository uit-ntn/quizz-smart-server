const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResult.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// GET routes - static paths first, then dynamic paths
router.get('/', authorize('admin'), testResultController.getAllTestResults);
router.get('/my-results', testResultController.getMyTestResults);
router.get('/my-statistics', testResultController.getMyStatistics);
router.get('/test/:testId', testResultController.getTestResultsByTest);
router.get('/user/:userId/statistics', authorize('admin'), testResultController.getUserStatistics);
// Dynamic :id routes
router.get('/:id', testResultController.getTestResultById);

// POST routes
router.post('/', testResultController.createTestResult);

// DELETE routes
router.delete('/:id', authorize('admin'), testResultController.deleteTestResult);

module.exports = router;

