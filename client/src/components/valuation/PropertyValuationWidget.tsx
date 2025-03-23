import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  BadgeDollarSign as LucideBadgeDollarSign,
  Building as LucideBuilding,
  Calculator as LucideCalculator,
  Home as LucideHome,
  Info as LucideInfo,
  RefreshCw as LucideRefreshCw,
  Ruler as LucideRuler,
  MapPin as LucideMapPin,
  Bed as LucideBed,
  Bath as LucideBath,
  Calendar as LucideCalendar,
  Minimize2 as LucideMinimize2,
  Maximize2 as LucideMaximize2,
  ArrowRight as LucideArrowRight,
} from 'lucide-react';

// Property valuation form schema
const valuationFormSchema = z.object({
  propertyType: z.string({ required_error: "Please select a property type" }),
  bedrooms: z.string({ required_error: "Please select number of bedrooms" }),
  bathrooms: z.string({ required_error: "Please select number of bathrooms" }),
  squareFeet: z.string({ required_error: "Please enter the square footage" }),
  yearBuilt: z.string({ required_error: "Please enter the year built" }),
  lotSize: z.string().optional(),
  address: z.string().optional(),
  zip: z.string().optional(),
});

// Define the transformed type with numeric values
interface TransformedFormData {
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize?: number;
  address?: string;
  zip?: string;
}

// Transform schema for validation and submission
const transformedSchema = valuationFormSchema.transform((data): TransformedFormData => ({
  ...data,
  bedrooms: parseInt(data.bedrooms, 10),
  bathrooms: parseFloat(data.bathrooms),
  squareFeet: parseInt(data.squareFeet.replace(/,/g, ''), 10),
  yearBuilt: parseInt(data.yearBuilt, 10),
  lotSize: data.lotSize ? parseFloat(data.lotSize) : undefined,
}));

type ValuationFormType = z.infer<typeof valuationFormSchema>;

