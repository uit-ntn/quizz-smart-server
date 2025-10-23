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
 * /api/auth/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the authentication service is running
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: quiz-smart-server
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.get('/health', authController.healthCheck);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (sends OTP for email verification)
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
 *       200:
 *         description: OTP sent to email for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Bad request - validation error or user already exists
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
 * /api/auth/verify-registration-otp:
 *   post:
 *     summary: Verify registration OTP and complete user registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Email verified successfully, registration completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-registration-otp', authController.verifyRegistrationOTP);

/**
 * @swagger
 * /api/auth/resend-registration-otp:
 *   post:
 *     summary: Resend registration OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 *       400:
 *         description: Bad request or email already verified
 */
router.post('/resend-registration-otp', authController.resendRegistrationOTP);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset OTP sent to email
 *       400:
 *         description: User not found or email not verified
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP (One-step process)
 *     description: Reset password by providing email, OTP received via email, and new password in one step
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-digit OTP received via email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *             example:
 *               email: "user@example.com"
 *               otp: "123456"
 *               newPassword: "newPassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: Invalid OTP, expired OTP, or password validation error
 */
router.post('/reset-password', authController.resetPasswordWithOTP);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication with account picker
 *     description: Redirects to Google OAuth with account selection screen, allowing users to choose from their Google accounts
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth account picker and consent screen
 */
router.get('/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account consent',  // Account picker + consent screen
        accessType: 'offline'             // Get refresh token
    })
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
 * /api/auth/debug-google:
 *   get:
 *     summary: Debug Google OAuth configuration (Development only)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Google OAuth debug information
 */
router.get('/debug-google', authController.debugGoogleOAuth);

/**
 * @swagger
 * /api/auth/generate-test-token:
 *   get:
 *     summary: Generate test token for debugging (Development only)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Test token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       403:
 *         description: Not available in production
 *       404:
 *         description: No users found in database
 */
router.get('/generate-test-token', authController.generateTestToken);

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
