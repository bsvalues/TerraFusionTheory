import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CalculatorIcon, 
  PlusCircle, 
  Save, 
  FileDown, 
  Info, 
  RefreshCw, 
  ListTree, 
  Table2, 
  FileText,
  BuildingIcon
} from 'lucide-react';

// Cost types for different construction elements
interface CostElement {
  id: string;
  name: string;
  unitCost: number;
  quantity: number;
  unit: string;
  adjustmentFactor: number;
  category: 'base' | 'exterior' | 'interior' | 'mechanical' | 'site' | 'accessory';
  description?: string;
}

// Cost multipliers based on quality, location, etc.
interface CostMultiplier {
  id: string;
  name: string;
  factor: number;
  type: string;
}

// Predefined cost schedules for different building types
interface BuildingCostSchedule {
  id: string;
  name: string;
  baseRate: number;
  qualityLevels: {
    low: number;
    average: number;
    good: number;
    excellent: number;
  };
  description: string;
  adjustmentFactors: {
    name: string;
    factor: number;
  }[];
}

// Base building types
const BUILDING_COST_SCHEDULES: BuildingCostSchedule[] = [
  {
    id: 'residential-1story',
    name: 'Residential - Single Family (1 Story)',
    baseRate: 120,
    qualityLevels: {
      low: 0.8,
      average: 1.0,
      good: 1.3,
      excellent: 1.6
    },
    description: 'Standard single-family residential construction, one story',
    adjustmentFactors: [
      { name: 'Basement', factor: 0.12 },
      { name: 'Attached Garage', factor: 0.08 },
      { name: 'Fireplace', factor: 0.02 },
      { name: 'Central HVAC', factor: 0.05 },
      { name: 'Premium Windows', factor: 0.03 }
    ]
  },
  {
    id: 'residential-2story',
    name: 'Residential - Single Family (2 Story)',
    baseRate: 110,
    qualityLevels: {
      low: 0.8,
      average: 1.0,
      good: 1.3,
      excellent: 1.6
    },
    description: 'Standard single-family residential construction, two story',
    adjustmentFactors: [
      { name: 'Basement', factor: 0.10 },
      { name: 'Attached Garage', factor: 0.07 },
      { name: 'Fireplace', factor: 0.02 },
      { name: 'Central HVAC', factor: 0.05 },
      { name: 'Premium Windows', factor: 0.03 }
    ]
  },
  {
    id: 'commercial-office',
    name: 'Commercial - Office Building',
    baseRate: 180,
    qualityLevels: {
      low: 0.8,
      average: 1.0,
      good: 1.3,
      excellent: 1.7
    },
    description: 'Standard office building construction',
    adjustmentFactors: [
      { name: 'Elevator', factor: 0.08 },
      { name: 'Upscale Lobby', factor: 0.05 },
      { name: 'Enhanced Security', factor: 0.03 },
      { name: 'Premium HVAC', factor: 0.07 },
      { name: 'Smart Building Technology', factor: 0.04 }
    ]
  },
  {
    id: 'commercial-retail',
    name: 'Commercial - Retail',
    baseRate: 150,
    qualityLevels: {
      low: 0.8,
      average: 1.0,
      good: 1.2,
      excellent: 1.5
    },
    description: 'Standard retail store construction',
    adjustmentFactors: [
      { name: 'Premium Storefront', factor: 0.06 },
      { name: 'Enhanced Lighting', factor: 0.03 },
      { name: 'Fire Suppression', factor: 0.04 },
      { name: 'Custom Fixtures', factor: 0.05 }
    ]
  },
  {
    id: 'commercial-warehouse',
    name: 'Commercial - Warehouse',
    baseRate: 85,
    qualityLevels: {
      low: 0.8,
      average: 1.0,
      good: 1.2,
      excellent: 1.4
    },
    description: 'Standard warehouse construction',
    adjustmentFactors: [
      { name: 'Loading Docks', factor: 0.05 },
      { name: 'High Ceiling', factor: 0.04 },
      { name: 'Climate Control', factor: 0.08 },
      { name: 'Fire Suppression', factor: 0.04 }
    ]
  },
  {
    id: 'multifamily-apartment',
    name: 'Multifamily - Apartment Building',
    baseRate: 135,
    qualityLevels: {
      low: 0.8,
      average: 1.0,
      good: 1.3,
      excellent: 1.6
    },
    description: 'Standard apartment building construction',
    adjustmentFactors: [
      { name: 'Elevator', factor: 0.07 },
      { name: 'Common Areas', factor: 0.05 },
      { name: 'Balconies', factor: 0.03 },
      { name: 'Security System', factor: 0.02 },
      { name: 'Central HVAC', factor: 0.06 }
    ]
  }
];

// Cost multipliers for different regions
const LOCATION_MULTIPLIERS = [
  { id: 'loc-1', name: 'Urban Core', factor: 1.15, type: 'location' },
  { id: 'loc-2', name: 'Suburban', factor: 1.05, type: 'location' },
  { id: 'loc-3', name: 'Rural', factor: 0.95, type: 'location' },
  { id: 'loc-4', name: 'Resort Area', factor: 1.20, type: 'location' }
];

// Cost multipliers for different construction periods
const TIME_MULTIPLIERS = [
  { id: 'time-1', name: 'Current (2024)', factor: 1.00, type: 'time' },
  { id: 'time-2', name: '2023', factor: 0.97, type: 'time' },
  { id: 'time-3', name: '2022', factor: 0.94, type: 'time' },
  { id: 'time-4', name: '2021', factor: 0.91, type: 'time' },
  { id: 'time-5', name: '2020', factor: 0.88, type: 'time' }
];

// Common building site improvements
const SITE_IMPROVEMENTS = [
  { id: 'site-1', name: 'Asphalt Paving', unitCost: 8, unit: 'sq ft', category: 'site' },
  { id: 'site-2', name: 'Concrete Sidewalk', unitCost: 12, unit: 'sq ft', category: 'site' },
  { id: 'site-3', name: 'Chain Link Fence', unitCost: 30, unit: 'linear ft', category: 'site' },
  { id: 'site-4', name: 'Landscaping (Basic)', unitCost: 2.5, unit: 'sq ft', category: 'site' },
  { id: 'site-5', name: 'Landscaping (Premium)', unitCost: 5, unit: 'sq ft', category: 'site' },
  { id: 'site-6', name: 'Sprinkler System', unitCost: 1.5, unit: 'sq ft', category: 'site' },
  { id: 'site-7', name: 'Exterior Lighting', unitCost: 750, unit: 'each', category: 'site' }
];

// Additional building components
const BUILDING_COMPONENTS = [
  { id: 'comp-1', name: 'Garage (Attached)', unitCost: 60, unit: 'sq ft', category: 'accessory' },
  { id: 'comp-2', name: 'Garage (Detached)', unitCost: 70, unit: 'sq ft', category: 'accessory' },
  { id: 'comp-3', name: 'Deck (Wooden)', unitCost: 35, unit: 'sq ft', category: 'accessory' },
  { id: 'comp-4', name: 'Patio (Concrete)', unitCost: 15, unit: 'sq ft', category: 'accessory' },
  { id: 'comp-5', name: 'Pool (In-ground)', unitCost: 125, unit: 'sq ft', category: 'accessory' },
  { id: 'comp-6', name: 'Fireplace', unitCost: 8500, unit: 'each', category: 'interior' },
  { id: 'comp-7', name: 'Premium Kitchen', unitCost: 25000, unit: 'each', category: 'interior' },
  { id: 'comp-8', name: 'Premium Bathroom', unitCost: 15000, unit: 'each', category: 'interior' }
];

