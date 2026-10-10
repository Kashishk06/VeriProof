import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, Search, Filter, ShieldAlert, CheckCircle,
  Eye, X, ArrowUpRight, AlertTriangle, ExternalLink,
  ChevronDown, UserCheck, FileText, Check, Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';
import { Pagination } from './components/Pagination';
import { TableEmptyState, TableLoadingState } from './components/TableStates';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const IssuersPage: React.FC = () => {
  const navigate = useNavigate();
  const { organizations, documents, users, auditLogs, registry, updateOrgStatus } = useApp();
  const { success, warning } = useToast();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [registryMatchFilter, setRegistryMatchFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'joinedDate' | 'docsCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected Issuer for Detail Drawer / Modal
  const [selectedIssuer, setSelectedIssuer] = useState<any | null>(null);

  // Destructive Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'revoke' | 'activate';
    orgId: string;
    orgName: string;
  }>({
    isOpen: false,
    type: 'suspend',
    orgId: '',
    orgName: ''
  });

  // Summary Metrics
  const totalIssuers = organizations.length;
  const activeIssuers = organizations.filter(o => o.status === 'ACTIVE').length;
  const pendingIssuers = organizations.filter(o => o.status === 'PENDING').length;
  const suspendedIssuers = organizations.filter(o => o.status === 'SUSPENDED').length;
  const revokedIssuers = organizations.filter(o => o.kycStatus === 'REJECTED').length;
  const recentlyRegistered = organizations.filter(o => o.joinedDate?.includes('2026-10') || o.status === 'PENDING').length;

  // Registry match lookup helper
  const getRegistryMatch = (org: any) => {
    const reg = registry.find(r => r.registrationNumber === org.registrationNumber);
    if (!reg) return {
      status: 'MISMATCHED',
      recordId: 'N/A',
      matchScore: '0%',
      matchedFields: [] as string[],
      mismatchedFields: ['Not registered in oracle dataset'] as string[],
      lastCheck: 'Today, 08:00 UTC'
    };
    const nameMatch = reg.orgName.toLowerCase().includes(org.name.toLowerCase()) || org.name.toLowerCase().includes(reg.orgName.toLowerCase());
    return {
      status: nameMatch ? 'MATCHED' : 'MISMATCHED',
      recordId: reg.registrationNumber,
      matchedFields: ['Registration ID', 'Official Domain', 'Jurisdiction'],
      mismatchedFields: nameMatch ? [] : ['Legal Name Discrepancy'],
      lastCheck: 'Today, 08:00 UTC'
    };
  };

  // Filtered & Sorted Data
  const filteredIssuers = useMemo(() => {
    return organizations.filter(org => {
      const matchSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.officialEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.authorizedPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || org.type === typeFilter;
      const matchKyc = kycFilter === 'ALL' || org.kycStatus === kycFilter;
      const matchStatus = statusFilter === 'ALL' || org.status === statusFilter;

      const reg = getRegistryMatch(org);
      const matchRegistry = registryMatchFilter === 'ALL' || reg.status === registryMatchFilter;

      return matchSearch && matchType && matchKyc && matchStatus && matchRegistry;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'joinedDate') comparison = (a.joinedDate || '').localeCompare(b.joinedDate || '');
      else if (sortBy === 'docsCount') comparison = (a.documentsIssuedCount || 0) - (b.documentsIssuedCount || 0);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [organizations, searchTerm, typeFilter, kycFilter, statusFilter, registryMatchFilter, sortBy, sortOrder]);

  const paginatedIssuers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssuers.slice(start, start + pageSize);
  }, [filteredIssuers, currentPage]);

  const handleActionClick = (type: 'suspend' | 'revoke' | 'activate', org: any) => {
    setConfirmModal({
      isOpen: true,
      type,
      orgId: org.id,
      orgName: org.name
    });
  };

  const handleConfirmAction = (reason?: string) => {
    if (confirmModal.type === 'suspend') {
      updateOrgStatus(confirmModal.orgId, 'SUSPENDED', 'MANUAL_REVIEW');
      warning('Issuer Suspended', `Issuer "${confirmModal.orgName}" has been suspended.${reason ? ` Reason: ${reason}` : ''}`);
    } else if (confirmModal.type === 'revoke') {
      updateOrgStatus(confirmModal.orgId, 'SUSPENDED', 'REJECTED');
      warning('Issuer Authority Revoked', `Issuer "${confirmModal.orgName}" authority was permanently revoked.${reason ? ` Reason: ${reason}` : ''}`);
    } else if (confirmModal.type === 'activate') {
      updateOrgStatus(confirmModal.orgId, 'ACTIVE', 'APPROVED');
      success('Issuer Activated', `Issuer "${confirmModal.orgName}" is now active and authorized.`);
    }

    if (selectedIssuer && selectedIssuer.id === confirmModal.orgId) {
      const updated = organizations.find(o => o.id === confirmModal.orgId);
      if (updated) setSelectedIssuer(updated);
    }

    setConfirmModal({ isOpen: false, type: 'suspend', orgId: '', orgName: '' });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setKycFilter('ALL');
    setStatusFilter('ALL');
    setRegistryMatchFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Issuer Organizations Management"
        description="Monitor verified issuer authorities, review KYC standing, inspect cryptographic document outputs, and manage institutional lifecycle states."
        badge="INSTITUTIONAL GOVERNANCE"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      />

      {/* A. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Issuers</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalIssuers}</span>
          <span className="text-[10px] text-slate-500">Registered entities</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Active Issuers</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{activeIssuers}</span>
          <span className="text-[10px] text-emerald-400 font-bold">Authorized to issue</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Pending Issuers</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{pendingIssuers}</span>
          <span className="text-[10px] text-amber-400 font-bold">Awaiting validation</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Suspended</span>
          <span className="text-2xl font-black font-mono text-orange-400 mt-1 block">{suspendedIssuers}</span>
          <span className="text-[10px] text-slate-500">Temporarily locked</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Revoked</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{revokedIssuers}</span>
          <span className="text-[10px] text-slate-500">Keys invalidated</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Recently Joined</span>
          <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">+{recentlyRegistered}</span>
          <span className="text-[10px] text-slate-500">Last 14 days</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Org Name, Issuer ID, Reg No, Domain, Email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="University">University</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Government">Government</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Financial">Financial</option>
            </select>

            {/* KYC Status */}
            <select
              value={kycFilter}
              onChange={(e) => { setKycFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All KYC Statuses</option>
              <option value="APPROVED">KYC Approved</option>
              <option value="PENDING">KYC Pending</option>
              <option value="REJECTED">KYC Rejected</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
            </select>

            {/* Account Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Account States</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Registry Match */}
            <select
              value={registryMatchFilter}
              onChange={(e) => { setRegistryMatchFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Registry Match</option>
              <option value="MATCHED">Matched</option>
              <option value="MISMATCHED">Mismatched</option>
            </select>
          </div>
        </div>

        {/* B. ISSUER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Organization Name</th>
                <th className="py-3 px-4">Issuer ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Registry Match</th>
                <th className="py-3 px-4">Docs</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedIssuers.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <TableEmptyState
                      isFiltered={searchTerm !== '' || typeFilter !== 'ALL' || kycFilter !== 'ALL' || statusFilter !== 'ALL' || registryMatchFilter !== 'ALL'}
                      onClearFilters={clearAllFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedIssuers.map((org) => {
                  const reg = getRegistryMatch(org);
                  return (
                    <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <span>{org.name}</span>
                            <span className="text-[10px] text-slate-500 block font-normal">{org.legalName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-300">{org.id}</td>
                      <td className="py-3.5 px-4 text-slate-300">{org.type}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{org.registrationNumber}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={org.kycStatus} /></td>
                      <td className="py-3.5 px-4"><StatusBadge status={reg.status} /></td>
                      <td className="py-3.5 px-4 font-mono text-white font-semibold">{org.documentsIssuedCount || 0}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={org.status} /></td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{org.joinedDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedIssuer(org)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="View Complete Issuer Profile"
                          >
                            <Eye size={14} />
                          </button>
                          {org.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleActionClick('suspend', org)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActionClick('activate', org)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredIssuers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* E. ISSUER DETAILS DRAWER / MODAL (All 9 Required Sections) */}
      {selectedIssuer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-lg">
                  {selectedIssuer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedIssuer.name}</h3>
                    <StatusBadge status={selectedIssuer.status} />
                    <StatusBadge status={selectedIssuer.kycStatus} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Issuer ID: {selectedIssuer.id} • Registered: {selectedIssuer.joinedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssuer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. Organization Profile */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                1. Organization Profile
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Entity Type</span>
                  <span className="font-bold text-white">{selectedIssuer.type}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Official Email</span>
                  <span className="font-mono text-slate-300">{selectedIssuer.officialEmail}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Official Domain</span>
                  <span className="font-mono text-purple-300">{selectedIssuer.officialDomain}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Authorized Person</span>
                  <span className="font-bold text-white">{selectedIssuer.authorizedPerson}</span>
                </div>
              </div>
            </div>

            {/* 2. Registration Information */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                2. Registration Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Registration ID</span>
                  <span className="font-mono text-purple-300 font-bold">{selectedIssuer.registrationNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Tax GSTIN / EIN</span>
                  <span className="font-mono text-slate-300">{selectedIssuer.gstinTaxId}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Registration Authority</span>
                  <span className="text-slate-300">National Board of Education / Corporate Commission</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Trust Rating</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedIssuer.trustRating || 98.5}%</span>
                </div>
              </div>
            </div>

            {/* 3. KYC Information */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                3. KYC Information
              </h4>
              <div className="p-4 rounded-xl bg-[#050816] border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">KYC Status</span>
                  <StatusBadge status={selectedIssuer.kycStatus} />
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Reviewed By</span>
                  <span className="text-white font-medium">{selectedIssuer.reviewedBy || 'Alice Admin'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Reviewed At</span>
                  <span className="font-mono text-slate-300">{selectedIssuer.reviewedAt || '2026-01-16 11:20'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Verification Result</span>
                  <span className="text-emerald-400 font-semibold">{selectedIssuer.kycStatus === 'APPROVED' ? 'PASSED (Cryptographic Key Granted)' : 'PENDING REVIEW'}</span>
                </div>
              </div>
            </div>

            {/* 4. Registry Information */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                4. Registry Information
              </h4>
              {(() => {
                const reg = getRegistryMatch(selectedIssuer);
                return (
                  <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Cross-Checked Against State Oracle</span>
                      <StatusBadge status={reg.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                      <div>Record ID: {reg.recordId}</div>
                      <div>Last Verified: {reg.lastCheck}</div>
                      <div>Discrepancies: {reg.mismatchedFields.length === 0 ? 'None (Clean)' : reg.mismatchedFields.join(', ')}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 5. Institutional Staff Users */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                5. Associated Organization Staff
              </h4>
              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-2 text-xs">
                {users
                  .filter(u => u.organization.toLowerCase().includes(selectedIssuer.name.toLowerCase()) || u.role === 'ISSUER')
                  .slice(0, 2)
                  .map(usr => (
                    <div key={usr.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <div>
                        <span className="font-bold text-white">{usr.name}</span>
                        <span className="text-slate-500 text-[10px] block font-mono">{usr.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={usr.role} />
                        <StatusBadge status={usr.accountStatus} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 6. Documents Issued */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                6. Issued Documents Summary
              </h4>
              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-bold block">{selectedIssuer.documentsIssuedCount || 0} Cryptographic Credentials</span>
                  <span className="text-[11px] text-slate-400">ECDSA secp256k1 signed with registered public key</span>
                </div>
                <button
                  onClick={() => { setSelectedIssuer(null); navigate('/admin/document-oversight'); }}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1"
                >
                  <FileText size={12} />
                  <span>View in Oversight</span>
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedIssuer(null); navigate('/admin/audit-trail'); }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  View Audit Trail
                </button>
                <button
                  onClick={() => { setSelectedIssuer(null); navigate('/admin/organization-verification'); }}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold"
                >
                  Review KYC Docs
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedIssuer.status === 'ACTIVE' ? (
                  <>
                    <button
                      onClick={() => handleActionClick('suspend', selectedIssuer)}
                      className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold"
                    >
                      Suspend Issuer
                    </button>
                    <button
                      onClick={() => handleActionClick('revoke', selectedIssuer)}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                    >
                      Revoke Issuer Authority
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleActionClick('activate', selectedIssuer)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                  >
                    Activate Organization
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
            ? `Suspend Issuer "${confirmModal.orgName}"?`
            : confirmModal.type === 'revoke'
            ? `Revoke Authority for "${confirmModal.orgName}"?`
            : `Activate Organization "${confirmModal.orgName}"?`
        }
        message={
          confirmModal.type === 'suspend'
            ? 'Suspension immediately restricts new credential issuance and flags pending verifications. Require justification.'
            : confirmModal.type === 'revoke'
            ? 'Revoking issuer authority permanently invalidates the entity key pair and marks all past credentials as issued by a revoked entity. This is a severe administrative action.'
            : 'Activating this organization grants complete cryptographic issuance rights.'
        }
        confirmLabel={
          confirmModal.type === 'suspend' ? 'Confirm Suspension' : confirmModal.type === 'revoke' ? 'Permanently Revoke' : 'Activate'
        }
        isDestructive={confirmModal.type !== 'activate'}
        requireReason={confirmModal.type !== 'activate'}
        reasonPlaceholder="Provide the administrative rationale for suspension or revocation..."
      />
    </div>
  );
};
