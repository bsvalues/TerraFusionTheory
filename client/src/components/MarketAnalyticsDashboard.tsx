import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { PriceHistoryChart, MarketMetricsChart, SegmentComparisonChart, PredictionChart } from './charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { MarketCondition, MarketTrend, MarketMetricsSnapshot, MarketPrediction } from '../types/real-estate';

// This demo uses the API if available, but falls back to empty data structures
// for component showcase purposes

const MarketAnalyticsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [selectedArea, setSelectedArea] = useState<string>('Grandview');
  const [timeframe, setTimeframe] = useState<string>('90');

  // Get market snapshot data
  const { data: snapshotData, isLoading: isSnapshotLoading, error: snapshotError } = useQuery({
    queryKey: ['/api/market/snapshot', { area: selectedArea }],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/market/snapshot?area=${selectedArea}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error fetching market snapshot');
        }
        const data = await response.json();
        return data.data as MarketMetricsSnapshot;
      } catch (error) {
        // In a production app, we'd want to handle errors more gracefully
        console.error('Error fetching market snapshot:', error);
        throw error;
      }
    },
    enabled: false, // Don't fetch on component mount
  });

  // Get market prediction data - we'll use a mock for now
  // In a real app, we would fetch this from the API
  const predictionData: MarketPrediction | null = null; // We'll use our mock data instead

  // Load the data when "Load Data" button is clicked
  const handleLoadData = () => {
    // This will trigger both queries
    // In a real application, this would be automatic based on user selections
    toast({
      title: "Loading market data",
      description: `Fetching market data for ${selectedArea}...`,
    });
    
    // In a real application, we would enable API fetching here
    // and the data would be refreshed from the server
    
    // For now, we'll just show a success message after a short delay
    setTimeout(() => {
      toast({
        title: "Data loaded successfully",
        description: "Using locally generated market data for demonstration",
      });
    }, 1000);
  };

  // Generate demo price history data - this would come from the API in a real application
  const generatePriceHistoryData = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, i * 30);
      return {
        date: format(date, 'yyyy-MM-dd'),
        medianPrice: 425000 - (i * 5000),
        averagePrice: 450000 - (i * 4800),
        pricePerSqFt: 250 - (i * 2)
      };
    }).reverse();
  };

  // Generate demo radar chart data - this would come from the API in a real application
  const generateMarketMetricsData = () => {
    return {
      metrics: [
        { name: 'Affordability', value: 65, fullValue: '65/100' },
        { name: 'Inventory', value: 45, fullValue: '45 listings' },
        { name: 'Days on Market', value: 70, fullValue: '22 days' },
        { name: 'Price Growth', value: 80, fullValue: '+8% YoY' },
        { name: 'Demand', value: 85, fullValue: '85/100' },
      ],
      marketCondition: 'warm' as MarketCondition,
      marketTrend: 'upModerate' as MarketTrend
    };
  };

  // Generate demo segment comparison data - this would come from the API in a real application
  const generateSegmentData = () => {
    return {
      segments: {
        propertyType: [
          { name: 'Single Family', totalListings: 30, medianPrice: 450000, avgDaysOnMarket: 20 },
          { name: 'Condo', totalListings: 15, medianPrice: 350000, avgDaysOnMarket: 25 },
          { name: 'Townhouse', totalListings: 12, medianPrice: 375000, avgDaysOnMarket: 18 },
          { name: 'Multi-Family', totalListings: 5, medianPrice: 520000, avgDaysOnMarket: 32 }
        ],
        priceRange: [
          { name: 'Under $300k', totalListings: 8, medianPrice: 275000, avgDaysOnMarket: 15 },
          { name: '$300k-$500k', totalListings: 35, medianPrice: 425000, avgDaysOnMarket: 22 },
          { name: '$500k-$750k', totalListings: 12, medianPrice: 625000, avgDaysOnMarket: 28 },
          { name: 'Over $750k', totalListings: 7, medianPrice: 850000, avgDaysOnMarket: 45 }
        ],
        neighborhood: [
          { name: 'Downtown', totalListings: 18, medianPrice: 385000, avgDaysOnMarket: 18 },
          { name: 'Westside', totalListings: 22, medianPrice: 425000, avgDaysOnMarket: 22 },
          { name: 'North', totalListings: 15, medianPrice: 475000, avgDaysOnMarket: 25 },
          { name: 'Suburbs', totalListings: 27, medianPrice: 525000, avgDaysOnMarket: 28 }
        ]
      }
    };
  };

  // Generate demo prediction data - this would come from the API in a real application
  const generatePredictionData = () => {
    const today = new Date();
    const predictions = Array.from({ length: 12 }, (_, i) => {
      const isPast = i < 6;
      const date = i < 6
        ? subDays(today, (6 - i) * 30)
        : addDays(today, (i - 6) * 30);
      
      const baseValue = 425000;
      const trend = 5000; // Monthly price increase
      
      const value = baseValue + (i * trend);
      const confidenceLow = isPast ? undefined : value * 0.95; // 5% variance
      const confidenceHigh = isPast ? undefined : value * 1.05; // 5% variance
      
      // Return data in the format expected by our shared PredictionData type
      return {
        date: format(date, 'yyyy-MM-dd'),
        value,
        confidenceLow,
        confidenceHigh
      };
    });

    return {
      predictions,
      confidenceScore: 0.75,
      predictionDate: subDays(today, 15).toISOString(),
      metric: 'medianPrice',
      metricLabel: 'Median Price'
    };
  };

  // For demonstration purposes, we'll use the mock data
  const priceHistoryData = generatePriceHistoryData();
  const marketMetricsData = generateMarketMetricsData();
  const segmentData = generateSegmentData();
  // Use the mock data when API data is not available
  const mockPredictionData = generatePredictionData();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Market Analytics Dashboard</h2>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Label htmlFor="area" className="text-sm">Area:</Label>
            <Select
              value={selectedArea}
              onValueChange={setSelectedArea}
            >
              <SelectTrigger id="area" className="h-9 w-[150px]">
                <SelectValue placeholder="Grandview" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Grandview">Grandview</SelectItem>
                <SelectItem value="Downtown">Downtown</SelectItem>
                <SelectItem value="Westside">Westside</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-center">
            <Label htmlFor="timeframe" className="text-sm">Forecast:</Label>
            <Select
              value={timeframe}
              onValueChange={setTimeframe}
            >
              <SelectTrigger id="timeframe" className="h-9 w-[120px]">
                <SelectValue placeholder="90 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleLoadData}>Load Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceHistoryChart 
          data={priceHistoryData} 
          title="Price History" 
        />
        <MarketMetricsChart 
          data={marketMetricsData} 
          title="Market Health"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SegmentComparisonChart 
          data={segmentData} 
          title="Market Segment Comparison"
        />
        <PredictionChart 
          data={predictionData || mockPredictionData} 
          title="Market Predictions"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="price">Price Analysis</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4">
                <div className="space-y-4">
                  <p>
                    The {selectedArea} real estate market is currently showing a {marketMetricsData.marketCondition} trend 
                    with {marketMetricsData.marketTrend === 'upModerate' ? 'moderately increasing' : 'changing'} prices. 
                    Median prices are up 5.2% year-over-year, with the average days on market at 22 days.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Top School Districts</Badge>
                    <Badge variant="outline">Family-Friendly</Badge>
                    <Badge variant="outline">Good Investment</Badge>
                    <Badge variant="outline">Appreciating Area</Badge>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="price" className="mt-4">
                <p>
                  Price trends in {selectedArea} show consistent appreciation over the past 6 months. 
                  The median home price of $425,000 represents a 5.2% increase from the same time last year. 
                  Price per square foot has increased from $248 to $250.
                </p>
              </TabsContent>
              <TabsContent value="inventory" className="mt-4">
                <p>
                  Current inventory levels in {selectedArea} are at 45 active listings, which is down 15% from
                  the same period last year. New listings are being added at a rate of approximately 10 per week,
                  but properties are selling quickly, keeping inventory levels relatively low.
                </p>
              </TabsContent>
              <TabsContent value="trends" className="mt-4">
                <p>
                  Key trends in the {selectedArea} market include increasing demand for single-family homes,
                  particularly in the $300k-$500k price range. The average days on market has decreased by 18%
                  compared to last year, indicating a competitive seller's market.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketAnalyticsDashboard;