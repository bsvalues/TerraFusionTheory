/**
 * GAMA (Government Automated Mass Appraisal) Page
 * 
 * Main interface for the Government Automated Mass Appraisal system.
 * Provides comprehensive mass appraisal workflow with agent coordination.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  MapPin, 
  Users, 
  TrendingUp,
  Clock,
  Target,
  Home,
  Shield,
  Brain,
  Zap
} from 'lucide-react';
import GAMAMap from '@/components/gama/GAMAMap';

// Interfaces
interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration?: number;
  agent?: string;
  results?: any;
}

interface PropertyData {
  id: string;
  address: string;
  coordinates: [number, number];
  assessedValue: number;
  marketValue?: number;
  salePrice?: number;
  saleDate?: string;
  confidence: number;
  status: 'pending' | 'processing' | 'completed' | 'flagged';
  agentInsights: {
    zoning: { score: number; issues: string[] };
    mra: { value: number; confidence: number };
    comps: { count: number; similarity: number };
    equity: { score: number; warnings: string[] };
  };
  propertyType: string;
  livingArea: number;
  lotSize: number;
  neighborhood: string;
}

interface MarketCluster {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  averageValue: number;
  sampleSize: number;
  confidence: number;
  characteristics: string[];
}

interface GAMAMetrics {
  totalProperties: number;
  completedProperties: number;
  averageConfidence: number;
  equityScore: number;
  modelAccuracy: number;
  processingTime: number;
}

// Mock data generators
const generateMockProperties = (): PropertyData[] => {
  const properties: PropertyData[] = [];
  const neighborhoods = ['West Richland', 'Kennewick Heights', 'Finley', 'Badger Mountain', 'Columbia Point', 'Southridge', 'Canyon Lakes'];
  
  for (let i = 0; i < 150; i++) {
    // Distribute properties across actual Benton County cities
    let lat, lng;
    const cityRandom = Math.random();
    
    if (cityRandom < 0.4) {
      // Kennewick (largest city)
      lat = 46.2112 + (Math.random() - 0.5) * 0.04;
      lng = -119.1372 + (Math.random() - 0.5) * 0.06;
    } else if (cityRandom < 0.7) {
      // Richland
      lat = 46.2857 + (Math.random() - 0.5) * 0.03;
      lng = -119.2844 + (Math.random() - 0.5) * 0.04;
    } else if (cityRandom < 0.85) {
      // West Richland
      lat = 46.3043 + (Math.random() - 0.5) * 0.025;
      lng = -119.3614 + (Math.random() - 0.5) * 0.03;
    } else {
      // Rural Benton County
      lat = 46.15 + Math.random() * 0.25;
      lng = -119.6 + Math.random() * 0.4;
    }
    
    const assessedValue = 180000 + Math.random() * 600000;
    
    properties.push({
      id: `prop_${i}`,
      address: `${1000 + i} ${['Columbia River Rd', 'Queensgate Dr', 'Clearwater Ave', 'Road 68', 'Bombing Range Rd', 'Canal Dr', 'Richland Hills Dr'][Math.floor(Math.random() * 7)]}`,
      coordinates: [lat, lng],
      assessedValue,
      marketValue: assessedValue * (0.9 + Math.random() * 0.2),
      salePrice: Math.random() > 0.7 ? assessedValue * (0.85 + Math.random() * 0.3) : undefined,
      saleDate: Math.random() > 0.7 ? '2024-05-15' : undefined,
      confidence: 0.6 + Math.random() * 0.35,
      status: ['pending', 'processing', 'completed', 'flagged'][Math.floor(Math.random() * 4)] as any,
      agentInsights: {
        zoning: { 
          score: 0.7 + Math.random() * 0.3, 
          issues: Math.random() > 0.8 ? ['Compliance issue detected'] : [] 
        },
        mra: { 
          value: assessedValue * (0.95 + Math.random() * 0.1), 
          confidence: 0.6 + Math.random() * 0.3 
        },
        comps: { 
          count: 3 + Math.floor(Math.random() * 7), 
          similarity: 0.6 + Math.random() * 0.3 
        },
        equity: { 
          score: 0.7 + Math.random() * 0.3, 
          warnings: Math.random() > 0.9 ? ['Assessment disparity detected'] : [] 
        }
      },
      propertyType: 'Single Family',
      livingArea: 1200 + Math.random() * 2800,
      lotSize: 5000 + Math.random() * 15000,
      neighborhood: neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
    });
  }
  
  return properties;
};

const generateMockMarketClusters = (): MarketCluster[] => {
  return [
    {
      id: 'cluster_1',
      name: 'Kennewick Commercial Core',
      center: [46.2119, -119.1372],
      radius: 1800,
      averageValue: 285000,
      sampleSize: 78,
      confidence: 0.82,
      characteristics: ['Commercial proximity', 'Established neighborhoods', 'Columbia River access']
    },
    {
      id: 'cluster_2',
      name: 'West Richland Family',
      center: [46.3043, -119.3614],
      radius: 2200,
      averageValue: 425000,
      sampleSize: 65,
      confidence: 0.79,
      characteristics: ['Single family', 'New construction', 'Family oriented']
    },
    {
      id: 'cluster_3',
      name: 'Badger Mountain Premium',
      center: [46.3219, -119.2106],
      radius: 1200,
      averageValue: 580000,
      sampleSize: 42,
      confidence: 0.75,
      characteristics: ['Hill views', 'Large lots', 'Premium location']
    },
    {
      id: 'cluster_4',
      name: 'Rural Agricultural',
      center: [46.1850, -119.4500],
      radius: 3000,
      averageValue: 320000,
      sampleSize: 38,
      confidence: 0.71,
      characteristics: ['Agricultural', 'Large parcels', 'Rural lifestyle']
    }
  ];
};

const initialWorkflowSteps: WorkflowStep[] = [
  {
    id: 'load_parcel_data',
    name: 'Load Parcel & Neighborhood Data',
    description: 'Loading property data and neighborhood context',
    status: 'completed',
    progress: 100,
    agent: 'Data Loader'
  },
  {
    id: 'identify_market_cluster',
    name: 'Identify Market Cluster',
    description: 'Classifying properties into market segments',
    status: 'completed',
    progress: 100,
    agent: 'Market Analyzer'
  },
  {
    id: 'run_regression_model',
    name: 'Run Mass Regression Analysis',
    description: 'Executing statistical models for value prediction',
    status: 'running',
    progress: 65,
    agent: 'MRA Agent'
  },
  {
    id: 'comp_set_selection',
    name: 'Comparable Sales Selection',
    description: 'Selecting and analyzing comparable properties',
    status: 'pending',
    progress: 0,
    agent: 'Comp Agent'
  },
  {
    id: 'valuation_adjustment',
    name: 'Valuation & Adjustment Overlay',
    description: 'Reconciling multiple valuation approaches',
    status: 'pending',
    progress: 0,
    agent: 'Valuation Agent'
  },
  {
    id: 'equity_quality_check',
    name: 'Equity & Quality Assurance',
    description: 'Checking for assessment equity and quality issues',
    status: 'pending',
    progress: 0,
    agent: 'Equity Guard'
  },
  {
    id: 'narrator_summary',
    name: 'NarratorAI Value Story',
    description: 'Generating human-readable explanations',
    status: 'pending',
    progress: 0,
    agent: 'NarratorAI'
  }
];

const WorkflowProgress: React.FC<{
  steps: WorkflowStep[];
  onStepClick: (step: WorkflowStep) => void;
}> = ({ steps, onStepClick }) => {
  const overallProgress = steps.reduce((sum, step) => sum + step.progress, 0) / steps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          GAMA Workflow Progress
        </CardTitle>
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-3" />
          <div className="text-sm text-gray-600">
            Overall Progress: {overallProgress.toFixed(1)}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => onStepClick(step)}
            >
              <div className="flex-shrink-0">
                {step.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {step.status === 'running' && <Clock className="h-5 w-5 text-yellow-600 animate-spin" />}
                {step.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {step.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{step.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {step.agent}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mb-2">{step.description}</div>
                <Progress value={step.progress} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsPanel: React.FC<{ metrics: GAMAMetrics }> = ({ metrics }) => {
  const metricCards = [
    {
      title: 'Total Properties',
      value: metrics.totalProperties.toLocaleString(),
      icon: Home,
      color: 'text-blue-600'
    },
    {
      title: 'Completed',
      value: `${metrics.completedProperties}`,
      subtitle: `${((metrics.completedProperties / metrics.totalProperties) * 100).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Avg Confidence',
      value: `${(metrics.averageConfidence * 100).toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-600'
    },
    {
      title: 'Equity Score',
      value: `${(metrics.equityScore * 100).toFixed(1)}%`,
      icon: Shield,
      color: 'text-indigo-600'
    },
    {
      title: 'Model Accuracy',
      value: `${(metrics.modelAccuracy * 100).toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-orange-600'
    },
    {
      title: 'Processing Time',
      value: `${metrics.processingTime.toFixed(1)}min`,
      icon: Clock,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricCards.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
              <span className="text-xs text-gray-600">{metric.title}</span>
            </div>
            <div className="font-semibold text-lg">{metric.value}</div>
            {metric.subtitle && (
              <div className="text-xs text-gray-500">{metric.subtitle}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AgentStatusPanel: React.FC = () => {
  const agents = [
    { name: 'Zoning Agent', status: 'active', processed: 142, icon: Target, color: 'text-purple-600' },
    { name: 'MRA Agent', status: 'active', processed: 98, icon: BarChart3, color: 'text-blue-600' },
    { name: 'Comp Agent', status: 'idle', processed: 87, icon: Home, color: 'text-green-600' },
    { name: 'Equity Guard', status: 'idle', processed: 76, icon: Shield, color: 'text-indigo-600' },
    { name: 'NarratorAI', status: 'idle', processed: 45, icon: Brain, color: 'text-orange-600' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <agent.icon className={`h-4 w-4 ${agent.color}`} />
                <span className="font-medium text-sm">{agent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{agent.processed} processed</span>
                <Badge 
                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {agent.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const GAMAPage: React.FC = () => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(initialWorkflowSteps);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [properties] = useState<PropertyData[]>(generateMockProperties());
  const [marketClusters] = useState<MarketCluster[]>(generateMockMarketClusters());
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);

  const metrics: GAMAMetrics = {
    totalProperties: properties.length,
    completedProperties: properties.filter(p => p.status === 'completed').length,
    averageConfidence: properties.reduce((sum, p) => sum + p.confidence, 0) / properties.length,
    equityScore: 0.82,
    modelAccuracy: 0.78,
    processingTime: 24.5
  };

  const handleStartWorkflow = () => {
    setIsRunning(true);
    // Simulate workflow progression
    const interval = setInterval(() => {
      setWorkflowSteps(prev => {
        const updated = [...prev];
        const runningStep = updated.find(s => s.status === 'running');
        if (runningStep && runningStep.progress < 100) {
          runningStep.progress += Math.random() * 10;
          if (runningStep.progress >= 100) {
            runningStep.progress = 100;
            runningStep.status = 'completed';
            const nextIndex = updated.findIndex(s => s.id === runningStep.id) + 1;
            if (nextIndex < updated.length) {
              updated[nextIndex].status = 'running';
            }
          }
        }
        return updated;
      });
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 30000);
  };

  const handleResetWorkflow = () => {
    setWorkflowSteps(initialWorkflowSteps);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              GAMA - Government Automated Mass Appraisal
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered mass property valuation with equity monitoring
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleStartWorkflow} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running...' : 'Start Workflow'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleResetWorkflow}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <MetricsPanel metrics={metrics} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Progress */}
          <div className="lg:col-span-1 space-y-6">
            <WorkflowProgress 
              steps={workflowSteps} 
              onStepClick={setSelectedStep}
            />
            <AgentStatusPanel />
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  GAMA Visualization Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <GAMAMap
                  properties={properties}
                  marketClusters={marketClusters}
                  onPropertySelect={setSelectedProperty}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workflow Step Details */}
        {selectedStep && (
          <Card>
            <CardHeader>
              <CardTitle>Workflow Step Details: {selectedStep.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedStep.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Agent</h4>
                  <Badge>{selectedStep.agent}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Progress</h4>
                  <div className="space-y-2">
                    <Progress value={selectedStep.progress} />
                    <span className="text-sm text-gray-600">{selectedStep.progress.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts and Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Equity Alert:</strong> 3 properties flagged for potential assessment disparity in Pine Valley neighborhood.
            </AlertDescription>
          </Alert>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quality Check:</strong> Model accuracy within acceptable IAAO standards (&gt;75%).
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default GAMAPage;