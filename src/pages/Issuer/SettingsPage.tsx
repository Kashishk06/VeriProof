import React, { useState, useMemo } from 'react';
import {
  Settings, User, Building2, Lock, Bell,
  ShieldCheck, CheckCircle2, AlertCircle, Save,
  Key, Smartphone, Laptop
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';

export const IssuerSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { organizations } = useApp();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security' | 'notifications'>('profile');

  // Authoritative organization
  const currentOrg = useMemo(() => {
    return (
      organizations.find(
        (o) =>
          o.name.toLowerCase() === user?.organization?.toLowerCase() ||
          o.legalName.toLowerCase() === user?.organization?.toLowerCase() ||
          o.id === 'ORG-001'
      ) || organizations[0]
    );
  }, [organizations, user]);

  // Section A: Profile Form State
  const [profileName, setProfileName] = useState(user?.name || 'Bob Issuer');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'bob@techuniv.edu');
  const [profilePhone, setProfilePhone] = useState('+1 (555) 234-5678');
  const [profileDepartment, setProfileDepartment] = useState(user?.department || 'Registrar & Credential Office');

  // Section B: Org Form State
  const [contactEmail, setContactEmail] = useState(currentOrg?.officialEmail || 'registrar@techuniv.edu');
  const [contactDomain, setContactDomain] = useState(currentOrg?.officialDomain || 'techuniv.edu');

  // Section C: Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Section D: Notification Preferences
  const [notifyVerification, setNotifyVerification] = useState(true);
  const [notifyRevocation, setNotifyRevocation] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);
  const [notifySecurityAlerts, setNotifySecurityAlerts] = useState(true);

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      error('Validation Error', 'Name and email are required fields.');
      return;
    }
    success('Profile Updated', 'Your representative profile details have been saved.');
  };

  // Organization Save
  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    success('Organization Contact Updated', 'Official contact channels saved successfully.');
  };

  // Password Save
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      error('Password Error', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      error('Password Error', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    success('Security Updated', 'Your account password has been changed.');
  };

  // Notification Save
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    success('Preferences Saved', 'Notification dispatch preferences have been updated.');
  };

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Issuer Account & Organization Settings"
        description="Manage your authorized representative profile, organizational contact information, cryptographic access security, and event dispatch preferences."
        badge="CONFIGURATION"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/5">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <User size={14} />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('organization')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'organization'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Building2 size={14} />
          <span>Organization Info</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Lock size={14} />
          <span>Security</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Bell size={14} />
          <span>Notifications</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl max-w-2xl">
          <div className="pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Representative Profile</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contact and identification information bound to credential issuance events.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Phone Number</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Issuing Department</label>
              <input
                type="text"
                value={profileDepartment}
                onChange={(e) => setProfileDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ORGANIZATION INFO */}
      {activeTab === 'organization' && (
        <form onSubmit={handleSaveOrg} className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl max-w-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white">Organization Profile</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official institutional credentials and authoritative KYC accreditation.
              </p>
            </div>
            <StatusBadge status={currentOrg?.status || 'ACTIVE'} />
          </div>

          {/* KYC Governance Banner */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-start gap-3">
            <ShieldCheck size={20} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">KYC Accreditation:</span>
                <StatusBadge status={currentOrg?.kycStatus || 'APPROVED'} />
              </div>
              <p className="text-slate-300 leading-relaxed">
                Organization accreditation and verification tiers are governed by the Platform Super Admin Authority. Legal name changes or tax identifier updates require submitting an official governance ticket to <strong>compliance@veriproof.io</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Organization Name</label>
                <input
                  type="text"
                  readOnly
                  value={currentOrg?.name}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/5 rounded-xl text-slate-300 cursor-not-allowed select-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Issuer ID</label>
                <input
                  type="text"
                  readOnly
                  value={currentOrg?.id}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/5 rounded-xl text-violet-300 font-mono cursor-not-allowed select-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Organization Type</label>
                <input
                  type="text"
                  readOnly
                  value={currentOrg?.type}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/5 rounded-xl text-slate-300 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Registration Number</label>
                <input
                  type="text"
                  readOnly
                  value={currentOrg?.registrationNumber || 'EDU-REG-990142'}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/5 rounded-xl text-slate-300 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Official Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Official Web Domain</label>
              <input
                type="text"
                value={contactDomain}
                onChange={(e) => setContactDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Save size={14} />
              <span>Update Contact Details</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          {/* Change Password Form */}
          <form onSubmit={handleSavePassword} className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key size={16} className="text-violet-400" />
                Change Password
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update account authentication credentials.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">New Password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-violet-600/20"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Two-Factor Authentication Toggle */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone size={16} className="text-emerald-400" />
                  Two-Factor Authentication (2FA)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Require hardware or TOTP authenticator token on signing operations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  success('2FA Setting Updated', `Two-Factor Authentication is now ${!twoFactorEnabled ? 'Enabled' : 'Disabled'}.`);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  twoFactorEnabled ? 'bg-violet-600' : 'bg-white/10'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Laptop size={16} className="text-violet-400" />
              Active Issuer Sessions
            </h3>
            <div className="p-3 bg-[#070B19] rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Current Session (Chrome on Windows)</p>
                <p className="text-[11px] text-slate-400 font-mono">IP: 198.51.100.22 • Active now</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                CURRENT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl max-w-2xl">
          <div className="pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Event Notification Preferences</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control which operational alerts and verification triggers send real-time dispatches.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3.5 bg-[#070B19] rounded-xl border border-white/5 cursor-pointer">
              <div>
                <p className="font-semibold text-white">Document Verification Alerts</p>
                <p className="text-[11px] text-slate-400">Receive dispatch when an external verifier queries a credential.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyVerification}
                onChange={(e) => setNotifyVerification(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#070B19] rounded-xl border border-white/5 cursor-pointer">
              <div>
                <p className="font-semibold text-white">Revocation Confirmations</p>
                <p className="text-[11px] text-slate-400">Receive cryptographic receipts upon authorized credential revocation.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyRevocation}
                onChange={(e) => setNotifyRevocation(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#070B19] rounded-xl border border-white/5 cursor-pointer">
              <div>
                <p className="font-semibold text-white">Weekly Issuance Summary</p>
                <p className="text-[11px] text-slate-400">Weekly automated digest of batch volumes and registration counts.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyWeeklyDigest}
                onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#070B19] rounded-xl border border-white/5 cursor-pointer">
              <div>
                <p className="font-semibold text-white">Security & Anomaly Alerts</p>
                <p className="text-[11px] text-slate-400">Urgent notifications on failed signatures or hash discrepancies.</p>
              </div>
              <input
                type="checkbox"
                checked={notifySecurityAlerts}
                onChange={(e) => setNotifySecurityAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Save size={14} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default IssuerSettingsPage;
