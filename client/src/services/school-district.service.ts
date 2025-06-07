/**
 * School District Service
 * 
 * This service provides school district information and analysis for properties.
 */

import { apiRequest } from '@/lib/queryClient';

// School types and interfaces
export interface School {
  id: string;
  name: string;
  type: 'elementary' | 'middle' | 'high' | 'charter' | 'private';
  rating: number; // 0-10 scale
  studentCount: number;
  teacherCount: number;
  studentTeacherRatio: number;
  testScores: {
    math: number;
    reading: number;
    science: number;
    overall: number;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  demographics: {
    percentEligibleForFreeLunch: number;
    percentMinority: number;
    averageClassSize: number;
  };
  specialPrograms: string[];
  extracurriculars: string[];
  website?: string;
  phone?: string;
}

export interface SchoolDistrict {
  id: string;
  name: string;
  state: string;
  totalStudents: number;
  totalSchools: number;
  averageRating: number;
  budget: number;
  budgetPerStudent: number;
  graduationRate: number;
  collegeReadinessRate: number;
  schools: School[];
  boundaries: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  superintendent: string;
  website?: string;
  phone?: string;
}

class SchoolDistrictService {
  private static instance: SchoolDistrictService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SchoolDistrictService {
    if (!SchoolDistrictService.instance) {
      SchoolDistrictService.instance = new SchoolDistrictService();
    }
    return SchoolDistrictService.instance;
  }
  
