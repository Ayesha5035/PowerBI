// src/components/RealTimeDashboard.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const RealTimeDashboard = () => {
  const [latestData, setLatestData] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('realtime-data-update', (data) => {
      setLatestData(prev => [...data.newRecords, ...prev].slice(0, 50));
      
      // Update charts or display
      console.log('Real-time update:', data);
    });
    
    return () => newSocket.disconnect();
  }, []);

  return (
    <div>
      <h3>Real-Time Data Stream</h3>
      <div className="realtime-container">
        {latestData.map((record, idx) => (
          <div key={idx} className="realtime-card">
            <strong>Machine: {record.machine_id}</strong>
            <div>Temperature: {record.temperature}°F</div>
            <div>Efficiency: {record.efficiency}%</div>
            <small>{new Date(record.time).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeDashboard;