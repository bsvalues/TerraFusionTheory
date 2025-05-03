/**
 * NarrativeAgent Component
 * 
 * Translates SHAP values and comp property differences into natural language
 * explanations that users can easily understand. Creates contextual narratives
 * about why certain properties impact valuations in specific ways.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info as InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate an overall narrative based on the most significant adjustments
  const generateNarrative = (): string => {
    // Sort features by absolute effect, taking the top 3 most impactful
    const topFeatures = [...shapData.features]
      .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
      .slice(0, 3);
      
    const totalAdjustment = shapData.outputValue - shapData.baseValue;
    const isPositive = totalAdjustment >= 0;
    
    let narrative = `This comparable property ${isPositive ? 'increases' : 'decreases'} the subject's value assessment by ${formatCurrency(Math.abs(totalAdjustment))}.`;
    
    // Add information about the most significant factors
    if (topFeatures.length > 0) {
      narrative += ` The most significant factors are `;
      
      topFeatures.forEach((feature, index) => {
        const isUp = feature.effect > 0;
        
        if (index > 0) {
          narrative += index === topFeatures.length - 1 ? ' and ' : ', ';
        }
        
        narrative += `${feature.feature.toLowerCase()} (${isUp ? 'adding' : 'reducing'} ${formatCurrency(Math.abs(feature.effect))})`;
      });
      
      narrative += '.';
    }
    
    return narrative;
  };

  // Generate detailed explanations for individual features
  const generateDetailedExplanation = (feature: ShapFeature): string => {
    const isPositive = feature.effect > 0;
    
    // Base explanations for each feature type
    const explanations: Record<string, (f: ShapFeature) => string> = {
      'Location': (f) => {
        if (Math.abs(f.effect) < 1000) return `The location is very similar to the subject property, requiring minimal adjustment.`;
        if (isPositive) return `This property's location is superior to the subject's, resulting in a positive adjustment.`;
        return `This property's location is ${parseFloat(f.value) <= 1 ? 'slightly' : 'significantly'} inferior to the subject's, requiring a ${Math.abs(f.effect) > 3000 ? 'substantial' : 'moderate'} negative adjustment.`;
      },
      
      'Square Footage': (f) => {
        const match = f.value.match(/(\d+,*\d*) sqft vs (\d+,*\d*) sqft/);
        if (!match) return f.description;
        
        const comp = parseInt(match[1].replace(',', ''));
        const subject = parseInt(match[2].replace(',', ''));
        const diff = comp - subject;
        
        if (Math.abs(diff) < 100) return `The size is very similar to the subject property, requiring minimal adjustment.`;
        if (diff > 0) return `This property is ${diff} sqft larger than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} downward adjustment to the subject's value.`;
        return `This property is ${Math.abs(diff)} sqft smaller than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} upward adjustment to the subject's value.`;
      },
      
      'Bedrooms': (f) => {
        const match = f.value.match(/(\d+) vs (\d+)/);
        if (!match) return f.description;
        
        const comp = parseInt(match[1]);
        const subject = parseInt(match[2]);
        const diff = comp - subject;
        
        if (diff === 0) return `Both properties have the same number of bedrooms, requiring no adjustment.`;
        if (diff > 0) return `This property has ${diff} more bedroom${diff > 1 ? 's' : ''} than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} downward adjustment.`;
        return `This property has ${Math.abs(diff)} fewer bedroom${Math.abs(diff) > 1 ? 's' : ''} than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} upward adjustment.`;
      },
      
      'Bathrooms': (f) => {
        const match = f.value.match(/(\d+(\.\d+)?) vs (\d+(\.\d+)?)/);
        if (!match) return f.description;
        
        const comp = parseFloat(match[1]);
        const subject = parseFloat(match[3]);
        const diff = comp - subject;
        
        if (Math.abs(diff) < 0.1) return `Both properties have the same number of bathrooms, requiring no adjustment.`;
        if (diff > 0) return `This property has ${diff} more bathroom${diff > 1 ? 's' : ''} than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} downward adjustment.`;
        return `This property has ${Math.abs(diff)} fewer bathroom${Math.abs(diff) > 1 ? 's' : ''} than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} upward adjustment.`;
      },
      
      'Year Built': (f) => {
        const match = f.value.match(/(\d+) vs (\d+)/);
        if (!match) return f.description;
        
        const comp = parseInt(match[1]);
        const subject = parseInt(match[2]);
        const diff = comp - subject;
        const yearWord = Math.abs(diff) === 1 ? 'year' : 'years';
        
        if (diff === 0) return `Both properties were built in the same year, requiring no adjustment.`;
        if (diff > 0) return `This property is ${diff} ${yearWord} newer than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} downward adjustment.`;
        return `This property is ${Math.abs(diff)} ${yearWord} older than the subject, resulting in a ${formatCurrency(Math.abs(f.effect))} upward adjustment.`;
      },
      
      'Sale Date': (f) => {
        if (Math.abs(f.effect) < 1000) return `The sale date is recent and requires minimal time adjustment.`;
        if (isPositive) return `Due to improving market conditions since this sale, a ${formatCurrency(Math.abs(f.effect))} upward adjustment is applied.`;
        return `Due to declining market conditions since this sale, a ${formatCurrency(Math.abs(f.effect))} downward adjustment is applied.`;
      },
      
      'Other Adjustments': (f) => {
        if (Math.abs(f.effect) < 1000) return `No significant additional adjustments are needed.`;
        if (isPositive) return `Additional factors like condition, amenities, and lot size require a ${formatCurrency(Math.abs(f.effect))} upward adjustment.`;
        return `Additional factors like condition, amenities, and lot size require a ${formatCurrency(Math.abs(f.effect))} downward adjustment.`;
      }
    };
    
    // Use the specific explanation if available, otherwise use a generic one
    return explanations[feature.feature] 
      ? explanations[feature.feature](feature) 
      : `${feature.feature} results in a ${isPositive ? 'positive' : 'negative'} adjustment of ${formatCurrency(Math.abs(feature.effect))}.`;
  };

  // Sort features by absolute effect for easier reading
  const sortedFeatures = [...shapData.features].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
  const totalAdjustment = shapData.outputValue - shapData.baseValue;
  
  return (
    <Card className={`tf-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <span>Narrative Explanation</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Plain-language explanation of why this comparable affects valuation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          
          <Badge className={`
            text-white 
            ${totalAdjustment > 0 ? 'bg-green-500' : totalAdjustment < 0 ? 'bg-red-500' : 'bg-gray-500'}
          `}>
            {totalAdjustment > 0 ? '+' : ''}
            {formatCurrency(totalAdjustment)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm font-medium rounded-md bg-muted/40 p-3">
            {generateNarrative()}
          </div>
          
          <div className="space-y-3">
            {sortedFeatures.map((feature, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold">{feature.feature}</div>
                  <div className={`
                    font-medium
                    ${feature.effect > 0 ? 'text-green-500' : feature.effect < 0 ? 'text-red-500' : 'text-gray-500'}
                  `}>
                    {feature.effect > 0 ? '+' : ''}
                    {formatCurrency(feature.effect)}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {generateDetailedExplanation(feature)}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-sm pt-2 border-t">
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold">Final Adjustment</div>
              <div className={`
                font-semibold
                ${totalAdjustment > 0 ? 'text-green-500' : totalAdjustment < 0 ? 'text-red-500' : 'text-gray-500'}
              `}>
                {totalAdjustment > 0 ? '+' : ''}
                {formatCurrency(totalAdjustment)}
              </div>
            </div>
            <p className="text-muted-foreground">
              When applying all adjustments, this comp {totalAdjustment >= 0 ? 'supports' : 'suggests'} 
              a {totalAdjustment >= 0 ? 'higher' : 'lower'} valuation for the subject property.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NarrativeAgent;