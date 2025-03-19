// Export base connector types and interfaces
export * from './baseConnector';

// Export connector implementations
export * from './cama.connector';
export * from './gis.connector';

// Export connector factory and registry
export * from './connector.factory';

// Export initialization function
export * from './connectors.init';

// Re-export main instances for convenience
import { connectorFactory } from './connector.factory';
import { connectorRegistry } from './baseConnector';
import { initializeConnectors } from './connectors.init';

export { connectorFactory, connectorRegistry, initializeConnectors };