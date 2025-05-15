import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home, MapPin, CloudRain, Building, Map } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PropertyData {
  address: string;
  propertyType?: string;
  landUse?: string;
  yearBuilt?: number;
  buildingArea?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: any;
}

interface NeighborhoodData {
  walkScore?: number;
  nearbyPlaces?: {
    results?: any[];
  };
  censusData?: any;
  [key: string]: any;
}

interface ClimateData {
  current?: {
    temp?: number;
    humidity?: number;
    weather?: { description: string }[];
  };
  daily?: any[];
  alerts?: any[];
  [key: string]: any;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const PropertyDataPage: React.FC = () => {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [activeTab, setActiveTab] = useState('property');

  // Property lookup query
  const {
    data: propertyData,
    isLoading: propertyLoading,
    isError: propertyError,
    refetch: refetchProperty
  } = useQuery({
    queryKey: ['/api/aci/property', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/aci/property?address=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error('Failed to fetch property data');
      const data = await response.json();
      
      // If we have coordinates in the response, set them
      if (data.latitude && data.longitude) {
        setCoordinates({ lat: data.latitude, lng: data.longitude });
      }
      
      return data;
    },
    enabled: searchInitiated && !!address,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Neighborhood data query (depends on coordinates)
  const {
    data: neighborhoodData,
    isLoading: neighborhoodLoading,
    isError: neighborhoodError
  } = useQuery({
    queryKey: ['/api/aci/neighborhood', coordinates],
    queryFn: async () => {
      if (!coordinates) return null;
      const response = await fetch(
        `/api/aci/neighborhood?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (!response.ok) throw new Error('Failed to fetch neighborhood data');
      return response.json();
    },
    enabled: !!coordinates && activeTab === 'neighborhood',
    staleTime: 10 * 60 * 1000
  });

  // Climate data query (depends on coordinates)
  const {
    data: climateData,
    isLoading: climateLoading,
    isError: climateError
  } = useQuery({
    queryKey: ['/api/aci/climate', coordinates],
    queryFn: async () => {
      if (!coordinates) return null;
      const response = await fetch(
        `/api/aci/climate?lat=${coordinates.lat}&lng=${coordinates.lng}`
      );
      if (!response.ok) throw new Error('Failed to fetch climate data');
      return response.json();
    },
    enabled: !!coordinates && activeTab === 'climate',
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  // Map image query (depends on coordinates)
  const {
    data: mapData,
    isLoading: mapLoading,
    isError: mapError
  } = useQuery({
    queryKey: ['/api/aci/map', coordinates],
    queryFn: async () => {
      if (!coordinates) return null;
      const response = await fetch(
        `/api/aci/map?lat=${coordinates.lat}&lng=${coordinates.lng}&width=600&height=400&zoom=15`
      );
      if (!response.ok) throw new Error('Failed to fetch map image');
      return response.json();
    },
    enabled: !!coordinates && activeTab === 'map',
    staleTime: 60 * 60 * 1000 // 1 hour
  });

  const handleSearch = () => {
    if (!address) {
      toast({
        variant: 'destructive',
        title: 'Address required',
        description: 'Please enter an address to search',
      });
      return;
    }

    setSearchInitiated(true);
    refetchProperty();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Render property data
  const renderPropertyData = () => {
    if (propertyLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading property data...</span>
        </div>
      );
    }

    if (propertyError) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Failed to load property data. Please try again.</p>
          <Button onClick={() => refetchProperty()} className="mt-4">Retry</Button>
        </div>
      );
    }

    if (!propertyData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Home className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Enter an address to view property details</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Property Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {propertyData.propertyType || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {propertyData.landUse || 'Land use not specified'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Year Built</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {propertyData.yearBuilt || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {propertyData.yearBuilt ? `${new Date().getFullYear() - propertyData.yearBuilt} years old` : 'Age unknown'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Building Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {propertyData.buildingArea ? `${propertyData.buildingArea.toLocaleString()} sqft` : 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {propertyData.lotSize ? `Lot: ${propertyData.lotSize.toLocaleString()} sqft` : 'Lot size unknown'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Comprehensive information about this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Address</dt>
                    <dd className="text-sm font-medium">{propertyData.address}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">County</dt>
                    <dd className="text-sm font-medium">{propertyData.county || 'Unknown'}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Parcel ID</dt>
                    <dd className="text-sm font-medium">{propertyData.parcelId || 'Unknown'}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Zoning</dt>
                    <dd className="text-sm font-medium">{propertyData.zoning || 'Unknown'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-medium mb-2">Characteristics</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Bedrooms</dt>
                    <dd className="text-sm font-medium">{propertyData.bedrooms || 'Unknown'}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Bathrooms</dt>
                    <dd className="text-sm font-medium">{propertyData.bathrooms || 'Unknown'}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Stories</dt>
                    <dd className="text-sm font-medium">{propertyData.stories || 'Unknown'}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Condition</dt>
                    <dd className="text-sm font-medium capitalize">{propertyData.condition || 'Unknown'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {propertyData.assessedValue && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Valuation Information</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Assessed Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">
                        ${propertyData.assessedValue.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Market Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">
                        ${propertyData.marketValue?.toLocaleString() || 'Unknown'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Last Sale Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">
                        ${propertyData.lastSalePrice?.toLocaleString() || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {propertyData.lastSaleDate ? new Date(propertyData.lastSaleDate).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render neighborhood data
  const renderNeighborhoodData = () => {
    if (neighborhoodLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading neighborhood data...</span>
        </div>
      );
    }

    if (neighborhoodError || !neighborhoodData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Building className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Neighborhood data unavailable for this location</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {neighborhoodData.walkScore && (
          <Card>
            <CardHeader>
              <CardTitle>Walkability Score</CardTitle>
              <CardDescription>
                Walk Score measures the walkability of this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-5xl font-bold mr-4">
                  {neighborhoodData.walkScore.score || 'N/A'}
                </div>
                <div>
                  <p className="font-medium">{neighborhoodData.walkScore.description || 'No description available'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {neighborhoodData.walkScore.summary || 'No summary available'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {neighborhoodData.nearbyPlaces?.results?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nearby Places</CardTitle>
              <CardDescription>
                Points of interest within walking distance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {neighborhoodData.nearbyPlaces.results.slice(0, 9).map((place: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium text-sm">{place.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {place.vicinity}
                        {place.types && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {place.types[0].replace('_', ' ')}
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(9, neighborhoodData.nearbyPlaces.results.length)} of {neighborhoodData.nearbyPlaces.results.length} nearby places
              </p>
            </CardFooter>
          </Card>
        )}

        {neighborhoodData.censusData && (
          <Card>
            <CardHeader>
              <CardTitle>Census Data</CardTitle>
              <CardDescription>
                Demographic information for this area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="demographics">
                  <AccordionTrigger>Demographics</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {Object.entries(neighborhoodData.censusData.demographics || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="housing">
                  <AccordionTrigger>Housing</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {Object.entries(neighborhoodData.censusData.housing || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="economy">
                  <AccordionTrigger>Economy</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {Object.entries(neighborhoodData.censusData.economy || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render climate data
  const renderClimateData = () => {
    if (climateLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading climate data...</span>
        </div>
      );
    }

    if (climateError || !climateData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CloudRain className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Climate data unavailable for this location</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {climateData.current && (
          <Card>
            <CardHeader>
              <CardTitle>Current Weather</CardTitle>
              <CardDescription>
                Current conditions at this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-5xl font-bold mr-4">
                  {climateData.current.temp ? `${Math.round(climateData.current.temp)}°F` : 'N/A'}
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {climateData.current.weather?.[0]?.description || 'Unknown conditions'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Humidity: {climateData.current.humidity || 'Unknown'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {climateData.daily && climateData.daily.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Forecast</CardTitle>
              <CardDescription>
                Weather forecast for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {climateData.daily.slice(0, 7).map((day: any, index: number) => {
                  const date = new Date();
                  date.setDate(date.getDate() + index);
                  
                  return (
                    <div key={index} className="text-center">
                      <p className="font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <div className="my-2">
                        <p className="text-2xl font-bold">{Math.round(day.temp.max)}°</p>
                        <p className="text-sm">{Math.round(day.temp.min)}°</p>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {day.weather[0].description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {climateData.alerts && climateData.alerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Weather Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {climateData.alerts.map((alert: any, index: number) => (
                  <li key={index} className="text-red-700">
                    <p className="font-medium">{alert.event}</p>
                    <p className="text-sm">
                      {new Date(alert.start * 1000).toLocaleString()} to {new Date(alert.end * 1000).toLocaleString()}
                    </p>
                    <p className="text-sm mt-1">{alert.description.slice(0, 200)}...</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render map
  const renderMap = () => {
    if (mapLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading map...</span>
        </div>
      );
    }

    if (mapError || !mapData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Map className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Map data unavailable for this location</p>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Location</CardTitle>
          <CardDescription>
            Map view of the property and surrounding area
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mapData.image_url ? (
            <div className="overflow-hidden rounded-lg border">
              <img 
                src={mapData.image_url} 
                alt="Property map" 
                className="w-full h-auto"
                style={{ maxHeight: '500px' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Map image not available</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {coordinates && `Coordinates: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
          </p>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Real Estate API Explorer</h1>
        <p className="text-muted-foreground">
          Search for properties and explore real estate data from multiple external sources
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Enter a property address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch} disabled={propertyLoading}>
          {propertyLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {searchInitiated && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="property">
              <Home className="h-4 w-4 mr-2" />
              Property
            </TabsTrigger>
            <TabsTrigger value="neighborhood">
              <Building className="h-4 w-4 mr-2" />
              Neighborhood
            </TabsTrigger>
            <TabsTrigger value="climate">
              <CloudRain className="h-4 w-4 mr-2" />
              Climate
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="mt-6">
            {renderPropertyData()}
          </TabsContent>

          <TabsContent value="neighborhood" className="mt-6">
            {renderNeighborhoodData()}
          </TabsContent>

          <TabsContent value="climate" className="mt-6">
            {renderClimateData()}
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            {renderMap()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PropertyDataPage;