import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, ShieldAlert,
  Building2, ArrowRight, Upload, Files,
  ShieldCheck, Award, Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import StarBorder from '../../components/ui/StarBorder';

export const IssuerOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    documents,
    organizations,
    documentRegistryTotal,
    documentRegistryActiveTotal,
    documentRegistryRevokedTotal,
    documentRegistryLoading,
    documentRegistryError,
  } = useApp();

  // Authoritative organization matching
  const currentOrg = useMemo(() => {
    return (
      organizations.find(
        (org) =>
          (user?.organizationId && String(org.id) === String(user.organizationId)) ||
          (user?.organization && org.name.toLowerCase() === user.organization.toLowerCase()) ||
          (user?.organization && org.legalName.toLowerCase() === user.organization.toLowerCase())
      ) ||
      (organizations.length > 0 ? organizations[0] : undefined)
    );
  }, [organizations, user]);

  // Documents belonging to this issuer's organization
  const orgDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (!currentOrg) return true;
      return (
        doc.issuerOrg.toLowerCase() === currentOrg.name.toLowerCase() ||
        doc.issuerId === currentOrg.id ||
        (user?.role === 'issuer' && doc.issuerName.toLowerCase() === user?.name?.toLowerCase())
      );
    });
  }, [documents, currentOrg, user]);

  // Section A: Summary metrics
  const totalDocs = documentRegistryTotal;
  const activeDocs = documentRegistryActiveTotal;
  const pendingDocs = orgDocuments.filter(
    (d) => (d.status as string) === 'pending' || (d.status as string) === 'suspended'
  ).length;
  const revokedDocs = documentRegistryRevokedTotal;

  // Section B: Document Type Distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Degree: 0,
      Certificate: 0,
      License: 0,
      Marksheet: 0,
      'Experience Letter': 0,
      'Offer Letter': 0,
      Other: 0
    };

    orgDocuments.forEach((doc) => {
      const t = (doc.documentType || '').toLowerCase();
      if (t.includes('degree')) counts['Degree']++;
      else if (t.includes('cert')) counts['Certificate']++;
      else if (t.includes('lic')) counts['License']++;
      else if (t.includes('mark')) counts['Marksheet']++;
      else if (t.includes('exp')) counts['Experience Letter']++;
      else if (t.includes('offer')) counts['Offer Letter']++;
      else counts['Other']++;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.count > 0 || orgDocuments.length === 0);
  }, [orgDocuments]);

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#64748B'];

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Issuer Operations Overview"
        description="Comprehensive summary of digital credentials issued, active cryptographic records, and organization accreditation."
        badge="CANONICAL ISSUER CONSOLE"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/issuer/issue')}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
            >
              <FileText size={14} />
              <span>Issue Document</span>
            </button>
            <button
              onClick={() => navigate('/issuer/bulk')}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>Bulk Registration</span>
            </button>
          </div>
        }
      />

      {documentRegistryError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{documentRegistryError}</div>}
      {documentRegistryLoading && <div role="status" className="text-xs text-slate-400">Loading registry-backed document metrics...</div>}

      {/* SECTION A: DOCUMENT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <StarBorder
          as="div"
          className="w-full h-full"
          innerClassName="p-5 flex flex-col justify-between relative overflow-hidden group"
          color="#8b5cf6"
          speed="6s"
          backgroundColor="#0B1020"
          borderColor="rgba(139, 92, 246, 0.2)"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FileText size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              ORG REPOSITORY
            </span>
          </div>
          <h4 className="text-3xl font-black text-white font-mono tracking-tight">{totalDocs}</h4>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Total Documents</p>
          <span className="text-[11px] text-slate-500 mt-2">All registered organizational credentials</span>
        </StarBorder>

        {/* Active Documents */}
        <StarBorder
          as="div"
          className="w-full h-full"
          innerClassName="p-5 flex flex-col justify-between relative overflow-hidden group"
          color="#10b981"
          speed="6s"
          backgroundColor="#0B1020"
          borderColor="rgba(16, 185, 129, 0.2)"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LEDGER VERIFIED
            </span>
          </div>
          <h4 className="text-3xl font-black text-emerald-400 font-mono tracking-tight">{activeDocs}</h4>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Active Documents</p>
          <span className="text-[11px] text-slate-500 mt-2">Tamper-proof & authoritative in registry</span>
        </StarBorder>

        {/* Pending Documents */}
        <StarBorder
          as="div"
          className="w-full h-full"
          innerClassName="p-5 flex flex-col justify-between relative overflow-hidden group"
          color="#f59e0b"
          speed="6s"
          backgroundColor="#0B1020"
          borderColor="rgba(245, 158, 11, 0.2)"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              IN FLIGHT
            </span>
          </div>
          <h4 className="text-3xl font-black text-amber-400 font-mono tracking-tight">{pendingDocs}</h4>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Pending Documents</p>
          <span className="text-[11px] text-slate-500 mt-2">Awaiting workflow or signature completion</span>
        </StarBorder>

        {/* Revoked Documents */}
        <StarBorder
          as="div"
          className="w-full h-full"
          innerClassName="p-5 flex flex-col justify-between relative overflow-hidden group"
          color="#ef4444"
          speed="6s"
          backgroundColor="#0B1020"
          borderColor="rgba(239, 68, 68, 0.2)"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              REVOKED
            </span>
          </div>
          <h4 className="text-3xl font-black text-red-400 font-mono tracking-tight">{revokedDocs}</h4>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Revoked Documents</p>
          <span className="text-[11px] text-slate-500 mt-2">Officially revoked & marked invalid</span>
        </StarBorder>
      </div>

      {/* SECTION B & SECTION C: DISTRIBUTION & ORGANIZATION INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section B: Document Type Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award size={16} className="text-violet-400" />
                Document Type Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of issued credentials across registered document classifications
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {totalDocs} total record{totalDocs === 1 ? '' : 's'}
            </span>
          </div>

          {totalDocs === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Info size={24} className="mx-auto text-slate-500" />
              <p className="text-sm text-slate-300 font-semibold">No Document Records Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No credentials have been registered under this organization yet. Click Issue Document or Bulk Registration to start.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#070B19',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Structured breakdown pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                {typeDistribution.map((item, idx) => (
                  <div key={item.name} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-xs text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section C: Organization Information (1 col) */}
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 size={16} className="text-violet-400" />
                Organization Profile
              </h3>
              <StatusBadge status={currentOrg?.status || 'ACTIVE'} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Organization Name</span>
                <p className="text-sm font-bold text-white mt-0.5">{currentOrg?.name || 'Authorized Entity'}</p>
                <p className="text-[11px] text-slate-400">{currentOrg?.legalName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Organization Type</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{currentOrg?.type || 'Enterprise'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Issuer ID</span>
                  <span className="font-mono text-violet-300 mt-0.5 block">{currentOrg?.id || (user?.organizationId ? String(user.organizationId) : 'N/A')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">KYC / Verification Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={currentOrg?.kycStatus || 'APPROVED'} />
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <ShieldCheck size={12} /> Super Admin Validated
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Accredited by Platform Governance Authority. Legal registration #{currentOrg?.registrationNumber || 'N/A'}.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Authorized Representative</span>
                <p className="font-semibold text-slate-200 mt-0.5">{user?.name || currentOrg?.authorizedPerson || 'Issuer Admin'}</p>
                <p className="text-[11px] text-slate-400">{user?.email || currentOrg?.officialEmail}</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 text-[11px] text-slate-400 flex items-start gap-2">
            <Info size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <span>
              Organization verification records are immutable and governed by the Super Admin authority.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION D: QUICK ACTIONS */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/issuer/issue')}
            className="p-4 rounded-xl bg-[#070B19] border border-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                  Issue Document
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign & register an individual credential
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>

          <div
            onClick={() => navigate('/issuer/bulk')}
            className="p-4 rounded-xl bg-[#070B19] border border-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <Upload size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  Bulk Registration
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Process batch marksheets or certificates
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>

          <div
            onClick={() => navigate('/issuer/documents')}
            className="p-4 rounded-xl bg-[#070B19] border border-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Files size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  View Documents
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage, filter, and inspect issued records
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuerOverviewPage;
