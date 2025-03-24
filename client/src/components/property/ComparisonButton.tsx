/**
 * ComparisonButton Component
 * 
 * A button that shows the number of properties selected for comparison
 * and allows navigating to the comparison page.
 */
import { useComparison } from '../../context/ComparisonContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '../../components/ui/icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ComparisonButtonProps {
  position?: 'bottom-right' | 'top-right' | 'floating';
  variant?: 'default' | 'outline' | 'secondary';
  showLabel?: boolean;
}

export const ComparisonButton = ({
  position = 'bottom-right',
  variant = 'default',
  showLabel = true,
}: ComparisonButtonProps) => {
  const { 
    selectedProperties, 
    compareSelectedProperties, 
    clearComparison, 
    removeFromComparison 
  } = useComparison();

  if (selectedProperties.length === 0) {
    return null;
  }

  // Position styles
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-40',
    'top-right': 'fixed top-4 right-4 z-40',
    'floating': 'relative', // No fixed positioning
  };

  return (
    <div className={position !== 'floating' ? positionClasses[position] : ''}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={variant} className="group relative">
            <div className="flex items-center">
              <Icons.comparison className="h-4 w-4 mr-2" />
              {showLabel && <span>Compare</span>}
              <Badge 
                variant="secondary" 
                className="ml-2 bg-primary-foreground"
              >
                {selectedProperties.length}
              </Badge>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-4 w-80">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Comparison List</h4>
              <Button variant="ghost" size="sm" onClick={clearComparison}>
                Clear All
              </Button>
            </div>
            
            <div className="divide-y">
              {selectedProperties.map((property) => (
                <div 
                  key={property.id} 
                  className="py-2 flex items-center justify-between"
                >
                  <span className="text-sm truncate max-w-[180px]">
                    {property.address}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFromComparison(property.id)}
                  >
                    <Icons.close className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full mt-2" 
              onClick={compareSelectedProperties}
            >
              Compare Properties
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ComparisonButton;