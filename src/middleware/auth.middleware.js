const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set');
}

const authMiddleware = async (req, res, next) => {
  try {
    // Get token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        type: 'UNAUTHORIZED'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        type: 'UNAUTHORIZED'
      });
    }

    // Fetch user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        type: 'UNAUTHORIZED'
      });
    }

    // Check email verification for local auth
    if (user.authProvider === 'local' && !user.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified',
        type: 'EMAIL_NOT_VERIFIED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      type: 'UNAUTHORIZED'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      type: 'UNAUTHORIZED'
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      type: 'ACCESS_DENIED'
    });
  }

  next();
};

// Optional auth
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.userId) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      req.user = null;
      return next();
    }

    if (user.authProvider === 'local' && !user.email_verified) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  authorize,
  optionalAuthMiddleware
};
