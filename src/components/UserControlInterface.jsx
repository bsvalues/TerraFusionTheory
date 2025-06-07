import React, { useState } from 'react';
import { motion } from 'framer-motion';

const UserControlInterface = ({ onCommand, onOverride, onFeedback }) => {
  const [command, setCommand] = useState('');
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      onCommand(command);
      setCommand('');
    }
  };

  const handleOverride = (operationId, overrideType) => {
    onOverride(operationId, overrideType);
    setSelectedOperation(null);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedback.trim()) {
      onFeedback(feedback);
      setFeedback('');
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="space-y-6">
        {/* Direct Command Interface */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">Direct Command</h3>
          <form onSubmit={handleCommandSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter your command..."
                className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Execute
              </button>
            </div>
            <div className="text-sm text-gray-400">
              Example commands: "Analyze market trends", "Generate property report", "Optimize portfolio"
            </div>
          </form>
        </div>

        {/* Operation Override */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">Operation Override</h3>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <select
                value={selectedOperation || ''}
                onChange={(e) => setSelectedOperation(e.target.value)}
                className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select operation to override</option>
                <option value="analysis">Market Analysis</option>
                <option value="optimization">Portfolio Optimization</option>
                <option value="prediction">Value Prediction</option>
              </select>
              <button
                onClick={() => handleOverride(selectedOperation, 'priority')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Set Priority
              </button>
              <button
                onClick={() => handleOverride(selectedOperation, 'parameters')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Adjust Parameters
              </button>
            </div>
          </div>
        </div>

        {/* AI Feedback */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">AI Feedback</h3>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback on AI performance..."
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-light text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onCommand('pause_ai')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Pause AI Operations
            </button>
            <button
              onClick={() => onCommand('resume_ai')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Resume AI Operations
            </button>
            <button
              onClick={() => onCommand('reset_ai')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Reset AI State
            </button>
            <button
              onClick={() => onCommand('export_data')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Analysis Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserControlInterface; 