const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');

class WebSocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }

      // Attach user info to socket
      socket.user = decoded;
      next();
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket connected: ${socket.user.email} (${socket.id})`);

      // Join user to their personal room
      socket.join(`user:${socket.user.userId}`);

      // Handle farm subscription
      socket.on('subscribe:farm', (farmId) => {
        socket.join(`farm:${farmId}`);
        console.log(`📡 ${socket.user.email} subscribed to farm: ${farmId}`);
      });

      // Handle farm unsubscription
      socket.on('unsubscribe:farm', (farmId) => {
        socket.leave(`farm:${farmId}`);
        console.log(`📴 ${socket.user.email} unsubscribed from farm: ${farmId}`);
      });

      // Handle device subscription (for specific device updates)
      socket.on('subscribe:device', (deviceId) => {
        socket.join(`device:${deviceId}`);
        console.log(`📡 ${socket.user.email} subscribed to device: ${deviceId}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 WebSocket disconnected: ${socket.user.email} (${reason})`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ WebSocket error for ${socket.user.email}:`, error.message);
      });
    });

    console.log('✅ WebSocket server initialized');
    return this.io;
  }

  /**
   * Broadcast sensor data to farm subscribers
   */
  broadcastSensorData(farmId, data) {
    if (!this.io) return;

    this.io.to(`farm:${farmId}`).emit('sensor:update', {
      type: 'sensor:update',
      farmId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast actuator state change
   */
  broadcastActuatorState(farmId, actuatorId, state) {
    if (!this.io) return;

    this.io.to(`farm:${farmId}`).emit('actuator:update', {
      type: 'actuator:update',
      farmId,
      actuatorId,
      state,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast device status change (online/offline)
   */
  broadcastDeviceStatus(farmId, deviceId, isOnline) {
    if (!this.io) return;

    this.io.to(`farm:${farmId}`).emit('device:status', {
      type: 'device:status',
      farmId,
      deviceId,
      isOnline,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast alert to farm subscribers
   */
  broadcastAlert(farmId, alert) {
    if (!this.io) return;

    this.io.to(`farm:${farmId}`).emit('alert:new', {
      type: 'alert:new',
      farmId,
      alert,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send notification to specific user
   */
  notifyUser(userId, notification) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClients() {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }

  /**
   * Get clients in a specific room
   */
  async getClientsInRoom(room) {
    if (!this.io) return [];
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map(s => ({ id: s.id, user: s.user }));
  }
}

// Export singleton instance
module.exports = new WebSocketService();