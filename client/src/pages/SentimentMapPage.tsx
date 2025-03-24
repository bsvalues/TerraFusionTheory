/**
 * Sentiment Map Page
 * 
 * This page displays a geographical map visualization of neighborhood sentiment,
 * showing sentiment levels across different areas with color-coded overlays.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoCircle, Map } from 'lucide-react';
import { SentimentLevel } from '@/services/neighborhood-sentiment.service';

// Placeholder component for the sentiment map
// In a real application, this would use a mapping library like Leaflet or Mapbox
const SentimentMapPlaceholder: React.FC = () => {
  return (
    <div className="bg-muted/30 rounded-lg overflow-hidden aspect-[16/9] flex flex-col items-center justify-center p-6">
      <Map className="h-16 w-16 mb-4 text-primary/50" />
      <h3 className="text-lg font-medium">Sentiment Map Visualization</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
        This area would display an interactive map with color-coded sentiment overlays for different neighborhoods. 
        Neighborhoods would be shaded with colors representing sentiment levels from very negative (red) to very positive (green).
      </p>
    </div>
  );
};

const SentimentMapPage: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('current');

  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>Sentiment Map | IntelligentEstate</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Map className="mr-2 h-8 w-8" />
            Neighborhood Sentiment Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize public sentiment across neighborhoods with geographic context
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Select
            value={selectedMetric}
            onValueChange={setSelectedMetric}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Sentiment</SelectItem>
              <SelectItem value="safety">Safety Sentiment</SelectItem>
              <SelectItem value="schools">Schools Sentiment</SelectItem>
              <SelectItem value="amenities">Amenities Sentiment</SelectItem>
              <SelectItem value="community">Community Sentiment</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current (Last 30 days)</SelectItem>
              <SelectItem value="3months">Past 3 Months</SelectItem>
              <SelectItem value="6months">Past 6 Months</SelectItem>
              <SelectItem value="1year">Past Year</SelectItem>
              <SelectItem value="trend">Trend (Change)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Heatmap</CardTitle>
              <CardDescription>
                Color-coded visualization of sentiment levels across neighborhoods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SentimentMapPlaceholder />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Legend</CardTitle>
              <CardDescription>Map color interpretation guide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Very Positive</span>
                  <div className="h-5 w-5 rounded bg-green-500"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Positive</span>
                  <div className="h-5 w-5 rounded bg-green-300"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Neutral</span>
                  <div className="h-5 w-5 rounded bg-gray-300"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Negative</span>
                  <div className="h-5 w-5 rounded bg-red-300"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Very Negative</span>
                  <div className="h-5 w-5 rounded bg-red-500"></div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Metrics Explained</h4>
                  <p className="text-sm text-muted-foreground">
                    Sentiment scores are derived from analysis of mentions in social media, news articles, blogs, forums, and reviews.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Trend Indicators</h4>
                  <p className="text-sm text-muted-foreground">
                    When viewing trend data, areas with improving sentiment will show with blue outlines, while declining sentiment will show with orange outlines.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Top Neighborhoods</CardTitle>
              <CardDescription>Highest and lowest sentiment areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">TOP POSITIVE SENTIMENT</h4>
                  <ol className="space-y-2">
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Grandview North</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Very Positive</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Yakima West</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Positive</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Grandview Downtown</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Positive</span>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">IMPROVEMENT NEEDED</h4>
                  <ol className="space-y-2">
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Sunnyside South</span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Negative</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Grandview Industrial</span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Negative</span>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SentimentMapPage;