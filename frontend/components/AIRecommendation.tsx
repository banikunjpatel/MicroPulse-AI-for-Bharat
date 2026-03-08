import React from 'react';

interface AIRecommendationProps {
  recommendation: {
    action: string;
    reason: string;
    confidence: number;
    impact?: string;
  };
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({ recommendation }) => {
  const confidenceColor = recommendation.confidence >= 0.85 
    ? 'text-green-600' 
    : recommendation.confidence >= 0.75 
    ? 'text-yellow-600' 
    : 'text-orange-600';
    
  const confidenceLabel = recommendation.confidence >= 0.85 
    ? 'High' 
    : recommendation.confidence >= 0.75 
    ? 'Medium' 
    : 'Moderate';

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg shadow-md border-2 border-green-300">
      <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-xl">🤖</span>
        AI Recommendation
      </h3>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommended Action</p>
          <p className="text-lg font-bold text-gray-800">{recommendation.action}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reasoning</p>
          <p className="text-sm text-gray-700 leading-relaxed">{recommendation.reason}</p>
        </div>
        
        {recommendation.impact && (
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Impact</p>
            <p className="text-sm text-gray-700">{recommendation.impact}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
          <span className="text-sm font-medium text-gray-700">Confidence Level</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${confidenceColor}`}>
              {(recommendation.confidence * 100).toFixed(0)}%
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${confidenceColor} bg-opacity-10`}>
              {confidenceLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendation;
