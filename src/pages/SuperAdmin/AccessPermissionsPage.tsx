import React, { useState } from 'react';
import {
  Sliders, Shield, Users, CheckCircle, Check, X,
  AlertTriangle, RefreshCw, Save, ShieldAlert, Lock, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const AccessPermissionsPage: React.FC = () => {
  const { users, rolePermissions, updateRolePermissions } = useApp();
  const { success, info } = useToast();

  const [selectedRole, setSelectedRole] = useState<'SUPER ADMIN' | 'ISSUER' | 'VERIFIER'>('SUPER ADMIN');
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>(rolePermissions);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const permissionModules = [
    { id: 'Organization Management', label: 'Organization Management', desc: 'Manage registered entities, verification lifecycle' },
    { id: 'User Management', label: 'User Management', desc: 'Create, suspend, and view platform identities' },
    { id: 'KYC Review', label: 'KYC Review', desc: 'Inspect business registrations and legal charters' },
    { id: 'Document Issuance', label: 'Document Issuance', desc: 'Create and sign credentials with ECDSA keys' },
    { id: 'Document Revocation', label: 'Document Revocation', desc: 'Invalidate credentials with cryptographic notice' },
    { id: 'Document Verification', label: 'Document Verification', desc: 'Forensic multi-signal validation and AI analysis' },
    { id: 'Trusted Registry Access', label: 'Trusted Registry Access', desc: 'Query and cross-reference state oracle databases' },
    { id: 'Audit Trail Access', label: 'Audit Trail Access', desc: 'Read immutable SHA-256 platform logs' },
    { id: 'Reports Access', label: 'Reports Access', desc: 'Generate system intelligence and compliance exports' },
    { id: 'System Settings', label: 'System Settings', desc: 'Configure platform security, crypto parameters' },
    { id: 'Security Monitoring', label: 'Security Monitoring', desc: 'View live threat logs and tamper alerts' },
    { id: 'Export Data', label: 'Export Data', desc: 'Download CSV and PDF reports with forensic evidence' },
  ];

  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'] as const;

  const currentRolePerms = localPermissions[selectedRole] || {};

  const handleToggle = (module: string, action: string) => {
    if (selectedRole === 'SUPER ADMIN') {
      info('Protected Policy', 'Super Admin privileges are root-enforced to prevent administrative lockout.');
      return;
    }
    const key = `${module}_${action}`;
    const updated = {
      ...currentRolePerms,
      [key]: !currentRolePerms[key]
    };
    setLocalPermissions({
      ...localPermissions,
      [selectedRole]: updated
    });
    setHasChanges(true);
  };

  const handleSaveClick = () => {
    setConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    updateRolePermissions(selectedRole, localPermissions[selectedRole]);
    setHasChanges(false);
    setConfirmModalOpen(false);
    success('Permissions Saved', `Role policy for ${selectedRole} updated and recorded in the audit trail.`);
  };

  const handleReset = () => {
    setLocalPermissions(rolePermissions);
    setHasChanges(false);
  };

  // User count per role
  const superAdminCount = users.filter(u => u.role === 'SUPER ADMIN').length;
  const issuerCount = users.filter(u => u.role === 'ISSUER').length;
  const verifierCount = users.filter(u => u.role === 'VERIFIER').length;

  const activePermsCount = Object.values(currentRolePerms).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Access & Permissions Control"
        description="Role-based access control matrix (RBAC). Configure granular capabilities, protect administrative rights, and audit security policy modifications."
        badge="ROLE-BASED ACCESS CONTROL"
        badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
        actions={
          hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Reset
              </button>
              <button
                onClick={handleSaveClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          )
        }
      />

      {/* A. ROLE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Super Admin */}
        <div
          onClick={() => setSelectedRole('SUPER ADMIN')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'SUPER ADMIN'
              ? 'bg-purple-500/10 border-purple-500/50 shadow-xl'
              : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield size={20} />
            </div>
            <StatusBadge status="ACTIVE" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">Super Admin</h3>
          <p className="text-xs text-slate-400 mt-0.5">Platform governance, cryptosystem root authorities, security override</p>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs font-mono">
            <span className="text-slate-400">{superAdminCount} assigned users</span>
            <span className="text-purple-400 font-bold">72 / 72 Rights</span>
          </div>
        </div>

        {/* Issuer */}
        <div
          onClick={() => setSelectedRole('ISSUER')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'ISSUER'
              ? 'bg-blue-500/10 border-blue-500/50 shadow-xl'
              : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users size={20} />
            </div>
            <StatusBadge status="ACTIVE" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">Issuer</h3>
          <p className="text-xs text-slate-400 mt-0.5">Accredited institutions authorized to sign & issue verified credentials</p>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs font-mono">
            <span className="text-slate-400">{issuerCount} assigned users</span>
            <span className="text-blue-400 font-bold">28 / 72 Rights</span>
          </div>
        </div>

        {/* Verifier */}
        <div
          onClick={() => setSelectedRole('VERIFIER')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedRole === 'VERIFIER'
              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-xl'
              : 'bg-[#0B1020]/90 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CheckCircle size={20} />
            </div>
            <StatusBadge status="ACTIVE" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">Verifier</h3>
          <p className="text-xs text-slate-400 mt-0.5">Employers, background checks, and public automated verification nodes</p>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs font-mono">
            <span className="text-slate-400">{verifierCount} assigned users</span>
            <span className="text-cyan-400 font-bold">14 / 72 Rights</span>
          </div>
        </div>
      </div>

      {/* C. ROLE DETAILS HEADER */}
      <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-500 text-[10px] font-mono uppercase block">Active Selected Policy</span>
          <span className="text-base font-bold text-white">{selectedRole}</span>
          <span className="text-slate-400 block mt-0.5">
            {selectedRole === 'SUPER ADMIN'
              ? 'Protected root governance role. Permissions cannot be demoted to prevent administrative deadlocks.'
              : 'Institutional access level. Permissions can be customized below.'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Granted Rights:</span>
            <span className="text-purple-300 font-bold">{activePermsCount} / 72</span>
          </div>
          <div>
            <span className="text-slate-500 block">Last Updated:</span>
            <span className="text-slate-300">Oct 08, 2026</span>
          </div>
          <div>
            <span className="text-slate-500 block">Updated By:</span>
            <span className="text-slate-300">Alice Admin</span>
          </div>
        </div>
      </div>

      {/* B. PERMISSION MATRIX TABLE */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Granular Permission Matrix</h3>
            <p className="text-[11px] text-slate-400">Enforce capabilities across View, Create, Edit, Delete, Approve, and Export</p>
          </div>
          {selectedRole === 'SUPER ADMIN' && (
            <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
              <Lock size={11} />
              ROOT PROTECTED
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Permission Module</th>
                {actions.map((act) => (
                  <th key={act} className="py-3 px-3 text-center uppercase">
                    {act}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissionModules.map((mod) => (
                <tr key={mod.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div>
                      <span>{mod.label}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">{mod.desc}</span>
                    </div>
                  </td>
                  {actions.map((act) => {
                    const key = `${mod.id}_${act}`;
                    const isChecked = !!currentRolePerms[key];
                    return (
                      <td key={act} className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={selectedRole === 'SUPER ADMIN'}
                          onChange={() => handleToggle(mod.id, act)}
                          className={`w-4 h-4 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 ${
                            selectedRole === 'SUPER ADMIN' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* D. PERMISSION CHANGE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmSave}
        title={`Confirm Permission Changes for "${selectedRole}"?`}
        message="Updating access controls modifies security policies across all assigned users immediately. This change will be cryptographically logged to the platform audit trail."
        confirmLabel="Save & Log to Audit"
        isDestructive={false}
        requireReason={false}
      />
    </div>
  );
};
