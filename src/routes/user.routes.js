const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.updatePassword);

// Admin only routes
router.get('/', authMiddleware, authorize('admin'), userController.getAllUsers);
router.get('/search', authMiddleware, authorize('admin'), userController.searchUsers);
router.get('/:id', authMiddleware, authorize('admin'), userController.getUserById);
router.put('/:id', authMiddleware, authorize('admin'), userController.updateUser);
router.delete('/:id', authMiddleware, authorize('admin'), userController.deleteUser);

module.exports = router;
