// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Load user from localStorage on mount
  useEffect(() => {
    console.log('=== AuthContext Init ===');
    
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('Stored Token:', storedToken ? 'Yes ✓' : 'No ✗');
    console.log('Stored User:', storedUser ? 'Yes ✓' : 'No ✗');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('✓ Loaded user:', parsedUser.name);
        console.log('✓ User ID:', parsedUser.id);
      } catch (e) {
        console.error('Parse error:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleGoogleCallback = (receivedToken, userData) => {
    console.log('=== Google Callback ===');
    
    // Generate unique user ID
    const userWithId = {
      ...userData,
      id: userData.id || Date.now().toString()
    };
    
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(userWithId));
    localStorage.setItem('userId', userWithId.id);
    
    setToken(receivedToken);
    setUser(userWithId);
    
    console.log('✓ Saved user:', userWithId);
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userWithId = { ...data.user, id: data.user.id || Date.now().toString() };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userWithId));
        localStorage.setItem('userId', userWithId.id);
        
        setToken(data.token);
        setUser(userWithId);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userWithId = { ...data.user, id: data.user.id || Date.now().toString() };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userWithId));
        localStorage.setItem('userId', userWithId.id);
        
        setToken(data.token);
        setUser(userWithId);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    // Clear ALL user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    
    // Clear user-specific data
    const userId = localStorage.getItem('lastUserId');
    if (userId) {
      localStorage.removeItem(`userData_${userId}`);
    }
    
    setToken(null);
    setUser(null);
    console.log('✓ Completely logged out');
  };

  const value = {
    user,
    loading,
    token,
    signup,
    login,
    logout,
    handleGoogleCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};