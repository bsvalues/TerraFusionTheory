/**
 * NarrativeAgent Component
 * 
 * Translates SHAP values and comp property differences into natural language
 * explanations that users can easily understand. Creates contextual narratives
 * about why certain properties impact valuations in specific ways.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { CompProperty } from './SmartCompTray';

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

interface NarrativeAgentProps {
  compProperty: CompProperty;
  subjectProperty?: CompProperty;
  shapData: ShapData;
  className?: string;
}

const NarrativeAgent: React.FC<NarrativeAgentProps> = ({
  compProperty,
  subjectProperty,
  shapData,
  className = ''
}) => {
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort features by their absolute effect
  const sortedFeatures = [...shapData.features].sort((a, b) => 
    Math.abs(b.effect) - Math.abs(a.effect)
  );

  // Get the top features (those with the largest impact)
  const topFeatures = sortedFeatures.slice(0, 3);
  
  // Calculate the total effect
  const totalEffect = shapData.outputValue - shapData.baseValue;
  
  // Generate the narrative summary
  const generateSummary = (): string => {
    const direction = totalEffect > 0 ? 'increased' : 'decreased';
    const topFeaturesList = topFeatures.map(feature => {
      const featureDirection = feature.effect > 0 ? 'adding' : 'reducing';
      return `${feature.feature} (${featureDirection} ${formatCurrency(Math.abs(feature.effect))})`;
    }).join(', ');
    
    return `This comparable property ${direction} the estimated value by ${formatCurrency(Math.abs(totalEffect))}, primarily due to ${topFeaturesList}.`;
  };

  // Generate detailed explanation for each feature
  const generateDetailedExplanation = (feature: ShapFeature): string => {
    const direction = feature.effect > 0 ? 'increased' : 'decreased';
    return `${feature.feature}: ${feature.description}. This ${direction} the value by ${formatCurrency(Math.abs(feature.effect))}.`;
  };

  return (
    <Card className={`tf-card ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="bg-accent/10 p-2 rounded-full">
            <MessageSquare className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-base font-medium">
              Value Impact Narrative
            </div>
            
            <div className="p-4 bg-accent/5 rounded-md">
              <p className="mb-2 font-medium">{generateSummary()}</p>
              
              <div className="text-sm space-y-2 mt-4">
                {sortedFeatures.map((feature, index) => (
                  <div key={index} className="pt-2 first:pt-0">
                    <p>{generateDetailedExplanation(feature)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Based on the property at {compProperty.address} compared to the subject property at {subjectProperty?.address}.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NarrativeAgent;