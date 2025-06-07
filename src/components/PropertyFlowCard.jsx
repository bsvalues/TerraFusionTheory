import React from 'react';
import { motion } from 'framer-motion';

const PropertyFlowCard = ({ property, marketEnergy, onSelect }) => {
  const { value, trend, signals } = property;
  const { frequency, amplitude } = marketEnergy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-light text-gray-900">
              {property.address}
            </h3>
            <p className="text-sm text-gray-500">
              {property.neighborhood}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light text-gray-900">
              ${value.toLocaleString()}
            </p>
            <p className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${amplitude * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {signals.map((signal, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-900">
                  {signal.name}
                </p>
                <p className="text-xs text-gray-500">
                  {signal.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onSelect(property)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyFlowCard; 