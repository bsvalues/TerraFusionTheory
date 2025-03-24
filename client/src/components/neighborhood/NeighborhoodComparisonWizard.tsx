/**
 * NeighborhoodComparisonWizard Component
 * 
 * This component provides a wizard-like interface for comparing multiple neighborhoods
 * based on different metrics like property values, schools, safety, etc.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowRight,
  BarChart4,
  Building,
  Check,
  ChevronRight,
  Home,
  Info,
  LineChart,
  Map,
  PieChart,
  Plus,
  School,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Toggle } from '@/components/ui/toggle';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import the neighborhood service for data fetching
import neighborhoodService, { 
  Neighborhood, 
  NeighborhoodMetrics 
} from '@/services/neighborhood.service';
import neighborhoodComparisonService from '@/services/neighborhood-comparison.service';

// Charts
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  Line, 
  LineChart as RechartsLineChart, 
  Pie, 
  PieChart as RechartsPieChart, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  XAxis, 
  YAxis,
  Cell
} from 'recharts';

// Define color constants
const CHART_COLORS = [
  '#0ea5e9', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
];

// Define component props
interface NeighborhoodComparisonWizardProps {
  city?: string;
  state?: string;
  initialNeighborhoods?: string[];
  className?: string;
  onClose?: () => void;
}

// Define metric categories for grouping
interface MetricCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  metrics: string[];
}

// Main component implementation
const NeighborhoodComparisonWizard: React.FC<NeighborhoodComparisonWizardProps> = ({
  city = 'Richland',
  state = 'WA',
  initialNeighborhoods = [],
  className,
  onClose
}) => {
  // State variables
  const [step, setStep] = useState<number>(1);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(initialNeighborhoods);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['median_home_price', 'safety_score', 'school_rating']);
  const [selectedCity, setSelectedCity] = useState<string>(city);
  const [selectedState, setSelectedState] = useState<string>(state);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'radar' | 'pie'>('bar');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const { toast } = useToast();

  // Define metric categories
  const metricCategories: MetricCategory[] = [
    {
      id: 'property',
      name: 'Property & Housing',
      icon: <Home className="h-4 w-4" />,
      metrics: [
        'median_home_price',
        'price_per_sqft',
        'median_rent',
        'price_growth',
        'inventory_level',
        'days_on_market',
        'affordability_index'
      ]
    },
    {
      id: 'quality',
      name: 'Quality of Life',
      icon: <ShieldCheck className="h-4 w-4" />,
      metrics: [
        'safety_score',
        'crime_rate',
        'noise_level',
        'air_quality',
        'walkability_score',
        'commute_time',
        'parks_access'
      ]
    },
    {
      id: 'education',
      name: 'Education',
      icon: <School className="h-4 w-4" />,
      metrics: [
        'school_rating',
        'student_teacher_ratio',
        'test_scores',
        'college_readiness',
        'graduation_rate',
        'education_level'
      ]
    },
    {
      id: 'amenities',
      name: 'Amenities & Services',
      icon: <ShoppingBag className="h-4 w-4" />,
      metrics: [
        'restaurant_access',
        'shopping_access',
        'healthcare_access',
        'entertainment_venues',
        'grocery_access',
        'public_transport'
      ]
    },
    {
      id: 'demographics',
      name: 'Demographics',
      icon: <BarChart4 className="h-4 w-4" />,
      metrics: [
        'population_density',
        'median_age',
        'household_size',
        'income_level',
        'education_level',
        'diversity_index'
      ]
    }
  ];

  // Query to fetch all available neighborhoods
  const { data: neighborhoods, isLoading: isLoadingNeighborhoods } = useQuery({
    queryKey: ['/api/neighborhoods', selectedCity, selectedState],
    queryFn: async () => {
      try {
        return await neighborhoodService.getNeighborhoods(selectedCity, selectedState);
      } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        setError('Failed to load neighborhoods');
        return [];
      }
    }
  });

  // Effect to reset selected neighborhoods when city changes
  useEffect(() => {
    setSelectedNeighborhoods([]);
  }, [selectedCity, selectedState]);

  // Format the metric name for display
  const formatMetricName = (metric: string): string => {
    return metric
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get the category for a given metric
  const getMetricCategory = (metric: string): string => {
    for (const category of metricCategories) {
      if (category.metrics.includes(metric)) {
        return category.id;
      }
    }
    return 'other';
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhood: string) => {
    if (selectedNeighborhoods.includes(neighborhood)) {
      setSelectedNeighborhoods(selectedNeighborhoods.filter(n => n !== neighborhood));
    } else {
      setSelectedNeighborhoods([...selectedNeighborhoods, neighborhood]);
    }
  };

  // Handle metric selection
  const handleMetricSelect = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  // Handle metric category selection (selects/deselects all metrics in category)
  const handleCategorySelect = (categoryId: string) => {
    const category = metricCategories.find(c => c.id === categoryId);
    if (!category) return;

    const categoryMetrics = category.metrics;
    const allSelected = categoryMetrics.every(metric => selectedMetrics.includes(metric));

    if (allSelected) {
      // Deselect all metrics in this category
      setSelectedMetrics(selectedMetrics.filter(m => !categoryMetrics.includes(m)));
    } else {
      // Select all metrics in this category
      const newMetrics = [...selectedMetrics];
      categoryMetrics.forEach(metric => {
        if (!newMetrics.includes(metric)) {
          newMetrics.push(metric);
        }
      });
      setSelectedMetrics(newMetrics);
    }
  };

  // Check if a category has all metrics selected
  const isCategorySelected = (categoryId: string): boolean => {
    const category = metricCategories.find(c => c.id === categoryId);
    if (!category) return false;
    return category.metrics.every(metric => selectedMetrics.includes(metric));
  };

  // Handle moving to the next step
  const handleNextStep = () => {
    if (step === 1 && selectedNeighborhoods.length < 2) {
      toast({
        title: "Selection Required",
        description: "Please select at least two neighborhoods to compare.",
        variant: "destructive"
      });
      return;
    }

    if (step === 2 && selectedMetrics.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one metric for comparison.",
        variant: "destructive"
      });
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      generateComparison();
    }
  };

  // Handle moving to the previous step
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Generate the comparison chart data
  const generateComparison = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await neighborhoodComparisonService.compareNeighborhoods(
        selectedCity,
        selectedState,
        selectedNeighborhoods,
        selectedMetrics
      );
      
      setComparisonData(data);
      setStep(4); // Move to results step
      
      toast({
        title: "Comparison Generated",
        description: "Neighborhood comparison is ready to view.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating comparison:', error);
      setError('Failed to generate neighborhood comparison');
      toast({
        title: "Error",
        description: "Failed to generate neighborhood comparison.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate the appropriate chart based on the data and chart type
  const renderChart = () => {
    if (!comparisonData || !comparisonData.metrics) return null;

    // Format data for charts
    const chartData = selectedMetrics.map(metric => {
      const metricData: any = {
        name: formatMetricName(metric),
        metric: metric
      };
      
      selectedNeighborhoods.forEach(neighborhood => {
        const neighborhoodData = comparisonData.neighborhoodData[neighborhood];
        if (neighborhoodData && neighborhoodData[metric] !== undefined) {
          metricData[neighborhood] = neighborhoodData[metric];
        } else {
          metricData[neighborhood] = 0;
        }
      });
      
      return metricData;
    });

    // Format data specifically for radar chart
    const radarData = selectedNeighborhoods.map(neighborhood => {
      const data: any = {
        name: neighborhood
      };
      
      selectedMetrics.forEach(metric => {
        const neighborhoodData = comparisonData.neighborhoodData[neighborhood];
        if (neighborhoodData && neighborhoodData[metric] !== undefined) {
          // Normalize all metrics to a 0-100 scale for radar chart
          const metricInfo = comparisonData.metrics[metric];
          const value = neighborhoodData[metric];
          const min = metricInfo.min || 0;
          const max = metricInfo.max || 100;
          
          // Simple min-max normalization
          const normalizedValue = ((value - min) / (max - min)) * 100;
          data[formatMetricName(metric)] = normalizedValue;
        } else {
          data[formatMetricName(metric)] = 0;
        }
      });
      
      return data;
    });

    // Format data for pie chart
    const pieData = selectedNeighborhoods.map((neighborhood, index) => {
      // We'll use the first selected metric for the pie chart
      const metric = selectedMetrics[0];
      const neighborhoodData = comparisonData.neighborhoodData[neighborhood];
      const value = neighborhoodData && neighborhoodData[metric] !== undefined 
        ? neighborhoodData[metric] 
        : 0;
        
      return {
        name: neighborhood,
        value: value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      };
    });

    // Render appropriate chart based on chart type
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
              {selectedNeighborhoods.map((neighborhood, index) => (
                <Bar 
                  key={neighborhood} 
                  dataKey={neighborhood} 
                  name={neighborhood}
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
              {selectedNeighborhoods.map((neighborhood, index) => (
                <Line 
                  key={neighborhood} 
                  type="monotone" 
                  dataKey={neighborhood} 
                  name={neighborhood}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                  activeDot={{ r: 8 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius={150} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {selectedMetrics.map((metric, index) => (
                <Radar 
                  key={metric}
                  name={formatMetricName(metric)}
                  dataKey={formatMetricName(metric)}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={(entry) => entry.name}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  // Render comparison results table
  const renderComparisonTable = () => {
    if (!comparisonData || !comparisonData.metrics) return null;

    return (
      <div className="w-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium">Metric</th>
              {selectedNeighborhoods.map(neighborhood => (
                <th key={neighborhood} className="text-left p-2 font-medium">{neighborhood}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedMetrics.map(metric => (
              <tr key={metric} className="border-b">
                <td className="p-2 font-medium">{formatMetricName(metric)}</td>
                {selectedNeighborhoods.map(neighborhood => {
                  const value = comparisonData.neighborhoodData[neighborhood]?.[metric];
                  const bestValue = comparisonData.best[metric];
                  
                  // Determine if this is the best value
                  const isBest = value === bestValue;
                  
                  return (
                    <td 
                      key={`${neighborhood}-${metric}`} 
                      className={cn("p-2", isBest ? "font-bold" : "")}
                    >
                      {value !== undefined ? value : 'N/A'}
                      {isBest && <span className="text-green-500 ml-1">✓</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render neighborhood recommendation if available
  const renderRecommendation = () => {
    if (!comparisonData || !comparisonData.recommendation) return null;
    
    const { neighborhood, score, reasons } = comparisonData.recommendation;
    
    return (
      <Card className="my-4 border-2 border-primary">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Recommended Neighborhood</CardTitle>
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <CardDescription>Based on your selected metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-xl font-bold">{neighborhood}</h3>
            <div className="flex items-center gap-2 my-2">
              <Progress value={score} className="h-2 flex-grow" />
              <span className="text-sm font-medium">{score}/100</span>
            </div>
          </div>
          
          <h4 className="font-medium mb-2">Why this neighborhood?</h4>
          <ul className="space-y-2">
            {reasons.map((reason: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{reason}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1: // Step 1: Select Neighborhoods
        return (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Richland">Richland</SelectItem>
                    <SelectItem value="Grandview">Grandview</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedState}
                  onValueChange={setSelectedState}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WA">WA</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                    <SelectItem value="CA">CA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Select Neighborhoods to Compare</h3>
                <Badge variant="outline">
                  {selectedNeighborhoods.length} selected
                </Badge>
              </div>
              
              {isLoadingNeighborhoods ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : neighborhoods && neighborhoods.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {neighborhoods.map(neighborhood => (
                      <div 
                        key={neighborhood.id} 
                        className={cn(
                          "flex items-center rounded-lg border p-3 cursor-pointer transition-colors",
                          selectedNeighborhoods.includes(neighborhood.name)
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                        )}
                        onClick={() => handleNeighborhoodSelect(neighborhood.name)}
                      >
                        <div className="flex-grow">
                          <h4 className="font-medium">{neighborhood.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {neighborhood.description}
                          </p>
                        </div>
                        <Checkbox 
                          checked={selectedNeighborhoods.includes(neighborhood.name)}
                          onCheckedChange={() => handleNeighborhoodSelect(neighborhood.name)}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No neighborhoods found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try selecting a different city or state
                  </p>
                </div>
              )}
            </div>
          </>
        );
        
      case 2: // Step 2: Select Metrics
        return (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Select Comparison Metrics</h3>
                <Badge variant="outline">
                  {selectedMetrics.length} selected
                </Badge>
              </div>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {metricCategories.map(category => (
                    <div key={category.id} className="space-y-2">
                      <div 
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                          isCategorySelected(category.id) ? "bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <Checkbox 
                          checked={isCategorySelected(category.id)}
                          onCheckedChange={() => handleCategorySelect(category.id)}
                        />
                        <div className="flex items-center gap-2">
                          {category.icon}
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </div>
                      
                      <div className="pl-8 space-y-1">
                        {category.metrics.map(metric => (
                          <div 
                            key={metric}
                            className={cn(
                              "flex items-center p-1 rounded text-sm cursor-pointer",
                              selectedMetrics.includes(metric) ? "bg-primary/5" : "hover:bg-muted"
                            )}
                            onClick={() => handleMetricSelect(metric)}
                          >
                            <Checkbox 
                              className="mr-2 h-3.5 w-3.5"
                              checked={selectedMetrics.includes(metric)}
                              onCheckedChange={() => handleMetricSelect(metric)}
                            />
                            <span>{formatMetricName(metric)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        );
        
      case 3: // Step 3: Visualization Options
        return (
          <>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Choose Visualization Type</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className={cn(
                    "flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-colors",
                    chartType === 'bar' ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  )}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart4 className={cn("h-12 w-12 mb-2", chartType === 'bar' ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">Bar Chart</span>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Compare metrics side by side
                  </p>
                </div>
                
                <div 
                  className={cn(
                    "flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-colors",
                    chartType === 'line' ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  )}
                  onClick={() => setChartType('line')}
                >
                  <LineChart className={cn("h-12 w-12 mb-2", chartType === 'line' ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">Line Chart</span>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Visualize trends across metrics
                  </p>
                </div>
                
                <div 
                  className={cn(
                    "flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-colors",
                    chartType === 'radar' ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  )}
                  onClick={() => setChartType('radar')}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className={cn("h-12 w-12 mb-2", chartType === 'radar' ? "text-primary" : "text-muted-foreground")}
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="4" y2="12" />
                    <line x1="20" y1="12" x2="22" y2="12" />
                    <line x1="5" y1="5" x2="7" y2="7" />
                    <line x1="17" y1="17" x2="19" y2="19" />
                    <line x1="5" y1="19" x2="7" y2="17" />
                    <line x1="17" y1="7" x2="19" y2="5" />
                  </svg>
                  <span className="font-medium">Radar Chart</span>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Compare overall neighborhood profiles
                  </p>
                </div>
                
                <div 
                  className={cn(
                    "flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-colors",
                    chartType === 'pie' ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  )}
                  onClick={() => setChartType('pie')}
                >
                  <PieChart className={cn("h-12 w-12 mb-2", chartType === 'pie' ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">Pie Chart</span>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Show relative proportions
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium">Review Your Selections</h3>
                <Badge variant="outline" className="ml-1">
                  {selectedNeighborhoods.length} neighborhoods
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">
                  {selectedMetrics.length} metrics
                </Badge>
              </div>
              
              <div className="p-3 border rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Selected Neighborhoods:</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedNeighborhoods.map(neighborhood => (
                    <Badge key={neighborhood} variant="secondary">
                      {neighborhood}
                    </Badge>
                  ))}
                </div>
                
                <h4 className="text-sm font-medium mb-2">Selected Metrics:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMetrics.map(metric => (
                    <Badge key={metric} variant="outline">
                      {formatMetricName(metric)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
        
      case 4: // Step 4: Results
        return (
          <>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-[300px] w-full mb-3" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                <h3 className="font-medium">Error Generating Comparison</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error}
                </p>
                <Button 
                  variant="outline" 
                  onClick={generateComparison}
                >
                  Try Again
                </Button>
              </div>
            ) : comparisonData ? (
              <div>
                {/* Recommendation Card */}
                {renderRecommendation()}
                
                {/* Visualization Options */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Neighborhood Comparison</h3>
                    <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as any)}>
                      <ToggleGroupItem value="bar" size="sm">
                        <BarChart4 className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="line" size="sm">
                        <LineChart className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="radar" size="sm">
                        <svg 
                          viewBox="0 0 24 24" 
                          className="h-4 w-4"
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                          <line x1="12" y1="2" x2="12" y2="4" />
                          <line x1="12" y1="20" x2="12" y2="22" />
                        </svg>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="pie" size="sm">
                        <PieChart className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  {/* Chart Visualization */}
                  <div className="border rounded-md p-3 mb-4">
                    {renderChart()}
                  </div>
                  
                  {/* Comparison Table */}
                  <Tabs defaultValue="chart" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chart">Chart View</TabsTrigger>
                      <TabsTrigger value="table">Table View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chart" className="pt-4">
                      {renderChart()}
                    </TabsContent>
                    <TabsContent value="table" className="pt-4">
                      {renderComparisonTable()}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium">No Comparison Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a comparison to see results
                </p>
                <Button onClick={generateComparison}>
                  Generate Comparison
                </Button>
              </div>
            )}
          </>
        );
        
      default:
        return null;
    }
  };

  // Render the wizard
  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Neighborhood Comparison Wizard
          </CardTitle>
          
          {onClose && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Comparison?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to exit? Your comparison selections will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, Continue</AlertDialogCancel>
                  <AlertDialogAction onClick={onClose}>
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <CardDescription>
          Compare neighborhoods across multiple metrics to find your ideal location
        </CardDescription>
        
        {/* Wizard progress steps */}
        <div className="flex items-center mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <React.Fragment key={i}>
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  step > i 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : step === i + 1
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground"
                )}
              >
                {step > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              
              {i < 3 && (
                <div 
                  className={cn(
                    "flex-grow h-1 mx-2",
                    step > i + 1 ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step title */}
        <div className="flex justify-between items-center mt-2">
          <div>
            {step === 1 && <p className="text-sm font-medium">Select Neighborhoods</p>}
            {step === 2 && <p className="text-sm font-medium">Choose Metrics</p>}
            {step === 3 && <p className="text-sm font-medium">Visualization Options</p>}
            {step === 4 && <p className="text-sm font-medium">View Results</p>}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Step {step} of 4
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        {step > 1 && step !== 4 ? (
          <Button 
            variant="outline" 
            onClick={handlePreviousStep}
          >
            Back
          </Button>
        ) : (
          <div></div>
        )}
        
        {step < 4 ? (
          <Button onClick={handleNextStep}>
            {step === 3 ? 'Generate Comparison' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
          >
            New Comparison
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NeighborhoodComparisonWizard;