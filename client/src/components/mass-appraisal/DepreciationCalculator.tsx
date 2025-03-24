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
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle,
  Calculator,
  Clock,
  Building,
  Loader2 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  propertyAddress: z.string().min(1, 'Property address is required'),
  yearBuilt: z.coerce.number().min(1800, 'Year built should be after 1800').max(new Date().getFullYear(), `Year built cannot be in the future`),
  effectiveAge: z.coerce.number().min(0, 'Effective age cannot be negative'),
  economicLife: z.coerce.number().min(1, 'Economic life must be greater than 0'),
  qualityClass: z.string().min(1, 'Quality class is required'),
  replacementCost: z.coerce.number().min(1, 'Replacement cost must be greater than 0'),
  condition: z.string().min(1, 'Condition is required'),
  functionalUtility: z.string().min(1, 'Functional utility is required'),
  externalFactors: z.string().min(1, 'External factors assessment is required')
});

type FormValues = z.infer<typeof formSchema>;

interface DepreciationResult {
  physicalDepreciation: number;
  functionalObsolescence: number;
  externalObsolescence: number;
  totalDepreciation: number;
  remainingEconomicLife: number;
  depreciatedValue: number;
  physicalDepreciationPercent: number;
  functionalObsolescencePercent: number;
  externalObsolescencePercent: number;
  totalDepreciationPercent: number;
}

const DepreciationCalculator = () => {
  const [depreciationResult, setDepreciationResult] = useState<DepreciationResult | null>(null);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: '',
      yearBuilt: 2000,
      effectiveAge: 0,
      economicLife: 60,
      qualityClass: 'Average',
      replacementCost: 0,
      condition: 'Average',
      functionalUtility: 'Typical',
      externalFactors: 'Typical'
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const property = {
        address: data.propertyAddress,
        yearBuilt: data.yearBuilt,
        effectiveAge: data.effectiveAge,
        economicLife: data.economicLife,
        constructionQuality: data.qualityClass
      };
      
      return apiRequest('/api/mass-appraisal/depreciation', { 
        method: 'POST',
        body: JSON.stringify({
          property,
          effectiveAge: data.effectiveAge,
          qualityClass: data.qualityClass,
          replacementCost: data.replacementCost,
          condition: data.condition,
          functionalUtility: data.functionalUtility,
          externalFactors: data.externalFactors
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      setDepreciationResult(data);
      toast({
        title: "Depreciation Analysis Complete",
        description: "Accrued depreciation has been calculated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Calculation Failed",
        description: error?.message || "Failed to calculate depreciation. Please try again.",
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
          <CardTitle>Depreciation Calculator</CardTitle>
          <CardDescription>
            Calculate accrued depreciation using the breakdown method (IAAO standard)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="propertyAddress"
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
                  name="effectiveAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Age (years)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        May differ from chronological age
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="economicLife"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Economic Life (years)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="replacementCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replacement Cost New (RCN)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="qualityClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality Class</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="functionalUtility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Functional Utility</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select functional utility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Superior">Superior</SelectItem>
                        <SelectItem value="Typical">Typical</SelectItem>
                        <SelectItem value="Slight Deficiency">Slight Deficiency</SelectItem>
                        <SelectItem value="Moderate Deficiency">Moderate Deficiency</SelectItem>
                        <SelectItem value="Significant Deficiency">Significant Deficiency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assesses layout, design, and utility issues
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="externalFactors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Factors</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select external factors assessment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Superior">Superior Location</SelectItem>
                        <SelectItem value="Typical">Typical</SelectItem>
                        <SelectItem value="Slight Influence">Slight Negative Influence</SelectItem>
                        <SelectItem value="Moderate Influence">Moderate Negative Influence</SelectItem>
                        <SelectItem value="Significant Influence">Significant Negative Influence</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assesses location and external obsolescence factors
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
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Depreciation
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Depreciation Analysis</CardTitle>
          <CardDescription>
            Breakdown of physical, functional and external depreciation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!depreciationResult && !mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
              <Building className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Depreciation Results</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Fill out the property information form and click "Calculate Depreciation" to see the
                breakdown of accrued depreciation.
              </p>
            </div>
          )}
          
          {mutation.isPending && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium">Calculating Depreciation</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we analyze property age and condition factors...
              </p>
            </div>
          )}
          
          {mutation.isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Calculation Failed</AlertTitle>
              <AlertDescription>
                {(mutation.error as any)?.message || "There was an error calculating depreciation. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          
          {depreciationResult && (
            <div className="space-y-6">
              <div className="text-center p-6 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Depreciated Value</div>
                <div className="text-4xl font-bold text-primary">
                  ${depreciationResult.depreciatedValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Total Depreciation: ${depreciationResult.totalDepreciation.toLocaleString()} 
                  ({depreciationResult.totalDepreciationPercent.toFixed(1)}%)
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">
                    Remaining Economic Life: {depreciationResult.remainingEconomicLife} years
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Depreciation Breakdown</h3>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>Physical Depreciation</span>
                    <span className="font-medium">${depreciationResult.physicalDepreciation.toLocaleString()} ({depreciationResult.physicalDepreciationPercent.toFixed(1)}%)</span>
                  </div>
                  <Progress value={depreciationResult.physicalDepreciationPercent} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>Functional Obsolescence</span>
                    <span className="font-medium">${depreciationResult.functionalObsolescence.toLocaleString()} ({depreciationResult.functionalObsolescencePercent.toFixed(1)}%)</span>
                  </div>
                  <Progress value={depreciationResult.functionalObsolescencePercent} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>External Obsolescence</span>
                    <span className="font-medium">${depreciationResult.externalObsolescence.toLocaleString()} ({depreciationResult.externalObsolescencePercent.toFixed(1)}%)</span>
                  </div>
                  <Progress value={depreciationResult.externalObsolescencePercent} className="h-2" />
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium mb-3">Depreciation Analysis</h3>
                <div className="space-y-4 text-sm">
                  <p>
                    This property has experienced {depreciationResult.totalDepreciationPercent.toFixed(1)}% 
                    total depreciation from all sources, with physical depreciation being the 
                    {depreciationResult.physicalDepreciationPercent > depreciationResult.functionalObsolescencePercent && 
                      depreciationResult.physicalDepreciationPercent > depreciationResult.externalObsolescencePercent ? 
                      ' primary ' : ' '}
                    factor.
                  </p>
                  <p>
                    The property has {depreciationResult.remainingEconomicLife} years of remaining economic life
                    based on its effective age and condition.
                  </p>
                  {depreciationResult.functionalObsolescencePercent > 10 && (
                    <p>
                      Functional obsolescence is significant and may benefit from modernization or 
                      updating to improve the property's market value.
                    </p>
                  )}
                  {depreciationResult.externalObsolescencePercent > 10 && (
                    <p>
                      External obsolescence is notable and is caused by factors outside the property
                      boundaries that negatively impact its value.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  Export Report
                </Button>
                <Button>
                  Apply to Valuation
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepreciationCalculator;