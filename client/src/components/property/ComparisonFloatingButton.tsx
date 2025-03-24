/**
 * Comparison Floating Button
 * 
 * A floating button that shows the number of properties selected for comparison
 * and allows quick navigation to the comparison page.
 */

import React from 'react';
import { useComparison } from '../../context/ComparisonContext';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

export const ComparisonFloatingButton: React.FC = () => {
  const { selectedProperties, compareSelectedProperties } = useComparison();
  
  // Don't render if no properties are selected
  if (selectedProperties.length === 0) return null;
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button 
        size="lg"
        onClick={compareSelectedProperties}
        className="shadow-lg rounded-full flex items-center gap-2 bg-primary-foreground text-primary hover:bg-primary hover:text-primary-foreground"
      >
        <TrendingUp className="h-4 w-4" />
        <span>Compare Properties ({selectedProperties.length})</span>
      </Button>
    </div>
  );
};

export default ComparisonFloatingButton;