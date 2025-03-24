import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Save, 
  FileUp, 
  FileDown, 
  CalculatorIcon, 
  Map, 
  RefreshCw,
  HelpCircle,
  Building
} from 'lucide-react';

interface CompProperty {
  id: string;
  address: string;
  saleDate: string;
  salePrice: number;
  adjustedPrice: number;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  quality: string;
  condition: string;
  adjustments: {
    time: number;
    location: number;
    size: number;
    quality: number;
    age: number;
    condition: number;
    lotSize: number;
    features: number;
    other: number;
  };
  netAdjustment: number;
  netAdjustmentPercent: number;
}

interface SubjectProperty {
  address: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  quality: string;
  condition: string;
}

const SalesComparisonGrid: React.FC = () => {
  const [subjectProperty, setSubjectProperty] = useState<SubjectProperty>({
    address: '2204 Hill Dr, Grandview, WA 98930',
    squareFeet: 1850,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1995,
    lotSize: 0.25,
    quality: 'Average',
    condition: 'Good'
  });
  
  const [comps, setComps] = useState<CompProperty[]>([
    {
      id: '1',
      address: '2187 Wine Country Rd, Grandview, WA',
      saleDate: '2024-01-15',
      salePrice: 329000,
      adjustedPrice: 335580,
      squareFeet: 1780,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 1992,
      lotSize: 0.22,
      quality: 'Average',
      condition: 'Good',
      adjustments: {
        time: 3300,
        location: 0,
        size: 4200,
        quality: 0,
        age: -1500,
        condition: 0,
        lotSize: 1500,
        features: -1000,
        other: 0
      },
      netAdjustment: 6500,
      netAdjustmentPercent: 2.0
    },
    {
      id: '2',
      address: '1140 Elm St, Grandview, WA',
      saleDate: '2023-11-20',
      salePrice: 355000,
      adjustedPrice: 348435,
      squareFeet: 2050,
      bedrooms: 4,
      bathrooms: 2.5,
      yearBuilt: 2002,
      lotSize: 0.28,
      quality: 'Good',
      condition: 'Good',
      adjustments: {
        time: 7100,
        location: -5000,
        size: -12000,
        quality: -8000,
        age: 3500,
        condition: 0,
        lotSize: 2000,
        features: 5000,
        other: 0
      },
      netAdjustment: -7400,
      netAdjustmentPercent: -2.1
    },
    {
      id: '3',
      address: '825 Highland Dr, Grandview, WA',
      saleDate: '2023-12-05',
      salePrice: 315000,
      adjustedPrice: 328230,
      squareFeet: 1680,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 1990,
      lotSize: 0.19,
      quality: 'Average',
      condition: 'Average',
      adjustments: {
        time: 5250,
        location: 0,
        size: 10200,
        quality: 0,
        age: -2500,
        condition: 7500,
        lotSize: -3000,
        features: -4000,
        other: 0
      },
      netAdjustment: 13450,
      netAdjustmentPercent: 4.3
    }
  ]);
  
  const [searchLocation, setSearchLocation] = useState('Grandview, WA');
  const [searchRadius, setSearchRadius] = useState('1');
  const [timePeriod, setTimePeriod] = useState('6');
  const [adjustmentFactors, setAdjustmentFactors] = useState({
    timePerMonth: 0.5,
    locationFactor: 5.0,
    sqftFactor: 60,
    bedroomFactor: 5000,
    bathroomFactor: 10000,
    ageFactor: 500,
    qualityFactors: {
      'Poor-Average': 15000,
      'Average-Good': 20000,
      'Good-Excellent': 30000
    },
    conditionFactors: {
      'Poor-Average': 15000,
      'Average-Good': 15000,
      'Good-Excellent': 20000
    },
    lotSizeFactor: 50000
  });

  // Function to calculate value indication based on comps
  const calculateValueIndication = (): { min: number; max: number; average: number; weightedAverage: number } => {
    if (comps.length === 0) {
      return { min: 0, max: 0, average: 0, weightedAverage: 0 };
    }
    
    const adjustedPrices = comps.map(comp => comp.adjustedPrice);
    const min = Math.min(...adjustedPrices);
    const max = Math.max(...adjustedPrices);
    const average = adjustedPrices.reduce((sum, price) => sum + price, 0) / adjustedPrices.length;
    
    // Calculate weighted average based on net adjustment percentage (lower % = higher weight)
    const weights = comps.map(comp => Math.max(0, 10 - Math.abs(comp.netAdjustmentPercent)));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      return { min, max, average, weightedAverage: average };
    }
    
    const weightedAverage = comps.reduce((sum, comp, index) => {
      return sum + (comp.adjustedPrice * weights[index] / totalWeight);
    }, 0);
    
    return { min, max, average, weightedAverage };
  };
  
  // Function to add a new comparable property
  const addComp = () => {
    const newId = (Math.max(...comps.map(comp => parseInt(comp.id)), 0) + 1).toString();
    const newComp: CompProperty = {
      id: newId,
      address: '',
      saleDate: new Date().toISOString().slice(0, 10),
      salePrice: 0,
      adjustedPrice: 0,
      squareFeet: 0,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2000,
      lotSize: 0.25,
      quality: 'Average',
      condition: 'Average',
      adjustments: {
        time: 0,
        location: 0,
        size: 0,
        quality: 0,
        age: 0,
        condition: 0,
        lotSize: 0,
        features: 0,
        other: 0
      },
      netAdjustment: 0,
      netAdjustmentPercent: 0
    };
    setComps([...comps, newComp]);
  };
  
  // Function to remove a comparable property
  const removeComp = (id: string) => {
    setComps(comps.filter(comp => comp.id !== id));
  };
  
  // Function to update a comparable property
  const updateComp = (id: string, field: string, value: any) => {
    const updatedComps = comps.map(comp => {
      if (comp.id === id) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...comp,
            [parent]: {
              ...comp[parent as keyof CompProperty],
              [child]: value
            }
          };
        }
        return { ...comp, [field]: value };
      }
      return comp;
    });
    
    // Recalculate adjustments and adjusted prices
    const finalComps = updatedComps.map(comp => {
      const adjustedPrice = calculateAdjustedPrice(comp);
      const netAdjustment = calculateNetAdjustment(comp);
      const netAdjustmentPercent = (netAdjustment / comp.salePrice) * 100;
      
      return {
        ...comp,
        adjustedPrice,
        netAdjustment,
        netAdjustmentPercent
      };
    });
    
    setComps(finalComps);
  };
  
  // Function to calculate net adjustment
  const calculateNetAdjustment = (comp: CompProperty): number => {
    return Object.values(comp.adjustments).reduce((sum, adj) => sum + adj, 0);
  };
  
  // Function to calculate adjusted price
  const calculateAdjustedPrice = (comp: CompProperty): number => {
    const netAdjustment = calculateNetAdjustment(comp);
    return comp.salePrice + netAdjustment;
  };
  
  // Function to update subject property
  const updateSubject = (field: string, value: any) => {
    setSubjectProperty({
      ...subjectProperty,
      [field]: value
    });
    
    // Recalculate all comp adjustments based on new subject
    recalculateAllAdjustments();
  };
  
  // Function to recalculate all adjustments
  const recalculateAllAdjustments = () => {
    const updatedComps = comps.map(comp => {
      const adjustments = calculateAdjustments(comp);
      const netAdjustment = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
      const netAdjustmentPercent = comp.salePrice ? (netAdjustment / comp.salePrice) * 100 : 0;
      
      return {
        ...comp,
        adjustments,
        netAdjustment,
        netAdjustmentPercent,
        adjustedPrice: comp.salePrice + netAdjustment
      };
    });
    
    setComps(updatedComps);
  };
  
  // Calculate adjustments based on the subject property and comparable
  const calculateAdjustments = (comp: CompProperty) => {
    const today = new Date();
    const saleDate = new Date(comp.saleDate);
    const monthsDiff = (today.getFullYear() - saleDate.getFullYear()) * 12 + 
                       (today.getMonth() - saleDate.getMonth());
    
    // Time adjustment (price appreciation)
    const timeAdj = comp.salePrice * (adjustmentFactors.timePerMonth / 100) * monthsDiff;
    
    // Size adjustment
    const sizeAdj = (subjectProperty.squareFeet - comp.squareFeet) * adjustmentFactors.sqftFactor;
    
    // Age adjustment
    const ageAdj = (comp.yearBuilt - subjectProperty.yearBuilt) * adjustmentFactors.ageFactor;
    
    // Quality adjustment
    let qualityAdj = 0;
    if (subjectProperty.quality !== comp.quality) {
      if (subjectProperty.quality === 'Average' && comp.quality === 'Poor') {
        qualityAdj = adjustmentFactors.qualityFactors['Poor-Average'];
      } else if (subjectProperty.quality === 'Good' && comp.quality === 'Average') {
        qualityAdj = adjustmentFactors.qualityFactors['Average-Good'];
      } else if (subjectProperty.quality === 'Excellent' && comp.quality === 'Good') {
        qualityAdj = adjustmentFactors.qualityFactors['Good-Excellent'];
      } else if (subjectProperty.quality === 'Poor' && comp.quality === 'Average') {
        qualityAdj = -adjustmentFactors.qualityFactors['Poor-Average'];
      } else if (subjectProperty.quality === 'Average' && comp.quality === 'Good') {
        qualityAdj = -adjustmentFactors.qualityFactors['Average-Good'];
      } else if (subjectProperty.quality === 'Good' && comp.quality === 'Excellent') {
        qualityAdj = -adjustmentFactors.qualityFactors['Good-Excellent'];
      }
    }
    
    // Condition adjustment
    let conditionAdj = 0;
    if (subjectProperty.condition !== comp.condition) {
      if (subjectProperty.condition === 'Average' && comp.condition === 'Poor') {
        conditionAdj = adjustmentFactors.conditionFactors['Poor-Average'];
      } else if (subjectProperty.condition === 'Good' && comp.condition === 'Average') {
        conditionAdj = adjustmentFactors.conditionFactors['Average-Good'];
      } else if (subjectProperty.condition === 'Excellent' && comp.condition === 'Good') {
        conditionAdj = adjustmentFactors.conditionFactors['Good-Excellent'];
      } else if (subjectProperty.condition === 'Poor' && comp.condition === 'Average') {
        conditionAdj = -adjustmentFactors.conditionFactors['Poor-Average'];
      } else if (subjectProperty.condition === 'Average' && comp.condition === 'Good') {
        conditionAdj = -adjustmentFactors.conditionFactors['Average-Good'];
      } else if (subjectProperty.condition === 'Good' && comp.condition === 'Excellent') {
        conditionAdj = -adjustmentFactors.conditionFactors['Good-Excellent'];
      }
    }
    
    // Lot size adjustment
    const lotSizeAdj = (subjectProperty.lotSize - comp.lotSize) * adjustmentFactors.lotSizeFactor;
    
    return {
      time: Math.round(timeAdj),
      location: comp.adjustments.location, // Keep existing location adjustment
      size: Math.round(sizeAdj),
      quality: Math.round(qualityAdj),
      age: Math.round(ageAdj),
      condition: Math.round(conditionAdj),
      lotSize: Math.round(lotSizeAdj),
      features: comp.adjustments.features, // Keep existing features adjustment
      other: comp.adjustments.other // Keep existing other adjustment
    };
  };
  
  // Get the value indication from the comps
  const valueIndication = calculateValueIndication();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Comparison Approach</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Grid
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Map className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Property Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Subject Property
            </CardTitle>
            <CardDescription>
              Property being valued
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject-address">Address</Label>
              <Input 
                id="subject-address" 
                value={subjectProperty.address}
                onChange={(e) => updateSubject('address', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject-sqft">Square Feet</Label>
                <Input 
                  id="subject-sqft" 
                  type="number"
                  value={subjectProperty.squareFeet}
                  onChange={(e) => updateSubject('squareFeet', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="subject-lotsize">Lot Size (acres)</Label>
                <Input 
                  id="subject-lotsize" 
                  type="number"
                  step="0.01"
                  value={subjectProperty.lotSize}
                  onChange={(e) => updateSubject('lotSize', parseFloat(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject-beds">Beds</Label>
                <Input 
                  id="subject-beds" 
                  type="number"
                  value={subjectProperty.bedrooms}
                  onChange={(e) => updateSubject('bedrooms', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="subject-baths">Baths</Label>
                <Input 
                  id="subject-baths" 
                  type="number"
                  step="0.5"
                  value={subjectProperty.bathrooms}
                  onChange={(e) => updateSubject('bathrooms', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="subject-year">Year Built</Label>
                <Input 
                  id="subject-year" 
                  type="number"
                  value={subjectProperty.yearBuilt}
                  onChange={(e) => updateSubject('yearBuilt', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject-quality">Quality</Label>
                <Select 
                  value={subjectProperty.quality}
                  onValueChange={(value) => updateSubject('quality', value)}
                >
                  <SelectTrigger id="subject-quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject-condition">Condition</Label>
                <Select 
                  value={subjectProperty.condition}
                  onValueChange={(value) => updateSubject('condition', value)}
                >
                  <SelectTrigger id="subject-condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4">
              <Button variant="secondary" className="w-full" onClick={recalculateAllAdjustments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Adjustments
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Search Comparables Card */}
        <Card>
          <CardHeader>
            <CardTitle>Find Comparables</CardTitle>
            <CardDescription>
              Search for similar properties in the area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search-location">Location</Label>
              <Input 
                id="search-location" 
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search-radius">Search Radius (miles)</Label>
                <Select 
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                >
                  <SelectTrigger id="search-radius">
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="time-period">Time Period (months)</Label>
                <Select 
                  value={timePeriod}
                  onValueChange={setTimePeriod}
                >
                  <SelectTrigger id="time-period">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-sqft">Min Sq Ft</Label>
                <Input id="min-sqft" type="number" placeholder={`${Math.floor(subjectProperty.squareFeet * 0.8)}`} />
              </div>
              
              <div>
                <Label htmlFor="max-sqft">Max Sq Ft</Label>
                <Input id="max-sqft" type="number" placeholder={`${Math.ceil(subjectProperty.squareFeet * 1.2)}`} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Property Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {subjectProperty.bedrooms}+ Bedrooms
                </Badge>
                <Badge variant="outline">
                  {subjectProperty.bathrooms}+ Bathrooms
                </Badge>
                <Badge variant="outline">
                  Similar Quality
                </Badge>
                <Badge variant="outline">
                  Similar Age
                </Badge>
              </div>
            </div>
            
            <Button className="w-full mt-2">
              Search Comparables
            </Button>
          </CardContent>
        </Card>
        
        {/* Value Indication Card */}
        <Card>
          <CardHeader>
            <CardTitle>Value Indication</CardTitle>
            <CardDescription>
              Estimated value based on {comps.length} comparables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <div className="text-3xl font-bold text-primary">
                ${Math.round(valueIndication.weightedAverage).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Weighted Average Indication</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-xl font-semibold">${Math.round(valueIndication.min).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Minimum</p>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">${Math.round(valueIndication.average).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Simple Average</p>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">${Math.round(valueIndication.max).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Maximum</p>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Analysis Weight</span>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <Table>
                <TableBody>
                  {comps.map((comp) => (
                    <TableRow key={comp.id} className="text-sm">
                      <TableCell className="py-1 truncate max-w-[180px]">{comp.address}</TableCell>
                      <TableCell className="py-1 text-right">
                        {Math.abs(comp.netAdjustmentPercent) < 5 ? 
                          <Badge variant="default">High</Badge> : 
                          Math.abs(comp.netAdjustmentPercent) < 10 ? 
                            <Badge variant="secondary">Medium</Badge> : 
                            <Badge variant="outline">Low</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <Button className="w-full mt-2" variant="outline">
              <CalculatorIcon className="h-4 w-4 mr-2" />
              Apply to Valuation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Comparables Grid */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Comparable Properties</CardTitle>
              <CardDescription>
                Properties similar to the subject for valuation analysis
              </CardDescription>
            </div>
            <Button size="sm" onClick={addComp}>
              <Plus className="h-4 w-4 mr-2" />
              Add Comparable
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Address</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Sq Ft</TableHead>
                  <TableHead className="text-right">Bed/Bath</TableHead>
                  <TableHead className="text-right">Year</TableHead>
                  <TableHead className="text-right">Lot Size</TableHead>
                  <TableHead className="text-right">Quality</TableHead>
                  <TableHead className="text-right">Condition</TableHead>
                  <TableHead className="text-right">Net Adj.</TableHead>
                  <TableHead className="text-right">Adj. Price</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comps.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <Input 
                        value={comp.address} 
                        onChange={(e) => updateComp(comp.id, 'address', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="date" 
                        value={comp.saleDate} 
                        onChange={(e) => updateComp(comp.id, 'saleDate', e.target.value)}
                        className="h-8 w-32"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" 
                        value={comp.salePrice} 
                        onChange={(e) => updateComp(comp.id, 'salePrice', parseFloat(e.target.value))}
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" 
                        value={comp.squareFeet} 
                        onChange={(e) => updateComp(comp.id, 'squareFeet', parseFloat(e.target.value))}
                        className="h-8 text-right w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input 
                          type="number" 
                          value={comp.bedrooms} 
                          onChange={(e) => updateComp(comp.id, 'bedrooms', parseInt(e.target.value))}
                          className="h-8 text-right w-12"
                        />
                        <span>/</span>
                        <Input 
                          type="number" 
                          step="0.5"
                          value={comp.bathrooms} 
                          onChange={(e) => updateComp(comp.id, 'bathrooms', parseFloat(e.target.value))}
                          className="h-8 text-right w-12"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" 
                        value={comp.yearBuilt} 
                        onChange={(e) => updateComp(comp.id, 'yearBuilt', parseInt(e.target.value))}
                        className="h-8 text-right w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" 
                        step="0.01"
                        value={comp.lotSize} 
                        onChange={(e) => updateComp(comp.id, 'lotSize', parseFloat(e.target.value))}
                        className="h-8 text-right w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        value={comp.quality}
                        onValueChange={(value) => updateComp(comp.id, 'quality', value)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue placeholder="Quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Poor">Poor</SelectItem>
                          <SelectItem value="Average">Average</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        value={comp.condition}
                        onValueChange={(value) => updateComp(comp.id, 'condition', value)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Poor">Poor</SelectItem>
                          <SelectItem value="Average">Average</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <span>${comp.netAdjustment.toLocaleString()}</span>
                        <Badge variant={Math.abs(comp.netAdjustmentPercent) < 10 ? "outline" : "destructive"} className="ml-1">
                          {comp.netAdjustmentPercent > 0 ? '+' : ''}{comp.netAdjustmentPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${comp.adjustedPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeComp(comp.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment Grid</CardTitle>
          <CardDescription>
            Detailed adjustments for each comparable property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Subject</TableHead>
                  {comps.map((comp) => (
                    <TableHead key={`head-${comp.id}`} className="text-right">Comp {comp.id}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Sale Price</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`price-${comp.id}`} className="text-right">${comp.salePrice.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Time Adjustment</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`time-${comp.id}`} className="text-right">
                      {comp.adjustments.time > 0 ? '+' : ''}{comp.adjustments.time.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell>{subjectProperty.address}</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`loc-${comp.id}`} className="text-right">
                      {comp.adjustments.location === 0 ? 
                        '-' : 
                        `${comp.adjustments.location > 0 ? '+' : ''}${comp.adjustments.location.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Size/GLA</TableCell>
                  <TableCell>{subjectProperty.squareFeet.toLocaleString()} sf</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`size-${comp.id}`} className="text-right">
                      {comp.adjustments.size === 0 ? 
                        '-' : 
                        `${comp.adjustments.size > 0 ? '+' : ''}${comp.adjustments.size.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Quality</TableCell>
                  <TableCell>{subjectProperty.quality}</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`qual-${comp.id}`} className="text-right">
                      {comp.adjustments.quality === 0 ? 
                        '-' : 
                        `${comp.adjustments.quality > 0 ? '+' : ''}${comp.adjustments.quality.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Age/Year Built</TableCell>
                  <TableCell>{subjectProperty.yearBuilt}</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`age-${comp.id}`} className="text-right">
                      {comp.adjustments.age === 0 ? 
                        '-' : 
                        `${comp.adjustments.age > 0 ? '+' : ''}${comp.adjustments.age.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Condition</TableCell>
                  <TableCell>{subjectProperty.condition}</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`cond-${comp.id}`} className="text-right">
                      {comp.adjustments.condition === 0 ? 
                        '-' : 
                        `${comp.adjustments.condition > 0 ? '+' : ''}${comp.adjustments.condition.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Lot Size</TableCell>
                  <TableCell>{subjectProperty.lotSize.toFixed(2)} acres</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`lot-${comp.id}`} className="text-right">
                      {comp.adjustments.lotSize === 0 ? 
                        '-' : 
                        `${comp.adjustments.lotSize > 0 ? '+' : ''}${comp.adjustments.lotSize.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Features</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`feat-${comp.id}`} className="text-right">
                      {comp.adjustments.features === 0 ? 
                        '-' : 
                        `${comp.adjustments.features > 0 ? '+' : ''}${comp.adjustments.features.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell>Other</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`other-${comp.id}`} className="text-right">
                      {comp.adjustments.other === 0 ? 
                        '-' : 
                        `${comp.adjustments.other > 0 ? '+' : ''}${comp.adjustments.other.toLocaleString()}`
                      }
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Net Adjustment</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`net-${comp.id}`} className="text-right font-medium">
                      {comp.netAdjustment > 0 ? '+' : ''}{comp.netAdjustment.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Net Adjustment %</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell 
                      key={`netpct-${comp.id}`} 
                      className={`text-right font-medium ${Math.abs(comp.netAdjustmentPercent) > 15 ? 'text-destructive' : Math.abs(comp.netAdjustmentPercent) > 10 ? 'text-amber-500' : ''}`}
                    >
                      {comp.netAdjustmentPercent > 0 ? '+' : ''}{comp.netAdjustmentPercent.toFixed(1)}%
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Adjusted Price</TableCell>
                  <TableCell>-</TableCell>
                  {comps.map((comp) => (
                    <TableCell key={`adj-${comp.id}`} className="text-right font-bold">
                      ${comp.adjustedPrice.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesComparisonGrid;