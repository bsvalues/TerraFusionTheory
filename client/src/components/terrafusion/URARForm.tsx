import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check, ArrowUpDown, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Define the form schema
const urarFormSchema = z.object({
  // Property Information
  propertyAddress: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  zipCode: z.string().min(5, { message: 'Valid ZIP code is required' }),
  county: z.string().min(1, { message: 'County is required' }),
  legalDescription: z.string().optional(),
  assessorParcelNumber: z.string().min(1, { message: 'Parcel number is required' }),
  taxYear: z.string().min(4, { message: 'Tax year is required' }),
  reo: z.string().optional(),
  neighborhood: z.string().min(1, { message: 'Neighborhood is required' }),
  occupant: z.enum(['Owner', 'Tenant', 'Vacant']),
  specialAssessments: z.string().optional(),
  pud: z.boolean(),
  
  // Site Information
  siteArea: z.string().min(1, { message: 'Site area is required' }),
  siteShape: z.enum(['Rectangular', 'Irregular', 'Square', 'Triangular']),
  siteView: z.enum(['Average', 'Good', 'Fair', 'Poor']),
  siteZoning: z.string().min(1, { message: 'Zoning classification is required' }),
  zoningDescription: z.string().optional(),
  zoningCompliance: z.enum(['Legal', 'Legal Non-Conforming', 'Illegal', 'No Zoning']),
  utilities: z.object({
    electricity: z.boolean(),
    gas: z.boolean(),
    water: z.boolean(),
    sanitarySewer: z.boolean()
  }),
  
  // Improvements Information
  generalDescription: z.object({
    units: z.number().min(1, { message: 'Number of units is required' }),
    stories: z.number().min(1, { message: 'Number of stories is required' }),
    type: z.enum(['Detached', 'Attached', 'S-Detached', 'S-Attached', 'MF']),
    yearBuilt: z.string().min(4, { message: 'Year built is required' })
  }),
  exterior: z.object({
    foundation: z.string().min(1),
    exteriorWalls: z.string().min(1),
    roofSurface: z.string().min(1),
    gutters: z.boolean(),
    windowType: z.string().min(1),
    stormSash: z.boolean(),
    screens: z.boolean()
  }),
  interior: z.object({
    floors: z.string().min(1),
    walls: z.string().min(1),
    trim: z.string().min(1),
    bath: z.string().min(1),
    doors: z.string().min(1)
  }),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  squareFeet: z.number().min(1, { message: 'Square footage is required' }),
  
  // Valuation Section
  approach: z.object({
    salesComparison: z.boolean(),
    cost: z.boolean(),
    income: z.boolean()
  }),
  valueConclusion: z.number().optional(),
  valueDate: z.string().min(1, { message: 'Valuation date is required' })
});

type URARFormValues = z.infer<typeof urarFormSchema>;

interface URARFormProps {
  propertyId?: string;
  initialData?: Partial<URARFormValues>;
  readOnly?: boolean;
  agentHighlightedFields?: Record<string, { agentId: string, message: string, timestamp: string }>;
  onSave?: (data: URARFormValues) => void;
  className?: string;
}

