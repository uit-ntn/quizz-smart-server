const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

// Enhanced CORS middleware - Lambda/API Gateway friendly
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, API Gateway, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001'
        ];
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Allow localhost on any port for development
        if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
            return callback(null, true);
        }
        
        // Allow API Gateway and AWS origins (including custom domains)
        if (origin && (origin.includes('amazonaws.com') || origin.includes('execute-api'))) {
            return callback(null, true);
        }
        
        console.log('⚠️ CORS blocked origin:', origin);
        // In Lambda, be more permissive for debugging - allow all origins temporarily
        if (process.env.NODE_ENV === 'production' && process.env.AWS_LAMBDA_FUNCTION_NAME) {
            console.log('🔓 Lambda: Allowing origin for debugging:', origin);
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // 24 hours
}));
app.use(express.json());

// Session middleware (required for passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'Nhan123456_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Thêm middleware morgan
app.use(morgan('combined')); // hoặc 'dev' cho development

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

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

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes  
app.use('/api/users', userRoutes);

// Other routes
app.use('/api/tests', testRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/vocabularies', vocabularyRoutes);
app.use('/api/multiple-choices', multipleChoiceRoutes);
app.use('/api/grammars', grammarRoutes);

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