// Property valuation result
interface PropertyValuation {
  estimatedValue: number;
  valueRange: {
    low: number;
    high: number;
  };
  confidenceScore: number;
  comparableProperties: Array<{
    address: string;
    salePrice: number;
    squareFeet: number;
    bedrooms: number;
    bathrooms: number;
    yearBuilt: number;
    distanceInMiles: number; // from subject property
    adjustedPrice: number; // adjusted for differences
  }>;
  keyFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    valueImpact: number; // percentage or dollar amount
  }>;
  pricePerSqFt: number;
}

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Format number with commas
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export default function PropertyValuationWidget() {
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(75);
  const [showComparables, setShowComparables] = useState(false);
  
  // Setup form
  const form = useForm<ValuationFormType>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      propertyType: '',
      bedrooms: '',  // These will be transformed to numbers by the schema
      bathrooms: '', // But are initially strings in the form
      squareFeet: '',
      yearBuilt: '',
      lotSize: '',
      address: '',
      zip: ''
    }
  });

  // Handle form submission
  const onSubmit = async (data: ValuationFormType) => {
    toast({
      title: "Analyzing property data",
      description: "Calculating valuation based on market data and comparables...",
    });
    
    // Transform the string data to the numerical values needed
    const transformedData = transformedSchema.parse(data);
    
    // Simulate API call with a delay
    setTimeout(() => {
      const mockValuation: PropertyValuation = generateMockValuation(transformedData);
      setValuation(mockValuation);
      setConfidenceLevel(mockValuation.confidenceScore);
    }, 1500);
  };
  
  // Generate mock valuation data based on form inputs
  const generateMockValuation = (data: TransformedFormData): PropertyValuation => {
    // Basic price calculation based on square footage and location
    const basePricePerSqFt = Math.floor(250 + Math.random() * 150); // $250-400 per sqft
    const baseValue = data.squareFeet * basePricePerSqFt;
    
    // Adjustments
    const bedroomAdjustment = (data.bedrooms - 3) * 15000; // +/- $15k per bedroom diff from 3
    const bathroomAdjustment = (data.bathrooms - 2) * 10000; // +/- $10k per bathroom diff from 2
    const ageAdjustment = ((2025 - data.yearBuilt) > 20) ? -25000 : 0; // -$25k if older than 20 years
    
    // Calculate estimated value
    const estimatedValue = baseValue + bedroomAdjustment + bathroomAdjustment + ageAdjustment;
    
    // Generate range (10% spread)
    const rangeFactor = 0.1;
    const lowValue = Math.round(estimatedValue * (1 - rangeFactor));
    const highValue = Math.round(estimatedValue * (1 + rangeFactor));
    
    // Generate comparable properties
    const comparableProperties = Array.from({ length: 3 }, (_, i) => {
      const sqFtVariance = Math.floor(data.squareFeet * (0.9 + Math.random() * 0.2)); // +/- 10%
      const bedroomVariance = Math.max(1, data.bedrooms + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 1 : 0));
      const bathroomVariance = Math.max(1, data.bathrooms + (Math.random() > 0.5 ? 0.5 : -0.5) * (Math.random() > 0.7 ? 1 : 0));
      const yearBuiltVariance = data.yearBuilt + Math.floor(Math.random() * 10) - 5; // +/- 5 years
      const salePrice = Math.round(estimatedValue * (0.9 + Math.random() * 0.2)); // +/- 10%
      
      return {
        address: `${100 + i} ${['Maple', 'Oak', 'Pine'][i]} St, ${data.zip || 'Grandview, WA'}`,
        salePrice,
        squareFeet: sqFtVariance,
        bedrooms: bedroomVariance,
        bathrooms: bathroomVariance,
        yearBuilt: yearBuiltVariance,
        distanceInMiles: parseFloat((0.2 + Math.random() * 0.8).toFixed(1)),
        adjustedPrice: salePrice
      };
    });
    
    // Key factors affecting value
    const keyFactors = [
      {
        factor: 'Location',
        impact: 'positive' as const,
        description: 'Desirable neighborhood with good schools',
        valueImpact: Math.floor(estimatedValue * 0.15) // 15% impact
      },
      {
        factor: 'Property Size',
        impact: data.squareFeet > 2000 ? 'positive' as const : 'neutral' as const,
        description: `${data.squareFeet} sq ft is ${data.squareFeet > 2000 ? 'above' : 'near'} average for the area`,
        valueImpact: data.squareFeet > 2000 ? Math.floor(estimatedValue * 0.08) : 0 // 8% impact or none
      },
      {
        factor: 'Property Age',
        impact: (2025 - data.yearBuilt) > 20 ? 'negative' as const : 'positive' as const,
        description: `Built in ${data.yearBuilt} (${2025 - data.yearBuilt} years old)`,
        valueImpact: (2025 - data.yearBuilt) > 20 ? -25000 : 15000
      }
    ];
    
    return {
      estimatedValue,
      valueRange: {
        low: lowValue,
        high: highValue
      },
      confidenceScore: Math.round(70 + Math.random() * 20), // 70-90%
      comparableProperties,
      keyFactors,
      pricePerSqFt: basePricePerSqFt
    };
  };
  
  // Get confidence level color
  const getConfidenceLevelColor = (level: number) => {
    if (level >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (level >= 60) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (level >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };
  
  // Get impact color 
  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get impact icon
  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return <LucideMaximize2 className="h-4 w-4" />;
      case 'negative': return <LucideMinimize2 className="h-4 w-4" />;
      case 'neutral': return <LucideArrowRight className="h-4 w-4" />;
      default: return <LucideArrowRight className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full h-full overflow-hidden shadow-lg animate-in fade-in-50 duration-700">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            <LucideCalculator className="mr-2 h-5 w-5 text-primary" />
            Property Valuation
          </CardTitle>
          <Badge variant="outline" className="font-normal text-xs flex items-center">
            <LucideInfo className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Get an estimated value for any property based on market data and comparables
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2 px-4 overflow-y-auto">
        {!valuation ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Type */}
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single-family">Single Family Home</SelectItem>
                          <SelectItem value="condo">Condominium</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="multi-family">Multi-Family</SelectItem>
                          <SelectItem value="land">Vacant Land</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bedrooms */}
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bedrooms" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Bathrooms */}
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bathrooms" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'].map(num => (
                            <SelectItem key={num} value={num}>
                              {num} {num === '1' ? 'Bathroom' : 'Bathrooms'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* ZIP Code */}
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="98930" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Square Feet */}
                <FormField
                  control={form.control}
                  name="squareFeet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Square Feet</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="2,000" 
                          {...field} 
                          onChange={(e) => {
                            // Format with commas as they type
                            const value = e.target.value.replace(/,/g, '');
                            const formatted = value ? formatNumber(parseInt(value)) : '';
                            e.target.value = formatted;
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Year Built */}
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Built</FormLabel>
                      <FormControl>
                        <Input placeholder="2000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Lot Size */}
                <FormField
                  control={form.control}
                  name="lotSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Size (Acres, Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full mt-4">
                Calculate Property Value
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {/* Valuation Result */}
            <div className="text-center py-4">
              <h3 className="text-lg font-medium mb-2">Estimated Property Value</h3>
              <div className="text-3xl font-bold text-primary mb-1">
                {formatCurrency(valuation.estimatedValue)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Range: {formatCurrency(valuation.valueRange.low)} - {formatCurrency(valuation.valueRange.high)}
              </div>
              <div className="flex items-center justify-center mb-4">
                <Badge 
                  variant="outline"
                  className={`${getConfidenceLevelColor(confidenceLevel)}`}
                >
                  {confidenceLevel}% Confidence
                </Badge>
              </div>
              <div className="text-sm">
                {formatCurrency(valuation.pricePerSqFt)} per square foot
              </div>
            </div>
            
            {/* Key Value Factors */}
            <div>
              <h4 className="text-sm font-medium mb-3">Key Value Factors</h4>
              <div className="space-y-3">
                {valuation.keyFactors.map((factor, index) => (
                  <div key={index} className="flex items-start p-3 border rounded-md bg-card/30">
                    <div className={`flex-shrink-0 mr-3 ${getImpactColor(factor.impact)}`}>
                      {getImpactIcon(factor.impact)}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{factor.factor}</div>
                      <div className="text-sm text-muted-foreground">{factor.description}</div>
                    </div>
                    <div className={`flex-shrink-0 text-right font-medium ${getImpactColor(factor.impact)}`}>
                      {factor.impact !== 'neutral' ? (factor.impact === 'positive' ? '+' : '-') : ''}
                      {Math.abs(factor.valueImpact) > 1000 
                        ? formatCurrency(Math.abs(factor.valueImpact))
                        : `${Math.abs(factor.valueImpact)}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Comparable Properties */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium">Comparable Properties</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setShowComparables(!showComparables)}
                >
                  {showComparables ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
              
              {showComparables ? (
                <div className="space-y-3">
                  {valuation.comparableProperties.map((property, index) => (
                    <Card key={index} className="border border-primary/10">
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium flex items-center">
                              <LucideMapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                              {property.address}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.distanceInMiles} miles away
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">
                              {formatCurrency(property.salePrice)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(Math.round(property.salePrice / property.squareFeet))} per sq ft
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center">
                            <LucideRuler className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatNumber(property.squareFeet)} sq ft
                          </div>
                          <div className="flex items-center">
                            <LucideBed className="h-3 w-3 mr-1 text-muted-foreground" />
                            {property.bedrooms} BR
                          </div>
                          <div className="flex items-center">
                            <LucideBath className="h-3 w-3 mr-1 text-muted-foreground" />
                            {property.bathrooms} BA
                          </div>
                          <div className="flex items-center">
                            <LucideCalendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            Built {property.yearBuilt}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={valuation.comparableProperties.map((prop, idx) => ({
                        name: `Comp ${idx + 1}`,
                        value: prop.salePrice,
                        sqft: prop.squareFeet
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                      <Tooltip
                        formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Price']}
                        labelFormatter={(label) => `Comparable ${label.split(' ')[1]}`}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Sale Price" fill="#8884d8">
                        {valuation.comparableProperties.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {/* Reset Button */}
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setValuation(null);
                  form.reset();
                }}
              >
                Calculate Another Property
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 pb-3 px-4 border-t bg-card/50 text-xs text-muted-foreground flex justify-between items-center">
        <span>AI-powered valuation based on market analysis</span>
        {valuation && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => {
              const updatedValuation = {
                ...valuation,
                confidenceScore: Math.round(70 + Math.random() * 20)
              };
              setValuation(updatedValuation);
              setConfidenceLevel(updatedValuation.confidenceScore);
              toast({
                title: "Valuation refreshed",
                description: "Recalculated using the latest market data",
              });
            }}
          >
            <LucideRefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}