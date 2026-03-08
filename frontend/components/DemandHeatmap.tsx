import React from 'react';

interface HeatmapDataPoint {
  pin_code: string;
  forecast_improvement: number;
  demand_level: string;
  color: string;
  baseline_mape: number;
  context_mape: number;
  city: string;
}

interface DemandHeatmapProps {
  sku: string;
  heatmapData: HeatmapDataPoint[];
}

const DemandHeatmap: React.FC<DemandHeatmapProps> = ({ sku, heatmapData }) => {
  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-400';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-400';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-400';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCardBorderColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'border-red-500 hover:border-red-600';
      case 'medium':
        return 'border-orange-500 hover:border-orange-600';
      case 'low':
        return 'border-green-500 hover:border-green-600';
      default:
        return 'border-gray-400';
    }
  };

  const getCardGradient = (level: string) => {
    switch (level) {
      case 'high':
        return 'from-red-50 to-red-100';
      case 'medium':
        return 'from-orange-50 to-orange-100';
      case 'low':
        return 'from-green-50 to-green-100';
      default:
        return 'from-gray-50 to-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'high':
        return 'HIGH DEMAND';
      case 'medium':
        return 'MEDIUM DEMAND';
      case 'low':
        return 'STABLE DEMAND';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Hyperlocal Demand Intelligence (Micro-Market View)
        </h3>
        <p className="text-sm text-gray-600">
          Forecast improvement across micro-markets (PIN codes) for <span className="font-semibold text-blue-600">{sku}</span>
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span>🔴</span>
            <span className="text-gray-600">High (&gt;68%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🟠</span>
            <span className="text-gray-600">Medium (60-68%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🟢</span>
            <span className="text-gray-600">Stable (&lt;60%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {heatmapData.map((point) => (
          <div
            key={point.pin_code}
            className={`bg-gradient-to-br ${getCardGradient(point.demand_level)} p-4 rounded-lg border-3 ${getCardBorderColor(point.demand_level)} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
          >
            {/* Demand Level Label */}
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded-full border-2 ${getLevelBadgeColor(point.demand_level)} font-bold uppercase tracking-wide`}>
                {getLevelLabel(point.demand_level)}
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getLevelIcon(point.demand_level)}</span>
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">PIN Code</p>
              <p className="text-lg font-bold text-gray-800">{point.pin_code}</p>
              <p className="text-xs text-gray-600">{point.city}</p>
            </div>

            <div className="space-y-2">
              <div className="bg-white bg-opacity-60 p-2 rounded">
                <p className="text-xs text-gray-500 mb-1">Forecast Improvement</p>
                <p className="text-2xl font-bold text-gray-800">{point.forecast_improvement.toFixed(1)}%</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white bg-opacity-60 p-2 rounded">
                  <p className="text-gray-500">Baseline</p>
                  <p className="font-semibold text-red-600">{point.baseline_mape.toFixed(1)}%</p>
                </div>
                <div className="bg-white bg-opacity-60 p-2 rounded">
                  <p className="text-gray-500">Context</p>
                  <p className="font-semibold text-green-600">{point.context_mape.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {heatmapData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No heatmap data available</p>
          <p className="text-sm">Select a different SKU to view hyperlocal insights</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total Locations: <span className="font-bold text-gray-800">{heatmapData.length}</span>
          </span>
          <span className="text-gray-600">
            Average Improvement: <span className="font-bold text-blue-600">
              {heatmapData.length > 0 
                ? (heatmapData.reduce((sum, p) => sum + p.forecast_improvement, 0) / heatmapData.length).toFixed(1)
                : 0}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemandHeatmap;
