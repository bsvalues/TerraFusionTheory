/**
 * Economic Indicators Dashboard Component
 * 
 * This component displays key economic indicators for a region with
 * interactive visualizations and trend analysis.
 */

import React, { useState, useEffect } from 'react';
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Label,
  LabelList,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  DollarSign, 
  Briefcase, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Activity, 
  Users, 
  Building, 
  AreaChart as AreaChartIcon,
  FileSearch
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import economicIndicatorsService, { 
  EconomicDashboardData,
  EconomicRegion,
  EconomicIndicator,
  EconomicDataPoint,
  EconomicTrendData,
  PropertyValueImpact,
  CorrelationResult
} from '@/services/economic-indicators.service';

// Define component props
interface EconomicIndicatorsDashboardProps {
  regionId?: string;
  timeframe?: string;
  className?: string;
}

// Helper to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
};

// Helper to format percentages
const formatPercent = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

// Helper to format trend indicators
const TrendIndicator: React.FC<{ 
  trend: 'up' | 'down' | 'stable';
  value: number;
  isGoodWhenUp?: boolean;
}> = ({ trend, value, isGoodWhenUp = true }) => {
  const isPositive = (trend === 'up' && isGoodWhenUp) || (trend === 'down' && !isGoodWhenUp);
  const isNegative = (trend === 'up' && !isGoodWhenUp) || (trend === 'down' && isGoodWhenUp);
  
  return (
    <div className="flex items-center">
      {trend === 'up' && (
        <TrendingUp 
          className={cn(
            "h-4 w-4 mr-1",
            isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-500"
          )}
        />
      )}
      
      {trend === 'down' && (
        <TrendingDown 
          className={cn(
            "h-4 w-4 mr-1",
            isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-500"
          )}
        />
      )}
      
      {value !== 0 && (
        <span 
          className={cn(
            "text-xs",
            isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-500"
          )}
        >
          {value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`}
        </span>
      )}
    </div>
  );
};

// Metric card component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  icon: React.ReactNode;
  isGoodWhenUp?: boolean;
  description?: string;
}> = ({ title, value, trend, change, icon, isGoodWhenUp = true, description }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {trend && change !== undefined && (
              <div className="mt-1">
                <TrendIndicator 
                  trend={trend} 
                  value={change} 
                  isGoodWhenUp={isGoodWhenUp} 
                />
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          <div className="p-2 rounded-full bg-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Employment metrics section
const EmploymentMetrics: React.FC<{ 
  data: EconomicDashboardData;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}> = ({ data, timeframe, onTimeframeChange }) => {
  // Get the employment trend data
  const unemploymentTrend = data.trends.employment.find(
    trend => trend.indicator.id === 'unemployment-rate'
  );
  
  const jobGrowthTrend = data.trends.employment.find(
    trend => trend.indicator.id === 'job-growth'
  );
  
  // Format data for trend chart
  const chartData = unemploymentTrend?.data.map((point, i) => {
    const date = new Date(point.date);
    
    // Format date based on timeframe
    let dateLabel = '';
    if (timeframe === 'month') {
      dateLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      dateLabel = `Q${quarter} ${date.getFullYear()}`;
    } else {
      dateLabel = date.getFullYear().toString();
    }
    
    return {
      date: dateLabel,
      unemployment: point.value,
      jobGrowth: jobGrowthTrend?.data[i]?.value || 0
    };
  }) || [];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          Employment Metrics
        </h3>
        
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
            <SelectItem value="fiveYear">5 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Unemployment Rate"
          value={`${data.indicators.employment.unemploymentRate.value.toFixed(1)}%`}
          trend={data.indicators.employment.unemploymentRate.trend}
          change={data.indicators.employment.unemploymentRate.change}
          icon={<Users className="h-5 w-5 text-primary" />}
          isGoodWhenUp={false}
          description="Percentage of workforce without employment"
        />
        
        <MetricCard
          title="Job Growth"
          value={`${data.indicators.employment.jobGrowth.value.toFixed(1)}%`}
          trend={data.indicators.employment.jobGrowth.trend}
          change={data.indicators.employment.jobGrowth.change}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          description="Year-over-year employment growth"
        />
        
        <MetricCard
          title="Labor Force Participation"
          value={`${data.indicators.employment.laborForceParticipation.value.toFixed(1)}%`}
          trend={data.indicators.employment.laborForceParticipation.trend}
          change={data.indicators.employment.laborForceParticipation.change}
          icon={<Users className="h-5 w-5 text-primary" />}
          description="Percentage of working-age population in workforce"
        />
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Employment Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#ef4444"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Unemployment (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#10b981"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Job Growth (%)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <RechartsTooltip />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="unemployment" 
                name="Unemployment Rate" 
                stroke="#ef4444" 
                activeDot={{ r: 8 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="jobGrowth" 
                name="Job Growth" 
                stroke="#10b981" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {data.indicators.employment.topIndustries && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Industries</CardTitle>
            <CardDescription>Employment distribution by industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.indicators.employment.topIndustries}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="share"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.indicators.employment.topIndustries.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            '#3b82f6', '#10b981', '#f97316', '#8b5cf6', 
                            '#ec4899', '#06b6d4', '#f59e0b', '#14b8a6'
                          ][index % 8]} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry</TableHead>
                      <TableHead>Share</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Avg. Wage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.indicators.employment.topIndustries.map((industry, index) => (
                      <TableRow key={index}>
                        <TableCell>{industry.name}</TableCell>
                        <TableCell>{industry.share.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {industry.jobGrowth > 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                            )}
                            {industry.jobGrowth.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>${industry.averageWage.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Housing metrics section
const HousingMetrics: React.FC<{ 
  data: EconomicDashboardData;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}> = ({ data, timeframe, onTimeframeChange }) => {
  // Get the housing trend data
  const homeValueTrend = data.trends.housing.find(
    trend => trend.indicator.id === 'median-home-price'
  );
  
  const homePriceGrowthTrend = data.trends.housing.find(
    trend => trend.indicator.id === 'home-value-growth'
  );
  
  const affordabilityTrend = data.trends.housing.find(
    trend => trend.indicator.id === 'affordability-index'
  );
  
  // Format data for trend chart
  const chartData = homeValueTrend?.data.map((point, i) => {
    const date = new Date(point.date);
    
    // Format date based on timeframe
    let dateLabel = '';
    if (timeframe === 'month') {
      dateLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      dateLabel = `Q${quarter} ${date.getFullYear()}`;
    } else {
      dateLabel = date.getFullYear().toString();
    }
    
    return {
      date: dateLabel,
      price: point.value,
      growth: homePriceGrowthTrend?.data[i]?.value || 0,
      affordability: affordabilityTrend?.data[i]?.value || 0
    };
  }) || [];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Home className="mr-2 h-5 w-5" />
          Housing Market
        </h3>
        
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
            <SelectItem value="fiveYear">5 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Median Home Price"
          value={`$${data.indicators.housing.medianHomePrice.value.toLocaleString()}`}
          trend={data.indicators.housing.medianHomePrice.trend}
          change={data.indicators.housing.medianHomePrice.change}
          icon={<Home className="h-5 w-5 text-primary" />}
          description="Median sales price of homes"
        />
        
        <MetricCard
          title="Home Value Growth"
          value={`${data.indicators.housing.homeValueGrowth.value.toFixed(1)}%`}
          trend={data.indicators.housing.homeValueGrowth.trend}
          change={data.indicators.housing.homeValueGrowth.change}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          description="Year-over-year change in home values"
        />
        
        <MetricCard
          title="Housing Affordability Index"
          value={data.indicators.housing.affordabilityIndex.value.toFixed(1)}
          trend={data.indicators.housing.affordabilityIndex.trend}
          change={data.indicators.housing.affordabilityIndex.change}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          description="Higher values indicate more affordable housing"
        />
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Home Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#3b82f6"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Price ($)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#f97316"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Growth / Affordability', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [
                  name === 'price' ? `$${value.toLocaleString()}` : `${value.toFixed(1)}${name === 'growth' ? '%' : ''}`,
                  name === 'price' ? 'Price' : name === 'growth' ? 'Growth' : 'Affordability'
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="price" 
                name="Median Home Price" 
                fill="#3b82f6" 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="growth" 
                name="Price Growth %" 
                stroke="#f97316" 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="affordability" 
                name="Affordability Index" 
                stroke="#10b981" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Regional Comparison</CardTitle>
            <CardDescription>Median Home Price by Region</CardDescription>
          </CardHeader>
          <CardContent>
            {data.regionComparisons.find(c => c.indicator === 'median-home-price') && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  layout="vertical" 
                  data={data.regionComparisons
                    .find(c => c.indicator === 'median-home-price')?.regions
                    .map((region, i) => ({
                      region: data.regionComparisons.find(c => c.indicator === 'median-home-price')?.regionNames[i],
                      value: data.regionComparisons.find(c => c.indicator === 'median-home-price')?.values[i]
                    })) || []
                  }
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="region" 
                    type="category"
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Median Home Price']}
                  />
                  <Bar dataKey="value" fill="#3b82f6">
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      formatter={(value: number) => `$${formatNumber(value)}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Property Value Impact Factors</CardTitle>
            <CardDescription>Correlation with home values</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart 
                layout="vertical" 
                data={data.propertyValueCorrelations.map(correlation => ({
                  factor: correlation.indicator
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()),
                  impact: correlation.impact,
                  confidence: correlation.confidenceLevel
                }))}
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  domain={[-1, 1]}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  dataKey="factor" 
                  type="category"
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${Math.abs(value * 100).toFixed(0)}% ${value > 0 ? 'positive' : 'negative'} impact`,
                    `${props.payload.factor} (${props.payload.confidence} confidence)`
                  ]}
                />
                <Bar 
                  dataKey="impact" 
                  fill="#10b981"
                  // Use custom cell colors based on positive/negative values
                  cellProps={{
                    fill: (data: any) => data.impact >= 0 ? "#10b981" : "#ef4444"
                  }}
                >
                  <LabelList 
                    dataKey="impact" 
                    position="right" 
                    formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Income metrics section
const IncomeMetrics: React.FC<{ 
  data: EconomicDashboardData;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}> = ({ data, timeframe, onTimeframeChange }) => {
  // Get the income trend data
  const medianIncomeTrend = data.trends.income.find(
    trend => trend.indicator.id === 'median-household-income'
  );
  
  const perCapitaIncomeTrend = data.trends.income.find(
    trend => trend.indicator.id === 'per-capita-income'
  );
  
  const wageGrowthTrend = data.trends.income.find(
    trend => trend.indicator.id === 'wage-growth'
  );
  
  // Format data for trend chart
  const chartData = medianIncomeTrend?.data.map((point, i) => {
    const date = new Date(point.date);
    
    // Format date based on timeframe
    let dateLabel = '';
    if (timeframe === 'month') {
      dateLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      dateLabel = `Q${quarter} ${date.getFullYear()}`;
    } else {
      dateLabel = date.getFullYear().toString();
    }
    
    return {
      date: dateLabel,
      median: point.value,
      perCapita: perCapitaIncomeTrend?.data[i]?.value || 0,
      wageGrowth: wageGrowthTrend?.data[i]?.value || 0
    };
  }) || [];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <DollarSign className="mr-2 h-5 w-5" />
          Income & Wages
        </h3>
        
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
            <SelectItem value="fiveYear">5 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Median Household Income"
          value={`$${data.indicators.income.medianHouseholdIncome.value.toLocaleString()}`}
          trend={data.indicators.income.medianHouseholdIncome.trend}
          change={data.indicators.income.medianHouseholdIncome.change}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          description="Median income per household"
        />
        
        <MetricCard
          title="Per Capita Income"
          value={`$${data.indicators.income.perCapitaIncome.value.toLocaleString()}`}
          trend={data.indicators.income.perCapitaIncome.trend}
          change={data.indicators.income.perCapitaIncome.change}
          icon={<Users className="h-5 w-5 text-primary" />}
          description="Average income per person"
        />
        
        <MetricCard
          title="Wage Growth"
          value={`${data.indicators.income.wageGrowth.value.toFixed(1)}%`}
          trend={data.indicators.income.wageGrowth.trend}
          change={data.indicators.income.wageGrowth.change}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          description="Year-over-year change in wages"
        />
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Income Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#3b82f6"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Income ($)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#10b981"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Wage Growth (%)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [
                  name.includes('Growth') ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`,
                  name === 'median' ? 'Median Household Income' : 
                  name === 'perCapita' ? 'Per Capita Income' : 'Wage Growth'
                ]}
              />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="median" 
                name="Median Household Income" 
                stroke="#3b82f6" 
                strokeWidth={2}
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="perCapita" 
                name="Per Capita Income" 
                stroke="#8b5cf6" 
                strokeWidth={2}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="wageGrowth" 
                name="Wage Growth %" 
                stroke="#10b981" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Regional Comparison</CardTitle>
            <CardDescription>Median Household Income by Region</CardDescription>
          </CardHeader>
          <CardContent>
            {data.regionComparisons.find(c => c.indicator === 'median-household-income') && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  layout="vertical" 
                  data={data.regionComparisons
                    .find(c => c.indicator === 'median-household-income')?.regions
                    .map((region, i) => ({
                      region: data.regionComparisons.find(c => c.indicator === 'median-household-income')?.regionNames[i],
                      value: data.regionComparisons.find(c => c.indicator === 'median-household-income')?.values[i]
                    })) || []
                  }
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="region" 
                    type="category"
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Median Household Income']}
                  />
                  <Bar dataKey="value" fill="#3b82f6">
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      formatter={(value: number) => `$${formatNumber(value)}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {data.indicators.income.incomeDistribution && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Income Distribution</CardTitle>
              <CardDescription>Households by income level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.indicators.income.incomeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="category"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.indicators.income.incomeDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#ef4444', '#f97316', '#f59e0b', '#3b82f6', 
                          '#8b5cf6', '#10b981'
                        ][index % 6]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Business & Demographics section
const BusinessDemographicsMetrics: React.FC<{ 
  data: EconomicDashboardData;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}> = ({ data, timeframe, onTimeframeChange }) => {
  // Get trend data
  const businessGrowthTrend = data.trends.business.find(
    trend => trend.indicator.id === 'business-growth'
  );
  
  const newBusinessTrend = data.trends.business.find(
    trend => trend.indicator.id === 'new-business-formation'
  );
  
  const populationGrowthTrend = data.trends.demographic.find(
    trend => trend.indicator.id === 'population-growth'
  );
  
  // Format data for trend chart
  const chartData = businessGrowthTrend?.data.map((point, i) => {
    const date = new Date(point.date);
    
    // Format date based on timeframe
    let dateLabel = '';
    if (timeframe === 'month') {
      dateLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      dateLabel = `Q${quarter} ${date.getFullYear()}`;
    } else {
      dateLabel = date.getFullYear().toString();
    }
    
    return {
      date: dateLabel,
      businessGrowth: point.value,
      newBusiness: newBusinessTrend?.data[i]?.value || 0,
      populationGrowth: populationGrowthTrend?.data[i]?.value || 0
    };
  }) || [];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Building className="mr-2 h-5 w-5" />
          Business & Demographics
        </h3>
        
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
            <SelectItem value="fiveYear">5 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Business Growth"
          value={`${data.indicators.business.businessGrowth.value.toFixed(1)}%`}
          trend={data.indicators.business.businessGrowth.trend}
          change={data.indicators.business.businessGrowth.change}
          icon={<Building className="h-5 w-5 text-primary" />}
          description="Year-over-year business growth"
        />
        
        <MetricCard
          title="New Business Formation"
          value={data.indicators.business.newBusinessFormation.value.toFixed(1)}
          trend={data.indicators.business.newBusinessFormation.trend}
          change={data.indicators.business.newBusinessFormation.change}
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          description="New businesses per 1,000 residents"
        />
        
        <MetricCard
          title="Population Growth"
          value={`${data.indicators.demographic.populationGrowth.value.toFixed(1)}%`}
          trend={data.indicators.demographic.populationGrowth.trend}
          change={data.indicators.demographic.populationGrowth.change}
          icon={<Users className="h-5 w-5 text-primary" />}
          description="Year-over-year population growth"
        />
        
        <MetricCard
          title="Region Population"
          value={data.region.population?.toLocaleString() || 'N/A'}
          icon={<Users className="h-5 w-5 text-primary" />}
          description="Total population"
        />
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Growth (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }}
              />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}${name === 'newBusiness' ? '' : '%'}`,
                  name === 'businessGrowth' ? 'Business Growth' : 
                  name === 'newBusiness' ? 'New Business Formation' : 'Population Growth'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="businessGrowth" 
                name="Business Growth" 
                stroke="#3b82f6" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="newBusiness" 
                name="New Business Formation" 
                stroke="#8b5cf6" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="populationGrowth" 
                name="Population Growth" 
                stroke="#10b981" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Regional Comparison</CardTitle>
            <CardDescription>Job Growth by Region</CardDescription>
          </CardHeader>
          <CardContent>
            {data.regionComparisons.find(c => c.indicator === 'job-growth') && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  layout="vertical" 
                  data={data.regionComparisons
                    .find(c => c.indicator === 'job-growth')?.regions
                    .map((region, i) => ({
                      region: data.regionComparisons.find(c => c.indicator === 'job-growth')?.regionNames[i],
                      value: data.regionComparisons.find(c => c.indicator === 'job-growth')?.values[i]
                    })) || []
                  }
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="region" 
                    type="category"
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Job Growth']}
                  />
                  <Bar dataKey="value" fill="#10b981">
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Business-Housing Connection</CardTitle>
            <CardDescription>Correlation between business metrics and housing</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <FileSearch className="h-4 w-4" />
              <AlertTitle>Key Finding</AlertTitle>
              <AlertDescription>
                {data.propertyValueCorrelations.find(c => c.indicator === 'business-growth')?.explanation || 
                  "New business growth is positively correlated with property values, with businesses generally preceding home value increases."}
              </AlertDescription>
            </Alert>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border p-2">
                <div className="font-medium">Business Growth Impact</div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  {Math.abs((data.propertyValueCorrelations.find(c => c.indicator === 'business-growth')?.impact || 0) * 100).toFixed(0)}% 
                  {' '}
                  {(data.propertyValueCorrelations.find(c => c.indicator === 'business-growth')?.impact || 0) >= 0 ? 'positive' : 'negative'}
                  {' '}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({data.propertyValueCorrelations.find(c => c.indicator === 'business-growth')?.confidenceLevel || 'medium'} confidence)
                  </span>
                </div>
              </div>
              <div className="rounded-md border p-2">
                <div className="font-medium">New Business Impact</div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  {Math.abs((data.propertyValueCorrelations.find(c => c.indicator === 'new-business-formation')?.impact || 0) * 100).toFixed(0)}% 
                  {' '}
                  {(data.propertyValueCorrelations.find(c => c.indicator === 'new-business-formation')?.impact || 0) >= 0 ? 'positive' : 'negative'}
                  {' '}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({data.propertyValueCorrelations.find(c => c.indicator === 'new-business-formation')?.confidenceLevel || 'medium'} confidence)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main component
const EconomicIndicatorsDashboard: React.FC<EconomicIndicatorsDashboardProps> = ({
  regionId = 'richland-city',
  timeframe = 'year',
  className
}) => {
  // State for selections
  const [selectedRegion, setSelectedRegion] = useState(regionId);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [activeTab, setActiveTab] = useState('employment');
  
  // Query to get all regions
  const { data: regions, isLoading: isLoadingRegions } = useQuery({
    queryKey: ['/api/economic-regions'],
    queryFn: async () => {
      return await economicIndicatorsService.getRegions();
    }
  });
  
  // Query to get dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/economic-dashboard', selectedRegion, selectedTimeframe],
    queryFn: async () => {
      return await economicIndicatorsService.getDashboardData(selectedRegion, selectedTimeframe);
    }
  });
  
  const isLoading = isLoadingRegions || isLoadingDashboard;
  
  return (
    <div className={cn("space-y-6", className)}>
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <BarChart2 className="mr-2 h-5 w-5" />
            Economic Indicators Dashboard
          </CardTitle>
          <CardDescription>
            {isLoading ? (
              'Loading economic indicators...'
            ) : (
              `Analyzing ${dashboardData?.region.name}, ${dashboardData?.region.state}`
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="w-60">
              <Select
                value={selectedRegion}
                onValueChange={setSelectedRegion}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions?.map(region => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}, {region.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="employment" className="flex items-center">
                    <Briefcase className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Employment</span>
                  </TabsTrigger>
                  <TabsTrigger value="housing" className="flex items-center">
                    <Home className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Housing</span>
                  </TabsTrigger>
                  <TabsTrigger value="income" className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Income</span>
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center">
                    <Building className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Business</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
              <Skeleton className="h-[250px]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            </div>
          ) : !dashboardData ? (
            <div className="py-10 text-center">
              <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No economic data available for this region
              </p>
            </div>
          ) : (
            <div>
              <TabsContent value="employment" className="mt-0">
                <EmploymentMetrics 
                  data={dashboardData} 
                  timeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="housing" className="mt-0">
                <HousingMetrics 
                  data={dashboardData} 
                  timeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="income" className="mt-0">
                <IncomeMetrics 
                  data={dashboardData} 
                  timeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </TabsContent>
              
              <TabsContent value="business" className="mt-0">
                <BusinessDemographicsMetrics 
                  data={dashboardData} 
                  timeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </TabsContent>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EconomicIndicatorsDashboard;