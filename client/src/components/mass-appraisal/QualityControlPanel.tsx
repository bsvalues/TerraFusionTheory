import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart, FileText, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

// Import an area chart component if you have one
import { AreaChart } from '@/components/ui/area-chart';

const QualityControlPanel: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('outliers');
  const [neighborhood, setNeighborhood] = useState('all');

  // Dummy data for demonstration
  const outlierIssues = [
    { id: 1, address: '2204 Hill Dr, Grandview', issue: 'High Sale Price', value: '$345,000', average: '$240,000', deviation: '+43.8%', flag: 'critical' },
    { id: 2, address: '1560 Cedar St, Grandview', issue: 'Low Sale Price', value: '$145,000', average: '$210,000', deviation: '-31.0%', flag: 'warning' },
    { id: 3, address: '443 Maple Ave, Grandview', issue: 'High Land Value', value: '$98,000', average: '$65,000', deviation: '+50.8%', flag: 'critical' },
    { id: 4, address: '876 Pine Rd, Grandview', issue: 'Low Building Value', value: '$105,000', average: '$162,000', deviation: '-35.2%', flag: 'warning' },
  ];

  const dataQualityIssues = [
    { id: 1, address: '765 Oak Ln, Grandview', issue: 'Missing Year Built', severity: 'medium', lastUpdated: '2024-10-15' },
    { id: 2, address: '432 Elm St, Grandview', issue: 'Inconsistent Property Class', severity: 'high', lastUpdated: '2024-09-22' },
    { id: 3, address: '987 Birch Rd, Grandview', issue: 'Incomplete Sales Data', severity: 'low', lastUpdated: '2024-11-05' },
    { id: 4, address: '321 Spruce Ave, Grandview', issue: 'Duplicate Record', severity: 'critical', lastUpdated: '2024-10-30' },
  ];

  const modelPerformanceData = [
    { date: '2024-09', residual: 3.2, cod: 12.5, prd: 1.03 },
    { date: '2024-10', residual: 3.5, cod: 13.2, prd: 1.04 },
    { date: '2024-11', residual: 3.1, cod: 11.8, prd: 1.02 },
    { date: '2024-12', residual: 2.9, cod: 11.2, prd: 1.01 },
    { date: '2025-01', residual: 2.7, cod: 10.8, prd: 1.02 },
    { date: '2025-02', residual: 2.8, cod: 11.0, prd: 1.03 },
    { date: '2025-03', residual: 2.6, cod: 10.5, prd: 1.01 }
  ];

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDeviationBadge = (flag: string) => {
    switch(flag) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold">Quality Control</h2>
        
        <div className="flex gap-4">
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
          
          <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value)}>
            <ToggleGroupItem value="week" aria-label="View data for past week">Week</ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="View data for past month">Month</ToggleGroupItem>
            <ToggleGroupItem value="quarter" aria-label="View data for past quarter">Quarter</ToggleGroupItem>
            <ToggleGroupItem value="year" aria-label="View data for past year">Year</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="outliers">Value Outliers</TabsTrigger>
          <TabsTrigger value="dataQuality">Data Quality</TabsTrigger>
          <TabsTrigger value="modelPerformance">Model Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="outliers">
          <Card>
            <CardHeader>
              <CardTitle>Value Outliers</CardTitle>
              <CardDescription>
                Properties with assessed values that significantly deviate from expected norms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Address</th>
                      <th className="h-10 px-4 text-left font-medium">Issue Type</th>
                      <th className="h-10 px-4 text-left font-medium">Value</th>
                      <th className="h-10 px-4 text-left font-medium">Average</th>
                      <th className="h-10 px-4 text-left font-medium">Deviation</th>
                      <th className="h-10 px-4 text-left font-medium">Severity</th>
                      <th className="h-10 px-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outlierIssues.map((issue) => (
                      <tr key={issue.id} className="border-b">
                        <td className="p-4 align-middle">{issue.address}</td>
                        <td className="p-4 align-middle">{issue.issue}</td>
                        <td className="p-4 align-middle font-medium">{issue.value}</td>
                        <td className="p-4 align-middle">{issue.average}</td>
                        <td className="p-4 align-middle font-medium">{issue.deviation}</td>
                        <td className="p-4 align-middle">{getDeviationBadge(issue.flag)}</td>
                        <td className="p-4 align-middle">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Review</Button>
                            <Button variant="ghost" size="sm">Flag</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sale Price Outliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">8 critical, 16 warnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Land Value Outliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18</div>
                    <p className="text-xs text-muted-foreground">5 critical, 13 warnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Building Value Outliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">31</div>
                    <p className="text-xs text-muted-foreground">12 critical, 19 warnings</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dataQuality">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Issues</CardTitle>
              <CardDescription>
                Missing or inconsistent data that may affect valuation accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Address</th>
                      <th className="h-10 px-4 text-left font-medium">Issue</th>
                      <th className="h-10 px-4 text-left font-medium">Severity</th>
                      <th className="h-10 px-4 text-left font-medium">Last Updated</th>
                      <th className="h-10 px-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataQualityIssues.map((issue) => (
                      <tr key={issue.id} className="border-b">
                        <td className="p-4 align-middle">{issue.address}</td>
                        <td className="p-4 align-middle">{issue.issue}</td>
                        <td className="p-4 align-middle">{getSeverityBadge(issue.severity)}</td>
                        <td className="p-4 align-middle">{issue.lastUpdated}</td>
                        <td className="p-4 align-middle">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Fix</Button>
                            <Button variant="ghost" size="sm">Ignore</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="col-span-1">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Data Completeness</CardTitle>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">92%</div>
                    <p className="text-xs text-muted-foreground">+2% from last month</p>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Data Accuracy</CardTitle>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">96%</div>
                    <p className="text-xs text-muted-foreground">+1% from last month</p>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Data Consistency</CardTitle>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">87%</div>
                    <p className="text-xs text-muted-foreground">-3% from last month</p>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Total Issues</CardTitle>
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">73</div>
                    <p className="text-xs text-muted-foreground">+12 from last month</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modelPerformance">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>
                Statistical measures of valuation model accuracy and reliability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mb-6">
                {/* Replace with your actual Chart component */}
                <AreaChart 
                  data={modelPerformanceData}
                  categories={['residual', 'cod', 'prd']}
                  index="date"
                  colors={['blue', 'green', 'purple']}
                  valueFormatter={(value) => `${value.toFixed(2)}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Mean Error</CardTitle>
                      <span className="text-xs">Standard: ±5%</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">2.6%</div>
                    <p className="text-xs text-green-600">Within IAAO standards</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">COD</CardTitle>
                      <span className="text-xs">Standard: ≤15</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">10.5</div>
                    <p className="text-xs text-green-600">Within IAAO standards</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">PRD</CardTitle>
                      <span className="text-xs">Standard: 0.98-1.03</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">1.01</div>
                    <p className="text-xs text-green-600">Within IAAO standards</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">PRB</CardTitle>
                      <span className="text-xs">Standard: ±0.05</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">-0.02</div>
                    <p className="text-xs text-green-600">Within IAAO standards</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button>
                  <BarChart className="h-4 w-4 mr-2" />
                  Advanced Statistics
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalibrate Models
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityControlPanel;