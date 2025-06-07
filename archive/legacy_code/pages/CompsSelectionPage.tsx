/**
 * Comps Selection Page
 * 
 * This page allows users to select and manage comparable properties
 * for property valuation with AI-assisted suggestions.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import Layout from '@/components/layout/Layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Home, 
  Search, 
  Save, 
  Map, 
  Star, 
  FileCheck, 
  FileQuestion, 
  Bot, 
  AlertTriangle, 
  Info,
  PlusCircle,
  MinusCircle,
  ListFilter,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define types for comparable properties
interface ComparableProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  salePrice: number;
  saleDate: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  distance: number; // in miles
  pricePerSqFt: number;
  propertyType: string;
  isAiSuggested?: boolean;
  similarityScore?: number;
  keyFeatures?: string[];
  shapValues?: Record<string, number>;
  selected?: boolean;
}

// Define types for subject property
interface SubjectProperty {
  id: string;
  parcelId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  propertyType: string;
  latitude: number;
  longitude: number;
}

// Sample data for demonstration (in a real implementation, this would come from an API)
const sampleSubjectProperty: SubjectProperty = {
  id: "prop-123",
  parcelId: "12345-ABC",
  address: "123 Main Street",
  city: "Anytown",
  state: "CA",
  zipCode: "90210",
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 2000,
  yearBuilt: 2005,
  propertyType: "Single Family",
  latitude: 34.1031,
  longitude: -118.4179
};

const sampleComparableProperties: ComparableProperty[] = [
  {
    id: "comp-1",
    address: "456 Oak Avenue",
    city: "Anytown",
    state: "CA",
    zipCode: "90210",
    salePrice: 550000,
    saleDate: "2025-02-15",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1950,
    yearBuilt: 2003,
    distance: 0.5,
    pricePerSqFt: 282,
    propertyType: "Single Family",
    isAiSuggested: true,
    similarityScore: 92,
    keyFeatures: ["Similar size", "Same neighborhood", "Similar age"],
    shapValues: { "Location": 0.42, "Size": 0.38, "Condition": 0.2 },
    selected: true
  },
  {
    id: "comp-2",
    address: "789 Pine Lane",
    city: "Anytown",
    state: "CA",
    zipCode: "90210",
    salePrice: 565000,
    saleDate: "2025-01-20",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2100,
    yearBuilt: 2007,
    distance: 0.7,
    pricePerSqFt: 269,
    propertyType: "Single Family",
    isAiSuggested: true,
    similarityScore: 89,
    keyFeatures: ["Newer construction", "Extra half bath", "Slightly larger"],
    shapValues: { "Location": 0.39, "Size": 0.35, "Age": 0.26 },
    selected: true
  },
  {
    id: "comp-3",
    address: "321 Maple Drive",
    city: "Anytown",
    state: "CA",
    zipCode: "90210",
    salePrice: 535000,
    saleDate: "2025-03-05",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1900,
    yearBuilt: 2002,
    distance: 0.4,
    pricePerSqFt: 282,
    propertyType: "Single Family",
    isAiSuggested: true,
    similarityScore: 87,
    keyFeatures: ["Very recent sale", "Close proximity", "Similar layout"],
    shapValues: { "Location": 0.45, "Recency": 0.35, "Size": 0.2 },
    selected: true
  },
  {
    id: "comp-4",
    address: "567 Elm Street",
    city: "Anytown",
    state: "CA",
    zipCode: "90211",
    salePrice: 525000,
    saleDate: "2025-01-10",
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1850,
    yearBuilt: 2000,
    distance: 1.2,
    pricePerSqFt: 284,
    propertyType: "Single Family",
    isAiSuggested: false,
    similarityScore: 78,
    selected: false
  },
  {
    id: "comp-5",
    address: "890 Cedar Court",
    city: "Anytown",
    state: "CA",
    zipCode: "90211",
    salePrice: 590000,
    saleDate: "2024-12-15",
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2300,
    yearBuilt: 2010,
    distance: 1.5,
    pricePerSqFt: 257,
    propertyType: "Single Family",
    isAiSuggested: false,
    similarityScore: 72,
    selected: false
  }
];

const CompsSelectionPage = () => {
  // Get the parcel ID from the URL
  const [, params] = useRoute<{ parcelId: string }>('/comps/:parcelId');
  const parcelId = params?.parcelId || '';
  
  const [subjectProperty, setSubjectProperty] = useState<SubjectProperty>(sampleSubjectProperty);
  const [comparables, setComparables] = useState<ComparableProperty[]>(sampleComparableProperties);
  const [selectedComps, setSelectedComps] = useState<ComparableProperty[]>(
    sampleComparableProperties.filter(comp => comp.selected)
  );
  const [activeTab, setActiveTab] = useState('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('similarityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentJustificationComp, setCurrentJustificationComp] = useState<ComparableProperty | null>(null);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Toggle comp selection
  const toggleCompSelection = (compId: string) => {
    const updatedComparables = comparables.map(comp => {
      if (comp.id === compId) {
        const newSelected = !comp.selected;
        
        return {
          ...comp,
          selected: newSelected
        };
      }
      return comp;
    });
    
    setComparables(updatedComparables);
    setSelectedComps(updatedComparables.filter(comp => comp.selected));
  };
  
  // Show SHAP justification modal
  const showJustification = (comp: ComparableProperty) => {
    setCurrentJustificationComp(comp);
  };
  
  // Sort comparables
  const sortComparables = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Get sorted and filtered comparables
  const getFilteredComparables = () => {
    let filtered = [...comparables];
    
    // Apply tab filter
    if (activeTab === 'suggested') {
      filtered = filtered.filter(comp => comp.isAiSuggested);
    } else if (activeTab === 'selected') {
      filtered = filtered.filter(comp => comp.selected);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.address.toLowerCase().includes(query) ||
        comp.city.toLowerCase().includes(query) ||
        comp.zipCode.includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof ComparableProperty];
      let bValue: any = b[sortField as keyof ComparableProperty];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue === bValue) return 0;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };
  
  const filteredComparables = getFilteredComparables();
  
  return (
    <Layout 
      title="Comparable Properties" 
      subtitle="Select and manage comparable properties for valuation"
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Subject Property Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Home className="mr-2 h-5 w-5 text-primary" />
              Subject Property
            </CardTitle>
            <CardDescription>
              The property being valued using comparable sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm">{subjectProperty.address}</p>
                <p className="text-sm">{subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Characteristics</p>
                <p className="text-sm">{subjectProperty.bedrooms} bed, {subjectProperty.bathrooms} bath</p>
                <p className="text-sm">{subjectProperty.squareFeet.toLocaleString()} sq ft • Built {subjectProperty.yearBuilt}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Property Type</p>
                <p className="text-sm">{subjectProperty.propertyType}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Parcel ID</p>
                <p className="text-sm">{subjectProperty.parcelId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Comparable Properties Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-semibold">Comparable Properties</h2>
              <p className="text-sm text-muted-foreground">Select properties for sales comparison approach</p>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <div className="relative w-[250px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Map className="h-4 w-4 mr-1" />
                Map View
              </Button>
              <Button variant="default" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save Selection
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Comps</TabsTrigger>
                <TabsTrigger value="suggested">AI Suggested</TabsTrigger>
                <TabsTrigger value="selected">Selected ({selectedComps.length})</TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground hidden md:block">
                {filteredComparables.length} properties shown
              </div>
            </div>
            
            <Card className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortComparables('address')}>
                        Address
                        {sortField === 'address' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortComparables('salePrice')}>
                        Sale Price
                        {sortField === 'salePrice' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortComparables('saleDate')}>
                        Sale Date
                        {sortField === 'saleDate' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortComparables('distance')}>
                        Distance
                        {sortField === 'distance' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortComparables('similarityScore')}>
                        Similarity
                        {sortField === 'similarityScore' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComparables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No comparable properties found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComparables.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell>
                          <Checkbox 
                            checked={comp.selected} 
                            onCheckedChange={() => toggleCompSelection(comp.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium flex items-start">
                            {comp.address}
                            {comp.isAiSuggested && (
                              <Badge variant="secondary" className="ml-2 font-normal text-xs flex-shrink-0">
                                <Bot className="mr-1 h-3 w-3" />
                                AI Suggestion
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {comp.city}, {comp.state} {comp.zipCode}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(comp.salePrice)}</TableCell>
                        <TableCell>{formatDate(comp.saleDate)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {comp.bedrooms} bed, {comp.bathrooms} bath
                          </div>
                          <div className="text-sm">
                            {comp.squareFeet.toLocaleString()} sq ft • {formatCurrency(comp.pricePerSqFt)}/sq ft
                          </div>
                        </TableCell>
                        <TableCell>{comp.distance.toFixed(1)} mi</TableCell>
                        <TableCell>
                          {comp.similarityScore ? (
                            <div className="flex items-center">
                              <div 
                                className={`w-12 h-2 rounded-full mr-2 ${
                                  comp.similarityScore >= 90 ? 'bg-green-500' :
                                  comp.similarityScore >= 80 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                              >
                                <div 
                                  className="h-full bg-primary rounded-full" 
                                  style={{ width: `${comp.similarityScore}%` }}
                                />
                              </div>
                              <span>{comp.similarityScore}%</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {comp.isAiSuggested && comp.shapValues && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => showJustification(comp)}
                            >
                              <FileQuestion className="h-4 w-4 mr-1" />
                              Why?
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </Tabs>
        </div>
        
        {/* Selection Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileCheck className="mr-2 h-5 w-5 text-primary" />
              Selection Summary
            </CardTitle>
            <CardDescription>
              Summary of selected comparable properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Selected Properties</p>
                  <p className="text-3xl font-bold">{selectedComps.length}</p>
                </div>
                
                <div className="space-y-1 mt-4 md:mt-0">
                  <p className="text-sm font-medium">Average Sale Price</p>
                  <p className="text-3xl font-bold">
                    {selectedComps.length > 0 
                      ? formatCurrency(selectedComps.reduce((sum, comp) => sum + comp.salePrice, 0) / selectedComps.length)
                      : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-1 mt-4 md:mt-0">
                  <p className="text-sm font-medium">Average Price/Sq Ft</p>
                  <p className="text-3xl font-bold">
                    {selectedComps.length > 0 
                      ? formatCurrency(selectedComps.reduce((sum, comp) => sum + comp.pricePerSqFt, 0) / selectedComps.length)
                      : 'N/A'}
                  </p>
                </div>
                
                <Button className="mt-4 md:mt-0">
                  Proceed to Adjustments
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Justification Modal */}
      <Dialog open={!!currentJustificationComp} onOpenChange={(open) => !open && setCurrentJustificationComp(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Why This Comparable?</DialogTitle>
            <DialogDescription>
              AI-driven justification for suggesting this comparable property
            </DialogDescription>
          </DialogHeader>
          
          {currentJustificationComp && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="font-medium mb-1">{currentJustificationComp.address}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentJustificationComp.city}, {currentJustificationComp.state} {currentJustificationComp.zipCode}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Similarity Factors</h4>
                  <div className="space-y-2">
                    {currentJustificationComp.shapValues && Object.entries(currentJustificationComp.shapValues)
                      .sort(([, a], [, b]) => b - a)
                      .map(([factor, value]) => (
                        <div key={factor} className="flex items-center justify-between">
                          <span className="text-sm">{factor}</span>
                          <div className="flex items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${Math.abs(value * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{(value * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {currentJustificationComp.keyFeatures && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notable Features</h4>
                    <ul className="space-y-1">
                      {currentJustificationComp.keyFeatures.map((feature, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Alert variant="outline" className="bg-muted/50">
                  <Info className="h-4 w-4" />
                  <AlertTitle>AI Insight</AlertTitle>
                  <AlertDescription className="text-sm">
                    This property was selected based on {currentJustificationComp.similarityScore}% similarity to your subject property,
                    with emphasis on location, size, and property characteristics. The sale date of{' '}
                    {formatDate(currentJustificationComp.saleDate)} is recent enough to provide relevant market data.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCurrentJustificationComp(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CompsSelectionPage;