import React, { useState, useEffect } from 'react';
import weatherService from '../../services/weather.service';
import WeatherCard from './WeatherCard';
import WeatherForecast from './WeatherForecast';
import WeatherRecommendations from './WeatherRecommendations';

const WeatherWidget = ({ farmId, city, showForecast = true, showRecommendations = true }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather();
  }, [farmId, city]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (farmId) {
        response = await weatherService.getFarmWeather(farmId);
        setWeather(response.data.weather);
      } else if (city) {
        response = await weatherService.getWeatherByCity(city);
        setWeather(response.data);
      } else {
        // Default to Pune if no location provided
        response = await weatherService.getWeatherByCity('Pune');
        setWeather(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <WeatherCard weather={weather} loading={loading} error={error} />
      
      {/* Forecast */}
      {showForecast && !loading && !error && weather && (
        <WeatherForecast forecast={weather.forecast} />
      )}
      
      {/* Recommendations */}
      {showRecommendations && !loading && !error && weather && (
        <WeatherRecommendations recommendations={weather.recommendations} />
      )}
    </div>
  );
};

export default WeatherWidget;