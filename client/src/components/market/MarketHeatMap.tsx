import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart4, 
  Calendar, 
  FileDown,
  Layers, 
  MapPin, 
  Building, 
  Settings2, 
  RefreshCw,
  TrendingUp,
  Map as MapIcon,
  Share2
} from 'lucide-react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Tooltip, 
  Rectangle, 
  useMap, 
  Marker, 
  Popup 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Needed for proper Leaflet marker icons
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet marker icon issues
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Sample data structure for market data
interface PropertyData {
  id: string;
  lat: number;
  lng: number;
  price: number;
  pricePerSqft: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  listingDate: string;
  daysOnMarket: number;
  propertyType: string;
  saleStatus: 'active' | 'pending' | 'sold' | 'off-market';
  lastSalePrice?: number;
  lastSaleDate?: string;
  priceChange?: number; // Price change amount (negative for reductions)
  priceChangePercent?: number; // Price change percentage
  priceChangeDaysAgo?: number; // When the price change happened
}

interface SalesActivity {
  month: string;
  sales: number;
  median: number;
  average: number;
  inventory: number;
  daysOnMarket: number;
}

interface ZipCodeSummary {
  zipCode: string;
  name: string;
  totalListings: number;
  averagePrice: number;
  medianPrice: number;
  averageDaysOnMarket: number;
  percentChangeYOY: number;
  salesPerMonth: number;
  bounds: [number, number, number, number]; // [south, west, north, east]
}

