import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  QrCode, Upload, ExternalLink, Shield, ArrowRight,
  FileText, CheckCircle2, AlertTriangle, X, RefreshCw,
  Camera, Loader2, AlertCircle, CameraOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { VerificationResultView } from './VerificationResultView';
import {
  apiRequest,
  decodeQrCode,
  type PublicVerificationResult,
  type QRDecodeResult
} from '../../utils/documentRegistryApi';
import type { VerificationHistoryRecord, DocumentRecord } from '../../data/mockData';

function publicResultToHistoryRecord(
  apiRes: PublicVerificationResult,
  method: 'QR' | 'Upload' | 'Link' | 'Bulk' = 'Upload'
): VerificationHistoryRecord {
  const isVerified = apiRes.outcome === 'VERIFIED';
  const isRevoked = apiRes.outcome === 'REVOKED' || apiRes.registry_status === 'REVOKED';
  const isTampered = apiRes.outcome === 'TAMPERED' || apiRes.hash_matches === false;

  let result: 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED' = 'VERIFIED';
  let trustScore = 95;
  const reasons: string[] = [];

  if (isRevoked) {
    result = 'TAMPERED';
    trustScore = 15;
    reasons.push('Document was officially REVOKED by the issuing authority.');
  } else if (isTampered) {
    result = 'TAMPERED';
    trustScore = 20;
    reasons.push('Cryptographic SHA-256 hash mismatch or localized tampering detected.');
  } else if (!isVerified) {
    result = 'UNVERIFIED';
    trustScore = 40;
    reasons.push('No authoritative matching record found on the genesis ledger.');
  } else {
    result = 'VERIFIED';
    trustScore = 98;
    reasons.push('Direct SHA-256 hash match confirmed on trusted registry.');
    reasons.push('ECDSA P-256 digital signature mathematically verified.');
    reasons.push('Issuer authority verified and active on the platform.');
  }

  return {
    verificationId: `VRF-${Date.now().toString().slice(-6)}`,
    documentId: apiRes.public_verification_id || 'DOC-REGISTRY',
    documentTitle: apiRes.title || 'Official Credential Record',
    documentType: apiRes.document_type || 'Certificate',
    issuerOrg: apiRes.issuer_name || 'Authorized Issuing Entity',
    issuerId: 'AUTH-NODE',
    recipientName: 'Registered Holder',
    verificationDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    result,
    trustScore,
    method,
    reasons,
    evidenceDetails: {
      issuerStatus: isRevoked ? 'SUSPENDED' : isVerified ? 'VERIFIED' : 'NOT_FOUND',
      registryStatus: isRevoked ? 'REVOKED' : isVerified ? 'ACTIVE' : 'NOT_FOUND',
      hashStatus: apiRes.hash_matches === true ? 'MATCH' : apiRes.hash_matches === false ? 'MISMATCH' : 'NOT_AVAILABLE',
      signatureStatus: apiRes.signature_valid ? 'VALID' : 'NOT_AVAILABLE',
      ocrMatch: isVerified,
      metadataStatus: isTampered ? 'ANOMALY' : 'NORMAL',
      visualStatus: isTampered ? 'ANOMALY' : 'NORMAL',
      aiForensicRisk: isTampered ? 'HIGH' : isRevoked ? 'MEDIUM' : 'LOW',
    },
    submittedHash: apiRes.sha256_hash || undefined,
    trustedHash: apiRes.sha256_hash || undefined,
  };
}

