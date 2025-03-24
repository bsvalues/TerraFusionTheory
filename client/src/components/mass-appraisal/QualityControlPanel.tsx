import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { Check, BarChart } from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle,
  FileBarChart,
  FileText,
  Upload,
  Info,
  AlertTriangle,
  Flag,
  Loader2, 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AreaChart } from '@/components/ui/area-chart';
import { Progress } from '@/components/ui/progress';

// Create a mock AreaChart component since we don't have the actual one
const AreaChartMock = ({ data, xField, yField, title, description }: any) => (
  <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
    <div className="text-center">
      <FileBarChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </div>
);

const formSchema = z.object({
  valuationFile: z.any().optional(),
  propertyType: z.string().min(1, 'Property type is required'),
  neighborhood: z.string().optional(),
  valuationModel: z.string().min(1, 'Valuation model is required'),
  qualityMetrics: z.string().min(1, 'Quality metrics selection is required'),
  outlierThreshold: z.coerce.number().min(1, 'Threshold must be greater than 0')
});

type FormValues = z.infer<typeof formSchema>;

interface QualityControlResult {
  totalProperties: number;
  summaryStats: {
    meanRatio: number;
    medianRatio: number;
    coefficientOfDispersion: number;
    priceRelatedDifferential: number;
    priceRelatedBias: number;
  };
  percentWithinAcceptableRange: number;
  outlierCount: number;
  flags: {
    type: 'outlier' | 'highAdjustment' | 'lowConfidence' | 'assessmentGap';
    severity: 'high' | 'medium' | 'low';
    description: string;
  }[];
  flaggedProperties: {
    propertyId: string;
    address: string;
    marketValue: number;
    assessedValue: number;
    ratio: number;
    flags: {
      type: string;
      severity: string;
      description: string;
    }[];
  }[];
  complianceReport: {
    iaaoStandards: {
      cod: { min: number; max: number; actual: number; passed: boolean };
      prd: { min: number; max: number; actual: number; passed: boolean };
      prb: { min: number; max: number; actual: number; passed: boolean };
    };
  };
}

