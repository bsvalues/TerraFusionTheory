import React from 'react';

/**
 * NarrativeAgent Component
 * 
 * Translates SHAP values and comp property differences into natural language
 * explanations that users can easily understand. Creates contextual narratives
 * about why certain properties impact valuations in specific ways.
 */
export const NarrativeAgent = ({
  compProperty,
  subjectProperty,
  shapData,
  adjustment = null,
  className = ''
}) => {
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate an overall narrative based on the most significant adjustments
  const generateNarrative = () => {
    // Use either SHAP data or adjustment data
    const features = adjustment ? adjustment.features : shapData.features;
    const baseValue = adjustment ? subjectProperty.price : shapData.baseValue;
    const outputValue = adjustment ? adjustment.adjusted_price : shapData.outputValue;
    
    // Sort features by absolute effect, taking the top 3 most impactful
    const topFeatures = [...features]
      .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
      .slice(0, 3);
      
    const totalAdjustment = outputValue - baseValue;
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
  const generateDetailedExplanation = (feature) => {
    const isPositive = feature.effect > 0;
    
    // Base explanations for each feature type
    const explanations = {
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
    
    // Use the specific explanation if available, otherwise use the description or a generic one
    if (explanations[feature.feature]) {
      return explanations[feature.feature](feature);
    } else if (feature.description) {
      return feature.description;
    } else {
      return `${feature.feature} results in a ${isPositive ? 'positive' : 'negative'} adjustment of ${formatCurrency(Math.abs(feature.effect))}.`;
    }
  };

  // Use either SHAP data or adjustment data
  const features = adjustment ? adjustment.features : shapData.features;
  const baseValue = adjustment ? subjectProperty.price : shapData.baseValue;
  const outputValue = adjustment ? adjustment.adjusted_price : shapData.outputValue;

  // Sort features by absolute effect for easier reading
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
  const totalAdjustment = outputValue - baseValue;
  
  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-400">Narrative Explanation</h3>
        
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          totalAdjustment > 0 
            ? 'bg-green-500/20 text-green-400' 
            : totalAdjustment < 0 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-gray-500/20 text-gray-400'
        }`}>
          {totalAdjustment > 0 ? '+' : ''}
          {formatCurrency(totalAdjustment)}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm font-medium bg-gray-700/30 p-4 rounded-md">
          {generateNarrative()}
        </div>
        
        <div className="space-y-4">
          {sortedFeatures.map((feature, index) => (
            <div key={index} className="text-sm">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium">{feature.feature}</h4>
                <span className={`font-medium ${
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
              <p className="text-gray-400">
                {generateDetailedExplanation(feature)}
              </p>
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t border-gray-700">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-medium">Final Adjustment</h4>
            <span className={`font-medium ${
              totalAdjustment > 0 
                ? 'text-green-400' 
                : totalAdjustment < 0 
                  ? 'text-red-400' 
                  : 'text-gray-400'
            }`}>
              {totalAdjustment > 0 ? '+' : ''}
              {formatCurrency(totalAdjustment)}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            When applying all adjustments, this comp {totalAdjustment >= 0 ? 'supports' : 'suggests'} 
            a {totalAdjustment >= 0 ? 'higher' : 'lower'} valuation for the subject property.
          </p>
        </div>
      </div>
    </div>
  );
};