import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  RadarChart, 
  Radar,
  ResponsiveContainer 
} from 'recharts';
import { 
  IntegratedPropertyData, 
  RiskLevel,
  MarketPhase 
} from '@/services/integrated-property-data.service';
import integratedPropertyDataService from '@/services/integrated-property-data.service';
import NaturalHazardRiskAssessment from '@/components/property/NaturalHazardRiskAssessment';
import MarketCyclePredictor from '@/components/market/MarketCyclePredictor';
import SchoolDistrictMap from '@/components/school-district/SchoolDistrictMap';
import { ArrowLeft, Home, School, Building, BarChart3, AlertTriangle, LayoutDashboard } from 'lucide-react';

export default function PropertyComparisonPage() {
  const [location, setLocation] = useLocation();
  const [properties, setProperties] = useState<IntegratedPropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Get URL params to extract property IDs
        const params = new URLSearchParams(window.location.search);
        const propertyIds = params.get('ids')?.split(',') || [];
        
        if (propertyIds.length === 0) {
          // If no properties specified, use some default ones for demo
          const defaultProperties = await integratedPropertyDataService.searchProperties({
            city: 'Richland',
            state: 'WA'
          });
          setProperties(defaultProperties.slice(0, 3)); // Compare up to 3 properties
        } else {
          // Fetch each specified property
          const fetchedProperties: IntegratedPropertyData[] = [];
          for (const id of propertyIds) {
            const property = await integratedPropertyDataService.getPropertyById(id);
            fetchedProperties.push(property);
          }
          setProperties(fetchedProperties);
        }
      } catch (error) {
        console.error('Error fetching properties for comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Helper function to get color based on rating value (0-10)
  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  // Helper function to get color based on risk level
  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case RiskLevel.LOW: return 'bg-green-100 text-green-800';
      case RiskLevel.MODERATE: return 'bg-amber-100 text-amber-800';
      case RiskLevel.HIGH: return 'bg-orange-100 text-orange-800';
      case RiskLevel.VERY_HIGH: return 'bg-red-100 text-red-800';
      case RiskLevel.EXTREME: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get color based on market phase
  const getMarketPhaseColor = (phase: MarketPhase): string => {
    switch (phase) {
      case MarketPhase.RECOVERY: return 'bg-green-100 text-green-800';
      case MarketPhase.EXPANSION: return 'bg-blue-100 text-blue-800';
      case MarketPhase.HYPER_SUPPLY: return 'bg-amber-100 text-amber-800';
      case MarketPhase.RECESSION: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No properties selected for comparison</h3>
              <p className="text-muted-foreground mb-6">Please select properties to compare or return to the search page.</p>
              <Button onClick={() => setLocation('/')}>
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Property Comparison</h1>
          <p className="text-muted-foreground">
            Compare {properties.length} properties across multiple metrics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-6">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schools">
            <School className="h-4 w-4 mr-2" />
            Schools
          </TabsTrigger>
          <TabsTrigger value="economic">
            <Building className="h-4 w-4 mr-2" />
            Economic
          </TabsTrigger>
          <TabsTrigger value="hazards">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Hazards
          </TabsTrigger>
          <TabsTrigger value="market">
            <BarChart3 className="h-4 w-4 mr-2" />
            Market
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Property Overview</CardTitle>
              <CardDescription>
                Key information about each property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {properties.map(property => (
                      <TableHead key={property.propertyId}>
                        {property.address}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        ${property.price.toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bedrooms</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.bedrooms}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bathrooms</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.bathrooms}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Square Feet</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.squareFeet.toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Year Built</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.yearBuilt}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lot Size (acres)</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.lotSize}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">School Rating</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolScorecard ? (
                          <span className={getRatingColor(property.schoolScorecard.averageRating)}>
                            {property.schoolScorecard.averageRating.toFixed(1)}/10
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Overall Hazard Risk</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks ? (
                          <Badge className={getRiskColor(property.naturalHazardRisks.overallRisk)}>
                            {property.naturalHazardRisks.overallRisk}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Market Phase</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.marketCyclePrediction ? (
                          <Badge className={getMarketPhaseColor(property.marketCyclePrediction.currentPhase)}>
                            {property.marketCyclePrediction.currentPhase}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Economic Health</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <div className="w-full">
                            <Progress value={property.economicIndicators.economicHealthScore} className="h-2 mb-1" />
                            <span className="text-xs">
                              {property.economicIndicators.economicHealthScore}/100
                            </span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Investment Score</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.investmentMetrics ? (
                          <div className="w-full">
                            <Progress value={property.investmentMetrics.overallInvestmentScore} className="h-2 mb-1" />
                            <span className="text-xs">
                              {property.investmentMetrics.overallInvestmentScore}/100
                            </span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <CardTitle>School Comparison</CardTitle>
              <CardDescription>
                Compare school districts and nearby schools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Metrics</TableHead>
                    {properties.map(property => (
                      <TableHead key={property.propertyId}>
                        {property.address}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">District</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolDistrict ? (
                          property.schoolDistrict.name
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Average School Rating</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolScorecard ? (
                          <span className={getRatingColor(property.schoolScorecard.averageRating)}>
                            {property.schoolScorecard.averageRating.toFixed(1)}/10
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Best School</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolScorecard ? (
                          <div>
                            <div>{property.schoolScorecard.bestSchoolName}</div>
                            <Badge className="mt-1">
                              {property.schoolScorecard.bestSchoolRating}/10
                            </Badge>
                          </div>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Student/Teacher Ratio</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolScorecard ? (
                          `${property.schoolScorecard.studentTeacherRatioAvg.toFixed(1)}:1`
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Nearest School</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolScorecard ? (
                          `${property.schoolScorecard.distanceToNearestSchool.toFixed(1)} miles`
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Value Impact</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.schoolScorecard ? (
                          <span className={
                            property.schoolScorecard.schoolQualityImpactOnValue > 10 
                              ? 'text-green-600' 
                              : property.schoolScorecard.schoolQualityImpactOnValue > 5 
                                ? 'text-amber-600' 
                                : 'text-gray-600'
                          }>
                            +{property.schoolScorecard.schoolQualityImpactOnValue.toFixed(1)}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Nearby Schools</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId} className="align-top">
                        {property.nearbySchools && property.nearbySchools.length > 0 ? (
                          <div className="space-y-1">
                            {property.nearbySchools.slice(0, 3).map(school => (
                              <div key={school.id} className="text-xs">
                                <div className="font-medium">{school.name}</div>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {school.type}
                                  </Badge>
                                  <span className="text-xs">{school.distance.toFixed(1)} mi</span>
                                </div>
                              </div>
                            ))}
                            {property.nearbySchools.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{property.nearbySchools.length - 3} more schools
                              </div>
                            )}
                          </div>
                        ) : (
                          "No nearby schools"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">School District Maps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map(property => (
                    <Card key={property.propertyId} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">{property.address}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {property.schoolDistrict && (
                          <div className="h-48">
                            <SchoolDistrictMap 
                              initialCity={property.city}
                              initialState={property.state}
                              height="100%"
                              width="100%"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Economic Tab */}
        <TabsContent value="economic">
          <Card>
            <CardHeader>
              <CardTitle>Economic Indicators Comparison</CardTitle>
              <CardDescription>
                Compare economic factors and market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Economic Metrics</TableHead>
                    {properties.map(property => (
                      <TableHead key={property.propertyId}>
                        {property.address}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Region</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          property.economicIndicators.regionName
                        ) : (
                          `${property.city}, ${property.state}`
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Economic Health Score</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <div className="w-full">
                            <Progress value={property.economicIndicators.economicHealthScore} className="h-2 mb-1" />
                            <span className="text-xs">
                              {property.economicIndicators.economicHealthScore}/100
                            </span>
                          </div>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Economic Outlook</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <Badge className={
                            property.economicIndicators.economicOutlook === 'improving' 
                              ? 'bg-green-100 text-green-800' 
                              : property.economicIndicators.economicOutlook === 'stable' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-amber-100 text-amber-800'
                          }>
                            {property.economicIndicators.economicOutlook}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Unemployment Rate</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <span className={
                            property.economicIndicators.unemployment < 4
                              ? 'text-green-600'
                              : property.economicIndicators.unemployment < 6
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }>
                            {property.economicIndicators.unemployment}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Job Growth</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <span className={
                            property.economicIndicators.jobGrowth > 2
                              ? 'text-green-600'
                              : property.economicIndicators.jobGrowth > 0
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }>
                            {property.economicIndicators.jobGrowth > 0 ? '+' : ''}
                            {property.economicIndicators.jobGrowth}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Median Household Income</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          `$${property.economicIndicators.medianHouseholdIncome.toLocaleString()}`
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Median Home Price</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          `$${property.economicIndicators.medianHomePrice.toLocaleString()}`
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Home Value Growth</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <span className={
                            property.economicIndicators.homeValueGrowth > 5
                              ? 'text-green-600'
                              : property.economicIndicators.homeValueGrowth > 0
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }>
                            {property.economicIndicators.homeValueGrowth > 0 ? '+' : ''}
                            {property.economicIndicators.homeValueGrowth}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Affordability Index</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.economicIndicators ? (
                          <span className={
                            property.economicIndicators.affordabilityIndex > 100
                              ? 'text-green-600'
                              : property.economicIndicators.affordabilityIndex > 80
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }>
                            {property.economicIndicators.affordabilityIndex.toFixed(1)}
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hazards Tab */}
        <TabsContent value="hazards">
          <Card>
            <CardHeader>
              <CardTitle>Natural Hazard Risk Comparison</CardTitle>
              <CardDescription>
                Compare hazard risks and mitigation measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk Metrics</TableHead>
                    {properties.map(property => (
                      <TableHead key={property.propertyId}>
                        {property.address}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Overall Risk</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks ? (
                          <Badge className={getRiskColor(property.naturalHazardRisks.overallRisk)}>
                            {property.naturalHazardRisks.overallRisk}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Flood Risk</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks ? (
                          <Badge className={getRiskColor(property.naturalHazardRisks.floodRisk)}>
                            {property.naturalHazardRisks.floodRisk}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Wildfire Risk</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks ? (
                          <Badge className={getRiskColor(property.naturalHazardRisks.wildfireRisk)}>
                            {property.naturalHazardRisks.wildfireRisk}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Earthquake Risk</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks ? (
                          <Badge className={getRiskColor(property.naturalHazardRisks.earthquakeRisk)}>
                            {property.naturalHazardRisks.earthquakeRisk}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Insurance Impact</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks?.insuranceImpact ? (
                          <span className={
                            property.naturalHazardRisks.insuranceImpact.estimatedPremiumIncrease > 10
                              ? 'text-red-600'
                              : property.naturalHazardRisks.insuranceImpact.estimatedPremiumIncrease > 5
                                ? 'text-amber-600'
                                : 'text-green-600'
                          }>
                            +{property.naturalHazardRisks.insuranceImpact.estimatedPremiumIncrease}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Recommended Coverage</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.naturalHazardRisks?.insuranceImpact?.coverageRecommendations ? (
                          <ul className="list-disc pl-4 text-xs">
                            {property.naturalHazardRisks.insuranceImpact.coverageRecommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(property => (
                  <Card key={property.propertyId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{property.address}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {property.naturalHazardRisks ? (
                        <NaturalHazardRiskAssessment 
                          riskData={property.naturalHazardRisks} 
                          compact={true} 
                        />
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No hazard risk data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Cycle Comparison</CardTitle>
              <CardDescription>
                Compare market cycles and investment potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market Metrics</TableHead>
                    {properties.map(property => (
                      <TableHead key={property.propertyId}>
                        {property.address}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Current Phase</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.marketCyclePrediction ? (
                          <Badge className={getMarketPhaseColor(property.marketCyclePrediction.currentPhase)}>
                            {property.marketCyclePrediction.currentPhase}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Next Phase</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.marketCyclePrediction ? (
                          <Badge variant="outline">
                            {property.marketCyclePrediction.nextPhase}
                          </Badge>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Time to Next Phase</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.marketCyclePrediction ? (
                          `${property.marketCyclePrediction.estimatedTimeToNextPhase} months`
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Confidence Level</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.marketCyclePrediction ? (
                          <div className="w-full">
                            <Progress 
                              value={property.marketCyclePrediction.confidenceLevel} 
                              className="h-2 mb-1" 
                            />
                            <span className="text-xs">
                              {property.marketCyclePrediction.confidenceLevel}%
                            </span>
                          </div>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Historical Similarity</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.marketCyclePrediction?.historicalCycleComparison ? (
                          <div>
                            <div className="text-xs mb-1">
                              {property.marketCyclePrediction.historicalCycleComparison.similarHistoricalPeriod}
                            </div>
                            <Badge variant="outline">
                              {property.marketCyclePrediction.historicalCycleComparison.similarityScore}% similar
                            </Badge>
                          </div>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Investment Score</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.investmentMetrics ? (
                          <div className="w-full">
                            <Progress value={property.investmentMetrics.overallInvestmentScore} className="h-2 mb-1" />
                            <span className="text-xs">
                              {property.investmentMetrics.overallInvestmentScore}/100
                            </span>
                          </div>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Estimated Rental</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.investmentMetrics ? (
                          `$${property.investmentMetrics.estimatedRentalIncome.toLocaleString()}/mo`
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Cap Rate</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.investmentMetrics ? (
                          <span className={
                            property.investmentMetrics.capRate > 7
                              ? 'text-green-600'
                              : property.investmentMetrics.capRate > 5
                                ? 'text-amber-600'
                                : 'text-gray-600'
                          }>
                            {property.investmentMetrics.capRate}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Cash on Cash Return</TableCell>
                    {properties.map(property => (
                      <TableCell key={property.propertyId}>
                        {property.investmentMetrics ? (
                          <span className={
                            property.investmentMetrics.cashOnCashReturn > 8
                              ? 'text-green-600'
                              : property.investmentMetrics.cashOnCashReturn > 5
                                ? 'text-amber-600'
                                : 'text-gray-600'
                          }>
                            {property.investmentMetrics.cashOnCashReturn}%
                          </span>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(property => (
                  <Card key={property.propertyId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{property.address}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {property.marketCyclePrediction ? (
                        <MarketCyclePredictor 
                          predictionData={property.marketCyclePrediction} 
                          location={{city: property.city, state: property.state}}
                        />
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No market cycle data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}