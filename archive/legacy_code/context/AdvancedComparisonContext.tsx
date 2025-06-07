/**
 * Advanced Property Comparison Context
 * 
 * This context provides an enhanced comparison system for properties with
 * additional metrics, visualization options, and comparison categories.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PropertyForComparison {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;
  propertyType: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  // Enhanced metrics for advanced comparison
  pricePerSqFt?: number;
  valueGrowthRate?: number;
  walkabilityScore?: number;
  schoolRating?: number;
  neighborhoodRating?: number;
  taxRate?: number;
  insuranceCost?: number;
  estimatedMaintenance?: number;
  energyEfficiencyScore?: number;
  proximityToAmenities?: {
    shopping?: number;
    dining?: number;
    parks?: number;
    schools?: number;
    healthcare?: number;
    transportation?: number;
  };
  naturalHazardRisk?: {
    flood?: number;
    fire?: number;
    earthquake?: number;
    overall?: number;
  };
  investmentMetrics?: {
    capRate?: number;
    cashOnCash?: number;
    roi?: number;
    breakEvenPoint?: number;
    rentalYield?: number;
  };
  timestamps?: {
    listedAt?: string;
    updatedAt?: string;
  };
}

export interface ComparisonCategory {
  id: string;
  name: string;
  metrics: string[];
  description: string;
}

interface AdvancedComparisonContextType {
  properties: PropertyForComparison[];
  addProperty: (property: PropertyForComparison) => void;
  removeProperty: (propertyId: string) => void;
  clearProperties: () => void;
  isPropertySelected: (propertyId: string) => boolean;
  selectedCategories: string[];
  toggleCategory: (categoryId: string) => void;
  visualizationType: 'table' | 'chart' | 'cards';
  setVisualizationType: (type: 'table' | 'chart' | 'cards') => void;
  comparisonMode: 'standard' | 'investment' | 'livability' | 'custom';
  setComparisonMode: (mode: 'standard' | 'investment' | 'livability' | 'custom') => void;
  categories: ComparisonCategory[];
  getAvailableMetrics: () => string[];
  getShowOnlyCategoryDifferences: () => boolean;
  setShowOnlyCategoryDifferences: (value: boolean) => void;
}

const AdvancedComparisonContext = createContext<AdvancedComparisonContextType | undefined>(undefined);

// Predefined comparison categories
const comparisonCategories: ComparisonCategory[] = [
  {
    id: 'basic',
    name: 'Basic Information',
    metrics: ['price', 'bedrooms', 'bathrooms', 'squareFeet', 'lotSize', 'yearBuilt', 'propertyType'],
    description: 'Fundamental property details like size, rooms, and cost',
  },
  {
    id: 'value',
    name: 'Value Metrics',
    metrics: ['pricePerSqFt', 'valueGrowthRate', 'taxRate'],
    description: 'Metrics related to property value and potential appreciation',
  },
  {
    id: 'location',
    name: 'Location Quality',
    metrics: ['walkabilityScore', 'schoolRating', 'neighborhoodRating'],
    description: 'Metrics related to the quality of the neighborhood and surroundings',
  },
  {
    id: 'costs',
    name: 'Ownership Costs',
    metrics: ['taxRate', 'insuranceCost', 'estimatedMaintenance'],
    description: 'Ongoing costs associated with property ownership',
  },
  {
    id: 'efficiency',
    name: 'Efficiency & Environmental',
    metrics: ['energyEfficiencyScore'],
    description: 'Energy efficiency and environmental metrics',
  },
  {
    id: 'proximity',
    name: 'Proximity to Amenities',
    metrics: ['proximityToAmenities.shopping', 'proximityToAmenities.dining', 'proximityToAmenities.parks', 
              'proximityToAmenities.schools', 'proximityToAmenities.healthcare', 'proximityToAmenities.transportation'],
    description: 'Distance to key amenities and services',
  },
  {
    id: 'hazards',
    name: 'Natural Hazards',
    metrics: ['naturalHazardRisk.flood', 'naturalHazardRisk.fire', 'naturalHazardRisk.earthquake', 'naturalHazardRisk.overall'],
    description: 'Natural disaster risk assessments',
  },
  {
    id: 'investment',
    name: 'Investment Potential',
    metrics: ['investmentMetrics.capRate', 'investmentMetrics.cashOnCash', 'investmentMetrics.roi', 
              'investmentMetrics.breakEvenPoint', 'investmentMetrics.rentalYield'],
    description: 'Investment-related metrics and projections',
  },
];

export const AdvancedComparisonProvider: React.FC<{
  children: ReactNode;
  maxProperties?: number;
}> = ({ children, maxProperties = 5 }) => {
  const [properties, setProperties] = useState<PropertyForComparison[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['basic', 'value', 'location']);
  const [visualizationType, setVisualizationType] = useState<'table' | 'chart' | 'cards'>('table');
  const [comparisonMode, setComparisonMode] = useState<'standard' | 'investment' | 'livability' | 'custom'>('standard');
  const [showOnlyCategoryDifferences, setShowOnlyCategoryDifferences] = useState<boolean>(false);

  // Load properties from localStorage on initial render
  useEffect(() => {
    const storedProperties = localStorage.getItem('advancedComparisonProperties');
    if (storedProperties) {
      try {
        setProperties(JSON.parse(storedProperties));
      } catch (e) {
        console.error('Failed to parse stored properties:', e);
        localStorage.removeItem('advancedComparisonProperties');
      }
    }
  }, []);

  // Save properties to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('advancedComparisonProperties', JSON.stringify(properties));
  }, [properties]);

  // Update selected categories based on comparison mode
  useEffect(() => {
    switch (comparisonMode) {
      case 'standard':
        setSelectedCategories(['basic', 'value', 'location']);
        break;
      case 'investment':
        setSelectedCategories(['basic', 'value', 'investment', 'costs']);
        break;
      case 'livability':
        setSelectedCategories(['basic', 'location', 'proximity', 'hazards', 'efficiency']);
        break;
      case 'custom':
        // Do not change the selected categories for custom mode
        break;
      default:
        setSelectedCategories(['basic', 'value', 'location']);
    }
  }, [comparisonMode]);

  const addProperty = (property: PropertyForComparison) => {
    // If the property is already in the list, don't add it again
    if (properties.some(p => p.id === property.id)) {
      return;
    }
    
    // Enforce maximum number of properties
    if (properties.length >= maxProperties) {
      const updatedProperties = [...properties.slice(1), property];
      setProperties(updatedProperties);
    } else {
      setProperties([...properties, property]);
    }
  };

  const removeProperty = (propertyId: string) => {
    setProperties(properties.filter(p => p.id !== propertyId));
  };

  const clearProperties = () => {
    setProperties([]);
  };

  const isPropertySelected = (propertyId: string) => {
    return properties.some(p => p.id === propertyId);
  };

  const toggleCategory = (categoryId: string) => {
    setComparisonMode('custom'); // Switch to custom mode when manually toggling categories
    
    if (selectedCategories.includes(categoryId)) {
      // Don't allow removing the last category
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
      }
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const getAvailableMetrics = () => {
    return selectedCategories.flatMap(categoryId => {
      const category = comparisonCategories.find(c => c.id === categoryId);
      return category ? category.metrics : [];
    });
  };

  const getShowOnlyCategoryDifferences = () => {
    return showOnlyCategoryDifferences;
  };

  return (
    <AdvancedComparisonContext.Provider
      value={{
        properties,
        addProperty,
        removeProperty,
        clearProperties,
        isPropertySelected,
        selectedCategories,
        toggleCategory,
        visualizationType,
        setVisualizationType,
        comparisonMode,
        setComparisonMode,
        categories: comparisonCategories,
        getAvailableMetrics,
        getShowOnlyCategoryDifferences,
        setShowOnlyCategoryDifferences,
      }}
    >
      {children}
    </AdvancedComparisonContext.Provider>
  );
};

export const useAdvancedComparison = (): AdvancedComparisonContextType => {
  const context = useContext(AdvancedComparisonContext);
  if (context === undefined) {
    throw new Error('useAdvancedComparison must be used within an AdvancedComparisonProvider');
  }
  return context;
};

export default AdvancedComparisonContext;