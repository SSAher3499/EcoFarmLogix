import api from './api';

const weatherService = {
  // Get weather by coordinates
  getWeatherByCoords: async (lat, lon) => {
    const response = await api.get(`/weather?lat=${lat}&lon=${lon}`);
    return response.data;
  },

  // Get weather by city name
  getWeatherByCity: async (cityName) => {
    const response = await api.get(`/weather/city/${encodeURIComponent(cityName)}`);
    return response.data;
  },

  // Get weather for a specific farm
  getFarmWeather: async (farmId) => {
    const response = await api.get(`/weather/farm/${farmId}`);
    return response.data;
  }
};

export default weatherService;