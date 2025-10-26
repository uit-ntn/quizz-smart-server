const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const session = require('express-session');

// Load environment variables FIRST
dotenv.config();

const passport = require('./src/config/passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

const app = express();

// Enhanced CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
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
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        
        console.log('⚠️ CORS blocked origin:', origin);
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

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://npthanhnhan2003:13012003NTN@cluster0.rjn9pon.mongodb.net/quiz-smart?retryWrites=true&w=majority&appName=Cluster0';

// Hàm async để connect
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('📦 Database name:', mongoose.connection.name);

        // In danh sách collections có trong DB
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name));
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
    }
}

connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const host = process.env.HOST || 'localhost'; 
const PORT = process.env.PORT || 8000;
app.listen(PORT, host, () => {
    console.log(`Server is running on http://${host}:${PORT}`);
    console.log(`Swagger documentation available at http://${host}:${PORT}/api-docs`);
    console.log("Connected DB:", process.env.MONGODB_URI);
});