  /**
   * Get school district by location
   */
  async getSchoolDistrictByLocation(latitude: number, longitude: number): Promise<SchoolDistrict | null> {
    try {
      // In production, this would call a real API
      // const district = await apiRequest.get('/api/school-districts/by-location', {
      //   params: { latitude, longitude }
      // });
      
      // For demo purposes, return mock data based on location
      const isRichlandArea = Math.abs(latitude - 46.28) < 0.1 && 
                              Math.abs(longitude - (-119.28)) < 0.2;
      const isGrandviewArea = Math.abs(latitude - 46.25) < 0.1 && 
                               Math.abs(longitude - (-119.91)) < 0.2;
      
      if (isRichlandArea) {
        return this.getRichlandSchoolDistrict();
      } else if (isGrandviewArea) {
        return this.getGrandviewSchoolDistrict();
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching school district:', error);
      return null;
    }
  }
  
  /**
   * Get nearby schools for a location
   */
  async getNearbySchools(latitude: number, longitude: number, radiusMiles: number = 5): Promise<School[]> {
    try {
      // In production, this would call a real API
      // const schools = await apiRequest.get('/api/schools/nearby', {
      //   params: { latitude, longitude, radius: radiusMiles }
      // });
      
      // For demo purposes, return mock schools based on location
      const isRichlandArea = Math.abs(latitude - 46.28) < 0.1 && 
                              Math.abs(longitude - (-119.28)) < 0.2;
      const isGrandviewArea = Math.abs(latitude - 46.25) < 0.1 && 
                               Math.abs(longitude - (-119.91)) < 0.2;
      
      if (isRichlandArea) {
        return this.getRichlandAreaSchools();
      } else if (isGrandviewArea) {
        return this.getGrandviewAreaSchools();
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching nearby schools:', error);
      return [];
    }
  }
  
  /**
   * Get school by ID
   */
  async getSchoolById(schoolId: string): Promise<School | null> {
    try {
      // In production, this would call a real API
      // const school = await apiRequest.get(`/api/schools/${schoolId}`);
      
      // For demo purposes, return a mock school
      const allSchools = [
        ...this.getRichlandAreaSchools(),
        ...this.getGrandviewAreaSchools()
      ];
      
      return allSchools.find(school => school.id === schoolId) || null;
    } catch (error) {
      console.error('Error fetching school:', error);
      return null;
    }
  }
  
  private getRichlandSchoolDistrict(): SchoolDistrict {
    return {
      id: 'richland-400',
      name: 'Richland School District',
      state: 'WA',
      totalStudents: 13500,
      totalSchools: 22,
      averageRating: 8.2,
      budget: 180000000,
      budgetPerStudent: 13333,
      graduationRate: 94.2,
      collegeReadinessRate: 78.5,
      schools: this.getRichlandAreaSchools(),
      boundaries: {
        type: 'Polygon',
        coordinates: [[
          [-119.35, 46.25],
          [-119.15, 46.25],
          [-119.15, 46.35],
          [-119.35, 46.35],
          [-119.35, 46.25]
        ]]
      },
      superintendent: 'Dr. Rick Schulte',
      website: 'https://www.rsd.edu',
      phone: '(509) 967-6000'
    };
  }
  
  private getGrandviewSchoolDistrict(): SchoolDistrict {
    return {
      id: 'grandview-200',
      name: 'Grandview School District',
      state: 'WA',
      totalStudents: 2800,
      totalSchools: 6,
      averageRating: 7.1,
      budget: 35000000,
      budgetPerStudent: 12500,
      graduationRate: 88.3,
      collegeReadinessRate: 65.2,
      schools: this.getGrandviewAreaSchools(),
      boundaries: {
        type: 'Polygon',
        coordinates: [[
          [-119.95, 46.20],
          [-119.85, 46.20],
          [-119.85, 46.30],
          [-119.95, 46.30],
          [-119.95, 46.20]
        ]]
      },
      superintendent: 'John Martinez',
      website: 'https://www.gsd200.org',
      phone: '(509) 882-0544'
    };
  }
  
  private getRichlandAreaSchools(): School[] {
    return [
      {
        id: 'richland-high',
        name: 'Richland High School',
        type: 'high',
        rating: 8.5,
        studentCount: 1850,
        teacherCount: 95,
        studentTeacherRatio: 19.5,
        testScores: {
          math: 82,
          reading: 85,
          science: 80,
          overall: 82.3
        },
        location: {
          latitude: 46.2851,
          longitude: -119.2754,
          address: '930 Long Ave, Richland, WA 99352'
        },
        demographics: {
          percentEligibleForFreeLunch: 25.3,
          percentMinority: 42.1,
          averageClassSize: 24
        },
        specialPrograms: ['Advanced Placement', 'International Baccalaureate', 'STEM Academy'],
        extracurriculars: ['Robotics', 'Drama', 'Football', 'Basketball', 'Track']
      },
      {
        id: 'hanford-high',
        name: 'Hanford High School',
        type: 'high',
        rating: 8.3,
        studentCount: 1650,
        teacherCount: 88,
        studentTeacherRatio: 18.8,
        testScores: {
          math: 80,
          reading: 83,
          science: 78,
          overall: 80.3
        },
        location: {
          latitude: 46.2945,
          longitude: -119.2688,
          address: '1301 Sheppard Ave, Richland, WA 99352'
        },
        demographics: {
          percentEligibleForFreeLunch: 28.7,
          percentMinority: 38.9,
          averageClassSize: 23
        },
        specialPrograms: ['Advanced Placement', 'Career Technical Education'],
        extracurriculars: ['Band', 'Soccer', 'Wrestling', 'Debate', 'Art Club']
      },
      {
        id: 'carmichael-middle',
        name: 'Carmichael Middle School',
        type: 'middle',
        rating: 8.1,
        studentCount: 750,
        teacherCount: 42,
        studentTeacherRatio: 17.9,
        testScores: {
          math: 75,
          reading: 78,
          science: 73,
          overall: 75.3
        },
        location: {
          latitude: 46.2792,
          longitude: -119.2881,
          address: '1320 Jadwin Ave, Richland, WA 99352'
        },
        demographics: {
          percentEligibleForFreeLunch: 32.1,
          percentMinority: 45.2,
          averageClassSize: 22
        },
        specialPrograms: ['Gifted and Talented', 'Band', 'Orchestra'],
        extracurriculars: ['Student Council', 'Science Olympiad', 'Basketball']
      }
    ];
  }
  
  private getGrandviewAreaSchools(): School[] {
    return [
      {
        id: 'grandview-high',
        name: 'Grandview High School',
        type: 'high',
        rating: 7.2,
        studentCount: 850,
        teacherCount: 48,
        studentTeacherRatio: 17.7,
        testScores: {
          math: 68,
          reading: 71,
          science: 65,
          overall: 68.0
        },
        location: {
          latitude: 46.2551,
          longitude: -119.9105,
          address: '1331 Euclid Ave, Grandview, WA 98930'
        },
        demographics: {
          percentEligibleForFreeLunch: 78.5,
          percentMinority: 92.3,
          averageClassSize: 21
        },
        specialPrograms: ['Agricultural Education', 'Career Technical Education'],
        extracurriculars: ['FFA', 'Soccer', 'Volleyball', 'Basketball']
      },
      {
        id: 'grandview-middle',
        name: 'Grandview Middle School',
        type: 'middle',
        rating: 6.8,
        studentCount: 420,
        teacherCount: 25,
        studentTeacherRatio: 16.8,
        testScores: {
          math: 62,
          reading: 65,
          science: 60,
          overall: 62.3
        },
        location: {
          latitude: 46.2534,
          longitude: -119.9126,
          address: '1307 W 2nd St, Grandview, WA 98930'
        },
        demographics: {
          percentEligibleForFreeLunch: 82.1,
          percentMinority: 94.7,
          averageClassSize: 19
        },
        specialPrograms: ['ESL Support', 'Title I'],
        extracurriculars: ['Student Council', 'Art Club', 'Cross Country']
      }
    ];
  }
}

const schoolDistrictService = SchoolDistrictService.getInstance();
export default schoolDistrictService;