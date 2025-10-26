const mongoose = require('mongoose');
const Test = require('../models/Test');
const MultipleChoice = require('../models/MultipleChoice');
const Vocabulary = require('../models/Vocabulary');
const Grammar = require('../models/Grammar');

// Custom error class for service errors
class ServiceError extends Error {
    constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.name = 'ServiceError';
    }
}


// Create new test
const createTest = async (testData) => {
    try {
        // Validate required fields
        if (!testData.test_title || !testData.main_topic || !testData.test_type) {
            throw new ServiceError('Missing required fields: test_title, main_topic, and test_type are required', 400, 'VALIDATION_ERROR');
        }

        // Check test type is valid
        if (!['multiple_choice', 'grammar', 'vocabulary'].includes(testData.test_type)) {
            throw new ServiceError('Invalid test type. Must be one of: multiple_choice, grammar, vocabulary', 400, 'VALIDATION_ERROR');
        }

        // Check test title is already exists in main topic and sub topic and test type and status is active
        const existingTest = await Test.findOne({
            test_title: testData.test_title,
            main_topic: testData.main_topic,
            sub_topic: testData.sub_topic,
            test_type: testData.test_type,
            status: 'active'
        });

        if (existingTest) {
            throw new ServiceError('Test title already exists for this topic and type', 409, 'DUPLICATE_ERROR');
        }

        // Create new test
        const newTest = new Test(testData);
        const savedTest = await newTest.save();
        
        return {
            message: 'Test created successfully',
            test: savedTest
        };
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }
        
        // Handle mongoose duplicate key error
        if (error.code === 11000) {
            throw new ServiceError('Test with this combination already exists', 409, 'DUPLICATE_ERROR');
        }
        
        throw new ServiceError('Failed to create test', 500, 'DATABASE_ERROR');
    }
};

// cho phép thấy toàn bộ tài liệu test nếu là admin (kể cả deleted), hoặc thấy test của chính mình và public test nếu là user và status is active
const getAllTests = async (filters = {}, userId = null, userRole = null) => {
    try {
        let query = {
            status: { $in: ['active', 'inactive', 'deleted'] },
            ...filters
        };

        if (userRole !== 'admin') {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }

        const tests = await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
        
        return {
            message: 'Tests fetched successfully',
            tests: tests
        };
    } catch (error) {
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid filter parameters provided', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to fetch tests', 500, 'DATABASE_ERROR');
    }
};


// Cho phép thấy toàn bộ tài liệu test multiple choice nếu là admin (kể cả inactive và deleted), hoặy thấy test của chính mình và public test nếu là user
const getAllMultipleChoicesTests = async (userId = null, userRole = null) => {
    try {
        let query = {
            test_type: 'multiple_choice',
            status: { $in: ['active', 'inactive', 'deleted'] }
        };

        // Apply visibility logic
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        } else if (!userId) {
            query.visibility = 'public';
        }

        return await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        throw new ServiceError('Failed to fetch multiple choice tests', 500, 'DATABASE_ERROR');
    }
};

// Cho phép thấy toàn bộ tài liệu test grammar nếu là admin (kể cả inactive và deleted), hoặy thấy test của chính mình và public test nếu là user
const getAllGrammarsTests = async (userId = null, userRole = null) => {
    try {
        let query = {
            test_type: 'grammar',
            status: { $in: ['active', 'inactive', 'deleted'] }
        };

        // Apply visibility logic
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        } else if (!userId) {
            query.visibility = 'public';
        }

        return await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        throw new ServiceError('Failed to fetch grammar tests', 500, 'DATABASE_ERROR');
    }
};

// Cho phép thấy toàn bộ tài liệu test vocabulary nếu là admin (kể cả inactive và deleted), hoặy thấy test của chính mình và public test nếu là user
const getAllVocabulariesTests = async (userId = null, userRole = null) => {
    try {
        let query = {
            test_type: 'vocabulary',
            status: { $in: ['active', 'inactive', 'deleted'] }
        };

        // Apply visibility logic
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        } else if (!userId) {
            query.visibility = 'public';
        }

        return await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        throw new ServiceError('Failed to fetch vocabulary tests', 500, 'DATABASE_ERROR');
    }
};

// Cho phép thấy test by ID nếu là admin (kể cả inactive và deleted), hoặy thấy test của chính mình và public test nếu là user
const getTestById = async (id, userId = null, userRole = null) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        const test = await Test.findById(id)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name');

        if (!test || !['active', 'inactive', 'deleted'].includes(test.status)) {
            throw new ServiceError('Test not found', 404, 'NOT_FOUND');
        }

        // Check visibility permissions
        if (test.visibility === 'private') {
            // Only admin or creator can access private tests
            if (userRole !== 'admin' && test.created_by._id.toString() !== userId?.toString()) {
                throw new ServiceError('Access denied to private test', 403, 'ACCESS_DENIED');
            }
        }

        return test;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to fetch test', 500, 'DATABASE_ERROR');
    }
};

// Update test
const updateTest = async (id, updateData) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        const updatedTest = await Test.findByIdAndUpdate(
            id,
            { ...updateData, updated_at: new Date() },
            { new: true, runValidators: true }
        ).populate('created_by', 'email full_name')
         .populate('updated_by', 'email full_name');

        if (!updatedTest) {
            throw new ServiceError('Test not found', 404, 'NOT_FOUND');
        }

        return updatedTest;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ServiceError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to update test', 500, 'DATABASE_ERROR');
    }
};

// Xoá hẳn khỏi database
const hardDeleteTest = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        // Tìm test trước khi xoá
        const test = await Test.findById(id);
        if (!test) {
            throw new ServiceError('Test not found', 404, 'NOT_FOUND');
        }

        // Xoá tất cả questions liên quan
        if (test.test_type === 'multiple_choice') {
            await MultipleChoice.deleteMany({ test_id: id });
        } else if (test.test_type === 'grammar') {
            await Grammar.deleteMany({ test_id: id });
        } else if (test.test_type === 'vocabulary') {
            await Vocabulary.deleteMany({ test_id: id });
        }

        // Xoá test
        const deletedTest = await Test.findByIdAndDelete(id);
        return deletedTest;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to delete test', 500, 'DATABASE_ERROR');
    }
};

// Tìm kiếm test nếu là admin (kể cả inactive và deleted), hoặy thấy test của chính mình và public test nếu là user
const searchTests = async (searchTerm, userId = null, userRole = null) => {
    try {
        // Validate search term
        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
            throw new ServiceError('Search term is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        const trimmedSearchTerm = searchTerm.trim();
        
        let query = {
            status: { $in: ['active', 'inactive', 'deleted'] },
            $or: [
                { test_title: { $regex: trimmedSearchTerm, $options: 'i' } },
                { description: { $regex: trimmedSearchTerm, $options: 'i' } },
                { main_topic: { $regex: trimmedSearchTerm, $options: 'i' } },
                { sub_topic: { $regex: trimmedSearchTerm, $options: 'i' } }
            ]
        };

        // Apply visibility logic
        if (userRole !== 'admin') {
            if (userId) {
                query.$and = [{
                    $or: [
                        { visibility: 'public' },
                        { created_by: userId }
                    ]
                }];
            } else {
                query.visibility = 'public';
            }
        }

        return await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to search tests', 500, 'DATABASE_ERROR');
    }
};

// Get tests by topic with visibility check (kể cả inactive và deleted)
const getTestsByTopic = async (mainTopic, subTopic = null, userId = null, userRole = null) => {
    try {
        // Validate main topic
        if (!mainTopic || typeof mainTopic !== 'string' || mainTopic.trim().length === 0) {
            throw new ServiceError('Main topic is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        let query = {
            main_topic: mainTopic.trim(),
            status: { $in: ['active', 'inactive', 'deleted'] }
        };

        if (subTopic && typeof subTopic === 'string' && subTopic.trim().length > 0) {
            query.sub_topic = subTopic.trim();
        }

        // Apply visibility logic
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        } else if (!userId) {
            query.visibility = 'public';
        }

        return await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to fetch tests by topic', 500, 'DATABASE_ERROR');
    }
};

// Get tests by type with visibility check (kể cả inactive và deleted)
const getTestsByType = async (testType, userId = null, userRole = null) => {
    try {
        // Validate test type
        if (!testType || !['multiple_choice', 'grammar', 'vocabulary'].includes(testType)) {
            throw new ServiceError('Invalid test type. Must be one of: multiple_choice, grammar, vocabulary', 400, 'VALIDATION_ERROR');
        }

        let query = {
            test_type: testType,
            status: { $in: ['active', 'inactive', 'deleted'] }
        };

        // Apply visibility logic
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        } else if (!userId) {
            query.visibility = 'public';
        }

        return await Test.find(query)
            .populate('created_by', 'email full_name')
            .populate('updated_by', 'email full_name')
            .sort({ created_at: -1 });
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to fetch tests by type', 500, 'DATABASE_ERROR');
    }
};

// Nếu là admin thì hiển thị toàn bộ (kể cả xoá mềm) còn nếu là user (không bao gồm xoá mềm) thì chỉ hiển thị public hoặc của riêng mình
const getAllMultipleChoicesMainTopics = async (userId = null, userRole = null) => {
    try {
        let query = {
            test_type: 'multiple_choice',
            status: { $in: ['active', 'inactive', 'deleted'] },
        };
        
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }
        
        return await Test.distinct('main_topic', query);
    } catch (error) {
        throw new ServiceError('Failed to fetch multiple choice main topics', 500, 'DATABASE_ERROR');
    }
};

