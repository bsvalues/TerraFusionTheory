/**
 * Neighborhood Trends Grid Component
 * 
 * This component displays a grid of neighborhood trend cards with animated tooltips
 * showing market indicators and trends.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NeighborhoodTrendCard from './NeighborhoodTrendCard';
import { Search, RefreshCw, MapPin } from 'lucide-react';
import { useNavigate } from 'wouter';

// Sample data interface matching the NeighborhoodMetrics
interface NeighborhoodTrendData {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  priceChange: number | null;
  pricePerSqFt: number | null;
  daysOnMarket: number | null;
  inventoryChange: number | null;
  salesVolume: number | null;
  salesVolumeChange: number | null;
  medianHomeValue: number | null;
  timeframe?: string;
  updatedAt: string;
}

interface NeighborhoodTrendsGridProps {
  className?: string;
  initialNeighborhoods?: NeighborhoodTrendData[];
}

const NeighborhoodTrendsGrid: React.FC<NeighborhoodTrendsGridProps> = ({
  className = '',
  initialNeighborhoods = []
}) => {
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodTrendData[]>(initialNeighborhoods);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<NeighborhoodTrendData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('price-desc');
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we already have neighborhoods from props, use those
    if (initialNeighborhoods.length > 0) {
      setNeighborhoods(initialNeighborhoods);
      setFilteredNeighborhoods(applySorting(initialNeighborhoods, sortOrder));
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch neighborhoods from the API
    const fetchNeighborhoods = async () => {
      setLoading(true);
      try {
        // Simulate API call
        // In a real application, this would be a fetch call to the neighborhood API
        // For now, we'll use the sample data
        setTimeout(() => {
          setNeighborhoods(sampleNeighborhoodData);
          setFilteredNeighborhoods(applySorting(sampleNeighborhoodData, sortOrder));
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching neighborhood data:', error);
        setLoading(false);
      }
    };
    
    fetchNeighborhoods();
  }, [initialNeighborhoods, sortOrder]);
  
  // Filter and sort neighborhoods when search term or sort order changes
  useEffect(() => {
    const filtered = neighborhoods.filter(n => 
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredNeighborhoods(applySorting(filtered, sortOrder));
  }, [searchTerm, sortOrder, neighborhoods]);
  
  // Apply sorting to neighborhood data
  const applySorting = (data: NeighborhoodTrendData[], order: string): NeighborhoodTrendData[] => {
    const sortedData = [...data];
    
    switch (order) {
      case 'price-desc':
        return sortedData.sort((a, b) => 
          (b.medianHomeValue || 0) - (a.medianHomeValue || 0)
        );
      case 'price-asc':
        return sortedData.sort((a, b) => 
          (a.medianHomeValue || 0) - (b.medianHomeValue || 0)
        );
      case 'growth-desc':
        return sortedData.sort((a, b) => 
          (b.priceChange || 0) - (a.priceChange || 0)
        );
      case 'growth-asc':
        return sortedData.sort((a, b) => 
          (a.priceChange || 0) - (b.priceChange || 0)
        );
      case 'dom-asc':
        return sortedData.sort((a, b) => 
          (a.daysOnMarket || 999) - (b.daysOnMarket || 999)
        );
      case 'dom-desc':
        return sortedData.sort((a, b) => 
          (b.daysOnMarket || 0) - (a.daysOnMarket || 0)
        );
      case 'name-asc':
      default:
        return sortedData.sort((a, b) => a.name.localeCompare(b.name));
    }
  };
  
  // Handle view details click for a neighborhood
  const handleViewDetails = (neighborhoodCode: string) => {
    navigate(`/neighborhoods/${neighborhoodCode}`);
  };
  
  // Refresh the data
  const handleRefresh = () => {
    setLoading(true);
    // In a real app, this would refetch the neighborhood data
    // For now, we'll just simulate a delay and reuse the sample data
    setTimeout(() => {
      setNeighborhoods(sampleNeighborhoodData);
      setFilteredNeighborhoods(applySorting(sampleNeighborhoodData, sortOrder));
      setLoading(false);
    }, 1000);
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} className="h-[320px]">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Skeleton className="h-4 w-1/4 mb-3" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </div>
          
          <div>
            <Skeleton className="h-4 w-1/4 mb-3" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </div>
          
          <Skeleton className="h-8 w-full mt-4" />
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          Neighborhood Market Trends
        </h2>
        <p className="text-muted-foreground mb-4">
          Live market indicators and trends for neighborhoods in your area
        </p>
        
        {/* Filters and controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search neighborhoods..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="growth-desc">Growth (High to Low)</SelectItem>
                <SelectItem value="growth-asc">Growth (Low to High)</SelectItem>
                <SelectItem value="dom-asc">Days on Market (Fast)</SelectItem>
                <SelectItem value="dom-desc">Days on Market (Slow)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredNeighborhoods.length} of {neighborhoods.length} neighborhoods
        </p>
      )}
      
      {/* Grid of neighborhood cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading 
          ? renderSkeletons()
          : filteredNeighborhoods.map(neighborhood => (
            <NeighborhoodTrendCard
              key={neighborhood.id}
              data={neighborhood}
              onViewDetails={handleViewDetails}
            />
          ))
        }
        
        {!loading && filteredNeighborhoods.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground">
              No neighborhoods found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sample neighborhood data for testing
const sampleNeighborhoodData: NeighborhoodTrendData[] = [
  {
    id: '1',
    name: 'Oakwood Heights',
    code: 'OAK001',
    city: 'Springfield',
    state: 'IL',
    priceChange: 8.5,
    pricePerSqFt: 245,
    daysOnMarket: 15,
    inventoryChange: -12.3,
    salesVolume: 43,
    salesVolumeChange: 5.2,
    medianHomeValue: 425000,
    timeframe: 'Last 12 months',
    updatedAt: '2025-05-01T12:00:00Z'
  },
  {
    id: '2',
    name: 'Riverside District',
    code: 'RIV002',
    city: 'Springfield',
    state: 'IL',
    priceChange: 4.2,
    pricePerSqFt: 310,
    daysOnMarket: 22,
    inventoryChange: -5.6,
    salesVolume: 38,
    salesVolumeChange: 2.1,
    medianHomeValue: 560000,
    timeframe: 'Last 12 months',
    updatedAt: '2025-05-01T12:00:00Z'
  },
  {
    id: '3',
    name: 'Parkview Commons',
    code: 'PRK003',
    city: 'Springfield',
    state: 'IL',
    priceChange: -2.1,
    pricePerSqFt: 185,
    daysOnMarket: 45,
    inventoryChange: 8.7,
    salesVolume: 21,
    salesVolumeChange: -4.3,
    medianHomeValue: 275000,
    timeframe: 'Last 12 months',
    updatedAt: '2025-05-01T12:00:00Z'
  },
  {
    id: '4',
    name: 'Downtown Core',
    code: 'DWN004',
    city: 'Springfield',
    state: 'IL',
    priceChange: 12.8,
    pricePerSqFt: 420,
    daysOnMarket: 10,
    inventoryChange: -18.5,
    salesVolume: 29,
    salesVolumeChange: 9.8,
    medianHomeValue: 720000,
    timeframe: 'Last 12 months',
    updatedAt: '2025-05-01T12:00:00Z'
  },
  {
    id: '5',
    name: 'Cedarwood',
    code: 'CED005',
    city: 'Shelbyville',
    state: 'IL',
    priceChange: 1.8,
    pricePerSqFt: 210,
    daysOnMarket: 32,
    inventoryChange: 3.2,
    salesVolume: 26,
    salesVolumeChange: -1.5,
    medianHomeValue: 315000,
    timeframe: 'Last 12 months',
    updatedAt: '2025-05-01T12:00:00Z'
  },
  {
    id: '6',
    name: 'Maple Ridge',
    code: 'MPL006',
    city: 'Shelbyville',
    state: 'IL',
    priceChange: 6.3,
    pricePerSqFt: 280,
    daysOnMarket: 18,
    inventoryChange: -8.1,
    salesVolume: 35,
    salesVolumeChange: 4.7,
    medianHomeValue: 495000,
    timeframe: 'Last 12 months',
    updatedAt: '2025-05-01T12:00:00Z'
  }
];

export default NeighborhoodTrendsGrid;