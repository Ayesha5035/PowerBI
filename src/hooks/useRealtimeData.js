// src/hooks/useRealtimeData.js
import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useRealtimeData = (machineId = null) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      
      if (machineId) {
        newSocket.emit('subscribe-machine', machineId);
      } else {
        newSocket.emit('subscribe-all');
      }
    });

    newSocket.on('sensor-update', (update) => {
      setData(update);
    });

    newSocket.on('query-result', (result) => {
      console.log('📊 Query result received:', result.rowCount, 'rows');
      setData(result);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [machineId]);

  const subscribeToMachine = useCallback((id) => {
    if (socket && isConnected) {
      socket.emit('subscribe-machine', id);
    }
  }, [socket, isConnected]);

  const unsubscribeFromMachine = useCallback((id) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe-machine', id);
    }
  }, [socket, isConnected]);

  return { data, isConnected, subscribeToMachine, unsubscribeFromMachine, socket };
};