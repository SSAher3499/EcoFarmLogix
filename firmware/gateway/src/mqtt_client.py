"""
MQTT Client - Handles communication with cloud broker
"""
import json
import time
import logging
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)


class MQTTClient:
    """MQTT Client for cloud communication"""
    
    def __init__(self, mac_address, config, on_command_callback=None):
        self.mac_address = mac_address
        self.config = config
        self.on_command_callback = on_command_callback
        self.client = None
        self.connected = False
        
        # Topics
        self.topic_sensors = f"farm/{mac_address}/sensors"
        self.topic_status = f"farm/{mac_address}/status"
        self.topic_commands = f"farm/{mac_address}/actuators/command"
        self.topic_config = f"farm/{mac_address}/config"
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            broker = self.config.get('broker', 'localhost')
            port = self.config.get('port', 1883)
            keepalive = self.config.get('keepalive', 60)
            
            # Create client
            client_id = f"gateway_{self.mac_address}_{int(time.time())}"
            self.client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
            
            # Set callbacks
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            
            # Connect
            logger.info(f"Connecting to MQTT broker {broker}:{port}...")
            self.client.connect(broker, port, keepalive)
            
            # Start network loop in background
            self.client.loop_start()
            
            # Wait for connection
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.5)
                timeout -= 0.5
            
            return self.connected
            
        except Exception as e:
            logger.error(f"MQTT connection failed: {e}")
            return False
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to broker"""
        if rc == 0:
            self.connected = True
            logger.info("✅ Connected to MQTT broker")
            
            # Subscribe to command topics
            self.client.subscribe(self.topic_commands, qos=1)
            self.client.subscribe(self.topic_config, qos=1)
            logger.info(f"📥 Subscribed to: {self.topic_commands}")
            
            # Publish online status
            self.publish_status(online=True)
        else:
            logger.error(f"MQTT connection failed with code: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from broker"""
        self.connected = False
        if rc != 0:
            logger.warning(f"Unexpected MQTT disconnect (code: {rc}). Reconnecting...")
    
    def _on_message(self, client, userdata, msg):
        """Callback when message received"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            logger.info(f"📨 Received on {topic}: {payload}")
            
            if topic == self.topic_commands:
                self._handle_command(payload)
            elif topic == self.topic_config:
                self._handle_config(payload)
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    def _handle_command(self, payload):
        """Handle actuator command from cloud"""
        actuator_id = payload.get('actuatorId')
        command = payload.get('command')
        
        if actuator_id and command:
            logger.info(f"⚡ Command received: {actuator_id} -> {command}")
            
            if self.on_command_callback:
                self.on_command_callback(actuator_id, command)
    
    def _handle_config(self, payload):
        """Handle configuration update from cloud"""
        logger.info(f"📋 Config update received: {payload}")
        # Implement config update logic here
    
    def publish_sensor_data(self, data):
        """Publish sensor readings to cloud"""
        if not self.connected:
            logger.warning("Not connected to MQTT broker")
            return False
        
        try:
            payload = json.dumps(data)
            result = self.client.publish(
                self.topic_sensors,
                payload,
                qos=self.config.get('qos', 1)
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"📤 Sensor data sent: {data}")
                return True
            else:
                logger.error(f"Failed to publish sensor data: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing sensor data: {e}")
            return False
    
    def publish_status(self, online=True, ip_address=None):
        """Publish device status to cloud"""
        if not self.client:
            return False
        
        try:
            status = {
                'online': online,
                'ipAddress': ip_address or self._get_ip_address(),
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }
            
            payload = json.dumps(status)
            self.client.publish(self.topic_status, payload, qos=1)
            logger.info(f"📤 Status published: {'ONLINE' if online else 'OFFLINE'}")
            return True
            
        except Exception as e:
            logger.error(f"Error publishing status: {e}")
            return False
    
    def _get_ip_address(self):
        """Get device IP address"""
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "unknown"
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.publish_status(online=False)
            time.sleep(0.5)
            self.client.loop_stop()
            self.client.disconnect()
            self.connected = False
            logger.info("📴 Disconnected from MQTT broker")