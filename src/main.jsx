// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import DashboardHome from './components/DashboardHome.jsx';
import StudentManager from './components/StudentManager.jsx';
import LeaveManager from './components/LeaveManager.jsx';
import BillManager from './components/BillManager.jsx'; // NEW: Import the component
import './App.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      { path: "students", element: <StudentManager /> },
      { path: "leaves", element: <LeaveManager /> },
      { path: "bills", element: <BillManager /> }, // NEW: Add the route
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);