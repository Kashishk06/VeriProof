import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2,
  AlertCircle, Mail, Phone, User, Building, Globe,
  ChevronRight, Briefcase, Lock, Check, Upload, FileCheck,
  RefreshCw, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { apiRequest } from '../../utils/documentRegistryApi';
import veriproofLogo from '../../assets/veriproof_logo.png';

/* ─────────────────────────────────────────────────────────────
   VERIPROOF — Organization Sign-Up Form
  Starts with role selection, then renders the selected role's
  signup fields and backend email OTP verification.
───────────────────────────────────────────────────────────── */

// ─── Constants ─────────────────────────────────────────────

const ORG_TYPES = [
  'Educational Institution',
  'Government Organization',
  'Corporate / Company',
  'Training & Certification Institute',
  'Financial Institution',
  'Healthcare Organization',
  'Legal Organization',
  'Non-Profit / NGO',
  'Other',
] as const;

type OrgType = typeof ORG_TYPES[number];

const ORG_REQUIRED_DOCUMENTS: Record<OrgType, string> = {
  'Educational Institution': 'Recognition / Affiliation Certificate',
  'Government Organization': 'Government Establishment / Authorization Order',
  'Corporate / Company': 'Certificate of Incorporation',
  'Training & Certification Institute': 'Registration / Recognition Certificate',
  'Financial Institution': 'Applicable Regulatory Registration / License',
  'Healthcare Organization': 'Applicable Healthcare Establishment Registration / License',
  'Legal Organization': 'Applicable Legal Entity Registration Document',
  'Non-Profit / NGO': 'NGO Registration Certificate',
  'Other': 'Applicable Authority-Issued Registration / License',
};

// ─── Helpers ───────────────────────────────────────────────

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Very Weak', color: '#ef4444' };
  if (score === 2) return { score, label: 'Weak', color: '#f97316' };
  if (score === 3) return { score, label: 'Medium', color: '#eab308' };
  if (score === 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score: 5, label: 'Very Strong', color: '#10b981' };
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Dynamic org-type fields ────────────────────────────────

