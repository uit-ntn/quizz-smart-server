const MultipleChoice = require('../models/MultipleChoice');
const Grammar = require('../models/Grammar');
const Vocabulary = require('../models/Vocabulary');

const getAllTopics = async () => {
  try {
    // Lấy tất cả các chủ đề từ MultipleChoice, Grammar và Vocabulary
    // models use snake_case field names: main_topic, sub_topic
    const mcTopics = await MultipleChoice.distinct('main_topic');
    const grammarTopics = await Grammar.distinct('main_topic');
    const vocabTopics = await Vocabulary.distinct('main_topic');
    
    // Kết hợp và loại bỏ trùng lặp
    const allTopics = [...new Set([...mcTopics, ...grammarTopics, ...vocabTopics])];
    
    // Lấy chi tiết cho mỗi chủ đề
    const topicDetails = await Promise.all(
      allTopics.map(async (mainTopic) => {
  const mcCount = await MultipleChoice.countDocuments({ main_topic: mainTopic });
  const grammarCount = await Grammar.countDocuments({ main_topic: mainTopic });
  const vocabCount = await Vocabulary.countDocuments({ main_topic: mainTopic });

  const mcSubTopics = await MultipleChoice.distinct('sub_topic', { main_topic: mainTopic });
  const grammarSubTopics = await Grammar.distinct('sub_topic', { main_topic: mainTopic });
  const vocabSubTopics = await Vocabulary.distinct('sub_topic', { main_topic: mainTopic });
        
        return {
          mainTopic,
          multipleChoiceCount: mcCount,
          grammarCount: grammarCount,
          vocabularyCount: vocabCount,
          totalQuestions: mcCount + grammarCount + vocabCount,
          subTopics: {
            'multiple-choice': mcSubTopics,
            grammar: grammarSubTopics,
            vocabulary: vocabSubTopics
          }
        };
      })
    );
    
    return topicDetails;
  } catch (error) {
    throw new Error(`Error getting all topics: ${error.message}`);
  }
};

const getTestsByTopic = async (mainTopic, type) => {
  try {
    let Model, topicField, subTopicField;
    if (type === 'multiple-choice') {
      Model = MultipleChoice;
      topicField = 'main_topic';
      subTopicField = 'sub_topic';
    } else if (type === 'grammar') {
      Model = Grammar;
      topicField = 'main_topic';
      subTopicField = 'sub_topic';
    } else if (type === 'vocabulary') {
      Model = Vocabulary;
      topicField = 'main_topic';
      subTopicField = 'sub_topic';
    } else {
      throw new Error('Invalid test type. Must be multiple-choice, grammar, or vocabulary');
    }

  const subTopics = await Model.distinct(subTopicField, { [topicField]: mainTopic });
    
    const testsBySubTopic = await Promise.all(
      subTopics.map(async (subTopic) => {
        const count = await Model.countDocuments({ [topicField]: mainTopic, [subTopicField]: subTopic });
        let difficulty = [];

        // Vocabulary may not have difficulty field populated; for MCQ/Grammar it exists
        if (type !== 'vocabulary') {
          difficulty = await Model.distinct('difficulty', { [topicField]: mainTopic, [subTopicField]: subTopic });
        }
        
        return {
          subTopic,
          questionCount: count,
          availableDifficulties: difficulty.sort(),
          testId: `${mainTopic}-${subTopic}`.toLowerCase().replace(/\s+/g, '-')
        };
      })
    );
    
    return {
      mainTopic,
      type,
      tests: testsBySubTopic
    };
  } catch (error) {
    throw new Error(`Error getting tests by topic: ${error.message}`);
  }
};

const getTestQuestions = async (mainTopic, subTopic, type, options = {}) => {
  try {
    const { limit = 10, difficulty, random = true } = options;
    
    let Model, topicField, subTopicField;
    if (type === 'multiple-choice') {
      Model = MultipleChoice;
      topicField = 'main_topic';
      subTopicField = 'sub_topic';
    } else if (type === 'grammar') {
      Model = Grammar;
      topicField = 'main_topic';
      subTopicField = 'sub_topic';
    } else if (type === 'vocabulary') {
      Model = Vocabulary;
      topicField = 'main_topic';
      subTopicField = 'sub_topic';
    } else {
      throw new Error('Invalid test type. Must be multiple-choice, grammar, or vocabulary');
    }

    let query = { [topicField]: mainTopic, [subTopicField]: subTopic };
    if (difficulty && type !== 'vocabulary') {
      query.difficulty = difficulty;
    }

    let questions;
    if (random) {
      questions = await Model.aggregate([
        { $match: query },
        { $sample: { size: parseInt(limit) } }
      ]);
    } else {
      questions = await Model.find(query).limit(parseInt(limit));
    }

    return {
      mainTopic,
      subTopic,
      type,
      totalQuestions: questions.length,
      questions: questions
    };
  } catch (error) {
    throw new Error(`Error getting test questions: ${error.message}`);
  }
};

const getRandomTest = async (type, count = 10) => {
  try {
    let Model;
    if (type === 'multiple-choice') {
      Model = MultipleChoice;
    } else if (type === 'grammar') {
      Model = Grammar;
    } else if (type === 'vocabulary') {
      Model = Vocabulary;
    } else {
      throw new Error('Invalid test type. Must be multiple-choice, grammar, or vocabulary');
    }

    const questions = await Model.aggregate([
      { $sample: { size: parseInt(count) } }
    ]);

    return {
      type,
      totalQuestions: questions.length,
      isRandom: true,
      questions: questions
    };
  } catch (error) {
    throw new Error(`Error getting random test: ${error.message}`);
  }
};

const getTopicStatistics = async (mainTopic) => {
  try {
    const mcStats = await MultipleChoice.aggregate([
      { $match: { mainTopic } },
      {
        $group: {
          _id: {
            subTopic: '$subTopic',
            difficulty: '$difficulty'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const grammarStats = await Grammar.aggregate([
      { $match: { mainTopic } },
      {
        $group: {
          _id: {
            subTopic: '$subTopic',
            difficulty: '$difficulty'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      mainTopic,
      multipleChoice: mcStats,
      grammar: grammarStats
    };
  } catch (error) {
    throw new Error(`Error getting topic statistics: ${error.message}`);
  }
};

module.exports = {
  getAllTopics,
  getTestsByTopic,
  getTestQuestions,
  getRandomTest,
  getTopicStatistics
};