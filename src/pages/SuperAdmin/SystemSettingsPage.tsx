import React, { useState } from 'react';
import {
  Settings, Shield, Lock, FileText, Bell, Users,
  Save, RefreshCw, CheckCircle, AlertTriangle, Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';

export const SystemSettingsPage: React.FC = () => {
  const { systemSettings, updateSystemSettings } = useApp();
  const { success } = useToast();

  // Internal tab categories
  const [activeTab, setActiveTab] = useState<'PLATFORM' | 'SECURITY' | 'VERIFICATION' | 'DOCUMENTS' | 'NOTIFICATIONS' | 'ROLE_DEFAULTS'>('PLATFORM');
  const [formData, setFormData] = useState({ ...systemSettings });
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleConfirmSave = () => {
    updateSystemSettings(formData);
    setHasChanges(false);
    setConfirmModalOpen(false);
    success('Settings Updated', 'Platform global cryptographic parameters successfully updated and logged to audit trail.');
  };

  const handleReset = () => {
    setFormData({ ...systemSettings });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Global System & Cryptographic Settings"
        description="Configure cryptographic consensus thresholds, platform branding, forensic sensitivity, and notification delivery."
        badge="PLATFORM CONFIGURATION"
        badgeColor="bg-slate-500/10 text-slate-300 border-slate-500/20"
        actions={
          hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20"
              >
                <Save size={14} />
                <span>Save All Changes</span>
              </button>
            </div>
          )
        }
      />

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'PLATFORM', label: 'Platform Profile' },
          { key: 'SECURITY', label: 'Security & Auth Policy' },
          { key: 'VERIFICATION', label: 'Verification Engine' },
          { key: 'DOCUMENTS', label: 'Document Policies' },
          { key: 'NOTIFICATIONS', label: 'Alert Notifications' },
          { key: 'ROLE_DEFAULTS', label: 'Role Defaults' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 max-w-4xl">
        {/* A. PLATFORM SETTINGS */}
        {activeTab === 'PLATFORM' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Platform Identity & Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Platform Name</label>
                <input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => handleFieldChange('platformName', e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Support Email</label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Support Hotline</label>
                <input
                  type="text"
                  value={formData.supportContact}
                  onChange={(e) => handleFieldChange('supportContact', e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Default Platform Time Zone</label>
                <input
                  type="text"
                  value={formData.timeZone}
                  onChange={(e) => handleFieldChange('timeZone', e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Platform Description</label>
              <textarea
                value={formData.platformDescription}
                onChange={(e) => handleFieldChange('platformDescription', e.target.value)}
                rows={2}
                className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* B. SECURITY SETTINGS */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Session & Authentication Security Policy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Password Policy</label>
                <input
                  type="text"
                  value={formData.passwordPolicy}
                  onChange={(e) => handleFieldChange('passwordPolicy', e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  value={formData.minPasswordLength}
                  onChange={(e) => handleFieldChange('minPasswordLength', Number(e.target.value))}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleFieldChange('sessionTimeout', Number(e.target.value))}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Maximum Login Attempts Before Lockout</label>
                <input
                  type="number"
                  value={formData.maxLoginAttempts}
                  onChange={(e) => handleFieldChange('maxLoginAttempts', Number(e.target.value))}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block text-xs">Multi-Factor Authentication (MFA / 2FA)</span>
                <span className="text-[11px] text-slate-400">Enforce hardware token or TOTP for all Issuer and Admin sessions</span>
              </div>
              <input
                type="checkbox"
                checked={formData.mfaEnforced}
                onChange={(e) => handleFieldChange('mfaEnforced', e.target.checked)}
                className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* C. VERIFICATION SETTINGS */}
        {activeTab === 'VERIFICATION' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Verification Engine & Consensus Thresholds</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">TrustScore Minimum Threshold (%)</label>
                <input
                  type="number"
                  value={formData.trustScoreThreshold}
                  onChange={(e) => handleFieldChange('trustScoreThreshold', Number(e.target.value))}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Manual Review Trigger Score (&lt; %)</label>
                <input
                  type="number"
                  value={formData.manualReviewThreshold}
                  onChange={(e) => handleFieldChange('manualReviewThreshold', Number(e.target.value))}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Enforce SHA-256 Pre-Hash Validation</span>
                  <span className="text-[11px] text-slate-400">Reject documents with byte divergence from registered hash</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hashValidationRequired}
                  onChange={(e) => handleFieldChange('hashValidationRequired', e.target.checked)}
                  className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Enforce ECDSA secp256k1 Digital Signature</span>
                  <span className="text-[11px] text-slate-400">Require valid cryptographic signature from registered issuer public key</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.digitalSignatureRequired}
                  onChange={(e) => handleFieldChange('digitalSignatureRequired', e.target.checked)}
                  className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Enforce QR Code Cryptographic Payload</span>
                  <span className="text-[11px] text-slate-400">Embed verifiable URL signed token into rendered visual certificates</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.qrValidationRequired}
                  onChange={(e) => handleFieldChange('qrValidationRequired', e.target.checked)}
                  className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* D. DOCUMENT SETTINGS */}
        {activeTab === 'DOCUMENTS' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Document File & Ledger Retention Policies</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Max Upload File Size (MB)</label>
                <input
                  type="number"
                  value={formData.maxFileSizeMb}
                  onChange={(e) => handleFieldChange('maxFileSizeMb', Number(e.target.value))}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Default Document Status Upon Issuance</label>
                <select
                  value={formData.defaultDocumentStatus}
                  onChange={(e) => handleFieldChange('defaultDocumentStatus', e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Immediate Validation)</option>
                  <option value="PENDING">PENDING (Secondary Review)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Cryptographic Retention Policy</label>
              <input
                type="text"
                value={formData.documentRetentionPolicy}
                onChange={(e) => handleFieldChange('documentRetentionPolicy', e.target.value)}
                className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* E. NOTIFICATION SETTINGS */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Platform Notification & Dispatch Channels</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">KYB Application Alerts</span>
                  <span className="text-[11px] text-slate-400">Immediate alert when new organization submits registration</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.kycNotifications}
                  onChange={(e) => handleFieldChange('kycNotifications', e.target.checked)}
                  className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Security & Cryptographic Incident Alerts</span>
                  <span className="text-[11px] text-slate-400">Urgent broadcast on hash tampering or signature rejection</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.securityAlerts}
                  onChange={(e) => handleFieldChange('securityAlerts', e.target.checked)}
                  className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Email Dispatch Gateway</span>
                  <span className="text-[11px] text-slate-400">Send cryptographic digest summaries to administrative email</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleFieldChange('emailNotifications', e.target.checked)}
                  className="w-5 h-5 rounded bg-[#050816] border border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* F. ROLE DEFAULTS */}
        {activeTab === 'ROLE_DEFAULTS' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Default Permissions Policy for New Roles</h3>
            <div className="p-4 rounded-xl bg-[#050816] border border-purple-500/20 space-y-2">
              <span className="font-bold text-purple-400 block">Super Admin Default</span>
              <p className="text-slate-300 text-[11px]">
                Super Admin permissions are root-protected and cannot be modified or downgraded.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2">
              <span className="font-bold text-blue-400 block">Issuer Organization Default</span>
              <p className="text-slate-400 text-[11px]">
                Default privileges: Issue Credentials, Invalidate/Revoke Credentials, Inspect Entity Analytics, Query Registry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050816] border border-white/5 space-y-2">
              <span className="font-bold text-cyan-400 block">Verifier Default</span>
              <p className="text-slate-400 text-[11px]">
                Default privileges: Submit Cryptographic Verification Query, Perform Multi-Signal AI Analysis, Export Verification Reports.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* G. SETTINGS CHANGE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirm System Configuration Changes?"
        message="Updating global platform settings immediately alters cryptographic validation behavior and platform policies. An audit record will be anchored to the platform ledger."
        confirmLabel="Apply Settings"
        isDestructive={false}
      />
    </div>
  );
};
