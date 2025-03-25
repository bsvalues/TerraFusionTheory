import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Cpu, BarChart2, RefreshCw, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { LogLevel, LogCategory } from '@shared/schema';

interface MemoryStats {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    arrayBuffers?: number;
    formatted: {
      heapUsed: string;
      heapTotal: string;
      rss: string;
      external: string;
    }
  };
  vectorMemory: {
    count: number;
    approximate_size: string;
  } | null;
  logs: {
    totalCount: number;
    countByLevel: Record<LogLevel, number>;
    countByCategory: Record<LogCategory, number>;
    recentErrors: any[];
    performanceAverage: number | null;
  } | null;
  timestamp: string;
}

interface StandardOptimizationResult {
  status: string;
  optimizations: {
    initialMemory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    finalMemory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    improvements: {
      heapReduction: string;
      rssReduction: string;
      percentReduction: string;
    };
    vectorMemory?: any;
    logsCleaned?: {
      countBefore: number;
      deleted: number;
    };
    gcRun?: boolean | { available: boolean } | { error: string };
  };
}

interface EnhancedOptimizationResult {
  status: string;
  message: string;
  optimization: {
    initialMemory: {
      heapUsed: string;
      rss: string;
      raw: any;
    };
    finalMemory: {
      heapUsed: string;
      rss: string;
      raw: any;
    };
    improvements: {
      heapReduction: string;
      rssReduction: string;
      percentReduction: string;
      actualReduction: number;
    };
    details: any;
  };
}

// Combined type for both standard and enhanced results
type OptimizationResult = StandardOptimizationResult | EnhancedOptimizationResult;

