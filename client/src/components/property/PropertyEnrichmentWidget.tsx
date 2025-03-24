import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import EnrichmentService from '../../services/enrichment.service';
import { 
  Cloud, Droplets, Sun, Thermometer, Wind, 
  BarChart, Users, Home, DollarSign, School, 
  Building, HandCoins, ShoppingBag, MapPin, 
  Umbrella, Snowflake, Waves
} from 'lucide-react';

// Types for weather data
interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherDescription: string;
  weatherCode: number;
}

// Types for demographic data
interface DemographicData {
  geographyId: string;
  geographyName: string;
  totalPopulation: number;
  medianAge: number;
  medianHouseholdIncome: number;
  educationHighSchool: number;
  educationBachelor: number;
  homeownershipRate: number;
  medianHomeValue: number;
  medianGrossRent: number;
}

interface PropertyEnrichmentWidgetProps {
  address: string;
  state: string;
  county?: string;
  tract?: string;
  className?: string;
}

const PropertyEnrichmentWidget: React.FC<PropertyEnrichmentWidgetProps> = ({
  address,
  state,
  county,
  tract,
  className
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("weather");

  // Extract city and state from address for weather queries
  const cityState = address.split(',').slice(-2).join(',').trim();
  
  // Query for weather data
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useQuery({
    queryKey: ['property-weather', cityState],
    queryFn: () => EnrichmentService.getCurrentWeather(cityState),
    enabled: Boolean(cityState) && activeTab === "weather",
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Query for climate data
  const { data: climateData, isLoading: climateLoading, error: climateError } = useQuery({
    queryKey: ['property-climate', cityState],
    queryFn: () => EnrichmentService.getClimateNormals(cityState),
    enabled: Boolean(cityState) && activeTab === "climate",
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (climate data doesn't change often)
  });

  // Query for demographic data
  const { data: demographicData, isLoading: demographicLoading, error: demographicError } = useQuery({
    queryKey: ['property-demographics', state, county, tract],
    queryFn: () => EnrichmentService.getDemographicData(state, county, tract),
    enabled: Boolean(state) && activeTab === "demographics",
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days (demographic data changes infrequently)
    select: (data) => Array.isArray(data) && data.length > 0 ? data[0] : undefined
  });

  // Show error if any query fails
  useEffect(() => {
    if (weatherError && activeTab === "weather") {
      toast({
        title: "Weather data unavailable",
        description: "Unable to fetch current weather data. Please try again later.",
        variant: "destructive"
      });
    }

    if (climateError && activeTab === "climate") {
      toast({
        title: "Climate data unavailable",
        description: "Unable to fetch climate data. Please try again later.",
        variant: "destructive"
      });
    }

    if (demographicError && activeTab === "demographics") {
      toast({
        title: "Demographic data unavailable",
        description: "Unable to fetch demographic data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [weatherError, climateError, demographicError, activeTab, toast]);

  // Function to get weather icon based on weather code
  const getWeatherIcon = (weatherCode?: number) => {
    // Simple mapping based on common weather codes
    if (!weatherCode) return <Cloud size={24} />;
    
    if (weatherCode < 300) return <Cloud size={24} />; // Thunderstorm
    if (weatherCode < 500) return <Droplets size={24} />; // Drizzle
    if (weatherCode < 600) return <Droplets size={24} />; // Rain
    if (weatherCode < 700) return <Cloud size={24} />; // Snow
    if (weatherCode < 800) return <Wind size={24} />; // Atmosphere (fog, mist)
    if (weatherCode === 800) return <Sun size={24} />; // Clear
    
    return <Cloud size={24} />; // Clouds
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Property Insights
          <Badge variant="outline" className="ml-2">External Data</Badge>
        </CardTitle>
        <CardDescription>
          Weather, climate, and demographic data for {address}
        </CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="climate">Climate</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>
        
        {/* Weather Tab */}
        <TabsContent value="weather">
          <CardContent className="pt-4">
            {weatherLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              </div>
            ) : weatherData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getWeatherIcon(weatherData.weatherCode)}
                    <h3 className="ml-2 text-xl font-semibold">{weatherData.weatherDescription}</h3>
                  </div>
                  <div className="text-2xl font-bold">{Math.round(weatherData.temperature)}°F</div>
                </div>
                
                {/* Temperature range visualization */}
                <div className="mt-4 mb-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Cold</span>
                    <span>Moderate</span>
                    <span>Hot</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500" 
                      style={{ width: '100%' }}
                    ></div>
                    <div 
                      className="absolute top-0 h-4 w-2 bg-black rounded-full transform -translate-y-1" 
                      style={{ 
                        left: `${Math.min(Math.max((weatherData.temperature - 10) / 100 * 100, 0), 100)}%`,
                        transition: 'left 0.3s ease-in-out' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center p-3 rounded-lg border">
                    <Thermometer className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Feels Like</div>
                      <div className="font-semibold">{Math.round(weatherData.feelsLike)}°F</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <Wind className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Wind</div>
                      <div className="font-semibold">{Math.round(weatherData.windSpeed)} mph</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <Droplets className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Humidity</div>
                      <div className="font-semibold">{weatherData.humidity}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Humidity visualization */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Humidity</span>
                    <span className="text-sm font-medium">{weatherData.humidity}%</span>
                  </div>
                  <Progress value={weatherData.humidity} className="h-2" />
                </div>
                
                {/* Wind speed visualization */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Wind Speed</span>
                    <span className="text-sm font-medium">{Math.round(weatherData.windSpeed)} mph</span>
                  </div>
                  <Progress 
                    value={Math.min(weatherData.windSpeed / 30 * 100, 100)} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>Calm</span>
                    <span>Breezy</span>
                    <span>Strong</span>
                  </div>
                </div>
                
                {/* Weather impact on property */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Property Impact</h4>
                  <p className="text-xs text-muted-foreground">
                    Current weather conditions show {weatherData.humidity > 70 ? 'high humidity which may affect moisture-sensitive materials' : 'normal humidity levels'} and 
                    {weatherData.windSpeed > 15 ? ' strong winds that could impact outdoor features' : ' mild wind conditions'}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <Cloud className="mx-auto text-muted-foreground" size={48} />
                <p className="mt-2 text-muted-foreground">
                  Weather data unavailable for this location
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Climate Tab */}
        <TabsContent value="climate">
          <CardContent className="pt-4">
            {climateLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
              </div>
            ) : climateData && climateData.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Annual Climate Patterns</h3>
                
                {/* Temperature Visualization */}
                <div className="mt-4 pt-2 pb-4 border rounded-lg">
                  <h4 className="px-3 text-sm font-medium mb-4">Temperature Trends</h4>
                  <div className="relative h-32 px-3">
                    {climateData.map((month: any, index: number) => {
                      const chartMaxHeight = 100; // percentage
                      const minTemp = Math.min(...climateData.map((m: any) => m.temperatureMin));
                      const maxTemp = Math.max(...climateData.map((m: any) => m.temperatureMax));
                      const range = maxTemp - minTemp;
                      
                      // Calculate the heights and positions
                      const minHeight = ((month.temperatureMin - minTemp) / range) * chartMaxHeight;
                      const maxBarHeight = ((month.temperatureMax - minTemp) / range) * chartMaxHeight;
                      
                      return (
                        <div 
                          key={index} 
                          className="absolute bottom-0 flex flex-col items-center"
                          style={{ 
                            left: `${index * (100 / 11)}%`, 
                            width: `${100 / 12}%`
                          }}
                        >
                          {/* Max-min range bar */}
                          <div 
                            className="w-2 bg-gradient-to-t from-blue-500 to-red-500 rounded-full"
                            style={{ 
                              height: `${maxBarHeight - minHeight}%`,
                              bottom: `${minHeight}%`,
                              position: 'absolute'
                            }}
                          ></div>
                          
                          {/* Avg temp marker */}
                          <div 
                            className="w-4 h-1 bg-black rounded-full absolute"
                            style={{ 
                              bottom: `${((month.temperatureAvg - minTemp) / range) * chartMaxHeight}%`
                            }}
                          ></div>
                          
                          {/* Month label */}
                          <div className="absolute -bottom-6 text-[10px] text-muted-foreground">
                            {new Date(0, month.month - 1).toLocaleString('default', { month: 'short' })}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Axis labels */}
                    <div className="absolute -left-2 top-0 text-xs text-muted-foreground">
                      {Math.round(Math.max(...climateData.map((m: any) => m.temperatureMax)))}°F
                    </div>
                    <div className="absolute -left-2 bottom-0 text-xs text-muted-foreground">
                      {Math.round(Math.min(...climateData.map((m: any) => m.temperatureMin)))}°F
                    </div>
                  </div>
                </div>
                
                {/* Precipitation Visualization */}
                <div className="mt-4 pt-2 pb-2 border rounded-lg">
                  <h4 className="px-3 text-sm font-medium mb-2">Precipitation</h4>
                  <div className="relative h-24 px-3 pt-2">
                    {climateData.map((month: any, index: number) => {
                      const maxHeight = 80; // percentage
                      const maxPrecip = Math.max(...climateData.map((m: any) => m.precipitationAvg));
                      
                      // Calculate the height as a percentage of the maximum
                      const height = (month.precipitationAvg / maxPrecip) * maxHeight;
                      
                      return (
                        <div 
                          key={index} 
                          className="absolute bottom-0 flex flex-col items-center"
                          style={{ 
                            left: `${index * (100 / 11)}%`, 
                            width: `${100 / 12}%`
                          }}
                        >
                          {/* Precipitation bar */}
                          <div 
                            className="w-4 bg-blue-400 rounded-t-sm"
                            style={{ 
                              height: `${height}%`
                            }}
                          ></div>
                          
                          {/* Month label */}
                          <div className="absolute -bottom-6 text-[10px] text-muted-foreground">
                            {new Date(0, month.month - 1).toLocaleString('default', { month: 'short' })}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Max precipitation label */}
                    <div className="absolute -left-2 top-0 text-xs text-muted-foreground">
                      {Math.max(...climateData.map((m: any) => m.precipitationAvg)).toFixed(1)}"
                    </div>
                  </div>
                </div>
                
                {/* Climate table */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-2 text-left">Month</th>
                        <th className="py-2 text-right">Min</th>
                        <th className="py-2 text-right">Avg</th>
                        <th className="py-2 text-right">Max</th>
                        <th className="py-2 text-right">Precip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {climateData.map((month: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-1.5 font-medium">
                            {new Date(0, month.month - 1).toLocaleString('default', { month: 'short' })}
                          </td>
                          <td className="py-1.5 text-right">
                            {Math.round(month.temperatureMin)}°F
                          </td>
                          <td className="py-1.5 text-right">
                            {Math.round(month.temperatureAvg)}°F
                          </td>
                          <td className="py-1.5 text-right">
                            {Math.round(month.temperatureMax)}°F
                          </td>
                          <td className="py-1.5 text-right">
                            {month.precipitationAvg}" 
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Climate impact on property */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Property Impact</h4>
                  <p className="text-xs text-muted-foreground">
                    This location experiences 
                    {(() => {
                      const avgTemp = climateData.reduce((sum: number, month: any) => sum + month.temperatureAvg, 0) / 12;
                      const totalPrecip = climateData.reduce((sum: number, month: any) => sum + month.precipitationAvg, 0);
                      const tempRange = Math.max(...climateData.map((m: any) => m.temperatureMax)) - 
                                       Math.min(...climateData.map((m: any) => m.temperatureMin));
                      
                      let climateType = "";
                      if (avgTemp > 65) climateType = " a warm climate";
                      else if (avgTemp < 45) climateType = " a cool climate";
                      else climateType = " a moderate climate";
                      
                      let precipType = "";
                      if (totalPrecip > 40) precipType = " with significant annual precipitation";
                      else if (totalPrecip < 20) precipType = " with low annual precipitation";
                      else precipType = " with moderate annual precipitation";
                      
                      return climateType + precipType;
                    })()}.
                    Properties here should consider 
                    {(() => {
                      const coldMonths = climateData.filter((m: any) => m.temperatureMin < 32).length;
                      const hotMonths = climateData.filter((m: any) => m.temperatureMax > 85).length;
                      const wetMonths = climateData.filter((m: any) => m.precipitationAvg > 4).length;
                      
                      let considerations = [];
                      if (coldMonths > 2) considerations.push("cold weather protection");
                      if (hotMonths > 2) considerations.push("heat management");
                      if (wetMonths > 2) considerations.push("moisture control");
                      
                      return considerations.length > 0 
                        ? " " + considerations.join(", ") + "."
                        : " standard weather protection measures.";
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <BarChart className="mx-auto text-muted-foreground" size={48} />
                <p className="mt-2 text-muted-foreground">
                  Climate data unavailable for this location
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Demographics Tab */}
        <TabsContent value="demographics">
          <CardContent className="pt-4">
            {demographicLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              </div>
            ) : demographicData ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {demographicData.geographyName}
                </h3>
                
                {/* Population metrics card */}
                <div className="border rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <Users className="mr-2" size={16} />
                    Population Metrics
                  </h4>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Population</span>
                      <span className="font-medium">{demographicData.totalPopulation.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(demographicData.totalPopulation / 50000 * 100, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Small</span>
                      <span>Medium</span>
                      <span>Large</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Median Age</span>
                      <span className="font-medium">{demographicData.medianAge} years</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(demographicData.medianAge / 60 * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Young</span>
                      <span>Middle-aged</span>
                      <span>Senior</span>
                    </div>
                  </div>
                </div>
                
                {/* Income & Housing metrics */}
                <div className="border rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <DollarSign className="mr-2" size={16} />
                    Income & Housing
                  </h4>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Median Household Income</span>
                      <span className="font-medium">${demographicData.medianHouseholdIncome.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${Math.min(demographicData.medianHouseholdIncome / 150000 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Median Home Value</span>
                      <span className="font-medium">${demographicData.medianHomeValue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${Math.min(demographicData.medianHomeValue / 500000 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Median Monthly Rent</span>
                      <span className="font-medium">${demographicData.medianGrossRent.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${Math.min(demographicData.medianGrossRent / 2500 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Education & Ownership chart */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <School className="mr-2" size={16} />
                      Education
                    </h4>
                    <div className="relative pt-2">
                      {/* High School */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>High School</span>
                          <span>{demographicData.educationHighSchool}%</span>
                        </div>
                        <Progress value={demographicData.educationHighSchool} className="h-2" />
                      </div>
                      
                      {/* Bachelor's */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Bachelor's</span>
                          <span>{demographicData.educationBachelor}%</span>
                        </div>
                        <Progress value={demographicData.educationBachelor} className="h-2" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Home className="mr-2" size={16} />
                      Homeownership
                    </h4>
                    <div className="flex justify-center h-20 items-center">
                      <div className="relative w-20 h-20">
                        {/* Ownership pie chart */}
                        <svg className="w-full h-full" viewBox="0 0 20 20">
                          <circle 
                            r="10" 
                            cx="10" 
                            cy="10" 
                            fill="transparent"
                            stroke="#e2e8f0"
                            strokeWidth="20"
                            strokeDasharray="62.83"
                            strokeDashoffset="0"
                          />
                          <circle 
                            r="10" 
                            cx="10" 
                            cy="10" 
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth="20"
                            strokeDasharray="62.83"
                            strokeDashoffset={62.83 * (1 - demographicData.homeownershipRate / 100)}
                            transform="rotate(-90 10 10)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-semibold">{demographicData.homeownershipRate}%</span>
                        </div>
                      </div>
                      <div className="ml-4 text-xs space-y-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-sm bg-blue-500 mr-1"></div>
                          <span>Owner-Occupied</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-sm bg-gray-200 mr-1"></div>
                          <span>Renter-Occupied</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Real estate impact */}
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Real Estate Impact</h4>
                  <p className="text-xs text-muted-foreground">
                    This area has {demographicData.medianHouseholdIncome > 75000 ? 'above average' : 'typical'} household income 
                    and {demographicData.homeownershipRate > 65 ? 'high' : demographicData.homeownershipRate > 40 ? 'moderate' : 'low'} homeownership rates.
                    Properties in this market appeal to {demographicData.medianAge < 35 ? 'younger buyers' : demographicData.medianAge > 55 ? 'older buyers' : 'a wide range of age groups'} 
                    with {demographicData.educationBachelor > 40 ? 'highly educated' : 'moderate education'} backgrounds.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <BarChart className="mx-auto text-muted-foreground" size={48} />
                <p className="mt-2 text-muted-foreground">
                  Demographic data unavailable for this location
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      <CardFooter className="text-xs text-muted-foreground pt-4">
        <p>Data sourced from Weather API and U.S. Census Bureau</p>
      </CardFooter>
    </Card>
  );
};

export default PropertyEnrichmentWidget;