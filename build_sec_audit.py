import os

src_dir = r"c:\Users\hp\Downloads\VeriProof\src"
sa_dir = os.path.join(src_dir, 'pages', 'SuperAdmin')

# 1. CREATE SECURITY.TSX
security_content = """import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, AlertTriangle, Eye, Activity } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

const MOCK_EVENTS = [
  { id: 'SEC-8921', time: '10 mins ago', type: 'INVALID_SIGNATURE', severity: 'CRITICAL', actor: 'Unknown', org: 'N/A', doc: 'DOC-1024', status: 'ACTIVE' },
  { id: 'SEC-8920', time: '1 hr ago', type: 'FAILED_LOGIN', severity: 'MEDIUM', actor: 'bob@techuniv.edu', org: 'Global Tech Univ', doc: 'N/A', status: 'RESOLVED' },
  { id: 'SEC-8919', time: '3 hrs ago', type: 'HASH_MISMATCH', severity: 'HIGH', actor: 'Verifier Node 3', org: 'Apex Corp', doc: 'DOC-992', status: 'ACTIVE' },
  { id: 'SEC-8918', time: '1 day ago', type: 'UNAUTHORIZED_ACCESS', severity: 'HIGH', actor: 'eve@fakeuniv.edu', org: 'Fake Univ Inc', doc: 'DOC-100', status: 'ACTIVE' },
];

const SecurityCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ShieldAlert size={28} className="text-red-400" />
            Security Center
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Monitor and respond to platform security events, cryptographic mismatches, and unauthorized access attempts.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#0B1020]/80 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          {['All Events', 'Critical', 'High', 'Medium', 'Low'].map(tab => (
            <button
              key={tab}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'All Events' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
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
              placeholder="Search Event ID, Doc ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500/50 w-full sm:w-64"
            />
          </div>
          <button className="p-1.5 bg-[#050816] border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[#0B1020]/90 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#050816]/50">
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Event</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Type</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Severity</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Context</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_EVENTS.filter(e => e.id.toLowerCase().includes(searchTerm.toLowerCase()) || e.doc.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
                <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-mono font-bold text-red-400">{event.id}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{event.time}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-white">{event.type}</td>
                  <td className="p-4"><StatusBadge status={event.severity} /></td>
                  <td className="p-4">
                    <div className="text-xs text-slate-300"><span className="text-slate-500">Actor:</span> {event.actor}</div>
                    <div className="text-xs text-slate-300 mt-0.5"><span className="text-slate-500">Doc:</span> {event.doc}</div>
                  </td>
                  <td className="p-4"><StatusBadge status={event.status} /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md transition-colors"><Eye size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 rounded-md transition-colors"><Activity size={14} /></button>
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

export default SecurityCenter;
"""
with open(os.path.join(sa_dir, 'Security.tsx'), 'w', encoding='utf-8') as f:
    f.write(security_content)

# 2. CREATE AUDIT LOGS.TSX
audit_content = """import React, { useState } from 'react';
import { Search, Filter, FileText, Eye } from 'lucide-react';

const MOCK_AUDIT = [
  { id: 'LOG-900', time: '2026-10-08 10:15:22', actor: 'admin@veriproof.io', role: 'SUPER_ADMIN', action: 'KYC_APPROVED', entity: 'Organization', entityId: 'ORG-001', result: 'SUCCESS' },
  { id: 'LOG-899', time: '2026-10-08 09:42:11', actor: 'bob@techuniv.edu', role: 'ISSUER', action: 'DOCUMENT_ISSUED', entity: 'Document', entityId: 'DOC-1025', result: 'SUCCESS' },
  { id: 'LOG-898', time: '2026-10-08 09:30:05', actor: 'SYSTEM', role: 'SYSTEM', action: 'SECURITY_EVENT_CREATED', entity: 'SecurityEvent', entityId: 'SEC-8921', result: 'SUCCESS' },
  { id: 'LOG-897', time: '2026-10-07 14:20:00', actor: 'admin@veriproof.io', role: 'SUPER_ADMIN', action: 'USER_SUSPENDED', entity: 'User', entityId: 'USR-004', result: 'SUCCESS' },
];

const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileText size={28} className="text-purple-400" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Append-only chronological record of all important platform actions for compliance and traceability.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#0B1020]/80 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Actor, Action, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-[#050816] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 w-full sm:w-64"
            />
          </div>
          <button className="p-1.5 bg-[#050816] border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Filter size={16} /> Filter Date
          </button>
        </div>
      </div>

      <div className="bg-[#0B1020]/90 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#050816]/50">
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Timestamp</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Actor</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Action</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Entity</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Result</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_AUDIT.filter(e => e.action.toLowerCase().includes(searchTerm.toLowerCase()) || e.actor.toLowerCase().includes(searchTerm.toLowerCase()) || e.entityId.toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-mono text-slate-300">{log.time}</div>
                    <div className="text-[10px] text-purple-400 font-mono mt-1">{log.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-white">{log.actor}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.role}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-300">{log.action}</td>
                  <td className="p-4 text-xs text-slate-400">{log.entity}: <span className="text-purple-400">{log.entityId}</span></td>
                  <td className="p-4">
                    <span className={`text-[10px] font-mono font-bold ${log.result === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>{log.result}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end">
                      <button className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md transition-colors"><Eye size={14} /></button>
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

export default AuditLogs;
"""
with open(os.path.join(sa_dir, 'AuditLogs.tsx'), 'w', encoding='utf-8') as f:
    f.write(audit_content)

# 3. UPDATE APP.TSX
app_path = os.path.join(src_dir, 'App.tsx')
with open(app_path, 'r', encoding='utf-8') as f:
    app_code = f.read()

import_routes = """import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin';
import Organizations from './pages/SuperAdmin/Organizations';
import KYC from './pages/SuperAdmin/KYC';
import Users from './pages/SuperAdmin/Users';
import Registry from './pages/SuperAdmin/Registry';
import Security from './pages/SuperAdmin/Security';
import AuditLogs from './pages/SuperAdmin/AuditLogs';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';"""

app_code = app_code.replace("""import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin';
import Organizations from './pages/SuperAdmin/Organizations';
import KYC from './pages/SuperAdmin/KYC';
import Users from './pages/SuperAdmin/Users';
import Registry from './pages/SuperAdmin/Registry';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';""", import_routes)

route_def = """<Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organizations" element={<Organizations />} />
              <Route path="/super-admin/kyc" element={<KYC />} />
              <Route path="/super-admin/users" element={<Users />} />
              <Route path="/super-admin/registry" element={<Registry />} />
              <Route path="/super-admin/security" element={<Security />} />
              <Route path="/super-admin/audit-logs" element={<AuditLogs />} />"""

app_code = app_code.replace("""<Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organizations" element={<Organizations />} />
              <Route path="/super-admin/kyc" element={<KYC />} />
              <Route path="/super-admin/users" element={<Users />} />
              <Route path="/super-admin/registry" element={<Registry />} />""", route_def)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Created Security Center and Audit Logs pages.")
