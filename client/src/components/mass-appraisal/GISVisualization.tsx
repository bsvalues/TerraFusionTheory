import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { 
  FileDown, 
  Layers, 
  Home, 
  Map as MapIcon, 
  Pipette, 
  RefreshCw, 
  Filter, 
  Settings, 
  PanelLeft,
  Search,
  Ruler
} from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';

interface PropertyPoint {
  id: string;
  lat: number;
  lng: number;
  assessedValue: number;
  salePrice: number;
  salesRatio: number;
  address: string;
  squareFeet: number;
  yearBuilt: number;
  propertyType: string;
  neighborhood: string;
  saleDate: string;
}

interface NeighborhoodFeature {
  name: string;
  medianRatio: number;
  cod: number;
  prd: number;
  prb: number;
  sampleSize: number;
  geometry: any;
  properties: {
    name: string;
    [key: string]: any;
  };
}

interface HeatmapOptions {
  radius: number;
  opacity: number;
  gradient: { [key: string]: string };
  metric: 'salesRatio' | 'assessed' | 'sale' | 'cod' | 'prd';
}

interface PropertiesFilterState {
  minSalesRatio: number;
  maxSalesRatio: number;
  minSaleDate: string;
  maxSaleDate: string;
  propertyTypes: string[];
  neighborhoods: string[];
}

// Gets the color based on ratio value
function getColorForRatio(ratio: number): string {
  if (ratio < 0.85) return '#ef4444'; // Under-assessed (red)
  if (ratio > 1.15) return '#3b82f6'; // Over-assessed (blue)
  return '#10b981'; // Within target range (green)
}

// Gets the color based on COD value
function getColorForCOD(cod: number): string {
  if (cod > 15) return '#ef4444'; // High dispersion (red)
  if (cod > 10) return '#f59e0b'; // Moderate dispersion (amber)
  return '#10b981'; // Low dispersion (green)
}

// Gets the color based on PRD value
function getColorForPRD(prd: number): string {
  if (prd < 0.98 || prd > 1.03) return '#ef4444'; // Outside standards (red)
  if (prd < 0.99 || prd > 1.02) return '#f59e0b'; // Near limits (amber)
  return '#10b981'; // Within standards (green)
}

