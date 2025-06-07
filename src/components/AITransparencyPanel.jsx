import React from 'react';
import { motion } from 'framer-motion';

const AITransparencyPanel = ({ aiOperation }) => {
  const {
    type,
    description,
    reasoning,
    dataPoints,
    confidence,
    impact,
    alternatives
  } = aiOperation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-xl p-6"
    >
      <div className="space-y-6">
        {/* Operation Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-light text-white">{type}</h3>
            <p className="text-gray-400 mt-1">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">Confidence:</div>
            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <div className="text-sm text-gray-400">{confidence}%</div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">AI Reasoning</h4>
          <p className="text-gray-300 text-sm">{reasoning}</p>
        </div>

        {/* Data Points Used */}
        <div>
          <h4 className="text-white font-medium mb-2">Data Points Analyzed</h4>
          <div className="grid grid-cols-2 gap-4">
            {dataPoints.map((point, index) => (
              <div
                key={index}
                className="bg-slate-700 rounded-lg p-3"
              >
                <div className="text-sm text-gray-400">{point.label}</div>
                <div className="text-white font-medium">{point.value}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Source: {point.source}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Potential Impact */}
        <div>
          <h4 className="text-white font-medium mb-2">Potential Impact</h4>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="space-y-3">
              {impact.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.type === 'positive' ? 'bg-green-500' :
                    item.type === 'negative' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <div className="ml-3">
                    <div className="text-white">{item.description}</div>
                    <div className="text-sm text-gray-400">
                      Confidence: {item.confidence}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alternative Approaches */}
        <div>
          <h4 className="text-white font-medium mb-2">Alternative Approaches</h4>
          <div className="space-y-3">
            {alternatives.map((alt, index) => (
              <div
                key={index}
                className="bg-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{alt.title}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {alt.description}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Confidence: {alt.confidence}%
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Why not chosen: {alt.reasonNotChosen}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AITransparencyPanel; 