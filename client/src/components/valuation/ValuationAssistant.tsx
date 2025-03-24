/**
 * AI-Powered Valuation Assistant Component
 * 
 * This component provides an interface to interact with the AI-powered
 * valuation agent for property valuation tasks.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getValuationAgent, 
  askValuationQuestion,
  requestComprehensiveValuation,
  ComprehensiveValuationRequest,
  ValuationQuestionRequest
} from '@/services/valuation-agent.service';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Send, Search, ScrollText } from 'lucide-react';

// Form schema for property valuation
const valuationFormSchema = z.object({
  address: z.string().min(5, { message: 'Address is required (min 5 characters)' }),
  propertyType: z.string().min(1, { message: 'Property type is required' }),
  squareFeet: z.coerce.number().positive({ message: 'Square feet must be a positive number' }),
  bedrooms: z.coerce.number().nonnegative({ message: 'Bedrooms must be a non-negative number' }),
  bathrooms: z.coerce.number().nonnegative({ message: 'Bathrooms must be a non-negative number' }),
  yearBuilt: z.coerce.number().positive({ message: 'Year built must be a positive number' }),
  lotSize: z.coerce.number().optional(),
  additionalFeatures: z.string().optional(),
  approaches: z.array(z.string()).optional()
});

// Form schema for asking a question
const questionFormSchema = z.object({
  question: z.string().min(5, { message: 'Question is required (min 5 characters)' }),
  propertyType: z.string().optional(),
  location: z.string().optional(),
  context: z.string().optional()
});

/**
 * AI-Powered Valuation Assistant component
 */
