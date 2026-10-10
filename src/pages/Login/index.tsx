import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight,
  CheckCircle2, X, AlertCircle, ChevronRight, Key, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { UserRole } from '../../types';
import veriproofLogo from '../../assets/veriproof_logo.png';

/* ─────────────────────────────────────────────────────────────
   VARI PROOF — Login Page
   - All three roles: Admin / Issuer / Verifier
   - Admin has NO signup (system-managed credential)
   - Full frontend validation + show/hide password
   - Remember Me + Forgot Password modal
   - Demo 1-click login buttons
   - Role-based dashboard routing
───────────────────────────────────────────────────────────── */

const ROLES: { value: UserRole; label: string; desc: string; color: string; badge: string }[] = [
  {
    value: 'super_admin',
    label: 'Admin',
    desc: 'Platform governance & audit',
    color: 'amber',
    badge: 'SYSTEM',
  },
  {
    value: 'issuer',
    label: 'Issuer',
    desc: 'Issue & manage documents',
    color: 'violet',
    badge: 'ORG',
  },
  {
    value: 'verifier',
    label: 'Verifier',
    desc: 'Verify document authenticity',
    color: 'purple',
    badge: 'USER',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  amber: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    ring: 'ring-amber-500/50',
  },
  violet: {
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    border: 'border-violet-500/40',
    text: 'text-violet-300',
    ring: 'ring-violet-500/50',
  },
  purple: {
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    ring: 'ring-purple-500/50',
  },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const { success } = useToast();

  // ── Form state
  const [email, setEmail] = useState(
    () => localStorage.getItem('variproof_remembered_email') || ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    () => (localStorage.getItem('variproof_remembered_role') as UserRole) || 'verifier'
  );
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('variproof_remember_me') === 'true'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const getDashboardPath = (role: UserRole) => {
    if (role === 'super_admin') return '/admin';
    if (role === 'issuer') return '/issuer';
    return '/verifier';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('variproof_remember_me', 'true');
      localStorage.setItem('variproof_remembered_email', email.trim());
      localStorage.setItem('variproof_remembered_role', selectedRole);
    } else {
      localStorage.removeItem('variproof_remember_me');
      localStorage.removeItem('variproof_remembered_email');
      localStorage.removeItem('variproof_remembered_role');
    }

    const authenticatedUser = await authenticate(email.trim(), password);
    setLoading(false);
    if (!authenticatedUser) {
      setErrorMessage('Unable to sign in. Check your credentials and backend connection.');
      return;
    }

    const roleLabel = ROLES.find(r => r.value === authenticatedUser.role)?.label || 'User';
    success('Signed In Successfully', `Welcome back — ${roleLabel} workspace`);
    navigate(getDashboardPath(authenticatedUser.role));
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    if (!validateEmail(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
    }, 800);
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError(null);
    setForgotOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* ── Keyframe animations for dynamic background ── */}
      <style>{`
        @keyframes waveDrift1 {
          0% { transform: translateX(0); }
          50% { transform: translateX(-22%); }
          100% { transform: translateX(0); }
        }
        @keyframes waveDrift2 {
          0% { transform: translateX(-20%); }
          50% { transform: translateX(5%); }
          100% { transform: translateX(-20%); }
        }
        @keyframes waveDrift3 {
          0% { transform: translateX(0); }
          50% { transform: translateX(-15%); }
          100% { transform: translateX(0); }
        }
        @keyframes ambientSlow {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.55; }
          50% { transform: scale(1.08) translate(20px, -15px); opacity: 0.85; }
        }
        @keyframes ambientMedium {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.1) translate(-25px, 20px); opacity: 0.8; }
        }
        @keyframes floatParticle1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-22px) scale(1.2); opacity: 0.75; }
        }
        @keyframes floatParticle2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.35; }
          50% { transform: translateY(-28px) scale(0.9); opacity: 0.8; }
        }
        @keyframes floatParticle3 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.25; }
          50% { transform: translateY(-18px) scale(1.15); opacity: 0.65; }
        }
        .animate-wave-drift-1 { animation: waveDrift1 26s ease-in-out infinite; }
        .animate-wave-drift-2 { animation: waveDrift2 32s ease-in-out infinite; }
        .animate-wave-drift-3 { animation: waveDrift3 22s ease-in-out infinite; }
        .animate-ambient-slow { animation: ambientSlow 14s ease-in-out infinite; }
        .animate-ambient-medium { animation: ambientMedium 18s ease-in-out infinite; }
        .animate-float-1 { animation: floatParticle1 7s ease-in-out infinite; }
        .animate-float-2 { animation: floatParticle2 9s ease-in-out infinite 1.5s; }
        .animate-float-3 { animation: floatParticle3 8s ease-in-out infinite 3s; }
        @media (prefers-reduced-motion: reduce) {
          .animate-wave-drift-1,
          .animate-wave-drift-2,
          .animate-wave-drift-3,
          .animate-ambient-slow,
          .animate-ambient-medium,
          .animate-float-1,
          .animate-float-2,
          .animate-float-3 {
            animation: none !important;
          }
        }
      `}</style>

      {/* ── Dynamic Animated Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-purple-600/12 rounded-full blur-[140px] animate-ambient-slow" />
        <div className="absolute top-1/3 -right-24 w-[550px] h-[550px] bg-pink-600/10 rounded-full blur-[150px] animate-ambient-medium" />
        <div className="absolute -bottom-24 left-1/4 w-[650px] h-[650px] bg-indigo-600/10 rounded-full blur-[160px] animate-ambient-slow" />

        {/* Micro-Grid Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.02)_1px,transparent_1px)] bg-[size:52px_52px]" />

        {/* Floating Security Particles */}
        <div className="absolute top-[18%] left-[12%] w-2 h-2 rounded-full bg-purple-400/40 shadow-[0_0_12px_#c084fc] animate-float-1" />
        <div className="absolute top-[35%] right-[15%] w-2.5 h-2.5 rounded-full bg-pink-400/35 shadow-[0_0_14px_#f472b6] animate-float-2" />
        <div className="absolute top-[68%] left-[22%] w-1.5 h-1.5 rounded-full bg-emerald-400/30 shadow-[0_0_10px_#34d399] animate-float-3" />
        <div className="absolute top-[75%] right-[20%] w-2 h-2 rounded-full bg-purple-400/30 shadow-[0_0_12px_#c084fc] animate-float-1" />
        <div className="absolute top-[22%] right-[32%] w-1.5 h-1.5 rounded-full bg-blue-400/30 shadow-[0_0_10px_#60a5fa] animate-float-2" />
        <div className="absolute top-[82%] left-[42%] w-2 h-2 rounded-full bg-pink-400/25 shadow-[0_0_12px_#f472b6] animate-float-3" />

        {/* Fluid Animated SVG Waves - Layer 1 (Deep Indigo/Purple) */}
        <div className="absolute inset-x-0 bottom-0 h-[48vh] opacity-35 overflow-hidden animate-wave-drift-1">
          <svg
            className="absolute bottom-0 w-[200%] h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="url(#wave-grad-1)"
              fillOpacity="1"
              d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,197.3C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
            <defs>
              <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#db2777" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Fluid Animated SVG Waves - Layer 2 (Vibrant Purple/Pink) */}
        <div className="absolute inset-x-0 bottom-0 h-[40vh] opacity-30 overflow-hidden animate-wave-drift-2">
          <svg
            className="absolute bottom-0 w-[200%] h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="url(#wave-grad-2)"
              fillOpacity="1"
              d="M0,64L48,85.3C96,107,192,149,288,144C384,139,480,85,576,96C672,107,768,181,864,202.7C960,224,1056,192,1152,160C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
            <defs>
              <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Fluid Animated SVG Waves - Layer 3 (Foreground Crest Wave) */}
        <div className="absolute inset-x-0 bottom-0 h-[30vh] opacity-25 overflow-hidden animate-wave-drift-3">
          <svg
            className="absolute bottom-0 w-[200%] h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="url(#wave-grad-3)"
              fillOpacity="1"
              d="M0,224L48,208C96,192,192,160,288,160C384,160,480,192,576,192C672,192,768,160,864,144C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
            <defs>
              <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5 my-4">
        {/* ── Brand header ── */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group">
            <img
              src={veriproofLogo}
              alt="VeriProof — Secure Digital Document Verification Platform"
              className="h-28 sm:h-32 w-auto mx-auto object-contain group-hover:scale-105 transition-all duration-300 drop-shadow-[0_12px_28px_rgba(168,85,247,0.22)]"
            />
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
              Secure Digital Document Verification Platform. Sign in to access your authorized workspace and verify, issue, or manage digital documents according to your assigned role.
            </p>
          </div>
        </div>

        {/* ── Login form card ── */}
        <div className="bg-[#0B1020]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Error banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMessage(null); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMessage(null); }}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sign In As
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(role => {
                  const active = selectedRole === role.value;
                  const c = colorMap[role.color];
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`py-2 px-2 rounded-xl border text-center text-[11px] font-semibold transition-all duration-150 ${
                        active
                          ? `${c.bg} ${c.border} ${c.text} ring-1 ${c.ring}`
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#050816] border border-white/20 text-purple-500 focus:ring-0 cursor-pointer accent-purple-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={openForgot}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Signing In Securely...</span>
                </>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Create one
              </Link>
            </span>
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              <ChevronRight size={11} className="rotate-180" /> Home
            </Link>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono">
          <Shield size={10} />
          <span>256-bit encrypted · CIPHER03 Secure Access</span>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B1020] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative space-y-5">
            {/* Close */}
            <button
              onClick={() => setForgotOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Key size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Password Recovery</h3>
                <p className="text-[11px] text-slate-400">Recover access to your CIPHER03 account</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Reset Instructions Sent</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Password reset instructions have been sent to your registered email{' '}
                  <span className="font-mono text-purple-300 font-bold">{forgotEmail}</span>.
                </p>
                <button
                  onClick={() => setForgotOpen(false)}
                  className="mt-1 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); setForgotError(null); }}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-500 hover:bg-purple-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70"
                  >
                    {forgotLoading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