function OrgTypeExtraFields({
  orgType,
  extraFields,
  setExtraFields,
}: {
  orgType: OrgType;
  extraFields: Record<string, string>;
  setExtraFields: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const upd = (k: string, v: string) => setExtraFields(p => ({ ...p, [k]: v }));
  const inp = (label: string, key: string, placeholder: string) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={extraFields[key] || ''}
        onChange={e => upd(key, e.target.value)}
        className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/10 transition-all"
      />
    </div>
  );

  if (orgType === 'Educational Institution') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Educational Details</div>
        {inp('Institution Type', 'instType', 'e.g. University, College, School')}
        {inp('University / Board Affiliation', 'affiliation', 'e.g. University of Delhi')}
        {inp('Accreditation / Recognition', 'accreditation', 'e.g. NAAC A+, NBA')}
        {inp('Recognition / Registration Number', 'recognitionNo', 'Enter recognition number')}
      </div>
    );
  }
  if (orgType === 'Government Organization') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Government Details</div>
        {inp('Department / Ministry', 'department', 'e.g. Ministry of Education')}
        {inp('Government Level', 'govLevel', 'e.g. Central, State, Local')}
        {inp('Department / Organization ID', 'deptId', 'Enter department ID')}
      </div>
    );
  }
  if (orgType === 'Corporate / Company') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Company Details</div>
        {inp('Legal Company Name', 'legalName', 'Enter registered legal name')}
        {inp('Company Type', 'companyType', 'e.g. Private Ltd, Public Ltd, LLP')}
        {inp('Company Registration Number', 'cinNo', 'Enter CIN / registration number')}
        {inp('Business / Tax ID', 'taxId', 'e.g. GST / PAN / EIN')}
        {inp('Industry', 'industry', 'e.g. Technology, Finance, Healthcare')}
      </div>
    );
  }
  if (orgType === 'Training & Certification Institute') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Institute Details</div>
        {inp('Institute Type', 'instType', 'e.g. Vocational, Professional')}
        {inp('Accreditation Authority', 'accAuthority', 'e.g. NSDC, ISO')}
        {inp('Accreditation / Registration Number', 'accNo', 'Enter accreditation number')}
      </div>
    );
  }
  if (orgType === 'Financial Institution') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Financial Institution Details</div>
        {inp('Institution Type', 'instType', 'e.g. Bank, NBFC, Insurance')}
        {inp('License / Registration Number', 'licenseNo', 'Enter RBI / SEBI license number')}
        {inp('Regulatory Authority', 'regAuthority', 'e.g. RBI, SEBI, IRDAI')}
      </div>
    );
  }
  if (orgType === 'Healthcare Organization') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Healthcare Details</div>
        {inp('Organization Type', 'orgSubType', 'e.g. Hospital, Clinic, Lab')}
        {inp('License / Registration Number', 'licenseNo', 'Enter medical registration number')}
        {inp('Accreditation / Regulatory Authority', 'regAuthority', 'e.g. NABH, NMC')}
      </div>
    );
  }
  if (orgType === 'Legal Organization') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Legal Organization Details</div>
        {inp('Organization / Firm Type', 'firmType', 'e.g. Law Firm, Legal Consultancy')}
        {inp('Registration Number', 'regNo', 'Enter bar council / firm registration')}
        {inp('Regulatory / Bar Authority', 'barAuthority', 'e.g. Bar Council of India')}
      </div>
    );
  }
  if (orgType === 'Non-Profit / NGO') {
    return (
      <div className="space-y-3 pt-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">NGO / Non-Profit Details</div>
        {inp('Organization Type', 'orgSubType', 'e.g. Trust, Society, Foundation')}
        {inp('Registration Number', 'regNo', 'Enter 12A / 80G / FCRA number')}
        {inp('Registration Authority', 'regAuthority', 'e.g. Registrar of Societies')}
      </div>
    );
  }
  // Other
  return (
    <div className="space-y-3 pt-1">
      <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">Organization Details</div>
      {inp('Organization Type / Category', 'orgCategory', 'Describe organization type')}
      {inp('Registration Number', 'regNo', 'Enter any applicable registration number')}
      {inp('Brief Description', 'description', 'Brief description of your organization')}
    </div>
  );
}

// ─── Shared input style ─────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/10 transition-all';

const labelCls = 'block text-xs font-semibold text-slate-300 mb-1.5';

// ─── Field component ────────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ElementType;
  rightEl?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, id, type = 'text', placeholder, value, onChange, error, icon: Icon, rightEl, required, disabled
}) => (
  <div>
    <label htmlFor={id} className={labelCls}>
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls} ${Icon ? 'pl-10' : ''} ${rightEl ? 'pr-10' : ''} ${error ? 'border-red-500/50' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {rightEl && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>}
    </div>
    {error && (
      <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
        <AlertCircle size={10} /> {error}
      </p>
    )}
  </div>
);

