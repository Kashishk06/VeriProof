import os

src_dir = r"c:\Users\hp\Downloads\VeriProof\src"

# 1. UPDATE SIDEBAR.TSX
sidebar_content = """import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, FileText, CheckCircle, 
  Settings, LogOut, ChevronLeft, Building, 
  UserCheck, Users, Database, ShieldAlert, Activity, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  // Super Admin
  { path: '/super-admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['super_admin'] },
  { path: '/super-admin/organizations', icon: <Building size={18} />, label: 'Organizations', roles: ['super_admin'] },
  { path: '/super-admin/kyc', icon: <UserCheck size={18} />, label: 'KYC / KYB', roles: ['super_admin'] },
  { path: '/super-admin/issuers', icon: <FileText size={18} />, label: 'Issuers', roles: ['super_admin'] },
  { path: '/super-admin/verifiers', icon: <CheckCircle size={18} />, label: 'Verifiers', roles: ['super_admin'] },
  { path: '/super-admin/users', icon: <Users size={18} />, label: 'Users & Roles', roles: ['super_admin'] },
  { path: '/super-admin/registry', icon: <Database size={18} />, label: 'Registry', roles: ['super_admin'] },
  { path: '/super-admin/security', icon: <ShieldAlert size={18} />, label: 'Security', roles: ['super_admin'] },
  { path: '/super-admin/audit-logs', icon: <FileText size={18} />, label: 'Audit Logs', roles: ['super_admin'] },
  { path: '/super-admin/analytics', icon: <Activity size={18} />, label: 'Analytics', roles: ['super_admin'] },
  { path: '/super-admin/notifications', icon: <Bell size={18} />, label: 'Notifications', roles: ['super_admin'] },
  { path: '/super-admin/settings', icon: <Settings size={18} />, label: 'Settings', roles: ['super_admin'] },
  
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
with open(os.path.join(src_dir, 'components', 'layout', 'Sidebar.tsx'), 'w', encoding='utf-8') as f:
    f.write(sidebar_content)

# 2. CREATE STATCARD COMPONENT
ui_dir = os.path.join(src_dir, 'components', 'ui')
os.makedirs(ui_dir, exist_ok=True)

statcard_content = """import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => {
  return (
    <div className="bg-[#0B1020]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h4 className="text-3xl font-black text-white font-mono tracking-tight">{value}</h4>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{title}</p>
      </div>
    </div>
  );
};
"""
with open(os.path.join(ui_dir, 'StatCard.tsx'), 'w', encoding='utf-8') as f:
    f.write(statcard_content)

# 3. CREATE SUPER ADMIN DASHBOARD
sa_dir = os.path.join(src_dir, 'pages', 'SuperAdmin')
os.makedirs(sa_dir, exist_ok=True)

dashboard_content = """import React from 'react';
import { 
  Building, UserCheck, FileText, CheckCircle, 
  ShieldAlert, Database, Activity, ActivityIcon, Check
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Good morning, Admin
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor and manage the VERIPROOF trust ecosystem.
        </p>
      </div>

      {/* Top Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Organizations" 
          value="142" 
          icon={<Building size={20} />} 
          trend="+12% this month" 
          trendUp={true} 
        />
        <StatCard 
          title="Pending KYC" 
          value="18" 
          icon={<UserCheck size={20} />} 
          trend="Requires Review" 
          trendUp={false} 
        />
        <StatCard 
          title="Verified Issuers" 
          value="89" 
          icon={<FileText size={20} />} 
        />
        <StatCard 
          title="Verified Verifiers" 
          value="35" 
          icon={<CheckCircle size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Documents Issued" 
          value="18.4K" 
          icon={<Database size={20} />} 
          trend="+2.1K this week" 
          trendUp={true} 
        />
        <StatCard 
          title="Documents Verified" 
          value="84.2K" 
          icon={<Check size={20} />} 
        />
        <StatCard 
          title="Suspicious Docs" 
          value="342" 
          icon={<ShieldAlert size={20} />} 
          trend="Flagged" 
          trendUp={false} 
        />
        <StatCard 
          title="Active Organizations" 
          value="118" 
          icon={<Activity size={20} />} 
        />
      </div>

      {/* System Health Section */}
      <div className="bg-[#0B1020]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ActivityIcon size={18} className="text-purple-400" />
          System Health
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { name: 'Authentication', status: 'Operational' },
            { name: 'Document Registry', status: 'Operational' },
            { name: 'Verification Engine', status: 'Operational' },
            { name: 'OCR Engine', status: 'Warning' },
            { name: 'AI Forensics', status: 'Operational' },
            { name: 'Database', status: 'Operational' },
            { name: 'Audit Logging', status: 'Operational' }
          ].map(service => (
            <div key={service.name} className="flex flex-col gap-2 p-4 rounded-xl bg-[#050816] border border-white/5 items-center text-center">
              <div className={`w-3 h-3 rounded-full ${service.status === 'Operational' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
              <div className="text-xs font-bold text-white">{service.name}</div>
              <div className={`text-[10px] font-mono uppercase tracking-wider ${service.status === 'Operational' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {service.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
"""
with open(os.path.join(sa_dir, 'index.tsx'), 'w', encoding='utf-8') as f:
    f.write(dashboard_content)

print("Created basic super admin dashboard components.")
