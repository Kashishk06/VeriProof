import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, Users, FileText, CheckCircle, ShieldAlert,
  XCircle, Clock, TrendingUp, AlertTriangle, UserCheck,
  Shield, BarChart3, ArrowRight, Activity, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminHeader } from './components/AdminHeader';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    organizations,
    documentRegistryTotal,
    documentRegistryActiveTotal,
    documentRegistryRevokedTotal,
    documentRegistryLoading,
    documentRegistryError,
    users,
    securityEvents,
    verifications,
  } = useApp();

  // Summary Metrics computed from live backend data and state
  const totalOrgs = organizations.length;
  const totalIssuers = organizations.filter(o => o.status === 'ACTIVE').length;
  const totalUsersCount = users.length;
  const totalVerifiers = users.filter(u => u.role === 'VERIFIER').length;
  const pendingKycCount = organizations.filter(o => o.kycStatus === 'PENDING' || o.kycStatus === 'MANUAL_REVIEW').length;
  const activeThreats = securityEvents.filter(e => e.status === 'ACTIVE' || e.status === 'INVESTIGATING').length;
  const flaggedDocsCount = activeThreats > 0 ? `${activeThreats} Flagged` : '0';
  const suspendedOrgsCount = organizations.filter(o => o.status === 'SUSPENDED').length;
  const hasRegistryMetrics = !documentRegistryLoading && !documentRegistryError;
  const revokedShare = documentRegistryTotal > 0
    ? `${((documentRegistryRevokedTotal / documentRegistryTotal) * 100).toFixed(1)}% of live registry`
    : 'No registry records';

  // Dynamic Organization Type Distribution
  const typeColorMap: Record<string, string> = {
    'University': 'bg-purple-500',
    'Educational Institution': 'bg-purple-500',
    'Enterprise': 'bg-blue-500',
    'Corporate / Company': 'bg-blue-500',
    'Government': 'bg-emerald-500',
    'Government Agency': 'bg-emerald-500',
    'Training Institute': 'bg-cyan-500',
    'Financial': 'bg-amber-500',
    'Healthcare': 'bg-pink-500',
    'NGO': 'bg-indigo-500',
    'Other': 'bg-slate-500'
  };

  const orgTypeCounts = organizations.reduce<Record<string, number>>((acc, org) => {
    const t = org.type || 'Other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const orgTypeDistribution = Object.entries(orgTypeCounts).map(([type, count]) => ({
    type,
    count,
    pct: totalOrgs > 0 ? Number(((count / totalOrgs) * 100).toFixed(1)) : 0,
    color: typeColorMap[type] || 'bg-purple-500'
  }));

  // Dynamic Organization Status Distribution
  const activeOrgs = organizations.filter(o => o.status === 'ACTIVE').length;
  const pendingOrgs = organizations.filter(o => o.status === 'PENDING' || o.kycStatus === 'PENDING').length;
  const suspendedOrgs = organizations.filter(o => o.status === 'SUSPENDED').length;
  const rejectedOrgs = organizations.filter(o => o.kycStatus === 'REJECTED').length;

  const orgStatusDistribution = [
    { status: 'Active', count: activeOrgs, pct: totalOrgs > 0 ? Number(((activeOrgs / totalOrgs) * 100).toFixed(1)) : 0, color: 'bg-emerald-400' },
    { status: 'Pending', count: pendingOrgs, pct: totalOrgs > 0 ? Number(((pendingOrgs / totalOrgs) * 100).toFixed(1)) : 0, color: 'bg-amber-400' },
    { status: 'Suspended', count: suspendedOrgs, pct: totalOrgs > 0 ? Number(((suspendedOrgs / totalOrgs) * 100).toFixed(1)) : 0, color: 'bg-orange-400' },
    { status: 'Rejected', count: rejectedOrgs, pct: totalOrgs > 0 ? Number(((rejectedOrgs / totalOrgs) * 100).toFixed(1)) : 0, color: 'bg-red-400' }
  ];

  // User Demographics metrics
  const verifierUsersCount = users.filter(u => u.role === 'VERIFIER').length;
  const issuerStaffCount = users.filter(u => u.role === 'ISSUER').length;
  const superAdminCount = users.filter(u => u.role === 'SUPER ADMIN').length;
  const activeUsersCount = users.filter(u => u.accountStatus === 'ACTIVE').length;
  const suspendedUsersCount = users.filter(u => u.accountStatus === 'SUSPENDED').length;
  const revokedUsersCount = users.filter(u => u.accountStatus === 'REVOKED').length;

  // Forensic Verification Statistics
  const totalVerifAttempts = verifications.length;
  const successVerifs = verifications.filter(v => v.result === 'VERIFIED').length;
  const failedVerifs = verifications.filter(v => v.result === 'TAMPERED').length;
  const suspiciousVerifs = verifications.filter(v => v.result === 'UNVERIFIED' || v.result === 'SUSPICIOUS').length;
  const hashFailures = verifications.filter(v => v.evidenceDetails?.hashStatus === 'MISMATCH').length;
  const sigFailures = verifications.filter(v => v.evidenceDetails?.signatureStatus === 'INVALID').length;
  const verifSuccessRate = totalVerifAttempts > 0 ? `${((successVerifs / totalVerifAttempts) * 100).toFixed(1)}%` : 'N/A';

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Platform Statistical Overview"
        description="Comprehensive high-level system analytics, global registration metrics, cryptographic verification trends, and health indicators."
        badge="SYSTEM METRICS & TRENDS"
        badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
      />

      {documentRegistryError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{documentRegistryError}</div>}
      {documentRegistryLoading && <div role="status" className="text-xs text-slate-400">Loading registry-backed document metrics...</div>}

      {/* A. 10 SUMMARY CARDS (Clickable Navigation) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Executive Key Performance Indicators
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Updated real-time • Click card to navigate</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Organizations */}
          <div
            onClick={() => navigate('/admin/issuers')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Total Organizations</span>
              <Building size={16} className="text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">{totalOrgs.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
              <TrendingUp size={11} />
              <span>{activeOrgs} active entities</span>
            </div>
          </div>

          {/* 2. Total Issuers */}
          <div
            onClick={() => navigate('/admin/issuers')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Total Issuers</span>
              <Building size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">{totalIssuers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
              <TrendingUp size={11} />
              <span>Active issuer authorities</span>
            </div>
          </div>

          {/* 3. Total Users */}
          <div
            onClick={() => navigate('/admin/users')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Total Users</span>
              <Users size={16} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">{totalUsersCount.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
              <TrendingUp size={11} />
              <span>{activeUsersCount} active accounts</span>
            </div>
          </div>

          {/* 4. Total Verifiers */}
          <div
            onClick={() => navigate('/admin/users')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Total Verifiers</span>
              <CheckCircle size={16} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">{totalVerifiers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
              <TrendingUp size={11} />
              <span>Registered verifiers</span>
            </div>
          </div>

          {/* 5. Total Documents */}
          <div
            onClick={() => navigate('/admin/document-oversight')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Total Documents</span>
              <FileText size={16} className="text-pink-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">{hasRegistryMetrics ? documentRegistryTotal.toLocaleString() : 'Unavailable'}</div>
            <div className="text-[10px] text-slate-400 mt-1">Live PostgreSQL registry count</div>
          </div>

          {/* 6. Active Documents */}
          <div
            onClick={() => navigate('/admin/document-oversight')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Active Documents</span>
              <Shield size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">{hasRegistryMetrics ? documentRegistryActiveTotal.toLocaleString() : 'Unavailable'}</div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">Active registry records</div>
          </div>

          {/* 7. Pending KYC */}
          <div
            onClick={() => navigate('/admin/organization-verification')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Pending KYC</span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-2">{pendingKycCount}</div>
            <div className="text-[10px] text-amber-300 font-bold mt-1">{pendingKycCount > 0 ? 'Requires review' : 'All clear'}</div>
          </div>

          {/* 8. Flagged Documents */}
          <div
            onClick={() => navigate('/admin/document-oversight')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-orange-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Flagged Documents</span>
              <AlertTriangle size={16} className="text-orange-400" />
            </div>
            <div className="text-2xl font-black text-orange-400 font-mono mt-2">{flaggedDocsCount}</div>
            <div className="text-[10px] text-orange-300 font-bold mt-1">Active security incidents</div>
          </div>

          {/* 9. Suspended Organizations */}
          <div
            onClick={() => navigate('/admin/issuers')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-red-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Suspended Orgs</span>
              <ShieldAlert size={16} className="text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400 font-mono mt-2">{suspendedOrgsCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">{suspendedOrgsCount > 0 ? 'Policy violations' : 'No suspensions'}</div>
          </div>

          {/* 10. Revoked Documents */}
          <div
            onClick={() => navigate('/admin/document-oversight')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-red-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-[11px] font-semibold">Revoked Documents</span>
              <XCircle size={16} className="text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400 font-mono mt-2">{hasRegistryMetrics ? documentRegistryRevokedTotal.toLocaleString() : 'Unavailable'}</div>
            <div className="text-[10px] text-slate-400 mt-1">{hasRegistryMetrics ? revokedShare : 'Live registry count unavailable'}</div>
          </div>
        </div>
      </div>

      {/* B & C. ORGANIZATION & USER DETAILED STATISTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* B. Organization Statistics */}
        <div className="lg:col-span-7 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building size={16} className="text-purple-400" />
                <span>Organization Distribution & Status</span>
              </h3>
              <p className="text-[11px] text-slate-400">Classification by vertical sector and platform standing</p>
            </div>
            <span className="text-xs font-mono text-purple-300 font-bold">{totalOrgs} Entities</span>
          </div>

          {/* Types breakdown */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Sector Distribution</h4>
            {orgTypeDistribution.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-[#050816] rounded-xl border border-white/5">
                No organization sector data available.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orgTypeDistribution.map((item) => (
                  <div key={item.type} className="p-3 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate">{item.type}</span>
                      <span className="font-mono text-white">{item.count} <span className="text-slate-500 font-normal">({item.pct}%)</span></span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${Math.min(100, item.pct * 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="pt-2 border-t border-white/5 space-y-2.5">
            <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Lifecycle Status Breakdown</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {orgStatusDistribution.map((s) => (
                <div key={s.status} className="p-3 rounded-xl bg-[#050816] border border-white/5 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">{s.status}</span>
                  <span className="text-lg font-bold font-mono text-white mt-0.5 block">{s.count}</span>
                  <span className="text-[10px] font-mono text-slate-500">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C. User Statistics */}
        <div className="lg:col-span-5 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                <span>User Demographics & Roles</span>
              </h3>
              <p className="text-[11px] text-slate-400">Role assignment and identity activity state</p>
            </div>
            <span className="text-xs font-mono text-indigo-300 font-bold">{totalUsersCount} Total</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Verifier Users</span>
                <span className="text-[10px] text-slate-400">Talent screening, HR, and verification nodes</span>
              </div>
              <span className="text-base font-bold font-mono text-cyan-400">{verifierUsersCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Issuer Staff</span>
                <span className="text-[10px] text-slate-400">University registrars, enterprise leads</span>
              </div>
              <span className="text-base font-bold font-mono text-blue-400">{issuerStaffCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Super Administrators</span>
                <span className="text-[10px] text-slate-400">Root governance & security officers</span>
              </div>
              <span className="text-base font-bold font-mono text-purple-400">{superAdminCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 block">Active Users</span>
                <span className="text-[10px] text-slate-400">Accounts in active status</span>
              </div>
              <span className="text-base font-bold font-mono text-emerald-400">{activeUsersCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-400 block">Suspended Users</span>
                <span className="text-[10px] text-slate-400">Locked due to policy violations</span>
              </div>
              <span className="text-base font-bold font-mono text-red-400">{suspendedUsersCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block">Revoked Accounts</span>
                <span className="text-[10px] text-slate-400">Terminated credentials & access</span>
              </div>
              <span className="text-base font-bold font-mono text-slate-400">{revokedUsersCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* D & E. DOCUMENT & VERIFICATION CRYPTOGRAPHIC STATISTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* D. Document Statistics */}
        <div className="lg:col-span-6 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-pink-400" />
                <span>Document Issuance & Integrity Metrics</span>
              </h3>
              <p className="text-[11px] text-slate-400">Cryptographic credentials issued and verified</p>
            </div>
            <span className="text-xs font-mono text-pink-300 font-bold">{hasRegistryMetrics ? documentRegistryTotal.toLocaleString() : 0} Issued</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Documents Issued</span>
              <span className="text-lg font-bold font-mono text-white">{hasRegistryMetrics ? documentRegistryTotal.toLocaleString() : 0}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">PostgreSQL Registry</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Documents Verified</span>
              <span className="text-lg font-bold font-mono text-white">{totalVerifAttempts.toLocaleString()}</span>
              <span className="text-[10px] text-purple-400 block mt-0.5">Telemetry Checks</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Active Documents</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{hasRegistryMetrics ? documentRegistryActiveTotal.toLocaleString() : 0}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Authentic & Active</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Revoked Documents</span>
              <span className="text-lg font-bold font-mono text-red-400">{hasRegistryMetrics ? documentRegistryRevokedTotal.toLocaleString() : 0}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Marked Invalid</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Flagged Incidents</span>
              <span className="text-lg font-bold font-mono text-orange-400">{activeThreats}</span>
              <span className="text-[10px] text-orange-400 block mt-0.5">{activeThreats > 0 ? 'Requires Triage' : 'Zero Incidents'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Verification Success Rate</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{verifSuccessRate}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">High Fidelity</span>
            </div>
          </div>
        </div>

        {/* E. Verification Statistics */}
        <div className="lg:col-span-6 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <span>Forensic Verification Statistics</span>
              </h3>
              <p className="text-[11px] text-slate-400">Multi-signal mathematical and AI validation outcomes</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">{totalVerifAttempts} Checks</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Verification Attempts</span>
              <span className="text-lg font-bold font-mono text-white">{totalVerifAttempts.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Successful Verifications</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{successVerifs.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Failed Verifications</span>
              <span className="text-lg font-bold font-mono text-red-400">{failedVerifs.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Suspicious Verifications</span>
              <span className="text-lg font-bold font-mono text-amber-400">{suspiciousVerifs.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Hash Validation Failures</span>
              <span className="text-lg font-bold font-mono text-red-400">{hashFailures.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Signature Validation Failures</span>
              <span className="text-lg font-bold font-mono text-red-400">{sigFailures.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* F. OPERATIONAL POSTURE & SUMMARY */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              <span>Operational Ledger Health & Overview</span>
            </h3>
            <p className="text-[11px] text-slate-400">Live aggregated metrics across active organizations, document registries, and security telemetry</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-slate-300">Registry: {documentRegistryTotal}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Active Orgs: {activeOrgs}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Checks: {totalVerifAttempts}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2">
            <div className="text-xs font-bold text-white">Cryptographic Registry Integrity</div>
            <p className="text-[11px] text-slate-400">
              {documentRegistryTotal > 0
                ? `${documentRegistryActiveTotal} of ${documentRegistryTotal} registered documents maintain active ECDSA P-256 and SHA-256 integrity proofs.`
                : 'No registered documents currently on the ledger.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2">
            <div className="text-xs font-bold text-white">KYC / Compliance Standing</div>
            <p className="text-[11px] text-slate-400">
              {pendingKycCount > 0
                ? `${pendingKycCount} organization application(s) currently await governance authorization.`
                : 'All registered issuer organizations are fully accredited and active.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2">
            <div className="text-xs font-bold text-white">Forensic Telemetry</div>
            <p className="text-[11px] text-slate-400">
              {activeThreats > 0
                ? `${activeThreats} active security flag(s) requiring administrator investigation.`
                : 'Zero active security incidents detected across all verification nodes.'}
            </p>
          </div>
        </div>
      </div>

      {/* G. QUICK NAVIGATION CARDS */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Administrative Shortcut Consoles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/admin/organization-verification')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all hover:bg-amber-500/5 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                <UserCheck size={18} />
              </div>
              <ArrowUpRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mt-3 group-hover:text-amber-300 transition-colors">
              Review Pending KYC
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Directly inspect and grant issuance authorization</p>
          </div>

          <div
            onClick={() => navigate('/admin/document-oversight')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-red-500/40 cursor-pointer transition-all hover:bg-red-500/5 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
                <ShieldAlert size={18} />
              </div>
              <ArrowUpRight size={16} className="text-slate-500 group-hover:text-red-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mt-3 group-hover:text-red-300 transition-colors">
              View Flagged Documents
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Examine forensic anomalies and checksum drifts</p>
          </div>

          <div
            onClick={() => navigate('/admin/issuers')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:bg-purple-500/5 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Building size={18} />
              </div>
              <ArrowUpRight size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
              View Suspended Orgs
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Manage suspended or revoked issuer authorities</p>
          </div>

          <div
            onClick={() => navigate('/admin/audit-trail')}
            className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all hover:bg-emerald-500/5 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Activity size={18} />
              </div>
              <ArrowUpRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mt-3 group-hover:text-emerald-300 transition-colors">
              Recent Audit Activity
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">Verify chronological SHA-256 tamper logs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