export default function SystemMonitorPage() {
  const [activeTab, setActiveTab] = useState('memory');
  const [showAllErrors, setShowAllErrors] = useState(false);
  
  // Query to fetch memory stats
  const { data: memoryStats, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/memory/stats'],
    refetchInterval: 10000 // Refetch every 10 seconds
  });
  
  // Query to fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['/api/system/health'],
    refetchInterval: 10000 // Refetch every 10 seconds
  });
  
  // Mutation to trigger memory optimization
  const optimizeMutation = useMutation({
    mutationFn: () => apiRequest<OptimizationResult>('/api/memory/optimize', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memory/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system/health'] });
    }
  });
  
  // Mutation to trigger enhanced memory optimization
  const enhancedOptimizeMutation = useMutation({
    mutationFn: () => apiRequest<OptimizationResult>('/api/system/enhanced-cleanup-memory', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memory/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system/health'] });
    }
  });
  
  // Calculate memory usage percentage
  const memoryPercentage = memoryStats 
    ? Math.round((memoryStats.memoryUsage.heapUsed / memoryStats.memoryUsage.heapTotal) * 100) 
    : 0;
  
  // Function to determine memory status color
  const getMemoryStatusColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Get badge variant based on log level
  const getLogLevelVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'info': return 'secondary';
      case 'debug': return 'outline';
      default: return 'secondary';
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Monitor</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => optimizeMutation.mutate()}
            disabled={optimizeMutation.isPending}
          >
            {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Memory'}
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch system statistics. Please try again later.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Heap Memory Usage</CardTitle>
            <CardDescription>
              Current used heap memory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-y-1">
              <span className="text-2xl font-bold">
                {memoryStats?.memoryUsage.formatted.heapUsed || 'Loading...'}
              </span>
              <span className="text-muted-foreground">
                of {memoryStats?.memoryUsage.formatted.heapTotal || '0 MB'}
              </span>
            </div>
            <Progress 
              value={memoryPercentage} 
              className={`h-2 mt-2 ${getMemoryStatusColor(memoryPercentage)}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {memoryPercentage}% utilized
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">RSS Memory</CardTitle>
            <CardDescription>
              Total memory allocated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memoryStats?.memoryUsage.formatted.rss || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Resident Set Size includes all memory used
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vector Memory</CardTitle>
            <CardDescription>
              AI memory entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memoryStats?.vectorMemory?.count || 0} entries
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Approx. size: {memoryStats?.vectorMemory?.approximate_size || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="memory">
            <HardDrive className="h-4 w-4 mr-2" />
            Memory Details
          </TabsTrigger>
          <TabsTrigger value="logs">
            <BarChart2 className="h-4 w-4 mr-2" />
            Logs & Errors
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Cpu className="h-4 w-4 mr-2" />
            Optimization Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Details</CardTitle>
              <CardDescription>
                Last updated: {memoryStats ? formatDate(memoryStats.timestamp) : 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Memory Type</TableHead>
                    <TableHead>Raw Value</TableHead>
                    <TableHead>Formatted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoryStats && (
                    <>
                      <TableRow>
                        <TableCell>Heap Used</TableCell>
                        <TableCell>{memoryStats.memoryUsage.heapUsed}</TableCell>
                        <TableCell>{memoryStats.memoryUsage.formatted.heapUsed}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Heap Total</TableCell>
                        <TableCell>{memoryStats.memoryUsage.heapTotal}</TableCell>
                        <TableCell>{memoryStats.memoryUsage.formatted.heapTotal}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>RSS</TableCell>
                        <TableCell>{memoryStats.memoryUsage.rss}</TableCell>
                        <TableCell>{memoryStats.memoryUsage.formatted.rss}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>External</TableCell>
                        <TableCell>{memoryStats.memoryUsage.external}</TableCell>
                        <TableCell>{memoryStats.memoryUsage.formatted.external}</TableCell>
                      </TableRow>
                      {memoryStats.memoryUsage.arrayBuffers !== undefined && (
                        <TableRow>
                          <TableCell>Array Buffers</TableCell>
                          <TableCell>{memoryStats.memoryUsage.arrayBuffers}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {memoryStats?.vectorMemory && (
            <Card>
              <CardHeader>
                <CardTitle>Vector Memory</CardTitle>
                <CardDescription>
                  Used for AI agent knowledge and context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Total Entries</h3>
                    <p className="text-2xl font-bold">{memoryStats.vectorMemory.count}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Approximate Size</h3>
                    <p className="text-2xl font-bold">{memoryStats.vectorMemory.approximate_size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs Summary</CardTitle>
              <CardDescription>
                Total log entries: {memoryStats?.logs?.totalCount || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Logs by Level</h3>
                  {memoryStats?.logs?.countByLevel && (
                    <div className="space-y-2">
                      {Object.entries(memoryStats.logs.countByLevel).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Badge variant={getLogLevelVariant(level.toLowerCase())}>
                              {level}
                            </Badge>
                          </div>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Logs by Category</h3>
                  {memoryStats?.logs?.countByCategory && (
                    <div className="space-y-2">
                      {Object.entries(memoryStats.logs.countByCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <Badge variant="outline">{category}</Badge>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Recent Errors</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllErrors(!showAllErrors)}
                  >
                    {showAllErrors ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show All
                      </>
                    )}
                  </Button>
                </div>
                
                {memoryStats?.logs?.recentErrors && memoryStats.logs.recentErrors.length > 0 ? (
                  <div className="space-y-2">
                    {(showAllErrors 
                      ? memoryStats.logs.recentErrors 
                      : memoryStats.logs.recentErrors.slice(0, 3)
                    ).map((error: any, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTitle>{error.message}</AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          {error.details && 
                            <div className="whitespace-pre-wrap">
                              {typeof error.details === 'string' 
                                ? error.details.substring(0, 200) + (error.details.length > 200 ? '...' : '')
                                : JSON.stringify(error.details, null, 2).substring(0, 200) + '...'
                              }
                            </div>
                          }
                          <div className="mt-1 text-gray-400">
                            {error.timestamp && formatDate(error.timestamp)}
                            {error.source && ` • ${error.source}`}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent errors found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Optimization</CardTitle>
              <CardDescription>
                Run memory optimization to free up resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Button 
                    onClick={() => optimizeMutation.mutate()} 
                    disabled={optimizeMutation.isPending || enhancedOptimizeMutation.isPending}
                    className="w-full"
                  >
                    {optimizeMutation.isPending ? 'Optimizing...' : 'Standard Optimization'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </Button>
                </div>
                
                <div className="mb-4">
                  <Button 
                    onClick={() => enhancedOptimizeMutation.mutate()} 
                    disabled={optimizeMutation.isPending || enhancedOptimizeMutation.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {enhancedOptimizeMutation.isPending ? 'Performing Deep Cleanup...' : 'Enhanced Memory Cleanup (includes database)'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Use when memory usage is critically high (&gt;95%). Cleans up database logs and vector memory.
                  </p>
                </div>
                
                {(optimizeMutation.data || enhancedOptimizeMutation.data) && (
                  <div className="mt-4 border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Last Optimization Results</h3>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-muted-foreground">
                        {enhancedOptimizeMutation.data ? 'Enhanced optimization' : 'Standard optimization'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Memory Reduction</p>
                        <p className="text-xl font-bold">
                          {enhancedOptimizeMutation.data 
                            ? enhancedOptimizeMutation.data.optimization.improvements.heapReduction
                            : optimizeMutation.data?.optimizations.improvements.heapReduction}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {enhancedOptimizeMutation.data 
                            ? enhancedOptimizeMutation.data.optimization.improvements.percentReduction
                            : optimizeMutation.data?.optimizations.improvements.percentReduction} reduction
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Logs Cleaned</p>
                        <p className="text-xl font-bold">
                          {enhancedOptimizeMutation.data 
                            ? enhancedOptimizeMutation.data.optimization.logsCleaned?.deleted || 0
                            : optimizeMutation.data?.optimizations.logsCleaned?.deleted || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          out of {enhancedOptimizeMutation.data 
                            ? enhancedOptimizeMutation.data.optimization.logsCleaned?.countBefore || 0
                            : optimizeMutation.data?.optimizations.logsCleaned?.countBefore || 0} old logs
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Vector Memory</p>
                        <p className="text-sm">
                          {enhancedOptimizeMutation.data 
                            ? (enhancedOptimizeMutation.data.optimization.vectorMemory 
                                ? (typeof enhancedOptimizeMutation.data.optimization.vectorMemory === 'object' 
                                    ? 'Optimized' 
                                    : 'Not optimized')
                                : 'No action taken')
                            : (optimizeMutation.data?.optimizations.vectorMemory 
                                ? (typeof optimizeMutation.data.optimizations.vectorMemory === 'object'
                                    ? 'Optimized'
                                    : 'Not optimized')
                                : 'No action taken')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium">Memory Before/After</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Before: </span>
                          {enhancedOptimizeMutation.data 
                            ? Math.round(enhancedOptimizeMutation.data.optimization.initialMemory.heapUsed / 1024 / 1024)
                            : Math.round(optimizeMutation.data?.optimizations.initialMemory.heapUsed / 1024 / 1024)} MB
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">After: </span>
                          {enhancedOptimizeMutation.data 
                            ? Math.round(enhancedOptimizeMutation.data.optimization.finalMemory.heapUsed / 1024 / 1024)
                            : Math.round(optimizeMutation.data?.optimizations.finalMemory.heapUsed / 1024 / 1024)} MB
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
              <CardDescription>
                Automatic optimization tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Memory Optimization</TableCell>
                    <TableCell>Every 5 minutes</TableCell>
                    <TableCell>Auto</TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Log Cleanup</TableCell>
                    <TableCell>Daily</TableCell>
                    <TableCell>Auto</TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Vector Memory Optimization</TableCell>
                    <TableCell>Every 30 minutes</TableCell>
                    <TableCell>Auto</TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}