import React, { useState } from 'react';
import CommandCenter from './CommandCenter';
import AITransparencyPanel from './AITransparencyPanel';
import UserControlInterface from './UserControlInterface';
import SystemStatusDashboard from './SystemStatusDashboard';

const MainLayout = () => {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [systemStatus, setSystemStatus] = useState([
    {
      name: 'AI Processing',
      description: 'Current AI system load',
      state: 'optimal',
      value: '45%',
      alertMessage: null
    },
    {
      name: 'Memory Usage',
      description: 'System memory utilization',
      state: 'warning',
      value: '78%',
      alertMessage: 'Memory usage approaching threshold'
    },
    {
      name: 'Network Latency',
      description: 'API response times',
      state: 'optimal',
      value: '120ms',
      alertMessage: null
    }
  ]);

  const [aiOperations, setAiOperations] = useState([
    {
      name: 'Market Analysis',
      description: 'Analyzing current market trends',
      progress: 65,
      startTime: new Date(),
      eta: '2 minutes'
    },
    {
      name: 'Property Valuation',
      description: 'Updating property value estimates',
      progress: 30,
      startTime: new Date(),
      eta: '5 minutes'
    }
  ]);

  const [performanceMetrics, setPerformanceMetrics] = useState([
    {
      name: 'Prediction Accuracy',
      description: 'AI model accuracy rate',
      value: '94.5%',
      trend: 'up',
      trendDescription: 'Improving over last week'
    },
    {
      name: 'Processing Speed',
      description: 'Average operation time',
      value: '1.2s',
      trend: 'down',
      trendDescription: 'Faster than last week'
    }
  ]);

  const handleCommand = (command) => {
    console.log('Executing command:', command);
    // Implement command execution logic
  };

  const handleOverride = (operationId, overrideType) => {
    console.log('Overriding operation:', operationId, overrideType);
    // Implement override logic
  };

  const handleFeedback = (feedback) => {
    console.log('Submitting feedback:', feedback);
    // Implement feedback submission logic
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Command Center */}
          <div className="col-span-8">
            <CommandCenter />
          </div>

          {/* System Status Dashboard */}
          <div className="col-span-4">
            <SystemStatusDashboard
              systemStatus={systemStatus}
              aiOperations={aiOperations}
              performanceMetrics={performanceMetrics}
            />
          </div>

          {/* User Control Interface */}
          <div className="col-span-6">
            <UserControlInterface
              onCommand={handleCommand}
              onOverride={handleOverride}
              onFeedback={handleFeedback}
            />
          </div>

          {/* AI Transparency Panel */}
          <div className="col-span-6">
            {selectedOperation && (
              <AITransparencyPanel
                aiOperation={selectedOperation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 