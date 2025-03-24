import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseDataConnector, ConnectorConfig } from './baseConnector';

/**
 * Census Data Connector Configuration
 */
export interface CensusConnectorConfig extends ConnectorConfig {
  baseUrl: string;
  apiKey: string;
  defaultYear?: string; // Default year for data requests
  defaultState?: string; // Default state for data requests
}

/**
 * Demographic Data structure
 */
export interface DemographicData {
  geographyId: string;
  geographyName: string;
  geographyType: string; // county, tract, block group, etc.
  year: string;
  totalPopulation: number;
  medianAge: number;
  medianHouseholdIncome: number;
  perCapitaIncome: number;
  povertyRate: number;
  educationHighSchool: number; // % with high school degree
  educationBachelor: number; // % with bachelor's degree
  householdUnits: number;
  householdSize: number;
  ownerOccupiedUnits: number;
  renterOccupiedUnits: number;
  vacancyRate: number;
  medianHomeValue: number;
  medianGrossRent: number;
  [key: string]: any;
}

/**
 * Housing Data structure
 */
export interface HousingData {
  geographyId: string;
  geographyName: string;
  geographyType: string; // county, tract, block group, etc.
  year: string;
  totalHousingUnits: number;
  occupiedHousingUnits: number;
  vacantHousingUnits: number;
  homeownershipRate: number;
  medianHomeValue: number;
  medianGrossRent: number;
  medianMonthlyOwnerCosts: number;
  unitsInStructure: {
    singleUnit: number;
    twoToFourUnits: number;
    fiveToNineUnits: number;
    tenOrMoreUnits: number;
    mobile: number;
    boat_rv_van: number;
  };
  yearBuilt: {
    before1940: number;
    from1940To1959: number;
    from1960To1979: number;
    from1980To1999: number;
    from2000To2009: number;
    from2010ToPresent: number;
  };
  [key: string]: any;
}

/**
 * Census API Query Parameters
 */
export interface CensusQueryParams {
  dataset?: string; // acs5, acs1, etc.
  year?: string;
  variables?: string[];
  geographyType?: string; // state, county, tract, block group, etc.
  geographyIds?: string[];
  state?: string;
  county?: string;
  [key: string]: any;
}

/**
 * Implementation of connector for U.S. Census Bureau Data APIs
 */
export class CensusConnector extends BaseDataConnector {
  private client: AxiosInstance;

