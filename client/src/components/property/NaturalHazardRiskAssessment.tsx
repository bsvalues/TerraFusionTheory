/**
 * Natural Hazard Risk Assessment Component
 * 
 * This component displays comprehensive risk assessment for natural hazards
 * including flood, wildfire, earthquake, and drought risks for a property.
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  DropletIcon, 
  Flame, 
  AlertTriangle, 
  CloudRain, 
  Wind, 
  ThermometerIcon, 
  ShieldAlert,
  DollarSign,
  HelpCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { NaturalHazardRisk, RiskLevel } from '@/services/integrated-property-data.service';

// Define component props
interface NaturalHazardRiskAssessmentProps {
  riskData: NaturalHazardRisk;
  property?: {
    address: string;
    city: string;
    state: string;
  };
  showTitle?: boolean;
  className?: string;
  compact?: boolean;
}

// Helper function to get risk level color
const getRiskLevelColor = (level: RiskLevel): string => {
  switch (level) {
    case RiskLevel.LOW:
      return 'bg-green-500';
    case RiskLevel.MODERATE:
      return 'bg-blue-500';
    case RiskLevel.HIGH:
      return 'bg-amber-500';
    case RiskLevel.VERY_HIGH:
      return 'bg-orange-500';
    case RiskLevel.EXTREME:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper function to get risk level text color
const getRiskLevelTextColor = (level: RiskLevel): string => {
  switch (level) {
    case RiskLevel.LOW:
      return 'text-green-600';
    case RiskLevel.MODERATE:
      return 'text-blue-600';
    case RiskLevel.HIGH:
      return 'text-amber-600';
    case RiskLevel.VERY_HIGH:
      return 'text-orange-600';
    case RiskLevel.EXTREME:
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

// Helper function to get risk level badge variant
const getRiskLevelBadgeVariant = (level: RiskLevel): "default" | "destructive" | "outline" | "secondary" => {
  switch (level) {
    case RiskLevel.LOW:
      return 'secondary';
    case RiskLevel.MODERATE:
      return 'outline';
    case RiskLevel.HIGH:
      return 'outline';
    case RiskLevel.VERY_HIGH:
      return 'outline';
    case RiskLevel.EXTREME:
      return 'destructive';
    default:
      return 'outline';
  }
};

// Helper function to get risk level in text
const getRiskLevelText = (level: RiskLevel): string => {
  return level.replace('_', ' ').toLowerCase();
};

// Helper to get progress color
const getProgressColor = (value: number): string => {
  if (value < 20) return 'bg-green-500';
  if (value < 40) return 'bg-blue-500';
  if (value < 60) return 'bg-amber-500';
  if (value < 80) return 'bg-orange-500';
  return 'bg-red-500';
};

// Risk icon component
const RiskIcon: React.FC<{ 
  riskType: 'flood' | 'wildfire' | 'earthquake' | 'drought' | 'hurricane' | 'tornado' | 'overall';
  level: RiskLevel;
  className?: string;
}> = ({ riskType, level, className }) => {
  const iconClassName = cn(
    "h-6 w-6",
    getRiskLevelTextColor(level),
    className
  );
  
  switch (riskType) {
    case 'flood':
      return <DropletIcon className={iconClassName} />;
    case 'wildfire':
      return <Flame className={iconClassName} />;
    case 'earthquake':
      return <AlertTriangle className={iconClassName} />;
    case 'drought':
      return <ThermometerIcon className={iconClassName} />;
    case 'hurricane':
      return <Wind className={iconClassName} />;
    case 'tornado':
      return <Wind className={iconClassName} />;
    case 'overall':
      return <ShieldAlert className={iconClassName} />;
    default:
      return <HelpCircle className={iconClassName} />;
  }
};

// Risk level card component for compact display
const RiskLevelCard: React.FC<{ 
  label: string;
  level: RiskLevel;
  score: number;
  type: 'flood' | 'wildfire' | 'earthquake' | 'drought' | 'hurricane' | 'tornado' | 'overall';
}> = ({ label, level, score, type }) => {
  return (
    <div className="flex flex-col items-center p-2 border rounded-md">
      <RiskIcon riskType={type} level={level} className="mb-1" />
      <div className="text-sm font-medium mb-1">{label}</div>
      <Badge 
        variant={getRiskLevelBadgeVariant(level)}
        className={cn(
          "mb-1 text-xs",
          level === RiskLevel.EXTREME && "bg-red-600"
        )}
      >
        {getRiskLevelText(level)}
      </Badge>
      <div className="w-full mt-1">
        <Progress 
          value={score} 
          className={cn("h-1", getProgressColor(score))} 
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{score}/100</div>
    </div>
  );
};

// Main component
const NaturalHazardRiskAssessment: React.FC<NaturalHazardRiskAssessmentProps> = ({
  riskData,
  property,
  showTitle = true,
  className,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Define property title
  const propertyTitle = property 
    ? `${property.address}, ${property.city}, ${property.state}` 
    : 'Property';
  
  return (
    <Card className={cn("shadow-md overflow-hidden", className)}>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5" />
            Natural Hazard Risk Assessment
          </CardTitle>
          {property && (
            <CardDescription>
              {propertyTitle}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      <CardContent className={compact ? "px-3 pt-3 pb-0" : undefined}>
        {compact ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <RiskLevelCard 
                label="Flood Risk" 
                level={riskData.floodRisk} 
                score={riskData.riskScores.flood}
                type="flood"
              />
              <RiskLevelCard 
                label="Wildfire Risk" 
                level={riskData.wildfireRisk} 
                score={riskData.riskScores.wildfire}
                type="wildfire"
              />
              <RiskLevelCard 
                label="Earthquake Risk" 
                level={riskData.earthquakeRisk} 
                score={riskData.riskScores.earthquake}
                type="earthquake"
              />
              <RiskLevelCard 
                label="Overall Risk" 
                level={riskData.overallRisk} 
                score={riskData.riskScores.overall}
                type="overall"
              />
            </div>
            
            <div className="text-sm border-t pt-3">
              <p className="text-muted-foreground mb-2">
                {riskData.riskDescription}
              </p>
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-1 text-amber-500" />
                <span className="font-medium">Insurance Impact:</span>
                <span className="ml-1">+{riskData.insuranceImpact.estimatedPremiumIncrease}% est. premium</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="details" className="text-xs">Risk Details</TabsTrigger>
                <TabsTrigger value="insurance" className="text-xs">Insurance</TabsTrigger>
                <TabsTrigger value="mitigation" className="text-xs">Mitigation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex flex-col border rounded-md p-3">
                      <div className="flex items-center mb-2">
                        <DropletIcon className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.floodRisk))} />
                        <h4 className="font-medium">Flood Risk</h4>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Risk Level:</span>
                        <Badge 
                          variant={getRiskLevelBadgeVariant(riskData.floodRisk)}
                          className={cn(
                            riskData.floodRisk === RiskLevel.EXTREME && "bg-red-600"
                          )}
                        >
                          {getRiskLevelText(riskData.floodRisk)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Risk Score:</span>
                        <span className="font-medium">{riskData.riskScores.flood}/100</span>
                      </div>
                      <Progress 
                        value={riskData.riskScores.flood} 
                        className={cn("h-2", getProgressColor(riskData.riskScores.flood))} 
                      />
                    </div>
                    
                    <div className="flex flex-col border rounded-md p-3">
                      <div className="flex items-center mb-2">
                        <Flame className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.wildfireRisk))} />
                        <h4 className="font-medium">Wildfire Risk</h4>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Risk Level:</span>
                        <Badge 
                          variant={getRiskLevelBadgeVariant(riskData.wildfireRisk)}
                          className={cn(
                            riskData.wildfireRisk === RiskLevel.EXTREME && "bg-red-600"
                          )}
                        >
                          {getRiskLevelText(riskData.wildfireRisk)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Risk Score:</span>
                        <span className="font-medium">{riskData.riskScores.wildfire}/100</span>
                      </div>
                      <Progress 
                        value={riskData.riskScores.wildfire} 
                        className={cn("h-2", getProgressColor(riskData.riskScores.wildfire))} 
                      />
                    </div>
                    
                    <div className="flex flex-col border rounded-md p-3">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.earthquakeRisk))} />
                        <h4 className="font-medium">Earthquake Risk</h4>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Risk Level:</span>
                        <Badge 
                          variant={getRiskLevelBadgeVariant(riskData.earthquakeRisk)}
                          className={cn(
                            riskData.earthquakeRisk === RiskLevel.EXTREME && "bg-red-600"
                          )}
                        >
                          {getRiskLevelText(riskData.earthquakeRisk)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Risk Score:</span>
                        <span className="font-medium">{riskData.riskScores.earthquake}/100</span>
                      </div>
                      <Progress 
                        value={riskData.riskScores.earthquake} 
                        className={cn("h-2", getProgressColor(riskData.riskScores.earthquake))} 
                      />
                    </div>
                    
                    {riskData.droughtRisk && (
                      <div className="flex flex-col border rounded-md p-3">
                        <div className="flex items-center mb-2">
                          <ThermometerIcon className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.droughtRisk))} />
                          <h4 className="font-medium">Drought Risk</h4>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Risk Level:</span>
                          <Badge 
                            variant={getRiskLevelBadgeVariant(riskData.droughtRisk)}
                            className={cn(
                              riskData.droughtRisk === RiskLevel.EXTREME && "bg-red-600"
                            )}
                          >
                            {getRiskLevelText(riskData.droughtRisk)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Risk Score:</span>
                          <span className="font-medium">{riskData.riskScores.drought || 0}/100</span>
                        </div>
                        <Progress 
                          value={riskData.riskScores.drought || 0} 
                          className={cn("h-2", getProgressColor(riskData.riskScores.drought || 0))} 
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-md p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center">
                      <ShieldAlert className={cn("h-6 w-6 mr-2", getRiskLevelTextColor(riskData.overallRisk))} />
                      <h3 className="font-medium text-lg">Overall Risk Assessment: {' '}
                        <span className={getRiskLevelTextColor(riskData.overallRisk)}>
                          {getRiskLevelText(riskData.overallRisk)}
                        </span>
                      </h3>
                    </div>
                    
                    <Progress 
                      value={riskData.riskScores.overall} 
                      className={cn("h-3", getProgressColor(riskData.riskScores.overall))} 
                    />
                    
                    <p>
                      {riskData.riskDescription}
                    </p>
                    
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-1 text-amber-500" />
                      <span className="font-medium">Insurance Impact:</span>
                      <span className="ml-1">Est. {riskData.insuranceImpact.estimatedPremiumIncrease}% premium increase</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="pt-4">
                <div className="space-y-3">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="flood">
                      <AccordionTrigger className="text-base">
                        <div className="flex items-center">
                          <DropletIcon className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.floodRisk))} />
                          <span>Flood Risk Details</span>
                          <Badge 
                            variant={getRiskLevelBadgeVariant(riskData.floodRisk)}
                            className="ml-2"
                          >
                            {getRiskLevelText(riskData.floodRisk)}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-7">
                          <p className="text-sm">
                            {riskData.floodRisk === RiskLevel.LOW && 
                              "This property has minimal flood risk. It's not located in a FEMA-designated flood zone and has a very low chance of experiencing flooding over a 30-year period."}
                              
                            {riskData.floodRisk === RiskLevel.MODERATE && 
                              "This property has moderate flood risk. While not in a high-risk flood zone, it may experience flooding during severe weather events or periods of unusually heavy rainfall."}
                              
                            {riskData.floodRisk === RiskLevel.HIGH && 
                              "This property has high flood risk. It's located in or near a designated flood zone and has a significant chance of experiencing flooding during severe weather events."}
                              
                            {riskData.floodRisk === RiskLevel.VERY_HIGH && 
                              "This property has very high flood risk. It's located in a FEMA-designated flood zone with a substantial risk of flooding during severe weather events."}
                              
                            {riskData.floodRisk === RiskLevel.EXTREME && 
                              "This property has extreme flood risk. It's located in a high-risk flood zone with a history of flooding and a very high probability of future flood events."}
                          </p>
                          
                          <div className="pt-2">
                            <div className="text-sm font-medium mb-1">Risk Score: {riskData.riskScores.flood}/100</div>
                            <Progress 
                              value={riskData.riskScores.flood} 
                              className={cn("h-2", getProgressColor(riskData.riskScores.flood))} 
                            />
                          </div>
                          
                          <div className="flex items-center pt-2 text-sm">
                            <Info className="h-4 w-4 mr-1 text-blue-500" />
                            <span>
                              {riskData.floodRisk !== RiskLevel.LOW 
                                ? "Flood insurance is recommended for this property." 
                                : "Standard homeowners insurance should be sufficient for this property."}
                            </span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="wildfire">
                      <AccordionTrigger className="text-base">
                        <div className="flex items-center">
                          <Flame className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.wildfireRisk))} />
                          <span>Wildfire Risk Details</span>
                          <Badge 
                            variant={getRiskLevelBadgeVariant(riskData.wildfireRisk)}
                            className="ml-2"
                          >
                            {getRiskLevelText(riskData.wildfireRisk)}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-7">
                          <p className="text-sm">
                            {riskData.wildfireRisk === RiskLevel.LOW && 
                              "This property has minimal wildfire risk. It's located in an area with low vegetation density, adequate fire protection services, and no significant history of wildfires."}
                              
                            {riskData.wildfireRisk === RiskLevel.MODERATE && 
                              "This property has moderate wildfire risk. The area has some seasonal wildfire potential, particularly during dry summer months, but adequate fire protection services are available."}
                              
                            {riskData.wildfireRisk === RiskLevel.HIGH && 
                              "This property has high wildfire risk. It's located in an area with significant vegetation and potential for fire spread during dry conditions."}
                              
                            {riskData.wildfireRisk === RiskLevel.VERY_HIGH && 
                              "This property has very high wildfire risk. It's located in a wildfire-prone area with dense vegetation, limited fire prevention infrastructure, and challenging access for firefighting."}
                              
                            {riskData.wildfireRisk === RiskLevel.EXTREME && 
                              "This property has extreme wildfire risk. It's located in a high-risk wildfire zone with a history of wildfires, dense vegetation, and challenging firefighting conditions."}
                          </p>
                          
                          <div className="pt-2">
                            <div className="text-sm font-medium mb-1">Risk Score: {riskData.riskScores.wildfire}/100</div>
                            <Progress 
                              value={riskData.riskScores.wildfire} 
                              className={cn("h-2", getProgressColor(riskData.riskScores.wildfire))} 
                            />
                          </div>
                          
                          <div className="flex items-center pt-2 text-sm">
                            <Info className="h-4 w-4 mr-1 text-blue-500" />
                            <span>
                              {riskData.wildfireRisk !== RiskLevel.LOW 
                                ? "Creating defensible space around the property is recommended to reduce wildfire risk." 
                                : "Standard fire prevention measures should be sufficient for this property."}
                            </span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="earthquake">
                      <AccordionTrigger className="text-base">
                        <div className="flex items-center">
                          <AlertTriangle className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.earthquakeRisk))} />
                          <span>Earthquake Risk Details</span>
                          <Badge 
                            variant={getRiskLevelBadgeVariant(riskData.earthquakeRisk)}
                            className="ml-2"
                          >
                            {getRiskLevelText(riskData.earthquakeRisk)}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-7">
                          <p className="text-sm">
                            {riskData.earthquakeRisk === RiskLevel.LOW && 
                              "This property has minimal earthquake risk. It's located in a region with limited seismic activity and has a very low probability of experiencing significant earthquake damage."}
                              
                            {riskData.earthquakeRisk === RiskLevel.MODERATE && 
                              "This property has moderate earthquake risk. While major earthquakes are uncommon in this region, the area does experience some seismic activity that could potentially cause damage."}
                              
                            {riskData.earthquakeRisk === RiskLevel.HIGH && 
                              "This property has high earthquake risk. It's located in a seismically active region with a significant chance of experiencing earthquake damage over time."}
                              
                            {riskData.earthquakeRisk === RiskLevel.VERY_HIGH && 
                              "This property has very high earthquake risk. It's located near active fault lines with a substantial probability of experiencing significant earthquake damage."}
                              
                            {riskData.earthquakeRisk === RiskLevel.EXTREME && 
                              "This property has extreme earthquake risk. It's located on or very near major fault lines with a very high probability of experiencing significant earthquake damage."}
                          </p>
                          
                          <div className="pt-2">
                            <div className="text-sm font-medium mb-1">Risk Score: {riskData.riskScores.earthquake}/100</div>
                            <Progress 
                              value={riskData.riskScores.earthquake} 
                              className={cn("h-2", getProgressColor(riskData.riskScores.earthquake))} 
                            />
                          </div>
                          
                          <div className="flex items-center pt-2 text-sm">
                            <Info className="h-4 w-4 mr-1 text-blue-500" />
                            <span>
                              {riskData.earthquakeRisk !== RiskLevel.LOW 
                                ? "Earthquake insurance and seismic retrofitting should be considered for this property." 
                                : "Standard structural maintenance should be sufficient for this property."}
                            </span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    {riskData.droughtRisk && (
                      <AccordionItem value="drought">
                        <AccordionTrigger className="text-base">
                          <div className="flex items-center">
                            <ThermometerIcon className={cn("h-5 w-5 mr-2", getRiskLevelTextColor(riskData.droughtRisk))} />
                            <span>Drought Risk Details</span>
                            <Badge 
                              variant={getRiskLevelBadgeVariant(riskData.droughtRisk)}
                              className="ml-2"
                            >
                              {getRiskLevelText(riskData.droughtRisk)}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-7">
                            <p className="text-sm">
                              {riskData.droughtRisk === RiskLevel.LOW && 
                                "This property has minimal drought risk. The area typically receives consistent precipitation throughout the year and has reliable water sources."}
                                
                              {riskData.droughtRisk === RiskLevel.MODERATE && 
                                "This property has moderate drought risk. The area may experience seasonal dry periods but generally has adequate water resources."}
                                
                              {riskData.droughtRisk === RiskLevel.HIGH && 
                                "This property has high drought risk. The area is prone to extended dry periods that may impact water availability and increase fire danger."}
                                
                              {riskData.droughtRisk === RiskLevel.VERY_HIGH && 
                                "This property has very high drought risk. The area frequently experiences severe drought conditions that can significantly impact water resources and landscape health."}
                                
                              {riskData.droughtRisk === RiskLevel.EXTREME && 
                                "This property has extreme drought risk. The area is in a chronic drought-prone region with severe water restrictions and high susceptibility to desertification."}
                            </p>
                            
                            <div className="pt-2">
                              <div className="text-sm font-medium mb-1">Risk Score: {riskData.riskScores.drought || 0}/100</div>
                              <Progress 
                                value={riskData.riskScores.drought || 0} 
                                className={cn("h-2", getProgressColor(riskData.riskScores.drought || 0))} 
                              />
                            </div>
                            
                            <div className="flex items-center pt-2 text-sm">
                              <Info className="h-4 w-4 mr-1 text-blue-500" />
                              <span>
                                {riskData.droughtRisk !== RiskLevel.LOW 
                                  ? "Water-efficient landscaping and conservation measures are strongly recommended." 
                                  : "Standard water management practices should be sufficient for this property."}
                              </span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              </TabsContent>
              
              <TabsContent value="insurance" className="pt-4">
                <div className="space-y-4">
                  <div className="rounded-md border p-4 bg-amber-50">
                    <div className="flex items-center mb-3">
                      <DollarSign className="h-5 w-5 mr-2 text-amber-500" />
                      <h3 className="font-medium">Insurance Premium Impact</h3>
                    </div>
                    
                    <div className="text-sm mb-3">
                      Based on the property's risk assessment, insurance premiums may be approximately 
                      <span className="font-bold mx-1">
                        {riskData.insuranceImpact.estimatedPremiumIncrease}%
                      </span> 
                      higher than properties with minimal natural hazard risk.
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-sm font-medium mb-1">Premium Impact</div>
                      <Progress 
                        value={riskData.insuranceImpact.estimatedPremiumIncrease * 5} 
                        className="h-2 bg-amber-200"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0%</span>
                        <span>5%</span>
                        <span>10%</span>
                        <span>15%</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium mb-3">Recommended Coverage</h3>
                    
                    <div className="space-y-3">
                      {riskData.insuranceImpact.coverageRecommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm">{recommendation}</div>
                            <p className="text-sm text-muted-foreground">
                              {recommendation.includes('Flood') && 
                                "Standard homeowners policies don't cover flood damage. A separate flood insurance policy is needed."}
                                
                              {recommendation.includes('Earthquake') && 
                                "Earthquake coverage requires a separate policy or endorsement to your homeowners insurance."}
                                
                              {recommendation.includes('Standard') && 
                                "Verify that your policy has adequate coverage limits for the replacement value of your home."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mitigation" className="pt-4">
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <h3 className="font-medium mb-3">Risk Mitigation Strategies</h3>
                    
                    <div className="space-y-3">
                      {riskData.mitigationTips.map((tip, index) => (
                        <div key={index} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">{tip}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {riskData.floodRisk !== RiskLevel.LOW && (
                    <div className="rounded-md border p-4 bg-blue-50">
                      <div className="flex items-center mb-2">
                        <DropletIcon className="h-5 w-5 mr-2 text-blue-500" />
                        <h3 className="font-medium">Flood Risk Mitigation</h3>
                      </div>
                      
                      <ul className="list-disc pl-5 space-y-1">
                        <li className="text-sm">Install check valves to prevent backup into drains</li>
                        <li className="text-sm">Elevate utilities above potential flood levels</li>
                        <li className="text-sm">Consider waterproof veneer for exterior walls</li>
                        <li className="text-sm">Maintain proper drainage systems around the property</li>
                        <li className="text-sm">Consider flood insurance, even if not in a high-risk zone</li>
                      </ul>
                    </div>
                  )}
                  
                  {riskData.wildfireRisk !== RiskLevel.LOW && (
                    <div className="rounded-md border p-4 bg-orange-50">
                      <div className="flex items-center mb-2">
                        <Flame className="h-5 w-5 mr-2 text-orange-500" />
                        <h3 className="font-medium">Wildfire Risk Mitigation</h3>
                      </div>
                      
                      <ul className="list-disc pl-5 space-y-1">
                        <li className="text-sm">Create a defensible space by clearing vegetation</li>
                        <li className="text-sm">Use fire-resistant roofing and building materials</li>
                        <li className="text-sm">Install double-paned or tempered glass windows</li>
                        <li className="text-sm">Keep gutters and roof clear of flammable debris</li>
                        <li className="text-sm">Develop a family evacuation plan and emergency kit</li>
                      </ul>
                    </div>
                  )}
                  
                  {riskData.earthquakeRisk !== RiskLevel.LOW && (
                    <div className="rounded-md border p-4 bg-amber-50">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                        <h3 className="font-medium">Earthquake Risk Mitigation</h3>
                      </div>
                      
                      <ul className="list-disc pl-5 space-y-1">
                        <li className="text-sm">Secure heavy furniture and appliances to walls</li>
                        <li className="text-sm">Consider a professional seismic retrofit assessment</li>
                        <li className="text-sm">Reinforce chimney and foundation connections</li>
                        <li className="text-sm">Install flexible gas and water connections</li>
                        <li className="text-sm">Create an earthquake emergency kit and response plan</li>
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground px-3 py-2">
        <div className="flex items-center">
          <Info className="h-4 w-4 mr-1" />
          Risk assessment data updated quarterly. Last update: March 2025
        </div>
      </CardFooter>
    </Card>
  );
};

export default NaturalHazardRiskAssessment;