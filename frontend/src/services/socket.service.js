import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📴 WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeFarm(farmId) {
    if (this.socket) {
      this.socket.emit('subscribe:farm', farmId);
      console.log(`📡 Subscribed to farm: ${farmId}`);
    }
  }

  unsubscribeFarm(farmId) {
    if (this.socket) {
      this.socket.emit('unsubscribe:farm', farmId);
      console.log(`📴 Unsubscribed from farm: ${farmId}`);
    }
  }

  onSensorUpdate(callback) {
    if (this.socket) {
      this.socket.on('sensor:update', callback);
    }
  }

  onActuatorUpdate(callback) {
    if (this.socket) {
      this.socket.on('actuator:update', callback);
    }
  }

  onDeviceStatus(callback) {
    if (this.socket) {
      this.socket.on('device:status', callback);
    }
  }

  onAlert(callback) {
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
  }
}

export const socketService = new SocketService();