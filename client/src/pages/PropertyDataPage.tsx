import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  AlertCircle,
  Search,
  MapPin,
  Home,
  Building,
  Calendar,
  DollarSign,
  RefreshCw,
  Loader2,
  ChevronDown,
  Info,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Property data interface
interface PropertyData {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  yearBuilt: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  estimatedValue: number | null;
  assessedValue: number | null;
  taxAmount: number | null;
  zoning: string | null;
  latitude: number | null;
  longitude: number | null;
  parcelId: string | null;
  additionalDetails: Record<string, any>;
}

// Neighborhood data interface
interface NeighborhoodData {
  name: string;
  medianHomeValue: number | null;
  averageHomeValue: number | null;
  averageYearBuilt: number | null;
  totalProperties: number | null;
  schoolRating: number | null;
  crimeIndex: number | null;
  walkScore: number | null;
  transitScore: number | null;
  demographics: Record<string, any>;
  trends: Record<string, any>;
  boundaries: any; // GeoJSON polygon
}

// Climate data interface
interface ClimateData {
  annualPrecipitation: number;
  annualSnowfall: number | null;
  averageTemperature: number;
  averageHighTemperature: number;
  averageLowTemperature: number;
  floodRisk: string;
  droughtRisk: string;
  fireRisk: string;
  stormRisk: string;
  naturalDisasterHistory: Record<string, any>;
}

const PropertyDataPage: React.FC = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [address, setAddress] = useState('');
  const [activeTab, setActiveTab] = useState('property');
  const { toast } = useToast();
  
  // Fetch property data query
  const propertyQuery = useQuery({
    queryKey: ['/api/aci/property', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await apiRequest(`/api/aci/property?address=${encodeURIComponent(address)}`, { 
        method: 'GET' 
      });
      return response.data as PropertyData;
    },
    enabled: !!address,
  });
  
  // Fetch neighborhood data query (dependent on property query for coordinates)
  const neighborhoodQuery = useQuery({
    queryKey: ['/api/aci/neighborhood', propertyQuery.data?.latitude, propertyQuery.data?.longitude],
    queryFn: async () => {
      if (!propertyQuery.data?.latitude || !propertyQuery.data?.longitude) return null;
      const response = await apiRequest(
        `/api/aci/neighborhood?lat=${propertyQuery.data.latitude}&lng=${propertyQuery.data.longitude}`, 
        { method: 'GET' }
      );
      return response.data as NeighborhoodData;
    },
    enabled: !!(propertyQuery.data?.latitude && propertyQuery.data?.longitude),
  });
  
  // Fetch climate data query (dependent on property query for coordinates)
  const climateQuery = useQuery({
    queryKey: ['/api/aci/climate', propertyQuery.data?.latitude, propertyQuery.data?.longitude],
    queryFn: async () => {
      if (!propertyQuery.data?.latitude || !propertyQuery.data?.longitude) return null;
      const response = await apiRequest(
        `/api/aci/climate?lat=${propertyQuery.data.latitude}&lng=${propertyQuery.data.longitude}`, 
        { method: 'GET' }
      );
      return response.data as ClimateData;
    },
    enabled: !!(propertyQuery.data?.latitude && propertyQuery.data?.longitude),
  });
  
  // Fetch static map image
  const mapQuery = useQuery({
    queryKey: ['/api/aci/map', propertyQuery.data?.latitude, propertyQuery.data?.longitude],
    queryFn: async () => {
      if (!propertyQuery.data?.latitude || !propertyQuery.data?.longitude) return null;
      const response = await apiRequest(
        `/api/aci/map?lat=${propertyQuery.data.latitude}&lng=${propertyQuery.data.longitude}&zoom=15&width=800&height=600`, 
        { method: 'GET' }
      );
      return response.image_url as string;
    },
    enabled: !!(propertyQuery.data?.latitude && propertyQuery.data?.longitude),
  });
  
  const isLoading = propertyQuery.isLoading || 
                   (neighborhoodQuery.isLoading && neighborhoodQuery.isEnabled) || 
                   (climateQuery.isLoading && climateQuery.isEnabled) ||
                   (mapQuery.isLoading && mapQuery.isEnabled);
  
  const hasError = propertyQuery.isError || 
                  (neighborhoodQuery.isError && neighborhoodQuery.isEnabled) || 
                  (climateQuery.isError && climateQuery.isEnabled) ||
                  (mapQuery.isError && mapQuery.isEnabled);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      setAddress(searchAddress.trim());
      setActiveTab('property');
    } else {
      toast({
        title: 'Please enter an address',
        description: 'Enter a property address to search for real estate data.',
        variant: 'destructive',
      });
    }
  };

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format number with commas
  const formatNumber = (value: number | null | undefined) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Property Data Explorer</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search for Property</CardTitle>
          <CardDescription>
            Enter a property address to retrieve detailed information from authoritative sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="address" className="sr-only">Property Address</Label>
              <Input
                id="address"
                placeholder="Enter property address (e.g., 123 Main St, City, State, ZIP)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> 
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {!address && !propertyQuery.data && (
        <Card className="mb-8 border-dashed">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mb-4 opacity-20" />
            <p className="mb-2">Enter a property address above to view detailed property information</p>
            <p className="text-sm">Get property details, neighborhood statistics, climate data, and more</p>
          </CardContent>
        </Card>
      )}
      
      {hasError && (
        <Card className="mb-8 border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2" /> 
              Error Retrieving Property Data
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>There was a problem retrieving data for this address. This could be due to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>The address could not be found in our data sources</li>
              <li>External data services are currently unavailable</li>
              <li>The address format may be incorrect</li>
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Please verify the address and try again, or contact support if the problem persists.
            </p>
          </CardFooter>
        </Card>
      )}
      
      {address && propertyQuery.data && (
        <>
          <div className="mb-2 text-sm text-muted-foreground">
            Showing results for: <span className="font-medium">{address}</span>
          </div>
          
          <Tabs defaultValue="property" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="property">Property Details</TabsTrigger>
              <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
              <TabsTrigger value="climate">Climate & Risk</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="property">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{propertyQuery.data.address}</CardTitle>
                      <CardDescription className="mt-1">
                        {propertyQuery.data.city}, {propertyQuery.data.state} {propertyQuery.data.zip}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {propertyQuery.data.propertyType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Property Characteristics</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Year Built</div>
                          <div className="text-sm font-medium">{propertyQuery.data.yearBuilt || 'N/A'}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Building Area</div>
                          <div className="text-sm font-medium">
                            {propertyQuery.data.squareFeet ? `${formatNumber(propertyQuery.data.squareFeet)} sq ft` : 'N/A'}
                          </div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Lot Size</div>
                          <div className="text-sm font-medium">
                            {propertyQuery.data.lotSize ? `${formatNumber(propertyQuery.data.lotSize)} sq ft` : 'N/A'}
                          </div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Bedrooms</div>
                          <div className="text-sm font-medium">{propertyQuery.data.bedrooms || 'N/A'}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Bathrooms</div>
                          <div className="text-sm font-medium">{propertyQuery.data.bathrooms || 'N/A'}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Zoning</div>
                          <div className="text-sm font-medium">{propertyQuery.data.zoning || 'N/A'}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Parcel ID</div>
                          <div className="text-sm font-medium font-mono">{propertyQuery.data.parcelId || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Valuation & Tax Information</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Estimated Value</div>
                          <div className="text-sm font-medium">{formatCurrency(propertyQuery.data.estimatedValue)}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Assessed Value</div>
                          <div className="text-sm font-medium">{formatCurrency(propertyQuery.data.assessedValue)}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Last Sale Price</div>
                          <div className="text-sm font-medium">{formatCurrency(propertyQuery.data.lastSalePrice)}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Last Sale Date</div>
                          <div className="text-sm font-medium">{formatDate(propertyQuery.data.lastSaleDate)}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Annual Tax Amount</div>
                          <div className="text-sm font-medium">{formatCurrency(propertyQuery.data.taxAmount)}</div>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">County</div>
                          <div className="text-sm font-medium">{propertyQuery.data.county}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {propertyQuery.data.additionalDetails && Object.keys(propertyQuery.data.additionalDetails).length > 0 && (
                    <div className="mt-8">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="additional-details">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Additional Property Details
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              {Object.entries(propertyQuery.data.additionalDetails).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-2 gap-2">
                                  <div className="text-sm text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                  </div>
                                  <div className="text-sm font-medium">
                                    {value !== null && value !== undefined ? String(value) : 'N/A'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="neighborhood">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {neighborhoodQuery.data?.name || 'Neighborhood Information'}
                  </CardTitle>
                  <CardDescription>
                    Demographics, market trends, and local information
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {neighborhoodQuery.isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Loading neighborhood data...</span>
                    </div>
                  ) : neighborhoodQuery.isError ? (
                    <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-start mb-4">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">Error loading neighborhood data</p>
                        <p className="text-sm mt-1">Neighborhood information is currently unavailable.</p>
                      </div>
                    </div>
                  ) : !neighborhoodQuery.data ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No neighborhood data available for this location</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Home Values</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Median Home Value</div>
                            <div className="text-sm font-medium">
                              {formatCurrency(neighborhoodQuery.data.medianHomeValue)}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Average Home Value</div>
                            <div className="text-sm font-medium">
                              {formatCurrency(neighborhoodQuery.data.averageHomeValue)}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Average Year Built</div>
                            <div className="text-sm font-medium">
                              {neighborhoodQuery.data.averageYearBuilt || 'N/A'}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Total Properties</div>
                            <div className="text-sm font-medium">
                              {formatNumber(neighborhoodQuery.data.totalProperties)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Quality of Life</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">School Rating</div>
                            <div className="text-sm font-medium">
                              {neighborhoodQuery.data.schoolRating ? 
                                `${neighborhoodQuery.data.schoolRating}/10` : 'N/A'}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Crime Index</div>
                            <div className="text-sm font-medium">
                              {neighborhoodQuery.data.crimeIndex !== null ? 
                                `${neighborhoodQuery.data.crimeIndex} (${
                                  neighborhoodQuery.data.crimeIndex < 20 ? 'Very Low' :
                                  neighborhoodQuery.data.crimeIndex < 40 ? 'Low' :
                                  neighborhoodQuery.data.crimeIndex < 60 ? 'Moderate' :
                                  neighborhoodQuery.data.crimeIndex < 80 ? 'High' : 'Very High'
                                })` : 'N/A'}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Walk Score</div>
                            <div className="text-sm font-medium">
                              {neighborhoodQuery.data.walkScore ? 
                                `${neighborhoodQuery.data.walkScore}/100` : 'N/A'}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Transit Score</div>
                            <div className="text-sm font-medium">
                              {neighborhoodQuery.data.transitScore ? 
                                `${neighborhoodQuery.data.transitScore}/100` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Demographics & Trends</h3>
                        {(neighborhoodQuery.data.demographics && Object.keys(neighborhoodQuery.data.demographics).length > 0) ||
                         (neighborhoodQuery.data.trends && Object.keys(neighborhoodQuery.data.trends).length > 0) ? (
                          <Accordion type="single" collapsible className="w-full">
                            {neighborhoodQuery.data.demographics && Object.keys(neighborhoodQuery.data.demographics).length > 0 && (
                              <AccordionItem value="demographics">
                                <AccordionTrigger>Demographics</AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2">
                                    {Object.entries(neighborhoodQuery.data.demographics).map(([key, value]) => (
                                      <div key={key} className="grid grid-cols-2 gap-2">
                                        <div className="text-sm text-muted-foreground capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </div>
                                        <div className="text-sm font-medium">
                                          {value !== null && value !== undefined ? String(value) : 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                            
                            {neighborhoodQuery.data.trends && Object.keys(neighborhoodQuery.data.trends).length > 0 && (
                              <AccordionItem value="trends">
                                <AccordionTrigger>Market Trends</AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2">
                                    {Object.entries(neighborhoodQuery.data.trends).map(([key, value]) => (
                                      <div key={key} className="grid grid-cols-2 gap-2">
                                        <div className="text-sm text-muted-foreground capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </div>
                                        <div className="text-sm font-medium">
                                          {value !== null && value !== undefined ? String(value) : 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Detailed demographic and trend data not available for this area.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="climate">
              <Card>
                <CardHeader>
                  <CardTitle>Climate & Natural Hazard Data</CardTitle>
                  <CardDescription>
                    Weather patterns and natural disaster risk assessment
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {climateQuery.isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Loading climate data...</span>
                    </div>
                  ) : climateQuery.isError ? (
                    <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-start mb-4">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">Error loading climate data</p>
                        <p className="text-sm mt-1">Climate information is currently unavailable.</p>
                      </div>
                    </div>
                  ) : !climateQuery.data ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No climate data available for this location</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Climate Information</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Average Temperature</div>
                            <div className="text-sm font-medium">
                              {`${climateQuery.data.averageTemperature}°F`}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Average High</div>
                            <div className="text-sm font-medium">
                              {`${climateQuery.data.averageHighTemperature}°F`}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Average Low</div>
                            <div className="text-sm font-medium">
                              {`${climateQuery.data.averageLowTemperature}°F`}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Annual Precipitation</div>
                            <div className="text-sm font-medium">
                              {`${climateQuery.data.annualPrecipitation} inches`}
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Annual Snowfall</div>
                            <div className="text-sm font-medium">
                              {climateQuery.data.annualSnowfall ? 
                                `${climateQuery.data.annualSnowfall} inches` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Natural Hazard Risk</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Flood Risk</div>
                            <div className="text-sm font-medium">
                              <Badge variant={
                                climateQuery.data.floodRisk === 'High' ? 'destructive' :
                                climateQuery.data.floodRisk === 'Moderate' ? 'warning' :
                                'default'
                              }>
                                {climateQuery.data.floodRisk}
                              </Badge>
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Fire Risk</div>
                            <div className="text-sm font-medium">
                              <Badge variant={
                                climateQuery.data.fireRisk === 'High' ? 'destructive' :
                                climateQuery.data.fireRisk === 'Moderate' ? 'warning' :
                                'default'
                              }>
                                {climateQuery.data.fireRisk}
                              </Badge>
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Drought Risk</div>
                            <div className="text-sm font-medium">
                              <Badge variant={
                                climateQuery.data.droughtRisk === 'High' ? 'destructive' :
                                climateQuery.data.droughtRisk === 'Moderate' ? 'warning' :
                                'default'
                              }>
                                {climateQuery.data.droughtRisk}
                              </Badge>
                            </div>
                          </div>
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm text-muted-foreground">Storm Risk</div>
                            <div className="text-sm font-medium">
                              <Badge variant={
                                climateQuery.data.stormRisk === 'High' ? 'destructive' :
                                climateQuery.data.stormRisk === 'Moderate' ? 'warning' :
                                'default'
                              }>
                                {climateQuery.data.stormRisk}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {climateQuery.data.naturalDisasterHistory && 
                         Object.keys(climateQuery.data.naturalDisasterHistory).length > 0 && (
                          <div className="mt-6">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="disaster-history">
                                <AccordionTrigger>
                                  <div className="flex items-center">
                                    <Info className="h-4 w-4 mr-2" />
                                    Disaster History
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2">
                                    {Object.entries(climateQuery.data.naturalDisasterHistory).map(([key, value]) => (
                                      <div key={key} className="grid grid-cols-2 gap-2">
                                        <div className="text-sm text-muted-foreground capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </div>
                                        <div className="text-sm font-medium">
                                          {value !== null && value !== undefined ? String(value) : 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="map">
              <Card>
                <CardHeader>
                  <CardTitle>Property Location Map</CardTitle>
                  <CardDescription>
                    Visual representation of the property location
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {mapQuery.isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Loading map...</span>
                    </div>
                  ) : mapQuery.isError || !mapQuery.data ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Map className="h-12 w-12 opacity-20 mb-4" />
                      <p className="text-muted-foreground mb-2">Map is currently unavailable</p>
                      <p className="text-sm text-muted-foreground">
                        We're unable to display the map for this property at this time.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-muted rounded-md overflow-hidden border mb-4">
                        <img 
                          src={mapQuery.data} 
                          alt={`Map of ${propertyQuery.data.address}`}
                          className="max-w-full h-auto"
                        />
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        Latitude: {propertyQuery.data.latitude}, Longitude: {propertyQuery.data.longitude}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PropertyDataPage;