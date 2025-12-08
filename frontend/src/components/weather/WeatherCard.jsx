import React from 'react';

const WeatherCard = ({ weather, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white animate-pulse">
        <div className="h-6 bg-blue-400 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-blue-400 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-blue-400 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white">
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
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold truncate">
            {location?.city || 'Current Location'}
          </h3>
          <p className="text-xs opacity-75 truncate">
            {location?.state && `${location.state}, `}
            {location?.country || ''}
          </p>
        </div>
        <span className="text-3xl ml-2 flex-shrink-0">{current.icon}</span>
      </div>

      {/* Temperature */}
      <div className="mb-3">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">{Math.round(current.temperature)}</span>
          <span className="text-xl ml-1">°C</span>
        </div>
        <p className="text-xs opacity-75">
          Feels like {Math.round(current.feelsLike)}°C • {current.description}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs opacity-75">Humidity</p>
          <p className="text-sm font-semibold">💧 {current.humidity}%</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs opacity-75">Wind</p>
          <p className="text-sm font-semibold">💨 {current.windSpeed}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs opacity-75">UV</p>
          <p className="text-sm font-semibold">☀️ {current.uvIndex || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;