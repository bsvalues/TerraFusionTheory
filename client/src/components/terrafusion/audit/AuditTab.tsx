import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, Filter, Search, RefreshCw, AlertTriangle, CheckCircle, CalendarDays, Sliders, FileText, CircleHelp, Info } from 'lucide-react';
import RetrainStatusWidget from './RetrainStatusWidget';

// Define types for audit logs
interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: 'prediction' | 'override' | 'review' | 'retrain';
  field: string;
  originalValue: string | number;
  newValue?: string | number;
  confidence?: number;
  agentId: string;
  agentName: string;
  modelVersion: string;
  propertyId: string;
  propertyAddress: string;
  userId?: string;
  userName?: string;
  reason?: string;
}

// Define filter state
interface FilterState {
  search: string;
  eventTypes: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  fields: string[];
  confidenceRange: [number, number];
}

interface AuditTabProps {
  propertyId?: string;
  agentId?: string;
  className?: string;
}

export default function AuditTab({
  propertyId,
  agentId,
  className = ''
}: AuditTabProps) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    eventTypes: ['prediction', 'override', 'review', 'retrain'],
    dateRange: {
      from: undefined,
      to: undefined,
    },
    fields: [],
    confidenceRange: [0, 100]
  });
  
  // Stats
  const [overrideRate, setOverrideRate] = useState(0);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [totalOverrides, setTotalOverrides] = useState(0);
  
  // Metrics for charts
  const [fieldOverrideData, setFieldOverrideData] = useState<any[]>([]);
  const [confidenceDistribution, setConfidenceDistribution] = useState<any[]>([]);
  
  useEffect(() => {
    fetchAuditEvents();
  }, [propertyId, agentId]);
  
  useEffect(() => {
    if (auditEvents.length > 0) {
      applyFilters();
      calculateStats();
    }
  }, [auditEvents, filters]);
  
  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be a real API call in production
      // const response = await fetch(`/api/terrafusion/audit?${propertyId ? `propertyId=${propertyId}` : ''}${agentId ? `&agentId=${agentId}` : ''}`);
      // if (!response.ok) throw new Error('Failed to fetch audit events');
      // const data = await response.json();
      
      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API latency
      
      // Generate sample audit events
      const mockEvents: AuditEvent[] = generateMockAuditEvents(propertyId);
      
      setAuditEvents(mockEvents);
    } catch (err) {
      console.error('Error fetching audit events:', err);
      setError('Failed to load audit trail data');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...auditEvents];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.field.toLowerCase().includes(searchLower) ||
        event.propertyAddress.toLowerCase().includes(searchLower) ||
        (event.userName && event.userName.toLowerCase().includes(searchLower)) ||
        (event.reason && event.reason.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply event type filter
    if (filters.eventTypes.length > 0) {
      filtered = filtered.filter(event => filters.eventTypes.includes(event.eventType));
    }
    
    // Apply date range filter
    if (filters.dateRange.from) {
      filtered = filtered.filter(event => new Date(event.timestamp) >= filters.dateRange.from!);
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(event => new Date(event.timestamp) <= filters.dateRange.to!);
    }
    
    // Apply fields filter
    if (filters.fields.length > 0) {
      filtered = filtered.filter(event => filters.fields.includes(event.field));
    }
    
    // Apply confidence range filter
    filtered = filtered.filter(event => 
      !event.confidence || 
      (event.confidence * 100 >= filters.confidenceRange[0] && 
       event.confidence * 100 <= filters.confidenceRange[1])
    );
    
    setFilteredEvents(filtered);
  };
  
  const calculateStats = () => {
    const predictions = auditEvents.filter(event => event.eventType === 'prediction');
    const overrides = auditEvents.filter(event => event.eventType === 'override');
    
    setTotalPredictions(predictions.length);
    setTotalOverrides(overrides.length);
    
    if (predictions.length > 0) {
      setOverrideRate(Math.round((overrides.length / predictions.length) * 100));
    }
    
    // Calculate field override metrics
    const fieldCounts: Record<string, { total: number, overrides: number }> = {};
    
    auditEvents.forEach(event => {
      if (!fieldCounts[event.field]) {
        fieldCounts[event.field] = { total: 0, overrides: 0 };
      }
      
      if (event.eventType === 'prediction') {
        fieldCounts[event.field].total++;
      } else if (event.eventType === 'override') {
        fieldCounts[event.field].overrides++;
      }
    });
    
    const fieldMetrics = Object.entries(fieldCounts)
      .map(([field, counts]) => ({
        field,
        total: counts.total,
        overrides: counts.overrides,
        overrideRate: counts.total > 0 ? (counts.overrides / counts.total) * 100 : 0
      }))
      .sort((a, b) => b.overrideRate - a.overrideRate)
      .slice(0, 10); // Top 10 fields by override rate
    
    setFieldOverrideData(fieldMetrics);
    
    // Calculate confidence distribution
    const confidenceBuckets: Record<string, number> = {
      "0-10%": 0,
      "11-20%": 0,
      "21-30%": 0,
      "31-40%": 0,
      "41-50%": 0,
      "51-60%": 0,
      "61-70%": 0,
      "71-80%": 0,
      "81-90%": 0,
      "91-100%": 0
    };
    
    predictions.forEach(event => {
      if (event.confidence !== undefined) {
        const confidencePercent = event.confidence * 100;
        const bucketIndex = Math.min(Math.floor(confidencePercent / 10), 9);
        const bucketKeys = Object.keys(confidenceBuckets);
        confidenceBuckets[bucketKeys[bucketIndex]]++;
      }
    });
    
    const confidenceData = Object.entries(confidenceBuckets).map(([range, count]) => ({
      range,
      count
    }));
    
    setConfidenceDistribution(confidenceData);
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      eventTypes: ['prediction', 'override', 'review', 'retrain'],
      dateRange: {
        from: undefined,
        to: undefined,
      },
      fields: [],
      confidenceRange: [0, 100]
    });
  };
  
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const toggleEventType = (eventType: string) => {
    setFilters(prev => {
      const current = [...prev.eventTypes];
      const index = current.indexOf(eventType);
      
      if (index === -1) {
        current.push(eventType);
      } else {
        current.splice(index, 1);
      }
      
      return {
        ...prev,
        eventTypes: current
      };
    });
  };
  
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'prediction':
        return <Sliders className="h-4 w-4 text-blue-500" />;
      case 'override':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'review':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'retrain':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case 'prediction':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">AI Prediction</Badge>;
      case 'override':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">User Override</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Review</Badge>;
      case 'retrain':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Model Retrain</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const downloadAuditLog = () => {
    const header = "Timestamp,Event Type,Field,Original Value,New Value,Confidence,Agent,Model Version,Property,User,Reason\n";
    
    const csvContent = filteredEvents.reduce((acc, event) => {
      return acc + [
        event.timestamp,
        event.eventType,
        event.field,
        event.originalValue,
        event.newValue || '',
        event.confidence || '',
        event.agentName,
        event.modelVersion,
        event.propertyAddress,
        event.userName || '',
        event.reason || ''
      ].map(value => `"${value}"`).join(',') + '\n';
    }, header);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading && auditEvents.length === 0) {
    return (
      <div className={`${className} space-y-4`}>
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-primary animate-spin"></div>
            <p className="text-muted-foreground">Loading audit data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && auditEvents.length === 0) {
    return (
      <div className={`${className} space-y-4`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Error Loading Audit Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={fetchAuditEvents}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`${className} space-y-4`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPredictions.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total AI predictions made</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalOverrides.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Values corrected by users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Override Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overrideRate}%</p>
            <p className="text-sm text-muted-foreground">
              {overrideRate < 10 ? 'Excellent model performance' : 
               overrideRate < 20 ? 'Good model performance' : 
               overrideRate < 30 ? 'Average model performance' : 
               'Model needs improvement'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Field Override Rates</CardTitle>
              <CardDescription>Fields with highest user correction rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fieldOverrideData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="field" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                    />
                    <YAxis
                      label={{ value: 'Override Rate (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Override Rate']} />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="overrideRate" name="Override Rate (%)" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <RetrainStatusWidget 
            propertyId={propertyId} 
            agentId={agentId} 
            showActions={false}
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="timeline">Audit Timeline</TabsTrigger>
            <TabsTrigger value="metrics">Model Metrics</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAuditLog}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Filter Audit Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fields, properties, etc."
                      className="pl-8"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Event Types</label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="prediction" 
                        checked={filters.eventTypes.includes('prediction')} 
                        onCheckedChange={() => toggleEventType('prediction')}
                      />
                      <label htmlFor="prediction" className="text-sm">Predictions</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="override" 
                        checked={filters.eventTypes.includes('override')} 
                        onCheckedChange={() => toggleEventType('override')}
                      />
                      <label htmlFor="override" className="text-sm">Overrides</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="review" 
                        checked={filters.eventTypes.includes('review')} 
                        onCheckedChange={() => toggleEventType('review')}
                      />
                      <label htmlFor="review" className="text-sm">Reviews</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="retrain" 
                        checked={filters.eventTypes.includes('retrain')} 
                        onCheckedChange={() => toggleEventType('retrain')}
                      />
                      <label htmlFor="retrain" className="text-sm">Retrains</label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal w-full"
                          size="sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            format(filters.dateRange.from, "PPP")
                          ) : (
                            <span>From date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => handleFilterChange('dateRange', { ...filters.dateRange, from: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal w-full"
                          size="sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.to ? (
                            format(filters.dateRange.to, "PPP")
                          ) : (
                            <span>To date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => handleFilterChange('dateRange', { ...filters.dateRange, to: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Confidence Range</label>
                  <div className="px-1 py-6">
                    <Slider 
                      defaultValue={[0, 100]} 
                      max={100} 
                      step={5}
                      value={filters.confidenceRange}
                      onValueChange={(values) => handleFilterChange('confidenceRange', values)}
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{filters.confidenceRange[0]}%</span>
                      <span>{filters.confidenceRange[1]}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <TabsContent value="timeline" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>
                    Showing {filteredEvents.length} of {auditEvents.length} events
                    {propertyId ? ` for property ${propertyId}` : ''}
                  </CardDescription>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAuditEvents}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Original Value</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No audit events match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatTimestamp(event.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventTypeIcon(event.eventType)}
                            {getEventTypeBadge(event.eventType)}
                          </div>
                        </TableCell>
                        <TableCell>{event.field}</TableCell>
                        <TableCell>
                          {typeof event.originalValue === 'number' 
                            ? event.originalValue.toLocaleString() 
                            : event.originalValue}
                        </TableCell>
                        <TableCell>
                          {event.newValue !== undefined 
                            ? (typeof event.newValue === 'number' 
                              ? event.newValue.toLocaleString() 
                              : event.newValue)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {event.confidence !== undefined 
                            ? `${(event.confidence * 100).toFixed(1)}%` 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{event.agentName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{event.agentName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={event.propertyAddress}>
                          {event.propertyAddress}
                        </TableCell>
                        <TableCell>
                          {event.userName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{event.userName.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{event.userName}</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Prediction Confidence Distribution</CardTitle>
                <CardDescription>Distribution of AI prediction confidence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={confidenceDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis
                        label={{ value: 'Number of Predictions', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="# of Predictions" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>SHAP Values Visualization</CardTitle>
                <CardDescription>Feature importance for property valuations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">SHAP visualization will appear here</p>
                    <p className="text-xs text-muted-foreground">
                      Shows which property features have the most significant impact on valuations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to generate mock audit events
function generateMockAuditEvents(propertyId?: string): AuditEvent[] {
  const events: AuditEvent[] = [];
  
  // Fields that can be predicted/overridden
  const fields = [
    'valueConclusion', 
    'bedrooms', 
    'bathrooms', 
    'squareFeet', 
    'lotSize', 
    'yearBuilt', 
    'siteZoning', 
    'neighborhood', 
    'exterior.foundation', 
    'exterior.roofSurface'
  ];
  
  // Some property IDs and addresses
  const properties = [
    { id: '12345', address: '123 Main St, Grandview, WA 98930' },
    { id: '67890', address: '456 Oak Ave, Grandview, WA 98930' },
    { id: '11122', address: '789 Pine Rd, Grandview, WA 98930' },
    { id: '33344', address: '321 Cedar Ln, Grandview, WA 98930' },
    { id: '55566', address: '654 Maple Dr, Grandview, WA 98930' },
  ];
  
  // Choose a property based on given propertyId or random
  const getProperty = () => {
    if (propertyId) {
      const found = properties.find(p => p.id === propertyId);
      return found || properties[0];
    }
    return properties[Math.floor(Math.random() * properties.length)];
  };
  
  // Users who can override values
  const users = [
    { id: 'user1', name: 'Alice Johnson' },
    { id: 'user2', name: 'Bob Smith' },
    { id: 'user3', name: 'Carol Davis' }
  ];
  
  // Generate prediction events (AI model predictions)
  for (let i = 0; i < 50; i++) {
    const field = fields[Math.floor(Math.random() * fields.length)];
    const property = getProperty();
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString();
    
    let value: string | number;
    if (field === 'valueConclusion') {
      value = 250000 + Math.floor(Math.random() * 500000);
    } else if (field === 'bedrooms' || field === 'bathrooms') {
      value = 1 + Math.floor(Math.random() * 5);
    } else if (field === 'squareFeet') {
      value = 1000 + Math.floor(Math.random() * 3000);
    } else if (field === 'yearBuilt') {
      value = 1950 + Math.floor(Math.random() * 70);
    } else {
      value = ['Good', 'Average', 'Excellent', 'Fair', 'Poor'][Math.floor(Math.random() * 5)];
    }
    
    events.push({
      id: `pred_${i}`,
      timestamp,
      eventType: 'prediction',
      field,
      originalValue: value,
      confidence: 0.7 + Math.random() * 0.3, // 70-100% confidence
      agentId: 'agent_forecast',
      agentName: 'TerraFusion Forecast Agent',
      modelVersion: 'v2.3.1',
      propertyId: property.id,
      propertyAddress: property.address
    });
  }
  
  // Generate some override events (user corrections)
  for (let i = 0; i < 15; i++) {
    const field = fields[Math.floor(Math.random() * fields.length)];
    const property = getProperty();
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000).toISOString();
    const user = users[Math.floor(Math.random() * users.length)];
    
    let originalValue: string | number;
    let newValue: string | number;
    
    if (field === 'valueConclusion') {
      originalValue = 250000 + Math.floor(Math.random() * 500000);
      newValue = originalValue * (1 + (Math.random() * 0.2 - 0.1)); // ±10%
    } else if (field === 'bedrooms' || field === 'bathrooms') {
      originalValue = 1 + Math.floor(Math.random() * 5);
      newValue = originalValue + (Math.random() > 0.5 ? 1 : -1);
    } else if (field === 'squareFeet') {
      originalValue = 1000 + Math.floor(Math.random() * 3000);
      newValue = originalValue * (1 + (Math.random() * 0.1 - 0.05)); // ±5%
    } else if (field === 'yearBuilt') {
      originalValue = 1950 + Math.floor(Math.random() * 70);
      newValue = originalValue + (Math.random() > 0.5 ? 1 : -1);
    } else {
      const options = ['Good', 'Average', 'Excellent', 'Fair', 'Poor'];
      originalValue = options[Math.floor(Math.random() * options.length)];
      do {
        newValue = options[Math.floor(Math.random() * options.length)];
      } while (newValue === originalValue);
    }
    
    events.push({
      id: `override_${i}`,
      timestamp,
      eventType: 'override',
      field,
      originalValue,
      newValue,
      agentId: 'agent_forecast',
      agentName: 'TerraFusion Forecast Agent',
      modelVersion: 'v2.3.1',
      propertyId: property.id,
      propertyAddress: property.address,
      userId: user.id,
      userName: user.name,
      reason: ['Incorrect data', 'Recent renovation', 'Market conditions', 'Local knowledge'][Math.floor(Math.random() * 4)]
    });
  }
  
  // Generate some review events
  for (let i = 0; i < 10; i++) {
    const property = getProperty();
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000).toISOString();
    const user = users[Math.floor(Math.random() * users.length)];
    
    events.push({
      id: `review_${i}`,
      timestamp,
      eventType: 'review',
      field: 'completedReview',
      originalValue: 'Pending',
      newValue: 'Approved',
      agentId: 'agent_forecast',
      agentName: 'TerraFusion Forecast Agent',
      modelVersion: 'v2.3.1',
      propertyId: property.id,
      propertyAddress: property.address,
      userId: user.id,
      userName: user.name,
      reason: 'Quality check complete'
    });
  }
  
  // Generate some retrain events
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString();
    
    events.push({
      id: `retrain_${i}`,
      timestamp,
      eventType: 'retrain',
      field: 'modelUpdate',
      originalValue: `v2.${2+i}`,
      newValue: `v2.${3+i}`,
      agentId: 'agent_forecast',
      agentName: 'TerraFusion Forecast Agent',
      modelVersion: `v2.${3+i}`,
      propertyId: '0',
      propertyAddress: 'All Properties',
      reason: `Model retrain with ${100 + i * 50} new properties`
    });
  }
  
  // Sort by timestamp (latest first)
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}