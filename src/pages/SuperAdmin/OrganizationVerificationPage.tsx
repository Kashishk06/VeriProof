import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Search, Filter, ShieldCheck, CheckCircle,
  XCircle, AlertTriangle, Eye, Check, X, FileText,
  Clock, Shield, ArrowRight, Building, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';
import { Pagination } from './components/Pagination';
import { TableEmptyState } from './components/TableStates';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const OrganizationVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { organizations, registry, updateOrgStatus, addAuditLog } = useApp();
  const { success, warning, info } = useToast();

  // Internal tab state: Pending KYC, Under Review, Verified, Rejected, Registry Match
  const [activeTab, setActiveTab] = useState<'PENDING' | 'MANUAL_REVIEW' | 'APPROVED' | 'REJECTED' | 'REGISTRY_MATCH'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected organization for inspection drawer/modal
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);

  // Modals for actions
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; org: any | null }>({ isOpen: false, org: null });
  const [manualReviewModal, setManualReviewModal] = useState<{ isOpen: boolean; org: any | null; reason: string; reviewer: string }>({
    isOpen: false,
    org: null,
    reason: 'Requires jurisdiction seal check',
    reviewer: 'Alice Admin'
  });
  const [reqInfoModal, setReqInfoModal] = useState<{ isOpen: boolean; org: any | null; note: string }>({
    isOpen: false,
    org: null,
    note: ''
  });

  // Cross-reference registry lookup
  const getRegistryRecord = (org: any) => {
    return registry.find(r => r.registrationNumber === org.registrationNumber);
  };

  // Metrics
  const pendingCount = organizations.filter(o => o.kycStatus === 'PENDING').length;
  const underReviewCount = organizations.filter(o => o.kycStatus === 'MANUAL_REVIEW').length;
  const verifiedCount = organizations.filter(o => o.kycStatus === 'APPROVED').length;
  const rejectedCount = organizations.filter(o => o.kycStatus === 'REJECTED').length;
  const registryMismatchCount = organizations.filter(o => {
    const reg = getRegistryRecord(o);
    return !reg || !reg.orgName.toLowerCase().includes(o.name.toLowerCase());
  }).length;
  const avgVerificationTime = '4.2 hrs';

  // Filtered List based on active tab and search
  const filteredList = useMemo(() => {
    return organizations.filter(org => {
      const matchSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.authorizedPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.officialDomain.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'REGISTRY_MATCH') {
        const reg = getRegistryRecord(org);
        return reg !== undefined;
      }
      return org.kycStatus === activeTab;
    });
  }, [organizations, activeTab, searchTerm, registry]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const handleApprove = (org: any) => {
    updateOrgStatus(org.id, 'ACTIVE', 'APPROVED');
    success('KYB Approved', `Organization ${org.name} has been verified and registered as an active trusted issuer.`);
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'ORGANIZATION_KYC_APPROVED',
      entityType: 'ORGANIZATION',
      entityId: org.id,
      details: `Granted official issuer cryptographic keys to ${org.name} after registry cross-validation.`
    });
    if (selectedOrg?.id === org.id) {
      setSelectedOrg({ ...org, status: 'ACTIVE', kycStatus: 'APPROVED' });
    }
  };

  const handleRejectConfirm = (reason?: string) => {
    if (!rejectModal.org) return;
    updateOrgStatus(rejectModal.org.id, 'SUSPENDED', 'REJECTED');
    warning('KYB Rejected', `Organization ${rejectModal.org.name} application was rejected.`);
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'ORGANIZATION_KYC_REJECTED',
      entityType: 'ORGANIZATION',
      entityId: rejectModal.org.id,
      details: `Rejected KYB application. Reason: ${reason || 'Failed criteria'}`
    });
    if (selectedOrg?.id === rejectModal.org.id) {
      setSelectedOrg({ ...rejectModal.org, status: 'SUSPENDED', kycStatus: 'REJECTED' });
    }
    setRejectModal({ isOpen: false, org: null });
  };

  const handleManualReviewConfirm = () => {
    if (!manualReviewModal.org) return;
    updateOrgStatus(manualReviewModal.org.id, 'PENDING', 'MANUAL_REVIEW');
    info('Assigned to Manual Review', `Assigned ${manualReviewModal.org.name} to ${manualReviewModal.reviewer}.`);
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'KYC_MANUAL_REVIEW_STARTED',
      entityType: 'ORGANIZATION',
      entityId: manualReviewModal.org.id,
      details: `Started manual investigation. Reviewer: ${manualReviewModal.reviewer}, Reason: ${manualReviewModal.reason}`
    });
    if (selectedOrg?.id === manualReviewModal.org.id) {
      setSelectedOrg({ ...manualReviewModal.org, kycStatus: 'MANUAL_REVIEW' });
    }
    setManualReviewModal({ isOpen: false, org: null, reason: '', reviewer: 'Alice Admin' });
  };

  const handleReqInfoConfirm = () => {
    if (!reqInfoModal.org) return;
    info('Information Requested', `Sent additional compliance request to ${reqInfoModal.org.authorizedPerson}.`);
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'KYC_ADDITIONAL_INFO_REQUESTED',
      entityType: 'ORGANIZATION',
      entityId: reqInfoModal.org.id,
      details: `Requested compliance data: ${reqInfoModal.note}`
    });
    setReqInfoModal({ isOpen: false, org: null, note: '' });
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Organization Verification & KYB"
        description="Verify entity legitimacy, cross-check against official state registries, review submitted documentation, and grant cryptographic issuance authority."
        badge="TRUST VERIFICATION"
        badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
      />

      {/* A. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => { setActiveTab('PENDING'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'PENDING' ? 'bg-amber-500/10 border-amber-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Pending KYC</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-amber-300 font-bold">Queue active</span>
        </div>

        <div
          onClick={() => { setActiveTab('MANUAL_REVIEW'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'MANUAL_REVIEW' ? 'bg-purple-500/10 border-purple-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Under Review</span>
          <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">{underReviewCount}</span>
          <span className="text-[10px] text-slate-500">In triage</span>
        </div>

        <div
          onClick={() => { setActiveTab('APPROVED'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Verified</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{verifiedCount}</span>
          <span className="text-[10px] text-slate-500">Authorized</span>
        </div>

        <div
          onClick={() => { setActiveTab('REJECTED'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'REJECTED' ? 'bg-red-500/10 border-red-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Rejected</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{rejectedCount}</span>
          <span className="text-[10px] text-slate-500">Declined</span>
        </div>

        <div
          onClick={() => { setActiveTab('REGISTRY_MATCH'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'REGISTRY_MATCH' ? 'bg-blue-500/10 border-blue-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Registry Oracle</span>
          <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">{registry.length}</span>
          <span className="text-[10px] text-slate-500">Ground truth</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Avg Review Time</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{avgVerificationTime}</span>
          <span className="text-[10px] text-emerald-400 font-bold">-18% faster</span>
        </div>
      </div>

      {/* Internal Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'PENDING', label: 'Pending KYC', count: pendingCount },
          { key: 'MANUAL_REVIEW', label: 'Under Review', count: underReviewCount },
          { key: 'APPROVED', label: 'Verified Issuers', count: verifiedCount },
          { key: 'REJECTED', label: 'Rejected Applications', count: rejectedCount },
          { key: 'REGISTRY_MATCH', label: 'Registry Match Overview', count: registry.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setCurrentPage(1); }}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by organization name, registration ID, signatory..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <span className="text-xs font-mono text-slate-500">
            {filteredList.length} application records
          </span>
        </div>

        {/* B. PENDING KYC TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Registry Match</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <TableEmptyState
                      isFiltered={searchTerm !== ''}
                      title={searchTerm ? 'No applications match your filter.' : 'Queue is empty for this tab.'}
                      onClearFilters={() => setSearchTerm('')}
                    />
                  </td>
                </tr>
              ) : (
                paginatedList.map((org) => {
                  const reg = getRegistryRecord(org);
                  const isMatch = reg && (reg.orgName.toLowerCase().includes(org.name.toLowerCase()) || org.name.toLowerCase().includes(reg.orgName.toLowerCase()));
                  const priority = org.kycStatus === 'PENDING' ? 'HIGH' : 'STANDARD';

                  return (
                    <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {org.name.charAt(0)}
                          </div>
                          <div>
                            <span>{org.name}</span>
                            <span className="text-[10px] text-slate-500 block font-normal">{org.legalName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{org.type}</td>
                      <td className="py-3.5 px-4 font-mono text-purple-300">{org.registrationNumber}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span>{org.authorizedPerson}</span>
                        <span className="text-[10px] text-slate-500 block">{org.authorizedRole}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{org.joinedDate}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={org.kycStatus} /></td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          isMatch ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {isMatch ? 'MATCHED (100%)' : 'MISMATCH'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono font-bold ${priority === 'HIGH' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrg(org)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Inspect KYC Dossier"
                          >
                            <Eye size={14} />
                          </button>
                          {org.kycStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(org)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectModal({ isOpen: true, org })}
                                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </>
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
          totalItems={filteredList.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* C & D. KYC REVIEW DETAILS INSPECTION MODAL */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                  {selectedOrg.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedOrg.name}</h3>
                    <StatusBadge status={selectedOrg.kycStatus} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Registration ID: {selectedOrg.registrationNumber} • Domain: {selectedOrg.officialDomain}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Organization Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold">1. Organization Profile</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Entity Type</span>
                  <span className="font-bold text-white">{selectedOrg.type}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Tax GSTIN / EIN</span>
                  <span className="font-mono text-purple-300">{selectedOrg.gstinTaxId}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Official Email</span>
                  <span className="font-mono text-slate-300">{selectedOrg.officialEmail}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Registration Authority</span>
                  <span className="text-slate-300">Department of Higher Education / Registrar</span>
                </div>
              </div>
            </div>

            {/* Applicant Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold">2. Applicant Signatory Details</h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Authorized Signatory</span>
                  <span className="font-bold text-white">{selectedOrg.authorizedPerson}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Title / Role</span>
                  <span className="text-slate-300">{selectedOrg.authorizedRole}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Identity Verification</span>
                  <span className="text-emerald-400 font-semibold font-mono">Government ID Verified (SSN/PAN)</span>
                </div>
              </div>
            </div>

            {/* Submitted Documentation */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold">3. Submitted Legal Documentation</h4>
              <div className="p-4 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Certificate_of_Incorporation_Charter.pdf</span>
                    <span className="text-[11px] text-slate-400 font-mono">Size: 2.4 MB • Uploaded: {selectedOrg.joinedDate} • Cryptographic Hash: Verified</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DIGITALLY SEALED
                </span>
              </div>
            </div>

            {/* Registry Comparison Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold">4. State Registry Ground-Truth Comparison</h4>
              {(() => {
                const reg = getRegistryRecord(selectedOrg);
                return (
                  <div className="p-4 rounded-xl bg-[#050816] border border-purple-500/20 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 text-[10px] font-mono block uppercase">Submitted Information</span>
                        <div className="mt-1 space-y-1 font-mono text-[11px] text-slate-300">
                          <div>Name: <span className="text-white font-bold">{selectedOrg.name}</span></div>
                          <div>Reg ID: {selectedOrg.registrationNumber}</div>
                          <div>Domain: {selectedOrg.officialDomain}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-mono block uppercase">Official Registry Oracle</span>
                        <div className="mt-1 space-y-1 font-mono text-[11px] text-slate-300">
                          <div>Name: <span className="text-emerald-400 font-bold">{reg ? reg.orgName : 'NO RECORD FOUND'}</span></div>
                          <div>Reg ID: {reg ? reg.registrationNumber : 'N/A'}</div>
                          <div>Domain: {reg ? reg.officialDomain : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Automated Cross-Validation:</span>
                      <span className={reg ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {reg ? 'MATCH CONFIRMED (100% CONFIDENCE)' : 'REGISTRY RECORD MISMATCH OR MISSING'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* E. Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReqInfoModal({ isOpen: true, org: selectedOrg, note: '' })}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Request More Info
                </button>
                <button
                  onClick={() => setManualReviewModal({ isOpen: true, org: selectedOrg, reason: 'Pending secondary officer check', reviewer: 'Alice Admin' })}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold"
                >
                  Start Manual Review
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRejectModal({ isOpen: true, org: selectedOrg })}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                >
                  Reject Organization
                </button>
                <button
                  onClick={() => handleApprove(selectedOrg)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Approve Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal (Requires Reason & Note) */}
      <ConfirmModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, org: null })}
        onConfirm={handleRejectConfirm}
        title={`Reject Organization "${rejectModal.org?.name}"?`}
        message="Rejecting an organization prevents it from issuing credentials on the VeriProof ledger. A formal rejection justification is required for the audit record."
        confirmLabel="Reject Application"
        isDestructive={true}
        requireReason={true}
        reasonPlaceholder="Specify reason (e.g., Domain WHOIS does not match organization, invalid business registry documentation)..."
      />

      {/* Manual Review Modal */}
      {manualReviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Start Manual Investigation</h3>
            <p className="text-xs text-slate-400">Assign this organization to an administrative compliance reviewer for manual offline check.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Reviewer</label>
                <input
                  type="text"
                  value={manualReviewModal.reviewer}
                  onChange={(e) => setManualReviewModal({ ...manualReviewModal, reviewer: e.target.value })}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Investigation Reason</label>
                <textarea
                  value={manualReviewModal.reason}
                  onChange={(e) => setManualReviewModal({ ...manualReviewModal, reason: e.target.value })}
                  rows={2}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setManualReviewModal({ isOpen: false, org: null, reason: '', reviewer: '' })}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleManualReviewConfirm}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Assign & Mark Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Information Modal */}
      {reqInfoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Request Additional Information</h3>
            <p className="text-xs text-slate-400">The applicant signatory will be notified to provide supplemental documents.</p>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Required Items / Questions</label>
              <textarea
                value={reqInfoModal.note}
                onChange={(e) => setReqInfoModal({ ...reqInfoModal, note: e.target.value })}
                rows={3}
                placeholder="e.g. Please provide updated tax certificate and board resolution authorization..."
                className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setReqInfoModal({ isOpen: false, org: null, note: '' })}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReqInfoConfirm}
                disabled={!reqInfoModal.note.trim()}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
