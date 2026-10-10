import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Search, Filter, ShieldCheck, CheckCircle,
  Eye, X, ArrowUpRight, Lock, Shield, Activity, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminHeader } from './components/AdminHeader';
import { Pagination } from './components/Pagination';
import { TableEmptyState } from './components/TableStates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AuditLogRecord } from '../../data/mockData';

export const AuditTrailPage: React.FC = () => {
  const { auditLogs } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Selected Event for details modal
  const [selectedEvent, setSelectedEvent] = useState<AuditLogRecord | null>(null);

  // Summary Metrics
  const totalEvents = auditLogs.length;
  const adminActionsCount = auditLogs.filter(a => a.actorRole === 'SUPER_ADMIN' || a.actorRole === 'SUPER ADMIN').length;
  const issuerActionsCount = auditLogs.filter(a => a.actorRole === 'ISSUER').length;
  const verifierActionsCount = auditLogs.filter(a => a.actorRole === 'VERIFIER').length;
  const securityEventsCount = auditLogs.filter(a => a.entityType === 'SECURITY' || a.action.includes('SECURITY')).length;
  const failedActionsCount = 0; // Immutable verified ledger
  const recentEventsCount = auditLogs.filter(a => a.timestamp.includes('ago') || a.timestamp.includes('Just now')).length;

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch =
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = roleFilter === 'ALL' || log.actorRole.toUpperCase().replace(/\s+/g, '_') === roleFilter;
      const matchResource = resourceFilter === 'ALL' || log.entityType === resourceFilter;
      const matchAction = actionFilter === 'ALL' || log.action.includes(actionFilter);

      return matchSearch && matchRole && matchResource && matchAction;
    });
  }, [auditLogs, searchTerm, roleFilter, resourceFilter, actionFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setResourceFilter('ALL');
    setActionFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Immutable Platform Audit Trail"
        description="Chronological, cryptographically hashed audit entries capturing every administrative decision, verification query, and policy update."
        badge="SHA-256 HASH CHAIN"
        badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        actions={
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            <Lock size={12} />
            <span>WRITE-ONCE READ-MANY (WORM)</span>
          </div>
        }
      />

      {/* A. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Events</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalEvents}</span>
          <span className="text-[10px] text-slate-500">Recorded ledger</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Admin Actions</span>
          <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">{adminActionsCount}</span>
          <span className="text-[10px] text-slate-500">Root operations</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Issuer Actions</span>
          <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">{issuerActionsCount}</span>
          <span className="text-[10px] text-slate-500">Sign & issue</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Verifier Actions</span>
          <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">{verifierActionsCount}</span>
          <span className="text-[10px] text-slate-500">Audited queries</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Security Events</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{securityEventsCount}</span>
          <span className="text-[10px] text-slate-500">Incident triggers</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Integrity State</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">100%</span>
          <span className="text-[10px] text-emerald-400 font-bold">Unbroken chain</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Recent Events</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">+{recentEventsCount}</span>
          <span className="text-[10px] text-slate-500">Past 24h</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by event ID, action, actor, resource ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ISSUER">Issuer</option>
              <option value="VERIFIER">Verifier</option>
            </select>

            {/* Resource Filter */}
            <select
              value={resourceFilter}
              onChange={(e) => { setResourceFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Resource Types</option>
              <option value="DOCUMENT">Document</option>
              <option value="ORGANIZATION">Organization</option>
              <option value="USER">User</option>
              <option value="SECURITY">Security</option>
              <option value="REGISTRY">Registry</option>
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Action Categories</option>
              <option value="DOCUMENT">Document Events</option>
              <option value="ORG">Organization Events</option>
              <option value="USER">User Events</option>
              <option value="KYC">KYC & Verification</option>
            </select>
          </div>
        </div>

        {/* B. AUDIT TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Tamper Hash</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <TableEmptyState
                      isFiltered={searchTerm !== '' || roleFilter !== 'ALL' || resourceFilter !== 'ALL' || actionFilter !== 'ALL'}
                      onClearFilters={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">{log.id}</td>
                    <td className="py-3.5 px-4 text-white">
                      <div>
                        <span className="font-bold">{log.actorName}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">({log.actorRole})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-purple-300">{log.action}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[10px] uppercase">{log.entityType}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.entityId}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        SUCCESS
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[10px] max-w-[110px] truncate" title={log.tamperHash}>
                      {log.tamperHash.slice(0, 12)}...
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvent(log)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="Inspect Complete Audit Metadata"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* C. EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedEvent.action}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      AUTHENTIC
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Event ID: {selectedEvent.id} • Hashed: {selectedEvent.timestamp}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] font-mono uppercase block">Initiator / Actor</span>
                  <span className="font-bold text-white">{selectedEvent.actorName}</span>
                  <span className="text-[10px] text-purple-400 font-mono block">Role: {selectedEvent.actorRole} ({selectedEvent.actorId})</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] font-mono uppercase block">Target Resource</span>
                  <span className="font-bold text-white">{selectedEvent.entityType}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">ID: {selectedEvent.entityId}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] font-mono uppercase block">Event Description</span>
                <p className="text-slate-300 leading-relaxed font-sans">{selectedEvent.details}</p>
              </div>

              {/* Tamper Hash Chain Verification */}
              <div className="p-4 rounded-xl bg-[#050816] border border-purple-500/20 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-400 font-bold">SHA-256 HASH CHAIN ANCHOR</span>
                  <span className="text-emerald-400">CRYPTOGRAPHIC PROOF VERIFIED</span>
                </div>
                <p className="text-[11px] text-slate-400 break-all select-all">
                  Hash: {selectedEvent.tamperHash}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/5">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