export default function URARForm({
  propertyId,
  initialData,
  readOnly = false,
  agentHighlightedFields = {},
  onSave,
  className = ''
}: URARFormProps) {
  const [activeTab, setActiveTab] = useState('property');
  const [highlightedFields, setHighlightedFields] = useState<Record<string, boolean>>({});
  const [showHighlights, setShowHighlights] = useState(true);

  // Set up form with validation and default values
  const form = useForm<URARFormValues>({
    resolver: zodResolver(urarFormSchema),
    defaultValues: {
      propertyAddress: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
      legalDescription: '',
      assessorParcelNumber: '',
      taxYear: new Date().getFullYear().toString(),
      reo: '',
      neighborhood: '',
      occupant: 'Vacant',
      specialAssessments: '',
      pud: false,
      
      siteArea: '',
      siteShape: 'Rectangular',
      siteView: 'Average',
      siteZoning: '',
      zoningDescription: '',
      zoningCompliance: 'Legal',
      utilities: {
        electricity: true,
        gas: true,
        water: true,
        sanitarySewer: true
      },
      
      generalDescription: {
        units: 1,
        stories: 1,
        type: 'Detached',
        yearBuilt: ''
      },
      exterior: {
        foundation: '',
        exteriorWalls: '',
        roofSurface: '',
        gutters: false,
        windowType: '',
        stormSash: false,
        screens: false
      },
      interior: {
        floors: '',
        walls: '',
        trim: '',
        bath: '',
        doors: ''
      },
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 0,
      
      approach: {
        salesComparison: true,
        cost: false,
        income: false
      },
      valueConclusion: undefined,
      valueDate: new Date().toISOString().split('T')[0],
      ...initialData
    }
  });

  // Listen for WebSocket events related to form field highlighting
  useEffect(() => {
    // This could be listening to the same WebSocket used in AgentFeedPanel
    // or a separate context that manages AI agent activities
    const handleAgentActivity = (event: CustomEvent) => {
      const activity = event.detail;
      
      // If the activity is related to form fields, highlight them
      if (activity.formField && propertyId === activity.propertyId) {
        setHighlightedFields(prev => ({
          ...prev,
          [activity.formField]: true
        }));
        
        // Auto-switch to the tab containing the highlighted field
        if (activity.formField.includes('property')) {
          setActiveTab('property');
        } else if (activity.formField.includes('site')) {
          setActiveTab('site');
        } else if (activity.formField.includes('improvements')) {
          setActiveTab('improvements');
        } else if (activity.formField.includes('value')) {
          setActiveTab('valuation');
        }
      }
    };

    // Register event listener
    window.addEventListener('agentActivity', handleAgentActivity as EventListener);
    
    return () => {
      window.removeEventListener('agentActivity', handleAgentActivity as EventListener);
    };
  }, [propertyId]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });
    }
  }, [initialData, form]);

  // Handle form submission
  const onSubmit = (data: URARFormValues) => {
    if (onSave) {
      onSave(data);
    }
  };

  // Check if a field has been highlighted by an agent
  const isHighlighted = (fieldName: string) => {
    return showHighlights && (highlightedFields[fieldName] || agentHighlightedFields[fieldName]);
  };

  // Render field with highlight if needed
  const renderField = (fieldName: string, component: JSX.Element) => {
    const hasAgentHighlight = agentHighlightedFields[fieldName];
    
    return (
      <div className={`relative transition-all ${isHighlighted(fieldName) ? 'bg-yellow-50 p-2 rounded-md border border-yellow-200' : ''}`}>
        {component}
        {isHighlighted(fieldName) && hasAgentHighlight && (
          <div className="absolute right-1 top-1">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Agent Insight
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`${className} w-full`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>URAR Form</CardTitle>
          <div className="flex items-center gap-2">
            {readOnly && (
              <Badge variant="secondary">Read Only</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHighlights(!showHighlights)}
              className="flex items-center gap-1"
            >
              {showHighlights ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  Hide Highlights
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Show Highlights
                </>
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Uniform Residential Appraisal Report 
          {propertyId ? ` - Parcel ID: ${propertyId}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="property">Property</TabsTrigger>
                <TabsTrigger value="site">Site</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
                <TabsTrigger value="valuation">Valuation</TabsTrigger>
              </TabsList>
              
              {/* Property Information Tab */}
              <TabsContent value="property" className="space-y-4">
                {renderField('propertyAddress', (
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly={readOnly}
                            className={readOnly ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                <div className="grid grid-cols-3 gap-4">
                  {renderField('city', (
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('state', (
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('zipCode', (
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                {renderField('county', (
                  <FormField
                    control={form.control}
                    name="county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly={readOnly}
                            className={readOnly ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                {renderField('assessorParcelNumber', (
                  <FormField
                    control={form.control}
                    name="assessorParcelNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessor's Parcel Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly={readOnly}
                            className={readOnly ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                <div className="grid grid-cols-2 gap-4">
                  {renderField('taxYear', (
                    <FormField
                      control={form.control}
                      name="taxYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Year</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('neighborhood', (
                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neighborhood</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                {renderField('occupant', (
                  <FormField
                    control={form.control}
                    name="occupant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupant</FormLabel>
                        <Select
                          disabled={readOnly}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className={readOnly ? 'bg-muted' : ''}>
                              <SelectValue placeholder="Select occupant status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Owner">Owner</SelectItem>
                            <SelectItem value="Tenant">Tenant</SelectItem>
                            <SelectItem value="Vacant">Vacant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                {renderField('legalDescription', (
                  <FormField
                    control={form.control}
                    name="legalDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            readOnly={readOnly}
                            className={readOnly ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </TabsContent>
              
              {/* Site Information Tab */}
              <TabsContent value="site" className="space-y-4">
                {renderField('siteArea', (
                  <FormField
                    control={form.control}
                    name="siteArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Area</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly={readOnly}
                            className={readOnly ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                <div className="grid grid-cols-2 gap-4">
                  {renderField('siteShape', (
                    <FormField
                      control={form.control}
                      name="siteShape"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Shape</FormLabel>
                          <Select
                            disabled={readOnly}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className={readOnly ? 'bg-muted' : ''}>
                                <SelectValue placeholder="Select site shape" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Rectangular">Rectangular</SelectItem>
                              <SelectItem value="Irregular">Irregular</SelectItem>
                              <SelectItem value="Square">Square</SelectItem>
                              <SelectItem value="Triangular">Triangular</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('siteView', (
                    <FormField
                      control={form.control}
                      name="siteView"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site View</FormLabel>
                          <Select
                            disabled={readOnly}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className={readOnly ? 'bg-muted' : ''}>
                                <SelectValue placeholder="Select site view" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Average">Average</SelectItem>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Fair">Fair</SelectItem>
                              <SelectItem value="Poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                {renderField('siteZoning', (
                  <FormField
                    control={form.control}
                    name="siteZoning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoning Classification</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly={readOnly}
                            className={readOnly ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                {renderField('zoningCompliance', (
                  <FormField
                    control={form.control}
                    name="zoningCompliance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoning Compliance</FormLabel>
                        <Select
                          disabled={readOnly}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className={readOnly ? 'bg-muted' : ''}>
                              <SelectValue placeholder="Select zoning compliance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Legal">Legal</SelectItem>
                            <SelectItem value="Legal Non-Conforming">Legal Non-Conforming</SelectItem>
                            <SelectItem value="Illegal">Illegal</SelectItem>
                            <SelectItem value="No Zoning">No Zoning</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                {renderField('utilities', (
                  <FormItem>
                    <FormLabel>Utilities</FormLabel>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name="utilities.electricity"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Electricity</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="utilities.gas"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Gas</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="utilities.water"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Water</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="utilities.sanitarySewer"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Sanitary Sewer</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormItem>
                ))}
              </TabsContent>
              
              {/* Improvements Tab */}
              <TabsContent value="improvements" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderField('generalDescription.units', (
                    <FormField
                      control={form.control}
                      name="generalDescription.units"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('generalDescription.stories', (
                    <FormField
                      control={form.control}
                      name="generalDescription.stories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stories</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {renderField('generalDescription.type', (
                    <FormField
                      control={form.control}
                      name="generalDescription.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            disabled={readOnly}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className={readOnly ? 'bg-muted' : ''}>
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Detached">Detached</SelectItem>
                              <SelectItem value="Attached">Attached</SelectItem>
                              <SelectItem value="S-Detached">S-Detached</SelectItem>
                              <SelectItem value="S-Attached">S-Attached</SelectItem>
                              <SelectItem value="MF">Multi-Family</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('generalDescription.yearBuilt', (
                    <FormField
                      control={form.control}
                      name="generalDescription.yearBuilt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Built</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {renderField('bedrooms', (
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('bathrooms', (
                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('squareFeet', (
                    <FormField
                      control={form.control}
                      name="squareFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Feet</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                {/* Exterior Details */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Exterior Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('exterior.foundation', (
                      <FormField
                        control={form.control}
                        name="exterior.foundation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Foundation</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={readOnly}
                                className={readOnly ? 'bg-muted' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    
                    {renderField('exterior.exteriorWalls', (
                      <FormField
                        control={form.control}
                        name="exterior.exteriorWalls"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exterior Walls</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={readOnly}
                                className={readOnly ? 'bg-muted' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Interior Details */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Interior Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('interior.floors', (
                      <FormField
                        control={form.control}
                        name="interior.floors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floors</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={readOnly}
                                className={readOnly ? 'bg-muted' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    
                    {renderField('interior.walls', (
                      <FormField
                        control={form.control}
                        name="interior.walls"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Walls</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly={readOnly}
                                className={readOnly ? 'bg-muted' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* Valuation Tab */}
              <TabsContent value="valuation" className="space-y-4">
                {renderField('approach', (
                  <FormItem>
                    <FormLabel>Approaches Used</FormLabel>
                    <div className="flex space-x-4 mt-2">
                      <FormField
                        control={form.control}
                        name="approach.salesComparison"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Sales Comparison</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="approach.cost"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Cost</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="approach.income"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded"
                                />
                                <span>Income</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormItem>
                ))}
                
                <div className="grid grid-cols-2 gap-4">
                  {renderField('valueConclusion', (
                    <FormField
                      control={form.control}
                      name="valueConclusion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value Conclusion ($)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {renderField('valueDate', (
                    <FormField
                      control={form.control}
                      name="valueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              readOnly={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            {!readOnly && (
              <div className="flex justify-end">
                <Button type="submit">Save URAR Form</Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}