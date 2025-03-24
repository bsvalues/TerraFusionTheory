import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface Model {
  id: string;
  name: string;
  type: string;
  propertyType: string;
  neighborhood?: string;
  rSquared: number;
  created: string;
  updated?: string;
}

interface ModelsListProps {
  models?: Model[];
  isLoading: boolean;
  onSelectModel: (modelId: string) => void;
}

const ModelsList = ({ models = [], isLoading, onSelectModel }: ModelsListProps) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredModels = models.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(filter.toLowerCase()) ||
      model.neighborhood?.toLowerCase().includes(filter.toLowerCase()) ||
      model.propertyType.toLowerCase().includes(filter.toLowerCase());
    
    const matchesType = typeFilter === 'all' || model.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search models..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select 
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="additive">Additive Models</SelectItem>
              <SelectItem value="multiplicative">Multiplicative Models</SelectItem>
              <SelectItem value="hybrid">Hybrid Models</SelectItem>
              <SelectItem value="nonlinear">Nonlinear Models</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">Create New Model</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No models found matching your criteria</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property Type</TableHead>
                <TableHead>Neighborhood</TableHead>
                <TableHead>R²</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      model.type === 'additive' ? 'default' :
                      model.type === 'multiplicative' ? 'secondary' :
                      model.type === 'hybrid' ? 'outline' : 'destructive'
                    }>
                      {model.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{model.propertyType}</TableCell>
                  <TableCell>{model.neighborhood || '—'}</TableCell>
                  <TableCell>{model.rSquared.toFixed(3)}</TableCell>
                  <TableCell>{new Date(model.created).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectModel(model.id)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ModelsList;