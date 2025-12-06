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
async function querySensorData(farmId, sensorId, startTime, endTime) {
  const query = `
    from(bucket: "${INFLUX_CONFIG.bucket}")
      |> range(start: ${startTime}, stop: ${endTime})
      |> filter(fn: (r) => r["farm_id"] == "${farmId}")
      |> filter(fn: (r) => r["sensor_id"] == "${sensorId}")
      |> filter(fn: (r) => r["_measurement"] == "sensor_reading")
  `;

  const results = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const data = tableMeta.toObject(row);
        results.push({
          time: data._time,
          value: data._value,
          sensorType: data.sensor_type
        });
      },
      error(error) {
        reject(error);
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
          value: data._value,
          unit: data.unit,
          time: data._time
        });
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(results);
      }
    });
  });
}

module.exports = {
  influxDB,
  writeApi,
  queryApi,
  writeSensorData,
  querySensorData,
  getLatestReadings,
  INFLUX_CONFIG
};