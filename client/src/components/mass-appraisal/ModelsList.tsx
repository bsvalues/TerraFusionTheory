import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Calculator, ChevronRight, Info } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface Model {
  id: string;
  name: string;
  description: string;
  type: 'additive' | 'multiplicative' | 'hybrid' | 'nonlinear';
  propertyClass: string;
  rSquared: number;
  adjustedRSquared: number;
  meanAbsolutePercentageError: number;
  created: string;
  lastCalibrated?: string;
}

interface ModelsListProps {
  models: Model[] | undefined;
  isLoading: boolean;
  onSelectModel: (modelId: string) => void;
}

const ModelsList = ({ models, isLoading, onSelectModel }: ModelsListProps) => {
  // Helper for model type display
  const getModelTypeDisplay = (type: string) => {
    switch (type) {
      case 'additive':
        return { label: 'Additive', color: 'bg-blue-100 text-blue-800' };
      case 'multiplicative':
        return { label: 'Multiplicative', color: 'bg-purple-100 text-purple-800' };
      case 'hybrid':
        return { label: 'Hybrid', color: 'bg-amber-100 text-amber-800' };
      case 'nonlinear':
        return { label: 'Nonlinear', color: 'bg-emerald-100 text-emerald-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[350px]" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No valuation models found</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model Name</TableHead>
            <TableHead>Property Type</TableHead>
            <TableHead>Model Type</TableHead>
            <TableHead>R²</TableHead>
            <TableHead>MAPE</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => {
            const modelType = getModelTypeDisplay(model.type);
            
            return (
              <TableRow key={model.id}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>{model.propertyClass}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={modelType.color}>
                    {modelType.label}
                  </Badge>
                </TableCell>
                <TableCell>{(model.rSquared * 100).toFixed(1)}%</TableCell>
                <TableCell>{model.meanAbsolutePercentageError.toFixed(1)}%</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <CalendarClock size={14} />
                    <span>
                      {formatDate(new Date(model.created))}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSelectModel(model.id)}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        // Navigate directly to property valuation with this model
                        // For now, just view details
                        onSelectModel(model.id);
                      }}
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      Use Model
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ModelsList;