import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
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

const MarketAnalyticsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [selectedArea, setSelectedArea] = useState<string>('Grandview');
  const [timeframe, setTimeframe] = useState<string>('90');

  // Fetch real prediction data from the API
  const { data: predictionData, isLoading: predictionLoading, refetch: refetchPrediction } = useQuery({
    queryKey: ['/api/market/predictions', selectedArea],
    queryFn: async () => {
      const response = await fetch(`/api/market/predictions?area=${selectedArea}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: !!selectedArea
  });

  // Fetch real market metrics from the API
  const { data: marketMetricsData, isLoading: marketMetricsLoading, refetch: refetchMarketMetrics } = useQuery({
    queryKey: ['/api/market/metrics', selectedArea],
    queryFn: async () => {
      const response = await fetch(`/api/market/metrics?area=${selectedArea}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch market metrics: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!selectedArea
  });

  // Fetch real price history data from the API
  const { data: priceHistoryData, isLoading: priceHistoryLoading, refetch: refetchPriceHistory } = useQuery({
    queryKey: ['/api/market/price-history', selectedArea],
    queryFn: async () => {
      const response = await fetch(`/api/market/price-history?area=${selectedArea}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price history: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!selectedArea
  });

  // Fetch real market segment data from the API
  const { data: segmentData, isLoading: segmentDataLoading, refetch: refetchSegmentData } = useQuery({
    queryKey: ['/api/market/segments', selectedArea],
    queryFn: async () => {
      const response = await fetch(`/api/market/segments?area=${selectedArea}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch market segments: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!selectedArea
  });

  // Load the data when "Load Data" button is clicked
  const handleLoadData = () => {
    toast({
      title: "Loading market data",
      description: `Fetching market data for ${selectedArea}...`,
    });
    
    // Trigger refetching data from the real APIs
    const refetchQueries = async () => {
      try {
        // Force refetch all the queries with real data
        await Promise.all([
          refetchPriceHistory(),
          refetchMarketMetrics(),
          refetchSegmentData(),
          refetchPrediction()
        ]);
        
        toast({
          title: "Data loaded successfully",
          description: `Market data for ${selectedArea} loaded successfully`,
        });
      } catch (error) {
        console.error("Error loading market data:", error);
        toast({
          title: "Error loading data",
          description: `Failed to load market data for ${selectedArea}. ${error instanceof Error ? error.message : ''}`,
          variant: "destructive"
        });
      }
    };
    
    refetchQueries();
  };

  // Handle data display, show loading indicators if data is loading
  const renderContent = () => {
    if (predictionLoading || marketMetricsLoading || priceHistoryLoading || segmentDataLoading) {
      return (
        <div className="space-y-6">
          <Alert>
            <AlertDescription>
              Loading market data, please wait...
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      );
    }

    return (
      <>
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
            data={predictionData} 
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
                      The {selectedArea} real estate market is currently showing a {marketMetricsData?.marketCondition || 'neutral'} trend 
                      with {marketMetricsData?.marketTrend === 'upModerate' ? 'moderately increasing' : 'changing'} prices. 
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
      </>
    );
  };

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

      {renderContent()}
    </div>
  );
};

export default MarketAnalyticsDashboard;