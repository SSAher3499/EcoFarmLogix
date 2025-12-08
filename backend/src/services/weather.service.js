const axios = require('axios');

// Open-Meteo API (FREE - No API key needed!)
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

class WeatherService {
  
  /**
   * Get current weather and forecast for a location
   * @param {number} latitude 
   * @param {number} longitude 
   */
  async getWeather(latitude, longitude) {
    try {
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude,
          longitude,
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation',
            'rain',
            'weather_code',
            'wind_speed_10m',
            'wind_direction_10m',
            'uv_index',
            'is_day'
          ].join(','),
          hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'precipitation_probability',
            'rain',
            'soil_temperature_6cm',
            'soil_moisture_3_to_9cm'
          ].join(','),
          daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'apparent_temperature_max',
            'apparent_temperature_min',
            'precipitation_sum',
            'rain_sum',
            'precipitation_probability_max',
            'wind_speed_10m_max',
            'uv_index_max',
            'sunrise',
            'sunset'
          ].join(','),
          timezone: 'Asia/Kolkata',
          forecast_days: 7
        }
      });

      return this.formatWeatherData(response.data);
    } catch (error) {
      console.error('Weather API error:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Format raw API response into user-friendly format
   */
  formatWeatherData(data) {
    const weatherCodes = {
      0: { description: 'Clear sky', icon: '☀️' },
      1: { description: 'Mainly clear', icon: '🌤️' },
      2: { description: 'Partly cloudy', icon: '⛅' },
      3: { description: 'Overcast', icon: '☁️' },
      45: { description: 'Foggy', icon: '🌫️' },
      48: { description: 'Depositing rime fog', icon: '🌫️' },
      51: { description: 'Light drizzle', icon: '🌦️' },
      53: { description: 'Moderate drizzle', icon: '🌦️' },
      55: { description: 'Dense drizzle', icon: '🌧️' },
      61: { description: 'Slight rain', icon: '🌧️' },
      63: { description: 'Moderate rain', icon: '🌧️' },
      65: { description: 'Heavy rain', icon: '🌧️' },
      71: { description: 'Slight snow', icon: '🌨️' },
      73: { description: 'Moderate snow', icon: '🌨️' },
      75: { description: 'Heavy snow', icon: '❄️' },
      80: { description: 'Slight rain showers', icon: '🌦️' },
      81: { description: 'Moderate rain showers', icon: '🌧️' },
      82: { description: 'Violent rain showers', icon: '⛈️' },
      95: { description: 'Thunderstorm', icon: '⛈️' },
      96: { description: 'Thunderstorm with hail', icon: '⛈️' },
      99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' }
    };

    const getWeatherInfo = (code) => weatherCodes[code] || { description: 'Unknown', icon: '❓' };

    // Current weather
    const current = {
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      rain: data.current.rain,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      uvIndex: data.current.uv_index,
      isDay: data.current.is_day === 1,
      weatherCode: data.current.weather_code,
      ...getWeatherInfo(data.current.weather_code),
      time: data.current.time,
      units: {
        temperature: data.current_units.temperature_2m,
        humidity: data.current_units.relative_humidity_2m,
        precipitation: data.current_units.precipitation,
        windSpeed: data.current_units.wind_speed_10m
      }
    };

    // 7-day forecast
    const forecast = data.daily.time.map((date, index) => ({
      date,
      tempMax: data.daily.temperature_2m_max[index],
      tempMin: data.daily.temperature_2m_min[index],
      feelsLikeMax: data.daily.apparent_temperature_max[index],
      feelsLikeMin: data.daily.apparent_temperature_min[index],
      precipitationSum: data.daily.precipitation_sum[index],
      rainSum: data.daily.rain_sum[index],
      precipitationProbability: data.daily.precipitation_probability_max[index],
      windSpeedMax: data.daily.wind_speed_10m_max[index],
      uvIndexMax: data.daily.uv_index_max[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
      weatherCode: data.daily.weather_code[index],
      ...getWeatherInfo(data.daily.weather_code[index])
    }));

    // Hourly data (next 24 hours for soil data)
    const hourlyLength = Math.min(24, data.hourly.time.length);
    const hourly = data.hourly.time.slice(0, hourlyLength).map((time, index) => ({
      time,
      temperature: data.hourly.temperature_2m[index],
      humidity: data.hourly.relative_humidity_2m[index],
      precipitationProbability: data.hourly.precipitation_probability[index],
      rain: data.hourly.rain[index],
      soilTemperature: data.hourly.soil_temperature_6cm[index],
      soilMoisture: data.hourly.soil_moisture_3_to_9cm[index]
    }));

    // Generate farming recommendations
    const recommendations = this.generateRecommendations(current, forecast, hourly);

    return {
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone
      },
      current,
      forecast,
      hourly,
      recommendations
    };
  }

  /**
   * Generate smart farming recommendations based on weather
   */
  generateRecommendations(current, forecast, hourly) {
    const recommendations = [];

    // Check for rain in next 3 days
    const rainNextDays = forecast.slice(0, 3).filter(day => day.precipitationProbability > 50);
    if (rainNextDays.length > 0) {
      const rainDay = rainNextDays[0];
      recommendations.push({
        type: 'irrigation',
        priority: 'high',
        icon: '💧',
        title: 'Skip Irrigation',
        message: `Rain expected on ${new Date(rainDay.date).toLocaleDateString('en-IN', { weekday: 'long' })} (${rainDay.precipitationProbability}% chance). Consider skipping irrigation.`
      });
    }

    // High temperature warning
    if (current.temperature > 35) {
      recommendations.push({
        type: 'heat',
        priority: 'high',
        icon: '🌡️',
        title: 'High Temperature Alert',
        message: `Temperature is ${current.temperature}°C. Ensure adequate ventilation and consider activating foggers.`
      });
    }

    // Low humidity warning
    if (current.humidity < 40) {
      recommendations.push({
        type: 'humidity',
        priority: 'medium',
        icon: '💨',
        title: 'Low Humidity',
        message: `Humidity is low at ${current.humidity}%. Consider activating foggers or misting system.`
      });
    }

    // High humidity warning
    if (current.humidity > 85) {
      recommendations.push({
        type: 'humidity',
        priority: 'medium',
        icon: '💧',
        title: 'High Humidity',
        message: `Humidity is high at ${current.humidity}%. Ensure good ventilation to prevent fungal diseases.`
      });
    }

    // UV Index warning
    if (current.uvIndex > 8) {
      recommendations.push({
        type: 'uv',
        priority: 'medium',
        icon: '☀️',
        title: 'High UV Index',
        message: `UV Index is ${current.uvIndex}. Consider using shade nets for sensitive crops.`
      });
    }

    // Wind warning
    if (current.windSpeed > 30) {
      recommendations.push({
        type: 'wind',
        priority: 'medium',
        icon: '💨',
        title: 'Strong Winds',
        message: `Wind speed is ${current.windSpeed} km/h. Secure shade nets and check for structural damage.`
      });
    }

    // Frost warning (for winter)
    const frostRisk = forecast.slice(0, 3).filter(day => day.tempMin < 5);
    if (frostRisk.length > 0) {
      recommendations.push({
        type: 'frost',
        priority: 'high',
        icon: '❄️',
        title: 'Frost Warning',
        message: `Low temperatures expected. Protect sensitive crops from frost damage.`
      });
    }

    // Good weather - optimal farming
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'good',
        priority: 'low',
        icon: '✅',
        title: 'Good Conditions',
        message: 'Weather conditions are optimal for farming activities.'
      });
    }

    return recommendations;
  }

  /**
   * Get weather for a specific city (using geocoding)
   */
  async getWeatherByCity(city) {
    try {
      // First, geocode the city name
      const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: {
          name: city,
          count: 1,
          language: 'en',
          format: 'json'
        }
      });

      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        throw new Error(`City "${city}" not found`);
      }

      const location = geoResponse.data.results[0];
      const weather = await this.getWeather(location.latitude, location.longitude);

      return {
        ...weather,
        location: {
          ...weather.location,
          city: location.name,
          state: location.admin1,
          country: location.country
        }
      };
    } catch (error) {
      console.error('Weather by city error:', error.message);
      throw error;
    }
  }
}

module.exports = new WeatherService();