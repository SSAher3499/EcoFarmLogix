import React from 'react';

const WeatherForecast = ({ forecast }) => {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">7-Day Forecast</h3>
      
      <div className="space-y-3">
        {forecast.slice(0, 7).map((day, index) => (
          <div 
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3 w-28">
              <span className="text-2xl">{day.icon}</span>
              <span className="text-sm font-medium text-gray-700">
                {formatDate(day.date)}
              </span>
            </div>
            
            <div className="flex-1 px-4">
              <div className="flex items-center gap-2">
                {day.precipitationProbability > 30 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    💧 {day.precipitationProbability}%
                  </span>
                )}
                <span className="text-xs text-gray-500 truncate">
                  {day.description}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-800">
                {Math.round(day.tempMax)}°
              </span>
              <span className="text-sm text-gray-400 mx-1">/</span>
              <span className="text-sm text-gray-500">
                {Math.round(day.tempMin)}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherForecast;