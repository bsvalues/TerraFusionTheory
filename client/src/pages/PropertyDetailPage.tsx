/**
 * Property Detail Page
 * 
 * This page displays detailed property information with integrated
 * school district data, economic indicators, hazard risk assessment,
 * and market cycle prediction.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { 
  Home, 
  School,
  TrendingUp,
  ShieldAlert,
  Compass,
  Building,
  Bed,
  Bath,
  Square,
  Calendar,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

import NaturalHazardRiskAssessment from '@/components/property/NaturalHazardRiskAssessment';
import MarketCyclePredictor from '@/components/market/MarketCyclePredictor';
import integratedPropertyDataService, { 
  IntegratedPropertyData,
  RiskLevel,
  MarketPhase
} from '@/services/integrated-property-data.service';
import { cn } from '@/lib/utils';
import { useComparison } from '../context/ComparisonContext';

// Mock property images
const mockPropertyImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

const PropertyDetailPage: React.FC = () => {
  const [property, setProperty] = useState<IntegratedPropertyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  const params = useParams<{ propertyId: string }>();
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        // Use the integrated service to get property data
        const data = await integratedPropertyDataService.getPropertyById(
          params.propertyId || 'default-1'
        );
        setProperty(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching property data:', err);
        setError('Failed to load property data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [params.propertyId]);
  
  const navigateToImage = (index: number) => {
    if (index < 0) {
      setCurrentImageIndex(mockPropertyImages.length - 1);
    } else if (index >= mockPropertyImages.length) {
      setCurrentImageIndex(0);
    } else {
      setCurrentImageIndex(index);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  if (error || !property) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error Loading Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Property not found'}</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-4 space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/property-comparison?ids=${property.propertyId}`)}
          className="flex items-center"
        >
          <TrendingUp className="mr-1 h-4 w-4" />
          Compare
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Property basics and images */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{property.address}</CardTitle>
                  <CardDescription>
                    {property.city}, {property.state} {property.zip}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${property.price.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    ${Math.round(property.price / property.squareFeet).toLocaleString()} per sq ft
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <div className="relative aspect-video">
              <img
                src={mockPropertyImages[currentImageIndex]}
                alt={`Property ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              <Button
                variant="ghost" 
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full h-10 w-10"
                onClick={() => navigateToImage(currentImageIndex - 1)}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full h-10 w-10"
                onClick={() => navigateToImage(currentImageIndex + 1)}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {mockPropertyImages.map((_, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-2 min-w-0 w-8 p-0 rounded-full",
                      index === currentImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
                    )}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
            
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Bed className="h-4 w-4 mr-1" />
                    <span className="text-sm">Bedrooms</span>
                  </div>
                  <span className="font-bold text-lg">{property.bedrooms}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Bath className="h-4 w-4 mr-1" />
                    <span className="text-sm">Bathrooms</span>
                  </div>
                  <span className="font-bold text-lg">{property.bathrooms}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Square className="h-4 w-4 mr-1" />
                    <span className="text-sm">Square Feet</span>
                  </div>
                  <span className="font-bold text-lg">{property.squareFeet.toLocaleString()}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">Year Built</span>
                  </div>
                  <span className="font-bold text-lg">{property.yearBuilt}</span>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="schools">Schools</TabsTrigger>
                  <TabsTrigger value="investment">Investment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Property Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Property Type</span>
                            <span className="font-medium">
                              {property.propertyType === 'single_family' ? 'Single Family' : 
                               property.propertyType === 'multi_family' ? 'Multi-Family' :
                               property.propertyType === 'condo' ? 'Condominium' :
                               property.propertyType === 'townhouse' ? 'Townhouse' :
                               property.propertyType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lot Size</span>
                            <span className="font-medium">{property.lotSize} acres</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Year Built</span>
                            <span className="font-medium">{property.yearBuilt}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bedrooms</span>
                            <span className="font-medium">{property.bedrooms}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bathrooms</span>
                            <span className="font-medium">{property.bathrooms}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Square Feet</span>
                            <span className="font-medium">{property.squareFeet.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {property.economicIndicators && (
                      <div>
                        <h3 className="font-medium text-lg mb-2">Local Economic Indicators</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Unemployment</span>
                              <span className="font-medium">{property.economicIndicators.unemployment}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Job Growth</span>
                              <span className="font-medium">+{property.economicIndicators.jobGrowth}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Median Income</span>
                              <span className="font-medium">${property.economicIndicators.medianHouseholdIncome.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Median Home Price</span>
                              <span className="font-medium">${property.economicIndicators.medianHomePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Home Value Growth</span>
                              <span className="font-medium">{property.economicIndicators.homeValueGrowth}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Economic Outlook</span>
                              <span className={cn(
                                "font-medium",
                                property.economicIndicators.economicOutlook === 'improving' ? 'text-green-600' :
                                property.economicIndicators.economicOutlook === 'declining' ? 'text-red-600' :
                                'text-amber-600'
                              )}>
                                {property.economicIndicators.economicOutlook.charAt(0).toUpperCase() + 
                                 property.economicIndicators.economicOutlook.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-1">Economic Health Score</div>
                          <div className="flex items-center">
                            <Progress 
                              value={property.economicIndicators.economicHealthScore} 
                              className="h-2 flex-grow" 
                            />
                            <span className="ml-2 text-sm">{property.economicIndicators.economicHealthScore}/100</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {property.naturalHazardRisks && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-lg">Natural Hazard Risk</h3>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActiveTab('hazards')}
                          >
                            View Details
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1">Flood Risk</div>
                            <Badge 
                              variant={property.naturalHazardRisks.floodRisk === RiskLevel.LOW ? "secondary" : "outline"}
                              className={cn(
                                property.naturalHazardRisks.floodRisk === RiskLevel.HIGH && "text-amber-600",
                                property.naturalHazardRisks.floodRisk === RiskLevel.VERY_HIGH && "text-orange-600",
                                property.naturalHazardRisks.floodRisk === RiskLevel.EXTREME && "text-red-600 border-red-600"
                              )}
                            >
                              {property.naturalHazardRisks.floodRisk.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1">Wildfire Risk</div>
                            <Badge 
                              variant={property.naturalHazardRisks.wildfireRisk === RiskLevel.LOW ? "secondary" : "outline"}
                              className={cn(
                                property.naturalHazardRisks.wildfireRisk === RiskLevel.HIGH && "text-amber-600",
                                property.naturalHazardRisks.wildfireRisk === RiskLevel.VERY_HIGH && "text-orange-600",
                                property.naturalHazardRisks.wildfireRisk === RiskLevel.EXTREME && "text-red-600 border-red-600"
                              )}
                            >
                              {property.naturalHazardRisks.wildfireRisk.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1">Earthquake Risk</div>
                            <Badge 
                              variant={property.naturalHazardRisks.earthquakeRisk === RiskLevel.LOW ? "secondary" : "outline"}
                              className={cn(
                                property.naturalHazardRisks.earthquakeRisk === RiskLevel.HIGH && "text-amber-600",
                                property.naturalHazardRisks.earthquakeRisk === RiskLevel.VERY_HIGH && "text-orange-600",
                                property.naturalHazardRisks.earthquakeRisk === RiskLevel.EXTREME && "text-red-600 border-red-600"
                              )}
                            >
                              {property.naturalHazardRisks.earthquakeRisk.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1">Overall Risk</div>
                            <Badge 
                              variant={property.naturalHazardRisks.overallRisk === RiskLevel.LOW ? "secondary" : "outline"}
                              className={cn(
                                property.naturalHazardRisks.overallRisk === RiskLevel.HIGH && "text-amber-600",
                                property.naturalHazardRisks.overallRisk === RiskLevel.VERY_HIGH && "text-orange-600",
                                property.naturalHazardRisks.overallRisk === RiskLevel.EXTREME && "text-red-600 border-red-600"
                              )}
                            >
                              {property.naturalHazardRisks.overallRisk.replace('_', ' ').toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-2 text-sm border-l-4 border-amber-500 pl-2 py-1 bg-amber-50">
                          <Info className="h-4 w-4 mr-1 text-amber-500" />
                          <span>Insurance impact: <span className="font-medium">+{property.naturalHazardRisks.insuranceImpact.estimatedPremiumIncrease}%</span> est. premium increase</span>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="schools" className="pt-4">
                  <div className="space-y-4">
                    {property.schoolDistrict && (
                      <div>
                        <h3 className="font-medium text-lg mb-2">School District</h3>
                        <div className="flex items-center mb-3">
                          <School className="h-5 w-5 mr-2 text-blue-500" />
                          <span className="font-medium">{property.schoolDistrict.name}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">District Rating</span>
                              <span className="font-medium">{property.schoolDistrict.averageRating}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Students</span>
                              <span className="font-medium">{property.schoolDistrict.studentPopulation.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Student Demographics</span>
                              <span className="font-medium">
                                {property.schoolDistrict.demographicData?.economicallyDisadvantaged || 0}% LD
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Performance Trend</span>
                              <span className="font-medium">
                                {property.schoolDistrict.performanceTrend || 'Stable'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Math Score</span>
                              <span className="font-medium">{property.schoolDistrict.averageTestScores.math}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Per-Pupil Spending</span>
                              <span className="font-medium">${property.schoolDistrict.budgetPerStudent?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {property.nearbySchools && property.nearbySchools.length > 0 && (
                      <div>
                        <h3 className="font-medium text-lg mb-3">Nearby Schools</h3>
                        
                        <div className="space-y-3">
                          {property.nearbySchools.map((school, index) => (
                            <div key={index} className="border rounded-md p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium">{school.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {school.type.charAt(0).toUpperCase() + school.type.slice(1)} School
                                    {school.gradeRange && ` • Grades ${school.gradeRange}`}
                                  </div>
                                </div>
                                <Badge>
                                  {school.rating}/10
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Distance</div>
                                  <div className="font-medium">{school.distance.toFixed(1)} miles</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Students</div>
                                  <div className="font-medium">{school.enrollment.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Student/Teacher</div>
                                  <div className="font-medium">{school.studentTeacherRatio}:1</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {property.schoolScorecard && (
                      <>
                        <Separator />
                        
                        <div>
                          <h3 className="font-medium text-lg mb-2">School Impact on Property Value</h3>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">School Quality Impact</span>
                              <span className="font-medium text-green-600">+{property.schoolScorecard.schoolQualityImpactOnValue.toFixed(1)}%</span>
                            </div>
                            
                            <div>
                              <div className="text-sm mb-1">Impact on Property Value</div>
                              <Progress 
                                value={property.schoolScorecard.schoolQualityImpactOnValue / 0.2} 
                                className="h-2" 
                              />
                              <div className="flex justify-between text-xs mt-1">
                                <span>0%</span>
                                <span>5%</span>
                                <span>10%</span>
                                <span>15%</span>
                                <span>20%</span>
                              </div>
                            </div>
                            
                            <div className="bg-blue-50 p-3 rounded-md text-sm">
                              <p>
                                <span className="font-medium">{property.schoolScorecard.bestSchoolName}</span> is 
                                the highest-rated nearby school with a rating of 
                                <span className="font-medium"> {property.schoolScorecard.bestSchoolRating}/10</span>. 
                                The average rating of all nearby schools is 
                                <span className="font-medium"> {property.schoolScorecard.averageRating.toFixed(1)}/10</span>.
                              </p>
                              <p className="mt-1">
                                The closest school is <span className="font-medium">{property.schoolScorecard.distanceToNearestSchool.toFixed(1)} miles</span> away.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="investment" className="pt-4">
                  {property.investmentMetrics && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-lg mb-2">Investment Analysis</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="border rounded-md p-4">
                            <div className="flex items-center mb-3">
                              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                              <h4 className="font-medium">Rental Income Potential</h4>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Est. Monthly Rent</span>
                                <span className="font-medium">${property.investmentMetrics.estimatedRentalIncome.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Annual Rental Yield</span>
                                <span className="font-medium">
                                  {((property.investmentMetrics.estimatedRentalIncome * 12) / property.price * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cap Rate</span>
                                <span className="font-medium">{property.investmentMetrics.capRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cash on Cash Return</span>
                                <span className="font-medium">{property.investmentMetrics.cashOnCashReturn}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Break-even Point</span>
                                <span className="font-medium">{property.investmentMetrics.breakEvenPoint} months</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-4">
                            <div className="flex items-center mb-3">
                              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                              <h4 className="font-medium">Market Metrics</h4>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Price to Income Ratio</span>
                                <span className="font-medium">{property.investmentMetrics.priceToIncomeRatio}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Price to Rent Ratio</span>
                                <span className="font-medium">{property.investmentMetrics.priceToRentRatio}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">5-Year Appreciation</span>
                                <span className="font-medium">+{property.investmentMetrics.appreciationPotential}% est.</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Investment Score</span>
                                <div className="flex items-center">
                                  <Badge variant="outline" className="mr-2">
                                    {property.investmentMetrics.overallInvestmentScore}/100
                                  </Badge>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs text-xs">
                                          Investment score considers multiple factors including cap rate, 
                                          cash flow, appreciation potential, local market metrics, and risk factors.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-1">Investment Quality</div>
                          <div className="flex items-center">
                            <Progress 
                              value={property.investmentMetrics.overallInvestmentScore} 
                              className={cn(
                                "h-2 flex-grow",
                                property.investmentMetrics.overallInvestmentScore >= 80 ? "bg-green-500" :
                                property.investmentMetrics.overallInvestmentScore >= 60 ? "bg-blue-500" :
                                property.investmentMetrics.overallInvestmentScore >= 40 ? "bg-amber-500" :
                                "bg-red-500"
                              )} 
                            />
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span>Poor</span>
                            <span>Fair</span>
                            <span>Good</span>
                            <span>Excellent</span>
                          </div>
                        </div>
                      </div>
                      
                      {property.marketCyclePrediction && (
                        <>
                          <Separator />
                          
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium text-lg">Market Cycle Analysis</h3>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setActiveTab('market-cycle')}
                              >
                                View Full Analysis
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Current Phase</span>
                                  <Badge className={cn(
                                    property.marketCyclePrediction.currentPhase === MarketPhase.RECOVERY && "bg-green-100 text-green-800",
                                    property.marketCyclePrediction.currentPhase === MarketPhase.EXPANSION && "bg-blue-100 text-blue-800",
                                    property.marketCyclePrediction.currentPhase === MarketPhase.HYPER_SUPPLY && "bg-amber-100 text-amber-800",
                                    property.marketCyclePrediction.currentPhase === MarketPhase.RECESSION && "bg-red-100 text-red-800"
                                  )}>
                                    {property.marketCyclePrediction.currentPhase.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Next Phase</span>
                                  <span className="font-medium">
                                    {property.marketCyclePrediction.nextPhase.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time to Next Phase</span>
                                  <span className="font-medium">{property.marketCyclePrediction.estimatedTimeToNextPhase} months</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Prediction Confidence</span>
                                  <span className="font-medium">{property.marketCyclePrediction.confidenceLevel}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Historical Comparison</span>
                                  <span className="font-medium">{property.marketCyclePrediction.historicalCycleComparison.similarityScore}% similar</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Top Indicator</span>
                                  <span className="font-medium">
                                    {property.marketCyclePrediction.keyIndicators[0].name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <h4 className="text-sm font-medium mb-1">Strategic Recommendation</h4>
                              <div className="text-sm border-l-4 border-blue-500 pl-2 py-1 bg-blue-50">
                                {property.marketCyclePrediction.investmentStrategyRecommendations[0]}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Detailed analysis components */}
        <div className="space-y-6">
          {property.naturalHazardRisks && (
            <NaturalHazardRiskAssessment 
              riskData={property.naturalHazardRisks}
              property={{
                address: property.address,
                city: property.city,
                state: property.state
              }}
              compact={true}
            />
          )}
          
          {property.marketCyclePrediction && (
            <MarketCyclePredictor 
              predictionData={property.marketCyclePrediction}
              location={{
                city: property.city,
                state: property.state
              }}
            />
          )}
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Property Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-slate-100 rounded-md flex items-center justify-center">
                <div className="text-center p-4">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Interactive map would display here, showing property location, nearby schools, and amenities
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Walk Score</span>
                  <span className="font-medium">78/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transit Score</span>
                  <span className="font-medium">65/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bike Score</span>
                  <span className="font-medium">82/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Contact Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4">
                <p className="text-muted-foreground mb-4">
                  Interested in this property? Contact an agent to schedule a viewing or ask questions.
                </p>
                <Button className="w-full mb-3">Contact Agent</Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => integratedPropertyDataService.searchProperties({
                    city: property.city,
                    state: property.state
                  }).then(similarProperties => {
                    // Get up to 3 similar properties including current one
                    const propertyIds = [
                      property.propertyId,
                      ...similarProperties
                        .filter(p => p.propertyId !== property.propertyId)
                        .slice(0, 2)
                        .map(p => p.propertyId)
                    ];
                    navigate(`/property-comparison?ids=${propertyIds.join(',')}`);
                  })}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Compare with Similar Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;