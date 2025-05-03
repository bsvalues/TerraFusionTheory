import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Define Agent activity types
export interface AgentActivity {
  id: string;
  type: 'info' | 'warning' | 'success' | 'calculation';
  message: string;
  details?: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  propertyId?: string;
  formField?: string; // URAR form field that this activity relates to
}

interface AgentFeedPanelProps {
  title?: string;
  description?: string;
  propertyId?: string;
  height?: string;
  className?: string;
}

export default function AgentFeedPanel({
  title = 'Agent Activity Feed',
  description = 'Real-time TerraFusion agent insights',
  propertyId,
  height = '400px',
  className = '',
}: AgentFeedPanelProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const websocketRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Connect to the WebSocket server
  useEffect(() => {
    const connectWebSocket = () => {
      // Close existing connection if any
      if (websocketRef.current) {
        websocketRef.current.close();
      }

      setConnectionStatus('connecting');

      // Create a new WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setConnectionStatus('connected');

        // Send property ID if provided to filter messages
        if (propertyId) {
          socket.send(JSON.stringify({
            type: 'subscribe',
            propertyId
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // If it's an agent activity, add it to the feed
          if (data.type) {
            console.log('Received agent activity:', data);
            
            // If property ID is set, only show activities for this property
            if (!propertyId || data.propertyId === propertyId) {
              setActivities(prev => {
                // Avoid duplicate activities (use data.id to identify unique activities)
                const exists = prev.some(activity => activity.id === data.id);
                if (exists) return prev;
                
                // Add new activity at the beginning of the list
                return [data, ...prev].slice(0, 100); // Limit to 100 activities
              });
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      websocketRef.current = socket;
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [propertyId]);

  // Auto-scroll to the most recent activity
  useEffect(() => {
    if (scrollAreaRef.current && activities.length > 0) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [activities]);

  // Function to get the appropriate icon for the activity type
  const getActivityIcon = (type: AgentActivity['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'calculation':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get badge color based on activity type
  const getBadgeVariant = (type: AgentActivity['type']): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'info':
        return 'default';
      case 'warning':
        return 'destructive';
      case 'success':
        return 'secondary';
      case 'calculation':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`${className} w-full`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge 
            variant={
              connectionStatus === 'connected' ? 'secondary' : 
              connectionStatus === 'connecting' ? 'outline' : 
              'destructive'
            }
            className="flex gap-1 items-center"
          >
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-amber-500' : 
              'bg-red-500'
            }`} />
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(var(--radius)-2rem)]" style={{ height }}>
          <div className="space-y-4 pr-4" ref={scrollAreaRef}>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-2">Waiting for agent activities...</div>
                <div className="text-sm">
                  {isConnected ? 'Connected and listening for events' : 'Attempting to connect to agent feed...'}
                </div>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex flex-col space-y-1 border-l-2 pl-4 relative py-2" style={{
                  borderColor: 
                    activity.type === 'info' ? 'var(--primary)' : 
                    activity.type === 'warning' ? 'var(--destructive)' : 
                    activity.type === 'success' ? 'var(--green-500)' : 
                    'var(--blue-500)'
                }}>
                  <div className="absolute left-[-8px] top-3 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 
                        activity.type === 'info' ? 'var(--primary)' : 
                        activity.type === 'warning' ? 'var(--destructive)' : 
                        activity.type === 'success' ? 'var(--green-500)' : 
                        'var(--blue-500)'
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{activity.message}</div>
                    <Badge variant={getBadgeVariant(activity.type)} className="text-xs ml-2">
                      {formatTimestamp(activity.timestamp)}
                    </Badge>
                  </div>
                  
                  {activity.details && (
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  )}

                  {activity.formField && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              Form Field: {activity.formField}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This insight relates to URAR form field {activity.formField}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {activity.agentName && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Agent: {activity.agentName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}