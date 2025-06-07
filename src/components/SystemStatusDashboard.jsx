import React from 'react';
import { motion } from 'framer-motion';

const SystemStatusDashboard = ({ systemStatus, aiOperations, performanceMetrics }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="space-y-6">
        {/* System Health Overview */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">System Health</h3>
          <div className="grid grid-cols-3 gap-4">
            {systemStatus.map((status, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{status.name}</div>
                    <div className="text-sm text-gray-400">{status.description}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status.state)}`} />
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-400">Current Value:</div>
                  <div className="text-white font-medium">{status.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active AI Operations */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">Active AI Operations</h3>
          <div className="space-y-4">
            {aiOperations.map((op, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{op.name}</div>
                    <div className="text-sm text-gray-400">{op.description}</div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Progress: {op.progress}%
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${op.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <div>Started: {new Date(op.startTime).toLocaleTimeString()}</div>
                  <div>ETA: {op.eta}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{metric.name}</div>
                    <div className="text-sm text-gray-400">{metric.description}</div>
                  </div>
                  <div className="text-white font-medium">{metric.value}</div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-400">Trend:</div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      metric.trend === 'up' ? 'bg-green-500' :
                      metric.trend === 'down' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="text-sm text-gray-400">{metric.trendDescription}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">System Alerts</h3>
          <div className="space-y-3">
            {systemStatus
              .filter(status => status.state === 'warning' || status.state === 'critical')
              .map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg ${
                    alert.state === 'critical' ? 'bg-red-900/50' : 'bg-yellow-900/50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.state === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div className="ml-3">
                      <div className="text-white font-medium">{alert.name}</div>
                      <div className="text-sm text-gray-400">{alert.alertMessage}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusDashboard; 