import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Share2, CheckCircle2, AlertTriangle, XCircle,
  Shield, Check, ExternalLink, Binary, Lock, Eye, Layers, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import type { VerificationHistoryRecord } from '../../data/mockData';

export const VerificationReportsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifications } = useApp();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [selectedRecord, setSelectedRecord] = useState<VerificationHistoryRecord>(
    verifications[0]
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || params.get('docId');
    if (id) {
      const match = verifications.find(
        v => v.documentId.toLowerCase() === id.toLowerCase() || v.verificationId.toLowerCase() === id.toLowerCase()
      );
      if (match) setSelectedRecord(match);
    }
  }, [location.search, verifications]);

  const isVerified = selectedRecord.result === 'VERIFIED';
  const isTampered = selectedRecord.result === 'TAMPERED';
  const isSuspicious = selectedRecord.result === 'SUSPICIOUS';

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/verify/${selectedRecord.documentId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    success('Share Link Copied', `Attestation URL for ${selectedRecord.verificationId} copied to clipboard.`);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsExporting(true);
    info('Compiling Cryptographic PDF', 'Assembling official digital seal and SHA-256 attestation...');
    setTimeout(() => {
      setIsExporting(false);
      window.print();
      success('Dossier Generated', 'Official verification report sent to print / PDF driver.');
    }, 600);
  };

  // Build check matrix from evidenceDetails
  const evidenceChecks = selectedRecord ? [
    {
      name: 'SHA-256 Hash Verification',
      status: selectedRecord.evidenceDetails.hashStatus === 'MATCH' ? 'PASSED' : selectedRecord.evidenceDetails.hashStatus === 'NOT_AVAILABLE' ? 'N/A' : 'FAILED',
      details: `File digest status: ${selectedRecord.evidenceDetails.hashStatus}`
    },
    {
      name: 'ECDSA Digital Signature',
      status: selectedRecord.evidenceDetails.signatureStatus === 'VALID' ? 'PASSED' : selectedRecord.evidenceDetails.signatureStatus === 'NOT_AVAILABLE' ? 'N/A' : 'FAILED',
      details: `Signature status: ${selectedRecord.evidenceDetails.signatureStatus}`
    },
    {
      name: 'Issuer Registry Status',
      status: selectedRecord.evidenceDetails.issuerStatus === 'VERIFIED' ? 'PASSED' : 'FAILED',
      details: `Issuer standing: ${selectedRecord.evidenceDetails.issuerStatus}`
    },
    {
      name: 'Ledger / CRL Registry',
      status: selectedRecord.evidenceDetails.registryStatus === 'ACTIVE' ? 'PASSED' : 'FAILED',
      details: `Registry state: ${selectedRecord.evidenceDetails.registryStatus}`
    },
    {
      name: 'OCR Field Matching',
      status: selectedRecord.evidenceDetails.ocrMatch ? 'PASSED' : 'FAILED',
      details: selectedRecord.evidenceDetails.ocrMatch ? 'All OCR fields match canonical values' : 'OCR field divergence detected'
    },
    {
      name: 'Document Metadata',
      status: selectedRecord.evidenceDetails.metadataStatus === 'NORMAL' ? 'PASSED' : selectedRecord.evidenceDetails.metadataStatus === 'WARNING' ? 'WARNING' : 'FAILED',
      details: `Metadata status: ${selectedRecord.evidenceDetails.metadataStatus}`
    },
    {
      name: 'Visual Integrity',
      status: selectedRecord.evidenceDetails.visualStatus === 'NORMAL' ? 'PASSED' : selectedRecord.evidenceDetails.visualStatus === 'WARNING' ? 'WARNING' : 'FAILED',
      details: `Visual status: ${selectedRecord.evidenceDetails.visualStatus}`
    },
    {
      name: 'AI Forensic Risk Score',
      status: selectedRecord.evidenceDetails.aiForensicRisk === 'LOW' ? 'PASSED' : selectedRecord.evidenceDetails.aiForensicRisk === 'MEDIUM' ? 'WARNING' : 'FAILED',
      details: `AI forensic risk: ${selectedRecord.evidenceDetails.aiForensicRisk}`
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Verification Reports</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative, tamper-evident cryptographic reports and bulk audit attestations for compliance and archiving.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-slate-400" />}
            {copiedLink ? 'Link Copied' : 'Share Attestation'}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating PDF...' : 'Download Official PDF'}
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'single'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Document Attestation
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'bulk'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulk Batch Audit Reports
          </button>
        </div>

        {activeTab === 'single' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Audit:</span>
            <select
              value={selectedRecord.verificationId}
              onChange={(e) => {
                const target = verifications.find(v => v.verificationId === e.target.value);
                if (target) setSelectedRecord(target);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {verifications.map((v) => (
                <option key={v.verificationId} value={v.verificationId}>
                  {v.documentId} ({v.result} - {v.trustScore}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Single Document Attestation Report View */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          {/* Printable Formal Document Report Sheet */}
          <div className="p-8 md:p-12 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-4 text-slate-200">
            {/* Guilloche & Security Pattern Backdrop */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-4 right-4 opacity-10 print:opacity-30">
              <Shield className="w-32 h-32 text-indigo-400" />
            </div>

            {/* Header: Official VeriProof Header */}
            <div className="border-b-2 border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <Shield className="w-6 h-6" />
                  <span className="text-xl font-black tracking-wider uppercase">VERIPROOF</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  OFFICIAL VERIFICATION REPORT
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  INTEGRITY ATTESTATION • DIGITAL FORENSIC AUDIT RECORD
                </p>
              </div>

              <div className="text-left md:text-right font-mono text-xs text-slate-400">
                <div>REPORT ID: <strong className="text-white">{selectedRecord.verificationId}</strong></div>
                <div>AUDIT DATE: <strong className="text-white">{selectedRecord.verificationDate}</strong></div>
                <div>METHOD: <strong className="text-white">{selectedRecord.method}</strong></div>
              </div>
            </div>

            {/* Verdict Banner */}
            <div className={`p-6 rounded-xl border mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              isVerified
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : isTampered
                ? 'bg-rose-950/20 border-rose-500/40'
                : 'bg-amber-950/20 border-amber-500/40'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  isVerified ? 'bg-emerald-500/20 text-emerald-400' :
                  isTampered ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {isVerified && <CheckCircle2 className="w-8 h-8" />}
                  {isTampered && <XCircle className="w-8 h-8" />}
                  {isSuspicious && <AlertTriangle className="w-8 h-8" />}
                  {!isVerified && !isTampered && !isSuspicious && <AlertTriangle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-wide text-white">
                    VERDICT: {selectedRecord.result}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    {isVerified && 'Document integrity verified with bit-level match against canonical authority records. Digital signature is cryptographically valid.'}
                    {isTampered && 'Document exhibits material integrity failure. Cryptographic signature and field hash divergence confirmed against original registry.'}
                    {isSuspicious && 'Document raised forensic anomalies. Multi-signal analysis yielded inconclusive or partially failed evidence.'}
                    {!isVerified && !isTampered && !isSuspicious && 'Document could not be conclusively matched against active trusted registry records.'}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="text-xs uppercase text-slate-400 font-mono block">Calculated Trust Score</span>
                <span className={`text-4xl font-black font-mono ${
                  isVerified ? 'text-emerald-400' : isTampered ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {selectedRecord.trustScore}<span className="text-base text-slate-500">/100</span>
                </span>
              </div>
            </div>

            {/* Document & Issuer Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Document Information
                </h4>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <dt className="text-slate-400">Document ID:</dt>
                    <dd className="font-mono text-white font-medium">{selectedRecord.documentId}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <dt className="text-slate-400">Document Type:</dt>
                    <dd className="text-white">{selectedRecord.documentType}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <dt className="text-slate-400">Subject / Recipient:</dt>
                    <dd className="text-white font-medium">{selectedRecord.recipientName || 'Not Stated'}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-400">Audit Timestamp:</dt>
                    <dd className="font-mono text-slate-300">{selectedRecord.verificationDate}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Issuing Authority
                </h4>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <dt className="text-slate-400">Issuer Name:</dt>
                    <dd className="text-white font-medium">{selectedRecord.issuerOrg}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <dt className="text-slate-400">Registry Status:</dt>
                    <dd className={`font-semibold ${selectedRecord.evidenceDetails.issuerStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedRecord.evidenceDetails.issuerStatus}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <dt className="text-slate-400">Public Key Status:</dt>
                    <dd className="text-slate-300 font-mono">{selectedRecord.evidenceDetails.signatureStatus}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-400">Ledger Registry:</dt>
                    <dd className={`font-semibold ${selectedRecord.evidenceDetails.registryStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedRecord.evidenceDetails.registryStatus}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Multi-Signal Verification Checks */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-cyan-400" /> Multi-Vector Verification Checks (8 Checks)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {evidenceChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-white">{check.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{check.details}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      check.status === 'PASSED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : check.status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons / Evidentiary Findings */}
            <div className="mb-8 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Primary Findings & Rationale
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedRecord.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      isVerified ? 'bg-emerald-400' : isTampered ? 'bg-rose-400' : 'bg-amber-400'
                    }`} />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Report Digital Footprint & Attestation Signature */}
            <div className="pt-6 border-t-2 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
              <div>
                <span>SUBMITTED HASH: </span>
                <span className="text-slate-400 select-all">{selectedRecord.submittedHash || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SECURE AUDIT CERTIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bulk Verification Audit Reports */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bulk Audit Sessions</h3>
                <p className="text-xs text-slate-400">Consolidated reports from multi-document batch verification runs.</p>
              </div>
              <button
                onClick={() => navigate('/verifier/bulk')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
              >
                Launch New Bulk Batch
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  batchId: 'BATCH-2026-OCT-09A',
                  title: 'Spring 2026 Faculty & Graduate Certifications',
                  date: '2026-10-09 02:40',
                  total: 10, verified: 7, tampered: 2, unverified: 1
                },
                {
                  batchId: 'BATCH-2026-OCT-08B',
                  title: 'Ministry of Health Medical Licensure Verification',
                  date: '2026-10-08 17:15',
                  total: 45, verified: 42, tampered: 1, unverified: 2
                },
                {
                  batchId: 'BATCH-2026-OCT-05F',
                  title: 'ISO Compliance Supplier Accreditations',
                  date: '2026-10-05 11:30',
                  total: 28, verified: 24, tampered: 3, unverified: 1
                }
              ].map((batch) => (
                <div
                  key={batch.batchId}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-semibold text-xs">{batch.batchId}</span>
                      <span className="text-xs font-bold text-white">{batch.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                      <span>Date: {batch.date}</span>
                      <span>Total: {batch.total}</span>
                      <span className="text-emerald-400 font-medium">✓ {batch.verified}</span>
                      <span className="text-rose-400 font-medium">✗ {batch.tampered}</span>
                      <span className="text-amber-400 font-medium">⚠ {batch.unverified}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => info('Exporting Batch CSV', `Downloading report for ${batch.batchId}`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      Download Results
                    </button>
                    <button
                      onClick={() => navigate('/verifier/bulk')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-medium text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Batch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
