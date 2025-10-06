// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import JNTUHLogo from '../jntuhlogo.png'; // Make sure this path is correct

export default function Sidebar({ handleLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={JNTUHLogo} alt="Logo" className="sidebar-logo" />
        <h3>Admin Panel</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/admin" end>Home</NavLink>
        <NavLink to="/admin/students">Students</NavLink>
        <NavLink to="/admin/leaves">Leaves</NavLink>
        <NavLink to="/admin/bills">Bills</NavLink>
        {/* We can add more links here later */}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}