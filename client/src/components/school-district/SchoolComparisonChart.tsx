/**
 * School Comparison Chart Component
 * 
 * This component allows comparing multiple schools across key metrics
 * like ratings, student-teacher ratios, and test scores.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { School, Award, BarChart2, FileBarChart2, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import schoolDistrictService, { 
  School as SchoolType, 
  SchoolComparisonResult
} from '@/services/school-district.service';

// Define component props
interface SchoolComparisonChartProps {
  schoolIds: string[];
  className?: string;
}

// Type for chart mode
type ChartMode = 'ratings' | 'studentTeacherRatio' | 'testScores' | 'enrollment' | 'overview';

// Chart component for ratings
const RatingsChart: React.FC<{ comparison: SchoolComparisonResult }> = ({ comparison }) => {
  const data = comparison.schools.map(school => ({
    name: school.name.split(' ').slice(0, 2).join(' '), // Shorten name to first two words
    rating: school.rating,
    avg: comparison.comparisonMetrics.rating.avg
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={80} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 10]} 
          tick={{ fontSize: 12 }}
          label={{ 
            value: 'Rating (0-10)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px' }
          }}
        />
        <RechartsTooltip 
          formatter={(value: number) => [`${value.toFixed(1)}`, 'Rating']}
        />
        <Legend />
        <Bar name="School Rating" dataKey="rating" fill="#3b82f6" />
        <Bar name="Average Rating" dataKey="avg" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Chart component for student-teacher ratio
const RatioChart: React.FC<{ comparison: SchoolComparisonResult }> = ({ comparison }) => {
  const data = comparison.schools.map(school => ({
    name: school.name.split(' ').slice(0, 2).join(' '), // Shorten name to first two words
    ratio: school.studentTeacherRatio,
    avg: comparison.comparisonMetrics.studentTeacherRatio.avg
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 'dataMax + 5']} 
          tick={{ fontSize: 12 }}
          label={{ 
            value: 'Student-Teacher Ratio', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px' }
          }}
        />
        <RechartsTooltip 
          formatter={(value: number) => [`${value.toFixed(1)}:1`, 'Ratio']}
        />
        <Legend />
        <Bar name="Student-Teacher Ratio" dataKey="ratio" fill="#f97316" />
        <Bar name="Average Ratio" dataKey="avg" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Chart component for test scores
const TestScoresChart: React.FC<{ comparison: SchoolComparisonResult }> = ({ comparison }) => {
  const data = comparison.schools.map(school => ({
    name: school.name.split(' ').slice(0, 2).join(' '), // Shorten name to first two words
    math: school.testScores.math,
    reading: school.testScores.reading,
    science: school.testScores.science || 0,
    avgMath: comparison.comparisonMetrics.testScores.math.avg,
    avgReading: comparison.comparisonMetrics.testScores.reading.avg,
    avgScience: comparison.comparisonMetrics.testScores.science?.avg || 0
  }));
  
  const hasScience = comparison.schools.some(school => school.testScores.science !== undefined);
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 12 }}
          label={{ 
            value: 'Test Scores (Percentile)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px' }
          }}
        />
        <RechartsTooltip 
          formatter={(value: number, name: string) => {
            const displayName = name.startsWith('avg') 
              ? `Avg ${name.replace('avg', '')}`
              : name;
            return [`${value.toFixed(0)}%`, displayName.charAt(0).toUpperCase() + displayName.slice(1)];
          }}
        />
        <Legend />
        <Bar name="Math" dataKey="math" fill="#3b82f6" />
        <Bar name="Reading" dataKey="reading" fill="#f97316" />
        {hasScience && <Bar name="Science" dataKey="science" fill="#10b981" />}
      </BarChart>
    </ResponsiveContainer>
  );
};

// Chart component for enrollment
const EnrollmentChart: React.FC<{ comparison: SchoolComparisonResult }> = ({ comparison }) => {
  const data = comparison.schools.map(school => ({
    name: school.name.split(' ').slice(0, 2).join(' '), // Shorten name to first two words
    enrollment: school.enrollment,
    avg: comparison.comparisonMetrics.enrollment.avg
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 'dataMax + 500']} 
          tick={{ fontSize: 12 }}
          label={{ 
            value: 'Student Enrollment', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px' }
          }}
        />
        <RechartsTooltip 
          formatter={(value: number) => [`${value.toLocaleString()}`, 'Students']}
        />
        <Legend />
        <Bar name="Enrollment" dataKey="enrollment" fill="#10b981" />
        <Bar name="Average Enrollment" dataKey="avg" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Radar chart for school overview
const OverviewChart: React.FC<{ comparison: SchoolComparisonResult }> = ({ comparison }) => {
  // Normalize data to 0-100 scale for radar chart
  const normalizedData = comparison.schools.map(school => {
    // For student-teacher ratio, lower is better, so we invert the scale
    const minRatio = comparison.comparisonMetrics.studentTeacherRatio.min;
    const maxRatio = comparison.comparisonMetrics.studentTeacherRatio.max;
    const ratioRange = maxRatio - minRatio;
    
    // Normalize ratio (inverted so lower is better)
    const normalizedRatio = ratioRange === 0
      ? 100
      : 100 - (((school.studentTeacherRatio - minRatio) / ratioRange) * 100);
    
    // For rating, higher is better (0-10 scale)
    const normalizedRating = (school.rating / 10) * 100;
    
    // For test scores, they're already percentiles (0-100)
    const mathScore = school.testScores.math;
    const readingScore = school.testScores.reading;
    
    // For enrollment, we normalize based on the min/max in comparison
    const minEnrollment = comparison.comparisonMetrics.enrollment.min;
    const maxEnrollment = comparison.comparisonMetrics.enrollment.max;
    const enrollmentRange = maxEnrollment - minEnrollment;
    
    const normalizedEnrollment = enrollmentRange === 0
      ? 50
      : ((school.enrollment - minEnrollment) / enrollmentRange) * 100;
    
    return {
      name: school.name.split(' ').slice(0, 2).join(' '), // Shorten name to first two words
      fullName: school.name,
      'School Rating': normalizedRating,
      'Math Score': mathScore,
      'Reading Score': readingScore,
      'Student-Teacher Ratio': normalizedRatio,
      'Enrollment': normalizedEnrollment
    };
  });
  
  // For category labels on the radar chart
  const categories = [
    { name: 'School Rating', displayName: 'Rating', fullMark: 100 },
    { name: 'Math Score', displayName: 'Math', fullMark: 100 },
    { name: 'Reading Score', displayName: 'Reading', fullMark: 100 },
    { name: 'Student-Teacher Ratio', displayName: 'S-T Ratio', fullMark: 100 },
    { name: 'Enrollment', displayName: 'Size', fullMark: 100 }
  ];
  
  // Colors for each school in the radar chart
  const colors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899'];
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart outerRadius={120} width={500} height={350} data={normalizedData}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={{ fontSize: 10 }} 
        />
        {comparison.schools.map((school, index) => (
          <Radar
            key={school.id}
            name={school.name}
            dataKey={school.name}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.2}
          />
        ))}
        
        {/* Create a radar for each metric */}
        {categories.map((category, i) => (
          <Radar
            key={category.name}
            name={category.displayName}
            dataKey={category.name}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.2}
          />
        ))}
        
        <Legend />
        <RechartsTooltip/>
      </RadarChart>
    </ResponsiveContainer>
  );
};

// Main component
const SchoolComparisonChart: React.FC<SchoolComparisonChartProps> = ({
  schoolIds,
  className
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('overview');
  
  // Query to fetch school comparison data
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['/api/schools/compare', schoolIds],
    queryFn: async () => {
      return await schoolDistrictService.compareSchools(schoolIds);
    },
    enabled: schoolIds.length > 0
  });
  
  // Get school type counts
  const getSchoolTypeCounts = () => {
    if (!comparison) return {};
    
    const typeCounts: Record<string, number> = {};
    comparison.schools.forEach(school => {
      typeCounts[school.type] = (typeCounts[school.type] || 0) + 1;
    });
    
    return typeCounts;
  };
  
  // Get highest and lowest ranked schools
  const getRankings = () => {
    if (!comparison) return {};
    
    return {
      highestRated: comparison.schools.find(s => s.id === comparison.rankings.byRating[0]),
      lowestRated: comparison.schools.find(s => s.id === comparison.rankings.byRating[comparison.rankings.byRating.length - 1]),
      bestRatio: comparison.schools.find(s => s.id === comparison.rankings.byStudentTeacherRatio[0]),
      worstRatio: comparison.schools.find(s => s.id === comparison.rankings.byStudentTeacherRatio[comparison.rankings.byStudentTeacherRatio.length - 1]),
      highestTestScores: comparison.schools.find(s => s.id === comparison.rankings.byTestScores[0]),
      lowestTestScores: comparison.schools.find(s => s.id === comparison.rankings.byTestScores[comparison.rankings.byTestScores.length - 1])
    };
  };
  
  return (
    <Card className={cn("shadow-md overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Award className="mr-2 h-5 w-5" />
          School Comparison
        </CardTitle>
        <CardDescription>
          {comparison ? `Comparing ${comparison.schools.length} schools` : 'Loading comparison data...'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-[300px]" />
          </div>
        ) : !comparison ? (
          <div className="py-10 text-center">
            <School className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              Select at least two schools to compare
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Tabs 
                value={chartMode} 
                onValueChange={(value) => setChartMode(value as ChartMode)}
                className="w-full"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex items-center">
                    <Activity className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="ratings" className="flex items-center">
                    <Award className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Ratings</span>
                  </TabsTrigger>
                  <TabsTrigger value="studentTeacherRatio" className="flex items-center">
                    <School className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">S-T Ratio</span>
                  </TabsTrigger>
                  <TabsTrigger value="testScores" className="flex items-center">
                    <FileBarChart2 className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Test Scores</span>
                  </TabsTrigger>
                  <TabsTrigger value="enrollment" className="flex items-center">
                    <BarChart2 className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Enrollment</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="mb-4">
              <ScrollArea className="w-full flex-row mb-4">
                <div className="flex space-x-2 py-1">
                  {comparison.schools.map(school => (
                    <Badge key={school.id} variant="outline">
                      {school.name}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="min-h-[300px]">
              {chartMode === 'overview' && <OverviewChart comparison={comparison} />}
              {chartMode === 'ratings' && <RatingsChart comparison={comparison} />}
              {chartMode === 'studentTeacherRatio' && <RatioChart comparison={comparison} />}
              {chartMode === 'testScores' && <TestScoresChart comparison={comparison} />}
              {chartMode === 'enrollment' && <EnrollmentChart comparison={comparison} />}
            </div>
            
            <div className="mt-6 p-4 rounded-md border text-sm">
              <h4 className="font-medium mb-2">Key Insights</h4>
              <ul className="list-disc list-inside space-y-1">
                {comparison.schools.length > 0 && (
                  <>
                    <li>Highest rated school is <span className="font-medium">{getRankings().highestRated?.name}</span> with a rating of {getRankings().highestRated?.rating}/10</li>
                    {comparison.schools.length > 1 && (
                      <li>Best student-teacher ratio is at <span className="font-medium">{getRankings().bestRatio?.name}</span> with {getRankings().bestRatio?.studentTeacherRatio}:1</li>
                    )}
                    {comparison.schools.length > 1 && (
                      <li>Highest test scores are at <span className="font-medium">{getRankings().highestTestScores?.name}</span> with Math: {getRankings().highestTestScores?.testScores.math}%, Reading: {getRankings().highestTestScores?.testScores.reading}%</li>
                    )}
                    <li>Average school rating is {comparison.comparisonMetrics.rating.avg.toFixed(1)}/10</li>
                    <li>Average student-teacher ratio is {comparison.comparisonMetrics.studentTeacherRatio.avg.toFixed(1)}:1</li>
                  </>
                )}
              </ul>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between py-3 text-xs text-muted-foreground">
        <div>
          Compare key metrics across schools
        </div>
      </CardFooter>
    </Card>
  );
};

export default SchoolComparisonChart;