import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calculator, Download, Info, RotateCcw, Save } from 'lucide-react';

const DepreciationCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [qualityClass, setQualityClass] = useState('average');
  const [year, setYear] = useState(new Date().getFullYear() - 30); // Default to 30 years old
  const [chronologicalAge, setChronologicalAge] = useState(30);
  const [effectiveAge, setEffectiveAge] = useState(25);
  const [remainingEconomicLife, setRemainingEconomicLife] = useState(35);
  const [totalEconomicLife, setTotalEconomicLife] = useState(60);
  const [replacementCost, setReplacementCost] = useState(200000);
  const [physicalDepreciation, setPhysicalDepreciation] = useState(0);
  const [functionalObsolescence, setFunctionalObsolescence] = useState(5);
  const [externalObsolescence, setExternalObsolescence] = useState(3);
  const [totalDepreciation, setTotalDepreciation] = useState(0);
  const [depreciatedValue, setDepreciatedValue] = useState(0);

  // Map quality class to expected life and other characteristics
  const qualityClassMap = {
    excellent: { economicLife: 75, depreciationRate: 0.013, description: 'Excellent quality, superior materials and craftsmanship' },
    good: { economicLife: 70, depreciationRate: 0.014, description: 'Good quality, above average materials and workmanship' },
    average: { economicLife: 60, depreciationRate: 0.017, description: 'Average quality, standard materials and acceptable workmanship' },
    fair: { economicLife: 50, depreciationRate: 0.020, description: 'Fair quality, economy materials and minimal standards' },
    poor: { economicLife: 40, depreciationRate: 0.025, description: 'Poor quality, inferior materials and below standard workmanship' }
  };

  // Life adjustment factors based on maintenance
  const maintenanceFactors = {
    excellent: 0.8,  // Well-maintained, reduces effective age
    good: 0.9,       // Good maintenance
    average: 1.0,    // Average maintenance
    fair: 1.1,       // Below average maintenance
    poor: 1.2        // Poor maintenance, increases effective age
  };

  // Handle year input change
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || new Date().getFullYear();
    setYear(value);
    const newChronologicalAge = new Date().getFullYear() - value;
    setChronologicalAge(newChronologicalAge > 0 ? newChronologicalAge : 0);
  };

  // Handle effective age change
  const handleEffectiveAgeChange = (newEffectiveAge: number[]) => {
    setEffectiveAge(newEffectiveAge[0]);
  };

  // Handle functional obsolescence change
  const handleFunctionalObsolescenceChange = (values: number[]) => {
    setFunctionalObsolescence(values[0]);
  };

  // Handle external obsolescence change
  const handleExternalObsolescenceChange = (values: number[]) => {
    setExternalObsolescence(values[0]);
  };

  // Handle quality class change
  const handleQualityClassChange = (value: string) => {
    setQualityClass(value);
    setTotalEconomicLife(qualityClassMap[value as keyof typeof qualityClassMap].economicLife);
  };

  // Handle replacement cost change
  const handleReplacementCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
    setReplacementCost(value);
  };

  // Reset all inputs
  const handleReset = () => {
    setYear(new Date().getFullYear() - 30);
    setChronologicalAge(30);
    setEffectiveAge(25);
    setQualityClass('average');
    setTotalEconomicLife(60);
    setReplacementCost(200000);
    setFunctionalObsolescence(5);
    setExternalObsolescence(3);
  };

  // Calculate depreciation whenever inputs change
  useEffect(() => {
    // Calculate physical depreciation based on effective age and total economic life
    const physicalDepreciationPercent = (effectiveAge / totalEconomicLife) * 100;
    setPhysicalDepreciation(physicalDepreciationPercent);
    
    // Calculate total depreciation
    const totalDepreciationPercent = physicalDepreciationPercent + functionalObsolescence + externalObsolescence;
    setTotalDepreciation(Math.min(totalDepreciationPercent, 100)); // Cap at 100%
    
    // Calculate depreciated value
    const depreciatedValue = replacementCost * (1 - (totalDepreciationPercent / 100));
    setDepreciatedValue(Math.max(depreciatedValue, 0)); // Ensure non-negative
    
    // Update remaining economic life
    setRemainingEconomicLife(Math.max(totalEconomicLife - effectiveAge, 0));
  }, [effectiveAge, totalEconomicLife, functionalObsolescence, externalObsolescence, replacementCost]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="tables">Depreciation Tables</TabsTrigger>
          <TabsTrigger value="comparison">Property Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Accrued Depreciation Calculator</CardTitle>
                  <CardDescription>
                    Calculate physical depreciation, functional obsolescence, and external obsolescence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="year-built" className="mb-2 block">Year Built</Label>
                        <div className="flex items-center">
                          <Input
                            id="year-built"
                            type="number"
                            value={year}
                            onChange={handleYearChange}
                            className="w-full"
                          />
                          <Badge variant="outline" className="ml-2">
                            Age: {chronologicalAge} years
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="quality-class" className="mb-2 block">Quality Class</Label>
                        <Select value={qualityClass} onValueChange={handleQualityClassChange}>
                          <SelectTrigger id="quality-class">
                            <SelectValue placeholder="Select quality class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {qualityClassMap[qualityClass as keyof typeof qualityClassMap].description}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="effective-age">Effective Age</Label>
                          <span className="text-sm font-medium">{effectiveAge} years</span>
                        </div>
                        <Slider
                          id="effective-age"
                          defaultValue={[25]}
                          max={Math.max(chronologicalAge * 1.5, totalEconomicLife)}
                          step={1}
                          value={[effectiveAge]}
                          onValueChange={handleEffectiveAgeChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>New</span>
                          <span>Chronological Age: {chronologicalAge}</span>
                          <span>End of Life</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="replacement-cost" className="mb-2 block">Replacement Cost New</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="replacement-cost"
                            type="text"
                            value={replacementCost.toLocaleString()}
                            onChange={handleReplacementCostChange}
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="physical-depreciation">Physical Depreciation</Label>
                          <span className="text-sm font-medium">{physicalDepreciation.toFixed(1)}%</span>
                        </div>
                        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(physicalDepreciation, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on effective age ({effectiveAge} years) and economic life ({totalEconomicLife} years)
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="functional-obsolescence">Functional Obsolescence</Label>
                          <span className="text-sm font-medium">{functionalObsolescence}%</span>
                        </div>
                        <Slider
                          id="functional-obsolescence"
                          defaultValue={[5]}
                          max={50}
                          step={1}
                          value={[functionalObsolescence]}
                          onValueChange={handleFunctionalObsolescenceChange}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Reduction in value due to outdated features or design
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="external-obsolescence">External Obsolescence</Label>
                          <span className="text-sm font-medium">{externalObsolescence}%</span>
                        </div>
                        <Slider
                          id="external-obsolescence"
                          defaultValue={[3]}
                          max={50}
                          step={1}
                          value={[externalObsolescence]}
                          onValueChange={handleExternalObsolescenceChange}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Loss in value from external factors (location, market conditions)
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Remaining Economic Life</Label>
                          <span className="text-sm font-medium">{remainingEconomicLife} years</span>
                        </div>
                        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${(remainingEconomicLife / totalEconomicLife) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Economic Life: {totalEconomicLife} years
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-between">
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    
                    <div className="space-x-2">
                      <Button variant="outline">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button>
                        <Calculator className="h-4 w-4 mr-2" />
                        Apply to Valuation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Depreciation Results</CardTitle>
                  <CardDescription>
                    Summary of calculated depreciation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h3 className="text-lg font-bold flex items-center">
                      ${depreciatedValue.toLocaleString()}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">Depreciated Value</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Depreciation: {totalDepreciation.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Replacement Cost New</span>
                        <span className="font-medium">${replacementCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Less Physical Depreciation</span>
                        <span className="font-medium text-red-600">-${((replacementCost * physicalDepreciation) / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Less Functional Obsolescence</span>
                        <span className="font-medium text-red-600">-${((replacementCost * functionalObsolescence) / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Less External Obsolescence</span>
                        <span className="font-medium text-red-600">-${((replacementCost * externalObsolescence) / 100).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-1 mt-1 flex justify-between text-sm font-medium">
                        <span>Depreciated Improvement Value</span>
                        <span>${depreciatedValue.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-bold">{physicalDepreciation.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Physical</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold">{functionalObsolescence}%</div>
                          <div className="text-xs text-muted-foreground">Functional</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold">{externalObsolescence}%</div>
                          <div className="text-xs text-muted-foreground">External</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Effective age ({effectiveAge} years) differs from chronological age ({chronologicalAge} years) due to condition, maintenance, and renovations.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Remaining economic life is estimated at {remainingEconomicLife} years based on {qualityClass} quality class.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Tables</CardTitle>
              <CardDescription>
                Standard depreciation tables by quality class and age
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Effective Age (Years)</th>
                      <th className="h-10 px-4 text-right font-medium">Excellent Quality</th>
                      <th className="h-10 px-4 text-right font-medium">Good Quality</th>
                      <th className="h-10 px-4 text-right font-medium">Average Quality</th>
                      <th className="h-10 px-4 text-right font-medium">Fair Quality</th>
                      <th className="h-10 px-4 text-right font-medium">Poor Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70].map((age) => (
                      <tr key={age} className="border-b">
                        <td className="p-4 align-middle font-medium">{age}</td>
                        <td className="p-4 align-middle text-right">
                          {(age / qualityClassMap.excellent.economicLife * 100).toFixed(1)}%
                        </td>
                        <td className="p-4 align-middle text-right">
                          {(age / qualityClassMap.good.economicLife * 100).toFixed(1)}%
                        </td>
                        <td className="p-4 align-middle text-right">
                          {(age / qualityClassMap.average.economicLife * 100).toFixed(1)}%
                        </td>
                        <td className="p-4 align-middle text-right">
                          {(age / qualityClassMap.fair.economicLife * 100).toFixed(1)}%
                        </td>
                        <td className="p-4 align-middle text-right">
                          {(age / qualityClassMap.poor.economicLife * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Economic Life by Quality Class</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center">
                        <span>Excellent Quality</span>
                        <Badge variant="outline">{qualityClassMap.excellent.economicLife} years</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Good Quality</span>
                        <Badge variant="outline">{qualityClassMap.good.economicLife} years</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Average Quality</span>
                        <Badge variant="outline">{qualityClassMap.average.economicLife} years</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Fair Quality</span>
                        <Badge variant="outline">{qualityClassMap.fair.economicLife} years</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Poor Quality</span>
                        <Badge variant="outline">{qualityClassMap.poor.economicLife} years</Badge>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Effective Age Adjustments</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      Maintenance and renovation adjustments to chronological age
                    </p>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center">
                        <span>Excellent Maintenance</span>
                        <Badge>-20%</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Good Maintenance</span>
                        <Badge>-10%</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Average Maintenance</span>
                        <Badge variant="outline">No Change</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Fair Maintenance</span>
                        <Badge variant="destructive">+10%</Badge>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Poor Maintenance</span>
                        <Badge variant="destructive">+20%</Badge>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Property Comparison</CardTitle>
              <CardDescription>
                Compare depreciation across multiple properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Info className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Property Comparison Feature</h3>
                <p className="max-w-md mx-auto">
                  Select multiple properties from your inventory to compare depreciation factors and results.
                </p>
                <div className="mt-6">
                  <Button>Select Properties</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DepreciationCalculator;