import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ModelsList from '../components/mass-appraisal/ModelsList';
import ModelDetails from '../components/mass-appraisal/ModelDetails';
import PropertyValuation from '../components/mass-appraisal/PropertyValuation';
import QualityControlPanel from '../components/mass-appraisal/QualityControlPanel';
import RatioStudyPanel from '../components/mass-appraisal/RatioStudyPanel';
import DepreciationCalculator from '../components/mass-appraisal/DepreciationCalculator';

const MassAppraisalPage = () => {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  // Fetch sample models when no model is selected
  const { data: sampleModels, isLoading, error } = useQuery({
    queryKey: ['/api/mass-appraisal/samples'],
    enabled: !selectedModelId,
  });
  
  // Fetch specific model details if a model is selected
  const { data: selectedModel } = useQuery({
    queryKey: ['/api/mass-appraisal/models', selectedModelId],
    enabled: !!selectedModelId,
  });

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleBackToList = () => {
    setSelectedModelId(null);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Mass Appraisal System</h1>
      <p className="text-gray-600 mb-6">
        Professional CAMA (Computer Assisted Mass Appraisal) tools for property valuation
        and assessment administration compliant with IAAO standards.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load mass appraisal data. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="models">Valuation Models</TabsTrigger>
          <TabsTrigger value="property">Property Valuation</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="reconciliation">Value Reconciliation</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="ratio">Ratio Studies</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Mass Appraisal Models</CardTitle>
              <CardDescription>
                Manage and view valuation models for different property types and neighborhoods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedModelId ? (
                <ModelDetails 
                  model={selectedModel} 
                  onBack={handleBackToList} 
                />
              ) : (
                <ModelsList 
                  models={sampleModels} 
                  isLoading={isLoading} 
                  onSelectModel={handleModelSelect} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property">
          <PropertyValuation models={sampleModels} />
        </TabsContent>

        <TabsContent value="depreciation">
          <DepreciationCalculator />
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Value Reconciliation</CardTitle>
              <CardDescription>
                Reconcile values from different valuation approaches (Sales Comparison, Cost, Income)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Reconciliation form will be implemented in a separate component */}
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Value Reconciliation feature coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <QualityControlPanel />
        </TabsContent>

        <TabsContent value="ratio">
          <RatioStudyPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MassAppraisalPage;