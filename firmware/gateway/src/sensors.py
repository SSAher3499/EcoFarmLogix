"""
Sensor Manager - Handles all sensor readings
"""
import time
import json
import logging
import random
import platform

logger = logging.getLogger(__name__)

# Check if running on Raspberry Pi
IS_RASPBERRY_PI = platform.system() == 'Linux' and platform.machine().startswith('arm')

if IS_RASPBERRY_PI:
    import board
    import adafruit_dht
    import RPi.GPIO as GPIO
else:
    # Mock for development on Windows
    logger.info("Running in simulation mode (not on Raspberry Pi)")


class SensorManager:
    """Manages all sensor readings"""
    
    def __init__(self, config):
        self.config = config
        self.sensors = {}
        self.reading_interval = config.get('reading_interval', 30)
        self._setup_sensors()
    
    def _setup_sensors(self):
        """Initialize sensor connections"""
        sensors_config = self.config.get('sensors_config', [])
        
        for sensor_cfg in sensors_config:
            if not sensor_cfg.get('enabled', True):
                continue
                
            sensor_type = sensor_cfg['type']
            sensor_name = sensor_cfg['name']
            pin = sensor_cfg.get('pin')
            
            try:
                if IS_RASPBERRY_PI:
                    if sensor_type in ['TEMPERATURE', 'HUMIDITY']:
                        # DHT22 sensor
                        dht_pin = getattr(board, f'D{pin}')
                        self.sensors[sensor_name] = {
                            'type': sensor_type,
                            'device': adafruit_dht.DHT22(dht_pin),
                            'pin': pin,
                            'unit': sensor_cfg.get('unit', '')
                        }
                    elif sensor_type == 'SOIL_MOISTURE':
                        # Analog sensor via ADC (MCP3008)
                        self.sensors[sensor_name] = {
                            'type': sensor_type,
                            'channel': pin,
                            'unit': sensor_cfg.get('unit', '%')
                        }
                else:
                    # Simulation mode
                    self.sensors[sensor_name] = {
                        'type': sensor_type,
                        'pin': pin,
                        'unit': sensor_cfg.get('unit', ''),
                        'simulated': True
                    }
                
                logger.info(f"Initialized sensor: {sensor_name} ({sensor_type})")
                
            except Exception as e:
                logger.error(f"Failed to initialize sensor {sensor_name}: {e}")
    
    def read_all(self):
        """Read all sensors and return data"""
        readings = {}
        
        for name, sensor in self.sensors.items():
            try:
                value = self._read_sensor(sensor)
                if value is not None:
                    readings[sensor['type'].lower()] = value
                    logger.debug(f"{name}: {value}{sensor.get('unit', '')}")
            except Exception as e:
                logger.error(f"Error reading {name}: {e}")
        
        return readings
    
    def _read_sensor(self, sensor):
        """Read a single sensor"""
        sensor_type = sensor['type']
        
        if sensor.get('simulated'):
            return self._simulate_reading(sensor_type)
        
        if IS_RASPBERRY_PI:
            if sensor_type == 'TEMPERATURE':
                return round(sensor['device'].temperature, 1)
            elif sensor_type == 'HUMIDITY':
                return round(sensor['device'].humidity, 1)
            elif sensor_type == 'SOIL_MOISTURE':
                return self._read_soil_moisture(sensor['channel'])
        
        return None
    
    def _read_soil_moisture(self, channel):
        """Read soil moisture from ADC"""
        # Implement MCP3008 ADC reading here
        # For now, return simulated value
        return self._simulate_reading('SOIL_MOISTURE')
    
    def _simulate_reading(self, sensor_type):
        """Generate simulated sensor readings for testing"""
        if sensor_type == 'TEMPERATURE':
            return round(25 + random.uniform(-5, 10), 1)
        elif sensor_type == 'HUMIDITY':
            return round(60 + random.uniform(-15, 20), 1)
        elif sensor_type == 'SOIL_MOISTURE':
            return round(50 + random.uniform(-20, 30), 1)
        elif sensor_type == 'LIGHT':
            return round(30000 + random.uniform(-10000, 20000), 0)
        elif sensor_type == 'CO2':
            return round(400 + random.uniform(-50, 200), 0)
        return 0
    
    def cleanup(self):
        """Cleanup sensor resources"""
        for name, sensor in self.sensors.items():
            try:
                if IS_RASPBERRY_PI and hasattr(sensor.get('device'), 'exit'):
                    sensor['device'].exit()
            except:
                pass
        logger.info("Sensors cleaned up")