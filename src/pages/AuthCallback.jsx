import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('=== Google Callback ===');
    console.log('Token:', token ? 'Received ✓' : 'Missing ✗');
    
    if (token) {
      // Create user object from URL params
      const userParam = urlParams.get('user');
      let user = { name: 'Google User', email: 'google@user.com' };
      
      if (userParam) {
        try {
          user = JSON.parse(decodeURIComponent(userParam));
        } catch (e) {
          console.error('User parse error:', e);
        }
      }
      
      console.log('User:', user);
      
      // DIRECTLY save to localStorage (bypass handleGoogleCallback if needed)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Also call handleGoogleCallback if exists
      if (handleGoogleCallback) {
        handleGoogleCallback(token, user);
      }
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      console.log('No token - redirecting to login');
      window.location.href = '/login?error=no_token';
    }
  }, [handleGoogleCallback]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px 60px',
        borderRadius: '20px',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ color: '#333' }}> Logging you in...</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>Redirecting to dashboard</p>
        <div style={{
          marginTop: '20px',
          width: '40px',
          height: '40px',
          border: '4px solid #667eea',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;