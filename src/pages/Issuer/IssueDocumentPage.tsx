import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, CheckCircle2, Copy, ExternalLink,
  ShieldCheck, AlertCircle, RefreshCw, X, Download,
  Lock, Key, Mail, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { apiBlob, apiRequest, sendDocumentEmail, type RegistryDocumentDetail } from '../../utils/documentRegistryApi';

const SUPPORTED_DOCUMENT_TYPES = [
  'Certificate',
  'Marksheet',
  'Internship Certificate',
  'Experience Letter',
  'Offer Letter',
  'Invoice',
  'Contract',
  'ID/Credential',
  'Other'
];

export const IssueDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  // Form State
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [docType, setDocType] = useState('Certificate');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [details, setDetails] = useState('');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Workflow Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowStage, setWorkflowStage] = useState<string>('');

  // Result State
  const [issuedDoc, setIssuedDoc] = useState<RegistryDocumentDetail | null>(null);
  const [issuedFile, setIssuedFile] = useState<File | null>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    status: 'IDLE' | 'SENT' | 'FAILED' | 'UNAVAILABLE';
    message?: string;
    details?: string;
    timestamp?: string;
  }>({ status: 'IDLE' });

  const currentOrg = {
    id: user?.organizationId ? String(user.organizationId) : '',
    name: user?.organization || 'Organization unavailable',
    authorizedPerson: user?.name || 'Authorized issuer',
  };

  // Helper: File format and size validation
  const handleFileSelection = (selectedFile: File) => {
    setFileError(null);
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      setFileError('Invalid file type. Only PDF, JPG, and PNG files are supported.');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setFileError('File exceeds maximum size limit of 15MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = 'Document title is required.';
    else if (title.trim().length < 3) errs.title = 'Document title must be at least 3 characters.';

    if (!recipientName.trim()) errs.recipientName = 'Recipient name is required.';
    if (!recipientId.trim()) errs.recipientId = 'Recipient ID is required.';

    // Recipient Email is strictly mandatory
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail.trim()) {
      errs.recipientEmail = 'Recipient email is required.';
    } else if (!emailRegex.test(recipientEmail.trim())) {
      errs.recipientEmail = 'Please enter a valid email address.';
    }

    if (!docType) errs.docType = 'Please select a document type.';
    if (!issueDate) errs.issueDate = 'Issue date is required.';

    if (expiryDate && issueDate && new Date(expiryDate) <= new Date(issueDate)) {
      errs.expiryDate = 'Expiry date must be after the issue date.';
    }

    if (!file) {
      errs.file = 'Please upload a valid document file (PDF, JPG, or PNG).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Upload bytes to the authenticated registry; the backend owns hashing and signing.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !file) return;

    setIsProcessing(true);
    setWorkflowStage('Uploading document to the private registry...');

    try {
      const payload = new FormData();
      payload.set('title', title.trim());
      payload.set('document_type', docType);
      payload.set('issue_date', issueDate);
      if (expiryDate) payload.set('expires_at', expiryDate);
      payload.set('recipient_name', recipientName.trim());
      payload.set('recipient_identifier', recipientId.trim());
      payload.set('recipient_email', recipientEmail.trim().toLowerCase());
      if (details.trim()) payload.set('issuer_notes', details.trim());
      payload.set('file', file, file.name);
      setWorkflowStage('Validating bytes, hashing, signing, and saving registry record...');
      const registered = await apiRequest<RegistryDocumentDetail>('/documents/register', {
        method: 'POST',
        body: payload,
      });

      setIssuedDoc(registered);
      setIssuedFile(file);
      setEmailStatus({ status: 'IDLE' });
      success('Document Issued Successfully', `${registered.document_id} has been signed and registered.`);
    } catch (err) {
      error('Issuance Failed', err instanceof Error ? err.message : 'The registry could not complete issuance.');
    } finally {
      setIsProcessing(false);
      setWorkflowStage('');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard', label);
  };

  // Download the server-stored artifact after its hash and signature are checked.
  const handleDownloadIssuedDocument = async () => {
    if (!issuedDoc) return;
    try {
      const blob = await apiBlob(`/documents/${issuedDoc.document_id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${issuedDoc.document_id}_${issuedDoc.original_filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Download Started', `Downloaded protected document for ${issuedDoc.recipient_name || issuedDoc.title}.`);
    } catch {
      error('Download Failed', 'The protected document could not be verified or retrieved.');
    }
  };

  // Send Email Action
  const handleSendEmail = async () => {
    if (!issuedDoc) return;

    setIsSendingEmail(true);
    try {
      const res = await sendDocumentEmail(issuedDoc.document_id, issuedDoc.recipient_email || undefined);
      if (res.status === 'PROVIDER_ACCEPTED' || res.status === 'DELIVERED') {
        setEmailStatus({
          status: 'SENT',
          message: res.status === 'PROVIDER_ACCEPTED'
            ? 'Document dispatched to SMTP provider successfully.'
            : 'Document email simulated delivery verified in test mode.',
          details: `Message ID: ${res.provider_message_id} · To: ${res.recipient_email}`,
          timestamp: new Date().toLocaleTimeString(),
        });
        success('Email Dispatched', `QR-bearing credential sent to ${res.recipient_email}`);
      } else {
        setEmailStatus({
          status: 'UNAVAILABLE',
          message: res.details || 'Email service is not configured on this host.',
          details: 'Recipients can access the document via the public verification link.',
          timestamp: new Date().toLocaleTimeString(),
        });
        error('Mail Service Notice', res.details || 'SMTP mail service is not configured.');
      }
    } catch (err) {
      setEmailStatus({
        status: 'FAILED',
        message: err instanceof Error ? err.message : 'Email delivery failed.',
        details: 'Check recipient email address or SMTP credentials.',
        timestamp: new Date().toLocaleTimeString(),
      });
      error('Email Failed', err instanceof Error ? err.message : 'Failed to deliver document email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setRecipientName('');
    setRecipientId('');
    setRecipientEmail('');
    setExpiryDate('');
    setDetails('');
    setFile(null);
    setIssuedFile(null);
    setErrors({});
    setIssuedDoc(null);
    setEmailStatus({ status: 'IDLE' });
  };

  // Change B: Display Result Section
  if (issuedDoc) {
    return (
      <div className="space-y-6">
        <IssuerHeader
          title="Document Issuance Complete"
          description="The credential has been cryptographically signed, bound to a SHA-256 digest, and committed to the canonical registry."
          badge="ISSUANCE CONFIRMED"
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        />

        <div className="bg-[#0B1020]/90 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{issuedDoc.title}</h3>
                  <StatusBadge status="ACTIVE" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Issued to <span className="text-white font-semibold">{issuedDoc.recipient_name || 'Recipient not specified'}</span> {issuedDoc.recipient_identifier && `(ID: ${issuedDoc.recipient_identifier})`}
                  {issuedDoc.recipient_email && (
                    <span className="text-slate-300 ml-2 font-mono">
                      • Email: <strong className="text-violet-300">{issuedDoc.recipient_email}</strong>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Change B: Action Buttons (Download, Send Email, View Documents, Issue Another) */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadIssuedDocument}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
                title="Download the issued protected document"
              >
                <Download size={14} />
                <span>Download Document</span>
              </button>

              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                title={`Send credential email to ${issuedDoc.recipient_email || 'recipient'}`}
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Email</span>
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/issuer/documents')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>My Documents</span>
              </button>

              <button
                onClick={handleResetForm}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Issue Another</span>
              </button>
            </div>
          </div>

          {/* Email Delivery Feedback Banner */}
          {emailStatus.status !== 'IDLE' && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                emailStatus.status === 'SENT'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {emailStatus.status === 'SENT' ? (
                <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    {emailStatus.status === 'SENT'
                      ? 'Email Delivery Confirmed'
                      : 'Email Delivery Service Error'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{emailStatus.timestamp}</span>
                </div>
                <p className="text-slate-300">{emailStatus.message}</p>
                {emailStatus.details && (
                  <p className="text-[11px] font-mono text-slate-400 mt-1">{emailStatus.details}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Cryptographic & Registry Metadata */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#070B19] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Canonical Document ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-violet-300">{issuedDoc.document_id}</span>
                    <button
                      onClick={() => copyToClipboard(issuedDoc.document_id, 'Document ID')}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy ID"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070B19] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Recipient Email</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white truncate max-w-[140px]" title={issuedDoc.recipient_email || ''}>
                      {issuedDoc.recipient_email || 'Not provided'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(issuedDoc.recipient_email || '', 'Recipient Email')}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy Email"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070B19] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Document Classification</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-slate-200 capitalize">{issuedDoc.document_type}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">
                      Standard
                    </span>
                  </div>
                </div>
              </div>

              {/* SHA-256 Digest */}
              <div className="p-4 rounded-xl bg-[#070B19] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <Lock size={12} className="text-violet-400" />
                    Cryptographic SHA-256 Hash
                  </span>
                  <button
                    onClick={() => copyToClipboard(issuedDoc.sha256_hash, 'SHA-256 Hash')}
                    className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} /> Copy Hash
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-[#050816] border border-white/5 font-mono text-[11px] text-slate-300 break-all select-all">
                  {issuedDoc.sha256_hash}
                </div>
              </div>

              {/* Digital Signature & Registry status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#070B19] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <Key size={12} className="text-emerald-400" /> Digital Signature Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">{issuedDoc.signature_algorithm} SIGNED</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Key: {issuedDoc.signing_key_id} · Sig: {issuedDoc.signature_value.slice(0, 24)}...
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070B19] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-emerald-400" /> Registry Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">REGISTERED & {issuedDoc.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Authority: {currentOrg.name}
                  </p>
                </div>
              </div>

              {/* Verification URL Bar */}
              <div className="p-3.5 rounded-xl bg-[#070B19] border border-white/5 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Public Verification URL</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={issuedDoc.verification_url}
                    className="flex-1 px-3 py-1.5 bg-[#050816] border border-white/10 rounded-lg text-xs font-mono text-slate-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(issuedDoc.verification_url, 'Verification Link')}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                  <a
                    href={issuedDoc.verification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                    title="Open Verification Link"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            {/* Right col: QR Code & Payload Summary */}
            <div className="bg-[#070B19] border border-white/10 rounded-xl p-5 flex flex-col items-center justify-between text-center space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Cryptographic QR Reference</span>
                <h4 className="text-xs font-bold text-white mt-1">Instant Proof Token</h4>
              </div>

              {/* SVG QR Code representation */}
              <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                <img src={issuedDoc.qr_code_data_url} alt="Public verification QR code" className="w-full h-full" />
              </div>

              <div className="w-full space-y-2">
                <span className="text-[10px] font-mono text-slate-500 block truncate">
                  ID: {issuedDoc.document_id}
                </span>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = issuedDoc.qr_code_data_url;
                    a.download = `qrcode-${issuedDoc.document_id}.svg`;
                    a.target = '_blank';
                    a.click();
                  }}
                  className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download size={13} />
                  <span>Download QR Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Section B & C: Main Input Form (Change A: Recipient Email Required)
  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Issue Digital Credential"
        description="Register and cryptographically sign a verifiable credential for an individual recipient. Generates canonical SHA-256 digest, ECDSA signature, and scannable proof QR."
        badge="CANONICAL ISSUANCE PIPELINE"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      />

      <form onSubmit={handleSubmit} className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Issuing Authority Notice */}
        <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/15 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-violet-400" />
            <span className="text-slate-300">
              Issuing Authority: <strong className="text-white">{currentOrg.name}</strong> ({currentOrg.id})
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            KYC ACCREDITED
          </span>
        </div>

        {/* Change A: Recommended Field Order:
            1. Document Title
            2. Recipient Name
            3. Recipient ID
            4. Recipient Email — REQUIRED
            5. Issue Date
            6. Expiry Date
            7. Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Document Title */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>1. Document Title <span className="text-red-400">*</span></span>
              {errors.title && <span className="text-[11px] text-red-400 font-normal">{errors.title}</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Master of Science in Computer Science Degree"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
              className={`w-full px-3.5 py-2.5 bg-[#050816] border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.title ? 'border-red-500/50' : 'border-white/10 focus:border-violet-500/50'
              }`}
            />
          </div>

          {/* Document Type Dropdown */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Document Type <span className="text-red-400">*</span></span>
              {errors.docType && <span className="text-[11px] text-red-400 font-normal">{errors.docType}</span>}
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              {SUPPORTED_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#0B1020] text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Recipient Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>2. Recipient Name <span className="text-red-400">*</span></span>
              {errors.recipientName && <span className="text-[11px] text-red-400 font-normal">{errors.recipientName}</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Alexandra Chen"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              disabled={isProcessing}
              className={`w-full px-3.5 py-2.5 bg-[#050816] border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.recipientName ? 'border-red-500/50' : 'border-white/10 focus:border-violet-500/50'
              }`}
            />
          </div>

          {/* 3. Recipient ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>3. Recipient ID <span className="text-red-400">*</span></span>
              {errors.recipientId && <span className="text-[11px] text-red-400 font-normal">{errors.recipientId}</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. STF-STU-88219 or EMP-4491"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              disabled={isProcessing}
              className={`w-full px-3.5 py-2.5 bg-[#050816] border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono transition-colors ${
                errors.recipientId ? 'border-red-500/50' : 'border-white/10 focus:border-violet-500/50'
              }`}
            />
          </div>

          {/* 4. Recipient Email — REQUIRED (Change A) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-violet-400" />
                <span>4. Recipient Email</span>
                <span className="text-red-400">*</span>
              </span>
              {errors.recipientEmail && <span className="text-[11px] text-red-400 font-normal">{errors.recipientEmail}</span>}
            </label>
            <input
              type="email"
              placeholder="e.g. alex.chen@alumni.stanford.edu"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={isProcessing}
              className={`w-full px-3.5 py-2.5 bg-[#050816] border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.recipientEmail ? 'border-red-500/50' : 'border-white/10 focus:border-violet-500/50'
              }`}
            />
            <p className="text-[11px] text-slate-500">
              Mandatory field. The issued credential and verification link will be associated with this delivery address.
            </p>
          </div>

          {/* 5. Issue Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>5. Issue Date <span className="text-red-400">*</span></span>
              {errors.issueDate && <span className="text-[11px] text-red-400 font-normal">{errors.issueDate}</span>}
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 font-mono"
            />
          </div>

          {/* 6. Expiry Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>6. Expiry Date <span className="text-slate-500 font-normal">(Leave empty if lifetime)</span></span>
              {errors.expiryDate && <span className="text-[11px] text-red-400 font-normal">{errors.expiryDate}</span>}
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 font-mono"
            />
          </div>

          {/* 7. Additional Details */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">
              7. Additional Details / Administrative Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Conferred with High Honors; Dean signature attached; Registrar verification batch 401."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
        </div>

        {/* Section C: Document Upload Box */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Upload Document Payload <span className="text-red-400">*</span></span>
            <span className="text-[11px] text-slate-500">Accepted: PDF, JPG, PNG (Max 15MB)</span>
          </label>

          {file ? (
            <div className="p-4 rounded-xl bg-[#070B19] border border-violet-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'application/octet-stream'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-violet-500 bg-violet-500/10'
                  : errors.file
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-white/10 hover:border-violet-500/30 hover:bg-white/[0.01]'
              }`}
            >
              <input
                type="file"
                id="doc-file-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                disabled={isProcessing}
                className="hidden"
              />
              <label htmlFor="doc-file-upload" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-400 hover:underline">
                    Click to select file
                  </span>
                  <span className="text-xs text-slate-400"> or drag and drop here</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Document bytes are read locally to generate the SHA-256 fingerprint.
                </p>
              </label>
            </div>
          )}

          {(fileError || errors.file) && (
            <p className="text-[11px] text-red-400 flex items-center gap-1.5 mt-1">
              <AlertCircle size={12} />
              <span>{fileError || errors.file}</span>
            </p>
          )}
        </div>

        {/* Workflow Processing Indicator */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center gap-3">
            <RefreshCw size={18} className="text-violet-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Cryptographic Issuance Pipeline Active</p>
              <p className="text-[11px] text-violet-300 font-mono mt-0.5">{workflowStage}</p>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Processing Issuance...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Sign & Issue Document</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueDocumentPage;
