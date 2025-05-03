/**
 * AgentFeedPanel Component
 * 
 * This component displays a chronological feed of agent activities and insights,
 * allowing users to see AI-driven actions, analysis, and valuation decisions.
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.events - Array of agent events to display
 * @param {Function} props.onHighlight - Callback when an event is clicked to highlight related fields
 * @param {boolean} props.readOnly - Whether the feed is in read-only mode (for audit purposes)
 * @param {string} props.position - Position of the panel ('right', 'bottom', or 'full')
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Calculator, 
  FileSpreadsheet, 
  AlertTriangle, 
  Info, 
  Download, 
  Filter, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  User, 
  Bot,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Sample event types for reference
const EVENT_TYPES = {
  FIELD_UPDATED: 'FieldUpdated',
  VALUE_CALCULATED: 'ValueCalculated',
  VALUE_UPDATED: 'ValueUpdated',
  COMP_SELECTED: 'CompSelected',
  COMP_REJECTED: 'CompRejected',
  ASSUMPTION_MADE: 'AssumptionMade',
  HUMAN_OVERRIDE: 'HumanOverride',
  SYSTEM_MESSAGE: 'SystemMessage',
  AI_ANALYSIS: 'AIAnalysis',
  OBSERVATION: 'Observation',
  SHAP_ANALYSIS: 'SHAPAnalysis'
};

// Sample agents for reference
const AGENTS = {
  VALUATION: 'valuationAgent',
  COMPS: 'compsAgent',
  FORECAST: 'forecastAgent',
  RISK: 'riskAgent',
  SYSTEM: 'system'
};

const AgentFeedPanel = ({ 
  events = [], 
  onHighlight = () => {}, 
  readOnly = false,
  position = 'right',
  onExport = () => {},
  parcelId = null
}) => {
  const [filter, setFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const scrollAreaRef = useRef(null);
  
  // Auto-scroll to bottom when new events come in if we're at the bottom
  useEffect(() => {
    if (isLiveStreaming && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [events, isLiveStreaming]);
  
  // Filter events based on current filter settings
  const filteredEvents = events.filter(event => {
    // Filter by type
    if (filter !== 'all' && event.type !== filter) {
      return false;
    }
    
    // Filter by agent
    if (agentFilter !== 'all' && event.agentId !== agentFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = event.description?.toLowerCase().includes(query);
      const matchesValue = event.value?.toString().toLowerCase().includes(query);
      const matchesField = event.fieldName?.toLowerCase().includes(query);
      
      return matchesDescription || matchesValue || matchesField;
    }
    
    return true;
  });
  
  // Only show override trail if filter is set to 'override'
  const overrideTrail = events.filter(event => 
    event.type === EVENT_TYPES.VALUE_UPDATED && event.trigger === 'human'
  );
  
  // Toggle collapse state
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  // Get icon for event type
  const getEventIcon = (type) => {
    switch (type) {
      case EVENT_TYPES.FIELD_UPDATED:
        return <Input className="h-4 w-4" />;
      case EVENT_TYPES.VALUE_CALCULATED:
      case EVENT_TYPES.VALUE_UPDATED:
        return <Calculator className="h-4 w-4" />;
      case EVENT_TYPES.COMP_SELECTED:
      case EVENT_TYPES.COMP_REJECTED:
        return <FileSpreadsheet className="h-4 w-4" />;
      case EVENT_TYPES.ASSUMPTION_MADE:
        return <Info className="h-4 w-4" />;
      case EVENT_TYPES.HUMAN_OVERRIDE:
        return <User className="h-4 w-4" />;
      case EVENT_TYPES.SYSTEM_MESSAGE:
        return <MessageSquare className="h-4 w-4" />;
      case EVENT_TYPES.AI_ANALYSIS:
        return <Bot className="h-4 w-4" />;
      case EVENT_TYPES.OBSERVATION:
        return <Info className="h-4 w-4" />;
      case EVENT_TYPES.SHAP_ANALYSIS:
        return <Calculator className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Get color for event type
  const getEventColor = (type, trigger = 'ai') => {
    if (trigger === 'human') {
      return 'bg-purple-100 border-purple-200 text-purple-700';
    }
    
    switch (type) {
      case EVENT_TYPES.FIELD_UPDATED:
        return 'bg-blue-50 border-blue-100 text-blue-700';
      case EVENT_TYPES.VALUE_CALCULATED:
        return 'bg-green-50 border-green-100 text-green-700';
      case EVENT_TYPES.VALUE_UPDATED:
        return 'bg-amber-50 border-amber-100 text-amber-700';
      case EVENT_TYPES.COMP_SELECTED:
        return 'bg-indigo-50 border-indigo-100 text-indigo-700';
      case EVENT_TYPES.ASSUMPTION_MADE:
        return 'bg-orange-50 border-orange-100 text-orange-700';
      case EVENT_TYPES.HUMAN_OVERRIDE:
        return 'bg-purple-50 border-purple-100 text-purple-700';
      case EVENT_TYPES.SYSTEM_MESSAGE:
        return 'bg-gray-50 border-gray-100 text-gray-700';
      case EVENT_TYPES.AI_ANALYSIS:
        return 'bg-cyan-50 border-cyan-100 text-cyan-700';
      default:
        return 'bg-gray-50 border-gray-100 text-gray-700';
    }
  };
  
  // Get agent name from ID
  const getAgentName = (agentId) => {
    switch (agentId) {
      case AGENTS.VALUATION:
        return 'Valuation Agent';
      case AGENTS.COMPS:
        return 'Comps Agent';
      case AGENTS.FORECAST:
        return 'Forecast Agent';
      case AGENTS.RISK:
        return 'Risk Agent';
      case AGENTS.SYSTEM:
        return 'System';
      default:
        return 'Unknown Agent';
    }
  };
  
  // Get badge variant based on agent
  const getAgentBadgeVariant = (agentId) => {
    switch (agentId) {
      case AGENTS.VALUATION:
        return 'secondary';
      case AGENTS.COMPS:
        return 'outline';
      case AGENTS.FORECAST:
        return 'default';
      case AGENTS.RISK:
        return 'destructive';
      case AGENTS.SYSTEM:
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Handle clicking on an event
  const handleEventClick = (event) => {
    if (event.fieldId) {
      onHighlight(event);
    }
  };
  
  // Export events as JSON
  const handleExportJSON = () => {
    const eventsToExport = filter === 'all' ? events : filteredEvents;
    const jsonData = JSON.stringify(eventsToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-feed-${parcelId || 'events'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (onExport) {
      onExport('json', eventsToExport);
    }
  };
  
  // Export events as PDF (dummy function - would need actual PDF generation)
  const handleExportPDF = () => {
    if (onExport) {
      onExport('pdf', filter === 'all' ? events : filteredEvents);
    }
  };
  
  // Render the event feed
  return (
    <Card className={`shadow-md ${collapsed ? 'h-auto' : 'h-full'}`}>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center">
            Agent Activity Feed
            {isLiveStreaming && !readOnly && (
              <Badge variant="outline" className="ml-2 animate-pulse">Live</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            Real-time AI agent activity and insights
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleCollapse} className="h-8 w-8 p-0">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {!collapsed && (
        <>
          <CardContent className="p-0 space-y-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full rounded-none">
                <TabsTrigger value="live">Live Feed</TabsTrigger>
                <TabsTrigger value="override">Override Trail</TabsTrigger>
              </TabsList>
              
              <div className="p-3 border-b">
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Select value={agentFilter} onValueChange={setAgentFilter}>
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue placeholder="All Agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        <SelectItem value={AGENTS.VALUATION}>Valuation</SelectItem>
                        <SelectItem value={AGENTS.COMPS}>Comps</SelectItem>
                        <SelectItem value={AGENTS.FORECAST}>Forecast</SelectItem>
                        <SelectItem value={AGENTS.RISK}>Risk</SelectItem>
                        <SelectItem value={AGENTS.SYSTEM}>System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} shown
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs" 
                        onClick={handleExportJSON}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        JSON
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={handleExportPDF}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <TabsContent value="live" className="m-0 p-0">
                <ScrollArea 
                  className="h-[400px] rounded-none p-0" 
                  ref={scrollAreaRef}
                >
                  <div className="p-3 space-y-2">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No agent events to display</p>
                        <p className="text-xs mt-1">Events will appear here as agents perform actions</p>
                      </div>
                    ) : (
                      filteredEvents.map((event, index) => (
                        <div 
                          key={event.id || index}
                          className={`p-3 rounded-md border text-sm cursor-pointer transition-all duration-100 hover:brightness-95 ${getEventColor(event.type, event.trigger)}`}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <Badge variant={getAgentBadgeVariant(event.agentId)} className="font-normal text-xs">
                              {getAgentName(event.agentId)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{event.title || event.type}</p>
                              <p className="text-xs mt-1">{event.description}</p>
                              
                              {event.fieldId && (
                                <p className="text-xs mt-1.5 flex items-center">
                                  <span className="font-medium">Field:</span>
                                  <span className="ml-1">{event.fieldName}</span>
                                </p>
                              )}
                              
                              {event.value !== undefined && (
                                <p className="text-xs mt-0.5 flex items-center">
                                  <span className="font-medium">Value:</span>
                                  <span className="ml-1">{event.value}</span>
                                </p>
                              )}
                              
                              {event.confidence !== undefined && (
                                <p className="text-xs mt-0.5 flex items-center">
                                  <span className="font-medium">Confidence:</span>
                                  <span className="ml-1">{event.confidence}%</span>
                                </p>
                              )}
                              
                              {event.shapValues && (
                                <div className="mt-2 bg-white bg-opacity-50 p-2 rounded text-xs">
                                  <p className="font-medium mb-1">SHAP Values:</p>
                                  <ul className="space-y-1">
                                    {Object.entries(event.shapValues).map(([key, value]) => (
                                      <li key={key} className="flex justify-between">
                                        <span>{key}</span>
                                        <span>{value.toFixed(3)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {event.trigger === 'human' && (
                                <Badge className="mt-2" variant="secondary">Human Override</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="override" className="m-0 p-0">
                <ScrollArea className="h-[400px] rounded-none p-0">
                  <div className="p-3 space-y-2">
                    {overrideTrail.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No human overrides detected</p>
                        <p className="text-xs mt-1">Override history will appear here when humans modify AI values</p>
                      </div>
                    ) : (
                      overrideTrail.map((event, index) => (
                        <div 
                          key={event.id || index}
                          className="p-3 rounded-md border bg-purple-50 border-purple-100 text-sm"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <Badge variant="secondary" className="font-normal text-xs">
                              Human Override
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{event.title || "Value Updated"}</p>
                              <p className="text-xs mt-1">{event.description}</p>
                              
                              {event.fieldId && (
                                <p className="text-xs mt-1.5 flex items-center">
                                  <span className="font-medium">Field:</span>
                                  <span className="ml-1">{event.fieldName}</span>
                                </p>
                              )}
                              
                              {event.previousValue !== undefined && event.value !== undefined && (
                                <div className="flex text-xs mt-1.5 space-x-2">
                                  <p className="flex items-center">
                                    <span className="font-medium">From:</span>
                                    <span className="ml-1">{event.previousValue}</span>
                                  </p>
                                  <p className="flex items-center">
                                    <span className="font-medium">To:</span>
                                    <span className="ml-1">{event.value}</span>
                                  </p>
                                </div>
                              )}
                              
                              {event.reason && (
                                <p className="text-xs mt-1.5 flex items-center">
                                  <span className="font-medium">Reason:</span>
                                  <span className="ml-1">{event.reason}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-3 text-xs text-muted-foreground">
            <div className="flex items-center">
              {readOnly ? (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Audit Mode
                </span>
              ) : (
                <span className="flex items-center">
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLiveStreaming ? 'animate-spin' : ''}`} />
                  {isLiveStreaming ? 'Live Updates' : 'Paused'}
                </span>
              )}
            </div>
            
            {!readOnly && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs px-2"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              >
                {isLiveStreaming ? 'Pause' : 'Resume'}
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default AgentFeedPanel;