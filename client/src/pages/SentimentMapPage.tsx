/**
 * Sentiment Map Page
 * 
 * This page displays a geographical map visualization of neighborhood sentiment,
 * showing sentiment levels across different areas with color-coded overlays.
 */

import React, { useState } from 'react';
import { Map } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import AppNavigation from '@/components/layout/AppNavigation';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from '@/components/mapping/MapComponents';
import { regionData } from '@/data/mock/regions';

// Helper component for Top Neighborhoods section
const TopNeighborhoodCard = ({ rank, name, score, change, description }: { 
  rank: number; 
  name: string; 
  score: number;
  change: number;
  description: string;
}) => {
  return (
    <div className="flex items-start space-x-2 py-3 border-b last:border-b-0">
      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-semibold">
        {rank}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{name}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-right">
        <div className="font-semibold">{score.toFixed(1)}</div>
        <div className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

// Helper function to get color for map regions
const getColorForFeature = (feature: any, metric: string) => {
  // This would normally use the feature properties to determine color based on sentiment scores
  // For this demo, we'll use a simple random value
  const value = feature.properties.sentimentScore || Math.random() * 10;
  
  if (value < 4) return '#FCA5A5'; // red-200
  if (value < 6) return '#FEF08A'; // yellow-200
  if (value < 7.5) return '#BBF7D0'; // green-200
  if (value < 9) return '#4ADE80';  // green-400
  return '#16A34A';  // green-600
};

function SentimentMapPage() {
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('current');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation currentPath="/sentiment-map" />
      <div className="container mx-auto py-6 px-4 flex-1">
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
              Geographic visualization of sentiment analysis across neighborhoods
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Select
              value={selectedMetric}
              onValueChange={setSelectedMetric}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Sentiment</SelectItem>
                <SelectItem value="safety">Safety Perception</SelectItem>
                <SelectItem value="schools">School Quality</SelectItem>
                <SelectItem value="amenities">Amenities</SelectItem>
                <SelectItem value="value">Value for Price</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current (Last 30 days)</SelectItem>
                <SelectItem value="q1">Past Quarter</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="1y">1 Year Trend</SelectItem>
                <SelectItem value="3y">3 Year Trend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main map area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sentiment Heatmap</CardTitle>
              <CardDescription>
                Showing {selectedMetric === 'overall' ? 'overall sentiment' : selectedMetric} data for Grandview area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-md border">
                <MapContainer center={[46.2276, -119.1004]} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <GeoJSON
                    data={regionData}
                    style={(feature) => ({
                      fillColor: getColorForFeature(feature, selectedMetric),
                      weight: 1,
                      opacity: 1,
                      color: 'white',
                      dashArray: '3',
                      fillOpacity: 0.7
                    })}
                  />
                </MapContainer>
              </div>
              
              <div className="flex justify-center mt-4">
                <div className="flex items-center space-x-2">
                  <div className="text-sm">Low</div>
                  <div className="flex">
                    <div className="w-6 h-4 bg-red-200"></div>
                    <div className="w-6 h-4 bg-yellow-200"></div>
                    <div className="w-6 h-4 bg-green-200"></div>
                    <div className="w-6 h-4 bg-green-400"></div>
                    <div className="w-6 h-4 bg-green-600"></div>
                  </div>
                  <div className="text-sm">High</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sidebar with Top Neighborhoods */}
          <Card>
            <CardHeader>
              <CardTitle>Top Neighborhoods</CardTitle>
              <CardDescription>
                Highest rated areas based on resident sentiment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="residential">
                <TabsList className="mb-4">
                  <TabsTrigger value="residential">Residential</TabsTrigger>
                  <TabsTrigger value="schools">Schools</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                </TabsList>
                
                <TabsContent value="residential">
                  <div className="space-y-0">
                    <TopNeighborhoodCard 
                      rank={1}
                      name="Eastside Heights"
                      score={9.2}
                      change={2.3}
                      description="Quiet streets, well-maintained properties"
                    />
                    <TopNeighborhoodCard 
                      rank={2}
                      name="Westlake Village"
                      score={9.0}
                      change={1.7}
                      description="Family-friendly with great parks"
                    />
                    <TopNeighborhoodCard 
                      rank={3}
                      name="Orchard Estates"
                      score={8.9}
                      change={-0.5}
                      description="New developments with modern amenities"
                    />
                    <TopNeighborhoodCard 
                      rank={4}
                      name="Riverview"
                      score={8.7}
                      change={1.2}
                      description="Scenic views and nature trails"
                    />
                    <TopNeighborhoodCard 
                      rank={5}
                      name="Downtown Core"
                      score={8.5}
                      change={3.1}
                      description="Renewed urban area with lofts"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="schools">
                  <div className="space-y-0">
                    <TopNeighborhoodCard 
                      rank={1}
                      name="Academic District"
                      score={9.4}
                      change={0.8}
                      description="Top-rated public and private schools"
                    />
                    <TopNeighborhoodCard 
                      rank={2}
                      name="Westlake Village"
                      score={9.2}
                      change={2.1}
                      description="Strong elementary and middle schools"
                    />
                    <TopNeighborhoodCard 
                      rank={3}
                      name="Northside Commons"
                      score={8.8}
                      change={1.5}
                      description="Excellent extracurricular programs"
                    />
                    <TopNeighborhoodCard 
                      rank={4}
                      name="Parkside"
                      score={8.6}
                      change={0.3}
                      description="Good special needs programs"
                    />
                    <TopNeighborhoodCard 
                      rank={5}
                      name="Eastside Heights"
                      score={8.4}
                      change={-0.2}
                      description="Strong community involvement"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="amenities">
                  <div className="space-y-0">
                    <TopNeighborhoodCard 
                      rank={1}
                      name="Downtown Core"
                      score={9.5}
                      change={4.2}
                      description="Restaurants, shopping, and entertainment"
                    />
                    <TopNeighborhoodCard 
                      rank={2}
                      name="Marketplace District"
                      score={9.3}
                      change={2.8}
                      description="New shops and dining options"
                    />
                    <TopNeighborhoodCard 
                      rank={3}
                      name="Riverview"
                      score={8.7}
                      change={1.1}
                      description="Parks and outdoor recreation"
                    />
                    <TopNeighborhoodCard 
                      rank={4}
                      name="University Heights"
                      score={8.5}
                      change={0.7}
                      description="Diverse cultural offerings"
                    />
                    <TopNeighborhoodCard 
                      rank={5}
                      name="Garden District"
                      score={8.3}
                      change={-0.4}
                      description="Community spaces and farmers markets"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SentimentMapPage;