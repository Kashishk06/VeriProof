import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { sidebarCollapsed } = useApp();

  // If not authenticated, allow viewing demo by automatically picking verifier or letting user browse
  // We can let them proceed or render login
  // Let's ensure smooth experience: if user is null, demo user is initialized or redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex font-sans">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? '70px' : '250px' }}
      >
        <Header />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
