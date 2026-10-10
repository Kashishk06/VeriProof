import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, FileText, CheckCircle,
  Settings, LogOut, ChevronLeft, Building,
  UserCheck, Users, Database, ShieldAlert,
  Search, Sliders, ExternalLink, Cpu, FileSpreadsheet, Eye,
  Activity, BarChart2, Upload, Files, History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import veriproofLogo from '../../assets/veriproof_logo.png';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentRole = user?.role || 'verifier';

  const roleNavItems = {
    super_admin: [
      { path: '/admin/overview', icon: <Activity size={17} />, label: 'Overview' },
      { path: '/admin/issuers', icon: <Building size={17} />, label: 'Issuers' },
      { path: '/admin/users', icon: <Users size={17} />, label: 'Users' },
      { path: '/admin/organization-verification', icon: <UserCheck size={17} />, label: 'Organization Verification' },
      { path: '/admin/access-permissions', icon: <Sliders size={17} />, label: 'Access & Permissions' },
      { path: '/admin/trusted-registry', icon: <Database size={17} />, label: 'Trusted Registry' },
      { path: '/admin/document-oversight', icon: <FileText size={17} />, label: 'Document Oversight' },
      { path: '/admin/audit-trail', icon: <FileSpreadsheet size={17} />, label: 'Audit Trail' },
      { path: '/admin/reports', icon: <BarChart2 size={17} />, label: 'Reports & Analytics' },
      { path: '/admin/settings', icon: <Settings size={17} />, label: 'System Settings' },
    ],
    issuer: [
      { path: '/issuer', icon: <LayoutDashboard size={17} />, label: 'Overview' },
      { path: '/issuer/issue', icon: <FileText size={17} />, label: 'Issue Document' },
      { path: '/issuer/bulk', icon: <Upload size={17} />, label: 'Bulk Registration' },
      { path: '/issuer/documents', icon: <Files size={17} />, label: 'My Documents' },
      { path: '/issuer/protection', icon: <Shield size={17} />, label: 'Document Protection' },
      { path: '/issuer/history', icon: <History size={17} />, label: 'Document History' },
      { path: '/issuer/revoke', icon: <ShieldAlert size={17} />, label: 'Revoke Document' },
      { path: '/issuer/audit', icon: <FileSpreadsheet size={17} />, label: 'Audit Trail' },
      { path: '/issuer/settings', icon: <Settings size={17} />, label: 'Settings' },
    ],
    verifier: [
      { path: '/verifier/overview', icon: <LayoutDashboard size={17} />, label: 'Overview' },
      { path: '/verifier/verify', icon: <CheckCircle size={17} />, label: 'Verify Document' },
      { path: '/verifier/bulk', icon: <FileSpreadsheet size={17} />, label: 'Bulk Verification' },
      { path: '/verifier/dna', icon: <Cpu size={17} />, label: 'Document DNA' },
      { path: '/verifier/forensics', icon: <ShieldAlert size={17} />, label: 'Forensic Analysis' },
      { path: '/verifier/history', icon: <Search size={17} />, label: 'Verification History' },
      { path: '/verifier/reports', icon: <BarChart2 size={17} />, label: 'Verification Reports' },
      { path: '/verifier/settings', icon: <Settings size={17} />, label: 'Settings' },
    ],
  };

  const navItems = roleNavItems[currentRole] || roleNavItems.verifier;

  const roleColors = {
    super_admin: { label: 'Super Admin', border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    issuer: { label: 'Issuer', border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400' },
    verifier: { label: 'Verifier / Viewer', border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400' }
  };

  const currentMeta = roleColors[currentRole];

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 70 : 250 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[#070B19] border-r border-white/5 overflow-hidden shadow-2xl select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/5 flex-shrink-0">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
          title="Return to Landing Page"
        >
          {sidebarCollapsed ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-[#050816] rounded-xl flex items-center justify-center">
                <Shield size={16} className="text-purple-400" />
              </div>
            </div>
          ) : (
            <img
              src={veriproofLogo}
              alt="VeriProof"
              className="h-11 w-auto object-contain group-hover:opacity-90 transition-opacity flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/issuer' || item.path === '/verifier' || item.path === '/verifier/overview'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0">
              {item.icon}
            </span>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Global Public Links */}
        <div className="pt-3 border-t border-white/5 mt-3 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Landing Page"
          >
            <ExternalLink size={15} className="text-slate-500 flex-shrink-0" />
            {!sidebarCollapsed && <span>View Landing Page</span>}
          </button>
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-white/5 bg-[#050816]/60 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Verified User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'user@veriproof.io'}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle Handle */}
      <button
        onClick={toggleSidebar}
        className="absolute top-20 right-1 w-5 h-5 rounded-full bg-[#0B1020] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-400/40 transition-colors z-50 shadow-md"
      >
        <ChevronLeft size={12} className={`transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>
    </motion.aside>
  );
};

export default Sidebar;
