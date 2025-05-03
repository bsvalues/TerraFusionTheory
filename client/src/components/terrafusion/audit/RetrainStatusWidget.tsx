import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Check, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RetrainEvent {
  id: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'failed';
  modelVersion: string;
  accuracy: number;
  trigger: 'manual' | 'scheduled' | 'override_threshold';
  fields: string[];
  propertyCount: number;
}

interface RetrainStatusWidgetProps {
  propertyId?: string;
  agentId?: string;
  showActions?: boolean;
  className?: string;
}

export default function RetrainStatusWidget({
  propertyId,
  agentId,
  showActions = true,
  className = '',
}: RetrainStatusWidgetProps) {
  const [latestRetrain, setLatestRetrain] = useState<RetrainEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestRetrainStatus();
  }, [propertyId, agentId]);

  const fetchLatestRetrainStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // This would be a real API call in production
      // const response = await fetch(`/api/terrafusion/retrain/latest?${propertyId ? `propertyId=${propertyId}` : ''}${agentId ? `&agentId=${agentId}` : ''}`);
      // if (!response.ok) throw new Error('Failed to fetch retrain status');
      // const data = await response.json();

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API latency
      
      // Sample latest retrain event
      const mockData: RetrainEvent = {
        id: 'retrain_12345',
        timestamp: new Date().toISOString(),
        status: 'completed',
        modelVersion: 'v2.3.1',
        accuracy: 92.7,
        trigger: 'override_threshold',
        fields: ['valueConclusion', 'siteZoning', 'neighborhood'],
        propertyCount: 543
      };
      
      setLatestRetrain(mockData);
    } catch (err) {
      console.error('Error fetching retrain status:', err);
      setError('Failed to load model retraining status');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualRetrain = async () => {
    try {
      setLoading(true);
      
      // This would be a real API call in production
      // const response = await fetch(`/api/terrafusion/retrain/trigger`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ agentId, manualTrigger: true })
      // });
      // if (!response.ok) throw new Error('Failed to trigger retraining');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update to in-progress state
      if (latestRetrain) {
        setLatestRetrain({
          ...latestRetrain,
          status: 'in_progress',
          timestamp: new Date().toISOString(),
          trigger: 'manual'
        });
      }
      
      // Refresh status after a short delay
      setTimeout(fetchLatestRetrainStatus, 2000);
      
    } catch (err) {
      console.error('Error triggering model retraining:', err);
      setError('Failed to start model retraining');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!latestRetrain) return null;
    
    switch (latestRetrain.status) {
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Trained Successfully
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Retraining...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Retraining Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading && !latestRetrain) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            AI Model Status
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading model status...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !latestRetrain) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            AI Model Status
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={fetchLatestRetrainStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            AI Model Status
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-80">
                    TerraFusion AI models are continuously improved through retraining with new data and user feedback. 
                    This widget shows the status of the latest model training activity.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {latestRetrain && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model Version:</span>
              <span className="font-medium">{latestRetrain.modelVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accuracy:</span>
              <span className="font-medium">{latestRetrain.accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{formatDate(latestRetrain.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Training Trigger:</span>
              <span className="font-medium capitalize">
                {latestRetrain.trigger.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Sample:</span>
              <span className="font-medium">{latestRetrain.propertyCount.toLocaleString()}</span>
            </div>
            
            {latestRetrain.fields && latestRetrain.fields.length > 0 && (
              <div className="pt-1">
                <p className="text-muted-foreground mb-1">Improved Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {latestRetrain.fields.map(field => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {showActions && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={triggerManualRetrain}
                  disabled={loading || latestRetrain.status === 'in_progress'}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Processing...' : 'Retrain Model'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}