export default function ValuationAssistant() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('question');
  
  // State for selected valuation approaches
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>([
    'sales_comparison', 
    'cost_approach'
  ]);
  
  // State for response
  const [response, setResponse] = useState<any>(null);
  const [isViewingResponse, setIsViewingResponse] = useState(false);
  
  // Fetch valuation agent details
  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ['/api/agents/valuation'],
    queryFn: getValuationAgent
  });
  
  // Setup form for property valuation
  const valuationForm = useForm<z.infer<typeof valuationFormSchema>>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      address: '',
      propertyType: 'single_family',
      squareFeet: 0,
      bedrooms: 0,
      bathrooms: 0,
      yearBuilt: new Date().getFullYear() - 20,
      lotSize: undefined,
      additionalFeatures: '',
      approaches: ['sales_comparison', 'cost_approach']
    }
  });
  
  // Setup form for asking a question
  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: '',
      propertyType: '',
      location: '',
      context: ''
    }
  });
  
  // Set up mutation for comprehensive valuation
  const valuationMutation = useMutation({
    mutationFn: (data: ComprehensiveValuationRequest) => requestComprehensiveValuation(data),
    onSuccess: (data) => {
      setResponse(data);
      setIsViewingResponse(true);
      toast({
        title: 'Valuation Complete',
        description: 'Property valuation has been completed successfully.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Valuation error:', error);
      toast({
        title: 'Valuation Failed',
        description: error.message || 'Could not complete the property valuation.',
        variant: 'destructive'
      });
    }
  });
  
  // Set up mutation for asking a question
  const questionMutation = useMutation({
    mutationFn: (data: ValuationQuestionRequest) => askValuationQuestion(data),
    onSuccess: (data) => {
      setResponse(data);
      setIsViewingResponse(true);
      toast({
        title: 'Response Received',
        description: 'The valuation assistant has answered your question.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Question error:', error);
      toast({
        title: 'Question Failed',
        description: error.message || 'Could not get an answer to your question.',
        variant: 'destructive'
      });
    }
  });
  
  // Update form approaches when selectedApproaches changes
  useEffect(() => {
    valuationForm.setValue('approaches', selectedApproaches);
  }, [selectedApproaches, valuationForm]);
  
  // Handle property valuation submission
  const onValuationSubmit = (data: z.infer<typeof valuationFormSchema>) => {
    // Make sure approaches are included
    const valuationData = {
      ...data,
      approaches: selectedApproaches
    };
    
    valuationMutation.mutate(valuationData);
  };
  
  // Handle question submission
  const onQuestionSubmit = (data: z.infer<typeof questionFormSchema>) => {
    questionMutation.mutate(data);
  };
  
  // Handle approach toggle
  const handleApproachToggle = (approach: string) => {
    if (selectedApproaches.includes(approach)) {
      setSelectedApproaches(selectedApproaches.filter(a => a !== approach));
    } else {
      setSelectedApproaches([...selectedApproaches, approach]);
    }
  };
  
  // Go back to form
  const handleBackToForm = () => {
    setIsViewingResponse(false);
    setResponse(null);
  };
  
  // Loading state
  const isLoading = 
    agentLoading || 
    valuationMutation.isPending || 
    questionMutation.isPending;
  
  // Render response view if there's a response
  if (isViewingResponse && response) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Valuation Result</CardTitle>
          <CardDescription>
            Processed in {response.processingTime ? `${Math.round(response.processingTime / 1000)}s` : 'Unknown time'}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {response.result && response.result.valuation ? (
            <div className="whitespace-pre-wrap">{response.result.valuation}</div>
          ) : response.result && response.result.answer ? (
            <div className="whitespace-pre-wrap">{response.result.answer}</div>
          ) : (
            <div className="whitespace-pre-wrap">{JSON.stringify(response.result, null, 2)}</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBackToForm}>
            Back to Form
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => {
              // Copy to clipboard
              const text = response.result && response.result.valuation
                ? response.result.valuation
                : response.result && response.result.answer
                  ? response.result.answer
                  : JSON.stringify(response.result, null, 2);
              
              navigator.clipboard.writeText(text);
              toast({
                title: 'Copied to clipboard',
                description: 'The valuation result has been copied to your clipboard.',
                variant: 'default'
              });
            }}
          >
            Copy to Clipboard
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Main form UI
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>AI-Powered Valuation Assistant</CardTitle>
        <CardDescription>
          Get property valuations and answers to real estate appraisal questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="question" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Ask a Question
            </TabsTrigger>
            <TabsTrigger value="valuation" className="flex items-center gap-2">
              <ScrollText className="w-4 h-4" />
              Comprehensive Valuation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="question" className="pt-4">
            <Form {...questionForm}>
              <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-6">
                <FormField
                  control={questionForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Question</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ask any question about property valuation or appraisal methodologies..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={questionForm.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type (Optional)</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Not specified</SelectItem>
                              <SelectItem value="single_family">Single Family</SelectItem>
                              <SelectItem value="multi_family">Multi-Family</SelectItem>
                              <SelectItem value="condo">Condominium</SelectItem>
                              <SelectItem value="townhouse">Townhouse</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="land">Vacant Land</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={questionForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City, state, or region" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={questionForm.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Context (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional context that might help the AI provide a better answer..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting answer...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Get Answer
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="valuation" className="pt-4">
            <Form {...valuationForm}>
              <form onSubmit={valuationForm.handleSubmit(onValuationSubmit)} className="space-y-6">
                <FormField
                  control={valuationForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full property address" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={valuationForm.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single_family">Single Family</SelectItem>
                              <SelectItem value="multi_family">Multi-Family</SelectItem>
                              <SelectItem value="condo">Condominium</SelectItem>
                              <SelectItem value="townhouse">Townhouse</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="land">Vacant Land</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={valuationForm.control}
                    name="yearBuilt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Built</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Construction year" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={valuationForm.control}
                    name="squareFeet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Feet</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Total square footage" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={valuationForm.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="# of bedrooms" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={valuationForm.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="# of bathrooms" 
                            step="0.5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={valuationForm.control}
                  name="lotSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Size (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Lot size in acres or sq ft" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={valuationForm.control}
                  name="additionalFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Features (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Pool, upgraded kitchen, garage size, recent renovations, etc."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Valuation Approaches</FormLabel>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sales_comparison" 
                        checked={selectedApproaches.includes('sales_comparison')}
                        onCheckedChange={() => handleApproachToggle('sales_comparison')}
                      />
                      <label 
                        htmlFor="sales_comparison" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Sales Comparison
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="cost_approach" 
                        checked={selectedApproaches.includes('cost_approach')}
                        onCheckedChange={() => handleApproachToggle('cost_approach')}
                      />
                      <label 
                        htmlFor="cost_approach" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Cost Approach
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="income_approach" 
                        checked={selectedApproaches.includes('income_approach')}
                        onCheckedChange={() => handleApproachToggle('income_approach')}
                      />
                      <label 
                        htmlFor="income_approach" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Income Approach
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="automated_valuation" 
                        checked={selectedApproaches.includes('automated_valuation')}
                        onCheckedChange={() => handleApproachToggle('automated_valuation')}
                      />
                      <label 
                        htmlFor="automated_valuation" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Automated Valuation
                      </label>
                    </div>
                  </div>
                  {selectedApproaches.length === 0 && (
                    <p className="text-sm text-destructive mt-2">
                      Select at least one valuation approach
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || selectedApproaches.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing property...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate Valuation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between flex-col sm:flex-row">
        <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
          {agent ? (
            <span>AI Valuation Expert: {agent.name}</span>
          ) : agentLoading ? (
            <span>Loading agent details...</span>
          ) : (
            <span>Agent not available</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Powered by AI with professional valuation methodologies
        </div>
      </CardFooter>
    </Card>
  );
}