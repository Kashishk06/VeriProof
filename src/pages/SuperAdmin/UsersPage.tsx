import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, ShieldCheck, CheckCircle,
  Eye, X, ArrowUpRight, AlertTriangle, Shield,
  Activity, FileText, Check, UserCheck, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';
import { Pagination } from './components/Pagination';
import { TableEmptyState } from './components/TableStates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AdminUserRecord } from '../../data/mockData';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, auditLogs, updateUserStatus } = useApp();
  const { success, warning } = useToast();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected User for Detail View
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Destructive Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'revoke' | 'activate';
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    type: 'suspend',
    userId: '',
    userName: ''
  });

  // Unique orgs for filter
  const organizationsList = useMemo(() => {
    return Array.from(new Set(users.map(u => u.organization)));
  }, [users]);

  // Summary Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.accountStatus === 'ACTIVE').length;
  const suspendedUsers = users.filter(u => u.accountStatus === 'SUSPENDED').length;
  const issuerUsers = users.filter(u => u.role === 'ISSUER').length;
  const verifierUsers = users.filter(u => u.role === 'VERIFIER').length;
  const superAdminUsers = users.filter(u => u.role === 'SUPER ADMIN').length;
  const recentlyRegistered = users.filter(u => u.registrationDate.includes('2026') || u.registrationDate.includes('2025-11')).length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(usr => {
      const matchSearch =
        usr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.organization.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = roleFilter === 'ALL' || usr.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || usr.accountStatus === statusFilter;
      const matchOrg = orgFilter === 'ALL' || usr.organization === orgFilter;

      return matchSearch && matchRole && matchStatus && matchOrg;
    });
  }, [users, searchTerm, roleFilter, statusFilter, orgFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const handleOpenAction = (type: 'suspend' | 'revoke' | 'activate', user: AdminUserRecord) => {
    setConfirmModal({
      isOpen: true,
      type,
      userId: user.id,
      userName: user.name
    });
  };

  const handleConfirmAction = (reason?: string) => {
    if (confirmModal.type === 'suspend') {
      updateUserStatus(confirmModal.userId, 'SUSPENDED');
      warning('User Suspended', `Account ${confirmModal.userName} has been suspended.${reason ? ` Reason: ${reason}` : ''}`);
    } else if (confirmModal.type === 'revoke') {
      updateUserStatus(confirmModal.userId, 'REVOKED');
      warning('User Revoked', `Account ${confirmModal.userName} credentials have been revoked permanently.`);
    } else if (confirmModal.type === 'activate') {
      updateUserStatus(confirmModal.userId, 'ACTIVE');
      success('User Activated', `Account ${confirmModal.userName} has been activated.`);
    }

    if (selectedUser && selectedUser.id === confirmModal.userId) {
      const updated = users.find(u => u.id === confirmModal.userId);
      if (updated) setSelectedUser(updated);
    }

    setConfirmModal({ isOpen: false, type: 'suspend', userId: '', userName: '' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setOrgFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Central User & Verifier Directory"
        description="Unified identity management across all platform roles including Super Admins, Issuers, and Verifiers."
        badge="IDENTITY & ACCESS"
        badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
      />

      {/* A. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Users</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalUsers}</span>
          <span className="text-[10px] text-slate-500">Platform identities</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Active Users</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{activeUsers}</span>
          <span className="text-[10px] text-emerald-400 font-bold">Authenticated</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Suspended</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{suspendedUsers}</span>
          <span className="text-[10px] text-slate-500">Policy lock</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Issuer Staff</span>
          <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">{issuerUsers}</span>
          <span className="text-[10px] text-slate-500">Issuing auth</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Verifiers</span>
          <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">{verifierUsers}</span>
          <span className="text-[10px] text-slate-500">Screening nodes</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Super Admins</span>
          <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">{superAdminUsers}</span>
          <span className="text-[10px] text-purple-400 font-bold">Root control</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Recent</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">+{recentlyRegistered}</span>
          <span className="text-[10px] text-slate-500">Onboarded</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, ID, email, phone, organization..."
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
              <option value="SUPER ADMIN">Super Admin</option>
              <option value="ISSUER">Issuer</option>
              <option value="VERIFIER">Verifier</option>
            </select>

            {/* Account Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REVOKED">Revoked</option>
            </select>

            {/* Organization Filter */}
            <select
              value={orgFilter}
              onChange={(e) => { setOrgFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">All Organizations</option>
              {organizationsList.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>

        {/* B. USER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Name & ID</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Reg Date</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <TableEmptyState
                      isFiltered={searchTerm !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL' || orgFilter !== 'ALL'}
                      onClearFilters={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {usr.name.charAt(0)}
                        </div>
                        <div>
                          <span>{usr.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono font-normal">{usr.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{usr.email}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{usr.phone}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{usr.organization}</span>
                      <span className="text-[10px] text-slate-500 block">{usr.department}</span>
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={usr.role} /></td>
                    <td className="py-3.5 px-4"><StatusBadge status={usr.accountStatus} /></td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{usr.registrationDate}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-[150px] truncate" title={usr.lastActivity}>
                      {usr.lastActivity}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(usr)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="View User Details"
                        >
                          <Eye size={14} />
                        </button>
                        {usr.accountStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => handleOpenAction('suspend', usr)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction('activate', usr)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </div>
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
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* F. USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-lg">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                    <StatusBadge status={selectedUser.role} />
                    <StatusBadge status={selectedUser.accountStatus} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    User ID: {selectedUser.id} • Registered: {selectedUser.registrationDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile & Contact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Email</span>
                <span className="font-mono text-slate-300 font-bold break-all">{selectedUser.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Phone</span>
                <span className="font-mono text-slate-300">{selectedUser.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Organization</span>
                <span className="text-white font-medium">{selectedUser.organization}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Department</span>
                <span className="text-slate-300">{selectedUser.department}</span>
              </div>
            </div>

            {/* Timing & Activity */}
            <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2 text-xs">
              <h4 className="text-[11px] font-mono uppercase text-purple-400 font-semibold">Activity & Session State</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 text-[10px] font-mono block">Last Authentication Session:</span>
                  <span className="text-white font-mono">{selectedUser.lastLogin}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-mono block">Recent Logged Operation:</span>
                  <span className="text-slate-300">{selectedUser.lastActivity}</span>
                </div>
              </div>
            </div>

            {/* Role Specific Analytics */}
            {selectedUser.role === 'ISSUER' && (
              <div className="p-4 rounded-xl bg-[#050816] border border-blue-500/20 space-y-2 text-xs">
                <h4 className="text-[11px] font-mono uppercase text-blue-400 font-semibold">Issuer Activity Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Authorized Credentials Issued:</span>
                    <span className="text-lg font-bold font-mono text-white">{selectedUser.documentsIssuedCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Key Authority Status:</span>
                    <span className="text-emerald-400 font-semibold">ECDSA Signature Authority Active</span>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.role === 'VERIFIER' && (
              <div className="p-4 rounded-xl bg-[#050816] border border-cyan-500/20 space-y-2 text-xs">
                <h4 className="text-[11px] font-mono uppercase text-cyan-400 font-semibold">Verifier Operations Summary</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Total Verifications:</span>
                    <span className="text-base font-bold font-mono text-white">{selectedUser.verificationCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Passed Validations:</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{selectedUser.successfulVerifications || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Divergence Flags:</span>
                    <span className="text-base font-bold font-mono text-red-400">{selectedUser.failedVerifications || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Permissions */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase text-purple-400 font-semibold">Granted Role Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedUser.permissions && selectedUser.permissions.length > 0) ? (
                  selectedUser.permissions.map((p) => (
                    <span key={p} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Standard role default permissions assigned.</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => { setSelectedUser(null); navigate('/admin/access-permissions'); }}
                className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold"
              >
                Manage Permissions
              </button>

              <div className="flex items-center gap-2">
                {selectedUser.accountStatus === 'ACTIVE' ? (
                  <>
                    <button
                      onClick={() => handleOpenAction('suspend', selectedUser)}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                    >
                      Suspend User
                    </button>
                    <button
                      onClick={() => handleOpenAction('revoke', selectedUser)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-500/20"
                    >
                      Revoke Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenAction('activate', selectedUser)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                  >
                    Activate Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === 'suspend'
            ? `Suspend Account for "${confirmModal.userName}"?`
            : confirmModal.type === 'revoke'
            ? `Revoke Account for "${confirmModal.userName}"?`
            : `Activate Account for "${confirmModal.userName}"?`
        }
        message={
          confirmModal.type === 'suspend'
            ? 'Suspending this user will immediately revoke active session tokens and disable dashboard access.'
            : confirmModal.type === 'revoke'
            ? 'Revoking this account is permanent and deletes active cryptographic role delegations.'
            : 'Re-activate this user account with full original role permissions.'
        }
        confirmLabel={
          confirmModal.type === 'suspend' ? 'Suspend User' : confirmModal.type === 'revoke' ? 'Revoke Account' : 'Activate'
        }
        isDestructive={confirmModal.type !== 'activate'}
        requireReason={confirmModal.type !== 'activate'}
        reasonPlaceholder="Provide the administrative justification for account status update..."
      />
    </div>
  );
};