const CostManual: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [propertyName, setPropertyName] = useState('Sample Residential Property');
  const [buildingType, setBuildingType] = useState<string>('residential-1story');
  const [qualityLevel, setQualityLevel] = useState<string>('average');
  const [squareFeet, setSquareFeet] = useState<number>(2400);
  const [yearBuilt, setYearBuilt] = useState<number>(2005);
  const [locationMultiplier, setLocationMultiplier] = useState<string>('loc-2');
  const [timeMultiplier, setTimeMultiplier] = useState<string>('time-1');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customElements, setCustomElements] = useState<CostElement[]>([]);
  const [siteElements, setSiteElements] = useState<CostElement[]>([
    { 
      id: 'site-local-1', 
      name: 'Asphalt Driveway', 
      unitCost: 8, 
      quantity: 800, 
      unit: 'sq ft', 
      adjustmentFactor: 1.0, 
      category: 'site' 
    },
    { 
      id: 'site-local-2', 
      name: 'Concrete Sidewalk', 
      unitCost: 12, 
      quantity: 200, 
      unit: 'sq ft', 
      adjustmentFactor: 1.0, 
      category: 'site' 
    },
    { 
      id: 'site-local-3', 
      name: 'Landscaping (Basic)', 
      unitCost: 2.5, 
      quantity: 3000, 
      unit: 'sq ft', 
      adjustmentFactor: 1.0, 
      category: 'site' 
    }
  ]);
  
  // Get the selected building schedule
  const getSelectedBuildingSchedule = (): BuildingCostSchedule | undefined => {
    return BUILDING_COST_SCHEDULES.find(schedule => schedule.id === buildingType);
  };
  
  // Get the location multiplier value
  const getLocationMultiplierValue = (): number => {
    const multiplier = LOCATION_MULTIPLIERS.find(m => m.id === locationMultiplier);
    return multiplier ? multiplier.factor : 1.0;
  };
  
  // Get the time multiplier value
  const getTimeMultiplierValue = (): number => {
    const multiplier = TIME_MULTIPLIERS.find(m => m.id === timeMultiplier);
    return multiplier ? multiplier.factor : 1.0;
  };
  
  // Get the quality factor
  const getQualityFactor = (): number => {
    const schedule = getSelectedBuildingSchedule();
    if (!schedule) return 1.0;
    
    switch (qualityLevel) {
      case 'low':
        return schedule.qualityLevels.low;
      case 'good':
        return schedule.qualityLevels.good;
      case 'excellent':
        return schedule.qualityLevels.excellent;
      default:
        return schedule.qualityLevels.average;
    }
  };
  
  // Calculate base building cost
  const calculateBaseBuildingCost = (): number => {
    const schedule = getSelectedBuildingSchedule();
    if (!schedule) return 0;
    
    // Base cost per square foot
    const baseCostPerSF = schedule.baseRate;
    
    // Apply quality factor
    const qualityAdjustedCost = baseCostPerSF * getQualityFactor();
    
    // Calculate total base cost
    const baseCost = qualityAdjustedCost * squareFeet;
    
    return baseCost;
  };
  
  // Calculate adjustments for selected features
  const calculateFeatureAdjustments = (): number => {
    const schedule = getSelectedBuildingSchedule();
    if (!schedule) return 0;
    
    let adjustmentTotal = 0;
    
    // Calculate adjustments for selected features
    for (const featureId of selectedFeatures) {
      const feature = schedule.adjustmentFactors.find(f => f.name === featureId);
      if (feature) {
        adjustmentTotal += feature.factor * calculateBaseBuildingCost();
      }
    }
    
    return adjustmentTotal;
  };
  
  // Calculate cost of site improvements
  const calculateSiteImprovementsCost = (): number => {
    return siteElements.reduce((total, element) => {
      return total + (element.unitCost * element.quantity * element.adjustmentFactor);
    }, 0);
  };
  
  // Calculate cost of custom elements
  const calculateCustomElementsCost = (): number => {
    return customElements.reduce((total, element) => {
      return total + (element.unitCost * element.quantity * element.adjustmentFactor);
    }, 0);
  };
  
  // Calculate total replacement cost
  const calculateTotalReplacementCost = (): number => {
    // Base building cost
    const baseBuildingCost = calculateBaseBuildingCost();
    
    // Feature adjustments
    const featureAdjustments = calculateFeatureAdjustments();
    
    // Site improvements
    const siteImprovementsCost = calculateSiteImprovementsCost();
    
    // Custom elements
    const customElementsCost = calculateCustomElementsCost();
    
    // Subtotal before location and time adjustments
    const subtotal = baseBuildingCost + featureAdjustments + siteImprovementsCost + customElementsCost;
    
    // Apply location and time multipliers
    const locationFactor = getLocationMultiplierValue();
    const timeFactor = getTimeMultiplierValue();
    
    // Final total
    const total = subtotal * locationFactor * timeFactor;
    
    return total;
  };
  
  // Add a new site element
  const addSiteElement = (elementId: string) => {
    const element = SITE_IMPROVEMENTS.find(e => e.id === elementId);
    if (!element) return;
    
    const newElement: CostElement = {
      id: `site-local-${siteElements.length + 1}`,
      name: element.name,
      unitCost: element.unitCost,
      quantity: 0,
      unit: element.unit,
      adjustmentFactor: 1.0,
      category: 'site'
    };
    
    setSiteElements([...siteElements, newElement]);
  };
  
  // Update a site element
  const updateSiteElement = (id: string, field: keyof CostElement, value: any) => {
    const updatedElements = siteElements.map(element => {
      if (element.id === id) {
        return { ...element, [field]: value };
      }
      return element;
    });
    
    setSiteElements(updatedElements);
  };
  
  // Remove a site element
  const removeSiteElement = (id: string) => {
    setSiteElements(siteElements.filter(element => element.id !== id));
  };
  
  // Add a new custom element
  const addCustomElement = () => {
    const newElement: CostElement = {
      id: `custom-${customElements.length + 1}`,
      name: 'New Component',
      unitCost: 0,
      quantity: 0,
      unit: 'each',
      adjustmentFactor: 1.0,
      category: 'interior'
    };
    
    setCustomElements([...customElements, newElement]);
  };
  
  // Update a custom element
  const updateCustomElement = (id: string, field: keyof CostElement, value: any) => {
    const updatedElements = customElements.map(element => {
      if (element.id === id) {
        return { ...element, [field]: value };
      }
      return element;
    });
    
    setCustomElements(updatedElements);
  };
  
  // Remove a custom element
  const removeCustomElement = (id: string) => {
    setCustomElements(customElements.filter(element => element.id !== id));
  };
  
  // Toggle a feature selection
  const toggleFeature = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };
  
  // Check if a feature is selected
  const isFeatureSelected = (feature: string): boolean => {
    return selectedFeatures.includes(feature);
  };
  
  // Calculate replacement cost per square foot
  const calculateCostPerSquareFoot = (): number => {
    const totalCost = calculateTotalReplacementCost();
    return totalCost / squareFeet;
  };
  
  // Calculate the depreciated value
  const calculateDepreciatedValue = (): number => {
    const totalCost = calculateTotalReplacementCost();
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    
    // Simple straight-line depreciation for demo purposes
    const economicLife = 60; // Assume 60-year economic life for buildings
    const remainingLife = Math.max(economicLife - age, 0);
    const depreciationPct = Math.min((economicLife - remainingLife) / economicLife, 0.90);
    
    const depreciation = totalCost * depreciationPct;
    return totalCost - depreciation;
  };
  
  // Get all the cost elements for display
  const getAllCostElements = (): { name: string; cost: number }[] => {
    const elements: { name: string; cost: number }[] = [];
    
    // Base building cost
    elements.push({
      name: 'Base Building',
      cost: calculateBaseBuildingCost()
    });
    
    // Feature adjustments
    const schedule = getSelectedBuildingSchedule();
    if (schedule) {
      selectedFeatures.forEach(featureId => {
        const feature = schedule.adjustmentFactors.find(f => f.name === featureId);
        if (feature) {
          elements.push({
            name: feature.name,
            cost: feature.factor * calculateBaseBuildingCost()
          });
        }
      });
    }
    
    // Site improvements
    siteElements.forEach(element => {
      elements.push({
        name: element.name,
        cost: element.unitCost * element.quantity * element.adjustmentFactor
      });
    });
    
    // Custom elements
    customElements.forEach(element => {
      elements.push({
        name: element.name,
        cost: element.unitCost * element.quantity * element.adjustmentFactor
      });
    });
    
    return elements;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Replacement Cost Manual</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="calculator">Cost Calculator</TabsTrigger>
          <TabsTrigger value="costbook">Cost Manual</TabsTrigger>
          <TabsTrigger value="schedules">Component Schedules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Building Information</CardTitle>
                  <CardDescription>
                    Enter basic property information for cost estimation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="property-name">Property Name/Description</Label>
                        <Input 
                          id="property-name" 
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="building-type">Building Type</Label>
                        <Select 
                          value={buildingType}
                          onValueChange={setBuildingType}
                        >
                          <SelectTrigger id="building-type">
                            <SelectValue placeholder="Select Building Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUILDING_COST_SCHEDULES.map((schedule) => (
                              <SelectItem key={schedule.id} value={schedule.id}>
                                {schedule.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getSelectedBuildingSchedule()?.description}
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="quality-level">Quality Level</Label>
                        <Select 
                          value={qualityLevel}
                          onValueChange={setQualityLevel}
                        >
                          <SelectTrigger id="quality-level">
                            <SelectValue placeholder="Select Quality Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Quality</SelectItem>
                            <SelectItem value="average">Average Quality</SelectItem>
                            <SelectItem value="good">Good Quality</SelectItem>
                            <SelectItem value="excellent">Excellent Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="square-feet">Building Size (Square Feet)</Label>
                        <Input 
                          id="square-feet" 
                          type="number"
                          value={squareFeet}
                          onChange={(e) => setSquareFeet(parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="year-built">Year Built</Label>
                        <Input 
                          id="year-built" 
                          type="number"
                          value={yearBuilt}
                          onChange={(e) => setYearBuilt(parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location-multiplier">Location</Label>
                          <Select 
                            value={locationMultiplier}
                            onValueChange={setLocationMultiplier}
                          >
                            <SelectTrigger id="location-multiplier">
                              <SelectValue placeholder="Select Location" />
                            </SelectTrigger>
                            <SelectContent>
                              {LOCATION_MULTIPLIERS.map((multiplier) => (
                                <SelectItem key={multiplier.id} value={multiplier.id}>
                                  {multiplier.name} ({multiplier.factor.toFixed(2)}x)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="time-multiplier">Time Period</Label>
                          <Select 
                            value={timeMultiplier}
                            onValueChange={setTimeMultiplier}
                          >
                            <SelectTrigger id="time-multiplier">
                              <SelectValue placeholder="Select Time Period" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_MULTIPLIERS.map((multiplier) => (
                                <SelectItem key={multiplier.id} value={multiplier.id}>
                                  {multiplier.name} ({multiplier.factor.toFixed(2)}x)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Building Features</CardTitle>
                  <CardDescription>
                    Select additional features and building components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Standard Features</h3>
                      {getSelectedBuildingSchedule()?.adjustmentFactors.map((feature) => (
                        <div key={feature.name} className="flex items-center space-x-2 mb-2">
                          <Checkbox 
                            id={`feature-${feature.name}`}
                            checked={isFeatureSelected(feature.name)}
                            onCheckedChange={() => toggleFeature(feature.name)}
                          />
                          <Label 
                            htmlFor={`feature-${feature.name}`}
                            className="text-sm flex-1"
                          >
                            {feature.name}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            +{(feature.factor * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium">Site Improvements</h3>
                        <Select onValueChange={addSiteElement}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Add site feature" />
                          </SelectTrigger>
                          <SelectContent>
                            {SITE_IMPROVEMENTS.map((improvement) => (
                              <SelectItem key={improvement.id} value={improvement.id}>
                                {improvement.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {siteElements.length > 0 ? (
                        <div className="space-y-2">
                          {siteElements.map((element) => (
                            <div key={element.id} className="flex items-center gap-2 text-sm">
                              <div className="flex-1">{element.name}</div>
                              <Input 
                                type="number"
                                value={element.quantity}
                                onChange={(e) => updateSiteElement(element.id, 'quantity', parseInt(e.target.value))}
                                className="w-16 h-8 text-xs"
                              />
                              <div className="w-10 text-xs">{element.unit}</div>
                              <div className="w-16 text-xs text-right">
                                ${element.unitCost.toFixed(2)}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeSiteElement(element.id)}
                                className="h-6 w-6"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4 text-destructive" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-sm text-muted-foreground border rounded-md">
                          No site improvements added
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Custom Building Components</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addCustomElement}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Component
                      </Button>
                    </div>
                    
                    {customElements.length > 0 ? (
                      <div className="space-y-3">
                        {customElements.map((element) => (
                          <div key={element.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                              <Input 
                                placeholder="Name" 
                                value={element.name}
                                onChange={(e) => updateCustomElement(element.id, 'name', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input 
                                type="number"
                                placeholder="Unit Cost" 
                                value={element.unitCost}
                                onChange={(e) => updateCustomElement(element.id, 'unitCost', parseFloat(e.target.value))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input 
                                type="number"
                                placeholder="Quantity" 
                                value={element.quantity}
                                onChange={(e) => updateCustomElement(element.id, 'quantity', parseFloat(e.target.value))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Select 
                                value={element.unit}
                                onValueChange={(value) => updateCustomElement(element.id, 'unit', value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="each">Each</SelectItem>
                                  <SelectItem value="sq ft">Sq Ft</SelectItem>
                                  <SelectItem value="linear ft">Linear Ft</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Select 
                                value={element.category}
                                onValueChange={(value: any) => updateCustomElement(element.id, 'category', value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="exterior">Exterior</SelectItem>
                                  <SelectItem value="interior">Interior</SelectItem>
                                  <SelectItem value="mechanical">Mechanical</SelectItem>
                                  <SelectItem value="site">Site</SelectItem>
                                  <SelectItem value="accessory">Accessory</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeCustomElement(element.id)}
                                className="h-8 w-8"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4 text-destructive" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-muted-foreground border rounded-md">
                        No custom components added
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Replacement Cost Analysis</CardTitle>
                  <CardDescription>
                    Cost summary based on the inputs provided
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-primary">
                      ${Math.round(calculateTotalReplacementCost()).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Replacement Cost New
                    </p>
                    <div className="text-sm font-medium mt-1">
                      ${calculateCostPerSquareFoot().toFixed(2)} per square foot
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Cost Breakdown</h3>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Component</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getAllCostElements().map((element, index) => (
                            <TableRow key={index}>
                              <TableCell>{element.name}</TableCell>
                              <TableCell className="text-right">${Math.round(element.cost).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-medium">Subtotal</TableCell>
                            <TableCell className="text-right font-medium">
                              ${Math.round(
                                calculateBaseBuildingCost() + 
                                calculateFeatureAdjustments() + 
                                calculateSiteImprovementsCost() + 
                                calculateCustomElementsCost()
                              ).toLocaleString()}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Location Multiplier ({getLocationMultiplierValue().toFixed(2)}x)</TableCell>
                            <TableCell className="text-right">
                              ${Math.round(
                                (calculateBaseBuildingCost() + 
                                calculateFeatureAdjustments() + 
                                calculateSiteImprovementsCost() + 
                                calculateCustomElementsCost()) * 
                                (getLocationMultiplierValue() - 1)
                              ).toLocaleString()}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Time Multiplier ({getTimeMultiplierValue().toFixed(2)}x)</TableCell>
                            <TableCell className="text-right">
                              ${Math.round(
                                (calculateBaseBuildingCost() + 
                                calculateFeatureAdjustments() + 
                                calculateSiteImprovementsCost() + 
                                calculateCustomElementsCost()) * 
                                getLocationMultiplierValue() * 
                                (getTimeMultiplierValue() - 1)
                              ).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Depreciated Value</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Year Built:</span>
                        <span>{yearBuilt}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Building Age:</span>
                        <span>{new Date().getFullYear() - yearBuilt} years</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Depreciated Value:</span>
                        <span className="font-medium">${Math.round(calculateDepreciatedValue()).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <CalculatorIcon className="h-4 w-4 mr-2" />
                    Apply to Valuation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="costbook">
          <Card>
            <CardHeader>
              <CardTitle>Cost Manual Reference</CardTitle>
              <CardDescription>
                Standard costs for various building types and components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Building Base Costs (Per Square Foot)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Building Type</TableHead>
                              <TableHead>Base Rate</TableHead>
                              <TableHead>Low Quality</TableHead>
                              <TableHead>Average Quality</TableHead>
                              <TableHead>Good Quality</TableHead>
                              <TableHead>Excellent Quality</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {BUILDING_COST_SCHEDULES.map((schedule) => (
                              <TableRow key={schedule.id}>
                                <TableCell>{schedule.name}</TableCell>
                                <TableCell>${schedule.baseRate.toFixed(2)}</TableCell>
                                <TableCell>${(schedule.baseRate * schedule.qualityLevels.low).toFixed(2)}</TableCell>
                                <TableCell>${(schedule.baseRate * schedule.qualityLevels.average).toFixed(2)}</TableCell>
                                <TableCell>${(schedule.baseRate * schedule.qualityLevels.good).toFixed(2)}</TableCell>
                                <TableCell>${(schedule.baseRate * schedule.qualityLevels.excellent).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">Site Improvements</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {SITE_IMPROVEMENTS.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>Per {item.unit}</TableCell>
                                  <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">Building Components</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {BUILDING_COMPONENTS.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>Per {item.unit}</TableCell>
                                  <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div>
                  <Card className="mb-6">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Location Multipliers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Location</TableHead>
                              <TableHead className="text-right">Multiplier</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {LOCATION_MULTIPLIERS.map((location) => (
                              <TableRow key={location.id}>
                                <TableCell>{location.name}</TableCell>
                                <TableCell className="text-right">{location.factor.toFixed(2)}x</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Time/Historical Multipliers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead className="text-right">Multiplier</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {TIME_MULTIPLIERS.map((time) => (
                              <TableRow key={time.id}>
                                <TableCell>{time.name}</TableCell>
                                <TableCell className="text-right">{time.factor.toFixed(2)}x</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Component Cost Schedules</CardTitle>
              <CardDescription>
                Detailed component breakdowns for different building types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 border-2 border-dashed rounded-md text-center">
                <BuildingIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Detailed Component Schedules</h3>
                <p className="text-muted-foreground max-w-xl mx-auto mb-4">
                  This section would typically contain detailed breakdowns of building components by system
                  (foundation, framing, roofing, etc.) with costs for different quality levels. Professional
                  cost manuals contain hundreds of pages of these detailed schedules.
                </p>
                <div className="flex justify-center">
                  <Button variant="outline">
                    <Table2 className="h-4 w-4 mr-2" />
                    View Sample Component Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostManual;