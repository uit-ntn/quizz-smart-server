const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints (register, login, Google OAuth)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen
 */
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to frontend with authentication result
 */
router.get('/google/callback', (req, res, next) => {
    console.log('🔴 Google OAuth callback received');
    console.log('📥 Callback query params:', req.query);
    console.log('📥 Callback headers:', {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer
    });
    next();
}, passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false 
}), (req, res, next) => {
    console.log('🟢 Passport authentication completed');
    console.log('👤 User object after passport:', req.user ? 'Present' : 'Missing');
    if (req.user) {
        console.log('👤 User details:', {
            id: req.user._id,
            email: req.user.email,
            googleId: req.user.googleId
        });
    }
    next();
}, authController.googleAuthSuccess);

/**
 * @swagger
 * /api/auth/google/failure:
 *   get:
 *     summary: Google OAuth failure redirect
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to frontend failure page
 */
router.get('/google/failure', (req, res, next) => {
    console.log('🔴 Google OAuth failure route accessed');
    console.log('📥 Failure query params:', req.query);
    console.log('📥 Session at failure:', req.session);
    next();
}, authController.googleAuthFailure);

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check authentication status
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication status
 *       401:
 *         description: Not authenticated
 */
router.get('/status', authController.googleAuthStatus);

/**
 * @swagger
 * /api/auth/verify-db:
 *   get:
 *     summary: Verify user exists in database (for testing)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User verified in database
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/verify-db', authMiddleware, authController.verifyUserInDB);

module.exports = router;
