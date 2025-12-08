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
      return 'Tmrw';
    }
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">7-Day Forecast</h3>
      
      <div className="space-y-2">
        {forecast.slice(0, 7).map((day, index) => (
          <div 
            key={index}
            className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">{day.icon}</span>
              <span className="text-xs font-medium text-gray-700 w-12 flex-shrink-0">
                {formatDate(day.date)}
              </span>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {day.precipitationProbability > 30 && (
                <span className="text-xs text-blue-600">
                  💧{day.precipitationProbability}%
                </span>
              )}
              <span className="text-xs font-semibold text-gray-800 w-14 text-right">
                {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherForecast;