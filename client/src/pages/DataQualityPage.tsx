import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart4,
  FileSpreadsheet,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Data Quality Report interface
interface DataQualityReport {
  overallScore: number;
  propertiesScore: number;
  neighborhoodsScore: number;
  salesScore: number;
  timestamp: string;
  totals: {
    properties: number;
    neighborhoods: number;
    sales: number;
  };
  issues: {
    critical: number;
    major: number;
    minor: number;
  };
  propertyIssues: Array<{
    id: string;
    field: string;
    issue: string;
    severity: 'critical' | 'major' | 'minor';
    suggestedFix?: string;
  }>;
  neighborhoodIssues: Array<{
    id: string;
    field: string;
    issue: string;
    severity: 'critical' | 'major' | 'minor';
    suggestedFix?: string;
  }>;
  salesIssues: Array<{
    id: string;
    field: string;
    issue: string;
    severity: 'critical' | 'major' | 'minor';
    suggestedFix?: string;
  }>;
  validationRules: {
    passed: number;
    failed: number;
    total: number;
  };
  completenessMetrics: {
    properties: {
      complete: number;
      partial: number;
      minimal: number;
      total: number;
    };
    neighborhoods: {
      complete: number;
      partial: number;
      minimal: number;
      total: number;
    };
    sales: {
      complete: number;
      partial: number;
      minimal: number;
      total: number;
    };
  };
}

const DataQualityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  // Fetch data quality report
  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/data-quality/report'],
    queryFn: async () => {
      const response = await apiRequest('/api/data-quality/report', { method: 'GET' });
      return response as DataQualityReport;
    },
  });

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing data quality report',
      description: 'The latest data quality metrics are being calculated.',
    });
  };

  // Handle download report
  const handleDownload = () => {
    // Create CSV content
    if (!report) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data Quality Report - " + new Date(report.timestamp).toLocaleString() + "\n\n";
    
    // Overall metrics
    csvContent += "Overall Quality Score," + report.overallScore + "%\n";
    csvContent += "Properties Score," + report.propertiesScore + "%\n";
    csvContent += "Neighborhoods Score," + report.neighborhoodsScore + "%\n";
    csvContent += "Sales Score," + report.salesScore + "%\n\n";
    
    // Totals
    csvContent += "Total Properties," + report.totals.properties + "\n";
    csvContent += "Total Neighborhoods," + report.totals.neighborhoods + "\n";
    csvContent += "Total Sales," + report.totals.sales + "\n\n";
    
    // Issues
    csvContent += "Critical Issues," + report.issues.critical + "\n";
    csvContent += "Major Issues," + report.issues.major + "\n";
    csvContent += "Minor Issues," + report.issues.minor + "\n\n";
    
    // Property Issues
    csvContent += "Property Issues\n";
    csvContent += "ID,Field,Issue,Severity,Suggested Fix\n";
    report.propertyIssues.forEach(issue => {
      csvContent += `${issue.id},${issue.field},"${issue.issue}",${issue.severity},"${issue.suggestedFix || ''}"\n`;
    });
    csvContent += "\n";
    
    // Neighborhood Issues
    csvContent += "Neighborhood Issues\n";
    csvContent += "ID,Field,Issue,Severity,Suggested Fix\n";
    report.neighborhoodIssues.forEach(issue => {
      csvContent += `${issue.id},${issue.field},"${issue.issue}",${issue.severity},"${issue.suggestedFix || ''}"\n`;
    });
    csvContent += "\n";
    
    // Sales Issues
    csvContent += "Sales Issues\n";
    csvContent += "ID,Field,Issue,Severity,Suggested Fix\n";
    report.salesIssues.forEach(issue => {
      csvContent += `${issue.id},${issue.field},"${issue.issue}",${issue.severity},"${issue.suggestedFix || ''}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_quality_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download complete',
      description: 'Data quality report has been downloaded as CSV.',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Data Quality Assessment</h1>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw className="animate-spin h-8 w-8 mb-2" />
            <p>Loading data quality report...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !report) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Data Quality Assessment</h1>
        <Card className="mb-6">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2" /> 
              Error Loading Data Quality Report
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>There was a problem loading the data quality report. This could be due to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>The data quality service is not available</li>
              <li>There is no data in the database to analyze</li>
              <li>A temporary network error occurred</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleRefresh} className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render with data
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Data Quality Assessment</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mb-6">
        Last updated: {new Date(report.timestamp).toLocaleString()}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{report.overallScore}%</div>
            <Progress value={report.overallScore} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{report.propertiesScore}%</div>
            <Progress value={report.propertiesScore} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {report.totals.properties} records
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Neighborhoods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{report.neighborhoodsScore}%</div>
            <Progress value={report.neighborhoodsScore} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {report.totals.neighborhoods} records
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{report.salesScore}%</div>
            <Progress value={report.salesScore} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {report.totals.sales} records
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Data Issues Summary</CardTitle>
          <CardDescription>
            Overview of identified data quality issues by severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-destructive/20 p-2">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Critical Issues</div>
                <div className="text-2xl font-bold">{report.issues.critical}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-amber-500/20 p-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Major Issues</div>
                <div className="text-2xl font-bold">{report.issues.major}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-blue-500/20 p-2">
                <AlertCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Minor Issues</div>
                <div className="text-2xl font-bold">{report.issues.minor}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Validation Rules Status</div>
            <div className="flex items-center">
              <Progress 
                value={(report.validationRules.passed / report.validationRules.total) * 100} 
                className="h-2 flex-1 mr-4" 
              />
              <div className="text-sm">
                <span className="font-medium">{report.validationRules.passed}</span> 
                <span className="text-muted-foreground"> of </span>
                <span className="font-medium">{report.validationRules.total}</span>
                <span className="text-muted-foreground"> rules passed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="neighborhoods">Neighborhoods</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Data Completeness Overview</CardTitle>
              <CardDescription>
                Assessment of field completeness across all data categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Property Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Complete Records</span>
                          <span className="font-medium">{report.completenessMetrics.properties.complete}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.properties.complete / report.completenessMetrics.properties.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Partial Records</span>
                          <span className="font-medium">{report.completenessMetrics.properties.partial}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.properties.partial / report.completenessMetrics.properties.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Minimal Records</span>
                          <span className="font-medium">{report.completenessMetrics.properties.minimal}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.properties.minimal / report.completenessMetrics.properties.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Neighborhood Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Complete Records</span>
                          <span className="font-medium">{report.completenessMetrics.neighborhoods.complete}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.neighborhoods.complete / report.completenessMetrics.neighborhoods.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Partial Records</span>
                          <span className="font-medium">{report.completenessMetrics.neighborhoods.partial}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.neighborhoods.partial / report.completenessMetrics.neighborhoods.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Minimal Records</span>
                          <span className="font-medium">{report.completenessMetrics.neighborhoods.minimal}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.neighborhoods.minimal / report.completenessMetrics.neighborhoods.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sales Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Complete Records</span>
                          <span className="font-medium">{report.completenessMetrics.sales.complete}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.sales.complete / report.completenessMetrics.sales.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Partial Records</span>
                          <span className="font-medium">{report.completenessMetrics.sales.partial}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.sales.partial / report.completenessMetrics.sales.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Minimal Records</span>
                          <span className="font-medium">{report.completenessMetrics.sales.minimal}</span>
                        </div>
                        <Progress 
                          value={(report.completenessMetrics.sales.minimal / report.completenessMetrics.sales.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Property Data Issues</CardTitle>
              <CardDescription>
                Detailed listing of identified issues with property data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property ID</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Suggested Fix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.propertyIssues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="py-6 flex flex-col items-center">
                          <CheckCircle className="text-green-500 h-8 w-8 mb-2" />
                          <span>No issues found with property data!</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.propertyIssues.map((issue, i) => (
                      <TableRow key={`property-issue-${i}`}>
                        <TableCell className="font-mono">{issue.id}</TableCell>
                        <TableCell>{issue.field}</TableCell>
                        <TableCell>{issue.issue}</TableCell>
                        <TableCell>
                          <Badge variant={
                            issue.severity === 'critical' ? 'destructive' : 
                            issue.severity === 'major' ? 'warning' : 'default'
                          }>
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{issue.suggestedFix || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="neighborhoods">
          <Card>
            <CardHeader>
              <CardTitle>Neighborhood Data Issues</CardTitle>
              <CardDescription>
                Detailed listing of identified issues with neighborhood data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Neighborhood ID</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Suggested Fix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.neighborhoodIssues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="py-6 flex flex-col items-center">
                          <CheckCircle className="text-green-500 h-8 w-8 mb-2" />
                          <span>No issues found with neighborhood data!</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.neighborhoodIssues.map((issue, i) => (
                      <TableRow key={`neighborhood-issue-${i}`}>
                        <TableCell className="font-mono">{issue.id}</TableCell>
                        <TableCell>{issue.field}</TableCell>
                        <TableCell>{issue.issue}</TableCell>
                        <TableCell>
                          <Badge variant={
                            issue.severity === 'critical' ? 'destructive' : 
                            issue.severity === 'major' ? 'warning' : 'default'
                          }>
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{issue.suggestedFix || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Data Issues</CardTitle>
              <CardDescription>
                Detailed listing of identified issues with sales transaction data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Suggested Fix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.salesIssues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="py-6 flex flex-col items-center">
                          <CheckCircle className="text-green-500 h-8 w-8 mb-2" />
                          <span>No issues found with sales data!</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.salesIssues.map((issue, i) => (
                      <TableRow key={`sales-issue-${i}`}>
                        <TableCell className="font-mono">{issue.id}</TableCell>
                        <TableCell>{issue.field}</TableCell>
                        <TableCell>{issue.issue}</TableCell>
                        <TableCell>
                          <Badge variant={
                            issue.severity === 'critical' ? 'destructive' : 
                            issue.severity === 'major' ? 'warning' : 'default'
                          }>
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{issue.suggestedFix || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataQualityPage;