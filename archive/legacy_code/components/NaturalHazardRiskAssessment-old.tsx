/**
 * Natural Hazard Risk Assessment Component
 * 
 * This component displays a comprehensive risk assessment for a property,
 * showing flood, fire, and earthquake risks with detailed explanations.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  Droplet, 
  Flame, 
  AlertTriangle, 
  LifeBuoy, 
  Info, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Calendar,
  Shield,
  Waves,
  Wind
} from 'lucide-react';
// Natural hazard assessment types
interface PropertyRiskAssessment {
  propertyId: string;
  floodRisk: FloodRisk;
  fireRisk: FireRisk;
  earthquakeRisk: EarthquakeRisk;
  overallRisk: RiskLevel;
}

interface FloodRisk {
  level: RiskLevel;
  zone: string;
  probability: number;
}

interface FireRisk {
  level: RiskLevel;
  wildfire: number;
  structural: number;
}

interface EarthquakeRisk {
  level: RiskLevel;
  magnitude: number;
  probability: number;
}

enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme'
}

interface NaturalHazardRiskAssessmentProps {
  propertyId?: string;
  latitude?: number;
  longitude?: number;
  showTitle?: boolean;
  className?: string;
  fullDetailsByDefault?: boolean;
}

const NaturalHazardRiskAssessment: React.FC<NaturalHazardRiskAssessmentProps> = ({
  propertyId,
  latitude,
  longitude,
  showTitle = true,
  className = '',
  fullDetailsByDefault = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<PropertyRiskAssessment | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overall');
  const [showMitigationTips, setShowMitigationTips] = useState<boolean>(false);
  const [showDetailedData, setShowDetailedData] = useState<boolean>(fullDetailsByDefault);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      setLoading(true);
      try {
        let result: PropertyRiskAssessment;
        
        if (propertyId) {
          // Fetch by property ID
          result = await naturalHazardService.getPropertyRiskAssessment(
            propertyId, 
            fullDetailsByDefault
          );
        } else if (latitude !== undefined && longitude !== undefined) {
          // Fetch by coordinates
          result = await naturalHazardService.getLocationRiskAssessment(
            latitude,
            longitude,
            fullDetailsByDefault
          );
        } else {
          throw new Error('Either propertyId or coordinates must be provided');
        }
        
        setAssessment(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching risk assessment:', err);
        setError('Failed to load natural hazard risk data');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessment();
  }, [propertyId, latitude, longitude, fullDetailsByDefault]);

  // Helper function for risk level text
  const getRiskLevelText = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.VERY_LOW: return 'Very Low';
      case RiskLevel.LOW: return 'Low';
      case RiskLevel.MODERATE: return 'Moderate';
      case RiskLevel.HIGH: return 'High';
      case RiskLevel.VERY_HIGH: return 'Very High';
      default: return 'Unknown';
    }
  };

  // Helper function for risk level color
  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.VERY_LOW: return 'bg-green-500';
      case RiskLevel.LOW: return 'bg-green-400';
      case RiskLevel.MODERATE: return 'bg-yellow-400';
      case RiskLevel.HIGH: return 'bg-orange-500';
      case RiskLevel.VERY_HIGH: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Helper function for risk level badge
  const getRiskLevelBadge = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.VERY_LOW: return 'bg-green-100 text-green-800 hover:bg-green-200';
      case RiskLevel.LOW: return 'bg-green-100 text-green-800 hover:bg-green-200';
      case RiskLevel.MODERATE: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case RiskLevel.HIGH: return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case RiskLevel.VERY_HIGH: return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Helper function to render risk icon
  const getRiskIcon = (type: 'flood' | 'fire' | 'earthquake', level: RiskLevel) => {
    const size = 'h-5 w-5';
    const colors = {
      [RiskLevel.VERY_LOW]: 'text-green-500',
      [RiskLevel.LOW]: 'text-green-500',
      [RiskLevel.MODERATE]: 'text-yellow-500',
      [RiskLevel.HIGH]: 'text-orange-500',
      [RiskLevel.VERY_HIGH]: 'text-red-500',
    };
    const color = colors[level] || 'text-gray-500';
    
    switch (type) {
      case 'flood':
        return <Droplet className={`${size} ${color}`} />;
      case 'fire':
        return <Flame className={`${size} ${color}`} />;
      case 'earthquake':
        return <Waves className={`${size} ${color}`} />;
      default:
        return <AlertTriangle className={`${size} ${color}`} />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-2xl">
            <Skeleton className="h-8 w-[250px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[200px]" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !assessment) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-red-500" />
            Risk Assessment Unavailable
          </CardTitle>
          <CardDescription>
            Unable to load natural hazard risk data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">
            {error || 'No risk assessment data could be loaded for this location.'}
          </div>
          {propertyId && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setLoading(true)}>
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            Natural Hazard Risk Assessment
          </CardTitle>
          <CardDescription className="flex flex-col space-y-1">
            <span>Comprehensive analysis of potential natural hazards for this property</span>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {assessment.address}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              Assessment date: {new Date(assessment.assessmentDate).toLocaleDateString()}
            </div>
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="space-y-5">
        {/* Overall Risk Summary */}
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center">
            <h3 className="text-lg font-medium flex items-center">
              Overall Risk Level
            </h3>
            <Badge className={getRiskLevelBadge(assessment.overallRisk)}>
              {getRiskLevelText(assessment.overallRisk)}
            </Badge>
          </div>
          
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs">Very Low</div>
              <div className="text-xs">Very High</div>
            </div>
            <div className="flex h-2 overflow-hidden rounded bg-muted">
              <div className="flex justify-between w-full">
                <div className={`${getRiskLevelColor(RiskLevel.VERY_LOW)} h-2 w-1/5`}></div>
                <div className={`${getRiskLevelColor(RiskLevel.LOW)} h-2 w-1/5`}></div>
                <div className={`${getRiskLevelColor(RiskLevel.MODERATE)} h-2 w-1/5`}></div>
                <div className={`${getRiskLevelColor(RiskLevel.HIGH)} h-2 w-1/5`}></div>
                <div className={`${getRiskLevelColor(RiskLevel.VERY_HIGH)} h-2 w-1/5`}></div>
              </div>
              <div 
                className="absolute top-0 h-2 border-r-2 border-white" 
                style={{ 
                  left: `${assessment.floodRisk.score}%`,
                  marginTop: '16px'
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2">
              <div className="flex flex-row gap-4">
                <div className="flex items-center">
                  <Droplet className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="text-xs">Flood: {assessment.floodRisk.score}%</span>
                </div>
                <div className="flex items-center">
                  <Flame className="h-4 w-4 mr-1 text-red-500" />
                  <span className="text-xs">Fire: {assessment.fireRisk.score}%</span>
                </div>
                <div className="flex items-center">
                  <Waves className="h-4 w-4 mr-1 text-orange-500" />
                  <span className="text-xs">Earthquake: {assessment.earthquakeRisk.score}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Risk Tabs */}
        <Tabs defaultValue="flood" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flood" className="flex items-center">
              <Droplet className="h-4 w-4 mr-2" />
              <span>Flood</span>
            </TabsTrigger>
            <TabsTrigger value="fire" className="flex items-center">
              <Flame className="h-4 w-4 mr-2" />
              <span>Fire</span>
            </TabsTrigger>
            <TabsTrigger value="earthquake" className="flex items-center">
              <Waves className="h-4 w-4 mr-2" />
              <span>Earthquake</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Flood Risk Content */}
          <TabsContent value="flood" className="space-y-4 pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Droplet className="h-5 w-5 mr-2 text-blue-500" />
                  Flood Risk Assessment
                </h3>
                <p className="text-sm text-muted-foreground">{assessment.floodRisk.description}</p>
              </div>
              <Badge className={getRiskLevelBadge(assessment.floodRisk.level)}>
                {getRiskLevelText(assessment.floodRisk.level)}
              </Badge>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Risk Score</h4>
              <Progress value={assessment.floodRisk.score} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low Risk (0%)</span>
                <span>High Risk (100%)</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Contributing Factors</h4>
              <ul className="space-y-1">
                {assessment.floodRisk.factors.map((factor, idx) => (
                  <li key={idx} className="text-sm flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            
            {assessment.floodRisk.mitigationTips && (
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMitigationTips(!showMitigationTips)}
                  className="text-sm flex items-center"
                >
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  {showMitigationTips ? 'Hide Mitigation Tips' : 'Show Mitigation Tips'}
                  {showMitigationTips ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                
                {showMitigationTips && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <h4 className="text-sm font-medium mb-2 text-blue-700">Recommended Mitigation Steps</h4>
                    <ul className="space-y-1">
                      {assessment.floodRisk.mitigationTips.map((tip, idx) => (
                        <li key={idx} className="text-sm flex items-start text-blue-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2 mt-1.5"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {showDetailedData && assessment.floodRisk.floodZone && (
              <div className="mt-3 space-y-3">
                <Separator />
                <h4 className="text-sm font-medium">Detailed Flood Data</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Flood Zone</p>
                    <p className="text-sm font-medium">{assessment.floodRisk.floodZone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Elevation</p>
                    <p className="text-sm font-medium">{assessment.floodRisk.elevationAboveSeaLevel} meters</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Historical Events</p>
                    <p className="text-sm font-medium">{assessment.floodRisk.historicalFloodEvents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Proximity to Water</p>
                    <p className="text-sm font-medium">{assessment.floodRisk.proximityToWaterBodies} meters</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Fire Risk Content */}
          <TabsContent value="fire" className="space-y-4 pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Flame className="h-5 w-5 mr-2 text-red-500" />
                  Fire Risk Assessment
                </h3>
                <p className="text-sm text-muted-foreground">{assessment.fireRisk.description}</p>
              </div>
              <Badge className={getRiskLevelBadge(assessment.fireRisk.level)}>
                {getRiskLevelText(assessment.fireRisk.level)}
              </Badge>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Risk Score</h4>
              <Progress value={assessment.fireRisk.score} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low Risk (0%)</span>
                <span>High Risk (100%)</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Contributing Factors</h4>
              <ul className="space-y-1">
                {assessment.fireRisk.factors.map((factor, idx) => (
                  <li key={idx} className="text-sm flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            
            {assessment.fireRisk.mitigationTips && (
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMitigationTips(!showMitigationTips)}
                  className="text-sm flex items-center"
                >
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  {showMitigationTips ? 'Hide Mitigation Tips' : 'Show Mitigation Tips'}
                  {showMitigationTips ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                
                {showMitigationTips && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md">
                    <h4 className="text-sm font-medium mb-2 text-red-700">Recommended Mitigation Steps</h4>
                    <ul className="space-y-1">
                      {assessment.fireRisk.mitigationTips.map((tip, idx) => (
                        <li key={idx} className="text-sm flex items-start text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 mt-1.5"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {showDetailedData && assessment.fireRisk.vegetationDensity !== undefined && (
              <div className="mt-3 space-y-3">
                <Separator />
                <h4 className="text-sm font-medium">Detailed Fire Data</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Vegetation Density</p>
                    <p className="text-sm font-medium">{assessment.fireRisk.vegetationDensity}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dry Conditions</p>
                    <p className="text-sm font-medium">{assessment.fireRisk.dryConditionFrequency} days/year</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Historical Fire Events</p>
                    <p className="text-sm font-medium">{assessment.fireRisk.historicalFireEvents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Proximity to Wildlands</p>
                    <p className="text-sm font-medium">{assessment.fireRisk.proximityToWildlands} meters</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Earthquake Risk Content */}
          <TabsContent value="earthquake" className="space-y-4 pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Waves className="h-5 w-5 mr-2 text-orange-500" />
                  Earthquake Risk Assessment
                </h3>
                <p className="text-sm text-muted-foreground">{assessment.earthquakeRisk.description}</p>
              </div>
              <Badge className={getRiskLevelBadge(assessment.earthquakeRisk.level)}>
                {getRiskLevelText(assessment.earthquakeRisk.level)}
              </Badge>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Risk Score</h4>
              <Progress value={assessment.earthquakeRisk.score} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low Risk (0%)</span>
                <span>High Risk (100%)</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Contributing Factors</h4>
              <ul className="space-y-1">
                {assessment.earthquakeRisk.factors.map((factor, idx) => (
                  <li key={idx} className="text-sm flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-2"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            
            {assessment.earthquakeRisk.mitigationTips && (
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMitigationTips(!showMitigationTips)}
                  className="text-sm flex items-center"
                >
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  {showMitigationTips ? 'Hide Mitigation Tips' : 'Show Mitigation Tips'}
                  {showMitigationTips ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                
                {showMitigationTips && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-md">
                    <h4 className="text-sm font-medium mb-2 text-orange-700">Recommended Mitigation Steps</h4>
                    <ul className="space-y-1">
                      {assessment.earthquakeRisk.mitigationTips.map((tip, idx) => (
                        <li key={idx} className="text-sm flex items-start text-orange-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-2 mt-1.5"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {showDetailedData && assessment.earthquakeRisk.seismicZone && (
              <div className="mt-3 space-y-3">
                <Separator />
                <h4 className="text-sm font-medium">Detailed Earthquake Data</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Seismic Zone</p>
                    <p className="text-sm font-medium">{assessment.earthquakeRisk.seismicZone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance to Fault</p>
                    <p className="text-sm font-medium">{assessment.earthquakeRisk.distanceToFault} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Soil Type</p>
                    <p className="text-sm font-medium">{assessment.earthquakeRisk.soilType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Historical Magnitudes</p>
                    <p className="text-sm font-medium">
                      {assessment.earthquakeRisk.historicalMagnitudes?.length 
                        ? assessment.earthquakeRisk.historicalMagnitudes.join(', ') 
                        : 'None recorded'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Data Quality Indicator */}
        <div className="mt-4 pt-2 border-t">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 mr-1 cursor-help" />
                    <span>Data Quality: {assessment.dataQuality}%</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      This percentage indicates the completeness and reliability of the data used for this risk assessment. 
                      Higher percentages indicate more comprehensive and recent data sources.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {!fullDetailsByDefault && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowDetailedData(!showDetailedData)}
              >
                {showDetailedData ? 'Hide' : 'Show'} Detailed Data
                {showDetailedData ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NaturalHazardRiskAssessment;