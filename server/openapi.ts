
import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Real Estate Analytics API',
    version: '1.0.0',
    description: 'API for real estate market analysis and property assessment'
  },
  paths: {
    '/api/projects/{id}': {
      get: {
        summary: 'Get project by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Project found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  }
};
