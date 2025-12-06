"""
Actuator Manager - Handles relay control for fans, pumps, valves, etc.
"""
import logging
import platform

logger = logging.getLogger(__name__)

IS_RASPBERRY_PI = platform.system() == 'Linux' and platform.machine().startswith('arm')

if IS_RASPBERRY_PI:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)


class ActuatorManager:
    """Manages all actuator controls"""
    
    def __init__(self, config):
        self.config = config
        self.actuators = {}
        self.states = {}
        self._setup_actuators()
    
    def _setup_actuators(self):
        """Initialize actuator GPIO pins"""
        actuators_config = self.config.get('actuators', [])
        
        for actuator_cfg in actuators_config:
            if not actuator_cfg.get('enabled', True):
                continue
            
            name = actuator_cfg['name']
            pin = actuator_cfg['pin']
            actuator_type = actuator_cfg['type']
            
            try:
                if IS_RASPBERRY_PI:
                    GPIO.setup(pin, GPIO.OUT)
                    GPIO.output(pin, GPIO.LOW)  # Start with OFF
                
                self.actuators[name] = {
                    'type': actuator_type,
                    'pin': pin,
                    'id': actuator_cfg.get('id')
                }
                self.states[name] = 'OFF'
                
                logger.info(f"Initialized actuator: {name} ({actuator_type}) on pin {pin}")
                
            except Exception as e:
                logger.error(f"Failed to initialize actuator {name}: {e}")
    
    def control(self, actuator_id, command):
        """Control an actuator by ID"""
        # Find actuator by ID or name
        actuator = None
        actuator_name = None
        
        for name, act in self.actuators.items():
            if act.get('id') == actuator_id or name == actuator_id:
                actuator = act
                actuator_name = name
                break
        
        if not actuator:
            logger.warning(f"Actuator not found: {actuator_id}")
            return False
        
        return self._set_state(actuator_name, command)
    
    def _set_state(self, name, state):
        """Set actuator state (ON/OFF)"""
        if name not in self.actuators:
            logger.warning(f"Unknown actuator: {name}")
            return False
        
        actuator = self.actuators[name]
        pin = actuator['pin']
        state = state.upper()
        
        try:
            if IS_RASPBERRY_PI:
                if state == 'ON':
                    GPIO.output(pin, GPIO.HIGH)
                else:
                    GPIO.output(pin, GPIO.LOW)
            
            self.states[name] = state
            logger.info(f"Actuator {name} set to {state}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set {name} to {state}: {e}")
            return False
    
    def turn_on(self, name):
        """Turn on an actuator"""
        return self._set_state(name, 'ON')
    
    def turn_off(self, name):
        """Turn off an actuator"""
        return self._set_state(name, 'OFF')
    
    def get_state(self, name):
        """Get current state of an actuator"""
        return self.states.get(name, 'UNKNOWN')
    
    def get_all_states(self):
        """Get states of all actuators"""
        return self.states.copy()
    
    def turn_all_off(self):
        """Emergency: turn off all actuators"""
        for name in self.actuators:
            self._set_state(name, 'OFF')
        logger.info("All actuators turned OFF")
    
    def cleanup(self):
        """Cleanup GPIO resources"""
        self.turn_all_off()
        if IS_RASPBERRY_PI:
            GPIO.cleanup()
        logger.info("Actuators cleaned up")