const QualityControlPanel = () => {
  const [activeTab, setActiveTab] = useState('form');
  const [qualityResult, setQualityResult] = useState<QualityControlResult | null>(null);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: 'Residential',
      valuationModel: 'market-value',
      qualityMetrics: 'standard',
      outlierThreshold: 15
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      // In a real implementation, we would upload the file and send the form data
      // For now, we'll just simulate it with a direct API call
      
      return apiRequest('/api/mass-appraisal/quality-control', { 
        method: 'POST',
        body: JSON.stringify({
          // Mockup property data for testing
          properties: [
            { id: '1', address: '123 Main St', assessedValue: 400000, marketValue: 425000 },
            { id: '2', address: '456 Oak St', assessedValue: 350000, marketValue: 365000 },
            { id: '3', address: '789 Pine St', assessedValue: 480000, marketValue: 510000 }
          ],
          settings: {
            propertyType: data.propertyType,
            neighborhood: data.neighborhood || 'All',
            modelId: data.valuationModel,
            qualityMetrics: data.qualityMetrics,
            outlierThreshold: data.outlierThreshold
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      setQualityResult(data);
      setActiveTab('results');
      toast({
        title: "Quality Control Analysis Complete",
        description: "Assessment quality metrics have been calculated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error?.message || "Failed to perform quality control analysis. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  // Mock quality control results for UI development
  const mockQualityResult: QualityControlResult = {
    totalProperties: 458,
    summaryStats: {
      meanRatio: 0.94,
      medianRatio: 0.96,
      coefficientOfDispersion: 12.3,
      priceRelatedDifferential: 1.02,
      priceRelatedBias: -0.008
    },
    percentWithinAcceptableRange: 92.5,
    outlierCount: 34,
    flags: [
      { type: 'outlier', severity: 'high', description: 'Assessment ratios outside acceptable range' },
      { type: 'highAdjustment', severity: 'medium', description: 'Large adjustment factors applied' },
      { type: 'lowConfidence', severity: 'medium', description: 'Valuation models with low confidence scores' },
      { type: 'assessmentGap', severity: 'low', description: 'Consistent assessment gaps in specific neighborhoods' }
    ],
    flaggedProperties: [
      {
        propertyId: '12345',
        address: '123 Main St, Grandview, WA',
        marketValue: 425000,
        assessedValue: 325000,
        ratio: 0.76,
        flags: [
          { type: 'outlier', severity: 'high', description: 'Assessment ratio below acceptable range' }
        ]
      },
      {
        propertyId: '23456',
        address: '456 Oak Ave, Grandview, WA',
        marketValue: 390000,
        assessedValue: 450000,
        ratio: 1.15,
        flags: [
          { type: 'outlier', severity: 'medium', description: 'Assessment ratio above acceptable range' },
          { type: 'highAdjustment', severity: 'medium', description: 'Large adjustment factor (1.25)' }
        ]
      },
      {
        propertyId: '34567',
        address: '789 Pine Ln, Grandview, WA',
        marketValue: 510000,
        assessedValue: 385000,
        ratio: 0.75,
        flags: [
          { type: 'outlier', severity: 'high', description: 'Assessment ratio below acceptable range' },
          { type: 'lowConfidence', severity: 'medium', description: 'Model confidence score: 68%' }
        ]
      }
    ],
    complianceReport: {
      iaaoStandards: {
        cod: { min: 5, max: 15, actual: 12.3, passed: true },
        prd: { min: 0.98, max: 1.03, actual: 1.02, passed: true },
        prb: { min: -0.05, max: 0.05, actual: -0.008, passed: true }
      }
    }
  };
  
  // Use the mock result if no real result is available
  const displayResult = qualityResult || mockQualityResult;
  
  // Helper for flag severity display
  const getSeverityDisplay = (severity: string) => {
    switch (severity) {
      case 'high':
        return { label: 'High', color: 'bg-red-100 text-red-800' };
      case 'medium':
        return { label: 'Medium', color: 'bg-orange-100 text-orange-800' };
      case 'low':
        return { label: 'Low', color: 'bg-amber-100 text-amber-800' };
      default:
        return { label: severity, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Quality Control</CardTitle>
        <CardDescription>
          Analyze assessment quality metrics and identify outliers based on IAAO standards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="form">
              <Upload className="mr-2 h-4 w-4" />
              Upload & Analyze
            </TabsTrigger>
            <TabsTrigger value="results">
              <FileBarChart className="mr-2 h-4 w-4" />
              Analysis Results
            </TabsTrigger>
            <TabsTrigger value="compliance">
              <FileText className="mr-2 h-4 w-4" />
              IAAO Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="border-dashed border-2 rounded-md p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-base font-medium mb-1">Upload Valuation File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your assessment data file, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Supports CSV, Excel, or JSON files with property data including market values and assessed values
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                            <SelectItem value="Industrial">Industrial</SelectItem>
                            <SelectItem value="Agricultural">Agricultural</SelectItem>
                            <SelectItem value="All">All Property Types</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select neighborhood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GV-CENTRAL">Central Grandview</SelectItem>
                            <SelectItem value="GV-NORTH">North Grandview</SelectItem>
                            <SelectItem value="GV-SOUTH">South Grandview</SelectItem>
                            <SelectItem value="GV-EAST">East Grandview</SelectItem>
                            <SelectItem value="GV-WEST">West Grandview</SelectItem>
                            <SelectItem value="GV-COMMERCIAL">Commercial District</SelectItem>
                            <SelectItem value="GV-CBD">Central Business District</SelectItem>
                            <SelectItem value="GV-INDUSTRIAL">Industrial Park</SelectItem>
                            <SelectItem value="">All Neighborhoods</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valuationModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valuation Model</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select valuation model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="market-value">Market Value Model</SelectItem>
                            <SelectItem value="income-approach">Income Approach Model</SelectItem>
                            <SelectItem value="cost-approach">Cost Approach Model</SelectItem>
                            <SelectItem value="sales-comparison">Sales Comparison Model</SelectItem>
                            <SelectItem value="hybrid">Hybrid Valuation Model</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="qualityMetrics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Metrics</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quality metrics" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard IAAO Metrics</SelectItem>
                            <SelectItem value="enhanced">Enhanced Statistical Analysis</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive Quality Review</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="outlierThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outlier Threshold (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Percentage deviation from median ratio to flag as outlier (recommended: 15-25%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                      Run Quality Control Analysis
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
                  {(mutation.error as any)?.message || "There was an error performing the quality control analysis. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">COD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayResult.summaryStats.coefficientOfDispersion.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Coefficient of Dispersion</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">PRD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayResult.summaryStats.priceRelatedDifferential.toFixed(3)}</div>
                    <p className="text-xs text-muted-foreground">Price Related Differential</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Median Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(displayResult.summaryStats.medianRatio * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Assessment to Market Value</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {displayResult.complianceReport.iaaoStandards.cod.passed && 
                       displayResult.complianceReport.iaaoStandards.prd.passed && 
                       displayResult.complianceReport.iaaoStandards.prb.passed ? (
                        <>
                          <div className="text-2xl font-bold text-green-600">Passed</div>
                          <Check className="h-5 w-5 text-green-600" />
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-red-600">Failed</div>
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">IAAO Standards</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Assessment Ratio Distribution</CardTitle>
                    <CardDescription>
                      Distribution of assessment ratios across all properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AreaChartMock
                      title="Assessment Ratio Distribution"
                      description="Property count by assessment ratio range"
                    />
                    <div className="flex justify-between items-center mt-4 text-sm">
                      <div>
                        <span className="font-medium">Within range: </span>
                        <span>{displayResult.percentWithinAcceptableRange.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Outliers: </span>
                        <span>{displayResult.outlierCount} properties</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Issues</CardTitle>
                    <CardDescription>
                      Identified problems requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayResult.flags.map((flag, index) => {
                        const severity = getSeverityDisplay(flag.severity);
                        return (
                          <div key={index} className="flex items-start gap-2">
                            <div>
                              <Flag className="h-4 w-4 text-muted-foreground mt-0.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{flag.type}</span>
                                <Badge className={severity.color}>{severity.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{flag.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Properties</CardTitle>
                  <CardDescription>
                    Properties with assessment issues requiring review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Market Value</TableHead>
                        <TableHead>Assessed Value</TableHead>
                        <TableHead>Ratio</TableHead>
                        <TableHead>Issues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayResult.flaggedProperties.map((property) => {
                        return (
                          <TableRow key={property.propertyId}>
                            <TableCell className="font-medium">{property.address}</TableCell>
                            <TableCell>${property.marketValue.toLocaleString()}</TableCell>
                            <TableCell>${property.assessedValue.toLocaleString()}</TableCell>
                            <TableCell>{(property.ratio * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {property.flags.map((flag, index) => {
                                  const severity = getSeverityDisplay(flag.severity);
                                  return (
                                    <div key={index} className="relative group">
                                      <Badge className={severity.color}>
                                        {flag.type}
                                      </Badge>
                                      <div className="absolute z-50 hidden group-hover:block bottom-full mb-2 p-2 bg-black text-white text-xs rounded w-48">
                                        {flag.description}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  Export Report
                </Button>
                <Button>
                  Generate Recommendations
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="space-y-6">
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>IAAO Standards</AlertTitle>
                <AlertDescription>
                  The International Association of Assessing Officers (IAAO) establishes standards
                  for assessment quality. This report evaluates compliance with these standards.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                  <CardDescription>
                    Assessment quality metrics compared to IAAO standard acceptable ranges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Acceptable Range</TableHead>
                        <TableHead>Actual Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Coefficient of Dispersion (COD)</TableCell>
                        <TableCell>{displayResult.complianceReport.iaaoStandards.cod.min} - {displayResult.complianceReport.iaaoStandards.cod.max}</TableCell>
                        <TableCell>{displayResult.complianceReport.iaaoStandards.cod.actual.toFixed(1)}</TableCell>
                        <TableCell>
                          {displayResult.complianceReport.iaaoStandards.cod.passed ? (
                            <Badge className="bg-green-100 text-green-800">Passed</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Price Related Differential (PRD)</TableCell>
                        <TableCell>{displayResult.complianceReport.iaaoStandards.prd.min} - {displayResult.complianceReport.iaaoStandards.prd.max}</TableCell>
                        <TableCell>{displayResult.complianceReport.iaaoStandards.prd.actual.toFixed(3)}</TableCell>
                        <TableCell>
                          {displayResult.complianceReport.iaaoStandards.prd.passed ? (
                            <Badge className="bg-green-100 text-green-800">Passed</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Price Related Bias (PRB)</TableCell>
                        <TableCell>{displayResult.complianceReport.iaaoStandards.prb.min} - {displayResult.complianceReport.iaaoStandards.prb.max}</TableCell>
                        <TableCell>{displayResult.complianceReport.iaaoStandards.prb.actual.toFixed(3)}</TableCell>
                        <TableCell>
                          {displayResult.complianceReport.iaaoStandards.prb.passed ? (
                            <Badge className="bg-green-100 text-green-800">Passed</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Metric Explanations</CardTitle>
                    <CardDescription>
                      Explanation of each assessment quality metric
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1">Coefficient of Dispersion (COD)</h3>
                        <p className="text-muted-foreground">
                          Measures the average percentage deviation of assessment ratios from the median ratio.
                          Lower values indicate more uniform assessments. IAAO recommends different acceptable
                          ranges based on property type and market activity.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Price Related Differential (PRD)</h3>
                        <p className="text-muted-foreground">
                          Measures assessment progressivity or regressivity by comparing mean and weighted mean
                          assessment ratios. Values above 1.03 suggest assessment regressivity (higher-valued
                          properties assessed at lower rates), while values below 0.98 suggest progressivity.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Price Related Bias (PRB)</h3>
                        <p className="text-muted-foreground">
                          Alternative measure of vertical equity using regression analysis. Less sensitive to
                          outliers than PRD. Values between -0.05 and 0.05 indicate acceptable vertical equity.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>IAAO Standard Requirements</CardTitle>
                    <CardDescription>
                      Requirements by property type and market conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1">Residential Properties</h3>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          <li>COD: 5.0 to 15.0</li>
                          <li>PRD: 0.98 to 1.03</li>
                          <li>PRB: -0.05 to 0.05</li>
                          <li>Median Ratio: 0.90 to 1.10</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Commercial Properties</h3>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          <li>COD: 5.0 to 20.0</li>
                          <li>PRD: 0.98 to 1.03</li>
                          <li>PRB: -0.05 to 0.05</li>
                          <li>Median Ratio: 0.90 to 1.10</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Vacant Land</h3>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          <li>COD: 5.0 to 25.0</li>
                          <li>PRD: 0.98 to 1.03</li>
                          <li>PRB: -0.05 to 0.05</li>
                          <li>Median Ratio: 0.90 to 1.10</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Compliance Assessment</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-1/4 font-medium">Overall Status:</div>
                    <div>
                      {displayResult.complianceReport.iaaoStandards.cod.passed && 
                       displayResult.complianceReport.iaaoStandards.prd.passed && 
                       displayResult.complianceReport.iaaoStandards.prb.passed ? (
                        <span className="text-green-600 font-medium">Compliant with IAAO Standards</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not Compliant with IAAO Standards</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1/4 font-medium">Assessment Level:</div>
                    <div>
                      {displayResult.summaryStats.medianRatio < 0.9 ? (
                        <span>Properties are under-assessed relative to market value</span>
                      ) : displayResult.summaryStats.medianRatio > 1.1 ? (
                        <span>Properties are over-assessed relative to market value</span>
                      ) : (
                        <span>Assessment level is within acceptable range</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1/4 font-medium">Assessment Uniformity:</div>
                    <div>
                      {displayResult.complianceReport.iaaoStandards.cod.passed ? (
                        <span>Acceptable uniformity in assessments</span>
                      ) : (
                        <span>Assessment uniformity needs improvement</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1/4 font-medium">Vertical Equity:</div>
                    <div>
                      {!displayResult.complianceReport.iaaoStandards.prd.passed ? (
                        <span>Vertical equity issues detected in the assessment roll</span>
                      ) : !displayResult.complianceReport.iaaoStandards.prb.passed ? (
                        <span>Potential vertical equity issues detected by PRB</span>
                      ) : (
                        <span>Vertical equity is within acceptable parameters</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  Export Compliance Report
                </Button>
                <Button>
                  Generate Improvement Plan
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QualityControlPanel;