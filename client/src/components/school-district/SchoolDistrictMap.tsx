/**
 * School District Map Component
 * 
 * This component displays a map of school districts and schools with
 * interactive filtering and visualization options.
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  PlusSquare, 
  MinusSquare, 
  School as SchoolIcon, 
  Map, 
  Filter, 
  Info, 
  Search, 
  Layers, 
  Award,
  Check, 
  X 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// School district types
interface School {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'elementary' | 'middle' | 'high';
  rating: number;
  enrollment: number;
  districtId: string;
}

interface SchoolDistrict {
  id: string;
  name: string;
  boundary: number[][];
  schools: School[];
  averageRating: number;
}

interface SchoolSearchParams {
  districtId?: string;
  type?: string;
  rating?: number;
}
} from '@/services/school-district.service';

// Define component props
interface SchoolDistrictMapProps {
  initialCity?: string;
  initialState?: string;
  height?: number | string;
  width?: number | string;
  className?: string;
  onSchoolSelect?: (school: School) => void;
}

// Types
type SchoolTypeFilter = 'all' | 'elementary' | 'middle' | 'high' | 'charter' | 'private';
type SchoolLayer = 'schools' | 'ratings' | 'enrollment' | 'ratio';

// Color scale for ratings
const getRatingColor = (rating: number): string => {
  if (rating >= 9) return '#10b981'; // Green
  if (rating >= 7) return '#3b82f6'; // Blue
  if (rating >= 5) return '#f59e0b'; // Yellow
  if (rating >= 3) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

// Get marker size based on enrollment
const getEnrollmentSize = (enrollment: number): number => {
  if (enrollment >= 1500) return 24;
  if (enrollment >= 1000) return 20;
  if (enrollment >= 500) return 16;
  if (enrollment >= 250) return 12;
  return 8;
};

// Zoom to bounds component
const ZoomToBounds: React.FC<{ schools: School[] }> = ({ schools }) => {
  const map = useMap();
  
  useEffect(() => {
    if (schools.length > 0) {
      const bounds = schools.reduce(
        (bounds, school) => {
          const { latitude, longitude } = school.location;
          return bounds.extend([latitude, longitude]);
        },
        map.getBounds()
      );
      
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [schools, map]);
  
  return null;
};

// School marker component
const SchoolMarker: React.FC<{ 
  school: School;
  displayMode: SchoolLayer;
  selected: boolean;
  onClick: () => void;
}> = ({ school, displayMode, selected, onClick }) => {
  // Base style for all markers
  const baseStyle = {
    weight: selected ? 3 : 1,
    color: selected ? '#000' : '#666',
    fillOpacity: selected ? 0.7 : 0.5,
  };
  
  // Get marker properties based on display mode
  let radius = 10;
  let fillColor = '#3b82f6';
  
  if (displayMode === 'ratings') {
    fillColor = getRatingColor(school.rating);
    radius = 12;
  } else if (displayMode === 'enrollment') {
    fillColor = '#3b82f6';
    radius = getEnrollmentSize(school.enrollment);
  } else if (displayMode === 'ratio') {
    // Lower student-teacher ratio is better
    const ratio = school.studentTeacherRatio;
    if (ratio <= 15) fillColor = '#10b981'; // Green
    else if (ratio <= 18) fillColor = '#3b82f6'; // Blue
    else if (ratio <= 21) fillColor = '#f59e0b'; // Yellow
    else if (ratio <= 24) fillColor = '#f97316'; // Orange
    else fillColor = '#ef4444'; // Red
    
    radius = 10;
  }
  
  return (
    <CircleMarker
      center={[school.location.latitude, school.location.longitude]}
      radius={radius}
      pathOptions={{
        ...baseStyle,
        fillColor
      }}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup>
        <div className="p-1">
          <h3 className="font-bold text-sm">{school.name}</h3>
          <div className="text-xs mt-1">
            <div><span className="font-medium">Type:</span> {school.type.charAt(0).toUpperCase() + school.type.slice(1)}</div>
            <div><span className="font-medium">Grades:</span> {school.gradeRange}</div>
            <div><span className="font-medium">Rating:</span> {school.rating}/10</div>
            <div><span className="font-medium">Students:</span> {school.enrollment.toLocaleString()}</div>
            <div><span className="font-medium">Student-Teacher Ratio:</span> {school.studentTeacherRatio}:1</div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mt-2 text-xs py-0 h-7"
            onClick={(e) => {
              e.stopPropagation();
              window.open(school.website, '_blank');
            }}
          >
            Visit Website
          </Button>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// Legend component
const MapLegend: React.FC<{ displayMode: SchoolLayer }> = ({ displayMode }) => {
  let legendItems: Array<{ color: string; label: string }> = [];
  
  if (displayMode === 'ratings') {
    legendItems = [
      { color: '#10b981', label: '9-10: Excellent' },
      { color: '#3b82f6', label: '7-8.9: Very Good' },
      { color: '#f59e0b', label: '5-6.9: Average' },
      { color: '#f97316', label: '3-4.9: Below Average' },
      { color: '#ef4444', label: '1-2.9: Poor' }
    ];
  } else if (displayMode === 'enrollment') {
    legendItems = [
      { color: '#3b82f6', label: '>1500 students' },
      { color: '#3b82f6', label: '1000-1499 students' },
      { color: '#3b82f6', label: '500-999 students' },
      { color: '#3b82f6', label: '250-499 students' },
      { color: '#3b82f6', label: '<250 students' }
    ];
  } else if (displayMode === 'ratio') {
    legendItems = [
      { color: '#10b981', label: '≤15:1 (Excellent)' },
      { color: '#3b82f6', label: '16-18:1 (Good)' },
      { color: '#f59e0b', label: '19-21:1 (Average)' },
      { color: '#f97316', label: '22-24:1 (Below Average)' },
      { color: '#ef4444', label: '>24:1 (Poor)' }
    ];
  } else {
    legendItems = [
      { color: '#3b82f6', label: 'School' }
    ];
  }
  
  return (
    <div className="bg-white p-2 rounded shadow-md absolute bottom-5 right-5 z-[1000] text-xs">
      <div className="font-medium pb-1">
        {displayMode === 'ratings' && 'School Ratings'}
        {displayMode === 'enrollment' && 'Student Enrollment'}
        {displayMode === 'ratio' && 'Student-Teacher Ratio'}
        {displayMode === 'schools' && 'Schools'}
      </div>
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center mb-1 last:mb-0">
          <div 
            className="w-4 h-4 rounded-full mr-2" 
            style={{ backgroundColor: item.color }}
          />
          <div>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

// Main component
const SchoolDistrictMap: React.FC<SchoolDistrictMapProps> = ({
  initialCity = 'Richland',
  initialState = 'WA',
  height = 500,
  width = '100%',
  className,
  onSchoolSelect
}) => {
  // State variables
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedState, setSelectedState] = useState(initialState);
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<SchoolTypeFilter>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<SchoolLayer>('schools');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Query to fetch school districts
  const { data: schoolDistricts, isLoading: isLoadingDistricts } = useQuery({
    queryKey: ['/api/school-districts', selectedCity, selectedState],
    queryFn: async () => {
      return await schoolDistrictService.getSchoolDistricts(selectedCity, selectedState);
    }
  });
  
  // Create search params for schools query
  const searchParams: SchoolSearchParams = {
    city: selectedCity,
    state: selectedState,
    minRating: minRating > 0 ? minRating : undefined,
    type: schoolTypeFilter !== 'all' ? schoolTypeFilter : undefined
  };
  
  // Query to fetch schools
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['/api/schools', searchParams],
    queryFn: async () => {
      return await schoolDistrictService.getSchools(searchParams);
    }
  });
  
  // Calculate center position
  const centerPosition = React.useMemo(() => {
    if (schools && schools.length > 0) {
      const sumLat = schools.reduce((sum, school) => sum + school.location.latitude, 0);
      const sumLng = schools.reduce((sum, school) => sum + school.location.longitude, 0);
      return [sumLat / schools.length, sumLng / schools.length] as [number, number];
    }
    
    // Default to Richland, WA
    return [46.28, -119.28] as [number, number];
  }, [schools]);
  
  // Filter schools for display
  const filteredSchools = React.useMemo(() => {
    if (!schools) return [];
    
    return schools.filter(school => {
      if (schoolTypeFilter !== 'all' && school.type !== schoolTypeFilter) {
        return false;
      }
      
      if (minRating > 0 && school.rating < minRating) {
        return false;
      }
      
      return true;
    });
  }, [schools, schoolTypeFilter, minRating]);
  
  // Handle school selection
  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(selectedSchool === school.id ? null : school.id);
    if (onSchoolSelect) {
      onSchoolSelect(school);
    }
  };
  
  // Get school type count
  const getSchoolTypeCount = (type: SchoolTypeFilter): number => {
    if (!schools) return 0;
    
    if (type === 'all') {
      return schools.length;
    }
    
    return schools.filter(school => school.type === type).length;
  };
  
  // Handle rating filter change
  const handleRatingFilterChange = (value: number[]) => {
    setMinRating(value[0]);
  };
  
  return (
    <Card className={cn("shadow-md overflow-hidden", className)}>
      <CardHeader className="pb-2 flex-row justify-between items-start">
        <div>
          <CardTitle className="flex items-center text-lg">
            <SchoolIcon className="mr-2 h-5 w-5" />
            School District Explorer
          </CardTitle>
          <CardDescription>
            Explore schools and districts in {selectedCity}, {selectedState}
          </CardDescription>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-8 h-8 p-0"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show/hide filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      {filterOpen && (
        <div className="px-6 pb-1 pt-0">
          <div className="border rounded-md p-3 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-xs">City</Label>
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger id="city" className="mt-1 h-8">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Richland">Richland</SelectItem>
                    <SelectItem value="Grandview">Grandview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state" className="text-xs">State</Label>
                <Select
                  value={selectedState}
                  onValueChange={setSelectedState}
                >
                  <SelectTrigger id="state" className="mt-1 h-8">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">School Type</Label>
                <Badge variant="outline" className="text-xs">
                  {filteredSchools.length} schools
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Button 
                  variant={schoolTypeFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSchoolTypeFilter('all')}
                >
                  All ({getSchoolTypeCount('all')})
                </Button>
                <Button 
                  variant={schoolTypeFilter === 'elementary' ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSchoolTypeFilter('elementary')}
                >
                  Elementary ({getSchoolTypeCount('elementary')})
                </Button>
                <Button 
                  variant={schoolTypeFilter === 'middle' ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSchoolTypeFilter('middle')}
                >
                  Middle ({getSchoolTypeCount('middle')})
                </Button>
                <Button 
                  variant={schoolTypeFilter === 'high' ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSchoolTypeFilter('high')}
                >
                  High ({getSchoolTypeCount('high')})
                </Button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="rating-filter" className="text-xs">
                  Minimum Rating: {minRating}
                </Label>
              </div>
              
              <Slider
                id="rating-filter"
                min={0}
                max={10}
                step={1}
                defaultValue={[minRating]}
                onValueChange={handleRatingFilterChange}
                className="py-2"
              />
            </div>
            
            <div>
              <Label className="text-xs mb-1 block">Display Mode</Label>
              <ToggleGroup 
                type="single" 
                value={displayMode} 
                onValueChange={(value) => value && setDisplayMode(value as SchoolLayer)}
              >
                <ToggleGroupItem value="schools" size="sm" className="text-xs">
                  Schools
                </ToggleGroupItem>
                <ToggleGroupItem value="ratings" size="sm" className="text-xs">
                  Ratings
                </ToggleGroupItem>
                <ToggleGroupItem value="enrollment" size="sm" className="text-xs">
                  Enrollment
                </ToggleGroupItem>
                <ToggleGroupItem value="ratio" size="sm" className="text-xs">
                  Student-Teacher Ratio
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        {isLoadingSchools || isLoadingDistricts ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div style={{ height, width }}>
            <MapContainer 
              center={centerPosition} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Schools Layer */}
              {filteredSchools.map(school => (
                <SchoolMarker
                  key={school.id}
                  school={school}
                  displayMode={displayMode}
                  selected={selectedSchool === school.id}
                  onClick={() => handleSchoolSelect(school)}
                />
              ))}
              
              {/* Zoom to bounds */}
              {filteredSchools.length > 0 && (
                <ZoomToBounds schools={filteredSchools} />
              )}
              
              {/* Legend */}
              <MapLegend displayMode={displayMode} />
            </MapContainer>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between py-3">
        <div className="text-xs text-muted-foreground">
          Data source: School district records
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => setSelectedSchool(null)}
        >
          Reset Selection
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SchoolDistrictMap;