const { querySensorData, queryFarmSensors, getSensorStats } = require('../config/influxdb');
const { prisma } = require('../config/database');

class HistoryController {
  
  /**
   * GET /api/v1/sensors/:sensorId/history
   * Get historical data for a single sensor
   */
  async getSensorHistory(req, res, next) {
    try {
      const { sensorId } = req.params;
      const { range = '24h' } = req.query;

      // Validate time range
      const validRanges = ['1h', '6h', '24h', '7d', '30d'];
      if (!validRanges.includes(range)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid range. Use: ${validRanges.join(', ')}`
        });
      }

      // Verify sensor exists and user has access
      const sensor = await prisma.sensor.findUnique({
        where: { id: sensorId },
        include: {
          device: {
            include: { farm: true }
          }
        }
      });

      if (!sensor) {
        return res.status(404).json({
          status: 'error',
          message: 'Sensor not found'
        });
      }

      if (sensor.device.farm.userId !== req.user.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      // Get historical data from InfluxDB
      const data = await querySensorData(sensorId, range);
      const stats = await getSensorStats(sensorId, range);

      res.status(200).json({
        status: 'success',
        data: {
          sensor: {
            id: sensor.id,
            name: sensor.sensorName,
            type: sensor.sensorType,
            unit: sensor.unit
          },
          timeRange: range,
          stats,
          readings: data,
          count: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/history
   * Get historical data for all sensors in a farm
   */
  async getFarmHistory(req, res, next) {
    try {
      const { farmId } = req.params;
      const { range = '24h' } = req.query;

      // Validate time range
      const validRanges = ['1h', '6h', '24h', '7d', '30d'];
      if (!validRanges.includes(range)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid range. Use: ${validRanges.join(', ')}`
        });
      }

      // Verify farm exists and user has access
      const farm = await prisma.farm.findFirst({
        where: { 
          id: farmId, 
          userId: req.user.userId,
          isActive: true 
        },
        include: {
          devices: {
            include: { sensors: true }
          }
        }
      });

      if (!farm) {
        return res.status(404).json({
          status: 'error',
          message: 'Farm not found'
        });
      }

      // Get historical data from InfluxDB
      const sensorData = await queryFarmSensors(farmId, range);

      // Merge with sensor info from PostgreSQL
      const sensors = farm.devices.flatMap(d => d.sensors);
      const result = [];

      for (const sensor of sensors) {
        const influxData = sensorData[sensor.id];
        
        if (influxData) {
          const stats = await getSensorStats(sensor.id, range);
          result.push({
            sensor: {
              id: sensor.id,
              name: sensor.sensorName,
              type: sensor.sensorType,
              unit: sensor.unit
            },
            stats,
            readings: influxData.data
          });
        } else {
          result.push({
            sensor: {
              id: sensor.id,
              name: sensor.sensorName,
              type: sensor.sensorType,
              unit: sensor.unit
            },
            stats: { min: null, max: null, avg: null },
            readings: []
          });
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          farm: {
            id: farm.id,
            name: farm.name
          },
          timeRange: range,
          sensors: result
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/history/export
   * Export historical data as CSV
   */
  async exportFarmHistory(req, res, next) {
    try {
      const { farmId } = req.params;
      const { range = '24h' } = req.query;

      // Verify farm access
      const farm = await prisma.farm.findFirst({
        where: { 
          id: farmId, 
          userId: req.user.userId,
          isActive: true 
        },
        include: {
          devices: {
            include: { sensors: true }
          }
        }
      });

      if (!farm) {
        return res.status(404).json({
          status: 'error',
          message: 'Farm not found'
        });
      }

      // Get historical data
      const sensorData = await queryFarmSensors(farmId, range);
      const sensors = farm.devices.flatMap(d => d.sensors);

      // Build CSV
      let csv = 'Timestamp,Sensor Name,Sensor Type,Value,Unit\n';

      for (const sensor of sensors) {
        const influxData = sensorData[sensor.id];
        if (influxData && influxData.data) {
          for (const reading of influxData.data) {
            csv += `${reading.time},${sensor.sensorName},${sensor.sensorType},${reading.value},${sensor.unit}\n`;
          }
        }
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${farm.name}-history-${range}.csv`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HistoryController();