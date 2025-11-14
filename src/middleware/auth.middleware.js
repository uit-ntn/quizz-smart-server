const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        console.log(`🔐 Auth middleware - ${req.method} ${req.path}`);
        console.log('📥 Headers:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            origin: req.headers.origin,
            userAgent: req.headers['user-agent']?.substring(0, 50)
        });
        
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ message: 'Authentication required' });
        }

        console.log('🎫 Token received:', token.substring(0, 20) + '...');

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Nhan123456');
        console.log('🎫 Token decoded:', { userId: decoded.userId, role: decoded.role });
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('❌ User not found in database:', decoded.userId);
            return res.status(401).json({ message: 'Invalid token' });
        }

        console.log('👤 User found:', { 
            email: user.email, 
            authProvider: user.authProvider, 
            emailVerified: user.email_verified 
        });

        // Check if user email is verified (for local auth only)
        if (user.authProvider === 'local' && !user.email_verified) {
            console.log('❌ Email not verified for local auth user');
            return res.status(401).json({ message: 'Email not verified' });
        }

        req.user = user;
        console.log('✅ Authentication successful for user:', user.email);
        next();
    } catch (error) {
        console.log('❌ Auth middleware error:', error.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Authorization middleware for role-based access
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        next();
    };
};

// Optional auth middleware - attaches user if token exists and valid, but doesn't fail if no token
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            // No token provided, continue without user
            req.user = null;
            return next();
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Nhan123456');
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            req.user = null;
            return next();
        }

        // Check if user email is verified (for local auth only)
        if (user.authProvider === 'local' && !user.email_verified) {
            req.user = null;
            return next();
        }

        req.user = user;
        next();
    } catch (error) {
        // Token invalid, continue without user
        req.user = null;
        next();
    }
};

module.exports = { authMiddleware, authorize, optionalAuthMiddleware };