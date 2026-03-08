import React from 'react';

interface ContextSignalsProps {
  signals: {
    temperature: number;
    weekend: boolean;
    event: string;
    humidity?: number;
    is_holiday?: boolean;
  };
}

const ContextSignals: React.FC<ContextSignalsProps> = ({ signals }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-xl">🌡️</span>
        Context Signals Driving Demand
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
          <span className="text-sm font-medium text-gray-700">Temperature</span>
          <span className="text-lg font-bold text-orange-600">{signals.temperature}°C</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-gray-700">Weekend</span>
          <span className="text-lg font-bold text-blue-600">
            {signals.weekend ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <span className="text-sm font-medium text-gray-700">Event</span>
          <span className="text-lg font-bold text-purple-600">
            {signals.event || 'None'}
          </span>
        </div>
        
        {signals.humidity && (
          <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
            <span className="text-sm font-medium text-gray-700">Humidity</span>
            <span className="text-lg font-bold text-teal-600">{signals.humidity}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextSignals;
