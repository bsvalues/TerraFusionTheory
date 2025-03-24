import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, BarChart3, History, Home, ChevronsUpDown, Calculator } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '../../lib/utils';

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

interface Model {
  id: string;
  name: string;
  description: string;
  type: 'additive' | 'multiplicative' | 'hybrid' | 'nonlinear';
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
  model: Model | undefined;
  onBack: () => void;
}

const ModelDetails = ({ model, onBack }: ModelDetailsProps) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!model) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Models
        </Button>
        <div className="space-y-2">
          <Skeleton className="h-8 w-[350px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    );
  }

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

  // Helper function for transformation display
  const getTransformationDisplay = (transformation: string) => {
    switch (transformation) {
      case 'none':
        return 'None';
      case 'log':
        return 'Log';
      case 'square':
        return 'Square';
      case 'squareRoot':
        return 'Square Root';
      case 'inverse':
        return 'Inverse';
      case 'standardize':
        return 'Standardize';
      default:
        return transformation;
    }
  };

  // Helper for variable type display
  const getVariableTypeDisplay = (type: string) => {
    switch (type) {
      case 'continuous':
        return { label: 'Continuous', color: 'bg-green-100 text-green-800' };
      case 'categorical':
        return { label: 'Categorical', color: 'bg-orange-100 text-orange-800' };
      case 'spatial':
        return { label: 'Spatial', color: 'bg-indigo-100 text-indigo-800' };
      case 'indicator':
        return { label: 'Indicator', color: 'bg-pink-100 text-pink-800' };
      case 'transformed':
        return { label: 'Transformed', color: 'bg-cyan-100 text-cyan-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const modelType = getModelTypeDisplay(model.type);

  // Format model equation string
  const formatModelEquation = () => {
    if (model.type === 'additive') {
      return `${model.dependentVariable} = ${model.intercept.toFixed(2)} + ${model.independentVariables
        .map((v) => `${v.coefficient?.toFixed(4)} × ${v.name}`)
        .join(' + ')}`;
    } else if (model.type === 'multiplicative') {
      return `ln(${model.dependentVariable}) = ${model.intercept.toFixed(2)} + ${model.independentVariables
        .map((v) => `${v.coefficient?.toFixed(4)} × ${v.name}`)
        .join(' + ')}`;
    } else {
      return `${model.dependentVariable} = f(${model.independentVariables.map((v) => v.name).join(', ')})`;
    }
  };

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Models
      </Button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{model.name}</h2>
          <div className="flex items-center mt-1 space-x-2">
            <Badge variant="outline" className={modelType.color}>{modelType.label}</Badge>
            <span className="text-sm text-muted-foreground">Created: {formatDate(new Date(model.created))}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            Calibrate
          </Button>
          <Button>
            <Calculator className="mr-2 h-4 w-4" />
            Value Property
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">R²</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(model.rSquared * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Adjusted: {(model.adjustedRSquared * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MAPE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{model.meanAbsolutePercentageError.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Mean Absolute Percentage Error</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">COD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{model.coefficientOfDispersion.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Coefficient of Dispersion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="variables">
            <ChevronsUpDown className="mr-2 h-4 w-4" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="neighborhoods">
            <Home className="mr-2 h-4 w-4" />
            Neighborhoods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{model.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Equation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-md overflow-x-auto">
                  <code className="text-sm font-mono">{formatModelEquation()}</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Coefficient of Dispersion (COD)</h4>
                    <p className="text-lg font-semibold">{model.coefficientOfDispersion.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Measures the average percentage deviation from the median ratio
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Price Related Differential (PRD)</h4>
                    <p className="text-lg font-semibold">{model.priceRelatedDifferential.toFixed(3)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Indicates if higher or lower value properties are being assessed differently
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Price Related Bias (PRB)</h4>
                    <p className="text-lg font-semibold">{model.priceRelatedBias.toFixed(3)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Alternative measure of price-related bias with improved statistical properties
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">MAPE</h4>
                    <p className="text-lg font-semibold">{model.meanAbsolutePercentageError.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mean Absolute Percentage Error between predictions and actual values
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle>Model Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transformation</TableHead>
                    <TableHead>Coefficient</TableHead>
                    <TableHead>t-Value</TableHead>
                    <TableHead>p-Value</TableHead>
                    <TableHead>Std Error</TableHead>
                    <TableHead>Importance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.independentVariables.map((variable) => {
                    const variableType = getVariableTypeDisplay(variable.type);
                    return (
                      <TableRow key={variable.name}>
                        <TableCell className="font-medium">{variable.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={variableType.color}>
                            {variableType.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTransformationDisplay(variable.transformation)}</TableCell>
                        <TableCell>
                          {variable.coefficient !== undefined ? variable.coefficient.toFixed(4) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {variable.tValue !== undefined ? variable.tValue.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {variable.pValue !== undefined ? variable.pValue.toFixed(4) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {variable.standardError !== undefined ? variable.standardError.toFixed(4) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {variable.importance !== undefined ? (variable.importance * 100).toFixed(1) + '%' : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-medium">Intercept</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{model.intercept.toFixed(4)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neighborhoods">
          <Card>
            <CardHeader>
              <CardTitle>Neighborhood Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {model.neighborhoodCodes && model.neighborhoodCodes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {model.neighborhoodCodes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific neighborhoods assigned - model applies to all areas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelDetails;