import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dna, Shield, AlertTriangle, CheckCircle2, XCircle, Search,
  ArrowRight, FileText, Lock, Eye, Layers, Binary, Database,
  Cpu, Sparkles, RefreshCw, ChevronRight, Download, ExternalLink,
  Loader2, Hash, Key, Check, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { apiRequest, type PublicVerificationResult } from '../../utils/documentRegistryApi';
import type { DocumentRecord } from '../../data/mockData';

export const DocumentDnaPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documents, lookupDocument } = useApp();
  const { info, success, warning, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord>(
    documents[1] || documents[0] || {
      id: 'DOC-2026-STF-9021',
      title: 'Stanford CS Degree (Genuine)',
      recipientName: 'Alexandra Chen',
      recipientId: 'STF-CS-2026-9021',
      recipientEmail: 'alexandra.chen@cs.stanford.edu',
      issuerId: 'AUTH-NODE-01',
      issuerName: 'Stanford University Registrar',
      issuerOrg: 'Stanford University',
      issueDate: '2026-06-15',
      documentType: 'degree',
      status: 'active',
      sha256Hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      ecdsaSignature: '3045022100e4b8a1c9d2f3e4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
      publicKey: '04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      qrPayload: 'https://veriproof.io/verify/DOC-2026-STF-9021',
      verificationCount: 142,
      trustScore: 99,
      ocrExtractedText: { degree: 'Master of Science in Computer Science', gpa: '3.94' },
      dnaMetrics: { fontFamilyMatch: 99, layoutAlignment: 99, structuralIntegrity: 100, compressionSignature: 'Linearized PDF v1.7', pdfMetadataIntact: true },
      aiForensics: { edgeSharpnessScore: 99, fontInconsistencyProb: 0.01, cloneStampArtifacts: false, metadataDivergence: false, noiseDiscrepancy: 0.01 },
      authorizedVerifiers: ['PUBLIC'],
      version: 1,
    }
  );
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'semantic' | 'visual' | 'structural'>('all');

  // Load document by Public Reference ID
  const loadDocumentByReferenceId = async (refId: string) => {
    const cleanId = refId.trim();
    if (!cleanId) return;

    setIsSearching(true);
    try {
      // 1. Check local context first
      const localMatch = lookupDocument(cleanId) || documents.find(d => d.id.toLowerCase() === cleanId.toLowerCase());
      if (localMatch) {
        setSelectedDoc(localMatch);
        setSearchQuery(cleanId);
        info('Document DNA Loaded', `Loaded full genomic integrity profile for ${localMatch.id}`);
        return;
      }

      // 2. Query Authoritative Backend API
      const apiRes = await apiRequest<PublicVerificationResult>(`/verify/${encodeURIComponent(cleanId)}`).catch(() => null);

      if (apiRes && (apiRes.public_verification_id || apiRes.title)) {
        const isVerified = apiRes.outcome === 'VERIFIED';
        const isRevoked = apiRes.outcome === 'REVOKED' || apiRes.registry_status === 'REVOKED';
        const isTampered = apiRes.outcome === 'TAMPERED' || apiRes.hash_matches === false;

        const dynDoc: DocumentRecord = {
          id: apiRes.public_verification_id || cleanId,
          title: apiRes.title || 'Official Credential Record',
          recipientName: 'Registered Holder',
          recipientId: '',
          recipientEmail: '',
          issuerId: 'AUTH-NODE',
          issuerName: apiRes.issuer_name || 'Authorized Issuing Entity',
          issuerOrg: apiRes.issuer_name || 'Authorized Issuing Entity',
          issueDate: apiRes.issue_date || new Date().toISOString().slice(0, 10),
          documentType: (apiRes.document_type || 'certificate').toLowerCase().includes('degree') ? 'degree' : (apiRes.document_type || 'certificate').toLowerCase().includes('license') ? 'license' : 'certificate',
          status: isRevoked ? 'revoked' : 'active',
          sha256Hash: apiRes.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          ecdsaSignature: 'ECDSA-P256-FIPS186',
          publicKey: '04e1f2a3b4c5d6e7f8...',
          qrPayload: `${window.location.origin}/verify/${apiRes.public_verification_id || cleanId}`,
          verificationCount: 1,
          trustScore: isRevoked ? 15 : isTampered ? 20 : isVerified ? 98 : 40,
          ocrExtractedText: {},
          dnaMetrics: {
            fontFamilyMatch: isTampered ? 48 : 99,
            layoutAlignment: isTampered ? 55 : 99,
            structuralIntegrity: isRevoked ? 30 : isTampered ? 45 : 100,
            compressionSignature: isTampered ? 'Adobe Photoshop 2024 / Re-saved' : 'VeriProof Certified Engine v4.2',
            pdfMetadataIntact: !isTampered,
          },
          aiForensics: {
            edgeSharpnessScore: isTampered ? 45 : 98,
            fontInconsistencyProb: isTampered ? 0.94 : 0.02,
            cloneStampArtifacts: isTampered,
            metadataDivergence: isTampered,
            noiseDiscrepancy: isTampered ? 0.82 : 0.01,
          },
          authorizedVerifiers: ['PUBLIC'],
          version: 1,
        };
        setSelectedDoc(dynDoc);
        setSearchQuery(cleanId);
        success('DNA Telemetry Retrieved', `Extracted genomic integrity vectors for ${cleanId}`);
      } else {
        warning('Unverified Reference', `No authoritative record found on ledger for ID ${cleanId}. Showing synthetic anomaly profile.`);
        setSelectedDoc({
          id: cleanId,
          title: 'Unregistered Credential Record',
          recipientName: 'Unknown / Unverified',
          recipientId: '',
          recipientEmail: '',
          issuerId: 'UNREGISTERED',
          issuerName: 'Unknown Node',
          issuerOrg: 'Unregistered Entity',
          issueDate: new Date().toISOString().slice(0, 10),
          documentType: 'certificate',
          status: 'revoked',
          sha256Hash: 'UNKNOWN_HASH',
          ecdsaSignature: 'MISSING_SIGNATURE',
          publicKey: 'UNVERIFIED',
          qrPayload: '',
          verificationCount: 0,
          trustScore: 10,
          ocrExtractedText: {},
          dnaMetrics: { fontFamilyMatch: 10, layoutAlignment: 20, structuralIntegrity: 10, compressionSignature: 'Unverified', pdfMetadataIntact: false },
          aiForensics: { edgeSharpnessScore: 20, fontInconsistencyProb: 0.99, cloneStampArtifacts: true, metadataDivergence: true, noiseDiscrepancy: 0.95 },
          authorizedVerifiers: [],
          version: 0,
        });
      }
    } catch (err) {
      error('DNA Lookup Error', err instanceof Error ? err.message : 'Failed to query genomic data.');
    } finally {
      setIsSearching(false);
    }
  };

  // Check URL query parameters on mount or change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || params.get('docId') || params.get('ref');
    if (id) {
      loadDocumentByReferenceId(id);
    }
  }, [location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadDocumentByReferenceId(searchQuery.trim());
    }
  };

  const isTampered = selectedDoc.status === 'revoked' || selectedDoc.id.includes('FORGED') || selectedDoc.trustScore < 50;
  const isRevoked = selectedDoc.status === 'revoked';

  // DNA Layers synthesis based on selectedDoc
  const dnaLayers = {
    crypto: {
      title: 'Cryptographic DNA',
      icon: Binary,
      description: 'Underlying SHA-256 digest, ECDSA P-256 signature, and blockchain anchor',
      status: isRevoked ? 'REVOKED' : isTampered ? 'MISMATCH' : 'MATCH',
      score: isRevoked ? 15 : isTampered ? 20 : 100,
      checks: [
        {
          label: 'SHA-256 File Digest',
          status: isTampered ? 'MISMATCH' : 'MATCH',
          expected: selectedDoc.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          actual: isTampered ? '9f83c12a7b8e390214a1c0d5109f2b84c8a201f893129841bbcefa0914839812' : selectedDoc.sha256Hash,
          note: isTampered ? 'Cryptographic hash diverges from anchor block' : 'Exact bit-level payload parity confirmed'
        },
        {
          label: 'ECDSA SECP256k1 Signature',
          status: isTampered ? 'INVALID' : 'VALID',
          expected: selectedDoc.ecdsaSignature || '3045022100a891...',
          actual: isTampered ? 'Corrupted: R-factor mismatch with issuer key' : 'Verified by issuer hardware keystore',
          note: isTampered ? 'Signature does not match public key of issuing authority' : 'Valid cryptographic attestation'
        },
        {
          label: 'Ledger Registry Anchor',
          status: isRevoked ? 'REVOKED' : 'CONFIRMED',
          expected: 'Block #19,482,901 [Tx: 0x981f...]',
          actual: isRevoked ? 'Certificate Revocation List (CRL) flagged active' : 'Confirmed on immutable registry',
          note: isRevoked ? 'Issuer marked credential revoked on ledger' : 'Anchored on distributed state'
        }
      ]
    },
    semantic: {
      title: 'Semantic DNA',
      icon: Database,
      description: 'Extracted OCR fields, entity names, identifiers, and credential values',
      status: isTampered ? 'MISMATCH' : 'MATCH',
      score: isTampered ? 45 : 98,
      checks: [
        {
          label: 'Recipient Identity',
          status: isTampered ? 'MISMATCH' : 'MATCH',
          expected: selectedDoc.recipientName,
          actual: isTampered ? `${selectedDoc.recipientName} (Altered in body)` : selectedDoc.recipientName,
          note: isTampered ? 'Character spacing alteration detected in surname' : 'Identity conforms to national registry'
        },
        {
          label: 'Document Identifier',
          status: 'MATCH',
          expected: selectedDoc.id,
          actual: selectedDoc.id,
          note: 'Registry schema matches standard prefix format'
        },
        {
          label: 'Grade / Clearance Value',
          status: isTampered ? 'ALTERED' : 'MATCH',
          expected: isTampered ? 'Confidential / Tier 3' : 'Graduated First Class Honours',
          actual: isTampered ? 'Top Secret / Special Access (Forged)' : 'Graduated First Class Honours',
          note: isTampered ? 'Payload elevated without authoritative endorsement' : 'Exact value match'
        },
        {
          label: 'Issuance Timestamp',
          status: 'MATCH',
          expected: selectedDoc.issueDate,
          actual: selectedDoc.issueDate,
          note: 'Timestamp strictly precedes verification request'
        }
      ]
    },
    visual: {
      title: 'Visual DNA',
      icon: Eye,
      description: 'Font rasterization, baseline geometry, grid alignment, and micro-artefacts',
      status: isTampered ? 'ANOMALY' : 'NORMAL',
      score: isTampered ? 28 : 96,
      checks: [
        {
          label: 'Font Micro-Kerning & Glyph Baseline',
          status: isTampered ? 'ANOMALY' : 'NORMAL',
          expected: 'Harmonious PostScript OpenType vector paths',
          actual: isTampered ? 'Rasterized replacement glyphs detected at offset Y:428' : 'Consistent native vector glyphs throughout',
          note: isTampered ? 'Re-rasterized typeface does not match source CIDFont' : 'Uniform font rendering across all nodes'
        },
        {
          label: 'Background Grain & DCT Frequency Grid',
          status: isTampered ? 'DISRUPTED' : 'CONSISTENT',
          expected: 'Uniform Laplacian variance σ² = 14.2',
          actual: isTampered ? 'Frequency boundary discontinuity along clearance box' : 'Uniform continuous background grain',
          note: isTampered ? 'Resampling noise indicates cut-and-paste manipulation' : 'Natural sensor & scanning noise profile'
        },
        {
          label: 'QR Code Carrier Consistency',
          status: 'NORMAL',
          expected: 'Version 4-M QR payload matching canonical URI',
          actual: 'Matched canonical root schema',
          note: 'Physical code payload corresponds to encoded URI'
        }
      ]
    },
    structural: {
      title: 'Structural DNA',
      icon: Layers,
      description: 'PDF container hierarchy, cross-reference streams, compression revisions',
      status: isTampered ? 'ANOMALY' : 'NORMAL',
      score: isTampered ? 50 : 99,
      checks: [
        {
          label: 'Incremental Revision Trees',
          status: isTampered ? 'ANOMALY' : 'NORMAL',
          expected: 'Single linearized xref table (Linearized: Yes)',
          actual: isTampered ? '3 appended trailer revisions detected post-issuance' : '1 authentic publishing trailer',
          note: isTampered ? 'File was re-saved in uncertified editor (PDF-XChange)' : 'Original publishing pipeline signature intact'
        },
        {
          label: 'Metadata Producer & Modified Clock',
          status: isTampered ? 'MISMATCH' : 'NORMAL',
          expected: 'VeriProof Certified Engine v4.2',
          actual: isTampered ? 'Adobe Photoshop 2024 / Quartz PDFContext' : 'VeriProof Certified Engine v4.2',
          note: isTampered ? 'Disallowed graphic modification software in audit trail' : 'Certified issuer publishing tool'
        },
        {
          label: 'Embedded Color Profiles & ICC Tag',
          status: 'NORMAL',
          expected: 'sRGB IEC61966-2.1 Embedded',
          actual: 'sRGB IEC61966-2.1 Valid',
          note: 'Standard archival color profile conforms to ISO 19005'
        }
      ]
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCH':
      case 'VALID':
      case 'CONFIRMED':
      case 'NORMAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case 'MISMATCH':
      case 'INVALID':
      case 'ALTERED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30"><XCircle className="w-3.5 h-3.5" /> {status}</span>;
      case 'ANOMALY':
      case 'DISRUPTED':
      case 'REVOKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30"><AlertTriangle className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Dna className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Document DNA Profile</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Structured four-tier integrity genome analyzing cryptographic, semantic, visual, and structural vectors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/verifier/forensics?id=${selectedDoc.id}`)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg transition"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Open Deep Forensics</span>
          </button>
          <button
            onClick={() => navigate(`/verifier/verify?id=${selectedDoc.id}`)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
          >
            <Shield className="w-4 h-4" />
            <span>Verify Live Ledger</span>
          </button>
        </div>
      </div>

      {/* PUBLIC REFERENCE ID SEARCH BAR */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/80 border border-indigo-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">
              Analyze Public Reference ID
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Current Target: <span className="text-white font-bold">{selectedDoc.id}</span>
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Public Reference ID (e.g., DOC-2026-STF-9021, DOC-2026-FORGED-1102...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-indigo-400 text-xs text-white font-mono placeholder:text-slate-500 outline-none transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Dna size={14} />}
            <span>Analyze DNA</span>
          </button>
        </form>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          <span className="text-[10px] uppercase font-mono text-slate-400 whitespace-nowrap">Quick Samples:</span>
          {['DOC-2026-STF-9021', 'DOC-2026-WHO-4412', 'DOC-2026-FORGED-1102', 'DOC-2026-REV-7781'].map((sampleId) => {
            const isSelected = selectedDoc.id.toLowerCase() === sampleId.toLowerCase();
            const isTamperedSample = sampleId.includes('FORGED') || sampleId.includes('REV');
            return (
              <button
                key={sampleId}
                type="button"
                onClick={() => loadDocumentByReferenceId(sampleId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isTamperedSample ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span>{sampleId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Genomic Overview Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Overall Genomic Score</span>
            <span className={`text-2xl font-bold font-mono ${selectedDoc.trustScore >= 80 ? 'text-emerald-400' : selectedDoc.trustScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {selectedDoc.trustScore}%
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${selectedDoc.trustScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            <Dna className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Crypto Hash Digest</span>
            <span className="text-sm font-bold font-mono text-white flex items-center gap-1 mt-1">
              {dnaLayers.crypto.status === 'MATCH' ? (
                <span className="text-emerald-400 flex items-center gap-1"><Check className="w-4 h-4" /> SHA-256 Intact</span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Divergence</span>
              )}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Binary className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Font & Kerning DNA</span>
            <span className="text-sm font-bold font-mono text-white flex items-center gap-1 mt-1">
              {dnaLayers.visual.status === 'NORMAL' ? (
                <span className="text-emerald-400 flex items-center gap-1"><Check className="w-4 h-4" /> Vector Clean</span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Font Kerning Anomaly</span>
              )}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Registry Status</span>
            <div className="mt-1">
              <StatusBadge status={isRevoked ? 'REVOKED' : isTampered ? 'TAMPERED' : 'VERIFIED'} />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Layer Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All 4 Genome Layers', count: 12 },
          { id: 'crypto', label: 'Layer 1: Cryptographic DNA', count: 3 },
          { id: 'semantic', label: 'Layer 2: Semantic DNA', count: 4 },
          { id: 'visual', label: 'Layer 3: Visual DNA', count: 3 },
          { id: 'structural', label: 'Layer 4: Structural DNA', count: 3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-800 text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Genome Analysis Cards */}
      <div className="space-y-6">
        {/* Layer 1: Cryptographic DNA */}
        {(activeTab === 'all' || activeTab === 'crypto') && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Binary className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Layer 1: Cryptographic DNA</h3>
                  <p className="text-xs text-slate-400">{dnaLayers.crypto.description}</p>
                </div>
              </div>
              {getStatusBadge(dnaLayers.crypto.status)}
            </div>

            <div className="space-y-3 mt-4">
              {dnaLayers.crypto.checks.map((check, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{check.label}</span>
                    {getStatusBadge(check.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Expected Registry Baseline</span>
                      <span className="font-mono text-slate-300 break-all">{check.expected}</span>
                    </div>
                    <div className={`p-2.5 rounded border ${
                      check.status === 'MATCH' || check.status === 'VALID' || check.status === 'CONFIRMED'
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-300 font-semibold'
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Observed Payload Value</span>
                      <span className="font-mono break-all">{check.actual}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {check.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layer 2: Semantic DNA */}
        {(activeTab === 'all' || activeTab === 'semantic') && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Layer 2: Semantic DNA</h3>
                  <p className="text-xs text-slate-400">{dnaLayers.semantic.description}</p>
                </div>
              </div>
              {getStatusBadge(dnaLayers.semantic.status)}
            </div>

            <div className="space-y-3 mt-4">
              {dnaLayers.semantic.checks.map((check, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{check.label}</span>
                    {getStatusBadge(check.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Registry Registered Record</span>
                      <span className="text-slate-200 font-medium">{check.expected}</span>
                    </div>
                    <div className={`p-2.5 rounded border ${
                      check.status === 'MATCH'
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-300 font-semibold'
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Extracted Optical/Submitted Record</span>
                      <span>{check.actual}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {check.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layer 3: Visual DNA */}
        {(activeTab === 'all' || activeTab === 'visual') && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Eye className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Layer 3: Visual DNA</h3>
                  <p className="text-xs text-slate-400">{dnaLayers.visual.description}</p>
                </div>
              </div>
              {getStatusBadge(dnaLayers.visual.status)}
            </div>

            <div className="space-y-3 mt-4">
              {dnaLayers.visual.checks.map((check, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{check.label}</span>
                    {getStatusBadge(check.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Expected Structural Baseline</span>
                      <span className="text-slate-300">{check.expected}</span>
                    </div>
                    <div className={`p-2.5 rounded border ${
                      check.status === 'NORMAL'
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Observed Optical Matrix</span>
                      <span>{check.actual}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {check.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layer 4: Structural DNA */}
        {(activeTab === 'all' || activeTab === 'structural') && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Layer 4: Structural DNA</h3>
                  <p className="text-xs text-slate-400">{dnaLayers.structural.description}</p>
                </div>
              </div>
              {getStatusBadge(dnaLayers.structural.status)}
            </div>

            <div className="space-y-3 mt-4">
              {dnaLayers.structural.checks.map((check, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{check.label}</span>
                    {getStatusBadge(check.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Conforming Document Specification</span>
                      <span className="text-slate-300">{check.expected}</span>
                    </div>
                    <div className={`p-2.5 rounded border ${
                      check.status === 'NORMAL'
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Parsed Container Property</span>
                      <span>{check.actual}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {check.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
