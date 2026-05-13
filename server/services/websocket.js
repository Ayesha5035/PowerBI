// server/services/websocket.js
const { Server } = require('socket.io');

let io = null;

function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Subscribe to specific machine updates
    socket.on('subscribe-machine', (machineId) => {
      socket.join(`machine:${machineId}`);
      console.log(`📺 Client ${socket.id} subscribed to machine: ${machineId}`);
    });

    // Unsubscribe
    socket.on('unsubscribe-machine', (machineId) => {
      socket.leave(`machine:${machineId}`);
      console.log(`👋 Client ${socket.id} unsubscribed from machine: ${machineId}`);
    });

    // Subscribe to all updates
    socket.on('subscribe-all', () => {
      socket.join('all-machines');
      console.log(`📡 Client ${socket.id} subscribed to all machines`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initWebSocket first.');
  }
  return io;
}

function emitToMachine(machineId, event, data) {
  if (io) {
    io.to(`machine:${machineId}`).emit(event, data);
    io.to('all-machines').emit(event, data);
  }
}

function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initWebSocket,
  getIO,
  emitToMachine,
  emitToAll
};