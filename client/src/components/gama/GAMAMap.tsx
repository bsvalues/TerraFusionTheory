/**
 * GAMA Map Component
 * 
 * Stunning, story-driven map visualization for Government Automated Mass Appraisal.
 * Features layer toggles, agent insights, and interactive property valuation workflow.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, useMap } from 'react-leaflet';
import { LatLngBounds, LatLng, DivIcon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Home, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Layers,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Interfaces
interface PropertyData {
  id: string;
  address: string;
  coordinates: [number, number];
  assessedValue: number;
  marketValue?: number;
  salePrice?: number;
  saleDate?: string;
  confidence: number;
  status: 'pending' | 'processing' | 'completed' | 'flagged';
  agentInsights: {
    zoning: { score: number; issues: string[] };
    mra: { value: number; confidence: number };
    comps: { count: number; similarity: number };
    equity: { score: number; warnings: string[] };
  };
  propertyType: string;
  livingArea: number;
  lotSize: number;
  neighborhood: string;
}

interface MarketCluster {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  averageValue: number;
  sampleSize: number;
  confidence: number;
  characteristics: string[];
}

interface LayerConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  visible: boolean;
  data: any[];
}

// Map layers configuration
const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: 'properties',
    name: 'Properties',
    icon: Home,
    color: '#3b82f6',
    visible: true,
    data: []
  },
  {
    id: 'market_zones',
    name: 'Market Zones',
    icon: Target,
    color: '#8b5cf6',
    visible: true,
    data: []
  },
  {
    id: 'recent_sales',
    name: 'Recent Sales',
    icon: DollarSign,
    color: '#10b981',
    visible: true,
    data: []
  },
  {
    id: 'outliers',
    name: 'Outlier Flags',
    icon: AlertTriangle,
    color: '#f59e0b',
    visible: false,
    data: []
  },
  {
    id: 'equity_issues',
    name: 'Equity Issues',
    icon: BarChart3,
    color: '#ef4444',
    visible: false,
    data: []
  }
];

// Property marker component
const PropertyMarker: React.FC<{ property: PropertyData; onClick: (property: PropertyData) => void }> = ({ 
  property, 
  onClick 
}) => {
  const getMarkerColor = () => {
    switch (property.status) {
      case 'completed': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'flagged': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMarkerIcon = () => {
    const color = getMarkerColor();
    return new DivIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  return (
    <Marker 
      position={property.coordinates} 
      icon={getMarkerIcon()}
      eventHandlers={{
        click: () => onClick(property)
      }}
    >
      <Popup>
        <div className="w-64">
          <h3 className="font-semibold text-sm mb-2">{property.address}</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Assessed Value:</span>
              <span className="font-medium">${property.assessedValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-medium">{(property.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant={property.status === 'completed' ? 'default' : 'secondary'}>
                {property.status}
              </Badge>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Market cluster component
const MarketClusterOverlay: React.FC<{ cluster: MarketCluster }> = ({ cluster }) => {
  return (
    <Circle
      center={cluster.center}
      radius={cluster.radius}
      pathOptions={{
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      }}
    >
      <Popup>
        <div className="w-56">
          <h3 className="font-semibold text-sm mb-2">{cluster.name}</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Avg Value:</span>
              <span className="font-medium">${cluster.averageValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Sample Size:</span>
              <span className="font-medium">{cluster.sampleSize}</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-medium">{(cluster.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-600">Characteristics:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {cluster.characteristics.map((char, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{char}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Circle>
  );
};

// Layer control panel
const LayerControlPanel: React.FC<{
  layers: LayerConfig[];
  onLayerToggle: (layerId: string) => void;
}> = ({ layers, onLayerToggle }) => {
  return (
    <Card className="absolute top-4 right-4 z-[1000] w-64 bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Map Layers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {layers.map(layer => (
          <div key={layer.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <layer.icon className="h-4 w-4" style={{ color: layer.color }} />
              <span className="text-sm">{layer.name}</span>
            </div>
            <Switch
              checked={layer.visible}
              onCheckedChange={() => onLayerToggle(layer.id)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Property details panel
const PropertyDetailsPanel: React.FC<{
  property: PropertyData | null;
  onClose: () => void;
}> = ({ property, onClose }) => {
  if (!property) return null;

  return (
    <Card className="absolute bottom-4 left-4 z-[1000] w-96 bg-white/95 backdrop-blur max-h-[60vh] overflow-y-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{property.address}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <div className="font-medium">{property.propertyType}</div>
              </div>
              <div>
                <span className="text-gray-600">Neighborhood:</span>
                <div className="font-medium">{property.neighborhood}</div>
              </div>
              <div>
                <span className="text-gray-600">Living Area:</span>
                <div className="font-medium">{property.livingArea.toLocaleString()} sq ft</div>
              </div>
              <div>
                <span className="text-gray-600">Lot Size:</span>
                <div className="font-medium">{property.lotSize.toLocaleString()} sq ft</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Assessed Value:</span>
                <span className="font-semibold text-lg">${property.assessedValue.toLocaleString()}</span>
              </div>
              {property.marketValue && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Market Value:</span>
                  <span className="font-medium">${property.marketValue.toLocaleString()}</span>
                </div>
              )}
              {property.salePrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sale Price:</span>
                  <span className="font-medium">${property.salePrice.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="text-sm font-medium">{(property.confidence * 100).toFixed(1)}%</span>
              </div>
              <Progress value={property.confidence * 100} className="h-2" />
            </div>
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-3 mt-3">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Zoning Agent</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span>{(property.agentInsights.zoning.score * 100).toFixed(1)}%</span>
                  </div>
                  {property.agentInsights.zoning.issues.length > 0 && (
                    <div className="text-orange-600">
                      Issues: {property.agentInsights.zoning.issues.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">MRA Agent</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Model Value:</span>
                    <span>${property.agentInsights.mra.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span>{(property.agentInsights.mra.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Comp Agent</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Comparables:</span>
                    <span>{property.agentInsights.comps.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Similarity:</span>
                    <span>{(property.agentInsights.comps.similarity * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-sm">Equity Guard</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Equity Score:</span>
                    <span>{(property.agentInsights.equity.score * 100).toFixed(1)}%</span>
                  </div>
                  {property.agentInsights.equity.warnings.length > 0 && (
                    <div className="text-red-600">
                      Warnings: {property.agentInsights.equity.warnings.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="workflow" className="space-y-3 mt-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Data Loading Complete</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Market Cluster Identified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>Regression Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Comparable Selection</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Valuation Reconciliation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Equity Assessment</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>NarratorAI Summary</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Main GAMA Map component
export const GAMAMap: React.FC<{
  center?: [number, number];
  zoom?: number;
  onPropertySelect?: (property: PropertyData) => void;
  properties?: PropertyData[];
  marketClusters?: MarketCluster[];
}> = ({ 
  center = [39.7392, -104.9903], 
  zoom = 12,
  onPropertySelect,
  properties = [],
  marketClusters = []
}) => {
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);

  // Generate layer data
  useEffect(() => {
    setLayers(prev => prev.map(layer => {
      switch (layer.id) {
        case 'properties':
          return { ...layer, data: properties };
        case 'market_zones':
          return { ...layer, data: marketClusters };
        case 'recent_sales':
          return { ...layer, data: properties.filter(p => p.salePrice) };
        case 'outliers':
          return { ...layer, data: properties.filter(p => p.status === 'flagged') };
        case 'equity_issues':
          return { ...layer, data: properties.filter(p => p.agentInsights?.equity?.warnings?.length > 0) };
        default:
          return layer;
      }
    }));
  }, [properties, marketClusters]);

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handlePropertyClick = (property: PropertyData) => {
    setSelectedProperty(property);
    onPropertySelect?.(property);
  };

  const visibleLayers = useMemo(() => 
    layers.filter(layer => layer.visible), 
    [layers]
  );

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Property markers */}
        {visibleLayers.find(l => l.id === 'properties') && 
          properties.map(property => (
            <PropertyMarker 
              key={property.id} 
              property={property} 
              onClick={handlePropertyClick}
            />
          ))
        }
        
        {/* Market clusters */}
        {visibleLayers.find(l => l.id === 'market_zones') && 
          marketClusters.map(cluster => (
            <MarketClusterOverlay key={cluster.id} cluster={cluster} />
          ))
        }
      </MapContainer>

      {/* Layer controls */}
      <LayerControlPanel layers={layers} onLayerToggle={handleLayerToggle} />
      
      {/* Property details */}
      <PropertyDetailsPanel 
        property={selectedProperty} 
        onClose={() => setSelectedProperty(null)} 
      />
      
      {/* Status indicator */}
      <Card className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">GAMA System Active</span>
            <Badge variant="outline" className="text-xs">
              {properties.filter(p => p.status === 'completed').length}/{properties.length} Complete
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GAMAMap;