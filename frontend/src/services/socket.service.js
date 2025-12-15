import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentFarmId = null;
    this.listeners = {};
  }

  connect(token) {
    // If already connected with same token, just return
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected');
      return Promise.resolve(this.socket);
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    return new Promise((resolve) => {
      this.socket = io(WS_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected');
        
        // Re-subscribe to farm if we were subscribed before
        if (this.currentFarmId) {
          this.socket.emit('subscribe:farm', this.currentFarmId);
          console.log(`📡 Re-subscribed to farm: ${this.currentFarmId}`);
        }
        
        // Re-attach listeners
        this._reattachListeners();
        
        resolve(this.socket);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('📴 WebSocket disconnected:', reason);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
        
        // Re-subscribe to farm on reconnect
        if (this.currentFarmId) {
          this.socket.emit('subscribe:farm', this.currentFarmId);
          console.log(`📡 Re-subscribed to farm after reconnect: ${this.currentFarmId}`);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket error:', error.message);
      });

      // Resolve after timeout even if not connected (to not block the app)
      setTimeout(() => resolve(this.socket), 3000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentFarmId = null;
      this.listeners = {};
    }
  }

  subscribeFarm(farmId) {
    this.currentFarmId = farmId;
    
    if (this.socket?.connected) {
      this.socket.emit('subscribe:farm', farmId);
      console.log(`📡 Subscribed to farm: ${farmId}`);
    } else {
      console.log(`⏳ Will subscribe to farm ${farmId} when connected`);
    }
  }

  unsubscribeFarm(farmId) {
    if (this.socket) {
      this.socket.emit('unsubscribe:farm', farmId);
      console.log(`📴 Unsubscribed from farm: ${farmId}`);
    }
    if (this.currentFarmId === farmId) {
      this.currentFarmId = null;
    }
  }

  _reattachListeners() {
    // Remove old listeners first
    if (this.socket) {
      this.socket.removeAllListeners('sensor:update');
      this.socket.removeAllListeners('actuator:update');
      this.socket.removeAllListeners('device:status');
      this.socket.removeAllListeners('alert:new');
    }

    // Reattach stored listeners
    Object.entries(this.listeners).forEach(([event, callback]) => {
      if (this.socket && callback) {
        this.socket.on(event, callback);
        console.log(`📡 Listener reattached for: ${event}`);
      }
    });
  }

  onSensorUpdate(callback) {
    this.listeners['sensor:update'] = callback;
    if (this.socket) {
      this.socket.on('sensor:update', callback);
    }
  }

  onActuatorUpdate(callback) {
    this.listeners['actuator:update'] = (data) => {
      console.log('🔌 actuator:update received:', data);
      callback(data);
    };
    if (this.socket) {
      this.socket.on('actuator:update', this.listeners['actuator:update']);
    }
  }

  onDeviceStatus(callback) {
    this.listeners['device:status'] = callback;
    if (this.socket) {
      this.socket.on('device:status', callback);
    }
  }

  onAlert(callback) {
    this.listeners['alert:new'] = callback;
    if (this.socket) {
      this.socket.on('alert:new', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners('sensor:update');
      this.socket.removeAllListeners('actuator:update');
      this.socket.removeAllListeners('device:status');
      this.socket.removeAllListeners('alert:new');
    }
    this.listeners = {};
  }
}

export const socketService = new SocketService();