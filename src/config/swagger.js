const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QuizzSmart API',
      version: '1.0.0',
      description: 'API documentation for QuizzSmart learning platform',
      contact: {
        name: 'Nguyen Thanh Nhan',
        email: 'npthanhnhan2003@gmail.com'
      }
    },
    servers: [
      {
        url: process.env.SWAGGER_URL || `http://localhost:${process.env.PORT || 8000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            username: {
              type: 'string',
              example: 'admin'
            },
            full_name: {
              type: 'string',
              example: 'Nguyen Thanh Nhan'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'npthanhnhan2003@gmail.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              example: 'admin'
            },
            avatar_url: {
              type: 'string',
              example: ''
            },
            bio: {
              type: 'string',
              example: 'System administrator account.'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Vocabulary: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '68f13da3eae9807ad836d51d'
            },
            main_topic: {
              type: 'string',
              example: 'Vocabulary'
            },
            sub_topic: {
              type: 'string',
              example: 'Education'
            },
            word: {
              type: 'string',
              example: 'scholarship'
            },
            meaning: {
              type: 'string',
              example: 'học bổng'
            },
            example_sentence: {
              type: 'string',
              example: 'She won a full scholarship to study abroad.'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              example: 'easy'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['education', 'noun', 'vocabulary']
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active'
            },
            created_by: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            updated_by: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        MultipleChoice: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '68f13d25b006b7e56dfe4f23'
            },
            main_topic: {
              type: 'string',
              example: 'TOEIC'
            },
            sub_topic: {
              type: 'string',
              example: 'Part 5 - Incomplete Sentences'
            },
            question_text: {
              type: 'string',
              example: 'The new policy will be effective _____ next Monday.'
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', example: 'A' },
                  text: { type: 'string', example: 'in' }
                }
              }
            },
            correct_answers: {
              type: 'array',
              items: { type: 'string' },
              example: ['B']
            },
            explanation: {
              type: 'object',
              properties: {
                correct: { type: 'string', example: 'Dùng \'on\' với ngày cụ thể (on Monday).' },
                incorrect_choices: {
                  type: 'object',
                  example: {
                    'A': 'in dùng cho tháng/năm/khoảng thời gian.',
                    'C': 'at dùng cho thời điểm giờ cụ thể.',
                    'D': 'for dùng chỉ khoảng thời lượng.'
                  }
                }
              }
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              example: 'easy'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['toeic', 'preposition', 'part5']
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active'
            },
            created_by: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            updated_by: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Grammar: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '68f13e0f8daac46c86a452f5'
            },
            main_topic: {
              type: 'string',
              example: 'Grammar'
            },
            sub_topic: {
              type: 'string',
              example: 'Present Simple'
            },
            question_text: {
              type: 'string',
              example: 'She ___ to school every day.'
            },
            correct_answers: {
              type: 'array',
              items: { type: 'string' },
              example: ['goes']
            },
            explanation_text: {
              type: 'string',
              example: 'Ngôi thứ ba số ít → động từ thêm \'es\'.'
            },
            example_sentence: {
              type: 'string',
              example: 'She goes to school every day.'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              example: 'easy'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['present simple', 'sv-agreement']
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active'
            },
            created_by: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            updated_by: {
              type: 'string',
              example: '68f13f93807377aa09d03b2c'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;