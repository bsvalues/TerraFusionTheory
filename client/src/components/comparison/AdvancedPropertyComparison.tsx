/**
 * Advanced Property Comparison Tool
 * 
 * This component provides comprehensive side-by-side comparison of properties
 * with advanced metrics, visualization options, and customizable categories.
 */

import React, { useState, useMemo } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BarChart,
  ChevronDown,
  ChevronUp,
  Home,
  ListFilter,
  Search,
  Trash2,
  LineChart,
  Table as TableIcon,
  Layers,
  PlusCircle,
  Grid,
  DollarSign,
  HeartPulse,
  Settings,
  LineChart as LineChartIcon
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useAdvancedComparison, PropertyForComparison, ComparisonCategory } from '@/context/AdvancedComparisonContext';

interface AdvancedPropertyComparisonProps {
  className?: string;
}

/**
 * Helper function to format currency values
 */
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Helper function to format metric labels for display
 */
const formatMetricLabel = (metric: string): string => {
  // Handle nested properties
  const parts = metric.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Convert camelCase to Title Case with spaces
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

/**
 * Helper function to get value from property using dot notation
 */
const getPropertyValue = (property: PropertyForComparison, metric: string): any => {
  // Use type assertion for TypeScript
  return metric.split('.').reduce((obj, key) => {
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, any>)[key];
    }
    return undefined;
  }, property as unknown as Record<string, any>);
};

/**
 * Helper function to format property values for display
 */
const formatPropertyValue = (property: PropertyForComparison, metric: string): string => {
  const value = getPropertyValue(property, metric);
  
  if (value === undefined || value === null) {
    return 'N/A';
  }
  
  // Format based on metric type
  if (metric === 'price' || metric.includes('Cost')) {
    return formatCurrency(value);
  }
  
  if (metric === 'pricePerSqFt') {
    return `${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/sqft`;
  }
  
  if (typeof value === 'number') {
    if (metric.includes('Rate') || metric.includes('Yield')) {
      return `${value.toFixed(2)}%`;
    }
    
    if (metric.includes('Score') || metric.includes('Rating')) {
      return value.toFixed(1);
    }
    
    // For proximity metrics, return in miles
    if (metric.includes('proximity')) {
      return `${value.toFixed(1)} mi`;
    }
    
    // For risk metrics, show as percentage
    if (metric.includes('Risk')) {
      return `${(value * 100).toFixed(0)}%`;
    }
    
    return value.toLocaleString();
  }
  
  return value.toString();
};

/**
 * Get visualization color for a metric based on whether higher is better
 */
const getMetricColor = (metric: string, value: number, max: number): string => {
  // Metrics where lower values are better
  const lowerIsBetter = [
    'price', 'pricePerSqFt', 'taxRate', 'insuranceCost', 'estimatedMaintenance',
    'naturalHazardRisk.flood', 'naturalHazardRisk.fire', 'naturalHazardRisk.earthquake', 'naturalHazardRisk.overall',
    'proximityToAmenities.shopping', 'proximityToAmenities.dining', 'proximityToAmenities.parks',
    'proximityToAmenities.schools', 'proximityToAmenities.healthcare', 'proximityToAmenities.transportation'
  ];
  
  // Calculate normalized value (0-1)
  const normalizedValue = max === 0 ? 0 : value / max;
  
  // Determine if higher or lower is better for this metric
  const isLowerBetter = lowerIsBetter.some(m => metric.includes(m));
  
  // Invert score if lower is better
  const score = isLowerBetter ? 1 - normalizedValue : normalizedValue;
  
  // Green: good, Yellow: moderate, Red: poor
  if (score > 0.7) return 'bg-green-500';
  if (score > 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Helper function to determine if a metric should be highlighted based on significant differences
 */
const shouldHighlightDifference = (properties: PropertyForComparison[], metric: string): boolean => {
  const values = properties.map(p => getPropertyValue(p, metric)).filter(v => v !== undefined && v !== null);
  
  if (values.length < 2) return false;
  
  // Get min and max values
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Check if there's a significant difference
  // For percentages or scores, use absolute difference
  if (metric.includes('Score') || metric.includes('Rating') || metric.includes('Rate') || metric.includes('Risk')) {
    return max - min > 0.5;
  }
  
  // For prices, use percentage difference
  if (metric === 'price' || metric.includes('Cost')) {
    return (max - min) / min > 0.1; // 10% difference
  }
  
  // For counts (bedrooms, bathrooms), any difference is significant
  if (metric === 'bedrooms' || metric === 'bathrooms') {
    return max !== min;
  }
  
  // For square footage, use percentage difference
  if (metric === 'squareFeet' || metric === 'lotSize') {
    return (max - min) / min > 0.1; // 10% difference
  }
  
  // For other numeric values, use percentage difference
  return (max - min) / min > 0.2; // 20% difference
};

const AdvancedPropertyComparison: React.FC<AdvancedPropertyComparisonProps> = ({ className }) => {
  const {
    properties,
    removeProperty,
    clearProperties,
    selectedCategories,
    toggleCategory,
    visualizationType,
    setVisualizationType,
    comparisonMode,
    setComparisonMode,
    categories,
    getAvailableMetrics,
    getShowOnlyCategoryDifferences,
    setShowOnlyCategoryDifferences
  } = useAdvancedComparison();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [highlightedPropertyIndex, setHighlightedPropertyIndex] = useState<number | null>(null);
  
  // Filter metrics based on search term
  const filteredMetrics = useMemo(() => {
    const availableMetrics = getAvailableMetrics();
    
    if (!searchTerm.trim()) {
      return availableMetrics;
    }
    
    return availableMetrics.filter(metric => 
      formatMetricLabel(metric).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, getAvailableMetrics]);
  
  // Get the categories that match the current filtered metrics
  const visibleCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return selectedCategories;
    }
    
    return categories
      .filter(category => selectedCategories.includes(category.id))
      .filter(category => 
        category.metrics.some(metric => 
          formatMetricLabel(metric).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .map(category => category.id);
  }, [searchTerm, selectedCategories, categories]);
  
  // Should we show only metrics with differences
  const showOnlyDifferences = getShowOnlyCategoryDifferences();
  
  // Determine which metrics should be visible based on filtering
  const visibleMetrics = useMemo(() => {
    let metrics = filteredMetrics;
    
    // If we should only show differences
    if (showOnlyDifferences) {
      metrics = metrics.filter(metric => shouldHighlightDifference(properties, metric));
    }
    
    return metrics;
  }, [filteredMetrics, showOnlyDifferences, properties]);
  
  // Toggle a category expansion state
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // No properties to compare
  if (properties.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <BarChart className="mr-2 h-6 w-6 text-primary" />
            Advanced Property Comparison
          </CardTitle>
          <CardDescription>
            Select properties to compare them side-by-side with detailed metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-10">
          <Home className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Properties Selected</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Select properties from the property listings or search results to add them to the comparison tool.
          </p>
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Browse Properties
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Generate chart data for the radar chart
  const generateRadarChartData = () => {
    // Define the metrics to include in the radar chart
    const radarMetrics = [
      { key: 'pricePerSqFt', label: 'Price/SqFt', inverted: true },
      { key: 'schoolRating', label: 'Schools' },
      { key: 'walkabilityScore', label: 'Walkability' },
      { key: 'neighborhoodRating', label: 'Neighborhood' },
      { key: 'energyEfficiencyScore', label: 'Energy Efficiency' },
      { key: 'naturalHazardRisk.overall', label: 'Safety', inverted: true }
    ];
    
    // Map the radar metrics to data points
    return radarMetrics.map(metric => {
      const entry: any = { metric: metric.label };
      
      properties.forEach((property, index) => {
        let value = getPropertyValue(property, metric.key);
        
        // Handle missing values
        if (value === undefined || value === null) {
          value = 0;
        }
        
        // Normalize the value to 0-100 range
        let normalizedValue = value;
        
        if (metric.key === 'pricePerSqFt') {
          // Invert and normalize price (lower is better)
          const maxPrice = Math.max(...properties.map(p => p.pricePerSqFt || 0));
          normalizedValue = maxPrice === 0 ? 0 : 100 - (value / maxPrice * 100);
        } else if (metric.key === 'naturalHazardRisk.overall') {
          // Invert risk (lower is better)
          normalizedValue = 100 - (value * 100);
        } else if (metric.key.includes('Score') || metric.key.includes('Rating')) {
          // Scores are typically 0-10, normalize to 0-100
          normalizedValue = value * 10;
        }
        
        // Make sure the value is between 0-100
        normalizedValue = Math.max(0, Math.min(100, normalizedValue));
        
        // Add to entry
        entry[`Property ${index + 1}`] = normalizedValue;
      });
      
      return entry;
    });
  };
  
  // Generate chart data for the bar chart
  const generateBarChartData = (metrics: string[]) => {
    return metrics.map(metric => {
      const entry: any = { 
        name: formatMetricLabel(metric) 
      };
      
      properties.forEach((property, index) => {
        const value = getPropertyValue(property, metric);
        
        // Handle missing values
        if (value === undefined || value === null) {
          entry[`Property ${index + 1}`] = 0;
        } else {
          entry[`Property ${index + 1}`] = value;
        }
      });
      
      return entry;
    });
  };
  
  // Calculate property specific stats
  const propertyStats = properties.map(property => {
    // Count metrics where this property is the best
    const bestMetricCount = visibleMetrics.filter(metric => {
      const value = getPropertyValue(property, metric);
      if (value === undefined || value === null) return false;
      
      // Metrics where lower values are better
      const lowerIsBetter = [
        'price', 'pricePerSqFt', 'taxRate', 'insuranceCost', 'estimatedMaintenance',
        'naturalHazardRisk.flood', 'naturalHazardRisk.fire', 'naturalHazardRisk.earthquake', 'naturalHazardRisk.overall',
        'proximityToAmenities.shopping', 'proximityToAmenities.dining', 'proximityToAmenities.parks',
        'proximityToAmenities.schools', 'proximityToAmenities.healthcare', 'proximityToAmenities.transportation'
      ];
      
      const isLowerBetter = lowerIsBetter.some(m => metric.includes(m));
      
      // Get values from all properties for this metric
      const values = properties
        .map(p => getPropertyValue(p, metric))
        .filter(v => v !== undefined && v !== null);
      
      // Find the best value
      const bestValue = isLowerBetter ? Math.min(...values) : Math.max(...values);
      
      // Check if this property has the best value
      return value === bestValue;
    }).length;
    
    return {
      bestMetricCount,
      bestPercentage: Math.round((bestMetricCount / visibleMetrics.length) * 100)
    };
  });
  
  // Custom colors for charts
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <BarChart className="mr-2 h-6 w-6 text-primary" />
              Advanced Property Comparison
            </CardTitle>
            <CardDescription>
              Comparing {properties.length} {properties.length === 1 ? 'property' : 'properties'} across {visibleMetrics.length} metrics
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearProperties}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison Mode Selection */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center pb-2 border-b">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">Comparison Mode:</div>
            <ToggleGroup type="single" value={comparisonMode} onValueChange={(value) => value && setComparisonMode(value as any)}>
              <ToggleGroupItem value="standard" className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Standard</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="investment" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Investment</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="livability" className="flex items-center">
                <HeartPulse className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Livability</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="custom" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Custom</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">View as:</div>
            <ToggleGroup type="single" value={visualizationType} onValueChange={(value) => value && setVisualizationType(value as any)}>
              <ToggleGroupItem value="table" className="flex items-center">
                <TableIcon className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Table</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="chart" className="flex items-center">
                <LineChartIcon className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Charts</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="cards" className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Cards</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        
        {/* Properties Overview Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {properties.map((property, index) => (
            <Card key={property.id} className="relative">
              <CardHeader className="p-4 pb-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-8 w-8" 
                  onClick={() => removeProperty(property.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">
                  Property {index + 1}: {property.address.split(',')[0]}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline">
                    {formatCurrency(property.price)}
                  </Badge>
                  <Badge variant="outline">
                    {property.bedrooms} bed, {property.bathrooms} bath
                  </Badge>
                  <Badge variant="outline">
                    {property.squareFeet.toLocaleString()} sqft
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">Wins in {propertyStats[index].bestMetricCount} categories ({propertyStats[index].bestPercentage}%)</div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${propertyStats[index].bestPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Filtering Tools */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-differences"
              checked={showOnlyDifferences}
              onCheckedChange={(checked) => setShowOnlyCategoryDifferences(!!checked)}
            />
            <label
              htmlFor="show-differences"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show only significant differences
            </label>
          </div>
        </div>
        
        {/* Visualization Tabs */}
        {visualizationType === 'table' && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Metric</TableHead>
                  {properties.map((property, index) => (
                    <TableHead key={property.id}>
                      Property {index + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .filter(category => visibleCategories.includes(category.id))
                  .map(category => {
                    // Filter metrics for this category
                    const categoryMetrics = category.metrics.filter(metric => 
                      visibleMetrics.includes(metric)
                    );
                    
                    // Skip empty categories
                    if (categoryMetrics.length === 0) return null;
                    
                    return (
                      <React.Fragment key={category.id}>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={properties.length + 1} className="py-2">
                            <button
                              className="flex items-center text-sm font-medium w-full focus:outline-none"
                              onClick={() => toggleCategoryExpansion(category.id)}
                            >
                              {expandedCategories[category.id] === false ? (
                                <ChevronDown className="h-4 w-4 mr-2" />
                              ) : (
                                <ChevronUp className="h-4 w-4 mr-2" />
                              )}
                              {category.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({categoryMetrics.length} metrics)
                              </span>
                            </button>
                          </TableCell>
                        </TableRow>
                        
                        {expandedCategories[category.id] !== false && (
                          <>
                            {categoryMetrics.map(metric => {
                              const isHighlighted = shouldHighlightDifference(properties, metric);
                              
                              return (
                                <TableRow 
                                  key={metric} 
                                  className={isHighlighted ? 'bg-muted/30' : undefined}
                                >
                                  <TableCell className="font-medium">
                                    {formatMetricLabel(metric)}
                                    {isHighlighted && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        Differs
                                      </Badge>
                                    )}
                                  </TableCell>
                                  
                                  {properties.map((property, index) => {
                                    const value = getPropertyValue(property, metric);
                                    const allValues = properties
                                      .map(p => getPropertyValue(p, metric))
                                      .filter(v => v !== undefined && v !== null);
                                    
                                    const max = Math.max(...allValues);
                                    
                                    // If value is a number and metric should be visualized
                                    const shouldVisualize = 
                                      typeof value === 'number' && 
                                      isHighlighted && 
                                      allValues.length > 1;
                                    
                                    return (
                                      <TableCell 
                                        key={property.id}
                                        className={
                                          highlightedPropertyIndex === index
                                            ? 'bg-muted/50'
                                            : undefined
                                        }
                                      >
                                        {shouldVisualize ? (
                                          <div className="flex items-center space-x-2">
                                            <span>{formatPropertyValue(property, metric)}</span>
                                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                              <div
                                                className={`h-full ${getMetricColor(metric, value, max)} rounded-full`}
                                                style={{ width: `${(value / max) * 100}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        ) : (
                                          formatPropertyValue(property, metric)
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {visualizationType === 'chart' && (
          <Tabs defaultValue="radar">
            <TabsList className="mb-4">
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Charts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="radar" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Property Comparison Radar</CardTitle>
                  <CardDescription>
                    Compare properties across key metrics in a radar chart
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius="80%" data={generateRadarChartData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        
                        {properties.map((property, index) => (
                          <Radar
                            key={property.id}
                            name={`Property ${index + 1}`}
                            dataKey={`Property ${index + 1}`}
                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bar" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Key Metrics Comparison</CardTitle>
                  <CardDescription>
                    Compare properties across individual metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-8">
                      {categories
                        .filter(category => visibleCategories.includes(category.id))
                        .map(category => {
                          // Filter metrics for this category
                          const categoryMetrics = category.metrics.filter(metric => 
                            visibleMetrics.includes(metric)
                          );
                          
                          // Skip empty categories
                          if (categoryMetrics.length === 0) return null;
                          
                          return (
                            <div key={category.id}>
                              <Collapsible
                                defaultOpen
                                className="w-full"
                              >
                                <CollapsibleTrigger className="flex items-center text-lg font-semibold mb-4 w-full text-left">
                                  <div className="flex-1">{category.name}</div>
                                  <ChevronDown className="h-4 w-4" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-6">
                                  {categoryMetrics.map(metric => {
                                    // Skip metrics that don't have numeric values
                                    const hasNumericValues = properties.some(property => {
                                      const value = getPropertyValue(property, metric);
                                      return typeof value === 'number';
                                    });
                                    
                                    if (!hasNumericValues) return null;
                                    
                                    return (
                                      <div key={metric} className="space-y-2">
                                        <h4 className="text-sm font-medium">{formatMetricLabel(metric)}</h4>
                                        <div className="h-[200px]">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <RechartsBarChart
                                              data={[{
                                                name: formatMetricLabel(metric),
                                                ...properties.reduce((acc, property, index) => {
                                                  const value = getPropertyValue(property, metric);
                                                  acc[`Property ${index + 1}`] = typeof value === 'number' ? value : 0;
                                                  return acc;
                                                }, {})
                                              }]}
                                              layout="vertical"
                                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                              <CartesianGrid strokeDasharray="3 3" />
                                              <XAxis type="number" />
                                              <YAxis type="category" dataKey="name" />
                                              <Tooltip formatter={(value, name) => {
                                                // Format the value based on the metric
                                                if (metric === 'price' || metric.includes('Cost')) {
                                                  return [formatCurrency(value as number), name];
                                                }
                                                
                                                if (metric === 'pricePerSqFt') {
                                                  return [`${(value as number).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/sqft`, name];
                                                }
                                                
                                                if (typeof value === 'number') {
                                                  if (metric.includes('Rate') || metric.includes('Yield')) {
                                                    return [`${(value as number).toFixed(2)}%`, name];
                                                  }
                                                  
                                                  if (metric.includes('Score') || metric.includes('Rating')) {
                                                    return [(value as number).toFixed(1), name];
                                                  }
                                                  
                                                  if (metric.includes('proximity')) {
                                                    return [`${(value as number).toFixed(1)} mi`, name];
                                                  }
                                                  
                                                  if (metric.includes('Risk')) {
                                                    return [`${((value as number) * 100).toFixed(0)}%`, name];
                                                  }
                                                }
                                                
                                                return [value, name];
                                              }} />
                                              <Legend />
                                              
                                              {properties.map((property, index) => (
                                                <Bar
                                                  key={property.id}
                                                  dataKey={`Property ${index + 1}`}
                                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                              ))}
                                            </RechartsBarChart>
                                          </ResponsiveContainer>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {visualizationType === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter(category => visibleCategories.includes(category.id))
              .map(category => {
                // Filter metrics for this category
                const categoryMetrics = category.metrics.filter(metric => 
                  visibleMetrics.includes(metric)
                );
                
                // Skip empty categories
                if (categoryMetrics.length === 0) return null;
                
                return (
                  <Card key={category.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-4">
                          {categoryMetrics.map(metric => {
                            // Get values for this metric
                            const values = properties.map(property => ({
                              id: property.id,
                              value: getPropertyValue(property, metric)
                            })).filter(item => item.value !== undefined && item.value !== null);
                            
                            // Skip if no values
                            if (values.length === 0) return null;
                            
                            // Determine if this is a numeric metric
                            const isNumeric = typeof values[0].value === 'number';
                            
                            // For numeric values, find the best property
                            let bestPropertyId = null;
                            if (isNumeric && values.length > 1) {
                              // Metrics where lower values are better
                              const lowerIsBetter = [
                                'price', 'pricePerSqFt', 'taxRate', 'insuranceCost', 'estimatedMaintenance',
                                'naturalHazardRisk.flood', 'naturalHazardRisk.fire', 'naturalHazardRisk.earthquake', 'naturalHazardRisk.overall',
                                'proximityToAmenities.shopping', 'proximityToAmenities.dining', 'proximityToAmenities.parks',
                                'proximityToAmenities.schools', 'proximityToAmenities.healthcare', 'proximityToAmenities.transportation'
                              ];
                              
                              const isLowerBetter = lowerIsBetter.some(m => metric.includes(m));
                              
                              // Find the best value
                              const bestValue = isLowerBetter
                                ? Math.min(...values.map(v => v.value as number))
                                : Math.max(...values.map(v => v.value as number));
                              
                              // Find property with best value
                              bestPropertyId = values.find(v => v.value === bestValue)?.id;
                            }
                            
                            return (
                              <div key={metric} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium">{formatMetricLabel(metric)}</h4>
                                  {shouldHighlightDifference(properties, metric) && (
                                    <Badge variant="outline" className="text-xs">
                                      Differs
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  {properties.map((property, index) => {
                                    const value = getPropertyValue(property, metric);
                                    const formattedValue = formatPropertyValue(property, metric);
                                    
                                    // Skip if no value
                                    if (value === undefined || value === null) {
                                      return (
                                        <div key={property.id} className="flex justify-between items-center">
                                          <span className="text-sm">Property {index + 1}</span>
                                          <span className="text-sm text-muted-foreground">N/A</span>
                                        </div>
                                      );
                                    }
                                    
                                    // Check if this property has the best value
                                    const isBest = bestPropertyId === property.id;
                                    
                                    return (
                                      <div key={property.id} className="flex justify-between items-center">
                                        <span className="text-sm">Property {index + 1}</span>
                                        <span 
                                          className={`text-sm ${isBest ? 'font-semibold' : ''}`}
                                        >
                                          {formattedValue}
                                          {isBest && (
                                            <span className="ml-1 text-xs text-green-600">★</span>
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-4 text-sm text-muted-foreground">
        <div className="flex justify-between w-full">
          <div>
            Showing {visibleMetrics.length} of {getAvailableMetrics().length} available metrics
          </div>
          <div>
            {searchTerm && `Filtering by: "${searchTerm}"`}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdvancedPropertyComparison;