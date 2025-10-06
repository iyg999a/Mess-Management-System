import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // NEW: Import useNavigate
import { supabase } from './lib/supabaseClient';
import StudentPortal from './components/StudentPortal';
import AdminLogin from './components/AdminLogin';
// import Dashboard from './components/Dashboard'; // We no longer import Dashboard here
import './App.css';
import JNTUHLogo from './jntuhlogo.png';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('student');
  const navigate = useNavigate(); // NEW: Get the navigate function from the router

  useEffect(() => {
    // Check for a session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      // If the user is now logged in, redirect them to the /admin page
      if (session) {
        navigate('/admin');
      }
    });

    // Check initial hash on load
    if (window.location.hash === '#admin') {
      setView('admin');
    }
    const handleHashChange = () => {
      setView(window.location.hash === '#admin' ? 'admin' : 'student');
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Check initial session to prevent loading flicker
    supabase.auth.getSession().then(({ data: { session } }) => {
      if(session) {
        navigate('/admin');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [navigate]); // Add navigate to dependency array

  if (loading) {
    // ... (loading spinner JSX is unchanged) ...
  }

  // The App component now ONLY renders the public pages.
  // The 'if (session)' check is gone because the redirect handles it.
  return (
    <div className="container">
      {/* Header Section */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={JNTUHLogo} alt="JNTUH Logo" style={{ height: '50px', marginRight: '15px' }} />
          <h1>Hostel Mess Management</h1>
        </div>
        <p className="text-center mt-3" style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Welcome to the JNTUH UNIVERSITY COLLEGE OF ENGINEERING Mess Management
        </p>
      </div>

      {/* Main Content */}
      <div className="card">
        {view === 'admin' ? <AdminLogin /> : <StudentPortal />}
      </div>

      {/* Footer */}
      <div className="text-center mt-4" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        <p>© JNTUHUCES Hostel Mess Management System. All rights reserved.</p>
      </div>
    </div>
  );
}

export default App;