import { CAMAConnector, CAMAConnectorConfig } from '../../../server/services/connectors/cama.connector';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    }))
  };
});

describe('CAMAConnector', () => {
  let connector: CAMAConnector;
  let mockAxiosInstance: any;

  // Mock configuration
  const config: CAMAConnectorConfig = {
    baseUrl: 'https://api.example.com/cama',
    apiKey: 'test-api-key',
    county: 'Test County',
    state: 'TS',
    timeout: 5000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn((successFn, errorFn) => {
            // Store the error handler for testing
            mockAxiosInstance.errorHandler = errorFn;
          })
        }
      }
    };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    // Mock the connector's logging methods
    CAMAConnector.prototype.logRequest = jest.fn();
    CAMAConnector.prototype.logResponse = jest.fn();
    CAMAConnector.prototype.logError = jest.fn();

    // Create a new connector instance for each test
    connector = new CAMAConnector('test-connector', config);
  });

  describe('constructor', () => {
    it('should throw an error if baseUrl is not provided', () => {
      expect(() => {
        new CAMAConnector('invalid-connector', { apiKey: 'test-key' } as CAMAConnectorConfig);
      }).toThrow('CAMA connector requires baseUrl in configuration');
    });

    it('should throw an error if apiKey is not provided', () => {
      expect(() => {
        new CAMAConnector('invalid-connector', { baseUrl: 'https://example.com' } as CAMAConnectorConfig);
      }).toThrow('CAMA connector requires apiKey in configuration');
    });

    it('should create a connector with valid configuration', () => {
      expect(connector).toBeDefined();
      expect(connector.getName()).toBe('test-connector');
      expect(connector.getType()).toBe('cama');
      expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey
        })
      }));
    });
  });

  describe('testConnection', () => {
    it('should return true for a successful connection test', async () => {
      // Mock a successful response
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'ok' }
      });

      const result = await connector.testConnection();

      expect(result).toBe(true);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logResponse).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should return false for a failed connection test', async () => {
      // Mock a failed response
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await connector.testConnection();

      expect(result).toBe(false);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logError).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });
  });

  describe('fetchData', () => {
    it('should fetch and format property data correctly', async () => {
      // Sample query params
      const query = {
        parcelId: '12345',
        limit: 10,
        page: 1
      };

      // Mock response data
      const mockResponseData = {
        properties: [
          {
            id: '12345',
            parcelId: '12345',
            address: '123 Main St',
            owner: 'John Doe',
            assessedValue: 250000,
            marketValue: 300000,
            landValue: 100000,
            improvementValue: 200000
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      // Mock a successful response
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData
      });

      const result = await connector.fetchData(query);

      expect(result).toEqual(expect.objectContaining({
        properties: expect.arrayContaining([
          expect.objectContaining({
            id: '12345',
            parcelId: '12345',
            address: '123 Main St'
          })
        ]),
        total: 1
      }));

      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logResponse).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/properties', expect.objectContaining({
        params: query
      }));
    });

    it('should handle errors during data fetching', async () => {
      // Mock a failed response
      const error = new Error('Failed to fetch data');
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(connector.fetchData({ parcelId: '12345' })).rejects.toThrow();
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logError).toHaveBeenCalled();
    });
  });

  describe('getAvailableModels', () => {
    it('should return available models from the API', async () => {
      // Mock response with models
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: {
          models: ['properties', 'valuations', 'sales']
        }
      });

      const models = await connector.getAvailableModels();

      expect(models).toEqual(['properties', 'valuations', 'sales']);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logResponse).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/metadata/models');
    });

    it('should return an empty array if the API call fails', async () => {
      // Mock a failed response
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const models = await connector.getAvailableModels();

      expect(models).toEqual([]);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logError).toHaveBeenCalled();
    });
  });

  describe('getModelSchema', () => {
    it('should return schema for a specific model', async () => {
      // Sample schema
      const mockSchema = {
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'parcelId', type: 'string', required: true },
          { name: 'address', type: 'string', required: true }
        ]
      };

      // Mock response with schema
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: {
          schema: mockSchema
        }
      });

      const schema = await connector.getModelSchema('properties');

      expect(schema).toEqual(mockSchema);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logResponse).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/metadata/models/properties');
    });

    it('should return null if the API call fails', async () => {
      // Mock a failed response
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const schema = await connector.getModelSchema('properties');

      expect(schema).toBeNull();
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logError).toHaveBeenCalled();
    });
  });

  describe('getPropertyByParcel', () => {
    it('should fetch property details by parcel ID', async () => {
      const parcelId = '12345';
      const mockProperty = {
        id: '12345',
        parcelId: '12345',
        address: '123 Main St',
        owner: 'John Doe',
        assessedValue: 250000
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: mockProperty
      });

      const property = await connector.getPropertyByParcel(parcelId);

      expect(property).toEqual(mockProperty);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logResponse).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/properties/${parcelId}`);
    });
  });

  describe('getPropertyValuationHistory', () => {
    it('should fetch valuation history for a property', async () => {
      const parcelId = '12345';
      const mockValuations = [
        { year: 2021, assessedValue: 250000, marketValue: 300000 },
        { year: 2020, assessedValue: 240000, marketValue: 280000 }
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: {
          valuations: mockValuations
        }
      });

      const valuations = await connector.getPropertyValuationHistory(parcelId);

      expect(valuations).toEqual(mockValuations);
      expect(connector.logRequest).toHaveBeenCalled();
      expect(connector.logResponse).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/properties/${parcelId}/valuations`);
    });
  });
});