/**
 * School District Map Component
 * 
 * Streamlined component for TerraFusion architecture
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { School as SchoolIcon } from 'lucide-react';

interface SchoolDistrictMapProps {
  initialCity?: string;
  initialState?: string;
  height?: number | string;
  width?: number | string;
  className?: string;
}

export const SchoolDistrictMap: React.FC<SchoolDistrictMapProps> = ({
  initialCity = "Denver",
  initialState = "CO",
  height = 400,
  width = "100%",
  className = ""
}) => {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SchoolIcon className="h-5 w-5" />
          School Districts - {initialCity}, {initialState}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300"
          style={{ height, width }}
        >
          <div className="text-center space-y-4">
            <SchoolIcon className="h-12 w-12 mx-auto text-slate-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-slate-600">School District Analytics</h3>
              <p className="text-sm text-slate-500 max-w-md">
                Interactive school district mapping and analytics for {initialCity}, {initialState}
              </p>
              <Badge variant="outline" className="mt-2">
                TerraFusion Ready
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolDistrictMap;