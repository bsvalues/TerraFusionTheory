import React from 'react';
import { Button } from '@/components/ui/button';
import AddressMap from '@/components/gis/AddressMap';
import { Link } from 'wouter';

const GISDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">GIS Integration Demo</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 bg-white">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">ArcGIS Address Search</h2>
                <p className="text-gray-600">
                  This demo showcases integration with ArcGIS services, specifically the Addresses feature service. 
                  You can search for addresses using different spatial query methods.
                </p>
              </div>
              
              <AddressMap />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GISDemo;