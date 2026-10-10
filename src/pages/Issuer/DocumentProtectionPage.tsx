import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Key, QrCode, CheckCircle2,
  Copy, ExternalLink, Download, AlertTriangle,
  Search, ShieldCheck, Cpu, RefreshCw, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { apiRequest, type RegistryDocumentDetail } from '../../utils/documentRegistryApi';
import { useIssuerDocuments } from '../../hooks/useIssuerDocuments';

export const DocumentProtectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents: issuerDocs, isLoading: isLoadingDocuments, error: loadError } = useIssuerDocuments(user);
  const { success } = useToast();

  const queryDocId = searchParams.get('id') || searchParams.get('docId') || '';
  const [selectedId, setSelectedId] = useState<string>(queryDocId);
  const [searchQuery, setSearchQuery] = useState('');
  const [registryDetail, setRegistryDetail] = useState<RegistryDocumentDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Set default selected document if none specified
  useEffect(() => {
    if (queryDocId) {
      setSelectedId(queryDocId);
    } else if (issuerDocs.length > 0 && !selectedId) {
      setSelectedId(issuerDocs[0].id);
    }
  }, [queryDocId, issuerDocs]);

  // Active selected document record
  const currentDoc = useMemo(() => {
    return issuerDocs.find((d) => d.id === selectedId) || null;
  }, [issuerDocs, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setRegistryDetail(null);
      return;
    }
    let isCurrent = true;
    setRegistryDetail(null);
    setDetailError(null);
    apiRequest<RegistryDocumentDetail>(`/documents/${encodeURIComponent(selectedId)}`)
      .then(record => { if (isCurrent) setRegistryDetail(record); })
      .catch(requestError => { if (isCurrent) setDetailError(requestError instanceof Error ? requestError.message : 'Unable to verify this registry record.'); });
    return () => { isCurrent = false; };
  }, [selectedId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard', label);
  };

  // Integrity assessment based on authoritative record state
  const integrityStatus = useMemo(() => {
    if (!currentDoc) return { label: 'Unable to Verify', color: 'text-slate-400', bg: 'bg-slate-500/10' };
    if (currentDoc.status === 'revoked') {
      return { label: 'Credential Revoked', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    }
    if (registryDetail && (registryDetail.hash_matches === false || registryDetail.signature_valid === false)) {
      return { label: 'Integrity Mismatch', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    }
    if (!registryDetail || registryDetail.hash_matches === null || registryDetail.signature_valid === null) {
      return { label: 'Verification Inconclusive', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    }
    return { label: 'Integrity Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  }, [currentDoc, registryDetail]);

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Document Protection & Cryptographic Audit"
        description="Inspect document integrity, ECDSA P-256 signature validation, canonical SHA-256 fingerprint, and authoritative registry commitment."
        badge="SECURITY REPOSITORY"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      />

      {loadError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{loadError}</div>}
      {detailError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{detailError}</div>}
      {isLoadingDocuments && <div role="status" className="text-xs text-slate-400">Loading registered documents...</div>}

      {/* SECTION A: SELECT DOCUMENT */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Select Credential from Organization Repository
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 cursor-pointer font-mono"
          >
            {issuerDocs.map((doc) => (
              <option key={doc.id} value={doc.id} className="bg-[#0B1020]">
                {doc.id} — {doc.recipientName} ({doc.title})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/issuer/documents')}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText size={14} />
            <span>Browse All Documents</span>
          </button>
        </div>
      </div>

      {/* SECTION B: SECURITY DETAILS */}
      {!currentDoc ? (
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Shield size={32} className="mx-auto text-slate-500" />
          <h3 className="text-sm font-bold text-white">No Document Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please choose an issued credential from the dropdown above to inspect its cryptographic protection and registry status.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Integrity Status Card */}
          <div className={`p-5 rounded-2xl border ${integrityStatus.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-violet-400">
                <ShieldCheck size={26} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Authoritative Security State
                </span>
                <h3 className={`text-xl font-black font-mono tracking-tight mt-0.5 ${integrityStatus.color}`}>
                  {integrityStatus.label}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record ID: <strong className="text-white font-mono">{currentDoc.id}</strong> • Recipient:{' '}
                  <span className="text-white">{currentDoc.recipientName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={currentDoc.status.toUpperCase()} />
              <button
                onClick={() => navigate(`/issuer/history?id=${currentDoc.id}`)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <span>View Lifecycle</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Hashes, Signatures & Registry */}
            <div className="lg:col-span-2 space-y-4">
              {/* SHA-256 Hash Card */}
              <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-violet-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      SHA-256 Cryptographic Hash
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentDoc.sha256Hash, 'SHA-256 Digest')}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy size={12} /> Copy Digest
                  </button>
                </div>

                <div className="p-3 bg-[#050816] rounded-xl border border-white/5 font-mono text-xs text-slate-200 break-all select-all leading-relaxed">
                  {currentDoc.sha256Hash}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Algorithm</span>
                    <span className="font-semibold text-slate-200">SHA-256 (FIPS 180-4)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Digest Size</span>
                    <span className="font-semibold text-slate-200">256 bits (32 bytes)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Verification State</span>
                    <span className={`font-semibold font-mono ${registryDetail?.hash_matches === true ? 'text-emerald-400' : registryDetail?.hash_matches === false ? 'text-red-400' : 'text-amber-400'}`}>
                      {registryDetail?.hash_matches === true ? 'MATCHED EXACT' : registryDetail?.hash_matches === false ? 'HASH MISMATCH' : 'NOT VERIFIED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Signature Card */}
              <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Asymmetric Digital Signature
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${registryDetail?.signature_valid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {registryDetail?.signature_valid ? 'ECDSA P-256 VALID' : 'SIGNATURE UNVERIFIED'}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Signature Hex Payload (DER format)
                  </span>
                  <div className="p-2.5 bg-[#050816] rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 break-all select-all">
                    {currentDoc.ecdsaSignature}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Signing Authority Public Key
                  </span>
                  <div className="p-2.5 bg-[#050816] rounded-xl border border-white/5 font-mono text-[11px] text-slate-400 break-all select-all">
                    {currentDoc.publicKey}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Authorized Signer</span>
                    <span className="text-white font-semibold">{currentDoc.issuerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Organization Domain</span>
                    <span className="text-violet-300 font-mono">{currentDoc.issuerOrg}</span>
                  </div>
                </div>
              </div>

              {/* Trusted Registry Record */}
              <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Trusted Canonical Registry Ledger
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    CANONICAL STATE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#070B19] p-3.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Registry Status</span>
                    <span className={`font-mono font-bold mt-0.5 block ${currentDoc.status === 'revoked' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {currentDoc.status === 'revoked' ? 'REVOCATION RECORDED' : registryDetail?.hash_matches && registryDetail.signature_valid ? 'ACTIVE & VERIFIED' : 'INTEGRITY UNVERIFIED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Issuance Date</span>
                    <span className="font-mono text-slate-200 mt-0.5 block">{currentDoc.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Verifications</span>
                    <span className="font-mono text-white mt-0.5 block font-bold">Not tracked</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Trust Score</span>
                    <span className="font-mono text-emerald-400 font-bold mt-0.5 block">Cryptographic checks only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: QR Verification & Proof Token */}
            <div className="space-y-4">
              <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Cryptographic Proof Token
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">Scannable Verification QR</h4>
                </div>

                <div className="w-48 h-48 bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center">
                  {registryDetail ? <img src={registryDetail.qr_code_data_url} alt="Public verification QR code" className="w-full h-full" /> : <RefreshCw size={20} className="animate-spin text-slate-500" />}
                </div>

                <div className="w-full space-y-2">
                  {registryDetail && <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = registryDetail.qr_code_data_url;
                      a.download = `qrcode-${currentDoc.id}.svg`;
                      a.click();
                    }}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download size={13} />
                    <span>Download QR Image</span>
                  </button>}

                  <a
                    href={registryDetail?.verification_url || currentDoc.qrPayload}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-violet-600/20"
                  >
                    <ExternalLink size={13} />
                    <span>Test Public Verification</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentProtectionPage;