  constructor(name: string, config: CensusConnectorConfig) {
    super(name, 'census', config);
    
    // Validate required config
    if (!config.baseUrl) {
      throw new Error('Census connector requires baseUrl in configuration');
    }
    
    if (!config.apiKey) {
      throw new Error('Census connector requires apiKey in configuration');
    }
    
    // Create Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      }
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const message = this.extractErrorMessage(error.response.data) || 'API Error';
          throw new Error(`Census API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from Census API');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Error in Census request: ${error.message}`);
        }
      }
    );
  }
  
  /**
   * Test connection to the Census API
   */
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const dataset = 'acs/acs5';
      const year = (this.config as CensusConnectorConfig).defaultYear || '2021';
      const endpoint = `/${dataset}/${year}/profile`;
      
      // Log the request
      await this.logRequest('GET', endpoint, {});
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, {
          params: {
            get: 'NAME',
            for: 'state:*',
            key: (this.config as CensusConnectorConfig).apiKey
          }
        }),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, {}, response.data, duration);
      
      return response.status === 200 && Array.isArray(response.data);
    } catch (error) {
      await this.logError('GET', '/test', {}, error);
      return false;
    }
  }
  
  /**
   * Fetch census data based on query parameters
   */
  async fetchData(query: CensusQueryParams): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Default values
      const dataset = query.dataset || 'acs/acs5';
      const year = query.year || (this.config as CensusConnectorConfig).defaultYear || '2021';
      const endpoint = `/${dataset}/${year}/profile`;
      
      // Log the request
      await this.logRequest('GET', endpoint, query);
      
      // Build the variable list
      const getParam = query.variables && query.variables.length > 0 ? 
        ['NAME', ...query.variables].join(',') : 'NAME';
      
      // Build the geography specification
      let forParam = '';
      let inParam = {};
      
      if (query.geographyType && query.geographyIds) {
        forParam = `${query.geographyType}:${query.geographyIds.join(',')}`;
      } else if (query.geographyType) {
        forParam = `${query.geographyType}:*`;
      } else {
        forParam = 'tract:*';
      }
      
      // Add geography hierarchy filters if provided
      if (query.state) {
        inParam = { 
          ...inParam, 
          'state': query.state 
        };
      } else if ((this.config as CensusConnectorConfig).defaultState) {
        inParam = { 
          ...inParam, 
          'state': (this.config as CensusConnectorConfig).defaultState 
        };
      }
      
      if (query.county) {
        inParam = { 
          ...inParam, 
          'county': query.county 
        };
      }
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, {
          params: {
            get: getParam,
            for: forParam,
            ...inParam,
            key: (this.config as CensusConnectorConfig).apiKey
          }
        }),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, query, response.data, duration);
      
      // Process the data
      return this.processResponseData(response.data, query);
    } catch (error) {
      await this.logError('GET', '/data', query, error);
      throw error;
    }
  }
  
  /**
   * Get demographic data for a specific geography
   */
  async getDemographicData(params: {
    state?: string;
    county?: string;
    tract?: string;
    blockGroup?: string;
    year?: string;
    geographyType?: string;
  }): Promise<DemographicData[]> {
    try {
      // Set default geography type if not provided
      let geographyType = params.geographyType || 'tract';
      let geographyIds: string[] | undefined;
      
      // If specific tract or block group is provided, use it
      if (params.blockGroup) {
        geographyType = 'block group';
        geographyIds = [params.blockGroup];
      } else if (params.tract) {
        geographyType = 'tract';
        geographyIds = [params.tract];
      }
      
      // Define demographic variables to fetch
      const variables = [
        'DP05_0001E', // Total population
        'DP05_0018E', // Median age
        'DP03_0062E', // Median household income
        'DP03_0063E', // Per capita income
        'DP03_0119PE', // Poverty rate
        'DP02_0067PE', // High school graduate or higher
        'DP02_0068PE', // Bachelor's degree or higher
        'DP04_0001E', // Total housing units
        'DP04_0002E', // Occupied housing units
        'DP04_0003E', // Vacant housing units
        'DP04_0046E', // Owner-occupied units
        'DP04_0047E', // Renter-occupied units
        'DP04_0089E', // Median home value
        'DP04_0134E'  // Median gross rent
      ];
      
      // Prepare the query
      const query: CensusQueryParams = {
        dataset: 'acs/acs5/profile',
        year: params.year || (this.config as CensusConnectorConfig).defaultYear || '2021',
        variables,
        geographyType,
        state: params.state || (this.config as CensusConnectorConfig).defaultState,
        county: params.county
      };
      
      if (geographyIds) {
        query.geographyIds = geographyIds;
      }
      
      // Fetch the data
      const response = await this.fetchData(query);
      
      // Transform to DemographicData format
      return this.transformToDemographicData(response, query.year as string);
    } catch (error) {
      await this.logError('GET', '/demographics', params, error);
      throw error;
    }
  }
  
  /**
   * Get housing data for a specific geography
   */
  async getHousingData(params: {
    state?: string;
    county?: string;
    tract?: string;
    blockGroup?: string;
    year?: string;
    geographyType?: string;
  }): Promise<HousingData[]> {
    try {
      // Set default geography type if not provided
      let geographyType = params.geographyType || 'tract';
      let geographyIds: string[] | undefined;
      
      // If specific tract or block group is provided, use it
      if (params.blockGroup) {
        geographyType = 'block group';
        geographyIds = [params.blockGroup];
      } else if (params.tract) {
        geographyType = 'tract';
        geographyIds = [params.tract];
      }
      
      // Define housing variables to fetch
      const variables = [
        'DP04_0001E', // Total housing units
        'DP04_0002E', // Occupied housing units
        'DP04_0003E', // Vacant housing units
        'DP04_0046PE', // Homeownership rate
        'DP04_0089E', // Median home value
        'DP04_0134E', // Median gross rent
        'DP04_0091E', // Median monthly owner costs (with mortgage)
        'DP04_0007E', // Units in structure: 1-unit, detached
        'DP04_0008E', // Units in structure: 1-unit, attached
        'DP04_0009E', // Units in structure: 2 units
        'DP04_0010E', // Units in structure: 3 or 4 units
        'DP04_0011E', // Units in structure: 5 to 9 units
        'DP04_0012E', // Units in structure: 10 to 19 units
        'DP04_0013E', // Units in structure: 20 or more units
        'DP04_0014E', // Units in structure: Mobile home
        'DP04_0015E', // Units in structure: Boat, RV, van, etc.
        'DP04_0025E', // Year structure built: Built 2014 or later
        'DP04_0026E', // Year structure built: Built 2010 to 2013
        'DP04_0027E', // Year structure built: Built 2000 to 2009
        'DP04_0028E', // Year structure built: Built 1990 to 1999
        'DP04_0029E', // Year structure built: Built 1980 to 1989
        'DP04_0030E', // Year structure built: Built 1970 to 1979
        'DP04_0031E', // Year structure built: Built 1960 to 1969
        'DP04_0032E', // Year structure built: Built 1950 to 1959
        'DP04_0033E', // Year structure built: Built 1940 to 1949
        'DP04_0034E'  // Year structure built: Built 1939 or earlier
      ];
      
      // Prepare the query
      const query: CensusQueryParams = {
        dataset: 'acs/acs5/profile',
        year: params.year || (this.config as CensusConnectorConfig).defaultYear || '2021',
        variables,
        geographyType,
        state: params.state || (this.config as CensusConnectorConfig).defaultState,
        county: params.county
      };
      
      if (geographyIds) {
        query.geographyIds = geographyIds;
      }
      
      // Fetch the data
      const response = await this.fetchData(query);
      
      // Transform to HousingData format
      return this.transformToHousingData(response, query.year as string);
    } catch (error) {
      await this.logError('GET', '/housing', params, error);
      throw error;
    }
  }
  
  /**
   * Get available data models/tables
   */
  async getAvailableModels(): Promise<string[]> {
    return [
      'demographics',
      'housing',
      'income',
      'education',
      'employment',
      'commuting',
      'health_insurance',
      'veterans'
    ];
  }
  
  /**
   * Get schema for a specific model/table
   */
  async getModelSchema(modelName: string): Promise<any> {
    // Return schema based on the model name
    switch (modelName) {
      case 'demographics':
        return {
          type: 'object',
          properties: {
            geographyId: { type: 'string' },
            geographyName: { type: 'string' },
            geographyType: { type: 'string' },
            year: { type: 'string' },
            totalPopulation: { type: 'number' },
            medianAge: { type: 'number' },
            medianHouseholdIncome: { type: 'number' },
            perCapitaIncome: { type: 'number' },
            povertyRate: { type: 'number' },
            educationHighSchool: { type: 'number' },
            educationBachelor: { type: 'number' },
            householdUnits: { type: 'number' },
            householdSize: { type: 'number' },
            ownerOccupiedUnits: { type: 'number' },
            renterOccupiedUnits: { type: 'number' },
            vacancyRate: { type: 'number' },
            medianHomeValue: { type: 'number' },
            medianGrossRent: { type: 'number' }
          }
        };
      case 'housing':
        return {
          type: 'object',
          properties: {
            geographyId: { type: 'string' },
            geographyName: { type: 'string' },
            geographyType: { type: 'string' },
            year: { type: 'string' },
            totalHousingUnits: { type: 'number' },
            occupiedHousingUnits: { type: 'number' },
            vacantHousingUnits: { type: 'number' },
            homeownershipRate: { type: 'number' },
            medianHomeValue: { type: 'number' },
            medianGrossRent: { type: 'number' },
            medianMonthlyOwnerCosts: { type: 'number' },
            unitsInStructure: {
              type: 'object',
              properties: {
                singleUnit: { type: 'number' },
                twoToFourUnits: { type: 'number' },
                fiveToNineUnits: { type: 'number' },
                tenOrMoreUnits: { type: 'number' },
                mobile: { type: 'number' },
                boat_rv_van: { type: 'number' }
              }
            },
            yearBuilt: {
              type: 'object',
              properties: {
                before1940: { type: 'number' },
                from1940To1959: { type: 'number' },
                from1960To1979: { type: 'number' },
                from1980To1999: { type: 'number' },
                from2000To2009: { type: 'number' },
                from2010ToPresent: { type: 'number' }
              }
            }
          }
        };
      default:
        return null;
    }
  }
  
  /**
   * Process raw Census API response data into a structured format
   */
  private processResponseData(data: any, query: CensusQueryParams): any {
    // Handle empty or invalid response
    if (!data || !Array.isArray(data) || data.length < 2) {
      return [];
    }
    
    // Extract headers and data rows
    const headers = data[0];
    const rows = data.slice(1);
    
    // Map rows to objects using headers as keys
    return rows.map(row => {
      const obj: any = {};
      
      headers.forEach((header: string, index: number) => {
        // Try to convert numeric values
        const value = row[index];
        obj[header] = !isNaN(Number(value)) ? Number(value) : value;
      });
      
      return obj;
    });
  }
  
  /**
   * Transform Census API data to DemographicData format
   */
  private transformToDemographicData(data: any[], year: string): DemographicData[] {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.map(item => {
      const geographyId = this.determineGeographyId(item);
      const geographyType = this.determineGeographyType(item);
      
      return {
        geographyId,
        geographyName: item.NAME || 'Unknown',
        geographyType,
        year,
        totalPopulation: item.DP05_0001E || 0,
        medianAge: item.DP05_0018E || 0,
        medianHouseholdIncome: item.DP03_0062E || 0,
        perCapitaIncome: item.DP03_0063E || 0,
        povertyRate: item.DP03_0119PE || 0,
        educationHighSchool: item.DP02_0067PE || 0,
        educationBachelor: item.DP02_0068PE || 0,
        householdUnits: item.DP04_0001E || 0,
        householdSize: 0, // Calculated field
        ownerOccupiedUnits: item.DP04_0046E || 0,
        renterOccupiedUnits: item.DP04_0047E || 0,
        vacancyRate: item.DP04_0003E ? (item.DP04_0003E / item.DP04_0001E) * 100 : 0,
        medianHomeValue: item.DP04_0089E || 0,
        medianGrossRent: item.DP04_0134E || 0
      };
    });
  }
  
  /**
   * Transform Census API data to HousingData format
   */
  private transformToHousingData(data: any[], year: string): HousingData[] {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.map(item => {
      const geographyId = this.determineGeographyId(item);
      const geographyType = this.determineGeographyType(item);
      
      // Calculate structure types
      const singleUnit = (item.DP04_0007E || 0) + (item.DP04_0008E || 0);
      const twoToFourUnits = (item.DP04_0009E || 0) + (item.DP04_0010E || 0);
      const fiveToNineUnits = item.DP04_0011E || 0;
      const tenOrMoreUnits = (item.DP04_0012E || 0) + (item.DP04_0013E || 0);
      const mobile = item.DP04_0014E || 0;
      const boat_rv_van = item.DP04_0015E || 0;
      
      // Calculate year built buckets
      const from2010ToPresent = (item.DP04_0025E || 0) + (item.DP04_0026E || 0);
      const from2000To2009 = item.DP04_0027E || 0;
      const from1980To1999 = (item.DP04_0028E || 0) + (item.DP04_0029E || 0);
      const from1960To1979 = (item.DP04_0030E || 0) + (item.DP04_0031E || 0);
      const from1940To1959 = (item.DP04_0032E || 0) + (item.DP04_0033E || 0);
      const before1940 = item.DP04_0034E || 0;
      
      return {
        geographyId,
        geographyName: item.NAME || 'Unknown',
        geographyType,
        year,
        totalHousingUnits: item.DP04_0001E || 0,
        occupiedHousingUnits: item.DP04_0002E || 0,
        vacantHousingUnits: item.DP04_0003E || 0,
        homeownershipRate: item.DP04_0046PE || 0,
        medianHomeValue: item.DP04_0089E || 0,
        medianGrossRent: item.DP04_0134E || 0,
        medianMonthlyOwnerCosts: item.DP04_0091E || 0,
        unitsInStructure: {
          singleUnit,
          twoToFourUnits,
          fiveToNineUnits,
          tenOrMoreUnits,
          mobile,
          boat_rv_van
        },
        yearBuilt: {
          before1940,
          from1940To1959,
          from1960To1979,
          from1980To1999,
          from2000To2009,
          from2010ToPresent
        }
      };
    });
  }
  
  /**
   * Determine geography ID from Census API response item
   */
  private determineGeographyId(item: any): string {
    // Census API responses include geography identifiers
    // The logic depends on the geography level being queried
    if (item.state && item.county && item.tract && item['block group']) {
      return `${item.state}${item.county}${item.tract}${item['block group']}`;
    }
    
    if (item.state && item.county && item.tract) {
      return `${item.state}${item.county}${item.tract}`;
    }
    
    if (item.state && item.county) {
      return `${item.state}${item.county}`;
    }
    
    if (item.state) {
      return item.state;
    }
    
    return 'unknown';
  }
  
  /**
   * Determine geography type from Census API response item
   */
  private determineGeographyType(item: any): string {
    // Census API responses include geography identifiers
    // The logic depends on the geography level being queried
    if (item['block group']) {
      return 'block group';
    }
    
    if (item.tract) {
      return 'tract';
    }
    
    if (item.county) {
      return 'county';
    }
    
    if (item.state) {
      return 'state';
    }
    
    return 'unknown';
  }
}