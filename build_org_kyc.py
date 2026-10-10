import os

src_dir = r"c:\Users\hp\Downloads\VeriProof\src"
sa_dir = os.path.join(src_dir, 'pages', 'SuperAdmin')
ui_dir = os.path.join(src_dir, 'components', 'ui')

# 1. CREATE STATUS BADGE COMPONENT
status_badge_content = """import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();
  
  let colorClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  
  if (['VERIFIED', 'APPROVED', 'ACTIVE'].includes(s)) {
    colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (['PENDING', 'MANUAL REVIEW', 'WARNING'].includes(s)) {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (['REJECTED', 'SUSPENDED', 'CRITICAL', 'TAMPERED'].includes(s)) {
    colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (['SUSPICIOUS'].includes(s)) {
    colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border ${colorClass}`}>
      {s}
    </span>
  );
};
"""
with open(os.path.join(ui_dir, 'StatusBadge.tsx'), 'w', encoding='utf-8') as f:
    f.write(status_badge_content)

# 2. CREATE ORGANIZATIONS PAGE
org_content = """import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Eye, Check, XCircle, Play } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

const MOCK_ORGS = [
  { id: 'ORG-001', name: 'Global Tech University', type: 'Education', role: 'Issuer', kyc: 'VERIFIED', status: 'ACTIVE', date: '2026-09-12', activity: '2 hrs ago' },
  { id: 'ORG-002', name: 'Apex Corp', type: 'Enterprise', role: 'Verifier', kyc: 'VERIFIED', status: 'ACTIVE', date: '2026-09-14', activity: '5 mins ago' },
  { id: 'ORG-003', name: 'National Medical Board', type: 'Government', role: 'Issuer', kyc: 'PENDING', status: 'PENDING', date: '2026-10-01', activity: '1 day ago' },
  { id: 'ORG-004', name: 'Fake University Inc', type: 'Education', role: 'Issuer', kyc: 'REJECTED', status: 'SUSPENDED', date: '2026-08-22', activity: '1 month ago' },
];

const Organizations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Organizations</h1>
          <p className="text-sm text-slate-400 mt-1">Manage platform trust entities and operational status.</p>
        </div>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-xl transition-colors">
          + Add Organization
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#0B1020]/80 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          {['All', 'Pending', 'Verified', 'Suspended', 'Rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID, Name..." 
              className="pl-9 pr-4 py-1.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 w-full sm:w-64"
            />
          </div>
          <button className="p-1.5 bg-[#050816] border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#0B1020]/90 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#050816]/50">
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">ID</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Organization</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Type / Role</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">KYC Status</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Account</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Date</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_ORGS.map(org => (
                <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-xs font-mono text-slate-300">{org.id}</td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-white">{org.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-300">{org.type}</div>
                    <div className="text-[10px] text-purple-400 font-mono mt-0.5">{org.role}</div>
                  </td>
                  <td className="p-4"><StatusBadge status={org.kyc} /></td>
                  <td className="p-4"><StatusBadge status={org.status} /></td>
                  <td className="p-4 text-xs text-slate-400">{org.date}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-purple-400 bg-white/5 rounded-md transition-colors" title="View"><Eye size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 rounded-md transition-colors" title="Approve"><Check size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 rounded-md transition-colors" title="Suspend"><XCircle size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Organizations;
"""
with open(os.path.join(sa_dir, 'Organizations.tsx'), 'w', encoding='utf-8') as f:
    f.write(org_content)

# 3. CREATE KYC/KYB PAGE
kyc_content = """import React from 'react';
import { Search, CheckCircle, AlertTriangle, Shield, Check, X, Eye } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

const KYBDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">KYC / KYB Review</h1>
          <p className="text-sm text-slate-400 mt-1">Verify organization identities against the mock registry.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue */}
        <div className="lg:col-span-1 bg-[#0B1020]/90 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col h-[700px]">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">Pending Reviews (3)</h3>
          
          <div className="space-y-3 overflow-y-auto pr-2">
            {[
              { id: 'KYC-892', name: 'National Medical Board', type: 'Government', date: '2 hrs ago', active: true },
              { id: 'KYC-891', name: 'Fintech Solutions Ltd', type: 'Enterprise', date: '5 hrs ago', active: false },
              { id: 'KYC-890', name: 'Global Tech University', type: 'Education', date: '1 day ago', active: false },
            ].map(item => (
              <div key={item.id} className={`p-4 rounded-xl border cursor-pointer transition-all ${
                item.active 
                ? 'bg-[#0E152D] border-purple-500/40 shadow-lg shadow-purple-500/10' 
                : 'bg-[#050816]/50 border-white/5 hover:border-white/10'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-purple-400 font-bold">{item.id}</span>
                  <span className="text-[10px] text-slate-500">{item.date}</span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{item.type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Review Panel */}
        <div className="lg:col-span-2 bg-[#0B1020]/90 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white">National Medical Board</h2>
                <StatusBadge status="MANUAL REVIEW" />
              </div>
              <p className="text-xs text-slate-400 font-mono">Submission ID: KYC-892 • Government • Submitted Oct 08, 2026</p>
            </div>
            <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white flex items-center gap-2 hover:bg-white/10 transition-colors">
              <Eye size={14} /> View Doc
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">Submitted Data</h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Registration Number', value: 'GOV-IND-2026-X992' },
                  { label: 'GSTIN / Identifier', value: '29ABCDE1234F1Z5' },
                  { label: 'Official Domain', value: 'nmb.gov.in' },
                  { label: 'Official Email', value: 'admin@nmb.gov.in' },
                  { label: 'Authorized Person', value: 'Dr. Sarah Connor' },
                ].map(field => (
                  <div key={field.label}>
                    <div className="text-[10px] text-slate-500 font-medium mb-0.5">{field.label}</div>
                    <div className="text-sm text-white font-medium">{field.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Verification Engine Signals</h3>
              
              <div className="space-y-2">
                {[
                  { label: 'Registry Record Found', status: 'MATCH', icon: <CheckCircle size={14} className="text-emerald-400" /> },
                  { label: 'Registration Number Match', status: 'MATCH', icon: <CheckCircle size={14} className="text-emerald-400" /> },
                  { label: 'Organization Name Match', status: 'MATCH', icon: <CheckCircle size={14} className="text-emerald-400" /> },
                  { label: 'GSTIN Match', status: 'MISMATCH', icon: <AlertTriangle size={14} className="text-amber-400" /> },
                  { label: 'Document OCR Match', status: 'MATCH', icon: <CheckCircle size={14} className="text-emerald-400" /> },
                  { label: 'Domain Verified', status: 'MATCH', icon: <CheckCircle size={14} className="text-emerald-400" /> },
                ].map((signal, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#050816] border border-white/5">
                    <div className="flex items-center gap-2">
                      {signal.icon}
                      <span className="text-xs text-slate-300">{signal.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${signal.status === 'MATCH' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {signal.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 flex flex-wrap gap-3">
            <button className="flex-1 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Check size={16} /> Approve Organization
            </button>
            <button className="flex-1 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Shield size={16} /> Put Under Review
            </button>
            <button className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              <X size={16} /> Reject Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYBDashboard;
"""
with open(os.path.join(sa_dir, 'KYC.tsx'), 'w', encoding='utf-8') as f:
    f.write(kyc_content)

# 4. UPDATE APP.TSX
app_path = os.path.join(src_dir, 'App.tsx')
with open(app_path, 'r', encoding='utf-8') as f:
    app_code = f.read()

import_routes = """import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin';
import Organizations from './pages/SuperAdmin/Organizations';
import KYC from './pages/SuperAdmin/KYC';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';"""

app_code = app_code.replace("""import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';""", import_routes)

route_def = """<Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organizations" element={<Organizations />} />
              <Route path="/super-admin/kyc" element={<KYC />} />"""

app_code = app_code.replace('<Route path="/super-admin" element={<SuperAdminDashboard />} />', route_def)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Created Organizations and KYC pages.")
