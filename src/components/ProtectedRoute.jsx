// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // ✅ TEMPORARY FIX: Show app even without login
  // Remove this check temporarily to stop the loop
  return children;
};

export default ProtectedRoute;