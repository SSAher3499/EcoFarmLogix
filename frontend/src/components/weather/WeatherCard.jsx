import React from 'react';

const WeatherCard = ({ weather, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white animate-pulse">
        <div className="h-6 bg-blue-400 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-blue-400 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-blue-400 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
        <p className="text-sm">⚠️ Unable to load weather</p>
        <p className="text-xs opacity-75 mt-1">{error}</p>
      </div>
    );
  }

  if (!weather || !weather.current) {
    return null;
  }

  const { current, location } = weather;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {location?.city || 'Current Location'}
          </h3>
          <p className="text-sm opacity-75">
            {location?.state && `${location.state}, `}
            {location?.country || ''}
          </p>
        </div>
        <span className="text-4xl">{current.icon}</span>
      </div>

      {/* Temperature */}
      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold">{Math.round(current.temperature)}</span>
          <span className="text-2xl ml-1">°C</span>
        </div>
        <p className="text-sm opacity-75">
          Feels like {Math.round(current.feelsLike)}°C • {current.description}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs opacity-75">Humidity</p>
          <p className="text-lg font-semibold">💧 {current.humidity}%</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs opacity-75">Wind</p>
          <p className="text-lg font-semibold">💨 {current.windSpeed} km/h</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs opacity-75">UV Index</p>
          <p className="text-lg font-semibold">☀️ {current.uvIndex || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;