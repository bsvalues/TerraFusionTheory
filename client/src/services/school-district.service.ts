/**
 * School District Service
 * 
 * This service handles fetching and processing school district data
 * for the School District Analysis Feature.
 */

import { apiRequest } from '@/lib/queryClient';

// Types for school district data
export interface School {
  id: string;
  name: string;
  type: 'elementary' | 'middle' | 'high' | 'charter' | 'private' | 'other';
  district: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
  gradeRange: string; // e.g., "K-5", "6-8", "9-12"
  enrollment: number;
  studentTeacherRatio: number;
  rating: number; // 1-10 rating
  testScores: {
    math: number; // percentile
    reading: number; // percentile
    science?: number; // percentile
  };
  location: {
    latitude: number;
    longitude: number;
  };
  collegeBound?: number; // percentage for high schools
  graduationRate?: number; // percentage for high schools
  diversity?: {
    white: number; // percentage
    black: number; // percentage
    hispanic: number; // percentage
    asian: number; // percentage
    other: number; // percentage
  };
}

export interface SchoolDistrict {
  id: string;
  name: string;
  county: string;
  state: string;
  schools: string[]; // IDs of schools in this district
  averageRating: number;
  averageTestScores: {
    math: number;
    reading: number;
    science?: number;
  };
  boundaries: GeoJSON.Polygon;
  studentPopulation: number;
  demographicData?: {
    economicallyDisadvantaged: number; // percentage
    englishLanguageLearners: number; // percentage
    specialEducation: number; // percentage
  };
  budgetPerStudent?: number;
  performanceTrend?: 'improving' | 'stable' | 'declining';
}

export interface SchoolSearchParams {
  city?: string;
  state?: string;
  district?: string;
  type?: string;
  minRating?: number;
  maxStudentTeacherRatio?: number;
  within?: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
  };
}

export interface SchoolComparisonResult {
  schools: School[];
  comparisonMetrics: {
    rating: { min: number; max: number; avg: number };
    studentTeacherRatio: { min: number; max: number; avg: number };
    testScores: {
      math: { min: number; max: number; avg: number };
      reading: { min: number; max: number; avg: number };
      science?: { min: number; max: number; avg: number };
    };
    enrollment: { min: number; max: number; avg: number };
  };
  rankings: {
    byRating: string[]; // School IDs in ranking order
    byStudentTeacherRatio: string[]; // School IDs in ranking order (best ratio first)
    byTestScores: string[]; // School IDs in ranking order
  };
}

class SchoolDistrictService {
  /**
   * Get all school districts in the specified city and state
   * @param city The city name
   * @param state The state code
   * @returns Array of school districts
   */
  async getSchoolDistricts(city: string, state: string): Promise<SchoolDistrict[]> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get(`/api/school-districts?city=${city}&state=${state}`);
      
      // Demo implementation for Richland, WA
      if (city === 'Richland' && state === 'WA') {
        return [
          {
            id: 'richland-sd',
            name: 'Richland School District',
            county: 'Benton',
            state: 'WA',
            schools: [
              'richland-high',
              'hanford-high',
              'lewis-clark-elementary',
              'enterprise-middle',
              'white-bluffs-elementary'
            ],
            averageRating: 8.2,
            averageTestScores: {
              math: 82,
              reading: 85,
              science: 80
            },
            boundaries: {
              type: 'Polygon',
              coordinates: [[
                [-119.35, 46.22],
                [-119.25, 46.22],
                [-119.25, 46.32],
                [-119.35, 46.32],
                [-119.35, 46.22]
              ]]
            },
            studentPopulation: 13825,
            demographicData: {
              economicallyDisadvantaged: 26,
              englishLanguageLearners: 5,
              specialEducation: 14
            },
            budgetPerStudent: 12768,
            performanceTrend: 'stable'
          }
        ];
      } 
      else if (city === 'Grandview' && state === 'WA') {
        return [
          {
            id: 'grandview-sd',
            name: 'Grandview School District',
            county: 'Yakima',
            state: 'WA',
            schools: [
              'grandview-high',
              'grandview-middle',
              'mcclure-elementary',
              'harriet-thompson-elementary'
            ],
            averageRating: 6.8,
            averageTestScores: {
              math: 68,
              reading: 72,
              science: 65
            },
            boundaries: {
              type: 'Polygon',
              coordinates: [[
                [-119.95, 46.22],
                [-119.85, 46.22],
                [-119.85, 46.28],
                [-119.95, 46.28],
                [-119.95, 46.22]
              ]]
            },
            studentPopulation: 3720,
            demographicData: {
              economicallyDisadvantaged: 72,
              englishLanguageLearners: 28,
              specialEducation: 16
            },
            budgetPerStudent: 11420,
            performanceTrend: 'improving'
          }
        ];
      }
      // Return empty array for unsupported cities
      return [];
    } catch (error) {
      console.error('Error fetching school districts:', error);
      throw new Error('Failed to fetch school districts');
    }
  }

  /**
   * Get all schools by provided search parameters
   * @param params Search parameters for filtering schools
   * @returns Array of schools matching the search criteria
   */
  async getSchools(params: SchoolSearchParams): Promise<School[]> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get('/api/schools', { params });
      
      // Demo implementation
      const city = params.city || '';
      const state = params.state || '';
      const district = params.district || '';
      
      // Richland schools
      if ((city === 'Richland' && state === 'WA') || district === 'richland-sd') {
        return [
          {
            id: 'richland-high',
            name: 'Richland High School',
            type: 'high',
            district: 'Richland School District',
            address: '930 Long Avenue',
            city: 'Richland',
            state: 'WA',
            zip: '99352',
            phone: '(509) 967-6535',
            website: 'https://www.rsd.edu/schools/richland-high-school',
            gradeRange: '9-12',
            enrollment: 1820,
            studentTeacherRatio: 18.5,
            rating: 8.5,
            testScores: {
              math: 85,
              reading: 88,
              science: 83
            },
            location: {
              latitude: 46.2851,
              longitude: -119.2754
            },
            collegeBound: 78,
            graduationRate: 92,
            diversity: {
              white: 68,
              black: 3,
              hispanic: 16,
              asian: 8,
              other: 5
            }
          },
          {
            id: 'hanford-high',
            name: 'Hanford High School',
            type: 'high',
            district: 'Richland School District',
            address: '450 Hanford Street',
            city: 'Richland',
            state: 'WA',
            zip: '99352',
            phone: '(509) 967-6500',
            website: 'https://www.rsd.edu/schools/hanford-high-school',
            gradeRange: '9-12',
            enrollment: 1920,
            studentTeacherRatio: 19.2,
            rating: 9.0,
            testScores: {
              math: 88,
              reading: 90,
              science: 86
            },
            location: {
              latitude: 46.2477,
              longitude: -119.2895
            },
            collegeBound: 82,
            graduationRate: 94,
            diversity: {
              white: 72,
              black: 2,
              hispanic: 14,
              asian: 9,
              other: 3
            }
          },
          {
            id: 'enterprise-middle',
            name: 'Enterprise Middle School',
            type: 'middle',
            district: 'Richland School District',
            address: '5200 Paradise Way',
            city: 'West Richland',
            state: 'WA',
            zip: '99353',
            phone: '(509) 967-6300',
            website: 'https://www.rsd.edu/schools/enterprise-middle-school',
            gradeRange: '6-8',
            enrollment: 950,
            studentTeacherRatio: 21.5,
            rating: 8.0,
            testScores: {
              math: 79,
              reading: 82,
              science: 80
            },
            location: {
              latitude: 46.2896,
              longitude: -119.3780
            }
          },
          {
            id: 'lewis-clark-elementary',
            name: 'Lewis & Clark Elementary',
            type: 'elementary',
            district: 'Richland School District',
            address: '415 Jadwin Avenue',
            city: 'Richland',
            state: 'WA',
            zip: '99352',
            phone: '(509) 967-6275',
            website: 'https://www.rsd.edu/schools/lewis-clark-elementary',
            gradeRange: 'K-5',
            enrollment: 620,
            studentTeacherRatio: 18.2,
            rating: 7.8,
            testScores: {
              math: 76,
              reading: 80
            },
            location: {
              latitude: 46.2824,
              longitude: -119.2732
            }
          },
          {
            id: 'white-bluffs-elementary',
            name: 'White Bluffs Elementary',
            type: 'elementary',
            district: 'Richland School District',
            address: '1250 Kensington Way',
            city: 'Richland',
            state: 'WA',
            zip: '99352',
            phone: '(509) 967-6575',
            website: 'https://www.rsd.edu/schools/white-bluffs-elementary',
            gradeRange: 'K-5',
            enrollment: 680,
            studentTeacherRatio: 17.8,
            rating: 8.3,
            testScores: {
              math: 82,
              reading: 85
            },
            location: {
              latitude: 46.2465,
              longitude: -119.2912
            }
          }
        ];
      }
      // Grandview schools
      else if ((city === 'Grandview' && state === 'WA') || district === 'grandview-sd') {
        return [
          {
            id: 'grandview-high',
            name: 'Grandview High School',
            type: 'high',
            district: 'Grandview School District',
            address: '1601 W 5th Street',
            city: 'Grandview',
            state: 'WA',
            zip: '98930',
            phone: '(509) 882-8650',
            website: 'https://www.gsd200.org/Domain/9',
            gradeRange: '9-12',
            enrollment: 920,
            studentTeacherRatio: 18.9,
            rating: 6.8,
            testScores: {
              math: 65,
              reading: 72,
              science: 68
            },
            location: {
              latitude: 46.2551,
              longitude: -119.9184
            },
            collegeBound: 56,
            graduationRate: 85,
            diversity: {
              white: 24,
              black: 1,
              hispanic: 72,
              asian: 1,
              other: 2
            }
          },
          {
            id: 'grandview-middle',
            name: 'Grandview Middle School',
            type: 'middle',
            district: 'Grandview School District',
            address: '1401 W 2nd Street',
            city: 'Grandview',
            state: 'WA',
            zip: '98930',
            phone: '(509) 882-8650',
            website: 'https://www.gsd200.org/Domain/10',
            gradeRange: '6-8',
            enrollment: 720,
            studentTeacherRatio: 20.5,
            rating: 6.5,
            testScores: {
              math: 62,
              reading: 69,
              science: 64
            },
            location: {
              latitude: 46.2531,
              longitude: -119.9143
            }
          },
          {
            id: 'mcclure-elementary',
            name: 'McClure Elementary School',
            type: 'elementary',
            district: 'Grandview School District',
            address: '811 W 2nd Street',
            city: 'Grandview',
            state: 'WA',
            zip: '98930',
            phone: '(509) 882-4700',
            website: 'https://www.gsd200.org/Domain/11',
            gradeRange: '3-5',
            enrollment: 580,
            studentTeacherRatio: 19.2,
            rating: 6.7,
            testScores: {
              math: 64,
              reading: 70
            },
            location: {
              latitude: 46.2525,
              longitude: -119.9076
            }
          },
          {
            id: 'harriet-thompson-elementary',
            name: 'Harriet Thompson Elementary',
            type: 'elementary',
            district: 'Grandview School District',
            address: '310 Euclid Road',
            city: 'Grandview',
            state: 'WA',
            zip: '98930',
            phone: '(509) 882-2700',
            website: 'https://www.gsd200.org/Domain/12',
            gradeRange: 'K-2',
            enrollment: 650,
            studentTeacherRatio: 18.5,
            rating: 7.0,
            testScores: {
              math: 68,
              reading: 72
            },
            location: {
              latitude: 46.2567,
              longitude: -119.9029
            }
          }
        ];
      }
      
      // Return empty array for unsupported cities
      return [];
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw new Error('Failed to fetch schools');
    }
  }

  /**
   * Get a specific school by ID
   * @param schoolId The ID of the school to retrieve
   * @returns School details
   */
  async getSchoolById(schoolId: string): Promise<School | null> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get(`/api/schools/${schoolId}`);
      
      // For demo purposes, we'll just fetch all schools and find the matching one
      const richlandSchools = await this.getSchools({ city: 'Richland', state: 'WA' });
      const grandviewSchools = await this.getSchools({ city: 'Grandview', state: 'WA' });
      const allSchools = [...richlandSchools, ...grandviewSchools];
      
      const school = allSchools.find(school => school.id === schoolId);
      return school || null;
    } catch (error) {
      console.error('Error fetching school details:', error);
      throw new Error('Failed to fetch school details');
    }
  }

  /**
   * Compare multiple schools across key metrics
   * @param schoolIds Array of school IDs to compare
   * @returns Comparison results with rankings and statistics
   */
  async compareSchools(schoolIds: string[]): Promise<SchoolComparisonResult> {
    try {
      // Fetch schools
      const schools: School[] = [];
      for (const id of schoolIds) {
        const school = await this.getSchoolById(id);
        if (school) {
          schools.push(school);
        }
      }
      
      if (schools.length === 0) {
        throw new Error('No valid schools found for comparison');
      }
      
      // Calculate metrics
      const ratings = schools.map(school => school.rating);
      const ratios = schools.map(school => school.studentTeacherRatio);
      const mathScores = schools.map(school => school.testScores.math);
      const readingScores = schools.map(school => school.testScores.reading);
      const scienceScores = schools
        .map(school => school.testScores.science)
        .filter((score): score is number => score !== undefined);
      const enrollments = schools.map(school => school.enrollment);
      
      // Calculate averages
      const avgRating = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
      const avgRatio = ratios.reduce((sum, val) => sum + val, 0) / ratios.length;
      const avgMath = mathScores.reduce((sum, val) => sum + val, 0) / mathScores.length;
      const avgReading = readingScores.reduce((sum, val) => sum + val, 0) / readingScores.length;
      const avgScience = scienceScores.length > 0 
        ? scienceScores.reduce((sum, val) => sum + val, 0) / scienceScores.length 
        : undefined;
      const avgEnrollment = enrollments.reduce((sum, val) => sum + val, 0) / enrollments.length;
      
      // Calculate rankings
      const byRating = [...schools]
        .sort((a, b) => b.rating - a.rating)
        .map(school => school.id);
        
      const byStudentTeacherRatio = [...schools]
        .sort((a, b) => a.studentTeacherRatio - b.studentTeacherRatio)
        .map(school => school.id);
        
      // Rank by average test score
      const byTestScores = [...schools]
        .sort((a, b) => {
          const aAvg = (a.testScores.math + a.testScores.reading + (a.testScores.science || 0)) / 
            (a.testScores.science ? 3 : 2);
          const bAvg = (b.testScores.math + b.testScores.reading + (b.testScores.science || 0)) / 
            (b.testScores.science ? 3 : 2);
          return bAvg - aAvg;
        })
        .map(school => school.id);
      
      return {
        schools,
        comparisonMetrics: {
          rating: {
            min: Math.min(...ratings),
            max: Math.max(...ratings),
            avg: avgRating
          },
          studentTeacherRatio: {
            min: Math.min(...ratios),
            max: Math.max(...ratios),
            avg: avgRatio
          },
          testScores: {
            math: {
              min: Math.min(...mathScores),
              max: Math.max(...mathScores),
              avg: avgMath
            },
            reading: {
              min: Math.min(...readingScores),
              max: Math.max(...readingScores),
              avg: avgReading
            },
            ...(scienceScores.length > 0 ? {
              science: {
                min: Math.min(...scienceScores),
                max: Math.max(...scienceScores),
                avg: avgScience || 0
              }
            } : {})
          },
          enrollment: {
            min: Math.min(...enrollments),
            max: Math.max(...enrollments),
            avg: avgEnrollment
          }
        },
        rankings: {
          byRating,
          byStudentTeacherRatio,
          byTestScores
        }
      };
    } catch (error) {
      console.error('Error comparing schools:', error);
      throw new Error('Failed to compare schools');
    }
  }

  /**
   * Get schools near a property
   * @param latitude Latitude of the property
   * @param longitude Longitude of the property
   * @param radiusMiles Radius to search in miles
   * @returns Array of schools within the specified radius, with distance property added
   */
  async getSchoolsNearProperty(
    latitude: number,
    longitude: number,
    radiusMiles: number = 2
  ): Promise<(School & { distance: number })[]> {
    try {
      // In a production app, this would be an API call using spatial query:
      // return await apiRequest.get('/api/schools/near', {
      //   params: { latitude, longitude, radiusMiles }
      // });
      
      // For demo purposes, we'll fetch a set of schools and filter them
      // based on a simple distance calculation
      
      // Richland is around 46.28, -119.28
      // Grandview is around 46.25, -119.90
      
      // Determine which city to use based on coordinates
      const isNearRichland = Math.abs(latitude - 46.28) < 0.1 && Math.abs(longitude - (-119.28)) < 0.1;
      const isNearGrandview = Math.abs(latitude - 46.25) < 0.1 && Math.abs(longitude - (-119.90)) < 0.1;
      
      let schools: School[] = [];
      
      if (isNearRichland) {
        schools = await this.getSchools({ city: 'Richland', state: 'WA' });
      } else if (isNearGrandview) {
        schools = await this.getSchools({ city: 'Grandview', state: 'WA' });
      } else {
        // If not near either city, return schools from both cities
        const richlandSchools = await this.getSchools({ city: 'Richland', state: 'WA' });
        const grandviewSchools = await this.getSchools({ city: 'Grandview', state: 'WA' });
        schools = [...richlandSchools, ...grandviewSchools];
      }
      
      // Calculate distance for each school and filter by radius
      const schoolsWithDistance = schools.map(school => {
        const distance = this.calculateDistance(
          latitude, 
          longitude, 
          school.location.latitude, 
          school.location.longitude
        );
        return { ...school, distance };
      }).filter(school => school.distance <= radiusMiles);
      
      return schoolsWithDistance;
    } catch (error) {
      console.error('Error fetching schools near property:', error);
      throw new Error('Failed to fetch schools near property');
    }
  }
  
  /**
   * Calculate distance between two points in miles using the Haversine formula
   */
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
const schoolDistrictService = new SchoolDistrictService();
export default schoolDistrictService;