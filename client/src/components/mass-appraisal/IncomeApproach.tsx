import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calculator, 
  CalculatorIcon, 
  PlusCircle, 
  Save, 
  FileDown, 
  Settings, 
  FileText, 
  Building,
  ChevronRightIcon,
  ChevronDownIcon,
  RefreshCw,
  Trash
} from 'lucide-react';

interface IncomeProperty {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  squareFeet: number;
  yearBuilt: number;
  units: number;
  occupancyRate: number;
  grossIncome: number;
  expenses: Expense[];
  additionalIncomeStreams: IncomeStream[];
  reserveAllowance: number;
  vacancyAllowance: number;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  isPercentOfEGI: boolean;
  percentValue?: number;
}

interface IncomeStream {
  id: string;
  name: string;
  amount: number;
  notes?: string;
}

interface MarketRent {
  propertyType: string;
  location: string;
  quality: string;
  minRent: number;
  maxRent: number;
  avgRent: number;
  unit: string;
}

interface CapRateData {
  propertyType: string;
  class: string;
  location: string;
  minRate: number;
  maxRate: number;
  avgRate: number;
}

const DEFAULT_INCOME_PROPERTY: IncomeProperty = {
  id: '1',
  name: 'Commercial Office Building',
  propertyType: 'Office',
  address: '123 Main Street, Grandview, WA 98930',
  squareFeet: 15000,
  yearBuilt: 1995,
  units: 8,
  occupancyRate: 0.92,
  grossIncome: 270000,
  expenses: [
    { id: 'exp1', name: 'Property Taxes', amount: 28500, isPercentOfEGI: false },
    { id: 'exp2', name: 'Insurance', amount: 12000, isPercentOfEGI: false },
    { id: 'exp3', name: 'Utilities', amount: 15000, isPercentOfEGI: false },
    { id: 'exp4', name: 'Management', amount: 0, isPercentOfEGI: true, percentValue: 4 },
    { id: 'exp5', name: 'Maintenance', amount: 18500, isPercentOfEGI: false },
    { id: 'exp6', name: 'Janitorial', amount: 20000, isPercentOfEGI: false },
    { id: 'exp7', name: 'Landscaping', amount: 9200, isPercentOfEGI: false }
  ],
  additionalIncomeStreams: [
    { id: 'inc1', name: 'Parking', amount: 12000, notes: 'Reserved spaces' },
    { id: 'inc2', name: 'Vending/Laundry', amount: 3600, notes: 'On-site machines' }
  ],
  reserveAllowance: 0.03,
  vacancyAllowance: 0.05
};

const MARKET_RENTS: MarketRent[] = [
  { propertyType: 'Office', location: 'Downtown', quality: 'Class A', minRent: 20, maxRent: 28, avgRent: 24, unit: 'sf/year' },
  { propertyType: 'Office', location: 'Downtown', quality: 'Class B', minRent: 16, maxRent: 22, avgRent: 18, unit: 'sf/year' },
  { propertyType: 'Office', location: 'Suburban', quality: 'Class A', minRent: 18, maxRent: 24, avgRent: 20, unit: 'sf/year' },
  { propertyType: 'Office', location: 'Suburban', quality: 'Class B', minRent: 14, maxRent: 20, avgRent: 16, unit: 'sf/year' },
  { propertyType: 'Retail', location: 'Downtown', quality: 'Class A', minRent: 24, maxRent: 36, avgRent: 30, unit: 'sf/year' },
  { propertyType: 'Retail', location: 'Downtown', quality: 'Class B', minRent: 18, maxRent: 26, avgRent: 22, unit: 'sf/year' },
  { propertyType: 'Retail', location: 'Suburban', quality: 'Class A', minRent: 22, maxRent: 30, avgRent: 25, unit: 'sf/year' },
  { propertyType: 'Retail', location: 'Suburban', quality: 'Class B', minRent: 16, maxRent: 22, avgRent: 18, unit: 'sf/year' },
  { propertyType: 'Industrial', location: 'Downtown', quality: 'Class A', minRent: 9, maxRent: 14, avgRent: 11, unit: 'sf/year' },
  { propertyType: 'Industrial', location: 'Suburban', quality: 'Class A', minRent: 7, maxRent: 12, avgRent: 9, unit: 'sf/year' },
  { propertyType: 'Apartment', location: 'Downtown', quality: 'Class A', minRent: 1500, maxRent: 2200, avgRent: 1800, unit: 'unit/month' },
  { propertyType: 'Apartment', location: 'Downtown', quality: 'Class B', minRent: 1200, maxRent: 1800, avgRent: 1450, unit: 'unit/month' },
  { propertyType: 'Apartment', location: 'Suburban', quality: 'Class A', minRent: 1300, maxRent: 1900, avgRent: 1600, unit: 'unit/month' },
  { propertyType: 'Apartment', location: 'Suburban', quality: 'Class B', minRent: 1000, maxRent: 1500, avgRent: 1200, unit: 'unit/month' }
];

