/**
 * Sentiment Trend Page
 * 
 * This page shows historical sentiment data and predicted future trends
 * for neighborhoods. It includes interactive visualizations, filtering options,
 * and explanations of the prediction methodology.
 */

import { useState } from 'react';
import { Link } from 'wouter';


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  Settings, 
  Info, 
  ChevronRight, 
  Home
} from 'lucide-react';

import SentimentTrendGraph from '@/components/sentiment/SentimentTrendGraph';
import NeighborhoodSentimentWidget from '@/components/sentiment/NeighborhoodSentimentWidget';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import neighborhoodSentimentService, { SentimentTopic } from '@/services/neighborhood-sentiment.service';

/**
 * Sentiment Trend Page Component
 */
export default function SentimentTrendPage() {
  // State variables
  const [city, setCity] = useState<string>('Richland');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>(undefined);
  const [selectedTopic, setSelectedTopic] = useState<SentimentTopic | 'overall'>('overall');
  const [neighborhoods, setNeighborhoods] = useState<string[]>(
    neighborhoodSentimentService.getNeighborhoodsForCity(city)
  );

  // Handle city change
  const handleCityChange = (city: string) => {
    setCity(city);
    const cityNeighborhoods = neighborhoodSentimentService.getNeighborhoodsForCity(city);
    setNeighborhoods(cityNeighborhoods);
    setSelectedNeighborhood(cityNeighborhoods[0]);
  };

  // Render the page
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 mr-3 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Neighborhood Sentiment Trends</h1>
            <p className="text-muted-foreground">View historical sentiment data and AI-powered predictions for neighborhoods</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main controls area */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Select area and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select 
                value={city} 
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Richland">Richland, WA</SelectItem>
                  <SelectItem value="Grandview">Grandview, WA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Neighborhood</label>
              <Select 
                value={selectedNeighborhood} 
                onValueChange={setSelectedNeighborhood}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map(neighborhood => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sentiment Topic</label>
              <Select 
                value={selectedTopic} 
                onValueChange={(value) => setSelectedTopic(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Score</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="schools">Schools</SelectItem>
                  <SelectItem value="amenities">Amenities</SelectItem>
                  <SelectItem value="affordability">Affordability</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="market_trend">Market Trend</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium">Quick Links</h3>
              <div className="flex flex-col space-y-1">
                <Link href="/dashboard">
                  <Button variant="ghost" className="justify-start px-2 w-full" size="sm">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Market Dashboard</span>
                  </Button>
                </Link>
                <Link href="/sentiment-map">
                  <Button variant="ghost" className="justify-start px-2 w-full" size="sm">
                    <Map className="mr-2 h-4 w-4" />
                    <span>Sentiment Heat Map</span>
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="justify-start px-2 w-full" size="sm">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content area */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* Current sentiment */}
          {selectedNeighborhood && (
            <NeighborhoodSentimentWidget 
              neighborhoodName={selectedNeighborhood}
              city={city}
              className="col-span-12"
              compact={true}
              selectedTopic={selectedTopic}
            />
          )}

          {/* Sentiment trend graph */}
          <Tabs defaultValue="trend" className="w-full">
            <TabsList>
              <TabsTrigger value="trend">Historical & Prediction</TabsTrigger>
              <TabsTrigger value="analysis">Trend Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="mt-4">
              {selectedNeighborhood && (
                <SentimentTrendGraph 
                  neighborhoodName={selectedNeighborhood}
                  city={city}
                  height={450}
                />
              )}
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Trend Analysis Methodology
                  </CardTitle>
                  <CardDescription>
                    How we generate sentiment predictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>
                    Our sentiment trend predictions use a combination of machine learning models, historical data patterns, 
                    and market indicators to forecast future neighborhood sentiment with high accuracy.
                  </p>
                  
                  <h3 className="text-base font-medium mt-4">How It Works</h3>
                  <ol className="pl-5 space-y-2">
                    <li>
                      <strong>Historical Data Collection:</strong> We analyze years of sentiment data from multiple sources 
                      including property listings, social media, news articles, and resident surveys.
                    </li>
                    <li>
                      <strong>Pattern Recognition:</strong> Our AI models identify seasonal patterns, long-term trends, 
                      and correlations with economic and development indicators.
                    </li>
                    <li>
                      <strong>Regression Analysis:</strong> We apply advanced statistical methods to extrapolate trends 
                      while accounting for uncertainty over time.
                    </li>
                    <li>
                      <strong>Confidence Intervals:</strong> The shaded area represents the prediction confidence range, 
                      which widens with time to reflect increasing uncertainty.
                    </li>
                  </ol>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Note: All predictions should be considered alongside other market factors and 
                    expert insights. Future sentiment can be affected by unforeseen development 
                    projects, policy changes, and economic shifts.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Similar neighborhoods */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Similar Neighborhoods</CardTitle>
              <CardDescription>
                Other areas with similar sentiment trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {neighborhoods.filter(n => n !== selectedNeighborhood).slice(0, 3).map(neighborhood => (
                  <Button 
                    key={neighborhood}
                    variant="outline" 
                    className="justify-between h-auto py-3"
                    onClick={() => setSelectedNeighborhood(neighborhood)}
                  >
                    <span>{neighborhood}</span>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}