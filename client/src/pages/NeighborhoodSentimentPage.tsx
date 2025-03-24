/**
 * Neighborhood Sentiment Analysis Page
 * 
 * This page displays detailed sentiment analysis for neighborhoods,
 * showing sentiment scores across different topics, trends over time,
 * and sentiment mentions from various sources.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NeighborhoodSentimentWidget from '@/components/sentiment/NeighborhoodSentimentWidget';
import neighborhoodSentimentService from '@/services/neighborhood-sentiment.service';

const NeighborhoodSentimentPage = () => {
  // State
  const [selectedCity, setSelectedCity] = useState<string>('Richland');
  const [selectedState, setSelectedState] = useState<string>('WA');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [neighborhood1, setNeighborhood1] = useState<string>('');
  const [neighborhood2, setNeighborhood2] = useState<string>('');

  // Get neighborhoods for the selected city
  const { data: neighborhoods = [] } = useQuery({ 
    queryKey: ['neighborhoods', selectedCity], 
    queryFn: () => neighborhoodSentimentService.getNeighborhoodsForCity(selectedCity),
    enabled: !!selectedCity
  });

  // Get city sentiment data
  const { data: citySentiments = [], isLoading } = useQuery({
    queryKey: ['citySentiments', selectedCity, selectedState],
    queryFn: () => neighborhoodSentimentService.getCitySentiments(selectedCity, selectedState),
    enabled: !!selectedCity && !!selectedState
  });

  // Get comparison data
  const { data: comparisonData, isLoading: isComparisonLoading } = useQuery({
    queryKey: ['comparison', neighborhood1, neighborhood2, selectedCity],
    queryFn: () => neighborhoodSentimentService.compareSentiment(
      neighborhood1,
      neighborhood2,
      selectedCity
    ),
    enabled: compareMode && !!neighborhood1 && !!neighborhood2
  });

  // Handle city change
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    
    // Reset neighborhoods when city changes
    setNeighborhood1('');
    setNeighborhood2('');
  };

  // Handle comparison mode toggle
  const handleCompareToggle = () => {
    setCompareMode(!compareMode);
    
    // Auto-select first two neighborhoods if available
    if (!compareMode && neighborhoods.length >= 2 && !neighborhood1 && !neighborhood2) {
      setNeighborhood1(neighborhoods[0]);
      setNeighborhood2(neighborhoods[1]);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Neighborhood Sentiment Analysis</h1>
        <p className="text-muted-foreground">
          Analyze and compare sentiment data across neighborhoods
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Card className="w-full md:w-64">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Refine your analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select
                value={selectedCity}
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Richland">Richland</SelectItem>
                  <SelectItem value="Grandview">Grandview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select
                value={selectedState}
                onValueChange={setSelectedState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WA">Washington</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={compareMode ? "default" : "outline"}
              className="w-full mt-2"
              onClick={handleCompareToggle}
            >
              {compareMode ? "Comparing Neighborhoods" : "Compare Neighborhoods"}
            </Button>

            {compareMode && (
              <div className="space-y-3 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Neighborhood</label>
                  <Select
                    value={neighborhood1}
                    onValueChange={setNeighborhood1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select neighborhood" />
                    </SelectTrigger>
                    <SelectContent>
                      {neighborhoods.map(neighborhood => (
                        <SelectItem 
                          key={neighborhood} 
                          value={neighborhood}
                          disabled={neighborhood === neighborhood2}
                        >
                          {neighborhood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Second Neighborhood</label>
                  <Select
                    value={neighborhood2}
                    onValueChange={setNeighborhood2}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select neighborhood" />
                    </SelectTrigger>
                    <SelectContent>
                      {neighborhoods.map(neighborhood => (
                        <SelectItem 
                          key={neighborhood} 
                          value={neighborhood}
                          disabled={neighborhood === neighborhood1}
                        >
                          {neighborhood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex-1">
          {!compareMode ? (
            <div className="space-y-6">
              <Tabs defaultValue="individual">
                <TabsList className="mb-4">
                  <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
                  <TabsTrigger value="overview">City Overview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="individual" className="space-y-4">
                  <div className="grid grid-cols-1 gap-6">
                    {!isLoading && neighborhoods.length > 0 && (
                      <NeighborhoodSentimentWidget 
                        neighborhoodName={neighborhoods[0]} 
                        city={selectedCity}
                        state={selectedState}
                      />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {citySentiments.map(sentiment => (
                      <NeighborhoodSentimentWidget 
                        key={sentiment.neighborhoodId}
                        neighborhoodName={sentiment.neighborhoodName}
                        city={sentiment.city}
                        state={sentiment.state}
                        compact={true}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Neighborhood Comparison</CardTitle>
                <CardDescription>
                  Compare sentiment between {neighborhood1} and {neighborhood2}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <NeighborhoodSentimentWidget 
                        neighborhoodName={neighborhood1} 
                        city={selectedCity}
                        state={selectedState}
                        compact={true}
                      />
                      <NeighborhoodSentimentWidget 
                        neighborhoodName={neighborhood2} 
                        city={selectedCity}
                        state={selectedState}
                        compact={true}
                      />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Detailed Comparison</h3>
                      <div className="space-y-4">
                        {Object.entries(comparisonData.comparison).map(([topic, data]) => (
                          <div key={topic} className="flex items-center justify-between py-2 border-b">
                            <div>
                              <span className="font-medium">{topic.replace('_', ' ')}</span>
                              <div className="text-sm text-muted-foreground">
                                Winner: {data.winner === 'tie' ? 'Tie' : data.winner}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">
                                Difference: {data.difference.toFixed(1)} points
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {isComparisonLoading 
                        ? "Loading comparison data..." 
                        : "Select two neighborhoods to compare sentiment data"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodSentimentPage;