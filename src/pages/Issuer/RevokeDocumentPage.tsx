import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck,
  Search, ArrowRight, RefreshCw, FileText, History,
  Lock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { apiRequest, type IssuerDocumentView, type RegistryDocumentDetail } from '../../utils/documentRegistryApi';
import { useIssuerDocuments } from '../../hooks/useIssuerDocuments';

const REVOCATION_REASONS = [
  'Incorrect Information',
  'Duplicate Document',
  'Issued by Mistake',
  'Fraudulent Document',
  'Other'
];

export const RevokeDocumentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents: issuerDocs, refresh } = useIssuerDocuments(user);
  const { success, error } = useToast();

  const queryDocId = searchParams.get('id') || searchParams.get('docId') || '';
  const [selectedDocId, setSelectedDocId] = useState<string>(queryDocId);
  const [reason, setReason] = useState<string>('Incorrect Information');
  const [explanation, setExplanation] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [revocationResult, setRevocationResult] = useState<{
    docId: string;
    revokedAt: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (queryDocId) {
      setSelectedDocId(queryDocId);
    } else if (issuerDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(issuerDocs[0].id);
    }
  }, [queryDocId, issuerDocs]);

  const currentDoc = useMemo<IssuerDocumentView | null>(() => {
    return issuerDocs.find((d) => d.id === selectedDocId) || null;
  }, [issuerDocs, selectedDocId]);

  // Eligibility verification
  const isAlreadyRevoked = currentDoc?.status === 'revoked';

  // Section D: Execute Revocation
  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentDoc) {
      error('Selection Error', 'Please select a document to revoke.');
      return;
    }

    if (isAlreadyRevoked) {
      error('Already Revoked', 'This document is already revoked and cannot be revoked again.');
      return;
    }

    if (!reason) {
      error('Missing Reason', 'Please select an authorized revocation reason.');
      return;
    }

    if (!confirmed) {
      error('Confirmation Required', 'You must acknowledge the irreversible effects of credential revocation.');
      return;
    }

    setIsProcessing(true);

    try {
      const fullReason = explanation.trim() ? `${reason}: ${explanation.trim()}` : reason;
      const result = await apiRequest<RegistryDocumentDetail>(`/documents/${encodeURIComponent(currentDoc.id)}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason: fullReason }),
      });

      setRevocationResult({
        docId: currentDoc.id,
        revokedAt: result.revoked_at || new Date().toISOString(),
        reason: fullReason
      });
      refresh();

      success('Document Revoked', `${currentDoc.id} has been permanently revoked.`);
    } catch (err) {
      error('Revocation Error', err instanceof Error ? err.message : 'Failed to execute revocation request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Revoke Digital Credential"
        description="Permanently revoke an issued document in the canonical registry due to administrative error, data inaccuracy, or fraud. Revocation permanently invalidates all public and verifier checks."
        badge="REVOCATION PROTOCOL"
        badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      />

      {/* Confirmed Revocation Banner */}
      {revocationResult && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 flex-shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Revocation Recorded in Canonical Ledger
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Credential <strong className="font-mono text-red-300">{revocationResult.docId}</strong> is officially marked <span className="font-bold text-red-400">REVOKED</span>.
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Reason: {revocationResult.reason} • Recorded: {revocationResult.revokedAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/issuer/documents')}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
            >
              Back to Documents
            </button>
            <button
              onClick={() => navigate(`/issuer/history?id=${revocationResult.docId}`)}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20"
            >
              View in History
            </button>
          </div>
        </div>
      )}

      {/* SECTION A: SELECT DOCUMENT */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Select Credential to Revoke
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setRevocationResult(null);
              setConfirmed(false);
            }}
            disabled={isProcessing}
            className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer font-mono"
          >
            {issuerDocs.map((doc) => (
              <option key={doc.id} value={doc.id} className="bg-[#0B1020]">
                {doc.id} — {doc.recipientName} ({doc.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {currentDoc && (
            <span className="text-xs text-slate-400 font-mono">
              Status: <StatusBadge status={currentDoc.status.toUpperCase()} />
            </span>
          )}
        </div>
      </div>

      {!currentDoc ? (
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <ShieldAlert size={32} className="mx-auto text-slate-500" />
          <h3 className="text-sm font-bold text-white">No Document Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please choose a credential from your organization repository to inspect its revocation eligibility.
          </p>
        </div>
      ) : (
        <form onSubmit={handleRevokeSubmit} className="space-y-6">
          {/* SECTION B: DOCUMENT INFORMATION PREVIEW */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Credential Subject Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs bg-[#070B19] p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Document ID</span>
                <span className="font-mono text-violet-300 font-bold mt-0.5 block">{currentDoc.id}</span>
              </div>
              <div className="lg:col-span-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Document Title</span>
                <span className="text-white font-semibold mt-0.5 block truncate">{currentDoc.title}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Recipient Name</span>
                <span className="text-slate-200 mt-0.5 block">{currentDoc.recipientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Document Type</span>
                <span className="text-slate-300 mt-0.5 block capitalize">{currentDoc.documentType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={currentDoc.status.toUpperCase()} />
                </div>
              </div>
            </div>

            {/* Check already revoked status */}
            {isAlreadyRevoked && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-red-300">This document has already been revoked</p>
                  <p className="text-slate-300 mt-0.5">
                    Revocation recorded on <span className="font-mono">{currentDoc.revokedAt || 'Past Date'}</span>.
                    {currentDoc.revocationReason && ` Reason: "${currentDoc.revocationReason}"`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    No further revocation action can be taken on this record.
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isAlreadyRevoked && (
            <>
              {/* SECTION B: REVOCATION REASON & DETAILS */}
              <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Revocation Justification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Select Revocation Reason <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
                    >
                      {REVOCATION_REASONS.map((r) => (
                        <option key={r} value={r} className="bg-[#0B1020]">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Additional Explanation / Administrative Audit Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Provide specific notes regarding why this credential was recalled..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-3.5 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: CONFIRMATION & WARNING */}
              <div className="bg-[#0B1020]/90 border border-red-500/20 rounded-2xl p-6 space-y-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-red-400">Irreversible Action Warning</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Revoking this credential will update the authoritative canonical ledger immediately. All subsequent verification attempts through the public verification portal, verifier dashboards, and API endpoints will report this credential as <strong>REVOKED</strong> with zero trust score.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-[#070B19] border border-white/5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    disabled={isProcessing}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                    I confirm that I am an authorized representative of <strong>{user?.organization || 'my organization'}</strong> and intend to permanently revoke <strong>{currentDoc.id}</strong>.
                  </span>
                </label>

                {/* Submit Action */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!confirmed || isProcessing}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Processing Revocation...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={14} />
                        <span>Confirm & Revoke Credential</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default RevokeDocumentPage;
