// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) throw error;
    } catch (error) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h2>👨‍💼 Admin Login</h2>
        <p className="text-center mt-2" style={{ color: '#6b7280' }}>
          Access the administrative dashboard to manage students, bills, and leave requests
        </p>
      </div>

      {/* Login Form */}
      <div className="card">
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              className="form-input"
              placeholder="admin@hostel.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                className="form-input"
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={loading}
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '1.2rem'
                }}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <strong>Login Failed:</strong> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Signing In...
              </>
            ) : (
              <>
                🔐 Sign In
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Notice */}
      <div className="card">
        <h4 className="card-title">🔒 Security Notice</h4>
        <div className="list">
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">Secure Access</div>
              <div className="list-item-subtitle">This portal is for authorized administrators only</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">Session Timeout</div>
              <div className="list-item-subtitle">You will be automatically logged out after 24 hours of inactivity</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">Data Protection</div>
              <div className="list-item-subtitle">All student data is encrypted and securely stored</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Features Preview */}
      <div className="card">
        <h4 className="card-title">🎛️ Admin Dashboard Features</h4>
        <div className="list">
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">👥 Student Management</div>
              <div className="list-item-subtitle">Add, view, and manage student records</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">💰 Bill Generation</div>
              <div className="list-item-subtitle">Generate and manage monthly mess bills</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">📋 Leave Management</div>
              <div className="list-item-subtitle">Approve or reject student leave requests</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">✅ Payment Verification</div>
              <div className="list-item-subtitle">Verify and confirm student payments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}