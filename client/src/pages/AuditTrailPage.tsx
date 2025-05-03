/**
 * Audit Trail Page
 * 
 * This page displays a comprehensive audit trail of all agent activities
 * related to a specific property valuation.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { AgentFeedPanel } from '@/components/terrafusion';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  AlertTriangle, 
  Download, 
  FileText, 
  Info,
  Play,
  Calendar,
  Filter
} from 'lucide-react';

// Sample agent events for demonstration - in a real implementation, this would come from an API
const sampleAuditEvents = [
  {
    id: '1',
    timestamp: '2025-04-25T14:30:22Z',
    agentId: 'valuationAgent',
    type: 'ValueCalculated',
    title: 'Initial Value Assessment',
    description: 'Performed initial property valuation based on available data.',
    value: '$350,000',
    confidence: 85,
    trigger: 'ai'
  },
  {
    id: '2',
    timestamp: '2025-04-25T14:31:05Z',
    agentId: 'compsAgent',
    type: 'CompSelected',
    title: 'Comparable Selection',
    description: 'Selected 5 comparable properties based on similarity criteria.',
    fieldId: 'comparables',
    fieldName: 'Comparable Properties',
    trigger: 'ai'
  },
  {
    id: '3',
    timestamp: '2025-04-25T14:32:18Z',
    agentId: 'forecastAgent',
    type: 'ValueCalculated',
    title: 'Income Forecast',
    description: 'Generated 12-month income projection for rental potential.',
    value: '$2,100/month',
    confidence: 82,
    trigger: 'ai'
  },
  {
    id: '4',
    timestamp: '2025-04-25T14:33:40Z',
    agentId: 'valuationAgent',
    type: 'SHAP_ANALYSIS',
    title: 'Feature Analysis',
    description: 'Analyzed key property features affecting valuation.',
    shapValues: {
      'Location': 0.42,
      'Square Footage': 0.24,
      'Condition': 0.18,
      'Age': -0.12,
      'Bathrooms': 0.08
    },
    trigger: 'ai'
  },
  {
    id: '5',
    timestamp: '2025-04-25T14:35:22Z',
    agentId: 'valuationAgent',
    type: 'ValueUpdated',
    title: 'Value Reconciliation',
    description: 'Reconciled different valuation approaches to determine final value.',
    fieldId: 'finalValueOpinion',
    fieldName: 'Final Value Opinion',
    value: '$355,000',
    confidence: 90,
    trigger: 'ai'
  },
  {
    id: '6',
    timestamp: '2025-04-25T14:40:15Z',
    agentId: 'system',
    type: 'HumanOverride',
    title: 'Human Review',
    description: 'John Smith (Appraiser) reviewed and approved the valuation.',
    trigger: 'human'
  },
  {
    id: '7',
    timestamp: '2025-04-25T14:45:30Z',
    agentId: 'valuationAgent',
    type: 'ValueUpdated',
    title: 'Market Condition Adjustment',
    description: 'Applied market condition adjustment based on recent data.',
    fieldId: 'adjustments',
    fieldName: 'Market Conditions',
    previousValue: '0%',
    value: '+2%',
    trigger: 'ai'
  },
  {
    id: '8',
    timestamp: '2025-04-25T14:50:10Z',
    agentId: 'valuationAgent',
    type: 'ValueUpdated',
    title: 'Final Value Updated',
    description: 'Applied human judgment to final value opinion.',
    fieldId: 'finalValueOpinion',
    fieldName: 'Final Value Opinion',
    previousValue: '$355,000',
    value: '$360,000',
    reason: 'Recent market trends not fully captured in comparable data',
    trigger: 'human'
  },
  {
    id: '9',
    timestamp: '2025-04-25T15:00:00Z',
    agentId: 'system',
    type: 'SystemMessage',
    title: 'Valuation Finalized',
    description: 'Valuation report finalized and ready for export.',
    trigger: 'system'
  }
];

const AuditTrailPage = () => {
  // Get the parcel ID from the URL
  const [, params] = useRoute<{ parcelId: string }>('/audit/:parcelId');
  const parcelId = params?.parcelId || '';
  
  const [activeTab, setActiveTab] = useState('activity');
  const [timeRange, setTimeRange] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  
  // Filter audit events by time range
  const filterEventsByTimeRange = (events: any[], range: string) => {
    const now = new Date();
    
    switch (range) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return events.filter(event => new Date(event.timestamp) >= today);
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return events.filter(event => new Date(event.timestamp) >= weekAgo);
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return events.filter(event => new Date(event.timestamp) >= monthAgo);
      default:
        return events;
    }
  };
  
  // Filter audit events by agent
  const filterEventsByAgent = (events: any[], agentId: string) => {
    if (agentId === 'all') return events;
    return events.filter(event => event.agentId === agentId);
  };
  
  // Get filtered events
  const getFilteredEvents = () => {
    let filtered = [...sampleAuditEvents];
    filtered = filterEventsByTimeRange(filtered, timeRange);
    filtered = filterEventsByAgent(filtered, agentFilter);
    return filtered;
  };
  
  const filteredEvents = getFilteredEvents();
  
  return (
    <Layout 
      title="Audit Trail" 
      subtitle="Complete audit history of property valuation activities"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ClipboardList className="mr-2 h-6 w-6 text-primary" />
              Audit Trail
            </h1>
            <p className="text-muted-foreground">
              Complete audit history for Parcel ID: {parcelId}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="valuationAgent">Valuation Agent</SelectItem>
                <SelectItem value="compsAgent">Comparables Agent</SelectItem>
                <SelectItem value="forecastAgent">Forecast Agent</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
                <span className="sr-only">Export</span>
              </Button>
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
                <span className="sr-only">Report</span>
              </Button>
              <Button size="icon">
                <Play className="h-4 w-4" />
                <span className="sr-only">Replay</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Supplemental Info */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Info className="mr-2 h-5 w-5 text-primary" />
                  Audit Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Audit Period</p>
                    <p className="text-sm">
                      {new Date(sampleAuditEvents[0].timestamp).toLocaleString()} to{' '}
                      {new Date(sampleAuditEvents[sampleAuditEvents.length - 1].timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Total Events</p>
                    <p className="text-2xl font-bold">{sampleAuditEvents.length}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Event Breakdown</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>AI-Initiated Events:</span>
                        <Badge variant="outline">
                          {sampleAuditEvents.filter(e => e.trigger === 'ai').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Human Overrides:</span>
                        <Badge variant="outline">
                          {sampleAuditEvents.filter(e => e.trigger === 'human').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>System Events:</span>
                        <Badge variant="outline">
                          {sampleAuditEvents.filter(e => e.trigger === 'system').length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Related Information</p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                        <FileText className="mr-2 h-3 w-3" />
                        View Valuation Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                        <ClipboardList className="mr-2 h-3 w-3" />
                        View Property Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>What is the Audit Trail?</AlertTitle>
              <AlertDescription className="text-sm">
                The audit trail provides a complete, chronological record of all agent and human activities
                related to property valuation. This transparent history ensures accountability and enables
                review of the decision-making process.
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Right Column - Event Feed */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Activity Stream</TabsTrigger>
                <TabsTrigger value="visual">Visual Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Event Stream</CardTitle>
                    <CardDescription>
                      Chronological record of all activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AgentFeedPanel 
                      events={filteredEvents}
                      readOnly={true}
                      position="full"
                      parcelId={parcelId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="visual" className="mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Visual Timeline</CardTitle>
                    <CardDescription>
                      Visual representation of the valuation process
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">
                      Visual timeline view is currently in development.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please use the Activity Stream to view the audit trail.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuditTrailPage;