const multipleChoiceService = require('../services/multipleChoice.service');
const grammarService = require('../services/grammar.service');

// Get all topics with test counts
const getAllTopics = async (req, res) => {
    try {
        const { type } = req.query; // 'multiple-choice' or 'grammar'
        
        let topics = {};
        
        if (!type || type === 'multiple-choice') {
            const mcQuestions = await multipleChoiceService.getAllMultipleChoices({ status: 'active' });
            mcQuestions.forEach(question => {
                const key = `${question.main_topic}`;
                if (!topics[key]) {
                    topics[key] = {
                        main_topic: question.main_topic,
                        sub_topics: {},
                        total_questions: 0,
                        type: 'multiple-choice'
                    };
                }
                
                if (!topics[key].sub_topics[question.sub_topic]) {
                    topics[key].sub_topics[question.sub_topic] = {
                        name: question.sub_topic,
                        questions: [],
                        count: 0
                    };
                }
                
                topics[key].sub_topics[question.sub_topic].questions.push(question);
                topics[key].sub_topics[question.sub_topic].count++;
                topics[key].total_questions++;
            });
        }
        
        if (!type || type === 'grammar') {
            const grammarQuestions = await grammarService.getAllGrammars({ status: 'active' });
            grammarQuestions.forEach(question => {
                const key = `${question.main_topic}_grammar`;
                if (!topics[key]) {
                    topics[key] = {
                        main_topic: question.main_topic,
                        sub_topics: {},
                        total_questions: 0,
                        type: 'grammar'
                    };
                }
                
                if (!topics[key].sub_topics[question.sub_topic]) {
                    topics[key].sub_topics[question.sub_topic] = {
                        name: question.sub_topic,
                        questions: [],
                        count: 0
                    };
                }
                
                topics[key].sub_topics[question.sub_topic].questions.push(question);
                topics[key].sub_topics[question.sub_topic].count++;
                topics[key].total_questions++;
            });
        }
        
        // Convert to array format
        const topicsArray = Object.values(topics).map(topic => ({
            ...topic,
            sub_topics: Object.values(topic.sub_topics)
        }));
        
        res.json(topicsArray);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get tests by topic and type
const getTestsByTopic = async (req, res) => {
    try {
        const { mainTopic, type } = req.params;
        const { difficulty } = req.query;
        
        let questions = [];
        
        if (type === 'multiple-choice') {
            const filters = { main_topic: mainTopic, status: 'active' };
            if (difficulty) filters.difficulty = difficulty;
            questions = await multipleChoiceService.getAllMultipleChoices(filters);
        } else if (type === 'grammar') {
            const filters = { main_topic: mainTopic, status: 'active' };
            if (difficulty) filters.difficulty = difficulty;
            questions = await grammarService.getAllGrammars(filters);
        }
        
        // Group by sub_topic
        const tests = {};
        questions.forEach(question => {
            if (!tests[question.sub_topic]) {
                tests[question.sub_topic] = {
                    sub_topic: question.sub_topic,
                    main_topic: question.main_topic,
                    type: type,
                    questions: [],
                    difficulties: new Set(),
                    total_questions: 0
                };
            }
            
            tests[question.sub_topic].questions.push(question);
            tests[question.sub_topic].difficulties.add(question.difficulty);
            tests[question.sub_topic].total_questions++;
        });
        
        // Convert difficulties Set to Array and create test info
        const testsArray = Object.values(tests).map(test => ({
            id: `${test.main_topic}_${test.sub_topic}_${type}`.replace(/\s+/g, '_').toLowerCase(),
            title: test.sub_topic,
            main_topic: test.main_topic,
            sub_topic: test.sub_topic,
            type: test.type,
            total_questions: test.total_questions,
            difficulties: Array.from(test.difficulties),
            description: `${test.total_questions} câu hỏi ${type === 'multiple-choice' ? 'trắc nghiệm' : 'tự luận'} về ${test.sub_topic}`
        }));
        
        res.json(testsArray);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get specific test questions
const getTestQuestions = async (req, res) => {
    try {
        const { mainTopic, subTopic, type } = req.params;
        const { difficulty, limit } = req.query;
        
        let questions = [];
        
        if (type === 'multiple-choice') {
            const filters = { 
                main_topic: mainTopic, 
                sub_topic: subTopic, 
                status: 'active' 
            };
            if (difficulty && difficulty !== 'all') filters.difficulty = difficulty;
            questions = await multipleChoiceService.getAllMultipleChoices(filters);
        } else if (type === 'grammar') {
            const filters = { 
                main_topic: mainTopic, 
                sub_topic: subTopic, 
                status: 'active' 
            };
            if (difficulty && difficulty !== 'all') filters.difficulty = difficulty;
            questions = await grammarService.getAllGrammars(filters);
        }
        
        // Shuffle questions
        questions = questions.sort(() => 0.5 - Math.random());
        
        // Limit questions if specified
        if (limit && !isNaN(limit)) {
            questions = questions.slice(0, parseInt(limit));
        }
        
        res.json({
            test_info: {
                main_topic: mainTopic,
                sub_topic: subTopic,
                type: type,
                difficulty: difficulty || 'all',
                total_questions: questions.length
            },
            questions: questions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get random test questions
const getRandomTest = async (req, res) => {
    try {
        const { type } = req.params;
        const { count = 10, difficulty } = req.query;
        
        let questions = [];
        
        if (type === 'multiple-choice') {
            const filters = { status: 'active' };
            if (difficulty && difficulty !== 'all') filters.difficulty = difficulty;
            questions = await multipleChoiceService.getRandomQuestions(parseInt(count), filters);
        } else if (type === 'grammar') {
            const filters = { status: 'active' };
            if (difficulty && difficulty !== 'all') filters.difficulty = difficulty;
            questions = await grammarService.getRandomQuestions(parseInt(count), filters);
        }
        
        res.json({
            test_info: {
                type: type,
                difficulty: difficulty || 'all',
                total_questions: questions.length,
                is_random: true
            },
            questions: questions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllTopics,
    getTestsByTopic,
    getTestQuestions,
    getRandomTest
};