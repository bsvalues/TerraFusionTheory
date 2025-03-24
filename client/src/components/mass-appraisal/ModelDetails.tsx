import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Edit, Download, BarChart2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

// Type for model variable
interface ModelVariable {
  name: string;
  type: string;
  transformation: string;
  coefficient?: number;
  tValue?: number;
  pValue?: number;
  standardError?: number;
  importance?: number;
}

// Type for model details
interface ModelDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  dependentVariable: string;
  independentVariables: ModelVariable[];
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  coefficientOfDispersion: number;
  priceRelatedDifferential: number;
  priceRelatedBias: number;
  meanAbsolutePercentageError: number;
  created: string;
  lastCalibrated?: string;
  propertyClass: string;
  neighborhoodCodes?: string[];
}

interface ModelDetailsProps {
  model?: ModelDetail;
  onBack: () => void;
}

const ModelDetails = ({ model, onBack }: ModelDetailsProps) => {
  if (!model) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Models
        </Button>
        <h2 className="text-2xl font-bold">{model.name}</h2>
        <Badge>{model.type}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Model Information</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="font-medium text-muted-foreground">Property Class</dt>
              <dd>{model.propertyClass}</dd>
              
              <dt className="font-medium text-muted-foreground">Description</dt>
              <dd>{model.description}</dd>
              
              <dt className="font-medium text-muted-foreground">Dependent Variable</dt>
              <dd>{model.dependentVariable}</dd>
              
              <dt className="font-medium text-muted-foreground">Created</dt>
              <dd>{new Date(model.created).toLocaleDateString()}</dd>
              
              <dt className="font-medium text-muted-foreground">Last Calibrated</dt>
              <dd>{model.lastCalibrated ? new Date(model.lastCalibrated).toLocaleDateString() : 'Never'}</dd>
              
              <dt className="font-medium text-muted-foreground">Neighborhoods</dt>
              <dd>{model.neighborhoodCodes?.join(', ') || 'All'}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Statistical Metrics</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="font-medium text-muted-foreground">R²</dt>
              <dd>{model.rSquared.toFixed(4)}</dd>
              
              <dt className="font-medium text-muted-foreground">Adjusted R²</dt>
              <dd>{model.adjustedRSquared.toFixed(4)}</dd>
              
              <dt className="font-medium text-muted-foreground">Coefficient of Dispersion</dt>
              <dd>{model.coefficientOfDispersion.toFixed(2)}</dd>
              
              <dt className="font-medium text-muted-foreground">PRD</dt>
              <dd>{model.priceRelatedDifferential.toFixed(3)}</dd>
              
              <dt className="font-medium text-muted-foreground">PRB</dt>
              <dd>{model.priceRelatedBias.toFixed(3)}</dd>
              
              <dt className="font-medium text-muted-foreground">MAPE</dt>
              <dd>{(model.meanAbsolutePercentageError * 100).toFixed(2)}%</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Variables and Coefficients</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                <BarChart2 className="h-4 w-4 mr-2" />
                Diagnostics
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Model
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Variable</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Transformation</th>
                  <th className="text-right py-3 px-4">Coefficient</th>
                  <th className="text-right py-3 px-4">t-Value</th>
                  <th className="text-right py-3 px-4">p-Value</th>
                  <th className="text-right py-3 px-4">Std Error</th>
                  <th className="text-right py-3 px-4">Importance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-accent/30">
                  <td className="py-3 px-4 font-medium">Intercept</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4 text-right">{model.intercept.toFixed(4)}</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">-</td>
                </tr>
                {model.independentVariables.map((variable, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4 font-medium">{variable.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{variable.type}</Badge>
                    </td>
                    <td className="py-3 px-4">{variable.transformation}</td>
                    <td className="py-3 px-4 text-right">{variable.coefficient?.toFixed(4) || '-'}</td>
                    <td className="py-3 px-4 text-right">{variable.tValue?.toFixed(2) || '-'}</td>
                    <td className="py-3 px-4 text-right">{variable.pValue ? variable.pValue.toFixed(4) : '-'}</td>
                    <td className="py-3 px-4 text-right">{variable.standardError?.toFixed(4) || '-'}</td>
                    <td className="py-3 px-4 text-right">{variable.importance ? `${(variable.importance * 100).toFixed(1)}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelDetails;