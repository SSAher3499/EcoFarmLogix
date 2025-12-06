#!/usr/bin/env python3
"""
EcoFarmLogix Gateway - Main Application
Runs on Raspberry Pi to collect sensor data and control actuators
"""
import os
import sys
import json
import time
import signal
import logging
import argparse
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sensors import SensorManager
from actuators import ActuatorManager
from mqtt_client import MQTTClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/gateway.log')
    ]
)
logger = logging.getLogger('Gateway')


class Gateway:
    """Main Gateway Application"""
    
    def __init__(self, config_path='config/config.json'):
        self.running = False
        self.config = self._load_config(config_path)
        self.mac_address = self._get_mac_address()
        
        logger.info(f"🌱 EcoFarmLogix Gateway")
        logger.info(f"📟 MAC Address: {self.mac_address}")
        
        # Initialize components
        self.sensor_manager = SensorManager(self.config.get('sensors', {}))
        self.actuator_manager = ActuatorManager(self.config)
        self.mqtt_client = MQTTClient(
            self.mac_address,
            self.config.get('mqtt', {}),
            on_command_callback=self._handle_actuator_command
        )
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _load_config(self, config_path):
        """Load configuration from file"""
        try:
            # Get absolute path
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            full_path = os.path.join(base_dir, config_path)
            
            with open(full_path, 'r') as f:
                config = json.load(f)
            logger.info(f"✅ Config loaded from {config_path}")
            return config
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}
    
    def _get_mac_address(self):
        """Get device MAC address"""
        try:
            # Try to read from network interface
            import uuid
            mac = ':'.join(['{:02X}'.format((uuid.getnode() >> elements) & 0xff)
                          for elements in range(0, 8*6, 8)][::-1])
            return mac
        except:
            # Fallback
            return "AA:BB:CC:DD:EE:FF"
    
    def _handle_actuator_command(self, actuator_id, command):
        """Handle incoming actuator command from cloud"""
        logger.info(f"⚡ Executing command: {actuator_id} -> {command}")
        success = self.actuator_manager.control(actuator_id, command)
        
        if success:
            logger.info(f"✅ Command executed successfully")
        else:
            logger.error(f"❌ Command execution failed")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"🛑 Received signal {signum}, shutting down...")
        self.stop()
    
    def start(self):
        """Start the gateway"""
        logger.info("🚀 Starting gateway...")
        self.running = True
        
        # Connect to MQTT broker
        if not self.mqtt_client.connect():
            logger.error("❌ Failed to connect to MQTT broker")
            # Continue anyway - will retry
        
        # Get reading interval from config
        interval = self.config.get('sensors', {}).get('reading_interval', 30)
        logger.info(f"📊 Sensor reading interval: {interval} seconds")
        
        # Main loop
        last_reading_time = 0
        
        while self.running:
            try:
                current_time = time.time()
                
                # Read and publish sensor data at interval
                if current_time - last_reading_time >= interval:
                    self._read_and_publish_sensors()
                    last_reading_time = current_time
                
                # Small sleep to prevent CPU hogging
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(5)
        
        self._cleanup()
    
    def _read_and_publish_sensors(self):
        """Read sensors and publish to cloud"""
        try:
            # Read all sensors
            readings = self.sensor_manager.read_all()
            
            if readings:
                # Add timestamp
                readings['timestamp'] = datetime.utcnow().isoformat() + 'Z'
                
                # Publish to MQTT
                if self.mqtt_client.connected:
                    self.mqtt_client.publish_sensor_data(readings)
                    logger.info(f"📤 Published: {readings}")
                else:
                    logger.warning("📴 MQTT not connected, data not sent")
                    # TODO: Buffer data locally for later
                    
        except Exception as e:
            logger.error(f"Error reading/publishing sensors: {e}")
    
    def stop(self):
        """Stop the gateway"""
        self.running = False
    
    def _cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Cleaning up...")
        
        try:
            self.mqtt_client.disconnect()
            self.actuator_manager.cleanup()
            self.sensor_manager.cleanup()
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
        
        logger.info("👋 Gateway stopped")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='EcoFarmLogix Gateway')
    parser.add_argument(
        '-c', '--config',
        default='config/config.json',
        help='Path to config file'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Ensure logs directory exists
    os.makedirs('logs', exist_ok=True)
    
    # Create and start gateway
    gateway = Gateway(config_path=args.config)
    gateway.start()


if __name__ == '__main__':
    main()