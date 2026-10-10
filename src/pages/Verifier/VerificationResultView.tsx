import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ShieldAlert, AlertTriangle, FileText,
  Shield, Check, X, ArrowLeft, RefreshCw, BarChart2,
  Cpu, ExternalLink, Download, Layers, Eye
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { VerificationHistoryRecord, DocumentRecord } from '../../data/mockData';

interface VerificationResultViewProps {
  result: VerificationHistoryRecord;
  docDetails?: DocumentRecord;
  onVerifyAnother: () => void;
  onBackToOverview?: () => void;
}

export const VerificationResultView: React.FC<VerificationResultViewProps> = ({
  result,
  docDetails,
  onVerifyAnother,
  onBackToOverview
}) => {
  const navigate = useNavigate();

  const isVerified = result.result === 'VERIFIED';
  const isTampered = result.result === 'TAMPERED';
  const isUnverified = result.result === 'UNVERIFIED' || result.result === 'SUSPICIOUS';

  return (
    <div className="space-y-6">
      {/* 18.1 RESULT HEADER & FINAL VERDICT */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
          isVerified
            ? 'bg-gradient-to-br from-emerald-500/10 via-[#0B1020] to-[#070B19] border-emerald-500/30'
            : isTampered
            ? 'bg-gradient-to-br from-red-500/10 via-[#0B1020] to-[#070B19] border-red-500/30'
            : 'bg-gradient-to-br from-amber-500/10 via-[#0B1020] to-[#070B19] border-amber-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  isVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isTampered
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                FINAL VERDICT • MULTI-SIGNAL CONSENSUS
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {result.verificationId}</span>
            </div>

            <div className="flex items-center gap-3">
              {isVerified ? (
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={32} />
                </div>
              ) : isTampered ? (
                <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <ShieldAlert size={32} />
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertTriangle size={32} />
                </div>
              )}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                  {result.result === 'VERIFIED'
                    ? 'DOCUMENT VERIFIED'
                    : result.result === 'TAMPERED'
                    ? 'INTEGRITY FAILURE: TAMPERED'
                    : 'UNVERIFIED / INCONCLUSIVE'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isVerified
                    ? '100% cryptographic match against Genesis Ledger. Zero evidence of alteration.'
                    : isTampered
                    ? 'Forensic divergence detected. Submitted document conflicts with canonical record.'
                    : 'Could not establish sufficient trusted evidence from state registry oracle.'}
                </p>
              </div>
            </div>
          </div>

          {/* 17. TRUST SCORE DISPLAY */}
          <div className="flex items-center gap-4 bg-[#050816]/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex-shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Evidence Confidence</span>
              <span className="text-xs text-slate-500 font-mono">Consensus Metric</span>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  result.trustScore >= 80 ? 'text-emerald-400' : result.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {result.trustScore}
                <span className="text-sm font-normal text-slate-500 font-sans">/100</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Trust Score</span>
            </div>
          </div>
        </div>

        {/* Reasons summary list */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {result.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-300">
              {isVerified ? (
                <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : isTampered ? (
                <X size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-[11px] leading-tight">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DOCUMENT & ISSUER INFORMATION (Sections 6 & 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Information */}
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              <span>Document Identification</span>
            </h3>
            <span className="text-xs font-mono text-purple-300 font-bold uppercase">{result.documentType}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Document ID</span>
              <span className="font-mono text-purple-300 font-bold">{result.documentId}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Recipient Bearer</span>
              <span className="font-bold text-white">{result.recipientName}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Document Title</span>
              <span className="font-semibold text-slate-200 truncate block">{result.documentTitle}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Verification Date</span>
              <span className="font-mono text-slate-300">{result.verificationDate}</span>
            </div>
          </div>
        </div>

        {/* Trusted Issuer & Registry Verification (Sections 7 & 8) */}
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              <span>Issuer & Oracle Standing</span>
            </h3>
            <StatusBadge status={result.evidenceDetails.issuerStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Issuer Authority</span>
              <span className="font-bold text-white">{result.issuerOrg}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Issuer ID</span>
              <span className="font-mono text-slate-300">{result.issuerId}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Registry Oracle Status</span>
              <span className="font-mono text-emerald-400 font-bold">{result.evidenceDetails.registryStatus}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Method Used</span>
              <span className="font-mono text-cyan-400 font-bold uppercase">{result.method} Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION CHECKS MATRIX (Sections 9 to 14) */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" />
              <span>Multi-Signal Verification Checks</span>
            </h3>
            <p className="text-[11px] text-slate-400">Cryptographic, semantic, structural, and AI forensic analysis layers</p>
          </div>
          <span className="text-xs font-mono text-slate-400">8 Validation Checkpoints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* SHA-256 Hash */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">9. SHA-256 Hash</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result.evidenceDetails.hashStatus === 'MATCH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {result.evidenceDetails.hashStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {result.evidenceDetails.hashStatus === 'MATCH' ? 'Computed digest matches registered genesis state.' : 'Calculated file digest differs from ledger.'}
            </p>
          </div>

          {/* Digital Signature */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">10. ECDSA Signature</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result.evidenceDetails.signatureStatus === 'VALID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {result.evidenceDetails.signatureStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {result.evidenceDetails.signatureStatus === 'VALID' ? 'Signed with issuer authorized secp256k1 key.' : 'Mathematical signature verification failed.'}
            </p>
          </div>

          {/* OCR Field Matching */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">11. OCR Fields</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result.evidenceDetails.ocrMatch ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {result.evidenceDetails.ocrMatch ? 'MATCH' : 'MISMATCH'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {result.evidenceDetails.ocrMatch ? 'Extracted text matches canonical parameters.' : 'Extracted field divergence detected.'}
            </p>
          </div>

          {/* Metadata Analysis */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">12. Metadata</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result.evidenceDetails.metadataStatus === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {result.evidenceDetails.metadataStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {result.evidenceDetails.metadataStatus === 'NORMAL' ? 'Producer & timestamp consistency confirmed.' : 'Embedded object software anomaly flag.'}
            </p>
          </div>

          {/* Visual Analysis */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">13. Visual Layout</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result.evidenceDetails.visualStatus === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
              }`}>
                {result.evidenceDetails.visualStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {result.evidenceDetails.visualStatus === 'NORMAL' ? 'Font family and alignment adhere to baseline.' : 'Kerning spacing irregularity detected.'}
            </p>
          </div>

          {/* AI Forensics */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">14. AI Forensics</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result.evidenceDetails.aiForensicRisk === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {result.evidenceDetails.aiForensicRisk} RISK
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {result.evidenceDetails.aiForensicRisk === 'LOW' ? 'No neural boundary artifacts detected.' : 'Altered region boundary discrepancy flagged.'}
            </p>
          </div>

          {/* Registry Match */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">8. Oracle Registry</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Authority recognized in state registry.</p>
          </div>

          {/* QR Payload Match */}
          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-mono uppercase">QR Payload</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Signed QR token resolves to matching document.</p>
          </div>
        </div>
      </div>

      {/* FIELD COMPARISONS (Section 11) */}
      {docDetails?.ocrExtractedText && (
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Semantic Field Verification</h3>
            <span className="text-xs font-mono text-slate-400">OCR vs Canonical Record</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Field Name</th>
                  <th className="py-2.5 px-3">Trusted Value</th>
                  <th className="py-2.5 px-3">Submitted Value</th>
                  <th className="py-2.5 px-3 text-right">Match State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {Object.entries(docDetails.ocrExtractedText).map(([key, val]) => {
                  const isTamperedField = isTampered && (
                    val.includes('[ALTERED]') ||
                    key.toLowerCase().includes('cgpa') ||
                    key.toLowerCase().includes('result') ||
                    result.reasons.some((r) => r.toLowerCase().includes(key.toLowerCase()))
                  );
                  return (
                    <tr key={key} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-slate-300 font-sans capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">{val.replace(' [ALTERED]', '')}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {isTamperedField ? <span className="text-red-400 font-bold">{val}</span> : val}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isTamperedField ? (
                          <span className="text-red-400 font-bold">✗ MISMATCH</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ MATCH</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 18.2 ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/verifier/overview')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Overview</span>
          </button>
          <button
            onClick={onVerifyAnother}
            className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Verify Another Document</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/verifier/dna?id=${encodeURIComponent(result.documentId)}`)}
            className="px-4 py-2 rounded-xl bg-[#050816] hover:bg-white/5 border border-white/10 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Cpu size={14} className="text-purple-400" />
            <span>View Document DNA</span>
          </button>
          <button
            onClick={() => navigate(`/verifier/forensics?id=${encodeURIComponent(result.documentId)}`)}
            className="px-4 py-2 rounded-xl bg-[#050816] hover:bg-white/5 border border-white/10 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} className="text-cyan-400" />
            <span>Forensic Analysis</span>
          </button>
          <button
            onClick={() => navigate(`/verifier/reports?id=${encodeURIComponent(result.documentId)}`)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