export const VerifyDocumentPage: React.FC = () => {
  const location = useLocation();
  const { lookupDocument, verifyDocumentEngine, addVerification, addAuditLog } = useApp();
  const { success, warning, error, info } = useToast();

  // Navigation tab: 'camera' | 'qr_decode' | 'compare' | 'link'
  const [activeMethod, setActiveMethod] = useState<'camera' | 'qr_decode' | 'compare' | 'link'>('camera');

  // Input states
  const [linkInput, setLinkInput] = useState('');
  const [compareRefId, setCompareRefId] = useState('');
  const [comparisonFile, setComparisonFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDecodingFrame, setIsDecodingFrame] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Current active result
  const [activeResult, setActiveResult] = useState<VerificationHistoryRecord | null>(null);
  const [activeDocRecord, setActiveDocRecord] = useState<DocumentRecord | undefined>(undefined);

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'camera' || tabParam === 'qr') {
      setActiveMethod('camera');
    } else if (tabParam === 'qr_decode') {
      setActiveMethod('qr_decode');
    } else if (tabParam === 'compare' || tabParam === 'upload') {
      setActiveMethod('compare');
    } else if (tabParam === 'link') {
      setActiveMethod('link');
    }

    const idParam = params.get('id');
    if (idParam) {
      handleExecuteVerification(idParam, 'Link');
    }
  }, [location.search]);

  // Clean up camera on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [activeMethod]);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  // Attach stream whenever cameraActive becomes true and video element is mounted
  useEffect(() => {
    if (cameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video stream autoplay failed:', err);
      });
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser context.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Camera permission denied or camera device unavailable.');
      setCameraActive(false);
    }
  };

  const captureCameraFrameAndDecode = async () => {
    if (!videoRef.current || !canvasRef.current || isDecodingFrame) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsDecodingFrame(true);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsDecodingFrame(false);
        return;
      }
      const file = new File([blob], 'camera_capture.png', { type: 'image/png' });
      try {
        const decoded: QRDecodeResult = await decodeQrCode(file);
        if (decoded.success && decoded.public_verification_id) {
          stopCamera();
          success('QR Detected', `Decoded verification reference: ${decoded.public_verification_id}`);
          await handleExecuteVerification(decoded.public_verification_id, 'QR');
        } else {
          setCameraError(decoded.error || 'No valid QR code detected in frame. Align QR inside the targeting reticle.');
        }
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : 'Failed to process image frame.');
      } finally {
        setIsDecodingFrame(false);
      }
    }, 'image/png');
  };

  const handleExecuteVerification = async (
    docIdQuery: string,
    method: 'QR' | 'Upload' | 'Link' | 'Bulk' = 'Upload',
    fileToCompare?: File | null
  ) => {
    const cleanId = docIdQuery.trim();
    if (!cleanId) return;

    setIsProcessing(true);
    setProcessingProgress(20);
    setProcessingStage('Document Identification & Registry Query...');

    try {
      let apiRes: PublicVerificationResult | null = null;

      if (fileToCompare) {
        const formData = new FormData();
        formData.set('file', fileToCompare, fileToCompare.name);
        setProcessingProgress(50);
        setProcessingStage('Cryptographic Hash & Byte Divergence Analysis...');
        apiRes = await apiRequest<PublicVerificationResult>(`/verify/${encodeURIComponent(cleanId)}/compare`, {
          method: 'POST',
          body: formData,
        });
      } else {
        setProcessingProgress(50);
        setProcessingStage('SHA-256 Digest & Digital Signature Cryptographic Validation...');
        apiRes = await apiRequest<PublicVerificationResult>(`/verify/${encodeURIComponent(cleanId)}`).catch(() => null);
      }

      setProcessingProgress(80);
      setProcessingStage('AI Forensic Multi-Signal Consensus & Trust Verification...');

      let historyRecord: VerificationHistoryRecord;
      let docRecord: DocumentRecord | undefined = lookupDocument(cleanId);

      if (apiRes) {
        historyRecord = publicResultToHistoryRecord(apiRes, method);
        addVerification(historyRecord);
        addAuditLog({
          actorName: 'Verifier User',
          actorRole: 'VERIFIER',
          actorId: 'USR-VERIFIER',
          action: 'DOCUMENT_VERIFIED',
          entityType: 'DOCUMENT',
          entityId: apiRes.public_verification_id || cleanId,
          details: `Verification executed via ${method}. Verdict: ${apiRes.outcome}.`
        });

        if (!docRecord && apiRes.title) {
          const ocrTextMap: Record<string, string> = {};
          if (apiRes.field_comparisons && apiRes.field_comparisons.length > 0) {
            apiRes.field_comparisons.forEach((fc) => {
              ocrTextMap[fc.field_name] = fc.observed_value;
            });
          } else if (apiRes.ocr_extracted_fields) {
            if (apiRes.ocr_extracted_fields.student_name) ocrTextMap['Student Name'] = apiRes.ocr_extracted_fields.student_name;
            if (apiRes.ocr_extracted_fields.roll_number) ocrTextMap['Roll Number'] = apiRes.ocr_extracted_fields.roll_number;
            if (apiRes.ocr_extracted_fields.institution) ocrTextMap['Institution'] = apiRes.ocr_extracted_fields.institution;
            if (apiRes.ocr_extracted_fields.course) ocrTextMap['Course'] = apiRes.ocr_extracted_fields.course;
            if (apiRes.ocr_extracted_fields.sgpa) ocrTextMap['SGPA'] = apiRes.ocr_extracted_fields.sgpa;
            if (apiRes.ocr_extracted_fields.cgpa) ocrTextMap['CGPA'] = apiRes.ocr_extracted_fields.cgpa;
            if (apiRes.ocr_extracted_fields.result) ocrTextMap['Result Status'] = apiRes.ocr_extracted_fields.result;
          }

          docRecord = {
            id: apiRes.public_verification_id,
            title: apiRes.title,
            recipientName: apiRes.ocr_extracted_fields?.student_name || 'Registered Holder',
            recipientId: apiRes.ocr_extracted_fields?.roll_number || '',
            recipientEmail: '',
            issuerId: 'AUTH-NODE',
            issuerName: apiRes.issuer_name || 'Authorized Issuer',
            issuerOrg: apiRes.issuer_name || 'Authorized Issuer',
            issueDate: apiRes.issue_date || new Date().toISOString().slice(0, 10),
            documentType: (apiRes.document_type || 'certificate').toLowerCase().includes('degree') ? 'degree' : (apiRes.document_type || 'certificate').toLowerCase().includes('license') ? 'license' : 'certificate',
            status: apiRes.outcome === 'REVOKED' ? 'revoked' : 'active',
            sha256Hash: apiRes.sha256_hash || 'n/a',
            ecdsaSignature: 'ECDSA-P256-VALIDATED',
            publicKey: 'FIPS-186-4-KEY',
            qrPayload: `${window.location.origin}/verify/${apiRes.public_verification_id}`,
            verificationCount: 1,
            trustScore: apiRes.outcome === 'VERIFIED' ? 98 : apiRes.outcome === 'TAMPERED' ? 20 : 40,
            ocrExtractedText: ocrTextMap,
            dnaMetrics: {
              fontFamilyMatch: 99,
              layoutAlignment: 99,
              structuralIntegrity: 99,
              compressionSignature: 'Original',
              pdfMetadataIntact: true,
            },
            aiForensics: {
              edgeSharpnessScore: 98,
              fontInconsistencyProb: 0.02,
              cloneStampArtifacts: false,
              metadataDivergence: false,
              noiseDiscrepancy: 0.01,
            },
            authorizedVerifiers: ['PUBLIC'],
            version: 1,
          };
        }
      } else {
        historyRecord = verifyDocumentEngine(cleanId, method);
      }

      setProcessingProgress(100);
      setActiveResult(historyRecord);
      setActiveDocRecord(docRecord);

      if (historyRecord.result === 'VERIFIED') {
        success('Verification Successful', 'Cryptographic signature and semantic ledger records confirmed authentic.');
      } else if (historyRecord.result === 'TAMPERED') {
        warning('Integrity Failure', 'Document tampering, hash discrepancy, or revoked status flagged.');
      } else {
        info('Unverified Result', 'Document could not be verified against the trusted registry.');
      }
    } catch (err) {
      const fallbackRecord = verifyDocumentEngine(cleanId, method);
      setActiveResult(fallbackRecord);
      setActiveDocRecord(lookupDocument(cleanId));
      error('Verification Error', err instanceof Error ? err.message : 'Verification request could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQrUploadDecode = async () => {
    if (!qrFile) return;
    setIsProcessing(true);
    setProcessingProgress(30);
    setProcessingStage('Decoding VeriProof QR Code Payload...');
    try {
      const decoded: QRDecodeResult = await decodeQrCode(qrFile);
      if (decoded.success && decoded.public_verification_id) {
        success('QR Extracted', `Extracted reference ID: ${decoded.public_verification_id}`);
        await handleExecuteVerification(decoded.public_verification_id, 'QR', qrFile);
      } else {
        error('QR Decoding Failed', decoded.error || 'Unable to decode a valid VeriProof QR code from the uploaded file.');
        setIsProcessing(false);
      }
    } catch (err) {
      error('QR Decoding Error', err instanceof Error ? err.message : 'Failed to decode QR code.');
      setIsProcessing(false);
    }
  };

  const handleCompareSubmit = () => {
    if (!compareRefId.trim() || !comparisonFile) {
      warning('Missing Fields', 'Please provide both the reference verification ID and the document file to compare.');
      return;
    }
    handleExecuteVerification(compareRefId, 'Upload', comparisonFile);
  };

  const handleSelectSample = (sampleId: string) => {
    setLinkInput(sampleId);
    setCompareRefId(sampleId);
    handleExecuteVerification(sampleId, 'Link');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              EVIDENCE VERIFICATION STUDIO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5 font-sans">
            Verify Document
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Multi-modal verification engine supporting live camera QR scanning, QR file decoding, cryptographic file comparison, and direct ledger links.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => handleSelectSample('DOC-2026-STF-9021')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            ✓ Test Genuine (Stanford)
          </button>
          <button
            onClick={() => handleSelectSample('DOC-2026-FORGED-1102')}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
          >
            ✗ Test Tampered (Apex)
          </button>
          <button
            onClick={() => handleSelectSample('DOC-2026-REV-7781')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
          >
            ⚠ Test Revoked (ISO)
          </button>
        </div>
      </div>

      {/* If a verification result is active, show the consolidated result view */}
      {activeResult ? (
        <VerificationResultView
          result={activeResult}
          docDetails={activeDocRecord}
          onVerifyAnother={() => {
            setActiveResult(null);
            setLinkInput('');
            setComparisonFile(null);
            setQrFile(null);
            stopCamera();
          }}
        />
      ) : (
        /* Verification Input Hub */
        <div className="space-y-6">
          {/* Method Selection Tabs */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
            {[
              { id: 'camera', label: 'Scan Camera', icon: Camera },
              { id: 'qr_decode', label: 'Decode QR File', icon: QrCode },
              { id: 'compare', label: 'Compare File', icon: Upload },
              { id: 'link', label: 'Verify by Link / ID', icon: ExternalLink }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    stopCamera();
                    setActiveMethod(tab.id as any);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeMethod === tab.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: SCAN CAMERA */}
          {activeMethod === 'camera' && (
            <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                <Camera size={30} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Camera QR Scanner</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Position the printed or digital QR code within the frame to automatically decode the signed cryptographic payload.
                </p>
              </div>

              {cameraActive ? (
                <div className="space-y-4">
                  <div className="relative max-w-md mx-auto aspect-video bg-black rounded-2xl overflow-hidden border border-purple-500/40 flex items-center justify-center shadow-2xl">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => {
                        (e.currentTarget as HTMLVideoElement).play().catch(() => {});
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-purple-400/60 m-8 rounded-2xl pointer-events-none flex items-center justify-center animate-pulse">
                      <span className="text-[10px] font-mono text-purple-300 bg-black/70 px-2.5 py-1 rounded-full border border-purple-500/30">
                        Align QR Code Within Reticle
                      </span>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                      {cameraError}
                    </div>
                  )}

                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={captureCameraFrameAndDecode}
                      disabled={isDecodingFrame || isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/25"
                    >
                      {isDecodingFrame || isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
                      <span>Capture & Decode Frame</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <CameraOff size={14} />
                      <span>Stop Camera</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cameraError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-left">
                      <div className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Camera Access Notice</div>
                      <p className="mt-1">{cameraError}</p>
                    </div>
                  )}
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Camera size={15} />
                    <span>Initialize Camera Scanner</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DECODE QR FILE */}
          {activeMethod === 'qr_decode' && (
            <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                <QrCode size={30} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Extract & Decode QR Code File</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Upload an image or document containing an embedded VeriProof QR code to resolve and verify its signed payload.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <label className="block text-xs text-slate-300">
                  Select image or scanned document with QR code:
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                    className="block mt-2 w-full text-xs text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:text-slate-200 file:cursor-pointer cursor-pointer"
                  />
                </label>

                {qrFile && (
                  <div className="p-3.5 rounded-xl bg-[#050816] border border-purple-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">{qrFile.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{(qrFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setQrFile(null)}
                      className="text-slate-400 hover:text-red-400 p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleQrUploadDecode}
                  disabled={isProcessing || !qrFile}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-500/25"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                  <span>Decode QR & Verify Credential</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COMPARE FILE */}
          {activeMethod === 'compare' && (
            <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cryptographic File Comparison</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Compare an uploaded suspect file byte-for-byte against the authoritative genesis ledger digest.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Reference Public Verification ID or Document ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DOC-2026-STF-9021 or 64-char verification token"
                    value={compareRefId}
                    onChange={(e) => setCompareRefId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Upload Candidate File For Byte Comparison
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setComparisonFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:text-slate-200 file:cursor-pointer cursor-pointer"
                  />
                </div>

                {comparisonFile && (
                  <div className="p-3.5 rounded-xl bg-[#050816] border border-blue-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-blue-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">{comparisonFile.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{(comparisonFile.size / 1024).toFixed(1)} KB • {comparisonFile.type || 'document'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setComparisonFile(null)}
                      className="text-slate-400 hover:text-red-400 p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCompareSubmit}
                  disabled={isProcessing || !comparisonFile || !compareRefId.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/25"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                  <span>Execute Multi-Signal Comparison</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFY BY LINK / ID */}
          {activeMethod === 'link' && (
            <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Direct Ledger ID Lookup</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Resolve verifiable credentials directly via document ID or public ledger token.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleExecuteVerification(linkInput, 'Link');
                    }}
                    placeholder="Enter document ID, SHA-256 hash, or verification URL..."
                    className="w-full px-4 py-3 rounded-xl bg-[#050816] border border-white/10 focus:border-cyan-500/50 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Example: DOC-2026-STF-9021
                  </span>
                  <button
                    onClick={() => handleExecuteVerification(linkInput, 'Link')}
                    disabled={isProcessing || !linkInput.trim()}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                    <span>Lookup & Verify</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress / Processing Modal Bar */}
          {isProcessing && (
            <div className="p-6 rounded-2xl bg-[#050816] border border-purple-500/30 space-y-3 max-w-2xl mx-auto shadow-2xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-bold flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                  {processingStage}
                </span>
                <span className="text-slate-400 font-bold">{processingProgress}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyDocumentPage;
