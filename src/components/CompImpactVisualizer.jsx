import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

/**
 * CompImpactVisualizer Component
 * 
 * A visualization component using Plotly to show SHAP values and valuation impact
 * by feature for comparable properties. Shows how each feature of a comp property
 * affects the overall valuation in a waterfall-style visualization.
 */
export const CompImpactVisualizer = ({
  compProperty,
  subjectProperty,
  shapData,
  loading = false,
  adjustment = null,
  className = ''
}) => {
  const [data, setData] = useState(null);
  
  // Use provided SHAP data or adjustment data
  useEffect(() => {
    if (shapData) {
      setData(shapData);
    } else if (adjustment && !loading) {
      // Convert adjustment data to SHAP format
      const features = adjustment.features.map(feature => ({
        feature: feature.feature,
        effect: feature.effect,
        value: feature.value || '',
        description: feature.description || ''
      }));
      
      setData({
        baseValue: subjectProperty.price,
        outputValue: adjustment.adjusted_price,
        features
      });
    }
  }, [shapData, adjustment, loading, subjectProperty]);
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Create Plotly data for the waterfall chart
  const createPlotData = (shapData) => {
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
        family: 'Inter, -apple-system, system-ui, sans-serif',
        size: 12,
        color: '#f3f4f6'
      },
      paper_bgcolor: 'rgba(31, 41, 55, 0)',
      plot_bgcolor: 'rgba(31, 41, 55, 0)',
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
      <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-400">Property Value Impact</h3>
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
        
        <div className="space-y-4">
          <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-400">Property Value Impact</h3>
        
        <div className="flex items-center">
          <span className="text-gray-400 text-sm mr-2">Total Impact:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            data.outputValue > data.baseValue 
              ? 'bg-green-500/20 text-green-400' 
              : data.outputValue < data.baseValue 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-gray-500/20 text-gray-400'
          }`}>
            {data.outputValue > data.baseValue ? '+' : ''}
            {formatCurrency(data.outputValue - data.baseValue)}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <Plot
          data={createPlotData(data)}
          layout={createLayout()}
          config={{ 
            responsive: true,
            displayModeBar: false
          }}
          className="w-full"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subject Property Value:</span>
          <span className="font-medium">{formatCurrency(data.baseValue)}</span>
        </div>
        
        <div className="space-y-2">
          {data.features.map((feature, index) => (
            <div key={index} className="flex justify-between text-sm items-start">
              <div className="flex-1">
                <span className="font-medium">{feature.feature}:</span>
                <span className="text-gray-400 ml-1">{feature.value}</span>
              </div>
              <span className={`text-right font-medium ${
                feature.effect > 0 
                  ? 'text-green-400' 
                  : feature.effect < 0 
                    ? 'text-red-400' 
                    : 'text-gray-400'
              }`}>
                {feature.effect > 0 ? '+' : ''}
                {formatCurrency(feature.effect)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
          <span className="text-gray-400">Adjusted Value:</span>
          <span className="font-medium">{formatCurrency(data.outputValue)}</span>
        </div>
      </div>
    </div>
  );
};