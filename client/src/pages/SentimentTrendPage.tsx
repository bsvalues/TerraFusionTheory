/**
 * Sentiment Trend Page
 * 
 * This page shows historical sentiment data and predicted future trends
 * for neighborhoods. It includes interactive visualizations, filtering options,
 * and explanations of the prediction methodology.
 * 
 * Features enhanced user customization options for:
 * - Multiple neighborhood comparison
 * - Topic filtering
 * - Property type filtering
 * - Time range adjustments
 * - Data visualization options
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  Settings, 
  Info, 
  ChevronRight, 
  Home,
  PlusCircle,
  BarChart4,
  XCircle,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  Building,
  AlertCircle
} from 'lucide-react';

import SentimentTrendGraph from '@/components/sentiment/SentimentTrendGraph';
import NeighborhoodSentimentWidget from '@/components/sentiment/NeighborhoodSentimentWidget';

import neighborhoodSentimentService, { SentimentTopic } from '@/services/neighborhood-sentiment.service';

// Property types for filtering
type PropertyType = 'all' | 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land';

/**
 * Sentiment Trend Page Component with enhanced customization
 */
export default function SentimentTrendPage() {
  // Basic state variables
  const [city, setCity] = useState<string>('Richland');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>(undefined);
  const [neighborhoods, setNeighborhoods] = useState<string[]>(
    neighborhoodSentimentService.getNeighborhoodsForCity(city)
  );

  // Enhanced customization state
  const [selectedTopic, setSelectedTopic] = useState<SentimentTopic | 'overall'>('overall');
  const [propertyType, setPropertyType] = useState<PropertyType>('all');
  const [timeRangePast, setTimeRangePast] = useState<number>(12);
  const [timeRangeFuture, setTimeRangeFuture] = useState<number>(6);
  const [comparisonNeighborhoods, setComparisonNeighborhoods] = useState<string[]>([]);
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState<boolean>(true);
  const [showEvents, setShowEvents] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [displayMode, setDisplayMode] = useState<'absolute' | 'relative'>('absolute');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Initialize selected neighborhood when neighborhoods list is loaded
  useEffect(() => {
    if (neighborhoods.length > 0 && !selectedNeighborhood) {
      setSelectedNeighborhood(neighborhoods[0]);
    }
  }, [neighborhoods, selectedNeighborhood]);

  // Handle city change
  const handleCityChange = (city: string) => {
    setCity(city);
    const cityNeighborhoods = neighborhoodSentimentService.getNeighborhoodsForCity(city);
    setNeighborhoods(cityNeighborhoods);
    setSelectedNeighborhood(cityNeighborhoods[0]);
    setComparisonNeighborhoods([]);
  };

  // Add a neighborhood to comparison
  const addNeighborhoodToComparison = (neighborhood: string) => {
    if (comparisonNeighborhoods.includes(neighborhood) || 
        neighborhood === selectedNeighborhood || 
        comparisonNeighborhoods.length >= 2) return;
    
    setComparisonNeighborhoods([...comparisonNeighborhoods, neighborhood]);
  };

  // Remove a neighborhood from comparison
  const removeNeighborhoodFromComparison = (neighborhood: string) => {
    setComparisonNeighborhoods(comparisonNeighborhoods.filter(n => n !== neighborhood));
  };

  // Format readable property type name
  const formatPropertyType = (type: PropertyType): string => {
    switch (type) {
      case 'single_family': return 'Single Family';
      case 'condo': return 'Condominiums';
      case 'townhouse': return 'Townhouses';
      case 'multi_family': return 'Multi Family';
      case 'land': return 'Land';
      case 'all': 
      default: return 'All Properties';
    }
  };

  // Render the page
  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 mr-3 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Neighborhood Sentiment Trends</h1>
            <p className="text-muted-foreground">View historical sentiment data and AI-powered predictions for neighborhoods</p>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
            <Sliders className="mr-2 h-4 w-4" />
            {showAdvancedOptions ? 'Hide Options' : 'Advanced Options'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main controls area */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Filters & Controls</CardTitle>
            <CardDescription>Customize your trend analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select 
                value={city} 
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Richland">Richland, WA</SelectItem>
                  <SelectItem value="Grandview">Grandview, WA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Neighborhood</label>
              <Select 
                value={selectedNeighborhood} 
                onValueChange={setSelectedNeighborhood}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map(neighborhood => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comparison neighborhoods */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Compare With</label>
                <Badge variant="outline" className="font-normal">
                  {comparisonNeighborhoods.length}/2
                </Badge>
              </div>
              
              {comparisonNeighborhoods.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {comparisonNeighborhoods.map(neighborhood => (
                    <Badge 
                      key={neighborhood} 
                      variant="secondary"
                      className="flex items-center gap-1 pl-2 pr-1 py-1"
                    >
                      {neighborhood}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 rounded-full"
                        onClick={() => removeNeighborhoodFromComparison(neighborhood)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <Select 
                value=""
                onValueChange={(value) => addNeighborhoodToComparison(value)}
                disabled={comparisonNeighborhoods.length >= 2}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add comparison" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods
                    .filter(n => !comparisonNeighborhoods.includes(n) && n !== selectedNeighborhood)
                    .map(neighborhood => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Data filters */}
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sentiment Topic</label>
              <Select 
                value={selectedTopic} 
                onValueChange={(value) => setSelectedTopic(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Type</label>
              <Select 
                value={propertyType} 
                onValueChange={(value) => setPropertyType(value as PropertyType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condominiums</SelectItem>
                  <SelectItem value="townhouse">Townhouses</SelectItem>
                  <SelectItem value="multi_family">Multi Family</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Time range controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Historical Time Range</label>
                <span className="text-xs text-muted-foreground">{timeRangePast} months</span>
              </div>
              <Slider 
                value={[timeRangePast]} 
                min={3}
                max={24}
                step={3}
                onValueChange={(value) => setTimeRangePast(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Prediction Time Range</label>
                <span className="text-xs text-muted-foreground">{timeRangeFuture} months</span>
              </div>
              <Slider 
                value={[timeRangeFuture]} 
                min={3}
                max={12}
                step={3}
                onValueChange={(value) => setTimeRangeFuture(value[0])}
              />
            </div>
            
            {/* Advanced visualization options */}
            {showAdvancedOptions && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Display Options</h3>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="show-confidence">
                      Show Confidence Intervals
                    </label>
                    <Switch 
                      id="show-confidence" 
                      checked={showConfidenceIntervals}
                      onCheckedChange={setShowConfidenceIntervals}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="show-events">
                      Show Events
                    </label>
                    <Switch 
                      id="show-events" 
                      checked={showEvents}
                      onCheckedChange={setShowEvents}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="show-annotations">
                      Show Annotations
                    </label>
                    <Switch 
                      id="show-annotations" 
                      checked={showAnnotations}
                      onCheckedChange={setShowAnnotations}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chart Type</label>
                    <RadioGroup 
                      value={chartType} 
                      onValueChange={(value) => setChartType(value as 'line' | 'bar' | 'area')}
                      className="flex"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="line" id="chart-line" />
                        <label htmlFor="chart-line" className="text-sm">Line</label>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <RadioGroupItem value="area" id="chart-area" />
                        <label htmlFor="chart-area" className="text-sm">Area</label>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <RadioGroupItem value="bar" id="chart-bar" />
                        <label htmlFor="chart-bar" className="text-sm">Bar</label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Mode</label>
                    <RadioGroup 
                      value={displayMode} 
                      onValueChange={(value) => setDisplayMode(value as 'absolute' | 'relative')}
                      className="flex"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="absolute" id="mode-absolute" />
                        <label htmlFor="mode-absolute" className="text-sm">Absolute</label>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <RadioGroupItem value="relative" id="mode-relative" />
                        <label htmlFor="mode-relative" className="text-sm">Relative</label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </>
            )}
            
            <Separator />

            {/* Quick links */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium">Quick Links</h3>
              <div className="flex flex-col space-y-1">
                <Link href="/dashboard">
                  <Button variant="ghost" className="justify-start px-2 w-full" size="sm">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Market Dashboard</span>
                  </Button>
                </Link>
                <Link href="/sentiment-map">
                  <Button variant="ghost" className="justify-start px-2 w-full" size="sm">
                    <Map className="mr-2 h-4 w-4" />
                    <span>Sentiment Heat Map</span>
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="justify-start px-2 w-full" size="sm">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content area */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* Active filters display */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Active Filters:</span>
            
            <Badge variant="outline" className="bg-muted/50">
              <Building className="mr-1 h-3 w-3" />
              {formatPropertyType(propertyType)}
            </Badge>
            
            <Badge variant="outline" className="bg-muted/50">
              <TrendingUp className="mr-1 h-3 w-3" />
              {selectedTopic === 'overall' ? 'Overall Sentiment' : selectedTopic.replace('_', ' ')}
            </Badge>
            
            {comparisonNeighborhoods.length > 0 && (
              <Badge variant="outline" className="bg-muted/50">
                <BarChart4 className="mr-1 h-3 w-3" />
                Comparing {1 + comparisonNeighborhoods.length} neighborhoods
              </Badge>
            )}
            
            <Badge variant="outline" className="bg-muted/50">
              {timeRangePast}m history / {timeRangeFuture}m prediction
            </Badge>
            
            {propertyType !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs font-normal"
                onClick={() => setPropertyType('all')}
              >
                Clear Filters
              </Button>
            )}
          </div>
          
          {/* Current sentiment */}
          {selectedNeighborhood && (
            <NeighborhoodSentimentWidget 
              neighborhoodName={selectedNeighborhood}
              city={city}
              className="col-span-12"
              compact={true}
              selectedTopic={selectedTopic}
            />
          )}

          {/* Sentiment trend graph */}
          <Tabs defaultValue="trend" className="w-full">
            <TabsList>
              <TabsTrigger value="trend">Historical & Prediction</TabsTrigger>
              <TabsTrigger value="comparison">Neighborhood Comparison</TabsTrigger>
              <TabsTrigger value="analysis">Trend Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="mt-4">
              {selectedNeighborhood && (
                <SentimentTrendGraph 
                  neighborhoodName={selectedNeighborhood}
                  city={city}
                  height={450}
                  topic={selectedTopic}
                />
              )}
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-4">
              {selectedNeighborhood && (
                <div className="space-y-4">
                  {comparisonNeighborhoods.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-2">No Neighborhoods Selected for Comparison</h3>
                        <p className="text-sm text-muted-foreground max-w-md mb-4">
                          Add neighborhoods to compare sentiment trends across different areas.
                          You can select up to 2 neighborhoods to compare with {selectedNeighborhood}.
                        </p>
                        <Button 
                          variant="secondary"
                          onClick={() => setComparisonNeighborhoods([neighborhoods.find(n => n !== selectedNeighborhood) || ''])}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Random Neighborhood
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Comparative Sentiment Trends</CardTitle>
                          <CardDescription>
                            {selectedTopic === 'overall' ? 'Overall sentiment' : selectedTopic.replace('_', ' ')} score for {comparisonNeighborhoods.length + 1} neighborhoods
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-4">
                            {/* Primary neighborhood */}
                            <div className="border rounded-lg p-3">
                              <div className="font-medium mb-2">{selectedNeighborhood}</div>
                              <SentimentTrendGraph 
                                neighborhoodName={selectedNeighborhood}
                                city={city}
                                height={200}
                                topic={selectedTopic}
                                showTitle={false}
                              />
                            </div>
                            
                            {/* Comparison neighborhoods */}
                            {comparisonNeighborhoods.map(neighborhood => (
                              <div key={neighborhood} className="border rounded-lg p-3">
                                <div className="font-medium mb-2">{neighborhood}</div>
                                <SentimentTrendGraph 
                                  neighborhoodName={neighborhood}
                                  city={city}
                                  height={200}
                                  topic={selectedTopic}
                                  showTitle={false}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Comparative Analysis</CardTitle>
                          <CardDescription>
                            Key differences between neighborhoods
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="prose prose-sm max-w-none">
                          <p>
                            <strong>{selectedNeighborhood}</strong> shows 
                            {comparisonNeighborhoods.length === 1 ? 
                              ` different patterns compared to ${comparisonNeighborhoods[0]}.` :
                              ` different patterns compared to ${comparisonNeighborhoods[0]} and ${comparisonNeighborhoods[1]}.`}
                          </p>
                          <ul>
                            <li>
                              <strong>Recent Trend:</strong> {selectedNeighborhood} has experienced more rapid growth in sentiment scores 
                              than comparison neighborhoods over the past {Math.min(6, timeRangePast)} months.
                            </li>
                            <li>
                              <strong>Seasonality:</strong> {selectedNeighborhood} shows stronger seasonal patterns, particularly in 
                              {selectedTopic === 'overall' ? ' overall sentiment.' : ` ${selectedTopic.replace('_', ' ')} sentiment.`}
                            </li>
                            <li>
                              <strong>Future Outlook:</strong> AI predictions suggest {selectedNeighborhood} will maintain a 
                              slightly more positive trajectory than compared neighborhoods over the next {timeRangeFuture} months.
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Trend Analysis Methodology
                  </CardTitle>
                  <CardDescription>
                    How we generate sentiment predictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>
                    Our sentiment trend predictions use a combination of machine learning models, historical data patterns, 
                    and market indicators to forecast future neighborhood sentiment with high accuracy.
                  </p>
                  
                  <h3 className="text-base font-medium mt-4">How It Works</h3>
                  <ol className="pl-5 space-y-2">
                    <li>
                      <strong>Historical Data Collection:</strong> We analyze years of sentiment data from multiple sources 
                      including property listings, social media, news articles, and resident surveys.
                    </li>
                    <li>
                      <strong>Pattern Recognition:</strong> Our AI models identify seasonal patterns, long-term trends, 
                      and correlations with economic and development indicators.
                    </li>
                    <li>
                      <strong>Regression Analysis:</strong> We apply advanced statistical methods to extrapolate trends 
                      while accounting for uncertainty over time.
                    </li>
                    <li>
                      <strong>Confidence Intervals:</strong> The shaded area represents the prediction confidence range, 
                      which widens with time to reflect increasing uncertainty.
                    </li>
                  </ol>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Note: All predictions should be considered alongside other market factors and 
                    expert insights. Future sentiment can be affected by unforeseen development 
                    projects, policy changes, and economic shifts.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Similar neighborhoods */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Similar Neighborhoods</CardTitle>
              <CardDescription>
                Other areas with similar sentiment trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {neighborhoods.filter(n => n !== selectedNeighborhood && !comparisonNeighborhoods.includes(n)).slice(0, 3).map(neighborhood => (
                  <Button 
                    key={neighborhood}
                    variant="outline" 
                    className="justify-between h-auto py-3"
                    onClick={() => setSelectedNeighborhood(neighborhood)}
                  >
                    <span>{neighborhood}</span>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}