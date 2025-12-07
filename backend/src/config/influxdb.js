const { InfluxDB, Point } = require('@influxdata/influxdb-client');

// InfluxDB Configuration
const INFLUX_CONFIG = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || 'my-super-secret-token',
  org: process.env.INFLUXDB_ORG || 'ecofarmlogix',
  bucket: process.env.INFLUXDB_BUCKET || 'sensor_data'
};

// Create InfluxDB client
const influxDB = new InfluxDB({
  url: INFLUX_CONFIG.url,
  token: INFLUX_CONFIG.token
});

// Get write API
const writeApi = influxDB.getWriteApi(INFLUX_CONFIG.org, INFLUX_CONFIG.bucket);
writeApi.useDefaultTags({ application: 'ecofarmlogix' });

// Get query API
const queryApi = influxDB.getQueryApi(INFLUX_CONFIG.org);

/**
 * Write sensor reading to InfluxDB
 */
async function writeSensorData(farmId, deviceMac, sensorType, sensorId, value, unit) {
  try {
    const point = new Point('sensor_reading')
      .tag('farm_id', farmId)
      .tag('device_mac', deviceMac)
      .tag('sensor_type', sensorType)
      .tag('sensor_id', sensorId)
      .tag('unit', unit)
      .floatField('value', parseFloat(value))
      .timestamp(new Date());

    writeApi.writePoint(point);
    await writeApi.flush();
    
    return true;
  } catch (error) {
    console.error('InfluxDB write error:', error.message);
    return false;
  }
}

/**
 * Query sensor data for a time range
 */
async function querySensorData(sensorId, timeRange = '24h') {
  const query = `
    from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: -${timeRange})
      |> filter(fn: (r) => r["sensor_id"] == "${sensorId}")
      |> filter(fn: (r) => r["_measurement"] == "sensor_reading")
      |> filter(fn: (r) => r["_field"] == "value")
      |> aggregateWindow(every: ${getAggregateWindow(timeRange)}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const results = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const data = tableMeta.toObject(row);
        results.push({
          time: data._time,
          value: Math.round(data._value * 100) / 100,
          sensorType: data.sensor_type
        });
      },
      error(error) {
        console.error('InfluxDB query error:', error);
        resolve([]); // Return empty array on error
      },
      complete() {
        resolve(results);
      }
    });
  });
}

/**
 * Query multiple sensors for a farm
 */
async function queryFarmSensors(farmId, timeRange = '24h') {
  const query = `
    from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: -${timeRange})
      |> filter(fn: (r) => r["farm_id"] == "${farmId}")
      |> filter(fn: (r) => r["_measurement"] == "sensor_reading")
      |> filter(fn: (r) => r["_field"] == "value")
      |> aggregateWindow(every: ${getAggregateWindow(timeRange)}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const results = {};
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const data = tableMeta.toObject(row);
        const sensorId = data.sensor_id;
        
        if (!results[sensorId]) {
          results[sensorId] = {
            sensorId,
            sensorType: data.sensor_type,
            unit: data.unit,
            data: []
          };
        }
        
        results[sensorId].data.push({
          time: data._time,
          value: Math.round(data._value * 100) / 100
        });
      },
      error(error) {
        console.error('InfluxDB query error:', error);
        resolve({});
      },
      complete() {
        resolve(results);
      }
    });
  });
}

/**
 * Get latest readings for a farm
 */
async function getLatestReadings(farmId) {
  const query = `
    from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["farm_id"] == "${farmId}")
      |> filter(fn: (r) => r["_measurement"] == "sensor_reading")
      |> filter(fn: (r) => r["_field"] == "value")
      |> last()
  `;

  const results = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const data = tableMeta.toObject(row);
        results.push({
          sensorId: data.sensor_id,
          sensorType: data.sensor_type,
          value: Math.round(data._value * 100) / 100,
          unit: data.unit,
          time: data._time
        });
      },
      error(error) {
        console.error('InfluxDB query error:', error);
        resolve([]);
      },
      complete() {
        resolve(results);
      }
    });
  });
}

/**
 * Get sensor statistics (min, max, avg)
 */
async function getSensorStats(sensorId, timeRange = '24h') {
  const queries = {
    min: `from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: -${timeRange})
      |> filter(fn: (r) => r["sensor_id"] == "${sensorId}")
      |> filter(fn: (r) => r["_field"] == "value")
      |> min()`,
    max: `from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: -${timeRange})
      |> filter(fn: (r) => r["sensor_id"] == "${sensorId}")
      |> filter(fn: (r) => r["_field"] == "value")
      |> max()`,
    mean: `from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: -${timeRange})
      |> filter(fn: (r) => r["sensor_id"] == "${sensorId}")
      |> filter(fn: (r) => r["_field"] == "value")
      |> mean()`
  };

  const stats = { min: null, max: null, avg: null };

  for (const [key, query] of Object.entries(queries)) {
    await new Promise((resolve) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          stats[key === 'mean' ? 'avg' : key] = Math.round(data._value * 100) / 100;
        },
        error() { resolve(); },
        complete() { resolve(); }
      });
    });
  }

  return stats;
}

/**
 * Get aggregate window based on time range
 */
function getAggregateWindow(timeRange) {
  const windows = {
    '1h': '1m',
    '6h': '5m',
    '24h': '15m',
    '7d': '1h',
    '30d': '6h'
  };
  return windows[timeRange] || '15m';
}

module.exports = {
  influxDB,
  writeApi,
  queryApi,
  writeSensorData,
  querySensorData,
  queryFarmSensors,
  getLatestReadings,
  getSensorStats,
  INFLUX_CONFIG
};