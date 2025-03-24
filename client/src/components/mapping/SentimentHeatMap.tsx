/**
 * Sentiment Heat Map Component
 * 
 * This component displays a color-coded heat map of neighborhood sentiment
 * data overlaid on a geographic map, using Leaflet for mapping functionality.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Map, 
  Info, 
  Layers, 
  Maximize2, 
  RefreshCw, 
  ChevronDown, 
  Heart,
  HeartHandshake,
  Home,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import Leaflet components
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';

// Import sentiment service
import neighborhoodSentimentService, { 
  NeighborhoodSentiment,
  SentimentScore,
  SentimentLevel
} from '@/services/neighborhood-sentiment.service';

// Define component props
interface SentimentHeatMapProps {
  city?: string;
  state?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  onSelectNeighborhood?: (neighborhood: string) => void;
}

// Component implementation
const SentimentHeatMap: React.FC<SentimentHeatMapProps> = ({
  city = 'Richland',
  state = 'WA',
  width = '100%',
  height = 500,
  className,
  onSelectNeighborhood
}) => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sentimentData, setSentimentData] = useState<NeighborhoodSentiment[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedState, setSelectedState] = useState(state);
  const [selectedSentimentTopic, setSelectedSentimentTopic] = useState<string>('overall');
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.2804, -119.2752]); // Default to Richland, WA
  const [error, setError] = useState<string | null>(null);
  const [legendVisible, setLegendVisible] = useState(true);
  const { toast } = useToast();
  
  const mapRef = useRef<L.Map | null>(null);

  // Load city sentiment data
  useEffect(() => {
    loadSentimentData();
  }, [selectedCity, selectedState]);

  // Update map center based on city
  useEffect(() => {
    if (selectedCity === 'Richland') {
      setMapCenter([46.2804, -119.2752]);
    } else if (selectedCity === 'Grandview') {
      setMapCenter([46.2562, -119.9010]);
    }
  }, [selectedCity]);

  // Load sentiment data for all neighborhoods in the city
  const loadSentimentData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await neighborhoodSentimentService.getCitySentiments(selectedCity, selectedState);
      setSentimentData(data);
      
      // If no neighborhood is selected, select the first one
      if (!selectedNeighborhood && data.length > 0) {
        setSelectedNeighborhood(data[0].neighborhoodName);
        
        if (onSelectNeighborhood) {
          onSelectNeighborhood(data[0].neighborhoodName);
        }
      }
    } catch (error) {
      console.error('Error loading sentiment data:', error);
      setError('Failed to load sentiment data');
      toast({
        title: 'Error',
        description: 'Unable to load sentiment data for the map',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
    
    if (onSelectNeighborhood) {
      onSelectNeighborhood(neighborhood);
    }
    
    // Find the neighborhood data and center the map on it
    const neighborhoodData = sentimentData.find(n => n.neighborhoodName === neighborhood);
    if (neighborhoodData && neighborhoodData.geolocation) {
      mapRef.current?.setView(
        [neighborhoodData.geolocation.latitude, neighborhoodData.geolocation.longitude],
        13
      );
    }
  };

  // Get color for score visualization
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#60a5fa'; // Blue
    if (score >= 40) return '#fbbf24'; // Yellow
    if (score >= 20) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Get opacity for heat map visualization (higher score = more opaque)
  const getOpacity = (score: number): number => {
    return 0.3 + (score / 150); // Range from 0.3 to ~0.97
  };

  // Get score for a neighborhood based on selected topic
  const getScore = (neighborhood: NeighborhoodSentiment): number => {
    if (selectedSentimentTopic === 'overall') {
      return neighborhood.overallScore.score;
    } else {
      return neighborhood.topicScores[selectedSentimentTopic]?.score || 0;
    }
  };

  // Format topic name for display
  const formatTopicName = (topic: string): string => {
    if (topic === 'overall') return 'Overall Score';
    
    return topic
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render loading state
  if (isLoading && !mapLoaded) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle>Neighborhood Sentiment Map</CardTitle>
          <CardDescription>Loading sentiment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height: height }}/>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Neighborhood Sentiment Map</CardTitle>
          <CardDescription>Unable to load map data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadSentimentData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Map className="mr-2 h-5 w-5 text-primary" />
              Sentiment Heat Map
            </CardTitle>
            <CardDescription>
              Color-coded neighborhood sentiment analysis
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedNeighborhood(null);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Richland">Richland</SelectItem>
                <SelectItem value="Grandview">Grandview</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={selectedSentimentTopic}
              onValueChange={setSelectedSentimentTopic}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Score</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="schools">Schools</SelectItem>
                <SelectItem value="amenities">Amenities</SelectItem>
                <SelectItem value="affordability">Affordability</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="market_trend">Market Trend</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        {/* Leaflet Map Container */}
        <div style={{ width, height }}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            ref={mapRef}
            whenReady={() => {
              setMapLoaded(true);
            }}
          >
            {/* Base Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Sentiment Heat Map Circles */}
            {sentimentData.map((neighborhood) => {
              if (!neighborhood.geolocation) return null;
              
              const score = getScore(neighborhood);
              const color = getScoreColor(score);
              const opacity = getOpacity(score);
              
              return (
                <CircleMarker
                  key={neighborhood.neighborhoodId}
                  center={[neighborhood.geolocation.latitude, neighborhood.geolocation.longitude]}
                  radius={score / 5 + 10} // Size based on score
                  color={color}
                  fillColor={color}
                  fillOpacity={opacity}
                  weight={1}
                  eventHandlers={{
                    click: () => handleNeighborhoodSelect(neighborhood.neighborhoodName)
                  }}
                >
                  <Popup>
                    <div className="w-48 p-1">
                      <h3 className="font-bold mb-1">{neighborhood.neighborhoodName}</h3>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{formatTopicName(selectedSentimentTopic)}:</span>
                        <span className="font-medium" style={{ color }}>
                          {score}/100
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click to explore detailed sentiment data
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          
          {/* Map Legend */}
          {legendVisible && (
            <div className="absolute bottom-4 right-4 bg-card border rounded-md shadow-md p-3 max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Sentiment Legend</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setLegendVisible(false)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#10b981' }}></div>
                  <span>Excellent (80-100)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#60a5fa' }}></div>
                  <span>Good (60-79)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#fbbf24' }}></div>
                  <span>Average (40-59)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span>Below Average (20-39)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Poor (0-19)</span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Showing: {formatTopicName(selectedSentimentTopic)}</span>
              </div>
            </div>
          )}
          
          {/* Show Legend Button (if hidden) */}
          {!legendVisible && (
            <Button 
              variant="outline" 
              size="sm" 
              className="absolute bottom-4 right-4" 
              onClick={() => setLegendVisible(true)}
            >
              <Layers className="mr-1 h-4 w-4" />
              Legend
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentHeatMap;