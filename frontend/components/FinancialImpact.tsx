import React from 'react';

interface FinancialImpactProps {
  workingCapitalSaved: number;
  workingCapitalSavedPercent: number;
  revenueRecoveryPotential: number;
}

const FinancialImpact: React.FC<FinancialImpactProps> = ({
  workingCapitalSaved,
  workingCapitalSavedPercent,
  revenueRecoveryPotential
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Financial Impact</h3>
      
      {/* Capital Efficiency Summary */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-purple-700">Capital Efficiency Improved by {workingCapitalSavedPercent.toFixed(1)}%</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Working Capital Saved</p>
          <p className="text-2xl font-bold text-green-700">₹{workingCapitalSaved.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{workingCapitalSavedPercent.toFixed(2)}% reduction</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Revenue Recovery Potential</p>
          <p className="text-2xl font-bold text-blue-700">₹{revenueRecoveryPotential.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Estimated 3x multiplier</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Capital Efficiency</p>
          <p className="text-2xl font-bold text-purple-700">{workingCapitalSavedPercent.toFixed(2)}%</p>
          <p className="text-xs text-gray-500 mt-1">Improvement in efficiency</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialImpact;
