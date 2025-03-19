import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddressFeature {
  id: number;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    ADD_FULL: string;
    STRT_NUM: string;
    STRT_NAM: string;
    RdType: string;
    PostalArea: string;
    ZIP: string;
    [key: string]: any;
  };
}

interface QueryResponse {
  name: string;
  type: string;
  query: any;
  data: {
    type: string;
    features: AddressFeature[];
    properties?: {
      exceededTransferLimit?: boolean;
    };
  };
}

export default function AddressMap() {
  const [addresses, setAddresses] = useState<AddressFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'bbox' | 'point' | 'where'>('where');
  const [longitude, setLongitude] = useState<string>('-119.463');
  const [latitude, setLatitude] = useState<string>('46.268');
  const [distance, setDistance] = useState<string>('1000');
  const [searchText, setSearchText] = useState<string>('');
  const [limitCount, setLimitCount] = useState<string>('5');
  const { toast } = useToast();

  // Fetch addresses based on current search parameters
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      let queryParams: any = { limit: parseInt(limitCount) || 5 };
      
      // Build query based on search type
      if (searchType === 'bbox') {
        // Simple bounding box around the point
        const lon = parseFloat(longitude);
        const lat = parseFloat(latitude);
        const buffer = 0.01; // approximately 1km at this latitude
        queryParams.bbox = [lon - buffer, lat - buffer, lon + buffer, lat + buffer];
      } else if (searchType === 'point') {
        queryParams.point = [parseFloat(longitude), parseFloat(latitude)];
        queryParams.distance = parseInt(distance) || 1000;
      } else {
        // 'where' type search
        if (searchText) {
          queryParams.where = `STRT_NAM LIKE '%${searchText.toUpperCase()}%' OR ADD_FULL LIKE '%${searchText.toUpperCase()}%'`;
        } else {
          queryParams.where = '1=1';
        }
      }
      
      const response = await fetch('/api/connectors/demo-gis/query/gis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryParams)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }
      
      const result: QueryResponse = await response.json();
      setAddresses(result.data.features || []);
      
      toast({
        title: 'Success',
        description: `Found ${result.data.features.length} addresses`,
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch addresses',
        variant: 'destructive',
      });
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Address Search</CardTitle>
          <CardDescription>Search for addresses using GIS data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select
                value={searchType}
                onValueChange={(value: 'bbox' | 'point' | 'where') => setSearchType(value)}
              >
                <SelectTrigger id="searchType">
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="where">Text Search</SelectItem>
                  <SelectItem value="point">Point & Distance</SelectItem>
                  <SelectItem value="bbox">Bounding Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {searchType === 'where' ? (
              <div className="space-y-2">
                <Label htmlFor="searchText">Street or Address</Label>
                <Input
                  id="searchText"
                  placeholder="e.g. DEMOSS"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    placeholder="-119.463"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    placeholder="46.268"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                {searchType === 'point' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="distance">Distance (meters)</Label>
                    <Input
                      id="distance"
                      placeholder="1000"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="limit">Result Limit</Label>
              <Input
                id="limit"
                placeholder="5"
                value={limitCount}
                onChange={(e) => setLimitCount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={fetchAddresses} disabled={loading}>
            {loading ? 'Loading...' : 'Search Addresses'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Found {addresses.length} addresses</CardDescription>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No addresses found. Try a different search.
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="p-4 border rounded-md">
                  <div className="font-medium">{address.properties.ADD_FULL}</div>
                  <div className="text-sm text-gray-500">
                    {address.properties.PostalArea}, {address.properties.ZIP}
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Parcel: {address.properties.PARCEL_NO}</div>
                    <div>Type: {address.properties.Add_Type}</div>
                    <div>Long: {address.geometry.coordinates[0].toFixed(6)}</div>
                    <div>Lat: {address.geometry.coordinates[1].toFixed(6)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}