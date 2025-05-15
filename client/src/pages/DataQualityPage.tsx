import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataCategory, SeverityLevel } from '@shared/validation/data-quality-framework';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, CheckCircle, RefreshCw, FileSearch, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Type definitions
interface QualityScore {
  category: string;
  score: number;
  issueCount: number;
  criticalCount: number;
  lastUpdated: number;
}

interface DataQualityIssue {
  id: string;
  category: string;
  field: string;
  ruleType: string;
  severity: string;
  message: string;
  recordId?: number | string;
  value?: any;
  expectedValue?: any;
  timestamp: number;
  remediation?: string;
}

interface DataQualityReport {
  timestamp: number;
  scores: {
    overall: number;
    byCategory: QualityScore[];
  };
  issues: DataQualityIssue[];
  stats: {
    recordsProcessed: number;
    issuesBySeverity: Record<string, number>;
    issuesByCategory: Record<string, number>;
    issuesByRule: Record<string, number>;
  };
}

const DataQualityPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  // Fetch quality report
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    isError: reportError,
    refetch: refetchReport
  } = useQuery({ 
    queryKey: ['/api/data-quality/report'], 
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch quality issues with filters
  const {
    data: issuesData,
    isLoading: issuesLoading,
    refetch: refetchIssues
  } = useQuery({
    queryKey: ['/api/data-quality/issues', categoryFilter, severityFilter],
    queryFn: async () => {
      let url = '/api/data-quality/issues';
      const params = new URLSearchParams();
      
      if (categoryFilter) params.append('category', categoryFilter);
      if (severityFilter) params.append('severity', severityFilter);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch quality issues');
      return response.json();
    },
    enabled: activeTab === 'issues',
    staleTime: 5 * 60 * 1000
  });

  // Get severity badge style
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case SeverityLevel.CRITICAL:
        return <Badge variant="destructive">Critical</Badge>;
      case SeverityLevel.ERROR:
        return <Badge variant="destructive" className="bg-red-500">Error</Badge>;
      case SeverityLevel.WARNING:
        return <Badge variant="default" className="bg-amber-500">Warning</Badge>;
      case SeverityLevel.INFO:
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case DataCategory.PROPERTY:
        return 'Property';
      case DataCategory.SALE:
        return 'Sale';
      case DataCategory.NEIGHBORHOOD:
        return 'Neighborhood';
      case DataCategory.MARKET:
        return 'Market';
      default:
        return category;
    }
  };

  // Regenerate quality report
  const handleRegenerateReport = async () => {
    try {
      const response = await fetch('/api/data-quality/regenerate', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to regenerate report');
      
      toast({
        title: 'Report regenerated',
        description: 'Data quality report has been successfully regenerated',
      });
      
      // Refetch data
      refetchReport();
      refetchIssues();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to regenerate report',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  // Get quality score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-lime-500';
    if (score >= 50) return 'bg-amber-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium">Loading quality report...</h3>
          <p className="text-sm text-muted-foreground">Please wait while we gather your data quality metrics</p>
        </div>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load data quality report. Please try again later.</AlertDescription>
        </Alert>
        <Button onClick={() => refetchReport()}>Retry</Button>
      </div>
    );
  }

  const report: DataQualityReport = reportData?.report;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Quality Assessment</h1>
          <p className="text-muted-foreground">
            Monitor and improve the quality of your property data based on IAAO standards
          </p>
        </div>
        <Button onClick={handleRegenerateReport} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Regenerate Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <BarChart2 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="issues">
            <AlertCircle className="h-4 w-4 mr-2" />
            Quality Issues
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileSearch className="h-4 w-4 mr-2" />
            Record Validation
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          {report && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{report.scores.overall.toFixed(1)}/100</div>
                    <Progress value={report.scores.overall} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {report.stats.recordsProcessed} records
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{report.issues.length}</div>
                    <div className="mt-2 text-sm">
                      <span className="text-red-500 font-medium mr-2">
                        Critical: {report.stats.issuesBySeverity[SeverityLevel.CRITICAL] || 0}
                      </span>
                      <span className="text-amber-500 font-medium">
                        Warnings: {report.stats.issuesBySeverity[SeverityLevel.WARNING] || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Date(report.timestamp).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Generate a new report to refresh data
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Data Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.scores.byCategory.length}</div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                      {report.scores.byCategory.map((category) => (
                        <div key={category.category} className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1 ${getScoreColor(category.score)}`} />
                          <span>{getCategoryName(category.category)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality by Category</CardTitle>
                    <CardDescription>
                      Scores for different data types based on IAAO standards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {report.scores.byCategory.map((category) => (
                        <div key={category.category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{getCategoryName(category.category)}</span>
                            <span className="text-sm font-medium">{category.score.toFixed(1)}/100</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={category.score} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-24">
                              {category.issueCount} issues
                              {category.criticalCount > 0 && ` (${category.criticalCount} critical)`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Issues by Severity</CardTitle>
                    <CardDescription>
                      Distribution of quality issues by severity level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(report.stats.issuesBySeverity).map(([severity, count]) => (
                        <div key={severity}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              {getSeverityBadge(severity)}
                            </div>
                            <span className="text-sm font-medium">{count} issues</span>
                          </div>
                          <Progress 
                            value={(count / report.issues.length) * 100} 
                            className={`h-2 ${severity === SeverityLevel.CRITICAL ? 'bg-red-100' : 
                              severity === SeverityLevel.ERROR ? 'bg-orange-100' : 
                              severity === SeverityLevel.WARNING ? 'bg-amber-100' : 'bg-gray-100'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full max-w-xs">
              <Select
                value={categoryFilter || ''}
                onValueChange={(value) => setCategoryFilter(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value={DataCategory.PROPERTY}>Property</SelectItem>
                  <SelectItem value={DataCategory.SALE}>Sale</SelectItem>
                  <SelectItem value={DataCategory.NEIGHBORHOOD}>Neighborhood</SelectItem>
                  <SelectItem value={DataCategory.MARKET}>Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full max-w-xs">
              <Select
                value={severityFilter || ''}
                onValueChange={(value) => setSeverityFilter(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value={SeverityLevel.CRITICAL}>Critical</SelectItem>
                  <SelectItem value={SeverityLevel.ERROR}>Error</SelectItem>
                  <SelectItem value={SeverityLevel.WARNING}>Warning</SelectItem>
                  <SelectItem value={SeverityLevel.INFO}>Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => {
              setCategoryFilter(null);
              setSeverityFilter(null);
            }}>
              Clear Filters
            </Button>
          </div>

          {issuesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableCaption>
                {issuesData?.issues.length === 0 
                  ? 'No quality issues found with the current filters' 
                  : `Showing ${issuesData?.issues.length} quality issues`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Suggestion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issuesData?.issues.map((issue: DataQualityIssue) => (
                  <TableRow key={issue.id}>
                    <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                    <TableCell>{getCategoryName(issue.category)}</TableCell>
                    <TableCell>{issue.field}</TableCell>
                    <TableCell>{issue.message}</TableCell>
                    <TableCell>{issue.recordId || 'N/A'}</TableCell>
                    <TableCell>{issue.remediation || 'No suggestion'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Record Validation Tab */}
        <TabsContent value="records" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Validate Property</CardTitle>
                <CardDescription>
                  Check a specific property for quality issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="propertyId" className="text-sm font-medium">
                        Property ID
                      </label>
                      <input 
                        id="propertyId"
                        type="text" 
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter property ID" 
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">Validate</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validate Sale</CardTitle>
                <CardDescription>
                  Check a specific sales transaction for quality issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="saleId" className="text-sm font-medium">
                        Sale ID
                      </label>
                      <input 
                        id="saleId"
                        type="text" 
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter sale ID" 
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">Validate</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataQualityPage;