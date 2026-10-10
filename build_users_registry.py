import os

src_dir = r"c:\Users\hp\Downloads\VeriProof\src"
sa_dir = os.path.join(src_dir, 'pages', 'SuperAdmin')

# 1. CREATE USERS.TSX
users_content = """import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Plus, UserX, UserCheck, Edit2 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';

const MOCK_USERS = [
  { id: 'USR-001', name: 'Alice Admin', email: 'admin@veriproof.io', org: 'VeriProof Core', role: 'SUPER_ADMIN', status: 'ACTIVE', created: '2026-01-10', login: 'Just now' },
  { id: 'USR-002', name: 'Bob Issuer', email: 'bob@techuniv.edu', org: 'Global Tech University', role: 'ISSUER', status: 'ACTIVE', created: '2026-09-12', login: '2 hrs ago' },
  { id: 'USR-003', name: 'Charlie Verifier', email: 'charlie@apexcorp.com', org: 'Apex Corp', role: 'VERIFIER', status: 'PENDING', created: '2026-10-05', login: 'Never' },
  { id: 'USR-004', name: 'Eve Malicious', email: 'eve@fakeuniv.edu', org: 'Fake University Inc', role: 'ISSUER', status: 'SUSPENDED', created: '2026-08-22', login: '1 month ago' },
];

const Users: React.FC = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState(MOCK_USERS);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSuspend = (id: string) => {
    if (window.confirm("Suspending this user will prevent them from accessing VERIPROOF. Continue?")) {
      setUsers(users.map(u => u.id === id ? { ...u, status: 'SUSPENDED' } : u));
      addToast({ title: 'User Suspended', message: `User ${id} has been suspended.`, type: 'success' });
      // TODO: Add Audit Log
    }
  };

  const handleReactivate = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'ACTIVE' } : u));
    addToast({ title: 'User Reactivated', message: `User ${id} is now active.`, type: 'success' });
    // TODO: Add Audit Log
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Users & Roles</h1>
          <p className="text-sm text-slate-400 mt-1">Manage platform access, roles, and user accounts.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 bg-[#0B1020]/80 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, Email, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">User</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Organization</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Role</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Last Login</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="text-sm font-bold text-white">{user.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                    <div className="text-[10px] font-mono text-purple-400 mt-1">{user.id}</div>
                  </td>
                  <td className="p-4 text-xs text-slate-300">{user.org}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4"><StatusBadge status={user.status} /></td>
                  <td className="p-4 text-xs text-slate-400">{user.login}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-400 bg-white/5 rounded-md transition-colors" title="Edit"><Edit2 size={14} /></button>
                      {user.status === 'SUSPENDED' ? (
                        <button onClick={() => handleReactivate(user.id)} className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 rounded-md transition-colors" title="Reactivate"><UserCheck size={14} /></button>
                      ) : (
                        <button onClick={() => handleSuspend(user.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 rounded-md transition-colors" title="Suspend"><UserX size={14} /></button>
                      )}
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

export default Users;
"""
with open(os.path.join(sa_dir, 'Users.tsx'), 'w', encoding='utf-8') as f:
    f.write(users_content)

# 2. CREATE REGISTRY.TSX
registry_content = """import React, { useState } from 'react';
import { Search, Plus, Filter, Database, Edit2, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

const MOCK_REGISTRY = [
  { id: 'REG-1', regNo: 'GOV-IND-2026-X992', gstin: '29ABCDE1234F1Z5', name: 'National Medical Board', type: 'Government', status: 'ACTIVE', created: '2025-11-20' },
  { id: 'REG-2', regNo: 'EDU-CA-8821', gstin: '12XYZDE9876F2Z9', name: 'Global Tech University', type: 'Education', status: 'ACTIVE', created: '2024-03-15' },
  { id: 'REG-3', regNo: 'CORP-US-102', gstin: '33CORP1234P1Z8', name: 'Apex Corp', type: 'Enterprise', status: 'ACTIVE', created: '2023-08-10' },
];

const Registry: React.FC = () => {
  const [records, setRecords] = useState(MOCK_REGISTRY);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Prototype Registry
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-orange-500/50 bg-orange-500/10 text-orange-400 font-bold uppercase tracking-widest">Simulated Data</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            This is a mock authoritative registry dataset used for organization KYC/KYB matching. 
            Do not connect this to production databases.
          </p>
        </div>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Record
        </button>
      </div>

      <div className="bg-[#0B1020]/90 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#050816]/50">
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Reg Number</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Organization</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Identifiers</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono text-sm text-purple-400">{rec.regNo}</td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-white">{rec.name}</div>
                    <div className="text-xs text-slate-400">{rec.type}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-300">GSTIN: {rec.gstin}</td>
                  <td className="p-4"><StatusBadge status={rec.status} /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 rounded-md transition-colors"><ShieldAlert size={14} /></button>
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

export default Registry;
"""
with open(os.path.join(sa_dir, 'Registry.tsx'), 'w', encoding='utf-8') as f:
    f.write(registry_content)

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
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';"""

app_code = app_code.replace("""import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdmin';
import Organizations from './pages/SuperAdmin/Organizations';
import KYC from './pages/SuperAdmin/KYC';
import IssuerDashboard from './pages/Issuer';
import VerifierDashboard from './pages/Verifier';""", import_routes)

route_def = """<Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organizations" element={<Organizations />} />
              <Route path="/super-admin/kyc" element={<KYC />} />
              <Route path="/super-admin/users" element={<Users />} />
              <Route path="/super-admin/registry" element={<Registry />} />"""

app_code = app_code.replace("""<Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/organizations" element={<Organizations />} />
              <Route path="/super-admin/kyc" element={<KYC />} />""", route_def)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Created Users and Registry pages.")
