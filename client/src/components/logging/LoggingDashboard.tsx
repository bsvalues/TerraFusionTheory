import { useState } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { LogLevel, LogCategory, LogEntry } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangleIcon, 
  BarChartIcon, 
  InfoIcon, 
  XCircleIcon, 
  Database, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  XIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  UserCircle,
  Code,
  Shield,
  Activity,
  Cpu,
  Trash2,
  RefreshCw
} from 'lucide-react';

function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function levelIcon(level: string) {
  switch (level) {
    case LogLevel.DEBUG:
      return <Code size={16} />;
    case LogLevel.INFO:
      return <InfoIcon size={16} />;
    case LogLevel.WARNING:
      return <AlertTriangleIcon size={16} />;
    case LogLevel.ERROR:
      return <XCircleIcon size={16} />;
    case LogLevel.CRITICAL:
      return <AlertCircle size={16} />;
    default:
      return <InfoIcon size={16} />;
  }
}

function categoryIcon(category: string) {
  switch (category) {
    case LogCategory.SYSTEM:
      return <Cpu size={16} />;
    case LogCategory.USER:
      return <UserCircle size={16} />;
    case LogCategory.API:
      return <Code size={16} />;
    case LogCategory.DATABASE:
      return <Database size={16} />;
    case LogCategory.SECURITY:
      return <Shield size={16} />;
    case LogCategory.PERFORMANCE:
      return <Activity size={16} />;
    case LogCategory.AI:
      return <Cpu size={16} />;
    default:
      return <InfoIcon size={16} />;
  }
}

type LogItemProps = {
  log: LogEntry;
  onDelete: (id: number) => void;
}

const LogItem = ({ log, onDelete }: LogItemProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  
  const showDetails = expanded && log.details;
  
  return (
    <div className="p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className="mt-1">
            <span style={{ color: log.color }}>
              {levelIcon(log.level)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{log.message}</span>
              <Badge variant={log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL ? 'destructive' : 
                            log.level === LogLevel.WARNING ? 'warning' : 
                            log.level === LogLevel.DEBUG ? 'secondary' : 'default'}>
                {log.level}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {categoryIcon(log.category)}
                {log.category}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTimestamp(log.timestamp)}
              </span>
              {log.source && (
                <span className="text-xs text-gray-500">{log.source}</span>
              )}
              {log.duration !== undefined && (
                <span className="text-xs text-gray-500">{log.duration}ms</span>
              )}
              {log.endpoint && (
                <span className="text-xs text-gray-500">{log.endpoint}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {log.details && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="h-6 text-xs"
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(log.id)}
            className="h-6 text-xs text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-2 ml-6 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap text-gray-800 max-h-40 overflow-y-auto">
          {typeof log.details === 'string' ? 
            JSON.stringify(JSON.parse(log.details), null, 2) : 
            JSON.stringify(log.details, null, 2)
          }
        </div>
      )}
    </div>
  );
};

export function LoggingDashboard() {
  const [activeTab, setActiveTab] = useState<string>('logs');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);
  
  const { 
    logs, 
    stats, 
    isLoading, 
    error, 
    updateFilters, 
    clearFilters,
    deleteLog,
    clearLogs
  } = useLogs({ limit });
  
  const handleSearch = () => {
    const filters: any = { limit };
    if (searchTerm) filters.search = searchTerm;
    if (selectedLevel) filters.level = selectedLevel;
    if (selectedCategory) filters.category = selectedCategory;
    updateFilters(filters);
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('');
    setSelectedCategory('');
    clearFilters();
    updateFilters({ limit });
  };
  
  const handleDeleteLog = (id: number) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      deleteLog(id);
    }
  };
  
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      clearLogs();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Advanced Logging Dashboard</CardTitle>
            <CardDescription>Monitor and analyze system logs and events</CardDescription>
          </div>
          <Button variant="destructive" size="sm" onClick={handleClearLogs} className="flex items-center gap-1">
            <Trash2 size={14} />
            Clear Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="logs">Log Explorer</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Log level" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value={LogLevel.DEBUG}>{LogLevel.DEBUG}</SelectItem>
                  <SelectItem value={LogLevel.INFO}>{LogLevel.INFO}</SelectItem>
                  <SelectItem value={LogLevel.WARNING}>{LogLevel.WARNING}</SelectItem>
                  <SelectItem value={LogLevel.ERROR}>{LogLevel.ERROR}</SelectItem>
                  <SelectItem value={LogLevel.CRITICAL}>{LogLevel.CRITICAL}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value={LogCategory.SYSTEM}>{LogCategory.SYSTEM}</SelectItem>
                  <SelectItem value={LogCategory.USER}>{LogCategory.USER}</SelectItem>
                  <SelectItem value={LogCategory.API}>{LogCategory.API}</SelectItem>
                  <SelectItem value={LogCategory.DATABASE}>{LogCategory.DATABASE}</SelectItem>
                  <SelectItem value={LogCategory.SECURITY}>{LogCategory.SECURITY}</SelectItem>
                  <SelectItem value={LogCategory.PERFORMANCE}>{LogCategory.PERFORMANCE}</SelectItem>
                  <SelectItem value={LogCategory.AI}>{LogCategory.AI}</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="secondary" onClick={handleSearch}>
                Apply Filters
              </Button>
              
              <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-1">
                <XIcon className="h-4 w-4" />
                Clear
              </Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading logs...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  Error loading logs: {String(error)}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No logs found. Try changing your filters.
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  {logs.map((log) => (
                    <LogItem key={log.id} log={log} onDelete={handleDeleteLog} />
                  ))}
                </ScrollArea>
              )}
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Showing {logs.length} logs</span>
              <div>
                <Select value={limit.toString()} onValueChange={(val) => {
                  const newLimit = parseInt(val);
                  setLimit(newLimit);
                  updateFilters({ limit: newLimit });
                }}>
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 logs</SelectItem>
                    <SelectItem value="25">25 logs</SelectItem>
                    <SelectItem value="50">50 logs</SelectItem>
                    <SelectItem value="100">100 logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            {!stats ? (
              <div className="p-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading analytics...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="text-2xl font-bold">{stats.totalCount}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">Error Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="text-2xl font-bold text-destructive">
                        {stats.countByLevel[LogLevel.ERROR] + stats.countByLevel[LogLevel.CRITICAL]}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">Warning Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="text-2xl font-bold text-amber-500">
                        {stats.countByLevel[LogLevel.WARNING]}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="text-2xl font-bold">
                        {stats.performanceAverage ? `${stats.performanceAverage.toFixed(2)}ms` : 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logs by Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.countByLevel).map(([level, count]) => (
                          <div key={level} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span style={{ 
                                color: level === LogLevel.ERROR || level === LogLevel.CRITICAL ? '#dc3545' :
                                       level === LogLevel.WARNING ? '#ffc107' :
                                       level === LogLevel.INFO ? '#0d6efd' : '#6c757d'
                              }}>
                                {levelIcon(level as LogLevel)}
                              </span>
                              <span>{level}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-40 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full" 
                                  style={{ 
                                    width: `${stats.totalCount ? (count / stats.totalCount) * 100 : 0}%`,
                                    backgroundColor: level === LogLevel.ERROR || level === LogLevel.CRITICAL ? '#dc3545' :
                                                    level === LogLevel.WARNING ? '#ffc107' :
                                                    level === LogLevel.INFO ? '#0d6efd' : '#6c757d'
                                  }} 
                                />
                              </div>
                              <span className="text-sm">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Logs by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.countByCategory).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {categoryIcon(category as LogCategory)}
                              <span>{category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-40 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full bg-blue-600" 
                                  style={{ 
                                    width: `${stats.totalCount ? (count / stats.totalCount) * 100 : 0}%`
                                  }} 
                                />
                              </div>
                              <span className="text-sm">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentErrors.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        No errors recorded yet. That's good news!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentErrors.map((error) => (
                          <div key={error.id} className="border p-3 rounded-md">
                            <div className="flex items-start gap-2">
                              <XCircleIcon className="h-5 w-5 text-destructive mt-0.5" />
                              <div>
                                <div className="font-medium">{error.message}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(error.timestamp)} • {error.source || 'Unknown source'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="text-xs text-muted-foreground">
          Logging system v1.0.0 • Data refreshes automatically
        </div>
      </CardFooter>
    </Card>
  );
}