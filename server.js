const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ ENABLED for local development
const dotenv = require('dotenv');
const morgan = require('morgan');
const session = require('express-session');

// Load environment variables FIRST (only in development)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const passport = require('./src/config/passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

const app = express();

// ========================================
// 🌐 CORS Configuration
// ========================================
// Enable CORS for both local and Lambda (Lambda Function URL doesn't auto-handle CORS)

// Normalize origin: remove trailing slash, ensure protocol
const normalizeOrigin = (url) => {
    if (!url) return null;
    // Remove trailing slash
    url = url.replace(/\/+$/, '');
    // If no protocol, assume https for production
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = process.env.NODE_ENV === 'production' ? `https://${url}` : `http://${url}`;
    }
    return url.toLowerCase();
};

// Extract base domain (remove www subdomain for matching)
const getBaseDomain = (url) => {
    if (!url) return null;
    const normalized = normalizeOrigin(url);
    const domain = normalized.replace(/^https?:\/\//, '').split('/')[0];
    // Remove www. prefix for matching
    return domain.replace(/^www\./, '');
};

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
].filter(Boolean).map(normalizeOrigin);

// Also add www version of FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
    const normalized = normalizeOrigin(process.env.FRONTEND_URL);
    const domain = normalized.replace(/^https?:\/\//, '').split('/')[0];
    // Add www version if not already www
    if (!domain.startsWith('www.')) {
        const wwwVersion = normalized.replace(domain, `www.${domain}`);
        allowedOrigins.push(wwwVersion);
    }
    // Add non-www version if it's www
    else {
        const nonWwwVersion = normalized.replace(/^https?:\/\/www\./, (match) => match.replace('www.', ''));
        allowedOrigins.push(nonWwwVersion);
    }
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
        if (!origin) return callback(null, true);
        
        // Normalize incoming origin
        const normalizedOrigin = normalizeOrigin(origin);
        const originBaseDomain = getBaseDomain(origin);
        
        // Check if normalized origin matches any allowed origin
        const isAllowed = allowedOrigins.some(allowed => {
            // Exact match
            if (normalizedOrigin === allowed) return true;
            
            // Match base domain (ignore www subdomain and protocol)
            const allowedBaseDomain = getBaseDomain(allowed);
            return originBaseDomain === allowedBaseDomain;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            // In production, be more strict
            if (process.env.NODE_ENV === 'production') {
                console.warn('⚠️ CORS: Blocked origin:', origin, '(normalized:', normalizedOrigin + ', base:', originBaseDomain + ')');
                console.warn('⚠️ CORS: Allowed origins:', allowedOrigins);
                callback(new Error('Not allowed by CORS'));
            } else {
                // In development, allow all
                callback(null, true);
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization']
}));

console.log('🌐 CORS enabled for:', allowedOrigins);
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('🌐 Running in Lambda - CORS middleware active');
}
console.log('📋 Environment:', {
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV,
    isLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME
});

app.use(express.json());

// Session middleware (only in non-Lambda environments)
// Lambda is stateless, so session middleware causes timeout issues
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'Nhan123456_session_secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));
    
    // Passport middleware with session support
    app.use(passport.initialize());
    app.use(passport.session());
} else {
    console.log('⚠️ Running in Lambda - Session middleware disabled');
    // ✅ Passport MUST be initialized in Lambda for Google OAuth to work
    // But we use session: false in passport.authenticate() calls
    app.use(passport.initialize());
    console.log('✅ Passport initialized for Lambda (stateless mode)');
}

// Morgan logging (only in development or non-Lambda environments)
// In Lambda, use CloudWatch logs instead
if (process.env.NODE_ENV !== 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.use(morgan('dev'));
} else if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Use short format in production non-Lambda
    app.use(morgan('short'));
}

// Swagger documentation (disabled in Lambda to save resources)
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
} else {
    // Return simple JSON docs in Lambda
    app.get('/api-docs', (req, res) => {
        res.json({ 
            message: 'API Documentation',
            endpoints: [
                'GET /api/health',
                'POST /api/auth/login',
                'POST /api/auth/register',
                'GET /api/auth/google',
                'GET /api/vocabularies',
                'GET /api/multiple-choices',
                'GET /api/grammars'
            ],
            note: 'Full documentation available in local development mode'
        });
    });
}

// Health check endpoint (for frontend to test backend connection)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'quiz-smart-server',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const testRoutes = require('./src/routes/test.routes');
const testResultRoutes = require('./src/routes/testResult.routes');
const vocabularyRoutes = require('./src/routes/vocabulary.routes');
const multipleChoiceRoutes = require('./src/routes/multipleChoice.routes');
const grammarRoutes = require('./src/routes/grammar.routes');
const topicRoutes = require('./src/routes/topic.routes');
const reviewRoutes = require('./src/routes/review.routes');

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes  
app.use('/api/users', userRoutes);

// Test routes
app.use('/api/tests', testRoutes);
app.use('/api/test-results', testResultRoutes);

// Content routes
app.use('/api/vocabularies', vocabularyRoutes);
app.use('/api/multiple-choices', multipleChoiceRoutes);
app.use('/api/grammars', grammarRoutes);

// Topic routes
app.use('/api/topics', topicRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Use a DB helper that caches connections for serverless environments
const connectDB = require('./src/config/db');

// Connect to DB (for non-blocking module init in Lambda we call it from handler as well)
connectDB().catch(err => {
    console.error('❌ MongoDB connection error during startup:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Export Express app for serverless/Lambda usage.
// Do NOT call `app.listen()` here — AWS Lambda will invoke via the handler.
module.exports = app;
