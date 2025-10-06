import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom'; // NEW: Import useNavigate
import Sidebar from './Sidebar';
import { supabase } from '../lib/supabaseClient';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate(); // NEW: Get the navigate function from the router

  // NEW: Updated logout function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // This will redirect the user to the homepage after a successful logout
      navigate('/'); 
    } catch (error) {
      alert(`Error logging out: ${error.message}`);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`admin-layout ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar handleLogout={handleLogout} />
      <main className="content-area">
        <button onClick={toggleSidebar} className="sidebar-toggle">
          ☰
        </button>
        <Outlet />
      </main>
    </div>
  );
}