import React from 'react';
import { Analysis } from '@/types';

interface AnalysisPanelProps {
  analysis: Analysis;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">BS Analysis</h3>
      </div>
      <div className="px-4 py-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Identified Requirements</h4>
            <ul className="mt-2 divide-y divide-gray-200">
              {analysis.identifiedRequirements.map((req, index) => (
                <li key={index} className="py-2 flex items-center">
                  <svg
                    className={`h-5 w-5 ${
                      req.status === 'success'
                        ? 'text-status-success'
                        : req.status === 'warning'
                        ? 'text-status-warning'
                        : 'text-status-error'
                    } mr-2`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {req.status === 'success' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    )}
                  </svg>
                  <span className="text-sm">{req.name}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Suggested Tech Stack</h4>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="col-span-1 bg-gray-50 rounded-md p-2">
                <h5 className="text-xs font-medium text-gray-700">Frontend</h5>
                <div className="mt-1 text-xs text-gray-500">{analysis.suggestedTechStack.frontend.description}</div>
              </div>
              <div className="col-span-1 bg-gray-50 rounded-md p-2">
                <h5 className="text-xs font-medium text-gray-700">Backend</h5>
                <div className="mt-1 text-xs text-gray-500">{analysis.suggestedTechStack.backend.description}</div>
              </div>
              <div className="col-span-1 bg-gray-50 rounded-md p-2">
                <h5 className="text-xs font-medium text-gray-700">Database</h5>
                <div className="mt-1 text-xs text-gray-500">{analysis.suggestedTechStack.database.description}</div>
              </div>
              <div className="col-span-1 bg-gray-50 rounded-md p-2">
                <h5 className="text-xs font-medium text-gray-700">Hosting</h5>
                <div className="mt-1 text-xs text-gray-500">{analysis.suggestedTechStack.hosting.description}</div>
              </div>
            </div>
          </div>
          
          {analysis.missingInformation.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Missing Information</h4>
              <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-md p-3">
                <div className="flex">
                  <svg className="h-5 w-5 text-status-warning mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p>Still need information on:</p>
                    <ul className="list-disc pl-5 mt-1 text-xs">
                      {analysis.missingInformation.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Next Steps</h4>
            <ul className="mt-2 space-y-2">
              {analysis.nextSteps.map((step, index) => (
                <li key={index} className="flex items-center">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 text-xs font-medium text-gray-800 mr-2">
                    {step.order}
                  </span>
                  <span className="text-sm">{step.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
