import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Droplet, 
  Flame, 
  AlertTriangle, 
  Info,
  Shield,
  Waves
} from 'lucide-react';

enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme'
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

interface PropertyRiskAssessment {
  propertyId: string;
  floodRisk: FloodRisk;
  fireRisk: FireRisk;
  earthquakeRisk: EarthquakeRisk;
  overallRisk: RiskLevel;
}

interface NaturalHazardRiskAssessmentProps {
  propertyId?: string;
  latitude?: number;
  longitude?: number;
}

const NaturalHazardRiskAssessment: React.FC<NaturalHazardRiskAssessmentProps> = ({
  propertyId = "sample-property-123",
  latitude = 47.042418,
  longitude = -122.893077
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Sample risk assessment data
  const riskAssessment: PropertyRiskAssessment = {
    propertyId,
    floodRisk: {
      level: RiskLevel.LOW,
      zone: "X",
      probability: 15
    },
    fireRisk: {
      level: RiskLevel.MODERATE,
      wildfire: 35,
      structural: 20
    },
    earthquakeRisk: {
      level: RiskLevel.HIGH,
      magnitude: 6.8,
      probability: 75
    },
    overallRisk: RiskLevel.MODERATE
  };

  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.LOW:
        return 'bg-green-500';
      case RiskLevel.MODERATE:
        return 'bg-yellow-500';
      case RiskLevel.HIGH:
        return 'bg-orange-500';
      case RiskLevel.EXTREME:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskBadgeVariant = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW:
        return 'default';
      case RiskLevel.MODERATE:
        return 'secondary';
      case RiskLevel.HIGH:
        return 'destructive';
      case RiskLevel.EXTREME:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Natural Hazard Risk Assessment
          </CardTitle>
          <CardDescription>
            Comprehensive risk analysis for natural disasters and environmental hazards
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Droplet className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-semibold">Flood Risk</h3>
                    <p className="text-sm text-muted-foreground">Zone {riskAssessment.floodRisk.zone}</p>
                  </div>
                </div>
                <Badge variant={getRiskBadgeVariant(riskAssessment.floodRisk.level)}>
                  {riskAssessment.floodRisk.level.toUpperCase()}
                </Badge>
              </div>
              <Progress value={riskAssessment.floodRisk.probability} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {riskAssessment.floodRisk.probability}% probability
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Flame className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <h3 className="font-semibold">Fire Risk</h3>
                    <p className="text-sm text-muted-foreground">Wildfire & Structural</p>
                  </div>
                </div>
                <Badge variant={getRiskBadgeVariant(riskAssessment.fireRisk.level)}>
                  {riskAssessment.fireRisk.level.toUpperCase()}
                </Badge>
              </div>
              <Progress value={riskAssessment.fireRisk.wildfire} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {riskAssessment.fireRisk.wildfire}% wildfire risk
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <h3 className="font-semibold">Earthquake Risk</h3>
                    <p className="text-sm text-muted-foreground">Magnitude {riskAssessment.earthquakeRisk.magnitude}</p>
                  </div>
                </div>
                <Badge variant={getRiskBadgeVariant(riskAssessment.earthquakeRisk.level)}>
                  {riskAssessment.earthquakeRisk.level.toUpperCase()}
                </Badge>
              </div>
              <Progress value={riskAssessment.earthquakeRisk.probability} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {riskAssessment.earthquakeRisk.probability}% probability
              </p>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="flood">Flood</TabsTrigger>
              <TabsTrigger value="fire">Fire</TabsTrigger>
              <TabsTrigger value="earthquake">Earthquake</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium">Overall Risk Level</span>
                      <Badge variant={getRiskBadgeVariant(riskAssessment.overallRisk)} className="text-sm">
                        {riskAssessment.overallRisk.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Info className="h-4 w-4 inline mr-2" />
                      This assessment is based on historical data, geological surveys, and current environmental conditions.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flood" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Waves className="h-5 w-5 mr-2" />
                    Flood Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Flood Zone</h4>
                        <p className="text-2xl font-bold">{riskAssessment.floodRisk.zone}</p>
                        <p className="text-sm text-muted-foreground">FEMA Designation</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Annual Probability</h4>
                        <p className="text-2xl font-bold">{riskAssessment.floodRisk.probability}%</p>
                        <p className="text-sm text-muted-foreground">Based on historical data</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fire" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Flame className="h-5 w-5 mr-2" />
                    Fire Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Wildfire Risk</h4>
                        <p className="text-2xl font-bold">{riskAssessment.fireRisk.wildfire}%</p>
                        <p className="text-sm text-muted-foreground">Vegetation & Climate</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Structural Risk</h4>
                        <p className="text-2xl font-bold">{riskAssessment.fireRisk.structural}%</p>
                        <p className="text-sm text-muted-foreground">Building Materials</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earthquake" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Earthquake Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Expected Magnitude</h4>
                        <p className="text-2xl font-bold">{riskAssessment.earthquakeRisk.magnitude}</p>
                        <p className="text-sm text-muted-foreground">Richter Scale</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Probability</h4>
                        <p className="text-2xl font-bold">{riskAssessment.earthquakeRisk.probability}%</p>
                        <p className="text-sm text-muted-foreground">Next 50 years</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NaturalHazardRiskAssessment;