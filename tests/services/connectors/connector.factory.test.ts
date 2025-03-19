import { ConnectorFactory } from '../../../server/services/connectors/connector.factory';
import { CAMAConnector } from '../../../server/services/connectors/cama.connector';
import { GISConnector } from '../../../server/services/connectors/gis.connector';
import { ConnectorRegistry } from '../../../server/services/connectors/baseConnector';

// Mock the connectors
jest.mock('../../../server/services/connectors/cama.connector');
jest.mock('../../../server/services/connectors/gis.connector');

// Mock the registry
jest.mock('../../../server/services/connectors/baseConnector', () => {
  const originalModule = jest.requireActual('../../../server/services/connectors/baseConnector');
  
  return {
    ...originalModule,
    ConnectorRegistry: {
      getInstance: jest.fn(() => ({
        registerConnector: jest.fn(),
        getConnector: jest.fn(),
        getAllConnectors: jest.fn().mockReturnValue([]),
        getConnectorsByType: jest.fn().mockReturnValue([])
      }))
    }
  };
});

// Mock storage for log testing
jest.mock('../../../server/storage', () => ({
  storage: {
    createLog: jest.fn()
  }
}));

describe('ConnectorFactory', () => {
  let factory: ConnectorFactory;
  let mockRegistry: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the mocks
    (CAMAConnector as jest.Mock).mockClear();
    (GISConnector as jest.Mock).mockClear();
    
    // Mock connector instances
    (CAMAConnector as jest.Mock).mockImplementation((name, config) => ({
      getName: () => name,
      getType: () => 'cama',
      config
    }));
    
    (GISConnector as jest.Mock).mockImplementation((name, config) => ({
      getName: () => name,
      getType: () => 'gis',
      config
    }));
    
    // Mock registry instance
    mockRegistry = {
      registerConnector: jest.fn(),
      getConnector: jest.fn(),
      getAllConnectors: jest.fn().mockReturnValue([]),
      getConnectorsByType: jest.fn().mockReturnValue([])
    };
    (ConnectorRegistry.getInstance as jest.Mock).mockReturnValue(mockRegistry);
    
    // Create a fresh factory instance for each test
    factory = ConnectorFactory.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ConnectorFactory.getInstance();
      const instance2 = ConnectorFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createCAMAConnector', () => {
    it('should create and register a CAMA connector', () => {
      const config = {
        baseUrl: 'https://api.example.com/cama',
        apiKey: 'test-api-key'
      };
      
      const connector = factory.createCAMAConnector('test-cama', config);
      
      expect(CAMAConnector).toHaveBeenCalledWith('test-cama', config);
      expect(mockRegistry.registerConnector).toHaveBeenCalled();
      expect(connector).toBeDefined();
      expect(connector.getName()).toBe('test-cama');
      expect(connector.getType()).toBe('cama');
    });
    
    it('should handle errors during connector creation', () => {
      // Make the constructor throw an error
      (CAMAConnector as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed to create connector');
      });
      
      const config = {
        baseUrl: 'https://api.example.com/cama',
        apiKey: 'test-api-key'
      };
      
      expect(() => {
        factory.createCAMAConnector('error-cama', config);
      }).toThrow('Failed to create connector');
      
      // Should not register the connector if creation fails
      expect(mockRegistry.registerConnector).not.toHaveBeenCalled();
    });
  });

  describe('createGISConnector', () => {
    it('should create and register a GIS connector', () => {
      const config = {
        baseUrl: 'https://api.example.com/gis',
        serviceType: 'arcgis' as const
      };
      
      const connector = factory.createGISConnector('test-gis', config);
      
      expect(GISConnector).toHaveBeenCalledWith('test-gis', config);
      expect(mockRegistry.registerConnector).toHaveBeenCalled();
      expect(connector).toBeDefined();
      expect(connector.getName()).toBe('test-gis');
      expect(connector.getType()).toBe('gis');
    });
  });

  describe('createConnector', () => {
    it('should create a connector based on type', () => {
      // Test CAMA connector creation
      const camaConfig = {
        baseUrl: 'https://api.example.com/cama',
        apiKey: 'test-api-key'
      };
      
      const camaConnector = factory.createConnector('cama', 'test-cama', camaConfig);
      expect(camaConnector.getType()).toBe('cama');
      
      // Test GIS connector creation
      const gisConfig = {
        baseUrl: 'https://api.example.com/gis',
        serviceType: 'arcgis' as const
      };
      
      const gisConnector = factory.createConnector('gis', 'test-gis', gisConfig);
      expect(gisConnector.getType()).toBe('gis');
    });
    
    it('should throw error for unsupported connector types', () => {
      expect(() => {
        factory.createConnector('unknown' as any, 'test', {});
      }).toThrow('Unsupported connector type: unknown');
    });
  });

  describe('getConnector', () => {
    it('should retrieve a connector by name', () => {
      const mockConnector = { name: 'test-connector' };
      mockRegistry.getConnector.mockReturnValueOnce(mockConnector);
      
      const result = factory.getConnector('test-connector');
      
      expect(result).toBe(mockConnector);
      expect(mockRegistry.getConnector).toHaveBeenCalledWith('test-connector');
    });
  });

  describe('getAllConnectors', () => {
    it('should retrieve all registered connectors', () => {
      const mockConnectors = [
        { name: 'connector1' },
        { name: 'connector2' }
      ];
      mockRegistry.getAllConnectors.mockReturnValueOnce(mockConnectors);
      
      const result = factory.getAllConnectors();
      
      expect(result).toBe(mockConnectors);
      expect(mockRegistry.getAllConnectors).toHaveBeenCalled();
    });
  });

  describe('getConnectorsByType', () => {
    it('should retrieve connectors filtered by type', () => {
      const mockConnectors = [
        { name: 'cama-connector' }
      ];
      mockRegistry.getConnectorsByType.mockReturnValueOnce(mockConnectors);
      
      const result = factory.getConnectorsByType('cama');
      
      expect(result).toBe(mockConnectors);
      expect(mockRegistry.getConnectorsByType).toHaveBeenCalledWith('cama');
    });
  });
});