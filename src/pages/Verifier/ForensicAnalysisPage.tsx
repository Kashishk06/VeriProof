import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, Shield, AlertTriangle, CheckCircle2, XCircle, Search,
  ArrowRight, FileText, Lock, Eye, Layers, Binary, Database,
  Cpu, ZoomIn, ZoomOut, RefreshCw, Maximize2, AlertOctagon, Info,
  Sliders, Compass, Loader2, Hash, Key, Check, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { apiRequest, type PublicVerificationResult } from '../../utils/documentRegistryApi';
import type { DocumentRecord } from '../../data/mockData';

export const ForensicAnalysisPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documents, lookupDocument } = useApp();
  const { info, success, warning, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord>(
    documents[1] || documents[0] || {
      id: 'DOC-2026-FORGED-1102',
      title: 'Defense Clearance (Tampered)',
      recipientName: 'Viktor Kaelen',
      recipientId: 'APX-SEC-2026-1102',
      recipientEmail: 'viktor.kaelen@apexcorp.com',
      issuerId: 'AUTH-NODE-02',
      issuerName: 'Apex Security Clearance Board',
      issuerOrg: 'Apex Corp Security Node',
      issueDate: '2026-03-12',
      documentType: 'license',
      status: 'active',
      sha256Hash: '9f83c12a7b8e390214a1c0d5109f2b84c8a201f893129841bbcefa0914839812',
      ecdsaSignature: '30450221008819ab23...',
      publicKey: '04c1d2e3f4a5b6c7...',
      qrPayload: 'https://veriproof.io/verify/DOC-2026-FORGED-1102',
      verificationCount: 88,
      trustScore: 20,
      ocrExtractedText: { clearance: 'Top Secret / Special Access', role: 'Security Operative' },
      dnaMetrics: { fontFamilyMatch: 48, layoutAlignment: 55, structuralIntegrity: 45, compressionSignature: 'Adobe Photoshop 2024 / Re-saved', pdfMetadataIntact: false },
      aiForensics: { edgeSharpnessScore: 45, fontInconsistencyProb: 0.94, cloneStampArtifacts: true, metadataDivergence: true, noiseDiscrepancy: 0.82 },
      authorizedVerifiers: ['PUBLIC'],
      version: 1,
    }
  );
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'all' | 'tamper' | 'ai' | 'ela' | 'fonts'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);

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
        setSelectedZone(null);
        info('Forensic File Loaded', `Loaded forensic telemetry for ${localMatch.id}`);
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
        setSelectedZone(null);
        success('Forensics Retrieved', `Extracted forensic anomalies and optical vectors for ${cleanId}`);
      } else {
        warning('Unverified Reference', `No authoritative record found on ledger for ID ${cleanId}. Showing anomaly profile.`);
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
      error('Forensic Lookup Error', err instanceof Error ? err.message : 'Failed to query forensic data.');
    } finally {
      setIsSearching(false);
    }
  };

  // Parse URL query parameter on mount or change
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

  // Dynamic Forensic Tamper Zones based on selected document
  const tamperZones = isTampered
    ? [
        {
          id: 'TZ-01',
          label: 'Clearance Grade / Body Field',
          type: 'TEXT_MODIFICATION',
          confidence: '99.4%',
          coords: { top: '38%', left: '42%', width: '32%', height: '12%' },
          trustedValue: 'Official Authorization (Restricted)',
          observedValue: 'Top Secret / Special Access (Altered)',
          reason: 'High-frequency JPEG compression disparity along bounding box (ELA residual σ=4.8 vs bg σ=1.2). PostScript font vector replacement detected.',
          risk: 'CRITICAL'
        },
        {
          id: 'TZ-02',
          label: 'Institutional Watermark Seal',
          type: 'CLONE_STAMP_DETECTION',
          confidence: '96.1%',
          coords: { top: '65%', left: '68%', width: '22%', height: '22%' },
          trustedValue: 'Official Cryptographic Hologram #8819',
          observedValue: 'Digital composite pasted from uncertified asset',
          reason: 'Alpha blending edge feathering artifacts detected. Pixel luminescence gradient does not match incident angle of background scan.',
          risk: 'HIGH'
        },
        {
          id: 'TZ-03',
          label: 'Authorizing Signature Node',
          type: 'SIGNATURE_DISCONTINUITY',
          confidence: '91.8%',
          coords: { top: '80%', left: '15%', width: '32%', height: '14%' },
          trustedValue: 'ECDSA Hardened Signature 0x7a8f...',
          observedValue: 'Bitmapped raster copy (200 DPI on 600 DPI sheet)',
          reason: 'Severe resolution mismatch between signature bitmap layer and underlying security guilloche pattern.',
          risk: 'HIGH'
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Forensic Lab & Tamper Localization</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deep forensic investigation engine: Cryptographic, ELA (Error Level Analysis), font kerning, and AI-assisted tamper localization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/verifier/dna?id=${selectedDoc.id}`)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg transition"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>View Document DNA</span>
          </button>
          <button
            onClick={() => navigate(`/verifier/verify?id=${selectedDoc.id}`)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition"
          >
            <Shield className="w-4 h-4" />
            <span>Verify Live Ledger</span>
          </button>
        </div>
      </div>

      {/* PUBLIC REFERENCE ID SEARCH BAR */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900/80 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
              Run Forensic Scan on Public Reference ID
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active Forensic Target: <span className="text-white font-bold">{selectedDoc.id}</span>
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Public Reference ID (e.g., DOC-2026-FORGED-1102, DOC-2026-STF-9021...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-purple-400 text-xs text-white font-mono placeholder:text-slate-500 outline-none transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Run Forensic Scan</span>
          </button>
        </form>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          <span className="text-[10px] uppercase font-mono text-slate-400 whitespace-nowrap">Quick Samples:</span>
          {['DOC-2026-FORGED-1102', 'DOC-2026-STF-9021', 'DOC-2026-REV-7781', 'DOC-2026-WHO-4412'].map((sampleId) => {
            const isSelected = selectedDoc.id.toLowerCase() === sampleId.toLowerCase();
            const isTamperedSample = sampleId.includes('FORGED') || sampleId.includes('REV');
            return (
              <button
                key={sampleId}
                type="button"
                onClick={() => loadDocumentByReferenceId(sampleId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400 font-bold'
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

      {/* Control Strip */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Integrity Status:
          </span>
          <StatusBadge status={selectedDoc.status === 'revoked' ? 'REVOKED' : isTampered ? 'TAMPERED' : 'VERIFIED'} />
          <span className={`text-xs font-mono font-bold ${selectedDoc.trustScore >= 80 ? 'text-emerald-400' : selectedDoc.trustScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
            Trust Score: {selectedDoc.trustScore}/100
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Tamper Boxes:</span>
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-3 py-1 text-xs rounded-lg border font-medium transition ${
              showBoundingBoxes
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showBoundingBoxes ? 'Visible' : 'Hidden'}
          </button>
        </div>
      </div>

      {/* Primary 2-Column Forensic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Tamper Canvas & Inspection Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Tamper Localization Canvas
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1"
                  title="Reset Zoom"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Optical Surface Container */}
            <div className="relative w-full aspect-[4/5] bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden flex items-center justify-center p-4">
              <div
                className="relative w-full h-full max-w-md bg-slate-900/90 rounded-lg border border-slate-700/60 shadow-2xl p-6 transition-transform duration-200 flex flex-col justify-between"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                {/* Guilloche / Micro-print simulated watermark background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:12px_12px]" />

                {/* Simulated Certificate Content */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{selectedDoc.issuerOrg}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{selectedDoc.id}</span>
                  </div>

                  <div className="text-center my-4">
                    <span className="text-[10px] tracking-widest text-slate-400 uppercase block">Official Certificate of Verification</span>
                    <h4 className="text-base font-bold text-white mt-1">{selectedDoc.recipientName}</h4>
                    <p className="text-xs text-slate-400 mt-1">{selectedDoc.documentType} — Official Authority Registry</p>
                  </div>

                  {/* Body Field Container */}
                  <div className="p-3 my-3 rounded bg-slate-950/60 border border-slate-800 text-left">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Status / Classification:</span>
                      <span className="font-mono text-white">Tier-1 Validated</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Credential Value:</span>
                      <span className={`font-mono font-bold ${isTampered ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isTampered ? 'TOP SECRET / SPECIAL ACCESS (FORGED)' : 'OFFICIAL CLEARANCE TIER-1'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Authorized Officer:</span>
                      <span className="font-mono text-slate-300">Registrar / Auth Node</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Signature & Stamp Area */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <div className="text-left">
                    <div className="w-24 h-6 border-b border-slate-600 mb-1 flex items-end">
                      <span className="text-[9px] text-slate-400 italic">Electronic Sign</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">SECP256K1 AUTH</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-dashed border-purple-500/40 flex items-center justify-center text-[9px] font-mono text-purple-300">
                    SEAL
                  </div>
                </div>

                {/* OVERLAID BOUNDING BOXES FOR TAMPER ZONES */}
                {showBoundingBoxes && tamperZones.map((zone) => {
                  const isZoneActive = selectedZone?.id === zone.id;
                  return (
                    <div
                      key={zone.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedZone(zone);
                      }}
                      className={`absolute cursor-pointer transition-all rounded border-2 ${
                        isZoneActive
                          ? 'border-rose-400 bg-rose-500/30 shadow-lg shadow-rose-500/40 animate-pulse ring-2 ring-rose-400'
                          : 'border-rose-500/80 bg-rose-500/10 hover:bg-rose-500/20'
                      }`}
                      style={{
                        top: zone.coords.top,
                        left: zone.coords.left,
                        width: zone.coords.width,
                        height: zone.coords.height
                      }}
                      title={`${zone.label} (${zone.confidence})`}
                    >
                      <span className="absolute -top-4 -left-1 px-1 py-0.2 rounded bg-rose-600 text-white font-mono text-[9px] font-bold">
                        {zone.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canvas Bottom Sub-bar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isTampered ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <span>{isTampered ? `${tamperZones.length} Anomaly Zones Flagged` : '0 Anomalies Detected'}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">600 DPI Optical Inspection Matrix</span>
            </div>
          </div>
        </div>

        {/* Right Column: Forensic Breakdown & Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Tamper Zone Deep-Dive */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Zone Anomaly Deep-Dive</h3>
              </div>
              {selectedZone && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {selectedZone.id}
                </span>
              )}
            </div>

            {selectedZone ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Zone Label:</span>
                  <p className="font-bold text-white text-sm mt-0.5">{selectedZone.label}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Anomaly Type:</span>
                    <span className="font-mono text-rose-300 font-bold">{selectedZone.type}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Confidence:</span>
                    <span className="font-mono text-amber-300 font-bold">{selectedZone.confidence}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Expected Genesis State:</span>
                    <span className="text-slate-300 font-mono text-[11px]">{selectedZone.trustedValue}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-rose-400 block">Observed Modified State:</span>
                    <span className="text-rose-300 font-mono text-[11px] font-semibold">{selectedZone.observedValue}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-bold text-rose-300 block mb-1">Forensic Signal Rationale:</span>
                  {selectedZone.reason}
                </div>
              </div>
            ) : isTampered ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-400">Click any highlighted red bounding box on the document canvas to inspect detailed forensic telemetry.</p>
                <div className="flex justify-center gap-2 pt-2">
                  {tamperZones.map(z => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZone(z)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-purple-300 border border-slate-700"
                    >
                      {z.id}: {z.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-slate-300">Clean Optical Forensics</p>
                <p>No localized font kerning, ELA residual, or clone stamp tampering detected.</p>
              </div>
            )}
          </div>

          {/* AI Forensics Multi-Signal Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Multi-Signal Forensic Vectors</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Error Level Analysis (ELA Residual):</span>
                <span className={`font-mono font-bold ${isTampered ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isTampered ? 'σ=4.82 (DISPARITY)' : 'σ=0.12 (UNIFORM)'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Font Inconsistency Probability:</span>
                <span className={`font-mono font-bold ${isTampered ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isTampered ? '94.2% (HIGH)' : '1.8% (CLEAN)'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Clone Stamp / Resampling Artifacts:</span>
                <span className={`font-mono font-bold ${isTampered ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isTampered ? 'DETECTED' : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">PDF Metadata Divergence:</span>
                <span className={`font-mono font-bold ${isTampered ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isTampered ? 'RE-SAVED POST-ISSUANCE' : 'AUTHENTIC ENGINE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Laplacian Noise Consistency:</span>
                <span className={`font-mono font-bold ${isTampered ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isTampered ? '0.82 (BOUNDARY DISRUPTED)' : '0.01 (HOMOGENEOUS)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
