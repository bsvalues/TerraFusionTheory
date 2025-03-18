import React from 'react';
import { Architecture } from '@/types';

interface ArchitectureSketchProps {
  architecture: Architecture;
}

const ArchitectureSketch: React.FC<ArchitectureSketchProps> = () => {
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Preliminary Architecture Sketch</h3>
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary hover:bg-primary-50 focus:outline-none">
            <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <div className="px-4 py-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Architecture Diagram (Simplified HTML/CSS Representation) */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200" style={{ minHeight: '400px' }}>
            {/* User Interface Layer */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-16 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center text-xs font-medium text-blue-800">
                    Admin Portal
                  </div>
                  <div className="h-6 border-l border-gray-400"></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-16 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center text-xs font-medium text-blue-800">
                    Assessment Portal
                  </div>
                  <div className="h-6 border-l border-gray-400"></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-16 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center text-xs font-medium text-blue-800">
                    Taxpayer Portal
                  </div>
                  <div className="h-6 border-l border-gray-400"></div>
                </div>
              </div>
            </div>
            
            {/* API Layer */}
            <div className="flex justify-center mb-8">
              <div className="w-96 h-16 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center text-xs font-medium text-green-800">
                RESTful API Services Layer
              </div>
            </div>
            <div className="flex justify-center mb-8">
              <div className="w-5/6 border-t border-gray-400"></div>
            </div>
            
            {/* Business Logic Layer */}
            <div className="flex justify-center mb-8">
              <div className="grid grid-cols-4 gap-4">
                <div className="w-32 h-16 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center text-xs font-medium text-purple-800 text-center">
                  User Management
                </div>
                <div className="w-32 h-16 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center text-xs font-medium text-purple-800 text-center">
                  Property Assessment
                </div>
                <div className="w-32 h-16 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center text-xs font-medium text-purple-800 text-center">
                  Reporting & Analytics
                </div>
                <div className="w-32 h-16 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center text-xs font-medium text-purple-800 text-center">
                  Integration Services
                </div>
              </div>
            </div>
            
            {/* Data Layer */}
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <div className="h-6 border-l border-gray-400"></div>
                  <div className="w-32 h-16 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center justify-center text-xs font-medium text-yellow-800">
                    PostgreSQL
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-6 border-l border-gray-400"></div>
                  <div className="w-32 h-16 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center text-xs font-medium text-red-800">
                    Document Store
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-6 border-l border-gray-400"></div>
                  <div className="w-32 h-16 bg-indigo-100 border border-indigo-300 rounded-lg flex items-center justify-center text-xs font-medium text-indigo-800">
                    Cache Layer
                  </div>
                </div>
              </div>
            </div>
            
            {/* External Systems */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-16">
                <div className="flex flex-col items-center">
                  <div className="h-6 border-l border-gray-400 border-dashed"></div>
                  <div className="w-32 h-16 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center text-xs font-medium text-gray-800">
                    GIS System
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-6 border-l border-gray-400 border-dashed"></div>
                  <div className="w-32 h-16 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center text-xs font-medium text-gray-800">
                    Taxpayer Portal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Note: This is a preliminary architecture based on current requirements. It will be refined as more details are confirmed.</p>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureSketch;
