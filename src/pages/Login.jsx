import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Analytics Pro</h1>
          <p>Sign in to your account</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        {/* GOOGLE LOGIN BUTTON */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <a 
            href="http://localhost:5000/api/auth/google"
            style={{ 
              textDecoration: 'none',
              display: 'inline-block',
              padding: '12px 24px',
              background: '#4285f4',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '500',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            Continue with Google
          </a>
        </div>
        
        <div className="auth-footer">
          Don't have an account?{' '}
          <a href="/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;