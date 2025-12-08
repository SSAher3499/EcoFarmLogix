const weatherService = require('../services/weather.service');
const { prisma } = require('../config/database');

class WeatherController {
  
  /**
   * GET /api/v1/weather?lat=XX&lon=YY
   * Get weather by coordinates
   */
  async getWeatherByCoords(req, res, next) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({
          status: 'error',
          message: 'Latitude (lat) and longitude (lon) are required'
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid latitude or longitude'
        });
      }

      const weather = await weatherService.getWeather(latitude, longitude);

      res.status(200).json({
        status: 'success',
        data: weather
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/weather/city/:cityName
   * Get weather by city name
   */
  async getWeatherByCity(req, res, next) {
    try {
      const { cityName } = req.params;

      if (!cityName) {
        return res.status(400).json({
          status: 'error',
          message: 'City name is required'
        });
      }

      const weather = await weatherService.getWeatherByCity(cityName);

      res.status(200).json({
        status: 'success',
        data: weather
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/weather
   * Get weather for a specific farm
   */
  async getFarmWeather(req, res, next) {
    try {
      const { farmId } = req.params;

      // Get farm details
      const farm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          userId: req.user.userId,
          isActive: true
        }
      });

      if (!farm) {
        return res.status(404).json({
          status: 'error',
          message: 'Farm not found'
        });
      }

      // Check if farm has coordinates
      if (!farm.locationLat || !farm.locationLng) {
        // Try to get weather by address/city if available
        if (farm.locationAddress) {
          // Extract city from address (simple approach)
          const city = farm.locationAddress.split(',')[0].trim();
          const weather = await weatherService.getWeatherByCity(city);
          return res.status(200).json({
            status: 'success',
            data: {
              farm: {
                id: farm.id,
                name: farm.name,
                location: farm.locationAddress
              },
              weather
            }
          });
        }

        return res.status(400).json({
          status: 'error',
          message: 'Farm location not set. Please update farm with coordinates or address.'
        });
      }

      const weather = await weatherService.getWeather(farm.locationLat, farm.locationLng);

      res.status(200).json({
        status: 'success',
        data: {
          farm: {
            id: farm.id,
            name: farm.name,
            location: farm.locationAddress,
            coordinates: {
              lat: farm.locationLat,
              lng: farm.locationLng
            }
          },
          weather
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WeatherController();