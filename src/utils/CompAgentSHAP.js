/**
 * CompAgentSHAP - SHAP Value Calculator for Comparable Properties
 * 
 * This module calculates SHAP values based on the differences between
 * a comparable property and a subject property. 
 * 
 * In a production environment, this would be replaced with actual SHAP values from a backend API.
 */

/**
 * Calculate SHAP values based on property differences
 */
export function calculateShapValues(compProperty, subjectProperty) {
  // Base value is the subject property's price
  const baseValue = subjectProperty.price;
  
  // Initialize features array
  const features = [];
  
  // Calculate location/distance impact
  const distanceEffect = calculateDistanceEffect(compProperty.distance);
  features.push({
    feature: 'Location',
    effect: distanceEffect,
    value: `${compProperty.distance.toFixed(1)} miles`,
    description: `This comp is ${compProperty.distance.toFixed(1)} miles from the subject property`
  });
  
  // Calculate square footage impact
  const sqftDiff = compProperty.squareFeet - subjectProperty.squareFeet;
  const sqftEffect = calculateSqftEffect(sqftDiff);
  features.push({
    feature: 'Square Footage',
    effect: sqftEffect,
    value: `${compProperty.squareFeet.toLocaleString()} sqft vs ${subjectProperty.squareFeet.toLocaleString()} sqft`,
    description: `The comp is ${Math.abs(sqftDiff).toLocaleString()} sqft ${sqftDiff > 0 ? 'larger' : 'smaller'}, ${sqftDiff < 0 ? 'requiring upward adjustment' : 'requiring downward adjustment'}`
  });
  
  // Calculate bedrooms impact
  const bedDiff = compProperty.bedrooms - subjectProperty.bedrooms;
  const bedEffect = calculateBedroomEffect(bedDiff);
  features.push({
    feature: 'Bedrooms',
    effect: bedEffect,
    value: `${compProperty.bedrooms} vs ${subjectProperty.bedrooms}`,
    description: bedDiff === 0 
      ? 'Both properties have the same number of bedrooms' 
      : `The comp has ${Math.abs(bedDiff)} ${Math.abs(bedDiff) === 1 ? 'bedroom' : 'bedrooms'} ${bedDiff > 0 ? 'more' : 'fewer'}`
  });
  
  // Calculate bathrooms impact
  const bathDiff = compProperty.bathrooms - subjectProperty.bathrooms;
  const bathEffect = calculateBathroomEffect(bathDiff);
  features.push({
    feature: 'Bathrooms',
    effect: bathEffect,
    value: `${compProperty.bathrooms} vs ${subjectProperty.bathrooms}`,
    description: bathDiff === 0 
      ? 'Both properties have the same number of bathrooms' 
      : `The comp has ${Math.abs(bathDiff)} ${Math.abs(bathDiff) === 1 ? 'bathroom' : 'bathrooms'} ${bathDiff > 0 ? 'more' : 'fewer'}`
  });
  
  // Calculate year built impact
  const yearDiff = parseInt(compProperty.yearBuilt) - parseInt(subjectProperty.yearBuilt);
  const yearEffect = calculateYearEffect(yearDiff);
  features.push({
    feature: 'Year Built',
    effect: yearEffect,
    value: `${compProperty.yearBuilt} vs ${subjectProperty.yearBuilt}`,
    description: `The comp is ${Math.abs(yearDiff)} ${Math.abs(yearDiff) === 1 ? 'year' : 'years'} ${yearDiff > 0 ? 'newer' : 'older'}`
  });
  
  // Calculate sale date impact (market conditions)
  const saleEffect = calculateSaleDateEffect(compProperty.saleDate, subjectProperty.saleDate);
  
  // Convert dates to readable format
  const compDate = new Date(compProperty.saleDate);
  const subjDate = new Date(subjectProperty.saleDate);
  
  // Calculate months between dates
  const monthsBetween = (subjDate.getFullYear() - compDate.getFullYear()) * 12 + subjDate.getMonth() - compDate.getMonth();
  
  features.push({
    feature: 'Sale Date',
    effect: saleEffect,
    value: `${Math.abs(monthsBetween)} months ${monthsBetween > 0 ? 'ago' : 'newer'}`,
    description: `Market ${monthsBetween > 0 ? 'appreciation' : 'depreciation'} since sale date of the comp`
  });

  // Add any special features or adjustments specific to the comp
  if (compProperty.adjustedPrice) {
    const otherEffect = compProperty.adjustedPrice - compProperty.price;
    features.push({
      feature: 'Other Adjustments',
      effect: otherEffect,
      value: `${compProperty.adjustedPrice ? `Adjusted: ${(compProperty.adjustedPrice).toLocaleString()}` : 'None'}`,
      description: 'Other adjustments for condition, amenities, lot size, etc.'
    });
  }
  
  // Calculate total effect and output value
  const totalEffect = features.reduce((sum, feature) => sum + feature.effect, 0);
  const outputValue = baseValue + totalEffect;
  
  return {
    baseValue,
    outputValue,
    features
  };
}

// Helper functions to calculate feature effects

function calculateDistanceEffect(distance) {
  if (distance <= 0.5) return 0; // Very close, no adjustment needed
  if (distance <= 1) return -1200; // Close
  if (distance <= 2) return -2500; // Moderate distance
  return -4000; // Far away
}

function calculateSqftEffect(sqftDiff) {
  // Approximate value of $100 per sqft difference
  return -sqftDiff * 100;
}

function calculateBedroomEffect(bedDiff) {
  // Value adjustment per bedroom
  return -bedDiff * 5000;
}

function calculateBathroomEffect(bathDiff) {
  // Value adjustment per bathroom
  return -bathDiff * 7500;
}

function calculateYearEffect(yearDiff) {
  // Newer homes are worth more, approximately $500 per year
  return -yearDiff * 500;
}

function calculateSaleDateEffect(compDate, subjectDate) {
  // Convert strings to Date objects
  const comp = new Date(compDate);
  const subject = new Date(subjectDate);
  
  // Calculate months between sales
  const monthsBetween = (subject.getFullYear() - comp.getFullYear()) * 12 + subject.getMonth() - comp.getMonth();
  
  // Assume market appreciation of 0.5% per month
  const marketEffect = monthsBetween * 0.005;
  
  // Apply market effect to the average property value (approximate)
  return marketEffect * 400000 * -1; // Negative because we adjust the comp
}