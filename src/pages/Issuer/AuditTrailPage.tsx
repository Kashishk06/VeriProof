import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Search, Filter, Lock,
  Shield, CheckCircle2, Eye, X, ArrowUpRight,
  Clock, User, Database, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../SuperAdmin/components/Pagination';
import { TableEmptyState } from '../SuperAdmin/components/TableStates';
import type { AuditLogRecord } from '../../data/mockData';

export const IssuerAuditTrailPage: React.FC = () => {
  const { user } = useAuth();
  const { auditLogs, organizations } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Selected event modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  // Authoritative organization
  const currentOrg = useMemo(() => {
    return (
      organizations.find(
        (o) =>
          o.name.toLowerCase() === user?.organization?.toLowerCase() ||
          o.legalName.toLowerCase() === user?.organization?.toLowerCase() ||
          o.id === 'ORG-001'
      ) || organizations[0]
    );
  }, [organizations, user]);

  // Section A: Filter to events relevant to this issuer's organization or actor
  const issuerLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchRole = log.actorRole === 'ISSUER' || log.actorRole.includes('ISSUER');
      const matchOrg =
        log.actorName.toLowerCase().includes(currentOrg.name.toLowerCase()) ||
        log.details.toLowerCase().includes(currentOrg.name.toLowerCase()) ||
        (user?.name && log.actorName.toLowerCase() === user.name.toLowerCase());

      // Also include document actions
      const matchDocAction =
        log.action.includes('DOCUMENT') ||
        log.action.includes('REGISTRATION') ||
        log.action.includes('SETTINGS') ||
        log.action.includes('REVOKED');

      return matchRole || matchOrg || matchDocAction;
    });
  }, [auditLogs, currentOrg, user]);

  // Search & Filters (Section B)
  const filteredLogs = useMemo(() => {
    return issuerLogs.filter((log) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        log.id.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.actorName.toLowerCase().includes(term) ||
        log.entityId.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term);

      const matchAction =
        actionFilter === 'ALL' ||
        log.action.toUpperCase().includes(actionFilter.toUpperCase());

      const matchResource =
        resourceFilter === 'ALL' || log.entityType === resourceFilter;

      return matchSearch && matchAction && matchResource;
    });
  }, [issuerLogs, searchTerm, actionFilter, resourceFilter]);

  // Paginated records
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setResourceFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Organization Audit Trail"
        description="Chronological, tamper-evident audit ledger capturing credential issuance, cryptographic signing, batch operations, and revocation actions performed by your organization."
        badge="WORM AUDIT REPOSITORY"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            <Lock size={12} />
            <span>IMMUTABLE WRITE-ONCE LOG</span>
          </div>
        }
      />

      {/* Audit Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Organization Events</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{issuerLogs.length}</span>
          <span className="text-[10px] text-slate-500">Recorded audit events</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Issuance Actions</span>
          <span className="text-2xl font-black font-mono text-violet-400 mt-1 block">
            {issuerLogs.filter((l) => l.action.includes('ISSUED')).length}
          </span>
          <span className="text-[10px] text-slate-500">Credentials signed</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Revocation Actions</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
            {issuerLogs.filter((l) => l.action.includes('REVOKED')).length}
          </span>
          <span className="text-[10px] text-slate-500">Credentials recalled</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Access Policy</span>
          <span className="text-xs font-bold text-emerald-400 mt-2 block font-mono">
            READ-ONLY ENFORCED
          </span>
          <span className="text-[10px] text-slate-500">Strict WORM integrity</span>
        </div>
      </div>

      {/* SECTION B: SEARCH & FILTER TOOLBAR */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Action, Actor, Resource ID, or Notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="ISSUED">Issuance Events</option>
            <option value="REVOKED">Revocation Events</option>
            <option value="SETTINGS">Settings Changes</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="ALL">All Resources</option>
            <option value="DOCUMENT">Document</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="USER">User / Account</option>
          </select>

          {(searchTerm || actionFilter !== 'ALL' || resourceFilter !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              title="Reset filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* SECTION A: AUDIT LOG TABLE */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#070B19] border-b border-white/5 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor / Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <TableEmptyState
                      title="No audit events found"
                      description="No records matched your search query or filter criteria."
                      isFiltered={Boolean(searchTerm || actionFilter !== 'ALL' || resourceFilter !== 'ALL')}
                      onClearFilters={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{log.actorName}</div>
                      <span className="text-[10px] font-mono text-violet-300">{log.actorRole}</span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                      <span
                        className={
                          log.action.includes('REVOKED')
                            ? 'text-red-400'
                            : log.action.includes('ISSUED')
                            ? 'text-emerald-400'
                            : 'text-violet-300'
                        }
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="text-slate-300 block font-bold">{log.entityId}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{log.entityType}</span>
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                      {log.details}
                    </td>

                    {/* Inspect */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="View Full Cryptographic Entry"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* SECTION C: AUDIT EVENT DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1020] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Immutable Audit Entry</h3>
                  <span className="font-mono text-[11px] text-violet-300">{selectedLog.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#070B19] rounded-xl border border-white/5 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Action</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Timestamp</span>
                  <span className="text-slate-300 mt-0.5 block">{selectedLog.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Responsible Actor</span>
                <p className="text-white font-semibold mt-0.5">{selectedLog.actorName}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Role: {selectedLog.actorRole} • ID: {selectedLog.actorId}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Target Resource</span>
                <p className="font-mono text-violet-300 font-bold mt-0.5">
                  {selectedLog.entityId} ({selectedLog.entityType})
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Narrative Details</span>
                <p className="p-3 rounded-lg bg-[#070B19] text-slate-300 text-[11px] mt-1 border border-white/5 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Cryptographic Tamper Hash
                </span>
                <div className="p-2.5 rounded-lg bg-[#050816] font-mono text-[10px] text-slate-400 break-all border border-white/5 mt-1 select-all">
                  {selectedLog.tamperHash}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuerAuditTrailPage;
