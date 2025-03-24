/**
 * Economic Indicators Dashboard Component
 * 
 * This component displays comprehensive economic indicators for real estate market analysis,
 * including employment, income, business, and housing market metrics.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { 
  Briefcase, 
  Building, 
  DollarSign, 
  Home, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Calendar,
  Info,
  RefreshCw
} from 'lucide-react';
import economicIndicatorsService, {
  EconomicIndicators,
  TrendDirection,
  EconomicTrend
} from '@/services/economic-indicators.service';

interface EconomicIndicatorsDashboardProps {
  locationCode?: string;
  locationType?: 'city' | 'county' | 'zip' | 'metro' | 'state';
  showTitle?: boolean;
  className?: string;
  showHistorical?: boolean;
}

const EconomicIndicatorsDashboard: React.FC<EconomicIndicatorsDashboardProps> = ({
  locationCode = 'grandview-city',
  locationType = 'city',
  showTitle = true,
  className = '',
  showHistorical = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [indicators, setIndicators] = useState<EconomicIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<{
    years: string[];
    unemploymentRate: number[];
    medianIncome: number[];
    businessGrowth: number[];
    housingPermits: number[];
    jobGrowth: number[];
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(locationCode);
  const [selectedLocationType, setSelectedLocationType] = useState(locationType);

  // Sample location options for the demo
  const locationOptions = [
    { code: 'grandview-city', name: 'Grandview', type: 'city' as const },
    { code: 'yakima-city', name: 'Yakima', type: 'city' as const },
    { code: 'sunnyside-city', name: 'Sunnyside', type: 'city' as const },
    { code: 'yakima-county', name: 'Yakima County', type: 'county' as const },
    { code: 'benton-county', name: 'Benton County', type: 'county' as const },
    { code: '98930', name: '98930 (Grandview)', type: 'zip' as const },
    { code: '98901', name: '98901 (Yakima)', type: 'zip' as const },
    { code: 'yakima-metro', name: 'Yakima Metro Area', type: 'metro' as const },
    { code: 'washington', name: 'Washington State', type: 'state' as const }
  ];

  // Fetch economic indicators data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await economicIndicatorsService.getEconomicIndicators(
          selectedLocation,
          selectedLocationType
        );
        setIndicators(data);
        setError(null);
        
        // Also fetch historical data if enabled
        if (showHistorical) {
          const historical = await economicIndicatorsService.getHistoricalEconomicData(
            selectedLocation,
            selectedLocationType,
            5 // 5 years of data
          );
          setHistoricalData(historical);
        }
      } catch (err) {
        console.error('Error fetching economic indicators:', err);
        setError('Failed to load economic indicators data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLocation, selectedLocationType, showHistorical]);

  // Helper function to format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to format percentages
  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Helper function for trend icons and colors
  const getTrendIcon = (trend: EconomicTrend) => {
    const size = 'h-4 w-4';
    
    switch (trend.direction) {
      case TrendDirection.UP_STRONG:
        return <ArrowUpRight className={`${size} text-green-600`} />;
      case TrendDirection.UP_MODERATE:
        return <ArrowUpRight className={`${size} text-green-500`} />;
      case TrendDirection.STABLE:
        return <ArrowRight className={`${size} text-gray-500`} />;
      case TrendDirection.DOWN_MODERATE:
        return <ArrowDownRight className={`${size} text-orange-500`} />;
      case TrendDirection.DOWN_STRONG:
        return <ArrowDownRight className={`${size} text-red-600`} />;
      default:
        return <Minus className={`${size} text-gray-400`} />;
    }
  };

  // Helper function for trend badge styles
  const getTrendBadgeClass = (trend: EconomicTrend): string => {
    switch (trend.direction) {
      case TrendDirection.UP_STRONG:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case TrendDirection.UP_MODERATE:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case TrendDirection.STABLE:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case TrendDirection.DOWN_MODERATE:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case TrendDirection.DOWN_STRONG:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Determine if a trend is positive (including context sensitivity)
  const isTrendPositive = (trend: EconomicTrend, isInverted: boolean = false): boolean => {
    const isUpTrend = 
      trend.direction === TrendDirection.UP_STRONG || 
      trend.direction === TrendDirection.UP_MODERATE;
    
    // For metrics where down is good (like unemployment rate), invert the logic
    return isInverted ? !isUpTrend : isUpTrend;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-2xl">
            <Skeleton className="h-8 w-[250px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[200px]" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !indicators) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Building className="mr-2 h-6 w-6 text-red-500" />
            Economic Data Unavailable
          </CardTitle>
          <CardDescription>
            Unable to load economic indicators data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">
            {error || 'No economic data could be loaded for this location.'}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setLoading(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare sector breakdown data for pie chart
  const sectorData = indicators.employment.sectorBreakdown.map(sector => ({
    name: sector.sector,
    value: sector.percentage,
    trend: sector.trend
  }));

  // Prepare income distribution data for pie chart
  const incomeData = indicators.income.incomeDistribution.map(bracket => ({
    name: bracket.range,
    value: bracket.percentage
  }));

  // Convert employment trends to historical chart data
  const employmentChartData = historicalData ? historicalData.years.map((year, index) => ({
    name: year,
    'Unemployment Rate': historicalData.unemploymentRate[index],
    'Job Growth': historicalData.jobGrowth[index],
  })) : [];

  // Convert business trends to historical chart data
  const businessChartData = historicalData ? historicalData.years.map((year, index) => ({
    name: year,
    'Business Growth': historicalData.businessGrowth[index],
  })) : [];

  // Convert income trends to historical chart data
  const incomeChartData = historicalData ? historicalData.years.map((year, index) => ({
    name: year,
    'Median Income': historicalData.medianIncome[index],
  })) : [];

  // Convert housing trends to historical chart data
  const housingChartData = historicalData ? historicalData.years.map((year, index) => ({
    name: year,
    'Building Permits': historicalData.housingPermits[index],
  })) : [];

  // Prepare the radar chart data for economic health overview
  const radarData = [
    {
      subject: 'Employment',
      A: Math.max(50, 100 - Math.max(indicators.employment.unemploymentRate * 10, 0)), // Lower unemployment is better
      fullMark: 100,
    },
    {
      subject: 'Income',
      A: Math.min(100, (indicators.income.medianHouseholdIncome / 80000) * 100), // Scaled up to 100%
      fullMark: 100,
    },
    {
      subject: 'Business',
      A: Math.min(100, 50 + indicators.business.businessGrowthRate * 10), // Business growth rate scaled
      fullMark: 100,
    },
    {
      subject: 'Housing',
      A: indicators.housingMarket.housingAffordability,
      fullMark: 100,
    },
    {
      subject: 'Economy',
      A: indicators.overallEconomicHealth,
      fullMark: 100,
    },
  ];

  // Define colors for pie charts
  const SECTOR_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50', '#E91E63'];
  const INCOME_COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884D8', '#4CAF50'];

  return (
    <Card className={`${className}`}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Building className="mr-2 h-6 w-6 text-primary" />
            Economic Indicators Dashboard
          </CardTitle>
          <CardDescription className="flex flex-col space-y-1">
            <span>Comprehensive economic data for real estate market analysis</span>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              Last updated: {new Date(indicators.lastUpdated).toLocaleDateString()}
            </div>
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="space-y-5">
        {/* Location Selector */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select 
            value={selectedLocation}
            onValueChange={(value) => setSelectedLocation(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map(option => (
                <SelectItem 
                  key={option.code} 
                  value={option.code}
                  onClick={() => setSelectedLocationType(option.type)}
                >
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge className="text-xs">
            {indicators.locationName} ({indicators.locationType})
          </Badge>
          
          <div className="flex items-center ml-auto">
            <span className="text-sm font-medium mr-2">Overall Economic Health:</span>
            <Progress 
              value={indicators.overallEconomicHealth} 
              className="w-24 h-2"
            />
            <span className="text-xs ml-2">
              {indicators.overallEconomicHealth}/100
            </span>
            <div className="flex items-center ml-2">
              {getTrendIcon(indicators.economicHealthTrend)}
              <span className="text-xs ml-1">
                {indicators.economicHealthTrend.percentChange > 0 ? '+' : ''}
                {indicators.economicHealthTrend.percentChange}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Tabs for different economic aspects */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              <span>Employment</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Income</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              <span>Business</span>
            </TabsTrigger>
            <TabsTrigger value="housing" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              <span>Housing</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Economic Health Radar Chart */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Economic Health Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Economic Health"
                            dataKey="A"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Key Economic Indicators */}
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Key Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Unemployment Rate</span>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{formatPercent(indicators.employment.unemploymentRate)}</span>
                            {getTrendIcon(indicators.employment.employmentTrend)}
                          </div>
                        </div>
                        <Progress 
                          value={Math.max(0, 100 - (indicators.employment.unemploymentRate * 10))} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Median Household Income</span>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{formatCurrency(indicators.income.medianHouseholdIncome)}</span>
                            {getTrendIcon(indicators.income.incomeTrend)}
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(100, (indicators.income.medianHouseholdIncome / 80000) * 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Business Growth</span>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{formatPercent(indicators.business.businessGrowthRate)}</span>
                            {getTrendIcon(indicators.business.businessTrend)}
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(100, 50 + indicators.business.businessGrowthRate * 10)} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Housing Affordability</span>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{indicators.housingMarket.housingAffordability}/100</span>
                          </div>
                        </div>
                        <Progress 
                          value={indicators.housingMarket.housingAffordability} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        <p>Data Quality: {indicators.dataQuality}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Historical Trends */}
            {showHistorical && historicalData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">5-Year Economic Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={employmentChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Unemployment Rate"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Job Growth"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Employment Metrics</CardTitle>
                    <CardDescription>
                      Current employment statistics and trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Unemployment Rate</div>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold">{formatPercent(indicators.employment.unemploymentRate)}</div>
                          <Badge className={`ml-2 ${getTrendBadgeClass(indicators.employment.employmentTrend)}`}>
                            <span className="flex items-center">
                              {getTrendIcon(indicators.employment.employmentTrend)}
                              <span className="ml-1">{indicators.employment.employmentTrend.percentChange}%</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {indicators.employment.employmentTrend.description}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Labor Force Participation</div>
                        <div className="text-2xl font-bold">{formatPercent(indicators.employment.laborForceParticipation)}</div>
                        <Progress 
                          value={indicators.employment.laborForceParticipation} 
                          className="h-2 mt-1"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Job Growth Rate</div>
                        <div className="text-2xl font-bold">{formatPercent(indicators.employment.jobGrowthRate)}</div>
                        <p className="text-xs text-muted-foreground">
                          {indicators.employment.jobGrowthRate > 2 ? 'Strong job growth' : 
                          indicators.employment.jobGrowthRate > 0 ? 'Moderate job growth' : 'Stagnant job market'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Top Industry Sectors</div>
                        <ul className="text-sm space-y-1">
                          {indicators.employment.sectorBreakdown
                            .sort((a, b) => b.percentage - a.percentage)
                            .slice(0, 3)
                            .map((sector, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{sector.sector}</span>
                                <span className="font-medium">{formatPercent(sector.percentage)}</span>
                              </li>
                            ))
                          }
                        </ul>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Major Employers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {indicators.employment.majorEmployers.map((employer, idx) => (
                          <div key={idx} className="border rounded-md p-3">
                            <div className="font-medium">{employer.name}</div>
                            <div className="text-sm text-muted-foreground">{employer.sector}</div>
                            <div className="text-sm mt-1">{employer.employees.toLocaleString()} employees</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Employment by Sector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sectorData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {sectorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Sector Trends</h4>
                      <div className="space-y-2 text-sm">
                        {indicators.employment.sectorBreakdown
                          .sort((a, b) => {
                            // Sort by trend direction (growth first)
                            const trendA = isTrendPositive(a.trend) ? 1 : 0;
                            const trendB = isTrendPositive(b.trend) ? 1 : 0;
                            return trendB - trendA || b.percentage - a.percentage;
                          })
                          .map((sector, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span>{sector.sector}</span>
                              <div className="flex items-center">
                                {getTrendIcon(sector.trend)}
                                <span className="ml-1 text-xs">
                                  {sector.trend.percentChange > 0 ? '+' : ''}
                                  {sector.trend.percentChange}%
                                </span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Historical Employment Trends */}
            {showHistorical && historicalData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Historical Employment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={employmentChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Unemployment Rate"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Job Growth"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Income Tab */}
          <TabsContent value="income" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Income & Affordability</CardTitle>
                    <CardDescription>
                      Income statistics and housing affordability metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Median Household Income</div>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold">{formatCurrency(indicators.income.medianHouseholdIncome)}</div>
                          <Badge className={`ml-2 ${getTrendBadgeClass(indicators.income.incomeTrend)}`}>
                            <span className="flex items-center">
                              {getTrendIcon(indicators.income.incomeTrend)}
                              <span className="ml-1">{indicators.income.incomeTrend.percentChange}%</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {indicators.income.incomeTrend.description}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Per Capita Income</div>
                        <div className="text-2xl font-bold">{formatCurrency(indicators.income.perCapitaIncome)}</div>
                        <p className="text-xs text-muted-foreground">
                          Individual average income
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Housing Affordability</div>
                        <div className="text-2xl font-bold">{indicators.income.affordabilityIndex}/100</div>
                        <Progress 
                          value={indicators.income.affordabilityIndex} 
                          className="h-2 mt-1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher scores indicate better affordability
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Poverty Rate</div>
                        <div className="text-2xl font-bold">{formatPercent(indicators.income.povertyRate)}</div>
                        <p className="text-xs text-muted-foreground">
                          Percentage of population below poverty line
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Home Value to Income Ratio</h4>
                      <div className="flex items-center">
                        <div className="text-2xl font-bold">{indicators.income.medianHomeValueToIncomeRatio.toFixed(1)}x</div>
                        <div className="ml-3 text-sm text-muted-foreground">
                          Median home price is {indicators.income.medianHomeValueToIncomeRatio.toFixed(1)} times the median annual income
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={Math.min(100, Math.max(0, 100 - (indicators.income.medianHomeValueToIncomeRatio - 2) * 20))} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>More Affordable</span>
                          <span>Less Affordable</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {indicators.income.medianHomeValueToIncomeRatio <= 3 
                          ? 'Generally considered affordable (3x or less)'
                          : indicators.income.medianHomeValueToIncomeRatio <= 4
                          ? 'Moderately affordable (3-4x income)'
                          : indicators.income.medianHomeValueToIncomeRatio <= 5
                          ? 'Moderately expensive (4-5x income)'
                          : 'Expensive market (over 5x income)'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Income Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {incomeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Income Bracket Distribution</h4>
                      <div className="space-y-2 text-sm">
                        {indicators.income.incomeDistribution.map((bracket, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span>{bracket.range}</span>
                            <span className="font-medium">{formatPercent(bracket.percentage)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Historical Income Trends */}
            {showHistorical && historicalData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Historical Income Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={incomeChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Median Income"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Business Tab */}
          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Business Environment</CardTitle>
                    <CardDescription>
                      Business growth and commercial activity metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Total Businesses</div>
                        <div className="text-2xl font-bold">{indicators.business.totalBusinesses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Registered business entities
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Business Growth Rate</div>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold">{formatPercent(indicators.business.businessGrowthRate)}</div>
                          <Badge className={`ml-2 ${getTrendBadgeClass(indicators.business.businessTrend)}`}>
                            <span className="flex items-center">
                              {getTrendIcon(indicators.business.businessTrend)}
                              <span className="ml-1">{indicators.business.businessTrend.percentChange}%</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {indicators.business.businessTrend.description}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">New Business Formation</div>
                        <div className="text-2xl font-bold">{indicators.business.newBusinessFormation.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          New businesses in the past year
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Business Closures</div>
                        <div className="text-2xl font-bold">{indicators.business.businessClosures.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Business closures in the past year
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Retail Sales Trend</h4>
                      <div className="flex items-center">
                        <Badge className={getTrendBadgeClass(indicators.business.retailSalesTrend)}>
                          <span className="flex items-center">
                            {getTrendIcon(indicators.business.retailSalesTrend)}
                            <span className="ml-1">{indicators.business.retailSalesTrend.description}</span>
                          </span>
                        </Badge>
                        <div className="ml-3 text-sm text-muted-foreground">
                          {indicators.business.retailSalesTrend.percentChange > 0 ? '+' : ''}
                          {indicators.business.retailSalesTrend.percentChange}% change in retail sales
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Top Growing Sectors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={indicators.business.topGrowingSectors}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="sector" type="category" width={100} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Bar dataKey="growthRate" fill="#8884d8" name="Growth Rate (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Sector Growth Details</h4>
                      <div className="space-y-2 text-sm">
                        {indicators.business.topGrowingSectors.map((sector, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span>{sector.sector}</span>
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                              <span className="font-medium">{formatPercent(sector.growthRate)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Historical Business Trends */}
            {showHistorical && historicalData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Historical Business Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={businessChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Business Growth"
                          stroke="#82ca9d"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Housing Tab */}
          <TabsContent value="housing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Housing Market</CardTitle>
                    <CardDescription>
                      Housing market conditions and real estate metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Construction Permits</div>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold">{indicators.housingMarket.constructionPermits.toLocaleString()}</div>
                          <Badge className={`ml-2 ${getTrendBadgeClass(indicators.housingMarket.constructionTrend)}`}>
                            <span className="flex items-center">
                              {getTrendIcon(indicators.housingMarket.constructionTrend)}
                              <span className="ml-1">{indicators.housingMarket.constructionTrend.percentChange}%</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {indicators.housingMarket.constructionTrend.description}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Vacancy Rate</div>
                        <div className="text-2xl font-bold">{formatPercent(indicators.housingMarket.vacancyRate)}</div>
                        <p className="text-xs text-muted-foreground">
                          {indicators.housingMarket.vacancyRate < 5 ? 'Low vacancy (tight market)' : 
                          indicators.housingMarket.vacancyRate < 8 ? 'Balanced vacancy rate' : 'High vacancy rate'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Median Rent</div>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold">{formatCurrency(indicators.housingMarket.medianRent)}</div>
                          <Badge className={`ml-2 ${getTrendBadgeClass(indicators.housingMarket.rentTrend)}`}>
                            <span className="flex items-center">
                              {getTrendIcon(indicators.housingMarket.rentTrend)}
                              <span className="ml-1">{indicators.housingMarket.rentTrend.percentChange}%</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Monthly median rental price
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Homeownership Rate</div>
                        <div className="text-2xl font-bold">{formatPercent(indicators.housingMarket.homeownershipRate)}</div>
                        <p className="text-xs text-muted-foreground">
                          Percentage of owner-occupied housing
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Housing Affordability</div>
                        <div className="text-2xl font-bold">{indicators.housingMarket.housingAffordability}/100</div>
                        <Progress 
                          value={indicators.housingMarket.housingAffordability} 
                          className="h-2 mt-1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher scores indicate more affordable housing
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Rental Market Strength</div>
                        <div className="text-2xl font-bold">{indicators.housingMarket.rentalMarketStrength}/100</div>
                        <Progress 
                          value={indicators.housingMarket.rentalMarketStrength} 
                          className="h-2 mt-1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher scores indicate stronger rental market
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Real Estate Impact Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium">Employment Impact</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {indicators.employment.unemploymentRate < 4
                            ? 'Low unemployment is creating strong housing demand'
                            : indicators.employment.unemploymentRate < 6
                            ? 'Moderate unemployment with stable housing demand'
                            : 'Higher unemployment may be affecting buying power'}
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium">Income Impact</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {indicators.income.medianHomeValueToIncomeRatio < 3.5
                            ? 'Favorable home price to income ratio supports home buying'
                            : indicators.income.medianHomeValueToIncomeRatio < 5
                            ? 'Moderate affordability challenges for some buyers'
                            : 'Significant affordability challenges in the market'}
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium">Construction Impact</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {indicators.housingMarket.constructionTrend.percentChange > 5
                            ? 'Strong construction activity is expanding inventory'
                            : indicators.housingMarket.constructionTrend.percentChange > 0
                            ? 'Moderate new construction activity'
                            : 'Limited new construction may constrain inventory'}
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium">Rental vs. Ownership</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs">Rental</div>
                          <div className="text-xs">Ownership</div>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded mt-1">
                          <div 
                            className="absolute top-0 left-0 h-2 bg-primary rounded"
                            style={{ width: `${indicators.housingMarket.homeownershipRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>{formatPercent(100 - indicators.housingMarket.homeownershipRate)}</span>
                          <span>{formatPercent(indicators.housingMarket.homeownershipRate)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Historical Housing Trends */}
            {showHistorical && historicalData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Historical Construction Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={housingChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Building Permits" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>
              Data Quality Score: {indicators.dataQuality}/100
            </span>
          </div>
          <div>
            Last Updated: {new Date(indicators.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EconomicIndicatorsDashboard;