import os

src_dir = r"c:\Users\hp\Downloads\VeriProof\src"

# Update types/index.ts
types_path = os.path.join(src_dir, 'types', 'index.ts')
with open(types_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("'analyst' | 'investigator' | 'administrator'", "'verifier' | 'issuer' | 'super_admin'")
content = content.replace("NETPROOF", "VERIPROOF")
with open(types_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update data/mockData.ts
mock_path = os.path.join(src_dir, 'data', 'mockData.ts')
with open(mock_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("role: 'administrator'", "role: 'super_admin'")
content = content.replace("role: 'investigator'", "role: 'issuer'")
content = content.replace("role: 'analyst'", "role: 'verifier'")
content = content.replace("'analyst' | 'investigator' | 'administrator'", "'verifier' | 'issuer' | 'super_admin'")
content = content.replace("NETPROOF", "VERIPROOF")
with open(mock_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update AuthContext.tsx
auth_path = os.path.join(src_dir, 'context', 'AuthContext.tsx')
with open(auth_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("'analyst' | 'investigator' | 'administrator'", "'verifier' | 'issuer' | 'super_admin'")
content = content.replace("netproof_user", "veriproof_user")
content = content.replace("netproof_token", "veriproof_token")
content = content.replace("netproof_demo_token", "veriproof_demo_token")
with open(auth_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update Login/index.tsx
login_path = os.path.join(src_dir, 'pages', 'Login', 'index.tsx')
with open(login_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("demoLogin('analyst')", "demoLogin('verifier')")
content = content.replace("demoLogin('investigator')", "demoLogin('issuer')")
content = content.replace("demoLogin('administrator')", "demoLogin('super_admin')")
content = content.replace("Security Analyst", "Verifier")
content = content.replace("Digital Forensics Investigator", "Issuer")
content = content.replace("Administrator", "Super Admin")
content = content.replace("NETPROOF", "VERIPROOF")
with open(login_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Create New Dashboard Pages
pages = {
    'SuperAdmin': 'Super Admin Dashboard',
    'Issuer': 'Issuer Dashboard',
    'Verifier': 'Verifier Dashboard'
}

for folder, title in pages.items():
    folder_path = os.path.join(src_dir, 'pages', folder)
    os.makedirs(folder_path, exist_ok=True)
    comp_content = f"""import React from 'react';

const {folder}Dashboard: React.FC = () => {{
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="text-slate-400">Welcome to the {title}. Features are being built according to the Master Specification.</p>
    </div>
  );
}};

export default {folder}Dashboard;
"""
    with open(os.path.join(folder_path, 'index.tsx'), 'w', encoding='utf-8') as f:
        f.write(comp_content)

# Update App.tsx
app_content = """import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import SplashCursor from './components/ui/SplashCursor';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SplashCursor
        RAINBOW_MODE={true}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        CURL={3}
      />
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Layout */}
            <Route element={<AppLayout />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/issuer" element={<IssuerDashboard />} />
              <Route path="/verifier" element={<VerifierDashboard />} />
              {/* Default authenticated redirect based on role will be handled in layout or login, but for now redirect dashboard */}
              <Route path="/dashboard" element={<Navigate to="/verifier" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
"""
app_path = os.path.join(src_dir, 'App.tsx')
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Update Sidebar.tsx
sidebar_content = """import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, FileText, CheckCircle, 
  Settings, LogOut, ChevronLeft, Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  // Super Admin
  { path: '/super-admin', icon: <Building size={18} />, label: 'Organization Management', roles: ['super_admin'] },
  { path: '/super-admin/kyc', icon: <Shield size={18} />, label: 'KYC / Approvals', roles: ['super_admin'] },
  { path: '/super-admin/settings', icon: <Settings size={18} />, label: 'Platform Settings', roles: ['super_admin'] },
  
  // Issuer
  { path: '/issuer', icon: <LayoutDashboard size={18} />, label: 'Issuer Dashboard', roles: ['issuer'] },
  { path: '/issuer/create', icon: <FileText size={18} />, label: 'Issue Document', roles: ['issuer'] },
  
  // Verifier
  { path: '/verifier', icon: <LayoutDashboard size={18} />, label: 'Verification Dashboard', roles: ['verifier'] },
  { path: '/verifier/history', icon: <CheckCircle size={18} />, label: 'Verification History', roles: ['verifier'] },
];

const ROLE_COLORS: Record<string, string> = {
  verifier: '#A855F7',
  issuer: '#8B5CF6',
  super_admin: '#F59E0B',
};

const ROLE_LABELS: Record<string, string> = {
  verifier: 'Verifier',
  issuer: 'Issuer',
  super_admin: 'Super Admin',
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredNav = NAV_ITEMS.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  const roleColor = user ? ROLE_COLORS[user.role] : '#A855F7';

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[#0B1020] border-r border-white/5 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-base font-black tracking-wider whitespace-nowrap"
            >
              VERI<span className="text-purple-400">PROOF</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
        <div className="space-y-1">
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} relative group`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#11182B] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User info */}
      {user && (
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#050816]"
              style={{ background: roleColor }}
            >
              {user.name.charAt(0)}
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-white text-xs font-semibold truncate">{user.name}</div>
                  <div className="text-[10px] truncate" style={{ color: roleColor }}>
                    {ROLE_LABELS[user.role]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="mt-3 sidebar-link text-red-400 hover:bg-red-500/10 hover:text-red-400 w-full"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="text-xs"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        id="sidebar-toggle"
        className="absolute -right-3 top-16 mt-4 w-6 h-6 rounded-full bg-[#11182B] border border-white/10 flex items-center justify-center hover:border-purple-400/40 transition-colors z-50"
      >
        <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }}>
          <ChevronLeft size={12} className="text-[#94A3B8]" />
        </motion.div>
      </button>
    </motion.aside>
  );
};

export default Sidebar;
"""
sidebar_path = os.path.join(src_dir, 'components', 'layout', 'Sidebar.tsx')
with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sidebar_content)

print("Refactored roles and created new routing.")