// ─── Main Component ─────────────────────────────────────────

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const { success, error: toastError } = useToast();

  const [selectedRole, setSelectedRole] = useState<'issuer' | 'verifier' | null>(null);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifierData, setVerifierData] = useState({ fullName: '', email: '' });

  // ── Issuer Organization profile
  const [issuerData, setIssuerData] = useState({
    orgName: '',
    orgType: 'Educational Institution' as OrgType,
    regNumber: '',
    website: '',
    orgEmail: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    repName: '',
    repDesignation: '',
    repEmail: '',
    repPhone: '',
  });

  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  // ── Organization-Specific Document Upload
  const [primaryDoc, setPrimaryDoc] = useState<{ file: File; name: string; size: string } | null>(null);
  const [supportingDoc, setSupportingDoc] = useState<{ file: File; name: string; size: string } | null>(null);

  // ── Email OTP Verification State
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpValue, setOtpValue] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [otpStatusMsg, setOtpStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Password Creation (Revealed ONLY after email OTP verification)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // ── Review: Terms
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Computed password strength
  const pwStrength = getPasswordStrength(password);

  const setErr = (k: string, v: string) => setErrors(p => ({ ...p, [k]: v }));
  const clearErr = (k: string) => setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  const signupEmail = selectedRole === 'verifier' ? verifierData.email : issuerData.orgEmail;

  const handleRoleSelect = (role: 'issuer' | 'verifier') => {
    setSelectedRole(role);
    setErrors({});
    setIsEmailVerified(false);
    setVerificationToken(null);
    setOtpSent(false);
    setOtpCooldown(0);
    setOtpValue('');
    setOtpStatusMsg(null);
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
  };

  const handleRoleContinue = () => {
    if (!selectedRole) {
      setErr('role', 'Select Issuer or Verifier to continue.');
      return;
    }
    setErrors({});
    setShowSignupForm(true);
  };

  const handleRoleBack = () => {
    if (isSubmitting || isSendingOtp || isVerifyingOtp) return;
    setShowSignupForm(false);
    setErrors({});
    setIsEmailVerified(false);
    setVerificationToken(null);
    setOtpSent(false);
    setOtpCooldown(0);
    setOtpValue('');
    setOtpStatusMsg(null);
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
  };

  // Cooldown countdown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // ── Organization Type Change: Clear obsolete document selections
  const handleOrgTypeChange = (newType: OrgType) => {
    setIssuerData(p => ({ ...p, orgType: newType }));
    setExtraFields({});
    // Clear obsolete documents so they cannot be accidentally submitted
    setPrimaryDoc(null);
    setSupportingDoc(null);
    clearErr('primaryDoc');
  };

  // ── Email Change Handler: Invalidate OTP and verification if email is edited
  const handleEmailChange = (newEmail: string) => {
    if (selectedRole === 'verifier') {
      setVerifierData(p => ({ ...p, email: newEmail }));
      clearErr('email');
    } else {
      setIssuerData(p => ({ ...p, orgEmail: newEmail }));
      clearErr('orgEmail');
    }
    if (isEmailVerified || otpSent) {
      // Invalidate previous verification when email changes
      setIsEmailVerified(false);
      setVerificationToken(null);
      setOtpSent(false);
      setOtpValue('');
      setPassword('');
      setConfirmPassword('');
      setOtpStatusMsg(null);
      clearErr('otp');
      clearErr('emailVerification');
    }
  };

  // ── Document Selection Handlers
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'primary' | 'supporting'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErr(type === 'primary' ? 'primaryDoc' : 'supportingDoc', 'File size exceeds 10MB limit.');
      return;
    }

    const docObj = {
      file,
      name: file.name,
      size: formatFileSize(file.size),
    };

    if (type === 'primary') {
      setPrimaryDoc(docObj);
      clearErr('primaryDoc');
    } else {
      setSupportingDoc(docObj);
      clearErr('supportingDoc');
    }
    // Reset file input
    e.target.value = '';
  };

  // ── Send OTP to Email
  const handleSendOtp = async () => {
    if (!signupEmail.trim()) {
      setErr(selectedRole === 'verifier' ? 'email' : 'orgEmail', selectedRole === 'verifier' ? 'Email address is required.' : 'Official organization email is required.');
      return;
    }
    if (!validateEmail(signupEmail)) {
      setErr(selectedRole === 'verifier' ? 'email' : 'orgEmail', 'Please enter a valid email address.');
      return;
    }

    clearErr(selectedRole === 'verifier' ? 'email' : 'orgEmail');
    clearErr('otp');
    clearErr('emailVerification');
    setIsSendingOtp(true);
    setOtpStatusMsg(null);

    const emailToSend = signupEmail.trim().toLowerCase();

    try {
      const data = await apiRequest<{ cooldown_seconds?: number }>('/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, workflow: `${selectedRole}_signup` }),
      });
      setOtpSent(true);
      setOtpCooldown(data.cooldown_seconds || 60);
      setOtpStatusMsg({
        type: 'success',
        text: `Verification OTP has been sent to ${emailToSend}. Please check your inbox.`,
      });
      success('OTP Sent', `Verification code sent to ${emailToSend}`);
    } catch (requestError) {
      // Network/service failure: Do NOT simulate success
      const msg = requestError instanceof Error ? requestError.message : 'Email service unavailable. Please check backend and SMTP configuration.';
      setOtpStatusMsg({ type: 'error', text: msg });
      setErr('otp', msg);
      toastError('Dispatch Error', msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      setErr('otp', 'Please enter the 6-digit OTP.');
      return;
    }
    if (!/^\d{6}$/.test(otpValue.trim())) {
      setErr('otp', 'OTP must be exactly 6 numeric digits.');
      return;
    }

    clearErr('otp');
    setIsVerifyingOtp(true);

    const emailToVerify = signupEmail.trim().toLowerCase();

    try {
      const data = await apiRequest<{ verification_token?: string | null }>('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, otp: otpValue.trim(), workflow: `${selectedRole}_signup` }),
      });
      setIsEmailVerified(true);
      setVerificationToken(data.verification_token || null);
      setOtpStatusMsg({
        type: 'success',
        text: 'Email verified successfully! You may now create your password below.',
      });
      success('Email Verified', 'Official email verified successfully.');
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : 'Verification service unavailable.';
      setErr('otp', msg);
      setOtpStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Validate the selected role's signup form
  const validateSignup = (): boolean => {
    const errs: Record<string, string> = {};

    if (selectedRole === 'issuer') {
      if (!issuerData.orgName.trim()) errs.orgName = 'Organization name is required.';
      if (!issuerData.regNumber.trim()) errs.regNumber = 'Registration / License number is required.';
      if (!primaryDoc) errs.primaryDoc = `Required: Please upload your ${ORG_REQUIRED_DOCUMENTS[issuerData.orgType]}.`;
      if (!issuerData.repName.trim()) errs.repName = 'Representative name is required.';
      if (!issuerData.orgEmail.trim()) {
        errs.orgEmail = 'Official organization email is required.';
      } else if (!validateEmail(issuerData.orgEmail)) {
        errs.orgEmail = 'Please enter a valid email.';
      }
    } else if (selectedRole === 'verifier') {
      if (!verifierData.fullName.trim()) errs.fullName = 'Full name is required.';
      if (!verifierData.email.trim()) {
        errs.email = 'Email address is required.';
      } else if (!validateEmail(verifierData.email)) {
        errs.email = 'Please enter a valid email.';
      }
    } else {
      errs.role = 'Select Issuer or Verifier to continue.';
    }

    if (!isEmailVerified) {
      errs.emailVerification = 'Please verify your official email address via OTP before continuing.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (selectedRole === 'issuer' && !termsAccepted) {
      errs.terms = 'You must accept the Terms of Service and Privacy Policy.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateSignup() || !selectedRole) return;
    setIsSubmitting(true);

    // Call backend signup API with verification token and organization data
    try {
      await apiRequest('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: selectedRole === 'issuer' ? issuerData.repName : verifierData.fullName,
          email: signupEmail.trim().toLowerCase(),
          password: password,
          confirm_password: confirmPassword,
          role: selectedRole.toUpperCase(),
          verification_token: verificationToken,
          ...(selectedRole === 'issuer' && {
            organization: {
              name: issuerData.orgName,
              org_type: issuerData.orgType,
              registration_number: issuerData.regNumber,
              authorized_representative_name: issuerData.repName,
              authorized_representative_role: issuerData.repDesignation || undefined,
              authorized_representative_email: issuerData.repEmail || undefined,
              authorized_representative_phone: issuerData.repPhone || undefined,
              primary_document_url: primaryDoc?.name || undefined,
              supporting_document_url: supportingDoc?.name || undefined,
              website: issuerData.website || undefined,
              address: issuerData.address || undefined,
              city: issuerData.city || undefined,
              state: issuerData.state || undefined,
              country: issuerData.country || undefined,
              pin_code: issuerData.pinCode || undefined,
            },
          }),
        }),
      });

      const authenticatedUser = await authenticate(signupEmail, password);
      if (!authenticatedUser) {
        setErrors({ submit: 'Account created, but automatic sign-in failed. Please sign in with your new account.' });
        return;
      }

      const role = authenticatedUser.role;
      success('Account Created', `Your ${role === 'issuer' ? 'Issuer' : 'Verifier'} account has been created.`);
      navigate(role === 'issuer' ? '/issuer' : '/verifier', { replace: true });
    } catch (requestError) {
      setErrors({ submit: requestError instanceof Error ? requestError.message : 'Unable to reach the signup service. Your account was not created.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-pink-600/8 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.012)_1px,transparent_1px)] bg-[size:52px_52px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-5">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <img
              src={veriproofLogo}
              alt="VeriProof — Secure Digital Document Verification Platform"
              className="h-16 sm:h-20 w-auto mx-auto object-contain group-hover:opacity-90 transition-opacity duration-200"
            />
          </Link>
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-widest font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            Verify. Prove. Trust.
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {showSignupForm ? `${selectedRole === 'issuer' ? 'Issuer' : 'Verifier'} Account Signup` : 'Create Your Account'}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {showSignupForm
              ? selectedRole === 'issuer'
                ? "Provide your organization's details for CIPHER03 registration."
                : 'Create an account to verify digital documents and check their authenticity.'
              : 'Choose how you will use VeriProof.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0B1020]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {!showSignupForm ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  aria-pressed={selectedRole === 'issuer'}
                  onClick={() => handleRoleSelect('issuer')}
                  className={`p-5 rounded-2xl border text-left transition-all ${selectedRole === 'issuer' ? 'bg-purple-500/10 border-purple-400 ring-2 ring-purple-500/30' : 'bg-white/3 border-white/10 hover:border-purple-500/40'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'issuer' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-400'}`}>
                      <Building size={18} />
                    </div>
                    <span className="text-sm font-bold text-white">Issuer</span>
                    {selectedRole === 'issuer' && <Check size={15} className="ml-auto text-purple-300" />}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    For organizations or authorized entities that issue and manage digital documents and certificates.
                  </p>
                </button>

                <button
                  type="button"
                  aria-pressed={selectedRole === 'verifier'}
                  onClick={() => handleRoleSelect('verifier')}
                  className={`p-5 rounded-2xl border text-left transition-all ${selectedRole === 'verifier' ? 'bg-purple-500/10 border-purple-400 ring-2 ring-purple-500/30' : 'bg-white/3 border-white/10 hover:border-purple-500/40'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'verifier' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-400'}`}>
                      <Shield size={18} />
                    </div>
                    <span className="text-sm font-bold text-white">Verifier</span>
                    {selectedRole === 'verifier' && <Check size={15} className="ml-auto text-purple-300" />}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    For individuals or authorized users who verify documents and check their authenticity.
                  </p>
                </button>
              </div>
              {(errors.role || !selectedRole) && (
                <p role="alert" className="text-[11px] text-red-400">{errors.role || 'Select Issuer or Verifier to continue.'}</p>
              )}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleRoleContinue}
                  disabled={!selectedRole}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white">{selectedRole === 'issuer' ? 'Issuer Organization Information' : 'Verifier Information'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedRole === 'issuer' ? 'Register your organization and authorized representative.' : 'Enter your details to create a verifier account.'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRoleBack}
                  disabled={isSubmitting || isSendingOtp || isVerifyingOtp}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              </div>

          {/* ═══════════════════════════════════════════════════
              STEP 1 — Organization Details & Verification
              (Begins directly from previous Step Two)
          ═══════════════════════════════════════════════════ */}
          {showSignupForm && (
            <div className="space-y-6">
              {selectedRole === 'verifier' && (
                <Field
                  label="Full Name" id="verifier-full-name" placeholder="Your full name"
                  value={verifierData.fullName} icon={User} required
                  onChange={value => { setVerifierData(p => ({ ...p, fullName: value })); clearErr('fullName'); }}
                  error={errors.fullName}
                />
              )}

              {selectedRole === 'issuer' && (
                <div className="space-y-6">
              {/* Organization basics */}
              <div className="space-y-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-2">
                  <Building size={11} /> Organization Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field
                      label="Organization Name" id="org-name" placeholder="Official registered organization name"
                      value={issuerData.orgName} icon={Building}
                      onChange={v => { setIssuerData(p => ({ ...p, orgName: v })); clearErr('orgName'); }}
                      error={errors.orgName} required
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Organization Type<span className="text-red-400 ml-0.5">*</span></label>
                    <select
                      value={issuerData.orgType}
                      onChange={e => handleOrgTypeChange(e.target.value as OrgType)}
                      className={inputCls}
                    >
                      {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <Field
                    label="Registration / License Number" id="org-reg" placeholder="Enter registration or license number"
                    value={issuerData.regNumber}
                    onChange={v => { setIssuerData(p => ({ ...p, regNumber: v })); clearErr('regNumber'); }}
                    error={errors.regNumber} required
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Official Website" id="org-web" placeholder="https://yourorganization.com"
                      value={issuerData.website} icon={Globe}
                      onChange={v => setIssuerData(p => ({ ...p, website: v }))}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address</label>
                    <input type="text" placeholder="Street address"
                      value={issuerData.address}
                      onChange={e => setIssuerData(p => ({ ...p, address: e.target.value }))}
                      className={inputCls} />
                  </div>
                  {[
                    ['City', 'city', 'City'],
                    ['State', 'state', 'State / Province'],
                    ['Country', 'country', 'Country'],
                    ['PIN / ZIP Code', 'pinCode', 'Postal Code'],
                  ].map(([lbl, key, ph]) => (
                    <div key={key}>
                      <label className={labelCls}>{lbl}</label>
                      <input type="text" placeholder={ph}
                        value={(issuerData as any)[key]}
                        onChange={e => setIssuerData(p => ({ ...p, [key]: e.target.value }))}
                        className={inputCls} />
                    </div>
                  ))}
                </div>

                {/* Dynamic org-type fields */}
                <OrgTypeExtraFields
                  orgType={issuerData.orgType}
                  extraFields={extraFields}
                  setExtraFields={setExtraFields}
                />
              </div>

              {/* ─────────────────────────────────────────────────
                  Organization-Specific Document Upload
              ───────────────────────────────────────────────── */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-2">
                  <FileCheck size={11} /> Organization Verification Document
                </div>
                <p className="text-[11px] text-slate-400">
                  Please upload the required verification document corresponding to <span className="text-violet-300 font-semibold">{issuerData.orgType}</span>.
                </p>

                {/* Required Document field */}
                <div className="p-3.5 rounded-2xl bg-white/3 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {ORG_REQUIRED_DOCUMENTS[issuerData.orgType]}
                      <span className="text-red-400 ml-0.5">*</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Required
                    </span>
                  </div>

                  {primaryDoc ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <div className="flex items-center gap-2 text-xs truncate mr-2">
                        <FileCheck size={14} className="text-purple-400 flex-shrink-0" />
                        <span className="text-white font-medium truncate">{primaryDoc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">({primaryDoc.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrimaryDoc(null)}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                        title="Remove file"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/20 hover:border-purple-500/50 rounded-xl cursor-pointer bg-[#050816]/50 hover:bg-purple-500/5 transition-all text-center">
                      <Upload size={16} className="text-slate-400 mb-1" />
                      <span className="text-xs text-slate-300 font-medium">Click to upload document</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">PDF, PNG, JPG (max 10MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={e => handleFileSelect(e, 'primary')}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {errors.primaryDoc && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 pt-1">
                      <AlertCircle size={10} /> {errors.primaryDoc}
                    </p>
                  )}
                </div>

                {/* Optional Supporting Document field */}
                <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Supporting Document
                      <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Optional</span>
                  </div>

                  {supportingDoc ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 text-xs truncate mr-2">
                        <FileCheck size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-300 font-medium truncate">{supportingDoc.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">({supportingDoc.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSupportingDoc(null)}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                        title="Remove file"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-white/10 hover:border-white/20 rounded-xl cursor-pointer bg-[#050816]/30 text-center transition-all">
                      <Upload size={13} className="text-slate-500" />
                      <span className="text-[11px] text-slate-400">Attach supplementary document or authorization order</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={e => handleFileSelect(e, 'supporting')}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {errors.supportingDoc && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 pt-1">
                      <AlertCircle size={10} /> {errors.supportingDoc}
                    </p>
                  )}
                </div>
              </div>

                </div>
                )}

                {/* ─────────────────────────────────────────────────
                  Email OTP Verification & Password Creation
              ───────────────────────────────────────────────── */}
              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-2">
                  <Mail size={11} /> {selectedRole === 'issuer' ? 'Official Email & Verification' : 'Email & Verification'}
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="org-email" className={labelCls}>
                      {selectedRole === 'issuer' ? 'Official Organization Email' : 'Email Address'}<span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                          id="org-email"
                          type="email"
                          placeholder={selectedRole === 'issuer' ? 'official@organization.com' : 'you@example.com'}
                          value={signupEmail}
                          onChange={e => handleEmailChange(e.target.value)}
                          className={`${inputCls} pl-10 ${errors[selectedRole === 'verifier' ? 'email' : 'orgEmail'] ? 'border-red-500/50' : ''}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || otpCooldown > 0 || isEmailVerified}
                        className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isSendingOtp ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> Sending...
                          </>
                        ) : isEmailVerified ? (
                          <>
                            <Check size={12} className="text-emerald-400" /> Verified
                          </>
                        ) : otpCooldown > 0 ? (
                          `Resend in ${otpCooldown}s`
                        ) : otpSent ? (
                          'Resend OTP'
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    </div>
                    {errors[selectedRole === 'verifier' ? 'email' : 'orgEmail'] && (
                      <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors[selectedRole === 'verifier' ? 'email' : 'orgEmail']}
                      </p>
                    )}
                  </div>

                  {/* Status / feedback message */}
                  {otpStatusMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        otpStatusMsg.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border border-red-500/30 text-red-300'
                      }`}
                    >
                      {otpStatusMsg.type === 'success' ? (
                        <CheckCircle2 size={13} className="flex-shrink-0" />
                      ) : (
                        <AlertCircle size={13} className="flex-shrink-0" />
                      )}
                      <span>{otpStatusMsg.text}</span>
                    </div>
                  )}

                  {/* OTP Entry (shown once OTP has been sent and not yet verified) */}
                  {otpSent && !isEmailVerified && (
                    <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2.5">
                      <label htmlFor="otp-input" className="block text-xs font-semibold text-purple-300">
                        Enter 6-Digit Verification OTP
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="otp-input"
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otpValue}
                          onChange={e => {
                            setOtpValue(e.target.value.replace(/\D/g, ''));
                            clearErr('otp');
                          }}
                          className={`${inputCls} font-mono tracking-widest text-center text-sm`}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otpValue.length !== 6}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" /> Verifying...
                            </>
                          ) : (
                            'Verify OTP'
                          )}
                        </button>
                      </div>
                      {errors.otp && (
                        <p className="text-[11px] text-red-400 flex items-center gap-1">
                          <AlertCircle size={10} /> {errors.otp}
                        </p>
                      )}
                    </div>
                  )}

                  {/* General email verification error */}
                  {errors.emailVerification && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.emailVerification}
                    </p>
                  )}

                  {/* ─────────────────────────────────────────────────
                      Password Creation
                      REVEALED ONLY AFTER SUCCESSFUL OTP VERIFICATION
                  ───────────────────────────────────────────────── */}
                  {isEmailVerified && (
                    <div className="space-y-3 pt-3 border-t border-purple-500/20">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span>Email verified. Set your account credentials.</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="s1-pw" className={labelCls}>
                            Create Password<span className="text-red-400 ml-0.5">*</span>
                          </label>
                          <div className="relative">
                            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              id="s1-pw"
                              type={showPw ? 'text' : 'password'}
                              placeholder="Create strong password"
                              value={password}
                              onChange={e => { setPassword(e.target.value); clearErr('password'); }}
                              className={`${inputCls} pl-10 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw(p => !p)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                              <AlertCircle size={10} /> {errors.password}
                            </p>
                          )}

                          {/* Password strength meter */}
                          {password && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <div
                                    key={i}
                                    className="flex-1 h-1 rounded-full transition-all duration-300"
                                    style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : '#1e293b' }}
                                  />
                                ))}
                              </div>
                              <div className="text-[10px] font-mono" style={{ color: pwStrength.color }}>
                                {pwStrength.label}
                                {pwStrength.score < 4 && (
                                  <span className="text-slate-500 ml-2">
                                    · Use uppercase, numbers & special characters
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="s1-cpw" className={labelCls}>
                            Confirm Password<span className="text-red-400 ml-0.5">*</span>
                          </label>
                          <div className="relative">
                            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              id="s1-cpw"
                              type={showConfirmPw ? 'text' : 'password'}
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={e => { setConfirmPassword(e.target.value); clearErr('confirmPassword'); }}
                              className={`${inputCls} pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPw(p => !p)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                              <AlertCircle size={10} /> {errors.confirmPassword}
                            </p>
                          )}
                          {confirmPassword && password === confirmPassword && (
                            <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Passwords match
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Password requirements hint */}
                      <div className="p-3 rounded-xl bg-white/3 border border-white/8 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                        {[
                          ['8+ characters', password.length >= 8],
                          ['Uppercase letter', /[A-Z]/.test(password)],
                          ['Lowercase letter', /[a-z]/.test(password)],
                          ['Number', /\d/.test(password)],
                          ['Special character', /[^A-Za-z0-9]/.test(password)],
                        ].map(([hint, met]) => (
                          <div key={hint as string} className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>
                              {met ? <Check size={9} /> : <div className="w-1 h-1 rounded-full bg-slate-600" />}
                            </div>
                            <span className={`text-[10px] font-mono transition-colors ${met ? 'text-emerald-400' : 'text-slate-600'}`}>
                              {hint as string}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedRole === 'issuer' && (
              <>
              {/* Authorized Representative */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-2">
                  <User size={11} /> Authorized Representative
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Representative Name" id="rep-name" placeholder="Full name of authorized person"
                    value={issuerData.repName} icon={User}
                    onChange={v => { setIssuerData(p => ({ ...p, repName: v })); clearErr('repName'); }}
                    error={errors.repName} required
                  />
                  <Field
                    label="Designation / Job Title" id="rep-desg" placeholder="e.g. Registrar, Director, Officer"
                    value={issuerData.repDesignation} icon={Briefcase}
                    onChange={v => setIssuerData(p => ({ ...p, repDesignation: v }))}
                  />
                  <Field
                    label="Representative Direct Email" id="rep-email" type="email" placeholder="Direct email address"
                    value={issuerData.repEmail} icon={Mail}
                    onChange={v => setIssuerData(p => ({ ...p, repEmail: v }))}
                  />
                  <Field
                    label="Contact Number" id="rep-phone" type="tel" placeholder="Contact phone number"
                    value={issuerData.repPhone} icon={Phone}
                    onChange={v => setIssuerData(p => ({ ...p, repPhone: v }))}
                  />
                </div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${errors.terms ? 'bg-red-500/5 border-red-500/30' : 'bg-white/3 border-white/10'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => { setTermsAccepted(e.target.checked); clearErr('terms'); }}
                    className="mt-0.5 accent-purple-500"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I agree to the <span className="text-purple-400 font-semibold">Terms of Service</span> and <span className="text-purple-400 font-semibold">Privacy Policy</span> of CIPHER03. I confirm that the information provided is accurate and complete.
                  </span>
                </label>
                {errors.terms && <p className="mt-2 text-[11px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {errors.terms}</p>}
              </div>
              </>
              )}
            </div>
          )}

          {errors.submit && <p role="alert" className="mt-5 text-xs text-red-400">{errors.submit}</p>}
          <div className="flex justify-end pt-6">
            <button
              type="button"
              id="signup-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>Create Account <ArrowRight size={13} /></>
              )}
            </button>
          </div>
            </>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign In
            </Link>
          </span>
          <Link to="/" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ChevronRight size={11} className="rotate-180" /> Home
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-700 font-mono pb-2">
          <Shield size={10} />
          <span>256-bit encrypted · CIPHER03 Secure Registration</span>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