function MapControls({ 
  center, 
  zoom,
  showProperties,
  showNeighborhoods,
  setShowProperties,
  setShowNeighborhoods,
  resetMapView
}: { 
  center: [number, number]; 
  zoom: number;
  showProperties: boolean;
  showNeighborhoods: boolean;
  setShowProperties: (show: boolean) => void;
  setShowNeighborhoods: (show: boolean) => void;
  resetMapView: () => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-background shadow-md rounded-md p-2 flex flex-col gap-2">
        <Button 
          size="sm" 
          variant={showProperties ? "default" : "outline"} 
          onClick={() => setShowProperties(!showProperties)}
          title="Show/Hide Properties"
          className="h-8 w-8 p-0"
        >
          <Home className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant={showNeighborhoods ? "default" : "outline"} 
          onClick={() => setShowNeighborhoods(!showNeighborhoods)}
          title="Show/Hide Neighborhoods"
          className="h-8 w-8 p-0"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={resetMapView}
          title="Reset View"
          className="h-8 w-8 p-0"
        >
          <MapIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const GISVisualization: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ratios');
  const [showProperties, setShowProperties] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.227638, -119.902219]); // Grandview, WA
  const [mapZoom, setMapZoom] = useState(13);
  const [colorMetric, setColorMetric] = useState<'salesRatio' | 'cod' | 'prd'>('salesRatio');
  
  const [heatmapOptions, setHeatmapOptions] = useState<HeatmapOptions>({
    radius: 25,
    opacity: 0.8,
    gradient: {
      0.4: '#3b82f6', // Blue (low)
      0.5: '#10b981', // Green (target)
      0.6: '#ef4444', // Red (high)
    },
    metric: 'salesRatio',
  });
  
  const [filters, setFilters] = useState<PropertiesFilterState>({
    minSalesRatio: 0.7,
    maxSalesRatio: 1.3,
    minSaleDate: '2023-01-01',
    maxSaleDate: '2025-03-24',
    propertyTypes: ['Residential', 'Condo'],
    neighborhoods: ['All'],
  });

  // Fetch sample properties with assessment ratios
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/mass-appraisal/property-ratios'],
    queryFn: () => generateSampleProperties(), // This would normally fetch from the API
  });
  
  // Fetch neighborhood boundaries with assessment stats
  const { data: neighborhoods, isLoading: neighborhoodsLoading } = useQuery({
    queryKey: ['/api/mass-appraisal/neighborhood-boundaries'],
    queryFn: () => generateSampleNeighborhoods(), // This would normally fetch from the API
  });
  
  // Function to reset map view
  const resetMapView = () => {
    setMapCenter([46.227638, -119.902219]);
    setMapZoom(13);
  };
  
  // Function to filter properties based on current filter settings
  const getFilteredProperties = () => {
    if (!properties) return [];
    
    return properties.filter(property => {
      // Filter by sales ratio
      if (property.salesRatio < filters.minSalesRatio || property.salesRatio > filters.maxSalesRatio) {
        return false;
      }
      
      // Filter by sale date
      const saleDate = new Date(property.saleDate);
      const minDate = new Date(filters.minSaleDate);
      const maxDate = new Date(filters.maxSaleDate);
      if (saleDate < minDate || saleDate > maxDate) {
        return false;
      }
      
      // Filter by property type
      if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(property.propertyType)) {
        return false;
      }
      
      // Filter by neighborhood
      if (
        filters.neighborhoods.length > 0 && 
        !filters.neighborhoods.includes('All') && 
        !filters.neighborhoods.includes(property.neighborhood)
      ) {
        return false;
      }
      
      return true;
    });
  };
  
  // Property point styling function based on sales ratio
  const getPropertyStyle = (property: PropertyPoint) => {
    let color = getColorForRatio(property.salesRatio);
    let radius = 8;
    
    return {
      radius,
      fillColor: color,
      color: '#ffffff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
  };
  
  // Neighborhood styling function
  const getNeighborhoodStyle = (feature: any) => {
    const neighborhood = feature.properties;
    let fillColor = '#cccccc';
    
    switch (colorMetric) {
      case 'salesRatio':
        fillColor = getColorForRatio(neighborhood.medianRatio);
        break;
      case 'cod':
        fillColor = getColorForCOD(neighborhood.cod);
        break;
      case 'prd':
        fillColor = getColorForPRD(neighborhood.prd);
        break;
    }
    
    return {
      fillColor,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.5
    };
  };
  
  // Generate sample GeoJSON for neighborhoods
  function generateSampleNeighborhoods() {
    // This would normally come from your GIS API
    const neighborhoods: NeighborhoodFeature[] = [
      {
        name: 'Downtown',
        medianRatio: 0.97,
        cod: 8.5,
        prd: 1.01,
        prb: -0.02,
        sampleSize: 38,
        geometry: turf.polygon([[
          [-119.906, 46.235],
          [-119.896, 46.235],
          [-119.896, 46.230],
          [-119.906, 46.230],
          [-119.906, 46.235]
        ]]),
        properties: {
          name: 'Downtown',
          medianRatio: 0.97,
          cod: 8.5,
          prd: 1.01,
          prb: -0.02,
          sampleSize: 38
        }
      },
      {
        name: 'Eastside',
        medianRatio: 0.92,
        cod: 12.3,
        prd: 1.03,
        prb: -0.03,
        sampleSize: 45,
        geometry: turf.polygon([[
          [-119.896, 46.235],
          [-119.886, 46.235],
          [-119.886, 46.225],
          [-119.896, 46.225],
          [-119.896, 46.235]
        ]]),
        properties: {
          name: 'Eastside',
          medianRatio: 0.92,
          cod: 12.3,
          prd: 1.03,
          prb: -0.03,
          sampleSize: 45
        }
      },
      {
        name: 'Westside',
        medianRatio: 1.05,
        cod: 9.2,
        prd: 0.99,
        prb: 0.01,
        sampleSize: 42,
        geometry: turf.polygon([[
          [-119.916, 46.235],
          [-119.906, 46.235],
          [-119.906, 46.225],
          [-119.916, 46.225],
          [-119.916, 46.235]
        ]]),
        properties: {
          name: 'Westside',
          medianRatio: 1.05,
          cod: 9.2,
          prd: 0.99,
          prb: 0.01,
          sampleSize: 42
        }
      },
      {
        name: 'Northend',
        medianRatio: 1.08,
        cod: 10.5,
        prd: 0.98,
        prb: 0.02,
        sampleSize: 36,
        geometry: turf.polygon([[
          [-119.906, 46.245],
          [-119.896, 46.245],
          [-119.896, 46.235],
          [-119.906, 46.235],
          [-119.906, 46.245]
        ]]),
        properties: {
          name: 'Northend',
          medianRatio: 1.08,
          cod: 10.5,
          prd: 0.98,
          prb: 0.02,
          sampleSize: 36
        }
      },
      {
        name: 'Southside',
        medianRatio: 0.90,
        cod: 14.8,
        prd: 1.04,
        prb: -0.04,
        sampleSize: 40,
        geometry: turf.polygon([[
          [-119.906, 46.225],
          [-119.896, 46.225],
          [-119.896, 46.215],
          [-119.906, 46.215],
          [-119.906, 46.225]
        ]]),
        properties: {
          name: 'Southside',
          medianRatio: 0.90,
          cod: 14.8,
          prd: 1.04,
          prb: -0.04,
          sampleSize: 40
        }
      }
    ];
    
    // Convert to GeoJSON format
    const featureCollection = {
      type: 'FeatureCollection',
      features: neighborhoods.map(n => ({
        type: 'Feature',
        properties: n.properties,
        geometry: n.geometry.geometry
      }))
    };
    
    return featureCollection;
  }
  
  // Generate sample properties with assessment ratios
  function generateSampleProperties() {
    // This would normally come from your API
    const sampleProperties: PropertyPoint[] = Array.from({ length: 50 }).map((_, i) => {
      // Randomize the position within Grandview, WA area
      const lat = 46.227638 + (Math.random() - 0.5) * 0.03;
      const lng = -119.902219 + (Math.random() - 0.5) * 0.04;
      
      // Determine neighborhood based on coordinates
      let neighborhood = 'Other';
      if (lng < -119.906 && lat > 46.225) neighborhood = 'Westside';
      else if (lng > -119.896 && lat > 46.225) neighborhood = 'Eastside';
      else if (lat > 46.235) neighborhood = 'Northend';
      else if (lat < 46.225) neighborhood = 'Southside';
      else neighborhood = 'Downtown';
      
      // Create random sales ratio - biased by neighborhood
      let baseRatio = 0.97; // Default
      switch (neighborhood) {
        case 'Westside': baseRatio = 1.05; break;
        case 'Eastside': baseRatio = 0.92; break;
        case 'Northend': baseRatio = 1.08; break;
        case 'Southside': baseRatio = 0.90; break;
        case 'Downtown': baseRatio = 0.97; break;
      }
      
      // Add some randomness to the ratio
      const salesRatio = baseRatio + (Math.random() - 0.5) * 0.2;
      
      // Random sale price between $250k and $450k
      const salePrice = 250000 + Math.floor(Math.random() * 200000);
      
      // Assessed value based on the sales ratio
      const assessedValue = Math.round(salePrice * salesRatio);
      
      // Generate random square footage between 1000 and 3000
      const squareFeet = 1000 + Math.floor(Math.random() * 2000);
      
      // Generate random year built between 1950 and 2020
      const yearBuilt = 1950 + Math.floor(Math.random() * 70);
      
      // Generate random sale date in the last 12 months
      const today = new Date();
      const saleDate = new Date(
        today.getFullYear() - (Math.random() > 0.8 ? 1 : 0),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ).toISOString().split('T')[0];
      
      // Randomly assign a property type
      const propertyTypeOptions = ['Residential', 'Condo', 'Multi-Family', 'Vacant Land'];
      const propertyType = propertyTypeOptions[Math.floor(Math.random() * 2)]; // Mostly residential and condo
      
      return {
        id: `prop-${i + 1}`,
        lat,
        lng,
        assessedValue,
        salePrice,
        salesRatio,
        address: `${1000 + i} ${['Main', 'Elm', 'Oak', 'Vine', 'Wine Country'][Math.floor(Math.random() * 5)]} ${['St', 'Ave', 'Dr', 'Rd', 'Blvd'][Math.floor(Math.random() * 5)]}, Grandview, WA`,
        squareFeet,
        yearBuilt,
        propertyType,
        neighborhood,
        saleDate
      };
    });
    
    return sampleProperties;
  }
  
  // Handle filter changes
  const handleFilterChange = (field: keyof PropertiesFilterState, value: any) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  // Get all unique neighborhoods from properties
  const getUniqueNeighborhoods = (): string[] => {
    if (!properties) return ['All'];
    
    const neighborhoods = ['All', ...new Set(properties.map(p => p.neighborhood))];
    return neighborhoods;
  };
  
  // Get all unique property types from properties
  const getUniquePropertyTypes = (): string[] => {
    if (!properties) return [];
    
    return [...new Set(properties.map(p => p.propertyType))];
  };
  
  // Filtered properties for rendering
  const filteredProperties = properties ? getFilteredProperties() : [];
  
  // Calculate summary statistics for filtered properties
  const calculateStats = () => {
    if (!filteredProperties.length) return {
      count: 0,
      medianRatio: 0,
      meanRatio: 0,
      cod: 0,
      prd: 0,
      prb: 0
    };
    
    // Calculate mean ratio
    const ratios = filteredProperties.map(p => p.salesRatio);
    const meanRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
    
    // Calculate median ratio
    const sortedRatios = [...ratios].sort((a, b) => a - b);
    const midpoint = Math.floor(sortedRatios.length / 2);
    const medianRatio = sortedRatios.length % 2 === 0
      ? (sortedRatios[midpoint - 1] + sortedRatios[midpoint]) / 2
      : sortedRatios[midpoint];
    
    // Calculate Coefficient of Dispersion (COD)
    const absoluteDeviations = ratios.map(ratio => Math.abs(ratio - medianRatio));
    const meanAbsoluteDeviation = absoluteDeviations.reduce((sum, dev) => sum + dev, 0) / absoluteDeviations.length;
    const cod = (meanAbsoluteDeviation / medianRatio) * 100;
    
    // Calculate Price-Related Differential (PRD)
    const weightedSum = filteredProperties.reduce((sum, p) => sum + (p.salesRatio * p.salePrice), 0);
    const totalSalePrice = filteredProperties.reduce((sum, p) => sum + p.salePrice, 0);
    const weightedMean = weightedSum / totalSalePrice;
    const prd = meanRatio / weightedMean;
    
    // Calculate Price-Related Bias (PRB)
    // Simplified approximation - in reality this would use regression
    const prb = (medianRatio - meanRatio) / medianRatio;
    
    return {
      count: filteredProperties.length,
      medianRatio,
      meanRatio,
      cod,
      prd,
      prb
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">GIS Assessment Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Map
          </Button>
          <Button variant="outline" size="sm">
            <Pipette className="h-4 w-4 mr-2" />
            Measure
          </Button>
          <Button size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Map Layers
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="ratios">Assessment Ratios</TabsTrigger>
              <TabsTrigger value="neighborhood">Neighborhood Analysis</TabsTrigger>
              <TabsTrigger value="heatmap">Valuation Heatmap</TabsTrigger>
            </TabsList>

            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] relative">
                  {propertiesLoading || neighborhoodsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Loading map data...</span>
                      </div>
                    </div>
                  ) : (
                    <MapContainer 
                      center={mapCenter} 
                      zoom={mapZoom} 
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* Render neighborhood polygons */}
                      {showNeighborhoods && neighborhoods && (
                        <GeoJSON 
                          data={neighborhoods as any}
                          style={getNeighborhoodStyle}
                          onEachFeature={(feature, layer) => {
                            const neighborhood = feature.properties;
                            layer.bindTooltip(
                              `<div class="text-sm font-medium">
                                <strong>${neighborhood.name}</strong><br />
                                Median Ratio: ${neighborhood.medianRatio.toFixed(2)}<br />
                                COD: ${neighborhood.cod.toFixed(1)}<br />
                                PRD: ${neighborhood.prd.toFixed(2)}<br />
                                Sample: ${neighborhood.sampleSize} properties
                              </div>`,
                              { sticky: true }
                            );
                          }}
                        />
                      )}
                      
                      {/* Render property points */}
                      {showProperties && filteredProperties.map(property => (
                        <CircleMarker
                          key={property.id}
                          center={[property.lat, property.lng]}
                          {...getPropertyStyle(property)}
                        >
                          <Tooltip direction="top">
                            <div className="text-xs">
                              <div className="font-medium">{property.address}</div>
                              <div>Sales Ratio: {property.salesRatio.toFixed(2)}</div>
                              <div>Sale Price: ${property.salePrice.toLocaleString()}</div>
                              <div>Assessed: ${property.assessedValue.toLocaleString()}</div>
                              <div>{property.squareFeet} sq ft, Built {property.yearBuilt}</div>
                              <div>Sale Date: {property.saleDate}</div>
                            </div>
                          </Tooltip>
                        </CircleMarker>
                      ))}
                      
                      {/* Map Controls */}
                      <MapControls 
                        center={mapCenter}
                        zoom={mapZoom}
                        showProperties={showProperties}
                        showNeighborhoods={showNeighborhoods}
                        setShowProperties={setShowProperties}
                        setShowNeighborhoods={setShowNeighborhoods}
                        resetMapView={resetMapView}
                      />
                    </MapContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Properties</div>
                    <div className="text-2xl font-bold">{filteredProperties.length}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Median Ratio</div>
                    <div className="text-2xl font-bold">{stats.medianRatio.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">COD</div>
                    <div className="text-2xl font-bold">{stats.cod.toFixed(1)}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">PRD</div>
                    <div className="text-2xl font-bold">{stats.prd.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters & Legend
              </CardTitle>
              <CardDescription>
                Filter properties and customize map display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="color-metric" className="mb-2 block">Color By</Label>
                <Select value={colorMetric} onValueChange={(value: any) => setColorMetric(value)}>
                  <SelectTrigger id="color-metric">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesRatio">Assessment Ratio</SelectItem>
                    <SelectItem value="cod">COD (Dispersion)</SelectItem>
                    <SelectItem value="prd">PRD (Regressivity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="ratio-range">Sales Ratio Range</Label>
                  <span className="text-sm">
                    {filters.minSalesRatio.toFixed(2)} - {filters.maxSalesRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    id="ratio-range"
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    value={[filters.minSalesRatio, filters.maxSalesRatio]}
                    onValueChange={(value) => {
                      handleFilterChange('minSalesRatio', value[0]);
                      handleFilterChange('maxSalesRatio', value[1]);
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Under-assessed</span>
                  <span>1.0</span>
                  <span>Over-assessed</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sale-date-min" className="mb-2 block">Sale Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      id="sale-date-min"
                      type="date"
                      value={filters.minSaleDate}
                      onChange={(e) => handleFilterChange('minSaleDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      id="sale-date-max"
                      type="date"
                      value={filters.maxSaleDate}
                      onChange={(e) => handleFilterChange('maxSaleDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="neighborhood-filter" className="mb-2 block">Neighborhoods</Label>
                <Select 
                  value={filters.neighborhoods[0] || 'All'} 
                  onValueChange={(value) => {
                    handleFilterChange('neighborhoods', value === 'All' ? ['All'] : [value]);
                  }}
                >
                  <SelectTrigger id="neighborhood-filter">
                    <SelectValue placeholder="Select neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueNeighborhoods().map(neighborhood => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="property-type-filter" className="mb-2 block">Property Type</Label>
                <Select 
                  value={filters.propertyTypes[0] || ''} 
                  onValueChange={(value) => {
                    handleFilterChange('propertyTypes', value ? [value] : []);
                  }}
                >
                  <SelectTrigger id="property-type-filter">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {getUniquePropertyTypes().map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Legend</h4>
                <div className="space-y-2">
                  {colorMetric === 'salesRatio' && (
                    <>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#ef4444] mr-2"></div>
                        <span className="text-sm">Under-assessed (&lt;0.85)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#10b981] mr-2"></div>
                        <span className="text-sm">Target Range (0.85-1.15)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#3b82f6] mr-2"></div>
                        <span className="text-sm">Over-assessed (&gt;1.15)</span>
                      </div>
                    </>
                  )}
                  
                  {colorMetric === 'cod' && (
                    <>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#10b981] mr-2"></div>
                        <span className="text-sm">Low Dispersion (&lt;10)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#f59e0b] mr-2"></div>
                        <span className="text-sm">Moderate (10-15)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#ef4444] mr-2"></div>
                        <span className="text-sm">High Dispersion (&gt;15)</span>
                      </div>
                    </>
                  )}
                  
                  {colorMetric === 'prd' && (
                    <>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#10b981] mr-2"></div>
                        <span className="text-sm">Neutral (0.98-1.03)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-[#ef4444] mr-2"></div>
                        <span className="text-sm">Regressive/Progressive</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={resetMapView}
              >
                <Search className="h-4 w-4 mr-2" />
                Find Properties
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GISVisualization;