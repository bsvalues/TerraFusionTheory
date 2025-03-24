/**
 * Property Market Trends Chart
 * 
 * An interactive visualization component that displays property market trends
 * including price trends, inventory levels, and days on market metrics.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketTrendData {
  month: string;
  medianPrice: number;
  averagePrice: number;
  inventory: number;
  daysOnMarket: number;
  listToSaleRatio: number;
  salesVolume: number;
}

interface PropertyMarketTrendsProps {
  areaCode?: string;
  propertyType?: string;
  timeFrame?: '6m' | '1y' | '2y' | '5y';
}

const PropertyMarketTrends: React.FC<PropertyMarketTrendsProps> = ({
  areaCode = 'grandview',
  propertyType = 'all',
  timeFrame = '1y',
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<MarketTrendData[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('price');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>(timeFrame);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>(propertyType);
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>(areaCode);

  useEffect(() => {
    const fetchMarketTrendData = async () => {
      setLoading(true);
      try {
        // In a production environment, this would be a real API call
        // For now, using a timeout to simulate network request
        const response = await new Promise<MarketTrendData[]>((resolve) => {
          setTimeout(() => {
            resolve(generateTrendData(selectedTimeFrame, selectedPropertyType, selectedAreaCode));
          }, 1000);
        });
        
        setTrendData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching market trend data:', err);
        setError('Failed to load market trend data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketTrendData();
  }, [selectedTimeFrame, selectedPropertyType, selectedAreaCode]);

  const handleTimeFrameChange = (value: string) => {
    setSelectedTimeFrame(value);
  };

  const handlePropertyTypeChange = (value: string) => {
    setSelectedPropertyType(value);
  };

  const handleAreaCodeChange = (value: string) => {
    setSelectedAreaCode(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Property Market Trends</CardTitle>
        <CardDescription>
          Visualize key market metrics over time to identify trends and patterns
        </CardDescription>
        <div className="flex flex-wrap gap-2 justify-between mt-4">
          <Select value={selectedAreaCode} onValueChange={handleAreaCodeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Market Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grandview">Grandview</SelectItem>
              <SelectItem value="yakima">Yakima County</SelectItem>
              <SelectItem value="sunnyside">Sunnyside</SelectItem>
              <SelectItem value="prosser">Prosser</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPropertyType} onValueChange={handlePropertyTypeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="single-family">Single Family</SelectItem>
              <SelectItem value="condo">Condos</SelectItem>
              <SelectItem value="multi-family">Multi-Family</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTimeFrame} onValueChange={handleTimeFrameChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="2y">2 Years</SelectItem>
              <SelectItem value="5y">5 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="price" 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="price">Pricing</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="dom">Days on Market</TabsTrigger>
            <TabsTrigger value="volume">Sales Volume</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full rounded-md" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <TabsContent value="price" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month">
                      <Label value="Month" offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    >
                      <Label value="Price" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']} 
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="medianPrice" 
                      name="Median Price" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averagePrice" 
                      name="Average Price" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="inventory" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month">
                      <Label value="Month" offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis>
                      <Label value="Listings" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="inventory" 
                      name="Active Listings" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="dom" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month">
                      <Label value="Month" offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis>
                      <Label value="Days" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="daysOnMarket" 
                      name="Days on Market" 
                      stroke="#ff7300" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="volume" className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month">
                      <Label value="Month" offset={-10} position="insideBottom" />
                    </XAxis>
                    <YAxis>
                      <Label value="Sales" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="salesVolume" 
                      name="Sales Volume" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper function to generate mock trend data
// In a real app, this would be replaced with API data
const generateTrendData = (
  timeFrame: string, 
  propertyType: string, 
  areaCode: string
): MarketTrendData[] => {
  const data: MarketTrendData[] = [];
  
  // Base values that will be adjusted based on parameters
  const baseMedianPrice = areaCode === 'grandview' ? 285000 : 
                         areaCode === 'yakima' ? 325000 : 
                         areaCode === 'sunnyside' ? 250000 : 340000;
  
  const propertyMultiplier = propertyType === 'all' ? 1 : 
                            propertyType === 'single-family' ? 1.1 : 
                            propertyType === 'condo' ? 0.8 : 
                            propertyType === 'multi-family' ? 1.5 : 0.6;
  
  // Calculate number of months based on timeframe
  const months = timeFrame === '6m' ? 6 : 
                timeFrame === '1y' ? 12 : 
                timeFrame === '2y' ? 24 : 60;
  
  // Generate monthly data points
  for (let i = 0; i < months; i++) {
    // Create date object for the month (working backwards from current month)
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i - 1));
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Add some randomness and trends to data
    const trendFactor = 1 + (i / months) * 0.15; // Slight upward trend over time
    const seasonalFactor = 1 + Math.sin((i % 12) / 12 * Math.PI * 2) * 0.05; // Seasonal variations
    const randomFactor = 0.95 + Math.random() * 0.1; // Random noise
    
    const medianPrice = Math.round(baseMedianPrice * propertyMultiplier * trendFactor * seasonalFactor * randomFactor);
    const averagePrice = Math.round(medianPrice * (1 + (Math.random() * 0.2 - 0.1))); // Average is typically a bit higher
    
    data.push({
      month: monthLabel,
      medianPrice,
      averagePrice,
      inventory: Math.round(50 * propertyMultiplier * (1.1 - trendFactor * 0.2) * seasonalFactor * randomFactor), // Inventory tends to decrease as market heats up
      daysOnMarket: Math.round(45 * (1.2 - trendFactor * 0.3) * seasonalFactor * randomFactor), // DOM decreases over time
      listToSaleRatio: Math.min(1, 0.93 + (trendFactor - 1) * 0.1 * randomFactor), // Ratio tends to increase over time (up to 1.0)
      salesVolume: Math.round(30 * propertyMultiplier * trendFactor * seasonalFactor * randomFactor)
    });
  }
  
  return data;
};

export default PropertyMarketTrends;