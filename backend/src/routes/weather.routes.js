const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public route - get weather by coordinates
router.get('/', weatherController.getWeatherByCoords);

// Public route - get weather by city name
router.get('/city/:cityName', weatherController.getWeatherByCity);

// Protected route - get weather for a specific farm
router.get('/farm/:farmId', authenticate, weatherController.getFarmWeather);

module.exports = router;