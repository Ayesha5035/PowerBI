// src/components/Dashboard/RealtimeDashboard.jsx
import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import KPICard from './KPICard';
import RealtimeChart from './RealtimeChart';

const RealtimeDashboard = ({ machineId }) => {
  const { data, isConnected } = useRealtimeData(machineId);

  return (
    <div className="realtime-dashboard">
      <div className="connection-status">
        {isConnected ? (
          <span className="status-live">🟢 LIVE</span>
        ) : (
          <span className="status-connecting">🔴 Connecting...</span>
        )}
      </div>
      
      {data && data.data && (
        <>
          <div className="kpi-grid">
            <KPICard title="Temperature" value={data.data.temperature} unit="°C" />
            <KPICard title="Pressure" value={data.data.pressure} unit="bar" />
            <KPICard title="Speed" value={data.data.speed} unit="bottles/min" />
            <KPICard title="Efficiency" value={data.data.efficiency} unit="%" />
          </div>
          
          <RealtimeChart data={data.data} />
        </>
      )}
    </div>
  );
};

export default RealtimeDashboard;