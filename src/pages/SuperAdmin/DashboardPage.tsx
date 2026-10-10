import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, UserCheck, Shield, ShieldAlert,
  CheckCircle, ArrowRight, Activity, FileText,
  AlertTriangle, Check, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';
import StarBorder from '../../components/ui/StarBorder';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    organizations,
    documents,
    documentRegistryActiveTotal,
    documentRegistryLoading,
    documentRegistryError,
    securityEvents,
    updateOrgStatus,
    resolveSecurityFlag
  } = useApp();
  const { success, warning } = useToast();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'resolveSec';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'approve',
    id: '',
    name: ''
  });

  const pendingKycList = organizations.filter(o => o.kycStatus === 'PENDING');
  const activeThreatsList = securityEvents.filter(e => e.status === 'ACTIVE');
  const activeDocsCount = documentRegistryActiveTotal;
  const flaggedDocsCount = 'Not tracked';

  const handleOpenAction = (type: 'approve' | 'reject' | 'resolveSec', id: string, name: string) => {
    setConfirmModal({ isOpen: true, type, id, name });
  };

  const handleConfirmAction = (reason?: string) => {
    if (confirmModal.type === 'approve') {
      updateOrgStatus(confirmModal.id, 'ACTIVE', 'APPROVED');
      success('KYB Approved', `Organization ${confirmModal.name} is now verified and active.`);
    } else if (confirmModal.type === 'reject') {
      updateOrgStatus(confirmModal.id, 'SUSPENDED', 'REJECTED');
      warning('KYB Rejected', `Organization ${confirmModal.name} has been rejected. Reason: ${reason || 'Failed criteria'}`);
    } else if (confirmModal.type === 'resolveSec') {
      resolveSecurityFlag(confirmModal.id, reason || 'Investigated and marked as mitigated by Admin');
      success('Security Alert Resolved', `Incident ${confirmModal.id} has been marked as resolved.`);
    }
    setConfirmModal({ isOpen: false, type: 'approve', id: '', name: '' });
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Super Admin Dashboard"
        description="Live cryptographic posture, real-time threat detection, and pending organizational governance queues."
        badge="REAL-TIME MONITOR"
        badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        actions={
          <button
            onClick={() => navigate('/admin/overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors"
          >
            <span>Detailed System Overview</span>
            <ArrowRight size={14} />
          </button>
        }
      />

      {documentRegistryError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{documentRegistryError}</div>}
      {documentRegistryLoading && <div role="status" className="text-xs text-slate-400">Loading registry-backed document metrics...</div>}

      {/* 4 Primary Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/admin/issuers')} className="cursor-pointer">
          <StatCard
            title="Registered Organizations"
            value={organizations.length}
            icon={<Building size={20} />}
            trend={`${organizations.filter(o => o.status === 'ACTIVE').length} Active`}
            trendUp={true}
          />
        </div>
        <div onClick={() => navigate('/admin/document-oversight')} className="cursor-pointer">
          <StatCard
            title="Active Issued Documents"
            value={activeDocsCount}
            icon={<Shield size={20} />}
            trend="100% ECDSA Signed"
            trendUp={true}
          />
        </div>
        <div onClick={() => navigate('/admin/organization-verification')} className="cursor-pointer">
          <StatCard
            title="Pending KYB Requests"
            value={pendingKycList.length}
            icon={<UserCheck size={20} />}
            trend={pendingKycList.length > 0 ? `${pendingKycList.length} Action Needed` : 'All Verified'}
            trendUp={pendingKycList.length === 0}
          />
        </div>
        <div onClick={() => navigate('/admin/document-oversight')} className="cursor-pointer">
          <StatCard
            title="Active Security Incidents"
            value={activeThreatsList.length}
            icon={<ShieldAlert size={20} />}
            trend={activeThreatsList.length > 0 ? `${activeThreatsList.length} Critical Flag` : 'Zero Threat'}
            trendUp={activeThreatsList.length === 0}
          />
        </div>
      </div>

      {/* Quick Jump / Critical Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StarBorder
          as="div"
          className="w-full cursor-pointer"
          innerClassName="p-4 flex items-center justify-between group"
          color="#f59e0b"
          speed="7s"
          backgroundColor="#0B1020"
          borderColor="rgba(245, 158, 11, 0.2)"
          onClick={() => navigate('/admin/organization-verification')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <UserCheck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                Organization KYC Verification
              </h4>
              <p className="text-[11px] text-slate-400">{pendingKycList.length} awaiting manual/registry validation</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </StarBorder>

        <StarBorder
          as="div"
          className="w-full cursor-pointer"
          innerClassName="p-4 flex items-center justify-between group"
          color="#ef4444"
          speed="7s"
          backgroundColor="#0B1020"
          borderColor="rgba(239, 68, 68, 0.2)"
          onClick={() => navigate('/admin/document-oversight')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert size={18} />
            </div>
            <div>
                <h4 className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                Document Registry Oversight
              </h4>
              <p className="text-[11px] text-slate-400">{flaggedDocsCount} forensic flags from registry data</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
        </StarBorder>

        <StarBorder
          as="div"
          className="w-full cursor-pointer"
          innerClassName="p-4 flex items-center justify-between group"
          color="#8b5cf6"
          speed="7s"
          backgroundColor="#0B1020"
          borderColor="rgba(139, 92, 246, 0.2)"
          onClick={() => navigate('/admin/audit-trail')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Immutable Audit Trail
              </h4>
              <p className="text-[11px] text-slate-400">SHA-256 tamper-evident platform records</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </StarBorder>
      </div>

      {/* Main Split: Pending KYB Queue (Left) & Real-Time Incident Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending KYB Queue */}
        <div className="lg:col-span-7 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck size={16} className="text-amber-400" />
              <span>Pending KYB Verification Queue</span>
            </h3>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {pendingKycList.length} PENDING
            </span>
          </div>

          {pendingKycList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <CheckCircle size={28} className="text-emerald-400" />
              <p className="font-medium text-slate-300">All organization applications have been reviewed.</p>
              <p className="text-[11px] text-slate-500">Platform trust status is currently optimal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingKycList.map((org) => (
                <div
                  key={org.id}
                  className="p-4 rounded-xl bg-[#050816] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{org.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        {org.type}
                      </span>
                      <StatusBadge status={org.kycStatus} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Reg ID: <span className="font-mono text-purple-300">{org.registrationNumber}</span> • Signatory: {org.authorizedPerson}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Domain: {org.officialDomain} • Tax ID: {org.gstinTaxId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => handleOpenAction('approve', org.id, org.name)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Check size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleOpenAction('reject', org.id, org.name)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Security Feed Snapshot */}
        <div className="lg:col-span-5 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400" />
              <span>Cryptographic Threat Log & Incidents</span>
            </h3>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              REAL-TIME
            </span>
          </div>

          <div className="space-y-3">
            {securityEvents.slice(0, 5).map((evt) => (
              <div key={evt.id} className="p-3.5 rounded-xl bg-[#050816] border border-white/5 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] font-bold ${evt.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                    {evt.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={evt.status} />
                    <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{evt.details}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-slate-500">
                  <span>Source: {evt.ipAddress}</span>
                  {evt.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleOpenAction('resolveSec', evt.id, evt.type)}
                      className="text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === 'approve'
            ? `Approve Organization "${confirmModal.name}"?`
            : confirmModal.type === 'reject'
            ? `Reject KYB for "${confirmModal.name}"?`
            : `Resolve Incident ${confirmModal.id}?`
        }
        message={
          confirmModal.type === 'approve'
            ? 'Approving this organization will grant cryptographic issuance privileges and register it as an active trusted issuer.'
            : confirmModal.type === 'reject'
            ? 'Rejecting this application will suspend organizational access. A clear justification must be provided for the compliance log.'
            : 'Mark this incident as investigated and resolved in the platform security monitor.'
        }
        confirmLabel={
          confirmModal.type === 'approve' ? 'Approve & Activate' : confirmModal.type === 'reject' ? 'Reject KYB' : 'Confirm Resolution'
        }
        isDestructive={confirmModal.type === 'reject'}
        requireReason={confirmModal.type === 'reject'}
        reasonPlaceholder="Specify the rejection reason (e.g., fraudulent registry mismatch, invalid license)..."
      />
    </div>
  );
};
