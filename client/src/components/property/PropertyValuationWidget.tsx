/**
 * Property Valuation Widget
 * 
 * This component displays property valuations that incorporate external data factors
 * like weather, climate, and demographics to provide more accurate pricing insights.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  PropertyBaseInfo, 
  PropertyValuation, 
  ComparableProperty, 
  getPropertyValuation, 
  getComparableProperties 
} from '@/services/property-valuation.service';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  BarChart4, 
  CircleDollarSign, 
  CloudRain, 
  HomeIcon, 
  Info, 
  LineChart, 
  RefreshCw, 
  Users
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Sample property data for demo purposes
const sampleProperty: PropertyBaseInfo = {
  address: '123 Main St, Grandview, WA 98930',
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1800,
  yearBuilt: 1995,
  lotSize: 8500,
  propertyType: 'Single Family',
  basePrice: 350000
};

// Sample comparable properties
const sampleComparables: PropertyBaseInfo[] = [
  {
    address: '456 Oak Ave, Grandview, WA 98930',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1850,
    yearBuilt: 1998,
    lotSize: 9000,
    propertyType: 'Single Family',
    basePrice: 365000
  },
  {
    address: '789 Pine St, Grandview, WA 98930',
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1950,
    yearBuilt: 2000,
    lotSize: 8000,
    propertyType: 'Single Family',
    basePrice: 385000
  },
  {
    address: '234 Maple Rd, Grandview, WA 98930',
    bedrooms: 4,
    bathrooms: 2,
    squareFeet: 2000,
    yearBuilt: 1990,
    lotSize: 9500,
    propertyType: 'Single Family',
    basePrice: 375000
  }
];

// Climate data sample
const sampleClimateData = [
  { month: 1, temperatureMin: 28, temperatureMax: 45, temperatureAvg: 36.5, precipitationAvg: 0.8 },
  { month: 2, temperatureMin: 32, temperatureMax: 50, temperatureAvg: 41, precipitationAvg: 0.7 },
  { month: 3, temperatureMin: 36, temperatureMax: 58, temperatureAvg: 47, precipitationAvg: 0.6 },
  { month: 4, temperatureMin: 40, temperatureMax: 65, temperatureAvg: 52.5, precipitationAvg: 0.5 },
  { month: 5, temperatureMin: 48, temperatureMax: 74, temperatureAvg: 61, precipitationAvg: 0.4 },
  { month: 6, temperatureMin: 55, temperatureMax: 82, temperatureAvg: 68.5, precipitationAvg: 0.3 },
  { month: 7, temperatureMin: 60, temperatureMax: 90, temperatureAvg: 75, precipitationAvg: 0.1 },
  { month: 8, temperatureMin: 59, temperatureMax: 88, temperatureAvg: 73.5, precipitationAvg: 0.2 },
  { month: 9, temperatureMin: 52, temperatureMax: 80, temperatureAvg: 66, precipitationAvg: 0.3 },
  { month: 10, temperatureMin: 45, temperatureMax: 68, temperatureAvg: 56.5, precipitationAvg: 0.5 },
  { month: 11, temperatureMin: 35, temperatureMax: 55, temperatureAvg: 45, precipitationAvg: 0.8 },
  { month: 12, temperatureMin: 30, temperatureMax: 48, temperatureAvg: 39, precipitationAvg: 0.9 }
];

// Weather data sample
const sampleWeatherData = {
  temperature: 72,
  feelsLike: 75,
  humidity: 45,
  windSpeed: 8,
  weatherDescription: 'Clear sky',
  weatherCode: 800,
  precipitation: 0,
  uvIndex: 5
};

// Demographics data sample
const sampleDemographicData = {
  geographyId: '98930',
  geographyName: 'Grandview',
  geographyType: 'city',
  totalPopulation: 11200,
  medianAge: 32.5,
  medianHouseholdIncome: 52000,
  perCapitaIncome: 24500,
  povertyRate: 12.3,
  educationHighSchool: 75.6,
  educationBachelor: 18.9,
  householdUnits: 3800,
  householdSize: 2.9,
  homeownershipRate: 65.2,
  medianHomeValue: 264000,
  medianGrossRent: 950,
  commuteTimeAvg: 22.5,
  unemploymentRate: 4.8
};

interface PropertyValuationWidgetProps {
  property?: PropertyBaseInfo;
  comparables?: PropertyBaseInfo[];
  showClimateFactors?: boolean;
  showDemographicFactors?: boolean;
  showWeatherFactors?: boolean;
}

export function PropertyValuationWidget({
  property = sampleProperty,
  comparables = sampleComparables,
  showClimateFactors = true,
  showDemographicFactors = true,
  showWeatherFactors = true
}: PropertyValuationWidgetProps) {
  const [activeTab, setActiveTab] = useState('valuation');
  const [refreshKey, setRefreshKey] = useState(0);

  // Query for property valuation with external data factors
  const { 
    data: valuation, 
    isLoading: isLoadingValuation, 
    isError: isErrorValuation,
    error: valuationError
  } = useQuery({
    queryKey: ['property-valuation', property.address, refreshKey],
    queryFn: () => getPropertyValuation(
      property,
      showWeatherFactors ? sampleWeatherData : undefined,
      showClimateFactors ? sampleClimateData : undefined,
      showDemographicFactors ? sampleDemographicData : undefined
    ),
    enabled: !!property,
  });

  // Query for comparable properties with adjustments
  const {
    data: adjustedComparables,
    isLoading: isLoadingComparables,
    isError: isErrorComparables,
    error: comparablesError
  } = useQuery({
    queryKey: ['property-comparables', property.address, refreshKey],
    queryFn: () => getComparableProperties(
      property,
      comparables,
      showClimateFactors ? sampleClimateData : undefined,
      showDemographicFactors ? sampleDemographicData : undefined
    ),
    enabled: !!property && comparables.length > 0,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderScoreIndicator = (score: number, label: string, description: string) => (
    <div className="flex flex-col items-center mb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-sm font-medium">{label}</span>
              <Info size={14} className="text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Progress value={score * 100} className="w-full h-2" />
      <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
        <span>Low Impact</span>
        <span>High Impact</span>
      </div>
    </div>
  );

  const getConfidenceLevel = (confidence: number): {
    label: string;
    color: string;
    description: string;
  } => {
    if (confidence >= 90) return { 
      label: 'Very High', 
      color: 'bg-green-500',
      description: 'Prediction based on comprehensive data with multiple confirmed comparable properties'
    };
    if (confidence >= 75) return { 
      label: 'High', 
      color: 'bg-green-400',
      description: 'Strong prediction with good comparable data and supporting external factors'
    };
    if (confidence >= 60) return { 
      label: 'Moderate', 
      color: 'bg-yellow-400',
      description: 'Reasonable confidence with adequate supporting data and some comparable properties'
    };
    if (confidence >= 40) return { 
      label: 'Fair', 
      color: 'bg-orange-400',
      description: 'Limited confidence due to fewer comparable properties or conflicting factors'
    };
    return { 
      label: 'Low', 
      color: 'bg-red-500',
      description: 'Minimal confidence due to lack of comparable properties or unusual property characteristics'
    };
  };
  
  const getConfidenceBadge = (confidence: number) => {
    const confidenceLevel = getConfidenceLevel(confidence);
    return <Badge className={confidenceLevel.color}>{confidenceLevel.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isErrorValuation || isErrorComparables) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Valuation Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {isErrorValuation 
              ? `Error loading property valuation: ${valuationError instanceof Error ? valuationError.message : 'Unknown error'}`
              : `Error loading comparable properties: ${comparablesError instanceof Error ? comparablesError.message : 'Unknown error'}`
            }
          </p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Intelligent Property Valuation</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          AI-powered valuation with external data integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <HomeIcon className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{property.address}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Beds</span>
              <p>{property.bedrooms}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Baths</span>
              <p>{property.bathrooms}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Sq Ft</span>
              <p>{property.squareFeet.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Year Built</span>
              <p>{property.yearBuilt}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="valuation">Valuation Analysis</TabsTrigger>
            <TabsTrigger value="comparables">Comparable Properties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="valuation" className="py-4">
            {isLoadingValuation ? (
              <div className="py-12 flex justify-center items-center">
                <div className="text-center">
                  <RefreshCw className="animate-spin h-8 w-8 mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">Calculating property valuation...</p>
                </div>
              </div>
            ) : valuation ? (
              <div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b pb-4">
                  <div>
                    <span className="text-muted-foreground block mb-1">Base Value</span>
                    <div className="text-2xl font-semibold">{formatPrice(valuation.basePrice)}</div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <span className="text-muted-foreground block mb-1">
                      Adjusted Value 
                      <span className="ml-2 text-xs">
                        {valuation.adjustedPrice > valuation.basePrice ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            +{formatPercentage((valuation.adjustedPrice - valuation.basePrice) / valuation.basePrice)}
                          </Badge>
                        ) : valuation.adjustedPrice < valuation.basePrice ? (
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            {formatPercentage((valuation.adjustedPrice - valuation.basePrice) / valuation.basePrice)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Change</Badge>
                        )}
                      </span>
                    </span>
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(valuation.adjustedPrice)}
                    </div>
                    <div className="flex items-center justify-end mt-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center cursor-help">
                              <span className="text-xs mr-2">Confidence:</span>
                              {getConfidenceBadge(valuation.confidence)}
                              <InfoIcon className="ml-1 h-3 w-3 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="w-60 p-3">
                            <p className="font-semibold text-sm">Confidence Score: {valuation.confidence}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getConfidenceLevel(valuation.confidence).description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">External Factors Impact</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {showWeatherFactors && (
                    <div className="p-4 rounded-md border">
                      <div className="flex items-center mb-3">
                        <CloudRain className="h-5 w-5 mr-2 text-blue-500" />
                        <h4 className="font-medium">Weather & Climate Factors</h4>
                      </div>
                      
                      {renderScoreIndicator(
                        valuation.modifiers.climateScore - 0.8, 
                        "Climate Impact", 
                        "How much local climate conditions affect this property's value"
                      )}
                      
                      {renderScoreIndicator(
                        valuation.modifiers.weatherRiskFactor - 0.9, 
                        "Weather Risk", 
                        "Potential exposure to adverse weather conditions"
                      )}
                      
                      {renderScoreIndicator(
                        valuation.modifiers.seasonalityFactor - 0.95, 
                        "Seasonal Effect", 
                        "Impact of current season on property market conditions"
                      )}
                      
                      <div className="mt-4 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Current Season:</span>
                          <span>{valuation.factors.seasonalFactors.currentSeason}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Extreme Temps:</span>
                          <span>{valuation.factors.climateFactors.extremeTemperatures ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flood Risk:</span>
                          <Badge 
                            variant={valuation.factors.weatherRiskFactors.floodRisk === 'high' ? 'destructive' : 
                                    valuation.factors.weatherRiskFactors.floodRisk === 'moderate' ? 'default' : 'outline'}
                          >
                            {valuation.factors.weatherRiskFactors.floodRisk}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {showDemographicFactors && (
                    <div className="p-4 rounded-md border">
                      <div className="flex items-center mb-3">
                        <Users className="h-5 w-5 mr-2 text-indigo-500" />
                        <h4 className="font-medium">Demographic Factors</h4>
                      </div>
                      
                      {renderScoreIndicator(
                        valuation.modifiers.demographicScore - 0.85, 
                        "Demographic Impact", 
                        "How local demographic trends influence this property's value"
                      )}
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Income Level</span>
                          <div className="flex items-center">
                            <Badge variant="outline" className="capitalize">
                              {valuation.factors.demographicFactors.incomeLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Education Level</span>
                          <div className="flex items-center">
                            <Badge variant="outline" className="capitalize">
                              {valuation.factors.demographicFactors.educationLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col mt-2">
                          <span className="text-xs text-muted-foreground">Homeownership</span>
                          <div className="flex items-center">
                            <Badge variant="outline" className="capitalize">
                              {valuation.factors.demographicFactors.homeownershipRate}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col mt-2">
                          <span className="text-xs text-muted-foreground">Seasonal Demand</span>
                          <div className="flex items-center">
                            <Badge variant="outline" className="capitalize">
                              {valuation.factors.seasonalFactors.seasonalDemand}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-muted/50 p-4 rounded-md mt-6">
                  <div className="flex items-center mb-2">
                    <BarChart4 className="h-5 w-5 mr-2 text-primary" />
                    <h4 className="font-medium">Valuation Summary</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This property's value is {valuation.adjustedPrice > valuation.basePrice ? 'positively' : 'negatively'} affected by 
                    external factors, with the most significant impact coming from 
                    {valuation.modifiers.climateScore > valuation.modifiers.demographicScore ? 
                      ' climate and weather conditions' : ' local demographic trends'}.
                    The {formatPercentage(Math.abs((valuation.adjustedPrice - valuation.basePrice) / valuation.basePrice))} adjustment 
                    reflects these external influences on the property's market value.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No valuation data available. Try refreshing.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comparables" className="py-4">
            {isLoadingComparables ? (
              <div className="py-12 flex justify-center items-center">
                <div className="text-center">
                  <RefreshCw className="animate-spin h-8 w-8 mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">Loading comparable properties...</p>
                </div>
              </div>
            ) : adjustedComparables ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Comparable Properties Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These properties have been adjusted based on external factors such as climate, demographics,
                    and seasonal influences to provide more accurate comparison values.
                  </p>
                </div>
                
                <div className="space-y-6">
                  {adjustedComparables.map((comp, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3">
                        <div>
                          <h4 className="font-medium">{comp.address}</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-muted-foreground mr-4">Similarity:</span>
                            <Progress value={comp.similarityScore * 100} className="w-24 h-2" />
                            <span className="ml-2 text-xs">{Math.round(comp.similarityScore * 100)}%</span>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0 md:text-right">
                          <div className="text-sm text-muted-foreground">Original Price</div>
                          <div className="text-lg font-medium">{formatPrice(comp.basePrice)}</div>
                          <div className="text-sm text-muted-foreground mt-1">Adjusted Price</div>
                          <div className="text-lg font-semibold text-primary">{formatPrice(comp.adjustedPrice)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Beds</span>
                          <span>{comp.bedrooms ?? 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Baths</span>
                          <span>{comp.bathrooms ?? 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Sq Ft</span>
                          <span>{comp.squareFeet?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Year</span>
                          <span>{comp.yearBuilt ?? 'N/A'}</span>
                        </div>
                      </div>
                      
                      {comp.adjustmentFactors && comp.adjustmentFactors.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Adjustment Factors</h5>
                          <div className="space-y-2">
                            {comp.adjustmentFactors.map((factor, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span>{factor.reason}</span>
                                <div className="flex items-center">
                                  {factor.direction === 'up' ? (
                                    <ArrowUpCircle className="h-3 w-3 text-green-500 mr-1" />
                                  ) : (
                                    <ArrowDownCircle className="h-3 w-3 text-red-500 mr-1" />
                                  )}
                                  <span>
                                    {factor.direction === 'up' ? '+' : '-'}
                                    {formatPrice(Math.abs(factor.amount))}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No comparable properties data available. Try refreshing.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <CircleDollarSign className="h-4 w-4 mr-1" />
          <span>All valuations include external data factors from weather, climate, and demographics</span>
        </div>
        <div className="flex gap-1">
          <LineChart className="h-4 w-4" />
          <span className="hidden sm:inline">Last updated: {new Date().toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}