/**
 * Sentiment Map Page
 * 
 * This page displays an interactive heat map showing neighborhood sentiment
 * data with color-coded circles for different sentiment levels.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Info, Map as MapIcon, BarChart3, MessageSquare } from 'lucide-react';
import SentimentHeatMap from '@/components/mapping/SentimentHeatMap';
import NeighborhoodSentimentWidget from '@/components/sentiment/NeighborhoodSentimentWidget';

const SentimentMapPage = () => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string>('Richland');
  
  const handleNeighborhoodSelect = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neighborhood Sentiment Map</h1>
          <p className="text-muted-foreground">
            Interactive visualization of sentiment analysis across neighborhoods
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Info className="mr-2 h-4 w-4" />
            About This Map
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analysis
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SentimentHeatMap 
            city={selectedCity}
            state="WA"
            height={600}
            onSelectNeighborhood={handleNeighborhoodSelect}
          />
        </div>
        
        <div className="flex flex-col gap-6">
          {selectedNeighborhood ? (
            <NeighborhoodSentimentWidget 
              neighborhoodName={selectedNeighborhood} 
              city={selectedCity}
              state="WA"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapIcon className="mr-2 h-5 w-5 text-primary" />
                  Sentiment Map Guide
                </CardTitle>
                <CardDescription>
                  How to use the interactive sentiment map
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Understanding the Map</h4>
                  <p className="text-sm text-muted-foreground">
                    Each circle represents a neighborhood. The color indicates the sentiment level 
                    (green for excellent, blue for good, yellow for average, orange for below average, red for poor).
                    The size of the circle corresponds to the score - larger circles indicate higher scores.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Interaction Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                      <span>Click on any neighborhood circle to view detailed sentiment data.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
                      <span>Use the topic selector to view sentiment data for specific aspects like safety, schools, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
                      <span>Zoom and pan the map to explore different areas.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4">
                  <Button onClick={() => setSelectedNeighborhood('Columbia Point')} className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sentiment Analysis Insights</CardTitle>
              <CardDescription>
                Trends and patterns from neighborhood data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Highest Rated Areas</h4>
                <div className="space-y-2">
                  <div className="text-sm flex justify-between">
                    <span>Columbia Point</span>
                    <span className="font-medium text-green-600">85/100</span>
                  </div>
                  <div className="text-sm flex justify-between">
                    <span>Meadow Springs</span>
                    <span className="font-medium text-green-600">82/100</span>
                  </div>
                  <div className="text-sm flex justify-between">
                    <span>South Richland</span>
                    <span className="font-medium text-blue-600">78/100</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Trending Topics</h4>
                <div className="space-y-2">
                  <div className="text-sm flex justify-between items-center">
                    <span>Safety</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      +12% Improvement
                    </span>
                  </div>
                  <div className="text-sm flex justify-between items-center">
                    <span>Development</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      +8% Improvement
                    </span>
                  </div>
                  <div className="text-sm flex justify-between items-center">
                    <span>Affordability</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      -4% Decline
                    </span>
                  </div>
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