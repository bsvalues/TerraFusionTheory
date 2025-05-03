/**
 * CompImpactVisualizer Component
 * 
 * A visualization component using Plotly to show SHAP values and valuation impact
 * by feature for comparable properties. Shows how each feature of a comp property
 * affects the overall valuation in a waterfall-style visualization.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CompProperty } from './SmartCompTray';
import { InfoIcon } from 'lucide-react';
import Plot from 'react-plotly.js';
import mockShapData from './mock_shap_data.json';

interface ShapFeature {
  feature: string;
  effect: number;
  value: string;
  description: string;
}

interface ShapData {
  baseValue: number;
  outputValue: number;
  features: ShapFeature[];
}

interface CompImpactVisualizerProps {
  compProperty: CompProperty;
  subjectProperty?: CompProperty;
  shapData?: ShapData;
  loading?: boolean;
  className?: string;
}

const CompImpactVisualizer: React.FC<CompImpactVisualizerProps> = ({
  compProperty,
  subjectProperty,
  shapData,
  loading = false,
  className = ''
}) => {
  const [data, setData] = useState<ShapData | null>(null);
  
  // Use provided SHAP data or load mock data if none is provided
  useEffect(() => {
    if (shapData) {
      // If shapData is provided by parent, use it
      setData(shapData);
    } else if (!loading) {
      // If no shapData is provided and not loading, use mock data
      // In a real implementation, this fallback wouldn't be needed
      const loadData = () => {
        // Simulate an API call delay
        setTimeout(() => {
          setData(mockShapData);
        }, 500);
      };
      
      loadData();
    }
  }, [shapData, loading, compProperty.id]);
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Create Plotly data for the waterfall chart
  const createPlotData = (shapData: ShapData) => {
    // Sort features by absolute effect for better visualization
    const sortedFeatures = [...shapData.features].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
    
    // Create the measure array (determines the type of bar)
    const measure = ['absolute'];
    sortedFeatures.forEach(() => {
      measure.push('relative');
    });
    measure.push('total');
    
    // Create the y values (feature names)
    const y = ['Base Value'];
    sortedFeatures.forEach(feature => {
      y.push(feature.feature);
    });
    y.push('Final Value');
    
    // Create the x values (base value, adjustments, final value)
    const x = [shapData.baseValue];
    sortedFeatures.forEach(feature => {
      x.push(feature.effect);
    });
    x.push(shapData.outputValue);

    // Create text labels for each bar
    const text = [formatCurrency(shapData.baseValue)];
    sortedFeatures.forEach(feature => {
      const sign = feature.effect > 0 ? '+' : '';
      text.push(`${sign}${formatCurrency(feature.effect)}`);
    });
    text.push(formatCurrency(shapData.outputValue));
    
    // Create colors for each bar
    const colors = ['rgba(59, 130, 246, 0.8)']; // Base value (primary blue)
    sortedFeatures.forEach(feature => {
      if (feature.effect > 0) {
        colors.push('rgba(16, 185, 129, 0.8)'); // Positive effect (green)
      } else if (feature.effect < 0) {
        colors.push('rgba(239, 68, 68, 0.8)'); // Negative effect (red)
      } else {
        colors.push('rgba(107, 114, 128, 0.8)'); // No effect (gray)
      }
    });
    colors.push('rgba(59, 130, 246, 0.8)'); // Final value (primary blue)
    
    return [{
      type: 'waterfall',
      measure: measure,
      y: y,
      x: x,
      text: text,
      textposition: 'outside',
      connector: {
        line: {
          color: 'rgba(59, 130, 246, 0.5)',
        }
      },
      orientation: 'h',
      marker: {
        color: colors,
        line: {
          width: 1,
          color: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }];
  };
  
  // Create layout for the Plotly chart
  const createLayout = () => {
    return {
      title: '',
      height: 400,
      font: {
        family: 'Inter, system-ui, sans-serif',
        size: 12,
        color: '#f3f4f6'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: {
        l: 120,
        r: 50,
        t: 30,
        b: 50
      },
      xaxis: {
        title: 'Value Adjustment ($)',
        gridcolor: 'rgba(107, 114, 128, 0.2)',
        tickformat: '$,.0f',
        tickfont: {
          size: 11
        }
      },
      yaxis: {
        tickfont: {
          size: 11
        }
      },
      showlegend: false
    };
  };
  
  // Display loading state
  if (loading || !data) {
    return (
      <Card className={`tf-card ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Property Value Impact</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Shows how each feature of the comparable property affects the valuation adjustment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>SHAP values showing feature contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`tf-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <span>Property Value Impact</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Shows how each feature of the comparable property affects the valuation adjustment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>SHAP values showing feature contributions</CardDescription>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-sm text-muted-foreground">Total Impact</div>
            <Badge className={`text-white ${data.outputValue > data.baseValue ? 'bg-green-500' : data.outputValue < data.baseValue ? 'bg-red-500' : 'bg-gray-500'}`}>
              {data.outputValue > data.baseValue ? '+' : ''}
              {formatCurrency(data.outputValue - data.baseValue)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="tf-viz-container">
          <Plot
            data={createPlotData(data)}
            layout={createLayout()}
            config={{ 
              responsive: true,
              displayModeBar: false
            }}
            className="tf-vizion-plot"
          />
        </div>
        
        <div className="mt-2 text-sm">
          <div className="flex items-center mb-2">
            <span className="text-muted-foreground">Base Adjustment: </span>
            <span className="ml-1 font-semibold">{formatCurrency(data.outputValue - data.baseValue)}</span>
          </div>
          
          <div className="grid gap-2">
            {data.features.map((feature, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{feature.feature}: </span>
                  <span className="text-muted-foreground">{feature.value}</span>
                </div>
                <div className={`text-right font-semibold ${feature.effect > 0 ? 'text-green-500' : feature.effect < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {feature.effect > 0 ? '+' : ''}
                  {formatCurrency(feature.effect)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompImpactVisualizer;