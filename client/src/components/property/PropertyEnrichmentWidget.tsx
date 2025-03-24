import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import EnrichmentService from '../../services/enrichment.service';
import { Cloud, Droplets, Sun, Thermometer, Wind, BarChart, Users, Home, DollarSign } from 'lucide-react';

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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  {climateData.map((month: any, index: number) => (
                    <div key={index} className="grid grid-cols-5 gap-2 text-sm py-1 border-b">
                      <div className="font-medium">
                        {new Date(0, month.month - 1).toLocaleString('default', { month: 'short' })}
                      </div>
                      <div className="text-right">
                        {Math.round(month.temperatureMin)}°F
                      </div>
                      <div className="text-right">
                        {Math.round(month.temperatureAvg)}°F
                      </div>
                      <div className="text-right">
                        {Math.round(month.temperatureMax)}°F
                      </div>
                      <div className="text-right">
                        {month.precipitationAvg}" 
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground pt-1">
                    <div>Month</div>
                    <div className="text-right">Min</div>
                    <div className="text-right">Avg</div>
                    <div className="text-right">Max</div>
                    <div className="text-right">Precip</div>
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 rounded-lg border">
                    <Users className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Population</div>
                      <div className="font-semibold">
                        {demographicData.totalPopulation.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <Users className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Median Age</div>
                      <div className="font-semibold">{demographicData.medianAge} years</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <DollarSign className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Median Household Income</div>
                      <div className="font-semibold">
                        ${demographicData.medianHouseholdIncome.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <Home className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Homeownership</div>
                      <div className="font-semibold">
                        {demographicData.homeownershipRate}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <Home className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Median Home Value</div>
                      <div className="font-semibold">
                        ${demographicData.medianHomeValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border">
                    <Home className="mr-2" size={18} />
                    <div>
                      <div className="text-sm text-muted-foreground">Median Rent</div>
                      <div className="font-semibold">
                        ${demographicData.medianGrossRent.toLocaleString()}/mo
                      </div>
                    </div>
                  </div>
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