// Nếu là admin thì hiển thị toàn bộ (kể cả xoá mềm) còn nếu là user (không bao gồm xoá mềm) thì chỉ hiển thị public hoặc của riêng mình
const getAllMultipleChoicesSubTopicsByMainTopic = async (mainTopic, userId = null, userRole = null) => {
    try {
        // Validate main topic
        if (!mainTopic || typeof mainTopic !== 'string' || mainTopic.trim().length === 0) {
            throw new ServiceError('Main topic is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        let query = {
            test_type: 'multiple_choice',
            main_topic: mainTopic.trim(),
            status: { $in: ['active', 'inactive', 'deleted'] },
        };
        
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }
        
        return await Test.distinct('sub_topic', query);
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to fetch multiple choice sub topics', 500, 'DATABASE_ERROR');
    }
};

// Nếu là admin thì hiển thị toàn bộ (kể cả xoá mềm) còn nếu là user (không bao gồm xoá mềm)     thì chỉ hiển thị public hoặc của riêng mình
const getAllGrammarsMainTopics = async (userId = null, userRole = null) => {
    try {
        let query = {
            test_type: 'grammar',
            status: { $in: ['active', 'inactive', 'deleted'] },
        };
        
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }
        
        return await Test.distinct('main_topic', query);
    } catch (error) {
        throw new ServiceError('Failed to fetch grammar main topics', 500, 'DATABASE_ERROR');
    }
};

// Nếu là admin thì hiển thị toàn bộ còn nếu là user thì chỉ hiển thị public hoặc của riêng mình
const getAllGrammarsSubTopicsByMainTopic = async (mainTopic, userId = null, userRole = null) => {
    try {
        // Validate main topic
        if (!mainTopic || typeof mainTopic !== 'string' || mainTopic.trim().length === 0) {
            throw new ServiceError('Main topic is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        let query = {
            test_type: 'grammar',
            main_topic: mainTopic.trim(),
            status: { $in: ['active', 'inactive', 'deleted'] }
        };

        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }

        return await Test.distinct('sub_topic', query);
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to fetch grammar sub topics', 500, 'DATABASE_ERROR');
    }
};

// Nếu là admin thì hiển thị toàn bộ (kể cả xoá mềm) còn nếu là user (không bao gồm xoá mềm) thì chỉ hiển thị public hoặc của riêng mình
const getAllVocabulariesMainTopics = async (userId = null, userRole = null) => {
    try {
        let query = {
            test_type: 'vocabulary',
            status: { $in: ['active', 'inactive', 'deleted'] },
        };
        
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }
        
        return await Test.distinct('main_topic', query);
    } catch (error) {
        throw new ServiceError('Failed to fetch vocabulary main topics', 500, 'DATABASE_ERROR');
    }
};

// Nếu là admin thì hiển thị toàn bộ (kể cả xoá mềm) còn nếu là user (không bao gồm xoá mềm) thì chỉ hiển thị public hoặc của riêng mình
const getAllVocabulariesSubTopicsByMainTopic = async (mainTopic, userId = null, userRole = null) => {
    try {
        // Validate main topic
        if (!mainTopic || typeof mainTopic !== 'string' || mainTopic.trim().length === 0) {
            throw new ServiceError('Main topic is required and must be a non-empty string', 400, 'VALIDATION_ERROR');
        }

        let query = {
            test_type: 'vocabulary',
            main_topic: mainTopic.trim(),
            status: { $in: ['active', 'inactive', 'deleted'] },
        };
        
        if (userRole !== 'admin' && userId) {
            query.$or = [
                { visibility: 'public' },
                { created_by: userId }
            ];
        }
        
        return await Test.distinct('sub_topic', query);
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        throw new ServiceError('Failed to fetch vocabulary sub topics', 500, 'DATABASE_ERROR');
    }
};

// Xoá mềm test
const softDeleteTest = async (id) => {
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }

        const deletedTest = await Test.findByIdAndUpdate(
            id, 
            { 
                status: 'deleted',
                deleted_at: new Date(),
                updated_at: new Date()
            }, 
            { new: true }
        );

        if (!deletedTest) {
            throw new ServiceError('Test not found', 404, 'NOT_FOUND');
        }

        return deletedTest;
    } catch (error) {
        if (error instanceof ServiceError) {
            throw error;
        }
        
        if (error.name === 'CastError') {
            throw new ServiceError('Invalid test ID format', 400, 'VALIDATION_ERROR');
        }
        
        throw new ServiceError('Failed to delete test', 500, 'DATABASE_ERROR');
    }
};

module.exports = {
    createTest,
    getAllTests,
    getAllMultipleChoicesTests,
    getAllGrammarsTests,
    getAllVocabulariesTests,
    getAllMultipleChoicesMainTopics,
    getAllMultipleChoicesSubTopicsByMainTopic,
    getAllGrammarsMainTopics,
    getAllGrammarsSubTopicsByMainTopic,
    getAllVocabulariesMainTopics,
    getAllVocabulariesSubTopicsByMainTopic,
    getTestById,
    getTestsByTopic,
    getTestsByType,
    updateTest,
    searchTests,
    softDeleteTest,
    hardDeleteTest,
};
