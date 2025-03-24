import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart4, 
  FileDown, 
  FileText, 
  Settings, 
  HelpCircle, 
  FileBarChart2, 
  GalleryVerticalEnd 
} from 'lucide-react';

// Import the AreaChart component
import { AreaChart } from '@/components/ui/area-chart';

const RatioStudyPanel: React.FC = () => {
  const [propertyClass, setPropertyClass] = useState('all');
  const [neighborhood, setNeighborhood] = useState('all');
  const [activeTab, setActiveTab] = useState('ratioStudy');

  // Sample data for demonstration
  const ratioStudyData = [
    { 
      id: 1, 
      priceRange: 'Under $150,000', 
      sampleSize: 32, 
      median: 0.98, 
      mean: 0.96, 
      cod: 11.2, 
      prd: 1.02, 
      prb: -0.02 
    },
    { 
      id: 2, 
      priceRange: '$150,000 - $200,000', 
      sampleSize: 48, 
      median: 1.01, 
      mean: 1.02, 
      cod: 10.4, 
      prd: 1.01, 
      prb: 0.01 
    },
    { 
      id: 3, 
      priceRange: '$200,000 - $250,000', 
      sampleSize: 56, 
      median: 0.99, 
      mean: 0.97, 
      cod: 9.8, 
      prd: 1.03, 
      prb: -0.01 
    },
    { 
      id: 4, 
      priceRange: '$250,000 - $300,000', 
      sampleSize: 42, 
      median: 0.97, 
      mean: 0.96, 
      cod: 10.5, 
      prd: 1.02, 
      prb: -0.02 
    },
    { 
      id: 5, 
      priceRange: 'Over $300,000', 
      sampleSize: 28, 
      median: 0.94, 
      mean: 0.93, 
      cod: 12.1, 
      prd: 1.04, 
      prb: -0.03 
    },
    { 
      id: 6, 
      priceRange: 'All Properties', 
      sampleSize: 206, 
      median: 0.98, 
      mean: 0.97, 
      cod: 10.8, 
      prd: 1.02, 
      prb: -0.01 
    },
  ];

  const timeSeriesData = [
    { month: '2023-10', cod: 11.8, prd: 1.03, prb: -0.02, medianRatio: 0.97 },
    { month: '2023-11', cod: 11.5, prd: 1.03, prb: -0.02, medianRatio: 0.97 },
    { month: '2023-12', cod: 11.2, prd: 1.03, prb: -0.02, medianRatio: 0.98 },
    { month: '2024-01', cod: 11.0, prd: 1.02, prb: -0.01, medianRatio: 0.98 },
    { month: '2024-02', cod: 10.8, prd: 1.02, prb: -0.01, medianRatio: 0.98 },
    { month: '2024-03', cod: 10.5, prd: 1.02, prb: -0.01, medianRatio: 0.99 },
    { month: '2024-04', cod: 10.3, prd: 1.02, prb: -0.01, medianRatio: 0.99 },
    { month: '2024-05', cod: 10.2, prd: 1.01, prb: -0.01, medianRatio: 0.99 },
    { month: '2024-06', cod: 10.0, prd: 1.01, prb: -0.00, medianRatio: 1.00 },
    { month: '2024-07', cod: 10.2, prd: 1.01, prb: -0.00, medianRatio: 0.99 },
    { month: '2024-08', cod: 10.5, prd: 1.02, prb: -0.01, medianRatio: 0.99 },
    { month: '2024-09', cod: 10.8, prd: 1.02, prb: -0.01, medianRatio: 0.98 },
  ];

  const complianceStatuses = {
    cod: {
      status: "compliant",
      standard: "≤ 15.0",
      value: 10.8, 
    },
    prd: {
      status: "compliant",
      standard: "0.98 - 1.03",
      value: 1.02
    },
    prb: {
      status: "compliant",
      standard: "± 0.05",
      value: -0.01
    },
    medianRatio: {
      status: "compliant",
      standard: "0.90 - 1.10",
      value: 0.98
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "compliant") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✓ Compliant</span>;
    } else if (status === "marginal") {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⚠️ Marginal</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">✖ Non-Compliant</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Ratio Studies</h2>
        
        <div className="flex flex-wrap gap-4">
          <div>
            <Label htmlFor="property-class" className="sr-only">Property Class</Label>
            <Select value={propertyClass} onValueChange={setPropertyClass}>
              <SelectTrigger id="property-class" className="w-[180px]">
                <SelectValue placeholder="All Property Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Property Classes</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="agricultural">Agricultural</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="neighborhood-select" className="sr-only">Neighborhood</Label>
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger id="neighborhood-select" className="w-[180px]">
                <SelectValue placeholder="All Neighborhoods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighborhoods</SelectItem>
                <SelectItem value="downtown">Downtown</SelectItem>
                <SelectItem value="westside">West Side</SelectItem>
                <SelectItem value="eastside">East Side</SelectItem>
                <SelectItem value="northend">North End</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Study Parameters
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ratioStudy">Ratio Statistics</TabsTrigger>
          <TabsTrigger value="timeSeries">Time Series Analysis</TabsTrigger>
          <TabsTrigger value="distribution">Ratio Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ratioStudy">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Ratio Study</CardTitle>
              <CardDescription>
                Statistical analysis of assessment-to-sales ratios for IAAO compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price Range</TableHead>
                      <TableHead className="text-right">Sample Size</TableHead>
                      <TableHead className="text-right">Median Ratio</TableHead>
                      <TableHead className="text-right">Mean Ratio</TableHead>
                      <TableHead className="text-right">COD</TableHead>
                      <TableHead className="text-right">PRD</TableHead>
                      <TableHead className="text-right">PRB</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratioStudyData.map((row) => (
                      <TableRow 
                        key={row.id} 
                        className={row.priceRange === 'All Properties' ? 'bg-muted/50 font-medium' : ''}
                      >
                        <TableCell>{row.priceRange}</TableCell>
                        <TableCell className="text-right">{row.sampleSize}</TableCell>
                        <TableCell className="text-right">{row.median.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.mean.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.cod.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{row.prd.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.prb.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Coefficient of Dispersion (COD)</CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{complianceStatuses.cod.value.toFixed(1)}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">IAAO Standard: {complianceStatuses.cod.standard}</span>
                      {getStatusBadge(complianceStatuses.cod.status)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Price-Related Differential (PRD)</CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{complianceStatuses.prd.value.toFixed(2)}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">IAAO Standard: {complianceStatuses.prd.standard}</span>
                      {getStatusBadge(complianceStatuses.prd.status)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Price-Related Bias (PRB)</CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{complianceStatuses.prb.value.toFixed(2)}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">IAAO Standard: {complianceStatuses.prb.standard}</span>
                      {getStatusBadge(complianceStatuses.prb.status)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Median Ratio</CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{complianceStatuses.medianRatio.value.toFixed(2)}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">IAAO Standard: {complianceStatuses.medianRatio.standard}</span>
                      {getStatusBadge(complianceStatuses.medianRatio.status)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button>
                  <FileBarChart2 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeSeries">
          <Card>
            <CardHeader>
              <CardTitle>Time Series Analysis</CardTitle>
              <CardDescription>
                Tracking ratio study statistics over time to identify trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] mb-6">
                <AreaChart 
                  data={timeSeriesData}
                  categories={['cod', 'prd', 'prb', 'medianRatio']}
                  index="month"
                  valueFormatter={(value) => `${value.toFixed(2)}`}
                />
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Observations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                        <span>Overall improving equity trend with COD decreasing from 11.8 to 10.8 over the past year</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                        <span>Consistent vertical equity with stable PRD values within IAAO standards</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                        <span>Slight improvement in median ratio, moving closer to the ideal of 1.00</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-yellow-100 text-yellow-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">!</span>
                        <span>Small seasonal fluctuations observed in summer months that may warrant investigation</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                        <span>Continue current assessment practices as all metrics are within IAAO standards</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                        <span>Consider recalibrating models for higher-value properties to improve PRB</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                        <span>Monitor seasonal fluctuations and consider time-based adjustments</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                        <span>Prepare for next reassessment cycle with updated neighborhood factors</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Ratio Distribution Analysis</CardTitle>
              <CardDescription>
                Frequency distribution of assessment-to-sales ratios to identify patterns and anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div>
                  <Label htmlFor="ratio-range" className="mb-2 block">Ratio Range Filter</Label>
                  <div className="flex items-center gap-4">
                    <Input id="min-ratio" placeholder="Min Ratio" defaultValue="0.7" className="w-32" />
                    <span>to</span>
                    <Input id="max-ratio" placeholder="Max Ratio" defaultValue="1.3" className="w-32" />
                    <Button variant="outline" size="sm">Apply</Button>
                  </div>
                </div>
                
                <div className="p-6 border rounded-md text-center text-muted-foreground">
                  <GalleryVerticalEnd size={48} className="mx-auto mb-4 text-muted-foreground/60" />
                  <p>Histogram visualization would appear here, showing the distribution of assessment ratios</p>
                  <p className="text-sm mt-2">Requires actual property data to generate</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Distribution Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-muted-foreground">Sample Size:</dt>
                      <dd className="font-medium">206</dd>
                      
                      <dt className="text-muted-foreground">Mean:</dt>
                      <dd className="font-medium">0.97</dd>
                      
                      <dt className="text-muted-foreground">Median:</dt>
                      <dd className="font-medium">0.98</dd>
                      
                      <dt className="text-muted-foreground">Standard Deviation:</dt>
                      <dd className="font-medium">0.12</dd>
                      
                      <dt className="text-muted-foreground">Minimum:</dt>
                      <dd className="font-medium">0.73</dd>
                      
                      <dt className="text-muted-foreground">Maximum:</dt>
                      <dd className="font-medium">1.24</dd>
                    </dl>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Ratio Frequency Table</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ratio Range</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Percent</TableHead>
                            <TableHead className="text-right">Cumulative</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>0.70 - 0.80</TableCell>
                            <TableCell className="text-right">12</TableCell>
                            <TableCell className="text-right">5.8%</TableCell>
                            <TableCell className="text-right">5.8%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>0.80 - 0.90</TableCell>
                            <TableCell className="text-right">29</TableCell>
                            <TableCell className="text-right">14.1%</TableCell>
                            <TableCell className="text-right">19.9%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>0.90 - 1.00</TableCell>
                            <TableCell className="text-right">87</TableCell>
                            <TableCell className="text-right">42.2%</TableCell>
                            <TableCell className="text-right">62.1%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>1.00 - 1.10</TableCell>
                            <TableCell className="text-right">52</TableCell>
                            <TableCell className="text-right">25.2%</TableCell>
                            <TableCell className="text-right">87.3%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>1.10 - 1.20</TableCell>
                            <TableCell className="text-right">18</TableCell>
                            <TableCell className="text-right">8.8%</TableCell>
                            <TableCell className="text-right">96.1%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>1.20 - 1.30</TableCell>
                            <TableCell className="text-right">8</TableCell>
                            <TableCell className="text-right">3.9%</TableCell>
                            <TableCell className="text-right">100.0%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button>
                  <BarChart4 className="h-4 w-4 mr-2" />
                  Advanced Analysis
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  IAAO Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RatioStudyPanel;