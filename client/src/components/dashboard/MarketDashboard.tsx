/**
 * MarketDashboard Component
 * 
 * This component displays market analytics, trends, and metrics for real estate data.
 * It includes various charts and visualizations for market analysis.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { 
  LucideHome, 
  LucideTrendingUp, 
  LucideBarChart3, 
  LucideRefreshCw, 
  LucideArrowUp, 
  LucideArrowDown, 
  LucideBadgeDollarSign, 
  LucideCalendarDays 
} from 'lucide-react';

// Types
interface MarketMetric {
  date: string;
  value: number;
}

interface MarketTrend {
  metric: string;
  area_type: string;
  area_value: string;
  timeframe: string;
  data_points: MarketMetric[];
  change_pct: number;
  trend_direction: string;
}

interface MarketOverview {
  area_type: string;
  area_value: string;
  current_condition: string;
  median_price: number;
  average_price: number;
  price_per_sqft: number;
  total_active_listings: number;
  new_listings_last_30_days: number;
  avg_days_on_market: number;
  price_trends: Record<string, MarketTrend>;
  inventory_level: string;
  affordability_index: number;
}

interface MarketHotspot {
  area_type: string;
  area_value: string;
  price_growth_pct: number;
  median_price: number;
  avg_days_on_market: number;
  total_sales: number;
  score: number;
  latitude: number;
  longitude: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A270EF'];

const MarketDashboard = () => {
  const [selectedArea, setSelectedArea] = useState<string>('98930');
  const [selectedAreaType, setSelectedAreaType] = useState<string>('zip');
  const [timeframe, setTimeframe] = useState<string>('year');
  const { toast } = useToast();

  // Fetch market overview
  const { 
    data: marketOverview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview
  } = useQuery({
    queryKey: ['/api/market/overview', selectedAreaType, selectedArea],
    queryFn: async () => {
      // In a real implementation, we would fetch from the API
      // Sample data for demo purposes
      return {
        area_type: "zip",
        area_value: "98930",
        current_condition: "warm",
        median_price: 425000,
        average_price: 455000,
        price_per_sqft: 250,
        total_active_listings: 45,
        new_listings_last_30_days: 12,
        avg_days_on_market: 18,
        price_trends: {
          "median_price": {
            metric: "median_price",
            area_type: "zip",
            area_value: "98930",
            timeframe: "year",
            data_points: Array.from({ length: 12 }, (_, i) => ({
              date: new Date(2024, i, 1).toISOString().split('T')[0],
              value: 400000 + Math.floor(Math.random() * 50000)
            })),
            change_pct: 5.2,
            trend_direction: "up"
          },
          "avg_days_on_market": {
            metric: "avg_days_on_market",
            area_type: "zip",
            area_value: "98930",
            timeframe: "year",
            data_points: Array.from({ length: 12 }, (_, i) => ({
              date: new Date(2024, i, 1).toISOString().split('T')[0],
              value: 20 - Math.floor(Math.random() * 5)
            })),
            change_pct: -10.5,
            trend_direction: "down"
          }
        },
        inventory_level: "medium",
        affordability_index: 0.7
      } as MarketOverview;
    }
  });

  // Fetch market hotspots
  const {
    data: hotspots,
    isLoading: hotspotsLoading
  } = useQuery({
    queryKey: ['/api/market/hotspots'],
    queryFn: async () => {
      // Sample data for demo purposes
      return [
        {
          area_type: "zip",
          area_value: "98930",
          price_growth_pct: 8.5,
          median_price: 425000,
          avg_days_on_market: 18,
          total_sales: 42,
          score: 8.2,
          latitude: 46.2543,
          longitude: -119.9025
        },
        {
          area_type: "zip",
          area_value: "98932",
          price_growth_pct: 7.8,
          median_price: 390000,
          avg_days_on_market: 22,
          total_sales: 35,
          score: 7.9,
          latitude: 46.3001,
          longitude: -119.8542
        },
        {
          area_type: "zip",
          area_value: "98944",
          price_growth_pct: 7.2,
          median_price: 450000,
          avg_days_on_market: 15,
          total_sales: 48,
          score: 8.4,
          latitude: 46.2111,
          longitude: -119.7653
        },
        {
          area_type: "zip",
          area_value: "98933",
          price_growth_pct: 6.5,
          median_price: 380000,
          avg_days_on_market: 25,
          total_sales: 30,
          score: 7.6,
          latitude: 46.2890,
          longitude: -119.9567
        },
        {
          area_type: "zip",
          area_value: "98935",
          price_growth_pct: 5.9,
          median_price: 410000,
          avg_days_on_market: 20,
          total_sales: 38,
          score: 7.5,
          latitude: 46.3234,
          longitude: -119.8943
        }
      ] as MarketHotspot[];
    }
  });

  // Handle area change
  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  // Refresh data
  const handleRefresh = () => {
    refetchOverview();
    toast({
      title: "Data refreshed",
      description: "Market data has been updated with the latest metrics",
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  // Prepare data for price distribution
  const getPriceDistributionData = () => {
    if (!marketOverview) return [];
    
    // Sample data for price distribution
    return [
      { name: 'Under $300k', value: 15 },
      { name: '$300k-$400k', value: 30 },
      { name: '$400k-$500k', value: 35 },
      { name: '$500k-$600k', value: 15 },
      { name: 'Above $600k', value: 5 }
    ];
  };

  // Prepare data for property type distribution
  const getPropertyTypeData = () => {
    // Sample data for property type distribution
    return [
      { name: 'Single Family', value: 65 },
      { name: 'Condo/Townhome', value: 15 },
      { name: 'Multi-Family', value: 10 },
      { name: 'Land', value: 5 },
      { name: 'Other', value: 5 }
    ];
  };

  // Style for market condition badge
  const getMarketConditionStyle = (condition: string) => {
    switch (condition) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-orange-100 text-orange-800';
      case 'balanced':
        return 'bg-blue-100 text-blue-800';
      case 'cool':
        return 'bg-cyan-100 text-cyan-800';
      case 'cold':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Market Analytics</h2>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2">
              <Select value={selectedArea} onValueChange={handleAreaChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="98930">Grandview (98930)</SelectItem>
                  <SelectItem value="98932">Granger (98932)</SelectItem>
                  <SelectItem value="98944">Sunnyside (98944)</SelectItem>
                  <SelectItem value="98933">Hanford (98933)</SelectItem>
                  <SelectItem value="98935">Mabton (98935)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">1 Month</SelectItem>
                  <SelectItem value="quarter">3 Months</SelectItem>
                  <SelectItem value="year">1 Year</SelectItem>
                  <SelectItem value="five_years">5 Years</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={overviewLoading}
              >
                <LucideRefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {overviewLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : marketOverview ? (
          <Tabs defaultValue="overview" className="h-full overflow-hidden">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <LucideHome className="mr-2 h-4 w-4" />
                Market Overview
              </TabsTrigger>
              <TabsTrigger value="trends">
                <LucideTrendingUp className="mr-2 h-4 w-4" />
                Price Trends
              </TabsTrigger>
              <TabsTrigger value="distribution">
                <LucideBarChart3 className="mr-2 h-4 w-4" />
                Market Distribution
              </TabsTrigger>
              <TabsTrigger value="hotspots">
                <LucideTrendingUp className="mr-2 h-4 w-4" />
                Market Hotspots
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="h-full overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Median Price Card */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <LucideBadgeDollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                      Median Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold">
                        {formatCurrency(marketOverview.median_price)}
                      </div>
                      <div className={`text-sm flex items-center rounded-full px-2 py-1 ${
                        marketOverview.price_trends.median_price.change_pct > 0 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {marketOverview.price_trends.median_price.change_pct > 0 ? (
                          <LucideArrowUp className="mr-1 h-3 w-3" />
                        ) : (
                          <LucideArrowDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(Math.abs(marketOverview.price_trends.median_price.change_pct))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Year over year change
                    </p>
                  </CardContent>
                </Card>
                
                {/* Days on Market Card */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <LucideCalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                      Avg. Days on Market
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold">
                        {marketOverview.avg_days_on_market}
                      </div>
                      <div className={`text-sm flex items-center rounded-full px-2 py-1 ${
                        marketOverview.price_trends.avg_days_on_market.change_pct < 0 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {marketOverview.price_trends.avg_days_on_market.change_pct < 0 ? (
                          <LucideArrowDown className="mr-1 h-3 w-3" />
                        ) : (
                          <LucideArrowUp className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(Math.abs(marketOverview.price_trends.avg_days_on_market.change_pct))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Year over year change
                    </p>
                  </CardContent>
                </Card>
                
                {/* Active Listings Card */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <LucideHome className="mr-2 h-4 w-4 text-muted-foreground" />
                      Active Listings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {marketOverview.total_active_listings}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {marketOverview.new_listings_last_30_days} new in the last 30 days
                    </p>
                  </CardContent>
                </Card>
                
                {/* Price per Sqft Card */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <LucideBadgeDollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                      Price per Sqft
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(marketOverview.price_per_sqft)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {marketOverview.inventory_level} inventory level
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Market Condition Banner */}
              <div className={`mb-4 p-4 rounded-md ${getMarketConditionStyle(marketOverview.current_condition)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium capitalize">
                      {marketOverview.current_condition} Market
                    </span>
                    <span className="ml-2 text-sm opacity-75">
                      for {selectedAreaType === 'zip' ? 'ZIP Code' : 'City'} {selectedArea}
                    </span>
                  </div>
                  <div className="text-sm">
                    Affordability Index: {(marketOverview.affordability_index * 10).toFixed(1)}/10
                  </div>
                </div>
              </div>
              
              {/* Price Trend Chart */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Price Trends</CardTitle>
                  <CardDescription>
                    Historical median prices over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={marketOverview.price_trends.median_price.data_points}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), "Median Price"]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#8884d8" 
                          fillOpacity={1}
                          fill="url(#colorPrice)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Days on Market Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Days on Market Trends</CardTitle>
                  <CardDescription>
                    Average days on market over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={marketOverview.price_trends.avg_days_on_market.data_points}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [value, "Avg. Days on Market"]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#FF8042" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="h-full overflow-auto">
              {/* Price Trends Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Price Trends</CardTitle>
                    <CardDescription>
                      Change in median price by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={marketOverview.price_trends.median_price.data_points}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value)}
                          />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), "Median Price"]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Price per Sqft Trends</CardTitle>
                    <CardDescription>
                      Change in price per square foot over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={marketOverview.price_trends.median_price.data_points.map(point => ({
                            ...point,
                            value: point.value / 1800 // Approximate square footage
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price per Sqft"]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="distribution" className="h-full overflow-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Price Distribution</CardTitle>
                    <CardDescription>
                      Distribution of properties by price range
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPriceDistributionData()}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getPriceDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Property Type Distribution</CardTitle>
                    <CardDescription>
                      Distribution of properties by type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPropertyTypeData()}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getPropertyTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="hotspots" className="h-full overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Market Hotspots</CardTitle>
                  <CardDescription>
                    Areas with the highest price growth and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Growth</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Median Price</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. DOM</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {hotspots && hotspots.map((hotspot, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{hotspot.area_value}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-600 font-medium">+{hotspot.price_growth_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{formatCurrency(hotspot.median_price)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{hotspot.avg_days_on_market} days</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{hotspot.total_sales}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">{hotspot.score.toFixed(1)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-xl font-semibold mb-2">No market data available</div>
            <p className="text-muted-foreground mb-4">Try selecting a different area or timeframe</p>
            <Button onClick={handleRefresh}>Refresh Data</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDashboard;