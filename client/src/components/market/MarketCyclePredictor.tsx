/**
 * Market Cycle Predictor Component
 * 
 * This component displays market cycle prediction for a real estate market,
 * showing current phase, next phase, and investment recommendations.
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  BarChart2, 
  Compass, 
  HelpCircle, 
  Layers, 
  History,
  Clock,
  DollarSign,
  Activity,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Check,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { MarketCyclePrediction, MarketPhase } from '@/services/integrated-property-data.service';

// Define component props
interface MarketCyclePredictorProps {
  predictionData: MarketCyclePrediction;
  location?: {
    city: string;
    state: string;
  };
  className?: string;
}

// Helper functions
const getPhaseColor = (phase: MarketPhase): string => {
  switch (phase) {
    case MarketPhase.RECOVERY:
      return '#10b981'; // Green
    case MarketPhase.EXPANSION:
      return '#3b82f6'; // Blue
    case MarketPhase.HYPER_SUPPLY:
      return '#f59e0b'; // Amber
    case MarketPhase.RECESSION:
      return '#ef4444'; // Red
    default:
      return '#94a3b8'; // Gray
  }
};

const getPhaseTextColor = (phase: MarketPhase): string => {
  switch (phase) {
    case MarketPhase.RECOVERY:
      return 'text-green-600';
    case MarketPhase.EXPANSION:
      return 'text-blue-600';
    case MarketPhase.HYPER_SUPPLY:
      return 'text-amber-600';
    case MarketPhase.RECESSION:
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getPhaseText = (phase: MarketPhase): string => {
  return phase.replace('_', ' ');
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
};

const getTrendColor = (trend: 'up' | 'down' | 'stable', impact: 'positive' | 'negative' | 'neutral') => {
  if (impact === 'positive') return 'text-green-500';
  if (impact === 'negative') return 'text-red-500';
  return 'text-gray-500';
};

// Phase description component
const PhaseDescription: React.FC<{
  phase: MarketPhase;
}> = ({ phase }) => {
  let description = '';
  let characteristics: string[] = [];
  
  switch (phase) {
    case MarketPhase.RECOVERY:
      description = "The market is in the early recovery stage following a downturn. This phase is characterized by improving market fundamentals.";
      characteristics = [
        "Vacancy rates are decreasing from their peak",
        "Rental rates begin to stabilize and may show modest growth",
        "Property values are bottoming out and beginning to appreciate",
        "Little to no new construction activity",
        "Investor interest is growing, but still cautious"
      ];
      break;
    case MarketPhase.EXPANSION:
      description = "The market is in the expansion phase, showing strong growth and improving fundamentals across most metrics.";
      characteristics = [
        "Vacancy rates are below long-term averages",
        "Rental rates are increasing steadily",
        "Property values are appreciating at above-inflation rates",
        "New construction activity is increasing",
        "Strong investor demand and positive market sentiment"
      ];
      break;
    case MarketPhase.HYPER_SUPPLY:
      description = "The market is in the hyper supply phase with increasing inventory and slowing growth in key metrics.";
      characteristics = [
        "New construction is outpacing absorption",
        "Vacancy rates begin to rise slightly",
        "Rental growth is slowing or flattening",
        "Property value appreciation is slowing",
        "Market sentiment is becoming more cautious"
      ];
      break;
    case MarketPhase.RECESSION:
      description = "The market is in the recession phase with declining metrics and excess inventory.";
      characteristics = [
        "Vacancy rates are increasing significantly",
        "Rental rates are declining or stagnant",
        "Property values are declining",
        "New construction has largely stopped",
        "Investor sentiment is negative, opportunistic buyers emerge"
      ];
      break;
  }
  
  return (
    <div className="space-y-3">
      <p>{description}</p>
      <div>
        <h4 className="font-medium mb-1">Key Characteristics:</h4>
        <ul className="list-disc pl-5 space-y-1">
          {characteristics.map((item, index) => (
            <li key={index} className="text-sm">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Market cycle diagram
const MarketCycleDiagram: React.FC<{
  currentPhase: MarketPhase;
  nextPhase: MarketPhase;
}> = ({ currentPhase, nextPhase }) => {
  // Calculate the position in the cycle (0-360 degrees)
  const getPhasePosition = (phase: MarketPhase): number => {
    switch (phase) {
      case MarketPhase.RECOVERY: return 0;
      case MarketPhase.EXPANSION: return 90;
      case MarketPhase.HYPER_SUPPLY: return 180;
      case MarketPhase.RECESSION: return 270;
      default: return 0;
    }
  };
  
  const currentPosition = getPhasePosition(currentPhase);
  const nextPosition = getPhasePosition(nextPhase);
  
  // Data for the pie chart
  const data = [
    { name: 'Recovery', value: 1, fill: getPhaseColor(MarketPhase.RECOVERY) },
    { name: 'Expansion', value: 1, fill: getPhaseColor(MarketPhase.EXPANSION) },
    { name: 'Hyper Supply', value: 1, fill: getPhaseColor(MarketPhase.HYPER_SUPPLY) },
    { name: 'Recession', value: 1, fill: getPhaseColor(MarketPhase.RECESSION) }
  ];
  
  // Active shape to highlight current phase
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <path
          d={`M${cx},${cy} L${cx + outerRadius * Math.cos(startAngle)},${
            cy + outerRadius * Math.sin(startAngle)
          } A${outerRadius},${outerRadius} 0 0,1 ${
            cx + outerRadius * Math.cos(endAngle)
          },${cy + outerRadius * Math.sin(endAngle)} Z`}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
        />
      </g>
    );
  };
  
  return (
    <div className="relative h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={currentPosition / 90}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill} 
                stroke="#fff"
                strokeWidth={index === currentPosition / 90 ? 2 : 0}
              />
            ))}
          </Pie>
          <RechartsTooltip 
            formatter={(value: any, name: string) => [name, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className={cn(
          "font-medium text-sm",
          currentPhase === MarketPhase.RECOVERY ? getPhaseTextColor(MarketPhase.RECOVERY) : ""
        )}>
          Recovery
        </div>
      </div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 text-center">
        <div className={cn(
          "font-medium text-sm",
          currentPhase === MarketPhase.EXPANSION ? getPhaseTextColor(MarketPhase.EXPANSION) : ""
        )}>
          Expansion
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-center">
        <div className={cn(
          "font-medium text-sm",
          currentPhase === MarketPhase.HYPER_SUPPLY ? getPhaseTextColor(MarketPhase.HYPER_SUPPLY) : ""
        )}>
          Hyper Supply
        </div>
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 text-center">
        <div className={cn(
          "font-medium text-sm",
          currentPhase === MarketPhase.RECESSION ? getPhaseTextColor(MarketPhase.RECESSION) : ""
        )}>
          Recession
        </div>
      </div>
      
      {/* Current position marker */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="font-bold">Current Phase</div>
        <div className={cn(
          "font-bold text-lg",
          getPhaseTextColor(currentPhase)
        )}>
          {getPhaseText(currentPhase)}
        </div>
      </div>
      
      {/* Next phase arrow */}
      <div 
        className="absolute" 
        style={{
          top: '50%',
          left: '50%',
          transform: `rotate(${currentPosition + 45}deg) translateX(95px) rotate(-${currentPosition + 45}deg)`,
        }}
      >
        <div className="bg-white rounded-full p-1 shadow-md">
          <div className="text-xs font-medium">Next → {getPhaseText(nextPhase)}</div>
        </div>
      </div>
    </div>
  );
};

// Main component
const MarketCyclePredictor: React.FC<MarketCyclePredictorProps> = ({
  predictionData,
  location,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Format key indicators for charts
  const indicatorChartData = predictionData.keyIndicators.map(indicator => ({
    name: indicator.name,
    value: indicator.weight * 100,
    impact: indicator.impact,
    trend: indicator.trend
  }));
  
  return (
    <Card className={cn("shadow-md overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Compass className="mr-2 h-5 w-5" />
          Market Cycle Predictor
        </CardTitle>
        {location && (
          <CardDescription>
            {location.city}, {location.state} Market Analysis
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="indicators" className="text-xs">Key Indicators</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historical</TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs">Strategy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Current Market Phase</h3>
                  <div className="flex items-center mb-4">
                    <div className={cn(
                      "text-xl font-bold",
                      getPhaseTextColor(predictionData.currentPhase)
                    )}>
                      {getPhaseText(predictionData.currentPhase)}
                    </div>
                    
                    <Badge 
                      className="ml-2"
                      variant="outline"
                    >
                      {predictionData.confidenceLevel}% confidence
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-4">
                    {predictionData.phaseDescription}
                  </p>
                  
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1 text-blue-500" />
                    <span>
                      Estimated {predictionData.estimatedTimeToNextPhase} months until entering{' '}
                      <span className={getPhaseTextColor(predictionData.nextPhase)}>
                        {getPhaseText(predictionData.nextPhase)}
                      </span> phase
                    </span>
                  </div>
                </div>
                
                <div>
                  <MarketCycleDiagram 
                    currentPhase={predictionData.currentPhase}
                    nextPhase={predictionData.nextPhase}
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="flex items-center mb-3">
                  <History className="h-5 w-5 mr-2 text-indigo-500" />
                  <h3 className="font-medium">Historical Comparison</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Similar Period:</span>
                    <span className="font-medium">{predictionData.historicalCycleComparison.similarHistoricalPeriod}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Similarity Score:</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">{predictionData.historicalCycleComparison.similarityScore}%</span>
                      <div className="w-32">
                        <Progress 
                          value={predictionData.historicalCycleComparison.similarityScore} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm pt-2">
                    {predictionData.historicalCycleComparison.outcomeDescription}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="indicators" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-3">Key Market Indicators</h3>
                  
                  {predictionData.keyIndicators.map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between mb-3 last:mb-0">
                      <div className="flex items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center mr-2",
                          getTrendColor(indicator.trend, indicator.impact)
                        )}>
                          {getTrendIcon(indicator.trend)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{indicator.name}</div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="capitalize">{indicator.trend}</span>
                            <span className="mx-1">•</span>
                            <span className="capitalize">{indicator.impact} impact</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-24">
                                <Progress 
                                  value={indicator.weight * 100} 
                                  className={cn(
                                    "h-2",
                                    indicator.impact === 'positive' ? "bg-green-100" : 
                                    indicator.impact === 'negative' ? "bg-red-100" : 
                                    "bg-gray-100"
                                  )}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Influence: {(indicator.weight * 100).toFixed(0)}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <BarChartIcon className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">Indicator Impact</h3>
                  </div>
                  
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={indicatorChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          label={{ 
                            value: 'Impact Weight (%)', 
                            position: 'insideBottom',
                            offset: -5
                          }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category"
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <RechartsTooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value.toFixed(0)}%`, 
                            `Influence (${props.payload.trend} trend, ${props.payload.impact} impact)`
                          ]}
                        />
                        <Bar 
                          dataKey="value" 
                          name="Impact Weight"
                          fill="#3b82f6"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        <span>What Do These Indicators Mean?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-6">
                        <p className="text-sm">
                          These key indicators are the most significant factors driving the current market phase and influencing the prediction of the next phase. Each indicator's influence is weighted based on its predictive power in the current market context.
                        </p>
                        
                        <div className="space-y-2">
                          {predictionData.keyIndicators.map((indicator, index) => (
                            <div key={index}>
                              <div className="font-medium text-sm">{indicator.name}</div>
                              <p className="text-xs text-muted-foreground">
                                {indicator.name === 'Job Growth' && 
                                  "Measures employment growth over time. Strong job growth typically drives housing demand and supports property value appreciation."}
                                
                                {indicator.name === 'Housing Affordability' && 
                                  "Measures the relationship between housing costs and incomes. When affordability decreases, it can signal market overheating and potential correction."}
                                
                                {indicator.name === 'New Construction Permits' && 
                                  "Tracks building permits issued for new housing. Excessive construction can lead to oversupply and market corrections."}
                                
                                {indicator.name === 'Days on Market' && 
                                  "Average time properties take to sell. Decreasing days on market indicates strong demand; increasing can signal market slowdown."}
                                
                                {indicator.name === 'Price to Income Ratio' && 
                                  "Relationship between home prices and household incomes. Higher ratios may indicate potential market bubbles or corrections."}
                                
                                {indicator.name === 'Agricultural Employment' && 
                                  "Employment in agricultural industries. Important for rural markets where farming and related industries drive local economies."}
                                
                                {indicator.name === 'Population Growth' && 
                                  "Rate of population change. Positive growth typically increases housing demand and supports property value appreciation."}
                                
                                {indicator.name === 'Median Home Price' && 
                                  "Midpoint of all home prices. Tracks overall market direction and affordability trends."}
                                
                                {indicator.name === 'New Business Formation' && 
                                  "Rate of new business creation. Indicates economic vitality and potential for future job growth."}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="pt-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex items-center mb-3">
                  <History className="h-5 w-5 mr-2 text-indigo-500" />
                  <h3 className="font-medium">Historical Comparison</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Current Market</div>
                      <div className="text-sm">
                        {location?.city}, {location?.state} ({new Date().getFullYear()})
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Similar Historical Period</div>
                      <div className="text-sm">
                        {predictionData.historicalCycleComparison.similarHistoricalPeriod}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Similarity Score</div>
                    <div className="flex items-center">
                      <Progress 
                        value={predictionData.historicalCycleComparison.similarityScore} 
                        className="h-2 flex-grow" 
                      />
                      <span className="ml-2 text-sm">{predictionData.historicalCycleComparison.similarityScore}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Historical Outcome</div>
                    <p className="text-sm">
                      {predictionData.historicalCycleComparison.outcomeDescription}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="flex items-center mb-3">
                  <Layers className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Market Cycle Characteristics</h3>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="recovery">
                    <AccordionTrigger>
                      <div className={cn(
                        "flex items-center",
                        predictionData.currentPhase === MarketPhase.RECOVERY ? getPhaseTextColor(MarketPhase.RECOVERY) : ""
                      )}>
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-2",
                          getPhaseColor(MarketPhase.RECOVERY)
                        )} />
                        <span>Recovery Phase</span>
                        {predictionData.currentPhase === MarketPhase.RECOVERY && (
                          <Badge variant="outline" className="ml-2">Current</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <PhaseDescription phase={MarketPhase.RECOVERY} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="expansion">
                    <AccordionTrigger>
                      <div className={cn(
                        "flex items-center",
                        predictionData.currentPhase === MarketPhase.EXPANSION ? getPhaseTextColor(MarketPhase.EXPANSION) : ""
                      )}>
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-2",
                          getPhaseColor(MarketPhase.EXPANSION)
                        )} />
                        <span>Expansion Phase</span>
                        {predictionData.currentPhase === MarketPhase.EXPANSION && (
                          <Badge variant="outline" className="ml-2">Current</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <PhaseDescription phase={MarketPhase.EXPANSION} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="hyper-supply">
                    <AccordionTrigger>
                      <div className={cn(
                        "flex items-center",
                        predictionData.currentPhase === MarketPhase.HYPER_SUPPLY ? getPhaseTextColor(MarketPhase.HYPER_SUPPLY) : ""
                      )}>
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-2",
                          getPhaseColor(MarketPhase.HYPER_SUPPLY)
                        )} />
                        <span>Hyper Supply Phase</span>
                        {predictionData.currentPhase === MarketPhase.HYPER_SUPPLY && (
                          <Badge variant="outline" className="ml-2">Current</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <PhaseDescription phase={MarketPhase.HYPER_SUPPLY} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="recession">
                    <AccordionTrigger>
                      <div className={cn(
                        "flex items-center",
                        predictionData.currentPhase === MarketPhase.RECESSION ? getPhaseTextColor(MarketPhase.RECESSION) : ""
                      )}>
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-2",
                          getPhaseColor(MarketPhase.RECESSION)
                        )} />
                        <span>Recession Phase</span>
                        {predictionData.currentPhase === MarketPhase.RECESSION && (
                          <Badge variant="outline" className="ml-2">Current</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <PhaseDescription phase={MarketPhase.RECESSION} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="strategy" className="pt-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-blue-50">
                <div className="flex items-center mb-3">
                  <Compass className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="font-medium">Investment Strategy Recommendations</h3>
                </div>
                
                <div className="space-y-3">
                  {predictionData.investmentStrategyRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-blue-100 rounded-full p-1 mt-0.5 mr-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm">{recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Investment Timing</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Phase:</span>
                      <Badge className={cn(
                        "bg-opacity-70",
                        getPhaseColor(predictionData.currentPhase)
                      )}>
                        {getPhaseText(predictionData.currentPhase)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Time Until Next Phase:</span>
                      <span className="font-medium">~{predictionData.estimatedTimeToNextPhase} months</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Phase:</span>
                      <Badge className={cn(
                        "bg-opacity-70",
                        getPhaseColor(predictionData.nextPhase)
                      )}>
                        {getPhaseText(predictionData.nextPhase)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Prediction Confidence:</span>
                      <div className="flex items-center">
                        <span className="mr-2">{predictionData.confidenceLevel}%</span>
                        <Progress 
                          value={predictionData.confidenceLevel} 
                          className="w-20 h-2" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Phase-Based Strategies</h3>
                  
                  <div className="space-y-2 text-sm">
                    {predictionData.currentPhase === MarketPhase.RECOVERY && (
                      <>
                        <p className="font-medium text-green-600">Recovery Phase Strategies:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Excellent time to buy undervalued properties</li>
                          <li>Focus on strong locations with growth potential</li>
                          <li>Consider value-add opportunities</li>
                          <li>Longer-term hold strategies (5+ years) optimal</li>
                          <li>Lock in favorable financing while available</li>
                        </ul>
                      </>
                    )}
                    
                    {predictionData.currentPhase === MarketPhase.EXPANSION && (
                      <>
                        <p className="font-medium text-blue-600">Expansion Phase Strategies:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Good time to buy or hold as appreciation continues</li>
                          <li>Be selective and avoid overpaying for properties</li>
                          <li>Consider locking in gains on older investments</li>
                          <li>Focus on properties with strong fundamentals</li>
                          <li>Monitor new construction as potential warning sign</li>
                        </ul>
                      </>
                    )}
                    
                    {predictionData.currentPhase === MarketPhase.HYPER_SUPPLY && (
                      <>
                        <p className="font-medium text-amber-600">Hyper Supply Phase Strategies:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Increasing caution recommended for new acquisitions</li>
                          <li>Consider selling properties with weaker fundamentals</li>
                          <li>Focus on cash-flowing properties over appreciation</li>
                          <li>Reduce leverage and build cash reserves</li>
                          <li>Prepare for opportunities in coming recession phase</li>
                        </ul>
                      </>
                    )}
                    
                    {predictionData.currentPhase === MarketPhase.RECESSION && (
                      <>
                        <p className="font-medium text-red-600">Recession Phase Strategies:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Focus on capital preservation and cash flow</li>
                          <li>Identify distressed properties for opportunistic purchases</li>
                          <li>Maintain high cash reserves for future opportunities</li>
                          <li>Refinance properties if possible to improve cash position</li>
                          <li>Look for early signs of market bottoming</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between py-3">
        <div className="text-xs text-muted-foreground">
          Prediction models updated monthly | Last update: March 2025
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                This predictor uses machine learning models trained on historical real estate cycles, 
                economic indicators, and local market data to forecast probable market phase transitions.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default MarketCyclePredictor;