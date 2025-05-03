/**
 * Valuation Summary Page
 * 
 * This page displays a summary of the property valuation with AI agent insights.
 * It integrates the AgentFeedPanel for transparent AI decision-making.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { AgentFeedPanel } from '@/components/terrafusion';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  BarChart, 
  Home as HomeIcon,
  DollarSign,
  Building,
  Scale,
  PieChart,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  CheckCircle,
  Undo
} from 'lucide-react';

// Define the property valuation type
interface PropertyValuation {
  id: string;
  propertyId: string;
  parcelId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  valuationDate: string;
  estimatedValue: number;
  confidenceScore: number;
  valueRange: [number, number];
  approaches: {
    salesComparison?: {
      value: number;
      adjustedComps: Array<{
        address: string;
        salePrice: number;
        adjustedPrice: number;
        netAdjustment: number;
        dateOfSale: string;
      }>;
      weight?: number;
    };
    costApproach?: {
      value: number;
      replacementCost: number;
      depreciation: number;
      landValue: number;
      weight?: number;
    };
    incomeApproach?: {
      value: number;
      monthlyRent: number;
      grossRentMultiplier: number;
      capRate: number;
      noi: number;
      weight?: number;
    };
  };
  comparableProperties?: string[];
  adjustmentsApplied?: Record<string, number>;
  modelId?: string;
}

// Sample agent events for demonstration
const sampleAgentEvents = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    agentId: 'valuationAgent',
    type: 'ValueCalculated',
    title: 'Sales Comparison Approach',
    description: 'Calculated value using 5 comparable properties with adjustments for location, condition, and size.',
    value: '$355,000',
    confidence: 92,
    trigger: 'ai'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    agentId: 'compsAgent',
    type: 'CompSelected',
    title: 'Comparable Selected',
    description: '123 Maple St selected as comparable based on proximity, similarity, and recent sale date.',
    fieldId: 'comparables',
    fieldName: 'Comparable Properties',
    trigger: 'ai'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    agentId: 'forecastAgent',
    type: 'ValueCalculated',
    title: 'Income Approach',
    description: 'Calculated income approach value using market rents and current cap rates.',
    value: '$340,000',
    confidence: 88,
    trigger: 'ai'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    agentId: 'valuationAgent',
    type: 'SHAP_ANALYSIS',
    title: 'Key Value Factors',
    description: 'SHAP analysis identified key factors influencing the valuation.',
    shapValues: {
      'Location': 0.42,
      'Square Footage': 0.24,
      'Condition': 0.18,
      'Age': -0.12,
      'Bathrooms': 0.08
    },
    trigger: 'ai'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    agentId: 'valuationAgent',
    type: 'ValueUpdated',
    title: 'Final Value Updated',
    description: 'Final value opinion modified based on human expertise.',
    fieldId: 'finalValueOpinion',
    fieldName: 'Final Value Opinion',
    previousValue: '$345,000',
    value: '$350,000',
    reason: 'Recent renovations not fully captured in comparable data',
    trigger: 'human'
  }
];

const ValuationSummaryPage = () => {
  // Get the valuation ID from the URL
  const [, params] = useRoute<{ id: string }>('/valuation/:id');
  const valuationId = params?.id || '';
  
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [agentEvents, setAgentEvents] = useState(sampleAgentEvents);
  
  // Fetch the valuation data
  const { data: valuation, isLoading, error } = useQuery<PropertyValuation>({
    queryKey: ['/api/valuations', valuationId],
    enabled: !!valuationId,
    retry: 1
  });
  
  // Handler for highlighting fields from agent events
  const handleAgentHighlight = (event: any) => {
    setHighlightedField(event.fieldId);
    
    // Auto-clear the highlight after 3 seconds
    setTimeout(() => {
      setHighlightedField(null);
    }, 3000);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (isLoading) {
    return (
      <Layout title="Loading Valuation">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[600px] md:col-span-2" />
            <Skeleton className="h-[600px]" />
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !valuation) {
    return (
      <Layout title="Valuation Error">
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load valuation details. The valuation ID may be invalid or there was a server error.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout 
      title="Valuation Summary" 
      subtitle={valuation.address}
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Valuation Overview Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-normal text-xs">
                Parcel ID: {valuation.parcelId}
              </Badge>
              <Badge variant="secondary" className="font-normal text-xs">
                {valuation.propertyType}
              </Badge>
              <Badge variant="outline" className="font-normal text-xs">
                {new Date(valuation.valuationDate).toLocaleDateString()}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {valuation.city}, {valuation.state} {valuation.zipCode}
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Export Report
            </Button>
            <Button variant="default" size="sm">
              <ChevronRight className="h-4 w-4 mr-1" />
              View Property
            </Button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Valuation Details - Left and Middle */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <Calculator className="mr-2 h-5 w-5 text-primary" />
                    Estimated Value
                  </CardTitle>
                  <Badge variant={valuation.confidenceScore > 90 ? "default" : "secondary"} className="font-normal">
                    {valuation.confidenceScore}% Confidence
                  </Badge>
                </div>
                <CardDescription>
                  AI-derived value based on multiple appraisal approaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Market Value</p>
                    <p className="text-4xl font-bold">{formatCurrency(valuation.estimatedValue)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Range: {formatCurrency(valuation.valueRange[0])} - {formatCurrency(valuation.valueRange[1])}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center">
                    <Button variant="outline" size="sm" className="h-8 mr-2">
                      <Undo className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                    <Button size="sm" className="h-8">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accept Valuation
                    </Button>
                  </div>
                </div>
                
                <Tabs defaultValue="approaches" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="approaches">Valuation Approaches</TabsTrigger>
                    <TabsTrigger value="factors">Value Factors</TabsTrigger>
                    <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="approaches" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {valuation.approaches.salesComparison && (
                        <Card className="bg-muted/50">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base flex items-center">
                              <HomeIcon className="h-4 w-4 mr-1.5 text-primary" />
                              Sales Comparison
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0 px-4 pb-4">
                            <p className="text-2xl font-semibold">
                              {formatCurrency(valuation.approaches.salesComparison.value)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Based on {valuation.approaches.salesComparison.adjustedComps.length} comparable properties
                            </p>
                            <p className="text-xs mt-2">
                              Weight: {valuation.approaches.salesComparison.weight || 70}%
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {valuation.approaches.costApproach && (
                        <Card className="bg-muted/50">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base flex items-center">
                              <Building className="h-4 w-4 mr-1.5 text-primary" />
                              Cost Approach
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0 px-4 pb-4">
                            <p className="text-2xl font-semibold">
                              {formatCurrency(valuation.approaches.costApproach.value)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Replacement cost less depreciation
                            </p>
                            <p className="text-xs mt-2">
                              Weight: {valuation.approaches.costApproach.weight || 15}%
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {valuation.approaches.incomeApproach && (
                        <Card className="bg-muted/50">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-base flex items-center">
                              <DollarSign className="h-4 w-4 mr-1.5 text-primary" />
                              Income Approach
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0 px-4 pb-4">
                            <p className="text-2xl font-semibold">
                              {formatCurrency(valuation.approaches.incomeApproach.value)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Cap Rate: {valuation.approaches.incomeApproach.capRate}%
                            </p>
                            <p className="text-xs mt-2">
                              Weight: {valuation.approaches.incomeApproach.weight || 15}%
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="factors" className="mt-4">
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p>Key factors contributing to this valuation:</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Location Quality</span>
                          <Badge variant="outline" className="font-normal">+12%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Square Footage</span>
                          <Badge variant="outline" className="font-normal">+8%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Property Condition</span>
                          <Badge variant="outline" className="font-normal">+6%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Age of Property</span>
                          <Badge variant="outline" className="font-normal text-destructive">-4%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Market Trends</span>
                          <Badge variant="outline" className="font-normal">+3%</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-4">
                        Percentages indicate relative impact on valuation compared to market average.
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="adjustments" className="mt-4">
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p>Adjustments applied in the sales comparison approach:</p>
                      </div>
                      {valuation.approaches.salesComparison?.adjustedComps && (
                        <div className="text-sm">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left font-medium py-2">Comparable</th>
                                <th className="text-right font-medium py-2">Sale Price</th>
                                <th className="text-right font-medium py-2">Net Adjustment</th>
                                <th className="text-right font-medium py-2">Adjusted Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {valuation.approaches.salesComparison.adjustedComps.map((comp, index) => (
                                <tr key={index} className="border-b border-muted">
                                  <td className="py-2">{comp.address}</td>
                                  <td className="text-right py-2">{formatCurrency(comp.salePrice)}</td>
                                  <td className="text-right py-2">
                                    {comp.netAdjustment > 0 ? '+' : ''}{(comp.netAdjustment * 100).toFixed(1)}%
                                  </td>
                                  <td className="text-right py-2">{formatCurrency(comp.adjustedPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-primary" />
                  Valuation Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of the property valuation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="comparables">Comparables</TabsTrigger>
                    <TabsTrigger value="market">Market Data</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="mt-4 space-y-4">
                    <p>
                      This valuation was generated using multiple appraisal approaches with emphasis on the sales comparison approach. The final estimate reflects adjustments for the property's condition, location, and current market trends.
                    </p>
                    
                    <div className="text-sm space-y-3">
                      <div>
                        <h4 className="font-medium">Key Insights:</h4>
                        <ul className="mt-1 space-y-1 list-disc list-inside">
                          <li>Property value is {valuation.confidenceScore > 85 ? 'well' : 'moderately'} supported by comparable sales data</li>
                          <li>Market trends in this area show {valuation.confidenceScore > 90 ? 'strong stability' : 'some volatility'}</li>
                          <li>The property's location contributes positively to its value</li>
                          <li>The age and condition factors align with neighborhood averages</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Confidence Assessment:</h4>
                        <p className="mt-1">
                          The {valuation.confidenceScore}% confidence score indicates that this valuation has a {valuation.confidenceScore > 90 ? 'high' : 'good'} level of reliability based on available data and market conditions.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="comparables" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      The comparable properties tab shows detailed information about the five most similar properties used in the sales comparison approach.
                    </p>
                    <p className="text-center py-4 text-muted-foreground">
                      Detailed comparable information will be available in the expanded view.
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="market" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      The market data tab provides information about current trends and conditions in the local real estate market.
                    </p>
                    <p className="text-center py-4 text-muted-foreground">
                      Market data visualization will be available in the expanded view.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Agent Feed Panel - Right Side */}
          <div>
            <AgentFeedPanel 
              events={agentEvents}
              onHighlight={handleAgentHighlight}
              readOnly={false}
              position="right"
              parcelId={valuation.parcelId}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ValuationSummaryPage;