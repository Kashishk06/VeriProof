import React, { useState } from 'react';
import {
  Settings, User, Lock, Bell, Shield, Smartphone, Globe,
  CheckCircle2, AlertTriangle, Key, LogOut, Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  // Profile Form State
  const [profile, setProfile] = useState({
    name: user?.name || 'Dr. Elena Rostova',
    email: user?.email || 'verifier.auditor@veriproof.internal',
    phone: '+1 (555) 234-8901',
    organization: user?.organization || 'Global Forensic Accreditation Consortium'
  });

  // Security State
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notification State
  const [notifications, setNotifications] = useState({
    completionAlerts: true,
    suspiciousAlerts: true,
    reportReady: true,
    digestEmail: false
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success('Profile Updated', 'Your verifier contact details were saved successfully.');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      info('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setPasswords({ current: '', newPass: '', confirm: '' });
    success('Password Changed', 'Your account credentials have been updated.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Verifier Settings</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal profile, cryptographic security settings, and verification alert preferences.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'security'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'notifications'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-white mb-1">Verifier Profile Information</h2>
          <p className="text-xs text-slate-400 mb-6">Personal details associated with your verification audit trail.</p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Organization / Department</label>
              <input
                type="text"
                value={profile.organization}
                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-2xl space-y-6">
          {/* Change Password */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
            <h2 className="text-base font-bold text-white mb-1">Change Account Password</h2>
            <p className="text-xs text-slate-400 mb-4">Ensure your account uses a strong, unique password.</p>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
                >
                  <Key className="w-4 h-4" />
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Protect verification audit actions with a time-based one-time password (TOTP).
              </p>
            </div>

            <button
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                success('2FA Updated', twoFactorEnabled ? 'Two-Factor Authentication disabled.' : 'Two-Factor Authentication enabled.');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                twoFactorEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Active Device Sessions</h3>
                <p className="text-xs text-slate-400">Devices currently logged into this Verifier node.</p>
              </div>
              <button
                onClick={() => success('Sessions Revoked', 'All other active sessions have been terminated.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout Other Sessions
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">Chrome on Windows (Current Session)</div>
                  <div className="text-slate-500 font-mono text-[11px]">IP: 127.0.0.1 • Last Active: Just now</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Current
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white mb-1">Notification Preferences</h2>
          <p className="text-xs text-slate-400 mb-4">Choose how you receive alerts and security notifications.</p>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Verification Completion Alerts</div>
                <div className="text-[11px] text-slate-400">Receive in-app toast alerts when document verification finishes.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.completionAlerts}
                onChange={(e) => setNotifications({ ...notifications, completionAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Suspicious & Tampered Document Alerts</div>
                <div className="text-[11px] text-slate-400">Immediate high-priority notification when a forged or tampered credential is presented.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.suspiciousAlerts}
                onChange={(e) => setNotifications({ ...notifications, suspiciousAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Report Generation Notifications</div>
                <div className="text-[11px] text-slate-400">Alerts when batch verification reports are ready for export.</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.reportReady}
                onChange={(e) => setNotifications({ ...notifications, reportReady: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={() => success('Preferences Saved', 'Notification settings successfully updated.')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              Save Notification Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
