const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user (send OTP)
const register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);
        res.json({ user, token });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// Google OAuth success callback
const googleAuthSuccess = async (req, res) => {
    console.log('🎬 Google Auth Success Callback Started');
    console.log('📥 Request user object:', req.user ? 'Present' : 'Missing');
    console.log('📥 Request session:', req.session ? 'Present' : 'Missing');
    console.log('📥 Request headers:', {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer,
        'x-forwarded-for': req.headers['x-forwarded-for']
    });

    try {
        if (!req.user) {
            console.log('❌ Google OAuth - No user in request object');
            console.log('📊 Session data:', req.session);
            console.log('📊 Request query:', req.query);
            return res.status(401).json({ message: 'Google authentication failed' });
        }

        console.log('🎉 Google OAuth Success - User authenticated:', {
            email: req.user.email,
            id: req.user._id,
            authProvider: req.user.authProvider,
            googleId: req.user.googleId
        });

        // Generate JWT token
        const jwtPayload = { userId: req.user._id, role: req.user.role };
        console.log('🔐 Creating JWT token with payload:', jwtPayload);

        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET || 'Nhan123456',
            { expiresIn: '7d' }
        );

        console.log('✅ JWT Token generated successfully for user:', req.user.email);
        console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');

        // Get the return URL - support both Lambda (stateless) and local (session)
        let returnUrl;
        
        if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
            // Lambda: Stateless - always redirect to frontend success page
            // Frontend can handle redirecting to previous page using localStorage or query params
            returnUrl = `${process.env.FRONTEND_URL || 'https://quiz-smart.nhandev.org'}/auth/success`;
            console.log('📌 Lambda mode - Using frontend success URL:', returnUrl);
        } else {
            // Local: Get from session
            returnUrl = req.session?.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success`;
            // Clear the returnUrl from session
            if (req.session) {
                delete req.session.returnUrl;
            }
            console.log('📌 Local mode - Using returnUrl from session:', returnUrl);
        }
        
        // Construct the redirect URL with token
        // Check if returnUrl already has query parameters
        const separator = returnUrl.includes('?') ? '&' : '?';
        const redirectURL = `${returnUrl}${separator}token=${token}`;

        console.log('↗️ Redirecting to return URL:', redirectURL);

        // Redirect to the original page with token
        res.redirect(redirectURL);
        console.log('✅ Redirect response sent');
    } catch (error) {
        console.error('❌ Google auth success error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ message: 'Authentication failed' });
    }
};

// Google OAuth failure callback
const googleAuthFailure = (req, res) => {
    console.log('💥 Google OAuth Failure Callback Started');
    console.log('❌ Google OAuth - Authentication failed');
    console.log('📊 Request query params:', req.query);
    console.log('📊 Request session:', req.session);
    console.log('📊 Error details:', req.flash ? req.flash() : 'No flash messages');
    
    // Log specific error information
    const error = req.query.error || 'UNKNOWN_ERROR';
    const errorDescription = req.query.error_description || 'Authentication failed';
    console.error('❌ Error code:', error);
    console.error('❌ Error description:', errorDescription);
    
    // Check common OAuth errors
    if (error === 'access_denied') {
        console.error('❌ User denied access to Google account');
    } else if (error === 'invalid_request') {
        console.error('❌ Invalid OAuth request - check Client ID, Secret, and Callback URL');
    } else if (error === 'unauthorized_client') {
        console.error('❌ Unauthorized client - Client ID may be incorrect or not authorized');
    } else if (error === 'invalid_grant') {
        console.error('❌ Invalid grant - Authorization code may be expired or already used');
    }

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const failureURL = `${frontendURL}/auth/failure?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`;

    console.log('↗️ Redirecting to failure URL:', failureURL);
    res.redirect(failureURL);
};

// Google auth status check
const googleAuthStatus = (req, res) => {
    if (req.user) {
        console.log('✅ Auth status check - User is authenticated:', req.user.email);
        res.json({
            success: true,
            user: req.user,
            message: 'User is authenticated'
        });
    } else {
        console.log('❌ Auth status check - User is not authenticated');
        res.status(401).json({
            success: false,
            message: 'User is not authenticated'
        });
    }
};

// Verify user exists in database (for testing)
const verifyUserInDB = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.userId);

        if (user) {
            console.log('✅ User verified in database:', user.email, 'Auth Provider:', user.authProvider);
            res.json({
                success: true,
                user: user,
                message: 'User exists in database',
                savedAt: user.created_at
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found in database'
            });
        }
    } catch (error) {
        console.error('❌ Error verifying user in database:', error);
        res.status(500).json({ message: error.message });
    }
};

// Logout user
const logout = (req, res) => {
    try {
        // For JWT, we just send success response
        // Client should remove token from localStorage
        console.log('👋 User logged out');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ message: 'Logout failed' });
    }
};

// auth.controller.js
const me = async (req, res) => {
    try {
        // req.user do authMiddleware gắn sẵn là document User
        return res.json(req.user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Health check endpoint
const healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'quiz-smart-server',
        version: '1.0.0'
    });
};

// Generate test token for debugging (DEV ONLY)
const generateTestToken = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Not available in production' });
    }

    try {
        // Find first user in database for testing
        const testUser = await User.findOne({});
        if (!testUser) {
            return res.status(404).json({ message: 'No users found in database' });
        }

        // Generate token for test user
        const token = jwt.sign(
            { userId: testUser._id, role: testUser.role },
            process.env.JWT_SECRET || 'Nhan123456',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Test token generated (DEV ONLY)',
            token: token,
            user: {
                id: testUser._id,
                email: testUser.email,
                role: testUser.role,
                authProvider: testUser.authProvider,
                emailVerified: testUser.email_verified
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Debug Google OAuth configuration
const debugGoogleOAuth = (req, res) => {
    const config = {
        googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
        googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/auth/google/callback',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        sessionSecret: process.env.SESSION_SECRET ? 'Set' : 'Using Default',
        nodeEnv: process.env.NODE_ENV || 'development'
    };

    res.json({
        message: 'Google OAuth Debug Info',
        config: config,
        urls: {
            googleAuthUrl: `${req.protocol}://${req.get('host')}/api/auth/google`,
            callbackUrl: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
            statusUrl: `${req.protocol}://${req.get('host')}/api/auth/status`
        }
    });
};

// Verify registration OTP
const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const result = await authService.verifyRegistrationOTP(email, otp);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Resend registration OTP
const resendRegistrationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await authService.resendRegistrationOTP(email);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Forgot password (send OTP)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await authService.forgotPassword(email);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Reset password with OTP
const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const result = await authService.resetPasswordWithOTP(email, otp, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    me,
    googleAuthSuccess,
    googleAuthFailure,
    googleAuthStatus,
    verifyUserInDB,
    healthCheck,
    generateTestToken,
    debugGoogleOAuth,
    verifyRegistrationOTP,
    resendRegistrationOTP,
    forgotPassword,
    resetPasswordWithOTP
};