// Custom heat renderer that works with leaflet
function HeatMapLayer({
  data,
  radius = 20,
  heatBy = 'price',
  blur = 15,
  intensity = 0.7
}: {
  data: PropertyData[];
  radius?: number;
  heatBy?: 'price' | 'pricePerSqft' | 'daysOnMarket' | 'priceChange';
  blur?: number;
  intensity?: number;
}) {
  const map = useMap();
  
  useEffect(() => {
    // Remove existing heat layer if present
    map.eachLayer(layer => {
      if ((layer as any)._heat) {
        map.removeLayer(layer);
      }
    });
    
    if (data.length === 0) return;
    
    // @ts-ignore - Using leaflet-heat plugin through the L global
    const heat = L.heatLayer(
      data.map(point => {
        // Determine intensity based on the selected metric
        let value: number;
        
        switch (heatBy) {
          case 'pricePerSqft':
            value = point.pricePerSqft;
            break;
          case 'daysOnMarket':
            // Reverse for days on market (shorter = hotter)
            value = 60 - Math.min(point.daysOnMarket, 60);
            break;
          case 'priceChange':
            // For price changes, negative is important too
            value = point.priceChangePercent ? Math.abs(point.priceChangePercent) * 100 : 0;
            break;
          case 'price':
          default:
            // Normalize price to better range for heatmap
            value = point.price / 10000;
        }
        
        return [
          point.lat,
          point.lng,
          value * intensity
        ];
      }),
      { radius, blur }
    ).addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [map, data, heatBy, radius, blur, intensity]);
  
  return null;
}

function MapControls({ center, zoom, resetView }: { center: [number, number]; zoom: number; resetView: () => void }) {
  const map = useMap();
  
  // Set view when center or zoom changes
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Button 
        variant="secondary" 
        size="sm"
        onClick={resetView}
        className="h-8 w-8 p-0 shadow-md"
      >
        <MapIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

const MarketHeatMap: React.FC = () => {
  const [activeTab, setActiveTab] = useState('heatmap');
  const [heatMapMetric, setHeatMapMetric] = useState<'price' | 'pricePerSqft' | 'daysOnMarket' | 'priceChange'>('price');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('180');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [heatMapIntensity, setHeatMapIntensity] = useState<number>(0.7);
  const [heatMapRadius, setHeatMapRadius] = useState<number>(20);
  const [showZipBoundaries, setShowZipBoundaries] = useState<boolean>(true);
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.227638, -119.902219]); // Default to Grandview, WA
  const [mapZoom, setMapZoom] = useState(12);
  const [searchAddress, setSearchAddress] = useState('');
  
  // Fetch market data
  const { data: marketData, isLoading, refetch } = useQuery({
    queryKey: ['market-data', propertyType, timeRange, statusFilter, priceRange],
    queryFn: () => {
      // This would be an API call in a real implementation
      return generateSampleMarketData();
    }
  });
  
  // Fetch zip code summary data
  const { data: zipCodeData } = useQuery({
    queryKey: ['zipcode-data'],
    queryFn: () => {
      // This would be an API call in a real implementation
      return generateZipCodeData();
    }
  });
  
  // Fetch monthly sales activity
  const { data: salesActivity } = useQuery({
    queryKey: ['sales-activity', propertyType],
    queryFn: () => {
      // This would be an API call in a real implementation
      return generateSalesActivityData();
    }
  });
  
  // Get filtered properties based on current filters
  const getFilteredProperties = useCallback(() => {
    if (!marketData) return [];
    
    return marketData.filter(property => {
      // Filter by property type
      if (propertyType !== 'all' && property.propertyType !== propertyType) {
        return false;
      }
      
      // Filter by status
      if (statusFilter !== 'all' && property.saleStatus !== statusFilter) {
        return false;
      }
      
      // Filter by price range
      if (property.price < priceRange[0] || property.price > priceRange[1]) {
        return false;
      }
      
      // Filter by selected zip if applicable
      if (selectedZip) {
        const zipData = zipCodeData?.find(z => z.zipCode === selectedZip);
        if (zipData) {
          const [south, west, north, east] = zipData.bounds;
          if (
            property.lat < south ||
            property.lat > north ||
            property.lng < west ||
            property.lng > east
          ) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [marketData, propertyType, statusFilter, priceRange, selectedZip, zipCodeData]);
  
  const filteredProperties = marketData ? getFilteredProperties() : [];
  
  // Reset map view to default
  const resetMapView = useCallback(() => {
    setMapCenter([46.227638, -119.902219]);
    setMapZoom(12);
    setSelectedZip(null);
  }, []);
  
  // Center map on a ZIP code
  const focusOnZipCode = useCallback((zipCode: string) => {
    const zipData = zipCodeData?.find(z => z.zipCode === zipCode);
    if (zipData) {
      const [south, west, north, east] = zipData.bounds;
      setMapCenter([
        south + (north - south) / 2,
        west + (east - west) / 2
      ]);
      setMapZoom(14);
      setSelectedZip(zipCode);
    }
  }, [zipCodeData]);
  
  // Search for a property address
  const searchForAddress = useCallback(() => {
    if (!searchAddress || !marketData) return;
    
    // In real implementation, this would use a geocoding API
    // For demo, just search the property data
    const foundProperty = marketData.find(property => 
      property.address.toLowerCase().includes(searchAddress.toLowerCase())
    );
    
    if (foundProperty) {
      setMapCenter([foundProperty.lat, foundProperty.lng]);
      setMapZoom(16);
    }
  }, [searchAddress, marketData]);
  
  // Calculate market stats for the current view
  const getMarketStats = useCallback(() => {
    if (!filteredProperties.length) {
      return {
        count: 0,
        medianPrice: 0,
        averagePrice: 0,
        medianDOM: 0,
        averagePPSF: 0
      };
    }
    
    // Calculate median price
    const prices = filteredProperties.map(p => p.price).sort((a, b) => a - b);
    const midpoint = Math.floor(prices.length / 2);
    const medianPrice = prices.length % 2 === 0
      ? (prices[midpoint - 1] + prices[midpoint]) / 2
      : prices[midpoint];
    
    // Calculate average price
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate median days on market
    const doms = filteredProperties.map(p => p.daysOnMarket).sort((a, b) => a - b);
    const medianDOM = doms.length % 2 === 0
      ? (doms[midpoint - 1] + doms[midpoint]) / 2
      : doms[midpoint];
    
    // Calculate average price per square foot
    const averagePPSF = filteredProperties.reduce((sum, p) => sum + p.pricePerSqft, 0) / filteredProperties.length;
    
    return {
      count: filteredProperties.length,
      medianPrice,
      averagePrice,
      medianDOM,
      averagePPSF
    };
  }, [filteredProperties]);
  
  const stats = getMarketStats();
  
  // Get color for heat map based on the selected metric
  const getHeatMapColor = useCallback(() => {
    switch (heatMapMetric) {
      case 'price':
        return 'from-blue-500 to-red-500';
      case 'pricePerSqft':
        return 'from-green-500 to-purple-500';
      case 'daysOnMarket':
        return 'from-yellow-500 to-red-500';
      case 'priceChange':
        return 'from-blue-500 to-orange-500';
      default:
        return 'from-blue-500 to-red-500';
    }
  }, [heatMapMetric]);
  
  // Generate dummy sample data for demonstration
  function generateSampleMarketData(): PropertyData[] {
    // Generate ~100 properties around Grandview, WA
    return Array.from({ length: 100 }).map((_, i) => {
      // Randomize the position within Grandview area
      const lat = 46.227638 + (Math.random() - 0.5) * 0.05;
      const lng = -119.902219 + (Math.random() - 0.5) * 0.06;
      
      // Generate a price between $200k and $600k with some clustering
      let price: number;
      if (lat > 46.23) {
        // Northern area - higher prices
        price = 400000 + Math.floor(Math.random() * 200000);
      } else if (lng < -119.91) {
        // Western area - mid-range prices
        price = 300000 + Math.floor(Math.random() * 200000);
      } else {
        // Other areas - varied prices
        price = 200000 + Math.floor(Math.random() * 300000);
      }
      
      // Generate square footage between 1200 and 3500
      const squareFeet = 1200 + Math.floor(Math.random() * 2300);
      
      // Generate price per sqft
      const pricePerSqft = price / squareFeet;
      
      // Generate bedrooms (2-5)
      const bedrooms = 2 + Math.floor(Math.random() * 4);
      
      // Generate bathrooms (1-4.5)
      const bathrooms = 1 + Math.floor(Math.random() * 7) / 2;
      
      // Generate year built (1950-2023)
      const yearBuilt = 1950 + Math.floor(Math.random() * 73);
      
      // Generate days on market (0-90)
      const daysOnMarket = Math.floor(Math.random() * 91);
      
      // Generate listing date
      const listingDate = new Date();
      listingDate.setDate(listingDate.getDate() - daysOnMarket);
      
      // Generate property type
      const propertyTypes = ['single-family', 'condo', 'townhouse', 'multi-family'];
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      
      // Generate status
      const statuses: Array<'active' | 'pending' | 'sold' | 'off-market'> = ['active', 'pending', 'sold', 'off-market'];
      const statusWeights = [0.5, 0.2, 0.2, 0.1]; // 50% active, 20% pending, 20% sold, 10% off-market
      
      let statusIndex = 0;
      const rand = Math.random();
      let cumulativeWeight = 0;
      
      for (let i = 0; i < statusWeights.length; i++) {
        cumulativeWeight += statusWeights[i];
        if (rand <= cumulativeWeight) {
          statusIndex = i;
          break;
        }
      }
      
      const saleStatus = statuses[statusIndex];
      
      // Add price changes for some properties
      let priceChange: number | undefined;
      let priceChangePercent: number | undefined;
      let priceChangeDaysAgo: number | undefined;
      
      if (Math.random() > 0.7) {
        // 30% of properties have price changes
        // Usually price reductions
        const isReduction = Math.random() > 0.2; // 80% are reductions
        const changePercent = (isReduction ? -1 : 1) * (Math.random() * 0.1 + 0.01); // 1% to 11% change
        priceChangePercent = changePercent;
        priceChange = price * changePercent;
        priceChangeDaysAgo = Math.floor(Math.random() * Math.min(daysOnMarket, 30) + 1);
      }
      
      // Street names for Grandview
      const streets = [
        'Wine Country Rd', 'Grandridge Rd', 'Elm St', 'Main St', 
        'Hillcrest Dr', 'Valley View Dr', 'Euclid Rd', 'Highland Dr',
        'Forsell Rd', 'Stover Rd', 'Willoughby Rd', 'Bonnieview Rd'
      ];
      
      // Create address
      const houseNumber = 100 + Math.floor(Math.random() * 9900);
      const street = streets[Math.floor(Math.random() * streets.length)];
      const address = `${houseNumber} ${street}, Grandview, WA 98930`;
      
      return {
        id: `prop-${i}`,
        lat,
        lng,
        price,
        pricePerSqft,
        address,
        bedrooms,
        bathrooms,
        squareFeet,
        yearBuilt,
        listingDate: listingDate.toISOString().split('T')[0],
        daysOnMarket,
        propertyType,
        saleStatus,
        priceChange,
        priceChangePercent,
        priceChangeDaysAgo
      };
    });
  }
  
  // Generate ZIP code summary data
  function generateZipCodeData(): ZipCodeSummary[] {
    // Grandview area zip codes
    return [
      {
        zipCode: '98930',
        name: 'Grandview',
        totalListings: 65,
        averagePrice: 325000,
        medianPrice: 310000,
        averageDaysOnMarket: 32,
        percentChangeYOY: 5.2,
        salesPerMonth: 18,
        bounds: [46.2100, -119.9300, 46.2450, -119.8700]
      },
      {
        zipCode: '98944',
        name: 'Sunnyside',
        totalListings: 82,
        averagePrice: 285000,
        medianPrice: 275000,
        averageDaysOnMarket: 28,
        percentChangeYOY: 6.7,
        salesPerMonth: 24,
        bounds: [46.2800, -120.0200, 46.3200, -119.9500]
      },
      {
        zipCode: '98932',
        name: 'Granger',
        totalListings: 37,
        averagePrice: 265000,
        medianPrice: 255000,
        averageDaysOnMarket: 35,
        percentChangeYOY: 4.3,
        salesPerMonth: 9,
        bounds: [46.3200, -120.2200, 46.3600, -120.1500]
      },
      {
        zipCode: '99350',
        name: 'Prosser',
        totalListings: 54,
        averagePrice: 380000,
        medianPrice: 365000,
        averageDaysOnMarket: 27,
        percentChangeYOY: 7.8,
        salesPerMonth: 15,
        bounds: [46.1800, -119.8000, 46.2200, -119.7400]
      }
    ];
  }
  
  // Generate monthly sales activity data
  function generateSalesActivityData(): SalesActivity[] {
    const months = [
      'Mar 2024', 'Feb 2024', 'Jan 2024', 'Dec 2023', 
      'Nov 2023', 'Oct 2023', 'Sep 2023', 'Aug 2023',
      'Jul 2023', 'Jun 2023', 'May 2023', 'Apr 2023'
    ];
    
    // Generate a trend with seasonal variations
    let baseMedian = 300000;
    let baseSales = 20;
    let baseDOM = 30;
    let baseInventory = 80;
    
    return months.map((month, i) => {
      // Add a slight upward trend
      const trendFactor = 1 + (11 - i) * 0.005;
      
      // Add seasonal variation
      const monthIndex = 11 - i;
      const season = Math.floor(monthIndex / 3); // 0=spring, 1=summer, 2=fall, 3=winter
      let seasonalFactor = 1;
      
      switch (season) {
        case 0: // Spring - hot market
          seasonalFactor = 1.1;
          break;
        case 1: // Summer - very hot market
          seasonalFactor = 1.15;
          break;
        case 2: // Fall - cooling market
          seasonalFactor = 0.95;
          break;
        case 3: // Winter - slow market
          seasonalFactor = 0.9;
          break;
      }
      
      // Add a bit of randomness
      const randomFactor = 0.95 + Math.random() * 0.1;
      
      const totalFactor = trendFactor * seasonalFactor * randomFactor;
      
      // Calculate values
      const median = Math.round(baseMedian * totalFactor);
      const average = Math.round(median * (1 + Math.random() * 0.2 - 0.1)); // +/- 10% from median
      const sales = Math.round(baseSales * seasonalFactor * randomFactor);
      const inventory = Math.round(baseInventory * (1 / seasonalFactor) * (0.9 + Math.random() * 0.2));
      const daysOnMarket = Math.round(baseDOM * (1 / seasonalFactor) * (0.9 + Math.random() * 0.2));
      
      return {
        month,
        sales,
        median,
        average,
        inventory,
        daysOnMarket
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Real-time Market Heat Map</h2>
          <p className="text-muted-foreground">
            Visualize property market trends and hotspots across the region
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
          <TabsTrigger value="zip">ZIP Code Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="heatmap">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <div className="h-[600px] relative">
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Loading property data...</span>
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
                        
                        {/* Heat map layer */}
                        <HeatMapLayer
                          data={filteredProperties}
                          radius={heatMapRadius}
                          heatBy={heatMapMetric}
                          intensity={heatMapIntensity}
                        />
                        
                        {/* ZIP code boundaries */}
                        {showZipBoundaries && zipCodeData && zipCodeData.map(zipData => {
                          const [south, west, north, east] = zipData.bounds;
                          const bounds: [[number, number], [number, number]] = [
                            [south, west],
                            [north, east]
                          ];
                          
                          const isSelected = selectedZip === zipData.zipCode;
                          
                          return (
                            <Rectangle
                              key={zipData.zipCode}
                              bounds={bounds}
                              pathOptions={{
                                color: isSelected ? '#2563eb' : '#666',
                                weight: isSelected ? 3 : 1,
                                opacity: isSelected ? 0.8 : 0.4,
                                fillOpacity: 0.1
                              }}
                              eventHandlers={{
                                click: () => {
                                  focusOnZipCode(zipData.zipCode);
                                }
                              }}
                            >
                              <Tooltip direction="center" permanent>
                                <div className="text-xs font-medium">
                                  {zipData.zipCode}
                                </div>
                              </Tooltip>
                            </Rectangle>
                          );
                        })}
                        
                        {/* Property markers for zoom levels > 14 */}
                        {mapZoom > 14 && filteredProperties.map(property => (
                          <Marker
                            key={property.id}
                            position={[property.lat, property.lng]}
                          >
                            <Popup>
                              <div className="text-sm">
                                <div className="font-bold mb-1">{property.address}</div>
                                <div>
                                  ${property.price.toLocaleString()} • {property.bedrooms} bed • {property.bathrooms} bath
                                </div>
                                <div>
                                  {property.squareFeet.toLocaleString()} sqft • ${Math.round(property.pricePerSqft)}/sqft
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  {property.daysOnMarket} days on market • {property.saleStatus}
                                </div>
                                {property.priceChange && (
                                  <div className={property.priceChange < 0 ? "text-red-500" : "text-green-500"}>
                                    Price {property.priceChange < 0 ? 'reduced' : 'increased'} {Math.abs(property.priceChangePercent || 0) * 100}% 
                                    ({property.priceChangeDaysAgo} days ago)
                                  </div>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        
                        {/* Map controls */}
                        <MapControls
                          center={mapCenter}
                          zoom={mapZoom}
                          resetView={resetMapView}
                        />
                      </MapContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-4">
                <Card className="bg-background">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">
                          {stats.count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Properties
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-lg font-semibold">
                          ${Math.round(stats.medianPrice).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Median Price
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-lg font-semibold">
                          ${Math.round(stats.averagePrice).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Average Price
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-lg font-semibold">
                          ${Math.round(stats.averagePPSF)}/sqft
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Average Price/SqFt
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-lg font-semibold">
                          {Math.round(stats.medianDOM)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Median Days on Market
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Heat Map Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Heat Map Metric</Label>
                    <RadioGroup
                      value={heatMapMetric}
                      onValueChange={(value: any) => setHeatMapMetric(value)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="heat-price" />
                        <Label htmlFor="heat-price">Listing Price</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pricePerSqft" id="heat-ppsf" />
                        <Label htmlFor="heat-ppsf">Price per Square Foot</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daysOnMarket" id="heat-days" />
                        <Label htmlFor="heat-days">Market Activity</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="priceChange" id="heat-change" />
                        <Label htmlFor="heat-change">Price Changes</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="heat-radius">Heat Radius</Label>
                      <span className="text-sm">{heatMapRadius}px</span>
                    </div>
                    <Slider
                      id="heat-radius"
                      min={10}
                      max={50}
                      step={1}
                      value={[heatMapRadius]}
                      onValueChange={(vals) => setHeatMapRadius(vals[0])}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="heat-intensity">Intensity</Label>
                      <span className="text-sm">{Math.round(heatMapIntensity * 100)}%</span>
                    </div>
                    <Slider
                      id="heat-intensity"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={[heatMapIntensity]}
                      onValueChange={(vals) => setHeatMapIntensity(vals[0])}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-zip">Show ZIP Boundaries</Label>
                      <Switch
                        id="show-zip"
                        checked={showZipBoundaries}
                        onCheckedChange={setShowZipBoundaries}
                      />
                    </div>
                  </div>
                  
                  <div className={`h-3 w-full rounded-full bg-gradient-to-r ${getHeatMapColor()}`} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filter Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="property-search">Search Address</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="property-search"
                        placeholder="Enter address..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={searchForAddress}
                        className="shrink-0"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="property-type" className="mb-2 block">Property Type</Label>
                    <Select 
                      value={propertyType}
                      onValueChange={setPropertyType}
                    >
                      <SelectTrigger id="property-type">
                        <SelectValue placeholder="All Property Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Property Types</SelectItem>
                        <SelectItem value="single-family">Single Family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="multi-family">Multi-Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="listing-status" className="mb-2 block">Listing Status</Label>
                    <Select 
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger id="listing-status">
                        <SelectValue placeholder="All Listings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Listings</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="off-market">Off Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="time-range" className="mb-2 block">Time Frame</Label>
                    <Select 
                      value={timeRange}
                      onValueChange={setTimeRange}
                    >
                      <SelectTrigger id="time-range">
                        <SelectValue placeholder="Last 180 Days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                        <SelectItem value="180">Last 180 Days</SelectItem>
                        <SelectItem value="365">Last 12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Price Range</Label>
                      <span className="text-sm">
                        ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={1000000}
                      step={50000}
                      value={priceRange}
                      onValueChange={(vals: [number, number]) => setPriceRange(vals)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>$0</span>
                      <span>$500k</span>
                      <span>$1M+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="zip">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ZIP Code Market Analysis</CardTitle>
                <CardDescription>
                  Comparing market activity across ZIP codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ZIP Code</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead className="text-right">Listings</TableHead>
                        <TableHead className="text-right">Median Price</TableHead>
                        <TableHead className="text-right">Days on Market</TableHead>
                        <TableHead className="text-right">YoY Change</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zipCodeData?.map((zipData) => (
                        <TableRow key={zipData.zipCode}>
                          <TableCell className="font-medium">{zipData.zipCode}</TableCell>
                          <TableCell>{zipData.name}</TableCell>
                          <TableCell className="text-right">{zipData.totalListings}</TableCell>
                          <TableCell className="text-right">${zipData.medianPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{zipData.averageDaysOnMarket}</TableCell>
                          <TableCell className="text-right">
                            <span className={zipData.percentChangeYOY >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {zipData.percentChangeYOY > 0 ? '+' : ''}{zipData.percentChangeYOY.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              onClick={() => focusOnZipCode(zipData.zipCode)}
                              className="h-8 w-8 p-0"
                            >
                              <MapIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <Building className="h-8 w-8 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">
                          {zipCodeData?.reduce((sum, zip) => sum + zip.totalListings, 0) || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Listings
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">
                          {zipCodeData ? 
                            `${(zipCodeData.reduce((sum, zip) => sum + zip.percentChangeYOY, 0) / zipCodeData.length).toFixed(1)}%` 
                            : '0%'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg. YoY Price Change
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">
                          {zipCodeData ? 
                            Math.round(zipCodeData.reduce((sum, zip) => sum + zip.averageDaysOnMarket, 0) / zipCodeData.length)
                            : 0
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg. Days on Market
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ZIP Code Comparison</CardTitle>
                <CardDescription>
                  Compare trends between ZIP codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-md border p-4 bg-muted/20">
                    <div className="mb-4">
                      <h3 className="text-base font-medium mb-2">Market Activity Index</h3>
                      <p className="text-sm text-muted-foreground">
                        Relative market activity based on sales velocity, inventory, and price trends
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {zipCodeData?.map((zipData) => {
                        // Calculate a market activity score from 0-100
                        const activityFactors = [
                          // Lower days on market = higher score (max 33 points)
                          Math.max(0, 33 - (zipData.averageDaysOnMarket / 60 * 33)),
                          // Higher YoY change = higher score (max 33 points)
                          Math.min(33, Math.max(0, (zipData.percentChangeYOY / 10 * 33) + 16.5)),
                          // Higher sales per month relative to listings = higher score (max 34 points)
                          Math.min(34, (zipData.salesPerMonth / zipData.totalListings) * 100)
                        ];
                        
                        const activityScore = Math.round(activityFactors.reduce((sum, score) => sum + score, 0));
                        
                        let marketStatus: string;
                        let statusColor: string;
                        
                        if (activityScore >= 80) {
                          marketStatus = "Very Hot";
                          statusColor = "text-red-500";
                        } else if (activityScore >= 65) {
                          marketStatus = "Hot";
                          statusColor = "text-orange-500";
                        } else if (activityScore >= 50) {
                          marketStatus = "Warm";
                          statusColor = "text-amber-500";
                        } else if (activityScore >= 35) {
                          marketStatus = "Neutral";
                          statusColor = "text-blue-500";
                        } else {
                          marketStatus = "Cool";
                          statusColor = "text-indigo-500";
                        }
                        
                        return (
                          <div key={zipData.zipCode} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{zipData.zipCode} ({zipData.name})</span>
                              <Badge variant="outline" className={statusColor}>
                                {marketStatus}
                              </Badge>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  activityScore >= 80 ? 'bg-red-500' :
                                  activityScore >= 65 ? 'bg-orange-500' :
                                  activityScore >= 50 ? 'bg-amber-500' :
                                  activityScore >= 35 ? 'bg-blue-500' :
                                  'bg-indigo-500'
                                }`}
                                style={{ width: `${activityScore}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {zipData.salesPerMonth} sales/mo
                              </span>
                              <span>
                                {zipData.averageDaysOnMarket} days avg
                              </span>
                              <span>
                                {zipData.percentChangeYOY > 0 ? '+' : ''}{zipData.percentChangeYOY.toFixed(1)}% YoY
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-4">Price Distribution</h3>
                    
                    <div className="space-y-6">
                      {zipCodeData?.map((zipData) => {
                        // Generate a price distribution based on median price
                        const median = zipData.medianPrice;
                        
                        // Create price ranges
                        const ranges = [
                          { min: 0, max: median * 0.7 },
                          { min: median * 0.7, max: median * 0.9 },
                          { min: median * 0.9, max: median * 1.1 },
                          { min: median * 1.1, max: median * 1.3 },
                          { min: median * 1.3, max: Infinity }
                        ];
                        
                        // Generate distribution (simplified)
                        const distribution = [15, 25, 35, 15, 10];
                        
                        return (
                          <div key={zipData.zipCode} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{zipData.zipCode} ({zipData.name})</span>
                              <span className="text-sm font-medium">${zipData.medianPrice.toLocaleString()} median</span>
                            </div>
                            <div className="flex h-6 rounded-md overflow-hidden">
                              {distribution.map((percentage, i) => (
                                <div
                                  key={i}
                                  className={`
                                    ${i === 0 ? 'bg-blue-600' : 
                                      i === 1 ? 'bg-blue-500' : 
                                      i === 2 ? 'bg-blue-400' : 
                                      i === 3 ? 'bg-blue-300' : 
                                      'bg-blue-200'}
                                  `}
                                  style={{ width: `${percentage}%` }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{`< $${Math.round(median * 0.7 / 1000)}k`}</span>
                              <span>{`$${Math.round(median * 0.9 / 1000)}k-$${Math.round(median * 1.1 / 1000)}k`}</span>
                              <span>{`> $${Math.round(median * 1.3 / 1000)}k`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Trend Analysis</CardTitle>
                <CardDescription>
                  Monthly sales activity and price trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Median Price</TableHead>
                        <TableHead className="text-right">Average Price</TableHead>
                        <TableHead className="text-right">Inventory</TableHead>
                        <TableHead className="text-right">Days on Market</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesActivity?.slice(0, 6).map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className="text-right">{month.sales}</TableCell>
                          <TableCell className="text-right">${month.median.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${month.average.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{month.inventory}</TableCell>
                          <TableCell className="text-right">{month.daysOnMarket}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Market Trend Indicators</h3>
                    <Select
                      defaultValue="3"
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Last 3 Months</SelectItem>
                        <SelectItem value="6">Last 6 Months</SelectItem>
                        <SelectItem value="12">Last 12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Median Sale Price</span>
                          <Badge variant="outline" className="text-green-600">
                            +2.1%
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-end justify-between">
                          <div className="text-2xl font-bold">
                            ${salesActivity ? salesActivity[0].median.toLocaleString() : 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            vs ${salesActivity ? salesActivity[2].median.toLocaleString() : 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Homes Sold</span>
                          <Badge variant="outline" className="text-green-600">
                            +5.3%
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-end justify-between">
                          <div className="text-2xl font-bold">
                            {salesActivity ? 
                              salesActivity.slice(0, 3).reduce((sum, m) => sum + m.sales, 0)
                              : 0
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            last 3 months
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Days on Market</span>
                          <Badge variant="outline" className="text-amber-600">
                            -3.8%
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-end justify-between">
                          <div className="text-2xl font-bold">
                            {salesActivity ? Math.round(
                              salesActivity.slice(0, 3).reduce((sum, m) => sum + m.daysOnMarket, 0) / 3
                            ) : 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            day average
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Market Balance</span>
                          <Badge variant="outline" className="text-blue-600">
                            Seller's Market
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-end justify-between">
                          <div className="text-2xl font-bold">
                            {salesActivity ? 
                              (salesActivity[0].sales / salesActivity[0].inventory * 30).toFixed(1)
                              : 0
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            absorption rate
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Forecast</CardTitle>
                <CardDescription>
                  Price and inventory projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-md">
                  <BarChart4 className="h-48 w-full text-muted-foreground/30" />
                  <div className="text-center text-sm text-muted-foreground">
                    Market forecast visualization would appear here with real data
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-4">30-Day Market Outlook</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Median Sale Price</span>
                          <span className="font-medium">${(salesActivity?.[0].median * 1.01).toLocaleString()} <span className="text-green-600 text-xs">↑1.0%</span></span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-green-500 w-[60%]"></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low Confidence</span>
                          <span>High Confidence</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Available Inventory</span>
                          <span className="font-medium">{(salesActivity?.[0].inventory * 0.95).toFixed(0)} <span className="text-amber-600 text-xs">↓5.0%</span></span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-amber-500 w-[75%]"></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low Confidence</span>
                          <span>High Confidence</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Days on Market</span>
                          <span className="font-medium">{(salesActivity?.[0].daysOnMarket * 0.97).toFixed(0)} <span className="text-green-600 text-xs">↓3.0%</span></span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-blue-500 w-[68%]"></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low Confidence</span>
                          <span>High Confidence</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Market Patterns</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-muted/30">
                        <CardContent className="p-3">
                          <h4 className="text-sm font-medium mb-1">Seasonal Trends</h4>
                          <p className="text-xs text-muted-foreground">
                            Market is entering high season with increased activity expected over next 3 months
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/30">
                        <CardContent className="p-3">
                          <h4 className="text-sm font-medium mb-1">Price Acceleration</h4>
                          <p className="text-xs text-muted-foreground">
                            Price growth accelerating at 0.5% monthly compared to 0.3% in previous quarter
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/30">
                        <CardContent className="p-3">
                          <h4 className="text-sm font-medium mb-1">Inventory Trends</h4>
                          <p className="text-xs text-muted-foreground">
                            New listings increasing 7% month-over-month, easing supply constraints
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/30">
                        <CardContent className="p-3">
                          <h4 className="text-sm font-medium mb-1">Market Balance</h4>
                          <p className="text-xs text-muted-foreground">
                            Projected to remain a seller's market for next 90 days with 2.4 months of inventory
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketHeatMap;