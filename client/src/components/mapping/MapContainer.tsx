/**
 * MapContainer Component
 * 
 * This component provides an interactive map for visualizing real estate properties
 * and geographic market data using Leaflet.
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MapContainer as LeafletMapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle,
  GeoJSON,
  useMap,
  ZoomControl
} from 'react-leaflet';
import * as turf from '@turf/turf';
import { 
  LucideFilter, 
  LucideChevronDown, 
  LucideList, 
  LucideMapPin, 
  LucidePencil, 
  LucideGrid, 
  LucideInfo 
} from 'lucide-react';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

// Import the styles for leaflet
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for the default marker icon missing in react-leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Types
interface Property {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  yearBuilt: number;
  latitude: number;
  longitude: number;
  status: 'active' | 'pending' | 'sold';
  daysOnMarket: number;
  photos: string[];
  description: string;
}

interface GeoJSONProperties {
  id: string;
  address: string;
  price: number;
  propertyType: string;
  [key: string]: any;
}

type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Point, GeoJSONProperties>;
type GeoJSONFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, GeoJSONProperties>;

interface MarketHeatmapOptions {
  metric: 'median_price' | 'avg_days_on_market' | 'price_change' | 'sales_volume' | 'inventory';
  radius: number;
  opacity: number;
}

interface MapFilters {
  priceRange: [number, number];
  propertyTypes: string[];
  bedrooms: number[];
  bathrooms: number[];
  squareFeetRange: [number, number];
  yearBuiltRange: [number, number];
  status: string[];
  daysOnMarketMax: number;
}

// Control component to update map view
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Main component
const MapContainer = () => {
  // Default center on Grandview, WA
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.2543, -119.9025]);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapView, setMapView] = useState<'properties' | 'heatmap' | 'boundaries'>('properties');
  const mapRef = useRef<L.Map | null>(null);
  const { toast } = useToast();
  
  // Default filter values
  const [filters, setFilters] = useState<MapFilters>({
    priceRange: [0, 1000000],
    propertyTypes: ['single_family', 'condo', 'townhouse', 'land', 'multi_family'],
    bedrooms: [0, 1, 2, 3, 4, 5],
    bathrooms: [1, 2, 3, 4],
    squareFeetRange: [0, 5000],
    yearBuiltRange: [1900, 2025],
    status: ['active', 'pending', 'sold'],
    daysOnMarketMax: 180
  });
  
  // Heatmap settings
  const [heatmapOptions, setHeatmapOptions] = useState<MarketHeatmapOptions>({
    metric: 'median_price',
    radius: 25,
    opacity: 0.7
  });
  
  // Fetch properties with applied filters
  const {
    data: properties,
    isLoading: propertiesLoading,
    error: propertiesError
  } = useQuery({
    queryKey: ['/api/spatial/properties', filters],
    queryFn: async () => {
      // In a real implementation, we would fetch from API with filters
      // Sample data for demo purposes
      return Array.from({ length: 25 }, (_, i) => ({
        id: `prop-${i + 1}`,
        address: `${1000 + i} Hill Dr, Grandview, WA 98930`,
        price: 300000 + Math.floor(Math.random() * 400000),
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        squareFeet: 1000 + Math.floor(Math.random() * 2000),
        propertyType: ['single_family', 'condo', 'townhouse', 'land', 'multi_family'][Math.floor(Math.random() * 5)],
        yearBuilt: 1950 + Math.floor(Math.random() * 70),
        latitude: 46.2543 + (Math.random() * 0.03 - 0.015),
        longitude: -119.9025 + (Math.random() * 0.03 - 0.015),
        status: ['active', 'pending', 'sold'][Math.floor(Math.random() * 3)] as 'active' | 'pending' | 'sold',
        daysOnMarket: Math.floor(Math.random() * 120),
        photos: [
          'https://placehold.co/600x400/png',
          'https://placehold.co/600x400/png'
        ],
        description: 'Beautiful property in Grandview with great views and modern amenities.'
      })) as Property[];
    }
  });
  
  // Fetch GeoJSON data for properties
  const {
    data: geoJsonData,
    isLoading: geoJsonLoading
  } = useQuery({
    queryKey: ['/api/spatial/properties/geojson', filters],
    queryFn: async () => {
      // Convert properties to GeoJSON format
      if (properties) {
        return {
          type: 'FeatureCollection',
          features: properties.map(property => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [property.longitude, property.latitude]
            },
            properties: {
              id: property.id,
              address: property.address,
              price: property.price,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              squareFeet: property.squareFeet,
              propertyType: property.propertyType,
              yearBuilt: property.yearBuilt,
              status: property.status,
              daysOnMarket: property.daysOnMarket
            }
          }))
        } as GeoJSONFeatureCollection;
      }
      return { type: 'FeatureCollection', features: [] } as GeoJSONFeatureCollection;
    },
    enabled: !!properties
  });
  
  // Fetch market heatmap data
  const {
    data: heatmapData,
    isLoading: heatmapLoading
  } = useQuery({
    queryKey: ['/api/market/heatmap', heatmapOptions],
    queryFn: async () => {
      // In a real implementation, we would fetch from API
      // Generate dummy heatmap data for demo purposes
      return Array.from({ length: 100 }, (_, i) => ({
        latitude: 46.2543 + (Math.random() * 0.06 - 0.03),
        longitude: -119.9025 + (Math.random() * 0.06 - 0.03),
        value: heatmapOptions.metric === 'median_price' ? 
          300000 + Math.floor(Math.random() * 400000) :
          heatmapOptions.metric === 'avg_days_on_market' ?
          Math.floor(Math.random() * 60) :
          Math.floor(Math.random() * 100)
      }));
    },
    enabled: mapView === 'heatmap'
  });
  
  // Handle property selection
  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setMapCenter([property.latitude, property.longitude]);
    setMapZoom(16);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Get marker color based on property status
  const getMarkerColor = (status: 'active' | 'pending' | 'sold') => {
    switch (status) {
      case 'active':
        return 'green';
      case 'pending':
        return 'orange';
      case 'sold':
        return 'red';
      default:
        return 'blue';
    }
  };
  
  // Create custom icon for property markers
  const createPropertyIcon = (status: 'active' | 'pending' | 'sold') => {
    const color = getMarkerColor(status);
    return L.divIcon({
      className: `custom-marker-${status}`,
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
               <div style="color: white; font-size: 12px; font-weight: bold;">$</div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };
  
  // Apply filters handler
  const handleApplyFilters = () => {
    toast({
      title: "Filters applied",
      description: "Map has been updated with your filter settings",
    });
  };
  
  // Reset filters handler
  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 1000000],
      propertyTypes: ['single_family', 'condo', 'townhouse', 'land', 'multi_family'],
      bedrooms: [0, 1, 2, 3, 4, 5],
      bathrooms: [1, 2, 3, 4],
      squareFeetRange: [0, 5000],
      yearBuiltRange: [1900, 2025],
      status: ['active', 'pending', 'sold'],
      daysOnMarketMax: 180
    });
    
    toast({
      title: "Filters reset",
      description: "All filters have been reset to default values",
    });
  };
  
  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Map view toggle */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="w-auto shadow-md">
          <CardContent className="p-2">
            <ToggleGroup type="single" value={mapView} onValueChange={(value) => value && setMapView(value as any)}>
              <ToggleGroupItem value="properties" aria-label="Toggle properties view">
                <LucideMapPin className="h-4 w-4 mr-2" />
                Properties
              </ToggleGroupItem>
              <ToggleGroupItem value="heatmap" aria-label="Toggle heatmap view">
                <LucideGrid className="h-4 w-4 mr-2" />
                Heatmap
              </ToggleGroupItem>
              <ToggleGroupItem value="boundaries" aria-label="Toggle boundaries view">
                <LucidePencil className="h-4 w-4 mr-2" />
                Boundaries
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="absolute top-4 right-4 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="bg-white shadow-md">
              <LucideFilter className="h-4 w-4 mr-2" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[350px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Property Filters</SheetTitle>
              <SheetDescription>
                Filter properties shown on the map
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="price">
                  <AccordionTrigger>Price Range</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>{formatCurrency(filters.priceRange[0])}</span>
                        <span>{formatCurrency(filters.priceRange[1])}</span>
                      </div>
                      <Slider
                        value={filters.priceRange}
                        min={0}
                        max={1000000}
                        step={10000}
                        onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="propertyTypes">
                  <AccordionTrigger>Property Types</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {['single_family', 'condo', 'townhouse', 'land', 'multi_family'].map((type) => (
                        <div className="flex items-center space-x-2" key={type}>
                          <Checkbox
                            id={`property-type-${type}`}
                            checked={filters.propertyTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters({ ...filters, propertyTypes: [...filters.propertyTypes, type] });
                              } else {
                                setFilters({ ...filters, propertyTypes: filters.propertyTypes.filter(t => t !== type) });
                              }
                            }}
                          />
                          <Label htmlFor={`property-type-${type}`} className="capitalize">
                            {type.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="bedsBaths">
                  <AccordionTrigger>Beds & Baths</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Bedrooms</h4>
                        <div className="flex flex-wrap gap-2">
                          {[0, 1, 2, 3, 4, 5].map((bed) => (
                            <button
                              key={`bed-${bed}`}
                              className={`px-3 py-1 rounded-md text-sm ${
                                filters.bedrooms.includes(bed) 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-secondary text-secondary-foreground'
                              }`}
                              onClick={() => {
                                if (filters.bedrooms.includes(bed)) {
                                  setFilters({ ...filters, bedrooms: filters.bedrooms.filter(b => b !== bed) });
                                } else {
                                  setFilters({ ...filters, bedrooms: [...filters.bedrooms, bed] });
                                }
                              }}
                            >
                              {bed === 0 ? 'Studio' : `${bed}+`}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Bathrooms</h4>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4].map((bath) => (
                            <button
                              key={`bath-${bath}`}
                              className={`px-3 py-1 rounded-md text-sm ${
                                filters.bathrooms.includes(bath) 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-secondary text-secondary-foreground'
                              }`}
                              onClick={() => {
                                if (filters.bathrooms.includes(bath)) {
                                  setFilters({ ...filters, bathrooms: filters.bathrooms.filter(b => b !== bath) });
                                } else {
                                  setFilters({ ...filters, bathrooms: [...filters.bathrooms, bath] });
                                }
                              }}
                            >
                              {bath}+
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="squareFeet">
                  <AccordionTrigger>Square Feet</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>{filters.squareFeetRange[0]} sqft</span>
                        <span>{filters.squareFeetRange[1]} sqft</span>
                      </div>
                      <Slider
                        value={filters.squareFeetRange}
                        min={0}
                        max={5000}
                        step={100}
                        onValueChange={(value) => setFilters({ ...filters, squareFeetRange: value as [number, number] })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="yearBuilt">
                  <AccordionTrigger>Year Built</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>{filters.yearBuiltRange[0]}</span>
                        <span>{filters.yearBuiltRange[1]}</span>
                      </div>
                      <Slider
                        value={filters.yearBuiltRange}
                        min={1900}
                        max={2025}
                        step={1}
                        onValueChange={(value) => setFilters({ ...filters, yearBuiltRange: value as [number, number] })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="status">
                  <AccordionTrigger>Status</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {['active', 'pending', 'sold'].map((status) => (
                        <div className="flex items-center space-x-2" key={status}>
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters({ ...filters, status: [...filters.status, status] });
                              } else {
                                setFilters({ ...filters, status: filters.status.filter(s => s !== status) });
                              }
                            }}
                          />
                          <Label htmlFor={`status-${status}`} className="capitalize">
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="daysOnMarket">
                  <AccordionTrigger>Days on Market</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>0 days</span>
                        <span>{filters.daysOnMarketMax} days</span>
                      </div>
                      <Slider
                        value={[filters.daysOnMarketMax]}
                        min={0}
                        max={180}
                        step={1}
                        onValueChange={(value) => setFilters({ ...filters, daysOnMarketMax: value[0] })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Heatmap controls - only show when heatmap view is active */}
      {mapView === 'heatmap' && (
        <div className="absolute top-16 right-4 z-10">
          <Card className="w-[280px] shadow-md">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Heatmap Settings</CardTitle>
            </CardHeader>
            <CardContent className="py-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heatmap-metric">Metric</Label>
                <Select 
                  value={heatmapOptions.metric} 
                  onValueChange={(value) => setHeatmapOptions({ ...heatmapOptions, metric: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="median_price">Median Price</SelectItem>
                    <SelectItem value="avg_days_on_market">Avg. Days on Market</SelectItem>
                    <SelectItem value="price_change">Price Change (%)</SelectItem>
                    <SelectItem value="sales_volume">Sales Volume</SelectItem>
                    <SelectItem value="inventory">Inventory Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="radius-slider">Radius: {heatmapOptions.radius}px</Label>
                </div>
                <Slider
                  id="radius-slider"
                  value={[heatmapOptions.radius]}
                  min={10}
                  max={50}
                  step={1}
                  onValueChange={(value) => setHeatmapOptions({ ...heatmapOptions, radius: value[0] })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="opacity-slider">Opacity: {heatmapOptions.opacity.toFixed(1)}</Label>
                </div>
                <Slider
                  id="opacity-slider"
                  value={[heatmapOptions.opacity]}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => setHeatmapOptions({ ...heatmapOptions, opacity: value[0] })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Property list */}
      <div className="absolute bottom-4 left-4 z-10 w-[300px]">
        <Card className="shadow-md max-h-[40vh] overflow-auto">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex justify-between items-center">
              <span>Properties {properties ? `(${properties.length})` : ''}</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <LucideList className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-[200px] p-2">
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Sort by:</div>
                    <button className="block w-full text-left px-2 py-1 hover:bg-secondary rounded-sm">
                      Price (Low to High)
                    </button>
                    <button className="block w-full text-left px-2 py-1 hover:bg-secondary rounded-sm">
                      Price (High to Low)
                    </button>
                    <button className="block w-full text-left px-2 py-1 hover:bg-secondary rounded-sm">
                      Newest
                    </button>
                    <button className="block w-full text-left px-2 py-1 hover:bg-secondary rounded-sm">
                      Days on Market
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            {propertiesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="space-y-2">
                {properties.slice(0, 5).map((property) => (
                  <div 
                    key={property.id} 
                    className={`p-2 rounded-md cursor-pointer border ${
                      selectedProperty?.id === property.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary'
                    }`}
                    onClick={() => handleSelectProperty(property)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{property.address}</div>
                        <div className="text-xs text-muted-foreground">
                          {property.bedrooms} bd | {property.bathrooms} ba | {property.squareFeet} sqft
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{formatCurrency(property.price)}</div>
                    </div>
                  </div>
                ))}
                
                {properties.length > 5 && (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    + {properties.length - 5} more properties
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No properties found with current filters
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Property detail sheet */}
      {selectedProperty && (
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="w-[300px] shadow-md">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>Property Details</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setSelectedProperty(null)}
                >
                  ×
                </Button>
              </CardTitle>
              <CardDescription className="text-xs line-clamp-1">{selectedProperty.address}</CardDescription>
            </CardHeader>
            <CardContent className="py-0">
              <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
                  <img 
                    src={selectedProperty.photos[0]} 
                    alt={selectedProperty.address} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No photo available
                  </div>
                )}
              </div>
              
              <div className="text-xl font-semibold mb-1">{formatCurrency(selectedProperty.price)}</div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-1 bg-secondary rounded-md">
                  <div className="text-xs text-muted-foreground">Beds</div>
                  <div className="font-medium">{selectedProperty.bedrooms}</div>
                </div>
                <div className="text-center p-1 bg-secondary rounded-md">
                  <div className="text-xs text-muted-foreground">Baths</div>
                  <div className="font-medium">{selectedProperty.bathrooms}</div>
                </div>
                <div className="text-center p-1 bg-secondary rounded-md">
                  <div className="text-xs text-muted-foreground">Sq Ft</div>
                  <div className="font-medium">{selectedProperty.squareFeet}</div>
                </div>
              </div>
              
              <div className="space-y-1 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{selectedProperty.propertyType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{selectedProperty.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year Built:</span>
                  <span>{selectedProperty.yearBuilt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days on Market:</span>
                  <span>{selectedProperty.daysOnMarket}</span>
                </div>
              </div>
              
              <div className="text-xs line-clamp-3 text-muted-foreground mb-2">
                {selectedProperty.description}
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <Button className="w-full">Contact Agent</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    
      {/* Map component */}
      <LeafletMapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full z-0"
        zoomControl={false}
        whenReady={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />
        
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {/* Property markers */}
        {mapView === 'properties' && properties && properties.map((property) => (
          <Marker 
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={createPropertyIcon(property.status)}
            eventHandlers={{
              click: () => handleSelectProperty(property)
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{formatCurrency(property.price)}</div>
                <div>{property.bedrooms} bd | {property.bathrooms} ba | {property.squareFeet} sqft</div>
                <div className="text-xs mt-1">{property.address}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Heatmap circles */}
        {mapView === 'heatmap' && heatmapData && heatmapData.map((point, index) => (
          <Circle 
            key={index}
            center={[point.latitude, point.longitude]}
            radius={heatmapOptions.radius * 20}
            pathOptions={{ 
              fillColor: heatmapOptions.metric === 'median_price' ? 
                getHeatmapColor(point.value, 300000, 700000) :
                heatmapOptions.metric === 'avg_days_on_market' ?
                getHeatmapColor(point.value, 0, 60, true) :
                getHeatmapColor(point.value, 0, 100),
              fillOpacity: heatmapOptions.opacity,
              stroke: false
            }}
          />
        ))}
        
        {/* Boundaries (GeoJSON) */}
        {mapView === 'boundaries' && geoJsonData && (
          <GeoJSON 
            data={geoJsonData}
            style={() => ({
              color: '#3b82f6',
              weight: 2,
              opacity: 0.65
            })}
          />
        )}
      </LeafletMapContainer>
    </div>
  );
};

// Helper function to generate color for heatmap based on value range
function getHeatmapColor(value: number, min: number, max: number, inverse: boolean = false): string {
  // Normalize the value between 0 and 1
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const adjustedValue = inverse ? 1 - normalized : normalized;
  
  // Generate color using HSL
  // Hue goes from 120 (green) to 0 (red)
  const hue = adjustedValue * 120;
  return `hsl(${hue}, 80%, 50%)`;
}

export default MapContainer;