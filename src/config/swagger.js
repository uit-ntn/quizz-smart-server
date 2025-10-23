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