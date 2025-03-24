import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle,
  Calculator,
  Home, 
  Check,
  CircleDollarSign,
  Loader2 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  squareFeet: z.coerce.number().min(1, 'Square feet must be greater than 0'),
  bedrooms: z.coerce.number().min(0, 'Bedrooms cannot be negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms cannot be negative'),
  yearBuilt: z.coerce.number().min(1800, 'Year built should be after 1800').max(new Date().getFullYear(), `Year built cannot be in the future`),
  lotSize: z.coerce.number().min(0, 'Lot size cannot be negative'),
  garageSize: z.coerce.number().min(0, 'Garage size cannot be negative').optional(),
  propertyType: z.string().optional(),
  neighborhood: z.string().optional(),
  modelId: z.string().min(1, 'Please select a valuation model'),
});

type FormValues = z.infer<typeof formSchema>;

interface Model {
  id: string;
  name: string;
  description: string;
  type: 'additive' | 'multiplicative' | 'hybrid' | 'nonlinear';
  propertyClass: string;
  created: string;
}

interface PropertyValuationProps {
  models: Model[] | undefined;
}

interface ValuationResult {
  propertyId: string;
  address: string;
  estimatedValue: number;
  confidenceScore: number;
  valueRange: [number, number];
  valuationDate: string;
  factors: Record<string, number>;
  modelId: string;
}

const PropertyValuation = ({ models }: PropertyValuationProps) => {
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
      squareFeet: 0,
      bedrooms: 0,
      bathrooms: 0,
      yearBuilt: 2000,
      lotSize: 0,
      garageSize: 0,
      propertyType: 'Residential',
      neighborhood: '',
      modelId: '',
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      // Get model ID from form data and create the URL
      const url = `/api/mass-appraisal/models/${data.modelId}/value`;
      
      // Create the property object from form data
      const property = {
        address: data.address,
        squareFeet: data.squareFeet,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        yearBuilt: data.yearBuilt,
        lotSize: data.lotSize,
        garageSize: data.garageSize,
        propertyType: data.propertyType,
        neighborhood: data.neighborhood,
      };
      
      return apiRequest(url, { 
        method: 'POST', 
        body: JSON.stringify({ property }),
        headers: {
          'Content-Type': 'application/json'
        } 
      });
    },
    onSuccess: (data) => {
      setValuationResult(data);
      toast({
        title: "Property Valuation Complete",
        description: "The property has been valued successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Valuation Failed",
        description: error?.message || "Failed to value property. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Valuation</CardTitle>
          <CardDescription>
            Enter property details to calculate its estimated value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valuation Model</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a valuation model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {models?.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name} ({model.propertyClass})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose an appropriate valuation model for this property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Grandview, WA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="squareFeet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Square Feet</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lotSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Size (sq ft)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="garageSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garage Size</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Built</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                      </SelectContent>
                    </Select>
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
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Property Value
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Valuation Results</CardTitle>
          <CardDescription>
            Estimated property value and valuation factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!valuationResult && !mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
              <Home className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Valuation Results</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Fill out the property information form and click "Calculate Property Value" to see the
                valuation results for your property.
              </p>
            </div>
          )}
          
          {mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium">Calculating Property Value</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we analyze comparable properties and market conditions...
              </p>
            </div>
          )}
          
          {mutation.isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Valuation Failed</AlertTitle>
              <AlertDescription>
                {(mutation.error as any)?.message || "There was an error valuing this property. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          
          {valuationResult && (
            <div className="space-y-6">
              <div className="text-center p-6 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Estimated Value</div>
                <div className="text-4xl font-bold text-primary">
                  ${valuationResult.estimatedValue.toLocaleString()}
                </div>
                <div className="text-sm mt-2 text-muted-foreground">
                  Range: ${valuationResult.valueRange[0].toLocaleString()} - ${valuationResult.valueRange[1].toLocaleString()}
                </div>
                <div className="flex items-center justify-center mt-2">
                  <div className="text-sm font-medium text-muted-foreground mr-1">
                    Confidence:
                  </div>
                  <div className="text-sm font-medium">
                    {valuationResult.confidenceScore}%
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Valuation Factors</h3>
                <div className="space-y-3">
                  {Object.entries(valuationResult.factors || {}).map(([factor, value]) => (
                    <div key={factor} className="flex justify-between items-center">
                      <span className="text-sm">{factor}</span>
                      <span className="text-sm font-medium">${value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <CircleDollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Valuation Details</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span>{valuationResult.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valuation Date</span>
                    <span>{new Date(valuationResult.valuationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span>{models?.find(m => m.id === valuationResult.modelId)?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  Save Report
                </Button>
                <Button>
                  <Check className="mr-2 h-4 w-4" />
                  Apply Valuation
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyValuation;