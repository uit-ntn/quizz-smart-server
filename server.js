const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./src/config/passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizsmart';

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
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation available at ${PORT}/api-docs`);
    console.log("Connected DB:", process.env.MONGODB_URI);



});
