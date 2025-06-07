/**
 * Adaptive Color Scheme Demo Page
 * 
 * This page demonstrates the adaptive color scheme feature based on property types.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyTypeBadge from '@/components/property/PropertyTypeBadge';
import PropertyIcon from '@/components/property/PropertyIcon';
import PropertyDetailHeader from '@/components/property/PropertyDetailHeader';
import { getPropertyColorScheme, PropertyType, propertyColorSchemes } from '@/utils/propertyColorSchemes';

// Sample property data
const sampleProperties = [
  {
    id: '1',
    address: '123 Main Street',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 450000,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2200,
    yearBuilt: 2005,
    propertyType: 'single_family',
    mlsNumber: 'MLS12345',
    listingDate: '2023-04-15',
    daysOnMarket: 14,
    status: 'active' as const,
  },
  {
    id: '2',
    address: '456 Condo Lane, Unit 302',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 320000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    yearBuilt: 2010,
    propertyType: 'condo',
    mlsNumber: 'MLS67890',
    listingDate: '2023-04-10',
    daysOnMarket: 19,
    status: 'active' as const,
  },
  {
    id: '3',
    address: '789 Commercial Blvd',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 1250000,
    bedrooms: 0,
    bathrooms: 2,
    squareFeet: 5000,
    yearBuilt: 2000,
    propertyType: 'commercial',
    mlsNumber: 'MLS24680',
    listingDate: '2023-03-20',
    daysOnMarket: 40,
    status: 'active' as const,
  },
  {
    id: '4',
    address: '321 Townhouse Row',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 385000,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1800,
    yearBuilt: 2015,
    propertyType: 'townhouse',
    mlsNumber: 'MLS13579',
    listingDate: '2023-04-05',
    daysOnMarket: 24,
    status: 'pending' as const,
  },
  {
    id: '5',
    address: '555 Apartment Ave, #201',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 275000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 950,
    yearBuilt: 1995,
    propertyType: 'multi_family',
    mlsNumber: 'MLS97531',
    listingDate: '2023-04-01',
    daysOnMarket: 28,
    status: 'active' as const,
  },
  {
    id: '6',
    address: '777 Industrial Park Road',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 950000,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 8500,
    yearBuilt: 1990,
    propertyType: 'industrial',
    mlsNumber: 'MLS86420',
    listingDate: '2023-03-10',
    daysOnMarket: 50,
    status: 'active' as const,
  },
  {
    id: '7',
    address: '999 Vacant Lot',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 175000,
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    yearBuilt: 0,
    propertyType: 'land',
    mlsNumber: 'MLS74125',
    listingDate: '2023-02-15',
    daysOnMarket: 73,
    status: 'active' as const,
  },
];

export default function AdaptiveColorSchemePage() {
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>('single_family');
  const colorScheme = getPropertyColorScheme(selectedPropertyType);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Adaptive Color Scheme</h1>
        <p className="text-gray-600 mb-6">
          This feature dynamically adjusts the UI color scheme based on property type,
          creating a consistent visual language throughout the application.
        </p>
        
        <Separator className="my-6" />
        
        {/* Color scheme selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Property Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedPropertyType} 
                  onValueChange={(value) => setSelectedPropertyType(value as PropertyType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(propertyColorSchemes).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <PropertyIcon propertyType={type} size="sm" variant="colored" />
                          <span>{type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Badge</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <PropertyTypeBadge propertyType={selectedPropertyType} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Icon Variants</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <PropertyIcon propertyType={selectedPropertyType} variant="outline" />
                <PropertyIcon propertyType={selectedPropertyType} variant="colored" />
                <PropertyIcon propertyType={selectedPropertyType} variant="solid" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Color Palette</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <div 
                  className="w-full h-8 rounded"
                  style={{ backgroundColor: colorScheme.primary }}
                  title="Primary"
                />
                <div 
                  className="w-full h-8 rounded"
                  style={{ backgroundColor: colorScheme.secondary }}
                  title="Secondary"
                />
                <div 
                  className="w-full h-8 rounded"
                  style={{ backgroundColor: colorScheme.badge }}
                  title="Badge"
                />
                <div 
                  className="w-full h-8 rounded" 
                  style={{ backgroundColor: colorScheme.light }}
                  title="Light"
                />
                <div 
                  className="w-full h-8 rounded"
                  style={{ backgroundColor: colorScheme.dark }}
                  title="Dark"
                />
                <div 
                  className="w-full h-8 rounded bg-gradient-to-r"
                  style={{ background: colorScheme.gradient }}
                  title="Gradient"
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Component demos */}
        <Tabs defaultValue="property-cards" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="property-cards">Property Cards</TabsTrigger>
            <TabsTrigger value="property-header">Property Header</TabsTrigger>
          </TabsList>
          
          <TabsContent value="property-cards" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Property Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="property-header" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Property Detail Header</h2>
            <div className="border rounded-lg overflow-hidden">
              <PropertyDetailHeader 
                property={sampleProperties.find(p => p.propertyType === selectedPropertyType) || sampleProperties[0]} 
                onBack={() => {}} 
              />
              
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">Property Overview</h2>
                <p className="text-gray-600">
                  This is a demonstration of how the PropertyDetailHeader component adapts its styling
                  based on the selected property type. The header includes a gradient background, colored
                  navigation tabs, and type-specific iconography.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}