import React from 'react';

interface MarketContextProps {
  context: {
    city: string;
    lead_time_days: number;
    forecast_horizon_days: number;
    service_level_target: number;
    region?: string;
  };
}

const MarketContext: React.FC<MarketContextProps> = ({ context }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-xl">📍</span>
        Market Context
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <span className="text-sm font-medium text-gray-700">Location</span>
          <span className="text-lg font-bold text-indigo-600">
            {context.city}{context.region && `, ${context.region}`}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <span className="text-sm font-medium text-gray-700">Forecast Window</span>
          <span className="text-lg font-bold text-purple-600">
            Next {context.forecast_horizon_days} Days
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <span className="text-sm font-medium text-gray-700">Lead Time</span>
          <span className="text-lg font-bold text-green-600">
            {context.lead_time_days} days
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-gray-700">Service Level Target</span>
          <span className="text-lg font-bold text-blue-600">
            {context.service_level_target}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketContext;
