
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
          },
          '404': {
            description: 'Project not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/analytics/market/{area}': {
      get: {
        summary: 'Get market snapshot for an area',
        parameters: [
          {
            name: 'area',
            in: 'path',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Market snapshot retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MarketSnapshot' }
              }
            }
          }
        }
      }
    },
    '/api/system/health': {
      get: {
        summary: 'Get system health status',
        responses: {
          '200': {
            description: 'System health information',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SystemHealth' }
              }
            }
          }
        }
      }
    },
    '/api/market/analysis/{area}': {
      get: {
        summary: 'Get detailed market analysis with ML predictions',
        parameters: [
          {
            name: 'area',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'timeframe',
            in: 'query',
            required: false,
            schema: { type: 'string', default: '90' }
          }
        ],
        responses: {
          '200': {
            description: 'Detailed market analysis',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MarketAnalysis' }
              }
            }
          }
        }
      }
    },
    '/api/market/comparison': {
      get: {
        summary: 'Compare market metrics across multiple areas',
        parameters: [
          {
            name: 'areas',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Comma-separated list of areas'
          }
        ],
        responses: {
          '200': {
            description: 'Market comparison data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MarketComparison' }
              }
            }
          }
        }
      }
    },
    '/api/market/investment-score/{propertyId}': {
      get: {
        summary: 'Get investment opportunity score for a property',
        parameters: [
          {
            name: 'propertyId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'analysisType',
            in: 'query',
            required: false,
            schema: { 
              type: 'string',
              enum: ['basic', 'comprehensive', 'predictive'],
              default: 'comprehensive'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Investment opportunity score',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InvestmentScore' }
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
      },
      MarketSnapshot: {
        type: 'object',
        properties: {
          averagePrice: { type: 'number' },
          totalListings: { type: 'integer' },
          priceChange: { type: 'number' }
        }
      },
      SystemHealth: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          memory: {
            type: 'object',
            properties: {
              used: { type: 'number' },
              total: { type: 'number' }
            }
          },
          uptime: { type: 'number' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' }
        }
      }
    }
  }
};
