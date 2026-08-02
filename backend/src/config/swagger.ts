import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ApplyAI API',
      version: '1.0.0',
      description: 'Enterprise AI Job Agent REST API',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Firebase ID token, or demo-<uid> / demo-admin-<uid> in DEMO_MODE',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
});
