/**
 * Neighborhood Trends Page
 * 
 * This page displays neighborhood market trends with animated tooltips
 * showing key metrics and indicators.
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import NeighborhoodTrendsGrid from '@/components/neighborhood/NeighborhoodTrendsGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  TrendingUp, 
  LineChart,
  BarChart4,
  PieChart
} from 'lucide-react';

const NeighborhoodTrendsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Neighborhood Trends | TerraFusion</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center mb-2">
            <MapPin className="h-6 w-6 mr-2 text-primary" />
            Neighborhood Market Analysis
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Interactive visualization of real estate market trends and indicators 
            by neighborhood, providing insights for informed property investment decisions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full md:w-auto md:flex grid-cols-2 h-auto mb-8">
          <TabsTrigger value="trends" className="py-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span>Market Trends</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="py-2 flex items-center">
            <LineChart className="h-4 w-4 mr-2" />
            <span>Key Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="py-2 flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            <span>Neighborhood Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="py-2 flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            <span>Advanced Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-0">
          {/* Market Trends Grid */}
          <NeighborhoodTrendsGrid className="mt-6" />
        </TabsContent>

        <TabsContent value="metrics" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center text-center h-60">
                <div className="max-w-md">
                  <LineChart className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-medium mb-2">Key Metrics Visualization</h3>
                  <p className="text-muted-foreground">
                    This section will provide detailed metrics and KPIs for each neighborhood, 
                    including historical data and forecasts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center text-center h-60">
                <div className="max-w-md">
                  <BarChart4 className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-medium mb-2">Neighborhood Comparison</h3>
                  <p className="text-muted-foreground">
                    This section will allow side-by-side comparison of neighborhoods 
                    based on various criteria and indicators.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center text-center h-60">
                <div className="max-w-md">
                  <PieChart className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-medium mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground">
                    This section will offer advanced analytical tools for in-depth 
                    neighborhood analysis and forecasting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="text-sm text-muted-foreground">
        <p>Data last updated: May 16, 2025</p>
        <p>Source: TerraFusion Property Analytics</p>
      </div>
    </div>
  );
};

export default NeighborhoodTrendsPage;