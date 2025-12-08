import React from 'react';

const priorityColors = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  low: 'bg-green-50 border-green-200 text-green-800'
};

const WeatherRecommendations = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🌱 Farming Recommendations
      </h3>
      
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${priorityColors[rec.priority] || priorityColors.low}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{rec.icon}</span>
              <div>
                <h4 className="font-semibold">{rec.title}</h4>
                <p className="text-sm mt-1 opacity-90">{rec.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherRecommendations;