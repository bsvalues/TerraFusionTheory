/**
 * Comparison Context
 * 
 * This context provides a way to select and store properties for comparison
 * across the application.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Property interface for comparison
interface PropertyForComparison {
  id: string;
  address: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  propertyType?: string;
}

interface ComparisonContextType {
  selectedProperties: PropertyForComparison[];
  addToComparison: (property: PropertyForComparison) => void;
  removeFromComparison: (propertyId: string) => void;
  clearComparison: () => void;
  isSelected: (propertyId: string) => boolean;
  compareSelectedProperties: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProperties, setSelectedProperties] = useState<PropertyForComparison[]>([]);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Check if a property is in the comparison list
  const isSelected = useCallback((propertyId: string) => {
    return selectedProperties.some(p => p.id === propertyId);
  }, [selectedProperties]);
  
  // Add a property to the comparison list
  const addToComparison = useCallback((property: PropertyForComparison) => {
    setSelectedProperties(prev => {
      // If property is already in the list, don't add it again
      if (prev.some(p => p.id === property.id)) return prev;
      
      // If already have 3 properties, show an error message
      if (prev.length >= 3) {
        toast({
          title: "Maximum properties reached",
          description: "You can compare up to 3 properties at once. Please remove a property before adding another.",
          variant: "destructive"
        });
        return prev;
      }
      
      // Add property to the list
      toast({
        title: "Property added to comparison",
        description: `${property.address} has been added to your comparison list.`
      });
      
      return [...prev, property];
    });
  }, [toast]);
  
  // Remove a property from the comparison list
  const removeFromComparison = useCallback((propertyId: string) => {
    setSelectedProperties(prev => {
      const newList = prev.filter(p => p.id !== propertyId);
      
      // If we removed a property, show a toast
      if (newList.length < prev.length) {
        toast({
          title: "Property removed from comparison",
          description: "The property has been removed from your comparison list."
        });
      }
      
      return newList;
    });
  }, [toast]);
  
  // Clear the comparison list
  const clearComparison = useCallback(() => {
    setSelectedProperties([]);
    toast({
      title: "Comparison list cleared",
      description: "All properties have been removed from your comparison list."
    });
  }, [toast]);
  
  // Navigate to comparison page with selected properties
  const compareSelectedProperties = useCallback(() => {
    if (selectedProperties.length === 0) {
      toast({
        title: "No properties selected",
        description: "Please select at least one property to compare.",
        variant: "destructive"
      });
      return;
    }
    
    const propertyIds = selectedProperties.map(p => p.id).join(',');
    navigate(`/property-comparison?ids=${propertyIds}`);
  }, [selectedProperties, navigate, toast]);
  
  const value = {
    selectedProperties,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isSelected,
    compareSelectedProperties
  };
  
  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};