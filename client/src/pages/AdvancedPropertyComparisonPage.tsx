/**
 * Advanced Property Comparison Page
 * 
 * This page provides a comprehensive tool for comparing properties with
 * advanced metrics, visualization options, and customizable categories.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Search, 
  Plus, 
  Settings, 
  Info, 
  HelpCircle, 
  Home,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComparisonProvider } from '@/context/ComparisonContext';

interface PropertySample {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;
  propertyType: string;
  pricePerSqFt: number;
  walkabilityScore: number;
  schoolRating: number;
  neighborhoodRating: number;
  energyEfficiencyScore: number;
  naturalHazardRisk: {
    flood: number;
    fire: number;
    earthquake: number;
    overall: number;
  };
}

const AdvancedPropertyComparisonPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('compare');
  
  // Sample properties for demonstration
  const sampleProperties: PropertySample[] = [
    {
      id: 'prop-1',
      address: '2204 Hill Dr, Grandview, WA 98930',
      price: 350000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1850,
      lotSize: 7500,
      yearBuilt: 2010,
      propertyType: 'Single Family',
      pricePerSqFt: 189,
      walkabilityScore: 8.2,
      schoolRating: 7.5,
      neighborhoodRating: 8.1,
      energyEfficiencyScore: 7.5,
      naturalHazardRisk: {
        flood: 0.02,
        fire: 0.05,
        earthquake: 0.03,
        overall: 0.04
      }
    },
    {
      id: 'prop-2',
      address: '789 Oak Ln, Yakima, WA 98901',
      price: 425000,
      bedrooms: 4,
      bathrooms: 2.5,
      squareFeet: 2200,
      lotSize: 9000,
      yearBuilt: 2005,
      propertyType: 'Single Family',
      pricePerSqFt: 193,
      walkabilityScore: 7.8,
      schoolRating: 8.3,
      neighborhoodRating: 7.9,
      energyEfficiencyScore: 6.8,
      naturalHazardRisk: {
        flood: 0.03,
        fire: 0.02,
        earthquake: 0.05,
        overall: 0.03
      }
    },
    {
      id: 'prop-3',
      address: '1024 Cedar Rd, Sunnyside, WA 98944',
      price: 295000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1650,
      lotSize: 6500,
      yearBuilt: 1995,
      propertyType: 'Single Family',
      pricePerSqFt: 179,
      walkabilityScore: 7.0,
      schoolRating: 6.8,
      neighborhoodRating: 7.2,
      energyEfficiencyScore: 5.9,
      naturalHazardRisk: {
        flood: 0.06,
        fire: 0.03,
        earthquake: 0.04,
        overall: 0.05
      }
    }
  ];

  return (
    <ComparisonProvider>
      <div className="container mx-auto py-6 px-4">
        <Helmet>
          <title>Advanced Property Comparison | IntelligentEstate</title>
        </Helmet>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <BarChart className="mr-2 h-8 w-8" />
              Advanced Property Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare properties with detailed metrics and visualizations
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Customize Metrics
            </Button>
            <Button variant="outline" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="compare" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="compare" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              <span>Compare Properties</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              <span>Find Properties</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              <span>Saved Properties</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Property Comparison</CardTitle>
                <CardDescription>
                  Compare properties side by side with advanced metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select properties from the search tab to begin comparison
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Find Properties to Compare</CardTitle>
                <CardDescription>
                  Search and add properties to your comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sampleProperties.map(property => (
                    <Card key={property.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Home className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary">
                            {property.propertyType}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg">{property.address.split(',')[0]}</CardTitle>
                        <CardDescription>
                          {property.address.split(',').slice(1).join(',')}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between mb-4">
                          <div className="text-2xl font-bold">
                            ${property.price.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-1">
                              ${property.pricePerSqFt}/sqft
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center border rounded-md p-2">
                            <div className="text-lg font-semibold">{property.bedrooms}</div>
                            <div className="text-xs text-muted-foreground">Beds</div>
                          </div>
                          <div className="text-center border rounded-md p-2">
                            <div className="text-lg font-semibold">{property.bathrooms}</div>
                            <div className="text-xs text-muted-foreground">Baths</div>
                          </div>
                          <div className="text-center border rounded-md p-2">
                            <div className="text-lg font-semibold">{property.squareFeet.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">SqFt</div>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="flex justify-between text-sm mb-4">
                          <div className="flex flex-col items-center">
                            <div className="font-medium">{property.walkabilityScore}</div>
                            <div className="text-xs text-muted-foreground">Walk</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="font-medium">{property.schoolRating}</div>
                            <div className="text-xs text-muted-foreground">School</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="font-medium">{property.neighborhoodRating}</div>
                            <div className="text-xs text-muted-foreground">Neighborhood</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="font-medium">{(property.naturalHazardRisk.overall * 100).toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Risk</div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="outline" size="sm" className="w-[48%]">
                          View Details
                        </Button>
                        <Button size="sm" className="w-[48%]">
                          Add to Compare
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    Search More Properties
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Your Saved Properties</CardTitle>
                <CardDescription>
                  Properties you've saved for future reference
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-6 bg-muted rounded-full">
                    <Home className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No Saved Properties Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    As you browse properties, you can save them for easier comparison later. 
                    They'll appear here for quick access.
                  </p>
                  <Button className="mt-4">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Browse Properties
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 p-4 bg-muted/50 rounded-md">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium">About Advanced Property Comparison</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This tool allows you to compare properties across a wide range of metrics and visualize the differences.
                You can customize which metrics to compare, toggle between different visualization modes, and save 
                your comparisons for future reference.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ComparisonProvider>
  );
};

export default AdvancedPropertyComparisonPage;