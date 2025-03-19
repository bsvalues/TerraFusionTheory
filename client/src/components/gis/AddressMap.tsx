import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Address {
  attributes: {
    OBJECTID: number;
    Address: string;
    City: string;
    State: string;
    ZIP: string;
    [key: string]: any;
  };
  geometry: {
    x: number;
    y: number;
  };
}

// Component to update map center when coordinates change
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const AddressMap: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    queryType: 'point',
    longitude: '-97.7431',
    latitude: '30.2672',
    distance: '1000',
    minX: '-97.75',
    minY: '30.25',
    maxX: '-97.73',
    maxY: '30.27',
    limit: '10'
  });
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    parseFloat(searchParams.latitude), 
    parseFloat(searchParams.longitude)
  ]);
  
  // Track the selected address for highlighting on map
  const [selectedAddressId, setSelectedAddressId] = useState<number | string | null>(null);
  
  // Fix for missing Leaflet icon
  useEffect(() => {
    // Fix icon issues with webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
    
    // Update map center if lat/lon changes
    if (name === 'latitude' || name === 'longitude') {
      const newCenter: [number, number] = [
        name === 'latitude' ? parseFloat(value) : parseFloat(searchParams.latitude),
        name === 'longitude' ? parseFloat(value) : parseFloat(searchParams.longitude)
      ];
      if (!isNaN(newCenter[0]) && !isNaN(newCenter[1])) {
        setMapCenter(newCenter);
      }
    }
  };

  const getQueryParams = () => {
    if (searchParams.queryType === 'point') {
      return {
        point: [parseFloat(searchParams.longitude), parseFloat(searchParams.latitude)],
        distance: parseInt(searchParams.distance),
        limit: parseInt(searchParams.limit)
      };
    } else if (searchParams.queryType === 'bbox') {
      return {
        bbox: [
          parseFloat(searchParams.minX),
          parseFloat(searchParams.minY),
          parseFloat(searchParams.maxX),
          parseFloat(searchParams.maxY)
        ],
        limit: parseInt(searchParams.limit)
      };
    }
    return { limit: parseInt(searchParams.limit) };
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/connectors/gis/query', searchParams],
    queryFn: async () => {
      const params = getQueryParams();
      const response = await fetch('/api/connectors/gis/query?name=demo-gis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching addresses');
      }

      return response.json();
    },
    enabled: false, // Don't fetch on component mount
  });

  const handleSearch = () => {
    refetch();
  };

  const handleSearchError = (error: Error) => {
    toast({
      title: 'Search Error',
      description: error.message,
      variant: 'destructive'
    });
  };
  
  // Reset the selected address and refocus the map to the search center
  const resetSelection = () => {
    setSelectedAddressId(null);
  };
  
  // Focus map on selected address
  const focusOnAddress = (feature: any) => {
    if (feature.geometry && feature.geometry.x && feature.geometry.y) {
      const featureId = feature.id || feature.attributes.OBJECTID;
      setSelectedAddressId(featureId);
      setMapCenter([feature.geometry.y, feature.geometry.x]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Address Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="point" onValueChange={(value) => setSearchParams(prev => ({ ...prev, queryType: value }))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="point">Point &amp; Distance</TabsTrigger>
              <TabsTrigger value="bbox">Bounding Box</TabsTrigger>
            </TabsList>
            
            <TabsContent value="point" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    value={searchParams.longitude}
                    onChange={handleInputChange}
                    placeholder="-97.7431"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    value={searchParams.latitude}
                    onChange={handleInputChange}
                    placeholder="30.2672"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (meters)</Label>
                <Input
                  id="distance"
                  name="distance"
                  value={searchParams.distance}
                  onChange={handleInputChange}
                  placeholder="1000"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="bbox" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minX">Min X (West)</Label>
                  <Input
                    id="minX"
                    name="minX"
                    value={searchParams.minX}
                    onChange={handleInputChange}
                    placeholder="-97.75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minY">Min Y (South)</Label>
                  <Input
                    id="minY"
                    name="minY"
                    value={searchParams.minY}
                    onChange={handleInputChange}
                    placeholder="30.25"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxX">Max X (East)</Label>
                  <Input
                    id="maxX"
                    name="maxX"
                    value={searchParams.maxX}
                    onChange={handleInputChange}
                    placeholder="-97.73"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxY">Max Y (North)</Label>
                  <Input
                    id="maxY"
                    name="maxY"
                    value={searchParams.maxY}
                    onChange={handleInputChange}
                    placeholder="30.27"
                  />
                </div>
              </div>
            </TabsContent>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="limit">Result Limit</Label>
              <Input
                id="limit"
                name="limit"
                value={searchParams.limit}
                onChange={handleInputChange}
                placeholder="10"
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search Addresses'}
            </Button>
          </Tabs>

          {isError && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
              <p className="font-semibold">Error:</p>
              <p>{(error as Error).message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col">
        <Card className="w-full shadow-md mb-4">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-md overflow-hidden border">
              <MapContainer 
                center={[parseFloat(searchParams.latitude), parseFloat(searchParams.longitude)]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterUpdater center={[parseFloat(searchParams.latitude), parseFloat(searchParams.longitude)]} />
                
                {/* Display search radius circle for point queries */}
                {searchParams.queryType === 'point' && (
                  <Circle 
                    center={[parseFloat(searchParams.latitude), parseFloat(searchParams.longitude)]}
                    radius={parseInt(searchParams.distance)}
                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                  />
                )}
                
                {data && data.features && data.features.map((feature: any) => {
                  // Check if geometry contains valid coordinates
                  if (feature.geometry && feature.geometry.x && feature.geometry.y) {
                    const featureId = feature.id || feature.attributes.OBJECTID;
                    const isSelected = selectedAddressId === featureId;
                    
                    return (
                      <Marker 
                        key={featureId}
                        position={[feature.geometry.y, feature.geometry.x]}
                        icon={isSelected 
                          ? new L.Icon({
                              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                              iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                              iconSize: [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34],
                              shadowSize: [41, 41],
                              className: 'selected-marker' // We'll add a CSS class for visual indication
                            })
                          : undefined
                        }
                      >
                        <Popup>
                          <div>
                            <h3 className="font-medium">
                              {feature.properties?.Address || feature.attributes?.Address || 'Unnamed Address'}
                            </h3>
                            <p className="text-sm">
                              {feature.properties?.City || feature.attributes?.City}{', '}
                              {feature.properties?.State || feature.attributes?.State}{' '}
                              {feature.properties?.ZIP || feature.attributes?.ZIP}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {data && (
          <Card className="w-full shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Results ({data.features?.length || 0} addresses found)</CardTitle>
              {selectedAddressId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetSelection}
                  className="h-8 px-2"
                >
                  Clear Selection
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {data.features?.length > 0 ? (
                  <ul className="space-y-4">
                    {data.features.map((feature: any) => {
                      const featureId = feature.id || feature.attributes.OBJECTID;
                      const isSelected = selectedAddressId === featureId;
                      
                      return (
                        <li 
                          key={featureId} 
                          className={`p-3 ${isSelected ? 'bg-blue-50 border-blue-300 border' : 'bg-gray-50'} rounded-md hover:bg-blue-50 cursor-pointer transition-colors`}
                          onClick={() => focusOnAddress(feature)}
                        >
                          <p className="font-medium">
                            {feature.properties?.Address || feature.attributes?.Address || 'Unnamed Address'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {feature.properties?.City || feature.attributes?.City}{', '}
                            {feature.properties?.State || feature.attributes?.State}{' '}
                            {feature.properties?.ZIP || feature.attributes?.ZIP}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Coordinates: {feature.geometry?.x || 'N/A'}, {feature.geometry?.y || 'N/A'}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-6">No addresses found. Try adjusting your search parameters.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AddressMap;