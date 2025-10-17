const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
const userRoutes = require('./src/routes/user.routes');
const vocabularyRoutes = require('./src/routes/vocabulary.routes');
const multipleChoiceRoutes = require('./src/routes/multipleChoice.routes');
const grammarRoutes = require('./src/routes/grammar.routes');
const topicRoutes = require('./src/routes/topic.routes');

app.use('/api/users', userRoutes);
app.use('/api/vocabularies', vocabularyRoutes);
app.use('/api/multiple-choices', multipleChoiceRoutes);
app.use('/api/grammars', grammarRoutes);
app.use('/api/topics', topicRoutes);

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizzsmart';

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
