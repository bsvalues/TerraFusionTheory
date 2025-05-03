/**
 * URARForm Component
 * 
 * This component renders a Uniform Residential Appraisal Report (URAR) form
 * with intelligent field highlighting based on agent events.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.property - Property data to populate the form
 * @param {string} props.highlightedField - ID of the field to highlight (triggered by agent events)
 * @param {Function} props.onFieldUpdate - Callback when a field value is updated
 * @param {boolean} props.readOnly - Whether the form is in read-only mode
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, RefreshCw, Lock, Unlock, AlertTriangle } from 'lucide-react';

// Default property values for the form
const defaultProperty = {
  address: '',
  city: '',
  state: '',
  zipCode: '',
  county: '',
  legalDescription: '',
  assessorParcelNumber: '',
  taxYear: new Date().getFullYear(),
  rEONumber: '',
  neighborhood: '',
  occupant: 'owner',
  propertyRights: 'fee_simple',
  assignment: 'purchase',
  loanType: 'conventional',
  lender: '',
  propertyType: 'single_family',
  yearBuilt: 2000,
  effectiveAge: 20,
  totalRooms: 6,
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 2000,
  basement: false,
  basementSquareFeet: 0,
  basementFinished: 0,
  foundation: 'concrete',
  exteriorWalls: 'wood',
  roof: 'asphalt',
  gutters: true,
  windows: 'vinyl',
  screens: true,
  heating: 'forced_air',
  cooling: 'central',
  fireplace: 1,
  patio: true,
  deck: true,
  pool: false,
  fence: true,
  landscaping: 'average',
  driveway: 'concrete',
  garage: 'attached',
  garageSquareFeet: 400,
  garageCars: 2,
  condition: 'average',
  conformityToNeighborhood: 'average',
  qualityOfConstruction: 'average',
  functionalUtility: 'average',
  heatingCoolingAdequacy: 'adequate',
  energyEfficiency: 'average',
  appealMarketability: 'average',
  salesPrice: 350000,
  priceSqFt: 175,
  estimatedValue: 350000,
  incomeApproachValue: 340000,
  salesComparisonValue: 355000,
  costApproachValue: 360000,
  finalValueOpinion: 350000
};

const URARForm = ({ 
  property = defaultProperty, 
  highlightedField = null,
  onFieldUpdate = () => {},
  readOnly = false
}) => {
  const [formValues, setFormValues] = useState(property);
  const [activeTab, setActiveTab] = useState('general');
  const [forecasts, setForecasts] = useState(null);
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(false);
  
  // Refs for scrolling to highlighted fields
  const highlightedFieldRef = useRef(null);
  
  // Fetch income forecasts when component mounts
  useEffect(() => {
    const fetchForecasts = async () => {
      if (property.assessorParcelNumber) {
        setIsLoadingForecasts(true);
        try {
          const response = await fetch(`/forecast/${property.assessorParcelNumber}`);
          if (response.ok) {
            const data = await response.json();
            setForecasts(data);
          } else {
            console.error('Failed to fetch forecasts');
          }
        } catch (error) {
          console.error('Error fetching forecasts:', error);
        } finally {
          setIsLoadingForecasts(false);
        }
      }
    };
    
    fetchForecasts();
  }, [property.assessorParcelNumber]);
  
  // Scroll to highlighted field when it changes
  useEffect(() => {
    if (highlightedField && highlightedFieldRef.current) {
      highlightedFieldRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedField]);
  
  // Handle field value changes
  const handleFieldChange = (name, value) => {
    if (readOnly) return;
    
    const updatedValues = {
      ...formValues,
      [name]: value
    };
    
    setFormValues(updatedValues);
    onFieldUpdate(name, value, updatedValues);
  };
  
  // Create a field wrapper with highlighting
  const Field = ({ 
    id, 
    label, 
    children, 
    className = '',
    description = null
  }) => {
    const isHighlighted = id === highlightedField;
    
    return (
      <div 
        className={`p-3 rounded-md transition-all duration-300 ${isHighlighted ? 'bg-yellow-100 border border-yellow-400' : ''} ${className}`}
        ref={id === highlightedField ? highlightedFieldRef : null}
      >
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor={id} className="font-medium">
            {label}
          </Label>
          {isHighlighted && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 font-normal text-xs">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Agent Activity
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        {children}
      </div>
    );
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            Uniform Residential Appraisal Report
          </CardTitle>
          <Badge variant={readOnly ? "secondary" : "outline"} className="font-normal text-xs flex items-center">
            {readOnly ? (
              <>
                <Lock className="mr-1 h-3 w-3" />
                Read Only
              </>
            ) : (
              <>
                <Unlock className="mr-1 h-3 w-3" />
                Editable
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Property appraisal form with AI-assisted valuation and insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full rounded-none">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="valuation">Valuation</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[700px] rounded-md border">
            <div className="p-4">
              <TabsContent value="general" className="mt-0 p-0 space-y-4">
                <Field
                  id="address"
                  label="Subject Property Address"
                  description="Complete street address including unit number if applicable"
                >
                  <Input 
                    id="address" 
                    value={formValues.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="mt-1"
                    readOnly={readOnly}
                  />
                </Field>
                
                <div className="grid grid-cols-3 gap-4">
                  <Field id="city" label="City">
                    <Input 
                      id="city" 
                      value={formValues.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="state" label="State">
                    <Input 
                      id="state" 
                      value={formValues.state}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="zipCode" label="Zip Code">
                    <Input 
                      id="zipCode" 
                      value={formValues.zipCode}
                      onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                </div>
                
                <Field
                  id="legalDescription"
                  label="Legal Description"
                >
                  <Textarea 
                    id="legalDescription" 
                    value={formValues.legalDescription}
                    onChange={(e) => handleFieldChange('legalDescription', e.target.value)}
                    className="mt-1"
                    readOnly={readOnly}
                  />
                </Field>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field id="assessorParcelNumber" label="Assessor Parcel Number">
                    <Input 
                      id="assessorParcelNumber" 
                      value={formValues.assessorParcelNumber}
                      onChange={(e) => handleFieldChange('assessorParcelNumber', e.target.value)}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="taxYear" label="Tax Year">
                    <Input 
                      id="taxYear" 
                      type="number"
                      value={formValues.taxYear}
                      onChange={(e) => handleFieldChange('taxYear', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                </div>
                
                <Field id="neighborhood" label="Neighborhood">
                  <Input 
                    id="neighborhood" 
                    value={formValues.neighborhood}
                    onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
                    className="mt-1"
                    readOnly={readOnly}
                  />
                </Field>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field id="propertyRights" label="Property Rights Appraised">
                    <Select 
                      value={formValues.propertyRights}
                      onValueChange={(value) => handleFieldChange('propertyRights', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select property rights" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fee_simple">Fee Simple</SelectItem>
                        <SelectItem value="leasehold">Leasehold</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field id="occupant" label="Occupant">
                    <Select 
                      value={formValues.occupant}
                      onValueChange={(value) => handleFieldChange('occupant', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select occupant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </TabsContent>
              
              <TabsContent value="property" className="mt-0 p-0 space-y-4">
                <Field
                  id="propertyType"
                  label="Property Type"
                >
                  <Select 
                    value={formValues.propertyType}
                    onValueChange={(value) => handleFieldChange('propertyType', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condo">Condominium</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                
                <div className="grid grid-cols-3 gap-4">
                  <Field id="yearBuilt" label="Year Built">
                    <Input 
                      id="yearBuilt" 
                      type="number"
                      value={formValues.yearBuilt}
                      onChange={(e) => handleFieldChange('yearBuilt', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="effectiveAge" label="Effective Age">
                    <Input 
                      id="effectiveAge" 
                      type="number"
                      value={formValues.effectiveAge}
                      onChange={(e) => handleFieldChange('effectiveAge', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="squareFeet" label="Gross Living Area (sq ft)">
                    <Input 
                      id="squareFeet" 
                      type="number"
                      value={formValues.squareFeet}
                      onChange={(e) => handleFieldChange('squareFeet', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Field id="totalRooms" label="Total Rooms">
                    <Input 
                      id="totalRooms" 
                      type="number"
                      value={formValues.totalRooms}
                      onChange={(e) => handleFieldChange('totalRooms', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="bedrooms" label="Bedrooms">
                    <Input 
                      id="bedrooms" 
                      type="number"
                      value={formValues.bedrooms}
                      onChange={(e) => handleFieldChange('bedrooms', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="bathrooms" label="Bathrooms">
                    <Input 
                      id="bathrooms" 
                      type="number"
                      value={formValues.bathrooms}
                      onChange={(e) => handleFieldChange('bathrooms', parseFloat(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                </div>
                
                <Field id="basement" label="Basement">
                  <div className="flex items-center space-x-2 mt-1">
                    <RadioGroup 
                      value={formValues.basement ? 'yes' : 'no'}
                      onValueChange={(value) => handleFieldChange('basement', value === 'yes')}
                      className="flex space-x-2"
                      disabled={readOnly}
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="yes" id="basement-yes" />
                        <Label htmlFor="basement-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="no" id="basement-no" />
                        <Label htmlFor="basement-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {formValues.basement && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="basementSquareFeet" className="text-sm">Sq Ft</Label>
                        <Input 
                          id="basementSquareFeet" 
                          type="number"
                          value={formValues.basementSquareFeet}
                          onChange={(e) => handleFieldChange('basementSquareFeet', parseInt(e.target.value))}
                          className="mt-1"
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="basementFinished" className="text-sm">% Finished</Label>
                        <Input 
                          id="basementFinished" 
                          type="number"
                          min="0"
                          max="100"
                          value={formValues.basementFinished}
                          onChange={(e) => handleFieldChange('basementFinished', parseInt(e.target.value))}
                          className="mt-1"
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  )}
                </Field>
              </TabsContent>
              
              <TabsContent value="improvements" className="mt-0 p-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field id="foundation" label="Foundation">
                    <Select 
                      value={formValues.foundation}
                      onValueChange={(value) => handleFieldChange('foundation', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select foundation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concrete">Concrete</SelectItem>
                        <SelectItem value="slab">Slab</SelectItem>
                        <SelectItem value="crawl_space">Crawl Space</SelectItem>
                        <SelectItem value="piers">Piers</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field id="exteriorWalls" label="Exterior Walls">
                    <Select 
                      value={formValues.exteriorWalls}
                      onValueChange={(value) => handleFieldChange('exteriorWalls', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select exterior type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wood">Wood</SelectItem>
                        <SelectItem value="brick">Brick</SelectItem>
                        <SelectItem value="vinyl">Vinyl</SelectItem>
                        <SelectItem value="stucco">Stucco</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field id="heating" label="Heating Type">
                    <Select 
                      value={formValues.heating}
                      onValueChange={(value) => handleFieldChange('heating', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select heating type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forced_air">Forced Air</SelectItem>
                        <SelectItem value="heat_pump">Heat Pump</SelectItem>
                        <SelectItem value="hot_water">Hot Water</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field id="cooling" label="Cooling Type">
                    <Select 
                      value={formValues.cooling}
                      onValueChange={(value) => handleFieldChange('cooling', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select cooling type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="heat_pump">Heat Pump</SelectItem>
                        <SelectItem value="wall_units">Wall Units</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field id="garage" label="Garage Type">
                    <Select 
                      value={formValues.garage}
                      onValueChange={(value) => handleFieldChange('garage', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select garage type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attached">Attached</SelectItem>
                        <SelectItem value="detached">Detached</SelectItem>
                        <SelectItem value="built_in">Built-in</SelectItem>
                        <SelectItem value="carport">Carport</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field id="garageCars" label="Garage Capacity (Cars)">
                    <Input 
                      id="garageCars" 
                      type="number"
                      min="0"
                      value={formValues.garageCars}
                      onChange={(e) => handleFieldChange('garageCars', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Field id="condition" label="Overall Condition">
                    <Select 
                      value={formValues.condition}
                      onValueChange={(value) => handleFieldChange('condition', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field id="qualityOfConstruction" label="Quality of Construction">
                    <Select 
                      value={formValues.qualityOfConstruction}
                      onValueChange={(value) => handleFieldChange('qualityOfConstruction', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field id="functionalUtility" label="Functional Utility">
                    <Select 
                      value={formValues.functionalUtility}
                      onValueChange={(value) => handleFieldChange('functionalUtility', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select utility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </TabsContent>
              
              <TabsContent value="valuation" className="mt-0 p-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field id="salesPrice" label="Contract Sales Price ($)">
                    <Input 
                      id="salesPrice" 
                      type="number"
                      value={formValues.salesPrice}
                      onChange={(e) => handleFieldChange('salesPrice', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                  
                  <Field id="priceSqFt" label="Price Per Square Foot">
                    <Input 
                      id="priceSqFt" 
                      type="number"
                      value={formValues.priceSqFt}
                      onChange={(e) => handleFieldChange('priceSqFt', parseInt(e.target.value))}
                      className="mt-1"
                      readOnly={readOnly}
                    />
                  </Field>
                </div>
                
                <Card className="bg-muted/50 border">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm font-medium">Valuation Approaches</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-3">
                    <Field id="salesComparisonValue" label="Sales Comparison Approach ($)">
                      <Input 
                        id="salesComparisonValue" 
                        type="number"
                        value={formValues.salesComparisonValue}
                        onChange={(e) => handleFieldChange('salesComparisonValue', parseInt(e.target.value))}
                        className="mt-1"
                        readOnly={readOnly}
                      />
                    </Field>
                    
                    <Field id="costApproachValue" label="Cost Approach ($)">
                      <Input 
                        id="costApproachValue" 
                        type="number"
                        value={formValues.costApproachValue}
                        onChange={(e) => handleFieldChange('costApproachValue', parseInt(e.target.value))}
                        className="mt-1"
                        readOnly={readOnly}
                      />
                    </Field>
                    
                    <Field id="incomeApproachValue" label="Income Approach ($)">
                      <Input 
                        id="incomeApproachValue" 
                        type="number"
                        value={formValues.incomeApproachValue}
                        onChange={(e) => handleFieldChange('incomeApproachValue', parseInt(e.target.value))}
                        className="mt-1"
                        readOnly={readOnly}
                      />
                    </Field>
                    
                    {forecasts ? (
                      <div className="mt-2 border-t pt-2">
                        <div className="mb-2 flex items-center">
                          <Badge variant="secondary" className="font-normal text-xs mr-2">
                            Forecast Agent
                          </Badge>
                          <span className="text-xs text-muted-foreground">12-month income projection</span>
                        </div>
                        <div className="text-sm px-2 py-1 bg-background rounded">
                          <ul className="text-xs space-y-1.5">
                            <li className="flex justify-between">
                              <span>Potential Gross Income:</span>
                              <span className="font-medium">${forecasts.potentialGrossIncome.toLocaleString()}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Vacancy Rate:</span>
                              <span className="font-medium">{forecasts.vacancyRate}%</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Net Operating Income:</span>
                              <span className="font-medium">${forecasts.netOperatingIncome.toLocaleString()}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Cap Rate:</span>
                              <span className="font-medium">{forecasts.capRate}%</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : isLoadingForecasts ? (
                      <div className="flex justify-center p-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reconciliation" className="mt-0 p-0 space-y-4">
                <Field
                  id="finalValueOpinion"
                  label="Final Value Opinion ($)"
                  description="Reconciled value based on all approaches"
                >
                  <Input 
                    id="finalValueOpinion" 
                    type="number"
                    value={formValues.finalValueOpinion}
                    onChange={(e) => handleFieldChange('finalValueOpinion', parseInt(e.target.value))}
                    className="mt-1"
                    readOnly={readOnly}
                  />
                </Field>
                
                <Field
                  id="reconciliationComments"
                  label="Reconciliation Comments"
                  description="Explanation of value conclusion and weights assigned to each approach"
                >
                  <Textarea 
                    id="reconciliationComments" 
                    value={formValues.reconciliationComments || ''}
                    onChange={(e) => handleFieldChange('reconciliationComments', e.target.value)}
                    className="mt-1"
                    rows={5}
                    readOnly={readOnly}
                  />
                </Field>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center">
            <Info className="h-4 w-4 mr-1" />
            <span>URAR Form with AI Integration</span>
          </div>
        </div>
        
        {!readOnly && (
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Recalculate Values
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default URARForm;