import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SacredGeometryVisualizer from './SacredGeometryVisualizer';
import PropertyFlowCard from './PropertyFlowCard';

const CommandCenter = () => {
  const [activeView, setActiveView] = useState('market');
  const [aiOperations, setAiOperations] = useState([]);
  const [userDecisions, setUserDecisions] = useState([]);

  const handleAIOperation = (operation) => {
    setAiOperations(prev => [...prev, {
      ...operation,
      timestamp: new Date(),
      status: 'pending',
      userApproval: null
    }]);
  };

  const handleUserDecision = (operationId, decision) => {
    setAiOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, status: decision ? 'approved' : 'rejected', userApproval: decision }
        : op
    ));
    setUserDecisions(prev => [...prev, { operationId, decision, timestamp: new Date() }]);
  };

  return (
    <div className="h-screen flex">
      {/* Main Control Panel */}
      <div className="flex-1 p-6 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light text-white">GAMA Command Center</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveView('market')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'market' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-gray-300'
              }`}
            >
              Market View
            </button>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'analysis' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-gray-300'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveView('signals')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'signals' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-gray-300'
              }`}
            >
              Market Signals
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Market Visualization */}
          <div className="col-span-2 h-[500px] bg-slate-800 rounded-xl overflow-hidden">
            <SacredGeometryVisualizer />
          </div>

          {/* AI Operations Log */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-xl font-light text-white mb-4">AI Operations</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {aiOperations.map(op => (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-slate-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{op.type}</h3>
                        <p className="text-gray-400 text-sm">{op.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUserDecision(op.id, true)}
                          className="px-3 py-1 bg-green-600 text-white rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUserDecision(op.id, false)}
                          className="px-3 py-1 bg-red-600 text-white rounded"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* User Decisions History */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-xl font-light text-white mb-4">Your Decisions</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {userDecisions.map(decision => (
                <div
                  key={decision.operationId}
                  className="bg-slate-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white">
                        Operation {decision.operationId}
                      </p>
                      <p className="text-sm text-gray-400">
                        {decision.decision ? 'Approved' : 'Rejected'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="w-80 bg-slate-900 p-4 border-l border-slate-700">
        <h2 className="text-xl font-light text-white mb-4">AI Assistant</h2>
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Current Analysis</h3>
            <p className="text-gray-400 text-sm">
              Analyzing market patterns and identifying opportunities...
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Suggested Actions</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Review market energy patterns</li>
              <li>• Analyze property value trends</li>
              <li>• Check for market anomalies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter; 