const CAP_RATES: CapRateData[] = [
  { propertyType: 'Office', class: 'Class A', location: 'Downtown', minRate: 0.055, maxRate: 0.065, avgRate: 0.060 },
  { propertyType: 'Office', class: 'Class B', location: 'Downtown', minRate: 0.065, maxRate: 0.075, avgRate: 0.070 },
  { propertyType: 'Office', class: 'Class A', location: 'Suburban', minRate: 0.060, maxRate: 0.070, avgRate: 0.065 },
  { propertyType: 'Office', class: 'Class B', location: 'Suburban', minRate: 0.070, maxRate: 0.080, avgRate: 0.075 },
  { propertyType: 'Retail', class: 'Class A', location: 'Downtown', minRate: 0.050, maxRate: 0.060, avgRate: 0.055 },
  { propertyType: 'Retail', class: 'Class B', location: 'Downtown', minRate: 0.060, maxRate: 0.070, avgRate: 0.065 },
  { propertyType: 'Retail', class: 'Class A', location: 'Suburban', minRate: 0.055, maxRate: 0.065, avgRate: 0.060 },
  { propertyType: 'Retail', class: 'Class B', location: 'Suburban', minRate: 0.065, maxRate: 0.075, avgRate: 0.070 },
  { propertyType: 'Industrial', class: 'Class A', location: 'All', minRate: 0.065, maxRate: 0.075, avgRate: 0.070 },
  { propertyType: 'Industrial', class: 'Class B', location: 'All', minRate: 0.075, maxRate: 0.085, avgRate: 0.080 },
  { propertyType: 'Apartment', class: 'Class A', location: 'Downtown', minRate: 0.040, maxRate: 0.050, avgRate: 0.045 },
  { propertyType: 'Apartment', class: 'Class B', location: 'Downtown', minRate: 0.050, maxRate: 0.060, avgRate: 0.055 },
  { propertyType: 'Apartment', class: 'Class A', location: 'Suburban', minRate: 0.045, maxRate: 0.055, avgRate: 0.050 },
  { propertyType: 'Apartment', class: 'Class B', location: 'Suburban', minRate: 0.055, maxRate: 0.065, avgRate: 0.060 }
];

