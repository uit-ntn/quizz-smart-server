const userService = require('../services/user.service');
const jwt = require('jsonwebtoken');

// Register new user
const register = async (req, res) => {
    try {
        const { user, token } = await userService.register(req.body);
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await userService.login(email, password);
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

        // You can customize this redirect URL based on your frontend
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectURL = `${frontendURL}/auth/success?token=${token}`;
        
        console.log('↗️ Redirecting to frontend URL:', redirectURL);
        
        // Redirect to frontend with token
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
    
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const failureURL = `${frontendURL}/auth/failure`;
    
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

// Get current user profile (from token)
const me = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    verifyUserInDB
};
