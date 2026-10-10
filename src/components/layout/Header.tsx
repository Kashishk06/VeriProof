import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Shield, Cpu, RefreshCw, CheckCircle, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { securityEvents, documents } = useApp();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/verify?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeThreats = securityEvents.filter(e => e.status === 'ACTIVE').length;

  return (
    <header className="h-16 bg-[#070B19]/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Document ID, Hash, Recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* System Pulse Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ECDSA ENGINE ACTIVE</span>
        </div>

        {/* Rapid Role Jump Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B1020] border border-white/10 text-xs">
          <button
            onClick={() => { switchRole('super_admin'); navigate('/admin'); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              user?.role === 'super_admin' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => { switchRole('issuer'); navigate('/issuer'); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              user?.role === 'issuer' ? 'bg-violet-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Issuer
          </button>
          <button
            onClick={() => { switchRole('verifier'); navigate('/verifier'); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              user?.role === 'verifier' ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verifier
          </button>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-[#0B1020] border border-white/10 text-slate-400 hover:text-white hover:border-purple-400/40 transition-colors relative"
            title="System Alerts & Logs"
          >
            <Bell size={16} />
            {activeThreats > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {activeThreats}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-[#0B1020] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Security & Audit Feed</span>
                <button onClick={() => setNotificationsOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {securityEvents.map((evt) => (
                  <div key={evt.id} className="p-2.5 rounded-xl bg-[#050816] border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono ${evt.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                        {evt.type}
                      </span>
                      <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-snug">{evt.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Return to Landing Page Action */}
        <button
          onClick={() => navigate('/')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-bold transition-all"
        >
          <ExternalLink size={13} />
          <span>Landing Page</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