const IncomeApproach: React.FC = () => {
  const [activeTab, setActiveTab] = useState('direct');
  const [property, setProperty] = useState<IncomeProperty>(DEFAULT_INCOME_PROPERTY);
  const [capRate, setCapRate] = useState<number>(0.065);
  const [directCapValue, setDirectCapValue] = useState<number>(0);
  const [grossRentMultiplier, setGrossRentMultiplier] = useState<number>(8.5);
  const [grmValue, setGrmValue] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0.09);
  const [growthRate, setGrowthRate] = useState<number>(0.02);
  const [projectionYears, setProjectionYears] = useState<number>(10);
  const [dcfValue, setDcfValue] = useState<number>(0);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>(property.propertyType);
  const [selectedQuality, setSelectedQuality] = useState<string>('Class A');
  const [selectedLocation, setSelectedLocation] = useState<string>('Downtown');
  
  // Calculate PGI (Potential Gross Income)
  const calculatePGI = (): number => {
    const baseIncome = property.grossIncome;
    const additionalIncome = property.additionalIncomeStreams.reduce((sum, income) => sum + income.amount, 0);
    return baseIncome + additionalIncome;
  };
  
  // Calculate EGI (Effective Gross Income)
  const calculateEGI = (): number => {
    const pgi = calculatePGI();
    const vacancyAndCollection = pgi * property.vacancyAllowance;
    return pgi - vacancyAndCollection;
  };
  
  // Calculate Operating Expenses
  const calculateExpenses = (): number => {
    const egi = calculateEGI();
    
    return property.expenses.reduce((sum, expense) => {
      if (expense.isPercentOfEGI && expense.percentValue) {
        return sum + (egi * (expense.percentValue / 100));
      }
      return sum + expense.amount;
    }, 0);
  };
  
  // Calculate NOI (Net Operating Income)
  const calculateNOI = (): number => {
    const egi = calculateEGI();
    const expenses = calculateExpenses();
    const reserves = egi * property.reserveAllowance;
    return egi - expenses - reserves;
  };
  
  // Direct Capitalization Approach
  const calculateDirectCapitalization = (): number => {
    const noi = calculateNOI();
    return noi / capRate;
  };
  
  // Gross Rent Multiplier Approach
  const calculateGRM = (): number => {
    return property.grossIncome * grossRentMultiplier;
  };
  
  // Discounted Cash Flow Approach
  const calculateDCF = (): number => {
    const noi = calculateNOI();
    let presentValue = 0;
    
    // Calculate the present value of the projected NOIs
    for (let year = 1; year <= projectionYears; year++) {
      // Apply growth rate to NOI
      const projectedNOI = noi * Math.pow(1 + growthRate, year);
      
      // Calculate present value of this year's NOI
      const yearPV = projectedNOI / Math.pow(1 + discountRate, year);
      presentValue += yearPV;
    }
    
    // Add terminal value (capitalized value of NOI in year n+1, discounted to present)
    const terminalNOI = noi * Math.pow(1 + growthRate, projectionYears + 1);
    const terminalValue = terminalNOI / (capRate - growthRate); // Terminal cap rate assumption
    const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, projectionYears);
    
    return presentValue + presentTerminalValue;
  };
  
  // Calculate cash flow projection for each year
  const calculateCashFlowProjection = () => {
    const noi = calculateNOI();
    const projections = [];
    
    for (let year = 1; year <= projectionYears; year++) {
      const projectedNOI = noi * Math.pow(1 + growthRate, year);
      const pvFactor = 1 / Math.pow(1 + discountRate, year);
      const presentValue = projectedNOI * pvFactor;
      
      projections.push({
        year,
        noi: projectedNOI,
        pvFactor,
        presentValue
      });
    }
    
    // Add terminal value
    const terminalNOI = noi * Math.pow(1 + growthRate, projectionYears + 1);
    const terminalValue = terminalNOI / (capRate - growthRate);
    const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, projectionYears);
    
    projections.push({
      year: 'Terminal',
      noi: terminalNOI,
      pvFactor: 1 / Math.pow(1 + discountRate, projectionYears),
      presentValue: presentTerminalValue
    });
    
    return projections;
  };
  
  // Update property values
  const updateProperty = (field: keyof IncomeProperty, value: any) => {
    setProperty({
      ...property,
      [field]: value
    });
  };
  
  // Update expense values
  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    const updatedExpenses = property.expenses.map(expense => {
      if (expense.id === id) {
        return { ...expense, [field]: value };
      }
      return expense;
    });
    
    setProperty({
      ...property,
      expenses: updatedExpenses
    });
  };
  
  // Add a new expense
  const addExpense = () => {
    const newExpense: Expense = {
      id: `exp${property.expenses.length + 1}`,
      name: 'New Expense',
      amount: 0,
      isPercentOfEGI: false
    };
    
    setProperty({
      ...property,
      expenses: [...property.expenses, newExpense]
    });
  };
  
  // Remove an expense
  const removeExpense = (id: string) => {
    setProperty({
      ...property,
      expenses: property.expenses.filter(expense => expense.id !== id)
    });
  };
  
  // Add a new income stream
  const addIncomeStream = () => {
    const newIncome: IncomeStream = {
      id: `inc${property.additionalIncomeStreams.length + 1}`,
      name: 'New Income Stream',
      amount: 0
    };
    
    setProperty({
      ...property,
      additionalIncomeStreams: [...property.additionalIncomeStreams, newIncome]
    });
  };
  
  // Update income stream values
  const updateIncomeStream = (id: string, field: keyof IncomeStream, value: any) => {
    const updatedStreams = property.additionalIncomeStreams.map(stream => {
      if (stream.id === id) {
        return { ...stream, [field]: value };
      }
      return stream;
    });
    
    setProperty({
      ...property,
      additionalIncomeStreams: updatedStreams
    });
  };
  
  // Remove an income stream
  const removeIncomeStream = (id: string) => {
    setProperty({
      ...property,
      additionalIncomeStreams: property.additionalIncomeStreams.filter(stream => stream.id !== id)
    });
  };
  
  // Find market cap rates for the selected property type and class
  const getMarketCapRates = (): CapRateData | undefined => {
    return CAP_RATES.find(rate => 
      rate.propertyType === selectedPropertyType && 
      rate.class === selectedQuality &&
      (rate.location === selectedLocation || rate.location === 'All')
    );
  };
  
  // Find market rents for the selected property type and class
  const getMarketRents = (): MarketRent | undefined => {
    return MARKET_RENTS.find(rent => 
      rent.propertyType === selectedPropertyType && 
      rent.quality === selectedQuality &&
      rent.location === selectedLocation
    );
  };
  
  // Apply market cap rate
  const applyMarketCapRate = () => {
    const marketData = getMarketCapRates();
    if (marketData) {
      setCapRate(marketData.avgRate);
    }
  };
  
  // Calculate weighted value based on different approaches
  const calculateWeightedValue = (): number => {
    // Typical weights for different property types
    let directCapWeight, grmWeight, dcfWeight;
    
    switch (property.propertyType) {
      case 'Office':
      case 'Retail':
        directCapWeight = 0.6;
        grmWeight = 0.1;
        dcfWeight = 0.3;
        break;
      case 'Industrial':
        directCapWeight = 0.7;
        grmWeight = 0.2;
        dcfWeight = 0.1;
        break;
      case 'Apartment':
        directCapWeight = 0.5;
        grmWeight = 0.3;
        dcfWeight = 0.2;
        break;
      default:
        directCapWeight = 0.6;
        grmWeight = 0.2;
        dcfWeight = 0.2;
    }
    
    return (directCapValue * directCapWeight) + 
           (grmValue * grmWeight) + 
           (dcfValue * dcfWeight);
  };
  
  // Recalculate values when inputs change
  useEffect(() => {
    const directCap = calculateDirectCapitalization();
    setDirectCapValue(directCap);
    
    const grm = calculateGRM();
    setGrmValue(grm);
    
    const dcf = calculateDCF();
    setDcfValue(dcf);
  }, [property, capRate, grossRentMultiplier, discountRate, growthRate, projectionYears]);
  
  // Default to the property type when component loads
  useEffect(() => {
    setSelectedPropertyType(property.propertyType);
  }, [property.propertyType]);
  
  // Final weighted value
  const weightedValue = calculateWeightedValue();
  
  // Cash flow projections for DCF
  const cashFlowProjections = calculateCashFlowProjection();
  
  // PGI, EGI, NOI calculations
  const pgi = calculatePGI();
  const egi = calculateEGI();
  const expenses = calculateExpenses();
  const noi = calculateNOI();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Income Approach Valuation</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="direct">Direct Capitalization</TabsTrigger>
              <TabsTrigger value="grm">GRM/GIM</TabsTrigger>
              <TabsTrigger value="dcf">Discounted Cash Flow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct">
              <Card>
                <CardHeader>
                  <CardTitle>Direct Capitalization Approach</CardTitle>
                  <CardDescription>
                    Values property by capitalizing the net operating income using market-derived cap rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Market-Derived Cap Rates</CardTitle>
                          <CardDescription>Select property type to see market rates</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor="property-type">Property Type</Label>
                              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                                <SelectTrigger id="property-type">
                                  <SelectValue placeholder="Property Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Office">Office</SelectItem>
                                  <SelectItem value="Retail">Retail</SelectItem>
                                  <SelectItem value="Industrial">Industrial</SelectItem>
                                  <SelectItem value="Apartment">Apartment</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="quality-class">Quality Class</Label>
                              <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                                <SelectTrigger id="quality-class">
                                  <SelectValue placeholder="Quality" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Class A">Class A</SelectItem>
                                  <SelectItem value="Class B">Class B</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="location">Location</Label>
                              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger id="location">
                                  <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Downtown">Downtown</SelectItem>
                                  <SelectItem value="Suburban">Suburban</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-3">
                            {getMarketCapRates() ? (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Range:</span>
                                  <span className="text-sm font-medium">
                                    {(getMarketCapRates()?.minRate! * 100).toFixed(1)}% - {(getMarketCapRates()?.maxRate! * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Average:</span>
                                  <span className="text-sm font-medium">
                                    {(getMarketCapRates()?.avgRate! * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  className="w-full mt-2"
                                  onClick={applyMarketCapRate}
                                >
                                  Apply Market Cap Rate
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                No market data available for the selected criteria
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="cap-rate">Applied Capitalization Rate (%)</Label>
                            <div className="flex gap-2 items-center">
                              <Input 
                                id="cap-rate" 
                                type="number" 
                                step="0.1"
                                min="0.1"
                                max="20"
                                value={(capRate * 100).toFixed(1)}
                                onChange={(e) => setCapRate(parseFloat(e.target.value) / 100)}
                                className="text-right"
                              />
                              <span className="text-lg">%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Value Indication</CardTitle>
                          <CardDescription>Direct Capitalization Method</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary">
                              ${Math.round(directCapValue).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Derived from NOI ÷ Cap Rate
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Net Operating Income (NOI):</span>
                              <span className="text-sm font-medium">${Math.round(noi).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Capitalization Rate:</span>
                              <span className="text-sm font-medium">{(capRate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-sm font-medium">Value per SF:</span>
                              <span className="text-sm font-medium">
                                ${(directCapValue / property.squareFeet).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-3 bg-muted/20">
                            <div className="text-xs text-muted-foreground">
                              <p>The direct capitalization approach converts a single year's income estimate into a value estimate by dividing the income by an appropriate cap rate.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="grm">
              <Card>
                <CardHeader>
                  <CardTitle>Gross Rent Multiplier Approach</CardTitle>
                  <CardDescription>
                    Values property by multiplying gross income by a market-derived multiplier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Gross Rent Multiplier</CardTitle>
                        <CardDescription>Enter market-derived GRM or GIM</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="property-type-grm">Property Type</Label>
                            <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                              <SelectTrigger id="property-type-grm">
                                <SelectValue placeholder="Property Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Office">Office</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Industrial">Industrial</SelectItem>
                                <SelectItem value="Apartment">Apartment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="quality-class-grm">Quality Class</Label>
                            <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                              <SelectTrigger id="quality-class-grm">
                                <SelectValue placeholder="Quality" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Class A">Class A</SelectItem>
                                <SelectItem value="Class B">Class B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium mb-2">Typical Market Multipliers</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Office (Class A):</span>
                              <span>7.5 - 9.5</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Office (Class B):</span>
                              <span>6.5 - 8.5</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Retail (Class A):</span>
                              <span>8.0 - 10.0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Retail (Class B):</span>
                              <span>7.0 - 9.0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Industrial:</span>
                              <span>6.0 - 8.0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Apartment:</span>
                              <span>7.0 - 10.0</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="grm">Gross Rent Multiplier</Label>
                          <Input 
                            id="grm" 
                            type="number" 
                            step="0.1"
                            min="1"
                            max="20"
                            value={grossRentMultiplier}
                            onChange={(e) => setGrossRentMultiplier(parseFloat(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="gross-income">Gross Income (Annual)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input 
                              id="gross-income" 
                              type="number"
                              value={property.grossIncome}
                              onChange={(e) => updateProperty('grossIncome', parseFloat(e.target.value))}
                              className="pl-7"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Value Indication</CardTitle>
                        <CardDescription>Gross Rent Multiplier Method</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            ${Math.round(grmValue).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Derived from Gross Income × GRM
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Gross Income (Annual):</span>
                            <span className="text-sm font-medium">${Math.round(property.grossIncome).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Gross Rent Multiplier:</span>
                            <span className="text-sm font-medium">{grossRentMultiplier.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-medium">Value per SF:</span>
                            <span className="text-sm font-medium">
                              ${(grmValue / property.squareFeet).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-3 bg-muted/20">
                          <div className="text-xs text-muted-foreground">
                            <p>The Gross Rent Multiplier approach is a simpler method that uses a factor applied to gross income. It's useful for quick estimates but less precise than other methods.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dcf">
              <Card>
                <CardHeader>
                  <CardTitle>Discounted Cash Flow Analysis</CardTitle>
                  <CardDescription>
                    Values property by discounting future income streams to present value
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                            <div className="flex gap-2 items-center">
                              <Input 
                                id="discount-rate" 
                                type="number" 
                                step="0.1"
                                min="1"
                                max="20"
                                value={(discountRate * 100).toFixed(1)}
                                onChange={(e) => setDiscountRate(parseFloat(e.target.value) / 100)}
                                className="text-right"
                              />
                              <span>%</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="growth-rate">Growth Rate (%)</Label>
                            <div className="flex gap-2 items-center">
                              <Input 
                                id="growth-rate" 
                                type="number" 
                                step="0.1"
                                min="0"
                                max="10"
                                value={(growthRate * 100).toFixed(1)}
                                onChange={(e) => setGrowthRate(parseFloat(e.target.value) / 100)}
                                className="text-right"
                              />
                              <span>%</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="projection-years">Years</Label>
                            <Input 
                              id="projection-years" 
                              type="number" 
                              min="5"
                              max="20"
                              value={projectionYears}
                              onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                        
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">Cash Flow Projection</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="rounded-md border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Year</TableHead>
                                    <TableHead className="text-right">NOI</TableHead>
                                    <TableHead className="text-right">PV Factor</TableHead>
                                    <TableHead className="text-right">Present Value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {cashFlowProjections.map((projection, index) => (
                                    <TableRow key={index} className={projection.year === 'Terminal' ? 'font-medium' : ''}>
                                      <TableCell>{projection.year}</TableCell>
                                      <TableCell className="text-right">
                                        ${Math.round(projection.noi).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {projection.pvFactor.toFixed(4)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        ${Math.round(projection.presentValue).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Value Indication</CardTitle>
                        <CardDescription>Discounted Cash Flow Method</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            ${Math.round(dcfValue).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sum of discounted future income streams
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">First Year NOI:</span>
                            <span className="text-sm font-medium">${Math.round(noi).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Terminal Cap Rate:</span>
                            <span className="text-sm font-medium">{(capRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Discount Rate:</span>
                            <span className="text-sm font-medium">{(discountRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Growth Rate:</span>
                            <span className="text-sm font-medium">{(growthRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-medium">Value per SF:</span>
                            <span className="text-sm font-medium">
                              ${(dcfValue / property.squareFeet).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-3 bg-muted/20">
                          <div className="text-xs text-muted-foreground">
                            <p>The Discounted Cash Flow approach accounts for the time value of money by discounting projected future cash flows to their present value.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Final Value Reconciliation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Value Reconciliation</CardTitle>
              <CardDescription>
                Reconciliation of values from different income approaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        ${Math.round(directCapValue).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Direct Capitalization</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        ${Math.round(grmValue).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">GRM</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        ${Math.round(dcfValue).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Discounted Cash Flow</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-primary-foreground border-primary">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        ${Math.round(weightedValue).toLocaleString()}
                      </div>
                      <p className="text-sm font-medium">Final Value Indication</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button>
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Apply to Final Valuation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="property-name">Property Name</Label>
                <Input 
                  id="property-name" 
                  value={property.name}
                  onChange={(e) => updateProperty('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="property-address">Address</Label>
                <Input 
                  id="property-address" 
                  value={property.address}
                  onChange={(e) => updateProperty('address', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property-type">Property Type</Label>
                  <Select 
                    value={property.propertyType}
                    onValueChange={(value) => updateProperty('propertyType', value)}
                  >
                    <SelectTrigger id="property-type">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="property-sf">Square Feet</Label>
                  <Input 
                    id="property-sf" 
                    type="number"
                    value={property.squareFeet}
                    onChange={(e) => updateProperty('squareFeet', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property-units">Units/Tenants</Label>
                  <Input 
                    id="property-units" 
                    type="number"
                    value={property.units}
                    onChange={(e) => updateProperty('units', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="property-year">Year Built</Label>
                  <Input 
                    id="property-year" 
                    type="number"
                    value={property.yearBuilt}
                    onChange={(e) => updateProperty('yearBuilt', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property-occupancy">Occupancy Rate (%)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      id="property-occupancy" 
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={(property.occupancyRate * 100).toFixed(0)}
                      onChange={(e) => updateProperty('occupancyRate', parseInt(e.target.value) / 100)}
                      className="text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="property-vacancy">Vacancy Allowance (%)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      id="property-vacancy" 
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={(property.vacancyAllowance * 100).toFixed(0)}
                      onChange={(e) => updateProperty('vacancyAllowance', parseInt(e.target.value) / 100)}
                      className="text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Income & Expense Analysis</CardTitle>
              <CardDescription>
                Operating income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" defaultValue={['income', 'expenses', 'ratios']}>
                <AccordionItem value="income">
                  <AccordionTrigger className="px-6">Income Sources</AccordionTrigger>
                  <AccordionContent className="space-y-4 px-6 pb-6">
                    <div>
                      <Label htmlFor="gross-income">Potential Gross Rental Income</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          id="gross-income" 
                          type="number"
                          value={property.grossIncome}
                          onChange={(e) => updateProperty('grossIncome', parseFloat(e.target.value))}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Additional Income Sources</Label>
                        <Button variant="ghost" size="sm" onClick={addIncomeStream}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      
                      {property.additionalIncomeStreams.length > 0 ? (
                        <div className="space-y-3">
                          {property.additionalIncomeStreams.map((income, index) => (
                            <div key={income.id} className="flex items-center gap-2">
                              <Input 
                                placeholder="Name" 
                                value={income.name}
                                onChange={(e) => updateIncomeStream(income.id, 'name', e.target.value)}
                                className="w-1/3"
                              />
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input 
                                  type="number"
                                  placeholder="Amount" 
                                  value={income.amount}
                                  onChange={(e) => updateIncomeStream(income.id, 'amount', parseFloat(e.target.value))}
                                  className="pl-7"
                                />
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeIncomeStream(income.id)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-sm text-muted-foreground border rounded-md">
                          No additional income sources added
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Potential Gross Income (PGI):</span>
                        <span className="font-medium">${Math.round(pgi).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Less: Vacancy & Collection Loss ({(property.vacancyAllowance * 100).toFixed(0)}%):</span>
                        <span className="font-medium text-destructive">-${Math.round(pgi * property.vacancyAllowance).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-sm font-medium">Effective Gross Income (EGI):</span>
                        <span className="font-medium">${Math.round(egi).toLocaleString()}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="expenses">
                  <AccordionTrigger className="px-6">Operating Expenses</AccordionTrigger>
                  <AccordionContent className="space-y-4 px-6 pb-6">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Expense Categories</Label>
                      <Button variant="ghost" size="sm" onClick={addExpense}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    {property.expenses.length > 0 ? (
                      <div className="space-y-3">
                        {property.expenses.map((expense) => (
                          <div key={expense.id} className="flex items-center gap-2">
                            <Input 
                              placeholder="Name" 
                              value={expense.name}
                              onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                              className="w-1/3"
                            />
                            {expense.isPercentOfEGI ? (
                              <>
                                <div className="relative flex-1">
                                  <Input 
                                    type="number"
                                    placeholder="Percent" 
                                    value={expense.percentValue}
                                    onChange={(e) => updateExpense(expense.id, 'percentValue', parseFloat(e.target.value))}
                                    className="pr-8"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateExpense(expense.id, 'isPercentOfEGI', false)}
                                >
                                  Use $
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input 
                                    type="number"
                                    placeholder="Amount" 
                                    value={expense.amount}
                                    onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value))}
                                    className="pl-7"
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateExpense(expense.id, 'isPercentOfEGI', true)}
                                >
                                  Use %
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeExpense(expense.id)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-muted-foreground border rounded-md">
                        No expenses added
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="reserve-allowance">Replacement Reserves (%)</Label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          id="reserve-allowance" 
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={(property.reserveAllowance * 100).toFixed(1)}
                          onChange={(e) => updateProperty('reserveAllowance', parseFloat(e.target.value) / 100)}
                          className="text-right"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Effective Gross Income:</span>
                        <span className="font-medium">${Math.round(egi).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Operating Expenses:</span>
                        <span className="font-medium text-destructive">-${Math.round(expenses).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Replacement Reserves ({(property.reserveAllowance * 100).toFixed(1)}%):</span>
                        <span className="font-medium text-destructive">-${Math.round(egi * property.reserveAllowance).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-sm font-medium">Net Operating Income (NOI):</span>
                        <span className="font-medium">${Math.round(noi).toLocaleString()}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ratios">
                  <AccordionTrigger className="px-6">Operating Ratios</AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expense Ratio (% of EGI):</span>
                        <span className="text-sm font-medium">
                          {((expenses / egi) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Operating Ratio (% of EGI):</span>
                        <span className="text-sm font-medium">
                          {(((expenses + (egi * property.reserveAllowance)) / egi) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">NOI Ratio (% of EGI):</span>
                        <span className="text-sm font-medium">
                          {((noi / egi) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Occupancy Rate:</span>
                        <span className="text-sm font-medium">
                          {(property.occupancyRate * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Per Square Foot Metrics:</span>
                        <span className="text-sm font-medium">
                          ${(noi / property.squareFeet).toFixed(2)}/sf NOI
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncomeApproach;