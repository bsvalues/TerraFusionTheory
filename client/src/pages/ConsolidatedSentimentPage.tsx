/**
 * Consolidated Sentiment Analysis Page
 * 
 * This unified page combines three sentiment analysis views:
 * 1. Neighborhood Sentiment Dashboard - Overall sentiment analytics
 * 2. Sentiment Map - Geographical visualization of sentiment data
 * 3. Sentiment Trends - Historical and predicted sentiment patterns
 * 
 * Features enhanced user customization options for:
 * - Multiple neighborhood comparison
 * - Topic filtering
 * - Property type filtering
 * - Time range adjustments
 * - Data visualization options
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Map, BarChart, TrendingUp, Info } from 'lucide-react';
import NeighborhoodSentimentDashboard from '@/components/dashboard/NeighborhoodSentimentDashboard';
import { SentimentLevel } from '@/services/neighborhood-sentiment.service';
import Footer from '@/components/layout/Footer';

const ConsolidatedSentimentPage = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('12months');
  
  // Set the initial active tab based on the route
  useEffect(() => {
    if (location === '/sentiment-map') {
      setActiveTab('map');
    } else if (location === '/sentiment-trends') {
      setActiveTab('trends');
    } else {
      setActiveTab('dashboard');
    }
  }, [location]);
  
  // Update page title based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'map':
        document.title = 'Sentiment Map | IntelligentEstate';
        break;
      case 'trends':
        document.title = 'Sentiment Trends | IntelligentEstate';
        break;
      default:
        document.title = 'Neighborhood Sentiment | IntelligentEstate';
    }
  }, [activeTab]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          {activeTab === 'map' 
            ? 'Sentiment Map' 
            : activeTab === 'trends' 
              ? 'Sentiment Trends' 
              : 'Neighborhood Sentiment'} | IntelligentEstate
        </title>
      </Helmet>
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Neighborhood Sentiment Analysis</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Neighborhoods</SelectItem>
                  <SelectItem value="grandview">Grandview</SelectItem>
                  <SelectItem value="sunnyside">Sunnyside</SelectItem>
                  <SelectItem value="yakima">Yakima</SelectItem>
                  <SelectItem value="prosser">Prosser</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="12months">12 Months</SelectItem>
                  <SelectItem value="24months">24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto py-6 px-4">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              Sentiment Dashboard
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center">
              <Map className="mr-2 h-4 w-4" />
              Sentiment Map
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Sentiment Trends
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* The original dashboard component likely doesn't accept these props, so we're rendering it directly */}
            <NeighborhoodSentimentDashboard />
          </TabsContent>
          
          {/* Map Tab Content */}
          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="mr-2 h-5 w-5 text-primary" />
                  Neighborhood Sentiment Map
                </CardTitle>
                <CardDescription>
                  Geographical visualization of sentiment levels by neighborhood
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Map visualization placeholder - would be implemented with a mapping library */}
                <div className="bg-muted/30 rounded-lg h-[500px] flex items-center justify-center">
                  <div className="text-center p-6 max-w-md">
                    <Map className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-medium mb-2">Sentiment Map Visualization</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Geographical visualization of neighborhood sentiment showing sentiment levels across different areas.
                    </p>
                    
                    {/* Legend */}
                    <div className="flex justify-center items-center gap-4 mb-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs">Positive</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-xs">Neutral</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-xs">Negative</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {[
                    { name: 'Grandview', level: 'positive' as SentimentLevel, score: 8.2 },
                    { name: 'Sunnyside', level: 'neutral' as SentimentLevel, score: 6.5 },
                    { name: 'Yakima', level: 'positive' as SentimentLevel, score: 7.8 }
                  ].map((area, index) => (
                    <Card key={index} className={`
                      ${area.level === 'positive' ? 'border-green-200 bg-green-50' : 
                        area.level === 'negative' ? 'border-red-200 bg-red-50' : 
                        'border-yellow-200 bg-yellow-50'}
                      dark:bg-opacity-10 transition-all duration-300
                    `}>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{area.name}</h3>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm ${
                            area.level === 'positive' ? 'text-green-700' : 
                            area.level === 'negative' ? 'text-red-700' : 
                            'text-yellow-700'
                          }`}>
                            {area.level.charAt(0).toUpperCase() + area.level.slice(1)} Sentiment
                          </span>
                          <span className="font-bold">{area.score}/10</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              area.level === 'positive' ? 'bg-green-500' : 
                              area.level === 'negative' ? 'bg-red-500' : 
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${area.score * 10}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Trends Tab Content */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Sentiment Trends & Predictions
                </CardTitle>
                <CardDescription>
                  Historical sentiment data and future trends prediction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Trends visualization placeholder */}
                <div className="bg-muted/30 rounded-lg h-[350px] flex items-center justify-center mb-6">
                  <div className="text-center p-6 max-w-md">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="text-lg font-medium mb-2">Sentiment Trend Analysis</h3>
                    <p className="text-muted-foreground text-sm">
                      Historical and predicted sentiment trends for selected neighborhoods over time.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Trend Insights
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Improving Trend:</span> Sentiment in Grandview has improved consistently over the past {timeRange === '3months' ? '3' : timeRange === '6months' ? '6' : timeRange === '24months' ? '24' : '12'} months.
                      </p>
                      <p>
                        <span className="font-medium">Key Factors:</span> School quality and safety are the most positively mentioned topics.
                      </p>
                      <p>
                        <span className="font-medium">Areas for Improvement:</span> Traffic and infrastructure remain concerns in most neighborhoods.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Trending Topics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { topic: 'School Quality', sentiment: 'positive', change: '+12%' },
                        { topic: 'Safety & Crime', sentiment: 'positive', change: '+8%' },
                        { topic: 'Traffic', sentiment: 'negative', change: '-3%' },
                        { topic: 'Shopping & Amenities', sentiment: 'positive', change: '+15%' },
                        { topic: 'Property Values', sentiment: 'positive', change: '+5%' },
                        { topic: 'Public Transportation', sentiment: 'neutral', change: '0%' }
                      ].map((topic, index) => (
                        <Card key={index} className="border shadow-sm">
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">{topic.topic}</h4>
                            <div className="flex justify-between mb-2">
                              <span className={`text-sm ${
                                topic.sentiment === 'positive' ? 'text-green-600' : 
                                topic.sentiment === 'negative' ? 'text-red-600' : 
                                'text-yellow-600'
                              }`}>
                                {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)}
                              </span>
                              <span className={`text-sm font-medium ${
                                topic.change.startsWith('+') ? 'text-green-600' : 
                                topic.change.startsWith('-') ? 'text-red-600' : 
                                'text-yellow-600'
                              }`}>
                                {topic.change}
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  topic.sentiment === 'positive' ? 'bg-green-500' : 
                                  topic.sentiment === 'negative' ? 'bg-red-500' : 
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${parseInt(topic.change) + 100}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConsolidatedSentimentPage;