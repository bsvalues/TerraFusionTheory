import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle,
  FileBarChart,
  BarChart2,
  PieChart,
  Upload,
  DownloadCloud,
  Loader2,
  MapPin,
  Filter,
  Building
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Create a mock BarChart component
const BarChartMock = ({ data, xField, yField, title, description }: any) => (
  <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
    <div className="text-center">
      <BarChart2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </div>
);

// Create a mock PieChart component
const PieChartMock = ({ data, valueField, nameField, title, description }: any) => (
  <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
    <div className="text-center">
      <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </div>
);

// Mock MapChart component
const MapChartMock = ({ data, title, description }: any) => (
  <div className="h-[400px] bg-muted rounded-md flex items-center justify-center">
    <div className="text-center">
      <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </div>
);

const formSchema = z.object({
  studyPeriod: z.string().min(1, 'Study period is required'),
  propertyTypes: z.array(z.string()).min(1, 'At least one property type must be selected'),
  ratioType: z.string().min(1, 'Ratio type is required'),
  neighbourhoodGroups: z.array(z.string()).optional(),
  analysisTypes: z.array(z.string()).min(1, 'At least one analysis type must be selected'),
  salesValidation: z.boolean().optional(),
  outliersExclusion: z.boolean().optional(),
  includeVacantLand: z.boolean().optional(),
  confidenceInterval: z.coerce.number().min(1).max(99),
});

type FormValues = z.infer<typeof formSchema>;

interface RatioStudyResult {
  ratioSummary: {
    median: number;
    mean: number;
    weightedMean: number;
    priceRelatedDifferential: number;
    coefficientOfDispersion: number;
    priceRelatedBias: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };
  neighborhoodAnalysis: {
    neighborhoodCode: string;
    neighborhoodName: string;
    saleCount: number;
    medianRatio: number;
    cod: number;
    assessmentLevel: 'Low' | 'Acceptable' | 'High';
  }[];
  propertyTypeAnalysis: {
    propertyType: string;
    saleCount: number;
    medianRatio: number;
    cod: number;
    assessmentLevel: 'Low' | 'Acceptable' | 'High';
  }[];
  priceQuartileAnalysis: {
    quartile: string;
    priceRange: string;
    saleCount: number;
    medianRatio: number;
    cod: number;
  }[];
  trendAnalysis: {
    month: string;
    saleCount: number;
    medianRatio: number;
    averagePrice: number;
  }[];
  ratioDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

const RatioStudyPanel = () => {
  const [activeTab, setActiveTab] = useState('form');
  const [studyResult, setStudyResult] = useState<RatioStudyResult | null>(null);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studyPeriod: 'last-12-months',
      propertyTypes: ['Residential'],
      ratioType: 'assessed-to-sale',
      neighbourhoodGroups: [],
      analysisTypes: ['neighborhood', 'property-type', 'price-quartile'],
      salesValidation: true,
      outliersExclusion: true,
      includeVacantLand: false,
      confidenceInterval: 95,
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      return apiRequest('/api/mass-appraisal/ratio-study', { 
        method: 'POST',
        data: {
          studyParameters: data
        } 
      });
    },
    onSuccess: (data) => {
      setStudyResult(data);
      setActiveTab('results');
      toast({
        title: "Ratio Study Complete",
        description: "The sales ratio study has been completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Study Failed",
        description: error?.message || "Failed to perform ratio study. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  // Mock ratio study results for UI development
  const mockStudyResult: RatioStudyResult = {
    ratioSummary: {
      median: 0.96,
      mean: 0.95,
      weightedMean: 0.93,
      priceRelatedDifferential: 1.02,
      coefficientOfDispersion: 11.5,
      priceRelatedBias: -0.01,
      confidenceInterval: {
        lower: 0.94,
        upper: 0.98
      }
    },
    neighborhoodAnalysis: [
      {
        neighborhoodCode: 'GV-CENTRAL',
        neighborhoodName: 'Central Grandview',
        saleCount: 42,
        medianRatio: 0.97,
        cod: 10.2,
        assessmentLevel: 'Acceptable'
      },
      {
        neighborhoodCode: 'GV-NORTH',
        neighborhoodName: 'North Grandview',
        saleCount: 35,
        medianRatio: 0.94,
        cod: 12.8,
        assessmentLevel: 'Acceptable'
      },
      {
        neighborhoodCode: 'GV-SOUTH',
        neighborhoodName: 'South Grandview',
        saleCount: 38,
        medianRatio: 0.92,
        cod: 14.5,
        assessmentLevel: 'Acceptable'
      },
      {
        neighborhoodCode: 'GV-EAST',
        neighborhoodName: 'East Grandview',
        saleCount: 28,
        medianRatio: 0.89,
        cod: 15.3,
        assessmentLevel: 'Low'
      },
      {
        neighborhoodCode: 'GV-WEST',
        neighborhoodName: 'West Grandview',
        saleCount: 32,
        medianRatio: 1.04,
        cod: 9.8,
        assessmentLevel: 'High'
      }
    ],
    propertyTypeAnalysis: [
      {
        propertyType: 'Residential',
        saleCount: 175,
        medianRatio: 0.96,
        cod: 11.5,
        assessmentLevel: 'Acceptable'
      },
      {
        propertyType: 'Commercial',
        saleCount: 28,
        medianRatio: 0.93,
        cod: 14.2,
        assessmentLevel: 'Acceptable'
      },
      {
        propertyType: 'Multi-Family',
        saleCount: 15,
        medianRatio: 0.91,
        cod: 16.8,
        assessmentLevel: 'Acceptable'
      },
      {
        propertyType: 'Vacant Land',
        saleCount: 10,
        medianRatio: 0.85,
        cod: 22.5,
        assessmentLevel: 'Low'
      }
    ],
    priceQuartileAnalysis: [
      {
        quartile: 'Q1',
        priceRange: '$0 - $250,000',
        saleCount: 56,
        medianRatio: 1.02,
        cod: 13.8
      },
      {
        quartile: 'Q2',
        priceRange: '$250,001 - $400,000',
        saleCount: 68,
        medianRatio: 0.98,
        cod: 11.2
      },
      {
        quartile: 'Q3',
        priceRange: '$400,001 - $600,000',
        saleCount: 49,
        medianRatio: 0.94,
        cod: 10.5
      },
      {
        quartile: 'Q4',
        priceRange: '$600,001+',
        saleCount: 37,
        medianRatio: 0.90,
        cod: 12.4
      }
    ],
    trendAnalysis: [
      { month: 'Jan 2024', saleCount: 18, medianRatio: 0.97, averagePrice: 425000 },
      { month: 'Feb 2024', saleCount: 16, medianRatio: 0.96, averagePrice: 432000 },
      { month: 'Mar 2024', saleCount: 22, medianRatio: 0.96, averagePrice: 438000 },
      { month: 'Apr 2024', saleCount: 24, medianRatio: 0.95, averagePrice: 445000 },
      { month: 'May 2024', saleCount: 28, medianRatio: 0.94, averagePrice: 452000 },
      { month: 'Jun 2024', saleCount: 32, medianRatio: 0.94, averagePrice: 460000 }
    ],
    ratioDistribution: [
      { range: '<0.70', count: 5, percentage: 2.3 },
      { range: '0.70-0.80', count: 12, percentage: 5.5 },
      { range: '0.80-0.90', count: 38, percentage: 17.4 },
      { range: '0.90-1.00', count: 98, percentage: 44.7 },
      { range: '1.00-1.10', count: 45, percentage: 20.5 },
      { range: '1.10-1.20', count: 14, percentage: 6.4 },
      { range: '>1.20', count: 7, percentage: 3.2 }
    ]
  };
  
  // Use the mock result if no real result is available
  const displayResult = studyResult || mockStudyResult;
  
  // Helper for assessment level style
  const getAssessmentLevelStyle = (level: string) => {
    switch (level) {
      case 'Low':
        return { label: 'Low', color: 'bg-orange-100 text-orange-800' };
      case 'Acceptable':
        return { label: 'Acceptable', color: 'bg-green-100 text-green-800' };
      case 'High':
        return { label: 'High', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: level, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Ratio Study</CardTitle>
        <CardDescription>
          Analyze the relationship between assessed values and sales prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="form">
              <Filter className="mr-2 h-4 w-4" />
              Study Parameters
            </TabsTrigger>
            <TabsTrigger value="results">
              <FileBarChart className="mr-2 h-4 w-4" />
              Results Summary
            </TabsTrigger>
            <TabsTrigger value="neighborhood">
              <Building className="mr-2 h-4 w-4" />
              Neighborhood Analysis
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <BarChart2 className="mr-2 h-4 w-4" />
              Ratio Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <FormField
                      control={form.control}
                      name="studyPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Study Period</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select study period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                              <SelectItem value="last-24-months">Last 24 Months</SelectItem>
                              <SelectItem value="current-year">Current Year</SelectItem>
                              <SelectItem value="previous-year">Previous Year</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Time period for sales being analyzed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ratioType"
                      render={({ field }) => (
                        <FormItem className="mt-6">
                          <FormLabel>Ratio Type</FormLabel>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="assessed-to-sale" id="ratio-1" />
                              <FormLabel htmlFor="ratio-1" className="font-normal">Assessed to Sale (A/S)</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sale-to-assessed" id="ratio-2" />
                              <FormLabel htmlFor="ratio-2" className="font-normal">Sale to Assessed (S/A)</FormLabel>
                            </div>
                          </RadioGroup>
                          <FormDescription>
                            Direction of the ratio calculation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confidenceInterval"
                      render={({ field }) => (
                        <FormItem className="mt-6">
                          <FormLabel>Confidence Interval (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Statistical confidence level (typically 95%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="propertyTypes"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Property Types</FormLabel>
                            <FormDescription>
                              Select property types to include in the study
                            </FormDescription>
                          </div>
                          <div className="space-y-2">
                            {['Residential', 'Commercial', 'Multi-Family', 'Industrial', 'Agricultural', 'Vacant Land'].map((type) => (
                              <FormField
                                key={type}
                                control={form.control}
                                name="propertyTypes"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={type}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, type])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== type
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {type}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="analysisTypes"
                      render={() => (
                        <FormItem className="mt-6">
                          <div className="mb-4">
                            <FormLabel>Analysis Types</FormLabel>
                            <FormDescription>
                              Select the types of analyses to perform
                            </FormDescription>
                          </div>
                          <div className="space-y-2">
                            {[
                              { id: 'neighborhood', label: 'Neighborhood Analysis' },
                              { id: 'property-type', label: 'Property Type Analysis' },
                              { id: 'price-quartile', label: 'Price Quartile Analysis' },
                              { id: 'trend', label: 'Time Trend Analysis' },
                              { id: 'spatial', label: 'Spatial Analysis (GIS)' }
                            ].map((type) => (
                              <FormField
                                key={type.id}
                                control={form.control}
                                name="analysisTypes"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={type.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, type.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== type.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {type.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Advanced Options</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="salesValidation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Sales Validation
                            </FormLabel>
                            <FormDescription>
                              Filter out non-arm's length transactions
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="outliersExclusion"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Exclude Outliers
                            </FormLabel>
                            <FormDescription>
                              Remove extreme ratio values
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeVacantLand"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Include Vacant Land
                            </FormLabel>
                            <FormDescription>
                              Analysis of unimproved parcels
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileBarChart className="mr-2 h-4 w-4" />
                      Run Ratio Study
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="results">
            {mutation.isError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>
                  {(mutation.error as any)?.message || "There was an error performing the ratio study. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Median Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(displayResult.ratioSummary.median * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Central tendency measure</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">COD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayResult.ratioSummary.coefficientOfDispersion.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Coefficient of Dispersion</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">PRD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayResult.ratioSummary.priceRelatedDifferential.toFixed(3)}</div>
                    <p className="text-xs text-muted-foreground">Price Related Differential</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Confidence (95%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {(displayResult.ratioSummary.confidenceInterval.lower * 100).toFixed(1)}% - {(displayResult.ratioSummary.confidenceInterval.upper * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Confidence interval</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ratio Distribution</CardTitle>
                    <CardDescription>
                      Distribution of assessment-to-sale ratios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChartMock
                      title="Ratio Distribution"
                      description="Property count by ratio range"
                    />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Mean Ratio</div>
                        <div className="text-lg font-medium">{(displayResult.ratioSummary.mean * 100).toFixed(1)}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Weighted Mean</div>
                        <div className="text-lg font-medium">{(displayResult.ratioSummary.weightedMean * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Price Quartile Analysis</CardTitle>
                    <CardDescription>
                      Assessment ratios by price quartiles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quartile</TableHead>
                          <TableHead>Price Range</TableHead>
                          <TableHead>Sales</TableHead>
                          <TableHead>Median Ratio</TableHead>
                          <TableHead>COD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayResult.priceQuartileAnalysis.map((quartile) => (
                          <TableRow key={quartile.quartile}>
                            <TableCell className="font-medium">{quartile.quartile}</TableCell>
                            <TableCell>{quartile.priceRange}</TableCell>
                            <TableCell>{quartile.saleCount}</TableCell>
                            <TableCell>{(quartile.medianRatio * 100).toFixed(1)}%</TableCell>
                            <TableCell>{quartile.cod.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-1">
                <div className="text-base font-medium">Property Type Analysis</div>
                <div className="text-sm text-muted-foreground mb-3">Assessment performance by property classification</div>
                <Table className="border rounded-md">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Type</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Median Ratio</TableHead>
                      <TableHead>COD</TableHead>
                      <TableHead>Assessment Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayResult.propertyTypeAnalysis.map((type) => {
                      const levelStyle = getAssessmentLevelStyle(type.assessmentLevel);
                      return (
                        <TableRow key={type.propertyType}>
                          <TableCell className="font-medium">{type.propertyType}</TableCell>
                          <TableCell>{type.saleCount}</TableCell>
                          <TableCell>{(type.medianRatio * 100).toFixed(1)}%</TableCell>
                          <TableCell>{type.cod.toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge className={levelStyle.color}>{levelStyle.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Time Trend Analysis</CardTitle>
                    <CardDescription>
                      Assessment ratios by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChartMock
                      title="Time Trend Analysis"
                      description="Monthly assessment ratios and sale prices"
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Study Conclusions</CardTitle>
                    <CardDescription>
                      Summary of key findings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Assessment Level</h3>
                      <p className="text-muted-foreground">
                        {displayResult.ratioSummary.median < 0.9 ? (
                          "Properties are generally under-assessed relative to market value."
                        ) : displayResult.ratioSummary.median > 1.1 ? (
                          "Properties are generally over-assessed relative to market value."
                        ) : (
                          "Assessment level is within acceptable range."
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Assessment Uniformity</h3>
                      <p className="text-muted-foreground">
                        {displayResult.ratioSummary.coefficientOfDispersion <= 15 ? (
                          "Assessment uniformity meets IAAO standards."
                        ) : (
                          "Assessment uniformity does not meet IAAO standards."
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Vertical Equity</h3>
                      <p className="text-muted-foreground">
                        {displayResult.ratioSummary.priceRelatedDifferential > 1.03 ? (
                          "Evidence of assessment regressivity (higher-valued properties assessed at lower rates)."
                        ) : displayResult.ratioSummary.priceRelatedDifferential < 0.98 ? (
                          "Evidence of assessment progressivity (higher-valued properties assessed at higher rates)."
                        ) : (
                          "Vertical equity is within acceptable parameters."
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
                <Button>
                  Generate Recommendations
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="neighborhood">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Neighborhood Map Analysis</CardTitle>
                    <CardDescription>
                      Spatial distribution of assessment ratios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MapChartMock
                      title="Neighborhood Assessment Ratios"
                      description="Geographic distribution of ratios"
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Neighborhood Comparison</CardTitle>
                    <CardDescription>
                      Ratio statistics by neighborhood
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PieChartMock
                      title="Sales Distribution"
                      description="Sale count by neighborhood"
                    />
                    <div className="mt-4 text-sm">
                      <div className="font-medium mb-2">Key Observations</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>East Grandview shows potential under-assessment</li>
                        <li>West Grandview trends toward higher assessment ratios</li>
                        <li>Central Grandview has the most uniform assessments</li>
                        <li>South Grandview has the highest sale volume</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Neighborhood Analysis Detail</CardTitle>
                  <CardDescription>
                    Assessment statistics by neighborhood
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Neighborhood</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Median Ratio</TableHead>
                        <TableHead>COD</TableHead>
                        <TableHead>Assessment Level</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayResult.neighborhoodAnalysis.map((neighborhood) => {
                        const levelStyle = getAssessmentLevelStyle(neighborhood.assessmentLevel);
                        return (
                          <TableRow key={neighborhood.neighborhoodCode}>
                            <TableCell className="font-medium">{neighborhood.neighborhoodName}</TableCell>
                            <TableCell>{neighborhood.saleCount}</TableCell>
                            <TableCell>{(neighborhood.medianRatio * 100).toFixed(1)}%</TableCell>
                            <TableCell>{neighborhood.cod.toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge className={levelStyle.color}>{levelStyle.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`absolute top-0 left-0 h-full ${
                                    neighborhood.medianRatio < 0.9 
                                      ? 'bg-orange-500' 
                                      : neighborhood.medianRatio > 1.1 
                                      ? 'bg-blue-500' 
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${neighborhood.medianRatio * 100}%` }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-6 p-4 bg-muted rounded-md">
                    <h3 className="text-sm font-medium mb-2">Neighborhood-Specific Recommendations</h3>
                    <div className="space-y-3 text-sm">
                      {displayResult.neighborhoodAnalysis.map((neighborhood) => {
                        if (neighborhood.assessmentLevel !== 'Acceptable' || neighborhood.cod > 15) {
                          return (
                            <div key={`rec-${neighborhood.neighborhoodCode}`}>
                              <div className="font-medium">{neighborhood.neighborhoodName}</div>
                              <p className="text-muted-foreground">
                                {neighborhood.assessmentLevel === 'Low' 
                                  ? `Assessment level is low (${(neighborhood.medianRatio * 100).toFixed(1)}%). Consider adjusting values upward to improve equity.` 
                                  : neighborhood.assessmentLevel === 'High'
                                  ? `Assessment level is high (${(neighborhood.medianRatio * 100).toFixed(1)}%). Consider reviewing for potential over-assessment.`
                                  : ''}
                                {neighborhood.cod > 15 
                                  ? ` Uniformity issues present (COD: ${neighborhood.cod.toFixed(1)}). Review assessment methodology for this area.` 
                                  : ''}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ratio Distribution Analysis</CardTitle>
                  <CardDescription>
                    Analysis of assessment ratio frequency distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChartMock 
                    title="Assessment Ratio Distribution"
                    description="Frequency of ratio ranges"
                  />
                  
                  <div className="mt-6">
                    <Table className="border rounded-md">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ratio Range</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                          <TableHead>Distribution</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayResult.ratioDistribution.map((range) => (
                          <TableRow key={range.range}>
                            <TableCell className="font-medium">{range.range}</TableCell>
                            <TableCell>{range.count}</TableCell>
                            <TableCell className="text-right">{range.percentage.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${range.percentage}%` }}
                                ></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Within Range (0.90-1.10)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {displayResult.ratioDistribution
                            .filter(r => r.range === '0.90-1.00' || r.range === '1.00-1.10')
                            .reduce((sum, r) => sum + r.percentage, 0)
                            .toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Of properties</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Below Range (<0.90)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {displayResult.ratioDistribution
                            .filter(r => r.range === '<0.70' || r.range === '0.70-0.80' || r.range === '0.80-0.90')
                            .reduce((sum, r) => sum + r.percentage, 0)
                            .toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Under-assessed</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Above Range (>1.10)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {displayResult.ratioDistribution
                            .filter(r => r.range === '1.10-1.20' || r.range === '>1.20')
                            .reduce((sum, r) => sum + r.percentage, 0)
                            .toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Over-assessed</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Normal Probability Analysis</CardTitle>
                    <CardDescription>
                      Comparison of ratio distribution to normal distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChartMock
                      title="Q-Q Plot"
                      description="Actual vs. expected distribution"
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution Statistics</CardTitle>
                    <CardDescription>
                      Statistical measures of the ratio distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Mean</div>
                          <div className="text-lg font-medium">{(displayResult.ratioSummary.mean * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Median</div>
                          <div className="text-lg font-medium">{(displayResult.ratioSummary.median * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Weighted Mean</div>
                          <div className="text-lg font-medium">{(displayResult.ratioSummary.weightedMean * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">PRD</div>
                          <div className="text-lg font-medium">{displayResult.ratioSummary.priceRelatedDifferential.toFixed(3)}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm mb-2">Skewness Analysis</div>
                        <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                          {displayResult.ratioSummary.mean > displayResult.ratioSummary.median ? (
                            "The distribution shows positive skewness (mean > median), indicating a right-tailed distribution with more properties having lower assessment ratios."
                          ) : displayResult.ratioSummary.mean < displayResult.ratioSummary.median ? (
                            "The distribution shows negative skewness (mean < median), indicating a left-tailed distribution with more properties having higher assessment ratios."
                          ) : (
                            "The distribution appears approximately symmetric, with the mean and median being very close."
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export Analysis
                </Button>
                <Button>
                  Apply Distribution Findings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RatioStudyPanel;